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
      plugins: ['field-sort', 'users', 'departments'],
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
    await db.getRepository('users').create({
      values: {
        username: 'test',
      },
    });
    await agent.resource('departments.members', dept.id).add({
      values: [1, 2],
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: {
          $in: [1, 2],
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
      values: [2],
    });
    const deptUsers2 = await throughRepo.find({
      filter: {
        userId: 2,
      },
    });
    expect(deptUsers2.length).toBe(2);
    const userRecord = await userRepo.findOne({ filterByTk: 2 });
    expect(userRecord.mainDepartmentId).toBe(dept.id);
  });

  it('should set main department when remove department members', async () => {
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
      values: [1],
    });
    await agent.resource('departments.members', depts[1].id).add({
      values: [1],
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: 1,
      },
    });
    expect(deptUsers.length).toBe(2);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[0].id);

    await agent.resource('departments.members', depts[0].id).remove({
      values: [1],
    });
    const deptUsers2 = await throughRepo.find({
      filter: {
        userId: 1,
      },
    });
    expect(deptUsers2.length).toBe(1);
    expect(deptUsers2[0].departmentId).toBe(depts[1].id);
    const userRecord2 = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord2.mainDepartmentId).toBe(depts[1].id);
  });

  it('should set main department when add user departments', async () => {
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
    await agent.resource('users.departments', 1).add({
      values: depts.map((dept: any) => dept.id),
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: 1,
      },
    });
    expect(deptUsers.length).toBe(2);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[0].id);
  });

  it('should set main department when remove user departments', async () => {
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
    await agent.resource('users.departments', 1).add({
      values: depts.map((dept: any) => dept.id),
    });
    await agent.resource('users.departments', 1).remove({
      values: [depts[0].id],
    });
    const throughRepo = db.getRepository('departmentsUsers');
    const deptUsers = await throughRepo.find({
      filter: {
        userId: 1,
      },
    });
    expect(deptUsers.length).toBe(1);
    expect(deptUsers[0].departmentId).toBe(depts[1].id);
    const userRepo = db.getRepository('users');
    const userRecord = await userRepo.findOne({ filterByTk: 1 });
    expect(userRecord.mainDepartmentId).toBe(depts[1].id);
  });
});
