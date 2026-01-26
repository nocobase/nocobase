/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, FormBlockModel, BlockSceneEnum, CollectionBlockModel } from '@nocobase/client';
import React from 'react';

/**
 * 批量编辑表单模型
 * 使用自定义的 BulkEditFormItemModel 替换标准的 FormItemModel
 */
export class BulkEditFormModel extends CreateFormModel {
  static scene = BlockSceneEnum.new;

  customModelClasses = {
    FormActionGroupModel: 'BulkEditFormActionGroupModel',
    FormItemModel: 'BulkEditFormItemModel', // 使用批量编辑专用的字段项
  };
}
BulkEditFormModel.define({
  label: 'Bulk Edit Form',
  createModelOptions: async (ctx, extra) => {
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
            dataSourceKey: ctx.collection?.dataSourceKey,
            collectionName: ctx.collection?.name,
          },
        },
      },
    };
  },
});
