/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BindingOptions, defineAction, DisplayItemModel, EditableItemModel, escapeT } from '@nocobase/flow-engine';

export const pattern = defineAction({
  name: 'pattern',
  title: escapeT('Display mode'),
  uiSchema: (ctx) => {
    return {
      pattern: {
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          {
            value: 'editable',
            label: escapeT('Editable'),
          },
          {
            value: 'disabled',
            label: escapeT('Disabled'),
          },

          {
            value: 'readPretty',
            label: escapeT('Display only'),
          },
        ],
      },
    };
  },
  defaultParams: (ctx) => ({
    pattern: ctx.model.collectionField.readonly ? 'disabled' : 'editable',
  }),
  beforeParamsSave: async (ctx, params, previousParams) => {
    const { model } = ctx;

    if (params.pattern === 'readPretty') {
      const binding = DisplayItemModel.getDefaultBindingByField(ctx, ctx.collectionField);
      await rebuildFieldSubModel(ctx, model, binding);
    } else {
      const binding = EditableItemModel.getDefaultBindingByField(ctx, ctx.collectionField);
      if (previousParams.pattern === 'readPretty') {
        await rebuildFieldSubModel(ctx, model, binding);
      }
    }
  },

  async handler(ctx, params) {
    if (params.pattern === 'readPretty') {
      ctx.model.setProps({
        pattern: 'readPretty',
      });
    } else {
      ctx.model.setProps({
        disabled: params.pattern === 'disabled',
      });
    }
  },
});

async function rebuildFieldSubModel(ctx, model, binding: BindingOptions) {
  if (!binding) return;

  const fieldUid = model.subModels['field']?.['uid'];
  if (fieldUid) {
    await ctx.engine.destroyModel(fieldUid);
  }

  const defaultProps =
    typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, {} as any) : binding.defaultProps;

  const subModel = model.setSubModel('field', {
    use: binding.modelName,
    props: defaultProps || {},
    stepParams: {
      fieldSettings: {
        init: model.getFieldSettingsInitParams(),
      },
    },
  });

  await subModel.applyAutoFlows();
  await model.save(); // 持久化
}
