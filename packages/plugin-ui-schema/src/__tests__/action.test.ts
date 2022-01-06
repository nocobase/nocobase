import { MockServer, mockServer } from '@nocobase/test';
import { Database } from '@nocobase/database';
import PluginUiSchema from '../server';

describe('action test', () => {
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

  test('insert action', async () => {
    const response = await app
      .agent()
      .resource('ui_schemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-uid': 'n2',
              type: 'object',
              properties: {
                c: { 'x-uid': 'n3' },
              },
            },
            d: { 'x-uid': 'n4' },
          },
        },
      });

    expect(response.statusCode).toEqual(200);
  });

  test('getJsonSchema', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-uid': 'n2',
              type: 'object',
              properties: {
                c: { 'x-uid': 'n3' },
              },
            },
            d: { 'x-uid': 'n4' },
          },
        },
      });

    const response = await app.agent().resource('ui_schemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b.properties.c['x-uid']).toEqual('n3');
  });

  test('remove', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-uid': 'n2',
              type: 'object',
              properties: {
                c: { 'x-uid': 'n3' },
              },
            },
            d: { 'x-uid': 'n4' },
          },
        },
      });

    let response = await app.agent().resource('ui_schemas').remove({
      resourceIndex: 'n2',
    });

    expect(response.statusCode).toEqual(200);

    response = await app.agent().resource('ui_schemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b).not.toBeDefined();
  });

  test('patch', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-uid': 'n2',
              type: 'object',
              properties: {
                c: { 'x-uid': 'n3' },
              },
            },
            d: { 'x-uid': 'n4' },
          },
        },
      });

    let response = await app
      .agent()
      .resource('ui_schemas')
      .patch({
        values: {
          'x-uid': 'n1',
          properties: {
            b: {
              properties: {
                c: {
                  title: 'c-title',
                },
              },
            },
          },
        },
      });

    expect(response.statusCode).toEqual(200);
    response = await app.agent().resource('ui_schemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b['properties']['c']['title']).toEqual('c-title');
  });

  test('insert adjacent', async () => {
    await app
      .agent()
      .resource('ui_schemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-uid': 'n2',
              type: 'object',
              properties: {
                c: { 'x-uid': 'n3' },
              },
            },
            d: { 'x-uid': 'n4' },
          },
        },
      });

    let response = await app
      .agent()
      .resource('ui_schemas')
      .insertAdjacent({
        resourceIndex: 'n2',
        position: 'beforeBegin',
        values: {
          'x-uid': 'n5',
          name: 'e',
        },
      });

    expect(response.statusCode).toEqual(200);
    response = await app.agent().resource('ui_schemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.e['x-uid']).toEqual('n5');
  });
});
