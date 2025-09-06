/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber } from 'antd';
import * as math from 'mathjs';
import { useMemo } from 'react';
import { FilterFormFieldModel } from './FilterFormFieldModel';
import React from 'react';
import _ from 'lodash';

const isNumberLike = (index: any): index is number => _.isNumber(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return math.round(callback(value), 9);
  }
  return null;
};
const PercentInput = (props) => {
  const v = useMemo(() => toValue(props.value, (v) => v * 100), [props.value]);
  const newProps = {
    ...props,
    value: v,
    addonAfter: '%',
    style: { width: '100%' },
  };
  return <InputNumber {...newProps} />;
};

export class PercentFilterFieldModel extends FilterFormFieldModel {
  static readonly supportedFieldInterfaces = ['percent'];

  get component() {
    return [PercentInput, {}];
  }
}
