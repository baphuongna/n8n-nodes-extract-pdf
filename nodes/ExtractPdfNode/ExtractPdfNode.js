"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractPdfNode = void 0;
const fs = __importStar(require("fs"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
class ExtractPdfNode {
    constructor() {
        this.description = {
            displayName: 'Extract PDF',
            name: 'extractPdf',
            group: ['input'],
            version: 1,
            description: 'Extract text from a PDF file',
            defaults: {
                name: 'Extract PDF',
            },
            inputs: ['main'],
            outputs: ['main'],
            properties: [
                {
                    displayName: 'PDF File',
                    name: 'pdfFile',
                    type: 'file',
                    filePicker: true,
                    filePickerOptions: {
                        allowedTypes: ['application/pdf'],
                    },
                    required: true,
                    default: '',
                    description: 'The PDF file to extract text from',
                },
                {
                    displayName: 'Options',
                    name: 'options',
                    type: 'collection',
                    placeholder: 'Add Option',
                    default: {},
                    options: [
                        {
                            displayName: 'Page Range',
                            name: 'pageRange',
                            type: 'string',
                            default: '',
                            placeholder: '1-5, 8, 11-13',
                            description: 'Range of pages to extract (e.g., "1-5, 8, 11-13"). Leave empty to extract all pages.',
                        },
                        {
                            displayName: 'Include Metadata',
                            name: 'includeMetadata',
                            type: 'boolean',
                            default: false,
                            description: 'Whether to include PDF metadata in the output',
                        },
                        {
                            displayName: 'Max File Size (MB)',
                            name: 'maxFileSize',
                            type: 'number',
                            default: 100,
                            description: 'Maximum file size to process in MB (large files may cause performance issues)',
                        },
                        {
                            displayName: 'Continue On Error',
                            name: 'continueOnError',
                            type: 'boolean',
                            default: false,
                            description: 'Continue execution even if extraction fails for some pages',
                        },
                        {
                            displayName: 'Process In Chunks',
                            name: 'processInChunks',
                            type: 'boolean',
                            default: true,
                            description: 'Process large PDF files in smaller chunks to improve performance',
                        },
                        {
                            displayName: 'Chunk Size (Pages)',
                            name: 'chunkSize',
                            type: 'number',
                            default: 10,
                            description: 'Number of pages to process in each chunk (when processing in chunks)',
                            displayOptions: {
                                show: {
                                    processInChunks: [true],
                                },
                            },
                        },
                        {
                            displayName: 'Show Progress',
                            name: 'showProgress',
                            type: 'boolean',
                            default: true,
                            description: 'Show progress information during processing',
                            displayOptions: {
                                show: {
                                    processInChunks: [true],
                                },
                            },
                        },
                    ],
                },
            ],
        };
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const items = this.getInputData();
            const returnData = [];
            try {
                // Get parameters from the node
                const pdfFile = this.getNodeParameter('pdfFile', 0);
                if (!pdfFile || !pdfFile.uri) {
                    throw new Error('No PDF file specified');
                }
                const filePath = pdfFile.uri;
                const options = this.getNodeParameter('options', 0, {});
                // Check if file exists
                if (!fs.existsSync(filePath)) {
                    throw new Error(`PDF file not found: ${filePath}`);
                }
                // Check file size
                const fileStats = fs.statSync(filePath);
                const fileSizeMB = fileStats.size / (1024 * 1024);
                const maxFileSize = options.maxFileSize || 100;
                if (fileSizeMB > maxFileSize) {
                    throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the maximum allowed size (${maxFileSize} MB)`);
                }
                // Read file with memory efficiency for large files
                const dataBuffer = fs.readFileSync(filePath);
                // Check if PDF is encrypted/password protected
                // This is a basic check - pdf-parse will throw a specific error for encrypted PDFs
                const pdfHeader = dataBuffer.slice(0, 100).toString();
                if (pdfHeader.includes('/Encrypt')) {
                    throw new Error('The PDF file appears to be encrypted or password protected. This node cannot process protected PDFs.');
                }
                // Get initial PDF info to determine total page count
                const initialPdfData = yield (0, pdf_parse_1.default)(dataBuffer, { max: 1 }); // Only parse first page to get document info
                const totalPages = initialPdfData.numpages;
                // Parse page range if specified
                let pageNumbers = [];
                if (options.pageRange) {
                    try {
                        pageNumbers = this.parsePageRange(options.pageRange);
                        // Check if any requested pages exceed the document page count
                        const maxRequestedPage = Math.max(...pageNumbers);
                        if (maxRequestedPage > totalPages) {
                            throw new Error(`Page range includes page ${maxRequestedPage}, but the document only has ${totalPages} page(s)`);
                        }
                    }
                    catch (error) {
                        if (error instanceof Error) {
                            throw error;
                        }
                        throw new Error(`Invalid page range format: ${error.message}`);
                    }
                }
                else {
                    // If no specific pages requested, process all pages
                    for (let i = 1; i <= totalPages; i++) {
                        pageNumbers.push(i);
                    }
                }
                // Configure base PDF parsing options
                const basePdfOptions = {
                    // Add error handling for parsing
                    onError: (err) => {
                        if (!options.continueOnError) {
                            throw err;
                        }
                        console.error(`Warning: Error parsing PDF: ${err.message}`);
                        return;
                    }
                };
                let allText = '';
                let performance = { startTime: Date.now(), endTime: 0, totalPages: pageNumbers.length };
                // Process in chunks for large documents if enabled
                if (options.processInChunks && pageNumbers.length > (options.chunkSize || 10)) {
                    const chunkSize = options.chunkSize || 10;
                    const chunks = this.chunkArray(pageNumbers, chunkSize);
                    let processedPages = 0;
                    for (let i = 0; i < chunks.length; i++) {
                        const chunkPageNumbers = chunks[i];
                        const chunkPdfOptions = Object.assign(Object.assign({}, basePdfOptions), { pageNumbers: chunkPageNumbers });
                        try {
                            // Process each chunk
                            const chunkData = yield (0, pdf_parse_1.default)(dataBuffer, chunkPdfOptions);
                            allText += chunkData.text;
                            // Update processed pages count and show progress if enabled
                            processedPages += chunkPageNumbers.length;
                            if (options.showProgress) {
                                const progressPercent = (processedPages / pageNumbers.length * 100).toFixed(1);
                                console.log(`Processing PDF: ${progressPercent}% complete (${processedPages}/${pageNumbers.length} pages)`);
                            }
                        }
                        catch (error) {
                            if (options.continueOnError) {
                                console.error(`Warning: Error processing chunk ${i + 1} (pages ${chunkPageNumbers.join(',')}): ${error.message}`);
                                continue;
                            }
                            else {
                                throw error;
                            }
                        }
                    }
                    performance.endTime = Date.now();
                }
                else {
                    // Process all requested pages at once for smaller documents
                    if (pageNumbers.length > 0) {
                        basePdfOptions.pageNumbers = pageNumbers;
                    }
                    const data = yield (0, pdf_parse_1.default)(dataBuffer, basePdfOptions);
                    allText = data.text;
                    performance.endTime = Date.now();
                }
                // Calculate performance metrics
                const processingTimeMs = performance.endTime - performance.startTime;
                const processingTimeSec = (processingTimeMs / 1000).toFixed(2);
                const pagesPerSecond = (performance.totalPages / (processingTimeMs / 1000)).toFixed(2);
                // Check if text is empty (might be a scanned PDF)
                if (allText.trim() === '' && pageNumbers.length > 0) {
                    // Return warning about possible scanned PDF
                    const output = {
                        text: '',
                        warning: 'No text was extracted. This might be a scanned PDF or an image-based PDF without text layer.',
                        performance: {
                            processingTime: `${processingTimeSec}s`,
                            pagesProcessed: pageNumbers.length,
                            pagesPerSecond
                        }
                    };
                    // Include metadata if requested
                    if (options.includeMetadata) {
                        output.metadata = {
                            info: initialPdfData.info,
                            metadata: initialPdfData.metadata,
                            numberOfPages: initialPdfData.numpages,
                            version: initialPdfData.version
                        };
                    }
                    returnData.push({ json: output, parameters: {} });
                }
                else {
                    // Prepare output
                    const output = {
                        text: allText,
                        performance: {
                            processingTime: `${processingTimeSec}s`,
                            pagesProcessed: pageNumbers.length,
                            pagesPerSecond
                        }
                    };
                    // Include metadata if requested
                    if (options.includeMetadata) {
                        output.metadata = {
                            info: initialPdfData.info,
                            metadata: initialPdfData.metadata,
                            numberOfPages: initialPdfData.numpages,
                            version: initialPdfData.version
                        };
                    }
                    returnData.push({ json: output, parameters: {} });
                }
                // Return the final result as an array of arrays
                return [returnData];
            }
            catch (error) {
                // Enhanced error handling for specific PDF errors
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('Invalid PDF structure')) {
                    throw new Error('The PDF file has an invalid structure and cannot be processed.');
                }
                else if (errorMessage.includes('password')) {
                    throw new Error('The PDF file is password protected. This node cannot process protected PDFs.');
                }
                else if (errorMessage.includes('Unexpected end of file')) {
                    throw new Error('The PDF file is truncated or corrupted. Please check the file integrity.');
                }
                else {
                    throw new Error(`Error extracting text from PDF: ${errorMessage}`);
                }
            }
        });
    }
    parsePageRange(pageRange) {
        const pageNumbers = [];
        const parts = pageRange.split(',').map(part => part.trim());
        for (const part of parts) {
            if (part.includes('-')) {
                // Process range (e.g., "1-5")
                const [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
                if (isNaN(start) || isNaN(end)) {
                    throw new Error(`Invalid page range format: ${part}`);
                }
                if (start <= 0 || end <= 0) {
                    throw new Error(`Page numbers must be greater than 0: ${part}`);
                }
                if (start > end) {
                    throw new Error(`Invalid range: start page (${start}) is greater than end page (${end})`);
                }
                for (let i = start; i <= end; i++) {
                    pageNumbers.push(i);
                }
            }
            else {
                // Process single page
                const pageNum = parseInt(part, 10);
                if (isNaN(pageNum)) {
                    throw new Error(`Invalid page number: ${part}`);
                }
                if (pageNum <= 0) {
                    throw new Error(`Page numbers must be greater than 0: ${pageNum}`);
                }
                pageNumbers.push(pageNum);
            }
        }
        return pageNumbers;
    }
    // Helper function to split array into chunks
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
exports.ExtractPdfNode = ExtractPdfNode;
//# sourceMappingURL=ExtractPdfNode.js.map