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

describe('mobileRoutes', async () => {
  let app: MockServer, db: Database, mobileRoutesRepo: Repository, rolesMobileRoutesRepo: Repository;
  let role: Model;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['error-handler', 'mobile', 'field-sort', 'acl', 'data-source-main', 'data-source-manager'],
    });
    db = app.db;
    mobileRoutesRepo = db.getRepository('mobileRoutes');
    rolesMobileRoutesRepo = db.getRepository('rolesMobileRoutes');
    role = await db.getRepository('roles').create({ values: { name: 'role1' } });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it(`should rolesMobileRoutes includes tabs when create menu`, async () => {
    const records = [
      { id: 50, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 51, title: 'tabs1', type: 'tabs', parentId: 50, hideInMenu: null, hidden: true },
    ];
    await mobileRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesMobileRoutes').model.bulkCreate([{ roleName: role.get('name'), mobileRouteId: 50 }]);

    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesMobileRoutes.length).toBe(2);
    expect(rolesMobileRoutes.map((x) => x.get('mobileRouteId'))).toStrictEqual(expect.arrayContaining([50, 51]));
  });

  it(`should rolesMobileRoutes includes tabs when bulk create menu`, async () => {
    const records = [
      { id: 52, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 53, title: 'tabs1', type: 'tabs', parentId: 52, hideInMenu: null, hidden: true },
      { id: 54, title: 'page2', type: 'page', hideInMenu: null, hidden: null },
      { id: 55, title: 'tabs2', type: 'tabs', parentId: 54, hideInMenu: null, hidden: true },
      { id: 56, title: 'page3', type: 'page', hideInMenu: null, hidden: null },
      { id: 57, title: 'tabs3', type: 'tabs', parentId: 56, hideInMenu: null, hidden: true },
    ];
    await mobileRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesMobileRoutes').model.bulkCreate([
      { roleName: role.get('name'), mobileRouteId: 52 },
      { roleName: role.get('name'), mobileRouteId: 54 },
    ]);
    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesMobileRoutes.length).toStrictEqual(4);
    expect(rolesMobileRoutes.map((x) => x.get('mobileRouteId'))).toStrictEqual(
      expect.arrayContaining([52, 53, 54, 55]),
    );
  });

  it(`should rolesMobileRoutes includes tabs when create menu and invalid data`, async () => {
    const records = [
      { id: 60, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 61, title: 'tabs1', type: 'tabs', parentId: 60, hideInMenu: null, hidden: true },
      { id: 62, title: 'page3', type: 'page', hideInMenu: null, hidden: null },
      { id: 63, title: 'tabs3', type: 'tabs', parentId: 62, hideInMenu: null, hidden: null },
      { id: 64, title: 'tabs4', type: 'tabs', parentId: 62, hideInMenu: null, hidden: null },
    ];
    await mobileRoutesRepo.createMany({ records });
    await rolesMobileRoutesRepo.create({ values: { roleName: role.get('name'), mobileRouteId: 61 } });
    // trigger bulkCreate hooks
    await db.getCollection('rolesMobileRoutes').model.bulkCreate([
      { roleName: role.get('name'), mobileRouteId: 60 },
      { roleName: role.get('name'), mobileRouteId: 62 },
      { roleName: role.get('name'), mobileRouteId: 63 },
    ]);

    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesMobileRoutes.length).toBe(4);
    expect(rolesMobileRoutes.map((x) => x.get('mobileRouteId'))).toStrictEqual(
      expect.arrayContaining([60, 61, 62, 63]),
    );
  });

  it(`should rolesMobileRoutes destroy tabs when remove menu and invalid data`, async () => {
    const records = [
      { id: 70, title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: 71, title: 'tabs1', type: 'tabs', parentId: 70, hideInMenu: null, hidden: true },
    ];
    await mobileRoutesRepo.createMany({ records });
    // trigger bulkCreate hooks
    await db.getCollection('rolesMobileRoutes').model.bulkCreate([{ roleName: role.get('name'), mobileRouteId: 70 }]);

    let rolesMobileRoutes = await rolesMobileRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesMobileRoutes.length).toBe(2);
    expect(rolesMobileRoutes.map((x) => x.get('mobileRouteId'))).toStrictEqual(expect.arrayContaining([70, 71]));

    const transaction = await db.sequelize.transaction();
    await db.getCollection('rolesMobileRoutes').model.destroy({
      where: { roleName: role.get('name'), mobileRouteId: [70] },
      individualHooks: false,
      transaction,
    });
    await transaction.commit();
    rolesMobileRoutes = await rolesMobileRoutesRepo.find({ where: { roleName: role.get('name') } });
    expect(rolesMobileRoutes.length).toBe(0);
  });
});
