/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import * as math from 'mathjs';
import { isNum } from '@formily/shared';
import { TableFieldModel } from './TableFieldModel';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return `${math.round(callback(value), 9)}%`;
  }
  return null;
};
export class TablePercentFieldModel extends TableFieldModel {
  public static readonly supportedFieldInterfaces = ['percent'];

  public render() {
    const value = this.getValue();
    const { prefix = '', suffix = '' } = this.props;

    const content = toValue(value, (v) => v * 100);
    return (
      <div>
        {prefix}
        {content}
        {suffix}
      </div>
    );
  }
}
