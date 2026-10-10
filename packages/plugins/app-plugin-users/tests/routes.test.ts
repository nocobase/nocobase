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
  deriveCliCommands,
  findApiDocumentSchemaProblems,
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
  it.each([true, false])(
    'requires account creation permission for manual delivery: %s',
    async (canCreate) => {
      const service = userService();
      const router = await apiRoutes.createRouter(
        createApplication('allowed', service, {
          requireAction: async ({ action }) => {
            if (action === 'create' && !canCreate) throw denied();
          },
        }),
      );
      const response = await router.request(
        '/users/invitations/invitation-1/resend?sendEmail=false&manualDelivery=true',
        { method: 'POST' },
      );
      expect(response.status).toBe(canCreate ? 200 : 403);
      if (canCreate)
        expect(service.resendInvitation).toHaveBeenCalledWith(
          'invitation-1',
          expect.objectContaining({ sendEmail: false, manualDelivery: true }),
        );
      else expect(service.resendInvitation).not.toHaveBeenCalled();
    },
  );

  it.each([
    { canCreateUsers: false, canAssignRoles: true },
    { canCreateUsers: true, canAssignRoles: false },
    { canCreateUsers: false, canAssignRoles: false },
  ])(
    'returns shareable links without global user creation permissions: %j',
    async (permissions) => {
      for (const emailSent of [true, false]) {
        const service = userService();
        const result = {
          email: 'victim@example.test',
          outcome: 'invited' as const,
          invitationId: 'invitation-1',
          emailSent,
          inviteUrl: 'https://example.test/invite/registration-secret',
        };
        vi.mocked(service.invite).mockResolvedValue([result]);
        vi.mocked(service.resendInvitation).mockResolvedValue(result);
        const router = await apiRoutes.createRouter(
          createApplication('allowed', service, {
            requireAction: async ({ action }) => {
              if (
                (action === 'create' && !permissions.canCreateUsers) ||
                (action === 'assign-role' && !permissions.canAssignRoles)
              )
                throw denied();
            },
          }),
        );
        const created = await router.request('/users/invitations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ emails: [result.email] }),
        });
        expect(created.status).toBe(201);
        expect(await created.json()).toEqual({ data: [result] });
        const resent = await router.request(
          '/users/invitations/invitation-1/resend',
          { method: 'POST' },
        );
        expect(resent.status).toBe(200);
        expect(await resent.json()).toEqual({ data: result });
        const copy = await router.request(
          '/users/invitations/invitation-1/resend?sendEmail=false',
          { method: 'POST' },
        );
        expect(copy.status).toBe(200);
        expect(service.resendInvitation).toHaveBeenCalledTimes(2);
      }
    },
  );

  it.each(['anonymous', 'forbidden', 'allowed'] as const)(
    'guards link rotation for %s callers',
    async (mode) => {
      const service = userService();
      const router = await apiRoutes.createRouter(
        createApplication(mode, service),
      );
      const response = await router.request(
        '/users/invitations/invitation-1/resend?sendEmail=false',
        { method: 'POST' },
      );
      expect(response.status).toBe(
        mode === 'anonymous' ? 401 : mode === 'forbidden' ? 403 : 200,
      );
      if (mode === 'allowed') {
        expect(service.resendInvitation).toHaveBeenCalledWith('invitation-1', {
          origin: 'http://localhost',
          sendEmail: false,
        });
        expect(await response.json()).toMatchObject({
          data: {
            inviteUrl: 'https://example.test/invite/new-token',
            emailSent: true,
          },
        });
      } else expect(service.resendInvitation).not.toHaveBeenCalled();
    },
  );

  it('defaults to sending mail and rejects invalid sendEmail options', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );
    expect(
      (
        await router.request('/users/invitations/invitation-1/resend', {
          method: 'POST',
        })
      ).status,
    ).toBe(200);
    expect(service.resendInvitation).toHaveBeenCalledWith('invitation-1', {
      origin: 'http://localhost',
      sendEmail: true,
    });
    expect(
      (
        await router.request(
          '/users/invitations/invitation-1/resend?sendEmail=no',
          { method: 'POST' },
        )
      ).status,
    ).toBe(400);
    expect(service.resendInvitation).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])(
    "never exposes another inviter's credential when emailSent=%s",
    async (emailSent) => {
      const service = userService();
      const invitation = await service.getInvitation('invitation-1');
      if (!invitation) throw new Error('Missing fixture');
      vi.mocked(service.getInvitation).mockResolvedValue({
        ...invitation,
        invitedBy: { id: 'other-admin', name: 'Other admin' },
        roleScopes: { app: ['editor'] },
      });
      vi.mocked(service.resendInvitation).mockResolvedValue({
        email: invitation.email,
        outcome: 'invited',
        invitationId: invitation.id,
        emailSent,
        inviteUrl: 'https://example.test/invite/secret',
      });
      const router = await apiRoutes.createRouter(
        createApplication('allowed', service, {
          requireAction: async ({ action }) => {
            if (action !== 'invite') throw denied();
          },
        }),
      );
      const copy = await router.request(
        '/users/invitations/invitation-1/resend?sendEmail=false',
        { method: 'POST' },
      );
      expect(copy.status).toBe(403);
      expect(service.resendInvitation).not.toHaveBeenCalled();
      const resend = await router.request(
        '/users/invitations/invitation-1/resend',
        { method: 'POST' },
      );
      expect(resend.status).toBe(200);
      expect(await resend.json()).toEqual({
        data: {
          email: invitation.email,
          outcome: 'invited',
          invitationId: invitation.id,
          emailSent,
        },
      });
    },
  );

  it.each(['true', 'false'])(
    'rechecks assign-role before rotating an owned role-bearing invitation (sendEmail=%s)',
    async (sendEmail) => {
      const service = userService();
      const invitation = await service.getInvitation('invitation-1');
      if (!invitation) throw new Error('Missing fixture');
      vi.mocked(service.getInvitation).mockResolvedValue({
        ...invitation,
        roleScopes: { app: ['editor'] },
      });
      const requireAction = vi.fn(async ({ action }: { action: string }) => {
        if (action === 'assign-role') throw denied();
      });
      const router = await apiRoutes.createRouter(
        createApplication('allowed', service, { requireAction }),
      );
      const response = await router.request(
        `/users/invitations/invitation-1/resend?sendEmail=${sendEmail}`,
        { method: 'POST' },
      );
      expect(response.status).toBe(403);
      expect(
        requireAction.mock.calls.map(([request]) => request.action),
      ).toEqual(['invite', 'assign-role']);
      expect(service.resendInvitation).not.toHaveBeenCalled();
    },
  );

  it.each([true, false])(
    'keeps owned plugin invitation credentials behind their domain authorization when emailSent=%s',
    async (emailSent) => {
      const service = userService();
      const invitation = await service.getInvitation('invitation-1');
      if (!invitation) throw new Error('Missing fixture');
      vi.mocked(service.getInvitation).mockResolvedValue({
        ...invitation,
        status: 'expired',
        expiresAt: '2020-01-01T00:00:00.000Z',
        roleScopes: {},
        data: {
          '@nocobase/app-plugin-projects': { projectIds: ['private-project'] },
        },
      });
      vi.mocked(service.resendInvitation).mockResolvedValue({
        email: invitation.email,
        outcome: 'invited',
        invitationId: invitation.id,
        emailSent,
        inviteUrl: 'https://example.test/invite/secret',
      });
      const router = await apiRoutes.createRouter(
        createApplication('allowed', service),
      );
      const copy = await router.request(
        '/users/invitations/invitation-1/resend?sendEmail=false',
        { method: 'POST' },
      );
      expect(copy.status).toBe(403);
      expect(service.resendInvitation).not.toHaveBeenCalled();
      const resend = await router.request(
        '/users/invitations/invitation-1/resend',
        { method: 'POST' },
      );
      expect(resend.status).toBe(200);
      expect(await resend.json()).toEqual({
        data: {
          email: invitation.email,
          outcome: 'invited',
          invitationId: invitation.id,
          emailSent,
        },
      });
    },
  );

  it('takes the acceptance identity only from the session', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, {
        authenticatedUserId: 'invited-user',
      }),
    );
    const input = { token: 'abc', name: 'Nia', password: '' };
    const post = (body: unknown) =>
      router.request('/users/invitations/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect((await post(input)).status).toBe(200);
    expect(service.acceptInvitation).toHaveBeenCalledWith(
      input,
      'invited-user',
    );
    expect(
      (await post({ ...input, authenticatedUserId: 'another-user' })).status,
    ).toBe(400);
    expect(service.acceptInvitation).toHaveBeenCalledTimes(1);
  });

  it('rejects scoped credentials before consuming an invitation', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, {
        authenticatedUserId: 'invited-user',
        scopedSession: true,
      }),
    );
    const response = await router.request('/users/invitations/accept', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'abc', name: 'Nia', password: '' }),
    });
    expect(response.status).toBe(403);
    expect(service.acceptInvitation).not.toHaveBeenCalled();
  });

  it('serves the invitee without a session but guards invitation management', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('anonymous', service),
    );
    const post = (path: string, body: unknown) =>
      router.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

    const lookup = await post('/users/invitations/lookup', {
      token: 'abc',
    });
    const accept = await post('/users/invitations/accept', {
      token: 'abc',
      name: 'Nia',
      password: 'secret-password',
    });
    const invite = await post('/users/invitations', {
      emails: ['new@example.com'],
    });

    expect(lookup.status).toBe(200);
    expect(await accept.json()).toEqual({
      data: { email: 'new@example.com', existingAccount: false },
    });
    expect(service.acceptInvitation).toHaveBeenCalledWith(
      {
        token: 'abc',
        name: 'Nia',
        password: 'secret-password',
      },
      undefined,
    );
    expect(invite.status).toBe(401);
    expect(service.invite).not.toHaveBeenCalled();
  });

  it('requires assign-role before an invitation may carry roles', async () => {
    const service = userService();
    const requireAction = vi.fn(async (request: { action: string }) => {
      if (request.action === 'assign-role') throw denied();
    });
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service, { requireAction }),
    );

    const response = await router.request('/users/invitations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        emails: ['new@example.com'],
        roleScopes: { app: ['editor'] },
      }),
    });

    expect(response.status).toBe(403);
    expect(requireAction.mock.calls.map(([request]) => request.action)).toEqual(
      ['invite', 'assign-role'],
    );
    expect(service.invite).not.toHaveBeenCalled();
  });

  it('lists invitations with a total and answers an unknown token as invalid input', async () => {
    const service = userService();
    vi.mocked(service.lookupInvitation).mockRejectedValue(
      new UserManagementError(
        'INVITATION_NOT_FOUND',
        'This invitation does not exist.',
        404,
      ),
    );
    const router = await apiRoutes.createRouter(
      createApplication('allowed', service),
    );

    const list = await router.request('/users/invitations');
    const lookup = await router.request('/users/invitations/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'unknown' }),
    });

    expect(await list.json()).toEqual({ data: [], meta: { total: 0 } });
    expect(lookup.status).toBe(400);
    expect(await lookup.json()).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVITATION_NOT_FOUND',
        domain: 'users',
        fieldViolations: [{ field: 'token' }],
      },
    });
  });

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

  it('allows public verification requests and reports throttling without exposing proofs', async () => {
    const service = userService();
    const router = await apiRoutes.createRouter(
      createApplication('anonymous', service),
    );
    const request = () =>
      router.request('/users/invitations/verifyEmail', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'shared' }),
      });
    const response = await request();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { emailSent: true } });
    vi.mocked(service.verifyInvitationEmail).mockRejectedValue(
      new UserManagementError(
        'INVITATION_VERIFICATION_RATE_LIMITED',
        'Wait one minute.',
        409,
      ),
    );
    const limited = await request();
    expect(limited.status).toBe(429);
    expect(await limited.json()).toMatchObject({
      error: { reason: 'INVITATION_VERIFICATION_RATE_LIMITED' },
    });
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
    const manifest = deriveCliCommands(document, {
      kind: 'person',
      userId: 'admin-1',
      displayName: 'Admin',
    });
    expect(
      manifest.commands.find(
        (command) => command.id === 'user:invitation:create',
      )?.output.columns,
    ).toEqual(['email', 'outcome', 'invitationId', 'emailSent', 'inviteUrl']);
    const acceptResponses =
      document.paths?.['/api/users/invitations/accept']?.post?.responses;
    expect(Object.keys(acceptResponses ?? {})).toEqual(
      expect.arrayContaining(['200', '400', '401', '403', '409', '500']),
    );
    expect(JSON.stringify(acceptResponses?.['400'])).toContain(
      'INVITATION_SIGN_IN_REQUIRED',
    );
    expect(
      manifest.commands.find(
        (command) => command.id === 'user:invitation:resend',
      )?.parameters,
    ).toContainEqual(
      expect.objectContaining({
        name: 'send-email',
        in: 'query',
        field: 'sendEmail',
        required: false,
      }),
    );
    const operationIds = Object.values(document.paths ?? {}).flatMap((item) =>
      Object.values(item ?? {}).map(
        (operation) => (operation as { operationId?: string }).operationId,
      ),
    );
    expect(operationIds.sort()).toEqual(
      [
        'usersAcceptInvitation',
        'usersVerifyInvitationEmail',
        'usersCreateUser',
        'usersDeleteUser',
        'usersDisableUser',
        'usersEnableUser',
        'usersInviteUsers',
        'usersListInvitations',
        'usersListMyPreferences',
        'usersListUserOptions',
        'usersListUsers',
        'usersLookupInvitation',
        'usersRemoveMyPreference',
        'usersReplaceUserRoleScope',
        'usersResendInvitation',
        'usersResetUserPassword',
        'usersRevokeInvitation',
        'usersRevokeUserSessions',
        'usersSetMyPreference',
        'usersUpdateMyPreferences',
        'usersUpdateUser',
      ].sort(),
    );
    expect(document.paths?.['/api/users/{userId}/disable']?.post?.tags).toEqual(
      ['Users'],
    );
    expect(findApiDocumentSchemaProblems(document)).toEqual([]);
    expect(
      document.paths?.['/api/users/invitations/accept']?.post?.security,
    ).toEqual([]);
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
    readonly authenticatedUserId?: string;
    readonly scopedSession?: boolean;
    readonly logger?: { info: ReturnType<typeof vi.fn> };
  } = {},
): AppPluginApplication {
  const container = new ServiceContainer();
  container.instance(authenticationToken, {
    isScopedSession: () => Promise.resolve(options.scopedSession ?? false),
    optional: () => async (context, next) => {
      context.set(
        'auth',
        options.authenticatedUserId
          ? { user: { id: options.authenticatedUserId } }
          : null,
      );
      await next();
    },
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
    invite: vi.fn(() => Promise.resolve([])),
    listInvitations: vi.fn(() => Promise.resolve([])),
    getInvitation: vi.fn(() =>
      Promise.resolve({
        id: 'invitation-1',
        email: 'new@example.com',
        status: 'pending' as const,
        invitedBy: { id: 'admin-1', name: 'Admin' },
        roleScopes: {},
        data: {},
        summary: [],
        expiresAt: now.toISOString(),
        sentAt: now.toISOString(),
        createdAt: now.toISOString(),
      }),
    ),
    resendInvitation: vi.fn(() =>
      Promise.resolve({
        email: 'new@example.com',
        outcome: 'invited' as const,
        invitationId: 'invitation-1',
        emailSent: true,
        inviteUrl: 'https://example.test/invite/new-token',
      }),
    ),
    revokeInvitation: vi.fn(() => Promise.resolve()),
    verifyInvitationEmail: vi.fn(async () => ({ emailSent: true })),
    lookupInvitation: vi.fn(() =>
      Promise.resolve({
        email: 'new@example.com',
        inviterName: 'Alice',
        summary: [],
        expiresAt: now.toISOString(),
      }),
    ),
    acceptInvitation: vi.fn(() =>
      Promise.resolve({
        email: 'new@example.com',
        userId: 'user-2',
        existingAccount: false,
      }),
    ),
    onInvitationAccepted: vi.fn(() => () => undefined),
  };
}

function denied(): AuthorizationDeniedError {
  return new AuthorizationDeniedError({
    effect: 'deny',
    reasons: [{ code: 'USER_ACCESS_DENIED', message: 'Forbidden' }],
  });
}
