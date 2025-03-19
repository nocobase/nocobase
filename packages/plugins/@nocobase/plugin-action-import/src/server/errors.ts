export class ImportValidationError extends Error {
  code: string;
  params?: Record<string, any>;

  constructor(code: string, params?: Record<string, any>) {
    super(code);
    this.code = code;
    this.params = params;
    this.name = 'ImportValidationError';
  }
}

export interface ImportErrorOptions {
  rowIndex: number;
  rowData: any;
  cause?: Error;
}

export class ImportError extends Error {
  rowIndex: number;
  rowData: any;
  cause?: Error;

  constructor(message: string, options: ImportErrorOptions) {
    super(message);
    this.name = 'ImportError';
    this.rowIndex = options.rowIndex;
    this.rowData = options.rowData;
    this.cause = options.cause;
  }
}
