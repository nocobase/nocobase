import type { DatabaseManager } from '@nocobase/db';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/db-testing';
import { ServiceContainer } from '@nocobase/service-provider';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  AppConfig,
  defaultAppConfigs,
  defineAppConfig,
  PLACEHOLDER_SECRET,
} from '../src/config/index.js';
import type { AppRuntimeContext } from '../src/runtime/definition.js';
import type { AppPluginApplication } from '../src/plugins/index.js';
import {
  createSecretsService,
  createSecretsTableStore,
  defineSecretsConfig,
  SecretsProvider,
  secretsServiceToken,
  type SecretsService,
} from '../src/secrets/index.js';
import { SessionProvider, sessionManagerToken } from '../src/session/index.js';

const v1 = { version: 1, key: '1'.repeat(64) };
const v2 = { version: 2, key: '2'.repeat(64) };

describe('createSecretsService', () => {
  it('is not ready without keys and says how to configure them', () => {
    const service = createSecretsService({ keys: [] });
    expect(service.ready).toBe(false);
    expect(service.currentVersion).toBeUndefined();
    expect(() => service.seal('x', { purpose: 'p' })).toThrow(
      expect.objectContaining({
        code: 'SECRETS_NOT_CONFIGURED',
        message: expect.stringContaining('secrets.keys'),
      }),
    );
    expect(() => service.keyring('p')).toThrow(
      expect.objectContaining({ code: 'SECRETS_NOT_CONFIGURED' }),
    );
  });

  it('seals with the current key, opens older ones and reports what needs resealing', () => {
    const before = createSecretsService({ keys: [v1] });
    const sealed = before.seal('value', { purpose: 'p', aad: ['row'] });
    const after = createSecretsService({ keys: [v2, v1] });
    expect(after.currentVersion).toBe(2);
    expect(after.inspect(sealed)).toEqual({ version: 1 });
    expect(after.needsReseal(sealed)).toBe(true);
    expect(after.open(sealed, { purpose: 'p', aad: ['row'] })).toBe('value');
    expect(after.needsReseal(after.seal('value', { purpose: 'p' }))).toBe(
      false,
    );
    expect(after.keyring('p').map((entry) => entry.version)).toEqual([2, 1]);
  });

  it('refuses a duplicate store name', () => {
    const service = createSecretsService({ keys: [v1] });
    const store = createSecretsTableStore({
      name: 'one',
      table: 't',
      columns: [],
      connection: () => {
        throw new Error('unused');
      },
    });
    service.registerStore(store);
    expect(() => service.registerStore(store)).toThrow('already registered');
    expect(service.stores()).toEqual([store]);
  });
});

describe('secrets configuration', () => {
  it('reads SECRETS_KEYS and rejects weak, placeholder and duplicate keys', async () => {
    const config = await createConfig({
      SECRETS_KEYS: `2:${v2.key},1:short,2:${PLACEHOLDER_SECRET}`,
    });
    expect(config.get('secrets.keys')).toEqual([
      v2,
      { version: 1, key: 'short' },
      { version: 2, key: PLACEHOLDER_SECRET },
    ]);
    const issues = await config.validate();
    expect(issues.map((issue) => [issue.path, issue.message])).toEqual([
      ['secrets.keys.1', expect.stringContaining('too short')],
      ['secrets.keys.2', 'version 2 appears twice.'],
      ['secrets.keys.2', expect.stringContaining('placeholder')],
    ]);
  });

  it('accepts a valid list', async () => {
    const config = await createConfig({
      SECRETS_KEYS: `2:${v2.key},1:${v1.key}`,
    });
    expect(await config.validate()).toEqual([]);
  });
});

describe('session keys', () => {
  it('derives the cookie keys from the secrets keys when session.secret is not set', async () => {
    const container = new ServiceContainer();
    const config = await createConfig({
      SECRETS_KEYS: `2:${v2.key},1:${v1.key}`,
    });
    const app = { config, container } as unknown as AppPluginApplication;
    new SecretsProvider(app).register();
    new SessionProvider(app).register();
    const keyring = container
      .resolve(secretsServiceToken)
      .keyring('@nocobase/session/cookie');
    const manager = container.resolve(sessionManagerToken);
    expect(manager.config.secret).toBe(keyring[0]!.value);
    expect(manager.config.previousSecrets).toEqual([keyring[1]!.value]);
  });
});

