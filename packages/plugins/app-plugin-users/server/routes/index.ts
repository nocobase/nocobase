import {
  authenticationToken,
  UserAdministrationError,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  ApiError,
  defineApiRoutes,
  parseApiInput,
  apiErrorHandler,
  type ApiErrorStatus,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { PermissionSetLastAssignmentError } from '@nocobase/authorization/permission-sets';
import { Hono, type MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { validator } from 'hono/validator';

import {
  UserManagementError,
  UserRoleScopeError,
  userManagementServiceToken,
} from '../tokens.js';
import {
  CreateUserInput,
  DeleteUserQuery,
  ListUsersQuery,
  ReplaceUserRoleScopeInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserParams,
  UserRoleScopeParams,
} from './schemas.js';

export const apiRoutes: AppApiRouteContribution<AppPluginApplication> =
  defineApiRoutes(({ container }) => {
    const router = new Hono();
    const routes = new Hono<AuthorizationEnv>();
    const authentication = container.resolve(authenticationToken);
    const authorization = container.resolve(authorizationToken);
    const users = container.resolve(userManagementServiceToken);
    const securityLogger = container.has(loggingToken)
      ? container.resolve(loggingToken).getLogger('security')
      : undefined;

    routes.onError((error, context) =>
      apiErrorHandler(toUsersApiError(error) ?? error, context),
    );

    routes.use('*', authentication.required(), authorization.middleware());

    // Fixed segments are registered before `/:userId`, which would otherwise match them.
    routes.get('/options', async (context) => {
      await requireUserAction(context, '*', 'read');
      return context.json({ data: await users.options() });
    });

    routes.get(
      '/',
      allowed('read', '*'),
      validator('query', (value) => parseApiInput(ListUsersQuery, value)),
      async (context) => {
        const { q, ...filters } = context.req.valid('query');
        const page = await users.list({
          ...filters,
          ...(q === undefined ? {} : { search: q }),
        });
        return context.json({
          data: page.items,
          meta: { page: page.page, pageSize: page.pageSize, total: page.total },
        });
      },
    );

    routes.post(
      '/',
      allowed('create', '*'),
      allowed('assign-role', '*'),
      validator('json', (value) => parseApiInput(CreateUserInput, value)),
      async (context) => {
        const input = context.req.valid('json');
        const user = await users.create(input);
        logSecurityEvent(securityLogger, context, 'user.create', user.id, {
          roleScopes: Object.keys(input.roleScopes ?? {}).sort(),
        });
        return context.json({ data: user }, 201);
      },
    );

    routes.patch(
      '/:userId',
      allowed('update'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      validator('json', (value) => parseApiInput(UpdateUserInput, value)),
      async (context) => {
        const { userId } = context.req.valid('param');
        const user = await users.update(userId, context.req.valid('json'));
        logSecurityEvent(securityLogger, context, 'user.update', userId);
        return context.json({ data: user });
      },
    );

    routes.delete(
      '/:userId',
      allowed('delete'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      validator('query', (value) => parseApiInput(DeleteUserQuery, value)),
      async (context) => {
        const { userId } = context.req.valid('param');
        await users.remove(userId, context.get('authz').identity.principal.id);
        logSecurityEvent(securityLogger, context, 'user.delete', userId);
        return context.body(null, 204);
      },
    );

    routes.post(
      '/:userId/disable',
      allowed('disable'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      async (context) => {
        const { userId } = context.req.valid('param');
        const user = await users.disable(userId);
        logSecurityEvent(securityLogger, context, 'user.disable', userId);
        return context.json({ data: user });
      },
    );

    routes.post(
      '/:userId/enable',
      allowed('enable'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      async (context) => {
        const { userId } = context.req.valid('param');
        const user = await users.enable(userId);
        logSecurityEvent(securityLogger, context, 'user.enable', userId);
        return context.json({ data: user });
      },
    );

    // A role scope is a singleton configuration of the user: exactly one value per `(userId, scope)`, which always
    // exists (unassigned is a value too) and is always written whole. Replacing a singleton is the one case the HTTP
    // API rules keep PUT for; there are no fields to merge, so PATCH would mean the same thing less precisely.
    routes.put(
      '/:userId/roleScopes/:scope',
      allowed('assign-role'),
      validator('param', (value) => parseApiInput(UserRoleScopeParams, value)),
      validator('json', (value) =>
        parseApiInput(ReplaceUserRoleScopeInput, value),
      ),
      async (context) => {
        const { userId, scope } = context.req.valid('param');
        const { value } = context.req.valid('json');
        const user = await users.replaceRoleScope(userId, scope, value);
        logSecurityEvent(securityLogger, context, 'user.role.update', userId, {
          roleScope: scope,
          roles: typeof value === 'string' ? [value] : [...value],
        });
        return context.json({ data: user });
      },
    );

    routes.post(
      '/:userId/resetPassword',
      allowed('reset-password'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      validator('json', (value) =>
        parseApiInput(ResetUserPasswordInput, value),
      ),
      async (context) => {
        const { userId } = context.req.valid('param');
        await users.resetPassword(userId, context.req.valid('json').password);
        logSecurityEvent(
          securityLogger,
          context,
          'user.password.reset',
          userId,
        );
        return context.body(null, 204);
      },
    );

    routes.post(
      '/:userId/revokeSessions',
      allowed('revoke-sessions'),
      validator('param', (value) => parseApiInput(UserParams, value)),
      async (context) => {
        const { userId } = context.req.valid('param');
        await users.revokeSessions(userId);
        logSecurityEvent(
          securityLogger,
          context,
          'user.sessions.revoke',
          userId,
        );
        return context.body(null, 204);
      },
    );

    router.route('/users', routes);
    return router;
  });

/**
 * The standard error for a domain error the user-management API raises, or `undefined` for anything else, which the
 * framework renders when it recognizes it and rethrows otherwise. A defect that surfaces as a `TypeError` therefore
 * reaches the caller as an internal error, never as invalid input.
 */
function toUsersApiError(error: unknown): ApiError | undefined {
  if (
    error instanceof UserManagementError ||
    error instanceof UserRoleScopeError
  )
    return new ApiError({
      status: statusOf(error.status),
      reason: error.code,
      domain: 'users',
      message: error.message,
      cause: error,
    });
  // Disabling or deleting an account can take away the last assignment of a Permission Set the application must keep
  // someone able to use.
  if (error instanceof PermissionSetLastAssignmentError)
    return new ApiError({
      status: 'FAILED_PRECONDITION',
      reason: 'LAST_ASSIGNMENT',
      domain: 'authorization',
      message: error.message,
      cause: error,
    });
  if (error instanceof UserAdministrationError)
    return new ApiError({
      status:
        error.code === 'USER_NOT_FOUND'
          ? 'NOT_FOUND'
          : error.code.endsWith('_CONFLICT')
            ? 'ALREADY_EXISTS'
            : 'INVALID_ARGUMENT',
      reason: error.code,
      domain: 'authentication',
      message: error.message,
      cause: error,
    });
  return undefined;
}

/**
 * `UserManagementError` and `UserRoleScopeError` carry the HTTP-style status a role scope chose. A `409` there means
 * the account's current state forbids the operation, which the standard body reports as `FAILED_PRECONDITION`.
 */
function statusOf(status: 400 | 404 | 409): ApiErrorStatus {
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'FAILED_PRECONDITION';
  return 'INVALID_ARGUMENT';
}

function logSecurityEvent(
  logger:
    | {
        info(
          bindings: Readonly<Record<string, unknown>>,
          message: string,
        ): void;
      }
    | undefined,
  context: {
    get(key: 'authz'): AuthorizationEnv['Variables']['authz'];
  },
  event: string,
  targetUserId: string,
  details: Readonly<Record<string, unknown>> = {},
): void {
  logger?.info(
    {
      event,
      actorId: context.get('authz').identity.principal.id,
      targetUserId,
      ...details,
    },
    event,
  );
}

/**
 * Authorizes `action` on the user the path names, or on every user, before the request's input is validated: a caller
 * without permission learns nothing about what a valid request looks like or which users exist.
 */
function allowed(
  action: string,
  target: '*' | 'path' = 'path',
): MiddlewareHandler<AuthorizationEnv> {
  return createMiddleware<AuthorizationEnv>(async (context, next) => {
    await requireUserAction(
      context,
      target === '*' ? '*' : (context.req.param('userId') ?? ''),
      action,
    );
    await next();
  });
}

async function requireUserAction(
  context: {
    get(key: 'authz'): AuthorizationEnv['Variables']['authz'];
  },
  userId: string,
  action: string,
): Promise<void> {
  await context.get('authz').require({
    resource: { type: 'user', id: userId },
    action,
  });
}

const routes: readonly AppApiRouteContribution<AppPluginApplication>[] = [
  apiRoutes,
];

export default routes;
