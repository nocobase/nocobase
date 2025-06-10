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

describe('destroy department check', () => {
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

  it('should check if it has sub departments', async () => {
    const dept = await repo.create({
      values: {
        title: 'Department',
        children: [{ title: 'Sub department' }],
      },
    });
    const res = await agent.resource('departments').destroy({
      filterByTk: dept.id,
    });
    expect(res.status).toBe(400);
    expect(res.text).toBe('The department has sub-departments, please delete them first');
  });

  it('should check if it has members', async () => {
    const dept = await repo.create({
      values: {
        title: 'Department',
        members: [1],
      },
    });
    const res = await agent.resource('departments').destroy({
      filterByTk: dept.id,
    });
    expect(res.status).toBe(400);
    expect(res.text).toBe('The department has members, please remove them first');
  });
});
