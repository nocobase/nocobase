/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type LightExtensionErrorCode =
  | 'LIGHT_EXTENSION_INVALID_INPUT'
  | 'LIGHT_EXTENSION_REPO_CONFLICT'
  | 'LIGHT_EXTENSION_REPO_NOT_FOUND'
  | 'LIGHT_EXTENSION_REPO_NOT_ARCHIVED'
  | 'LIGHT_EXTENSION_REPO_ARCHIVED'
  | 'LIGHT_EXTENSION_LIFECYCLE_CONFLICT'
  | 'LIGHT_EXTENSION_REFERENCE_EXISTS'
  | 'LIGHT_EXTENSION_ENTRY_NOT_FOUND'
  | 'LIGHT_EXTENSION_PUBLICATION_NOT_FOUND'
  | 'LIGHT_EXTENSION_PERMISSION_DENIED'
  | 'LIGHT_EXTENSION_VALIDATION_FAILED'
  | 'LIGHT_EXTENSION_SOURCE_ERROR';

export interface LightExtensionErrorOptions {
  details?: Record<string, unknown>;
  status?: number;
}

const defaultStatusByCode: Record<LightExtensionErrorCode, number> = {
  LIGHT_EXTENSION_INVALID_INPUT: 400,
  LIGHT_EXTENSION_REPO_CONFLICT: 409,
  LIGHT_EXTENSION_REPO_NOT_FOUND: 404,
  LIGHT_EXTENSION_REPO_NOT_ARCHIVED: 409,
  LIGHT_EXTENSION_REPO_ARCHIVED: 409,
  LIGHT_EXTENSION_LIFECYCLE_CONFLICT: 409,
  LIGHT_EXTENSION_REFERENCE_EXISTS: 409,
  LIGHT_EXTENSION_ENTRY_NOT_FOUND: 404,
  LIGHT_EXTENSION_PUBLICATION_NOT_FOUND: 404,
  LIGHT_EXTENSION_PERMISSION_DENIED: 403,
  LIGHT_EXTENSION_VALIDATION_FAILED: 422,
  LIGHT_EXTENSION_SOURCE_ERROR: 500,
};

export class LightExtensionError extends Error {
  public readonly code: LightExtensionErrorCode;

  public readonly details?: Record<string, unknown>;

  public readonly status: number;

  constructor(code: LightExtensionErrorCode, message?: string, options: LightExtensionErrorOptions = {}) {
    super(message || code);
    this.name = 'LightExtensionError';
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

export function isLightExtensionError(error: unknown): error is LightExtensionError {
  return error instanceof LightExtensionError;
}
