import { describe, expect, it } from 'vitest';
import { DefaultNamingStrategy } from '../../../src/naming/default-strategy.js';
import { prepareResultRowMapper } from '../../../src/query/internal/result-row-mapper.js';

describe('query result row mapping', () => {
  const naming = new DefaultNamingStrategy({ underscored: true });

  it('maps aliases, wildcard columns, hidden values and decoded nulls without changing input', () => {
    const map = prepareResultRowMapper(
      {
        explicit: new Map([['raw_value', 'alias_value']]),
        hidden: new Set(['internal_key']),
        mapUnmatchedColumns: true,
        scalarDecoders: new Map([['json_value', () => null]]),
      },
      naming,
    );
    const row = {
      raw_value: 42,
      created_at: 'today',
      json_value: 'null',
      internal_key: 1,
    };
    expect(map(row)).toEqual({
      alias_value: 42,
      createdAt: 'today',
      jsonValue: null,
    });
    expect(row).toEqual({
      raw_value: 42,
      created_at: 'today',
      json_value: 'null',
      internal_key: 1,
    });
    expect(map({ raw_value: 7, json_value: 'null', extra_column: 0 })).toEqual({
      alias_value: 7,
      jsonValue: null,
      extraColumn: 0,
    });
    expect(map({})).toEqual({});
  });

  it('preserves prototype-like names as writable own data properties', () => {
    const map = prepareResultRowMapper(
      {
        explicit: new Map([['value', '__proto__']]),
        mapUnmatchedColumns: false,
      },
      naming,
    );
    const prototype = { injected: true };
    const result = map({ value: prototype, constructor: 1, toString: 2 });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(result, '__proto__')).toEqual({
      value: prototype,
      enumerable: true,
      configurable: true,
      writable: true,
    });
    expect(result.constructor).toBe(1);
    expect(result.toString).toBe(2);
    expect(Object.hasOwn(result, 'injected')).toBe(false);
  });

  it('preserves physical names when unmatched column mapping is disabled', () => {
    const map = prepareResultRowMapper(
      { explicit: new Map(), mapUnmatchedColumns: false },
      naming,
    );
    expect(map({ created_at: null })).toEqual({ created_at: null });
  });
});
