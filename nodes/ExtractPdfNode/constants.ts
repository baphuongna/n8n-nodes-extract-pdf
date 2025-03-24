/**
 * Các hằng số và mã lỗi cho ExtractPdfNode
 */

export const ERROR_CODES = {
    FILE_NOT_FOUND: 'ERR_FILE_NOT_FOUND',
    INVALID_BINARY: 'ERR_INVALID_BINARY',
    INVALID_PAGE_RANGE: 'ERR_INVALID_PAGE_RANGE',
    OCR_FAILED: 'ERR_OCR_FAILED',
    IMAGE_EXTRACTION_FAILED: 'ERR_IMAGE_EXTRACTION_FAILED',
    TABLE_EXTRACTION_FAILED: 'ERR_TABLE_EXTRACTION_FAILED',
    ENHANCEMENT_FAILED: 'ERR_ENHANCEMENT_FAILED',
    LANGUAGE_DETECTION_FAILED: 'ERR_LANG_DETECTION_FAILED'
};

export const ERROR_MESSAGES = {
    [ERROR_CODES.FILE_NOT_FOUND]: 'PDF file not found: {0}',
    [ERROR_CODES.INVALID_BINARY]: 'No binary data found in property "{0}"',
    [ERROR_CODES.INVALID_PAGE_RANGE]: 'Invalid page range: {0}',
    [ERROR_CODES.OCR_FAILED]: 'OCR processing failed: {0}',
    [ERROR_CODES.IMAGE_EXTRACTION_FAILED]: 'Image extraction failed: {0}',
    [ERROR_CODES.TABLE_EXTRACTION_FAILED]: 'Table extraction failed: {0}',
    [ERROR_CODES.ENHANCEMENT_FAILED]: 'Image enhancement failed: {0}',
    [ERROR_CODES.LANGUAGE_DETECTION_FAILED]: 'Language detection failed: {0}'
};

export const DEFAULT_VALUES = {
    OCR_LANGUAGE: 'eng',
    IMAGE_QUALITY: 'medium',
    IMAGE_FORMAT: 'png',
    TABLE_FORMAT: 'json',
    ENHANCEMENT_LEVEL: 'medium',
    MIN_TEXT_LENGTH: 10,
    MAX_RETRY_ATTEMPTS: 3,
    CHUNK_SIZE: 1000,
    DPI: {
        low: 150,
        medium: 200,
        high: 300
    },
    SCALE: {
        low: 1.0,
        medium: 1.5,
        high: 2.0
    }
};

export const SUPPORTED_LANGUAGES = [
    { code: 'eng', name: 'English' },
    { code: 'vie', name: 'Vietnamese' },
    { code: 'fra', name: 'French' },
    { code: 'deu', name: 'German' },
    { code: 'spa', name: 'Spanish' },
    { code: 'zho', name: 'Chinese' },
    { code: 'jpn', name: 'Japanese' },
    { code: 'kor', name: 'Korean' },
    { code: 'rus', name: 'Russian' },
    { code: 'tha', name: 'Thai' }
];

export const TEMP_FILE_PREFIX = 'n8n_pdf_extract_'; 