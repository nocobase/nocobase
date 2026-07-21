/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';
import { resolveCliHomeRoot } from '../lib/cli-home.js';

const originalNbLocale = process.env.NB_LOCALE;
const originalExtractClientAssets = process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
const TEST_CWD = '/tmp/app2';
const TEST_STORAGE_PATH = path.join(TEST_CWD, 'storage', 'test');
const TEST_POSTGRES_DATA_DIR = path.resolve(TEST_STORAGE_PATH, 'db', 'postgres');
const MANAGED_APP_PRODUCTION_ENV = {
  APP_ENV: 'production',
  NODE_ENV: 'production',
};

async function createNpmSourceProject(
  packageJson: Record<string, unknown>,
  options?: { devtoolsInstalled?: boolean },
): Promise<string> {
  const actualFsp = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  const projectRoot = await actualFsp.mkdtemp(path.join(os.tmpdir(), 'nb-source-dev-'));
  await actualFsp.writeFile(
    path.join(projectRoot, 'package.json'),
    `${JSON.stringify(packageJson, null, 2)}\n`,
    'utf-8',
  );

  if (options?.devtoolsInstalled) {
    const devtoolsDir = path.join(projectRoot, 'node_modules', '@nocobase', 'devtools');
    await actualFsp.mkdir(devtoolsDir, { recursive: true });
    await actualFsp.writeFile(
      path.join(devtoolsDir, 'package.json'),
      `${JSON.stringify({ name: '@nocobase/devtools', version: '2.1.10' }, null, 2)}\n`,
      'utf-8',
    );
  }

  return projectRoot;
}

async function readProjectPackageJson(projectRoot: string): Promise<Record<string, unknown>> {
  const actualFsp = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
  const content = await actualFsp.readFile(path.join(projectRoot, 'package.json'), 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

const mocks = vi.hoisted(() => ({
  formatMissingManagedAppEnvMessage: vi.fn((envName?: string) =>
    envName
      ? [
          `Env "${envName}" is not configured in this workspace.`,
          `If you want to create a new NocoBase AI environment, run \`nb init --ui --env ${envName}\` first.`,
        ].join('\n')
      : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
  ),
  managedAppLifecycleEnvVars: vi.fn(() => ({
    APP_ENV: 'production',
    NODE_ENV: 'production',
  })),
  resolveManagedAppRuntime: vi.fn(),
  runLocalNocoBaseCommand: vi.fn(),
  runDockerNocoBaseCommand: vi.fn(),
  dockerContainerExists: vi.fn(),
  dockerContainerIsRunning: vi.fn(),
  defaultWorkspaceName: vi.fn((cwd?: string) => {
    const value =
      String(cwd ?? process.cwd())
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean)
        .at(-1) ?? 'demo';
    return `nb-${value}`;
  }),
  buildDockerDbContainerName: vi.fn(
    (envName: string, dbDialect: string, workspaceName?: string) =>
      `${workspaceName ?? 'nb-demo'}-${envName}-${dbDialect || 'postgres'}`,
  ),
  startDockerContainer: vi.fn(),
  stopDockerContainer: vi.fn(),
  isAppReady: vi.fn(),
  waitForAppReady: vi.fn(),
  resolveManagedAppApiBaseUrl: vi.fn(),
  formatAppUrl: vi.fn(),
  readManagedRuntimeEnvValues: vi.fn(),
  readDistClientActiveVersion: vi.fn(),
  removeEnv: vi.fn(),
  upsertEnv: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
  setVerboseMode: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
  printWarning: vi.fn(),
  announceTargetEnv: vi.fn((envName: string) => mocks.printInfo(`Using env "${envName}".`)),
  isInteractiveTerminal: vi.fn(),
  crossEnvConfirm: vi.fn(),
  inputPrompt: vi.fn(),
  renderTable: vi.fn((headers: string[], rows: string[][]) =>
    [headers.join('|'), ...rows.map((row) => row.join('|'))].join('\n'),
  ),
  listEnvs: vi.fn(),
  getCurrentEnvName: vi.fn(),
  run: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  commandSucceeds: vi.fn(),
  commandOutput: vi.fn(),
  ensureDockerDaemonRunning: vi.fn(),
  resolveProjectCwd: vi.fn((cwd?: string) => cwd ?? process.cwd()),
  findAvailableTcpPort: vi.fn(),
  validateAvailableTcpPort: vi.fn(),
  fsRm: vi.fn(),
  fsMkdir: vi.fn(),
  fsReaddir: vi.fn(),
  executeRawApiRequest: vi.fn(),
  getEnv: vi.fn(),
  clearEnvRootSetup: vi.fn(),
  checkExternalDbConnection: vi.fn(),
  readExternalDbConnectionConfig: vi.fn(),
  formatDbCheckAddress: vi.fn(),
  childSpawnCalls: [] as Array<{
    command: string;
    args: string[];
    options: Record<string, unknown>;
  }>,
  childOnceHandlers: [] as Array<Record<string, (...args: any[]) => void>>,
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  const spawn = vi.fn((command: string, args: string[], options: Record<string, unknown>) => {
    const handlers: Record<string, (...args: any[]) => void> = {};
    mocks.childSpawnCalls.push({ command, args, options });
    mocks.childOnceHandlers.push(handlers);
    const child = {
      exitCode: null,
      killed: false,
      once: vi.fn((event: string, handler: (...args: any[]) => void) => {
        handlers[event] = handler;
        return child;
      }),
      kill: vi.fn(() => {
        handlers.close?.(0, null);
        return true;
      }),
    };
    return child;
  });

  return {
    ...actual,
    spawn,
    default: {
      ...actual,
      spawn,
    },
  };
});

vi.mock('../lib/app-runtime.js', () => ({
  formatMissingManagedAppEnvMessage: mocks.formatMissingManagedAppEnvMessage,
  managedAppLifecycleEnvVars: mocks.managedAppLifecycleEnvVars,
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  runLocalNocoBaseCommand: mocks.runLocalNocoBaseCommand,
  runDockerNocoBaseCommand: mocks.runDockerNocoBaseCommand,
  dockerContainerExists: mocks.dockerContainerExists,
  dockerContainerIsRunning: mocks.dockerContainerIsRunning,
  defaultWorkspaceName: mocks.defaultWorkspaceName,
  buildDockerDbContainerName: mocks.buildDockerDbContainerName,
  startDockerContainer: mocks.startDockerContainer,
  stopDockerContainer: mocks.stopDockerContainer,
}));

vi.mock('../lib/app-health.js', () => ({
  AppHealthCheckError: class AppHealthCheckError extends Error {},
  isAppReady: mocks.isAppReady,
  waitForAppReady: mocks.waitForAppReady,
  resolveManagedAppApiBaseUrl: mocks.resolveManagedAppApiBaseUrl,
  formatAppUrl: mocks.formatAppUrl,
}));

vi.mock('../lib/managed-env-file.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/managed-env-file.js')>('../lib/managed-env-file.js');
  return {
    ...actual,
    readManagedRuntimeEnvValues: mocks.readManagedRuntimeEnvValues,
  };
});

vi.mock('../lib/app-public-path.js', async () => {
  const actual = await vi.importActual<typeof import('../lib/app-public-path.js')>('../lib/app-public-path.js');
  return {
    ...actual,
    readDistClientActiveVersion: mocks.readDistClientActiveVersion,
  };
});

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
  setVerboseMode: mocks.setVerboseMode,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
  printWarning: mocks.printWarning,
  announceTargetEnv: mocks.announceTargetEnv,
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  renderTable: mocks.renderTable,
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.crossEnvConfirm,
  input: mocks.inputPrompt,
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
  runNocoBaseCommand: mocks.runNocoBaseCommand,
  commandSucceeds: mocks.commandSucceeds,
  commandOutput: mocks.commandOutput,
  ensureDockerDaemonRunning: mocks.ensureDockerDaemonRunning,
  resolveProjectCwd: mocks.resolveProjectCwd,
}));

vi.mock('../lib/prompt-validators.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/prompt-validators.js')>();
  return {
    ...actual,
    findAvailableTcpPort: mocks.findAvailableTcpPort,
    validateAvailableTcpPort: mocks.validateAvailableTcpPort,
  };
});

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return {
    ...actual,
    rm: mocks.fsRm,
    mkdir: mocks.fsMkdir,
    readdir: mocks.fsReaddir,
    default: {
      ...actual,
      rm: mocks.fsRm,
      mkdir: mocks.fsMkdir,
      readdir: mocks.fsReaddir,
    },
  };
});

vi.mock('../lib/auth-store.js', () => ({
  removeEnv: mocks.removeEnv,
  listEnvs: mocks.listEnvs,
  getCurrentEnvName: mocks.getCurrentEnvName,
  getEnv: mocks.getEnv,
  upsertEnv: mocks.upsertEnv,
  clearEnvRootSetup: mocks.clearEnvRootSetup,
  resolveConfiguredAuthType: (config?: { authType?: string; auth?: { type?: string } }) =>
    config?.authType ?? config?.auth?.type,
}));

vi.mock('../lib/api-client.js', () => ({
  executeRawApiRequest: mocks.executeRawApiRequest,
}));

vi.mock('../lib/db-connection-check.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/db-connection-check.js')>();
  return {
    ...actual,
    checkExternalDbConnection: mocks.checkExternalDbConnection,
    readExternalDbConnectionConfig: mocks.readExternalDbConnectionConfig,
    formatDbCheckAddress: mocks.formatDbCheckAddress,
  };
});

beforeEach(() => {
  delete process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
  delete process.env.CDN_BASE_URL;
  mocks.formatMissingManagedAppEnvMessage.mockImplementation((envName?: string) =>
    envName
      ? [
          `Env "${envName}" is not configured in this workspace.`,
          `If you want to create a new NocoBase AI environment, run \`nb init --ui --env ${envName}\` first.`,
        ].join('\n')
      : 'No NocoBase env is configured yet. Run `nb init --ui` to create one first.',
  );
  mocks.defaultWorkspaceName.mockImplementation((cwd?: string) => {
    const value =
      String(cwd ?? process.cwd())
        .replace(/\\/g, '/')
        .split('/')
        .filter(Boolean)
        .at(-1) ?? 'demo';
    return `nb-${value}`;
  });
  mocks.managedAppLifecycleEnvVars.mockImplementation(() => ({
    ...MANAGED_APP_PRODUCTION_ENV,
  }));
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('fetch failed');
    }),
  );
  mocks.run.mockResolvedValue(undefined);
  mocks.runNocoBaseCommand.mockResolvedValue(undefined);
  mocks.commandSucceeds.mockResolvedValue(true);
  mocks.commandOutput.mockResolvedValue('');
  mocks.ensureDockerDaemonRunning.mockResolvedValue(undefined);
  mocks.isAppReady.mockResolvedValue(false);
  mocks.waitForAppReady.mockResolvedValue(undefined);
  mocks.resolveManagedAppApiBaseUrl.mockImplementation((runtime: any, options?: { portOverride?: string }) => {
    const port = options?.portOverride ?? runtime?.env?.appPort;
    const publicPath = String(runtime?.env?.config?.appPublicPath ?? '')
      .trim()
      .replace(/\/+$/, '');
    return port ? `http://127.0.0.1:${port}${publicPath}/api` : undefined;
  });
  mocks.formatAppUrl.mockImplementation((port?: string, appPublicPath?: string) => {
    const value = String(port ?? '').trim();
    const publicPath = String(appPublicPath ?? '')
      .trim()
      .replace(/\/+$/, '');
    if (!value) {
      return undefined;
    }
    return publicPath ? `http://127.0.0.1:${value}${publicPath}/` : `http://127.0.0.1:${value}`;
  });
  mocks.readManagedRuntimeEnvValues.mockResolvedValue({
    envFilePath: undefined,
    envValues: {},
  });
  mocks.readDistClientActiveVersion.mockResolvedValue(undefined);
  mocks.resolveProjectCwd.mockImplementation((cwd?: string) => cwd ?? process.cwd());
  mocks.findAvailableTcpPort.mockResolvedValue('5544');
  mocks.validateAvailableTcpPort.mockResolvedValue(undefined);
  mocks.fsRm.mockResolvedValue(undefined);
  mocks.fsMkdir.mockResolvedValue(undefined);
  mocks.fsReaddir.mockResolvedValue(['package.json']);
  mocks.crossEnvConfirm.mockResolvedValue(true);
  mocks.inputPrompt.mockResolvedValue('confirm');
  mocks.childSpawnCalls.length = 0;
  mocks.childOnceHandlers.length = 0;
  vi.mocked(spawn).mockImplementation((command: string, args: string[], options: Record<string, unknown>) => {
    const handlers: Record<string, (...args: any[]) => void> = {};
    mocks.childSpawnCalls.push({ command, args, options });
    mocks.childOnceHandlers.push(handlers);
    const child = {
      exitCode: null,
      killed: false,
      once: vi.fn((event: string, handler: (...args: any[]) => void) => {
        handlers[event] = handler;
        return child;
      }),
      kill: vi.fn(() => {
        handlers.close?.(0, null);
        return true;
      }),
    } as any;
    return child;
  });
  mocks.renderTable.mockImplementation((headers: string[], rows: string[][]) =>
    [headers.join('|'), ...rows.map((row) => row.join('|'))].join('\n'),
  );
  mocks.buildDockerDbContainerName.mockImplementation(
    (envName: string, dbDialect: string, workspaceName?: string) =>
      `${workspaceName ?? 'nb-demo'}-${envName}-${dbDialect || 'postgres'}`,
  );
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.dockerContainerIsRunning.mockResolvedValue(true);
  mocks.listEnvs.mockResolvedValue({
    lastEnv: 'local',
    envs: {},
  });
  mocks.getCurrentEnvName.mockResolvedValue('local');
  mocks.executeRawApiRequest.mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  });
  mocks.getEnv.mockResolvedValue(undefined);
  mocks.checkExternalDbConnection.mockResolvedValue(undefined);
  mocks.readExternalDbConnectionConfig.mockImplementation((values: Record<string, unknown>) => {
    const host = String(values.dbHost ?? '').trim();
    const port = Number.parseInt(String(values.dbPort ?? '').trim(), 10);
    const database = String(values.dbDatabase ?? '').trim();
    const user = String(values.dbUser ?? '').trim();
    const password = String(values.dbPassword ?? '');
    const dialect = String(values.dbDialect ?? '').trim();
    if (!host || !port || !database || !user || !password || !dialect) {
      return undefined;
    }
    return { dialect, host, port, database, user, password };
  });
  mocks.formatDbCheckAddress.mockImplementation(
    (config: { host: string; port: number; database: string }) => `${config.host}:${config.port}/${config.database}`,
  );
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.removeEnv.mockResolvedValue({
    removed: 'local',
    lastEnv: 'default',
    hasEnvs: false,
  });
  mocks.upsertEnv.mockResolvedValue(undefined);
  mocks.clearEnvRootSetup.mockResolvedValue(true);
});

