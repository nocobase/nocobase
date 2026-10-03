import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { validateMigrations, validateSeeds } from '@nocobase/db';
import { describeMigration } from '@nocobase/app-testing/server';
import { describe, expect, it } from 'vitest';

const migrationsDirectory = fileURLToPath(
  new URL('../database/migrations', import.meta.url),
);
const seedsDirectory = fileURLToPath(
  new URL('../database/seeds', import.meta.url),
);
const migrations = [
  {
    packageName: __NOCOBASE_PACKAGE_NAME_LITERAL__,
    directory: migrationsDirectory,
  },
];

describe(__NOCOBASE_PACKAGE_NAME_LITERAL__, () => {
  it('loads its migrations and seeds', async () => {
    await expect(validateMigrations(migrationsDirectory)).resolves.toBeInstanceOf(
      Array,
    );
    await expect(validateSeeds(seedsDirectory)).resolves.toBeInstanceOf(Array);
  });
});

// Runs once the example migration is enabled, on SQLite by default and on the dialect NOCOBASE_TEST_DB_DIALECT names
// otherwise. Every migration gets a test of this shape: it applies, rolls back and reapplies the migration and checks
// that the schema matches its metadata after each step.
if (
  existsSync(
    fileURLToPath(
      new URL(
        '../database/migrations/__NOCOBASE_MIGRATION_NAME__.ts',
        import.meta.url,
      ),
    ),
  )
) {
  describeMigration(__NOCOBASE_MIGRATION_NAME_LITERAL__, {
    sources: migrations,
    up: async ({ expectCollection }) => {
      await expectCollection(__NOCOBASE_COLLECTION_NAME_LITERAL__).toHaveField(
        'name',
        { type: 'string', nullable: false, length: 255 },
      );
    },
    down: async ({ expectCollection }) => {
      await expectCollection(__NOCOBASE_COLLECTION_NAME_LITERAL__).not.toExist();
    },
  });
}
