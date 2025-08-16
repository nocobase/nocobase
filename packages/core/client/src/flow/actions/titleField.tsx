/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, useFlowSettingsContext } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import { Select } from 'antd';
import React from 'react';
import { getUniqueKeyFromCollection } from '../../collection-manager/interfaces/utils';
import { isTitleField } from '../../data-source';
import { useCompile } from '../../schema-component';
import { FieldModel } from '../models/base/FieldModel';

const SelectOptions = (props) => {
  const flowContext = useFlowSettingsContext<FieldModel>();
  const compile = useCompile();
  const collectionField = flowContext.model.collectionField;
  const app = flowContext.app;
  const collectionManager = collectionField?.collection?.collectionManager;
  const dataSourceManager = app.dataSourceManager;
  const target = collectionField?.options?.target;
  if (!collectionManager || !target) return;
  const targetCollection = collectionManager.getCollection(target);
  const targetFields = targetCollection?.getFields?.() ?? [];
  const options = targetFields
    .filter((field) => isTitleField(dataSourceManager, field.options))
    .map((field) => ({
      value: field.name,
      label: compile(field.options.uiSchema?.title) || field.name,
    }));
  return <Select {...props} options={options} />;
};

export const titleField = defineAction({
  name: 'titleField',
  title: tval('Label field'),
  uiSchema: {
    label: {
      'x-component': SelectOptions,
      'x-decorator': 'FormItem',
    },
  },
  defaultParams: (ctx: any) => {
    const targetCollection = ctx.model.collectionField.targetCollection;
    const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
    return {
      label:
        ctx.model.field?.props?.fieldNames?.label ||
        ctx.model.props.fieldNames?.label ||
        targetCollection.options.titleField ||
        filterKey,
    };
  },
  async handler(ctx: any, params) {
    const target = ctx.model.collectionField.target;
    const targetCollection = ctx.model.collectionField.targetCollection;
    const filterKey = getUniqueKeyFromCollection(targetCollection.options as any);
    const label = params.label || targetCollection.options.titleField || filterKey;
    const newFieldNames = {
      value: filterKey,
      label,
    };
    ctx.model.setProps({ fieldNames: newFieldNames });
    const targetCollectionField = targetCollection.getField(label);
    const use = targetCollectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
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
    await model.applyAutoFlows();
  },
});
