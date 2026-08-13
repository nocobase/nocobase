/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type ApiClientLike, type ApiRequestOptions, listSelectableJsTemplates } from '../api/jsTemplatesRequests';
import {
  invalidateJsTemplateRuntimeCache,
  registerJsTemplateRuntimeIdentity,
} from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Consolidated from selectable-catalog-cache.test.ts.
function registerSelectableCatalogCacheTests() {
  describe('JS Template selectable catalog cache', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('deduplicates concurrent full-catalog loads and filters the shared result locally', async () => {
      const request = vi
        .fn()
        .mockResolvedValue(
          resourceResponse([
            createTemplate('jtt-block'),
            createTemplate('jtt-field', 'js-field'),
            createTemplate('jtt-other-project', 'js-block', { projectId: 'jtp-2' }),
          ]),
        );
      const api = createApi(request);

      const [blocks, fields, projectTemplates] = await Promise.all([
        listSelectableJsTemplates(api, { kind: 'js-block' }),
        listSelectableJsTemplates(api, { kind: 'js-field' }),
        listSelectableJsTemplates(api, { projectId: 'jtp-1' }),
      ]);

      expect(blocks.map((template) => template.id)).toEqual(['jtt-block', 'jtt-other-project']);
      expect(fields.map((template) => template.id)).toEqual(['jtt-field']);
      expect(projectTemplates).toHaveLength(2);
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith({ url: 'jsTemplates:listSelectable', method: 'post' });
    });

    it('reloads at 30 seconds when another session changes the catalog', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
      let catalog = [createTemplate('jtt-old')];
      const request = vi.fn(async () => resourceResponse(catalog));
      const api = createApi(request);

      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-old' }]);
      catalog = [createTemplate('jtt-new')];
      vi.setSystemTime(29_999);
      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-old' }]);
      vi.setSystemTime(30_000);
      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-new' }]);
      expect(request).toHaveBeenCalledTimes(2);
    });

    it('reloads after identity changes and local mutations', async () => {
      const identity = { userId: 1, role: 'admin' };
      let catalog = [createTemplate('jtt-admin', 'js-block', { projectTitle: 'Admin project' })];
      const request = vi.fn(async () => resourceResponse(catalog));
      const api = createApi(request);
      const dispose = registerJsTemplateRuntimeIdentity(api, () => identity);

      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-admin' }]);
      identity.role = 'member';
      catalog = [createTemplate('jtt-member')];
      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-member' }]);

      catalog = [createTemplate('jtt-created')];
      invalidateJsTemplateRuntimeCache(api, 'jtp-1');
      await expect(listSelectableJsTemplates(api)).resolves.toMatchObject([{ id: 'jtt-created' }]);

      catalog = [];
      invalidateJsTemplateRuntimeCache(api);
      await expect(listSelectableJsTemplates(api)).resolves.toEqual([]);
      expect(request).toHaveBeenCalledTimes(4);
      dispose();
    });
  });

  function createApi(request: (options: ApiRequestOptions) => Promise<unknown>): ApiClientLike {
    return {
      request: async <TResponse>(options: ApiRequestOptions) => (await request(options)) as TResponse,
    };
  }

  function createTemplate(
    id: string,
    kind = 'js-block',
    labels: { projectId?: string; projectName?: string; projectTitle?: string } = {},
  ) {
    return {
      id,
      projectId: labels.projectId || 'jtp-1',
      ...labels,
      kind,
      templateName: id,
      entryPath: `src/client/${id}/index.tsx`,
      title: null,
      category: null,
      settingsSchema: null,
      settingsSchemaHash: null,
      settingsDefaultsHash: null,
      runtimeCodeHash: `runtime-${id}`,
      runtimeAvailable: true,
    };
  }

  function resourceResponse<T>(data: T) {
    return { data: { data } };
  }
}
registerSelectableCatalogCacheTests();

// Consolidated from selectable-template-summary.test.ts.
function registerSelectableTemplateSummaryTests() {
  describe('JS Template selectable template summary', () => {
    it('uses the runtimeAvailable summary contract without runtime artifact payloads', async () => {
      const summary = {
        id: 'jtt_1',
        projectId: 'jtp_1',
        projectName: 'project-one',
        projectTitle: 'Project One',
        kind: 'js-block',
        templateName: 'example',
        entryPath: 'src/client/js-blocks/example/index.tsx',
        title: 'Example',
        category: 'examples',
        settingsSchema: { type: 'object', properties: { message: { type: 'string' } } },
        settingsSchemaHash: 'settings_hash',
        settingsDefaultsHash: null,
        runtimeCodeHash: 'runtime_hash',
        runtimeAvailable: true as const,
      };
      const request = vi.fn().mockResolvedValue({ data: { data: [summary] } });
      const api: ApiClientLike = {
        request: async <TResponse>(options) => (await request(options)) as TResponse,
      };

      const templates = await listSelectableJsTemplates(api, { kind: 'js-block' });

      expect(templates).toEqual([summary]);
      expect(request).toHaveBeenCalledWith({
        url: 'jsTemplates:listSelectable',
        method: 'post',
      });
      expect(templates[0].runtimeAvailable).toBe(true);
      expect(templates[0]).not.toHaveProperty('runtimeArtifact');
      expect(templates[0]).not.toHaveProperty('code');
      expect(templates[0]).not.toHaveProperty('sourceMap');
      expect(templates[0]).not.toHaveProperty('headCommitId');
      expect(templates[0]).not.toHaveProperty('diagnostics');
      expect(templates[0]).not.toHaveProperty('statistics');
    });
  });
}
registerSelectableTemplateSummaryTests();
