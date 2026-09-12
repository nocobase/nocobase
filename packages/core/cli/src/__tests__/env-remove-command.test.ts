/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  loadAuthConfig: vi.fn(),
  removeEnv: vi.fn(),
  resolveManagedAppRuntime: vi.fn(),
  confirm: vi.fn(),
  input: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  printInfo: vi.fn(),
  printVerbose: vi.fn(),
  setVerboseMode: vi.fn(),
}));

vi.mock('../lib/inquirer.ts', () => ({
  confirm: mocks.confirm,
  input: mocks.input,
}));

vi.mock('../lib/auth-store.js', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  loadAuthConfig: mocks.loadAuthConfig,
  removeEnv: mocks.removeEnv,
}));

vi.mock('../lib/app-runtime.js', () => ({
  resolveManagedAppRuntime: mocks.resolveManagedAppRuntime,
}));

vi.mock('../lib/ui.js', () => ({
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printInfo: mocks.printInfo,
  printVerbose: mocks.printVerbose,
  setVerboseMode: mocks.setVerboseMode,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadAuthConfig.mockResolvedValue({
    envs: {
      legacy: {},
      staging: {},
      current: {},
      remote: {},
    },
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'staging',
    env: {
      config: {},
    },
  });
});

test('env remove reports the new current env after removing the current remote env', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValueOnce('legacy').mockResolvedValueOnce('next');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'next',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'legacy',
    env: {
      config: {},
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(log).toHaveBeenCalledWith('Removed env "legacy". Switched current env to "next".');
});

test('env remove stops managed local runtime resources before removing the env config', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'staging',
    source: 'git',
    projectRoot: '/tmp/staging/source',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const runCommand = vi.fn(async () => undefined);
  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand,
    },
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).toHaveBeenCalledWith({
    message: [
      'Remove env "staging"?',
      'NocoBase and any CLI-managed built-in database for this env will be stopped on this machine.',
      'The saved CLI env config will then be removed. Storage data and local app files will be kept.',
    ].join('\n'),
    default: false,
  });
  expect(runCommand).toHaveBeenCalledWith('app:stop', ['--env', 'staging', '--with-db', '--yes']);
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
  expect(log).toHaveBeenCalledWith('Removed env "staging".');
});

test('env remove does not remove the env config when stopping managed runtime resources fails', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'staging',
    source: 'git',
    projectRoot: '/tmp/staging/source',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const runCommand = vi.fn(async () => {
    throw new Error('app stop failed');
  });
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand,
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow('app stop failed');

  expect(runCommand).toHaveBeenCalledWith('app:stop', ['--env', 'staging', '--with-db', '--yes']);
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});

test('env remove exits quietly when the user answers No', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'staging',
    env: {
      config: {},
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(false);

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.removeEnv).not.toHaveBeenCalled();
  expect(log).not.toHaveBeenCalled();
});

test('env remove uses current env wording when removing the current env', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValueOnce('legacy').mockResolvedValueOnce('next');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'next',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'legacy',
    env: {
      config: {},
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).toHaveBeenCalledWith({
    message: 'Remove current env "legacy"?\nOnly the saved CLI env config will be removed.',
    default: false,
  });
});

test('env remove skips confirmation with --force', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'staging',
    env: {
      config: {},
    },
  });

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: true, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
  expect(command.log).toHaveBeenCalledWith('Removed env "staging".');
});

test('env remove keeps --yes as a hidden compatibility alias', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'staging',
    env: {
      config: {},
    },
  });

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: true, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
});

test('env remove refuses non-interactive removal without --force', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'staging',
    source: 'git',
    projectRoot: '/tmp/staging/source',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow(
    'Refusing to remove env "staging" without confirmation in non-interactive mode.\nRe-run with `--force` to continue.',
  );
  expect(mocks.removeEnv).not.toHaveBeenCalled();
  expect(mocks.confirm).not.toHaveBeenCalled();
});

test('env remove fails before prompting when the env is missing', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.loadAuthConfig.mockResolvedValue({
    envs: {
      current: {},
    },
  });
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.isInteractiveTerminal.mockReturnValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'missing' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow('Env "missing" is not configured');
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).not.toHaveBeenCalled();
  expect(mocks.resolveManagedAppRuntime).not.toHaveBeenCalled();
});

test('env remove reports when no envs remain', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('legacy');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'default',
    hasEnvs: false,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'legacy',
    env: {
      config: {},
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(log).toHaveBeenCalledWith('Removed env "legacy". No envs configured.');
});

test('env remove --purge delegates to app destroy for managed envs', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'staging',
    source: 'docker',
    containerName: 'nb-demo-staging-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.input.mockResolvedValue('staging');

  const runCommand = vi.fn(async () => undefined);
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: true, verbose: false },
    })),
    config: {
      runCommand,
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.input).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('Purge env "staging"?'),
      placeholder: 'staging',
    }),
  );
  expect(runCommand).toHaveBeenCalledWith('app:destroy', ['--env', 'staging', '--force']);
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});

test('env remove --purge skips destroy for remote envs and removes only saved env config', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'remote',
    lastEnv: 'current',
    hasEnvs: true,
  });
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'http',
    envName: 'remote',
    env: {
      config: {},
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.input.mockResolvedValue('remote');

  const runCommand = vi.fn(async () => undefined);
  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'remote' },
      flags: { yes: false, force: false, purge: true, verbose: false },
    })),
    config: {
      runCommand,
    },
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(runCommand).not.toHaveBeenCalled();
  expect(mocks.printInfo).toHaveBeenCalledWith(
    'No local CLI-managed resources were found for "remote". Removing the saved CLI env config only.',
  );
  expect(mocks.removeEnv).toHaveBeenCalledWith('remote', expect.any(Object));
  expect(log).toHaveBeenCalledWith('Removed env "remote".');
});

test('env remove --purge refuses non-interactive removal without --force', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'docker',
    envName: 'staging',
    source: 'docker',
    containerName: 'nb-demo-staging-app',
    workspaceName: 'nb-demo',
    dockerNetworkName: 'nb-demo',
    dockerContainerPrefix: 'nb-demo',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: true, verbose: false },
    })),
    config: {
      runCommand: vi.fn(async () => undefined),
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow(
    'Refusing to purge env "staging" without confirmation in non-interactive mode.\nRe-run with `--purge --force` to continue.',
  );
  expect(mocks.removeEnv).not.toHaveBeenCalled();
  expect(mocks.input).not.toHaveBeenCalled();
});

test('env remove stops before removing and does not delete config when stop fails', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.resolveManagedAppRuntime.mockResolvedValue({
    kind: 'local',
    envName: 'staging',
    source: 'git',
    projectRoot: '/tmp/staging/source',
    env: {
      config: {
        builtinDb: true,
      },
    },
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const runCommand = vi.fn(async () => {
    throw new Error('stop failed');
  });
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, purge: false, verbose: false },
    })),
    config: {
      runCommand,
    },
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow('stop failed');
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});
