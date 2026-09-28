import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { c as createTar } from 'tar';
import {
  DefaultHubService,
  type HubHostController,
} from '../server/services/hub.js';
import { publishToHub } from '@nocobase/hub-cli';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import type { Knex } from 'knex';
import { ApiKeyService } from '@nocobase/app-plugin-api-keys/server';
import {
  hubApiKeyAuthentication,
  HUB_API_KEY_CONFIG_ID,
} from '../server/api-key-auth.js';
import {
  createDatabaseManager,
  createMigrator,
  type DatabaseManager,
} from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import {
  createAppAuthorization,
  authorizationToken,
} from '@nocobase/app-plugin-authorization';
import {
  authenticationToken,
  createAuthentication,
} from '@nocobase/app-plugin-authentication';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { ServiceContainer } from '@nocobase/service-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerHubResources } from '../server/authorization.js';
import {
  HubApiKeyService,
  hubApiKeyServiceToken,
} from '../server/services/api-keys.js';
import { hubServiceToken, type HubService } from '../server/tokens.js';
import { HubError } from '../server/services/hub.js';
import { apiRoutes } from '../server/routes/index.js';
import legacyMigration from '../database/migrations/202609150002_create_hub_app_api_keys.js';
import migration from '../database/migrations/202609160001_global_hub_api_keys.js';
import recoveryMigration from '../database/migrations/202609160003_recoverable_api_keys.js';
import allAppsMigration from '../database/migrations/202609160002_all_apps_api_keys.js';

