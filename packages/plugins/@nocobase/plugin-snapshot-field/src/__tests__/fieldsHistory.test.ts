import { createMockServer, MockServer } from '@nocobase/test';

describe('actions', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      acl: false,
      plugins: ['error-handler', 'users', 'ui-schema-storage', 'collection-manager', 'snapshot-field'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should not throw error when create field with reverse field', async () => {
    const agent = app.agent();

    await app.db.getRepository('fieldsHistory').create({
      values: {
        key: 'testKey',
        collectionName: 'targets',
        name: 'test',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'tests',
      },
    });

    await agent.resource('collections').create({
      values: {
        name: 'targets',
      },
    });

    const response = await agent.resource('fields').create({
      values: {
        type: 'hasMany',
        name: 'targets',
        collectionName: 'tests',
        foreignKey: 'test_id',
        onDelete: 'SET NULL',
        target: 'targets',
        interface: 'o2m',
        reverseField: {
          interface: 'm2o',
          type: 'belongsTo',
          name: 'test',
        },
      },
    });

    expect(response.statusCode).toBe(200);
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
