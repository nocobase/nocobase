/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../../../plugin-ui-layout/src/constants';

const MULTI_PORTAL_RUNTIME_FIELDS = ['uid', 'title', 'routeName', 'routePath', 'authCheck', 'enabled', 'uiLayout'];
const MULTI_PORTAL_MANAGEMENT_ACTIONS = [
  'multiPortals:list',
  'multiPortals:get',
  'multiPortals:create',
  'multiPortals:update',
  'multiPortals:destroy',
];
const ROLE_MULTI_PORTAL_PERMISSION_ACTIONS = [
  'roles.multiPortals:*',
  'rolesMultiPortalDesktopRoutes:*',
  'rolesMultiPortalRoutePolicies:*',
];

interface RouteResponseItem {
  title?: string;
  children?: RouteResponseItem[];
}

async function createMultiPortalAclMockServer() {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'error-handler',
      'users',
      'auth',
      'client',
      'field-sort',
      'acl',
      'ui-schema-storage',
      'system-settings',
      'data-source-main',
      'data-source-manager',
      'ui-layout',
      'multi-portal',
    ],
  });
}

function collectRouteTitles(routes: RouteResponseItem[] = []) {
  return routes.flatMap((route) => [
    ...(typeof route.title === 'string' ? [route.title] : []),
    ...collectRouteTitles(route.children),
  ]);
}

