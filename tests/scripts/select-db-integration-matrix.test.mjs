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
  packageSuites,
  planDbIntegration,
  selectDatabases,
  selectPackageSuites,
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
      '.github/workflows/v3-release-beta.yml',
    ]),
    [],
  );
});

const claimConcurrency = {
  dialect: 'postgres',
  filter: '@nocobase/app-plugin-agents',
  tests: 'tests/claim-concurrency.test.ts',
};

const artifactKeyMigration = {
  dialect: 'mssql',
  filter: '@nocobase/app-plugin-releases',
  tests: 'tests/artifact-key-migration.test.ts',
};

test('release migration changes select the SQL Server upgrade regression', () => {
  for (const file of [
    'packages/plugins/app-plugin-releases/database/migrations/202610020001_rel_create_tables.ts',
    'packages/plugins/app-plugin-releases/database/migrations/202610260002_rel_bound_artifact_keys.ts',
    'packages/plugins/app-plugin-releases/tests/artifact-key-migration.test.ts',
  ])
    assert.deepEqual(selectPackageSuites([file]), [artifactKeyMigration], file);
  assert.deepEqual(
    selectPackageSuites([
      'packages/plugins/app-plugin-releases/server/plugin.ts',
    ]),
    [],
  );
});

test('a guarded package path selects its dialect suite, and nothing else does', () => {
  for (const file of [
    'packages/plugins/app-plugin-agents/server/core/runs/claim.ts',
    'packages/plugins/app-plugin-agents/server/core/runs/comment-consent.ts',
    'packages/plugins/app-plugin-agents/server/core/agents/agent.store.ts',
    'packages/plugins/app-plugin-agents/tests/claim-concurrency.test.ts',
  ]) {
    assert.deepEqual(selectPackageSuites([file]), [claimConcurrency], file);
    assert.deepEqual(selectDatabases([file]), [], file);
  }
  for (const file of [
    'packages/plugins/app-plugin-agents/server/core/agents/agent.service.ts',
    'packages/plugins/app-plugin-agents/client/index.ts',
    'packages/libs/db-postgres/src/index.ts',
  ])
    assert.deepEqual(selectPackageSuites([file]), [], file);
});

test('every package suite names tests that exist', () => {
  for (const suite of packageSuites) {
    const directory = path.join(
      root,
      'packages',
      'plugins',
      suite.filter.replace('@nocobase/', ''),
    );
    for (const file of suite.tests)
      assert.ok(
        readdirSync(path.dirname(path.join(directory, file))).includes(
          path.basename(file),
        ),
        file,
      );
    assert.ok(databases.includes(suite.dialect), suite.dialect);
  }
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
    const plan = planDbIntegration({ ...repo, baseSha, headSha });
    assert.deepEqual(plan.databases, databases);
    assert.deepEqual(plan.suites, [claimConcurrency, artifactKeyMigration]);
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
    [baseSha, 'databases=["mssql"]\nshould_run=true\nsuites=[]\n'],
    [headSha, 'databases=[]\nshould_run=false\nsuites=[]\n'],
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
