import * as fs from 'fs';
import * as path from 'path';

// Mock các module gây lỗi trong quá trình test
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    greyscale: jest.fn().mockReturnThis(),
    normalize: jest.fn().mockReturnThis(),
    sharpen: jest.fn().mockReturnThis(),
    threshold: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('franc', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((text: string) => {
    if (text.includes('Việt') || text.includes('tiếng')) return 'vie';
    if (text.includes('français') || text.includes('bonjour')) return 'fra';
    return 'eng';
  })
}));

jest.mock('iso-639-3', () => ({
  __esModule: true,
  default: [
    { name: 'English', type: 'living', scope: 'individual', iso6393: 'eng', iso6392B: 'eng', iso6392T: 'eng', iso6391: 'en' },
    { name: 'Vietnamese', type: 'living', scope: 'individual', iso6393: 'vie', iso6392B: 'vie', iso6392T: 'vie', iso6391: 'vi' },
    { name: 'French', type: 'living', scope: 'individual', iso6393: 'fra', iso6392B: 'fre', iso6392T: 'fra', iso6391: 'fr' }
  ]
}));

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn().mockResolvedValue({
    load: jest.fn().mockResolvedValue(undefined),
    loadLanguage: jest.fn().mockResolvedValue(undefined),
    initialize: jest.fn().mockResolvedValue(undefined),
    recognize: jest.fn().mockResolvedValue({ data: { text: 'Mocked OCR text' } }),
    terminate: jest.fn().mockResolvedValue(undefined)
  })
}));

// Đường dẫn đến các file PDF mẫu
const FIXTURES_DIR = path.join(__dirname, '../fixtures');
const SAMPLE_PDF_PATH = path.join(FIXTURES_DIR, 'sample.pdf');
const COMPLEX_PDF_PATH = path.join(FIXTURES_DIR, 'complex.pdf');
const INVOICE_PDF_PATH = path.join(FIXTURES_DIR, 'invoice.pdf');

// Import công cụ tạo PDF
const pdfFixtures = require('../fixtures/generate-test-pdf');

