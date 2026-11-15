/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { uid } from '@nocobase/utils';
import { DataTypes } from 'sequelize';
import { createApp } from '.';
import { FieldModel } from '../models/field';

describe.each(['', 'nb_'])('register new imported columns (prefix %s)', (tablePrefix) => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let name: string;
  beforeEach(async () => {
    app = await createApp({ database: { tablePrefix }, plugins: ['data-source-manager'] });
    name = `external_${uid(6)}`;
    const qi = app.db.sequelize.getQueryInterface();
    await qi.createTable(
      { tableName: name, schema: app.db.options.schema },
      { id: { type: DataTypes.INTEGER, primaryKey: true }, title: { type: DataTypes.STRING } },
    );
    const response = await app
      .agent()
      .resource('dataSources')
      .loadTables({
        values: { dataSourceKey: 'main', tables: [name] },
      });
    expect(response.status).toBe(200);
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app.db.clean({ drop: true });
    await app.destroy();
  });
  const fields = async () => app.db.getRepository('fields').find({ filter: { collectionName: name }, sort: 'name' });
  const sync = (all = false) =>
    app
      .agent()
      .resource('mainDataSource')
      .syncFields({ values: all ? {} : { collections: [name] } });
  async function addColumn(column = 'note') {
    const qi = app.db.sequelize.getQueryInterface();
    const table = app.db.getCollection(name).getTableNameWithSchema();
    await qi.addColumn(table, column, { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' });
    await qi.addIndex(table, [column], { unique: true, name: `idx_${name}_${column}` });
  }

  it.each([false, true])('adds columns while preserving metadata and physical constraints (all %s)', async (all) => {
    const db = app.db;
    const collection = db.getCollection(name);
    const qi = db.sequelize.getQueryInterface();
    const table = collection.getTableNameWithSchema();
    await app
      .agent()
      .resource('fields')
      .create({
        values: { name: 'preview_note', collectionName: name, type: 'virtual', interface: 'input' },
      });
    const alias = await db.getRepository('fields').create({
      values: { name: 'title_alias', collectionName: name, field: 'title', type: 'string', interface: 'input' },
    });
    await alias.load();
    const oldFields = (await fields()).map((f) => f.toJSON());
    await addColumn();
    const before = { columns: await qi.describeTable(table), indexes: await qi.showIndex(table) };
    const ddl = vi.spyOn(collection, 'sync');
    const response = await sync(all);
    expect(response.status).toBe(200);
    expect((await fields()).filter((f) => f.name !== 'note').map((f) => f.toJSON())).toEqual(oldFields);
    expect(await qi.describeTable(table)).toEqual(before.columns);
    expect(await qi.showIndex(table)).toEqual(before.indexes);
    expect(ddl).not.toHaveBeenCalled();
    expect(collection.getField('note')).toBeTruthy();
    const created = await app
      .agent()
      .resource(name)
      .create({ values: { id: 1, title: 'test', note: 'hello' } });
    expect(created.status).toBe(200);
    const read = await app.agent().resource(name).list();
    expect(read.body.data[0].note).toBe('hello');
    const saved = (await fields()).map((f) => f.toJSON());
    expect((await sync()).status).toBe(200);
    expect((await fields()).map((f) => f.toJSON())).toEqual(saved);
    expect(await qi.describeTable(table)).toEqual(before.columns);
  });

  it('serializes concurrent additions', async () => {
    await addColumn();
    const results = await Promise.all([sync(), sync()]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    expect((await fields()).filter((f) => f.name === 'note')).toHaveLength(1);
    expect(app.db.getCollection(name).getField('note')).toBeTruthy();
  });

  it('keeps metadata for removed columns without recreating them', async () => {
    const db = app.db;
    const table = db.getCollection(name).getTableNameWithSchema();
    const qi = db.sequelize.getQueryInterface();
    const old = (await fields()).map((f) => f.toJSON());
    await qi.removeColumn(table, 'title');
    await addColumn();
    const before = await qi.describeTable(table);
    expect((await sync()).status).toBe(200);
    expect((await fields()).filter((f) => f.name !== 'note').map((f) => f.toJSON())).toEqual(old);
    expect(await qi.describeTable(table)).toEqual(before);
  });

  it('preserves existing field settings when a physical column changes type', async () => {
    const db = app.db;
    const table = db.getCollection(name).getTableNameWithSchema();
    const qi = db.sequelize.getQueryInterface();
    const old = (await fields()).map((f) => f.toJSON());
    await qi.changeColumn(table, 'title', { type: DataTypes.TEXT });
    await addColumn();
    const before = await qi.describeTable(table);
    expect((await sync()).status).toBe(200);
    expect((await fields()).filter((f) => f.name !== 'note').map((f) => f.toJSON())).toEqual(old);
    expect(db.getCollection(name).getField('title').type).toBe('string');
    expect(await qi.describeTable(table)).toEqual(before);
  });

  it('rejects a collision with a logical field before adding any metadata', async () => {
    const db = app.db;
    const virtual = await db.getRepository('fields').create({
      values: { collectionName: name, name: 'note', type: 'virtual', interface: 'input' },
    });
    await virtual.load();
    const old = (await fields()).map((f) => f.toJSON());
    await addColumn();
    const response = await sync();
    expect(response.status).toBe(400);
    expect(response.body.errors[0].message).toContain('note');
    expect((await fields()).map((f) => f.toJSON())).toEqual(old);
    expect(db.getCollection(name).getField('note').options.type).toBe('virtual');
  });

  it('fails a missing table and does not change metadata', async () => {
    const old = (await fields()).map((f) => f.toJSON());
    await app.db.sequelize.getQueryInterface().dropTable(app.db.getCollection(name).getTableNameWithSchema());
    expect((await sync()).status).toBe(500);
    expect((await fields()).map((f) => f.toJSON())).toEqual(old);
  });

  it('rolls back all new metadata when one field fails validation', async () => {
    await addColumn('note');
    await addColumn('second_note');
    const old = (await fields()).map((f) => f.toJSON());
    const rejectSecond = (field: FieldModel) => {
      if (field.name === 'second_note') throw new Error('test validation failure');
    };
    app.db.on('fields.beforeCreate', rejectSecond);
    try {
      expect((await sync()).status).toBe(500);
      expect((await fields()).map((f) => f.toJSON())).toEqual(old);
      expect(app.db.getCollection(name).getField('note')).toBeUndefined();
    } finally {
      app.db.off('fields.beforeCreate', rejectSecond);
    }
    expect((await sync()).status).toBe(200);
    expect(app.db.getCollection(name).getField('second_note')).toBeTruthy();
  });

  it('reloads persisted fields missing from the local runtime on retry', async () => {
    await addColumn();
    expect((await sync()).status).toBe(200);
    const old = (await fields()).map((f) => f.toJSON());
    app.db.getCollection(name).removeField('note');
    expect((await sync()).status).toBe(200);
    expect((await fields()).map((f) => f.toJSON())).toEqual(old);
    expect(app.db.getCollection(name).getField('note')).toBeTruthy();
  });

  it('exposes added columns through a listening HTTP server', async () => {
    await addColumn();
    const server = createServer(app.callback());
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const response = await fetch(`${base}/mainDataSource:syncFields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collections: [name] }),
      });
      expect(response.status).toBe(200);
      const created = await fetch(`${base}/${name}:create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, note: 'http-value' }),
      });
      expect(created.status).toBe(200);
      const listed = await fetch(`${base}/${name}:list`);
      expect(listed.status).toBe(200);
      expect((await listed.json()).data[0].note).toBe('http-value');
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
  });

  it('keeps db2cm excluded', async () => {
    await app.db.getRepository('collections').update({ filterByTk: name, values: { from: 'db2cm' } });
    await addColumn();
    expect((await sync()).status).toBe(200);
    expect((await fields()).find((f) => f.name === 'note')).toBeUndefined();
  });
});
