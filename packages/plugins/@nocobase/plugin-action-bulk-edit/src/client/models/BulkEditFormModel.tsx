/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, EditFormModel, FormBlockModel, BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import React from 'react';
import { tExpr } from '@nocobase/flow-engine';

/**
 * 批量编辑表单模型
 * 使用自定义的 BulkEditFormItemModel 替换标准的 FormItemModel
 */
export class BulkEditFormModel extends CreateFormModel {
  static scene = BlockSceneEnum.bulkEditForm;

  customModelClasses = {
    FormActionGroupModel: 'BulkEditFormActionGroupModel',
    FormItemModel: 'BulkEditFormItemModel', // 使用批量编辑专用的字段项
  };

  /**
   * 重写 defineChildren 方法，返回 undefined 表示不需要动态生成子菜单
   * 批量编辑场景下，collection 信息已经从上下文中确定，无需用户选择
   * 返回 undefined 会让系统直接使用 define 中的 createModelOptions，不展开子菜单
   */
  // static async defineChildren() {
  //   return undefined;
  // }
}

BulkEditFormModel.define({
  label: tExpr('Form'),
  children: false,
  createModelOptions: async (ctx, extra) => {
    const { associationName, collectionName, dataSourceKey } = ctx.view?.inputArgs || {};
    return {
      use: 'BulkEditFormModel',
      subModels: {
        grid: {
          use: 'FormGridModel',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: dataSourceKey,
            collectionName: collectionName,
          },
        },
      },
    };
  },
});
