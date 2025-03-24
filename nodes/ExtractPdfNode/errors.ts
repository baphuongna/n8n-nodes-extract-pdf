import { ERROR_CODES, ERROR_MESSAGES } from './constants';

export class ExtractPdfError extends Error {
    code: string;
    details?: any;

    constructor(code: string, params: string[] = [], details?: any) {
        let message = ERROR_MESSAGES[code] || 'Unknown error occurred';
        
        // Thay thế các placeholder {0}, {1}, ... với các tham số
        params.forEach((param, index) => {
            message = message.replace(`{${index}}`, param);
        });

        super(message);
        this.name = 'ExtractPdfError';
        this.code = code;
        this.details = details;

        // Đảm bảo prototype chain được thiết lập đúng
        Object.setPrototypeOf(this, ExtractPdfError.prototype);
    }

    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details
        };
    }
}

export class ValidationError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.INVALID_PAGE_RANGE, [message], details);
        this.name = 'ValidationError';
    }
}

export class FileNotFoundError extends ExtractPdfError {
    constructor(filePath: string) {
        super(ERROR_CODES.FILE_NOT_FOUND, [filePath]);
        this.name = 'FileNotFoundError';
    }
}

export class OcrError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.OCR_FAILED, [message], details);
        this.name = 'OcrError';
    }
}

export class ImageExtractionError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.IMAGE_EXTRACTION_FAILED, [message], details);
        this.name = 'ImageExtractionError';
    }
}

export class TableExtractionError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.TABLE_EXTRACTION_FAILED, [message], details);
        this.name = 'TableExtractionError';
    }
}

export class EnhancementError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.ENHANCEMENT_FAILED, [message], details);
        this.name = 'EnhancementError';
    }
}

export class LanguageDetectionError extends ExtractPdfError {
    constructor(message: string, details?: any) {
        super(ERROR_CODES.LANGUAGE_DETECTION_FAILED, [message], details);
        this.name = 'LanguageDetectionError';
    }
} 