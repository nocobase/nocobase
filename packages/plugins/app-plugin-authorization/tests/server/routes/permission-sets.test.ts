import { permissionSetsPlugin } from '@nocobase/authorization';
import {
  defineCompositeResource,
  type PermissionGrant,
} from '@nocobase/authorization/core';
import { defineRepositoryApiRoutes } from '@nocobase/app-server/router';
import { ServiceContainer } from '@nocobase/service-provider';
import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { databaseManagerToken, type DatabaseManager } from '@nocobase/db';

import {
  createAppAuthorization,
  defineDatabasePermission,
  type AppAuthorization,
} from '../../../server/index.js';
import { createAuthorization } from '../../helpers/authorization-fixture.js';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { migratePlugins } from '../../helpers/database-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';
import {
  json,
  mountedRouter,
  testIdentity,
} from '../../helpers/mounted-router.js';

const PATH = '/api/authorization/permissionSets';

const settings = (
  id: string,
  actions: readonly string[] = ['read', 'create', 'update', 'delete', 'assign'],
): PermissionGrant => ({
  resource: { type: 'settings', id },
  actions: actions.map((action) => ({ action })),
});

/** Permission Sets in memory behind the mounted routes; the caller comes from `x-test-user`. */
function authorization(
  options: Parameters<typeof permissionSetsPlugin>[0] = {
    store: new MockPermissionSetStore(),
  },
): AppAuthorization {
  return createAuthorization({
    plugins: [testIdentity(), permissionSetsPlugin(options)],
  }) as unknown as AppAuthorization;
}

/** `user` holds a set granting `grants`. */
async function holding(
  authz: AppAuthorization,
  user: string,
  grants: readonly PermissionGrant[],
): Promise<void> {
  await authz.permissionSets.create({ key: `${user}-set`, grants });
  await authz.permissionSets.assign({
    id: `user:${user}:${user}-set`,
    permissionSet: `${user}-set`,
    subject: { type: 'user', id: user },
  });
}

