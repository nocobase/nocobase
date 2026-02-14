/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { parseCtxDateExpression } from '@nocobase/flow-engine';
import { dayjs } from '@nocobase/utils/client';
import {
  normalizeDateVariableExactValue,
  normalizeDateVariableOutput,
  toExactPickerDisplayValue,
  type DateVariableExactNormalizeMode,
} from '../FieldAssignValueInput';

function normalizeExact(rawValue: any, mode: DateVariableExactNormalizeMode, format: string, showTime = false) {
  return normalizeDateVariableExactValue(rawValue, {
    exactNormalizeMode: mode,
    format,
    showTime,
  });
}

describe('FieldAssignValueInput date exact normalization', () => {
  it('normalizes date exact value from MMMM Do YYYY to YYYY-MM-DD', () => {
    const normalized = normalizeExact('February 12th 2026', 'date', 'MMMM Do YYYY');
    expect(normalized).toBe('2026-02-12');

    const serialized = normalizeDateVariableOutput(normalized, {
      picker: 'date',
      showTime: false,
      timeFormat: 'HH:mm:ss',
      format: 'MMMM Do YYYY',
      exactNormalizeMode: 'date',
    });

    expect(typeof serialized).toBe('string');
    expect(parseCtxDateExpression(serialized)).toBe('2026-02-12');
  });

  it('normalizes datetimeNoTz exact value to stable datetime string', () => {
    const normalized = normalizeExact('12/02/2026 23:45:01', 'datetimeNoTz', 'DD/MM/YYYY HH:mm:ss', true);
    expect(normalized).toBe('2026-02-12 23:45:01');

    const serialized = normalizeDateVariableOutput(normalized, {
      picker: 'date',
      showTime: true,
      timeFormat: 'HH:mm:ss',
      format: 'DD/MM/YYYY HH:mm:ss',
      exactNormalizeMode: 'datetimeNoTz',
    });

    expect(parseCtxDateExpression(serialized)).toBe('2026-02-12 23:45:01');
  });

  it('normalizes tz-aware datetime exact value to ISO string', () => {
    const normalized = normalizeExact('12/02/2026 23:45:01', 'iso', 'DD/MM/YYYY HH:mm:ss', true);
    expect(typeof normalized).toBe('string');
    expect(normalized).toContain('T');

    const serialized = normalizeDateVariableOutput(normalized, {
      picker: 'date',
      showTime: true,
      timeFormat: 'HH:mm:ss',
      format: 'DD/MM/YYYY HH:mm:ss',
      exactNormalizeMode: 'iso',
    });

    const parsed = parseCtxDateExpression(serialized);
    expect(typeof parsed).toBe('string');
    expect(parsed).toContain('T');
  });

  it('keeps preset/relative objects unchanged', () => {
    const preset = { type: 'today' };
    const relative = { type: 'next', unit: 'day', number: 2 };

    const serializedPreset = normalizeDateVariableOutput(preset, {
      picker: 'date',
      showTime: false,
      timeFormat: 'HH:mm:ss',
      format: 'YYYY-MM-DD',
      exactNormalizeMode: 'date',
    });
    const serializedRelative = normalizeDateVariableOutput(relative, {
      picker: 'date',
      showTime: false,
      timeFormat: 'HH:mm:ss',
      format: 'YYYY-MM-DD',
      exactNormalizeMode: 'date',
    });

    expect(parseCtxDateExpression(serializedPreset)).toEqual(preset);
    expect(parseCtxDateExpression(serializedRelative)).toEqual(relative);
  });

  it('falls back to original value when parsing fails', () => {
    const raw = 'Not a valid date';
    const normalized = normalizeExact(raw, 'iso', 'MMMM Do YYYY', true);
    expect(normalized).toBe(raw);

    const serialized = normalizeDateVariableOutput(raw, {
      picker: 'date',
      showTime: true,
      timeFormat: 'HH:mm:ss',
      format: 'MMMM Do YYYY',
      exactNormalizeMode: 'iso',
    });

    expect(parseCtxDateExpression(serialized)).toBe(raw);
  });

  it('supports weekday-only display by normalizing dayjs exact value', () => {
    const normalized = normalizeExact(dayjs('2026-02-13', 'YYYY-MM-DD'), 'date', 'dddd');
    expect(normalized).toBe('2026-02-13');

    const serialized = normalizeDateVariableOutput(dayjs('2026-02-13', 'YYYY-MM-DD'), {
      picker: 'date',
      showTime: false,
      timeFormat: 'HH:mm:ss',
      format: 'dddd',
      exactNormalizeMode: 'date',
    });

    expect(parseCtxDateExpression(serialized)).toBe('2026-02-13');
  });

  it('keeps exact picker display date with weekday-only format', () => {
    const display = toExactPickerDisplayValue('2026-02-13 18:14:15', {
      format: 'dddd HH:mm:ss',
      isRange: false,
    });

    expect(dayjs.isDayjs(display)).toBe(true);
    expect((display as any).format('YYYY-MM-DD HH:mm:ss')).toBe('2026-02-13 18:14:15');
  });

  it('keeps exact picker display date for ISO input with weekday-only format', () => {
    const display = toExactPickerDisplayValue('2037-03-06T12:34:56.000Z', {
      format: 'dddd HH:mm:ss',
      isRange: false,
    });

    expect(dayjs.isDayjs(display)).toBe(true);
    expect((display as any).year()).toBe(2037);
    expect((display as any).date()).toBe(6);
  });

  it('keeps exact range picker display dates with weekday-only format', () => {
    const display = toExactPickerDisplayValue(['2026-02-13 18:14:15', '2026-02-14 01:02:03'], {
      format: 'dddd HH:mm:ss',
      isRange: true,
    });

    expect(Array.isArray(display)).toBe(true);
    expect(dayjs.isDayjs((display as any)?.[0])).toBe(true);
    expect(dayjs.isDayjs((display as any)?.[1])).toBe(true);
    expect((display as any)[0].format('YYYY-MM-DD HH:mm:ss')).toBe('2026-02-13 18:14:15');
    expect((display as any)[1].format('YYYY-MM-DD HH:mm:ss')).toBe('2026-02-14 01:02:03');
  });

  it('keeps exact range picker display dates for ISO input with weekday-only format', () => {
    const display = toExactPickerDisplayValue(['2037-03-06T12:34:56.000Z', '2037-03-07T01:02:03.000Z'], {
      format: 'dddd HH:mm:ss',
      isRange: true,
    });

    expect(Array.isArray(display)).toBe(true);
    expect(dayjs.isDayjs((display as any)?.[0])).toBe(true);
    expect(dayjs.isDayjs((display as any)?.[1])).toBe(true);
    expect((display as any)[0].year()).toBe(2037);
    expect((display as any)[1].year()).toBe(2037);
    expect((display as any)[0].date()).toBe(6);
    expect((display as any)[1].date()).toBe(7);
  });
});
