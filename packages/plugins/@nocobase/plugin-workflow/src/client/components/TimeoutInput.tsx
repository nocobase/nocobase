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
  { value: 86_400_000, label: 'Days' },
];

const DEFAULT_UNIT = 60_000;
const MAX_TIMEOUT = 180 * 86_400_000;

function clampTimeout(value: number, max = MAX_TIMEOUT) {
  return Math.min(Math.max(value, 0), max);
}

function normalizeUnit(value?: number, fallback = DEFAULT_UNIT) {
  if (!value) {
    return fallback;
  }
  return UNIT_OPTIONS.findLast((item) => value % item.value === 0)?.value ?? fallback;
}

export const TimeoutInput = connect(
  (props: any) => {
    const value = clampTimeout(Number(props.value ?? 0));
    const [unit, setUnit] = React.useState(() => normalizeUnit(value));

    React.useEffect(() => {
      if (value === 0) {
        return;
      }
      setUnit((current) => normalizeUnit(value, current));
    }, [value]);

    const displayValue = value === 0 ? 0 : value / unit;
    const max = MAX_TIMEOUT / unit;

    return (
      <Space.Compact>
        <InputNumber
          min={0}
          max={max}
          precision={0}
          value={displayValue}
          onChange={(next) => props.onChange?.(clampTimeout(Number(next) || 0, max) * unit)}
          className="auto-width"
        />
        <Select
          value={unit}
          options={UNIT_OPTIONS.map((item) => ({ ...item, label: lang(item.label) }))}
          onChange={(nextUnit) => {
            const base = clampTimeout(Number(props.value ?? 0));
            const current = base === 0 ? 0 : base / unit;
            setUnit(nextUnit);
            props.onChange?.(clampTimeout(current * nextUnit));
          }}
          className="auto-width"
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
