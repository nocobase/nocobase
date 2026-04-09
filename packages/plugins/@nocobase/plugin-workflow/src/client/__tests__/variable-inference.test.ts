/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { inferVariableChildren, resolveChildrenFromConfigValue } from '../variable';

const defaultFieldNames = { label: 'label', value: 'value', children: 'children' };

describe('inferVariableChildren', () => {
  function children(value: unknown) {
    return inferVariableChildren(value, defaultFieldNames);
  }

  it('array of objects: infers merged keys', () => {
    const result = children([
      { a: 1, b: 1 },
      { a: 2, b: 2 },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.value).sort()).toEqual(['a', 'b']);
    expect(result.every((r) => r.isLeaf)).toBe(true);
  });

  it('array of objects: handles heterogeneous keys by merging', () => {
    const result = children([{ a: 1 }, { b: 2 }]);
    expect(result.map((r) => r.value).sort()).toEqual(['a', 'b']);
  });

  it('array of primitives: returns null (no inferrable fields)', () => {
    expect(children([1, 2, 3])).toBeNull();
    expect(children(['a', 'b'])).toBeNull();
    expect(children([true, false])).toBeNull();
  });

  it('empty array: returns null', () => {
    expect(children([])).toBeNull();
  });

  it('plain object: infers top-level keys as children', () => {
    const result = children({ a: 1, b: 2 });
    expect(result.map((r) => r.value).sort()).toEqual(['a', 'b']);
  });

  it('nested object: recurses up to MAX_INFER_DEPTH (4) levels', () => {
    const result = children({ a: { b: { c: { d: { e: 1 } } } } });
    // depth 0: root -> children: [a]
    // depth 1: a -> children: [b]
    // depth 2: b -> children: [c]
    // depth 3: c -> children: [d]
    // depth 4: d -> children: [e] (leaf)
    function findValue(opts: any[], val: string): any {
      return opts?.find((o) => o.value === val);
    }
    const a = findValue(result, 'a');
    expect(a).toBeDefined();
    const b = findValue(a.children, 'b');
    expect(b).toBeDefined();
    const c = findValue(b.children, 'c');
    expect(c).toBeDefined();
    const d = findValue(c.children, 'd');
    expect(d).toBeDefined();
    const e = findValue(d.children, 'e');
    expect(e).toBeDefined();
    expect(e.isLeaf).toBe(true);
    // e's children would be null (at depth limit)
  });

  it('scalar value: returns null', () => {
    expect(children(42)).toBeNull();
    expect(children('hello')).toBeNull();
    expect(children(true)).toBeNull();
    expect(children(null)).toBeNull();
    expect(children(undefined)).toBeNull();
  });

  it('mixed array: returns null (primitive + object)', () => {
    // [{a:1}, 2] - when item is primitive, inferShape returns null
    // mergeShape(null, null) = null per item, so overall null
    expect(children([{ a: 1 }, 2] as any)).toBeNull();
  });

  it('null items in array: skipped gracefully', () => {
    const result = children([{ a: 1 }, null, { b: 2 }] as any);
    expect(result.map((r) => r.value).sort()).toEqual(['a', 'b']);
  });

  it('uses custom fieldNames', () => {
    const custom = { label: 'title', value: 'key', children: 'leaf' };
    const result = inferVariableChildren([{ a: 1 }], custom);
    expect(result[0]).toHaveProperty('key', 'a');
    expect(result[0]).toHaveProperty('title', 'a');
    expect(result[0]).toHaveProperty('leaf', null);
  });
});

describe('resolveChildrenFromConfigValue', () => {
  const mockInstructions = new Map();

  function resolve(configValue: string, upstreamNodes: any[] = [], opts: any = {}) {
    return resolveChildrenFromConfigValue(configValue, upstreamNodes, mockInstructions, {
      fieldNames: defaultFieldNames,
      ...opts,
    });
  }

  beforeEach(() => {
    mockInstructions.clear();
  });

  it('variable reference "{{$jobsMapByNodeKey.xxx}}": returns children from upstream node', () => {
    const upstreamOption = { value: 'q1', label: 'Query', children: [{ value: 'a', label: 'a' }] };
    mockInstructions.set('query', {
      useVariables: () => upstreamOption,
    });

    const result = resolve('{{$jobsMapByNodeKey.q1}}', [{ key: 'q1', type: 'query' }]);
    expect(result).toEqual([{ value: 'a', label: 'a' }]);
  });

  it('variable reference: returns null if upstream node not found', () => {
    const result = resolve('{{$jobsMapByNodeKey.unknownKey}}', [{ key: 'q1', type: 'query' }]);
    expect(result).toBeNull();
  });

  it('variable reference: falls back to JSON constant when upstream node has no children', () => {
    mockInstructions.set('query', {
      useVariables: () => ({ value: 'q1', label: 'Query' }),
    });

    const result = resolve('[{"a":1}]', [{ key: 'q1', type: 'query' }]);
    expect(result).toEqual([{ key: 'a', value: 'a', label: 'a', isLeaf: true }]);
  });

  it('JSON string: infers children from parsed value', () => {
    const result = resolve('[{"a":1,"b":2}]');
    expect(result.map((r) => r.value).sort()).toEqual(['a', 'b']);
  });

  it('JSON string: empty array returns null', () => {
    expect(resolve('[]')).toBeNull();
  });

  it('JSON string: primitive array returns null', () => {
    expect(resolve('[1,2,3]')).toBeNull();
  });

  it('plain string (not JSON, not template): returns null', () => {
    expect(resolve('hello')).toBeNull();
    expect(resolve('')).toBeNull();
  });

  it('non-string value: returns null', () => {
    expect(resolve(null as any)).toBeNull();
    expect(resolve(42 as any)).toBeNull();
    expect(resolve(undefined as any)).toBeNull();
  });

  it('malformed template: treated as plain string / JSON fallback', () => {
    // No {{ }} wrapper
    expect(resolve('$jobsMapByNodeKey.q1')).toBeNull(); // not valid JSON either
    // Invalid JSON
    expect(resolve('{a:1}')).toBeNull();
  });

  it('nested variable reference: chain resolution', () => {
    // upstream variable2 points to upstream variable1
    const variable1Option = { value: 'v1', label: 'Var1', children: [{ value: 'x', label: 'x' }] };
    const variable2Option = { value: 'v2', label: 'Var2' }; // no children, falls back to JSON
    mockInstructions.set('variable', {
      useVariables: (node: any) => {
        if (node.key === 'v1') return variable1Option;
        if (node.key === 'v2') return variable2Option;
        return null;
      },
    });
    mockInstructions.set('query', {
      useVariables: () => ({ value: 'q1', label: 'Query', children: [{ value: 'y', label: 'y' }] }),
    });

    // v1 has children directly
    const result1 = resolve('{{$jobsMapByNodeKey.v1}}', [
      { key: 'v1', type: 'variable' },
      { key: 'v2', type: 'variable' },
    ]);
    expect(result1).toEqual([{ value: 'x', label: 'x' }]);

    // v2 has no children, JSON fallback
    const result2 = resolve('[{"foo":1}]', [{ key: 'v2', type: 'variable' }]);
    expect(result2).toEqual([{ key: 'foo', value: 'foo', label: 'foo', isLeaf: true }]);
  });
});
