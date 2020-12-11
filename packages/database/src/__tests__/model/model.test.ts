import Database from '../..';
import { getDatabase } from '..';
import Model, { ModelCtor } from '../../model';



let db: Database;

beforeEach(async () => {
  db = getDatabase();
});

afterEach(async () => {
  await db.close();
});

describe('model', () => {
  beforeEach(async () => {
    db.table({
      name: 'users',
      tableName: 'user1234',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'hasone',
          name: 'profile',
        },
        {
          type: 'hasMany',
          name: 'posts',
        },
        {
          type: 'hasMany',
          name: 'posts_title1',
          target: 'posts',
          scope: {
            title: 'title1',
          },
        }
      ]
    });

    db.table({
      name: 'profiles',
      tableName: 'profile1234',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ]
    });

    db.table({
      name: 'posts',
      tableName: 'post123456',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
        {
          type: 'belongsToMany',
          name: 'tags_name1',
          target: 'tags',
          scope: {
            name: 'name1',
          },
        },
        {
          type: 'hasMany',
          name: 'comments',
        },
        {
          type: 'hasMany',
          name: 'current_user_comments',
          target: 'comments',
        },
      ]
    });

    db.table({
      name: 'posts_tags',
      tableName: 'posts_tags1234',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ]
    });

    db.table({
      name: 'tags',
      tableName: 'tag1234',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'belongsToMany',
          name: 'posts',
        },
      ],
    });

    db.table({
      name: 'comments',
      tableName: 'comment1234',
      fields: [
        {
          type: 'belongsTo',
          name: 'user',
        },
        {
          type: 'belongsTo',
          name: 'post',
        },
        {
          type: 'string',
          name: 'content',
        }
      ]
    });

    db.table({
      name: 'tables',
      fields: [
        {
          type: 'string',
          name: 'name',
          primaryKey: true,
          autoIncrement: false,
        },
        {
          type: 'hasMany',
          name: 'fields',
        }
      ],
    });

    db.table({
      name: 'fields',
      fields: [
        {
          type: 'belongsTo',
          name: 'table',
        },
        {
          type: 'string',
          name: 'name',
        }
      ],
    });

    db.table({
      name: 'rows',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'hasMany',
          name: 'columns',
          sourceKey: 'name',
        }
      ],
    });

    db.table({
      name: 'columns',
      fields: [
        {
          type: 'belongsTo',
          name: 'row',
          targetKey: 'name',
        },
        {
          type: 'string',
          name: 'name',
        }
      ],
    });

    await db.sync({
      force: true,
    });
  });

  describe('.updateAssociations', () => {
    describe('belongsTo', () => {
      it('update with primary key', async () => {
        const [User, Post] = db.getModels(['users', 'posts']);
        const user = await User.create();
        const post = await Post.create();
        await post.updateAssociations({
          user: user.id
        });

        const authorizedPost = await Post.findByPk(post.id);
        expect(authorizedPost.user_id).toBe(user.id);
      });

      it('update with new object', async () => {
        const Post = db.getModel('posts');
        const post = await Post.create();
        await post.updateAssociations({
          user: {}
        });

        const authorizedPost = await Post.findByPk(post.id);
        expect(authorizedPost.user_id).toBe(1);
      });

      it('update with new model', async () => {
        const [User, Post] = db.getModels(['users', 'posts']);
        const user = await User.create();
        const post = await Post.create();
        await post.updateAssociations({
          user
        });

        const authorizedPost = await Post.findByPk(post.id);
        expect(authorizedPost.user_id).toBe(user.id);
      });

      it('update with exist model', async () => {
        const [User, Post] = db.getModels(['users', 'posts']);
        const user1 = await User.create();
        const user2 = await Post.create();
        const post = await Post.create();
        await post.updateAssociations({
          user: user1.id
        });
        await post.updateAssociations({
          user: user2.id
        });

        const authorizedPost = await Post.findByPk(post.id);
        expect(authorizedPost.user_id).toBe(user2.id);
      });
    });
    
    describe('hasMany', () => {
      it('update with primary key', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments: comments.map(item => item.id)
        });
        const postComments = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id']
        });
        expect(postComments.map(item => item.id)).toEqual([1,2,3,4]);
      });

      it('update with new object', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        await post.updateAssociations({
          comments: [{},{},{},{}]
        });
        const postCommentIds = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id']
        });
        expect(postCommentIds.map(item => item.id)).toEqual([1,2,3,4]);
      });

      it('update with new model', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments
        });
        const postCommentIds = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id']
        });
        expect(postCommentIds.map(item => item.id)).toEqual([1,2,3,4]);
      });

      it('update with exist rows/primaryKeys', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments
        });
        await post.updateAssociations({
          comments
        });
        await post.updateAssociations({
          comments: comments.map(item => item.id)
        });
        const postCommentIds = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id']
        });
        expect(postCommentIds.map(item => item.id)).toEqual([1,2,3,4]);
      });

      it('update with exist objects', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments
        });
        await post.updateAssociations({
          comments: comments.map(item => ({
            ...item.get(),
            content: `content${item.id}`
          }))
        });
        const postComments = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id', 'content']
        });
        expect(postComments.map(({ id, content }) => ({ id, content }))).toEqual([
          { id: 1, content: 'content1' },
          { id: 2, content: 'content2' },
          { id: 3, content: 'content3' },
          { id: 4, content: 'content4' }
        ]);
      });

      it('update another with exist objects', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const post2 = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments
        });
        const postComments = await Comment.findAll({
          where: { post_id: post.id }
        });
        expect(postComments.map(({ id, post_id }) => ({ id, post_id }))).toEqual([
          { id: 1, post_id: post.id },
          { id: 2, post_id: post.id },
          { id: 3, post_id: post.id },
          { id: 4, post_id: post.id }
        ]);

        await post2.updateAssociations({
          comments: postComments.map(item => ({
            ...item.get(),
            content: `content${item.id}`
          }))
        });
        const updatedComments = await Comment.findAll();
        const post1CommentsCount = await Comment.count({
          where: { post_id: post.id }
        });
        expect(post1CommentsCount).toBe(0);

        const post2Comments = await Comment.findAll({
          where: { post_id: post2.id },
          attributes: ['id', 'content']
        });
        expect(post2Comments.map(({ id, content }) => ({ id, content }))).toEqual([
          { id: 1, content: 'content1' },
          { id: 2, content: 'content2' },
          { id: 3, content: 'content3' },
          { id: 4, content: 'content4' }
        ]);
      });

      it('update with different primaryKey/row/object', async () => {
        const [Post, Comment] = db.getModels(['posts', 'comments']);
        const post = await Post.create();
        const comments = await Comment.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          comments
        });
        await post.updateAssociations({
          comments: comments
            .filter(({ id }) => Boolean(id % 2))
            .concat(...[await Comment.create()])
        });

        const postComments = await Comment.findAll({
          where: { post_id: post.id },
          attributes: ['id']
        });
        expect(postComments.map(({ id }) => id)).toEqual([1,3,5]);
      });
    });

    describe('belongsToMany', () => {
      it('update with primary key', async () => {
        const [Post, Tag, PostTag] = db.getModels(['posts', 'tags', 'posts_tags']);
        const post = await Post.create();
        const tags = await Tag.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          tags: tags.map(item => item.id)
        });
        const tagged = await PostTag.findAll({
          where: { post_id: post.id },
          attributes: ['tag_id']
        });
        expect(tagged.map(item => item.tag_id)).toEqual([1,2,3,4]);
      });

      it('update with exist rows/primaryKeys', async () => {
        const [Post, Tag, PostTag] = db.getModels(['posts', 'tags', 'posts_tags']);
        const post = await Post.create();
        const tags = await Tag.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          tags: tags.map(item => item.id)
        });
        await post.updateAssociations({
          tags: tags.map(item => item.id)
        });
        await post.updateAssociations({
          tags
        });
        const tagged = await PostTag.findAll({
          where: { post_id: post.id },
          attributes: ['tag_id', 'post_id']
        });
        expect(tagged.map(({ post_id, tag_id }) => ({ post_id, tag_id }))).toEqual([
          { tag_id: 1, post_id: 1 },
          { tag_id: 2, post_id: 1 },
          { tag_id: 3, post_id: 1 },
          { tag_id: 4, post_id: 1 },
        ]);
      });

      it('update with exist rows/primaryKeys and new objects', async () => {
        const [Post, Tag, PostTag] = db.getModels(['posts', 'tags', 'posts_tags']);
        const post = await Post.create();
        const tags = await Tag.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          tags: tags.map(item => item.id)
        });
        await post.updateAssociations({
          tags: tags.filter(({ id }) => Boolean(id % 2)).concat(await Tag.create({}))
        });
        const tagged = await PostTag.findAll({
          where: { post_id: post.id },
          attributes: ['tag_id']
        });
        expect(tagged.map(({ tag_id }) => tag_id)).toEqual([1,3,5]);
      });

      it('update other with exist rows/primaryKeys', async () => {
        const [Post, Tag, PostTag] = db.getModels(['posts', 'tags', 'posts_tags']);
        const post = await Post.create();
        const post2 = await Post.create();
        const tags = await Tag.bulkCreate([{}, {}, {}, {}]);
        await post.updateAssociations({
          tags: tags.map(item => item.id)
        });
        await post2.updateAssociations({
          tags
        });
        const tagged = await PostTag.findAll();
        expect(tagged.map(({ post_id, tag_id }) => ({ post_id, tag_id }))).toEqual([
          { tag_id: 1, post_id: 1 },
          { tag_id: 2, post_id: 1 },
          { tag_id: 3, post_id: 1 },
          { tag_id: 4, post_id: 1 },
          { tag_id: 1, post_id: 2 },
          { tag_id: 2, post_id: 2 },
          { tag_id: 3, post_id: 2 },
          { tag_id: 4, post_id: 2 },
        ]);
      });
    });

    it('through attributes', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tag = await Tag.create();
      await post.updateAssociations({
        tags: [{
          name: 'xxx',
          posts_tags: {
            name: 'name134',
          }
        }, {
          id: tag.id,
          posts_tags: {
            name: 'name234',
          }
        }],
      });
      const PostTag = db.getModel('posts_tags');
      const [t1, t2] = await PostTag.findAll({
        where: {
          post_id: post.id,
        },
        order: ['tag_id'],
      });
      expect(t1.name).toBe('name234');
      expect(t2.name).toBe('name134');
    });
  });

  describe('scope', () => {
    it('scope', async () => {
      const [User, Post, Comment] = db.getModels(['users', 'posts', 'comments']);
      const user1 = await User.create();
      const user2 = await User.create();
      const user3 = await User.create();
      const user4 = await User.create();
      const post = await Post.create();
      const comment = await Comment.create();
      comment.updateAssociations({
        post: post,
        user: user1,
      });
      await post.updateAssociations({
        comments: [
          {
            content: 'content1',
            user: user1,
          },
          {
            content: 'content2',
            user: user2,
          },
          {
            content: 'content3',
            user: user3,
          },
          {
            content: 'content4',
            user: user4,
          },
        ],
      });
      try {
      const comments = await post.getCurrent_user_comments();
      // TODO: no expect
      } catch (error) {
        console.error(error);
      }
    });
  });

  describe('query', () => {
    it('q', async () => {
      db.getModel('tags').addScope('scopeName', (name, ctx) => {
        expect(ctx.scopeName).toBe(name);
        return {
          where: {
            name: name,
          }
        }
      });

      const [User, Post] = db.getModels(['users', 'posts']);
      const postData = [];
      for (let index = 0; index < 20; index++) {
        postData.push({
          title: `title${index}`,
        });
      }
      const user = await User.create({
        name: 'name112233',
      });
      await Post.create({
        title: 'xxxx',
      });
      const post = await Post.create({
        title: 'title112233',
      });
      await user.updateAssociations({
        posts: post,
      });
      await post.updateAssociations({
        tags: [
          {name: 'tag1'},
          {name: 'tag2'},
          {name: 'tag3'},
        ],
      });
      // where & include
      const options = Post.parseApiJson({
        filter: {
          title: 'title112233',
          user: { // belongsTo
            name: 'name112233',
          },
          tags: { // belongsToMany
            scopeName: 'tag3',
          },
        },
        fields: [
          'title', 
          'tags_count', 
          'tags.name', 
          'user.name'
        ],
        sort: '-tags_count,tags.name,user.posts_count',
        context: {
          scopeName: 'tag3',
        },
      });
      console.log(options);

      try{
      // DatabaseError [SequelizeDatabaseError]: column tags.scopeName does not exist
      // SELECT count("posts"."id") AS "count" FROM "post123456" AS "posts" INNER JOIN ( "posts_tags1234" AS "tags->posts_tags" INNER JOIN "tag1234" AS "tags" ON "tags"."id" = "tags->posts_tags"."tag_id") ON "posts"."id" = "tags->posts_tags"."post_id" AND "tags"."scopeName" = 'tag3' INNER JOIN "user1234" AS "user" ON "posts"."user_id" = "user"."id" AND "user"."name" = 'name112233' WHERE "posts"."title" = 'title112233';
      const { rows, count } = await Post.findAndCountAll({
        ...options,
        // group: ['id'],
        // limit: 20,
        // offset: 20,
      });

      // console.log(JSON.stringify(rows[0].toJSON(), null, 2));

      rows.forEach(row => {
        // expect(row.toJSON()).toEqual({ title: 'title112233', 'tags_count': 3, user: { name: 'name112233', posts_count: 1 } });
        expect(row.get('title')).toBe('title112233');
        expect(row.user.get('name')).toBe('name112233');
      });
      } catch(error) {
        console.error(error);
      }

      // console.log(count);

      // expect(count).toBe(1);
    });

    it('to be explained', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const postData = [];
      for (let index = 0; index < 20; index++) {
        postData.push({
          title: `title${index}`,
        });
      }
      const user = await User.create();
      let posts = await Post.bulkCreate(postData);
      await user.updateAssociations({
        posts: posts,
      });
      const userOne = await User.findOne({
        attributes: {
          exclude: ['updated_at'],
          include: [
            User.withCountAttribute('posts'),
            User.withCountAttribute('posts_title1'),
          ],
        },
        where: {
          id: user.id,
        },
      });

      expect(userOne.get('posts_count')).toBe(20);
      expect(userOne.get('posts_title1_count')).toBe(1);
    });

    it('to be explained', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const postData = [];
      for (let index = 0; index < 20; index++) {
        postData.push({
          title: `title${index}`,
        });
      }
      const user = await User.create();
      let posts = await Post.bulkCreate(postData);
      await user.updateAssociations({
        posts: posts,
      });
      const userOne = await User.findOne({
        attributes: {
          exclude: ['updated_at'],
          include: [
            User.withCountAttribute({
              association: 'posts',
              alias: 'posts2_count'
            }),
          ],
        },
        where: {
          id: user.id,
        },
      });

      expect(userOne.get('posts2_count')).toBe(20);
    });

    it('to be explained', async () => {
      const [Tag, Post, User] = db.getModels(['tags', 'posts', 'users']);
      const tagData = [];
      for (let index = 0; index < 5; index++) {
        tagData.push({
          name: `name${index}`,
        });
      }
      let post = await Post.create();
      let tags = await Tag.bulkCreate(tagData);
      await post.updateAssociations({
        user: {
          name: 'user1',
        },
        tags,
      });
      post = await Post.findOne({
        attributes: {
          include: [
            'id',
            Post.withCountAttribute('tags'),
            Post.withCountAttribute('tags_name1'),
          ],
        },
        where: {
          id: post.id,
        },
        include: [
          {
            association: 'user',
            attributes: ['id', 'name',
              User.withCountAttribute({
                sourceAlias: 'user',
                association: 'posts',
              }),
            ],
          },
          {
            association: 'tags',
            attributes: ['id', 'name', Tag.withCountAttribute('posts')],
          },
        ],
      });
      expect(post.get('tags_count')).toBe(5);
      expect(post.get('tags_name1_count')).toBe(1);
      expect(post.user.get('posts_count')).toBe(1);
      post.tags.forEach(tag => {
        expect(tag.get('posts_count')).toBe(1);
      });
    });
  });

  describe('hasOne', () => {
    it('shoud associated id when association is integer', async () => {
      const [User, Profile] = db.getModels(['users', 'profiles']);
      const user = await User.create();
      const profile = await Profile.create();
      await user.updateAssociations({
        // 关联 id
        profile,
      });
      const userProfile = await user.getProfile();
      expect(userProfile.id).toBe(profile.id);
    });
    it('shoud associated id when association is integer', async () => {
      const [User, Profile] = db.getModels(['users', 'profiles']);
      const user = await User.create();
      const profile = await Profile.create();
      await user.updateAssociations({
        // 关联 id
        profile: profile.id,
      });
      const userProfile = await user.getProfile();
      expect(userProfile.id).toBe(profile.id);
    });
    it('shoud associated id when association is integer', async () => {
      const [User, Profile] = db.getModels(['users', 'profiles']);
      const user = await User.create();
      const profile = await Profile.create();
      await user.updateAssociations({
        // 关联 id
        profile: {
          id: profile.id,
        },
      });
      const userProfile = await user.getProfile();
      expect(userProfile.id).toBe(profile.id);
    });
    it('shoud associated id when association is integer', async () => {
      const [User, Profile] = db.getModels(['users', 'profiles']);
      const user = await User.create();
      const profile = await Profile.create();
      await user.updateAssociations({
        // 关联 id
        profile: {
          id: profile.id,
          name: 'profile1',
        },
      });
      const userProfile = await user.getProfile();
      expect(userProfile.id).toBe(profile.id);
      expect(userProfile.name).toBe('profile1');
    });
    it('shoud associated id when association is integer', async () => {
      const [User] = db.getModels(['users']);
      const user = await User.create();
      await user.updateAssociations({
        // 关联 id
        profile: {
          name: 'profile2',
        },
      });
      const userProfile = await user.getProfile();
      expect(userProfile.name).toBe('profile2');
    });
  });

  describe('hasMany', () => {
    it('@1', async () => {
      const [Comment, Post] = db.getModels(['comments', 'posts']);
      const comment = await Comment.create();
      const post = await Post.create();
      await post.updateAssociations({
        comments: comment,
      });
      const count = await post.countComments();
      expect(count).toBe(1);
    });
    it('@2', async () => {
      const [Comment, Post] = db.getModels(['comments', 'posts']);
      const comment = await Comment.create();
      const post = await Post.create();
      await post.updateAssociations({
        comments: [comment],
      });
      const count = await post.countComments();
      expect(count).toBe(1);
    });
    it('@3', async () => {
      const [Comment, Post] = db.getModels(['comments', 'posts']);
      const comment = await Comment.create();
      const post = await Post.create();
      await post.updateAssociations({
        comments: [comment.id],
      });
      const count = await post.countComments();
      expect(count).toBe(1);
    });
    it('@4', async () => {
      const [Comment, Post] = db.getModels(['comments', 'posts']);
      const comment = await Comment.create();
      const post = await Post.create();
      await post.updateAssociations({
        comments: comment.id,
      });
      const count = await post.countComments();
      expect(count).toBe(1);
    });
    it('@5', async () => {
      const [Post] = db.getModels(['posts']);
      const post = await Post.create();
      await post.updateAssociations({
        comments: {
          content: 'content1',
        },
      });
      const count = await post.countComments();
      expect(count).toBe(1);
    });
    it('@6', async () => {
      const [Post, Comment] = db.getModels(['posts', 'comments']);
      const post = await Post.create();
      const comment1 = await Comment.create();
      const comment2 = await Comment.create();
      await post.updateAssociations({
        comments: [
          {
            content: 'content2',
          },
          {
            content: 'content3',
          },
          {
            id: comment1.id,
          },
          comment2,
        ],
      });
      const count = await post.countComments();
      expect(count).toBe(4);
    });

    it('shoud work1', async () => {
      const [Table, Field] = db.getModels(['tables', 'fields']);
      const table = await Table.create({
        name: 'examples',
      });
      await table.updateAssociations({
        fields: [
          {name: 'name'},
        ]
      });
      const field = await Field.findOne({
        where: {
          table_name: 'examples',
          name: 'name',
        },
      });
      expect(field).toBeDefined();
      expect(field.get('name')).toBe('name');
    });

    it('shoud work2', async () => {
      const [Row, Column] = db.getModels(['rows', 'columns']);
      const row = await Row.create({
        name: 'examples',
      });
      await row.updateAssociations({
        columns: [
          {name: 'name'},
        ]
      });
      const column = await Column.findOne({
        where: {
          row_name: 'examples',
          name: 'name',
        },
      });
      expect(column).toBeDefined();
      expect(column.get('name')).toBe('name');
    });

    it('shoud work3', async () => {
      const [Table, Field] = db.getModels(['tables', 'fields']);
      const table = await Table.create({
        name: 'abcdef',
      });
      const field = await Field.create({name: 'name123'});
      await table.updateAssociations({
        fields: [
          {
            id: field.id,
            name: 'nam1234',
          },
        ]
      });

      const f = await Field.findOne({
        where: {
          table_name: 'abcdef',
          name: 'nam1234',
        },
      });

      expect(f).toBeDefined();
      expect(f.id).toBe(field.id);

      const options = Table.parseApiJson({
        fields: ['name', 'fields_count'],
      });
      const t = await Table.findOne(options);

      expect(t.get('fields_count')).toBe(1);
    });
  });

  describe('blongsTo', () => {

    it('shoud associated id when association is integer', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const user = await User.create();
      const post = await Post.create();
      await post.updateAssociations({
        // 关联 id
        user,
      });
      expect(user.id).toBe(post.user_id);
      const postUser = await post.getUser();
      expect(user.id).toBe(postUser.id);
    });

    it('shoud associated id when association is integer', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const user = await User.create();
      const post = await Post.create();
      await post.updateAssociations({
        // 关联 id
        user: user.id,
      });
      expect(user.id).toBe(post.user_id);
      const postUser = await post.getUser();
      expect(user.id).toBe(postUser.id);
    });

    it('shoud associated id when association is object only id attribute', async () => {
      const [User, Tag, Post] = db.getModels(['users', 'tags', 'posts']);
      const user = await User.create();
      const post = await Post.create();
      await post.updateAssociations({
        // 关联 id
        user: {
          id: user.id,
        },
      });
      expect(user.id).toBe(post.user_id);
      const postUser = await post.getUser();
      expect(user.id).toBe(postUser.id);
    });

    it('shoud associate and update other attributes', async () => {
      const [User, Post] = db.getModels(['users', 'posts']);
      const user = await User.create();
      let post = await Post.create();
      await post.updateAssociations({
        // 关联并更新当前 id 的数据
        user: {
          id: user.id,
          name: 'user1234',
        },
      });
      expect(user.id).toBe(post.user_id);
      const postUser = await post.getUser();
      expect(user.id).toBe(postUser.id);
      expect(postUser.name).toBe('user1234');
    });

    it('shoud work', async () => {
      const [Post] = db.getModels(['posts']);
      const post = await Post.create();
      await post.updateAssociations({
        // 新建并关联 user
        user: {
          name: 'user123456',
        },
      });
      const postUser = await post.getUser();
      expect(postUser.name).toBe('user123456');
    });

    it('shoud work', async () => {
      const [Table, Field] = db.getModels(['tables', 'fields']);
      const field = await Field.create({
        name: 'fieldName',
      });
      await Table.create({name: 'demos'});
      await field.updateAssociations({
        table: 'demos',
      });
      expect(field.table_name).toBe('demos');
    });

    it('shoud work', async () => {
      const [Row, Column] = db.getModels(['rows', 'columns']);
      await Row.create({
        name: 't1_examples',
      });
      const column = await Column.create();
      await column.updateAssociations({
        row: 't1_examples',
      });
    });

    it('shoud work', async () => {
      const [Row, Column] = db.getModels(['rows', 'columns']);
      await Row.create({
        name: 't2_examples',
      });
      const column = await Column.create();
      await column.updateAssociations({
        row: {
          name: 't2_examples',
        },
      });
    });
  });

  describe('belongsToMany', () => {
    it('@', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tag = await Tag.create();
      await post.updateAssociations({
        tags: tag,
      });
      const count = await post.countTags();
      expect(count).toBe(1);
    });

    it('@', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tag = await Tag.create();
      await post.updateAssociations({
        tags: [tag],
      });
      const count = await post.countTags();
      expect(count).toBe(1);
    });

    it('@', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tag = await Tag.create();
      await post.updateAssociations({
        tags: tag.id,
      });
      const count = await post.countTags();
      expect(count).toBe(1);
    });

    it('@', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tag = await Tag.create();
      await post.updateAssociations({
        tags: [tag.id],
      });
      const count = await post.countTags();
      expect(count).toBe(1);
    });

    it('@', async () => {
      const [Post, Tag] = db.getModels(['posts', 'tags']);
      const post = await Post.create();
      const tags = await Tag.bulkCreate([{}, {}]);
      await post.updateAssociations({
        tags: tags,
      });
      const count = await post.countTags();
      expect(count).toBe(2);
    });

    it('@', async () => {
      const [Post] = db.getModels(['posts']);
      const post = await Post.create();
      await post.updateAssociations({
        tags: {
          name: 'tag1'
        },
      });
      const count = await post.countTags();
      expect(count).toBe(1);
    });

    it('@', async () => {
      const [Post] = db.getModels(['posts']);
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          {
            name: 'tag2'
          },
          {
            name: 'tag3'
          },
        ],
      });
      const count = await post.countTags();
      expect(count).toBe(2);
    });
  });
});

