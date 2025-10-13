/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, DisplayItemModel, useFlowSettingsContext } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Select } from 'antd';
import React from 'react';
import { isTitleField } from '../../data-source';
import { useCompile } from '../../schema-component';
import { FieldModel } from '../models/base/FieldModel';

export const SelectOptions = (props) => {
  const flowContext = useFlowSettingsContext<FieldModel>();
  const compile = useCompile();
  const collectionField = flowContext.model.context.collectionField;
  const app = flowContext.app;
  const dataSourceManager = app.dataSourceManager;
  const target = collectionField?.target;
  if (!target) return;
  const targetCollection = collectionField.targetCollection;
  const targetFields = targetCollection?.getFields?.() ?? [];
  const options = targetFields
    .filter((field) => isTitleField(dataSourceManager, field.options))
    .map((field) => ({
      value: field.name,
      label: compile(field.options.uiSchema?.title) || field.name,
    }));
  return (<Select {...props} options={options} />) as any;
};

export const titleField = defineAction({
  name: 'titleField',
  title: tval('Label field'),
  uiSchema: (ctx) => {
    if (!ctx.collectionField || !ctx.collectionField.isAssociationField()) {
      return null;
    }
    return {
      label: {
        'x-component': SelectOptions,
        'x-decorator': 'FormItem',
      },
    };
  },
  defaultParams: (ctx: any) => {
    const titleField = ctx.model.context.collectionField.targetCollectionTitleFieldName;
    return {
      label: ctx.model.props?.titleField || titleField,
    };
  },
  beforeParamsSave: async (ctx: any, params, previousParams) => {
    const target = ctx.model.collectionField.target;
    const targetCollection = ctx.model.collectionField.targetCollection;
    if (params.label !== previousParams.label) {
      const fieldUid = ctx.model.subModels['field']['uid'];
      await ctx.engine.destroyModel(fieldUid);
      const targetCollectionField = targetCollection.getField(params.label);
      const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
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
    const filterKey = targetCollection.filterTargetKey;
    const label = params.label;
    const newFieldNames = {
      value: filterKey,
      label,
    };
    ctx.model.setProps({ fieldNames: newFieldNames });
    const targetCollectionField = targetCollection.getField(label);
    const binding = DisplayItemModel.getDefaultBindingByField(ctx, targetCollectionField);
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
