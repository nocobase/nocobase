import { Collection, Database, mockDatabase } from '@nocobase/database';

describe('update', () => {
  let db: Database;
  let Post: Collection;
  let Tag: Collection;
  let PostTag: Collection;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
    PostTag = db.collection({
      name: 'post_tag',
      autoGenId: true,
      fields: [
        {
          type: 'belongsTo',
          name: 'post',
          target: 'posts',
          foreignKey: 'post_id',
        },
        {
          type: 'belongsTo',
          name: 'tag',
          target: 'tags',
          foreignKey: 'tag_id',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'post_tag',
          foreignKey: 'post_id',
          otherKey: 'tag_id',
        },
        {
          type: 'hasMany',
          name: 'posts_tags',
          foreignKey: 'post_id',
          target: 'post_tag',
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
          through: 'post_tag',
          foreignKey: 'tag_id',
          otherKey: 'post_id',
        },
      ],
    });

    await db.sync();
    d;
  });

  it('should throw error when update data conflicted', async () => {
    const t1 = await Tag.repository.create({
      values: {
        name: 't1',
      },
    });
    const t2 = await Tag.repository.create({
      values: {
        name: 't2',
      },
    });
    const post1 = await Post.repository.create({
      values: {
        title: 'p1',
        tags: [t1.get('id')],
      },
    });
    const postTag = await PostTag.repository.findOne();
    let error;
    try {
      await Post.repository.update({
        filterByTk: post1.get('id'),
        values: {
          posts_tags: [
            {
              id: postTag.get('id'),
              tag: t1.get('id'),
              post: post1.get('id'),
            },
          ],
          tags: [t2.get('id')],
        },
        updateAssociationValues: ['posts_tags'],
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
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
