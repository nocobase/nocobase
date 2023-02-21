import { mockDatabase } from '../';
import { Database } from '../../database';
import { Model } from '../../model';

describe('DateTime field', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      timezone: '+01:00',
    });
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

    let r1: Model = await c1.repository.create({});
    r1 = await r1.reload();
    expect(r1.get('dateField').toISOString()).toEqual('2016-05-20T00:00:00.000Z');
  });
});
