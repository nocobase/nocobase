/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, test, vi, expect } from 'vitest';
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

  expect(fetchImpl.mock.calls.length).toBe(1);
  expect(fetchImpl.mock.calls[0][0]).toBe('http://127.0.0.1:13000/api/__health_check');
  expect(fetchImpl.mock.calls[0][1].method).toBe('GET');
  expect(fetchImpl.mock.calls[0][1].signal).toBeTruthy();
  expect(mocks.startTask.mock.calls.length).toBe(1);
  expect(mocks.updateTask.mock.calls.length).toBe(0);
  expect(mocks.stopTask.mock.calls.length).toBe(1);
  expect(mocks.promptInfo.mock.calls.some((call) => String(call[0]).includes('/api/__health_check'))).toBe(true);
});

test('waitForAppHealthCheck throws when /api/__health_check never returns ok', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi.fn(async () => ({
      ok: false,
      text: async () => 'starting',
    }));

  await expect((
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
    })).rejects.toThrow(/__health_check.*respond with `ok`.*docker logs test-app/i);

  expect(mocks.startTask.mock.calls.some((call) => String(call[0]).includes('/api/__health_check'))).toBe(true);
  expect(mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('Still starting'))).toBe(true);
  expect(mocks.stopTask.mock.calls.length > 0).toBe(true);
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

  expect(fetchImpl.mock.calls.length).toBe(3);
  expect(mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('connection refused'))).toBe(true);
  expect(mocks.updateTask.mock.calls.some((call) => String(call[0]).includes('HTTP 503'))).toBe(true);
  expect(mocks.stopTask.mock.calls.length).toBe(1);
});
