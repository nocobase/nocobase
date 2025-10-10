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
      dataSourceKey: ctx.model.context.dataSource?.key,
      resourceName: ctx.model.context.resourceName,
      actionName: ctx.model.context.actionName,
      fields: ctx.model.context?.collectionField && [ctx.model.context.collectionField.name],
    });
    if (ctx.fieldPath && !ctx.collectionField) {
      ctx.model.fieldDeleted = true;
      ctx.model.hidden = true;
      ctx.exitAll();
    }
    if (!result) {
      ctx.model.hidden = true;
      ctx.exitAll();
    }
  },
});
