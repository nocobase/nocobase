/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type LightExtensionKind, type LightExtensionSelectableEntrySummary } from '../../shared/types';
import {
  type ApiClientLike,
  type ApiRequestOptions,
  listSelectableLightExtensionEntries,
} from '../api/lightExtensionEntriesRequests';
import { useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import { createInlineLightExtensionSettingsDescriptorProvider } from '../resolvers/InlineLightExtensionSettingsDescriptorProvider';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import {
  getOrCreateLightExtensionRuntimeCache,
  invalidateLightExtensionRuntimeCache,
} from '../resolvers/LightExtensionRuntimeCacheRegistry';
import {
  getLightExtensionSettingsDescriptorCache,
  invalidateLightExtensionSettingsDescriptorCache,
} from '../resolvers/LightExtensionSettingsDescriptorCache';
import { type RunJSSourceResolver } from '@nocobase/client-v2';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const request = vi.fn();
  return {
    api: { request },
    request,
  };
});

vi.mock('@nocobase/flow-engine', async () => ({
  ...(await vi.importActual<typeof import('@nocobase/flow-engine')>('@nocobase/flow-engine')),
  useFlowContext: () => ({ api: mocks.api }),
}));

vi.mock('react-i18next', async () => ({
  ...(await vi.importActual<typeof import('react-i18next')>('react-i18next')),
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Consolidated from settings-descriptor-inline-provider.cases.ts.
function registerInlineSettingsDescriptorTests() {
  const locator = {
    kind: 'flowModel.step' as const,
    modelUid: 'model_1',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
    versionPath: ['version'],
  };

  describe('inline light extension settings descriptor provider', () => {
    it('consumes the server-canonical settings descriptor from the current RunJS workspace', async () => {
      const request = vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_2' },
            files: [{ path: 'src/client/entry.json', content: '{ client parsing must not run' }],
            settingsDescriptor: {
              descriptorPath: 'src/client/entry.json',
              entryId: 'inline:repo_1:welcome-card',
              key: 'welcome-card',
              settingsSchemaHash: 'a'.repeat(64),
              settingsDefaultsHash: 'b'.repeat(64),
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', default: 'Welcome' },
                  enabled: { type: 'boolean', default: false },
                  count: { type: 'integer', default: 0 },
                  label: { type: 'string', default: '' },
                },
              },
              defaults: { title: 'Welcome', enabled: false, count: 0, label: '' },
              diagnostics: [],
            },
          },
        },
      }));
      const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

      await expect(
        provider.getSettingsDescriptor({
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
          runJs: { code: 'ctx.render(<div />);', version: 'v2' },
          locator,
        }),
      ).resolves.toEqual({
        entryId: 'inline:repo_1:welcome-card',
        settingsSchemaHash: 'a'.repeat(64),
        schema: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', default: 'Welcome' },
            enabled: { type: 'boolean', default: false },
            count: { type: 'integer', default: 0 },
            label: { type: 'string', default: '' },
          },
        },
        defaults: { title: 'Welcome', enabled: false, count: 0, label: '' },
      });
      expect(request).toHaveBeenCalledWith({
        url: 'runJSSources:open',
        method: 'post',
        data: {
          locator,
          initialSource: { code: 'ctx.render(<div />);', version: 'v2' },
        },
      });
    });

    it('treats a missing entry.json as no settings instead of a hard failure', async () => {
      const request = vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_1' },
            files: [],
            settingsDescriptor: {
              descriptorPath: 'src/client/entry.json',
              entryId: null,
              key: null,
              settingsSchemaHash: null,
              settingsDefaultsHash: null,
              schema: null,
              defaults: {},
              diagnostics: [
                {
                  code: 'entry_descriptor_missing',
                  severity: 'error',
                  message: 'Entry root must include entry.json',
                  path: 'src/client/entry.json',
                },
              ],
            },
          },
        },
      }));
      const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

      await expect(
        provider.getSettingsDescriptor({
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
          locator,
        }),
      ).resolves.toBeUndefined();
    });

    it('treats an empty settings descriptor without entryId as no settings', async () => {
      const request = vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_1' },
            files: [],
            settingsDescriptor: {
              descriptorPath: 'src/client/entry.json',
              entryId: null,
              key: null,
              settingsSchemaHash: null,
              settingsDefaultsHash: null,
              schema: null,
              defaults: {},
              diagnostics: [],
            },
          },
        },
      }));
      const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

      await expect(
        provider.getSettingsDescriptor({
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
          locator,
        }),
      ).resolves.toBeUndefined();
    });

    it.each([
      ['bad JSON', 'entry_descriptor_json_invalid'],
      ['conflicting settings forms', 'entry_descriptor_settings_conflict'],
    ])('surfaces canonical diagnostics for %s', async (_label, diagnosticCode) => {
      const api = {
        request: vi.fn(async () => ({
          data: {
            data: {
              repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_1' },
              files: [],
              settingsDescriptor: {
                descriptorPath: 'src/client/entry.json',
                entryId: null,
                key: null,
                settingsSchemaHash: null,
                settingsDefaultsHash: null,
                schema: null,
                defaults: {},
                diagnostics: [
                  {
                    code: diagnosticCode,
                    severity: 'error',
                    message: `Canonical ${diagnosticCode}`,
                    path: 'src/client/entry.json',
                  },
                ],
              },
            },
          },
        })),
      } as ApiClientLike;
      const provider = createInlineLightExtensionSettingsDescriptorProvider(api);

      await expect(
        provider.getSettingsDescriptor({
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo_1', commitId: 'commit_1' },
          locator,
        }),
      ).rejects.toMatchObject({
        code: 'LIGHT_EXTENSION_SETTINGS_INVALID',
        status: 422,
        paths: ['src/client/entry.json'],
        details: {
          reasonCode: 'settings_invalid',
          diagnostics: [expect.objectContaining({ code: diagnosticCode })],
        },
      });
    });

    it('accepts the canonical no-settings descriptor without inventing a hash', async () => {
      const request = vi.fn(async () => ({
        data: {
          data: {
            repository: { id: 'repo_1', repoId: 'repo_1', headCommitId: 'commit_3' },
            files: [],
            settingsDescriptor: {
              descriptorPath: 'src/client/entry.json',
              entryId: 'inline:repo_1:no-settings',
              key: 'no-settings',
              settingsSchemaHash: null,
              settingsDefaultsHash: null,
              schema: null,
              defaults: {},
              diagnostics: [],
            },
          },
        },
      }));
      const provider = createInlineLightExtensionSettingsDescriptorProvider({ request } as ApiClientLike);

      await expect(
        provider.getSettingsDescriptor({
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo_1' },
          locator,
        }),
      ).resolves.toMatchObject({
        entryId: 'inline:repo_1:no-settings',
        settingsSchemaHash: null,
        schema: null,
        defaults: {},
      });
    });
  });
}
registerInlineSettingsDescriptorTests();

