# n8n-nodes-extract-pdf
*Created by AI*

A custom node for n8n that extracts text, images, and tables from PDF files with multilingual support.

## Features

- ✅ Extract text from regular and image-based PDFs
- ✅ OCR (Optical Character Recognition) for scanned PDFs
- ✅ Process multilingual PDFs with automatic language detection
- ✅ Generate language distribution statistics for documents
- ✅ Extract and process tables
- ✅ Extract images from PDFs
- ✅ Automatic document recognition
- ✅ Extract metadata and file information
- ✅ Process large PDF files efficiently

## New Version (v1.0.18)

We've just released a new version with multilingual capabilities:

1. **Multilingual support**: Automatically detect and process multiple languages in the same document
2. **Language statistics**: Generate statistical reports about language distribution in the document
3. **Improved OCR**: Optimize OCR process for each detected language
4. **Image enhancement**: Improve OCR quality through image processing

## Overview

This node extends the functionality of [n8n](https://n8n.io/) to extract text, images, tables, and form data from PDF files.

The Extract PDF node allows you to easily and flexibly extract data from PDF files. It also supports OCR for image-based or scanned PDFs, document type recognition, and table extraction.

## Key Features:

- ✅ Extract text from PDF
- ✅ Extract PDF metadata
- ✅ Format and clean extracted text
- ✅ OCR for image-based PDFs
- ✅ Extract images from PDF
- ✅ Extract and format tables
- ✅ Document type recognition and field extraction
- ✅ Process large PDFs with pagination
- ✅ Support for multiple languages for OCR

## Installation

### Method 1: From n8n Interface

1. Go to n8n settings
2. Select "Community nodes" tab
3. Search for "n8n-nodes-extract-pdf" and click "Install"

### Method 2: Using CLI

```bash
npm install n8n-nodes-extract-pdf@1.0.18
```

### Method 3: In Docker

```bash
# Using the base n8n image
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n \
  n8n start

# Then install the node
docker exec -it n8n npm install n8n-nodes-extract-pdf@1.0.18

# Restart the container
docker restart n8n
```

### OCR Installation (Optional - Required For Image-Based PDFs)

To use OCR functionality, you need to install Tesseract OCR:

**Windows:**
1. Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
2. Add Tesseract installation path to system PATH

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

**Language Pack Installation (Optional):**
```bash
# Ubuntu/Debian (replace 'eng' with appropriate language code)
sudo apt-get install -y tesseract-ocr-eng

# macOS
brew install tesseract-lang
```

## Using New API

### Processing Multilingual PDFs

Use the `processMultilingualPDF` method to automatically detect and process multilingual documents:

```javascript
const result = await extractPdfNode.processMultilingualPDF({
  filePath: '/path/to/file.pdf',
  pageRange: '1-5', // Optional
  performOcr: true,  // Enable OCR if needed
  enhanceImages: true // Enhance image quality
});

// Returned results
console.log(result.text); // Extracted text
console.log(result.languageStats); // Language statistics
console.log(result.detectedLanguages); // List of detected languages
```

### Sample Result

```json
{
  "text": "Full text extracted from the document",
  "languageStats": {
    "eng": 0.65, // 65% English
    "fra": 0.30, // 30% French
    "deu": 0.05  // 5% German
  },
  "detectedLanguages": [
    {
      "code": "eng",
      "name": "English",
      "confidence": 0.89,
      "pages": [1, 2, 5]
    },
    {
      "code": "fra",
      "name": "French",
      "confidence": 0.92,
      "pages": [3, 4]
    }
  ],
  "processingTime": "2.4s",
  "totalPages": 5
}
```

### Integration with n8n

To use the multilingual feature in n8n workflows:

1. Add the "Extract PDF" node
2. Configure PDF source
3. Enable "Multi-language Processing" option
4. Select languages to support or leave empty for automatic detection
5. Enable "Perform OCR" if processing image-based PDFs

## Description

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

## Configuration Options

| Option | Description |
|--------|-------------|
| **PDF Source** | Choose between file path or binary data |
| **File Path** | Path to the PDF file (if using file path) |
| **Input Data Field** | Field containing the binary PDF data (if using binary data) |
| **Page Range** | Specify pages to extract (e.g., "1-5, 8, 11-13") |
| **Include Metadata** | Include PDF document metadata in output |
| **Max File Size (MB)** | Maximum file size to process |
| **Processing Options** | Advanced options for handling large files |
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

## Output Results

The node outputs an object with the following properties:

```javascript
{
  text: "Extracted text content...",
  pages: [
    { pageNum: 1, text: "Text from page 1..." },
    { pageNum: 2, text: "Text from page 2..." },
    // ...more pages
  ],
  metadata: {
    // PDF metadata if requested
    Title: "Document Title",
    Author: "Document Author",
    // ...other metadata
  },
  stats: {
    pageCount: 5,
    processingTimeMs: 1250,
    pagesPerSecond: 4
  },
  images: [
    { pageNum: 1, data: "base64-encoded-image-data", format: "png" },
    // ...more images
  ],
  tables: [
    {
      pageNum: 1,
      tables: [
        {
          rows: [
            ["Header1", "Header2", "Header3"],
            ["Row1Col1", "Row1Col2", "Row1Col3"],
            // ...more rows
          ]
        }
      ]
    }
    // ...more pages with tables
  ],
  documentClassification: {
    documentType: "invoice",
    confidence: 0.87,
    detectedFields: {
      invoiceNumber: "INV-12345",
      date: "2025-03-22",
      total: "$1,234.56"
      // ...more fields
    }
  },
  extractedFields: {
    // Structured fields extracted from the document
    // For invoices, receipts, etc.
  }
}
```

## Error Handling

The node provides detailed error messages for various failure scenarios:

- File not found
- File too large
- Encrypted/password-protected PDF
- Invalid PDF format
- OCR errors
- Table extraction failures
- Document classification errors

## Processing Large PDF Files

For large PDF files, the node uses a chunking strategy:

1. Divides the PDF into smaller chunks (configurable number of pages)
2. Processes each chunk separately
3. Combines results from all chunks
4. Reports progress during processing

This approach prevents memory issues and improves reliability.

## Supporting Binary Data

You can connect this node directly with nodes like:

- HTTP Request Node
- Google Drive Node
- FTP Node
- Any node that produces binary output

The node will automatically detect and process the binary PDF data.

## Extracting Images

Enable the "Extract Images" option to extract images from the PDF. The node will:

1. Identify and extract all images
2. Provide the base64-encoded image data
3. Include information about the page number and format

## Performing OCR on Image-based PDFs

For PDFs that are actually scanned images, enable OCR:

1. Enable "Perform OCR" option
2. Select the appropriate language (supports English, French, German, Spanish, Italian, Portuguese, Dutch, Chinese, and Vietnamese)
3. Choose the OCR enhancement level (light, medium, aggressive)

The node will convert PDF pages to images, perform OCR, and return the extracted text.

## Document Classification and Field Extraction

When enabled, the node can:

1. Automatically classify documents into types (invoice, receipt, contract, etc.)
2. Extract relevant fields based on the document type
3. Provide confidence scores for classification
4. Use custom templates for specialized document types

## Common OCR Errors and Solutions

### "Failed to perform OCR on PDF"

Possible causes:
- Image quality too low
- Unsupported language
- Memory limitations

Solutions:
- Improve image quality/resolution
- Verify language selection
- Process fewer pages at once

### "OCR is too slow"

Solutions:
- Reduce image resolution
- Process fewer pages at once
- Use more precise page ranges
- Consider using cloud OCR services for large documents

## Installing Tesseract Language Packages

### Windows

1. Download language packs from [GitHub](https://github.com/tesseract-ocr/tessdata/)
2. Place them in the `tessdata` directory (typically: `C:\Program Files\Tesseract-OCR\tessdata\`)

### Linux (Ubuntu/Debian)

```bash
# Install Tesseract
apt-get update && apt-get install -y tesseract-ocr

# Install specific language packages
apt-get install -y tesseract-ocr-vie  # Vietnamese
apt-get install -y tesseract-ocr-fra  # French
apt-get install -y tesseract-ocr-deu  # German
apt-get install -y tesseract-ocr-chi-sim  # Simplified Chinese
```

### macOS

```bash
# Install Tesseract with Homebrew
brew install tesseract

# Install language packs
brew install tesseract-lang
```

## Handling Special Cases

### Password-protected PDFs

The node will detect encrypted PDFs and provide an error message. Password-protected PDFs are not currently supported.

### Complex PDF Structures

Some PDFs with complex layouts may result in imperfect extraction. In these cases:
- Try enabling OCR even for text-based PDFs
- Extract images and use OCR on the images
- Use table extraction for tabular data

## FAQ

### What is a PDF?

PDF (Portable Document Format) is a file format that preserves the formatting of documents independent of the software, hardware, or operating system used to create or view them.

### What is an image-based PDF?

An image-based PDF contains scanned images of pages rather than actual text. Text in these PDFs cannot be selected or searched without OCR.

### What is OCR?

OCR (Optical Character Recognition) is technology that recognizes text within image files or scanned documents and converts it into machine-readable text.

### Why is my text extraction failing?

Common issues include:
- The PDF is image-based (enable OCR)
- The PDF is corrupted
- The PDF is encrypted
- The PDF uses non-standard fonts

### How can I improve OCR speed?

- Process fewer pages at once
- Reduce image resolution
- Use more specific language selection
- Consider cloud-based OCR for large documents

### How do I handle multilingual PDFs?

For best results, identify the primary language and select it for OCR. For mixed-language documents, you may need to process different pages with different language settings.

### Will you support table extraction?

Table extraction is supported in version 1.0.17+. Enable the "Extract Tables" option to use this feature.

### Why do I get "Package loading error"?

This typically occurs when:
- The node was installed but n8n wasn't restarted
- The package was installed globally instead of locally
- There are version compatibility issues

## Performance Optimization

For optimal performance:

1. Be specific with page ranges
2. Use appropriate chunk sizes
3. Enable progress reporting for large files
4. Use OCR only when necessary
5. Select the correct language for OCR
6. Use AI enhancements only when needed

---
Created by AI 