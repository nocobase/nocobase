/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { utils } from '@nocobase/actions';
import PluginWorkflowServer from '../Plugin';

function getExecutionLockKey(executionId: number | string) {
  return `workflow:execution:${executionId}`;
}

function isLockAcquireError(error: unknown) {
  return error instanceof Error && error.constructor.name === 'LockAcquireError';
}

export async function resume(context, next) {
  const repository = utils.getRepositoryFromParams(context);
  const workflowPlugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
  const { filterByTk, values = {} } = context.action.params;
  const job = await repository.findOne({
    filterByTk,
  });
  if (!job) {
    return context.throw(404, 'Job not found');
  }
  if (!job.execution) {
    job.execution = await job.getExecution();
  }
  workflowPlugin.getLogger(job.workflowId).warn(`Resuming job #${job.id}...`);
  try {
    const lock = await context.app.lockManager.tryAcquire(getExecutionLockKey(job.execution.id));
    await lock.runExclusive(async () => {
      await job.update(values);
    }, 60_000);
  } catch (error) {
    if (isLockAcquireError(error)) {
      return context.throw(409, 'Execution is being processed');
    }
    throw error;
  }

  context.body = job;
  context.status = 202;
  await next();

  workflowPlugin.resume(job);
}
