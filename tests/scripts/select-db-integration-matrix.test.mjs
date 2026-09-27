import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  databases,
  planDbIntegration,
  selectDatabases,
} from '../../scripts/select-db-integration-matrix.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const script = path.join(root, 'scripts/select-db-integration-matrix.mjs');

function createRepository(t) {
  const cwd = mkdtempSync(path.join(os.tmpdir(), 'db-integration-plan-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  git('init', '--quiet');
  git('config', 'user.name', 'CI Test');
  git('config', 'user.email', 'ci-test@example.com');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.hooksPath', '/dev/null');
  const write = (file, content = file) => {
    mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
    writeFileSync(path.join(cwd, file), content);
  };
  const commit = () => {
    git('add', '--all');
    git('commit', '--quiet', '--allow-empty', '-m', 'Fixture');
    return git('rev-parse', 'HEAD');
  };
  return { cwd, git, write, commit };
}

test('each integration package is represented in the matrix', () => {
  const libraryRoot = path.join(root, 'packages/libs');
  const dialects = readdirSync(libraryRoot)
    .filter((name) => name.startsWith('db-'))
    .filter(
      (name) =>
        JSON.parse(
          readFileSync(path.join(libraryRoot, name, 'package.json'), 'utf8'),
        ).scripts?.['test:integration'],
    )
    .map((name) => name.slice(3));
  assert.deepEqual([...databases].sort(), dialects.sort());
});

test('a dialect change selects only that dialect, including package configuration and tests', () => {
  for (const database of databases) {
    for (const file of [
      'src/index.ts',
      'tests/integration/core-suite.test.ts',
      'scripts/test-integration.ts',
      'package.json',
      'README.md',
    ]) {
      assert.deepEqual(
        selectDatabases([`packages/libs/db-${database}/${file}`]),
        [database],
      );
    }
  }
});

test('multiple dialects are deduplicated in matrix order', () => {
  assert.deepEqual(
    selectDatabases([
      'packages/libs/db-mysql/src/index.ts',
      'packages/libs/db-postgres/package.json',
      'packages/libs/db-mysql/tests/unit.test.ts',
    ]),
    ['postgres', 'mysql'],
  );
});

test('shared database code and dependency or CI inputs select every database', () => {
  for (const file of [
    'packages/libs/db/src/index.ts',
    'packages/libs/db/tests/unit.test.ts',
    'packages/libs/db-testkit/tests/integration/query.test.ts',
    'packages/libs/db-testkit/src/integration-runner.ts',
    'packages/libs/service-provider/src/index.ts',
    'packages/libs/repository-input/src/index.ts',
    'packages/tools/dev-config/src/vitest/node.ts',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    '.npmrc',
    '.pnpmfile.cjs',
    'pnpmfile.cjs',
    'patches/knex.patch',
    '.github/workflows/quality.yml',
    'scripts/select-db-integration-matrix.mjs',
    'tests/scripts/select-db-integration-matrix.test.mjs',
  ]) {
    assert.deepEqual(selectDatabases([file]), databases, file);
  }
});

test('unrelated paths and empty changes skip the matrix', () => {
  assert.deepEqual(selectDatabases([]), []);
  assert.deepEqual(
    selectDatabases([
      'docs/db.md',
      'AGENTS.md',
      'packages/app/app-client/src/index.ts',
      'packages/libs/db-postgres-extra/src/index.ts',
      '.github/workflows/release-beta.yml',
    ]),
    [],
  );
});

test('git selection covers additions, deletion, renames in and out, and unusual filenames', (t) => {
  const repo = createRepository(t);
  repo.write('packages/libs/db-mysql/delete.ts');
  repo.write('packages/libs/db-postgres/move-out.ts');
  repo.write('docs/move-in.ts');
  const baseSha = repo.commit();
  rmSync(path.join(repo.cwd, 'packages/libs/db-mysql/delete.ts'));
  renameSync(
    path.join(repo.cwd, 'packages/libs/db-postgres/move-out.ts'),
    path.join(repo.cwd, 'docs/moved-out.ts'),
  );
  repo.write('packages/libs/db-kingbase/placeholder.ts');
  renameSync(
    path.join(repo.cwd, 'docs/move-in.ts'),
    path.join(repo.cwd, 'packages/libs/db-kingbase/moved-in.ts'),
  );
  repo.write('packages/libs/db-sqlite/空 格\nfile.ts');
  const headSha = repo.commit();
  assert.deepEqual(planDbIntegration({ ...repo, baseSha, headSha }).databases, [
    'sqlite',
    'postgres',
    'mysql',
    'kingbase',
  ]);
});

test('push selection includes the entire pushed range, not just the final commit', (t) => {
  const repo = createRepository(t);
  const baseSha = repo.commit();
  repo.write('packages/libs/db-oracle/src/index.ts');
  repo.commit();
  repo.write('docs/update.md');
  const headSha = repo.commit();
  assert.deepEqual(planDbIntegration({ ...repo, baseSha, headSha }).databases, [
    'oracle',
  ]);
  assert.deepEqual(
    planDbIntegration({ ...repo, baseSha: headSha, headSha }).databases,
    [],
  );
});

test('PR selection excludes target-branch changes already present in the base', (t) => {
  const repo = createRepository(t);
  const initial = repo.commit();
  repo.git('checkout', '-b', 'feature');
  repo.write('packages/libs/db-postgres/src/index.ts');
  repo.commit();
  repo.git('checkout', '-b', 'target', initial);
  repo.write('packages/libs/db/src/index.ts');
  const baseSha = repo.commit();
  repo.git('merge', '--no-ff', 'feature', '-m', 'PR merge');
  const headSha = repo.git('rev-parse', 'HEAD');
  assert.deepEqual(planDbIntegration({ ...repo, baseSha, headSha }).databases, [
    'postgres',
  ]);
});

test('missing or unavailable comparison commits conservatively select every database', (t) => {
  const repo = createRepository(t);
  const headSha = repo.commit();
  for (const baseSha of [undefined, '', '0'.repeat(40), 'f'.repeat(40)]) {
    assert.deepEqual(
      planDbIntegration({ ...repo, baseSha, headSha }).databases,
      databases,
    );
  }
  assert.deepEqual(
    planDbIntegration({ ...repo, baseSha: headSha }).databases,
    databases,
  );
});

test('the CLI publishes matrix outputs for selected and skipped runs', (t) => {
  const repo = createRepository(t);
  const baseSha = repo.commit();
  repo.write('packages/libs/db-mssql/src/index.ts');
  const headSha = repo.commit();
  const output = path.join(repo.cwd, 'github-output');
  for (const [base, expected] of [
    [baseSha, 'databases=["mssql"]\nshould_run=true\n'],
    [headSha, 'databases=[]\nshould_run=false\n'],
  ]) {
    writeFileSync(output, '');
    execFileSync(process.execPath, [script], {
      cwd: repo.cwd,
      env: {
        ...process.env,
        BASE_SHA: base,
        HEAD_SHA: headSha,
        GITHUB_OUTPUT: output,
      },
    });
    assert.equal(readFileSync(output, 'utf8'), expected);
  }
});

test('the actual Quality gate only accepts successful tests or an explicitly planned skip', () => {
  const workflow = readFileSync(
    path.join(root, '.github/workflows/quality.yml'),
    'utf8',
  );
  const gate = workflow.slice(
    workflow.indexOf('      - name: Verify parallel jobs'),
  );
  const shell = gate
    .split('        run: |\n')[1]
    .split('\n')
    .map((line) => line.slice(10))
    .join('\n');
  const passing = {
    CHANGED_FILES_RESULT: 'success',
    VALIDATION_RESULT: 'success',
    BUILD_RESULT: 'success',
    CREATE_APP_SMOKE_RESULT: 'success',
    APP_INSTALLER_SMOKE_RESULT: 'success',
    DB_PLAN_RESULT: 'success',
    DB_SHOULD_RUN: 'true',
    DB_INTEGRATION_RESULT: 'success',
  };
  const run = (overrides) =>
    spawnSync('bash', ['-e', '-c', shell], {
      env: { ...process.env, ...passing, ...overrides },
    }).status;
  assert.equal(run({}), 0);
  assert.equal(
    run({ DB_SHOULD_RUN: 'false', DB_INTEGRATION_RESULT: 'skipped' }),
    0,
  );
  for (const result of ['failure', 'cancelled', 'skipped', '']) {
    assert.notEqual(
      run({
        DB_PLAN_RESULT: result,
        DB_SHOULD_RUN: 'false',
        DB_INTEGRATION_RESULT: 'skipped',
      }),
      0,
    );
    assert.notEqual(run({ DB_INTEGRATION_RESULT: result }), 0);
  }
  for (const result of ['success', 'failure', 'cancelled']) {
    assert.notEqual(
      run({ DB_SHOULD_RUN: 'false', DB_INTEGRATION_RESULT: result }),
      0,
    );
  }
  assert.notEqual(
    run({ DB_SHOULD_RUN: '', DB_INTEGRATION_RESULT: 'skipped' }),
    0,
  );
  for (const job of [
    'CHANGED_FILES_RESULT',
    'VALIDATION_RESULT',
    'BUILD_RESULT',
    'CREATE_APP_SMOKE_RESULT',
    'APP_INSTALLER_SMOKE_RESULT',
  ]) {
    assert.notEqual(run({ [job]: 'failure' }), 0);
  }
  assert.notEqual(
    run({
      BUILD_RESULT: 'failure',
      DB_SHOULD_RUN: 'false',
      DB_INTEGRATION_RESULT: 'skipped',
    }),
    0,
  );
});
