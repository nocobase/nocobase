/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RemoteSyncErrorCode } from '@nocobase/plugin-vsc-file';

export type LightExtensionErrorCode =
  | 'LIGHT_EXTENSION_INVALID_INPUT'
  | 'LIGHT_EXTENSION_REPO_CONFLICT'
  | 'LIGHT_EXTENSION_REPO_NOT_FOUND'
  | 'LIGHT_EXTENSION_REPO_NOT_ARCHIVED'
  | 'LIGHT_EXTENSION_REPO_ARCHIVED'
  | 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE'
  | 'LIGHT_EXTENSION_REFERENCE_EXISTS'
  | 'LIGHT_EXTENSION_ENTRY_NOT_FOUND'
  | 'LIGHT_EXTENSION_ARTIFACT_NOT_FOUND'
  | 'LIGHT_EXTENSION_ENTRY_CONFLICT'
  | 'LIGHT_EXTENSION_BINDING_OUTDATED'
  | 'LIGHT_EXTENSION_SOURCE_OUTDATED'
  | 'LIGHT_EXTENSION_SETTINGS_INVALID'
  | 'LIGHT_EXTENSION_PERMISSION_DENIED'
  | 'LIGHT_EXTENSION_VALIDATION_FAILED'
  | 'LIGHT_EXTENSION_SOURCE_ERROR'
  | 'LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER'
  | 'LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE'
  | 'LIGHT_EXTENSION_SYNC_AUTH_FAILED'
  | 'LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND'
  | 'LIGHT_EXTENSION_SYNC_RATE_LIMITED'
  | 'LIGHT_EXTENSION_SYNC_REMOTE_CHANGED'
  | 'LIGHT_EXTENSION_SYNC_DIVERGED'
  | 'LIGHT_EXTENSION_SYNC_BUSY'
  | 'LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT'
  | 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE'
  | 'LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED'
  | 'LIGHT_EXTENSION_SYNC_CONFIG_INVALID'
  | 'LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID';

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
  LIGHT_EXTENSION_RUNTIME_UNAVAILABLE: 409,
  LIGHT_EXTENSION_REFERENCE_EXISTS: 409,
  LIGHT_EXTENSION_ENTRY_NOT_FOUND: 404,
  LIGHT_EXTENSION_ARTIFACT_NOT_FOUND: 404,
  LIGHT_EXTENSION_ENTRY_CONFLICT: 409,
  LIGHT_EXTENSION_BINDING_OUTDATED: 409,
  LIGHT_EXTENSION_SOURCE_OUTDATED: 409,
  LIGHT_EXTENSION_SETTINGS_INVALID: 422,
  LIGHT_EXTENSION_PERMISSION_DENIED: 403,
  LIGHT_EXTENSION_VALIDATION_FAILED: 422,
  LIGHT_EXTENSION_SOURCE_ERROR: 500,
  LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER: 422,
  LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE: 422,
  LIGHT_EXTENSION_SYNC_AUTH_FAILED: 422,
  LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND: 404,
  LIGHT_EXTENSION_SYNC_RATE_LIMITED: 429,
  LIGHT_EXTENSION_SYNC_REMOTE_CHANGED: 409,
  LIGHT_EXTENSION_SYNC_DIVERGED: 409,
  LIGHT_EXTENSION_SYNC_BUSY: 409,
  LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT: 422,
  LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE: 502,
  LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED: 409,
  LIGHT_EXTENSION_SYNC_CONFIG_INVALID: 422,
  LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID: 422,
};

export const LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE = {
  UNSUPPORTED_PROVIDER: 'LIGHT_EXTENSION_SYNC_UNSUPPORTED_PROVIDER',
  CREDENTIAL_UNAVAILABLE: 'LIGHT_EXTENSION_SYNC_CREDENTIAL_UNAVAILABLE',
  AUTH_FAILED: 'LIGHT_EXTENSION_SYNC_AUTH_FAILED',
  REMOTE_NOT_FOUND: 'LIGHT_EXTENSION_SYNC_REMOTE_NOT_FOUND',
  RATE_LIMITED: 'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
  REMOTE_CHANGED: 'LIGHT_EXTENSION_SYNC_REMOTE_CHANGED',
  DIVERGED: 'LIGHT_EXTENSION_SYNC_DIVERGED',
  BUSY: 'LIGHT_EXTENSION_SYNC_BUSY',
  UNSAFE_CONTENT: 'LIGHT_EXTENSION_SYNC_UNSAFE_CONTENT',
  REMOTE_UNAVAILABLE: 'LIGHT_EXTENSION_SYNC_REMOTE_UNAVAILABLE',
  PERMISSION_DENIED: 'LIGHT_EXTENSION_PERMISSION_DENIED',
  REPO_ARCHIVED: 'LIGHT_EXTENSION_REPO_ARCHIVED',
  LOCAL_OUTDATED: 'LIGHT_EXTENSION_SYNC_LOCAL_OUTDATED',
  CONFIG_INVALID: 'LIGHT_EXTENSION_SYNC_CONFIG_INVALID',
  AUTH_REF_INVALID: 'LIGHT_EXTENSION_SYNC_AUTH_REF_INVALID',
} as const satisfies Record<RemoteSyncErrorCode, LightExtensionErrorCode>;

type LightExtensionSyncErrorDetailValue = string | number | boolean | null;

export interface RemoteSyncErrorLike {
  code: RemoteSyncErrorCode;
  message?: string;
  details?: Record<string, unknown>;
}

const safeRemoteDetailKeys = new Set([
  'provider',
  'operation',
  'reasonCode',
  'retryAfterSeconds',
  'remoteTargetVersion',
  'expectedRemoteRevision',
  'currentRemoteRevision',
  'expectedHeadCommitId',
  'currentHeadCommitId',
]);

function sanitizeRemoteSyncErrorDetails(
  error: RemoteSyncErrorLike,
): Record<string, LightExtensionSyncErrorDetailValue> {
  const details: Record<string, LightExtensionSyncErrorDetailValue> = {
    sourceCode: error.code,
  };

  for (const [key, value] of Object.entries(error.details || {})) {
    if (!safeRemoteDetailKeys.has(key)) {
      continue;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      details[key] = value as LightExtensionSyncErrorDetailValue;
    }
  }

  return details;
}

export class LightExtensionError extends Error {
  public readonly code: LightExtensionErrorCode;

  public readonly details?: Record<string, unknown>;

  public readonly status: number;

  constructor(code: LightExtensionErrorCode, message?: string, options: LightExtensionErrorOptions = {}) {
    super(message || code);
    this.name = 'LightExtensionError';
    this.code = code;
    this.details = options.details;
    this.status = options.status ?? defaultStatusByCode[code];
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

/**
 * Convert the provider-neutral VSC error into the stable light-extension facade contract. Authentication failures
 * intentionally use a domain 422 response instead of a bare 401, so clients do not mistake a provider credential
 * failure for an expired NocoBase login. Raw provider errors, causes, requests, responses, headers, and configs are
 * never copied across this boundary.
 */
export function mapRemoteSyncErrorToLightExtension(error: RemoteSyncErrorLike): LightExtensionError {
  const code = LIGHT_EXTENSION_SYNC_ERROR_CODE_BY_REMOTE_CODE[error.code];
  return new LightExtensionError(code, code, {
    details: sanitizeRemoteSyncErrorDetails(error),
  });
}
