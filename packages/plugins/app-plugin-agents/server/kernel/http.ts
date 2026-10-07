/**
 * HTTP helpers for the route modules: the routers' error handler, which renders the services' `ProtocolError` as the
 * standard error body (domain `agents` unless the error names another), and opaque page tokens. Only route code
 * imports this file; services never see a request.
 */
import { AGENTS_ERROR_DOMAIN, ProtocolError } from '@nocobase/agent-protocol';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type { Env, ErrorHandler } from 'hono';
import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';

/** The standard error for a protocol error. */
export function toApiError(error: ProtocolError): ApiError {
  return new ApiError({
    status: error.apiStatus,
    reason: error.code,
    domain: error.domain,
    message: error.message,
    ...(error.details ? { metadata: error.details } : {}),
    httpStatus: error.status as ContentfulStatusCode,
    cause: error,
  });
}

/** Protocol errors as the standard body; the framework renders what it recognizes and rethrows the rest. */
export const errorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(
    error instanceof ProtocolError ? toApiError(error) : error,
    context,
  );

/** A router whose errors go through `errorHandler`. */
export function domainRouter<E extends Env = Env>(): Hono<E> {
  const router = new Hono<E>();
  router.onError(errorHandler);
  return router;
}

/** An error of this plugin's domain. */
export function agentsApiError(
  options: Omit<ConstructorParameters<typeof ApiError>[0], 'domain'>,
): ApiError {
  return new ApiError({ ...options, domain: AGENTS_ERROR_DOMAIN });
}

/** A page token: the position after the last item of a page, opaque to the client. */
export function encodePageToken(position: unknown): string {
  return Buffer.from(JSON.stringify(position), 'utf8').toString('base64url');
}

/** The position a page token holds; 400 `INVALID_PAGE_TOKEN` for a token this API did not give. */
export function decodePageToken<T>(token: string, schema: z.ZodType<T>): T {
  try {
    const parsed = schema.safeParse(
      JSON.parse(Buffer.from(token, 'base64url').toString('utf8')),
    );
    if (parsed.success) return parsed.data;
  } catch {
    // Refused below.
  }
  throw agentsApiError({
    status: 'INVALID_ARGUMENT',
    reason: 'INVALID_PAGE_TOKEN',
    message: 'pageToken is not one this API gave.',
    fieldViolations: [
      { field: 'pageToken', description: 'Not a page token of this list.' },
    ],
  });
}
