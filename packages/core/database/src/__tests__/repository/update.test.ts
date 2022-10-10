import { Collection, Database, mockDatabase } from '@nocobase/database';

describe('update', () => {
  let db: Database;
  let User: Collection;
  let Tag: Collection;
  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });

    await db.sync();
  });

  it('should update tags to null', async () => {
    await db.getRepository('posts').create({
      values: {
        title: 'p1',
        tags: [{ name: 't1' }],
      },
    });

    const [p1] = await db.getRepository('posts').update({
      values: {
        tags: null,
      },
      filter: {
        title: 'p1',
      },
    });

    expect(p1.toJSON()['tags']).toEqual([]);
  });

  it('should not update items without filter or filterByPk', async () => {
    await db.getRepository('posts').create({
      values: {
        title: 'p1',
      },
    });

    let error;

    try {
      await db.getRepository('posts').update({
        values: {
          title: 'p3',
        },
      });
    } catch (e) {
      error = e;
    }

    expect(error).not.toBeUndefined();

    const p1 = await db.getRepository('posts').findOne();
    expect(p1.toJSON()['title']).toEqual('p1');

    await db.getRepository('posts').update({
      values: {
        title: 'p3',
      },
      filterByTk: p1.get('id') as number,
    });

    await p1.reload();
    expect(p1.toJSON()['title']).toEqual('p3');
  });
});
