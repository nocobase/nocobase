import { Database, mockDatabase } from '@nocobase/database';

describe('underscored options', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      underscored: true,
    });

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should use underscored option', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      underscored: true,
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();

    const repository = db.getRepository('testCollection');

    await repository.create({
      values: {
        testField: 'test',
      },
    });

    const record = await repository.findOne({});

    expect(record.get('testField')).toBe('test');
  });

  it('should use database options', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    await db.sync();

    const tableName = collectionA.model.tableName;

    expect(tableName.includes('test_collection')).toBeTruthy();
  });

  test('db collectionExists', async () => {
    const collectionA = db.collection({
      name: 'testCollection',
      underscored: true,
      fields: [
        {
          type: 'string',
          name: 'testField',
        },
      ],
    });

    expect(await db.collectionExistsInDb('testCollection')).toBeFalsy();

    await db.sync();

    expect(await db.collectionExistsInDb('testCollection')).toBeTruthy();
  });
});
