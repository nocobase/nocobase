/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const vscErrorCodes = [
  'REPO_NOT_FOUND',
  'REPO_ARCHIVED',
  'FILE_NOT_FOUND',
  'COMMIT_NOT_FOUND',
  'REF_NOT_FOUND',
  'BLOB_NOT_FOUND',
  'PATH_INVALID',
  'FILE_TOO_LARGE',
  'REPO_LIMIT_EXCEEDED',
  'TEXT_ENCODING_INVALID',
  'BASE_COMMIT_OUTDATED',
  'NO_CHANGES',
  'DRAFT_BASE_OUTDATED',
  'PERMISSION_DENIED',
  'RUNJS_SOURCE_KIND_UNSUPPORTED',
  'RUNJS_SOURCE_LOCATOR_INVALID',
  'RUNJS_SOURCE_NOT_FOUND',
  'RUNJS_SOURCE_READONLY',
  'RUNJS_SOURCE_OWNER_OUTDATED',
  'RUNJS_COMPILE_FAILED',
  'RUNJS_ENTRY_NOT_FOUND',
  'RUNJS_IMPORT_NOT_ALLOWED',
  'RUNJS_IMPORT_NOT_FOUND',
  'RUNJS_DYNAMIC_IMPORT_UNSUPPORTED',
  'RUNJS_PUBLISH_NO_CHANGES',
  'RUNJS_COMMIT_MESSAGE_INVALID',
  'INTERNAL_ERROR',
] as const;

export type VscErrorCode = (typeof vscErrorCodes)[number];

export type VscErrorDetails = Record<string, unknown>;

export interface VscErrorOptions {
  details?: VscErrorDetails;
  status?: number;
}

const defaultStatusByCode: Record<VscErrorCode, number> = {
  REPO_NOT_FOUND: 404,
  REPO_ARCHIVED: 409,
  FILE_NOT_FOUND: 404,
  COMMIT_NOT_FOUND: 404,
  REF_NOT_FOUND: 404,
  BLOB_NOT_FOUND: 404,
  PATH_INVALID: 400,
  FILE_TOO_LARGE: 413,
  REPO_LIMIT_EXCEEDED: 413,
  TEXT_ENCODING_INVALID: 400,
  BASE_COMMIT_OUTDATED: 409,
  NO_CHANGES: 409,
  DRAFT_BASE_OUTDATED: 409,
  PERMISSION_DENIED: 403,
  RUNJS_SOURCE_KIND_UNSUPPORTED: 400,
  RUNJS_SOURCE_LOCATOR_INVALID: 400,
  RUNJS_SOURCE_NOT_FOUND: 404,
  RUNJS_SOURCE_READONLY: 403,
  RUNJS_SOURCE_OWNER_OUTDATED: 409,
  RUNJS_COMPILE_FAILED: 400,
  RUNJS_ENTRY_NOT_FOUND: 400,
  RUNJS_IMPORT_NOT_ALLOWED: 400,
  RUNJS_IMPORT_NOT_FOUND: 400,
  RUNJS_DYNAMIC_IMPORT_UNSUPPORTED: 400,
  RUNJS_PUBLISH_NO_CHANGES: 409,
  RUNJS_COMMIT_MESSAGE_INVALID: 400,
  INTERNAL_ERROR: 500,
};

export class VscError extends Error {
  public readonly code: VscErrorCode;

  public readonly details?: VscErrorDetails;

  public readonly status: number;

  constructor(code: VscErrorCode, message?: string, options: VscErrorOptions = {}) {
    super(message || code);
    this.name = 'VscError';
    this.code = code;
    this.details = options.details;
    this.status = options.status || defaultStatusByCode[code];
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

export function isVscError(error: unknown): error is VscError {
  return error instanceof VscError;
}
