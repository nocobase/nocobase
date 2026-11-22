import { signIn } from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createAppTest } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

import { createStandaloneServer } from '../../server/standalone.js';

const admin = {
  username: 'pluginsadmin',
  email: 'pluginsadmin@example.invalid',
  password: 'Plugins-test-only-670!',
};
const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'plugins-test-secret-at-least-32-characters' },
    users: { initialAdmin: admin },
  },
});

test('lists the plugins only to holders of «Plugins · View»', async ({
  testApp,
  request,
}) => {
  expect((await request('/foundation/plugins')).status).toBe(401);
  const root = await signIn(testApp, admin);
  const document = await root.fetch('/swagger');
  expect(document.status).toBe(200);
  const { paths } = await document.json();
  expect(
    Object.keys(paths).some((path) => path.endsWith('/foundation/plugins')),
  ).toBe(true);
  const listed = await root.fetch('/foundation/plugins');
  expect(listed.status).toBe(200);
  const { data } = (await listed.json()) as {
    data: { packageName: string; enabled: boolean }[];
  };
  expect(data).toContainEqual(
    expect.objectContaining({
      packageName: '@nocobase/app-plugin-foundation',
      enabled: true,
    }),
  );

  const member = {
    email: 'pluginsmember@example.invalid',
    password: 'Plugins-member-test-670!',
  };
  const registration = await request('/auth/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...member,
      name: 'Plugins member',
      username: 'pluginsmember',
    }),
  });
  expect(registration.status).toBe(200);
  const session = await signIn(testApp, member);
  const denied = await session.fetch('/foundation/plugins');
  expect(denied.status).toBe(403);

  const authz = testApp.application.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'plugins-viewer',
    grants: [
      {
        resource: { type: 'settings', id: 'foundation.plugins' },
        actions: [{ action: 'read' }],
      },
    ],
  });
  await authz.permissionSets.assign({
    id: 'plugins-viewer-assignment',
    permissionSet: 'plugins-viewer',
    subject: { type: 'user', id: session.user.id },
  });
  expect((await session.fetch('/foundation/plugins')).status).toBe(200);
});
