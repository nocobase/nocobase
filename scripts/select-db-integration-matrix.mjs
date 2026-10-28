import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export const databases = ['sqlite', 'postgres', 'mysql', 'oracle', 'mssql'];

// Keep whole packages covered, including their tests, manifests, and local configuration.
const sharedDirectories = [
  'packages/libs/db/',
  'packages/libs/db-testkit/',
  'packages/libs/service-provider/',
  'packages/libs/repository-input/',
  'packages/tools/dev-config/',
  'patches/',
];

const sharedFiles = new Set([
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  '.npmrc',
  '.pnpmfile.cjs',
  'pnpmfile.cjs',
  'scripts/select-db-integration-matrix.mjs',
  'tests/scripts/select-db-integration-matrix.test.mjs',
]);

// Package tests whose subject is dialect-specific behavior, such as row locks, lock waits and indexed column changes. The
// matrix above runs the dialect packages' own suites; these run a package's named tests on that dialect through
// `pnpm test:db`, in the Database tests workflow, when a path they guard changes.
export const packageSuites = [
  ...['postgres', 'mysql'].map((dialect) => ({
    // A losing receipt claim must roll back before reading the committed winner on each server dialect.
    paths: [
      'packages/app/app-server/src/router/idempotency.ts',
      'packages/app/app-server/src/router/repository-routes.ts',
      'packages/app/app-server/tests/idempotency.test.ts',
      'packages/templates/app-template-default/database/main/migrations/202611020002_create_mutation_receipts.ts',
      'packages/templates/app-template-examples/database/main/migrations/202611020002_create_mutation_receipts.ts',
      'packages/templates/app-template-examples/database/analytics/migrations/202611020002_create_mutation_receipts.ts',
    ],
    dialect,
    filter: '@nocobase/app-server',
    tests: ['tests/idempotency.test.ts'],
  })),
  ...['postgres', 'mysql'].map((dialect) => ({
    // Execution and withdrawal must observe the winner after waiting on the same session row.
    paths: [
      'packages/plugins/app-plugin-agent-sessions/server/service.ts',
      'packages/plugins/app-plugin-agent-sessions/server/store.ts',
      'packages/plugins/app-plugin-agent-sessions/tests/server/withdrawals.test.ts',
      'packages/plugins/app-plugin-agent-sessions/database/migrations/202610180001_agent_sessions_bridge_protocol.ts',
      'packages/libs/acp-bridge/src/protocol.ts',
    ],
    dialect,
    filter: '@nocobase/app-plugin-agent-sessions',
    tests: ['tests/server/withdrawals.test.ts'],
  })),
  {
    // Claims, consent decisions and the sweeper must not lock or write per queued candidate; see the test's header.
    paths: [
      'packages/plugins/app-plugin-agents/server/core/runs/',
      'packages/plugins/app-plugin-agents/server/core/agents/agent.store.ts',
      'packages/plugins/app-plugin-agents/tests/claim-concurrency.test.ts',
      'packages/plugins/app-plugin-agents/tests/active-input.test.ts',
      'packages/plugins/app-plugin-agents/database/migrations/202610260001_ag_run_revision.ts',
      'packages/plugins/app-plugin-agents/tests/harness.ts',
    ],
    dialect: 'postgres',
    filter: '@nocobase/app-plugin-agents',
    tests: [
      'tests/claim-concurrency.test.ts',
      'tests/active-input.test.ts',
      'tests/run-revision-migration.test.ts',
    ],
  },
  {
    // SQL Server requires rebuilding the unique index before shrinking the legacy artifact-key column.
    paths: [
      'packages/plugins/app-plugin-releases/database/migrations/',
      'packages/plugins/app-plugin-releases/tests/artifact-key-migration.test.ts',
    ],
    dialect: 'mssql',
    filter: '@nocobase/app-plugin-releases',
    tests: ['tests/artifact-key-migration.test.ts'],
  },
];

const suiteOf = ({ dialect, filter, tests }) => ({
  dialect,
  filter,
  tests: tests.join(' '),
});

export function selectPackageSuites(changedPaths) {
  return packageSuites
    .filter((suite) =>
      changedPaths.some((file) =>
        suite.paths.some((guarded) =>
          guarded.endsWith('/') ? file.startsWith(guarded) : file === guarded,
        ),
      ),
    )
    .map(suiteOf);
}

export function selectDatabases(changedPaths) {
  const selected = new Set();
  for (const file of changedPaths) {
    if (
      sharedFiles.has(file) ||
      sharedDirectories.some((directory) => file.startsWith(directory))
    ) {
      return [...databases];
    }
    for (const database of databases) {
      if (file.startsWith(`packages/libs/db-${database}/`)) {
        selected.add(database);
      }
    }
  }
  return databases.filter((database) => selected.has(database));
}

export function planDbIntegration({ baseSha, headSha, cwd = process.cwd() }) {
  const git = (args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    });

  // A new branch, unavailable history, or an event without a base must never skip coverage.
  if (!baseSha || /^0+$/.test(baseSha) || !headSha) {
    return {
      databases: [...databases],
      suites: packageSuites.map(suiteOf),
      reason: 'No comparison range; running every database.',
    };
  }

  let base;
  let head;
  try {
    base = git([
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${baseSha}^{commit}`,
    ]).trim();
    head = git([
      'rev-parse',
      '--verify',
      '--end-of-options',
      `${headSha}^{commit}`,
    ]).trim();
  } catch {
    return {
      databases: [...databases],
      suites: packageSuites.map(suiteOf),
      reason: 'Comparison commits unavailable; running every database.',
    };
  }

  // Treat renames as deletion + addition so moves into AND out of a package are covered.
  // NUL delimiters preserve filenames containing whitespace, newlines, or non-ASCII characters.
  // Do not catch diff errors: a broken selector must fail the planning job, never report a skip.
  const changedPaths = git([
    'diff',
    '--name-only',
    '--no-renames',
    '-z',
    base,
    head,
    '--',
  ])
    .split('\0')
    .filter(Boolean);
  const selected = selectDatabases(changedPaths);
  return {
    databases: selected,
    suites: selectPackageSuites(changedPaths),
    reason: selected.length
      ? `Selected databases: ${selected.join(', ')}.`
      : 'No database-related changes.',
  };
}

if (import.meta.main) {
  const plan = planDbIntegration({
    baseSha: process.env.BASE_SHA,
    headSha: process.env.HEAD_SHA,
  });
  const output = `databases=${JSON.stringify(plan.databases)}\nshould_run=${plan.databases.length > 0}\nsuites=${JSON.stringify(plan.suites)}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  }
  console.log(plan.reason);
  process.stdout.write(output);
}
