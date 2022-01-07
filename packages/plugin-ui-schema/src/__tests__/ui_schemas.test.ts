import { MockServer, mockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema from '../server';
import { uid } from '@nocobase/utils';

describe('ui_schemas', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
    });

    db = app.db;

    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.dropAllTables();

    app.plugin(PluginUiSchema);

    await app.load();
    await db.sync({
      force: false,
      alter: {
        drop: false,
      },
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('create', async () => {
    const UISchema = db.getCollection('ui_schemas');
    const schema = await UISchema.model.create({
      'x-uid': uid(),
    });
    console.log(schema.toJSON(), UISchema.model.rawAttributes);
  });
});
