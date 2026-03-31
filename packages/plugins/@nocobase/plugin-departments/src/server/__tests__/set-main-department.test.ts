/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Database, Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('set main department', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent: any;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['error-handler', 'field-sort', 'users', 'departments'],
    });
    db = app.db;
    repo = db.getRepository('departments');
    agent = app.agent();
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    await repo.destroy({ truncate: true });
    await db.getRepository('departmentsUsers').destroy({ truncate: true });
  });

  it('should set main department when add department members', async () => {
    const dept = await repo.create({
      values: {
        title: 'Department',
      },
    });
    const testUser = await db.getRepository('users').create({
      values: {
        username: 'test',
      },
    });
    const users = await db.getRepository('users').find();
    const userIds = users.map((user) => user.id);
    await agent.resource('departments.members', dept.id).add({
      values: userIds,
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: {
          $in: userIds,
        },
        departmentId: dept.id,
      },
    });
    const userRepo = db.getRepository('users');
    const userRecord1 = await userRepo.findOne({ filterByTk: 1 });
    const userRecord2 = await userRepo.findOne({ filterByTk: 2 });
    expect(userRecord1.mainDepartmentId).toBe(dept.id);
    expect(userRecord2.mainDepartmentId).toBe(dept.id);

    const dept2 = await repo.create({
      values: {
        title: 'Department2',
      },
    });
    await agent.resource('departments.members', dept2.id).add({
      values: [testUser.id],
    });
    const deptUsers2 = await throughRepo.find({
      filter: {
        userId: testUser.id,
      },
    });
    expect(deptUsers2.length).toBe(2);
    const userRecord = await userRepo.findOne({ filterByTk: 2 });
    expect(userRecord.mainDepartmentId).toBe(dept.id);
  });

  it('should set main department when remove department members', async () => {
    const user = await db.getRepository('users').findOne();
    const depts = await repo.create({
      values: [
        {
          title: 'Department',
        },
        {
          title: 'Department2',
        },
      ],
    });
    await agent.resource('departments.members', depts[0].id).add({
      values: [user.id],
    });
    await agent.resource('departments.members', depts[1].id).add({
      values: [user.id],
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: user.id,
      },
    });
    expect(deptUsers.length).toBe(2);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[0].id);

    await agent.resource('departments.members', depts[0].id).remove({
      values: [user.id],
    });
    const deptUsers2 = await throughRepo.find({
      filter: {
        userId: user.id,
      },
    });
    expect(deptUsers2.length).toBe(1);
    expect(deptUsers2[0].departmentId).toBe(depts[1].id);
    const userRecord2 = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord2.mainDepartmentId).toBe(depts[1].id);
  });

  it('should set main department when add user departments', async () => {
    const user = await db.getRepository('users').findOne();
    const depts = await repo.create({
      values: [
        {
          title: 'Department',
        },
        {
          title: 'Department2',
        },
      ],
    });
    await agent.resource('users.departments', user.id).add({
      values: depts.map((dept: any) => dept.id),
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: user.id,
      },
    });
    expect(deptUsers.length).toBe(2);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[0].id);
  });

  it('should set main department when remove user departments', async () => {
    const user = await db.getRepository('users').findOne();
    const depts = await repo.create({
      values: [
        {
          title: 'Department',
        },
        {
          title: 'Department2',
        },
      ],
    });
    await agent.resource('users.departments', user.id).add({
      values: depts.map((dept: any) => dept.id),
    });
    await agent.resource('users.departments', user.id).remove({
      values: [depts[0].id],
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: user.id,
      },
    });
    expect(deptUsers.length).toBe(1);
    expect(deptUsers[0].departmentId).toBe(depts[1].id);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[1].id);
  });

  it('should set main via users.update when user has exactly one department', async () => {
    const dept = await repo.create({ values: { title: 'OnlyDept' } });
    await agent.resource('users').update({
      filterByTk: 1,
      values: { departments: [{ id: dept.id }] },
    });
    const user = await db.getRepository('users').findOne({ filterByTk: 1, fields: ['id', 'mainDepartmentId'] });
    expect(user.mainDepartmentId).toBe(dept.id);
  });

  it('should set main via users.update when reducing to one department', async () => {
    const depts = await repo.create({ values: [{ title: 'DeptA' }, { title: 'DeptB' }] });
    await agent.resource('users').update({
      filterByTk: 1,
      values: { departments: [{ id: depts[0].id }, { id: depts[1].id }] },
    });
    await agent.resource('users').update({
      filterByTk: 1,
      values: { departments: [{ id: depts[1].id }] },
    });
    const user = await db.getRepository('users').findOne({ filterByTk: 1, fields: ['id', 'mainDepartmentId'] });
    expect(user.mainDepartmentId).toBe(depts[1].id);
  });
});
