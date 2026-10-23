import { createTestApp } from '@nocobase/app-testing/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { expect, it } from 'vitest';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../helpers/minimal-app.js';

it('runs the published non-AI example through authorized HTTP, visitor entry and repeatable cleanup', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  try {
    const container = app.application.container;
    const users = container.resolve(userManagementServiceToken);
    const authz = container.resolve(authorizationToken);
    await authz.permissionSets.create({
      key: 'demo.manager',
      grants: [
        {
          resource: { type: 'settings', id: 'demoMode.data' },
          actions: [{ action: 'read' }, { action: 'manage' }],
        },
        {
          resource: { type: 'settings', id: 'demoMode.configuration' },
          actions: [{ action: 'read' }, { action: 'configure' }],
        },
      ],
    });
    const admin = await users.create({
      username: 'demo_manager',
      name: 'Demo manager',
      email: 'manager@example.com',
      password: 'Manager123!',
      roleScopes: { app: ['demo.manager'] },
    });
    const signIn = await app.request('/auth/sign-in/email', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'manager@example.com',
        password: 'Manager123!',
      }),
    });
    expect(signIn.status).toBe(200);
    const cookie = signIn.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const headers = {
      cookie,
      origin: 'http://localhost',
      'content-type': 'application/json',
    };
    expect(
      (
        await app.request('/demoMode/data/reset', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: '{}',
        })
      ).status,
    ).toBe(401);
    const generated = await app.request('/demoMode/data/import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ language: 'en-US' }),
    });
    expect(generated.status).toBe(200);
    const demo = container.resolve(demoDataToken);
    await demo.whenIdle();
    expect(await demo.status()).toMatchObject({
      present: true,
      model: { enabled: false },
    });
    const visitor = await app.request('/demoMode/accounts/demo_alex/signIn', {
      method: 'POST',
      headers: { origin: 'http://localhost' },
    });
    expect(visitor.status).toBe(200);
    const visitorHeaders = {
      cookie: visitor.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
      origin: 'http://localhost',
      'content-type': 'application/json',
    };
    const tasks = await app.request('/demoProjects/tasks', {
      headers: visitorHeaders,
    });
    expect(tasks.status).toBe(200);
    expect(await tasks.json()).toMatchObject({
      data: [{ title: 'Review the first issue' }],
    });
    expect(
      (
        await app.request('/demoMode/data/reset', {
          method: 'POST',
          headers: visitorHeaders,
          body: '{}',
        })
      ).status,
    ).toBe(403);
    await demo.reset(String(admin.id), undefined, { wait: true });
    expect(
      await app.connection.query.selectFrom('demotasks').selectAll().execute(),
    ).toHaveLength(2);
    expect(
      (await app.request('/demoProjects/tasks', { headers: visitorHeaders }))
        .status,
    ).toBe(200);
    await demo.clear(String(admin.id));
    expect(
      await app.connection.query.selectFrom('demotasks').selectAll().execute(),
    ).toHaveLength(0);
    await demo.importNow(String(admin.id));
    expect((await demo.status()).accounts).toHaveLength(2);
  } finally {
    await app.close();
  }
});