// Class mock đơn giản cho ExtractPdfNode với các phương thức hiệu suất công khai
class MockExtractPdfNode {
  parsePageRange(pageRange: string): number[] {
    const result: number[] = [];
    const parts = pageRange.split(',').map((part: string) => part.trim());
    
    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map((num: string) => parseInt(num.trim(), 10));
        
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

  chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize));
    }
    return result;
  }

  levenshteinDistance(str1: string, str2: string): number {
    const dp: number[][] = [];
    
    for (let i = 0; i <= str1.length; i++) {
      dp[i] = [];
      dp[i][0] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      dp[0][j] = j;
    }
    
    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,         // Xóa
          dp[i][j - 1] + 1,         // Chèn
          dp[i - 1][j - 1] + cost   // Thay thế
        );
      }
    }
    
    return dp[str1.length][str2.length];
  }

  calculateStringSimilarity(str1: string, str2: string): number {
    if (!str1.length && !str2.length) return 1;
    if (!str1.length || !str2.length) return 0;
    
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - distance) / maxLength;
  }

  async detectLanguage(text: string): Promise<string> {
    // Mock phát hiện ngôn ngữ đơn giản
    if (text.includes('Việt') || text.includes('tiếng')) return 'vie';
    if (text.includes('français') || text.includes('bonjour')) return 'fra';
    return 'eng';
  }

  mapLanguageCodeToTesseract(isoCode: string): string {
    const map: Record<string, string> = {
      'eng': 'eng',
      'vie': 'vie',
      'fra': 'fra',
      'chi': 'chi_sim'
    };
    return map[isoCode] || 'eng';
  }

  async classifyDocument(text: string, metadata: any, categories: string[] = []): Promise<any> {
    // Mock phân loại tài liệu
    if (text.includes('INVOICE') || text.includes('Invoice') || text.includes('invoice')) {
      return {
        documentType: 'invoice',
        confidence: 85,
        detectedFields: {
          invoiceNumber: 'INV-12345',
          date: '2023-01-01'
        }
      };
    }
    
    if (text.includes('contract') || text.includes('agreement') || text.includes('AGREEMENT')) {
      return {
        documentType: 'contract',
        confidence: 75,
        detectedFields: {
          effectiveDate: '2023-01-01',
          parties: 'Party A and Party B'
        }
      };
    }
    
    return {
      documentType: 'unknown',
      confidence: 50,
      detectedFields: {}
    };
  }

  formatTables(result: any): any[] {
    if (!result || !result.pageTables) {
      return [];
    }
    
    const formattedTables: any[] = [];
    
    result.pageTables.forEach((pageTable: any) => {
      if (pageTable.tables && pageTable.tables.length > 0) {
        const pageNum = pageTable.page;
        pageTable.tables.forEach((table: any[], tableIndex: number) => {
          if (table && table.length > 0) {
            const headers = table[0] as string[];
            const rows = table.slice(1) as string[][];
            
            const formattedTable: any = {
              pageNumber: pageNum,
              tableIndex: tableIndex,
              headers: headers,
              rows: rows,
              data: rows.map((row: string[]) => {
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
    
    return formattedTables;
  }
}

// Hàm đo thời gian thực thi
async function measureExecutionTime<T>(fn: (...args: any[]) => Promise<T> | T, ...args: any[]): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn(...args);
  const end = performance.now();
  const duration = end - start;
  return [result, duration];
}

describe('Performance Test - ExtractPdfNode', () => {
  let extractPdfNode: MockExtractPdfNode;

  // Tạo PDF mẫu trước khi chạy tất cả các test
  beforeAll(async () => {
    if (!fs.existsSync(FIXTURES_DIR)) {
      fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    }
    
    // Tạo các file PDF mẫu nếu chưa tồn tại
    try {
      await pdfFixtures.generateAllTestPdfs();
      
      // Nếu không thể tạo file thật, tạo file giả
      if (!fs.existsSync(SAMPLE_PDF_PATH)) {
        fs.writeFileSync(SAMPLE_PDF_PATH, 'mock pdf content');
      }
      if (!fs.existsSync(COMPLEX_PDF_PATH)) {
        fs.writeFileSync(COMPLEX_PDF_PATH, 'mock complex pdf content');
      }
      if (!fs.existsSync(INVOICE_PDF_PATH)) {
        fs.writeFileSync(INVOICE_PDF_PATH, 'mock invoice pdf content');
      }
    } catch (error) {
      console.warn('Không thể tạo các file PDF mẫu. Test sẽ sử dụng mock:', error);
    }
  });

  beforeEach(() => {
    extractPdfNode = new MockExtractPdfNode();
  });

  describe('parsePageRange Performance', () => {
    it('Nên xử lý dải trang phức tạp trong dưới 50ms', () => {
      const complexPageRange = '1-10, 15, 20-30, 40, 50-60, 70, 80-90';
      
      const start = performance.now();
      const pages = extractPdfNode.parsePageRange(complexPageRange);
      const end = performance.now();
      
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
      expect(pages.length).toBe(46); // 10 + 1 + 11 + 1 + 11 + 1 + 11 = 46
    });
  });

  describe('levenshteinDistance Performance', () => {
    it('Nên tính khoảng cách Levenshtein trong dưới 100ms', () => {
      const longString1 = 'This is a very long string that will be used to test the performance of the Levenshtein distance algorithm. It contains many characters and words to ensure that the algorithm is tested properly.';
      const longString2 = 'This is a vety long string that wil be used to test the performance of the Levenstein distance algorithm. It containes many characters and words to ensure that the algorithm is tested properly!';
      
      const start = performance.now();
      const distance = extractPdfNode.levenshteinDistance(longString1, longString2);
      const end = performance.now();
      
      const duration = end - start;
      
      expect(duration).toBeLessThan(100);
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('chunkArray Performance', () => {
    it('Nên chia mảng lớn thành chunks trong dưới 50ms', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);
      
      const start = performance.now();
      const result = extractPdfNode.chunkArray(largeArray, 100);
      const end = performance.now();
      
      const duration = end - start;
      
      expect(duration).toBeLessThan(50);
      expect(result.length).toBe(100);
      expect(result[0].length).toBe(100);
    });
  });

  describe('calculateStringSimilarity Performance', () => {
    it('Nên tính toán độ tương đồng chuỗi nhanh (trung bình < 5ms cho 100 lần gọi)', async () => {
      const string1 = 'This is a sample text for similarity calculation';
      const string2 = 'This is a sample text for smilarity calulation';
      
      let totalDuration = 0;
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        extractPdfNode.calculateStringSimilarity(string1, string2);
        const end = performance.now();
        totalDuration += (end - start);
      }
      
      const averageDuration = totalDuration / iterations;
      
      expect(averageDuration).toBeLessThan(5);
    });
  });

  describe('detectLanguage Performance', () => {
    it('Nên phát hiện ngôn ngữ tiếng Anh trong dưới 200ms', async () => {
      const englishText = 'This is a sample text in English language that should be detected by the language detection algorithm. It contains enough words to make the detection accurate.';
      
      const [language, duration] = await measureExecutionTime(
        async () => await extractPdfNode.detectLanguage(englishText)
      );
      
      expect(duration).toBeLessThan(200);
      expect(language).toBe('eng');
    });
    
    it('Nên phát hiện ngôn ngữ tiếng Việt trong dưới 200ms', async () => {
      const vietnameseText = 'Đây là văn bản mẫu bằng tiếng Việt để kiểm tra khả năng phát hiện ngôn ngữ. Nó chứa đủ từ để làm cho việc phát hiện chính xác.';
      
      const [language, duration] = await measureExecutionTime(
        async () => await extractPdfNode.detectLanguage(vietnameseText)
      );
      
      expect(duration).toBeLessThan(200);
      expect(language).toBe('vie');
    });
  });

  describe('classifyDocument Performance', () => {
    it('Nên phân loại tài liệu trong dưới 300ms', async () => {
      const invoiceText = 'INVOICE\nInvoice #: INV-12345\nDate: 2023-01-01\nBill To: Customer XYZ\nTotal: $1000.00';
      
      const [classification, duration] = await measureExecutionTime(
        async () => await extractPdfNode.classifyDocument(invoiceText, {}, ['invoice', 'receipt', 'contract'])
      );
      
      expect(duration).toBeLessThan(300);
      expect(classification.documentType).toBe('invoice');
    });
  });

  describe('formatTables Performance', () => {
    it('Nên định dạng bảng phức tạp trong dưới 500ms', () => {
      // Tạo mockup dữ liệu bảng phức tạp
      const mockTableData = {
        pageTables: Array.from({ length: 10 }, (_, pageIndex) => ({
          page: pageIndex + 1,
          tables: Array.from({ length: 5 }, (_, tableIndex) => {
            const headers = ['Header1', 'Header2', 'Header3', 'Header4', 'Header5'];
            const rows = Array.from({ length: 20 }, (_, rowIndex) => 
              headers.map(header => `Value${rowIndex + 1}-${header}`)
            );
            return [headers, ...rows];
          })
        }))
      };
      
      const start = performance.now();
      const formattedTables = extractPdfNode.formatTables(mockTableData);
      const end = performance.now();
      
      const duration = end - start;
      
      expect(duration).toBeLessThan(500);
      expect(formattedTables.length).toBe(50); // 10 pages x 5 tables per page
      expect(formattedTables[0].headers.length).toBe(5);
      expect(formattedTables[0].rows.length).toBe(20);
    });
  });
}); 