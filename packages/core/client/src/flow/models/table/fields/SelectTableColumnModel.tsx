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
  declare options;
  declare fieldNames: { label: string; value: string; color?: string; icon?: any };

  setOptions(options) {
    this.options = options;
  }
  getOptions() {
    return this.options;
  }
  setFieldNames(fieldNames) {
    this.fieldNames = fieldNames;
  }
  getFieldNames() {
    return this.fieldNames;
  }
  render() {
    return (value, record, index) => {
      const currentOptions = getCurrentOptions(value, this.options, this.fieldNames);

      const content = currentOptions.map((option, index) => (
        <Tag key={index} color={option[this.fieldNames.color]} icon={option.icon}>
          {option[this.fieldNames.label]}
        </Tag>
      ));
      console.log(value, this.field, this.options);
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
        console.log(ctx.model.field.enum);
        ctx.model.setOptions(ctx.model.field.enum);
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
