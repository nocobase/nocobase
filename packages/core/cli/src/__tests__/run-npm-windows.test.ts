/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, expect, test, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('cross-spawn', () => ({
  default: spawnMock,
}));

function successfulChild() {
  return {
    once(event: string, callback: (...args: any[]) => void) {
      if (event === 'close') {
        setImmediate(() => callback(0, null));
      }
      return this;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('run uses cross-spawn to safely execute Windows package manager shims', async () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  spawnMock.mockReturnValue(successfulChild());

  const { run } = await import('../lib/run-npm.js');
  await run('yarn', ['install'], { stdio: 'ignore', cwd: 'C:\\work\\app' });

  expect(spawnMock).toHaveBeenCalledTimes(1);
  const [command, args, options] = spawnMock.mock.calls[0] ?? [];
  expect(command).toBe('yarn');
  expect(args).toEqual(['install']);
  expect(String(options?.cwd ?? '')).toContain('C:\\work\\app');
  expect(options).toMatchObject({
    stdio: 'ignore',
    windowsHide: true,
  });
  expect(options).not.toHaveProperty('shell');
});

test('run keeps non-shim commands off the shell on Windows', async () => {
  vi.spyOn(process, 'platform', 'get').mockReturnValue('win32');
  spawnMock.mockReturnValue(successfulChild());

  const { run } = await import('../lib/run-npm.js');
  await run('git', ['status'], { stdio: 'ignore', cwd: 'C:\\work\\app' });

  expect(spawnMock).toHaveBeenCalledTimes(1);
  const [command, args, options] = spawnMock.mock.calls[0] ?? [];
  expect(command).toBe('git');
  expect(args).toEqual(['status']);
  expect(String(options?.cwd ?? '')).toContain('C:\\work\\app');
  expect(options).toMatchObject({
    stdio: 'ignore',
    windowsHide: true,
  });
  expect(options).not.toHaveProperty('shell');
});