describe('the Permission Set routes', () => {
  it('checks the scoped authorization and manages Permission Sets', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('authorization.permission-sets')]);
    const router = await mountedRouter(authz);

    expect(
      (await router.request(PATH, json('GET', undefined, 'bob'))).status,
    ).toBe(403);
    expect(
      (
        await router.request(
          `${PATH}/missing/assignments`,
          json('POST', { subject: { type: 'user', id: 'alice' } }),
        )
      ).status,
    ).toBe(404);
    expect(
      (await router.request(PATH, json('POST', { key: 'reader' }))).status,
    ).toBe(400);

    const grants = [
      {
        resource: { type: 'database.collection', id: 'main.orders' },
        actions: [
          { action: 'read', policy: { type: 'database', fields: ['id'] } },
        ],
      },
    ];
    const created = await router.request(
      PATH,
      json('POST', { key: 'reader', grants }),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({
      data: { key: 'reader', grants },
    });
    expect(
      (
        await router.request(
          `${PATH}/reader/assignments`,
          json('POST', { subject: { type: 'user', id: 'alice' } }),
        )
      ).status,
    ).toBe(201);
    expect(
      await (
        await router.request(`${PATH}?subjectType=user&subjectId=alice`)
      ).json(),
    ).toMatchObject({ data: [{ key: 'reader' }], meta: { total: 1 } });
    // The assignment list is a bounded configuration list too.
    expect(
      await (await router.request(`${PATH}/reader/assignments`)).json(),
    ).toMatchObject({
      data: [{ subject: { type: 'user', id: 'alice' } }],
      meta: { total: 1 },
    });
  });

  it('answers missing sets, unknown fields and partial updates in the standard shape', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('authorization.permission-sets')]);
    await authz.permissionSets.create({
      key: 'target',
      title: 'Target',
      grants: [settings('reports', ['read'])],
    });
    const router = await mountedRouter(authz);

    const missing = await router.request(`${PATH}/missing`);
    expect(missing.status).toBe(404);
    await expect(missing.json()).resolves.toMatchObject({
      error: {
        status: 'NOT_FOUND',
        reason: 'PERMISSION_SET_NOT_FOUND',
        domain: 'authorization',
      },
    });
    const revoked = await router.request(
      `${PATH}/target/assignments/nobody`,
      json('DELETE'),
    );
    expect(revoked.status).toBe(404);
    await expect(revoked.json()).resolves.toMatchObject({
      error: { reason: 'ASSIGNMENT_NOT_FOUND' },
    });
    const unknownField = await router.request(
      PATH,
      json('POST', { key: 'extra', grants: [], owner: 'me' }),
    );
    expect(unknownField.status).toBe(400);
    await expect(unknownField.json()).resolves.toMatchObject({
      error: { reason: 'INVALID_INPUT', domain: 'app' },
    });
    const halfSubject = await router.request(`${PATH}?subjectType=user`);
    expect(halfSubject.status).toBe(400);

    const patched = await router.request(
      `${PATH}/target`,
      json('PATCH', { title: 'Renamed' }),
    );
    expect(patched.status).toBe(200);
    expect(await authz.permissionSets.get('target')).toMatchObject({
      title: 'Renamed',
      grants: [settings('reports', ['read'])],
    });
  });

  it('separates editing permission sets from managing assignments', async () => {
    const authz = authorization();
    await authz.permissionSets.create({ key: 'target', grants: [] });
    for (const action of ['update', 'assign'])
      await holding(authz, action, [
        settings('authorization.permission-sets', [action]),
      ]);
    const router = await mountedRouter(authz);
    const edit = (user: string) =>
      router.request(
        `${PATH}/target`,
        json('PATCH', { key: 'target', title: 'Edited', grants: [] }, user),
      );
    const assign = (user: string) =>
      router.request(
        `${PATH}/target/assignments`,
        json('POST', { subject: { type: 'user', id: 'alice' } }, user),
      );

    expect((await edit('update')).status).toBe(200);
    expect((await assign('update')).status).toBe(403);
    expect((await edit('assign')).status).toBe(403);
    expect((await assign('assign')).status).toBe(201);
    const [created] = await authz.permissionSets.listAssignments('target');
    expect(
      (
        await router.request(
          `${PATH}/target/assignments/${created.id}`,
          json('DELETE', undefined, 'assign'),
        )
      ).status,
    ).toBe(204);
  });

  it('reports protection and unrestricted access from the read endpoints', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('*', ['read'])]);
    await authz.permissionSets.create({ key: 'superuser', grants: [] });
    await authz.permissionSets.create({ key: 'reader', grants: [] });
    authz.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['superuser'],
      allow: ['assign', 'revoke'],
      unrestricted: true,
    });
    const router = await mountedRouter(authz);
    const superuser = {
      key: 'superuser',
      grants: [],
      protection: {
        owner: '@nocobase/test',
        allow: ['assign', 'revoke'],
        unrestricted: true,
      },
      unrestricted: true,
    };

    expect(await (await router.request(PATH)).json()).toEqual({
      data: [
        { key: 'admin-set', grants: [settings('*', ['read'])] },
        superuser,
        // An ordinary set carries neither field rather than carrying them as undefined.
        { key: 'reader', grants: [] },
      ],
      meta: { total: 3 },
    });
    expect(await (await router.request(`${PATH}/superuser`)).json()).toEqual({
      data: superuser,
    });
    expect(await (await router.request(`${PATH}/reader`)).json()).toEqual({
      data: { key: 'reader', grants: [] },
    });
  });

  it('lets the seeded superuser administer without holding any grant', async () => {
    const authz = authorization();
    // Exactly what the seed writes: the superuser set carries no grants.
    await holding(authz, 'root', []);
    const router = await mountedRouter(authz);
    const list = () => router.request(PATH, json('GET', undefined, 'root'));

    expect((await list()).status).toBe(403);
    authz.permissionSets.protect({
      owner: '@nocobase/app-plugin-authorization',
      keys: ['root-set'],
      unrestricted: true,
    });
    const permitted = await list();
    expect(permitted.status).toBe(200);
    await expect(permitted.json()).resolves.toMatchObject({
      data: [{ key: 'root-set', grants: [] }],
    });
  });

  it('persists a translated title until it is renamed, and refuses a malformed one', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('authorization.permission-sets')]);
    const router = await mountedRouter(authz);
    const title = { key: 'roles.assistant', ns: '@nocobase/test' };

    const created = await router.request(
      PATH,
      json('POST', { key: 'localized', grants: [], title }),
    );
    expect(created.status).toBe(201);
    expect(await created.json()).toMatchObject({ data: { title } });
    const record = (await (await router.request(`${PATH}/localized`)).json())
      .data;
    const updated = await router.request(
      `${PATH}/localized`,
      json('PATCH', record),
    );
    expect(await updated.json()).toMatchObject({ data: { title } });
    await router.request(
      `${PATH}/localized`,
      json('PATCH', { ...record, title: 'My custom title' }),
    );
    expect(
      await (await router.request(`${PATH}/localized`)).json(),
    ).toMatchObject({ data: { title: 'My custom title' } });
    expect(
      (
        await router.request(
          PATH,
          json('POST', {
            key: 'invalid-title',
            grants: [],
            title: { key: 'missing-namespace' },
          }),
        )
      ).status,
    ).toBe(400);
  });
});

