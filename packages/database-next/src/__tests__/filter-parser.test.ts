import { mockDatabase } from './index';
import FilterParser from '../filterParser';
import { describe } from 'pm2';
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
          type: 'belongsTo',
          name: 'user',
        },
      ],
    });

    await db.sync();
  });

  afterEach(() => {
    db.close();
    db = null;
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
});
