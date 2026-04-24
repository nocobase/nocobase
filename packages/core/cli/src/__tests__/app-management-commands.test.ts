/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { afterEach, beforeEach, test, vi } from 'vitest';

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
  buildDockerDbContainerName: vi.fn((envName: string, dbDialect: string, workspaceName?: string) =>
    `${workspaceName ?? 'nb-demo'}-${envName}-${dbDialect || 'postgres'}`,
  ),
  startDockerContainer: vi.fn(),
  stopDockerContainer: vi.fn(),
  removeEnv: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
  confirmAction: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  renderTable: vi.fn((headers: string[], rows: string[][]) => [headers.join('|'), ...rows.map((row) => row.join('|'))].join('\n')),
  listEnvs: vi.fn(),
  run: vi.fn(),
  commandSucceeds: vi.fn(),
  commandOutput: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  formatMissingManagedAppEnvMessage: mocks.formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  runLocalNocoBaseCommand: mocks.runLocalNocoBaseCommand,
  runDockerNocoBaseCommand: mocks.runDockerNocoBaseCommand,
  dockerContainerExists: mocks.dockerContainerExists,
  dockerContainerIsRunning: mocks.dockerContainerIsRunning,
  buildDockerDbContainerName: mocks.buildDockerDbContainerName,
  startDockerContainer: mocks.startDockerContainer,
  stopDockerContainer: mocks.stopDockerContainer,
}));

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
  confirmAction: mocks.confirmAction,
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  renderTable: mocks.renderTable,
}));

