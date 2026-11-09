import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { SnowflakeIdGenerator } from '@nocobase/snowflake';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  DatabaseProvider,
  databaseTaskHooksToken,
  runAppDatabaseTasks,
  planAppDatabaseTasks,
  type AppDatabaseTaskOperation,
} from '../src/database/index.js';
import { executeAppDatabasePlan } from '../src/database/tasks.js';
import { createDatabaseTaskHooks } from '../src/database/task-hooks.js';
import * as storage from '../src/database/storage.js';
import {
  IdGeneratorProvider,
  idGeneratorToken,
} from '../src/id-generator/index.js';
import { useTestDatabases } from './support/test-databases.js';

const provision = useTestDatabases();
const apps: Application[] = [];
const roots: string[] = [];
afterEach(async () => {
  for (const app of apps.splice(0)) await app.shutdown().catch(() => {});
  vi.restoreAllMocks();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture({
  tasks = true,
  hooks = true,
  failHook = false,
  failBoot = false,
  failCleanup = false,
} = {}) {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'task-hooks-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const databases = await provision(['main', 'reports']);
  const database = {
    default: 'main',
    connections: {
      main: databases.connectionConfig('main'),
      reports: databases.connectionConfig('reports'),
    },
    migrations: { autoRun: tasks },
    seeds: { autoRun: tasks },
  };
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    database,
    snowflake: { workerId: 7 },
    app: { name: 'test', publicBasePath: '' },
  });
  const events: string[] = [];
  const resets: (readonly string[])[] = [];
  class HookProvider extends ServiceProvider<Application> {
    public readonly name = 'fixture/hooks';
    public override register(): void {
      const ids = this.app.container.resolve(idGeneratorToken);
      const generate = ids.generate.bind(ids);
      vi.spyOn(ids, 'generate').mockImplementation(() => {
        events.push('generate');
        return generate();
      });
      const manager = this.app.container.resolve(databaseManagerToken);
      const destroy = manager.destroy.bind(manager);
      vi.spyOn(manager, 'destroy').mockImplementation(async () => {
        events.push('destroy');
        await destroy();
      });
      for (const name of ['main', 'reports']) {
        const connection = manager.connection(name);
        const reset = connection.resetManagedSchema.bind(connection);
        vi.spyOn(connection, 'resetManagedSchema').mockImplementation(
          async () => {
            events.push(`reset:${name}`);
            await reset();
          },
        );
      }
      if (!hooks) return;
      const registrations = this.app.container.resolve(databaseTaskHooksToken);
      registrations.add({
        name: 'first',
        beforeTasks: async ({ resetConnections }) => {
          events.push('first');
          resets.push(resetConnections);
          if (failHook) throw new Error('hook failed');
        },
      });
      registrations.add({
        name: 'second',
        beforeTasks: async () => {
          events.push('second');
        },
      });
    }
    public override async boot(): Promise<void> {
      events.push('boot');
      if (failBoot) throw new Error('boot failed');
    }
    public override async shutdown(): Promise<void> {
      events.push('cleanup');
      if (failCleanup) throw new Error('cleanup failed');
    }
  }
  const app = new Application({ config, paths });
  app.addServiceProviders([
    DatabaseProvider,
    IdGeneratorProvider,
    HookProvider,
  ]);
  apps.push(app);
  if (tasks)
    for (const name of ['main', 'reports']) {
      mkdirSync(paths.database(`${name}/migrations`), { recursive: true });
      mkdirSync(paths.database(`${name}/seeds`), { recursive: true });
      writeFileSync(
        paths.database(`${name}/migrations/001_ids.ts`),
        `import { defineMigration } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineMigration({ name: '001_ids', async up({ builder, container }) {
container.resolve(idGeneratorToken).generate();
await builder.createCollection('business', c => c.integer('id').primary());
}, async down({ builder, container }) { container.resolve(idGeneratorToken).generate(); await builder.dropCollection('business'); } });`,
      );
      writeFileSync(
        paths.database(`${name}/seeds/001_seed.ts`),
        `import { defineSeed } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineSeed({ name: '001_seed', sample: true, async run({ container }) { container.resolve(idGeneratorToken).generate(); } });`,
      );
    }
  function run(operation: AppDatabaseTaskOperation = 'run', dryRun = false) {
    app.registerProviders();
    return runAppDatabaseTasks(database, {
      paths,
      runtimeConfig: config,
      container: app.container,
      contributions: app.databaseTaskContributions,
      database: () => app.container.resolve(databaseManagerToken),
      kind:
        operation === 'rollback'
          ? 'migrations'
          : operation === 'sample'
            ? 'seeds'
            : ['migrations', 'seeds'],
      operation,
      dryRun,
    });
  }
  return { app, config, paths, database, events, resets, run };
}

