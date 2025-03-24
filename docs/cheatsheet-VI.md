# Extract PDF Node Cheatsheet
*Created by AI*

## Cài Đặt

```bash
# Cài đặt từ npm
npm install n8n-nodes-extract-pdf@1.0.18

# Hoặc cài đặt trong Docker
docker exec -it n8n npm install n8n-nodes-extract-pdf@1.0.18
```

## Trích Xuất Cơ Bản

### Trích xuất văn bản từ file PDF

```javascript
const extractNode = $input.item;
// Cấu hình
const config = {
  filePath: '/path/to/file.pdf',
  pageRange: '1-5',  // Tùy chọn, bỏ trống nếu muốn trích xuất tất cả trang
  includeMetadata: true
};

// Thực hiện trích xuất
const result = await $node.executeThisItem('extract', { config });

// Truy cập kết quả
const text = result.text;
const metadata = result.metadata;
```

## OCR và Xử Lý Hình Ảnh

### OCR cho PDF dạng hình ảnh

```javascript
const config = {
  filePath: '/path/to/scanned.pdf',
  performOcr: true,
  ocrLanguage: 'vie', // Ngôn ngữ OCR: eng, vie, fra, deu, spa, ita, jpn, kor, chi_sim
  ocrEnhancementLevel: 'medium' // none, low, medium, high
};

const result = await $node.executeThisItem('extract', { config });
```

## Tính Năng Mới: Xử Lý Đa Ngôn Ngữ (v1.0.18)

### Phát hiện và xử lý PDF đa ngôn ngữ

```javascript
const config = {
  filePath: '/path/to/multilingual.pdf',
  performOcr: true,
  enableMultilingualProcessing: true,
  autoDetectLanguage: true,
  // Tùy chọn: chỉ định ngôn ngữ dự kiến
  expectedLanguages: ['vie', 'eng', 'fra']
};

const result = await $node.executeThisItem('extractMultilingual', { config });

// Truy cập thông tin ngôn ngữ
const languageStats = result.languageStats; // Phần trăm của mỗi ngôn ngữ
const detectedLanguages = result.detectedLanguages; // Danh sách ngôn ngữ phát hiện được
```

### Xử lý kết quả ngôn ngữ

```javascript
// Lấy ngôn ngữ chính trong tài liệu
const primaryLanguage = Object.entries(result.languageStats)
  .sort((a, b) => b[1] - a[1])[0][0];

// Tạo báo cáo phân tích ngôn ngữ
let languageReport = "Phân tích ngôn ngữ:\n";
for (const [code, percentage] of Object.entries(result.languageStats)) {
  const langName = result.detectedLanguages.find(l => l.code === code)?.name || code;
  languageReport += `- ${langName}: ${(percentage * 100).toFixed(1)}%\n`;
}

// Kiểm tra và xử lý riêng cho từng ngôn ngữ
if (result.languageStats.vie > 0.5) {
  // Tài liệu chủ yếu là tiếng Việt
  // Xử lý theo yêu cầu đặc thù cho tiếng Việt
}
```

## Trích Xuất Bảng

```javascript
const config = {
  filePath: '/path/to/table.pdf',
  extractTables: true,
  tableExtractionMode: 'structured' // basic, structured, ai
};

const result = await $node.executeThisItem('extract', { config });
const tables = result.tables;

// Truy cập bảng đầu tiên
if (tables && tables.length > 0) {
  const firstTable = tables[0];
  const headers = firstTable.headers;
  const rows = firstTable.rows;
}
```

## Phát Hiện Loại Tài Liệu

```javascript
const config = {
  filePath: '/path/to/invoice.pdf',
  detectDocumentType: true,
  documentCategories: ['invoice', 'receipt', 'contract'],
  extractFormFields: true
};

const result = await $node.executeThisItem('extract', { config });
const documentType = result.documentType;
const formFields = result.formFields;

// Xử lý thông tin trích xuất
if (documentType === 'invoice') {
  const invoiceNumber = formFields.find(f => f.name === 'invoiceNumber')?.value;
  const totalAmount = formFields.find(f => f.name === 'totalAmount')?.value;
}
```

## Ví dụ Workflow

### Trích xuất và lưu trữ dữ liệu

```javascript
// Node 1: Đọc file PDF
// Node 2: Trích xuất với OCR
const pdfNode = $input.item;
const extractedData = await $node.executeThisItem('extract', {
  config: {
    filePath: pdfNode.binary.data.path,
    performOcr: true,
    extractTables: true,
    enableMultilingualProcessing: true
  }
});

// Node 3: Lưu vào database
return {
  json: {
    documentId: uuid(),
    text: extractedData.text,
    tables: extractedData.tables,
    languages: extractedData.languageStats,
    metadata: extractedData.metadata,
    extractedDate: new Date().toISOString()
  }
};
```

## Chú ý và Mẹo

- Để tăng tốc độ OCR, chỉ định chính xác ngôn ngữ thay vì dùng tự động phát hiện
- Sử dụng `pageRange` để giới hạn số trang cần xử lý khi làm việc với tệp lớn
- Tăng giá trị `chunkSize` để xử lý nhiều trang cùng lúc trên máy có hiệu suất cao
- Sử dụng `showProgress: true` để theo dõi tiến trình xử lý trên tệp lớn
- Nên sử dụng `extractMultilingual` thay vì `extract` khi làm việc với tài liệu đa ngôn ngữ

## Định Dạng Phạm Vi Trang Phổ Biến

- `"1,3,5"` - Trang 1, 3 và 5
- `"1-5"` - Từ trang 1 đến 5
- `"1-5,8,11-13"` - Từ trang 1 đến 5, trang 8 và từ trang 11 đến 13
- `""` (chuỗi rỗng) - Tất cả các trang

## Ngôn Ngữ OCR Được Hỗ Trợ

- `eng` - Tiếng Anh
- `fra` - Tiếng Pháp
- `deu` - Tiếng Đức
- `spa` - Tiếng Tây Ban Nha
- `ita` - Tiếng Ý
- `por` - Tiếng Bồ Đào Nha
- `nld` - Tiếng Hà Lan
- `vie` - Tiếng Việt
- `chi_sim` - Tiếng Trung giản thể

## Mức Độ Cải Thiện OCR

- `light` - Sửa chữa nhẹ, giữ nguyên văn bản gốc
- `medium` - Cân bằng giữa sửa chữa và giữ nguyên
- `aggressive` - Sửa chữa tối đa, có thể thay đổi văn bản đáng kể

## Mẹo Xử Lý Sự Cố

1. **Lỗi "Không Tìm Thấy Tệp"**
   - Kiểm tra xem đường dẫn tệp có chính xác và có thể truy cập
   - Đảm bảo quyền được thiết lập đúng

2. **Lỗi "Tệp Quá Lớn"**
   - Tăng thông số `maxFileSize`
   - Chia PDF thành các tệp nhỏ hơn

3. **Lỗi "Không Thể Trích Xuất Văn Bản"**
   - Thử bật OCR cho tài liệu được quét
   - Kiểm tra xem PDF có được bảo vệ bằng mật khẩu không

4. **Hiệu Suất OCR Chậm**
   - Sử dụng phạm vi trang cụ thể hơn
   - Giảm chất lượng hình ảnh để xử lý nhanh hơn
   - Sử dụng chia nhỏ với kích thước phần nhỏ hơn

5. **Bảng Trống hoặc Thiếu**
   - Kiểm tra xem PDF có chứa bảng thực sự (không phải hình ảnh của bảng)
   - Thử sử dụng OCR trước và sau đó trích xuất bảng

---
Created by AI 