import { mockDatabase } from '../index';
import Database from '../../database';

describe('create with hasMany', () => {
  let db: Database;
  let Post;
  let User;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
      ],
    });

    Post = db.collection({
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
      ],
    });

    await db.sync();
  });

  it('should save associations with reverseField value', async () => {
    const u1 = await db.getRepository('users').create({
      values: {
        name: 'u1',
        posts: [{ title: 't1', user: null }],
      },
    });

    const p1 = await db.getRepository('posts').findOne();
    // @ts-ignore
    expect(await p1.getUser()).not.toBeNull();
  });
});

describe('create with belongsToMany', () => {
  let db: Database;
  let Post;
  let Tag;

  afterEach(async () => {
    await db.close();
  });

  beforeEach(async () => {
    db = mockDatabase();
    Post = db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
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

  it('should save associations with reverseField value', async () => {
    const t1 = await db.getRepository('tags').create({
      values: {
        name: 't1',
      },
    });

    const p1 = await db.getRepository('posts').create({
      values: {
        title: 'p1',
        tags: [{ id: t1.get('id'), name: 't1', posts: [] }],
      },
    });

    // @ts-ignore
    expect(await p1.countTags()).toEqual(1);
  });
});

describe('create', () => {
  let db: Database;
  let User;
  let Post;

  beforeEach(async () => {
    db = mockDatabase();
    User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    Post = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('create with association', async () => {
    const u1 = await User.repository.create({
      values: {
        name: 'u1',
        posts: [{ title: 'u1p1' }],
      },
    });

    expect(u1.name).toEqual('u1');
    expect(await u1.countPosts()).toEqual(1);
  });
});
