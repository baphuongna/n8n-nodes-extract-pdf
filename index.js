/**
 * n8n-nodes-extract-pdf
 * Created by AI
 * 
 * A node for n8n to extract text, images and tables from PDF files
 * Version: 1.0.22
 */

try {
  // Kiểm tra xem nodejs đã làm việc với n8n-workflow hay chưa
  try {
    require('n8n-workflow');
  } catch (workflowError) {
    console.error('Thiếu dependency n8n-workflow:', workflowError);
    throw new Error('n8n-workflow không khả dụng - vui lòng đảm bảo n8n được cài đặt đúng cách');
  }
  
  module.exports = require('./dist/nodes/ExtractPdfNode/ExtractPdfNode.node.js');
} catch (error) {
  console.error('Lỗi khi tải n8n-nodes-extract-pdf:', error);
  throw new Error(`Không thể tải node Extract PDF: ${error.message}`);
} 