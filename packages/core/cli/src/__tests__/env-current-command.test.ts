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
}));

vi.mock('../lib/auth-store.ts', () => ({
  getCurrentEnvName: mocks.getCurrentEnvName,
}));

test('env current prints the current env name from the default config scope', async () => {
  const { default: EnvCurrent } = await import('../commands/env/current.js');
  mocks.getCurrentEnvName.mockResolvedValue('staging');

  const log = vi.fn();
  const command = Object.assign(Object.create(EnvCurrent.prototype), {
    parse: vi.fn(async () => ({
      args: {},
      flags: {},
    })),
    log,
  });

  await EnvCurrent.prototype.run.call(command);

  expect(mocks.getCurrentEnvName.mock.calls).toEqual([[{ scope: 'global' }]]);
  expect(log.mock.calls).toEqual([['staging']]);
});
