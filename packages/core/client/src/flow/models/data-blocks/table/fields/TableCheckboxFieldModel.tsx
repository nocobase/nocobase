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
import { Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { TableFieldModel } from './TableFieldModel';

export class TableCheckboxFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = ['checkbox'];

  public render() {
    const value = this.getValue();
    const { prefix = '', suffix = '', showUnchecked } = this.props;
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
