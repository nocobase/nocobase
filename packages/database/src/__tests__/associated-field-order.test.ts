import { mockDatabase } from '@nocobase/test';
import { Database } from '..';

describe('associated field order', () => {
  let db: Database;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

    db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
          sortBy: 'title',
        },
      ],
    });

    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          sortBy: 'name',
        },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });
    await db.sync();
  });

  it('should sort hasMany association', async () => {
    await db.getRepository('users').create({
      values: {
        name: 'u1',
        posts: [{ title: 'c' }, { title: 'b' }, { title: 'a' }],
      },
    });

    const u1 = await db.getRepository('users').findOne({
      appends: ['posts'],
    });

    const u1Json = u1.toJSON();

    const u1Posts = u1Json['posts'];
    expect(u1Posts.map((p) => p['title'])).toEqual(['a', 'b', 'c']);
  });

  it('should sort belongsToMany association', async () => {
    await db.getRepository('posts').create({
      values: {
        title: 'p1',
        tags: [{ name: 'c' }, { name: 'b' }, { name: 'a' }],
      },
    });

    const p1 = await db.getRepository('posts').findOne({
      appends: ['tags'],
    });

    const p1JSON = p1.toJSON();

    const p1Tags = p1JSON['tags'];
    expect(p1Tags.map((p) => p['name'])).toEqual(['a', 'b', 'c']);
  });

  it('should sort nested associations', async () => {
    await db.getRepository('users').create({
      values: {
        name: 'u1',
        posts: [{ title: 'c', tags: [{ name: 'c' }, { name: 'b' }, { name: 'a' }] }, { title: 'b' }, { title: 'a' }],
      },
    });

    const u1 = await db.getRepository('users').findOne({
      appends: ['posts.tags'],
    });

    const u1Json = u1.toJSON();
    const u1Posts = u1Json['posts'];
    expect(u1Posts.map((p) => p['title'])).toEqual(['a', 'b', 'c']);

    const postCTags = u1Posts[2]['tags'];
    expect(postCTags.map((p) => p['name'])).toEqual(['a', 'b', 'c']);
  });
});
