import { mockDatabase } from '../';
import { Database } from '../../database';

describe('nanoid field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create nanoid field type', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'nanoid',
          name: 'id',
          primaryKey: true,
          size: 21,
          customAlphabet: '1234567890abcdef',
        },
        {
          type: 'nanoid',
          name: 'id2',
        },
      ],
    });
    await Test.sync();
    const test = await Test.model.create();
    expect(test.id).toHaveLength(21);
    expect(test.id2).toHaveLength(12);
  });
});
