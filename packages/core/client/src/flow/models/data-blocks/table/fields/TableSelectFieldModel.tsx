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
import { TableFieldModel } from './TableFieldModel';

export class TableSelectFieldModel extends TableFieldModel {
  static readonly supportedFieldInterfaces = ['select'];

  getValue() {
    return this.ctx.shared.value;
  }

  getLabel() {
    return this.parent.collectionField?.enum?.find((item) => item.value === this.getValue())?.label || this.getValue();
  }

  public render() {
    const label = this.getLabel();
    return (
      <span>
        {this.props.prefix}
        {label && <Tag>{label}</Tag>}
        {this.props.suffix}
      </span>
    );
  }
}
