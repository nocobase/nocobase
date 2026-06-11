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

  it('should define role multi-portal permission relation', async () => {
    app = await createMultiPortalAclMockServer();
    await app.db.sync();

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
    await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
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
          layout: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:listAccessible').query({
          layout: deniedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          layout: allowedPortal.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: route.get('id'),
          layout: deniedPortal.get('uid'),
        }),
        rootAgent.get('/desktopRoutes:listAccessible').query({
          layout: deniedPortal.get('uid'),
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
    await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
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
        layout: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        layout: secondPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        layout: firstPortal.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: route.get('id'),
        layout: secondPortal.get('uid'),
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

    for (const route of [uiLayoutRoute, firstPortalRoute, secondPortalRoute]) {
      await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
        tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
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
          layout: portalUid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: firstPortalRoute.get('id'),
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: uiLayoutRoute.get('id'),
          layout: portalUid,
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
    await app.db.getRepository('desktopRoutes.uiLayouts', parentRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', childRoute.get('id')).set({
      tk: [DEFAULT_ADMIN_UI_LAYOUT.uid],
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
        layout: portal.get('uid'),
      });

      expect(response.status).toBe(200);
      return collectRouteTitles(response.body.data as RouteResponseItem[]);
    };

    await resetRoutePermissions([childRoute.get('id')]);
    const childOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      layout: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual([]);
    expect(childOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id')]);
    const parentOnlyParentGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: parentRoute.get('id'),
      layout: portal.get('uid'),
    });
    const parentOnlyChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      layout: portal.get('uid'),
    });
    expect(await listAccessibleRouteTitles()).toEqual(['DATA-PORTAL-PARENT-ROUTE']);
    expect(parentOnlyParentGetResponse.body.data.title).toBe('DATA-PORTAL-PARENT-ROUTE');
    expect(parentOnlyChildGetResponse.body.data ?? null).toBeNull();

    await resetRoutePermissions([parentRoute.get('id'), childRoute.get('id')]);
    const parentAndChildGetResponse = await memberAgent.get('/desktopRoutes:getAccessible').query({
      filterByTk: childRoute.get('id'),
      layout: portal.get('uid'),
    });
    const rootListResponse = await rootAgent.get('/desktopRoutes:listAccessible').query({
      layout: portal.get('uid'),
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
});
