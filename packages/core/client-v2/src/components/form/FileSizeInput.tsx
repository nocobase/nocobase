/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { InputNumber, Select, Space } from 'antd';
import React, { useCallback } from 'react';

const DEFAULT_MIN = 1;
const DEFAULT_MAX = Number.POSITIVE_INFINITY;
const DEFAULT_VALUE = 1024 * 1024 * 20;

const UNIT_OPTIONS = [
  { value: 1, label: 'Byte' },
  { value: 1024, label: 'KB' },
  { value: 1024 * 1024, label: 'MB' },
  { value: 1024 * 1024 * 1024, label: 'GB' },
];

// Mirrors v1's `.auto-width` rule registered globally on FormItem: shrink the
// antd control to its content width while keeping a sensible minimum.
const autoWidthClassName = css`
  &.ant-input-number,
  &.ant-select {
    width: auto;
    min-width: 6em;
  }
`;

function getUnitOption(value: number, defaultUnit = 1024 * 1024) {
  const size = value || defaultUnit;
  for (let i = UNIT_OPTIONS.length - 1; i >= 0; i -= 1) {
    const option = UNIT_OPTIONS[i];
    if (size % option.value === 0) {
      return option;
    }
  }
  return UNIT_OPTIONS[0];
}

function clampSize(value: number, min: number, max: number) {
  return Math.min(Math.max(min, value), max);
}

export interface FileSizeInputProps {
  value?: number;
  onChange?: (value?: number) => void;
  disabled?: boolean;
  /** Minimum byte size. Empty / below-min input snaps to this on blur. Defaults to 1. */
  min?: number;
  /** Maximum byte size. Defaults to `Number.POSITIVE_INFINITY`. */
  max?: number;
  /** Default byte size used to derive the initial unit shown when the field is empty. Defaults to 20 MB. */
  defaultValue?: number;
}

/**
 * Byte-valued size input paired with a unit selector (Byte / KB / MB / GB).
 * The persisted value is always normalized to bytes; the displayed number is
 * derived from the picked unit. Useful for fields like file-size limits or
 * memory quotas where the natural input unit varies by magnitude.
 */
export function FileSizeInput(props: FileSizeInputProps) {
  const min = props.min ?? DEFAULT_MIN;
  const max = props.max ?? DEFAULT_MAX;
  const defaultValue = props.defaultValue ?? DEFAULT_VALUE;
  const unit = getUnitOption(props.value ?? defaultValue);
  const value = props.value == null ? props.value : props.value / unit.value;

  const handleBlur = useCallback(() => {
    if (props.value == null || props.value < min) {
      props.onChange?.(min);
    }
  }, [props, min]);

  return (
    <Space.Compact>
      <InputNumber
        value={value}
        disabled={props.disabled}
        defaultValue={defaultValue / getUnitOption(defaultValue).value}
        step={1}
        className={autoWidthClassName}
        onBlur={handleBlur}
        onChange={(nextValue) => {
          props.onChange?.(nextValue == null ? undefined : clampSize(Number(nextValue) * unit.value, min, max));
        }}
      />
      <Select
        disabled={props.disabled}
        options={UNIT_OPTIONS}
        value={unit.value}
        className={autoWidthClassName}
        onChange={(nextUnit) => {
          props.onChange?.(value == null ? undefined : clampSize(Number(value) * nextUnit, min, max));
        }}
      />
    </Space.Compact>
  );
}
