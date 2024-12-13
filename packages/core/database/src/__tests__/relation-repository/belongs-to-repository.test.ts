import { mockDatabase } from '../index';
import { BelongsToRepository } from '../../relation-repository/belongs-to-repository';
import Database from '@nocobase/database';

describe('belongs to repository', () => {
  let db: Database;
  let User;
  let Post;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });

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

    await db.sync({ force: true });
  });

  afterEach(async () => {
    await db.close();
  });

  test('firstOrCreate should throw error', async () => {
    const post = await Post.repository.create({
      values: { title: 'test' },
    });

    const belongsToRepository = new BelongsToRepository(Post, 'user', post.id);

    await expect(async () => {
      await belongsToRepository.firstOrCreate({
        filterKeys: ['name'],
        values: {
          name: 'test user',
        },
      });
    }).rejects.toThrow('This relation type does not support firstOrCreate');
  });

  test('updateOrCreate should throw error', async () => {
    const post = await Post.repository.create({
      values: { title: 'test' },
    });

    const belongsToRepository = new BelongsToRepository(Post, 'user', post.id);

    await expect(async () => {
      await belongsToRepository.updateOrCreate({
        filterKeys: ['name'],
        values: {
          name: 'test user',
        },
      });
    }).rejects.toThrow('This relation type does not support updateOrCreate');
  });
});
