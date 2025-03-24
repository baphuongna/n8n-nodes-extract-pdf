# Ví Dụ Quy Trình: OCR Nâng Cao với Xử Lý Hình Ảnh

Hướng dẫn này mô tả cách tạo quy trình n8n để cải thiện chất lượng OCR thông qua việc tiền xử lý hình ảnh PDF trước khi thực hiện nhận dạng ký tự.

## Tổng Quan

Quy trình này sẽ:
1. Nhận tệp PDF từ một nguồn (email, upload, API)
2. Chuyển đổi các trang PDF thành hình ảnh
3. Thực hiện tiền xử lý hình ảnh (nâng cao độ tương phản, làm sắc nét, loại bỏ tiếng ồn)
4. Thực hiện OCR trên hình ảnh đã được xử lý
5. Tổng hợp kết quả OCR thành một tệp văn bản duy nhất

## Yêu Cầu

- n8n đã cài đặt (tự host hoặc cloud)
- Node Extract PDF đã cài đặt
- API xử lý hình ảnh (Cloudinary, Imgix, hoặc API tùy chỉnh)
- Tesseract OCR đã cài đặt (với gói ngôn ngữ phù hợp)

## Thiết Lập Quy Trình

### Bước 1: Tạo Điểm Nhập Dữ Liệu

1. Thêm node **HTTP Request** (webhook) hoặc **Email** để nhận tệp PDF:

   **Với HTTP Webhook**:
   - Method: `POST`
   - Path: `/pdf-ocr`
   - Option: `Binary Data`
   - Authentication: Thêm nếu cần

   **Hoặc với Email (IMAP/POP3)**:
   - Thêm xác thực email
   - Tìm kiếm: Emails với đính kèm PDF

### Bước 2: Trích Xuất Hình Ảnh từ PDF

1. Thêm node **Extract PDF**:
   - PDF Source: `Binary Data`
   - Input Data Field: `data` hoặc `attachments` (cho email)
   - Extract Images: `true`
   - Perform OCR: `false` (chúng ta sẽ tự xử lý OCR sau khi cải thiện hình ảnh)

2. Thêm node **Function** để tách riêng dữ liệu hình ảnh:
   ```javascript
   // Lấy tất cả hình ảnh từ PDF
   let allImages = [];
   
   // Lặp qua từng mục đầu vào (nếu có nhiều PDF)
   for (const item of $input.all()) {
     const images = item.json.images || [];
     
     // Chuyển đổi mỗi hình ảnh thành một mục riêng biệt
     for (const image of images) {
       allImages.push({
         json: {
           pageNum: image.pageNum,
           index: image.index,
           format: image.format || 'png',
           originalPdf: item.json.binary?.data?.fileName || 'unknown.pdf'
         },
         binary: {
           data: {
             data: image.data,
             mimeType: `image/${image.format || 'png'}`,
             fileName: `page-${image.pageNum}-${image.index}.${image.format || 'png'}`
           }
         }
       });
     }
   }
   
   // Nếu không có hình ảnh nào được trích xuất, hãy tạo lỗi
   if (allImages.length === 0) {
     throw new Error('Không tìm thấy hình ảnh nào để xử lý OCR');
   }
   
   return allImages;
   ```

### Bước 3: Tiền Xử Lý Hình Ảnh

1. Thêm node **HTTP Request** để gửi hình ảnh đến API xử lý hình ảnh:

   **Với Cloudinary**:
   - Method: `POST`
   - URL: `https://api.cloudinary.com/v1_1/your-cloud-name/image/upload`
   - Authentication: Thêm xác thực Cloudinary
   - Body Parameters:
     ```
     file: {{ $binary.data.data }}
     upload_preset: ocr_preprocessing
     transformation: e_contrast:80,e_sharpen:100,e_auto_brightness,e_auto_color
     ```

   **Hoặc với API Tùy Chỉnh**:
   - Method: `POST`
   - URL: `https://your-image-processing-api.com/enhance`
   - Headers: Thêm khóa API nếu cần
   - Body: Binary data từ node trước

