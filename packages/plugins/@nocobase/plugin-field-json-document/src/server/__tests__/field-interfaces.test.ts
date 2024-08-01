/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PasswordField } from '@nocobase/database';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('field interfaces for json document', () => {
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
      },
    });
    // @ts-ignore
    await db.getRepository('collections').load();
    await db.sync();
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('password', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'password',
            type: 'password',
          },
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'password',
                type: 'password',
              },
              {
                name: 'nested_json_array',
                type: 'JSONDocument',
                fields: [
                  {
                    name: 'password',
                    type: 'password',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    const res2 = await agent.resource('test_json_doc').create({
      values: {
        json_doc: {
          password: '123',
          nested_json_doc: {
            password: '123',
            nested_json_array: [
              {
                password: '123',
              },
            ],
          },
        },
      },
    });
    expect(res2.status).toBe(200);
    const id = res2.body.data.id;
    const res3 = await agent.resource('test_json_doc.json_doc', id).get();
    expect(res3.status).toBe(200);
    const pwd = new PasswordField({}, {} as any);
    expect(await pwd.verify('123', res3.body.data.password)).toBe(true);
    expect(await pwd.verify('123', res3.body.data.nested_json_doc.password)).toBe(true);
    expect(await pwd.verify('123', res3.body.data.nested_json_doc.nested_json_array[0].password)).toBe(true);
    const res4 = await agent.resource('test_json_doc').update({
      filterByTk: 1,
      values: {
        json_doc: {
          password: null,
          nested_json_doc: {
            password: null,
            nested_json_array: [
              {
                password: null,
              },
            ],
          },
        },
      },
    });
    expect(res4.status).toBe(200);
    const res5 = await agent.resource('test_json_doc.json_doc', id).get();
    expect(res5.status).toBe(200);
    console.log(res5.body.data);
    expect(await pwd.verify('123', res5.body.data.password)).toBe(true);
    expect(await pwd.verify('123', res5.body.data.nested_json_doc.password)).toBe(true);
    expect(await pwd.verify('123', res5.body.data.nested_json_doc.nested_json_array[0].password)).toBe(true);
  });
});
