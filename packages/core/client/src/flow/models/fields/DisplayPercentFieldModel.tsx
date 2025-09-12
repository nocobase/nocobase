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
import { DisplayItemModel } from '@nocobase/flow-engine';
import { isNum } from '@formily/shared';
import { InteractiveDisplayFieldModel } from './InteractiveDisplayFieldModel';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return `${math.round(callback(value), 9)}%`;
  }
  return null;
};
export class DisplayPercentFieldModel extends InteractiveDisplayFieldModel {
  public static readonly supportedFieldInterfaces = ['percent'];
  // @reactive
  public render() {
    const { prefix = '', suffix = '', value } = this.props;

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

DisplayItemModel.bindModelToInterface('DisplayPercentFieldModel', ['percent'], {
  isDefault: true,
});