// Consolidated from settings-descriptor-cache.cases.ts.
function registerSettingsDescriptorCacheTests() {
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
        createEntry({
          kind: 'js-page',
          entryId: 'entry_sales_primary',
          schemaHash: 'sales-page',
          settingsSchema: createMessageSchema('Page'),
        }),
      ];
      const request = vi.fn(async () => resourceResponse(entries));
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
      await expect(getDescriptor(resolver, {}, 'repo_sales', 'entry_sales_action', 'js-action')).resolves.toMatchObject(
        {
          settingsSchemaHash: 'sales-action',
        },
      );
      await expect(getDescriptor(resolver, {}, 'repo_sales', 'entry_sales_primary', 'js-page')).resolves.toMatchObject({
        settingsSchemaHash: 'sales-page',
        defaults: { message: 'Page' },
      });
      expect(request).toHaveBeenCalledTimes(1);
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

      resolver.invalidateCache('repo_sales');

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
      const request = vi.fn(async () => resourceResponse([entry]));
      const api = createApi(request);
      const resolver = createLightExtensionRunJSResolver(api);

      await expect(getDescriptor(resolver)).resolves.toMatchObject({ settingsSchemaHash: 'schema-v1' });

      entry = createEntry({ schemaHash: 'schema-v2', settingsSchema: createMessageSchema('New') });
      resolver.invalidateCache('repo_sales');
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

    it('uses the shared repository generation when runtime state is invalidated', () => {
      const api = createApi(vi.fn());
      const cache = getLightExtensionSettingsDescriptorCache(api);
      cache.primeScope('repo_sales', 'js-block', [
        createEntry({ schemaHash: 'schema-old', settingsSchema: createMessageSchema('Old') }),
      ]);

      invalidateLightExtensionRuntimeCache(api, 'repo_sales');

      expect(cache.get({ repoId: 'repo_sales', entryId: 'entry_sales', kind: 'js-block' })).toBeUndefined();
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
      category: null,
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
}
registerSettingsDescriptorCacheTests();

// Consolidated from settings-descriptor-mutation-invalidation.cases.tsx.
function registerSettingsDescriptorMutationTests() {
  const BINDING = {
    repoId: 'repo_sales',
    entryId: 'entry_sales',
    kind: 'js-block' as const,
  };

  describe('settings descriptor mutation invalidation', () => {
    const runtimeInvalidator = getOrCreateLightExtensionRuntimeCache(mocks.api, () => ({
      invalidateRepo: vi.fn(),
      clear: vi.fn(),
    }));

    beforeEach(() => {
      mocks.request.mockReset();
      invalidateLightExtensionSettingsDescriptorCache(mocks.api);
      runtimeInvalidator.invalidateRepo.mockClear();
      runtimeInvalidator.clear.mockClear();
    });

    it('invalidates the repository after lifecycle, source save, and delete mutations succeed', async () => {
      mocks.request.mockResolvedValue(resourceResponse({}));
      const { result } = renderHook(() => useLightExtensionRepo());
      const cache = getLightExtensionSettingsDescriptorCache(mocks.api);

      primeDescriptor();
      await act(async () => {
        await result.current.changeLifecycle({ repoId: 'repo_sales', lifecycleStatus: 'disabled' });
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateRepo).toHaveBeenLastCalledWith('repo_sales');

      primeDescriptor();
      await act(async () => {
        await result.current.saveSource({
          repoId: 'repo_sales',
          expectedHeadCommitId: 'commit-1',
          message: 'Update settings schema',
          files: [],
        });
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateRepo).toHaveBeenLastCalledWith('repo_sales');

      primeDescriptor();
      await act(async () => {
        await result.current.deleteRepo('repo_sales');
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateRepo).toHaveBeenCalledTimes(3);
    });

    it('keeps the cached descriptor when a mutation fails', async () => {
      mocks.request.mockRejectedValue(new Error('save failed'));
      const { result } = renderHook(() => useLightExtensionRepo());
      const cache = getLightExtensionSettingsDescriptorCache(mocks.api);
      primeDescriptor();

      await expect(
        act(async () => {
          await result.current.saveSource({
            repoId: 'repo_sales',
            expectedHeadCommitId: 'commit-1',
            message: 'Update settings schema',
            files: [],
          });
        }),
      ).rejects.toThrow('Light extension request failed');
      expect(cache.get(BINDING)).toMatchObject({ settingsSchemaHash: 'schema-v1' });
      expect(runtimeInvalidator.invalidateRepo).not.toHaveBeenCalled();
    });

    it('reloads the selectable catalog after every repo or entry mutation succeeds', async () => {
      let catalogVersion = 0;
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'lightExtensionEntries:listSelectable') {
          catalogVersion += 1;
          return Promise.resolve(resourceResponse([{ ...createSelectableEntry(), id: `entry-${catalogVersion}` }]));
        }
        return Promise.resolve(resourceResponse({ id: 'repo_sales' }));
      });
      const { result } = renderHook(() => useLightExtensionRepo());

      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-1' }]);

      await act(async () => {
        await result.current.createRepo({ name: 'sales' });
      });
      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-2' }]);

      await act(async () => {
        await result.current.updateRepo({ repoId: 'repo_sales', title: 'Sales tools' });
      });
      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-3' }]);

      await act(async () => {
        await result.current.changeLifecycle({ repoId: 'repo_sales', lifecycleStatus: 'disabled' });
      });
      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-4' }]);

      await act(async () => {
        await result.current.saveSource({
          repoId: 'repo_sales',
          expectedHeadCommitId: 'commit-1',
          message: 'Rename entry',
          files: [],
        });
      });
      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-5' }]);

      await act(async () => {
        await result.current.deleteRepo('repo_sales');
      });
      await expect(listSelectableLightExtensionEntries(mocks.api)).resolves.toMatchObject([{ id: 'entry-6' }]);
    });
  });

  function primeDescriptor(): void {
    getLightExtensionSettingsDescriptorCache(mocks.api).primeScope('repo_sales', 'js-block', [createSelectableEntry()]);
  }

  function createSelectableEntry() {
    return {
      id: 'entry_sales',
      repoId: 'repo_sales',
      kind: 'js-block',
      entryName: 'sales-kpi',
      entryPath: 'src/sales-kpi/index.tsx',
      title: 'Sales KPI',
      category: null,
      settingsSchema: {
        type: 'object',
        properties: {
          message: { type: 'string', default: 'Hello' },
        },
      },
      settingsSchemaHash: 'schema-v1',
      settingsDefaultsHash: 'defaults-v1',
      runtimeCodeHash: 'runtime-v1',
      runtimeAvailable: true,
    } as const;
  }

  function resourceResponse<T>(data: T) {
    return {
      data: {
        data,
      },
    };
  }
}
registerSettingsDescriptorMutationTests();
