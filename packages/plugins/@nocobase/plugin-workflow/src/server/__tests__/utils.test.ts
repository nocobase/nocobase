/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { EXECUTION_REASON, EXECUTION_STATUS, JOB_STATUS } from '../constants';
import { abortExecution } from '../utils';

describe('workflow > utils', () => {
  it('should run local abort side effects only after explicit transaction commit', async () => {
    const afterCommitCallbacks: Array<() => void> = [];
    const transaction = {
      LOCK: {
        UPDATE: 'UPDATE',
      },
      afterCommit: vi.fn((callback) => {
        afterCommitCallbacks.push(callback);
      }),
    };
    const execution = {
      id: 1,
      workflowId: 1,
      set: vi.fn((key: string, value: any) => {
        (execution as any)[key] = value;
      }),
    };
    const executionRepo = {
      model: {
        update: vi.fn().mockResolvedValue([1]),
      },
      find: vi.fn().mockResolvedValue([]),
    };
    const jobRepo = {
      find: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
    const plugin = {
      getLogger: () => ({
        info: vi.fn(),
      }),
      db: {
        getRepository: vi.fn((name: string) => {
          if (name === 'executions') {
            return executionRepo;
          }
          return jobRepo;
        }),
      },
      timeoutManager: {
        clear: vi.fn(),
      },
      abortRunningExecution: vi.fn(),
    };

    await expect(
      abortExecution(plugin as any, execution as any, { reason: EXECUTION_REASON.TIMEOUT, transaction } as any),
    ).resolves.toBe(true);

    expect(transaction.afterCommit).toHaveBeenCalledTimes(1);
    expect(plugin.timeoutManager.clear).not.toHaveBeenCalled();
    expect(plugin.abortRunningExecution).not.toHaveBeenCalled();
    afterCommitCallbacks.forEach((callback) => callback());
    expect(plugin.timeoutManager.clear).toHaveBeenCalledWith(execution.id);
    expect(plugin.abortRunningExecution).toHaveBeenCalledWith(execution.id, EXECUTION_REASON.TIMEOUT);
    expect(execution.set).toHaveBeenCalledWith('status', EXECUTION_STATUS.ABORTED);
    expect(execution.set).toHaveBeenCalledWith('reason', EXECUTION_REASON.TIMEOUT);
  });

  it('should cascade timeout abort to started and queueing child executions', async () => {
    const parent = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      update: vi.fn(),
      set: vi.fn(),
    };
    const child = {
      id: 2,
      workflowId: 2,
      status: EXECUTION_STATUS.STARTED,
      update: vi.fn(),
      set: vi.fn(),
    };
    const queueingChild = {
      id: 3,
      workflowId: 3,
      status: EXECUTION_STATUS.QUEUEING,
      update: vi.fn(),
      set: vi.fn(),
    };
    const transaction = {
      LOCK: {
        UPDATE: 'UPDATE',
      },
      afterCommit: vi.fn((callback) => callback()),
    };
    const executionRepo = {
      model: {
        update: vi.fn().mockResolvedValue([1]),
      },
      findOne: vi.fn(({ filterByTk }) => {
        if (filterByTk === parent.id) {
          return parent;
        }
        if (filterByTk === child.id) {
          return child;
        }
        if (filterByTk === queueingChild.id) {
          return queueingChild;
        }
        return null;
      }),
      find: vi.fn(({ filter }) => {
        if (filter.parentExecutionId === parent.id) {
          return [child, queueingChild];
        }
        return [];
      }),
    };
    const jobRepo = {
      find: vi.fn().mockResolvedValue([]),
      update: vi.fn(),
    };
    const plugin = {
      getLogger: () => ({
        info: vi.fn(),
      }),
      db: {
        sequelize: {
          transaction: vi.fn((callback) => callback(transaction)),
        },
        getRepository: vi.fn((name: string) => {
          if (name === 'executions') {
            return executionRepo;
          }
          return jobRepo;
        }),
      },
      timeoutManager: {
        clear: vi.fn(),
      },
      abortRunningExecution: vi.fn(),
    };

    await expect(abortExecution(plugin as any, parent as any, { reason: EXECUTION_REASON.TIMEOUT })).resolves.toBe(
      true,
    );

    expect(plugin.db.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(executionRepo.model.update).toHaveBeenCalledWith(
      {
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.TIMEOUT,
      },
      {
        where: {
          id: parent.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
        transaction,
      },
    );
    expect(executionRepo.model.update).toHaveBeenCalledWith(
      {
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.PARENT_ABORTED,
      },
      {
        where: {
          id: child.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
        transaction,
      },
    );
    expect(executionRepo.model.update).toHaveBeenCalledWith(
      {
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.PARENT_ABORTED,
      },
      {
        where: {
          id: queueingChild.id,
          status: EXECUTION_STATUS.QUEUEING,
        },
        individualHooks: true,
        transaction,
      },
    );
    expect(plugin.timeoutManager.clear).toHaveBeenCalledWith(parent.id);
    expect(plugin.timeoutManager.clear).toHaveBeenCalledWith(child.id);
    expect(plugin.timeoutManager.clear).toHaveBeenCalledWith(queueingChild.id);
  });

  it('should abort pending jobs when aborting execution', async () => {
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      update: vi.fn(),
      set: vi.fn(),
    };
    const transaction = {
      LOCK: {
        UPDATE: 'UPDATE',
      },
      afterCommit: vi.fn((callback) => callback()),
    };
    const executionRepo = {
      model: {
        update: vi.fn().mockResolvedValue([1]),
      },
      findOne: vi.fn().mockResolvedValue(execution),
      find: vi.fn().mockResolvedValue([]),
    };
    const jobRepo = {
      update: vi.fn(),
    };
    const plugin = {
      getLogger: () => ({
        info: vi.fn(),
      }),
      db: {
        sequelize: {
          transaction: vi.fn((callback) => callback(transaction)),
        },
        getRepository: vi.fn((name: string) => {
          if (name === 'executions') {
            return executionRepo;
          }
          return jobRepo;
        }),
      },
      timeoutManager: {
        clear: vi.fn(),
      },
      abortRunningExecution: vi.fn(),
    };

    await expect(abortExecution(plugin as any, execution as any, { reason: EXECUTION_REASON.TIMEOUT })).resolves.toBe(
      true,
    );

    expect(plugin.db.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(executionRepo.model.update).toHaveBeenCalledWith(
      {
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.TIMEOUT,
      },
      {
        where: {
          id: execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
        transaction,
      },
    );
    expect(jobRepo.update).toHaveBeenCalledWith({
      values: {
        status: JOB_STATUS.ABORTED,
      },
      filter: {
        executionId: execution.id,
        status: JOB_STATUS.PENDING,
      },
      individualHooks: false,
      transaction,
    });
  });

  it('should abort pending jobs when execution abort reason is not timeout', async () => {
    const execution = {
      id: 1,
      workflowId: 1,
      status: EXECUTION_STATUS.STARTED,
      update: vi.fn(),
      set: vi.fn(),
    };
    const transaction = {
      LOCK: {
        UPDATE: 'UPDATE',
      },
      afterCommit: vi.fn((callback) => callback()),
    };
    const executionRepo = {
      model: {
        update: vi.fn().mockResolvedValue([1]),
      },
      findOne: vi.fn().mockResolvedValue(execution),
      find: vi.fn().mockResolvedValue([]),
    };
    const jobRepo = {
      update: vi.fn(),
    };
    const plugin = {
      getLogger: () => ({
        info: vi.fn(),
      }),
      db: {
        sequelize: {
          transaction: vi.fn((callback) => callback(transaction)),
        },
        getRepository: vi.fn((name: string) => {
          if (name === 'executions') {
            return executionRepo;
          }
          return jobRepo;
        }),
      },
      timeoutManager: {
        clear: vi.fn(),
      },
      abortRunningExecution: vi.fn(),
    };

    await expect(
      abortExecution(plugin as any, execution as any, { reason: EXECUTION_REASON.MANUAL_CANCEL }),
    ).resolves.toBe(true);

    expect(plugin.db.sequelize.transaction).toHaveBeenCalledTimes(1);
    expect(executionRepo.model.update).toHaveBeenCalledWith(
      {
        status: EXECUTION_STATUS.ABORTED,
        reason: EXECUTION_REASON.MANUAL_CANCEL,
      },
      {
        where: {
          id: execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        individualHooks: true,
        transaction,
      },
    );
    expect(jobRepo.update).toHaveBeenCalledWith({
      values: {
        status: JOB_STATUS.ABORTED,
      },
      filter: {
        executionId: execution.id,
        status: JOB_STATUS.PENDING,
      },
      individualHooks: false,
      transaction,
    });
  });
});
