import { fileURLToPath } from 'node:url';
import type { MigrationSource } from '@nocobase/db';

/** This package's migrations, as the application loads them. */
export const schedulerMigrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-scheduler',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];
