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
import { EXECUTION_REASON, EXECUTION_STATUS } from '../constants';
import { abortExecution } from '../utils';

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

  await abortExecution(workflowPlugin, execution, { reason: EXECUTION_REASON.MANUAL_CANCEL });

  context.body = execution;
  await next();
}