afterEach(() => {
  if (originalNbLocale === undefined) {
    delete process.env.NB_LOCALE;
  } else {
    process.env.NB_LOCALE = originalNbLocale;
  }
  if (originalExtractClientAssets === undefined) {
    delete process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS;
  } else {
    process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS = originalExtractClientAssets;
  }
  delete process.env.NB_CLI_ROOT;
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

function createCommandHarness(
  parseResult: { args?: Record<string, any>; flags?: Record<string, any> },
  runCommand?: ReturnType<typeof vi.fn>,
) {
  return {
    argv: [],
    parse: vi.fn(async () => ({
      args: parseResult.args ?? {},
      flags: parseResult.flags ?? {},
    })),
    config: {
      runCommand: runCommand ?? vi.fn(async () => undefined),
    },
    error: (message: string) => {
      throw new Error(message);
    },
    log: vi.fn(),
  };
}

function setTerminalInteractivity(value: boolean) {
  const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  const stdoutDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

  Object.defineProperty(process.stdin, 'isTTY', {
    configurable: true,
    value,
  });
  Object.defineProperty(process.stdout, 'isTTY', {
    configurable: true,
    value,
  });

  return () => {
    if (stdinDescriptor) {
      Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
    }
    if (stdoutDescriptor) {
      Object.defineProperty(process.stdout, 'isTTY', stdoutDescriptor);
    }
  };
}

test('start enables daemon by default for npm/git envs', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        quickstart: true,
      },
    },
    runCommand,
  );

  await Start.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([['license:plugins:sync', ['--env', 'local', '--skip-if-no-license']]]);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Running local postinstall for "local"...'],
    ['Extracting client assets for "local"...'],
    ['Starting NocoBase for "local" in the background...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['Local postinstall finished for "local".'],
    ['Client assets are ready for "local".'],
    ['NocoBase is running for "local" at http://127.0.0.1:13000/.'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(3);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName).toBe('local');
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['client:extract']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual([
    'start',
    '--quickstart',
    '--port',
    '13000',
    '--daemon',
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
});

test('start injects init env vars for prepared local envs and marks them installed after success', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'prepared-local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      config: {
        setupState: 'prepared',
        lang: 'en-US',
        rootUsername: 'admin',
        rootEmail: 'admin@nocobase.com',
        rootPassword: 'admin123',
        rootNickname: 'Admin',
      },
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'prepared-local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[2]).toEqual({
    env: {
      ...MANAGED_APP_PRODUCTION_ENV,
      INIT_APP_LANG: 'en-US',
      INIT_ROOT_USERNAME: 'admin',
      INIT_ROOT_EMAIL: 'admin@nocobase.com',
      INIT_ROOT_PASSWORD: 'admin123',
      INIT_ROOT_NICKNAME: 'Admin',
    },
    stdio: 'ignore',
  });
  expect(mocks.clearEnvRootSetup).toHaveBeenCalledWith('prepared-local');
  expect(mocks.upsertEnv).toHaveBeenCalledWith('prepared-local', { setupState: 'installed' });
});

test('start runs prepared env hooks with init app start context', async () => {
  const hookDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'nocobase-cli-app-start-hook-'));
  const hookPath = path.join(hookDir, 'hooks.mjs');
  const markerPath = path.join(hookDir, 'marker.json');
  await fsp.writeFile(
    hookPath,
    `
export default {
  beforeAppInstall: async (context) => {
    const fs = await import('node:fs/promises');
    const current = JSON.parse(await fs.readFile(${JSON.stringify(markerPath)}, 'utf8').catch(() => '[]'));
    current.push({
      hook: 'beforeAppInstall',
      phase: context.phase,
      command: context.command,
      source: context.source,
      setupState: context.envConfig.setupState
    });
    await fs.writeFile(${JSON.stringify(markerPath)}, JSON.stringify(current));
  },
  afterAppStart: async (context) => {
    const fs = await import('node:fs/promises');
    const current = JSON.parse(await fs.readFile(${JSON.stringify(markerPath)}, 'utf8').catch(() => '[]'));
    current.push({
      hook: 'afterAppStart',
      phase: context.phase,
      command: context.command,
      source: context.source,
      setupState: context.envConfig.setupState
    });
    await fs.writeFile(${JSON.stringify(markerPath)}, JSON.stringify(current));
  }
};
`,
  );
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'prepared-local',
    source: 'npm',
    projectRoot: path.join(hookDir, 'source'),
    env: {
      appPath: hookDir,
      sourcePath: path.join(hookDir, 'source'),
      storagePath: path.join(hookDir, 'storage'),
      appPort: 13000,
      config: {
        setupState: 'prepared',
        hookScript: hookPath,
        downloadVersion: 'beta',
      },
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'prepared-local',
    },
  });

  await Start.prototype.run.call(command);

  await expect(fsp.readFile(markerPath, 'utf8')).resolves.toBe(
    JSON.stringify([
      {
        hook: 'beforeAppInstall',
        phase: 'init',
        command: 'app:start',
        source: 'npm',
        setupState: 'prepared',
      },
      {
        hook: 'afterAppStart',
        phase: 'init',
        command: 'app:start',
        source: 'npm',
        setupState: 'installed',
      },
    ]),
  );
});

test('start rejects prepared local envs in foreground mode', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'prepared-local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      config: {
        setupState: 'prepared',
        rootUsername: 'admin',
      },
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'prepared-local',
      daemon: false,
    },
  });
  command.argv = ['--no-daemon'];

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
    /Run `nb app start --env prepared-local` to finish the first installation in daemon mode\./,
  );
});

test('start recreates prepared docker envs with init env vars and marks them installed after success', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'prepared-docker',
    source: 'docker',
    containerName: 'nb-demo-prepared-docker-app',
    workspaceName: 'nb-demo',
    env: {
      appPort: 13000,
      config: {
        setupState: 'prepared',
        lang: 'en-US',
        rootUsername: 'admin',
        rootEmail: 'admin@nocobase.com',
        rootPassword: 'admin123',
        rootNickname: 'Admin',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'prepared-docker',
    },
  });

  try {
    await Start.prototype.run.call(command);

    expect(recreateSavedDockerApp).toHaveBeenCalledWith(
      expect.objectContaining({
        envName: 'prepared-docker',
      }),
      {
        initEnvVars: {
          INIT_APP_LANG: 'en-US',
          INIT_ROOT_USERNAME: 'admin',
          INIT_ROOT_EMAIL: 'admin@nocobase.com',
          INIT_ROOT_PASSWORD: 'admin123',
          INIT_ROOT_NICKNAME: 'Admin',
        },
        verbose: undefined,
      },
    );
    expect(mocks.clearEnvRootSetup).toHaveBeenCalledWith('prepared-docker');
    expect(mocks.upsertEnv).toHaveBeenCalledWith('prepared-docker', { setupState: 'installed' });
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('start prints the resolved public app url for local envs', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppApiBaseUrl.mockImplementation(() => 'http://192.168.1.10:13000/api');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
      quickstart: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls).toContainEqual([
    'NocoBase is running for "local" at http://192.168.1.10:13000/.',
  ]);
});

test('start keeps quickstart enabled by default as a hidden compatibility flag', async () => {
  const { default: Start } = await import('../commands/app/start.js');

  expect(Start.flags.quickstart.hidden).toBe(true);
  expect(Start.flags.quickstart.default).toBe(true);
  expect(Start.flags.quickstart.allowNo).toBe(true);
  expect(Start.flags['sync-licensed-plugins'].hidden).toBe(true);
  expect(Start.flags['sync-licensed-plugins'].default).toBe(true);
  expect(Start.flags['sync-licensed-plugins'].allowNo).toBe(true);
  expect('port' in Start.flags).toBe(false);
  expect('instances' in Start.flags).toBe(false);
  expect('launch-mode' in Start.flags).toBe(false);
});

test('start allows opting out of quickstart explicitly', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
      quickstart: false,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual(['start', '--port', '13000', '--daemon']);
});

