/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineFlow, escapeT, FlowModel, FlowModelContext } from '@nocobase/flow-engine';

export const openViewFlow = defineFlow<FlowModel>({
  key: 'popupSettings',
  title: escapeT('Popup settings'),
  on: 'click',
  steps: {
    openView: {
      use: 'openView',
    },
  },
  // 基于上下文推导 openView 的默认参数：在模型实例化时写入（仅填充缺失项）
  defaultParams: (ctx: FlowModelContext) => {
    let collectionName: string | undefined;
    let dataSourceKey: string | undefined;
    let associationName: string | undefined;

    // 字段上下文：兼容关联字段/普通字段
    const field = ctx.collectionField;
    const blockModel = ctx.blockModel;

    if (field?.isAssociationField?.()) {
      const targetCollection = field.targetCollection;
      const sourceCollection = blockModel?.collection;
      collectionName = targetCollection?.name;
      dataSourceKey = targetCollection?.dataSourceKey;
      associationName = sourceCollection?.name && field?.name ? `${sourceCollection.name}.${field.name}` : undefined;
    } else if (field) {
      // 非关联字段：用当前集合 + 字段 target
      collectionName = ctx.collection?.name;
      dataSourceKey = ctx.collection?.dataSourceKey;
      associationName = field?.target;
    } else {
      // 非字段上下文，例如按钮/动作
      collectionName = ctx.collection?.name;
      dataSourceKey = ctx.collection?.dataSourceKey;
      associationName = ctx.association?.resourceName;
    }

    return {
      openView: {
        collectionName,
        associationName,
        dataSourceKey,
      },
    };
  },
});

export const getOpenViewStepParams = (
  model: FlowModel,
): {
  collectionName: string;
  dataSourceKey: string;
  associationName?: string;
  mode?: string;
  size?: string;
} => {
  return model.getStepParams('popupSettings', 'openView');
};
