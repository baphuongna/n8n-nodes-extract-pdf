# Ví dụ Workflows cho n8n-nodes-extract-pdf

Dưới đây là một số ví dụ workflows để giúp bạn bắt đầu với node Extract PDF.

## 1. Trích xuất văn bản và lưu vào file

Workflow này sẽ:
1. Đọc file PDF
2. Trích xuất văn bản
3. Lưu kết quả vào file text

```json
{
  "nodes": [
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "=/data/input.pdf",
        "extractionFeatures": ["extractText"]
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "fileName": "=/data/output.txt",
        "text": "={{$node[\"Extract PDF\"].json[\"text\"]}}"
      },
      "name": "Write File",
      "type": "n8n-nodes-base.writeFile",
      "typeVersion": 1,
      "position": [450, 300]
    }
  ],
  "connections": {
    "Extract PDF": {
      "main": [
        [
          {
            "node": "Write File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 2. OCR PDF quét và gửi email

Workflow này sẽ:
1. Theo dõi thư mục để phát hiện PDF mới
2. Thực hiện OCR với tự động phát hiện ngôn ngữ
3. Gửi kết quả qua email

```json
{
  "nodes": [
    {
      "parameters": {
        "path": "=/data/scanned",
        "fileExtensions": ["pdf"]
      },
      "name": "Watch Folder",
      "type": "n8n-nodes-base.watchFolder",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "={{$node[\"Watch Folder\"].json[\"path\"]}}",
        "extractionFeatures": ["performOcr"],
        "autoDetectLanguage": true,
        "enhanceOcrResults": true
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "fromEmail": "noreply@example.com",
        "toEmail": "user@example.com",
        "subject": "OCR Results: {{$node[\"Watch Folder\"].json[\"name\"]}}",
        "text": "={{$node[\"Extract PDF\"].json[\"ocrText\"]}}"
      },
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Watch Folder": {
      "main": [
        [
          {
            "node": "Extract PDF",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract PDF": {
      "main": [
        [
          {
            "node": "Send Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 3. Trích xuất bảng và chuyển đổi sang Excel

Workflow này sẽ:
1. Đọc file PDF
2. Trích xuất bảng
3. Chuyển đổi sang Excel
4. Lưu file Excel

```json
{
  "nodes": [
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "=/data/tables.pdf",
        "extractionFeatures": ["extractTables"],
        "tableOutputFormat": "json",
        "useFirstRowAsHeaders": true
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "options": {
          "headerRow": true,
          "sheets": [
            {
              "name": "Tables",
              "data": "={{$node[\"Extract PDF\"].json[\"tables\"]}}"
            }
          ]
        }
      },
      "name": "Spreadsheet File",
      "type": "n8n-nodes-base.spreadsheetFile",
      "typeVersion": 2,
      "position": [450, 300]
    },
    {
      "parameters": {
        "fileName": "=/data/output.xlsx",
        "options": {
          "encoding": "utf8",
          "format": "xlsx"
        }
      },
      "name": "Write File",
      "type": "n8n-nodes-base.writeFile",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "Extract PDF": {
      "main": [
        [
          {
            "node": "Spreadsheet File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Spreadsheet File": {
      "main": [
        [
          {
            "node": "Write File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 4. Xử lý hàng loạt PDF và phân tích ngôn ngữ

Workflow này sẽ:
1. Quét thư mục để tìm PDF
2. Trích xuất văn bản và thực hiện OCR
3. Phân tích thống kê ngôn ngữ
4. Lưu báo cáo JSON

```json
{
  "nodes": [
    {
      "parameters": {
        "path": "=/data/pdfs",
        "fileExtensions": ["pdf"],
        "options": {
          "recursive": true
        }
      },
      "name": "Watch Folder",
      "type": "n8n-nodes-base.watchFolder",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "={{$node[\"Watch Folder\"].json[\"path\"]}}",
        "extractionFeatures": ["extractText", "performOcr"],
        "autoDetectLanguage": true
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "keepOnlySet": true,
        "values": {
          "fileName": "={{$node[\"Watch Folder\"].json[\"name\"]}}",
          "text": "={{$node[\"Extract PDF\"].json[\"text\"]}}",
          "ocrText": "={{$node[\"Extract PDF\"].json[\"ocrText\"]}}",
          "languages": "={{$node[\"Extract PDF\"].json[\"languageStatistics\"]}}"
        }
      },
      "name": "Set",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "fileName": "=/data/language_analysis.json",
        "options": {
          "append": true
        }
      },
      "name": "Write File",
      "type": "n8n-nodes-base.writeFile",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Watch Folder": {
      "main": [
        [
          {
            "node": "Extract PDF",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract PDF": {
      "main": [
        [
          {
            "node": "Set",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set": {
      "main": [
        [
          {
            "node": "Write File",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 5. Xử lý lỗi và retry tự động

Workflow này sẽ:
1. Xử lý PDF với retry tự động
2. Ghi log lỗi
3. Gửi thông báo khi thất bại

```json
{
  "nodes": [
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "=/data/input.pdf",
        "extractionFeatures": ["extractText", "performOcr"],
        "errorHandling": {
          "continueOnFail": true,
          "maxRetries": 3,
          "retryDelay": 1000
        }
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "conditions": {
          "boolean": [
            {
              "value1": "={{$node[\"Extract PDF\"].error !== null}}",
              "value2": true
            }
          ]
        }
      },
      "name": "IF Error",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "fileName": "=/data/error.log",
        "options": {
          "append": true
        },
        "text": "={{$node[\"Extract PDF\"].error}}"
      },
      "name": "Log Error",
      "type": "n8n-nodes-base.writeFile",
      "typeVersion": 1,
      "position": [650, 200]
    },
    {
      "parameters": {
        "fromEmail": "noreply@example.com",
        "toEmail": "admin@example.com",
        "subject": "PDF Processing Error",
        "text": "Error processing PDF: {{$node[\"Extract PDF\"].error}}"
      },
      "name": "Send Error Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [650, 400]
    }
  ],
  "connections": {
    "Extract PDF": {
      "main": [
        [
          {
            "node": "IF Error",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF Error": {
      "main": [
        [
          {
            "node": "Log Error",
            "type": "main",
            "index": 0
          },
          {
            "node": "Send Error Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 6. Tối ưu hiệu suất cho PDF lớn

Workflow này sẽ:
1. Xử lý PDF lớn theo chunks
2. Theo dõi hiệu suất
3. Tự động điều chỉnh cấu hình

```json
{
  "nodes": [
    {
      "parameters": {
        "inputType": "filePath",
        "pdfFile": "=/data/large.pdf",
        "extractionFeatures": ["extractText", "performOcr"],
        "performanceConfig": {
          "chunkSize": 10,
          "maxConcurrent": 4,
          "memoryLimit": "2GB",
          "cacheResults": true
        },
        "ocrConfig": {
          "useGpu": true,
          "imagePreprocess": true,
          "cacheOcr": true,
          "batchSize": 5
        }
      },
      "name": "Extract PDF",
      "type": "n8n-nodes-extract-pdf",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "keepOnlySet": true,
        "values": {
          "performance": "={{$node[\"Extract PDF\"].json[\"performance\"]}}",
          "totalPages": "={{$node[\"Extract PDF\"].json[\"metadata\"].pages}}",
          "processingTime": "={{$node[\"Extract PDF\"].json[\"performance\"].totalTime}}ms",
          "pagesPerSecond": "={{$node[\"Extract PDF\"].json[\"performance\"].pagesPerSecond}}"
        }
      },
      "name": "Performance Stats",
      "type": "n8n-nodes-base.set",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$node[\"Extract PDF\"].json[\"performance\"].pagesPerSecond}}",
              "operation": "smaller",
              "value2": 1
            }
          ]
        }
      },
      "name": "IF Slow",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [650, 300]
    },
    {
      "parameters": {
        "fromEmail": "noreply@example.com",
        "toEmail": "admin@example.com",
        "subject": "PDF Processing Performance Alert",
        "text": "=Performance is below threshold:\n{{$json[\"performance\"] | stringify}}"
      },
      "name": "Send Performance Alert",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Extract PDF": {
      "main": [
        [
          {
            "node": "Performance Stats",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Performance Stats": {
      "main": [
        [
          {
            "node": "IF Slow",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "IF Slow": {
      "main": [
        [
          {
            "node": "Send Performance Alert",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Ghi chú về hiệu suất

1. **Cấu hình chunk size**:
   - Tệp nhỏ (< 50 trang): 10 trang/chunk
   - Tệp trung bình (50-200 trang): 20 trang/chunk
   - Tệp lớn (> 200 trang): 50 trang/chunk

2. **Cấu hình OCR**:
   - Bật GPU nếu có
   - Điều chỉnh batch size dựa trên RAM
   - Bật cache cho tác vụ lặp lại

3. **Tối ưu bộ nhớ**:
   - Giới hạn số chunk xử lý đồng thời
   - Theo dõi sử dụng heap
   - Tự động giải phóng bộ nhớ

4. **Xử lý lỗi**:
   - Retry tự động với delay tăng dần
   - Log chi tiết lỗi và stack trace
   - Thông báo khi hiệu suất thấp

## Ghi chú

1. Đảm bảo thay thế các đường dẫn (`=/data/...`) bằng đường dẫn thực tế trên hệ thống của bạn.

2. Với workflows sử dụng OCR, đảm bảo Tesseract OCR đã được cài đặt đúng cách.

3. Đối với workflows gửi email, cấu hình SMTP credentials trong n8n.

4. Các workflows có thể được tùy chỉnh thêm bằng cách:
   - Thêm xử lý lỗi
   - Thêm điều kiện IF/SWITCH
   - Tích hợp với các dịch vụ khác
   - Thêm triggers khác (HTTP, Cron, etc.) 