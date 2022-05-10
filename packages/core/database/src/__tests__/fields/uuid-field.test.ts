import { mockDatabase } from '../';
import { Database } from '../../database';

describe('string field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('define', async () => {
    const Test = db.collection({
      name: 'tests',
      autoGenId: false,
      fields: [
        {
          type: 'uuid',
          name: 'id',
          primaryKey: true,
        },
      ],
    });
    await Test.sync();
    await Test.model.create();
  });
});
