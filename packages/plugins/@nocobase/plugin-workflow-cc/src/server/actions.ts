/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';

const workflowCcTasks = {
  async get(context: Context, next) {
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
    });
    return actions.get(context, next);
  },

  async listMine(context: Context, next) {
    context.action.mergeParams({
      filter: {
        userId: context.state.currentUser.id,
      },
    });
    return actions.list(context, next);
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
    context.action.mergeParams({
      filterByTk,
      filter: {
        userId: context.state.currentUser.id,
        status: 0,
      },
      values: {
        status: 1,
        readAt: new Date(),
      },
    });
    return actions.update(context, next);
  },

  async unread(context: Context, next) {
    const { filterByTk } = context.action.params;
    if (!filterByTk) {
      return context.throw(400, 'filterByTk is required for unread action');
    }
    context.action.mergeParams({
      filterByTk,
      filter: {
        userId: context.state.currentUser.id,
      },
      values: {
        status: 0,
        readAt: null,
      },
    });
    return actions.update(context, next);
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
