/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Model } from '@nocobase/database';
import type { MockServer } from '@nocobase/test';
import {
  FlowSurfaceNavigationTargetsService,
  type FlowSurfaceNavigationTarget,
} from '../flow-surfaces/navigation-targets';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { getData } from './flow-surfaces.contract.helpers';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const MOBILE_LAYOUT_UID = 'mobile-layout-model';
const ADMIN_LAYOUT_PORTAL_UID = '__default_admin__';
const MOBILE_LAYOUT_PORTAL_UID = '__default_mobile__';
const DESKTOP_PORTAL_UID = 'flow-surfaces-desktop-portal';
const SECOND_DESKTOP_PORTAL_UID = 'flow-surfaces-second-desktop-portal';
const MOBILE_PORTAL_UID = 'flow-surfaces-mobile-portal';
const DISABLED_PORTAL_UID = 'flow-surfaces-disabled-portal';
const AI_PORTAL_UID = 'flow-surfaces-ai-portal';
const PORTAL_ROLE_NAME = 'flow-surfaces-portal-author';

function registerMultiPortalFixture(app: MockServer) {
  app.db.collection({
    name: 'multiPortals',
    autoGenId: false,
    timestamps: false,
    filterTargetKey: 'uid',
    fields: [
      { name: 'uid', type: 'string', primaryKey: true, allowNull: false },
      { name: 'title', type: 'string', allowNull: false },
      { name: 'icon', type: 'string' },
      { name: 'portalType', type: 'string', allowNull: false },
      { name: 'portalName', field: 'routeName', type: 'string', unique: true, allowNull: false },
      { name: 'routePath', type: 'string', allowNull: false },
      { name: 'authCheck', type: 'boolean', defaultValue: true, allowNull: false },
      { name: 'enabled', type: 'boolean', defaultValue: true, allowNull: false },
      { name: 'uiLayoutUid', type: 'string', allowNull: false },
    ],
  });
  app.db.extendCollection({
    name: 'desktopRoutes',
    fields: [
      {
        type: 'belongsToMany',
        name: 'multiPortals',
        target: 'multiPortals',
        through: 'desktopRoutesMultiPortals',
        sourceKey: 'id',
        targetKey: 'uid',
        foreignKey: 'desktopRouteId',
        otherKey: 'multiPortalUid',
        onDelete: 'CASCADE',
      },
    ],
  });
  app.db.collection({
    name: 'rolesMultiPortals',
    autoGenId: false,
    indexes: [{ unique: true, fields: ['roleName', 'multiPortalUid'] }],
    fields: [
      { name: 'id', type: 'snowflakeId', primaryKey: true, allowNull: false },
      {
        type: 'belongsTo',
        name: 'role',
        target: 'roles',
        targetKey: 'name',
        foreignKey: 'roleName',
        onDelete: 'CASCADE',
      },
      {
        type: 'belongsTo',
        name: 'multiPortal',
        target: 'multiPortals',
        targetKey: 'uid',
        foreignKey: 'multiPortalUid',
        onDelete: 'CASCADE',
      },
    ],
  });
  app.db.collection({
    name: 'rolesMultiPortalRoutePolicies',
    autoGenId: false,
    indexes: [{ unique: true, fields: ['roleName', 'multiPortalUid'] }],
    fields: [
      { name: 'id', type: 'snowflakeId', primaryKey: true, allowNull: false },
      {
        type: 'belongsTo',
        name: 'role',
        target: 'roles',
        targetKey: 'name',
        foreignKey: 'roleName',
        onDelete: 'CASCADE',
      },
      {
        type: 'belongsTo',
        name: 'multiPortal',
        target: 'multiPortals',
        targetKey: 'uid',
        foreignKey: 'multiPortalUid',
        onDelete: 'CASCADE',
      },
      { name: 'allowNewMenu', type: 'boolean', defaultValue: false },
    ],
  });
  app.db.collection({
    name: 'rolesMultiPortalDesktopRoutes',
    autoGenId: false,
    indexes: [{ unique: true, fields: ['roleName', 'multiPortalUid', 'desktopRouteId'] }],
    fields: [
      { name: 'id', type: 'snowflakeId', primaryKey: true, allowNull: false },
      {
        type: 'belongsTo',
        name: 'role',
        target: 'roles',
        targetKey: 'name',
        foreignKey: 'roleName',
        onDelete: 'CASCADE',
      },
      {
        type: 'belongsTo',
        name: 'multiPortal',
        target: 'multiPortals',
        targetKey: 'uid',
        foreignKey: 'multiPortalUid',
        onDelete: 'CASCADE',
      },
      {
        type: 'belongsTo',
        name: 'desktopRoute',
        target: 'desktopRoutes',
        targetKey: 'id',
        foreignKey: 'desktopRouteId',
        onDelete: 'CASCADE',
      },
    ],
  });
}

async function createPortal(app: MockServer, values: Record<string, unknown>) {
  return app.db.getRepository('multiPortals').create({ values });
}

async function readRouteScope(app: MockServer, routeId: string | number) {
  const route = await app.db.getRepository('desktopRoutes').findOne({
    filterByTk: routeId,
    appends: ['uiLayouts', 'multiPortals', 'children'],
  });
  return {
    route,
    layoutUids: (route?.get('uiLayouts') || []).map((layout: any) => layout.get('uid')).sort(),
    portalUids: (route?.get('multiPortals') || []).map((portal: any) => portal.get('uid')).sort(),
  };
}

