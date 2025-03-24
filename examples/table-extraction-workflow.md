# Workflow Ví dụ: Trích xuất Bảng từ PDF

Hướng dẫn này mô tả cách trích xuất và xử lý dữ liệu bảng từ các tệp PDF sử dụng node Extract PDF kết hợp với các node n8n khác.

## Yêu cầu
- Đã cài đặt gói `n8n-nodes-extract-pdf` phiên bản 1.0.17 trở lên
- Có các tệp PDF chứa bảng cần xử lý

## Thiết lập Workflow

### 1. Node Read Binary File

Đầu tiên, cần một node để đọc tệp PDF chứa bảng:

```
[Read Binary File]
  Tên: Read PDF with Tables
  Đường dẫn tệp: /path/to/your/file-with-tables.pdf
  Thuộc tính binary: data
```

### 2. Node Extract PDF 

Tiếp theo, thêm node Extract PDF để trích xuất bảng:

```
[Extract PDF]
  Tên: Extract Tables from PDF
  Loại đầu vào: Binary Data
  Thuộc tính binary: data
  Tùy chọn:
    ✓ Extract Tables
```

### 3. Node Function (Xử lý dữ liệu bảng)

Thêm node Function để xử lý dữ liệu bảng trích xuất được:

```javascript
[Function]
  Tên: Process Table Data
  Mã JavaScript:
  
  return items.map(item => {
    // Lấy dữ liệu bảng đã trích xuất
    const tables = item.json.tables || [];
    
    if (tables.length === 0) {
      return {
        json: {
          success: false,
          message: 'Không tìm thấy bảng nào trong PDF'
        }
      };
    }
    
    // Xử lý từng bảng
    const processedTables = tables.map(table => {
      // Lấy thông tin cơ bản
      const { pageNumber, tableIndex, headers, data } = table;
      
      // Thực hiện tính toán hoặc xử lý dữ liệu nếu cần
      // Ví dụ: Tính tổng giá trị trong một cột số
      let sum = 0;
      const numericColumnIndex = 1; // Giả sử cột thứ 2 chứa số
      
      if (headers[numericColumnIndex] && table.rows.length > 0) {
        table.rows.forEach(row => {
          const value = parseFloat(row[numericColumnIndex]);
          if (!isNaN(value)) {
            sum += value;
          }
        });
      }
      
      return {
        page: pageNumber,
        table: tableIndex,
        headers: headers,
        rowCount: data.length,
        data: data,
        summary: {
          totalRows: data.length,
          sum: sum
        }
      };
    });
    
    return {
      json: {
        success: true,
        tableCount: tables.length,
        tables: processedTables
      }
    };
  });
```

### 4. Node Google Sheets (Tùy chọn)

Nếu bạn muốn xuất dữ liệu bảng vào Google Sheets:

```
[Google Sheets]
  Tên: Save Table to Sheets
  Thao tác: Thêm hàng
  ID Bảng tính: your-google-sheet-id
  Tên trang tính: Table Data
  Tùy chọn:
    ✓ Điều kiện: items.json.success === true
```

## Ví dụ dữ liệu đầu ra

Sau khi thực thi, dữ liệu đầu ra từ node Extract PDF sẽ có dạng:

```json
{
  "text": "...",
  "tables": [
    {
      "pageNumber": 1,
      "tableIndex": 0,
      "headers": ["Sản phẩm", "Giá", "Số lượng", "Thành tiền"],
      "rows": [
        ["Laptop", "15000000", "2", "30000000"],
        ["Chuột", "250000", "5", "1250000"],
        ["Bàn phím", "750000", "2", "1500000"]
      ],
      "data": [
        {
          "Sản phẩm": "Laptop",
          "Giá": "15000000",
          "Số lượng": "2",
          "Thành tiền": "30000000"
        },
        {
          "Sản phẩm": "Chuột",
          "Giá": "250000",
          "Số lượng": "5",
          "Thành tiền": "1250000"
        },
        {
          "Sản phẩm": "Bàn phím",
          "Giá": "750000",
          "Số lượng": "2",
          "Thành tiền": "1500000"
        }
      ]
    }
  ]
}
```

## Mẹo và lưu ý

1. **Cấu trúc bảng phức tạp**: Công cụ trích xuất bảng hoạt động tốt nhất với các bảng có cấu trúc đơn giản, rõ ràng. Các bảng phức tạp có thể cần xử lý thêm.

2. **PDF đã quét**: Trích xuất bảng có thể không hoạt động tốt với các tệp PDF đã quét. Trong trường hợp này, bạn nên kết hợp với OCR.

3. **Kiểm tra kết quả**: Luôn kiểm tra kết quả trích xuất để đảm bảo chính xác, đặc biệt là với các bảng có định dạng phức tạp.

4. **Xử lý lỗi**: Thêm xử lý lỗi trong workflow để xử lý các trường hợp không thể trích xuất bảng.

5. **Tối ưu hóa hiệu suất**: Đối với các tệp PDF lớn, hãy xem xét việc giới hạn phạm vi trang để cải thiện tốc độ trích xuất. 