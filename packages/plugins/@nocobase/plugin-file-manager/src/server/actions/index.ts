/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions from '@nocobase/actions';
import { createMiddleware } from './attachments';
import * as storageActions from './storages';

export default function ({ app }) {
  app.resourcer.use(async (ctx, next) => {
    if (ctx.action.resourceName === 'storages' && ['create', 'update'].includes(ctx.action.actionName)) {
      const { values } = ctx.action.params;
      if (values && values.renameMode) {
        values.options = {
          ...values.options,
          renameMode: values.renameMode,
        };
      }
    }
    await next();
    if (ctx.action.resourceName === 'storages' && ['get', 'list', 'create', 'update'].includes(ctx.action.actionName)) {
      const transform = (item) => {
        if (!item) return item;
        const data = item.toJSON ? item.toJSON() : item;
        if (data.options && data.options.renameMode) {
          data.renameMode = data.options.renameMode;
        }
        return data;
      };

      if (Array.isArray(ctx.body)) {
        ctx.body = ctx.body.map(transform);
      } else if (ctx.body && typeof ctx.body === 'object') {
        if (ctx.body.rows && Array.isArray(ctx.body.rows)) {
          ctx.body.rows = ctx.body.rows.map(transform);
        } else {
          ctx.body = transform(ctx.body);
        }
      }
    }
  });
  app.resourcer.define({
    name: 'storages',
    actions: storageActions,
  });
  app.resourcer.use(createMiddleware, { tag: 'createMiddleware', after: 'auth' });
  app.resourcer.registerActionHandler('upload', actions.create);
  app.resourcer.use(
    async (ctx, next) => {
      await next();
      try {
        const { resourceName, actionName } = ctx.action;
        const collection = ctx.db.getCollection(resourceName);
        if (collection?.options?.template !== 'file') {
          return;
        }
        if (actionName === 'create' || actionName === 'upload') {
          ctx.body = await ctx.body.reload();
        }
      } catch (error) {
        console.log(error);
      }
    },
    { before: 'dataWrapping' },
  );
}
