import { Op } from 'sequelize';

import { initDatabase, agent } from './index';

describe('list', () => {
  let db;
  let now: string;
  let timestamps: { created_at: string; updated_at: string; };
  
  beforeEach(async () => {
    db = await initDatabase();
    now = (new Date()).toISOString();
    timestamps = { created_at: now, updated_at: now };
  });
  
  afterAll(() => db.close());

  describe('common', () => {
    beforeEach(async () => {
      const User = db.getModel('users');
      await User.bulkCreate([
        { name: 'a', ...timestamps },
        { name: 'b', ...timestamps },
        { name: 'c', ...timestamps }
      ]);
      const users = await User.findAll();

      const Post = db.getModel('posts');
      await Post.bulkCreate(Array(25).fill(null).map((_, index) => ({
        title: `title${index}`,
        status: index % 2 ? 'published' : 'draft',
        published_at: index % 2 ? new Date(2020, 10, 30 - index, 0, 0, 0) : null,
        user_id: users[index % users.length].id,
        ...timestamps
      })));
    });

    describe('filter', () => {
      describe('equal', () => {
        it('should be filtered by `status` equal to `published`', async () => {
          const Post = db.getModel('posts');
          const response = await agent.get('/posts?filter[status]=published');
          expect(response.body.count).toBe(await Post.count({ where: { status: 'published' } }));
        });
      
        it('should be filtered by `title` equal to `title1`', async () => {
          const Post = db.getModel('posts');
          const response = await agent.get('/posts?filter[title]=title1');
          expect(response.body.count).toBe(await Post.count({
            where: {
              title: 'title1',
            },
          }));
        });
      });

      describe('not equal', () => {
        it('filter[status][ne]=published', async () => {
          const Post = db.getModel('posts');
          const drafts = (await Post.findAll({
            where: {
              status: {
                [Op.ne]: 'published'
              }
            }
          })).map(item => item.get('title'));
          const response = await agent.get('/posts?filter[status][ne]=published');
          expect(response.body.count).toBe(drafts.length);
          expect(response.body.rows[0].title).toBe(drafts[0]);
        });
      });

      describe('null', () => {
        it('filter[published_at]', async () => {
          const Post = db.getModel('posts');
          const expected = await Post.findAll({
            where: {
              published_at: null
            }
          });
          const response = await agent.get('/posts?filter[published_at]');
          expect(response.body.count).toBe(expected.length);
        });

        it('filter[published_at.is]', async () => {
          const Post = db.getModel('posts');
          const expected = await Post.findAll({
            where: {
              published_at: {
                [Op.is]: null
              }
            }
          });
          const response = await agent.get('/posts?filter[published_at.is]');
          expect(response.body.count).toBe(expected.length);
        });

        it('filter[published_at.not]', async () => {
          const Post = db.getModel('posts');
          const expected = await Post.findAll({
            where: {
              published_at: {
                [Op.not]: null
              }
            }
          });
          const response = await agent.get('/posts?filter[published_at.not]');
          expect(response.body.count).toBe(expected.length);
        });

        // TODO(bug): should use `user.is`
        it('filter[user_id.is]', async () => {
          const Post = db.getModel('posts');
          const expected = await Post.findAll({
            where: {
              user_id: {
                [Op.is]: null
              }
            }
          });
          const response = await agent.get('/posts?filter[user_id.is]');
          expect(response.body.count).toBe(expected.length);
        });
      });
    });

    describe('page', () => {
      it('default page and size(20) should be ok', async () => {
        const response = await agent.get('/posts?fields=title');
        expect(response.body).toEqual({
          count: 25,
          page: 1,
          per_page: 20,
          rows: Array(20).fill(null).map((_, index) => ({ title: `title${index}` })),
        });
      });
    
      it('page 1 by size(1) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=1&perPage=1');
        expect(response.body).toEqual({
          count: 25,
          page: 1,
          per_page: 1,
          rows: [ { title: 'title0' } ],
        });
      });
    
      it('page 2 by size(1) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=2&per_page=1');
        expect(response.body).toEqual({
          count: 25,
          page: 2,
          per_page: 1,
          rows: [ { title: 'title1' } ],
        });
      });
    
      it('page 1 by size(101) should be change to 100', async () => {
        const response = await agent.get('/posts?fields=title&page=1&per_page=101');
        expect(response.body).toEqual({
          count: 25,
          page: 1,
          per_page: 100,
          rows: Array(25).fill(null).map((_, index) => ({ title: `title${index}` })),
        });
      });
    
      it('page 2 by size(101) should be change to 100 and result is empty', async () => {
        const response = await agent.get('/posts?fields=title&page=2&per_page=101');
        expect(response.body).toEqual({
          count: 25,
          page: 2,
          per_page: 100,
          rows: [],
        });
      });
    
      it('default page by size(-1) should be change to 100 and result will be 25 items', async () => {
        const response = await agent.get('/posts?fields=title&per_page=-1');
        expect(response.body).toEqual({
          count: 25,
          page: 1,
          per_page: 100,
          rows: Array(25).fill(null).map((_, index) => ({ title: `title${index}` })),
        });
      });
    
      it('page 2 by size(-1) should be change to 100 and result is empty', async () => {
        const response = await agent.get('/posts?fields=title&page=2&per_page=-1');
        expect(response.body).toEqual({
          count: 25,
          page: 2,
          per_page: 100,
          rows: [],
        });
      });
    });
  
    describe('fields', () => {
      it('custom field', async () => {
        const response = await agent.get('/posts?fields=title&filter[customTitle]=title0');
        expect(response.body).toEqual({
          count: 1,
          page: 1,
          per_page: 20,
          rows: [ { title: 'title0' } ]
        });
      });

      it('self field and belongs to field', async () => {
        const response = await agent.get('/posts?fields=title,user.name&filter[title]=title0');
        expect(response.body).toEqual({
          count: 1,
          page: 1,
          per_page: 20,
          rows: [
            {
              title: 'title0',
              user: {
                name: 'a'
              }
            }
          ]
        });
      });

      // TODO(question): 当 fields 只填写了关联字段时，当前表的其他字段是否需要输出？
      it.skip('only belongs to', async () => {
        const response = await agent.get('/posts?fields=user&filter[title]=title0');
        expect(response.body).toEqual({
          count: 1,
          rows: [
            {
              title: 'title0',
              user: { name: 'a' }
            }
          ]
        });
      });

      it('except fields', async () => {
        const response = await agent.get('/posts?fields[except]=status&filter[title]=title0');
        expect(response.body.rows[0].status).toBeUndefined();
      });

      it('only and except fields', async () => {
        const response = await agent.get('/posts?fields=title&fields[except]=status&filter[title]=title0');
        expect(response.body.rows[0].status).toBeUndefined();
        expect(response.body.rows).toEqual([{ title: 'title0' }]);
      });

      it('only with belongs to fields', async () => {
        const response = await agent.get('/posts?fields[only]=title&fields[only]=user.name&filter[title]=title0');
        expect(response.body.rows[0].user.name).toEqual('a');
        expect(response.body.rows).toEqual([{ title: 'title0', user: { name: 'a' } }]);
      });

      it('appends fields', async () => {
        const response = await agent.get('/posts?fields[only]=title&fields[appends]=user.name&filter[title]=title0');
        expect(response.body.rows[0].user.name).toEqual('a');
        expect(response.body.rows).toEqual([{ title: 'title0', user: { id: 1, name: 'a', ...timestamps } }]);
      });
    });
  });

  describe('hasMany', () => {
    beforeEach(async () => {
      const User = db.getModel('users');
      await User.bulkCreate([
        { name: 'a' },
        { name: 'b' },
        { name: 'c' }
      ]);
      const users = await User.findAll();
      const Post = db.getModel('posts');
      const post = await Post.create({ user_id: users[0].id });
      await post.updateAssociations({
        comments: Array(6).fill(null).map((_, index) => ({
          content: `content${index}`,
          status: index % 2 ? 'published' : 'draft',
          user_id: users[index % users.length].id
        }))
      });
    });

    it('get comments of a post', async () => {
      const Post = db.getModel('posts');
      const post = await Post.findByPk(1);
      const response = await agent
        .get(`/posts/${post.id}/comments?page=2&perPage=2&sort=content&fields=content&filter[published]=1`);
      expect(response.body).toEqual({
        rows: [ { content: 'content5' } ],
        count: 3,
        page: 2,
        per_page: 2
      });
    });

    it('get comments within a post, order by comments.content', async () => {
      const response = await agent
        .get('/posts?fields=title,comments.content&filter[comments.status]=draft&page=1&perPage=2&sort=-comments.content');
      expect(response.body).toEqual({
        rows: [{
          title: null,
          comments: [{ content: 'content4' }, { content: 'content2' }, { content: 'content0'}]
        }],
        count: 1,
        page: 1,
        per_page: 2
      });
    });

    it('get comments of a post, and user of each comment', async () => {
      const Post = db.getModel('posts');
      const post = await Post.findByPk(1);
      const response = await agent
        .get(`/posts/${post.id}/comments?fields=content,user.name&filter[status]=draft&sort=-content&page=1&perPage=2`);
      
      expect(response.body).toEqual({
        count: 3,
        page: 1,
        per_page: 2,
        rows: [
          { content: 'content4', user: { name: 'b' } },
          { content: 'content2', user: { name: 'c' } }
        ]
      });
    });

    // TODO(bug)
    it.skip('get posts of user with comments', async () => {
      const response = await agent
        .get(`/users/1/posts?fields=comments.content,user.name&filter[comments.status]=draft&sort=-content&page=1&perPage=2`);
      
      expect(response.body).toEqual({
        count: 1,
        page: 1,
        per_page: 2,
        rows: [
          {
            comments: [
              { content: 'content4' },
              { content: 'content2' }
            ],
            user: { name: 'a' }
          }
        ]
      });
    });
  });

  describe('belongsToMany', () => {
    beforeEach(async () => {
      const Post = db.getModel('posts');
      const post = await Post.create();
      await post.updateAssociations({
        tags: [
          {name: 'tag1', status: 'published'},
          {name: 'tag2', status: 'draft'},
          {name: 'tag3', status: 'published'},
          {name: 'tag4', status: 'draft'},
          {name: 'tag5', status: 'published'},
          {name: 'tag6', status: 'draft'},
          {name: 'tag7', status: 'published'},
        ],
      });
    });

    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.findByPk(1);
      const response = await agent
        .get(`/posts/${post.id}/tags?page=2&perPage=2&sort=-name&fields=name&filter[status]=published`);
      expect(response.body).toEqual({
        rows: [ { name: 'tag3' }, { name: 'tag1' } ],
        count: 4,
        page: 2,
        per_page: 2
      });
    });

    
  });

});
