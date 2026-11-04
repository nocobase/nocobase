/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';
import { createApp } from '.';

describe.each(['', 'nb_'])('sync loaded tables with table prefix "%s"', (tablePrefix) => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let tableName: string;

  beforeEach(async () => {
    app = await createApp({
      database: { tablePrefix },
      plugins: ['data-source-manager'],
    });
    tableName = `external_${uid(6)}`;
    await app.db.sequelize.getQueryInterface().createTable(
      { tableName, schema: app.db.options.schema },
      {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        title: { type: DataTypes.STRING, allowNull: true },
        obsolete: { type: DataTypes.STRING },
      },
    );
    const response = await app
      .agent()
      .resource('dataSources')
      .loadTables({
        values: { dataSourceKey: 'main', tables: [tableName] },
      });
    expect(response.status).toBe(200);
    const collection = await app.db.getRepository('collections').findOne({ filterByTk: tableName });
    expect(collection.get('from')).toBe('dbsync');
    expect(app.db.getCollection(tableName).model.tableName).toBe(tableName);
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it.each([false, true])('should sync added, changed and removed columns (all collections: %s)', async (syncAll) => {
    const db = app.db;
    const queryInterface = db.sequelize.getQueryInterface();
    const physicalTable = db.getCollection(tableName).getTableNameWithSchema();
    await queryInterface.addColumn(physicalTable, 'description', { type: DataTypes.TEXT });
    await queryInterface.changeColumn(physicalTable, 'title', { type: DataTypes.TEXT, allowNull: false });
    await queryInterface.removeColumn(physicalTable, 'obsolete');

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({
        values: syncAll ? {} : { collections: [tableName] },
      });
    expect(response.status).toBe(200);

    const fields = await db.getRepository('fields').find({ filter: { collectionName: tableName } });
    expect(fields.find((field) => field.get('name') === 'description')?.get('type')).toBe('text');
    const titleField = fields.find((field) => field.get('name') === 'title');
    expect(titleField?.get('type')).toBe('text');
    expect(titleField?.get('allowNull')).toBe(false);
    expect(fields.some((field) => field.get('name') === 'obsolete')).toBe(false);

    const collection = db.getCollection(tableName);
    expect(collection.model.tableName).toBe(tableName);
    expect(collection.getField('description')?.options.type).toBe('text');
    expect(collection.getField('title')?.options.type).toBe('text');
    expect(collection.getField('title')?.options.allowNull).toBe(false);
    expect(collection.getField('obsolete')).toBeUndefined();
    await collection.repository.create({ values: { id: 1, title: 'Updated', description: 'Synced' } });
    const record = await collection.repository.findOne({ filterByTk: 1 });
    expect(record.get('description')).toBe('Synced');

    const collectionRecord = await db.getRepository('collections').findOne({ filterByTk: tableName });
    expect(collectionRecord.get('from')).toBe('dbsync');
    const tables = await queryInterface.showAllTables();
    expect(tables).toContain(tableName);
    if (tablePrefix) {
      expect(tables).not.toContain(`${tablePrefix}${tableName}`);
    }
  });

  it('should keep plugin-defined collections excluded from field synchronization', async () => {
    await app.db.getRepository('collections').update({ filterByTk: tableName, values: { from: 'db2cm' } });
    const collection = app.db.getCollection(tableName);
    await app.db.sequelize.getQueryInterface().addColumn(collection.getTableNameWithSchema(), 'description', {
      type: DataTypes.TEXT,
    });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({
        values: { collections: [tableName] },
      });
    expect(response.status).toBe(200);
    const field = await app.db.getRepository('fields').findOne({
      filter: { collectionName: tableName, name: 'description' },
    });
    expect(field).toBeNull();
    expect(collection.getField('description')).toBeUndefined();
  });
});
