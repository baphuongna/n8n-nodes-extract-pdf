# n8n-nodes-extract-pdf

Node n8n này trích xuất văn bản từ tệp PDF với nhiều tùy chọn mạnh mẽ.

## Mô tả

Node `n8n-nodes-extract-pdf` là một node tùy chỉnh cho n8n giúp trích xuất nội dung văn bản từ tệp PDF. Node này sử dụng thư viện `pdf-parse` để phân tích và trích xuất nội dung văn bản từ tệp PDF.

### Tính năng chính

- Trích xuất văn bản từ toàn bộ PDF
- Trích xuất văn bản từ các trang cụ thể (ví dụ: "1-5, 8, 11-13")
- Trích xuất metadata của tệp PDF
- Kiểm soát kích thước tệp tối đa có thể xử lý
- Xử lý lỗi chi tiết cho các loại PDF khác nhau
- Xử lý hiệu quả các tệp PDF lớn bằng cách chia thành các phần nhỏ
- Hỗ trợ theo dõi tiến trình cho các tệp lớn
- Báo cáo hiệu suất với thời gian xử lý và tốc độ

## Cài đặt

Bạn có thể cài đặt gói từ npm:

```bash
npm install n8n-nodes-extract-pdf@1.0.7
```

Hoặc bạn có thể sao chép kho lưu trữ và làm theo các bước sau:

1. Sao chép kho lưu trữ:
   ```bash
   git clone https://github.com/yourusername/n8n-nodes-extract-pdf.git
   ```

2. Di chuyển đến thư mục dự án:
   ```bash
   cd n8n-nodes-extract-pdf
   ```

3. Cài đặt các phụ thuộc:
   ```bash
   npm install
   ```

4. Xây dựng dự án:
   ```bash
   npm run build
   ```

5. Khởi động lại n8n để tải node mới.

## Cách sử dụng

1. Cài đặt gói từ npm:
   ```bash
   npm install n8n-nodes-extract-pdf@1.0.7
   ```

2. Thêm node `Extract PDF` vào workflow n8n của bạn.
3. Cấu hình node để đọc tệp PDF.
4. Chạy workflow để trích xuất văn bản từ tệp PDF.

### Tùy chọn cấu hình

Node này cung cấp nhiều tùy chọn cấu hình:

- **PDF File**: Tệp PDF để trích xuất văn bản (bắt buộc)
- **Page Range**: Phạm vi trang để trích xuất (ví dụ: "1-5, 8, 11-13"). Để trống để trích xuất tất cả các trang.
- **Include Metadata**: Bao gồm metadata của PDF trong đầu ra.
- **Max File Size (MB)**: Kích thước tệp tối đa để xử lý (mặc định: 100MB).
- **Continue On Error**: Tiếp tục thực thi ngay cả khi trích xuất thất bại cho một số trang.
- **Process In Chunks**: Xử lý tệp PDF lớn theo từng phần nhỏ để cải thiện hiệu suất.
- **Chunk Size (Pages)**: Số trang để xử lý trong mỗi phần (khi xử lý theo từng phần).
- **Show Progress**: Hiển thị thông tin tiến trình trong quá trình xử lý.

### Kết quả đầu ra

Kết quả đầu ra của node sẽ là một đối tượng JSON chứa:

```json
{
  "text": "Nội dung văn bản trích xuất từ PDF",
  "performance": {
    "processingTime": "2.34s",
    "pagesProcessed": 15,
    "pagesPerSecond": "6.41"
  },
  "metadata": {
    "info": { ... },
    "metadata": { ... },
    "numberOfPages": 5,
    "version": "1.10.100"
  }
}
```

- Phần `metadata` chỉ được bao gồm nếu tùy chọn "Include Metadata" được bật.
- Phần `performance` cung cấp thông tin về thời gian xử lý và tốc độ.
- Nếu không có văn bản nào được trích xuất (như trong trường hợp PDF quét), bạn sẽ nhận được thông báo cảnh báo trong trường `warning`.

## Xử lý tệp PDF lớn

Node này đã được tối ưu hóa để xử lý các tệp PDF lớn thông qua tính năng xử lý theo từng phần. Khi bạn bật tính năng này, lưu ý:

1. **Phân tách thành các phần**: PDF lớn được chia thành các phần nhỏ để xử lý riêng biệt.
2. **Hiển thị tiến trình**: Bạn có thể theo dõi tiến trình xử lý trong nhật ký n8n.
3. **Báo cáo hiệu suất**: Bạn sẽ nhận được báo cáo hiệu suất chi tiết trong kết quả.

Đối với tệp PDF lớn, chúng tôi khuyến nghị:

- Bật tùy chọn "Process In Chunks" 
- Thiết lập "Chunk Size" dựa trên độ phức tạp của PDF (10-20 trang là hợp lý cho hầu hết các tệp)
- Bật "Show Progress" để theo dõi quá trình

## Xử lý lỗi và các trường hợp đặc biệt

### PDF được bảo vệ bằng mật khẩu

Node sẽ phát hiện và báo lỗi nếu PDF được bảo vệ bằng mật khẩu. Hiện tại, node không hỗ trợ xử lý các tệp PDF được bảo vệ.

