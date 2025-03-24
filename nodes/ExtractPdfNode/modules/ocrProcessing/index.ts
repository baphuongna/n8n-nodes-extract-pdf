/**
 * Module xử lý OCR cho ExtractPdfNode
 * @author AI Assistant
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as worker_threads from 'worker_threads';
import crypto from 'crypto';
import type {
    Logger,
    OcrOptions,
    OcrResult,
    WorkerData,
    CacheOptions
} from '../types';
import NodeCache from 'node-cache';
import { recognize } from 'tesseract.js';
import { convert as convertPdfToImages } from 'pdf-img-convert';
import { imageExtraction, languageDetection } from '../';

// Cache cho kết quả OCR
const cacheOptions: CacheOptions = {
    stdTTL: 3600, // 1 giờ
    checkperiod: 600, // Kiểm tra mỗi 10 phút
    useClones: false
};

const ocrCache = new NodeCache(cacheOptions);

/**
 * Tạo cache key từ nội dung hình ảnh và tùy chọn OCR
 */
function generateCacheKey(imageBuffer: Buffer, options: OcrOptions): string {
    const imageHash = crypto
        .createHash('md5')
        .update(imageBuffer)
        .digest('hex');
    return `${imageHash}_${JSON.stringify(options)}`;
}

/**
 * Xử lý OCR cho một trang trong worker thread
 */
