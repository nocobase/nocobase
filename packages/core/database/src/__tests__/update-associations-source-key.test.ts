import { Collection } from '../collection';
import Database from '../database';
import { mockDatabase } from '../mock-database';

describe('update associations', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    User = db.collection({
      name: 'users',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'name', primaryKey: true },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
          foreignKey: 'userName',
          sourceKey: 'name',
        },
      ],
    });

    Post = db.collection({
      name: 'posts',
      autoGenId: false,
      timestamps: false,
      fields: [
        { type: 'string', name: 'title', primaryKey: true },
        { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'userName', targetKey: 'name' },
      ],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create user with posts', async () => {
    await Post.repository.create({
      values: {
        title: 'post2',
        user: {
          name: 'user1',
        },
      },
    });

    expect(await User.repository.count()).toBe(1);
  });

  it('should create user with posts', async () => {
    await User.repository.create({
      values: {
        name: 'user1',
        posts: [
          {
            title: 'post1',
          },
        ],
      },
    });

    expect(await Post.repository.count()).toBe(1);
  });
});
