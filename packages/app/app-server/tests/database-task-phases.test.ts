import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  resolveDatabaseDriver,
  type DatabaseDriverDefinition,
} from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import { SnowflakeIdGenerator } from '@nocobase/snowflake';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  DatabaseTaskHooks,
  databaseTaskHooksToken,
  databaseTaskCoordinatorToken,
  AppDatabaseTaskError,
  createAppDatabaseManager,
  planAppDatabaseTasks,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';
import * as managerFactory from '../src/database/manager.js';
import { executeAppDatabasePlan } from '../src/database/tasks.js';
import { idGeneratorToken } from '../src/id-generator/token.js';
import { useTestDatabases } from './support/test-databases.js';

const provision = useTestDatabases();
const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture() {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'phases-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const names = ['primary', 'secondary', 'untouched'];
  const databases = await provision(names);
  const events: string[] = [];
  const faults: { prepare?: string; reset?: string; migration?: string } = {};
  const config: AppDatabaseConfig = { default: 'primary', connections: {} };
  for (const name of names) {
    const source = databases.connectionConfig(name);
    const driver = resolveDatabaseDriver(source)!;
    const observed: DatabaseDriverDefinition = {
      ...driver,
      async prepareStorage(connection, context) {
        events.push(`prepare:${name}`);
        if (faults.prepare === name) throw new Error('storage unavailable');
        await driver.prepareStorage?.(connection, context);
      },
      async resetManagedSchema(context) {
        events.push(`reset:${name}`);
        // Throw after the real reset to model a driver that has already changed data.
        await driver.resetManagedSchema!(context);
        if (faults.reset === name) throw new Error('reset interrupted');
      },
    };
    config.connections[name] = { ...source, databaseDriver: observed };
    for (const kind of ['migrations', 'seeds'] as const) {
      const directory = paths.database(`${name}/${kind}`);
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(directory, '001_business.ts'),
        kind === 'migrations'
          ? `import { defineMigration } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineMigration({ name: '001_business', async up({ builder, container, query, config }) {
  container.resolve(idGeneratorToken).generateString();
  if (config.get('expectPreparation')) {
    const rows = await query.selectFrom('preparation').selectAll().execute();
    if (rows[0]?.value !== 'ready') throw new Error('preparation not visible');
  }
  await builder.createCollection('business', c => { c.integer('id').primary(); c.string('value'); });
}, async down({ builder }) { await builder.dropCollection('business'); } });`
          : `import { defineSeed } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineSeed({ name: '001_business', async run({ query, container, config }) {
  container.resolve(idGeneratorToken).generateString();
  if (config.get('expectPreparation')) {
    const rows = await query.selectFrom('preparation').selectAll().execute();
    if (rows[0]?.value !== 'ready') throw new Error('preparation not visible');
  }
  await query.insertInto('business').values({ id: 1, value: 'seeded' }).execute();
} });`,
      );
    }
  }
  const contributions: AppDatabaseTaskContributions = {
    appPackageName: 'phase-fixture',
    migrations: [],
    seeds: [],
  };
  const container = new ServiceContainer();
  const generator = new SnowflakeIdGenerator({ workerId: 0 });
  const generate = generator.generateString.bind(generator);
  vi.spyOn(generator, 'generateString').mockImplementation(() => {
    events.push('business');
    if (faults.migration) throw new Error(faults.migration);
    return generate();
  });
  container.instance(idGeneratorToken, generator);
  const database = createAppDatabaseManager(config, paths)!;
  const plan = planAppDatabaseTasks(config, ['migrations', 'seeds'], {
    paths,
    contributions,
    all: true,
  }).filter((task) => task.connection !== 'untouched');
  // The executor follows the actual plan, not the configured default's position.
  plan.sort((a, b) =>
    a.connection === b.connection ? 0 : a.connection === 'secondary' ? -1 : 1,
  );
  const execute = (
    options: Parameters<typeof executeAppDatabasePlan>[3] = {},
  ) =>
    executeAppDatabasePlan(database, config, plan, {
      paths,
      container,
      ...options,
    });
  return {
    config,
    paths,
    contributions,
    container,
    database,
    plan,
    execute,
    events,
    faults,
  };
}

