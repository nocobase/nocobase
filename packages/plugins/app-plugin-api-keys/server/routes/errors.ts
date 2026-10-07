import { ApiError, type ApiErrorStatus } from '@nocobase/app-server/router';

import { ApiKeyRequestError } from '../scoped-keys.js';
import { ApiKeyScopeError } from '../scopes.js';

/** The error domain of the API keys plugin: its URL namespace. */
export const API_KEYS_ERROR_DOMAIN = 'apiKeys';

const FIELD_OF: Readonly<Record<string, string>> = {
  EXPIRY_REQUIRED: 'expiresInDays',
  INVALID_EXPIRY: 'expiresInDays',
};

function statusOf(error: ApiKeyRequestError): ApiErrorStatus {
  if (error.status === 403) return 'PERMISSION_DENIED';
  if (error.status === 404) return 'NOT_FOUND';
  return error.code === 'KEY_NOT_SCOPED'
    ? 'FAILED_PRECONDITION'
    : 'INVALID_ARGUMENT';
}

/**
 * The plugin's own errors as `ApiError`, domain `apiKeys`, with their code as the reason; anything else is returned
 * unchanged for `apiErrorHandler`. Exported so an application's own key routes answer the same way.
 */
export function toApiKeysApiError(error: unknown): unknown {
  if (error instanceof ApiKeyScopeError)
    return new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: error.code,
      domain: API_KEYS_ERROR_DOMAIN,
      message: error.message,
      fieldViolations: [{ field: 'scope', description: error.message }],
      cause: error,
    });
  if (error instanceof ApiKeyRequestError) {
    const field = FIELD_OF[error.code];
    return new ApiError({
      status: statusOf(error),
      reason: error.code,
      domain: API_KEYS_ERROR_DOMAIN,
      message: error.message,
      ...(field
        ? { fieldViolations: [{ field, description: error.message }] }
        : {}),
      cause: error,
    });
  }
  return error;
}
