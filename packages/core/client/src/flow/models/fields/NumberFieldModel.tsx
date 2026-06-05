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
import { EditableItemModel, FilterableItemModel } from '@nocobase/flow-engine';
import BigNumber from 'bignumber.js';
import { omit } from 'lodash';
import React from 'react';
import { FieldModel } from '../base';

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

export const InputNumberField = (props: AntdInputNumberProps) => {
  const { onChange, ...others } = props;
  const handleChange = (v) => {
    if (Number.isNaN(v)) {
      onChange(null);
    } else {
      onChange(toSafeNumber(v));
    }
  };
  const handelCompositionEnd = (v) => {
    if (Number.isNaN(v) || typeof v === 'object') {
      props.onCompositionEnd(undefined);
    } else {
      props.onCompositionEnd(v);
    }
  };
  let inputNumberProps = {
    ...others,
    onChange: handleChange,
    onCompositionEnd: handelCompositionEnd,
  };

  if (others['formatStyle']) {
    inputNumberProps = omit(inputNumberProps, ['addonAfter', 'addonBefore']);
  }
  return <NumberPicker {...inputNumberProps} />;
};
export class NumberFieldModel extends FieldModel {
  render() {
    return <InputNumberField {...this.props} style={{ width: '100%' }} />;
  }
}

EditableItemModel.bindModelToInterface('NumberFieldModel', ['number', 'integer', 'id', 'snowflakeId'], {
  isDefault: true,
});

FilterableItemModel.bindModelToInterface('NumberFieldModel', ['number', 'integer', 'id', 'snowflakeId'], {
  isDefault: true,
});
