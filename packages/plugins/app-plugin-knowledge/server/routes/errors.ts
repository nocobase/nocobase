/** `KnowledgeError` as the standard error body: the one place the knowledge routes translate their refusals. */
import {
  ApiError,
  apiErrorHandler,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import type { Context } from 'hono';

import { KnowledgeError } from '../errors.js';

/** The error domain of every knowledge route. */
export const KNOWLEDGE_ERROR_DOMAIN = 'knowledge';

/** A 409 of the services is one of three kinds; everything else it refuses is the state's doing. */
const CONFLICTS: Readonly<Record<string, ApiErrorStatus>> = {
  KNOWLEDGE_VERSION_CONFLICT: 'ABORTED',
  KNOWLEDGE_PROPOSAL_STALE: 'ABORTED',
  KNOWLEDGE_SLUG_TAKEN: 'ALREADY_EXISTS',
  KNOWLEDGE_PROPOSAL_PENDING: 'ALREADY_EXISTS',
  KNOWLEDGE_PROPOSAL_LIMIT: 'RESOURCE_EXHAUSTED',
};

/** 400s that are about the state, not the request. */
const PRECONDITIONS = new Set(['FILES_UNAVAILABLE']);

function statusOf(error: KnowledgeError): ApiErrorStatus {
  switch (error.status) {
    case 400:
      return PRECONDITIONS.has(error.code)
        ? 'FAILED_PRECONDITION'
        : 'INVALID_ARGUMENT';
    case 401:
      return 'UNAUTHENTICATED';
    case 403:
      return 'PERMISSION_DENIED';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return CONFLICTS[error.code] ?? 'FAILED_PRECONDITION';
    case 413:
      return 'INVALID_ARGUMENT';
  }
}

export function knowledgeApiError(error: KnowledgeError): ApiError {
  const tooLarge = error.code === 'FILE_TOO_LARGE';
  return new ApiError({
    status: statusOf(error),
    reason: error.code,
    domain: KNOWLEDGE_ERROR_DOMAIN,
    message: error.message,
    ...(error.field
      ? {
          fieldViolations: [{ field: error.field, description: error.message }],
        }
      : {}),
    ...(error.details ? { metadata: error.details } : {}),
    ...(tooLarge ? { httpStatus: 413 } : {}),
    cause: error,
  });
}

export function fileTooLarge(maxBytes: number): ApiError {
  return knowledgeApiError(
    new KnowledgeError(
      413,
      'FILE_TOO_LARGE',
      `A file may have at most ${maxBytes} bytes.`,
      { maxBytes },
    ),
  );
}

export function unsupportedContentType(expected: string): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'UNSUPPORTED_CONTENT_TYPE',
    domain: KNOWLEDGE_ERROR_DOMAIN,
    message: `Send the file as ${expected}.`,
    httpStatus: 415,
  });
}

/** The routers' `onError`: knowledge refusals in the standard body, the rest to the application. */
export function knowledgeErrorHandler(
  error: Error,
  context: Context,
): Response {
  return apiErrorHandler(
    error instanceof KnowledgeError ? knowledgeApiError(error) : error,
    context,
  );
}
