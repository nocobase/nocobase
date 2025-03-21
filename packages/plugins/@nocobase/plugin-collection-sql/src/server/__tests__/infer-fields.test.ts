/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase, Database } from '@nocobase/database';
import { SQLModel } from '../sql-collection';

describe('infer fields', () => {
  let db: Database;

  beforeAll(async () => {
    db = await createMockDatabase({ tablePrefix: '' });
    await db.clean({ drop: true });

    db.collection({
      name: 'users',
      schema: db.inDialect('postgres') ? process.env.DB_SCHEMA : undefined,
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id' },
        { name: 'nickname', type: 'string', interface: 'input' },
      ],
    });
    db.collection({
      name: 'roles',
      schema: db.inDialect('postgres') ? process.env.DB_SCHEMA : undefined,
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id' },
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'name', type: 'string', interface: 'uid' },
      ],
    });
    db.collection({
      name: 'roles_users',
      schema: db.inDialect('postgres') ? process.env.DB_SCHEMA : undefined,
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id' },
        { name: 'userId', type: 'bigInt', interface: 'id' },
        { name: 'roleName', type: 'bigInt', interface: 'id' },
      ],
    });
    await db.sync();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should infer for select *', async () => {
    const model = class extends SQLModel {};
    model.init(null, {
      modelName: 'users',
      tableName: 'users',
      sequelize: db.sequelize,
    });
    model.database = db;
    model.sql = `select * from users`;
    expect(model.inferFields()).toMatchObject({
      id: { type: 'bigInt', source: 'users.id' },
      nickname: { type: 'string', source: 'users.nickname' },
    });
  });

  it('should infer fields', async () => {
    const model = class extends SQLModel {};
    model.init(null, {
      modelName: 'roles_users',
      tableName: 'roles_users',
      sequelize: db.sequelize,
    });
    model.database = db;
    model.sql = `select u.id as uid, u.nickname, r.title, r.name
from users u left join roles_users ru on ru.user_id = u.id
left join roles r on ru.role_name=r.name`;
    expect(model.inferFields()).toMatchObject({
      uid: { type: 'bigInt', source: 'users.id' },
      nickname: { type: 'string', source: 'users.nickname' },
      title: { type: 'string', source: 'roles.title' },
      name: { type: 'string', source: 'roles.name' },
    });
  });

  it('should infer fields for with statement', async () => {
    const model = class extends SQLModel {};
    model.init(null, {
      modelName: 'test',
      tableName: 'test',
      sequelize: db.sequelize,
    });
    model.database = db;
    model.sql = `with u as (select id, nickname from users),
    r as (select id, title, name from roles)
    select u.id as uid, u.nickname, r.title, r.name`;
    expect(model.inferFields()).toMatchObject({
      uid: { type: 'bigInt', source: 'users.id' },
      nickname: { type: 'string', source: 'users.nickname' },
      title: { type: 'string', source: 'roles.title' },
      name: { type: 'string', source: 'roles.name' },
    });
  });

  it('should infer fields for without collection', async () => {
    const model = class extends SQLModel {};
    model.init(null, {
      modelName: 'test',
      tableName: 'test',
      sequelize: db.sequelize,
    });
    model.database = db;
    model.sql = `select a from a3`;
    expect(model.inferFields()).toMatchObject({
      a: {},
    });
  });
});
