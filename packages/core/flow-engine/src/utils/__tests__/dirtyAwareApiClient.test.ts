/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { APIClient, type IResource, type RequestOptions } from '@nocobase/sdk';
import { FlowContext } from '../../flowContext';
import { FlowEngine } from '../../flowEngine';
import { createViewScopedEngine } from '../../ViewScopedFlowEngine';
import { DATA_SOURCE_DIRTY_EVENT } from '../../views/viewEvents';
import { getDirtyAwareApiClient, SKIP_DATA_SOURCE_DIRTY } from '../dirtyAwareApiClient';

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

  it('should keep request overrides local to the dirty-aware proxy', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };
    const originalRequest = api.request;
    const wrappedApi = getWrappedApi(engine, api);
    const delegatedRequest = wrappedApi.request.bind(wrappedApi);
    const requestOverride = vi.fn((config: TestRequestOptions) => delegatedRequest(config));

    wrappedApi.request = requestOverride;

    await wrappedApi.request({ url: 'posts:list' });

    expect(requestOverride).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(api.request).toBe(originalRequest);
  });

  it('should keep resource overrides local to the dirty-aware proxy', async () => {
    const engine = new FlowEngine();
    const update = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({ update })),
    };
    const originalResource = api.resource;
    const wrappedApi = getWrappedApi(engine, api);
    const delegatedResource = wrappedApi.resource.bind(wrappedApi);
    const resourceOverride = vi.fn((...args: Parameters<TestApi['resource']>) => delegatedResource(...args));

    wrappedApi.resource = resourceOverride;

    await wrappedApi.resource('posts').update({ filterByTk: 1 });

    expect(resourceOverride).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(api.resource).toBe(originalResource);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should route resource actions through the local request override without double-marking', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedRequest = wrappedApi.request.bind(wrappedApi);
    const requestOverride = vi.fn((config: Parameters<APIClient['request']>[0]) => delegatedRequest(config));

    wrappedApi.request = requestOverride as APIClient['request'];

    await wrappedApi.resource('posts').update({ filterByTk: 1, values: { title: 'updated' } });

    expect(requestOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should invoke custom request methods on the original api instance', async () => {
    class StatefulRequestAPIClient extends APIClient {
      #privateRequestCalls = 0;
      publicRequestCalls = 0;

      get privateRequestCalls() {
        return this.#privateRequestCalls;
      }

      override request<T, R, D>(config: Parameters<APIClient['request']>[0]): Promise<R> {
        this.#privateRequestCalls += 1;
        this.publicRequestCalls += 1;
        return super.request<T, R, D>(config);
      }
    }

    const engine = new FlowEngine();
    const api = new StatefulRequestAPIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;

    await wrappedApi.resource('posts').update({ filterByTk: 1, values: { title: 'updated' } });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(api.privateRequestCalls).toBe(1);
    expect(api.publicRequestCalls).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should invoke custom resource methods on the original api instance', async () => {
    class StatefulResourceAPIClient extends APIClient {
      #privateResourceCalls = 0;
      publicResourceCalls = 0;

      get privateResourceCalls() {
        return this.#privateResourceCalls;
      }

      override resource(...args: Parameters<APIClient['resource']>): IResource {
        this.#privateResourceCalls += 1;
        this.publicResourceCalls += 1;
        return super.resource(...args);
      }
    }

    const engine = new FlowEngine();
    const api = new StatefulResourceAPIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;

    await wrappedApi.request({
      resource: 'posts',
      action: 'update',
      params: { filterByTk: 1, values: { title: 'updated' } },
    });

    expect(transport).toHaveBeenCalledTimes(1);
    expect(api.privateResourceCalls).toBe(1);
    expect(api.publicResourceCalls).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should keep one dirty mark when the request override rebuilds the config', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedRequest = wrappedApi.request.bind(wrappedApi);
    const requestOverride = vi.fn((config: Parameters<APIClient['request']>[0]) => {
      const { url, method, headers, params, data } = config as RequestOptions;
      return delegatedRequest({ url, method, headers, params, data });
    });

    wrappedApi.request = requestOverride as APIClient['request'];

    await wrappedApi.resource('posts').update({ filterByTk: 1, values: { title: 'updated' } });

    expect(requestOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should keep nested mutations from a request override independent', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedRequest = wrappedApi.request.bind(wrappedApi);
    const requestOverride = vi.fn(async (config: Parameters<APIClient['request']>[0]) => {
      await delegatedRequest({ url: 'comments:create', method: 'post' });
      return delegatedRequest(config);
    });

    wrappedApi.request = requestOverride as APIClient['request'];

    await wrappedApi.resource('posts').update({ filterByTk: 1, values: { title: 'updated' } });

    expect(requestOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(engine.getDataSourceDirtyVersion('main', 'comments')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should route structured requests through the local resource override without double-marking', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedResource = wrappedApi.resource.bind(wrappedApi);
    const resourceOverride = vi.fn((...args: Parameters<APIClient['resource']>) => delegatedResource(...args));

    wrappedApi.resource = resourceOverride;

    await wrappedApi.request({
      resource: 'posts',
      action: 'update',
      params: { filterByTk: 1, values: { title: 'updated' } },
    });

    expect(resourceOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should keep one dirty mark when the resource override delegates lazily', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedResource = wrappedApi.resource.bind(wrappedApi);
    const resourceOverride = vi.fn(
      (...args: Parameters<APIClient['resource']>): IResource => ({
        update: async (...actionArgs: Parameters<IResource['update']>) => {
          await Promise.resolve();
          return delegatedResource(...args).update(...actionArgs);
        },
      }),
    );

    wrappedApi.resource = resourceOverride;

    await wrappedApi.request({
      resource: 'posts',
      action: 'update',
      params: { filterByTk: 1, values: { title: 'updated' } },
    });

    expect(resourceOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should keep nested mutations from a resource override independent', async () => {
    const engine = new FlowEngine();
    const api = new APIClient();
    const transport = vi.spyOn(api.axios, 'request').mockResolvedValue({ data: { ok: true } });
    const wrappedApi = getDirtyAwareApiClient(api, engine.context) as APIClient;
    const delegatedResource = wrappedApi.resource.bind(wrappedApi);
    let nestedMutation: Promise<unknown> | undefined;
    const resourceOverride = vi.fn((...args: Parameters<APIClient['resource']>) => {
      nestedMutation = delegatedResource('comments').create({ values: { body: 'nested' } });
      return delegatedResource(...args);
    });

    wrappedApi.resource = resourceOverride;

    await wrappedApi.request({
      resource: 'posts',
      action: 'update',
      params: { filterByTk: 1, values: { title: 'updated' } },
    });
    await nestedMutation;

    expect(resourceOverride).toHaveBeenCalledTimes(1);
    expect(transport).toHaveBeenCalledTimes(2);
    expect(engine.getDataSourceDirtyVersion('main', 'comments')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(1);
  });

  it('should clear local request and resource overrides when deleted', () => {
    const engine = new FlowEngine();
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({})),
    };
    const wrappedApi = getWrappedApi(engine, api);
    const defaultRequest = wrappedApi.request;
    const defaultResource = wrappedApi.resource;

    wrappedApi.request = vi.fn();
    wrappedApi.resource = vi.fn();

    expect(Reflect.deleteProperty(wrappedApi, 'request')).toBe(true);
    expect(Reflect.deleteProperty(wrappedApi, 'resource')).toBe(true);
    expect(wrappedApi.request).toBe(defaultRequest);
    expect(wrappedApi.resource).toBe(defaultResource);
  });

  it('should reject request and resource descriptor overrides without mutating the raw api', () => {
    const engine = new FlowEngine();
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({})),
    };
    const wrappedApi = getWrappedApi(engine, api);
    const originalRequest = api.request;
    const originalResource = api.resource;

    expect(Reflect.defineProperty(wrappedApi, 'request', { value: vi.fn() })).toBe(false);
    expect(Reflect.defineProperty(wrappedApi, 'resource', { value: vi.fn() })).toBe(false);
    expect(() => Object.defineProperty(wrappedApi, 'request', { value: vi.fn() })).toThrow(TypeError);
    expect(() => Object.defineProperty(wrappedApi, 'resource', { value: vi.fn() })).toThrow(TypeError);
    expect(api.request).toBe(originalRequest);
    expect(api.resource).toBe(originalResource);
  });

  it('should reject local overrides for own methods on a non-extensible raw api', () => {
    const engine = new FlowEngine();
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({})),
    };
    const wrappedApi = getWrappedApi(engine, api);
    const defaultMethods = {
      request: wrappedApi.request,
      resource: wrappedApi.resource,
    };

    Object.preventExtensions(api);

    for (const methodName of ['request', 'resource'] as const) {
      expect(Reflect.set(wrappedApi, methodName, vi.fn())).toBe(false);
      expect(wrappedApi[methodName]).toBe(defaultMethods[methodName]);
      expect(Reflect.deleteProperty(wrappedApi, methodName)).toBe(false);
    }
  });

  it('should keep overrides isolated between flow contexts', () => {
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request: vi.fn(async () => ({ data: { ok: true } })),
      resource: vi.fn(() => ({})),
    };
    const firstContextApi = getDirtyAwareApiClient(api, new FlowContext()) as TestApi;
    const secondContextApi = getDirtyAwareApiClient(api, new FlowContext()) as TestApi;
    const secondRequest = secondContextApi.request;
    const requestOverride = vi.fn();

    firstContextApi.request = requestOverride;

    expect(firstContextApi.request).toBe(requestOverride);
    expect(secondContextApi.request).toBe(secondRequest);
    expect(api.request).not.toBe(requestOverride);
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
      'run',
      'runById',
      'unknownCustomAction',
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

  it('should resolve data source resource URLs to the nested data source target', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };

    await getWrappedApi(engine, api).request({
      url: 'dataSources/external/collections:update',
    });

    expect(request).toHaveBeenCalledTimes(1);
    expect(engine.getDataSourceDirtyVersion('external', 'collections')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('main', 'dataSources.collections')).toBe(0);
    expect(engine.getDataSourceDirtyVersion('main', 'dataSources')).toBe(0);
  });

  it('should resolve dataSources resourceOf requests to the nested data source target', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const update = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(() => ({ update })),
    };
    const wrappedApi = getWrappedApi(engine, api);

    await wrappedApi.request({
      resource: 'dataSources.collections',
      resourceOf: 'external',
      action: 'update',
    } as TestRequestOptions & { resourceOf: string });
    await wrappedApi.resource('dataSources.roles', 'external').update({ values: { allow: true } });
    await wrappedApi.resource('dataSources/external/roles').update({ values: { allow: false } });

    expect(engine.getDataSourceDirtyVersion('external', 'collections')).toBe(1);
    expect(engine.getDataSourceDirtyVersion('external', 'roles')).toBe(2);
    expect(engine.getDataSourceDirtyVersion('main', 'dataSources.collections')).toBe(0);
    expect(engine.getDataSourceDirtyVersion('main', 'dataSources.roles')).toBe(0);
  });

  it('should skip dirty marking and strip the internal skip flag from raw requests', async () => {
    const engine = new FlowEngine();
    const request = vi.fn(async () => ({ data: { ok: true } }));
    const api: TestApi = {
      auth: { locale: 'zh-CN' },
      request,
      resource: vi.fn(),
    };

    await getWrappedApi(engine, api).request({
      url: 'posts:update',
      [SKIP_DATA_SOURCE_DIRTY]: true,
    } as TestRequestOptions & { [SKIP_DATA_SOURCE_DIRTY]: boolean });

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).not.toHaveProperty(SKIP_DATA_SOURCE_DIRTY);
    expect(engine.getDataSourceDirtyVersion('main', 'posts')).toBe(0);
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
