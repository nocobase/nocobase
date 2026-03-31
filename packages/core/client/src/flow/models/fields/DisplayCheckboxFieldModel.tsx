/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Checkbox } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { DisplayItemModel, tExpr } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

export class DisplayCheckboxFieldModel extends FieldModel {
  public render() {
    const { value, showUnchecked, style, className } = this.props;
    if (value) {
      return <CheckOutlined className={className} style={{ color: '#52c41a', ...(style || {}) }} />;
    }
    return showUnchecked ? (
      <CloseOutlined className={className} style={{ color: '#ff4d4f', ...(style || {}) }} />
    ) : (
      <Checkbox className={className} style={style} disabled />
    );
  }
}

DisplayCheckboxFieldModel.define({
  label: tExpr('Checkbox'),
});

DisplayItemModel.bindModelToInterface('DisplayCheckboxFieldModel', ['checkbox'], {
  isDefault: true,
});
