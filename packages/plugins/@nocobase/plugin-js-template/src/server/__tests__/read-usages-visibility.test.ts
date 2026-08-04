/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { hashUsageOwnerLocator, normalizeUsageOwnerLocator } from '../services/JsTemplateUsageOwnerRegistry';
import { createJsPageUsageRecord, createUsageRecord, createJsTemplateUsageServiceFixture } from './usage-test-helpers';

describe('plugin-js-template listUsages visibility', () => {
  it('filters usages by owner visibility', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      usages: [
        createUsageRecord({
          modelUid: 'flow_hidden',
        }),
      ],
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

    const usages = await service.listUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        requestId: 'req_read_hidden_usage',
        actorUserId: '7',
        can,
      },
    );

    expect(usages).toEqual([]);
    expect(can).toHaveBeenCalledWith({
      resource: 'jsTemplate',
      action: 'readUsages',
    });
    expect(can).toHaveBeenCalledWith({
      resource: 'flowModels',
      action: 'findOne',
    });
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'listUsages',
        result: 'denied',
        reasonCode: 'owner_not_visible',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
  });

  it('returns visible usages when the owner can be read', async () => {
    const { service } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_visible',
          options: {
            uid: 'flow_visible',
            use: 'JSBlockModel',
          },
        },
      ],
      usages: [
        createUsageRecord({
          modelUid: 'flow_visible',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return {
          params: {
            filter: {
              uid: 'flow_visible',
            },
          },
        };
      }
      return false;
    });

    const usages = await service.listUsages(
      {
        ownerLocator: {
          modelUid: 'flow_visible',
        },
      },
      {
        can,
      },
    );

    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({
      projectId: 'jtp_sales',
      ownerLocator: {
        modelUid: 'flow_visible',
      },
    });
  });

  it('filters visible usages by a non-step owner locator hash', async () => {
    const ownerLocator = {
      kind: 'flowModel.fieldSettings',
      modelUid: 'flow_field_visible',
      descriptor: 'field settings placeholder',
    };
    const normalizedOwnerLocator = normalizeUsageOwnerLocator(ownerLocator);
    if (!normalizedOwnerLocator) {
      throw new Error('Expected field settings owner locator to normalize');
    }
    const { service } = createJsTemplateUsageServiceFixture({
      usages: [
        createUsageRecord({
          id: 'jtu_field_visible',
          kind: 'js-field',
          ownerKind: 'flowModel.fieldSettings',
          ownerLocator,
          ownerLocatorHash: hashUsageOwnerLocator(normalizedOwnerLocator),
        }),
        createUsageRecord({
          id: 'jtu_step_same_model_uid',
          modelUid: 'flow_field_visible',
        }),
      ],
    });

    const usages = await service.listUsages({
      ownerLocator,
    });

    expect(usages).toHaveLength(1);
    expect(usages[0]).toMatchObject({
      id: 'jtu_field_visible',
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
      ownerLocator,
    });
  });

  it('does not treat broad flowModels:findOne permission as owner visibility', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_broad_permission',
          options: {
            uid: 'flow_broad_permission',
            use: 'JSBlockModel',
          },
        },
      ],
      usages: [
        createUsageRecord({
          modelUid: 'flow_broad_permission',
        }),
      ],
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

    const usages = await service.listUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        requestId: 'req_read_broad_flow_model_permission',
        can,
      },
    );

    expect(usages).toEqual([]);
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'listUsages',
        result: 'denied',
        reasonCode: 'owner_not_visible',
      }),
    );
  });

  it('rejects usages when flowModels:findOne permission filter does not match the owner', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_filtered_out',
          options: {
            uid: 'flow_filtered_out',
            use: 'JSBlockModel',
          },
        },
      ],
      usages: [
        createUsageRecord({
          modelUid: 'flow_filtered_out',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return {
          params: {
            filter: {
              uid: 'another_owner',
            },
          },
        };
      }
      return false;
    });

    const usages = await service.listUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        requestId: 'req_read_filtered_out',
        can,
      },
    );

    expect(usages).toEqual([]);
    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'listUsages',
        result: 'denied',
        reasonCode: 'owner_not_visible',
      }),
    );
  });

  it('returns visible usages when the owner belongs to an accessible desktop route', async () => {
    const { service } = createJsTemplateUsageServiceFixture({
      flowModels: [
        {
          uid: 'flow_route_visible',
          options: {
            uid: 'flow_route_visible',
            use: 'JSBlockModel',
          },
        },
      ],
      flowModelTreePaths: [
        {
          ancestor: 'route_schema',
          descendant: 'flow_route_visible',
        },
        {
          ancestor: 'flow_route_visible',
          descendant: 'flow_route_visible',
        },
      ],
      desktopRoutes: [
        {
          id: 378224304062466,
          schemaUid: 'route_schema',
        },
      ],
      roles: [
        {
          name: 'member',
          desktopRoutes: [
            {
              id: 378224304062466,
            },
          ],
        },
      ],
      usages: [
        createUsageRecord({
          modelUid: 'flow_route_visible',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'jsTemplate' && action === 'readUsages') {
        return {};
      }
      return false;
    });

    const usages = await service.listUsages(
      {
        projectId: 'jtp_sales',
      },
      {
        can,
        state: {
          currentRoles: ['member'],
        },
      },
    );

    expect(usages).toHaveLength(1);
    expect(usages[0].ownerLocator.modelUid).toBe('flow_route_visible');
  });

  it('uses JS Page route visibility when reading page usages', async () => {
    for (const testCase of [
      { role: 'page-hidden', desktopRoutes: [], visible: false },
      { role: 'page-reader', desktopRoutes: [{ id: 'route_js_page' }], visible: true },
    ]) {
      const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
        flowModelTreePaths: [
          {
            ancestor: 'js_page_schema',
            descendant: 'flow_js_page_visible',
          },
        ],
        desktopRoutes: [
          {
            id: 'route_js_page',
            schemaUid: 'js_page_schema',
          },
        ],
        roles: [
          {
            name: testCase.role,
            desktopRoutes: testCase.desktopRoutes,
          },
        ],
        usages: [createJsPageUsageRecord({ modelUid: 'flow_js_page_visible' })],
      });
      const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
        if (resource === 'jsTemplate' && action === 'readUsages') {
          return {};
        }
        return false;
      });

      const usages = await service.listUsages(
        { projectId: 'jtp_pages' },
        { can, requestId: `req_js_page_${testCase.role}`, state: { currentRoles: [testCase.role] } },
      );

      expect(usages).toHaveLength(testCase.visible ? 1 : 0);
      if (testCase.visible) {
        expect(usages[0]).toMatchObject({
          kind: 'js-page',
          ownerKind: 'flowModel.pageSettings',
          ownerLocator: {
            modelUid: 'flow_js_page_visible',
            use: 'JSPageModel',
          },
        });
      } else {
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

  it('records denied audit when listUsages permission is missing', async () => {
    const { service, recordUsageEvent } = createJsTemplateUsageServiceFixture({
      usages: [createUsageRecord()],
    });
    const can = vi.fn(() => false);

    await expect(
      service.listUsages(
        {
          projectId: 'jtp_sales',
        },
        {
          requestId: 'req_read_denied',
          actorUserId: '8',
          can,
        },
      ),
    ).rejects.toMatchObject({
      code: 'JS_TEMPLATE_PERMISSION_DENIED',
    });

    expect(recordUsageEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'jtp_sales',
        action: 'listUsages',
        result: 'denied',
        reasonCode: 'permission_denied',
        requestId: 'req_read_denied',
        actorUserId: '8',
      }),
    );
  });
});
