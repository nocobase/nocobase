/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { analyzeVariableTemplate, getVariableCanonicalKey } from '../variable-expression';

describe('server variable expression analyzer', () => {
  it('uses Acorn ranges to find complex and mixed placeholder boundaries', () => {
    const analysis = analyzeVariableTemplate({
      object: '{{ ({ value: "}}", user: ctx.user.name }).user }}',
      mixed: 'a={{ `x}}${ctx.record.id}` }} b={{ /}}/.test(ctx.user.code) ? ctx.user.id : 0 }}',
    });

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([
      ['user', ['name']],
      ['record', ['id']],
      ['user', ['code']],
      ['user', ['id']],
    ]);
    expect(
      (analysis.value.kind === 'object' && analysis.value.entries.mixed.kind === 'string'
        ? analysis.value.entries.mixed.expressions
        : []
      ).length,
    ).toBe(2);
  });

  it('recurses through objects and arrays and keeps each source occurrence', () => {
    const analysis = analyzeVariableTemplate({
      a: '{{ctx.user.id}}',
      nested: ['{{ctx.user.id}}', '{{ctx.user.name}}'],
    });

    expect(analysis.paths).toHaveLength(3);
    expect(analysis.paths.map((path) => path.templatePath)).toEqual([['a'], ['nested', 0], ['nested', 1]]);
    expect(analysis.usage.user).toHaveLength(2);
    expect(analysis.usage.user[0]).toBe(analysis.paths[0]);
    expect(analysis.usage.user[1]).toBe(analysis.paths[2]);
  });

  it('normalizes dot, bracket, optional, comments, and escaped ctx identifiers', () => {
    const analysis = analyzeVariableTemplate([
      '{{ ctx.user.roles[0].name }}',
      '{{ ctx["user"]["roles"][0]["name"] }}',
      '{{ ctx?.user?.roles?.[0]?.name }}',
      '{{ ctx /* root */ . user /* path */ . roles[0].name }}',
      '{{ \\u0063tx.user.roles[0].name }}',
    ]);

    expect(analysis.supported).toBe(true);
    expect(new Set(analysis.paths.map((path) => path.runtimeKey))).toEqual(new Set(['["user","roles",0,"name"]']));
    expect(new Set(analysis.paths.map((path) => path.canonicalKey)).size).toBe(1);
  });

  it('keeps typed numeric canonical segments distinct from string keys', () => {
    const analysis = analyzeVariableTemplate([
      '{{ctx.roles[0].name}}',
      '{{ctx.roles[1].name}}',
      '{{ctx.roles[0].name}}',
      '{{ctx.data[0]}}',
      '{{ctx.data["*"]}}',
      '{{ctx.data["a.b"]}}',
      '{{ctx.data.a.b}}',
    ]);

    expect(analysis.paths[0].canonicalKey).toBe(analysis.paths[1].canonicalKey);
    expect(analysis.paths[0].runtimeKey).not.toBe(analysis.paths[1].runtimeKey);
    expect(analysis.usage.roles).toHaveLength(2);
    expect(analysis.usage.roles.map((path) => path.runtimeSegments)).toEqual([
      [0, 'name'],
      [1, 'name'],
    ]);
    expect(analysis.paths[3].canonicalKey).not.toBe(analysis.paths[4].canonicalKey);
    expect(analysis.paths[5].canonicalKey).not.toBe(analysis.paths[6].canonicalKey);
    expect(getVariableCanonicalKey('data', [0])).toBe('["data",{"kind":"index"}]');
  });

  it('only records the largest static ctx member chain and compiles by source range', () => {
    const analysis = analyzeVariableTemplate('{{ ({ a: ctx.user.profile.name, b: ctx.record.id }).a }}');
    const expression = analysis.value.kind === 'string' ? analysis.value.expressions[0] : undefined;

    expect(analysis.paths.map((path) => path.runtimeSegments)).toEqual([['profile', 'name'], ['id']]);
    expect(expression?.compiled.match(/__resolveVariablePath/g)).toHaveLength(2);
    expect(expression?.compiled).not.toContain('ctx.user');
    expect(expression?.compiled).not.toContain('ctx.record');
  });

  it('includes parenthesized expressions in the placeholder boundary', () => {
    const analysis = analyzeVariableTemplate('{{ (((ctx.user.id))) }}');

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => path.runtimeSegments)).toEqual([['id']]);
  });

  it.each([
    ['{{ctx}}', 'bare-ctx'],
    ['{{ctx.record[field]}}', 'dynamic-ctx-path'],
    ['{{ctx[variableName]}}', 'dynamic-ctx-path'],
    ['{{ctx.record[getName()]}}', 'dynamic-ctx-path'],
    ['{{ctx.someMethod()}}', 'ctx-call'],
    ['{{ctx.someMethod?.()}}', 'ctx-call'],
    ['{{ctx.someMethod().name}}', 'ctx-call'],
    ['{{(0, ctx.someMethod)()}}', 'ctx-call'],
    ['{{(true ? ctx.someMethod : fallback)()}}', 'ctx-call'],
    ['{{(ctx.someMethod || fallback)()}}', 'ctx-call'],
    ['{{new ctx.SomeType()}}', 'ctx-call'],
    ['{{ctx.tag`value`}}', 'ctx-call'],
    ['{{ctx.record.name = "x"}}', 'ctx-write'],
    ['{{ctx.record.count++}}', 'ctx-write'],
    ['{{delete ctx.record.name}}', 'ctx-write'],
    ['{{__get("user", "id")}}', 'reserved-helper'],
    ['{{__resolveVariablePath("user", ["id"])}}', 'reserved-helper'],
  ])('rejects unsupported request expression %s', (template, code) => {
    const analysis = analyzeVariableTemplate(template);

    expect(analysis.supported).toBe(false);
    expect(analysis.errors.map((error) => error.code)).toContain(code);
    expect(analysis.errors[0].span.start).toBeGreaterThanOrEqual(2);
    expect(analysis.paths).toEqual([]);
  });

  it('allows calls whose callee is not ctx-derived', () => {
    const analysis = analyzeVariableTemplate('{{ Math.max(ctx.record.score, 0) }}');

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => path.runtimeSegments)).toEqual([['score']]);
  });

  it('does not treat lexically bound ctx identifiers as server context', () => {
    const analysis = analyzeVariableTemplate([
      '{{ ((ctx) => ctx.secret)({ secret: 1 }) }}',
      '{{ (() => { const ctx = { secret: 2 }; return ctx.secret; })() }}',
      '{{ (() => { const { ctx } = { ctx: { secret: 3 } }; return ctx.secret; })() }}',
      '{{ (() => { try { throw {}; } catch (ctx) { return ctx.secret; } })() }}',
      '{{ (function ctx() { return ctx.name; })() }}',
      '{{ (class ctx { static value = ctx.name }).value }}',
    ]);

    expect(analysis.supported).toBe(true);
    expect(analysis.paths).toEqual([]);
  });

  it('keeps free ctx outside a shadowed scope', () => {
    const analysis = analyzeVariableTemplate('{{ [ctx.user.id, ((ctx) => ctx.user.id)({})] }}');

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([['user', ['id']]]);
  });

  it('does not confuse property names or loop bindings with free identifiers', () => {
    const analysis = analyzeVariableTemplate([
      '{{ ({ ctx: 1, __get: 2 }).ctx }}',
      '{{ (() => { for (const ctx of []) return ctx.value; })() }}',
      '{{ (() => { switch (0) { case 0: { const ctx = {}; return ctx.value; } } })() }}',
      '{{ ctx.data.ctx + ctx.data.__get }}',
    ]);

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => path.runtimeSegments)).toEqual([['ctx'], ['__get']]);
  });

  it('rejects ctx paths nested in assignment patterns', () => {
    const analysis = analyzeVariableTemplate([
      '{{ ({ value: ctx.record.name } = source) }}',
      '{{ (() => { for (ctx.record.item of source) {} })() }}',
    ]);

    expect(analysis.supported).toBe(false);
    expect(analysis.errors.map((error) => error.code)).toContain('ctx-write');
  });

  it('fails closed when lexical scope cannot be determined statically', () => {
    const request = analyzeVariableTemplate('{{ (() => { with (source) return ctx.user.id; })() }}');
    const model = analyzeVariableTemplate(
      ['{{ (() => { with (source) return ctx.user.id; })() }}', '{{ctx.record.id}}'],
      { mode: 'flow-model' },
    );

    expect(request.supported).toBe(false);
    expect(request.errors.map((error) => error.code)).toContain('unreliable-scope');
    expect(request.paths).toEqual([]);
    expect(model.supported).toBe(true);
    expect(model.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([['record', ['id']]]);
  });

  it('applies the deterministic dashed-key compatibility rule', () => {
    const dashed = analyzeVariableTemplate('{{ctx.formValues.roles.a-b}}');
    const escaped = analyzeVariableTemplate('{{ctx.formValues.roles.\\u0061-b}}');
    const subtraction = analyzeVariableTemplate('{{ctx.aa.bb-ctx.cc}}');

    expect(dashed.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([
      ['formValues', ['roles', 'a-b']],
    ]);
    expect(escaped.paths[0].runtimeSegments).toEqual(['roles', 'a-b']);
    expect(subtraction.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([
      ['aa', ['bb']],
      ['cc', []],
    ]);
  });

  it('reports invalid expressions without retaining an Acorn AST', () => {
    const analysis = analyzeVariableTemplate('{{ctx.user.}}');

    expect(analysis.supported).toBe(false);
    expect(analysis.errors[0].code).toBe('invalid-expression');
    expect(JSON.stringify(analysis)).not.toContain('MemberExpression');
  });

  it('collects supported model paths while skipping unsupported client expressions', () => {
    const analysis = analyzeVariableTemplate(
      { good: '{{ctx.user.id}}', clientOnly: '{{ctx.record[field]}}', broken: '{{ctx.user.}}' },
      { mode: 'flow-model' },
    );

    expect(analysis.supported).toBe(true);
    expect(analysis.paths.map((path) => [path.varName, path.runtimeSegments])).toEqual([['user', ['id']]]);
  });
});
