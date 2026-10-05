import { randomUUID } from 'node:crypto';

import { RepositoryError } from '@nocobase/db';

import type { Context, MiddlewareHandler, NotFoundHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * The error categories an `/api` response may report, with the HTTP status each one maps to. The names and mapping are
 * Google's canonical error codes (AIP-193), so a client branches on a fixed, documented set rather than on whatever
 * each plugin invents. `reason` carries the plugin-specific detail.
 */
export const apiErrorStatusCodes: {
  readonly INVALID_ARGUMENT: 400;
  readonly FAILED_PRECONDITION: 400;
  readonly OUT_OF_RANGE: 400;
  readonly UNAUTHENTICATED: 401;
  readonly PERMISSION_DENIED: 403;
  readonly NOT_FOUND: 404;
  readonly ALREADY_EXISTS: 409;
  readonly ABORTED: 409;
  readonly RESOURCE_EXHAUSTED: 429;
  readonly INTERNAL: 500;
  readonly UNIMPLEMENTED: 501;
  readonly UNAVAILABLE: 503;
  readonly DEADLINE_EXCEEDED: 504;
} = Object.freeze({
  INVALID_ARGUMENT: 400,
  FAILED_PRECONDITION: 400,
  OUT_OF_RANGE: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  ALREADY_EXISTS: 409,
  ABORTED: 409,
  RESOURCE_EXHAUSTED: 429,
  INTERNAL: 500,
  UNIMPLEMENTED: 501,
  UNAVAILABLE: 503,
  DEADLINE_EXCEEDED: 504,
});

export type ApiErrorStatus = keyof typeof apiErrorStatusCodes;

/** The error reasons and domain the framework itself reports. Plugins use their own domain and reasons. */
export const appErrorDomain = 'app';

export interface ApiLocalizedMessage {
  readonly locale: string;
  readonly message: string;
}

/** One invalid field in a request, as AIP-193's `BadRequest.FieldViolation`. */
export interface ApiFieldViolation {
  /** Path to the field, such as `releaseId` or `items[2].name`. */
  readonly field: string;
  readonly description: string;
  readonly reason?: string;
}

export interface ApiErrorOptions {
  readonly status: ApiErrorStatus;
  /** What went wrong, in UPPER_SNAKE_CASE, unique within `domain`. Clients branch on `reason`, never on `message`. */
  readonly reason: string;
  /** Who defined `reason`: the plugin's URL namespace, such as `hub`, or `app` for the framework. */
  readonly domain: string;
  /** Developer-facing English description. Never shown to end users and never relied on by clients. */
  readonly message: string;
  /** User-facing text already translated by the handler. */
  readonly localizedMessage?: ApiLocalizedMessage;
  readonly fieldViolations?: readonly ApiFieldViolation[];
  /** Further machine-readable facts about this occurrence. Values must be JSON-serializable. */
  readonly metadata?: Readonly<Record<string, unknown>>;
  /**
   * The HTTP status to answer with when a protocol requires one the status table does not produce, such as 413 or
   * 415. Leave unset otherwise: the status from `status` is what clients expect.
   */
  readonly httpStatus?: ContentfulStatusCode;
  readonly cause?: unknown;
}

export interface ApiErrorPayload {
  readonly code: number;
  readonly status: ApiErrorStatus;
  readonly reason: string;
  readonly domain: string;
  readonly message: string;
  readonly localizedMessage?: ApiLocalizedMessage;
  readonly fieldViolations?: readonly ApiFieldViolation[];
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly requestId?: string;
}

/** The body of every failed `/api` response. */
export interface ApiErrorBody {
  readonly error: ApiErrorPayload;
}

/**
 * An error a route throws to answer with the standard `/api` error body.
 *
 * ```ts
 * throw new ApiError({ status: 'NOT_FOUND', reason: 'APP_NOT_FOUND', domain: 'hub', message: `App ${id} was not found.` });
 * ```
 */
export class ApiError extends Error {
  /** The HTTP status of the response. */
  public readonly code: ContentfulStatusCode;
  public readonly status: ApiErrorStatus;
  public readonly reason: string;
  public readonly domain: string;
  public readonly localizedMessage: ApiLocalizedMessage | undefined;
  public readonly fieldViolations: readonly ApiFieldViolation[] | undefined;
  public readonly metadata: Readonly<Record<string, unknown>> | undefined;

  public constructor(options: ApiErrorOptions) {
    super(
      options.message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = 'ApiError';
    this.code = options.httpStatus ?? apiErrorStatusCodes[options.status];
    this.status = options.status;
    this.reason = options.reason;
    this.domain = options.domain;
    this.localizedMessage = options.localizedMessage;
    this.fieldViolations = options.fieldViolations;
    this.metadata = options.metadata;
  }

  public toPayload(requestId?: string): ApiErrorPayload {
    return {
      code: this.code,
      status: this.status,
      reason: this.reason,
      domain: this.domain,
      message: this.message,
      ...(this.localizedMessage
        ? { localizedMessage: this.localizedMessage }
        : {}),
      ...(this.fieldViolations?.length
        ? { fieldViolations: this.fieldViolations }
        : {}),
      ...(this.metadata ? { metadata: this.metadata } : {}),
      ...(requestId ? { requestId } : {}),
    };
  }
}

const statusByHttpCode: Readonly<Record<number, ApiErrorStatus>> = {
  400: 'INVALID_ARGUMENT',
  401: 'UNAUTHENTICATED',
  403: 'PERMISSION_DENIED',
  404: 'NOT_FOUND',
  409: 'ABORTED',
  413: 'INVALID_ARGUMENT',
  415: 'INVALID_ARGUMENT',
  429: 'RESOURCE_EXHAUSTED',
  501: 'UNIMPLEMENTED',
  503: 'UNAVAILABLE',
  504: 'DEADLINE_EXCEEDED',
};

/** The canonical status for an HTTP status code, for errors raised as bare HTTP statuses. */
export function apiErrorStatusFromHttp(code: number): ApiErrorStatus {
  return (
    statusByHttpCode[code] ?? (code >= 500 ? 'INTERNAL' : 'FAILED_PRECONDITION')
  );
}

/**
 * The `ApiError` for an error the framework recognizes, or `undefined` for one it does not:
 *
 * - an `ApiError` as it is;
 * - Hono's `HTTPException`, and any error that carries a 4xx `status` the way Hono's `getResponse()` convention does
 *   (such as `AuthorizationDeniedError`), with their status and message, and a string `reason` and `domain` on such an
 *   error kept too;
 * - a `RepositoryError` whose `status` is not `INTERNAL` (a refused write, a missing record, a version conflict), with
 *   that status, its code as `reason`, domain `app`, and its `path` and `details` as `metadata`. One that is the
 *   server's own fault, such as an invalid Policy, is not recognized.
 */
export function recognizeApiError(error: unknown): ApiError | undefined {
  if (error instanceof ApiError) return error;
  if (error instanceof HTTPException) {
    return new ApiError({
      status: apiErrorStatusFromHttp(error.status),
      reason: `HTTP_${error.status}`,
      domain: appErrorDomain,
      message: error.message || `Request failed with status ${error.status}.`,
      httpStatus: error.status,
      cause: error,
    });
  }
  const repositoryError = repositoryApiError(error);
  if (repositoryError) return repositoryError;
  const statusError = readStatusError(error);
  if (statusError) {
    return new ApiError({
      status: apiErrorStatusFromHttp(statusError.status),
      reason: statusError.reason ?? `HTTP_${statusError.status}`,
      domain: statusError.domain ?? appErrorDomain,
      message: statusError.message,
      httpStatus: statusError.status as ContentfulStatusCode,
      cause: error,
    });
  }
  return undefined;
}

/**
 * Convert anything a route threw into an `ApiError`: what `recognizeApiError` recognizes, and anything else as an
 * unexpected failure answered with a 500 that reveals nothing about its cause.
 */
export function toApiError(error: unknown): ApiError {
  return (
    recognizeApiError(error) ??
    new ApiError({
      status: 'INTERNAL',
      reason: 'INTERNAL_ERROR',
      domain: appErrorDomain,
      message: 'Internal server error.',
      cause: error,
    })
  );
}

interface StatusError {
  readonly status: number;
  readonly message: string;
  readonly reason?: string;
  readonly domain?: string;
}

function readStatusError(error: unknown): StatusError | undefined {
  if (!(error instanceof Error) || !('status' in error)) return undefined;
  const { status } = error;
  if (typeof status !== 'number' || status < 400 || status > 499)
    return undefined;
  const fields = error as Error & {
    readonly reason?: unknown;
    readonly domain?: unknown;
  };
  return {
    status,
    message: error.message,
    ...(typeof fields.reason === 'string' ? { reason: fields.reason } : {}),
    ...(typeof fields.domain === 'string' ? { domain: fields.domain } : {}),
  };
}

export function apiErrorBody(
  error: ApiError,
  requestId?: string,
): ApiErrorBody {
  return { error: error.toPayload(requestId) };
}

/**
 * Answer with the standard error body for `error`, carrying the request's id; anything unrecognized is an opaque 500.
 * Framework-internal: plugins answer through `apiErrorHandler`, which rethrows what it does not recognize.
 */
function apiErrorResponse(context: Context, error: unknown): Response {
  const apiError = toApiError(error);
  return context.json(
    apiErrorBody(apiError, getRequestId(context)),
    apiError.code,
  );
}

/**
 * The `onError` for a plugin's router: it answers every error `recognizeApiError` recognizes in the standard body and
 * rethrows the rest, so an enclosing router can still translate it and the application answers an unexpected failure
 * with an opaque 500. A router that translates its own domain errors does that first and then delegates here. Install
 * it even though the application renders the same errors: a router tested on a bare Hono has no `/api` handler.
 */
export function apiErrorHandler(error: unknown, context: Context): Response {
  const known = recognizeApiError(error);
  if (known) return apiErrorResponse(context, known);
  throw error;
}

export const apiNotFoundHandler: NotFoundHandler = (context) =>
  apiErrorResponse(
    context,
    new ApiError({
      status: 'NOT_FOUND',
      reason: 'ROUTE_NOT_FOUND',
      domain: appErrorDomain,
      message: `No API route matches ${context.req.method} ${context.req.path}.`,
    }),
  );

/** One problem a schema reported, as zod and Standard Schema issues are shaped. */
export interface ApiInputIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
  readonly code?: string;
}

/** A schema with zod's `safeParse`, matched by shape so the framework does not depend on a zod version. */
export interface ApiInputSchema<T> {
  safeParse(value: unknown):
    | { readonly success: true; readonly data: T }
    | {
        readonly success: false;
        readonly error: { readonly issues: readonly ApiInputIssue[] };
      };
}

/**
 * Validate request input against a schema, returning the parsed value or throwing a 400 `INVALID_ARGUMENT` that names
 * every invalid field. Use it inside Hono's `validator()` so handlers read only `context.req.valid(...)`.
 *
 * Superseded by `apiValidator(target, schema)`, which answers the same error and also declares the schema in the API
 * document. Routes not yet migrated keep working with this.
 */
export function parseApiInput<T>(schema: ApiInputSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw invalidApiInputError(result.error.issues);
}

/**
 * The 400 `INVALID_ARGUMENT` with reason `INVALID_INPUT` and one field violation per issue that every input validator
 * answers. A path segment may be a key or a Standard Schema `{ key }` segment; a `code` on an issue, as zod sets one,
 * becomes the violation's `reason`.
 */
export function invalidApiInputError(
  issues: readonly ApiInputIssueLike[],
): ApiError {
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_INPUT',
    domain: appErrorDomain,
    message: 'The request contains invalid fields.',
    fieldViolations: issues.map((issue) => {
      const code = (issue as { readonly code?: unknown }).code;
      return {
        field: (issue.path ?? [])
          .map((segment) =>
            typeof segment === 'object' && segment !== null
              ? String(segment.key)
              : String(segment),
          )
          .join('.'),
        description: issue.message,
        ...(typeof code === 'string' && code ? { reason: code } : {}),
      };
    }),
  });
}

