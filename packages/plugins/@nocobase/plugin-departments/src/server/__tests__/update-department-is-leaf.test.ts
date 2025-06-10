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

describe('update department isLeaf', () => {
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

  it('should update isLeaf when create sub department', async () => {
    const res = await agent.resource('departments').create({
      values: {
        title: 'Department',
      },
    });
    const dept = res.body.data;
    expect(dept).toBeTruthy();
    expect(dept.isLeaf).toBe(true);

    await agent.resource('departments').create({
      values: {
        title: 'Sub Department',
        parent: dept,
      },
    });
    const record = await repo.findOne({
      filterByTk: dept.id,
    });
    expect(record.isLeaf).toBe(false);
  });

  it.runIf(process.env.DB_DIALECT !== 'sqlite')('should update isLeaf when update department', async () => {
    const res = await agent.resource('departments').create({
      values: {
        title: 'Department',
      },
    });
    const res2 = await agent.resource('departments').create({
      values: {
        title: 'Department2',
      },
    });
    const dept1 = res.body.data;
    const dept2 = res2.body.data;
    const res3 = await agent.resource('departments').create({
      values: {
        title: 'Sub Department',
        parent: dept1,
      },
    });
    const subDept = res3.body.data;
    await agent.resource('departments').update({
      filterByTk: subDept.id,
      values: {
        parent: dept2,
      },
    });
    const record1 = await repo.findOne({
      filterByTk: dept1.id,
    });
    expect(record1.isLeaf).toBe(true);
    const record2 = await repo.findOne({
      filterByTk: dept2.id,
    });
    expect(record2.isLeaf).toBe(false);
  });
});
