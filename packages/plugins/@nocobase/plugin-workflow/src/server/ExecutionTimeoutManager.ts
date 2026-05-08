/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Op, type Transaction } from '@nocobase/database';
import type PluginWorkflowServer from './Plugin';
import { EXECUTION_STATUS } from './constants';
import type { ExecutionModel } from './types';
import { abortExecution } from './utils';
import { WorkflowTimeoutError } from './timeout-errors';

type EnsureStartedOptions = {
  transaction?: Transaction;
};

const LOAD_BATCH_SIZE = 1000;

export default class ExecutionTimeoutManager {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(private readonly plugin: PluginWorkflowServer) {}

  getTimeout(execution: ExecutionModel) {
    const timeout = Number(execution.workflow?.options?.timeout ?? 0);
    return Number.isFinite(timeout) && timeout > 0 ? timeout : 0;
  }

  async ensureStarted(execution: ExecutionModel, options: EnsureStartedOptions = {}) {
    if (execution.startedAt) {
      this.scheduleExecutionTimeout(execution);
      return execution;
    }

    const transaction = await this.plugin.useDataSourceTransaction('main', options.transaction);

    if (!execution.workflow) {
      execution.workflow =
        this.plugin.enabledCache.get(execution.workflowId) || (await execution.getWorkflow({ transaction }));
    }

    const timeout = this.getTimeout(execution);
    const ExecutionModelClass = this.plugin.db.getModel('executions');
    const startedAt = new Date();
    const expiresAt = timeout > 0 ? new Date(startedAt.getTime() + timeout) : null;

    const [affected] = await ExecutionModelClass.update(
      {
        startedAt,
        ...(expiresAt
          ? {
              expiresAt,
            }
          : {}),
      },
      {
        where: {
          id: execution.id,
          startedAt: null,
        },
        transaction,
      },
    );

    if (affected || !execution.startedAt) {
      await execution.reload({ transaction });
    }
    this.scheduleExecutionTimeout(execution);
    return execution;
  }

  async load() {
    const ExecutionModelClass = this.plugin.db.getModel('executions');
    let cursor: { expiresAt: Date; id: number | string } | null = null;
    let hasMore = true;

    while (hasMore) {
      const where: any = {
        status: EXECUTION_STATUS.STARTED,
        expiresAt: {
          [Op.not]: null,
        },
      };

      if (cursor) {
        where[Op.or] = [
          {
            expiresAt: {
              [Op.gt]: cursor.expiresAt,
            },
          },
          {
            expiresAt: cursor.expiresAt,
            id: {
              [Op.gt]: cursor.id,
            },
          },
        ];
      }

      const executions = (await ExecutionModelClass.findAll({
        attributes: ['id', 'workflowId', 'status', 'expiresAt'],
        where,
        order: [
          ['expiresAt', 'ASC'],
          ['id', 'ASC'],
        ],
        limit: LOAD_BATCH_SIZE,
      })) as ExecutionModel[];

      if (!executions.length) {
        hasMore = false;
        continue;
      }

      const now = new Date();
      for (const execution of executions) {
        if (this.isExpired(execution, now)) {
          await this.abortExecutionIfExpired(execution);
        } else {
          this.scheduleExecutionTimeout(execution);
        }
      }

      const last = executions[executions.length - 1];
      cursor = {
        expiresAt: last.expiresAt as Date,
        id: last.id,
      };
    }
  }

  unload() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  isExpired(execution: ExecutionModel, now = new Date()) {
    return !!execution.expiresAt && execution.expiresAt.getTime() <= now.getTime();
  }

  getRemainingMs(execution: ExecutionModel, now = new Date()) {
    if (!execution.expiresAt) {
      return null;
    }
    return execution.expiresAt.getTime() - now.getTime();
  }

  async abort(execution: ExecutionModel, options: { transaction?: Transaction } = {}) {
    const aborted = await abortExecution(this.plugin, execution, options);
    if (aborted) {
      this.clearExecutionTimeout(execution.id);
    }
    return aborted;
  }

  async abortExecutionIfExpired(execution: ExecutionModel, options: { transaction?: Transaction } = {}) {
    if (execution.status !== EXECUTION_STATUS.STARTED || !this.isExpired(execution)) {
      return false;
    }
    return this.abort(execution, options);
  }

  clear(executionId: number | string) {
    this.clearExecutionTimeout(executionId);
  }

  async throwIfExpired(execution: ExecutionModel) {
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new WorkflowTimeoutError('Workflow execution has been aborted');
    }

    if (await this.abortExecutionIfExpired(execution)) {
      throw new WorkflowTimeoutError();
    }
  }

  scheduleExecutionTimeout(execution: ExecutionModel) {
    const id = String(execution.id);
    this.clearExecutionTimeout(id);

    if (execution.status !== EXECUTION_STATUS.STARTED || !execution.expiresAt) {
      return;
    }

    const remaining = this.getRemainingMs(execution);
    if (remaining == null) {
      return;
    }

    if (remaining <= 0) {
      setImmediate(() => {
        this.handleExecutionTimeout(id).catch((error) => {
          this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) timeout handling failed`, {
            error,
          });
        });
      });
      return;
    }

    this.timers.set(
      id,
      setTimeout(() => {
        this.handleExecutionTimeout(id).catch((error) => {
          this.plugin.getLogger(execution.workflowId).error(`execution (${execution.id}) timeout handling failed`, {
            error,
          });
        });
      }, remaining),
    );
  }

  private clearExecutionTimeout(executionId: number | string) {
    const id = String(executionId);
    const timer = this.timers.get(id);
    if (!timer) {
      return;
    }
    clearTimeout(timer);
    this.timers.delete(id);
  }

  private async handleExecutionTimeout(executionId: string) {
    this.clearExecutionTimeout(executionId);

    if (this.plugin.abortRunningExecution(executionId)) {
      return;
    }

    const execution = await this.plugin.db.getRepository('executions').findOne({
      filterByTk: executionId,
    });
    if (!execution) {
      return;
    }

    await this.abortExecutionIfExpired(execution);
  }
}
