/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';
import { FieldModel } from '../models/base/FieldModel';

export function buildAssociationOptions(ctx: any, itemModel, titleField?: string) {
  const { collectionField } = ctx;
  const classes = itemModel.getBindingsByField(ctx, collectionField);

  const makeOptions = (list: any[]) =>
    list.map((model) => {
      const m = ctx.engine.getModelClass(model.modelName);
      return { label: m.meta?.label || model.modelName, value: model.modelName };
    });

  if (titleField) {
    const titleFieldClasses = itemModel.getBindingsByField(ctx, collectionField.targetCollection.getField(titleField));

    return [
      classes.length && { label: escapeT('AssociationField component'), options: makeOptions(classes) },
      { label: escapeT('Title field component'), options: makeOptions(titleFieldClasses) },
    ].filter(Boolean);
  }

  return makeOptions(classes);
}

export const displayFieldComponent = defineAction({
  name: 'displayFieldComponent',
  title: escapeT('Field component'),
  uiSchema: (ctx: any) => {
    const { titleField } = ctx.model.props;
    if (!ctx.collectionField) {
      return;
    }
    const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
    if (classes.length === 1 && !titleField) return null;

    const options = buildAssociationOptions(ctx, ctx.model.constructor, titleField);
    return {
      use: {
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: options,
      },
    };
  },

  beforeParamsSave: async (ctx: any, params, previousParams) => {
    if (!ctx.collectionField) {
      return;
    }
    const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
    const { titleField } = ctx.model.props;
    let titleFieldClasses = [];
    if (titleField) {
      titleFieldClasses = ctx.model.constructor.getBindingsByField(
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
    const defaultModel = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
    return {
      use: (ctx.model.subModels.field as FieldModel)?.use || defaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    if (params.use !== ctx.model.subModels.field.use) {
      ctx.model.setStepParams(ctx.flowKey, 'model', { use: ctx.model.subModels.field.use });
    }
    // if (!params.use) {
    //   throw new Error('model use is a required parameter');
    // }
  },
});
