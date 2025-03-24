# n8n-nodes-extract-pdf

Node n8n này trích xuất văn bản, hình ảnh, bảng và trường dữ liệu từ tệp PDF với nhiều tùy chọn mạnh mẽ.

## Mô tả

Node `n8n-nodes-extract-pdf` là một node tùy chỉnh cho n8n giúp trích xuất nội dung từ tệp PDF. Node này cung cấp khả năng trích xuất toàn diện, bao gồm trích xuất văn bản, OCR cho PDF dạng ảnh, trích xuất bảng, phân loại tài liệu và trích xuất trường biểu mẫu.

### Tính năng chính

- Trích xuất văn bản từ toàn bộ PDF hoặc trang cụ thể (ví dụ: "1-5, 8, 11-13")
- Trích xuất metadata của tệp PDF
- Kiểm soát kích thước tệp tối đa có thể xử lý
- Xử lý hiệu quả các tệp PDF lớn bằng cách chia thành các phần nhỏ
- Theo dõi tiến trình cho các tệp lớn
- Báo cáo hiệu suất với thời gian xử lý và tốc độ
- Hỗ trợ nhận dữ liệu từ các node khác (Google Drive, HTTP Request)
- Trích xuất hình ảnh từ PDF
- OCR cho PDF dạng ảnh hỗ trợ 9 ngôn ngữ
- Trích xuất bảng từ PDF
- OCR được cải thiện bằng AI với khả năng hậu xử lý
- Nhận dạng và phân loại tài liệu tự động
- Trích xuất trường từ tài liệu có cấu trúc

## Cài đặt

Bạn có thể cài đặt gói từ npm:

```bash
npm install n8n-nodes-extract-pdf@1.0.17
```

### Cài đặt trên Docker

Nếu bạn đang sử dụng n8n với Docker, hãy làm theo các bước sau để cài đặt gói và các phụ thuộc cần thiết:

1. Truy cập vào container Docker:
   ```bash
   docker exec -it <tên-container-n8n-của-bạn> /bin/sh
   ```

2. Cài đặt gói:
   ```bash
   npm install n8n-nodes-extract-pdf@1.0.17
   ```

3. Để sử dụng chức năng OCR, bạn cần cài đặt Tesseract:
   ```bash
   # Cho các image dựa trên Alpine
   apk add --no-cache tesseract-ocr

   # Cho các image dựa trên Debian/Ubuntu
   apt-get update && apt-get install -y tesseract-ocr
   ```

4. Khởi động lại container:
   ```bash
   docker restart <tên-container-n8n-của-bạn>
   ```

## Cách sử dụng

1. Thêm node "Extract PDF" vào quy trình làm việc của bạn
2. Cấu hình nguồn PDF:
   - Đường dẫn tệp cục bộ
   - Dữ liệu nhị phân từ node khác (ví dụ: HTTP Request, Google Drive)
3. Thiết lập các tùy chọn trích xuất:
   - Phạm vi trang (để trống cho tất cả các trang)
   - Bao gồm metadata
   - Kích thước tệp tối đa
   - Bật trích xuất hình ảnh
   - Bật OCR cho PDF dạng ảnh
   - Chọn ngôn ngữ OCR
   - Bật trích xuất bảng
   - Bật nhận dạng và phân loại tài liệu
   - Bật trích xuất trường biểu mẫu

## Tùy chọn cấu hình

| Tùy chọn | Mô tả |
|--------|-------------|
| **Nguồn PDF** | Chọn giữa đường dẫn tệp hoặc dữ liệu nhị phân |
| **Đường dẫn tệp** | Đường dẫn đến tệp PDF (khi sử dụng đường dẫn tệp) |
| **Trường dữ liệu đầu vào** | Trường chứa dữ liệu PDF nhị phân (khi sử dụng dữ liệu nhị phân) |
| **Phạm vi trang** | Xác định các trang cần trích xuất (ví dụ: "1-5, 8, 11-13") |
| **Bao gồm Metadata** | Bao gồm metadata của tài liệu PDF trong đầu ra |
| **Kích thước tệp tối đa (MB)** | Kích thước tệp tối đa có thể xử lý |
| **Tùy chọn xử lý** | Tùy chọn nâng cao để xử lý các tệp lớn |
| **Kích thước phần** | Số trang xử lý cùng một lúc cho các tệp lớn |
| **Hiển thị tiến trình** | Hiển thị thông tin tiến trình trong quá trình xử lý |
| **Trích xuất hình ảnh** | Trích xuất hình ảnh từ PDF |
| **Thực hiện OCR** | Thực hiện OCR trên PDF dạng ảnh |
| **Ngôn ngữ OCR** | Ngôn ngữ cho OCR (hỗ trợ 9 ngôn ngữ) |
| **Mức độ cải thiện OCR** | Mức độ hậu xử lý AI cho kết quả OCR |
| **Trích xuất bảng** | Trích xuất bảng từ PDF |
| **Phát hiện loại tài liệu** | Tự động nhận dạng loại tài liệu (hóa đơn, biên lai, v.v.) |
| **Trích xuất trường biểu mẫu** | Trích xuất trường từ tài liệu có cấu trúc |
| **Danh mục tài liệu** | Danh mục sử dụng cho phân loại tài liệu |
| **Đường dẫn mẫu tùy chỉnh** | Đường dẫn đến mẫu tài liệu tùy chỉnh |

