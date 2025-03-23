import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
export declare class ExtractPdfNode implements INodeType {
    description: INodeTypeDescription;
    execute(this: any): Promise<INodeExecutionData[][]>;
    private parsePageRange;
    private chunkArray;
}
