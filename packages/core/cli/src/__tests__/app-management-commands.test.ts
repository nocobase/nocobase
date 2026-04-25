/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { spawn } from 'node:child_process';
import { afterEach, beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  formatMissingManagedAppEnvMessage: vi.fn((envName?: string) =>
    envName
      ? [
          `Env "${envName}" is not configured in this workspace.`,
          `If you want to create a new NocoBase AI environment, run \`nb init --env ${envName}\` first.`,
        ].join('\n')
      : 'No NocoBase env is configured yet. Run `nb init` to create one first.',
  ),
  resolveManagedAppRuntime: vi.fn(),
  runLocalNocoBaseCommand: vi.fn(),
  runDockerNocoBaseCommand: vi.fn(),
  dockerContainerExists: vi.fn(),
  dockerContainerIsRunning: vi.fn(),
  defaultWorkspaceName: vi.fn((cwd?: string) => {
    const value = String(cwd ?? process.cwd()).replace(/\\/g, '/').split('/').filter(Boolean).at(-1) ?? 'demo';
    return `nb-${value}`;
  }),
  buildDockerDbContainerName: vi.fn((envName: string, dbDialect: string, workspaceName?: string) =>
    `${workspaceName ?? 'nb-demo'}-${envName}-${dbDialect || 'postgres'}`,
  ),
  startDockerContainer: vi.fn(),
  stopDockerContainer: vi.fn(),
  removeEnv: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
  setVerboseMode: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
  confirmAction: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  renderTable: vi.fn((headers: string[], rows: string[][]) => [headers.join('|'), ...rows.map((row) => row.join('|'))].join('\n')),
  listEnvs: vi.fn(),
  run: vi.fn(),
  runNocoBaseCommand: vi.fn(),
  commandSucceeds: vi.fn(),
  commandOutput: vi.fn(),
  resolveProjectCwd: vi.fn((cwd?: string) => cwd ?? process.cwd()),
  findAvailableTcpPort: vi.fn(),
  validateAvailableTcpPort: vi.fn(),
  fsRm: vi.fn(),
  fsMkdir: vi.fn(),
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

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
  setVerboseMode: mocks.setVerboseMode,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
  confirmAction: mocks.confirmAction,
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  renderTable: mocks.renderTable,
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
  runNocoBaseCommand: mocks.runNocoBaseCommand,
  commandSucceeds: mocks.commandSucceeds,
  commandOutput: mocks.commandOutput,
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
    default: {
      ...actual,
      rm: mocks.fsRm,
      mkdir: mocks.fsMkdir,
    },
  };
});

vi.mock('../lib/auth-store.js', () => ({
  removeEnv: mocks.removeEnv,
  listEnvs: mocks.listEnvs,
}));

