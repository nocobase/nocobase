import { mockDatabase } from '../index';
import { HasManyRepository } from '../../relation-repository/hasmany-repository';
import { Collection } from '../../collection';

describe('count', () => {
  let db;
  let User: Collection;
  let Post: Collection;
  let Tag;

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
        { type: 'belongsToMany', name: 'tags' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'belongsToMany', name: 'posts' },
      ],
    });
    await db.sync();
  });

  test('count with association', async () => {
    const user1 = await User.repository.create({
      values: {
        name: 'u1',
      },
    });

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

    const t3 = await Tag.repository.create({
      values: {
        name: 't3',
      },
    });

    const UserPostRepository =
      User.repository.relation<HasManyRepository>('posts');

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p1',
        tags: [t1, t2, t3],
      },
    });

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p2',
        tags: [t1, t2, t3],
      },
    });

    await UserPostRepository.of(user1['id']).create({
      values: {
        title: 'u1p3',
        tags: [t1, t2, t3],
      },
    });

    expect(await Post.repository.count()).toEqual(3);

    expect(
      await Post.repository.count({
        filter: {
          'tags.name': 't1',
        },
      }),
    ).toEqual(3);
  });
});
