/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { connect, mapProps, mapReadPretty } from '@formily/react';
import { InputNumber, Select, Space } from 'antd';
import { lang } from '../locale';

const UNIT_OPTIONS = [
  { value: 1000, label: 'Seconds' },
  { value: 60_000, label: 'Minutes' },
  { value: 3600_000, label: 'Hours' },
];

function normalizeUnit(value?: number) {
  if (!value) {
    return UNIT_OPTIONS[0].value;
  }
  return UNIT_OPTIONS.findLast((item) => value % item.value === 0)?.value ?? UNIT_OPTIONS[0].value;
}

export const TimeoutInput = connect(
  (props: any) => {
    const value = Number(props.value ?? 0);
    const unit = normalizeUnit(value);
    const displayValue = value === 0 ? 0 : value / unit;

    return (
      <Space.Compact>
        <InputNumber
          min={0}
          precision={0}
          value={displayValue}
          onChange={(next) => props.onChange?.((Number(next) || 0) * unit)}
        />
        <Select
          value={unit}
          options={UNIT_OPTIONS.map((item) => ({ ...item, label: lang(item.label) }))}
          onChange={(nextUnit) => {
            const base = Number(props.value ?? 0);
            const current = base === 0 ? 0 : base / unit;
            props.onChange?.(current * nextUnit);
          }}
          className={'auto-width'}
        />
      </Space.Compact>
    );
  },
  mapProps((props) => props),
  mapReadPretty((props) => {
    const value = Number(props.value ?? 0);
    if (value === 0) {
      return <>{lang('Unlimited')}</>;
    }
    const unit = normalizeUnit(value);
    const option = UNIT_OPTIONS.find((item) => item.value === unit);
    return (
      <>
        {value / unit} {option ? lang(option.label) : ''}
      </>
    );
  }),
);

export default TimeoutInput;
