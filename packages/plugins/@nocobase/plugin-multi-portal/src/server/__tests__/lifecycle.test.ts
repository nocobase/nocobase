/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AppSupervisor } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';

const originalInitPortalType = process.env.INIT_PORTAL_TYPE;

async function createLifecycleServer() {
  return createMockServer({
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

describe('Multi Portal seed lifecycle', () => {
  let app: MockServer | undefined;

  afterEach(async () => {
    if (app?.name) {
      await AppSupervisor.getInstance().removeAppManifest(app.name, 'multi-portal');
    }
    await app?.destroy();
    app = undefined;
    if (originalInitPortalType === undefined) {
      delete process.env.INIT_PORTAL_TYPE;
    } else {
      process.env.INIT_PORTAL_TYPE = originalInitPortalType;
    }
  });

  it('seeds two portal-mode No-code portals only on a fresh install', async () => {
    process.env.INIT_PORTAL_TYPE = 'no-code';
    app = await createLifecycleServer();

    const portals = await app.db.getRepository('multiPortals').find({
      fields: ['uid', 'portalName', 'routePath', 'portalType', 'uiLayoutUid', 'routePermissionMode'],
      sort: ['uid'],
    });
    expect(
      portals.map((portal) => ({
        ...portal.toJSON(),
        uiLayoutUid: portal.get('uiLayoutUid'),
      })),
    ).toEqual([
      expect.objectContaining({
        uid: 'admin-layout-model',
        portalName: 'admin',
        routePath: '/admin',
        portalType: 'no-code',
        uiLayoutUid: 'admin-layout-model',
        routePermissionMode: 'portal',
      }),
      expect.objectContaining({
        uid: 'mobile-layout-model',
        portalName: 'mobile',
        routePath: '/mobile',
        portalType: 'no-code',
        uiLayoutUid: 'mobile-layout-model',
        routePermissionMode: 'portal',
      }),
    ]);
    for (const portal of portals) {
      expect(
        await app.db.getRepository('rolesMultiPortals').count({
          filter: { multiPortalUid: portal.get('uid') },
        }),
      ).toBeGreaterThan(0);
      expect(
        await app.db.getRepository('rolesMultiPortalRoutePolicies').count({
          filter: { multiPortalUid: portal.get('uid'), allowNewMenu: true },
        }),
      ).toBeGreaterThan(0);
    }
  });

  it('does not recreate a deleted default portal during enable or reconcile', async () => {
    process.env.INIT_PORTAL_TYPE = 'no-code';
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({
      filterByTk: 'admin-layout-model',
    });
    const plugin = app.pm.get('multi-portal') as { afterEnable: () => Promise<void> };

    await plugin.afterEnable();

    expect(
      await app.db.getRepository('multiPortals').count({
        filter: { uid: 'admin-layout-model' },
      }),
    ).toBe(0);
  });

  it('keeps the single AI seed without route policies', async () => {
    process.env.INIT_PORTAL_TYPE = 'ai';
    app = await createLifecycleServer();

    const portals = await app.db.getRepository('multiPortals').find({
      fields: ['uid', 'portalType', 'routePermissionMode'],
    });
    expect(portals).toHaveLength(1);
    expect(portals[0].toJSON()).toMatchObject({
      uid: '__default_portal__',
      portalType: 'ai',
      routePermissionMode: 'portal',
    });
    expect(await app.db.getRepository('rolesMultiPortals').count()).toBeGreaterThan(0);
    expect(await app.db.getRepository('rolesMultiPortalRoutePolicies').count()).toBe(0);
    expect(await app.db.getRepository('rolesMultiPortalDesktopRoutes').count()).toBe(0);
  });

  it('does not run an INIT seed when install is first called on a historical application', async () => {
    process.env.INIT_PORTAL_TYPE = 'no-code';
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({ truncate: true });
    await app.db.getRepository('roles').update({
      filter: {
        name: ['admin', 'member'],
      },
      values: {
        allowNewMultiPortal: null,
      },
    });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { afterEnable: () => Promise<void>; install: () => Promise<void> };

    await plugin.install();
    const afterInstall = await app.db.getRepository('roles').find({
      filter: {
        name: ['admin', 'member'],
      },
      fields: ['allowNewMultiPortal'],
    });
    await plugin.afterEnable();
    const afterEnable = await app.db.getRepository('roles').find({
      filter: {
        name: ['admin', 'member'],
      },
      fields: ['allowNewMultiPortal'],
    });

    expect(await app.db.getRepository('multiPortals').count()).toBe(0);
    expect(afterInstall.map((role) => role.get('allowNewMultiPortal'))).toEqual([null, null]);
    expect(afterEnable.map((role) => role.get('allowNewMultiPortal'))).toEqual([null, null]);
  });
});