beforeEach(() => {
  mocks.formatMissingManagedAppEnvMessage.mockImplementation((envName?: string) =>
    envName
      ? [
          `Env "${envName}" is not configured in this workspace.`,
          `If you want to create a new NocoBase AI environment, run \`nb init --env ${envName}\` first.`,
        ].join('\n')
      : 'No NocoBase env is configured yet. Run `nb init` to create one first.',
  );
  mocks.defaultWorkspaceName.mockImplementation((cwd?: string) => {
    const value = String(cwd ?? process.cwd()).replace(/\\/g, '/').split('/').filter(Boolean).at(-1) ?? 'demo';
    return `nb-${value}`;
  });
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
  mocks.resolveProjectCwd.mockImplementation((cwd?: string) => cwd ?? process.cwd());
  mocks.findAvailableTcpPort.mockResolvedValue('5544');
  mocks.validateAvailableTcpPort.mockResolvedValue(undefined);
  mocks.fsRm.mockResolvedValue(undefined);
  mocks.fsMkdir.mockResolvedValue(undefined);
  mocks.childSpawnCalls.length = 0;
  mocks.childOnceHandlers.length = 0;
  vi.mocked(spawn).mockImplementation(
    (command: string, args: string[], options: Record<string, unknown>) => {
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
    },
  );
  mocks.renderTable.mockImplementation((headers: string[], rows: string[][]) => [
    headers.join('|'),
    ...rows.map((row) => row.join('|')),
  ].join('\n'));
  mocks.buildDockerDbContainerName.mockImplementation((envName: string, dbDialect: string, workspaceName?: string) =>
    `${workspaceName ?? 'nb-demo'}-${envName}-${dbDialect || 'postgres'}`,
  );
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.dockerContainerIsRunning.mockResolvedValue(true);
  mocks.listEnvs.mockResolvedValue({
    currentEnv: 'local',
    envs: {},
  });
  mocks.confirmAction.mockResolvedValue(true);
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.removeEnv.mockResolvedValue({
    removed: 'local',
    currentEnv: 'default',
    hasEnvs: false,
  });
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

function createCommandHarness(parseResult: { args?: Record<string, any>; flags?: Record<string, any> }, runCommand?: ReturnType<typeof vi.fn>) {
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

test('start enables daemon by default for npm/git envs', async () => {
  const { default: Start } = await import('../commands/start.js');
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
      instances: 2,
      'launch-mode': 'pm2',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting NocoBase for "local" in the background...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase is starting for "local" at http://127.0.0.1:13000.'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(1);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName).toBe('local');
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['start', '--quickstart', '--port', '13000', '--daemon', '--instances', '2', '--launch-mode', 'pm2']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    stdio: 'ignore',
  });
});

test('start explains when the requested env does not exist', async () => {
  const { default: Start } = await import('../commands/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --env local53` first\./s);
});

test('start reports when the local app is already running', async () => {
  const { default: Start } = await import('../commands/start.js');
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
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'ok',
    })),
  );

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase is already running for "local" at http://127.0.0.1:13000.'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('start supports --no-daemon for npm/git envs', async () => {
  const { default: Start } = await import('../commands/start.js');
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
    ['Starting NocoBase for "local" in the foreground at http://127.0.0.1:13000. Press Ctrl+C to stop.'],
  ]);
  expect(mocks.startTask.mock.calls.length).toBe(0);
  expect(mocks.succeedTask.mock.calls.length).toBe(0);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(1);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['start', '--port', '13000']);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    stdio: 'ignore',
  });
});

test('start foreground mode explains how to restart when the local app is already running', async () => {
  const { default: Start } = await import('../commands/start.js');
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
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'ok',
    })),
  );

  const command = createCommandHarness({
    flags: {
      env: 'local',
      daemon: false,
    },
  });
  command.argv = ['--no-daemon'];

  await Start.prototype.run.call(command);

  expect(mocks.printInfo.mock.calls).toEqual([
    ['NocoBase is already running for "local" at http://127.0.0.1:13000. Use `nb stop --env local` before starting it again in the foreground.'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('start enables raw startup output when --verbose is set', async () => {
  const { default: Start } = await import('../commands/start.js');
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
    stdio: 'inherit',
  });
});

test('start shows product-style local failure guidance instead of raw command errors', async () => {
  const { default: Start } = await import('../commands/start.js');
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
  mocks.runLocalNocoBaseCommand.mockRejectedValue(new Error('nocobase command exited with code 1'));

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  });

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(/Couldn't start NocoBase for "local".*The CLI was not able to start the local npm app successfully\..*Expected app port: 13000\./s);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting NocoBase for "local" in the background...'],
  ]);
  expect(mocks.failTask.mock.calls).toEqual([
    ['Failed to start NocoBase for "local".'],
  ]);
});

test('start accepts docker envs without treating the default daemon flag as explicit input', async () => {
  const { default: Start } = await import('../commands/start.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  mocks.startDockerContainer.mockResolvedValue('already-running');

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      daemon: true,
    },
  });

  await Start.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting NocoBase for "docker-local"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase is already running for "docker-local".'],
  ]);
  expect(mocks.startDockerContainer.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
});

test('start rejects local-only flags for docker envs', async () => {
  const { default: Start } = await import('../commands/start.js');
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

  await expect((() => Start.prototype.run.call(command))()).rejects.toThrow(/Can't apply --no-daemon to "docker-local".*only available for local npm\/git installs/s);
});

test('stop routes docker envs to docker stop', async () => {
  const { default: Stop } = await import('../commands/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
    env: {},
  });
  mocks.stopDockerContainer.mockResolvedValue('already-stopped');

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  });

  await Stop.prototype.run.call(command);

  expect(mocks.startTask.mock.calls).toEqual([
    ['Stopping NocoBase for "docker-local"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase is already stopped for "docker-local".'],
  ]);
  expect(mocks.stopDockerContainer.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
});

test('stop explains when the requested env does not exist', async () => {
  const { default: Stop } = await import('../commands/stop.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Stop.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --env local53` first\./s);
});

test('upgrade explains when the requested env does not exist', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Upgrade.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s);
});

