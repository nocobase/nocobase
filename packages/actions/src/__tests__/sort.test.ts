import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '..';

describe('sort', () => {

  describe('same scope', () => {
    let api: MockServer;

    beforeEach(async () => {
      api = mockServer({
        dataWrapping: false,
      });
      registerActions(api);
      api.db.table({
        name: 'tests',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'sort', name: 'sort' },
          { type: 'sort', name: 'sort2' },
        ],
      });
      await api.db.sync();
      const Test = api.db.getModel('tests');
      for (let index = 1; index < 5; index++) {
        await Test.create({ title: `t${index}` });
      }
    });

    afterEach(async () => {
      return api.destroy();
    });

    it('targetId', async () => {
      await api.resource('tests').sort({
        sourceId: 1,
        targetId: 3,
      });
      const response = await api.resource('tests').list({
        sort: ['sort'],
      });
      expect(response.body).toMatchObject({
        rows: [
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
          }
        ],
      });
    });

    it('targetId', async () => {
      await api.resource('tests').sort({
        sourceId: 3,
        targetId: 1,
      });
      const response = await api.resource('tests').list({
        sort: ['sort'],
      });
      expect(response.body).toMatchObject({
        rows: [
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
          }
        ],
      });
    });

    it('sortField', async () => {
      await api.resource('tests').sort({
        sortField: 'sort2',
        sourceId: 1,
        targetId: 3,
      });
      const response = await api.resource('tests').list({
        sort: ['sort2'],
      });
      expect(response.body).toMatchObject({
        rows: [
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
          }
        ],
      });
    });

    it('sticky', async () => {
      await api.resource('tests').sort({
        sourceId: 3,
        sticky: true,
      });
      const response = await api.resource('tests').list({
        sort: ['sort'],
      });
      expect(response.body).toMatchObject({
        rows: [
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
          }
        ],
      });
    });
  });

  describe('different scope', () => {
    let api: MockServer;

    beforeEach(async () => {
      api = mockServer({
        dataWrapping: false,
      });
      registerActions(api);
      api.db.table({
        name: 'tests',
        fields: [
          { type: 'string', name: 'title' },
          { type: 'integer', name: 'state' },
          { type: 'sort', name: 'sort', scope: ['state'] },
        ],
      });
      await api.db.sync();
      const Test = api.db.getModel('tests');
      for (let index = 1; index < 5; index++) {
        await Test.create({ title: `t1${index}`, state: 1 });
      }
      for (let index = 1; index < 5; index++) {
        await Test.create({ title: `t2${index}`, state: 2 });
      }
    });

    afterEach(async () => {
      return api.destroy();
    });

    it('targetId/1->6', async () => {
      await api.resource('tests').sort({
        sourceId: 1,
        targetId: 6,
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      await api.resource('tests').sort({
        sourceId: 1,
        targetId: 6,
        method: 'insertAfter',
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      await api.resource('tests').sort({
        sourceId: 6,
        targetId: 2,
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      await api.resource('tests').sort({
        sourceId: 6,
        targetId: 2,
        method: 'insertAfter',
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      await api.resource('tests').sort({
        sourceId: 1,
        targetScope: {
          state: 2,
        },
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      await api.resource('tests').sort({
        sourceId: 1,
        targetScope: {
          state: 2,
        },
        method: 'prepend',
      });
      let response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 1 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
      response = await api.resource('tests').list({
        sort: ['sort'],
        filter: { state: 2 },
      });
      expect(response.body).toMatchObject({
        rows: [
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
