import { AppSupervisor } from '../../app-supervisor';
import Application from '../../application';

describe('application push event', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        dialectModule: require('sqlite3'),
        storage: ':memory:',
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });
  });

  afterEach(async () => {
    await AppSupervisor.getInstance().destroy();
  });

  it('should handle push event at application', async () => {
    const jestFn = jest.fn();

    app.on('rpc:test_event', async () => {
      jestFn();
    });

    app.handleEventPush('test_event');

    await new Promise((resolve) =>
      // do assert at the end of next tick
      setTimeout(() => {
        expect(jestFn).toBeCalledTimes(1);
        resolve(0);
      }, 0),
    );
  });

  it('should handle delay event', async () => {
    const jestFn = jest.fn();

    app.on('rpc:test_event', () => {
      jestFn();
    });

    app.handleEventPush('test_event', {
      __$delay: 199,
    });

    await new Promise((resolve) =>
      // do assert at the end of next tick
      setTimeout(() => {
        expect(jestFn).toBeCalledTimes(0);
        resolve(0);
      }, 10),
    );

    await new Promise((resolve) =>
      // do assert at the end of next tick
      setTimeout(() => {
        expect(jestFn).toBeCalledTimes(1);
        resolve(0);
      }, 200),
    );
  });
});
