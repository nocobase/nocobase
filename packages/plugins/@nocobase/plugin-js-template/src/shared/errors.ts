/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RemoteSyncErrorCode } from './vsc-file/remote-sync-types';

/** Canonical public error codes shared by HTTP, CLI, and SDK consumers. */
export const JS_TEMPLATE_ERROR_CODES = [
  'JS_TEMPLATE_INVALID_INPUT',
  'JS_TEMPLATE_PROJECT_CONFLICT',
  'JS_TEMPLATE_PROJECT_NOT_FOUND',
  'JS_TEMPLATE_PROJECT_NOT_ARCHIVED',
  'JS_TEMPLATE_PROJECT_ARCHIVED',
  'JS_TEMPLATE_PROJECT_DISABLED',
  'JS_TEMPLATE_RUNTIME_UNAVAILABLE',
  'JS_TEMPLATE_USAGE_EXISTS',
  'JS_TEMPLATE_NOT_FOUND',
  'JS_TEMPLATE_ARTIFACT_NOT_FOUND',
  'JS_TEMPLATE_CONFLICT',
  'JS_TEMPLATE_IDEMPOTENCY_CONFLICT',
  'JS_TEMPLATE_IDEMPOTENCY_IN_PROGRESS',
  'JS_TEMPLATE_BINDING_OUTDATED',
  'JS_TEMPLATE_SOURCE_OUTDATED',
  'JS_TEMPLATE_SETTINGS_INVALID',
  'JS_TEMPLATE_PERMISSION_DENIED',
  'JS_TEMPLATE_VALIDATION_FAILED',
  'JS_TEMPLATE_SOURCE_ERROR',
  'JS_TEMPLATE_SYNC_UNSUPPORTED_PROVIDER',
  'JS_TEMPLATE_SYNC_CREDENTIAL_UNAVAILABLE',
  'JS_TEMPLATE_SYNC_AUTH_FAILED',
  'JS_TEMPLATE_SYNC_REMOTE_NOT_FOUND',
  'JS_TEMPLATE_SYNC_RATE_LIMITED',
  'JS_TEMPLATE_SYNC_REMOTE_CHANGED',
  'JS_TEMPLATE_SYNC_DIVERGED',
  'JS_TEMPLATE_SYNC_BUSY',
  'JS_TEMPLATE_SYNC_UNSAFE_CONTENT',
  'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
  'JS_TEMPLATE_SYNC_LOCAL_OUTDATED',
  'JS_TEMPLATE_SYNC_CONFIG_INVALID',
  'JS_TEMPLATE_SYNC_AUTH_REF_INVALID',
] as const;

export type JsTemplateErrorCode = (typeof JS_TEMPLATE_ERROR_CODES)[number];

export interface JsTemplateErrorOptions {
  details?: Record<string, unknown>;
  status?: number;
}

const defaultStatusByCode: Record<JsTemplateErrorCode, number> = {
  JS_TEMPLATE_INVALID_INPUT: 400,
  JS_TEMPLATE_PROJECT_CONFLICT: 409,
  JS_TEMPLATE_PROJECT_NOT_FOUND: 404,
  JS_TEMPLATE_PROJECT_NOT_ARCHIVED: 409,
  JS_TEMPLATE_PROJECT_ARCHIVED: 409,
  JS_TEMPLATE_PROJECT_DISABLED: 409,
  JS_TEMPLATE_RUNTIME_UNAVAILABLE: 409,
  JS_TEMPLATE_USAGE_EXISTS: 409,
  JS_TEMPLATE_NOT_FOUND: 404,
  JS_TEMPLATE_ARTIFACT_NOT_FOUND: 404,
  JS_TEMPLATE_CONFLICT: 409,
  JS_TEMPLATE_IDEMPOTENCY_CONFLICT: 409,
  JS_TEMPLATE_IDEMPOTENCY_IN_PROGRESS: 409,
  JS_TEMPLATE_BINDING_OUTDATED: 409,
  JS_TEMPLATE_SOURCE_OUTDATED: 409,
  JS_TEMPLATE_SETTINGS_INVALID: 422,
  JS_TEMPLATE_PERMISSION_DENIED: 403,
  JS_TEMPLATE_VALIDATION_FAILED: 422,
  JS_TEMPLATE_SOURCE_ERROR: 500,
  JS_TEMPLATE_SYNC_UNSUPPORTED_PROVIDER: 422,
  JS_TEMPLATE_SYNC_CREDENTIAL_UNAVAILABLE: 422,
  JS_TEMPLATE_SYNC_AUTH_FAILED: 422,
  JS_TEMPLATE_SYNC_REMOTE_NOT_FOUND: 404,
  JS_TEMPLATE_SYNC_RATE_LIMITED: 429,
  JS_TEMPLATE_SYNC_REMOTE_CHANGED: 409,
  JS_TEMPLATE_SYNC_DIVERGED: 409,
  JS_TEMPLATE_SYNC_BUSY: 409,
  JS_TEMPLATE_SYNC_UNSAFE_CONTENT: 422,
  JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE: 502,
  JS_TEMPLATE_SYNC_LOCAL_OUTDATED: 409,
  JS_TEMPLATE_SYNC_CONFIG_INVALID: 422,
  JS_TEMPLATE_SYNC_AUTH_REF_INVALID: 422,
};

