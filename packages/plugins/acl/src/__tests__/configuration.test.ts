import { MockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import { ACL } from '@nocobase/acl';
import { UiSchemaRepository } from '@nocobase/plugin-ui-schema-storage';
import { changeMockRole, prepareApp } from './prepare';

describe('configuration', () => {
  let app: MockServer;
  let db: Database;
  let acl: ACL;

  let uiSchemaRepository: UiSchemaRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await prepareApp();
    db = app.db;
    acl = app.acl;

    uiSchemaRepository = db.getRepository('uiSchemas');
  });

  it('should list collections', async () => {
    expect((await app.agent().resource('collections').create()).statusCode).toEqual(403);
    expect((await app.agent().resource('collections').list()).statusCode).toEqual(200);
  });

  it('should allow when role has allowConfigure with true value', async () => {
    await db.getRepository('roles').create({
      values: {
        name: 'admin1',
        title: 'admin allowConfigure',
        allowConfigure: true,
      },
    });

    changeMockRole('admin1');

    expect((await app.agent().resource('collections').create()).statusCode).toEqual(200);
    expect((await app.agent().resource('collections').list()).statusCode).toEqual(200);
  });
});
