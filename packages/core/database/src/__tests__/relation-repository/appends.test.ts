import Database, { BelongsToRepository, Collection, mockDatabase } from '@nocobase/database';

describe('appends', () => {
  let db: Database;

  let User: Collection;
  let Post: Collection;

  let A1: Collection;
  let A2: Collection;

  afterEach(async () => {
    await db.close();
  });

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
        {
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();
  });

  it('should find with appends', async () => {
    await User.repository.create({
      values: {
        name: 'u1',
        posts: [
          {
            title: 'p1',
          },
        ],
      },
    });

    const p1 = await Post.repository.findOne({});

    const repository = new BelongsToRepository(Post, 'user', p1['id']);

    const user = await repository.findOne({
      appends: ['posts'],
    });

    const data = user.toJSON();
    expect(data['posts'][0]['title']).toEqual('p1');
  });
});
