/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isNum } from '@formily/shared';
import * as math from 'mathjs';
import React from 'react';
import { TableColumnModel } from '../TableColumnModel';
import { InputNumberReadPretty } from '../components/InputNumberReadPretty';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return math.round(callback(value), 9);
  }
  return null;
};
export class PercentReadPrettyFieldModel extends TableColumnModel {
  public static readonly supportedFieldInterfaces = ['percent'];
  render() {
    return (value, record, index) => {
      const val = toValue(value, (v) => v * 100);
      return (
        <>
          <InputNumberReadPretty value={val} addonAfter="%" />
          {this.renderQuickEditButton(record)}
        </>
      );
    };
  }
}
