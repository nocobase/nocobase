import { Database, mockDatabase } from '../../index';
import { waitSecond } from '@nocobase/test';

describe('unique index', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({});

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should sync multiple column unique index', async () => {
    const User = db.collection({
      name: 'users',
      indexes: [
        {
          unique: true,
          fields: ['userName', 'userEmail'],
        },
      ],
      fields: [
        { type: 'string', name: 'userName', defaultValue: 0 },
        { type: 'string', name: 'userEmail' },
      ],
    });

    await db.sync();

    expect(async () => {
      await User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test@nocobase.com',
        },
      });
    }).not.toThrow();

    await waitSecond(1000);
    expect(async () => {
      await User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test123@nocobase.com',
        },
      });
    }).not.toThrow();

    await waitSecond(1000);

    await expect(
      User.repository.create({
        values: {
          userName: 'test',
          userEmail: 'test@nocobase.com',
        },
      }),
    ).rejects.toThrow();
  });

  it('should sync unique index', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'userName', unique: true },
        { type: 'string', name: 'userEmail' },
      ],
    });

    await db.sync();

    const findFieldIndex = (indexes, fieldName) => {
      const columnName = User.model.rawAttributes[fieldName].field;

      return indexes.find((index) => {
        const indexField = index.fields;
        if (!indexField) {
          return false;
        }

        if (typeof indexField == 'string') {
          return indexField === columnName;
        }

        return indexField.length == 1 && indexField[0].attribute === columnName;
      });
    };

    const userTableInfo: any = await db.sequelize.getQueryInterface().showIndex(User.getTableNameWithSchema());

    const nameUniqueIndex = findFieldIndex(userTableInfo, 'userName');
    expect(nameUniqueIndex).toBeDefined();
    const emailUniqueIndex = findFieldIndex(userTableInfo, 'userEmail');
    expect(emailUniqueIndex).toBeUndefined();

    User.setField('userName', { type: 'string', name: 'userName' });
    User.setField('userEmail', { type: 'string', name: 'userEmail', unique: true });

    await db.sync();

    const userTableInfo2: any = await db.sequelize.getQueryInterface().showIndex(User.getTableNameWithSchema());

    const nameUniqueIndex2 = findFieldIndex(userTableInfo2, 'userName');
    expect(nameUniqueIndex2).toBeUndefined();
    const emailUniqueIndex2 = findFieldIndex(userTableInfo2, 'userEmail');
    expect(emailUniqueIndex2).toBeDefined();
  });
});
