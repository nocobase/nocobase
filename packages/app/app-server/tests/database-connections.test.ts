// db-test-portability: dialect-specific — resolves each dialect's connection configuration
import { ServiceContainer } from '@nocobase/service-provider';
import { SnowflakeIdGenerator } from '@nocobase/snowflake';
import { idGeneratorToken } from '../src/id-generator/token.js';
import type { ConnectionConfigFromDrivers } from '@nocobase/db';
import {
  appendFileSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import ts from 'typescript';
import { objectProvider } from '@nocobase/config/providers/object';
import postgres from '@nocobase/db-postgres';
import mysql from '@nocobase/db-mysql';
import sqlite from '@nocobase/db-sqlite';
import oracle from '@nocobase/db-oracle';
import mssql from '@nocobase/db-mssql';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  type AppDatabaseConfig as GenericAppDatabaseConfig,
  type AppDatabaseTaskContributions,
  planAppDatabaseTasks,
  runAppDatabaseTasks,
  type AppDatabaseTasksResult,
} from '../src/database/index.js';
import { executeAppDatabasePlan } from '../src/database/tasks.js';
import { createAppDatabaseTaskContributions } from '../src/plugins/resolve.js';

const drivers = { postgres, mysql, sqlite, oracle, mssql };
type AppDatabaseConfig = GenericAppDatabaseConfig<
  ConnectionConfigFromDrivers<typeof drivers>
>;

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'connections-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const config: AppDatabaseConfig = {
    drivers,
    default: 'main',
    connections: {
      analytics: {
        dialect: 'sqlite',
        filename: paths.storage('analytics/data.sqlite'),
        migrations: { autoRun: false },
        seeds: { autoRun: false },
      },
      main: { dialect: 'sqlite', filename: paths.storage('main/data.sqlite') },
    },
  };
  const contributions: AppDatabaseTaskContributions = {
    appPackageName: 'test-app',
    migrations: [],
    seeds: [],
  };
  return { root, paths, config, contributions };
}

function migration(
  directory: string,
  name: string,
  table: string,
  fail = false,
) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, `${name}.ts`),
    `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '${name}', async up({ builder }) {
${fail ? "throw new Error('intentional failure');" : `await builder.createCollection('${table}', c => { c.increments('id'); c.string('value'); });`}
}, async down({ builder }) { await builder.dropCollection('${table}'); } });`,
  );
}

function seed(directory: string, table: string) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    path.join(directory, '002_seed.ts'),
    `import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '002_seed', async run({ query }) {
await query.insertInto('${table}').values({ value: 'initial' }).execute();
} });`,
  );
}

async function inspect(
  config: AppDatabaseConfig,
  name: string,
  check: (client: Knex) => Promise<void>,
) {
  const database = createAppDatabaseManager(config)!;
  try {
    await check(await database.connection(name).client<Knex>());
  } finally {
    await database.destroy();
  }
}

