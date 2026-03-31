/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { DetailsItemModel } from '@nocobase/client';
import type { FieldModel } from '@nocobase/client';
import { getFieldBindingUse, rebuildFieldSubModel } from './rebuildFieldSubModel';

const bulkEditExcludedBindingModels = new Set([
  'SubFormFieldModel',
  'SubFormListFieldModel',
  'SubTableFieldModel',
  'PopupSubTableFieldModel',
]);

function filterBindings(classes: any[]) {
  return (classes || []).filter((model) => !bulkEditExcludedBindingModels.has(model.modelName));
}

function buildAssociationOptions(ctx: any, itemModel: any, titleField?: string) {
  const { collectionField } = ctx;
  const classes = filterBindings(itemModel.getBindingsByField(ctx, collectionField));

  const makeOptions = (list: any[]) =>
    list.map((model) => {
      const m = ctx.engine.getModelClass(model.modelName);
      return { label: ctx.t(m.meta?.label || model.modelName), value: model.modelName };
    });

  if (titleField) {
    const titleFieldClasses = filterBindings(
      itemModel.getBindingsByField(ctx, collectionField.targetCollection.getField(titleField)),
    );

    return [
      classes.length && { label: ctx.t('AssociationField component'), options: makeOptions(classes) },
      { label: ctx.t('Title field component'), options: makeOptions(titleFieldClasses) },
    ].filter(Boolean);
  }

  return makeOptions(classes);
}

export const bulkEditFieldComponent = defineAction({
  title: tExpr('Field component'),
  name: 'bulkEditFieldComponent',
  uiMode: (ctx: any) => {
    if (ctx.model.getProps().pattern === 'readPretty') {
      const { titleField } = ctx.model.props;
      const classes = filterBindings(ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField));
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
    }

    const classes = filterBindings(ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField));
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
  },
  hideInSettings(ctx) {
    const { titleField } = ctx.model.props;
    const classes = filterBindings(ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField));
    if (ctx.model.getProps().pattern === 'readPretty') {
      if (!classes || (classes.length === 1 && !titleField)) return true;
    } else {
      if (!classes || classes.length === 1) {
        return true;
      }
    }
  },
  beforeParamsSave: async (ctx: any, params, previousParams) => {
    let classes = filterBindings(ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField));
    let titleFieldClasses = [];

    if (ctx.model.getProps().pattern === 'readPretty') {
      const { titleField } = ctx.model.props;
      classes = filterBindings(DetailsItemModel.getBindingsByField(ctx, ctx.collectionField));
      if (titleField) {
        titleFieldClasses = filterBindings(
          DetailsItemModel.getBindingsByField(ctx, ctx.collectionField.targetCollection.getField(titleField)),
        );
      }
    }

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
    const classes = filterBindings(
      ctx.model.getProps().pattern === 'readPretty'
        ? DetailsItemModel.getBindingsByField(ctx, ctx.collectionField)
        : ctx.model.constructor.getBindingsByField(ctx, ctx.collectionField),
    );
    const resolvedDefaultModel =
      defaultModel && bulkEditExcludedBindingModels.has(defaultModel.modelName)
        ? classes.find((model) => model.modelName && !bulkEditExcludedBindingModels.has(model.modelName)) ||
          defaultModel
        : defaultModel;
    const fieldModel = ctx.model.subModels.field as FieldModel | undefined;
    const bindingUse = getFieldBindingUse(fieldModel);
    return {
      use: bindingUse ?? fieldModel?.use ?? resolvedDefaultModel.modelName,
    };
  },
  async handler(ctx, params) {
    // No-op: the change is handled in beforeParamsSave.
  },
});
