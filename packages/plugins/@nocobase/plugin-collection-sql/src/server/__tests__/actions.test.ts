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

    for (const sql of [
      'select usename, passwd from pg_shadow',
      'select rolname, rolsuper from pg_roles',
      'select * from pg_database',
      'select * from pg_user',
      'select * from pg_stat_all_tables',
      'select * from pg_class',
      'select table_name from information_schema.tables',
      'select * from (select usename, passwd from pg_shadow) as passwords',
    ]) {
      res = await agent.resource('sqlCollection').execute({
        values: {
          sql,
        },
      });
      expect(res.status).toBe(400);
      expect(res.body.errors[0].message).toMatch('SQL statements contain dangerous keywords');
    }

    res = await agent.resource('sqlCollection').execute({
      values: {
        sql: 'select 1) as preview; delete from users; select * from (select 1',
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('Only supports SELECT statements or WITH clauses');
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
        sql: `select * from ${schema}${db.queryInterface.quoteIdentifier('testSqlCollection')};\n`,
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

  it('sqlCollection:update: should check sql', async () => {
    await agent.resource('collections').create({
      values: {
        name: 'fakeCollection',
        fields: [
          {
            name: 'testField1',
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
        ],
      },
    });

    const collection = await db.getRepository('collections').findOne({
      filter: {
        name: 'sqlCollection',
      },
    });

    const updateRes = await agent.resource('sqlCollection').update({
      filterByTk: 'sqlCollection',
      values: {
        key: collection.key,
        sql: "select pg_read_file('/etc/passwd');",
        name: 'sqlCollection',
        fields: [
          {
            name: 'testField1',
            type: 'string',
            interface: 'input',
          },
        ],
      },
    });

    expect(updateRes.status).toBe(400);
    expect(updateRes.body.errors[0].message).toMatch('SQL statements contain dangerous keywords');

    const collectionAfterUpdate = await db.getRepository('collections').findOne({
      filter: {
        name: 'sqlCollection',
      },
    });
    expect(collectionAfterUpdate.options.sql).toBe('select * from "fakeCollection"');
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

  it('persists refreshed enum options for one SQL field while preserving the other override', async () => {
    const oldOptions = [
      { value: 'a', label: 'Old' },
      { value: 'b', label: 'Before' },
    ];
    const newOptions = [
      { value: 'b', label: 'After' },
      { value: 'c', label: 'New' },
    ];
    const status = { name: 'status', type: 'string', interface: 'select', uiSchema: { enum: oldOptions } };
    await agent.resource('collections').create({ values: { name: 'enum_source', fields: [status] } });
    const sql = 'select status as copied, status as manual from enum_source';
    const fields = ['copied', 'manual'].map((name) => ({ ...status, name, source: 'enum_source.status' }));
    await agent.resource('collections').create({ values: { name: 'enum_report', template: 'sql', sql, fields } });
    await agent.resource('collections.fields', 'enum_source').update({
      filterByTk: 'status',
      values: { uiSchema: { enum: newOptions } },
    });
    const preview = await agent.resource('sqlCollection').execute({ values: { sql } });
    expect(preview.status).toBe(200);
    expect(preview.body.data.fields.copied.uiSchema.enum).toEqual(newOptions);
    const response = await agent.resource('sqlCollection').setFields({
      filterByTk: 'enum_report',
      values: {
        fields: [
          { ...fields[0], uiSchema: { ...fields[0].uiSchema, enum: preview.body.data.fields.copied.uiSchema.enum } },
          fields[1],
        ],
      },
    });
    expect(response.status).toBe(200);
    const configured = await db
      .getRepository('fields')
      .find({ filter: { collectionName: 'enum_report' }, sort: ['name'] });
    expect(configured.map((field) => field.get('uiSchema').enum)).toEqual([newOptions, oldOptions]);
  });

  it('should check sql when creating', async () => {
    const res = await agent.resource('collections').create({
      values: {
        name: 'sqlCollection',
        sql: "select pg_read_file('/etc/passwd')",
        template: 'sql',
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.errors[0].message).toMatch('SQL statements contain dangerous keywords');
  });
});
