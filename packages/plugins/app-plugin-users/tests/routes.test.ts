import {
  authenticationToken,
  type Auth,
  UserAdministrationError,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type Authorization,
} from '@nocobase/app-plugin-authorization';
import { loggingToken } from '@nocobase/app-server/logging';
import {
  findUndeclaredApiRoutes,
  generateApiDocument,
} from '@nocobase/app-server/router';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import { PermissionSetLastAssignmentError } from '@nocobase/authorization/permission-sets';
import { ServiceContainer } from '@nocobase/service-provider';
import { describe, expect, it, vi } from 'vitest';

import { apiRoutes } from '../server/routes/index.js';
import {
  UserManagementError,
  UserRoleScopeError,
  userManagementServiceToken,
  type UserManagementService,
} from '../server/tokens.js';

describe('@nocobase/app-plugin-users API routes', () => {
  it('rejects anonymous requests before calling the service', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('anonymous', service),
    );

    const response = await router.request('/users');

    expect(response.status).toBe(401);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('rejects authenticated users without the requested action', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('forbidden', service),
    );

    const response = await router.request('/users');

    expect(response.status).toBe(403);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('requires create and assign-role before creating an account', async () => {
    const service = userService();
    const requireAction = vi.fn(async (request: { action: string }) => {
      if (request.action === 'assign-role') throw denied();
    });
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, { requireAction }),
    );

    const response = await router.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        roleScopes: { hub: 'hub-viewer' },
      }),
    });

    expect(response.status).toBe(403);
    expect(requireAction.mock.calls.map(([request]) => request.action)).toEqual(
      ['create', 'assign-role'],
    );
    expect(service.create).not.toHaveBeenCalled();
  });

  it('writes a safe structured event after account creation', async () => {
    const service = userService();
    const logger = { info: vi.fn() };
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, { logger }),
    );

    const response = await router.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'do-not-log-this',
        roleScopes: { hub: 'hub-viewer' },
      }),
    });

    expect(response.status).toBe(201);
    expect(logger.info).toHaveBeenCalledWith(
      {
        event: 'user.create',
        actorId: 'admin-1',
        targetUserId: 'user-1',
        roleScopes: ['hub'],
      },
      'user.create',
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain(
      'do-not-log-this',
    );
  });

  it('reports a failure inside the service as a server error, not as invalid input', async () => {
    const service = userService();
    // A defect in a service or a registered role scope commonly surfaces as a
    // TypeError. Answering 400 for it would hide the fault from monitoring and
    // hand the caller an internal message.
    vi.mocked(service.disable).mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'key')"),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users/user-1/disable', {
      method: 'POST',
    });

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.not.toContain('INVALID_INPUT');
  });

  it('returns 409 when an administrator creates a duplicate identity', async () => {
    const service = userService();
    vi.mocked(service.create).mockRejectedValue(
      new UserAdministrationError(
        'USER_EMAIL_CONFLICT',
        'A user with this email already exists',
      ),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        roleScopes: { hub: 'hub-viewer' },
      }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 409,
        status: 'ALREADY_EXISTS',
        reason: 'USER_EMAIL_CONFLICT',
        domain: 'authentication',
        message: 'A user with this email already exists',
      },
    });
  });

  it('answers FAILED_PRECONDITION when disabling would remove the last assignment', async () => {
    const service = userService();
    vi.mocked(service.disable).mockRejectedValue(
      new PermissionSetLastAssignmentError('system-administrator'),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users/user-1/disable', {
      method: 'POST',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'LAST_ASSIGNMENT',
        domain: 'authorization',
        message: expect.stringContaining('system-administrator'),
      },
    });
  });

  it('checks permission before validating input', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('forbidden', service),
    );

    const deleted = await router.request('/users/user-1', {
      method: 'DELETE',
    });
    const created = await router.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ unknown: true }),
    });

    expect(deleted.status).toBe(403);
    expect(created.status).toBe(403);
    expect(service.remove).not.toHaveBeenCalled();
  });

  it('answers a denial with the standard error body', async () => {
    const router = await apiRoutes.createRouter(
      createApplication('forbidden', userService()),
    );

    const response = await router.request('/users');

    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 403,
        status: 'PERMISSION_DENIED',
        reason: 'AUTHORIZATION_DENIED',
        domain: 'authorization',
      },
    });
  });

  it('lists users as data with page-number meta and searches with q', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request(
      '/users?q=ali&page=1&pageSize=20&status=enabled',
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: [{ id: 'user-1' }],
      meta: { page: 1, pageSize: 20, total: 1 },
    });
    expect(service.list).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      status: 'enabled',
      search: 'ali',
    });
  });

  it('rejects an unknown body field and invalid paging before calling the service', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const created = await router.request('/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        role: 'admin',
      }),
    });
    const listed = await router.request('/users?page=0');

    expect(created.status).toBe(400);
    await expect(created.json()).resolves.toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_INPUT',
        domain: 'app',
      },
    });
    expect(listed.status).toBe(400);
    await expect(listed.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_INPUT',
        fieldViolations: [expect.objectContaining({ field: 'page' })],
      },
    });
    expect(service.create).not.toHaveBeenCalled();
    expect(service.list).not.toHaveBeenCalled();
  });

  it('answers 404 for a user the service cannot find', async () => {
    const service = userService();
    vi.mocked(service.enable).mockRejectedValue(
      new UserManagementError('USER_NOT_FOUND', 'Unknown user: user-9', 404),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users/user-9/enable', {
      method: 'POST',
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { status: 'NOT_FOUND', reason: 'USER_NOT_FOUND', domain: 'users' },
    });
  });

  it('reports a role scope refusal as a failed precondition', async () => {
    const service = userService();
    vi.mocked(service.remove).mockRejectedValue(
      new UserRoleScopeError('USER_HAS_APPS', 'The user owns apps.', 409),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users/user-1?confirm=true', {
      method: 'DELETE',
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        status: 'FAILED_PRECONDITION',
        reason: 'USER_HAS_APPS',
        domain: 'users',
      },
    });
  });

  it.each([
    ['DELETE', '/users/user-1?confirm=true', 'delete', 204],
    ['PATCH', '/users/user-1', 'update', 200],
    ['POST', '/users/user-1/disable', 'disable', 200],
    ['POST', '/users/user-1/enable', 'enable', 200],
    ['PUT', '/users/user-1/roleScopes/hub', 'assign-role', 200],
    ['POST', '/users/user-1/resetPassword', 'reset-password', 204],
    ['POST', '/users/user-1/revokeSessions', 'revoke-sessions', 204],
  ] as const)(
    'checks %s %s with user:%s',
    async (method, path, action, status) => {
      const requireAction = vi.fn(() => Promise.resolve());
      const router = await apiRoutes.createRouter(
        createApplication('allowed', userService(), { requireAction }),
      );
      const body = path.endsWith('resetPassword')
        ? { password: 'secret123' }
        : path.includes('roleScopes')
          ? { value: 'hub-viewer' }
          : method === 'PATCH'
            ? { name: 'Updated' }
            : undefined;

      const response = await router.request(path, {
        method,
        ...(body
          ? {
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            }
          : {}),
      });

      expect(response.status).toBe(status);
      expect(requireAction).toHaveBeenCalledWith({
        resource: { type: 'user', id: 'user-1' },
        action,
      });
    },
  );

  it('requires explicit deletion confirmation and records the actor after success', async () => {
    const service = userService();
    const logger = { info: vi.fn() };
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, { logger }),
    );
    for (const query of ['', '?confirm=false', '?confirm=1']) {
      expect(
        (await router.request(`/users/user-1${query}`, { method: 'DELETE' }))
          .status,
      ).toBe(400);
    }
    expect(service.remove).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    const response = await router.request('/users/user-1?confirm=true', {
      method: 'DELETE',
    });
    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe('');
    expect(service.remove).toHaveBeenCalledWith('user-1', 'admin-1');
    expect(logger.info).toHaveBeenCalledWith(
      { event: 'user.delete', actorId: 'admin-1', targetUserId: 'user-1' },
      'user.delete',
    );
  });

  it('allows an optional multi-role scope to be cleared', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const response = await router.request('/users/user-1/roleScopes/teams', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: [] }),
    });

    expect(response.status).toBe(200);
    expect(service.replaceRoleScope).toHaveBeenCalledWith(
      'user-1',
      'teams',
      [],
    );
  });

  it('declares every route in the API document', async () => {
    const router = await apiRoutes.createRouter(
      createApplication('allowed', userService()),
    );

    expect(findUndeclaredApiRoutes(router)).toEqual([]);
    const document = await generateApiDocument(router, {
      info: { title: 'Test', version: '1.0.0' },
    });
    const operationIds = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => (operation as { operationId?: string }).operationId,
      ),
    );
    expect(operationIds.sort()).toEqual(
      [
        'usersCreateUser',
        'usersDeleteUser',
        'usersDisableUser',
        'usersEnableUser',
        'usersListUserOptions',
        'usersListUsers',
        'usersReplaceUserRoleScope',
        'usersResetUserPassword',
        'usersRevokeUserSessions',
        'usersUpdateUser',
      ].sort(),
    );
    expect(document.paths?.['/api/users/{userId}/disable']?.post?.tags).toEqual(
      ['Users'],
    );
  });
});

