// The database every server test runs on: whichever dialect the environment
// selects, SQLite by default, with this plugin's migrations applied.
import path from 'node:path';

import { createDatabaseTest } from '@nocobase/app-testing/server';
import type { MigrationSource } from '@nocobase/db';

export const migrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-lifecycle-example',
    directory: path.resolve(import.meta.dirname, '../database/migrations'),
  },
];

export const test: ReturnType<typeof createDatabaseTest> = createDatabaseTest({
  migrations,
});
