import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  checkDbTestPortability,
  EXEMPT,
  findEntryViolations,
  findViolations,
  readMarker,
} from '../../scripts/check-db-test-portability.mjs';

const rules = (source) =>
  findViolations(source).map((violation) => violation.rule);

test('finds each way a test chooses SQLite', () => {
  assert.deepEqual(rules("import sqlite from '@nocobase/db-sqlite';"), [
    'dialect-import',
  ]);
  assert.deepEqual(
    rules("const m = await import('@nocobase/db-postgres/testing');"),
    ['dialect-import'],
  );
  assert.deepEqual(rules("{ filename: ':memory:' }"), ['memory-database']);
  assert.deepEqual(rules("{ dialect: 'sqlite' }"), ['sqlite-dialect']);
  assert.deepEqual(rules("client.raw('PRAGMA index_list(jobs)')"), ['pragma']);
  assert.deepEqual(rules("client.raw('select name from sqlite_master')"), [
    'sqlite-catalog',
  ]);
  assert.deepEqual(
    rules(
      "client.raw('CREATE TRIGGER t BEFORE INSERT ON x BEGIN SELECT 1; END')",
    ),
    ['trigger'],
  );
  assert.deepEqual(rules("client.raw('PRAGMA foreign_keys = ON')"), ['pragma']);
  assert.deepEqual(rules("import Database from 'better-sqlite3';"), [
    'sqlite-driver',
  ]);
  assert.deepEqual(
    rules("knex({ client: 'better-sqlite3', connection: { filename } })"),
    ['sqlite-driver'],
  );
  assert.deepEqual(rules('await import(`@nocobase/db-${dialect}`);'), [
    'dynamic-dialect-import',
  ]);
});

test('leaves portable tests and look-alikes alone', () => {
  assert.deepEqual(
    rules("import { createDatabaseTest } from '@nocobase/db-testing/vitest';"),
    [],
  );
  assert.deepEqual(
    rules("expect(headers.get('pragma')).toBe('no-cache');"),
    [],
  );
  assert.deepEqual(rules("const spec = '@nocobase/db-postgres@^0.1.0';"), []);
  // Prose about what a ported test replaced is not SQL.
  assert.deepEqual(
    rules('// replaces the old PRAGMA assertions with expectCollection'),
    [],
  );
  // A package name in a manifest fixture is not a driver import.
  assert.deepEqual(rules("const builds = { 'better-sqlite3': false };"), []);
});

test('sends an application or a plugin to app-testing for its fixtures', () => {
  const entryRules = (relativePath, source) =>
    findEntryViolations(relativePath, source).map(
      (violation) => violation.rule,
    );
  const plugin = 'packages/plugins/a/tests/a.test.ts';

  assert.deepEqual(
    entryRules(
      plugin,
      "import { createDatabaseTest } from '@nocobase/db-testing/vitest';",
    ),
    ['db-testing-entry'],
  );
  assert.deepEqual(
    entryRules(
      'packages/templates/t/tests/logic/x.test.ts',
      "import { provisionTestDatabases } from '@nocobase/db-testing';",
    ),
    ['db-testing-entry'],
  );
  assert.deepEqual(
    entryRules(
      'packages/examples/e/tests/cli.test.ts',
      "const { runAppCommand } = await import('@nocobase/app-cli/testing');",
    ),
    ['app-cli-testing-entry'],
  );
  assert.deepEqual(
    entryRules(
      plugin,
      "import { describeMigration } from '@nocobase/app-testing/server';\nimport { runAppCommand } from '@nocobase/app-testing/cli';",
    ),
    [],
  );
  // A library or a tool builds on the layers below app-testing directly.
  assert.deepEqual(
    entryRules(
      'packages/libs/queue/tests/q.test.ts',
      "import { createDatabaseTest } from '@nocobase/db-testing/vitest';",
    ),
    [],
  );
  // Naming the package in prose or in a list of linked packages is not an import.
  assert.deepEqual(
    entryRules(
      plugin,
      "// see @nocobase/db-testing's README\nconst links = ['@nocobase/db-testing'];",
    ),
    [],
  );
});

