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
  });

  it('seeds the default AI Portal and fixed No-code Portals on a fresh install', async () => {
    app = await createLifecycleServer();

    const portals = await app.db.getRepository('multiPortals').find({
      fields: ['uid', 'portalName', 'routePath', 'portalType', 'uiLayoutUid', 'isDefault'],
      sort: ['uid'],
    });
    expect(
      portals.map((portal) => ({
        ...portal.toJSON(),
        uiLayoutUid: portal.get('uiLayoutUid'),
      })),
    ).toEqual([
      expect.objectContaining({
        uid: '__default_admin__',
        portalName: 'admin',
        routePath: '/admin',
        portalType: 'no-code',
        uiLayoutUid: 'admin-layout-model',
        isDefault: null,
      }),
      expect.objectContaining({
        uid: '__default_mobile__',
        portalName: 'mobile',
        routePath: '/mobile',
        portalType: 'no-code',
        uiLayoutUid: 'mobile-layout-model',
        isDefault: null,
      }),
      expect.objectContaining({
        uid: '__default_portal__',
        portalName: 'main',
        routePath: '/main',
        portalType: 'ai',
        uiLayoutUid: 'admin-layout-model',
        isDefault: true,
      }),
    ]);
    for (const portal of portals) {
      expect(
        await app.db.getRepository('rolesMultiPortals').count({
          filter: { multiPortalUid: portal.get('uid') },
        }),
      ).toBeGreaterThan(0);
      const routePolicyCount = await app.db.getRepository('rolesMultiPortalRoutePolicies').count({
        filter: { multiPortalUid: portal.get('uid'), allowNewMenu: true },
      });
      if (portal.get('portalType') === 'no-code') {
        expect(routePolicyCount).toBeGreaterThan(0);
      } else {
        expect(routePolicyCount).toBe(0);
      }
    }
  });

  it('does not recreate a deleted default portal during enable or reconcile', async () => {
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({
      filterByTk: '__default_portal__',
    });
    const plugin = app.pm.get('multi-portal') as { afterEnable: () => Promise<void> };

    await plugin.afterEnable();

    expect(
      await app.db.getRepository('multiPortals').count({
        filter: { uid: '__default_portal__' },
      }),
    ).toBe(0);
  });

  it('seeds the default AI Portal and fixed Layout-backed Portals when first installed on a historical application', async () => {
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

    const portals = await app.db.getRepository('multiPortals').find({
      fields: ['uid', 'portalName', 'routePath', 'portalType', 'uiLayoutUid', 'isDefault'],
      sort: ['uid'],
    });
    expect(
      portals.map((portal) => ({
        ...portal.toJSON(),
        uiLayoutUid: portal.get('uiLayoutUid'),
      })),
    ).toEqual([
      expect.objectContaining({
        uid: '__default_admin__',
        portalName: 'admin',
        routePath: '/admin',
        portalType: 'no-code',
        uiLayoutUid: 'admin-layout-model',
        isDefault: null,
      }),
      expect.objectContaining({
        uid: '__default_mobile__',
        portalName: 'mobile',
        routePath: '/mobile',
        portalType: 'no-code',
        uiLayoutUid: 'mobile-layout-model',
        isDefault: null,
      }),
      expect.objectContaining({
        uid: '__default_portal__',
        portalName: 'main',
        routePath: '/main',
        portalType: 'ai',
        uiLayoutUid: 'admin-layout-model',
        isDefault: null,
      }),
    ]);
    for (const portal of portals) {
      expect(
        await app.db.getRepository('rolesMultiPortals').count({
          filter: { multiPortalUid: portal.get('uid') },
        }),
      ).toBe(0);
      expect(
        await app.db.getRepository('rolesMultiPortalRoutePolicies').count({
          filter: { multiPortalUid: portal.get('uid') },
        }),
      ).toBe(0);
    }
    expect(afterInstall.map((role) => role.get('allowNewMultiPortal'))).toEqual([null, null]);
    expect(afterEnable.map((role) => role.get('allowNewMultiPortal'))).toEqual([null, null]);
  });

  it('silently skips an occupied Admin name while still creating the Mobile Portal', async () => {
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({ truncate: true });
    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'existing-admin-portal',
        title: 'Existing Admin Portal',
        portalType: 'no-code',
        portalName: 'admin',
        routePath: '/admin',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'admin-layout-model',
      },
    });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };

    await expect(plugin.install()).resolves.toBeUndefined();

    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_admin__' } })).toBe(0);
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_mobile__' } })).toBe(1);
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_portal__' } })).toBe(1);
    expect(
      await app.db
        .getRepository('multiPortals')
        .count({ filter: { uid: 'existing-admin-portal', portalName: 'admin' } }),
    ).toBe(1);
  });

  it('silently skips an occupied Mobile name while still creating the Admin Portal', async () => {
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({ truncate: true });
    await app.db.getRepository('multiPortals').create({
      values: {
        uid: 'existing-mobile-portal',
        title: 'Existing Mobile Portal',
        portalType: 'no-code',
        portalName: 'mobile',
        routePath: '/mobile',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'mobile-layout-model',
      },
    });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };

    await expect(plugin.install()).resolves.toBeUndefined();

    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_admin__' } })).toBe(1);
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_mobile__' } })).toBe(0);
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_portal__' } })).toBe(1);
    expect(
      await app.db
        .getRepository('multiPortals')
        .count({ filter: { uid: 'existing-mobile-portal', portalName: 'mobile' } }),
    ).toBe(1);
  });

  it('keeps an existing fixed UID untouched while creating the other default Portal', async () => {
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({ truncate: true });
    await app.db.getRepository('multiPortals').create({
      values: {
        uid: '__default_admin__',
        title: 'Existing fixed UID',
        portalType: 'no-code',
        portalName: 'existing-fixed-admin',
        routePath: '/existing-fixed-admin',
        authCheck: false,
        enabled: false,
        uiLayoutUid: 'admin-layout-model',
      },
    });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };

    await expect(plugin.install()).resolves.toBeUndefined();

    const existing = await app.db.getRepository('multiPortals').findOne({ filterByTk: '__default_admin__' });
    expect(existing?.toJSON()).toMatchObject({
      title: 'Existing fixed UID',
      portalName: 'existing-fixed-admin',
      authCheck: false,
      enabled: false,
    });
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_mobile__' } })).toBe(1);
    expect(await app.db.getRepository('multiPortals').count({ filter: { uid: '__default_portal__' } })).toBe(1);
  });

  it('repairs fixed Layout-backed Portals with a missing portal type', async () => {
    app = await createLifecycleServer();
    const repository = app.db.getRepository('multiPortals');
    await repository.destroy({ truncate: true });
    await repository.create({
      values: {
        uid: '__default_admin__',
        title: 'Desktop layout',
        portalType: null,
        portalName: 'admin',
        routePath: '/admin',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'admin-layout-model',
      },
    });
    await repository.create({
      values: {
        uid: '__default_mobile__',
        title: 'Mobile layout',
        portalType: null,
        portalName: 'mobile',
        routePath: '/mobile',
        authCheck: true,
        enabled: true,
        uiLayoutUid: 'mobile-layout-model',
      },
    });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { afterEnable: () => Promise<void>; install: () => Promise<void> };

    await expect(plugin.install()).resolves.toBeUndefined();
    await plugin.afterEnable();

    const portals = await repository.find({
      fields: ['uid', 'portalType', 'portalName', 'routePath', 'uiLayoutUid'],
      sort: ['uid'],
    });
    expect(
      portals.map((portal) => ({
        ...portal.toJSON(),
        uiLayoutUid: portal.get('uiLayoutUid'),
      })),
    ).toEqual([
      expect.objectContaining({
        uid: '__default_admin__',
        portalType: 'no-code',
        portalName: 'admin',
        routePath: '/admin',
        uiLayoutUid: 'admin-layout-model',
      }),
      expect.objectContaining({
        uid: '__default_mobile__',
        portalType: 'no-code',
        portalName: 'mobile',
        routePath: '/mobile',
        uiLayoutUid: 'mobile-layout-model',
      }),
      expect.objectContaining({
        uid: '__default_portal__',
        portalType: 'ai',
        portalName: 'main',
        routePath: '/main',
        uiLayoutUid: 'admin-layout-model',
      }),
    ]);
  });

  it('creates the historical default AI Portal before best-effort fixed Portals', async () => {
    app = await createLifecycleServer();
    await app.db.getRepository('multiPortals').destroy({ truncate: true });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };

    await expect(plugin.install()).resolves.toBeUndefined();

    const portals = await app.db.getRepository('multiPortals').find({
      fields: ['uid', 'portalType', 'portalName', 'isDefault'],
      sort: ['uid'],
    });
    expect(portals.map((portal) => portal.toJSON())).toEqual([
      expect.objectContaining({
        uid: '__default_admin__',
        portalType: 'no-code',
        portalName: 'admin',
        isDefault: null,
      }),
      expect.objectContaining({
        uid: '__default_mobile__',
        portalType: 'no-code',
        portalName: 'mobile',
        isDefault: null,
      }),
      expect.objectContaining({ uid: '__default_portal__', portalType: 'ai', portalName: 'main', isDefault: null }),
    ]);
  });

  it('silently skips a concurrent unique conflict without preventing the other fixed Portal', async () => {
    app = await createLifecycleServer();
    const repository = app.db.getRepository('multiPortals');
    await repository.destroy({ truncate: true });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    const originalCreate = repository.create.bind(repository);
    const concurrentError = Object.assign(new Error('concurrent duplicate portal'), {
      name: 'SequelizeUniqueConstraintError',
    });
    const createSpy = vi.spyOn(repository, 'create').mockImplementation(async (options) => {
      const uid = (options.values as Record<string, unknown>).uid;
      if (uid === '__default_admin__') {
        throw concurrentError;
      }
      return originalCreate(options);
    });
    const warnSpy = vi.spyOn(app.logger, 'warn');
    const errorSpy = vi.spyOn(app.logger, 'error');

    try {
      await expect(plugin.install()).resolves.toBeUndefined();
    } finally {
      createSpy.mockRestore();
    }

    expect(await repository.count({ filter: { uid: '__default_admin__' } })).toBe(0);
    expect(await repository.count({ filter: { uid: '__default_mobile__' } })).toBe(1);
    expect(await repository.count({ filter: { uid: '__default_portal__' } })).toBe(1);
    expect([...warnSpy.mock.calls, ...errorSpy.mock.calls].flat().join(' ')).not.toContain(
      'concurrent duplicate portal',
    );
  });

  it('preserves non-unique database errors while creating fixed Portals', async () => {
    app = await createLifecycleServer();
    const repository = app.db.getRepository('multiPortals');
    await repository.destroy({ truncate: true });
    await app.version.update('2.2.0-alpha.11');
    const plugin = app.pm.get('multi-portal') as { install: () => Promise<void> };
    const originalCreate = repository.create.bind(repository);
    const databaseError = new Error('database unavailable');
    const createSpy = vi.spyOn(repository, 'create').mockImplementation(async (options) => {
      const uid = (options.values as Record<string, unknown>).uid;
      if (uid === '__default_admin__') {
        throw databaseError;
      }
      return originalCreate(options);
    });

    try {
      await expect(plugin.install()).rejects.toBe(databaseError);
    } finally {
      createSpy.mockRestore();
    }

    expect(await repository.count({ filter: { uid: '__default_admin__' } })).toBe(0);
    expect(await repository.count({ filter: { uid: '__default_mobile__' } })).toBe(0);
    expect(await repository.count({ filter: { uid: '__default_portal__' } })).toBe(1);
  });

  it('does not expose a persisted route permission mode field', async () => {
    app = await createLifecycleServer();

    expect(app.db.getCollection('multiPortals').getField('routePermissionMode')).toBeUndefined();
  });
});