### PDF quét hoặc dựa trên hình ảnh

Đối với PDF quét hoặc PDF dựa trên hình ảnh không có lớp văn bản, node sẽ trả về:

```json
{
  "text": "",
  "warning": "No text was extracted. This might be a scanned PDF or an image-based PDF without text layer."
}
```

Để xử lý PDF quét, bạn có thể cần sử dụng OCR (Nhận dạng ký tự quang học) trước khi sử dụng node này.

### PDF có cấu trúc phức tạp

Một số PDF có cấu trúc phức tạp (như nhiều cột, bảng, đồ thị) có thể không giữ lại định dạng trong đầu ra văn bản thuần túy. Trong trường hợp này:

1. Node vẫn trích xuất văn bản, nhưng định dạng có thể không được giữ nguyên.
2. Thứ tự văn bản có thể khác với thứ tự trực quan trong PDF.

### Xử lý lỗi với tùy chọn "Continue On Error"

Khi bật tùy chọn "Continue On Error":

1. Node sẽ bỏ qua lỗi khi xử lý các trang cụ thể và tiếp tục với các trang khác.
2. Các cảnh báo sẽ được ghi vào nhật ký n8n.
3. Kết quả đầu ra sẽ bao gồm văn bản từ các trang đã xử lý thành công.

## Ví dụ chi tiết

### Ví dụ 1: Trích xuất tất cả trang từ tệp PDF nhỏ

1. Sử dụng node `Read Binary File` để đọc tệp PDF.
   - Thiết lập đường dẫn đến tệp PDF của bạn
   
2. Sử dụng node `Extract PDF` để trích xuất văn bản.
   - Kết nối với đầu ra của node `Read Binary File`
   - Không thiết lập Page Range để trích xuất tất cả các trang
   - Tắt Process In Chunks vì đây là tệp nhỏ

3. Sử dụng node `Set` để lưu trữ kết quả.
   - Thiết lập biến đầu ra, ví dụ: `data.extractedText = $node["Extract PDF"].json.text`

### Ví dụ 2: Trích xuất trang cụ thể từ tệp PDF lớn

1. Sử dụng node `Read Binary File` để đọc tệp PDF lớn.
   - Thiết lập đường dẫn đến tệp PDF của bạn
   
2. Sử dụng node `Extract PDF` với cấu hình hiệu suất:
   - Kết nối với đầu ra của node `Read Binary File`
   - Thiết lập Page Range, ví dụ: "1-10, 15, 20-25"
   - Bật Process In Chunks
   - Thiết lập Chunk Size thành 5
   - Bật Show Progress
   - Bật Include Metadata để lấy thông tin tài liệu

3. Thêm node `IF` để kiểm tra văn bản trống:
   - Nếu `$node["Extract PDF"].json.text` trống, có thể tệp đó là PDF quét
   - Xử lý tương ứng dựa trên kết quả

### Ví dụ 3: Xử lý batch nhiều tệp PDF

1. Sử dụng node `Read Files From Folder` để quét thư mục chứa nhiều tệp PDF.
   
2. Thêm node `Split In Batches` để xử lý từng tệp riêng biệt.
   
3. Sử dụng node `Extract PDF` với tùy chọn Continue On Error:
   - Bật Continue On Error để bỏ qua tệp có vấn đề
   - Bật Process In Chunks cho hiệu suất tốt hơn

4. Thêm node `Merge` để kết hợp kết quả từ tất cả các tệp.

## Xử lý lỗi

Node này xử lý các lỗi sau một cách rõ ràng:

- **Tệp PDF không tồn tại**: "PDF file not found: [đường dẫn]"
- **Kích thước tệp vượt quá giới hạn**: "File size (X MB) exceeds the maximum allowed size (Y MB)"
- **PDF được bảo vệ**: "The PDF file is password protected. This node cannot process protected PDFs."
- **Phạm vi trang không hợp lệ**: "Invalid page range format: [chi tiết lỗi]"
- **Số trang vượt quá tổng số trang**: "Page range includes page X, but the document only has Y page(s)"
- **PDF bị hỏng**: "The PDF file is truncated or corrupted. Please check the file integrity."
- **Cấu trúc PDF không hợp lệ**: "The PDF file has an invalid structure and cannot be processed."

## Hiệu suất và tối ưu hóa

Hiệu suất của node phụ thuộc vào:

1. **Kích thước tệp PDF**: Tệp lớn hơn sẽ mất nhiều thời gian hơn để xử lý.
2. **Độ phức tạp của PDF**: PDF với nhiều phông chữ, hình ảnh và đồ họa phức tạp sẽ mất nhiều thời gian hơn.
3. **Chunk Size**: Điều chỉnh để cân bằng giữa sử dụng bộ nhớ và tốc độ xử lý.

Gợi ý tối ưu hóa:

- Đối với máy tính có RAM thấp, giảm Chunk Size xuống 5-10 trang
- Đối với máy tính mạnh, tăng Chunk Size lên 20-30 trang
- Luôn theo dõi báo cáo hiệu suất để điều chỉnh

## Đóng góp

Đóng góp luôn được chào đón! Vui lòng mở issue hoặc gửi pull request.

## Giấy phép

Dự án này được cấp phép theo Giấy phép MIT.
