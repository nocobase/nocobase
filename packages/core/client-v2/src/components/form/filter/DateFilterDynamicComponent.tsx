/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DatePicker, Divider, InputNumber, Select, Space, theme } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';

/**
 * Value shape used by NocoBase's `$date*` filter operators. Two flavours:
 *
 * - For "Exact day" mode: a **formatted string** at the granularity of the picker — `"2026-02-15"` (date), `"2026-02"` (month), `"2026"` (year), `"2026-Q1"` (quarter). For `$dateBetween` (`isRange`), a `[string, string]` tuple. Strings (not Dayjs) so the value serializes verbatim into the query string the same way v1 does (`filter=%7B%22$and%22:[%7B%22lockedTs%22:%7B%22$dateOn%22:%222026-02%22%7D%7D]%7D`).
 * - For relative modes (Today / Past 3 days / This Week / …): a `{ type, number?, unit? }` descriptor that the server resolves to a concrete range at query time.
 */
export type DateFilterValue =
  | string
  | [string, string]
  | { type: string; number?: number; unit?: 'day' | 'week' | 'month' | 'year' }
  | null
  | undefined;

export interface DateFilterDynamicComponentProps {
  value?: DateFilterValue;
  onChange?: (value: DateFilterValue) => void;
  /** `true` for `$dateBetween`; renders a `DatePicker.RangePicker`. */
  isRange?: boolean;
  /**
   * Translator. Defaults to identity so callers can omit it when running outside a translation context (tests, storybook).
   */
  t?: (key: string) => string;
}

const identity = (s: string) => s;

const PICKER_OPTIONS = [
  { label: 'Date', value: 'date' as const },
  { label: 'Month', value: 'month' as const },
  { label: 'Quarter', value: 'quarter' as const },
  { label: 'Year', value: 'year' as const },
];

const RELATIVE_PRIMARY = [
  { value: 'exact', label: 'Exact day' },
  { value: 'past', label: 'Past' },
  { value: 'next', label: 'Next' },
];

const RELATIVE_SECONDARY = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'lastWeek', label: 'Last Week' },
  { value: 'nextWeek', label: 'Next Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'nextMonth', label: 'Next Month' },
  { value: 'thisQuarter', label: 'This Quarter' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'nextQuarter', label: 'Next Quarter' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'nextYear', label: 'Next Year' },
];

const UNIT_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: 'week' as const, label: 'Calendar week' },
  { value: 'month' as const, label: 'Calendar Month' },
  { value: 'year' as const, label: 'Calendar Year' },
];

const isRelativeDescriptor = (value: DateFilterValue): value is { type: string; number?: number; unit?: any } =>
  !!value && typeof value === 'object' && !Array.isArray(value) && 'type' in (value as any);

type PickerMode = 'date' | 'month' | 'quarter' | 'year';

/**
 * The exact format strings NocoBase's `$date*` server operators expect per picker granularity. Mirrors v1's `getPickerFormat` output under `underFilter=true`, so the URL-encoded query stays identical.
 *
 * Exported for unit tests and for downstream callers that need to parse / format `$date*` values outside this component.
 */
export const FORMAT_BY_PICKER: Record<PickerMode, string> = {
  date: 'YYYY-MM-DD',
  month: 'YYYY-MM',
  quarter: 'YYYY-[Q]Q',
  year: 'YYYY',
};

/**
 * Parse a granularity-formatted string back into a `Dayjs`. Returns `null` on missing or unparseable input so the DatePicker's controlled-value contract stays clean.
 */
export const parseDateFilterValue = (value: string | undefined, picker: PickerMode): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, FORMAT_BY_PICKER[picker]);
  return parsed.isValid() ? parsed : null;
};

/**
 * Format a `Dayjs` (typically from `DatePicker.onChange`) into the server-facing string at the active picker's granularity. Returns `undefined` for empty input so callers can drop the value entirely.
 */
export const formatDateFilterValue = (value: Dayjs | null | undefined, picker: PickerMode): string | undefined => {
  if (!value || !dayjs.isDayjs(value)) return undefined;
  return value.format(FORMAT_BY_PICKER[picker]);
};

/**
 * v2 port of v1's `DateFilterDynamicComponent` — a multi-mode value input for the `$date*` operator family. Three sub-controls glued in a `Space.Compact` row:
 *
 * 1. Mode select — `Exact day` / `Past` / `Next` / `Today` / `This Week` / … Picking a relative mode emits a `{ type, number?, unit? }` descriptor that the server resolves at query time; picking `Exact day` emits a raw `Dayjs` instead.
 * 2. Picker granularity — only when mode is `Exact day`: `Date` / `Month` / `Quarter` / `Year`. Controls the antd `DatePicker`'s `picker` mode so admins can filter to e.g. "any day in 2026-03".
 * 3. Date input — antd `DatePicker` for single dates, or `DatePicker.RangePicker` when `isRange` is true (used by `$dateBetween`).
 *
 * v1 wired its own `<DatePicker.FilterWithPicker>` for the third slot; v2 inlines the picker-granularity selector here so we don't have to fork antd's DatePicker. Drops v1's `@emotion/css` (uses antd token spacing) and the `useCompile` schema-template chain (call sites pass a plain `t` translator).
 */
