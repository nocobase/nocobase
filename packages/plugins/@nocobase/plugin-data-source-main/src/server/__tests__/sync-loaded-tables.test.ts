/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import { MainDataSource } from '@nocobase/server';
import { DataTypes, QueryTypes } from 'sequelize';
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
    vi.restoreAllMocks();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  async function changeTitleToUnsupportedType() {
    const db = app.db;
    const physicalTable = db.getCollection(tableName).getTableNameWithSchema();
    if (db.inDialect('postgres')) {
      await db.sequelize.query(
        `ALTER TABLE ${db.utils.quoteTable(physicalTable)} ALTER COLUMN "title" TYPE BYTEA USING convert_to("title", 'UTF8')`,
      );
    } else {
      await db.sequelize.getQueryInterface().changeColumn(physicalTable, 'title', { type: DataTypes.BLOB });
    }
  }

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

  it('should preserve field metadata and associations when the physical table name includes the prefix', async () => {
    const db = app.db;
    const name = `prefixed_${uid(6)}`;
    const physicalTable = { tableName: `${tablePrefix}${name}`, schema: db.options.schema };
    await db.sequelize.getQueryInterface().createTable(physicalTable, {
      id: { type: DataTypes.INTEGER, primaryKey: true },
      title: { type: DataTypes.STRING },
    });
    const loaded = await app
      .agent()
      .resource('dataSources')
      .loadTables({
        values: { dataSourceKey: 'main', tables: [physicalTable.tableName] },
      });
    expect(loaded.status).toBe(200);
    const customized = await app
      .agent()
      .resource('collections.fields', name)
      .update({
        filterByTk: 'title',
        values: { uiSchema: { title: 'Customized title' } },
      });
    expect(customized.status).toBe(200);
    const alias = await app
      .agent()
      .resource('collections.fields', name)
      .create({
        values: { name: 'titleAlias', field: 'title', type: 'string', interface: 'input' },
      });
    expect(alias.status).toBe(200);
    const association = await app
      .agent()
      .resource('collections.fields', name)
      .create({
        values: { name: 'related', type: 'hasMany', target: tableName, foreignKey: 'parentId', interface: 'o2m' },
      });
    expect(association.status).toBe(200);
    const before = await db.getRepository('fields').find({ filter: { collectionName: name } });
    await db.sequelize.getQueryInterface().addColumn(physicalTable, 'description', { type: DataTypes.TEXT });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: [name] } });
    expect(response.status).toBe(200);
    const after = await db.getRepository('fields').find({ filter: { collectionName: name } });
    for (const field of before) {
      expect(after.find((candidate) => candidate.get('name') === field.get('name'))?.get('key')).toBe(field.get('key'));
    }
    expect(after.find((field) => field.get('name') === 'title')?.get('uiSchema').title).toBe('Customized title');
    const collection = db.getCollection(name);
    expect(collection.model.tableName).toBe(physicalTable.tableName);
    expect(collection.getField('titleAlias')?.options.field).toBe('title');
    expect(collection.getField('related')?.options.target).toBe(tableName);
    expect(collection.getField('description')?.options.type).toBe('text');
  });

  it.each(['en-US', 'zh-CN'])('should reject unsupported existing types without changing data (%s)', async (locale) => {
    const db = app.db;
    const collection = db.getCollection(tableName);
    await collection.repository.create({ values: { id: 1, title: 'Must preserve' } });
    const before = await db.getRepository('fields').find({ filter: { collectionName: tableName } });
    await changeTitleToUnsupportedType();
    const queryInterface = db.sequelize.getQueryInterface();
    const physicalTable = collection.getTableNameWithSchema();
    const beforeColumns = await queryInterface.describeTable(physicalTable);
    const beforeRows = await db.sequelize.query(`SELECT * FROM ${db.utils.quoteTable(physicalTable)}`, {
      type: QueryTypes.SELECT,
    });
    const removeColumn = vi.spyOn(queryInterface, 'removeColumn');

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ locale, values: { collections: [tableName] } });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toContain(tableName);
    expect(response.body.errors[0].message).toContain('title');
    expect(response.body.errors[0].message).toContain(beforeColumns.title.type);
    expect(response.body.errors[0].message).toContain(locale === 'zh-CN' ? '不支持数据库类型' : 'is not supported');
    expect(removeColumn).not.toHaveBeenCalled();
    const after = await db.getRepository('fields').find({ filter: { collectionName: tableName } });
    expect(after.map((field) => field.toJSON())).toEqual(before.map((field) => field.toJSON()));
    expect(await queryInterface.describeTable(physicalTable)).toEqual(beforeColumns);
    expect(
      await db.sequelize.query(`SELECT * FROM ${db.utils.quoteTable(physicalTable)}`, {
        type: QueryTypes.SELECT,
      }),
    ).toEqual(beforeRows);
    expect(collection.getField('title')?.options.type).toBe('string');
  });

  it('should validate every collection before writing a batch', async () => {
    const db = app.db;
    const otherName = `other_${uid(6)}`;
    const created = await app
      .agent()
      .resource('collections')
      .create({
        values: { name: otherName, fields: [{ name: 'title', type: 'string', interface: 'input' }] },
      });
    expect(created.status).toBe(200);
    await db.sequelize
      .getQueryInterface()
      .addColumn(db.getCollection(otherName).getTableNameWithSchema(), 'description', {
        type: DataTypes.TEXT,
      });
    await changeTitleToUnsupportedType();

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({
        values: { collections: [otherName, tableName] },
      });
    expect(response.status).toBe(400);
    expect(
      await db.getRepository('fields').findOne({
        filter: { collectionName: otherName, name: 'description' },
      }),
    ).toBeNull();
    expect(db.getCollection(otherName).getField('description')).toBeUndefined();
    expect(db.getCollection(tableName).getField('title')).toBeTruthy();
  });

  it('should retain new unsupported columns while synchronizing supported changes', async () => {
    const db = app.db;
    const physicalTable = db.getCollection(tableName).getTableNameWithSchema();
    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.addColumn(physicalTable, 'description', { type: DataTypes.TEXT });
    await queryInterface.addColumn(physicalTable, 'binaryData', { type: DataTypes.BLOB });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: [tableName] } });
    expect(response.status).toBe(200);
    expect(db.getCollection(tableName).getField('description')?.options.type).toBe('text');
    expect(db.getCollection(tableName).getField('binaryData')).toBeUndefined();
    expect(await queryInterface.describeTable(physicalTable)).toHaveProperty('binaryData');
  });

  it('should report introspection errors before applying changes', async () => {
    const dataSource = app.dataSourceManager.get('main') as MainDataSource;
    vi.spyOn(dataSource.introspector, 'getCollection').mockRejectedValue(new Error('Introspection failed'));
    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: [tableName] } });
    expect(response.status).toBe(500);
    expect(app.db.getCollection(tableName).getField('title')).toBeTruthy();
  });

  it('should preserve ordinary collection metadata when synchronizing a prefixed runtime table', async () => {
    const name = `ordinary_${uid(6)}`;
    const created = await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name,
          fields: [{ name: 'title', type: 'string', interface: 'input', uiSchema: { title: 'Custom title' } }],
        },
      });
    expect(created.status).toBe(200);
    const db = app.db;
    const before = await db.getRepository('fields').findOne({ filter: { collectionName: name, name: 'title' } });
    const physicalTable = db.getCollection(name).getTableNameWithSchema();
    await db.sequelize.getQueryInterface().addColumn(physicalTable, 'description', { type: DataTypes.TEXT });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: [name] } });
    expect(response.status).toBe(200);
    const after = await db.getRepository('fields').findOne({ filter: { collectionName: name, name: 'title' } });
    expect(after.get('key')).toBe(before.get('key'));
    expect(after.get('uiSchema').title).toBe('Custom title');
    expect(db.getCollection(name).getField('description')?.options.type).toBe('text');
    expect(db.utils.quoteTable(db.getCollection(name).getTableNameWithSchema())).toBe(
      db.utils.quoteTable(physicalTable),
    );
  });

  it('should report a missing physical table without deleting its field metadata', async () => {
    const db = app.db;
    await db.sequelize.getQueryInterface().dropTable(db.getCollection(tableName).getTableNameWithSchema());
    const before = await db.getRepository('fields').find({ filter: { collectionName: tableName } });

    const response = await app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: { collections: [tableName] } });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toContain(tableName);
    const after = await db.getRepository('fields').find({ filter: { collectionName: tableName } });
    expect(after.map((field) => field.toJSON())).toEqual(before.map((field) => field.toJSON()));
  });
});
