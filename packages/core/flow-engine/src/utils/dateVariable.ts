/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import dayjs, { type ManipulateType } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

export const DATE_VARIABLE_ROOT = 'ctx.date';

const DATE_EXPRESSION_RE = /^\s*\{\{\s*(ctx\.date\.[^{}]+?)\s*\}\}\s*$/;
const EXACT_VALUE_PREFIX = 'v';

const DATE_PRESET_TYPES = [
  'now',
  'today',
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

const DATE_RELATIVE_DIRECTIONS = ['past', 'next'] as const;
const DATE_RELATIVE_UNITS = ['day', 'week', 'month', 'year'] as const;

export type DatePresetType = (typeof DATE_PRESET_TYPES)[number];
export type DateRelativeDirection = (typeof DATE_RELATIVE_DIRECTIONS)[number];
export type DateRelativeUnit = (typeof DATE_RELATIVE_UNITS)[number];

type DateVariableParsedBase = {
  server: boolean;
  expression: string;
  path: string[];
};

export type DateVariableParsedPreset = DateVariableParsedBase & {
  kind: 'preset';
  preset: DatePresetType;
};

export type DateVariableParsedRelative = DateVariableParsedBase & {
  kind: 'relative';
  direction: DateRelativeDirection;
  unit: DateRelativeUnit;
  number: number;
};

export type DateVariableParsedExactSingle = DateVariableParsedBase & {
  kind: 'exact';
  mode: 'single';
  picker: string;
  value: unknown;
};

export type DateVariableParsedExactRange = DateVariableParsedBase & {
  kind: 'exact';
  mode: 'range';
  picker: string;
  value: [unknown, unknown];
};

export type DateVariableParsed =
  | DateVariableParsedPreset
  | DateVariableParsedRelative
  | DateVariableParsedExactSingle
  | DateVariableParsedExactRange;

export type DateVariableBuildInput =
  | {
      kind: 'preset';
      preset: DatePresetType;
      server?: boolean;
    }
  | {
      kind: 'relative';
      direction: DateRelativeDirection;
      unit: DateRelativeUnit;
      number: number;
      server?: boolean;
    }
  | {
      kind: 'exact';
      mode: 'single';
      picker: string;
      value: unknown;
      server?: boolean;
    }
  | {
      kind: 'exact';
      mode: 'range';
      picker: string;
      value: [unknown, unknown];
      server?: boolean;
    };

function isDatePresetType(input: string): input is DatePresetType {
  return (DATE_PRESET_TYPES as readonly string[]).includes(input);
}

function isDateRelativeDirection(input: string): input is DateRelativeDirection {
  return (DATE_RELATIVE_DIRECTIONS as readonly string[]).includes(input);
}

function isDateRelativeUnit(input: string): input is DateRelativeUnit {
  return (DATE_RELATIVE_UNITS as readonly string[]).includes(input);
}

function toBase64(raw: string): string {
  const g = globalThis as any;
  if (g?.Buffer) {
    return g.Buffer.from(raw, 'utf8').toString('base64');
  }
  if (typeof btoa === 'function') {
    const Encoder = g?.TextEncoder;
    if (!Encoder) throw new Error('TextEncoder is not available');
    const bytes = new Encoder().encode(raw);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }
  throw new Error('No base64 encoder available in current runtime');
}

function fromBase64(raw: string): string {
  const g = globalThis as any;
  if (g?.Buffer) {
    return g.Buffer.from(raw, 'base64').toString('utf8');
  }
  if (typeof atob === 'function') {
    const Decoder = g?.TextDecoder;
    if (!Decoder) throw new Error('TextDecoder is not available');
    const binary = atob(raw);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Decoder().decode(bytes);
  }
  throw new Error('No base64 decoder available in current runtime');
}

function encodeSegmentValue(value: unknown): string {
  const raw = JSON.stringify(value);
  const serialized = typeof raw === 'string' ? raw : 'null';
  const base64 = toBase64(serialized);
  const safe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${EXACT_VALUE_PREFIX}${safe}`;
}

function decodeSegmentValue(segment: string): unknown | undefined {
  if (!segment.startsWith(EXACT_VALUE_PREFIX) || segment.length <= EXACT_VALUE_PREFIX.length) {
    return undefined;
  }
  try {
    const payload = segment.slice(EXACT_VALUE_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const raw = fromBase64(padded);
    return JSON.parse(raw);
  } catch (_) {
    return undefined;
  }
}

function buildExpressionFromSegments(pathSegments: string[], server: boolean): string {
  const segments = ['ctx', 'date', ...pathSegments];
  if (server) {
    segments.push('server');
  }
  return `{{ ${segments.join('.')} }}`;
}

export function isDateVariableExpression(value: unknown): boolean {
  return !!parseDateVariableExpression(value);
}

export function parseDateVariableExpression(value: unknown): DateVariableParsed | null {
  if (typeof value !== 'string') return null;
  const match = value.match(DATE_EXPRESSION_RE);
  if (!match) return null;

  const path = match[1]
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (path.length < 4 || path[0] !== 'ctx' || path[1] !== 'date') {
    return null;
  }

  const rawSegments = path.slice(2);
  const server = rawSegments[rawSegments.length - 1] === 'server';
  const segments = server ? rawSegments.slice(0, -1) : rawSegments;
  if (!segments.length || segments.includes('server')) {
    return null;
  }

  const kind = segments[0];

  if (kind === 'preset') {
    if (segments.length !== 2) return null;
    const preset = segments[1];
    if (!isDatePresetType(preset)) return null;
    const expression = buildExpressionFromSegments(['preset', preset], server);
    return {
      kind: 'preset',
      preset,
      server,
      expression,
      path: ['date', 'preset', preset, ...(server ? ['server'] : [])],
    };
  }

  if (kind === 'relative') {
    if (segments.length !== 4) return null;
    const direction = segments[1];
    const unit = segments[2];
    const numberSeg = segments[3];
    if (!isDateRelativeDirection(direction) || !isDateRelativeUnit(unit)) return null;
    const numberMatch = numberSeg.match(/^n(\d+)$/);
    if (!numberMatch) return null;
    const number = Number(numberMatch[1]);
    if (!Number.isFinite(number) || number < 1) return null;
    const expression = buildExpressionFromSegments(['relative', direction, unit, `n${number}`], server);
    return {
      kind: 'relative',
      direction,
      unit,
      number,
      server,
      expression,
      path: ['date', 'relative', direction, unit, `n${number}`, ...(server ? ['server'] : [])],
    };
  }

  if (kind === 'exact') {
    const mode = segments[1];
    if (mode !== 'single' && mode !== 'range') return null;

    if (mode === 'single') {
      if (segments.length !== 4) return null;
      const picker = segments[2];
      const decoded = decodeSegmentValue(segments[3]);
      if (typeof decoded === 'undefined') return null;
      const expression = buildExpressionFromSegments(['exact', 'single', picker, segments[3]], server);
      return {
        kind: 'exact',
        mode: 'single',
        picker,
        value: decoded,
        server,
        expression,
        path: ['date', 'exact', 'single', picker, segments[3], ...(server ? ['server'] : [])],
      };
    }

    if (segments.length !== 5) return null;
    const picker = segments[2];
    const decodedStart = decodeSegmentValue(segments[3]);
    const decodedEnd = decodeSegmentValue(segments[4]);
    if (typeof decodedStart === 'undefined' || typeof decodedEnd === 'undefined') return null;
    const expression = buildExpressionFromSegments(['exact', 'range', picker, segments[3], segments[4]], server);
    return {
      kind: 'exact',
      mode: 'range',
      picker,
      value: [decodedStart, decodedEnd],
      server,
      expression,
      path: ['date', 'exact', 'range', picker, segments[3], segments[4], ...(server ? ['server'] : [])],
    };
  }

  return null;
}

export function buildDateVariableExpression(input: DateVariableBuildInput): string {
  if (input.kind === 'preset') {
    return buildExpressionFromSegments(['preset', input.preset], !!input.server);
  }

  if (input.kind === 'relative') {
    const number = Number.isFinite(input.number) ? Math.max(1, Math.floor(input.number)) : 1;
    return buildExpressionFromSegments(['relative', input.direction, input.unit, `n${number}`], !!input.server);
  }

  if (input.kind === 'exact' && input.mode === 'single') {
    return buildExpressionFromSegments(
      ['exact', 'single', input.picker, encodeSegmentValue(input.value)],
      !!input.server,
    );
  }

  return buildExpressionFromSegments(
    ['exact', 'range', input.picker, encodeSegmentValue(input.value[0]), encodeSegmentValue(input.value[1])],
    !!input.server,
  );
}

function resolvePresetFrontendValue(preset: DatePresetType): string {
  const now = dayjs();
  switch (preset) {
    case 'now':
      return now.toISOString();
    case 'today':
      return now.format('YYYY-MM-DD');
    case 'yesterday':
      return now.subtract(1, 'day').format('YYYY-MM-DD');
    case 'tomorrow':
      return now.add(1, 'day').format('YYYY-MM-DD');
    case 'thisWeek':
      return now.startOf('isoWeek').format('GGGG[W]WW');
    case 'lastWeek':
      return now.subtract(1, 'week').startOf('isoWeek').format('GGGG[W]WW');
    case 'nextWeek':
      return now.add(1, 'week').startOf('isoWeek').format('GGGG[W]WW');
    case 'thisMonth':
      return now.format('YYYY-MM');
    case 'lastMonth':
      return now.subtract(1, 'month').format('YYYY-MM');
    case 'nextMonth':
      return now.add(1, 'month').format('YYYY-MM');
    case 'thisQuarter':
      return `${now.format('YYYY')}Q${now.quarter()}`;
    case 'lastQuarter': {
      const quarter = now.subtract(1, 'quarter');
      return `${quarter.format('YYYY')}Q${quarter.quarter()}`;
    }
    case 'nextQuarter': {
      const quarter = now.add(1, 'quarter');
      return `${quarter.format('YYYY')}Q${quarter.quarter()}`;
    }
    case 'thisYear':
      return now.format('YYYY');
    case 'lastYear':
      return now.subtract(1, 'year').format('YYYY');
    case 'nextYear':
      return now.add(1, 'year').format('YYYY');
  }
}

function resolveRelativeFrontendValue(
  direction: DateRelativeDirection,
  unit: DateRelativeUnit,
  number: number,
): string {
  const safeNumber = Number.isFinite(number) ? Math.max(1, Math.floor(number)) : 1;
  const offset = direction === 'past' ? -safeNumber : safeNumber;
  const manipulateUnit = unit as ManipulateType;
  const target = dayjs().add(offset, manipulateUnit);

  if (unit === 'day') {
    return target.format('YYYY-MM-DD');
  }

  if (unit === 'week') {
    return target.startOf('isoWeek').format('GGGG[W]WW');
  }

  if (unit === 'month') {
    return target.format('YYYY-MM');
  }

  return target.format('YYYY');
}

export function resolveDateVariableFrontendValue(parsed: DateVariableParsed): unknown {
  if (parsed.kind === 'preset') {
    return resolvePresetFrontendValue(parsed.preset);
  }

  if (parsed.kind === 'relative') {
    return resolveRelativeFrontendValue(parsed.direction, parsed.unit, parsed.number);
  }

  if (parsed.mode === 'single') {
    return parsed.value;
  }

  return [...parsed.value];
}

export function mapDateVariableServerValue(parsed: DateVariableParsed): unknown {
  if (parsed.kind === 'preset') {
    return `{{$nDate.${parsed.preset}}}`;
  }

  if (parsed.kind === 'relative') {
    const number = Number.isFinite(parsed.number) ? Math.max(1, Math.floor(parsed.number)) : 1;
    const dirPrefix = parsed.direction === 'past' ? 'last' : 'next';

    let key: string;
    if (parsed.unit === 'day') {
      if (number === 1) {
        key = parsed.direction === 'past' ? 'yesterday' : 'tomorrow';
      } else {
        key = `${dirPrefix}${number}Days`;
      }
    } else if (number === 1) {
      const singleMap: Record<DateRelativeUnit, string> = {
        day: parsed.direction === 'past' ? 'yesterday' : 'tomorrow',
        week: `${dirPrefix}Week`,
        month: `${dirPrefix}Month`,
        year: `${dirPrefix}Year`,
      };
      key = singleMap[parsed.unit];
    } else {
      const pluralMap: Record<DateRelativeUnit, string> = {
        day: 'Days',
        week: 'Weeks',
        month: 'Months',
        year: 'Years',
      };
      key = `${dirPrefix}${number}${pluralMap[parsed.unit]}`;
    }

    return `{{$nDate.${key}}}`;
  }

  if (parsed.mode === 'single') {
    return parsed.value;
  }

  return [...parsed.value];
}