## Kết quả đầu ra

Node đầu ra một đối tượng có các thuộc tính sau:

```javascript
{
  text: "Nội dung văn bản đã trích xuất...",
  pages: [
    { pageNum: 1, text: "Văn bản từ trang 1..." },
    { pageNum: 2, text: "Văn bản từ trang 2..." },
    // ...thêm trang
  ],
  metadata: {
    // Metadata PDF nếu được yêu cầu
    Title: "Tiêu đề tài liệu",
    Author: "Tác giả tài liệu",
    // ...metadata khác
  },
  stats: {
    pageCount: 5,
    processingTimeMs: 1250,
    pagesPerSecond: 4
  },
  images: [
    { pageNum: 1, data: "dữ-liệu-hình-ảnh-mã-hóa-base64", format: "png" },
    // ...thêm hình ảnh
  ],
  tables: [
    {
      pageNum: 1,
      tables: [
        {
          rows: [
            ["Tiêu đề1", "Tiêu đề2", "Tiêu đề3"],
            ["Hàng1Cột1", "Hàng1Cột2", "Hàng1Cột3"],
            // ...thêm hàng
          ]
        }
      ]
    }
    // ...thêm trang có bảng
  ],
  documentClassification: {
    documentType: "invoice",
    confidence: 0.87,
    detectedFields: {
      invoiceNumber: "INV-12345",
      date: "2025-03-22",
      total: "1.234.56đ"
      // ...thêm trường
    }
  },
  extractedFields: {
    // Các trường có cấu trúc được trích xuất từ tài liệu
    // Cho hóa đơn, biên lai, v.v.
  }
}
```

## Xử lý lỗi

Node cung cấp thông báo lỗi chi tiết cho các tình huống thất bại khác nhau:

- Không tìm thấy tệp
- Tệp quá lớn
- PDF được mã hóa/bảo vệ bằng mật khẩu
- Định dạng PDF không hợp lệ
- Lỗi OCR
- Lỗi trích xuất bảng
- Lỗi phân loại tài liệu

## Xử lý tệp PDF lớn

Đối với các tệp PDF lớn, node sử dụng chiến lược chia nhỏ:

1. Chia PDF thành các phần nhỏ hơn (số trang có thể cấu hình)
2. Xử lý từng phần riêng biệt
3. Kết hợp kết quả từ tất cả các phần
4. Báo cáo tiến trình trong quá trình xử lý

Phương pháp này ngăn chặn vấn đề bộ nhớ và cải thiện độ tin cậy.

## Hỗ trợ dữ liệu nhị phân

Bạn có thể kết nối node này trực tiếp với các node như:

- Node HTTP Request
- Node Google Drive
- Node FTP
- Bất kỳ node nào tạo ra đầu ra nhị phân

Node sẽ tự động phát hiện và xử lý dữ liệu PDF nhị phân.

## Trích xuất hình ảnh

Bật tùy chọn "Trích xuất hình ảnh" để trích xuất hình ảnh từ PDF. Node sẽ:

1. Nhận dạng và trích xuất tất cả hình ảnh
2. Cung cấp dữ liệu hình ảnh được mã hóa base64
3. Bao gồm thông tin về số trang và định dạng

## Thực hiện OCR trên PDF dạng ảnh

Đối với PDF thực sự là hình ảnh được quét, hãy bật OCR:

1. Bật tùy chọn "Thực hiện OCR"
2. Chọn ngôn ngữ thích hợp (hỗ trợ tiếng Anh, Pháp, Đức, Tây Ban Nha, Ý, Bồ Đào Nha, Hà Lan, Trung Quốc và Việt Nam)
3. Chọn mức độ cải thiện OCR (nhẹ, trung bình, mạnh)

Node sẽ chuyển đổi các trang PDF thành hình ảnh, thực hiện OCR và trả về văn bản đã trích xuất.

## Phân loại tài liệu và trích xuất trường

Khi được bật, node có thể:

1. Tự động phân loại tài liệu thành các loại (hóa đơn, biên lai, hợp đồng, v.v.)
2. Trích xuất các trường liên quan dựa trên loại tài liệu
3. Cung cấp điểm tin cậy cho việc phân loại
4. Sử dụng mẫu tùy chỉnh cho các loại tài liệu chuyên biệt

## Lỗi OCR phổ biến và giải pháp

### "Không thể thực hiện OCR trên PDF"