test('pm list explains when the requested env does not exist', async () => {
  const { default: PmList } = await import('../commands/pm/list.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => PmList.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s);
});

test('stop enables raw shutdown output when --verbose is set', async () => {
  const { default: Stop } = await import('../commands/stop.js');
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

  expect(mocks.startTask.mock.calls).toEqual([
    ['Stopping NocoBase for "local"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['NocoBase has stopped for "local".'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2]).toEqual({
    stdio: 'inherit',
  });
});

test('stop shows product-style local failure guidance', async () => {
  const { default: Stop } = await import('../commands/stop.js');
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

  await expect((() => Stop.prototype.run.call(command))()).rejects.toThrow(/Couldn't stop NocoBase for "local".*still available, then try again\..*Details: nocobase command exited with code 1/s);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Stopping NocoBase for "local"...'],
  ]);
  expect(mocks.failTask.mock.calls).toEqual([
    ['Failed to stop NocoBase for "local".'],
  ]);
});

test('logs supports --env and --no-follow for local app logs', async () => {
  const { default: Logs } = await import('../commands/logs.js');
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
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Showing recent logs for "app1".'],
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual([
    'pm2',
    'logs',
    '--lines',
    '50',
    '--nostream',
  ]);
});

test('logs reads docker app logs', async () => {
  const { default: Logs } = await import('../commands/logs.js');
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

  expect(mocks.run.mock.calls).toEqual([[
    'docker',
    ['logs', '--tail', '100', '--follow', 'nb-demo-docker-local-app'],
    {
      errorName: 'docker logs',
      stdio: 'inherit',
    },
  ]]);
});

test('logs explains when the requested env does not exist', async () => {
  const { default: Logs } = await import('../commands/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Logs.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s);
});

test('logs explains remote envs do not have local runtime logs', async () => {
  const { default: Logs } = await import('../commands/logs.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'remote',
    envName: 'remote',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
    },
  });

  await expect((() => Logs.prototype.run.call(command))()).rejects.toThrow(/Can't show runtime logs for "remote" from this machine\..*only has an API connection/s);
});

test('ps lists all configured env runtime statuses', async () => {
  const { default: Ps } = await import('../commands/ps.js');
  mocks.listEnvs.mockResolvedValue({
    currentEnv: 'local',
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
            appPort: 13000,
            builtinDb: true,
            dbDialect: 'postgres',
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
            appPort: 13001,
            builtinDb: false,
          },
        },
      };
    }
    return {
      kind: 'remote',
      envName: 'remote',
      source: undefined,
      env: {
        config: {
          baseUrl: 'https://demo.example.com/api',
        },
      },
    };
  });
  mocks.dockerContainerIsRunning.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      text: async () => 'ok',
    })),
  );

  const command = createCommandHarness({
    flags: {},
  });

  await Ps.prototype.run.call(command);

  expect(mocks.listEnvs.mock.calls).toEqual([[]]);
  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['docker'], ['local'], ['remote']]);
  expect(mocks.buildDockerDbContainerName.mock.calls[0]).toEqual(['docker', 'postgres', 'nb-demo']);
  expect(mocks.renderTable.mock.calls[0]?.[0]).toEqual(['Env', 'Source', 'App', 'Database', 'URL']);
  expect(mocks.renderTable.mock.calls[0]?.[1]).toEqual([
    ['docker', 'docker', 'running', 'stopped', 'http://127.0.0.1:13000'],
    ['local', 'npm', 'running', '-', 'http://127.0.0.1:13001'],
    ['remote', 'remote', 'remote', 'external', 'https://demo.example.com'],
  ]);
  expect(String(command.log.mock.calls[0]?.[0] ?? '')).toMatch(/Env\|Source\|App\|Database\|URL/);
});

test('ps supports --env without listing all envs first', async () => {
  const { default: Ps } = await import('../commands/ps.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'app1',
    source: 'docker',
    containerName: 'nb-demo-app1-app',
    workspaceName: 'nb-demo',
    env: {
      config: {
        appPort: 13000,
        builtinDb: false,
      },
    },
  });
  mocks.dockerContainerExists.mockResolvedValue(true);
  mocks.dockerContainerIsRunning.mockResolvedValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'app1',
    },
  });

  await Ps.prototype.run.call(command);

  expect(mocks.listEnvs.mock.calls.length).toBe(0);
  expect(mocks.resolveManagedAppRuntime.mock.calls).toEqual([['app1']]);
  expect(mocks.renderTable.mock.calls[0]?.[1]).toEqual([
    ['app1', 'docker', 'stopped', '-', 'http://127.0.0.1:13000'],
  ]);
});