describe('database task hooks', () => {
  it('rejects duplicate registration names', () => {
    const hooks = createDatabaseTaskHooks();
    const hook = { name: 'test', beforeTasks: async () => {} };
    hooks.add(hook);
    expect(() => hooks.add(hook)).toThrow('already registered');
  });

  it('keeps the default generator and initializes registered hooks before startup migration', async () => {
    const f = await fixture();
    await f.app.start();
    expect(f.app.container.resolve(idGeneratorToken)).toBeInstanceOf(
      SnowflakeIdGenerator,
    );
    expect(f.events).toEqual(['first', 'second', 'generate', 'boot']);
    const id = f.app.container.resolve(idGeneratorToken).generate();
    expect(new SnowflakeIdGenerator({ workerId: 0 }).parse(id).workerId).toBe(
      7,
    );
    await f.app.shutdown();
    expect(f.events.slice(-2)).toEqual(['cleanup', 'destroy']);
  });

  it('cleans registered, not yet booted Providers before the database after hook failure', async () => {
    const f = await fixture({ failHook: true });
    await expect(f.app.start()).rejects.toThrow('hook failed');
    expect(f.events).toEqual(['first', 'cleanup', 'destroy']);
  });

  it('continues reverse cleanup after partial boot and a cleanup error', async () => {
    const f = await fixture({ failBoot: true, failCleanup: true });
    await expect(f.app.start()).rejects.toThrow(
      'startup and shutdown both failed',
    );
    expect(f.events).toEqual([
      'first',
      'second',
      'generate',
      'boot',
      'cleanup',
      'destroy',
    ]);
  });

  it('skips hooks on empty and entirely skipped plans without preparing storage', async () => {
    const f = await fixture({ tasks: false });
    f.app.registerProviders();
    const prepare = vi.spyOn(storage, 'prepareAppDatabaseStorage');
    const manager = f.app.container.resolve(databaseManagerToken);
    await executeAppDatabasePlan(manager, f.database, [], {
      container: f.app.container,
    });
    const plan = planAppDatabaseTasks(f.database, ['migrations'], {
      paths: f.paths,
      contributions: f.app.databaseTaskContributions,
    });
    await executeAppDatabasePlan(
      manager,
      f.database,
      plan.map((task) => ({ ...task, skipReason: 'auto-run-disabled' })),
      { container: f.app.container },
    );
    await expect(
      executeAppDatabasePlan(
        manager,
        f.database,
        plan.map((task) => ({ ...task, skipReason: 'auto-run-disabled' })),
        { container: f.app.container, fresh: true },
      ),
    ).rejects.toThrow('A fresh run must include migrations.');
    expect(prepare).not.toHaveBeenCalled();
    expect(f.events).toEqual([]);
  });

  it('prepares selected storage before hooks without touching an unselected connection', async () => {
    const f = await fixture();
    const prepare = vi.spyOn(storage, 'prepareAppDatabaseStorage');
    f.app.registerProviders();
    f.app.container.resolve(databaseTaskHooksToken).add({
      name: 'assert-storage',
      beforeTasks: async () => {
        expect(prepare.mock.calls.map((args) => args[2])).toEqual([['main']]);
      },
    });
    await f.run();
    expect(prepare.mock.calls.map((args) => args[2])).toEqual([['main']]);
    expect(prepare.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(f.app.container.resolve(idGeneratorToken).generate).mock
        .invocationCallOrder[0],
    );
  });

  it('calls every hook once per execution for run, rollback and sample', async () => {
    const f = await fixture();
    await f.run();
    expect(f.events).toEqual(['first', 'second', 'generate']);
    f.events.length = 0;
    await f.run('sample');
    expect(f.events).toEqual(['first', 'second', 'generate']);
    f.events.length = 0;
    await f.run('rollback');
    expect(f.events).toEqual(['first', 'second', 'generate']);
    expect(f.resets).toEqual([[], [], []]);
  });

  it.each(['run', 'rollback', 'repair', 'unlock'] as const)(
    'skips hooks for %s previews or administrative operations',
    async (operation) => {
      const f = await fixture();
      await f.run(operation, operation === 'run' || operation === 'rollback');
      expect(f.events).toEqual([]);
    },
  );

  it('reports a hook failure independently of not-run tasks and does not run later hooks or business tasks', async () => {
    const f = await fixture({ failHook: true });
    await expect(f.run()).rejects.toMatchObject({
      result: {
        ok: false,
        failure: { phase: 'before-tasks', hook: 'first', error: 'hook failed' },
        results: [{ status: 'not-run' }, { status: 'not-run' }],
      },
    });
    expect(f.events).toEqual(['first']);
  });

  it('resets all connections before hooks even when the default connection is last in a direct plan', async () => {
    const f = await fixture();
    f.app.registerProviders();
    const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
      paths: f.paths,
      contributions: f.app.databaseTaskContributions,
      all: true,
    });
    const reordered = [
      ...plan.filter((task) => task.connection === 'reports'),
      ...plan.filter((task) => task.connection === 'main'),
    ];
    await executeAppDatabasePlan(
      f.app.container.resolve(databaseManagerToken),
      f.database,
      reordered,
      { container: f.app.container, paths: f.paths, fresh: true },
    );
    expect(f.events).toEqual([
      'reset:reports',
      'reset:main',
      'first',
      'second',
      'generate',
      'generate',
    ]);
    expect(f.resets).toEqual([['reports', 'main']]);
  });

  it('standalone tasks destroy their own manager and leave borrowed services to the application', async () => {
    const f = await fixture();
    f.app.registerProviders();
    await runAppDatabaseTasks(f.database, {
      paths: f.paths,
      container: f.app.container,
      contributions: f.app.databaseTaskContributions,
      kind: 'migrations',
    });
    expect(f.events).toEqual(['first', 'second', 'generate']);
    await f.app.shutdown();
    expect(f.events.slice(-2)).toEqual(['cleanup', 'destroy']);
  });
  it('defers hooks added during execution until the next plan', async () => {
    const f = await fixture({ tasks: false });
    f.app.registerProviders();
    const hooks = f.app.container.resolve(databaseTaskHooksToken);
    let added = false;
    hooks.add({
      name: 'register-later',
      beforeTasks: async () => {
        if (!added) {
          added = true;
          hooks.add({
            name: 'later',
            beforeTasks: async () => {
              f.events.push('later');
            },
          });
        }
      },
    });
    await f.run();
    expect(f.events).toEqual(['first', 'second']);
    f.events.length = 0;
    await f.run();
    expect(f.events).toEqual(['first', 'second', 'later']);
  });

  it('preserves the original cause and completed resets when a hook fails', async () => {
    const f = await fixture();
    f.app.registerProviders();
    const cause = new Error('prerequisite unavailable');
    f.app.container.resolve(databaseTaskHooksToken).add({
      name: 'unavailable',
      beforeTasks: async () => {
        throw cause;
      },
    });
    const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
      paths: f.paths,
      contributions: f.app.databaseTaskContributions,
      all: true,
    });
    await expect(
      executeAppDatabasePlan(
        f.app.container.resolve(databaseManagerToken),
        f.database,
        plan,
        {
          paths: f.paths,
          container: f.app.container,
          fresh: true,
        },
      ),
    ).rejects.toMatchObject({
      cause,
      message: expect.stringContaining('business rebuild is incomplete'),
      result: {
        ok: false,
        status: 'failed',
        resetConnections: ['main', 'reports'],
        failure: {
          phase: 'before-tasks',
          hook: 'unavailable',
          error: cause.message,
        },
        results: Array.from({ length: 4 }, () => ({ status: 'not-run' })),
      },
    });
    expect(f.events).toEqual([
      'reset:main',
      'reset:reports',
      'first',
      'second',
    ]);
  });

  it.each([true, false])(
    'attributes a partial prepare failure with hooks=%s',
    async (hooks) => {
      const f = await fixture({ hooks });
      f.app.registerProviders();
      const prepare = storage.prepareAppDatabaseStorage;
      vi.spyOn(storage, 'prepareAppDatabaseStorage').mockImplementation(
        async (...args) => {
          f.events.push(`prepare:${args[2]?.[0]}`);
          if (args[2]?.[0] === 'reports')
            throw new Error('storage unavailable');
          await prepare(...args);
        },
      );
      const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
        paths: f.paths,
        contributions: f.app.databaseTaskContributions,
        all: true,
      });
      await expect(
        executeAppDatabasePlan(
          f.app.container.resolve(databaseManagerToken),
          f.database,
          plan,
          {
            paths: f.paths,
            container: f.app.container,
            fresh: true,
          },
        ),
      ).rejects.toMatchObject({
        result: {
          ok: false,
          resetConnections: ['main'],
          failure: {
            phase: 'prepare-storage',
            connection: 'reports',
            error: 'storage unavailable',
          },
          results: [
            { status: hooks ? 'not-run' : 'completed' },
            { status: hooks ? 'not-run' : 'completed' },
            { status: 'not-run' },
            { status: 'not-run' },
          ],
        },
      });
      expect(f.events).toEqual(
        hooks
          ? ['prepare:main', 'reset:main', 'prepare:reports']
          : [
              'prepare:main',
              'reset:main',
              'generate',
              'prepare:main',
              'prepare:reports',
            ],
      );
    },
  );

  it.each([true, false])(
    'records partial reset failure without repeating side effects, hooks=%s',
    async (hooks) => {
      const f = await fixture({ hooks });
      f.app.registerProviders();
      vi.spyOn(
        f.app.container.resolve(databaseManagerToken).connection('reports'),
        'resetManagedSchema',
      ).mockRejectedValue(new Error('reset unavailable'));
      const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
        paths: f.paths,
        contributions: f.app.databaseTaskContributions,
        all: true,
      });
      await expect(
        executeAppDatabasePlan(
          f.app.container.resolve(databaseManagerToken),
          f.database,
          plan,
          {
            paths: f.paths,
            container: f.app.container,
            fresh: true,
          },
        ),
      ).rejects.toMatchObject({
        result: {
          ok: false,
          resetConnections: ['main'],
          failure: { phase: 'reset-schema', connection: 'reports' },
          results: [
            { status: hooks ? 'not-run' : 'completed' },
            { status: hooks ? 'not-run' : 'completed' },
            { status: 'not-run' },
            { status: 'not-run' },
          ],
        },
      });
      expect(f.events).toEqual(
        hooks ? ['reset:main'] : ['reset:main', 'generate'],
      );
    },
  );

  it.each([true, false])(
    'completes an empty rebuild while recording that migrations did not run, hooks=%s',
    async (hooks) => {
      const f = await fixture({ tasks: false, hooks });
      f.app.registerProviders();
      const plan = planAppDatabaseTasks(f.database, ['migrations'], {
        paths: f.paths,
        contributions: f.app.databaseTaskContributions,
      });
      const result = await executeAppDatabasePlan(
        f.app.container.resolve(databaseManagerToken),
        f.database,
        plan,
        {
          paths: f.paths,
          container: f.app.container,
          fresh: true,
        },
      );
      expect(result).toMatchObject({
        ok: true,
        resetConnections: ['main'],
        results: [
          {
            status: 'completed',
            reason: 'missing-directory',
            executed: [],
            fresh: true,
          },
        ],
      });
      expect(f.events).toEqual(
        hooks ? ['reset:main', 'first', 'second'] : ['reset:main'],
      );
    },
  );

  it('does not reset a later connection after an unhooked business failure', async () => {
    const f = await fixture({ hooks: false });
    f.app.registerProviders();
    vi.spyOn(
      f.app.container.resolve(idGeneratorToken),
      'generate',
    ).mockImplementation(() => {
      throw new Error('business failed');
    });
    const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
      paths: f.paths,
      contributions: f.app.databaseTaskContributions,
      all: true,
    });
    await expect(
      executeAppDatabasePlan(
        f.app.container.resolve(databaseManagerToken),
        f.database,
        plan,
        {
          paths: f.paths,
          container: f.app.container,
          fresh: true,
        },
      ),
    ).rejects.toMatchObject({
      result: {
        ok: false,
        resetConnections: ['main'],
        failure: { phase: 'run-task', connection: 'main', kind: 'migrations' },
        results: [
          { status: 'failed' },
          { status: 'not-run' },
          { status: 'not-run' },
          { status: 'not-run' },
        ],
      },
    });
    expect(f.events).toEqual(['reset:main']);
  });
  it.each([true, false])(
    'executes each planned preparation once on a successful fresh plan, hooks=%s',
    async (hooks) => {
      const f = await fixture({ hooks });
      f.app.registerProviders();
      const prepare = vi.spyOn(storage, 'prepareAppDatabaseStorage');
      const plan = planAppDatabaseTasks(f.database, ['migrations', 'seeds'], {
        paths: f.paths,
        contributions: f.app.databaseTaskContributions,
        all: true,
      });
      await executeAppDatabasePlan(
        f.app.container.resolve(databaseManagerToken),
        f.database,
        plan,
        {
          paths: f.paths,
          container: f.app.container,
          fresh: true,
        },
      );
      expect(prepare.mock.calls.map((args) => args[2])).toEqual(
        hooks
          ? [['main'], ['reports']]
          : [['main'], ['main'], ['reports'], ['reports']],
      );
      expect(f.events).toEqual(
        hooks
          ? [
              'reset:main',
              'reset:reports',
              'first',
              'second',
              'generate',
              'generate',
            ]
          : ['reset:main', 'generate', 'reset:reports', 'generate'],
      );
    },
  );

  it('never prepares storage for dry-run previews of existing storage', async () => {
    const f = await fixture();
    f.app.registerProviders();
    const prepare = vi.spyOn(storage, 'prepareAppDatabaseStorage');
    await f.run('run', true);
    await f.run('rollback', true);
    await f.run('repair', true);
    expect(prepare).not.toHaveBeenCalled();
    expect(f.events).toEqual([]);
  });
});
