/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineFlow, tExpr, FlowModel, FlowModelContext, CollectionField } from '@nocobase/flow-engine';

export const openViewFlow = defineFlow<FlowModel>({
  key: 'popupSettings',
  title: tExpr('Popup settings'),
  on: 'click',
  sort: 300,
  steps: {
    openView: {
      use: 'openView',
      hideInSettings: async (ctx) => {
        const clickToOpen = ctx.model.getStepParams?.('displayFieldSettings', 'clickToOpen')?.clickToOpen;
        if (!ctx.collectionField) {
          return false;
        }
        if (clickToOpen === undefined) {
          return !ctx.collectionField?.isAssociationField() || ctx.disableFieldClickToOpen;
        }
        return clickToOpen === false;
      },
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
    const associationPathName = ctx.model?.parent?.['associationPathName'];
    const fieldCollection = ctx.collection || blockModel?.collection;
    const isAssociationField = (target?: CollectionField | null): target is CollectionField =>
      !!target?.isAssociationField?.();
    const associationField =
      !isAssociationField(field) && associationPathName
        ? fieldCollection?.getFieldByPath?.(associationPathName)
        : undefined;
    const assocField = isAssociationField(field) ? field : associationField;

    if (isAssociationField(assocField)) {
      const targetCollection = assocField.targetCollection;
      const sourceCollection = blockModel?.collection;
      collectionName = targetCollection?.name;
      dataSourceKey = targetCollection?.dataSourceKey;
      associationName = assocField?.resourceName;
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
