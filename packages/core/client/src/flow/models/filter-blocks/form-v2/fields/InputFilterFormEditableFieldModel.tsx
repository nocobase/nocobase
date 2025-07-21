/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem, Input, Select } from '@formily/antd-v5';
import { FilterFormEditableFieldModel } from './FilterFormEditableFieldModel';
import React from 'react';
import { useFlowSettingsContext } from '@nocobase/flow-engine';
import { getAllDataModels } from '../utils';
import { CollectionBlockModel } from '../../../base/BlockModel';

export class InputFilterFormEditableFieldModel extends FilterFormEditableFieldModel {
  static readonly supportedFieldInterfaces = ['input', 'email', 'phone', 'uuid', 'url', 'sequence'];
  get component() {
    return [Input, {}];
  }

  addFilterGroupToTargetModels() {
    const operator = this.props.operator;
    const targets = this.props.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        if (this.field.value != null) {
          model.resource.addFilterGroup(this.uid, {
            [target.fieldPath]: {
              [operator]: this.field.value,
            },
          });
        } else {
          model.resource.removeFilterGroup(this.uid);
        }
      }
    });
  }

  removeFilterGroupFromTargetModels() {
    const operator = this.props.operator;
    const targets = this.props.targets || [];

    if (!operator || !targets.length) {
      return;
    }

    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.removeFilterGroup(this.uid);
      }
    });
  }

  doFilter() {
    const targets = this.props.targets || [];

    if (!targets.length) {
      return;
    }

    this.addFilterGroupToTargetModels();
    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.refresh();
      }
    });
  }

  doReset() {
    const targets = this.props.targets || [];

    if (!targets.length) {
      return;
    }

    this.removeFilterGroupFromTargetModels();
    targets.forEach((target) => {
      const model: CollectionBlockModel = this.flowEngine.getModel(target.modelUid);
      if (model) {
        model.resource.refresh();
      }
    });
  }
}

InputFilterFormEditableFieldModel.registerFlow({
  key: 'filterInputSettings',
  auto: true,
  title: 'Filter input settings',
  steps: {
    // 该步骤会被提取到公共的 action
    connectFields: {
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
    },
    defaultOperator: {
      title: 'Default operator',
      uiSchema(ctx) {
        const operators = ctx.model.context.collectionField.filterable?.operators || [];
        return {
          // 用于选择字段默认的操作
          operator: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Select',
            enum: operators,
          },
        };
      },
      defaultParams: (ctx) => {
        const operators = ctx.model.context.collectionField.filterable?.operators || [];
        const defaultOperator = operators[0]?.value;
        return {
          operator: defaultOperator,
        };
      },
      handler(ctx, params) {
        ctx.model.setProps('operator', params.operator);
      },
    },
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
