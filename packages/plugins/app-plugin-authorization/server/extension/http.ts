import { Hono, type MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ApiError, apiErrorHandler } from '@nocobase/app-server/router';
import type {
  AuthorizationContext,
  AuthorizationRouteHandler,
} from '@nocobase/authorization/core';
import {
  PermissionSetConflictError,
  PermissionSetLastAssignmentError,
  PermissionSetNotFoundError,
  PermissionSetProtectedError,
  PermissionSetSubjectNotAllowedError,
} from '@nocobase/authorization/permission-sets';

export interface SettingsRouterEnv {
  Bindings: {
    authorization: AuthorizationContext;
  };
}

/** The domain of every error the authorization plugin and its rule plugins report. */
export const AUTHORIZATION_ERROR_DOMAIN = 'authorization';

/**
 * A `TypeError` for administrator input the registered model does not accept, naming the offending request field as
 * a dotted path such as `actions.1.scopeKey`. `toAuthorizationApiError` reports the field as a field violation.
 */
export class AuthorizationInputError extends TypeError {
  readonly field: string;

  constructor(message: string, field: string) {
    super(message);
    this.name = 'AuthorizationInputError';
    this.field = field;
  }
}

/** `409 ALREADY_EXISTS` with reason `RULE_ALREADY_EXISTS`: another rule of this kind already uses `key`. */
export function ruleAlreadyExists(
  key: string,
  cause?: unknown,
  message: string = `A rule with key ${key} already exists.`,
): ApiError {
  return new ApiError({
    status: 'ALREADY_EXISTS',
    reason: 'RULE_ALREADY_EXISTS',
    domain: AUTHORIZATION_ERROR_DOMAIN,
    message,
    metadata: { key },
    ...(cause === undefined ? {} : { cause }),
  });
}

/**
 * Refuse a rule `key` another rule of the same kind already uses, for a create (`current` omitted) or a rename (`key`
 * differs from `current`). A pre-check: a concurrent write can still reach the unique index, which
 * `rethrowRuleConflict` reports the same way.
 */
export async function assertRuleKeyAvailable(
  get: (key: string) => Promise<unknown>,
  key: string,
  current?: string,
): Promise<void> {
  if (key === current) return;
  if ((await get(key)) !== undefined) throw ruleAlreadyExists(key);
}

/**
 * A `.catch` for a rule write: a unique-constraint violation, which the request bodies leave only the rule key (and,
 * for default access, the rule's resource) to cause, answers like the pre-check; anything else is rethrown.
 */
export function rethrowRuleConflict(key: string): (error: unknown) => never {
  return (error) => {
    if (isUniqueConstraintViolation(error))
      throw ruleAlreadyExists(
        key,
        error,
        `Rule ${key} conflicts with an existing rule.`,
      );
    throw error;
  };
}

/**
 * Whether `error`, or an error it wraps, is a unique-constraint violation from any supported dialect. Mirrors the
 * database package's own detection, which it does not export.
 */
function isUniqueConstraintViolation(error: unknown): boolean {
  const visited = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const record = current as Record<string, unknown>;
    const code = record.code;
    const number = record.errno ?? record.number ?? record.errorNum;
    if (
      record.errCode === -6602 ||
      code === '23505' ||
      code === 'ER_DUP_ENTRY' ||
      code === 'SQLITE_CONSTRAINT' ||
      code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      code === 'SQLITE_CONSTRAINT_PRIMARYKEY' ||
      number === 1 ||
      number === 1062 ||
      number === 2601 ||
      number === 2627
    )
      return true;
    current = record.cause ?? record.originalError;
  }
  return false;
}

/** Turns an error a settings router recognizes into the standard API error, or `undefined` for one it does not. */
export type AuthorizationErrorTranslator = (
  error: unknown,
) => ApiError | undefined;

