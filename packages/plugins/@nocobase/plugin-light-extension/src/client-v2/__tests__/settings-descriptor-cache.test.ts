/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSourceResolver } from '@nocobase/client-v2';
import { describe, expect, it, vi } from 'vitest';

import type { LightExtensionKind, LightExtensionSelectableEntrySummary } from '../../shared/types';
import type { ApiClientLike, ApiRequestOptions } from '../api/lightExtensionEntriesRequests';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import {
  getLightExtensionSettingsDescriptorCache,
  invalidateLightExtensionSettingsDescriptorCache,
} from '../resolvers/LightExtensionSettingsDescriptorCache';

const REPO = {
  id: 'repo_sales',
  name: 'sales',
  normalizedName: 'sales',
  title: 'Sales',
  description: null,
  lifecycleStatus: 'enabled',
  healthStatus: 'ready',
  headCommitId: 'commit-1',
};

describe('LightExtension settings descriptor cache', () => {
  it('reuses one selectable-entry request for repeated descriptor reads without caching settings values', async () => {
    const entry = createEntry({
      schemaHash: 'schema-v1',
      settingsSchema: createMessageSchema('Hello'),
    });
    const request = vi.fn(async () => resourceResponse([entry]));
    const api = createApi(request);
    const resolver = createLightExtensionRunJSResolver(api);

    const first = await getDescriptor(resolver, {
      message: 'saved-first',
    });
    expect(first).toEqual({
      entryId: entry.id,
      settingsSchemaHash: 'schema-v1',
      schema: createMessageSchema('Hello'),
      defaults: {
        message: 'Hello',
      },
    });

    if (first) {
      first.defaults.message = 'mutated-consumer-copy';
      const properties = first.schema?.properties as Record<string, Record<string, unknown>> | undefined;
      if (properties) {
        properties.message.default = 'mutated-schema-copy';
      }
    }

    await expect(
      getDescriptor(resolver, {
        message: 'saved-second',
      }),
    ).resolves.toEqual({
      entryId: entry.id,
      settingsSchemaHash: 'schema-v1',
      schema: createMessageSchema('Hello'),
      defaults: {
        message: 'Hello',
      },
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith({
      url: 'lightExtensionEntries:listSelectable',
      method: 'post',
      data: {
        repoId: 'repo_sales',
        kind: 'js-block',
      },
    });
  });

  it('keeps descriptors isolated by repository, kind, and entry binding', async () => {
    const entries = [
      createEntry({
        entryId: 'entry_sales_primary',
        schemaHash: 'sales-primary',
        settingsSchema: createMessageSchema('A'),
      }),
      createEntry({
        entryId: 'entry_sales_secondary',
        schemaHash: 'sales-secondary',
        settingsSchema: createMessageSchema('B'),
      }),
      createEntry({
        repoId: 'repo_ops',
        entryId: 'entry_ops',
        schemaHash: 'ops',
        settingsSchema: createMessageSchema('C'),
      }),
      createEntry({
        kind: 'js-action',
        entryId: 'entry_sales_action',
        schemaHash: 'sales-action',
        settingsSchema: createMessageSchema('D'),
      }),
    ];
    const request = vi.fn(async (options: ApiRequestOptions) => {
      const input = options.data as { repoId?: string; kind?: string };
      return resourceResponse(entries.filter((entry) => entry.repoId === input.repoId && entry.kind === input.kind));
    });
    const resolver = createLightExtensionRunJSResolver(createApi(request));

    await expect(getDescriptor(resolver, {}, 'repo_sales', 'entry_sales_primary')).resolves.toMatchObject({
      settingsSchemaHash: 'sales-primary',
    });
    await expect(getDescriptor(resolver, {}, 'repo_sales', 'entry_sales_secondary')).resolves.toMatchObject({
      settingsSchemaHash: 'sales-secondary',
    });
    await expect(getDescriptor(resolver, {}, 'repo_ops', 'entry_ops')).resolves.toMatchObject({
      settingsSchemaHash: 'ops',
    });
    await expect(getDescriptor(resolver, {}, 'repo_sales', 'entry_sales_action', 'js-action')).resolves.toMatchObject({
      settingsSchemaHash: 'sales-action',
    });
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('deduplicates concurrent cache misses for the same repository and kind', async () => {
    const api = createApi(vi.fn());
    const cache = getLightExtensionSettingsDescriptorCache(api);
    const load = deferred<LightExtensionSelectableEntrySummary[]>();
    const loadEntries = vi.fn(() => load.promise);
    const binding = {
      repoId: 'repo_sales',
      entryId: 'entry_sales',
      kind: 'js-block' as const,
    };

    const first = cache.getOrLoad(binding, loadEntries);
    const second = cache.getOrLoad(binding, loadEntries);
    expect(loadEntries).toHaveBeenCalledTimes(1);

    load.resolve([createEntry({ schemaHash: 'schema-shared', settingsSchema: createMessageSchema('Shared') })]);

    await expect(first).resolves.toMatchObject({ settingsSchemaHash: 'schema-shared' });
    await expect(second).resolves.toMatchObject({ settingsSchemaHash: 'schema-shared' });
    expect(loadEntries).toHaveBeenCalledTimes(1);
  });

  it('reloads the real schema hash, property order, and defaults after repository invalidation', async () => {
    let entry = createEntry({
      schemaHash: 'schema-v1',
      settingsSchema: {
        type: 'object',
        properties: {
          alpha: { type: 'string', default: 'A' },
          beta: { type: 'string', default: 'B' },
        },
      },
    });
    const request = vi.fn(async () => resourceResponse([entry]));
    const api = createApi(request);
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(getDescriptor(resolver)).resolves.toMatchObject({
      settingsSchemaHash: 'schema-v1',
      defaults: { alpha: 'A', beta: 'B' },
    });

    entry = createEntry({
      schemaHash: 'schema-v2-reordered',
      settingsSchema: {
        type: 'object',
        properties: {
          beta: { type: 'string', default: 'B2' },
          alpha: { type: 'string', default: 'A2' },
        },
      },
    });
    await expect(getDescriptor(resolver)).resolves.toMatchObject({
      settingsSchemaHash: 'schema-v1',
    });

    invalidateLightExtensionSettingsDescriptorCache(api, 'repo_sales');

    await expect(getDescriptor(resolver)).resolves.toEqual({
      entryId: 'entry_sales',
      settingsSchemaHash: 'schema-v2-reordered',
      schema: entry.settingsSchema,
      defaults: { beta: 'B2', alpha: 'A2' },
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('uses a refreshed source menu response to prime descriptors without another request', async () => {
    let entry = createEntry({ schemaHash: 'schema-v1', settingsSchema: createMessageSchema('Old') });
    const request = vi.fn(async (options: ApiRequestOptions) => {
      if (options.url === 'lightExtensionRepos:list') {
        return resourceResponse([REPO]);
      }
      return resourceResponse([entry]);
    });
    const api = createApi(request);
    const resolver = createLightExtensionRunJSResolver(api);

    await expect(getDescriptor(resolver)).resolves.toMatchObject({ settingsSchemaHash: 'schema-v1' });

    entry = createEntry({ schemaHash: 'schema-v2', settingsSchema: createMessageSchema('New') });
    await resolver.listSourceMenuItems?.({
      kind: 'js-block',
      sourceMode: 'light-extension',
      sourceBinding: createBinding(),
      settings: { message: 'saved' },
      t: (key) => key,
    });

    await expect(getDescriptor(resolver, { message: 'still-saved' })).resolves.toMatchObject({
      settingsSchemaHash: 'schema-v2',
      defaults: { message: 'New' },
    });
    expect(
      request.mock.calls.filter(([options]) => options.url === 'lightExtensionEntries:listSelectable'),
    ).toHaveLength(2);
  });

  it('does not let an invalidated in-flight response overwrite a newer schema', async () => {
    const api = createApi(vi.fn());
    const cache = getLightExtensionSettingsDescriptorCache(api);
    const oldLoad = deferred<LightExtensionSelectableEntrySummary[]>();
    const newLoad = deferred<LightExtensionSelectableEntrySummary[]>();
    const binding = {
      repoId: 'repo_sales',
      entryId: 'entry_sales',
      kind: 'js-block' as const,
    };

    const oldResult = cache.getOrLoad(binding, () => oldLoad.promise);
    invalidateLightExtensionSettingsDescriptorCache(api, 'repo_sales');
    const newResult = cache.getOrLoad(binding, () => newLoad.promise);

    newLoad.resolve([createEntry({ schemaHash: 'schema-new', settingsSchema: createMessageSchema('New') })]);
    await expect(newResult).resolves.toMatchObject({ settingsSchemaHash: 'schema-new' });

    oldLoad.resolve([createEntry({ schemaHash: 'schema-old', settingsSchema: createMessageSchema('Old') })]);
    await expect(oldResult).resolves.toMatchObject({ settingsSchemaHash: 'schema-new' });
    expect(cache.get(binding)).toMatchObject({
      settingsSchemaHash: 'schema-new',
      defaults: { message: 'New' },
    });
  });
});

function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
  return {
    request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
      return (await request(options)) as TResponse;
    },
  };
}

function createEntry(options: {
  repoId?: string;
  entryId?: string;
  kind?: LightExtensionKind;
  schemaHash: string;
  settingsSchema: Record<string, unknown> | null;
}): LightExtensionSelectableEntrySummary {
  return {
    id: options.entryId || 'entry_sales',
    repoId: options.repoId || 'repo_sales',
    kind: options.kind || 'js-block',
    entryName: options.entryId || 'sales-kpi',
    entryPath: `src/${options.entryId || 'sales-kpi'}/index.tsx`,
    title: options.entryId || 'Sales KPI',
    settingsSchema: options.settingsSchema,
    settingsSchemaHash: options.schemaHash,
    settingsDefaultsHash: `defaults-${options.schemaHash}`,
    runtimeCodeHash: `runtime-${options.schemaHash}`,
    runtimeAvailable: true,
  };
}

function createMessageSchema(defaultValue: string): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        default: defaultValue,
      },
    },
  };
}

function createBinding(repoId = 'repo_sales', entryId = 'entry_sales', kind: LightExtensionKind = 'js-block') {
  return {
    type: 'light-extension-entry' as const,
    repoId,
    entryId,
    kind,
  };
}

function getDescriptor(
  resolver: RunJSSourceResolver,
  settings: Record<string, unknown> = {},
  repoId = 'repo_sales',
  entryId = 'entry_sales',
  kind: LightExtensionKind = 'js-block',
) {
  return resolver.getSettingsDescriptor?.({
    sourceMode: 'light-extension',
    sourceBinding: createBinding(repoId, entryId, kind),
    settings,
  });
}

function resourceResponse<T>(data: T) {
  return {
    data: {
      data,
    },
  };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}
