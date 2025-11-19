/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BindingOptions, defineAction, tExpr, DisplayItemModel } from '@nocobase/flow-engine';
import { DetailsItemModel } from '../models/blocks/details/DetailsItemModel';

export const pattern = defineAction({
  name: 'pattern',
  title: tExpr('Display mode'),
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
            label: tExpr('Editable'),
          },
          {
            value: 'disabled',
            label: tExpr('Disabled'),
          },

          {
            value: 'readPretty',
            label: tExpr('Display only'),
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
    const targetCollection = ctx.collectionField.targetCollection;
    const targetCollectionTitleField = targetCollection?.getField(
      ctx.model.subModels.field.props?.fieldNames?.label || ctx.model.props.titleField,
    );
    const { model } = ctx;
    if (params.pattern === 'readPretty') {
      const binding = DetailsItemModel.getDefaultBindingByField(ctx, ctx.collectionField, {
        fallbackToTargetTitleField: true,
        targetCollectionTitleField,
      });
      await rebuildFieldSubModel(ctx, model, binding);
    } else {
      const binding = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
      if (previousParams.pattern === 'readPretty') {
        await rebuildFieldSubModel(ctx, model, binding);
      }
    }
  },
  async beforeParamsSave(ctx, params, previousParams) {
    if (params.pattern === 'readPretty') {
      ctx.model.setProps({
        pattern: 'readPretty',
        disabled: false,
        titleField: (ctx.model.subModels?.field as any)?.props.fieldNames?.label || ctx.model.props.titleField,
      });
      if (ctx.collectionField.isAssociationField())
        await ctx.model.setStepParams('editItemSettings', 'titleField', {
          titleField: (ctx.model.subModels.field as any).props?.fieldNames?.label || ctx.model.props.titleField,
        });
    } else {
      ctx.model.setProps({
        disabled: params.pattern === 'disabled',
        pattern: 'editable',
      });
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
        pattern: null,
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

  await subModel.dispatchEvent('beforeRender');
  await model.save(); // 持久化
}
