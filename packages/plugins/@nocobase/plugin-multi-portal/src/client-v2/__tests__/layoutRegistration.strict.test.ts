/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  registerMultiPortalRecords,
  registerMultiPortalsFromApi,
  type MultiPortalRuntimeRecord,
} from '../layoutRegistration';

const routeScopeMocks = vi.hoisted(() => ({
  installMultiPortalRouteRepositoryScope: vi.fn(),
}));

vi.mock('../routeRepositoryScope', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../routeRepositoryScope')>();
  return {
    ...actual,
    installMultiPortalRouteRepositoryScope: routeScopeMocks.installMultiPortalRouteRepositoryScope,
  };
});

const portal = {
  uid: 'customer-portal',
  title: 'Customer',
  portalType: 'no-code',
  portalName: 'customer',
  routePath: '/customer',
  authCheck: true,
  enabled: true,
  routePermissionMode: 'portal',
  uiLayout: {
    layoutType: 'desktop',
  },
} satisfies MultiPortalRuntimeRecord;

function createLayoutManager() {
  return {
    hasLayout: vi.fn(() => false),
    listLayouts: vi.fn((): Array<{ routeName: string; uid: string }> => []),
    registerLayout: vi.fn(),
  };
}

describe('Multi Portal runtime registration failures', () => {
  beforeEach(() => {
    routeScopeMocks.installMultiPortalRouteRepositoryScope.mockClear();
  });

  it('propagates a missing or failed listEnabled endpoint', async () => {
    const error = new Error('endpoint missing');
    await expect(
      registerMultiPortalsFromApi({
        apiClient: {
          request: vi.fn().mockRejectedValue(error),
        },
        layoutManager: createLayoutManager(),
      }),
    ).rejects.toBe(error);
  });

  it('rejects invalid mode, unknown layout type, duplicate uid, and duplicate route name before registration', () => {
    expect(() =>
      registerMultiPortalRecords(createLayoutManager(), [
        {
          ...portal,
          routePermissionMode: 'invalid' as never,
        },
      ]),
    ).toThrow("Portal 'customer-portal' has an invalid route permission mode.");
    expect(() =>
      registerMultiPortalRecords(createLayoutManager(), [
        {
          ...portal,
          uiLayout: {
            layoutType: 'unknown',
          },
        },
      ]),
    ).toThrow("Portal 'customer-portal' uses an unknown UI layout type 'unknown'.");
    expect(() =>
      registerMultiPortalRecords(createLayoutManager(), [portal, { ...portal, portalName: 'customer-copy' }]),
    ).toThrow("Duplicate portal uid 'customer-portal'.");
    expect(() =>
      registerMultiPortalRecords(createLayoutManager(), [portal, { ...portal, uid: 'customer-copy' }]),
    ).toThrow("Duplicate portal route name 'customer'.");

    const layoutManager = createLayoutManager();
    layoutManager.listLayouts.mockReturnValue([{ routeName: 'existing', uid: portal.uid }]);
    expect(() => registerMultiPortalRecords(layoutManager, [portal])).toThrow(
      "Duplicate portal uid 'customer-portal'.",
    );
    expect(layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('registers only no-code portals and skips every other portal type', () => {
    const layoutManager = createLayoutManager();
    const skippedPortals = [
      { ...portal, uid: 'ai-portal', portalName: 'ai', portalType: 'ai' },
      { ...portal, uid: 'missing-type-portal', portalName: 'missingType', portalType: undefined },
      { ...portal, uid: 'empty-type-portal', portalName: 'emptyType', portalType: '' },
      { ...portal, uid: 'unknown-type-portal', portalName: 'unknownType', portalType: 'custom' },
    ];

    expect(registerMultiPortalRecords(layoutManager, skippedPortals)).toEqual([]);
    expect(layoutManager.registerLayout).not.toHaveBeenCalled();
  });

  it('keeps backing Layout identity out of the Client Portal scope descriptor', async () => {
    const layoutPortal = {
      ...portal,
      uid: 'upgraded-desktop-portal',
      portalName: 'admin',
      routePath: '/admin',
      routePermissionMode: 'layout',
    } satisfies MultiPortalRuntimeRecord;

    await registerMultiPortalsFromApi({
      apiClient: {
        request: vi.fn().mockResolvedValue({ data: { data: [layoutPortal] } }),
      },
      context: {
        routeRepository: {},
      },
      layoutManager: createLayoutManager(),
    });

    const getScopes = routeScopeMocks.installMultiPortalRouteRepositoryScope.mock.calls[0]?.[1] as
      | (() => unknown)
      | undefined;
    expect(getScopes?.()).toEqual([
      {
        cacheKey: 'portal:upgraded-desktop-portal',
        portalUid: 'upgraded-desktop-portal',
        routePermissionMode: 'layout',
      },
    ]);
  });
});
