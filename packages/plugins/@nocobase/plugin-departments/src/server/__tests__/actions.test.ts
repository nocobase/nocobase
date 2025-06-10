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

describe('actions', () => {
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
  });

  it('should list users exclude department', async () => {
    const dept = await repo.create({
      values: {
        title: 'Test department',
        members: [1],
      },
    });
    const res = await agent.resource('users').listExcludeDept({
      departmentId: dept.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('should list users exclude department with filter', async () => {
    let res = await agent.resource('users').listExcludeDept({
      departmentId: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    res = await agent.resource('users').listExcludeDept({
      departmentId: 1,
      filter: {
        id: 1,
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);

    res = await agent.resource('users').listExcludeDept({
      departmentId: 1,
      filter: {
        id: 2,
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  it('should set main department', async () => {
    const depts = await repo.create({
      values: [
        {
          title: 'Dept1',
          members: [1],
        },
        {
          title: 'Dept2',
          members: [1],
        },
      ],
    });
    const deptUsers = db.getRepository('departmentsUsers');
    await deptUsers.update({
      filter: {
        departmentId: depts[0].id,
        userId: 1,
      },
      values: {
        isMain: true,
      },
    });
    const res = await agent.resource('users').setMainDepartment({
      values: {
        userId: 1,
        departmentId: depts[1].id,
      },
    });
    expect(res.status).toBe(200);
    const records = await deptUsers.find({
      filter: {
        userId: 1,
      },
    });
    const dept1 = records.find((record: any) => record.departmentId === depts[0].id);
    const dept2 = records.find((record: any) => record.departmentId === depts[1].id);
    expect(dept1.isMain).toBe(false);
    expect(dept2.isMain).toBe(true);
  });
});
