# Ví dụ Workflow: OCR Nâng cao với API xử lý hình ảnh

Workflow này trích xuất hình ảnh từ PDF, xử lý bằng API Vision và sau đó thực hiện OCR chất lượng cao.

## Yêu cầu
- Tài khoản Google Cloud hoặc Azure với API Vision
- n8n-nodes-extract-pdf phiên bản 1.0.16 trở lên

## Thiết lập Workflow

### 1. Node Read Binary File
1. Thêm node **Read Binary File**
2. Cấu hình đường dẫn tới file PDF

### 2. Node Extract PDF
1. Thêm node **Extract PDF**:
   - **Input Type**: Binary Data
   - **Binary Property**: data
   - **Options**:
     - Bật **Extract Images**
     - Tắt **Perform OCR** (ta sẽ sử dụng OCR từ API Vision)
     - Chọn **Page Range** thích hợp

### 3. Node Function để xử lý hình ảnh
1. Thêm node **Function**
2. Code:
```javascript
const items = [];
const images = $node["Extract PDF"].json.images;

// Tạo một item riêng cho mỗi hình ảnh
if (images && Array.isArray(images)) {
  for (const image of images) {
    // Cắt tiền tố data:image/png;base64, để lấy chuỗi base64 thuần túy
    const base64Data = image.imageData.replace(/^data:image\/\w+;base64,/, '');
    
    items.push({
      json: {
        pageNumber: image.page,
        documentName: $node["Read Binary File"].json.fileName,
      },
      binary: {
        data: {
          data: base64Data,
          mimeType: 'image/png',
          fileName: `page-${image.page}.png`
        }
      }
    });
  }
}

return items;
```

### 4. Node HTTP Request (Google Cloud Vision API)
1. Thêm node **HTTP Request**
2. Cấu hình:
   - Method: POST
   - URL: `https://vision.googleapis.com/v1/images:annotate?key={{$node["Credentials"].json.apiKey}}`
   - Headers: `Content-Type: application/json`
   - Body:
```json
{
  "requests": [
    {
      "image": {
        "content": "{{$binary.data.data}}"
      },
      "features": [
        {
          "type": "DOCUMENT_TEXT_DETECTION",
          "maxResults": 1
        }
      ],
      "imageContext": {
        "languageHints": ["vi", "en"]
      }
    }
  ]
}
```

### 5. Node Function để xử lý kết quả
1. Thêm node **Function** để lấy văn bản từ kết quả API
2. Code:
```javascript
const response = $node["HTTP Request"].json.responses[0];
const extractedText = response.fullTextAnnotation ? response.fullTextAnnotation.text : '';
const pageNumber = $node["HTTP Request"].json.pageNumber;

return [
  {
    json: {
      pageNumber: pageNumber,
      text: extractedText,
      confidence: response.fullTextAnnotation ? response.fullTextAnnotation.pages[0].blocks.map(b => b.confidence).reduce((a, b) => a + b, 0) / response.fullTextAnnotation.pages[0].blocks.length : 0,
      documentName: $node["HTTP Request"].json.documentName
    }
  }
];
```

### 6. Node Merge
1. Thêm node **Merge** để kết hợp văn bản từ tất cả các trang
2. Chọn mode: Merge By Position

### 7. Node Function để tạo kết quả cuối cùng
1. Thêm node **Function** để tạo output cuối cùng
2. Code:
```javascript
// Sắp xếp các trang theo số thứ tự
const sortedItems = $input.all().sort((a, b) => a.json.pageNumber - b.json.pageNumber);

// Tạo văn bản đầy đủ
let fullText = '';
for (const item of sortedItems) {
  fullText += `--- Trang ${item.json.pageNumber} ---\n\n${item.json.text}\n\n`;
}

return [
  {
    json: {
      documentName: sortedItems[0].json.documentName,
      totalPages: sortedItems.length,
      fullText: fullText,
      pageDetails: sortedItems.map(item => ({
        pageNumber: item.json.pageNumber,
        text: item.json.text,
        confidence: item.json.confidence
      }))
    }
  }
];
```

### 8. Node Slack/Email/Telegram
1. Thêm node để gửi kết quả tới người dùng cuối

## Cải thiện hiệu suất OCR
- Thử nghiệm với các API khác (Microsoft Azure Computer Vision, Amazon Textract)
- Điều chỉnh các tham số tiền xử lý hình ảnh để cải thiện kết quả OCR
- Lưu ý các giới hạn về kích thước hình ảnh của mỗi API 