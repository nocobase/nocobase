import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { c as createTar } from 'tar';
import {
  DefaultHubService,
  type HubHostController,
} from '../server/services/hub.js';
import { fileURLToPath } from 'node:url';
import { createCipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto';
import { createSecretsService } from '@nocobase/app-server/secrets';
import { decryptKey } from '../server/services/key-secret.js';
import { createHubKeySecretsStore } from '../server/services/key-secrets-store.js';
import { ApiKeyService } from '@nocobase/app-plugin-api-keys/server';
import {
  hubApiKeyAuthentication,
  HUB_API_KEY_CONFIG_ID,
} from '../server/api-key-auth.js';
import {
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
} from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
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

let testDatabase: TestDatabase;
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
  testDatabase = await createTestDatabase();
  db = testDatabase.database;
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
  service = new HubApiKeyService(db, authz, keyService, KEYS);
});
afterEach(async () => {
  await testDatabase.destroy();
});
/**
 * Makes every write of `method` to `table` inside a transaction the Hub opens
 * fail, the way a database rejecting the statement would, so a test can see
 * what the transaction rolls back. Restore the returned spy to stop it.
 */
function rejectTransactionWrites(
  method: 'insertInto' | 'updateTable',
  table: string,
  message: string,
) {
  const transaction = db.transaction.bind(db);
  return vi.spyOn(db, 'transaction').mockImplementation((fn, name) =>
    transaction((connection: DatabaseConnection) => {
      const query = connection.query;
      const reject = (target: string): void => {
        if (target === table) throw new Error(message);
      };
      if (method === 'insertInto') {
        const insertInto = query.insertInto.bind(query);
        vi.spyOn(query, 'insertInto').mockImplementation((target: string) => {
          reject(target);
          return insertInto(target);
        });
      } else {
        const updateTable = query.updateTable.bind(query);
        vi.spyOn(query, 'updateTable').mockImplementation((target: string) => {
          reject(target);
          return updateTable(target);
        });
      }
      return fn(connection);
    }, name),
  );
}
const HOST_BUILD_TARGET = {
  platform: 'linux',
  arch: 'x64',
  libc: 'glibc',
  nodeAbi: 137,
  nodeMajor: 24,
} as const;
/** The secrets the Hub seals key copies with in these tests, and the auth.secret older copies were stored under. */
const LEGACY_AUTH_SECRET = 'legacy-auth-secret-at-least-32-characters';
const KEYS = {
  secrets: createSecretsService({
    keys: [{ version: 1, key: 'a'.repeat(64) }],
  }),
  legacySecret: LEGACY_AUTH_SECRET,
};

/**
 * A copy written by Hub before the secrets service (`v1.`, under a key derived from `auth.secret`): the key
 * `hub_app_legacyFixtureSecret0123456789` of key `legacy-key-id`, owned by `admin`, stored under `LEGACY_AUTH_SECRET`.
 */
const LEGACY_FIXTURE =
  'v1.OO2llyPk9n5_wl4e.3oyUXMJld__rryotS9wsTg.Kaz2NbQlQ603HwFYkxXS4a7DH4JgwIZ7QQBKmDv9uA3YQrPvuQ';

