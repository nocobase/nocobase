import { CustomerContactsService } from '../../server/providers/customer-contacts.js';
import { createAppTest } from '@nocobase/app-testing/server';
import {
  signIn,
  DEFAULT_ADMIN_CREDENTIALS,
} from '@nocobase/app-plugin-authentication/testing';
import { expect } from 'vitest';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
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
const prefix = '/customerContacts';
const write = (body: unknown, method = 'POST'): RequestInit => ({
  method,
  headers: { 'content-type': 'application/json', origin: 'http://localhost' },
  body: JSON.stringify(body),
});
const credentials = (role: string) => ({
  email: `crm_${role}@example.test`,
  password: 'CustomerExample123!',
});

test.beforeEach(async ({ testApp }) => {
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  const reset = await admin.fetch(`${prefix}/reset`, write({}));
  if (reset.status !== 200) throw new Error('Example reset failed');
});

test('filters relation searches and pages, rechecks source/target scopes and persists allowed associations', async ({
  testApp,
  request,
}) => {
  expect((await request(`${prefix}/customers`)).status).toBe(401);
  expect(
    (
      await request(
        `${prefix}/customers/batchUpdate`,
        write({ ids: ['customer-01'], values: { status: 'paused' } }),
      )
    ).status,
  ).toBe(401);
  const rep = await signIn(testApp, credentials('rep'));
  const manager = await signIn(testApp, credentials('manager'));
  for (const page of [1, 2]) {
    const result = await rep.fetch(
      `${prefix}/customers/options?page=${page}&pageSize=10`,
    );
    expect(result.status).toBe(200);
    const body = (await result.json()) as {
      data: { id: string }[];
      meta: { total: number; page: number };
    };
    expect(body.meta).toMatchObject({ total: 20, page });
    expect(body.data.map((r) => r.id)).toEqual(
      Array.from(
        { length: 10 },
        (_, i) =>
          `customer-${String((page - 1) * 10 + i + 1).padStart(2, '0')}`,
      ),
    );
  }
  const searched = await rep.fetch(
    `${prefix}/customers/options?search=aCoRn&status=active&pageSize=20`,
  );
  expect(await searched.json()).toMatchObject({
    data: [{ id: 'customer-06' }, { id: 'customer-11' }],
    meta: { total: 2 },
  });
  expect(
    (await rep.fetch(`${prefix}/customers/options?pageSize=21`)).status,
  ).toBe(400);
  expect((await rep.fetch(`${prefix}/customers/customer-21`)).status).toBe(403);
  expect((await rep.fetch(`${prefix}/customers/missing`)).status).toBe(403);
  expect(
    await (await rep.fetch(`${prefix}/salesReps/options`)).json(),
  ).toMatchObject({ data: [{ id: 'crm-rep' }], meta: { total: 1 } });
  expect(
    await (
      await manager.fetch(`${prefix}/salesReps/options?search=aLeX`)
    ).json(),
  ).toMatchObject({
    data: [{ id: 'crm-rep', name: 'Alex Rivera' }],
    meta: { total: 1 },
  });
  expect((await rep.fetch(`${prefix}/salesReps/crm-colleague`)).status).toBe(
    403,
  );
  const contact = {
    customerId: 'customer-02',
    name: 'Updated buyer',
    email: 'buyer@example.test',
    phone: '',
    title: 'Buyer',
  };
  expect(
    (await rep.fetch(`${prefix}/contacts/contact-01`, write(contact, 'PATCH')))
      .status,
  ).toBe(200);
  expect(
    await testApp.connection
      .repository('exampleContacts')
      .findOne({ filter: { id: 'contact-01' } }),
  ).toMatchObject(contact);
  expect(
    (
      await rep.fetch(
        `${prefix}/contacts/contact-01`,
        write({ ...contact, customerId: 'customer-21' }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
  expect(
    (await rep.fetch(`${prefix}/contacts/contact-21`, write(contact, 'PATCH')))
      .status,
  ).toBe(403);
  expect((await rep.fetch(`${prefix}/contacts/contact-21`)).status).toBe(403);
  expect(
    (
      await rep.fetch(
        `${prefix}/contacts`,
        write({ ...contact, customerId: 'customer-21' }),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await rep.fetch(
        `${prefix}/contacts`,
        write({ ...contact, customerId: 'customer-10' }),
      )
    ).status,
  ).toBe(409);
  const created = await rep.fetch(`${prefix}/contacts`, write(contact));
  expect(created.status).toBe(201);
  const { data: saved } = (await created.json()) as { data: { id: string } };
  expect(
    (
      await rep.fetch(`${prefix}/contacts/${saved.id}`, {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(200);
  expect(
    await testApp.connection
      .repository('exampleContacts')
      .exists({ filter: { id: saved.id } }),
  ).toBe(false);
  expect(
    (
      await rep.fetch(`${prefix}/contacts/contact-21`, {
        method: 'DELETE',
        headers: { origin: 'http://localhost' },
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await manager.fetch(
        `${prefix}/customers/customer-01`,
        write({ ownerId: 'crm-colleague' }, 'PATCH'),
      )
    ).status,
  ).toBe(200);
  expect((await rep.fetch(`${prefix}/customers/customer-01`)).status).toBe(403);
  expect((await rep.fetch(`${prefix}/contacts/contact-01`)).status).toBe(200); // Moved to another still-owned customer.
  expect(
    await testApp.connection
      .repository('exampleContacts')
      .findOne({ filter: { id: 'contact-01' } }),
  ).toMatchObject(contact);
});

test('shares single/batch permissions, rejects whole invalid requests and reports partial results matching the database', async ({
  testApp,
}) => {
  const rep = await signIn(testApp, credentials('rep'));
  const manager = await signIn(testApp, credentials('manager'));
  const repository = testApp.connection.repository('exampleCustomers');
  const batch = (values: unknown, ids = ['customer-01', 'customer-02']) =>
    write({ ids, values });
  for (const values of [
    { name: 'Injected' },
    { status: 'unknown' },
    { status: 'paused', ownerId: 'crm-colleague' },
    {},
  ]) {
    expect(
      (await manager.fetch(`${prefix}/customers/batchUpdate`, batch(values)))
        .status,
    ).toBe(400);
  }
  expect(
    (
      await manager.fetch(
        `${prefix}/customers/batchUpdate`,
        batch({ status: 'paused' }, ['customer-01', 'customer-01']),
      )
    ).status,
  ).toBe(400);
  for (const ownerId of ['crm-colleague', 'crm-inactive', 'missing']) {
    expect(
      (await rep.fetch(`${prefix}/customers/batchUpdate`, batch({ ownerId })))
        .status,
    ).toBe(403);
    expect(
      (
        await rep.fetch(
          `${prefix}/customers/customer-01`,
          write({ ownerId }, 'PATCH'),
        )
      ).status,
    ).toBe(403);
  }
  for (const ownerId of ['crm-inactive', 'missing'])
    expect(
      (
        await manager.fetch(
          `${prefix}/customers/batchUpdate`,
          batch({ ownerId }),
        )
      ).status,
    ).toBe(403);
  expect(
    await repository.findOne({ filter: { id: 'customer-01' } }),
  ).toMatchObject({ name: 'Acorn 01', status: 'paused', ownerId: 'crm-rep' });
  const mixed = await rep.fetch(
    `${prefix}/customers/batchUpdate`,
    batch({ status: 'active' }, [
      'customer-01',
      'customer-21',
      'customer-10',
      'missing',
    ]),
  );
  expect(mixed.status).toBe(200);
  expect(await mixed.json()).toEqual({
    data: {
      items: [
        { id: 'customer-01', outcome: 'updated' },
        { id: 'customer-21', outcome: 'failed', reason: 'FORBIDDEN' },
        { id: 'customer-10', outcome: 'failed', reason: 'STATE_CONFLICT' },
        { id: 'missing', outcome: 'failed', reason: 'FORBIDDEN' },
      ],
      updated: 1,
      failed: 3,
    },
  });
  expect(
    await repository.findOne({ filter: { id: 'customer-01' } }),
  ).toMatchObject({ status: 'active' });
  expect(
    await repository.findOne({ filter: { id: 'customer-21' } }),
  ).toMatchObject({ status: 'active', ownerId: 'crm-colleague' });
  expect(
    await repository.findOne({ filter: { id: 'customer-10' } }),
  ).toMatchObject({ status: 'closed' });
  expect(
    (
      await rep.fetch(
        `${prefix}/customers/customer-21`,
        write({ status: 'paused' }, 'PATCH'),
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await rep.fetch(
        `${prefix}/customers/customer-10`,
        write({ status: 'active' }, 'PATCH'),
      )
    ).status,
  ).toBe(409);
  const success = await manager.fetch(
    `${prefix}/customers/batchUpdate`,
    batch({ ownerId: 'crm-colleague' }),
  );
  expect(await success.json()).toMatchObject({
    data: { updated: 2, failed: 0 },
  });
  for (const id of ['customer-01', 'customer-02'])
    expect(await repository.findOne({ filter: { id } })).toMatchObject({
      ownerId: 'crm-colleague',
    });
  expect((await rep.fetch(`${prefix}/reset`, write({}))).status).toBe(403);
  const admin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  expect((await admin.fetch(`${prefix}/reset`, write({}))).status).toBe(200);
  expect(
    await repository.findOne({ filter: { id: 'customer-01' } }),
  ).toMatchObject({ ownerId: 'crm-rep', status: 'paused' });
});

test('page-only and action-only roles remain separate and revocation is checked on a new request', async ({
  testApp,
  request,
}) => {
  const authz = testApp.application.container.resolve(authorizationToken);
  const rep = await signIn(testApp, credentials('rep'));
  const user = await testApp.connection
    .repository('user')
    .findOne({ filter: { username: 'crm_rep' } });
  const original = await authz.permissionSets.get('crm-rep');
  expect(original).toBeDefined();
  await authz.permissionSets.update('crm-rep', {
    ...original!,
    grants: [
      {
        resource: { type: 'page', id: 'customer-contacts' },
        actions: [{ action: 'access' }],
      },
    ],
  });
  expect((await rep.fetch(`${prefix}/customers`)).status).toBe(403);
  expect(
    (
      await rep.fetch(
        `${prefix}/customers/batchUpdate`,
        write({ ids: ['customer-01'], values: { status: 'paused' } }),
      )
    ).status,
  ).toBe(403);
  expect(user).toBeDefined();
  const actionOnly = original!.grants.filter(
    (grant) => grant.resource.type !== 'page',
  );
  await authz.permissionSets.update('crm-rep', {
    ...original!,
    grants: actionOnly,
  });
  expect((await rep.fetch(`${prefix}/customers`)).status).toBe(200);
  await authz.permissionSets.update('crm-rep', {
    ...original!,
    grants: original!.grants,
  });
  expect((await request(`${prefix}/contacts/contact-01`)).status).toBe(401);
});

test('rolls back all eligible assignments when the transaction fails unexpectedly', async ({
  testApp,
}) => {
  const manager = await testApp.connection
    .repository('user')
    .findOne({ filter: { username: 'crm_manager' } });
  const authz = testApp.application.container
    .resolve(authorizationToken)
    .for({ principal: { type: 'user', id: String(manager!.id) } });
  const service = new CustomerContactsService(testApp.connection, authz);
  await service.prepareWrite('customer', { status: 'paused' });
  await expect(
    testApp.database.transaction(async (connection) => {
      const result = await service
        .withConnection(connection)
        .updateCustomers(['customer-02', 'customer-03'], { status: 'paused' });
      expect(result.updated).toBe(2);
      throw new Error('Injected transaction failure');
    }),
  ).rejects.toThrow('Injected transaction failure');
  for (const id of ['customer-02', 'customer-03'])
    expect(
      await testApp.connection
        .repository('exampleCustomers')
        .findOne({ filter: { id } }),
    ).toMatchObject({ status: 'active' });
});
