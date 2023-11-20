import { Database, mockDatabase } from '@nocobase/database';

describe('update many', () => {
  let db: Database;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

    db.collection({
      name: 't1',
      fields: [{ type: 'string', name: 'title' }],
    });
    await db.sync();
  });

  it('should update values', async () => {
    const repository = db.getRepository('t1');
    await repository.create({
      values: [
        { id: 1, title: 't1' },
        { id: 2, title: 't2' },
      ],
    });
    await repository.update({
      values: [
        { id: 1, title: 't11' },
        { id: 2, title: 't22' },
      ],
    });
    const items = await repository.find({
      fields: ['title'],
      sort: 'id',
    });
    expect(items.map((i) => i.title)).toEqual(['t11', 't22']);
  });

  it('should filterByTk invalid', async () => {
    const repository = db.getRepository('t1');
    await repository.create({
      values: [
        { id: 1, title: 't1' },
        { id: 2, title: 't2' },
      ],
    });
    let err;
    try {
      await repository.update({
        values: [{ id: 1, title: 't11' }, { title: 't22' }],
      });
    } catch (error) {
      err = error;
    }
    expect(err?.message).toBe('filterByTk invalid');
  });
});
