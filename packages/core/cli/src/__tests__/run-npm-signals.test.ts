/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EventEmitter } from 'node:events';
import { afterEach, expect, test, vi } from 'vitest';

const spawnMock = vi.hoisted(() => vi.fn());

vi.mock('cross-spawn', () => ({
  default: spawnMock,
}));

type MockChildProcess = EventEmitter & {
  exitCode: number | null;
  signalCode: NodeJS.Signals | null;
  kill: ReturnType<typeof vi.fn>;
};

function createChildProcess(): MockChildProcess {
  const child = new EventEmitter() as MockChildProcess;
  child.exitCode = null;
  child.signalCode = null;
  child.kill = vi.fn((signal: NodeJS.Signals) => {
    child.signalCode = signal;
    return true;
  });
  return child;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

test('run forwards terminal interrupts to the active child process', async () => {
  const child = createChildProcess();
  spawnMock.mockReturnValue(child);

  const { run } = await import('../lib/run-npm.js');
  const sigintListenersBefore = new Set(process.listeners('SIGINT'));
  const sigtermListenersBefore = new Set(process.listeners('SIGTERM'));

  const promise = run('yarn', ['install'], { stdio: 'ignore' });

  const sigintListenersAfter = process.listeners('SIGINT');
  const sigtermListenersAfter = process.listeners('SIGTERM');
  const addedSigintListener = sigintListenersAfter.find((listener) => !sigintListenersBefore.has(listener));
  const addedSigtermListener = sigtermListenersAfter.find((listener) => !sigtermListenersBefore.has(listener));

  expect(addedSigintListener).toBeTypeOf('function');
  expect(addedSigtermListener).toBeTypeOf('function');

  addedSigintListener?.();

  expect(child.kill).toHaveBeenCalledWith('SIGINT');

  child.emit('close', null, 'SIGINT');

  await expect(promise).rejects.toThrow('yarn exited due to signal SIGINT');
  expect(process.listeners('SIGINT')).not.toContain(addedSigintListener);
  expect(process.listeners('SIGTERM')).not.toContain(addedSigtermListener);
});