describe('protected Permission Sets', () => {
  it('keeps protected keys fixed while allowing default permissions and titles to change', async () => {
    const authz = authorization({
      store: new MockPermissionSetStore(),
      rootSet: 'root',
      defaultSet: 'member',
    });
    const api = authz.permissionSets;
    for (const key of ['root', 'member', 'plain'])
      await api.create({ key, grants: [] });
    await api.assign({
      subject: { type: 'user', id: 'admin' },
      permissionSet: 'root',
    });
    const assignment = await api.assign({
      subject: { type: 'authenticated', id: '*' },
      permissionSet: 'member',
    });
    const router = await mountedRouter(authz);
    const update = (
      key: string,
      input: { key: string; title?: string; grants: readonly unknown[] },
    ) => router.request(`${PATH}/${key}`, json('PATCH', input));
    const grants = [settings('authorization.permission-sets', ['read'])];

    const edited = await update('member', {
      key: 'member',
      title: 'Members',
      grants,
    });
    expect(edited.status).toBe(200);
    expect(await api.get('member')).toMatchObject({ title: 'Members', grants });

    const renamed = await update('member', { key: 'escaped', grants: [] });
    expect(renamed.status).toBe(400);
    expect(await renamed.json()).toMatchObject({
      error: { reason: 'PROTECTED_PERMISSION_SET' },
    });
    expect(await api.get('escaped')).toBeUndefined();
    expect(await api.get('member')).toMatchObject({ title: 'Members', grants });
    expect(await api.listAssignments('member')).toEqual([assignment]);

    // Reserved protected keys cannot be acquired by renaming an ordinary set,
    // even if their protection permits content updates and no row exists yet.
    api.protect({
      owner: '@nocobase/test',
      keys: ['reserved'],
      allow: ['update'],
    });
    const ontoProtected = await update('plain', {
      key: 'reserved',
      grants: [],
    });
    expect(ontoProtected.status).toBe(400);
    expect(await ontoProtected.json()).toMatchObject({
      error: { reason: 'PROTECTED_PERMISSION_SET' },
    });
    expect(await api.get('reserved')).toBeUndefined();
    expect((await update('plain', { key: 'renamed', grants: [] })).status).toBe(
      200,
    );
    expect(await api.get('plain')).toBeUndefined();
    expect(await api.get('renamed')).toMatchObject({ key: 'renamed' });
  });

  it('rejects generic writes to protected Permission Sets and assignments', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('*')]);
    await authz.permissionSets.create({ key: 'hub-viewer', grants: [] });
    await authz.permissionSets.assign({
      id: 'hub-viewer-alice',
      permissionSet: 'hub-viewer',
      subject: { type: 'user', id: 'alice' },
    });
    authz.permissionSets.protect({
      owner: '@nocobase/app-plugin-hub',
      keys: ['hub-viewer', 'reserved'],
    });
    const router = await mountedRouter(authz);

    const responses = await Promise.all([
      router.request(
        `${PATH}/hub-viewer`,
        json('PATCH', { key: 'hub-viewer', grants: [] }),
      ),
      router.request(
        `${PATH}/hub-viewer/assignments`,
        json('POST', { subject: { type: 'user', id: 'bob' } }),
      ),
      router.request(
        `${PATH}/hub-viewer/assignments/hub-viewer-alice`,
        json('DELETE'),
      ),
      router.request(`${PATH}/hub-viewer`, json('DELETE')),
      router.request(PATH, json('POST', { key: 'reserved', grants: [] })),
    ]);

    expect(responses.map(({ status }) => status)).toEqual([
      400, 400, 400, 400, 400,
    ]);
    for (const response of responses) {
      await expect(response.json()).resolves.toMatchObject({
        error: { reason: 'PROTECTED_PERMISSION_SET' },
      });
    }
    expect(
      (await authz.permissionSets.listAssignments('hub-viewer')).map(
        ({ id }) => id,
      ),
    ).toEqual(['hub-viewer-alice']);
  });

  it('passes allowed operations and the owner API, and deletes once released', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('*')]);
    const release = authz.permissionSets.protect({
      owner: '@nocobase/test',
      keys: ['admin-set'],
      allow: ['assign'],
    });
    const router = await mountedRouter(authz);

    expect(
      (
        await router.request(
          `${PATH}/admin-set/assignments`,
          json('POST', { subject: { type: 'user', id: 'bob' } }),
        )
      ).status,
    ).toBe(201);
    await expect(
      authz.permissionSets.update('admin-set', {
        key: 'admin-set',
        title: 'Administrator',
        grants: [settings('*')],
      }),
    ).resolves.toMatchObject({ key: 'admin-set', title: 'Administrator' });

    release();
    expect(
      (await router.request(`${PATH}/admin-set`, json('DELETE'))).status,
    ).toBe(204);
  });

  it('assigns and revokes System Administrators but keeps the last one', async () => {
    const authz = authorization();
    await holding(authz, 'admin', [settings('*')]);
    authz.permissionSets.protect({
      owner: '@nocobase/app-plugin-authorization',
      keys: ['admin-set'],
      allow: ['assign', 'revoke'],
      requireActiveAssignment: true,
      unrestricted: true,
    });
    const router = await mountedRouter(authz);

    const assigned = await router.request(
      `${PATH}/admin-set/assignments`,
      json('POST', { subject: { type: 'user', id: 'alice' } }),
    );
    expect(assigned.status).toBe(201);
    await expect(assigned.json()).resolves.toMatchObject({
      data: { permissionSet: 'admin-set' },
    });
    expect(
      (
        await router.request(
          `${PATH}/admin-set/assignments/user:alice:admin-set`,
          json('DELETE'),
        )
      ).status,
    ).toBe(204);
    const last = await router.request(
      `${PATH}/admin-set/assignments/user:admin:admin-set`,
      json('DELETE'),
    );
    expect(last.status).toBe(400);
    await expect(last.json()).resolves.toMatchObject({
      error: { reason: 'LAST_ASSIGNMENT' },
    });
  });
});

