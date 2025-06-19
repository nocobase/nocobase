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

const fieldNames = {
  label: 'label',
  value: 'value',
  color: 'color',
  icon: 'icon',
};
export class SelectReadPrettyFieldModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['select', 'multipleSelect'];

  render() {
    return (value, record, index) => {
      const { dataSource } = this.getComponentProps();
      const currentOptions = getCurrentOptions(value, dataSource, fieldNames);
      const content =
        value &&
        currentOptions.map((option, index) => (
          <Tag key={index} color={option[fieldNames.color]} icon={option.icon}>
            {option[fieldNames.label]}
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
