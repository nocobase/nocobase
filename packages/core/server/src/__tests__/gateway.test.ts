import { supertest } from '@nocobase/test';
import { Gateway } from '../gateway';
import Application from '../application';
import ws from 'ws';
import { errors } from '../gateway/errors';

describe('gateway', () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = Gateway.getInstance();
  });

  afterEach(async () => {
    await gateway.destroy();
  });

  describe('http api', () => {
    it('should return error when app not found', (done) => {
      supertest
        .agent(gateway.getCallback())
        .get('/api/app:getInfo')
        .expect(404)
        .expect((res) => {
          const data = res.body;
          expect(data).toMatchObject({
            code: 'APP_NOT_FOUND',
            message: `application main not found`,
            status: 404,
            maintaining: false,
          });
        })
        .end(done);
    });

    it('should match error structure', async () => {
      const main = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });

      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      expect(res.status).toBe(503);
      const data = res.body;

      expect(data).toMatchObject({
        code: 'APP_IDLE',
        message: errors.APP_IDLE.message(main),
        status: 503,
        maintaining: true,
      });
    });
  });

  describe('websocket api', () => {
    let wsClient;

    let messages: Array<string>;

    beforeEach(async () => {
      messages = [];
      const port = await new Promise((resolve) =>
        gateway.startHttpServer({
          port: 0,
          host: 'localhost',
          callback(server) {
            // @ts-ignore
            const port = server.address().port;
            resolve(port);
          },
        }),
      );

      wsClient = new ws(`ws://localhost:${port}/ws`);

      // await connection established
      await new Promise((resolve) => {
        wsClient.on('open', resolve);
      });

      wsClient.on('message', (data) => {
        const message = data.toString();
        messages.push(message);
      });
    });

    afterEach(async () => {
      wsClient.close();

      await new Promise((resolve) => {
        wsClient.on('close', resolve);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should receive app error message', async () => {
      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });

      await app.getFsmInterpreter().send('start', {
        checkInstall: true,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      console.log(messages);
      const lastMessage = messages[messages.length - 1];

      const lastMessageObject = JSON.parse(lastMessage);

      expect(lastMessageObject).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_ERROR',
          message: errors.APP_ERROR.message(app),
          status: 503,
        },
      });
    });
  });
});
