/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isNum } from '@formily/shared';
import { InputNumber } from 'antd';
import React from 'react';
import * as math from 'mathjs';
import { useMemo } from 'react';
import { EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import { FieldModel } from '../base';

const isNumberLike = (index: any): index is number => isNum(index) || /^-?\d+(\.\d+)?$/.test(index);

const toValue = (value: any, callback: (v: number) => number) => {
  if (isNumberLike(value)) {
    return math.round(callback(value), 9);
  }
  return null;
};

export const PercentInput = (props) => {
  const v = useMemo(() => toValue(props.value, (v) => v * 100), [props.value]);
  const componentProps = {
    ...props,
    value: v,
    addonAfter: '%',
    onChange: (v) => {
      props.onChange(toValue(v, (v) => v / 100));
    },
    style: { width: '100%' },
  };
  return <InputNumber {...componentProps} />;
};

export class PercentFieldModel extends FieldModel {
  render() {
    return <PercentInput {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('PercentFieldModel', ['percent'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface('PercentFieldModel', ['percent'], {
  isDefault: true,
});
