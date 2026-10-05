import { Hono, type MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import {
  ApiError,
  apiErrorHandler,
  inspectApiRoutes,
  type ApiDocsService,
} from '@nocobase/app-server/router';
import type {
  AuthorizationContext,
  AuthorizationRouteHandler,
  AuthorizationRouteRegistry,
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

/** The settings router behind each handler `createRouteHandler` built, so the API document can describe its routes. */
const settingsRouters = new WeakMap<
  AuthorizationRouteHandler,
  Hono<SettingsRouterEnv>
>();

/**
 * Adapts a settings router to `authz.routes.add`. The router declares its routes at their dispatcher-relative paths,
 * which start with the path it is registered under, such as `/sharingRules/options` for `/sharingRules`. A handler
 * built here is registered with the application's API documentation as a forwarded router, so its routes are
 * documented and checked like any other; declare each route with `describeRoute()`.
 */
export function createRouteHandler(
  routes: Hono<SettingsRouterEnv>,
): AuthorizationRouteHandler {
  const handler: AuthorizationRouteHandler = (input) =>
    Promise.resolve(
      routes.fetch(atPath(input.request, input.path), {
        authorization: input.authorization,
      }),
    );
  settingsRouters.set(handler, routes);
  return handler;
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

/** Where the application mounts the dispatcher the settings routes are registered on. */
const AUTHORIZATION_API_PREFIX = '/api/authorization';

const AUTHORIZATION_PLUGIN = '@nocobase/app-plugin-authorization';

/**
 * Registers every handler on `registry` with the application's API documentation, which cannot see past the
 * `/api/authorization` dispatcher on its own: a handler `createRouteHandler` built as a router forwarded to under
 * `/api/authorization`, so its routes are documented and checked like routes mounted on `/api`; any other handler as an
 * undeclared `ALL` route at its registered path, so `findUndeclaredApiRoutes(app)` reports it. A router route outside
 * the path its handler is registered under, which the dispatcher never forwards to, is left out of the document,
 * reported as undeclared, and reported through `onWarning`.
 * Reads the registrations once; returns a function that removes them all.
 */
export function documentAuthorizationRoutes(
  apiDocs: ApiDocsService,
  registry: AuthorizationRouteRegistry,
  onWarning: (message: string) => void = () => undefined,
): () => void {
  const removals: (() => void)[] = [];
  for (const { path, handler } of registry.entries()) {
    const routes = settingsRouters.get(handler);
    const mounted = `${AUTHORIZATION_API_PREFIX}${path}`;
    if (!routes) {
      const reason =
        'Handled by a function createRouteHandler did not build, so the API document cannot describe it. Register a settings router with authz.routes.add(path, createRouteHandler(router)).';
      onWarning(
        `${AUTHORIZATION_PLUGIN}: ${mounted} is handled by a function createRouteHandler did not build, so the API document cannot describe it. Register a settings router with authz.routes.add(path, createRouteHandler(router)).`,
      );
      removals.push(
        apiDocs.addUndeclaredApiRoute({
          owner: AUTHORIZATION_PLUGIN,
          method: 'ALL',
          path: mounted,
          reason,
        }),
      );
      continue;
    }
    // The router as the document tools take it: its routes, without the bindings only a request supplies.
    const router = new Hono().route('/', routes);
    for (const route of inspectApiRoutes(router, AUTHORIZATION_API_PREFIX)) {
      if (route.path !== mounted && !route.path.startsWith(`${mounted}/`))
        onWarning(
          `${AUTHORIZATION_PLUGIN}: ${route.method} ${route.path} is declared by the router registered under ${mounted}, which the dispatcher never forwards it to.`,
        );
    }
    removals.push(
      apiDocs.addApiRouter({
        owner: AUTHORIZATION_PLUGIN,
        prefix: AUTHORIZATION_API_PREFIX,
        // The dispatcher forwards only the registered path and below; a route elsewhere is reported, not documented.
        scope: path,
        router,
      }),
    );
  }
  return () => {
    for (const remove of removals.splice(0)) remove();
  };
}
