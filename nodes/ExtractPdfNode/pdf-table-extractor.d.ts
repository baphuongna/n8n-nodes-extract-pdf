declare module 'pdf-table-extractor' {
    interface PageTable {
        page: number;
        tables: string[][][];
    }
    
    interface TableResult {
        pageTables: PageTable[];
        numPages: number;
    }
    
    function pdf_table_extractor(
        filePath: string, 
        success: (result: TableResult) => void, 
        error: (err: string) => void
    ): void;
    
    export = pdf_table_extractor;
} 