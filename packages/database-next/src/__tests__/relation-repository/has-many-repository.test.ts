import { mockDatabase } from '../index';
import { HasManyRepository } from '../../relation-repository/hasmany-repository';
import { BelongsToManyRepository } from '../../relation-repository/belongs-to-many-repository';

describe('has many repository', () => {
  let db;
  let User;
  let Post;
  let Comment;
  let Tag;

  beforeEach(async () => {
    db = mockDatabase({});
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
        { type: 'belongsToMany', name: 'tags', through: 'posts_tags' },
        { type: 'hasMany', name: 'comments' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'belongsToMany', name: 'posts', through: 'posts_tags' },
        { type: 'string', name: 'name' },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync();
  });

  test('find', async () => {
    const u1 = await User.repository.create({
      name: 'u1',
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    await UserPostRepository.create({
      values: {
        title: 't1',
      },
    });

    const t1 = await UserPostRepository.findOne();
    expect(t1.title).toEqual('t1');
  });

  test('create', async () => {
    const u1 = await User.repository.create({
      name: 'u1',
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    const post = await UserPostRepository.create({
      values: {
        title: 't1',
        comments: [{ content: 'content1' }],
      },
    });

    expect(post.title).toEqual('t1');
    expect(post.userId).toEqual(u1.id);
  });

  test('update', async () => {
    const u1 = await User.repository.create({
      name: 'u1',
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    await UserPostRepository.create({
      values: {
        title: 't1',
        comments: [{ content: 'content1' }],
      },
    });

    await UserPostRepository.update({
      filter: {
        title: 't1',
      },
      values: {
        title: 'u1t1',
      },
    });

    const p1 = await UserPostRepository.findOne();
    expect(p1.title).toEqual('u1t1');
  });

  test('find', async () => {
    const u1 = await User.repository.create({ name: 'u1' });

    const t1 = await Tag.repository.create({ name: 't1' });

    const t2 = await Tag.repository.create({ name: 't2' });

    const t3 = await Tag.repository.create({ name: 't3' });

    const p1 = await Post.repository.create({
      title: 'p1',
    });

    const p2 = await Post.repository.create({
      title: 'p2',
    });

    const UserPostRepository = new HasManyRepository(User, 'posts', u1.id);
    await UserPostRepository.add(p1.id);

    const PostTagRepository = new BelongsToManyRepository(Post, 'tags', p1.id);
    await PostTagRepository.set([t1.id, t2.id, t3.id]);

    const posts = await UserPostRepository.find({
      filter: {
        'tags.name': 't1',
      },
      appends: ['tags'],
    });

    const post = posts[0];

    expect(post.tags.length).toEqual(3);
  });
});
