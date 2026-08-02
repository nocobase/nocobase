/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';
import { ServerBaseContext } from '../contexts';
import { resolveAnalyzedJsonTemplate, resolveJsonTemplate } from '../resolver';
import { analyzeVariableTemplate, getVariableCanonicalKey } from '../variable-expression';

describe('server template resolver: dashed keys in dot-only path', () => {
  it('resolves dashed keys in dot-only expressions', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('formValues', {
      value: {
        roles: {
          'a-b': 123,
        },
      },
    });

    const out = await resolveJsonTemplate('{{ ctx.formValues.roles.a-b }}', ctx as any);
    expect(out).toBe(123);
  });

  it('resolves dashed keys inside template strings', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('formValues', {
      value: {
        roles: {
          'a-b': 'X',
        },
      },
    });

    const out = await resolveJsonTemplate('prefix {{ ctx.formValues.roles.a-b }} suffix', ctx as any);
    expect(out).toBe('prefix X suffix');
  });

  it('keeps subtraction deterministic without dashed-path fallback', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('aa', { value: { bb: 10 } });
    ctx.defineProperty('cc', { value: 5 });

    const out = await resolveJsonTemplate('{{ ctx.aa.bb-ctx.cc }}', ctx as any);
    expect(out).toBe(5);
  });

  it('enforces exact canonical paths at runtime', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('user', { value: { id: 1, name: 'Alice' } });
    const analysis = analyzeVariableTemplate({ id: '{{ ctx.user.id }}', name: '{{ ctx.user.name }}' });

    const out = await resolveAnalyzedJsonTemplate(analysis, ctx, {
      allowAll: false,
      allowedPaths: new Set([getVariableCanonicalKey('user', ['id'])]),
      unrestrictedVariables: new Set(),
    });

    expect(out).toEqual({ id: 1, name: '{{ ctx.user.name }}' });
  });

  it('allows every path for explicitly unrestricted variables', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('user', { value: { id: 1, name: 'Alice' } });
    const analysis = analyzeVariableTemplate('{{ ctx.user.name }}');

    const out = await resolveAnalyzedJsonTemplate(analysis, ctx, {
      allowAll: false,
      allowedPaths: new Set(),
      unrestrictedVariables: new Set(['user']),
    });

    expect(out).toBe('Alice');
  });

  it('does not execute ctx functions, raw ctx aliases, or direct helpers', async () => {
    const call = vi.fn(() => 'called');
    const ctx = new ServerBaseContext();
    ctx.defineProperty('call', { value: call });
    ctx.defineProperty('user', { value: { id: 1 } });
    const template = [
      '{{ ctx.call() }}',
      '{{ ctx.call?.() }}',
      '{{ (() => { const alias = ctx; return alias.user.id; })() }}',
      '{{ __resolveVariablePath("user", ["id"]) }}',
      String.raw`{{ __resol\u0076eVariablePath("user", ["id"]) }}`,
    ];

    const out = await resolveJsonTemplate(template, ctx);

    expect(call).not.toHaveBeenCalled();
    expect(out).toEqual(template);
  });

  it('keeps explicit indexes and implicit dot-path aggregation', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('items', { value: [{ values: [1, 2] }, { values: [3] }] });

    const out = await resolveJsonTemplate(
      {
        first: '{{ ctx.items[0].values[1] }}',
        aggregate: '{{ ctx.items.values }}',
        length: '{{ ctx.items.length }}',
      },
      ctx,
    );

    expect(out).toEqual({ first: 2, aggregate: [1, 2, 3], length: 2 });
  });

  it('isolates compartment globals and failures between placeholders', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('user', { value: { id: 1 } });
    const template = [
      '{{ (globalThis.leaked = 1, ctx.user.id) }}',
      '{{ globalThis.leaked }}',
      '{{ (() => { throw new Error("stop"); })() }}',
      '{{ ctx.user.id }}',
    ];

    const out = await resolveJsonTemplate(template, ctx);

    expect(out).toEqual([1, template[1], template[2], 1]);
  });
});
