/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';
import { FieldModel } from '../models/base/FieldModel';

export const aclCheck = defineAction({
  name: 'aclCheck',
  async handler(ctx, params) {
    {
      const result = await ctx.aclCheck({
        dataSourceKey: ctx.model.context.dataSource.key,
        resourceName: ctx.model.context.resourceName,
        actionName: ctx.model.context.actionName,
        fields: (ctx.model as FieldModel)?.collectionField && [(ctx.model as FieldModel).collectionField.name],
      });
      if (!result) {
        ctx.model.hidden = true;
        ctx.exitAll();
      }
    }
  },
});
