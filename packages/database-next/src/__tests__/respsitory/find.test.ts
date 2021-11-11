import { mockDatabase } from '../index';
import Database from '@nocobase/database';
import { Collection } from '../../collection';
import { string } from '@nocobase/client/lib/schemas/database-field/interfaces/string';
import { OptionsParser } from '../../optionsParser';

describe('repository find', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  beforeEach(async () => {
    const db = mockDatabase();
    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
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

    Comment = db.collection({
      name: 'comment',
      field: [
        { type: string, name: 'content' },
        { type: 'belongsTo', name: 'post' },
      ],
    });

    await db.sync();
    const repository = User.repository;

    await repository.createMany([
      { name: 'u1', age: 10, posts: [{ title: 'u1t1', comments: ['u1t1c1'] }] },
      { name: 'u2', age: 20, posts: [{ title: 'u2t1', comments: ['u2t1c1'] }] },
      { name: 'u3', age: 30, posts: [{ title: 'u3t1', comments: ['u3t1c1'] }] },
    ]);
  });

  describe('option parser', () => {
    test('with sort option', () => {
      let options: any = {
        sort: ['id'],
      };

      let parser = new OptionsParser(User, options);
      let params = parser.toSequelizeParams();
      expect(params['order']).toEqual([['id', 'ASC']]);

      options = {
        sort: ['id', '-posts.title', 'posts.comments.createdAt'],
      };

      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();
      expect(params['order']).toEqual([
        ['id', 'ASC'],
        ['posts', 'title', 'DESC'],
        ['posts', 'comments', 'createdAt', 'ASC'],
      ]);
    });

    test('option parser with fields option', async () => {
      let options: any = {
        fields: ['id', 'posts'],
      };
      // 转换为 attributes: ['id'], include: [{association: 'posts'}]
      let parser = new OptionsParser(User, options);
      let params = parser.toSequelizeParams();

      expect(params['attributes']).toContain('id');
      expect(params['include'][0]['association']).toEqual('posts');

      // only appends
      options = {
        appends: ['posts'],
      };

      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();
      expect(params['attributes']['include']).toEqual([]);
      expect(params['include'][0]['association']).toEqual('posts');

      // fields with association field
      options = {
        fields: ['id', 'posts.title'],
      };

      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();
      expect(params['attributes']).toContain('id');
      expect(params['include'][0]['association']).toEqual('posts');
      expect(params['include'][0]['attributes']).toContain('title');

      // fields with nested field
      options = {
        fields: ['id', 'posts', 'posts.comments.content'],
      };

      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();
      expect(params['attributes']).toContain('id');
      expect(params['include'][0]['association']).toEqual('posts');
      expect(params['include'][0]['attributes']).toEqual({ include: [] });
      expect(params['include'][0]['include'][0]['association']).toEqual(
        'comments',
      );

      // fields with expect
      options = {
        expect: ['id'],
      };
      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();
      expect(params['attributes']['exclude']).toContain('id');

      // expect with association
      options = {
        fields: ['posts'],
        expect: ['posts.id'],
      };

      parser = new OptionsParser(User, options);
      params = parser.toSequelizeParams();

      expect(params['include'][0]['attributes']['exclude']).toContain('id');
    });
  });

  describe('find', () => {
    test('find with logic or', async () => {
      const users = await User.repository.find({
        filter: {
          $or: [{ 'posts.title': 'u1t1' }, { 'posts.title': 'u2t1' }],
        },
      });

      expect(users['count']).toEqual(2);
    });
    test('find one with attribute', async () => {
      const user = await User.repository.findOne({
        filter: {
          name: 'u2',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find one with relation', async () => {
      const user = await User.repository.findOne({
        filter: {
          'posts.title': 'u2t1',
        },
      });
      expect(user['name']).toEqual('u2');
    });

    test('find with fields', async () => {
      let user = await User.repository.findOne({
        fields: ['name'],
      });

      expect(user['name']).toBeDefined();
      expect(user['age']).toBeUndefined();
      expect(user['posts']).toBeUndefined();

      user = await User.repository.findOne({
        fields: ['name', 'posts'],
      });

      expect(user['posts']).toBeDefined();
    });

    describe('find with appends', () => {
      test('filter attribute', async () => {
        const user = await User.repository.findOne({
          filter: {
            name: 'u1',
          },
          appends: ['posts'],
        });

        expect(user['posts']).toBeDefined();
      });

      test('filter association attribute', async () => {
        const user2 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
          appends: ['posts'],
        });
        expect(user2['posts']).toBeDefined();
      });

      test('without appends', async () => {
        const user3 = await User.repository.findOne({
          filter: {
            'posts.title': 'u1t1',
          },
        });

        expect(user3['posts']).toBeUndefined();
      });
    });

    test('find all', async () => {
      expect((await User.repository.find()).rows.length).toEqual(3);
    });

    test('find with filter', async () => {
      const results = await User.repository.find({
        filter: {
          name: 'u1',
        },
      });

      expect(results.count).toEqual(1);
    });

    test('find with association', async () => {
      const results = await User.repository.find({
        filter: {
          'posts.title': 'u1t1',
        },
      });

      expect(results.count).toEqual(1);
    });
  });
  describe('count', () => {
    test('without filter params', async () => {
      expect(await User.repository.count()).toEqual(3);
    });

    test('with filter params', async () => {
      expect(
        await User.repository.count({
          name: 'u1',
        }),
      ).toEqual(1);
    });
  });
});
