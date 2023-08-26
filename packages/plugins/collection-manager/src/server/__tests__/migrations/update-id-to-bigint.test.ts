import { Database, MigrationContext } from '@nocobase/database';
import lodash from 'lodash';
import Migrator from '../../migrations/20221121111113-update-id-to-bigint';
import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

const excludeSqlite = () => (process.env.DB_DIALECT != 'sqlite' ? describe.skip : describe.skip);

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
      const tableName = db.getCollection(collectionName)
        ? db.getCollection(collectionName).getTableNameWithSchema()
        : collectionName;

      const tableInfo = await db.sequelize.getQueryInterface().describeTable(tableName);

      if (db.options.underscored) {
        fieldName = lodash.snakeCase(fieldName);
      }

      expect(tableInfo[fieldName].type).toBe('BIGINT');
    };

    const assertInteger = (val) => {
      if (db.inDialect('postgres', 'sqlite')) {
        expect(val).toBe('INTEGER');
      } else {
        expect(val).toBe('INT');
      }
    };

    const usersTableInfo = await db.sequelize
      .getQueryInterface()
      .describeTable(db.getCollection('users').getTableNameWithSchema());

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
