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

const UnitOptions = [
  { value: 1, label: 'B' },
  { value: 1024, label: 'KB' },
  { value: 1024 * 1024, label: 'MB' },
  { value: 1024 * 1024 * 1024, label: 'GB' },
  { value: 1024 * 1024 * 1024 * 1024, label: 'TB' },
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

export function FileSizeField(props) {
  const { value, defaultValue, defaultUnit = 1024 * 1024, placeholder, onChange } = props;
  const vOption = getUnitOption(value ?? defaultValue, defaultUnit);
  const v = value == null ? value : value / vOption.value;
  const dvOption = getUnitOption(defaultValue, defaultUnit);
  const dv = defaultValue == null ? defaultValue : defaultValue / dvOption.value;
  const pvOption = getUnitOption(Number.parseInt(placeholder, 10), defaultUnit);
  const pv = defaultValue == null ? defaultValue : defaultValue / pvOption.value;

  // const placeholder = DEFAULT_MAX_FILE_SIZE / defaultUnit;

  const onNumberChange = useCallback(
    (val) => {
      onChange?.(val == null ? val : val * vOption.value);
    },
    [vOption.value],
  );

  const onUnitChange = useCallback(
    (val) => {
      onChange?.(v * val);
    },
    [v],
  );

  return (
    <Space.Compact>
      <InputNumber value={v} onChange={onNumberChange} defaultValue={dv} />
      <Select options={UnitOptions} value={vOption.value} onChange={onUnitChange} className="auto-width" />
    </Space.Compact>
  );
}
