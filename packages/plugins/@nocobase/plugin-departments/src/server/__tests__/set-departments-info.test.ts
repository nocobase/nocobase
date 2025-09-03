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
import { setDepartmentsInfo } from '../middlewares';

describe('set departments info', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent: any;
  let ctx: any;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'users', 'departments', 'acl', 'data-source-manager'],
    });
    db = app.db;
    repo = db.getRepository('departments');
    agent = app.agent();
    ctx = {
      db,
      cache: app.cache,
      state: {},
    };
  });

  afterAll(async () => {
    await app.destroy();
  });

  afterEach(async () => {
    await repo.destroy({ truncate: true });
  });

  it('should set departments roles', async () => {
    const user = await db.getRepository('users').findOne();

    ctx.state.currentUser = await db.getRepository('users').findOne({
      filterByTk: user.id,
    });
    const role = await db.getRepository('roles').create({
      values: {
        name: 'test-role',
        title: 'Test role',
      },
    });
    await repo.create({
      values: {
        title: 'Department',
        roles: [role.name],
        members: [user.id],
      },
    });
    await setDepartmentsInfo(ctx, () => {});
    expect(ctx.state.attachRoles.length).toBe(1);
    expect(ctx.state.attachRoles[0].name).toBe('test-role');
  });
});
