/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { ReadPrettyFieldModel } from './ReadPrettyFieldModel';
import { Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export class CheckboxReadPrettyFieldModel extends ReadPrettyFieldModel {
  public static readonly supportedFieldInterfaces = ['checkbox'];
  public render() {
    const { prefix = '', suffix = '', showUnchecked, value } = this.props;
    const content = value ? (
      <CheckOutlined style={{ color: '#52c41a' }} />
    ) : showUnchecked ? (
      <CloseOutlined style={{ color: '#ff4d4f' }} />
    ) : (
      <Checkbox disabled />
    );

    return (
      <div>
        {prefix}
        {content}
        {suffix}
      </div>
    );
  }
}
