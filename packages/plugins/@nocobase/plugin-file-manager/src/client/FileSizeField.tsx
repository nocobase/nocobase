/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber, Select, Space } from 'antd';
import React, { useCallback } from 'react';
import { FILE_SIZE_LIMIT_DEFAULT, FILE_SIZE_LIMIT_MAX, FILE_SIZE_LIMIT_MIN } from '../constants';

const UnitOptions = [
  { value: 1, label: 'Byte' },
  { value: 1024, label: 'KB' },
  { value: 1024 * 1024, label: 'MB' },
  { value: 1024 * 1024 * 1024, label: 'GB' },
];

function getUnitOption(v, defaultUnit = 1024 * 1024) {
  const value = v || defaultUnit;
  for (let i = UnitOptions.length - 1; i >= 0; i--) {
    const option = UnitOptions[i];
    if (value % option.value === 0) {
      return option;
    }
  }

  return UnitOptions[0];
}

function limitSize(value, min, max) {
  return Math.min(Math.max(min, value), max);
}

export function FileSizeField(props) {
  const {
    value,
    defaultUnit = 1024 * 1024,
    min = FILE_SIZE_LIMIT_MIN,
    max = FILE_SIZE_LIMIT_MAX,
    step = 1,
    onChange,
  } = props;
  const defaultValue = props.defaultValue ?? FILE_SIZE_LIMIT_DEFAULT;
  const dvOption = getUnitOption(defaultValue, defaultUnit);
  const dv = defaultValue / dvOption.value;
  const vOption = getUnitOption(value ?? defaultValue, defaultUnit);
  const v = value == null ? value : value / vOption.value;

  const onNumberChange = useCallback(
    (val) => {
      onChange?.(limitSize(val == null ? val : val * vOption.value, min, max));
    },
    [vOption.value],
  );

  const onUnitChange = useCallback(
    (val) => {
      onChange?.(limitSize(v * val, min, max));
    },
    [v],
  );

  return (
    <Space.Compact>
      <InputNumber value={v} onChange={onNumberChange} defaultValue={`${dv}`} step={step} />
      <Select options={UnitOptions} value={vOption.value} onChange={onUnitChange} className="auto-width" />
    </Space.Compact>
  );
}
