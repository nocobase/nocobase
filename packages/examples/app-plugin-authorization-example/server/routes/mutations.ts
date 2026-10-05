import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization';
import { ApiError, apiErrorResponse } from '@nocobase/app-server/router';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import {
  RepositoryError,
  type DatabaseManager,
  type RepositoryPolicy,
} from '@nocobase/db';
import type { MiddlewareHandler } from 'hono';

export function writableRepository(
  database: DatabaseManager,
  collection: string,
  policy: RepositoryPolicy,
  fields: string[],
) {
  const write = policy.update;
  if (!policy.read || !write) return undefined;

  if (write !== true) {
    const writableFields = write.fields;
    if (writableFields === false) return undefined;
    if (
      writableFields !== undefined &&
      !fields.every((field) => writableFields.includes(field))
    )
      return undefined;
  }

  return database
    .repository(collection)
    .withPolicy(policy)
    .narrow({ read: write === true ? true : { scope: write.scope } });
}

export const AUTHORIZATION_EXAMPLE_DOMAIN = 'authorizationExample';

/** Every route of this plugin is listed under one tag in the API document at `/api/swagger/docs`. */
export const AUTHORIZATION_EXAMPLE_TAGS: string[] = ['AuthorizationExample'];

/** The `403` every sales route answers, before and regardless of whether the record exists. */
export const forbiddenResponse: ReturnType<typeof apiErrorResponse> =
  apiErrorResponse(
    403,
    'The caller lacks the sales action (`AUTHORIZATION_DENIED`), or the record is missing, hidden or outside its scope (`FORBIDDEN`).',
  );

/** The `413` the example's 4 KiB body limit answers, for a route that reads a body. */
export const bodyTooLargeResponse: ReturnType<typeof apiErrorResponse> =
  apiErrorResponse(413, 'The request body exceeds 4 KiB (`BODY_TOO_LARGE`).');

/** Not allowed, whether or not the record exists, so the answer reveals nothing about records outside the caller's scope. */
export function forbidden(
  message: string = 'This operation is not allowed.',
): ApiError {
  return new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'FORBIDDEN',
    domain: AUTHORIZATION_EXAMPLE_DOMAIN,
    message,
  });
}

/** The record is visible and the caller may act on it, but its business state forbids the operation. */
export function stateConflictError(
  message: string = 'The record is no longer in a state that allows this operation.',
): ApiError {
  return new ApiError({
    status: 'FAILED_PRECONDITION',
    reason: 'STATE_CONFLICT',
    domain: AUTHORIZATION_EXAMPLE_DOMAIN,
    message,
  });
}

/**
 * Turn the Repository's `RECORD_NOT_FOUND` from a write whose filter repeats the state checked before it into a state
 * conflict: the record changed between the check and the write.
 */
export function stateConflict(error: unknown): never {
  if (error instanceof RepositoryError && error.code === 'RECORD_NOT_FOUND')
    throw stateConflictError('Record changed during the operation.');

  throw error;
}

/** The Repository Policies a granted sales action carries, keyed by Collection. */
export type SalesPolicies = Readonly<Record<string, RepositoryPolicy>>;

export interface SalesActionEnv {
  Variables: AuthorizationEnv['Variables'] & { salesPolicies: SalesPolicies };
}

/**
 * Decide a sales composite action before anything about the request is looked at. Mounted ahead of `validator()`, so a
 * caller without the action gets 403 whatever its input holds and whether or not the record exists; the handler reads
 * the granted Policies from `c.var.salesPolicies`.
 */
export function authorizeSalesAction(
  resourceId: string,
  action: string,
): MiddlewareHandler<SalesActionEnv> {
  return async (c, next) => {
    const decision = await c.var.authz.authorize({
      resource: { type: 'composite', id: resourceId },
      action,
    });
    if (decision.effect === 'deny' || !decision.conditions?.database)
      throw new AuthorizationDeniedError(decision);
    c.set('salesPolicies', decision.conditions.database);
    await next();
  };
}
