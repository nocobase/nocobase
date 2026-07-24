/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { vi } from 'vitest';

import { hashReferenceOwnerLocator, normalizeReferenceOwnerLocator } from '../services/ReferenceOwnerRegistry';
import {
  createJsPageReferenceRecord,
  createReferenceRecord,
  createReferenceServiceFixture,
} from './reference-test-helpers';

describe('plugin-light-extension readReferences visibility', () => {
  it('filters references by owner visibility', async () => {
    const { service, recordReferenceEvent } = createReferenceServiceFixture({
      references: [
        createReferenceRecord({
          modelUid: 'flow_hidden',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'readReferences') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return false;
      }
      return false;
    });

    const references = await service.readReferences(
      {
        repoId: 'ler_sales',
      },
      {
        requestId: 'req_read_hidden_reference',
        actorUserId: '7',
        can,
      },
    );

    expect(references).toEqual([]);
    expect(can).toHaveBeenCalledWith({
      resource: 'lightExtension',
      action: 'readReferences',
    });
    expect(can).toHaveBeenCalledWith({
      resource: 'flowModels',
      action: 'findOne',
    });
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'readReferences',
        result: 'denied',
        reasonCode: 'owner_not_visible',
        ownerLocatorHash: expect.stringMatching(/^sha256:/),
      }),
    );
  });

  it('returns visible references when the owner can be read', async () => {
    const { service } = createReferenceServiceFixture({
      flowModels: [
        {
          uid: 'flow_visible',
          options: {
            uid: 'flow_visible',
            use: 'JSBlockModel',
          },
        },
      ],
      references: [
        createReferenceRecord({
          modelUid: 'flow_visible',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'readReferences') {
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

    const references = await service.readReferences(
      {
        ownerLocator: {
          modelUid: 'flow_visible',
        },
      },
      {
        can,
      },
    );

    expect(references).toHaveLength(1);
    expect(references[0]).toMatchObject({
      repoId: 'ler_sales',
      ownerLocator: {
        modelUid: 'flow_visible',
      },
    });
  });

  it('filters visible references by a non-step owner locator hash', async () => {
    const ownerLocator = {
      kind: 'flowModel.fieldSettings',
      modelUid: 'flow_field_visible',
      descriptor: 'field settings placeholder',
    };
    const normalizedOwnerLocator = normalizeReferenceOwnerLocator(ownerLocator);
    if (!normalizedOwnerLocator) {
      throw new Error('Expected field settings owner locator to normalize');
    }
    const { service } = createReferenceServiceFixture({
      references: [
        createReferenceRecord({
          id: 'lef_field_visible',
          kind: 'js-field',
          ownerKind: 'flowModel.fieldSettings',
          ownerLocator,
          ownerLocatorHash: hashReferenceOwnerLocator(normalizedOwnerLocator),
        }),
        createReferenceRecord({
          id: 'lef_step_same_model_uid',
          modelUid: 'flow_field_visible',
        }),
      ],
    });

    const references = await service.readReferences({
      ownerLocator,
    });

    expect(references).toHaveLength(1);
    expect(references[0]).toMatchObject({
      id: 'lef_field_visible',
      kind: 'js-field',
      ownerKind: 'flowModel.fieldSettings',
      ownerLocator,
    });
  });

  it('does not treat broad flowModels:findOne permission as owner visibility', async () => {
    const { service, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [
        {
          uid: 'flow_broad_permission',
          options: {
            uid: 'flow_broad_permission',
            use: 'JSBlockModel',
          },
        },
      ],
      references: [
        createReferenceRecord({
          modelUid: 'flow_broad_permission',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'readReferences') {
        return {};
      }
      if (resource === 'flowModels' && action === 'findOne') {
        return {};
      }
      return false;
    });

    const references = await service.readReferences(
      {
        repoId: 'ler_sales',
      },
      {
        requestId: 'req_read_broad_flow_model_permission',
        can,
      },
    );

    expect(references).toEqual([]);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'readReferences',
        result: 'denied',
        reasonCode: 'owner_not_visible',
      }),
    );
  });

  it('rejects references when flowModels:findOne permission filter does not match the owner', async () => {
    const { service, recordReferenceEvent } = createReferenceServiceFixture({
      flowModels: [
        {
          uid: 'flow_filtered_out',
          options: {
            uid: 'flow_filtered_out',
            use: 'JSBlockModel',
          },
        },
      ],
      references: [
        createReferenceRecord({
          modelUid: 'flow_filtered_out',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'readReferences') {
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

    const references = await service.readReferences(
      {
        repoId: 'ler_sales',
      },
      {
        requestId: 'req_read_filtered_out',
        can,
      },
    );

    expect(references).toEqual([]);
    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'readReferences',
        result: 'denied',
        reasonCode: 'owner_not_visible',
      }),
    );
  });

  it('returns visible references when the owner belongs to an accessible desktop route', async () => {
    const { service } = createReferenceServiceFixture({
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
          id: 'route_sales',
          schemaUid: 'route_schema',
        },
      ],
      roles: [
        {
          name: 'member',
          desktopRoutes: [
            {
              id: 'route_sales',
            },
          ],
        },
      ],
      references: [
        createReferenceRecord({
          modelUid: 'flow_route_visible',
        }),
      ],
    });
    const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
      if (resource === 'lightExtension' && action === 'readReferences') {
        return {};
      }
      return false;
    });

    const references = await service.readReferences(
      {
        repoId: 'ler_sales',
      },
      {
        can,
        state: {
          currentRoles: ['member'],
        },
      },
    );

    expect(references).toHaveLength(1);
    expect(references[0].ownerLocator.modelUid).toBe('flow_route_visible');
  });

  it('uses JS Page route visibility when reading page references', async () => {
    for (const testCase of [
      { role: 'page-hidden', desktopRoutes: [], visible: false },
      { role: 'page-reader', desktopRoutes: [{ id: 'route_js_page' }], visible: true },
    ]) {
      const { service, recordReferenceEvent } = createReferenceServiceFixture({
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
        references: [createJsPageReferenceRecord({ modelUid: 'flow_js_page_visible' })],
      });
      const can = vi.fn(({ resource, action }: { resource: string; action: string }) => {
        if (resource === 'lightExtension' && action === 'readReferences') {
          return {};
        }
        return false;
      });

      const references = await service.readReferences(
        { repoId: 'ler_pages' },
        { can, requestId: `req_js_page_${testCase.role}`, state: { currentRoles: [testCase.role] } },
      );

      expect(references).toHaveLength(testCase.visible ? 1 : 0);
      if (testCase.visible) {
        expect(references[0]).toMatchObject({
          kind: 'js-page',
          ownerKind: 'flowModel.pageSettings',
          ownerLocator: {
            modelUid: 'flow_js_page_visible',
            use: 'JSPageModel',
          },
        });
      } else {
        expect(recordReferenceEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'readReferences',
            result: 'denied',
            requestId: 'req_js_page_page-hidden',
            reasonCode: 'owner_not_visible',
          }),
        );
      }
    }
  });

  it('records denied audit when readReferences permission is missing', async () => {
    const { service, recordReferenceEvent } = createReferenceServiceFixture({
      references: [createReferenceRecord()],
    });
    const can = vi.fn(() => false);

    await expect(
      service.readReferences(
        {
          repoId: 'ler_sales',
        },
        {
          requestId: 'req_read_denied',
          actorUserId: '8',
          can,
        },
      ),
    ).rejects.toMatchObject({
      code: 'LIGHT_EXTENSION_PERMISSION_DENIED',
    });

    expect(recordReferenceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        action: 'readReferences',
        result: 'denied',
        reasonCode: 'permission_denied',
        requestId: 'req_read_denied',
        actorUserId: '8',
      }),
    );
  });
});
