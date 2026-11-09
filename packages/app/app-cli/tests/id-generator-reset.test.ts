import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
} from '@nocobase/db-testing';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server';
import { createAppDatabaseManager } from '@nocobase/app-server/database';
import {
  idGeneratorLifecycleToken,
  idGeneratorToken,
} from '@nocobase/app-server/id-generator';
import Reset from '../src/commands/db/reset.ts';
import {
  databaseCommandFixture,
  removeFixtureRoots,
} from './database-command-fixture.ts';
import { runAppCommand } from './command-output.ts';

const provisioned: ProvisionedTestDatabases[] = [];
afterEach(async () => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  for (const databases of provisioned.splice(0)) await databases.drop();
  removeFixtureRoots();
});

// This is a host adapter fixture, not the commercial allocation implementation.
async function fixture({
  mode = 'auto',
  missingFactory = false,
  failInitialize = false,
  failReset = '',
  failMigration = false,
  emptyMigrations = false,
  stuckShutdown = false,
} = {}) {
  const databases = await provisionTestDatabases({
    connections: ['main', 'reports', 'external'],
  });
  provisioned.push(databases);
  const database = {
    default: 'main',
    connections: {
      main: databases.connectionConfig('main'),
      reports: databases.connectionConfig('reports'),
      external: {
        ...databases.connectionConfig('external'),
        schemaManagement: 'external' as const,
      },
    },
  };
  const events: string[] = [];
  let sequence = 0;
  let app: Application;
  class AllocationProvider extends ServiceProvider<Application> {
    public readonly name = 'fixture-allocation';
    public override register(): void {
      app = this.app;
      const manager = app.container.resolve(databaseManagerToken);
      for (const name of Object.keys(database.connections)) {
        const connection = manager.connection(name);
        const reset = connection.resetManagedSchema.bind(connection);
        vi.spyOn(connection, 'resetManagedSchema').mockImplementation(
          async () => {
            events.push(`reset:${name}`);
            if (failReset === name) throw new Error('fixture reset failed');
            await reset();
          },
        );
      }
      const destroy = manager.destroy.bind(manager);
      vi.spyOn(manager, 'destroy').mockImplementation(async () => {
        events.push('destroy');
        await destroy();
      });
      if (missingFactory) return;
      app.container.resolve(idGeneratorLifecycleToken).registerFactory(() => ({
        initialize: async () => {
          events.push('initialize');
          if (failInitialize) throw new Error('fixture allocation failed');
          // The plugin must prepare its own coordination storage after reset.
          await manager
            .connection()
            .builder.createCollection('fixture_allocation', (c) =>
              c.integer('id').primary(),
            );
          await manager
            .query()
            .insertInto('fixture_allocation')
            .values({ id: 1 })
            .execute();
        },
        generate: () => {
          events.push('generate');
          return ++sequence;
        },
        generateString: () => String(++sequence),
        shutdown: async () => {
          expect(() =>
            app.container.resolve(idGeneratorToken).generate(),
          ).toThrow('permanently closed');
          events.push('close');
          if (stuckShutdown) {
            // Advance only the host cleanup budget; no database work uses fake timers.
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            queueMicrotask(() => {
              void vi.advanceTimersByTimeAsync(15_000);
            });
            await new Promise(() => {});
          }
          events.push('return');
        },
      }));
    }
  }
  const fixture = databaseCommandFixture({
    database: () => database,
    snowflake: mode === 'auto' ? { mode } : { workerId: 0 },
    serviceProviders: [AllocationProvider],
  });
  for (const name of ['main', 'reports']) {
    const migrationDirectory = fixture.paths.database(`${name}/migrations`);
    mkdirSync(migrationDirectory, { recursive: true });
    const check =
      mode === 'auto' && !missingFactory
        ? `
const coordinator = createAppDatabaseManager(config.get('database'));
try {
  const allocations = await coordinator.query().selectFrom('fixture_allocation').selectAll().execute();
  if (allocations.length !== 1) throw new Error('allocation missing during business task');
} finally { await coordinator.destroy(); }
`
        : '';
    if (!emptyMigrations)
      writeFileSync(
        path.join(migrationDirectory, '001_create.ts'),
        `
import { defineMigration } from '@nocobase/db';
import { createAppDatabaseManager } from '@nocobase/app-server/database';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineMigration({ name: '001_create', irreversible: true, async up({ builder, container, config, query }) {
${check}
const id = container.resolve(idGeneratorToken).generate();
${failMigration ? "throw new Error('fixture migration failed');" : "await builder.createCollection('business', c => c.integer('id').primary()); await query.insertInto('business').values({ id }).execute();"}
} });`,
      );
    const seedDirectory = fixture.paths.database(`${name}/seeds`);
    mkdirSync(seedDirectory, { recursive: true });
    writeFileSync(
      path.join(seedDirectory, '001_seed.ts'),
      `
import { defineSeed } from '@nocobase/db';
import { createAppDatabaseManager } from '@nocobase/app-server/database';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineSeed({ name: '001_seed', async run({ container, config, query }) {
${check}
const id = container.resolve(idGeneratorToken).generate();
${emptyMigrations ? '' : "await query.insertInto('business').values({ id }).execute();"}
} });`,
    );
  }
  async function withDatabase<T>(
    fn: (
      manager: NonNullable<ReturnType<typeof createAppDatabaseManager>>,
    ) => Promise<T>,
  ) {
    const manager = createAppDatabaseManager(database, fixture.paths)!;
    try {
      return await fn(manager);
    } finally {
      await manager.destroy();
    }
  }
  // Provision the external database through its owner's managed connection.
  const setup = createAppDatabaseManager(
    {
      ...database,
      connections: Object.fromEntries(
        Object.keys(database.connections).map((name) => [
          name,
          databases.connectionConfig(name),
        ]),
      ),
    },
    fixture.paths,
  )!;
  try {
    for (const name of Object.keys(database.connections)) {
      await setup
        .connection(name)
        .builder.createCollection('sentinel', (c) => c.integer('id').primary());
      await setup
        .query(name)
        .insertInto('sentinel')
        .values({ id: 1 })
        .execute();
    }
  } finally {
    await setup.destroy();
  }
  return { ...fixture, events, withDatabase };
}

