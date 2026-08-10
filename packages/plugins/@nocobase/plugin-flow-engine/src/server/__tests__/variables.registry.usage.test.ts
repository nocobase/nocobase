/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { variables } from '../variables/registry';
import { resetVariablesRegistryForTest } from './test-utils';
import { resolveJsonTemplate } from '../template/resolver';
import { HttpRequestContext } from '../template/contexts';
import { analyzeVariableTemplate } from '../template/variable-expression';
import { createNestedRecordSlotResolver, getRecordSlotResolverRegistry } from '../variables/record-slot-resolvers';

function makeKoaCtx(spy: (opts: any) => void, collectionName = 'users') {
  // 为新实现提供必要的模型元数据（rawAttributes/associations/primaryKey）
  const modelMeta = {
    primaryKeyAttribute: 'id',
    rawAttributes: {
      id: {},
      name: {},
      // 非关联字段举例；关联在 associations 中声明
    } as Record<string, unknown>,
    associations: {
      roles: {},
      company: {},
    } as Record<string, unknown>,
  };

  const repo = {
    // 提供 collection.model，供 fetchRecordWithRequestCache 补充主键/判断最小载荷
    collection: { model: modelMeta },
    async findOne(opts: any) {
      spy(opts);
      return {
        toJSON() {
          return { id: 1, name: 'Alice', roles: [{ name: 'admin' }], company: { title: 'Acme' } };
        },
      } as any;
    },
  } as any;

  const koa: any = {
    app: {
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            getRepository: (name: string) => repo,
            db: {
              getRepository: (name: string) => repo,
              // adjustSelectsForCollection 会从这里取模型元数据
              getCollection: (name: string) => ({ model: modelMeta }),
            },
          },
        }),
      },
    },
  };
  return koa;
}

describe('variables registry - extractUsage and attachUsedVariables', () => {
  beforeAll(() => {
    resetVariablesRegistryForTest();
  });
  it('extractUsage: dot and bracket notations, multiple occurrences, nested objects (dynamic view.record)', () => {
    const tpl = {
      a: '{{ ctx.view.record.roles[0].name }}',
      b: "{{ ctx['view']['record'].company.title }}",
      c: ['x', '{{ ctx.view.record.name }}'],
      d: { y: '{{ ctx.user.id }}' },
      e: 'mixed: {{ ctx.view.record["roles"][0]["name"] }} and {{ ctx["view"].record.id }}',
      f: '{{ ctx.view.record[0].name }}', // numeric bracket after var should not contribute path
    };
    const usage = variables.extractUsage(tpl as any);
    expect(usage.view).toBeTruthy();
    // Should include roles path
    expect(usage.view.some((p) => p.startsWith('record'))).toBeTruthy();
    // Should include name scalar
    expect(usage.view.some((p) => p.includes('name'))).toBeTruthy();
    // Should include company from bracket var
    expect(usage.view.some((p) => p.includes('company'))).toBeTruthy();
    // Numeric leading bracket after var should not add new path
    // numeric bracket after nested segment is preserved under the segment (record[0]) but not as top-level path
    expect(usage.view.some((p) => p.startsWith('[0]'))).toBeFalsy();
    // user var not registered, but extracted
    expect(usage.user).toBeTruthy();
  });

  it('extractUsage: top-level array index under varName (list[0].name, list[1].roles[0].name)', () => {
    const tpl = {
      a: '{{ ctx.list[0].name }}',
      b: '{{ ctx.list[1].roles[0].name }}',
    } as any;
    const usage = variables.extractUsage(tpl as any);
    expect(usage.list).toBeTruthy();
    expect(usage.list.some((p) => p.startsWith('[0]'))).toBeTruthy();
    expect(usage.list.some((p) => p.startsWith('[1]'))).toBeTruthy();
    expect(usage.list.some((p) => p.includes('roles'))).toBeTruthy();
  });

  it('passes structured runtime paths directly to variable attach', async () => {
    const received: Array<readonly (string | number)[]> = [];
    variables.register({
      name: 'probe',
      scope: 'request',
      attach: (_ctx, _koaCtx, _params, usage) => {
        received.push(...(usage?.probe || []).map((ref) => ref.runtimeSegments));
      },
    });
    const analysis = analyzeVariableTemplate({
      first: '{{ ctx.probe[0].name }}',
      second: '{{ ctx.probe[1].name }}',
      repeat: '{{ ctx.probe[0].name }}',
      dotted: '{{ ctx.probe["a.b"] }}',
    });

    const koa = { app: {} } as never;
    await variables.attachUsedVariablesFromUsage(new HttpRequestContext(koa), koa, analysis.usage, {});

    expect(received).toEqual([[0, 'name'], [1, 'name'], ['a.b']]);
  });

  it('does not match a literal dotted segment to a flattened context key', async () => {
    const calls: unknown[] = [];
    const koa = makeKoaCtx((options) => calls.push(options));
    const ctx = new HttpRequestContext(koa);
    const analysis = analyzeVariableTemplate({ value: '{{ ctx.view["record.name"].id }}' });

    await variables.attachUsedVariablesFromUsage(ctx, koa, analysis.usage, {
      'view.record.name': { collection: 'users', filterByTk: 1 },
    });

    expect(calls).toHaveLength(0);
  });

  it('strips legacy Record descriptors when no exact resolver is registered', async () => {
    const calls: unknown[] = [];
    const koa = makeKoaCtx((options) => calls.push(options));
    const ctx = new HttpRequestContext(koa);
    const template = { value: '{{ ctx.view.record.name }}' };

    await variables.attachUsedVariables(ctx, koa, template, {
      'view.record': { collection: 'users', filterByTk: 1 },
    });

    await expect(resolveJsonTemplate(template, ctx)).resolves.toEqual(template);
    expect(calls).toEqual([]);
  });

  it('attaches one exact nested Record provider with the submitted target', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const koa = makeKoaCtx((options) => calls.push(options));
    const dispose = getRecordSlotResolverRegistry(koa.app).register(
      createNestedRecordSlotResolver({
        owner: 'test',
        id: 'backend',
        varName: 'backend',
      }),
    );
    const ctx = new HttpRequestContext(koa);
    const template = {
      name: '{{ ctx.backend.record.name }}',
      role: '{{ ctx.backend.record.roles[0].name }}',
    };

    await variables.attachUsedVariables(ctx, koa, template, {
      'backend.record': { collection: 'secrets', dataSourceKey: 'external', filterByTk: 1 },
    });
    const result = await resolveJsonTemplate(template, ctx);

    expect(result).toEqual({ name: 'Alice', role: 'admin' });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ filterByTk: 1 });
    expect(calls[0].fields).toEqual(expect.arrayContaining(['name']));
    expect(calls[0].appends).toEqual(expect.arrayContaining(['roles']));
    dispose();
  });
});
