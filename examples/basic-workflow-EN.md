# Basic PDF Extraction Workflow

This example demonstrates a simple workflow to extract text and metadata from PDF files.

## Workflow Setup

![Basic PDF Extraction Workflow](../images/basic-workflow.png)

This workflow consists of the following nodes:

1. **Start Node**: Triggered manually to start the process
2. **HTTP Request**: Downloads a PDF file from a URL
3. **Extract PDF**: Extracts text and metadata from the PDF
4. **Function**: Processes and formats the extracted data
5. **Set**: Prepares the final output
6. **Respond to Webhook**: Returns the results

## Node Configuration

### HTTP Request Node

- **Method**: GET
- **URL**: `https://example.com/sample.pdf`
- **Response Format**: File
- **Binary Property**: `data`

### Extract PDF Node

- **PDF Source**: Binary Data
- **Input Data Field**: `data`
- **Page Range**: `1-3` (leave empty for all pages)
- **Include Metadata**: Enabled
- **Max File Size (MB)**: 10
- **Extract Images**: Disabled
- **Perform OCR**: Disabled

### Function Node

```javascript
// Process and format the extracted PDF data
return [{
  json: {
    title: $input.first().json.metadata?.Title || 'Untitled Document',
    author: $input.first().json.metadata?.Author || 'Unknown Author',
    totalPages: $input.first().json.stats.pageCount,
    extractedPages: $input.first().json.pages.length,
    processingTime: $input.first().json.stats.processingTimeMs,
    wordCount: $input.first().json.text.split(/\s+/).length,
    firstPagePreview: $input.first().json.pages[0].text.substring(0, 200) + '...',
    fullText: $input.first().json.text
  }
}];
```

### Set Node

- **Keep Only Set**: Enabled
- **Values to Set**:
  - `data`: JSON of function output

### Respond to Webhook Node

- **Response Code**: 200
- **Response Mode**: JSON
- **Response Data**: `data`

## Example Output

The workflow will produce output similar to this:

```json
{
  "title": "Sample Document",
  "author": "John Doe",
  "totalPages": 5,
  "extractedPages": 3,
  "processingTime": 830,
  "wordCount": 1250,
  "firstPagePreview": "This is a sample document that demonstrates the PDF extraction capabilities. The content includes text that can be extracted using the n8n-nodes-extract-pdf node...",
  "fullText": "This is a sample document that demonstrates the PDF extraction capabilities..."
}
```

## Variations

### Adding OCR Support

To enable OCR for image-based PDFs, modify the Extract PDF node configuration:

- **Perform OCR**: Enabled
- **OCR Language**: English (or your preferred language)
- **OCR Enhancement Level**: Medium

### Extracting Tables

To extract tables from the PDF, modify the Extract PDF node configuration:

- **Extract Tables**: Enabled

Then update the Function node to process the table data:

```javascript
// Process and format the extracted PDF data including tables
const tables = $input.first().json.tables || [];
const tableCount = tables.reduce((count, page) => count + (page.tables?.length || 0), 0);

return [{
  json: {
    title: $input.first().json.metadata?.Title || 'Untitled Document',
    author: $input.first().json.metadata?.Author || 'Unknown Author',
    totalPages: $input.first().json.stats.pageCount,
    tableCount: tableCount,
    tables: tables,
    // ... other fields
  }
}];
```

## Best Practices

1. Always specify a maximum file size to prevent processing very large files.
2. Use page ranges when you only need specific pages.
3. Only enable OCR when working with image-based PDFs to improve performance.
4. Consider chunking for large files to improve memory usage.
5. Use appropriate error handling for cases where PDFs might be password-protected or corrupted.

---
Created by AI 