test('start explains when the requested env does not exist', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --ui --env local53` first\./s,
  );
});

test('start reports when the local app is already running', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.isAppReady.mockResolvedValueOnce(true);
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Start.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase is already running for "local" at http://127.0.0.1:13000/.'],
  ]);
  expect(runCommand).not.toHaveBeenCalled();
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('start can suppress the final success line for upgrade subcommand context', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.runLocalNocoBaseCommand.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined);
  process.env.NB_SKIP_APP_START_SUCCESS_LOG = '1';

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  try {
    await Start.prototype.run.call(command);

    expect(mocks.waitForAppReady).toHaveBeenCalledWith({
      envName: 'local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      logHint: 'You can inspect startup logs with `nb app logs --env local`.',
    });
    expect(mocks.succeedTask.mock.calls).toEqual([
      ['Local postinstall finished for "local".'],
      ['Client assets are ready for "local".'],
    ]);
  } finally {
    delete process.env.NB_SKIP_APP_START_SUCCESS_LOG;
  }
});

test('start supports --no-daemon for npm/git envs', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
      daemon: false,
    },
  });
  command.argv = ['--no-daemon'];

  await Start.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([
    ['Starting NocoBase for "local" in the foreground at http://127.0.0.1:13000/. Press Ctrl+C to stop.'],
  ]);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Running local postinstall for "local"...'],
    ['Extracting client assets for "local"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['Local postinstall finished for "local".'],
    ['Client assets are ready for "local".'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(3);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['client:extract']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual(['start', '--quickstart', '--port', '13000']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
});

test('start foreground mode explains how to restart when the local app is already running', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.isAppReady.mockResolvedValueOnce(true);

  const command = createCommandHarness({
    flags: {
      env: 'local',
      daemon: false,
    },
  });
  command.argv = ['--no-daemon'];

  await Start.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([
    [
      'NocoBase is already running for "local" at http://127.0.0.1:13000/. Use `nb app stop --env local` before starting it again in the foreground.',
    ],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('start enables raw startup output when --verbose is set', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
      verbose: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'inherit',
  });
});

test('start waits for the local app health check in daemon mode', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.waitForAppReady.mock.calls).toEqual([
    [
      {
        envName: 'local',
        apiBaseUrl: 'http://127.0.0.1:13000/api',
        logHint: 'You can inspect startup logs with `nb app logs --env local`.',
      },
    ],
  ]);
});

test('start injects a default CDN_BASE_URL from dist-client active-version when not explicitly configured', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      storagePath: '/tmp/nocobase/storage',
      envVars: { APP_PORT: '13000' },
      config: {
        appPublicPath: '/console/',
      },
    },
  });
  mocks.readManagedRuntimeEnvValues.mockResolvedValue({
    envFilePath: '/tmp/nocobase/.env',
    envValues: {},
  });
  mocks.readDistClientActiveVersion.mockResolvedValue('2.1.0-beta.44');

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[2]).toEqual({
    env: {
      ...MANAGED_APP_PRODUCTION_ENV,
      CDN_BASE_URL: '/console/dist/2.1.0-beta.44/',
    },
    stdio: 'ignore',
  });
});

test('start does not inject a default CDN_BASE_URL when the env already saves one', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      storagePath: '/tmp/nocobase/storage',
      envVars: {
        APP_PORT: '13000',
        CDN_BASE_URL: 'https://cdn.example.com/ui/',
      },
      config: {
        appPublicPath: '/console/',
        cdnBaseUrl: 'https://cdn.example.com/ui/',
      },
    },
  });
  mocks.readManagedRuntimeEnvValues.mockResolvedValue({
    envFilePath: '/tmp/nocobase/.env',
    envValues: {},
  });
  mocks.readDistClientActiveVersion.mockResolvedValue('2.1.0-beta.44');

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'ignore',
  });
});

test('start restores the built-in database before launching the app', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        builtinDbImage: 'postgres:16',
        storagePath: './local/storage',
      },
    },
  });
  mocks.commandSucceeds.mockResolvedValueOnce(true);
  mocks.dockerContainerExists.mockResolvedValueOnce(true);
  mocks.startDockerContainer.mockResolvedValueOnce('started');

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('local');
  expect(mocks.startDockerContainer.mock.calls[0]).toEqual(['nb-demo-local-postgres', { stdio: 'ignore' }]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['client:extract']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual([
    'start',
    '--quickstart',
    '--port',
    '13000',
    '--daemon',
  ]);
});

test('start restores the built-in database with docker.container-prefix instead of workspaceName', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app528',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nocobase-team',
    dockerContainerPrefix: 'nb-team',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        builtinDbImage: 'postgres:16',
        storagePath: './local/storage',
      },
    },
  });
  mocks.commandSucceeds.mockResolvedValueOnce(true);
  mocks.dockerContainerExists.mockResolvedValueOnce(true);
  mocks.startDockerContainer.mockResolvedValueOnce('started');

  const command = createCommandHarness({
    flags: {
      env: 'app528',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app528');
  expect(mocks.startDockerContainer.mock.calls[0]).toEqual(['nb-team-app528-postgres', { stdio: 'ignore' }]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['client:extract']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual([
    'start',
    '--quickstart',
    '--port',
    '13000',
    '--daemon',
  ]);
});

test('start restores saved npm/git source files before launching when the app root is missing', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        builtinDb: false,
        downloadVersion: 'next',
        gitUrl: 'https://github.com/nocobase/nocobase.git',
        npmRegistry: 'https://registry.npmmirror.com',
        devDependencies: true,
        build: false,
        buildDts: true,
      },
    },
  });
  mocks.fsReaddir.mockRejectedValueOnce(new Error('ENOENT'));
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        verbose: true,
      },
    },
    runCommand,
  );

  await Start.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--verbose',
        '--source',
        'git',
        '--replace',
        '--output-dir',
        '/tmp/nocobase',
        '--version',
        'next',
        '--git-url',
        'https://github.com/nocobase/nocobase.git',
        '--npm-registry',
        'https://registry.npmmirror.com',
        '--dev-dependencies',
        '--no-build',
        '--build-dts',
      ],
    ],
    ['license:plugins:sync', ['--env', 'local', '--skip-if-no-license', '--verbose']],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'inherit',
  });
});

test('start shows product-style local failure guidance instead of raw command errors', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.runLocalNocoBaseCommand
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('nocobase command exited with code 1'));

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
    /Couldn't start NocoBase for "local".*The CLI was not able to start the local npm app successfully\..*Expected app port: 13000\./s,
  );
  expect(mocks.startTask.mock.calls).toEqual([
    ['Running local postinstall for "local"...'],
    ['Extracting client assets for "local"...'],
    ['Starting NocoBase for "local" in the background...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['Local postinstall finished for "local".'],
    ['Client assets are ready for "local".'],
  ]);
  expect(mocks.failTask.mock.calls).toEqual([['Failed to start NocoBase for "local".']]);
});

test('start surfaces local postinstall failures before launching the app', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.runLocalNocoBaseCommand.mockRejectedValueOnce(new Error('nocobase command exited with code 1'));

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
    /Couldn't prepare NocoBase for "local".*run `nocobase-v1 postinstall` before starting the local app\./s,
  );
  expect(mocks.startTask.mock.calls).toEqual([['Running local postinstall for "local"...']]);
  expect(mocks.failTask.mock.calls).toEqual([['Failed to run local postinstall for "local".']]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toHaveLength(1);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
});

test('start warns when client extraction fails but still launches the app', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  mocks.runLocalNocoBaseCommand
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('extract failed'))
    .mockResolvedValueOnce(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([
    ['Running local postinstall for "local"...'],
    ['Extracting client assets for "local"...'],
    ['Starting NocoBase for "local" in the background...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['Local postinstall finished for "local".'],
    ['NocoBase is running for "local" at http://127.0.0.1:13000/.'],
  ]);
  expect(mocks.failTask.mock.calls).toEqual([['Failed to extract client assets for "local".']]);
  expect(mocks.printWarning.mock.calls).toEqual([
    [
      'Client assets were not extracted for "local".\n' +
        'NocoBase will keep starting, but versioned client files for CDN or external distribution may be stale or missing.\n' +
        'Details: extract failed',
    ],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['client:extract']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[2]?.[1]).toEqual([
    'start',
    '--quickstart',
    '--port',
    '13000',
    '--daemon',
  ]);
});

test('start recreates docker envs without treating the default daemon flag as explicit input', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      appPort: 13000,
      config: {},
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        daemon: true,
      },
    },
    runCommand,
  );

  try {
    await Start.prototype.run.call(command);

    expect(runCommand.mock.calls).toEqual([
      ['license:plugins:sync', ['--env', 'docker-local', '--skip-if-no-license']],
    ]);
    expect(mocks.run).toHaveBeenCalledWith('docker', ['rm', '-f', 'nb-demo-docker-local-app'], {
      errorName: 'docker rm',
      stdio: 'ignore',
    });
    expect(recreateSavedDockerApp).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'docker',
        envName: 'docker-local',
        containerName: 'nb-demo-docker-local-app',
      }),
      { verbose: undefined },
    );
    expect(mocks.waitForAppReady).toHaveBeenCalledWith({
      envName: 'docker-local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      containerName: 'nb-demo-docker-local-app',
      logHint: 'You can inspect startup logs with `nb app logs --env docker-local`.',
    });
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('start prints the resolved public app url for docker envs', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppApiBaseUrl.mockImplementation(() => 'http://192.168.1.10:13000/console/api');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      appPort: 13000,
      config: {
        appPublicPath: '/console/',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  try {
    await Start.prototype.run.call(command);

    expect(mocks.succeedTask.mock.calls).toContainEqual([
      'NocoBase is running for "docker-local" at http://192.168.1.10:13000/console/.',
    ]);
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('start recreates docker app containers through docker run', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appKey: 'app-key-123',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-docker-local-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        dbSchema: 'test',
        dbTablePrefix: 'nb_',
        dbUnderscored: true,
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'next',
        storagePath: './docker-local/storage',
        appPublicPath: '/console/',
      },
      appPort: 13000,
    },
  });
  mocks.commandSucceeds.mockResolvedValueOnce(true);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      verbose: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.fsMkdir.mock.calls).toContainEqual([
    path.resolve(resolveCliHomeRoot(), './docker-local/storage'),
    { recursive: true },
  ]);
  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    ['rm', '-f', 'nb-demo-docker-local-app'],
    {
      errorName: 'docker rm',
      stdio: 'inherit',
    },
  ]);
  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    [
      'run',
      '-d',
      '--name',
      'nb-demo-docker-local-app',
      '--network',
      'nb-demo',
      '-p',
      '13000:80',
      '-e',
      'APP_ENV=production',
      '-e',
      'NODE_ENV=production',
      '-e',
      'APP_KEY=app-key-123',
      '-e',
      'DB_DIALECT=postgres',
      '-e',
      'DB_HOST=nb-demo-docker-local-postgres',
      '-e',
      'DB_PORT=5432',
      '-e',
      'DB_DATABASE=nocobase',
      '-e',
      'DB_USER=nocobase',
      '-e',
      'DB_PASSWORD=nocobase',
      '-e',
      'TZ=Asia/Shanghai',
      '-v',
      `${path.resolve(resolveCliHomeRoot(), './docker-local/storage')}:/app/nocobase/storage`,
      '-e',
      'APP_PUBLIC_PATH=/console/',
      '-e',
      'DB_SCHEMA=test',
      '-e',
      'DB_TABLE_PREFIX=nb_',
      '-e',
      'DB_UNDERSCORED=true',
      '-e',
      'NOCOBASE_EXTRACT_CLIENT_ASSETS=true',
      'nocobase/nocobase:next-full',
    ],
    {
      errorName: 'docker run',
      stdio: 'inherit',
    },
  ]);
  expect(mocks.succeedTask.mock.calls).toContainEqual([
    'NocoBase is running for "docker-local" at http://127.0.0.1:13000/console/.',
  ]);
  expect(mocks.waitForAppReady.mock.calls).toEqual([
    [
      {
        envName: 'docker-local',
        apiBaseUrl: 'http://127.0.0.1:13000/console/api',
        containerName: 'nb-demo-docker-local-app',
        logHint: 'You can inspect startup logs with `nb app logs --env docker-local`.',
        verbose: true,
      },
    ],
  ]);
});

test('start maps no-nginx docker app containers to the app port inside the container', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appKey: 'app-key-123',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-docker-local-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'next-full-no-nginx',
        storagePath: './docker-local/storage',
      },
      appPort: 13000,
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      verbose: true,
    },
  });

  await Start.prototype.run.call(command);

  const dockerRunCall = mocks.run.mock.calls.find(
    ([bin, args]) => bin === 'docker' && Array.isArray(args) && args[0] === 'run',
  );
  expect(dockerRunCall?.[1]).toContain('13000:13000');
  expect(dockerRunCall?.[1]).not.toContain('13000:80');
});

test('start enables NOCOBASE_EXTRACT_CLIENT_ASSETS for docker envs by default', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appKey: 'app-key-123',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-docker-local-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'next',
        storagePath: './docker-local/storage',
      },
      appPort: 13000,
    },
  });
  mocks.commandSucceeds.mockResolvedValueOnce(true);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      verbose: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    expect.arrayContaining(['run', '-e', 'NOCOBASE_EXTRACT_CLIENT_ASSETS=true', 'nocobase/nocobase:next-full']),
    {
      errorName: 'docker run',
      stdio: 'inherit',
    },
  ]);
});

test('start lets docker envs disable NOCOBASE_EXTRACT_CLIENT_ASSETS explicitly', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  process.env.NOCOBASE_EXTRACT_CLIENT_ASSETS = 'false';
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appKey: 'app-key-123',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-docker-local-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'next',
        storagePath: './docker-local/storage',
      },
      appPort: 13000,
    },
  });
  mocks.commandSucceeds.mockResolvedValueOnce(true);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      verbose: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(
    mocks.run.mock.calls.some(
      ([name, args]) =>
        name === 'docker' &&
        Array.isArray(args) &&
        args.includes('NOCOBASE_EXTRACT_CLIENT_ASSETS=false') &&
        args.includes('nocobase/nocobase:next-full'),
    ),
  ).toBe(true);
});

test('start rejects local-only flags for docker envs', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      daemon: false,
    },
  });
  command.argv = ['--no-daemon'];

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
    /Can't apply --no-daemon to "docker-local".*only available for local npm\/git installs/s,
  );
});

test('stop removes docker app containers', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([['Removing the saved Docker app container for "docker-local"...']]);
  expect(mocks.succeedTask.mock.calls).toEqual([['Docker app container removed for "docker-local".']]);
  expect(mocks.commandOutput.mock.calls).toContainEqual([
    'docker',
    ['container', 'inspect', 'nb-demo-docker-local-app'],
    { errorName: 'docker container inspect' },
  ]);
  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    ['rm', '-f', 'nb-demo-docker-local-app'],
    { errorName: 'docker rm', stdio: 'ignore' },
  ]);
});

test('stop reports when the docker app container is already missing', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  mocks.commandOutput.mockRejectedValue(
    new Error(
      'docker container inspect exited with code 1: Error response from daemon: No such container: docker-local',
    ),
  );

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls).toEqual([['No Docker app container found for "docker-local".']]);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('stop surfaces docker inspect failures that are not missing-container errors', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  mocks.commandOutput.mockRejectedValue(
    new Error(
      'docker container inspect exited with code 1: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?',
    ),
  );

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  await expect((() => Stop.prototype.run.call(command))()).rejects.toThrow(
    /Couldn't stop NocoBase for "docker-local".*Cannot connect to the Docker daemon/s,
  );
  expect(mocks.failTask.mock.calls).toEqual([['Failed to stop NocoBase for "docker-local".']]);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('stop explains when the requested env does not exist', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Stop.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --ui --env local53` first\./s,
  );
});

test('upgrade explains when the requested env does not exist', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*run `nb init --ui --env local53` first\./s,
  );
});

test('pm list explains when the requested env does not exist', async () => {
  const { default: PmList } = await import('../commands/plugin/list.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => PmList.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*run `nb init --ui --env local53` first\./s,
  );
});

test('stop enables raw shutdown output when --verbose is set', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
      verbose: true,
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([['Stopping NocoBase for "local"...']]);
  expect(mocks.succeedTask.mock.calls).toEqual([['NocoBase has stopped for "local".']]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'inherit',
  });
});

test('stop ignores missing nocobase-v1 during local shutdown', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/missing-source',
    env: {
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.runLocalNocoBaseCommand.mockRejectedValue(new Error('spawn nocobase-v1 ENOENT'));

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [runtime, ['pm2', 'kill'], { env: MANAGED_APP_PRODUCTION_ENV, stdio: 'ignore' }],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([['NocoBase has stopped for "local".']]);
});

test('stop ignores missing saved source paths during local shutdown', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/missing-source',
    env: {
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.runLocalNocoBaseCommand.mockRejectedValue(
    new Error("Couldn't find a NocoBase source project from --cwd: /tmp/missing-source"),
  );

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [runtime, ['pm2', 'kill'], { env: MANAGED_APP_PRODUCTION_ENV, stdio: 'ignore' }],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([['NocoBase has stopped for "local".']]);
});

test('stop shows product-style local failure guidance', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  });
  mocks.runLocalNocoBaseCommand.mockRejectedValue(new Error('nocobase command exited with code 1'));

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await expect((() => Stop.prototype.run.call(command))()).rejects.toThrow(
    /Couldn't stop NocoBase for "local".*still available, then try again\..*Details: nocobase command exited with code 1/s,
  );
  expect(mocks.startTask.mock.calls).toEqual([['Stopping NocoBase for "local"...']]);
  expect(mocks.failTask.mock.calls).toEqual([['Failed to stop NocoBase for "local".']]);
});

test('stop --with-db removes the built-in database container after stopping the app', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-docker-local-postgres');

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      'with-db': true,
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([
    ['Removing the saved Docker app container for "docker-local"...'],
    ['Removing the built-in database container for "docker-local"...'],
  ]);
  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    ['rm', '-f', 'nb-demo-docker-local-app'],
    { errorName: 'docker rm', stdio: 'ignore' },
  ]);
  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    ['rm', '-f', 'nb-demo-docker-local-postgres'],
    { errorName: 'docker rm', stdio: 'ignore' },
  ]);
});

test('stop --with-db keeps external databases untouched', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      config: {
        builtinDb: false,
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'local',
      'with-db': true,
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [runtime, ['pm2', 'kill'], { env: MANAGED_APP_PRODUCTION_ENV, stdio: 'ignore' }],
  ]);
  expect(mocks.run.mock.calls.length).toBe(0);
  expect(mocks.printInfo.mock.calls).toContainEqual([
    'Env "local" does not use a CLI-managed built-in database. Only the app runtime was stopped.',
  ]);
});

test('stop allows explicit cross-env execution in non-interactive mode when --yes is set', async () => {
  const { default: Stop } = await import('../commands/app/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      yes: true,
    },
  });
  command.argv = ['--env', 'docker-local', '--yes'];

  await Stop.prototype.run.call(command);

  expect(mocks.run.mock.calls).toContainEqual([
    'docker',
    ['rm', '-f', 'nb-demo-docker-local-app'],
    { errorName: 'docker rm', stdio: 'ignore' },
  ]);
});

test('restart runs stop before start and forwards supported startup flags', async () => {
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        quickstart: true,
        daemon: false,
        verbose: true,
      },
    },
    runCommand,
  );
  command.argv = ['--no-daemon'];

  await Restart.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['license:plugins:sync', ['--env', 'local', '--skip-if-no-license', '--verbose']],
    ['app:stop', ['--env', 'local', '--verbose']],
    ['app:start', ['--env', 'local', '--verbose', '--quickstart', '--no-sync-licensed-plugins', '--no-daemon']],
  ]);
});

test('restart keeps quickstart enabled by default as a hidden compatibility flag', async () => {
  const { default: Restart } = await import('../commands/app/restart.js');

  expect(Restart.flags.quickstart.hidden).toBe(true);
  expect(Restart.flags.quickstart.default).toBe(true);
  expect(Restart.flags.quickstart.allowNo).toBe(true);
  expect(Restart.flags['sync-licensed-plugins'].hidden).toBe(true);
  expect(Restart.flags['sync-licensed-plugins'].default).toBe(true);
  expect(Restart.flags['sync-licensed-plugins'].allowNo).toBe(true);
  expect('port' in Restart.flags).toBe(false);
  expect('instances' in Restart.flags).toBe(false);
  expect('launch-mode' in Restart.flags).toBe(false);
});

test('restart forwards quickstart by default for local envs', async () => {
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Restart.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['license:plugins:sync', ['--env', 'local', '--skip-if-no-license']],
    ['app:stop', ['--env', 'local']],
    ['app:start', ['--env', 'local', '--quickstart', '--no-sync-licensed-plugins']],
  ]);
});

test('restart forwards app restart hook command for saved hook scripts', async () => {
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        hookScript: '.nb/hooks.mjs',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Restart.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['license:plugins:sync', ['--env', 'local', '--skip-if-no-license']],
    ['app:stop', ['--env', 'local']],
    ['app:start', ['--env', 'local', '--quickstart', '--no-sync-licensed-plugins', '--hook-command', 'app:restart']],
  ]);
});

