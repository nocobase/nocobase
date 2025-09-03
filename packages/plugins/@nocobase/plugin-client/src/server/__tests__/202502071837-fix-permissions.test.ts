/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration, { getIds } from '../migrations/202502071837-fix-permissions';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';

describe('202502071837-fix-permissions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.5.0');
  });

  afterEach(async () => {
    await app.destroy();
  });

  async function createTestData() {
    const desktopRoutes = app.db.getRepository('desktopRoutes');
    const roles = app.db.getRepository('roles');

    // 创建测试路由
    const routes = await desktopRoutes.create({
      values: [
        {
          type: 'page',
          title: 'Page 1',
          menuSchemaUid: 'page1',
          children: [{ type: 'tabs', title: 'Tabs 1', parentId: 1, schemaUid: 'tabs1' }],
        },
        {
          type: 'page',
          title: 'Page 2',
          menuSchemaUid: 'page2',
        },
      ],
    });

    // 创建测试角色
    const role = await roles.create({
      values: {
        name: 'test',
        menuUiSchemas: [
          { 'x-uid': 'page1' }, // 已有 page1 的权限
          { 'x-uid': 'page3' }, // 不存在的权限
        ],
      },
    });

    return { routes, role };
  }

  test('should add missing permissions', async () => {
    const { role } = await createTestData();
    const migration = new Migration({ db: app.db, app } as any);

    await migration.up();

    // 获取更新后的角色权限
    const updatedRole = await app.db.getRepository('roles').findOne({
      filter: { name: 'test' },
      appends: ['desktopRoutes'],
    });

    const routes = await app.db.getRepository('desktopRoutes').find();
    // 验证应该添加的权限
    const routeIds = updatedRole.desktopRoutes.map((r) => r.id);
    expect(routeIds).toContain(routes[0].id); // page1 已存在
    expect(routeIds).toContain(routes[1].id); // tabs1 应该被添加
    expect(routeIds).not.toContain(routes[2].id); // page2 不应该被添加
  });

  test('should handle empty desktop routes', async () => {
    const migration = new Migration({ db: app.db, app } as any);
    await expect(migration.up()).resolves.not.toThrow();
  });

  test('getIds should return correct needAddIds', () => {
    const desktopRoutes = [
      { id: 1, type: 'page', menuSchemaUid: 'page1' },
      { id: 2, type: 'tabs', parentId: 1, schemaUid: 'tabs1' },
      { id: 3, type: 'page', menuSchemaUid: 'page2' },
    ];

    const menuUiSchemas = [{ 'x-uid': 'page1' }];

    const { needAddIds } = getIds(desktopRoutes, menuUiSchemas);
    expect(needAddIds).toEqual([1, 2]); // page1 已存在但 tabs1/page2 需要添加
  });
});
