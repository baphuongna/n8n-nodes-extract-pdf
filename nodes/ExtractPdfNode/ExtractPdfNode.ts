import { INodeType, INodeTypeDescription, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import pdf from 'pdf-parse';
import * as fs from 'fs';

export class ExtractPdfNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Extract PDF',
        name: 'extractPdf',
        group: ['input'],
        version: 1,
        description: 'Extract text from a PDF file',
        defaults: {
            name: 'Extract PDF',
        },
        inputs: ['main'],
        outputs: ['main'],
        properties: [
            {
                displayName: 'PDF File',
                name: 'pdfFile',
                type: 'file',
                filePicker: true,
                filePickerOptions: {
                    allowedTypes: ['application/pdf'],
                },
                required: true,
            },
        ],
    };

async execute(this: ExtractPdfNode, node: INodeExecutionData): Promise<INodeExecutionData[][]> {
        const pdfFile = node.parameters.pdfFile as { uri: string };
        const filePath = pdfFile.uri;

        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
return [[{ json: { text: data.text }, parameters: {} }]];
        } catch (error) {
            if (error instanceof Error) {
                throw new NodeOperationError(this.description.name, node, `Error extracting text from PDF: ${error.message}`);
            } else {
                throw new NodeOperationError(this.description.name, node, `Error extracting text from PDF: ${String(error)}`);
            }
        }
    }
}
