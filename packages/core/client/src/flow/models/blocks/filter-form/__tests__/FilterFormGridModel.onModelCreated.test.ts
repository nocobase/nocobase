/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import '@nocobase/client';
import { FlowEngine } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../../../base';
import { FilterFormItemModel } from '../FilterFormItemModel';
import { FilterFormGridModel } from '../FilterFormGridModel';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { NumberFieldModel } from '../../../fields/NumberFieldModel';
import { RecordSelectFieldModel } from '../../../fields/AssociationFieldModel/RecordSelectFieldModel';

class DummyResource {
  supportsFilter = true;
  setDataSourceKey() {}
  setResourceName() {}
  on() {}
  refresh() {
    return Promise.resolve();
  }
}

class DummyCollectionBlockModel extends CollectionBlockModel {
  createResource() {
    return new DummyResource() as any;
  }
}

function createEngine() {
  const engine = new FlowEngine();
  engine.registerModels({
    FilterFormGridModel,
    FilterFormItemModel,
    DummyCollectionBlockModel,
    InputFieldModel,
    NumberFieldModel,
    RecordSelectFieldModel,
  });

  return engine;
}

function createDataBlockModel(engine: FlowEngine) {
  return engine.createModel<DummyCollectionBlockModel>({
    uid: 'users-block',
    use: 'DummyCollectionBlockModel',
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
        },
      },
    },
  });
}

function createGridModel(engine: FlowEngine) {
  const gridModel = engine.createModel<FilterFormGridModel>({
    uid: 'filter-grid',
    use: 'FilterFormGridModel',
  });
  const saveConnectFieldsConfig = vi.fn(async () => {});

  gridModel.context.defineProperty('filterManager', {
    value: { saveConnectFieldsConfig },
  });

  return { gridModel, saveConnectFieldsConfig };
}

function createFilterItemModel(engine: FlowEngine, dataBlockModel: DummyCollectionBlockModel, fieldPath: string) {
  const subModel = engine.createModel<FilterFormItemModel>({
    uid: `filter-item-${fieldPath}`,
    use: 'FilterFormItemModel',
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
          collectionName: 'users',
          fieldPath,
        },
      },
      filterFormItemSettings: {
        init: {
          defaultTargetUid: dataBlockModel.uid,
        },
      },
    },
  });

  subModel.context.defineProperty('blockGridModel', {
    value: {
      filterSubModels: (_key: string, predicate: (item: any) => boolean) => [dataBlockModel].filter(predicate),
    },
  });

  return subModel;
}

describe('FilterFormGridModel onModelCreated', () => {
  it('auto connects association target field path to target block', async () => {
    const engine = createEngine();

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'department.name');

    await gridModel.onModelCreated(subModel);

    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['department.name'],
        },
      ],
    });
  });

  it('uses target collection filterTargetKey for association fields', async () => {
    const engine = createEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'departments',
      filterTargetKey: 'slug',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'slug', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          targetKey: 'id',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'department');

    await gridModel.onModelCreated(subModel);

    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['department.slug'],
        },
      ],
    });
  });

  it('uses the first filterTargetKey when target collection has composite keys', async () => {
    const engine = createEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'departments',
      filterTargetKey: ['slug', 'locale'],
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'slug', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'locale', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          targetKey: 'id',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'department');

    await gridModel.onModelCreated(subModel);

    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['department.slug'],
        },
      ],
    });
  });
});
