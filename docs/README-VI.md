# n8n-nodes-extract-pdf

![Node Extract PDF Logo](https://n8n.io/n8n-logo.png)

Node tùy chỉnh cho n8n để trích xuất văn bản, hình ảnh và bảng từ tệp PDF với hỗ trợ đa ngôn ngữ.

## Tính Năng

- ✅ Trích xuất văn bản từ PDF thông thường và PDF dạng ảnh
- ✅ OCR (Nhận dạng ký tự quang học) cho các PDF dạng scan
- ✅ Xử lý PDF đa ngôn ngữ với tự động phát hiện ngôn ngữ
- ✅ Tạo thống kê phân bố ngôn ngữ trong tài liệu
- ✅ Trích xuất và xử lý bảng
- ✅ Trích xuất hình ảnh từ PDF
- ✅ Nhận diện loại tài liệu tự động
- ✅ Trích xuất metadata và thông tin tệp
- ✅ Xử lý hiệu quả tệp PDF lớn

## Phiên Bản Mới (v1.0.18)

Chúng tôi vừa phát hành phiên bản mới với các tính năng đa ngôn ngữ:

1. **Hỗ trợ đa ngôn ngữ**: Tự động phát hiện và xử lý nhiều ngôn ngữ trong cùng một tài liệu
2. **Thống kê ngôn ngữ**: Tạo báo cáo thống kê về phân bố ngôn ngữ trong tài liệu
3. **Cải thiện OCR**: Tối ưu hóa quá trình OCR cho từng ngôn ngữ phát hiện được
4. **Tăng cường hình ảnh**: Cải thiện chất lượng OCR thông qua xử lý hình ảnh

## Tổng Quan

Node Extract PDF cho phép bạn trích xuất dữ liệu từ tệp PDF một cách dễ dàng và linh hoạt. Nó cũng hỗ trợ OCR cho các PDF dạng ảnh hoặc văn bản quét, nhận diện loại tài liệu và trích xuất bảng.

### Chức Năng Chính:

- ✅ Trích xuất văn bản từ PDF
- ✅ Trích xuất metadata của tệp PDF
- ✅ Định dạng và làm sạch văn bản trích xuất
- ✅ OCR (Nhận dạng ký tự quang học) cho PDF dạng ảnh
- ✅ Hỗ trợ xử lý đa ngôn ngữ và tự động phát hiện ngôn ngữ 
- ✅ Tạo thống kê phân bố ngôn ngữ trong tài liệu
- ✅ Trích xuất hình ảnh từ PDF
- ✅ Trích xuất và định dạng bảng
- ✅ Nhận diện loại tài liệu và trích xuất trường thông tin
- ✅ Xử lý PDF lớn với phân trang
- ✅ Hỗ trợ nhiều ngôn ngữ cho OCR

## Tính năng mới (v1.0.18)

### Xử lý PDF đa ngôn ngữ

Chúng tôi vừa thêm khả năng xử lý các tài liệu PDF đa ngôn ngữ với các tính năng mới:

1. **Phát hiện ngôn ngữ tự động**: Sử dụng thuật toán phân tích ngôn ngữ để tự động phát hiện ngôn ngữ trong từng trang hoặc đoạn văn
2. **Thống kê ngôn ngữ**: Tạo báo cáo thống kê về phân bố ngôn ngữ trong tài liệu
3. **Xử lý OCR đa ngôn ngữ**: Tối ưu quá trình OCR cho các tài liệu chứa nhiều ngôn ngữ
4. **Tăng cường chất lượng hình ảnh**: Cải thiện chất lượng của quá trình OCR bằng xử lý ảnh nâng cao
5. **Xử lý hàng loạt các trang với các ngôn ngữ khác nhau**: Xử lý từng trang với ngôn ngữ phù hợp

### Sử dụng tính năng đa ngôn ngữ

```typescript
// Ví dụ gọi hàm xử lý PDF đa ngôn ngữ
const result = await this.processMultilingualPDF(
  pdfBuffer,
  ['vie', 'eng', 'fra'], // Danh sách ngôn ngữ cần xử lý
  {
    startPage: 1,
    endPage: 5,
    enhanceImage: true,
    dpi: 300
  }
);

// Kết quả trả về bao gồm văn bản và thống kê ngôn ngữ
console.log(result.text);
console.log(result.languageStats);
```

## Cài Đặt

### Phương Pháp 1: Trong giao diện n8n

1. Truy cập setting của n8n
2. Chọn tab "Community nodes"
3. Tìm "n8n-nodes-extract-pdf" và click vào "Install"

### Phương Pháp 2: Sử dụng CLI

```bash
npm install n8n-nodes-extract-pdf@1.0.18
```

### Phương Pháp 3: Trong Docker

```bash
# Sử dụng image cơ bản của n8n
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n \
  n8n start

# Sau đó cài đặt node
docker exec -it n8n npm install n8n-nodes-extract-pdf@1.0.18

# Khởi động lại container
docker restart n8n
```

### Cài Đặt OCR (Tùy Chọn - Cần Thiết Cho PDF Dạng Ảnh)

Để sử dụng chức năng OCR, bạn cần cài đặt Tesseract OCR:

**Windows:**
1. Tải và cài đặt từ: https://github.com/UB-Mannheim/tesseract/wiki
2. Thêm đường dẫn cài đặt Tesseract vào PATH hệ thống

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Cài Đặt Gói Ngôn Ngữ (Tùy Chọn):**
```bash
# Ubuntu/Debian (thay 'vie' bằng mã ngôn ngữ tương ứng)
sudo apt-get install -y tesseract-ocr-vie

# macOS
brew install tesseract-lang
```

## Sử Dụng

### Tệp Nguồn PDF

Node hỗ trợ hai nguồn PDF:

1. **Đường Dẫn Tệp**: Chỉ định đường dẫn đến tệp PDF trên hệ thống tệp cục bộ
2. **Dữ Liệu Nhị Phân**: Chọn trường đầu vào chứa dữ liệu nhị phân của PDF

### Trích Xuất Văn Bản Cơ Bản

1. Thêm node "Extract PDF" vào workflow
2. Chọn nguồn PDF (đường dẫn tệp hoặc dữ liệu nhị phân)
3. Chỉ định phạm vi trang (để trống cho tất cả các trang)
4. Cấu hình các tùy chọn khác và chạy workflow

### OCR cho PDF Dạng Ảnh

1. Bật tùy chọn "Perform OCR"
2. Chọn ngôn ngữ OCR (mặc định: tiếng Anh)
3. Chọn mức độ tăng cường OCR nếu cần

### Trích Xuất Bảng

1. Bật tùy chọn "Extract Tables"
2. Định cấu hình bất kỳ thông số trích xuất bảng bổ sung
3. Chạy workflow để nhận bảng đã định dạng

### Nhận Diện Loại Tài Liệu

1. Bật tùy chọn "Detect Document Type"
2. Chỉ định các loại tài liệu cần nhận diện (hóa đơn, biên lai, hợp đồng, v.v.)
3. Tùy chọn, cấu hình đường dẫn đến mẫu tùy chỉnh

## Cấu Hình

Node hỗ trợ các tùy chọn sau:

| Tùy Chọn | Mô Tả | Loại | Mặc Định |
|----------|-------------|------|---------|
| pdfSource | Nguồn của tệp PDF | Lựa chọn | filePath |
| filePath | Đường dẫn đến tệp PDF | Chuỗi | |
| inputDataField | Tên trường chứa dữ liệu PDF | Chuỗi | data |
| pageRange | Phạm vi trang cần trích xuất (ví dụ: "1,3,5-9") | Chuỗi | |
| includeMetadata | Bao gồm metadata của tệp PDF | Boolean | false |
| maxFileSize | Kích thước tệp tối đa (MB) | Số | 5 |
| chunkSize | Số trang xử lý mỗi lần | Số | 10 |
| showProgress | Hiển thị tiến trình xử lý | Boolean | false |
| extractImages | Trích xuất hình ảnh từ PDF | Boolean | false |
| performOcr | Thực hiện OCR trên PDF dạng ảnh | Boolean | false |
| ocrLanguage | Ngôn ngữ OCR (ví dụ: "eng", "vie") | Chuỗi | eng |
| ocrEnhancementLevel | Mức độ tăng cường OCR | Lựa chọn | medium |
| extractTables | Trích xuất bảng từ PDF | Boolean | false |
| detectDocumentType | Nhận diện loại tài liệu | Boolean | false |
| extractFormFields | Trích xuất trường biểu mẫu | Boolean | false |
| documentCategories | Danh sách loại tài liệu cần nhận diện | Chuỗi | |
| customTemplatesPath | Đường dẫn đến mẫu tùy chỉnh | Chuỗi | |

## Kết Quả Đầu Ra

Kết quả đầu ra của node bao gồm:

- **text**: Văn bản đầy đủ của tệp PDF
- **pages**: Mảng các đối tượng trang với văn bản cho mỗi trang
- **metadata**: Metadata của tệp PDF (nếu bật includeMetadata)
- **stats**: Thống kê về tệp PDF (số trang, thời gian xử lý, v.v.)
- **images**: Mảng các hình ảnh trích xuất (nếu bật extractImages)
- **tables**: Mảng các bảng trích xuất theo trang (nếu bật extractTables)
- **documentClassification**: Kết quả nhận diện loại tài liệu (nếu bật detectDocumentType)
- **extractedFields**: Các trường thông tin đã trích xuất (nếu bật extractFormFields)

Ví dụ về cấu trúc kết quả đầu ra:

```json
{
  "text": "Đây là nội dung văn bản của tệp PDF...",
  "pages": [
    { "pageNum": 1, "text": "Nội dung trang 1..." },
    { "pageNum": 2, "text": "Nội dung trang 2..." }
  ],
  "metadata": {
    "Title": "Tên tài liệu",
    "Author": "Tác giả",
    "CreationDate": "2023-01-15T00:00:00.000Z"
  },
  "stats": {
    "pageCount": 2,
    "processingTimeMs": 1250,
    "fileSize": "1.2MB"
  },
  "images": [
    { "pageNum": 1, "index": 0, "format": "png", "data": "base64-encoded-image-data" }
  ],
  "tables": [
    {
      "pageNum": 1,
      "tables": [
        {
          "rows": [
            ["Tiêu đề 1", "Tiêu đề 2", "Tiêu đề 3"],
            ["Dữ liệu 1", "Dữ liệu 2", "Dữ liệu 3"]
          ]
        }
      ]
    }
  ],
  "documentClassification": {
    "documentType": "invoice",
    "confidence": 0.92
  },
  "extractedFields": {
    "invoiceNumber": "INV-2023-001",
    "date": "2023-01-15",
    "total": "1,000,000 VND"
  }
}
```

## Xử Lý Lỗi

Node xử lý các lỗi phổ biến sau:

### Lỗi "Không Tìm Thấy Tệp"
- Kiểm tra xem đường dẫn tệp có chính xác không
- Xác minh quyền truy cập vào tệp
- Nếu sử dụng Docker, đảm bảo tệp truy cập được từ container

### Lỗi "Tệp Quá Lớn"
- Tăng tham số `maxFileSize`
- Chia PDF thành các tệp nhỏ hơn
- Sử dụng `chunkSize` để xử lý tệp lớn

### Lỗi "Không Thể Thực Hiện OCR Trên PDF"
- Kiểm tra xem Tesseract đã được cài đặt chính xác chưa
- Xác minh gói ngôn ngữ OCR đã được cài đặt
- Đảm bảo PDF không bị hỏng
- Kiểm tra quyền đọc/ghi trong thư mục làm việc

### Lỗi "OCR Quá Chậm"
- Giảm số trang được xử lý
- Chỉ định phạm vi trang cụ thể
- Tăng `chunkSize` để xử lý nhiều trang cùng lúc
- Giảm DPI của hình ảnh để tăng tốc xử lý

### Lỗi "Không Thể Trích Xuất Bảng"
- Đảm bảo PDF chứa bảng thực sự, không phải hình ảnh của bảng
- Thử sử dụng OCR trước, sau đó trích xuất bảng
- Kiểm tra định dạng bảng trong PDF

## Trường Hợp Đặc Biệt

### PDF Được Bảo Vệ Bằng Mật Khẩu
Node hiện không hỗ trợ trực tiếp mở khóa PDF được bảo vệ bằng mật khẩu. Bạn cần mở khóa PDF trước khi sử dụng node này.

### PDF Phức Tạp
Một số PDF có cấu trúc phức tạp có thể yêu cầu chiến lược trích xuất đặc biệt:
- Sử dụng tùy chọn OCR thay vì trích xuất văn bản chuẩn
- Điều chỉnh các tham số trích xuất cho độ chính xác tốt hơn
- Chia PDF thành các trang riêng lẻ trước khi xử lý

### PDF Nhiều Ngôn Ngữ
- Sử dụng tham số `ocrLanguage` với giá trị thích hợp
- Cài đặt gói ngôn ngữ cần thiết cho Tesseract
- Kết hợp các mã ngôn ngữ (ví dụ: "eng+vie") cho tài liệu đa ngôn ngữ

## Tối Ưu Hóa Hiệu Suất

1. **Chỉ Trích Xuất Những Gì Bạn Cần**
   - Tắt includeMetadata/extractImages nếu không cần thiết
   - Chỉ định phạm vi trang cụ thể thay vì toàn bộ tài liệu

2. **Tối Ưu Hóa OCR**
   - Chỉ sử dụng OCR khi cần thiết
   - Chỉ định ngôn ngữ chính xác để cải thiện độ chính xác và tốc độ
   - Điều chỉnh mức độ tăng cường OCR dựa trên chất lượng tài liệu

3. **Xử Lý Tệp Lớn**
   - Tăng giá trị chunkSize để xử lý nhiều trang cùng lúc
   - Chia tài liệu lớn thành các phần nhỏ hơn trước khi xử lý
   - Sử dụng showProgress để theo dõi tiến trình trên tài liệu dài

## Câu Hỏi Thường Gặp

### PDF Là Gì?
PDF (Portable Document Format) là định dạng tệp được phát triển bởi Adobe để trình bày tài liệu độc lập với phần mềm, phần cứng và hệ điều hành.

### PDF Dạng Ảnh Là Gì?
PDF dạng ảnh là tài liệu PDF chứa hình ảnh quét của các trang thay vì văn bản kỹ thuật số. Những tệp này yêu cầu OCR để trích xuất văn bản.

### OCR Là Gì?
OCR (Optical Character Recognition - Nhận dạng ký tự quang học) là công nghệ chuyển đổi hình ảnh của văn bản thành văn bản có thể chỉnh sửa và tìm kiếm được.

### Tại Sao Trích Xuất Văn Bản Không Hoạt Động?
Có một số nguyên nhân có thể:
- PDF có thể là dạng ảnh cần OCR
- PDF có thể được bảo vệ hoặc mã hóa
- PDF có thể chứa văn bản dưới dạng đồ họa vector
- Định dạng PDF có thể không chuẩn hoặc bị hỏng

### Làm Thế Nào Để Cải Thiện Tốc Độ OCR?
- Chỉ xử lý các trang cần thiết
- Sử dụng ngôn ngữ OCR cụ thể thay vì đa ngôn ngữ
- Tăng chunkSize để xử lý song song
- Giảm DPI của hình ảnh khi có thể

### Làm Thế Nào Để Xử Lý PDF Nhiều Ngôn Ngữ?
Sử dụng tham số `ocrLanguage` với chuỗi kết hợp các mã ngôn ngữ (ví dụ: "eng+vie" cho tài liệu tiếng Anh và tiếng Việt).

### Node Này Có Trích Xuất Bảng Không?
Có, bạn có thể bật tùy chọn `extractTables` để trích xuất bảng từ PDF. Kết quả sẽ được định dạng dưới dạng mảng hai chiều.

### Làm Thế Nào Để Giải Quyết Lỗi "Không Tải Được Gói Ngôn Ngữ"?
Đảm bảo bạn đã cài đặt gói ngôn ngữ Tesseract cần thiết cho hệ điều hành của mình. Xem hướng dẫn cài đặt OCR.

## Sử Dụng API Mới

### Xử Lý PDF Đa Ngôn Ngữ

Sử dụng phương thức `processMultilingualPDF` để tự động phát hiện và xử lý tài liệu đa ngôn ngữ:

```javascript
const result = await extractPdfNode.processMultilingualPDF({
  filePath: '/đường/dẫn/đến/file.pdf',
  pageRange: '1-5', // Tùy chọn
  performOcr: true,  // Bật OCR nếu cần
  enhanceImages: true // Tăng cường chất lượng hình ảnh
});

// Kết quả trả về
console.log(result.text); // Văn bản đã được trích xuất
console.log(result.languageStats); // Thống kê về ngôn ngữ
console.log(result.detectedLanguages); // Danh sách ngôn ngữ đã phát hiện
```

### Mẫu Kết Quả

```json
{
  "text": "Toàn bộ văn bản trích xuất từ tài liệu",
  "languageStats": {
    "vie": 0.65, // 65% Tiếng Việt
    "eng": 0.30, // 30% Tiếng Anh
    "fra": 0.05  // 5% Tiếng Pháp
  },
  "detectedLanguages": [
    {
      "code": "vie",
      "name": "Vietnamese",
      "confidence": 0.89,
      "pages": [1, 2, 5]
    },
    {
      "code": "eng",
      "name": "English",
      "confidence": 0.92,
      "pages": [3, 4]
    }
  ],
  "processingTime": "2.4s",
  "totalPages": 5
}
```

### Tích Hợp với n8n

Để sử dụng tính năng đa ngôn ngữ trong workflow n8n:

1. Thêm node "Extract PDF"
2. Cấu hình nguồn PDF 
3. Bật tùy chọn "Multi-language Processing"
4. Chọn các ngôn ngữ cần hỗ trợ hoặc để trống để tự động phát hiện
5. Bật "Perform OCR" nếu cần xử lý PDF dạng ảnh

## Liên Hệ & Đóng Góp

Nếu bạn có câu hỏi, phát hiện lỗi hoặc muốn đóng góp, vui lòng tạo issue hoặc pull request trên GitHub.

---
Created by AI 