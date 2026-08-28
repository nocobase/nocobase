/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { MockServer } from '@nocobase/test';
import { FlowSurfacesService } from '../flow-surfaces/service';
import { getData } from './flow-surfaces.contract.helpers';
import { createFlowSurfacesMockServer, loginFlowSurfacesRootAgent } from './flow-surfaces.mock-server';
import { FLOW_SURFACES_TEST_PLUGIN_INSTALLS, FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const MOBILE_LAYOUT_UID = 'mobile-layout-model';
const DESKTOP_PORTAL_UID = 'flow-surfaces-desktop-portal';
const SECOND_DESKTOP_PORTAL_UID = 'flow-surfaces-second-desktop-portal';
const MOBILE_PORTAL_UID = 'flow-surfaces-mobile-portal';
const DISABLED_PORTAL_UID = 'flow-surfaces-disabled-portal';
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
      { name: 'routeName', type: 'string', unique: true, allowNull: false },
      { name: 'routePath', type: 'string', allowNull: false },
      { name: 'authCheck', type: 'boolean', defaultValue: true, allowNull: false },
      { name: 'enabled', type: 'boolean', defaultValue: true, allowNull: false },
      { name: 'uiLayoutUid', type: 'string', allowNull: false },
      {
        type: 'belongsTo',
        name: 'uiLayout',
        target: 'uiLayouts',
        targetKey: 'uid',
        foreignKey: 'uiLayoutUid',
        onDelete: 'RESTRICT',
      },
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
      uid: DESKTOP_PORTAL_UID,
      title: 'Operations workspace',
      icon: 'DashboardOutlined',
      routeName: 'flowSurfacesOperations',
      routePath: '/flow-surfaces-operations',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: SECOND_DESKTOP_PORTAL_UID,
      title: 'Secondary workspace',
      icon: 'ProjectOutlined',
      routeName: 'flowSurfacesSecondary',
      routePath: '/flow-surfaces-secondary',
      authCheck: true,
      enabled: true,
      uiLayoutUid: ADMIN_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: MOBILE_PORTAL_UID,
      title: 'Mobile workspace',
      icon: 'MobileOutlined',
      routeName: 'flowSurfacesMobile',
      routePath: '/flow-surfaces-mobile',
      authCheck: true,
      enabled: true,
      uiLayoutUid: MOBILE_LAYOUT_UID,
    });
    await createPortal(app, {
      uid: DISABLED_PORTAL_UID,
      title: 'Disabled workspace',
      routeName: 'flowSurfacesDisabled',
      routePath: '/flow-surfaces-disabled',
      authCheck: true,
      enabled: false,
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
        expect.objectContaining({ kind: 'layout', uid: ADMIN_LAYOUT_UID, default: true }),
        expect.objectContaining({ kind: 'layout', uid: MOBILE_LAYOUT_UID, layoutType: 'mobile' }),
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
      ]),
    );
    expect(targets.targets.some((target: any) => target.uid === SECOND_DESKTOP_PORTAL_UID)).toBe(false);
    expect(targets.targets.some((target: any) => target.uid === DISABLED_PORTAL_UID)).toBe(false);
    expect(targets.targets.some((target: any) => target.uid === '__default_admin__')).toBe(false);
    expect(targets.targets.some((target: any) => target.uid === '__default_mobile__')).toBe(false);
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
