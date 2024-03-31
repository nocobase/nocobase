import { Database, mockDatabase } from '@nocobase/database';

describe('bigint', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should handle with number bigger than javascript MAX_SAFE_INTEGER ', async () => {
    const Test = db.collection({
      name: 'test',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
        },
      ],
    });

    await db.sync();

    await Test.repository.create({
      values: {
        id: '35809622393264128',
      },
    });
  });
});
