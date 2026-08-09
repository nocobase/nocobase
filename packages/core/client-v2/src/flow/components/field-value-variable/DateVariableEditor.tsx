/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext, type CtxDateExpressionConfig, type CtxDateRelativeUnit } from '@nocobase/flow-engine';
import { AutoComplete, Input, InputNumber, Select, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { FieldAssignExactDatePicker, type ExactDatePickerValue } from '../FieldAssignExactDatePicker';
import { toExactPickerDisplayValue, type DateVariableComponentProps } from './dateValue';

const DATE_FORMAT_OPTIONS = [
  'YYYY-MM-DD',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY/MM/DD',
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYYMMDD',
].map((value) => ({ value }));

const PRESET_LABELS: Record<string, string> = {
  now: 'Now',
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  thisWeek: 'This Week',
  lastWeek: 'Last Week',
  nextWeek: 'Next Week',
  thisMonth: 'This Month',
  lastMonth: 'Last Month',
  nextMonth: 'Next Month',
  thisQuarter: 'This Quarter',
  lastQuarter: 'Last Quarter',
  nextQuarter: 'Next Quarter',
  thisYear: 'This Year',
  lastYear: 'Last Year',
  nextYear: 'Next Year',
};

export function getDefaultDateVariableFormat(config: CtxDateExpressionConfig): string {
  return config.kind === 'preset' && config.preset === 'now' ? 'YYYY-MM-DD HH:mm:ss' : 'YYYY-MM-DD';
}

export function serializeExactDatePickerValue(
  value: ExactDatePickerValue,
  showTime: boolean,
): string | [string, string] {
  const serialize = (item: Dayjs) => (showTime ? item.toISOString() : item.format('YYYY-MM-DD'));
  if (Array.isArray(value)) {
    return [serialize(value[0]), serialize(value[1])];
  }
  return value ? serialize(value) : '';
}

type DateVariableEditorProps = {
  value?: CtxDateExpressionConfig;
  onChange?: (value: CtxDateExpressionConfig) => void;
  isDateLikeField: boolean;
  dateComponentProps: DateVariableComponentProps;
  style?: React.CSSProperties;
  disabled?: boolean;
};

const DateFormatEditor: React.FC<{
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ value, placeholder, onChange, disabled }) => {
  const ctx = useFlowContext();
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Input
        value={ctx.t('Format')}
        readOnly
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        style={{ width: 88, pointerEvents: 'none' }}
      />
      <AutoComplete
        value={value}
        placeholder={placeholder}
        options={DATE_FORMAT_OPTIONS}
        onChange={(nextValue) => onChange(nextValue.slice(0, 128))}
        disabled={disabled}
        style={{ flex: 1, minWidth: 0 }}
        aria-label={ctx.t('Format')}
      />
    </Space.Compact>
  );
};

export const DateVariableEditor: React.FC<DateVariableEditorProps> = ({
  value,
  onChange,
  isDateLikeField,
  dateComponentProps,
  style,
  disabled = false,
}) => {
  const ctx = useFlowContext();
  if (!value) return null;

  const updateFormat = (format: string) => onChange?.({ ...value, format });
  const format = value.format || '';

  const renderValueEditor = () => {
    if (value.kind === 'exact') {
      const isRange = Array.isArray(value.value);
      return (
        <FieldAssignExactDatePicker
          picker={dateComponentProps.picker}
          showTime={dateComponentProps.showTime}
          timeFormat={dateComponentProps.timeFormat}
          format={dateComponentProps.format}
          isRange={isRange}
          value={toExactPickerDisplayValue(value.value, {
            format: dateComponentProps.format,
            isRange,
          })}
          onChange={(nextValue) => {
            onChange?.({ ...value, value: serializeExactDatePickerValue(nextValue, dateComponentProps.showTime) });
          }}
          disabled={disabled}
          style={{ width: '100%' }}
        />
      );
    }

    if (value.kind === 'relative') {
      return (
        <Space.Compact style={{ width: '100%' }}>
          <InputNumber
            min={1}
            precision={0}
            value={value.amount}
            disabled={disabled}
            onChange={(amount) => onChange?.({ ...value, amount: typeof amount === 'number' ? amount : 1 })}
            aria-label={ctx.t(value.direction === 'past' ? 'Past' : 'Next')}
            style={{ flex: '1 1 auto', minWidth: 80 }}
          />
          <Select
            value={value.unit}
            disabled={disabled}
            onChange={(unit: CtxDateRelativeUnit) => onChange?.({ ...value, unit })}
            aria-label={ctx.t('Unit')}
            style={{ flex: '0 0 130px', minWidth: 130 }}
            options={[
              { value: 'day', label: ctx.t('Day') },
              { value: 'week', label: ctx.t('Calendar week') },
              { value: 'month', label: ctx.t('Calendar Month') },
              { value: 'year', label: ctx.t('Calendar Year') },
            ]}
          />
        </Space.Compact>
      );
    }

    return <Input value={ctx.t(PRESET_LABELS[value.preset] || value.preset)} readOnly disabled={disabled} />;
  };

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 8, width: '100%', minWidth: 0, ...style }}>
      {renderValueEditor()}
      {!isDateLikeField && (
        <DateFormatEditor
          value={format}
          placeholder={getDefaultDateVariableFormat(value)}
          onChange={updateFormat}
          disabled={disabled}
        />
      )}
    </div>
  );
};
