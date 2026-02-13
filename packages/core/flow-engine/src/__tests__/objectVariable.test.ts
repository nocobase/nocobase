/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import {
  createAssociationAwareObjectMetaFactory,
  createAssociationSubpathResolver,
} from '../utils/associationObjectVariable';

function setupEngineWithCollections() {
  const engine = new FlowEngine();
  const ds = engine.context.dataSourceManager.getDataSource('main');

  // 真实集合定义，确保 targetCollection / filterTargetKey 等行为一致
  ds.addCollection({
    name: 'users',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
    ],
  });
  ds.addCollection({
    name: 'tags',
    filterTargetKey: 'id',
    fields: [
      { name: 'id', type: 'integer', interface: 'number' },
      { name: 'name', type: 'string', interface: 'text' },
    ],
  });
  ds.addCollection({
    name: 'posts',
    filterTargetKey: 'id',
    fields: [
      { name: 'title', type: 'string', interface: 'text' },
      { name: 'author', type: 'belongsTo', target: 'users', interface: 'm2o' },
      { name: 'tags', type: 'belongsToMany', target: 'tags', interface: 'm2m' },
    ],
  });

  return { engine, ds, collection: ds.getCollection('posts') } as const;
}

describe('objectVariable utilities', () => {
  it('createAssociationSubpathResolver should detect association subpaths', () => {
    const { collection } = setupEngineWithCollections();
    const resolver = createAssociationSubpathResolver(() => collection);
    expect(resolver('author.name')).toBe(true);
    expect(resolver('tags[0].name')).toBe(true);
    expect(resolver('title')).toBe(false);
    expect(resolver('title.length')).toBe(false);
    expect(resolver('unknown.name')).toBe(false);
  });

  it('createAssociationAwareObjectMetaFactory should build params for toOne/toMany', async () => {
    const { collection } = setupEngineWithCollections();

    const obj1 = { title: 'hello', author: 1 };
    const metaFactory1 = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj1,
    );
    const meta1 = await metaFactory1();
    const ctx1 = new FlowContext();
    const params1 = await (meta1 as any).buildVariablesParams(ctx1);
    expect(params1).toEqual({
      author: { collection: 'users', dataSourceKey: 'main', filterByTk: 1 },
    });

    const obj2 = { author: { id: 2 }, tags: [{ id: 11 }, { id: 12 }] };
    const metaFactory2 = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj2,
    );
    const meta2 = await metaFactory2();
    const ctx2 = new FlowContext();
    const params2 = await (meta2 as any).buildVariablesParams(ctx2);
    expect(params2).toEqual({
      author: { collection: 'users', dataSourceKey: 'main', filterByTk: 2 },
      tags: { collection: 'tags', dataSourceKey: 'main', filterByTk: [11, 12] },
    });
  });

  it('integrates with FlowContext.resolveJsonTemplate to call variables:resolve with flattened contextParams', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { author: 1 };
    const ctx = engine.context as any;

    // Provide API stub to intercept variables:resolve
    const calls: any[] = [];
    (ctx as any).api = {
      request: vi.fn(async ({ url, data, method }) => {
        calls.push({ url, data, method });
        const batch = (data?.values?.batch as any[]) || [];
        const results = batch.map((it) => ({ id: it.id, data: it.template }));
        return { data: { data: { results } } };
      }),
    };

    // Define object-like variable
    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(() => collection),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.author.name }}' } as any;
    await (ctx as any).resolveJsonTemplate(template);

    // Assert variables:resolve was called with proper flattened contextParams
    expect((ctx as any).api.request).toHaveBeenCalled();
    const call = calls.find((c) => c.url === 'variables:resolve');
    expect(call).toBeTruthy();
    const batch0 = call.data?.values?.batch?.[0];
    expect(batch0?.contextParams).toBeTruthy();
    // Flattened key should be 'obj.author'
    const cp = batch0.contextParams as Record<string, any>;
    const keys = Object.keys(cp || {});
    expect(keys).toContain('obj.author');
    expect(cp['obj.author']).toMatchObject({ collection: 'users', filterByTk: 1 });
  });

  it('does not call server when only non-association fields are referenced', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { title: 'hello', author: 1 };
    const ctx = engine.context as any;

    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(() => collection),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.title }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ x: 'hello' });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('buildVariablesParams merges ids and objects in toMany and filters falsy', async () => {
    const { collection } = setupEngineWithCollections();
    const obj = { tags: [11, { id: 12 }, {}, null, undefined, { id: null }] };
    const mf = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    const meta = await mf();
    const ctx = new FlowContext();
    const params = await (meta as any).buildVariablesParams(ctx);
    expect(params).toMatchObject({ tags: { collection: 'tags', filterByTk: [11, 12] } });
  });

  it('supports custom primary key via filterTargetKey', async () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'profiles',
      filterTargetKey: 'uuid',
      fields: [
        { name: 'uuid', type: 'string', interface: 'text' },
        { name: 'name', type: 'string', interface: 'text' },
      ],
    });
    ds.addCollection({
      name: 'articles',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'editor', type: 'belongsTo', target: 'profiles', interface: 'm2o' },
      ],
    });
    const collection = ds.getCollection('articles');
    const obj = { editor: { uuid: 'p-1' } };
    const mf = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    const meta = await mf();
    const ctx = new FlowContext();
    const params = await (meta as any).buildVariablesParams(ctx);
    expect(params).toMatchObject({ editor: { collection: 'profiles', filterByTk: 'p-1' } });
  });

  it('supports composite primary key via filterTargetKey array (toOne/toMany)', async () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'composites',
      filterTargetKey: ['country', 'code'],
      fields: [
        { name: 'country', type: 'string', interface: 'text' },
        { name: 'code', type: 'string', interface: 'text' },
        { name: 'name', type: 'string', interface: 'text' },
      ],
    });
    ds.addCollection({
      name: 'items',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'ref', type: 'belongsTo', target: 'composites', interface: 'm2o' },
        { name: 'refs', type: 'belongsToMany', target: 'composites', interface: 'm2m' },
      ],
    });
    const collection = ds.getCollection('items');

    // toOne
    const obj1 = { ref: { country: 'US', code: '001', name: 'United States' } };
    const mf1 = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj1,
    );
    const meta1 = await mf1();
    const ctx1 = new FlowContext();
    const params1 = await (meta1 as any).buildVariablesParams(ctx1);
    expect(params1).toMatchObject({
      ref: { collection: 'composites', filterByTk: { country: 'US', code: '001' } },
    });

    // toMany with mixed valid/invalid entries
    const obj2 = {
      refs: [
        { country: 'CN', code: '086' },
        { country: 'JP' }, // missing code => ignored
        'raw', // unsupported raw value for composite => ignored
      ],
    };
    const mf2 = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj2,
    );
    const meta2 = await mf2();
    const ctx2 = new FlowContext();
    const params2 = await (meta2 as any).buildVariablesParams(ctx2);
    expect(params2).toMatchObject({
      refs: { collection: 'composites', filterByTk: [{ country: 'CN', code: '086' }] },
    });
  });

  it('ignores incomplete composite key values when building params', async () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'dept',
      filterTargetKey: ['org', 'id'],
      fields: [
        { name: 'org', type: 'string', interface: 'text' },
        { name: 'id', type: 'string', interface: 'text' },
      ],
    });
    ds.addCollection({
      name: 'employees',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'department', type: 'belongsTo', target: 'dept', interface: 'm2o' },
      ],
    });
    const collection = ds.getCollection('employees');
    const obj = { department: { org: 'HQ' } }; // missing id
    const mf = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    const meta = await mf();
    const ctx = new FlowContext();
    const params = await (meta as any).buildVariablesParams(ctx);
    expect(params).toEqual({});
  });

  it('contextParams only includes used association subpaths (filters out unused)', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { author: 1, tags: [11, 12] };
    const ctx = engine.context as any;
    const calls: any[] = [];
    (ctx as any).api = {
      request: vi.fn(async ({ url, data, method }) => {
        calls.push({ url, data, method });
        const batch = (data?.values?.batch as any[]) || [];
        const results = batch.map((it) => ({ id: it.id, data: it.template }));
        return { data: { data: { results } } };
      }),
    };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(() => collection),
      serverOnlyWhenContextParams: true,
    });

    // 仅引用 author 子属性，不使用 tags
    const template = { a: '{{ ctx.obj.author.name }}' } as any;
    await (ctx as any).resolveJsonTemplate(template);

    const call = calls.find((c) => c.url === 'variables:resolve');
    expect(call).toBeTruthy();
    const cp = call.data?.values?.batch?.[0]?.contextParams as Record<string, any>;
    const keys = Object.keys(cp || {});
    expect(keys).toContain('obj.author');
    expect(keys).not.toContain('obj.tags');
  });

  it('bracket without dot does not call server (tags[0])', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { tags: [11, 12] };
    const ctx = engine.context as any;
    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(() => collection),
      serverOnlyWhenContextParams: true,
    });

    const template = { t0: '{{ ctx.obj.tags[0] }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ t0: 11 });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('no association values => buildVariablesParams returns empty object', async () => {
    const { collection } = setupEngineWithCollections();
    const obj = { title: 'hello' };
    const mf = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    const meta = await mf();
    const ctx = new FlowContext();
    const params = await (meta as any).buildVariablesParams(ctx);
    expect(params).toEqual({});
  });

  it('top-level association value (no dot) does not call server', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { author: 7 };
    const ctx = engine.context as any;
    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );
    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(() => collection),
    });

    const template = { a: '{{ ctx.obj.author }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ a: 7 });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('local-first: toOne association subpath uses local value and skips server', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { author: { id: 7, name: 'LocalName' } };
    const ctx = engine.context as any;

    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );

    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      // 启用“本地优先”：传入 valueAccessor，以便当本地已有该子路径时跳过服务端
      resolveOnServer: createAssociationSubpathResolver(
        () => collection,
        () => obj,
      ),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.author.name }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ x: 'LocalName' });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('local-first: toMany association subpath (index + dot) uses local value and skips server', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { tags: [{ id: 11, name: 'T1' }] };
    const ctx = engine.context as any;

    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );

    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(
        () => collection,
        () => obj,
      ),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.tags[0].name }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ x: 'T1' });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('local-first: toMany dot-only association subpath uses local value and skips server', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = {
      tags: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
    };
    const ctx = engine.context as any;

    (ctx as any).api = { request: vi.fn() };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );

    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(
        () => collection,
        () => obj,
      ),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.tags.name }}' } as any;
    const resolved = await (ctx as any).resolveJsonTemplate(template);
    expect(resolved).toEqual({ x: ['A', 'B'] });
    expect((ctx as any).api.request).not.toHaveBeenCalled();
  });

  it('toMany dot-only association subpath falls back to server when local unresolved', async () => {
    const { engine, collection } = setupEngineWithCollections();
    const obj = { tags: [{ id: 1 }, { id: 2 }] };
    const ctx = engine.context as any;

    const calls: any[] = [];
    (ctx as any).api = {
      request: vi.fn(async ({ url, data, method }) => {
        calls.push({ url, data, method });
        const batch = (data?.values?.batch as any[]) || [];
        const results = batch.map((it) => ({ id: it.id, data: it.template }));
        return { data: { data: { results } } };
      }),
    };

    const metaFactory = createAssociationAwareObjectMetaFactory(
      () => collection,
      'Current object',
      () => obj,
    );

    ctx.defineProperty('obj', {
      get: () => obj,
      cache: false,
      meta: metaFactory,
      resolveOnServer: createAssociationSubpathResolver(
        () => collection,
        () => obj,
      ),
      serverOnlyWhenContextParams: true,
    });

    const template = { x: '{{ ctx.obj.tags.name }}' } as any;
    await (ctx as any).resolveJsonTemplate(template);

    const call = calls.find((c) => c.url === 'variables:resolve');
    expect(call).toBeTruthy();
    expect((ctx as any).api.request).toHaveBeenCalled();
  });
});
