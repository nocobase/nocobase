/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';

export const aclCheck = defineAction({
  name: 'aclCheck',
  async handler(ctx, params) {
    const result = await ctx.aclCheck({
      dataSourceKey: ctx.dataSource?.key,
      resourceName: ctx.collectionField?.collectionName || ctx.resourceName,
      actionName: ctx.actionName,
      fields: ctx?.collectionField && [ctx.collectionField.name],
      allowedActions: ctx.resource?.getMeta('allowedActions'),
      recordPkValue: ctx?.record && ctx.collection?.getFilterByTK?.(ctx?.record),
    });
    if (ctx.fieldPath && !ctx.collectionField) {
      ctx.model.fieldDeleted = true;
      ctx.model.hidden = true;
      ctx.exitAll();
    }
    if (!ctx.collection) {
      ctx.model.hidden = true;
      ctx.exitAll();
    }

    if (!result) {
      ctx.model.hidden = true;
      ctx.model.forbidden = {
        actionName: ctx.actionName,
      };
      ctx.exitAll();
    }
  },
});
