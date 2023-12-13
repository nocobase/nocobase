import { Database } from '../database';
import { mockDatabase } from './index';

const excludeSqlite = () => (process.env.DB_DIALECT != 'sqlite' ? describe : describe.skip);

excludeSqlite()('collection', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      logging: console.log,
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should using bigint for id field', async () => {
    const collection = db.collection({
      name: 'users',
      fields: [{ type: 'hasOne', name: 'profile' }],
    });

    await db.sync();
    const tableInfo = await db.sequelize.getQueryInterface().describeTable(collection.model.tableName);

    if (db.inDialect('mariadb')) {
      expect(tableInfo['id'].type).toBe('BIGINT(20)');
    } else {
      expect(tableInfo['id'].type).toBe('BIGINT');
    }

    const profile = db.collection({
      name: 'profiles',
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();

    const profileTableInfo = await db.sequelize.getQueryInterface().describeTable(profile.model.tableName);

    if (db.inDialect('mariadb')) {
      expect(profileTableInfo[profile.model.rawAttributes['userId'].field].type).toBe('BIGINT(20)');
    } else {
      expect(profileTableInfo[profile.model.rawAttributes['userId'].field].type).toBe('BIGINT');
    }
  });
});
