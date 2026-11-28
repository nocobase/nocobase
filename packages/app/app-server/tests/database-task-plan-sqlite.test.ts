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
  type AppDatabasePlanExecutionOptions,
  createAppDatabaseManager,
  executeAppDatabasePlan,
  planAppDatabaseTasks,
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
    const seeds = paths.database('main/seeds');
    mkdirSync(seeds, { recursive: true });
    for (const [name, sample] of [
      ['002_required', false],
      ['003_sample', true],
    ]) {
      writeFileSync(
        path.join(seeds, `${name}.ts`),
        `import { defineSeed } from '@nocobase/db';
export default defineSeed({ name: '${name}', sample: ${sample}, async run() {} });`,
      );
    }

    const plan = await runAppDatabaseTasks(config, {
      paths,
      contributions,
      kind: ['migrations', 'seeds'],
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
      {
        connection: 'main',
        kind: 'seeds',
        status: 'completed',
        pending: ['002_required'],
        skipped: [],
        dryRun: true,
      },
    ]);

    const samplePlan = planAppDatabaseTasks(config, ['seeds'], {
      paths,
      contributions,
      drivers,
    });
    const database = createAppDatabaseManager(config, paths, drivers)!;
    const options: AppDatabasePlanExecutionOptions = {
      paths,
      contributions,
      drivers,
      dryRun: true,
      runtimeConfig: {
        get: <T>(key: string): T | undefined =>
          key === 'app.sampleData' ? (true as T) : undefined,
      },
    };
    try {
      const enabled = await executeAppDatabasePlan(
        database,
        config,
        samplePlan,
        options,
      );
      expect(enabled.results[0].pending).toEqual([
        '002_required',
        '003_sample',
      ]);
      const overridden = await executeAppDatabasePlan(
        database,
        config,
        samplePlan,
        {
          ...options,
          sample: { enabled: false },
        },
      );
      expect(overridden.results[0].pending).toEqual(['002_required']);
    } finally {
      await database.destroy();
    }
    // The database did not exist, and a dry run does not create it: it answers for an empty one without connecting.
    const file = paths.storage('main/data.sqlite');
    expect(existsSync(file)).toBe(false);
    expect(existsSync(path.dirname(file))).toBe(false);
  });
});
