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
  printInfo: vi.fn(),
  childSpawnCalls: [] as Array<{
    command: string;
    args: string[];
    options: Record<string, unknown>;
  }>,
  childProcesses: [] as Array<{
    kill: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  const spawn = vi.fn((command: string, args: string[], options: Record<string, unknown>) => {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    const child = {
      exitCode: null,
      killed: false,
      once: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
        handlers[event] = handler;
        return child;
      }),
      kill: vi.fn(() => {
        handlers.close?.(0, null);
        return true;
      }),
    };
    mocks.childSpawnCalls.push({ command, args, options });
    mocks.childProcesses.push(child);
    return child;
  });

  return {
    ...actual,
    spawn,
    default: {
      ...actual,
      spawn,
    },
  };
});

vi.mock('../lib/ui.js', () => ({
  printInfo: mocks.printInfo,
}));

afterEach(() => {
  mocks.printInfo.mockReset();
  mocks.childSpawnCalls.length = 0;
  mocks.childProcesses.length = 0;
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
  expect(mocks.printInfo.mock.calls).toEqual([['Waiting for NocoBase to become ready...']]);
});

test('waitForAppHealthCheck throws when /api/__health_check never returns ok', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi.fn(async () => ({
    ok: false,
    text: async () => 'starting',
  }));

  await expect(
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
  ).rejects.toThrow(/__health_check.*respond with `ok`.*docker logs test-app/i);

  expect(
    mocks.printInfo.mock.calls.some((call) => String(call[0]).includes('Waiting for NocoBase to become ready')),
  ).toBe(true);
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
  expect(mocks.printInfo.mock.calls.some((call) => String(call[0]).includes('connection refused'))).toBe(true);
  expect(mocks.printInfo.mock.calls.some((call) => String(call[0]).includes('HTTP 503'))).toBe(true);
});

test('waitForAppHealthCheck streams docker logs in verbose mode and stops when the app is ready', async () => {
  const command = Object.create(Install.prototype) as Install;
  const fetchImpl = vi
    .fn()
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
          verbose?: boolean;
        },
      ) => Promise<void>;
    }
  ).waitForAppHealthCheck.call(command, 'http://127.0.0.1:13000/api', {
    timeoutMs: 100,
    intervalMs: 0,
    requestTimeoutMs: 1,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    containerName: 'test-app',
    verbose: true,
  });

  expect(mocks.childSpawnCalls).toEqual([
    {
      command: 'docker',
      args: ['logs', '--tail', '50', '--follow', 'test-app'],
      options: {
        stdio: 'inherit',
      },
    },
  ]);
  expect(mocks.childProcesses[0]?.kill).toHaveBeenCalledTimes(1);
});
