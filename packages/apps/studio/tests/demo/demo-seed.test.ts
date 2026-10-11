// @vitest-environment node
/**
 * The demo data switch: the seed asks for the demo only when `studio.demoData` is on, once.
 */
import path from 'node:path';

import {
  provisionTestDatabases,
  type ProvisionedTestDatabases,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import type { DatabaseManager } from '@nocobase/db';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import seed from '../../database/main/seeds/202610010040_studio_demo_data.js';

const ROOT = path.resolve(import.meta.dirname, '../..');

let databases: ProvisionedTestDatabases;
let testDatabase: TestDatabase;
let database: DatabaseManager;

beforeAll(async () => {
  databases = await provisionTestDatabases();
});
afterAll(() => databases.drop());

beforeEach(async () => {
  testDatabase = await databases.open({
    migrations: [
      {
        directory: path.join(ROOT, 'database/main/migrations'),
        packageName: '@nocobase/studio',
      },
    ],
  });
  database = testDatabase.database;
});
afterEach(() => testDatabase.destroy());

async function run(demoData: unknown): Promise<void> {
  await seed.run({
    query: database.connection().query,
    config: {
      get: <T>(key: string) =>
        (key === 'studio.demoData' ? demoData : undefined) as T | undefined,
    },
  } as never);
}

async function setting(): Promise<unknown> {
  const row = await database
    .connection()
    .query.selectFrom('studioSettings')
    .select('value')
    .where('key', '=', 'demoData')
    .executeTakeFirst();
  return row
    ? typeof row.value === 'string'
      ? JSON.parse(row.value)
      : row.value
    : null;
}

describe('the demo data seed', () => {
  it('asks for nothing while the switch is off', async () => {
    await run(undefined);
    await run(false);
    await run('true');
    expect(await setting()).toBeNull();
  });

  it('asks for the demo once when the switch is on', async () => {
    await run(true);
    expect(await setting()).toEqual({ state: 'pending' });
    await database
      .connection()
      .query.updateTable('studioSettings')
      .set({ value: JSON.stringify({ state: 'done' }) })
      .where('key', '=', 'demoData')
      .execute();
    await run(true);
    expect(await setting()).toEqual({ state: 'done' });
  });
});
