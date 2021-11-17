import { mockDatabase } from '../index';
import { HasManyRepository } from '../../relation-repository/hasmany-repository';

describe('has many repository', () => {
  let db;
  let User;
  let Post;
  let Comment;

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
        { type: 'hasMany', name: 'comments' },
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
});
