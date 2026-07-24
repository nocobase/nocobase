/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  RunJSSettingsConditionError,
  evaluateSettingsCondition,
  getSettingsValueAtPath,
  isSettingsFieldVisible,
  type RunJSSettingsCondition,
} from '../settings';

describe('@nocobase/runjs/settings condition evaluator', () => {
  it('deeply merges defaults and current settings before reading paths', () => {
    const input = {
      defaults: { display: { title: 'Default', count: 1 }, enabled: false },
      settings: { display: { count: 2 } },
    };

    expect(evaluateSettingsCondition(leaf('display.title', '$eq', 'Default'), input)).toBe(true);
    expect(evaluateSettingsCondition(leaf('display.count', '$eq', 2), input)).toBe(true);
    expect(evaluateSettingsCondition(leaf('enabled', '$eq', false), input)).toBe(true);
  });

  it('implements strict JSON equality without object key order coercion', () => {
    const settings = { value: { right: [1, '2'], left: true } };

    expect(evaluateSettingsCondition(leaf('value', '$eq', { left: true, right: [1, '2'] }), { settings })).toBe(true);
    expect(evaluateSettingsCondition(leaf('value.right', '$ne', [1, 2]), { settings })).toBe(true);
    expect(evaluateSettingsCondition(leaf('value.right', '$eq', ['2', 1]), { settings })).toBe(false);
  });

  it('supports $in and $notIn with strict deep comparison', () => {
    const settings = { mode: 1, selection: { id: 2 } };

    expect(evaluateSettingsCondition(leaf('mode', '$in', ['1', 1]), { settings })).toBe(true);
    expect(evaluateSettingsCondition(leaf('selection', '$in', [{ id: 1 }, { id: 2 }]), { settings })).toBe(true);
    expect(evaluateSettingsCondition(leaf('mode', '$notIn', [2, 3]), { settings })).toBe(true);
    expect(evaluateSettingsCondition(leaf('mode', '$notIn', [1]), { settings })).toBe(false);
  });

  it.each([
    [undefined, true],
    [null, true],
    ['', true],
    [[], true],
    [{}, true],
    [0, false],
    [false, false],
    ['   ', false],
    [[0], false],
    [{ value: null }, false],
  ])('uses the fixed empty semantics for %j', (value, empty) => {
    const settings = { value };
    expect(evaluateSettingsCondition({ path: 'value', operator: '$empty' }, { settings })).toBe(empty);
    expect(evaluateSettingsCondition({ path: 'value', operator: '$notEmpty' }, { settings })).toBe(!empty);
  });

  it('defines empty $and as true and empty $or as false', () => {
    expect(evaluateSettingsCondition({ logic: '$and', items: [] }, {})).toBe(true);
    expect(evaluateSettingsCondition({ logic: '$or', items: [] }, {})).toBe(false);
    expect(
      evaluateSettingsCondition(
        {
          logic: '$and',
          items: [leaf('mode', '$eq', 1), { logic: '$or', items: [leaf('enabled', '$eq', true)] }],
        },
        { settings: { mode: 1, enabled: true } },
      ),
    ).toBe(true);
  });

  it('reads only own object properties and rejects unsafe paths', () => {
    const inherited = Object.create({ inherited: true }) as Record<string, unknown>;
    inherited.safe = { value: 1 };

    expect(getSettingsValueAtPath(inherited, 'safe.value')).toBe(1);
    expect(getSettingsValueAtPath(inherited, 'inherited')).toBeUndefined();
    expect(() => getSettingsValueAtPath(inherited, '__proto__.polluted')).toThrow(RunJSSettingsConditionError);
  });

  it('keeps fields without a condition visible and throws for invalid internal conditions', () => {
    expect(isSettingsFieldVisible(undefined, { settings: {} })).toBe(true);
    expect(() =>
      evaluateSettingsCondition({ path: 'mode', operator: '$in', value: 1 } as unknown as RunJSSettingsCondition, {
        settings: { mode: 1 },
      }),
    ).toThrow('$in condition value must be an array');
    expect(() =>
      evaluateSettingsCondition(
        { path: 'mode', operator: '$contains', value: 1 } as unknown as RunJSSettingsCondition,
        { settings: { mode: 1 } },
      ),
    ).toThrow('is not supported');
    expect(() =>
      evaluateSettingsCondition({ path: 'mode', operator: '$eq' } as unknown as RunJSSettingsCondition, {
        settings: { mode: undefined },
      }),
    ).toThrow('value is required');
    expect(() =>
      evaluateSettingsCondition(
        { path: 'mode', operator: '$empty', value: null } as unknown as RunJSSettingsCondition,
        { settings: { mode: null } },
      ),
    ).toThrow('must not define a value');
    expect(() =>
      evaluateSettingsCondition(
        { path: 'mode', operator: '$eq', value: 1, extra: true } as unknown as RunJSSettingsCondition,
        { settings: { mode: 1 } },
      ),
    ).toThrow('field "extra" is not allowed');
    expect(() =>
      evaluateSettingsCondition({ logic: '$and', items: [], path: 'mode' } as unknown as RunJSSettingsCondition, {
        settings: { mode: 1 },
      }),
    ).toThrow('field "path" is not allowed');
    expect(() => getSettingsValueAtPath({}, 'bad segment')).toThrow('is not allowed');
    expect(() => getSettingsValueAtPath({}, Array.from({ length: 17 }, () => 'nested').join('.'))).toThrow(
      'too many segments',
    );
    expect(() => evaluateSettingsCondition(nestedCondition(9), { settings: { mode: 1 } })).toThrow('complexity limits');
    expect(() =>
      evaluateSettingsCondition(
        {
          logic: '$and',
          items: Array.from({ length: 33 }, () => ({ path: 'mode', operator: '$eq', value: 1 })),
        },
        { settings: { mode: 1 } },
      ),
    ).toThrow('too many items');
    expect(() =>
      evaluateSettingsCondition(
        {
          logic: '$and',
          items: Array.from({ length: 32 }, () => ({
            logic: '$or',
            items: [
              { path: 'mode', operator: '$eq', value: 1 },
              { path: 'mode', operator: '$ne', value: 2 },
            ],
          })),
        },
        { settings: { mode: 1 } },
      ),
    ).toThrow('complexity limits');
  });
});

function leaf(path: string, operator: '$eq' | '$ne' | '$in' | '$notIn', value: unknown): RunJSSettingsCondition {
  return { path, operator, value };
}

function nestedCondition(depth: number): RunJSSettingsCondition {
  return depth <= 1 ? leaf('mode', '$eq', 1) : { logic: '$and', items: [nestedCondition(depth - 1)] };
}