vi.mock('../lib/run-npm.js', () => ({
  run: mocks.run,
  commandSucceeds: mocks.commandSucceeds,
  commandOutput: mocks.commandOutput,
}));

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
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('fetch failed');
    }),
  );
  mocks.run.mockResolvedValue(undefined);
  mocks.commandSucceeds.mockResolvedValue(true);
  mocks.commandOutput.mockResolvedValue('');
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Starting NocoBase for "local" in the background...'],
  ]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['NocoBase is starting for "local" at http://127.0.0.1:13000.'],
  ]);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 1);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName, 'local');
  assert.deepEqual(
    mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1],
    ['start', '--quickstart', '--port', '13000', '--daemon', '--instances', '2', '--launch-mode', 'pm2'],
  );
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2], {
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

  await assert.rejects(
    () => Start.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --env local53` first\./s,
  );
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

  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['NocoBase is already running for "local" at http://127.0.0.1:13000.'],
  ]);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 0);
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

  assert.deepEqual(mocks.printInfo.mock.calls, [
    ['Starting NocoBase for "local" in the foreground at http://127.0.0.1:13000. Press Ctrl+C to stop.'],
  ]);
  assert.equal(mocks.startTask.mock.calls.length, 0);
  assert.equal(mocks.succeedTask.mock.calls.length, 0);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 1);
  assert.deepEqual(
    mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1],
    ['start', '--port', '13000'],
  );
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2], {
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

  assert.deepEqual(mocks.printInfo.mock.calls, [
    ['NocoBase is already running for "local" at http://127.0.0.1:13000. Use `nb stop --env local` before starting it again in the foreground.'],
  ]);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 0);
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

  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2], {
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

  await assert.rejects(
    () => Start.prototype.run.call(command),
    /Couldn't start NocoBase for "local".*The CLI was not able to start the local npm app successfully\..*Expected app port: 13000\./s,
  );
  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Starting NocoBase for "local" in the background...'],
  ]);
  assert.deepEqual(mocks.failTask.mock.calls, [
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Starting NocoBase for "docker-local"...'],
  ]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['NocoBase is already running for "docker-local".'],
  ]);
  assert.deepEqual(mocks.startDockerContainer.mock.calls, [[
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

  await assert.rejects(
    () => Start.prototype.run.call(command),
    /Can't apply --no-daemon to "docker-local".*only available for local npm\/git installs/s,
  );
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Stopping NocoBase for "docker-local"...'],
  ]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['NocoBase is already stopped for "docker-local".'],
  ]);
  assert.deepEqual(mocks.stopDockerContainer.mock.calls, [[
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

  await assert.rejects(
    () => Stop.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*new NocoBase AI environment.*run `nb init --env local53` first\./s,
  );
});

test('upgrade explains when the requested env does not exist', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await assert.rejects(
    () => Upgrade.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s,
  );
});

test('pm list explains when the requested env does not exist', async () => {
  const { default: PmList } = await import('../commands/pm/list.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await assert.rejects(
    () => PmList.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s,
  );
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Stopping NocoBase for "local"...'],
  ]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['NocoBase has stopped for "local".'],
  ]);
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[2], {
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

  await assert.rejects(
    () => Stop.prototype.run.call(command),
    /Couldn't stop NocoBase for "local".*still available, then try again\..*Details: nocobase command exited with code 1/s,
  );
  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Stopping NocoBase for "local"...'],
  ]);
  assert.deepEqual(mocks.failTask.mock.calls, [
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

  assert.deepEqual(mocks.resolveManagedAppRuntime.mock.calls, [['app1']]);
  assert.deepEqual(mocks.printInfo.mock.calls, [
    ['Showing recent logs for "app1".'],
  ]);
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1], [
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

  assert.deepEqual(mocks.run.mock.calls, [[
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

  await assert.rejects(
    () => Logs.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s,
  );
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

  await assert.rejects(
    () => Logs.prototype.run.call(command),
    /Can't show runtime logs for "remote" from this machine\..*only has an API connection/s,
  );
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

  assert.deepEqual(mocks.listEnvs.mock.calls, [[]]);
  assert.deepEqual(mocks.resolveManagedAppRuntime.mock.calls, [['docker'], ['local'], ['remote']]);
  assert.deepEqual(mocks.buildDockerDbContainerName.mock.calls[0], ['docker', 'postgres', 'nb-demo']);
  assert.deepEqual(mocks.renderTable.mock.calls[0]?.[0], ['Env', 'Source', 'App', 'Database', 'URL']);
  assert.deepEqual(mocks.renderTable.mock.calls[0]?.[1], [
    ['docker', 'docker', 'running', 'stopped', 'http://127.0.0.1:13000'],
    ['local', 'npm', 'running', '-', 'http://127.0.0.1:13001'],
    ['remote', 'remote', 'remote', 'external', 'https://demo.example.com'],
  ]);
  assert.match(String(command.log.mock.calls[0]?.[0] ?? ''), /Env\|Source\|App\|Database\|URL/);
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

  assert.equal(mocks.listEnvs.mock.calls.length, 0);
  assert.deepEqual(mocks.resolveManagedAppRuntime.mock.calls, [['app1']]);
  assert.deepEqual(mocks.renderTable.mock.calls[0]?.[1], [
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

  await assert.rejects(
    () => Ps.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s,
  );
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

  assert.deepEqual(mocks.resolveManagedAppRuntime.mock.calls, [['docker'], ['local'], ['remote']]);
  assert.deepEqual(mocks.buildDockerDbContainerName.mock.calls[0], ['docker', 'postgres', 'nb-demo']);
  assert.deepEqual(mocks.renderTable.mock.calls[0]?.[0], ['Env', 'Type', 'Dialect', 'Status', 'Address']);
  assert.deepEqual(mocks.renderTable.mock.calls[0]?.[1], [
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Starting the built-in database for "app1"...'],
  ]);
  assert.deepEqual(mocks.startDockerContainer.mock.calls, [[
    'nb-demo-app1-postgres',
    { stdio: 'ignore' },
  ]]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
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

  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Stopping the built-in database for "app1"...'],
  ]);
  assert.deepEqual(mocks.stopDockerContainer.mock.calls, [[
    'nb-demo-app1-postgres',
    { stdio: 'inherit' },
  ]]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
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

  assert.deepEqual(mocks.printInfo.mock.calls, [
    ['Showing recent built-in database logs for "app1".'],
  ]);
  assert.deepEqual(mocks.run.mock.calls, [[
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

  await assert.rejects(
    () => DbStart.prototype.run.call(command),
    /does not use a CLI-managed built-in database.*recreate the env with the built-in database option enabled/s,
  );
  assert.equal(mocks.startDockerContainer.mock.calls.length, 0);
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

  await assert.rejects(
    () => DbLogs.prototype.run.call(command),
    /does not use a CLI-managed built-in database.*read logs from here.*recreate the env with the built-in database option enabled/s,
  );
  assert.equal(mocks.run.mock.calls.length, 0);
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

  assert.deepEqual(mocks.run.mock.calls, [
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
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 0);
  assert.equal(mocks.removeEnv.mock.calls.length, 0);
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

  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls, [[
    runtime,
    ['pm2', 'kill'],
    { stdio: 'inherit' },
  ]]);
  assert.deepEqual(mocks.run.mock.calls, [[
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

  assert.equal(mocks.confirmAction.mock.calls.length, 1);
  assert.match(String(mocks.confirmAction.mock.calls[0]?.[0] ?? ''), /Delete storage and managed database data/);
  assert.equal(mocks.run.mock.calls.length, 0);
  assert.equal(
    mocks.succeedTask.mock.calls.some((call) =>
      String(call[0]).includes('Storage and managed database data deleted'),
    ),
    true,
  );
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

  assert.deepEqual(mocks.removeEnv.mock.calls, [['docker-local']]);
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

  await assert.rejects(
    () => Down.prototype.run.call(command),
    /Refusing to remove user data for "docker-local" without confirmation/,
  );
  assert.equal(mocks.run.mock.calls.length, 0);
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

  await assert.rejects(
    () => Down.prototype.run.call(command),
    /Can't bring down "remote" from this machine\..*only has an API connection/s,
  );
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

  assert.deepEqual(runCommand.mock.calls, [[
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
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls, [
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
  assert.deepEqual(mocks.succeedTask.mock.calls.at(-1), [
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

  assert.equal(runCommand.mock.calls.length, 0);
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[1]?.[1], [
    'start',
    '--quickstart',
    '--port',
    '14000',
    '--daemon',
  ]);
  assert.deepEqual(mocks.printInfo.mock.calls, [[
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

  assert.deepEqual(runCommand.mock.calls, [[
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
  assert.deepEqual(mocks.stopDockerContainer.mock.calls, [[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  assert.deepEqual(mocks.run.mock.calls, [
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
  assert.deepEqual(mocks.succeedTask.mock.calls.at(-1), [
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

  assert.equal(runCommand.mock.calls.length, 0);
  assert.deepEqual(mocks.stopDockerContainer.mock.calls, [[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  assert.deepEqual(mocks.startDockerContainer.mock.calls, [[
    'nb-demo-docker-local-app',
    { stdio: 'ignore' },
  ]]);
  assert.equal(mocks.run.mock.calls.length, 0);
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

  assert.deepEqual(mocks.runDockerNocoBaseCommand.mock.calls, [[
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

  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 1);
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[0]?.envName, 'dev');
  assert.deepEqual(
    mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1],
    ['pm', 'disable', '@nocobase/plugin-a', '@nocobase/plugin-b'],
  );
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

  assert.deepEqual(mocks.printInfo.mock.calls, [
    ['Starting NocoBase dev mode for "dev" from /tmp/nocobase. Press Ctrl+C to stop.'],
  ]);
  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls, [[
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

  assert.deepEqual(mocks.runLocalNocoBaseCommand.mock.calls[0]?.[1], [
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

  await assert.rejects(
    () => Dev.prototype.run.call(command),
    /NocoBase is already running for "dev" at http:\/\/127\.0\.0\.1:13000\..*nb stop --env dev.*dev port/s,
  );
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 0);
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

  await assert.rejects(
    () => Dev.prototype.run.call(command),
    /Can't run dev mode for "docker-local".*requires a local npm or Git source directory/s,
  );
  assert.equal(mocks.runLocalNocoBaseCommand.mock.calls.length, 0);
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

  await assert.rejects(
    () => Dev.prototype.run.call(command),
    /Can't run dev mode for "remote".*only has an API connection/s,
  );
});

test('dev explains when the requested env does not exist', async () => {
  const { default: Dev } = await import('../commands/dev.js');
  mocks.resolveManagedAppRuntime.mockResolvedValue(undefined);

  const command = createCommandHarness({
    flags: {
      env: 'local53',
    },
  });

  await assert.rejects(
    () => Dev.prototype.run.call(command),
    /Env "local53" is not configured in this workspace\..*run `nb init --env local53` first\./s,
  );
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

  assert.deepEqual(runCommand.mock.calls, [['api:pm:list', ['--mode=summary']]]);
});
