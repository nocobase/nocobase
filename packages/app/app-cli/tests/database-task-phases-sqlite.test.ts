// SQLite-only: real CLI previews must not create missing storage or parent directories.
// @vitest-environment node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { testDatabaseDialect } from '@nocobase/db-testing';
import { expect, it } from 'vitest';
import { createDatabasePhasesFixture } from './database-phases-fixture.ts';

it.skipIf(testDatabaseDialect() !== 'sqlite')(
  'previews missing storage through the real CLI without running preparation hooks',
  async () => {
    const f = await createDatabasePhasesFixture({ missingStorage: true });
    try {
      f.sources('main');
      for (const command of ['apply', 'reset']) {
        const result = await f.run(['db', command, '--all', '--dry-run']);
        expect(result.exitCode).toBe(0);
        expect(result.document).toMatchObject({
          ok: true,
          status: 'success-noop',
        });
        expect(result.events).toEqual(['shutdown:resources']);
        for (const file of f.storageFiles) {
          expect(existsSync(file)).toBe(false);
          expect(existsSync(path.dirname(file))).toBe(false);
        }
      }
    } finally {
      await f.close();
    }
  },
  30_000,
);
