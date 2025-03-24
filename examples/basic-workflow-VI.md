# Quy Trình Trích Xuất PDF Cơ Bản

Ví dụ này minh họa một quy trình đơn giản để trích xuất văn bản và metadata từ tệp PDF.

## Thiết Lập Quy Trình

![Quy Trình Trích Xuất PDF Cơ Bản](../images/basic-workflow.png)

Quy trình này bao gồm các node sau:

1. **Node Bắt Đầu**: Được kích hoạt thủ công để bắt đầu quy trình
2. **HTTP Request**: Tải xuống tệp PDF từ một URL
3. **Extract PDF**: Trích xuất văn bản và metadata từ PDF
4. **Function**: Xử lý và định dạng dữ liệu đã trích xuất
5. **Set**: Chuẩn bị đầu ra cuối cùng
6. **Respond to Webhook**: Trả về kết quả

## Cấu Hình Node

### Node HTTP Request

- **Phương thức**: GET
- **URL**: `https://example.com/sample.pdf`
- **Định dạng phản hồi**: File
- **Thuộc tính nhị phân**: `data`

### Node Extract PDF

- **Nguồn PDF**: Dữ liệu nhị phân
- **Trường dữ liệu đầu vào**: `data`
- **Phạm vi trang**: `1-3` (để trống cho tất cả các trang)
- **Bao gồm Metadata**: Đã bật
- **Kích thước tệp tối đa (MB)**: 10
- **Trích xuất hình ảnh**: Đã tắt
- **Thực hiện OCR**: Đã tắt

### Node Function

```javascript
// Xử lý và định dạng dữ liệu PDF đã trích xuất
return [{
  json: {
    title: $input.first().json.metadata?.Title || 'Tài liệu không tiêu đề',
    author: $input.first().json.metadata?.Author || 'Tác giả không xác định',
    totalPages: $input.first().json.stats.pageCount,
    extractedPages: $input.first().json.pages.length,
    processingTime: $input.first().json.stats.processingTimeMs,
    wordCount: $input.first().json.text.split(/\s+/).length,
    firstPagePreview: $input.first().json.pages[0].text.substring(0, 200) + '...',
    fullText: $input.first().json.text
  }
}];
```

### Node Set

- **Chỉ giữ Set**: Đã bật
- **Giá trị để thiết lập**:
  - `data`: JSON của đầu ra function

### Node Respond to Webhook

- **Mã phản hồi**: 200
- **Chế độ phản hồi**: JSON
- **Dữ liệu phản hồi**: `data`

## Đầu Ra Mẫu

Quy trình sẽ tạo ra đầu ra tương tự như sau:

```json
{
  "title": "Tài liệu mẫu",
  "author": "Nguyễn Văn A",
  "totalPages": 5,
  "extractedPages": 3,
  "processingTime": 830,
  "wordCount": 1250,
  "firstPagePreview": "Đây là tài liệu mẫu minh họa các khả năng trích xuất PDF. Nội dung bao gồm văn bản có thể được trích xuất bằng node n8n-nodes-extract-pdf...",
  "fullText": "Đây là tài liệu mẫu minh họa các khả năng trích xuất PDF..."
}
```

## Biến Thể

### Thêm Hỗ Trợ OCR

Để bật OCR cho PDF dạng ảnh, hãy sửa đổi cấu hình node Extract PDF:

- **Thực hiện OCR**: Đã bật
- **Ngôn ngữ OCR**: Tiếng Việt (hoặc ngôn ngữ ưa thích của bạn)
- **Mức độ cải thiện OCR**: Trung bình

### Trích Xuất Bảng

Để trích xuất bảng từ PDF, hãy sửa đổi cấu hình node Extract PDF:

- **Trích xuất bảng**: Đã bật

Sau đó cập nhật node Function để xử lý dữ liệu bảng:

```javascript
// Xử lý và định dạng dữ liệu PDF đã trích xuất bao gồm bảng
const tables = $input.first().json.tables || [];
const tableCount = tables.reduce((count, page) => count + (page.tables?.length || 0), 0);

return [{
  json: {
    title: $input.first().json.metadata?.Title || 'Tài liệu không tiêu đề',
    author: $input.first().json.metadata?.Author || 'Tác giả không xác định',
    totalPages: $input.first().json.stats.pageCount,
    tableCount: tableCount,
    tables: tables,
    // ... các trường khác
  }
}];
```

## Các Phương Pháp Tốt Nhất

1. Luôn xác định kích thước tệp tối đa để ngăn xử lý các tệp rất lớn.
2. Sử dụng phạm vi trang khi bạn chỉ cần các trang cụ thể.
3. Chỉ bật OCR khi làm việc với PDF dạng ảnh để cải thiện hiệu suất.
4. Cân nhắc chia nhỏ cho các tệp lớn để cải thiện sử dụng bộ nhớ.
5. Sử dụng xử lý lỗi phù hợp cho các trường hợp PDF có thể được bảo vệ bằng mật khẩu hoặc bị hỏng.

---
Created by AI 