function createApplication(
  mode: 'anonymous' | 'forbidden' | 'allowed',
  service: UserManagementService,
  options: {
    readonly requireAction?: (request: {
      readonly resource: { readonly type: string; readonly id: string };
      readonly action: string;
    }) => Promise<void>;
    readonly logger?: { info: ReturnType<typeof vi.fn> };
  } = {},
): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    required: () => async (context, next) => {
      if (mode === 'anonymous') {
        return context.json({ code: 'UNAUTHORIZED' }, 401);
      }
      await next();
    },
  } as Auth);
  container.instance(authorizationToken, {
    middleware: () => async (context, next) => {
      context.set('authz', {
        identity: { principal: { type: 'user', id: 'admin-1' } },
        require:
          options.requireAction ??
          (() =>
            mode === 'forbidden'
              ? Promise.reject(denied())
              : Promise.resolve()),
      });
      await next();
    },
  } as unknown as Authorization);
  container.instance(userManagementServiceToken, service);
  if (options.logger) {
    container.instance(loggingToken, {
      getLogger: () => options.logger,
    } as never);
  }
  return {
    appName: 'test',
    publicBasePath: '',
    config: {} as AppPluginApplication['config'],
    paths: {} as AppPluginApplication['paths'],
    router: {} as AppPluginApplication['router'],
    container,
  };
}

function userService(): UserManagementService {
  const now = new Date();
  const user = {
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    emailVerified: false,
    disabledAt: null,
    createdAt: now,
    updatedAt: now,
    roleScopes: { hub: 'hub-viewer' },
  } as const;
  return {
    options: vi.fn(() => Promise.resolve({ roleScopes: [] })),
    list: vi.fn(() =>
      Promise.resolve({ items: [user], total: 1, page: 1, pageSize: 20 }),
    ),
    create: vi.fn(() => Promise.resolve(user)),
    update: vi.fn(() => Promise.resolve(user)),
    disable: vi.fn(() => Promise.resolve({ ...user, disabledAt: now })),
    enable: vi.fn(() => Promise.resolve(user)),
    replaceRoleScope: vi.fn(() => Promise.resolve(user)),
    resetPassword: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    revokeSessions: vi.fn(() => Promise.resolve()),
  };
}

function denied(): AuthorizationDeniedError {
  return new AuthorizationDeniedError({
    effect: 'deny',
    reasons: [{ code: 'USER_ACCESS_DENIED', message: 'Forbidden' }],
  });
}
