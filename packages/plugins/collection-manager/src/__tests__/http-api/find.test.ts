import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('find with association', () => {
  let app: MockServer;
  let agent;

  let db: Database;
  beforeEach(async () => {
    app = await createApp();

    agent = app.agent();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should filter by association field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'users',
        tree: 'adjacency-list',
        fields: [
          { type: 'string', name: 'name' },
          { type: 'hasMany', name: 'posts', target: 'posts', foreignKey: 'user_id' },
          {
            type: 'belongsTo',
            name: 'parent',
            foreignKey: 'parent_id',
            treeParent: true,
            target: 'users',
          },
          {
            type: 'hasMany',
            name: 'children',
            foreignKey: 'parent_id',
            treeChildren: true,
            target: 'users',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'belongsTo', name: 'user', target: 'users', foreignKey: 'user_id' },
        ],
      },
      context: {},
    });

    const UserCollection = db.getCollection('users');

    expect(UserCollection.options.tree).toBeTruthy();

    await db.getRepository('users').create({
      values: [
        {
          name: 'u1',
          posts: [
            {
              title: 'u1p1',
            },
          ],
          children: [
            {
              name: 'u2',
              posts: [
                {
                  title: '标题2',
                },
              ],
            },
          ],
        },
        {
          name: 'u3',
          children: [
            {
              name: 'u4',
              posts: [
                {
                  title: '标题五',
                },
              ],
            },
          ],
        },
      ],
    });

    const filter = {
      $and: [
        {
          children: {
            posts: {
              title: {
                $eq: '标题五',
              },
            },
          },
        },
      ],
    };

    const items = await db.getRepository('users').find({
      filter,
      appends: ['children'],
    });

    expect(items[0].name).toEqual('u3');

    const response2 = await agent.resource('users').list({
      filter,
      appends: ['children'],
    });

    expect(response2.statusCode).toEqual(200);
    expect(response2.body.data[0].name).toEqual('u3');
  });
});
