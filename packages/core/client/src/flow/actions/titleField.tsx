/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, DisplayItemModel, FlowModelContext, tExpr } from '@nocobase/flow-engine';
import { isTitleField } from '../../data-source';

const normalizeFilterTargetKey = (filterTargetKey: any) => {
  if (typeof filterTargetKey === 'string') {
    return filterTargetKey;
  }
  if (Array.isArray(filterTargetKey) && filterTargetKey.length === 1) {
    return filterTargetKey[0];
  }
  return undefined;
};

const resolveTargetCollectionField = (targetCollection: any, label?: string) => {
  if (!targetCollection) {
    return null;
  }
  const normalizedLabel =
    label || targetCollection.titleCollectionField?.name || normalizeFilterTargetKey(targetCollection.filterTargetKey);
  if (!normalizedLabel) {
    return null;
  }
  return targetCollection.getField(normalizedLabel);
};

export const titleField = defineAction({
  name: 'titleField',
  title: tExpr('Title field'),
  uiMode: (ctx) => {
    const targetCollection = ctx.collectionField.targetCollection;
    const dataSourceManager = ctx.app.dataSourceManager;
    const targetFields = targetCollection?.getFields?.() ?? [];
    const options = targetFields
      .filter((field) => isTitleField(dataSourceManager, field.options))
      .map((field) => ({
        value: field.name,
        label: field?.title,
      }));
    return {
      type: 'select',
      key: 'label',
      props: {
        options,
      },
    };
  },
  defaultParams: (ctx: any) => {
    const titleField = ctx.model.context.collectionField.targetCollectionTitleFieldName;
    return {
      label: ctx.model.parent?.props?.titleField || ctx.model.props.titleField || titleField,
    };
  },
  hideInSettings: async (ctx: FlowModelContext) => {
    return (
      !ctx.collectionField ||
      !ctx.collectionField.isAssociationField() ||
      (ctx.model.subModels.field as any)?.disableTitleField
    );
  },
  beforeParamsSave: async (ctx: any, params, previousParams) => {
    const target = ctx.model.collectionField.target;
    const targetCollection = ctx.model.collectionField.targetCollection;
    if (params.label !== previousParams.label) {
      const fieldUid = ctx.model.subModels['field']?.['uid'];
      if (fieldUid) {
        await ctx.engine.destroyModel(fieldUid);
      }
      const targetCollectionField = resolveTargetCollectionField(targetCollection, params.label);
      if (!targetCollectionField) {
        return;
      }
      const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
      if (!binding) {
        return;
      }
      const use = binding.modelName;
      const model = ctx.model.setSubModel('field', {
        use,
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: ctx.model.collectionField.dataSourceKey,
              collectionName: target,
              fieldPath: params.label,
            },
          },
        },
      });
      await model.save();
      await model.dispatchEvent('beforeRender');
      // 持久化
      await ctx.model.save();
    }
  },

  async handler(ctx: any, params) {
    const target = ctx.model.collectionField.target;
    const targetCollection = ctx.model.collectionField.targetCollection;
    const targetCollectionField = resolveTargetCollectionField(targetCollection, params.label);
    if (!targetCollectionField) {
      return;
    }
    const filterKey = normalizeFilterTargetKey(targetCollection.filterTargetKey) || targetCollectionField.name;
    const label = targetCollectionField.name;
    const newFieldNames = {
      value: filterKey,
      label,
    };
    ctx.model.setProps({ fieldNames: newFieldNames });
    const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
    if (!binding) {
      return;
    }
    const use = binding.modelName;
    if (!ctx.model.subModels['field']) {
      const model = ctx.model.setSubModel('field', {
        use,
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: ctx.model.collectionField.dataSourceKey,
              collectionName: target,
              fieldPath: newFieldNames.label,
            },
          },
        },
      });
      // await model.save();
      await model.dispatchEvent('beforeRender');
    }
  },
});
