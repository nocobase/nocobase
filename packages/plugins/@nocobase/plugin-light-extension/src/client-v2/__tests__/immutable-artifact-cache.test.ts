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
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import { invalidateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { getLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';

const artifactHash = 'a'.repeat(64);
const sourceBinding = {
  type: 'light-extension-entry',
  repoId: 'repo_1',
  entryId: 'entry_1',
  kind: 'js-action',
};

export function describeImmutableArtifactCache(): void {
  describe('light extension immutable artifact cache', () => {
    it('reuses the resolved immutable artifact for settings-only executions', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get' ? artifactResponse() : resolveResponse(options.data);
      });
      const { api, resolver } = createPrimedResolver(request);
      const duplicateResolver = createLightExtensionRunJSResolver(api);
      const legacyBridgeResolver = createLightExtensionRunJSResolver(api);

      const first = await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'A' } });
      const second = await duplicateResolver.resolve({
        sourceMode: 'light-extension',
        sourceBinding,
        settings: { label: 'B' },
      });
      const third = await legacyBridgeResolver.resolve({
        sourceMode: 'light-extension',
        sourceBinding,
        settings: { label: 'C' },
      });
      const fourth = await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'D' } });

      expect(first.code).toContain('ACTION_V1');
      expect(second.code).toBe(first.code);
      expect(first.settings).toEqual({ label: 'A' });
      expect(second.settings).toEqual({ label: 'B' });
      expect(third.settings).toEqual({ label: 'C' });
      expect(fourth.settings).toEqual({ label: 'D' });
      expect(request.mock.calls.filter(([options]) => options.url === '/light-extension-runtime/resolve')).toHaveLength(
        1,
      );
      expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
      expect(request.mock.calls.find(([options]) => options.method === 'get')?.[0].url).toBe(
        `/light-extension-runtime/artifacts/${artifactHash}`,
      );
    });

    it('deduplicates concurrent Artifact GET requests for the same hash', async () => {
      let resolveArtifact: ((value: unknown) => void) | undefined;
      const request = vi.fn(async (options: ApiRequestOptions) => {
        if (options.method !== 'get') {
          return resolveResponse(options.data);
        }
        return new Promise<unknown>((resolve) => {
          resolveArtifact = resolve;
        });
      });
      const { resolver } = createPrimedResolver(request);

      const first = resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'A' } });
      const second = resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: { label: 'B' } });
      await vi.waitFor(() => {
        expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
      });
      resolveArtifact?.(artifactResponse());

      await expect(Promise.all([first, second])).resolves.toHaveLength(2);
      expect(request.mock.calls.filter(([options]) => options.method === 'get')).toHaveLength(1);
    });

    it('fetches artifacts through the API client when resolve returns a custom prefixed URL', async () => {
      const request = vi.fn(async (options: ApiRequestOptions) => {
        return options.method === 'get'
          ? artifactResponse()
          : resolveResponse(options.data, `/foo/api/light-extension-runtime/artifacts/${artifactHash}`);
      });
      const { resolver } = createPrimedResolver(request);

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
      const { api, resolver } = createPrimedResolver(request);

      await resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} });
      invalidateLightExtensionRuntimeCache(api, sourceBinding.repoId);
      await expect(resolver.resolve({ sourceMode: 'light-extension', sourceBinding, settings: {} })).rejects.toThrow(
        'repo disabled',
      );
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
      const { resolver } = createPrimedResolver(request);

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
}

describeImmutableArtifactCache();

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

function createPrimedResolver(request: (options: ApiRequestOptions) => Promise<unknown>) {
  const api = createApi(request);
  getLightExtensionSettingsDescriptorCache(api).primeScope(sourceBinding.repoId, 'js-action', [
    {
      id: sourceBinding.entryId,
      repoId: sourceBinding.repoId,
      kind: 'js-action',
      entryName: 'example',
      entryPath: 'src/client/js-actions/example/index.ts',
      title: 'Example',
      settingsSchema: {
        type: 'object',
        properties: {
          label: { type: 'string' },
        },
      },
      settingsSchemaHash: 'settings-schema-v1',
      settingsDefaultsHash: 'settings-defaults-v1',
      runtimeCodeHash: 'runtime_hash_v1',
      artifactHash,
      runtimeAvailable: true,
    },
  ]);
  return {
    api,
    resolver: createLightExtensionRunJSResolver(api),
  };
}