test('ps explains when the requested env does not exist', async () => {
  const { default: Ps } = await import('../commands/ps.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Ps.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s);
});

test('db ps lists all configured database runtime statuses', async () => {
  const { default: DbPs } = await import('../commands/db/ps.js');
  mocks.listEnvs.mockResolvedValue({
    currentEnv: 'local',
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
      kind: 'remote',
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
    ['remote', 'remote', 'mysql', 'remote', ''],
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

  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting the built-in database for "app1"...'],
  ]);
  expect(mocks.startDockerContainer.mock.calls).toEqual([[
    'nb-demo-app1-postgres',
    { stdio: 'ignore' },
  ]]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['The built-in database is running for "app1" at 127.0.0.1:5432.'],
  ]);
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

  expect(mocks.startTask.mock.calls).toEqual([
    ['Stopping the built-in database for "app1"...'],
  ]);
  expect(mocks.stopDockerContainer.mock.calls).toEqual([[
    'nb-demo-app1-postgres',
    { stdio: 'inherit' },
  ]]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['The built-in database has stopped for "app1".'],
  ]);
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

  expect(mocks.printInfo.mock.calls).toEqual([
    ['Showing recent built-in database logs for "app1".'],
  ]);
  expect(mocks.run.mock.calls).toEqual([[
    'docker',
    ['logs', '--tail', '50', 'nb-demo-app1-postgres'],
    {
      errorName: 'docker logs',
      stdio: 'inherit',
    },
  ]]);
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

  await expect((() => DbStart.prototype.run.call(command))()).rejects.toThrow(/does not use a CLI-managed built-in database.*recreate the env with the built-in database option enabled/s);
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

  await expect((() => DbLogs.prototype.run.call(command))()).rejects.toThrow(/does not use a CLI-managed built-in database.*read logs from here.*recreate the env with the built-in database option enabled/s);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('test recreates the built-in test database before running tests', async () => {
  const { default: Test } = await import('../commands/test.js');
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
        '--restart',
        'always',
        '--network',
        'nb-app2',
        '-e',
        'POSTGRES_USER=nocobase',
        '-e',
        'POSTGRES_DB=nocobase-test',
        '-e',
        'POSTGRES_PASSWORD=nocobase',
        '-v',
        '/tmp/app2/storage/test/db/postgres:/var/lib/postgresql/data',
        '-p',
        '5433:5432',
        'postgres:16',
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
  expect(mocks.fsRm.mock.calls[0]).toEqual([
    '/tmp/app2/storage/test',
    { recursive: true, force: true },
  ]);
  expect(mocks.fsMkdir.mock.calls[0]).toEqual([
    '/tmp/app2/storage/test/db/postgres',
    { recursive: true },
  ]);
  expect(mocks.succeedTask.mock.calls[0]).toEqual([
    'The built-in test database is ready at 127.0.0.1:5433.',
  ]);
  expect(mocks.childSpawnCalls[0]).toMatchObject({
    command: process.execPath,
    args: [
      expect.stringContaining('/node_modules/tsx/dist/cli.mjs'),
      expect.stringContaining('/packages/core/test/src/scripts/test-db-creator.ts'),
    ],
  });
  expect(mocks.childSpawnCalls[0]?.options?.env).toMatchObject({
    TZ: 'UTC',
    DB_TEST_DISTRIBUTOR_PORT: '23450',
    DB_TEST_PREFIX: 'test',
  });
});

test('test injects DB_* and STORAGE_PATH into nocobase test', async () => {
  const { default: Test } = await import('../commands/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<typeof vi.fn>;

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
          STORAGE_PATH: '/tmp/app2/storage/test',
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
  const { default: Test } = await import('../commands/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<typeof vi.fn>;

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
        STORAGE_PATH: '/tmp/app2/storage/test',
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
    [
      'test',
      'packages/core/client/src/foo.test.tsx',
      '--run',
      '--allowOnly',
      '--bail',
      '--client',
    ],
    {
      cwd: '/tmp/app2',
      env: {
        APP_ENV_PATH: '.env',
        STORAGE_PATH: '/tmp/app2/storage/test',
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
  const { default: Test } = await import('../commands/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<typeof vi.fn>;
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
  const { default: Test } = await import('../commands/test.js');
  const runNocoBaseCommandMock = (await import('../lib/run-npm.js')).runNocoBaseCommand as unknown as ReturnType<typeof vi.fn>;

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

  expect(mocks.run.mock.calls.at(-1)).toEqual([
    'docker',
    expect.arrayContaining(['-p', '3307:3306', 'mysql:8']),
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
  const { default: Test } = await import('../commands/test.js');

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
  const { default: Test } = await import('../commands/test.js');

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

  await expect((() => Test.prototype.run.call(command))()).rejects.toThrow(/Cannot use `--server` and `--client` together/);
});

test('down removes docker app and built-in database containers by default', async () => {
  const { default: Down } = await import('../commands/down.js');
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
    },
  });

  await Down.prototype.run.call(command);

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
  ]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
  expect(mocks.removeEnv.mock.calls.length).toBe(0);
});

test('down stops local apps and removes the built-in database container when configured', async () => {
  const { default: Down } = await import('../commands/down.js');
  const runtime = {
    kind: 'local',
    envName: 'local',
    source: 'npm',
    projectRoot: '/tmp/nocobase/source',
    workspaceName: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
        dbDialect: 'mysql',
        storagePath: './local/storage',
      },
      envVars: {},
    },
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.buildDockerDbContainerName.mockReturnValue('nb-demo-local-mysql');

  const command = createCommandHarness({
    flags: {
      env: 'local',
      verbose: true,
    },
  });

  await Down.prototype.run.call(command);

  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([[
    runtime,
    ['pm2', 'kill'],
    { stdio: 'inherit' },
  ]]);
  expect(mocks.run.mock.calls).toEqual([[
    'docker',
    ['rm', '-f', 'nb-demo-local-mysql'],
    {
      errorName: 'docker rm',
      stdio: 'ignore',
    },
  ]]);
});

test('down confirms before removing user data', async () => {
  const { default: Down } = await import('../commands/down.js');
  const runtime = {
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
  };
  mocks.resolveManagedAppRuntime.mockResolvedValue(runtime);
  mocks.commandSucceeds.mockResolvedValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      'remove-data': true,
    },
  });

  await Down.prototype.run.call(command);

  expect(mocks.confirmAction.mock.calls.length).toBe(1);
  expect(String(mocks.confirmAction.mock.calls[0]?.[0] ?? '')).toMatch(/Delete storage and managed database data/);
  expect(mocks.run.mock.calls.length).toBe(0);
  expect(mocks.succeedTask.mock.calls.some((call) =>
      String(call[0]).includes('Storage and managed database data deleted'),
    )).toBe(true);
});

