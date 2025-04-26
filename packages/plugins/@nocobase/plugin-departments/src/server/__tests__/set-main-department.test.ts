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
    for (const item of deptUsers) {
      expect(item.isMain).toBe(true);
    }

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
    expect(deptUsers2.find((i: any) => i.departmentId === dept.id).isMain).toBe(true);
    expect(deptUsers2.find((i: any) => i.departmentId === dept2.id).isMain).toBe(false);
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
    expect(deptUsers.find((i: any) => i.departmentId === depts[0].id).isMain).toBe(true);
    expect(deptUsers.find((i: any) => i.departmentId === depts[1].id).isMain).toBe(false);

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
    expect(deptUsers2[0].isMain).toBe(true);
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
    expect(deptUsers.find((i: any) => i.departmentId === depts[0].id).isMain).toBe(true);
    expect(deptUsers.find((i: any) => i.departmentId === depts[1].id).isMain).toBe(false);
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
    expect(deptUsers[0].isMain).toBe(true);
  });
});
