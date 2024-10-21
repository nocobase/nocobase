/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';

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

  test('get parent property', async () => {
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

    const response = await app.agent().resource('uiSchemas').getParentProperty({
      filterByTk: 'n2',
    });

    expect(response.body.data['x-uid']).toEqual('n1');
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

  test('initializeActionContext', async () => {
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
      .initializeActionContext({
        values: {
          'x-uid': 'n1',
          'x-action-context': {
            field1: 'field1',
            field2: 'field2',
          },
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

    // only update the x-action-context
    expect(data.properties.b['properties']['c']['title']).toBe(undefined);
    expect(data['x-action-context']).toEqual({
      field1: 'field1',
      field2: 'field2',
    });
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

  test('save as template', async () => {
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

    const response = await app
      .agent()
      .resource('uiSchemas')
      .saveAsTemplate({
        filterByTk: 'n1',
        values: {
          key: 'yiod22qkyhl',
          dataSourceKey: 'main',
          name: 'test',
          uid: 'n1',
        },
      });

    expect(response.statusCode).toEqual(200);

    const template = await app.db.getRepository('uiSchemaTemplates').findOne({});
    expect(template.uid).toEqual('n1');
  });
});
