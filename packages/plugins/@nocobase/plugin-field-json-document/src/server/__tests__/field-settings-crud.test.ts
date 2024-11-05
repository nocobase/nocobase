/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('crud for settings of json document field', () => {
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

  it('create', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    expect(res.body.data.target).toBe(collectionName);
    expect(res.body.data.targetKey).toBe('__json_index');
    const collectionModel = await db.getRepository('collections').findOne({
      filterByTk: collectionName,
      appends: ['fields'],
    });
    expect(collectionModel).toBeTruthy();
    expect(collectionModel.fields.length).toBe(2);
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    expect(collection.options.json).toBe(true);
    const fields = collection.getFields();
    expect(fields.length).toBe(2);
    const indexField = collection.getField('__json_index');
    expect(indexField).toBeTruthy();
    const field = collection.getField('title');
    expect(field).toBeTruthy();
  });

  it('create with empty fields', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
      },
    });
    expect(res.status).toBe(500);
    expect(res.body.errors[0].message).toBe('Fields is required for json document');
  });

  it('destroy', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collectionModel = await db.getRepository('collections').findOne({
      filterByTk: collectionName,
    });
    expect(collectionModel).toBeTruthy();
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const fields = collection.getFields();
    expect(fields.length).toBe(2);

    await agent.resource('collections.fields', 'test_json_doc').destroy({
      filterByTk: 'json_doc',
    });
    expect(res.status).toBe(200);
    const collectionModel2 = await db.getRepository('collections').findOne({
      filterByTk: collectionName,
    });
    expect(collectionModel2).toBeFalsy();
    const fieldsCount = await db.getRepository('fields').count({
      filter: {
        collectionName,
      },
    });
    expect(fieldsCount).toBe(0);
    const collection2 = db.getCollection(collectionName);
    expect(collection2).toBeFalsy();
  });

  it('add field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'id',
            type: 'integer',
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').find({
      filter: {
        name: 'id',
        collectionName,
      },
    });
    expect(fieldModel).toBeTruthy();
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const field = collection.getField('id');
    expect(field).toBeTruthy();
  });

  it('update field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const field = collection.getField('title');
    const fieldKey = field.options.key;
    expect(field.options.description).toBeFalsy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: fieldKey,
            name: 'title',
            type: 'string',
            description: 'title description',
            collectionName,
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').findOne({
      filter: {
        key: fieldKey,
        collectionName,
      },
    });
    expect(fieldModel).toBeTruthy();
    expect(fieldModel.description).toBe('title description');
    const field2 = collection.getField('title');
    expect(field2).toBeTruthy();
    expect(field2.options.description).toBe('title description');
  });

  it('destroy field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'id',
            type: 'integer',
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const field = collection.getField('id');
    expect(field).toBeTruthy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: collection.getField('title').options.key,
            name: 'title',
            type: 'string',
            collectionName,
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').findOne({
      filter: {
        name: 'id',
        collectionName,
      },
    });
    expect(fieldModel).toBeFalsy();
    const field2 = collection.getField('id');
    expect(field2).toBeFalsy();
  });

  it('create nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const collectionModel = await db.getRepository('collections').findOne({
      filterByTk: nestedCollectionName,
      appends: ['fields'],
    });
    expect(collectionModel).toBeTruthy();
    expect(collectionModel.fields.length).toBe(2);
    const nestedCollection = db.getCollection(nestedCollectionName);
    expect(nestedCollection).toBeTruthy();
    const fields = nestedCollection.getFields();
    expect(fields.length).toBe(2);
    const indexField = nestedCollection.getField('__json_index');
    expect(indexField).toBeTruthy();
    const field = nestedCollection.getField('title');
    expect(field).toBeTruthy();
  });

  it('destroy nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'id',
            type: 'integer',
          },
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const nestedCollection = db.getCollection(nestedCollectionName);
    expect(nestedCollection).toBeTruthy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: collection.getField('id').options.key,
            name: 'id',
            type: 'integer',
            collectionName,
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const collectionModel = await db.getRepository('collections').findOne({
      filterByTk: nestedCollectionName,
    });
    expect(collectionModel).toBeFalsy();
    const nestedCollection2 = db.getCollection(nestedCollectionName);
    expect(nestedCollection2).toBeFalsy();
  });

  it('add field to nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const nestedCollection = db.getCollection(nestedCollectionName);
    const field = nestedCollection.getField('id');
    expect(field).toBeFalsy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: nestedFieldKey,
            collectionName,
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                key: nestedCollection.getField('title').options.key,
                name: 'title',
                type: 'string',
                collectionName: nestedCollectionName,
              },
              {
                name: 'id',
                type: 'integer',
              },
            ],
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').findOne({
      filter: {
        name: 'id',
        collectionName: nestedCollectionName,
      },
    });
    expect(fieldModel).toBeTruthy();
    const field2 = nestedCollection.getField('id');
    expect(field2).toBeTruthy();
  });

  it('update field in nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const nestedCollection = db.getCollection(nestedCollectionName);
    const field = nestedCollection.getField('title');
    const fieldKey = field.options.key;
    expect(field.options.description).toBeFalsy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: nestedFieldKey,
            collectionName,
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                key: fieldKey,
                name: 'title',
                type: 'string',
                collectionName: nestedCollectionName,
                description: 'title description',
              },
            ],
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').findOne({
      filter: {
        key: fieldKey,
        collectionName: nestedCollectionName,
      },
    });
    expect(fieldModel).toBeTruthy();
    expect(fieldModel.description).toBe('title description');
    const field2 = nestedCollection.getField('title');
    expect(field2).toBeTruthy();
    expect(field2.options.description).toBe('title description');
  });

  it('destroy field in nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
              {
                name: 'id',
                type: 'integer',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const nestedCollection = db.getCollection(nestedCollectionName);
    const field = nestedCollection.getField('id');
    expect(field).toBeTruthy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').update({
      filterByTk: 'json_doc',
      values: {
        fields: [
          {
            key: nestedFieldKey,
            collectionName,
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                key: nestedCollection.getField('title').options.key,
                name: 'title',
                type: 'string',
                collectionName: nestedCollectionName,
              },
            ],
          },
        ],
      },
    });
    expect(res2.status).toBe(200);
    const fieldModel = await db.getRepository('fields').findOne({
      filter: {
        name: 'id',
        collectionName: nestedCollectionName,
      },
    });
    expect(fieldModel).toBeFalsy();
    const field2 = nestedCollection.getField('id');
    expect(field2).toBeFalsy();
  });

  it('destroy json document has nested field', async () => {
    const res = await agent.resource('collections.fields', 'test_json_doc').create({
      values: {
        name: 'json_doc',
        type: 'JSONDocument',
        fields: [
          {
            name: 'nested_json_doc',
            type: 'JSONDocument',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
            ],
          },
        ],
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
    const key = res.body.data.key;
    const collectionName = `${key}_json_collection`;
    const collection = db.getCollection(collectionName);
    expect(collection).toBeTruthy();
    const nestedField = collection.getField('nested_json_doc');
    expect(nestedField).toBeTruthy();
    const nestedFieldKey = nestedField.options.key;
    const nestedCollectionName = `${nestedFieldKey}_json_collection`;
    const nestedCollection = db.getCollection(nestedCollectionName);
    expect(nestedCollection).toBeTruthy();
    const res2 = await agent.resource('collections.fields', 'test_json_doc').destroy({
      filterByTk: 'json_doc',
    });
    expect(res2.status).toBe(200);
    const collections = await db.getRepository('collections').count({
      filter: {
        name: [collectionName, nestedCollectionName],
      },
    });
    expect(collections).toBe(0);
    const collection2 = db.getCollection(collectionName);
    expect(collection2).toBeFalsy();
    const nestedCollection2 = db.getCollection(nestedCollectionName);
    expect(nestedCollection2).toBeFalsy();
  });
});
