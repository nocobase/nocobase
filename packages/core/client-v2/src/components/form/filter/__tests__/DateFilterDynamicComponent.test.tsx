/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  DateFilterDynamicComponent,
  FORMAT_BY_PICKER,
  formatDateFilterValue,
  parseDateFilterValue,
} from '../DateFilterDynamicComponent';

// `formatDateFilterValue` needs the quarter plugin to format `[Q]Q`, and `parseDateFilterValue` needs customParseFormat to parse non-ISO strings like `2026-02`. The component itself imports `dayjs` directly and relies on plugins being registered at app boot; in tests we register them locally so the unit-style helpers can run standalone.
dayjs.extend(customParseFormat);
dayjs.extend(quarterOfYear);

function openModeDropdown(container: HTMLElement) {
  const selector = container.querySelector('.ant-select-selector');
  if (!selector) throw new Error('expected mode Select to be rendered');
  fireEvent.mouseDown(selector);
}

describe('DateFilterDynamicComponent', () => {
  it('defaults to Exact day mode and shows the picker-granularity + DatePicker controls', () => {
    const { container } = render(<DateFilterDynamicComponent value={undefined} onChange={() => undefined} />);
    // Three controls in the compact row: mode select, granularity select, DatePicker. antd renders Select via `.ant-select`, DatePicker via `.ant-picker`.
    expect(container.querySelectorAll('.ant-select').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('.ant-picker')).not.toBeNull();
    // Mode display reads "Exact day" with no value yet.
    expect(screen.getByText('Exact day')).toBeInTheDocument();
  });

  it('emits { type: "past", number: 1, unit: "day" } when switching mode to Past', () => {
    const onChange = vi.fn();
    const { container } = render(<DateFilterDynamicComponent value={undefined} onChange={onChange} />);

    openModeDropdown(container);
    // "Past" appears in the dropdown's primary list (rendered via dropdownRender, so options have role="option" instead of antd's stock list).
    const option = screen.getAllByRole('option').find((el) => el.textContent === 'Past');
    if (!option) throw new Error('expected a Past option in the dropdown');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({ type: 'past', number: 1, unit: 'day' });
  });

  it('emits { type: "today" } when switching mode to Today (no number / unit / picker)', () => {
    const onChange = vi.fn();
    const { container } = render(<DateFilterDynamicComponent value={undefined} onChange={onChange} />);

    openModeDropdown(container);
    const option = screen.getAllByRole('option').find((el) => el.textContent === 'Today');
    if (!option) throw new Error('expected a Today option in the dropdown');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith({ type: 'today' });
  });

  it('emits undefined (clears the descriptor) when switching back to Exact day', () => {
    const onChange = vi.fn();
    const { container } = render(<DateFilterDynamicComponent value={{ type: 'today' }} onChange={onChange} />);

    openModeDropdown(container);
    const option = screen.getAllByRole('option').find((el) => el.textContent === 'Exact day');
    if (!option) throw new Error('expected an Exact day option in the dropdown');
    fireEvent.click(option);

    // Exact mode owns its value via the DatePicker, so the descriptor is cleared first; the picker emits its own value on user pick.
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('shows InputNumber + unit Select when the value is a past/next descriptor', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateFilterDynamicComponent value={{ type: 'past', number: 3, unit: 'week' }} onChange={onChange} />,
    );

    // InputNumber present (antd renders `.ant-input-number`); unit Select is the second `.ant-select` in the row (mode is first).
    expect(container.querySelector('.ant-input-number')).not.toBeNull();
    expect(container.querySelectorAll('.ant-select').length).toBeGreaterThanOrEqual(2);
    // DatePicker should NOT be rendered in relative-number mode.
    expect(container.querySelector('.ant-picker')).toBeNull();
  });

  it('renders the RangePicker when isRange is true', () => {
    const { container } = render(<DateFilterDynamicComponent value={undefined} onChange={() => undefined} isRange />);
    // RangePicker carries the `.ant-picker-range` class; the granularity Select is suppressed in range mode (only mode select + range picker).
    expect(container.querySelector('.ant-picker-range')).not.toBeNull();
  });

  it('hydrates a stored granularity-formatted string back into the DatePicker', () => {
    // `2026-02-15` is the canonical Date-picker shape NocoBase's `$dateOn` operator emits when the user picks an exact day. The DatePicker must hydrate from it (so reopening the popover or re-rendering keeps the value) instead of treating it as an opaque blob.
    //
    // Note: the picker-mode state is local to the component and defaults to `date` on every mount, so values stored at other granularities (`2026-02` for month, `2026` for year) won't pre-fill on remount — only when the user is still in the same session. This matches v1's behaviour, where reopening a filter popover also re-derives the picker mode from the input shape.
    const { container } = render(<DateFilterDynamicComponent value="2026-02-15" onChange={() => undefined} />);
    const dateInput = container.querySelector('.ant-picker input') as HTMLInputElement;
    if (!dateInput) throw new Error('expected antd DatePicker input to be rendered');
    expect(dateInput.value).toBe('2026-02-15');
  });

  describe('format helpers (parseDateFilterValue / formatDateFilterValue)', () => {
    // These two helpers are the heart of the v1-compatible URL output: `formatDateFilterValue` converts a Dayjs into the picker-shaped string the server expects, and `parseDateFilterValue` round-trips back so the controlled DatePicker can hydrate. Driving them directly is more reliable than poking antd's picker panel under jsdom.

    it('formats Dayjs values per picker granularity (date / month / quarter / year)', () => {
      const sample = dayjs('2026-02-15');
      expect(formatDateFilterValue(sample, 'date')).toBe('2026-02-15');
      expect(formatDateFilterValue(sample, 'month')).toBe('2026-02');
      expect(formatDateFilterValue(sample, 'year')).toBe('2026');
      expect(formatDateFilterValue(sample, 'quarter')).toBe('2026-Q1');
    });

    it('returns undefined for empty / non-Dayjs input so callers can drop the value', () => {
      expect(formatDateFilterValue(null, 'date')).toBeUndefined();
      expect(formatDateFilterValue(undefined, 'date')).toBeUndefined();
    });

    it('round-trips a granularity string back into a Dayjs at the matching format', () => {
      const parsed = parseDateFilterValue('2026-02', 'month');
      expect(parsed?.isValid()).toBe(true);
      expect(parsed?.format(FORMAT_BY_PICKER.month)).toBe('2026-02');
    });

    it('returns null for missing / unparseable strings', () => {
      expect(parseDateFilterValue(undefined, 'month')).toBeNull();
      expect(parseDateFilterValue('', 'month')).toBeNull();
      expect(parseDateFilterValue('not-a-date', 'month')).toBeNull();
    });
  });

  it('translates mode labels via the provided t function', () => {
    const t = (key: string) => (key === 'Past' ? 'PAST_ZH' : key);
    const { container } = render(<DateFilterDynamicComponent value={undefined} onChange={() => undefined} t={t} />);

    openModeDropdown(container);
    // The translated label should appear in the dropdown options.
    expect(screen.getAllByRole('option').some((el) => el.textContent === 'PAST_ZH')).toBe(true);
    expect(container).toBeTruthy();
  });
});
