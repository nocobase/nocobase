/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type RunJSSourceErrorCode =
  | 'PERMISSION_DENIED'
  | 'RUNJS_SOURCE_KIND_UNSUPPORTED'
  | 'RUNJS_SOURCE_LOCATOR_INVALID'
  | 'RUNJS_SOURCE_NOT_FOUND'
  | 'RUNJS_SOURCE_READONLY'
  | 'RUNJS_SOURCE_OWNER_OUTDATED'
  | 'INTERNAL_ERROR';

export interface RunJSSourceErrorOptions {
  details?: Record<string, unknown>;
  status?: number;
}

const defaultStatusByCode: Record<RunJSSourceErrorCode, number> = {
  PERMISSION_DENIED: 403,
  RUNJS_SOURCE_KIND_UNSUPPORTED: 400,
  RUNJS_SOURCE_LOCATOR_INVALID: 400,
  RUNJS_SOURCE_NOT_FOUND: 404,
  RUNJS_SOURCE_READONLY: 403,
  RUNJS_SOURCE_OWNER_OUTDATED: 409,
  INTERNAL_ERROR: 500,
};

export class RunJSSourceError extends Error {
  readonly status: number;

  readonly details?: Record<string, unknown>;

  constructor(
    readonly code: RunJSSourceErrorCode,
    message?: string,
    options: RunJSSourceErrorOptions = {},
  ) {
    super(message || code);
    this.name = 'RunJSSourceError';
    this.status = options.status || defaultStatusByCode[code];
    this.details = options.details;
  }

  toResponseBody() {
    return {
      errors: [
        {
          code: this.code,
          message: this.message,
          status: this.status,
          details: this.details,
        },
      ],
    };
  }
}
