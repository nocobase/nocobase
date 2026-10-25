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
import { col, fn } from 'sequelize';
import { jobListFields } from './executionJobs';
import type { ExecutionModel } from '../types';
import PluginWorkflowServer from '../Plugin';
import { EXECUTION_REASON, EXECUTION_STATUS } from '../constants';
import { abortExecution, getExecutionLockKey, isLockAcquireError } from '../utils';

export async function get(context: Context, next: Next) {
  const { filterByTk, filter } = context.action.params;
  // The detail endpoint owns its projection: callers cannot append the full jobs association or large job fields.
  const execution = (await context.db.getRepository('executions').findOne({
    filterByTk,
    filter,
    appends: ['workflow', 'workflow.nodes', 'workflow.versionStats', 'workflow.stats'],
    except: ['workflow.options'],
    context,
  })) as ExecutionModel | null;
  context.body = execution;
  context.status = 200;
  if (execution) {
    const Job = context.db.getModel('jobs');
    const ids = await Job.findAll({
      attributes: ['nodeId', [fn('MAX', col('id')), 'id']],
      where: { executionId: execution.id },
      group: ['nodeId'],
      raw: true,
    });
    const jobs = ids.length
      ? await Job.findAll({
          attributes: jobListFields,
          where: { executionId: execution.id, id: ids.map((job) => job.id) },
          order: [['id', 'ASC']],
        })
      : [];
    execution.setDataValue('jobs', jobs);
  }
  await next();
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
  const workflowPlugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
  const ExecutionRepo = context.db.getRepository('executions');
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
      await abortExecution(workflowPlugin, execution, { reason: EXECUTION_REASON.MANUAL_CANCEL });
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
    return context.throw(400, 'Only started executions can be rerun');
  }

  await workflowPlugin.rerun(execution, {
    nodeId,
    overwrite: overwrite === true,
  });

  context.body = execution;
  context.status = 202;
  await next();
}
