/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InputNumber, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { useWorkflowTranslation } from '../locale';

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

export type TimeoutInputProps = {
  value?: number;
  onChange?: (value: number) => void;
};

export function TimeoutInput({ value: rawValue, onChange }: TimeoutInputProps) {
  const { t } = useWorkflowTranslation();
  const value = clampTimeout(Number(rawValue ?? 0));
  const [unit, setUnit] = useState(() => normalizeUnit(value));

  useEffect(() => {
    if (value === 0) {
      return;
    }
    setUnit((current) => normalizeUnit(value, current));
  }, [value]);

  const displayValue = value === 0 ? 0 : value / unit;
  const max = MAX_TIMEOUT / unit;

  return (
    <Space.Compact style={{ width: '50%' }}>
      <InputNumber
        min={0}
        max={max}
        precision={0}
        value={displayValue}
        onChange={(next) => onChange?.(clampTimeout(Number(next) || 0, max) * unit)}
        style={{ width: '70%' }}
      />
      <Select
        value={unit}
        style={{ width: '30%' }}
        options={UNIT_OPTIONS.map((item) => ({ value: item.value, label: t(item.label) }))}
        onChange={(nextUnit) => {
          const base = clampTimeout(Number(rawValue ?? 0));
          const current = base === 0 ? 0 : base / unit;
          setUnit(nextUnit);
          onChange?.(clampTimeout(current * nextUnit));
        }}
      />
    </Space.Compact>
  );
}

export default TimeoutInput;