Nguyên nhân có thể:
- Chất lượng hình ảnh quá thấp
- Ngôn ngữ không được hỗ trợ
- Hạn chế bộ nhớ

Giải pháp:
- Cải thiện chất lượng/độ phân giải hình ảnh
- Xác minh lựa chọn ngôn ngữ
- Xử lý ít trang hơn cùng một lúc

### "OCR quá chậm"

Giải pháp:
- Giảm độ phân giải hình ảnh
- Xử lý ít trang hơn cùng một lúc
- Sử dụng phạm vi trang chính xác hơn
- Cân nhắc sử dụng dịch vụ OCR đám mây cho tài liệu lớn

## Cài đặt gói ngôn ngữ Tesseract

### Windows

1. Tải gói ngôn ngữ từ [GitHub](https://github.com/tesseract-ocr/tessdata/)
2. Đặt chúng vào thư mục `tessdata` (thường là: `C:\Program Files\Tesseract-OCR\tessdata\`)

### Linux (Ubuntu/Debian)

```bash
# Cài đặt Tesseract
apt-get update && apt-get install -y tesseract-ocr

# Cài đặt gói ngôn ngữ cụ thể
apt-get install -y tesseract-ocr-vie  # Tiếng Việt
apt-get install -y tesseract-ocr-fra  # Tiếng Pháp
apt-get install -y tesseract-ocr-deu  # Tiếng Đức
apt-get install -y tesseract-ocr-chi-sim  # Tiếng Trung giản thể
```

### macOS

```bash
# Cài đặt Tesseract với Homebrew
brew install tesseract

# Cài đặt gói ngôn ngữ
brew install tesseract-lang
```

## Xử lý các trường hợp đặc biệt

### PDF được bảo vệ bằng mật khẩu

Node sẽ phát hiện PDF được mã hóa và cung cấp thông báo lỗi. PDF được bảo vệ bằng mật khẩu hiện không được hỗ trợ.

### Cấu trúc PDF phức tạp

Một số PDF với bố cục phức tạp có thể dẫn đến việc trích xuất không hoàn hảo. Trong những trường hợp này:
- Thử bật OCR ngay cả đối với PDF dạng văn bản
- Trích xuất hình ảnh và sử dụng OCR trên hình ảnh
- Sử dụng trích xuất bảng cho dữ liệu bảng

## Câu hỏi thường gặp

### PDF là gì?

PDF (Portable Document Format) là một định dạng tệp giữ nguyên định dạng của tài liệu độc lập với phần mềm, phần cứng hoặc hệ điều hành được sử dụng để tạo hoặc xem chúng.

### PDF dạng ảnh là gì?

PDF dạng ảnh chứa hình ảnh được quét của các trang thay vì văn bản thực. Văn bản trong các PDF này không thể được chọn hoặc tìm kiếm mà không có OCR.

### OCR là gì?

OCR (Nhận dạng ký tự quang học) là công nghệ nhận dạng văn bản trong tệp hình ảnh hoặc tài liệu quét và chuyển đổi nó thành văn bản mà máy có thể đọc được.

### Tại sao việc trích xuất văn bản của tôi thất bại?

Vấn đề phổ biến bao gồm:
- PDF là dạng ảnh (bật OCR)
- PDF bị hỏng
- PDF được mã hóa
- PDF sử dụng phông chữ không tiêu chuẩn

### Làm thế nào để cải thiện tốc độ OCR?

- Xử lý ít trang hơn cùng một lúc
- Giảm độ phân giải hình ảnh
- Sử dụng lựa chọn ngôn ngữ cụ thể hơn
- Cân nhắc OCR dựa trên đám mây cho tài liệu lớn

### Làm thế nào để xử lý PDF đa ngôn ngữ?

Để có kết quả tốt nhất, xác định ngôn ngữ chính và chọn nó cho OCR. Đối với tài liệu có ngôn ngữ hỗn hợp, bạn có thể cần xử lý các trang khác nhau với cài đặt ngôn ngữ khác nhau.

### Bạn có hỗ trợ trích xuất bảng không?

Trích xuất bảng được hỗ trợ trong phiên bản 1.0.17 trở lên. Bật tùy chọn "Trích xuất bảng" để sử dụng tính năng này.

### Tại sao tôi nhận được lỗi "Lỗi tải gói"?

Điều này thường xảy ra khi:
- Node đã được cài đặt nhưng n8n chưa được khởi động lại
- Gói đã được cài đặt toàn cục thay vì cục bộ
- Có vấn đề về tương thích phiên bản

## Tối ưu hóa hiệu suất

Để có hiệu suất tối ưu:

1. Cụ thể với phạm vi trang
2. Sử dụng kích thước phần thích hợp
3. Bật báo cáo tiến trình cho tệp lớn
4. Chỉ sử dụng OCR khi cần thiết
5. Chọn đúng ngôn ngữ cho OCR
6. Chỉ sử dụng cải tiến AI khi cần thiết

---
Created by AI 