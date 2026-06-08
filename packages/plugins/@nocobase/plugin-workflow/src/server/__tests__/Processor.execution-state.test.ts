/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import Processor from '../Processor';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';

describe('workflow > Processor execution state sync', () => {
  it('should stop before running instruction when execution was ended externally', async () => {
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.ABORTED,
    };

    const plugin = {
      getLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
      timeoutManager: {
        shouldContinue: vi.fn().mockResolvedValue(false),
      },
    };

    const processor = new Processor(execution as any, { plugin } as any);
    const exitSpy = vi.spyOn(processor, 'exit').mockResolvedValue(null);
    const instruction = vi.fn();

    const result = await (processor as any).exec(instruction, {
      id: 1,
      key: 'node-1',
      workflowId: 1,
    });

    expect(plugin.timeoutManager.shouldContinue).toHaveBeenCalledWith(execution);
    expect(instruction).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith();
    expect(result).toBeNull();
  });

  it('should not overwrite execution status when it was ended externally before exit', async () => {
    const update = vi.fn().mockResolvedValue([0]);
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      expiresAt: new Date(Date.now() + 1_000),
      set: vi.fn((values: any) => {
        Object.assign(execution, values);
      }),
      reload: vi.fn().mockImplementation(async () => {
        execution.status = EXECUTION_STATUS.ABORTED;
      }),
    };

    const plugin = {
      db: {
        getModel: vi.fn(() => ({
          update,
        })),
      },
      getLogger: () => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
      timeoutManager: {
        clear: vi.fn(),
        invalidateNextExpiresAtIfMatches: vi.fn(),
        scheduleExecutionTimeout: vi.fn(),
      },
    };

    const processor = new Processor(execution as any, { plugin } as any);

    await processor.exit(JOB_STATUS.RESOLVED);

    expect(update).toHaveBeenCalledWith(
      { status: EXECUTION_STATUS.RESOLVED },
      {
        where: {
          id: execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
      },
    );
    expect(execution.reload).toHaveBeenCalledWith();
    expect(plugin.timeoutManager.clear).toHaveBeenCalledWith(execution.id);
    expect(plugin.timeoutManager.invalidateNextExpiresAtIfMatches).toHaveBeenCalledWith(execution.expiresAt);
    expect(plugin.timeoutManager.scheduleExecutionTimeout).not.toHaveBeenCalled();
    expect(execution.status).toBe(EXECUTION_STATUS.ABORTED);
  });
});
