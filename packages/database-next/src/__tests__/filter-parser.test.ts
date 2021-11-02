import { mockDatabase } from './index';
import FilterParser from '../filterParser';
import { describe } from 'pm2';
import { Op } from 'sequelize';

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

test('filter by belongsTo', async () => {
  const database = mockDatabase();
  const UserCollection = database.collection({
    name: 'users',
    fields: [{ type: 'string', name: 'name' }],
  });

  const PostCollection = database.collection({
    name: 'posts',
    fields: [
      { type: 'string', name: 'title' },
      {
        type: 'belongsTo',
        name: 'user',
      },
    ],
  });

  const filter = {
    'posts.title.$iLike': '%hello%',
  };

  const filterParser = new FilterParser(UserCollection, filter);

  const filterParams = filterParser.toSequelizeParams();
  expect(filterParams.where['posts']['title'][Op.iLike]).toEqual('%hello%');
  expect(filterParams.include).toEqual('asdasdasdsa');
});