test('reads a marker and requires a reason', () => {
  assert.deepEqual(
    readMarker('// db-test-portability: sqlite-only — the driver under test\n'),
    {
      kind: 'sqlite-only',
      reason: 'the driver under test',
    },
  );
  assert.deepEqual(
    readMarker(
      '// @vitest-environment node\n// db-test-portability: dialect-specific - each dialect\n',
    ),
    {
      kind: 'dialect-specific',
      reason: 'each dialect',
    },
  );
  assert.deepEqual(readMarker('// db-test-portability: sqlite-only\n'), {
    kind: 'sqlite-only',
    reason: undefined,
  });
  assert.equal(readMarker("import x from 'y';\n"), undefined);
});

test('reports a listed file that is marked or no longer chooses a dialect', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'db-test-portability-'));
  try {
    const write = (relativePath, source) => {
      const file = path.join(root, relativePath);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, source);
    };
    const [exempt, markedExempt] = EXEMPT.keys();
    write(exempt, 'const portable = true;\n');
    write(
      markedExempt,
      "// db-test-portability: sqlite-only — the SQLite driver\nconst c = { dialect: 'sqlite' };\n",
    );

    const problems = await checkDbTestPortability({ repositoryRoot: root });
    const about = (file) =>
      problems.filter((problem) => problem.file === file).map((p) => p.message);

    assert.match(about(exempt).join('\n'), /remove it from EXEMPT/);
    assert.match(about(markedExempt).join('\n'), /also listed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports unmarked tests and helpers but not marked ones or the database packages', async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'db-test-portability-'));
  try {
    const write = (relativePath, source) => {
      const file = path.join(root, relativePath);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, source);
    };
    write(
      'packages/plugins/a/tests/a.test.ts',
      "const c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/plugins/a/tests/support/database.ts',
      "const c = { filename: ':memory:' };\n",
    );
    write(
      'packages/plugins/a/server/index.ts',
      "const c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/plugins/b/tests/b.test.ts',
      "// db-test-portability: sqlite-only — the SQLite driver\nconst c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/plugins/c/tests/c.test.ts',
      "// db-test-portability: sqlite-only\nconst c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/libs/db-sqlite/tests/x.test.ts',
      "const c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/plugins/e/tests/e.test.ts',
      "// db-test-portability: sqlite-only — the SQLite driver\nimport { createDatabaseTest } from '@nocobase/db-testing/vitest';\nconst c = { dialect: 'sqlite' };\n",
    );
    write(
      'packages/plugins/d/tests/d.test.ts',
      "// db-test-portability: sqlite-only — ported since\nconst c = { dialect: 'postgres' };\n",
    );

    const problems = await checkDbTestPortability({ repositoryRoot: root });
    const files = problems.map((problem) => problem.file);

    assert.ok(files.includes('packages/plugins/a/tests/a.test.ts'));
    assert.ok(files.includes('packages/plugins/a/tests/support/database.ts'));
    assert.ok(!files.includes('packages/plugins/a/server/index.ts'));
    assert.ok(!files.includes('packages/plugins/b/tests/b.test.ts'));
    assert.ok(
      problems.some(
        (problem) =>
          problem.file === 'packages/plugins/c/tests/c.test.ts' &&
          /gives no reason/.test(problem.message),
      ),
    );
    assert.ok(!files.includes('packages/libs/db-sqlite/tests/x.test.ts'));
    // A marker that no longer covers a violation is stale, like a listed file.
    assert.ok(
      problems.some(
        (problem) =>
          problem.file === 'packages/plugins/d/tests/d.test.ts' &&
          /remove its db-test-portability marker/.test(problem.message),
      ),
    );
    // A marker covers the dialect rules, never the entry rule.
    assert.ok(
      problems.some(
        (problem) =>
          problem.file === 'packages/plugins/e/tests/e.test.ts' &&
          /@nocobase\/app-testing\/server/.test(problem.message),
      ),
    );
    // Listed files that do not exist in this synthetic repository are reported as stale entries.
    assert.ok(
      problems.some((problem) => /no longer exists/.test(problem.message)),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
