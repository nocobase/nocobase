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
  confirm: vi.fn(),
  outro: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  printVerbose: vi.fn(),
  setVerboseMode: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  confirm: mocks.confirm,
  outro: mocks.outro,
  isCancel: mocks.isCancel,
  cancel: mocks.cancel,
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  loadAuthConfig: mocks.loadAuthConfig,
  removeEnv: mocks.removeEnv,
}));

vi.mock('../lib/ui.ts', () => ({
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printVerbose: mocks.printVerbose,
  setVerboseMode: mocks.setVerboseMode,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isCancel.mockReturnValue(false);
  mocks.loadAuthConfig.mockResolvedValue({
    envs: {
      legacy: {},
      staging: {},
      current: {},
    },
  });
});

test('env remove reports the new current env after removing the current env', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName
    .mockResolvedValueOnce('legacy')
    .mockResolvedValueOnce('next');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'next',
    hasEnvs: true,
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.outro).toHaveBeenCalledWith('Removed env "legacy". Switched current env to "next".');
});

test('env remove confirms before removing a non-current env', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).toHaveBeenCalledWith({
    message: 'Remove env "staging"? This only removes the saved CLI env config. It does not clean local app files, containers, or storage data.',
    active: 'Yes',
    inactive: 'No',
    initialValue: false,
  });
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
  expect(mocks.outro).toHaveBeenCalledWith('Removed env "staging".');
});

test('env remove uses p.cancel when the user answers No', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(false);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.cancel).toHaveBeenCalledWith('Canceled.');
  expect(mocks.removeEnv).not.toHaveBeenCalled();
  expect(mocks.outro).not.toHaveBeenCalled();
});

test('env remove uses current env wording when removing the current env', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName
    .mockResolvedValueOnce('legacy')
    .mockResolvedValueOnce('next');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'next',
    hasEnvs: true,
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).toHaveBeenCalledWith({
    message: 'Remove current env "legacy"? This only removes the saved CLI env config. It does not clean local app files, containers, or storage data.',
    active: 'Yes',
    inactive: 'No',
    initialValue: false,
  });
});

test('env remove skips confirmation with --yes', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: true, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
  expect(mocks.outro).toHaveBeenCalledWith('Removed env "staging".');
});

test('env remove keeps --force as a hidden compatibility alias', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.removeEnv.mockResolvedValue({
    removed: 'staging',
    lastEnv: 'current',
    hasEnvs: true,
  });

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: true, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).toHaveBeenCalledWith('staging', expect.any(Object));
  expect(mocks.outro).toHaveBeenCalledWith('Removed env "staging".');
});

test('env remove refuses non-interactive removal without --yes', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('current');
  mocks.isInteractiveTerminal.mockReturnValue(false);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow(
    'Refusing to remove env "staging" without confirmation in non-interactive mode. Re-run with `--yes` to remove only the saved CLI env config.',
  );
  expect(mocks.removeEnv).not.toHaveBeenCalled();
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
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect(EnvRemove.prototype.run.call(command)).rejects.toThrow(
    'Env "missing" is not configured',
  );
  expect(mocks.confirm).not.toHaveBeenCalled();
  expect(mocks.removeEnv).not.toHaveBeenCalled();
});

test('env remove reports when no envs remain', async () => {
  const { default: EnvRemove } = await import('../commands/env/remove.js');
  mocks.getCurrentEnvName.mockResolvedValue('legacy');
  mocks.removeEnv.mockResolvedValue({
    removed: 'legacy',
    lastEnv: 'default',
    hasEnvs: false,
  });
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.confirm.mockResolvedValue(true);

  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log: vi.fn(),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(mocks.outro).toHaveBeenCalledWith('Removed env "legacy". No envs configured.');
});
