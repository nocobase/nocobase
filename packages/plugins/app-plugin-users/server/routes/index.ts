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
  cliRoute,
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
import { z } from 'zod';
import { UserPreferenceError } from '../preferences/service.js';

import {
  UserManagementError,
  UserRoleScopeError,
  userManagementServiceToken,
  userPreferencesServiceToken,
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
  AcceptInvitationInput,
  InvitationParams,
  InvitationTokenInput,
  InviteUsersInput,
  PreferenceInput,
  PreferenceParams,
  PreferencesInput,
  UsersPageMeta,
  AcceptedInvitationSchema,
  InvitationsMeta,
  PublicUserInvitationSchema,
  UserInvitationResultSchema,
  UserInvitationSchema,
  UserPreferenceSchema,
  UserPreferencesSchema,
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
        ...cliRoute({ command: 'user options' }),
        responses: {
          200: dataResponse(UserManagementOptionsSchema),
          ...apiErrorResponses,
        },
      }),
      async (context) => context.json({ data: await users.options() }),
    );
    // Pending and expired invitations only, a bounded list: accepted and revoked ones drop out.
    routes.get(
      '/invitations',
      allowed('invite', '*'),
      describeRoute({
        tags,
        summary: 'List pending and expired invitations',
        operationId: 'usersListInvitations',
        ...cliRoute({
          command: 'user invitation list',
          columns: ['id', 'email', 'status', 'invitedBy.name', 'expiresAt'],
        }),
        description:
          'Accepted and revoked invitations drop out, so the list is bounded and not paged.',
        responses: {
          200: listResponse(UserInvitationSchema, InvitationsMeta),
          ...apiErrorResponses,
        },
      }),
      async (context) => {
        const data = await users.listInvitations();
        return context.json({ data, meta: { total: data.length } });
      },
    );

    routes.post(
      '/invitations',
      allowed('invite', '*'),
      describeRoute({
        tags,
        summary: 'Invite people by email',
        operationId: 'usersInviteUsers',
        ...cliRoute({
          command: 'user invitation create',
          examples: ['user invitation create --emails ann@example.com'],
        }),
        description:
          'Requires the `invite` action, and `assign-role` as well when `roleScopes` is given. An address that already has an account gets nothing and is reported as `existingUser`.',
        responses: {
          201: dataResponse(
            z.array(UserInvitationResultSchema),
            'One result per address.',
          ),
          ...apiErrorResponses,
          400: apiErrorResponse(
            400,
            'An address is invalid (`INVALID_INVITATION`), or a role scope or role value is invalid.',
          ),
        },
      }),
      apiValidator('json', InviteUsersInput),
      async (context) => {
        const { emails, roleScopes } = context.req.valid('json');
        if (roleScopes) await requireUserAction(context, '*', 'assign-role');
        const invitedBy = context.get('authz').identity.principal.id;
        const results = await users.invite({
          emails,
          invitedBy,
          ...(roleScopes ? { roleScopes } : {}),
          origin: new URL(context.req.url).origin,
        });
        logSecurityEvent(securityLogger, context, 'user.invite', invitedBy, {
          invited: results.length,
        });
        return context.json({ data: results }, 201);
      },
    );

    routes.post(
      '/invitations/:invitationId/resend',
      allowed('invite', '*'),
      describeRoute({
        tags,
        summary: 'Send an invitation again',
        operationId: 'usersResendInvitation',
        ...cliRoute({
          command: 'user invitation resend',
          flags: { invitationId: { name: 'invitation' } },
        }),
        responses: {
          200: dataResponse(UserInvitationResultSchema),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
          409: apiErrorResponse(
            409,
            'The invitation is no longer pending (`INVITATION_CLOSED`).',
          ),
        },
      }),
      apiValidator('param', InvitationParams),
      async (context) => {
        const { invitationId } = context.req.valid('param');
        return context.json({
          data: await users.resendInvitation(invitationId, {
            origin: new URL(context.req.url).origin,
          }),
        });
      },
    );

    routes.delete(
      '/invitations/:invitationId',
      allowed('invite', '*'),
      describeRoute({
        tags,
        summary: 'Revoke an invitation',
        operationId: 'usersRevokeInvitation',
        ...cliRoute({
          command: 'user invitation delete',
          flags: { invitationId: { name: 'invitation' } },
          confirm: 'Revoke this invitation? Its link stops working.',
        }),
        responses: {
          204: emptyResponse('The invitation was revoked.'),
          ...apiErrorResponses,
          404: apiErrorResponse(404),
          409: apiErrorResponse(
            409,
            'The invitation is no longer pending (`INVITATION_CLOSED`).',
          ),
        },
      }),
      apiValidator('param', InvitationParams),
      async (context) => {
        await users.revokeInvitation(context.req.valid('param').invitationId);
        return context.body(null, 204);
      },
    );

    routes.get(
      '/',
      allowed('read', '*'),
      describeRoute({
        tags,
        summary: 'List users',
        operationId: 'usersListUsers',
        ...cliRoute({
          command: 'user list',
          flags: { pageSize: { name: 'limit' } },
          columns: ['id', 'name', 'email', 'disabledAt', 'createdAt'],
        }),
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
        ...cliRoute({
          command: 'user create',
          flags: { password: { prompt: true } },
          examples: [
            'user create --name Ann --email ann@example.com --password <password>',
          ],
        }),
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
        ...cliRoute({
          command: 'user update',
          flags: { userId: { name: 'user' } },
        }),
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
        ...cliRoute({
          command: 'user delete',
          flags: {
            userId: { name: 'user' },
            confirm: { description: '`true`, to confirm deleting the user.' },
          },
          examples: ['user delete u-12 --confirm true'],
        }),
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
        ...cliRoute({
          command: 'user disable',
          flags: { userId: { name: 'user' } },
          confirm: 'Disable this user? They are signed out everywhere.',
        }),
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
        ...cliRoute({
          command: 'user enable',
          flags: { userId: { name: 'user' } },
        }),
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
        ...cliRoute({
          command: 'user role-scope set',
          flags: { userId: { name: 'user' } },
        }),
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
        ...cliRoute({
          command: 'user reset-password',
          flags: { userId: { name: 'user' }, password: { prompt: true } },
        }),
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
        ...cliRoute({
          command: 'user revoke-sessions',
          flags: { userId: { name: 'user' } },
          confirm: 'Sign this user out of every session?',
        }),
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

    // Public on purpose: the invitee has no account yet. The token (32 random
    // bytes, stored only as a hash) is the credential and opens one pending,
    // unexpired invitation; it travels in the body so request logs never
    // record it. Mounted before `/users`, so the guard above never runs here.
    const invitations = new Hono();
    invitations.onError((error, context) =>
      apiErrorHandler(
        toInvitationTokenError(error) ?? toUsersApiError(error) ?? error,
        context,
      ),
    );
    const closedInvitation = apiErrorResponse(
      409,
      'The invitation has expired, been accepted or been revoked (`INVITATION_EXPIRED`, `INVITATION_ACCEPTED`, `INVITATION_REVOKED`).',
    );
    invitations.post(
      '/lookup',
      describeRoute({
        tags,
        summary: 'Look up an invitation by its token',
        operationId: 'usersLookupInvitation',
        // The sign-up page's: the invitation link's token is the credential.
        ...cliRoute(false),
        description:
          'Public: the token from the invitation link is the credential. An unknown token is `400` with `INVITATION_NOT_FOUND` on `token`.',
        security: [],
        responses: {
          200: dataResponse(PublicUserInvitationSchema),
          409: closedInvitation,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('json', InvitationTokenInput),
      async (context) =>
        context.json({
          data: await users.lookupInvitation(context.req.valid('json').token),
        }),
    );
    invitations.post(
      '/accept',
      describeRoute({
        tags,
        summary: 'Accept an invitation',
        operationId: 'usersAcceptInvitation',
        // The sign-up page's: accepting creates the account from the invitation link.
        ...cliRoute(false),
        description:
          'Public: the token from the invitation link is the credential. Creates the account with `name` and `password` unless the address already has one, which then signs in with its own password.',
        security: [],
        responses: {
          200: dataResponse(AcceptedInvitationSchema),
          409: closedInvitation,
          500: apiErrorResponse(500),
        },
      }),
      apiValidator('json', AcceptInvitationInput),
      async (context) => {
        const accepted = await users.acceptInvitation(
          context.req.valid('json'),
        );
        securityLogger?.info(
          { event: 'user.invitation.accept', targetUserId: accepted.userId },
          'user.invitation.accept',
        );
        return context.json({
          data: {
            email: accepted.email,
            existingAccount: accepted.existingAccount,
          },
        });
      },
    );

    // The signed-in person's own preferences. No grant is needed: nobody reaches anyone else's. `required()` refuses a
    // scoped API key and a service account's key, so only a sign-in or a person's unscoped key reads or writes them.
    const preferences = new Hono<{
      Variables: { auth: { user: { id: string } } };
    }>();
    preferences.onError((error, context) =>
      apiErrorHandler(toUsersApiError(error) ?? error, context),
    );
    preferences.use('*', authentication.required());
    const preferenceService = () =>
      container.resolve(userPreferencesServiceToken);
    const ownerOf = (context: { get(key: 'auth'): { user: { id: string } } }) =>
      context.get('auth').user.id;
    const preferenceErrors = {
      400: apiErrorResponse(
        400,
        'A key or value is invalid or too large, or there are too many preferences (`INVALID_PREFERENCE_KEY`, `INVALID_PREFERENCE_VALUE`, `TOO_MANY_PREFERENCES`).',
      ),
      401: apiErrorResponse(401),
      500: apiErrorResponse(500),
    };
    preferences.get(
      '/',
      describeRoute({
        tags,
        summary: 'List my preferences',
        operationId: 'usersListMyPreferences',
        ...cliRoute({ command: 'user preference list' }),
        description:
          "The signed-in person's own preferences; a scoped or service-account API key is refused.",
        responses: {
          200: dataResponse(UserPreferencesSchema),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (context) =>
        context.json({
          data: await preferenceService().list(ownerOf(context)),
        }),
    );
    preferences.patch(
      '/',
      describeRoute({
        tags,
        summary: 'Set several of my preferences',
        operationId: 'usersUpdateMyPreferences',
        ...cliRoute({ command: 'user preference update', bodyFile: 'file' }),
        description:
          'Stores each given key in one transaction and answers every preference.',
        responses: {
          200: dataResponse(UserPreferencesSchema),
          ...preferenceErrors,
        },
      }),
      apiValidator('json', PreferencesInput),
      async (context) => {
        await preferenceService().setMany(
          ownerOf(context),
          context.req.valid('json'),
        );
        return context.json({
          data: await preferenceService().list(ownerOf(context)),
        });
      },
    );
    preferences.put(
      '/:key',
      describeRoute({
        tags,
        summary: 'Set one of my preferences',
        operationId: 'usersSetMyPreference',
        ...cliRoute({ command: 'user preference set' }),
        responses: {
          200: dataResponse(UserPreferenceSchema),
          ...preferenceErrors,
        },
      }),
      apiValidator('param', PreferenceParams),
      apiValidator('json', PreferenceInput),
      async (context) => {
        const { key } = context.req.valid('param');
        const { value } = context.req.valid('json');
        await preferenceService().set(ownerOf(context), key, value);
        return context.json({ data: { value } });
      },
    );
    preferences.delete(
      '/:key',
      describeRoute({
        tags,
        summary: 'Remove one of my preferences',
        operationId: 'usersRemoveMyPreference',
        ...cliRoute({ command: 'user preference delete' }),
        responses: {
          204: emptyResponse('The preference was removed.'),
          ...preferenceErrors,
        },
      }),
      apiValidator('param', PreferenceParams),
      async (context) => {
        await preferenceService().remove(
          ownerOf(context),
          context.req.valid('param').key,
        );
        return context.body(null, 204);
      },
    );

    router.route('/users/me/preferences', preferences);
    router.route('/users/invitations', invitations);
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
  if (error instanceof UserPreferenceError)
    return new ApiError({
      status: 'INVALID_ARGUMENT',
      reason: error.code,
      domain: 'users',
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

/** An unknown token names no invitation: the body refers to it, so it is invalid input rather than a missing URL. */
function toInvitationTokenError(error: unknown): ApiError | undefined {
  if (
    !(error instanceof UserManagementError) ||
    error.code !== 'INVITATION_NOT_FOUND'
  )
    return undefined;
  return new ApiError({
    status: 'INVALID_ARGUMENT',
    reason: error.code,
    domain: 'users',
    message: error.message,
    fieldViolations: [{ field: 'token', description: error.message }],
    cause: error,
  });
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