/** How Hub stored a copy before the secrets service, to put one under a real key's id. */
function legacyCopy(secret: string, id: string, owner: string): string {
  const key = Buffer.from(
    hkdfSync(
      'sha256',
      LEGACY_AUTH_SECRET,
      'nocobase-hub',
      'publishing-key-recovery-v1',
      32,
    ),
  );
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(JSON.stringify([id, owner])));
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

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
    expect(row.encryptedSecret).toEqual(expect.stringMatching(/^nbs1\.1\./));
    expect(JSON.stringify(row)).not.toContain(secret);
    expect(JSON.stringify(await service.list('admin'))).not.toContain(secret);
    expect((await service.list('admin'))[0].canCopy).toBe(true);
    const restarted = new HubApiKeyService(db, authz, keyService, KEYS);
    await expect(restarted.reveal(key.id, 'admin')).resolves.toBe(secret);
    await expect(service.reveal(key.id, 'operator')).rejects.toThrow();
    await authz.permissionSets.assign({
      subject: { type: 'user', id: 'operator' },
      permissionSet: 'hub-administrator',
    });
    await expect(service.reveal(key.id, 'operator')).rejects.toMatchObject({
      code: 403,
    });
    expect((await service.list('operator'))[0].canCopy).toBe(false);
    const wrongSecret = new HubApiKeyService(db, authz, keyService, {
      secrets: createSecretsService({
        keys: [{ version: 1, key: '9'.repeat(64) }],
      }),
    });
    await expect(wrongSecret.reveal(key.id, 'admin')).rejects.toMatchObject({
      reason: 'API_KEY_NOT_RECOVERABLE',
    });
    const other = await create();
    await db
      .connection()
      .query.updateTable('hubApiKeys')
      .set({ encryptedSecret: row.encryptedSecret })
      .where('id', '=', other.key.id)
      .execute();
    await expect(service.reveal(other.key.id, 'admin')).rejects.toMatchObject({
      reason: 'API_KEY_NOT_RECOVERABLE',
    });
    await service.disable(key.id, 'admin');
    await expect(service.reveal(key.id, 'admin')).rejects.toMatchObject({
      reason: 'API_KEY_INACTIVE',
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
      code: 404,
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
    ).rejects.toThrow('secrets.keys');
    expect(await keyService.get('missing')).toBeNull();
    expect(
      await db.connection().query.selectFrom('apikey').select('id').execute(),
    ).toEqual([]);
    expect(await service.list('admin')).toEqual([]);
  });

  it('rolls back the plugin credential when the Hub binding insert fails', async () => {
    const rejection = rejectTransactionWrites(
      'insertInto',
      'hubApiKeyApps',
      'Binding rejected',
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
    rejection.mockRestore();
    await create();
    expect(await service.list('admin')).toHaveLength(1);
  });

  it('rolls back credential disable when updating the Hub binding fails', async () => {
    const { key, secret } = await create();
    const rejection = rejectTransactionWrites(
      'updateTable',
      'hubApiKeys',
      'Disable rejected',
    );
    await expect(service.disable(key.id, 'admin')).rejects.toThrow(
      'Disable rejected',
    );
    expect((await keyService.get(key.id))?.enabled).toBe(true);
    expect((await service.list('admin'))[0]?.status).toBe('active');
    rejection.mockRestore();
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
    ).rejects.toMatchObject({ code: 403 });
    await expect(service.verify(secret, 'crm', 'deploy')).rejects.toMatchObject(
      { code: 403 },
    );
    await expect(
      service.verify(`${secret}x`, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ code: 401 });
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
  it('makes disable repeatable, deletion final, and both immediately effective', async () => {
    const { key, secret } = await create();
    await service.disable(key.id, 'admin');
    await expect(service.disable(key.id, 'admin')).resolves.toMatchObject({
      id: key.id,
      status: 'disabled',
    });
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ code: 401 });
    expect((await service.list('admin'))[0]?.status).toBe('disabled');
    await service.remove(key.id, 'admin');
    await expect(service.remove(key.id, 'admin')).rejects.toMatchObject({
      code: 404,
      reason: 'API_KEY_NOT_FOUND',
    });
    expect(await service.list('admin')).toEqual([]);
    await expect(
      service.verify(secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ code: 401 });
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
      ).rejects.toMatchObject({ code: 400 });
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
    ).rejects.toMatchObject({ code: 401 });
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
    ).rejects.toMatchObject({ code: 401 });
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
      reason: 'API_KEY_NOT_RECOVERABLE',
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
    ).rejects.toMatchObject({ code: 403 });
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
      { code: 403 },
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
    ).rejects.toMatchObject({ code: 403 });
    await expect(
      service.verify(global.secret, 'future', 'upload-release'),
    ).rejects.toMatchObject({ code: 403 });
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
    await expect(service.remove(foreign.key.id, 'admin')).rejects.toMatchObject(
      { reason: 'API_KEY_NOT_FOUND' },
    );
    await expect(
      service.verify(mixed.secret, 'crm', 'deploy'),
    ).rejects.toMatchObject({ code: 401 });
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
      ).rejects.toMatchObject({ code: 400 });
    await expect(
      service.create('admin', {
        name: 'Missing',
        appIds: ['crm', 'missing'],
        scopes: ['deploy'],
      }),
    ).rejects.toMatchObject({
      code: 400,
      reason: 'APP_NOT_FOUND',
      fieldViolations: [{ field: 'appIds' }],
    });
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
        code: 403,
      });
    }
    await expect(
      service.disable(other.key.id, 'operator'),
    ).rejects.toMatchObject({ code: 403 });
    await expect(
      service.remove(other.key.id, 'operator'),
    ).rejects.toMatchObject({ code: 403 });
    await expect(
      service.verify(other.secret, 'erp', 'deploy'),
    ).resolves.toHaveProperty('id');
    await service.disable(own.key.id, 'operator');
    await service.disable(own.key.id, 'operator');
    await expect(
      service.verify(own.secret, 'crm', 'upload-release'),
    ).rejects.toMatchObject({ code: 401 });
    await service.remove(own.key.id, 'operator');
    await expect(service.remove(own.key.id, 'operator')).rejects.toMatchObject({
      reason: 'API_KEY_NOT_FOUND',
    });
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
      { code: 403 },
    );
    await expect(
      service.verify(secret, 'erp', 'upload-release'),
    ).rejects.toMatchObject({ code: 403 });
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
    const summary = {
      id: 'r1',
      appId: 'crm',
      artifactKey: 'crm/r1.tar.gz',
      version: '1.0.0',
      checksum: 'a'.repeat(64),
      size: 1,
      configTemplate: 'auth:\n  secret: sensitive\n',
      manifest: { nocobase: { buildTarget: HOST_BUILD_TARGET } },
      createdAt: new Date('2026-09-29T00:00:00.000Z'),
      buildTarget: HOST_BUILD_TARGET,
      running: true,
      everDeployed: true,
    };
    const listReleasesPage = vi
      .fn<HubService['listReleasesPage']>()
      .mockResolvedValue({ items: [summary], total: 1, page: 1, pageSize: 5 });
    const getReleaseSummary = vi
      .fn<HubService['getReleaseSummary']>()
      .mockResolvedValue(summary);
    const listDeployments = vi
      .fn<HubService['listDeployments']>()
      .mockResolvedValue({
        items: [
          {
            id: 'op-1',
            appId: 'crm',
            releaseId: 'r1',
            kind: 'deploy',
            rollbackTargetDeploymentId: null,
            previousDeploymentId: null,
            status: 'succeeded',
            phase: 'completed',
            config: { mode: 'file', path: '/private/config' },
            cacheHit: false,
            hostRevision: 3,
            error: null,
            createdAt: new Date('2026-09-29T00:01:00.000Z'),
            startedAt: new Date('2026-09-29T00:01:01.000Z'),
            finishedAt: new Date('2026-09-29T00:02:00.000Z'),
            release: { version: '1.0.0', checksum: 'a'.repeat(64) },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
      });
    const deploy = vi
      .fn<HubService['deploy']>()
      .mockRejectedValue(
        new HubError('Deploy reached', 'DEPLOY_REACHED', 'ABORTED'),
      );
    const createRelease = vi.fn<HubService['createRelease']>(async () => ({
      id: 'r1',
      appId: 'crm',
      artifactKey: 'crm/r1.tar.gz',
      version: '1.0.0',
      checksum: 'a'.repeat(64),
      size: 1,
      configTemplate: null,
      manifest: null,
      createdAt: new Date(),
      reused: false,
    }));
    const getApp = vi.fn<HubService['getApp']>(async (appId) => ({
      app: {
        id: appId,
        name: appId,
        description: null,
        currentDeploymentId: null,
        enabled: true,
        basePath: `/${appId}`,
        backend: 'in-process',
        startupMode: 'lazy',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      buildTarget: HOST_BUILD_TARGET,
      hasReleases: false,
      hasPendingDeployment: false,
      currentVersion: null,
      deployment: {
        desiredReleaseId: null,
        observedReleaseId: null,
        desiredState: 'running',
        observedState: 'stopped',
        activation: 'lazy',
        basePath: `/${appId}`,
        config: { mode: 'file', path: '/private/config' },
        error: null,
        updatedAt: new Date(),
      },
      runtime: {
        hostAvailable: true,
        state: 'stopped',
        version: null,
        startedAt: null,
        lastAccessedAt: null,
        activeRequests: 0,
        hostRevision: null,
        error: null,
      },
      hostUrl: null,
    }));
    container.instance(
      hubServiceToken,
      realHub ??
        ({
          listReleasesPage,
          getReleaseSummary,
          listDeployments,
          getDeployment: vi.fn().mockResolvedValue({
            id: 'op-1',
            releaseId: 'r1',
            status: 'succeeded',
            phase: 'completed',
            config: { path: '/private/config' },
            error: 'sensitive diagnostic',
          }),
          createRelease,
          getApp,
          deploy,
        } as unknown as HubService),
    );
    return {
      router: await apiRoutes.createRouter({
        container,
      } as AppPluginApplication),
      listReleasesPage,
      getReleaseSummary,
      listDeployments,
      createRelease,
      getApp,
    };
  }
  it.each([false, true])(
    'rechecks role, account and revocation changes through HTTP (allApps=%s)',
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
      const deploy = async (appId: string) => {
        const response = await api.request(`/hub/apps/${appId}/deploy`, {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/json' },
          body: JSON.stringify({ releaseId: 'r1' }),
        });
        const body = (await response.json()) as {
          readonly error?: { readonly reason?: string };
        };
        return { status: response.status, reason: body.error?.reason };
      };
      {
        expect((await status('crm')).status).toBe(200);
        expect((await status('erp')).status).toBe(200);
        // The stub's domain rejection proves authorized requests reached the deployment service.
        expect(await deploy('erp')).toEqual({
          status: 409,
          reason: 'DEPLOY_REACHED',
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
        expect(await deploy('crm')).toEqual({
          status: 409,
          reason: 'DEPLOY_REACHED',
        });
        expect(await deploy('erp')).toEqual({
          status: 403,
          reason: 'AUTHORIZATION_DENIED',
        });
        const listed = await management.request('/hub/apiKeys');
        expect(listed.status).toBe(200);
        expect(await listed.text()).not.toContain('Renamed after role change');
        await db
          .query()
          .updateTable('user')
          .set({ disabledAt: new Date() })
          .where('id', '=', 'admin')
          .execute();
        expect((await status('crm')).status).toBe(401);
        expect(await deploy('crm')).toEqual({
          status: 401,
          reason: 'INVALID_API_KEY',
        });
        // Even a stale session supplied by the fixture cannot manage keys for a disabled account.
        expect((await management.request('/hub/apiKeys')).status).toBe(401);
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
        expect(await deploy('crm')).toEqual({
          status: 401,
          reason: 'INVALID_API_KEY',
        });
        await service.remove(publishing.key.id, 'admin');
        expect((await status('crm')).status).toBe(401);
      }
    },
  );

  it('uploads through the Bearer boundary into artifact storage and deploys the stored Release separately', async () => {
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
      await writeFile(
        path.join(root, 'dist/package.json'),
        JSON.stringify({ version: '1.0.0' }),
      );
      await writeFile(path.join(root, 'dist/server/embedded.js'), '');
      const archive = path.join(root, 'dist.tar.gz');
      await createTar({ cwd: root, file: archive, gzip: true }, ['dist']);
      const bytes = await readFile(archive);
      const uploader = await service.create('admin', {
        name: 'Upload',
        appIds: ['crm'],
        scopes: ['upload-release'],
      });
      const deployer = await service.create('admin', {
        name: 'Deploy',
        appIds: ['crm'],
        scopes: ['deploy'],
      });
      const { router: api } = await router(undefined, hub);
      const upload = () =>
        api.request('/hub/apps/crm/releases', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${uploader.secret}`,
            'content-type': 'application/gzip',
            'x-artifact-sha256': createHash('sha256')
              .update(bytes)
              .digest('hex'),
          },
          body: bytes,
        });
      const firstResponse = await upload();
      expect(firstResponse.status).toBe(201);
      const first = (
        (await firstResponse.json()) as {
          readonly data: Record<string, unknown>;
        }
      ).data;
      expect(first).toMatchObject({
        releaseId: expect.any(String),
        id: first.releaseId,
        version: '1.0.0',
        reused: false,
      });
      expect(first).not.toHaveProperty('operationId');
      const again = await upload();
      expect(again.status).toBe(201);
      expect(await again.json()).toMatchObject({
        data: { releaseId: first.releaseId, reused: true },
      });
      expect((await hub.listDeployments('crm')).total).toBe(0);

      const deployed = await api.request('/hub/apps/crm/deploy', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${deployer.secret}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          releaseId: first.releaseId,
          config: { mode: 'file', content: 'feature: api-config\n' },
        }),
      });
      expect(deployed.status).toBe(202);
      const operation = (
        (await deployed.json()) as { readonly data: { readonly id: string } }
      ).data;
      const stored = await hub.getDeployment('crm', operation.id);
      expect(await readFile(stored.config.path!, 'utf8')).toContain(
        'feature: api-config',
      );
      // The upload key may observe the deployment's minimal status.
      const status = await api.request(
        `/hub/apps/crm/deployments/${operation.id}/status`,
        { headers: { authorization: `Bearer ${uploader.secret}` } },
      );
      expect(status.status).toBe(200);
      expect(await status.json()).toMatchObject({
        data: { operationId: operation.id, releaseId: first.releaseId },
      });
      // Without a readable Host status the App detail reports no build target.
      const detail = await api.request('/hub/apps/crm', {
        headers: { authorization: `Bearer ${deployer.secret}` },
      });
      expect(detail.status).toBe(200);
      expect(await detail.json()).toMatchObject({
        data: { app: { id: 'crm' }, buildTarget: null },
      });
      deploymentResult.resolve();
      await vi.waitFor(async () => {
        expect((await hub.getDeployment('crm', operation.id)).status).toBe(
          'failed',
        );
      });
      expect(await hub.listReleases('crm')).toHaveLength(1);
      expect((await hub.listDeployments('crm')).total).toBe(1);
    } finally {
      deploymentResult.resolve();
      await hub.shutdown();
      await rm(root, { recursive: true, force: true });
    }
  });

  it('lets any publishing key for the App read the minimal deployment status without exposing configuration', async () => {
    const deployOnly = await service.create('admin', {
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
    for (const secret of [deployOnly.secret, uploadOnly.secret]) {
      const headers = { authorization: `Bearer ${secret}` };
      const result = await api.request(
        '/hub/apps/crm/deployments/op-1/status',
        { headers },
      );
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
        (await api.request('/hub/apps/crm/deployments/op-1', { headers }))
          .status,
      ).toBe(403);
      expect(
        (
          await api.request('/hub/apps/erp/deployments/op-1/status', {
            headers,
          })
        ).status,
      ).toBe(403);
    }
    expect(
      (await api.request('/hub/apps/crm/deployments/op-1/status')).status,
    ).toBe(401);
  });

  it('returns App details with the Host build target to any publishing key for the App', async () => {
    const deployOnly = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const { router: api, getApp } = await router();
    for (const secret of [deployOnly.secret, uploadOnly.secret]) {
      const headers = { authorization: `Bearer ${secret}` };
      const detail = await api.request('/hub/apps/crm', { headers });
      expect(detail.status).toBe(200);
      const body = (await detail.json()) as {
        readonly data: Record<string, unknown>;
      };
      expect(body.data).toMatchObject({
        app: { id: 'crm' },
        buildTarget: HOST_BUILD_TARGET,
      });
      // The detail response carries no configuration location.
      expect(JSON.stringify(body)).not.toContain('/private/config');
      expect((await api.request('/hub/apps/erp', { headers })).status).toBe(
        403,
      );
      expect(
        (await api.request('/hub/apps/crm', { headers, method: 'DELETE' }))
          .status,
      ).toBe(403);
    }
    expect(getApp).toHaveBeenCalledTimes(2);
    const { router: signedIn } = await router('admin');
    const detail = await signedIn.request('/hub/apps/crm');
    expect(detail.status).toBe(200);
    expect(await detail.json()).toMatchObject({
      data: { buildTarget: HOST_BUILD_TARGET },
    });
  });

  it('lets upload-only and deploy-only keys read Releases and deployments of their App', async () => {
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const deployOnly = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const otherApp = await service.create('admin', {
      name: 'Other App',
      appIds: ['erp'],
      scopes: ['upload-release', 'deploy'],
    });
    const {
      router: api,
      listReleasesPage,
      getReleaseSummary,
      listDeployments,
    } = await router();
    const release = {
      id: 'r1',
      version: '1.0.0',
      checksum: 'a'.repeat(64),
      size: 1,
      createdAt: '2026-09-29T00:00:00.000Z',
      hasConfigTemplate: true,
      buildTarget: HOST_BUILD_TARGET,
      running: true,
      everDeployed: true,
    };
    for (const secret of [uploadOnly.secret, deployOnly.secret]) {
      const headers = { authorization: `Bearer ${secret}` };
      const list = await api.request('/hub/apps/crm/releases?pageSize=5', {
        headers,
      });
      expect(list.status).toBe(200);
      expect(await list.json()).toEqual({
        data: [release],
        meta: { page: 1, pageSize: 5, total: 1 },
      });
      const single = await api.request('/hub/apps/crm/releases/r1', {
        headers,
      });
      expect(single.status).toBe(200);
      expect(await single.json()).toEqual({ data: release });
      const deployments = await api.request(
        '/hub/apps/crm/deployments?page=1&pageSize=10',
        { headers },
      );
      expect(deployments.status).toBe(200);
      expect(await deployments.json()).toEqual({
        data: [
          {
            id: 'op-1',
            releaseId: 'r1',
            kind: 'deploy',
            status: 'succeeded',
            phase: 'completed',
            cacheHit: false,
            error: null,
            createdAt: '2026-09-29T00:01:00.000Z',
            finishedAt: '2026-09-29T00:02:00.000Z',
            config: { mode: 'file' },
            release: { version: '1.0.0', checksum: 'a'.repeat(64) },
          },
        ],
        meta: { page: 1, pageSize: 20, total: 1 },
      });
      const invalid = await api.request('/hub/apps/crm/releases?pageSize=0', {
        headers,
      });
      expect(invalid.status).toBe(400);
      expect(await invalid.json()).toMatchObject({
        error: {
          reason: 'INVALID_INPUT',
          fieldViolations: [{ field: 'pageSize' }],
        },
      });
    }
    expect(listReleasesPage).toHaveBeenCalledTimes(2);
    expect(listReleasesPage).toHaveBeenCalledWith('crm', {
      page: 1,
      pageSize: 5,
    });
    expect(getReleaseSummary).toHaveBeenCalledWith('crm', 'r1');
    expect(listDeployments).toHaveBeenCalledWith('crm', {
      page: 1,
      pageSize: 10,
    });
    const foreign = { authorization: `Bearer ${otherApp.secret}` };
    for (const url of [
      '/hub/apps/crm/releases',
      '/hub/apps/crm/releases/r1',
      '/hub/apps/crm/deployments',
    ]) {
      const response = await api.request(url, { headers: foreign });
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({
        error: {
          reason: 'API_KEY_FORBIDDEN',
          status: 'PERMISSION_DENIED',
          domain: 'hub',
        },
      });
    }
    expect(listReleasesPage).toHaveBeenCalledTimes(2);
  });

  it('accepts any-scope reads under whichever granted scope the creator still holds', async () => {
    await authz.permissionSets.create({
      key: 'crm-publisher',
      grants: [
        {
          resource: { type: 'hub.app', id: '*' },
          actions: [{ action: 'manage-api-keys' }],
        },
        {
          resource: { type: 'hub.app', id: 'crm' },
          actions: [{ action: 'upload-release' }, { action: 'deploy' }],
        },
      ],
    });
    await authz.permissionSets.create({
      key: 'crm-deployer',
      grants: [
        {
          resource: { type: 'hub.app', id: 'crm' },
          actions: [{ action: 'deploy' }],
        },
      ],
    });
    const publisher = await authz.permissionSets.assign({
      subject: { type: 'user', id: 'unprivileged' },
      permissionSet: 'crm-publisher',
    });
    await db
      .query()
      .updateTable('hubApps')
      .set({ createdBy: 'unprivileged' })
      .where('id', '=', 'crm')
      .execute();
    const both = await service.create('unprivileged', {
      name: 'Both',
      appIds: ['crm'],
      scopes: ['upload-release', 'deploy'],
    });
    // Narrow the creator to deploy alone after the key was issued.
    const deployer = await authz.permissionSets.assign({
      subject: { type: 'user', id: 'unprivileged' },
      permissionSet: 'crm-deployer',
    });
    await authz.permissionSets.revoke(publisher.id);
    await expect(
      service.verify(both.secret, 'crm', ['upload-release', 'deploy']),
    ).resolves.toMatchObject({ createdBy: 'unprivileged', scope: 'deploy' });
    await expect(
      service.verify(both.secret, 'crm', 'upload-release'),
    ).rejects.toThrow();
    const { router: api } = await router();
    const headers = { authorization: `Bearer ${both.secret}` };
    expect((await api.request('/hub/apps/crm', { headers })).status).toBe(200);
    expect(
      (
        await api.request('/hub/apps/crm/releases', {
          method: 'POST',
          headers: { ...headers, 'content-type': 'application/gzip' },
          body: new Uint8Array([1]),
        })
      ).status,
    ).toBe(403);
    await authz.permissionSets.revoke(deployer.id);
    expect((await api.request('/hub/apps/crm', { headers })).status).toBe(403);
    expect(
      (await api.request('/hub/apps/crm/deployments/op-1/status', { headers }))
        .status,
    ).toBe(403);
  });

  it('uploads with upload-release alone and never deploys from the upload route', async () => {
    const uploadOnly = await service.create('admin', {
      name: 'Upload',
      appIds: ['crm'],
      scopes: ['upload-release'],
    });
    const deployOnly = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const { router: api, createRelease } = await router();
    const send = (secret: string) =>
      api.request('/hub/apps/crm/releases', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${secret}`,
          'content-type': 'application/gzip',
          // Removed deployment headers are ignored rather than honored.
          'x-hub-deployment-intent': 'explicit',
          'x-hub-wait': 'true',
        },
        body: new Uint8Array([1]),
      });
    expect((await send(deployOnly.secret)).status).toBe(403);
    const accepted = await send(uploadOnly.secret);
    expect(accepted.status).toBe(201);
    const body = (await accepted.json()) as {
      readonly data: Record<string, unknown>;
    };
    expect(body.data).toMatchObject({
      id: 'r1',
      releaseId: 'r1',
      version: '1.0.0',
      reused: false,
    });
    expect(body.data).not.toHaveProperty('operationId');
    expect(createRelease).toHaveBeenCalledOnce();
    // Headers the request did not send are not passed on as undefined.
    expect(Object.keys(createRelease.mock.calls[0]![1]).sort()).toEqual([
      'stream',
    ]);
  });

  it('rejects the removed configured upload framing without reading the body', async () => {
    const publishing = await service.create('admin', {
      name: 'Both',
      appIds: ['crm'],
      scopes: ['upload-release', 'deploy'],
    });
    const { router: api, createRelease } = await router();
    const response = await api.request('/hub/apps/crm/releases', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${publishing.secret}`,
        'content-type': 'application/vnd.nocobase.release-upload.v1',
        'x-hub-config-length': '14',
        'x-hub-deployment-intent': 'explicit',
      },
      body: 'feature: true\narchive',
    });
    expect(response.status).toBe(415);
    expect(await response.json()).toMatchObject({
      error: {
        reason: 'INVALID_CONTENT_TYPE',
        status: 'INVALID_ARGUMENT',
        domain: 'hub',
      },
    });
    expect(createRelease).not.toHaveBeenCalled();
  });

  it('closes every undeclared route to publishing keys', async () => {
    const publishing = await service.create('admin', {
      name: 'Both',
      appIds: ['crm'],
      scopes: ['upload-release', 'deploy'],
    });
    const { router: api } = await router();
    const headers = {
      authorization: `Bearer ${publishing.secret}`,
      'content-type': 'application/json',
    };
    for (const [method, url] of [
      ['GET', '/hub/apps/crm/releases/r1/configTemplate'],
      ['GET', '/hub/apps/crm/deployments/op-1'],
      ['GET', '/hub/apps/crm/config'],
      ['PUT', '/hub/apps/crm/config'],
      ['PATCH', '/hub/apps/crm/settings'],
      ['POST', '/hub/apps/crm/rollback'],
      ['POST', '/hub/apps/crm/restart'],
      ['DELETE', '/hub/apps/crm'],
      ['POST', '/hub/apps'],
      ['GET', '/hub/host/status'],
      ['GET', '/hub/roles'],
    ] as const) {
      const response = await api.request(url, {
        method,
        headers,
        ...(method === 'GET' ? {} : { body: '{}' }),
      });
      expect(response.status, `${method} ${url}`).toBe(403);
      expect(await response.json()).toMatchObject({
        error: {
          reason: 'API_KEY_FORBIDDEN',
          status: 'PERMISSION_DENIED',
          domain: 'hub',
        },
      });
    }
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
    // The body is strict: a forged owner is rejected rather than silently ignored.
    const forged = await operator.request('/hub/apiKeys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'CI',
        appIds: ['crm'],
        scopes: ['upload-release'],
        userId: 'admin',
      }),
    });
    expect(forged.status).toBe(400);
    expect(await forged.json()).toMatchObject({
      error: { reason: 'INVALID_INPUT', domain: 'app' },
    });
    const response = await operator.request('/hub/apiKeys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'CI',
        appIds: ['crm'],
        scopes: ['upload-release'],
      }),
    });
    expect(response.status).toBe(201);
    const { data } = (await response.json()) as {
      data: { key: { id: string; createdBy: string }; secret: string };
    };
    expect(data.key.createdBy).toBe('operator');
    const list = await operator.request('/hub/apiKeys');
    expect(await list.json()).toMatchObject({ data: [{ id: data.key.id }] });
    const path = `/hub/apiKeys/${data.key.id}`;
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
          await operator.request(`/hub/apiKeys/${adminKey.key.id}${suffix}`, {
            method,
          })
        ).status,
      ).toBe(403);
    }
    const disabled = await operator.request(`${path}/disable`, {
      method: 'POST',
    });
    expect(disabled.status).toBe(200);
    expect(await disabled.json()).toMatchObject({
      data: { id: data.key.id, status: 'disabled' },
    });
    expect((await operator.request(path, { method: 'DELETE' })).status).toBe(
      204,
    );
    expect(
      await (await operator.request(path, { method: 'DELETE' })).json(),
    ).toMatchObject({ error: { reason: 'API_KEY_NOT_FOUND', domain: 'hub' } });
    expect(await service.list('operator')).toEqual([]);
    await expect(
      service.verify(adminKey.secret, 'crm', 'upload-release'),
    ).resolves.toHaveProperty('id');
  });

  it('enforces management and owner ACL for credential recovery with no-store', async () => {
    const { router: unprivileged } = await router('unprivileged');
    expect((await unprivileged.request('/hub/apiKeys')).status).toBe(403);
    const { router: admin } = await router('admin');
    const response = await admin.request('/hub/apiKeys', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'CI',
        appIds: ['crm'],
        scopes: ['upload-release'],
      }),
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const created = (await response.json()) as {
      data: { key: { id: string }; secret: string };
    };
    const list = await admin.request('/hub/apiKeys');
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.text()).not.toContain(created.data.secret);
    const revealPath = `/hub/apiKeys/${created.data.key.id}/reveal`;
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
        await admin.request(`/hub/apiKeys/${created.data.key.id}/disable`, {
          method: 'POST',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await admin.request(`/hub/apiKeys/${created.data.key.id}`, {
          method: 'DELETE',
        })
      ).status,
    ).toBe(204);
    expect(await service.list('admin')).toEqual([]);
  });
  it('accepts existing deploy permission and rejects undeclared reads, unselected Apps and cookie fallback', async () => {
    const { key, secret } = await service.create('admin', {
      name: 'Deploy',
      appIds: ['crm'],
      scopes: ['deploy'],
    });
    const { router: api, listReleasesPage } = await router();
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
      '/hub/apiKeys',
      '/hub/apps/crm/deployments/op-1',
      '/hub/apps/crm/logs',
      '/hub/apps/crm/deployments/op-1/logs',
    ])
      expect((await api.request(path, { headers })).status).toBe(403);
    expect(listReleasesPage).not.toHaveBeenCalled();
    expect(
      (await api.request('/hub/apiKeys', { headers: { 'x-api-key': secret } }))
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
    ).rejects.toMatchObject({ code: 401 });
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

describe('Hub key copies stored before the secrets service', () => {
  it('opens the legacy fixture with the auth.secret it was stored under', () => {
    expect(
      decryptKey(LEGACY_FIXTURE, 'legacy-key-id', 'admin', {
        legacySecret: LEGACY_AUTH_SECRET,
      }),
    ).toBe('hub_app_legacyFixtureSecret0123456789');
    expect(() =>
      decryptKey(LEGACY_FIXTURE, 'legacy-key-id', 'someone-else', {
        legacySecret: LEGACY_AUTH_SECRET,
      }),
    ).toThrow();
    expect(() =>
      decryptKey(LEGACY_FIXTURE, 'legacy-key-id', 'admin', {
        legacySecret: 'another-auth-secret-at-least-32-characters',
      }),
    ).toThrow();
  });

  it('reveals a legacy copy, and the secrets store reseals it with the secrets service', async () => {
    const { key, secret } = await create();
    await db
      .connection()
      .query.updateTable('hubApiKeys')
      .set({ encryptedSecret: legacyCopy(secret, key.id, 'admin') })
      .where('id', '=', key.id)
      .execute();
    await expect(service.reveal(key.id, 'admin')).resolves.toBe(secret);

    const store = createHubKeySecretsStore(
      () => db.connection(),
      () => LEGACY_AUTH_SECRET,
    );
    const context = { secrets: KEYS.secrets, batchSize: 10, dryRun: false };
    expect(await store.status(context)).toEqual({
      total: 1,
      byVersion: { legacy: 1 },
      needsReseal: 1,
      legacy: 1,
    });
    expect(await store.reseal(context)).toEqual({ resealed: 1, failed: 0 });
    expect(await store.status(context)).toEqual({
      total: 1,
      byVersion: { '1': 1 },
      needsReseal: 0,
    });
    // Readable without auth.secret now.
    const withoutLegacy = new HubApiKeyService(db, authz, keyService, {
      secrets: KEYS.secrets,
    });
    await expect(withoutLegacy.reveal(key.id, 'admin')).resolves.toBe(secret);
  });
});
