/**
 * Created by AI
 * 
 * n8n-nodes-extract-pdf
 * Node để trích xuất văn bản, hình ảnh và bảng từ PDF
 * Hỗ trợ OCR cho PDF dạng ảnh hoặc quét
 * Hỗ trợ tính năng xử lý đa ngôn ngữ với phát hiện và phân tích ngôn ngữ tự động
 * 
 * @author AI Assistant
 * @version 1.0.18
 * @license MIT
 */

// Imports
import type { 
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
    IExecuteFunctions,
    INodeProperties
} from 'n8n-workflow';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// Chuyển sang cách import CommonJS để tránh lỗi esModuleInterop
const natural = require('natural');
const sharp = require('sharp');
import * as stream from 'stream';
import { promisify } from 'util';
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');

// Import các module mới
import { 
    detectLanguage, 
    generateLanguageStats 
} from './modules/languageDetection';
import { 
    enhanceImage,
    extractImagesFromPdf 
} from './modules/imageExtraction';
import { 
    extractTablesFromPdf 
} from './modules/tableExtraction';
import { 
    performOcrOnPdf 
} from './modules/ocrProcessing';

const pipeline = promisify(stream.pipeline);

// Định nghĩa interface
interface NodeApiError extends Error {
    node: string;
    message: string;
    description?: string;
}

interface DocumentClassification {
    documentType: string;
    confidence: number;
    detectedFields: { [key: string]: string };
}

interface PDFOptions {
    pageRange?: string;
    includeMetadata?: boolean;
    maxFileSize?: number;
    chunkSize?: number;
    showProgress?: boolean;
    extractImages?: boolean;
    performOcr?: boolean;
    ocrLanguage?: string;
    autoDetectLanguage?: boolean;
    multipleLanguages?: boolean;
    additionalLanguages?: string[];
    extractTables?: boolean;
    enhanceOcrResults?: boolean;
    spellCheckLanguage?: string;
    detectDocumentType?: boolean;
    extractFormFields?: boolean;
}

interface ProcessingResult {
    text: string;
    metadata: Record<string, unknown>;
    performance: {
        startTime: number;
        endTime: number;
        pagesProcessed: number;
        processingTime?: number;
    };
    [key: string]: unknown; // Thêm index signature để tuân thủ Record<string, unknown>
}

class ExtractPdfNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Extract PDF',
        name: 'extractPdf',
        group: ['transform'],
        version: 1,
        description: 'Extracts text and data from PDF files',
        defaults: {
            name: 'Extract PDF'
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'Input Type',
                name: 'inputType',
                type: 'options',
                options: [
                    {
                        name: 'File Path',
                        value: 'filePath',
                        description: 'Use a file path on the server',
                    },
                    {
                        name: 'Binary Data',
                        value: 'binaryData',
                        description: 'Use binary data from previous node',
                    }
                ],
                default: 'filePath',
                description: 'Source of the PDF file to process',
            },
            {
                displayName: 'PDF File Path',
                name: 'pdfFile',
                type: 'string',
                default: '',
                placeholder: '/path/to/document.pdf',
                description: 'The absolute or relative path to the PDF file on the server',
                displayOptions: {
                    show: {
                        inputType: ['filePath']
                    }
                }
            },
            {
                displayName: 'Binary Property',
                name: 'binaryPropertyName',
                type: 'string',
                default: 'data',
                placeholder: 'data',
                description: 'Name of the binary property containing the PDF data from a previous node',
                displayOptions: {
                    show: {
                        inputType: ['binaryData']
                    }
                }
            },
            {
                displayName: 'PDF Processing Options',
                name: 'optionsSection',
                type: 'notice',
                default: '',
                description: 'Configure how the PDF should be processed'
            },
            {
                displayName: 'Extraction Features',
                name: 'extractionFeatures',
                type: 'multiOptions',
                options: [
                    {
                        name: 'Extract Text',
                        value: 'extractText',
                        description: 'Extract text content from PDF (enabled by default)',
                    },
                    {
                        name: 'Extract Images',
                        value: 'extractImages',
                        description: 'Extract images embedded in the PDF',
                    },
                    {
                        name: 'Perform OCR',
                        value: 'performOcr',
                        description: 'Extract text from scanned PDFs using OCR',
                    },
                    {
                        name: 'Extract Tables',
                        value: 'extractTables',
                        description: 'Extract tables from the PDF',
                    }
                ],
                default: ['extractText'],
                description: 'The features to use for PDF extraction',
            }
        ] as INodeProperties[]
    };
    
    // Function to parse page ranges
    parsePageRange(pageRange: string): number[] {
        if (!pageRange || pageRange.trim() === '') {
            return [];
        }
        
        const result: number[] = [];
        const parts = pageRange.split(',').map(p => p.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                const [startStr, endStr] = part.split('-').map(p => p.trim());
                const start = parseInt(startStr, 10);
                const end = parseInt(endStr, 10);
                
                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Invalid page range: "${part}"`);
                }
                
                if (start > end) {
                    throw new Error(`Start page ${start} is greater than end page ${end} in range "${part}"`);
                }
                
                for (let i = start; i <= end; i++) {
                    result.push(i);
                }
            } else {
                const pageNum = parseInt(part, 10);
                
                if (isNaN(pageNum)) {
                    throw new Error(`Invalid page number: "${part}"`);
                }
                
                result.push(pageNum);
            }
        }
        
        return result;
    }
    
    // Helper function to chunk an array
    chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    }
    
    // Phương thức xử lý chunk
    async processChunk(chunk: Buffer, options: PDFOptions): Promise<{
        text: string;
        metadata: Record<string, unknown>;
        pagesProcessed: number;
    }> {
        try {
            const chunkData = await pdf(chunk, options);
            return {
                text: chunkData.text,
                metadata: {
                    info: chunkData.info,
                    numberOfPages: chunkData.numpages
                },
                pagesProcessed: chunkData.numpages
            };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error processing chunk: ${error.message}`);
            }
            throw new Error('An unknown error occurred while processing chunk');
        }
    }
    
    // Phương thức thực thi chính của node
    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData = [];
        
        // Khởi tạo một instance của ExtractPdfNode để sử dụng các phương thức của class
        const pdfProcessor = new ExtractPdfNode();
        
        try {
            for (let i = 0; i < items.length; i++) {
                const inputPdfPath = this.getNodeParameter('pdfFile', i) as string;
                const options = this.getNodeParameter('options', i, {}) as PDFOptions;
                
                // Kiểm tra kích thước file và xử lý theo chunks
                const stats = await fs.promises.stat(inputPdfPath);
                const fileSizeMB = stats.size / (1024 * 1024);
                
                // Tối ưu chunk size dựa trên kích thước file
                const chunkSize = Math.min(
                    Math.max(Math.floor(fileSizeMB / 10), 5),
                    50
                );
                
                // Sử dụng stream để đọc file
                const readStream = fs.createReadStream(inputPdfPath, {
                    highWaterMark: chunkSize * 1024 * 1024
                });
                
                let processedData = Buffer.alloc(0);
                let result: ProcessingResult = {
                    text: '',
                    metadata: {},
                    performance: {
                        startTime: Date.now(),
                        endTime: 0,
                        pagesProcessed: 0
                    }
                };
                
                // Xử lý từng chunk
                for await (const chunk of readStream) {
                    processedData = Buffer.concat([processedData, chunk]);
                    
                    if (processedData.length > chunkSize * 1024 * 1024) {
                        // Gọi phương thức processChunk từ instance pdfProcessor
                        const chunkResult = await pdfProcessor.processChunk(processedData, options);
                        result.text += chunkResult.text;
                        result.metadata = { ...result.metadata, ...chunkResult.metadata };
                        result.performance.pagesProcessed += chunkResult.pagesProcessed || 0;
                        processedData = Buffer.alloc(0);
                    }
                }
                
                // Xử lý chunk cuối cùng nếu còn
                if (processedData.length > 0) {
                    // Gọi phương thức processChunk từ instance pdfProcessor
                    const finalChunkResult = await pdfProcessor.processChunk(processedData, options);
                    result.text += finalChunkResult.text;
                    result.metadata = { ...result.metadata, ...finalChunkResult.metadata };
                    result.performance.pagesProcessed += finalChunkResult.pagesProcessed || 0;
                }
                
                // Hoàn thành xử lý
                result.performance.endTime = Date.now();
                result.performance.processingTime = 
                    (result.performance.endTime - result.performance.startTime) / 1000;
                
                returnData.push({
                    json: result,
                    binary: {},
                    parameters: {}
                });
            }
            
            return [returnData];
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Error processing PDF: ${error.message}`);
            }
            throw new Error('An unknown error occurred while processing the PDF');
        }
    }
}

module.exports = ExtractPdfNode; 
