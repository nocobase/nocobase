import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';
import {
  DatabaseProvider,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskOperation,
} from '../src/database/index.js';
import { executeAppDatabasePlan } from '../src/database/tasks.js';
import {
  IdGeneratorProvider,
  idGeneratorLifecycleToken,
  idGeneratorToken,
} from '../src/id-generator/index.js';
import { useTestDatabases } from './support/test-databases.js';

const provision = useTestDatabases();
const applications: Application[] = [];
const roots: string[] = [];
afterEach(async () => {
  for (const app of applications.splice(0))
    await app.shutdown().catch(() => {});
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

async function fixture({
  tasks = true,
  failInitialize = false,
  failRegister = false,
  failBoot = false,
} = {}) {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'id-lifecycle-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const databases = await provision(['main']);
  const database: AppDatabaseConfig = {
    default: 'main',
    connections: { main: databases.connectionConfig('main') },
    migrations: { autoRun: tasks },
    seeds: { autoRun: tasks },
  };
  const config = new AppConfig();
  await config.loadAll();
  config.mergeDefaults({
    database,
    snowflake: { mode: 'auto' },
    app: { name: 'test', publicBasePath: '' },
  });
  const events: string[] = [];
  let sequence = 0;
  const managed = {
    initialize: vi.fn(async () => {
      events.push('initialize');
      if (failInitialize) throw new Error('allocation failed');
    }),
    shutdown: vi.fn(async () => {
      events.push('return');
    }),
    generate: () => {
      events.push('generate');
      return ++sequence;
    },
    generateString: () => String(++sequence),
  };
  const factory = vi.fn(() => managed);
  class AllocationProvider extends ServiceProvider<Application> {
    public readonly name = 'allocation';
    public override register(): void {
      this.app.container
        .resolve(idGeneratorLifecycleToken)
        .registerFactory(factory);
      events.push('registered');
      if (failRegister) throw new Error('registration failed');
    }
    public override async boot(): Promise<void> {
      events.push('boot');
      if (failBoot) throw new Error('plugin boot failed');
    }
  }
  const app = new Application({ config, paths });
  app.addServiceProviders([
    DatabaseProvider,
    IdGeneratorProvider,
    AllocationProvider,
  ]);
  applications.push(app);
  if (tasks) {
    for (const kind of ['migrations', 'seeds'])
      mkdirSync(paths.database(`main/${kind}`), { recursive: true });
    writeFileSync(
      paths.database('main/migrations/001_ids.ts'),
      `import { defineMigration } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineMigration({ name: '001_ids', async up({ builder, container, query }) {
await builder.createCollection('generated', c => { c.integer('id').primary(); });
await query.insertInto('generated').values({ id: container.resolve(idGeneratorToken).generate() }).execute();
}, async down({ builder, container }) { container.resolve(idGeneratorToken).generate(); await builder.dropCollection('generated'); } });`,
    );
    writeFileSync(
      paths.database('main/seeds/001_ids.ts'),
      `import { defineSeed } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineSeed({ name: '001_ids', async run({ container, query }) {
await query.insertInto('generated').values({ id: container.resolve(idGeneratorToken).generate() }).execute();
} });`,
    );
  }
  function run(
    operation: AppDatabaseTaskOperation = 'run',
    dryRun = false,
    fresh = false,
  ) {
    app.registerProviders();
    return runAppDatabaseTasks(database, {
      paths,
      runtimeConfig: config,
      container: app.container,
      contributions: app.databaseTaskContributions,
      database: () => app.container.resolve(databaseManagerToken),
      kind: operation === 'rollback' ? 'migrations' : ['migrations', 'seeds'],
      operation,
      dryRun,
      fresh,
    });
  }
  return { app, events, managed, factory, run };
}

describe('ID initialization around real database tasks', () => {
  it('starts after all registration and before migrations and seeds, then returns before destroying connections', async () => {
    const { app, events, managed } = await fixture();
    await app.start();
    expect(events).toEqual([
      'registered',
      'initialize',
      'generate',
      'generate',
      'boot',
    ]);
    const database = app.container.resolve(databaseManagerToken);
    expect(
      await database.query().selectFrom('generated').select('id').execute(),
    ).toHaveLength(2);
    const destroy = vi
      .spyOn(database, 'destroy')
      .mockImplementation(async () => {
        events.push('destroy');
      });
    const ids = app.container.resolve(idGeneratorToken);
    managed.shutdown.mockImplementation(async () => {
      expect(() => ids.generate()).toThrow('permanently closed');
      events.push('return');
    });
    const stop = app.shutdown();
    await stop;
    expect(events.slice(-2)).toEqual(['return', 'destroy']);
    expect(managed.shutdown).toHaveBeenCalledOnce();
    destroy.mockRestore();
    await database.destroy();
  });

  it('initializes when automatic tasks are disabled and no task files exist', async () => {
    const { app, events } = await fixture({ tasks: false });
    await app.start();
    expect(events).toEqual(['registered', 'initialize', 'boot']);
    expect(app.container.resolve(idGeneratorToken).generate()).toBe(1);
  });

  it('initializes an empty startup plan and cleans up a later route-registration failure', async () => {
    const { app, managed, events } = await fixture({ tasks: false });
    app.registerProviders();
    await executeAppDatabasePlan(
      app.container.resolve(databaseManagerToken),
      app.config.get<AppDatabaseConfig>('database')!,
      [],
      {
        paths: app.paths,
        runtimeConfig: app.config,
        container: app.container,
      },
    );
    expect(events).toEqual(['registered', 'initialize']);
    app.addRoutes({
      scope: 'api',
      createRouter: () => {
        throw new Error('routes failed');
      },
    });
    await expect(app.start()).rejects.toThrow('routes failed');
    expect(managed.initialize).toHaveBeenCalledOnce();
    expect(managed.shutdown).toHaveBeenCalledOnce();
  });

  it('shares initialization across manual migrations, seeds, and rollback without booting the application', async () => {
    const { app, events, managed } = await fixture();
    // A command owns one registered application until its withApp cleanup.
    app.registerProviders();
    const database = app.config.get<AppDatabaseConfig>('database')!;
    const options = {
      paths: app.paths,
      runtimeConfig: app.config,
      container: app.container,
      contributions: app.databaseTaskContributions,
      database: () => app.container.resolve(databaseManagerToken),
    };
    await runAppDatabaseTasks(database, { ...options, kind: 'migrations' });
    await runAppDatabaseTasks(database, { ...options, kind: 'seeds' });
    await runAppDatabaseTasks(database, {
      ...options,
      kind: 'migrations',
      operation: 'rollback',
    });
    expect(events).toEqual([
      'registered',
      'initialize',
      'generate',
      'generate',
      'generate',
    ]);
    expect(managed.initialize).toHaveBeenCalledOnce();
  });

  it.each(['repair', 'unlock', 'run', 'rollback'] as const)(
    'does not initialize for %s inspection',
    async (operation) => {
      const { run, factory } = await fixture();
      await run(operation, operation !== 'unlock');
      expect(factory).not.toHaveBeenCalled();
    },
  );

  it('refuses auto fresh even as a dry run, without allocating or resetting data', async () => {
    const { run, factory } = await fixture();
    await expect(run('run', true, true)).rejects.toThrow('fresh is forbidden');
    await expect(run('run', false, true)).rejects.toThrow('fresh is forbidden');
    expect(factory).not.toHaveBeenCalled();
  });

  it.each([{ failInitialize: true }, { failBoot: true }])(
    'cleans up failed startup %j without retrying allocation',
    async (options) => {
      const { app, managed, factory } = await fixture(options);
      await expect(app.start()).rejects.toThrow(
        /allocation failed|plugin boot failed/,
      );
      await expect(app.start()).rejects.toThrow();
      await app.shutdown();
      expect(factory).toHaveBeenCalledOnce();
      expect(managed.shutdown).toHaveBeenCalledOnce();
      expect(() => app.container.resolve(idGeneratorToken).generate()).toThrow(
        'permanently closed',
      );
    },
  );

  it('cleans up partial provider registration without creating an allocation', async () => {
    const { app, factory } = await fixture({ failRegister: true });
    await expect(app.start()).rejects.toThrow('registration failed');
    expect(factory).not.toHaveBeenCalled();
    expect(() => app.container.resolve(idGeneratorToken).generate()).toThrow(
      'permanently closed',
    );
  });
});