/**
 * The standard API error for a domain error every authorization settings surface can raise, or `undefined` for anything
 * else: the Permission Set errors, and the authorization library's validation errors.
 *
 * The library validates grants, rules, titles and record selections as it stores them and reports a rejected one as a
 * `TypeError`. Inside a settings router that is the administrator's input, so it answers `400 INVALID_ARGUMENT` with
 * reason `INVALID_AUTHORIZATION_INPUT`, and an `AuthorizationInputError` adds the field it names as a field violation.
 */
export function toAuthorizationApiError(error: unknown): ApiError | undefined {
  const known = knownError(error);
  if (!known) return undefined;
  const message = (error as Error).message;
  return new ApiError({
    ...known,
    domain: AUTHORIZATION_ERROR_DOMAIN,
    message,
    ...(error instanceof AuthorizationInputError
      ? { fieldViolations: [{ field: error.field, description: message }] }
      : {}),
    cause: error,
  });
}

function knownError(
  error: unknown,
):
  | Pick<ConstructorParameters<typeof ApiError>[0], 'status' | 'reason'>
  | undefined {
  if (error instanceof PermissionSetNotFoundError)
    return { status: 'NOT_FOUND', reason: 'PERMISSION_SET_NOT_FOUND' };
  if (error instanceof PermissionSetProtectedError)
    return {
      status: 'FAILED_PRECONDITION',
      reason: 'PROTECTED_PERMISSION_SET',
    };
  if (error instanceof PermissionSetSubjectNotAllowedError)
    return {
      status: 'INVALID_ARGUMENT',
      reason: 'PERMISSION_SET_SUBJECT_NOT_ALLOWED',
    };
  if (error instanceof PermissionSetConflictError)
    return { status: 'ALREADY_EXISTS', reason: 'PERMISSION_SET_CONFLICT' };
  if (error instanceof PermissionSetLastAssignmentError)
    return { status: 'FAILED_PRECONDITION', reason: 'LAST_ASSIGNMENT' };
  if (error instanceof TypeError)
    return {
      status: 'INVALID_ARGUMENT',
      reason: 'INVALID_AUTHORIZATION_INPUT',
    };
  return undefined;
}

/**
 * A router for one authorization settings surface. The domain errors `translate` recognizes, then those
 * `toAuthorizationApiError` recognizes, answer in the standard API error body; anything else goes to the framework,
 * which renders what it recognizes, such as a denial or invalid input, and rethrows the rest.
 */
export function createSettingsRouter(
  translate?: AuthorizationErrorTranslator,
): Hono<SettingsRouterEnv> {
  const routes = new Hono<SettingsRouterEnv>();
  routes.onError((error, context) =>
    apiErrorHandler(
      translate?.(error) ?? toAuthorizationApiError(error) ?? error,
      context,
    ),
  );
  return routes;
}

/**
 * `requireSettings` as route middleware. Register it before a route's validators, so a caller without the permission
 * gets `403` whatever the request holds, and learns nothing about what a valid request looks like.
 */
export function settingsAccess(
  id: string,
  action: string,
): MiddlewareHandler<SettingsRouterEnv> {
  return createMiddleware<SettingsRouterEnv>(async (context, next) => {
    await requireSettings(context.env.authorization, id, action);
    await next();
  });
}

/** The one settings check: `settings:<id>` `<action>`, or `AuthorizationDeniedError`. */
export function requireSettings(
  authorization: AuthorizationContext,
  id: string,
  action: string,
): Promise<void> {
  return authorization.require({
    resource: { type: 'settings', id },
    action,
  });
}

/** Adapts a settings router to `authz.routes.add`. */
export function createRouteHandler(
  routes: Hono<SettingsRouterEnv>,
): AuthorizationRouteHandler {
  return (input) =>
    Promise.resolve(
      routes.fetch(atPath(input.request, input.path), {
        authorization: input.authorization,
      }),
    );
}

/** The request as the router sees it: at the dispatcher-relative path. */
function atPath(request: Request, path: string): Request {
  const url = new URL(request.url);
  if (url.pathname === path) return request;
  url.pathname = path;
  return new Request(url, {
    method: request.method,
    headers: request.headers,
    ...(request.body ? { body: request.body, duplex: 'half' } : {}),
  });
}
