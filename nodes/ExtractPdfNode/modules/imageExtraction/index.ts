/**
 * Module trích xuất và xử lý hình ảnh cho ExtractPdfNode
 * @author AI Assistant
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
const { convert: convertPdfToImages } = require('pdf-img-convert');
import sharp from 'sharp';

interface ImageExtractionOptions {
    quality?: number;
    format?: 'png' | 'jpg' | 'webp';
    dpi?: number;
    scale?: number;
}

export interface ImageEnhancementOptions {
    contrast?: number;
    brightness?: number;
    sharpness?: number;
    denoise?: boolean;
    format?: string;
}

/**
 * Trích xuất hình ảnh từ tệp PDF
 * @param filePath Đường dẫn đến tệp PDF
 * @param pageNumbers Mảng số trang cần trích xuất hình ảnh
 * @param options Tùy chọn trích xuất
 * @returns Danh sách hình ảnh đã trích xuất
 */
export async function extractImagesFromPdf(
    filePath: string,
    pageNumbers: number[],
    options: ImageExtractionOptions = {}
): Promise<{ page: number; imageData: string }[]> {
    try {
        // Thiết lập các tùy chọn trích xuất
        const extractionOptions = {
            // Sử dụng số trang làm chỉ số 0-based
            page_numbers: pageNumbers.map(p => p - 1),
            // Thiết lập các tùy chọn khác
            scale: options.scale || 2.0,
            // Chất lượng và định dạng mặc định
            quality: options.quality || 90,
            format: options.format || 'png',
            dpi: options.dpi || 300
        };
        
        // Thực hiện chuyển đổi PDF thành hình ảnh
        const outputImages = await convertPdfToImages(filePath, extractionOptions);
        
        // Tạo đối tượng hình ảnh cho từng trang
        const images = outputImages.map((imageBuffer: any, index: number) => {
            const page = pageNumbers[index];
            // Chuyển đổi buffer thô thành chuỗi base64
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

/**
 * Lưu hình ảnh từ base64 ra file
 * @param base64Data Dữ liệu hình ảnh dạng base64
 * @param outputPath Đường dẫn lưu file
 * @returns Đường dẫn đến file đã lưu
 */
export function saveBase64Image(base64Data: string, outputPath: string): string {
    try {
        // Tách prefix data URL nếu có
        const base64Content = base64Data.includes('base64,') 
            ? base64Data.split('base64,')[1] 
            : base64Data;
        
        // Chuyển đổi về buffer và lưu
        const imageBuffer = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(outputPath, imageBuffer);
        
        return outputPath;
    } catch (error) {
        throw new Error(`Failed to save image: ${(error as Error).message}`);
    }
}

/**
 * Nâng cao chất lượng hình ảnh cho OCR
 */
export async function enhanceImage(
    imagePath: string,
    options: ImageEnhancementOptions = {}
): Promise<string> {
    try {
        const {
            contrast = 1.2,
            brightness = 1.1,
            sharpness = 1.5,
            denoise = true,
            format = 'png'
        } = options;

        const outputPath = path.join(
            path.dirname(imagePath),
            `enhanced_${path.basename(imagePath, path.extname(imagePath))}.${format}`
        );

        // Sử dụng type assertion để tránh lỗi TypeScript
        let pipeline = sharp(imagePath)
            .normalize()
            // @ts-ignore - modulate is available in sharp but not in TypeScript definitions
            .modulate({
                brightness,
                saturation: 1.2
            })
            .sharpen(sharpness);

        if (contrast !== 1) {
            // @ts-ignore - linear is available in sharp but not in TypeScript definitions
            pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);
        }

        if (denoise) {
            pipeline = pipeline.median(3);
        }

        await pipeline.toFile(outputPath);
        return outputPath;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Failed to enhance image: ${errorMessage}`);
    }
}

/**
 * Phát hiện và trích xuất các hình ảnh nhúng trong trang PDF
 * @param filePath Đường dẫn đến file PDF
 * @param pageNumber Số trang cần trích xuất (bắt đầu từ 1)
 * @returns Danh sách các hình ảnh đã trích xuất
 */
export async function extractEmbeddedImages(
    filePath: string,
    pageNumber: number
): Promise<string[]> {
    try {
        // Lưu ý: Trích xuất hình ảnh nhúng từ PDF yêu cầu thư viện nâng cao hơn
        // như pdf.js hoặc pdfimages.
        // Đây là bản triển khai đơn giản sử dụng chuyển đổi hoàn toàn trang thành hình ảnh
        
        // Chuyển đổi trang thành hình ảnh
        const outputImages = await convertPdfToImages(filePath, {
            page_numbers: [pageNumber - 1],
            scale: 2.0
        });
        
        if (!outputImages || outputImages.length === 0) {
            return [];
        }
        
        // Lưu hình ảnh trang vào file tạm
        const tempImagePath = path.join(os.tmpdir(), `page_${pageNumber}.png`);
        let imageBuffer: Buffer;
        
        if (outputImages[0] instanceof Uint8Array) {
            imageBuffer = Buffer.from(outputImages[0]);
        } else if (typeof outputImages[0] === 'string') {
            imageBuffer = Buffer.from(outputImages[0], 'binary');
        } else {
            imageBuffer = outputImages[0];
        }
        
        fs.writeFileSync(tempImagePath, imageBuffer);
        
        // Trong phiên bản đơn giản này, chúng ta chỉ trả về hình ảnh trang
        // Để trích xuất các hình ảnh riêng lẻ, cần triển khai thuật toán phát hiện vùng ảnh
        
        return [tempImagePath];
    } catch (error) {
        console.error(`Failed to extract embedded images: ${(error as Error).message}`);
        return [];
    }
} 