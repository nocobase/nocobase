/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Model } from '@nocobase/database';
import { AppSupervisor } from '@nocobase/server';
import { createMockServer, type MockServer } from '@nocobase/test';

const LEGACY_DEFAULT_PORTAL_UID = '__default_portal__';
const ADMIN_PORTAL_UID = 'admin-layout-model';
const MOBILE_PORTAL_UID = 'mobile-layout-model';
const originalInitPortalType = process.env.INIT_PORTAL_TYPE;
let routeCounter = 0;

type PortalValues = {
  uid: string;
  title?: string;
  icon?: string | null;
  portalType?: string | null;
  portalName: string;
  routePath?: string;
  authCheck?: boolean;
  enabled?: boolean;
  options?: Record<string, unknown>;
  uiLayoutUid?: string | null;
  routePermissionMode?: 'layout' | 'portal';
};

async function createMultiPortalServer() {
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

function getPortalModel(app: MockServer) {
  return app.db.getCollection('multiPortals').model;
}

async function createPortal(app: MockServer, values: PortalValues) {
  return getPortalModel(app).create(
    {
      title: 'Portal',
      portalType: 'no-code',
      routePath: `/${values.portalName}`,
      authCheck: true,
      enabled: true,
      options: {},
      uiLayoutUid: null,
      ...values,
    },
    { hooks: false },
  );
}

async function findPortal(app: MockServer, uid: string) {
  return getPortalModel(app).findByPk(uid);
}

async function createDesktopRoute(app: MockServer) {
  routeCounter += 1;
  return app.db.getRepository('desktopRoutes').create({
    values: {
      type: 'flowPage',
      title: `Migration route ${routeCounter}`,
      schemaUid: `migration-route-${routeCounter}`,
    },
  });
}

async function runMigration(app: MockServer) {
  const { default: Migration } = await import('../migrations/20260729120000-migrate-route-permission-mode');
  const migration = new Migration({ db: app.db, app } as never);
  await migration.up();
  return migration;
}

async function clearCollection(app: MockServer, name: string) {
  const collection = app.db.getCollection(name);
  if (!collection) {
    return;
  }
  await collection.model.destroy({ where: {}, force: true, hooks: false });
}

describe('multi-portal route permission mode migration', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMultiPortalServer();
  });

  beforeEach(async () => {
    for (const collectionName of [
      'rolesMultiPortalDesktopRoutes',
      'rolesMultiPortalRoutePolicies',
      'rolesMultiPortals',
      'desktopRoutesMultiPortals',
      'multiPortals',
    ]) {
      await clearCollection(app, collectionName);
    }
  });

  afterEach(() => {
    if (originalInitPortalType === undefined) {
      delete process.env.INIT_PORTAL_TYPE;
      return;
    }
    process.env.INIT_PORTAL_TYPE = originalInitPortalType;
  });

  afterAll(async () => {
    if (app.name) {
      await AppSupervisor.getInstance().removeAppManifest(app.name, 'multi-portal');
    }
    await app.destroy();
  });

  it('defines a non-null portal-default field limited to layout and portal', async () => {
    const field = app.db.getCollection('multiPortals').getField('routePermissionMode');

    expect(field?.options).toMatchObject({
      type: 'string',
      allowNull: false,
      defaultValue: 'portal',
      validate: {
        isIn: [['layout', 'portal']],
      },
    });

    const defaultPortal = await createPortal(app, {
      uid: 'default-mode-portal',
      portalName: 'default-mode-portal',
    });
    expect(defaultPortal.get('routePermissionMode')).toBe('portal');

    await expect(
      getPortalModel(app).create(
        {
          uid: 'invalid-mode-portal',
          title: 'Invalid mode',
          portalType: 'no-code',
          portalName: 'invalid-mode-portal',
          routePath: '/invalid-mode-portal',
          authCheck: true,
          enabled: true,
          routePermissionMode: 'invalid',
        },
        { hooks: false },
      ),
    ).rejects.toThrow();
  });

  it('keeps routePermissionMode read-only across management create, update, and firstOrCreate', async () => {
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const rejectedCreate = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'managed-layout-mode',
        title: 'Managed layout mode',
        portalType: 'no-code',
        portalName: 'managed-layout-mode',
        routePath: '/managed-layout-mode',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_PORTAL_UID,
        routePermissionMode: 'layout',
      },
    });
    const created = await rootAgent.resource('multiPortals').create({
      values: {
        uid: 'managed-portal-mode',
        title: 'Managed portal mode',
        portalType: 'no-code',
        portalName: 'managed-portal-mode',
        routePath: '/managed-portal-mode',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_PORTAL_UID,
      },
    });
    const rejectedUpdate = await rootAgent.resource('multiPortals').update({
      filterByTk: 'managed-portal-mode',
      values: {
        routePermissionMode: 'layout',
      },
    });
    const rejectedFirstOrCreate = await rootAgent.resource('multiPortals').firstOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'managed-first-or-create-mode',
        title: 'Managed first or create mode',
        portalType: 'no-code',
        portalName: 'managed-first-or-create-mode',
        routePath: '/managed-first-or-create-mode',
        authCheck: true,
        enabled: true,
        uiLayoutUid: ADMIN_PORTAL_UID,
        routePermissionMode: 'layout',
      },
    });

    expect(rejectedCreate.status).toBe(400);
    expect(created.status).toBe(200);
    expect(rejectedUpdate.status).toBe(400);
    expect(rejectedFirstOrCreate.status).toBe(400);
    expect(await findPortal(app, 'managed-layout-mode')).toBeNull();
    expect((await findPortal(app, 'managed-portal-mode'))?.get('routePermissionMode')).toBe('portal');
    expect(await findPortal(app, 'managed-first-or-create-mode')).toBeNull();
  });

  it('applies management write protections to updateOrCreate', async () => {
    await createPortal(app, {
      uid: 'managed-upsert-mode',
      portalName: 'managed-upsert-mode',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    await createPortal(app, {
      uid: 'managed-upsert-layout',
      portalName: 'managed-upsert-layout',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    await createPortal(app, {
      uid: ADMIN_PORTAL_UID,
      portalName: 'admin',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const rejectedModeUpdate = await rootAgent.resource('multiPortals').updateOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'managed-upsert-mode',
        routePermissionMode: 'layout',
      },
    });
    const rejectedBackingLayoutUpdate = await rootAgent.resource('multiPortals').updateOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: 'managed-upsert-layout',
        uiLayoutUid: MOBILE_PORTAL_UID,
      },
    });
    const rejectedCanonicalUpdate = await rootAgent.resource('multiPortals').updateOrCreate({
      filterKeys: ['uid'],
      values: {
        uid: ADMIN_PORTAL_UID,
        portalName: 'renamed-admin',
      },
    });

    expect(rejectedModeUpdate.status).toBe(400);
    expect(rejectedBackingLayoutUpdate.status).toBe(400);
    expect(rejectedCanonicalUpdate.status).toBe(400);
    expect((await findPortal(app, 'managed-upsert-mode'))?.get('routePermissionMode')).toBe('portal');
    expect((await findPortal(app, 'managed-upsert-layout'))?.get('uiLayoutUid')).toBe(ADMIN_PORTAL_UID);
    expect((await findPortal(app, ADMIN_PORTAL_UID))?.get('portalName')).toBe('admin');
  });

  it('rejects routePermissionMode in batched management values', async () => {
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);
    await createPortal(app, {
      uid: 'managed-batch-update-a',
      portalName: 'managed-batch-update-a',
    });
    await createPortal(app, {
      uid: 'managed-batch-update-b',
      portalName: 'managed-batch-update-b',
    });

    const rejectedCreate = await rootAgent.resource('multiPortals').create({
      values: [
        {
          uid: 'managed-batch-create-a',
          title: 'Managed batch create A',
          portalType: 'no-code',
          portalName: 'managed-batch-create-a',
          routePath: '/managed-batch-create-a',
          authCheck: true,
          enabled: true,
          uiLayoutUid: ADMIN_PORTAL_UID,
          routePermissionMode: 'layout',
        },
        {
          uid: 'managed-batch-create-b',
          title: 'Managed batch create B',
          portalType: 'no-code',
          portalName: 'managed-batch-create-b',
          routePath: '/managed-batch-create-b',
          authCheck: true,
          enabled: true,
          uiLayoutUid: ADMIN_PORTAL_UID,
        },
      ],
    });
    const rejectedUpdate = await rootAgent.resource('multiPortals').update({
      filter: {
        uid: ['managed-batch-update-a', 'managed-batch-update-b'],
      },
      values: [
        {
          uid: 'managed-batch-update-a',
          title: 'Forged layout mode',
          routePermissionMode: 'layout',
        },
        {
          uid: 'managed-batch-update-b',
          title: 'Should remain unchanged',
        },
      ],
    });
    const rejectedFirstOrCreate = await rootAgent.resource('multiPortals').firstOrCreate({
      filterKeys: ['uid'],
      values: [
        {
          uid: 'managed-batch-first-or-create-a',
          title: 'Managed batch first or create A',
          portalType: 'no-code',
          portalName: 'managed-batch-first-or-create-a',
          routePath: '/managed-batch-first-or-create-a',
          authCheck: true,
          enabled: true,
          uiLayoutUid: ADMIN_PORTAL_UID,
          routePermissionMode: 'layout',
        },
        {
          uid: 'managed-batch-first-or-create-b',
          title: 'Managed batch first or create B',
          portalType: 'no-code',
          portalName: 'managed-batch-first-or-create-b',
          routePath: '/managed-batch-first-or-create-b',
          authCheck: true,
          enabled: true,
          uiLayoutUid: ADMIN_PORTAL_UID,
        },
      ],
    });

    expect(rejectedCreate.status).toBe(400);
    expect(rejectedUpdate.status).toBe(400);
    expect(rejectedFirstOrCreate.status).toBe(400);
    expect(await findPortal(app, 'managed-batch-create-a')).toBeNull();
    expect((await findPortal(app, 'managed-batch-update-a'))?.get('routePermissionMode')).toBe('portal');
    expect((await findPortal(app, 'managed-batch-update-a'))?.get('title')).toBe('Portal');
    expect((await findPortal(app, 'managed-batch-update-b'))?.get('title')).toBe('Portal');
    expect(await findPortal(app, 'managed-batch-first-or-create-a')).toBeNull();
  });

  it('enforces canonical identity and backing Layout immutability for filter-based updates', async () => {
    await createPortal(app, {
      uid: ADMIN_PORTAL_UID,
      portalName: 'admin',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    await createPortal(app, {
      uid: 'filter-update-portal',
      portalName: 'filter-update-portal',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    const rootUser = await app.db.getRepository('users').findOne({
      filter: {
        'roles.name': 'root',
      },
    });
    const rootAgent = await app.agent().login(rootUser);

    const rejectedCanonicalUpdate = await rootAgent.resource('multiPortals').update({
      filter: {
        uid: ADMIN_PORTAL_UID,
      },
      values: {
        portalName: 'renamed-admin',
      },
    });
    const rejectedBackingLayoutUpdate = await rootAgent.resource('multiPortals').update({
      filter: {
        uid: 'filter-update-portal',
      },
      values: {
        uiLayoutUid: MOBILE_PORTAL_UID,
      },
    });

    expect(rejectedCanonicalUpdate.status).toBe(400);
    expect(rejectedBackingLayoutUpdate.status).toBe(400);
    expect((await findPortal(app, ADMIN_PORTAL_UID))?.get('portalName')).toBe('admin');
    expect((await findPortal(app, 'filter-update-portal'))?.get('uiLayoutUid')).toBe(ADMIN_PORTAL_UID);
  });

  it('converts the legacy no-code seed and creates canonical Desktop and Mobile portals', async () => {
    process.env.INIT_PORTAL_TYPE = 'ai';
    await createPortal(app, {
      uid: LEGACY_DEFAULT_PORTAL_UID,
      title: 'Customized desktop',
      icon: 'CustomizedIcon',
      portalName: 'legacy-admin',
      routePath: '/legacy-admin',
      enabled: false,
      options: { marker: 'preserved' },
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    const updateSpy = vi.spyOn(getPortalModel(app), 'update');

    const migration = await runMigration(app);
    const rekeyedLegacyPrimaryKey = updateSpy.mock.calls.some(([values, options]) => {
      const nextValues = values as Record<string, unknown>;
      const where = (options as { where?: Record<string, unknown> }).where;
      return nextValues.uid === ADMIN_PORTAL_UID && where?.uid === LEGACY_DEFAULT_PORTAL_UID;
    });
    updateSpy.mockRestore();

    expect(migration.on).toBe('afterSync');
    expect(migration.appVersion).toBe('<2.2.0-alpha.12');
    expect(rekeyedLegacyPrimaryKey).toBe(false);
    expect(await findPortal(app, LEGACY_DEFAULT_PORTAL_UID)).toBeNull();
    const adminPortal = await findPortal(app, ADMIN_PORTAL_UID);
    expect(adminPortal?.toJSON()).toMatchObject({
      uid: ADMIN_PORTAL_UID,
      title: 'Customized desktop',
      icon: 'CustomizedIcon',
      portalType: 'no-code',
      portalName: 'admin',
      routePath: '/admin',
      authCheck: true,
      enabled: false,
      options: { marker: 'preserved' },
      routePermissionMode: 'layout',
    });
    expect(adminPortal?.get('uiLayoutUid')).toBe(ADMIN_PORTAL_UID);
    const mobilePortal = await findPortal(app, MOBILE_PORTAL_UID);
    expect(mobilePortal?.toJSON()).toMatchObject({
      uid: MOBILE_PORTAL_UID,
      title: 'Mobile layout',
      icon: 'MobileOutlined',
      portalType: 'no-code',
      portalName: 'mobile',
      routePath: '/mobile',
      authCheck: true,
      enabled: true,
      routePermissionMode: 'layout',
    });
    expect(mobilePortal?.get('uiLayoutUid')).toBe(MOBILE_PORTAL_UID);
  });

  it('creates canonical no-code portals without a legacy seed and remains idempotent', async () => {
    const warnSpy = vi.spyOn(app.logger, 'warn');
    await createPortal(app, {
      uid: 'ordinary-no-code',
      portalName: 'ordinary-no-code',
      routePermissionMode: 'layout',
    });

    await runMigration(app);
    const firstSnapshot = (await getPortalModel(app).findAll({ order: [['uid', 'ASC']] })).map((portal: Model) =>
      portal.toJSON(),
    );
    await runMigration(app);
    const secondSnapshot = (await getPortalModel(app).findAll({ order: [['uid', 'ASC']] })).map((portal: Model) =>
      portal.toJSON(),
    );

    expect(secondSnapshot).toEqual(firstSnapshot);
    expect((await findPortal(app, 'ordinary-no-code'))?.get('routePermissionMode')).toBe('portal');
    expect((await findPortal(app, ADMIN_PORTAL_UID))?.get('routePermissionMode')).toBe('layout');
    expect((await findPortal(app, MOBILE_PORTAL_UID))?.get('routePermissionMode')).toBe('layout');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Legacy initial Portal '${LEGACY_DEFAULT_PORTAL_UID}' was not found`),
      expect.objectContaining({
        module: 'multi-portal',
        migration: 'route-permission-mode',
      }),
    );
    warnSpy.mockRestore();
  });

  it('preserves an AI legacy seed and does not create Desktop or Mobile portals', async () => {
    process.env.INIT_PORTAL_TYPE = 'no-code';
    await createPortal(app, {
      uid: LEGACY_DEFAULT_PORTAL_UID,
      title: 'AI employee portal',
      icon: 'RobotOutlined',
      portalType: 'ai',
      portalName: 'assistant',
      routePath: '/assistant',
      authCheck: false,
      enabled: false,
      options: {
        sourceStorage: 'git',
        git: { repo: 'git@example.com:portal.git', branch: 'main', path: 'portal' },
      },
      routePermissionMode: 'layout',
    });

    await runMigration(app);
    await runMigration(app);

    expect((await findPortal(app, LEGACY_DEFAULT_PORTAL_UID))?.toJSON()).toMatchObject({
      uid: LEGACY_DEFAULT_PORTAL_UID,
      title: 'AI employee portal',
      icon: 'RobotOutlined',
      portalType: 'ai',
      portalName: 'assistant',
      routePath: '/assistant',
      authCheck: false,
      enabled: false,
      options: {
        sourceStorage: 'git',
        git: { repo: 'git@example.com:portal.git', branch: 'main', path: 'portal' },
      },
      routePermissionMode: 'portal',
    });
    expect(await findPortal(app, ADMIN_PORTAL_UID)).toBeNull();
    expect(await findPortal(app, MOBILE_PORTAL_UID)).toBeNull();
    const nonRootRoleNames = (await app.db.getRepository('roles').find({ fields: ['name'] }))
      .map((role) => role.get('name'))
      .filter((roleName): roleName is string => typeof roleName === 'string' && roleName !== 'root')
      .sort();
    const portalRoleNames = (
      await app.db.getRepository('rolesMultiPortals').find({
        filter: {
          multiPortalUid: LEGACY_DEFAULT_PORTAL_UID,
        },
        fields: ['roleName'],
      })
    )
      .map((relation) => relation.get('roleName'))
      .sort();
    expect(portalRoleNames).toEqual(nonRootRoleNames);
    expect(await app.db.getRepository('rolesMultiPortalDesktopRoutes').count()).toBe(0);
    expect(await app.db.getRepository('rolesMultiPortalRoutePolicies').count()).toBe(0);
    expect(await app.db.getRepository('desktopRoutesMultiPortals').count()).toBe(0);
  });

  it.each([
    ['uid', { uid: ADMIN_PORTAL_UID, portalName: 'occupied-uid', uiLayoutUid: null }],
    ['slug', { uid: 'occupied-slug', portalName: 'admin', uiLayoutUid: null }],
    ['backing layout', { uid: 'occupied-layout', portalName: 'occupied-layout', uiLayoutUid: ADMIN_PORTAL_UID }],
  ] satisfies Array<[string, PortalValues]>)(
    'fails transactionally when a canonical %s is occupied',
    async (_, values) => {
      await createPortal(app, {
        uid: 'rollback-sentinel',
        portalName: 'rollback-sentinel',
        routePermissionMode: 'layout',
      });
      await createPortal(app, values);

      await expect(runMigration(app)).rejects.toThrow(/canonical portal.*admin/i);

      expect((await findPortal(app, 'rollback-sentinel'))?.get('routePermissionMode')).toBe('layout');
      expect(await findPortal(app, MOBILE_PORTAL_UID)).toBeNull();
    },
  );

  it('rejects re-keying a legacy seed that owns Portal ACL or route relations', async () => {
    await createPortal(app, {
      uid: LEGACY_DEFAULT_PORTAL_UID,
      portalName: 'admin',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    const role = await app.db.getRepository('roles').findOne({ fields: ['name'] });
    const desktopRoute = await createDesktopRoute(app);
    expect(role).toBeTruthy();
    expect(desktopRoute).toBeTruthy();

    await app.db.getRepository('rolesMultiPortals').create({
      values: {
        roleName: role?.get('name'),
        multiPortalUid: LEGACY_DEFAULT_PORTAL_UID,
      },
    });
    await app.db.getRepository('rolesMultiPortalRoutePolicies').create({
      values: {
        roleName: role?.get('name'),
        multiPortalUid: LEGACY_DEFAULT_PORTAL_UID,
        allowNewMenu: true,
      },
    });
    await app.db.getRepository('rolesMultiPortalDesktopRoutes').create({
      values: {
        roleName: role?.get('name'),
        multiPortalUid: LEGACY_DEFAULT_PORTAL_UID,
        desktopRouteId: desktopRoute?.get('id'),
      },
    });
    await app.db.getRepository('desktopRoutes.multiPortals', desktopRoute?.get('id')).add({
      tk: LEGACY_DEFAULT_PORTAL_UID,
    });

    await expect(runMigration(app)).rejects.toThrow(
      /rolesMultiPortals=1.*rolesMultiPortalDesktopRoutes=1.*rolesMultiPortalRoutePolicies=1.*desktopRoutesMultiPortals=1/i,
    );

    expect(await findPortal(app, LEGACY_DEFAULT_PORTAL_UID)).toBeTruthy();
    expect(await findPortal(app, ADMIN_PORTAL_UID)).toBeNull();
  });

  it.each([
    'rolesMultiPortals',
    'rolesMultiPortalDesktopRoutes',
    'rolesMultiPortalRoutePolicies',
    'desktopRoutesMultiPortals',
  ] as const)('rejects a canonical Portal that already owns an unexpected %s relation', async (relationName) => {
    await createPortal(app, {
      uid: ADMIN_PORTAL_UID,
      portalName: 'admin',
      uiLayoutUid: ADMIN_PORTAL_UID,
      routePermissionMode: 'portal',
    });
    const role = await app.db.getRepository('roles').findOne({ fields: ['name'] });
    const desktopRoute = await createDesktopRoute(app);
    expect(role).toBeTruthy();
    expect(desktopRoute).toBeTruthy();

    if (relationName === 'rolesMultiPortals') {
      await app.db.getRepository(relationName).create({
        values: {
          roleName: role?.get('name'),
          multiPortalUid: ADMIN_PORTAL_UID,
        },
      });
    } else if (relationName === 'rolesMultiPortalRoutePolicies') {
      await app.db.getRepository(relationName).create({
        values: {
          roleName: role?.get('name'),
          multiPortalUid: ADMIN_PORTAL_UID,
          allowNewMenu: true,
        },
      });
    } else if (relationName === 'rolesMultiPortalDesktopRoutes') {
      await app.db.getRepository(relationName).create({
        values: {
          roleName: role?.get('name'),
          multiPortalUid: ADMIN_PORTAL_UID,
          desktopRouteId: desktopRoute?.get('id'),
        },
      });
    } else {
      await app.db.getRepository('desktopRoutes.multiPortals', desktopRoute?.get('id')).add({
        tk: ADMIN_PORTAL_UID,
      });
    }

    await expect(runMigration(app)).rejects.toThrow(new RegExp(`${relationName}=1`, 'i'));

    expect((await findPortal(app, ADMIN_PORTAL_UID))?.get('routePermissionMode')).toBe('portal');
    expect(await findPortal(app, MOBILE_PORTAL_UID)).toBeNull();
    expect(
      await app.db.getRepository(relationName).count({
        filter: {
          multiPortalUid: ADMIN_PORTAL_UID,
        },
      }),
    ).toBe(1);
  });

  it('does not copy or mutate historical Desktop and Mobile layout permissions', async () => {
    await createPortal(app, {
      uid: LEGACY_DEFAULT_PORTAL_UID,
      portalName: 'admin',
      uiLayoutUid: ADMIN_PORTAL_UID,
    });
    const role = await app.db.getRepository('roles').findOne({ fields: ['name'] });
    const desktopRoute = await createDesktopRoute(app);
    expect(role).toBeTruthy();
    expect(desktopRoute).toBeTruthy();

    expect(
      await app.db.getRepository('rolesDesktopRoutes').count({
        filter: {
          roleName: role?.get('name'),
          desktopRouteId: desktopRoute?.get('id'),
        },
      }),
    ).toBe(1);
    await app.db.getRepository('desktopRoutes.uiLayouts', desktopRoute?.get('id')).add({ tk: ADMIN_PORTAL_UID });

    await runMigration(app);

    expect(
      await app.db.getRepository('rolesDesktopRoutes').count({
        filter: {
          roleName: role?.get('name'),
          desktopRouteId: desktopRoute?.get('id'),
        },
      }),
    ).toBe(1);
    expect(
      await app.db.getRepository('desktopRoutes.uiLayouts', desktopRoute?.get('id')).count({
        filterByTk: ADMIN_PORTAL_UID,
      }),
    ).toBe(1);
    expect(await app.db.getRepository('rolesMultiPortals').count()).toBe(0);
    expect(await app.db.getRepository('rolesMultiPortalDesktopRoutes').count()).toBe(0);
    expect(await app.db.getRepository('rolesMultiPortalRoutePolicies').count()).toBe(0);
    expect(await app.db.getRepository('desktopRoutesMultiPortals').count()).toBe(0);
  });
});
