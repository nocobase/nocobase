import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../migrations/20231215215247-admin-menu-uid';

describe('nocobase-admin-menu', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['client', 'ui-schema-storage', 'system-settings'],
    });
    await app.version.update('0.17.0-alpha.7');
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('migration', async () => {
    const uiSchemas = app.db.getModel('uiSchemas');
    const systemSettings = app.db.getRepository('systemSettings');
    await uiSchemas.truncate();
    await app.db.getModel('uiSchemaTreePath').truncate();
    await uiSchemas.create({
      'x-uid': 'abc',
      name: 'abc',
    });
    const instance = await systemSettings.findOne();
    instance.set('options', {
      adminSchemaUid: 'abc',
    });
    await instance.save();
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const schema = await uiSchemas.findOne();
    expect(schema.toJSON()).toMatchObject({ 'x-uid': 'nocobase-admin-menu', name: 'abc' });
  });
});