test('restart does not forward default daemon flag unless the user provides it', async () => {
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'docker-local',
    source: 'local',
    projectRoot: '/tmp/docker-local',
    env: {
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
    },
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        daemon: true,
        quickstart: false,
      },
    },
    runCommand,
  );

  await Restart.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['license:plugins:sync', ['--env', 'docker-local', '--skip-if-no-license']],
    ['app:stop', ['--env', 'docker-local']],
    ['app:start', ['--env', 'docker-local', '--no-sync-licensed-plugins']],
  ]);
});

test('restart recreates docker envs so envFile changes can take effect', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      appPort: 13000,
      config: {
        envFile: './docker-local/.env',
      },
    },
  });

  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        verbose: true,
      },
    },
    runCommand,
  );

  try {
    await Restart.prototype.run.call(command);

    expect(runCommand.mock.calls).toEqual([
      ['license:plugins:sync', ['--env', 'docker-local', '--skip-if-no-license', '--verbose']],
    ]);
    expect(mocks.stopDockerContainer).toHaveBeenCalledWith('nb-demo-docker-local-app', {
      stdio: 'inherit',
    });
    expect(mocks.run).toHaveBeenCalledWith('docker', ['rm', '-f', 'nb-demo-docker-local-app'], {
      errorName: 'docker rm',
      stdio: 'inherit',
    });
    expect(recreateSavedDockerApp).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'docker',
        envName: 'docker-local',
        containerName: 'nb-demo-docker-local-app',
      }),
      { verbose: true },
    );
    expect(mocks.waitForAppReady).toHaveBeenCalledWith({
      envName: 'docker-local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      containerName: 'nb-demo-docker-local-app',
      logHint: 'You can inspect startup logs with `nb app logs --env docker-local`.',
      verbose: true,
    });
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('restart recreates docker envs by default', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      appPort: 13000,
      config: {
        envFile: './docker-local/.env',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        verbose: true,
      },
    },
    runCommand,
  );

  try {
    await Restart.prototype.run.call(command);

    expect(runCommand.mock.calls).toEqual([
      ['license:plugins:sync', ['--env', 'docker-local', '--skip-if-no-license', '--verbose']],
    ]);
    expect(mocks.stopDockerContainer).toHaveBeenCalledWith('nb-demo-docker-local-app', {
      stdio: 'inherit',
    });
    expect(mocks.run).toHaveBeenCalledWith('docker', ['rm', '-f', 'nb-demo-docker-local-app'], {
      errorName: 'docker rm',
      stdio: 'inherit',
    });
    expect(recreateSavedDockerApp).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'docker',
        envName: 'docker-local',
        containerName: 'nb-demo-docker-local-app',
      }),
      { verbose: true },
    );
    expect(mocks.waitForAppReady).toHaveBeenCalledWith({
      envName: 'docker-local',
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      containerName: 'nb-demo-docker-local-app',
      logHint: 'You can inspect startup logs with `nb app logs --env docker-local`.',
      verbose: true,
    });
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('restart prints the resolved public app url for docker envs', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const recreateSavedDockerApp = vi.spyOn(appManagedResources, 'recreateSavedDockerApp').mockResolvedValue(undefined);
  const { default: Restart } = await import('../commands/app/restart.js');
  mocks.resolveManagedAppApiBaseUrl.mockImplementation(() => 'http://192.168.1.10:13000/console/api');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      appPort: 13000,
      config: {
        appPublicPath: '/console/',
        envFile: './docker-local/.env',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  try {
    await Restart.prototype.run.call(command);

    expect(mocks.succeedTask.mock.calls).toContainEqual([
      'NocoBase is running for "docker-local" at http://192.168.1.10:13000/console/.',
    ]);
  } finally {
    recreateSavedDockerApp.mockRestore();
  }
});

test('start rejects cross-env requests in non-interactive agent sessions without --yes', async () => {
  const { default: Start } = await import('../commands/app/start.js');
  const restoreTerminal = setTerminalInteractivity(false);
  const command = createCommandHarness({
    flags: {
      env: 'prod',
      yes: false,
    },
  });
  command.argv = ['--env', 'prod'];
  mocks.getCurrentEnvName.mockResolvedValue('local');

  try {
    await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(
      /Refusing to run against env "prod" because the current env is "local"/,
    );
    expect(mocks.resolveManagedAppRuntime.mock.calls.length).toBe(0);
  } finally {
    restoreTerminal();
  }
});

test('logs supports --env and --no-follow for local app logs', async () => {
  const { default: Logs } = await import('../commands/app/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      tail: 50,
      follow: false,
    },
  });

  await Logs.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['app1']]);
  expect(mocks.printInfo.mock.calls).toEqual([['Showing recent logs for "app1".']]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['pm2', 'logs', '--lines', '50', '--nostream']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    env: MANAGED_APP_PRODUCTION_ENV,
    stdio: 'inherit',
  });
});

test('logs reads docker app logs', async () => {
  const { default: Logs } = await import('../commands/app/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      tail: 100,
      follow: true,
    },
  });

  await Logs.prototype.run.call(command);

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['logs', '--tail', '100', '--follow', 'nb-demo-docker-local-app'],
      {
        errorName: 'docker logs',
        stdio: 'inherit',
      },
    ],
  ]);
});

test('logs defaults to recent docker app logs without follow', async () => {
  const { default: Logs } = await import('../commands/app/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      tail: 100,
    },
  });

  await Logs.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([['Showing recent logs for "docker-local".']]);
  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['logs', '--tail', '100', 'nb-demo-docker-local-app'],
      {
        errorName: 'docker logs',
        stdio: 'inherit',
      },
    ],
  ]);
});

test('logs explains when the requested env does not exist', async () => {
  const { default: Logs } = await import('../commands/app/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Logs.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*run `nb init --ui --env local53` first\./s,
  );
});

test('logs explains http envs do not have local runtime logs', async () => {
  const { default: Logs } = await import('../commands/app/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
    },
  });

  await expect((() => Logs.prototype.run.call(command))()).rejects.toThrow(
    /Can't show runtime logs for "remote" from this machine\..*only has an API connection/s,
  );
});

test('env list shows configured envs without runtime status probing', async () => {
  const { default: EnvList } = await import('../commands/env/list.js');
  mocks.listEnvs.mockResolvedValue({
    lastEnv: 'local',
    envs: {
      docker: {
        kind: 'docker',
        apiBaseUrl: 'http://127.0.0.1:13000/api',
        auth: { type: 'token' },
        runtime: { version: '1.0.0' },
      },
      local: {
        kind: 'local',
        apiBaseUrl: 'http://127.0.0.1:13001/api',
        auth: { type: 'oauth' },
        runtime: { version: '2.0.0' },
      },
      remote: {
        kind: 'http',
        baseUrl: 'https://demo.example.com/api',
      },
    },
  });

  const command = createCommandHarness({
    flags: {},
  });

  await EnvList.prototype.run.call(command);

  expect(mocks.listEnvs.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  expect(mocks.executeRawApiRequest).not.toHaveBeenCalled();
  expect(mocks.renderTable.mock.calls[0]?.[0]).toEqual(['Current', 'Name', 'Kind', 'API Base URL', 'Auth', 'Runtime']);
  expect(mocks.renderTable.mock.calls[0]?.[1]).toEqual([
    ['', 'docker', 'docker', 'http://127.0.0.1:13000/api', 'token', '1.0.0'],
    ['*', 'local', 'local', 'http://127.0.0.1:13001/api', 'oauth', '2.0.0'],
    ['', 'remote', 'http', 'https://demo.example.com/api', '', ''],
  ]);
});

test('env list points empty workspaces to nb init', async () => {
  const { default: EnvList } = await import('../commands/env/list.js');
  mocks.listEnvs.mockResolvedValue({
    lastEnv: undefined,
    envs: {},
  });

  const command = createCommandHarness({
    flags: {},
  });

  await EnvList.prototype.run.call(command);

  expect(command.log.mock.calls).toEqual([['No envs configured.'], ['Run `nb init --ui` to create one first.']]);
});

test('env status shows runtime status for all configured envs', async () => {
  const { default: EnvStatus } = await import('../commands/env/status.js');
  mocks.listEnvs.mockResolvedValue({
    lastEnv: 'local',
    envs: {
      docker: {
        kind: 'docker',
        apiBaseUrl: 'http://127.0.0.1:13000/api',
      },
      local: {
        kind: 'local',
        apiBaseUrl: 'http://127.0.0.1:13001/api',
      },
      remote: {
        kind: 'http',
        baseUrl: 'https://demo.example.com/api',
      },
    },
  });
  mocks.resolveManagedAppRuntime.mockImplementation(async (envName: string) => {
    if (envName === 'docker') {
      return {
        kind: 'docker',
        envName: 'docker',
        source: 'docker',
        containerName: 'nb-demo-docker-app',
        workspaceName: 'nb-demo',
        env: {
          runtime: { version: '1.0.0' },
          config: {
            appPort: 13000,
          },
        },
      };
    }
    if (envName === 'local') {
      return {
        kind: 'local',
        envName: 'local',
        source: 'npm',
        projectRoot: '/tmp/nocobase',
        workspaceName: 'nb-demo',
        env: {
          runtime: { version: '2.0.0' },
          config: {
            appPort: 13001,
          },
        },
      };
    }
    return {
      kind: 'http',
      envName: 'remote',
      source: undefined,
      env: {
        runtime: {},
        config: {
          baseUrl: 'https://demo.example.com/api',
        },
      },
    };
  });
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.dockerContainerIsRunning.mockResolvedValue(true);
  mocks.executeRawApiRequest.mockResolvedValueOnce({ ok: true, status: 200, data: {} });
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    text: vi.fn().mockResolvedValue('ok'),
  } as any);

  const command = createCommandHarness({
    args: {},
    flags: { all: true, 'json-output': false },
  });

  await EnvStatus.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['docker'], ['local'], ['remote']]);
  expect(mocks.renderTable.mock.calls[0]?.[0]).toEqual(['Env', 'Status', 'API Base URL']);
  expect(mocks.renderTable.mock.calls[0]?.[1]).toEqual([
    ['docker', 'running', 'http://127.0.0.1:13000/api'],
    ['local', 'running', 'http://127.0.0.1:13001/api'],
    ['remote', 'ok', 'https://demo.example.com/api'],
  ]);
});

test('env status points empty workspaces to nb init', async () => {
  const { default: EnvStatus } = await import('../commands/env/status.js');
  mocks.listEnvs.mockResolvedValue({
    lastEnv: undefined,
    envs: {},
  });

  const command = createCommandHarness({
    args: {},
    flags: { all: false, 'json-output': false },
  });

  await EnvStatus.prototype.run.call(command);

  expect(command.log.mock.calls).toEqual([['No envs configured.'], ['Run `nb init --ui` to create one first.']]);
});

test('env info shows grouped app details with secrets masked by default', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/local-app',
    dockerContainerPrefix: 'nb-demo',
    workspaceName: 'nb-demo',
    env: {
      apiBaseUrl: 'http://127.0.0.1:13000/api',
      storagePath: '/tmp/storage/local',
      auth: {
        type: 'oauth',
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret',
        expiresAt: '2026-04-28T07:35:49.593Z',
        scope: 'api',
        issuer: 'http://127.0.0.1:13000/api',
        clientId: 'client-id',
        resource: 'http://127.0.0.1:13000/api/',
      },
      config: {
        appPort: '13000',
        timezone: 'Asia/Shanghai',
        downloadVersion: 'beta',
        dockerRegistry: 'nocobase/nocobase',
        dockerPlatform: 'linux/arm64',
        builtinDb: true,
        dbDialect: 'postgres',
        builtinDbImage: 'postgres:16',
        dbHost: '127.0.0.1',
        dbPort: '13001',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'db-secret',
        dbSchema: 'test',
        dbTablePrefix: 'nb_',
        dbUnderscored: true,
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'ok',
    })),
  );

  const command = createCommandHarness({
    args: {
      name: 'app1',
    },
    flags: {
      json: false,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('Env');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('name');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('app1');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('App');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('sourcePath');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('/tmp/local-app');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dockerRegistry');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('nocobase/nocobase');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dockerPlatform');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('linux/arm64');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('databaseStatus');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dbPassword');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('********');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dbSchema');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('test');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dbTablePrefix');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('nb_');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('dbUnderscored');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('true');
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toContain('auth.accessToken');
});

test('env info keeps --env as a hidden deprecated compatibility alias', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');

  expect(EnvInfo.flags.env.hidden).toBe(true);
  expect(EnvInfo.flags.env.deprecated).toBe(true);
});

test('env info supports the deprecated --env alias with grouped json output', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/api',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: {},
    flags: {
      env: 'remote',
      json: true,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(JSON.parse(String(command.log.mock.calls[0]?.[0] ?? '{}'))).toEqual({
    ok: true,
    name: 'remote',
    kind: 'http',
    env: 'remote',
    app: {
      url: 'https://demo.example.com/',
      appPath: '-',
      sourcePath: '-',
      storagePath: '-',
      appPort: '-',
      appStatus: 'http',
      source: '-',
      downloadVersion: '-',
      dockerRegistry: '-',
      dockerPlatform: '-',
      timezone: '-',
    },
    db: {
      databaseStatus: 'external',
      builtinDb: '-',
      dbDialect: '-',
      builtinDbImage: '-',
      dbHost: '-',
      dbPort: '-',
      dbDatabase: '-',
      dbUser: '-',
      dbPassword: '-',
      dbTablePrefix: '-',
      dbUnderscored: '-',
    },
    api: {
      apiBaseUrl: 'https://demo.example.com/api',
      auth: {
        type: 'token',
        sessionType: 'token',
        username: '-',
        expiresAt: '-',
        scope: '-',
        issuer: '-',
        clientId: '-',
        resource: '-',
        accessToken: '********',
        refreshToken: '-',
      },
    },
  });
});

test('env info derives app url from api base urls with public paths and subapps', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/base/api/__app/analytics',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: { name: 'remote' },
    flags: {
      json: true,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(JSON.parse(String(command.log.mock.calls[0]?.[0] ?? '{}'))).toMatchObject({
    ok: true,
    name: 'remote',
    kind: 'http',
    env: 'remote',
    app: {
      url: 'https://demo.example.com/base/apps/analytics/',
    },
    api: {
      apiBaseUrl: 'https://demo.example.com/base/api/__app/analytics',
    },
  });
});

test('env info can return only app.url', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/base/api/__app/analytics',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: { name: 'remote' },
    flags: {
      field: 'app.url',
      json: false,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(command.log.mock.calls).toEqual([['https://demo.example.com/base/apps/analytics/']]);
});

test('env info can return a single field as json', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/base/api/__app/analytics',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: { name: 'remote' },
    flags: {
      field: 'app.url',
      json: true,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(JSON.parse(String(command.log.mock.calls[0]?.[0] ?? 'null'))).toBe(
    'https://demo.example.com/base/apps/analytics/',
  );
});