let db: DatabaseManager;
let authz: ReturnType<typeof createAppAuthorization>;
let service: HubApiKeyService;
let authentication: ReturnType<typeof createAuthentication>;
let keyService: ApiKeyService;
async function migrate(packageName: string, directory: string) {
  return createMigrator({
    database: db,
    packageName,
    directory: fileURLToPath(new URL(directory, import.meta.url)),
  }).latest();
}
beforeEach(async () => {
  db = createDatabaseManager({
    drivers: { sqlite },
    default: 'main',
    connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
  });
  await migrate(
    '@nocobase/app-plugin-authentication',
    '../../app-plugin-authentication/database/migrations',
  );
  await migrate(
    '@nocobase/app-plugin-authorization',
    '../../app-plugin-authorization/database/migrations',
  );
  await migrate(
    '@nocobase/app-plugin-api-keys',
    '../../app-plugin-api-keys/database/migrations',
  );
  await migrate('@nocobase/app-plugin-hub', '../database/migrations');
  authz = createAppAuthorization({ connection: db.connection() });
  registerHubResources(authz, db.connection());
  const now = new Date();
  for (const [id, permissionSet] of [
    ['admin', 'hub-administrator'],
    ['operator', 'hub-operator'],
    // Holds no Hub role; tests grant it bespoke Permission Sets as needed.
    ['unprivileged', null],
  ] as const) {
    await db
      .connection()
      .query.insertInto('user')
      .values({
        id,
        name: id,
        email: `${id}@example.com`,
        username: id,
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
        disabledAt: null,
      })
      .execute();
    if (permissionSet)
      await authz.permissionSets.assign({
        subject: { type: 'user', id },
        permissionSet,
      });
  }
  for (const id of ['crm', 'erp'])
    await db
      .connection()
      .query.insertInto('hubApps')
      .values({
        id,
        name: id,
        enabled: false,
        basePath: `/${id}`,
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
  authentication = createAuthentication({
    connection: db.connection(),
    secret: 'test-only-auth-secret-at-least-32-characters',
    baseURL: 'http://localhost:3000',
    plugins: hubApiKeyAuthentication(),
  });
  keyService = new ApiKeyService(authentication, HUB_API_KEY_CONFIG_ID);
  service = new HubApiKeyService(
    db,
    authz,
    keyService,
    'test-only-auth-secret-at-least-32-characters',
  );
});
afterEach(async () => {
  await db.destroy();
});
const create = () =>
  service.create('admin', {
    name: 'CI',
    appIds: ['crm'],
    scopes: ['upload-release'],
  });

describe('Hub publishing key lifecycle and permissions', () => {
  it('stores an authenticated encrypted copy and reveals it only to its active owner', async () => {
    const { key, secret } = await create();
    const row = await db
      .connection()
      .query.selectFrom('hubApiKeys')
      .selectAll()
      .where('id', '=', key.id)
      .executeTakeFirstOrThrow();
    expect(row.encryptedSecret).toEqual(expect.stringMatching(/^v1\./));
    expect(JSON.stringify(row)).not.toContain(secret);
    expect(JSON.stringify(await service.list('admin'))).not.toContain(secret);
    expect((await service.list('admin'))[0].canCopy).toBe(true);
    const restarted = new HubApiKeyService(
      db,
      authz,
      keyService,
      'test-only-auth-secret-at-least-32-characters',
    );
    await expect(restarted.reveal(key.id, 'admin')).resolves.toBe(secret);
    await expect(service.reveal(key.id, 'operator')).rejects.toThrow();
    await authz.permissionSets.assign({
      subject: { type: 'user', id: 'operator' },
      permissionSet: 'hub-administrator',
    });
    await expect(service.reveal(key.id, 'operator')).rejects.toMatchObject({
      status: 403,
    });
    expect((await service.list('operator'))[0].canCopy).toBe(false);
    const wrongSecret = new HubApiKeyService(
      db,
      authz,
      keyService,
      'different-auth-secret-at-least-32-characters',
    );
    await expect(wrongSecret.reveal(key.id, 'admin')).rejects.toMatchObject({
      code: 'API_KEY_NOT_RECOVERABLE',
    });
    const other = await create();
    await db
      .connection()
      .query.updateTable('hubApiKeys')
      .set({ encryptedSecret: row.encryptedSecret })
      .where('id', '=', other.key.id)
      .execute();
    await expect(service.reveal(other.key.id, 'admin')).rejects.toMatchObject({
      code: 'API_KEY_NOT_RECOVERABLE',
    });
    await service.disable(key.id, 'admin');
    await expect(service.reveal(key.id, 'admin')).rejects.toMatchObject({
      code: 'API_KEY_INACTIVE',
    });
    expect(
      (
        await db
          .connection()
          .query.selectFrom('hubApiKeys')
          .select('encryptedSecret')
          .where('id', '=', key.id)
          .executeTakeFirstOrThrow()
      ).encryptedSecret,
    ).toBeNull();
    await service.remove(key.id, 'admin');
    await expect(service.reveal(key.id, 'admin')).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rolls back creation if encrypted storage is not configured', async () => {
    const unconfigured = new HubApiKeyService(db, authz, keyService);
    await expect(
      unconfigured.create('admin', {
        name: 'CI',
        appIds: ['crm'],
        scopes: ['deploy'],
      }),
    ).rejects.toThrow('auth.secret');
    expect(await keyService.get('missing')).toBeNull();
    expect(
      await db.connection().query.selectFrom('apikey').select('id').execute(),
    ).toEqual([]);
    expect(await service.list('admin')).toEqual([]);
  });

  it('rolls back the plugin credential when the Hub binding insert fails', async () => {
    const client = await db.connection().client<Knex>();
    await client.raw(
      "CREATE TRIGGER fail_hub_key_binding BEFORE INSERT ON hub_api_key_apps BEGIN SELECT RAISE(ABORT, 'Binding rejected'); END",
    );
    await expect(create()).rejects.toThrow('Binding rejected');
    expect(
      await db.connection().query.selectFrom('apikey').select('id').execute(),
    ).toEqual([]);
    expect(
      await db
        .connection()
        .query.selectFrom('hubApiKeys')
        .select('id')
        .execute(),
    ).toEqual([]);
    await client.raw('DROP TRIGGER fail_hub_key_binding');
    await create();
    expect(await service.list('admin')).toHaveLength(1);
  });

  it('rolls back credential disable when updating the Hub binding fails', async () => {
    const { key, secret } = await create();
    const client = await db.connection().client<Knex>();
    await client.raw(
      "CREATE TRIGGER fail_hub_key_disable BEFORE UPDATE OF disabled_at ON hub_api_keys BEGIN SELECT RAISE(ABORT, 'Disable rejected'); END",
    );
    await expect(service.disable(key.id, 'admin')).rejects.toThrow(
      'Disable rejected',
    );
    expect((await keyService.get(key.id))?.enabled).toBe(true);
    expect((await service.list('admin'))[0]?.status).toBe('active');
    await client.raw('DROP TRIGGER fail_hub_key_disable');
    await service.disable(key.id, 'admin');
    expect(await keyService.verify(secret)).toBeNull();
  });

  it('stores only a hash, lists summaries and records use', async () => {
    const { key, secret } = await create();
    expect(secret).toMatch(/^hub_app_[A-Za-z0-9_-]+$/);
    const row = await db
      .connection()
      .query.selectFrom('apikey')
      .selectAll()
      .executeTakeFirst();
    expect(row?.key).toBe(
      createHash('sha256').update(secret).digest('base64url'),
    );
    expect(JSON.stringify(row)).not.toContain(secret);
    const binding = await db
      .connection()
      .query.selectFrom('hubApiKeys')
      .selectAll()
      .where('id', '=', key.id)
      .executeTakeFirst();
    expect(binding).not.toHaveProperty('secretHash');
    expect(binding).not.toHaveProperty('key');
    expect(key.status).toBe('active');
    expect(await service.verify(secret, 'crm', 'upload-release')).toMatchObject(
      {
        id: key.id,
        createdBy: 'admin',
      },
    );
    const list = await service.list('admin');
    expect(list[0]?.lastUsedAt).not.toBeNull();
    expect(list[0]?.creatorName).toBe('admin');
    expect(JSON.stringify(list)).not.toContain(secret);
    expect(list[0]).not.toHaveProperty('secretHash');
  });
  it('denies unselected apps, missing scopes, invalid keys and unauthorized mutation', async () => {
    const { key, secret } = await create();
    await expect(
      service.verify(secret, 'erp', 'upload-release'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(service.verify(secret, 'crm', 'deploy')).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(
      service.verify(`${secret}x`, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
    await expect(service.disable(key.id, 'unprivileged')).rejects.toMatchObject(
      {
        name: 'AuthorizationDeniedError',
      },
    );
    await expect(service.remove(key.id, 'unprivileged')).rejects.toThrow();
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).resolves.toMatchObject({ id: key.id });
  });
  it('makes disable and deletion repeatable and immediately effective', async () => {
    const { key, secret } = await create();
    await service.disable(key.id, 'admin');
    await service.disable(key.id, 'admin');
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
    expect((await service.list('admin'))[0]?.status).toBe('disabled');
    await service.remove(key.id, 'admin');
    await service.remove(key.id, 'admin');
    expect(await service.list('admin')).toEqual([]);
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('rejects expired keys and malformed creation requests', async () => {
    for (const input of [
      { name: '', scopes: ['deploy'] },
      { name: 'CI', appIds: ['crm'], scopes: [] },
      { name: 'CI', appIds: ['crm'], scopes: ['remove'] },
      { name: 'CI', appIds: ['crm'], scopes: ['deploy'], expiresAt: 'bad' },
      {
        name: 'CI',
        appIds: ['crm'],
        scopes: ['deploy'],
        expiresAt: '2000-01-01',
      },
    ]) {
      await expect(
        service.create('admin', { appIds: ['crm'], ...input } as Parameters<
          HubApiKeyService['create']
        >[1]),
      ).rejects.toMatchObject({ status: 400 });
    }
    const { key, secret } = await create();
    await db
      .connection()
      .query.updateTable('apikey')
      .set({ expiresAt: new Date(0) })
      .where('id', '=', key.id)
      .execute();
    expect((await service.list('admin'))[0]?.status).toBe('expired');
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
  });
  it('requires key management and cannot grant missing owner permissions', async () => {
    for (const user of ['operator', 'unprivileged']) {
      await expect(
        service.create(user, {
          name: 'CI',
          appIds: ['crm'],
          scopes: ['deploy'],
        }),
      ).rejects.toThrow();
      if (user === 'unprivileged')
        await expect(service.list(user)).rejects.toThrow();
      else expect(await service.list(user)).toEqual([]);
    }
    await authz.permissionSets.create({
      key: 'key-manager',
      grants: [
        {
          resource: { type: 'hub.app', id: '*' },
          actions: [{ action: 'manage-api-keys' }],
        },
      ],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: 'unprivileged' },
      permissionSet: 'key-manager',
    });
    await expect(
      service.create('unprivileged', {
        name: 'CI',
        appIds: ['crm'],
        scopes: ['deploy'],
      }),
    ).rejects.toThrow();
    expect(await service.appOptions('unprivileged')).toEqual([]);
  });
  it('rechecks the owner and removes keys when an App is deleted', async () => {
    const { secret } = await create();
    await db
      .connection()
      .query.updateTable('user')
      .set({ disabledAt: new Date() })
      .where('id', '=', 'admin')
      .execute();
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
    await db
      .connection()
      .query.updateTable('user')
      .set({ disabledAt: null })
      .where('id', '=', 'admin')
      .execute();
    await authz.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'admin' },
      managedPermissionSets: ['hub-administrator'],
      permissionSets: [],
    });
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toThrow();
    await service.removeAppKeys('crm');
    await service.removeAppKeys('crm');
    expect(await keyService.verify(secret)).toBeNull();
    await db
      .connection()
      .query.deleteFrom('hubApps')
      .where('id', '=', 'crm')
      .execute();
    expect(
      await db
        .connection()
        .query.selectFrom('hubApiKeys')
        .select('id')
        .execute(),
    ).toEqual([]);
  });
  it('migrates legacy single-App keys without granting new write permissions', async () => {
    await migrate('@nocobase/app-plugin-hub', '../database/migrations');
    const connection = db.connection();
    await connection.builder.dropCollection('hubApiKeyApps');
    await connection.builder.dropCollection('hubApiKeys');
    const context = {
      connection,
      query: connection.query,
      builder: connection.builder,
    };
    await legacyMigration.up(context);
    const legacy = await keyService.create({ userId: 'admin', name: 'Legacy' });
    await connection.query
      .insertInto('hubAppApiKeys')
      .values({
        id: legacy.key.id,
        appId: 'crm',
        scopes: JSON.stringify([
          'read-release',
          'upload-release',
          'read-operation',
        ]),
        createdAt: new Date(),
        disabledAt: null,
        lastUsedAt: null,
      })
      .execute();
    await migration.up(context);
    await allAppsMigration.up(context);
    await recoveryMigration.up(context);
    await expect(service.reveal(legacy.key.id, 'admin')).rejects.toMatchObject({
      code: 'API_KEY_NOT_RECOVERABLE',
    });
    const keys = await service.list('admin');
    expect(keys[0].canCopy).toBe(false);
    expect(keys[0]).toMatchObject({
      id: legacy.key.id,
      scopes: ['upload-release'],
      apps: [{ id: 'crm', name: 'crm' }],
    });
    await expect(
      service.verify(legacy.secret, 'crm', 'deploy'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('binds one credential to multiple Apps and removes only the deleted App', async () => {
    const { key, secret } = await service.create('admin', {
      name: 'Shared',
      appIds: ['crm', 'erp', 'crm'],
      scopes: ['upload-release', 'deploy'],
    });
    expect(key.apps).toHaveLength(2);
    for (const appId of ['crm', 'erp'])
      await expect(
        service.verify(secret, appId, 'deploy'),
      ).resolves.toMatchObject({ id: key.id });
    await service.removeAppKeys('crm');
    await db
      .connection()
      .query.deleteFrom('hubApps')
      .where('id', '=', 'crm')
      .execute();
    await expect(service.verify(secret, 'crm', 'deploy')).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(
      service.verify(secret, 'erp', 'deploy'),
    ).resolves.toMatchObject({ id: key.id });
    expect((await service.list('admin'))[0]?.apps).toEqual([
      { id: 'erp', name: 'erp' },
    ]);
    await service.removeAppKeys('erp');
    expect(await keyService.verify(secret)).toBeNull();
  });

  it('automatically covers future Apps only for all-App keys and rechecks the owner', async () => {
    const global = await service.create('admin', {
      name: 'All Apps',
      allApps: true,
      appIds: [],
      scopes: ['deploy'],
    });
    const selected = await service.create('admin', {
      name: 'Selected',
      appIds: ['crm', 'erp'],
      scopes: ['deploy'],
    });
    expect(global.key).toMatchObject({ allApps: true, apps: [] });
    const now = new Date();
    await db
      .connection()
      .query.insertInto('hubApps')
      .values({
        id: 'future',
        name: 'Future',
        enabled: false,
        basePath: '/future',
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    await expect(
      service.verify(global.secret, 'future', 'deploy'),
    ).resolves.toHaveProperty('id');
    await expect(
      service.verify(selected.secret, 'future', 'deploy'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.verify(global.secret, 'future', 'upload-release'),
    ).rejects.toMatchObject({ status: 403 });
    await service.removeAppKeys('crm');
    await expect(
      service.verify(global.secret, 'future', 'deploy'),
    ).resolves.toHaveProperty('id');
    await authz.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'admin' },
      managedPermissionSets: ['hub-administrator'],
      permissionSets: [],
    });
    await expect(
      service.verify(global.secret, 'future', 'deploy'),
    ).rejects.toThrow();
  });

  it('rechecks App ownership for all-app keys after administrator demotion', async () => {
    const { secret } = await service.create('admin', {
      name: 'All Apps',
      allApps: true,
      appIds: [],
      scopes: ['upload-release', 'deploy'],
    });
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'admin' })
      .where('id', '=', 'crm')
      .execute();
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'operator' })
      .where('id', '=', 'erp')
      .execute();
    await authz.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'admin' },
      managedPermissionSets: ['hub-administrator', 'hub-operator'],
      permissionSets: ['hub-operator'],
    });
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).resolves.toHaveProperty('createdBy', 'admin');
    await expect(
      service.verify(secret, 'erp', 'upload-release'),
    ).rejects.toThrow();
    await expect(service.verify(secret, 'erp', 'deploy')).rejects.toThrow();
  });

  it('hides newly renamed foreign Apps on old selected keys after demotion while preserving revocation', async () => {
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'admin' })
      .where('id', '=', 'crm')
      .execute();
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'operator' })
      .where('id', '=', 'erp')
      .execute();
    const mixed = await service.create('admin', {
      name: 'Mixed Apps',
      appIds: ['crm', 'erp'],
      scopes: ['upload-release', 'deploy'],
    });
    const foreign = await service.create('admin', {
      name: 'Foreign App',
      appIds: ['erp'],
      scopes: ['deploy'],
    });
    await authz.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'admin' },
      managedPermissionSets: ['hub-administrator', 'hub-operator'],
      permissionSets: ['hub-operator'],
    });
    await db
      .query()
      .updateTable('hubApps')
      .set({ name: 'Private name after demotion' })
      .where('id', '=', 'erp')
      .execute();
    const keys = await service.list('admin');
    expect(keys.find((key) => key.id === mixed.key.id)?.apps).toEqual([
      { id: 'crm', name: 'crm' },
    ]);
    expect(keys.find((key) => key.id === foreign.key.id)?.apps).toEqual([]);
    expect(JSON.stringify(keys)).not.toContain('Private name after demotion');
    await expect(
      service.requirePermission('admin', 'erp', 'read'),
    ).rejects.toThrow();
    await expect(
      service.verify(mixed.secret, 'crm', 'deploy'),
    ).resolves.toHaveProperty('id');
    await expect(
      service.verify(mixed.secret, 'erp', 'deploy'),
    ).rejects.toThrow();
    // Visibility does not change stored bindings or destroy a key that the owner must still be able to revoke.
    expect(
      await db
        .query()
        .selectFrom('hubApiKeyApps')
        .selectAll()
        .where('keyId', '=', mixed.key.id)
        .execute(),
    ).toHaveLength(2);
    await service.disable(mixed.key.id, 'admin');
    await service.disable(mixed.key.id, 'admin');
    await service.remove(foreign.key.id, 'admin');
    await service.remove(foreign.key.id, 'admin');
    await expect(
      service.verify(mixed.secret, 'crm', 'deploy'),
    ).rejects.toMatchObject({ status: 401 });
    expect(await keyService.verify(foreign.secret)).toBeNull();
  });

  it('propagates authorization service failures instead of returning incomplete App metadata', async () => {
    await create();
    const failure = new Error('Authorization storage unavailable');
    const requirePermission = service.requirePermission.bind(service);
    const permission = vi
      .spyOn(service, 'requirePermission')
      .mockImplementation(async (userId, appId, action) => {
        if (action === 'read') throw failure;
        return requirePermission(userId, appId, action);
      });
    try {
      await expect(service.list('admin')).rejects.toBe(failure);
    } finally {
      permission.mockRestore();
    }
    expect((await service.list('admin'))[0]?.apps).toEqual([
      { id: 'crm', name: 'crm' },
    ]);
  });

  it('checks every selected App, rejects old permission names and leaves no partial credential', async () => {
    for (const input of [
      { appIds: [], scopes: ['deploy'] },
      { appIds: ['crm'], scopes: ['read-release'] },
      { appIds: ['crm'], scopes: ['read-operation'] },
      { appIds: ['crm'], scopes: ['deploy-release'] },
    ])
      await expect(
        service.create('admin', { name: 'Invalid', ...input } as Parameters<
          HubApiKeyService['create']
        >[1]),
      ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.create('admin', {
        name: 'Missing',
        appIds: ['crm', 'missing'],
        scopes: ['deploy'],
      }),
    ).rejects.toMatchObject({ status: 404 });
    await authz.permissionSets.create({
      key: 'limited-manager',
      grants: [
        {
          resource: { type: 'hub.app', id: '*' },
          actions: [{ action: 'manage-api-keys' }],
        },
        {
          resource: { type: 'hub.app', id: 'crm' },
          actions: [{ action: 'upload-release' }],
        },
      ],
    });
    await authz.permissionSets.assign({
      subject: { type: 'user', id: 'unprivileged' },
      permissionSet: 'limited-manager',
    });
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'unprivileged' })
      .where('id', '=', 'crm')
      .execute();
    expect(await service.appOptions('unprivileged')).toEqual([
      { id: 'crm', name: 'crm', permissions: ['upload-release'] },
    ]);
    await expect(
      service.create('unprivileged', {
        name: 'Escalation',
        appIds: ['crm', 'erp'],
        scopes: ['upload-release'],
      }),
    ).rejects.toThrow();
    expect(await service.list('admin')).toEqual([]);
    await expect(
      service.create('unprivileged', {
        name: 'All apps escalation',
        allApps: true,
        appIds: [],
        scopes: ['upload-release'],
      }),
    ).rejects.toThrow();
    const created = await service.create('unprivileged', {
      name: 'Allowed',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    await expect(
      service.verify(created.secret, 'crm', 'upload-release'),
    ).resolves.toHaveProperty('id');
  });
});

