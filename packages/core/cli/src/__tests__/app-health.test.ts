/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { AppHealthCheckError, waitForAppReady } from '../lib/app-health.js';

const mocks = vi.hoisted(() => ({
  printInfo: vi.fn(),
  startTask: vi.fn(),
  stopTask: vi.fn(),
  updateTask: vi.fn(),
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
  startTask: mocks.startTask,
  stopTask: mocks.stopTask,
  updateTask: mocks.updateTask,
}));

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  mocks.printInfo.mockReset();
  mocks.startTask.mockReset();
  mocks.stopTask.mockReset();
  mocks.updateTask.mockReset();
  mocks.childSpawnCalls.length = 0;
  mocks.childProcesses.length = 0;
});

test('waitForAppReady prints low-frequency progress logs while retrying health checks', async () => {
  const fetchImpl = vi
    .fn()
    .mockRejectedValueOnce(new Error('fetch failed'))
    .mockResolvedValueOnce(new Response('starting', { status: 503 }))
    .mockResolvedValueOnce(new Response('starting', { status: 503 }))
    .mockResolvedValueOnce(new Response('ok', { status: 200 }));

  const promise = waitForAppReady({
    envName: 'app1',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    intervalMs: 2_000,
    progressLogIntervalMs: 3_000,
  });

  await vi.advanceTimersByTimeAsync(6_000);
  await promise;

  expect(fetchImpl).toHaveBeenCalledTimes(4);
  expect(mocks.printInfo.mock.calls).toEqual([
    ['Waiting for NocoBase to become ready for "app1"...'],
    ['Still waiting for "app1"... (4s elapsed)'],
  ]);
  expect(mocks.startTask).not.toHaveBeenCalled();
  expect(mocks.updateTask).not.toHaveBeenCalled();
  expect(mocks.stopTask).not.toHaveBeenCalled();
});

test('waitForAppReady preserves the last health status on timeout without using task spinners', async () => {
  const fetchImpl = vi.fn(async () => new Response('starting', { status: 503 }));

  const errorPromise = waitForAppReady({
    envName: 'app1',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    fetchImpl: fetchImpl as unknown as typeof fetch,
    timeoutMs: 10,
    intervalMs: 5,
  }).catch((error: unknown) => error);

  await vi.advanceTimersByTimeAsync(20);

  const error = await errorPromise;

  expect(error).toBeInstanceOf(AppHealthCheckError);
  expect(error).toBeInstanceOf(Error);
  if (!(error instanceof Error)) {
    throw new Error('Expected waitForAppReady to reject with an Error instance.');
  }

  expect(error.message).toMatch(/last status was: HTTP 503: starting/);
  expect(mocks.printInfo).toHaveBeenCalledWith('Waiting for NocoBase to become ready for "app1"...');
  expect(mocks.startTask).not.toHaveBeenCalled();
  expect(mocks.updateTask).not.toHaveBeenCalled();
  expect(mocks.stopTask).not.toHaveBeenCalled();
});

test('waitForAppReady streams docker logs in verbose mode and stops when the app is ready', async () => {
  const fetchImpl = vi
    .fn()
    .mockResolvedValueOnce(new Response('starting', { status: 503 }))
    .mockResolvedValueOnce(new Response('ok', { status: 200 }));

  const promise = waitForAppReady({
    envName: 'app1',
    apiBaseUrl: 'http://127.0.0.1:13000/api',
    containerName: 'nb-demo-app1-app',
    verbose: true,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    intervalMs: 1,
  });
  await vi.advanceTimersByTimeAsync(1);
  await promise;

  expect(mocks.childSpawnCalls).toEqual([
    {
      command: 'docker',
      args: ['logs', '--tail', '50', '--follow', 'nb-demo-app1-app'],
      options: {
        stdio: 'inherit',
      },
    },
  ]);
  expect(mocks.childProcesses[0]?.kill).toHaveBeenCalledTimes(1);
});
