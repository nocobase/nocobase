/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Transaction } from '@nocobase/database';
import type PluginWorkflowServer from './Plugin';
import { EXECUTION_STATUS, JOB_STATUS } from './constants';
import type { ExecutionModel, JobModel } from './types';

type AbortOptions = {
  transaction?: Transaction;
};

export async function abortExecution(
  plugin: PluginWorkflowServer,
  execution: ExecutionModel,
  options: AbortOptions = {},
): Promise<boolean> {
  const logger = plugin.getLogger(execution.workflowId);
  const ownTransaction = !options.transaction;
  const transaction = options.transaction ?? (await plugin.useDataSourceTransaction('main', null, true));
  const ExecutionModelClass = plugin.db.getModel('executions');
  const JobRepo = plugin.db.getRepository('jobs');

  try {
    const [affected] = await ExecutionModelClass.update(
      {
        status: EXECUTION_STATUS.ABORTED,
      },
      {
        where: {
          id: execution.id,
          status: EXECUTION_STATUS.STARTED,
        },
        transaction,
      },
    );

    if (!affected) {
      if (ownTransaction) {
        await transaction.commit();
      }
      return false;
    }

    const pendingJobs = await JobRepo.find({
      filter: {
        executionId: execution.id,
        status: JOB_STATUS.PENDING,
      },
      transaction,
    });

    if (pendingJobs.length) {
      await JobRepo.update({
        values: {
          status: JOB_STATUS.ABORTED,
        },
        filter: {
          id: pendingJobs.map((job: JobModel) => job.id),
        },
        individualHooks: false,
        transaction,
      });
    }

    const childExecutions = await plugin.db.getRepository('executions').find({
      filter: {
        parentExecutionId: execution.id,
        status: EXECUTION_STATUS.STARTED,
      },
      transaction,
    });

    for (const child of childExecutions) {
      await abortExecution(plugin, child, { transaction });
    }

    execution.set('status', EXECUTION_STATUS.ABORTED);
    plugin.timeoutManager.abortLocalProcessor(execution.id);

    logger.info(`execution (${execution.id}) aborted`, {
      workflowId: execution.workflowId,
      pendingJobs: pendingJobs.length,
    });

    if (ownTransaction) {
      await transaction.commit();
    }

    return true;
  } catch (error) {
    if (ownTransaction && !transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }
}
