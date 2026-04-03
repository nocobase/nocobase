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
          ...filter,
          'users.id': userId,
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
          ...record,
          read: currentUser?.usersAiWorkflowTasks?.read ?? false,
        };
      };

      if (Array.isArray(ctx.body?.data)) {
        ctx.body.data = ctx.body.data.map(parseRead);
      } else if (Array.isArray(ctx.body)) {
        ctx.body = ctx.body.map(parseRead);
      }

      await next();
    },
  },
};

export default aiWorkflowTasks;
