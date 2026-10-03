import { fileURLToPath } from 'node:url';
import type { MigrationSource, SeedSource } from '@nocobase/db';

export const migrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/db-testing-fixture',
    directory: fileURLToPath(new URL('./migrations', import.meta.url)),
  },
];

export const seeds: readonly SeedSource[] = [
  {
    packageName: '@nocobase/db-testing-fixture',
    directory: fileURLToPath(new URL('./seeds', import.meta.url)),
  },
];

export const leakyMigrations: readonly MigrationSource[] = [
  {
    packageName: '@nocobase/db-testing-fixture',
    directory: fileURLToPath(new URL('./leaky-migrations', import.meta.url)),
  },
];
