import { Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';

describe('action test', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('insert action', async () => {
    const response = await app
      .agent()
      .resource('uiSchemas')
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

  test('getJsonSchema with async node', async () => {
    await app
      .agent()
      .resource('uiSchemas')
      .insert({
        values: {
          'x-uid': 'n1',
          name: 'a',
          type: 'object',
          properties: {
            b: {
              'x-async': true,
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

    let response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    expect(response.body.data.properties.b).toBeUndefined();

    response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
      includeAsyncNode: true,
    });

    expect(response.body.data.properties.b).toBeDefined();
  });

  test('getJsonSchema', async () => {
    await app
      .agent()
      .resource('uiSchemas')
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

    const response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b.properties.c['x-uid']).toEqual('n3');
  });

  test('getJsonSchema when uid not exists', async () => {
    const response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'not-exists',
    });

    expect(response.statusCode).toEqual(200);
  });

  test('get properties when uid not exists', async () => {
    const response = await app.agent().resource('uiSchemas').getProperties({
      resourceIndex: 'not-exists',
    });

    expect(response.statusCode).toEqual(200);
  });

  test('remove', async () => {
    await app
      .agent()
      .resource('uiSchemas')
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

    let response = await app.agent().resource('uiSchemas').remove({
      resourceIndex: 'n2',
    });

    expect(response.statusCode).toEqual(200);

    response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b).not.toBeDefined();
  });

  test('patch', async () => {
    await app
      .agent()
      .resource('uiSchemas')
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
      .resource('uiSchemas')
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
    response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.b['properties']['c']['title']).toEqual('c-title');
  });

  test('insert adjacent', async () => {
    await app
      .agent()
      .resource('uiSchemas')
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
      .resource('uiSchemas')
      .insertAdjacent({
        resourceIndex: 'n2',
        position: 'beforeBegin',
        values: {
          'x-uid': 'n5',
          name: 'e',
        },
      });

    expect(response.statusCode).toEqual(200);
    response = await app.agent().resource('uiSchemas').getJsonSchema({
      resourceIndex: 'n1',
    });

    const { data } = response.body;
    expect(data.properties.e['x-uid']).toEqual('n5');
  });

  test('insert adjacent with bit schema', async () => {
    const schema = (await import('./fixtures/data')).default;

    await app
      .agent()
      .resource('uiSchemas')
      .insert({
        values: {
          'x-uid': 'root',
          properties: {
            A: {
              'x-uid': 'A',
            },
            B: {
              'x-uid': 'B',
            },
          },
        },
      });

    const response = await app.agent().resource('uiSchemas').insertAdjacent({
      resourceIndex: 'A',
      position: 'afterEnd',
      values: schema,
    });

    expect(response.statusCode).toEqual(200);
  });
});
