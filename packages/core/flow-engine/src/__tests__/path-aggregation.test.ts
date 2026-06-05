/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine } from '../flowEngine';

describe('resolveJsonTemplate: dot-only path aggregation', () => {
  it('aggregates across arrays with dot-only path', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: {
        b: [
          { c: 1, d: [1, 2] },
          { c: 2, d: [3] },
        ],
      },
    });

    const out = await (engine.context as any).resolveJsonTemplate('{{ ctx.a.b.d }}');
    expect(out).toEqual([1, 2, 3]);
  });

  it('replaces inside template strings and stringifies arrays', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: { b: [{ d: [1, 2] }, { d: [3] }] },
    });

    const out = await (engine.context as any).resolveJsonTemplate('x={{ ctx.a.b.d }};');
    expect(out).toBe('x=[1,2,3];');
  });

  it('returns scalar for non-array dot-only path', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: { title: 'hello' },
    });
    const out = await (engine.context as any).resolveJsonTemplate('{{ ctx.a.title }}');
    expect(out).toBe('hello');
  });

  it('returns undefined if path not found', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: { b: [{ d: [1, 2] }, { d: [3] }] },
    });
    const out = await (engine.context as any).resolveJsonTemplate({ x: '{{ ctx.a.missing.path }}' });
    expect(out).toEqual({ x: undefined });
  });

  it('deep nested arrays keep nested structure (no final deep flatten)', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: {
        b: [{ e: [{ d: [1] }, { d: [2] }] }, { e: [{ d: [3, [4]] }, { d: null }] }, { e: [] }],
      },
    });
    const out = await (engine.context as any).resolveJsonTemplate('{{ ctx.a.b.e.d }}');
    expect(out).toEqual([1, 2, 3, [4]]);
  });

  it('missing branch values are ignored during aggregation', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', {
      value: {
        b: [{ d: [1] }, { x: 0 }, { d: [3] }, {}],
      },
    });
    const out = await (engine.context as any).resolveJsonTemplate('{{ ctx.a.b.d }}');
    expect(out).toEqual([1, 3]);
  });

  it('non dot-only expressions remain unaffected alongside aggregation', async () => {
    const engine = new FlowEngine();
    engine.context.defineProperty('a', { value: { b: [{ d: [1] }, { d: [2] }] } });
    const out = await (engine.context as any).resolveJsonTemplate('sum={{ 1 + 2 }}, arr={{ ctx.a.b.d }}');
    expect(out).toBe('sum=3, arr=[1,2]');
  });
});
