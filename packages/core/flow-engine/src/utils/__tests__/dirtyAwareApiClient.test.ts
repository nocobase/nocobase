/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { FlowContext } from '../../flowContext';
import { FlowEngine } from '../../flowEngine';
import { createViewScopedEngine } from '../../ViewScopedFlowEngine';
import { DATA_SOURCE_DIRTY_EVENT } from '../../views/viewEvents';
import { getDirtyAwareApiClient } from '../dirtyAwareApiClient';

type TestRequestOptions = {
  url?: string;
  resource?: string;
  action?: string;
  headers?: Record<string, string>;
  params?: unknown;
};

type TestResource = Record<string, (...args: unknown[]) => Promise<unknown>>;

type TestApi = {
  auth: { locale: string };
  request: (config: TestRequestOptions) => Promise<unknown>;
  resource: (name: string, of?: unknown, headers?: Record<string, string>, cancel?: boolean) => TestResource;
};

function getWrappedApi(engine: FlowEngine, api: TestApi): TestApi {
  return getDirtyAwareApiClient(api, engine.context) as TestApi;
}

describe('dirtyAwareApiClient', () => {
  it('should return non-api values as-is', () => {
    const context = new FlowContext();
    const value = { request: vi.fn() };

    expect(getDirtyAwareApiClient(value, context)).toBe(value);
  });

  it('should mark the resource dirty after mutating resource actions succeed', async () => {
    const engine = new FlowEngine();
    const list = vi.fn(async () => ({ data: { data: [] } }));
    const update = vi.fn(async () => ({ data: { data: { id: 1 } } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ list, update })),
    };
    const wrappedApi = getWrappedApi(engine, api);

    await wrappedApi.resource('posts').list();
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);

    await wrappedApi.resource('posts').update({ filterByTk: 1, values: { title: 't' } });

    expect(update).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    expect(getDirtyAwareApiClient(api, engine.context)).toBe(wrappedApi);
  });

  it('should not double-wrap an already dirty-aware api', async () => {
    const engine = new FlowEngine();
    const update = vi.fn(async () => ({ data: { data: { id: 1 } } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ update })),
    };

    const wrappedApi = getWrappedApi(engine, api);
    const wrappedAgain = getDirtyAwareApiClient(wrappedApi, engine.context) as TestApi;
    await wrappedAgain.resource('posts').update({ filterByTk: 1 });

    expect(wrappedAgain).toBe(wrappedApi);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should not mark dirty for read actions', async () => {
    const nonMutatingActions = [
      'get',
      'getSystemSettings',
      'list',
      'listByUser',
      'query',
      'count',
      'check',
      'preview',
      'test',
      'find',
      'exists',
      'aggregate',
      'listMine',
      'parents',
      'children',
      'search',
      'send',
      'testConnection',
      'refresh',
    ];

    for (const actionName of nonMutatingActions) {
      const engine = new FlowEngine();
      const api: TestApi = {
        auth: { locale: 'zh-CN' },
        request: vi.fn(async () => ({ data: { ok: true } })),
        resource: vi.fn(() => ({
          [actionName]: vi.fn(async () => ({ data: { data: [] } })),
        })),
      };

      await getWrappedApi(engine, api).resource('posts')[actionName]();

      expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);
    }
  });

  it('should mark dirty for known mutating action variants', async () => {
    const mutatingActions = [
      'create',
      'execute',
      'updateOrCreate',
      'firstOrCreate',
      'setFields',
      'updateProfile',
      'saveAsTemplate',
      'remove/abc',
    ];

    for (const actionName of mutatingActions) {
      const engine = new FlowEngine();
      const api: TestApi = {
        auth: { locale: 'zh-CN' },
        request: vi.fn(async () => ({ data: { ok: true } })),
        resource: vi.fn(() => ({
          [actionName]: vi.fn(async () => ({ data: { ok: true } })),
        })),
      };

      await getWrappedApi(engine, api).resource('posts')[actionName]();

      expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    }
  });

  it('should not mark dirty when a mutating action fails', async () => {
    const engine = new FlowEngine();
    const update = vi.fn(async () => {
      throw new Error('update failed');
    });
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ update })),
    };

    await expect(getWrappedApi(engine, api).resource('posts').update({ filterByTk: 1 })).rejects.toThrow(
      'update failed',
    );

    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);
  });

  it('should mark association resource and parent collection dirty', async () => {
    const engine = new FlowEngine();
    const dirtyEvents: Array<{ dataSourceKey: string; resourceNames: string[] }> = [];
    engine.emitter.on(DATA_SOURCE_DIRTY_EVENT, (event) => dirtyEvents.push(event));
    const add = vi.fn(async () => ({ data: { data: null } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ add })),
    };

    await getWrappedApi(engine, api)
      .resource('users.roles', 1, { 'x-data-source': 'external' })
      .add({ values: [1, 2] });

    expect(engine.getDataSourceDirtyVersion('external', 'users.roles')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('external', 'users')).toBe(1);
    expect(dirtyEvents).toEqual([{ dataSourceKey: 'external', resourceNames: ['users.roles', 'users'] }]);
  });

  it('should mark resource-action request mutations dirty after success', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };

    await getWrappedApi(engine, api).request({
      resource: 'posts',
      action: 'update',
      headers: { 'X-Data-Source': 'analytics' },
      params: { filterByTk: 1 },
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('analytics', 'posts')).toBe(1);
  });

  it('should mark URL-form resource mutations dirty after success', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };
    const wrappedApi = getWrappedApi(engine, api);

    await wrappedApi.request({ url: 'posts:update' });
    await wrappedApi.request({
      url: '/api/posts:update?filterByTk=1',
      headers: { 'x-data-source': 'external' },
    });
    await wrappedApi.request({
      url: '/api/posts/1/tags:set',
      headers: { 'X-Data-Source': 'analytics' },
    });

    expect(request).toHaveBeenCalledTimes(3);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('external', 'posts')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('analytics', 'posts.tags')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('analytics', 'posts')).toBe(1);
  });

  it('should strip configured API base from URL-form mutations', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };
    engine.context.defineProperty('app', {
      value: {
        getApiUrl(pathname = '') {
          return `https://app.example.com/foo/api/${pathname.replace(/^\//, '')}`;
        },
      },
    });
    const wrappedApi = getWrappedApi(engine, api);

    await wrappedApi.request({ url: '/foo/api/posts:update' });
    await wrappedApi.request({
      url: 'https://app.example.com/foo/api/users/1/roles:set',
      headers: { 'x-data-source': 'external' },
    });

    expect(request).toHaveBeenCalledTimes(2);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'foo.api.posts')).toBe(0);
    expect(engine.getDataSourceDirtyVersion('external', 'users.roles')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('external', 'users')).toBe(1);
  });

  it('should not mark URL-form resource dirty for reads, failed mutations, or external URLs', async () => {
    const engine = new FlowEngine();
    const request = vi
      .fn()
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockRejectedValueOnce(new Error('request failed'))
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockResolvedValueOnce({ data: { ok: true } });
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };
    const wrappedApi = getWrappedApi(engine, api);

    await wrappedApi.request({ url: 'posts:list' });
    await wrappedApi.request({ url: '/api/posts:parents' });
    await expect(wrappedApi.request({ url: '/api/posts:update' })).rejects.toThrow('request failed');
    await wrappedApi.request({ url: 'https://example.com/api/posts:update' });
    await wrappedApi.request({ url: '//example.com/api/posts:update' });

    expect(request).toHaveBeenCalledTimes(5);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);
  });

  it('should mark opener engine dirty when called from a scoped view context', async () => {
    const root = new FlowEngine();
    const scoped = createViewScopedEngine(root);
    const update = vi.fn(async () => ({ data: { data: { id: 1 } } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ update })),
    };

    await getWrappedApi(scoped, api)
      .resource('posts')
      .update({ filterByTk: 1, values: { title: 't' } });

    expect(root.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    expect(scoped.context.engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should not double-mark when the context exposes a scoped engine proxy', async () => {
    const root = new FlowEngine();
    const scoped = createViewScopedEngine(root);
    const context = new FlowContext();
    const update = vi.fn(async () => ({ data: { data: { id: 1 } } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ update })),
    };
    context.defineProperty('engine', { value: scoped });

    await (getDirtyAwareApiClient(api, context) as TestApi).resource('posts').update({ filterByTk: 1 });

    expect(root.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
    expect(scoped.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });
});
