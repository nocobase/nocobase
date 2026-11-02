import { KnowledgeError } from '../errors.js';

export interface IndexingFailure {
  readonly retryable: boolean;
  readonly reason: string;
  readonly message: string;
}

// Public gateway codes and driver codes only; never inspect provider messages or response bodies.
const failures = new Map<string, readonly [reason: string, retryable: boolean]>(
  [
    ['auth', ['INDEXING_MODEL_AUTH_FAILED', false]],
    ['quota', ['INDEXING_MODEL_QUOTA_EXCEEDED', false]],
    ['rateLimit', ['INDEXING_MODEL_RATE_LIMITED', true]],
    ['network', ['INDEXING_MODEL_UNAVAILABLE', true]],
    ['config', ['INDEXING_MODEL_CONFIG_INVALID', false]],
    ['contextOverflow', ['INDEXING_MODEL_INPUT_TOO_LONG', false]],
    ['filtered', ['INDEXING_MODEL_INPUT_REJECTED', false]],
    ['badResponse', ['INDEXING_MODEL_RESPONSE_INVALID', false]],
    ['28P01', ['INDEXING_STORAGE_AUTH_FAILED', false]],
    ['28000', ['INDEXING_STORAGE_AUTH_FAILED', false]],
    ['42501', ['INDEXING_STORAGE_PERMISSION_DENIED', false]],
    ['25006', ['INDEXING_STORAGE_PERMISSION_DENIED', false]],
    ['3D000', ['INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false]],
    ['3F000', ['INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false]],
    ['42P01', ['INDEXING_STORAGE_SCHEMA_UNAVAILABLE', false]],
    ['SQLITE_BUSY', ['INDEXING_STORAGE_BUSY', true]],
    ['SQLITE_LOCKED', ['INDEXING_STORAGE_BUSY', true]],
    ['40001', ['INDEXING_STORAGE_BUSY', true]],
    ['40P01', ['INDEXING_STORAGE_BUSY', true]],
    ['57P01', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['08006', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['ETIMEDOUT', ['INDEXING_TIMEOUT', true]],
    ['ECONNRESET', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['ECONNREFUSED', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['ENOTFOUND', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['EHOSTUNREACH', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['ENETUNREACH', ['INDEXING_STORAGE_UNAVAILABLE', true]],
    ['EAI_AGAIN', ['INDEXING_STORAGE_UNAVAILABLE', true]],
  ],
);

export function indexingFailure(error: unknown): IndexingFailure {
  const code =
    error instanceof Error && 'code' in error && typeof error.code === 'string'
      ? error.code
      : null;
  const classified = code === null ? undefined : failures.get(code);
  const timeout =
    error instanceof DOMException &&
    ['TimeoutError', 'AbortError'].includes(error.name);
  return {
    retryable: classified?.[1] ?? timeout,
    reason:
      error instanceof KnowledgeError
        ? error.code
        : (classified?.[0] ??
          (timeout ? 'INDEXING_TIMEOUT' : 'INDEXING_UNAVAILABLE')),
    message: 'Knowledge indexing failed.',
  };
}
