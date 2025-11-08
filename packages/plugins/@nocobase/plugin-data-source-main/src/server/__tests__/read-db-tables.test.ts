/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { createMockDatabase } from '@nocobase/database';
import { Plugin } from '@nocobase/server';
import { createApp } from '.';
import { DataTypes, Sequelize } from 'sequelize';

describe('db2cm test', () => {
  let db: Database;
  let app: any;

  describe('uiManageable test', async () => {
    afterEach(async () => {
      await app.destroy();
    });
    class Plugin1 extends Plugin {
      static collection = {
        name: 'hello',
        fields: [
          {
            name: 'id',
            type: 'bigInt',
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
            uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
            interface: 'id',
          },
          {
            type: 'string',
            name: 'name',
            interface: 'input',
            uiSchema: {
              type: 'string',
              title: '{{t("Hello name")}}',
              'x-component': 'Input',
            },
          },
        ],
        uiManageable: true,
      };
      async loadCollections() {
        this.app.collection(Plugin1.collection);
      }
    }

    it('should have plugin-defined collections in collections table when plugin is installed', async () => {
      app = await createApp({
        plugins: [Plugin1],
      });
      db = app.db;
      expect(app.pm.get(Plugin1).enabled).toBeTruthy();
      const collections = await db.getRepository('collections').find();
      expect(collections.some((c) => c.name === 'hello')).toBeTruthy();
    });

    it('should not allow delete collection', async () => {
      app = await createApp({
        plugins: [Plugin1],
      });
      db = app.db;
      const response = await app.agent().resource('collections').destroy({
        filterByTk: 'hello',
      });
      expect(response.status).toBe(500);
      const collections = await db.getRepository('collections').find();
      expect(collections.some((c) => c.name === 'hello')).toBeTruthy();
    });

    it('should not allow delete fields', async () => {
      app = await createApp({
        plugins: [Plugin1],
      });
      db = app.db;
      const response = await app.agent().resource('collections.fields', 'hello').destroy({
        filterByTk: 'name',
      });
      expect(response.status).toBe(500);
      const fields = await db.getRepository('fields').find({ filter: { collectionName: 'hello' } });
      expect(fields.some((c) => c.name === 'name')).toBeTruthy();
    });
  });

  describe.skipIf(process.env.DB_DIALECT === 'sqlite')('read db tables', async () => {
    let queryInterface: any;
    let schema: string;

    beforeEach(async () => {
      app = await createApp({
        plugins: ['data-source-manager'],
      });
      db = app.db;

      queryInterface = db.sequelize.getQueryInterface();
      schema = db.options.schema;
    });

    afterEach(async () => {
      await db.clean({ drop: true });
      await app.destroy();
    });

    it('get available tables', async () => {
      await queryInterface.createTable(
        {
          schema,
          tableName: 'table',
        },
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
        },
      );
      const response = await app
        .agent()
        .resource('dataSources')
        .readTables({
          values: {
            dataSourceKey: 'main',
          },
        });
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('table');
    });

    it('load table', async () => {
      await queryInterface.createTable(
        {
          schema,
          tableName: 'table',
        },
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
          },
          name: {
            type: DataTypes.STRING,
            allowNull: false,
          },
        },
      );
      const tables = ['table'];

      let collections = await db.getRepository('collections').find({
        filter: { name: tables },
      });
      expect(collections.length).toBe(0);

      const response = await app
        .agent()
        .resource('dataSources')
        .loadTables({
          values: {
            dataSourceKey: 'main',
            tables,
          },
        });
      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 100));
      collections = await db.getRepository('collections').find({
        filter: { name: tables },
      });

      expect(collections.length).toBe(1);
    });
  });
});