test('env info rejects prototype-chain field lookups', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/base/api/__app/analytics',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: { name: 'remote' },
    flags: {
      field: 'app.constructor',
      json: false,
      'show-secrets': false,
    },
  });

  await expect((() => EnvInfo.prototype.run.call(command))()).rejects.toThrow(/Unknown field "app\.constructor"/);
});

test('env info rejects conflicting environment names from the argument and deprecated --env', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');

  const command = createCommandHarness({
    args: {
      name: 'prod',
    },
    flags: {
      env: 'staging',
      json: false,
      'show-secrets': false,
    },
  });

  await expect((() => EnvInfo.prototype.run.call(command))()).rejects.toThrow(/Please use only one/);
});

test('env info supports positional env name and shows grouped details', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      apiBaseUrl: 'https://demo.example.com/api',
      auth: {
        type: 'token',
        accessToken: 'secret-token',
      },
      config: {
        kind: 'http',
      },
    },
  });

  const command = createCommandHarness({
    args: {
      name: 'remote',
    },
    flags: {
      json: true,
      'show-secrets': false,
    },
  });

  await EnvInfo.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['remote']]);
  expect(JSON.parse(String(command.log.mock.calls[0]?.[0] ?? '{}'))).toMatchObject({
    ok: true,
    name: 'remote',
    kind: 'http',
    env: 'remote',
    api: {
      apiBaseUrl: 'https://demo.example.com/api',
      auth: {
        type: 'token',
        accessToken: '********',
      },
    },
  });
});

test('env info explains when the requested env does not exist', async () => {
  const { default: EnvInfo } = await import('../commands/env/info.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    args: {
      name: 'local53',
    },
    flags: {
      json: false,
      'show-secrets': false,
    },
  });

  await expect((() => EnvInfo.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*run `nb init --ui --env local53` first\./s,
  );
});

test('db ps lists all configured database runtime statuses', async () => {
  const { default: DbPs } = await import('../commands/db/ps.js');
  mocks.listEnvs.mockResolvedValue({
    lastEnv: 'local',
    envs: {
      docker: {},
      local: {},
      remote: {},
    },
  });
  mocks.resolveManagedAppRuntime.mockImplementation(async (envName: string) => {
    if (envName === 'docker') {
      return {
        kind: 'docker',
        envName: 'docker',
        source: 'docker',
        containerName: 'nb-demo-docker-app',
        workspaceName: 'nb-demo',
        env: {
          config: {
            source: 'docker',
            builtinDb: true,
            dbDialect: 'postgres',
            dbHost: 'nb-demo-docker-postgres',
            dbPort: 5432,
          },
        },
      };
    }
    if (envName === 'local') {
      return {
        kind: 'local',
        envName: 'local',
        source: 'npm',
        projectRoot: '/tmp/nocobase',
        workspaceName: 'nb-demo',
        env: {
          config: {
            source: 'npm',
            builtinDb: false,
            dbDialect: 'postgres',
            dbHost: '127.0.0.1',
            dbPort: 5432,
          },
        },
      };
    }
    return {
      kind: 'http',
      envName: 'remote',
      source: undefined,
      env: {
        config: {
          dbDialect: 'mysql',
        },
      },
    };
  });
  mocks.dockerContainerIsRunning.mockResolvedValueOnce(true);

  const command = createCommandHarness({
    flags: {},
  });

  await DbPs.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['docker'], ['local'], ['remote']]);
  expect(mocks.buildDockerDbContainerName.mock.calls[0]).toEqual(['docker', 'postgres', 'nb-demo']);
  expect(mocks.renderTable.mock.calls[0]?.[0]).toEqual(['Env', 'Type', 'Dialect', 'Status', 'Address']);
  expect(mocks.renderTable.mock.calls[0]?.[1]).toEqual([
    ['docker', 'builtin', 'postgres', 'running', 'nb-demo-docker-postgres:5432'],
    ['local', 'external', 'postgres', 'external', '127.0.0.1:5432'],
    ['remote', 'http', 'mysql', 'http', ''],
  ]);
});

test('db start routes built-in database envs to docker start', async () => {
  const { default: DbStart } = await import('../commands/db/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: 5432,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-app1-postgres');
  mocks.startDockerContainer.mockResolvedValue('started');

  const command = createCommandHarness({
    flags: {
      env: 'app1',
    },
  });

  await DbStart.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
  expect(mocks.startTask.mock.calls).toEqual([['Starting the built-in database for "app1"...']]);
  expect(mocks.startDockerContainer.mock.calls).toEqual([['nb-demo-app1-postgres', { stdio: 'ignore' }]]);
  expect(mocks.succeedTask.mock.calls).toEqual([['The built-in database is running for "app1" at 127.0.0.1:5432.']]);
});

test('db start restores missing built-in database containers automatically', async () => {
  const appManagedResources = await import('../lib/app-managed-resources.js');
  const ensureBuiltinDbReady = vi.spyOn(appManagedResources, 'ensureBuiltinDbReady').mockResolvedValue(undefined);
  const { default: DbStart } = await import('../commands/db/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: 5432,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-app1-postgres');
  mocks.startDockerContainer.mockRejectedValue(
    new Error('Docker app container "nb-demo-app1-postgres" does not exist.'),
  );

  const command = createCommandHarness({
    flags: {
      env: 'app1',
    },
  });

  try {
    await DbStart.prototype.run.call(command);

    expect(mocks.updateTask.mock.calls).toEqual([['Restoring the built-in database for "app1"...']]);
    expect(ensureBuiltinDbReady).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'local',
        envName: 'app1',
      }),
      { verbose: false },
    );
    expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
      'The built-in database is running for "app1" at 127.0.0.1:5432.',
    ]);
  } finally {
    ensureBuiltinDbReady.mockRestore();
  }
});

test('db stop routes built-in database envs to docker stop', async () => {
  const { default: DbStop } = await import('../commands/db/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'app1',
    source: 'docker',
    containerName: 'nb-demo-app1-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: 'nb-demo-app1-postgres',
        dbPort: 5432,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-app1-postgres');
  mocks.stopDockerContainer.mockResolvedValue('stopped');

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      verbose: true,
    },
  });

  await DbStop.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('app1');
  expect(mocks.startTask.mock.calls).toEqual([['Stopping the built-in database for "app1"...']]);
  expect(mocks.stopDockerContainer.mock.calls).toEqual([['nb-demo-app1-postgres', { stdio: 'inherit' }]]);
  expect(mocks.succeedTask.mock.calls).toEqual([['The built-in database has stopped for "app1".']]);
});

test('db logs routes built-in database envs to docker logs', async () => {
  const { default: DbLogs } = await import('../commands/db/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: 5432,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-app1-postgres');

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      tail: 50,
      follow: false,
    },
  });

  await DbLogs.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([['Showing recent built-in database logs for "app1".']]);
  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['logs', '--tail', '50', 'nb-demo-app1-postgres'],
      {
        errorName: 'docker logs',
        stdio: 'inherit',
      },
    ],
  ]);
});

test('db logs defaults to recent built-in database logs without follow', async () => {
  const { default: DbLogs } = await import('../commands/db/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbPort: 5432,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-app1-postgres');

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      tail: 100,
    },
  });

  await DbLogs.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([['Showing recent built-in database logs for "app1".']]);
  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['logs', '--tail', '100', 'nb-demo-app1-postgres'],
      {
        errorName: 'docker logs',
        stdio: 'inherit',
      },
    ],
  ]);
});

test('db start explains when the env does not use a built-in database', async () => {
  const { default: DbStart } = await import('../commands/db/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        dbHost: '127.0.0.1',
        dbPort: 5432,
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
    },
  });

  await expect((() => DbStart.prototype.run.call(command))()).rejects.toThrow(
    /does not use a CLI-managed built-in database.*recreate the env with the built-in database option enabled/s,
  );
  expect(mocks.startDockerContainer.mock.calls.length).toBe(0);
});

test('db logs explains when the env does not use a built-in database', async () => {
  const { default: DbLogs } = await import('../commands/db/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        dbHost: '127.0.0.1',
        dbPort: 5432,
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
    },
  });

  await expect((() => DbLogs.prototype.run.call(command))()).rejects.toThrow(
    /does not use a CLI-managed built-in database.*read logs from here.*recreate the env with the built-in database option enabled/s,
  );
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('db check validates a saved env database config', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/app1',
    workspaceName: 'nb-demo',
    env: {
      config: {
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
      },
      envVars: {
        DB_DIALECT: 'postgres',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5432',
        DB_DATABASE: 'nocobase',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'secret',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      json: false,
    },
  });

  await DbCheck.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['app1']]);
  expect(mocks.checkExternalDbConnection.mock.calls[0]?.[0]).toMatchObject({
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    database: 'nocobase',
    user: 'nocobase',
  });
  expect(command.log.mock.calls[0]?.[0]).toContain('Database check passed for env "app1"');
});

test('db check validates explicit --db-* flags without an env', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  const command = createCommandHarness({
    flags: {
      'db-dialect': 'mysql',
      'db-host': 'db.example.com',
      'db-port': '3306',
      'db-database': 'demo',
      'db-user': 'root',
      'db-password': 'secret',
      json: false,
    },
  });

  await DbCheck.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
  expect(mocks.checkExternalDbConnection.mock.calls[0]?.[0]).toMatchObject({
    dialect: 'mysql',
    host: 'db.example.com',
    port: 3306,
    database: 'demo',
    user: 'root',
  });
  expect(command.log.mock.calls[0]?.[0]).toContain('Database check passed (mysql db.example.com:3306/demo).');
});

test('db check reports connection failures', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  mocks.checkExternalDbConnection.mockResolvedValue('authentication failed');

  const command = createCommandHarness({
    flags: {
      'db-dialect': 'postgres',
      'db-host': '127.0.0.1',
      'db-port': '5432',
      'db-database': 'demo',
      'db-user': 'root',
      'db-password': 'bad',
      json: false,
    },
  });

  await expect((() => DbCheck.prototype.run.call(command))()).rejects.toThrow(/authentication failed/);
});

test('db check requires complete database settings', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  const command = createCommandHarness({
    flags: {
      'db-dialect': 'postgres',
      'db-host': '127.0.0.1',
      json: false,
    },
  });

  await expect((() => DbCheck.prototype.run.call(command))()).rejects.toThrow(
    /Missing database settings for connectivity check/,
  );
});

test('db check supports overriding saved env database settings', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'git',
    projectRoot: '/tmp/app1',
    workspaceName: 'nb-demo',
    env: {
      config: {
        dbDialect: 'postgres',
        dbHost: '127.0.0.1',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
      },
      envVars: {
        DB_DIALECT: 'postgres',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5432',
        DB_DATABASE: 'nocobase',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'secret',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      'db-password': 'new-secret',
      json: false,
    },
  });

  await DbCheck.prototype.run.call(command);

  expect(mocks.checkExternalDbConnection.mock.calls[0]?.[0]).toMatchObject({
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    database: 'nocobase',
    user: 'nocobase',
    password: 'new-secret',
  });
});

test('db check routes docker envs through docker run nb db check', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'app1',
    source: 'docker',
    containerName: 'nb-demo-app1-app',
    dockerContainerPrefix: 'nb-demo',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
        dockerRegistry: 'registry.cn-beijing.aliyuncs.com/nocobase/nocobase',
        dockerPlatform: 'linux/amd64',
        downloadVersion: 'pr-9313',
      },
      envVars: {
        DB_DIALECT: 'postgres',
        DB_HOST: 'db.internal',
        DB_PORT: '5432',
        DB_DATABASE: 'nocobase',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'secret',
      },
    },
  });
  mocks.commandOutput.mockResolvedValueOnce(
    JSON.stringify({
      ok: true,
      dialect: 'postgres',
      address: 'db.internal:5432/nocobase',
      error: null,
    }),
  );

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      json: false,
    },
  });

  await DbCheck.prototype.run.call(command);

  expect(mocks.commandOutput).toHaveBeenCalledWith(
    'docker',
    [
      'run',
      '--rm',
      '--network',
      'nb-demo',
      '--platform',
      'linux/amd64',
      '--entrypoint',
      'nb',
      'registry.cn-beijing.aliyuncs.com/nocobase/nocobase:pr-9313',
      'db',
      'check',
      '--db-dialect',
      'postgres',
      '--db-host',
      'nb-demo-app1-postgres',
      '--db-port',
      '5432',
      '--db-database',
      'nocobase',
      '--db-user',
      'nocobase',
      '--db-password',
      'secret',
      '--json',
    ],
    { errorName: 'docker run' },
  );
  expect(mocks.checkExternalDbConnection).not.toHaveBeenCalled();
  expect(command.log.mock.calls[0]?.[0]).toContain('Database check passed for env "app1"');
});

test('db check derives builtin local database host when it is not saved in env config', async () => {
  const { default: DbCheck } = await import('../commands/db/check.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'app1',
    source: 'npm',
    projectRoot: '/tmp/app1',
    dockerContainerPrefix: 'nb-demo',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'secret',
      },
      envVars: {
        DB_DIALECT: 'postgres',
        DB_PORT: '5432',
        DB_DATABASE: 'nocobase',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'secret',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'app1',
      json: false,
    },
  });

  await DbCheck.prototype.run.call(command);

  expect(mocks.checkExternalDbConnection.mock.calls[0]?.[0]).toMatchObject({
    dialect: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    database: 'nocobase',
    user: 'nocobase',
  });
});

test('test recreates the built-in test database before running tests', async () => {
  const { default: Test } = await import('../commands/source/test.js');
  const command = createCommandHarness({
    args: {
      paths: [],
    },
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: false,
      client: false,
      'db-clean': false,
      verbose: false,
    },
  });

  await Test.prototype.run.call(command);

  const postgresImage = mocks.run.mock.calls[1]?.[1]?.find?.(
    (value: unknown) => typeof value === 'string' && (value.includes('postgres:16') || value.includes('/postgres:16')),
  );

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['rm', '-f', 'nb-app2-test-postgres'],
      {
        errorName: 'docker rm',
        stdio: 'ignore',
      },
    ],
    [
      'docker',
      [
        'run',
        '-d',
        '--name',
        'nb-app2-test-postgres',
        '--network',
        'nb-app2',
        '-e',
        'POSTGRES_USER=nocobase',
        '-e',
        'POSTGRES_DB=nocobase-test',
        '-e',
        'POSTGRES_PASSWORD=nocobase',
        '-v',
        `${TEST_POSTGRES_DATA_DIR}:/var/lib/postgresql/data`,
        '-p',
        '5433:5432',
        postgresImage,
        'postgres',
        '-c',
        'wal_level=logical',
      ],
      {
        errorName: 'docker run',
        stdio: 'ignore',
      },
    ],
  ]);
  expect(mocks.fsRm.mock.calls[0]).toEqual([TEST_STORAGE_PATH, { recursive: true, force: true }]);
  expect(mocks.fsMkdir.mock.calls[0]).toEqual([TEST_POSTGRES_DATA_DIR, { recursive: true }]);
  expect(mocks.succeedTask.mock.calls[0]).toEqual(['The built-in test database is ready at 127.0.0.1:5433.']);
  expect(mocks.childSpawnCalls[0]).toMatchObject({
    command: process.execPath,
    args: [
      expect.stringMatching(/[\\/]node_modules[\\/]tsx[\\/]dist[\\/]cli\.mjs$/),
      expect.stringMatching(/[\\/]packages[\\/]core[\\/]test[\\/]src[\\/]scripts[\\/]test-db-creator\.ts$/),
    ],
  });
  expect(mocks.childSpawnCalls[0]?.options?.env).toMatchObject({
    TZ: 'UTC',
    DB_TEST_DISTRIBUTOR_PORT: '23450',
    DB_TEST_PREFIX: 'test',
  });
});

