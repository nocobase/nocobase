import { mockServer, MockServer } from '@nocobase/test';
import SnapshotFieldPlugin from '../server';

describe('actions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = mockServer({
      registerActions: true,
      acl: false,
      plugins: ['error-handler', 'users', 'ui-schema-storage', 'collection-manager'],
    });

    app.plugin(SnapshotFieldPlugin, { name: 'snapshot-field' });

    await app.loadAndInstall({ clean: true });
  });

  afterEach(async () => {
    await app.cleanDb();
    await app.destroy();
  });

  it('fieldsHistory collectionName and name conflict between tables', async () => {
    const agent = app.agent();

    const field = {
      name: 'status',
      interface: 'input',
      type: 'string',
      uiSchema: { type: 'string', 'x-component': 'Input', title: 'status' },
    };

    await agent.resource('collections').create({
      values: {
        name: 'table_a',
        template: 'general',
        fields: [field],
        title: 'table_a',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'table_b',
        template: 'general',
        fields: [field],
        title: 'table_b',
      },
    });

    await agent.resource('collections.fields', 'table_b').destroy({
      filterByTk: 'status',
    });

    const { statusCode } = await agent.resource('collections.fields', 'table_b').create({
      values: field,
    });

    expect(statusCode).toBe(200);
  });
});
