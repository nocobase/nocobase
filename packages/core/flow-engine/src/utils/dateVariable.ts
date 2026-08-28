/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs from 'dayjs';

const CTX_DATE_REGEX = /^\{\{\s*ctx\.date(?:\.(.+?))?\s*\}\}$/;

const PRESET_KEY_LIST = [
  'today',
  'now',
  'yesterday',
  'tomorrow',
  'thisWeek',
  'lastWeek',
  'nextWeek',
  'thisMonth',
  'lastMonth',
  'nextMonth',
  'thisQuarter',
  'lastQuarter',
  'nextQuarter',
  'thisYear',
  'lastYear',
  'nextYear',
] as const;

export type CtxDatePreset = (typeof PRESET_KEY_LIST)[number];
export type CtxDateRelativeDirection = 'next' | 'past';
export type CtxDateRelativeUnit = 'day' | 'week' | 'month' | 'year';

export type CtxDateExpressionConfig =
  | { kind: 'exact'; value: string | [string, string]; format?: string }
  | {
      kind: 'relative';
      direction: CtxDateRelativeDirection;
      amount: number;
      unit: CtxDateRelativeUnit;
      format?: string;
    }
  | { kind: 'preset'; preset: CtxDatePreset; format?: string };

const PRESET_KEYS = new Set<string>(PRESET_KEY_LIST);

const RELATIVE_DIRECTIONS = new Set(['next', 'past']);
const RELATIVE_UNITS = new Set(['day', 'week', 'month', 'year']);
const MAX_DATE_FORMAT_LENGTH = 128;

function parseCtxDateSegments(value: string): string[] | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const match = trimmed.match(CTX_DATE_REGEX);
  if (!match) return null;
  const rawPath = String(match[1] || '');
  if (!rawPath) return [];
  return rawPath
    .split('.')
    .map((seg) => seg.trim())
    .filter(Boolean);
}

function isBaseCtxDatePathPrefix(segments: string[]): boolean {
  if (segments[0] !== 'date') return false;
  if (segments.length === 1) return true;

  if (segments[1] === 'preset') {
    if (segments.length === 2) return true;
    return segments.length === 3 && PRESET_KEYS.has(segments[2]);
  }

  if (segments[1] === 'relative') {
    if (segments.length === 2) return true;
    if (segments.length === 3) return RELATIVE_DIRECTIONS.has(segments[2]);
    if (segments.length === 4) {
      return RELATIVE_DIRECTIONS.has(segments[2]) && RELATIVE_UNITS.has(segments[3]);
    }
    if (segments.length === 5) {
      return (
        RELATIVE_DIRECTIONS.has(segments[2]) &&
        RELATIVE_UNITS.has(segments[3]) &&
        typeof parseNumberToken(segments[4]) === 'number'
      );
    }
    return false;
  }

  if (segments[1] === 'exact') {
    if (segments.length === 2) return true;

    if (segments[2] === 'single') {
      if (segments.length === 3) return true;
      if (segments.length === 4) return segments[3] === 'date';
      if (segments.length === 5) return segments[3] === 'date' && /^v.+/.test(segments[4]);
      return false;
    }

    if (segments[2] === 'range') {
      if (segments.length === 3) return true;
      if (segments.length === 4) return segments[3] === 'date';
      if (segments.length === 5) return segments[3] === 'date' && /^v.+/.test(segments[4]);
      if (segments.length === 6) return segments[3] === 'date' && /^v.+/.test(segments[4]) && /^v.+/.test(segments[5]);
      return false;
    }

    return false;
  }

  return false;
}

function decodeFormatToken(token: string): string | undefined {
  const raw = String(token || '');
  if (!raw.startsWith('v')) return undefined;
  const decoded = decodeBase64Url(raw.slice(1));
  if (!decoded || decoded.length > MAX_DATE_FORMAT_LENGTH) return undefined;
  return decoded;
}

function splitFormattedDateSegments(segments: string[]): { baseSegments: string[]; format?: string } | null {
  if (segments[0] !== 'date') return null;
  if (segments[1] !== 'format') return { baseSegments: segments };
  if (segments.length < 4) return null;

  const format = decodeFormatToken(segments[2]);
  if (!format) return null;
  return { baseSegments: ['date', ...segments.slice(3)], format };
}

export function isCtxDatePathPrefix(pathSegments: string[]): boolean {
  const segments = withDatePrefix((pathSegments || []).map((seg) => String(seg)));
  if (segments[0] !== 'date') return false;
  if (segments.length === 1) return true;
  if (segments[1] !== 'format') return isBaseCtxDatePathPrefix(segments);
  if (segments.length === 2) return true;
  if (segments.length === 3) return typeof decodeFormatToken(segments[2]) === 'string';

  const formatted = splitFormattedDateSegments(segments);
  return formatted ? isBaseCtxDatePathPrefix(formatted.baseSegments) : false;
}