describe('Operator publishing key ownership', () => {
  beforeEach(async () => {
    await db
      .connection()
      .query.updateTable('hubApps')
      .set({ createdBy: 'operator' })
      .where('id', '=', 'crm')
      .execute();
    await db
      .connection()
      .query.updateTable('hubApps')
      .set({ createdBy: 'unprivileged' })
      .where('id', '=', 'erp')
      .execute();
    await authz.permissionSets.assign({
      subject: { type: 'user', id: 'unprivileged' },
      permissionSet: 'hub-operator',
    });
  });

  it('limits key lists and mutations to the creator while administrators retain revocation access', async () => {
    const own = await service.create('operator', {
      name: 'Operator CI',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const other = await service.create('unprivileged', {
      name: 'Other CI',
      appIds: ['erp'],
      scopes: ['deploy'],
    });
    expect(own.key.createdBy).toBe('operator');
    expect((await service.list('operator')).map((key) => key.id)).toEqual([
      own.key.id,
    ]);
    expect((await service.list('unprivileged')).map((key) => key.id)).toEqual([
      other.key.id,
    ]);
    expect(await service.list('admin')).toHaveLength(2);
    expect(await service.reveal(own.key.id, 'operator')).toBe(own.secret);
    for (const user of ['operator', 'admin']) {
      await expect(service.reveal(other.key.id, user)).rejects.toMatchObject({
        status: 403,
      });
    }
    await expect(
      service.disable(other.key.id, 'operator'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.remove(other.key.id, 'operator'),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      service.verify(other.secret, 'erp', 'deploy'),
    ).resolves.toHaveProperty('id');
    await service.disable(own.key.id, 'operator');
    await service.disable(own.key.id, 'operator');
    await expect(
      service.verify(own.secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
    await service.remove(own.key.id, 'operator');
    await service.remove(own.key.id, 'operator');
    await service.disable(other.key.id, 'admin');
    await service.remove(other.key.id, 'admin');
    expect(await service.list('admin')).toEqual([]);
  });

  it('restricts selectable Apps, creation and use to owned Apps and selected operations', async () => {
    expect((await service.appOptions('operator')).map((app) => app.id)).toEqual(
      ['crm'],
    );
    await expect(
      service.create('operator', {
        name: 'Escalation',
        appIds: ['crm', 'erp'],
        scopes: ['deploy'],
      }),
    ).rejects.toThrow();
    expect(await service.list('operator')).toEqual([]);
    const { secret } = await service.create('operator', {
      name: 'Upload only',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).resolves.toMatchObject({ createdBy: 'operator' });
    await expect(service.verify(secret, 'crm', 'deploy')).rejects.toMatchObject(
      { status: 403 },
    );
    await expect(
      service.verify(secret, 'erp', 'upload-release'),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('keeps all-App keys constrained by current ownership and owner permissions', async () => {
    const { secret } = await service.create('operator', {
      name: 'All accessible Apps',
      allApps: true,
      appIds: [],
      scopes: ['deploy'],
    });
    await expect(
      service.verify(secret, 'crm', 'deploy'),
    ).resolves.toHaveProperty('id');
    await expect(service.verify(secret, 'erp', 'deploy')).rejects.toThrow();
    await db
      .connection()
      .query.updateTable('hubApps')
      .set({ createdBy: 'operator' })
      .where('id', '=', 'erp')
      .execute();
    await expect(
      service.verify(secret, 'erp', 'deploy'),
    ).resolves.toHaveProperty('id');
    await db
      .connection()
      .query.updateTable('hubApps')
      .set({ createdBy: 'unprivileged' })
      .where('id', '=', 'crm')
      .execute();
    await expect(service.verify(secret, 'crm', 'deploy')).rejects.toThrow();
    await authz.permissionSets.replaceSubjectAssignments({
      subject: { type: 'user', id: 'operator' },
      managedPermissionSets: ['hub-operator'],
      permissionSets: [],
    });
    await expect(service.verify(secret, 'erp', 'deploy')).rejects.toThrow();
    await expect(service.list('operator')).rejects.toThrow();
  });
});

describe('Hub API Key HTTP boundary', () => {
  async function router(userId?: string, realHub?: HubService) {
    const container = new ServiceContainer();
    container.instance(
      authenticationToken,
      createAuthentication({
        connection: db.connection(),
        secret: 'test-only-auth-secret-at-least-32-characters',
        plugins: hubApiKeyAuthentication(),
      }),
    );
    if (userId) {
      const now = new Date();
      vi.spyOn(
        container.resolve(authenticationToken),
        'getSession',
      ).mockResolvedValue({
        user: {
          id: userId,
          name: userId,
          email: `${userId}@example.com`,
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        session: {
          id: 'session',
          token: 'test-session-token',
          userId,
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });
    }
    container.instance(authorizationToken, authz);
    container.instance(hubApiKeyServiceToken, service);
    const listReleases = vi
      .fn<HubService['listReleases']>()
      .mockResolvedValue([]);
    const deploy = vi
      .fn<HubService['deploy']>()
      .mockRejectedValue(new HubError('Deploy reached', 'DEPLOY_REACHED', 409));
    container.instance(
      hubServiceToken,
      realHub ??
        ({
          listReleases,
          getDeployment: vi.fn().mockResolvedValue({
            id: 'op-1',
            releaseId: 'r1',
            status: 'succeeded',
            phase: 'completed',
            config: { path: '/private/config' },
            error: 'sensitive diagnostic',
          }),
          createRelease: vi.fn(async (_appId, input) => {
            await input.authorizeDeployment?.();
            return {
              id: 'r1',
              version: '1.0.0',
              checksum: 'a'.repeat(64),
              size: 1,
              configTemplate: null,
              createdAt: new Date(),
              operationId: 'op-1',
            };
          }),
          deploy,
        } as unknown as HubService),
    );
    return {
      router: await apiRoutes.createRouter({
        container,
      } as AppPluginApplication),
      listReleases,
    };
  }
  it.each([false, true])(
    'rechecks role, account and revocation changes through HTTP and CLI (allApps=%s)',
    async (allApps) => {
      await db
        .query()
        .updateTable('hubApps')
        .set({ createdBy: 'admin' })
        .where('id', '=', 'crm')
        .execute();
      await db
        .query()
        .updateTable('hubApps')
        .set({ createdBy: 'operator' })
        .where('id', '=', 'erp')
        .execute();
      const publishing = await service.create('admin', {
        name: 'Transition acceptance',
        allApps,
        appIds: allApps ? [] : ['crm', 'erp'],
        scopes: ['upload-release', 'deploy'],
      });
      const { router: api } = await router();
      const { router: management } = await router('admin');
      const headers = { authorization: `Bearer ${publishing.secret}` };
      const status = (appId: string) =>
        api.request(`/hub/apps/${appId}/deployments/op-1/status`, { headers });
      const cliRoot = await mkdtemp(
        path.join(os.tmpdir(), 'hub-acl-transition-'),
      );
      vi.stubGlobal('fetch', (url: URL, init: RequestInit) => {
        const target = new URL(url);
        target.pathname = target.pathname.replace('/main/api', '');
        return api.request(new Request(target, init));
      });
      const deploy = (appId: string) =>
        publishToHub(
          'deploy',
          {
            hub: 'http://localhost/main',
            'app-id': appId,
            'api-key': publishing.secret,
            'release-id': 'r1',
            wait: false,
          },
          cliRoot,
          {},
        );
      try {
        expect((await status('crm')).status).toBe(200);
        expect((await status('erp')).status).toBe(200);
        // The stub's domain rejection proves authorized requests reached the deployment service.
        await expect(deploy('erp')).rejects.toMatchObject({
          code: 'DEPLOY_REACHED',
          exitCode: 1,
        });
        await authz.permissionSets.replaceSubjectAssignments({
          subject: { type: 'user', id: 'admin' },
          managedPermissionSets: ['hub-administrator', 'hub-operator'],
          permissionSets: ['hub-operator'],
        });
        await db
          .query()
          .updateTable('hubApps')
          .set({ name: 'Renamed after role change' })
          .where('id', '=', 'erp')
          .execute();
        expect((await status('crm')).status).toBe(200);
        expect((await status('erp')).status).toBe(403);
        await expect(deploy('crm')).rejects.toMatchObject({
          code: 'DEPLOY_REACHED',
          exitCode: 1,
        });
        await expect(deploy('erp')).rejects.toMatchObject({
          code: 'FORBIDDEN',
          exitCode: 1,
        });
        const listed = await management.request('/hub/api-keys');
        expect(listed.status).toBe(200);
        expect(await listed.text()).not.toContain('Renamed after role change');
        await db
          .query()
          .updateTable('user')
          .set({ disabledAt: new Date() })
          .where('id', '=', 'admin')
          .execute();
        expect((await status('crm')).status).toBe(401);
        await expect(deploy('crm')).rejects.toMatchObject({
          code: 'INVALID_API_KEY',
          exitCode: 1,
        });
        // Even a stale session supplied by the fixture cannot manage keys for a disabled account.
        expect((await management.request('/hub/api-keys')).status).toBe(401);
        await db
          .query()
          .updateTable('user')
          .set({ disabledAt: null })
          .where('id', '=', 'admin')
          .execute();
        expect((await status('crm')).status).toBe(200);
        expect((await status('erp')).status).toBe(403);
        await service.disable(publishing.key.id, 'admin');
        await service.disable(publishing.key.id, 'admin');
        expect((await status('crm')).status).toBe(401);
        await expect(deploy('crm')).rejects.toMatchObject({
          code: 'INVALID_API_KEY',
          exitCode: 1,
        });
        await service.remove(publishing.key.id, 'admin');
        await service.remove(publishing.key.id, 'admin');
        expect((await status('crm')).status).toBe(401);
      } finally {
        vi.unstubAllGlobals();
        await rm(cliRoot, { recursive: true, force: true });
      }
    },
  );

  it('publishes through the real CLI, Bearer boundary, artifact storage and deployment service', async () => {
    const root = await mkdtemp(
      path.join(os.tmpdir(), 'hub-publishing-acceptance-'),
    );
    const deploymentResult = Promise.withResolvers<void>();
    const hub = new DefaultHubService({
      database: db,
      hostController: {
        applyDeployment: vi.fn(async () => {
          await deploymentResult.promise;
          throw new Error('Simulated Host failure');
        }),
      } as unknown as HubHostController,
      config: {
        artifact: {
          driver: 'fs',
          location: path.join(root, 'artifacts'),
          visibility: 'private',
        },
        host: {
          enabled: true,
          driver: 'tsx',
          appRevisionsDir: path.join(root, 'deployments'),
          appVolumesDir: path.join(root, 'volumes'),
          configPath: path.join(root, 'host.yml'),
        },
      },
    });
    try {
      await mkdir(path.join(root, 'dist/server'), { recursive: true });
      await mkdir(path.join(root, 'storage/exports'), { recursive: true });
      await writeFile(
        path.join(root, 'dist/package.json'),
        JSON.stringify({ version: '1.0.0' }),
      );
      await writeFile(path.join(root, 'dist/server/embedded.js'), '');
      await createTar(
        {
          cwd: root,
          file: path.join(root, 'storage/exports/dist.tar.gz'),
          gzip: true,
        },
        ['dist'],
      );
      const publishing = await service.create('admin', {
        name: 'Acceptance',
        appIds: ['crm'],
        scopes: ['upload-release', 'deploy'],
      });
      const { router: api } = await router(undefined, hub);
      vi.stubGlobal('fetch', (url: URL, init: RequestInit) => {
        const target = new URL(url);
        target.pathname = target.pathname.replace('/main/api', '');
        return api.request(new Request(target, init));
      });
      await writeFile(path.join(root, 'runtime.yml'), 'feature: cli-config\n');
      const options = {
        config: path.join(root, 'runtime.yml'),
        hub: 'http://localhost/main',
        'app-id': 'crm',
        'api-key': publishing.secret,
        deploy: true,
        wait: false,
      };
      const first = await publishToHub('upload', options, root, {});
      const again = await publishToHub('upload', options, root, {});
      const stored = await hub.getDeployment('crm', String(first.operationId));
      expect(await readFile(stored.config.path!, 'utf8')).toContain(
        'feature: cli-config',
      );
      expect(
        (await hub.getRelease('crm', String(first.releaseId))).configTemplate,
      ).toBeNull();
      expect(first.operationId).toEqual(expect.any(String));
      expect(again).toMatchObject({
        releaseId: first.releaseId,
        operationId: first.operationId,
        reused: true,
      });
      deploymentResult.resolve();
      await vi.waitFor(async () => {
        expect(
          (await hub.getDeployment('crm', String(first.operationId))).status,
        ).toBe('failed');
      });
      await expect(
        publishToHub('upload', { ...options, wait: undefined }, root, {}),
      ).rejects.toMatchObject({ exitCode: 1, code: 'DEPLOYMENT_FAILED' });
      await expect(
        publishToHub('upload', { ...options, wait: false }, root, {}),
      ).rejects.toMatchObject({ exitCode: 1, code: 'DEPLOYMENT_FAILED' });
      expect(await hub.listReleases('crm')).toHaveLength(1);
      expect((await hub.listDeployments('crm')).total).toBe(1);
    } finally {
      deploymentResult.resolve();
      vi.unstubAllGlobals();
      await hub.shutdown();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('uses deploy permission for minimal results without exposing configuration or granting read access', async () => {
    const publishing = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const { router: api } = await router();
    const headers = { authorization: `Bearer ${publishing.secret}` };
    const result = await api.request('/hub/apps/crm/deployments/op-1/status', {
      headers,
    });
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      data: {
        operationId: 'op-1',
        releaseId: 'r1',
        status: 'succeeded',
        phase: 'completed',
      },
    });
    expect(
      (await api.request('/hub/apps/crm/deployments/op-1', { headers })).status,
    ).toBe(403);
    expect(
      (await api.request('/hub/apps/erp/deployments/op-1/status', { headers }))
        .status,
    ).toBe(403);
    expect(
      (
        await api.request('/hub/apps/crm/deployments/op-1/status', {
          headers: { authorization: `Bearer ${uploadOnly.secret}` },
        })
      ).status,
    ).toBe(403);
    expect(
      (await api.request('/hub/apps/crm/deployments/op-1/status')).status,
    ).toBe(401);
  });

  it('requires both selected permissions for an upload that also deploys', async () => {
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const publishing = await service.create('admin', {
      name: 'Both',
      appIds: ['crm'],
      scopes: ['upload-release', 'deploy'],
    });
    const { router: api } = await router();
    const send = (secret: string) =>
      api.request('/hub/apps/crm/releases', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secret}`,
          'content-type': 'application/gzip',
          'x-hub-deployment-intent': 'explicit',
        },
        body: new Uint8Array([1]),
      });
    expect((await send(uploadOnly.secret)).status).toBe(403);
    const accepted = await send(publishing.secret);
    expect(accepted.status).toBe(202);
    expect(await accepted.json()).toMatchObject({
      data: { releaseId: 'r1', operationId: 'op-1' },
    });
  });

  it('validates configured upload framing and requires deploy permission before reading configuration', async () => {
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const publishing = await service.create('admin', {
      name: 'Both',
      appIds: ['crm'],
      scopes: ['upload-release', 'deploy'],
    });
    const { router: api } = await router();
    const send = (
      secret: string,
      length: string,
      intent: string | undefined = 'explicit',
      body = 'feature: true\narchive',
    ) =>
      api.request('/hub/apps/crm/releases', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secret}`,
          'content-type': 'application/vnd.nocobase.release-upload.v1',
          'x-hub-config-length': length,
          ...(intent ? { 'x-hub-deployment-intent': intent } : {}),
        },
        body,
      });
    expect((await send(uploadOnly.secret, '14')).status).toBe(403);
    expect((await send(publishing.secret, '14')).status).toBe(202);
    for (const length of ['0', '-1', '1048577', 'invalid'])
      expect((await send(publishing.secret, length)).status).toBe(400);
    expect((await send(publishing.secret, '14', '')).status).toBe(400);
    expect(
      (await send(publishing.secret, '14', 'explicit', 'short')).status,
    ).toBe(400);
  });

  it('allows an Operator session to manage only its own keys through HTTP', async () => {
    await db
      .connection()
      .query.updateTable('hubApps')
      .set({ createdBy: 'operator' })
      .where('id', '=', 'crm')
      .execute();
    const adminKey = await create();
    const { router: operator } = await router('operator');
    const response = await operator.request('/hub/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'CI',
        appIds: ['crm'],
        scopes: ['upload-release'],
        userId: 'admin',
      }),
    });
    expect(response.status).toBe(200);
    const { data } = (await response.json()) as {
      data: { key: { id: string; createdBy: string }; secret: string };
    };
    expect(data.key.createdBy).toBe('operator');
    const list = await operator.request('/hub/api-keys');
    expect(await list.json()).toMatchObject({ data: [{ id: data.key.id }] });
    const path = `/hub/api-keys/${data.key.id}`;
    expect(
      (await operator.request(`${path}/reveal`, { method: 'POST' })).status,
    ).toBe(200);
    for (const [suffix, method] of [
      ['/reveal', 'POST'],
      ['/disable', 'POST'],
      ['', 'DELETE'],
    ]) {
      expect(
        (
          await operator.request(`/hub/api-keys/${adminKey.key.id}${suffix}`, {
            method,
          })
        ).status,
      ).toBe(403);
    }
    expect(
      (await operator.request(`${path}/disable`, { method: 'POST' })).status,
    ).toBe(200);
    expect((await operator.request(path, { method: 'DELETE' })).status).toBe(
      200,
    );
    expect(await service.list('operator')).toEqual([]);
    await expect(
      service.verify(adminKey.secret, 'crm', 'upload-release'),
    ).resolves.toHaveProperty('id');
  });

  it('enforces management and owner ACL for credential recovery with no-store', async () => {
    const { router: unprivileged } = await router('unprivileged');
    expect((await unprivileged.request('/hub/api-keys')).status).toBe(403);
    const { router: admin } = await router('admin');
    const response = await admin.request('/hub/api-keys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'CI',
        appIds: ['crm'],
        scopes: ['upload-release'],
      }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const created = (await response.json()) as {
      data: { key: { id: string }; secret: string };
    };
    const list = await admin.request('/hub/api-keys');
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.text()).not.toContain(created.data.secret);
    const revealPath = `/hub/api-keys/${created.data.key.id}/reveal`;
    const recovered = await admin.request(revealPath, { method: 'POST' });
    expect(recovered.status).toBe(200);
    expect(recovered.headers.get('cache-control')).toBe('no-store');
    expect(await recovered.json()).toEqual({
      data: { secret: created.data.secret },
    });
    expect(
      (await unprivileged.request(revealPath, { method: 'POST' })).status,
    ).toBe(403);
    const { router: anonymous } = await router();
    expect(
      (await anonymous.request(revealPath, { method: 'POST' })).status,
    ).toBe(401);
    expect(
      (
        await admin.request(revealPath, {
          method: 'POST',
          headers: { authorization: `Bearer ${created.data.secret}` },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await admin.request(revealPath, {
          method: 'POST',
          headers: { 'x-api-key': created.data.secret },
        })
      ).status,
    ).toBe(401);

    expect(
      (
        await admin.request(`/hub/api-keys/${created.data.key.id}/disable`, {
          method: 'POST',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await admin.request(`/hub/api-keys/${created.data.key.id}`, {
          method: 'DELETE',
        })
      ).status,
    ).toBe(200);
    expect(await service.list('admin')).toEqual([]);
  });
  it('accepts existing deploy permission and rejects reads, unselected Apps and cookie fallback', async () => {
    const { key, secret } = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const { router: api, listReleases } = await router();
    const headers = {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    };
    const deploy = (appId: string) =>
      api.request(`/hub/apps/${appId}/deploy`, {
        headers,
        method: 'POST',
        body: JSON.stringify({ releaseId: 'release' }),
      });
    expect((await deploy('crm')).status).toBe(409);
    expect((await deploy('erp')).status).toBe(403);
    for (const path of [
      '/hub/apps',
      '/hub/apps/crm/config',
      '/hub/api-keys',
      '/hub/apps/crm/releases',
      '/hub/apps/crm/deployments',
      '/hub/apps/crm/logs',
      '/hub/apps/crm/deployments/op-1/logs',
    ])
      expect((await api.request(path, { headers })).status).toBe(403);
    expect(listReleases).not.toHaveBeenCalled();
    expect(
      (await api.request('/hub/api-keys', { headers: { 'x-api-key': secret } }))
        .status,
    ).toBe(401);
    expect(
      (
        await api.request('/hub/apps/crm/deploy', {
          method: 'POST',
          headers: { authorization: 'Bearer bad', cookie: 'fake=session' },
        })
      ).status,
    ).toBe(401);
    await service.disable(key.id, 'admin');
    expect((await deploy('crm')).status).toBe(401);
  });
});

describe('Hub publishing configuration isolation', () => {
  it('cannot turn a publishing key into a user session or use a normal key for publishing', async () => {
    const { secret } = await create();
    await expect(
      authentication.getSession(new Headers({ 'x-api-key': secret })),
    ).rejects.toThrow();
    expect(
      await authentication.getSession(
        new Headers({ authorization: `Bearer ${secret}` }),
      ),
    ).toBeNull();
    const normal = await new ApiKeyService(authentication, 'default').create({
      userId: 'admin',
      name: 'User key',
    });
    expect(
      (
        await authentication.getSession(
          new Headers({ 'x-api-key': normal.secret }),
        )
      )?.user.id,
    ).toBe('admin');
    await expect(
      service.verify(normal.secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ status: 401 });
    await keyService.remove(normal.key.id);
    expect(
      await new ApiKeyService(authentication, 'default').get(normal.key.id),
    ).not.toBeNull();
  });

  it('requires Hub management for publishing configuration even with a real owner session', async () => {
    const call = (path: string, body?: object, cookie?: string) =>
      authentication.handler(
        new Request(`http://localhost:3000/api/auth${path}`, {
          method: body ? 'POST' : 'GET',
          headers: {
            'content-type': 'application/json',
            ...(cookie ? { cookie } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
      );
    const signup = await call('/sign-up/email', {
      name: 'Owner',
      email: 'owner@example.com',
      password: 'test-owner-password-123',
    });
    expect(signup.status).toBe(200);
    const cookie = signup.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const owner = await authentication.getSession(new Headers({ cookie }));
    expect(owner).not.toBeNull();
    const publishing = await keyService.create({
      userId: owner!.user.id,
      name: 'Publishing',
    });
    const normal = await new ApiKeyService(authentication, 'default').create({
      userId: owner!.user.id,
      name: 'Normal',
    });
    for (const [path, body] of [
      ['/api-key/create', { name: 'Bypass' }],
      ['/api-key/update', { keyId: publishing.key.id, enabled: true }],
      ['/api-key/delete', { keyId: publishing.key.id }],
    ] as const)
      expect(
        (await call(path, { ...body, configId: HUB_API_KEY_CONFIG_ID }, cookie))
          .status,
      ).toBe(403);
    expect(
      (
        await call(
          `/api-key/get?id=${publishing.key.id}&configId=${HUB_API_KEY_CONFIG_ID}`,
          undefined,
          cookie,
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await call(
          `/api-key/list?configId=${HUB_API_KEY_CONFIG_ID}`,
          undefined,
          cookie,
        )
      ).status,
    ).toBe(403);
    const list = await call('/api-key/list', undefined, cookie);
    expect(list.status).toBe(200);
    const text = await list.text();
    expect(text).toContain(normal.key.id);
    expect(text).not.toContain(publishing.key.id);
    expect(
      (
        await call(
          '/api-key/update',
          { keyId: publishing.key.id, enabled: true },
          cookie,
        )
      ).status,
    ).toBe(404);
    await keyService.disable(publishing.key.id);
    expect(await keyService.verify(publishing.secret)).toBeNull();
    await keyService.remove(publishing.key.id);
    await keyService.remove(publishing.key.id);
    expect(await keyService.get(publishing.key.id)).toBeNull();
  });
});
