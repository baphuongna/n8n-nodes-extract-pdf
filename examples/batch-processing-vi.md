# Ví Dụ Quy Trình: Xử Lý Hàng Loạt PDF với Extract PDF Node

Hướng dẫn này mô tả cách tạo quy trình n8n để xử lý hàng loạt các tệp PDF, trích xuất nội dung của chúng và lưu kết quả vào cơ sở dữ liệu.

## Tổng Quan

Quy trình này sẽ:
1. Quét thư mục đầu vào cho các tệp PDF mới
2. Xử lý từng tệp PDF để trích xuất văn bản, metadata và bảng
3. Lưu trữ kết quả trong cơ sở dữ liệu
4. Tạo báo cáo tổng hợp
5. Chuyển tệp đã xử lý sang thư mục "đã hoàn thành"

## Yêu Cầu

- n8n đã cài đặt (tự host hoặc cloud)
- Node Extract PDF đã cài đặt
- Cơ sở dữ liệu (MySQL, PostgreSQL, MongoDB, v.v.)
- Thư mục để quét tệp PDF

## Thiết Lập Quy Trình

### Bước 1: Tạo Node Kích Hoạt (Trigger)

1. Thêm node **Cron** hoặc **Path Trigger**:
   
   **Với Cron**:
   - Thiết lập thời gian (ví dụ: mỗi 15 phút)
   - Mode: `Every X minutes`
   - Minutes: `15`

   **Hoặc với Path Trigger**:
   - Thiết lập để theo dõi một thư mục
   - Path: `/đường/dẫn/đến/thư_mục/pdf_đầu_vào`
   - Event: `change`

### Bước 2: Liệt Kê Tệp PDF

1. Thêm node **Read Binary Files**:
   - Path: `/đường/dẫn/đến/thư_mục/pdf_đầu_vào/*.pdf`
   - Recursive: `false`

2. Thêm node **Split In Batches** (tùy chọn, cho tệp số lượng lớn):
   - Batch Size: `5` (điều chỉnh dựa trên hiệu suất hệ thống)

### Bước 3: Xử Lý PDF

1. Thêm node **Extract PDF**:
   - PDF Source: `Binary Data`
   - Input Data Field: `data`
   - Page Range: (để trống để xử lý tất cả trang)
   - Include Metadata: `true`
   - Max File Size (MB): `20`
   - Chunk Size: `10` 
   - Show Progress: `true`
   - Extract Images: `false` (bật nếu cần)
   - Perform OCR: `true`
   - OCR Language: `vie` (hoặc ngôn ngữ phù hợp)
   - Extract Tables: `true`
   - Detect Document Type: `true`
   - Document Categories: `invoice,receipt,contract,report` (tùy chỉnh theo nhu cầu)

### Bước 4: Chuẩn Bị Dữ Liệu

1. Thêm node **Function**:
   ```javascript
   // Chuẩn bị dữ liệu cho cơ sở dữ liệu
   const items = [];
   
   for (const item of $input.all()) {
     // Lấy tên tệp từ đường dẫn
     const filePath = item.json.binary.data.fileName;
     const fileName = filePath.split('/').pop();
     
     // Trích xuất metadata quan trọng
     const metadata = item.json.metadata || {};
     
     // Tạo trích đoạn văn bản
     const textExcerpt = item.json.text ? 
       item.json.text.substring(0, 500) + '...' : 
       'Không có văn bản';
     
     // Đếm số bảng
     const tableCount = item.json.tables ? 
       item.json.tables.reduce((count, page) => count + (page.tables?.length || 0), 0) : 
       0;
     
     // Loại tài liệu
     const documentType = item.json.documentClassification?.documentType || 'unknown';
     
     // Tạo đối tượng để lưu vào cơ sở dữ liệu
     const record = {
       file_name: fileName,
       process_date: new Date().toISOString(),
       page_count: item.json.stats?.pageCount || 0,
       processing_time_ms: item.json.stats?.processingTimeMs || 0,
       document_type: documentType,
       title: metadata.Title || '',
       author: metadata.Author || '',
       creation_date: metadata.CreationDate || '',
       text_excerpt: textExcerpt,
       table_count: tableCount,
       full_text: item.json.text || '',
       file_path: filePath,
       // Thêm trường tùy chỉnh khác nếu cần
     };
     
     items.push({ json: record });
   }
   
   return items;
   ```

### Bước 5: Lưu vào Cơ Sở Dữ Liệu

1. Thêm node cơ sở dữ liệu (ví dụ: **MySQL**, **PostgreSQL**, **MongoDB**):

   **Với MySQL/PostgreSQL**:
   - Operation: `Insert`
   - Table: `pdf_extractions`
   - Columns: Đảm bảo phù hợp với đối tượng được tạo trong Function node
   
   **Hoặc với MongoDB**:
   - Operation: `Insert`
   - Collection: `pdf_extractions`
   - Fields: Sử dụng trực tiếp đối tượng đầu ra từ Function

