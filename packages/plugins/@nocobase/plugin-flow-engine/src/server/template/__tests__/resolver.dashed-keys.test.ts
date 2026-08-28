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

  it('copies path policy sets once per top-level resolve', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('user', { value: { id: 1, name: 'Alice' } });
    const analysis = analyzeVariableTemplate({ id: '{{ ctx.user.id }}', name: '{{ ctx.user.name }}' });
    const allowedValues = [getVariableCanonicalKey('user', ['id']), getVariableCanonicalKey('user', ['name'])];
    let allowedIterations = 0;
    let unrestrictedIterations = 0;
    const allowedPaths = {
      [Symbol.iterator]() {
        allowedIterations += 1;
        return allowedValues[Symbol.iterator]();
      },
    } as ReadonlySet<string>;
    const unrestrictedVariables = {
      [Symbol.iterator]() {
        unrestrictedIterations += 1;
        return [][Symbol.iterator]();
      },
    } as ReadonlySet<string>;
    const policy = { allowAll: false, allowedPaths, unrestrictedVariables };

    await resolveAnalyzedJsonTemplate(analysis, ctx, policy);

    expect(allowedIterations).toBe(1);
    expect(unrestrictedIterations).toBe(1);

    await resolveAnalyzedJsonTemplate(analysis, ctx, policy);

    expect(allowedIterations).toBe(2);
    expect(unrestrictedIterations).toBe(2);
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

  it('keeps the runtime helper out of the compartment global', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('user', { value: { id: 1 } });
    const attempts = [
      '{{ globalThis.__resolveVariablePath("user", ["id"]) }}',
      '{{ globalThis["__resolveVariablePath"]("user", ["id"]) }}',
      '{{ globalThis["__resolveVariablePath" + 0]("user", ["id"]) }}',
      '{{ __resolveVariablePath0("user", ["id"]) }}',
      '{{ Function("return __resolveVariablePath0")()("user", ["id"]) }}',
      '{{ globalThis.eval("__resolveVariablePath0")("user", ["id"]) }}',
      '{{ (0, eval)("__resolveVariablePath0")("user", ["id"]) }}',
      '{{ (() => { const alias = eval; return alias("__resolveVariablePath0")("user", ["id"]); })() }}',
    ];

    for (const attempt of attempts) expect(await resolveJsonTemplate(attempt, ctx)).toBe(attempt);
    expect(
      await resolveJsonTemplate(
        '{{ Object.getOwnPropertyNames(globalThis).some((key) => key.startsWith("__resolveVariablePath")) }}',
        ctx,
      ),
    ).toBe(false);
  });

  it('rejects direct eval before evaluation', async () => {
    const ctx = new ServerBaseContext();
    const attempts = [
      '{{ eval("__resolveVariablePath0")("user", ["id"]) }}',
      '{{ (eval)("__resolveVariablePath0")("user", ["id"]) }}',
    ];

    for (const attempt of attempts) {
      const analysis = analyzeVariableTemplate(attempt);
      expect(analysis.errors).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'unreliable-scope' })]));
      expect(await resolveJsonTemplate(attempt, ctx)).toBe(attempt);
    }
  });

  it('keeps explicit indexes and aggregates equivalent dot and static bracket paths', async () => {
    const ctx = new ServerBaseContext();
    ctx.defineProperty('items', { value: [{ values: [1, 2] }, { values: [3] }] });
    ctx.defineProperty('records', { value: [{ 'a.b': 1 }, { 'a.b': 2 }] });

    const out = await resolveJsonTemplate(
      {
        first: '{{ ctx.items[0].values[1] }}',
        aggregate: '{{ ctx.items.values }}',
        bracketAggregate: '{{ ctx["items"]["values"] }}',
        literalDottedKey: '{{ ctx.records["a.b"] }}',
        length: '{{ ctx.items.length }}',
      },
      ctx,
    );

    expect(out).toEqual({
      first: 2,
      aggregate: [1, 2, 3],
      bracketAggregate: [1, 2, 3],
      literalDottedKey: [1, 2],
      length: 2,
    });
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