2. Thêm node **Function** để chuẩn bị dữ liệu cho OCR:
   ```javascript
   // Chuẩn bị dữ liệu hình ảnh đã xử lý cho OCR
   const items = [];
   
   for (const item of $input.all()) {
     let imageData;
     
     // Xử lý đầu ra từ Cloudinary
     if (item.json.secure_url) {
       // Tải hình ảnh đã xử lý từ URL
       const response = await $http.get({
         url: item.json.secure_url,
         encoding: 'binary',
         returnFullResponse: true
       });
       
       imageData = Buffer.from(response.data).toString('base64');
     } 
     // Hoặc sử dụng trực tiếp dữ liệu nhị phân từ API
     else if (item.binary?.data?.data) {
       imageData = item.binary.data.data;
     }
     // Xử lý trường hợp không có dữ liệu hình ảnh
     else {
       throw new Error('Không có dữ liệu hình ảnh khả dụng từ bước tiền xử lý');
     }
     
     // Tạo một đối tượng mới với dữ liệu hình ảnh đã xử lý
     items.push({
       json: {
         pageNum: item.json.pageNum || 'unknown',
         index: item.json.index || 0,
         originalPdf: item.json.originalPdf || 'unknown.pdf',
         enhancementApplied: true
       },
       binary: {
         data: {
           data: imageData,
           mimeType: 'image/png',
           fileName: `enhanced-page-${item.json.pageNum || 'unknown'}.png`
         }
       }
     });
   }
   
   return items;
   ```

### Bước 4: Thực Hiện OCR

1. Thêm node **Execute Command**:
   ```bash
   tesseract "{{ $binary.data.fileName }}" stdout -l vie --psm 6 --oem 3
   ```
   - Working Directory: Thư mục tạm được truy cập bởi n8n

2. Thêm **Function** node để chuẩn bị kết quả:
   ```javascript
   // Tổng hợp kết quả OCR từ tất cả các trang
   const results = [];
   const pageTexts = {};
   
   // Sắp xếp theo số trang
   for (const item of $input.all()) {
     const pageNum = item.json.pageNum || 'unknown';
     
     // Lưu văn bản OCR cho từng trang
     pageTexts[pageNum] = item.json.stdout || '';
     
     // Thêm kết quả từng trang
     results.push({
       pageNum,
       text: item.json.stdout || '',
       originalPdf: item.json.originalPdf || 'unknown.pdf',
       enhancementApplied: item.json.enhancementApplied || false
     });
   }
   
   // Tạo văn bản tổng hợp từ tất cả các trang
   const pageNumbers = Object.keys(pageTexts)
     .filter(num => num !== 'unknown')
     .map(num => parseInt(num))
     .sort((a, b) => a - b);
   
   // Kết hợp văn bản từ tất cả các trang theo thứ tự
   let combinedText = '';
   for (const num of pageNumbers) {
     combinedText += `--- Trang ${num} ---\n\n`;
     combinedText += pageTexts[num] + '\n\n';
   }
   
   // Thêm bất kỳ trang 'unknown' nào ở cuối
   if (pageTexts['unknown']) {
     combinedText += `--- Trang không xác định ---\n\n`;
     combinedText += pageTexts['unknown'] + '\n\n';
   }
   
   return [
     {
       json: {
         results,  // Chi tiết kết quả từng trang
         combinedText,  // Văn bản từ tất cả các trang
         totalPages: pageNumbers.length + (pageTexts['unknown'] ? 1 : 0),
         originalPdf: results[0]?.originalPdf || 'unknown.pdf'
       },
       binary: {
         text: {
           data: Buffer.from(combinedText).toString('base64'),
           mimeType: 'text/plain',
           fileName: `${results[0]?.originalPdf.replace('.pdf', '') || 'document'}_ocr.txt`
         }
       }
     }
   ];
   ```

### Bước 5: Lưu Trữ và Gửi Kết Quả

1. Thêm node **Write Binary File**:
   - File Name: `/đường/dẫn/đến/thư_mục/kết_quả_ocr/{{ $json.originalPdf.replace('.pdf', '') }}_ocr.txt`
   - Property: `binary.text`

