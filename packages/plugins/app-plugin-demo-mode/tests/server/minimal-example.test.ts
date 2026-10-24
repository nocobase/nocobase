import { createTestApp } from '@nocobase/app-testing/server';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';
import { demoDataToken } from '../../server/tokens.js';
import { createStandaloneServer } from '../helpers/minimal-app.js';
import { createDemoDataset } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/demo/dataset.js';
import { createDemoBusiness } from '../../skills/nocobase-app-plugin-demo-mode/assets/minimal-demo/server/demo/business.js';

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
    const signInAs = (email: string, password: string) =>
      app.request('/auth/sign-in/email', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
    const signIn = await signInAs('manager@example.com', 'Manager123!');
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
    const demo = container.resolve(demoDataToken);
    const dataset = createDemoDataset(
      createDemoBusiness(container.resolve(databaseManagerToken)),
    );
    const keeper = {
      username: 'demo_keeper',
      name: 'Demo administrator',
      email: 'keeper@example.com',
      password: 'Keeper123!',
    };
    let keeperId: string | undefined;
    let fail: 'clear' | 'generate' | undefined;
    demo.register({
      ...dataset,
      languages: ['en-US', 'zh-CN'],
      async clear(context) {
        await dataset.clear(context);
        if (fail === 'clear') throw new Error('cleanup failed');
      },
      async generate(context) {
        await dataset.generate!(context);
        // The retained account remains available even in a language that does not generate it.
        if (context.language === 'en-US') {
          await context.createPermissionSet({
            key: 'demo.control',
            grants: (await authz.permissionSets.get('demo.manager'))!.grants,
          });
          keeperId = await context.createAccount({
            ...keeper,
            permissionSets: ['demo.control'],
            roleScopes: { app: ['demo.members'] },
          });
        }
        if (fail === 'generate') throw new Error('generation failed');
      },
    });
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
    const keeperSignIn = await signInAs(keeper.email, keeper.password);
    expect(keeperSignIn.status).toBe(200);
    const keeperHeaders = {
      ...headers,
      cookie: keeperSignIn.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; '),
    };
    const retainedId = keeperId;
    const keeperAssignments = () =>
      authz.permissionSets
        .listAssignments()
        .then((assignments) =>
          assignments.filter(
            (assignment) => assignment.subject.id === retainedId,
          ),
        );
    const assignments = await keeperAssignments();
    expect(assignments).toHaveLength(2);
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
    // Clear twice through the retained administrator's real session, independent of the original importer.
    for (let count = 0; count < 2; count++) {
      expect(
        (
          await app.request('/demoMode/data/clear', {
            method: 'POST',
            headers: keeperHeaders,
          })
        ).status,
      ).toBe(200);
      expect(await keeperAssignments()).toEqual(assignments);
    }
    expect((await signInAs(keeper.email, keeper.password)).status).toBe(200);
    expect((await signInAs('alex@example.com', 'DemoAlex123!')).status).toBe(
      403,
    );
    expect(
      await (
        await app.request('/auth/get-session', { headers: visitorHeaders })
      ).json(),
    ).toBeNull();
    expect(
      (await authz.permissionSets.listAssignments('demo.members')).map(
        (assignment) => assignment.subject.id,
      ),
    ).toEqual([retainedId]);
    expect(
      await app.connection.query.selectFrom('demotasks').selectAll().execute(),
    ).toHaveLength(0);
    expect(
      (
        await app.request('/demoMode/data/import', {
          method: 'POST',
          headers: keeperHeaders,
          body: JSON.stringify({ language: 'zh-CN' }),
        })
      ).status,
    ).toBe(200);
    await demo.whenIdle();
    expect(await demo.status()).toMatchObject({
      state: 'ready',
      language: 'zh-CN',
    });
    expect(await keeperAssignments()).toEqual(assignments);
    await demo.reset(String(admin.id), 'en-US', { wait: true });
    expect(keeperId).toBe(retainedId);
    expect(await keeperAssignments()).toEqual(assignments);
    expect((await demo.status()).accounts).toHaveLength(2);
    expect(
      await app.connection.query
        .selectFrom('user')
        .select('id')
        .where('username', '=', keeper.username)
        .execute(),
    ).toEqual([{ id: retainedId }]);
    // A different administrator initiates reset; failure before generation must persist that actor for scheduled retries.
    fail = 'clear';
    await expect(
      demo.reset(retainedId, 'en-US', { wait: true }),
    ).rejects.toThrow('cleanup failed');
    fail = 'generate';
    await expect(
      demo.reset(undefined, 'en-US', { wait: true }),
    ).rejects.toThrow('generation failed');
    expect(
      await app.connection.query.selectFrom('demotasks').selectAll().execute(),
    ).toEqual([]);
    expect(await keeperAssignments()).toEqual(assignments);
    expect((await signInAs(keeper.email, keeper.password)).status).toBe(200);
    fail = undefined;
    expect(
      (
        await app.request('/demoMode/data/import', {
          method: 'POST',
          headers: keeperHeaders,
          body: '{}',
        })
      ).status,
    ).toBe(200);
    await demo.whenIdle();
    expect((await demo.status()).state).toBe('ready');
    expect(keeperId).toBe(retainedId);
  } finally {
    await app.close();
  }
});
