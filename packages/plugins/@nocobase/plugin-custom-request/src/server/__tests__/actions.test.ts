import { Context } from '@nocobase/actions';
import Database, { Repository } from '@nocobase/database';
import { MockServer, mockServer, supertest } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent: ReturnType<MockServer['agent']>;
  let resource: ReturnType<ReturnType<MockServer['agent']>['resource']>;

  beforeAll(async () => {
    app = mockServer({
      registerActions: true,
      acl: false,
      plugins: ['users', 'auth', 'acl', 'custom-request'],
    });

    await app.loadAndInstall({ clean: true });
    db = app.db;
    repo = db.getRepository('customRequests');
    agent = app.agent();
    resource = agent.resource('customRequests');
  });

  describe('send', () => {
    let params = null;
    beforeAll(async () => {
      app.resourcer.getResource('customRequests').addAction('test', (ctx: Context) => {
        params = ctx.action.params.values;
        return ctx.action.params.values;
      });
      await repo.create({
        values: {
          key: 'test',
          options: {
            url: '/customRequests:test',
            method: 'GET',
            data: {
              username: '{{ currentRecord.username }}',
            },
          },
        },
      });
    });

    test('basic', async () => {
      const res = await resource.send({
        filterByTk: 'test',
      });
      expect(res.status).toBe(200);
      expect(params).toMatchSnapshot();
    });

    test('currentRecord.data', async () => {
      const res = await resource.send({
        filterByTk: 'test',
        values: {
          currentRecord: {
            data: {
              username: 'testname',
            },
          },
        },
      });
      expect(res.status).toBe(200);
      expect(params).toMatchSnapshot();
    });
  });
});
