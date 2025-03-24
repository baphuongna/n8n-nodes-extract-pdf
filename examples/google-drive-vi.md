# Ví Dụ Quy Trình: Trích Xuất Văn Bản từ PDF trong Google Drive

Hướng dẫn này mô tả cách tạo quy trình tự động hóa trong n8n để trích xuất văn bản từ file PDF lưu trữ trong Google Drive.

## Tổng Quan Quy Trình

Quy trình này sẽ:
1. Theo dõi một thư mục cụ thể trong Google Drive
2. Khi phát hiện các file PDF mới, tải chúng xuống
3. Sử dụng node Extract PDF để trích xuất văn bản
4. Lưu trữ kết quả trong bảng tính Google Sheet
5. Gửi thông báo qua email

## Yêu Cầu

- Tài khoản n8n (tự host hoặc cloud)
- Tài khoản Google và quyền truy cập vào Google Drive/Sheets
- Node Extract PDF đã được cài đặt

## Các Bước Thiết Lập

### Bước 1: Thiết Lập Kích Hoạt Google Drive

1. Thêm node **Google Drive Trigger** vào không gian làm việc
2. Cấu hình xác thực Google
3. Thiết lập các tùy chọn sau:
   - Drive: Chọn drive của bạn
   - Sự kiện theo dõi: `File được tạo`
   - ID thư mục: ID của thư mục Google Drive bạn muốn theo dõi
   - Chỉ tệp loại: `application/pdf`
   - Khoảng thời gian kiểm tra: `5` phút

### Bước 2: Tải PDF từ Google Drive

1. Thêm node **Google Drive** sau node trigger
2. Hoạt động: `Tải xuống`
3. Drive ID: Bỏ trống (sử dụng mặc định)
4. File ID: `{{ $json.fileId }}`
5. Tùy chọn nhị phân dữ liệu: Bật
   
### Bước 3: Trích Xuất Văn Bản từ PDF

1. Thêm node **Extract PDF**
2. Cấu hình như sau:
   - Nguồn PDF: `Dữ liệu nhị phân`
   - Trường dữ liệu đầu vào: `data`
   - Bao gồm metadata: `Bật`
   - Kích thước tệp tối đa (MB): `15`
   - Thực hiện OCR: `Bật`
   - Ngôn ngữ OCR: Chọn ngôn ngữ thích hợp (`vie` cho tiếng Việt)
   - Trích xuất bảng: `Bật` (tùy chọn)

### Bước 4: Lưu Kết Quả vào Google Sheets

1. Thêm node **Google Sheets**
2. Hoạt động: `Thêm hàng`
3. Trang tính: Chọn hoặc tạo trang tính mới
4. Tiêu đề bảng tính: Chọn hoặc tạo mới
5. Các tùy chọn:
   - Phạm vi: `A:E`
   - Dữ liệu hàng:
     ```json
     {
       "values": [
         "{{ $now.toLocaleString() }}",
         "{{ $node["Google Drive"].json.name }}",
         "{{ $json.text.substr(0, 150) + '...' }}",
         "{{ $json.stats.pageCount }}",
         "{{ $json.documentClassification ? $json.documentClassification.documentType : 'Không xác định' }}"
       ]
     }
     ```

### Bước 5: Gửi Thông Báo Email

1. Thêm node **Send Email** (sử dụng node SMTP hoặc Gmail)
2. Địa chỉ người nhận: Email của bạn
3. Chủ đề: `PDF mới được xử lý: {{ $node["Google Drive"].json.name }}`
4. Nội dung:
   ```
   Một tệp PDF mới đã được xử lý:
   
   Tên tệp: {{ $node["Google Drive"].json.name }}
   Số trang: {{ $node["Extract PDF"].json.stats.pageCount }}
   Thời gian xử lý: {{ $node["Extract PDF"].json.stats.processingTimeMs / 1000 }} giây
   
   Trích đoạn:
   {{ $node["Extract PDF"].json.text.substr(0, 300) }}...
   
   Kết quả đầy đủ đã được lưu vào Google Sheets.
   ```

## Chức Năng Nâng Cao (Tùy Chọn)

### Xử Lý PDF Có Mật Khẩu

Nếu PDF có mật khẩu, thêm node **Code** trước node Extract PDF:

```javascript
// Lưu ý: Bạn cần biết mật khẩu của PDF
const PDFDocument = require('pdf-lib').PDFDocument;

// Lấy dữ liệu nhị phân từ Google Drive
const pdfBuffer = Buffer.from($input.item.json.data, 'base64');

(async () => {
  try {
    // Tải tài liệu PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      password: 'mật_khẩu_của_bạn' // Thay thế bằng mật khẩu thực
    });
    
    // Lưu PDF đã mở khóa
    const unlocked = await pdfDoc.save();
    
    // Trả về dữ liệu đã mở khóa
    return {
      ...($input.item.json),
      data: Buffer.from(unlocked).toString('base64')
    };
  } catch (error) {
    console.error('Lỗi khi mở khóa PDF:', error);
    return $input.item;
  }
})();
```

### Phân Loại Tài Liệu Tự Động

Thêm node **Switch** sau node Extract PDF để xử lý các tài liệu khác nhau:

1. Cấu hình node Switch:
   - Mode: `Expression`
   - Điều kiện 1: `{{ $json.documentClassification?.documentType === "invoice" }}`
   - Điều kiện 2: `{{ $json.documentClassification?.documentType === "receipt" }}`
   - Điều kiện mặc định: `true`

2. Thêm các nhánh xử lý riêng cho mỗi loại tài liệu:
   - Node cụ thể cho hóa đơn
   - Node cụ thể cho biên lai
   - Node xử lý các loại tài liệu khác

## Xử Lý Lỗi

Thêm node **Error Trigger** để bắt lỗi và xử lý phù hợp:

1. Kết nối lỗi từ các node chính
2. Thêm node **Send Email** để thông báo lỗi
3. Cấu hình thông báo lỗi:
   - Chủ đề: `Lỗi khi xử lý PDF: {{ $node["Google Drive"].json.name }}`
   - Nội dung: `Đã xảy ra lỗi khi xử lý tệp: {{ $node.Error.json.message }}`

## Lưu Ý Bổ Sung

- **Xử lý PDF lớn**: Tăng thông số `maxFileSize` và `chunkSize` nếu bạn thường xuyên làm việc với file lớn
- **Tối ưu OCR**: Chỉ định ngôn ngữ chính xác cho OCR để tăng độ chính xác và hiệu suất
- **Bảng và Biểu đồ**: Sử dụng dữ liệu trích xuất từ bảng để tạo biểu đồ trong Google Sheets
- **Tốc độ xử lý**: Đối với quy trình xử lý lượng lớn tài liệu, hãy cân nhắc thiết lập cấu hình tài nguyên n8n cao hơn

---
Created by AI 