export const JS_TEMPLATE_SYNC_ERROR_CODE_BY_REMOTE_CODE = {
  UNSUPPORTED_PROVIDER: 'JS_TEMPLATE_SYNC_UNSUPPORTED_PROVIDER',
  CREDENTIAL_UNAVAILABLE: 'JS_TEMPLATE_SYNC_CREDENTIAL_UNAVAILABLE',
  AUTH_FAILED: 'JS_TEMPLATE_SYNC_AUTH_FAILED',
  REMOTE_NOT_FOUND: 'JS_TEMPLATE_SYNC_REMOTE_NOT_FOUND',
  RATE_LIMITED: 'JS_TEMPLATE_SYNC_RATE_LIMITED',
  REMOTE_CHANGED: 'JS_TEMPLATE_SYNC_REMOTE_CHANGED',
  DIVERGED: 'JS_TEMPLATE_SYNC_DIVERGED',
  BUSY: 'JS_TEMPLATE_SYNC_BUSY',
  UNSAFE_CONTENT: 'JS_TEMPLATE_SYNC_UNSAFE_CONTENT',
  REMOTE_UNAVAILABLE: 'JS_TEMPLATE_SYNC_REMOTE_UNAVAILABLE',
  PERMISSION_DENIED: 'JS_TEMPLATE_PERMISSION_DENIED',
  REPO_ARCHIVED: 'JS_TEMPLATE_PROJECT_ARCHIVED',
  LOCAL_OUTDATED: 'JS_TEMPLATE_SYNC_LOCAL_OUTDATED',
  CONFIG_INVALID: 'JS_TEMPLATE_SYNC_CONFIG_INVALID',
  AUTH_REF_INVALID: 'JS_TEMPLATE_SYNC_AUTH_REF_INVALID',
} as const satisfies Record<RemoteSyncErrorCode, JsTemplateErrorCode>;

type JsTemplateSyncErrorDetailValue = string | number | boolean | null;

export interface RemoteSyncErrorLike {
  code: RemoteSyncErrorCode;
  message?: string;
  details?: unknown;
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

function sanitizeRemoteSyncErrorDetails(error: RemoteSyncErrorLike): Record<string, JsTemplateSyncErrorDetailValue> {
  const details: Record<string, JsTemplateSyncErrorDetailValue> = {
    sourceCode: error.code,
  };

  const remoteDetails = isRecord(error.details) ? error.details : {};
  for (const [key, value] of Object.entries(remoteDetails)) {
    if (!safeRemoteDetailKeys.has(key)) {
      continue;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) {
      details[key] = value as JsTemplateSyncErrorDetailValue;
    }
  }

  return details;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export class JsTemplateError extends Error {
  public readonly code: JsTemplateErrorCode;

  public readonly details?: Record<string, unknown>;

  public readonly status: number;

  constructor(code: JsTemplateErrorCode, message?: string, options: JsTemplateErrorOptions = {}) {
    super(message || code);
    this.name = 'JsTemplateError';
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

export function isJsTemplateError(error: unknown): error is JsTemplateError {
  return error instanceof JsTemplateError;
}

/**
 * Convert the provider-neutral VSC error into the stable JS Template API contract. Authentication failures
 * intentionally use a domain 422 response instead of a bare 401, so clients do not mistake a provider credential
 * failure for an expired NocoBase login. Raw provider errors, causes, requests, responses, headers, and configs are
 * never copied across this boundary.
 */
export function mapRemoteSyncErrorToJsTemplate(error: RemoteSyncErrorLike): JsTemplateError {
  const code = JS_TEMPLATE_SYNC_ERROR_CODE_BY_REMOTE_CODE[error.code];
  return new JsTemplateError(code, code, {
    details: sanitizeRemoteSyncErrorDetails(error),
  });
}
