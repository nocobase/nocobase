import { randomBytes } from 'node:crypto';
const testPassword = randomBytes(24).toString('base64url');
const nextPassword = randomBytes(24).toString('base64url');
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  assetResource,
  requestResource,
} from '../../server/providers/equipment/resources.js';
import { createStandaloneServer } from '../../server/standalone.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: randomBytes(32).toString('hex') },
  },
});
const json = (value: unknown, method = 'POST') => ({
  method,
  headers: { origin: 'http://localhost', 'content-type': 'application/json' },
  body: JSON.stringify(value),
});
test('saved Member removal revokes its unique business API while an independent role survives and roleless self-service remains', async ({
  testApp,
  app,
}) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const authz = app.container.resolve(authorizationToken);
  const sets = authz.permissionSets;
  // A temporary acceptance configuration in this isolated database only. Initialization still seeds Member empty.
  await sets.update('member', {
    key: 'member',
    grants: [
      requestResource
        .reference()
        .grant({ view: { requests: 'equipment.myRequests' } }),
    ],
  });
  try {
    await sets.create({
      key: 'equipment-observer',
      title: 'Equipment observer',
      grants: [
        assetResource
          .reference()
          .grant({ view: { assets: 'equipment.catalog' } }),
      ],
    });
    const created = await admin.fetch(
      '/users',
      json({
        name: 'Member role probe',
        username: 'eqroleprobe',
        email: 'eqroleprobe@example.test',
        password: testPassword,
        roleScopes: { app: ['member', 'equipment-observer'] },
      }),
    );
    expect(created.status).toBe(201);
    const user = (await created.json()).data;
    let session = await signIn(testApp, {
      username: 'eqroleprobe',
      password: testPassword,
    });
    expect((await session.fetch('/equipment/requests')).status).toBe(200);
    expect((await session.fetch('/equipment/assets')).status).toBe(200);
    expect(
      (
        await admin.fetch(
          '/users/' + user.id,
          json({ roleScopes: { app: ['equipment-observer'] } }, 'PATCH'),
        )
      ).status,
    ).toBe(200);
    expect((await session.fetch('/equipment/requests')).status).toBe(403);
    expect((await session.fetch('/equipment/assets')).status).toBe(200);
    session = await signIn(testApp, {
      username: 'eqroleprobe',
      password: testPassword,
    });
    expect((await session.fetch('/equipment/requests')).status).toBe(403);
    expect((await session.fetch('/equipment/assets')).status).toBe(200);
    expect(
      (
        await admin.fetch(
          '/users/' + user.id,
          json({ roleScopes: { app: [] } }, 'PATCH'),
        )
      ).status,
    ).toBe(200);
    expect((await session.fetch('/equipment/assets')).status).toBe(403);
    expect((await session.fetch('/users/me/preferences')).status).toBe(200);
    expect(
      (
        await session.fetch(
          '/auth/change-password',
          json({ currentPassword: testPassword, newPassword: nextPassword }),
        )
      ).status,
    ).toBe(200);
    expect((await session.fetch('/auth/sign-out', json({}))).status).toBe(200);
    await signIn(testApp, { username: 'eqroleprobe', password: nextPassword });
  } finally {
    await sets.update('member', { key: 'member', grants: [] });
  }
});
test('page access and business action grants remain independent', async ({
  testApp,
  app,
}) => {
  const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const authz = app.container.resolve(authorizationToken);
  await authz.permissionSets.create({
    key: 'equipment-page-only',
    grants: [
      {
        resource: { type: 'page', id: 'equipment' },
        actions: [{ action: 'access' }],
      },
    ],
  });
  await authz.permissionSets.create({
    key: 'equipment-action-only',
    grants: [
      assetResource
        .reference()
        .grant({ view: { assets: 'equipment.catalog' } }),
    ],
  });
  for (const [key, expected, hasPage] of [
    ['equipment-page-only', 403, true],
    ['equipment-action-only', 200, false],
  ] as const) {
    const username = key.replaceAll('-', '').slice(0, 29);
    const response = await root.fetch(
      '/users',
      json({
        name: key,
        username,
        email: username + '@example.test',
        password: testPassword,
        roleScopes: { app: [key] },
      }),
    );
    expect(response.status).toBe(201);
    const user = (await response.json()).data;
    const session = await signIn(testApp, { username, password: testPassword });
    expect((await session.fetch('/equipment/assets')).status).toBe(expected);
    expect(
      await authz
        .for({ principal: { type: 'user', id: user.id } })
        .can({ resource: { type: 'page', id: 'equipment' }, action: 'access' }),
    ).toBe(hasPage);
  }
});
