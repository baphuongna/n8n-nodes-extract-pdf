/**
 * Định nghĩa các loại dữ liệu cho ExtractPdfNode
 * @author AI Assistant
 * @version 1.0.0
 */

// Logger interface
export interface Logger {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug?: (message: string) => void;
}

// Language detection
export interface LanguageDetectionResult {
    language: string;
    confidence: number;
}

// Image enhancement
export interface ImageEnhancementOptions {
    contrast?: number;
    brightness?: number;
    sharpness?: number;
    denoise?: boolean;
    format?: string;
}

// OCR options
export interface OcrOptions {
    language?: string;
    useParallel?: boolean;
    maxWorkers?: number;
    useCache?: boolean;
    enhanceImage?: boolean;
    autoDetect?: boolean;
    verbose?: boolean;
    dpi?: number;
    scale?: number;
    timeout?: number;
    pagesPerBatch?: number;
}

// OCR result
export interface OcrResult {
    text: string;
    pageCount: number;
    processedPages: number[];
    language: string;
    hasMultipleLanguages: boolean;
    languageStats: Array<{ language: string; confidence: number }>;
    performance: {
        totalProcessingTime: number;
        pagesPerSecond: number;
        startTime: number;
        endTime: number;
    };
}

// Worker thread data
export interface WorkerData {
    imageBuffer: Buffer;
    options: OcrOptions;
    type: string;
}

// Cache options for NodeCache
export interface CacheOptions {
    stdTTL: number;
    checkperiod: number;
    useClones: boolean;
    deleteOnExpire?: boolean;
    maxKeys?: number;
} 