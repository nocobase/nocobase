/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import { uid } from '@nocobase/utils';

export default {
  name: 'flowModelTemplateUsages',
  actions: {
    async list(ctx: Context, next) {
      await actions.list(ctx, next);
    },

    async get(ctx: Context, next) {
      await actions.get(ctx, next);
    },

    async create(ctx: Context, next) {
      const values = ctx.action.params?.values || {};
      const templateUid = values.templateUid;
      const modelUid = values.modelUid;
      if (!templateUid || !modelUid) {
        return ctx.throw(400, 'templateUid and modelUid are required');
      }
      const usageRepo = ctx.db.getRepository('flowModelTemplateUsages');
      const record = await usageRepo.updateOrCreate({
        filterKeys: ['templateUid', 'modelUid'],
        values: {
          uid: values.uid || uid(),
          templateUid,
          modelUid,
        },
        context: ctx,
      });
      ctx.body = record;
      await next();
    },

    async destroy(ctx: Context, next) {
      const params = ctx.action?.params || {};
      const { filterByTk, values = {}, filter } = params;
      const templateUid = values.templateUid;
      const modelUid = values.modelUid;
      if (!filterByTk && templateUid && modelUid && !filter) {
        ctx.action.mergeParams({
          filter: {
            templateUid,
            modelUid,
          },
        });
      }
      await actions.destroy(ctx, next);
    },
  },
};
