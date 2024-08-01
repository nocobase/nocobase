/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('json document field api', () => {
  let app: MockServer;
  let db: MockDatabase;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-json-document', 'data-source-manager', 'data-source-main', 'error-handler'],
    });
    db = app.db;
    agent = app.agent();
    await db.getRepository('collections').create({
      values: {
        name: 'test_json_doc',
        fields: [
          {
            type: 'JSONDocument',
            name: 'json_doc',
            fields: [
              {
                type: 'string',
                name: 'title',
              },
              {
                type: 'JSONDocument',
                name: 'nested_object',
                fields: [
                  {
                    type: 'string',
                    name: 'nested_object_title',
                  },
                ],
              },
              {
                type: 'JSONDocument',
                name: 'nested_array',
                fields: [
                  {
                    type: 'string',
                    name: 'nested_array_title',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
    await db.getRepository('test_json_doc').create({
      values: {
        json_doc: {
          title: 'title',
          nested_object: {
            nested_object_title: 'nested_object_title',
          },
          nested_array: [
            {
              nested_array_title: 'nested_array_title1',
            },
            {
              nested_array_title: 'nested_array_title2',
            },
          ],
        },
      },
    });
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('list', async () => {
    const res = await agent.resource('test_json_doc').list();
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });

  it('get', async () => {
    const res = await agent.resource('test_json_doc').get({
      filterByTk: 1,
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });

  it.only('update', async () => {
    const res = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          title: 'title1',
        },
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('test_json_doc').get({ filterByTk: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.json_doc).toMatchObject({
      title: 'title1',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });

  it('update part in object', async () => {
    const res = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          nested_object: {
            nested_object_title: 'nested_object_title1',
          },
        },
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('test_json_doc').get({ filterByTk: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title1',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });

  it('update part in array', async () => {
    const res = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          nested_array: [
            {
              nested_array_title: 'nested_array_title3',
            },
            {
              nested_array_title: 'nested_array_title2',
            },
          ],
        },
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('test_json_doc').get({ filterByTk: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title3',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });

  it('add element to array', async () => {
    const res = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          nested_array: [
            {
              nested_array_title: 'nested_array_title1',
            },
            {
              nested_array_title: 'nested_array_title2',
            },
            {
              nested_array_title: 'nested_array_title3',
            },
          ],
        },
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('test_json_doc').get({ filterByTk: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
        {
          nested_array_title: 'nested_array_title3',
          __json_index: 2,
        },
      ],
    });
  });

  it('delete element in array', async () => {
    const res = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          nested_array: [
            {
              nested_array_title: 'nested_array_title1',
            },
          ],
        },
      },
    });
    expect(res.status).toBe(200);
    const res1 = await agent.resource('test_json_doc').get({ filterByTk: 1 });
    expect(res1.status).toBe(200);
    expect(res1.body.data.json_doc).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
      ],
    });
  });

  it('get by relation', async () => {
    const res = await agent.resource('test_json_doc.json_doc', 1).get();
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      title: 'title',
      __json_index: 0,
      nested_object: {
        nested_object_title: 'nested_object_title',
        __json_index: 0,
      },
      nested_array: [
        {
          nested_array_title: 'nested_array_title1',
          __json_index: 0,
        },
        {
          nested_array_title: 'nested_array_title2',
          __json_index: 1,
        },
      ],
    });
  });
});
