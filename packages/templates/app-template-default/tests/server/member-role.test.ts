import { randomUUID } from 'node:crypto';
const createOperationKey = () => `${Date.now()}.${randomUUID()}`;
// @vitest-environment node
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});
const json = (body: unknown, method = 'POST') => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'Idempotency-Key': createOperationKey(),
  },
  body: JSON.stringify(body),
});

test('saved roles control direct API access while account basics remain usable', async ({
  testApp,
  app,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const sets = app.container.resolve(authorizationToken).permissionSets;
  const grants = [
    { resource: { type: 'user', id: '*' }, actions: [{ action: 'read' }] },
  ];
  await sets.update('member', { key: 'member', grants });
  await sets.create({ key: 'reader', grants });
  const create = async (
    name: string,
    roleScopes?: Record<string, string[]>,
  ) => {
    const response = await admin.fetch(
      '/users',
      json({
        name,
        username: name,
        email: `${name}@example.test`,
        password: 'Member-test-123!',
        ...(roleScopes === undefined ? {} : { roleScopes }),
      }),
    );
    expect(response.status).toBe(201);
    return (await response.json()).data;
  };
  const member = await create('membercase');
  expect(member.roleScopes.app).toEqual(['member']);
  expect((await create('emptycase', { app: [] })).roleScopes.app).toEqual([]);
  expect(
    (await create('replacecase', { app: ['reader'] })).roleScopes.app,
  ).toEqual(['reader']);
  expect(
    (
      await create('appendcase', { app: ['member', 'reader'] })
    ).roleScopes.app.sort(),
  ).toEqual(['member', 'reader']);
  expect((await create('omittedscope', {})).roleScopes.app).toEqual(['member']);
  let session = await signIn(testApp, {
    username: 'membercase',
    password: 'Member-test-123!',
  });
  expect((await session.fetch('/users')).status).toBe(200);
  expect(
    (
      await admin.fetch(
        `/users/${member.id}`,
        json({ roleScopes: { app: [] } }, 'PATCH'),
      )
    ).status,
  ).toBe(200);
  expect((await session.fetch('/users')).status).toBe(403);
  expect(
    (
      await admin.fetch(
        `/users/${member.id}`,
        json({ name: 'Updated member' }, 'PATCH'),
      )
    ).status,
  ).toBe(200);
  expect(
    (await (await admin.fetch(`/users/${member.id}`)).json()).data.roleScopes
      .app,
  ).toEqual([]);
  session = await signIn(testApp, {
    username: 'membercase',
    password: 'Member-test-123!',
  });
  expect((await session.fetch('/users')).status).toBe(403);
  expect((await session.fetch('/users/me/preferences')).status).toBe(200);
  expect(
    (
      await session.fetch(
        `/users/${member.id}`,
        json({ roleScopes: { app: ['root'] } }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await session.fetch(
        `/users/${admin.user.id}`,
        json({ name: 'Forbidden' }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await session.fetch(
        '/auth/change-password',
        json({
          currentPassword: 'Member-test-123!',
          newPassword: 'Changed-test-123!',
        }),
      )
    ).status,
  ).toBe(200);
  expect((await session.fetch('/auth/sign-out', json({}))).status).toBe(200);
  session = await signIn(testApp, {
    username: 'membercase',
    password: 'Changed-test-123!',
  });
  expect((await session.fetch('/users')).status).toBe(403);
  expect(
    (
      await admin.fetch(
        `/users/${member.id}`,
        json({ roleScopes: { app: ['reader'] } }, 'PATCH'),
      )
    ).status,
  ).toBe(200);
  expect((await session.fetch('/users')).status).toBe(200);
  const protectedRole = await admin.fetch(
    `/users/${member.id}`,
    json({ roleScopes: { app: ['root'] } }, 'PATCH'),
  );
  expect(protectedRole.status).toBe(400);
  expect((await protectedRole.json()).error.reason).toBe(
    'PROTECTED_ROLE_ASSIGNMENT',
  );
  await expect(
    sets.assign({
      subject: { type: 'authenticated', id: '*' },
      permissionSet: 'member',
    }),
  ).rejects.toThrow();
});

test('registration and trusted external identity creation receive defaults atomically', async ({
  testApp,
  app,
  connection,
}) => {
  const response = await testApp.request(
    '/auth/sign-up/email',
    json({
      name: 'Signup',
      email: 'signup@example.test',
      password: 'Signup-test-123!',
      roleScopes: { app: ['root'] },
    }),
  );
  expect(response.status).toBe(200);
  const registered = (await response.json()).user;
  const roles = async (id: string) =>
    (
      await connection.query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('permissionSetKey')
        .where('subjectType', '=', 'user')
        .where('subjectId', '=', id)
        .execute()
    ).map((r) => r.permissionSetKey);
  expect(await roles(registered.id)).toEqual(['member']);
  const auth = app.container.resolve(authenticationToken);
  const context = await auth.administrationContext();
  const external = await context.internalAdapter.createUser({
    name: 'External',
    email: 'external@example.test',
    emailVerified: true,
  });
  expect(await roles(external.id)).toEqual(['member']);
  const service = await app.container
    .resolve(userAdministrationServiceToken)
    .createServiceAccount({ name: 'Service verification' });
  expect(await roles(service.id)).toEqual([]);
  const remove = auth.addUserInitializer(async () => {
    throw new Error('Synthetic initialization failure');
  });
  try {
    await expect(
      context.internalAdapter.createUser({
        name: 'Failed',
        email: 'failed@example.test',
        emailVerified: true,
      }),
    ).rejects.toThrow('Synthetic initialization failure');
    expect(
      await connection.query
        .selectFrom('user')
        .select('id')
        .where('email', '=', 'failed@example.test')
        .execute(),
    ).toEqual([]);
  } finally {
    remove();
  }
});

test('invitations preserve explicit empty roles and existing account decisions', async ({
  testApp,
  app,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const users = app.container.resolve(userManagementServiceToken);
  await app.container.resolve(authorizationToken).permissionSets.create({
    key: 'invitation-reader',
    grants: [],
  });
  for (const [name, scopes, expected] of [
    ['invite-default', undefined, ['member']],
    ['invite-empty', { app: [] }, []],
    ['invite-replace', { app: ['invitation-reader'] }, ['invitation-reader']],
  ] as const) {
    const [invitation] = await users.invite({
      emails: [`${name}@example.test`],
      invitedBy: admin.user.id,
      origin: 'http://localhost',
      sendEmail: false,
      ...(scopes ? { roleScopes: scopes } : {}),
    });
    const token = invitation.inviteUrl!.split('/').at(-1)!;
    const accepted = await users.acceptInvitation({
      token,
      name,
      password: 'Invite-test-123!',
    });
    expect((await users.get(accepted.userId)).roleScopes.app).toEqual(expected);
    await expect(
      users.acceptInvitation({ token, name, password: 'Invite-test-123!' }),
    ).rejects.toThrow();
    await users.update(accepted.userId, { roleScopes: { app: [] } });
    const [again] = await users.invite({
      emails: [`${name}@example.test`],
      invitedBy: admin.user.id,
      origin: 'http://localhost',
      sendEmail: false,
    });
    expect(again.outcome).toBe('existingUser');
    expect((await users.get(accepted.userId)).roleScopes.app).toEqual([]);
  }
  const [pending] = await users.invite({
    emails: ['preaccepted@example.test'],
    invitedBy: admin.user.id,
    origin: 'http://localhost',
    sendEmail: false,
  });
  const existing = await users.create({
    name: 'Existing',
    email: 'preaccepted@example.test',
    password: 'Existing-test-123!',
    roleScopes: { app: [] },
  });
  await users.acceptInvitation(
    {
      token: pending.inviteUrl!.split('/').at(-1)!,
      name: 'Existing',
      password: 'Existing-test-123!',
    },
    existing.id,
  );
  expect((await users.get(existing.id)).roleScopes.app).toEqual([]);
  const created = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      users.create({
        name: `Concurrent ${index}`,
        email: `concurrent-${index}@example.test`,
        password: 'Concurrent-test-123!',
        ...(index % 2 ? { roleScopes: { app: [] } } : {}),
      }),
    ),
  );
  expect(created.map((user) => user.roleScopes.app)).toEqual([
    ['member'],
    [],
    ['member'],
    [],
  ]);
});
