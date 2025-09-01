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
import { resolveJsonTemplate } from '../template/resolver';
import { HttpRequestContext } from '../template/contexts';

function makeKoaCtx(spy: (opts: any) => void, collectionName = 'users') {
  const repo = {
    async findOne(opts: any) {
      spy(opts);
      return {
        toJSON() {
          return { id: 1, name: 'Alice', roles: [{ name: 'admin' }], company: { title: 'Acme' } };
        },
      } as any;
    },
  };
  const koa: any = {
    app: {
      dataSourceManager: {
        get: () => ({
          collectionManager: {
            db: {
              getRepository: (name: string) => repo,
            },
          },
        }),
      },
    },
  };
  return koa;
}

describe('variables registry - extractUsage and attachUsedVariables', () => {
  it('extractUsage: dot and bracket notations, multiple occurrences, nested objects', () => {
    const tpl = {
      a: '{{ ctx.record.roles[0].name }}',
      b: "{{ ctx['record']['company'].title }}",
      c: ['x', '{{ ctx.record.name }}'],
      d: { y: '{{ ctx.user.id }}' },
      e: 'mixed: {{ ctx.record["roles"][0]["name"] }} and {{ ctx["record"].id }}',
      f: '{{ ctx.record[0].name }}', // numeric bracket after var should not contribute path
    };
    const usage = variables.extractUsage(tpl as any);
    expect(usage.record).toBeTruthy();
    // Should include roles path
    expect(usage.record.some((p) => p.startsWith('roles'))).toBeTruthy();
    // Should include name scalar
    expect(usage.record.includes('name')).toBeTruthy();
    // Should include company from bracket var
    expect(usage.record.some((p) => p.startsWith('company'))).toBeTruthy();
    // Numeric leading bracket after var should not add new path
    expect(usage.record.some((p) => p.startsWith('[0]'))).toBeFalsy();
    // user var not registered, but extracted
    expect(usage.user).toBeTruthy();
  });

  it('attachUsedVariables(record): auto-generate appends and fields from usage', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.record.roles[0].name }}',
      username: '{{ ctx.record.name }}',
    } as any;
    const contextParams = { record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    // Trigger getter
    const _ = await (ctx as any).record;

    expect(spyCalls.length).toBe(1);
    const call = spyCalls[0];
    // appends should include roles inferred from usage
    expect(call.appends).toEqual(expect.arrayContaining(['roles']));
    // fields should include id and name (top-level scalar only)
    expect(call.fields).toEqual(expect.arrayContaining(['id', 'name']));
    expect(call.filterByTk).toBe(1);
  });

  it('attachUsedVariables(record): bracket top-level field is inferred into fields', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      username: '{{ ctx.record["name"] }}',
    } as any;
    const contextParams = { record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).record;

    const call = spyCalls[0];
    expect(call.fields).toEqual(expect.arrayContaining(['name']));
  });

  it('attachUsedVariables(record): property getter is cached (single query on multiple access)', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = { v: '{{ ctx.record.name }}' } as any;
    const contextParams = { record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);

    const r1 = await (ctx as any).record;
    const r2 = await (ctx as any).record;
    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
    expect(spyCalls.length).toBe(1);
  });

  it('attachUsedVariables: multiple variables attach independently (record + parentRecord)', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push({ ...opts }));
    const ctx = new HttpRequestContext(koa);
    const template = {
      a: '{{ ctx.record.name }}',
      b: '{{ ctx.parentRecord.roles[0].name }}',
    } as any;
    const contextParams = {
      record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 },
      parentRecord: { dataSourceKey: 'main', collection: 'users', filterByTk: 2 },
    };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _1 = await (ctx as any).record;
    const _2 = await (ctx as any).parentRecord;

    // two separate calls
    expect(spyCalls.length).toBe(2);
    // one call for tk=1, one for tk=2
    const tks = spyCalls.map((c) => c.filterByTk).sort();
    expect(tks).toEqual([1, 2]);
  });

  it('dedup: multiple references to same variable in one evaluation triggers single query', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push({ ...opts }));
    const ctx = new HttpRequestContext(koa);
    const template = {
      a: '{{ ctx.record.id }}',
      b: '{{ ctx.record.name }}',
      c: '{{ ctx.record.roles[0].name }}',
    } as any;
    const contextParams = { record: { dataSourceKey: 'main', collection: 'users', filterByTk: 10 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);

    const out = await resolveJsonTemplate(template, ctx as any);
    expect(out.a).toBe(1);
    expect(typeof out.b).toBe('string');
    expect(typeof out.c).toBe('string');

    // Only one findOne call for record
    expect(spyCalls.length).toBe(1);
    expect(spyCalls[0].filterByTk).toBe(10);
    // Ensure union of inferred selects
    expect(spyCalls[0].fields).toEqual(expect.arrayContaining(['id', 'name']));
    expect(spyCalls[0].appends).toEqual(expect.arrayContaining(['roles']));
  });

  it('attachUsedVariables(record): respects explicit params and does not auto-generate when provided', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.record.roles[0].name }}',
      username: '{{ ctx.record.name }}',
    } as any;
    const contextParams = {
      record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1, fields: ['id'], appends: ['author'] },
    };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).record;

    const call = spyCalls[0];
    expect(call.appends).toEqual(['author']);
    expect(call.fields).toEqual(['id']);
  });

  it('attachUsedVariables(record): no auto fields/appends when usage path not inferable (numeric leading bracket)', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      bad: '{{ ctx.record[0].name }}',
    } as any;
    const contextParams = { record: { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).record;

    const call = spyCalls[0];
    expect(call.appends).toBeUndefined();
    expect(call.fields).toBeUndefined();
  });

  it('attachUsedVariables(parentRecord): inference works for sibling variables', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.parentRecord.roles[0].name }}',
      username: '{{ ctx.parentRecord.name }}',
    } as any;
    const contextParams = { parentRecord: { dataSourceKey: 'main', collection: 'users', filterByTk: 2 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).parentRecord;

    const call = spyCalls[0];
    expect(call.filterByTk).toBe(2);
    expect(call.appends).toEqual(expect.arrayContaining(['roles']));
    expect(call.fields).toEqual(expect.arrayContaining(['id', 'name']));
  });

  it('attachUsedVariables(popupRecord): inference works for sibling variables', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.popupRecord.roles[0].name }}',
      username: '{{ ctx.popupRecord.name }}',
    } as any;
    const contextParams = { popupRecord: { dataSourceKey: 'main', collection: 'users', filterByTk: 3 } };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).popupRecord;

    const call = spyCalls[0];
    expect(call.filterByTk).toBe(3);
    expect(call.appends).toEqual(expect.arrayContaining(['roles']));
    expect(call.fields).toEqual(expect.arrayContaining(['id', 'name']));
  });

  it('attachUsedVariables(parentPopupRecord): respects explicit params override', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.parentPopupRecord.roles[0].name }}',
      username: '{{ ctx.parentPopupRecord.name }}',
    } as any;
    const contextParams = {
      parentPopupRecord: {
        dataSourceKey: 'main',
        collection: 'users',
        filterByTk: 4,
        fields: ['id', 'email'],
        appends: ['author'],
      },
    };
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await (ctx as any).parentPopupRecord;

    const call = spyCalls[0];
    expect(call.filterByTk).toBe(4);
    expect(call.appends).toEqual(['author']);
    expect(call.fields).toEqual(['id', 'email']);
  });
});
