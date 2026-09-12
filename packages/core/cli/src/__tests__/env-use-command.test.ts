/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  setCurrentEnv: vi.fn(),
  isInteractiveTerminal: vi.fn(),
  printInfo: vi.fn(),
  resolveSessionIdentity: vi.fn(),
}));

vi.mock('../lib/auth-store.ts', () => ({
  setCurrentEnv: mocks.setCurrentEnv,
}));

vi.mock('../lib/ui.ts', () => ({
  isInteractiveTerminal: mocks.isInteractiveTerminal,
  printInfo: mocks.printInfo,
}));

vi.mock('../lib/session-id.ts', () => ({
  resolveSessionIdentity: mocks.resolveSessionIdentity,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('env use prints the session setup tip when no session id is available', async () => {
  const { default: EnvUse } = await import('../commands/env/use.js');
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.resolveSessionIdentity.mockReturnValue(undefined);

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvUse.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'app1' },
    })),
    log,
  });

  await EnvUse.prototype.run.call(command);

  expect(mocks.setCurrentEnv).toHaveBeenCalledWith('app1', { scope: 'global' });
  expect(log.mock.calls.map(([message]) => message)).toEqual([
    'Current env: app1',
    'Session mode is not enabled for the current shell or runtime.',
    'Without session mode, switching the current env here can affect other sessions running in parallel.',
    '',
  ]);
  expect(mocks.printInfo).toHaveBeenCalledWith('Run `nb session setup` to enable session mode for this shell or runtime.');
});

test('env use skips the session setup tip when a session id is already present', async () => {
  const { default: EnvUse } = await import('../commands/env/use.js');
  mocks.isInteractiveTerminal.mockReturnValue(true);
  mocks.resolveSessionIdentity.mockReturnValue({
    id: 'chat-session',
  });

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvUse.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'app1' },
    })),
    log,
  });

  await EnvUse.prototype.run.call(command);

  expect(log.mock.calls).toEqual([['Current env: app1']]);
  expect(mocks.printInfo).not.toHaveBeenCalled();
});
