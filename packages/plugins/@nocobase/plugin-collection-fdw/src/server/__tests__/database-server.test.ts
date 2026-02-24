/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { MockServer } from '@nocobase/test';
import { createApp, testCondition } from './helper';
import * as process from 'process';
import { ForeignDataCollection } from '../foreign-data-collection';

describe.runIf(testCondition)('database server', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createApp();
    await app.db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            name: 'test',
            type: 'string',
          },
        ],
      },
      context: {},
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should test connection params', async () => {
    const res = await app
      .agent()
      .resource('databaseServers')
      .testConnection({
        values: {
          name: 'test1',
          host: '127.0.0.1',
          database: 'xxx',
          username: 'xxx',
          password: 'xxx',
          port: '9999',
        },
      });

    console.log(res.body);
    expect(res.status).not.toBe(200);
  });

  it('should throw error when database server can not connect', async () => {
    const res = await app
      .agent()
      .resource('databaseServers')
      .create({
        values: {
          name: 'test1',
          host: '127.0.0.1',
          database: 'xxx',
          username: 'xxx',
          password: 'xxx',
          port: '5432',
        },
      });

    expect(res.status).not.toBe(200);
  });

  it('should create remote collection', async () => {
    const res = await app
      .agent()
      .resource('databaseServers')
      .create({
        values: {
          name: 'test1',
          host: process.env.DB_HOST,
          database: process.env.DB_DATABASE,
          username: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          port: process.env.DB_PORT,
        },
      });

    expect(res.status).toBe(200);

    const serversListRes = await app.agent().resource('databaseServers').list();
    expect(serversListRes.status).toBe(200);
    const data = serversListRes.body;
    expect(data.meta.count).toBe(1);

    const remoteCollection = app.db.collection({
      name: 'tests',
      tableName: 'test_table',
      timestamps: false,
      fields: [
        {
          type: 'string',
          name: 'name',
          allowNull: true,
        },
        {
          type: 'text',
          name: 'description',
          allowNull: true,
        },
        {
          type: 'string',
          name: 'uniqueTest',
          unique: true,
          allowNull: false,
        },
      ],
    });

    await remoteCollection.sync();

    await remoteCollection.repository.create({
      values: [
        {
          name: 'test1',
          uniqueTest: 'test1',
        },
        {
          name: 'test2',
          uniqueTest: 'test2',
        },
        {
          name: 'test3',
          uniqueTest: 'test3',
        },
      ],
    });

    // get remote table list
    const tablesListRes = await app.agent().resource('databaseServers.tables', 'test1').list();
    expect(tablesListRes.status).toBe(200);
    const tableList = tablesListRes.body.data;

    const testTableInfo = tableList.find((table) => {
      if (remoteCollection.options.schema)
        return table.schema === remoteCollection.options.schema && table.name === 'test_table';

      return table.name === 'test_table';
    });

    expect(testTableInfo).toBeTruthy();

    // get remote table fields and options
    const tableFieldsRes = await app
      .agent()
      .resource('databaseServers.tables', 'test1')
      .get({
        filterByTk: testTableInfo.schema ? `${testTableInfo.schema}.${testTableInfo.name}` : testTableInfo.name,
      });

    expect(tableFieldsRes.status).toBe(200);

    const tableData = tableFieldsRes.body.data;
    const fieldsInfoAsArray = tableData.fields;

    const fieldsInfo = fieldsInfoAsArray.reduce((acc, field) => {
      acc[field.name] = field;
      return acc;
    }, {});

    expect(fieldsInfo.id).toMatchObject({
      type: 'bigInt',
      name: 'id',
      allowNull: false,
      primaryKey: true,
      unique: true,
    });

    expect(fieldsInfo.name).toMatchObject({
      type: 'string',
      name: 'name',
      allowNull: true,
      primaryKey: false,
      unique: false,
    });

    const uniqueTestFieldName = remoteCollection.model.rawAttributes['uniqueTest'].field;

    expect(fieldsInfo[uniqueTestFieldName]).toMatchObject({
      type: 'string',
      name: uniqueTestFieldName,
      allowNull: false,
      primaryKey: false,
      unique: true,
    });

    // preview data
    const previewRes = await app
      .agent()
      .resource('databaseServers.tables', 'test1')
      .query({
        filterByTk: testTableInfo.schema ? `${testTableInfo.schema}.${testTableInfo.name}` : testTableInfo.name,
      });

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.length).toBe(3);

    const fields = Object.keys(fieldsInfo).map((fieldName) => {
      return {
        name: fieldName,
        ...fieldsInfo[fieldName],
      };
    });

    for (const field of fields) {
      if (field.name === 'created_at' || field.name === 'createdAt') {
        field.interface = 'createdAt';
      }

      if (field.name === 'updated_at' || field.name === 'updatedAt') {
        field.interface = 'updatedAt';
      }
    }

    // create RemoteTableCollection in local database
    await app.db.getRepository('collections').create({
      values: {
        name: 'testCollection',
        remoteServerName: 'test1',
        remoteTableInfo: {
          tableName: 'test_table',
          schema: testTableInfo.schema,
        },
        fields,
      },
      context: {},
    });

    const testCollection = app.db.getCollection('testCollection');
    expect(testCollection).toBeInstanceOf(ForeignDataCollection);

    const testCollectionTable = await app.db.sequelize
      .getQueryInterface()
      .describeTable(testCollection.getTableNameWithSchema());

    const records = await testCollection.repository.find();
    expect(records.length).toBe(3);

    // create new instance
    await testCollection.model.create({
      name: 'test4',
      [uniqueTestFieldName]: 'test4',
    });

    // insert new record
    // await testCollection.repository.create({
    //   values: {
    //     name: 'test4',
    //     [uniqueTestFieldName]: 'test4',
    //   },
    // });

    const tableIdentify = testTableInfo.schema ? `${testTableInfo.schema}.${testTableInfo.name}` : testTableInfo.name;
    // sync new field
    await app.db.sequelize.query(`ALTER TABLE ${tableIdentify}
      ADD COLUMN age VARCHAR(255);`);

    const syncFieldResp = await app
      .agent()
      .resource('collections')
      .setFields({
        filterByTk: 'testCollection',
        values: {
          fields: [
            {
              name: 'id',
              type: 'integer',
            },
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'age',
              type: 'string',
            },
          ],
        },
      });

    expect(syncFieldResp.status).toBe(200);
    await testCollection.repository.find();

    if (app.db.inDialect('postgres')) {
      await app.db.sequelize.query(`ALTER TABLE ${tableIdentify} ALTER COLUMN age TYPE INTEGER USING age::integer`);
    }

    if (app.db.inDialect('mysql')) {
      await app.db.sequelize.query(`ALTER TABLE ${tableIdentify} MODIFY COLUMN age INTEGER`);
    }

    const syncFieldResp2 = await app
      .agent()
      .resource('collections')
      .setFields({
        filterByTk: 'testCollection',
        values: {
          fields: [
            {
              name: 'id',
              type: 'integer',
            },
            {
              name: 'name',
              type: 'string',
            },
            {
              name: 'age',
              type: 'integer',
            },
          ],
        },
      });

    expect(syncFieldResp2.status).toBe(200);
    await testCollection.repository.find();

    // remove remote collection
    await app.db.getRepository('collections').destroy({
      filter: {
        name: 'testCollection',
      },
      context: {},
    });
  });
});
