# n8n-nodes-extract-pdf
*Created by AI*

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

<div align="center">
  <img src="https://n8n.io/n8n-logo.png" alt="Extract PDF Node Logo" width="125" height="125">
</div>

---

## Tiếng Việt

### Tổng Quan

Node này mở rộng chức năng của [n8n](https://n8n.io/) cho phép trích xuất văn bản, hình ảnh, bảng và dữ liệu mẫu từ các tệp PDF.

Node Extract PDF cho phép bạn trích xuất dữ liệu từ tệp PDF một cách dễ dàng và linh hoạt. Nó cũng hỗ trợ OCR cho các PDF dạng ảnh hoặc văn bản quét, nhận diện loại tài liệu và trích xuất bảng.

### Chức Năng Chính:

- ✅ Trích xuất văn bản từ PDF
- ✅ Trích xuất metadata của tệp PDF
- ✅ Định dạng và làm sạch văn bản trích xuất
- ✅ OCR (Nhận dạng ký tự quang học) cho PDF dạng ảnh
- ✅ Trích xuất hình ảnh từ PDF
- ✅ Trích xuất và định dạng bảng
- ✅ Nhận diện loại tài liệu và trích xuất trường thông tin
- ✅ Xử lý PDF lớn với phân trang
- ✅ Hỗ trợ nhiều ngôn ngữ cho OCR

### Cài Đặt

#### Phương Pháp 1: Trong giao diện n8n

1. Truy cập setting của n8n
2. Chọn tab "Community nodes"
3. Tìm "n8n-nodes-extract-pdf" và click vào "Install"

#### Phương Pháp 2: Sử dụng CLI

```bash
npm install n8n-nodes-extract-pdf@1.0.18
```

#### Phương Pháp 3: Trong Docker

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

#### Cài Đặt OCR (Tùy Chọn - Cần Thiết Cho PDF Dạng Ảnh)

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

---

## English

### Description

This n8n node extracts text, images, tables, and form fields from PDF files with powerful customization options.

The `n8n-nodes-extract-pdf` node is a custom node for n8n that helps extract content from PDF files. This node offers comprehensive extraction capabilities, including text extraction, OCR for image-based PDFs, table extraction, document classification, and form field extraction.

### Key Features

- Extract text from entire PDFs or specific pages (e.g., "1-5, 8, 11-13")
- Extract metadata from PDF files
- Control maximum file size for processing
- Handle large PDF files efficiently by chunking
- Track progress for large files
- Performance reporting with processing time and speed
- Support receiving data from other nodes (Google Drive, HTTP Request)
- Extract images from PDFs
- OCR for image-based PDFs with support for 9 languages
- Extract tables from PDFs
- AI-enhanced OCR with post-processing capabilities
- Automatic document recognition and classification
- Form field extraction from structured documents

### Installation

You can install the package from npm:

```bash
npm install n8n-nodes-extract-pdf@1.0.18
```

#### Docker Installation

If you're using n8n with Docker, follow these steps to install the package and required dependencies:

1. Enter the Docker container:
   ```bash
   docker exec -it <your-n8n-container-name> /bin/sh
   ```

2. Install the package:
   ```bash
   npm install n8n-nodes-extract-pdf@1.0.18
   ```

3. For OCR functionality, you'll need to install Tesseract:
   ```bash
   # For Alpine-based images
   apk add --no-cache tesseract-ocr

   # For Debian/Ubuntu-based images
   apt-get update && apt-get install -y tesseract-ocr
   ```

4. Restart the container:
   ```bash
   docker restart <your-n8n-container-name>
   ```

### Usage

1. Add the "Extract PDF" node to your workflow
2. Configure the PDF source:
   - Local file path
   - Binary data from another node (e.g., HTTP Request, Google Drive)
3. Set your desired extraction options:
   - Page range (leave empty for all pages)
   - Include metadata
   - Maximum file size
   - Enable image extraction
   - Enable OCR for image-based PDFs
   - Select OCR language
   - Enable table extraction
   - Enable document recognition and classification
   - Enable form field extraction

### Configuration Options

| Option | Description |
|--------|-------------|
| **PDF Source** | Choose between file path or binary data |
| **File Path** | Path to the PDF file (if using file path) |
| **Input Data Field** | Field containing the binary PDF data (if using binary data) |
| **Page Range** | Specify pages to extract (e.g., "1-5, 8, 11-13") |
| **Include Metadata** | Include PDF document metadata in output |
| **Max File Size (MB)** | Maximum file size to process |
| **Chunk Size** | Number of pages to process at once for large files |
| **Show Progress** | Display progress information during processing |
| **Extract Images** | Extract images from the PDF |
| **Perform OCR** | Perform OCR on image-based PDFs |
| **OCR Language** | Language for OCR (supports 9 languages) |
| **OCR Enhancement Level** | Level of AI post-processing for OCR results |
| **Extract Tables** | Extract tables from the PDF |
| **Detect Document Type** | Automatically identify document type (invoice, receipt, etc.) |
| **Extract Form Fields** | Extract fields from structured documents |
| **Document Categories** | Categories to use for document classification |
| **Custom Templates Path** | Path to custom document templates |