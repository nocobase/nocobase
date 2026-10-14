import { fileURLToPath } from 'node:url';

import {
  createDatabaseTest,
  type DatabaseTestAPI,
} from '@nocobase/app-testing/server';

export const migrations = [
  {
    packageName: '@nocobase/app-plugin-agent-sessions',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

/** A test with the plugin's collections migrated, emptied before each test. */
export const test: DatabaseTestAPI = createDatabaseTest({ migrations });
