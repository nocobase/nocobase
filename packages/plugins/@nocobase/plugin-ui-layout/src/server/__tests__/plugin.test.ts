/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';
import { DEFAULT_ADMIN_UI_LAYOUT } from '../../constants';
import { ensureDefaultUiLayout } from '../ensureDefaultUiLayout';
import type { PluginUiLayoutServer } from '../plugin';

const UI_LAYOUT_MANAGEMENT_ACTIONS = [
  'uiLayouts:list',
  'uiLayouts:get',
  'uiLayouts:create',
  'uiLayouts:update',
  'uiLayouts:destroy',
];

const UI_LAYOUT_RUNTIME_FIELDS = ['uid', 'title', 'layoutType', 'routeName', 'routePath', 'authCheck', 'enabled'];

async function createUiLayoutMockServer() {
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
    ],
  });
}

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
    expect(record?.get('title')).toBe('Desktop layout');
    expect(record?.get('routeName')).toBe(DEFAULT_ADMIN_UI_LAYOUT.routeName);
    expect(record?.get('routePath')).toBe(DEFAULT_ADMIN_UI_LAYOUT.routePath);
    expect(record?.get('authCheck')).toBe(DEFAULT_ADMIN_UI_LAYOUT.authCheck);
    expect(record?.get('enabled')).toBe(DEFAULT_ADMIN_UI_LAYOUT.enabled);
  });

  it('should rollback default AdminLayout creation when title backfill fails', async () => {
    app = await createMockServer({
      plugins: ['ui-layout'],
    });
    await app.db.sync();

    const repository = app.db.getRepository('uiLayouts');
    await repository.destroy({
      truncate: true,
    });
    const originalFind = repository.find.bind(repository);
    const findSpy = vi.spyOn(repository, 'find').mockImplementation((async (options) => {
      if (options?.limit === 1) {
        return [];
      }

      throw new Error('title backfill failed');
    }) as typeof repository.find);

    await expect(ensureDefaultUiLayout(app.db)).rejects.toThrow(/title backfill failed/);

    findSpy.mockRestore();
    const record = await originalFind({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    expect(record).toHaveLength(0);
  });

  it('should backfill generated ui layout titles', async () => {
    app = await createMockServer({
      plugins: ['ui-layout'],
    });
    await app.db.sync();

    const repository = app.db.getRepository('uiLayouts');
    const adminLayout = await repository.findOne({
      filter: {
        uid: DEFAULT_ADMIN_UI_LAYOUT.uid,
      },
    });
    if (!adminLayout) {
      throw new Error('Default AdminLayout ui layout should exist.');
    }
    const mobileLayout = await repository.create({
      values: {
        uid: 'mobile-generated-title-test',
        title: 'Untitled',
        layoutType: 'mobile',
        routeName: 'mobile-generated-title-test',
        routePath: '/v/mobile-generated-title-test',
        authCheck: true,
        enabled: true,
      },
    });
    await repository.update({
      filterByTk: adminLayout.get('id'),
      values: {
        title: 'Untitled',
      },
    });

    await ensureDefaultUiLayout(app.db);

    const updatedAdminLayout = await repository.findOne({
      filterByTk: adminLayout.get('id'),
    });
    const updatedMobileLayout = await repository.findOne({
      filterByTk: mobileLayout.get('id'),
    });

    expect(updatedAdminLayout?.get('title')).toBe(DEFAULT_ADMIN_UI_LAYOUT.title);
    expect(updatedMobileLayout?.get('title')).toBe('Mobile layout');
  });

  it('should persist the role-level default ui layout access flag', async () => {
    app = await createUiLayoutMockServer();

    expect(app.db.getCollection('roles').getField('allowNewUiLayout')).toBeDefined();

    await app.db.getRepository('roles').create({
      values: {
        name: 'layout-default-access-role',
        allowNewUiLayout: false,
      },
    });

    await app.db.getRepository('roles').update({
      filterByTk: 'layout-default-access-role',
      values: {
        allowNewUiLayout: true,
      },
    });

    const role = await app.db.getRepository('roles').findOne({
      filterByTk: 'layout-default-access-role',
    });

    expect(role?.get('allowNewUiLayout')).toBe(true);
  });

  it('should grant new enabled ui layouts by the role default layout access policy', async () => {
    app = await createUiLayoutMockServer();

    await app.db.getRepository('roles').create({
      values: {
        name: 'new-layout-default-allowed',
        allowNewUiLayout: true,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'new-layout-default-denied',
        allowNewUiLayout: false,
      },
    });

    await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'default-policy-new-layout',
        title: 'Default policy new layout',
        layoutType: 'mobile',
        routeName: 'defaultPolicyNewLayout',
        routePath: '/default-policy-new-layout',
        authCheck: true,
        enabled: true,
      },
    });

    const layoutAccessRecords = await app.db.getRepository('rolesUiLayouts').find({
      filter: {
        roleName: ['new-layout-default-allowed', 'new-layout-default-denied'],
      },
      sort: ['roleName', 'uiLayoutUid'],
    });
    const layoutAccessKeys = layoutAccessRecords.map(
      (record) => `${record.get('roleName')}:${record.get('uiLayoutUid')}`,
    );
    const menuPermissionCount = await app.db.getRepository('rolesUiLayoutDesktopRoutes').count({
      filter: {
        roleName: 'new-layout-default-allowed',
        uiLayoutUid: 'default-policy-new-layout',
      },
    });

    expect(layoutAccessKeys).toEqual(['new-layout-default-allowed:default-policy-new-layout']);
    expect(layoutAccessKeys).not.toContain(`new-layout-default-allowed:${DEFAULT_ADMIN_UI_LAYOUT.uid}`);
    expect(menuPermissionCount).toBe(0);
  });

  it('should grant new desktop routes by the role default menu access policy per layout', async () => {
    app = await createUiLayoutMockServer();

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
        uid: 'default-policy-menu-mobile',
        title: 'Default policy menu mobile',
        layoutType: 'mobile',
        routeName: 'defaultPolicyMenuMobile',
        routePath: '/default-policy-menu-mobile',
        authCheck: true,
        enabled: true,
      },
    });
    const allowedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'new-route-default-allowed',
        allowNewMenu: true,
      },
    });
    const deniedRole = await app.db.getRepository('roles').create({
      values: {
        name: 'new-route-default-denied',
        allowNewMenu: false,
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: allowedRole.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: allowedRole.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: deniedRole.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: deniedRole.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const adminRouteResponse = await rootAgent.resource('desktopRoutes').create({
      layout: adminLayout.get('uid'),
      values: {
        type: 'flowPage',
        title: 'DATA-DEFAULT-MENU-ADMIN',
        schemaUid: 'default-menu-admin',
      },
    });
    const mobileRouteResponse = await rootAgent.resource('desktopRoutes').create({
      layout: mobileLayout.get('uid'),
      values: {
        type: 'flowPage',
        title: 'DATA-DEFAULT-MENU-MOBILE',
        schemaUid: 'default-menu-mobile',
      },
    });
    const adminRouteId = adminRouteResponse.body.data.id;
    const mobileRouteId = mobileRouteResponse.body.data.id;

    const scopedMenuPermissions = await app.db.getRepository('rolesUiLayoutDesktopRoutes').find({
      filter: {
        roleName: [allowedRole.get('name'), deniedRole.get('name')],
      },
      sort: ['roleName', 'uiLayoutUid', 'desktopRouteId'],
    });
    const scopedMenuPermissionKeys = scopedMenuPermissions.map(
      (permission) =>
        `${permission.get('roleName')}:${permission.get('uiLayoutUid')}:${permission.get('desktopRouteId')}`,
    );
    const legacyAllowedRole = await app.db.getRepository('roles').findOne({
      filterByTk: allowedRole.get('name'),
      appends: ['desktopRoutes'],
    });
    const legacyDeniedRole = await app.db.getRepository('roles').findOne({
      filterByTk: deniedRole.get('name'),
      appends: ['desktopRoutes'],
    });

    expect(scopedMenuPermissionKeys).toEqual([
      `${allowedRole.get('name')}:${adminLayout.get('uid')}:${adminRouteId}`,
      `${allowedRole.get('name')}:${mobileLayout.get('uid')}:${mobileRouteId}`,
    ]);
    expect(scopedMenuPermissionKeys).not.toContain(
      `${deniedRole.get('name')}:${adminLayout.get('uid')}:${adminRouteId}`,
    );
    expect(scopedMenuPermissionKeys).not.toContain(
      `${deniedRole.get('name')}:${mobileLayout.get('uid')}:${mobileRouteId}`,
    );
    expect(
      legacyAllowedRole
        ?.get('desktopRoutes')
        .map((route) => route.get('id'))
        .sort(),
    ).toEqual([adminRouteId, mobileRouteId].sort());
    expect(legacyDeniedRole?.get('desktopRoutes')).toEqual([]);
  });

  it('should sync legacy role desktop route writes to layout-scoped menu permissions', async () => {
    app = await createUiLayoutMockServer();

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
        uid: 'legacy-route-sync-mobile',
        title: 'Legacy route sync mobile',
        layoutType: 'mobile',
        routeName: 'legacyRouteSyncMobile',
        routePath: '/legacy-route-sync-mobile',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'legacy-route-sync-role',
        allowNewMenu: false,
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LEGACY-SYNC-ADMIN',
        schemaUid: 'legacy-sync-admin',
      },
    });
    const mobileRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LEGACY-SYNC-MOBILE',
        schemaUid: 'legacy-sync-mobile',
      },
    });
    const sharedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LEGACY-SYNC-SHARED',
        schemaUid: 'legacy-sync-shared',
      },
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', sharedRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const findScopedKeys = async () => {
      const records = await app.db.getRepository('rolesUiLayoutDesktopRoutes').find({
        filter: {
          roleName: role.get('name'),
        },
        sort: ['uiLayoutUid', 'desktopRouteId'],
      });

      return records.map((record) => `${record.get('uiLayoutUid')}:${record.get('desktopRouteId')}`);
    };

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [sharedRoute.get('id')],
    });
    expect(await findScopedKeys()).toEqual([
      `${adminLayout.get('uid')}:${sharedRoute.get('id')}`,
      `${mobileLayout.get('uid')}:${sharedRoute.get('id')}`,
    ]);

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).remove({
      values: [sharedRoute.get('id')],
    });
    expect(await findScopedKeys()).toEqual([]);

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).set({
      values: [adminRoute.get('id'), mobileRoute.get('id')],
    });
    expect(await findScopedKeys()).toEqual([
      `${adminLayout.get('uid')}:${adminRoute.get('id')}`,
      `${mobileLayout.get('uid')}:${mobileRoute.get('id')}`,
    ]);

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).set({
      values: [mobileRoute.get('id')],
    });
    expect(await findScopedKeys()).toEqual([`${mobileLayout.get('uid')}:${mobileRoute.get('id')}`]);
  });

  it('should initialize existing legacy route permissions into layout-scoped permissions idempotently', async () => {
    app = await createUiLayoutMockServer();

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
        uid: 'legacy-init-mobile',
        title: 'Legacy init mobile',
        layoutType: 'mobile',
        routeName: 'legacyInitMobile',
        routePath: '/legacy-init-mobile',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'legacy-init-role',
        allowNewMenu: false,
      },
    });
    const sharedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LEGACY-INIT-SHARED',
        schemaUid: 'legacy-init-shared',
      },
    });
    const unassignedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LEGACY-INIT-UNASSIGNED',
        schemaUid: 'legacy-init-unassigned',
      },
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', sharedRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });

    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [sharedRoute.get('id'), unassignedRoute.get('id')],
    });
    await app.db.getRepository('rolesUiLayouts').destroy({
      filter: {
        roleName: role.get('name'),
      },
    });
    await app.db.getRepository('rolesUiLayoutDesktopRoutes').destroy({
      filter: {
        roleName: role.get('name'),
      },
    });

    const plugin = app.pm.get('ui-layout') as PluginUiLayoutServer;
    await plugin.afterEnable();
    await plugin.afterEnable();

    const layoutAccessRecords = await app.db.getRepository('rolesUiLayouts').find({
      filter: {
        roleName: role.get('name'),
      },
      sort: ['uiLayoutUid'],
    });
    const scopedRouteRecords = await app.db.getRepository('rolesUiLayoutDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
      },
      sort: ['uiLayoutUid', 'desktopRouteId'],
    });
    const legacyRouteRecords = await app.db.getRepository('rolesDesktopRoutes').find({
      filter: {
        roleName: role.get('name'),
      },
      sort: ['desktopRouteId'],
    });

    expect(layoutAccessRecords.map((record) => `${record.get('roleName')}:${record.get('uiLayoutUid')}`)).toEqual([
      `${role.get('name')}:${DEFAULT_ADMIN_UI_LAYOUT.uid}`,
    ]);
    expect(
      scopedRouteRecords.map(
        (record) => `${record.get('roleName')}:${record.get('uiLayoutUid')}:${record.get('desktopRouteId')}`,
      ),
    ).toEqual([
      `${role.get('name')}:${DEFAULT_ADMIN_UI_LAYOUT.uid}:${sharedRoute.get('id')}`,
      `${role.get('name')}:${DEFAULT_ADMIN_UI_LAYOUT.uid}:${unassignedRoute.get('id')}`,
      `${role.get('name')}:${mobileLayout.get('uid')}:${sharedRoute.get('id')}`,
    ]);
    expect(legacyRouteRecords.map((record) => record.get('desktopRouteId'))).toEqual([
      sharedRoute.get('id'),
      unassignedRoute.get('id'),
    ]);
  });

  it('should expose uiLayouts:listAccessible to logged-in users only', async () => {
    app = await createUiLayoutMockServer();

    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'runtime-layout-reader',
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const agent = await app.agent().login(user);

    const [guestResponse, userResponse] = await Promise.all([
      app.agent().get('/uiLayouts:listAccessible'),
      agent.get('/uiLayouts:listAccessible'),
    ]);

    expect(guestResponse.status).toBe(401);
    expect(userResponse.status).toBe(200);
  });

  it('should filter uiLayouts:listAccessible by role layout access', async () => {
    app = await createUiLayoutMockServer();

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
        uid: 'runtime-layout-role-filter-mobile',
        title: 'Runtime role filter mobile',
        layoutType: 'mobile',
        routeName: 'runtimeRoleFilterMobile',
        routePath: '/runtime-role-filter-mobile',
        authCheck: true,
        enabled: true,
      },
    });
    await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'runtime-layout-role-filter-disabled',
        title: 'Runtime role filter disabled',
        layoutType: 'mobile',
        routeName: 'runtimeRoleFilterDisabled',
        routePath: '/runtime-role-filter-disabled',
        authCheck: true,
        enabled: false,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'runtime-layout-role-filter-member',
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const memberAgent = await app.agent().login(user);
    const rootAgent = await app.agent().login(rootUser);

    const [guestResponse, memberResponse, rootResponse] = await Promise.all([
      app.agent().get('/uiLayouts:listAccessible'),
      memberAgent.get('/uiLayouts:listAccessible'),
      rootAgent.get('/uiLayouts:listAccessible'),
    ]);
    const memberUids = memberResponse.body.data.map((layout) => layout.uid);
    const rootUids = rootResponse.body.data.map((layout) => layout.uid);

    expect(guestResponse.status).toBe(401);
    expect(memberResponse.status).toBe(200);
    expect(rootResponse.status).toBe(200);
    expect(memberUids).toEqual([DEFAULT_ADMIN_UI_LAYOUT.uid]);
    expect(memberUids).not.toContain(mobileLayout.get('uid'));
    expect(rootUids).toEqual(expect.arrayContaining([DEFAULT_ADMIN_UI_LAYOUT.uid, mobileLayout.get('uid')]));
    expect(rootUids).not.toContain('runtime-layout-role-filter-disabled');
  });

  it('should return only enabled uiLayouts with runtime fields in id ascending order', async () => {
    app = await createUiLayoutMockServer();

    const repository = app.db.getRepository('uiLayouts');
    await repository.destroy({
      truncate: true,
    });
    await repository.create({
      values: {
        uid: 'runtime-layout-enabled-a',
        title: 'Runtime layout A',
        layoutType: 'desktop',
        routeName: 'runtimeLayoutA',
        routePath: '/runtime-layout-a',
        authCheck: true,
        enabled: true,
      },
    });
    await repository.create({
      values: {
        uid: 'runtime-layout-disabled',
        title: 'Runtime layout disabled',
        layoutType: 'mobile',
        routeName: 'runtimeLayoutDisabled',
        routePath: '/runtime-layout-disabled',
        authCheck: true,
        enabled: false,
      },
    });
    await repository.create({
      values: {
        uid: 'runtime-layout-enabled-b',
        title: 'Runtime layout B',
        layoutType: 'mobile',
        routeName: 'runtimeLayoutB',
        routePath: '/runtime-layout-b',
        authCheck: false,
        enabled: true,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const agent = await app.agent().login(rootUser);

    const response = await agent.get('/uiLayouts:listAccessible').query({
      filter: {
        enabled: false,
      },
      fields: ['id', 'uid'],
      appends: ['desktopRoutes'],
      pageSize: 1,
      sort: ['-id'],
    });

    const runtimeLayouts = response.body.data as Array<Record<string, unknown>>;

    expect(response.status).toBe(200);
    expect(runtimeLayouts.map((layout) => layout.uid)).toEqual([
      'runtime-layout-enabled-a',
      'runtime-layout-enabled-b',
    ]);
    expect(runtimeLayouts).toHaveLength(2);
    expect(runtimeLayouts.every((layout) => layout.enabled === true)).toBe(true);
    for (const layout of runtimeLayouts) {
      expect(Object.keys(layout).sort()).toEqual([...UI_LAYOUT_RUNTIME_FIELDS].sort());
      expect(layout).not.toHaveProperty('id');
      expect(layout).not.toHaveProperty('desktopRoutes');
    }
  });

  it('should register the pm.ui-layout ACL snippet with management actions only', async () => {
    app = await createUiLayoutMockServer();

    const snippet = app.acl.snippetManager.snippets.get('pm.ui-layout');

    expect(snippet).toBeDefined();
    expect(snippet?.actions.sort()).toEqual([...UI_LAYOUT_MANAGEMENT_ACTIONS].sort());
    expect(snippet?.actions).not.toContain('uiLayouts:listAccessible');
  });

  it('should keep uiLayouts management actions behind plugin configuration snippets', async () => {
    app = await createUiLayoutMockServer();

    const repository = app.db.getRepository('uiLayouts');
    const deniedLayout = await repository.create({
      values: {
        uid: 'management-denied-layout',
        title: 'Management denied layout',
        layoutType: 'mobile',
        routeName: 'managementDeniedLayout',
        routePath: '/management-denied-layout',
        authCheck: true,
        enabled: true,
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'ui-layout-no-snippet',
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'ui-layout-pm-all',
        snippets: ['pm.*'],
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'ui-layout-negated',
        snippets: ['pm.*', '!pm.ui-layout'],
      },
    });
    const noSnippetUser = await app.db.getRepository('users').create({
      values: {
        roles: ['ui-layout-no-snippet'],
      },
    });
    const pmAllUser = await app.db.getRepository('users').create({
      values: {
        roles: ['ui-layout-pm-all'],
      },
    });
    const negatedUser = await app.db.getRepository('users').create({
      values: {
        roles: ['ui-layout-negated'],
      },
    });
    const noSnippetAgent = await app.agent().login(noSnippetUser);
    const pmAllAgent = await app.agent().login(pmAllUser);
    const negatedAgent = await app.agent().login(negatedUser);

    const noSnippetResponses = [
      await noSnippetAgent.resource('uiLayouts').list(),
      await noSnippetAgent.resource('uiLayouts').get({
        filterByTk: deniedLayout.get('id'),
      }),
      await noSnippetAgent.resource('uiLayouts').create({
        values: {
          uid: 'management-no-snippet-layout',
          title: 'Management no snippet layout',
          layoutType: 'mobile',
          routeName: 'managementNoSnippetLayout',
          routePath: '/management-no-snippet-layout',
          authCheck: true,
          enabled: true,
        },
      }),
      await noSnippetAgent.resource('uiLayouts').update({
        filterByTk: deniedLayout.get('id'),
        values: {
          title: 'Management no snippet layout updated',
        },
      }),
      await noSnippetAgent.resource('uiLayouts').destroy({
        filterByTk: deniedLayout.get('id'),
      }),
    ];

    expect(noSnippetResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);

    const createResponse = await pmAllAgent.resource('uiLayouts').create({
      values: {
        uid: 'management-allowed-layout',
        title: 'Management allowed layout',
        layoutType: 'mobile',
        routeName: 'managementAllowedLayout',
        routePath: '/management-allowed-layout',
        authCheck: true,
        enabled: true,
      },
    });
    expect(createResponse.status).toBe(200);
    const createdLayoutId = createResponse.body.data.id;
    const managementResponses = [
      await pmAllAgent.resource('uiLayouts').list(),
      await pmAllAgent.resource('uiLayouts').get({
        filterByTk: createdLayoutId,
      }),
      createResponse,
      await pmAllAgent.resource('uiLayouts').update({
        filterByTk: createdLayoutId,
        values: {
          title: 'Management allowed layout updated',
        },
      }),
      await pmAllAgent.resource('uiLayouts').destroy({
        filterByTk: createdLayoutId,
      }),
    ];

    expect(managementResponses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200]);

    const negatedResponses = await Promise.all([
      negatedAgent.resource('uiLayouts').list(),
      negatedAgent.resource('uiLayouts').get({
        filterByTk: deniedLayout.get('id'),
      }),
      negatedAgent.resource('uiLayouts').create({
        values: {
          uid: 'management-negated-layout',
          title: 'Management negated layout',
          layoutType: 'mobile',
          routeName: 'managementNegatedLayout',
          routePath: '/management-negated-layout',
          authCheck: true,
          enabled: true,
        },
      }),
      negatedAgent.resource('uiLayouts').update({
        filterByTk: deniedLayout.get('id'),
        values: {
          title: 'Management denied layout updated',
        },
      }),
      negatedAgent.resource('uiLayouts').destroy({
        filterByTk: deniedLayout.get('id'),
      }),
    ]);

    expect(negatedResponses.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
  });

  it('should keep role layout permissions behind role configuration snippets', async () => {
    app = await createUiLayoutMockServer();

    const layout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'role-acl-layout',
        title: 'Role ACL layout',
        layoutType: 'mobile',
        routeName: 'roleAclLayout',
        routePath: '/role-acl-layout',
        authCheck: true,
        enabled: true,
      },
    });
    const secondLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'role-acl-layout-second',
        title: 'Role ACL layout second',
        layoutType: 'mobile',
        routeName: 'roleAclLayoutSecond',
        routePath: '/role-acl-layout-second',
        authCheck: true,
        enabled: true,
      },
    });
    const route = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-ACL-ROUTE',
        schemaUid: 'role-acl-route',
      },
    });
    const secondRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-ACL-ROUTE-SECOND',
        schemaUid: 'role-acl-route-second',
      },
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
      tk: [layout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', secondRoute.get('id')).set({
      tk: [secondLayout.get('uid')],
    });
    const targetRole = await app.db.getRepository('roles').create({
      values: {
        name: 'role-acl-target',
      },
    });
    const layoutPermission = await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: targetRole.get('name'),
        uiLayoutUid: layout.get('uid'),
      },
    });
    const menuPermission = await app.db.getRepository('rolesUiLayoutDesktopRoutes').create({
      values: {
        roleName: targetRole.get('name'),
        uiLayoutUid: layout.get('uid'),
        desktopRouteId: route.get('id'),
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'role-acl-logged-in',
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'role-acl-ui-layout-manager',
        snippets: ['pm.ui-layout'],
      },
    });
    await app.db.getRepository('roles').create({
      values: {
        name: 'role-acl-role-manager',
        snippets: ['pm.acl.roles'],
      },
    });
    const loggedInUser = await app.db.getRepository('users').create({
      values: {
        roles: ['role-acl-logged-in'],
      },
    });
    const uiLayoutManagerUser = await app.db.getRepository('users').create({
      values: {
        roles: ['role-acl-ui-layout-manager'],
      },
    });
    const roleManagerUser = await app.db.getRepository('users').create({
      values: {
        roles: ['role-acl-role-manager'],
      },
    });
    const loggedInAgent = await app.agent().login(loggedInUser);
    const uiLayoutManagerAgent = await app.agent().login(uiLayoutManagerUser);
    const roleManagerAgent = await app.agent().login(roleManagerUser);
    const deniedOperations = async (agent: typeof loggedInAgent): Promise<number[]> => {
      const responses = [
        await agent.resource('rolesUiLayouts').list({
          paginate: false,
          filter: {
            roleName: targetRole.get('name'),
          },
        }),
        await agent.resource('rolesUiLayouts').create({
          values: {
            roleName: targetRole.get('name'),
            uiLayoutUid: secondLayout.get('uid'),
          },
        }),
        await agent.resource('rolesUiLayouts').update({
          filterByTk: layoutPermission.get('id'),
          values: {
            uiLayoutUid: layout.get('uid'),
          },
        }),
        await agent.resource('rolesUiLayouts').destroy({
          filterByTk: layoutPermission.get('id'),
        }),
        await agent.resource('rolesUiLayoutDesktopRoutes').list({
          paginate: false,
          filter: {
            roleName: targetRole.get('name'),
          },
        }),
        await agent.resource('rolesUiLayoutDesktopRoutes').create({
          values: {
            roleName: targetRole.get('name'),
            uiLayoutUid: secondLayout.get('uid'),
            desktopRouteId: secondRoute.get('id'),
          },
        }),
        await agent.resource('rolesUiLayoutDesktopRoutes').update({
          filterByTk: menuPermission.get('id'),
          values: {
            desktopRouteId: route.get('id'),
          },
        }),
        await agent.resource('rolesUiLayoutDesktopRoutes').destroy({
          filterByTk: menuPermission.get('id'),
        }),
      ];

      return responses.map((response) => response.status);
    };

    expect(await deniedOperations(loggedInAgent)).toEqual([403, 403, 403, 403, 403, 403, 403, 403]);
    expect(await deniedOperations(uiLayoutManagerAgent)).toEqual([403, 403, 403, 403, 403, 403, 403, 403]);

    const layoutCreateResponse = await roleManagerAgent.resource('rolesUiLayouts').create({
      values: {
        roleName: targetRole.get('name'),
        uiLayoutUid: secondLayout.get('uid'),
      },
    });
    const menuCreateResponse = await roleManagerAgent.resource('rolesUiLayoutDesktopRoutes').create({
      values: {
        roleName: targetRole.get('name'),
        uiLayoutUid: secondLayout.get('uid'),
        desktopRouteId: secondRoute.get('id'),
      },
    });
    const roleManagerResponses = [
      await roleManagerAgent.resource('rolesUiLayouts').list({
        paginate: false,
        filter: {
          roleName: targetRole.get('name'),
        },
      }),
      layoutCreateResponse,
      await roleManagerAgent.resource('rolesUiLayouts').update({
        filterByTk: layoutPermission.get('id'),
        values: {
          uiLayoutUid: layout.get('uid'),
        },
      }),
      await roleManagerAgent.resource('rolesUiLayouts').destroy({
        filterByTk: layoutPermission.get('id'),
      }),
      await roleManagerAgent.resource('rolesUiLayoutDesktopRoutes').list({
        paginate: false,
        filter: {
          roleName: targetRole.get('name'),
        },
      }),
      menuCreateResponse,
      await roleManagerAgent.resource('rolesUiLayoutDesktopRoutes').update({
        filterByTk: menuPermission.get('id'),
        values: {
          desktopRouteId: route.get('id'),
        },
      }),
      await roleManagerAgent.resource('rolesUiLayoutDesktopRoutes').destroy({
        filterByTk: menuPermission.get('id'),
      }),
    ];

    expect(roleManagerResponses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 200, 200, 200]);
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
        title: 'Mobile layout relation test',
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

    const createdRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'link',
        title: 'layout relation create payload',
        schemaUid: 'layout-relation-create-payload',
        uiLayouts: [mobileLayout.get('uid')],
      },
    });
    const createdRouteWithLayout = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: createdRoute.get('id'),
      appends: ['uiLayouts'],
    });

    expect(createdRouteWithLayout?.get('uiLayouts').map((layout) => layout.get('uid'))).toEqual([
      mobileLayout.get('uid'),
    ]);
  });

  it('should associate routes created through actions with the requested layout', async () => {
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

    const mobileLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'mobile-layout-create-action-test',
        title: 'Mobile layout create action test',
        layoutType: 'mobile',
        routeName: 'mobile-layout-create-action-test',
        routePath: '/v/mobile-layout-create-action-test',
        authCheck: true,
        enabled: true,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').create({
      layout: mobileLayout.get('uid'),
      values: {
        type: 'flowPage',
        title: 'mobile action page',
        schemaUid: 'mobile-action-page',
        children: [
          {
            type: 'tabs',
            title: 'mobile action tabs',
            schemaUid: 'mobile-action-tabs',
            hidden: true,
          },
        ],
      },
    });

    expect(response.status).toBe(200);

    const createdRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: response.body.data.id,
      appends: ['uiLayouts', 'children.uiLayouts'],
    });
    const childRoute = createdRoute?.get('children')?.[0];

    expect(createdRoute?.get('uiLayouts').map((layout) => layout.get('uid'))).toEqual([mobileLayout.get('uid')]);
    expect(childRoute?.get('uiLayouts').map((layout) => layout.get('uid'))).toEqual([mobileLayout.get('uid')]);
  });

  it('should require an explicit valid layout for listAccessible route lookup', async () => {
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
        title: 'Mobile default test',
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

    const [omittedResponse, emptyResponse, adminResponse] = await Promise.all([
      agent.get('/desktopRoutes:listAccessible'),
      agent.get('/desktopRoutes:listAccessible').query({ layout: '' }),
      agent.get('/desktopRoutes:listAccessible').query({ layout: DEFAULT_ADMIN_UI_LAYOUT.uid }),
    ]);
    const adminRouteTitles = adminResponse.body.data.map((route) => route.title).sort();

    expect([omittedResponse.status, emptyResponse.status, adminResponse.status]).toEqual([200, 200, 200]);
    expect(omittedResponse.body.data).toEqual([]);
    expect(emptyResponse.body.data).toEqual([]);
    expect(adminRouteTitles).toEqual(expect.arrayContaining([unassignedRoute.get('title'), adminRoute.get('title')]));
    expect(adminRouteTitles).not.toContain(mobileRoute.get('title'));
  });

  it('should not fallback to AdminLayout for invalid runtime layouts', async () => {
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
    const disabledLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'disabled-layout-route-filter-test',
        title: 'Disabled layout route filter test',
        layoutType: 'mobile',
        routeName: 'disabled-layout-route-filter-test',
        routePath: '/v/disabled-layout-route-filter-test',
        authCheck: true,
        enabled: false,
      },
    });
    const deletedLayout = await app.db.getRepository('uiLayouts').create({
      values: {
        uid: 'deleted-layout-route-filter-test',
        title: 'Deleted layout route filter test',
        layoutType: 'mobile',
        routeName: 'deleted-layout-route-filter-test',
        routePath: '/v/deleted-layout-route-filter-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-invalid-runtime-member',
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });

    const unassignedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-INVALID-LAYOUT-UNASSIGNED',
        schemaUid: 'invalid-layout-unassigned',
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-INVALID-LAYOUT-ADMIN',
        schemaUid: 'invalid-layout-admin',
      },
    });
    const disabledRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-INVALID-LAYOUT-DISABLED',
        schemaUid: 'invalid-layout-disabled',
      },
    });
    const deletedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-INVALID-LAYOUT-DELETED',
        schemaUid: 'invalid-layout-deleted',
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', disabledRoute.get('id')).set({
      tk: [disabledLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', deletedRoute.get('id')).set({
      tk: [deletedLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.roles', adminRoute.get('id')).add({
      tk: [role.get('name')],
    });
    await deletedLayout.destroy();

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

    const [
      rootAdminResponse,
      rootOmittedResponse,
      rootEmptyResponse,
      rootMissingResponse,
      rootDisabledResponse,
      rootDeletedResponse,
      memberAdminResponse,
      memberOmittedResponse,
      memberEmptyResponse,
      memberMissingResponse,
      memberDisabledResponse,
      memberDeletedResponse,
      rootAdminGetResponse,
      rootOmittedGetResponse,
      rootEmptyGetResponse,
      rootMissingGetResponse,
      rootDisabledGetResponse,
      rootDeletedGetResponse,
      memberAdminGetResponse,
      memberOmittedGetResponse,
      memberEmptyGetResponse,
      memberMissingGetResponse,
      memberDisabledGetResponse,
      memberDeletedGetResponse,
    ] = await Promise.all([
      rootAgent.get('/desktopRoutes:listAccessible').query({ layout: DEFAULT_ADMIN_UI_LAYOUT.uid }),
      rootAgent.get('/desktopRoutes:listAccessible'),
      rootAgent.get('/desktopRoutes:listAccessible').query({ layout: '' }),
      rootAgent.get('/desktopRoutes:listAccessible').query({ layout: 'missing-layout-route-filter-test' }),
      rootAgent.get('/desktopRoutes:listAccessible').query({ layout: disabledLayout.get('uid') }),
      rootAgent.get('/desktopRoutes:listAccessible').query({ layout: deletedLayout.get('uid') }),
      memberAgent.get('/desktopRoutes:listAccessible').query({ layout: DEFAULT_ADMIN_UI_LAYOUT.uid }),
      memberAgent.get('/desktopRoutes:listAccessible'),
      memberAgent.get('/desktopRoutes:listAccessible').query({ layout: '' }),
      memberAgent.get('/desktopRoutes:listAccessible').query({ layout: 'missing-layout-route-filter-test' }),
      memberAgent.get('/desktopRoutes:listAccessible').query({ layout: disabledLayout.get('uid') }),
      memberAgent.get('/desktopRoutes:listAccessible').query({ layout: deletedLayout.get('uid') }),
      rootAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: adminRoute.get('id'),
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      rootAgent.get('/desktopRoutes:getAccessible').query({ filterByTk: adminRoute.get('id') }),
      rootAgent.get('/desktopRoutes:getAccessible').query({ filterByTk: adminRoute.get('id'), layout: '' }),
      rootAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: adminRoute.get('id'), layout: 'missing-layout-route-filter-test' }),
      rootAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: disabledRoute.get('id'), layout: disabledLayout.get('uid') }),
      rootAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: deletedRoute.get('id'), layout: deletedLayout.get('uid') }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: adminRoute.get('id'),
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({ filterByTk: adminRoute.get('id') }),
      memberAgent.get('/desktopRoutes:getAccessible').query({ filterByTk: adminRoute.get('id'), layout: '' }),
      memberAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: adminRoute.get('id'), layout: 'missing-layout-route-filter-test' }),
      memberAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: disabledRoute.get('id'), layout: disabledLayout.get('uid') }),
      memberAgent
        .get('/desktopRoutes:getAccessible')
        .query({ filterByTk: deletedRoute.get('id'), layout: deletedLayout.get('uid') }),
    ]);
    const rootAdminTitles = rootAdminResponse.body.data.map((route) => route.title);
    const memberAdminTitles = memberAdminResponse.body.data.map((route) => route.title);
    const invalidListResponses = [
      rootOmittedResponse,
      rootEmptyResponse,
      rootMissingResponse,
      rootDisabledResponse,
      rootDeletedResponse,
      memberOmittedResponse,
      memberEmptyResponse,
      memberMissingResponse,
      memberDisabledResponse,
      memberDeletedResponse,
    ];
    const invalidGetResponses = [
      rootOmittedGetResponse,
      rootEmptyGetResponse,
      rootMissingGetResponse,
      rootDisabledGetResponse,
      rootDeletedGetResponse,
      memberOmittedGetResponse,
      memberEmptyGetResponse,
      memberMissingGetResponse,
      memberDisabledGetResponse,
      memberDeletedGetResponse,
    ];

    expect([rootAdminResponse.status, memberAdminResponse.status]).toEqual([200, 200]);
    expect(rootAdminTitles).toEqual(expect.arrayContaining([unassignedRoute.get('title'), adminRoute.get('title')]));
    expect(rootAdminTitles).not.toEqual(
      expect.arrayContaining([disabledRoute.get('title'), deletedRoute.get('title')]),
    );
    expect(memberAdminTitles).toEqual([adminRoute.get('title')]);
    expect(rootAdminGetResponse.status).toBe(200);
    expect(memberAdminGetResponse.status).toBe(200);
    expect(rootAdminGetResponse.body.data.title).toBe(adminRoute.get('title'));
    expect(memberAdminGetResponse.body.data.title).toBe(adminRoute.get('title'));
    expect(invalidListResponses.map((response) => response.status)).toEqual(Array(10).fill(200));
    expect(invalidListResponses.map((response) => response.body.data)).toEqual(Array(10).fill([]));
    expect(invalidGetResponses.map((response) => response.body.data ?? null)).toEqual(Array(10).fill(null));
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
        title: 'Mobile root filter test',
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
        title: 'Mobile role filter test',
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
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
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

  it('should deny layout routes when only legacy route permission exists', async () => {
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
        uid: 'mobile-layout-denied-legacy-route-test',
        title: 'Mobile denied legacy route test',
        layoutType: 'mobile',
        routeName: 'mobile-denied-legacy-route-test',
        routePath: '/v/mobile-denied-legacy-route-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-denied-legacy-route-member',
      },
    });
    const mobileRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-DENIED-LAYOUT-LEGACY-ROUTE',
        schemaUid: 'layout-denied-legacy-route',
        hidden: false,
        sort: 10,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', mobileRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
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

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [mobileRoute.get('id')],
    });

    const [layoutResponse, routeListResponse, routeGetResponse, legacyRoleRoutesResponse] = await Promise.all([
      memberAgent.get('/uiLayouts:listAccessible'),
      memberAgent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout.get('uid'),
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: mobileRoute.get('id'),
        layout: mobileLayout.get('uid'),
      }),
      rootAgent.resource('roles.desktopRoutes', role.get('name')).list({
        paginate: false,
      }),
    ]);

    expect(layoutResponse.status).toBe(200);
    expect(routeListResponse.status).toBe(200);
    expect([200, 204]).toContain(routeGetResponse.status);
    expect(layoutResponse.body.data.map((layout) => layout.uid)).toEqual([DEFAULT_ADMIN_UI_LAYOUT.uid]);
    expect(routeListResponse.body.data).toEqual([]);
    expect(routeGetResponse.body.data ?? null).toBeNull();
    expect(legacyRoleRoutesResponse.body.data.map((route) => route.title)).toContain('DATA-DENIED-LAYOUT-LEGACY-ROUTE');
  });

  it('should require migrated layout-scoped route permissions for layout route access', async () => {
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
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-scoped-required-member',
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-LAYOUT-SCOPED-REQUIRED',
        schemaUid: 'layout-scoped-required',
        hidden: false,
        sort: 10,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
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

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [adminRoute.get('id')],
    });
    await app.db.getRepository('rolesUiLayoutDesktopRoutes').destroy({
      filter: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
        desktopRouteId: adminRoute.get('id'),
      },
    });

    const [routeListResponse, routeGetResponse, legacyRoleRoutesResponse] = await Promise.all([
      memberAgent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      memberAgent.get('/desktopRoutes:getAccessible').query({
        filterByTk: adminRoute.get('id'),
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      rootAgent.resource('roles.desktopRoutes', role.get('name')).list({
        paginate: false,
      }),
    ]);

    expect(routeListResponse.status).toBe(200);
    expect([200, 204]).toContain(routeGetResponse.status);
    expect(routeListResponse.body.data).toEqual([]);
    expect(routeGetResponse.body.data ?? null).toBeNull();
    expect(legacyRoleRoutesResponse.body.data.map((route) => route.title)).toContain('DATA-LAYOUT-SCOPED-REQUIRED');
  });

  it('should keep shared route permissions independent per layout', async () => {
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
        uid: 'mobile-layout-shared-route-permission-test',
        title: 'Mobile shared route permission test',
        layoutType: 'mobile',
        routeName: 'mobile-shared-route-permission-test',
        routePath: '/v/mobile-shared-route-permission-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-shared-route-permission-member',
      },
    });
    const sharedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-SHARED-ROUTE-LAYOUT-SCOPED',
        schemaUid: 'layout-shared-route-layout-scoped',
        hidden: false,
        sort: 10,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', sharedRoute.get('id')).set({
      tk: [adminLayout.get('uid'), mobileLayout.get('uid')],
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
      },
    });
    await app.db.getRepository('rolesUiLayoutDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: adminLayout.get('uid'),
        desktopRouteId: sharedRoute.get('id'),
      },
    });

    const memberUser = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const agent = await app.agent().login(memberUser);

    const [adminResponse, mobileResponse] = await Promise.all([
      agent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      agent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout.get('uid'),
      }),
    ]);
    const adminTitles = adminResponse.body.data.map((route) => route.title);
    const mobileTitles = mobileResponse.body.data.map((route) => route.title);

    expect(adminResponse.status).toBe(200);
    expect(mobileResponse.status).toBe(200);
    expect(adminTitles).toEqual(['DATA-SHARED-ROUTE-LAYOUT-SCOPED']);
    expect(mobileTitles).toEqual([]);
  });

  it('should include parent routes only as navigation ancestors for layout-scoped child access', async () => {
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
        uid: 'mobile-layout-tree-permission-test',
        title: 'Mobile tree permission test',
        layoutType: 'mobile',
        routeName: 'mobile-tree-permission-test',
        routePath: '/v/mobile-tree-permission-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-tree-permission-member',
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
      },
    });
    const mobileParentRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-TREE-MOBILE-PARENT',
        schemaUid: 'layout-tree-mobile-parent',
        hidden: false,
        sort: 10,
      },
    });
    const mobileChildRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-TREE-MOBILE-CHILD',
        schemaUid: 'layout-tree-mobile-child',
        parentId: mobileParentRoute.get('id'),
        hidden: false,
        sort: 1,
      },
    });
    const mobileHiddenTabRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        title: 'DATA-TREE-MOBILE-HIDDEN-TAB',
        parentId: mobileChildRoute.get('id'),
        hidden: true,
        sort: 1,
      },
    });
    const adminParentRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-TREE-ADMIN-PARENT',
        schemaUid: 'layout-tree-admin-parent',
        hidden: false,
        sort: 20,
      },
    });
    const adminChildRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-TREE-ADMIN-CHILD',
        schemaUid: 'layout-tree-admin-child',
        parentId: adminParentRoute.get('id'),
        hidden: false,
        sort: 1,
      },
    });
    const adminHiddenTabRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        title: 'DATA-TREE-ADMIN-HIDDEN-TAB',
        parentId: adminChildRoute.get('id'),
        hidden: true,
        sort: 1,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', mobileParentRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileChildRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileHiddenTabRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminParentRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminChildRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminHiddenTabRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
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
    const agent = await app.agent().login(memberUser);

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [mobileChildRoute.get('id')],
    });

    const [
      mobileListResponse,
      adminListResponse,
      mobileParentGetResponse,
      mobileChildGetResponse,
      mobileHiddenTabGetResponse,
    ] = await Promise.all([
      agent.get('/desktopRoutes:listAccessible').query({
        layout: mobileLayout.get('uid'),
      }),
      agent.get('/desktopRoutes:listAccessible').query({
        layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
      }),
      agent.get('/desktopRoutes:getAccessible').query({
        filterByTk: mobileParentRoute.get('id'),
        layout: mobileLayout.get('uid'),
      }),
      agent.get('/desktopRoutes:getAccessible').query({
        filterByTk: mobileChildRoute.get('id'),
        layout: mobileLayout.get('uid'),
      }),
      agent.get('/desktopRoutes:getAccessible').query({
        filterByTk: mobileHiddenTabRoute.get('id'),
        layout: mobileLayout.get('uid'),
      }),
    ]);

    expect(mobileListResponse.status).toBe(200);
    expect(adminListResponse.status).toBe(200);
    expect([200, 204]).toContain(mobileParentGetResponse.status);
    expect(mobileChildGetResponse.status).toBe(200);
    expect(mobileHiddenTabGetResponse.status).toBe(200);
    expect(mobileListResponse.body.data).toHaveLength(1);
    expect(mobileListResponse.body.data[0].title).toBe('DATA-TREE-MOBILE-PARENT');
    expect(mobileListResponse.body.data[0].children.map((route) => route.title)).toEqual(['DATA-TREE-MOBILE-CHILD']);
    expect(mobileListResponse.body.data[0].children[0].children.map((route) => route.title)).toEqual([
      'DATA-TREE-MOBILE-HIDDEN-TAB',
    ]);
    expect(adminListResponse.body.data).toEqual([]);
    expect(mobileParentGetResponse.body.data ?? null).toBeNull();
    expect(mobileChildGetResponse.body.data.title).toBe('DATA-TREE-MOBILE-CHILD');
    expect(mobileHiddenTabGetResponse.body.data.title).toBe('DATA-TREE-MOBILE-HIDDEN-TAB');

    await rootAgent.resource('roles.desktopRoutes', role.get('name')).remove({
      values: [mobileChildRoute.get('id')],
    });

    const [mobileListAfterRemoveResponse, adminListAfterRemoveResponse, mobileHiddenTabAfterRemoveResponse] =
      await Promise.all([
        agent.get('/desktopRoutes:listAccessible').query({
          layout: mobileLayout.get('uid'),
        }),
        agent.get('/desktopRoutes:listAccessible').query({
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        agent.get('/desktopRoutes:getAccessible').query({
          filterByTk: mobileHiddenTabRoute.get('id'),
          layout: mobileLayout.get('uid'),
        }),
      ]);

    expect(mobileListAfterRemoveResponse.status).toBe(200);
    expect(adminListAfterRemoveResponse.status).toBe(200);
    expect([200, 204]).toContain(mobileHiddenTabAfterRemoveResponse.status);
    expect(mobileListAfterRemoveResponse.body.data).toEqual([]);
    expect(adminListAfterRemoveResponse.body.data).toEqual([]);
    expect(mobileHiddenTabAfterRemoveResponse.body.data ?? null).toBeNull();
  });

  it('should apply layout filtering to getAccessible route lookup', async () => {
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
        uid: 'mobile-layout-get-accessible-test',
        title: 'Mobile getAccessible test',
        layoutType: 'mobile',
        routeName: 'mobile-get-accessible-test',
        routePath: '/v/mobile-get-accessible-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-get-accessible-member',
      },
    });
    await app.db.getRepository('rolesUiLayouts').create({
      values: {
        roleName: role.get('name'),
        uiLayoutUid: mobileLayout.get('uid'),
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-GET-ACCESSIBLE-ADMIN',
        schemaUid: 'layout-get-accessible-admin',
        hidden: false,
        sort: 10,
      },
    });
    const mobileRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-GET-ACCESSIBLE-MOBILE',
        schemaUid: 'layout-get-accessible-mobile',
        hidden: false,
        sort: 20,
      },
    });
    const mobileDeniedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-GET-ACCESSIBLE-MOBILE-DENIED',
        schemaUid: 'layout-get-accessible-mobile-denied',
        hidden: false,
        sort: 30,
      },
    });

    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [adminLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileDeniedRoute.get('id')).set({
      tk: [mobileLayout.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.roles', adminRoute.get('id')).add({
      tk: [role.get('name')],
    });
    await app.db.getRepository('desktopRoutes.roles', mobileRoute.get('id')).add({
      tk: [role.get('name')],
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

    const [rootAdminResponse, rootMobileResponse, rootInvalidResponse, memberMobileResponse, memberDeniedResponse] =
      await Promise.all([
        rootAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: adminRoute.get('id'),
          layout: DEFAULT_ADMIN_UI_LAYOUT.uid,
        }),
        rootAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: mobileRoute.get('id'),
          layout: mobileLayout.get('uid'),
        }),
        rootAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: adminRoute.get('id'),
          layout: 'missing-get-accessible-layout',
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: mobileRoute.get('id'),
          layout: mobileLayout.get('uid'),
        }),
        memberAgent.get('/desktopRoutes:getAccessible').query({
          filterByTk: mobileDeniedRoute.get('id'),
          layout: mobileLayout.get('uid'),
        }),
      ]);

    expect(rootAdminResponse.status).toBe(200);
    expect(rootMobileResponse.status).toBe(200);
    expect([200, 204]).toContain(rootInvalidResponse.status);
    expect(memberMobileResponse.status).toBe(200);
    expect([200, 204]).toContain(memberDeniedResponse.status);
    expect(rootAdminResponse.body.data.title).toBe('DATA-GET-ACCESSIBLE-ADMIN');
    expect(rootMobileResponse.body.data.title).toBe('DATA-GET-ACCESSIBLE-MOBILE');
    expect(rootInvalidResponse.body.data ?? null).toBeNull();
    expect(memberMobileResponse.body.data.title).toBe('DATA-GET-ACCESSIBLE-MOBILE');
    expect(memberDeniedResponse.body.data ?? null).toBeNull();
  });

  it('should persist role route permissions independently per layout', async () => {
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
        uid: 'mobile-layout-role-permission-test',
        title: 'Mobile role permission test',
        layoutType: 'mobile',
        routeName: 'mobile-role-permission-test',
        routePath: '/v/mobile-role-permission-test',
        authCheck: true,
        enabled: true,
      },
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-role-permission-member',
      },
    });
    const adminRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-PERMISSION-ADMIN-A',
        schemaUid: 'layout-role-permission-admin-a',
        hidden: false,
        sort: 10,
      },
    });
    const mobileRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'flowPage',
        title: 'DATA-ROLE-PERMISSION-MOBILE-B',
        schemaUid: 'layout-role-permission-mobile-b',
        hidden: false,
        sort: 20,
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

    await agent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [adminRoute.get('id')],
    });
    await agent.resource('roles.desktopRoutes', role.get('name')).add({
      values: [mobileRoute.get('id')],
    });

    const persistedRole = await app.db.getRepository('roles').findOne({
      filterByTk: role.get('name'),
      appends: ['desktopRoutes'],
    });
    const persistedRouteTitles = persistedRole
      ?.get('desktopRoutes')
      .map((route) => route.get('title'))
      .sort();
    const adminRoutesResponse = await agent.resource('roles.desktopRoutes', role.get('name')).list({
      paginate: false,
      filter: {
        hidden: { $ne: true },
        $or: [{ 'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid }, { 'uiLayouts.id.$notExists': true }],
      },
    });
    const mobileRoutesResponse = await agent.resource('roles.desktopRoutes', role.get('name')).list({
      paginate: false,
      filter: {
        hidden: { $ne: true },
        'uiLayouts.uid': mobileLayout.get('uid'),
      },
    });

    expect(persistedRouteTitles).toEqual(['DATA-ROLE-PERMISSION-ADMIN-A', 'DATA-ROLE-PERMISSION-MOBILE-B']);
    expect(adminRoutesResponse.body.data.map((route) => route.title)).toEqual(['DATA-ROLE-PERMISSION-ADMIN-A']);
    expect(mobileRoutesResponse.body.data.map((route) => route.title)).toEqual(['DATA-ROLE-PERMISSION-MOBILE-B']);

    await agent.resource('roles.desktopRoutes', role.get('name')).remove({
      values: [mobileRoute.get('id')],
    });

    const adminRoutesAfterMobileRemoveResponse = await agent.resource('roles.desktopRoutes', role.get('name')).list({
      paginate: false,
      filter: {
        hidden: { $ne: true },
        $or: [{ 'uiLayouts.uid': DEFAULT_ADMIN_UI_LAYOUT.uid }, { 'uiLayouts.id.$notExists': true }],
      },
    });
    const mobileRoutesAfterMobileRemoveResponse = await agent.resource('roles.desktopRoutes', role.get('name')).list({
      paginate: false,
      filter: {
        hidden: { $ne: true },
        'uiLayouts.uid': mobileLayout.get('uid'),
      },
    });

    expect(adminRoutesAfterMobileRemoveResponse.body.data.map((route) => route.title)).toEqual([
      'DATA-ROLE-PERMISSION-ADMIN-A',
    ]);
    expect(mobileRoutesAfterMobileRemoveResponse.body.data).toEqual([]);
  });
});
