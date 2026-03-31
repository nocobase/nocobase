/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, DisplayItemModel } from '@nocobase/flow-engine';
import { titleField } from '@nocobase/client';

// 重新实现 RecordSelectFieldModel 中 titleField 的 bulkEditTitleField 版本
export const bulkEditTitleField = defineAction({
  ...titleField,
  name: 'bulkEditTitleField',
  // title: 'Bulk Edit Title Field',
  beforeParamsSave: async (ctx: any, params, previousParams) => {
    const target = ctx.model.collectionField.target;
    const targetCollection = ctx.model.collectionField?.targetCollection;
    const filedModel = ctx.model.subModels['field']?.subModels?.['field'];

    if (params.label !== previousParams.label) {
      const fieldUid = filedModel.subModels['field']?.['uid'];
      if (fieldUid) {
        await ctx.engine.destroyModel(fieldUid);
      }
      const targetCollectionField = targetCollection.getField(params.label);
      const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
      const use = binding.modelName;
      const model = filedModel.setSubModel('field', {
        use,
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: ctx.model.collectionField.dataSourceKey,
              collectionName: target,
              fieldPath: params.label,
            },
          },
        },
      });
      await model.save();
      await model.dispatchEvent('beforeRender');
      // 持久化
      await filedModel.save();
    }
  },

  async handler(ctx: any, params) {
    const target = ctx.model.collectionField?.target;
    const targetCollection = ctx.model.collectionField?.targetCollection;
    if (!targetCollection) {
      return;
    }
    const filterKey = targetCollection?.filterTargetKey;
    const label = params.label;
    const newFieldNames = {
      value: filterKey,
      label,
    };
    const filedModel = ctx.model.subModels['field']?.subModels?.['field'];
    filedModel.setProps({ fieldNames: newFieldNames });
    ctx.model.subModels['field'].setProps({ fieldNames: newFieldNames });
    const targetCollectionField = targetCollection.getField(label);
    const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
    const use = binding.modelName;

    const model = filedModel.setSubModel('field', {
      use,
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: ctx.model.collectionField.dataSourceKey,
            collectionName: target,
            fieldPath: newFieldNames.label,
          },
        },
      },
    });
    // await model.save();
    await model.dispatchEvent('beforeRender');
  },
});
