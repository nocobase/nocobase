// db-test-portability: dialect-specific — drives the application planner against SQLite files
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import sqlite from '@nocobase/db-sqlite';
import { createAppPaths } from '../src/config/index.js';
import {
  createAppDatabaseManager,
  runAppDatabaseTasks,
  type AppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';

const drivers = { sqlite };
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

const name = '202611180001_create_rows';
const contributions: AppDatabaseTaskContributions = {
  appPackageName: 'test-app',
  migrations: [],
  seeds: [],
};

function fixture(form: 'directory' | 'sources') {
  const parent = path.resolve('tests/.tmp');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(path.join(parent, 'missing-plan-'));
  roots.push(root);
  const paths = createAppPaths({ rootDir: root });
  const directory = path.join(root, 'explicit-migrations');
  const migrations = (onMissingSource?: 'error' | 'warn') => ({
    ...(form === 'directory'
      ? { directory }
      : { sources: [{ directory, packageName: 'test-app' }] }),
    ...(onMissingSource ? { onMissingSource } : {}),
  });
  const config = (onMissingSource?: 'error' | 'warn'): AppDatabaseConfig =>
    ({
      drivers,
      default: 'main',
      connections: {
        main: {
          dialect: 'sqlite',
          filename: paths.storage('main/data.sqlite'),
          migrations: migrations(onMissingSource),
        },
      },
    }) as AppDatabaseConfig;
  const run = (
    onMissingSource: 'error' | 'warn' | undefined,
    options: { operation?: 'run' | 'rollback'; dryRun?: boolean } = {},
  ) =>
    runAppDatabaseTasks(config(onMissingSource), {
      paths,
      contributions,
      kind: 'migrations',
      ...options,
    });
  const install = async () => {
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, `${name}.ts`),
      `import { defineMigration } from '@nocobase/db';
export default defineMigration({
  name: '${name}',
  async up({ builder, query }) {
    await builder.createCollection('rows', c => { c.increments('id'); c.string('event'); });
    await query.insertInto('rows').values({ event: 'up' }).execute();
  },
  async down({ query }) {
    await query.insertInto('rows').values({ event: 'down' }).execute();
  },
});
`,
    );
    await run(undefined);
    rmSync(directory, { recursive: true });
  };
  const inspect = async () => {
    const database = createAppDatabaseManager(config(), paths)!;
    try {
      const client = await database.connection('main').client<Knex>();
      return {
        rows: await client('rows').select('event'),
        history: await client('__nocobase_migrations').select('name'),
      };
    } finally {
      await database.destroy();
    }
  };
  return { paths, directory, run, install, inspect };
}

describe.each(['directory', 'sources'] as const)(
  'application planner with a missing explicit migration %s',
  (form) => {
    it.each([{}, { dryRun: true }, { operation: 'rollback' as const }])(
      'still rejects a mistyped path when nothing was ever migrated (%o)',
      async (options) => {
        const { paths, run } = fixture(form);
        await expect(run(undefined, options)).rejects.toThrow(
          'Explicit database migrations source is missing',
        );
        expect(existsSync(paths.storage('main/data.sqlite'))).toBe(false);
      },
    );

    it('warns by default and keeps the history when the directory has disappeared', async () => {
      const { run, install, inspect } = fixture(form);
      await install();
      const result = await run(undefined);
      expect(result).toMatchObject({
        ok: true,
        status: 'completed',
        results: [
          {
            status: 'completed',
            executed: [],
            warnings: [
              { kind: 'missing-source', packageName: 'test-app', name },
            ],
          },
        ],
      });
      expect(await inspect()).toEqual({
        rows: [{ event: 'up' }],
        history: [{ name }],
      });
    });

    it('refuses a forward run under onMissingSource "error"', async () => {
      const { run, install, inspect } = fixture(form);
      await install();
      await expect(run('error')).rejects.toThrow(
        'missing from migration sources',
      );
      expect(await inspect()).toEqual({
        rows: [{ event: 'up' }],
        history: [{ name }],
      });
    });

    it.each(['warn', 'error'] as const)(
      'preflights a real and a dry rollback of the target batch under %s',
      async (policy) => {
        const { run, install, inspect } = fixture(form);
        await install();
        for (const dryRun of [true, false]) {
          const error = await run(policy, {
            operation: 'rollback',
            dryRun,
          }).catch((error: unknown) => error);
          expect(error).toBeInstanceOf(Error);
          const message = (error as Error).message;
          expect(message).toContain('test-app');
          expect(message).toContain(name);
          expect(message).toContain('missing from migration sources');
          expect(message).toContain('Restore compatible versions');
          expect(await inspect()).toEqual({
            rows: [{ event: 'up' }],
            history: [{ name }],
          });
        }
      },
    );
  },
);

it('rejects a fresh run with a missing explicit directory before confirming', async () => {
  const { paths, directory } = fixture('directory');
  let confirmed = false;
  await expect(
    runAppDatabaseTasks(
      {
        drivers,
        default: 'main',
        connections: {
          main: {
            dialect: 'sqlite',
            filename: paths.storage('main/data.sqlite'),
            migrations: { directory },
          },
        },
      } as AppDatabaseConfig,
      {
        paths,
        contributions,
        kind: 'migrations',
        fresh: true,
        confirmFresh: async () => {
          confirmed = true;
          return true;
        },
      },
    ),
  ).rejects.toThrow('Explicit database migrations source is missing');
  expect(confirmed).toBe(false);
});

it('rejects a fresh run even when history exists, since fresh discards it', async () => {
  const { paths, directory, install, inspect } = fixture('directory');
  await install();
  await expect(
    runAppDatabaseTasks(
      {
        drivers,
        default: 'main',
        connections: {
          main: {
            dialect: 'sqlite',
            filename: paths.storage('main/data.sqlite'),
            migrations: { directory },
          },
        },
      } as AppDatabaseConfig,
      { paths, contributions, kind: 'migrations', fresh: true },
    ),
  ).rejects.toThrow('Explicit database migrations source is missing');
  expect(await inspect()).toEqual({
    rows: [{ event: 'up' }],
    history: [{ name: '202611180001_create_rows' }],
  });
});
