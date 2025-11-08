/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database from '@nocobase/database';
import Application, { Plugin } from '@nocobase/server';
import { createApp } from '.';

describe('db2cm test', () => {
  let db: Database;
  let app: any;

  afterEach(async () => {
    await app.destroy();
  });

  describe('uiManageable test', async () => {
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
});
