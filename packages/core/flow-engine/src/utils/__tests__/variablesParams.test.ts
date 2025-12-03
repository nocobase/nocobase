/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import {
  collectContextParamsForTemplate,
  createRecordMetaFactory,
  createRecordResolveOnServerWithLocal,
  inferParentRecordRef,
  inferRecordRef,
} from '../variablesParams';
import { FlowEngine, SingleRecordResource } from '../..';

describe('variablesParams helpers', () => {
  it('inferRecordRef and inferParentRecordRef from FlowContext-like object', () => {
    const ctx: any = {
      resource: {
        getResourceName: () => 'posts.comments',
        getDataSourceKey: () => 'main',
        getFilterByTk: () => 1,
        getSourceId: () => 9,
      },
      collection: { name: 'posts', dataSourceKey: 'main' },
    };
    expect(inferRecordRef(ctx)).toEqual({ collection: 'posts', dataSourceKey: 'main', filterByTk: 1 });
    expect(inferParentRecordRef(ctx)).toEqual({ collection: 'posts', dataSourceKey: 'main', filterByTk: 9 });
  });

  it('inferRecordRef fallback to collection.getFilterByTK when resource has no filterByTk', () => {
    const engine = new FlowEngine();
    const ds = engine.context.dataSourceManager.getDataSource('main')!;
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'roles', type: 'belongsToMany', target: 'roles', interface: 'm2m' },
      ],
    });
    const collection = ds.getCollection('users');
    const resource = engine.context.createResource(SingleRecordResource);
    resource.setResourceName('main.users');
    // 不设置 filterByTk，模拟资源无 filter 时的 fallback
    const ctx: any = engine.context;
    ctx.defineProperty('resource', { value: resource });
    ctx.defineProperty('collection', { value: collection });
    ctx.defineProperty('record', { value: { id: 5 } });

    expect(inferRecordRef(ctx)).toEqual({ collection: 'users', dataSourceKey: 'main', filterByTk: 5 });
  });

  it('collectContextParamsForTemplate builds input for used variables only', async () => {
    const ctx: any = {
      getPropertyOptions: (k: string) => ({
        meta:
          k === 'record'
            ? async () => ({
                type: 'object',
                title: 'Record',
                buildVariablesParams: () => ({ collection: 'posts', dataSourceKey: 'main', filterByTk: 1 }),
              })
            : undefined,
      }),
    };

    const tpl = { a: '{{ ctx.record.id }}', b: '{{ ctx.user.name }}' } as any;
    const res = await collectContextParamsForTemplate(ctx, tpl);
    expect(res).toHaveProperty('record');
    expect(res).not.toHaveProperty('user');
  });

  it('collectContextParamsForTemplate keeps associationName/sourceId from RecordRef', async () => {
    const ctx: any = {
      getPropertyOptions: (k: string) => ({
        meta:
          k === 'popup'
            ? async () => ({
                type: 'object',
                title: 'Popup',
                buildVariablesParams: () => ({
                  record: {
                    collection: 'posts',
                    dataSourceKey: 'main',
                    filterByTk: 1,
                    associationName: 'users.posts',
                    sourceId: 9,
                  },
                }),
              })
            : undefined,
      }),
    };

    const tpl = { value: '{{ ctx.popup.record.id }}' } as any;
    const res = await collectContextParamsForTemplate(ctx, tpl);
    expect(res?.['popup.record']).toMatchObject({
      collection: 'posts',
      dataSourceKey: 'main',
      filterByTk: 1,
      associationName: 'users.posts',
      sourceId: 9,
    });
  });

  it('createRecordResolveOnServerWithLocal: no local record => always use server', () => {
    const resolver = createRecordResolveOnServerWithLocal(
      () => ({ name: 'posts', dataSourceKey: 'main' }) as any,
      () => undefined,
    );
    expect(resolver('')).toBe(true);
    expect(resolver('title')).toBe(true);
    expect(resolver('author.name')).toBe(true);
  });

  it('createRecordResolveOnServerWithLocal: local record + non-association subpaths => use local', () => {
    const collection: any = {
      getField: (name: string) => {
        if (name === 'id') return { name: 'id', isAssociationField: () => false };
        if (name === 'title') return { name: 'title', isAssociationField: () => false };
        return undefined;
      },
    };
    const record = { id: 1, title: 'Hello' };
    const resolver = createRecordResolveOnServerWithLocal(
      () => collection,
      () => record,
    );
    expect(resolver('')).toBe(false);
    expect(resolver('id')).toBe(false);
    expect(resolver('title')).toBe(false);
  });

  it('createRecordResolveOnServerWithLocal: association with local value => still use local', () => {
    const collection: any = {
      getField: (name: string) => {
        if (name === 'author') return { name: 'author', isAssociationField: () => true };
        if (name === 'title') return { name: 'title', isAssociationField: () => false };
        return undefined;
      },
    };
    const record = { title: 'Hello', author: { id: 1, name: 'Alice' } };
    const resolver = createRecordResolveOnServerWithLocal(
      () => collection,
      () => record,
    );
    expect(resolver('author')).toBe(false);
    expect(resolver('author.name')).toBe(false);
  });

  it('createRecordResolveOnServerWithLocal: association without local value => use server', () => {
    const collection: any = {
      getField: (name: string) => {
        if (name === 'author') return { name: 'author', isAssociationField: () => true };
        if (name === 'title') return { name: 'title', isAssociationField: () => false };
        return undefined;
      },
    };
    const record = { title: 'Hello', author: null };
    const resolver = createRecordResolveOnServerWithLocal(
      () => collection,
      () => record,
    );
    expect(resolver('author')).toBe(true);
    expect(resolver('author.name')).toBe(true);
  });
});
