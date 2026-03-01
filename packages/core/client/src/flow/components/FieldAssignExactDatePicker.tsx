/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { DatePicker, Select, Space } from 'antd';
import { dayjs, getDateTimeFormat, getPickerFormat } from '@nocobase/utils/client';
import { useFlowContext } from '@nocobase/flow-engine';
import { inferPickerType } from '../../schema-component';

const stripTimeFromFormat = (format?: string) =>
  format ? format.replace(/\s*HH?:mm(?::ss)?(?:\.SSS)?/g, '').trim() : format;

export type ExactDatePickerMode = 'year' | 'quarter' | 'month' | 'date';

export type ExactDatePickerValue = dayjs.Dayjs | [dayjs.Dayjs, dayjs.Dayjs] | null;

export interface FieldAssignExactDatePickerProps {
  picker?: ExactDatePickerMode;
  format?: string;
  showTime?: boolean;
  timeFormat?: string;
  value?: unknown;
  isRange?: boolean;
  onChange?: (value: ExactDatePickerValue) => void;
  style?: React.CSSProperties;
}

function getRawSingleValue(value: unknown, isRange: boolean): unknown {
  if (!isRange) {
    return value;
  }
  if (!Array.isArray(value)) return undefined;
  return value[0];
}

function inferPickerFromRawValue(value: unknown, fallback: ExactDatePickerMode): ExactDatePickerMode {
  if (typeof value === 'string') {
    return inferPickerType(value, fallback) as ExactDatePickerMode;
  }

  return fallback;
}

function parseDateByFormat(value: string, format: string): dayjs.Dayjs | null {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  if (hasTimezone) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      return parsed;
    }
  }

  if (format) {
    const strict = dayjs(raw, format, true);
    if (strict.isValid()) {
      return strict;
    }
  }

  const fallback = dayjs(raw);
  if (fallback.isValid()) {
    return fallback;
  }

  if (format) {
    const loose = dayjs(raw, format);
    if (loose.isValid()) {
      return loose;
    }
  }

  return null;
}

function parseDateFromRawValue(value: unknown, format: string): dayjs.Dayjs | null {
  if (dayjs.isDayjs(value)) {
    return value;
  }

  if (value instanceof Date) {
    const parsedDate = dayjs(value);
    return parsedDate.isValid() ? parsedDate : null;
  }

  if (typeof value === 'string') {
    return parseDateByFormat(value, format);
  }

  return null;
}

function parseRangeValue(value: unknown, format: string): [dayjs.Dayjs, dayjs.Dayjs] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const left = parseDateFromRawValue(value[0], format);
  const right = parseDateFromRawValue(value[1], format);

  if (!left || !right) {
    return null;
  }

  return [left, right];
}

export const FieldAssignExactDatePicker: React.FC<FieldAssignExactDatePickerProps> = (props) => {
  const { picker = 'date', format, showTime, timeFormat, value, isRange = false, onChange, style } = props;
  const flowCtx = useFlowContext();
  const t = flowCtx.model.translate.bind(flowCtx.model);

  const rawSingleValue = useMemo(() => getRawSingleValue(value, isRange), [isRange, value]);

  const [targetPicker, setTargetPicker] = useState<ExactDatePickerMode>(() => {
    return inferPickerFromRawValue(rawSingleValue, picker);
  });

  const getResolvedFormat = (nextPicker: ExactDatePickerMode) => {
    const baseFormat = nextPicker === picker && format ? format : getPickerFormat(nextPicker);
    const dateFormat = nextPicker === 'date' ? stripTimeFromFormat(baseFormat) : baseFormat;
    return getDateTimeFormat(nextPicker, dateFormat, showTime, timeFormat);
  };

  const resolvedFormat = useMemo(
    () => getResolvedFormat(targetPicker),
    [targetPicker, format, picker, showTime, timeFormat],
  );

  const singleValue = useMemo(() => {
    if (isRange) return null;
    return parseDateFromRawValue(value, resolvedFormat);
  }, [isRange, value, resolvedFormat]);

  const rangeValue = useMemo(() => {
    if (!isRange) return null;
    return parseRangeValue(value, resolvedFormat);
  }, [isRange, value, resolvedFormat]);

  const pickerOptions = useMemo(
    () => [
      { label: t('Date'), value: 'date' },
      { label: t('Month'), value: 'month' },
      { label: t('Quarter'), value: 'quarter' },
      { label: t('Year'), value: 'year' },
    ],
    [t],
  );

  const handlePickerTypeChange = (nextPicker: ExactDatePickerMode) => {
    setTargetPicker(nextPicker);

    if (!onChange) {
      return;
    }

    if (isRange) {
      if (rangeValue) {
        onChange(rangeValue);
      }
      return;
    }

    if (singleValue) {
      onChange(singleValue);
    }
  };

  const singlePickerProps: any = {
    utc: true,
    underFilter: true,
    format: resolvedFormat,
    picker: targetPicker,
    inputReadOnly: flowCtx.isMobileLayout,
    showTime: showTime ? { defaultValue: dayjs('00:00:00', 'HH:mm:ss') } : false,
    value: singleValue,
    onChange: (nextDate: dayjs.Dayjs | null) => {
      if (nextDate && dayjs.isDayjs(nextDate)) {
        onChange?.(nextDate);
        return;
      }
      onChange?.(null);
    },
    style: { flex: 1 },
  };

  const rangePickerProps: any = {
    utc: true,
    underFilter: true,
    format: resolvedFormat,
    picker: targetPicker,
    inputReadOnly: flowCtx.isMobileLayout,
    showTime: showTime ? { defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')] } : false,
    value: rangeValue,
    onChange: (nextDates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
      if (Array.isArray(nextDates) && nextDates[0] && nextDates[1]) {
        onChange?.([nextDates[0], nextDates[1]]);
        return;
      }
      onChange?.(null);
    },
    style: { flex: 1 },
  };

  return (
    <Space.Compact style={{ width: '100%', ...(style || {}) }}>
      <Select
        style={{ width: 100 }}
        popupMatchSelectWidth={false}
        value={targetPicker}
        options={pickerOptions}
        onChange={handlePickerTypeChange}
      />
      {isRange ? <DatePicker.RangePicker {...rangePickerProps} /> : <DatePicker {...singlePickerProps} />}
    </Space.Compact>
  );
};
