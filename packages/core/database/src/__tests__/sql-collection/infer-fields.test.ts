import Database from '../../database';
import { mockDatabase } from '../../mock-database';
import { SQLModel } from '../../sql-collection/sql-model';

describe('infer fields', () => {
  let db: Database;

  beforeAll(async () => {
    db = mockDatabase({ tablePrefix: '' });
    await db.clean({ drop: true });

    db.collection({
      name: 'users',
      schema: 'public',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id' },
        { name: 'nickname', type: 'string', interface: 'input' },
      ],
    });
    db.collection({
      name: 'roles',
      schema: 'public',
      fields: [
        { name: 'id', type: 'bigInt', interface: 'id' },
        { name: 'title', type: 'string', interface: 'input' },
        { name: 'name', type: 'string', interface: 'uid' },
      ],
    });
    db.collection({
      name: 'roles_users',
      schema: 'public',
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
});
