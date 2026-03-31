/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CreateFormModel, BlockSceneEnum } from '@nocobase/client';

import { tExpr } from '@nocobase/flow-engine';

export class BulkEditFormModel extends CreateFormModel {
  static scene = BlockSceneEnum.bulkEditForm;

  getAclActionName() {
    return 'update';
  }

  customModelClasses = {
    FormActionGroupModel: 'BulkEditFormActionGroupModel',
    FormItemModel: 'BulkEditFormItemModel',
  };
}

BulkEditFormModel.define({
  label: tExpr('Form'),
  children: false,
  createModelOptions: async (ctx, extra) => {
    const { collectionName, dataSourceKey } = ctx.view?.inputArgs || {};
    return {
      use: 'BulkEditFormModel',
      subModels: {
        grid: {
          use: 'BulkEditFormGridModel',
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
