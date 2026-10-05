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
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  emptyResponse,
  listResponse,
  type ApiErrorStatus,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { PermissionSetLastAssignmentError } from '@nocobase/authorization/permission-sets';
import { Hono, type MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import {
  UserManagementError,
  UserRoleScopeError,
  userManagementServiceToken,
} from '../tokens.js';
import {
  CreateUserInput,
  DeleteUserQuery,
  ListUsersQuery,
  ManagedUserSchema,
  ReplaceUserRoleScopeInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserManagementOptionsSchema,
  UserParams,
  UserRoleScopeParams,
  UsersPageMeta,
} from './schemas.js';

const tags = ['Users'];

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
    routes.get(
      '/options',
      allowed('read', '*'),
      describeRoute({
        tags,
        summary: 'List the role scopes and roles a user can be assigned',
        operationId: 'usersListUserOptions',
        responses: {
          200: dataResponse(UserManagementOptionsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => context.json({ data: await users.options() }),
    );

    routes.get(
      '/',
      allowed('read', '*'),
      describeRoute({
        tags,
        summary: 'List users',
        operationId: 'usersListUsers',
        description:
          '`q` searches name, username and email. `roleScope` and `role` filter by an assigned role and must be given together.',
        responses: {
          200: listResponse(ManagedUserSchema, UsersPageMeta),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'Only one of `roleScope` and `role` is given, or the role scope does not exist (`INVALID_ROLE_SCOPE_VALUE`, `ROLE_SCOPE_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('query', ListUsersQuery),
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
      describeRoute({
        tags,
        summary: 'Create a user',
        operationId: 'usersCreateUser',
        description:
          'Requires both the `create` and the `assign-role` actions. A role scope marked `requiredOnCreate` must be given in `roleScopes`.',
        responses: {
          201: dataResponse(ManagedUserSchema, 'The created user.'),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The password is too short or too long (`PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`), a role scope does not exist or is missing (`ROLE_SCOPE_NOT_FOUND`, `ROLE_SCOPE_REQUIRED`), a role value is invalid (`INVALID_ROLE_SCOPE_VALUE`), or a protected role cannot be assigned here (`PROTECTED_ROLE_ASSIGNMENT`).',
          ),
          409: apiErrorResponse(
            409,
            'A user with this email or username already exists (`USER_IDENTITY_CONFLICT`).',
          ),
        },
      }),
      apiValidator('json', CreateUserInput),
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
      describeRoute({
        tags,
        summary: 'Update a user',
        operationId: 'usersUpdateUser',
        description:
          'Changes name, username or email. `username: null` removes the username.',
        responses: {
          200: dataResponse(ManagedUserSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
          409: apiErrorResponse(
            409,
            'Another user already has this email or username (`USER_IDENTITY_CONFLICT`).',
          ),
        },
      }),
      apiValidator('param', UserParams),
      apiValidator('json', UpdateUserInput),
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
      describeRoute({
        tags,
        summary: 'Delete a user',
        operationId: 'usersDeleteUser',
        description: 'Requires `confirm=true`.',
        responses: {
          204: emptyResponse('The user was deleted.'),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The application has not configured user deletion (`USER_DELETION_NOT_CONFIGURED`), the caller deletes their own account (`SELF_DELETE_NOT_ALLOWED`), a role scope refuses, or the user is the last assignment of a Permission Set that must stay in use (`LAST_ASSIGNMENT`); all `FAILED_PRECONDITION`.',
          ),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', UserParams),
      apiValidator('query', DeleteUserQuery),
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
      describeRoute({
        tags,
        summary: 'Disable a user',
        operationId: 'usersDisableUser',
        description: 'A disabled user can no longer sign in.',
        responses: {
          200: dataResponse(ManagedUserSchema),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'A role scope refuses, or the user is the last assignment of a Permission Set that must stay in use (`LAST_ASSIGNMENT`); both `FAILED_PRECONDITION`.',
          ),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', UserParams),
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
      describeRoute({
        tags,
        summary: 'Enable a user',
        operationId: 'usersEnableUser',
        responses: {
          200: dataResponse(ManagedUserSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', UserParams),
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
      describeRoute({
        tags,
        summary: "Replace a user's roles in one role scope",
        operationId: 'usersReplaceUserRoleScope',
        description:
          'A `single` scope takes one role; a `multiple` scope takes a list without duplicates, which may be empty for an optional scope.',
        responses: {
          200: dataResponse(ManagedUserSchema),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The value does not fit the scope or names an unknown role (`INVALID_ROLE_SCOPE_VALUE`), or a protected role cannot be assigned or removed here (`PROTECTED_ROLE_ASSIGNMENT`).',
          ),
          404: apiErrorResponse(
            404,
            'The user or the role scope does not exist (`USER_NOT_FOUND`, `ROLE_SCOPE_NOT_FOUND`).',
          ),
        },
      }),
      apiValidator('param', UserRoleScopeParams),
      apiValidator('json', ReplaceUserRoleScopeInput),
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
      describeRoute({
        tags,
        summary: "Reset a user's password",
        operationId: 'usersResetUserPassword',
        responses: {
          204: emptyResponse('The password was replaced.'),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'The password is too short or too long (`PASSWORD_TOO_SHORT`, `PASSWORD_TOO_LONG`).',
          ),
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', UserParams),
      apiValidator('json', ResetUserPasswordInput),
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
      describeRoute({
        tags,
        summary: 'Sign a user out of every session',
        operationId: 'usersRevokeUserSessions',
        responses: {
          204: emptyResponse('Every session of the user was revoked.'),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
        },
      }),
      apiValidator('param', UserParams),
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
