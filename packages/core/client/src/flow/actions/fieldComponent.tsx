/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionFieldModel,
  defineAction,
  DisplayItemModel,
  EditableItemModel,
  FlowEngineContext,
} from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { FieldModel } from '../models/base/FieldModel';

export const fieldComponent = defineAction({
  title: tval('Field component'),
  name: 'fieldComponent',
  uiSchema: (ctx: FlowEngineContext) => {
    const classes =
      ctx.model.getProps().pattern === 'readPretty'
        ? DisplayItemModel.getBindingsByField(ctx, ctx.collectionField)
        : EditableItemModel.getBindingsByField(ctx, ctx.collectionField);
    if (classes.length === 1) {
      return null;
    }
    return {
      use: {
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: classes.map((model) => {
          const m = ctx.engine.getModelClass(model.modelName);
          return {
            label: m.meta.label || model.modelName,
            value: model.modelName,
          };
        }),
      },
    };
  },
  beforeParamsSave: async (ctx, params, previousParams) => {
    const classes =
      ctx.model.getProps().pattern === 'readPretty'
        ? DisplayItemModel.getBindingsByField(ctx, ctx.collectionField)
        : EditableItemModel.getBindingsByField(ctx, ctx.collectionField);
    // 找到选中的那条
    const selected = classes.find((model) => model.modelName === params.use);
    if (params.use !== previousParams.use) {
      const fieldUid = ctx.model.subModels['field']['uid'];
      await ctx.engine.destroyModel(fieldUid);
      ctx.model.setSubModel('field', {
        use: params.use,
        props: selected.defaultProps,
        stepParams: {
          fieldSettings: {
            init: (ctx.model as FieldModel).getFieldSettingsInitParams(),
          },
        },
      });
      // 持久化
      await ctx.model.save();
    }
  },
  defaultParams: (ctx: any) => {
    const defaultModel =
      ctx.model.getProps().pattern === 'readPretty'
        ? DisplayItemModel.getDefaultBindingByField(ctx, ctx.collectionField)
        : EditableItemModel.getDefaultBindingByField(ctx, ctx.collectionField);

    return {
      use: (ctx.model.subModels.field as FieldModel).use || defaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    // if (!params?.use) {
    //   throw new Error('model use is a required parameter');
    // }
  },
});
