import {
  appendFileSync,
  copyFileSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Access tests need settings and the recovery journal, not build, preview, runner or Git schemas. */
export function accessMigrationFixture() {
  const root = path.resolve(import.meta.dirname, '../..');
  const directory = mkdtempSync(
    path.join(tmpdir(), 'studio-access-migrations-'),
  );
  symlinkSync(
    path.join(root, 'node_modules'),
    path.join(directory, 'node_modules'),
    'dir',
  );
  for (const name of [
    '202610010020_studio_create_settings.ts',
    '202610250010_studio_access_upgrade_changes.ts',
  ])
    copyFileSync(
      path.join(root, 'database/main/migrations', name),
      path.join(directory, name),
    );
  return {
    directory,
    packageName: 'studio',
    dispose: () => rmSync(directory, { recursive: true, force: true }),
  };
}

export function recordAccessFixtureCost(suite: string, milliseconds: number) {
  const directory = process.env.PM358_FIXTURE_COST_DIR;
  if (directory)
    appendFileSync(
      path.join(directory, 'access-fixtures.jsonl'),
      JSON.stringify({
        suite,
        dialect: process.env.NOCOBASE_TEST_DB_DIALECT ?? 'sqlite',
        milliseconds,
      }) + '\n',
    );
}
