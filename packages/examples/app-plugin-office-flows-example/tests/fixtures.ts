// The plugin's migrations and seeds as the test databases apply them, on
// whichever dialect the environment selects, SQLite by default.
import path from 'node:path';

import type { MigrationSource, SeedSource } from '@nocobase/db';

const packageName = '@nocobase/app-plugin-office-flows-example';
const root = path.resolve(import.meta.dirname, '..');

export const migrations: readonly MigrationSource[] = [
  { packageName, directory: path.join(root, 'database/migrations') },
];

export const seeds: readonly SeedSource[] = [
  { packageName, directory: path.join(root, 'database/seeds') },
];
