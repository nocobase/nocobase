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

describe.each(['', 'nb_'])('sync imported fields (prefix %s)', (tablePrefix) => {
  let app: Awaited<ReturnType<typeof createApp>>;
  let server: ReturnType<typeof createServer>;
  let base: string;
  let name: string;

  beforeEach(async () => {
    app = await createApp({ database: { tablePrefix }, plugins: ['data-source-manager'] });
    name = `external_${uid(6)}`;
    await app.db.sequelize
      .getQueryInterface()
      .createTable(
        { tableName: name, schema: app.db.options.schema },
        { id: { type: DataTypes.INTEGER, primaryKey: true }, title: { type: DataTypes.STRING } },
      );
    const response = await app
      .agent()
      .resource('dataSources')
      .loadTables({ values: { dataSourceKey: 'main', tables: [name] } });
    expect(response.status).toBe(200);
    expect(app.db.getCollection(name).options.from).toBe('dbsync');
    server = createServer(app.callback());
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  const sync = (all = false) =>
    fetch(`${base}/mainDataSource:syncFields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(all ? {} : { collections: [name] }),
    });

  it.each([false, true])('syncs new columns through the existing API (all %s)', async (all) => {
    const db = app.db;
    const qi = db.sequelize.getQueryInterface();
    const collection = db.getCollection(name);
    const ordinaryName = `ordinary_${uid(6)}`;
    const ordinary = await app
      .agent()
      .resource('collections')
      .create({ values: { name: ordinaryName, fields: [{ name: 'title', type: 'string' }] } });
    expect(ordinary.status).toBe(200);
    for (const target of [collection, db.getCollection(ordinaryName)]) {
      await qi.addColumn(target.getTableNameWithSchema(), 'note', { type: DataTypes.STRING });
    }
    expect(collection.getField('note')).toBeUndefined();

    const response = await sync(all);
    expect(response.status).toBe(200);
    await response.text();
    const metadata = await app.agent().resource('collections.fields', name).list();
    expect(metadata.status).toBe(200);
    expect(metadata.body.data.filter((field: { name: string }) => field.name === 'note')).toHaveLength(1);
    expect(collection.getField('note')).toBeTruthy();
    expect(Boolean(db.getCollection(ordinaryName).getField('note'))).toBe(all);
    expect(collection.model.tableName).toBe(name);
    expect((await qi.describeTable(collection.getTableNameWithSchema())).note).toBeTruthy();

    const created = await fetch(`${base}/${name}:create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1, title: 'test', note: 'http-value' }),
    });
    expect(created.status).toBe(200);
    await created.text();
    const listed = await fetch(`${base}/${name}:list`);
    expect(listed.status).toBe(200);
    expect((await listed.json()).data[0].note).toBe('http-value');

    const repeated = await sync(all);
    expect(repeated.status).toBe(200);
    await repeated.text();
    const saved = await db.getRepository('fields').find({ filter: { collectionName: name, name: 'note' } });
    expect(saved).toHaveLength(1);
  });

  it.each([false, true])('continues to exclude db2cm collections (all %s)', async (all) => {
    await app.db.getRepository('collections').update({ filterByTk: name, values: { from: 'db2cm' } });
    const collection = app.db.getCollection(name);
    await app.db.sequelize.getQueryInterface().addColumn(collection.getTableNameWithSchema(), 'note', {
      type: DataTypes.STRING,
    });
    const response = await sync(all);
    expect(response.status).toBe(200);
    await response.text();
    const fields = await app.db.getRepository('fields').find({ filter: { collectionName: name, name: 'note' } });
    expect(fields).toHaveLength(0);
    expect(collection.getField('note')).toBeUndefined();
  });
});