describe('direct application database phases', () => {
  it('prepares each target once, resets every target, then migrates and seeds in plan order', async () => {
    const f = await fixture();
    try {
      const result = await f.execute({ fresh: true });
      expect(f.events).toEqual([
        'prepare:secondary',
        'prepare:primary',
        'reset:secondary',
        'reset:primary',
        'business',
        'business',
        'business',
        'business',
      ]);
      expect(
        result.results.map((task) => [task.connection, task.kind, task.status]),
      ).toEqual([
        ['secondary', 'migrations', 'completed'],
        ['secondary', 'seeds', 'completed'],
        ['primary', 'migrations', 'completed'],
        ['primary', 'seeds', 'completed'],
      ]);
      expect(
        result.results
          .filter((task) => task.kind === 'seeds')
          .every((task) => task.freshInstall),
      ).toBe(true);
      expect(result).not.toHaveProperty('resetConnections');
      f.events.length = 0;
      const again = await f.execute();
      expect(f.events).toEqual(['prepare:secondary', 'prepare:primary']);
      expect(
        again.results
          .filter((task) => task.kind === 'seeds')
          .every((task) => task.freshInstall === false),
      ).toBe(true);
    } finally {
      await f.database.destroy();
    }
  });

  it('retains preparation and reset evidence when owned-manager cleanup also fails', async () => {
    const f = await fixture();
    const cleanupError = new Error('owned manager cleanup failed');
    const hookError = new Error('required resources unavailable');
    const hooks = new DatabaseTaskHooks();
    hooks.register({
      name: 'required',
      async beforeTasks() {
        throw hookError;
      },
    });
    f.container.instance(databaseTaskHooksToken, hooks);
    const destroy = vi
      .spyOn(f.database, 'destroy')
      .mockRejectedValue(cleanupError);
    vi.spyOn(managerFactory, 'createAppDatabaseManager').mockReturnValue(
      f.database,
    );
    try {
      const error = await runAppDatabaseTasks(f.config, {
        paths: f.paths,
        container: f.container,
        contributions: f.contributions,
        kind: ['migrations', 'seeds'],
        fresh: true,
        all: true,
      }).catch((cause: unknown) => cause);
      expect(error).toBeInstanceOf(AppDatabaseTaskError);
      if (!(error instanceof AppDatabaseTaskError)) throw error;
      expect(error.cause).toBe(hookError);
      expect(error.cleanupError).toBe(cleanupError);
      expect(error.preparation).toEqual({
        phase: 'beforeTasks',
        hook: 'required',
      });
      expect(error.resetConnections).toEqual([
        'primary',
        'secondary',
        'untouched',
      ]);
      expect(
        error.result.results.every((task) => task.status === 'not-run'),
      ).toBe(true);
      expect(destroy).toHaveBeenCalledTimes(1);
    } finally {
      vi.restoreAllMocks();
      await f.database.destroy();
    }
  });

  it('attributes installation history failures to preparation after hooks, before any business task', async () => {
    const f = await fixture();
    try {
      const connection = f.database.connection('primary');
      await connection.builder.createCollection('existing', (columns) => {
        columns.integer('id');
      });
      const failure = new Error('installation history unavailable');
      vi.spyOn(connection, 'client').mockRejectedValue(failure);
      const hooks = new DatabaseTaskHooks();
      hooks.register({
        name: 'installation-check',
        async beforeTasks() {
          f.events.push('hook');
        },
      });
      f.container.instance(databaseTaskHooksToken, hooks);
      const error = await f.execute().catch((cause: unknown) => cause);
      expect(error).toBeInstanceOf(AppDatabaseTaskError);
      if (!(error instanceof AppDatabaseTaskError)) throw error;
      expect(error.cause).toBe(failure);
      expect(error.preparation).toEqual({ phase: 'installation' });
      expect(error.resetConnections).toEqual([]);
      expect(error.result).toMatchObject({ ok: false, status: 'failed' });
      expect(
        error.result.results.every(
          (task) =>
            task.status === 'not-run' && task.reason === 'preparation-failed',
        ),
      ).toBe(true);
      expect(f.events).toEqual([
        'prepare:secondary',
        'prepare:primary',
        'hook',
      ]);
    } finally {
      vi.restoreAllMocks();
      await f.database.destroy();
    }
  });

  it('stops before reset and business work if storage preparation fails', async () => {
    const f = await fixture();
    f.faults.prepare = 'primary';
    try {
      await expect(f.execute({ fresh: true })).rejects.toMatchObject({
        preparation: { phase: 'storage', connection: 'primary' },
        resetConnections: [],
        cause: { message: 'storage unavailable' },
        result: {
          ok: false,
          status: 'failed',
          results: f.plan.map((task) => ({
            connection: task.connection,
            kind: task.kind,
            status: 'not-run',
            reason: 'preparation-failed',
          })),
        },
      });
      expect(f.events).toEqual(['prepare:secondary', 'prepare:primary']);
    } finally {
      await f.database.destroy();
    }
  });

  it('reports confirmed resets separately from a failing reset that may have changed its schema', async () => {
    const f = await fixture();
    f.faults.reset = 'primary';
    try {
      const error = await f.execute({ fresh: true }).catch((error) => error);
      expect(error).toBeInstanceOf(AppDatabaseTaskError);
      expect(error).toMatchObject({
        preparation: { phase: 'reset', connection: 'primary' },
        resetConnections: ['secondary'],
        cause: { message: 'reset interrupted' },
      });
      expect(error.message).toContain('may also have been partially modified');
      expect(
        error.result.results.every(
          (task: { status: string }) => task.status === 'not-run',
        ),
      ).toBe(true);
      expect(f.events).toEqual([
        'prepare:secondary',
        'prepare:primary',
        'reset:secondary',
        'reset:primary',
      ]);
    } finally {
      await f.database.destroy();
    }
  });

  it('retains all confirmed resets when the first migration fails and preserves skipped entries', async () => {
    const f = await fixture();
    f.faults.migration = 'business stopped';
    f.plan.push({
      ...f.plan[0],
      connection: 'untouched',
      skipReason: 'auto-run-disabled',
    });
    try {
      await expect(f.execute({ fresh: true })).rejects.toMatchObject({
        resetConnections: ['secondary', 'primary'],
        result: {
          ok: false,
          results: [
            { status: 'failed' },
            { status: 'not-run' },
            { status: 'not-run' },
            { status: 'not-run' },
            { status: 'skipped', reason: 'auto-run-disabled' },
          ],
        },
      });
      expect(f.events).toEqual([
        'prepare:secondary',
        'prepare:primary',
        'reset:secondary',
        'reset:primary',
        'business',
      ]);
    } finally {
      await f.database.destroy();
    }
  });

  it('does not prepare or reset existing storage when previewing any supported operation', async () => {
    const f = await fixture();
    try {
      for (const options of [
        { dryRun: true },
        { dryRun: true, fresh: true },
        { dryRun: true, operation: 'repair' as const },
      ]) {
        await f.execute(options);
      }
      await executeAppDatabasePlan(
        f.database,
        f.config,
        f.plan.filter((task) => task.kind === 'migrations'),
        { paths: f.paths, dryRun: true, operation: 'rollback' },
      );
      expect(f.events).toEqual([]);
      const tables = await f.database
        .connection('primary')
        .schemaInspector.listPhysicalCollections();
      expect(tables.items).toEqual([]);
    } finally {
      await f.database.destroy();
    }
  });

  it('validates direct fresh plans before writing and treats empty rebuilds as completed work', async () => {
    const f = await fixture();
    try {
      await expect(
        executeAppDatabasePlan(f.database, f.config, [...f.plan].reverse(), {
          fresh: true,
        }),
      ).rejects.toThrow('before its seeds');
      expect(f.events).toEqual([]);
      rmSync(f.paths.database('secondary/migrations'), { recursive: true });
      const result = await executeAppDatabasePlan(
        f.database,
        f.config,
        [f.plan[0]],
        { paths: f.paths, fresh: true },
      );
      expect(result.results).toEqual([
        {
          connection: 'secondary',
          kind: 'migrations',
          status: 'completed',
          fresh: true,
          batch: 0,
          executed: [],
          skipped: [],
        },
      ]);
      expect(f.events).toEqual(['prepare:secondary', 'reset:secondary']);
    } finally {
      await f.database.destroy();
    }
  });

  it('does not destroy a borrowed manager on failure', async () => {
    const f = await fixture();
    const destroy = vi.spyOn(f.database, 'destroy');
    f.faults.prepare = 'primary';
    try {
      await expect(
        runAppDatabaseTasks(f.config, {
          paths: f.paths,
          contributions: f.contributions,
          kind: 'migrations',
          database: () => f.database,
        }),
      ).rejects.toBeInstanceOf(AppDatabaseTaskError);
      expect(destroy).not.toHaveBeenCalled();
    } finally {
      await f.database.destroy();
    }
  });
});