async function processPageInWorker(imageBuffer: Buffer, options: OcrOptions): Promise<string> {
    if (worker_threads.isMainThread) {
        return new Promise((resolve, reject) => {
            const worker = new worker_threads.Worker(__filename, {
                workerData: {
                    imageBuffer,
                    options,
                    type: 'ocrWorker'
                } as WorkerData
            });

            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    } else {
        // Code chạy trong worker thread
        try {
            const { imageBuffer, options } = worker_threads.workerData as WorkerData;
            
            const result = await recognize(
                imageBuffer,
                options.language || 'eng',
                {
                    logger: (_: unknown) => {} // Tắt logging
                }
            );
            
            if (worker_threads.parentPort) {
                worker_threads.parentPort.postMessage(result.data.text);
                return result.data.text;
            }
            throw new Error('Worker thread parent port is null');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`OCR processing failed in worker: ${errorMessage}`);
        }
    }
}

/**
 * Thực hiện OCR trên tệp PDF với cải tiến hiệu suất
 */
export async function performOcrOnPdf(
    filePath: string,
    pageNumbers: number[],
    options: OcrOptions = {}
): Promise<OcrResult> {
    const startTime = Date.now();
    try {
        // Tự động phát hiện ngôn ngữ nếu được yêu cầu
        if (options.autoDetect) {
            // Đọc một phần nhỏ của PDF để phát hiện ngôn ngữ
            const sampleImage = await convertPdfToImages(filePath, {
                page_numbers: [0],
                scale: 1.0
            });
            
            if (sampleImage && sampleImage.length > 0) {
                const sampleResult = await recognize(
                    sampleImage[0],
                    'eng', // Sử dụng tiếng Anh để lấy mẫu văn bản
                    { logger: (_: unknown) => {} }
                );
                
                if (sampleResult.data.text) {
                    const detectedLang = await languageDetection.detectLanguage(sampleResult.data.text);
                    options.language = detectedLang;
                    console.log(`Detected language: ${detectedLang}`);
                }
            }
        }

        // Chuyển đổi PDF thành hình ảnh
        const outputImages = await convertPdfToImages(filePath, {
            page_numbers: pageNumbers.map(p => p - 1),
            scale: options.scale || 2.0,
            dpi: options.dpi || 300
        });

        let allText = '';
        const processedPages = new Set<number>();
        const maxWorkers = options.maxWorkers || os.cpus().length;
        
        // Xử lý từng trang
        const processPage = async (imageBuffer: Buffer, pageIndex: number): Promise<string> => {
            // Kiểm tra cache nếu được bật
            if (options.useCache) {
                const cacheKey = generateCacheKey(imageBuffer, options);
                const cachedResult = ocrCache.get<string>(cacheKey);
                if (cachedResult) {
                    return cachedResult;
                }
            }

            // Nâng cao chất lượng hình ảnh nếu được yêu cầu
            let processableImage = imageBuffer;
            if (options.enhanceImage) {
                const tempImagePath = path.join(os.tmpdir(), `ocr_page_${pageIndex}.png`);
                await fs.promises.writeFile(tempImagePath, imageBuffer);
                
                const enhancedImagePath = await imageExtraction.enhanceImage(tempImagePath, {
                    contrast: 50,
                    brightness: 10,
                    sharpness: 50,
                    denoise: true,
                    format: 'png'
                });
                
                processableImage = await fs.promises.readFile(enhancedImagePath);
                
                // Dọn dẹp file tạm
                try {
                    await fs.promises.unlink(tempImagePath);
                    if (enhancedImagePath !== tempImagePath) {
                        await fs.promises.unlink(enhancedImagePath);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.warn(`Warning: Could not delete temporary files: ${errorMessage}`);
                }
            }

            // Xử lý OCR
            let pageText: string;
            if (options.useParallel) {
                pageText = await processPageInWorker(processableImage, options);
            } else {
                const result = await recognize(
                    processableImage,
                    options.language || 'eng',
                    {
                        logger: options.verbose ? console.log : (_: unknown) => {}
                    }
                );
                pageText = result.data.text || '';
            }

            // Lưu vào cache nếu được bật
            if (options.useCache) {
                const cacheKey = generateCacheKey(imageBuffer, options);
                ocrCache.set(cacheKey, pageText);
            }

            return pageText;
        };

        // Xử lý song song hoặc tuần tự tùy thuộc vào cấu hình
        if (options.useParallel && outputImages.length > 1) {
            // Xử lý song song với giới hạn số worker
            const batches = [];
            for (let i = 0; i < outputImages.length; i += maxWorkers) {
                const batchImages = outputImages.slice(i, i + maxWorkers);
                const batchIndices = pageNumbers.slice(i, i + maxWorkers);
                
                const batchPromises = batchImages.map((img, j) => 
                    processPage(img, batchIndices[j])
                );
                
                const batchResults = await Promise.all(batchPromises);
                batches.push(...batchResults);
                
                // Cập nhật các trang đã xử lý
                batchIndices.forEach(pageNum => processedPages.add(pageNum));
            }
            
            allText = batches.join('\n\n--- Page Break ---\n\n');
        } else {
            // Xử lý tuần tự
            const results = [];
            for (let i = 0; i < outputImages.length; i++) {
                const pageText = await processPage(outputImages[i], pageNumbers[i]);
                results.push(pageText);
                processedPages.add(pageNumbers[i]);
            }
            
            allText = results.join('\n\n--- Page Break ---\n\n');
        }

        // Phân tích thống kê ngôn ngữ
        const languageStats = await generateLanguageStatistics(allText);
        
        const endTime = Date.now();
        const processingTime = (endTime - startTime) / 1000;
        
        // Trả về kết quả
        return {
            text: allText,
            pageCount: processedPages.size,
            processedPages: Array.from(processedPages),
            language: options.language || 'eng',
            hasMultipleLanguages: Object.keys(languageStats).length > 1,
            languageStats: Object.entries(languageStats).map(([language, confidence]) => ({
                language,
                confidence: parseFloat(confidence.toString())
            })),
            performance: {
                totalProcessingTime: processingTime,
                pagesPerSecond: processedPages.size / processingTime,
                startTime,
                endTime
            }
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`OCR processing failed: ${errorMessage}`);
    }
}

/**
 * Trích xuất script từ dữ liệu OSD (Orientation and Script Detection)
 * @param osdData Dữ liệu OSD từ Tesseract
 * @returns Mã script đã trích xuất hoặc undefined nếu không tìm thấy
 */
export function extractScriptFromOSD(osdData: any): string | undefined {
    if (!osdData || typeof osdData !== 'object') {
        return undefined;
    }
    
    // OSD data có thể có cấu trúc khác nhau tùy theo phiên bản Tesseract
    if (osdData.script_name) {
        return osdData.script_name.toLowerCase();
    }
    
    if (osdData.scripts && Array.isArray(osdData.scripts) && osdData.scripts.length > 0) {
        // Lấy script có điểm cao nhất
        const bestScript = osdData.scripts.reduce((best: any, current: any) => {
            if (!best || (current.score && current.score > best.score)) {
                return current;
            }
            return best;
        }, null);
        
        if (bestScript && bestScript.name) {
            return bestScript.name.toLowerCase();
        }
    }
    
    return undefined;
}

/**
 * Ánh xạ script tới ngôn ngữ Tesseract phù hợp
 * @param script Mã script
 * @returns Mã ngôn ngữ Tesseract
 */
export function mapScriptToLanguage(script?: string): string {
    if (!script) return 'eng'; // Mặc định là tiếng Anh
    
    // Ánh xạ từ script sang mã ngôn ngữ Tesseract
    const scriptToLang: Record<string, string> = {
        'latin': 'eng', // Có thể là nhiều ngôn ngữ, mặc định là tiếng Anh
        'cyrillic': 'rus',
        'arabic': 'ara',
        'devanagari': 'hin',
        'han': 'chi_sim', // Giản thể Trung Quốc
        'hangul': 'kor',
        'greek': 'grc',
        'hebrew': 'heb',
        'thai': 'tha',
        'japanese': 'jpn',
        // Thêm các script khác khi cần
    };
    
    return scriptToLang[script.toLowerCase()] || 'eng';
}

/**
 * Thực hiện OCR đa ngôn ngữ trên một hình ảnh
 * @param imagePath Đường dẫn đến hình ảnh
 * @param languages Mảng mã ngôn ngữ cần nhận dạng
 * @returns Văn bản đã trích xuất
 */
export async function performMultilingualOCR(imagePath: string, languages: string[] = ['eng']): Promise<string> {
    try {
        // Sắp xếp ngôn ngữ theo thứ tự ưu tiên (eng luôn được ưu tiên cao nhất)
        const sortedLangs = Array.from(new Set(['eng', ...languages]));
        
        // Chuyển đổi mảng ngôn ngữ thành chuỗi Tesseract (e.g., "eng+fra+deu")
        const langString = sortedLangs.join('+');
        
        // Thực hiện nhận dạng với đa ngôn ngữ
        const result = await recognize(
            imagePath,
            langString,
            {
                logger: (_: unknown) => {} // Tắt logging
            }
        );
        
        return result.data.text || '';
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Multilingual OCR failed: ${errorMessage}`);
        
        // Thử lại với chỉ tiếng Anh
        try {
            const fallbackResult = await recognize(
                imagePath,
                'eng',
                {
                    logger: (_: unknown) => {}
                }
            );
            
            return fallbackResult.data.text || '';
        } catch (innerError) {
            console.error('Fallback OCR also failed:', innerError);
            return ''; // Trả về chuỗi rỗng trong trường hợp lỗi
        }
    }
}

/**
 * Nâng cao kết quả OCR bằng AI
 * @param text Văn bản cần nâng cao
 * @param language Mã ngôn ngữ
 * @param correctionLevel Mức độ sửa lỗi ('low', 'medium', 'high')
 * @returns Văn bản đã nâng cao
 */
export async function enhanceOcrWithAI(text: string, language: string = 'eng', correctionLevel: string = 'medium'): Promise<string> {
    try {
        // Trong phiên bản thực, đây sẽ gọi API NLP hoặc mô hình AI
        // Đây là mô phỏng đơn giản của quá trình sửa lỗi
        
        if (!text || text.trim().length === 0) {
            return text;
        }
        
        // Sửa một số lỗi OCR phổ biến
        let enhancedText = text
            // Sửa số 0 và chữ O
            .replace(/0(?=[a-zA-Z])/g, 'O')
            .replace(/(?<=[a-zA-Z])0/g, 'o')
            
            // Sửa số 1, chữ l và chữ I
            .replace(/1(?=[a-zA-Z])/g, 'I')
            .replace(/(?<=[a-zA-Z])1/g, 'l')
            
            // Sửa số 5 và chữ S
            .replace(/5(?=[a-zA-Z])/g, 'S')
            .replace(/(?<=[a-zA-Z])5/g, 's')
            
            // Sửa dấu | và chữ l, I
            .replace(/\|(?=[a-zA-Z])/g, 'I')
            .replace(/(?<=[a-zA-Z])\|/g, 'l')
            
            // Sửa dấu cách thừa
            .replace(/\s{2,}/g, ' ')
            .replace(/\s+\./g, '.')
            .replace(/\s+,/g, ',')
            
            // Sửa lỗi xuống dòng
            .replace(/(\w)-\s+(\w)/g, '$1$2');
        
        // Áp dụng sửa lỗi nâng cao dựa trên mức độ
        if (correctionLevel === 'high') {
            // Trong thực tế, đây sẽ gọi mô hình ngôn ngữ nâng cao
            // Mô phỏng bằng cách sửa thêm một số lỗi
            enhancedText = enhancedText
                // Viết hoa đầu câu
                .replace(/(\.\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());
        }
        
        return enhancedText;
    } catch (error) {
        console.error('Error enhancing OCR with AI:', error);
        return text; // Trả về văn bản gốc nếu có lỗi
    }
}

/**
 * Tạo thống kê ngôn ngữ từ văn bản
 * @param text Văn bản cần phân tích
 * @returns Thống kê tần suất ngôn ngữ
 */
export async function generateLanguageStatistics(text: string): Promise<Record<string, number>> {
    try {
        // Nếu văn bản quá ngắn, không thể tạo thống kê chính xác
        if (!text || text.length < 100) {
            return { 'und': 1 }; // undefined language
        }
        
        // Chia văn bản thành các đoạn để phát hiện ngôn ngữ
        const paragraphs = text.split(/\n\s*\n/);
        const languageCounts: Record<string, number> = {};
        
        // Đếm ngôn ngữ trong từng đoạn
        for (const paragraph of paragraphs) {
            if (paragraph.trim().length < 20) continue; // Bỏ qua đoạn quá ngắn
            
            // Phát hiện ngôn ngữ
            const detectedLang = await languageDetection.detectLanguage(paragraph);
            
            // Chuyển đổi sang mã Tesseract
            const tesseractCode = languageDetection.mapLanguageCodeToTesseract(detectedLang);
            
            // Tính tần suất
            languageCounts[tesseractCode] = (languageCounts[tesseractCode] || 0) + 1;
        }
        
        // Mặc định là tiếng Anh nếu không phát hiện được ngôn ngữ nào
        if (Object.keys(languageCounts).length === 0) {
            languageCounts['eng'] = 1;
        }
        
        return languageCounts;
    } catch (error) {
        console.error('Error generating language statistics:', error);
        return { 'eng': 1 }; // Mặc định là tiếng Anh nếu có lỗi
    }
}

/**
 * Nâng cao chất lượng hình ảnh để cải thiện OCR
 * @param imagePath Đường dẫn đến hình ảnh
 * @returns Đường dẫn đến hình ảnh đã cải thiện
 */
export async function enhanceImageForOcr(imagePath: string): Promise<string> {
    return imageExtraction.enhanceImage(imagePath);
} 