import Database from '../../database';
import { mockDatabase } from '../index';

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

  it('should ne with null', async () => {
    await db.getRepository('tests').create({});

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$ne': '123',
      },
    });

    expect(results).toEqual(1);
  });

  it('compare with null', async () => {
    await db.getRepository('tests').create({});

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$ne': null,
      },
    });

    expect(results).toBe(0);
  });

  it('should ne with array', async () => {
    await db.getRepository('tests').create({
      values: [{ name: '123' }, { name: '234' }, { name: '345' }],
    });

    const results = await db.getRepository('tests').count({
      filter: {
        'name.$ne': ['123', '234'],
      },
    });

    expect(results).toEqual(1);
  });
});
