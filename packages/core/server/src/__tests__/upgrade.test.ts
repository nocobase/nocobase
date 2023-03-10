import Application from '../application';
import Plugin from '../plugin';

class TestPlugin extends Plugin {
  
}

describe('upgrade test', () => {
  let app: Application;
  beforeEach(async () => {
    app = new Application({
      database: {
        dialect: 'sqlite',
        dialectModule: require('sqlite3'),
        storage: ':memory:',
        logging: false,
      },
      resourcer: {
        prefix: '/api',
      },
      acl: false,
      dataWrapping: false,
      registerActions: false,
    });

    app.plugin(TestPlugin, { name: 'test-plugin' });
  });

  it('should call upgrade', async () => {
    await app.upgrade();
    console.log('1231');
  });
});
