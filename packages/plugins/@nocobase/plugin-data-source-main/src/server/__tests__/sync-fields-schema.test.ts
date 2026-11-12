/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MainDataSource } from '@nocobase/server';
import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';
import { createApp } from '.';

describe.runIf(process.env.DB_DIALECT === 'postgres')('sync fields across database schemas', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let schemas: string[];

  beforeEach(async () => {
    app = await createApp({ plugins: ['data-source-manager'] });
    schemas = [`sync_a_${uid(6)}`, `sync_b_${uid(6)}`];
    for (const schema of schemas) {
      await app.db.sequelize.createSchema(schema, {});
    }
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    for (const schema of schemas) {
      await app.db.sequelize.dropSchema(schema, {});
    }
    await app.destroy();
  });

  it('should pair same-named physical tables with their original logical collections', async () => {
    const db = app.db;
    const dataSource = app.dataSourceManager.get('main') as MainDataSource;
    const tableName = `shared_${uid(6)}`;
    const names = [`first_${uid(6)}`, `second_${uid(6)}`];
    const queryInterface = db.sequelize.getQueryInterface();
    for (const [index, schema] of schemas.entries()) {
      const tableInfo = { tableName, schema };
      await queryInterface.createTable(tableInfo, {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        title: { type: DataTypes.STRING },
      });
      const options = await dataSource.introspector.getCollection({ tableInfo });
      const response = await app
        .agent()
        .resource('collections')
        .create({
          values: {
            ...options,
            name: names[index],
            from: 'dbsync',
            fields: options.fields.map((field) => ({ ...field, uiSchema: { ...field.uiSchema, title: names[index] } })),
          },
        });
      expect(response.status).toBe(200);
    }
    const fieldsBefore = await db.getRepository('fields').find({ filter: { collectionName: names } });
    await queryInterface.addColumn({ tableName, schema: schemas[0] }, 'firstColumn', { type: DataTypes.TEXT });
    await queryInterface.addColumn({ tableName, schema: schemas[1] }, 'secondColumn', { type: DataTypes.TEXT });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: names } });
    expect(response.status).toBe(200);
    for (const [index, name] of names.entries()) {
      const collection = db.getCollection(name);
      expect(collection.getField(index === 0 ? 'firstColumn' : 'secondColumn')?.options.type).toBe('text');
      expect(collection.getField(index === 0 ? 'secondColumn' : 'firstColumn')).toBeUndefined();
      expect(collection.getField('title')?.options.uiSchema.title).toBe(name);
      expect(db.utils.quoteTable(collection.getTableNameWithSchema())).toBe(
        db.utils.quoteTable({ tableName, schema: schemas[index] }),
      );
    }
    for (const field of fieldsBefore) {
      const fieldAfter = await db.getRepository('fields').findOne({ filterByTk: field.get('key') });
      expect(fieldAfter).toBeTruthy();
    }
  });
});
