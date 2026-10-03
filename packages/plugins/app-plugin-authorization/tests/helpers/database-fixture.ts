import { fileURLToPath } from 'node:url';
import {
  createMigrator,
  type DatabaseConnection,
  type DatabaseManager,
  type MigrationContext,
} from '@nocobase/db';

/** The migrations directory of a plugin under `packages/plugins`. */
export function pluginMigrations(plugin: string): {
  packageName: string;
  directory: string;
} {
  return {
    packageName: `@nocobase/${plugin}`,
    directory: fileURLToPath(
      new URL(`../../../${plugin}/database/migrations`, import.meta.url),
    ),
  };
}

/** Runs the named plugins' migrations, in order, against `database`. */
export async function migratePlugins(
  database: DatabaseManager,
  ...plugins: readonly string[]
): Promise<void> {
  await createMigrator({
    database,
    sources: plugins.map(pluginMigrations),
  }).latest();
}

/** What a migration of this package reads when it is run by hand. */
export function migrationContext(
  connection: DatabaseConnection,
): MigrationContext {
  return {
    builder: connection.builder,
    query: connection.query,
    connection,
  } as unknown as MigrationContext;
}
