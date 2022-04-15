import { Collection } from '../collection';
import { mockDatabase } from './index';
import { OptionsParser } from '../options-parser';
import { Database } from '../database';

describe('option parser', () => {
  let db: Database;
  let User: Collection;
  let Post: Collection;
  let Comment: Collection;
  let Tag: Collection;

  beforeEach(async () => {
    db = mockDatabase();

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
    let options: any = {
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
        },
      ],
    });
  });
  test('with sort option', () => {
    let options: any = {
      sort: ['id'],
    };

    let parser = new OptionsParser(options, {
      collection: User,
    });
    let params = parser.toSequelizeParams();
    expect(params['order']).toEqual([['id', 'ASC']]);

    options = {
      sort: ['id', '-posts.title', 'posts.comments.createdAt'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['order']).toEqual([
      ['id', 'ASC'],
      [Post.model, 'title', 'DESC'],
      [Post.model, Comment.model, 'createdAt', 'ASC'],
    ]);
  });

  test('option parser with fields option', async () => {
    let options: any = {
      fields: ['id', 'posts'],
    };
    // 转换为 attributes: ['id'], include: [{association: 'posts'}]
    let parser = new OptionsParser(options, {
      collection: User,
    });
    let params = parser.toSequelizeParams();

    expect(params['attributes']).toContain('id');
    expect(params['include'][0]['association']).toEqual('posts');

    // only appends
    options = {
      appends: ['posts'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['attributes']['include']).toEqual([]);
    expect(params['include'][0]['association']).toEqual('posts');

    // fields with association field
    options = {
      fields: ['id', 'posts.title'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['attributes']).toContain('id');
    expect(params['include'][0]['association']).toEqual('posts');
    expect(params['include'][0]['attributes']).toContain('title');

    // fields with nested field
    options = {
      fields: ['id', 'posts', 'posts.comments.content'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['attributes']).toContain('id');
    expect(params['include'][0]['association']).toEqual('posts');
    expect(params['include'][0]['attributes']).toEqual({ include: [] });
    expect(params['include'][0]['include'][0]['association']).toEqual('comments');

    // fields with expect
    options = {
      except: ['id'],
    };
    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();
    expect(params['attributes']['exclude']).toContain('id');

    // expect with association
    options = {
      fields: ['posts'],
      except: ['posts.id'],
    };

    parser = new OptionsParser(options, {
      collection: User,
    });
    params = parser.toSequelizeParams();

    expect(params['include'][0]['attributes']['exclude']).toContain('id');
  });
});
