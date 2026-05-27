/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isTokenShorterThanSession, parseTimeValue } from '../pages/TokenPolicyPage';

describe('parseTimeValue', () => {
  it('parses minute / hour / day suffix', () => {
    expect(parseTimeValue('30m')).toEqual({ time: 30, unit: 'm' });
    expect(parseTimeValue('2h')).toEqual({ time: 2, unit: 'h' });
    expect(parseTimeValue('7d')).toEqual({ time: 7, unit: 'd' });
  });

  it('falls back to 10m when the value is missing', () => {
    expect(parseTimeValue(undefined)).toEqual({ time: 10, unit: 'm' });
    expect(parseTimeValue('')).toEqual({ time: 10, unit: 'm' });
  });

  it('falls back to 10m on malformed input — non-string and unsupported unit', () => {
    // matches v1 behaviour: anything that fails the `^(\d+)([mhd])$` regex
    // is treated as "no value" and replaced with the default. Without this,
    // a stale persisted unit like "10s" would break the unit dropdown.
    expect(parseTimeValue('10s')).toEqual({ time: 10, unit: 'm' });
    expect(parseTimeValue('abc')).toEqual({ time: 10, unit: 'm' });
    expect(parseTimeValue('10')).toEqual({ time: 10, unit: 'm' });
  });
});

describe('isTokenShorterThanSession', () => {
  it('returns true when token < session (different units)', () => {
    expect(isTokenShorterThanSession('1d', '7d')).toBe(true);
    expect(isTokenShorterThanSession('30m', '1h')).toBe(true);
    expect(isTokenShorterThanSession('23h', '1d')).toBe(true);
  });

  it('returns false when token equals session', () => {
    // Server rejects "token >= session". The v2 page mirrors that — equal
    // durations must NOT pass validation.
    expect(isTokenShorterThanSession('1d', '1d')).toBe(false);
    expect(isTokenShorterThanSession('60m', '1h')).toBe(false);
  });

  it('returns false when token > session', () => {
    expect(isTokenShorterThanSession('7d', '1d')).toBe(false);
    expect(isTokenShorterThanSession('2h', '60m')).toBe(false);
  });

  it('returns false for unparseable input', () => {
    // `ms('abc')` returns undefined. Better to fail closed (block submit)
    // than to send junk to the server.
    expect(isTokenShorterThanSession('abc', '1d')).toBe(false);
    expect(isTokenShorterThanSession('1d', 'abc')).toBe(false);
  });
});
