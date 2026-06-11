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
});