export const DateFilterDynamicComponent: React.FC<DateFilterDynamicComponentProps> = (props) => {
  const { value, onChange, isRange, t = identity } = props;
  const { token } = theme.useToken();
  const [picker, setPicker] = useState<PickerMode>('date');
  const [open, setOpen] = useState(false);

  const mode = isRelativeDescriptor(value) ? value.type : 'exact';

  const primaryOptions = useMemo(() => RELATIVE_PRIMARY.map((o) => ({ ...o, label: t(o.label) })), [t]);
  const secondaryOptions = useMemo(() => RELATIVE_SECONDARY.map((o) => ({ ...o, label: t(o.label) })), [t]);
  const pickerOptions = useMemo(() => PICKER_OPTIONS.map((o) => ({ ...o, label: t(o.label) })), [t]);
  const unitOptions = useMemo(() => UNIT_OPTIONS.map((o) => ({ ...o, label: t(o.label) })), [t]);

  const handleSelectMode = (next: string) => {
    setOpen(false);
    if (next === 'exact') {
      onChange?.(undefined);
      return;
    }
    if (next === 'past' || next === 'next') {
      onChange?.({ type: next, number: 1, unit: 'day' });
      return;
    }
    onChange?.({ type: next });
  };

  const renderModeDropdown = () => (
    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
      {primaryOptions.map((opt) => (
        <div
          key={opt.value}
          role="option"
          aria-selected={mode === opt.value}
          onClick={() => handleSelectMode(opt.value)}
          style={{
            padding: `${token.paddingXXS}px ${token.paddingSM}px`,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.label}
        </div>
      ))}
      <Divider style={{ margin: `${token.marginXXS}px 0` }} />
      {secondaryOptions.map((opt) => (
        <div
          key={opt.value}
          role="option"
          aria-selected={mode === opt.value}
          onClick={() => handleSelectMode(opt.value)}
          style={{
            padding: `${token.paddingXXS}px ${token.paddingSM}px`,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={opt.label}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );

  // Mode select compresses when the chosen mode is "Exact day / Past / Next" (room is needed for the secondary picker / number+unit row beside it). For named ranges (Today, This Week, etc.) it stretches since no sub-control follows.
  const compactModes = new Set(['exact', 'past', 'next']);
  const isCompact = compactModes.has(mode);

  return (
    <Space.Compact style={{ width: '100%' }}>
      <Select
        open={open}
        onDropdownVisibleChange={setOpen}
        value={mode}
        onChange={handleSelectMode}
        style={{
          flex: '0 0 auto',
          minWidth: 100,
          maxWidth: isCompact ? 100 : undefined,
          width: isCompact ? 100 : 'auto',
        }}
        popupMatchSelectWidth={false}
        dropdownRender={renderModeDropdown}
        options={[...primaryOptions, ...secondaryOptions]}
      />

      {(mode === 'past' || mode === 'next') && (
        <>
          <InputNumber
            value={isRelativeDescriptor(value) ? value.number : 1}
            min={1}
            onChange={(num) => {
              if (!isRelativeDescriptor(value)) return;
              onChange?.({ ...value, number: typeof num === 'number' ? num : 1 });
            }}
            style={{ flex: '0 0 auto' }}
          />
          <Select
            value={isRelativeDescriptor(value) ? value.unit : 'day'}
            onChange={(unit) => {
              if (!isRelativeDescriptor(value)) return;
              onChange?.({ ...value, unit });
            }}
            options={unitOptions}
            style={{ flex: '0 0 auto', minWidth: 130 }}
            popupMatchSelectWidth
          />
        </>
      )}

      {mode === 'exact' && !isRange && (
        <>
          <Select
            value={picker}
            onChange={(next) => {
              setPicker(next);
              // Picker change means the previously selected date is now expressed at a different granularity; clear it so the user doesn't carry a stale value into the new picker.
              onChange?.(undefined);
            }}
            options={pickerOptions}
            style={{ flex: '0 0 auto', width: 100 }}
            popupMatchSelectWidth={false}
          />
          <DatePicker
            // Stored value is a granularity-formatted string (e.g. `"2026-02"` for month picker). Hydrate it back to a Dayjs for antd's controlled-value contract, then re-emit a formatted string on change so the URL serialization matches v1 exactly. Without the format step, antd's Dayjs would JSON.stringify to a full ISO timestamp and the server's `$dateOn` would never match.
            value={parseDateFilterValue(typeof value === 'string' ? value : undefined, picker)}
            onChange={(next) => onChange?.(formatDateFilterValue(next, picker))}
            picker={picker}
            format={FORMAT_BY_PICKER[picker]}
            style={{ flex: 1, minWidth: 0 }}
          />
        </>
      )}

      {mode === 'exact' && isRange && (
        <DatePicker.RangePicker
          // `$dateBetween` always operates at day granularity in v1's URL output, so we pin the range format to `YYYY-MM-DD`.
          value={
            Array.isArray(value)
              ? ([parseDateFilterValue(value[0], 'date'), parseDateFilterValue(value[1], 'date')] as [
                  Dayjs | null,
                  Dayjs | null,
                ])
              : undefined
          }
          onChange={(next) => {
            if (!next || !next[0] || !next[1]) {
              onChange?.(undefined);
              return;
            }
            const [start, end] = next as [Dayjs, Dayjs];
            onChange?.([start.format(FORMAT_BY_PICKER.date), end.format(FORMAT_BY_PICKER.date)]);
          }}
          format={FORMAT_BY_PICKER.date}
          style={{ flex: 1, minWidth: 0 }}
        />
      )}
    </Space.Compact>
  );
};

export default DateFilterDynamicComponent;
