/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, useStepSettingContext } from '@nocobase/flow-engine';
import { Select } from 'antd';
import React from 'react';
import { tval } from '@nocobase/utils/client';
import { useCompile } from '../../schema-component';
import { getUniqueKeyFromCollection } from '../../collection-manager/interfaces/utils';
import { isTitleField } from '../../data-source';

const SelectOptions = (props) => {
  const {
    model: { collectionField },
    app,
  } = useStepSettingContext();
  const compile = useCompile();
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
  title: tval('Title field'),
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
      label: ctx.model.props.fieldNames?.label || targetCollection.options.titleField || filterKey,
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
    ctx.model.setComponentProps({ fieldNames: newFieldNames });
    const targetCollectionField = targetCollection.getField(label);
    const use = targetCollectionField.getFirstSubclassNameOf('ReadPrettyFieldModel') || 'ReadPrettyFieldModel';
    const model = ctx.model.setSubModel('field', {
      use,
      stepParams: {
        default: {
          step1: {
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
