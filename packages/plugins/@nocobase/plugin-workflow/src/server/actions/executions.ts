/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import PluginWorkflowServer from '../Plugin';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';
import { JobModel } from '../types';

function getExecutionLockKey(executionId: number | string) {
  return `workflow:execution:${executionId}`;
}

function isLockAcquireError(error: unknown) {
  return error instanceof Error && error.constructor.name === 'LockAcquireError';
}

export async function destroy(context: Context, next: Next) {
  context.action.mergeParams({
    filter: {
      status: {
        [Op.ne]: EXECUTION_STATUS.STARTED,
      },
    },
  });

  await actions.destroy(context, next);
}

export async function cancel(context: Context, next: Next) {
  const { filterByTk } = context.action.params;
  const ExecutionRepo = context.db.getRepository('executions');
  const JobRepo = context.db.getRepository('jobs');
  const execution = await ExecutionRepo.findOne({
    filterByTk,
    appends: ['jobs'],
  });
  if (!execution) {
    return context.throw(404);
  }
  if (execution.status) {
    return context.throw(400);
  }

  try {
    const lock = await context.app.lockManager.tryAcquire(getExecutionLockKey(execution.id));
    await lock.runExclusive(async () => {
      await context.db.sequelize.transaction(async (transaction) => {
        await execution.update(
          {
            status: EXECUTION_STATUS.ABORTED,
          },
          { transaction },
        );

        const pendingJobs = execution.jobs.filter((job: JobModel) => job.status === JOB_STATUS.PENDING);
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
      });
    }, 60_000);
  } catch (error) {
    if (isLockAcquireError(error)) {
      return context.throw(409, 'Execution is being processed');
    }
    throw error;
  }

  context.body = execution;
  await next();
}

export async function rerun(context: Context, next: Next) {
  const workflowPlugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
  const { filterByTk, values = {} } = context.action.params;
  const { nodeId, overwrite } = values;
  const ExecutionRepo = context.db.getRepository('executions');
  const execution = await ExecutionRepo.findOne({
    filterByTk,
  });
  if (!execution) {
    return context.throw(404);
  }
  if (execution.status !== EXECUTION_STATUS.STARTED) {
    return context.throw(409, 'Only started executions can be rerun');
  }

  try {
    const lock = await context.app.lockManager.tryAcquire(getExecutionLockKey(execution.id));
    await lock.runExclusive(async () => {
      const processor = workflowPlugin.createProcessor(execution);
      await processor.prepare();
      processor.resolveRerun({
        nodeId,
        overwrite: overwrite === true,
      });
    }, 60_000);
    await workflowPlugin.run(
      {
        execution,
        loaded: true,
        rerun: {
          nodeId,
          overwrite: overwrite === true,
        },
      },
      { dispatch: false },
    );
    workflowPlugin.dispatch();
  } catch (error) {
    if (isLockAcquireError(error)) {
      return context.throw(409, 'Execution is being processed');
    }
    if (error instanceof Error) {
      return context.throw(400, error.message);
    }
    throw error;
  }

  context.body = execution;
  context.status = 202;
  await next();
}
