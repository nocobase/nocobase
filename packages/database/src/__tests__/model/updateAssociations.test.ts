import { getDatabase } from '..';
import Database from '../..';

let db: Database;

beforeEach(async () => {
  db = getDatabase();
  db.table({
    name: 'users',
    fields: [
      {
        type: 'hasMany',
        name: 'posts',
      },
      {
        type: 'hasOne',
        name: 'profile',
      }
    ],
  });
  db.table({
    name: 'profiles',
  });
  db.table({
    name: 'posts',
    fields: [
      {
        type: 'hasMany',
        name: 'comments',
      },
      {
        type: 'belongsTo',
        name: 'user',
      },
      {
        type: 'belongsToMany',
        name: 'tags',
      }
    ],
  });
  db.table({
    name: 'tags',
    fields: [
      {
        type: 'belongsToMany',
        name: 'posts',
      }
    ]
  });
  db.table({
    name: 'comments',
    fields: [
      {
        type: 'belongsTo',
        name: 'post',
      },
    ]
  });
  await db.sync();
});

afterEach(async () => {
  await db.close();
});

describe('updateAssociations', () => {
  describe('set null', () => {
    it('belongsTo', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const user = await User.create();
      const post = await Post.create();
      await post.updateAssociations({
        user,
      });
      await post.updateAssociations({});
      const postUser = await post.getUser();
      expect(postUser.id).toBe(user.id);
      await post.updateAssociations({
        user: null,
      });
      expect(await post.getUser()).toBeNull();
    });

    it('hasMany', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const user = await User.create();
      const post = await Post.create();
      await user.updateAssociations({
        posts: [post],
      });
      expect(await user.countPosts()).toBe(1);
      await user.updateAssociations({
        posts: [], // 空数组
      });
      expect(await user.countPosts()).toBe(0);
      await user.updateAssociations({
        posts: [post],
      });
      expect(await user.countPosts()).toBe(1);
      await user.updateAssociations({
        posts: null,
      });
      expect(await user.countPosts()).toBe(0);
    });
  });
});

