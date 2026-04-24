/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import assert from 'node:assert/strict';
import { afterEach, test, vi } from 'vitest';
import Install from '../commands/install.js';

const mocks = vi.hoisted(() => ({
  promptInfo: vi.fn(),
  startTask: vi.fn(),
  updateTask: vi.fn(),
  stopTask: vi.fn(),
}));

vi.mock('@clack/prompts', () => ({
  log: {
    info: mocks.promptInfo,
    step: vi.fn(),
    warn: vi.fn(),
  },
  outro: vi.fn(),
  cancel: vi.fn(),
}));

vi.mock('../lib/ui.js', () => ({
  startTask: mocks.startTask,
  updateTask: mocks.updateTask,
  stopTask: mocks.stopTask,
}));

afterEach(() => {
  mocks.promptInfo.mockReset();
  mocks.startTask.mockReset();
  mocks.updateTask.mockReset();
  mocks.stopTask.mockReset();
});

test('waitForAppHealthCheck resolves after /api/__health_check returns ok', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi.fn(async () => ({
    ok: true,
    text: async () => 'ok',
  }));

  await (
    Install.prototype as unknown as {
      waitForAppHealthCheck: (
        apiBaseUrl: string,
        options?: {
          timeoutMs?: number;
          intervalMs?: number;
          requestTimeoutMs?: number;
          fetchImpl?: typeof fetch;
          containerName?: string;
        },
      ) => Promise<void>;
    }
  ).waitForAppHealthCheck.call(command, 'http://127.0.0.1:13000/api', {
    timeoutMs: 50,
    intervalMs: 0,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(fetchImpl.mock.calls.length, 1);
  assert.equal(fetchImpl.mock.calls[0][0], 'http://127.0.0.1:13000/api/__health_check');
  assert.equal(fetchImpl.mock.calls[0][1].method, 'GET');
  assert.ok(fetchImpl.mock.calls[0][1].signal);
  assert.equal(mocks.startTask.mock.calls.length, 1);
  assert.equal(mocks.updateTask.mock.calls.length, 0);
  assert.equal(mocks.stopTask.mock.calls.length, 1);
  assert.equal(
    mocks.promptInfo.mock.calls.some((call) => String(call[0]).includes('/api/__health_check')),
    true,
  );
});

test('waitForAppHealthCheck throws when /api/__health_check never returns ok', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi.fn(async () => ({
      ok: false,
      text: async () => 'starting',
    }));

  await assert.rejects(
    (
      Install.prototype as unknown as {
        waitForAppHealthCheck: (
          apiBaseUrl: string,
          options?: {
          timeoutMs?: number;
          intervalMs?: number;
          requestTimeoutMs?: number;
          fetchImpl?: typeof fetch;
          containerName?: string;
        },
      ) => Promise<void>;
    }
  ).waitForAppHealthCheck.call(command, 'http://127.0.0.1:13000/api', {
      timeoutMs: 10,
      intervalMs: 0,
      requestTimeoutMs: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
      containerName: 'test-app',
    }),
    /__health_check.*respond with `ok`.*docker logs test-app/i,
  );

  assert.equal(
    mocks.startTask.mock.calls.some((call) => String(call[0]).includes('/api/__health_check')),
    true,
  );
  assert.equal(
    mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('Still starting')),
    true,
  );
  assert.equal(
    mocks.stopTask.mock.calls.length > 0,
    true,
  );
});

test('waitForAppHealthCheck keeps polling while the app is still booting', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi
    .fn()
    .mockRejectedValueOnce(new Error('connection refused'))
    .mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'starting',
    })
    .mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => 'OK',
    });

  await (
    Install.prototype as unknown as {
      waitForAppHealthCheck: (
        apiBaseUrl: string,
        options?: {
          timeoutMs?: number;
          intervalMs?: number;
          requestTimeoutMs?: number;
          fetchImpl?: typeof fetch;
          containerName?: string;
        },
      ) => Promise<void>;
    }
  ).waitForAppHealthCheck.call(command, 'http://127.0.0.1:13000/api', {
    timeoutMs: 100,
    intervalMs: 0,
    requestTimeoutMs: 1,
    fetchImpl: fetchImpl as unknown as typeof fetch,
  });

  assert.equal(fetchImpl.mock.calls.length, 3);
  assert.equal(
    mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('connection refused')),
    true,
  );
  assert.equal(
    mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('HTTP 503')),
    true,
  );
  assert.equal(mocks.stopTask.mock.calls.length, 1);
});
