import { Context } from '@nocobase/actions';
import Database, { Repository } from '@nocobase/database';
import { MockServer, mockServer, supertest } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;
  let db: Database;
  let repo: Repository;
  let agent: ReturnType<MockServer['agent']>;
  let resource: ReturnType<ReturnType<MockServer['agent']>['resource']>;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      acl: true,
      plugins: ['users', 'auth', 'acl', 'custom-request'],
    });

    await app.loadAndInstall({ clean: true });
    db = app.db;
    repo = db.getRepository('customRequests');
    agent = app.agent();
    resource = agent.resource('customRequests');
  });

  describe('send', () => {
    let params;
    beforeEach(async () => {
      app.resource({
        name: 'custom-request-test',
        actions: {
          test(ctx: Context) {
            params = ctx.action.params;
            console.log('🚀 ~ file: actions.test.ts:34 ~ test ~ params:', params);
            return 'test ok';
          },
        },
      });
    });
    beforeEach(async () => {
      await repo.create({
        values: {
          key: 'test',
          options: {
            url: 'http://localhost:13000/api/custom-request-test:test',
            method: 'GET',
          },
        },
      });
    });
    test('basic', async () => {
      const res = await resource.send({
        filterByTk: 'test',
      });
      console.log(res.status);
    });
  });
});