describe('createSecretsTableStore', () => {
  let databases: ProvisionedTestDatabases | undefined;
  let testDatabase: TestDatabase | undefined;
  let database: DatabaseManager;

  beforeAll(async () => {
    databases = await provisionTestDatabases();
  });
  afterAll(async () => {
    await databases?.drop();
  });
  beforeEach(async () => {
    testDatabase = await databases!.open();
    database = testDatabase.database;
    await database.builder().createCollection('vault', (collection) => {
      collection.string('id').primary().notNull();
      collection.text('secret').nullable();
      collection.text('legacy').nullable();
    });
  });
  afterEach(async () => {
    await testDatabase?.destroy();
  });

  const store = (): ReturnType<typeof createSecretsTableStore> =>
    createSecretsTableStore({
      name: 'vault',
      table: 'vault',
      columns: [
        { column: 'secret', purpose: 'vault', aad: (row) => [String(row.id)] },
        {
          column: 'legacy',
          purpose: 'vault/legacy',
          legacy: {
            matches: (value) => value.startsWith('plain:'),
            open: (value) => value.slice('plain:'.length),
          },
        },
      ],
      connection: () => database.connection(),
    });

  const context = (secrets: SecretsService, dryRun = false) => ({
    secrets,
    batchSize: 2,
    dryRun,
  });

  it('reports versions and reseals in batches, idempotently', async () => {
    const before = createSecretsService({ keys: [v1] });
    const rows = ['a', 'b', 'c'].map((id) => ({
      id,
      secret: before.seal(`secret-${id}`, { purpose: 'vault', aad: [id] }),
      legacy: id === 'a' ? 'plain:old' : null,
    }));
    await database
      .connection()
      .query.insertInto('vault')
      .values(rows)
      .execute();

    const after = createSecretsService({ keys: [v2, v1] });
    expect(await store().status(context(after))).toEqual({
      total: 4,
      byVersion: { '1': 3, legacy: 1 },
      needsReseal: 4,
      legacy: 1,
    });
    expect(await store().reseal(context(after, true))).toEqual({
      resealed: 4,
      failed: 0,
    });
    expect((await store().status(context(after))).needsReseal).toBe(4);

    expect(await store().reseal(context(after))).toEqual({
      resealed: 4,
      failed: 0,
    });
    expect(await store().status(context(after))).toEqual({
      total: 4,
      byVersion: { '2': 4 },
      needsReseal: 0,
    });
    expect(await store().reseal(context(after))).toEqual({
      resealed: 0,
      failed: 0,
    });

    const current = createSecretsService({ keys: [v2] });
    const stored = await database
      .connection()
      .query.selectFrom('vault')
      .selectAll()
      .orderBy('id', 'asc')
      .execute<{ id: string; secret: string; legacy: string | null }>();
    expect(
      stored.map((row) =>
        current.open(row.secret, { purpose: 'vault', aad: [row.id] }),
      ),
    ).toEqual(['secret-a', 'secret-b', 'secret-c']);
    expect(current.open(stored[0]!.legacy!, { purpose: 'vault/legacy' })).toBe(
      'old',
    );
  });

  it('counts a value it cannot open as failed and leaves it', async () => {
    const other = createSecretsService({
      keys: [{ version: 1, key: '9'.repeat(64) }],
    });
    await database
      .connection()
      .query.insertInto('vault')
      .values({
        id: 'a',
        secret: other.seal('x', { purpose: 'vault', aad: ['a'] }),
      })
      .execute();
    const service = createSecretsService({ keys: [v2, v1] });
    expect(await store().reseal(context(service))).toEqual({
      resealed: 0,
      failed: 1,
    });
  });
});

async function createConfig(env: Record<string, string>): Promise<AppConfig> {
  const config = new AppConfig();
  await config.loadAll();
  const defaults = defaultAppConfigs({
    secrets: defineSecretsConfig(),
    session: defineAppConfig(() => sessionDefaults),
  });
  config.mergeDefaults(defaults({} as AppRuntimeContext));
  config.defineSections(defaults.sections!);
  await config.loadSectionEnvironment(env);
  return config;
}

const sessionDefaults = {
  enabled: true,
  default: 'memory',
  cookie: {
    name: 's',
    path: '/',
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    partitioned: false,
    expireOnClose: false,
  },
  lifetime: { absolute: '2h', rolling: true },
  gcLottery: { hits: 2, total: 100 },
  stores: { memory: { driver: 'memory', base: 's:' } },
};
