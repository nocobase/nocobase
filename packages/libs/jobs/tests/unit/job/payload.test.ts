import { describe, expect, it, vi } from 'vitest';
import { copyJobPayload } from '../../../src/job/validation.js';

describe('ordinary job JSON snapshots', () => {
  it.each([
    null,
    false,
    true,
    0,
    -2.5,
    '',
    'payload',
    [],
    { a: 1, nested: ['x', null] },
  ])('copies valid JSON data %j', (value) => {
    expect(copyJobPayload(value)).toEqual(value);
  });

  it('copies shared non-cyclic values without retaining their identity', () => {
    const child = { a: 1 };
    const source = { a: child, b: child };
    const snapshot = copyJobPayload(source);
    child.a = 2;
    expect(snapshot).toEqual({ a: { a: 1 }, b: { a: 1 } });
    expect(snapshot).not.toBe(source);
  });

  it.each([
    undefined,
    Number.NaN,
    Infinity,
    -Infinity,
    1n,
    Symbol('x'),
    () => undefined,
    new Date(),
    new Map(),
    new Set(),
    { a: undefined },
    [undefined],
    Array(2),
  ])('rejects data JSON would drop or transform: %s', (value) => {
    expect(() => copyJobPayload(value)).toThrow(TypeError);
  });

  it('rejects cycles, class instances, sparse arrays and non-index array properties', () => {
    const circular: { self?: unknown } = {};
    circular.self = circular;
    class Service {
      readonly url = 'service';
    }
    const extra: number[] = [1];
    Object.defineProperty(extra, 'extra', { value: true, enumerable: true });
    const hole: unknown[] = Array(1);
    Object.defineProperty(hole, 'extra', { value: true, enumerable: true });
    for (const value of [circular, { service: new Service() }, extra, hole])
      expect(() => copyJobPayload(value)).toThrow(TypeError);
  });

  it('rejects accessors without executing them and rejects hidden or symbol fields', () => {
    const getter = vi.fn(() => 1);
    const accessor = Object.defineProperty({}, 'value', {
      get: getter,
      enumerable: true,
    });
    const hidden = Object.defineProperty({}, 'value', { value: 1 });
    for (const value of [accessor, hidden, { [Symbol('x')]: 1 }])
      expect(() => copyJobPayload(value)).toThrow(TypeError);
    expect(getter).not.toHaveBeenCalled();
  });
});
