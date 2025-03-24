# n8n-nodes-extract-pdf

## English

A custom node for n8n that extracts text, images, tables and form fields from PDF files with powerful customization options and multilingual support.

### Features

- ✅ Extract text from normal and image-based PDFs
- ✅ OCR support for scanned PDFs
- ✅ Multilingual PDF processing with auto-detection
- ✅ Table extraction and formatting
- ✅ Image extraction from PDFs
- ✅ Document type recognition
- ✅ Metadata extraction
- ✅ Large file handling
- ✅ Comprehensive error handling
- ✅ Performance optimization

### New Version (v1.0.18)

We've just released a new version with improvements:

1. **Enhanced Error Handling**:
   - Detailed and clear error messages
   - Error code classification
   - Resolution suggestions
   - Multilingual error messages

2. **Performance Optimization**:
   - Chunk processing for memory efficiency
   - Smart caching for repeated tasks
   - Parallel processing for large files
   - Automatic chunk size adjustment

3. **OCR Improvements**:
   - Language-specific optimization
   - Smart image preprocessing
   - OCR result caching
   - GPU support for OCR (if available)

4. **New Features**:
   - Automatic language detection
   - Language distribution statistics
   - Smart table extraction
   - Image quality enhancement

### Error Handling

#### Error Codes and Solutions

| Error Code | Description | Solution |
|------------|-------------|----------|
| `ERR_FILE_NOT_FOUND` | PDF file not found | Check file path and access permissions |
| `ERR_INVALID_BINARY` | Invalid binary data | Ensure valid PDF data from previous node |
| `ERR_INVALID_PAGE_RANGE` | Invalid page range | Check page range syntax (e.g. "1-5, 8") |
| `ERR_OCR_FAILED` | OCR processing failed | Check Tesseract installation and language packs |
| `ERR_IMAGE_EXTRACTION_FAILED` | Image extraction failed | Check supported image formats |
| `ERR_TABLE_EXTRACTION_FAILED` | Table extraction failed | Ensure table has clear structure |
| `ERR_ENHANCEMENT_FAILED` | Enhancement failed | Check memory and CPU availability |
| `ERR_LANG_DETECTION_FAILED` | Language detection failed | Ensure text is long enough for analysis |

### Performance Optimization

#### Chunk Configuration
```typescript
{
  "parameters": {
    "chunkSize": 10,           // Pages per chunk
    "maxConcurrent": 4,        // Concurrent chunks
    "memoryLimit": "2GB",      // Memory limit
    "cacheResults": true       // Enable caching
  }
}
```

#### OCR Configuration
```typescript
{
  "parameters": {
    "ocrConfig": {
      "useGpu": true,          // Use GPU if available
      "imagePreprocess": true, // Preprocess images
      "cacheOcr": true,       // Cache OCR results
      "batchSize": 5          // OCR pages per batch
    }
  }
}
```

#### Performance Monitoring
```json
{
  "performance": {
    "totalTime": 1234,         // Total processing time (ms)
    "pagesPerSecond": 2.5,     // Processing speed
    "memoryUsage": {
      "heapUsed": "150MB",     // Used heap memory
      "heapTotal": "500MB"     // Total heap memory
    },
    "chunkStats": {
      "processed": 5,          // Chunks processed
      "failed": 0,            // Failed chunks
      "retried": 1            // Retried chunks
    }
  }
}
```

---

## Tiếng Việt

Node tùy chỉnh cho n8n để trích xuất văn bản, hình ảnh, bảng và trường biểu mẫu từ tệp PDF với các tùy chọn tùy chỉnh mạnh mẽ và hỗ trợ đa ngôn ngữ.

### Tính năng

- ✅ Trích xuất văn bản từ PDF thông thường và dạng ảnh
- ✅ OCR support for scanned PDFs
- ✅ Multilingual PDF processing with auto-detection
- ✅ Table extraction and formatting
- ✅ Image extraction from PDFs
- ✅ Document type recognition
- ✅ Metadata extraction
- ✅ Large file handling
- ✅ Comprehensive error handling
- ✅ Performance optimization

### Phiên bản mới (v1.0.18)

Chúng tôi vừa phát hành phiên bản mới với các cải tiến:

1. **Cải thiện xử lý lỗi**:
   - Thông báo lỗi chi tiết và rõ ràng
   - Phân loại mã lỗi
   - Gợi ý giải pháp
   - Thông báo lỗi đa ngôn ngữ

2. **Tối ưu hóa hiệu suất**:
   - Xử lý theo chunk để tiết kiệm bộ nhớ
   - Cache thông minh cho tác vụ lặp lại
   - Xử lý song song cho tệp lớn
   - Tự động điều chỉnh kích thước chunk

3. **Cải thiện OCR**:
   - Tối ưu hóa cho từng ngôn ngữ
   - Xử lý trước hình ảnh thông minh
   - Cache kết quả OCR
   - GPU support for OCR (if available)

4. **Tính năng mới**:
   - Automatic language detection
   - Language distribution statistics
   - Smart table extraction
   - Image quality enhancement

### Cài đặt

#### Thông qua giao diện web n8n

1. Mở n8n
2. Vào Settings > Community Nodes
3. Tìm kiếm "n8n-nodes-extract-pdf"
4. Nhấn "Install"

#### Thông qua dòng lệnh

```bash
npm install n8n-nodes-extract-pdf -g
```

Hoặc nếu bạn cài đặt n8n thông qua npm:

```bash
cd ~/.n8n
npm install n8n-nodes-extract-pdf
```

### Xử lý sự cố cài đặt

Nếu bạn gặp lỗi "The specified package could not be loaded" khi cài đặt, hãy thử các bước sau:

1. **Cài đặt bằng file .tgz**
   ```bash
   cd ~/.n8n
   npm install /đường/dẫn/đến/n8n-nodes-extract-pdf-1.0.21.tgz
   ```

2. **Kiểm tra phiên bản n8n**
   Node này yêu cầu n8n phiên bản 0.146.0 trở lên. Kiểm tra phiên bản hiện tại của bạn với:
   ```bash
   n8n --version
   ```

3. **Kiểm tra quyền truy cập folder**
   Đảm bảo user n8n có quyền đọc/ghi tất cả các thư mục cần thiết.

4. **Cài đặt các dependencies**
   ```bash
   cd ~/.n8n
   npm install tesseract.js@4.1.1 sharp@0.32.6 pdf-parse@1.1.1 franc@6.2.0
   ```

5. **Khởi động lại n8n**
   ```bash
   systemctl restart n8n
   ```
   hoặc
   ```bash
   pm2 restart n8n
   ```

### Hướng dẫn sử dụng

1. Thêm nút "Extract PDF" vào workflow
2. Cấu hình các tùy chọn:
   - Nguồn PDF (Upload hoặc URL)
   - Hoạt động (Trích xuất văn bản, trích xuất bảng, trích xuất hình ảnh)
   - Tùy chọn ngôn ngữ
   - Cài đặt OCR (nếu cần)
   - Xử lý hình ảnh
3. Chạy workflow

### Ví dụ

#### Trích xuất văn bản từ PDF

```json
{
  "nodes": [
    {
      "parameters": {
        "operation": "extractText",
        "binaryPropertyName": "data",
        "textExtractionOptions": {
          "pages": "1-5",
          "language": "auto",
          "ocrEnabled": true
        }
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [
        760,
        300
      ]
    }
  ]
}
```

### Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub.

### Giấy phép

[MIT](LICENSE.md)