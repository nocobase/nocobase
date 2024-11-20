/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { Collection, Database } from '@nocobase/database';
import { waitSecond } from '@nocobase/test';

import Plugin from '..';

describe('sort action', () => {
  let api: MockServer;
  let db: Database;

  beforeEach(async () => {
    api = await createMockServer({
      plugins: [Plugin, 'data-source-main', 'error-handler'],
    });
  });

  afterEach(async () => {
    return api.destroy();
  });

  describe('associations', () => {
    let UserCollection: Collection;

    beforeEach(async () => {
      UserCollection = api.db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name' },
          {
            type: 'hasMany',
            name: 'posts',
          },

          { type: 'sort', name: 'sort' },
        ],
      });

      api.db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'sort', name: 'sort' },
          { type: 'belongsTo', name: 'user' },
        ],
      });

      await api.db.sync();

      for (let index = 1; index < 5; index++) {
        await UserCollection.repository.create({
          values: {
            name: `u${index}`,
            posts: [
              {
                title: `u${index}p1`,
              },
              {
                title: `u${index}p2`,
              },
              {
                title: `u${index}p3`,
              },
            ],
          },
        });
      }
    });

    it('should not move association items when association not sortable', async () => {
      const u1 = await api.db.getRepository('users').findOne({
        filter: {
          name: 'u1',
        },
      });

      const response = await api.agent().resource('users.posts', u1.get('id')).move({
        sourceId: 1,
        targetId: 3,
      });

      expect(response.status).not.toEqual(200);
    });

    it('should move association item', async () => {
      UserCollection.setField('posts', {
        sortable: true,
        type: 'hasMany',
      });

      await api.db.sync({
        alter: {
          drop: false,
        },
        force: false,
      });

      const PostCollection = api.db.getCollection('posts');

      const sortFieldName = `${UserCollection.model.associations.posts.foreignKey}Sort`;
      expect(PostCollection.fields.get(sortFieldName)).toBeDefined();

      const u1 = await api.db.getRepository('users').findOne({
        filter: {
          name: 'u1',
        },
      });

      await api
        .agent()
        .resource('users.posts', u1.get('id'))
        .create({
          values: {
            title: 'u1p4',
          },
        });

      const u1p4 = await api.db.getRepository('posts').findOne({
        filter: {
          title: 'u1p4',
        },
      });

      // should move by association sort field
      await api
        .agent()
        .resource('users.posts', u1.get('id'))
        .move({
          sourceId: 1,
          targetId: u1p4.get('id'),
        });

      const u1Posts = await api
        .agent()
        .resource('users.posts', u1.get('id'))
        .list({
          fields: ['title'],
          sort: [sortFieldName],
        });

      expect(u1Posts.body).toMatchObject({
        data: [
          {
            title: 'u1p2',
          },
          {
            title: 'u1p3',
          },
          {
            title: 'u1p4',
          },
          {
            title: 'u1p1',
          },
        ],
      });
    });
  });

  describe('same scope', () => {
    beforeEach(async () => {
      api.db.collection({
        name: 'tests',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'sort', name: 'sort' },
          { type: 'sort', name: 'sort2' },
        ],
      });
      await api.db.sync();
      const Test = api.db.getCollection('tests');

      for (let index = 1; index < 5; index++) {
        await Test.repository.create({ values: { title: `t${index}` } });
      }
    });

    afterEach(async () => {
      return api.destroy();
    });

    it('targetId', async () => {
      await api.agent().resource('tests').move({
        sourceId: 1,
        targetId: 3,
      });

      const response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
        });

      expect(response.body).toMatchObject({
        data: [
          {
            title: 't2',
            sort: 1,
          },
          {
            title: 't3',
            sort: 2,
          },
          {
            title: 't1',
            sort: 3,
          },
          {
            title: 't4',
            sort: 4,
          },
        ],
      });
    });

    it('targetId', async () => {
      await api.agent().resource('tests').move({
        sourceId: 3,
        targetId: 1,
      });

      const response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
        });

      expect(response.body).toMatchObject({
        data: [
          {
            title: 't3',
            sort: 1,
          },
          {
            title: 't1',
            sort: 2,
          },
          {
            title: 't2',
            sort: 3,
          },
          {
            title: 't4',
            sort: 4,
          },
        ],
      });
    });

    it('sortField', async () => {
      await api.agent().resource('tests').move({
        sortField: 'sort2',
        sourceId: 1,
        targetId: 3,
      });

      const response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort2'],
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't2',
            sort2: 1,
          },
          {
            title: 't3',
            sort2: 2,
          },
          {
            title: 't1',
            sort2: 3,
          },
          {
            title: 't4',
            sort2: 4,
          },
        ],
      });
    });

    it('sticky', async () => {
      await api.agent().resource('tests').move({
        sourceId: 3,
        sticky: true,
      });

      const response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't3',
            sort: 0,
          },
          {
            title: 't1',
            sort: 1,
          },
          {
            title: 't2',
            sort: 2,
          },
          {
            title: 't4',
            sort: 4,
          },
        ],
      });
    });
  });

  describe('different scope', () => {
    beforeEach(async () => {
      db = api.db;

      api.db.collection({
        name: 'tests',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'integer', name: 'state' },
          { type: 'sort', name: 'sort', scopeKey: 'state' },
        ],
      });
      await api.db.sync();
      const Test = api.db.getCollection('tests');

      for (let index = 1; index < 5; index++) {
        await Test.repository.create({ values: { title: `t1${index}`, state: 1 } });
      }
      for (let index = 1; index < 5; index++) {
        await Test.repository.create({ values: { title: `t2${index}`, state: 2 } });
      }
    });

    afterEach(async () => {
      return api.destroy();
    });

    it('should not touch updatedAt on no scope change', async () => {
      const moveItemId = 1;
      const getUpdatedAts = async () => {
        return (
          await api.db.getRepository('tests').find({
            order: ['id'],
          })
        ).map((item) => item.get('updatedAt'));
      };

      const beforeUpdatedAts = await getUpdatedAts();

      await api.agent().resource('tests').move({
        sourceId: moveItemId,
        targetId: 4,
      });

      const afterUpdatedAts = await getUpdatedAts();

      expect(afterUpdatedAts).toEqual(beforeUpdatedAts);
    });

    it('should only touch updatedAt on change scope item', async () => {
      const moveItemId = 1;
      const getUpdatedAts = async () => {
        return (
          await api.db.getRepository('tests').find({
            order: ['id'],
            filter: {
              id: { $ne: moveItemId },
            },
          })
        ).map((item) => item.get('updatedAt'));
      };

      const findMoveItem = async () => {
        return await api.db.getRepository('tests').findOne({
          filter: {
            id: moveItemId,
          },
        });
      };

      const beforeMoveItem = await findMoveItem();

      const beforeUpdatedAts = await getUpdatedAts();

      await waitSecond(1000);

      await api.agent().resource('tests').move({
        sourceId: moveItemId,
        targetId: 6,
      });

      const afterUpdatedAts = await getUpdatedAts();
      const afterMoveItem = await findMoveItem();

      expect(afterUpdatedAts).toEqual(beforeUpdatedAts);
      expect(beforeMoveItem.get('updatedAt')).not.toEqual(afterMoveItem.get('updatedAt'));
    });

    it('should touch updatedAt when no item at target scope', async () => {
      db.collection({
        name: 'tasks',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'state',
            type: 'string',
          },
          {
            type: 'sort',
            name: 'sort',
            scopeKey: 'state',
          },
        ],
      });

      await db.sync();

      const t1 = await db.getRepository('tasks').create({
        values: {
          title: 't1',
          state: '1',
        },
      });

      const t2 = await db.getRepository('tasks').create({
        values: {
          title: 't2',
          state: '1',
        },
      });

      const beforeUpdated = t1.get('updatedAt');
      await waitSecond(1000);

      await api
        .agent()
        .resource('tasks')
        .move({
          sourceId: t1.get('id'),
          targetScope: {
            state: '2',
          },
        });

      const afterT1 = await db.getRepository('tasks').findOne({
        filter: {
          id: t1.get('id'),
        },
      });

      expect(beforeUpdated).not.toEqual(afterT1.get('updatedAt'));
    });

    it('targetId/1->6', async () => {
      await api.agent().resource('tests').move({
        sourceId: 1,
        targetId: 6,
      });

      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
          fields: ['title', 'sort'],
        });

      expect(response.body).toMatchObject({
        data: [
          {
            title: 't12',
            sort: 2,
          },
          {
            title: 't13',
            sort: 3,
          },
          {
            title: 't14',
            sort: 4,
          },
        ],
      });

      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });

      expect(response.body).toMatchObject({
        data: [
          {
            title: 't21',
            sort: 1,
          },
          {
            title: 't11',
            sort: 2,
          },
          {
            title: 't22',
            sort: 3,
          },
          {
            title: 't23',
            sort: 4,
          },
          {
            title: 't24',
            sort: 5,
          },
        ],
      });
    });

    it('targetId/1->6 - method=insertAfter', async () => {
      await api.agent().resource('tests').move({
        sourceId: 1,
        targetId: 6,
        method: 'insertAfter',
      });

      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
        });

      expect(response.body).toMatchObject({
        data: [
          {
            title: 't12',
            sort: 2,
          },
          {
            title: 't13',
            sort: 3,
          },
          {
            title: 't14',
            sort: 4,
          },
        ],
      });
      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't21',
            sort: 1,
          },
          {
            title: 't22',
            sort: 2,
          },
          {
            title: 't11',
            sort: 3,
          },
          {
            title: 't23',
            sort: 4,
          },
          {
            title: 't24',
            sort: 5,
          },
        ],
      });
    });

    it('targetId/6->2', async () => {
      await api.agent().resource('tests').move({
        sourceId: 6,
        targetId: 2,
      });
      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't11',
            sort: 1,
          },
          {
            title: 't22',
            sort: 2,
          },
          {
            title: 't12',
            sort: 3,
          },
          {
            title: 't13',
            sort: 4,
          },
          {
            title: 't14',
            sort: 5,
          },
        ],
      });
      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't21',
            sort: 1,
          },
          {
            title: 't23',
            sort: 3,
          },
          {
            title: 't24',
            sort: 4,
          },
        ],
      });
    });

    it('targetId/6->2 - method=insertAfter', async () => {
      await api.agent().resource('tests').move({
        sourceId: 6,
        targetId: 2,
        method: 'insertAfter',
      });
      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't11',
            sort: 1,
          },
          {
            title: 't12',
            sort: 2,
          },
          {
            title: 't22',
            sort: 3,
          },
          {
            title: 't13',
            sort: 4,
          },
          {
            title: 't14',
            sort: 5,
          },
        ],
      });
      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't21',
            sort: 1,
          },
          {
            title: 't23',
            sort: 3,
          },
          {
            title: 't24',
            sort: 4,
          },
        ],
      });
    });

    it('targetScope', async () => {
      await api
        .agent()
        .resource('tests')
        .move({
          sourceId: 1,
          targetScope: {
            state: 2,
          },
        });
      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't12',
            sort: 2,
          },
          {
            title: 't13',
            sort: 3,
          },
          {
            title: 't14',
            sort: 4,
          },
        ],
      });
      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't21',
            sort: 1,
          },
          {
            title: 't22',
            sort: 2,
          },
          {
            title: 't23',
            sort: 3,
          },
          {
            title: 't24',
            sort: 4,
          },
          {
            title: 't11',
            sort: 5,
          },
        ],
      });
    });

    it('targetScope - method=prepend', async () => {
      await api
        .agent()
        .resource('tests')
        .move({
          sourceId: 1,
          targetScope: {
            state: 2,
          },
          method: 'prepend',
        });
      let response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 1 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't12',
          },
          {
            title: 't13',
          },
          {
            title: 't14',
          },
        ],
      });
      response = await api
        .agent()
        .resource('tests')
        .list({
          sort: ['sort'],
          filter: { state: 2 },
        });
      expect(response.body).toMatchObject({
        data: [
          {
            title: 't11',
          },
          {
            title: 't21',
          },
          {
            title: 't22',
          },
          {
            title: 't23',
          },
          {
            title: 't24',
          },
        ],
      });
    });
  });
});