test('down can remove CLI env config when requested', async () => {
  const { default: Down } = await import('../commands/down.js');
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
  mocks.commandSucceeds.mockResolvedValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      'remove-env': true,
    },
  });

  await Down.prototype.run.call(command);

  expect(mocks.removeEnv.mock.calls).toEqual([['docker-local']]);
});

test('down refuses to remove data without confirmation in non-interactive mode', async () => {
  const { default: Down } = await import('../commands/down.js');
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
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      'remove-data': true,
    },
  });

  await expect((() => Down.prototype.run.call(command))()).rejects.toThrow(/Refusing to remove user data for "docker-local" without confirmation/);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('down explains remote envs do not have local runtime resources', async () => {
  const { default: Down } = await import('../commands/down.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'remote',
    envName: 'remote',
    source: undefined,
    env: {
      config: {},
    },
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
    },
  });

  await expect((() => Down.prototype.run.call(command))()).rejects.toThrow(/Can't bring down "remote" from this machine\..*only has an API connection/s);
});

test('upgrade refreshes local npm envs, then restarts them with quickstart', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
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

  const command = createCommandHarness({
    flags: {
      env: 'local',
    },
  }, runCommand);

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([[
    'download',
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
  ]]);
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([
    [
      {
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
      },
      ['pm2', 'kill'],
      { stdio: 'ignore' },
    ],
    [
      {
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
      },
      ['start', '--quickstart', '--port', '13000', '--daemon'],
      { stdio: 'ignore' },
    ],
  ]);
  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "local" at http://127.0.0.1:13000.',
  ]);
});

test('upgrade skips download for local app-path envs and still restarts with quickstart', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
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

  const command = createCommandHarness({
    flags: {
      env: 'local-app',
    },
  }, runCommand);

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls.length).toBe(0);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1]).toEqual([
    'start',
    '--quickstart',
    '--port',
    '14000',
    '--daemon',
  ]);
  expect(mocks.printInfo.mock.calls).toEqual([[
    'Skipping code download for "local-app" because this env is managed from an existing local app path.',
  ]]);
});