describe('the subject types the root Permission Set accepts', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let router: Hono;

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    await migratePlugins(database, 'app-plugin-authorization');
    const authz = createAppAuthorization({
      connection: database.connection(),
    });
    for (const key of ['root', 'member'])
      await authz.permissionSets.create({ key, grants: [] });
    // The superuser set carries no grants; holding it is what administers.
    await authz.permissionSets.assign({
      permissionSet: 'root',
      subject: { type: 'user', id: 'admin' },
    });
    router = await mountedRouter(authz);
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  it('refuses the audience that would make every signed-in user unrestricted, and reports the restriction on the root set alone', async () => {
    const assign = (subject: object) =>
      router.request(`${PATH}/root/assignments`, json('POST', { subject }));

    const audience = await assign({ type: 'authenticated', id: '*' });
    expect(audience.status).toBe(400);
    await expect(audience.json()).resolves.toMatchObject({
      error: { reason: 'PERMISSION_SET_SUBJECT_NOT_ALLOWED' },
    });
    expect((await assign({ type: 'user', id: 'alice' })).status).toBe(201);

    const body = (await (await router.request(PATH)).json()) as {
      data: readonly {
        key: string;
        protection?: { assignableTo?: readonly string[] };
      }[];
    };
    const protection = (key: string): unknown =>
      body.data.find((set) => set.key === key)?.protection;
    expect(protection('root')).toMatchObject({ assignableTo: ['user'] });
    expect(protection('member')).not.toHaveProperty('assignableTo');
  });
});