function withDatePrefix(pathSegments: string[]): string[] {
  if (pathSegments[0] === 'date') {
    return pathSegments;
  }
  return ['date', ...pathSegments];
}

function toCtxDateExpression(pathSegments: string[]): string {
  const segs = withDatePrefix(pathSegments);
  return `{{ ctx.${segs.join('.')} }}`;
}

function utf8ToBase64(input: string): string {
  const globalBuffer = (globalThis as any)?.Buffer;
  if (globalBuffer && typeof globalBuffer.from === 'function') {
    return globalBuffer.from(input, 'utf8').toString('base64');
  }

  if (typeof btoa === 'function') {
    const encoded = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_m, p1) =>
      String.fromCharCode(parseInt(p1, 16)),
    );
    return btoa(encoded);
  }

  throw new Error('No base64 encoder available');
}

function base64ToUtf8(input: string): string {
  const globalBuffer = (globalThis as any)?.Buffer;
  if (globalBuffer && typeof globalBuffer.from === 'function') {
    return globalBuffer.from(input, 'base64').toString('utf8');
  }

  if (typeof atob === 'function') {
    const binary = atob(input);
    const encoded = Array.from(binary)
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join('');
    return decodeURIComponent(encoded);
  }

  throw new Error('No base64 decoder available');
}

