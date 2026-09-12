/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import { DatabaseDataSource, LoadedCollections } from '@nocobase/data-source-manager';
import { loadDataSourceTablesIntoCollections } from '../middlewares/load-tables';
import { DataSourceModel } from '../models/data-source';

type ActionName = 'create' | 'update';

function createDatabaseDataSource() {
  const dataSource = Object.create(DatabaseDataSource.prototype) as DatabaseDataSource;
  const loadTables = vi.fn(async () => undefined);
  Object.defineProperty(dataSource, 'loadTables', {
    configurable: true,
    value: loadTables,
  });
  return { dataSource, loadTables };
}

function createDataSourceModel(options: Record<string, unknown>, localData: LoadedCollections) {
  const model = Object.create(DataSourceModel.prototype) as DataSourceModel;
  const loadLocalData = vi.fn(async () => localData);
  Object.defineProperties(model, {
    get: {
      configurable: true,
      value: vi.fn((key: string) => (key === 'options' ? options : undefined)),
    },
    loadLocalData: {
      configurable: true,
      value: loadLocalData,
    },
    type: {
      configurable: true,
      value: 'external',
    },
  });
  return { loadLocalData, model };
}

function createContext(options: {
  actionName: ActionName;
  connectionOptions: Record<string, unknown>;
  dataSource: DatabaseDataSource;
  model?: DataSourceModel;
}) {
  const { actionName, connectionOptions, dataSource, model } = options;
  const dataSourcesRepo = {
    findByTargetKey: vi.fn(async () => model),
  };
  const create = vi.fn(() => dataSource);
  const get = vi.fn(() => dataSource);
  const values = {
    collections: ['departments'],
    key: 'external',
    options: connectionOptions,
    type: 'external',
  };
  const ctx = {
    action: {
      actionName,
      params: {
        filterByTk: actionName === 'update' ? 'external' : undefined,
        values,
      },
      resourceName: 'dataSources',
    },
    app: {
      dataSourceManager: {
        factory: { create },
        get,
      },
      db: {
        getRepository: vi.fn(() => dataSourcesRepo),
      },
    },
    logger: {},
  } as unknown as Context;

  return { create, ctx, dataSourcesRepo, get };
}

describe('loadDataSourceTablesIntoCollections', () => {
  it('should pass persisted local metadata when updating an on-demand data source', async () => {
    const connectionOptions = { addAllCollections: false, database: 'external' };
    const localData: LoadedCollections = {
      departments: {
        name: 'departments',
        fields: [
          {
            name: 'name',
            field: 'name',
            rawType: 'VARCHAR',
            type: 'string',
            uiSchema: {
              title: 'Department name',
            },
          },
        ],
      },
    };
    const { dataSource, loadTables } = createDatabaseDataSource();
    const { loadLocalData, model } = createDataSourceModel(connectionOptions, localData);
    const { ctx, dataSourcesRepo, get } = createContext({
      actionName: 'update',
      connectionOptions,
      dataSource,
      model,
    });
    const next: Next = vi.fn(async () => undefined);

    await loadDataSourceTablesIntoCollections(ctx, next);

    expect(dataSourcesRepo.findByTargetKey).toHaveBeenCalledWith('external');
    expect(get).toHaveBeenCalledWith('external');
    expect(loadLocalData).toHaveBeenCalledTimes(1);
    expect(loadTables).toHaveBeenCalledWith(ctx, ['departments'], {
      localData,
    });
    expect(ctx.action.params.values.collections).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should not read local metadata when an update omits collections', async () => {
    const connectionOptions = { addAllCollections: false, database: 'external' };
    const localData: LoadedCollections = {};
    const { dataSource, loadTables } = createDatabaseDataSource();
    const { loadLocalData, model } = createDataSourceModel(connectionOptions, localData);
    const { ctx } = createContext({
      actionName: 'update',
      connectionOptions,
      dataSource,
      model,
    });
    delete ctx.action.params.values.collections;
    const next: Next = vi.fn(async () => undefined);

    await loadDataSourceTablesIntoCollections(ctx, next);

    expect(loadLocalData).not.toHaveBeenCalled();
    expect(loadTables).toHaveBeenCalledWith(ctx, undefined);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should load selected collections on create without reading local metadata', async () => {
    const connectionOptions = { addAllCollections: false, database: 'external' };
    const { dataSource, loadTables } = createDatabaseDataSource();
    const { create, ctx, dataSourcesRepo } = createContext({
      actionName: 'create',
      connectionOptions,
      dataSource,
    });
    const next: Next = vi.fn(async () => undefined);

    await loadDataSourceTablesIntoCollections(ctx, next);

    expect(dataSourcesRepo.findByTargetKey).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith('external', {
      name: 'external',
      ...connectionOptions,
    });
    expect(loadTables).toHaveBeenCalledWith(ctx, ['departments']);
    expect(ctx.action.params.values.collections).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
