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

  it('attachUsedVariables(dynamic: view.record): auto-generate appends and fields from usage', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.view.record.roles[0].name }}',
      username: '{{ ctx.view.record.name }}',
    } as any;
    const contextParams = { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    // Trigger getter via nested path
    const _ = await ((ctx as any).view as any).record;

    expect(spyCalls.length).toBe(1);
    const call = spyCalls[0];
    // appends should include roles inferred from usage
    expect(call.appends).toEqual(expect.arrayContaining(['roles']));
    // fields should include id and name (top-level scalar only)
    expect(call.fields).toEqual(expect.arrayContaining(['id', 'name']));
    expect(call.filterByTk).toBe(1);
  });

  it('attachUsedVariables(dynamic: view.record): bracket top-level field is inferred into fields', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      username: '{{ ctx.view.record["name"] }}',
    } as any;
    const contextParams = { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await ((ctx as any).view as any).record;

    const call = spyCalls[0];
    expect(call.fields).toEqual(expect.arrayContaining(['name']));
  });

  it('attachUsedVariables(dynamic: view.record): property getter is cached (single query on multiple access)', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = { v: '{{ ctx.view.record.name }}' } as any;
    const contextParams = { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);

    const r1 = await ((ctx as any).view as any).record;
    const r2 = await ((ctx as any).view as any).record;
    expect(r1).toBeTruthy();
    expect(r2).toBeTruthy();
    expect(spyCalls.length).toBe(1);
  });

  it('attachUsedVariables: multiple dynamic variables attach independently (view.record + panel.entry)', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push({ ...opts }));
    const ctx = new HttpRequestContext(koa);
    const template = {
      a: '{{ ctx.view.record.name }}',
      b: '{{ ctx.panel.entry.roles[0].name }}',
    } as any;
    const contextParams = {
      'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 },
      'panel.entry': { dataSourceKey: 'main', collection: 'users', filterByTk: 2 },
    } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _1 = await ((ctx as any).view as any).record;
    const _2 = await ((ctx as any).panel as any).entry;

    // two separate calls
    expect(spyCalls.length).toBe(2);
    // one call for tk=1, one for tk=2
    const tks = spyCalls.map((c) => c.filterByTk).sort();
    expect(tks).toEqual([1, 2]);
  });

  it('dedup: multiple references to same dynamic variable triggers single query', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push({ ...opts }));
    const ctx = new HttpRequestContext(koa);
    const template = {
      a: '{{ ctx.view.record.id }}',
      b: '{{ ctx.view.record.name }}',
      c: '{{ ctx.view.record.roles[0].name }}',
    } as any;
    const contextParams = { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 10 } } as any;
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

  it('attachUsedVariables(dynamic: view.record): respects explicit params and does not auto-generate when provided', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      role: '{{ ctx.view.record.roles[0].name }}',
      username: '{{ ctx.view.record.name }}',
    } as any;
    const contextParams = {
      'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1, fields: ['id'], appends: ['author'] },
    } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await ((ctx as any).view as any).record;

    const call = spyCalls[0];
    expect(call.appends).toEqual(['author']);
    expect(call.fields).toEqual(['id']);
  });

  it('attachUsedVariables(dynamic: view.record): allows fields inference with numeric index after segment', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      onlyName: '{{ ctx.view.record[0].name }}',
    } as any;
    const contextParams = { 'view.record': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    const _ = await ((ctx as any).view as any).record;

    const call = spyCalls[0];
    expect(call.appends).toBeUndefined();
    expect(call.fields).toEqual(expect.arrayContaining(['name']));
  });

  it('attachUsedVariables(dynamic arrays): list[0].name infers fields; list[0].roles[0].name infers appends', async () => {
    const spyCalls: any[] = [];
    const koa = makeKoaCtx((opts) => spyCalls.push(opts));
    const ctx = new HttpRequestContext(koa);
    const template = {
      username: '{{ ctx.list[0].name }}',
      role: '{{ ctx.list[0].roles[0].name }}',
    } as any;
    const contextParams = { 'list.0': { dataSourceKey: 'main', collection: 'users', filterByTk: 1 } } as any;
    await variables.attachUsedVariables(ctx, koa, template, contextParams);
    // Trigger queries via resolver to walk through lodash.get path resolution
    await resolveJsonTemplate(template, ctx as any);

    expect(spyCalls.length).toBe(1);
    const call = spyCalls[0];
    expect(call.fields).toEqual(expect.arrayContaining(['name']));
    expect(call.appends).toEqual(expect.arrayContaining(['roles']));
    expect(call.filterByTk).toBe(1);
  });

  // Legacy sibling variables tests removed (parentRecord/popupRecord/parentPopupRecord) since generic dynamic keys are supported.
});
