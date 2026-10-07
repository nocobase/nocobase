import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MigrationSource } from '@nocobase/db';

/** The migrations directory of an installed plugin this package depends on. */
function dependencyMigrations(packageName: string): MigrationSource {
  return {
    packageName,
    directory: join(
      dirname(
        createRequire(import.meta.url).resolve(`${packageName}/package.json`),
      ),
      'database/migrations',
    ),
  };
}

/**
 * The authentication plugin's migrations, which create the `user` table that
 * `aiConversations.userId` and `aiUsageEvents.userId` reference. SQLite does
 * not check that a foreign key's target exists when the constraint is
 * created; every other dialect refuses the constraint without it.
 */
export const authenticationMigrations: readonly MigrationSource[] = [
  dependencyMigrations('@nocobase/app-plugin-authentication'),
];

/**
 * The authorization plugin's migrations, which create the Permission Set table
 * whose grants `202610070001_ai_employee_settings_permissions` rewrites.
 */
export const authorizationMigrations: readonly MigrationSource[] = [
  dependencyMigrations('@nocobase/app-plugin-authorization'),
];

/** This plugin's own migrations, without the ones it depends on. */
const ownMigrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/app-plugin-ai-employee',
    directory: fileURLToPath(
      new URL('../../database/migrations', import.meta.url),
    ),
  },
];

/**
 * This plugin's migrations together with those of the plugins whose tables
 * its schema references, as an application that installs it loads them.
 */
export const aiEmployeeMigrations: readonly MigrationSource[] = [
  ...authenticationMigrations,
  ...authorizationMigrations,
  ...ownMigrations,
];
