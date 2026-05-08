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
import Processor from './Processor';
import { EXECUTION_STATUS } from './constants';
import type { ExecutionModel } from './types';
import { abortExecution } from './executionAbort';
import { WorkflowTimeoutError } from './timeout-errors';

type EnsureStartedOptions = {
  transaction?: Transaction;
};

const SCAN_LIMIT = 100;

export default class ExecutionTimeoutManager {
  private readonly processors = new Map<string, Processor>();

  constructor(private readonly plugin: PluginWorkflowServer) {}

  getTimeout(execution: ExecutionModel) {
    const timeout = Number(execution.workflow?.options?.timeout ?? 0);
    return Number.isFinite(timeout) && timeout > 0 ? timeout : 0;
  }

  async ensureStarted(execution: ExecutionModel, options: EnsureStartedOptions = {}) {
    if (execution.startedAt) {
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
    return execution;
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

  async abort(execution: ExecutionModel, options: { transaction?: Transaction; reason?: string } = {}) {
    return abortExecution(this.plugin, execution, options);
  }

  bindProcessor(processor: Processor) {
    this.processors.set(String(processor.execution.id), processor);
    this.armProcessor(processor);
  }

  unbindProcessor(executionId: number | string) {
    this.processors.delete(String(executionId));
  }

  abortLocalProcessor(executionId: number | string, reason = 'timeout') {
    const processor = this.processors.get(String(executionId));
    if (!processor) {
      return;
    }
    processor.abortForTimeout(reason);
  }

  async throwIfExpired(execution: ExecutionModel) {
    if (execution.status !== EXECUTION_STATUS.STARTED) {
      throw new WorkflowTimeoutError('Workflow execution has been aborted');
    }

    if (this.isExpired(execution)) {
      await this.abort(execution, { reason: 'timeout' });
      throw new WorkflowTimeoutError();
    }
  }

  async scanExpired() {
    const ExecutionRepo = this.plugin.db.getRepository('executions');
    const executions = await ExecutionRepo.find({
      filter: {
        status: EXECUTION_STATUS.STARTED,
        expiresAt: {
          [Op.not]: null,
          [Op.lte]: new Date(),
        },
      },
      limit: SCAN_LIMIT,
      sort: ['id'],
    });

    let count = 0;
    for (const execution of executions) {
      const aborted = await this.abort(execution, { reason: 'timeout' });
      if (aborted) {
        count += 1;
      }
    }
    return count;
  }

  private armProcessor(processor: Processor) {
    const remaining = this.getRemainingMs(processor.execution);
    if (remaining == null || remaining <= 0) {
      if (remaining != null && remaining <= 0) {
        processor.abortForTimeout('timeout');
      }
      return;
    }
    processor.setTimeoutGuard(remaining);
  }
}
