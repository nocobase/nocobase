import { Application } from '@nocobase/server';

describe('MainDataSource', () => {
  let app: Application;

  beforeEach(async () => {
    app = new Application({
      database: {
        dialect: 'sqlite',
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
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create main data source when create application', async () => {
    const dataSourceManager = app.dataSourceManager;
    const mainDataSource = dataSourceManager.dataSources.get('main');

    expect(mainDataSource).toBeTruthy();
  });
});
