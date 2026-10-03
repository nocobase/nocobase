import { fileURLToPath } from 'node:url';
import type { MigrationSource, SeedSource } from '@nocobase/db';

const packageName = '@nocobase/app-plugin-template-print-example';

/** This plugin's migrations, as the application loads them. */
export const migrations: readonly MigrationSource[] = [
  {
    packageName,
    directory: fileURLToPath(
      new URL('../database/migrations', import.meta.url),
    ),
  },
];

/** This plugin's seeds, as the application loads them. */
export const seeds: readonly SeedSource[] = [
  {
    packageName,
    directory: fileURLToPath(new URL('../database/seeds', import.meta.url)),
  },
];
