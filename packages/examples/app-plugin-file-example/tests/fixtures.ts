import path from 'node:path';
import type { MigrationSource } from '@nocobase/db';
import example from '../server/index.js';

export const migrationsDirectory: string = path.resolve(
  import.meta.dirname,
  '../database/migrations',
);

/** This plugin's migrations, as the application loads them. */
export const migrations: readonly MigrationSource[] = [
  { packageName: example.packageName, directory: migrationsDirectory },
];
