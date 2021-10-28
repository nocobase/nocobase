import { Collection } from '../collection';
import { Database } from '../database';
import { mockDatabase } from './';

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
        { type: 'hasMany', name: 'comments' },
      ],
    });
    Comment = db.collection({
      name: 'comments',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
    await User.repository.createMany([
      {
        name: 'user1',
        posts: [
          {
            name: 'post11',
            comments: [
              { name: 'comment111' },
              { name: 'comment112' },
              { name: 'comment113' },
            ],
          },
          {
            name: 'post12',
            comments: [
              { name: 'comment121' },
              { name: 'comment122' },
              { name: 'comment123' },
            ],
          },
          {
            name: 'post13',
            comments: [
              { name: 'comment131' },
              { name: 'comment132' },
              { name: 'comment133' },
            ],
          },
          {
            name: 'post14',
            comments: [
              { name: 'comment141' },
              { name: 'comment142' },
              { name: 'comment143' },
            ],
          },
        ],
      },
      {
        name: 'user2',
        posts: [
          {
            name: 'post21',
            comments: [
              { name: 'comment211' },
              { name: 'comment212' },
              { name: 'comment213' },
            ],
          },
          {
            name: 'post22',
            comments: [
              { name: 'comment221' },
              { name: 'comment222' },
              { name: 'comment223' },
            ],
          },
          {
            name: 'post23',
            comments: [
              { name: 'comment231' },
              { name: 'comment232' },
              { name: 'comment233' },
            ],
          },
          { name: 'post24' },
        ],
      },
      {
        name: 'user3',
        posts: [
          {
            name: 'post31',
            comments: [
              { name: 'comment311' },
              { name: 'comment312' },
              { name: 'comment313' },
            ],
          },
          { name: 'post32' },
          {
            name: 'post33',
            comments: [
              { name: 'comment331' },
              { name: 'comment332' },
              { name: 'comment333' },
            ],
          },
          { name: 'post34' },
        ],
      },
    ]);
  });

  afterEach(async () => {
    await db.close();
  });

  it('findOne', async () => {
    const data = await User.repository.findOne({
      filter: {
        'posts.comments.name': 'comment331',
      },
    });
    console.log(data);
  });

  it('findMany', async () => {
    const data = await User.repository.findMany({
      filter: {
        'posts.comments.id': null,
      },
      page: 1,
      pageSize: 1,
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
      name: 'user1',
      posts: [
        {
          name: 'post11',
          comments: [
            { name: 'comment111' },
            { name: 'comment112' },
            { name: 'comment113' },
          ],
        },
      ],
    });
    const post = await Post.model.findOne();
    expect(post).toMatchObject({
      name: 'post11',
      userId: user.get('id'),
    });
    const comments = await Comment.model.findAll();
    expect(comments.map((m) => m.get('postId'))).toEqual([
      post.get('id'),
      post.get('id'),
      post.get('id'),
    ]);
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
    await User.repository.update(
      {
        name: 'user11',
        posts: [{ name: 'post1' }],
      },
      user,
    );
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
      posts: [{ name: 'post1' }],
    });
    await User.repository.update(
      {
        name: 'user11',
        posts: [{ name: 'post1' }],
      },
      user.id,
    );
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
    const user = await User.repository.create();
    const post = await User.repository.relatedQuery('posts').for(user).create({
      name: 'post1',
    });
    expect(post).toMatchObject({
      name: 'post1',
      userId: user.id,
    });
    const post2 = await User.repository
      .relatedQuery('posts')
      .for(user.id)
      .create({
        name: 'post2',
      });
    expect(post2).toMatchObject({
      name: 'post2',
      userId: user.id,
    });
  });

  it('update', async () => {
    const post = await Post.repository.create({
      user: {
        name: 'user11',
      },
    });
    await Post.repository.relatedQuery('user').for(post).update({
      name: 'user12',
    });
  });
});
