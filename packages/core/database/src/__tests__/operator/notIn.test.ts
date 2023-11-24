import { mockDatabase } from '../index';
import Database from '../../database';

describe('ne operator', () => {
  let db: Database;
  let Test;
  beforeEach(async () => {
    db = mockDatabase({});
    await db.clean({ drop: true });

    Test = db.collection({
      name: 'tests',
      fields: [{ type: 'string', name: 'name' }],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should notIn with null', async () => {
    await db.getRepository('tests').create({});

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$notIn': ['123'],
      },
    });

    expect(results).toEqual(1);
  });
});
