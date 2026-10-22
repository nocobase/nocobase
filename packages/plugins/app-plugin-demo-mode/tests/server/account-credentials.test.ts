import { createTestApp } from '@nocobase/app-testing/server';
import { userManagementServiceToken } from '@nocobase/app-plugin-users/server/tokens';
import { databaseManagerToken } from '@nocobase/db';
import { expect, it } from 'vitest';

import { DefaultDemoDataService } from '../../server/data/service.js';
import { DemoModels } from '../../server/data/models.js';
import { createStandaloneServer } from '../helpers/minimal-app.js';

it('applies changed shared passwords across restart while keeping unchanged accounts signed in', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  try {
    const container = app.application.container;
    let password = 'FirstPassword123!';
    const account = () => ({
      username: 'demo_credentials',
      name: 'Visitor',
      role: 'member',
      password,
    });
    const make = () => {
      const demo = new DefaultDemoDataService({
        database: container.resolve(databaseManagerToken),
        enabled: () => true,
        models: new DemoModels(),
        modelBaseUrl: () => 'http://localhost/demo',
        users: () => container.resolve(userManagementServiceToken),
      });
      demo.register({
        id: 'credentials',
        languages: ['en-US'],
        accounts: () => [account()],
        clear: async () => {},
        async generate(context) {
          await context.createAccount({
            ...account(),
            email: 'credentials@example.com',
          });
        },
      });
      return demo;
    };
    const signIn = (value: string) =>
      app.request('/auth/sign-in/email', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'credentials@example.com',
          password: value,
        }),
      });
    const cookieOf = (response: Response) =>
      response.headers
        .getSetCookie()
        .map((value) => value.split(';')[0])
        .join('; ');
    const session = async (cookie: string) =>
      (await app.request('/auth/get-session', { headers: { cookie } })).json();
    await make().importNow('admin');
    const first = await signIn(password);
    expect(first.status).toBe(200);
    const cookie = cookieOf(first);
    const userId = (await session(cookie)).user.id;
    await make().reset('admin', undefined, { wait: true });
    expect(await session(cookie)).toMatchObject({ user: { id: userId } });

    const previous = password;
    password = 'ChangedPassword456!';
    const restarted = make();
    await restarted.initialize();
    await restarted.reset('admin', undefined, { wait: true });
    expect(await session(cookie)).toBeNull();
    expect((await signIn(previous)).status).toBe(401);
    const changed = await signIn(password);
    expect(changed.status).toBe(200);
    expect(await session(cookieOf(changed))).toMatchObject({
      user: { id: userId },
    });
    await restarted.clear('admin');
    await restarted.importNow('admin');
    expect((await signIn(password)).status).toBe(200);

    // Preview accounts have no snapshot; establish it once without trusting current source definitions.
    await app.connection.query
      .updateTable('demoModeAccounts')
      .set({ passwordHash: null })
      .where('userId', '=', userId)
      .execute();
    const legacyCookie = cookieOf(await signIn(password));
    await make().reset('admin', undefined, { wait: true });
    expect(await session(legacyCookie)).toBeNull();
    const migratedCookie = cookieOf(await signIn(password));
    await make().reset('admin', undefined, { wait: true });
    expect(await session(migratedCookie)).toMatchObject({
      user: { id: userId },
    });
  } finally {
    await app.close();
  }
});
