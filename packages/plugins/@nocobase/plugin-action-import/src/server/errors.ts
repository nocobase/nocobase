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
