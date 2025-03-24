declare module 'languagedetect' {
    interface LanguageDetection {
        detect(text: string, limit?: number): [string, number][];
    }

    interface LanguageDetector {
        new(): LanguageDetection;
    }

    const LanguageDetect: LanguageDetector;
    export = LanguageDetect;
}

declare module 'node-cache' {
    interface NodeCacheOptions {
        stdTTL?: number;
        checkperiod?: number;
        useClones?: boolean;
        deleteOnExpire?: boolean;
        maxKeys?: number;
    }

    class NodeCache {
        constructor(options?: NodeCacheOptions);
        get<T>(key: string): T | undefined;
        set<T>(key: string, value: T, ttl?: number): boolean;
        del(key: string | string[]): number;
        ttl(key: string, ttl: number): boolean;
        keys(): string[];
        has(key: string): boolean;
        flushAll(): void;
        close(): void;
    }

    export = NodeCache;
}

declare module 'pdf-img-convert' {
    interface ConvertOptions {
        page_numbers?: number[];
        scale?: number;
        quality?: number;
        format?: string;
        dpi?: number;
    }

    export function convert(
        pdfPath: string,
        options?: ConvertOptions
    ): Promise<Buffer[]>;
}

declare module 'tesseract.js' {
    interface TesseractResult {
        data: {
            text: string;
            confidence: number;
            lines: Array<{
                text: string;
                confidence: number;
            }>;
        };
    }

    interface TesseractOptions {
        logger?: (message: unknown) => void;
    }

    export function recognize(
        image: string | Buffer | Uint8Array,
        lang: string,
        options?: TesseractOptions
    ): Promise<TesseractResult>;
}

declare module '../imageExtraction' {
    export function enhanceImage(imagePath: string): Promise<string>;
}

declare module '../languageDetection' {
    export interface LanguageDetectionResult {
        language: string;
        confidence: number;
    }

    export function detectLanguage(text: string): Promise<string>;
    export function mapLanguageCodeToTesseract(langCode: string): string;
}

declare module 'n8n-workflow' {
    export interface INodeExecutionData {
        json: Record<string, unknown>;
        binary?: Record<string, unknown>;
        parameters?: Record<string, unknown>;
    }

    export interface INodeType {
        description: INodeTypeDescription;
        execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]>;
    }

    export interface INodeTypeDescription {
        displayName: string;
        name: string;
        group: string[];
        version: number;
        description: string;
        defaults: {
            name: string;
        };
        inputs: string[];
        outputs: string[];
        properties: INodeProperties[];
    }

    export interface INodeProperties {
        displayName: string;
        name: string;
        type: string;
        default?: unknown;
        options?: Array<{
            name: string;
            value: string;
            description?: string;
        }>;
        description?: string;
        placeholder?: string;
        displayOptions?: {
            show?: Record<string, string[]>;
        };
    }

    export class NodeOperationError extends Error {
        constructor(node: string, message: string, description?: string);
    }

    export interface IExecuteFunctions {
        getInputData(): INodeExecutionData[];
        getNodeParameter(parameterName: string, itemIndex: number, fallbackValue?: unknown): unknown;
    }
}

declare module 'natural' {
    export function PorterStemmer(): {
        stem(word: string): string;
    };
    
    export function WordTokenizer(): {
        tokenize(text: string): string[];
    };
    
    export function SentenceTokenizer(): {
        tokenize(text: string): string[];
    };
    
    export function NGrams(): {
        ngrams(text: string, n: number): string[][];
    };
}

declare module 'sharp' {
    interface Sharp {
        resize(width?: number, height?: number, options?: object): Sharp;
        rotate(angle?: number): Sharp;
        sharpen(sigma?: number, flat?: number, jagged?: number): Sharp;
        normalize(options?: object): Sharp;
        modulate(options: { brightness?: number; saturation?: number; hue?: number }): Sharp;
        linear(a?: number, b?: number): Sharp;
        median(size?: number): Sharp;
        toBuffer(): Promise<Buffer>;
        toFile(path: string): Promise<void>;
    }

    interface SharpOptions {
        failOnError?: boolean;
    }

    function sharp(input: string | Buffer, options?: SharpOptions): Sharp;
    export = sharp;
}

declare module 'pdf-parse' {
    interface PDFData {
        numpages: number;
        numrender: number;
        info: {
            PDFFormatVersion: string;
            IsAcroFormPresent: boolean;
            IsXFAPresent: boolean;
            [key: string]: unknown;
        };
        metadata: Record<string, unknown>;
        text: string;
        version: string;
    }

    interface PDFOptions {
        pagerender?: (pageData: any) => string;
        max?: number;
        version?: string;
    }

    function PDFParse(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
    export = PDFParse;
}

declare module 'franc' {
    export default function franc(text: string, options?: {
        minLength?: number;
        whitelist?: string[];
        blacklist?: string[];
        only?: string[];
    }): string;
} 