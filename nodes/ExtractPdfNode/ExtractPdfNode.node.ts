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

// Add module declaration above imports
declare type FrancType = (text: string, options?: { minLength?: number }) => string;
declare type LanguageData = {
    name: string;
    type: string;
    scope: string;
    iso6393: string;
    iso6392B?: string;
    iso6392T?: string;
    iso6391?: string;
};
declare type Iso6393Type = LanguageData[];

// Existing imports converted to CommonJS
const fs = require('fs');
const {
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} = require('n8n-workflow');
const pdf = require('pdf-parse');
const Tesseract = require('tesseract.js');
const os = require('os');
const path = require('path');
const { convert: convertPdfToImages } = require('pdf-img-convert');
const pdfTableExtractor = require('pdf-table-extractor');
const natural = require('natural');
// @ts-ignore
const sharp = require('sharp');

// Triển khai phát hiện ngôn ngữ đơn giản thay thế franc
function detectLanguageSimple(text: string): string {
  // Nếu văn bản quá ngắn, trả về undefined
  if (!text || text.length < 10) {
    return 'und';
  }
  
  // Mạng lưới ký tự đặc trưng cho từng ngôn ngữ
  const langPatterns: Record<string, RegExp[]> = {
    'vie': [/[ăâđêôơưĂÂĐÊÔƠƯ]/],
    'fra': [/[éèêàùëïçÉÈÊÀÙËÏÇ]/],
    'deu': [/[äöüßÄÖÜ]/],
    'spa': [/[áéíóúñÁÉÍÓÚÑ¿¡]/],
    'jpn': [/[\u3040-\u309F\u30A0-\u30FF]/],
    'zho': [/[\u4E00-\u9FFF]/],
    'kor': [/[\uAC00-\uD7AF\u1100-\u11FF]/],
    'rus': [/[а-яА-ЯёЁ]/],
    'tha': [/[\u0E00-\u0E7F]/]
  };
  
  // Đếm matches
  const langScores: Record<string, number> = {};
  
  // Kiểm tra mỗi ngôn ngữ
  for (const [lang, patterns] of Object.entries(langPatterns)) {
    langScores[lang] = 0;
    for (const pattern of patterns) {
      const matches = (text.match(pattern) || []).length;
      langScores[lang] += matches;
    }
  }
  
  // Tìm ngôn ngữ có điểm cao nhất
  let bestLang = 'eng'; // Default là tiếng Anh
  let highestScore = 0;
  
  for (const [lang, score] of Object.entries(langScores)) {
    if (score > highestScore && score > 0) {
      highestScore = score;
      bestLang = lang;
    }
  }
  
  // Trả về mã ISO 639-3
  return bestLang;
}

// Dữ liệu ngôn ngữ ISO 639-3 giới hạn thay thế iso-639-3
const languageData = [
  { name: 'English', iso6393: 'eng', iso6391: 'en', type: 'living', scope: 'individual' },
  { name: 'Vietnamese', iso6393: 'vie', iso6391: 'vi', type: 'living', scope: 'individual' },
  { name: 'French', iso6393: 'fra', iso6391: 'fr', type: 'living', scope: 'individual' },
  { name: 'German', iso6393: 'deu', iso6391: 'de', type: 'living', scope: 'individual' },
  { name: 'Spanish', iso6393: 'spa', iso6391: 'es', type: 'living', scope: 'individual' },
  { name: 'Chinese', iso6393: 'zho', iso6391: 'zh', type: 'living', scope: 'individual' },
  { name: 'Japanese', iso6393: 'jpn', iso6391: 'ja', type: 'living', scope: 'individual' },
  { name: 'Korean', iso6393: 'kor', iso6391: 'ko', type: 'living', scope: 'individual' },
  { name: 'Russian', iso6393: 'rus', iso6391: 'ru', type: 'living', scope: 'individual' },
  { name: 'Thai', iso6393: 'tha', iso6391: 'th', type: 'living', scope: 'individual' }
];

// Khai báo các biến để lưu modules ES sau khi load
let francModule: any = null;
let iso6393Module: any = null;

// Hàm tải lazy-loading ES modules
async function loadModules() {
  // Không cần load ES modules nữa, sử dụng triển khai trực tiếp
  return { 
    franc: (text: string) => detectLanguageSimple(text),
    iso6393: languageData
  };
}

// Type definitions for n8n API
type N8nINodeExecutionData = any;
type N8nINodeType = any;
type N8nINodeTypeDescription = any;

// Định nghĩa interface thay vì import
interface IExecuteFunctions {
    getInputData(): N8nINodeExecutionData[];
    getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: any): any;
    getNode(): any;
}

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

