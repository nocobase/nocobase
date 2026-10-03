import { permissionSetsPlugin } from '@nocobase/authorization';
import type { PermissionGrant } from '@nocobase/authorization/core';
import type { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DatabaseManager } from '@nocobase/db';

import {
  createAppAuthorization,
  type AppAuthorization,
} from '../../../server/index.js';
import { createAuthorization } from '../../helpers/authorization-fixture.js';
import { createTestDatabase, type TestDatabase } from '@nocobase/db-testing';
import { migratePlugins } from '../../helpers/database-fixture.js';
import { MockPermissionSetStore } from '../../helpers/mock-permission-set-store.js';
import {
  json,
  mountedRouter,
  testIdentity,
} from '../../helpers/mounted-router.js';

const PATH = '/api/authz/permission-sets';

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
      await (await router.request(`${PATH}/effective/user/alice`)).json(),
    ).toMatchObject({ data: [{ key: 'reader' }] });
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
        json('PUT', { key: 'target', title: 'Edited', grants: [] }, user),
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
      json('PUT', record),
    );
    expect(await updated.json()).toMatchObject({ data: { title } });
    await router.request(
      `${PATH}/localized`,
      json('PUT', { ...record, title: 'My custom title' }),
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
    ) => router.request(`${PATH}/${key}`, json('PUT', input));
    const grants = [settings('authorization.permission-sets', ['read'])];

    const edited = await update('member', {
      key: 'member',
      title: 'Members',
      grants,
    });
    expect(edited.status).toBe(200);
    expect(await api.get('member')).toMatchObject({ title: 'Members', grants });

    const renamed = await update('member', { key: 'escaped', grants: [] });
    expect(renamed.status).toBe(403);
    expect(await renamed.json()).toMatchObject({
      code: 'PROTECTED_PERMISSION_SET',
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
    expect(ontoProtected.status).toBe(403);
    expect(await ontoProtected.json()).toMatchObject({
      code: 'PROTECTED_PERMISSION_SET',
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
        json('PUT', { key: 'hub-viewer', grants: [] }),
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
      403, 403, 403, 403, 403,
    ]);
    for (const response of responses) {
      await expect(response.json()).resolves.toMatchObject({
        code: 'PROTECTED_PERMISSION_SET',
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
    expect(last.status).toBe(409);
    await expect(last.json()).resolves.toMatchObject({
      code: 'LAST_ASSIGNMENT',
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
    expect(audience.status).toBe(403);
    await expect(audience.json()).resolves.toMatchObject({
      code: 'PERMISSION_SET_SUBJECT_NOT_ALLOWED',
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