describe('necessary beforeTasks preparation', () => {
  it('keeps the unified direct phases when an application coordinator delegates execution', async () => {
    const f = await fixture();
    try {
      f.container.instance(
        databaseTaskCoordinatorToken,
        async ({ execute }) => {
          f.events.push('coordinator');
          return execute();
        },
      );
      const hooks = new DatabaseTaskHooks();
      hooks.register({
        name: 'coordinated',
        async beforeTasks() {
          f.events.push('hook');
        },
      });
      f.container.instance(databaseTaskHooksToken, hooks);
      const result = await f.execute({ fresh: true });
      expect(result.ok).toBe(true);
      expect(f.events).toEqual([
        'coordinator',
        'prepare:secondary',
        'prepare:primary',
        'reset:secondary',
        'reset:primary',
        'hook',
        'business',
        'business',
        'business',
        'business',
      ]);
      f.events.length = 0;
      await f.execute({ fresh: true, dryRun: true });
      expect(f.events).toEqual(['coordinator']);
    } finally {
      await f.database.destroy();
    }
  });

  it('awaits registered hooks after every reset and exposes their rows to real migrations and seeds', async () => {
    const f = await fixture();
    const hooks = new DatabaseTaskHooks();
    f.container.instance(databaseTaskHooksToken, hooks);
    const runtimeConfig = new AppConfig();
    await runtimeConfig.loadAll();
    runtimeConfig.mergeDefaults({ expectPreparation: true });
    hooks.register({
      name: 'resources',
      async beforeTasks(context) {
        expect(context.resetConnections).toEqual(['secondary', 'primary']);
        expect(Object.isFrozen(context)).toBe(true);
        expect(Object.isFrozen(context.resetConnections)).toBe(true);
        f.events.push('hook:resources');
        for (const name of context.resetConnections) {
          const connection = f.database.connection(name);
          await connection.builder.createCollection('preparation', (c) => {
            c.integer('id').primary();
            c.string('value');
          });
          await connection.query
            .insertInto('preparation')
            .values({ id: 1, value: 'ready' })
            .execute();
        }
      },
    });
    hooks.register({
      name: 'verify',
      async beforeTasks(context) {
        f.events.push('hook:verify');
        expect(context.resetConnections).toEqual(['secondary', 'primary']);
        for (const name of context.resetConnections) {
          expect(await f.database.repository('preparation', name).count()).toBe(
            1,
          );
        }
      },
    });
    try {
      await f.execute({ fresh: true, runtimeConfig });
      expect(f.events).toEqual([
        'prepare:secondary',
        'prepare:primary',
        'reset:secondary',
        'reset:primary',
        'hook:resources',
        'hook:verify',
        'business',
        'business',
        'business',
        'business',
      ]);
      expect(await f.database.repository('business', 'primary').count()).toBe(
        1,
      );
    } finally {
      await f.database.destroy();
    }
  });

  it('uses a per-plan snapshot and calls ordinary, rollback and sample hooks once with no reset facts', async () => {
    const f = await fixture();
    const hooks = new DatabaseTaskHooks();
    f.container.instance(databaseTaskHooksToken, hooks);
    const calls: string[] = [];
    let registered = false;
    hooks.register({
      name: 'first',
      async beforeTasks(context) {
        expect(context.resetConnections).toEqual([]);
        calls.push('first');
        if (!registered) {
          registered = true;
          hooks.register({
            name: 'later',
            async beforeTasks() {
              calls.push('later');
            },
          });
        }
      },
    });
    try {
      await f.execute();
      expect(calls).toEqual(['first']);
      calls.length = 0;
      await f.execute();
      expect(calls).toEqual(['first', 'later']);
      for (const operation of ['sample', 'rollback'] as const) {
        calls.length = 0;
        const kind = operation === 'sample' ? 'seeds' : 'migrations';
        await executeAppDatabasePlan(
          f.database,
          f.config,
          f.plan.filter((task) => task.kind === kind),
          { paths: f.paths, container: f.container, operation },
        );
        expect(calls).toEqual(['first', 'later']);
      }
    } finally {
      await f.database.destroy();
    }
  });

  it('never resolves hooks for previews, repair, unlock, empty or entirely skipped plans', async () => {
    const f = await fixture();
    const resolveHooks = vi.fn(() => {
      throw new Error('must not resolve hooks');
    });
    f.container.singleton(databaseTaskHooksToken, resolveHooks);
    try {
      for (const options of [
        { dryRun: true },
        { dryRun: true, fresh: true },
        { operation: 'repair' as const },
        { operation: 'unlock' as const },
      ]) {
        await f.execute(options);
      }
      await executeAppDatabasePlan(f.database, f.config, [], {
        container: f.container,
      });
      await executeAppDatabasePlan(
        f.database,
        f.config,
        f.plan.map((task) => ({ ...task, skipReason: 'auto-run-disabled' })),
        { container: f.container },
      );
      expect(resolveHooks).not.toHaveBeenCalled();
    } finally {
      await f.database.destroy();
    }
  });

  it('retains the hook name and original cause without failing a business task or calling later hooks', async () => {
    const f = await fixture();
    const hooks = new DatabaseTaskHooks();
    f.container.instance(databaseTaskHooksToken, hooks);
    const cause = new Error('resource preparation refused');
    hooks.register({
      name: 'refused',
      async beforeTasks() {
        throw cause;
      },
    });
    const later = vi.fn(async () => {});
    hooks.register({ name: 'later', beforeTasks: later });
    try {
      const error: unknown = await f
        .execute({ fresh: true })
        .catch((error) => error);
      expect(error).toBeInstanceOf(AppDatabaseTaskError);
      if (!(error instanceof AppDatabaseTaskError)) throw error;
      expect(error.cause).toBe(cause);
      expect(error.preparation).toEqual({
        phase: 'beforeTasks',
        hook: 'refused',
      });
      expect(error.resetConnections).toEqual(['secondary', 'primary']);
      expect(
        error.result.results.every((task) => task.status === 'not-run'),
      ).toBe(true);
      expect(later).not.toHaveBeenCalled();
      expect(f.events).not.toContain('business');
    } finally {
      await f.database.destroy();
    }
  });
});
