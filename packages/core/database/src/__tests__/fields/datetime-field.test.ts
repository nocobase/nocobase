import { mockDatabase } from '../';
import { Database } from '../../database';

describe('DateTime field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create date field with default value that is IOS 8601 format', async () => {
    const c1 = db.collection({
      name: 'dateTests',
      fields: [
        {
          name: 'dateField',
          type: 'date',
          defaultValue: '2016-05-20T00:00:00.000Z',
        },
      ],
    });

    await db.sync();

    const r1 = await c1.repository.create({});
  });
});
