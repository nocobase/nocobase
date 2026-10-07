/**
 * HTTP helpers for the route modules: domain errors to `ApiError`, and list bodies. Only route code
 * imports this file; services never see a request.
 */
import {
  ApiError,
  apiErrorHandler,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import type { Env, ErrorHandler } from 'hono';
import { Hono } from 'hono';

import type { Page } from '../../shared/common.js';
import { DomainError } from './errors.js';

/** The error domain of every reason this plugin defines. */
export const PROJECTS_DOMAIN = 'projects';

/** The tag of every operation in the API document. */
export const tags: string[] = ['Projects'];

/**
 * A person (a session or an API key), or an agent's run (its run token, `x-nocobase-run-token`, when the application
 * assembles the agents plugin). The run acts for the person who woke the agent, within the actions the application
 * gives it; only routes listing it accept it.
 */
export const personOrRunSecurity: Record<string, string[]>[] = [
  { cookieAuth: [] },
  { apiKeyAuth: [] },
  { runToken: [] },
];

/** Refusals of a valid request because of how the application is set up. */
const PRECONDITION_CODES: ReadonlySet<string> = new Set([
  'APPROVAL_UNAVAILABLE',
  'FILES_UNAVAILABLE',
  'PLAN_UNAVAILABLE',
]);
const ALREADY_EXISTS_CODES: ReadonlySet<string> = new Set([
  'DEPENDENCY_EXISTS',
  'LABEL_EXISTS',
  'WORKFLOW_EXISTS',
]);
/** A concurrent change won: read again and retry. */
const ABORTED_CODES: ReadonlySet<string> = new Set([
  'REVISION_CONFLICT',
  'UNDO_STALE',
]);

/** `notFound` names a resource in words; its reason names it in UPPER_SNAKE_CASE. */
const NOT_FOUND_REASONS: Readonly<Record<string, string>> = {
  'Approval request': 'APPROVAL_NOT_FOUND',
  'Deleted issue': 'ISSUE_NOT_FOUND',
  File: 'INTAKE_FILE_NOT_FOUND',
  Job: 'INTAKE_JOB_NOT_FOUND',
  Resource: 'PROJECT_RESOURCE_NOT_FOUND',
};

function notFoundReason(resource: string | undefined): string {
  if (!resource) return 'NOT_FOUND';
  return (
    NOT_FOUND_REASONS[resource] ??
    `${resource.trim().replace(/\s+/gu, '_').toUpperCase()}_NOT_FOUND`
  );
}

function statusOf(error: DomainError): ApiErrorStatus {
  switch (error.kind) {
    case 'invalid':
      return PRECONDITION_CODES.has(error.code)
        ? 'FAILED_PRECONDITION'
        : 'INVALID_ARGUMENT';
    case 'unauthorized':
      return 'UNAUTHENTICATED';
    case 'forbidden':
      return 'PERMISSION_DENIED';
    case 'notFound':
      return 'NOT_FOUND';
    case 'conflict':
      if (ALREADY_EXISTS_CODES.has(error.code)) return 'ALREADY_EXISTS';
      // Any other conflict is a state that forbids the request, such as a plan that is no longer open.
      return ABORTED_CODES.has(error.code) ? 'ABORTED' : 'FAILED_PRECONDITION';
  }
}

/** The `ApiError` a domain error answers with: its code as `reason`, its details as `metadata`. */
export function toProjectsApiError(error: DomainError): ApiError {
  return new ApiError({
    status: statusOf(error),
    reason:
      error.kind === 'notFound' ? notFoundReason(error.resource) : error.code,
    domain: error.domain ?? PROJECTS_DOMAIN,
    message: error.message,
    ...(error.details ? { metadata: error.details } : {}),
    cause: error,
  });
}

/**
 * Runs `read` for a resource named by the query or body rather than the URL: one that does not exist is a bad request
 * naming `field`, not a 404.
 */
export async function referencedBy<T>(
  field: string,
  read: () => Promise<T>,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!(error instanceof DomainError) || error.kind !== 'notFound')
      throw error;
    throw new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: notFoundReason(error.resource),
      domain: error.domain ?? PROJECTS_DOMAIN,
      message: error.message,
      fieldViolations: [{ field, description: error.message }],
      cause: error,
    });
  }
}

/** The one error handler of this plugin's routes: domain errors become `ApiError`, the rest is the framework's. */
export const projectsErrorHandler: ErrorHandler = (error, context) =>
  apiErrorHandler(
    error instanceof DomainError ? toProjectsApiError(error) : error,
    context,
  );

/** A router whose errors go through `projectsErrorHandler`. */
export function domainRouter<E extends Env = Env>(): Hono<E> {
  const router = new Hono<E>();
  router.onError(projectsErrorHandler);
  return router;
}

/** A cursor-paged list as the API answers it; `nextPageToken` is absent on the last page. */
export interface CursorListBody<T> {
  readonly data: readonly T[];
  readonly meta: { readonly nextPageToken?: string };
}

export function cursorList<T>(page: Page<T>): CursorListBody<T> {
  return {
    data: page.data,
    meta: page.nextCursor ? { nextPageToken: page.nextCursor } : {},
  };
}

/** A bounded list, answered whole. */
export interface BoundedListBody<T> {
  readonly data: readonly T[];
  readonly meta: { readonly total: number };
}

export function boundedList<T>(data: readonly T[]): BoundedListBody<T> {
  return { data, meta: { total: data.length } };
}
