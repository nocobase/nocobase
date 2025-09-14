/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, DisplayItemModel, escapeT } from '@nocobase/flow-engine';
import { FieldModel } from '../models/base/FieldModel';

export const displayFieldComponent = defineAction({
  name: 'displayFieldComponent',
  title: escapeT('Field component'),
  uiSchema: (ctx: any) => {
    const { titleField } = ctx.model.props;
    const classes = DisplayItemModel.getBindingsByField(ctx, ctx.collectionField);
    if (classes.length === 1) return null;

    const makeOptions = (list) =>
      list.map((model) => {
        const m = ctx.engine.getModelClass(model.modelName);
        return { label: m.meta.label || model.modelName, value: model.modelName };
      });

    let options;
    if (titleField) {
      const titleFieldClasses = DisplayItemModel.getBindingsByField(
        ctx,
        ctx.collectionField.targetCollection.getField(titleField),
      );
      options = [
        { label: escapeT('AssociationField component'), options: makeOptions(classes) },
        { label: escapeT('Title field component'), options: makeOptions(titleFieldClasses) },
      ];
    } else {
      options = makeOptions(classes);
    }
    return {
      use: {
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: options,
      },
    };
  },

  beforeParamsSave: async (ctx, params, previousParams) => {
    const classes = DisplayItemModel.getBindingsByField(ctx, ctx.collectionField);
    const { titleField } = ctx.model.props;
    let titleFieldClasses = [];
    if (titleField) {
      titleFieldClasses = DisplayItemModel.getBindingsByField(
        ctx,
        ctx.collectionField.targetCollection.getField(titleField),
      );
    }

    // 找到选中的那条
    const selected = classes.concat(titleFieldClasses).find((model) => model.modelName === params.use);
    if (params.use !== previousParams.use) {
      const fieldUid = ctx.model.subModels['field']['uid'];
      await ctx.engine.destroyModel(fieldUid);
      ctx.model.setSubModel('field', {
        use: params.use,
        props: selected?.defaultProps,
        stepParams: {
          fieldSettings: {
            init: (ctx.model as any).getFieldSettingsInitParams(),
          },
        },
      });
      // 持久化
      await ctx.model.save();
    }
  },
  defaultParams: (ctx: any) => {
    const defaultModel = DisplayItemModel.getDefaultBindingByField(ctx, ctx.collectionField);
    return {
      use: (ctx.model.subModels.field as FieldModel)?.use || defaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    // if (!params.use) {
    //   throw new Error('model use is a required parameter');
    // }
  },
});
