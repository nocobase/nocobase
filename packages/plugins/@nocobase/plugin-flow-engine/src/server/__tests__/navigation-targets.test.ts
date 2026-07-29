/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import { FlowSurfaceError } from '../flow-surfaces/errors';
import {
  DEFAULT_ADMIN_MULTI_PORTAL_UID,
  DEFAULT_MOBILE_MULTI_PORTAL_UID,
  FlowSurfaceNavigationTargetsService,
} from '../flow-surfaces/navigation-targets';

type PortalRecord = {
  uid: string;
  title: string;
  portalType: string;
  portalName: string;
  routePath: string;
  authCheck: boolean;
  enabled: boolean;
  uiLayoutUid: string;
};

type FindOptions = {
  appends?: string[];
  filter?: Record<string, unknown>;
};

type RolePortalGrant = {
  roleName: string;
  multiPortalUid: string;
};

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const FALLBACK_LAYOUT_UID = 'fallback-layout-model';

function createPortal(
  uid: string,
  uiLayoutUid = ADMIN_LAYOUT_UID,
  overrides: Partial<PortalRecord> = {},
): PortalRecord {
  return {
    uid,
    title: uid,
    portalType: 'no-code',
    portalName: uid.replaceAll('_', ''),
    routePath: `/${uid}`,
    authCheck: true,
    enabled: true,
    uiLayoutUid,
    ...overrides,
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

function createDatabase(portals: PortalRecord[], layouts = [createLayout()], rolePortalGrants: RolePortalGrant[] = []) {
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
    rolesMultiPortals: {
      count: vi.fn(async (options: FindOptions = {}) => {
        const roles = Array.isArray(options.filter?.roleName) ? options.filter.roleName : [options.filter?.roleName];
        return rolePortalGrants.filter(
          (grant) => roles.includes(grant.roleName) && grant.multiPortalUid === options.filter?.multiPortalUid,
        ).length;
      }),
    },
  };
  const collections = {
    multiPortals: {},
    rolesMultiPortals: {},
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

async function captureError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(FlowSurfaceError);
    return error as FlowSurfaceError;
  }
  throw new Error('Expected FlowSurfaceError');
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

  it.each(legacyNamedPortalUids)(
    'resolves fixed portal %s through its backing Layout without a mode field',
    async (portalUid) => {
      const service = new FlowSurfaceNavigationTargetsService(createDatabase([createPortal(portalUid)]));

      const resolved = await service.resolvePortal(portalUid, {
        actionName: 'createMenu',
        path: 'portalUid',
        currentRoles: ['root'],
      });

      expect(resolved).toMatchObject({
        uid: portalUid,
        layoutUid: ADMIN_LAYOUT_UID,
      });
      expect(resolved).not.toHaveProperty('routePermissionMode');
    },
  );

  it.each(['default_admin', 'default_mobile', 'admin-layout-model', '__default_admin__-copy'])(
    'treats similar uid %s as a regular Portal',
    async (portalUid) => {
      const service = new FlowSurfaceNavigationTargetsService(createDatabase([createPortal(portalUid)]));

      const resolved = await service.resolvePortal(portalUid, {
        actionName: 'createMenu',
        path: 'portalUid',
        currentRoles: ['root'],
      });

      expect(resolved).toMatchObject({ uid: portalUid, layoutUid: ADMIN_LAYOUT_UID });
      expect(resolved).not.toHaveProperty('routePermissionMode');
    },
  );

  it('rejects implicit resolution when no Portal is enabled without allowing an Admin fallback', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([createPortal('disabled-portal', ADMIN_LAYOUT_UID, { enabled: false })]),
    );

    const error = await captureError(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
    );

    expect(error.toResponseBody()).toEqual({
      errors: [
        expect.objectContaining({
          status: 400,
          code: 'FLOW_SURFACE_BAD_REQUEST',
          path: 'navigation',
          ruleId: 'navigation-portal-not-found',
          details: expect.objectContaining({
            uiBuilderAllowed: false,
            adminLayoutFallbackAllowed: false,
            agentInstruction: expect.stringContaining('create and enable a Portal'),
          }),
        }),
      ],
    });
  });

  it('resolves the only accessible no-code Portal through its backing Layout', async () => {
    const portal = createPortal('only-portal');
    const service = new FlowSurfaceNavigationTargetsService(createDatabase([portal]));

    await expect(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
    ).resolves.toMatchObject({
      uid: portal.uid,
      portalType: 'no-code',
      layoutUid: ADMIN_LAYOUT_UID,
    });
  });

  it('routes the only accessible AI Portal to the existing explicit type guard', async () => {
    const portal = createPortal('ai-portal', ADMIN_LAYOUT_UID, { portalType: 'ai', portalName: 'ai-app' });
    const service = new FlowSurfaceNavigationTargetsService(createDatabase([portal]));

    const error = await captureError(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
    );

    expect(error.toResponseBody()).toEqual({
      errors: [
        expect.objectContaining({
          status: 400,
          code: 'FLOW_SURFACE_BAD_REQUEST',
          path: 'navigation',
          ruleId: 'navigation-portal-type-unsupported',
          message: expect.stringContaining('Portal source code'),
          details: {
            portalUid: portal.uid,
            portalType: 'ai',
            portalName: 'ai-app',
            expectedPortalType: 'no-code',
            uiBuilderAllowed: false,
            adminLayoutFallbackAllowed: false,
            implementationPath: 'ai-portal-source',
            agentInstruction: expect.stringContaining('nb portal info <portalName> -j'),
          },
        }),
      ],
    });
  });

  it('requires selection among multiple no-code Portals in deterministic UID order', async () => {
    const hiddenPortal = createPortal('hidden-ai', ADMIN_LAYOUT_UID, {
      title: 'Hidden AI',
      portalName: 'hidden-ai-app',
      portalType: 'ai',
    });
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase(
        [createPortal('z-portal'), hiddenPortal, createPortal('a-portal')],
        [createLayout()],
        [
          { roleName: 'member', multiPortalUid: 'z-portal' },
          { roleName: 'member', multiPortalUid: 'a-portal' },
        ],
      ),
    );

    const error = await captureError(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['member'] }),
    );

    expect(error.toResponseBody()).toEqual({
      errors: [
        expect.objectContaining({
          status: 400,
          code: 'FLOW_SURFACE_BAD_REQUEST',
          path: 'navigation',
          ruleId: 'navigation-portal-selection-required',
          details: expect.objectContaining({
            candidates: [
              { uid: 'a-portal', portalName: 'a-portal', title: 'a-portal', portalType: 'no-code' },
              { uid: 'z-portal', portalName: 'z-portal', title: 'z-portal', portalType: 'no-code' },
            ],
            uiBuilderAllowed: false,
            adminLayoutFallbackAllowed: false,
            agentInstruction: expect.stringContaining('ask the user to select'),
          }),
        }),
      ],
    });
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/hidden-ai|Hidden AI/);
  });

  it('does not prefer no-code when an accessible AI Portal also exists', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([
        createPortal('no-code-portal'),
        createPortal('ai-portal', ADMIN_LAYOUT_UID, { portalType: 'ai' }),
      ]),
    );

    const error = await captureError(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
    );

    expect(error.options).toMatchObject({
      ruleId: 'navigation-portal-selection-required',
      details: {
        candidates: [
          expect.objectContaining({ uid: 'ai-portal', portalType: 'ai' }),
          expect.objectContaining({ uid: 'no-code-portal', portalType: 'no-code' }),
        ],
      },
    });
  });

  it('returns 403 without candidates when no enabled Portal is accessible', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([
        createPortal('hidden-no-code'),
        createPortal('hidden-ai', ADMIN_LAYOUT_UID, { portalType: 'ai' }),
      ]),
    );

    const error = await captureError(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['member'] }),
    );

    expect(error.toResponseBody()).toEqual({
      errors: [
        expect.objectContaining({
          status: 403,
          ruleId: 'navigation-portal-forbidden',
          path: 'navigation',
        }),
      ],
    });
    expect(error.options).not.toHaveProperty('details');
  });

  it.each([
    ['AI type', { portalType: 'ai', portalName: 'secret-ai' }],
    ['disabled state', { enabled: false, portalName: 'secret-disabled' }],
    ['missing backing Layout', { portalName: 'secret-broken' }],
  ])('checks ACL before exposing an explicit Portal %s', async (_case, overrides) => {
    const portal = createPortal('hidden-portal', 'secret-layout', overrides);
    const service = new FlowSurfaceNavigationTargetsService(createDatabase([portal], []));

    const error = await captureError(
      service.resolvePortal(portal.uid, {
        actionName: 'createMenu',
        path: 'portalUid',
        currentRoles: ['member'],
      }),
    );

    expect(error.toResponseBody()).toEqual({
      errors: [
        expect.objectContaining({
          status: 403,
          ruleId: 'navigation-portal-forbidden',
          details: { portalUid: portal.uid },
        }),
      ],
    });
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/secret-|portalType|enabled|layoutUid/);
  });

  it('keeps fixed Portal ACL exceptions for callers without role grants', async () => {
    for (const portalUid of legacyNamedPortalUids) {
      const service = new FlowSurfaceNavigationTargetsService(createDatabase([createPortal(portalUid)]));
      await expect(
        service.resolvePortal(portalUid, {
          actionName: 'createMenu',
          path: 'portalUid',
          currentRoles: ['member'],
        }),
      ).resolves.toMatchObject({ routeScopeKind: 'layout' });
      await expect(
        service.resolveDefaultPortal({
          actionName: 'createMenu',
          currentRoles: ['member'],
        }),
      ).resolves.toMatchObject({ uid: portalUid, routeScopeKind: 'layout' });
    }
  });

  it('does not count disabled Portals when selecting the only enabled accessible Portal', async () => {
    const enabledPortal = createPortal('enabled-portal');
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([enabledPortal, createPortal('disabled-portal', ADMIN_LAYOUT_UID, { enabled: false })]),
    );

    await expect(
      service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
    ).resolves.toMatchObject({ uid: enabledPortal.uid });
    expect((await service.listNavigationTargets(['root'])).targets.filter((target) => target.default)).toEqual([
      expect.objectContaining({ uid: enabledPortal.uid }),
    ]);
  });

  it.each([
    ['missing', [createLayout(FALLBACK_LAYOUT_UID)], 'navigation-portal-layout-not-found'],
    ['disabled', [createLayout(ADMIN_LAYOUT_UID, false)], 'navigation-portal-layout-disabled'],
  ])(
    'reports the existing backing Layout error when the only no-code Portal Layout is %s',
    async (_case, layouts, ruleId) => {
      const service = new FlowSurfaceNavigationTargetsService(createDatabase([createPortal('broken-portal')], layouts));

      const error = await captureError(
        service.resolveDefaultPortal({ actionName: 'createMenu', currentRoles: ['root'] }),
      );

      expect(error.options.ruleId).toBe(ruleId);
      expect((await service.listNavigationTargets(['root'])).targets.filter((target) => target.default)).toEqual([]);
    },
  );

  it('keeps unknown Portal types on the generic unsupported error path', async () => {
    const portal = createPortal('unknown-portal', ADMIN_LAYOUT_UID, { portalType: 'future' });
    const service = new FlowSurfaceNavigationTargetsService(createDatabase([portal]));

    const error = await captureError(
      service.resolvePortal(portal.uid, {
        actionName: 'createMenu',
        path: 'portalUid',
        currentRoles: ['root'],
      }),
    );

    expect(error.message).toContain('does not support no-code routes');
    expect(error.options).toEqual({
      ruleId: 'navigation-portal-type-unsupported',
      path: 'portalUid',
      details: { portalUid: portal.uid, portalType: 'future' },
    });
    expect(JSON.stringify(error.toResponseBody())).not.toMatch(/ai-portal-source|Portal source code|localPath/);
  });

  it('does not mark a no-code Portal default when another accessible Portal exists', async () => {
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase([
        createPortal('no-code-portal'),
        createPortal('ai-portal', ADMIN_LAYOUT_UID, { portalType: 'ai' }),
      ]),
    );

    const result = await service.listNavigationTargets(['root']);

    expect(result.targets.filter((target) => target.default)).toEqual([]);
    expect(result.targets.filter((target) => target.kind === 'portal').map((target) => target.uid)).toEqual([
      'no-code-portal',
    ]);
  });

  it('marks only the sole accessible valid no-code Portal as default', async () => {
    const accessiblePortal = createPortal('accessible-portal');
    const hiddenPortal = createPortal('hidden-portal');
    const service = new FlowSurfaceNavigationTargetsService(
      createDatabase(
        [accessiblePortal, hiddenPortal],
        [createLayout()],
        [{ roleName: 'member', multiPortalUid: accessiblePortal.uid }],
      ),
    );

    const result = await service.listNavigationTargets(['member']);

    expect(result.targets.filter((target) => target.default)).toEqual([
      expect.objectContaining({ kind: 'portal', uid: accessiblePortal.uid }),
    ]);
  });
});
