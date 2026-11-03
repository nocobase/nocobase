import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createTestApp, type TestApp } from '@nocobase/app-testing/server';
import { afterAll, beforeAll, expect, it } from 'vitest';

import { createStandaloneServer } from '../fixtures/app/server/standalone.js';

const PASSWORD = 'correct horse battery staple';

let app: TestApp;

beforeAll(async () => {
  app = await createTestApp({
    createServer: createStandaloneServer,
    config: { accountSwitcher: { mode: 'full' }, demoMode: { enabled: true } },
  });
  const user = await app.application.container
    .resolve(userAdministrationServiceToken)
    .create({
      name: 'Demo Admin',
      username: 'demo_admin',
      email: 'demo_admin@example.com',
      password: PASSWORD,
    });
  const { permissionSets } =
    app.application.container.resolve(authorizationToken);
  const root = (await permissionSets.list()).find(
    (set) => permissionSets.protection(set.key)?.unrestricted,
  );
  await permissionSets.assign({
    permissionSet: root!.key,
    subject: { type: 'user', id: user.id },
  });
});
afterAll(() => app.close());

it('offers no switching in a demo, even configured on, and leaves the rest of the application alone', async () => {
  const admin = await signIn(app, {
    email: 'demo_admin@example.com',
    password: PASSWORD,
  });

  const state = await admin.fetch('/accountSwitcher/state');
  expect(state.status).toBe(404);
  const start = await admin.fetch('/accountSwitcher/switches', {
    method: 'POST',
    headers: { origin: 'http://localhost', 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'anyone' }),
  });
  expect(start.status).toBe(404);

  const session = await admin.fetch('/auth/get-session');
  expect(await session.json()).toMatchObject({
    user: { email: 'demo_admin@example.com' },
  });
  const signOut = await admin.fetch('/auth/sign-out', {
    method: 'POST',
    headers: { origin: 'http://localhost' },
  });
  expect(signOut.status).toBe(200);
});
