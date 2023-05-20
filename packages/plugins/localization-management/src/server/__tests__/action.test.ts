import { Database } from '@nocobase/database';
import { MockServer, mockServer } from '@nocobase/test';
import Plugin from '../index';
import { TRANSLATION_ALIAS } from '../constant';

describe('actions test', () => {
  let app: MockServer;
  let db: Database;
  let ctx;
  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });
    await app.cleanDb();

    app.plugin(Plugin);
    await app.load();
    await app.db.sync();

    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should call list action', async () => {
    const listResponse = await app.agent().resource(TRANSLATION_ALIAS).query();

    expect(listResponse.statusCode).toEqual(200);
  });
  it('should call create action', async () => {
    const createRes = await app
      .agent()
      .resource(TRANSLATION_ALIAS)
      .create({
        values: {
          module: 'antd',
          text: 'testKey1',
          translation: 'test1Translation',
        },
      });
    expect(createRes.statusCode).toEqual(200);
  });
  it('should call create with out same module and text action', async () => {
    const createRes = await app
      .agent()
      .resource(TRANSLATION_ALIAS)
      .create({
        values: {
          module: 'antd',
          text: 'testKey1',
          translation: 'test1Translation',
        },
      });
    const createRes2 = await app
      .agent()
      .resource(TRANSLATION_ALIAS)
      .create({
        values: {
          module: 'antd',
          text: 'testKey1',
          translation: 'test1Translation',
        },
      });
    expect(createRes.statusCode).toEqual(200);
    expect(createRes2.statusCode).toEqual(400);
  });
});
