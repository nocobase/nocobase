/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../migrations/202503091240-fix-roles-mobile-routes';
import { vi, describe, beforeEach, afterEach, test, expect } from 'vitest';
import { Model, Repository } from '@nocobase/database';
import _ from 'lodash';

describe('202503091240-fix-roles-mobile-routes', () => {
  let app: MockServer, role1: Model, role2: Model, mobileRoutesRepo: Repository, rolesMobileRoutesRepo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
    await app.version.update('1.5.0');
    role1 = await app.db.getRepository('roles').create({
      values: {
        name: 'role1',
      },
    });
    role2 = await app.db.getRepository('roles').create({
      values: {
        name: 'role2',
      },
    });
    mobileRoutesRepo = app.db.getRepository('mobileRoutes');
    rolesMobileRoutesRepo = app.db.getRepository('rolesMobileRoutes');
  });

  afterEach(async () => {
    await app.destroy();
  });

  async function createTestData() {
    const idSet = new Set();
    while (idSet.size < 8) {
      idSet.add(Math.ceil(10 + Math.random() * 10));
    }
    const ids = Array.from(idSet);
    const records = [
      { id: ids[0], title: 'page1', type: 'page', hideInMenu: null, hidden: null },
      { id: ids[1], title: 'tabs1', type: 'tabs', parentId: ids[0], hideInMenu: null, hidden: true },
      { id: ids[2], title: 'page3', type: 'page', hideInMenu: null, hidden: null },
      { id: ids[3], title: 'tabs3', type: 'tabs', parentId: ids[2], hideInMenu: null, hidden: true },
      { id: ids[4], title: 'page4', type: 'page', hideInMenu: null, hidden: null },
      { id: ids[5], title: 'tabs4', type: 'tabs', parentId: ids[4], hideInMenu: null, hidden: null },
      { id: ids[6], title: 'tabs5', type: 'tabs', parentId: ids[4], hideInMenu: null, hidden: null },
    ];
    return await mobileRoutesRepo.createMany({ records });
  }
  it('should create miss child routes', async () => {
    const models = await createTestData();
    await rolesMobileRoutesRepo.create({
      values: [
        { roleName: role1.get('name'), mobileRouteId: models[0].id },
        { roleName: role2.get('name'), mobileRouteId: models[2].id },
      ],
    });
    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({
      where: { roleName: [role1.get('name'), role2.get('name')] },
    });
    expect(rolesMobileRoutes.length).toBe(4);
    const role1Routes = await rolesMobileRoutes.filter((x) => x.roleName === role1.get('name'));
    expect(role1Routes.map((x) => x.get('mobileRouteId'))).toContain(models[0].id);
    expect(role1Routes.map((x) => x.get('mobileRouteId'))).toContain(models[1].id);
    const role2Routes = await rolesMobileRoutes.filter((x) => x.roleName === role2.get('name'));
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).toContain(models[2].id);
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).toContain(models[3].id);
  });

  it('should create miss child routes when has repeat data', async () => {
    const models = await createTestData();
    await rolesMobileRoutesRepo.create({
      values: [
        { roleName: role1.get('name'), mobileRouteId: models[0].id },
        { roleName: role1.get('name'), mobileRouteId: models[1].id },
        { roleName: role2.get('name'), mobileRouteId: models[2].id },
      ],
    });
    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({
      where: { roleName: [role1.get('name'), role2.get('name')] },
    });
    expect(rolesMobileRoutes.length).toBe(4);
    const role1Routes = await rolesMobileRoutes.filter((x) => x.roleName === role1.get('name'));
    expect(role1Routes.map((x) => x.get('mobileRouteId'))).toContain(models[0].id);
    expect(role1Routes.map((x) => x.get('mobileRouteId'))).toContain(models[1].id);
    const role2Routes = await rolesMobileRoutes.filter((x) => x.roleName === role2.get('name'));
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).toContain(models[2].id);
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).toContain(models[3].id);
  });

  it('should create miss child routes no includes hidden = false', async () => {
    const models = await createTestData();
    await rolesMobileRoutesRepo.create({
      values: [
        { roleName: role1.get('name'), mobileRouteId: models[0].id },
        { roleName: role1.get('name'), mobileRouteId: models[2].id },
        { roleName: role2.get('name'), mobileRouteId: models[4].id },
      ],
    });
    const migration = new Migration({ db: app.db, app } as any);
    await migration.up();

    const rolesMobileRoutes = await rolesMobileRoutesRepo.find({
      where: { roleName: [role1.get('name'), role2.get('name')] },
    });
    expect(rolesMobileRoutes.map((x) => x.get('mobileRouteId'))).toStrictEqual(
      expect.arrayContaining([models[1].id, models[3].id]),
    );
    const role2Routes = await rolesMobileRoutes.filter((x) => x.roleName === role2.get('name'));
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).not.toContain(models[5].id);
    expect(role2Routes.map((x) => x.get('mobileRouteId'))).not.toContain(models[6].id);
  });
});
