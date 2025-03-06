/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('desktopRoutes:listAccessible', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['nocobase'],
    });
    db = app.db;

    // 创建测试页面和tab路由
    await db.getRepository('desktopRoutes').create({
      values: [
        {
          type: 'page',
          title: 'page1',
          children: [{ type: 'tab', title: 'tab1' }],
        },
        {
          type: 'page',
          title: 'page2',
          children: [{ type: 'tab', title: 'tab2' }],
        },
        {
          type: 'page',
          title: 'page3',
          children: [{ type: 'tab', title: 'tab3' }],
        },
      ],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should return all routes for root role', async () => {
    const rootUser = await db.getRepository('users').create({
      values: { roles: ['root'] },
    });
    const agent = await app.agent().login(rootUser);

    const response = await agent.resource('desktopRoutes').listAccessible();
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(3);
    expect(response.body.data[0].children.length).toBe(1);
  });

  it('should return all routes by default for admin/member', async () => {
    // 测试 admin 角色
    const adminUser = await db.getRepository('users').create({
      values: { roles: ['admin'] },
    });
    const adminAgent = await app.agent().login(adminUser);

    let response = await adminAgent.resource('desktopRoutes').listAccessible();
    expect(response.body.data.length).toBe(3);

    // 测试 member 角色
    const memberUser = await db.getRepository('users').create({
      values: { roles: ['member'] },
    });
    const memberAgent = await app.agent().login(memberUser);

    response = await memberAgent.resource('desktopRoutes').listAccessible();
    expect(response.body.data.length).toBe(3);
  });

  it('should return filtered routes with children', async () => {
    // 使用 root 角色配置 member 的可访问路由
    const rootUser = await db.getRepository('users').create({
      values: { roles: ['root'] },
    });
    const rootAgent = await app.agent().login(rootUser);

    // 更新 member 角色的可访问路由
    await rootAgent.resource('roles.desktopRoutes', 'member').remove({
      values: [1, 2, 3, 4, 5, 6], // 移除所有路由的访问权限
    });
    await rootAgent.resource('roles.desktopRoutes', 'member').add({
      values: [1, 2], // 再加上 page1 和 tab1 的访问权限
    });

    // 使用 member 用户测试
    const memberUser = await db.getRepository('users').create({
      values: { roles: ['member'] },
    });
    const memberAgent = await app.agent().login(memberUser);

    const response = await memberAgent.resource('desktopRoutes').listAccessible();
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('page1');
    expect(response.body.data[0].children.length).toBe(1);
    expect(response.body.data[0].children[0].title).toBe('tab1');
  });

  it('should return an empty response when there are no accessible routes', async () => {
    // 使用 root 角色配置 member 的可访问路由
    const rootUser = await db.getRepository('users').create({
      values: { roles: ['root'] },
    });
    const rootAgent = await app.agent().login(rootUser);

    // 更新 member 角色的可访问路由
    await rootAgent.resource('roles.desktopRoutes', 'member').remove({
      values: [1, 2, 3, 4, 5, 6], // 移除所有路由的访问权限
    });

    // 使用 member 用户测试
    const memberUser = await db.getRepository('users').create({
      values: { roles: ['member'] },
    });
    const memberAgent = await app.agent().login(memberUser);

    const response = await memberAgent.resource('desktopRoutes').listAccessible();
    expect(response.body.data.length).toBe(0);
  });

  it('should auto include children when page has no children', async () => {
    // 创建一个没有子路由的页面
    const page4 = await db.getRepository('desktopRoutes').create({
      values: {
        type: 'page',
        title: 'page4',
      },
    });

    // 创建两个子路由
    await db.getRepository('desktopRoutes').create({
      values: [
        { type: 'tab', title: 'tab4-1', parentId: page4.id },
        { type: 'tab', title: 'tab4-2', parentId: page4.id },
      ],
    });

    // 配置 member 角色只能访问 page4
    const rootUser = await db.getRepository('users').create({
      values: { roles: ['root'] },
    });
    const rootAgent = await app.agent().login(rootUser);
    await rootAgent.resource('roles.desktopRoutes', 'member').remove({
      values: [1, 2, 3, 4, 5, 6, 8, 9], // 只保留 page4 的访问权限
    });

    // 验证返回结果包含子路由
    const memberUser = await db.getRepository('users').create({
      values: { roles: ['member'] },
    });
    const memberAgent = await app.agent().login(memberUser);

    const response = await memberAgent.resource('desktopRoutes').listAccessible();
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('page4');
    expect(response.body.data[0].children.length).toBe(2);
  });
});
