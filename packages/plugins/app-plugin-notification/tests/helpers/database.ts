import { fileURLToPath } from 'node:url';

import type { MigrationSource } from '@nocobase/db';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';

/** This package's migrations, as the application loads them. */
export const notificationMigrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-notification',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

/**
 * A database of its own on the dialect the environment selects, with the
 * notification migrations applied. `destroy()` closes and drops it.
 */
export function createNotificationTestDatabase(): Promise<TestDatabase> {
  return createTestDatabase({ migrations: notificationMigrations });
}
