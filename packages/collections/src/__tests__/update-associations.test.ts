import { Database } from '../database';
import { updateAssociation, updateAssociations } from '../update-associations';
import { mockDatabase } from './';

describe('update associations', () => {
  let db: Database;

  beforeEach(() => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('hasMany', () => {
    it.only('model', async () => {
      const User = db.collection({
        name: 'users',
        schema: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts' },
        ],
      });
      const Post = db.collection({
        name: 'posts',
        schema: [
          { type: 'string', name: 'title' },
        ],
      });
      await db.sync();
      const user = await User.model.create();
      const post1 = await Post.model.create();
      const post2 = await Post.model.create<any>();
      const post3 = await Post.model.create<any>();
      const post4 = await Post.model.create<any>();
      await updateAssociations(user, {
        posts: {
          title: 'post0',
        },
      });
      await updateAssociations(user, {
        posts: post1,
      });
      await updateAssociations(user, {
        posts: post2.id,
      });
      await updateAssociations(user, {
        posts: [post3.id],
      });
      await updateAssociations(user, {
        posts: {
          id: post4.id,
          title: 'post4',
        },
      });
    });
  });

  it('nested', async () => {
    const User = db.collection({
      name: 'users',
      schema: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });
    const Post = db.collection({
      name: 'posts',
      schema: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user' },
        { type: 'hasMany', name: 'comments' },
      ],
    });
    const Comment = db.collection({
      name: 'comments',
      schema: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });
    await db.sync();
    const user = await User.model.create();
    await updateAssociations(user, {
      posts: [
        {
          title: 'post1',
          // user: {
          //   name: 'user1',
          // },
          comments: [
            {
              content: 'content1',
            },
          ],
        },
      ],
    });
  });
});
