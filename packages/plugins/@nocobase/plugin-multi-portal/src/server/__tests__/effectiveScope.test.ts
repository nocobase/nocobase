/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Model } from '@nocobase/database';
import { createMockServer, type MockServer } from '@nocobase/test';
import { vi } from 'vitest';

const ADMIN_LAYOUT_UID = 'admin-layout-model';
const MOBILE_LAYOUT_UID = 'mobile-layout-model';

async function createEffectiveScopeServer() {
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

async function createPortal(
  app: MockServer,
  values: {
    uid: string;
    routePermissionMode: 'layout' | 'portal';
    uiLayoutUid?: string;
  },
) {
  return app.db.getRepository('multiPortals').create({
    values: {
      title: values.uid,
      portalType: 'no-code',
      portalName: values.uid,
      routePath: `/${values.uid}`,
      authCheck: true,
      enabled: true,
      uiLayoutUid: values.uiLayoutUid ?? ADMIN_LAYOUT_UID,
      ...values,
    },
  });
}

async function createRoute(app: MockServer, title: string, schemaUid: string) {
  return app.db.getRepository('desktopRoutes').create({
    values: {
      type: 'flowPage',
      title,
      schemaUid,
      hidden: false,
    },
  });
}

function relationUids(route: Model | null, relation: string) {
  const records = route?.get(relation);
  return Array.isArray(records) ? records.map((record) => record.get('uid')).sort() : [];
}

describe('Multi Portal effective route scope', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createEffectiveScopeServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('uses the backing layout ownership and legacy route ACL for layout mode', async () => {
    const portal = await createPortal(app, {
      uid: 'migrated-desktop',
      routePermissionMode: 'layout',
    });
    const route = await createRoute(app, 'LAYOUT MODE ROUTE', 'layout-mode-route');
    await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
      tk: [ADMIN_LAYOUT_UID],
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'layout-mode-member',
        allowNewMenu: false,
        snippets: ['pm.acl.roles'],
      },
    });
    await app.db.getRepository('rolesDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        desktopRouteId: route.get('id'),
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(user);
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const accessibleResponse = await memberAgent.get('/desktopRoutes:listAccessible').query({
      portal: portal.get('uid'),
    });
    const targetsResponse = await memberAgent.get('/desktopRoutes:listRolePermissionTargets').query({
      portal: portal.get('uid'),
    });
    const createResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'LAYOUT MODE CREATED ROUTE',
        schemaUid: 'layout-mode-created-route',
        multiPortals: ['forged-portal-owner'],
      },
    });
    const createdRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: createResponse.body.data.id,
      appends: ['uiLayouts', 'multiPortals'],
    });

    expect(accessibleResponse.status).toBe(200);
    expect(accessibleResponse.body.data.map((item) => item.title)).toEqual(['LAYOUT MODE ROUTE']);
    expect(targetsResponse.status).toBe(200);
    expect(targetsResponse.body.data.map((item) => item.title)).toEqual(['LAYOUT MODE ROUTE']);
    expect(relationUids(createdRoute, 'uiLayouts')).toEqual([ADMIN_LAYOUT_UID]);
    expect(relationUids(createdRoute, 'multiPortals')).toEqual([]);
    expect(
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').count({
        filter: {
          multiPortalUid: portal.get('uid'),
        },
      }),
    ).toBe(0);
  });

  it('resolves a layout-mode Mobile portal through its backing layout before the legacy accessible handler', async () => {
    const portal = await createPortal(app, {
      uid: 'migrated-mobile',
      routePermissionMode: 'layout',
      uiLayoutUid: MOBILE_LAYOUT_UID,
    });
    const mobileRoute = await createRoute(app, 'MOBILE LAYOUT MODE ROUTE', 'mobile-layout-mode-route');
    const adminRoute = await createRoute(app, 'ADMIN LAYOUT MODE ROUTE', 'admin-layout-mode-route');
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileRoute.get('id')).set({
      tk: [MOBILE_LAYOUT_UID],
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', adminRoute.get('id')).set({
      tk: [ADMIN_LAYOUT_UID],
    });
    const role = await app.db.getRepository('roles').create({
      values: {
        name: 'mobile-layout-mode-member',
        allowNewMenu: false,
        snippets: ['pm.acl.roles'],
      },
    });
    await app.db.getRepository('rolesDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        desktopRouteId: mobileRoute.get('id'),
      },
    });
    await app.db.getRepository('rolesDesktopRoutes').create({
      values: {
        roleName: role.get('name'),
        desktopRouteId: adminRoute.get('id'),
      },
    });
    const user = await app.db.getRepository('users').create({
      values: {
        roles: [role.get('name')],
      },
    });
    const memberAgent = await app.agent().login(user);

    const response = await memberAgent.get('/desktopRoutes:listAccessible').query({
      portal: portal.get('uid'),
    });

    expect(response.status).toBe(200);
    expect(response.body.data.map((item) => item.title)).toEqual(['MOBILE LAYOUT MODE ROUTE']);
  });

  it('rebuilds portal ownership and rejects list or update attempts across owners', async () => {
    const portal = await createPortal(app, {
      uid: 'portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'portal-b',
      routePermissionMode: 'portal',
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const createResponse = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'PORTAL A ROUTE',
        schemaUid: 'portal-a-route',
        uiLayouts: [ADMIN_LAYOUT_UID],
        multiPortals: [otherPortal.get('uid')],
      },
    });
    const otherRoute = await createRoute(app, 'PORTAL B ROUTE', 'portal-b-route');
    await app.db.getRepository('desktopRoutes.multiPortals', otherRoute.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    const createdRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: createResponse.body.data.id,
      appends: ['uiLayouts', 'multiPortals'],
    });

    const listResponse = await rootAgent.resource('desktopRoutes').list({
      portal: portal.get('uid'),
      paginate: false,
    });
    const crossOwnerUpdate = await rootAgent.resource('desktopRoutes').update({
      portal: portal.get('uid'),
      filterByTk: otherRoute.get('id'),
      values: {
        title: 'FORGED UPDATE',
      },
    });
    const unchangedOtherRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: otherRoute.get('id'),
    });

    expect(relationUids(createdRoute, 'uiLayouts')).toEqual([]);
    expect(relationUids(createdRoute, 'multiPortals')).toEqual([portal.get('uid')]);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data.map((item) => item.title)).toEqual(['PORTAL A ROUTE']);
    expect(crossOwnerUpdate.status).toBe(400);
    expect(unchangedOtherRoute?.get('title')).toBe('PORTAL B ROUTE');
  });

  it('sanitizes owner fields for every route in a scoped batch update', async () => {
    const portal = await createPortal(app, {
      uid: 'batch-update-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'batch-update-portal-b',
      routePermissionMode: 'portal',
    });
    const firstRoute = await createRoute(app, 'PORTAL A FIRST ROUTE', 'portal-a-first-batch-route');
    const secondRoute = await createRoute(app, 'PORTAL A SECOND ROUTE', 'portal-a-second-batch-route');
    await app.db.getRepository('desktopRoutes.multiPortals', firstRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', secondRoute.get('id')).set({
      tk: [portal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').update({
      portal: portal.get('uid'),
      filterByTk: [firstRoute.get('id'), secondRoute.get('id')],
      values: [
        {
          id: firstRoute.get('id'),
          title: 'PORTAL A FIRST UPDATED ROUTE',
          uiLayouts: [ADMIN_LAYOUT_UID],
          multiPortals: [otherPortal.get('uid')],
        },
        {
          id: secondRoute.get('id'),
          title: 'PORTAL A SECOND UPDATED ROUTE',
          uiLayouts: [ADMIN_LAYOUT_UID],
          multiPortals: [otherPortal.get('uid')],
        },
      ],
    });
    const [updatedFirstRoute, updatedSecondRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: firstRoute.get('id'),
        appends: ['uiLayouts', 'multiPortals'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: secondRoute.get('id'),
        appends: ['uiLayouts', 'multiPortals'],
      }),
    ]);

    expect(response.status).toBe(200);
    expect(updatedFirstRoute?.get('title')).toBe('PORTAL A FIRST UPDATED ROUTE');
    expect(updatedSecondRoute?.get('title')).toBe('PORTAL A SECOND UPDATED ROUTE');
    expect(relationUids(updatedFirstRoute, 'uiLayouts')).toEqual([]);
    expect(relationUids(updatedSecondRoute, 'uiLayouts')).toEqual([]);
    expect(relationUids(updatedFirstRoute, 'multiPortals')).toEqual([portal.get('uid')]);
    expect(relationUids(updatedSecondRoute, 'multiPortals')).toEqual([portal.get('uid')]);
  });

  it('rejects a mixed-owner scoped batch update without partially updating either route', async () => {
    const portal = await createPortal(app, {
      uid: 'mixed-batch-update-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'mixed-batch-update-portal-b',
      routePermissionMode: 'portal',
    });
    const route = await createRoute(app, 'PORTAL A ORIGINAL BATCH ROUTE', 'portal-a-original-batch-route');
    const otherRoute = await createRoute(app, 'PORTAL B ORIGINAL BATCH ROUTE', 'portal-b-original-batch-route');
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', otherRoute.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').update({
      portal: portal.get('uid'),
      filterByTk: route.get('id'),
      values: [
        {
          id: route.get('id'),
          title: 'PORTAL A FORGED BATCH UPDATE',
        },
        {
          id: otherRoute.get('id'),
          title: 'PORTAL B FORGED BATCH UPDATE',
        },
      ],
    });
    const [unchangedRoute, unchangedOtherRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: route.get('id'),
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: otherRoute.get('id'),
      }),
    ]);

    expect(response.status).toBe(400);
    expect(unchangedRoute?.get('title')).toBe('PORTAL A ORIGINAL BATCH ROUTE');
    expect(unchangedOtherRoute?.get('title')).toBe('PORTAL B ORIGINAL BATCH ROUTE');
  });

  it('preserves unscoped batch update behavior', async () => {
    const firstRoute = await createRoute(app, 'UNSCOPED FIRST ROUTE', 'unscoped-first-batch-route');
    const secondRoute = await createRoute(app, 'UNSCOPED SECOND ROUTE', 'unscoped-second-batch-route');
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').update({
      filterByTk: [firstRoute.get('id'), secondRoute.get('id')],
      values: [
        {
          id: firstRoute.get('id'),
          title: 'UNSCOPED FIRST UPDATED ROUTE',
        },
        {
          id: secondRoute.get('id'),
          title: 'UNSCOPED SECOND UPDATED ROUTE',
        },
      ],
    });
    const [updatedFirstRoute, updatedSecondRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: firstRoute.get('id'),
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: secondRoute.get('id'),
      }),
    ]);

    expect(response.status).toBe(200);
    expect(updatedFirstRoute?.get('title')).toBe('UNSCOPED FIRST UPDATED ROUTE');
    expect(updatedSecondRoute?.get('title')).toBe('UNSCOPED SECOND UPDATED ROUTE');
  });

  it('rejects updateOrCreate matches outside the effective owner without changing either owner', async () => {
    const portal = await createPortal(app, {
      uid: 'upsert-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'upsert-portal-b',
      routePermissionMode: 'portal',
    });
    const otherRoute = await createRoute(app, 'PORTAL B ORIGINAL ROUTE', 'shared-upsert-schema');
    await app.db.getRepository('desktopRoutes.multiPortals', otherRoute.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').updateOrCreate({
      portal: portal.get('uid'),
      filterKeys: ['schemaUid'],
      values: {
        type: 'flowPage',
        title: 'FORGED PORTAL A UPDATE',
        schemaUid: 'shared-upsert-schema',
        uiLayouts: [ADMIN_LAYOUT_UID],
        multiPortals: [portal.get('uid')],
      },
    });
    const unchangedRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: otherRoute.get('id'),
      appends: ['uiLayouts', 'multiPortals'],
    });

    expect(response.status).toBe(400);
    expect(unchangedRoute?.get('title')).toBe('PORTAL B ORIGINAL ROUTE');
    expect(relationUids(unchangedRoute, 'uiLayouts')).toEqual([]);
    expect(relationUids(unchangedRoute, 'multiPortals')).toEqual([otherPortal.get('uid')]);
  });

  it('revalidates a create parent after the pre-action guard before writing the route', async () => {
    const portal = await createPortal(app, {
      uid: 'create-parent-race-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'create-parent-race-portal-b',
      routePermissionMode: 'portal',
    });
    const parent = await createRoute(app, 'CREATE PARENT RACE', 'create-parent-race');
    await app.db.getRepository('desktopRoutes.multiPortals', parent.get('id')).set({
      tk: [portal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const repository = app.db.getRepository('desktopRoutes');
    const originalCreate = repository.create.bind(repository);
    const createSpy = vi.spyOn(repository, 'create').mockImplementation(async (options) => {
      await app.db.getRepository('desktopRoutes.multiPortals', parent.get('id')).set({
        tk: [otherPortal.get('uid')],
      });
      return originalCreate(options);
    });

    let response;
    try {
      response = await rootAgent.resource('desktopRoutes').create({
        portal: portal.get('uid'),
        values: {
          type: 'flowPage',
          title: 'CREATE CHILD AFTER OWNER RACE',
          schemaUid: 'create-child-after-owner-race',
          parentId: parent.get('id'),
        },
      });
    } finally {
      createSpy.mockRestore();
    }

    expect(response.status).toBe(400);
    expect(
      await app.db.getRepository('desktopRoutes').count({
        filter: {
          schemaUid: 'create-child-after-owner-race',
        },
      }),
    ).toBe(0);
  });

  it('revalidates an update parent after the pre-action guard before writing parentId', async () => {
    const portal = await createPortal(app, {
      uid: 'update-parent-race-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'update-parent-race-portal-b',
      routePermissionMode: 'portal',
    });
    const route = await createRoute(app, 'UPDATE PARENT RACE ROUTE', 'update-parent-race-route');
    const parent = await createRoute(app, 'UPDATE PARENT RACE TARGET', 'update-parent-race-target');
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', parent.get('id')).set({
      tk: [portal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const repository = app.db.getRepository('desktopRoutes');
    const originalUpdate = repository.update.bind(repository);
    const updateSpy = vi.spyOn(repository, 'update').mockImplementation(async (options) => {
      await app.db.getRepository('desktopRoutes.multiPortals', parent.get('id')).set({
        tk: [otherPortal.get('uid')],
      });
      return originalUpdate(options);
    });

    let response;
    try {
      response = await rootAgent.resource('desktopRoutes').update({
        filterByTk: route.get('id'),
        portal: portal.get('uid'),
        values: {
          title: 'UPDATE SHOULD ROLL BACK',
          parentId: parent.get('id'),
        },
      });
    } finally {
      updateSpy.mockRestore();
    }
    const unchangedRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: route.get('id'),
    });

    expect(response.status).toBe(400);
    expect(unchangedRoute?.get('title')).toBe('UPDATE PARENT RACE ROUTE');
    expect(unchangedRoute?.get('parentId')).toBeNull();
  });

  it('revalidates an updateOrCreate match introduced after the pre-action guard', async () => {
    const portal = await createPortal(app, {
      uid: 'upsert-owner-race-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'upsert-owner-race-portal-b',
      routePermissionMode: 'portal',
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const repository = app.db.getRepository('desktopRoutes');
    const originalUpdateOrCreate = repository.updateOrCreate.bind(repository);
    let competingRoute: Model | undefined;
    const updateOrCreateSpy = vi.spyOn(repository, 'updateOrCreate').mockImplementation(async (options) => {
      competingRoute = await createRoute(app, 'COMPETING PORTAL ROUTE', 'upsert-owner-race-schema');
      await app.db.getRepository('desktopRoutes.multiPortals', competingRoute.get('id')).set({
        tk: [otherPortal.get('uid')],
      });
      return originalUpdateOrCreate(options);
    });

    let response;
    try {
      response = await rootAgent.resource('desktopRoutes').updateOrCreate({
        portal: portal.get('uid'),
        filterKeys: ['schemaUid'],
        values: {
          type: 'flowPage',
          title: 'FORGED PORTAL TAKEOVER',
          schemaUid: 'upsert-owner-race-schema',
        },
      });
    } finally {
      updateOrCreateSpy.mockRestore();
    }
    const unchangedCompetingRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: competingRoute?.get('id'),
      appends: ['multiPortals'],
    });

    expect(response.status).toBe(400);
    expect(unchangedCompetingRoute?.get('title')).toBe('COMPETING PORTAL ROUTE');
    expect(relationUids(unchangedCompetingRoute, 'multiPortals')).toEqual([otherPortal.get('uid')]);
  });

  it('rejects a parent route outside the effective owner before creating a child', async () => {
    const portal = await createPortal(app, {
      uid: 'child-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'child-portal-b',
      routePermissionMode: 'portal',
    });
    const otherParent = await createRoute(app, 'PORTAL B PARENT', 'portal-b-parent');
    await app.db.getRepository('desktopRoutes.multiPortals', otherParent.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').create({
      portal: portal.get('uid'),
      values: {
        type: 'flowPage',
        title: 'FORGED CHILD',
        schemaUid: 'forged-child',
        parentId: otherParent.get('id'),
      },
    });

    expect(response.status).toBe(400);
    expect(
      await app.db.getRepository('desktopRoutes').count({
        filter: {
          schemaUid: 'forged-child',
        },
      }),
    ).toBe(0);
  });

  it('rejects a mixed-owner batch destroy without detaching or deleting any route', async () => {
    const portal = await createPortal(app, {
      uid: 'destroy-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'destroy-portal-b',
      routePermissionMode: 'portal',
    });
    const route = await createRoute(app, 'PORTAL A DESTROY ROUTE', 'portal-a-destroy-route');
    const otherRoute = await createRoute(app, 'PORTAL B DESTROY ROUTE', 'portal-b-destroy-route');
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', otherRoute.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').destroy({
      filterByTk: [route.get('id'), otherRoute.get('id')],
      portal: portal.get('uid'),
    });
    const [unchangedRoute, unchangedOtherRoute] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: route.get('id'),
        appends: ['multiPortals'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: otherRoute.get('id'),
        appends: ['multiPortals'],
      }),
    ]);

    expect(response.status).toBe(400);
    expect(relationUids(unchangedRoute, 'multiPortals')).toEqual([portal.get('uid')]);
    expect(relationUids(unchangedOtherRoute, 'multiPortals')).toEqual([otherPortal.get('uid')]);
  });

  it('deletes ownerless descendants while preserving a root shared with another Portal', async () => {
    const portal = await createPortal(app, {
      uid: 'shared-root-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'shared-root-portal-b',
      routePermissionMode: 'portal',
    });
    const root = await createRoute(app, 'SHARED ROOT', 'shared-root');
    const ownerlessChild = await createRoute(app, 'OWNERLESS CHILD', 'ownerless-child');
    await app.db.getRepository('desktopRoutes.multiPortals', root.get('id')).set({
      tk: [portal.get('uid'), otherPortal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes.multiPortals', ownerlessChild.get('id')).set({
      tk: [portal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: ownerlessChild.get('id'),
      values: {
        parentId: root.get('id'),
      },
    });
    const role = await app.db.getRepository('roles').findOne({ fields: ['name'] });
    expect(role).toBeTruthy();
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role?.get('name'),
        multiPortalUid: portal.get('uid'),
        desktopRouteId: root.get('id'),
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role?.get('name'),
        multiPortalUid: otherPortal.get('uid'),
        desktopRouteId: root.get('id'),
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').destroy({
      filterByTk: root.get('id'),
      portal: portal.get('uid'),
    });
    const [remainingRoot, deletedChild] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: root.get('id'),
        appends: ['multiPortals'],
      }),
      app.db.getRepository('desktopRoutes').findOne({
        filterByTk: ownerlessChild.get('id'),
      }),
    ]);

    expect(response.status).toBe(200);
    expect(relationUids(remainingRoot, 'multiPortals')).toEqual([otherPortal.get('uid')]);
    expect(deletedChild).toBeNull();
    expect(
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').count({
        filter: {
          multiPortalUid: portal.get('uid'),
          desktopRouteId: root.get('id'),
        },
      }),
    ).toBe(0);
    expect(
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').count({
        filter: {
          multiPortalUid: otherPortal.get('uid'),
          desktopRouteId: root.get('id'),
        },
      }),
    ).toBe(1);
  });

  it('rolls back Portal ACL cleanup when detaching a shared route owner fails', async () => {
    const portal = await createPortal(app, {
      uid: 'rollback-detach-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'rollback-detach-portal-b',
      routePermissionMode: 'portal',
    });
    const route = await createRoute(app, 'ROLLBACK SHARED ROUTE', 'rollback-shared-route');
    await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
      tk: [portal.get('uid'), otherPortal.get('uid')],
    });
    const role = await app.db.getRepository('roles').findOne({ fields: ['name'] });
    expect(role).toBeTruthy();
    for (const multiPortalUid of [portal.get('uid'), otherPortal.get('uid')]) {
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
        values: {
          roleName: role?.get('name'),
          multiPortalUid,
          desktopRouteId: route.get('id'),
        },
      });
    }
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const ownershipCollection = app.db.getCollection('desktopRoutesMultiPortals');
    const destroySpy = vi
      .spyOn(ownershipCollection.model, 'destroy')
      .mockRejectedValueOnce(new Error('forced owner detach failure'));

    let response;
    try {
      response = await rootAgent.resource('desktopRoutes').destroy({
        filterByTk: route.get('id'),
        portal: portal.get('uid'),
      });
    } finally {
      destroySpy.mockRestore();
    }
    const unchangedRoute = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: route.get('id'),
      appends: ['multiPortals'],
    });

    expect(response.status).toBe(500);
    expect(relationUids(unchangedRoute, 'multiPortals')).toEqual([otherPortal.get('uid'), portal.get('uid')].sort());
    expect(
      await app.db.getRepository('rolesMultiPortalDesktopRoutes').count({
        filter: {
          desktopRouteId: route.get('id'),
          multiPortalUid: [portal.get('uid'), otherPortal.get('uid')],
        },
      }),
    ).toBe(2);
  });

  it('moves a layout-mode route within the backing Layout scope without Portal ownership', async () => {
    const portal = await createPortal(app, {
      uid: 'layout-mode-move-portal',
      routePermissionMode: 'layout',
    });
    const sourceParent = await createRoute(app, 'LAYOUT MOVE SOURCE PARENT', 'layout-move-source-parent');
    const targetParent = await createRoute(app, 'LAYOUT MOVE TARGET PARENT', 'layout-move-target-parent');
    const source = await createRoute(app, 'LAYOUT MOVE SOURCE', 'layout-move-source');
    const target = await createRoute(app, 'LAYOUT MOVE TARGET', 'layout-move-target');
    for (const route of [sourceParent, targetParent, source, target]) {
      await app.db.getRepository('desktopRoutes.uiLayouts', route.get('id')).set({
        tk: [ADMIN_LAYOUT_UID],
      });
    }
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: source.get('id'),
      values: {
        parentId: sourceParent.get('id'),
        sort: 1,
      },
    });
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: target.get('id'),
      values: {
        parentId: targetParent.get('id'),
        sort: 2,
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').move({
      portal: portal.get('uid'),
      sourceId: source.get('id'),
      targetId: target.get('id'),
      sortField: 'sort',
    });
    const movedSource = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: source.get('id'),
      appends: ['uiLayouts', 'multiPortals'],
    });

    expect(response.status).toBe(200);
    expect(movedSource?.get('parentId')).toBe(targetParent.get('id'));
    expect(relationUids(movedSource, 'uiLayouts')).toEqual([ADMIN_LAYOUT_UID]);
    expect(relationUids(movedSource, 'multiPortals')).toEqual([]);
  });

  it('rolls back the parent and sort changes when a scoped move fails after its first write', async () => {
    const portal = await createPortal(app, {
      uid: 'atomic-move-portal',
      routePermissionMode: 'portal',
    });
    const sourceParent = await createRoute(app, 'ATOMIC MOVE SOURCE PARENT', 'atomic-move-source-parent');
    const targetParent = await createRoute(app, 'ATOMIC MOVE TARGET PARENT', 'atomic-move-target-parent');
    const source = await createRoute(app, 'ATOMIC MOVE SOURCE', 'atomic-move-source');
    const target = await createRoute(app, 'ATOMIC MOVE TARGET', 'atomic-move-target');
    for (const route of [sourceParent, targetParent, source, target]) {
      await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
        tk: [portal.get('uid')],
      });
    }
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: source.get('id'),
      values: {
        parentId: sourceParent.get('id'),
        sort: 1,
      },
    });
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: target.get('id'),
      values: {
        parentId: targetParent.get('id'),
        sort: 2,
      },
    });
    const [initialSource, initialTarget] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({ filterByTk: source.get('id') }),
      app.db.getRepository('desktopRoutes').findOne({ filterByTk: target.get('id') }),
    ]);
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    const desktopRoutes = app.db.getCollection('desktopRoutes');
    const incrementSpy = vi
      .spyOn(desktopRoutes.model, 'increment')
      .mockRejectedValueOnce(new Error('forced move failure'));

    let response;
    try {
      response = await rootAgent.resource('desktopRoutes').move({
        portal: portal.get('uid'),
        sourceId: source.get('id'),
        targetId: target.get('id'),
        sortField: 'sort',
      });
    } finally {
      incrementSpy.mockRestore();
    }
    const [unchangedSource, unchangedTarget] = await Promise.all([
      app.db.getRepository('desktopRoutes').findOne({ filterByTk: source.get('id') }),
      app.db.getRepository('desktopRoutes').findOne({ filterByTk: target.get('id') }),
    ]);

    expect(response.status).toBe(500);
    expect(unchangedSource?.get('parentId')).toBe(initialSource?.get('parentId'));
    expect(unchangedSource?.get('sort')).toBe(initialSource?.get('sort'));
    expect(unchangedTarget?.get('parentId')).toBe(initialTarget?.get('parentId'));
    expect(unchangedTarget?.get('sort')).toBe(initialTarget?.get('sort'));
  });

  it('moves a route within its effective Portal scope', async () => {
    const portal = await createPortal(app, {
      uid: 'successful-move-portal',
      routePermissionMode: 'portal',
    });
    const sourceParent = await createRoute(app, 'MOVE SOURCE PARENT', 'move-source-parent');
    const targetParent = await createRoute(app, 'MOVE TARGET PARENT', 'move-target-parent');
    const source = await createRoute(app, 'MOVE SOURCE', 'move-source');
    const target = await createRoute(app, 'MOVE TARGET', 'move-target');
    for (const route of [sourceParent, targetParent, source, target]) {
      await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
        tk: [portal.get('uid')],
      });
    }
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: source.get('id'),
      values: {
        parentId: sourceParent.get('id'),
      },
    });
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: target.get('id'),
      values: {
        parentId: targetParent.get('id'),
      },
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').move({
      portal: portal.get('uid'),
      sourceId: source.get('id'),
      targetId: target.get('id'),
      sortField: 'sort',
    });
    const movedSource = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: source.get('id'),
      appends: ['uiLayouts', 'multiPortals'],
    });

    expect(response.status).toBe(200);
    expect(movedSource?.get('parentId')).toBe(targetParent.get('id'));
    expect(relationUids(movedSource, 'uiLayouts')).toEqual([]);
    expect(relationUids(movedSource, 'multiPortals')).toEqual([portal.get('uid')]);
  });

  it('rejects a scoped move to a parent owned by another Portal', async () => {
    const portal = await createPortal(app, {
      uid: 'move-parent-portal-a',
      routePermissionMode: 'portal',
    });
    const otherPortal = await createPortal(app, {
      uid: 'move-parent-portal-b',
      routePermissionMode: 'portal',
    });
    const sourceParent = await createRoute(app, 'MOVE PARENT A', 'move-parent-a');
    const otherParent = await createRoute(app, 'MOVE PARENT B', 'move-parent-b');
    const source = await createRoute(app, 'MOVE PARENT SOURCE', 'move-parent-source');
    for (const route of [sourceParent, source]) {
      await app.db.getRepository('desktopRoutes.multiPortals', route.get('id')).set({
        tk: [portal.get('uid')],
      });
    }
    await app.db.getRepository('desktopRoutes.multiPortals', otherParent.get('id')).set({
      tk: [otherPortal.get('uid')],
    });
    await app.db.getRepository('desktopRoutes').update({
      filterByTk: source.get('id'),
      values: {
        parentId: sourceParent.get('id'),
      },
    });
    const initialSource = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: source.get('id'),
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const response = await rootAgent.resource('desktopRoutes').move({
      portal: portal.get('uid'),
      sourceId: source.get('id'),
      targetScope: {
        parentId: otherParent.get('id'),
      },
      method: 'prepend',
      sortField: 'sort',
    });
    const unchangedSource = await app.db.getRepository('desktopRoutes').findOne({
      filterByTk: source.get('id'),
    });

    expect(response.status).toBe(400);
    expect(unchangedSource?.get('parentId')).toBe(initialSource?.get('parentId'));
    expect(unchangedSource?.get('sort')).toBe(initialSource?.get('sort'));
  });

  it('rejects empty or mixed Portal scope parameters instead of falling back to a Layout scope', async () => {
    const portal = await createPortal(app, {
      uid: 'strict-scope-portal',
      routePermissionMode: 'portal',
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const emptyPortal = await rootAgent.resource('desktopRoutes').list({
      portal: '',
      paginate: false,
    });
    const emptyPortalWithLayout = await rootAgent.resource('desktopRoutes').list({
      portal: '',
      layout: ADMIN_LAYOUT_UID,
      paginate: false,
    });
    const portalWithEmptyLayout = await rootAgent.resource('desktopRoutes').list({
      portal: portal.get('uid'),
      layout: '',
      paginate: false,
    });

    expect(emptyPortal.status).toBe(400);
    expect(emptyPortalWithLayout.status).toBe(400);
    expect(portalWithEmptyLayout.status).toBe(400);
  });
});
