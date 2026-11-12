/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { sanitizeWorkflowTaskReadParams } from '@nocobase/plugin-workflow';
import { TASK_STATUS } from '../common/constants';
import { appendTempAssociationFields } from './tempAssociationFields';

const mergeAppends = (appends: string[] | undefined, required: string[]) => {
  const result = new Set([...(appends || [])]);
  required.forEach((item) => result.add(item));
  return Array.from(result);
};

async function updateReadStatus(context: Context, next: Next, readAt: Date | null) {
  context.action.mergeParams({
    filter: {
      userId: context.state.currentUser.id,
      ...(readAt && { status: TASK_STATUS.UNREAD }),
    },
  });
  const { filterByTk, filter } = context.action.params;
  context.body = await context.db.getRepository('workflowCcTasks').update({
    filterByTk,
    filter,
    values: { status: readAt ? TASK_STATUS.READ : TASK_STATUS.UNREAD, readAt },
    context,
  });
  context.status = 200;
  await next();
}

const workflowCcTasks = {
  async get(context: Context, next) {
    sanitizeWorkflowTaskReadParams(context);
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
    });
    return actions.get(context, next);
  },

  async listMine(context: Context, next) {
    sanitizeWorkflowTaskReadParams(context);
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
      appends: mergeAppends(context.action.params?.appends, ['node', 'workflow', 'workflow.nodes']),
    });
    await actions.list(context, next);
    await appendTempAssociationFields(context);
  },

  async read(context: Context, next) {
    const { filterByTk } = context.action.params;
    if (filterByTk) {
      const repository = context.app.db.getRepository('workflowCcTasks');
      const item = await repository.findOne({ where: { id: filterByTk } });
      if (!item) {
        return context.throw(404, 'Task not found');
      }
      if (item.userId !== context.state.currentUser.id) {
        return context.throw(403, 'You do not have permission to access this task');
      }
    }
    return updateReadStatus(context, next, new Date());
  },

  async unread(context: Context, next) {
    const { filterByTk } = context.action.params;
    if (!filterByTk) {
      return context.throw(400, 'filterByTk is required for unread action');
    }
    return updateReadStatus(context, next, null);
  },
};

function make(name, mod) {
  return Object.keys(mod).reduce(
    (result, key) => ({
      ...result,
      [`${name}:${key}`]: mod[key],
    }),
    {},
  );
}

export function initActions(app) {
  app.resourceManager.registerActionHandlers({
    ...make('workflowCcTasks', workflowCcTasks),
  });
}
