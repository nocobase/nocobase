/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LockManager } from '@nocobase/lock-manager';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EXECUTION_STATUS } from '../constants';
import ExecutionTimeoutManager from '../ExecutionTimeoutManager';
import { getExecutionLockKey } from '../utils';

function createApp() {
  return {
    lockManager: new LockManager(),
  };
}

describe('workflow > ExecutionTimeoutManager', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should not rebuild per-execution timers when loading existing started executions', async () => {
    const expiredExecution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() - 1_000),
    };
    const nextExecution = {
      id: 2,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() + 30_000),
    };
    const findAll = vi.fn().mockResolvedValue([expiredExecution]);
    const findNextExecution = vi.fn().mockResolvedValue(nextExecution);
    const findExpiredExecution = vi.fn().mockResolvedValue(expiredExecution);
    const app = createApp();
    const manager = new ExecutionTimeoutManager({
      app,
      db: {
        getModel: () => ({
          findAll,
          findOne: findNextExecution,
        }),
        getRepository: () => ({
          findOne: findExpiredExecution,
        }),
      },
      getLogger: () => ({
        error: vi.fn(),
      }),
    } as any);
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired').mockResolvedValue(true);
    const scheduleSpy = vi.spyOn(manager, 'scheduleExecutionTimeout');

    await manager.load();

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(findNextExecution).toHaveBeenCalledTimes(1);
    expect(findExpiredExecution).toHaveBeenCalledWith({ filterByTk: expiredExecution.id });
    expect(abortSpy).toHaveBeenCalledWith(expiredExecution);
    expect(scheduleSpy).not.toHaveBeenCalled();

    await manager.unload();
  });

  it('should abort expired executions from the periodic scan', async () => {
    const expiredExecution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() - 1_000),
    };
    const findAll = vi.fn().mockResolvedValue([expiredExecution]);
    const findOne = vi.fn().mockResolvedValue(expiredExecution);
    const app = createApp();
    const tryAcquireSpy = vi.spyOn(app.lockManager, 'tryAcquire');
    const manager = new ExecutionTimeoutManager({
      app,
      db: {
        getModel: () => ({
          findAll,
        }),
        getRepository: () => ({
          findOne,
        }),
      },
    } as any);
    (manager as any).stopped = false;
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired').mockResolvedValue(true);

    await (manager as any).scanExpiredExecutions();

    expect(tryAcquireSpy).toHaveBeenCalledWith(getExecutionLockKey(expiredExecution.id), 60_000);
    expect(findOne).toHaveBeenCalledWith({ filterByTk: expiredExecution.id });
    expect(abortSpy).toHaveBeenCalledWith(expiredExecution);

    await manager.unload();
  });

  it('should abort the next expired execution from the global one-shot timer', async () => {
    const timerCallbacks: Array<() => void> = [];
    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: () => void) => {
      timerCallbacks.push(callback);
      return timerCallbacks.length as any;
    }) as any);
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() - 1_000),
    };
    const findAll = vi.fn().mockResolvedValue([execution]);
    const findNextExecution = vi.fn().mockResolvedValueOnce(execution).mockResolvedValueOnce(null);
    const findExpiredExecution = vi.fn().mockResolvedValue(execution);
    const app = createApp();
    const manager = new ExecutionTimeoutManager({
      app,
      db: {
        getModel: () => ({
          findAll,
          findOne: findNextExecution,
        }),
        getRepository: () => ({
          findOne: findExpiredExecution,
        }),
      },
      getLogger: () => ({
        error: vi.fn(),
      }),
    } as any);
    (manager as any).stopped = false;
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired').mockResolvedValue(true);

    await (manager as any).scheduleNextExpiresAtTimer();
    expect(timerCallbacks).toHaveLength(1);

    await (manager as any).handleNextExpiresAtTimeout(execution.expiresAt);

    expect(abortSpy).toHaveBeenCalledWith(execution);

    await manager.unload();
  });

  it('should reload expired execution after acquiring the execution lock', async () => {
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() - 1_000),
    };
    const findOne = vi.fn().mockResolvedValue(execution);
    const app = createApp();
    const tryAcquireSpy = vi.spyOn(app.lockManager, 'tryAcquire');
    const manager = new ExecutionTimeoutManager({
      app,
      db: {
        getRepository: () => ({
          findOne,
        }),
      },
    } as any);
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired').mockResolvedValue(true);

    await (manager as any).abortExecutionIfExpiredWithLock(execution.id);

    expect(tryAcquireSpy).toHaveBeenCalledWith(getExecutionLockKey(execution.id), 60_000);
    expect(findOne).toHaveBeenCalledWith({ filterByTk: execution.id });
    expect(abortSpy).toHaveBeenCalledWith(execution);
  });

  it('should reschedule owner timer instead of aborting early for long timeouts', async () => {
    const now = new Date('2026-05-17T00:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const timerCallbacks: Array<() => void> = [];
    vi.spyOn(global, 'setTimeout').mockImplementation(((callback: () => void) => {
      timerCallbacks.push(callback);
      return timerCallbacks.length as any;
    }) as any);
    const manager = new ExecutionTimeoutManager({
      abortRunningExecution: vi.fn(),
      getLogger: () => ({
        error: vi.fn(),
      }),
    } as any);
    (manager as any).stopped = false;
    const scheduleSpy = vi.spyOn(manager, 'scheduleExecutionTimeout');
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(now + 2_147_483_647 + 1_000),
    };

    manager.scheduleExecutionTimeout(execution as any);
    expect(timerCallbacks).toHaveLength(2);

    timerCallbacks[1]();

    expect(scheduleSpy).toHaveBeenCalledTimes(2);
    expect((manager as any).plugin.abortRunningExecution).not.toHaveBeenCalled();

    await manager.unload();
  });

  it('should wait for an in-flight scan during unload', async () => {
    let resolveFindAll!: (value: any[]) => void;
    const findAll = vi.fn(
      () =>
        new Promise<any[]>((resolve) => {
          resolveFindAll = resolve;
        }),
    );
    const manager = new ExecutionTimeoutManager({
      db: {
        getModel: () => ({
          findAll,
        }),
      },
    } as any);
    (manager as any).stopped = false;

    const scan = (manager as any).scanExpiredExecutions();
    let unloaded = false;
    const unload = manager.unload().then(() => {
      unloaded = true;
    });

    await Promise.resolve();
    expect(unloaded).toBe(false);

    resolveFindAll([]);
    await scan;
    await unload;

    expect(unloaded).toBe(true);
  });

  it('should stop processing once the local execution snapshot is expired', async () => {
    const manager = new ExecutionTimeoutManager({} as any);
    const execution = {
      id: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() - 1_000),
    };
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired').mockResolvedValue(false);

    await expect(manager.shouldContinue(execution as any)).resolves.toBe(false);
    expect(abortSpy).toHaveBeenCalledWith(execution, {});
  });

  it('should continue without querying when local execution is still started and not expired', async () => {
    const manager = new ExecutionTimeoutManager({} as any);
    const execution = {
      id: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() + 1_000),
    };
    const abortSpy = vi.spyOn(manager, 'abortExecutionIfExpired');

    await expect(manager.shouldContinue(execution as any)).resolves.toBe(true);
    expect(abortSpy).not.toHaveBeenCalled();
  });
});