describe('connection-bound application database tasks', () => {
  it('injects application config into manual migration and seed execution', async () => {
    const { config, paths, contributions } = fixture();
    const runtimeConfig = new AppConfig();
    await runtimeConfig.loadAll();
    runtimeConfig.mergeDefaults({
      initialAdmin: { username: 'configured-admin' },
    });
    const container = new ServiceContainer();
    container.instance(
      idGeneratorToken,
      new SnowflakeIdGenerator({ workerId: 0 }),
    );
    for (const kind of ['migrations', 'seeds'] as const) {
      const directory = paths.database(`main/${kind}`);
      mkdirSync(directory, { recursive: true });
      const define = kind === 'migrations' ? 'defineMigration' : 'defineSeed';
      const callback = kind === 'migrations' ? 'up' : 'run';
      writeFileSync(
        path.join(directory, '001_config.ts'),
        `
        import { ${define}, databaseManagerToken } from '@nocobase/db';
        import { idGeneratorToken } from '@nocobase/app-server/id-generator';
        export default ${define}({ name: '001_config', ${kind === 'migrations' ? 'irreversible: true,' : ''} async ${callback}({ config, container }) {
          if (!container.resolve(idGeneratorToken).generateString()) throw new Error('missing IDs');
          if (container.has(databaseManagerToken)) throw new Error('unrestricted container');
          if (config.get('initialAdmin.username') !== 'configured-admin') throw new Error('config not injected');
        } });
      `,
      );
      const result = await runAppDatabaseTasks(config, {
        kind,
        paths,
        contributions,
        runtimeConfig,
        container,
      });
      expect(result.ok).toBe(true);
      expect(result.results[0].executed).toEqual(['001_config']);
    }
  });

  it('prepares official drivers for standalone migration tasks', async () => {
    const { config, paths, contributions } = fixture();
    migration(paths.database('main/migrations'), '001_auto_driver', 'autoRows');
    const result = await runAppDatabaseTasks(
      { ...config, drivers: undefined },
      {
        paths,
        contributions,
        kind: 'migrations',
      },
    );
    expect(result.ok).toBe(true);
    await inspect(config, 'main', async (client) => {
      expect(await client.schema.hasTable('auto_rows')).toBe(true);
    });
  });

  it('isolates migrations, seeds and histories and runs plugins only on the default connection', async () => {
    const { config, paths, root } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    migration(
      paths.database('analytics/migrations'),
      '001_analytics',
      'analyticsRows',
    );
    seed(paths.database('main/seeds'), 'mainRows');
    seed(paths.database('analytics/seeds'), 'analyticsRows');
    const pluginDirectory = path.join(root, 'plugin/migrations');
    migration(pluginDirectory, '000_plugin', 'systemRows');
    const withPlugin = createAppDatabaseTaskContributions({
      appPackageName: 'test-app',
      plugins: [
        {
          metadata: {
            packageName: 'test-plugin',
            migrationsDirectory: pluginDirectory,
          },
        },
      ],
    } as Parameters<typeof createAppDatabaseTaskContributions>[0]);
    const result = await runAppDatabaseTasks(config, {
      paths,
      contributions: withPlugin,
      kind: 'migrations',
      all: true,
    });
    expect(result.results.map((r) => r.connection)).toEqual([
      'main',
      'analytics',
    ]);
    expect(result.results[0].executed).toEqual(['000_plugin', '001_main']);
    expect(result.results[1].executed).toEqual(['001_analytics']);
    await runAppDatabaseTasks(config, {
      paths,
      contributions: withPlugin,
      kind: 'seeds',
      all: true,
    });
    await inspect(config, 'analytics', async (client) => {
      expect(await client.schema.hasTable('system_rows')).toBe(false);
      expect(await client.schema.hasTable('main_rows')).toBe(false);
      expect(await client('analytics_rows').select('value')).toEqual([
        { value: 'initial' },
      ]);
    });
    const again = await runAppDatabaseTasks(config, {
      paths,
      contributions: withPlugin,
      kind: 'migrations',
      all: true,
    });
    expect(again.results.map((r) => r.executed)).toEqual([[], []]);
    const seeds = await runAppDatabaseTasks(config, {
      paths,
      contributions: withPlugin,
      kind: 'seeds',
      all: true,
    });
    expect(seeds.results.map((r) => r.executed)).toEqual([[], []]);
  });

  it('plans migrations and seeds together, and reseeds after a fresh rebuild', async () => {
    const { config, paths, contributions } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    seed(paths.database('main/seeds'), 'mainRows');
    const both = ['migrations', 'seeds'] as const;

    const applied = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: both,
    });
    expect(applied.results.map((r) => [r.kind, r.executed])).toEqual([
      ['migrations', ['001_main']],
      ['seeds', ['002_seed']],
    ]);
    await inspect(config, 'main', async (client) => {
      expect(await client('main_rows').select('value')).toEqual([
        { value: 'initial' },
      ]);
    });

    // Nothing is pending on a second run.
    const again = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: both,
    });
    expect(again.results.flatMap((r) => r.executed ?? [])).toEqual([]);

    // A reset drops the managed schema, including both history tables, then
    // runs migrations and seeds again from empty.
    await inspect(config, 'main', async (client) => {
      await client('main_rows').update({ value: 'edited' });
    });
    const reset = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: both,
      fresh: true,
    });
    expect(reset.results.map((r) => [r.kind, r.executed])).toEqual([
      ['migrations', ['001_main']],
      ['seeds', ['002_seed']],
    ]);
    await inspect(config, 'main', async (client) => {
      expect(await client('main_rows').select('value')).toEqual([
        { value: 'initial' },
      ]);
    });
  });

  it('refuses a rollback that would include seeds', async () => {
    const { config, paths, contributions } = fixture();
    seed(paths.database('main/seeds'), 'mainRows');
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: ['migrations', 'seeds'],
        operation: 'rollback',
      }),
    ).rejects.toThrow('A rollback covers migrations only; seeds have no down.');
  });

  it('refuses a fresh run that would seed a connection it never rebuilds', async () => {
    const { config, paths, contributions } = fixture();
    seed(paths.database('main/seeds'), 'mainRows');
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'seeds',
        fresh: true,
      }),
    ).rejects.toThrow('A fresh run must include migrations.');
  });

  it('resolves onChecksumMismatch from connection and legacy configuration', async () => {
    const { config, paths, contributions } = fixture();
    const directory = paths.database('main/migrations');
    migration(directory, '001_main', 'mainRows');
    seed(paths.database('main/seeds'), 'mainRows');
    const run = (
      kind: 'migrations' | 'seeds',
      override?: AppDatabaseConfig,
    ): Promise<AppDatabaseTasksResult> =>
      runAppDatabaseTasks(override ?? config, { paths, contributions, kind });
    await run('migrations');
    await run('seeds');
    for (const file of [
      'main/migrations/001_main.ts',
      'main/seeds/002_seed.ts',
    ])
      appendFileSync(paths.database(file), '\n// changed after execution\n');

    // Default policy: the drift is reported and the run continues.
    for (const kind of ['migrations', 'seeds'] as const) {
      const result = await run(kind);
      expect(result.ok).toBe(true);
      expect(result.results[0].warnings).toMatchObject([
        {
          packageName: 'test-app',
          name: kind === 'migrations' ? '001_main' : '002_seed',
        },
      ]);
    }

    // Configured on the connection.
    for (const kind of ['migrations', 'seeds'] as const) {
      await expect(
        run(kind, {
          ...config,
          connections: {
            ...config.connections,
            main: {
              ...config.connections.main,
              [kind]: { onChecksumMismatch: 'error' },
            },
          },
        }),
      ).rejects.toThrow('checksum changed');
    }

    // Configured through the legacy top-level field, which applies to the
    // default connection.
    await expect(
      run('migrations', {
        ...config,
        migrations: { onChecksumMismatch: 'error' },
      }),
    ).rejects.toThrow('checksum changed');

    // Repair clears it for both kinds, and the strict policy then passes.
    for (const kind of ['migrations', 'seeds'] as const) {
      const repaired = await runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind,
        operation: 'repair',
      });
      expect(repaired.results[0].repaired).toHaveLength(1);
      expect(repaired.results[0].dryRun).toBe(false);
      await expect(
        run(kind, {
          ...config,
          connections: {
            ...config.connections,
            main: {
              ...config.connections.main,
              [kind]: { onChecksumMismatch: 'error' },
            },
          },
        }),
      ).resolves.toMatchObject({ ok: true });
    }
  });

  it('ignores task sources that reach the database configuration', async () => {
    const { config, paths, root } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    const pluginDirectory = path.join(root, 'plugin/migrations');
    migration(pluginDirectory, '000_plugin', 'systemRows');
    const withPlugin = createAppDatabaseTaskContributions({
      appPackageName: 'test-app',
      plugins: [
        {
          metadata: {
            packageName: 'test-plugin',
            migrationsDirectory: pluginDirectory,
          },
        },
      ],
    } as Parameters<typeof createAppDatabaseTaskContributions>[0]);
    // config.yml deep-merges into the database namespace, so a key shaped like
    // the former taskSources field can appear there. Planning must not read it.
    const configured = {
      ...config,
      taskSources: { packageName: 'hijacked', migrations: [], seeds: [] },
    } as AppDatabaseConfig;
    const plan = planAppDatabaseTasks(configured, ['migrations'], {
      paths,
      contributions: withPlugin,
      all: true,
    });
    expect(
      plan
        .find((task) => task.connection === 'main')!
        .config.sources?.map((source) => source.packageName),
    ).toEqual(['test-app', 'test-plugin']);
  });

  it('manual selection ignores autoRun and never creates the unselected database', async () => {
    const { config, paths, contributions } = fixture();
    migration(
      paths.database('analytics/migrations'),
      '001_analytics',
      'analyticsRows',
    );
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
      connection: 'analytics',
    });
    expect(existsSync(paths.storage('main/data.sqlite'))).toBe(false);
    expect(existsSync(paths.storage('analytics/data.sqlite'))).toBe(true);
  });

  it('keeps startup order, skips disabled tasks and migrates before seeding each connection', async () => {
    const { config, paths, contributions } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    seed(paths.database('main/seeds'), 'mainRows');
    const database = createAppDatabaseManager(config)!;
    try {
      const plan = planAppDatabaseTasks(config, ['migrations', 'seeds'], {
        paths,
        contributions,
        autoRun: true,
      });
      const result = await executeAppDatabasePlan(database, config, plan, {
        paths,
      });
      expect(
        result.results.map((r) => [r.connection, r.kind, r.status]),
      ).toEqual([
        ['main', 'migrations', 'completed'],
        ['main', 'seeds', 'completed'],
        ['analytics', 'migrations', 'skipped'],
        ['analytics', 'seeds', 'skipped'],
      ]);
      expect(existsSync(paths.storage('analytics/data.sqlite'))).toBe(false);
    } finally {
      await database.destroy();
    }
  });

  it('reports committed, failed and unattempted connections and stops on failure', async () => {
    const { config, paths, contributions } = fixture();
    config.connections.zlast = {
      dialect: 'sqlite',
      filename: paths.storage('last/data.sqlite'),
    };
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    migration(
      paths.database('analytics/migrations'),
      '001_fail',
      'badRows',
      true,
    );
    migration(paths.database('zlast/migrations'), '001_last', 'lastRows');
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        all: true,
      }),
    ).rejects.toMatchObject({
      result: {
        ok: false,
        results: [
          { connection: 'main', status: 'completed' },
          { connection: 'analytics', status: 'failed' },
          { connection: 'zlast', status: 'not-run' },
        ],
      },
    });
    expect(existsSync(paths.storage('last/data.sqlite'))).toBe(false);
    await inspect(config, 'main', async (client) => {
      expect(await client.schema.hasTable('main_rows')).toBe(true);
    });
  });

  it('skips external databases without opening them and rejects explicit execution', async () => {
    const { config, paths, contributions } = fixture();
    config.connections.erp = {
      dialect: 'sqlite',
      filename: paths.storage('erp.sqlite'),
      schemaManagement: 'external',
    };
    const result = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'seeds',
      all: true,
    });
    expect(result.results.find((r) => r.connection === 'erp')).toMatchObject({
      status: 'skipped',
      reason: 'external',
    });
    expect(existsSync(paths.storage('erp.sqlite'))).toBe(false);
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'seeds',
        connection: 'erp',
      }),
    ).rejects.toThrow('external');
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        connection: 'erp',
      }),
    ).rejects.toThrow('external');
  });

  it('freshly clears managed objects and reruns migrations without calling down', async () => {
    const { config, paths, contributions } = fixture();
    const directory = paths.database('main/migrations');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_main.ts'),
      `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '001_main', async up({ builder }) {
  await builder.createCollection('freshRows', c => { c.increments('id'); c.string('value'); });
}, async down() { throw new Error('down must not be called'); } });`,
    );
    const first = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
    });
    expect(first.results[0].executed).toEqual(['001_main']);
    await inspect(config, 'main', async (client) => {
      await client('fresh_rows').insert({ value: 'stale' });
    });

    const fresh = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
      fresh: true,
      confirmFresh: async () => true,
    });
    expect(fresh.results[0]).toMatchObject({
      status: 'completed',
      fresh: true,
      executed: ['001_main'],
    });
    await inspect(config, 'main', async (client) => {
      expect(await client('fresh_rows').select('value')).toEqual([]);
    });
  });

  it('freshly skips external connections in all mode and rejects explicit external selection', async () => {
    const { config, paths, contributions } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    migration(
      paths.database('analytics/migrations'),
      '001_analytics',
      'analyticsRows',
    );
    config.connections.erp = {
      dialect: 'sqlite',
      filename: paths.storage('erp.sqlite'),
      schemaManagement: 'external',
    };
    const result = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
      all: true,
      fresh: true,
      confirmFresh: async () => true,
    });
    expect(
      result.results.find((entry) => entry.connection === 'main'),
    ).toMatchObject({
      status: 'completed',
      fresh: true,
      executed: ['001_main'],
    });
    expect(
      result.results.find((entry) => entry.connection === 'analytics'),
    ).toMatchObject({
      status: 'completed',
      fresh: true,
      executed: ['001_analytics'],
    });
    expect(
      result.results.find((entry) => entry.connection === 'erp'),
    ).toMatchObject({
      status: 'skipped',
      reason: 'external',
    });
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        connection: 'erp',
        fresh: true,
        confirmFresh: async () => true,
      }),
    ).rejects.toThrow('external');
  });

  it('preserves migration and seed history after moving legacy directories for a custom default', async () => {
    const { config, paths, contributions } = fixture();
    config.default = 'analytics';
    migration(paths.database('migrations'), '001_legacy', 'legacyRows');
    seed(paths.database('seeds'), 'legacyRows');
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
    });
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'seeds',
    });
    mkdirSync(paths.database('analytics'), { recursive: true });
    renameSync(
      paths.database('migrations'),
      paths.database('analytics/migrations'),
    );
    renameSync(paths.database('seeds'), paths.database('analytics/seeds'));
    for (const kind of ['migrations', 'seeds'] as const) {
      expect(
        (
          await runAppDatabaseTasks(config, {
            paths,
            contributions,
            kind,
          })
        ).results[0].executed,
      ).toEqual([]);
    }
    await inspect(config, 'analytics', async (client) => {
      expect(await client('legacy_rows').select('value')).toHaveLength(1);
    });
  });

  it('preflights conflicts, missing explicit sources and unknown connections before writing', async () => {
    const { config, paths, contributions } = fixture();
    migration(paths.database('main/migrations'), '001_main', 'mainRows');
    mkdirSync(paths.database('migrations'), { recursive: true });
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
      }),
    ).rejects.toThrow('Both legacy');
    rmSync(paths.database('migrations'), { recursive: true });
    config.connections.analytics.migrations = { directory: 'missing' };
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        all: true,
      }),
    ).rejects.toThrow('Explicit');
    expect(existsSync(paths.storage('main/data.sqlite'))).toBe(false);
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        connection: 'typo',
      }),
    ).rejects.toThrow('Unknown');
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        connection: 'main',
        all: true,
      }),
    ).rejects.toThrow('mutually exclusive');
  });

  it('rejects two managed aliases of the same target before creating storage', async () => {
    const { config, paths, contributions } = fixture();
    config.connections.analytics.filename = config.connections.main.filename;
    await expect(
      runAppDatabaseTasks(config, {
        paths,
        contributions,
        kind: 'migrations',
        all: true,
      }),
    ).rejects.toThrow('same database and schema');
    expect(existsSync(paths.storage('main/data.sqlite'))).toBe(false);
  });

  it('normalizes every SQLite path consistently, including database aliases and memory databases', async () => {
    const { config, paths, contributions } = fixture();
    config.connections.analytics = {
      dialect: 'sqlite',
      filename: 'unused.sqlite',
      database: 'nested/analytics.sqlite',
    } as AppDatabaseConfig['connections'][string];
    config.connections.main = {
      dialect: 'sqlite',
      filename: ':memory:',
      database: ':memory:',
    } as AppDatabaseConfig['connections'][string];
    migration(
      paths.database('analytics/migrations'),
      '001_analytics',
      'analyticsRows',
    );
    await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
      connection: 'analytics',
    });
    expect(existsSync(paths.storage('nested/analytics.sqlite'))).toBe(true);
    expect(existsSync(paths.storage(':memory:'))).toBe(false);
  });

  it('loads compiled per-connection sources from the runtime database directory', async () => {
    const { config, paths, root, contributions } = fixture();
    const source = paths.database('analytics/migrations');
    migration(source, '001_compiled', 'compiledRows');
    seed(paths.database('analytics/seeds'), 'compiledRows');
    const compiledPaths = createAppPaths({
      rootDir: root,
      databaseDir: path.join(root, 'dist/database'),
    });
    for (const [kind, name] of [
      ['migrations', '001_compiled'],
      ['seeds', '002_seed'],
    ]) {
      const directory = compiledPaths.database(`analytics/${kind}`);
      mkdirSync(directory, { recursive: true });
      const input = readFileSync(
        paths.database(`analytics/${kind}/${name}.ts`),
        'utf8',
      );
      writeFileSync(
        path.join(directory, `${name}.js`),
        ts.transpileModule(input, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      );
    }
    for (const kind of ['migrations', 'seeds'] as const) {
      const result = await runAppDatabaseTasks(config, {
        paths: compiledPaths,
        contributions,
        kind,
        connection: 'analytics',
      });
      expect(result.results[0].executed).toHaveLength(1);
      expect(
        (
          await runAppDatabaseTasks(config, {
            paths: compiledPaths,
            contributions,
            kind,
            connection: 'analytics',
          })
        ).results[0].executed,
      ).toEqual([]);
    }
    await inspect(config, 'analytics', async (client) => {
      expect(await client('compiled_rows').select('value')).toEqual([
        { value: 'initial' },
      ]);
    });
  });

  it('maps old environment task settings to a custom default without contaminating other connections', async () => {
    const { paths, contributions } = fixture();
    const config = new AppConfig();
    config.load(
      objectProvider({
        database: {
          drivers,
          default: 'analytics',
          connections: {
            analytics: {
              dialect: 'sqlite',
              filename: ':memory:',
              migrations: { autoRun: true },
            },
          },
        },
      }),
    );
    config.load(
      objectProvider({
        database: {
          migrations: { autoRun: false, tableName: 'legacy_history' },
          connections: { main: { dialect: 'sqlite', filename: ':memory:' } },
        },
      }),
    );
    await config.loadAll();
    const plan = planAppDatabaseTasks(
      config.get<AppDatabaseConfig>('database')!,
      ['migrations'],
      { paths, contributions, all: true },
    );
    expect(plan[0]).toMatchObject({
      connection: 'analytics',
      config: { autoRun: false, tableName: 'legacy_history' },
    });
    expect(plan[1].config.tableName).toBeUndefined();
    expect(plan[1].config.autoRun).toBe(false);
  });
});
