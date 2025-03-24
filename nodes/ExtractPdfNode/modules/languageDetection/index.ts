/**
 * Module phát hiện ngôn ngữ cho ExtractPdfNode
 * @author AI Assistant
 * @version 1.0.0
 */

import franc from 'franc';

/**
 * Kết quả phát hiện ngôn ngữ
 */
export interface LanguageDetectionResult {
    language: string;
    confidence: number;
}

/**
 * Ánh xạ từ mã ngôn ngữ ISO 639-3 sang mã ngôn ngữ Tesseract
 */
const languageMap: Record<string, string> = {
    'eng': 'eng',     // Tiếng Anh
    'vie': 'vie',     // Tiếng Việt
    'fra': 'fra',     // Tiếng Pháp
    'deu': 'deu',     // Tiếng Đức
    'spa': 'spa',     // Tiếng Tây Ban Nha
    'ita': 'ita',     // Tiếng Ý
    'rus': 'rus',     // Tiếng Nga
    'jpn': 'jpn',     // Tiếng Nhật
    'kor': 'kor',     // Tiếng Hàn
    'zho': 'chi_sim', // Tiếng Trung (giản thể)
    'chi': 'chi_sim', // Tiếng Trung (giản thể - alias)
    'cmn': 'chi_sim', // Tiếng Trung Phổ Thông (giản thể)
    'yue': 'chi_tra', // Tiếng Quảng Đông
    'arb': 'ara',     // Tiếng Ả Rập 
    'hin': 'hin',     // Tiếng Hindi
    'ben': 'ben',     // Tiếng Bengali
    'por': 'por',     // Tiếng Bồ Đào Nha
    'tha': 'tha',     // Tiếng Thái
    'ind': 'ind',     // Tiếng Indonesia
    'tam': 'tam',     // Tiếng Tamil
    'urd': 'urd',     // Tiếng Urdu
    'ukr': 'ukr',     // Tiếng Ukraine
    'nld': 'nld',     // Tiếng Hà Lan
    'swe': 'swe',     // Tiếng Thụy Điển
    'fin': 'fin',     // Tiếng Phần Lan
    'pol': 'pol',     // Tiếng Ba Lan
    'tur': 'tur',     // Tiếng Thổ Nhĩ Kỳ
    'ell': 'ell',     // Tiếng Hy Lạp
    'ces': 'ces',     // Tiếng Séc
    'heb': 'heb'      // Tiếng Do Thái
};

/**
 * Ánh xạ mã ngôn ngữ về mã Tesseract
 * @param langCode Mã ngôn ngữ ISO 639
 * @returns Mã ngôn ngữ Tesseract
 */
export function mapLanguageCodeToTesseract(langCode: string): string {
    if (!langCode || langCode.length < 2) {
        return 'eng'; // Mặc định là tiếng Anh
    }
    
    // Chuẩn hóa mã ngôn ngữ
    const normalizedCode = langCode.toLowerCase().trim();
    
    // Tìm trong bảng ánh xạ
    return languageMap[normalizedCode] || 'eng';
}

/**
 * Phát hiện ngôn ngữ của văn bản
 * @param text Văn bản cần phát hiện ngôn ngữ
 * @returns Mã ngôn ngữ đã phát hiện (mã ISO 639-3)
 */
export async function detectLanguage(text: string): Promise<string> {
    try {
        // Đảm bảo có đủ văn bản để phát hiện chính xác
        if (!text || text.length < 50) {
            return 'eng'; // Mặc định là tiếng Anh cho các đoạn văn bản ngắn
        }
        
        // Sử dụng franc để phát hiện ngôn ngữ
        const detectedLanguage = franc(text, { minLength: 50 });
        
        // Trả về mã Tesseract tương ứng
        if (detectedLanguage === 'und') {
            return 'eng'; // Không xác định được ngôn ngữ, mặc định là tiếng Anh
        }
        
        return detectedLanguage;
    } catch (error) {
        console.error('Error detecting language:', error);
        return 'eng'; // Mặc định là tiếng Anh nếu có lỗi
    }
}

/**
 * Tạo thống kê ngôn ngữ từ văn bản
 * @param text Văn bản cần phân tích
 * @returns Mảng các kết quả phát hiện ngôn ngữ và độ tin cậy
 */
export async function generateLanguageStats(text: string): Promise<LanguageDetectionResult[]> {
    try {
        // Nếu văn bản quá ngắn, không thể tạo thống kê chính xác
        if (!text || text.length < 100) {
            return [{ language: 'eng', confidence: 1 }];
        }
        
        // Chia văn bản thành các đoạn để phát hiện ngôn ngữ
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length >= 50);
        
        if (paragraphs.length === 0) {
            return [{ language: 'eng', confidence: 1 }];
        }
        
        // Phát hiện ngôn ngữ cho từng đoạn
        const detections: Record<string, number> = {};
        const total = paragraphs.length;
        
        for (const paragraph of paragraphs) {
            const detectedLang = await detectLanguage(paragraph);
            
            // Chuyển đổi sang mã Tesseract
            const tesseractCode = mapLanguageCodeToTesseract(detectedLang);
            
            // Tính tần suất
            detections[tesseractCode] = (detections[tesseractCode] || 0) + 1;
        }
        
        // Chuyển đổi thành mảng kết quả với độ tin cậy
        const result = Object.entries(detections).map(([language, count]) => ({
            language,
            confidence: count / total
        }));
        
        // Sắp xếp theo độ tin cậy giảm dần
        result.sort((a, b) => b.confidence - a.confidence);
        
        return result.length > 0 ? result : [{ language: 'eng', confidence: 1 }];
    } catch (error) {
        console.error('Error generating language statistics:', error);
        return [{ language: 'eng', confidence: 1 }]; // Mặc định là tiếng Anh nếu có lỗi
    }
}

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

/**
 * Phát hiện ngôn ngữ của văn bản bằng phương pháp đơn giản dựa trên mẫu ký tự
 * @param text Văn bản cần phát hiện ngôn ngữ
 * @returns Mã ISO 639-3 của ngôn ngữ phát hiện được
 */
export function detectLanguageSimple(text: string): string {
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

/**
 * Dữ liệu ngôn ngữ ISO 639-3 giới hạn 
 */
export const languageData: LanguageData[] = [
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

/**
 * Chuyển đổi mã ISO 639-3 sang tên ngôn ngữ
 * @param iso6393 Mã ISO 639-3 của ngôn ngữ
 * @returns Tên đầy đủ của ngôn ngữ
 */
export function getLanguageName(iso6393: string): string {
    const lang = languageData.find(l => l.iso6393 === iso6393);
    return lang ? lang.name : 'Unknown';
}

/**
 * Chuyển đổi mã ISO 639-3 sang mã ISO 639-1
 * @param iso6393 Mã ISO 639-3 của ngôn ngữ
 * @returns Mã ISO 639-1 tương ứng hoặc 'en' nếu không tìm thấy
 */
export function getIso6391Code(iso6393: string): string {
    const lang = languageData.find(l => l.iso6393 === iso6393);
    return lang?.iso6391 || 'en';
}

/**
 * Hàm tải module franc và iso-639-3 (giả lập)
 * @returns Module franc và iso-639-3
 */
export async function loadLanguageModules(): Promise<{ franc: FrancType; iso6393: Iso6393Type }> {
    return { 
        franc: (text: string) => detectLanguageSimple(text),
        iso6393: languageData
    };
} 