test('test uses aliyun built-in database image when NB_LOCALE is zh-CN', async () => {
  process.env.NB_LOCALE = 'zh-CN';

  const { default: Test } = await import('../commands/source/test.js');
  const command = createCommandHarness({
    args: {
      paths: [],
    },
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: false,
      client: false,
      'db-clean': false,
      verbose: false,
    },
  });

  await Test.prototype.run.call(command);

  expect(mocks.run.mock.calls[1]?.[1]).toContain('registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16');
});

test('test injects DB_* and STORAGE_PATH into nocobase test', async () => {
  const { default: Test } = await import('../commands/source/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<
    typeof vi.fn
  >;

  const command = createCommandHarness({
    args: {
      paths: ['packages/core/server/src/__tests__/foo.test.ts'],
    },
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: true,
      server: false,
      client: false,
      'db-clean': true,
      verbose: true,
    },
  });

  await Test.prototype.run.call(command);

  expect(runNocoBaseCommandMock.mock.calls).toEqual([
    [
      [
        'test',
        'packages/core/server/src/__tests__/foo.test.ts',
        '--run',
        '--coverage',
        '--db-clean',
        '--single-thread=true',
      ],
      {
        cwd: '/tmp/app2',
        env: {
          APP_ENV_PATH: '.env',
          STORAGE_PATH: TEST_STORAGE_PATH,
          TZ: 'UTC',
          DB_DIALECT: 'postgres',
          DB_HOST: '127.0.0.1',
          DB_PORT: '5433',
          DB_DATABASE: 'nocobase-test',
          DB_USER: 'nocobase',
          DB_PASSWORD: 'nocobase',
          DB_TEST_DISTRIBUTOR_PORT: '23450',
          DB_TEST_PREFIX: 'test',
        },
        stdio: 'inherit',
      },
    ],
  ]);
});

test('test respects explicit server and client mode flags', async () => {
  const { default: Test } = await import('../commands/source/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<
    typeof vi.fn
  >;

  const serverCommand = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: true,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: true,
      client: false,
      'db-clean': false,
      verbose: false,
    },
    args: {
      paths: [],
    },
  });

  await Test.prototype.run.call(serverCommand);

  expect(runNocoBaseCommandMock.mock.calls[0]).toEqual([
    ['test', '--watch', '--server'],
    {
      cwd: '/tmp/app2',
      env: {
        APP_ENV_PATH: '.env',
        STORAGE_PATH: TEST_STORAGE_PATH,
        TZ: 'UTC',
        DB_DIALECT: 'postgres',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5433',
        DB_DATABASE: 'nocobase-test',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'nocobase',
        DB_TEST_DISTRIBUTOR_PORT: '23450',
        DB_TEST_PREFIX: 'test',
      },
      stdio: 'ignore',
    },
  ]);

  const clientCommand = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: true,
      allowOnly: true,
      bail: true,
      coverage: false,
      server: false,
      client: true,
      'db-clean': false,
      verbose: false,
    },
    args: {
      paths: ['packages/core/client/src/foo.test.tsx'],
    },
  });

  await Test.prototype.run.call(clientCommand);

  expect(runNocoBaseCommandMock.mock.calls[1]).toEqual([
    ['test', 'packages/core/client/src/foo.test.tsx', '--run', '--allowOnly', '--bail', '--client'],
    {
      cwd: '/tmp/app2',
      env: {
        APP_ENV_PATH: '.env',
        STORAGE_PATH: TEST_STORAGE_PATH,
        TZ: 'UTC',
        DB_DIALECT: 'postgres',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5433',
        DB_DATABASE: 'nocobase-test',
        DB_USER: 'nocobase',
        DB_PASSWORD: 'nocobase',
      },
      stdio: 'ignore',
    },
  ]);
});

test('test falls back to an available port when the default test port is busy', async () => {
  const { default: Test } = await import('../commands/source/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<
    typeof vi.fn
  >;
  mocks.validateAvailableTcpPort.mockResolvedValueOnce('already in use');
  mocks.findAvailableTcpPort.mockResolvedValueOnce('5544');

  const command = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: false,
      client: false,
      'db-clean': false,
      'db-dialect': undefined,
      'db-port': undefined,
      'db-database': undefined,
      'db-user': undefined,
      'db-password': undefined,
      verbose: false,
    },
    args: {
      paths: [],
    },
  });

  await Test.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls[0]).toEqual([
    'Host port 5433 is unavailable for the test database, so the CLI will use 5544 instead.',
  ]);
  expect(mocks.run.mock.calls.at(-1)?.[1]).toContain('5544:5432');
  expect(runNocoBaseCommandMock.mock.calls[0]?.[1]?.env?.DB_PORT).toBe('5544');
});

test('test waits for the MySQL test database port to become ready before running tests', async () => {
  const { default: Test } = await import('../commands/source/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<
    typeof vi.fn
  >;

  mocks.commandSucceeds
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)
    .mockResolvedValue(true);

  const command = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: false,
      client: false,
      'db-clean': false,
      'db-dialect': 'mysql',
      verbose: false,
    },
    args: {
      paths: ['packages/core/database/src/__tests__/query/formatter.test.ts'],
    },
  });

  await Test.prototype.run.call(command);

  const mysqlImage = mocks.run.mock.calls
    .at(-1)?.[1]
    ?.find?.(
      (value: unknown) => typeof value === 'string' && (value.includes('mysql:8') || value.includes('/mysql:8')),
    );

  expect(mocks.run.mock.calls.at(-1)).toEqual([
    'docker',
    expect.arrayContaining(['-p', '3307:3306', mysqlImage]),
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  ]);
  expect(runNocoBaseCommandMock.mock.calls[0]?.[1]?.env).toMatchObject({
    DB_DIALECT: 'mysql',
    DB_PORT: '3307',
    DB_TEST_DISTRIBUTOR_PORT: '23450',
    DB_TEST_PREFIX: 'test_',
  });
  expect(mocks.childSpawnCalls[0]?.options?.env).toMatchObject({
    DB_DIALECT: 'mysql',
    DB_USER: 'root',
    DB_PASSWORD: 'nocobase',
    DB_TEST_DISTRIBUTOR_PORT: '23450',
    DB_TEST_PREFIX: 'test_',
  });
});

test('test forwards a custom built-in database image', async () => {
  const { default: Test } = await import('../commands/source/test.js');

  const command = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: false,
      client: false,
      'db-clean': false,
      'db-dialect': 'mysql',
      'db-image': 'registry.example.com/custom-mysql:8.4',
      'db-port': undefined,
      'db-database': undefined,
      'db-user': undefined,
      'db-password': undefined,
      verbose: false,
    },
    args: {
      paths: [],
    },
  });

  await Test.prototype.run.call(command);

  expect(mocks.run.mock.calls.at(-1)).toEqual([
    'docker',
    expect.arrayContaining(['-p', '3307:3306', 'registry.example.com/custom-mysql:8.4']),
    {
      errorName: 'docker run',
      stdio: 'ignore',
    },
  ]);
});

test('test rejects conflicting server and client flags', async () => {
  const { default: Test } = await import('../commands/source/test.js');

  const command = createCommandHarness({
    flags: {
      cwd: '/tmp/app2',
      watch: false,
      run: false,
      allowOnly: false,
      bail: false,
      coverage: false,
      server: true,
      client: true,
      'db-clean': false,
      verbose: false,
    },
    args: {
      paths: [],
    },
  });

  await expect((() => Test.prototype.run.call(command))()).rejects.toThrow(
    /Cannot use `--server` and `--client` together/,
  );
});

test('destroy removes docker app runtime, built-in db runtime, storage data, and env config', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        storagePath: './docker-local/storage',
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-docker-local-postgres');

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      force: true,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['rm', '-f', 'nb-demo-docker-local-app'],
      {
        errorName: 'docker rm',
        stdio: 'ignore',
      },
    ],
    [
      'docker',
      ['rm', '-f', 'nb-demo-docker-local-postgres'],
      {
        errorName: 'docker rm',
        stdio: 'ignore',
      },
    ],
    [
      'docker',
      ['network', 'rm', 'nb-demo'],
      {
        errorName: 'docker network rm',
        stdio: 'ignore',
      },
    ],
  ]);
  expect(mocks.fsRm.mock.calls).toEqual([
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/nginx/docker-local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/caddy/docker-local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/docker-local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), './docker-local/storage'), { recursive: true, force: true }],
  ]);
  expect(mocks.removeEnv.mock.calls).toEqual([['docker-local']]);
  expect(mocks.inputPrompt).not.toHaveBeenCalled();
});

test('destroy removes managed local app files for downloaded local envs', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase/source',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        storagePath: './local/storage',
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-local-postgres');

  const command = createCommandHarness({
    flags: {
      env: 'local',
      force: true,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [runtime, ['pm2', 'kill'], { env: MANAGED_APP_PRODUCTION_ENV, stdio: 'ignore' }],
  ]);
  expect(mocks.fsRm.mock.calls).toEqual([
    [path.resolve(resolveCliHomeRoot(), './local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/nginx/local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/caddy/local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/local'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), './local/storage'), { recursive: true, force: true }],
  ]);
  expect(mocks.removeEnv.mock.calls).toEqual([['local']]);
});

test('destroy removes custom local app files along with storage data and env config', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  const runtime = {
    kind: 'local',
    envName: 'local-custom',
    source: 'local',
    projectRoot: '/tmp/nocobase/custom',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appRootPath: '/tmp/nocobase/custom',
        storagePath: './local-custom/storage',
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'local-custom',
      force: true,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.fsRm.mock.calls).toEqual([
    [path.resolve(resolveCliHomeRoot(), './local-custom'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/nginx/local-custom'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/caddy/local-custom'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/local-custom'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), './local-custom/storage'), { recursive: true, force: true }],
  ]);
  expect(mocks.removeEnv.mock.calls).toEqual([['local-custom']]);
});

test('destroy removes the configured appPath root for local app-path envs', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  const runtime = {
    kind: 'local',
    envName: 'local-app-path',
    source: 'local',
    projectRoot: '/tmp/local-app/source',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appPath: '/tmp/local-app',
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'local-app-path',
      force: true,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.fsRm.mock.calls).toEqual([
    [path.resolve('/tmp/local-app'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/nginx/local-app-path'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/caddy/local-app-path'), { recursive: true, force: true }],
    [path.resolve(resolveCliHomeRoot(), '.nocobase/proxy/local-app-path'), { recursive: true, force: true }],
    [path.resolve('/tmp/local-app/storage'), { recursive: true, force: true }],
  ]);
  expect(mocks.printInfo.mock.calls).toContainEqual([
    'External database resources for "local-app-path" were left untouched.',
  ]);
  expect(mocks.removeEnv.mock.calls).toEqual([['local-app-path']]);
});

test('destroy removes only the saved env config for http envs', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {
      config: {},
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
      force: true,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.run.mock.calls.length).toBe(0);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
  expect(mocks.fsRm.mock.calls.length).toBe(0);
  expect(mocks.removeEnv.mock.calls).toEqual([['remote']]);
});

test('destroy does not remove the saved env config when cleanup fails midway', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  const runtime = {
    kind: 'local',
    envName: 'local-failure',
    source: 'local',
    projectRoot: '/tmp/local-failure/source',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        appRootPath: '/tmp/local-failure',
        storagePath: './local-failure/storage',
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.fsRm.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('rm failed'));

  const command = createCommandHarness({
    flags: {
      env: 'local-failure',
      force: true,
    },
  });

  await expect((() => Destroy.prototype.run.call(command))()).rejects.toThrow(/Couldn't destroy env "local-failure"\./);

  expect(mocks.fsRm.mock.calls.length).toBeGreaterThanOrEqual(2);
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});

test('destroy reports permission fixes when storage data cannot be removed', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  const storagePath = '/home/chenos/test2/storage';
  const resolvedStoragePath = path.resolve(storagePath);
  const storageError = new Error(
    "EACCES: permission denied, unlink '/home/chenos/test2/storage/.license/instance-id'",
  ) as Error & { code: string };
  storageError.code = 'EACCES';

  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'test2',
    source: 'docker',
    containerName: 'nb-demo-test2-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'postgres',
        storagePath,
      },
    },
  });
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-test2-postgres');
  mocks.fsRm
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(storageError);

  const command = createCommandHarness({
    flags: {
      env: 'test2',
      force: true,
    },
  });

  let thrown: Error | undefined;
  try {
    await Destroy.prototype.run.call(command);
  } catch (error: unknown) {
    thrown = error instanceof Error ? error : new Error(String(error));
  }

  expect(thrown?.message).toContain(`Failed to remove storage data for "test2" at "${resolvedStoragePath}".`);
  expect(thrown?.message).toContain(
    'The current user cannot delete one or more files under this path. Files may have been created by a Docker container running as root.',
  );
  if (process.platform === 'win32') {
    expect(thrown?.message).not.toContain('sudo chown -R');
  } else {
    expect(thrown?.message).toContain(`sudo chown -R "$(id -u):$(id -g)" "${resolvedStoragePath}"`);
  }
  expect(thrown?.message).toContain('nb env remove test2 --purge --force');
  expect(thrown?.message).toContain(
    "Original error: EACCES: permission denied, unlink '/home/chenos/test2/storage/.license/instance-id'",
  );
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});

test('destroy requires force in non-interactive mode', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      force: false,
    },
  });
  command.argv = ['--env', 'docker-local'];

  await expect((() => Destroy.prototype.run.call(command))()).rejects.toThrow(
    /Refusing to destroy env "docker-local" without confirmation in non-interactive mode\./,
  );
});

test('destroy requires explicit env selection in non-interactive mode', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      force: true,
    },
  });

  await expect((() => Destroy.prototype.run.call(command))()).rejects.toThrow(
    /Refusing to destroy current env "docker-local" without explicit selection in non-interactive mode\./,
  );
});

