import { markValueAsJsonata } from '@nocobase/utils';
import Database from '../../database';
import { mockDatabase } from '../index';

describe('ne operator', () => {
  let db: Database;
  let Test;
  beforeEach(async () => {
    db = mockDatabase({});

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

    const results2 = await db.getRepository('tests').count({
      filter: {
        'name.$notIn': markValueAsJsonata(['123']),
      },
    });
    expect(results2).toEqual(1);
  });
});
