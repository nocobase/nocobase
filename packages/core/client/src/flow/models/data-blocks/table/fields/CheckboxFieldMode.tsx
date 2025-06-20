/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import React, { FC } from 'react';
import { TableFieldModel } from '../TableFieldModel';

interface CheckboxReadPrettyProps {
  showUnchecked?: boolean;
  value?: boolean;
}

const ReadPretty: FC<CheckboxReadPrettyProps> = (props) => {
  if (props.value) {
    return <CheckOutlined style={{ color: '#52c41a' }} />;
  }
  return props.showUnchecked ? <CloseOutlined style={{ color: '#ff4d4f' }} /> : <Checkbox disabled />;
};

export class CheckboxColumnFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = ['checkbox'];

  public render() {
    return <ReadPretty value={this.field.value} {...this.getComponentProps()} />;
  }
}