### Bước 6: Di Chuyển Tệp Đã Xử Lý

1. Thêm node **Move Binary File**:
   - Source: `{{ $node["Read Binary Files"].json.binary.data.fileName }}`
   - Destination: `/đường/dẫn/đến/thư_mục/pdf_đã_xử_lý/{{ $node["Read Binary Files"].json.binary.data.fileName | split('/') | last }}`

### Bước 7: Tạo Báo Cáo Tổng Hợp (Tùy Chọn)

1. Thêm node **Function** để tổng hợp số liệu:
   ```javascript
   const processedFiles = $input.all().length;
   let totalPages = 0;
   let totalProcessingTime = 0;
   const documentTypes = {};
   
   // Tính toán tổng số
   for (const item of $input.all()) {
     totalPages += item.json.page_count || 0;
     totalProcessingTime += item.json.processing_time_ms || 0;
     
     // Đếm số tài liệu theo loại
     const docType = item.json.document_type || 'unknown';
     documentTypes[docType] = (documentTypes[docType] || 0) + 1;
   }
   
   // Tạo báo cáo
   const report = {
     run_date: new Date().toISOString(),
     processed_files: processedFiles,
     total_pages: totalPages,
     avg_processing_time_ms: processedFiles ? Math.round(totalProcessingTime / processedFiles) : 0,
     document_type_summary: documentTypes
   };
   
   return { json: report };
   ```

2. Thêm node **Write Binary File** để lưu báo cáo:
   - File Name: `/đường/dẫn/đến/thư_mục/báo_cáo/pdf_report_{{ $now.format('YYYY-MM-DD_HH-mm') }}.json`
   - Content: `{{ $json }}`

### Bước 8: Thông Báo (Tùy Chọn)

1. Thêm node **Slack** hoặc **Email**:

   **Với Slack**:
   - Message: `Đã xử lý xong {{ $node["Function"].json.processed_files }} tệp PDF với tổng cộng {{ $node["Function"].json.total_pages }} trang.`
   
   **Hoặc với Email**:
   - To: `email@example.com`
   - Subject: `Báo cáo xử lý PDF theo lô - {{ $now.format('YYYY-MM-DD') }}`
   - Text: Tạo báo cáo từ dữ liệu tổng hợp

## Xử Lý Lỗi

1. Thêm kết nối lỗi từ các node quan trọng
2. Thêm node **Error Trigger** để bắt lỗi 
3. Thêm node **Send Email** để thông báo lỗi:
   - To: `admin@example.com`
   - Subject: `Lỗi trong quy trình xử lý PDF`
   - Text: `Lỗi: {{ $node.Error.json.message }}`

## Chức Năng Nâng Cao

### Phân Tích Thống Kê Văn Bản

Thêm node **Function** sau Extract PDF để phân tích nội dung văn bản:

```javascript
const items = [];

for (const item of $input.all()) {
  const text = item.json.text || '';
  
  // Phân tích cơ bản
  const wordCount = text.split(/\s+/).length;
  const charCount = text.length;
  
  // Tìm từ khóa
  const keywordCounts = {
    'invoice': (text.match(/invoice/gi) || []).length,
    'payment': (text.match(/payment/gi) || []).length,
    'contract': (text.match(/contract/gi) || []).length,
    // Thêm các từ khóa khác...
  };
  
  // Thêm phân tích vào dữ liệu
  items.push({
    json: {
      ...item.json,
      analysis: {
        wordCount,
        charCount,
        keywordCounts
      }
    }
  });
}

return items;
```

### Xử Lý Song Song

Để cải thiện hiệu suất, bạn có thể tách các tệp thành các nhóm xử lý song song:

1. Sử dụng **Split In Batches** với batch size nhỏ (ví dụ: 3)
2. Kết nối với nhiều nhánh Extract PDF
3. Hợp nhất kết quả với node **Merge**

## Lưu Ý Thực Hiện

- **Kích Thước Tệp**: Điều chỉnh `maxFileSize` dựa trên tệp PDF lớn nhất của bạn
- **Bộ Nhớ**: Nếu xử lý tệp PDF lớn, đảm bảo n8n có đủ bộ nhớ
- **Lưu Trữ**: Xem xét lưu trữ tệp trích xuất lớn (như văn bản đầy đủ) ở dịch vụ đám mây hoặc hệ thống lưu trữ riêng biệt
- **Độ Tin Cậy**: Thêm cơ chế thử lại cho các bước quan trọng để xử lý lỗi tạm thời
- **Theo Dõi**: Thiết lập theo dõi cho quy trình, đặc biệt nếu xử lý số lượng lớn tài liệu

---
Created by AI 