// Changed from export class to class
class ExtractPdfNode implements N8nINodeType {
    description: N8nINodeTypeDescription = {
        displayName: 'Extract PDF',
        name: 'extractPdf',
        group: ['transform'],
        version: 1,
        description: 'Extracts text, images and tables from PDF files',
        defaults: {
            name: 'Extract PDF',
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
                    },
                    {
                        name: 'Include Metadata',
                        value: 'includeMetadata',
                        description: 'Include PDF metadata in the output',
                    },
                ],
                default: ['extractText'],
                description: 'Select which data to extract from the PDF',
            },
            {
                displayName: 'Options',
                name: 'options',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    // Page Selection Options
                    {
                        displayName: 'Page Selection',
                        name: 'pageSelectionOptions',
                        type: 'fixedCollection',
                        placeholder: 'Add Page Selection Options',
                        default: {},
                        options: [
                            {
                                displayName: 'Page Selection Options',
                                name: 'pageSelectionValues',
                                values: [
                    {
                        displayName: 'Page Range',
                        name: 'pageRange',
                        type: 'string',
                        default: '',
                        placeholder: '1-5, 8, 11-13',
                                        description: 'Range of pages to extract. Leave empty to extract all pages.',
                    },
                    {
                                        displayName: 'Process Only First Page',
                                        name: 'firstPageOnly',
                        type: 'boolean',
                        default: false,
                                        description: 'Process only the first page of the document',
                                    },
                                ],
                            },
                        ],
                    },
                    
                    // Performance Options
                    {
                        displayName: 'Performance Options',
                        name: 'performanceOptions',
                        type: 'fixedCollection',
                        placeholder: 'Add Performance Options',
                        default: {},
                        options: [
                            {
                                displayName: 'Performance Options',
                                name: 'performanceValues',
                                values: [
                    {
                        displayName: 'Max File Size (MB)',
                        name: 'maxFileSize',
                        type: 'number',
                        default: 100,
                                        description: 'Maximum file size to process in MB',
                    },
                    {
                        displayName: 'Process In Chunks',
                        name: 'processInChunks',
                        type: 'boolean',
                        default: true,
                                        description: 'Process large PDF files in smaller chunks for better memory management',
                    },
                    {
                        displayName: 'Chunk Size (Pages)',
                        name: 'chunkSize',
                        type: 'number',
                        default: 10,
                                        description: 'Number of pages to process in each chunk',
                        displayOptions: {
                            show: {
                                                '/options.performanceOptions.performanceValues.processInChunks': [true],
                            },
                        },
                    },
                    {
                        displayName: 'Show Progress',
                        name: 'showProgress',
                        type: 'boolean',
                        default: true,
                                        description: 'Show detailed progress information during processing',
                                    },
                                    {
                                        displayName: 'Continue On Error',
                                        name: 'continueOnError',
                                        type: 'boolean',
                                        default: false,
                                        description: 'Continue processing if errors occur on specific pages',
                                    },
                                ],
                            },
                        ],
                    },
                    
                    // OCR Options - only show if OCR is selected
                    {
                        displayName: 'OCR Options',
                        name: 'ocrOptions',
                        type: 'fixedCollection',
                        placeholder: 'Add OCR Options',
                        default: {},
                        displayOptions: {
                            show: {
                                '/extractionFeatures': ['performOcr'],
                            },
                        },
                        options: [
                            {
                                displayName: 'OCR Options',
                                name: 'ocrValues',
                                values: [
                                    {
                                        displayName: 'Language Handling',
                                        name: 'languageHandling',
                                        type: 'options',
                                        options: [
                                            {
                                                name: 'Single Language',
                                                value: 'single',
                                                description: 'Use one specific language',
                                            },
                                            {
                                                name: 'Multiple Languages',
                                                value: 'multiple',
                                                description: 'Process document with multiple languages',
                                            },
                                            {
                                                name: 'Auto-Detect Language',
                                                value: 'auto',
                                                description: 'Try to automatically detect language',
                                            },
                                        ],
                                        default: 'single',
                                        description: 'How to handle languages in OCR processing',
                                    },
                                    {
                                        displayName: 'Primary Language',
                                        name: 'ocrLanguage',
                                        type: 'options',
                                        options: [
                                            { name: 'English', value: 'eng' },
                                            { name: 'Vietnamese', value: 'vie' },
                                            { name: 'French', value: 'fra' },
                                            { name: 'German', value: 'deu' },
                                            { name: 'Spanish', value: 'spa' },
                                            { name: 'Chinese Simplified', value: 'chi_sim' },
                                            { name: 'Chinese Traditional', value: 'chi_tra' },
                                            { name: 'Japanese', value: 'jpn' },
                                            { name: 'Korean', value: 'kor' },
                                            { name: 'Russian', value: 'rus' },
                                            { name: 'Arabic', value: 'ara' },
                                            { name: 'Hindi', value: 'hin' },
                                            { name: 'Italian', value: 'ita' },
                                            { name: 'Portuguese', value: 'por' },
                                            { name: 'Thai', value: 'tha' },
                                        ],
                                        default: 'eng',
                                        description: 'Primary language to use for OCR',
                                        displayOptions: {
                                            show: {
                                                languageHandling: ['single', 'multiple'],
                                            },
                                        },
                                    },
                                    {
                                        displayName: 'Additional Languages',
                                        name: 'additionalLanguages',
                                        type: 'multiOptions',
                                        options: [
                                            { name: 'English', value: 'eng' },
                                            { name: 'Vietnamese', value: 'vie' },
                                            { name: 'French', value: 'fra' },
                                            { name: 'German', value: 'deu' },
                                            { name: 'Spanish', value: 'spa' },
                                            { name: 'Chinese Simplified', value: 'chi_sim' },
                                            { name: 'Chinese Traditional', value: 'chi_tra' },
                                            { name: 'Japanese', value: 'jpn' },
                                            { name: 'Korean', value: 'kor' },
                                            { name: 'Russian', value: 'rus' },
                                            { name: 'Arabic', value: 'ara' },
                                            { name: 'Hindi', value: 'hin' },
                                            { name: 'Italian', value: 'ita' },
                                            { name: 'Portuguese', value: 'por' },
                                            { name: 'Thai', value: 'tha' },
                                        ],
                                        default: [],
                                        description: 'Additional languages to use with OCR',
                                        displayOptions: {
                                            show: {
                                                languageHandling: ['multiple'],
                                            },
                                        },
                                    },
                                    {
                                        displayName: 'OCR Quality',
                                        name: 'ocrQuality',
                                        type: 'options',
                                        options: [
                                            { name: 'Fast (Lower Quality)', value: 'fast' },
                                            { name: 'Balanced', value: 'balanced' },
                                            { name: 'Accurate (Slower)', value: 'accurate' }
                                        ],
                                        default: 'balanced',
                                        description: 'Balance between speed and accuracy in OCR processing',
                                    },
                                    {
                                        displayName: 'Enhance OCR Results with AI',
                                        name: 'enhanceOcrResults',
                                        type: 'boolean',
                                        default: false,
                                        description: 'Use AI to improve OCR text quality by fixing common errors',
                                    },
                                    {
                                        displayName: 'Spell Check Language',
                                        name: 'spellCheckLanguage',
                                        type: 'options',
                                        options: [
                                            { name: 'English', value: 'en' },
                                            { name: 'French', value: 'fr' },
                                            { name: 'German', value: 'de' },
                                            { name: 'Spanish', value: 'es' },
                                            { name: 'Portuguese', value: 'pt' },
                                            { name: 'Italian', value: 'it' },
                                            { name: 'Dutch', value: 'nl' },
                                        ],
                                        default: 'en',
                                        description: 'Language to use for spell checking OCR results',
                                        displayOptions: {
                                            show: {
                                                enhanceOcrResults: [true],
                                            },
                                        },
                                    },
                                    {
                                        displayName: 'AI Correction Level',
                                        name: 'aiCorrectionLevel',
                                        type: 'options',
                                        options: [
                                            { name: 'Light (Only Fix Common Errors)', value: 'light' },
                                            { name: 'Medium (Fix Errors + Basic Context)', value: 'medium' },
                                            { name: 'Aggressive (Maximum Correction)', value: 'aggressive' },
                                        ],
                                        default: 'medium',
                                        description: 'How aggressively to correct OCR errors',
                                        displayOptions: {
                                            show: {
                                                enhanceOcrResults: [true],
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                    
                    // Table Options - only show if Extract Tables is selected
                    {
                        displayName: 'Table Options',
                        name: 'tableOptions',
                        type: 'fixedCollection',
                        placeholder: 'Add Table Options',
                        default: {},
                        displayOptions: {
                            show: {
                                '/extractionFeatures': ['extractTables'],
                            },
                        },
                        options: [
                            {
                                displayName: 'Table Options',
                                name: 'tableValues',
                                values: [
                                    {
                                        displayName: 'Use First Row as Headers',
                                        name: 'useFirstRowAsHeaders',
                                        type: 'boolean',
                                        default: true,
                                        description: 'Use the first row of each table as column headers',
                                    },
                                    {
                                        displayName: 'Include Row Coordinates',
                                        name: 'includeRowCoordinates',
                                        type: 'boolean',
                                        default: false,
                                        description: 'Include position information for rows in the output',
                                    },
                                ],
                            },
                        ],
                    },
                    // Thêm Document Recognition Options
                    {
                        displayName: 'Document Recognition',
                        name: 'documentRecognitionOptions',
                        type: 'fixedCollection',
                        placeholder: 'Add Document Recognition Options',
                        default: {},
                        options: [
                            {
                                displayName: 'Document Recognition Options',
                                name: 'documentRecognitionValues',
                                values: [
                                    {
                                        displayName: 'Detect Document Type',
                                        name: 'detectDocumentType',
                                        type: 'boolean',
                                        default: false,
                                        description: 'Automatically detect document type and categorize the PDF',
                                    },
                                    {
                                        displayName: 'Extract Form Fields',
                                        name: 'extractFormFields',
                                        type: 'boolean',
                                        default: false,
                                        description: 'Extract field data from forms and structured documents',
                                    },
                                    {
                                        displayName: 'Document Categories',
                                        name: 'documentCategories',
                                        type: 'string',
                                        default: 'invoice,receipt,contract,report,resume,letter',
                                        description: 'Comma-separated list of document categories to detect',
                                        displayOptions: {
                                            show: {
                                                detectDocumentType: [true],
                                            },
                                        },
                                    },
                                    {
                                        displayName: 'Custom Templates Path',
                                        name: 'customTemplatesPath',
                                        type: 'string',
                                        default: '',
                                        placeholder: '/path/to/templates',
                                        description: 'Path to directory with custom document templates',
                                        displayOptions: {
                                            show: {
                                                detectDocumentType: [true],
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };

    // Fix the execute method signature to use any for this
    async execute(this: any): Promise<N8nINodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: N8nINodeExecutionData[] = [];
        
        try {
            // Get input type parameter
            const inputType = this.getNodeParameter('inputType', 0) as string;
            const extractionFeatures = this.getNodeParameter('extractionFeatures', 0) as string[];
            const options = this.getNodeParameter('options', 0, {}) as Record<string, any>;
            
            // Parse options from nested structure
            const pageSelectionOptions = options.pageSelectionOptions?.pageSelectionValues || {};
            const performanceOptions = options.performanceOptions?.performanceValues || {};
            const ocrOptions = options.ocrOptions?.ocrValues || {};
            const tableOptions = options.tableOptions?.tableValues || {};
            
            // Build a consolidated options object for processing
            const processOptions: PDFOptions & { 
                continueOnError?: boolean,
                processInChunks?: boolean,
                showProgress?: boolean,
                firstPageOnly?: boolean,
                useFirstRowAsHeaders?: boolean,
                includeRowCoordinates?: boolean,
                aiCorrectionLevel?: string,
                documentCategories?: string[],
                customTemplatesPath?: string
            } = {
                // Page selection
                pageRange: pageSelectionOptions.pageRange,
                firstPageOnly: pageSelectionOptions.firstPageOnly,
                
                // Performance options
                maxFileSize: performanceOptions.maxFileSize || 100,
                processInChunks: performanceOptions.processInChunks,
                chunkSize: performanceOptions.chunkSize,
                showProgress: performanceOptions.showProgress,
                continueOnError: performanceOptions.continueOnError,
                
                // Extraction features
                includeMetadata: extractionFeatures.includes('includeMetadata'),
                extractImages: extractionFeatures.includes('extractImages'),
                performOcr: extractionFeatures.includes('performOcr'),
                extractTables: extractionFeatures.includes('extractTables'),
                
                // OCR options
                autoDetectLanguage: ocrOptions.languageHandling === 'auto',
                multipleLanguages: ocrOptions.languageHandling === 'multiple',
                ocrLanguage: ocrOptions.ocrLanguage,
                additionalLanguages: ocrOptions.additionalLanguages,
                enhanceOcrResults: ocrOptions.enhanceOcrResults || false,
                spellCheckLanguage: ocrOptions.spellCheckLanguage || 'en',
                aiCorrectionLevel: ocrOptions.aiCorrectionLevel || 'medium',
                
                // Table options
                useFirstRowAsHeaders: tableOptions.useFirstRowAsHeaders,
                includeRowCoordinates: tableOptions.includeRowCoordinates,
                
                // Document recognition options
                detectDocumentType: options.documentRecognitionOptions?.documentRecognitionValues?.detectDocumentType || false,
                extractFormFields: options.documentRecognitionOptions?.documentRecognitionValues?.extractFormFields || false,
                documentCategories: options.documentRecognitionOptions?.documentRecognitionValues?.documentCategories 
                    ? options.documentRecognitionOptions.documentRecognitionValues.documentCategories.split(',').map((s: string) => s.trim())
                    : ['invoice', 'receipt', 'contract', 'report', 'resume', 'letter'],
                customTemplatesPath: options.documentRecognitionOptions?.documentRecognitionValues?.customTemplatesPath || '',
            };
            
            let dataBuffer: Buffer;
            let filePath: string = '';
            
            if (inputType === 'filePath') {
                // Get parameters from the node for file path input
                const pdfFile = this.getNodeParameter('pdfFile', 0) as string;
                if (!pdfFile) {
                    throw new Error('No PDF file path specified');
                }
                
                filePath = pdfFile;
                
                // Check if file exists
                if (!fs.existsSync(filePath)) {
                    throw new Error(`PDF file not found: ${filePath}`);
                }

                // Check file size
                const fileStats = fs.statSync(filePath);
                const fileSizeMB = fileStats.size / (1024 * 1024);
                
                if (fileSizeMB > (processOptions.maxFileSize || 100)) {
                    throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the maximum allowed size (${processOptions.maxFileSize || 100} MB)`);
                }
                
                // Read file with memory efficiency for large files
                dataBuffer = fs.readFileSync(filePath);
            } else {
                // Process binary data (e.g., from Google Drive node)
                const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0) as string;
                
                if (!items[0].binary || !items[0].binary[binaryPropertyName]) {
                    throw new Error(`No binary data found in property "${binaryPropertyName}"`);
                }
                
                // Get binary data from the result of the previous node
                const binaryData = items[0].binary[binaryPropertyName];
                dataBuffer = Buffer.from(binaryData.data, 'base64');
                
                // Create a temporary file path for operations that require a file
                const tempDir = os.tmpdir();
                filePath = path.join(tempDir, `pdf-${Date.now()}.pdf`);
                fs.writeFileSync(filePath, dataBuffer);
                
                // Check file size
                const fileSizeMB = dataBuffer.length / (1024 * 1024);
                
                if (fileSizeMB > (processOptions.maxFileSize || 100)) {
                    throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the maximum allowed size (${processOptions.maxFileSize || 100} MB)`);
                }
            }
            
            // Check if PDF is encrypted/password protected
            // This is a basic check - pdf-parse will throw a specific error for encrypted PDFs
            const pdfHeader = dataBuffer.slice(0, 100).toString();
            if (pdfHeader.includes('/Encrypt')) {
                throw new Error('The PDF file appears to be encrypted or password protected. This node cannot process protected PDFs.');
            }
            
            // Get initial PDF info to determine total page count
            const initialPdfData = await pdf(dataBuffer, { max: 1 }); // Only parse first page to get document info
            const totalPages = initialPdfData.numpages;
            
            // Parse page range if specified
            let pageNumbers: number[] = [];
            if (processOptions.pageRange) {
                try {
                    pageNumbers = this.parsePageRange(processOptions.pageRange);
                    // Check if any requested pages exceed the document page count
                    const maxRequestedPage = Math.max(...pageNumbers);
                    if (maxRequestedPage > totalPages) {
                        throw new Error(`Page range includes page ${maxRequestedPage}, but the document only has ${totalPages} page(s)`);
                    }
                } catch (error) {
                    if (error instanceof Error) {
                        throw error;
                    }
                    throw new Error(`Invalid page range format: ${(error as Error).message}`);
                }
            } else {
                // If no specific pages requested, process all pages
                for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            }
            
            // Configure base PDF parsing options
            const basePdfOptions: any = {
                // Add error handling for parsing
                onError: (err: Error) => {
                    if (!processOptions.continueOnError) {
                        throw err;
                    }
                    console.error(`Warning: Error parsing PDF: ${err.message}`);
                    return;
                }
            };
            
            let allText = '';
            let performance = { startTime: Date.now(), endTime: 0, totalPages: pageNumbers.length };
            
            // Process in chunks for large documents if enabled
            if (processOptions.processInChunks && pageNumbers.length > (processOptions.chunkSize || 10)) {
                const chunkSize = processOptions.chunkSize || 10;
                const chunks = this.chunkArray(pageNumbers, chunkSize);
                
                let processedPages = 0;
                
                for (let i = 0; i < chunks.length; i++) {
                    const chunkPageNumbers = chunks[i];
                    const chunkPdfOptions = { ...basePdfOptions, pageNumbers: chunkPageNumbers };
                    
                    try {
                        // Process each chunk
                        const chunkData = await pdf(dataBuffer, chunkPdfOptions);
                        allText += chunkData.text;
                        
                        // Update processed pages count and show progress if enabled
                        processedPages += chunkPageNumbers.length;
                        
                        if (processOptions.showProgress) {
                            const progressPercent = (processedPages / pageNumbers.length * 100).toFixed(1);
                            console.log(`Processing PDF: ${progressPercent}% complete (${processedPages}/${pageNumbers.length} pages)`);
                        }
                    } catch (error) {
                        if (processOptions.continueOnError) {
                            console.error(`Warning: Error processing chunk ${i+1} (pages ${chunkPageNumbers.join(',')}): ${(error as Error).message}`);
                            continue;
                        } else {
                            throw error;
                        }
                    }
                }
                
                performance.endTime = Date.now();
                
            } else {
                // Process all requested pages at once for smaller documents
                if (pageNumbers.length > 0) {
                    basePdfOptions.pageNumbers = pageNumbers;
                }
                
                const data = await pdf(dataBuffer, basePdfOptions);
                allText = data.text;
                performance.endTime = Date.now();
            }
            
                const output: any = { 
                text: allText,
                    performance: {
                    processingTime: `${((performance.endTime - performance.startTime) / 1000).toFixed(2)}s`,
                        pagesProcessed: pageNumbers.length,
                    pagesPerSecond: (pageNumbers.length / ((performance.endTime - performance.startTime) / 1000)).toFixed(2)
                    }
                };
                
                // Include metadata if requested
            if (processOptions.includeMetadata) {
                    output.metadata = {
                        info: initialPdfData.info,
                        metadata: initialPdfData.metadata,
                    numberOfPages: totalPages,
                        version: initialPdfData.version
                    };
                }
                
            // Extract images if requested
            if (processOptions.extractImages) {
                try {
                    const images = await this.extractImagesFromPdf(filePath, pageNumbers);
                    output.images = images;
                } catch (error) {
                    if (processOptions.continueOnError) {
                        console.error(`Warning: Error extracting images: ${(error as Error).message}`);
                        output.imageExtractionError = (error as Error).message;
            } else {
                        throw error;
                    }
                }
            }
            
            // Extract tables if requested
            if (processOptions.extractTables) {
                try {
                    const tables = await this.extractTablesFromPdf(filePath);
                    output.tables = tables;
                } catch (error) {
                    if (processOptions.continueOnError) {
                        console.error(`Warning: Error extracting tables: ${(error as Error).message}`);
                        output.tableExtractionError = (error as Error).message;
                    } else {
                        throw error;
                    }
                }
            }
            
            // If text is empty and OCR is enabled, try to extract text using OCR
            if (processOptions.performOcr && (!allText || allText.trim() === '')) {
                try {
                    console.log('No text found in PDF. Attempting OCR...');
                    
                    // Configure OCR options
                    const ocrOptions = {
                        language: processOptions.ocrLanguage || 'eng',
                        autoDetect: processOptions.autoDetectLanguage || false,
                        additionalLanguages: processOptions.multipleLanguages ? processOptions.additionalLanguages || [] : undefined
                    };
                    
                    output.text = await this.performOcrOnPdf(filePath, pageNumbers, ocrOptions);
                    console.log('OCR completed successfully');
                    
                    // AI enhancement for OCR results if enabled
                    if (processOptions.enhanceOcrResults && output.text) {
                        console.log('Enhancing OCR results with AI...');
                        output.originalOcrText = output.text; // Lưu văn bản OCR gốc
                        output.text = await this.enhanceOcrWithAI(
                            output.text, 
                            processOptions.spellCheckLanguage || 'en',
                            processOptions.aiCorrectionLevel || 'medium'
                        );
                        console.log('OCR enhancement completed');
                    }
                    
                    allText = output.text;
                    
                    // Add language information
                    if (ocrOptions.autoDetect) {
                        output.ocrLanguageDetection = true;
                    } else if (ocrOptions.additionalLanguages && ocrOptions.additionalLanguages.length > 0) {
                        output.ocrLanguages = [ocrOptions.language, ...ocrOptions.additionalLanguages];
                    } else {
                        output.ocrLanguage = ocrOptions.language;
                    }
                } catch (error) {
                    if (processOptions.continueOnError) {
                        console.error(`Warning: Error performing OCR: ${(error as Error).message}`);
                        output.ocrError = (error as Error).message;
                    } else {
                        throw error;
                    }
                }
            }
            
            // Check if any text was extracted
            if (!output.text || output.text.trim() === '') {
                output.warning = 'No text was extracted. This might be a scanned PDF or an image-based PDF without text layer. Try enabling the OCR option.';
            }
            
            // Clean up temporary file if created
            if (inputType === 'binaryData' && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
        } catch (error) {
                    console.error(`Warning: Error deleting temporary file: ${(error as Error).message}`);
                }
            }
            
            // After extracting text and performing OCR, add document classification if enabled
            if (processOptions.detectDocumentType && allText) {
                try {
                    console.log('Detecting document type...');
                    const documentInfo = await this.classifyDocument(
                        allText, 
                        output.metadata,
                        processOptions.documentCategories || [],
                        processOptions.customTemplatesPath || ''
                    );
                    
                    output.documentClassification = documentInfo;
                    
                    // If form field extraction is enabled, try to extract fields based on document type
                    if (processOptions.extractFormFields && documentInfo.documentType) {
                        console.log(`Extracting form fields for document type: ${documentInfo.documentType}...`);
                        const extractedFields = await this.extractDocumentFields(
                            allText,
                            output.tables || [],
                            documentInfo.documentType,
                            processOptions.customTemplatesPath || ''
                        );
                        
                        output.extractedFields = extractedFields;
                    }
                } catch (error) {
                    if (processOptions.continueOnError) {
                        console.error(`Warning: Error detecting document type: ${(error as Error).message}`);
                        output.documentClassificationError = (error as Error).message;
            } else {
                        throw error;
                    }
                }
            }
            
            // Return the extracted data
            const item: N8nINodeExecutionData = {
                json: output,
                parameters: {},
            };
            returnData.push(item);
            
            return [returnData];
        } catch (error) {
            if (error instanceof Error) {
                throw new NodeOperationError(this.getNode().name, { json: {}, parameters: {} }, error.message);
            }
            throw new NodeOperationError(this.getNode().name, { json: {}, parameters: {} }, `Unknown error: ${error}`);
        }
    }
    
    // Helper function to parse page range string (e.g., "1-5, 8, 11-13")
    parsePageRange(pageRange: string): number[] {
        const result: number[] = [];
        const parts = pageRange.split(',').map(part => part.trim());
        
        for (const part of parts) {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
                
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
    
    // Function to extract tables from PDF
    async extractTablesFromPdf(filePath: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            pdfTableExtractor(filePath, 
                (result: any) => {
                    try {
                        const formattedTables = this.formatTables(result);
                        resolve(formattedTables);
                    } catch (error) {
                        reject(error as Error);
                    }
                }, 
                (error: string) => {
                    reject(new Error(error));
                }
            );
        });
    }
    
    // Format the tables data for better usability
    private formatTables(result: any): any[] {
        const formattedTables: any[] = [];
        
        if (result && result.pageTables) {
            result.pageTables.forEach((pageTable: any) => {
                if (pageTable.tables && pageTable.tables.length > 0) {
                    const pageNum = pageTable.page;
                    pageTable.tables.forEach((table: any[], tableIndex: number) => {
                        if (table && table.length > 0) {
                            // Giả định rằng hàng đầu tiên là tiêu đề
                            const headers = table[0];
                            const rows = table.slice(1);
                            
                            const formattedTable = {
                                pageNumber: pageNum,
                                tableIndex: tableIndex,
                                headers: headers,
                                rows: rows,
                                data: rows.map((row: any[]) => {
                                    const rowData: Record<string, string> = {};
                                    headers.forEach((header: string, index: number) => {
                                        rowData[header] = row[index] || '';
                                    });
                                    return rowData;
                                })
                            };
                            
                            formattedTables.push(formattedTable);
                        }
                    });
                }
            });
        }
        
        return formattedTables;
    }
    
    // New function to extract images from PDF
    async extractImagesFromPdf(filePath: string, pageNumbers: number[]): Promise<{ page: number, imageData: string }[]> {
        try {
            // Convert PDF pages to images
            const outputImages = await convertPdfToImages(filePath, {
                // Use page numbers as 0-based index
                page_numbers: pageNumbers.map(p => p - 1)
            });
            
            // Create array of image data with page numbers
            const images = outputImages.map((imageBuffer: any, index: number) => {
                const page = pageNumbers[index];
                // Convert raw buffer to base64 string
                // Handle the type safely
                let base64Data = '';
                if (imageBuffer instanceof Uint8Array) {
                    base64Data = Buffer.from(imageBuffer).toString('base64');
                } else if (typeof imageBuffer === 'string') {
                    base64Data = Buffer.from(imageBuffer, 'binary').toString('base64');
                }
                const imageData = `data:image/png;base64,${base64Data}`;
                return { page, imageData };
            });
            
            return images;
        } catch (error) {
            throw new Error(`Failed to extract images from PDF: ${(error as Error).message}`);
        }
    }
    
    // Cập nhật phương thức performOcrOnPdf
    async performOcrOnPdf(filePath: string, pageNumbers: number[], ocrOptions: { 
        language?: string,
        autoDetect?: boolean,
        additionalLanguages?: string[],
        enhanceResults?: boolean,
        enhancementLevel?: string
    }): Promise<{text: string, languageStats?: Record<string, number>}> {
        try {
            // Convert PDF to images first
            const outputImages = await convertPdfToImages(filePath, {
                // Use page numbers as 0-based index
                page_numbers: pageNumbers.map(p => p - 1),
                // Thêm các tùy chọn khác
                scale: 2.0 // Tăng tỷ lệ để cải thiện chất lượng thay vì dùng dpi
            });
            
            let allText = '';
            let allLanguages: string[] = [];
            
            // Language detection variables
            let detectedLanguages: Set<string> = new Set();
            let combinedLanguages = '';
            
            // Determine language configuration
            if (ocrOptions.autoDetect) {
                console.log('Auto-detecting languages in document...');
                // Sẽ phát hiện ngôn ngữ cho mỗi trang
                combinedLanguages = 'eng'; // Default to English initially
            } else if (ocrOptions.additionalLanguages && ocrOptions.additionalLanguages.length > 0) {
                // Combine primary language with additional languages
                allLanguages = [ocrOptions.language || 'eng', ...ocrOptions.additionalLanguages];
                combinedLanguages = allLanguages.join('+');
                console.log(`Using multiple languages for OCR: ${combinedLanguages}`);
            } else {
                // Use single language
                allLanguages = [ocrOptions.language || 'eng'];
                combinedLanguages = ocrOptions.language || 'eng';
                console.log(`Using language for OCR: ${combinedLanguages}`);
            }
            
            // Process each image with our improved multilingual OCR
            for (let i = 0; i < outputImages.length; i++) {
                const imageBuffer = outputImages[i];
                
                // Safely handle the type
                let processableImage;
                if (imageBuffer instanceof Uint8Array) {
                    processableImage = Buffer.from(imageBuffer);
                } else if (typeof imageBuffer === 'string') {
                    processableImage = Buffer.from(imageBuffer, 'binary');
                } else {
                    processableImage = imageBuffer;
                }
                
                // Save to temporary file for image enhancement
                const imagePath = path.join(os.tmpdir(), `ocr_page_${pageNumbers[i]}.png`);
                fs.writeFileSync(imagePath, processableImage);
                
                // Auto-detect language for this page if enabled
                if (ocrOptions.autoDetect) {
                    try {
                        // Detect language from first page text if available
                        if (i === 0 || allText.length > 500) {
                            const langCode = await this.detectLanguage(allText || 'Sample text for detection');
                            if (langCode) {
                                detectedLanguages.add(langCode);
                                allLanguages = [langCode];
                                combinedLanguages = langCode;
                                console.log(`Auto-detected language: ${langCode}`);
                            }
                        }
                    } catch (error) {
                        console.log(`Language detection failed, using default language`);
                    }
                }
                
                // Apply image enhancement if requested
                let imageToProcess = imagePath;
                if (ocrOptions.enhanceResults && ocrOptions.enhancementLevel !== 'none') {
                    console.log(`Enhancing image for page ${pageNumbers[i]}...`);
                    imageToProcess = await this.enhanceImage(imagePath);
                }
                
                // Perform OCR on the image with the determined language(s)
                const pageText = await this.performMultilingualOCR(imageToProcess, allLanguages);
                
                // Enhance OCR results with NLP if requested
                let enhancedText = pageText;
                if (ocrOptions.enhanceResults && ocrOptions.enhancementLevel !== 'none') {
                    console.log(`Applying text enhancement for page ${pageNumbers[i]}...`);
                    enhancedText = await this.enhanceOcrWithAI(
                        pageText,
                        allLanguages[0].substring(0, 2), // Use first 2 chars of language code
                        ocrOptions.enhancementLevel || 'medium'
                    );
                }
                
                // Append text from this page
                allText += `=== Page ${pageNumbers[i]} ===\n${enhancedText}\n\n`;
                
                // Clean up temporary files
                try {
                    fs.unlinkSync(imagePath);
                    if (imageToProcess !== imagePath) {
                        fs.unlinkSync(imageToProcess);
                    }
                } catch (error) {
                    // Ignore errors during cleanup
                }
                
                // Report progress
                console.log(`OCR Progress: ${Math.round((i + 1) / outputImages.length * 100)}% (Page ${pageNumbers[i]})`);
            }
            
            // Add summary of detected languages if auto-detection was used
            if (ocrOptions.autoDetect && detectedLanguages.size > 0) {
                console.log(`Languages detected in document: ${Array.from(detectedLanguages).join(', ')}`);
            }
            
            // Generate language statistics
            const languageStats = await this.generateLanguageStats(allText);
            
            return {
                text: allText,
                languageStats
            };
        } catch (error: any) {
            throw new Error(`Failed to perform OCR on PDF: ${error.message}`);
        }
    }
    
    // Helper method to safely extract script info from OSD results
    private extractScriptFromOSD(osdData: any): string | undefined {
        // Try to extract script info from OSD
        // This is a simplification - actual implementation would depend on Tesseract.js version
        // and actual return structure which can vary
        if (osdData.script) {
            return osdData.script;
        }
        
        // Fallback approaches to find script info in different formats
        if (osdData.osd && osdData.osd.script) {
            return osdData.osd.script;
        }
        
        // For older Tesseract versions or different result structures
        if (typeof osdData === 'object') {
            // Try to find a script property anywhere in the object
            for (const key in osdData) {
                if (key === 'script' && typeof osdData[key] === 'string') {
                    return osdData[key];
                }
                if (typeof osdData[key] === 'object' && osdData[key]?.script) {
                    return osdData[key].script;
                }
            }
        }
        
        return undefined;
    }
    
    // Helper method to map script to Tesseract language code
    private mapScriptToLanguage(script?: string): string {
        if (!script) return 'eng'; // Default to English
        
        // Map script to most common language using that script
        const scriptMap: Record<string, string> = {
            'Latin': 'eng',
            'Arabic': 'ara',
            'Cyrillic': 'rus',
            'Devanagari': 'hin',
            'Han': 'chi_sim',
            'Hangul': 'kor',
            'Japanese': 'jpn',
            'Thai': 'tha',
            'Vietnamese': 'vie'
        };
        
        return scriptMap[script] || 'eng';
    }

    /**
     * Nâng cao chất lượng OCR bằng kỹ thuật xử lý ngôn ngữ tự nhiên (NLP)
     * @param text - Văn bản OCR đầu vào cần cải thiện
     * @param language - Ngôn ngữ cho kiểm tra chính tả
     * @param correctionLevel - Mức độ hiệu chỉnh ('light', 'medium', 'aggressive')
     * @returns Văn bản đã được cải thiện
     */
    async enhanceOcrWithAI(text: string, language: string = 'en', correctionLevel: string = 'medium'): Promise<string> {
        if (!text || text.trim() === '') {
            return text;
        }
        
        try {
            // 1. Tiền xử lý: Loại bỏ các ký tự đặc biệt không mong muốn từ OCR
            let enhancedText = text
                .replace(/[\x00-\x1F\x7F]/g, '') // Loại bỏ các ký tự điều khiển
                .replace(/[^\S\r\n]+/g, ' '); // Chuẩn hóa khoảng trắng
            
            // 2. Sửa lỗi OCR phổ biến (ví dụ: '0' thay vì 'O', '1' thay vì 'I', v.v.)
            const commonOcrErrors: {[key: string]: string} = {
                '0': 'O', 'O0': 'OO', '0O': 'OO',
                '1': 'I', 'l': 'I', '|': 'I',
                '5': 'S', '8': 'B', 'rn': 'm',
                'cl': 'd', 'vv': 'w', 'ii': 'n'
            };
            
            // Mức độ hiệu chỉnh khác nhau dựa trên correctionLevel
            if (correctionLevel === 'light') {
                // Chỉ sửa lỗi OCR rất phổ biến và chắc chắn
                Object.keys(commonOcrErrors).forEach(key => {
                    // Thay thế dựa trên ngữ cảnh để tránh lỗi
                    // Ví dụ: chỉ thay thế '0' thành 'O' trong từ, không phải trong số
                    const regex = new RegExp(`([a-zA-Z])${key}([a-zA-Z])`, 'g');
                    enhancedText = enhancedText.replace(regex, (match, p1, p2) => 
                        `${p1}${commonOcrErrors[key]}${p2}`);
                });
            } else {
                // Medium và Aggressive cải thiện mạnh hơn
                
                // 3. Sửa chính tả (nếu ngôn ngữ được hỗ trợ)
                if (['en', 'fr', 'de', 'es', 'pt', 'it', 'nl'].includes(language)) {
                    // Thiết lập kiểm tra chính tả phù hợp với ngôn ngữ
                    const spellCheck = new natural.Spellcheck([language]);
                    
                    // Chia văn bản thành các từ và xử lý từng từ
                    const words = enhancedText.split(/\s+/);
                    const correctedWords = words.map(word => {
                        // Bỏ qua từ quá ngắn hoặc có số
                        if (word.length <= 2 || /\d/.test(word) || /[^\w\s]/.test(word)) {
                            return word;
                        }
                        
                        // Kiểm tra chính tả và sửa lỗi
                        if (!spellCheck.isCorrect(word)) {
                            const suggestions = spellCheck.getCorrections(word, 1);
                            if (suggestions && suggestions.length > 0) {
                                // Chỉ sửa nếu từ gợi ý đủ giống với từ gốc
                                const similarity = this.calculateStringSimilarity(word, suggestions[0]);
                                // Điều chỉnh ngưỡng tương đồng dựa trên mức độ hiệu chỉnh
                                const threshold = correctionLevel === 'aggressive' ? 0.6 : 0.75;
                                
                                if (similarity >= threshold) {
                                    return suggestions[0];
                                }
                            }
                        }
                        return word;
                    });
                    
                    enhancedText = correctedWords.join(' ');
                }
                
                // 4. Cải thiện ngữ pháp và cấu trúc câu (chỉ ở mức aggressive)
                if (correctionLevel === 'aggressive' && language === 'en') {
                    // Cải thiện câu sử dụng các quy tắc đơn giản
                    enhancedText = enhancedText
                        // Chuẩn hóa dấu câu
                        .replace(/\s+([.,;:!?])/g, '$1')
                        // Chuẩn hóa viết hoa sau dấu câu
                        .replace(/([.!?])\s+([a-z])/g, (match, p1, p2) => `${p1} ${p2.toUpperCase()}`)
                        // Chuẩn hóa sử dụng I (đại từ nhân xưng số ít)
                        .replace(/\b(i|I)\b/g, 'I');
                }
            }
            
            return enhancedText;
        } catch (error) {
            console.error('Error enhancing OCR text:', (error as Error).message);
            // Trả về văn bản gốc nếu xảy ra lỗi
            return text;
        }
    }
    
    /**
     * Tính toán độ tương đồng giữa hai chuỗi dựa trên khoảng cách Levenshtein
     * @param str1 Chuỗi thứ nhất
     * @param str2 Chuỗi thứ hai
     * @returns Độ tương đồng từ 0 đến 1, với 1 là giống hoàn toàn
     */
    calculateStringSimilarity(str1: string, str2: string): number {
        const distance = natural.LevenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    /**
     * Phân loại loại tài liệu dựa trên nội dung và metadata
     * @param text Văn bản đã trích xuất từ tài liệu
     * @param metadata Metadata của tài liệu PDF
     * @param categories Danh sách các loại tài liệu có thể nhận dạng
     * @param customTemplatesPath Đường dẫn tới thư mục chứa mẫu tài liệu tùy chỉnh
     * @returns Thông tin về loại tài liệu và độ tin cậy
     */
    async classifyDocument(
        text: string, 
        metadata: any, 
        categories: string[] = [], 
        customTemplatesPath: string = ''
    ): Promise<DocumentClassification> {
        // Định nghĩa từ khóa cho mỗi loại tài liệu
        const documentKeywords: { [key: string]: string[] } = {
            invoice: ['invoice', 'bill', 'payment', 'due date', 'total amount', 'tax', 'customer', 'invoice number', 'qty', 'quantity'],
            receipt: ['receipt', 'payment received', 'paid', 'total', 'cash', 'change', 'thank you', 'customer copy', 'merchant', 'transaction'],
            contract: ['agreement', 'contract', 'terms', 'conditions', 'parties', 'signed', 'signature', 'hereby', 'clause', 'legal'],
            report: ['report', 'analysis', 'summary', 'conclusion', 'findings', 'data', 'results', 'evaluation', 'assessment', 'recommendation'],
            resume: ['resume', 'cv', 'curriculum vitae', 'experience', 'education', 'skills', 'references', 'employment', 'university', 'certification'],
            letter: ['dear', 'sincerely', 'regards', 'to whom it may concern', 'letterhead', 'date', 'address', 'signature', 'subject', 'attachment']
        };
        
        // Thêm các từ khóa tùy chỉnh từ mẫu nếu có
        if (customTemplatesPath && fs.existsSync(customTemplatesPath)) {
            try {
                const templateFiles = fs.readdirSync(customTemplatesPath);
                for (const file of templateFiles) {
                    if (file.endsWith('.json')) {
                        const templatePath = path.join(customTemplatesPath, file);
                        const templateContent = fs.readFileSync(templatePath, 'utf8');
                        const template = JSON.parse(templateContent);
                        
                        if (template.type && template.keywords && Array.isArray(template.keywords)) {
                            documentKeywords[template.type] = template.keywords;
                        }
                    }
                }
            } catch (error) {
                console.warn(`Warning: Could not load custom templates: ${(error as Error).message}`);
            }
        }
        
        // Chuẩn bị văn bản (chuyển sang chữ thường)
        const normalizedText = text.toLowerCase();
        
        // Tính điểm cho mỗi loại tài liệu dựa trên số từ khóa xuất hiện
        const scores: { [key: string]: number } = {};
        let maxScore = 0;
        let bestMatch = '';
        
        // Chỉ đánh giá các loại tài liệu được chỉ định
        const categoriesToCheck = categories.length > 0 ? categories : Object.keys(documentKeywords);
        
        for (const category of categoriesToCheck) {
            if (documentKeywords[category]) {
                // Đếm số từ khóa khớp và tính điểm
                let score = 0;
                for (const keyword of documentKeywords[category]) {
                    // Tìm tất cả các lần xuất hiện của từ khóa
                    const matches = normalizedText.match(new RegExp(`\\b${keyword}\\b`, 'gi'));
                    if (matches) {
                        score += matches.length;
                    }
                }
                
                scores[category] = score;
                
                // Lưu loại tài liệu có điểm cao nhất
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = category;
                }
            }
        }
        
        // Tính độ tin cậy (0-100)
        let confidence = 0;
        if (maxScore > 0) {
            // Tính tổng điểm của tất cả các loại
            const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
            // Độ tin cậy = điểm của loại tốt nhất / tổng điểm * 100
            confidence = Math.min(100, Math.round((maxScore / totalScore) * 100));
        }
        
        // Phát hiện các trường dữ liệu phổ biến dựa trên loại tài liệu
        const detectedFields: { [key: string]: string } = {};
        
        // Chúng ta sẽ chỉ trích xuất các trường nếu độ tin cậy > 60%
        if (confidence > 60) {
            switch (bestMatch) {
                case 'invoice':
                    detectedFields.invoiceNumber = this.extractFieldValue(text, [
                        /invoice\s*(?:#|number|num|no)[:\s]*([A-Z0-9\-]+)/i,
                        /inv[:\s]*([A-Z0-9\-]+)/i
                    ]);
                    detectedFields.date = this.extractFieldValue(text, [
                        /invoice\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                        /date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                        /(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/
                    ]);
                    detectedFields.total = this.extractFieldValue(text, [
                        /total[:\s]*(\$?\d+[,\.\d]+)/i,
                        /amount\s*due[:\s]*(\$?\d+[,\.\d]+)/i,
                        /(\$\d+[,\.\d]+)/
                    ]);
                    break;
                    
                case 'receipt':
                    detectedFields.receiptNumber = this.extractFieldValue(text, [
                        /receipt\s*(?:#|number|num|no)[:\s]*([A-Z0-9\-]+)/i,
                        /transaction\s*(?:id|#|number)[:\s]*([A-Z0-9\-]+)/i
                    ]);
                    detectedFields.date = this.extractFieldValue(text, [
                        /date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                        /(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/
                    ]);
                    detectedFields.total = this.extractFieldValue(text, [
                        /total[:\s]*(\$?\d+[,\.\d]+)/i,
                        /amount[:\s]*(\$?\d+[,\.\d]+)/i,
                        /(\$\d+[,\.\d]+)/
                    ]);
                    break;
                    
                case 'contract':
                    detectedFields.parties = this.extractFieldValue(text, [
                        /between\s*(.*?)\s*and\s*(.*?)(?:\s*dated|\s*\n|$)/i
                    ]);
                    detectedFields.effectiveDate = this.extractFieldValue(text, [
                        /effective\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                        /dated[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
                    ]);
                    break;
                    
                // Thêm các trường cho các loại tài liệu khác
                default:
                    // Dành cho các loại tài liệu khác
                    break;
            }
        }
        
        return {
            documentType: bestMatch || 'unknown',
            confidence: confidence,
            detectedFields: detectedFields
        };
    }
    
    /**
     * Trích xuất giá trị trường cụ thể từ văn bản sử dụng các biểu thức chính quy
     * @param text Văn bản để trích xuất
     * @param patterns Danh sách các mẫu regex để thử
     * @returns Giá trị trích xuất hoặc chuỗi rỗng nếu không tìm thấy
     */
    extractFieldValue(text: string, patterns: RegExp[]): string {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        return '';
    }
    
    /**
     * Trích xuất các trường dữ liệu dựa trên loại tài liệu xác định
     * @param text Văn bản đã trích xuất
     * @param tables Bảng đã trích xuất
     * @param documentType Loại tài liệu
     * @param customTemplatesPath Đường dẫn tới mẫu tùy chỉnh
     * @returns Các trường dữ liệu được trích xuất
     */
    async extractDocumentFields(
        text: string,
        tables: any[],
        documentType: string,
        customTemplatesPath: string = ''
    ): Promise<{ [key: string]: any }> {
        const fields: { [key: string]: any } = {};
        
        // Kiểm tra mẫu tùy chỉnh trước
        if (customTemplatesPath && fs.existsSync(customTemplatesPath)) {
            const templateFile = path.join(customTemplatesPath, `${documentType}.json`);
            if (fs.existsSync(templateFile)) {
                try {
                    const templateContent = fs.readFileSync(templateFile, 'utf8');
                    const template = JSON.parse(templateContent);
                    
                    // Sử dụng mẫu tùy chỉnh để trích xuất trường
                    if (template.fields && typeof template.fields === 'object') {
                        for (const [fieldName, patterns] of Object.entries(template.fields)) {
                            if (Array.isArray(patterns)) {
                                const regexPatterns = patterns.map((p: string) => new RegExp(p, 'i'));
                                fields[fieldName] = this.extractFieldValue(text, regexPatterns);
                            }
                        }
                        
                        return fields;
                    }
                } catch (error) {
                    console.warn(`Warning: Error processing custom template: ${(error as Error).message}`);
                    // Tiếp tục với logic mặc định
                }
            }
        }
        
        // Logic mặc định cho các loại tài liệu phổ biến
        switch (documentType) {
            case 'invoice':
                fields.invoiceNumber = this.extractFieldValue(text, [
                    /invoice\s*(?:#|number|num|no)[:\s]*([A-Z0-9\-]+)/i,
                    /inv[:\s]*([A-Z0-9\-]+)/i
                ]);
                fields.date = this.extractFieldValue(text, [
                    /invoice\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                    /date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
                ]);
                fields.dueDate = this.extractFieldValue(text, [
                    /due\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                    /payment\s*due[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
                ]);
                fields.total = this.extractFieldValue(text, [
                    /total[:\s]*(\$?\d+[,\.\d]+)/i,
                    /amount\s*due[:\s]*(\$?\d+[,\.\d]+)/i
                ]);
                fields.tax = this.extractFieldValue(text, [
                    /tax[:\s]*(\$?\d+[,\.\d]+)/i,
                    /vat[:\s]*(\$?\d+[,\.\d]+)/i
                ]);
                fields.subtotal = this.extractFieldValue(text, [
                    /subtotal[:\s]*(\$?\d+[,\.\d]+)/i,
                    /sub\s*total[:\s]*(\$?\d+[,\.\d]+)/i
                ]);
                
                // Nếu có bảng, cố gắng trích xuất các mục hóa đơn
                if (tables && tables.length > 0) {
                    const lineItems = this.extractInvoiceLineItems(tables);
                    if (lineItems.length > 0) {
                        fields.lineItems = lineItems;
                    }
                }
                break;
                
            case 'receipt':
                fields.receiptNumber = this.extractFieldValue(text, [
                    /receipt\s*(?:#|number|num|no)[:\s]*([A-Z0-9\-]+)/i,
                    /transaction\s*(?:id|#|number)[:\s]*([A-Z0-9\-]+)/i
                ]);
                fields.date = this.extractFieldValue(text, [
                    /date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                    /(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/
                ]);
                fields.total = this.extractFieldValue(text, [
                    /total[:\s]*(\$?\d+[,\.\d]+)/i,
                    /amount[:\s]*(\$?\d+[,\.\d]+)/i
                ]);
                fields.paymentMethod = this.extractFieldValue(text, [
                    /payment\s*method[:\s]*(\w+)/i,
                    /paid\s*(?:by|with|via)[:\s]*(\w+)/i
                ]);
                break;
                
            case 'contract':
                fields.effectiveDate = this.extractFieldValue(text, [
                    /effective\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                    /agreement\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
                ]);
                fields.parties = this.extractFieldValue(text, [
                    /between\s*(.*?)\s*and\s*(.*?)(?:\s*dated|\s*\n|$)/i
                ]);
                fields.terminationDate = this.extractFieldValue(text, [
                    /termination\s*date[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i,
                    /expires\s*(?:on|at)[:\s]*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i
                ]);
                break;
                
            case 'resume':
                fields.name = this.extractFieldValue(text, [
                    /^([A-Z][a-z]+\s+[A-Z][a-z]+)/m,
                    /Resume\s*of\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/i
                ]);
                fields.email = this.extractFieldValue(text, [
                    /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/
                ]);
                fields.phone = this.extractFieldValue(text, [
                    /(\+?[\d\-\(\)\s]{10,20})/
                ]);
                // Trích xuất kỹ năng, kinh nghiệm, v.v. yêu cầu phức tạp hơn
                break;
                
            default:
                // Giữ trống cho các loại tài liệu không được hỗ trợ
                break;
        }
        
        return fields;
    }
    
    /**
     * Trích xuất các mục hóa đơn từ bảng
     * @param tables Danh sách các bảng đã trích xuất
     * @returns Danh sách các mục hóa đơn
     */
    extractInvoiceLineItems(tables: any[]): any[] {
        const lineItems: any[] = [];
        
        // Tìm bảng có thể là danh sách các mục hóa đơn
        for (const table of tables) {
            if (!table || !table.rows || table.rows.length <= 1) {
                continue;
            }
            
            const rows = table.rows;
            const headerRow = rows[0];
            
            // Kiểm tra xem bảng có phải là danh sách các mục không
            const isItemTable = headerRow.some((col: string) => 
                /description|item|product|service/i.test(col)
            );
            
            if (isItemTable) {
                // Tìm chỉ mục cột cho các trường quan trọng
                const descIdx = headerRow.findIndex((col: string) => /description|item|product|service/i.test(col));
                const qtyIdx = headerRow.findIndex((col: string) => /qty|quantity|amount/i.test(col));
                const priceIdx = headerRow.findIndex((col: string) => /price|rate|cost/i.test(col));
                const totalIdx = headerRow.findIndex((col: string) => /total|amount|sum/i.test(col));
                
                // Trích xuất các mục nếu ít nhất có cột mô tả
                if (descIdx >= 0) {
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        
                        // Bỏ qua hàng trống
                        if (row.every((cell: string) => !cell || cell.trim() === '')) {
                            continue;
                        }
                        
                        const lineItem: { [key: string]: any } = {
                            description: descIdx >= 0 && row[descIdx] ? row[descIdx].trim() : '',
                        };
                        
                        if (qtyIdx >= 0 && row[qtyIdx]) {
                            lineItem.quantity = row[qtyIdx].trim();
                        }
                        
                        if (priceIdx >= 0 && row[priceIdx]) {
                            lineItem.price = row[priceIdx].trim();
                        }
                        
                        if (totalIdx >= 0 && row[totalIdx]) {
                            lineItem.total = row[totalIdx].trim();
                        }
                        
                        lineItems.push(lineItem);
                    }
                    
                    // Nếu đã tìm thấy bảng mục, dừng lại
                    if (lineItems.length > 0) {
                        break;
                    }
                }
            }
        }
        
        return lineItems;
    }

    /**
     * Xử lý PDF đa ngôn ngữ với OCR nâng cao
     * @param pdfBuffer - Buffer chứa dữ liệu PDF
     * @param languages - Mảng các ngôn ngữ hỗ trợ
     * @param options - Các tùy chọn xử lý
     * @returns Kết quả xử lý bao gồm văn bản trích xuất và thống kê ngôn ngữ
     */
    async processMultilingualPDF(
        pdfBuffer: Buffer, 
        languages: string[] = ['eng'], 
        options: {
            startPage?: number, 
            endPage?: number, 
            enhanceImage?: boolean,
            dpi?: number
        } = {}
    ): Promise<{ text: string, languageStats?: Record<string, number> }> {
        try {
            // Lưu PDF vào file tạm thời để xử lý
            const tempDir = os.tmpdir();
            const tempPdfPath = path.join(tempDir, `multilingual-pdf-${Date.now()}.pdf`);
            fs.writeFileSync(tempPdfPath, pdfBuffer);
            
            // Xác định các trang cần xử lý
            const pdfData = await pdf(pdfBuffer as any, { max: 1 });
            const totalPages = pdfData.numpages;
            
            const startPage = options.startPage || 1;
            const endPage = options.endPage || totalPages;
            
            // Kiểm tra tham số đầu vào
            if (startPage < 1 || startPage > totalPages) {
                throw new Error(`Trang bắt đầu không hợp lệ: ${startPage}. PDF có ${totalPages} trang.`);
            }
            
            if (endPage < startPage || endPage > totalPages) {
                throw new Error(`Trang kết thúc không hợp lệ: ${endPage}. PDF có ${totalPages} trang.`);
            }
            
            // Tạo danh sách các trang cần xử lý
            const pageNumbers: number[] = [];
            for (let i = startPage; i <= endPage; i++) {
                pageNumbers.push(i);
            }
            
            console.log(`Xử lý PDF đa ngôn ngữ: ${pageNumbers.length} trang, ngôn ngữ: ${languages.join(', ')}`);
            
            // Thực hiện OCR với tùy chọn nâng cao
            const results = await this.performOcrOnPdf(tempPdfPath, pageNumbers, {
                language: languages[0],
                additionalLanguages: languages.slice(1),
                autoDetect: languages.includes('auto'),
                enhanceResults: options.enhanceImage || false,
                enhancementLevel: options.enhanceImage ? 'medium' : 'none'
            });
            
            // Dọn dẹp tệp tạm thời
            try {
                fs.unlinkSync(tempPdfPath);
            } catch (error) {
                // Bỏ qua lỗi khi xóa tệp tạm
            }
            
            return {
                text: results.text,
                languageStats: results.languageStats
            };
        } catch (error: any) {
            throw new Error(`Lỗi khi xử lý PDF đa ngôn ngữ: ${error.message}`);
        }
    }

    /**
     * Phát hiện ngôn ngữ từ văn bản đầu vào
     * @param text - Văn bản cần phát hiện ngôn ngữ
     * @returns Mã ngôn ngữ Tesseract tương ứng
     */
    async detectLanguage(text: string): Promise<string> {
        try {
            // Sử dụng hàm triển khai trực tiếp thay vì franc
            const langCode = detectLanguageSimple(text);
            if (langCode === 'und') {
                console.log('Không thể phát hiện ngôn ngữ, sử dụng ngôn ngữ mặc định (tiếng Anh)');
                return 'eng';
            }
            
            // Chuyển đổi mã ISO 639-3 sang mã Tesseract
            const tesseractCode = this.mapLanguageCodeToTesseract(langCode);
            console.log(`Phát hiện ngôn ngữ: ${langCode} -> Mã Tesseract: ${tesseractCode}`);
            return tesseractCode;
        } catch (error) {
            console.log('Lỗi khi phát hiện ngôn ngữ:', error);
            return 'eng'; // Trả về tiếng Anh như mặc định
        }
    }
    
    /**
     * Tạo thống kê ngôn ngữ từ văn bản
     * @param text - Văn bản cần phân tích
     * @returns Thống kê về tần suất của các ngôn ngữ được phát hiện
     */
    async generateLanguageStats(text: string): Promise<Record<string, number>> {
        if (!text || text.trim() === '') {
            return { 'eng': 100 }; // Mặc định là tiếng Anh nếu không có văn bản
        }
        
        try {
            // Chia văn bản thành các đoạn để phân tích
            const paragraphs = text
                .split(/\n\s*\n/)
                .filter(para => para.trim().length > 30); // Chỉ xem xét các đoạn đủ dài
            
            if (paragraphs.length === 0) {
                return { 'eng': 100 };
            }
            
            // Đếm số lần xuất hiện của mỗi ngôn ngữ
            const languageCounts: Record<string, number> = {};
            let totalParagraphs = 0;
            
            for (const paragraph of paragraphs) {
                // Sử dụng hàm triển khai trực tiếp thay vì franc
                const detectedLang = detectLanguageSimple(paragraph);
                
                if (detectedLang !== 'und') {
                    // Chuyển đổi sang mã Tesseract
                    const tesseractCode = this.mapLanguageCodeToTesseract(detectedLang);
                    
                    // Cập nhật số lần đếm
                    languageCounts[tesseractCode] = (languageCounts[tesseractCode] || 0) + 1;
                    totalParagraphs++;
                }
            }
            
            // Nếu không phát hiện được ngôn ngữ nào
            if (totalParagraphs === 0) {
                return { 'eng': 100 };
            }
            
            // Chuyển đổi số lần đếm thành phần trăm
            const languageStats: Record<string, number> = {};
            for (const lang in languageCounts) {
                languageStats[lang] = Math.round((languageCounts[lang] / totalParagraphs) * 100);
            }
            
            return languageStats;
        } catch (error) {
            console.log('Lỗi khi tạo thống kê ngôn ngữ:', error);
            return { 'eng': 100 }; // Trả về tiếng Anh như mặc định
        }
    }
    
    /**
     * Nâng cao chất lượng ảnh trước khi thực hiện OCR
     * @param imagePath - Đường dẫn đến ảnh cần xử lý
     * @returns Đường dẫn đến ảnh đã được nâng cao
     */
    async enhanceImage(imagePath: string): Promise<string> {
        try {
            const enhancedImagePath = imagePath.replace('.png', '_enhanced.png');
            
            // Sử dụng thư viện sharp để nâng cao chất lượng ảnh
            await sharp(imagePath)
                .greyscale() // Chuyển sang thang độ xám
                .normalize() // Chuẩn hóa tương phản
                .sharpen() // Làm sắc nét ảnh
                .threshold(128) // Nhị phân hóa ảnh (tùy chọn)
                .toFile(enhancedImagePath);
            
            return enhancedImagePath;
        } catch (error) {
            console.log('Lỗi khi xử lý ảnh:', error);
            return imagePath; // Trả về ảnh gốc nếu có lỗi
        }
    }
    
    /**
     * Thực hiện OCR đa ngôn ngữ trên một ảnh
     * @param imagePath - Đường dẫn đến ảnh cần OCR
     * @param languages - Danh sách ngôn ngữ để sử dụng trong OCR
     * @returns Văn bản đã trích xuất
     */
    async performMultilingualOCR(imagePath: string, languages: string[]): Promise<string> {
        try {
            // Kết hợp tất cả ngôn ngữ thành một chuỗi hợp lệ cho Tesseract
            const combinedLanguages = languages.join('+');
            
            // Xác minh các tham số trước khi gọi Tesseract
            if (!fs.existsSync(imagePath)) {
                throw new Error(`Không tìm thấy ảnh tại đường dẫn: ${imagePath}`);
            }
            
            if (!combinedLanguages) {
                throw new Error('Không có ngôn ngữ nào được chỉ định cho OCR');
            }
            
            console.log(`Thực hiện OCR với ngôn ngữ: ${combinedLanguages}`);
            
            // Thực hiện OCR với Tesseract
            const result = await Tesseract.recognize(imagePath, combinedLanguages, {
                logger: (message: any) => console.log(`Tesseract: ${message.status}`),
            });
            
            return result.data.text;
        } catch (error: any) {
            console.error('Lỗi trong quá trình OCR:', error);
            
            // Xử lý các lỗi cụ thể và trả về thông báo lỗi hữu ích
            if (error.message && error.message.includes('Error: Could not initialize')) {
                throw new Error('Không thể khởi tạo Tesseract. Vui lòng kiểm tra cài đặt Tesseract OCR.');
            } else if (error.message && error.message.includes('language')) {
                throw new Error(`Lỗi ngôn ngữ OCR: ${error.message}. Vui lòng kiểm tra các gói ngôn ngữ Tesseract đã được cài đặt.`);
            }
            
            // Trả về thông báo lỗi chung nếu không nhận dạng được lỗi cụ thể
            throw new Error(`Lỗi OCR: ${error.message || 'Lỗi không xác định'}`);
        }
    }
    
    /**
     * Tính toán độ tương đồng giữa hai chuỗi
     * @param str1 - Chuỗi thứ nhất
     * @param str2 - Chuỗi thứ hai
     * @returns Chỉ số tương đồng (0-1)
     */
    private calculateStringSimilarityInternal(str1: string, str2: string): number {
        // Độ dài của chuỗi dài hơn
        const longerLength = Math.max(str1.length, str2.length);
        if (longerLength === 0) {
            return 1.0;
        }
        
        // Tính khoảng cách Levenshtein
        const distance = this.levenshteinDistance(str1, str2);
        
        // Chuẩn hóa và trả về độ tương đồng
        return (longerLength - distance) / longerLength;
    }
    
    /**
     * Tính khoảng cách Levenshtein giữa hai chuỗi
     * @param str1 - Chuỗi thứ nhất
     * @param str2 - Chuỗi thứ hai
     * @returns Khoảng cách Levenshtein
     */
    private levenshteinDistance(str1: string, str2: string): number {
        // Ma trận khoảng cách
        const matrix: number[][] = [];
        
        // Khởi tạo ma trận
        for (let i = 0; i <= str1.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str2.length; j++) {
            matrix[0][j] = j;
        }
        
        // Tính toán khoảng cách
        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Thay thế
                        matrix[i][j - 1] + 1,     // Chèn
                        matrix[i - 1][j] + 1      // Xóa
                    );
                }
            }
        }
        
        return matrix[str1.length][str2.length];
    }

    private async processImages(imageBuffer: Buffer | any, index: number): Promise<any> {
        // ... existing code ...
    }
    
    private logMessage(message: string): void {
        // ... existing code ...
    }

    /**
     * Chuyển đổi mã ngôn ngữ ISO 639-3 sang mã ngôn ngữ Tesseract
     * @param isoCode - Mã ISO 639-3
     * @returns Mã ngôn ngữ Tesseract tương ứng
     */
    mapLanguageCodeToTesseract(isoCode: string): string {
        // Bảng ánh xạ từ mã ISO sang mã Tesseract
        const langMap: Record<string, string> = {
            'eng': 'eng',
            'vie': 'vie',
            'fra': 'fra',
            'deu': 'deu',
            'ita': 'ita',
            'spa': 'spa',
            'por': 'por',
            'rus': 'rus',
            'jpn': 'jpn',
            'kor': 'kor',
            'chi': 'chi_sim', // Tiếng Trung giản thể
            'zho': 'chi_sim',
            'tha': 'tha',
            'ara': 'ara',
            'hin': 'hin',
            'ben': 'ben',
            'dan': 'dan',
            'nld': 'nld',
            'fin': 'fin',
            'ell': 'ell', // Tiếng Hy Lạp
            'hun': 'hun',
            'ind': 'ind',
            'nor': 'nor',
            'pol': 'pol',
            'ron': 'ron', // Tiếng Romania
            'swe': 'swe',
            'tur': 'tur',
            'ukr': 'ukr',
            'heb': 'heb', // Tiếng Do Thái
        };
        
        return langMap[isoCode] || 'eng';
    }
}

// Export for n8n 1.83.2
module.exports = { nodeType: ExtractPdfNode }; 