import { TASK_LOCK_EXPIRY_MS } from '@nocobase/db';
import { resolveStandaloneAppRuntime } from '@nocobase/app-server/node';
import { createAppFromRuntime } from '@nocobase/app-server/runtime';
import {
  createAppDatabaseManager,
  DatabaseProvider,
  type AppDatabaseConfig,
} from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
import type { Application } from '@nocobase/app-server';
import {
  AppConfig,
  createAppPaths,
  type AppPaths,
} from '@nocobase/app-server/config';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';
import { ServiceProvider } from '../../../libs/service-provider/src/index.ts';
import type { AppCommand, AppCommandContext } from '../src/context.ts';
import { bindAppCommand } from './app-command.ts';

class TaskServiceProvider extends ServiceProvider<Application> {
  override async boot(): Promise<void> {
    throw new Error('CLI must not boot providers');
  }
  override async start(): Promise<void> {
    throw new Error('CLI must not start providers');
  }

  override register(): void {
    this.app.config.mergeDefaults({ taskServiceRegistered: true });
  }
}

const roots: string[] = [];

/** Removes every application directory a fixture created. */
export function removeFixtureRoots(): void {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
}

export interface DatabaseCommandFixtureOptions {
  /** The application's database configuration; without it the application configures no database. */
  readonly database?: (paths: AppPaths) => AppDatabaseConfig;
}

/** An application in a directory of its own, whose `db` commands run against `database`. */
export function databaseCommandFixture({
  database: configure,
}: DatabaseCommandFixtureOptions = {}) {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'cli-database-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const database: AppDatabaseConfig = configure?.(paths) ?? {
    connections: {},
  };
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: 'test-app', version: '1.0.0' }),
  );
  const runtime: {
    -readonly [K in 'loadRuntime' | 'createApp']: AppCommandContext[K];
  } = {
    loadRuntime: () =>
      resolveStandaloneAppRuntime(
        {
          createAppConfig: () => {
            const config = new AppConfig();
            return config;
          },
          defaultConfigs: () => ({
            database,
            snowflake: { workerId: 0 },
          }),
          plugins: { plugins: [] },
          serviceProviders: [],
          routes: [],
        },
        { rootDir: root },
      ),
    createApp: (loaded) => {
      const app = createAppFromRuntime(loaded);
      app.addServiceProvider(DatabaseProvider);
      app.addServiceProvider(IdGeneratorProvider);
      app.addServiceProvider(TaskServiceProvider);
      app.addRuntimeContributions(loaded);
      return app;
    },
  };
  const command = {
    log: vi.fn(),
    warn: vi.fn(),
    jsonEnabled: () => false,
  };
  function migration(connection: string, fail = false) {
    const directory = paths.database(`${connection}/migrations`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_create.ts'),
      `import { defineMigration, databaseManagerToken } from '@nocobase/db';
import { idGeneratorToken } from '@nocobase/app-server/id-generator';
export default defineMigration({ name: '001_create', async up({ builder, config, container }) {
if (config.get('taskServiceRegistered') !== true) throw new Error('providers not registered');
if (container.has(databaseManagerToken)) throw new Error('database manager exposed');
if (!container.resolve(idGeneratorToken).generateString()) throw new Error('missing ID generator');
${fail ? "throw new Error('failed migration');" : "await builder.createCollection('rows', c => c.increments('id'));"}
}, async down({ builder }) { await builder.dropCollection('rows'); } });`,
    );
  }
  function seed(connection: string) {
    const directory = paths.database(`${connection}/seeds`);
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_defaults.ts'),
      `import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '001_defaults', async run() {} });`,
    );
  }
  /** Edit both sources after execution, the way a reformat or a comment would. */
  function rewrite(connection: string) {
    for (const file of [
      paths.database(`${connection}/migrations/001_create.ts`),
      paths.database(`${connection}/seeds/001_defaults.ts`),
    ])
      if (existsSync(file))
        appendFileSync(file, '\n// changed after execution\n');
  }
  /** Runs `fn` on a manager of its own over the application's database configuration, then closes it. */
  async function withDatabase<T>(
    fn: (
      manager: NonNullable<ReturnType<typeof createAppDatabaseManager>>,
    ) => Promise<T>,
  ): Promise<T> {
    const manager = createAppDatabaseManager(database, paths);
    if (!manager) throw new Error('The fixture configures no database.');
    try {
      return await fn(manager);
    } finally {
      await manager.destroy();
    }
  }
  /** Writes a lock row the way a run holding one would. */
  async function lockRow(
    connection: string,
    { lockedBy, beating }: { lockedBy: string; beating: boolean },
  ): Promise<void> {
    await withDatabase(async (manager) => {
      const at = beating
        ? new Date()
        : new Date(Date.now() - TASK_LOCK_EXPIRY_MS * 4);
      await manager
        .query(connection)
        .insertInto('__nocobase_migration_lock')
        .values({ id: 1, locked_by: lockedBy, locked_at: at, heartbeat_at: at })
        .execute();
    });
  }
  /** Drops the table behind a Collection the way a hand-rolled reset does: without its metadata. */
  async function dropTable(
    connection: string,
    collection: string,
  ): Promise<void> {
    await withDatabase(async (manager) => {
      const target = manager.connection(connection);
      const physical = await target.collections.getPhysical(collection);
      if (!physical)
        throw new Error(`Collection "${collection}" has no table.`);
      await target.schema.execute([
        { type: 'dropTable', tableName: physical.tableName },
      ]);
    });
  }
  /** The physical tables of `connection`, bookkeeping tables included. */
  async function tables(connection: string): Promise<string[]> {
    return withDatabase(async (manager) => {
      const names: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await manager
          .connection(connection)
          .schemaInspector.listPhysicalCollections({ cursor });
        names.push(...page.items.map((item) => item.tableName));
        cursor = page.nextCursor;
      } while (cursor);
      return names;
    });
  }
  /** `command` bound to this fixture, the way the runner points it at the application it located. */
  function bind<T extends typeof AppCommand>(command: T): T {
    return bindAppCommand(command, { rootDir: root, ...runtime });
  }
  return {
    root,
    runtime,
    command,
    migration,
    seed,
    rewrite,
    lockRow,
    dropTable,
    tables,
    bind,
    paths,
  };
}
