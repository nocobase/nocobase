import { randomBytes } from 'node:crypto';
const testPassword = randomBytes(24).toString('base64url');
import { expect } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  apiDocsToken,
  findUndeclaredApiRoutes,
  findApiDocumentSchemaProblems,
} from '@nocobase/app-server/router';
import { createStandaloneServer } from '../../server/standalone.js';
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
test('equipment issue and return commit once, refuse stale writes, and preserve role boundaries', async ({
  testApp,
  request,
  app,
}) => {
  expect((await request('/equipment/assets')).status).toBe(401);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const call = async (
    path: string,
    value?: unknown,
    method = 'POST',
    status = 200,
  ) => {
    const response = await admin.fetch(
      '/equipment/' + path,
      value === undefined ? undefined : body(value, method),
    );
    const result = await response.json();
    expect(response.status).toBe(status);
    return result.data;
  };
  const category = await call('reference/equipmentCategories', {
    name: 'Computers',
    code: 'computers',
  });
  const department = await call('reference/equipmentDepartments', {
    name: 'Engineering',
    code: 'engineering',
  });
  const location = await call('reference/equipmentLocations', {
    name: 'Main warehouse',
    code: 'main',
  });
  const userResponse = await admin.fetch(
    '/users',
    body({
      name: 'Equipment employee',
      username: 'equipstaff',
      email: 'equipstaff@example.test',
      password: testPassword,
      roleScopes: { app: ['equipment-staff'] },
    }),
  );
  const userBody = await userResponse.json();
  expect(userResponse.status).toBe(201);
  const employee = userBody.data;
  const staff = await signIn(testApp, {
    username: 'equipstaff',
    password: testPassword,
  });
  const blankResponse = await admin.fetch(
    '/users',
    body({
      name: 'No business role',
      username: 'equipblank',
      email: 'equipblank@example.test',
      password: testPassword,
      roleScopes: { app: [] },
    }),
  );
  expect(blankResponse.status).toBe(201);
  const blank = await signIn(testApp, {
    username: 'equipblank',
    password: testPassword,
  });
  expect((await blank.fetch('/equipment/assets')).status).toBe(403);
  const values = {
    assetNumber: 'EQ-TEST-001',
    name: 'Engineering laptop',
    categoryId: category.id,
    departmentId: department.id,
    locationId: location.id,
    purchaseCost: 1200,
  };
  const asset = await call('assets', values);
  expect(asset.status).toBe('idle');
  await call('assets', values, 'POST', 409);
  const publicList = await (await staff.fetch('/equipment/assets')).json();
  expect(publicList.data).toHaveLength(1);
  expect(publicList.data[0]).not.toHaveProperty('purchaseCost');
  expect(
    (
      await staff.fetch(
        `/equipment/assets/${asset.id}/fire`,
        body({
          transition: 'issue',
          input: { custodianId: employee.id },
          expectVersion: 0,
          requestId: 'staff-escalation',
        }),
      )
    ).status,
  ).toBe(403);
  const issued = await call(`assets/${asset.id}/fire`, {
    transition: 'issue',
    input: { custodianId: employee.id },
    expectVersion: asset.lifecycleVersion,
    requestId: 'issue-first',
  });
  expect(issued.status).toBe('issued');
  expect(issued.custodianId).toBe(employee.id);
  await call(
    `assets/${asset.id}/fire`,
    {
      transition: 'issue',
      input: { custodianId: employee.id },
      expectVersion: issued.lifecycleVersion,
      requestId: 'issue-duplicate',
    },
    'POST',
    400,
  );
  const returned = await call(`assets/${asset.id}/fire`, {
    transition: 'return',
    input: {},
    expectVersion: issued.lifecycleVersion,
    requestId: 'return-first',
  });
  expect(returned.status).toBe('idle');
  expect(returned.custodianId).toBeNull();
  await call(
    `assets/${asset.id}`,
    { name: 'Stale edit', expectVersion: 0 },
    'PATCH',
    409,
  );
  const refreshed = await call(`assets/${asset.id}`);
  expect(refreshed.record.status).toBe('idle');
  expect(
    refreshed.history.transitions.map(
      (e: { transition: string }) => e.transition,
    ),
  ).toEqual(['$create', 'issue', 'return']);
  expect(findUndeclaredApiRoutes(app)).toEqual([]);
  const document = await app.container.resolve(apiDocsToken).getDocument();
  expect(findApiDocumentSchemaProblems(document)).toEqual([]);
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
    expected = 200,
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
test('requests, transfer, maintenance, terminal scrap and failure rollback use the real authorization boundary', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const { call, employee, other, manager } = f;
  const asset = await f.create('flow');
  expect((await manager.session.fetch('/users')).status).toBe(403);
  const dueDate = new Date(Date.now() + 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const requestResponse = await employee.session.fetch(
    '/equipment/requests',
    body({
      deviceId: asset.id,
      kind: 'borrow',
      reason: 'Field survey',
      dueDate,
    }),
  );
  const request = (await requestResponse.json()).data;
  expect(requestResponse.status).toBe(200);
  expect(
    (await other.session.fetch('/equipment/requests/' + request.id)).status,
  ).toBe(404);
  expect(
    (
      await employee.session.fetch(
        '/equipment/requests/' + request.id + '/handle',
        body({
          decision: 'complete',
          resolution: 'Self escalation',
          expectVersion: request.lifecycleVersion,
        }),
      )
    ).status,
  ).toBe(403);
  await call(
    'requests/' + request.id + '/handle',
    { decision: 'complete', resolution: 'Stale request', expectVersion: 0 },
    'POST',
    409,
  );
  expect((await call('assets/' + asset.id)).record.status).toBe('idle');
  expect((await call('requests/' + request.id)).record.status).toBe('pending');
  await call('requests/' + request.id + '/handle', {
    decision: 'complete',
    resolution: 'Issued by stores',
    expectVersion: request.lifecycleVersion,
  });
  await call(
    'requests/' + request.id + '/handle',
    {
      decision: 'complete',
      resolution: 'Duplicate handling',
      expectVersion: request.lifecycleVersion,
    },
    'POST',
    400,
  );
  let current = (await call('assets/' + asset.id)).record;
  expect(current.status).toBe('loaned');
  expect(current.custodianId).toBe(employee.user.id);
  expect(
    (await other.session.fetch('/equipment/assets/' + asset.id)).status,
  ).toBe(404);
  const repair = await call('maintenance', {
    deviceId: asset.id,
    kind: 'repair',
    description: 'Replace battery',
  });
  expect((await call('assets/' + asset.id)).record.status).toBe('maintenance');
  await call(
    'maintenance/' + repair.id + '/complete',
    { resolution: 'Battery replaced and tested', cost: 50, expectVersion: 0 },
    'POST',
    409,
  );
  expect((await call('assets/' + asset.id)).record.status).toBe('maintenance');
  await call('maintenance/' + repair.id + '/complete', {
    resolution: 'Battery replaced and tested',
    cost: 50,
    expectVersion: repair.lifecycleVersion,
  });
  await call(
    'maintenance/' + repair.id + '/complete',
    {
      resolution: 'Duplicate',
      cost: 0,
      expectVersion: repair.lifecycleVersion,
    },
    'POST',
    400,
  );
  current = (await call('assets/' + asset.id)).record;
  expect(current.status).toBe('loaned');
  expect(current.custodianId).toBe(employee.user.id);
  expect(current.dueDate).toBe(dueDate);
  const destination = await call('reference/equipmentLocations', {
    name: 'Remote office',
    code: 'remote' + f.suffix,
  });
  await call('assets/' + asset.id + '/fire', {
    transition: 'transferLoaned',
    input: {
      departmentId: f.department.id,
      locationId: destination.id,
      custodianId: other.user.id,
    },
    expectVersion: current.lifecycleVersion,
    requestId: 'transfer-' + f.suffix,
  });
  current = (await call('assets/' + asset.id)).record;
  expect(current.locationId).toBe(destination.id);
  expect(current.custodianId).toBe(other.user.id);
  const deniedReturn = await employee.session.fetch(
    '/equipment/requests',
    body({ deviceId: asset.id, kind: 'return', reason: 'Not mine anymore' }),
  );
  expect(deniedReturn.status).toBe(404);
  await call('assets/' + asset.id + '/fire', {
    transition: 'return',
    input: {},
    expectVersion: current.lifecycleVersion,
    requestId: 'return-' + f.suffix,
  });
  const pendingResponse = await employee.session.fetch(
    '/equipment/requests',
    body({ deviceId: asset.id, kind: 'issue', reason: 'Need equipment' }),
  );
  expect(pendingResponse.status).toBe(200);
  const pending = (await pendingResponse.json()).data;
  current = (await call('assets/' + asset.id)).record;
  await call(
    'assets/' + asset.id + '/fire',
    {
      transition: 'scrap',
      input: { reason: 'End of life' },
      expectVersion: current.lifecycleVersion,
      requestId: 'scrap-blocked-' + f.suffix,
    },
    'POST',
    400,
  );
  await call('requests/' + pending.id + '/handle', {
    decision: 'reject',
    resolution: 'Asset is being retired',
    expectVersion: pending.lifecycleVersion,
  });
  const scrapped = await call('assets/' + asset.id + '/fire', {
    transition: 'scrap',
    input: { reason: 'End of life' },
    expectVersion: current.lifecycleVersion,
    requestId: 'scrap-' + f.suffix,
  });
  expect(scrapped.status).toBe('scrapped');
  await call(
    'assets/' + asset.id + '/fire',
    {
      transition: 'issue',
      input: { custodianId: employee.user.id },
      expectVersion: scrapped.lifecycleVersion,
      requestId: 'revive-' + f.suffix,
    },
    'POST',
    400,
  );
});
test('stocktake observations require explicit resolution, serialize updates and leave asset ownership unchanged', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const a = await f.create('inventory');
  const { call } = f;
  const batch = await call('stocktakes', {
    name: 'Warehouse inspection',
    locationId: f.location.id,
  });
  let detail = await call('stocktakes/' + batch.id);
  expect(detail.items).toHaveLength(1);
  const item = detail.items[0];
  await call(
    'stocktakes/' + batch.id + '/complete',
    { expectVersion: batch.lifecycleVersion },
    'POST',
    400,
  );
  await call(
    'stocktakes/' + batch.id + '/items/' + item.id,
    {
      actualLocationId: f.location.id,
      condition: 'damaged',
      resolved: true,
      note: '',
      expectVersion: batch.lifecycleVersion,
    },
    'PUT',
    400,
  );
  await call(
    'stocktakes/' + batch.id + '/items/' + item.id,
    {
      actualLocationId: f.location.id,
      condition: 'damaged',
      resolved: false,
      note: 'Case cracked',
      expectVersion: batch.lifecycleVersion,
    },
    'PUT',
  );
  detail = await call('stocktakes/' + batch.id);
  expect(detail.record.lifecycleVersion).toBeGreaterThan(
    batch.lifecycleVersion,
  );
  await call(
    'stocktakes/' + batch.id + '/complete',
    { expectVersion: detail.record.lifecycleVersion },
    'POST',
    400,
  );
  await call(
    'stocktakes/' + batch.id + '/items/' + item.id,
    {
      actualLocationId: f.location.id,
      condition: 'damaged',
      resolved: true,
      note: 'Repair order arranged; assignment verified',
      expectVersion: detail.record.lifecycleVersion,
    },
    'PUT',
  );
  detail = await call('stocktakes/' + batch.id);
  await call('stocktakes/' + batch.id + '/complete', {
    expectVersion: detail.record.lifecycleVersion,
  });
  expect((await call('assets/' + a.id)).record.status).toBe('idle');
  expect((await call('assets/' + a.id)).record.locationId).toBe(f.location.id);
  await call(
    'stocktakes/' + batch.id + '/items/' + item.id,
    {
      actualLocationId: f.location.id,
      condition: 'good',
      resolved: true,
      note: 'late write',
      expectVersion: detail.record.lifecycleVersion,
    },
    'PUT',
    400,
  );
});
test('CSV preview and atomic import refuse lifecycle and assignment injection; exports are scoped and spreadsheet safe', async ({
  testApp,
}) => {
  const f = await fixture(testApp);
  const { call } = f;
  const headers =
    'assetNumber,name,categoryId,departmentId,locationId,purchaseCost,notes';
  const row = (n: string, name = '"Laptop, portable"') =>
    [
      f.suffix + n,
      name,
      f.category.id,
      f.department.id,
      f.location.id,
      '100',
      '"First line\nSecond ""quoted"" line"',
    ].join(',');
  const csv = headers + '\r\n' + row('csv');
  const preview = await call('import/preview', { csv });
  expect(preview.rows[0].errors).toEqual([]);
  const countBefore = (
    await (
      await f.manager.session.fetch('/equipment/assets?q=' + f.suffix + 'csv')
    ).json()
  ).meta.total;
  expect(countBefore).toBe(0);
  await call('import/commit', { csv });
  const listed = await (
    await f.manager.session.fetch('/equipment/assets?q=' + f.suffix + 'csv')
  ).json();
  expect(listed.meta.total).toBe(1);
  expect(listed.data[0].name).toBe('Laptop, portable');
  await call(
    'import/preview',
    { csv: 'assetNumber,status\nX,issued' },
    'POST',
    400,
  );
  const invalid =
    headers +
    '\n' +
    row('atomic') +
    '\n' +
    row('bad').replace(f.category.id, 'missing-category');
  const p = await call('import/preview', { csv: invalid });
  expect(p.rows[1].errors.length).toBeGreaterThan(0);
  await call('import/commit', { csv: invalid }, 'POST', 400);
  expect(
    (
      await (
        await f.manager.session.fetch(
          '/equipment/assets?q=' + f.suffix + 'atomic',
        )
      ).json()
    ).meta.total,
  ).toBe(0);
  const destination = await call('reference/equipmentLocations', {
    name: 'Other store',
    code: 'csvdest' + f.suffix,
  });
  await call(
    'import/commit',
    { csv: csv.replace(f.location.id, destination.id) },
    'POST',
    400,
  );
  expect(
    (await f.employee.session.fetch('/equipment/import/commit', body({ csv })))
      .status,
  ).toBe(403);
  expect((await f.employee.session.fetch('/equipment/export')).status).toBe(
    403,
  );
  const formula = await f.create('formula');
  await call(
    'assets/' + formula.id,
    { name: '=1+1', expectVersion: formula.lifecycleVersion },
    'PATCH',
  );
  const exported = await call('export?q=' + f.suffix);
  expect(exported.csv).toContain("'=1+1");
  expect(exported.csv).toContain('""quoted""');
  const ordinary = await signIn(testApp, {
    username: f.employee.user.username,
    password: testPassword,
  });
  const scoped = await (await ordinary.fetch('/equipment/assets')).json();
  expect(
    scoped.data.every(
      (r: Record<string, unknown>) =>
        !('purchaseCost' in r) && !('vendor' in r),
    ),
  ).toBe(true);
});
