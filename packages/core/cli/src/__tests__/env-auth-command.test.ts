/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { test, vi, expect } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentEnvName: vi.fn(),
  authenticateEnvWithOauth: vi.fn(),
  startTask: vi.fn(),
  succeedTask: vi.fn(),
  failTask: vi.fn(),
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
}));

vi.mock('../lib/env-auth.ts', () => ({
  authenticateEnvWithOauth: mocks.authenticateEnvWithOauth,
}));

vi.mock('../lib/ui.ts', () => ({
  startTask: mocks.startTask,
  succeedTask: mocks.succeedTask,
  failTask: mocks.failTask,
}));

test('env auth falls back to the current env and uses product-style task messages', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');
  mocks.getCurrentEnvName.mockResolvedValue('staging');
  mocks.authenticateEnvWithOauth.mockResolvedValue(undefined);

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: {},
      flags: {},
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await EnvAuth.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(mocks.authenticateEnvWithOauth.mock.calls).toEqual([[{ envName: 'staging', scope: 'global' }]]);
  expect(mocks.startTask.mock.calls).toEqual([
    ['Starting browser sign-in for "staging"...'],
  ]);
  expect(mocks.succeedTask.mock.calls).toEqual([
    ['Signed in to "staging".'],
  ]);
  expect(mocks.failTask.mock.calls.length).toBe(0);
});

test('env auth rejects conflicting environment names from arg and --env', async () => {
  const { default: EnvAuth } = await import('../commands/env/auth.js');

  const command = Object.assign(Object.create(EnvAuth.prototype), {
    parse: vi.fn(async () => ({
      args: { name: 'prod' },
      flags: { env: 'staging' },
    })),
    error: (message: string) => {
      throw new Error(message);
    },
  });

  await expect((() => EnvAuth.prototype.run.call(command))()).rejects.toThrow(/Please use only one/);
});
