import { supertest } from '@nocobase/test';
import { Gateway } from '../gateway';
import Application from '../application';
import ws from 'ws';
import { errors } from '../gateway/errors';
import { AppSupervisor } from '../app-supervisor';

describe('gateway', () => {
  let gateway: Gateway;

  beforeEach(() => {
    gateway = Gateway.getInstance();
  });

  afterEach(async () => {
    await gateway.destroy();
    await AppSupervisor.getInstance().destroy();
  });

  describe('http api', () => {
    it('should return error when app not found', async () => {
      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      expect(res.status).toBe(503);
      const data = res.body;

      expect(data).toMatchObject({
        error: {
          code: 'APP_INITIALIZING',
          message: `application main is initializing`,
          status: 503,
          maintaining: true,
        },
      });

      const res2 = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      expect(res2.status).toBe(404);
      const data2 = res2.body;

      expect(data2).toMatchObject({
        error: {
          code: 'APP_NOT_FOUND',
          message: `application main not found`,
          status: 404,
          maintaining: true,
        },
      });
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
        error: {
          code: 'APP_INITIALIZED',
          message: errors.APP_INITIALIZED.message(main),
          status: 503,
          maintaining: true,
        },
      });
    });

    it('should return error when app not installed', async () => {
      const main = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });

      // app should have error when not installed
      await main.runAsCLI(['start'], { from: 'user' });

      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      expect(res.status).toBe(503);
      const data = res.body;

      expect(data).toMatchObject({
        error: {
          code: 'COMMAND_ERROR',
          message: errors.COMMAND_ERROR.message(main),
          command: {
            name: 'start',
          },
          status: 503,
          maintaining: true,
        },
      });
    });

    it('should return running message when app is command running status', async () => {
      const main = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });

      main.on('beforeInstall', async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 2000);
        });
      });

      main.runAsCLI(['install'], { from: 'user' });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      const data = res.body;

      expect(data).toMatchObject({
        error: {
          status: 503,
          maintaining: true,
          message: 'call beforeInstall hook...',
          code: 'COMMAND_RUNNING',
          command: {
            name: 'install',
          },
        },
      });
    });
  });

  describe('websocket api', () => {
    let wsClient;
    let port;

    let messages: Array<string>;

    const connectClient = (port) => {
      wsClient = new ws(`ws://localhost:${port}/ws`);
      wsClient.on('message', (data) => {
        const message = data.toString();
        messages.push(message);
      });

      // await connection established
      return new Promise((resolve) => {
        wsClient.on('open', resolve);
      });
    };

    const getLastMessage = () => {
      return JSON.parse(messages[messages.length - 1]);
    };

    beforeEach(async () => {
      messages = [];
      port = await new Promise((resolve) =>
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
    });

    afterEach(async () => {
      wsClient.close();

      await new Promise((resolve) => {
        wsClient.on('close', resolve);
      });

      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    it('should receive app error message', async () => {
      await connectClient(port);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // should receive two messages

      // first message is app initializing
      const firstMessage = messages[0];
      expect(JSON.parse(firstMessage)).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_INITIALIZING',
          message: 'application main is initializing',
        },
      });

      //second message is app not found
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: { message: 'application main not found', code: 'APP_NOT_FOUND' },
      });

      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });

      await app.runAsCLI(['start'], { from: 'user' });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'COMMAND_ERROR',
          message: errors.COMMAND_ERROR.message(app),
          command: {
            name: 'start',
          },
        },
      });

      await app.runAsCLI(['install'], { from: 'user' });
      await app.runAsCLI(['start'], { from: 'user' });

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      console.log(messages);

      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_RUNNING',
        },
      });
    });
  });
});
