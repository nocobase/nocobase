// Runs packages' tests against one database dialect:
//
//   pnpm test:db <dialect> --filter <package> [--filter <package>…] [-- <arguments for each package's test script>]
//
// SQLite runs as is. Any other dialect is started from its package's Compose file in a disposable project with a
// random name and port, the tests run with NOCOBASE_TEST_DB_DIALECT and the dialect's host and port variables set,
// and the project is removed afterwards; KEEP_TEST_DB=1 keeps it. Run one at a time, as the database integration
// suites are: two at once compete for the same machine.
//
// Runs under `node --import tsx`, because the Compose service of each dialect and the runner are TypeScript sources.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = path.resolve(import.meta.dirname, '..');

export class TestDbUsageError extends Error {}

export function parseTestDbArguments(argv) {
  const [dialect, ...rest] = argv;
  if (!dialect || dialect.startsWith('-')) {
    throw new TestDbUsageError(
      'Usage: pnpm test:db <dialect> --filter <package> [-- <test arguments>]',
    );
  }
  if (!/^[a-z][a-z0-9-]*$/.test(dialect)) {
    throw new TestDbUsageError(`"${dialect}" is not a dialect name.`);
  }
  const filters = [];
  const testArguments = [];
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index];
    if (argument === '--') {
      testArguments.push(...rest.slice(index + 1));
      break;
    }
    if (argument === '--filter' || argument === '-F') {
      const value = rest[index + 1];
      if (!value || value.startsWith('-')) {
        throw new TestDbUsageError(`${argument} needs a package name.`);
      }
      filters.push(value);
      index += 1;
    } else if (argument.startsWith('--filter=')) {
      filters.push(argument.slice('--filter='.length));
    } else {
      throw new TestDbUsageError(
        `Unexpected argument "${argument}". Pass test arguments after a standalone --.`,
      );
    }
  }
  // The whole workspace's tests are CI's job; on one machine they take minutes and say little about a dialect.
  if (filters.length === 0) {
    throw new TestDbUsageError(
      'Name the packages to test with --filter, for example --filter @nocobase/app-plugin-scheduler.',
    );
  }
  return {
    dialect,
    command: 'pnpm',
    args: [
      ...filters.flatMap((filter) => ['--filter', filter]),
      // One package at a time: several suites at once compete for one machine and one database server, and a
      // timeout they cause reads as a test failure.
      '--workspace-concurrency=1',
      // Every package runs even after one fails, so a run reports each package's result on the dialect.
      '--no-bail',
      'run',
      'test',
      // `pnpm run` hands everything after the script name to the script; a `--` would reach Vitest as one more
      // argument and stop it treating the rest as file filters.
      ...testArguments,
    ],
  };
}

export async function testDb(argv, { cwd = repoRoot } = {}) {
  const { dialect, command, args } = parseTestDbArguments(argv);
  const environment = { NOCOBASE_TEST_DB_DIALECT: dialect };
  if (dialect === 'sqlite') {
    return run(command, args, { ...process.env, ...environment }, cwd);
  }
  const serviceModule = path.join(
    cwd,
    'packages/libs',
    `db-${dialect}`,
    'scripts/integration-service.ts',
  );
  if (!existsSync(serviceModule)) {
    throw new TestDbUsageError(
      `No Compose service is defined for "${dialect}": expected ${path.relative(cwd, serviceModule)}.`,
    );
  }
  const { integrationService } = await import(
    pathToFileURL(serviceModule).href
  );
  const { runWithDatabaseService } = await import(
    pathToFileURL(
      path.join(cwd, 'packages/libs/db-testkit/src/integration-runner.ts'),
    ).href
  );
  return runWithDatabaseService({
    ...integrationService,
    command,
    args,
    environment,
  });
}

function run(command, args, env, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  try {
    process.exitCode = await testDb(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