function normalizeToString(value: any): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (dayjs.isDayjs(value)) {
    return value.toISOString();
  }
  if (value instanceof Date) {
    return dayjs(value).toISOString();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function parseNumberToken(token: string): number | undefined {
  const match = String(token || '').match(/^n(\d+)$/);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function startOfIsoWeek(date: dayjs.Dayjs): dayjs.Dayjs {
  const day = date.day();
  const offset = day === 0 ? -6 : 1 - day;
  return date.add(offset, 'day').startOf('day');
}

function startOfQuarter(date: dayjs.Dayjs): dayjs.Dayjs {
  const month = date.month();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return date.month(quarterStartMonth).startOf('month');
}

export function encodeBase64Url(input: string): string {
  const base64 = utf8ToBase64(String(input || ''));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeBase64Url(input: string): string | undefined {
  try {
    const raw = String(input || '').replace(/=+$/g, '');
    if (!raw) return undefined;
    if (!/^[A-Za-z0-9_-]+$/.test(raw)) return undefined;

    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
    const padded = `${normalized}${'='.repeat(padLength)}`;
    const decoded = base64ToUtf8(padded);

    if (encodeBase64Url(decoded) !== raw) return undefined;
    return decoded;
  } catch (_error) {
    return undefined;
  }
}

export function isCtxDateExpression(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return CTX_DATE_REGEX.test(value.trim());
}

export function isCompleteCtxDatePath(pathSegments: string[]): boolean {
  if (!isCtxDatePathPrefix(pathSegments)) return false;
  const segments = withDatePrefix((pathSegments || []).map((seg) => String(seg)));
  const formatted = splitFormattedDateSegments(segments);
  if (!formatted) return false;
  const baseSegments = formatted.baseSegments;

  if (baseSegments[1] === 'preset') {
    return baseSegments.length === 3 && PRESET_KEYS.has(baseSegments[2]);
  }

  if (baseSegments[1] === 'relative') {
    if (baseSegments.length !== 5) return false;
    return (
      RELATIVE_DIRECTIONS.has(baseSegments[2]) &&
      RELATIVE_UNITS.has(baseSegments[3]) &&
      typeof parseNumberToken(baseSegments[4]) === 'number'
    );
  }

  if (baseSegments[1] === 'exact' && baseSegments[2] === 'single' && baseSegments[3] === 'date') {
    return baseSegments.length === 5 && /^v.+/.test(baseSegments[4]);
  }

  if (baseSegments[1] === 'exact' && baseSegments[2] === 'range' && baseSegments[3] === 'date') {
    return baseSegments.length === 6 && /^v.+/.test(baseSegments[4]) && /^v.+/.test(baseSegments[5]);
  }

  return false;
}

export function parseCtxDateExpression(value: unknown): any {
  if (!isCtxDateExpression(value)) return undefined;
  const rawSegments = withDatePrefix(parseCtxDateSegments(value as string) || []);
  const formatted = splitFormattedDateSegments(rawSegments);
  if (!formatted) return undefined;
  const segments = formatted.baseSegments;

  if (segments[1] === 'preset' && segments.length === 3 && PRESET_KEYS.has(segments[2])) {
    return { type: segments[2] };
  }

  if (
    segments[1] === 'relative' &&
    segments.length === 5 &&
    RELATIVE_DIRECTIONS.has(segments[2]) &&
    RELATIVE_UNITS.has(segments[3])
  ) {
    const amount = parseNumberToken(segments[4]);
    if (typeof amount === 'number') {
      return { type: segments[2], unit: segments[3], number: amount };
    }
    return undefined;
  }

  if (segments[1] === 'exact' && segments[2] === 'single' && segments[3] === 'date' && segments.length === 5) {
    const raw = String(segments[4] || '');
    if (!raw.startsWith('v')) return undefined;
    return decodeBase64Url(raw.slice(1));
  }

  if (segments[1] === 'exact' && segments[2] === 'range' && segments[3] === 'date' && segments.length === 6) {
    const leftRaw = String(segments[4] || '');
    const rightRaw = String(segments[5] || '');
    if (!leftRaw.startsWith('v') || !rightRaw.startsWith('v')) return undefined;
    const left = decodeBase64Url(leftRaw.slice(1));
    const right = decodeBase64Url(rightRaw.slice(1));
    if (typeof left === 'undefined' || typeof right === 'undefined') return undefined;
    return [left, right];
  }

  return undefined;
}

export function parseCtxDateExpressionConfig(value: unknown): CtxDateExpressionConfig | undefined {
  if (!isCtxDateExpression(value)) return undefined;
  const segments = withDatePrefix(parseCtxDateSegments(value) || []);
  const formatted = splitFormattedDateSegments(segments);
  if (!formatted) return undefined;

  const parsed = parseCtxDateExpression(value);
  const formatConfig = formatted.format ? { format: formatted.format } : {};
  if (typeof parsed === 'string') {
    return { kind: 'exact', value: parsed, ...formatConfig };
  }
  if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'string' && typeof parsed[1] === 'string') {
    return { kind: 'exact', value: [parsed[0], parsed[1]], ...formatConfig };
  }

  if (!parsed || typeof parsed !== 'object') return undefined;
  const typed = parsed as { type?: unknown; unit?: unknown; number?: unknown };
  if (typed.type === 'past' || typed.type === 'next') {
    if (typeof typed.unit !== 'string' || !RELATIVE_UNITS.has(typed.unit) || typeof typed.number !== 'number') {
      return undefined;
    }
    return {
      kind: 'relative',
      direction: typed.type,
      amount: typed.number,
      unit: typed.unit as CtxDateRelativeUnit,
      ...formatConfig,
    };
  }

  if (typeof typed.type === 'string' && PRESET_KEYS.has(typed.type)) {
    return { kind: 'preset', preset: typed.type as CtxDatePreset, ...formatConfig };
  }
  return undefined;
}

export function serializeCtxDateExpressionConfig(config: CtxDateExpressionConfig): string | undefined {
  let legacyValue: unknown;

  if (config.kind === 'preset') {
    if (!PRESET_KEYS.has(config.preset)) return undefined;
    legacyValue = { type: config.preset };
  } else if (config.kind === 'relative') {
    if (!RELATIVE_DIRECTIONS.has(config.direction) || !RELATIVE_UNITS.has(config.unit)) return undefined;
    const amount = Math.floor(Number(config.amount));
    if (!Number.isFinite(amount) || amount <= 0) return undefined;
    legacyValue = { type: config.direction, unit: config.unit, number: amount };
  } else {
    legacyValue = config.value;
  }

  const expression = serializeCtxDateValue(legacyValue);
  if (!expression || !config.format) return expression;

  const format = String(config.format);
  if (!format.trim() || format.length > MAX_DATE_FORMAT_LENGTH) return undefined;
  const segments = withDatePrefix(parseCtxDateSegments(expression) || []);
  return toCtxDateExpression(['date', 'format', `v${encodeBase64Url(format)}`, ...segments.slice(1)]);
}

export function serializeCtxDateValue(value: unknown): string | undefined {
  if (isCtxDateExpression(value)) {
    return String(value).trim();
  }

  if (value == null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    const start = normalizeToString(value[0]);
    const end = normalizeToString(value[1]);
    if (start && end) {
      return toCtxDateExpression([
        'date',
        'exact',
        'range',
        'date',
        `v${encodeBase64Url(start)}`,
        `v${encodeBase64Url(end)}`,
      ]);
    }
    if (start) {
      return toCtxDateExpression(['date', 'exact', 'single', 'date', `v${encodeBase64Url(start)}`]);
    }
    return undefined;
  }

  if (typeof value === 'object' && value) {
    const typed = value as { type?: unknown; unit?: unknown; number?: unknown };
    const type = typeof typed.type === 'string' ? typed.type : '';

    if (type === 'past' || type === 'next') {
      const unit = typeof typed.unit === 'string' && RELATIVE_UNITS.has(typed.unit) ? typed.unit : 'day';
      const rawNumber = Number(typed.number);
      const number = Number.isFinite(rawNumber) && rawNumber > 0 ? Math.floor(rawNumber) : 1;
      return toCtxDateExpression(['date', 'relative', type, unit, `n${number}`]);
    }

    if (PRESET_KEYS.has(type)) {
      return toCtxDateExpression(['date', 'preset', type]);
    }
  }

  const single = normalizeToString(value);
  if (single) {
    return toCtxDateExpression(['date', 'exact', 'single', 'date', `v${encodeBase64Url(single)}`]);
  }
  return undefined;
}

function formatResolvedDateValue(value: unknown, format: string): unknown {
  const formatValue = (item: unknown) => {
    if (typeof item !== 'string') return item;
    const parsed = dayjs(item);
    return parsed.isValid() ? parsed.format(format) : item;
  };
  return Array.isArray(value) ? value.map(formatValue) : formatValue(value);
}

export function resolveCtxDatePath(pathSegments: string[]): any {
  const rawSegments = withDatePrefix((pathSegments || []).map((seg) => String(seg)));
  const formatted = splitFormattedDateSegments(rawSegments);
  if (!formatted) return undefined;
  if (formatted.format) {
    return formatResolvedDateValue(resolveCtxDatePath(formatted.baseSegments), formatted.format);
  }
  const segments = formatted.baseSegments;
  if (segments[0] !== 'date') return undefined;

  if (segments[1] === 'preset' && segments.length === 3) {
    const key = segments[2];
    if (key === 'now') {
      return dayjs().toISOString();
    }

    const now = dayjs();

    if (key === 'today') return now.format('YYYY-MM-DD');
    if (key === 'yesterday') return now.add(-1, 'day').format('YYYY-MM-DD');
    if (key === 'tomorrow') return now.add(1, 'day').format('YYYY-MM-DD');

    if (key === 'thisWeek') return startOfIsoWeek(now).format('YYYY-MM-DD');
    if (key === 'lastWeek') return startOfIsoWeek(now.add(-1, 'week')).format('YYYY-MM-DD');
    if (key === 'nextWeek') return startOfIsoWeek(now.add(1, 'week')).format('YYYY-MM-DD');

    if (key === 'thisMonth') return now.startOf('month').format('YYYY-MM-DD');
    if (key === 'lastMonth') return now.add(-1, 'month').startOf('month').format('YYYY-MM-DD');
    if (key === 'nextMonth') return now.add(1, 'month').startOf('month').format('YYYY-MM-DD');

    if (key === 'thisQuarter') return startOfQuarter(now).format('YYYY-MM-DD');
    if (key === 'lastQuarter') return startOfQuarter(now.add(-3, 'month')).format('YYYY-MM-DD');
    if (key === 'nextQuarter') return startOfQuarter(now.add(3, 'month')).format('YYYY-MM-DD');

    if (key === 'thisYear') return now.startOf('year').format('YYYY-MM-DD');
    if (key === 'lastYear') return now.add(-1, 'year').startOf('year').format('YYYY-MM-DD');
    if (key === 'nextYear') return now.add(1, 'year').startOf('year').format('YYYY-MM-DD');

    return undefined;
  }

  if (
    segments[1] === 'relative' &&
    segments.length === 5 &&
    RELATIVE_DIRECTIONS.has(segments[2]) &&
    RELATIVE_UNITS.has(segments[3])
  ) {
    const amount = parseNumberToken(segments[4]);
    if (typeof amount !== 'number') return undefined;
    const direction = segments[2] === 'past' ? -1 : 1;
    const unit = segments[3] as dayjs.ManipulateType;
    return dayjs()
      .add(direction * amount, unit)
      .format('YYYY-MM-DD');
  }

  if (segments[1] === 'exact' && segments[2] === 'single' && segments[3] === 'date' && segments.length === 5) {
    const token = String(segments[4] || '');
    if (!token.startsWith('v')) return undefined;
    return decodeBase64Url(token.slice(1));
  }

  if (segments[1] === 'exact' && segments[2] === 'range' && segments[3] === 'date' && segments.length === 6) {
    const leftToken = String(segments[4] || '');
    const rightToken = String(segments[5] || '');
    if (!leftToken.startsWith('v') || !rightToken.startsWith('v')) return undefined;
    const left = decodeBase64Url(leftToken.slice(1));
    const right = decodeBase64Url(rightToken.slice(1));
    if (typeof left === 'undefined' || typeof right === 'undefined') return undefined;
    return [left, right];
  }

  return undefined;
}
