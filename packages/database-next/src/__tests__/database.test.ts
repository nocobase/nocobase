import { Database } from '../database';
import { mockDatabase } from './index';
import { HasMany } from 'sequelize';

describe('define collection', () => {
  test('hasMany with inverse belongsTo relation', async () => {
    const db = mockDatabase();
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(UserCollection.model.associations.posts).toBeDefined();
    expect(PostCollection.model.associations.user).toBeDefined();
  });

  test('belongsTo with inverse hasMany relation', async () => {
    const db = mockDatabase();
    const UserCollection = db.collection({
      name: 'users',
      fields: [{ type: 'string', name: 'name' }],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    expect(PostCollection.model.associations.user).toBeDefined();
    expect(UserCollection.model.associations.posts).toBeDefined();
  });
});
