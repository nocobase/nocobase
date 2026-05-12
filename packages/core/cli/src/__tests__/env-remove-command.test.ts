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
  removeEnv: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(),
  cancel: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  printVerbose: vi.fn(),
  setVerboseMode: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  confirm: mocks.confirm,
  isCancel: mocks.isCancel,
  cancel: mocks.cancel,
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
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
});

test('env remove prints the recalculated current env after removal', async () => {
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

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log,
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvRemove.prototype.run.call(command);

  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Removed env "legacy".',
    'Current env: next',
  ]);
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

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'staging' },
      flags: { yes: false, force: false, verbose: false },
    })),
    log,
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