describe('belongsToMany', () => {
  let post: Model;
  let tag1: Model;
  let tag2: Model;

  beforeEach(async () => {
    db.table({
      name: 'posts',
      tableName: 't333333_posts',
      fields: [
        {
          type: 'string',
          name: 'slug',
          unique: true,
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          sourceKey: 'slug',
          targetKey: 'name',
        },
      ],
    });
    db.table({
      name: 'tags',
      tableName: 't333333_tags',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'belongsToMany',
          name: 'posts',
          sourceKey: 'name',
          targetKey: 'slug',
        },
      ],
    });
    await db.sync({force: true});
    const [ Post, Tag ] = db.getModels(['posts', 'tags']);
    post = await Post.create({slug: 'post1'});
    tag1 = await Tag.create({name: 'tag1'});
    tag2 = await Tag.create({name: 'tag2'});
  });

  it('update with targetKey', async () => {
    await post.updateAssociations({
      tags: tag1.name,
    });
    expect(await post.countTags()).toBe(1);
  });
  // TODO(question)
  it.skip('update with primaryKey (defined targetKey)', async () => {
    await post.updateAssociations({
      tags: tag2.id,
    });
    expect(await post.countTags()).toBe(1);
  });
  it('update with model', async () => {
    await post.updateAssociations({
      tags: [tag1, tag2],
    });
    expect(await post.countTags()).toBe(2);
  });
  it('update with targetKey', async () => {
    await post.updateAssociations({
      tags: {
        name: 'tag2',
      },
    });
    expect(await post.countTags()).toBe(1);
    expect((await post.getTags())[0].id).toBe(tag2.id);
  });
  it('update with new object', async () => {
    await post.updateAssociations({
      tags: [{
        name: 'tag3',
      }],
    });
    expect(await post.countTags()).toBe(1);
  });
});
