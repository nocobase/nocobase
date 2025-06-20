/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';
import React from 'react';
import { Tag } from 'antd';
import { TableFieldModel } from './TableFieldModel';
import { getCurrentOptions } from '../utils/utils';

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
};
export class TableSelectFieldModel extends TableFieldModel {
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

TableSelectFieldModel.registerFlow({
  key: 'selectOptions',
  auto: true,
  sort: 200,
  steps: {
    step1: {
      handler(ctx) {
        console.log(ctx);
        const collectionField = ctx.model.collectionField;
        ctx.model.setProps({ dataSource: collectionField.enum });
      },
    },
  },
});
