/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  decodeBase64Url,
  encodeBase64Url,
  isCompleteCtxDatePath,
  isCtxDatePathPrefix,
  isCtxDateExpression,
  parseCtxDateExpression,
  parseCtxDateExpressionConfig,
  resolveCtxDatePath,
  serializeCtxDateExpressionConfig,
  serializeCtxDateValue,
} from '../dateVariable';

describe('dateVariable utils', () => {
  it('encodes and decodes base64url', () => {
    const raw = '2026-02-12 10:11:12';
    const encoded = encodeBase64Url(raw);
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toBe(raw);
  });

  it('detects ctx.date expression', () => {
    expect(isCtxDateExpression('{{ ctx.date.preset.today }}')).toBe(true);
    expect(isCtxDateExpression('{{ ctx.user.name }}')).toBe(false);
    expect(isCtxDateExpression('')).toBe(false);
  });

  it('serializes preset/relative/exact single/range', () => {
    expect(serializeCtxDateValue({ type: 'today' })).toBe('{{ ctx.date.preset.today }}');
    expect(serializeCtxDateValue({ type: 'next', unit: 'day', number: 12 })).toBe(
      '{{ ctx.date.relative.next.day.n12 }}',
    );

    const single = serializeCtxDateValue('2026-02-12');
    expect(single?.startsWith('{{ ctx.date.exact.single.date.v')).toBe(true);

    const range = serializeCtxDateValue(['2026-02-12', '2026-02-20']);
    expect(range?.startsWith('{{ ctx.date.exact.range.date.v')).toBe(true);
    expect(range?.includes('.v')).toBe(true);
  });

  it('parses expression back to ui value', () => {
    expect(parseCtxDateExpression('{{ ctx.date.preset.today }}')).toEqual({ type: 'today' });
    expect(parseCtxDateExpression('{{ ctx.date.relative.past.month.n2 }}')).toEqual({
      type: 'past',
      unit: 'month',
      number: 2,
    });

    const singleExpr = serializeCtxDateValue('2026-02-12');
    if (!singleExpr) throw new Error('Expected exact date expression');
    expect(parseCtxDateExpression(singleExpr)).toBe('2026-02-12');

    const rangeExpr = serializeCtxDateValue(['2026-02-12', '2026-02-20']);
    if (!rangeExpr) throw new Error('Expected exact date range expression');
    expect(parseCtxDateExpression(rangeExpr)).toEqual(['2026-02-12', '2026-02-20']);
  });

  it('serializes, parses and resolves formatted expressions', () => {
    const expression = serializeCtxDateExpressionConfig({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY/MM/DD',
    });
    if (!expression) throw new Error('Expected formatted date expression');

    expect(expression).toMatch(/^\{\{ ctx\.date\.format\.v[A-Za-z0-9_-]+\.preset\.today \}\}$/);
    expect(parseCtxDateExpressionConfig(expression)).toEqual({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY/MM/DD',
    });
    // Keep the legacy parser contract for filter-form consumers.
    expect(parseCtxDateExpression(expression)).toEqual({ type: 'today' });

    const path = expression.replace('{{ ctx.', '').replace(' }}', '').split('.');
    expect(resolveCtxDatePath(path)).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
    expect(isCompleteCtxDatePath(path)).toBe(true);
  });

  it('preserves significant whitespace in a custom Format', () => {
    const expression = serializeCtxDateExpressionConfig({
      kind: 'preset',
      preset: 'today',
      format: 'YYYY-MM-DD ',
    });
    if (!expression) throw new Error('Expected formatted date expression');

    expect(parseCtxDateExpressionConfig(expression)?.format).toBe('YYYY-MM-DD ');
  });

  it('formats exact ranges element by element', () => {
    const expression = serializeCtxDateExpressionConfig({
      kind: 'exact',
      value: ['2026-02-12', '2026-02-20'],
      format: 'YYYYMMDD',
    });
    if (!expression) throw new Error('Expected formatted date range expression');
    const path = expression.replace('{{ ctx.', '').replace(' }}', '').split('.');

    expect(resolveCtxDatePath(path)).toEqual(['20260212', '20260220']);
  });

  it('resolves preset/relative/exact path', () => {
    expect(typeof resolveCtxDatePath(['date', 'preset', 'now'])).toBe('string');

    const today = resolveCtxDatePath(['date', 'preset', 'today']);
    expect(typeof today).toBe('string');
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const rel = resolveCtxDatePath(['date', 'relative', 'next', 'day', 'n12']);
    expect(typeof rel).toBe('string');
    expect(rel).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const singleExpr = serializeCtxDateValue('2026-02-12');
    if (!singleExpr) throw new Error('Expected exact date expression');
    const token = singleExpr.replace('{{ ctx.date.exact.single.date.', '').replace(' }}', '');
    expect(resolveCtxDatePath(['date', 'exact', 'single', 'date', token])).toBe('2026-02-12');

    const rangeExpr = serializeCtxDateValue(['2026-02-12', '2026-02-20']);
    if (!rangeExpr) throw new Error('Expected exact date range expression');
    const parts = rangeExpr.replace('{{ ctx.date.exact.range.date.', '').replace(' }}', '').split('.');
    expect(resolveCtxDatePath(['date', 'exact', 'range', 'date', parts[0], parts[1]])).toEqual([
      '2026-02-12',
      '2026-02-20',
    ]);
  });

  it('validates complete ctx.date path', () => {
    expect(isCompleteCtxDatePath(['date', 'preset', 'today'])).toBe(true);
    expect(isCompleteCtxDatePath(['date', 'relative', 'next', 'day', 'n12'])).toBe(true);
    expect(isCompleteCtxDatePath(['date', 'exact', 'single', 'date', 'vabc'])).toBe(true);
    expect(isCompleteCtxDatePath(['date', 'exact', 'range', 'date', 'vabc', 'vdef'])).toBe(true);
    expect(isCompleteCtxDatePath(['date', 'relative', 'next', 'day'])).toBe(false);
    expect(isCtxDatePathPrefix(['date', 'format'])).toBe(true);
    expect(isCompleteCtxDatePath(['user', 'name'])).toBe(false);
  });

  it('handles invalid base64 and path gracefully', () => {
    expect(decodeBase64Url('@@@')).toBeUndefined();
    expect(parseCtxDateExpression('{{ ctx.date.exact.single.date.v@@@ }}')).toBeUndefined();
    expect(resolveCtxDatePath(['date', 'exact', 'single', 'date', 'v@@@'])).toBeUndefined();
  });
});
