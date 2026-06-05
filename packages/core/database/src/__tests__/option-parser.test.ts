/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, createMockDatabase, Database } from '@nocobase/database';
import { OptionsParser } from '../options-parser';
import qs from 'qs';

describe('option parser', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
    User = db.collection<{ id: number; name: string }, { name: string }>({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
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
        {
          type: 'hasMany',
          name: 'comments',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
        },
      ],
    });

    Comment = db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        { type: 'belongsTo', name: 'posts' },
      ],
    });

    Tag = db.collection({
      name: 'tags',
      fields: [{ type: 'string', name: 'name' }],
    });
    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('fields with association', () => {
    const options: any = {
      fields: ['id', 'name', 'tags.id', 'tags.name'],
    };

    const parser = new OptionsParser(options, {
      collection: Post,
    });

    const params = parser.toSequelizeParams();

    expect(params).toMatchObject({
      attributes: ['id', 'name'],
      include: [
        {
          association: 'tags',
          attributes: ['id', 'name'],
          options: {},
        },
      ],
    });
  });

  test('with sort option', () => {
    if (db.inDialect('mysql', 'mariadb')) {
      expect(1).toBe(1);
      return;
    }
    let options: any = {
      sort: ['id'],
    };

    let parser = new OptionsParser(options, {
      collection: User,
    });
    let params = parser.toSequelizeParams();
    expect(params['order']).toEqual([['id', 'ASC NULLS LAST']]);

    options = {
      sort: ['id', '-posts.title', 'posts.comments.createdAt'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['order']).toEqual([
      ['id', 'ASC NULLS LAST'],
      [Post.model, 'title', 'DESC NULLS LAST'],
      [Post.model, Comment.model, 'createdAt', 'ASC NULLS LAST'],
    ]);
  });

  describe('options parser with fields option', () => {
    it('should handle field and association', () => {
      const options: any = {
        fields: ['id', 'posts'],
      };

      // 转换为 attributes: ['id'], include: [{association: 'posts'}]
      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();

      console.log(params);
      expect(params['attributes']).toContain('id');
      expect(params['include'][0]['association']).toEqual('posts');
    });

    it('should support append with options', () => {
      const options = {
        appends: ['posts(recursively=true)'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const { include } = parser.toSequelizeParams();

      expect(include[0].association).toEqual('posts');
      expect(include[0].association);
      expect(include[0].options.recursively).toBeTruthy();
    });

    it('should ignore invalid entries when appends comes from query parser object', () => {
      const options: any = {
        appends: {
          0: 'posts',
          1: null,
          2: { foo: 'bar' },
          3: 'posts.comments',
        },
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      expect(params.include).toHaveLength(1);
      expect(params.include?.[0]?.association).toEqual('posts');
      expect(params.include?.[0]?.include?.[0]?.association).toEqual('comments');
    });

    it('should handle real query strings that contain more than 20 appends', () => {
      const appendValues = [
        'posts',
        'posts.title',
        'posts.user',
        'posts.user.name',
        'posts.user.age',
        'posts.user.posts',
        'posts.user.posts.title',
        'posts.user.posts.comments',
        'posts.user.posts.comments.content',
        'posts.user.posts.comments.posts',
        'posts.user.posts.comments.posts.user',
        'posts.user.posts.tags',
        'posts.user.posts.tags.name',
        'posts.comments',
        'posts.comments.content',
        'posts.comments.posts',
        'posts.comments.posts.user',
        'posts.comments.posts.comments',
        'posts.comments.posts.tags',
        'posts.comments.posts.tags.name',
        'posts.tags',
        'posts.tags.name',
      ];
      const query = appendValues.map((value) => `appends[]=${encodeURIComponent(value)}`).join('&');

      const options: any = {
        appends: qs.parse(query).appends,
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      const postsInclude = params.include?.find((item) => item.association === 'posts');
      expect(postsInclude).toBeTruthy();
      const nestedUser = postsInclude?.include?.find((item) => item.association === 'user');
      const nestedComments = postsInclude?.include?.find((item) => item.association === 'comments');
      const nestedTags = postsInclude?.include?.find((item) => item.association === 'tags');
      expect(nestedUser).toBeTruthy();
      expect(nestedComments).toBeTruthy();
      expect(nestedTags).toBeTruthy();
    });

    it('should handle field with association', () => {
      const options = {
        appends: ['posts'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });
      const params = parser.toSequelizeParams();

      expect(params['attributes']['include']).toEqual([]);
      expect(params['include'][0]['association']).toEqual('posts');
    });

    it('should handle field with association field', () => {
      // fields with association field
      const options = {
        fields: ['id', 'posts.title'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      expect(params['attributes']).toContain('id');
      expect(params['include'][0]['association']).toEqual('posts');
      expect(params['include'][0]['attributes']).toContain('title');
    });

    it('should handle nested fields option', () => {
      const options = {
        fields: ['posts', 'posts.title'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      const postAssociationParams = params['include'][0];
      expect(postAssociationParams['attributes']).toEqual({ include: [] });
    });

    it('should handle fields with association & association field', () => {
      // fields with nested field
      const options = {
        fields: ['id', 'posts', 'posts.comments.content'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      const postAssociationParams = params['include'][0];

      expect(params['attributes']).toContain('id');
      expect(postAssociationParams['association']).toEqual('posts');
      expect(postAssociationParams['attributes']).toEqual({ include: [] });
      expect(postAssociationParams['include'][0]['association']).toEqual('comments');
    });

    it('should handle except option', () => {
      // fields with expect
      const options = {
        except: ['id'],
      };
      const parser = new OptionsParser(options, {
        collection: User,
      });

      const params = parser.toSequelizeParams();
      expect(params['attributes']['exclude']).toContain('id');
    });

    it('should handle fields with except option', () => {
      // expect with association
      const options = {
        fields: ['posts'],
        except: ['posts.id'],
      };

      const parser = new OptionsParser(options, {
        collection: User,
      });
      const params = parser.toSequelizeParams();

      expect(params['include'][0]['attributes']['exclude']).toContain('id');
    });
  });

  test('option parser with multiple association', () => {
    // fields with association field
    const options = {
      appends: ['user', 'comments.id', 'tags.id'],
    };

    const parser = new OptionsParser(options, {
      collection: Post,
    });

    const params = parser.toSequelizeParams();
    expect(params.include.length).toBe(3);
    expect(params.include[0].association).toBe('user');
    expect(params.include[1].association).toBe('comments');
    expect(params.include[1].attributes).toEqual(['id']);
    expect(params.include[2].association).toBe('tags');
    expect(params.include[2].attributes).toEqual(['id']);
  });
});
