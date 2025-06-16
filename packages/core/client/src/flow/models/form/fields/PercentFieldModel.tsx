/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import { connect, mapProps } from '@formily/react';
import { FormFieldModel } from '../../FormFieldModel';
import { useMemo } from 'react';
import { isNum } from '@formily/shared';
import { InputNumber } from 'antd';
import * as math from 'mathjs';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return math.round(callback(value), 9);
  }
  return null;
};
const PercentInput = connect(
  InputNumber,
  mapProps((props, field: any) => {
    const v = useMemo(() => toValue(props.value, (v) => v * 100), [props.value]);
    return {
      ...props,
      value: v,
      onChange: (v) => {
        field.setValue(toValue(v, (v) => v / 100));
      },
    };
  }),
);
export class PercentFieldModel extends FormFieldModel {
  get component() {
    return [
      PercentInput,
      {
        ...this.props,
        addonAfter: '%',
      },
    ];
  }
}
