/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber as NumberPicker } from 'antd';
import { InputNumberProps as AntdInputNumberProps } from 'antd';
import BigNumber from 'bignumber.js';
import { omit } from 'lodash';
import React from 'react';
import { FormFieldModel } from './FormFieldModel';

function toSafeNumber(value) {
  if (!value) {
    return value;
  }
  if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
    return new BigNumber(value).toString();
  } else {
    return Number(value);
  }
}

const InputNumber = (props: AntdInputNumberProps) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    if (Number.isNaN(v)) {
      onChange(null);
    } else {
      onChange(toSafeNumber(v));
    }
  };
  let inputNumberProps = {
    onChange: handleChange,
    ...others,
  };
  if (others['formatStyle']) {
    inputNumberProps = omit(inputNumberProps, ['addonAfter', 'addonBefore']);
  }
  return <NumberPicker {...inputNumberProps} />;
};
export class NumberEditableFieldModel extends FormFieldModel {
  static supportedFieldInterfaces = ['number', 'integer', 'id'];

  get component() {
    return [InputNumber, {}];
  }
}
