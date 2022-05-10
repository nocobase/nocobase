import { changeMockRole, prepareApp } from './prepare';
import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { ACL } from '@nocobase/acl';

describe('destroy filter', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    await db.getRepository('roles').create({
      values: {
        name: 'admin1',
        title: 'admin allowConfigure',
        allowConfigure: true,
      },
    });

    changeMockRole('admin1');
  });

  it('should not destroy roles collection', async () => {
    const response = await app
      .agent()
      .resource('collections')
      .destroy({
        filter: {
          name: 'roles',
        },
      });

    expect(response.statusCode).toEqual(200);

    const usersCollection = await db.getRepository('collections').findOne({
      filter: {
        name: 'roles',
      },
    });

    expect(usersCollection).not.toBeNull();
  });
});
