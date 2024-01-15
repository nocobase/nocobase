import { Collection } from '../collection';
import { Database } from '../database';
import { OptionsParser } from '../options-parser';
import { mockDatabase } from './index';

describe('option parser', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;

  beforeEach(async () => {
    db = mockDatabase();
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

    expect(params).toEqual({
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
