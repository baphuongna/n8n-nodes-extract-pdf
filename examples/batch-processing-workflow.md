# Ví dụ Workflow: Xử lý hàng loạt PDF

Workflow này tự động trích xuất văn bản từ nhiều file PDF trong một thư mục và lưu kết quả vào cơ sở dữ liệu.

## Thiết lập Workflow

### 1. Node FTP/SFTP
1. Thêm node **FTP** hoặc **SFTP** để quét thư mục chứa PDF
2. Cấu hình kết nối FTP/SFTP
3. Operation: **List**
4. Đường dẫn thư mục chứa PDF
5. Bộ lọc: `*.pdf`

### 2. Node Split In Batches
1. Thêm node **Split In Batches** và kết nối với node FTP/SFTP
2. Batch Size: 1 (để xử lý từng file một)

### 3. Node FTP/SFTP (Download)
1. Thêm node **FTP** hoặc **SFTP** thứ hai
2. Operation: **Download**
3. Binary Property Name: `data`
4. Path: Sử dụng đường dẫn từ kết quả trước

### 4. Node Extract PDF
1. Thêm node **Extract PDF**
2. Cấu hình:
   - **Input Type**: Binary Data
   - **Binary Property**: data
   - **Options**:
     - Bật **Process In Chunks**
     - Bật **Continue On Error** để không dừng khi có file lỗi
     - **Extract Images**: tùy nhu cầu
     - **Perform OCR**: tùy nhu cầu

### 5. Node Function
1. Thêm node **Function** để chuẩn bị dữ liệu
2. Code mẫu:
```javascript
return [
  {
    json: {
      filename: $node["Split In Batches"].json.name,
      filepath: $node["Split In Batches"].json.path,
      extractedText: $node["Extract PDF"].json.text,
      pageCount: $node["Extract PDF"].json.metadata ? $node["Extract PDF"].json.metadata.numberOfPages : 0,
      processTime: $node["Extract PDF"].json.performance.processingTime,
      extractedAt: new Date().toISOString()
    }
  }
];
```

### 6. Node MySQL/MongoDB/PostgreSQL
1. Thêm node cơ sở dữ liệu tương ứng
2. Cấu hình để lưu kết quả vào bảng/collection

### 7. Node Error Workflow
1. Cấu hình workflow xử lý lỗi
2. Thêm node **Send Email** để thông báo khi có lỗi xảy ra

## Lưu ý quan trọng
- Sử dụng **Error Workflow** để xử lý khi có file lỗi
- Đặt **Timeout** phù hợp cho mỗi node
- Sử dụng **Queue Mode** trong n8n để xử lý nhiều file cùng lúc
- Theo dõi tài nguyên hệ thống khi xử lý file lớn 