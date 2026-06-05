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
  if (!value) return undefined;
  // 如果是对象，取第一个 value
  if (typeof value === 'object') {
    return Object.values(value)[0];
  }
  // 原始值（number / string）
  return value;
};

type AclCheckRefreshStrategy = 'default' | 'formItem';

const resetAclDerivedState = (ctx: any) => {
  const model = ctx?.model;
  if (!model) return;

  // 仅清理由 ACL 检查设置的“禁止”状态；避免误清理用户配置导致的 hidden
  if (model.forbidden) {
    model.forbidden = null;
    if (typeof model.setHidden === 'function') {
      model.setHidden(false);
    } else {
      model.hidden = false;
    }
  }

  // 清理常见的 ACL 派生 props（不同模型可能使用不同字段）
  if (typeof model.setProps === 'function') {
    model.setProps({
      aclDisabled: undefined,
      aclCreateDisabled: undefined,
    });
  }
};

const runDefaultAclCheck = async (ctx: any) => {
  const result = await ctx.aclCheck({
    dataSourceKey: ctx.dataSource?.key,
    resourceName: ctx.collectionField?.collectionName || ctx.resourceName,
    actionName: ctx.actionName,
    fields: ctx?.collectionField && [ctx.collectionField.name],
    allowedActions: ctx.resource?.getMeta?.('allowedActions'),
    recordPkValue: getRecordPkValue(ctx?.record && ctx.collection?.getFilterByTK?.(ctx?.record)),
  });

  if (!ctx.actionName) {
    return;
  }
  if (!result) {
    ctx.model.setHidden?.(true);
    ctx.model.forbidden = {
      actionName: ctx.actionName,
    };
    ctx.exitAll?.();
  }
};

const runFormItemAclCheck = async (ctx: any) => {
  if (!ctx.collectionField) {
    return;
  }

  const blockActionName = ctx.blockModel?.context?.actionName;
  if (!blockActionName) {
    return;
  }

  const result = await ctx.aclCheck({
    dataSourceKey: ctx.dataSource?.key,
    resourceName: ctx.collectionField?.collectionName,
    fields: [ctx.collectionField?.name],
    actionName: blockActionName,
  });

  if (blockActionName === 'update') {
    // 编辑表单
    const resultView = await ctx.aclCheck({
      dataSourceKey: ctx.dataSource?.key,
      resourceName: ctx.collectionField?.collectionName,
      fields: [ctx.collectionField.name],
      actionName: 'view',
    });
    if (ctx.prefixFieldPath && ctx.item) {
      // 子表单下的新增
      const createFieldAclResult = await ctx.aclCheck({
        dataSourceKey: ctx.dataSource?.key,
        resourceName: ctx.collectionField?.collectionName,
        fields: [ctx.collectionField.name],
        actionName: 'create',
      });

      if (!createFieldAclResult) {
        ctx.model.setProps({
          aclCreateDisabled: true,
        });
      }
    }

    if (!resultView && !ctx.item?.__is_new__) {
      ctx.model.setHidden?.(true);
      ctx.model.forbidden = {
        actionName: 'view',
      };
      ctx.exitAll?.();
    }

    if (!result) {
      ctx.model.setProps({
        aclDisabled: true,
      });
    }
  } else if (blockActionName === 'create') {
    // 新增表单
    const updateCollectionAclResult = await ctx.aclCheck({
      dataSourceKey: ctx.dataSource?.key,
      resourceName: ctx.collectionField?.collectionName,
      actionName: 'update',
    });

    const updateFieldAclResult = await ctx.aclCheck({
      dataSourceKey: ctx.dataSource?.key,
      resourceName: ctx.collectionField?.collectionName,
      fields: [ctx.collectionField.name],
      actionName: 'update',
    });
    if (!result && !ctx.item?.__is_stored__) {
      // 子表单中选择的记录
      ctx.model.setHidden?.(true);
      ctx.model.forbidden = {
        actionName: blockActionName,
      };
      ctx.exitAll?.();
    }
    if (!updateCollectionAclResult || !updateFieldAclResult) {
      ctx.model.setProps({
        aclDisabled: true,
      });
    }
  }
};

export const aclCheckRefresh = defineAction({
  name: 'aclCheckRefresh',
  async handler(ctx, params) {
    const strategy: AclCheckRefreshStrategy = params?.strategy || 'default';

    // 先清理旧状态，避免翻页/fork 复用造成污染
    resetAclDerivedState(ctx);

    if (strategy === 'formItem') {
      await runFormItemAclCheck(ctx);
      return;
    }

    await runDefaultAclCheck(ctx);
  },
});
