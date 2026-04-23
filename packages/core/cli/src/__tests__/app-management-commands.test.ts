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
  startDockerContainer: vi.fn(),
  stopDockerContainer: vi.fn(),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
  printInfo: vi.fn(),
}));

vi.mock('../lib/app-runtime.js', () => ({
  formatMissingManagedAppEnvMessage: mocks.formatMissingManagedAppEnvMessage,
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
  runLocalNocoBaseCommand: mocks.runLocalNocoBaseCommand,
  runDockerNocoBaseCommand: mocks.runDockerNocoBaseCommand,
  startDockerContainer: mocks.startDockerContainer,
  stopDockerContainer: mocks.stopDockerContainer,
}));

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
  printInfo: mocks.printInfo,
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
    ['NocoBase is already running for "local" at http://127.0.0.1:13000. Use `nb stop -e local` before starting it again in the foreground.'],
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

test('upgrade routes docker envs to docker exec nocobase upgrade', async () => {
  const { default: Upgrade } = await import('../commands/upgrade.js');
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
      'skip-code-update': true,
    },
  });

  await Upgrade.prototype.run.call(command);

  assert.deepEqual(mocks.runDockerNocoBaseCommand.mock.calls, [[
    'nb-demo-docker-local-app',
    ['upgrade', '--skip-code-update'],
  ]]);
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
