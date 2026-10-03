// db-test-portability: sqlite-only — a dry run must not create the SQLite file, or its directory, of a database that does not exist yet
// @vitest-environment node
import sqlite from '@nocobase/db-sqlite';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import AppDbApply from '../src/commands/db/apply.ts';
import AppDbRedo from '../src/commands/db/redo.ts';
import AppDbRepair from '../src/commands/db/repair.ts';
import AppDbReset from '../src/commands/db/reset.ts';
import AppDbRollback from '../src/commands/db/rollback.ts';
import { runAppCommand } from './command-output.ts';
import {
  databaseCommandFixture,
  removeFixtureRoots,
} from './database-command-fixture.ts';

afterEach(() => {
  removeFixtureRoots();
});

describe('previewing a database command with --dry-run', () => {
  it('creates no storage for a database that does not exist yet', async () => {
    const { root, bind, migration, seed, paths } = databaseCommandFixture({
      database: (paths) => ({
        drivers: { sqlite },
        default: 'main',
        connections: {
          main: { dialect: 'sqlite', filename: paths.storage('main.sqlite') },
        },
      }),
    });
    migration('main');
    seed('main');
    const file = paths.storage('main.sqlite');
    expect(existsSync(file)).toBe(false);
    for (const [command, argv] of [
      [AppDbApply, []],
      [AppDbReset, []],
      [AppDbRollback, []],
      [AppDbRedo, []],
      [AppDbRepair, []],
    ] as const) {
      const run = await runAppCommand(
        bind(command),
        ['--json', '--dry-run', ...argv],
        root,
      );
      expect(run.json()).toMatchObject({ ok: true, status: 'success-noop' });
    }
    const apply = await runAppCommand(
      bind(AppDbApply),
      ['--json', '--dry-run'],
      root,
    );
    expect(apply.json()).toMatchObject({
      result: {
        plan: [
          { kind: 'migrations', action: 'apply', tasks: ['001_create'] },
          { kind: 'seeds', action: 'apply', tasks: ['001_defaults'] },
        ],
      },
    });
    expect(existsSync(file)).toBe(false);
    expect(existsSync(path.dirname(file))).toBe(false);
  });
});
