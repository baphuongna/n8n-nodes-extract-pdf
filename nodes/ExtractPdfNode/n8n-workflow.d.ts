declare module 'n8n-workflow' {
    export interface INodeType {
        description: INodeTypeDescription;
        execute: (this: any, node: INodeExecutionData) => Promise<INodeExecutionData[][]>;
    }

    export interface INodeTypeDescription {
        displayName: string;
        name: string;
        group: string[];
        version: number;
        description: string;
        defaults: {
            name: string;
        };
        inputs: string[];
        outputs: string[];
        properties: any[];
    }

export interface INodeExecutionData {
        parameters: {
            [key: string]: any;
        };
        json: any;
    }

    export class NodeOperationError extends Error {
        constructor(name: string, node: INodeExecutionData, message: string);
    }
}
