import { randomBytes } from 'node:crypto';
const testPassword = randomBytes(24).toString('base64url');
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import { createStandaloneServer } from '../../server/standalone.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { assetResource } from '../../server/providers/equipment/resources.js';
import { equipmentManager } from '../../database/seed-data/equipment-roles.js';
const test = createAppTest({
  createServer: createStandaloneServer,
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: randomBytes(32).toString('hex') },
  },
});
const body = (value: unknown, method = 'POST') => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(value),
});
test('each exposed business action can be saved alone without granting its siblings', async ({
  testApp,
  app,
}) => {
  const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const sets = app.container.resolve(authorizationToken).permissionSets;
  await sets.create({ key: 'single-operation', grants: [] });
  expect(
    (
      await root.fetch(
        '/users',
        body({
          name: 'Single operation',
          username: 'singleoperation',
          email: 'singleoperation@example.test',
          password: testPassword,
          roleScopes: { app: ['single-operation'] },
        }),
      )
    ).status,
  ).toBe(201);
  const user = await signIn(testApp, {
    username: 'singleoperation',
    password: testPassword,
  });
  for (const grant of equipmentManager.grants) {
    if (grant.resource.type !== 'composite') continue;
    for (const action of grant.actions) {
      await sets.update('single-operation', {
        key: 'single-operation',
        grants: [{ ...grant, actions: [action] }],
      });
      const response = await user.fetch('/equipment/capabilities');
      expect(response.status).toBe(200);
      const capabilities = (await response.json()).data;
      const key =
        String(grant.resource.id).replace('equipment.', '') +
        '.' +
        action.action;
      if (!(key in capabilities)) continue;
      expect(capabilities[key]).toBe(true);
      expect(
        Object.entries(capabilities)
          .filter(([other]) => other !== key)
          .every(([, allowed]) => allowed === false),
      ).toBe(true);
      await sets.update('single-operation', {
        key: 'single-operation',
        grants: [],
      });
      const revoked = (
        await (await user.fetch('/equipment/capabilities')).json()
      ).data;
      expect(revoked[key]).toBe(false);
    }
  }
});
test('an issue-only role cannot return or transfer equipment, and saved revocation takes effect', async ({
  testApp,
  app,
  request,
}) => {
  const f = await fixture(testApp);
  const sets = app.container.resolve(authorizationToken).permissionSets;
  await sets.create({
    key: 'issue-only',
    grants: [
      assetResource.reference().grant({ issue: { assets: 'allRecords' } }),
    ],
  });
  const created = await f.root.fetch(
    '/users',
    body({
      name: 'Issue operator',
      username: 'issueonly',
      email: 'issueonly@example.test',
      password: testPassword,
      roleScopes: { app: ['issue-only'] },
    }),
  );
  expect(created.status).toBe(201);
  const operatorId = (await created.json()).data.id;
  const session = await signIn(testApp, {
    username: 'issueonly',
    password: testPassword,
  });
  const asset = await f.create('issue-only');
  const endpoint = '/equipment/assets/' + asset.id + '/fire';
  const response = await session.fetch(
    endpoint,
    body({
      transition: 'issue',
      input: { custodianId: operatorId },
      expectVersion: asset.lifecycleVersion,
      requestId: 'issue-only',
    }),
  );
  expect(response.status).toBe(200);
  const issued = (await response.json()).data;
  for (const transition of ['return', 'transferIssued']) {
    expect(
      (
        await session.fetch(
          endpoint,
          body({
            transition,
            input: {},
            expectVersion: issued.lifecycleVersion,
            requestId: transition,
          }),
        )
      ).status,
    ).toBe(403);
  }
  await sets.update('issue-only', { key: 'issue-only', grants: [] });
  const next = await f.create('revoked');
  expect(
    (
      await session.fetch(
        '/equipment/assets/' + next.id + '/fire',
        body({
          transition: 'issue',
          input: {},
          expectVersion: next.lifecycleVersion,
          requestId: 'revoked',
        }),
      )
    ).status,
  ).toBe(403);
  for (const kind of ['requests', 'maintenance', 'stocktakes']) {
    expect(
      (await f.manager.session.fetch('/equipment/' + kind + '/export')).status,
    ).toBe(200);
    expect(
      (await f.employee.session.fetch('/equipment/' + kind + '/export')).status,
    ).toBe(403);
  }
  expect(
    (await f.root.fetch('/users/' + operatorId + '/disable', body({}))).status,
  ).toBe(200);
  expect((await session.fetch('/users/me/preferences')).status).toBe(401);
  expect(
    (
      await request(
        '/auth/sign-in/username',
        body({ username: 'issueonly', password: testPassword }),
      )
    ).status,
  ).toBe(403);
});
async function fixture(testApp: Parameters<typeof signIn>[0]) {
  const root = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const suffix = crypto.randomUUID().slice(0, 8);
  async function createUser(role: string, label: string) {
    const username = 'eq' + label + suffix;
    const response = await root.fetch(
      '/users',
      body({
        name: label,
        username,
        email: username + '@example.test',
        password: testPassword,
        roleScopes: { app: [role] },
      }),
    );
    const result = await response.json();
    expect(response.status).toBe(201);
    return {
      user: result.data,
      session: await signIn(testApp, {
        username,
        password: testPassword,
      }),
    };
  }
  const manager = await createUser('equipment-manager', 'manager');
  const employee = await createUser('equipment-staff', 'employee');
  const other = await createUser('equipment-staff', 'other');
  async function call(
    path: string,
    value?: unknown,
    method = 'POST',
    expected = path === 'assets' && method === 'POST' && value !== undefined
      ? 201
      : 200,
  ) {
    const response = await manager.session.fetch(
      '/equipment/' + path,
      value === undefined ? undefined : body(value, method),
    );
    const result = await response.json();
    expect(response.status).toBe(expected);
    return result.data;
  }
  const category = await call('reference/equipmentCategories', {
    name: 'Category ' + suffix,
    code: 'c' + suffix,
  });
  const department = await call('reference/equipmentDepartments', {
    name: 'Department ' + suffix,
    code: 'd' + suffix,
  });
  const location = await call('reference/equipmentLocations', {
    name: 'Location ' + suffix,
    code: 'l' + suffix,
  });
  const directory = await call('reference');
  expect(directory.users.length).toBeGreaterThan(0);
  expect(
    directory.users.every((row: Record<string, unknown>) =>
      Object.keys(row).every((key) => ['id', 'name'].includes(key)),
    ),
  ).toBe(true);
  const create = async (n: string) =>
    call('assets', {
      assetNumber: suffix + n,
      name: 'Equipment ' + n,
      categoryId: category.id,
      departmentId: department.id,
      locationId: location.id,
      purchaseCost: 900,
    });
  return {
    root,
    manager,
    employee,
    other,
    call,
    category,
    department,
    location,
    create,
    suffix,
  };
}
