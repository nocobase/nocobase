/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Model, Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

describe('desktopRoutes:listAccessible', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: true,
      plugins: ['nocobase', 'collection-tree'],
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
      values: [1, 2, 3, 4, 5, 6],
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

  it.only('should test role permissions and route visibility with group and tabs', async () => {
    // 1. 定义一个表
    await db.getCollection('collections').repository.create({
      values: {
        name: 'testTable',
        title: 'Test Table',
        fields: [
          {
            type: 'string',
            name: 'name',
            interface: 'input',
          },
        ],
      },
    });

    // 2. 定义一个角色
    const customRole = await db.getRepository('roles').create({
      values: { name: 'customRole', title: 'Custom Role' },
    });

    // 3. 给该角色设置主数据源 action 权限所有人可见
    await db.getRepository('rolesResourcesActions').create({
      values: {
        roleName: customRole.name,
        resourceName: 'testTable',
        actionName: '*',
        strategy: {
          actions: ['create', 'view', 'update', 'destroy'],
        },
      },
    });

    // 4. 添加1个分组和2个子tab路由a,b
    const groupRoute = await db.getRepository('desktopRoutes').create({
      values: {
        type: 'group',
        title: 'testGroup',
      },
    });

    const [routeA, routeB] = await db.getRepository('desktopRoutes').create({
      values: [
        { type: 'tab', title: 'routeA', parentId: groupRoute.id },
        { type: 'tab', title: 'routeB', parentId: groupRoute.id },
      ],
    });

    // 使用 root 角色配置权限
    const rootUser = await db.getRepository('users').create({
      values: { roles: ['root'] },
    });
    const rootAgent = await app.agent().login(rootUser);

    // 清除默认权限
    await rootAgent.resource('roles.desktopRoutes', customRole.name).remove({
      values: [1, 2, 3, 4, 5, 6, groupRoute.id, routeA.id, routeB.id],
    });

    // 5. 设置其中一个路由a可见
    await rootAgent.resource('roles.desktopRoutes', customRole.name).add({
      values: [groupRoute.id, routeA.id],
    });

    // 创建测试用户
    const testUser = await db.getRepository('users').create({
      values: { roles: [customRole.name] },
    });
    const testAgent = await app.agent().login(testUser);

    // 验证只有routeA可见
    let response = await testAgent.resource('desktopRoutes').listAccessible();
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('testGroup');
    expect(response.body.data[0].children.length).toBe(1);
    expect(response.body.data[0].children[0].title).toBe('routeA');

    // 6. 设置所有路由可见
    await rootAgent.resource('roles.desktopRoutes', customRole.name).add({
      values: [routeB.id],
    });

    // 7. 访问desktopRoutes:listAccessible API
    response = await testAgent.resource('desktopRoutes').listAccessible();

    // 8. 断言API结果，a,b都有children
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].title).toBe('testGroup');
    expect(response.body.data[0].children.length).toBe(2);
    
    const childTitles = response.body.data[0].children.map(child => child.title);
    expect(childTitles).toContain('routeA');
    expect(childTitles).toContain('routeB');
  });
});

