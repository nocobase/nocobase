/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, useFlowSettingsContext } from '@nocobase/flow-engine';
import { FormItem, Select } from '@formily/antd-v5';
import React from 'react';
import { CollectionBlockModel } from '../../../base/BlockModel';
import { getAllDataModels } from '../utils';

export const connectFields = defineAction({
  name: 'connectFields',
  title: 'Connect fields',
  uiSchema: {
    targets: {
      type: 'array',
      'x-component': ConnectFields,
    },
  },
  handler(ctx, params) {
    ctx.model.setProps('targets', params.targets);
  },
});

function ConnectFields(props) {
  const ctx = useFlowSettingsContext();
  const allDataModels = getAllDataModels(ctx.blockGridModel);
  const [selectedValues, setSelectedValues] = React.useState({});

  const handleSelectChange = (modelUid: string, value: string) => {
    const newValues = {
      ...selectedValues,
      [modelUid]: {
        modelUid,
        fieldPath: value,
      },
    };

    if (!value) {
      delete newValues[modelUid];
    }

    setSelectedValues(newValues);

    // 汇总所有选择的值到数组中
    const allSelectedValues = Object.values(newValues).filter(Boolean);
    props.onChange?.(allSelectedValues);
  };

  return allDataModels.map((model: CollectionBlockModel) => {
    const fields = model.collection?.getFields?.() || [];

    const options = fields.map((field) => ({
      label: ctx.t(field.uiSchema?.title) || field.name,
      value: field.name,
    }));

    const value = props.value.find((item) => item.modelUid === model.uid)?.fieldPath;

    return (
      <FormItem label={model.title} key={model.uid}>
        <Select options={options} value={value} onChange={(value) => handleSelectChange(model.uid, value)} allowClear />
      </FormItem>
    );
  });
}
