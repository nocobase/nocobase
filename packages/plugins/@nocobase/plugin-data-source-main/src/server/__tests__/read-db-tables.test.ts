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
    let sequelize: Sequelize;

    beforeEach(async () => {
      app = await createApp();
      db = app.db;

      const queryInterface = db.sequelize.getQueryInterface();

      const schema = (db.sequelize as any).options?.schema;

      const getTableName = (tableName: string) => {
        return {
          tableName,
          schema: schema || undefined,
        };
      };

      await queryInterface.createTable(getTableName('table1'), {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      });

      await queryInterface.createTable(getTableName('table2'), {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        description: {
          type: DataTypes.TEXT,
        },
      });

      await queryInterface.createTable(getTableName('table3'), {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
      });
    });

    afterEach(async () => {
      if (sequelize) {
        await sequelize.close();
      }
      await app.destroy();
    });

    it('get selectable tables', async () => {
      const response = await app.agent().resource('collections').selectable();
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((x) => x.name === 'table1')).toBeTruthy();
      expect(response.body.data.some((x) => x.name === 'table2')).toBeTruthy();
      expect(response.body.data.some((x) => x.name === 'table3')).toBeTruthy();
    });

    it('add tables to collections', async () => {
      const tableNames = ['table1', 'table2', 'table3'];

      let collections = await db.getRepository('collections').find({
        where: { name: tableNames },
      });
      expect(collections.length).toBe(0);

      const response = await app.agent().resource('collections').add({
        values: tableNames,
      });
      expect(response.status).toBe(200);

      await new Promise((resolve) => setTimeout(resolve, 100));
      collections = await db.getRepository('collections').find({
        where: { name: tableNames },
      });

      expect(collections.length).toBe(3);
      const listReponse = await app.agent().resource('collections').list();
      expect(listReponse.status).toBe(200);

      tableNames.forEach((tableName) => {
        expect(listReponse.body.data.some((x) => x.name === tableName)).toBeTruthy();
      });
    });
  });
});
