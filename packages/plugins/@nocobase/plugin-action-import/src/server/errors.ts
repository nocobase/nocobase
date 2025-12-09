/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export class ImportValidationError extends Error {
  code: string;
  params?: Record<string, any>;

  constructor(message: string, params?: Record<string, any>) {
    super(message);
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
