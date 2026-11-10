import { execFile } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { provisionTestDatabases } from '@nocobase/db-testing';
import {
  createAppDatabaseManager,
  type AppDatabaseConfig,
} from '@nocobase/app-server/database';
import type { CommandJson } from '@nocobase/cli-envelope';
import type { DatabaseCommandResult } from '../src/database-command.ts';

const exec = promisify(execFile);
const entry = fileURLToPath(new URL('../bin/run.js', import.meta.url));

/** A new source application exercised through the actual CLI executable in fresh processes. */
export async function createDatabasePhasesFixture({
  missingStorage = false,
}: { missingStorage?: boolean } = {}) {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'database-phases-cli-'));
  const databases = await provisionTestDatabases({
    connections: ['main', 'named', 'external'],
  });
  const database: AppDatabaseConfig = {
    default: 'main',
    connections: Object.fromEntries(
      ['named', 'main', 'external'].map((name) => {
        const { databaseDriver: _driver, ...config } =
          databases.connectionConfig(name);
        return [
          name,
          {
            ...config,
            ...(missingStorage && typeof config.filename === 'string'
              ? { filename: path.join(root, 'missing', name, 'data.sqlite') }
              : {}),
            ...(name === 'external' ? { schemaManagement: 'external' } : {}),
          },
        ];
      }),
    ),
  };
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: 'database-phases-fixture',
      version: '1.0.0',
      type: 'module',
      nocobase: { templateKind: 'app' },
    }),
  );
  const server = path.join(root, 'server');
  mkdirSync(server);
  writeFileSync(
    path.join(server, 'runtime.ts'),
    `
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { AppConfig } from '@nocobase/app-server/config';
import { resolveDatabaseConfig } from '@nocobase/app-server/database';
import { resolveDatabaseDriver } from '@nocobase/db';
const trace = event => appendFileSync(path.resolve('trace.log'), event + '\\n');
const database = await resolveDatabaseConfig(${JSON.stringify(database)});
for (const [name, connection] of Object.entries(database.connections)) {
  const driver = resolveDatabaseDriver(connection, database.drivers, name);
  connection.databaseDriver = { ...driver,
    async prepareStorage(config, context) { trace('prepare:' + name); await driver.prepareStorage?.(config, context); },
    async resetManagedSchema(context) {
      trace('reset:' + name);
      await driver.resetManagedSchema(context);
      if (process.env.FIXTURE_RESET_FAIL === name) throw new Error('reset interrupted');
    }
  };
}
database.drivers = {};
export default {
  createAppConfig: () => new AppConfig(),
  defaultConfigs: () => ({ database, snowflake: { workerId: 0 } }),
  plugins: { plugins: [] }, serviceProviders: [], routes: [],
};
`,
  );
  writeFileSync(
    path.join(server, 'app.ts'),
    `
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { ServiceProvider } from '@nocobase/service-provider';
import { databaseManagerToken, TaskLockBusyError } from '@nocobase/db';
import { createAppFromRuntime } from '@nocobase/app-server/runtime';
import { DatabaseProvider, databaseTaskHooksToken } from '@nocobase/app-server/database';
import { IdGeneratorProvider } from '@nocobase/app-server/id-generator';
const trace = event => appendFileSync(path.resolve('trace.log'), event + '\\n');
class Resources extends ServiceProvider {
  register() {
    if (process.env.FIXTURE_HOOKS === 'off') return;
    this.app.container.resolve(databaseTaskHooksToken).register({ name: 'fixtureResources', beforeTasks: async context => {
      trace('hook:' + context.resetConnections.join(','));
      if (process.env.FIXTURE_HOOK_FAIL === 'lock') throw new TaskLockBusyError({ label: 'Private resource', connection: 'main', tableName: 'private_lock', lockedBy: 'fixture', lockedAt: undefined, heartbeatAt: undefined, expired: false, waitedMs: 0, inProcess: true });
      if (process.env.FIXTURE_HOOK_FAIL) throw new Error('resource refused');
      const database = this.app.container.resolve(databaseManagerToken);
      for (const name of JSON.parse(process.env.FIXTURE_TARGETS)) {
        const connection = database.connection(name);
        if (!await connection.collections.getPhysical('preparation')) {
          await connection.builder.createCollection('preparation', c => { c.integer('id').primary(); c.string('value'); });
          await connection.query.insertInto('preparation').values({ id: 1, value: 'ready' }).execute();
        }
      }
    } });
    this.app.container.resolve(databaseTaskHooksToken).register({ name: 'later', async beforeTasks() { trace('later'); } });
  }
  async boot() { throw new Error('CLI must not boot resources'); }
  async shutdown() {
    trace('shutdown:resources');
  }
}
export function createApp(runtime) {
  const app = createAppFromRuntime(runtime);
  app.addServiceProvider(DatabaseProvider);
  app.addServiceProvider(IdGeneratorProvider);
  app.addServiceProvider(Resources);
  app.addRuntimeContributions(runtime);
  return app;
}
`,
  );
  function sources(
    name: 'main' | 'named',
    { fail = false }: { fail?: boolean } = {},
  ) {
    for (const kind of ['migrations', 'seeds'] as const) {
      const directory = path.join(root, 'database', name, kind);
      mkdirSync(directory, { recursive: true });
      writeFileSync(
        path.join(directory, '001_business.ts'),
        kind === 'migrations'
          ? `
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '001_business', async up({ builder, query }) {
  appendFileSync(path.resolve('trace.log'), 'migration:${name}\\n');
  ${fail ? "throw new Error('business stopped');" : ''}
  if (process.env.FIXTURE_HOOKS !== 'off') {
    const rows = await query.selectFrom('preparation').selectAll().execute();
    if (rows[0]?.value !== 'ready') throw new Error('preparation missing in migration');
  }
  await builder.createCollection('business', c => { c.integer('id').primary(); c.string('value'); });
}, async down({ builder }) { await builder.dropCollection('business'); } });`
          : `
import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '001_business', async run({ query }) {
  if (process.env.FIXTURE_HOOKS !== 'off') {
    const rows = await query.selectFrom('preparation').selectAll().execute();
    if (rows[0]?.value !== 'ready') throw new Error('preparation missing in seed');
  }
  await query.insertInto('business').values({ id: 1, value: 'seeded' }).execute();
} });`,
      );
    }
  }
  async function run(args: string[], env: Record<string, string> = {}) {
    const selection = args.indexOf('--connection');
    const targets = args.includes('--all')
      ? ['main', 'named']
      : [selection === -1 ? 'main' : args[selection + 1]];
    const trace = path.join(root, 'trace.log');
    rmSync(trace, { force: true });
    let stdout: string;
    let stderr: string;
    let exitCode = 0;
    try {
      ({ stdout, stderr } = await exec(
        process.execPath,
        ['--import', 'tsx', entry, ...args, '--json', '--no-collections'],
        {
          cwd: root,
          timeout: 30_000,
          maxBuffer: 4 * 1024 * 1024,
          env: {
            ...process.env,
            CI: 'true',
            FIXTURE_TARGETS: JSON.stringify(targets),
            ...env,
          },
        },
      ));
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('stdout' in error) ||
        !('stderr' in error) ||
        !('code' in error) ||
        typeof error.code !== 'number'
      )
        throw error;
      stdout = String(error.stdout);
      stderr = String(error.stderr);
      exitCode = error.code;
    }
    return {
      exitCode,
      stdout,
      stderr,
      document: JSON.parse(stdout) as CommandJson<DatabaseCommandResult>,
      events: existsSync(trace)
        ? readFileSync(trace, 'utf8').trim().split('\n')
        : [],
    };
  }
  async function inspect(name: string) {
    const resolved = await import('@nocobase/app-server/database').then(
      (module) => module.resolveDatabaseConfig(database),
    );
    const manager = createAppDatabaseManager(resolved)!;
    try {
      return (
        await manager.connection(name).schemaInspector.listPhysicalCollections()
      ).items.map((item) => item.tableName);
    } finally {
      await manager.destroy();
    }
  }
  return {
    root,
    storageFiles: Object.values(database.connections).flatMap((connection) =>
      typeof connection.filename === 'string' ? [connection.filename] : [],
    ),
    sources,
    run,
    inspect,
    async close() {
      await databases.drop();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
