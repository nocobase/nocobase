import { prepareApp } from './prepare';
import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';

describe('scope api', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    await db.getRepository('roles').create({
      values: {
        name: 'admin',
        title: 'Admin User',
        allowConfigure: true,
      },
    });
  });

  it('should create scope of resource', async () => {
    const response = await app
      .agent()
      .resource('rolesResourcesScopes')
      .create({
        values: {
          resourceName: 'posts',
          name: 'published posts',
          scope: {
            published: true,
          },
        },
      });

    expect(response.statusCode).toEqual(200);

    const scope = await db.getRepository('rolesResourcesScopes').findOne({
      filter: {
        name: 'published posts',
      },
    });

    expect(scope.get('scope')).toMatchObject({
      published: true,
    });
  });
});
