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
  confirmAction: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  printVerbose: vi.fn(),
  setVerboseMode: vi.fn(),
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
  removeEnv: mocks.removeEnv,
}));

vi.mock('../lib/ui.ts', () => ({
  confirmAction: mocks.confirmAction,
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printVerbose: mocks.printVerbose,
  setVerboseMode: mocks.setVerboseMode,
}));

beforeEach(() => {
  vi.clearAllMocks();
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
  mocks.confirmAction.mockResolvedValue(true);

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvRemove.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'legacy' },
      flags: { force: false, verbose: false },
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
