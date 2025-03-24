# Ví dụ Workflow: Trích xuất PDF từ Google Drive

Workflow này trình bày cách sử dụng node Extract PDF để xử lý tệp PDF từ Google Drive.

## Yêu cầu
- Đã cài đặt n8n-nodes-extract-pdf
- Đã cấu hình Google Drive OAuth trong n8n

## Thiết lập Workflow

### 1. Node Google Drive
1. Thêm node **Google Drive** vào workflow
2. Cấu hình tài khoản Google Drive OAuth
3. Chọn Operation: **Download**
4. Chọn cách xác định tệp:
   - **By ID**: Nhập ID tệp PDF
   - **By Path**: Nhập đường dẫn tới tệp PDF
   - **From List**: Chọn từ danh sách tệp

### 2. Node Extract PDF
1. Thêm node **Extract PDF** và kết nối với node Google Drive
2. Cấu hình như sau:
   - **Input Type**: Binary Data
   - **Binary Property**: data (hoặc property từ Google Drive, thường là "data")
   - **Options**:
     - Bật **Perform OCR** nếu cần trích xuất văn bản từ PDF quét
     - Chọn **OCR Language** phù hợp
     - Bật **Extract Images** nếu cần trích xuất hình ảnh
     - Cấu hình **Process In Chunks** cho tệp lớn

### 3. Node JSON/Set
1. Thêm node **Set** để xử lý kết quả
2. Cấu hình để lưu các giá trị:
   ```
   {
     "fileInfo": {{$node["Google Drive"].json.name}},
     "extractedText": {{$node["Extract PDF"].json.text}},
     "metadata": {{$node["Extract PDF"].json.metadata}},
     "processTime": {{$node["Extract PDF"].json.performance.processingTime}}
   }
   ```
   
### 4. (Tùy chọn) Node Google Sheets
1. Thêm node **Google Sheets** để lưu kết quả
2. Cấu hình để lưu dữ liệu vào bảng tính

## Cách xử lý PDF quét

Đối với PDF quét, hãy sử dụng cấu hình sau:

1. Trong node **Extract PDF**:
   - Bật **Perform OCR**
   - Chọn ngôn ngữ văn bản trong PDF
   - Đặt **Chunk Size** thành 1 để xử lý từng trang một
   - Bật **Show Progress** để theo dõi quá trình

## Xử lý hình ảnh từ PDF

Để trích xuất và xử lý hình ảnh từ PDF:

1. Trong node **Extract PDF**:
   - Bật **Extract Images**
   
2. Thêm node **Split In Batches** sau node Extract PDF:
   - Chọn "items" làm Input Field
   - Thiết lập Batch Size thành 1
   
3. Thêm node **HTTP Request** sau Split In Batches:
   - Đặt URL tới dịch vụ xử lý ảnh (ví dụ: Google Cloud Vision)
   - Method: POST
   - JSON Body: Sử dụng JSON từ Extract PDF

## Tối ưu hóa hiệu suất

Đối với các tệp PDF lớn từ Google Drive:

1. Sử dụng **Process In Chunks** để tránh lỗi hết bộ nhớ
2. Thiết lập **Chunk Size** phù hợp (5-10 trang)
3. Giới hạn giá trị **Max File Size** để tránh tải về tệp quá lớn
4. Sử dụng **Continue On Error** để xử lý tệp ngay cả khi có lỗi

## Ví dụ JSON đầu ra

Đầu ra điển hình từ node Extract PDF:

```json
{
  "text": "Nội dung văn bản từ PDF...",
  "performance": {
    "processingTime": "3.45s",
    "pagesProcessed": 10,
    "pagesPerSecond": "2.89"
  },
  "metadata": {
    "info": {
      "Title": "Tên tài liệu",
      "Author": "Tác giả",
      "CreationDate": "D:20220714103005Z"
    },
    "numberOfPages": 10
  },
  "images": [
    {
      "page": 1,
      "imageData": "data:image/png;base64,..."
    }
  ],
  "ocrPerformed": true
}
``` 