describe('automatic IDs during real CLI reset', () => {
  it.each([
    { flags: [], targets: ['main'] },
    { flags: ['--connection', 'reports'], targets: ['reports'] },
    { flags: ['--all'], targets: ['main', 'reports'] },
  ])(
    'resets $targets before allocation, and retains the allocation through migrations and seeds',
    async ({ flags, targets }) => {
      const f = await fixture();
      const run = await runAppCommand(f.bind(Reset), [
        ...flags,
        '--force',
        '--no-collections',
        '--json',
      ]);
      expect(run.json()).toMatchObject({ ok: true });
      expect(f.events).toEqual([
        ...targets.map((name) => `reset:${name}`),
        'initialize',
        ...targets.flatMap(() => ['generate', 'generate']),
        'close',
        'return',
        'destroy',
      ]);
      for (const name of ['main', 'reports', 'external']) {
        const tables = await f.tables(name);
        expect(tables.includes('sentinel')).toBe(!targets.includes(name));
        if (targets.includes(name))
          await f.withDatabase(async (manager) => {
            expect(
              await manager
                .query(name)
                .selectFrom('business')
                .selectAll()
                .execute(),
            ).toHaveLength(2);
          });
      }
    },
  );

  it('resets and seeds even with an empty migrations directory', async () => {
    const f = await fixture({ emptyMigrations: true });
    const run = await runAppCommand(f.bind(Reset), [
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      ok: true,
      result: {
        results: [
          {
            kind: 'migrations',
            status: 'completed',
            fresh: true,
            executed: [],
          },
          { kind: 'seeds', status: 'completed', freshInstall: true },
        ],
      },
    });
    expect(f.events).toEqual([
      'reset:main',
      'initialize',
      'generate',
      'close',
      'return',
      'destroy',
    ]);
    expect(await f.tables('main')).not.toContain('sentinel');
  });

  it('previews all connections without reset, allocation or database mutations', async () => {
    const f = await fixture();
    const before = await Promise.all(
      ['main', 'reports', 'external'].map((name) => f.tables(name)),
    );
    const run = await runAppCommand(f.bind(Reset), [
      '--all',
      '--dry-run',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true, result: { dryRun: true } });
    expect(f.events).toEqual(['destroy']);
    expect(
      await Promise.all(
        ['main', 'reports', 'external'].map((name) => f.tables(name)),
      ),
    ).toEqual(before);
    await f.withDatabase(async (manager) => {
      for (const name of ['main', 'reports', 'external'])
        expect(
          await manager
            .query(name)
            .selectFrom('sentinel')
            .selectAll()
            .execute(),
        ).toEqual([{ id: 1 }]);
    });
  });

  it('keeps the original destructive confirmation requirement', async () => {
    const f = await fixture();
    const run = await runAppCommand(f.bind(Reset), ['--json']);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { code: 'FORCE_REQUIRED' },
    });
    expect(f.events).toEqual(['destroy']);
    expect(await f.tables('main')).toContain('sentinel');
  });

  it.each([{ missingFactory: true }, { failInitialize: true }])(
    'resets before reporting initialization failure: %j',
    async (options) => {
      const f = await fixture(options);
      const run = await runAppCommand(f.bind(Reset), [
        '--force',
        '--no-collections',
        '--json',
      ]);
      expect(run.json()).toMatchObject({
        ok: false,
        error: { message: expect.stringMatching(/factory|allocation failed/) },
      });
      expect(f.events[0]).toBe('reset:main');
      expect(f.events).not.toContain('generate');
      expect(f.events.at(-1)).toBe('destroy');
      if (options.failInitialize)
        expect(f.events).toEqual([
          'reset:main',
          'initialize',
          'close',
          'return',
          'destroy',
        ]);
      expect(await f.tables('main')).not.toContain('sentinel');
      expect(await f.tables('main')).not.toContain('business');
      expect(await f.tables('reports')).toContain('sentinel');
    },
  );

  it('stops after the second reset fails, without initializing or running any migration', async () => {
    const f = await fixture({ failReset: 'reports' });
    const run = await runAppCommand(f.bind(Reset), [
      '--all',
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('fixture reset failed'),
        details: {
          results: [
            { status: 'not-run' },
            { status: 'not-run' },
            { status: 'skipped' },
            { status: 'skipped' },
            { status: 'failed' },
            { status: 'not-run' },
          ],
        },
      },
    });
    expect(f.events).toEqual(['reset:main', 'reset:reports', 'destroy']);
    expect(await f.tables('main')).not.toContain('sentinel');
    expect(await f.tables('reports')).toContain('sentinel');
  });

  it('closes and returns before destroying connections after migration failure', async () => {
    const f = await fixture({ failMigration: true });
    const run = await runAppCommand(f.bind(Reset), [
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      ok: false,
      error: { message: expect.stringContaining('fixture migration failed') },
    });
    expect(f.events).toEqual([
      'reset:main',
      'initialize',
      'generate',
      'close',
      'return',
      'destroy',
    ]);
  });

  it('destroys connections after bounded cleanup times out', async () => {
    const f = await fixture({ stuckShutdown: true });
    const run = await runAppCommand(f.bind(Reset), [
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(run.json().warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('cleanup failed')]),
    );
    expect(f.events).toEqual([
      'reset:main',
      'initialize',
      'generate',
      'generate',
      'close',
      'destroy',
    ]);
  });

  it('retains manual reset behavior and leaves unselected default storage alone', async () => {
    const f = await fixture({ mode: 'manual' });
    const run = await runAppCommand(f.bind(Reset), [
      '--connection',
      'reports',
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual(['reset:reports', 'destroy']);
    expect(await f.tables('main')).toContain('sentinel');
    expect(await f.tables('main')).not.toContain('fixture_allocation');
  });
});
