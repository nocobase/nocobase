import { Collection } from '../collection';
import { Database } from '../database';
import { mockDatabase } from './';

describe('find by targetKey', function () {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('can filter by target key', async () => {
    const User = db.collection({
      name: 'users',
      filterTargetKey: 'name',
      autoGenId: false,
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
      ],
    });

    await db.sync();

    await User.repository.create({
      values: {
        name: 'user1',
      },
    });

    await User.repository.create({
      values: {
        name: 'user2',
      },
    });

    const user2 = await User.repository.findOne({
      filterByTk: 'user2',
    });

    expect(user2.get('name')).toEqual('user2');
  });
});

describe('repository.find', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'post' },
      ],
    });
    await db.sync();
    await User.repository.createMany({
      records: [
        {
          name: 'user1',
          posts: [
            {
              name: 'post11',
              comments: [{ name: 'comment111' }, { name: 'comment112' }, { name: 'comment113' }],
            },
            {
              name: 'post12',
              comments: [{ name: 'comment121' }, { name: 'comment122' }, { name: 'comment123' }],
            },
            {
              name: 'post13',
              comments: [{ name: 'comment131' }, { name: 'comment132' }, { name: 'comment133' }],
            },
            {
              name: 'post14',
              comments: [{ name: 'comment141' }, { name: 'comment142' }, { name: 'comment143' }],
            },
          ],
        },
        {
          name: 'user2',
          posts: [
            {
              name: 'post21',
              comments: [{ name: 'comment211' }, { name: 'comment212' }, { name: 'comment213' }],
            },
            {
              name: 'post22',
              comments: [{ name: 'comment221' }, { name: 'comment222' }, { name: 'comment223' }],
            },
            {
              name: 'post23',
              comments: [{ name: 'comment231' }, { name: 'comment232' }, { name: 'comment233' }],
            },
            { name: 'post24' },
          ],
        },
        {
          name: 'user3',
          posts: [
            {
              name: 'post31',
              comments: [{ name: 'comment311' }, { name: 'comment312' }, { name: 'comment313' }],
            },
            { name: 'post32' },
            {
              name: 'post33',
              comments: [{ name: 'comment331' }, { name: 'comment332' }, { name: 'comment333' }],
            },
            { name: 'post34' },
          ],
        },
      ],
    });
  });

  afterEach(async () => {
    await db.close();
  });

  test('find pk with filter', async () => {
    const Test = db.collection({
      name: 'tests',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'status' },
      ],
    });

    await db.sync();

    const t1 = await Test.repository.create({
      values: {
        name: 't1',
        status: 'draft',
      },
    });

    const result = await Test.repository.findOne({
      filterByTk: <number>t1.get('id'),
      filter: {
        status: 'published',
      },
    });

    expect(result).toBeNull();
  });

  it('find item', async () => {
    const data = await User.repository.find({
      filter: {
        'posts.comments.id': null,
      },
    });
  });
});

describe('repository.create', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('create', async () => {
    const user = await User.repository.create({
      values: {
        name: 'user1',
        posts: [
          {
            name: 'post11',
            comments: [{ name: 'comment111' }, { name: 'comment112' }, { name: 'comment113' }],
          },
        ],
      },
    });
    const post = await Post.model.findOne();
    expect(post).toMatchObject({
      name: 'post11',
      userId: user.get('id'),
    });
    const comments = await Comment.model.findAll();
    expect(comments.map((m) => m.get('postId'))).toEqual([post.get('id'), post.get('id'), post.get('id')]);
  });

  it('can create with array of values', async () => {
    const users = await User.repository.create({
      values: [
        {
          name: 'u1',
        },
        {
          name: 'u2',
        },
      ],
    });

    expect(users.length).toEqual(2);
  });
});

describe('repository.update', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('update1', async () => {
    const user = await User.model.create<any>({
      name: 'user1',
    });
    await User.repository.update({
      filterByTk: user.id,
      values: {
        name: 'user11',
        posts: [{ name: 'post1' }],
      },
    });

    const updated = await User.model.findByPk(user.id);
    expect(updated).toMatchObject({
      name: 'user11',
    });

    const post = await Post.model.findOne({
      where: {
        name: 'post1',
      },
    });

    expect(post).toMatchObject({
      name: 'post1',
      userId: user.id,
    });
  });

  it('update2', async () => {
    const user = await User.model.create<any>({
      name: 'user1',
    });

    const user2 = await User.model.create<any>({
      name: 'user2',
    });

    await User.repository.update({
      filterByTk: user.id,
      values: {
        name: 'user11',
      },
    });

    const updated = await User.model.findByPk(user.id);

    expect(updated.get('name')).toEqual('user11');

    const u2 = await User.model.findByPk(user2.id);
    expect(u2.get('name')).toEqual('user2');
  });
});

describe('repository.destroy', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('destroy1', async () => {
    const user = await User.model.create<any>();
    await User.repository.destroy(user.id);
    const user1 = await User.model.findByPk(user.id);
    expect(user1).toBeNull();
  });

  it('destroy2', async () => {
    const user = await User.model.create<any>();
    await User.repository.destroy({
      filter: {
        id: user.id,
      },
    });
    const user1 = await User.model.findByPk(user.id);
    expect(user1).toBeNull();
  });
});

describe('repository.relatedQuery', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;

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
        { type: 'string', name: 'name' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('create', async () => {
    const user = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

    const userPostRepository = await User.repository.relation('posts').of(<number>user.get('id'));

    const post = await userPostRepository.create({
      values: { name: 'post1' },
    });

    expect(post).toMatchObject({
      name: 'post1',
      userId: user.get('id'),
    });

    const post2 = await userPostRepository.create({
      values: { name: 'post2' },
    });
    expect(post2).toMatchObject({
      name: 'post2',
      userId: user.get('id'),
    });
  });
});
