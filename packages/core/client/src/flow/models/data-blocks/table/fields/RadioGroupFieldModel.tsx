/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag } from 'antd';
import React, { FC } from 'react';
import { TableColumnModel } from '../TableColumnModel';

const ReadPretty: FC<any> = (props) => {
  const { value, dataSource } = props;

  if (!value) {
    return;
  }
  return (
    <div>
      {dataSource
        .filter((option) => option.value == value)
        .map((option, key) => (
          <Tag key={key} color={option.color} icon={option.icon}>
            {option.label}
          </Tag>
        ))}
    </div>
  );
};

export class RadioGroupReadPrettyFieldModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['radioGroup'];

  render() {
    return (value, record, index) => {
      return (
        <>
          {<ReadPretty value={value} {...this.getComponentProps()} />}
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}
