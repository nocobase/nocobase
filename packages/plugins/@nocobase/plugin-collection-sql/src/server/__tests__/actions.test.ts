/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { SQLModel } from '../sql-collection';
import { MockServer, createMockServer } from '@nocobase/test';

describe('sql collection', () => {
  let app: MockServer;
  let db: Database;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'data-source-main', 'error-handler', 'collection-sql'],
    });
    db = app.db;
    db.options.underscored = false;
    agent = app.agent();
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('sqlCollection:execute: should check sql', async () => {
    let res = await agent.resource('sqlCollection').execute();
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('Please enter a SQL statement');

    res = await agent.resource('sqlCollection').execute({
      values: {
        sql: 'insert into users (username) values ("test")',
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('Only supports SELECT statements or WITH clauses');

    res = await agent.resource('sqlCollection').execute({
      values: {
        sql: "select pg_read_file('/etc/passwd');",
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('SQL statements contain dangerous keywords');
  });

  it('sqlCollection:execute', async () => {
    await agent.resource('collections').create({
      values: {
        schema: process.env.DB_SCHEMA,
        name: 'testSqlCollection',
        fields: [
          {
            name: 'testField',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await agent.resource('testSqlCollection').create({
      values: {
        testField: 'test',
      },
    });
    const schema = process.env.DB_SCHEMA ? `${process.env.DB_SCHEMA}.` : ``;
    const res = await agent.resource('sqlCollection').execute({
      values: {
        sql: `select * from ${schema}${db.queryInterface.quoteIdentifier('testSqlCollection')}`,
      },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.data.length).toBe(1);
    expect(res.body.data.fields).toMatchObject({
      testField: {
        type: 'string',
        source: 'testSqlCollection.testField',
        collection: 'testSqlCollection',
        interface: 'input',
      },
    });
    expect(res.body.data.sources).toEqual(['testSqlCollection']);
  });

  it('sqlCollection:update', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'fakeCollection',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'testField2',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await agent.resource('collections').create({
      values: {
        name: 'sqlCollection',
        sql: 'select * from "fakeCollection"',
        template: 'sql',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'testField2',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    const collection = await db.getRepository('collections').findOne({
      filter: {
        name: 'sqlCollection',
      },
    });
    expect(collection.options.sql).toBe('select * from "fakeCollection"');
    const loadedModel = db.getModel('sqlCollection') as typeof SQLModel;
    expect(loadedModel.sql).toBe('select * from "fakeCollection"');
    const fields = await db.getRepository('fields').find({
      filter: {
        collectionName: 'sqlCollection',
      },
    });
    expect(fields.length).toBe(2);
    const loadedFields = db.getCollection('sqlCollection').fields;
    expect(loadedFields.size).toBe(2);
    const updateRes = await agent.resource('sqlCollection').update({
      filterByTk: 'sqlCollection',
      values: {
        key: collection.key,
        sql: 'select "testField1" from "fakeCollection"',
        name: 'sqlCollection',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
            collectionName: 'sqlCollection',
            key: fields.find((f) => f.name === 'testField1').key,
          },
        ],
        sources: ['fakeCollection'],
      },
    });
    expect(updateRes.status).toBe(200);

    const listMetaRes = await agent.resource('collections').listMeta();
    const metaData = listMetaRes.body.data;
    const sqlCollectionData = metaData.find((item) => item.name === 'sqlCollection');
    const metaFields = sqlCollectionData.fields;
    expect(metaFields.length).toBe(1);
    const collection2 = await db.getRepository('collections').findOne({
      filter: {
        name: 'sqlCollection',
      },
    });
    expect(collection2.options.sql).toBe('select "testField1" from "fakeCollection"');
    const loadedModel2 = db.getModel('sqlCollection') as typeof SQLModel;
    expect(loadedModel2.sql).toBe('select "testField1" from "fakeCollection"');
    const fields2 = await db.getRepository('fields').find({
      filter: {
        collectionName: 'sqlCollection',
      },
    });
    expect(fields2.length).toBe(1);
    const loadedFields2 = db.getCollection('sqlCollection').fields;
    expect(loadedFields2.size).toBe(1);
  });

  it('sqlCollection:setFields', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'fakeCollection',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'testField2',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    await agent.resource('collections').create({
      values: {
        name: 'sqlCollection',
        sql: 'select * from "fakeCollection"',
        template: 'sql',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
          {
            name: 'testField2',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    const fields = await db.getRepository('fields').find({
      filter: {
        collectionName: 'sqlCollection',
      },
    });
    expect(fields.length).toBe(2);
    const loadedFields = db.getCollection('sqlCollection').fields;
    expect(loadedFields.size).toBe(2);
    await agent.resource('sqlCollection').setFields({
      filterByTk: 'sqlCollection',
      values: {
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });
    const fields2 = await db.getRepository('fields').find({
      filter: {
        collectionName: 'sqlCollection',
      },
    });
    expect(fields2.length).toBe(1);
    const loadedFields2 = db.getCollection('sqlCollection').fields;
    expect(loadedFields2.size).toBe(1);
  });

  it('should check sql when creating', async () => {
    const res = await agent.resource('collections').create({
      values: {
        name: 'sqlCollection',
        sql: "select pg_read_file('/etc/passwd');",
        template: 'sql',
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('SQL statements contain dangerous keywords');
  });
});