test('destroy stops when the confirmation prompt is canceled', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        storagePath: './docker-local/storage',
      },
    },
  });
  mocks.inputPrompt.mockRejectedValue(new Error('canceled'));

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      force: false,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.run.mock.calls.length).toBe(0);
  expect(mocks.fsRm.mock.calls.length).toBe(0);
  expect(mocks.removeEnv.mock.calls.length).toBe(0);
});

test('destroy uses a strong confirmation prompt in interactive mode', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: false,
        storagePath: './docker-local/storage',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      force: false,
    },
  });

  await Destroy.prototype.run.call(command);

  expect(mocks.inputPrompt).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('Type "docker-local" to confirm:'),
      placeholder: 'docker-local',
    }),
  );
  expect(mocks.removeEnv.mock.calls).toEqual([['docker-local']]);
});

test('down routes to app stop with built-in db cleanup and shows a deprecation warning', async () => {
  const { default: Down } = await import('../commands/app/down.js');
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        yes: true,
        verbose: true,
      },
    },
    runCommand,
  );

  await Down.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([['app:stop', ['--env', 'docker-local', '--verbose', '--with-db', '--yes']]]);
  expect(mocks.printWarning).toHaveBeenCalledWith('`nb app down` is deprecated. Use `nb app stop --with-db` instead.');
});

test('down --all routes to app destroy and maps legacy confirmation flags to force', async () => {
  const { default: Down } = await import('../commands/app/down.js');
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        all: true,
        yes: true,
        verbose: true,
      },
    },
    runCommand,
  );

  await Down.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([['app:destroy', ['--env', 'docker-local', '--verbose', '--force']]]);
  expect(mocks.printWarning).toHaveBeenCalledWith(
    '`nb app down --all` is deprecated. Use `nb env remove <name> --purge` instead.',
  );
});

test('down stays available as a hidden compatibility alias', async () => {
  const { default: Down } = await import('../commands/down.js');

  expect(Down.hidden).toBe(true);
  expect(Down.description).toBeDefined();
});

test('destroy stays available as a hidden compatibility alias', async () => {
  const { default: Destroy } = await import('../commands/app/destroy.js');

  expect(Destroy.hidden).toBe(true);
  expect(Destroy.description).toContain('nb env remove <name> --purge');
});

test('upgrade refreshes local npm envs, then restarts them with quickstart', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'alpha',
        appRootPath: '/tmp/nocobase',
        npmRegistry: 'https://registry.npmmirror.com',
        devDependencies: true,
        build: false,
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('local');
  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'local', '--yes']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'npm',
        '--replace',
        '--version',
        'alpha',
        '--output-dir',
        '/tmp/nocobase',
        '--npm-registry',
        'https://registry.npmmirror.com',
        '--dev-dependencies',
        '--no-build',
      ],
    ],
    ['license:plugins:sync', ['--env', 'local', '--yes', '--skip-if-no-license']],
    ['app:start', ['--env', 'local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['local']],
  ]);
  expect(mocks.upsertEnv).not.toHaveBeenCalled();
  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "local" at http://127.0.0.1:13000/.',
  ]);
});

test('upgrade prints the resolved public app url for local envs', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://192.168.1.10:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'alpha',
        appRootPath: '/tmp/nocobase',
        npmRegistry: 'https://registry.npmmirror.com',
        devDependencies: true,
        build: false,
      },
    },
  });
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "local" at http://192.168.1.10:13000/.',
  ]);
});

test('upgrade uses --version for local npm envs and saves it on success', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'alpha',
        appRootPath: '/tmp/nocobase',
        npmRegistry: 'https://registry.npmmirror.com',
        devDependencies: true,
        build: false,
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        version: 'beta',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'local', '--yes']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'npm',
        '--replace',
        '--version',
        'beta',
        '--output-dir',
        '/tmp/nocobase',
        '--npm-registry',
        'https://registry.npmmirror.com',
        '--dev-dependencies',
        '--no-build',
      ],
    ],
    ['license:plugins:sync', ['--env', 'local', '--yes', '--skip-if-no-license', '--version', 'beta']],
    ['app:start', ['--env', 'local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['local']],
  ]);
  expect(mocks.upsertEnv).toHaveBeenCalledWith('local', {
    downloadVersion: 'beta',
    appRootPath: '/tmp/nocobase',
    npmRegistry: 'https://registry.npmmirror.com',
    devDependencies: true,
    build: false,
  });
});

test('upgrade forwards saved hook script lifecycle context to source refresh and app start', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      appPath: '/tmp/app',
      sourcePath: '/tmp/nocobase',
      storagePath: '/tmp/app/storage',
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'alpha',
        appRootPath: '/tmp/nocobase',
        hookScript: '.nb/hooks.mjs',
      },
    },
  });
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls[1]).toEqual([
    'source:download',
    [
      '-y',
      '--no-intro',
      '--source',
      'npm',
      '--replace',
      '--version',
      'alpha',
      '--output-dir',
      '/tmp/nocobase',
      '--hook-script',
      '/tmp/app/.nb/hooks.mjs',
      '--hook-phase',
      'upgrade',
      '--hook-command',
      'app:upgrade',
      '--hook-env-name',
      'local',
      '--hook-app-path',
      '/tmp/app',
      '--hook-storage-path',
      '/tmp/app/storage',
    ],
  ]);
  expect(runCommand.mock.calls[3]).toEqual([
    'app:start',
    ['--env', 'local', '--yes', '--quickstart', '--no-sync-licensed-plugins', '--hook-command', 'app:upgrade'],
  ]);
});

test('upgrade forwards --verbose to local source refresh and local runtime commands', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'fix-storage-plugin-dev',
        appRootPath: '/tmp/nocobase',
        gitUrl: 'git@github.com:nocobase/nocobase.git',
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => ({ projectRoot: '/tmp/nocobase' }));

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        verbose: true,
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'local', '--yes', '--verbose']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'git',
        '--replace',
        '--verbose',
        '--version',
        'fix-storage-plugin-dev',
        '--output-dir',
        '/tmp/nocobase',
        '--git-url',
        'git@github.com:nocobase/nocobase.git',
      ],
    ],
    ['license:plugins:sync', ['--env', 'local', '--yes', '--skip-if-no-license', '--verbose']],
    ['app:start', ['--env', 'local', '--yes', '--verbose', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['local', '--verbose']],
  ]);
});

test('upgrade enables --verbose by default', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  expect(Upgrade.flags.verbose.default).toBe(true);
});

test('upgrade skips download for local app-path envs and still restarts with quickstart', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local-app',
    source: 'local',
    projectRoot: '/tmp/local-app',
    env: {
      baseUrl: 'http://127.0.0.1:14000/api',
      appPort: 14000,
      envVars: { APP_PORT: '14000' },
      config: {
        appRootPath: '/tmp/local-app',
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'local-app',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'local-app', '--yes']],
    ['license:plugins:sync', ['--env', 'local-app', '--yes', '--skip-if-no-license']],
    ['app:start', ['--env', 'local-app', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['local-app']],
  ]);
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Skipping source download for "local-app" because this env is managed from an existing local app path.'],
  ]);
});

test('upgrade rejects --version for local app-path envs', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local-app',
    source: 'local',
    projectRoot: '/tmp/local-app',
    env: {
      baseUrl: 'http://127.0.0.1:14000/api',
      appPort: 14000,
      envVars: { APP_PORT: '14000' },
      config: {
        appRootPath: '/tmp/local-app',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local-app',
      version: 'beta',
    },
  });

  await expect(Upgrade.prototype.run.call(command)).rejects.toThrow(/does not support `nb app upgrade --version`/i);
});

test('upgrade asks for confirmation in interactive terminals when --force is omitted', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(mocks.crossEnvConfirm.mock.calls.at(-1)).toEqual([
    {
      message:
        'Upgrade "docker-local"? This will stop and restart the app, update the saved source or image, and may run upgrade migrations.',
      default: false,
    },
  ]);
  expect(runCommand.mock.calls[0]).toEqual(['app:stop', ['--env', 'docker-local', '--yes']]);
});

test('upgrade requires --force in non-interactive mode and preserves the rerun command flags', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      'skip-download': true,
      version: 'beta',
      verbose: true,
    },
  });

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(
    /needs confirmation in non-interactive mode before upgrading "docker-local".*nb app upgrade --env docker-local --skip-download --version beta --verbose --force/s,
  );
});

test('upgrade rejects non-interactive cross-env execution without --yes and --force', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'prod',
    source: 'docker',
    containerName: 'nb-demo-prod-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'beta',
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'prod',
      version: 'beta',
    },
  });
  command.argv = ['--env', 'prod', '--version', 'beta'];

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(
    /will not switch envs automatically and will not add `--yes` or `--force` on your behalf\..*nb app upgrade --env prod --version beta --yes --force/s,
  );
});

test('upgrade rejects non-interactive cross-env execution when only --force is missing', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'prod',
    source: 'docker',
    containerName: 'nb-demo-prod-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'beta',
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'prod',
      yes: true,
      'skip-download': true,
    },
  });
  command.argv = ['--env', 'prod', '--yes', '--skip-download'];

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(
    /will not switch envs automatically and will not add `--force` on your behalf\..*nb app upgrade --env prod --skip-download --yes --force/s,
  );
});

test('upgrade rejects non-interactive cross-env execution when only --yes is missing', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'prod',
    source: 'docker',
    containerName: 'nb-demo-prod-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'beta',
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'prod',
      force: true,
      verbose: true,
    },
  });
  command.argv = ['--env', 'prod', '--force', '--verbose'];

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(
    /will not switch envs automatically and will not add `--yes` on your behalf\..*nb app upgrade --env prod --verbose --yes --force/s,
  );
});

test('upgrade can save --version while skipping download and license sync', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        version: 'beta',
        'skip-download': true,
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.upsertEnv).toHaveBeenCalledWith('docker-local', {
    dockerRegistry: 'nocobase/nocobase',
    downloadVersion: 'beta',
  });
  expect(mocks.printInfo.mock.calls).toContainEqual(['Skipping source download for "docker-local" (--skip-download).']);
  expect(mocks.printInfo.mock.calls).toContainEqual([
    'Skipping commercial plugin sync for "docker-local" (--skip-download).',
  ]);
});

test('upgrade keeps deprecated --skip-code-update as a hidden compatibility alias', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  expect(Upgrade.flags['skip-code-update']?.hidden).toBe(true);
  expect(Upgrade.flags['skip-code-update']?.deprecated).toBe(true);

  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        version: 'beta',
        'skip-code-update': true,
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.upsertEnv).toHaveBeenCalledWith('docker-local', {
    dockerRegistry: 'nocobase/nocobase',
    downloadVersion: 'beta',
  });
  expect(mocks.printInfo.mock.calls).toContainEqual(['Skipping source download for "docker-local" (--skip-download).']);
  expect(mocks.printInfo.mock.calls).toContainEqual([
    'Skipping commercial plugin sync for "docker-local" (--skip-download).',
  ]);
});

test('upgrade refreshes docker envs, then restarts them through app commands', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        dockerPlatform: 'linux/arm64',
        downloadVersion: 'alpha',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'docker',
        '--replace',
        '--docker-registry',
        'nocobase/nocobase',
        '--version',
        'alpha',
        '--docker-platform',
        'linux/arm64',
      ],
    ],
    ['license:plugins:sync', ['--env', 'docker-local', '--yes', '--skip-if-no-license']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.upsertEnv).not.toHaveBeenCalled();
  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "docker-local" at http://127.0.0.1:13000/.',
  ]);
});

test('upgrade prints the resolved public app url for docker envs', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://192.168.1.10:13000/console/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
        appPublicPath: '/console/',
      },
    },
  });
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "docker-local" at http://192.168.1.10:13000/console/.',
  ]);
});

test('upgrade uses --version for docker envs and saves it on success', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        dockerPlatform: 'linux/arm64',
        downloadVersion: 'alpha',
        storagePath: '/tmp/storage/local',
        appKey: 'app-key',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        version: 'beta',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'docker',
        '--replace',
        '--docker-registry',
        'nocobase/nocobase',
        '--version',
        'beta',
        '--docker-platform',
        'linux/arm64',
      ],
    ],
    ['license:plugins:sync', ['--env', 'docker-local', '--yes', '--skip-if-no-license', '--version', 'beta']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.upsertEnv).toHaveBeenCalledWith('docker-local', {
    dockerRegistry: 'nocobase/nocobase',
    dockerPlatform: 'linux/arm64',
    downloadVersion: 'beta',
    storagePath: '/tmp/storage/local',
    appKey: 'app-key',
    timezone: 'Asia/Shanghai',
    dbDialect: 'postgres',
    dbHost: 'nb-demo-postgres',
    dbPort: '5432',
    dbDatabase: 'nocobase',
    dbUser: 'nocobase',
    dbPassword: 'nocobase',
  });
});

test('upgrade forwards --verbose to docker source refresh and docker runtime commands', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        dockerPlatform: 'linux/arm64',
        downloadVersion: 'fix-storage-plugin-dev',
        storagePath: '/tmp/storage/local',
        appKey: 'app-key',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        verbose: true,
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes', '--verbose']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--verbose',
        '--source',
        'docker',
        '--replace',
        '--docker-registry',
        'nocobase/nocobase',
        '--version',
        'fix-storage-plugin-dev',
        '--docker-platform',
        'linux/arm64',
      ],
    ],
    ['license:plugins:sync', ['--env', 'docker-local', '--yes', '--skip-if-no-license', '--verbose']],
    ['app:start', ['--env', 'docker-local', '--yes', '--verbose', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local', '--verbose']],
  ]);
});

test('upgrade can restart docker envs without pulling a new image', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
        storagePath: '/tmp/storage/local',
        appKey: 'app-key',
        timezone: 'Asia/Shanghai',
        dbDialect: 'postgres',
        dbHost: 'nb-demo-postgres',
        dbPort: '5432',
        dbDatabase: 'nocobase',
        dbUser: 'nocobase',
        dbPassword: 'nocobase',
      },
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => 'ok',
    })),
  );
  mocks.startDockerContainer.mockResolvedValue('started');
  const runCommand = vi.fn(async () => undefined);

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
        'skip-download': true,
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.upsertEnv).not.toHaveBeenCalled();
  expect(mocks.printInfo.mock.calls).toContainEqual(['Skipping source download for "docker-local" (--skip-download).']);
  expect(mocks.printInfo.mock.calls).toContainEqual([
    'Skipping commercial plugin sync for "docker-local" (--skip-download).',
  ]);
});

