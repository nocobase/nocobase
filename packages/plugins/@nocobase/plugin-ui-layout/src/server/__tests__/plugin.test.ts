/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import type { PluginUiLayoutServer } from '../plugin';

describe('plugin-ui-layout server', () => {
  let app: MockServer | undefined;

  afterEach(async () => {
    await app?.destroy();
    app = undefined;
  });

  it('should ensure the default AdminLayout record exists on install', async () => {
    app = await createMockServer({
      plugins: ['ui-layout'],
    });
    await app.db.sync();

    await app.db.getRepository('uiLayouts').destroy({
      truncate: true,
    });

    const plugin = app.pm.get('ui-layout') as PluginUiLayoutServer;
    await plugin.install();

    const record = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });

    expect(record?.get('layoutType')).toBe(DEFAULT_ADMIN_UI_LAYOUT.layoutType);
    expect(record?.get('routeName')).toBe(DEFAULT_ADMIN_UI_LAYOUT.routeName);
    expect(record?.get('routePath')).toBe(DEFAULT_ADMIN_UI_LAYOUT.routePath);
    expect(record?.get('authCheck')).toBe(DEFAULT_ADMIN_UI_LAYOUT.authCheck);
    expect(record?.get('enabled')).toBe(DEFAULT_ADMIN_UI_LAYOUT.enabled);
  });

  it('should associate desktop routes with ui layouts by uid without breaking existing relations', async () => {
    app = await createMockServer({
      plugins: [
        'error-handler',
        'client',
        'field-sort',
        'acl',
        'ui-schema-storage',
        'system-settings',
        'data-source-main',
        'data-source-manager',
        'ui-layout',
      ],
    });

    const adminLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    if (!adminLayout) {
      throw new Error('Default AdminLayout ui layout should exist.');
    }
    const mobileLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'mobile-layout-model-test',
        layoutType: 'mobile',
        routeName: 'mobile',
        routePath: '/v/mobile',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-relation-role',
      },
    });
    const parentRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'group',
        title: 'layout relation parent',
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'layout relation page',
        parentId: parentRoute.get('id'),
        schemaUid: 'layout-relation-page',
      },
    });
    await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        title: 'layout relation child',
        parentId: route.get('id'),
        hidden: true,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.roles', route.get('id')).add({
      tk: [role.get('name')],
    });

    const savedRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: route.get('id'),
      appends: ['uiLayouts', 'roles', 'children', 'parent'],
    });

    expect(savedRoute?.get('uiLayouts').map((layout) => layout.get('uid'))).toEqual(
      expect.arrayContaining([DEFAULT_ADMIN_UI_LAYOUT.uid, 'mobile-layout-model-test']),
    );
    expect(savedRoute?.get('roles').map((item) => item.get('name'))).toContain('layout-relation-role');
    expect(savedRoute?.get('children').map((item) => item.get('title'))).toContain('layout relation child');
    expect(savedRoute?.get('parent').get('title')).toBe('layout relation parent');
  });

  it('should default listAccessible layout filtering to AdminLayout', async () => {
    app = await createMockServer({
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
      ],
    });

    const adminLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    if (!adminLayout) {
      throw new Error('Default AdminLayout ui layout should exist.');
    }
    const mobileLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'mobile-layout-default-test',
        layoutType: 'mobile',
        routeName: 'mobile-default-test',
        routePath: '/v/mobile-default-test',
        authCheck: true,
        enabled: true,
      },
    });

    const unassignedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-UNASSIGNED',
        schemaUid: 'layout-default-unassigned',
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-ADMIN-ONLY',
        schemaUid: 'layout-default-admin-only',
      },
    });
    const mobileRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-MOBILE-ONLY',
        schemaUid: 'layout-default-mobile-only',
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const agent = await app.agent().login(rootUser);

    const responses = await Promise.all([
      agent.get('/desktopRoutes:listAccessible'),
      agent.get('/desktopRoutes:listAccessible').query({ layout: '' }),
      agent.get('/desktopRoutes:listAccessible').query({ layout: DEFAULT_ADMIN_UI_LAYOUT.uid }),
    ]);
    const routeIdSets = responses.map((response) => response.body.data.map((route) => String(route.id)).sort());
    const routeTitleSets = responses.map((response) => response.body.data.map((route) => route.title).sort());

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(routeIdSets[0]).toEqual(routeIdSets[1]);
    expect(routeIdSets[0]).toEqual(routeIdSets[2]);
    expect(routeIdSets[0]).toEqual(
      expect.arrayContaining([String(unassignedRoute.get('id')), String(adminRoute.get('id'))]),
    );
    expect(routeIdSets[0]).not.toContain(String(mobileRoute.get('id')));
    expect(routeTitleSets[0]).toEqual(routeTitleSets[1]);
    expect(routeTitleSets[0]).toEqual(routeTitleSets[2]);
    expect(routeTitleSets[0]).toEqual(expect.arrayContaining([unassignedRoute.get('title'), adminRoute.get('title')]));
    expect(routeTitleSets[0]).not.toContain(mobileRoute.get('title'));
  });

  it('should filter root routes by layout while preserving tree sort and caller filters', async () => {
    app = await createMockServer({
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
      ],
    });

    const adminLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    if (!adminLayout) {
      throw new Error('Default AdminLayout ui layout should exist.');
    }
    const mobileLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'mobile-layout-root-filter-test',
        layoutType: 'mobile',
        routeName: 'mobile-root-filter-test',
        routePath: '/v/mobile-root-filter-test',
        authCheck: true,
        enabled: true,
      },
    });

    const mobileOnlyRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-MOBILE-ONLY',
        schemaUid: 'layout-root-filter-mobile-only',
        hidden: false,
        sort: 10,
      },
    });
    const adminOnlyRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-ADMIN-ONLY',
        schemaUid: 'layout-root-filter-admin-only',
        hidden: false,
        sort: 20,
      },
    });
    const sharedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-SHARED',
        schemaUid: 'layout-root-filter-shared',
        hidden: false,
        sort: 30,
      },
    });
    const hiddenSharedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROUTE-SHARED-HIDDEN',
        schemaUid: 'layout-root-filter-shared-hidden',
        hidden: true,
        sort: 40,
      },
    });
    const sharedChildRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        title: 'DATA-ROUTE-SHARED-CHILD',
        parentId: sharedRoute.get('id'),
        hidden: false,
        sort: 1,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', mobileOnlyRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminOnlyRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', sharedRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', hiddenSharedRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', sharedChildRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const agent = await app.agent().login(rootUser);
    const visibleFilter = {
      hidden: false,
      id: [adminOnlyRoute.get('id'), mobileOnlyRoute.get('id'), sharedRoute.get('id'), hiddenSharedRoute.get('id')],
    };

    const [adminResponse, mobileResponse] = await Promise.all([
      agent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        filter: visibleFilter,
      }),
      agent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout.get('uid'),
        filter: visibleFilter,
      }),
    ]);
    const [adminTreeResponse, mobileTreeResponse] = await Promise.all([
      agent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      agent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout.get('uid'),
      }),
    ]);
    const adminTitles = adminResponse.body.data.map((route) => route.title);
    const mobileTitles = mobileResponse.body.data.map((route) => route.title);
    const adminTreeTitles = adminTreeResponse.body.data.map((route) => route.title);
    const mobileTreeTitles = mobileTreeResponse.body.data.map((route) => route.title);

    expect(adminResponse.status).toBe(200);
    expect(mobileResponse.status).toBe(200);
    expect(adminTreeResponse.status).toBe(200);
    expect(mobileTreeResponse.status).toBe(200);
    expect(adminTitles).toEqual(['DATA-ROUTE-ADMIN-ONLY', 'DATA-ROUTE-SHARED']);
    expect(mobileTitles).toEqual(['DATA-ROUTE-MOBILE-ONLY', 'DATA-ROUTE-SHARED']);
    expect(adminTitles).not.toContain('DATA-ROUTE-MOBILE-ONLY');
    expect(mobileTitles).not.toContain('DATA-ROUTE-ADMIN-ONLY');
    expect(adminTitles).not.toContain('DATA-ROUTE-SHARED-HIDDEN');
    expect(mobileTitles).not.toContain('DATA-ROUTE-SHARED-HIDDEN');
    expect(adminTreeTitles).toEqual(['DATA-ROUTE-ADMIN-ONLY', 'DATA-ROUTE-SHARED', 'DATA-ROUTE-SHARED-HIDDEN']);
    expect(mobileTreeTitles).toEqual(['DATA-ROUTE-MOBILE-ONLY', 'DATA-ROUTE-SHARED', 'DATA-ROUTE-SHARED-HIDDEN']);
    expect(adminTreeTitles).not.toContain('DATA-ROUTE-SHARED-CHILD');
    expect(mobileTreeTitles).not.toContain('DATA-ROUTE-SHARED-CHILD');
  });

  it('should enforce role permissions and layout filtering together for non-root users', async () => {
    app = await createMockServer({
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
      ],
    });

    const adminLayout = await app.db.getRepository('uiLayouts').findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    if (!adminLayout) {
      throw new Error('Default AdminLayout ui layout should exist.');
    }
    const mobileLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'mobile-layout-role-filter-test',
        layoutType: 'mobile',
        routeName: 'mobile-role-filter-test',
        routePath: '/v/mobile-role-filter-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-role-filter-member',
      },
    });

    const adminAllowedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-LAYOUT-ADMIN-ALLOWED',
        schemaUid: 'layout-role-filter-admin-allowed',
        hidden: false,
        sort: 10,
      },
    });
    const mobileAllowedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-LAYOUT-MOBILE-ALLOWED',
        schemaUid: 'layout-role-filter-mobile-allowed',
        hidden: false,
        sort: 20,
      },
    });
    const mobileDeniedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-LAYOUT-MOBILE-DENIED',
        schemaUid: 'layout-role-filter-mobile-denied',
        hidden: false,
        sort: 30,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', adminAllowedRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileAllowedRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileDeniedRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.roles', adminAllowedRoute.get('id')).add({
      tk: [role.get('name')],
    });
    await app.db.getRepository('desktopRoutes.roles', mobileAllowedRoute.get('id')).add({
      tk: [role.get('name')],
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const agent = await app.agent().login(memberUser);

    const adminResponse = await agent.get('/desktopRoutes:listAccessible').query({
      layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
    });
    const mobileResponse = await agent.get('/desktopRoutes:listAccessible').query({
      layout: mobileLayout.get('uid'),
    });
    const adminTitles = adminResponse.body.data.map((route) => route.title);
    const mobileTitles = mobileResponse.body.data.map((route) => route.title);

    expect(adminResponse.status).toBe(200);
    expect(mobileResponse.status).toBe(200);
    expect(adminTitles).toEqual(['DATA-ROLE-LAYOUT-ADMIN-ALLOWED']);
    expect(mobileTitles).toEqual(['DATA-ROLE-LAYOUT-MOBILE-ALLOWED']);
    expect(adminTitles).not.toContain('DATA-ROLE-LAYOUT-MOBILE-ALLOWED');
    expect(adminTitles).not.toContain('DATA-ROLE-LAYOUT-MOBILE-DENIED');
    expect(mobileTitles).not.toContain('DATA-ROLE-LAYOUT-ADMIN-ALLOWED');
    expect(mobileTitles).not.toContain('DATA-ROLE-LAYOUT-MOBILE-DENIED');
  });
});
