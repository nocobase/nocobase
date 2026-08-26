/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import Processor from '../Processor';
import { EXECUTION_REASON, JOB_STATUS } from '../constants';
import { WorkflowTimeoutError } from '../timeout-errors';

function createProcessor({ expiresAt, job }: { expiresAt?: Date | null; job?: any } = {}) {
  const execution = { workflowId: 1, expiresAt: expiresAt ?? null } as any;
  const options = {
    plugin: {
      getLogger: () => ({}),
      db: {
        getRepository: () => ({
          findOne: vi.fn().mockResolvedValue(job),
        }),
      },
    },
  } as any;
  return new Processor(execution, options);
}

describe('Processor background abort handle', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should abort immediately when the processor is already aborted', () => {
    const processor = createProcessor();
    processor.abortExecution(EXECUTION_REASON.TIMEOUT);

    const handle = processor.createBackgroundAbortHandle();

    expect(handle.signal.aborted).toBe(true);
    expect(handle.signal.reason).toBeInstanceOf(WorkflowTimeoutError);
    expect(() => handle.throwIfAborted()).toThrow(WorkflowTimeoutError);
    handle.dispose();
  });

  it('should abort immediately when expiresAt has passed', () => {
    const processor = createProcessor({ expiresAt: new Date(Date.now() - 1000) });

    const handle = processor.createBackgroundAbortHandle();

    expect(handle.signal.aborted).toBe(true);
    expect(handle.signal.reason).toBeInstanceOf(WorkflowTimeoutError);
    handle.dispose();
  });

  it('should abort once when expiresAt arrives', () => {
    vi.useFakeTimers();
    const processor = createProcessor({ expiresAt: new Date(Date.now() + 1000) });
    const handle = processor.createBackgroundAbortHandle();
    const abortListener = vi.fn();
    handle.signal.addEventListener('abort', abortListener);

    vi.advanceTimersByTime(1000);
    vi.advanceTimersByTime(1000);

    expect(handle.signal.aborted).toBe(true);
    expect(handle.signal.reason).toBeInstanceOf(WorkflowTimeoutError);
    expect(abortListener).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it('should remove listeners and clear timeout on dispose', () => {
    vi.useFakeTimers();
    const processor = createProcessor({ expiresAt: new Date(Date.now() + 1000) });
    const addListener = vi.spyOn(processor.abortSignal, 'addEventListener');
    const removeListener = vi.spyOn(processor.abortSignal, 'removeEventListener');

    const handle = processor.createBackgroundAbortHandle();

    handle.dispose();
    processor.abortExecution(EXECUTION_REASON.TIMEOUT);
    vi.advanceTimersByTime(1000);

    expect(addListener).toHaveBeenCalledTimes(1);
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(handle.signal.aborted).toBe(false);
  });

  it('should find only pending jobs', async () => {
    const pendingJob = { id: 1, status: JOB_STATUS.PENDING };
    const resolvedJob = { id: 2, status: JOB_STATUS.RESOLVED };

    await expect(createProcessor({ job: pendingJob }).findPendingJob(pendingJob.id)).resolves.toBe(pendingJob);
    await expect(createProcessor({ job: resolvedJob }).findPendingJob(resolvedJob.id)).resolves.toBeNull();
  });
});
