import { vi } from 'vitest';
import { Database } from '../database';
import { mockDatabase } from './';

describe('update through', () => {
  let db: Database;
  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should not be reset', async () => {
    db.collection({
      name: 'c',
      autoGenId: true,
      fields: [
        {
          name: 'id',
          type: 'integer',
          primaryKey: true,
          autoIncrement: true,
        },
      ],
    });
    db.collection({
      name: 'a',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'b',
          target: 'b',
          through: 'c',
        },
      ],
    });
    db.collection({
      name: 'b',
      fields: [],
    });
    await db.sync();
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    db.on('c.afterCreate', callback1);
    db.on('c.afterBulkCreate', callback2);
    const b = await db.getRepository('b').create({
      values: {},
    });
    const a = await db.getRepository('a').create({
      values: {
        b: [b.toJSON()],
      },
    });
    const c1 = await db.getRepository('c').findOne();
    await db.getRepository('a').update({
      filterByTk: a.id,
      values: {
        b: [b.toJSON()],
      },
    });

    const c2 = await db.getRepository('c').findOne();
    expect(c1.get('id')).toBe(c2.get('id'));
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
