/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BindingOptions, defineAction, escapeT, DisplayItemModel } from '@nocobase/flow-engine';
import { DetailsItemModel } from '../models/blocks/details/DetailsItemModel';

export const pattern = defineAction({
  name: 'pattern',
  title: escapeT('Display mode'),
  uiSchema: (ctx) => {
    if (!ctx.model.collectionField) {
      return;
    }
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
        'x-disabled': ctx.model.collectionField.inputable === false,
      },
    };
  },
  defaultParams: (ctx) => {
    return {
      pattern:
        ctx.model.collectionField.inputable === false ||
        ctx.model.context.parentDisabled ||
        ctx.model.props.disabled ||
        ctx.model.collectionField.readonly
          ? 'disabled'
          : 'editable',
    };
  },
  afterParamsSave: async (ctx: any, params, previousParams) => {
    const { model } = ctx;

    if (params.pattern === 'readPretty') {
      const binding = DetailsItemModel.getDefaultBindingByField(ctx, ctx.collectionField, {
        fallbackToTargetTitleField: true,
      });
      await rebuildFieldSubModel(ctx, model, binding);
    } else {
      const binding = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
      if (previousParams.pattern === 'readPretty') {
        await rebuildFieldSubModel(ctx, model, binding);
      }
    }
  },

  handler(ctx, params) {
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

  await subModel.dispatchEvent('beforeRender', undefined, { sequential: true, useCache: true });
  await model.save(); // 持久化
}
