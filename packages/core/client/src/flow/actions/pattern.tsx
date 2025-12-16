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
import { rebuildFieldSubModel } from '../internal/utils/rebuildFieldSubModel';

export const pattern = defineAction({
  name: 'pattern',
  title: tExpr('Display mode'),
  uiMode(ctx) {
    const t = ctx.t;
    return {
      type: 'select',
      key: 'pattern',
      props: {
        options: [
          {
            value: 'editable',
            label: t('Editable'),
          },
          {
            value: 'disabled',
            label: t('Disabled'),
          },

          {
            value: 'readPretty',
            label: t('Display only'),
          },
        ],
      },
    };
  },
  hideInSettings(ctx) {
    if (!ctx.model.collectionField) {
      return true;
    }
    return ctx.model.collectionField.inputable === false;
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
    const resolveDefaultProps = (binding, field = ctx.collectionField) => {
      if (!binding) return undefined;
      return typeof binding.defaultProps === 'function' ? binding.defaultProps(ctx, field) : binding.defaultProps;
    };
    if (params.pattern === 'readPretty') {
      const binding = DetailsItemModel.getDefaultBindingByField(ctx, ctx.collectionField, {
        fallbackToTargetTitleField: true,
        targetCollectionTitleField,
      });
      await rebuildFieldSubModel({
        parentModel: model,
        targetUse: binding.modelName,
        defaultProps: resolveDefaultProps(binding, targetCollectionTitleField || ctx.collectionField),
      });
    } else {
      const binding = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
      if (previousParams.pattern === 'readPretty') {
        await rebuildFieldSubModel({
          parentModel: model,
          targetUse: binding.modelName,
          defaultProps: resolveDefaultProps(binding),
        });
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
