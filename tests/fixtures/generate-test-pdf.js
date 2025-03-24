const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Đảm bảo thư mục tồn tại
const fixturesDir = path.join(__dirname);
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Tạo PDF đơn giản chứa văn bản và bảng
function createSimplePdf() {
  const doc = new PDFDocument();
  const outputPath = path.join(fixturesDir, 'sample.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Thêm metadata
  doc.info.Title = 'Sample PDF for Testing';
  doc.info.Author = 'Test Suite';
  doc.info.Subject = 'PDF Extraction Testing';

  // Thêm nội dung
  doc.fontSize(25).text('Sample PDF Document', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('This is a sample PDF document created for testing PDF extraction functionality.', { align: 'justify' });
  doc.moveDown();
  
  // Thêm đoạn văn bản mẫu
  doc.fontSize(10).text('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus at pulvinar enim. Aliquam erat volutpat. Donec euismod eleifend nulla, ac malesuada velit. Nulla facilisi. Nulla facilisi. Cras auctor, nisi nec interdum finibus, est justo malesuada velit, nec varius neque libero vel quam. Sed auctor tellus in risus malesuada, id tincidunt neque efficitur. Quisque auctor, magna at elementum finibus, augue ligula scelerisque nulla, at placerat nunc odio vel felis.', { align: 'justify' });
  doc.moveDown();

  // Tạo một bảng đơn giản
  doc.fontSize(14).text('Simple Table Example:', { underline: true });
  doc.moveDown();

  // Vẽ bảng thủ công
  const tableTop = doc.y;
  const tableLeft = 50;
  const colWidth = 120;
  const rowHeight = 30;
  
  // Tiêu đề bảng
  doc.font('Helvetica-Bold');
  doc.fontSize(10);
  doc.text('ID', tableLeft, tableTop);
  doc.text('Name', tableLeft + colWidth, tableTop);
  doc.text('Value', tableLeft + colWidth * 2, tableTop);
  
  // Dữ liệu bảng
  doc.font('Helvetica');
  
  // Hàng 1
  doc.text('1', tableLeft, tableTop + rowHeight);
  doc.text('Item One', tableLeft + colWidth, tableTop + rowHeight);
  doc.text('10.50', tableLeft + colWidth * 2, tableTop + rowHeight);
  
  // Hàng 2
  doc.text('2', tableLeft, tableTop + rowHeight * 2);
  doc.text('Item Two', tableLeft + colWidth, tableTop + rowHeight * 2);
  doc.text('25.75', tableLeft + colWidth * 2, tableTop + rowHeight * 2);
  
  // Hàng 3
  doc.text('3', tableLeft, tableTop + rowHeight * 3);
  doc.text('Item Three', tableLeft + colWidth, tableTop + rowHeight * 3);
  doc.text('35.25', tableLeft + colWidth * 2, tableTop + rowHeight * 3);
  
  // Vẽ đường viền
  doc.rect(tableLeft - 5, tableTop - 5, colWidth * 3 + 10, rowHeight * 4 + 10).stroke();
  
  // Đường ngang
  doc.moveTo(tableLeft - 5, tableTop + rowHeight - 5).lineTo(tableLeft + colWidth * 3 + 5, tableTop + rowHeight - 5).stroke();
  doc.moveTo(tableLeft - 5, tableTop + rowHeight * 2 - 5).lineTo(tableLeft + colWidth * 3 + 5, tableTop + rowHeight * 2 - 5).stroke();
  doc.moveTo(tableLeft - 5, tableTop + rowHeight * 3 - 5).lineTo(tableLeft + colWidth * 3 + 5, tableTop + rowHeight * 3 - 5).stroke();
  
  // Đường dọc
  doc.moveTo(tableLeft + colWidth - 5, tableTop - 5).lineTo(tableLeft + colWidth - 5, tableTop + rowHeight * 4 + 5).stroke();
  doc.moveTo(tableLeft + colWidth * 2 - 5, tableTop - 5).lineTo(tableLeft + colWidth * 2 - 5, tableTop + rowHeight * 4 + 5).stroke();

  // Thêm một hình ảnh đơn giản
  doc.addPage();
  doc.fontSize(16).text('Page with Image:', { underline: true });
  
  // Thêm tiêu đề với nhiều ngôn ngữ
  doc.moveDown();
  doc.fontSize(14).text('Multilingual Text Example:');
  doc.moveDown();
  doc.fontSize(12).text('English: Hello World');
  doc.fontSize(12).text('Vietnamese: Xin chào thế giới');
  doc.fontSize(12).text('French: Bonjour le monde');
  doc.fontSize(12).text('Spanish: Hola Mundo');
  doc.fontSize(12).text('German: Hallo Welt');
  
  // Kết thúc tài liệu
  doc.end();
  
  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`PDF created successfully at: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Tạo PDF phức tạp hơn với bảng và hình ảnh
function createComplexPdf() {
  const doc = new PDFDocument();
  const outputPath = path.join(fixturesDir, 'complex.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Thêm metadata
  doc.info.Title = 'Complex PDF for Testing';
  doc.info.Author = 'Test Suite';
  doc.info.Subject = 'Advanced PDF Extraction Testing';

  // Trang bìa
  doc.fontSize(25).text('Complex PDF Document', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text('For Advanced Testing', { align: 'center' });
  doc.moveDown(5);
  doc.fontSize(12).text('Created on: ' + new Date().toLocaleDateString(), { align: 'center' });
  
  // Thêm trang mới
  doc.addPage();
  
  // Thêm mục lục
  doc.fontSize(18).text('Table of Contents', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text('1. Introduction ............................ 3');
  doc.fontSize(12).text('2. Data Tables ............................ 4');
  doc.fontSize(12).text('3. Multilingual Content .................... 5');
  
  // Thêm trang giới thiệu
  doc.addPage();
  doc.fontSize(16).text('1. Introduction', { underline: true });
  doc.moveDown();
  doc.fontSize(12).text('This is a complex PDF document created for testing advanced PDF extraction functionality including tables, text in multiple languages, and document classification.', { align: 'justify' });
  doc.moveDown();
  doc.fontSize(12).text('The document includes structured data that can be used to test table extraction, language detection, and document type classification algorithms.', { align: 'justify' });
  
  // Thêm trang với bảng phức tạp
  doc.addPage();
  doc.fontSize(16).text('2. Data Tables', { underline: true });
  doc.moveDown();
  
  // Tạo bảng phức tạp
  const tableTop = 150;
  const tableLeft = 50;
  
  // Tiêu đề bảng
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Product ID', tableLeft, tableTop);
  doc.text('Product Name', tableLeft + 70, tableTop);
  doc.text('Category', tableLeft + 180, tableTop);
  doc.text('Price', tableLeft + 250, tableTop);
  doc.text('Stock', tableLeft + 320, tableTop);
  
  // Dữ liệu bảng
  doc.font('Helvetica').fontSize(10);
  
  const items = [
    { id: 'P001', name: 'Laptop Dell XPS 13', category: 'Electronics', price: '$1,299.99', stock: 45 },
    { id: 'P002', name: 'Wireless Mouse', category: 'Accessories', price: '$24.99', stock: 150 },
    { id: 'P003', name: 'External Hard Drive 1TB', category: 'Storage', price: '$89.99', stock: 78 },
    { id: 'P004', name: 'Bluetooth Headphones', category: 'Audio', price: '$159.99', stock: 62 },
    { id: 'P005', name: 'USB-C Cable Pack', category: 'Accessories', price: '$19.99', stock: 200 },
    { id: 'P006', name: 'Monitor 27"', category: 'Electronics', price: '$349.99', stock: 30 },
    { id: 'P007', name: 'Keyboard Mechanical', category: 'Accessories', price: '$129.99', stock: 85 }
  ];
  
  const rowHeight = 25;
  
  items.forEach((item, index) => {
    const y = tableTop + (index + 1) * rowHeight;
    doc.text(item.id, tableLeft, y);
    doc.text(item.name, tableLeft + 70, y);
    doc.text(item.category, tableLeft + 180, y);
    doc.text(item.price, tableLeft + 250, y);
    doc.text(item.stock.toString(), tableLeft + 320, y);
  });
  
  // Vẽ đường viền
  doc.rect(tableLeft - 5, tableTop - 5, 380, (items.length + 1) * rowHeight + 10).stroke();
  
  // Đường ngang cho tiêu đề
  doc.moveTo(tableLeft - 5, tableTop + rowHeight - 5).lineTo(tableLeft + 375, tableTop + rowHeight - 5).stroke();
  
  // Các đường dọc
  doc.moveTo(tableLeft + 65, tableTop - 5).lineTo(tableLeft + 65, tableTop + (items.length + 1) * rowHeight + 5).stroke();
  doc.moveTo(tableLeft + 175, tableTop - 5).lineTo(tableLeft + 175, tableTop + (items.length + 1) * rowHeight + 5).stroke();
  doc.moveTo(tableLeft + 245, tableTop - 5).lineTo(tableLeft + 245, tableTop + (items.length + 1) * rowHeight + 5).stroke();
  doc.moveTo(tableLeft + 315, tableTop - 5).lineTo(tableLeft + 315, tableTop + (items.length + 1) * rowHeight + 5).stroke();
  
  // Trang nội dung đa ngôn ngữ
  doc.addPage();
  doc.fontSize(16).text('3. Multilingual Content', { underline: true });
  doc.moveDown();
  
  doc.fontSize(14).text('English', { underline: true });
  doc.fontSize(12).text('This document contains text in multiple languages to test language detection and multilingual processing capabilities.');
  doc.moveDown();
  
  doc.fontSize(14).text('Vietnamese (Tiếng Việt)', { underline: true });
  doc.fontSize(12).text('Tài liệu này chứa văn bản bằng nhiều ngôn ngữ để kiểm tra khả năng phát hiện ngôn ngữ và xử lý đa ngôn ngữ.');
  doc.moveDown();
  
  doc.fontSize(14).text('French (Français)', { underline: true });
  doc.fontSize(12).text('Ce document contient du texte en plusieurs langues pour tester les capacités de détection de langue et de traitement multilingue.');
  doc.moveDown();
  
  doc.fontSize(14).text('Spanish (Español)', { underline: true });
  doc.fontSize(12).text('Este documento contiene texto en varios idiomas para probar las capacidades de detección de idiomas y procesamiento multilingüe.');
  doc.moveDown();
  
  doc.fontSize(14).text('German (Deutsch)', { underline: true });
  doc.fontSize(12).text('Dieses Dokument enthält Text in mehreren Sprachen, um die Spracherkennungs- und mehrsprachigen Verarbeitungsfunktionen zu testen.');
  
  // Kết thúc tài liệu
  doc.end();
  
  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`Complex PDF created successfully at: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Tạo một mẫu invoice cho việc test phân loại tài liệu
function createInvoicePdf() {
  const doc = new PDFDocument();
  const outputPath = path.join(fixturesDir, 'invoice.pdf');
  const stream = fs.createWriteStream(outputPath);

  doc.pipe(stream);

  // Thêm metadata
  doc.info.Title = 'Sample Invoice';
  doc.info.Author = 'Test Suite';
  doc.info.Subject = 'Invoice for Testing';

  // Header
  doc.fontSize(20).text('INVOICE', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text('Invoice #: INV-12345', { align: 'right' });
  doc.fontSize(10).text('Date: ' + new Date().toLocaleDateString(), { align: 'right' });
  doc.moveDown(2);
  
  // Thông tin công ty
  doc.fontSize(12).text('ABC Company', { align: 'left' });
  doc.fontSize(10).text('123 Business Street');
  doc.fontSize(10).text('Business City, State 12345');
  doc.fontSize(10).text('Phone: (123) 456-7890');
  doc.fontSize(10).text('Email: accounting@abccompany.com');
  doc.moveDown(2);
  
  // Thông tin khách hàng
  doc.fontSize(12).text('Bill To:', { underline: true });
  doc.fontSize(10).text('Customer XYZ');
  doc.fontSize(10).text('456 Customer Avenue');
  doc.fontSize(10).text('Customer City, State 67890');
  doc.moveDown(2);
  
  // Bảng hóa đơn
  const tableTop = 300;
  const tableLeft = 50;
  
  // Tiêu đề bảng
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Item', tableLeft, tableTop);
  doc.text('Description', tableLeft + 100, tableTop);
  doc.text('Qty', tableLeft + 250, tableTop);
  doc.text('Unit Price', tableLeft + 300, tableTop);
  doc.text('Amount', tableLeft + 400, tableTop);
  
  // Dữ liệu bảng
  doc.font('Helvetica').fontSize(10);
  
  const items = [
    { item: 'ITEM001', desc: 'Professional Services', qty: 10, price: 150, amount: 1500 },
    { item: 'ITEM002', desc: 'Software License', qty: 1, price: 500, amount: 500 },
    { item: 'ITEM003', desc: 'Hardware Component', qty: 5, price: 100, amount: 500 },
    { item: 'ITEM004', desc: 'Technical Support (hours)', qty: 8, price: 75, amount: 600 },
  ];
  
  const rowHeight = 25;
  
  items.forEach((item, index) => {
    const y = tableTop + (index + 1) * rowHeight;
    doc.text(item.item, tableLeft, y);
    doc.text(item.desc, tableLeft + 100, y);
    doc.text(item.qty.toString(), tableLeft + 250, y);
    doc.text('$' + item.price.toFixed(2), tableLeft + 300, y);
    doc.text('$' + item.amount.toFixed(2), tableLeft + 400, y);
  });
  
  // Tổng tiền
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;
  
  doc.font('Helvetica').fontSize(10);
  doc.text('Subtotal:', 350, tableTop + (items.length + 2) * rowHeight);
  doc.text('$' + subtotal.toFixed(2), 450, tableTop + (items.length + 2) * rowHeight);
  
  doc.text('Tax (10%):', 350, tableTop + (items.length + 3) * rowHeight);
  doc.text('$' + tax.toFixed(2), 450, tableTop + (items.length + 3) * rowHeight);
  
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Total:', 350, tableTop + (items.length + 4) * rowHeight);
  doc.text('$' + total.toFixed(2), 450, tableTop + (items.length + 4) * rowHeight);
  
  // Thông tin thanh toán
  doc.moveDown(5);
  doc.fontSize(12).text('Payment Information', { underline: true });
  doc.fontSize(10).text('Payment Due: 30 days from invoice date');
  doc.fontSize(10).text('Account Name: ABC Company');
  doc.fontSize(10).text('Account Number: 1234567890');
  doc.fontSize(10).text('Routing Number: 987654321');
  
  // Footer
  doc.fontSize(10).text('Thank you for your business!', { align: 'center' });
  
  // Kết thúc tài liệu
  doc.end();
  
  return new Promise((resolve) => {
    stream.on('finish', () => {
      console.log(`Invoice PDF created successfully at: ${outputPath}`);
      resolve(outputPath);
    });
  });
}

// Chạy các hàm tạo PDF
async function generateAllTestPdfs() {
  console.log('Generating test PDFs...');
  
  try {
    await createSimplePdf();
    await createComplexPdf();
    await createInvoicePdf();
    console.log('All test PDFs generated successfully!');
  } catch (error) {
    console.error('Error generating test PDFs:', error);
  }
}

// Xuất các hàm để có thể sử dụng trong các file test khác
module.exports = {
  generateAllTestPdfs,
  createSimplePdf,
  createComplexPdf,
  createInvoicePdf
};

// Nếu chạy trực tiếp, tạo tất cả các PDF
if (require.main === module) {
  generateAllTestPdfs();
} 