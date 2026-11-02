import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { randomUUID } from 'node:crypto';
const createOperationKey = () => `${Date.now()}.${randomUUID()}`;
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});
const request = (
  input: unknown,
  key = createOperationKey(),
  method = 'POST',
): RequestInit => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'Idempotency-Key': key,
  },
  body: JSON.stringify(input),
});

test('native standard settings recover committed writes and enforce current permissions', async ({
  testApp,
  app,
  connection,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const role = {
    key: 'submission-reader',
    title: 'Submission reader',
    grants: [
      { resource: { type: 'user', id: '*' }, actions: [{ action: 'read' }] },
    ],
  };
  const roleRequest = request(role);
  const firstRole = await admin.fetch(
    '/authorization/permissionSets',
    roleRequest,
  );
  expect(firstRole.status).toBe(201);
  const savedRole = await firstRole.json();
  const replayRole = await admin.fetch(
    '/authorization/permissionSets',
    roleRequest,
  );
  expect(replayRole.status).toBe(201);
  expect(await replayRole.json()).toEqual(savedRole);
  expect(replayRole.headers.get('Idempotency-Replayed')).toBe('true');
  const account = {
    name: 'Synthetic reader',
    username: 'submissionreader',
    email: 'submission-reader@example.test',
    password: 'Submission-test-123!',
    roleScopes: { app: [role.key] },
  };
  const accountRequest = request(account);
  const firstUser = await admin.fetch('/users', accountRequest);
  expect(firstUser.status).toBe(201);
  const savedUser = await firstUser.json();
  const replayUser = await admin.fetch('/users', accountRequest);
  expect(replayUser.status).toBe(201);
  expect(await replayUser.json()).toEqual(savedUser);
  expect(replayUser.headers.get('Idempotency-Replayed')).toBe('true');
  expect(
    await connection
      .repository('user')
      .count({ filter: { username: account.username } }),
  ).toBe(1);
  const reader = await signIn(testApp, {
    username: account.username,
    password: account.password,
  });
  expect((await reader.fetch('/users')).status).toBe(200);
  expect(
    (
      await reader.fetch(
        '/users',
        request({
          ...account,
          username: 'denied',
          email: 'denied@example.test',
        }),
      )
    ).status,
  ).toBe(403);
  const updateRequest = request(
    {
      title: 'Renamed reader',
      grants: role.grants,
      expectedRevision: savedRole.data.revision,
    },
    createOperationKey(),
    'PATCH',
  );
  const firstUpdate = await admin.fetch(
    `/authorization/permissionSets/${role.key}`,
    updateRequest,
  );
  expect(firstUpdate.status).toBe(200);
  const updateResult = await firstUpdate.json();
  const replayUpdate = await admin.fetch(
    `/authorization/permissionSets/${role.key}`,
    updateRequest,
  );
  expect(replayUpdate.status).toBe(200);
  expect(await replayUpdate.json()).toEqual(updateResult);
  const userUpdate = request(
    { name: 'Updated synthetic reader', roleScopes: { app: [role.key] } },
    createOperationKey(),
    'PATCH',
  );
  const firstEdit = await admin.fetch(
    `/users/${savedUser.data.id}`,
    userUpdate,
  );
  expect(firstEdit.status).toBe(200);
  const replayEdit = await admin.fetch(
    `/users/${savedUser.data.id}`,
    userUpdate,
  );
  expect(replayEdit.status).toBe(200);
  expect(await replayEdit.json()).toEqual(await firstEdit.json());
  const missingKey = request({
    ...account,
    username: 'missing-key',
    email: 'missing-key@example.test',
  });
  delete (missingKey.headers as Record<string, string>)['Idempotency-Key'];
  expect((await admin.fetch('/users', missingKey)).status).toBe(400);
  // A settings editor loses its grant after committing: possession of the old operation key cannot restore it.
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'submission-editor',
    grants: [
      {
        resource: { type: 'settings', id: 'authorization.permission-sets' },
        actions: [{ action: 'read' }, { action: 'create' }],
      },
    ],
  });
  await authz.permissionSets.replaceSubjectAssignments({
    subject: { type: 'user', id: savedUser.data.id },
    managedPermissionSets: ['submission-editor'],
    permissionSets: ['submission-editor'],
  });
  const editorRequest = request({ key: 'created-by-editor', grants: [] });
  expect(
    (await reader.fetch('/authorization/permissionSets', editorRequest)).status,
  ).toBe(201);
  await authz.permissionSets.replaceSubjectAssignments({
    subject: { type: 'user', id: savedUser.data.id },
    managedPermissionSets: ['submission-editor'],
    permissionSets: [],
  });
  expect(
    (await reader.fetch('/authorization/permissionSets', editorRequest)).status,
  ).toBe(403);
  for (const [action, body, expected] of [
    ['resetPassword', { password: 'Changed-test-123!' }, 204],
    ['disable', {}, 200],
    ['enable', {}, 200],
    ['revokeSessions', {}, 204],
  ] as const) {
    const init = request(body);
    const path = `/users/${savedUser.data.id}/${action}`;
    const first = await admin.fetch(path, init);
    expect(first.status).toBe(expected);
    const second = await admin.fetch(path, init);
    expect(second.status).toBe(expected);
    expect(await second.text()).toEqual(await first.text());
    expect(second.headers.get('Idempotency-Replayed')).toBe('true');
  }
  const deleteRole = {
    ...request(null, createOperationKey(), 'DELETE'),
    body: undefined,
  };
  expect(
    (
      await admin.fetch(
        '/authorization/permissionSets/created-by-editor',
        deleteRole,
      )
    ).status,
  ).toBe(204);
  const deletedRoleReplay = await admin.fetch(
    '/authorization/permissionSets/created-by-editor',
    deleteRole,
  );
  expect(deletedRoleReplay.status).toBe(204);
  expect(deletedRoleReplay.headers.get('Idempotency-Replayed')).toBe('true');
});

test('default-access create update and delete replay without repeating preconditions', async ({
  testApp,
  app,
  connection,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  await connection.builder.createCollection('receiptExamples', (c) => {
    c.string('id').primary();
  });
  app.container
    .resolve(authorizationToken)
    .database.collections.add({ name: 'receiptExamples' });
  const rule = {
    key: 'receipt-default',
    resource: { type: 'database.collection', id: 'receiptExamples' },
    actions: [{ action: 'read', selection: { type: 'all' } }],
  };
  for (const [path, init, expected] of [
    ['/authorization/defaultAccess', request(rule), 201],
    [
      '/authorization/defaultAccess/receipt-default',
      request({ actions: [] }, createOperationKey(), 'PATCH'),
      200,
    ],
    [
      '/authorization/defaultAccess/receipt-default',
      { ...request(null, createOperationKey(), 'DELETE'), body: undefined },
      204,
    ],
  ] as const) {
    const first = await admin.fetch(path, init);
    expect(first.status).toBe(expected);
    const replay = await admin.fetch(path, init);
    expect(replay.status).toBe(expected);
    expect(await replay.text()).toEqual(await first.text());
    expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
  }
});
