/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer, waitSecond } from '@nocobase/test';
import type { DataSourceModel } from '../models/data-source';
import type PluginDataSourceManagerServer from '../plugin';

const EXTERNAL_DS = 'externalDS';
const CONTENTS = 'contents';

describe('Database event should effect after data source reload', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
      plugins: ['nocobase', 'data-source-external-postgres'],
    });
    app.db.collection({
      name: CONTENTS,
      fields: [
        {
          name: 'id',
          type: 'bigInt',
          autoIncrement: true,
          primaryKey: true,
        },
      ],
    });
    await app.db.sync();

    await app
      .agent()
      .resource('dataSources')
      .create({
        values: {
          key: EXTERNAL_DS,
          type: 'postgres',
          displayName: 'Postgres',
          enabled: true,
          options: {
            addAllCollections: true,
            host: process.env.REMOTE_POSTGRES_HOST,
            port: parseInt(process.env.REMOTE_POSTGRES_PORT),
            username: process.env.REMOTE_POSTGRES_USER,
            password: process.env.REMOTE_POSTGRES_PASSWORD,
            database: process.env.REMOTE_POSTGRES_DB,
          },
        },
      });

    await waitDataSourceLoad(app);
  });

  afterEach(async () => {
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('Database instance should not change, when reload data source with reuseDB = true', async () => {
    const beforeLoadDb = getDatabaseInstance(app);
    await reloadDataSource(app, { reuseDB: true });
    await waitDataSourceLoad(app);
    expect(getDatasourceStatus(app)).eq('loaded');

    const afterLoadDb = getDatabaseInstance(app);
    expect(afterLoadDb.instanceId).eq(beforeLoadDb.instanceId);
  });

  it('Database instance will change, when reload data source without reuseDB', async () => {
    const beforeLoadDb = getDatabaseInstance(app);
    await reloadDataSource(app, {});
    await waitDataSourceLoad(app);
    expect(getDatasourceStatus(app)).eq('loaded');

    const afterLoadDb = getDatabaseInstance(app);
    expect(afterLoadDb.instanceId).not.eq(beforeLoadDb.instanceId);
  });

  it('Database events should still effect after data source reload with reuseDB = true', async () => {
    const callback = vitest.fn();
    const ds = app.dataSourceManager.get(EXTERNAL_DS);
    (ds.collectionManager as any).db.on(CONTENTS + '.afterCreate', callback);

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(1);

    await reloadDataSource(app, { reuseDB: true });
    await waitDataSourceLoad(app);
    expect(getDatasourceStatus(app)).eq('loaded');

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(2);
  });

  it('Database events will not effect after data source reload without reuseDB', async () => {
    const callback = vitest.fn();
    const ds = app.dataSourceManager.get(EXTERNAL_DS);
    (ds.collectionManager as any).db.on(CONTENTS + '.afterCreate', callback);

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(1);

    await reloadDataSource(app, {});
    await waitDataSourceLoad(app);
    expect(getDatasourceStatus(app)).eq('loaded');

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(1);
  });

  it('Use dataSourceManager`s afterAddDataSource hooks to rebind database events after data source reload without reuseDB', async () => {
    const callback = vitest.fn();

    app.dataSourceManager.afterAddDataSource((dataSource) => {
      if (dataSource.name !== EXTERNAL_DS) {
        return;
      }
      (dataSource.collectionManager as any).db.on(CONTENTS + '.afterCreate', callback);
    });

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(1);

    await reloadDataSource(app, {});
    await waitDataSourceLoad(app);
    expect(getDatasourceStatus(app)).eq('loaded');

    await getRepository(app).create({
      values: { createdAt: '2025-12-18', updatedAt: '2025-12-18' },
    });
    expect(callback).toBeCalledTimes(2);
  });
});

const getRepository = (app: MockServer) => {
  const ds = app.dataSourceManager.get(EXTERNAL_DS);
  return ds.collectionManager.getCollection(CONTENTS).repository;
};

const reloadDataSource = async (app: MockServer, { reuseDB }: { reuseDB?: boolean }) => {
  const plugin: PluginDataSourceManagerServer = app.pm.get('data-source-manager');
  const dataSourceModel: DataSourceModel = await app.db.getRepository('dataSources').findOne({
    filter: {
      key: EXTERNAL_DS,
    },
  });
  await dataSourceModel.loadIntoApplication({
    app,
    refresh: true,
    reuseDB,
  });
  await app.syncMessageManager.publish(plugin.name, {
    type: 'loadDataSource',
    dataSourceKey: EXTERNAL_DS,
  });
};

const getDatabaseInstance = (app: MockServer) => {
  const ds = app.dataSourceManager.get(EXTERNAL_DS);
  return (ds.collectionManager as any).db;
};

const getDatasourceStatus = (app: MockServer) => {
  const plugin: PluginDataSourceManagerServer = app.pm.get('data-source-manager');
  return plugin.dataSourceStatus[EXTERNAL_DS];
};

const waitDataSourceLoad = async (app: MockServer, wait = 20) => {
  let i = 0;
  while (getDatasourceStatus(app) !== 'loaded' && i < wait) {
    await waitSecond(100);
    i++;
  }
};
