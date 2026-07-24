/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import {
  createLightExtensionRunJSResolver,
  LightExtensionRuntimeCache,
} from '../resolvers/LightExtensionRunJSResolver';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';

const artifactHash = 'a'.repeat(64);
const sourceBinding = {
  type: 'light-extension-entry',
  repoId: 'repo_1',
  entryId: 'entry_1',
  kind: 'js-action',
} as const;

describe('light extension immutable artifact cache', () => {
  it('reuses one server-validated result for 100 sequential executions without a preheated descriptor', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      return options.method === 'get' ? artifactResponse() : resolveResponse(options.data);
    });
    const { api, resolver } = createResolver(request);
    const duplicateResolver = createLightExtensionRunJSResolver(api);
    const legacyBridgeResolver = createLightExtensionRunJSResolver(api);

    const results = [];
    for (let index = 0; index < 100; index += 1) {
      const currentResolver = [resolver, duplicateResolver, legacyBridgeResolver][index % 3];
      results.push(
        await currentResolver.resolve({
          sourceMode: 'light-extension',
          sourceBinding,
          settings: { label: 'A' },
        }),
      );
    }

    expect(results).toHaveLength(100);
    expect(results.every((result) => result.code.includes('ACTION_V1'))).toBe(true);
    expect(results.every((result) => result.settings.label === 'A')).toBe(true);
    expect(request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve')).toHaveLength(
      1,
    );
    expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
    expect(request.mock.calls.find(([options]) => options.method === 'get')?.[0].url).toBe(
      `/light-extension-runtime/artifacts/${artifactHash}`,
    );
  });

  it('deduplicates 100 concurrent resolve POST and Artifact GET requests for the same key', async () => {
    let resolveArtifact: ((value: unknown) => void) | undefined;
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method !== 'get') {
        return resolveResponse(options.data);
      }
      return new Promise<unknown>((resolve) => {
        resolveArtifact = resolve;
      });
    });
    const { resolver } = createResolver(request);

    const pending = Array.from({ length: 100 }, () =>
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'A' } }),
    );
    await vi.waitFor(() => {
      expect(request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve')).toHaveLength(
        1,
      );
      expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
    });
    resolveArtifact?.(artifactResponse());

    await expect(Promise.all(pending)).resolves.toHaveLength(100);
    expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
  });

  it('uses a stable settings signature and keeps different settings server-validated', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method === 'get') {
        return artifactResponse();
      }
      const settings = (options.data as { settings?: Record<string, unknown> }).settings;
      if (settings?.label === 'invalid') {
        throw Object.assign(new Error('settings invalid'), { code: 'LIGHT_EXTENSION_SETTINGS_INVALID' });
      }
      return resolveResponse(options.data);
    });
    const { resolver } = createResolver(request);

    await resolver.resolve({
      sourceMode: 'light-extension',
      sourceBinding,
      settings: { label: 'A', nested: { alpha: 1, beta: 2 } },
    });
    await resolver.resolve({
      sourceMode: 'light-extension',
      sourceBinding,
      settings: { nested: { beta: 2, alpha: 1 }, label: 'A' },
    });
    await expect(
      resolver.resolve({
        sourceMode: 'light-extension',
        sourceBinding,
        settings: { label: 'invalid' },
      }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_SETTINGS_INVALID' });
    await resolver.resolve({
      sourceMode: 'light-extension',
      sourceBinding,
      settings: { label: 'A', nested: { alpha: 1, beta: 2 } },
    });

    expect(request.mock.calls.filter(([options]) => options.method === 'post')).toHaveLength(2);
    expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
  });

  it('uses one settings snapshot for the cache key and delayed request payload', async () => {
    const requestStarted = deferred<unknown>();
    const continueRequest = deferred<unknown>();
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method === 'get') {
        return artifactResponse();
      }
      requestStarted.resolve(undefined);
      await continueRequest.promise;
      return resolveResponse(options.data);
    });
    const { resolver } = createResolver(request);
    const settings = { label: 'A' };

    const pending = resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings });
    await requestStarted.promise;
    settings.label = 'B';
    continueRequest.resolve(undefined);

    await expect(pending).resolves.toMatchObject({ settings: { label: 'A' } });
    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'A' } }),
    ).resolves.toMatchObject({ settings: { label: 'A' } });
    expect(request.mock.calls.filter(([options]) => options.method === 'post')).toHaveLength(1);
  });

  it('accepts a proxied source binding from flow model state', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      return options.method === 'get' ? artifactResponse() : resolveResponse(options.data);
    });
    const { resolver } = createResolver(request);
    const proxiedSourceBinding = new Proxy(sourceBinding, {});

    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding: proxiedSourceBinding, settings: {} }),
    ).resolves.toMatchObject({ code: expect.stringContaining('ACTION_V1') });
    expect(request.mock.calls.find(([options]) => options.method === 'post')?.[0].data).toMatchObject({
      sourceBinding,
    });
  });

  it('fetches artifacts through the API client when resolve returns a custom prefixed URL', async () => {
    const request = vi.fn(async (options: ApiRequestOptions) => {
      return options.method === 'get'
        ? artifactResponse()
        : resolveResponse(options.data, `/foo/api/light-extension-runtime/artifacts/${artifactHash}`);
    });
    const { resolver } = createResolver(request);

    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
    ).resolves.toMatchObject({
      code: expect.stringContaining('ACTION_V1'),
    });

    expect(request.mock.calls.find(([options]) => options.method === 'get')?.[0].url).toBe(
      `/light-extension-runtime/artifacts/${artifactHash}`,
    );
  });

  it('does not execute cached code after the repository cache is invalidated', async () => {
    let resolveCount = 0;
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method === 'get') {
        return artifactResponse();
      }
      resolveCount += 1;
      if (resolveCount === 2) {
        throw new Error('repo disabled');
      }
      return resolveResponse(options.data);
    });
    const { api, resolver } = createResolver(request);

    await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
    invalidateLightExtensionRuntimeCache(api, sourceBinding.repoId);
    await expect(resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} })).rejects.toThrow(
      'repo disabled',
    );
  });

  it('starts a new resolve after in-flight invalidation and discards the old response', async () => {
    const oldResolve = deferred<unknown>();
    const newResolve = deferred<unknown>();
    let postCount = 0;
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method === 'get') {
        return artifactResponse();
      }
      postCount += 1;
      return postCount === 1 ? oldResolve.promise : newResolve.promise;
    });
    const { api, resolver } = createResolver(request);

    const oldCall = resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
    await vi.waitFor(() => expect(postCount).toBe(1));
    invalidateLightExtensionRuntimeCache(api, sourceBinding.repoId);
    const newCall = resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
    await vi.waitFor(() => expect(postCount).toBe(2));

    newResolve.resolve(resolveResponse({ settings: {} }));
    await expect(newCall).resolves.toMatchObject({ code: expect.stringContaining('ACTION_V1') });
    oldResolve.resolve(resolveResponse({ settings: {} }));
    await expect(oldCall).resolves.toMatchObject({ code: expect.stringContaining('ACTION_V1') });

    expect(request.mock.calls.filter(([options]) => options.method === 'post')).toHaveLength(2);
    expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
  });

  it('does not restore an artifact from an invalidated in-flight GET', async () => {
    const artifact = deferred<unknown>();
    let postCount = 0;
    const api = createApi(async (options) => {
      if (options.method === 'get') {
        return artifact.promise;
      }
      postCount += 1;
      if (postCount === 2) {
        throw Object.assign(new Error('repo disabled'), { code: 'LIGHT_EXTENSION_REPO_DISABLED' });
      }
      return resolveResponse(options.data);
    });
    const cache = new LightExtensionRuntimeCache();
    const pending = cache.resolve(api, { sourceMode: 'light-extension', sourceBinding, settings: {} }, sourceBinding);
    await vi.waitFor(() => expect(postCount).toBe(1));

    cache.invalidateRepo(sourceBinding.repoId);
    artifact.resolve(artifactResponse());

    await expect(pending).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_REPO_DISABLED' });
    expect((cache as unknown as { artifacts: Map<string, unknown> }).artifacts.size).toBe(0);
  });

  it('revalidates positive cache entries at the 30 second boundary', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    try {
      let postCount = 0;
      const request = vi.fn(async (options: ApiRequestOptions) => {
        if (options.method === 'get') {
          return artifactResponse();
        }
        postCount += 1;
        if (postCount === 2) {
          throw Object.assign(new Error('repo disabled'), { code: 'LIGHT_EXTENSION_REPO_DISABLED' });
        }
        return resolveResponse(options.data);
      });
      const { resolver } = createResolver(request);

      await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
      vi.setSystemTime(29_999);
      await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
      expect(postCount).toBe(1);

      vi.setSystemTime(30_000);
      await expect(
        resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
      ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_REPO_DISABLED' });
      expect(postCount).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retain domain errors after the in-flight request settles', async () => {
    const request = vi.fn(async () => {
      throw Object.assign(new Error('permission denied'), { code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
    });
    const { resolver } = createResolver(request);

    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
    ).rejects.toMatchObject({ code: 'LIGHT_EXTENSION_PERMISSION_DENIED' });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('re-resolves at most once after an Artifact 404', async () => {
    let artifactRequests = 0;
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.method !== 'get') {
        return resolveResponse(options.data);
      }
      artifactRequests += 1;
      if (artifactRequests === 1) {
        throw Object.assign(new Error('missing'), { response: { status: 404 } });
      }
      return artifactResponse();
    });
    const { resolver } = createResolver(request);

    await expect(
      resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} }),
    ).resolves.toMatchObject({
      code: expect.stringContaining('ACTION_V1'),
    });
    expect(request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve')).toHaveLength(
      2,
    );
    expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(2);
  });
});

function resolveResponse(data: unknown, artifactUrl = `/api/light-extension-runtime/artifacts/${artifactHash}`) {
  const settings = (data as { settings?: Record<string, unknown> } | undefined)?.settings || {};
  return {
    data: {
      data: {
        entryId: 'entry_1',
        entryPath: 'src/client/js-actions/example/index.ts',
        artifactHash,
        artifactUrl,
        runtimeCodeHash: 'runtime_hash_v1',
        version: 'v2',
        settings,
        settingsHash: 'settings_hash',
      },
    },
  };
}

function artifactResponse() {
  return {
    data: {
      artifactHash,
      runtimeCodeHash: 'runtime_hash_v1',
      code: "ctx.message.success('ACTION_V1');",
      sourceMap: '{"version":3}',
      version: 'v2',
      entryPath: 'src/client/js-actions/example/index.ts',
      runtimeContract: 'light-extension.runtime-artifact.v1',
      byteSize: 64,
    },
  };
}

function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions) => (await request(options)) as TResponse,
  };
}

function createResolver(request: (options: ApiRequestOptions) => Promise<unknown>) {
  const api = createApi(request);
  return {
    api,
    resolver: createLightExtensionRunJSResolver(api),
  };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}
