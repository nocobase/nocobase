/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Args, Command, Flags } from '@oclif/core';
import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import path from 'node:path';
import Install from '../install.js';
import { defaultWorkspaceName } from '../../lib/app-runtime.js';
import { findAvailableTcpPort, validateAvailableTcpPort } from '../../lib/prompt-validators.js';
import { commandSucceeds, resolveProjectCwd, run, runNocoBaseCommand } from '../../lib/run-npm.js';
import { failTask, printInfo, setVerboseMode, startTask, succeedTask } from '../../lib/ui.js';

type TestDbConfig = {
  storagePath: string;
  env: Record<string, string>;
  containerName: string;
  networkName: string;
  dataDir: string;
  args: string[];
};

const DEFAULT_DB_HOST = '127.0.0.1';
const DEFAULT_DB_DATABASE = 'nocobase-test';
const DEFAULT_DB_USER = 'nocobase';
const DEFAULT_DB_PASSWORD = 'nocobase';
const DEFAULT_DB_DIALECT = 'postgres';
const DEFAULT_TEST_TIMEZONE = 'UTC';
const DEFAULT_TEST_DB_IMAGES: Record<string, string> = {
  postgres: 'postgres:16',
  mysql: 'mysql:8',
  mariadb: 'mariadb:11',
  kingbase: 'registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86',
};
const DEFAULT_TEST_DB_DISTRIBUTOR_PORT = '23450';
const DEFAULT_TEST_DB_DISTRIBUTOR_PREFIX: Record<string, string> = {
  postgres: 'test',
  mysql: 'test_',
  mariadb: 'test_',
};
const DEFAULT_DB_PORTS: Record<string, number> = {
  postgres: 5433,
  mysql: 3307,
  mariadb: 3307,
  kingbase: 54322,
};
const TCP_PORT_READY_SCRIPT = [
  "const net = require('node:net');",
  "const port = Number(process.argv.at(-1));",
  "const socket = net.createConnection({ host: '127.0.0.1', port });",
  "socket.once('connect', () => { socket.end(); process.exit(0); });",
  "socket.once('error', () => process.exit(1));",
  "setTimeout(() => { socket.destroy(); process.exit(1); }, 200).unref();",
].join('\n');

function inferTestEnv(paths: string[]): 'client-side' | 'server-side' | undefined {
  const first = String(paths[0] ?? '').trim();
  if (!first) {
    return undefined;
  }

  const normalized = first.split('\\').join('/');
  if (
    normalized.includes('/client/')
    || normalized.includes('/client-v2/')
    || normalized.includes('/flow-engine/')
  ) {
    return 'client-side';
  }

  return 'server-side';
}

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function resolveWorkspaceName(cwd: string): string {
  return defaultWorkspaceName(cwd);
}

function defaultTestDbPort(dbDialect: string): string {
  return String(DEFAULT_DB_PORTS[dbDialect] ?? DEFAULT_DB_PORTS.postgres);
}

function defaultTestDbImage(dbDialect: string): string {
  return DEFAULT_TEST_DB_IMAGES[dbDialect] ?? DEFAULT_TEST_DB_IMAGES.postgres;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldRunServerTests(params: {
  server: boolean;
  client: boolean;
  paths: string[];
}): boolean {
  if (params.server) {
    return true;
  }

  if (params.client) {
    return false;
  }

  return inferTestEnv(params.paths) !== 'client-side';
}

function defaultTestDbDistributorPrefix(dbDialect: string): string | undefined {
  return DEFAULT_TEST_DB_DISTRIBUTOR_PREFIX[dbDialect];
}

function supportsTestDbDistributor(dbDialect: string): boolean {
  return Boolean(defaultTestDbDistributorPrefix(dbDialect));
}

function buildTestDbDistributorEnv(env: Record<string, string>): Record<string, string> {
  if (env.DB_DIALECT === 'mysql' || env.DB_DIALECT === 'mariadb') {
    return {
      ...env,
      DB_APP_USER: env.DB_USER,
      DB_USER: 'root',
    };
  }

  return env;
}

async function waitForTcpPortReady(port: string, timeoutMs = 5000): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await commandSucceeds(process.execPath, ['-e', TCP_PORT_READY_SCRIPT, port])) {
      return;
    }
    await delay(100);
  }

  throw new Error(`Timed out while waiting for the test DB distributor on 127.0.0.1:${port}.`);
}

