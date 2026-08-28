/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import '../../../../index';
import { FlowEngine } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../../../base';
import { FilterFormItemModel } from '../FilterFormItemModel';
import { FilterFormGridModel } from '../FilterFormGridModel';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { NumberFieldModel } from '../../../fields/NumberFieldModel';
import { CascadeSelectFieldModel } from '../../../fields/AssociationFieldModel/CascadeSelectFieldModel';
import { RecordSelectFieldModel } from '../../../fields/AssociationFieldModel/RecordSelectFieldModel';
import { FilterFormRecordSelectFieldModel } from '../fields/FilterFormRecordSelectFieldModel';

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
    CascadeSelectFieldModel,
    RecordSelectFieldModel,
    FilterFormRecordSelectFieldModel,
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

function createFilterItemModel(
  engine: FlowEngine,
  dataBlockModel: DummyCollectionBlockModel,
  fieldPath: string,
  fieldModel?: string,
  fieldProps?: Record<string, unknown>,
) {
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
    subModels: fieldModel
      ? {
          field: {
            use: fieldModel,
            props: fieldProps,
          },
        }
      : undefined,
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
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [any, any];
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
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [any, any];
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
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [any, any];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['department.slug'],
        },
      ],
    });
  });

  it('keeps the target collection filter key for record select relation fields with targetKey', async () => {
    const engine = createEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'code', type: 'string', interface: 'input', filterable: { operators: [] } },
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
          targetKey: 'code',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'department', 'FilterFormRecordSelectFieldModel');

    await gridModel.onModelCreated(subModel);

    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [any, any];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['department.id'],
        },
      ],
    });
  });

  it('falls back to association targetKey for non-record-select filter fields when target collection filter key is id', async () => {
    const engine = createEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'chinaRegions',
      fields: [
        { name: 'code', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'birthPlace',
          type: 'belongsToMany',
          interface: 'chinaRegion',
          target: 'chinaRegions',
          targetKey: 'code',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'birthPlace', 'InputFieldModel');

    await gridModel.onModelCreated(subModel);

    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [any, any];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['birthPlace.code'],
        },
      ],
    });
  });

  it('uses the Cascader value key for both the filter value and connected field path', async () => {
    const engine = createEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'organizations',
      template: 'tree',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'code', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'organization',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'organizations',
          targetKey: 'code',
          filterable: { operators: [] },
        },
      ],
    });

    const dataBlockModel = createDataBlockModel(engine);
    const { gridModel, saveConnectFieldsConfig } = createGridModel(engine);
    const subModel = createFilterItemModel(engine, dataBlockModel, 'organization', 'CascadeSelectFieldModel', {
      fieldNames: { label: 'name', value: 'id' },
      value: {
        id: 52,
        code: 'ORG-52',
        name: 'Leaf organization',
        parent: { id: 1, code: 'ORG-1', name: 'Root organization', parent: null },
      },
    });
    subModel.mounted = true;
    subModel.context.defineProperty('form', {
      value: {
        getFieldValue: () => subModel.subModels.field.props.value,
      },
    });

    await gridModel.onModelCreated(subModel);

    expect(subModel.getFilterValue()).toBe(52);
    expect(saveConnectFieldsConfig).toHaveBeenCalledTimes(1);
    const [, payload] = saveConnectFieldsConfig.mock.calls[0] as unknown as [unknown, unknown];
    expect(payload).toEqual({
      targets: [
        {
          targetId: dataBlockModel.uid,
          filterPaths: ['organization.id'],
        },
      ],
    });
  });
});
