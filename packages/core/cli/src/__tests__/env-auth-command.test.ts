/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { test, vi } from 'vitest';

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

  assert.deepEqual(mocks.getCurrentEnvName.mock.calls, [[{ scope: undefined }]]);
  assert.deepEqual(mocks.authenticateEnvWithOauth.mock.calls, [[{ envName: 'staging', scope: undefined }]]);
  assert.deepEqual(mocks.startTask.mock.calls, [
    ['Starting browser sign-in for "staging"...'],
  ]);
  assert.deepEqual(mocks.succeedTask.mock.calls, [
    ['Signed in to "staging".'],
  ]);
  assert.equal(mocks.failTask.mock.calls.length, 0);
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

  await assert.rejects(
    () => EnvAuth.prototype.run.call(command),
    /Please use only one/,
  );
});
