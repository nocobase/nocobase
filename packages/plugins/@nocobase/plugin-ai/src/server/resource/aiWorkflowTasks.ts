/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context, Next } from '@nocobase/actions';
import { ResourceOptions } from '@nocobase/resourcer';

export const aiWorkflowTasks: ResourceOptions = {
  name: 'aiWorkflowTasks',
  actions: {
    list: async (ctx: Context, next: Next) => {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const filter = ctx.action.params.filter || {};
      const appends = Array.isArray(ctx.action.params.appends)
        ? ctx.action.params.appends
        : ctx.action.params.appends
          ? [ctx.action.params.appends]
          : [];

      if (!appends.includes('users')) {
        appends.push('users');
      }

      ctx.action.mergeParams({
        filter: {
          $and: [
            filter,
            {
              'users.id': userId,
            },
          ],
        },
        appends,
      });

      await actions.list(ctx, async () => {});

      const parseRead = (record: any) => {
        const users = record?.users || [];
        const currentUser = users.find(
          (user: { id?: string | number; usersAiWorkflowTasks?: { read?: boolean } }) =>
            String(user?.id) === String(userId),
        );
        return {
          ...(record?.toJSON() ?? {}),
          read: currentUser?.usersAiWorkflowTasks?.read ?? false,
        };
      };

      ctx.body.rows = ctx.body.rows.map(parseRead);

      await next();
    },
    unreadCount: async (ctx: Context, next: Next) => {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const usersAiWorkflowTasksModel = ctx.db.getModel('usersAiWorkflowTasks');
      const count = await usersAiWorkflowTasksModel.count({
        where: {
          userId,
          read: false,
        },
      });

      ctx.body = {
        count,
      };

      await next();
    },
    getBySession: async (ctx: Context, next: Next) => {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const sessionId = ctx.action.params.values?.sessionId;
      if (!sessionId) {
        return ctx.throw(400, 'sessionId is required');
      }

      const task = await ctx.db.getRepository('aiWorkflowTasks').findOne({
        filter: {
          sessionId,
          'users.id': userId,
        },
      });

      if (!task) {
        return ctx.throw(404, 'workflow task not found');
      }

      const usersAiWorkflowTasks = await ctx.db.getModel('usersAiWorkflowTasks').findOne({
        where: {
          aiWorkflowTaskId: task.id,
          userId,
        },
      });

      const node = await ctx.db.getRepository('flow_nodes').findOne({
        filter: {
          id: task.nodeId,
        },
      });

      ctx.body = {
        ...(task?.toJSON?.() ?? task),
        read: usersAiWorkflowTasks?.read ?? false,
        config: node?.config ?? null,
      };

      await next();
    },
    accept: async (ctx: Context, next: Next) => {
      const userId = ctx.auth?.user.id;
      if (!userId) {
        return ctx.throw(403);
      }

      const sessionId = ctx.action.params.values?.sessionId;
      if (!sessionId) {
        return ctx.throw(400, 'sessionId is required');
      }

      const task = await ctx.db.getRepository('aiWorkflowTasks').findOne({
        filter: {
          sessionId,
          'users.id': userId,
        },
      });

      if (!task) {
        return ctx.throw(404, 'workflow task not found');
      }

      const aiWorkflowTasksModel = ctx.db.getModel('aiWorkflowTasks');
      const [acceptedCount] = await aiWorkflowTasksModel.update(
        {
          acceptedUserId: userId,
          status: 'pending_approval',
        },
        {
          where: {
            id: task.id,
            acceptedUserId: null,
            status: 'pending_acceptance',
          },
        },
      );

      const usersAiWorkflowTasksModel = ctx.db.getModel('usersAiWorkflowTasks');
      const [readCount] = await usersAiWorkflowTasksModel.update(
        {
          read: true,
        },
        {
          where: {
            aiWorkflowTaskId: task.id,
            userId,
          },
        },
      );

      const latestTask = await ctx.db.getRepository('aiWorkflowTasks').findOne({
        filter: {
          id: task.id,
        },
      });

      ctx.body = {
        accepted: acceptedCount > 0,
        readUpdated: readCount > 0,
        acceptedUserId: latestTask?.acceptedUserId ?? null,
      };

      await next();
    },
  },
};

export default aiWorkflowTasks;