describe('plugin-multi-portal server', () => {
  let app: MockServer | undefined;

  afterEach(async () => {
    await app?.destroy();
    app = undefined;
  });

  it('should load with UI Layout without adding core dependencies', async () => {
    app = await createMockServer({
      plugins: ['ui-layout', 'multi-portal'],
    });

    expect(app.pm.get('ui-layout')).toBeTruthy();
    expect(app.pm.get('multi-portal')).toBeTruthy();
  });

  it('should define multiPortals with ui layout fields and relation', async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-layout', 'multi-portal'],
    });
    await app.db.sync();

    const collection = app.db.getCollection('multiPortals');
    expect(collection).toBeTruthy();
    expect(collection.options.filterTargetKey).toBe('uid');
    expect(collection.getField('uid')?.options).toMatchObject({
      type: 'string',
      primaryKey: true,
      allowNull: false,
    });
    expect(collection.getField('title')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('routeName')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('routePath')?.options).toMatchObject({
      type: 'string',
      allowNull: false,
    });
    expect(collection.getField('authCheck')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    });
    expect(collection.getField('enabled')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: true,
      allowNull: false,
    });
    expect(collection.getField('layoutType')).toBeUndefined();
    expect(collection.getField('uiLayout')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'uiLayouts',
      targetKey: 'uid',
      foreignKey: 'uiLayoutUid',
      onDelete: 'RESTRICT',
    });

    const repository = app.db.getRepository('multiPortals');
    const desktopPortal = await repository.create({
      values: {
        uid: 'desktop-portal',
        title: 'Desktop portal',
        routeName: 'desktopPortal',
        routePath: '/desktop-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const mobilePortal = await repository.create({
      values: {
        uid: 'mobile-portal',
        title: 'Mobile portal',
        routeName: 'mobilePortal',
        routePath: '/mobile-portal',
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const persistedDesktopPortal = await repository.findOne({
      filterByTk: desktopPortal.get('uid'),
      appends: ['uiLayout'],
    });
    const persistedMobilePortal = await repository.findOne({
      filterByTk: mobilePortal.get('uid'),
      appends: ['uiLayout'],
    });

    expect(persistedDesktopPortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_ADMIN_UI_LAYOUT.uid);
    expect(persistedMobilePortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_MOBILE_UI_LAYOUT.uid);
    expect(persistedDesktopPortal?.toJSON()).not.toHaveProperty('layoutType');

    const apiCreateResponse = await app
      .agent()
      .resource('multiPortals')
      .create({
        values: {
          uid: 'api-portal',
          title: 'API portal',
          routeName: 'apiPortal',
          routePath: '/api-portal',
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      });
    const apiUpdateResponse = await app
      .agent()
      .resource('multiPortals')
      .update({
        filterByTk: 'api-portal',
        values: {
          uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
        },
      });
    const persistedApiPortal = await repository.findOne({
      filterByTk: 'api-portal',
      appends: ['uiLayout'],
    });

    expect(apiCreateResponse.status).toBe(200);
    expect(apiUpdateResponse.status).toBe(200);
    expect(persistedApiPortal?.get('uiLayout')?.get('uid')).toBe(DEFAULT_MOBILE_UI_LAYOUT.uid);
    await expect(
      repository.create({
        values: {
          uid: 'invalid-layout-portal',
          title: 'Invalid layout portal',
          routeName: 'invalidLayoutPortal',
          routePath: '/invalid-layout-portal',
          uiLayoutUid: 'missing-ui-layout',
        },
      }),
    ).rejects.toThrow();
  });

  it('should relate desktop routes to multi-portals explicitly', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const desktopRoutesCollection = app.db.getCollection('desktopRoutes');
    expect(desktopRoutesCollection.getField('multiPortals')?.options).toMatchObject({
      type: 'belongsToMany',
      target: 'multiPortals',
      through: 'desktopRoutesMultiPortals',
      sourceKey: 'id',
      targetKey: 'uid',
      foreignKey: 'desktopRouteId',
      otherKey: 'multiPortalUid',
    });

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'desktop-route-relation-portal',
        title: 'Desktop route relation portal',
        routeName: 'desktopRouteRelationPortal',
        routePath: '/desktop-route-relation-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const otherPortal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'desktop-route-relation-other-portal',
        title: 'Desktop route relation other portal',
        routeName: 'desktopRouteRelationOtherPortal',
        routePath: '/desktop-route-relation-other-portal',
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-MULTI-PORTAL-ROUTE-RELATION',
        schemaUid: 'multi-portal-route-relation',
        hidden: false,
        sort: 10,
      },
    });
    const findRoutesByPortal = async (portalUid: string) =>
      app.db.getRepository('desktopRoutes').find({
        filter: {
          'multiPortals.uid': portalUid,
        },
        appends: ['multiPortals'],
      });

    expect(await findRoutesByPortal(portal.get('uid'))).toEqual([]);

    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });

    const portalRoutes = await findRoutesByPortal(portal.get('uid'));
    const otherPortalRoutes = await findRoutesByPortal(otherPortal.get('uid'));

    expect(portalRoutes.map((item) => item.get('title'))).toEqual(['DATA-MULTI-PORTAL-ROUTE-RELATION']);
    expect(portalRoutes[0].get('multiPortals').map((item) => item.get('uid'))).toEqual([
      'desktop-route-relation-portal',
    ]);
    expect(otherPortalRoutes).toEqual([]);
  });

  it('should define role multi-portal permission relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    expect(app.db.getCollection('roles').getField('allowNewMultiPortal')).toBeDefined();

    const collection = app.db.getCollection('rolesMultiPortals');
    expect(collection).toBeTruthy();
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(app.db.getCollection('roles').getField('multiPortals')?.options).toMatchObject({
      type: 'belongsToMany',
      target: 'multiPortals',
      through: 'rolesMultiPortals',
      sourceKey: 'name',
      targetKey: 'uid',
      foreignKey: 'roleName',
      otherKey: 'multiPortalUid',
    });
  });

  it('should persist the role-level default multi-portal access flag', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('roles').create({
      values: {
        name: 'portal-default-access-role',
        allowNewMultiPortal: false,
      },
    });

    await app.db.getRepository('roles').update({
      filterByTk: 'portal-default-access-role',
      values: {
        allowNewMultiPortal: true,
      },
    });

    const role = await app.db.getRepository('roles').findOne({
      filterByTk: 'portal-default-access-role',
    });

    expect(role?.get('allowNewMultiPortal')).toBe(true);
  });

  it('should allow new multi-portals by default for initialized built-in roles', async () => {
    app = await createMultiPortalAclMockServer();

    const roles = await app.db.getRepository('roles').find({
      filter: {
        name: ['admin', 'member'],
      },
      sort: ['name'],
    });

    expect(roles.map((role) => [role.get('name'), role.get('allowNewMultiPortal')])).toEqual([
      ['admin', true],
      ['member', true],
    ]);
  });

  it('should grant new enabled multi-portals by the role default portal access policy', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('roles').create({
      values: {
        name: 'new-portal-default-allowed',
        allowNewMultiPortal: true,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'new-portal-default-denied',
        allowNewMultiPortal: false,
      },
    });

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'default-policy-new-portal',
        title: 'Default policy new portal',
        routeName: 'defaultPolicyNewPortal',
        routePath: '/default-policy-new-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const portalAccessRecords = await app.db.getRepository('rolesMultiPortals').find({
      filter: {
        roleName: ['new-portal-default-allowed', 'new-portal-default-denied'],
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const portalAccessKeys = portalAccessRecords.map(
      (record) => `${record.get('roleName')}:${record.get('multiPortalUid')}`,
    );

    expect(portalAccessKeys).toEqual(['new-portal-default-allowed:default-policy-new-portal']);

    const routePolicyRecords = await app.db.getRepository('rolesMultiPortalRoutePolicies').find({
      filter: {
        roleName: ['new-portal-default-allowed', 'new-portal-default-denied'],
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const routePolicyValues = routePolicyRecords.map((record) => [
      `${record.get('roleName')}:${record.get('multiPortalUid')}`,
      record.get('allowNewMenu'),
    ]);

    expect(routePolicyValues).toEqual([['new-portal-default-allowed:default-policy-new-portal', true]]);
  });

  it('should initialize route default policies for built-in roles when granting new multi-portals', async () => {
    app = await createMultiPortalAclMockServer();

    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'built-in-default-policy-portal',
        title: 'Built-in default policy portal',
        routeName: 'builtInDefaultPolicyPortal',
        routePath: '/built-in-default-policy-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const routePolicyRecords = await app.db.getRepository('rolesMultiPortalRoutePolicies').find({
      filter: {
        roleName: ['admin', 'member'],
        multiPortalUid: 'built-in-default-policy-portal',
      },
      sort: ['roleName', 'multiPortalUid'],
    });
    const routePolicyValues = routePolicyRecords.map((record) => [
      record.get('roleName'),
      record.get('multiPortalUid'),
      record.get('allowNewMenu'),
    ]);

    expect(routePolicyValues).toEqual([
      ['admin', 'built-in-default-policy-portal', true],
      ['member', 'built-in-default-policy-portal', true],
    ]);
  });

  it('should define role multi-portal desktop route permission relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const collection = app.db.getCollection('rolesMultiPortalDesktopRoutes');
    expect(collection).toBeTruthy();
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('desktopRoute')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'desktopRoutes',
      targetKey: 'id',
      foreignKey: 'desktopRouteId',
      onDelete: 'CASCADE',
    });
  });

  it('should define role multi-portal route default policy relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const collection = app.db.getCollection('rolesMultiPortalRoutePolicies');
    expect(collection).toBeTruthy();
    expect(collection.options.autoGenId).toBe(false);
    expect(collection.options.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unique: true,
          fields: ['role_name', 'multi_portal_uid'],
        }),
      ]),
    );
    expect(collection.getField('role')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'roles',
      targetKey: 'name',
      foreignKey: 'roleName',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('multiPortal')?.options).toMatchObject({
      type: 'belongsTo',
      target: 'multiPortals',
      targetKey: 'uid',
      foreignKey: 'multiPortalUid',
      onDelete: 'CASCADE',
    });
    expect(collection.getField('allowNewMenu')?.options).toMatchObject({
      type: 'boolean',
      defaultValue: false,
    });
  });

  it('should expose portal route permission targets through role configuration reader', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'route-target-portal',
        title: 'Route target portal',
        routeName: 'routeTargetPortal',
        routePath: '/route-target-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ROUTE-TARGET',
        schemaUid: 'portal-route-target',
        hidden: false,
        sort: 10,
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'portal-route-target-role-manager',
        snippets: ['pm.acl.roles'],
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const agent = await app.agent().login(user);

    const response = await agent.get('/desktopRoutes:listRolePermissionTargets').query({
      portal: portal.get('uid'),
      filter: {
        id: -1,
      },
      fields: ['id'],
      appends: ['uiLayouts'],
    });

    expect(response.status).toBe(200);
    expect((response.body.data as Array<Record<string, unknown>>).map((item) => item.title)).toEqual([
      'DATA-PORTAL-ROUTE-TARGET',
    ]);
    for (const item of response.body.data as Array<Record<string, unknown>>) {
      expect(Object.keys(item).sort()).toEqual(['children', 'hidden', 'id', 'options', 'parentId', 'title'].sort());
      expect(item).not.toHaveProperty('uiLayouts');
    }
  });

  it('should serve accessible desktop routes through an explicit portal scope', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'explicit-scope-portal',
        title: 'Explicit scope portal',
        routeName: 'explicitScopePortal',
        routePath: '/explicit-scope-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const portalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
        schemaUid: 'portal-explicit-scope-route',
        hidden: false,
        sort: 10,
      },
    });
    const uiLayoutRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-UI-LAYOUT-EXPLICIT-SCOPE-ROUTE',
        schemaUid: 'ui-layout-explicit-scope-route',
        hidden: false,
        sort: 20,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'explicit-scope-portal-role',
        snippets: ['pm.acl.roles'],
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', portalRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', uiLayoutRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: portalRoute.get('id'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(memberUser);
    const [listResponse, getResponse, targetsResponse, ambiguousScopeResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: portalRoute.get('id'),
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listRolePermissionTargets').query({
        portal: portal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        portal: portal.get('uid'),
      }),
    ]);

    expect(listResponse.status).toBe(200);
    expect(getResponse.status).toBe(200);
    expect(targetsResponse.status).toBe(200);
    expect(ambiguousScopeResponse.status).toBe(400);
    expect(collectRouteTitles(listResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
    ]);
    expect(getResponse.body.data.title).toBe('DATA-PORTAL-EXPLICIT-SCOPE-ROUTE');
    expect(collectRouteTitles(targetsResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-EXPLICIT-SCOPE-ROUTE',
    ]);
  });

  it('should create desktop routes with exactly one portal or layout owner', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'route-owner-portal',
        title: 'Route owner portal',
        routeName: 'routeOwnerPortal',
        routePath: '/route-owner-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const mobileLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const portalCreateResponse = await rootAgent.resource('desktopRoutes').create({
      layout: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'portal owned page',
        schemaUid: 'portal-owned-page',
        uiLayouts: [portal.get('uid')],
        children: [
          {
            type: 'tabs',
            title: 'portal owned tabs',
            schemaUid: 'portal-owned-tabs',
            hidden: true,
            uiLayouts: [portal.get('uid')],
          },
        ],
      },
    });
    const layoutCreateResponse = await rootAgent.resource('desktopRoutes').create({
      layout: mobileLayout?.get('uid'),
      values: {
        type: 'flowPage',
        title: 'layout owned page',
        schemaUid: 'layout-owned-page',
        children: [
          {
            type: 'tabs',
            title: 'layout owned tabs',
            schemaUid: 'layout-owned-tabs',
            hidden: true,
          },
        ],
      },
    });
    const portalUpsertResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      layout: portal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'tabs',
        title: 'portal owned upsert tab',
        schemaUid: 'portal-owned-upsert-tab',
        uiLayouts: [portal.get('uid')],
      },
    });

    expect(portalCreateResponse.status).toBe(200);
    expect(layoutCreateResponse.status).toBe(200);
    expect(portalUpsertResponse.status).toBe(200);

    const [portalRoute, layoutRoute, upsertRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: portalCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: layoutCreateResponse.body.data.id,
        appends: ['multiPortals', 'uiLayouts', 'children.multiPortals', 'children.uiLayouts'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filter: {
          schemaUid: 'portal-owned-upsert-tab',
        },
        appends: ['multiPortals', 'uiLayouts'],
      }),
    ]);
    const portalChildRoute = portalRoute?.get('children')?.[0];
    const layoutChildRoute = layoutRoute?.get('children')?.[0];

    expect(portalRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalRoute?.get('uiLayouts')).toEqual([]);
    expect(portalChildRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(portalChildRoute?.get('uiLayouts')).toEqual([]);
    expect(upsertRoute?.get('multiPortals').map((item) => item.get('uid'))).toEqual([portal.get('uid')]);
    expect(upsertRoute?.get('uiLayouts')).toEqual([]);
    expect(layoutRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(layoutRoute?.get('multiPortals')).toEqual([]);
    expect(layoutChildRoute?.get('uiLayouts').map((item) => item.get('uid'))).toEqual([mobileLayout?.get('uid')]);
    expect(layoutChildRoute?.get('multiPortals')).toEqual([]);
  });

  it('should grant new portal routes by the portal route default policy', async () => {
    app = await createMultiPortalAclMockServer();

    const portalRepository = app.db.getRepository('multiPortals');
    const firstPortal = await portalRepository.create({
      values: {
        uid: 'route-default-policy-first-portal',
        title: 'Route default policy first portal',
        routeName: 'routeDefaultPolicyFirstPortal',
        routePath: '/route-default-policy-first-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const secondPortal = await portalRepository.create({
      values: {
        uid: 'route-default-policy-second-portal',
        title: 'Route default policy second portal',
        routeName: 'routeDefaultPolicySecondPortal',
        routePath: '/route-default-policy-second-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const allowedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-allowed-role',
      },
    });
    const deniedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-denied-role',
      },
    });
    const missingPolicyRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-missing-role',
      },
    });
    const otherPortalRole = await app.db.getRepository('roles').create({
      values: {
        name: 'route-default-policy-other-portal-role',
      },
    });
    const portalAccessRepository = app.db.getRepository('rolesMultiPortals');
    for (const roleName of [allowedRole, deniedRole, missingPolicyRole].map((role) => role.get('name'))) {
      await portalAccessRepository.create({
        values: {
          roleName,
          multiPortalUid: firstPortal.get('uid'),
        },
      });
    }
    await portalAccessRepository.create({
      values: {
        roleName: otherPortalRole.get('name'),
        multiPortalUid: secondPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: allowedRole.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        allowNewMenu: true,
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: deniedRole.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        allowNewMenu: false,
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: otherPortalRole.get('name'),
        multiPortalUid: secondPortal.get('uid'),
        allowNewMenu: true,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const createResponse = await rootAgent.resource('desktopRoutes').create({
      portal: firstPortal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'route default policy created page',
        schemaUid: 'route-default-policy-created-page',
      },
    });
    const upsertResponse = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: firstPortal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'route default policy upserted page',
        schemaUid: 'route-default-policy-upserted-page',
      },
    });
    await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: firstPortal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'route default policy upserted page renamed',
        schemaUid: 'route-default-policy-upserted-page',
      },
    });

    expect(createResponse.status).toBe(200);
    expect(upsertResponse.status).toBe(200);

    const upsertRoute = await app.db.getRepository('desktopRoutes').findOne({
      filter: {
        schemaUid: 'route-default-policy-upserted-page',
      },
    });
    const routePermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        desktopRouteId: [createResponse.body.data.id, upsertRoute?.get('id')],
        roleName: [
          allowedRole.get('name'),
          deniedRole.get('name'),
          missingPolicyRole.get('name'),
          otherPortalRole.get('name'),
        ],
      },
      sort: ['desktopRouteId', 'roleName', 'multiPortalUid'],
    });
    const permissionKeys = routePermissions.map((permission) => [
      permission.get('desktopRouteId'),
      permission.get('roleName'),
      permission.get('multiPortalUid'),
    ]);

    expect(permissionKeys).toEqual([
      [createResponse.body.data.id, allowedRole.get('name'), firstPortal.get('uid')],
      [upsertRoute?.get('id'), allowedRole.get('name'), firstPortal.get('uid')],
    ]);
  });

  it('should keep default route grants isolated between ui layouts and portals', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'default-grant-isolation-portal',
        title: 'Default grant isolation portal',
        routeName: 'defaultGrantIsolationPortal',
        routePath: '/default-grant-isolation-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'default-grant-isolation-role',
        allowNewMenu: true,
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        allowNewMenu: true,
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const portalRouteResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'default grant isolation portal page',
        schemaUid: 'default-grant-isolation-portal-page',
      },
    });
    const layoutRouteResponse = await rootAgent.resource('desktopRoutes').create({
      layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      values: {
        type: 'flowPage',
        title: 'default grant isolation layout page',
        schemaUid: 'default-grant-isolation-layout-page',
      },
    });
    const portalRouteId = portalRouteResponse.body.data.id;
    const layoutRouteId = layoutRouteResponse.body.data.id;

    const layoutRoutePermissions = await app.db.getRepository('rolesUiLayoutDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
        desktopRouteId: [portalRouteId, layoutRouteId],
      },
      sort: ['desktopRouteId', 'uiLayoutUid'],
    });
    const portalRoutePermissions = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
        desktopRouteId: [portalRouteId, layoutRouteId],
      },
      sort: ['desktopRouteId', 'multiPortalUid'],
    });

    expect(
      layoutRoutePermissions.map((permission) => [permission.get('desktopRouteId'), permission.get('uiLayoutUid')]),
    ).toEqual([[layoutRouteId, DEFAULT_ADMIN_UI_LAYOUT.uid]]);
    expect(
      portalRoutePermissions.map((permission) => [permission.get('desktopRouteId'), permission.get('multiPortalUid')]),
    ).toEqual([[portalRouteId, portal.get('uid')]]);
  });

  it('should enforce role portal access before listing portal routes', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const allowedPortal = await repository.create({
      values: {
        uid: 'allowed-permission-portal',
        title: 'Allowed permission portal',
        routeName: 'allowedPermissionPortal',
        routePath: '/allowed-permission-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const deniedPortal = await repository.create({
      values: {
        uid: 'denied-permission-portal',
        title: 'Denied permission portal',
        routeName: 'deniedPermissionPortal',
        routePath: '/denied-permission-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-PERMISSION-ROUTE',
        schemaUid: 'portal-permission-route',
        hidden: false,
        sort: 10,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-permission-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [allowedPortal.get('uid'), deniedPortal.get('uid')],
    });
    await app.db.getRepository('rolesDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        desktopRouteId: route.get('id'),
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: allowedPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: allowedPortal.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const memberAgent = await app.agent().login(memberUser);

    const [allowedListResponse, deniedListResponse, allowedGetResponse, deniedGetResponse, rootDeniedListResponse] =
      await Promise.all([
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: deniedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          portal: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          portal: deniedPortal.get('uid'),
        }),
        rootAgent.get('/desktopRoutes:listAccessible').query({
          portal: deniedPortal.get('uid'),
        }),
      ]);

    expect(allowedListResponse.status).toBe(200);
    expect(deniedListResponse.status).toBe(200);
    expect(allowedGetResponse.status).toBe(200);
    expect([200, 204]).toContain(deniedGetResponse.status);
    expect(rootDeniedListResponse.status).toBe(200);
    expect(allowedListResponse.body.data.map((item) => item.title)).toEqual(['DATA-PORTAL-PERMISSION-ROUTE']);
    expect(deniedListResponse.body.data).toEqual([]);
    expect(allowedGetResponse.body.data.title).toBe('DATA-PORTAL-PERMISSION-ROUTE');
    expect(deniedGetResponse.body.data ?? null).toBeNull();
    expect(rootDeniedListResponse.body.data.map((item) => item.title)).toContain('DATA-PORTAL-PERMISSION-ROUTE');
  });

  it('should scope route access to the requested portal when portals share one ui layout', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const firstPortal = await repository.create({
      values: {
        uid: 'first-shared-layout-portal',
        title: 'First shared layout portal',
        routeName: 'firstSharedLayoutPortal',
        routePath: '/first-shared-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const secondPortal = await repository.create({
      values: {
        uid: 'second-shared-layout-portal',
        title: 'Second shared layout portal',
        routeName: 'secondSharedLayoutPortal',
        routePath: '/second-shared-layout-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-SCOPED-ROUTE',
        schemaUid: 'portal-scoped-route',
        hidden: false,
        sort: 10,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-route-permission-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [firstPortal.get('uid'), secondPortal.get('uid')],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: firstPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: secondPortal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: firstPortal.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(memberUser);

    const [firstListResponse, secondListResponse, firstGetResponse, secondGetResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: secondPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        portal: secondPortal.get('uid'),
      }),
    ]);

    expect(firstListResponse.status).toBe(200);
    expect(secondListResponse.status).toBe(200);
    expect(firstGetResponse.status).toBe(200);
    expect([200, 204]).toContain(secondGetResponse.status);
    expect(firstListResponse.body.data.map((item) => item.title)).toEqual(['DATA-PORTAL-SCOPED-ROUTE']);
    expect(secondListResponse.body.data).toEqual([]);
    expect(firstGetResponse.body.data.title).toBe('DATA-PORTAL-SCOPED-ROUTE');
    expect(secondGetResponse.body.data ?? null).toBeNull();
  });

  it('should keep ui layout route permissions and multi-portal route permissions isolated', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'permission-isolation-portal',
        title: 'Permission isolation portal',
        routeName: 'permissionIsolationPortal',
        routePath: '/permission-isolation-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const uiLayoutRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-UI-LAYOUT-ISOLATED-ROUTE',
        schemaUid: 'ui-layout-isolated-route',
        hidden: false,
        sort: 10,
      },
    });
    const firstPortalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ISOLATED-ROUTE-1',
        schemaUid: 'portal-isolated-route-1',
        hidden: false,
        sort: 20,
      },
    });
    const secondPortalRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-ISOLATED-ROUTE-2',
        schemaUid: 'portal-isolated-route-2',
        hidden: false,
        sort: 30,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'permission-isolation-member',
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', uiLayoutRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    for (const route of [firstPortalRoute, secondPortalRoute]) {
      await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
        tk: [portal.get('uid')],
      });
    }
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: firstPortalRoute.get('id'),
      },
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const memberAgent = await app.agent().login(memberUser);
    const roleName = role.get('name');
    const portalUid = portal.get('uid');

    await rootAgent.resource('roles.desktopRoutes', roleName).add({
      values: [uiLayoutRoute.get('id')],
    });

    const portalPermissionsAfterUiLayoutChange = await app.db.getRepository('rolesMultiPortalDesktopRoutes').find({
      filter: {
        roleName,
        multiPortalUid: portalUid,
      },
      sort: ['desktopRouteId'],
    });
    expect(portalPermissionsAfterUiLayoutChange.map((record) => record.get('desktopRouteId'))).toEqual([
      firstPortalRoute.get('id'),
    ]);

    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName,
        multiPortalUid: portalUid,
        desktopRouteId: secondPortalRoute.get('id'),
      },
    });

    const uiLayoutPermissionsAfterPortalChange = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName,
      },
      sort: ['desktopRouteId'],
    });
    expect(uiLayoutPermissionsAfterPortalChange.map((record) => record.get('desktopRouteId'))).toEqual([
      uiLayoutRoute.get('id'),
    ]);

    const [uiLayoutListResponse, portalListResponse, uiLayoutPortalRouteGetResponse, portalUiLayoutRouteGetResponse] =
      await Promise.all([
        memberAgent.get('/desktopRoutes:listAccessible').query({
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        memberAgent.get('/desktopRoutes:listAccessible').query({
          portal: portalUid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: firstPortalRoute.get('id'),
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: uiLayoutRoute.get('id'),
          portal: portalUid,
        }),
      ]);

    expect(uiLayoutListResponse.status).toBe(200);
    expect(portalListResponse.status).toBe(200);
    expect([200, 204]).toContain(uiLayoutPortalRouteGetResponse.status);
    expect([200, 204]).toContain(portalUiLayoutRouteGetResponse.status);
    expect(collectRouteTitles(uiLayoutListResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-UI-LAYOUT-ISOLATED-ROUTE',
    ]);
    expect(collectRouteTitles(portalListResponse.body.data as RouteResponseItem[])).toEqual([
      'DATA-PORTAL-ISOLATED-ROUTE-1',
      'DATA-PORTAL-ISOLATED-ROUTE-2',
    ]);
    expect(uiLayoutPortalRouteGetResponse.body.data ?? null).toBeNull();
    expect(portalUiLayoutRouteGetResponse.body.data ?? null).toBeNull();
  });

  it('should enforce explicit route parent chain inside portal permissions', async () => {
    app = await createMultiPortalAclMockServer();

    const portal = await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'explicit-parent-chain-portal',
        title: 'Explicit parent chain portal',
        routeName: 'explicitParentChainPortal',
        routePath: '/explicit-parent-chain-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    const parentRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-PARENT-ROUTE',
        schemaUid: 'portal-parent-route',
        hidden: false,
        sort: 10,
      },
    });
    const childRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-PORTAL-CHILD-ROUTE',
        schemaUid: 'portal-child-route',
        parentId: parentRoute.get('id'),
        hidden: false,
        sort: 20,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-parent-chain-member',
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', parentRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', childRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role.get('name'),
        multiPortalUid: portal.get('uid'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberAgent = await app.agent().login(memberUser);
    const rootAgent = await app.agent().login(rootUser);
    const routePermissionsRepository = app.db.getRepository('rolesMultiPortalDesktopRoutes');

    const resetRoutePermissions = async (desktopRouteIds: unknown[]) => {
      await routePermissionsRepository.destroy({
        filter: {
          roleName: role.get('name'),
          multiPortalUid: portal.get('uid'),
        },
      });

      for (const desktopRouteId of desktopRouteIds) {
        await routePermissionsRepository.create({
          values: {
            roleName: role.get('name'),
            multiPortalUid: portal.get('uid'),
            desktopRouteId,
          },
        });
      }
    };
    const listAccessibleRouteTitles = async () => {
      const response = await memberAgent.get('/desktopRoutes:listAccessible').query({
        portal: portal.get('uid'),
      });

      expect(response.status).toBe(200);
      return collectRouteTitles(response.body.data as RouteResponseItem[]);
    };

    await resetRoutePermissions([childRoute.get('id')]);
    const childOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual([]);
    expect(childOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id')]);
    const parentOnlyParentGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: parentRoute.get('id'),
      portal: portal.get('uid'),
    });
    const parentOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual(['DATA-PORTAL-PARENT-ROUTE']);
    expect(parentOnlyParentGetResponse.body.data.title).toBe('DATA-PORTAL-PARENT-ROUTE');
    expect(parentOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id'), childRoute.get('id')]);
    const parentAndChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      portal: portal.get('uid'),
    });
    const rootListResponse = await rootAgent.get('/desktopRoutes:listAccessible').query({
      portal: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual(['DATA-PORTAL-PARENT-ROUTE', 'DATA-PORTAL-CHILD-ROUTE']);
    expect(parentAndChildGetResponse.body.data.title).toBe('DATA-PORTAL-CHILD-ROUTE');
    expect(rootListResponse.status).toBe(200);
    expect(collectRouteTitles(rootListResponse.body.data as RouteResponseItem[])).toContain('DATA-PORTAL-PARENT-ROUTE');
  });

  it('should expose enabled portal manifests for runtime registration', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

    const repository = app.db.getRepository('multiPortals');
    await repository.create({
      values: {
        uid: 'desktop-runtime-portal',
        title: 'Desktop runtime portal',
        routeName: 'desktopRuntimePortal',
        routePath: '/desktop-runtime-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'mobile-runtime-portal',
        title: 'Mobile runtime portal',
        routeName: 'mobileRuntimePortal',
        routePath: '/mobile-runtime-portal',
        authCheck: false,
        enabled: true,
        uiLayoutUid: DEFAULT_MOBILE_UI_LAYOUT.uid,
      },
    });
    await repository.create({
      values: {
        uid: 'disabled-runtime-portal',
        title: 'Disabled runtime portal',
        routeName: 'disabledRuntimePortal',
        routePath: '/disabled-runtime-portal',
        authCheck: true,
        enabled: false,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    const response = await app
      .agent()
      .get('/multiPortals:listEnabled')
      .query({
        filter: {
          enabled: false,
        },
        fields: ['uid'],
        appends: ['uiLayout.routeName'],
        sort: '-uid',
        page: 1,
        pageSize: 1,
      });
    const portals = response.body.data as Array<Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(portals.map((portal) => portal.uid)).toEqual(['desktop-runtime-portal', 'mobile-runtime-portal']);
    for (const portal of portals) {
      expect(portal.enabled).toBe(true);
      expect(Object.keys(portal).sort()).toEqual([...MULTI_PORTAL_RUNTIME_FIELDS].sort());
      expect(Object.keys(portal.uiLayout as Record<string, unknown>).sort()).toEqual(['layoutType']);
    }
    expect(portals[0]).toMatchObject({
      title: 'Desktop runtime portal',
      routeName: 'desktopRuntimePortal',
      routePath: '/desktop-runtime-portal',
      uiLayout: {
        layoutType: DEFAULT_ADMIN_UI_LAYOUT.layoutType,
      },
    });
    expect(portals[1]).toMatchObject({
      title: 'Mobile runtime portal',
      routeName: 'mobileRuntimePortal',
      routePath: '/mobile-runtime-portal',
      authCheck: false,
      uiLayout: {
        layoutType: DEFAULT_MOBILE_UI_LAYOUT.layoutType,
      },
    });
  });

  it('should register the pm.multi-portal ACL snippet with management actions only', async () => {
    app = await createMultiPortalAclMockServer();

    const snippet = app.acl.snippetManager.snippets.get('pm.multi-portal');
    const roleSnippet = app.acl.snippetManager.snippets.get('pm.acl.roles');

    expect(snippet).toBeDefined();
    expect(snippet?.actions.sort()).toEqual([...MULTI_PORTAL_MANAGEMENT_ACTIONS].sort());
    expect(snippet?.actions).not.toContain('multiPortals:listEnabled');
    expect(snippet?.actions).not.toContain('rolesMultiPortalRoutePolicies:*');
    expect(roleSnippet).toBeDefined();
    expect(roleSnippet?.actions).toEqual(expect.arrayContaining(ROLE_MULTI_PORTAL_PERMISSION_ACTIONS));
  });

  it('should keep multiPortals management actions behind plugin configuration snippets', async () => {
    app = await createMultiPortalAclMockServer();

    const repository = app.db.getRepository('multiPortals');
    const deniedPortal = await repository.create({
      values: {
        uid: 'management-denied-portal',
        title: 'Management denied portal',
        routeName: 'managementDeniedPortal',
        routePath: '/management-denied-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-no-snippet',
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-pm-all',
        snippets: ['pm.*'],
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'multi-portal-negated',
        snippets: ['pm.*', '!pm.multi-portal'],
      },
    });
    const noSnippetUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-no-snippet'],
      },
    });
    const pmAllUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-pm-all'],
      },
    });
    const negatedUser = await app.db.getRepository('users').create({
      values: {
        roles: ['multi-portal-negated'],
      },
    });
    const noSnippetAgent = await app.agent().login(noSnippetUser);
    const pmAllAgent = await app.agent().login(pmAllUser);
    const negatedAgent = await app.agent().login(negatedUser);

    const noSnippetResponses = [
      await noSnippetAgent.resource('multiPortals').list(),
      await noSnippetAgent.resource('multiPortals').get({
        filterByTk: deniedPortal.get('uid'),
      }),
      await noSnippetAgent.resource('multiPortals').create({
        values: {
          uid: 'management-no-snippet-portal',
          title: 'Management no snippet portal',
          routeName: 'managementNoSnippetPortal',
          routePath: '/management-no-snippet-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      await noSnippetAgent.resource('multiPortals').update({
        filterByTk: deniedPortal.get('uid'),
        values: {
          title: 'Management no snippet portal updated',
        },
      }),
      await noSnippetAgent.resource('multiPortals').destroy({
        filterByTk: deniedPortal.get('uid'),
      }),
    ];

    expect(noSnippetResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);

    const createResponse = await pmAllAgent.resource('multiPortals').create({
      values: {
        uid: 'management-allowed-portal',
        title: 'Management allowed portal',
        routeName: 'managementAllowedPortal',
        routePath: '/management-allowed-portal',
        authCheck: true,
        enabled: true,
        uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    expect(createResponse.status).toBe(200);
    const createdPortalUid = createResponse.body.data.uid;
    const managementResponses = [
      await pmAllAgent.resource('multiPortals').list(),
      await pmAllAgent.resource('multiPortals').get({
        filterByTk: createdPortalUid,
      }),
      createResponse,
      await pmAllAgent.resource('multiPortals').update({
        filterByTk: createdPortalUid,
        values: {
          title: 'Management allowed portal updated',
        },
      }),
      await pmAllAgent.resource('multiPortals').destroy({
        filterByTk: createdPortalUid,
      }),
    ];

    expect(managementResponses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200]);

    const negatedResponses = await Promise.all([
      negatedAgent.resource('multiPortals').list(),
      negatedAgent.resource('multiPortals').get({
        filterByTk: deniedPortal.get('uid'),
      }),
      negatedAgent.resource('multiPortals').create({
        values: {
          uid: 'management-negated-portal',
          title: 'Management negated portal',
          routeName: 'managementNegatedPortal',
          routePath: '/management-negated-portal',
          authCheck: true,
          enabled: true,
          uiLayoutUid: DEFAULT_ADMIN_UI_LAYOUT.uid,
        },
      }),
      negatedAgent.resource('multiPortals').update({
        filterByTk: deniedPortal.get('uid'),
        values: {
          title: 'Management denied portal updated',
        },
      }),
      negatedAgent.resource('multiPortals').destroy({
        filterByTk: deniedPortal.get('uid'),
      }),
    ]);

    expect(negatedResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });
});