2. Thêm node **Send Email** để gửi kết quả:
   - To: Địa chỉ email người dùng
   - Subject: `Kết quả OCR nâng cao cho tệp: {{ $json.originalPdf }}`
   - Text: 
     ```
     Kết quả OCR từ tệp PDF: {{ $json.originalPdf }}
     
     Số trang được xử lý: {{ $json.totalPages }}
     
     Trích đoạn:
     {{ $json.combinedText.substring(0, 300) }}...
     
     Tệp kết quả đầy đủ được đính kèm.
     ```
   - Attachments: `binary.text`

## Cải Tiến Nâng Cao

### Xử Lý Đặc Biệt Cho Từng Loại Tài Liệu

Thêm node **Switch** sau node Extract PDF để xử lý khác nhau dựa trên loại tài liệu:

1. Cấu hình node Switch:
   - Mode: `Expression`
   - Giá trị: `{{ $json.documentClassification?.documentType || 'unknown' }}`

2. Trường hợp "invoice":
   - Áp dụng tham số tăng cường hình ảnh cho hóa đơn:
     ```
     transformation: e_contrast:90,e_sharpen:150,dpr_2.0
     ```

3. Trường hợp "text-dense":
   - Áp dụng tham số cho tài liệu nhiều văn bản:
     ```
     transformation: e_contrast:70,e_sharpen:80,e_auto_brightness:80
     ```

### Phân Đoạn Hình Ảnh Trước OCR

Thêm node **Function** trước bước OCR để phân đoạn và cải thiện độ chính xác:

```javascript
// Mã giả - Cần thay thế bằng API phân đoạn hình ảnh thực tế
const enhancedItems = [];

for (const item of $input.all()) {
  // Tải dữ liệu hình ảnh
  const imageData = item.binary.data.data;
  
  // Gửi đến API phân đoạn hình ảnh (ví dụ: Azure Computer Vision)
  const segments = await analyzeImageSegments(imageData);
  
  // Xử lý OCR riêng cho từng phân đoạn
  for (const segment of segments) {
    enhancedItems.push({
      json: {
        ...item.json,
        segmentType: segment.type, // text, table, image, etc.
        segmentBounds: segment.bounds,
      },
      binary: {
        data: {
          data: segment.imageData,
          mimeType: 'image/png',
          fileName: `segment-${item.json.pageNum}-${segment.index}.png`
        }
      }
    });
  }
}

return enhancedItems;
```

## Xử Lý Lỗi và Tối Ưu Hóa

### Xử Lý Lỗi

1. Thêm node **Error Trigger** để bắt lỗi
2. Cấu hình thông báo lỗi và xử lý:
   ```javascript
   // Phân tích lỗi và tạo báo cáo
   const errorType = $input.first().json.message.includes('tesseract') ? 
     'OCR Error' : 
     'Processing Error';
   
   return {
     json: {
       errorType,
       errorMessage: $input.first().json.message,
       errorTime: new Date().toISOString(),
       recommendations: errorType === 'OCR Error' ? 
         'Kiểm tra cài đặt Tesseract và gói ngôn ngữ' : 
         'Kiểm tra kết nối API và định dạng hình ảnh'
     }
   };
   ```

### Tối Ưu Hóa Hiệu Suất

1. Sử dụng **Split In Batches** để xử lý song song
2. Giới hạn bộ nhớ cho xử lý hình ảnh lớn:
   ```javascript
   // Thêm vào node Function trước khi xử lý hình ảnh
   const maxWidth = 2000;  // Giới hạn chiều rộng tối đa
   
   // Kiểm tra và thay đổi kích thước nếu hình ảnh quá lớn
   // Cần sử dụng thư viện xử lý hình ảnh như sharp hoặc API bên ngoài
   ```

## Lưu Ý Triển Khai

- **Thời Gian Xử Lý**: Xử lý hình ảnh nâng cao có thể tốn nhiều thời gian. Cân nhắc tăng thời gian chờ cho các node.
- **Đa Ngôn Ngữ**: Với tài liệu đa ngôn ngữ, bạn có thể cần sử dụng:
  ```bash
  tesseract "{{ $binary.data.fileName }}" stdout -l vie+eng+fra --psm 6 --oem 3
  ```
- **Chất Lượng Hình Ảnh**: Điều chỉnh thông số dựa trên chất lượng quét của tài liệu gốc
- **Bộ Nhớ**: Giám sát sử dụng bộ nhớ, đặc biệt với các tài liệu PDF có nhiều trang

---
Created by AI 