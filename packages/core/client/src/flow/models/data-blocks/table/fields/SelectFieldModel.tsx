/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React from 'react';
import { TableFieldModel } from '../TableFieldModel';
import { getCurrentOptions } from '../utils/utils';

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  icon: 'icon',
};
export class SelectColumnFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = ['select', 'multipleSelect', 'radioGroup', 'checkboxGroup'];

  public render() {
    const { dataSource } = this.componentProps;
    const value = this.field.value;
    const currentOptions = getCurrentOptions(value, dataSource, fieldNames);
    const content =
      value &&
      currentOptions.map((option, index) => (
        <Tag key={index} color={option[fieldNames.color]} icon={option.icon}>
          {option[fieldNames.label]}
        </Tag>
      ));
    return content as any;
  }
}
