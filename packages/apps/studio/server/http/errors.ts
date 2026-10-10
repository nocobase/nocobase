/**
 * The one place Studio's routes turn errors into `ApiError`: Studio's own refusals (`AccessError`, and the agents
 * protocol's errors whose real code is in `details.code`) answer with domain `nb-studio`; errors passed through from a
 * plugin keep that plugin's domain. Everything else goes to `apiErrorHandler`.
 */
import { ProtocolError } from '@nocobase/agent-protocol';
import { toApiKeysApiError } from '@nocobase/app-plugin-api-keys/server';
import { DomainError } from '@nocobase/app-plugin-projects/server/tokens';
import {
  ApiError,
  apiErrorHandler,
  type ApiErrorOptions,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import type { ErrorHandler } from 'hono';

import { AccessError } from '../access/errors.js';

/** The error domain of every reason Studio defines: the application's own. */
export const STUDIO_ERROR_DOMAIN = 'studio';

const PROJECTS_DOMAIN = 'projects';

/** An `ApiError` of Studio's own. */
export function studioError(
  status: ApiErrorStatus,
  reason: string,
  message: string,
  options: Pick<
    ApiErrorOptions,
    'fieldViolations' | 'metadata' | 'httpStatus'
  > = {},
): ApiError {
  return new ApiError({
    status,
    reason,
    domain: STUDIO_ERROR_DOMAIN,
    message,
    ...options,
  });
}

/** Studio's reasons the agents protocol's codes do not say right. */
const STUDIO_REASON_STATUS: Readonly<Record<string, ApiErrorStatus>> = {
  PR_CHANGED: 'ABORTED',
  GITHUB_UNAVAILABLE: 'UNAVAILABLE',
  GITHUB_RATE_LIMITED: 'UNAVAILABLE',
  GIT_INSTALLATION_EXISTS: 'ALREADY_EXISTS',
};

const DOMAIN_KIND_STATUS: Readonly<
  Record<DomainError['kind'], ApiErrorStatus>
> = {
  invalid: 'INVALID_ARGUMENT',
  unauthorized: 'UNAUTHENTICATED',
  forbidden: 'PERMISSION_DENIED',
  notFound: 'NOT_FOUND',
  conflict: 'FAILED_PRECONDITION',
};

function withoutCode(
  details: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!details) return undefined;
  const { code: _code, ...rest } = details;
  return Object.keys(rest).length > 0 ? rest : undefined;
}

function fromProtocol(error: ProtocolError): ApiError {
  const own =
    typeof error.details?.code === 'string' ? error.details.code : null;
  const reason = own ?? error.code;
  // Studio throws the protocol's generic codes with its own code in `details.code`; a plugin passing its reason
  // through names its domain.
  const domain =
    own && error.domain === 'agents' ? STUDIO_ERROR_DOMAIN : error.domain;
  const status: ApiErrorStatus =
    (own ? STUDIO_REASON_STATUS[own] : undefined) ??
    (own && error.code === 'CONFLICT' ? 'FAILED_PRECONDITION' : undefined) ??
    error.apiStatus;
  const metadata = own ? withoutCode(error.details) : error.details;
  return new ApiError({
    status,
    reason,
    domain,
    message: error.message,
    ...(metadata ? { metadata } : {}),
    ...(error.status === 413 ? { httpStatus: 413 } : {}),
    cause: error,
  });
}

/** A concurrent change won: read again and retry. */
const ABORTED_CODES: ReadonlySet<string> = new Set([
  'REVISION_CONFLICT',
  'UNDO_STALE',
]);

function domainStatus(error: DomainError): ApiErrorStatus {
  if (error.kind !== 'conflict') return DOMAIN_KIND_STATUS[error.kind];
  if (ABORTED_CODES.has(error.code)) return 'ABORTED';
  return error.code.endsWith('_EXISTS')
    ? 'ALREADY_EXISTS'
    : 'FAILED_PRECONDITION';
}

function fromDomain(error: DomainError): ApiError {
  const reason =
    error.kind === 'notFound' && error.code === 'NOT_FOUND' && error.resource
      ? `${error.resource.trim().replace(/\W+/gu, '_').toUpperCase()}_NOT_FOUND`
      : error.code;
  return new ApiError({
    status: domainStatus(error),
    reason,
    domain: error.domain ?? PROJECTS_DOMAIN,
    message: error.message,
    ...(error.details ? { metadata: error.details } : {}),
    cause: error,
  });
}

/** `error` as an `ApiError` when it is one Studio's routes know; anything else unchanged. */
export function toStudioApiError(error: unknown): unknown {
  if (error instanceof ApiError) return error;
  if (error instanceof AccessError)
    return new ApiError({
      status: error.apiStatus,
      reason: error.code,
      domain: STUDIO_ERROR_DOMAIN,
      message: error.message,
      ...(error.details ? { metadata: error.details } : {}),
      cause: error,
    });
  // A projects error the agents' commands translated (`translated`) keeps its own domain.
  if (error instanceof ProtocolError)
    return error.cause instanceof DomainError
      ? fromDomain(error.cause)
      : fromProtocol(error);
  if (error instanceof DomainError) return fromDomain(error);
  return toApiKeysApiError(error);
}

/** The `onError` of every Studio router. */
export const studioErrorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(toStudioApiError(error), context);
