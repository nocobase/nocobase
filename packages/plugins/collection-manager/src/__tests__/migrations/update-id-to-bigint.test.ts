import { Database, MigrationContext } from '@nocobase/database';
import Migrator from '../../migrations/20221121111113-update-id-to-bigint';

const excludeSqlite = () => (process.env.DB_DIALECT != 'sqlite' ? describe : describe.skip);

import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

excludeSqlite()('update id to bigint  test', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp({
      database: {
        usingBigIntForId: false,
      },
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should update id to bigint', async () => {
    db.collection({
      name: 'groups',
    });

    const Users = db.collection({
      name: 'users',
      fields: [
        { type: 'belongsTo', name: 'group', foreignKey: 'groupId' },
        {
          type: 'hasOne',
          name: 'profile',
        },
        {
          type: 'hasMany',
          name: 'orders',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    db.collection({
      name: 'tags',
    });

    db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    db.collection({
      name: 'orders',
    });
    await db.sync();

    const assertBigInt = async (collectionName, fieldName) => {
      const tableInfo = await db.sequelize
        .getQueryInterface()
        .describeTable(
          db.getCollection(collectionName) ? db.getCollection(collectionName).model.tableName : collectionName,
        );
      console.log(`${collectionName}, ${fieldName}`, tableInfo[fieldName].type);
      expect(tableInfo[fieldName].type).toBe('BIGINT');
    };

    const assertInteger = (val) => {
      if (db.inDialect('postgres', 'sqlite')) {
        expect(val).toBe('INTEGER');
      } else {
        expect(val).toBe('INT');
      }
    };

    let usersTableInfo = await db.sequelize
      .getQueryInterface()
      .describeTable(db.getCollection('users').model.tableName);

    assertInteger(usersTableInfo.id.type);

    const migration = new Migrator({ db } as MigrationContext);
    migration.context.app = app;
    await migration.up();

    //@ts-ignore
    const throughTableName = Users.model.associations.tags.through.model.tableName;

    const asserts = [
      'users#id',
      'profiles#userId',
      'users#groupId',
      'orders#userId',
      `${throughTableName}#userId`,
      `${throughTableName}#tagId`,
    ];

    for (const assert of asserts) {
      const [collectionName, fieldName] = assert.split('#');
      await assertBigInt(collectionName, fieldName);
    }
  });
});