describe('database write field grants', () => {
  let testDatabase: TestDatabase;
  let database: DatabaseManager;
  let authz: AppAuthorization;
  let router: Hono;

  const counterAccess = defineDatabasePermission((permission) =>
    permission.collection('counters').read('*').update('*'),
  );
  const counterResource = defineCompositeResource('test.counters', (resource) =>
    resource
      .title('Counters')
      .action('edit', (action) => action.grant('counters', counterAccess)),
  );

  beforeEach(async () => {
    testDatabase = await createTestDatabase();
    database = testDatabase.database;
    await migratePlugins(database, 'app-plugin-authorization');
    // `id` is assigned by the database, so no write may name it.
    await database
      .connection()
      .builder.createCollection('counters', (counters) => {
        counters.increments('id').primary();
        counters.string('title', { length: 120 });
        counters.integer('amount');
      });
    authz = createAppAuthorization({ connection: database.connection() });
    authz.database.collections.add({ name: 'counters', title: 'Counters' });
    authz.compositeResources.define(counterResource);
    await authz.permissionSets.create({ key: 'root', grants: [] });
    await authz.permissionSets.assign({
      permissionSet: 'root',
      subject: { type: 'user', id: 'admin' },
    });
    router = await mountedRouter(authz);
  });

  afterEach(async () => {
    await testDatabase.destroy();
  });

  const counters = (
    actions: readonly { action: string; policy?: object }[],
  ): object => ({
    resource: { type: 'database.collection', id: 'counters' },
    actions,
  });
  const write = (action: string, policy: object) => ({
    action,
    policy: { type: 'database', ...policy },
  });

  it('refuses a create or update grant naming a missing field, a field db assigns, or a missing relation', async () => {
    const response = await router.request(
      PATH,
      json('POST', {
        key: 'writer',
        grants: [
          counters([
            // A read grant is not checked: naming a missing field only narrows what it returns.
            write('read', { fields: ['missing'] }),
            write('update', { fields: ['title', 'missing'] }),
            write('create', {
              fields: ['id', 'amount'],
              relations: { owner: { connect: {} } },
            }),
          ]),
        ],
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: { fieldViolations: readonly { field: string }[] };
    };
    expect(body).toMatchObject({
      error: {
        status: 'INVALID_ARGUMENT',
        reason: 'INVALID_AUTHORIZATION_INPUT',
        domain: 'authorization',
      },
    });
    expect(body.error.fieldViolations).toEqual([
      {
        field: 'grants.0.actions.1.policy.fields.1',
        description:
          'Field "missing" is not a writable scalar field of "counters".',
      },
      {
        field: 'grants.0.actions.2.policy.fields.0',
        description: 'Field "id" is not a writable scalar field of "counters".',
      },
      {
        field: 'grants.0.actions.2.policy.relations.owner',
        description: 'Relation "owner" does not exist on "counters".',
      },
    ]);
    expect((await router.request(`${PATH}/writer`)).status).toBe(404);
  });

  it('checks the grants a PATCH replaces, and still saves a title change alone', async () => {
    expect(
      (
        await router.request(
          PATH,
          json('POST', {
            key: 'writer',
            grants: [counters([write('update', { fields: ['title'] })])],
          }),
        )
      ).status,
    ).toBe(201);
    const replaced = await router.request(
      `${PATH}/writer`,
      json('PATCH', {
        grants: [counters([write('update', { fields: ['id'] })])],
      }),
    );
    expect(replaced.status).toBe(400);
    await expect(replaced.json()).resolves.toMatchObject({
      error: {
        reason: 'INVALID_AUTHORIZATION_INPUT',
        domain: 'authorization',
        fieldViolations: [{ field: 'grants.0.actions.0.policy.fields.0' }],
      },
    });
    expect(
      (
        await router.request(
          `${PATH}/writer`,
          json('PATCH', { title: 'Writer' }),
        )
      ).status,
    ).toBe(200);
  });

  it('checks permission before the grants', async () => {
    const response = await router.request(
      PATH,
      json(
        'POST',
        {
          key: 'writer',
          grants: [counters([write('update', { fields: ['id'] })])],
        },
        'bob',
      ),
    );
    expect(response.status).toBe(403);
  });

  it("saves '*' grants, and a write they allow succeeds through a Repository endpoint", async () => {
    const created = await router.request(
      PATH,
      json('POST', {
        key: 'counter-editor',
        grants: [
          counters([
            write('read', { fields: '*', recordAccess: ['allRecords'] }),
            write('create', { fields: '*' }),
            write('update', { fields: '*', recordAccess: ['allRecords'] }),
          ]),
          counterResource
            .reference()
            .grant({ edit: { counters: 'allRecords' } }),
        ],
      }),
    );
    expect(created.status).toBe(201);
    expect(
      (
        await router.request(
          `${PATH}/counter-editor/assignments`,
          json('POST', { subject: { type: 'user', id: 'alice' } }),
        )
      ).status,
    ).toBe(201);

    const container = new ServiceContainer();
    container.instance(databaseManagerToken, database);
    const endpoints = new Hono();
    endpoints.use('*', async (context, next) => {
      context.set('auth', { user: { id: 'alice' } });
      await next();
    });
    endpoints.use(
      '*',
      authz.database.authorizeRepository({
        repository: 'counters',
        resource: counterResource.reference(),
        actions: { updateOne: 'edit' },
      }),
    );
    endpoints.route(
      '/',
      await defineRepositoryApiRoutes({
        repositories: [
          {
            name: 'counters',
            collection: 'counters',
            policy: { read: true, update: true, create: false, delete: false },
            actions: { updateOne: {} },
          },
        ],
      }).createRouter({ container }),
    );
    const row = await database
      .repository('counters')
      .createOne({ values: { title: 'Visits', amount: 1 } });
    const updated = await endpoints.request('/counters/updateOne', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        filter: { id: row.record.id },
        values: { amount: 2 },
      }),
    });
    expect(updated.status).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      data: { record: { amount: 2 } },
    });
  });
});