describe('desktopRoutes', async () => {
  let app: MockServer, db: Database, desktopRoutesRepo: Repository, rolesDesktopRoutesRepo: Repository;
  let role: Model;
  beforeEach(async () => {
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
      ],
    });
    db = app.db;
    desktopRoutesRepo = db.getRepository('desktopRoutes');
    rolesDesktopRoutesRepo = db.getRepository('rolesDesktopRoutes');
    role = await db.getRepository('roles').create({ values: { name: 'role1' } });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it(`should rolesDesktopRoutes includes tabs when create menu`, async () => {
    const records = [
      { id: 50, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 51, title: 'tabs1', type: 'tabs', parentId: 50, hideInMenu: null, hidden: true },
    ];
    await desktopRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesDesktopRoutes').model.bulkCreate([{ roleName: role.get('name'), desktopRouteId: 50 }]);

    const rolesDesktopRoutes = await rolesDesktopRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesDesktopRoutes.length).toBe(2);
    expect(rolesDesktopRoutes.map((x) => x.get('desktopRouteId'))).toStrictEqual(expect.arrayContaining([50, 51]));
  });

  it(`should rolesDesktopRoutes includes tabs when bulk create menu`, async () => {
    const records = [
      { id: 52, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 53, title: 'tabs1', type: 'tabs', parentId: 52, hideInMenu: null, hidden: true },
      { id: 54, title: 'page2', type: 'page', hideInMenu: null, hidden: null },
      { id: 55, title: 'tabs2', type: 'tabs', parentId: 54, hideInMenu: null, hidden: true },
      { id: 56, title: 'page3', type: 'page', hideInMenu: null, hidden: null },
      { id: 57, title: 'tabs3', type: 'tabs', parentId: 56, hideInMenu: null, hidden: true },
    ];
    await desktopRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesDesktopRoutes').model.bulkCreate([
      { roleName: role.get('name'), desktopRouteId: 52 },
      { roleName: role.get('name'), desktopRouteId: 54 },
    ]);
    const rolesDesktopRoutes = await rolesDesktopRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesDesktopRoutes.length).toStrictEqual(4);
    expect(rolesDesktopRoutes.map((x) => x.get('desktopRouteId'))).toStrictEqual(
      expect.arrayContaining([52, 53, 54, 55]),
    );
  });

  it(`should rolesDesktopRoutes includes tabs when create menu and invalid data`, async () => {
    const records = [
      { id: 60, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 61, title: 'tabs1', type: 'tabs', parentId: 60, hideInMenu: null, hidden: true },
      { id: 62, title: 'page3', type: 'page', hideInMenu: null, hidden: null },
      { id: 63, title: 'tabs3', type: 'tabs', parentId: 62, hideInMenu: null, hidden: null },
      { id: 64, title: 'tabs4', type: 'tabs', parentId: 62, hideInMenu: null, hidden: null },
    ];
    await desktopRoutesRepo.createMany({ records });
    await rolesDesktopRoutesRepo.create({ values: { roleName: role.get('name'), desktopRouteId: 61 } });
    // trigger bulkCreate hooks
    await db.getCollection('rolesDesktopRoutes').model.bulkCreate([
      { roleName: role.get('name'), desktopRouteId: 60 },
      { roleName: role.get('name'), desktopRouteId: 62 },
      { roleName: role.get('name'), desktopRouteId: 63 },
    ]);

    const rolesDesktopRoutes = await rolesDesktopRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesDesktopRoutes.length).toBe(4);
    expect(rolesDesktopRoutes.map((x) => x.get('desktopRouteId'))).toStrictEqual(
      expect.arrayContaining([60, 61, 62, 63]),
    );
  });

  it(`should rolesDesktopRoutes destroy tabs when remove menu and invalid data`, async () => {
    const records = [
      { id: 70, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 71, title: 'tabs1', type: 'tabs', parentId: 70, hideInMenu: null, hidden: true },
    ];
    await desktopRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesDesktopRoutes').model.bulkCreate([{ roleName: role.get('name'), desktopRouteId: 70 }]);

    let rolesDesktopRoutes = await rolesDesktopRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesDesktopRoutes.length).toBe(2);
    expect(rolesDesktopRoutes.map((x) => x.get('desktopRouteId'))).toStrictEqual(expect.arrayContaining([70, 71]));

    const transaction = await db.sequelize.transaction();
    await db.getCollection('rolesDesktopRoutes').model.destroy({
      where: { roleName: role.get('name'), desktopRouteId: [70] },
      individualHooks: false,
      transaction,
    });
    await transaction.commit();
    rolesDesktopRoutes = await rolesDesktopRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesDesktopRoutes.length).toBe(0);
  });
});
