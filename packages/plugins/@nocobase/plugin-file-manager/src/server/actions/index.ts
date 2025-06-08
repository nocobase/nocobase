/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import actions, { Context } from '@nocobase/actions';
import { createMiddleware } from './attachments';
import * as storageActions from './storages';
import Plugin from '..';

async function viewFile(ctx: Context) {
  const { resourceName } = ctx.action;
  const collection = ctx.db.getCollection(resourceName);
  if (!collection) {
    return ctx.throw(404, `Collection "${resourceName}" not found`);
  }

  if (collection.options.template !== 'file') {
    return ctx.throw(400, `Collection "${resourceName}" is not a file collection`);
  }

  // TODO: acl should use same as get action

  const { filterByTk, preview, fieldPath } = ctx.action.params;
  if (!fieldPath) {
    return ctx.throw(400, 'Parameter "fieldPath" is required for view file');
  }

  const { repository } = collection;
  const record = await repository.findOne({
    filter: {
      uuid: filterByTk,
    },
  });

  const { tokenStatus, user, jti, temp, signInTime, roleName } = await ctx.auth.checkToken();
  console.log('---------', user, roleName);

  const filePlugin = ctx.app.pm.get(Plugin) as Plugin;
  const url = await filePlugin.getFileURL(record, Boolean(preview));

  ctx.redirect(url);
}

export default function ({ app }) {
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

  app.resourcer.registerActionHandler('viewFile', viewFile);
}
