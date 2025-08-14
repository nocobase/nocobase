/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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

  // @reactive
  public render() {
    const { options = [], value } = this.props;
    console.log();
    const currentOptions = getCurrentOptions(value, options, fieldNames);
    const content: any =
      value &&
      currentOptions.map((option, index) => (
        <Tag key={option[fieldNames.value]} color={option[fieldNames.color]}>
          {option[fieldNames.label]}
        </Tag>
      ));
    return content;
  }
}
