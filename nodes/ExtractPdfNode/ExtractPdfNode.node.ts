import * as fs from 'fs';
import { INodeExecutionData, INodeType, INodeTypeDescription, NodeOperationError } from 'n8n-workflow';
import pdf from 'pdf-parse';

interface PDFOptions {
    pageRange?: string;
    includeMetadata?: boolean;
    maxFileSize?: number;
    chunkSize?: number;
    showProgress?: boolean;
}

export class ExtractPdfNode implements INodeType {
    description: INodeTypeDescription = {
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
                displayName: 'Input Type',
                name: 'inputType',
                type: 'options',
                options: [
                    {
                        name: 'File Path',
                        value: 'filePath'
                    },
                    {
                        name: 'Binary Data',
                        value: 'binaryData'
                    }
                ],
                default: 'filePath',
                description: 'How to input the PDF file'
            },
            {
                displayName: 'PDF File Path',
                name: 'pdfFile',
                type: 'string',
                default: '',
                description: 'The path to the PDF file',
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
                description: 'Name of the binary property containing the PDF file',
                displayOptions: {
                    show: {
                        inputType: ['binaryData']
                    }
                }
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

    async execute(this: any): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];
        
        try {
            // Get input type parameter
            const inputType = this.getNodeParameter('inputType', 0) as string;
            let dataBuffer: Buffer;
            
            if (inputType === 'filePath') {
                // Get parameters from the node for file path input
                const pdfFile = this.getNodeParameter('pdfFile', 0) as string;
                if (!pdfFile) {
                    throw new Error('No PDF file path specified');
                }
                
                const filePath = pdfFile;
                
                // Check if file exists
                if (!fs.existsSync(filePath)) {
                    throw new Error(`PDF file not found: ${filePath}`);
                }

                // Check file size
                const fileStats = fs.statSync(filePath);
                const fileSizeMB = fileStats.size / (1024 * 1024);
                const options = this.getNodeParameter('options', 0, {}) as PDFOptions & { 
                    continueOnError?: boolean,
                    processInChunks?: boolean,
                    showProgress?: boolean
                };
                const maxFileSize = options.maxFileSize || 100;
                
                if (fileSizeMB > maxFileSize) {
                    throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the maximum allowed size (${maxFileSize} MB)`);
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
                
                // Check file size
                const options = this.getNodeParameter('options', 0, {}) as PDFOptions & { 
                    continueOnError?: boolean,
                    processInChunks?: boolean,
                    showProgress?: boolean
                };
                const fileSizeMB = dataBuffer.length / (1024 * 1024);
                const maxFileSize = options.maxFileSize || 100;
                
                if (fileSizeMB > maxFileSize) {
                    throw new Error(`File size (${fileSizeMB.toFixed(2)} MB) exceeds the maximum allowed size (${maxFileSize} MB)`);
                }
            }
            
            const options = this.getNodeParameter('options', 0, {}) as PDFOptions & { 
                continueOnError?: boolean,
                processInChunks?: boolean,
                showProgress?: boolean
            };
            
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
            if (options.pageRange) {
                try {
                    pageNumbers = this.parsePageRange(options.pageRange);
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
                    const chunkPdfOptions = { ...basePdfOptions, pageNumbers: chunkPageNumbers };
                    
                    try {
                        // Process each chunk
                        const chunkData = await pdf(dataBuffer, chunkPdfOptions);
                        allText += chunkData.text;
                        
                        // Update processed pages count and show progress if enabled
                        processedPages += chunkPageNumbers.length;
                        
                        if (options.showProgress) {
                            const progressPercent = (processedPages / pageNumbers.length * 100).toFixed(1);
                            console.log(`Processing PDF: ${progressPercent}% complete (${processedPages}/${pageNumbers.length} pages)`);
                        }
                    } catch (error) {
                        if (options.continueOnError) {
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
            
            // Calculate performance metrics
            const processingTimeMs = performance.endTime - performance.startTime;
            const processingTimeSec = (processingTimeMs / 1000).toFixed(2);
            const pagesPerSecond = (performance.totalPages / (processingTimeMs / 1000)).toFixed(2);
            
            // Check if text is empty (might be a scanned PDF)
            if (allText.trim() === '' && pageNumbers.length > 0) {
                // Return warning about possible scanned PDF
                const output: any = { 
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
            } else {
                // Prepare output
                const output: any = { 
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
        } catch (error) {
            // Enhanced error handling for specific PDF errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes('Invalid PDF structure')) {
                throw new Error('The PDF file has an invalid structure and cannot be processed.');
            } else if (errorMessage.includes('password')) {
                throw new Error('The PDF file is password protected. This node cannot process protected PDFs.');
            } else if (errorMessage.includes('Unexpected end of file')) {
                throw new Error('The PDF file is truncated or corrupted. Please check the file integrity.');
            } else {
                throw new Error(`Error extracting text from PDF: ${errorMessage}`);
            }
        }
    }
    
    private parsePageRange(pageRange: string): number[] {
        const pageNumbers: number[] = [];
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
            } else {
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
    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
} 