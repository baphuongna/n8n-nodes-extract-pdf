# Extract PDF Node Cheatsheet

A quick reference guide for the `n8n-nodes-extract-pdf` node.

## Installation Commands

### Basic Installation
```bash
npm install n8n-nodes-extract-pdf@1.0.17
```

### Installation with OCR Support
```bash
# 1. Install the node
npm install n8n-nodes-extract-pdf@1.0.17

# 2. Install Tesseract OCR
# For Ubuntu/Debian
apt-get update && apt-get install -y tesseract-ocr

# For macOS
brew install tesseract

# For Windows
# Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
```

### Install Language Packages (Optional)
```bash
# For Ubuntu/Debian
apt-get install -y tesseract-ocr-vie  # Vietnamese
apt-get install -y tesseract-ocr-fra  # French
apt-get install -y tesseract-ocr-deu  # German
apt-get install -y tesseract-ocr-chi-sim  # Simplified Chinese

# For macOS
brew install tesseract-lang
```

## Configuration Quick Reference

### Basic Text Extraction
```json
{
  "pdfSource": "filePath",
  "filePath": "/path/to/document.pdf",
  "pageRange": "1-5",
  "includeMetadata": true,
  "maxFileSize": 10,
  "extractImages": false,
  "performOcr": false
}
```

### OCR for Image-based PDFs
```json
{
  "pdfSource": "binaryData",
  "inputDataField": "data",
  "pageRange": "",
  "includeMetadata": true,
  "maxFileSize": 10,
  "extractImages": false,
  "performOcr": true,
  "ocrLanguage": "eng",
  "ocrEnhancementLevel": "medium"
}
```

### Full Extraction with All Features
```json
{
  "pdfSource": "binaryData",
  "inputDataField": "data",
  "pageRange": "1-10",
  "includeMetadata": true,
  "maxFileSize": 20,
  "chunkSize": 5,
  "showProgress": true,
  "extractImages": true,
  "performOcr": true,
  "ocrLanguage": "eng",
  "ocrEnhancementLevel": "medium",
  "extractTables": true,
  "detectDocumentType": true,
  "extractFormFields": true,
  "documentCategories": "invoice,receipt,contract",
  "customTemplatesPath": "/path/to/templates"
}
```

## Processing Output with JavaScript

### Basic Text Processing
```javascript
// Extract text and format
const text = $input.first().json.text;
const pageCount = $input.first().json.stats.pageCount;
const firstPage = $input.first().json.pages[0].text;

// Word count
const wordCount = text.split(/\s+/).length;

// Extract specific metadata
const title = $input.first().json.metadata?.Title || 'Untitled';
const author = $input.first().json.metadata?.Author || 'Unknown';

return [{
  json: {
    title,
    author,
    pageCount,
    wordCount,
    excerpt: firstPage.substring(0, 200) + '...'
  }
}];
```

### Processing Tables
```javascript
// Get all tables from the document
const tables = $input.first().json.tables || [];

// Count tables
const tableCount = tables.reduce((count, page) => 
  count + (page.tables?.length || 0), 0);

// Convert first table to CSV
let csvContent = '';
if (tables.length > 0 && tables[0].tables && tables[0].tables.length > 0) {
  const firstTable = tables[0].tables[0];
  csvContent = firstTable.rows.map(row => row.join(',')).join('\n');
}

return [{
  json: {
    tableCount,
    csvContent
  }
}];
```

### Working with Document Classification
```javascript
// Get document classification results
const docType = $input.first().json.documentClassification?.documentType || 'unknown';
const confidence = $input.first().json.documentClassification?.confidence || 0;

// Get extracted fields
const fields = $input.first().json.extractedFields || {};

// Create a structured output based on document type
let structuredData = {};
if (docType === 'invoice') {
  structuredData = {
    type: 'Invoice',
    invoiceNumber: fields.invoiceNumber || '',
    date: fields.date || '',
    total: fields.total || '',
    vendor: fields.vendor || '',
    items: fields.lineItems || []
  };
} else if (docType === 'receipt') {
  structuredData = {
    type: 'Receipt',
    merchantName: fields.merchantName || '',
    date: fields.date || '',
    total: fields.total || '',
    items: fields.lineItems || []
  };
}

return [{ json: structuredData }];
```

## Common Page Range Formats

- `"1,3,5"` - Pages 1, 3, and 5
- `"1-5"` - Pages 1 through 5
- `"1-5,8,11-13"` - Pages 1 through 5, page 8, and pages 11 through 13
- `""` (empty string) - All pages

## Supported OCR Languages

- `eng` - English
- `fra` - French
- `deu` - German
- `spa` - Spanish
- `ita` - Italian
- `por` - Portuguese
- `nld` - Dutch
- `vie` - Vietnamese
- `chi_sim` - Simplified Chinese

## OCR Enhancement Levels

- `light` - Minor corrections, preserves original text
- `medium` - Balanced between correction and preservation
- `aggressive` - Maximum correction, may modify text significantly

## Troubleshooting Tips

1. **"File Not Found" Error**
   - Check if the file path is correct and accessible
   - Ensure permissions are set correctly

2. **"File Too Large" Error**
   - Increase the `maxFileSize` parameter
   - Split the PDF into smaller files

3. **"Failed to Extract Text" Error**
   - Try enabling OCR for scanned documents
   - Check if the PDF is password-protected

4. **Slow OCR Performance**
   - Use a more specific page range
   - Decrease the image quality for faster processing
   - Use chunking with a smaller chunk size

5. **Empty or Missing Tables**
   - Check if the PDF contains actual tables (not images of tables)
   - Try using OCR first and then extract tables

---
Created by AI 