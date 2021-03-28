import { literal, Op } from 'sequelize';

import { initDatabase, agent } from './index';

describe('list', () => {
  let db;
  let now: Date;
  let nowString: string;
  let timestamps: { created_at: Date; updated_at: Date; };
  let timestampsStrings;

  beforeEach(async () => {
    db = await initDatabase();
    now = new Date();
    nowString = now.toISOString()
    timestamps = { created_at: now, updated_at: now };
    timestampsStrings = { created_at: nowString, updated_at: nowString };
  });

  afterAll(() => db.close());

  describe('common', () => {
    beforeEach(async () => {
      const User = db.getModel('users');
      await User.bulkCreate([
        { name: 'a', ...timestamps, nicknames: ['aa', 'aaa'] },
        { name: 'b', ...timestamps, nicknames: [] },
        { name: 'c', ...timestamps }
      ]);
      const users = await User.findAll();
      users[0].updateSingleAssociation('profile', { city: '1101', interest: [1] });
      users[1].updateSingleAssociation('profile', { city: '3710', interest: [1, 2] });
      users[2].updateSingleAssociation('profile', { city: '5301', interest: [] });

      const Post = db.getModel('posts');
      await Post.bulkCreate(Array(25).fill(null).map((_, index) => ({
        title: `title${index}`,
        status: index % 2 ? 'published' : 'draft',
        published_at: index % 2 ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - index, 0, 0, 0) : null,
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

      describe('merge params with action options', () => {
        it('plain key-value filter', async () => {
          const response = await agent.get('/posts:list1?filter[status]=draft');
          expect(response.body.count).toBe(0);
        });

        it('date filter', async () => {
          // const before1Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const before3Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
          const response = await agent.get(`/posts:list1?filter[published_at.gt]=${before3Days.toISOString()}`);
          expect(response.body.count).toBe(1);
          expect(response.body.rows[0].id).toBe(2);
        });
      });

      describe('custom ops', () => {
        it('$null', async () => {
          const Post = db.getModel('posts');
          const expected = await Post.findAll({
            where: {
              published_at: null
            }
          });
          const response = await agent.get('/posts?filter[published_at.$null]=');
          expect(response.body.count).toBe(expected.length);
        });

        describe('$anyOf', () => {
          describe('single', () => {
            // TODO(question): 是否应该用 in/notIn 来处理单项？
            // 或者单项存值也使用 JSON 类型也可以。
            it.skip('$anyOf', async () => {
              // const Profile = db.getModel('profiles');
              // const profiles = await Profile.findAll();
              const response = await agent.get('/profiles?filter[city.$anyOf]=Beijing,Weihai');
              console.log(response.body);
              // expect(response.body.count).toBe(2);
            });
          });

          describe('multiple', () => {
            it('$anyOf for 1 element in definition', async () => {
              const User = db.getModel('users');
              const expected = await User.findOne({
                where: {
                  nicknames: { [Op.contains]: 'aa' }
                }
              });
              const response = await agent.get('/users?filter[nicknames.$anyOf][]=aa');
              expect(response.body.count).toBe(1);
              expect(response.body.rows[0].name).toBe(expected.name);
            });

            it('$anyOf for all elements in definition', async () => {
              const User = db.getModel('users');
              const expected = await User.findOne({
                where: {
                  nicknames: {
                    [Op.or]: [
                      { [Op.contains]: 'aaa' },
                      { [Op.contains]: 'aa' }
                    ]
                  }
                }
              });
              const response = await agent.get('/users?filter[nicknames.$anyOf]=aaa,aa');
              expect(response.body.count).toBe(1);
              expect(response.body.rows[0].name).toBe(expected.name);
            });

            it('$anyOf for some element not in definition', async () => {
              const User = db.getModel('users');
              const expected = await User.findOne({
                where: {
                  nicknames: { [Op.or]: [{ [Op.contains]: ['aaa'] }, { [Op.contains]: ['a'] }] }
                }
              });
              const response = await agent.get('/users?filter[nicknames.$anyOf]=aaa,a');
              expect(response.body.count).toBe(1);
              expect(response.body.rows[0].name).toBe(expected.name);
            });

            it('$anyOf for no element', async () => {
              const User = db.getModel('users');
              const expected = await User.findAll();
              const response = await agent.get('/users?filter={"nicknames.$anyOf":[]}');
              expect(response.body.count).toBe(expected.length);
            });
          });
        });

        describe('$allOf', () => {
          it('$allOf for no element', async () => {
            const response = await agent.get('/users?filter={"nicknames.$allOf":[]}');
            expect(response.body.count).toBe(3);
          });

          it('$allOf for different element', async () => {
            const response = await agent.get('/users?filter[nicknames.$allOf]=a,aa');
            expect(response.body.count).toBe(0);
          });

          it('$allOf for less element', async () => {
            const response = await agent.get('/users?filter[nicknames.$allOf][]=aa&fields=name,nicknames');
            expect(response.body.count).toBe(1);
            expect(response.body.rows).toEqual([
              { name: 'a', nicknames: ['aa', 'aaa'] }
            ]);
          });

          it('$allOf for same element', async () => {
            const response = await agent.get('/users?filter[nicknames.$allOf]=aa,aaa&fields=name,nicknames');
            expect(response.body.count).toBe(1);
            expect(response.body.rows).toEqual([
              { name: 'a', nicknames: ['aa', 'aaa'] }
            ]);
          });

          it('$allOf for more element', async () => {
            const response = await agent.get('/users?filter[nicknames.$allOf]=a,aa,aaa');
            expect(response.body.count).toBe(0);
          });
        });

        // TODO(bug): 需要 toWhere 重构和操作符函数修改
        describe.skip('$noneOf', () => {
          it('$noneOf for no element', async () => {
            const response = await agent.get('/users?filter={"nicknames.$noneOf":[]}');
            expect(response.body.count).toBe(3);
          });

          it('$noneOf for different element', async () => {
            const User = db.getModel('users');
            const users = await User.findAll({
              where: {
                [Op.not]: {
                  // 不使用 or 包装两个同一个 col 的条件会被转化成 and，与官方文档不符
                  // WHERE NOT ("users"."nicknames" @> '"aa"' AND "users"."nicknames" @> '"a"')
                  [Op.or]: [
                    { nicknames: { [Op.contains]: 'aa' } },
                    { nicknames: { [Op.contains]: 'a' } },
                  ]
                }
              }
            });
            console.log(users);
            // const response = await agent.get('/users?filter[nicknames.$noneOf]=a,aa');
            // expect(response.body.count).toBe(2);
          });

          it('$noneOf for less element', async () => {
            const response = await agent.get('/users?filter[nicknames.$noneOf][]=aa&fields=name,nicknames');
            expect(response.body.count).toBe(2);
          });

          it('$noneOf for same element', async () => {
            const response = await agent.get('/users?filter[nicknames.$noneOf]=aa,aaa&fields=name,nicknames');
            expect(response.body.count).toBe(2);
          });

          it('$noneOf for more element', async () => {
            const response = await agent.get('/users?filter[nicknames.$noneOf]=a,aa,aaa');
            expect(response.body.count).toBe(2);
          });
        });

        describe('$match', () => {
          // TODO(bug)
          it.skip('$match for no element', async () => {
            const response = await agent.get('/users?filter={"nicknames.$match":[]}');
            expect(response.body.count).toBe(2);
          });

          it('$match for different element', async () => {
            const response = await agent.get('/users?filter[nicknames.$match]=a,aa');
            expect(response.body.count).toBe(0);
          });

          it('$match for less element', async () => {
            const response = await agent.get('/users?filter[nicknames.$match][]=aa&fields=name,nicknames');
            expect(response.body.count).toBe(0);
          });

          it('$match for same element', async () => {
            const response = await agent.get('/users?filter[nicknames.$match]=aa,aaa&fields=name,nicknames');
            expect(response.body.count).toBe(1);
          });

          it('$match for more element', async () => {
            const response = await agent.get('/users?filter[nicknames.$match]=a,aa,aaa');
            expect(response.body.count).toBe(0);
          });
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
          rows: [{ title: 'title0' }],
        });
      });

      it('page 2 by size(1) should be ok', async () => {
        const response = await agent.get('/posts?fields=title&page=2&per_page=1');
        expect(response.body).toEqual({
          count: 25,
          page: 2,
          per_page: 1,
          rows: [{ title: 'title1' }],
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
          rows: [{ title: 'title0' }]
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
        expect(response.body.rows).toEqual([{
          title: 'title0', user: { id: 1, nicknames: ['aa', 'aaa'], name: 'a', ...timestampsStrings }
        }]);
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
        rows: [{ content: 'content5' }],
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
          comments: [{ content: 'content4' }, { content: 'content2' }, { content: 'content0' }]
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
        .get(`/users/1/posts?fields=comments.content,user.name&filter[comments.status]=draft&sort=-comments.content&page=1&perPage=2`);

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

    it('count field in hasMany', async () => {
      try {
        const response = await agent
          .get(`/users/1?fields=name,posts_count`);
        console.log(response.body);
      } catch (err) {
        console.error(err);
      }
    });

    it('count field in hasMany', async () => {
      try {
        const response = await agent
          .get(`/users/1/posts?fields=title,comments_count`);
        console.log(response.body);
      } catch (err) {
        console.error(err);
      }
    });
  });

  describe('belongsToMany', () => {
    beforeEach(async () => {
      const Tag = db.getModel('tags');
      const tags = await Tag.bulkCreate([
        { name: 'tag1', status: 'published' },
        { name: 'tag2', status: 'draft' },
        { name: 'tag3', status: 'published' },
        { name: 'tag4', status: 'draft' },
        { name: 'tag5', status: 'published' },
        { name: 'tag6', status: 'draft' },
        { name: 'tag7', status: 'published' },
        { name: 'tag8', status: 'published' },
        { name: 'tag9', status: 'draft' },
        { name: 'tag10', status: 'published' },
      ]);
      const Post = db.getModel('posts');
      const [post1, post2] = await Post.bulkCreate([{}, {}]);
      await post1.updateAssociations({
        tags: [1, 2, 3, 4, 5, 6, 7]
      });
      await post2.updateAssociations({
        tags: [2, 5, 8]
      });
      const User = db.getModel('users');
      const user = await User.create();
      await user.updateAssociations({
        posts: [post1]
      });
    });

    it('list1', async () => {
      const Post = db.getModel('posts');
      const post = await Post.findByPk(1);
      const response = await agent
        .get(`/posts/${post.id}/tags?page=2&perPage=2&sort=-name&fields=name&filter[status]=published`);
      expect(response.body).toEqual({
        rows: [{ name: 'tag3' }, { name: 'tag1' }],
        count: 4,
        page: 2,
        per_page: 2
      });
    });

    // TODO(bug): SQL 报错
    it.skip('list2', async () => {
      const response = await agent
        .get(`/users/1/posts?fields=tags`);
      console.log(response.body);
    });
  });
});
