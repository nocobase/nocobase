import { startServerWithRandomPort, supertest, waitSecond } from '@nocobase/test';
import { vi } from 'vitest';
import ws from 'ws';
import { AppSupervisor } from '../app-supervisor';
import Application from '../application';
import { Gateway } from '../gateway';
import { errors } from '../gateway/errors';
describe('gateway', () => {
  let gateway: Gateway;
  beforeEach(() => {
    gateway = Gateway.getInstance();
  });
  afterEach(async () => {
    await gateway.destroy();
    await AppSupervisor.getInstance().destroy();
  });
  describe('app selector', () => {
    it('should get app as default main app', async () => {
      expect(
        await gateway.getRequestHandleAppName({
          url: '/test',
          headers: {},
        }),
      ).toBe('main');
    });
    it('should add middleware into app selector', async () => {
      gateway.addAppSelectorMiddleware(async (ctx, next) => {
        ctx.resolvedAppName = 'test';
        await next();
      });
      expect(
        await gateway.getRequestHandleAppName({
          url: '/test',
          headers: {},
        }),
      ).toEqual('test');
    });
    it('should add same middleware into app selector once', async () => {
      const fn = async (ctx, next) => {
        ctx.resolvedAppName = 'test';
        await next();
      };
      gateway.addAppSelectorMiddleware(fn);
      gateway.addAppSelectorMiddleware(fn);
      expect(gateway.getAppSelectorMiddlewares().nodes.length).toBe(2);
    });
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
          code: 'APP_COMMANDING',
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
      await main.runAsCLI(['start'], {
        from: 'user',
      });
      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      expect(res.status).toBe(503);
      const data = res.body;
      expect(data).toMatchObject({
        error: {
          code: 'APP_NOT_INSTALLED_ERROR',
          message: errors.APP_ERROR.message({
            app: main,
          }),
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
      const installPromise = main.runAsCLI(['install'], {
        from: 'user',
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const res = await supertest.agent(gateway.getCallback()).get('/api/app:getInfo');
      const data = res.body;
      expect(data).toMatchObject({
        error: {
          status: 503,
          maintaining: true,
          message: 'call beforeInstall hook...',
          code: 'APP_COMMANDING',
          command: {
            name: 'install',
          },
        },
      });
      await installPromise;
    });
  });
  describe('websocket api', () => {
    let wsClient;
    let port;
    let messages: Array<string>;
    const connectClient = (port) => {
      wsClient = new ws(`ws://localhost:${port}${process.env.WS_PATH}`);
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
    const clearMessages = () => {
      messages = [];
    };
    beforeEach(async () => {
      clearMessages();
      port = await startServerWithRandomPort(gateway.startHttpServer.bind(gateway));
    });
    afterEach(async () => {
      console.log(messages);
      wsClient.close();
      await new Promise((resolve) => {
        wsClient.on('close', resolve);
      });
      await waitSecond();
    });
    describe('plugin manager api', () => {
      let app;
      beforeEach(async () => {
        await connectClient(port);
        app = new Application({
          database: {
            dialect: 'sqlite',
            storage: ':memory:',
            logging: false,
          },
          plugins: ['nocobase'],
        });
        await waitSecond();
        await app.runAsCLI(['install'], {
          from: 'user',
        });
        await app.runAsCLI(['start'], {
          from: 'user',
        });
        await waitSecond();
        clearMessages();
      });
      it('should silently handle the exception when the plugin does not exist', async () => {
        await app.runAsCLI(['pm', 'add', 'not-exists-plugin'], {
          from: 'user',
        });
        await waitSecond();
      });
      it('should display a notification-type error message when plugin installation fails', async () => {
        const pluginClass = app.pm.get('mobile-client');
        pluginClass.beforeEnable = async () => {
          throw new Error('install error');
        };
        await app.runAsCLI(['pm', 'enable', 'mobile-client'], {
          from: 'user',
        });
        await waitSecond();
        const runningMessage = messages
          .map((m) => {
            return JSON.parse(m);
          })
          .find((m) => {
            return m.payload.code == 'APP_RUNNING';
          });
        expect(runningMessage.payload.refresh).not.toBeTruthy();
      });
    });
    it('should receive app error message', async () => {
      await connectClient(port);
      await waitSecond();

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
        payload: {
          message: 'application main not found',
          code: 'APP_NOT_FOUND',
        },
      });
      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_INITIALIZED',
        },
      });
      await app.runAsCLI(['start'], {
        from: 'user',
      });
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_NOT_INSTALLED_ERROR',
          message: errors.APP_ERROR.message({
            app,
          }),
          command: {
            name: 'start',
          },
        },
      });
      const jestFn = vi.fn();
      app.on('beforeInstall', async () => {
        jestFn();
      });
      const runningJest = vi.fn();
      app.on('maintaining', ({ status }) => {
        if (status === 'command_running') {
          runningJest();
        }
      });
      await app.runAsCLI(['install'], {
        from: 'user',
      });
      expect(jestFn).toBeCalledTimes(1);
      expect(runningJest).toBeCalledTimes(1);
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_RUNNING',
        },
      });
    });
    it('should receive refresh true when app installed', async () => {
      await connectClient(port);
      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
      await waitSecond();
      await app.runCommand('start');
      await app.runCommand('install');
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_RUNNING',
          refresh: true,
        },
      });
    });
    it('should receive app running message when command end', async () => {
      await connectClient(port);
      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
      await waitSecond();
      await app.runCommand('start');
      await app.runCommand('install');
      await app.runCommand('db:auth');
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_RUNNING',
        },
      });
    });
    it('should receive app stopped when stop app', async () => {
      await connectClient(port);
      const app = new Application({
        database: {
          dialect: 'sqlite',
          storage: ':memory:',
        },
      });
      await waitSecond();
      await app.runCommand('start');
      await app.runCommand('install');
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_RUNNING',
        },
      });
      await app.runCommand('stop');
      await waitSecond();
      expect(getLastMessage()).toMatchObject({
        type: 'maintaining',
        payload: {
          code: 'APP_STOPPED',
        },
      });
    });
  });
});
