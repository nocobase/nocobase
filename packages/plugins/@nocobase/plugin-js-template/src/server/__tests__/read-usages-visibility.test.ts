/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import type { JsTemplateUsageListInput } from '../../shared/types';
import { createJsPageUsageRecord, createUsageRecord, createJsTemplateUsageServiceFixture } from './usage-test-helpers';

const salesUsageListInput = {
  templateId: 'jtt_sales_kpi',
  page: 1,
  pageSize: 20,
} satisfies JsTemplateUsageListInput;

describe('plugin-js-template template-level Usage visibility', () => {
  it('omits hidden owners without leaking their descriptors', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      usages: [createUsageRecord({ modelUid: 'flow_hidden' })],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return false;
      }
      return false;
    });

    const result = await service.listUsages(salesUsageListInput, {
      requestId: 'req_read_hidden_usage',
      actorUserId: '7',
      can,
    });

    expect(result).toEqual({
      data: [],
      meta: {
        page: 1,
        pageSize: 20,
        count: 0,
        totalPage: 0,
        effectiveCount: 1,
        hiddenCount: 1,
      },
    });
    expect(can).toHaveBeenCalledWith({ resource: 'jsTemplate', action: 'readUsages' });
    expect(can).toHaveBeenCalledWith({ resource: 'flowModels', action: 'findOne' });
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'jtp_sales',
        templateId: 'jtt_sales_kpi',
        action: 'listUsages',
        result: 'denied',
        usageCount: 1,
        reasonCode: 'owner_not_visible',
      }),
    );
    expect(JSON.stringify(recordUsageEvent.mock.calls)).not.toContain('flow_hidden');
  });

  it('returns visible owner and location descriptors', async () => {
    const { service } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_visible',
          options: {
            uid: 'flow_visible',
            use: 'JSBlockModel',
            title: 'Sales dashboard block',
          },
        },
      ],
      usages: [createUsageRecord({ modelUid: 'flow_visible' })],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return { params: { filter: { uid: 'flow_visible' } } };
      }
      return false;
    });

    const result = await service.listUsages(salesUsageListInput, { can });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      projectId: 'jtp_sales',
      templateId: 'jtt_sales_kpi',
      ownerLocator: { modelUid: 'flow_visible' },
      ownerTitle: 'Sales dashboard block',
      locationTitle: 'Sales dashboard block',
      routeId: null,
    });
    expect(result.meta).toMatchObject({ count: 1, effectiveCount: 1, hiddenCount: 0 });
  });

  it('paginates effective usages in the repository and excludes owner_missing', async () => {
    const effectiveUsages = Array.from({ length: 25 }, (_, index) =>
      createUsageRecord({ id: `jtu_visible_${index}`, modelUid: `flow_visible_${index}` }),
    );
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModels: effectiveUsages.map((usage) => {
        const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
        return { uid: modelUid, options: { uid: modelUid, title: `Owner ${modelUid}` } };
      }),
      flowModelTreePaths: effectiveUsages.map((usage) => {
        const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
        return { ancestor: modelUid, descendant: modelUid };
      }),
      desktopRoutes: effectiveUsages.map((usage, index) => {
        const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
        return { id: `route_${index}`, schemaUid: modelUid, title: `Location ${index}` };
      }),
      usages: [
        ...effectiveUsages,
        createUsageRecord({ id: 'jtu_owner_missing', modelUid: 'flow_missing', resolvedStatus: 'owner_missing' }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      return false;
    });

    const result = await service.listUsages(
      { templateId: 'jtt_sales_kpi', page: 3, pageSize: 10 },
      { can, state: { currentRoles: ['root'] } },
    );

    expect(result.data).toHaveLength(5);
    expect(result.data.every((usage) => usage.resolvedStatus !== 'owner_missing')).toBe(true);
    expect(result.meta).toEqual({
      page: 3,
      pageSize: 10,
      count: 25,
      totalPage: 3,
      effectiveCount: 25,
      hiddenCount: 0,
    });
    expect(repositories.jsTemplateUsages.find).toHaveBeenCalledOnce();
    expect(repositories.jsTemplateUsages.find).toHaveBeenCalledWith(expect.objectContaining({ limit: 10, offset: 20 }));
    expect(repositories.jsTemplateUsages.count).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: { templateId: 'jtt_sales_kpi', resolvedStatus: { $ne: 'owner_missing' } },
      }),
    );
    expect(repositories.flowModels.find).toHaveBeenCalledOnce();
    expect(repositories.flowModelTreePath.find).toHaveBeenCalledOnce();
    expect(repositories.desktopRoutes.find).toHaveBeenCalledOnce();
    expect(repositories.roles.find).not.toHaveBeenCalled();
  });

  it('scans restricted visibility in bounded concurrent batches without oversized model UID filters', async () => {
    const effectiveUsages = Array.from({ length: 205 }, (_, index) =>
      createUsageRecord({ id: `jtu_restricted_${index}`, modelUid: `flow_restricted_${index}` }),
    );
    const routes = effectiveUsages.map((usage, index) => {
      const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
      return { id: `route_restricted_${index}`, schemaUid: modelUid, title: `Restricted location ${index}` };
    });
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      flowModels: effectiveUsages.map((usage) => {
        const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
        return { uid: modelUid, options: { uid: modelUid, title: `Owner ${modelUid}` } };
      }),
      flowModelTreePaths: effectiveUsages.map((usage) => {
        const modelUid = (usage.ownerLocator as { modelUid: string }).modelUid;
        return { ancestor: modelUid, descendant: modelUid };
      }),
      desktopRoutes: routes,
      roles: [{ name: 'member', desktopRoutes: routes.map(({ id }) => ({ id })) }],
      usages: effectiveUsages,
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      return false;
    });
    const findUsages = repositories.jsTemplateUsages.find;
    const originalFindUsages = findUsages.getMockImplementation();
    let activeUsageQueries = 0;
    let maximumConcurrentUsageQueries = 0;
    findUsages.mockImplementation(async (options = {}) => {
      activeUsageQueries += 1;
      maximumConcurrentUsageQueries = Math.max(maximumConcurrentUsageQueries, activeUsageQueries);
      await new Promise((resolve) => setTimeout(resolve, 1));
      try {
        return (await originalFindUsages?.(options)) || [];
      } finally {
        activeUsageQueries -= 1;
      }
    });

    const result = await service.listUsages(
      { templateId: 'jtt_sales_kpi', page: 21, pageSize: 10 },
      { can, state: { currentRoles: ['member'] } },
    );

    expect(result.data).toHaveLength(5);
    expect(result.meta).toEqual({
      page: 21,
      pageSize: 10,
      count: 205,
      totalPage: 21,
      effectiveCount: 205,
      hiddenCount: 0,
    });
    expect(repositories.jsTemplateUsages.find.mock.calls.map(([options]) => options.offset)).toEqual([0, 100, 200]);
    expect(repositories.jsTemplateUsages.find.mock.calls.every(([options]) => options.limit === 100)).toBe(true);
    expect(maximumConcurrentUsageQueries).toBeGreaterThan(1);
    expect(maximumConcurrentUsageQueries).toBeLessThanOrEqual(4);
    expect(
      repositories.flowModels.find.mock.calls.every(
        ([options]) => ((options.filter as { uid: { $in: string[] } }).uid.$in || []).length <= 100,
      ),
    ).toBe(true);
    expect(
      repositories.flowModelTreePath.find.mock.calls.every(
        ([options]) => ((options.filter as { descendant: { $in: string[] } }).descendant.$in || []).length <= 100,
      ),
    ).toBe(true);
    expect(repositories.roles.find).toHaveBeenCalledOnce();
  });

  it('does not treat broad flowModels:findOne permission as owner visibility', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModels: [{ uid: 'flow_broad_permission', options: { uid: 'flow_broad_permission' } }],
      usages: [createUsageRecord({ modelUid: 'flow_broad_permission' })],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return {};
      }
      return false;
    });

    const result = await service.listUsages(salesUsageListInput, {
      requestId: 'req_read_broad_flow_model_permission',
      can,
    });

    expect(result.data).toEqual([]);
    expect(result.meta.hiddenCount).toBe(1);
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'listUsages', result: 'denied', reasonCode: 'owner_not_visible' }),
    );
  });

  it('returns visible usages when the owner belongs to an accessible desktop route', async () => {
    const { service } = createJsTemplateUsageServiceFixture({
      flowModels: [{ uid: 'flow_route_visible', options: { uid: 'flow_route_visible', title: 'Sales block' } }],
      flowModelTreePaths: [
        { ancestor: 'route_schema', descendant: 'flow_route_visible' },
        { ancestor: 'flow_route_visible', descendant: 'flow_route_visible' },
      ],
      desktopRoutes: [{ id: 378224304062466, schemaUid: 'route_schema', title: 'Sales page' }],
      roles: [{ name: 'member', desktopRoutes: [{ id: 378224304062466 }] }],
      usages: [createUsageRecord({ modelUid: 'flow_route_visible' })],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      return false;
    });

    const result = await service.listUsages(salesUsageListInput, {
      can,
      state: { currentRoles: ['member'] },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      ownerLocator: { modelUid: 'flow_route_visible' },
      ownerTitle: 'Sales block',
      locationTitle: 'Sales page',
      routeId: '378224304062466',
    });
  });

  it('uses JS Page route visibility when reading page usages', async () => {
    for (const testCase of [
      { role: 'page-hidden', desktopRoutes: [], visible: false },
      { role: 'page-reader', desktopRoutes: [{ id: 'route_js_page' }], visible: true },
    ]) {
      const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
        flowModels: [{ uid: 'flow_js_page_visible', options: { title: 'Sales page model' } }],
        flowModelTreePaths: [{ ancestor: 'js_page_schema', descendant: 'flow_js_page_visible' }],
        desktopRoutes: [{ id: 'route_js_page', schemaUid: 'js_page_schema', title: 'Sales page' }],
        roles: [{ name: testCase.role, desktopRoutes: testCase.desktopRoutes }],
        usages: [createJsPageUsageRecord({ modelUid: 'flow_js_page_visible' })],
      });
      const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
        if (resource === 'jsTemplate' && action === 'readUsages') {
          return {};
        }
        return false;
      });

      const result = await service.listUsages(
        { templateId: 'jtt_sales_page', page: 1, pageSize: 20 },
        { can, requestId: `req_js_page_${testCase.role}`, state: { currentRoles: [testCase.role] } },
      );

      expect(result.data).toHaveLength(testCase.visible ? 1 : 0);
      if (testCase.visible) {
        expect(result.data[0]).toMatchObject({
          kind: 'js-page',
          ownerKind: 'flowModel.pageSettings',
          ownerLocator: { modelUid: 'flow_js_page_visible', use: 'JSPageModel' },
          locationTitle: 'Sales page',
        });
      } else {
        expect(result.meta.hiddenCount).toBe(1);
        expect(recordUsageEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'listUsages',
            result: 'denied',
            requestId: 'req_js_page_page-hidden',
            reasonCode: 'owner_not_visible',
          }),
        );
      }
    }
  });

  it('records a visibility-safe denied audit when list permission is missing', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      usages: [createUsageRecord()],
    });
    const can = vi.fn(() => false);

    await expect(
      service.listUsages(salesUsageListInput, {
        requestId: 'req_read_denied',
        actorUserId: '8',
        can,
      }),
    ).rejects.toMatchObject({ code: 'JS_TEMPLATE_PERMISSION_DENIED' });

    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        templateId: 'jtt_sales_kpi',
        action: 'listUsages',
        result: 'denied',
        reasonCode: 'permission_denied',
        requestId: 'req_read_denied',
        actorUserId: '8',
      }),
    );
  });

  it('rejects a foreign-application Template before querying usage aggregates', async () => {
    const { service, repositories } = createJsTemplateUsageServiceFixture({
      projects: [
        {
          id: 'jtp_foreign',
          applicationName: 'support',
          lifecycleStatus: 'enabled',
          headCommitId: 'commit_foreign',
        },
      ],
      templates: [
        {
          id: 'jtt_sales_kpi',
          projectId: 'jtp_foreign',
          kind: 'js-block',
          healthStatus: 'ready',
        },
      ],
      usages: [createUsageRecord({ projectId: 'jtp_foreign' })],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) =>
      resource === 'jsTemplate' && action === 'readUsages' ? {} : false,
    );

    await expect(service.listUsages(salesUsageListInput, { can })).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
      status: 403,
    });
    expect(repositories.jsTemplateUsages.count).not.toHaveBeenCalled();
    expect(repositories.jsTemplateUsages.find).not.toHaveBeenCalled();
  });

  it.each([
    [{ templateId: '', page: 1, pageSize: 20 }, 'templateId must be a non-empty string'],
    [{ templateId: 'jtt_sales_kpi', page: 0, pageSize: 20 }, 'page must be an integer greater than zero'],
    [{ templateId: 'jtt_sales_kpi', page: 1, pageSize: 101 }, 'pageSize must be an integer between 1 and 100'],
  ])('validates direct service pagination input before querying usages', async (input, message) => {
    const { service, repositories } = createJsTemplateUsageServiceFixture();

    await expect(service.listUsages(input, {})).rejects.toMatchObject({
      code: 'JS_TEMPLATE_INVALID_INPUT',
      message,
    });
    expect(repositories.jsTemplateUsages.find).not.toHaveBeenCalled();
  });
});
