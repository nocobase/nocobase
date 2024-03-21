import { mockDatabase } from '../';
import { Database } from '../../database';

describe('string field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create uuid field', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        {
          name: 'uuid',
          type: 'uuid',
        },
      ],
    });

    await Test.sync();
    const item = await Test.model.create();

    expect(item['uuid']).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
