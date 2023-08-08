import { supertest } from '@nocobase/test';
import { Gateway } from '../gateway';
import Application from '../application';
const wtfnode = require('wtfnode');

describe('gateway', () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = Gateway.getInstance();
  });

  afterEach(async () => {
    await gateway.destroy();
  });

  it('should return error when app not found', (done) => {
    supertest
      .agent(gateway.getCallback())
      .get('/api/app:getInfo')
      .expect(404)
      .expect((res) => {
        const data = res.body;
        expect(data).toMatchObject({
          code: 404,
          message: `application main not found`,
          status: 'not_found',
          maintaining: false,
        });
      })
      .end(done);
  });

  it('should match error structure', (done) => {
    new Application({
      database: {
        dialect: 'sqlite',
        storage: ':memory:',
      },
    });

    supertest
      .agent(gateway.getCallback())
      .get('/api/app:getInfo')
      .expect(503)
      .expect((res) => {
        const data = JSON.stringify(res.body);
        expect(data).toMatchObject({
          code: 503,
          message: 'application is maintaining',
          status: 'idle',
          maintaining: true,
        });
      })
      .end(done);
  });
});
