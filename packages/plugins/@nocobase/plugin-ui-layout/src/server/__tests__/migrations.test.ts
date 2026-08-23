/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, type MockServer } from '@nocobase/test';
import { DEFAULT_ADMIN_UI_LAYOUT, DEFAULT_MOBILE_UI_LAYOUT } from '../../constants';
import BackfillAdminLayoutDesktopRoutesMigration from '../migrations/20260615090000-backfill-admin-layout-desktop-routes';
import BackfillLateAdminLayoutDesktopRoutesMigration from '../migrations/20260823160000-backfill-late-admin-layout-desktop-routes';

describe('plugin-ui-layout migrations', () => {
  let app: MockServer | undefined;

  afterEach(async () => {
    await app?.destroy();
    app = undefined;
  });

  it('should repair AdminLayout routes created after afterSync migrations without changing other layout owners', async () => {
    app = await createMockServer({
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

    const earlyMigration = new BackfillAdminLayoutDesktopRoutesMigration({ db: app.db, app } as never);
    expect(earlyMigration.on).toBe('afterSync');
    await earlyMigration.up();

    const lateGroup = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'group',
        title: 'late legacy group',
        schemaUid: 'late-legacy-group',
      },
    });
    const latePage = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'page',
        title: 'late legacy page',
        schemaUid: 'late-legacy-page',
        parentId: lateGroup.get('id'),
      },
    });
    const lateTab = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'tabs',
        title: 'late legacy tab',
        schemaUid: 'late-legacy-tab',
        parentId: latePage.get('id'),
      },
    });
    const mobileOwnedRoute = await app.db.getRepository('desktopRoutes').create({
      values: {
        type: 'page',
        title: 'mobile owned route',
        schemaUid: 'mobile-owned-route',
      },
    });
    await app.db.getRepository('desktopRoutes.uiLayouts', mobileOwnedRoute.get('id')).set({
      tk: [DEFAULT_MOBILE_UI_LAYOUT.uid],
    });
    await app.db.getRepository('uiLayouts').destroy({
      filterByTk: DEFAULT_ADMIN_UI_LAYOUT.uid,
    });

    const migration = new BackfillLateAdminLayoutDesktopRoutesMigration({ db: app.db, app } as never);

    expect(migration.on).toBe('afterLoad');
    await migration.up();
    await migration.up();

    const routes = await Promise.all(
      [lateGroup, latePage, lateTab, mobileOwnedRoute].map((route) =>
        app.db.getRepository('desktopRoutes').findOne({
          filterByTk: route.get('id'),
          appends: ['uiLayouts'],
        }),
      ),
    );
    const layoutUids = routes.map(
      (route) => route?.get('uiLayouts').map((layout: { get: (field: string) => unknown }) => layout.get('uid')),
    );
    const restoredAdminLayout = await app.db.getRepository('uiLayouts').findOne({
      filterByTk: DEFAULT_ADMIN_UI_LAYOUT.uid,
    });

    expect(restoredAdminLayout).not.toBeNull();
    expect(layoutUids).toEqual([
      [DEFAULT_ADMIN_UI_LAYOUT.uid],
      [DEFAULT_ADMIN_UI_LAYOUT.uid],
      [DEFAULT_ADMIN_UI_LAYOUT.uid],
      [DEFAULT_MOBILE_UI_LAYOUT.uid],
    ]);
  });

  it('should reject instead of marking an incomplete schema backfill as successful', async () => {
    const migration = new BackfillLateAdminLayoutDesktopRoutesMigration({
      db: {
        getCollection: () => undefined,
      },
      app: {},
    } as never);

    await expect(migration.up()).rejects.toThrow(
      'The desktopRoutes collection is required to backfill late AdminLayout routes',
    );
  });
});