test('upgrade warns when env update fails after a successful restart', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      config: {
        dockerRegistry: 'nocobase/nocobase',
        downloadVersion: 'alpha',
      },
    },
  });
  const runCommand = vi.fn(async (id: string) => {
    if (id === 'env:update') {
      throw new Error('swagger refresh failed');
    }
    return undefined;
  });

  const command = createCommandHarness(
    {
      flags: {
        env: 'docker-local',
      },
    },
    runCommand,
  );

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'docker-local', '--yes']],
    [
      'source:download',
      [
        '-y',
        '--no-intro',
        '--source',
        'docker',
        '--replace',
        '--docker-registry',
        'nocobase/nocobase',
        '--version',
        'alpha',
      ],
    ],
    ['license:plugins:sync', ['--env', 'docker-local', '--yes', '--skip-if-no-license']],
    ['app:start', ['--env', 'docker-local', '--yes', '--quickstart', '--no-sync-licensed-plugins']],
    ['env:update', ['docker-local']],
  ]);
  expect(mocks.printWarning).toHaveBeenCalledWith(
    expect.stringContaining('Run `nb env update docker-local` to refresh it manually.'),
  );
  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "docker-local" at http://127.0.0.1:13000/.',
  ]);
});

test('upgrade requires saved downloadVersion for managed npm envs when --version is omitted', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        appRootPath: '/tmp/nocobase',
      },
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await expect(Upgrade.prototype.run.call(command)).rejects.toThrow(/does not have a saved `downloadVersion`/i);
});

test('upgrade does not save --version when local refresh fails', async () => {
  const { default: Upgrade } = await import('../commands/app/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
    env: {
      baseUrl: 'http://127.0.0.1:13000/api',
      appPort: 13000,
      envVars: { APP_PORT: '13000' },
      config: {
        downloadVersion: 'alpha',
        appRootPath: '/tmp/nocobase',
      },
    },
  });
  const runCommand = vi.fn(async (id: string) => {
    if (id === 'source:download') {
      throw new Error('download failed');
    }
    return undefined;
  });

  const command = createCommandHarness(
    {
      flags: {
        env: 'local',
        version: 'beta',
      },
    },
    runCommand,
  );

  await expect(Upgrade.prototype.run.call(command)).rejects.toThrow(/couldn't refresh nocobase/i);
  expect(runCommand.mock.calls).toEqual([
    ['app:stop', ['--env', 'local', '--yes']],
    [
      'source:download',
      ['-y', '--no-intro', '--source', 'npm', '--replace', '--version', 'beta', '--output-dir', '/tmp/nocobase'],
    ],
  ]);
  expect(mocks.upsertEnv).not.toHaveBeenCalled();
});

test('pm enable routes docker envs to docker exec nocobase pm enable', async () => {
  const { default: PmEnable } = await import('../commands/plugin/enable.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({
    args: {
      packages: ['@nocobase/plugin-sample'],
    },
    flags: {
      env: 'docker-local',
    },
  });

  await PmEnable.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('docker-local');
  expect(mocks.runDockerNocoBaseCommand.mock.calls).toEqual([
    ['nb-demo-docker-local-app', ['pm', 'enable', '@nocobase/plugin-sample']],
  ]);
});

test('pm disable routes local envs to the local nocobase command', async () => {
  const { default: PmDisable } = await import('../commands/plugin/disable.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  });

  const command = createCommandHarness({
    args: {
      packages: ['@nocobase/plugin-a', '@nocobase/plugin-b'],
    },
    flags: {
      env: 'dev',
    },
  });

  await PmDisable.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('dev');
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(1);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName).toBe('dev');
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual([
    'pm',
    'disable',
    '@nocobase/plugin-a',
    '@nocobase/plugin-b',
  ]);
});

test('pm enable keeps API fallback for http envs and forwards the resolved env', async () => {
  const { default: PmEnable } = await import('../commands/plugin/enable.js');
  const restoreTerminal = setTerminalInteractivity(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      args: {
        packages: ['@nocobase/plugin-sample'],
      },
      flags: {
        env: 'remote',
        yes: true,
      },
    },
    runCommand,
  );
  command.argv = ['--env', 'remote', '--yes', '@nocobase/plugin-sample'];

  try {
    await PmEnable.prototype.run.call(command);

    expect(runCommand.mock.calls).toEqual([
      ['api:pm:enable', ['--await-response', '--filter-by-tk', '@nocobase/plugin-sample', '--env', 'remote', '--yes']],
    ]);
  } finally {
    restoreTerminal();
  }
});

test('dev runs local npm/git source envs with a generated port when --port is omitted', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  const runtime = {
    kind: 'local',
    envName: 'dev',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: {
        APP_PORT: '13000',
      },
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      'db-sync': true,
      client: true,
      inspect: '9229',
    },
  });

  await Dev.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([
    ['Starting NocoBase dev mode for "dev" from /tmp/nocobase. Press Ctrl+C to stop.'],
  ]);
  expect(mocks.startTask.mock.calls).toEqual([['Running local postinstall for "dev"...']]);
  expect(mocks.succeedTask.mock.calls).toEqual([['Local postinstall finished for "dev".']]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [runtime, ['postinstall'], { stdio: 'inherit' }],
    [
      runtime,
      ['dev', '--rsbuild', '--db-sync', '--port', '5544', '--client', '--inspect', '9229'],
      { stdio: 'inherit' },
    ],
  ]);
  expect(mocks.findAvailableTcpPort.mock.calls.length).toBe(1);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('dev uses an explicit port instead of the saved app port', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  const projectRoot = await createNpmSourceProject(
    {
      dependencies: {
        '@nocobase/app': '2.1.10',
      },
      devDependencies: {
        '@nocobase/devtools': '2.1.10',
      },
    },
    { devtoolsInstalled: true },
  );
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot,
    env: {
      appPort: 13000,
      envVars: {},
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      port: '12000',
      server: true,
    },
  });

  await Dev.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['dev', '--rsbuild', '--port', '12000', '--server']);
  expect(mocks.findAvailableTcpPort.mock.calls.length).toBe(0);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('dev adds devtools and installs dependencies for npm source envs', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  const projectRoot = await createNpmSourceProject({
    dependencies: {
      '@nocobase/app': '2.1.10',
    },
  });
  const runtime = {
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot,
    env: {
      appPort: 13000,
      envVars: {},
      config: {
        npmRegistry: 'https://registry.npmmirror.com',
      },
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      port: '12000',
    },
  });

  await Dev.prototype.run.call(command);

  const packageJson = await readProjectPackageJson(projectRoot);
  expect(packageJson.devDependencies).toEqual({
    '@nocobase/devtools': '2.1.10',
  });
  expect(mocks.run.mock.calls).toEqual([
    [
      'yarn',
      ['install'],
      {
        cwd: projectRoot,
        env: {
          npm_config_registry: 'https://registry.npmmirror.com',
        },
        errorName: 'yarn install',
        stdio: 'inherit',
      },
    ],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['postinstall']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual(['dev', '--rsbuild', '--port', '12000']);
});

test('dev installs dependencies when npm source devtools is declared but missing from node_modules', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  const projectRoot = await createNpmSourceProject({
    dependencies: {
      '@nocobase/app': '2.1.10',
    },
    devDependencies: {
      '@nocobase/devtools': '2.1.9',
    },
  });
  const runtime = {
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot,
    env: {
      appPort: 13000,
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      port: '12000',
    },
  });

  await Dev.prototype.run.call(command);

  const packageJson = await readProjectPackageJson(projectRoot);
  expect(packageJson.devDependencies).toEqual({
    '@nocobase/devtools': '2.1.9',
  });
  expect(mocks.run.mock.calls[0]).toEqual([
    'yarn',
    ['install'],
    {
      cwd: projectRoot,
      env: undefined,
      errorName: 'yarn install',
      stdio: 'inherit',
    },
  ]);
});

test('dev stops when npm source dependency installation fails', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  const projectRoot = await createNpmSourceProject({
    dependencies: {
      '@nocobase/app': '2.1.10',
    },
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot,
    env: {
      appPort: 13000,
      envVars: {},
    },
  });
  mocks.run.mockRejectedValueOnce(new Error('install failed'));

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      port: '12000',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /Couldn't start dev mode for "dev".*Couldn't prepare source dev dependencies.*@nocobase\/devtools.*yarn install.*install failed/s,
  );
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('dev explains when the app is already running on the target port', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: {},
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'ok',
    })),
  );

  const command = createCommandHarness({
    flags: {
      env: 'dev',
      port: '13000',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /NocoBase is already running for "dev" at http:\/\/127\.0\.0\.1:13000\..*Choose another dev port.*nb app stop --env dev/s,
  );
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('dev rejects docker envs with source-oriented guidance', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /Can't run dev mode for "docker-local".*requires a local npm or Git source directory/s,
  );
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('dev rejects http envs because they have no local source directory', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /Can't run dev mode for "remote".*only has an API connection/s,
  );
});

test('dev explains when the requested env does not exist', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /Env "local53" is not configured in this workspace\..*run `nb init --ui --env local53` first\./s,
  );
});

test('dev rejects cross-env requests in non-interactive agent sessions without --yes', async () => {
  const { default: Dev } = await import('../commands/source/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'prod',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      appPort: 13000,
      envVars: {},
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: false,
      text: async () => 'not ok',
    })),
  );

  const command = createCommandHarness({
    flags: {
      env: 'prod',
      yes: false,
    },
  });
  command.argv = ['--env', 'prod'];

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(
    /Refusing to run against env "prod".*interactive confirmation is unavailable.*re-run the same command with `--env prod --yes` to confirm this one-off cross-env operation\./s,
  );
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('pm list keeps API fallback for http envs', async () => {
  const { default: PmList } = await import('../commands/plugin/list.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'remote',
      },
    },
    runCommand,
  );

  await PmList.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([['api:pm:list', ['--mode=summary']]]);
});

test('pm list forwards explicit env selection to API fallback', async () => {
  const { default: PmList } = await import('../commands/plugin/list.js');
  const restoreTerminal = setTerminalInteractivity(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });
  const runCommand = vi.fn(async () => undefined);
  const command = createCommandHarness(
    {
      flags: {
        env: 'remote',
        yes: true,
      },
    },
    runCommand,
  );
  command.argv = ['--env', 'remote', '--yes'];

  try {
    await PmList.prototype.run.call(command);

    expect(runCommand.mock.calls).toEqual([['api:pm:list', ['--mode=summary', '--env', 'remote', '--yes']]]);
  } finally {
    restoreTerminal();
  }
});

test('v1 forwards passthrough commands to local envs', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({});
  command.argv = ['--env', 'local', 'pm', 'list', '--json'];

  await V1.prototype.run.call(command);

  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('local');
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([[runtime, ['pm', 'list', '--json'], undefined]]);
});

test('v1 defaults to the current env when --env is omitted', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const command = createCommandHarness({});
  command.argv = ['pm', 'list'];

  await V1.prototype.run.call(command);

  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([[undefined]]);
  expect(mocks.announceTargetEnv).toHaveBeenCalledWith('local');
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([[runtime, ['pm', 'list'], undefined]]);
});

test('v1 silent mode suppresses bridge chatter and filters known runtime warnings', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const runtime = {
    kind: 'local',
    envName: 'test3',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);

  const stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  const command = createCommandHarness({});
  command.argv = ['generate-api-key', '-n', 'test1', '-r', 'root', '-u', 'nocobase', '-e', '30d', '--silent'];

  try {
    await V1.prototype.run.call(command);

    expect(mocks.announceTargetEnv).not.toHaveBeenCalled();
    expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(1);
    const forwardedOptions = mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2];
    expect(forwardedOptions).toMatchObject({
      stdio: 'pipe',
      env: {
        LOGGER_SILENT: 'true',
        NODE_NO_WARNINGS: '1',
      },
    });

    forwardedOptions?.onStdout?.('-----BEGIN API KEY-----\n');
    forwardedOptions?.onStderr?.(
      '(node:27271) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.\n',
    );
    forwardedOptions?.onStderr?.('(Use `node --trace-deprecation ...` to show where the warning was created)\n');
    forwardedOptions?.onStderr?.(
      'About to overwrite ArrayBuffer.prototype properties ["sliceToImmutable","immutable","transferToImmutable"]\n',
    );
    forwardedOptions?.onStderr?.('kept stderr line\n');

    expect(stdoutWrite).toHaveBeenCalledWith('-----BEGIN API KEY-----\n');
    expect(stderrWrite.mock.calls).toEqual([['kept stderr line\n']]);
  } finally {
    stdoutWrite.mockRestore();
    stderrWrite.mockRestore();
  }
});

test('v1 supports the `--` separator for docker passthrough commands', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const restoreTerminal = setTerminalInteractivity(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });

  const command = createCommandHarness({});
  command.argv = ['--env', 'docker-local', '--yes', '--', 'pm', 'enable', '@nocobase/plugin-sample', '--yes'];

  try {
    await V1.prototype.run.call(command);

    expect(mocks.announceTargetEnv).toHaveBeenCalledWith('docker-local');
    expect(mocks.runDockerNocoBaseCommand.mock.calls).toEqual([
      ['nb-demo-docker-local-app', ['pm', 'enable', '@nocobase/plugin-sample', '--yes'], undefined],
    ]);
  } finally {
    restoreTerminal();
  }
});

test('v1 rejects http envs because the bridge needs a managed runtime', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const restoreTerminal = setTerminalInteractivity(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({});
  command.argv = ['--env', 'remote', '--yes', 'pm', 'list'];

  try {
    await expect((() => V1.prototype.run.call(command))()).rejects.toThrow(
      /Can't run `nb v1` for "remote" yet\..*only has an API connection.*Use a local or Docker env instead\./s,
    );
    expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
    expect(mocks.runDockerNocoBaseCommand.mock.calls.length).toBe(0);
  } finally {
    restoreTerminal();
  }
});

test('v1 rejects ssh envs as not implemented yet', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  const restoreTerminal = setTerminalInteractivity(true);
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'ssh',
    envName: 'jumpbox',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({});
  command.argv = ['--env', 'jumpbox', '--yes', 'pm', 'list'];

  try {
    await expect((() => V1.prototype.run.call(command))()).rejects.toThrow(
      /Can't run `nb v1` for "jumpbox" yet\..*SSH env support is reserved but not implemented yet\..*Use a local or Docker env right now\./s,
    );
  } finally {
    restoreTerminal();
  }
});

test('v1 rejects cross-env requests in non-interactive agent sessions without --yes', async () => {
  const { default: V1 } = await import('../commands/v1.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'prod',
    source: 'git',
    projectRoot: '/tmp/nocobase',
    env: {
      envVars: {},
    },
  });
  const restoreTerminal = setTerminalInteractivity(false);
  const command = createCommandHarness({});
  command.argv = ['--env', 'prod', 'pm', 'list'];

  try {
    await expect((() => V1.prototype.run.call(command))()).rejects.toThrow(
      /Refusing to run against env "prod".*interactive confirmation is unavailable.*re-run the same command with `--env prod --yes` to confirm this one-off cross-env operation\./s,
    );
    expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
  } finally {
    restoreTerminal();
  }
});