test('upgrade refreshes docker envs by pulling the image and recreating the container', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
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

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
    },
  }, runCommand);

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls).toEqual([[
    'download',
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
  ]]);
  expect(mocks.stopDockerContainer.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  expect(mocks.run.mock.calls).toEqual([
    [
      'docker',
      ['rm', '-f', 'nb-demo-docker-local-app'],
      { errorName: 'docker rm', stdio: 'ignore' },
    ],
    [
      'docker',
      [
        'run',
        '-d',
        '--name',
        'nb-demo-docker-local-app',
        '--restart',
        'always',
        '--network',
        'nb-demo',
        '-p',
        '13000:80',
        '-e',
        'APP_KEY=app-key',
        '-e',
        'DB_DIALECT=postgres',
        '-e',
        'DB_HOST=nb-demo-postgres',
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
        '/tmp/storage/local:/app/nocobase/storage',
        'nocobase/nocobase:alpha',
      ],
      { errorName: 'docker run', stdio: 'ignore' },
    ],
  ]);
  expect(mocks.succeedTask.mock.calls.at(-1)).toEqual([
    'NocoBase has been upgraded for "docker-local" at http://127.0.0.1:13000.',
  ]);
});

test('upgrade can restart docker envs without pulling a new image', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'docker-local',
    source: 'docker',
    containerName: 'nb-demo-docker-local-app',
    workspaceName: 'nb-demo',
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

  const command = createCommandHarness({
    flags: {
      env: 'docker-local',
      'skip-code-update': true,
    },
  }, runCommand);

  await Upgrade.prototype.run.call(command);

  expect(runCommand.mock.calls.length).toBe(0);
  expect(mocks.stopDockerContainer.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  expect(mocks.startDockerContainer.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  expect(mocks.run.mock.calls.length).toBe(0);
});

test('pm enable routes docker envs to docker exec nocobase pm enable', async () => {
  const { default: PmEnable } = await import('../commands/pm/enable.js');
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

  expect(mocks.runDockerNocoBaseCommand.mock.calls).toEqual([[
    'nb-demo-docker-local-app',
    ['pm', 'enable', '@nocobase/plugin-sample'],
  ]]);
});

test('pm disable routes local envs to the local nocobase command', async () => {
  const { default: PmDisable } = await import('../commands/pm/disable.js');
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

  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(1);
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName).toBe('dev');
  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual(['pm', 'disable', '@nocobase/plugin-a', '@nocobase/plugin-b']);
});

test('dev runs local npm/git source envs with saved env settings', async () => {
  const { default: Dev } = await import('../commands/dev.js');
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
  expect(mocks.runLocalNocoBaseCommand.mock.calls).toEqual([[
    runtime,
    ['dev', '--rsbuild', '--db-sync', '--port', '13000', '--client', '--inspect', '9229'],
    { stdio: 'inherit' },
  ]]);
});

test('dev uses an explicit port instead of the saved app port', async () => {
  const { default: Dev } = await import('../commands/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'dev',
    source: 'npm',
    projectRoot: '/tmp/nocobase',
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

  expect(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1]).toEqual([
    'dev',
    '--rsbuild',
    '--port',
    '12000',
    '--server',
  ]);
});

test('dev explains when the app is already running on the target port', async () => {
  const { default: Dev } = await import('../commands/dev.js');
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
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(/NocoBase is already running for "dev" at http:\/\/127\.0\.0\.1:13000\..*nb stop --env dev.*dev port/s);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('dev rejects docker envs with source-oriented guidance', async () => {
  const { default: Dev } = await import('../commands/dev.js');
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

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(/Can't run dev mode for "docker-local".*requires a local npm or Git source directory/s);
  expect(mocks.runLocalNocoBaseCommand.mock.calls.length).toBe(0);
});

test('dev rejects remote envs because they have no local source directory', async () => {
  const { default: Dev } = await import('../commands/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'remote',
    envName: 'remote',
    source: undefined,
    env: {},
  });

  const command = createCommandHarness({
    flags: {
      env: 'remote',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(/Can't run dev mode for "remote".*only has an API connection/s);
});

test('dev explains when the requested env does not exist', async () => {
  const { default: Dev } = await import('../commands/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await expect((() => Dev.prototype.run.call(command))()).rejects.toThrow(/Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s);
});

test('pm list keeps API fallback for remote envs', async () => {
  const { default: PmList } = await import('../commands/pm/list.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'remote',
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