/** An issue as zod and Standard Schema report one, whose path segments may be keys or `{ key }` objects. */
export interface ApiInputIssueLike {
  readonly message: string;
  readonly path?:
    readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined;
}

export const requestIdHeader = 'x-request-id';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

const maxRequestIdLength = 255;
const requestIdPattern = /^[\w\-=.]+$/;

/**
 * The id of the current request: an `x-request-id` the caller sent, when it is short and plain enough to log safely,
 * otherwise a new UUID. The first call per request decides it, so the request log and the response always agree.
 */
export function getRequestId(context: Context): string {
  const existing = context.get('requestId') as string | undefined;
  if (existing) return existing;
  const incoming = context.req.header(requestIdHeader);
  const requestId =
    incoming &&
    incoming.length <= maxRequestIdLength &&
    requestIdPattern.test(incoming)
      ? incoming
      : randomUUID();
  context.set('requestId', requestId);
  return requestId;
}

/** Echo the request id in the `x-request-id` response header, so a user reporting a failure can quote it. */
export function requestIdMiddleware(): MiddlewareHandler {
  return createMiddleware(async (context, next): Promise<void> => {
    const requestId = getRequestId(context);
    await next();
    try {
      context.res.headers.set(requestIdHeader, requestId);
    } catch {
      // A response passed through from upstream can carry immutable headers.
      context.res = new Response(context.res.body, context.res);
      context.res.headers.set(requestIdHeader, requestId);
    }
  });
}

/**
 * The standard API error for a Repository error the caller may see, or `undefined` for one that is the server's own
 * fault and must surface as an opaque 500. The error's own `status` decides which, so a code added to the Repository
 * needs nothing here. Any route that lets a Repository error propagate answers this way.
 */
function repositoryApiError(error: unknown): ApiError | undefined {
  if (!(error instanceof RepositoryError) || error.status === 'INTERNAL')
    return undefined;
  const field = error.path?.map(String).join('.');
  return new ApiError({
    status: error.status,
    reason: error.code,
    domain: appErrorDomain,
    message: error.message,
    ...(error.status === 'INVALID_ARGUMENT' && field
      ? {
          fieldViolations: [
            { field, description: error.message, reason: error.code },
          ],
        }
      : {}),
    ...(error.path === undefined && error.details === undefined
      ? {}
      : {
          metadata: {
            ...(error.path === undefined ? {} : { path: error.path }),
            ...(error.details === undefined ? {} : { details: error.details }),
          },
        }),
    cause: error,
  });
}
