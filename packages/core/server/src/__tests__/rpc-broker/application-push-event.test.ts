import { AppSupervisor } from '../../app-supervisor';
import Application from '../../application';

function timeOut(delay) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

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

    await timeOut(100);
    expect(jestFn).toBeCalledTimes(1);
  });

  it('should handle delay event', async () => {
    const jestFn = jest.fn();

    app.on('rpc:test_event', () => {
      jestFn();
    });

    app.handleEventPush('test_event', {
      __$delay: 200,
    });

    await timeOut(100);
    expect(jestFn).toBeCalledTimes(0);

    await timeOut(210);
    expect(jestFn).toBeCalledTimes(1);
  });

  it('should debounce event', async () => {
    const jestFn1 = jest.fn();
    const jestFn2 = jest.fn();

    app.on('rpc:event1', () => {
      jestFn1();
    });

    app.on('rpc:event2', () => {
      jestFn2();
    });

    for (let i = 0; i < 100; i++) {
      app.handleEventPush('event1');
      app.handleEventPush('event2');
    }

    await timeOut(200);
    expect(jestFn2).toBeCalledTimes(1);
    expect(jestFn1).toBeCalledTimes(1);
  });
});