async function stopBackgroundProcess(
  child: ReturnType<typeof spawn>,
): Promise<void> {
  if (child.exitCode !== null || child.killed) {
    return;
  }

  await new Promise<void>((resolve) => {
    const finish = () => {
      clearTimeout(timeout);
      resolve();
    };

    const timeout = setTimeout(finish, 1000);
    child.once('close', finish);

    try {
      child.kill();
    } catch {
      finish();
    }
  });
}

async function startTestDbDistributor(params: {
  cwd: string;
  env: Record<string, string>;
  stdio: 'inherit' | 'ignore';
}): Promise<{ port: string; prefix: string; stop: () => Promise<void> }> {
  const port = DEFAULT_TEST_DB_DISTRIBUTOR_PORT;
  const prefix = defaultTestDbDistributorPrefix(params.env.DB_DIALECT);

  if (!prefix) {
    throw new Error(`The ${params.env.DB_DIALECT} test DB distributor is not supported.`);
  }

  const portError = await validateAvailableTcpPort(port);
  if (portError) {
    throw new Error(`Host port ${port} is unavailable for the test DB distributor. ${portError}`);
  }

  const distributorEnv = buildTestDbDistributorEnv(params.env);
  const child = spawn(
    process.execPath,
    [
      path.resolve(params.cwd, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
      path.resolve(params.cwd, 'packages', 'core', 'test', 'src', 'scripts', 'test-db-creator.ts'),
    ],
    {
      cwd: params.cwd,
      env: {
        ...process.env,
        ...distributorEnv,
        DB_TEST_DISTRIBUTOR_PORT: port,
        DB_TEST_PREFIX: prefix,
      },
      stdio: params.stdio,
      windowsHide: process.platform === 'win32',
    },
  );

  let childError: Error | undefined;
  child.once('error', (error) => {
    childError = error;
  });
  child.once('close', (code, signal) => {
    if (code === 0) {
      return;
    }

    childError = childError ?? new Error(
      signal
        ? `test DB distributor exited due to signal ${signal}`
        : `test DB distributor exited with code ${code ?? 'unknown'}`,
    );
  });

  try {
    await waitForTcpPortReady(port);
  } catch (error: unknown) {
    await stopBackgroundProcess(child);
    throw childError ?? error;
  }

  return {
    port,
    prefix,
    stop: async () => {
      await stopBackgroundProcess(child);
    },
  };
}

async function ensureDockerNetwork(
  networkName: string,
  options?: { stdio?: 'inherit' | 'ignore' },
): Promise<void> {
  if (await commandSucceeds('docker', ['network', 'inspect', networkName])) {
    return;
  }

  await run('docker', ['network', 'create', networkName], {
    errorName: 'docker network create',
    stdio: options?.stdio ?? 'ignore',
  });
}

async function removeDockerContainerIfExists(
  containerName: string,
  options?: { stdio?: 'inherit' | 'ignore' },
): Promise<'removed' | 'missing'> {
  if (!(await commandSucceeds('docker', ['container', 'inspect', containerName]))) {
    return 'missing';
  }

  await run('docker', ['rm', '-f', containerName], {
    errorName: 'docker rm',
    stdio: options?.stdio ?? 'ignore',
  });
  return 'removed';
}

function formatDbBootstrapFailure(message: string): string {
  return [
    'Could not prepare the built-in test database.',
    'The CLI was not able to recreate a clean Docker database for this test run.',
    'Check Docker status, the selected port, and local storage permissions, then try again.',
    `Details: ${message}`,
  ].join('\n');
}

function buildTestDbConfig(params: {
  cwd: string;
  dbDialect?: string;
  dbPort?: string;
  dbDatabase?: string;
  dbUser?: string;
  dbPassword?: string;
  builtinDbImage?: string;
}): TestDbConfig {
  const dbDialect = trimValue(params.dbDialect) || DEFAULT_DB_DIALECT;
  const workspaceName = resolveWorkspaceName(params.cwd);
  const storagePath = path.join(params.cwd, 'storage', 'test');
  const plan = Install.buildBuiltinDbPlan({
    envName: 'test',
    workspaceName,
    storagePath,
    source: 'test',
    dbDialect,
    dbHost: DEFAULT_DB_HOST,
    dbPort: trimValue(params.dbPort) || defaultTestDbPort(dbDialect),
    dbDatabase: trimValue(params.dbDatabase) || DEFAULT_DB_DATABASE,
    dbUser: trimValue(params.dbUser) || DEFAULT_DB_USER,
    dbPassword: trimValue(params.dbPassword) || DEFAULT_DB_PASSWORD,
    builtinDbImage: trimValue(params.builtinDbImage) || defaultTestDbImage(dbDialect),
  });

  return {
    storagePath,
    containerName: plan.containerName,
    networkName: plan.networkName,
    dataDir: plan.dataDir,
    args: plan.args,
    env: {
      APP_ENV_PATH: '.env',
      STORAGE_PATH: storagePath,
      TZ: DEFAULT_TEST_TIMEZONE,
      DB_DIALECT: plan.dbDialect,
      DB_HOST: plan.dbHost,
      DB_PORT: plan.dbPort,
      DB_DATABASE: plan.dbDatabase,
      DB_USER: plan.dbUser,
      DB_PASSWORD: plan.dbPassword,
    },
  };
}

async function prepareTestDatabase(
  config: TestDbConfig,
  options?: { stdio?: 'inherit' | 'ignore'; dbPortExplicit?: boolean },
): Promise<TestDbConfig> {
  let nextConfig = config;

  await ensureDockerNetwork(nextConfig.networkName, {
    stdio: options?.stdio,
  });
  await removeDockerContainerIfExists(nextConfig.containerName, {
    stdio: options?.stdio,
  });
  await fsp.rm(nextConfig.storagePath, { recursive: true, force: true });

  const portError = await validateAvailableTcpPort(nextConfig.env.DB_PORT);
  if (portError) {
    if (options?.dbPortExplicit) {
      throw new Error(`Host port ${nextConfig.env.DB_PORT} is unavailable. ${portError}`);
    }

    const fallbackPort = await findAvailableTcpPort();
    printInfo(
      `Host port ${nextConfig.env.DB_PORT} is unavailable for the test database, so the CLI will use ${fallbackPort} instead.`,
    );
    nextConfig = buildTestDbConfig({
      cwd: path.dirname(path.dirname(nextConfig.storagePath)),
      dbDialect: nextConfig.env.DB_DIALECT,
      dbPort: fallbackPort,
      dbDatabase: nextConfig.env.DB_DATABASE,
      dbUser: nextConfig.env.DB_USER,
      dbPassword: nextConfig.env.DB_PASSWORD,
      builtinDbImage: undefined,
    });
  }

  await fsp.mkdir(nextConfig.dataDir, { recursive: true });
  await run('docker', nextConfig.args, {
    errorName: 'docker run',
    stdio: options?.stdio ?? 'ignore',
  });

  await waitForTcpPortReady(nextConfig.env.DB_PORT, 30_000);

  return nextConfig;
}

export default class SourceTest extends Command {
  static override hidden = false;
  static override args = {
    paths: Args.string({
      description: 'test file paths or globs to pass through',
      multiple: true,
      required: false,
    }),
  };

  static override description =
    'Run project tests from the selected app directory. Before running tests, the CLI recreates a built-in Docker test database and injects `DB_*` values internally.';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --cwd /path/to/app',
    '<%= config.bin %> <%= command.id %> packages/core/server/src/__tests__/foo.test.ts',
    '<%= config.bin %> <%= command.id %> --server --coverage',
    '<%= config.bin %> <%= command.id %> --db-port 5433',
  ];

  static override flags = {
    cwd: Flags.string({
      char: 'c',
      description: 'App directory to run tests from. Defaults to the current working directory',
      required: false,
    }),
    watch: Flags.boolean({
      char: 'w',
      description: 'Run Vitest in watch mode',
      default: false,
    }),
    run: Flags.boolean({
      description: 'Run once without watch mode',
      default: false,
    }),
    allowOnly: Flags.boolean({
      description: 'Allow `.only` tests',
      default: false,
    }),
    bail: Flags.boolean({
      description: 'Stop after the first failure',
      default: false,
    }),
    coverage: Flags.boolean({
      description: 'Enable coverage reporting',
      default: false,
    }),
    'single-thread': Flags.string({
      description: 'Forward single-thread mode to the underlying test runner',
      required: false,
    }),
    server: Flags.boolean({
      description: 'Force server-side test mode',
      default: false,
    }),
    client: Flags.boolean({
      description: 'Force client-side test mode',
      default: false,
    }),
    'db-clean': Flags.boolean({
      char: 'd',
      description: 'Clean the database before tests when supported by the underlying app command',
      default: false,
    }),
    'db-dialect': Flags.string({
      description: 'Built-in test database dialect to start',
      options: ['postgres', 'mysql', 'mariadb', 'kingbase'],
      required: false,
    }),
    'db-image': Flags.string({
      description: 'Built-in test database Docker image to start',
      aliases: ['builtin-db-image'],
      required: false,
    }),
    'db-port': Flags.string({
      description: 'Host TCP port to publish for the built-in test database',
      required: false,
    }),
    'db-database': Flags.string({
      description: 'Database name to inject for tests',
      required: false,
    }),
    'db-user': Flags.string({
      description: 'Database user to inject for tests',
      required: false,
    }),
    'db-password': Flags.string({
      description: 'Database password to inject for tests',
      required: false,
    }),
    verbose: Flags.boolean({
      description: 'Show raw Docker and test runner output',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(SourceTest);
    setVerboseMode(flags.verbose);

    if (flags.server && flags.client) {
      this.error('Cannot use `--server` and `--client` together.');
    }

    const cwd = resolveProjectCwd(flags.cwd);
    const commandArgs = ['test', ...(args.paths ?? [])];

    if (flags.watch) {
      commandArgs.push('--watch');
    }

    if (flags.run || !flags.watch) {
      commandArgs.push('--run');
    }

    if (flags.allowOnly) {
      commandArgs.push('--allowOnly');
    }

    if (flags.bail) {
      commandArgs.push('--bail');
    }

    if (flags.coverage) {
      commandArgs.push('--coverage');
    }

    if (flags.server) {
      commandArgs.push('--server');
    } else if (flags.client) {
      commandArgs.push('--client');
    }

    if (flags['db-clean']) {
      commandArgs.push('--db-clean');
    }

    if (flags['single-thread'] !== undefined) {
      commandArgs.push(`--single-thread=${flags['single-thread']}`);
    } else if (!flags.client && !flags.server && inferTestEnv(args.paths ?? []) === 'server-side') {
      commandArgs.push('--single-thread=true');
    }

    startTask('Recreating the built-in test database...');

    let testDbConfig: TestDbConfig;
    let testDbDistributor:
      | { port: string; prefix: string; stop: () => Promise<void> }
      | undefined;
    try {
      testDbConfig = await prepareTestDatabase(
        buildTestDbConfig({
          cwd,
          dbDialect: flags['db-dialect'],
          builtinDbImage: flags['db-image'],
          dbPort: flags['db-port'],
          dbDatabase: flags['db-database'],
          dbUser: flags['db-user'],
          dbPassword: flags['db-password'],
        }),
        {
          stdio: flags.verbose ? 'inherit' : 'ignore',
          dbPortExplicit: Boolean(flags['db-port']),
        },
      );
      if (
        shouldRunServerTests({
          server: flags.server,
          client: flags.client,
          paths: args.paths ?? [],
        })
        && supportsTestDbDistributor(testDbConfig.env.DB_DIALECT)
      ) {
        testDbDistributor = await startTestDbDistributor({
          cwd,
          env: testDbConfig.env,
          stdio: flags.verbose ? 'inherit' : 'ignore',
        });
        testDbConfig.env.DB_TEST_DISTRIBUTOR_PORT = testDbDistributor.port;
        testDbConfig.env.DB_TEST_PREFIX = testDbDistributor.prefix;
      }
      succeedTask(
        `The built-in test database is ready at ${testDbConfig.env.DB_HOST}:${testDbConfig.env.DB_PORT}.`,
      );
      printInfo(
        `Test DB settings: DB_DIALECT=${testDbConfig.env.DB_DIALECT} DB_HOST=${testDbConfig.env.DB_HOST} DB_PORT=${testDbConfig.env.DB_PORT} DB_DATABASE=${testDbConfig.env.DB_DATABASE} DB_USER=${testDbConfig.env.DB_USER}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      failTask('Failed to recreate the built-in test database.');
      this.error(formatDbBootstrapFailure(message));
      return;
    }

    try {
      await runNocoBaseCommand(commandArgs, {
        cwd,
        stdio: flags.verbose ? 'inherit' : 'ignore',
        env: testDbConfig.env,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message);
    } finally {
      await testDbDistributor?.stop();
    }
  }
}
