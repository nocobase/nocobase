import childManifest from '../../package.json' with { type: 'json' };
import { applyLabRole } from '../../server/providers/lab-access.js';
import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
    },
    users: { initialAdmin: DEFAULT_ADMIN_CREDENTIALS },
  },
});
const json = (
  body: unknown,
  method = 'POST',
  key = `${Date.now()}.${randomUUID()}`,
): RequestInit => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'idempotency-key': key,
  },
  body: JSON.stringify(body),
});
test('child persists its own records/settings, rejects stale writes and protects every API', async ({
  app,
  testApp,
  request,
  connection,
}) => {
  expect((await request('/lab/summary')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS),
    key = `${Date.now()}.${randomUUID()}`,
    input = { name: '隔离测试试剂', detail: '500 ml', location: '独立库房' };
  const first = await admin.fetch('/lab/records', json(input, 'POST', key));
  expect(first.status).toBe(200);
  const row = (await first.json()) as { data: { id: string } };
  expect(
    (await admin.fetch('/lab/records', json(input, 'POST', key))).headers.get(
      'Idempotency-Replayed',
    ),
  ).toBe('true');
  expect(await connection.repository('labRecords').count()).toBe(1);
  const listed = await admin.fetch('/lab/records?search=隔离');
  expect(await listed.json()).toMatchObject({
    data: [{ name: input.name }],
    meta: { total: 1 },
  });
  const settings = { manager: '科研组', location: '楼一', revision: 0 };
  expect(
    (await admin.fetch('/lab/settings', json(settings, 'PUT'))).status,
  ).toBe(200);
  expect(
    (await admin.fetch('/lab/settings', json(settings, 'PUT'))).status,
  ).toBe(409);
  expect(await (await admin.fetch('/lab/summary')).json()).toMatchObject({
    data: {
      template: 'reagents',
      version: childManifest.version,
      platformUrl: '/main/',
      portalUrl: '/main/',
      settings: { manager: '科研组', revision: 1 },
    },
  });
  const credentials = {
    username: 'reader',
    password: 'Test-only-password-123!',
  };
  expect(
    (
      await admin.fetch(
        '/users',
        json({
          ...credentials,
          name: 'Reader',
          email: 'reader@example.test',
          roleScopes: { app: [] },
        }),
      )
    ).status,
  ).toBe(201);
  const reader = await signIn(testApp, credentials);
  expect((await reader.fetch('/lab/records')).status).toBe(403);
  expect(
    (await reader.fetch('/lab/settings', json(settings, 'PUT'))).status,
  ).toBe(403);
  await applyLabRole(app, reader.user.id, 'reader');
  expect((await reader.fetch('/lab/records')).status).toBe(200);
  expect((await reader.fetch('/lab/records', json(input))).status).toBe(403);
  await applyLabRole(app, reader.user.id, 'editor');
  expect((await reader.fetch('/lab/records', json(input))).status).toBe(200);
  await applyLabRole(app, reader.user.id, 'reader');
  expect((await reader.fetch('/lab/records', json(input))).status).toBe(403);
  expect(
    (
      await admin.fetch(`/lab/records/${row.data.id}`, {
        ...json(undefined, 'DELETE'),
      })
    ).status,
  ).toBe(200);
  expect(await connection.repository('labRecords').count()).toBe(1);
});
