/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import type { FieldModel } from '../models/base/FieldModel';
import { getFieldBindingUse, rebuildFieldSubModel } from '../internal/utils/rebuildFieldSubModel';

export function buildAssociationOptions(ctx: any, itemModel, titleField?: string) {
  const { collectionField } = ctx;
  const classes = itemModel.getBindingsByField(ctx, collectionField);

  const makeOptions = (list: any[]) =>
    list.map((model) => {
      const m = ctx.engine.getModelClass(model.modelName);
      return { label: ctx.t(m.meta?.label || model.modelName), value: model.modelName };
    });

  if (titleField) {
    const titleFieldClasses = itemModel.getBindingsByField(ctx, collectionField.targetCollection.getField(titleField));

    return [
      classes.length && { label: ctx.t('AssociationField component'), options: makeOptions(classes) },
      { label: ctx.t('Title field component'), options: makeOptions(titleFieldClasses) },
    ].filter(Boolean);
  }

  return makeOptions(classes);
}

export const displayFieldComponent = defineAction({
  name: 'displayFieldComponent',
  title: tExpr('Field component'),
  uiMode: (ctx) => {
    const { titleField } = ctx.model.props;
    const options = buildAssociationOptions(ctx, ctx.model.constructor, titleField);
    return {
      type: 'select',
      key: 'use',
      props: {
        options,
      },
    };
  },
  hideInSettings: async (ctx: any) => {
    const { titleField } = ctx.model.props;
    if (!ctx.collectionField) {
      return true;
    }
    const classes = ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField);
    if (classes.length === 1 && !titleField) return true;
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
      await rebuildFieldSubModel({
        parentModel: ctx.model,
        targetUse: params.use,
        defaultProps:
          typeof selected?.defaultProps === 'function'
            ? selected.defaultProps(ctx, ctx.collectionField)
            : selected?.defaultProps,
        pattern: ctx.model.getProps().pattern,
      });
    }
  },
  defaultParams: (ctx: any) => {
    const defaultModel = ctx.model.constructor.getDefaultBindingByField(ctx, ctx.collectionField);
    const fieldModel = ctx.model.subModels.field as FieldModel | undefined;
    const bindingUse = getFieldBindingUse(fieldModel);
    return {
      use: bindingUse ?? fieldModel?.use ?? defaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    const bindingUse = getFieldBindingUse(ctx.model.subModels.field as FieldModel | undefined);
    if (params.use !== bindingUse) {
      ctx.model.setStepParams(ctx.flowKey, 'model', { use: params.use });
    }
    // if (!params.use) {
    //   throw new Error('model use is a required parameter');
    // }
  },
});
