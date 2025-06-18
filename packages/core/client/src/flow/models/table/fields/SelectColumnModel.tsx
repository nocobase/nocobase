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
import { TableColumnModel } from '../../TableColumnModel';
import { getCurrentOptions } from '../utils/utils';

export class SelectTableColumnModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['select', 'multipleSelect'];
  dataSource;
  fieldNames: { label: string; value: string; color?: string; icon?: any };

  setDataSource(dataSource) {
    this.dataSource = dataSource;
  }
  getDataSource() {
    return this.dataSource;
  }
  setFieldNames(fieldNames) {
    this.fieldNames = fieldNames;
  }
  getFieldNames() {
    return this.fieldNames;
  }
  render() {
    return (value, record, index) => {
      const currentOptions = getCurrentOptions(value, this.dataSource, this.fieldNames);
      const content =
        value &&
        currentOptions.map((option, index) => (
          <Tag key={index} color={option[this.fieldNames.color]} icon={option.icon}>
            {option[this.fieldNames.label]}
          </Tag>
        ));
      return (
        <>
          {content}
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}

SelectTableColumnModel.registerFlow({
  key: 'options',
  auto: true,
  sort: 100,
  steps: {
    step1: {
      handler(ctx, params) {
        ctx.model.setDataSource(ctx.model.field.enum);
        ctx.model.setFieldNames({
          label: 'label',
          value: 'value',
          color: 'color',
          icon: 'icon',
        });
      },
    },
  },
});
