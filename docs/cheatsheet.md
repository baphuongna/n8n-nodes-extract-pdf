# Extract PDF Node Cheat Sheet

## Các lệnh cài đặt nhanh

### Cài đặt cơ bản
```bash
npm install n8n-nodes-extract-pdf@1.0.16
```

### Cài đặt với Tesseract (Ubuntu/Debian)
```bash
sudo apt install tesseract-ocr
sudo apt install tesseract-ocr-vie tesseract-ocr-eng
npm install n8n-nodes-extract-pdf@1.0.16
```

### Cài đặt với Tesseract (Windows)
1. Tải và cài đặt Tesseract từ: https://github.com/UB-Mannheim/tesseract/wiki
2. Thêm đường dẫn Tesseract vào PATH
3. ```npm install n8n-nodes-extract-pdf@1.0.16```

## Cấu hình nhanh

### Trích xuất văn bản cơ bản
- **Input Type**: File Path
- **PDF File**: /path/to/document.pdf
- **Options**: (để trống)

### Trích xuất văn bản với OCR
- **Input Type**: File Path/Binary Data
- **Options**:
  - **Perform OCR**: true
  - **OCR Language**: eng (hoặc ngôn ngữ phù hợp)
  - **Process In Chunks**: true
  - **Chunk Size**: 1

### Trích xuất hình ảnh từ PDF
- **Input Type**: File Path/Binary Data
- **Options**:
  - **Extract Images**: true
  - **Page Range**: 1-5 (tùy chọn)

### Xử lý PDF từ Google Drive
- **Input Type**: Binary Data
- **Binary Property**: data
- **Options**: (tùy chọn)

## Mã nguồn mẫu cho node n8n Function

### Xử lý đầu ra Extract PDF
```javascript
const items = [];
const result = $node["Extract PDF"].json;

// Nếu có OCR hoặc trích xuất văn bản thành công
if (result.text && result.text.trim() !== '') {
  items.push({
    json: {
      success: true,
      text: result.text,
      pageCount: result.metadata ? result.metadata.numberOfPages : 0,
      processingTime: result.performance.processingTime
    }
  });
} 
// Nếu có trích xuất hình ảnh
else if (result.images && result.images.length > 0) {
  for (const image of result.images) {
    items.push({
      json: {
        success: true,
        pageNumber: image.page,
        hasImage: true
      },
      binary: {
        image: {
          data: image.imageData.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/png',
          fileName: `page-${image.page}.png`
        }
      }
    });
  }
}
// Nếu không có văn bản và hình ảnh
else {
  items.push({
    json: {
      success: false,
      error: result.warning || 'Không thể trích xuất dữ liệu từ PDF'
    }
  });
}

return items;
```

### Kết hợp văn bản từ nhiều trang
```javascript
const pages = $input.all();
pages.sort((a, b) => a.json.pageNumber - b.json.pageNumber);

let combinedText = '';
for (const page of pages) {
  combinedText += `=== Trang ${page.json.pageNumber} ===\n\n${page.json.text}\n\n`;
}

return [{ json: { text: combinedText } }];
```

## Các giá trị có sẵn
- **OCR Language**: eng, vie, fra, deu, spa, chi_sim, chi_tra, jpn, kor
- **Page Range**: "1-5, 8, 11-13" hoặc để trống cho tất cả trang 