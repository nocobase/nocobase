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

describe('set department owners', () => {
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

  it('should set department owners', async () => {
    await db.getRepository('users').create({
      values: {
        username: 'test',
      },
    });
    const dept = await repo.create({
      values: {
        title: 'Department',
        members: [1, 2],
      },
    });
    await agent.resource('departments').update({
      filterByTk: dept.id,
      values: {
        owners: [{ id: 1 }],
      },
    });
    const deptUser = await db.getRepository('departmentsUsers').findOne({
      filter: {
        userId: 1,
        departmentId: dept.id,
      },
    });
    expect(deptUser.isOwner).toBe(true);
    await agent.resource('departments').update({
      filterByTk: dept.id,
      values: {
        owners: [{ id: 2 }],
      },
    });
    const deptUser1 = await db.getRepository('departmentsUsers').findOne({
      filter: {
        userId: 1,
        departmentId: dept.id,
      },
    });
    expect(deptUser1.isOwner).toBe(false);
    const deptUser2 = await db.getRepository('departmentsUsers').findOne({
      filter: {
        userId: 2,
        departmentId: dept.id,
      },
    });
    expect(deptUser2.isOwner).toBe(true);
  });
});
