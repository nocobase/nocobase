import { mockDatabase } from '../';
import { Database } from '../../database';
import { SnowflakeIdField } from '../../fields/snowflake-id-field';
import { DataTypes } from 'sequelize';

describe('snowflake id field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create model with snowflake id field', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'snowflakeId',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    await Test.sync();
    const item = await Test.model.create();
    expect(item['id']).toBeDefined();
    expect(typeof item['id']).toBe('string');
  });

  it('should filter by snowflake id field', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'snowflakeId',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    await Test.sync();
    const item1 = await Test.model.create();

    const result = await Test.repository.find({
      filter: {
        id: item1['id'],
      },
    });

    expect(result.length).toBe(1);
    expect(result[0].get('id')).toBe(item1.get('id'));
  });
});
