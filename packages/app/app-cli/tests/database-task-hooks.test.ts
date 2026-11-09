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
import {
  createAppDatabaseManager,
  databaseTaskHooksToken,
} from '@nocobase/app-server/database';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
import Apply from '../src/commands/db/apply.ts';
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

// Host hook fixture using isolated databases and the default Snowflake generator.
async function fixture({
  hooks = true,
  failHook = false,
  failReset = '',
  failMigration = false,
  emptyMigrations = false,
  failShutdown = false,
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
  const resets: (readonly string[])[] = [];
  let hookRan = false;
  let app: Application;
  class HookProvider extends ServiceProvider<Application> {
    public readonly name = 'fixture-hooks';
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
      const ids = app.container.resolve(idGeneratorToken);
      const generate = ids.generate.bind(ids);
      vi.spyOn(ids, 'generate').mockImplementation(() => {
        events.push('generate');
        return generate();
      });
      if (!hooks) return;
      app.container.resolve(databaseTaskHooksToken).add({
        name: 'fixture',
        beforeTasks: async ({ resetConnections }) => {
          events.push('beforeTasks');
          hookRan = true;
          resets.push(resetConnections);
          if (failHook) throw new Error('fixture hook failed');
          await manager
            .connection()
            .builder.createCollection('fixture_ready', (c) =>
              c.integer('id').primary(),
            );
          await manager
            .query()
            .insertInto('fixture_ready')
            .values({ id: 1 })
            .execute();
        },
      });
    }
    public override async shutdown(): Promise<void> {
      if (hookRan) {
        events.push('cleanup');
        if (failShutdown) throw new Error('fixture cleanup failed');
      }
    }
  }
  const fixture = databaseCommandFixture({
    database: () => database,
    serviceProviders: [HookProvider],
  });
  for (const name of ['main', 'reports']) {
    const migrationDirectory = fixture.paths.database(`${name}/migrations`);
    mkdirSync(migrationDirectory, { recursive: true });
    const check = hooks
      ? `
const coordinator = createAppDatabaseManager(config.get('database'));
try {
  const rows = await coordinator.query().selectFrom('fixture_ready').selectAll().execute();
  if (rows.length !== 1) throw new Error('hook state missing during business task');
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
const id = String(container.resolve(idGeneratorToken).generate());
${failMigration ? "throw new Error('fixture migration failed');" : "await builder.createCollection('business', c => c.string('id').primary()); await query.insertInto('business').values({ id }).execute();"}
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
const id = String(container.resolve(idGeneratorToken).generate());
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
  return { ...fixture, events, resets, withDatabase };
}

describe('database hooks during real CLI tasks', () => {
  it.each([
    { flags: [], targets: ['main'] },
    { flags: ['--connection', 'reports'], targets: ['reports'] },
    { flags: ['--all'], targets: ['main', 'reports'] },
  ])(
    'resets $targets before hooks, and retains the hook state through migrations and seeds',
    async ({ flags, targets }) => {
      const f = await fixture();
      const run = await runAppCommand(f.bind(Reset), [
        ...flags,
        '--force',
        '--no-collections',
        '--json',
      ]);
      expect(run.json()).toMatchObject({ ok: true });
      expect(f.resets).toEqual([targets]);
      expect(f.events).toEqual([
        ...targets.map((name) => `reset:${name}`),
        'beforeTasks',
        ...targets.flatMap(() => ['generate', 'generate']),
        'cleanup',
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
      'beforeTasks',
      'generate',
      'cleanup',
      'destroy',
    ]);
    expect(await f.tables('main')).not.toContain('sentinel');
  });

  it('previews all connections without reset, hooks or database mutations', async () => {
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

  it('reports a hook failure after resetting, without business execution', async () => {
    const f = await fixture({ failHook: true });
    const run = await runAppCommand(f.bind(Reset), [
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({
      ok: false,
      error: {
        message: expect.stringContaining('fixture hook failed'),
        details: { results: [{ status: 'failed' }, { status: 'not-run' }] },
      },
    });
    expect(f.events).toEqual([
      'reset:main',
      'beforeTasks',
      'cleanup',
      'destroy',
    ]);
    expect(await f.tables('main')).not.toContain('business');
  });

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

  it('cleans Providers before destroying connections after migration failure', async () => {
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
      'beforeTasks',
      'generate',
      'cleanup',
      'destroy',
    ]);
  });

  it('destroys connections even when a Provider cleanup fails', async () => {
    const f = await fixture({ failShutdown: true });
    const run = await runAppCommand(f.bind(Reset), [
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(run.json().warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('cleanup failed')]),
    );
    expect(f.events.at(-2)).toBe('cleanup');
    expect(f.events.at(-1)).toBe('destroy');
  });

  it('retains reset behavior without hooks and leaves unselected default storage alone', async () => {
    const f = await fixture({ hooks: false });
    const run = await runAppCommand(f.bind(Reset), [
      '--connection',
      'reports',
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual([
      'reset:reports',
      'generate',
      'generate',
      'destroy',
    ]);
    expect(await f.tables('main')).toContain('sentinel');
    expect(await f.tables('main')).not.toContain('fixture_ready');
  });
  it('runs once before normal migrations and seeds, using registered Providers without boot', async () => {
    const f = await fixture();
    const run = await runAppCommand(f.bind(Apply), [
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual([
      'beforeTasks',
      'generate',
      'generate',
      'cleanup',
      'destroy',
    ]);
    expect(f.resets).toEqual([[]]);
  });

  it('runs once before seeds when there are no migrations', async () => {
    const f = await fixture({ emptyMigrations: true });
    const run = await runAppCommand(f.bind(Apply), [
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual(['beforeTasks', 'generate', 'cleanup', 'destroy']);
    expect(f.resets).toEqual([[]]);
  });

  it('does not invoke hooks for a read-only plan preview', async () => {
    const f = await fixture();
    const run = await runAppCommand(f.bind(Apply), ['--dry-run', '--json']);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual(['destroy']);
    expect(await f.tables('main')).not.toContain('fixture_ready');
  });
  it('preserves per-connection reset/migrate/seed order without hooks', async () => {
    const f = await fixture({ hooks: false });
    const run = await runAppCommand(f.bind(Reset), [
      '--all',
      '--force',
      '--no-collections',
      '--json',
    ]);
    expect(run.json()).toMatchObject({ ok: true });
    expect(f.events).toEqual([
      'reset:main',
      'generate',
      'generate',
      'reset:reports',
      'generate',
      'generate',
      'destroy',
    ]);
  });
});
