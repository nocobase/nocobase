import { Database, mockDatabase } from '../../index';
import * as process from 'process';

describe('primary key', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create primary key without auto increment', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
    });

    await db.sync();

    User.setField('someField', {
      primaryKey: true,
      type: 'string',
      defaultValue: '12321',
    });

    await db.sync();

    const getTableInfo = async () => {
      return await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());
    };

    const assertPrimaryKey = async (fieldName, primaryKey) => {
      const tableInfo = await getTableInfo();
      const field = User.model.rawAttributes[fieldName].field;
      expect(tableInfo[field].primaryKey).toBe(primaryKey);
    };

    await assertPrimaryKey('someField', true);
  });

  it('should create primary key with auto increment', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
    });

    await db.sync();

    User.setField('someField', {
      primaryKey: true,
      autoIncrement: true,
      type: 'integer',
      defaultValue: null,
    });

    await db.sync();

    const getTableInfo = async () => {
      return await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());
    };

    const assertPrimaryKey = async (fieldName, primaryKey) => {
      const tableInfo = await getTableInfo();
      const field = User.model.rawAttributes[fieldName].field;
      expect(tableInfo[field].primaryKey).toBe(primaryKey);
    };

    await assertPrimaryKey('someField', true);
  });
});
describe.skipIf(process.env['DB_DIALECT'] === 'sqlite')('primary key not in sqlite', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should change primary key', async () => {
    const User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
    });

    await db.sync();

    const getTableInfo = async () => {
      return await db.sequelize.getQueryInterface().describeTable(User.getTableNameWithSchema());
    };

    const assertPrimaryKey = async (fieldName, primaryKey) => {
      const tableInfo = await getTableInfo();
      const field = User.model.rawAttributes[fieldName].field;
      expect(tableInfo[field].primaryKey).toBe(primaryKey);
    };

    // add a field as primary key
    User.setField('name', { type: 'string', name: 'name', primaryKey: true });
    await db.sync();

    await assertPrimaryKey('name', true);
    // use  another field as primary key
    User.setField('name', { type: 'string', name: 'name', primaryKey: false });
    await db.sync();
    await assertPrimaryKey('name', false);

    User.setField('fullName', { type: 'string', name: 'fullName', primaryKey: true });
    await db.sync();
    await assertPrimaryKey('fullName', true);
  });
});
