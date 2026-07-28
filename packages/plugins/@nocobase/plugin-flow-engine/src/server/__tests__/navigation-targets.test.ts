/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import {
  DEFAULT_ADMIN_MULTI_PORTAL_UID,
  DEFAULT_MOBILE_MULTI_PORTAL_UID,
  FlowSurfaceNavigationTargetsService,
} from '../flow-surfaces/navigation-targets';

type PortalRecord = {
  uid: string;
  title: string;
  portalType: 'no-code';
  portalName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
  routePermissionMode: string;
  uiLayoutUid: string;
};

type FindOptions = {
  appends?: string[];
  filter?: Record<string, unknown>;
};

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const FALLBACK_LAYOUT_UID = 'fallback-layout-model';

function createPortal(uid: string, routePermissionMode = 'portal', uiLayoutUid = ADMIN_LAYOUT_UID): PortalRecord {
  return {
    uid,
    title: uid,
    portalType: 'no-code',
    portalName: uid.replaceAll('_', ''),
    routePath: `/${uid}`,
    authCheck: true,
    enabled: true,
    routePermissionMode,
    uiLayoutUid,
  };
}

function filterPortalRecords(portals: PortalRecord[], filter: Record<string, unknown> = {}) {
  const excludedUids = Array.isArray(filter['uid.$notIn']) ? filter['uid.$notIn'] : [];
  return portals.filter(
    (portal) =>
      (typeof filter.enabled === 'undefined' || portal.enabled === filter.enabled) &&
      !excludedUids.includes(portal.uid),
  );
}

function createLayout(uid = ADMIN_LAYOUT_UID, enabled = true, layoutType = 'desktop') {
  return {
    uid,
    title: uid,
    layoutType,
    routeName: uid,
    routePath: `/${uid}`,
    authCheck: true,
    enabled,
  };
}

function createDatabase(portals: PortalRecord[], layouts = [createLayout()]) {
  const repositories = {
    multiPortals: {
      find: vi.fn(async (options: FindOptions = {}) => {
        const records = filterPortalRecords(portals, options.filter);
        if (!options.appends?.includes('uiLayout')) {
          return records;
        }
        return records.map((portal) => ({
          ...portal,
          uiLayout: layouts.find((layout) => layout.uid === portal.uiLayoutUid),
        }));
      }),
      findOne: vi.fn(async (options: FindOptions = {}) => {
        const uid = options.filter?.uid;
        return portals.find((portal) => portal.uid === uid);
      }),
    },
    uiLayouts: {
      find: vi.fn(async (options: FindOptions = {}) =>
        layouts.filter(
          (layout) => typeof options.filter?.enabled === 'undefined' || layout.enabled === options.filter.enabled,
        ),
      ),
      findOne: vi.fn(async (options: FindOptions = {}) => {
        const uid = options.filter?.uid;
        const enabled = options.filter?.enabled;
        return layouts.find(
          (layout) => layout.uid === uid && (typeof enabled === 'undefined' || enabled === layout.enabled),
        );
      }),
    },
  };
  const collections = {
    multiPortals: {},
    uiLayouts: {},
    desktopRoutes: {
      getField: (name: string) => (name === 'multiPortals' || name === 'uiLayouts' ? {} : undefined),
    },
  };

  return {
    getCollection: vi.fn((name: keyof typeof collections) => collections[name]),
    getRepository: vi.fn((name: keyof typeof repositories) => repositories[name]),
  } as unknown as Database;
}

describe('FlowSurfaceNavigationTargetsService portal identity', () => {
  const legacyNamedPortalUids = [DEFAULT_ADMIN_MULTI_PORTAL_UID, DEFAULT_MOBILE_MULTI_PORTAL_UID];

  it('lists persisted portals even when their UIDs look like legacy virtual defaults', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase(legacyNamedPortalUids.map((uid) => createPortal(uid))),
    );

    const targets = await service.listNavigationTargets(['root']);

    expect(targets.targets.filter((target) => target.kind === 'portal').map((target) => target.uid)).toEqual(
      legacyNamedPortalUids,
    );
  });

  it.each(legacyNamedPortalUids)('resolves persisted portal %s by its stored mode', async (portalUid) => {
    const service = new FlowSurfaceNavigationTargetsService(createDatabase([createPortal(portalUid, 'layout')]));

    await expect(
      service.resolvePortal(portalUid, {
        actionName: 'createMenu',
        path: 'portalUid',
        currentRoles: ['root'],
      }),
    ).resolves.toMatchObject({
      uid: portalUid,
      routePermissionMode: 'layout',
    });
  });

  it('rejects an invalid mode instead of hiding its portal from navigation targets', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([createPortal('invalid-mode-portal', 'invalid')]),
    );

    await expect(service.listNavigationTargets(['root'])).rejects.toMatchObject({
      status: 400,
      options: expect.objectContaining({ ruleId: 'navigation-portal-permission-mode-invalid' }),
    });
  });

  it('rejects an invalid mode while resolving the default portal', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([createPortal('invalid-mode-portal', 'invalid')]),
    );

    await expect(
      service.resolveDefaultPortal({
        actionName: 'createMenu',
        currentRoles: ['root'],
      }),
    ).rejects.toMatchObject({
      status: 400,
      options: expect.objectContaining({ ruleId: 'navigation-portal-permission-mode-invalid' }),
    });
  });

  it.each([
    ['missing', [createLayout(FALLBACK_LAYOUT_UID)]],
    ['disabled', [createLayout(ADMIN_LAYOUT_UID, false), createLayout(FALLBACK_LAYOUT_UID)]],
  ])('skips a higher-priority portal whose backing layout is %s', async (_case, layouts) => {
    const fallbackPortalUid = 'fallback-portal';
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase(
        [createPortal(ADMIN_LAYOUT_UID, 'layout'), createPortal(fallbackPortalUid, 'layout', FALLBACK_LAYOUT_UID)],
        layouts,
      ),
    );

    await expect(
      service.resolveDefaultPortal({
        actionName: 'createMenu',
        currentRoles: ['root'],
      }),
    ).resolves.toMatchObject({
      uid: fallbackPortalUid,
      layoutUid: FALLBACK_LAYOUT_UID,
    });
  });

  it('prefers a custom Desktop portal over a lexically earlier custom Mobile portal', async () => {
    const mobileLayoutUid = 'custom-mobile-layout';
    const desktopLayoutUid = 'custom-desktop-layout';
    const mobilePortal = createPortal('a-mobile-portal', 'portal', mobileLayoutUid);
    const desktopPortal = createPortal('z-desktop-portal', 'portal', desktopLayoutUid);
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase(
        [mobilePortal, desktopPortal],
        [createLayout(mobileLayoutUid, true, 'mobile'), createLayout(desktopLayoutUid, true, 'desktop')],
      ),
    );

    await expect(
      service.resolveDefaultPortal({
        actionName: 'createMenu',
        currentRoles: ['root'],
      }),
    ).resolves.toMatchObject({
      uid: desktopPortal.uid,
      layoutUid: desktopLayoutUid,
      layoutType: 'desktop',
    });
  });
});
