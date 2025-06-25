import React from 'react';
import { Tag } from 'antd';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';

interface FieldNames {
  value: string;
  label?: string;
}

interface Option {
  value: any;
  label: any;
}

function getCurrentOptions(value: any | any[], options: any[] = [], fieldNames: FieldNames): Option[] {
  const values = Array.isArray(value) ? value : [value];
  return values.map((val) => {
    const found = options.find((opt) => opt[fieldNames.value] == val);
    return (
      found ?? {
        value: val,
        label: val?.toString?.() ?? val,
      }
    );
  });
}

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
};

export class SelectReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'];

  public render() {
    const value = this.getValue();
    const { prefix = '', suffix = '', dataSource = [] } = this.props;
    const currentOptions = getCurrentOptions(value, dataSource, fieldNames);
    const content =
      value &&
      currentOptions.map((option, index) => (
        <Tag key={option[fieldNames.value]} color={option[fieldNames.color]}>
          {option[fieldNames.label]}
        </Tag>
      ));
    return (
      <div>
        {prefix}
        {content}
        {suffix}
      </div>
    );
  }
}

SelectReadPrettyFieldModel.registerFlow({
  key: 'selectOptions',
  auto: true,
  sort: 200,
  steps: {
    step1: {
      handler(ctx) {
        const collectionField = ctx.model.collectionField;
        ctx.model.setProps({ dataSource: collectionField.enum });
      },
    },
  },
});
