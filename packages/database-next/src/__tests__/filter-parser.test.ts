import { mockDatabase } from './index';
import FilterParser from '../filterParser';
import { Op } from 'sequelize';
import { Database } from '../database';

test('filter item by string', async () => {
  const database = mockDatabase();
  const UserCollection = database.collection({
    name: 'users',
    fields: [{ type: 'string', name: 'name' }],
  });

  await database.sync();

  const filterParser = new FilterParser(UserCollection, {
    name: 'hello',
  });

  const filterParams = filterParser.toSequelizeParams();

  expect(filterParams).toMatchObject({
    where: {
      name: 'hello',
    },
  });

  await database.close();
});

describe('filter by related', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'hasMany', name: 'posts' },
      ],
    });

    db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'hasMany',
          name: 'comments',
        },
      ],
    });

    db.collection({
      name: 'comments',
      fields: [
        { type: 'string', name: 'content' },
        {
          type: 'belongsTo',
          name: 'post',
        },
      ],
    });

    await db.sync();
  });

  afterEach(async () => {
    await db.close();
  });

  test('hasMany', async () => {
    const filter = {
      'posts.title.$iLike': '%hello%',
    };

    const filterParser = new FilterParser(db.getCollection('users'), filter);

    const filterParams = filterParser.toSequelizeParams();
    expect(filterParams.where['$posts.title$'][Op.iLike]).toEqual('%hello%');
    expect(filterParams.include[0]['association']).toEqual('posts');
  });

  test('belongsTo', async () => {
    const filter = {
      'posts.comments.content.$iLike': '%hello%',
    };

    const filterParser = new FilterParser(db.getCollection('users'), filter);

    const filterParams = filterParser.toSequelizeParams();
    expect(filterParams.where['$posts.comments.content$'][Op.iLike]).toEqual(
      '%hello%',
    );
    expect(filterParams.include[0]['association']).toEqual('posts');
    expect(filterParams.include[0]['include'][0]['association']).toEqual(
      'comments',
    );
  });
});
