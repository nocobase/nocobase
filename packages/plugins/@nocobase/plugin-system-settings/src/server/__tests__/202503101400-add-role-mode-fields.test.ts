/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import AddSystemSettingsRoleModeMigration from '../migrations/202503101400-add-role-mode-fields';
import { SystemRoleMode } from '@nocobase/plugin-acl/src/server/enum';

describe(`202503101400-add-mode-fields`, () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent: any;

  beforeAll(async () => {
    app = await createMockServer({
      plugins: ['acl', 'field-sort', 'users', 'data-source-manager', 'system-settings'],
    });
    db = app.db;
    agent = app.agent();
  });

  afterAll(async () => {
    await db.clean({ drop: true });
    await db.close();
    await app.destroy();
  });

  it('add user role mode fields', async () => {
    await db.getRepository('systemSettings').create({
      values: { title: 'abc' },
    });
    const migration = new AddSystemSettingsRoleModeMigration({ db, app } as any);
    await migration.up();
    const allRecords = await db.getRepository('systemSettings').find();
    expect(allRecords.length).toBe(2);
    expect(allRecords.map((x) => x.roleMode)).toStrictEqual([SystemRoleMode.default, SystemRoleMode.default]);
  });
});
