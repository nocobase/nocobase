// db-test-portability: sqlite-only — a dry run must not create a missing SQLite database file; server databases always exist
import type { ConnectionConfigFromDrivers } from '@nocobase/db';
import sqlite from '@nocobase/db-sqlite';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createAppPaths } from '../src/config/index.js';
import {
  runAppDatabaseTasks,
  type AppDatabaseConfig as GenericAppDatabaseConfig,
  type AppDatabaseTaskContributions,
} from '../src/database/index.js';

const drivers = { sqlite };
type AppDatabaseConfig = GenericAppDatabaseConfig<
  ConnectionConfigFromDrivers<typeof drivers>
>;

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('a dry run of the database tasks on SQLite', () => {
  it('answers for an empty database without creating the missing file or its directory', async () => {
    const parent = path.resolve('tests/.tmp');
    mkdirSync(parent, { recursive: true });
    const root = mkdtempSync(path.join(parent, 'task-plan-sqlite-'));
    roots.push(root);
    const paths = createAppPaths({ rootDir: root });
    const config: AppDatabaseConfig = {
      drivers,
      default: 'main',
      connections: {
        main: {
          dialect: 'sqlite',
          filename: paths.storage('main/data.sqlite'),
        },
      },
    };
    const contributions: AppDatabaseTaskContributions = {
      appPackageName: 'test-app',
      migrations: [],
      seeds: [],
    };
    const directory = paths.database('main/migrations');
    mkdirSync(directory, { recursive: true });
    writeFileSync(
      path.join(directory, '001_rows.ts'),
      `import { defineMigration } from '@nocobase/db';
export default defineMigration({ name: '001_rows', async up({ builder }) {
await builder.createCollection('rows', c => { c.increments('id'); c.string('value'); });
}, async down({ builder }) { await builder.dropCollection('rows'); } });`,
    );

    const plan = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: 'migrations',
      dryRun: true,
    });
    expect(plan.results).toEqual([
      {
        connection: 'main',
        kind: 'migrations',
        status: 'completed',
        pending: ['001_rows'],
        skipped: [],
        dryRun: true,
      },
    ]);
    // The database did not exist, and a dry run does not create it: it answers for an empty one without connecting.
    const file = paths.storage('main/data.sqlite');
    expect(existsSync(file)).toBe(false);
    expect(existsSync(path.dirname(file))).toBe(false);
  });
});
