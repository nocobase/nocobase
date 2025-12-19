/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction } from '@nocobase/flow-engine';

const getRecordPkValue = (value: any) => {
  if (value == null) return undefined;

  // 如果是对象，取第一个 value
  if (typeof value === 'object') {
    return Object.values(value)[0];
  }

  // 原始值（number / string）
  return value;
};

export const aclCheck = defineAction({
  name: 'aclCheck',
  async handler(ctx, params) {
    const result = await ctx.aclCheck({
      dataSourceKey: ctx.dataSource?.key,
      resourceName: ctx.collectionField?.collectionName || ctx.resourceName,
      actionName: ctx.actionName,
      fields: ctx?.collectionField && [ctx.collectionField.name],
      allowedActions: ctx.resource?.getMeta('allowedActions'),
      recordPkValue: getRecordPkValue(ctx?.record && ctx.collection?.getFilterByTK?.(ctx?.record)),
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
