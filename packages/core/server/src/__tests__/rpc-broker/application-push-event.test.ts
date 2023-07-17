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

  it('should handle push event at application', async () => {
    const jestFn = jest.fn();

    app.on('rpc:test_event', async () => {
      jestFn();
    });

    app.handleEventPush('test_event');

    expect(jestFn).toBeCalledTimes(1);
  });
});