function buildMarkdownBlueprint(portalUid: string, groupTitle: string, pageTitle: string, tabs = 1) {
  return {
    version: '1',
    mode: 'create',
    navigation: {
      portalUid,
      group: {
        title: groupTitle,
        icon: 'AppstoreOutlined',
      },
      item: {
        title: pageTitle,
        icon: 'FileOutlined',
      },
    },
    page: {
      title: pageTitle,
    },
    tabs: Array.from({ length: tabs }, (_, index) => ({
      title: index === 0 ? 'Overview' : `Tab ${index + 1}`,
      blocks: [
        {
          type: 'markdown',
          settings: {
            content: `${pageTitle} content ${index + 1}`,
          },
        },
      ],
    })),
  };
}

describe('flowSurfaces scalar Multi-portal layout identity', () => {
  it('derives Portal targets and resolution from uiLayoutUid without requiring enabled UI Layout records', async () => {
    const portals = [
      {
        uid: DESKTOP_PORTAL_UID,
        title: 'Scalar desktop workspace',
        icon: 'DashboardOutlined',
        portalType: 'no-code',
        portalName: 'scalarDesktopWorkspace',
        routePath: '/scalar-desktop-workspace',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_LAYOUT_UID,
      },
      {
        uid: MOBILE_PORTAL_UID,
        title: 'Scalar mobile workspace',
        icon: 'MobileOutlined',
        portalType: 'no-code',
        portalName: 'scalarMobileWorkspace',
        routePath: '/scalar-mobile-workspace',
        authCheck: true,
        enabled: true,
        uiLayoutUid: MOBILE_LAYOUT_UID,
      },
    ];
    const ordinaryLayoutUid = 'flow-surfaces-ordinary-layout';
    const ordinaryLayout = {
      uid: ordinaryLayoutUid,
      title: 'Ordinary layout',
      layoutType: 'desktop',
      routeName: 'flowSurfacesOrdinaryLayout',
      routePath: '/flow-surfaces-ordinary-layout',
      authCheck: true,
      enabled: true,
    };
    const disabledAdminLayout = {
      uid: ADMIN_LAYOUT_UID,
      title: 'Disabled Admin layout',
      layoutType: 'desktop',
      routeName: 'admin',
      routePath: '/admin',
      authCheck: true,
      enabled: false,
    };
    const multiPortalsRepository = {
      find: vi.fn(async () => portals),
      findOne: vi.fn(async (options: { filter?: Record<string, unknown> }) => {
        return portals.find((portal) => portal.uid === options.filter?.uid) || null;
      }),
    };
    const uiLayoutsRepository = {
      find: vi.fn(async () => [ordinaryLayout]),
      findOne: vi.fn(async (options: { filter?: Record<string, unknown> }) => {
        if (options.filter?.uid !== ADMIN_LAYOUT_UID) {
          return null;
        }
        return Object.prototype.hasOwnProperty.call(options.filter, 'enabled') ? null : disabledAdminLayout;
      }),
    };
    const db = {
      getCollection(name: string) {
        if (name === 'desktopRoutes') {
          return {
            getField: (field: string) => (field === 'multiPortals' || field === 'uiLayouts' ? {} : undefined),
          };
        }
        return name === 'multiPortals' || name === 'uiLayouts' ? {} : undefined;
      },
      getRepository(name: string) {
        if (name === 'multiPortals') {
          return multiPortalsRepository;
        }
        if (name === 'uiLayouts') {
          return uiLayoutsRepository;
        }
        throw new Error(`Unexpected repository ${name}`);
      },
    };

    const navigationTargets = new FlowSurfaceNavigationTargetsService(db as never);
    const targets = await navigationTargets.listNavigationTargets(['root']);
    const [desktopResolution, mobileResolution] = await Promise.allSettled([
      navigationTargets.resolvePortal(DESKTOP_PORTAL_UID, {
        actionName: 'testScalarPortalResolution',
        path: 'values.portalUid',
        currentRoles: ['root'],
      }),
      navigationTargets.resolvePortal(MOBILE_PORTAL_UID, {
        actionName: 'testScalarPortalResolution',
        path: 'values.portalUid',
        currentRoles: ['root'],
      }),
    ]);

    // Ordinary UI Layout targets remain driven by enabled uiLayouts records.
    expect
      .soft(targets.targets)
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ kind: 'layout', uid: ordinaryLayoutUid, layoutType: 'desktop' }),
          expect.objectContaining({ kind: 'layout', uid: ADMIN_LAYOUT_UID, layoutType: 'desktop' }),
        ]),
      );
    expect
      .soft(targets.targets.some((target) => target.kind === 'layout' && target.uid === MOBILE_LAYOUT_UID))
      .toBe(false);

    // Portal targets derive their device type from the scalar uid even when the corresponding UI Layout is unavailable.
    expect.soft(targets.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'portal',
          uid: DESKTOP_PORTAL_UID,
          layoutUid: ADMIN_LAYOUT_UID,
          layoutType: 'desktop',
        }),
        expect.objectContaining({
          kind: 'portal',
          uid: MOBILE_PORTAL_UID,
          layoutUid: MOBILE_LAYOUT_UID,
          layoutType: 'mobile',
        }),
      ]),
    );
    expect.soft(desktopResolution).toEqual({
      status: 'fulfilled',
      value: expect.objectContaining({
        uid: DESKTOP_PORTAL_UID,
        layoutUid: ADMIN_LAYOUT_UID,
        layoutType: 'desktop',
        routeScopeKind: 'portal',
      }),
    });
    expect.soft(mobileResolution).toEqual({
      status: 'fulfilled',
      value: expect.objectContaining({
        uid: MOBILE_PORTAL_UID,
        layoutUid: MOBILE_LAYOUT_UID,
        layoutType: 'mobile',
        routeScopeKind: 'portal',
      }),
    });
  });
});

