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
}));

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
