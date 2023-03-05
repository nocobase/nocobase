import Database from '../database';
import { mockDatabase } from '../mock-database';

describe('filter', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();

    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should filter by association field', async () => {
    const UserCollection = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    const PostCollection = db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
      ],
    });

    await db.sync();

    await UserCollection.repository.create({
      values: {
        name: 'John',
        posts: [
          {
            title: 'p1',
          },
          {
            title: 'p2',
          },
        ],
      },
    });

    const response = await UserCollection.repository.find({
      filter: {
        'posts.createdAt': {
          $dateOn: '2023-03-05 05:12:52.412+00',
        },
      },
    });

    expect(response).toHaveLength(1);
  });
});