describe('flowSurfaces Multi-portal integration', () => {
  let app: MockServer;
  let rootAgent: any;
  let service: FlowSurfacesService;

  beforeAll(async () => {
    app = await createFlowSurfacesMockServer({
      plugins: [...FLOW_SURFACES_TEST_PLUGIN_INSTALLS, 'ui-layout'] as any,
      enabledPluginAliases: [...FLOW_SURFACES_TEST_PLUGINS, 'ui-layout'],
      beforeInstall: async (mockApp) => registerMultiPortalFixture(mockApp),
    });
    rootAgent = await loginFlowSurfacesRootAgent(app);
    service = new FlowSurfacesService(app.pm.get('flow-engine') as any);

    await createPortal(app, {
      uid: ADMIN_LAYOUT_PORTAL_UID,
      title: 'Desktop layout portal',
      icon: 'DesktopOutlined',
      portalType: 'no-code',
      portalName: 'admin',
      routePath: '/admin',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: DESKTOP_PORTAL_UID,
      title: 'Operations workspace',
      icon: 'DashboardOutlined',
      portalType: 'no-code',
      portalName: 'flowSurfacesOperations',
      routePath: '/flow-surfaces-operations',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: MOBILE_LAYOUT_PORTAL_UID,
      title: 'Mobile layout portal',
      icon: 'MobileOutlined',
      portalType: 'no-code',
      portalName: 'mobile',
      routePath: '/mobile',
      authCheck: true,
      enabled: true,
      uiLayoutUid: MOBILE_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: SECOND_DESKTOP_PORTAL_UID,
      title: 'Secondary workspace',
      icon: 'ProjectOutlined',
      portalType: 'no-code',
      portalName: 'flowSurfacesSecondary',
      routePath: '/flow-surfaces-secondary',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: MOBILE_PORTAL_UID,
      title: 'Mobile workspace',
      icon: 'MobileOutlined',
      portalType: 'no-code',
      portalName: 'flowSurfacesMobile',
      routePath: '/flow-surfaces-mobile',
      authCheck: true,
      enabled: true,
      uiLayoutUid: MOBILE_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: DISABLED_PORTAL_UID,
      title: 'Disabled workspace',
      portalType: 'no-code',
      portalName: 'flowSurfacesDisabled',
      routePath: '/flow-surfaces-disabled',
      authCheck: true,
      enabled: false,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: AI_PORTAL_UID,
      title: 'AI workspace',
      icon: 'RobotOutlined',
      portalType: 'ai',
      portalName: 'flowSurfacesAi',
      routePath: '/flow-surfaces-ai',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await app.db.getRepository('roles').create({
      values: {
        name: PORTAL_ROLE_NAME,
        title: 'Flow surfaces portal author',
        allowNewMenu: true,
      },
    });
    for (const portalUid of [DESKTOP_PORTAL_UID, MOBILE_PORTAL_UID]) {
      await app.db.getRepository('rolesMultiPortals').create({
        values: {
          roleName: PORTAL_ROLE_NAME,
          multiPortalUid: portalUid,
        },
      });
      await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
        values: {
          roleName: PORTAL_ROLE_NAME,
          multiPortalUid: portalUid,
          allowNewMenu: true,
        },
      });
    }
  }, 120000);

  afterAll(async () => {
    await app?.destroy();
  });

  it('should discover enabled layouts and only role-accessible custom portals', async () => {
    const targets = await service.listNavigationTargets(
      {},
      {
        currentRoles: [PORTAL_ROLE_NAME],
      },
    );

    expect(targets.capabilities).toEqual({ multiPortal: true });
    expect(targets.targets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'layout', uid: ADMIN_LAYOUT_UID }),
        expect.objectContaining({ kind: 'layout', uid: MOBILE_LAYOUT_UID, layoutType: 'mobile' }),
        expect.objectContaining({
          kind: 'portal',
          uid: ADMIN_LAYOUT_PORTAL_UID,
          portalUid: ADMIN_LAYOUT_PORTAL_UID,
          layoutUid: ADMIN_LAYOUT_UID,
        }),
        expect.objectContaining({
          kind: 'portal',
          uid: DESKTOP_PORTAL_UID,
          portalUid: DESKTOP_PORTAL_UID,
          layoutUid: ADMIN_LAYOUT_UID,
        }),
        expect.objectContaining({
          kind: 'portal',
          uid: MOBILE_PORTAL_UID,
          portalUid: MOBILE_PORTAL_UID,
          layoutType: 'mobile',
        }),
        expect.objectContaining({
          kind: 'portal',
          uid: MOBILE_LAYOUT_PORTAL_UID,
          portalUid: MOBILE_LAYOUT_PORTAL_UID,
          layoutType: 'mobile',
        }),
      ]),
    );
    expect(
      targets.targets.find(
        (target: FlowSurfaceNavigationTarget) => target.kind === 'layout' && target.uid === ADMIN_LAYOUT_UID,
      )?.default,
    ).toBe(undefined);
    expect(targets.targets.some((target: any) => target.uid === SECOND_DESKTOP_PORTAL_UID)).toBe(false);
    expect(targets.targets.some((target: any) => target.uid === DISABLED_PORTAL_UID)).toBe(false);
    expect(targets.targets.some((target: FlowSurfaceNavigationTarget) => target.uid === AI_PORTAL_UID)).toBe(false);
    expect(targets.targets.some((target: FlowSurfaceNavigationTarget) => target.default)).toBe(false);
  });

  it('should create fixed Admin Portal routes through the backing layout permission model', async () => {
    const groupTitle = `Layout-mode portal group ${Date.now()}`;
    const pageTitle = `Layout-mode portal page ${Date.now()}`;
    const created = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(ADMIN_LAYOUT_PORTAL_UID, groupTitle, pageTitle, 2),
      }),
    );
    const groupRoute = await app.db.getRepository('desktopRoutes').findOne({
      filter: { type: 'group', title: groupTitle },
    });
    const groupRouteId = groupRoute?.get('id');
    const pageScope = await readRouteScope(app, created.surface.pageRoute.id);
    const groupScope = await readRouteScope(app, groupRouteId);
    const tabRoutes = pageScope.route?.get('children') || [];
    const routeIds = [groupRouteId, created.surface.pageRoute.id, ...tabRoutes.map((tab: Model) => tab.get('id'))];

    expect(groupScope.layoutUids).toEqual([ADMIN_LAYOUT_UID]);
    expect(groupScope.portalUids).toEqual([]);
    expect(pageScope.layoutUids).toEqual([ADMIN_LAYOUT_UID]);
    expect(pageScope.portalUids).toEqual([]);
    expect(tabRoutes).toHaveLength(2);
    for (const tabRoute of tabRoutes) {
      const tabScope = await readRouteScope(app, tabRoute.get('id'));
      expect(tabScope.layoutUids).toEqual([ADMIN_LAYOUT_UID]);
      expect(tabScope.portalUids).toEqual([]);
    }

    const standardPermissions = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName: PORTAL_ROLE_NAME,
        desktopRouteId: routeIds,
      },
    });
    expect(standardPermissions).toHaveLength(routeIds.length);
    const portalPermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        multiPortalUid: ADMIN_LAYOUT_PORTAL_UID,
        desktopRouteId: routeIds,
      },
    });
    expect(portalPermissions).toHaveLength(0);

    const roleCreated = await service.transaction((transaction) =>
      service.createMenu(
        {
          type: 'group',
          title: `Layout-mode role group ${Date.now()}`,
          icon: 'AppstoreOutlined',
          portalUid: ADMIN_LAYOUT_PORTAL_UID,
        },
        {
          transaction,
          currentRoles: [PORTAL_ROLE_NAME],
        },
      ),
    );
    expect((await readRouteScope(app, roleCreated.routeId)).layoutUids).toEqual([ADMIN_LAYOUT_UID]);
    expect((await readRouteScope(app, roleCreated.routeId)).portalUids).toEqual([]);

    const updated = getData(
      await rootAgent.resource('flowSurfaces').updateMenu({
        values: {
          menuRouteId: groupRouteId,
          title: `${groupTitle} updated`,
        },
      }),
    );
    expect(updated.routeId).toBe(groupRouteId);

    const replaced = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: {
          ...buildMarkdownBlueprint(ADMIN_LAYOUT_PORTAL_UID, groupTitle, pageTitle),
          mode: 'replace',
          target: { pageSchemaUid: created.target.pageSchemaUid },
          navigation: undefined,
        },
      }),
    );
    expect(replaced.target.pageSchemaUid).toBe(created.target.pageSchemaUid);

    const portalOnlyParent = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'group',
          title: `Portal-only parent ${Date.now()}`,
          icon: 'AppstoreOutlined',
          portalUid: DESKTOP_PORTAL_UID,
        },
      }),
    );
    const mismatch = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'item',
        title: `Layout-mode mismatch ${Date.now()}`,
        icon: 'FileOutlined',
        parentMenuRouteId: portalOnlyParent.routeId,
        portalUid: ADMIN_LAYOUT_PORTAL_UID,
      },
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body?.errors?.[0]?.ruleId).toBe('navigation-route-layout-mismatch');
  });

  it('should require explicit selection when multiple Portal types are enabled', async () => {
    const blueprint = buildMarkdownBlueprint(
      ADMIN_LAYOUT_PORTAL_UID,
      `Ambiguous portal group ${Date.now()}`,
      `Ambiguous portal page ${Date.now()}`,
    );
    delete (blueprint.navigation as { portalUid?: string }).portalUid;
    const response = await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint });

    expect(response.status).toBe(400);
    expect(response.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-portal-selection-required',
      details: {
        uiBuilderAllowed: false,
        adminLayoutFallbackAllowed: false,
      },
    });
    expect(
      await app.db.getRepository('desktopRoutes').find({
        filter: { title: blueprint.page.title },
      }),
    ).toHaveLength(0);
  });

  it('should automatically use and discover the only enabled fixed Admin Portal', async () => {
    const portals = await app.db.getRepository('multiPortals').find({ fields: ['uid', 'enabled'] });
    for (const portal of portals) {
      await app.db.getRepository('multiPortals').update({
        filterByTk: portal.get('uid'),
        values: { enabled: portal.get('uid') === ADMIN_LAYOUT_PORTAL_UID },
      });
    }

    try {
      const blueprint = buildMarkdownBlueprint(
        ADMIN_LAYOUT_PORTAL_UID,
        `Implicit Admin portal group ${Date.now()}`,
        `Implicit Admin portal page ${Date.now()}`,
      );
      delete (blueprint.navigation as { portalUid?: string }).portalUid;
      const created = getData(
        await rootAgent.resource('flowSurfaces').applyBlueprint({
          values: blueprint,
        }),
      );

      const pageScope = await readRouteScope(app, created.surface.pageRoute.id);
      expect(pageScope.portalUids).toEqual([]);
      expect(pageScope.layoutUids).toEqual([ADMIN_LAYOUT_UID]);
      const targets = getData(await rootAgent.resource('flowSurfaces').listNavigationTargets({ values: {} }));
      expect(targets.targets.filter((target: FlowSurfaceNavigationTarget) => target.default)).toEqual([
        expect.objectContaining({ kind: 'portal', uid: ADMIN_LAYOUT_PORTAL_UID }),
      ]);
    } finally {
      for (const portal of portals) {
        await app.db.getRepository('multiPortals').update({
          filterByTk: portal.get('uid'),
          values: { enabled: portal.get('enabled') },
        });
      }
    }
  });

  it('should reject direct Admin layout create paths before writing navigation', async () => {
    const blueprintPageTitle = `Direct Admin blueprint ${Date.now()}`;
    const blueprint = buildMarkdownBlueprint(
      ADMIN_LAYOUT_PORTAL_UID,
      `Direct Admin blueprint group ${Date.now()}`,
      blueprintPageTitle,
    );
    delete (blueprint.navigation as { portalUid?: string }).portalUid;
    (blueprint.navigation as { layoutUid?: string }).layoutUid = ADMIN_LAYOUT_UID;
    const blueprintResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint });
    expect(blueprintResponse.status).toBe(400);
    expect(blueprintResponse.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.navigation.layoutUid',
      details: { adminLayoutFallbackAllowed: false },
    });

    const menuTitle = `Direct Admin menu ${Date.now()}`;
    const menuResponse = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: menuTitle,
        icon: 'AppstoreOutlined',
        layoutUid: ADMIN_LAYOUT_UID,
      },
    });
    expect(menuResponse.status).toBe(400);
    expect(menuResponse.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.layoutUid',
      details: { adminLayoutFallbackAllowed: false },
    });

    const pageTitle = `Direct Admin page ${Date.now()}`;
    const pageResponse = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        title: pageTitle,
        icon: 'FileOutlined',
        tabTitle: 'Overview',
        layoutUid: ADMIN_LAYOUT_UID,
      },
    });
    expect(pageResponse.status).toBe(400);
    expect(pageResponse.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.layoutUid',
      details: { adminLayoutFallbackAllowed: false },
    });

    for (const title of [blueprintPageTitle, menuTitle, pageTitle]) {
      expect(await app.db.getRepository('desktopRoutes').find({ filter: { title } })).toHaveLength(0);
    }
  });

  it('should reject inherited Admin layout creation unless the fixed Portal is explicit', async () => {
    const group = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'group',
          title: `Inherited Admin group ${Date.now()}`,
          icon: 'AppstoreOutlined',
          portalUid: ADMIN_LAYOUT_PORTAL_UID,
        },
      }),
    );

    const rejectedChildTitle = `Rejected Admin child ${Date.now()}`;
    const rejectedChild = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'item',
        title: rejectedChildTitle,
        icon: 'FileOutlined',
        parentMenuRouteId: group.routeId,
      },
    });
    expect(rejectedChild.status).toBe(400);
    expect(rejectedChild.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.parentMenuRouteId',
    });
    expect(await app.db.getRepository('desktopRoutes').find({ filter: { title: rejectedChildTitle } })).toHaveLength(0);

    const explicitChild = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'item',
          title: `Explicit Admin child ${Date.now()}`,
          icon: 'FileOutlined',
          parentMenuRouteId: group.routeId,
          portalUid: ADMIN_LAYOUT_PORTAL_UID,
        },
      }),
    );
    expect(await readRouteScope(app, explicitChild.routeId)).toMatchObject({
      portalUids: [],
      layoutUids: [ADMIN_LAYOUT_UID],
    });

    const rejectedPage = await rootAgent.resource('flowSurfaces').createPage({
      values: {
        menuRouteId: explicitChild.routeId,
        title: 'Rejected inherited Admin page',
        tabTitle: 'Overview',
      },
    });
    expect(rejectedPage.status).toBe(400);
    expect(rejectedPage.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.menuRouteId',
    });

    const explicitPage = getData(
      await rootAgent.resource('flowSurfaces').createPage({
        values: {
          menuRouteId: explicitChild.routeId,
          portalUid: ADMIN_LAYOUT_PORTAL_UID,
          title: 'Explicit inherited Admin page',
          tabTitle: 'Overview',
        },
      }),
    );
    expect(await readRouteScope(app, explicitPage.tabRouteId)).toMatchObject({
      portalUids: [],
      layoutUids: [ADMIN_LAYOUT_UID],
    });

    const blueprintPageTitle = `Inherited Admin blueprint ${Date.now()}`;
    const blueprint = buildMarkdownBlueprint(ADMIN_LAYOUT_PORTAL_UID, 'ignored', blueprintPageTitle);
    delete (blueprint.navigation as { portalUid?: string }).portalUid;
    blueprint.navigation.group = { routeId: group.routeId } as typeof blueprint.navigation.group;
    const rejectedBlueprint = await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint });
    expect(rejectedBlueprint.status).toBe(400);
    expect(rejectedBlueprint.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-admin-layout-not-portal-target',
      path: 'values.navigation.group.routeId',
    });
    expect(await app.db.getRepository('desktopRoutes').find({ filter: { title: blueprintPageTitle } })).toHaveLength(0);

    blueprint.navigation.portalUid = ADMIN_LAYOUT_PORTAL_UID;
    const explicitBlueprint = getData(await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint }));
    expect(await readRouteScope(app, explicitBlueprint.surface.pageRoute.id)).toMatchObject({
      portalUids: [],
      layoutUids: [ADMIN_LAYOUT_UID],
    });
  });

  it('should create desktop portal group, page and tabs as portal-only routes with role grants', async () => {
    const groupTitle = `Portal desktop group ${Date.now()}`;
    const pageTitle = `Portal desktop page ${Date.now()}`;
    const created = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(DESKTOP_PORTAL_UID, groupTitle, pageTitle, 2),
      }),
    );
    const groupRoute = await app.db.getRepository('desktopRoutes').findOne({
      filter: { type: 'group', title: groupTitle },
    });
    const pageScope = await readRouteScope(app, created.surface.pageRoute.id);
    const groupScope = await readRouteScope(app, groupRoute?.get('id'));
    const tabRoutes = pageScope.route?.get('children') || [];
    const routeIds = [
      groupRoute?.get('id'),
      created.surface.pageRoute.id,
      ...tabRoutes.map((tab: any) => tab.get('id')),
    ];

    expect(groupScope.portalUids).toEqual([DESKTOP_PORTAL_UID]);
    expect(groupScope.layoutUids).toEqual([]);
    expect(pageScope.portalUids).toEqual([DESKTOP_PORTAL_UID]);
    expect(pageScope.layoutUids).toEqual([]);
    expect(tabRoutes).toHaveLength(2);
    for (const tabRoute of tabRoutes) {
      const tabScope = await readRouteScope(app, tabRoute.get('id'));
      expect(tabScope.portalUids).toEqual([DESKTOP_PORTAL_UID]);
      expect(tabScope.layoutUids).toEqual([]);
    }

    const standardPermissions = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName: PORTAL_ROLE_NAME,
        desktopRouteId: routeIds,
      },
    });
    expect(standardPermissions).toHaveLength(0);
    const portalPermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        roleName: PORTAL_ROLE_NAME,
        multiPortalUid: DESKTOP_PORTAL_UID,
        desktopRouteId: routeIds,
      },
    });
    expect(portalPermissions).toHaveLength(routeIds.length);
  });

  it('should use mobile portal root navigation and replace duplicate titles inside that portal', async () => {
    const groupTitle = `Ignored mobile portal group ${Date.now()}`;
    const pageTitle = `Mobile portal page ${Date.now()}`;
    const blueprint = buildMarkdownBlueprint(MOBILE_PORTAL_UID, groupTitle, pageTitle);
    delete (blueprint.navigation.group as { icon?: string }).icon;

    const first = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: blueprint,
      }),
    );
    const second = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: blueprint,
      }),
    );

    expect(second.target.pageSchemaUid).toBe(first.target.pageSchemaUid);
    const pageScope = await readRouteScope(app, first.surface.pageRoute.id);
    expect(pageScope.route?.get('parentId')).toBeNull();
    expect(pageScope.portalUids).toEqual([MOBILE_PORTAL_UID]);
    expect(pageScope.layoutUids).toEqual([]);
    expect(
      await app.db.getRepository('desktopRoutes').find({
        filter: { type: 'group', title: groupTitle },
      }),
    ).toHaveLength(0);
  });

  it('should allow fixed Portal and explicit layout provenance for mobile creates', async () => {
    const fixedPageTitle = `Fixed mobile page ${Date.now()}`;
    const fixed = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(MOBILE_LAYOUT_PORTAL_UID, 'Ignored fixed mobile group', fixedPageTitle),
      }),
    );
    expect(await readRouteScope(app, fixed.surface.pageRoute.id)).toMatchObject({
      portalUids: [],
      layoutUids: [MOBILE_LAYOUT_UID],
    });

    const layoutPageTitle = `Explicit mobile layout page ${Date.now()}`;
    const layoutBlueprint = buildMarkdownBlueprint(
      MOBILE_LAYOUT_PORTAL_UID,
      'Ignored explicit mobile group',
      layoutPageTitle,
    );
    delete (layoutBlueprint.navigation as { portalUid?: string }).portalUid;
    (layoutBlueprint.navigation as { layoutUid?: string }).layoutUid = MOBILE_LAYOUT_UID;
    const explicitLayout = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({ values: layoutBlueprint }),
    );
    expect(await readRouteScope(app, explicitLayout.surface.pageRoute.id)).toMatchObject({
      portalUids: [],
      layoutUids: [MOBILE_LAYOUT_UID],
    });
  });

  it('should isolate same-title groups and pages across portals', async () => {
    const groupTitle = `Cross portal group ${Date.now()}`;
    const pageTitle = `Cross portal page ${Date.now()}`;
    const first = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(DESKTOP_PORTAL_UID, groupTitle, pageTitle),
      }),
    );
    const second = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(SECOND_DESKTOP_PORTAL_UID, groupTitle, pageTitle),
      }),
    );
    const repeatedFirst = getData(
      await rootAgent.resource('flowSurfaces').applyBlueprint({
        values: buildMarkdownBlueprint(DESKTOP_PORTAL_UID, groupTitle, pageTitle),
      }),
    );

    expect(second.target.pageSchemaUid).not.toBe(first.target.pageSchemaUid);
    expect(repeatedFirst.target.pageSchemaUid).toBe(first.target.pageSchemaUid);
    const groups = await app.db.getRepository('desktopRoutes').find({
      filter: { type: 'group', title: groupTitle },
    });
    expect(groups).toHaveLength(2);
  });

  it('should inherit an existing portal scope when low-level child and page calls omit portalUid', async () => {
    const group = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'group',
          title: `Inherited portal group ${Date.now()}`,
          icon: 'AppstoreOutlined',
          portalUid: DESKTOP_PORTAL_UID,
        },
      }),
    );
    const item = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'item',
          title: `Inherited portal page ${Date.now()}`,
          icon: 'FileOutlined',
          parentMenuRouteId: group.routeId,
        },
      }),
    );
    const page = getData(
      await rootAgent.resource('flowSurfaces').createPage({
        values: {
          menuRouteId: item.routeId,
          title: 'Inherited portal page',
          tabTitle: 'Overview',
        },
      }),
    );

    expect((await readRouteScope(app, item.routeId)).portalUids).toEqual([DESKTOP_PORTAL_UID]);
    expect((await readRouteScope(app, item.routeId)).layoutUids).toEqual([]);
    expect((await readRouteScope(app, page.tabRouteId)).portalUids).toEqual([DESKTOP_PORTAL_UID]);
    expect((await readRouteScope(app, page.tabRouteId)).layoutUids).toEqual([]);
  });

  it('should reject unavailable, inaccessible and mismatched portal scopes clearly', async () => {
    const group = getData(
      await rootAgent.resource('flowSurfaces').createMenu({
        values: {
          type: 'group',
          title: `Portal mismatch group ${Date.now()}`,
          icon: 'AppstoreOutlined',
          portalUid: DESKTOP_PORTAL_UID,
        },
      }),
    );
    const mismatch = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'item',
        title: 'Portal mismatch item',
        icon: 'FileOutlined',
        parentMenuRouteId: group.routeId,
        portalUid: SECOND_DESKTOP_PORTAL_UID,
      },
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.body?.errors?.[0]?.ruleId).toBe('navigation-route-portal-mismatch');

    const updated = getData(
      await rootAgent.resource('flowSurfaces').updateMenu({
        values: {
          menuRouteId: group.routeId,
          portalUid: DESKTOP_PORTAL_UID,
          title: 'Updated portal group',
        },
      }),
    );
    expect(updated.routeId).toBe(group.routeId);
    const updateMismatch = await rootAgent.resource('flowSurfaces').updateMenu({
      values: {
        menuRouteId: group.routeId,
        portalUid: SECOND_DESKTOP_PORTAL_UID,
        title: 'Wrong portal update',
      },
    });
    expect(updateMismatch.status).toBe(400);
    expect(updateMismatch.body?.errors?.[0]?.ruleId).toBe('navigation-route-portal-mismatch');

    const mutuallyExclusive = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: 'Mutually exclusive portal group',
        icon: 'AppstoreOutlined',
        layoutUid: ADMIN_LAYOUT_UID,
        portalUid: DESKTOP_PORTAL_UID,
      },
    });
    expect(mutuallyExclusive.status).toBe(400);
    expect(mutuallyExclusive.body?.errors?.[0]?.ruleId).toBe('navigation-target-mutually-exclusive');

    const conflictingBlueprint = buildMarkdownBlueprint(
      DESKTOP_PORTAL_UID,
      'Conflicting blueprint group',
      'Conflicting blueprint page',
    );
    (conflictingBlueprint.navigation as Record<string, unknown>).layoutUid = ADMIN_LAYOUT_UID;
    const conflictingBlueprintResponse = await rootAgent.resource('flowSurfaces').applyBlueprint({
      values: conflictingBlueprint,
    });
    expect(conflictingBlueprintResponse.status).toBe(400);
    expect(conflictingBlueprintResponse.body?.errors?.[0]?.ruleId).toBe('navigation-target-mutually-exclusive');

    const missing = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: 'Missing portal group',
        icon: 'AppstoreOutlined',
        portalUid: 'missing-flow-surfaces-portal',
      },
    });
    expect(missing.status).toBe(400);
    expect(missing.body?.errors?.[0]?.ruleId).toBe('navigation-portal-not-found');

    const disabled = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: 'Disabled portal group',
        icon: 'AppstoreOutlined',
        portalUid: DISABLED_PORTAL_UID,
      },
    });
    expect(disabled.status).toBe(400);
    expect(disabled.body?.errors?.[0]?.ruleId).toBe('navigation-portal-disabled');

    const aiTitle = 'Unsupported AI portal group';
    const aiPortal = await rootAgent.resource('flowSurfaces').createMenu({
      values: {
        type: 'group',
        title: aiTitle,
        icon: 'AppstoreOutlined',
        portalUid: AI_PORTAL_UID,
      },
    });
    expect(aiPortal.status).toBe(400);
    expect(aiPortal.body?.errors?.[0]).toMatchObject({
      ruleId: 'navigation-portal-type-unsupported',
      details: {
        uiBuilderAllowed: false,
        adminLayoutFallbackAllowed: false,
        implementationPath: 'ai-portal-source',
      },
    });
    expect(await app.db.getRepository('desktopRoutes').find({ filter: { title: aiTitle } })).toHaveLength(0);

    await expect(
      service.transaction((transaction) =>
        service.createMenu(
          {
            type: 'group',
            title: 'Forbidden portal group',
            icon: 'AppstoreOutlined',
            portalUid: SECOND_DESKTOP_PORTAL_UID,
          },
          {
            transaction,
            currentRoles: [PORTAL_ROLE_NAME],
          },
        ),
      ),
    ).rejects.toMatchObject({
      status: 403,
      options: expect.objectContaining({ ruleId: 'navigation-portal-forbidden' }),
    });
  });

  it('should reject implicit create without writing when no Portal is enabled', async () => {
    const portals = await app.db.getRepository('multiPortals').find({ fields: ['uid', 'enabled'] });
    for (const portal of portals) {
      await app.db.getRepository('multiPortals').update({
        filterByTk: portal.get('uid'),
        values: { enabled: false },
      });
    }

    const pageTitle = `No Portal page ${Date.now()}`;
    try {
      const blueprint = buildMarkdownBlueprint(ADMIN_LAYOUT_PORTAL_UID, `No Portal group ${Date.now()}`, pageTitle);
      delete (blueprint.navigation as { portalUid?: string }).portalUid;
      const response = await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint });
      expect(response.status).toBe(400);
      expect(response.body?.errors?.[0]).toMatchObject({
        ruleId: 'navigation-portal-not-found',
        details: {
          uiBuilderAllowed: false,
          adminLayoutFallbackAllowed: false,
        },
      });
      expect(await app.db.getRepository('desktopRoutes').find({ filter: { title: pageTitle } })).toHaveLength(0);
    } finally {
      for (const portal of portals) {
        await app.db.getRepository('multiPortals').update({
          filterByTk: portal.get('uid'),
          values: { enabled: portal.get('enabled') },
        });
      }
    }
  });

  it('should hand implicit create to Portal source when only an AI Portal is enabled', async () => {
    const noCodePortals = await app.db.getRepository('multiPortals').find({
      filter: { portalType: 'no-code' },
      fields: ['uid', 'enabled'],
    });
    for (const portal of noCodePortals) {
      await app.db.getRepository('multiPortals').update({
        filterByTk: portal.get('uid'),
        values: { enabled: false },
      });
    }

    try {
      const pageTitle = `AI-only implicit page ${Date.now()}`;
      const blueprint = buildMarkdownBlueprint(ADMIN_LAYOUT_PORTAL_UID, `AI-only group ${Date.now()}`, pageTitle);
      delete (blueprint.navigation as { portalUid?: string }).portalUid;
      const response = await rootAgent.resource('flowSurfaces').applyBlueprint({ values: blueprint });
      expect(response.status).toBe(400);
      expect(response.body?.errors?.[0]).toMatchObject({
        ruleId: 'navigation-portal-type-unsupported',
        details: {
          portalUid: AI_PORTAL_UID,
          portalName: 'flowSurfacesAi',
          uiBuilderAllowed: false,
          adminLayoutFallbackAllowed: false,
          implementationPath: 'ai-portal-source',
        },
      });
      expect(await app.db.getRepository('desktopRoutes').find({ filter: { title: pageTitle } })).toHaveLength(0);
    } finally {
      for (const portal of noCodePortals) {
        await app.db.getRepository('multiPortals').update({
          filterByTk: portal.get('uid'),
          values: { enabled: portal.get('enabled') },
        });
      }
    }
  });

  it('should roll back route, portal relation and permission writes together', async () => {
    const title = `Rolled back portal group ${Date.now()}`;
    let routeId: string | number | undefined;

    await expect(
      service.transaction(async (transaction) => {
        const created = await service.createMenu(
          {
            type: 'group',
            title,
            icon: 'AppstoreOutlined',
            portalUid: DESKTOP_PORTAL_UID,
          },
          {
            transaction,
            currentRoles: ['root'],
          },
        );
        routeId = created.routeId;
        throw new Error('force portal rollback');
      }),
    ).rejects.toThrow('force portal rollback');

    expect(
      await app.db.getRepository('desktopRoutes').find({
        filter: { title },
      }),
    ).toHaveLength(0);
    expect(
      await app.db.getRepository('desktopRoutesMultiPortals').find({
        filter: { desktopRouteId: routeId },
      }),
    ).toHaveLength(0);
    expect(
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
        filter: { desktopRouteId: routeId },
      }),
    ).toHaveLength(0);
  });
});
