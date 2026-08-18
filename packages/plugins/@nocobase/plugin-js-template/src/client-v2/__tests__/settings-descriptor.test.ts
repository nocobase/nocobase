/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type JsTemplateKind, type JsTemplateSelectableTemplateSummary } from '../../shared/types';
import { type ApiClientLike, type ApiRequestOptions, listSelectableJsTemplates } from '../api/jsTemplatesRequests';
import { useJsTemplateProject } from '../hooks/useJsTemplateProject';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';
import {
  getOrCreateJsTemplateRuntimeCache,
  invalidateJsTemplateRuntimeCache,
} from '../resolvers/JsTemplateRuntimeCacheRegistry';
import {
  getJsTemplateSettingsDescriptorCache,
  invalidateJsTemplateSettingsDescriptorCache,
} from '../resolvers/JsTemplateSettingsDescriptorCache';
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

// Consolidated from settings-descriptor-cache.cases.ts.
function registerSettingsDescriptorCacheTests() {
  describe('JsTemplate settings descriptor cache', () => {
    it('reuses one selectable-template request for repeated descriptor reads without caching settings values', async () => {
      const template = createTemplate({
        schemaHash: 'schema-v1',
        settingsSchema: createMessageSchema('Hello'),
      });
      const request = vi.fn(async () => resourceResponse([template]));
      const api = createApi(request);
      const resolver = createJsTemplateRunJSResolver(api);

      const first = await getDescriptor(resolver, {
        message: 'saved-first',
      });
      expect(first).toEqual({
        entryId: template.id,
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
        entryId: template.id,
        settingsSchemaHash: 'schema-v1',
        schema: createMessageSchema('Hello'),
        defaults: {
          message: 'Hello',
        },
      });
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith({
        url: 'jsTemplates:listSelectable',
        method: 'post',
      });
    });

    it('keeps descriptors isolated by project, kind, and template binding', async () => {
      const templates = [
        createTemplate({
          templateId: 'jtt_sales_primary',
          schemaHash: 'sales-primary',
          settingsSchema: createMessageSchema('A'),
        }),
        createTemplate({
          templateId: 'jtt_sales_secondary',
          schemaHash: 'sales-secondary',
          settingsSchema: createMessageSchema('B'),
        }),
        createTemplate({
          projectId: 'jtp_ops',
          templateId: 'jtt_ops',
          schemaHash: 'ops',
          settingsSchema: createMessageSchema('C'),
        }),
        createTemplate({
          kind: 'js-action',
          templateId: 'jtt_sales_action',
          schemaHash: 'sales-action',
          settingsSchema: createMessageSchema('D'),
        }),
        createTemplate({
          kind: 'js-field',
          templateId: 'jtt_sales_primary',
          schemaHash: 'sales-field',
          settingsSchema: createMessageSchema('Field'),
        }),
      ];
      const request = vi.fn(async () => resourceResponse(templates));
      const resolver = createJsTemplateRunJSResolver(createApi(request));

      await expect(getDescriptor(resolver, {}, 'jtp_sales', 'jtt_sales_primary')).resolves.toMatchObject({
        settingsSchemaHash: 'sales-primary',
      });
      await expect(getDescriptor(resolver, {}, 'jtp_sales', 'jtt_sales_secondary')).resolves.toMatchObject({
        settingsSchemaHash: 'sales-secondary',
      });
      await expect(getDescriptor(resolver, {}, 'jtp_ops', 'jtt_ops')).resolves.toMatchObject({
        settingsSchemaHash: 'ops',
      });
      await expect(getDescriptor(resolver, {}, 'jtp_sales', 'jtt_sales_action', 'js-action')).resolves.toMatchObject({
        settingsSchemaHash: 'sales-action',
      });
      await expect(getDescriptor(resolver, {}, 'jtp_sales', 'jtt_sales_primary', 'js-field')).resolves.toMatchObject({
        settingsSchemaHash: 'sales-field',
        defaults: { message: 'Field' },
      });
      expect(request).toHaveBeenCalledTimes(1);
    });

    it('deduplicates concurrent cache misses for the same project and kind', async () => {
      const api = createApi(vi.fn());
      const cache = getJsTemplateSettingsDescriptorCache(api);
      const load = deferred<JsTemplateSelectableTemplateSummary[]>();
      const loadTemplates = vi.fn(() => load.promise);
      const binding = {
        projectId: 'jtp_sales',
        templateId: 'jtt_sales',
        kind: 'js-block' as const,
      };

      const first = cache.getOrLoad(binding, loadTemplates);
      const second = cache.getOrLoad(binding, loadTemplates);
      expect(loadTemplates).toHaveBeenCalledTimes(1);

      load.resolve([createTemplate({ schemaHash: 'schema-shared', settingsSchema: createMessageSchema('Shared') })]);

      await expect(first).resolves.toMatchObject({ settingsSchemaHash: 'schema-shared' });
      await expect(second).resolves.toMatchObject({ settingsSchemaHash: 'schema-shared' });
      expect(loadTemplates).toHaveBeenCalledTimes(1);
    });

    it('reloads the real schema hash, property order, and defaults after project invalidation', async () => {
      let template = createTemplate({
        schemaHash: 'schema-v1',
        settingsSchema: {
          type: 'object',
          properties: {
            alpha: { type: 'string', default: 'A' },
            beta: { type: 'string', default: 'B' },
          },
        },
      });
      const request = vi.fn(async () => resourceResponse([template]));
      const api = createApi(request);
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(getDescriptor(resolver)).resolves.toMatchObject({
        settingsSchemaHash: 'schema-v1',
        defaults: { alpha: 'A', beta: 'B' },
      });

      template = createTemplate({
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

      resolver.invalidateCache('jtp_sales');

      await expect(getDescriptor(resolver)).resolves.toEqual({
        entryId: 'jtt_sales',
        settingsSchemaHash: 'schema-v2-reordered',
        schema: template.settingsSchema,
        defaults: { beta: 'B2', alpha: 'A2' },
      });
      expect(request).toHaveBeenCalledTimes(2);
    });

    it('uses a refreshed source menu response to prime descriptors without another request', async () => {
      let template = createTemplate({ schemaHash: 'schema-v1', settingsSchema: createMessageSchema('Old') });
      const request = vi.fn(async () => resourceResponse([template]));
      const api = createApi(request);
      const resolver = createJsTemplateRunJSResolver(api);

      await expect(getDescriptor(resolver)).resolves.toMatchObject({ settingsSchemaHash: 'schema-v1' });

      template = createTemplate({ schemaHash: 'schema-v2', settingsSchema: createMessageSchema('New') });
      resolver.invalidateCache('jtp_sales');
      await resolver.listSourceMenuItems?.({
        kind: 'js-block',
        sourceMode: 'js-template',
        sourceBinding: createBinding(),
        settings: { message: 'saved' },
        t: (key) => key,
      });

      await expect(getDescriptor(resolver, { message: 'still-saved' })).resolves.toMatchObject({
        settingsSchemaHash: 'schema-v2',
        defaults: { message: 'New' },
      });
      expect(request.mock.calls.filter(([options]) => options.url === 'jsTemplates:listSelectable')).toHaveLength(2);
    });

    it('does not let an invalidated in-flight response overwrite a newer schema', async () => {
      const api = createApi(vi.fn());
      const cache = getJsTemplateSettingsDescriptorCache(api);
      const oldLoad = deferred<JsTemplateSelectableTemplateSummary[]>();
      const newLoad = deferred<JsTemplateSelectableTemplateSummary[]>();
      const binding = {
        projectId: 'jtp_sales',
        templateId: 'jtt_sales',
        kind: 'js-block' as const,
      };

      const oldResult = cache.getOrLoad(binding, () => oldLoad.promise);
      invalidateJsTemplateSettingsDescriptorCache(api, 'jtp_sales');
      const newResult = cache.getOrLoad(binding, () => newLoad.promise);

      newLoad.resolve([createTemplate({ schemaHash: 'schema-new', settingsSchema: createMessageSchema('New') })]);
      await expect(newResult).resolves.toMatchObject({ settingsSchemaHash: 'schema-new' });

      oldLoad.resolve([createTemplate({ schemaHash: 'schema-old', settingsSchema: createMessageSchema('Old') })]);
      await expect(oldResult).resolves.toMatchObject({ settingsSchemaHash: 'schema-new' });
      expect(cache.get(binding)).toMatchObject({
        settingsSchemaHash: 'schema-new',
        defaults: { message: 'New' },
      });
    });

    it('uses the shared project generation when runtime state is invalidated', () => {
      const api = createApi(vi.fn());
      const cache = getJsTemplateSettingsDescriptorCache(api);
      cache.primeScope('jtp_sales', 'js-block', [
        createTemplate({ schemaHash: 'schema-old', settingsSchema: createMessageSchema('Old') }),
      ]);

      invalidateJsTemplateRuntimeCache(api, 'jtp_sales');

      expect(cache.get({ projectId: 'jtp_sales', templateId: 'jtt_sales', kind: 'js-block' })).toBeUndefined();
    });
  });

  function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
    return {
      request: async <TResponse>(options: ApiRequestOptions): Promise<TResponse> => {
        return (await request(options)) as TResponse;
      },
    };
  }

  function createTemplate(options: {
    projectId?: string;
    templateId?: string;
    kind?: JsTemplateKind;
    schemaHash: string;
    settingsSchema: Record<string, unknown> | null;
  }): JsTemplateSelectableTemplateSummary {
    return {
      id: options.templateId || 'jtt_sales',
      projectId: options.projectId || 'jtp_sales',
      kind: options.kind || 'js-block',
      templateName: options.templateId || 'sales-kpi',
      entryPath: `src/${options.templateId || 'sales-kpi'}/index.tsx`,
      title: options.templateId || 'Sales KPI',
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

  function createBinding(projectId = 'jtp_sales', templateId = 'jtt_sales', kind: JsTemplateKind = 'js-block') {
    return {
      type: 'js-template-entry' as const,
      projectId,
      templateId,
      kind,
    };
  }

  function getDescriptor(
    resolver: RunJSSourceResolver,
    settings: Record<string, unknown> = {},
    projectId = 'jtp_sales',
    templateId = 'jtt_sales',
    kind: JsTemplateKind = 'js-block',
  ) {
    return resolver.getSettingsDescriptor?.({
      sourceMode: 'js-template',
      sourceBinding: createBinding(projectId, templateId, kind),
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
    projectId: 'jtp_sales',
    templateId: 'jtt_sales',
    kind: 'js-block' as const,
  };

  describe('settings descriptor mutation invalidation', () => {
    const runtimeInvalidator = getOrCreateJsTemplateRuntimeCache(mocks.api, () => ({
      invalidateProject: vi.fn(),
      clear: vi.fn(),
    }));

    beforeEach(() => {
      mocks.request.mockReset();
      invalidateJsTemplateSettingsDescriptorCache(mocks.api);
      runtimeInvalidator.invalidateProject.mockClear();
      runtimeInvalidator.clear.mockClear();
    });

    it('invalidates the project after lifecycle, source save, and delete mutations succeed', async () => {
      mocks.request.mockResolvedValue(resourceResponse({}));
      const { result } = renderHook(() => useJsTemplateProject());
      const cache = getJsTemplateSettingsDescriptorCache(mocks.api);

      primeDescriptor();
      await act(async () => {
        await result.current.changeLifecycle({ projectId: 'jtp_sales', lifecycleStatus: 'disabled' });
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateProject).toHaveBeenLastCalledWith('jtp_sales');

      primeDescriptor();
      await act(async () => {
        await result.current.saveSource({
          projectId: 'jtp_sales',
          expectedHeadCommitId: 'commit-1',
          message: 'Update settings schema',
          files: [],
        });
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateProject).toHaveBeenLastCalledWith('jtp_sales');

      primeDescriptor();
      await act(async () => {
        await result.current.deleteProject('jtp_sales');
      });
      expect(cache.get(BINDING)).toBeUndefined();
      expect(runtimeInvalidator.invalidateProject).toHaveBeenCalledTimes(3);
    });

    it('keeps the cached descriptor when a mutation fails', async () => {
      mocks.request.mockRejectedValue(new Error('save failed'));
      const { result } = renderHook(() => useJsTemplateProject());
      const cache = getJsTemplateSettingsDescriptorCache(mocks.api);
      primeDescriptor();

      await expect(
        act(async () => {
          await result.current.saveSource({
            projectId: 'jtp_sales',
            expectedHeadCommitId: 'commit-1',
            message: 'Update settings schema',
            files: [],
          });
        }),
      ).rejects.toThrow('JS Template request failed');
      expect(cache.get(BINDING)).toMatchObject({ settingsSchemaHash: 'schema-v1' });
      expect(runtimeInvalidator.invalidateProject).not.toHaveBeenCalled();
    });

    it('reloads the selectable catalog after completed mutations but not accepted creation', async () => {
      let catalogVersion = 0;
      mocks.request.mockImplementation((options: { url: string }) => {
        if (options.url === 'jsTemplates:listSelectable') {
          catalogVersion += 1;
          return Promise.resolve(resourceResponse([{ ...createSelectableTemplate(), id: `jtt-${catalogVersion}` }]));
        }
        if (options.url === 'jsTemplateProjects:create') {
          return Promise.resolve(resourceResponse(createAcceptedJob()));
        }
        return Promise.resolve(resourceResponse({ id: 'jtp_sales' }));
      });
      const { result } = renderHook(() => useJsTemplateProject());

      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-1' }]);

      await act(async () => {
        await result.current.createProject({ idempotencyKey: 'create-sales-1', name: 'sales' });
      });
      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-1' }]);

      await act(async () => {
        await result.current.updateProject({ projectId: 'jtp_sales', title: 'Sales tools' });
      });
      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-2' }]);

      await act(async () => {
        await result.current.changeLifecycle({ projectId: 'jtp_sales', lifecycleStatus: 'disabled' });
      });
      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-3' }]);

      await act(async () => {
        await result.current.saveSource({
          projectId: 'jtp_sales',
          expectedHeadCommitId: 'commit-1',
          message: 'Rename template',
          files: [],
        });
      });
      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-4' }]);

      await act(async () => {
        await result.current.deleteProject('jtp_sales');
      });
      await expect(listSelectableJsTemplates(mocks.api)).resolves.toMatchObject([{ id: 'jtt-5' }]);
    });
  });

  function primeDescriptor(): void {
    getJsTemplateSettingsDescriptorCache(mocks.api).primeScope('jtp_sales', 'js-block', [createSelectableTemplate()]);
  }

  function createSelectableTemplate() {
    return {
      id: 'jtt_sales',
      projectId: 'jtp_sales',
      kind: 'js-block',
      templateName: 'sales-kpi',
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

  function createAcceptedJob() {
    return {
      id: 'jtcj_sales',
      targetProjectId: 'jtp_sales',
      name: 'sales',
      title: null,
      description: null,
      sourceType: 'starter',
      status: 'pending',
      resultProjectId: null,
      errorCode: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-27T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
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
