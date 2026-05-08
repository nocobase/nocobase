/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next, utils } from '@nocobase/actions';
import { EXECUTION_STATUS } from '../constants';
import PluginWorkflowServer from '../Plugin';
import { NAMESPACE } from '../../common/constants';

export async function resume(context: Context, next: Next) {
  const repository = utils.getRepositoryFromParams(context);
  const workflowPlugin = context.app.pm.get(PluginWorkflowServer) as PluginWorkflowServer;
  const { filterByTk, values = {} } = context.action.params;
  const job = await repository.findOne({
    filterByTk,
  });
  if (!job) {
    return context.throw(404, 'Job not found');
  }
  workflowPlugin.getLogger(job.workflowId).warn(`Resuming job #${job.id}...`);
  const execution = await job.getExecution();
  if (!execution) {
    return context.throw(400, 'Execution is not running');
  }
  if (await workflowPlugin.abortExecutionIfExpired(execution)) {
    return context.throw(400, context.t('Execution timed out', { ns: NAMESPACE }));
  }
  if (execution.status !== EXECUTION_STATUS.STARTED) {
    return context.throw(400, 'Execution is not running');
  }
  await job.update(values);

  context.body = job;
  context.status = 202;
  await next();

  job.execution = execution;
  workflowPlugin.resume(job);
}
