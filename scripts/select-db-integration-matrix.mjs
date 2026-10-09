import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

export const databases = [
  'sqlite',
  'postgres',
  'mysql',
  'oceanbase',
  'oracle',
  'mssql',
  'dameng',
  'kingbase',
];

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
  '.github/workflows/v3-quality.yml',
  'scripts/select-db-integration-matrix.mjs',
  'tests/scripts/select-db-integration-matrix.test.mjs',
]);

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
  const output = `databases=${JSON.stringify(plan.databases)}\nshould_run=${plan.databases.length > 0}\n`;
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, output);
  }
  console.log(plan.reason);
  process.stdout.write(output);
}
