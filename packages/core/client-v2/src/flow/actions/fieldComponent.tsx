/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CollectionFieldModel, defineAction, FlowEngineContext, tExpr } from '@nocobase/flow-engine';
import { DetailsItemModel } from '../models/blocks/details/DetailsItemModel';
import { buildAssociationOptions } from './displayFieldComponent';
import type { FieldModel } from '../models/base/FieldModel';
import { getFieldBindingUse, rebuildFieldSubModel } from '../internal/utils/rebuildFieldSubModel';

export const fieldComponent = defineAction({
  title: tExpr('Field component'),
  name: 'fieldComponent',
  uiMode: (ctx: any) => {
    if (ctx.model.getProps().pattern === 'readPretty') {
      const { titleField } = ctx.model.props;
      const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
      if (!classes || (classes.length === 1 && !titleField)) return null;

      const options = buildAssociationOptions(
        ctx,
        DetailsItemModel,
        titleField || ctx.model.subModels.field.props?.fieldNames?.label,
      );
      return {
        type: 'select',
        key: 'use',
        props: {
          options,
        },
      };
    } else {
      const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
      if (!classes || classes.length === 1) {
        return null;
      }
      return {
        type: 'select',
        key: 'use',
        props: {
          options: classes.map((model) => {
            const m = ctx.engine.getModelClass(model.modelName);
            return {
              label: ctx.t(m.meta?.label || model.modelName),
              value: model.modelName,
            };
          }),
        },
      };
    }
  },
  hideInSettings(ctx) {
    const { titleField } = ctx.model.props;
    const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
    if (ctx.model.getProps().pattern === 'readPretty') {
      if (!classes || (classes.length === 1 && !titleField)) return true;
    } else {
      if (!classes || classes.length === 1) {
        return true;
      }
    }
  },
  beforeParamsSave: async (ctx: any, params, previousParams) => {
    let classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
    let titleFieldClasses = [];

    if (ctx.model.getProps().pattern === 'readPretty') {
      const { titleField } = ctx.model.props;
      classes = DetailsItemModel.getBindingsByField(ctx, ctx.collectionField);
      if (titleField) {
        titleFieldClasses = DetailsItemModel.getBindingsByField(
          ctx,
          ctx.collectionField.targetCollection.getField(titleField),
        );
      }
    }

    // 找到选中的那条
    const selected = classes.concat(titleFieldClasses).find((model) => model.modelName === params.use);
    if (params.use !== previousParams.use) {
      const defaultProps =
        typeof selected?.defaultProps === 'function'
          ? selected.defaultProps(ctx, ctx.collectionField)
          : selected?.defaultProps;
      await rebuildFieldSubModel({
        parentModel: ctx.model,
        targetUse: params.use,
        defaultProps,
        pattern: ctx.model.getProps().pattern,
      });
    }
  },
  defaultParams: (ctx: any) => {
    const defaultModel =
      ctx.model.getProps().pattern === 'readPretty'
        ? DetailsItemModel.getDefaultBindingByField(ctx, ctx.collectionField)
        : ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
    const fieldModel = ctx.model.subModels.field as FieldModel | undefined;
    const bindingUse = getFieldBindingUse(fieldModel);
    return {
      use: bindingUse ?? fieldModel?.use ?? defaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    // if (!params?.use) {
    //   throw new Error('model use is a required parameter');
    // }
  },
});
