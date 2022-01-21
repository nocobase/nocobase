import { MockServer } from '@nocobase/test';
import { prepareApp } from './prepare';
import { Database } from '@nocobase/database';
import { acl } from '../acl';

describe('acl', () => {
  let app: MockServer;
  let db: Database;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
  });

  it('should works with universal actions', async () => {
    await app
      .agent()
      .resource('roles')
      .create({
        values: {
          name: 'admin',
          title: 'Admin User',
          allowConfigure: true,
        },
      });

    const role = await db.getRepository('roles').findOne({
      filter: {
        name: 'admin',
      },
    });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toBeNull();

    // grant universal action
    await app
      .agent()
      .resource('roles')
      .update({
        resourceIndex: 'admin',
        values: {
          strategy: {
            actions: ['create'],
          },
        },
      });

    expect(
      acl.can({
        role: 'admin',
        resource: 'posts',
        action: 'create',
      }),
    ).toMatchObject({
      role: 'admin',
      resource: 'posts',
      action: 'create',
    });
  });
});
