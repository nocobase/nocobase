import { randomUUID } from 'node:crypto';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';
import { createStandaloneServer } from '../../server/standalone.js';

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main', 'analytics'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: {
      secret: 'test-auth-secret-at-least-32-characters',
      trustedOrigins: ['http://localhost'],
      emailAndPassword: { disableSignUp: false },
    },
  },
});
const key = () => `${Date.now()}.${randomUUID()}`;
const write = (
  name: string,
  method = 'POST',
  operationKey = key(),
): RequestInit => ({
  method,
  headers: {
    'content-type': 'application/json',
    origin: 'http://localhost',
    'Idempotency-Key': operationKey,
  },
  body: JSON.stringify({ name }),
});

test('persists validated projects, replays receipts and gates reads and writes with native access', async ({
  testApp,
  request,
}) => {
  expect((await request('/skillProjects')).status).toBe(401);
  expect((await request('/skillProjects', write('Anonymous'))).status).toBe(
    401,
  );
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const member = {
    email: 'project-member@example.test',
    password: 'test-member-password',
    name: 'Member',
  };
  expect(
    (
      await request('/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost',
        },
        body: JSON.stringify(member),
      })
    ).status,
  ).toBe(200);
  const denied = await signIn(testApp, member);
  expect((await denied.fetch('/skillProjects')).status).toBe(403);
  expect((await denied.fetch('/skillProjects', write('Denied'))).status).toBe(
    403,
  );
  expect((await request('/example')).status).toBe(200);
  expect((await admin.fetch('/skillProjects', write('   '))).status).toBe(400);
  expect(
    (await admin.fetch('/skillProjects', write('a'.repeat(101)))).status,
  ).toBe(400);
  const operation = key();
  const created = await admin.fetch(
    '/skillProjects',
    write(' Alpha ', 'POST', operation),
  );
  expect(created.status).toBe(200);
  const body = (await created.json()) as { data: { id: string; name: string } };
  expect(body.data.name).toBe('Alpha');
  const replay = await admin.fetch(
    '/skillProjects',
    write(' Alpha ', 'POST', operation),
  );
  expect(replay.status).toBe(200);
  expect(replay.headers.get('Idempotency-Replayed')).toBe('true');
  expect(await replay.json()).toEqual(body);
  expect(
    (await admin.fetch('/skillProjects', write('Different', 'POST', operation)))
      .status,
  ).toBe(409);
  expect(await testApp.connection.repository('skillProjects').count()).toBe(1);
  const path = `/skillProjects/${body.data.id}`;
  expect((await denied.fetch(path, write('Denied edit', 'PATCH'))).status).toBe(
    403,
  );
  expect((await admin.fetch(path, write('Beta', 'PATCH'))).status).toBe(200);
  expect(await (await admin.fetch(path)).json()).toMatchObject({
    data: { name: 'Beta' },
  });
  expect(
    await testApp.connection
      .repository('skillProjects')
      .findOne({ filter: { id: body.data.id } }),
  ).toMatchObject({ name: 'Beta' });
  expect(await (await admin.fetch('/skillProjects')).json()).toMatchObject({
    data: [{ id: body.data.id, name: 'Beta' }],
    meta: { total: 1 },
  });
  expect((await admin.fetch(`/skillProjects/${randomUUID()}`)).status).toBe(
    404,
  );
  expect(
    (
      await admin.fetch(
        `/skillProjects/${randomUUID()}`,
        write('Gone', 'PATCH'),
      )
    ).status,
  ).toBe(404);
  const boundary = '项'.repeat(100);
  expect(
    (await admin.fetch(path, write(` ${boundary} `, 'PATCH'))).status,
  ).toBe(200);
  expect(
    (await admin.fetch(path, write('项'.repeat(101), 'PATCH'))).status,
  ).toBe(400);
  expect(await (await admin.fetch(path)).json()).toMatchObject({
    data: { name: boundary },
  });
  for (let index = 0; index < 98; index++) {
    await testApp.connection
      .repository('skillProjects')
      .createOne({ values: { id: randomUUID(), name: `Project ${index}` } });
  }
  for (const total of [99, 100, 101]) {
    if (total > 99)
      await testApp.connection
        .repository('skillProjects')
        .createOne({ values: { id: randomUUID(), name: `Project ${total}` } });
    const response = (await (await admin.fetch('/skillProjects')).json()) as {
      data: { id: string }[];
      meta: { total: number };
    };
    expect(response.meta.total).toBe(total);
    expect(response.data).toHaveLength(Math.min(total, 100));
    const ids = response.data.map((row) => row.id);
    expect(ids).toEqual([...ids].sort());
  }
});
