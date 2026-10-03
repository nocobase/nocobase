import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseTestDbArguments,
  TestDbUsageError,
} from '../../scripts/test-db.mjs';

test('runs each filtered package test script with the remaining arguments', () => {
  assert.deepEqual(
    parseTestDbArguments([
      'postgres',
      '--filter',
      '@nocobase/app-plugin-scheduler',
      '--filter=@nocobase/db-testing',
      '--',
      'tests/database.test.ts',
    ]),
    {
      dialect: 'postgres',
      command: 'pnpm',
      args: [
        '--filter',
        '@nocobase/app-plugin-scheduler',
        '--filter',
        '@nocobase/db-testing',
        '--workspace-concurrency=1',
        '--no-bail',
        'run',
        'test',
        'tests/database.test.ts',
      ],
    },
  );
});

test('refuses to run the whole workspace or a malformed request', () => {
  for (const argv of [
    [],
    ['--filter', 'x'],
    ['postgres'],
    ['Postgres;', '--filter', 'x'],
    ['postgres', '--filter'],
    ['postgres', '--filter', 'x', 'tests/a.test.ts'],
  ]) {
    assert.throws(
      () => parseTestDbArguments(argv),
      TestDbUsageError,
      argv.join(' '),
    );
  }
});
