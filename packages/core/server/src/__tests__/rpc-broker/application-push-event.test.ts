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
      await new Promise((resolve) => setTimeout(resolve, 100));
      jestFn();
    });

    app.handleEventPush('test_event');

    // do assert at the end of next tick
    setTimeout(() => {
      expect(jestFn).toBeCalledTimes(1);
    }, 0);
  });
});
