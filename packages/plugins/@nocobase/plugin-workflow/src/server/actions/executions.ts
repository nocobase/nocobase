/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import { Op } from '@nocobase/database';
import { EXECUTION_STATUS, JOB_STATUS } from '../constants';

export async function destroy(context: Context, next) {
  context.action.mergeParams({
    filter: {
      status: {
        [Op.ne]: EXECUTION_STATUS.STARTED,
      },
    },
  });

  await actions.destroy(context, next);
}

export async function cancel(context: Context, next) {
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

  await context.db.sequelize.transaction(async (transaction) => {
    await execution.update(
      {
        status: EXECUTION_STATUS.ABORTED,
      },
      { transaction },
    );

    const pendingJobs = execution.jobs.filter((job) => job.status === JOB_STATUS.PENDING);
    await JobRepo.update({
      values: {
        status: JOB_STATUS.ABORTED,
      },
      filter: {
        id: pendingJobs.map((job) => job.id),
      },
      individualHooks: false,
      transaction,
    });
  });

  context.body = execution;
  await next();
}
