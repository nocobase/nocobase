/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import '@nocobase/client';
import { FlowEngine } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../../../base';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { NumberFieldModel } from '../../../fields/NumberFieldModel';
import { FilterFormRecordSelectFieldModel } from '../fields/FilterFormRecordSelectFieldModel';
import { FilterFormItemModel } from '../FilterFormItemModel';

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

describe('FilterFormItemModel defineChildren association fields', () => {
  it('groups association target fields and supports recursive paths', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
      DummyCollectionBlockModel,
      InputFieldModel,
      NumberFieldModel,
      FilterFormRecordSelectFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
        {
          name: 'manager',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'users',
          filterable: { operators: [] },
        },
      ],
    });
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
        {
          name: 'department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          filterable: { operators: [] },
        },
      ],
    });

    const model = engine.createModel<DummyCollectionBlockModel>({
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

    const filterFields = await model.getFilterFields();
    expect(filterFields.some((field: any) => field.name === 'department')).toBe(true);
    const departmentField = filterFields.find((field: any) => field.name === 'department');
    expect(departmentField?.target).toBe('departments');
    expect(departmentField?.targetCollection).toBeTruthy();

    const blockGridModel = {
      filterSubModels: (_key: string, predicate: (item: any) => boolean) => [model].filter(predicate),
    } as any;

    const ctx = { blockGridModel, t: (value: string) => value } as any;
    const children = (await FilterFormItemModel.defineChildren(ctx)) as any[];
    expect(children).toHaveLength(1);

    const groups = await children[0].children();
    const fieldsGroup = groups.find((group: any) => group.key === 'fields');
    const associationGroup = groups.find((group: any) => group.key === 'relation-fields');

    expect(fieldsGroup?.label).toBe('Fields');
    expect(associationGroup?.label).toBe('Association fields');

    const fieldKeys = (fieldsGroup?.children || []).map((item: any) => item.key);
    expect(fieldKeys).toContain('department');

    const associationItems = associationGroup?.children || [];
    const associationKeys = associationItems.map((item: any) => item.key);
    expect(associationKeys).toContain('department-associationField');
    expect(associationKeys).not.toContain('department');

    const departmentAssociation = associationItems.find((item: any) => item.key === 'department-associationField');
    const departmentGroups = await departmentAssociation.children();
    const departmentFieldsGroup = departmentGroups.find((group: any) => group.key === 'department-fields');
    const departmentAssociationGroup = departmentGroups.find(
      (group: any) => group.key === 'department-relation-fields',
    );

    const departmentFieldKeys = (departmentFieldsGroup?.children || []).map((item: any) => item.key);
    expect(departmentFieldKeys).toContain('department.name');

    const departmentAssociationItems = departmentAssociationGroup?.children || [];
    const departmentAssociationKeys = departmentAssociationItems.map((item: any) => item.key);
    expect(departmentAssociationKeys).toContain('department.manager-associationField');

    const managerAssociation = departmentAssociationItems.find(
      (item: any) => item.key === 'department.manager-associationField',
    );
    const managerGroups = await managerAssociation.children();
    const managerFieldsGroup = managerGroups.find((group: any) => group.key === 'department.manager-fields');

    const managerFieldKeys = (managerFieldsGroup?.children || []).map((item: any) => item.key);
    expect(managerFieldKeys).toContain('department.manager.name');

    const targetItem = managerFieldsGroup?.children?.find((item: any) => item.key === 'department.manager.name');
    const createOptions = await targetItem.createModelOptions();
    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'filter-item',
      ...createOptions,
    } as any);

    expect(filterItem.fieldPath).toBe('department.manager.name');
    expect(filterItem.collectionField).toBeTruthy();
  });

  it('provides fallback field metadata for sql fields without collection context', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
      NumberFieldModel,
    });

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'sql-filter-item',
      use: 'FilterFormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'id',
          },
        },
        filterFormItemSettings: {
          init: {
            filterField: {
              name: 'id',
              title: 'id',
              interface: 'number',
              type: 'integer',
            },
          },
        },
      },
      subModels: {
        field: {
          use: 'NumberFieldModel',
        },
      },
    } as any);

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.collectionField).toBeTruthy();
    expect(filterItem.collectionField?.name).toBe('id');
    expect(filterItem.collectionField?.interface).toBe('number');
  });

  it('keeps deleted-field detection when collection context exists', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
      NumberFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [{ name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } }],
    });

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'deleted-field-item',
      use: 'FilterFormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'not_exists',
          },
        },
        filterFormItemSettings: {
          init: {
            filterField: {
              name: 'not_exists',
              title: 'not_exists',
              interface: 'number',
              type: 'integer',
            },
          },
        },
      },
      subModels: {
        field: {
          use: 'NumberFieldModel',
        },
      },
    } as any);

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.collectionField).toBeFalsy();
  });

  it('uses field name as fallback label when sql filter field title is missing', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
      NumberFieldModel,
    });

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'sql-filter-item-no-title',
      use: 'FilterFormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'id',
          },
        },
        filterFormItemSettings: {
          init: {
            filterField: {
              name: 'id',
              interface: 'number',
              type: 'integer',
            },
          },
        },
      },
      subModels: {
        field: {
          use: 'NumberFieldModel',
        },
      },
    } as any);

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.props.label).toBe('id');
  });

  it('applies getComponentProps from fallback sql field metadata', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
      NumberFieldModel,
    });

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'sql-filter-item-component-props',
      use: 'FilterFormItemModel',
      stepParams: {
        fieldSettings: {
          init: {
            fieldPath: 'id',
          },
        },
        filterFormItemSettings: {
          init: {
            filterField: {
              name: 'id',
              interface: 'number',
              type: 'integer',
              getComponentProps: () => ({
                placeholder: 'sql-id',
                allowMultiple: true,
                multiple: true,
                required: true,
                rules: [{ required: true }],
              }),
            },
          },
        },
      },
      subModels: {
        field: {
          use: 'NumberFieldModel',
        },
      },
    } as any);

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.props.placeholder).toBe('sql-id');
    expect(filterItem.props.allowMultiple).toBe(true);
    expect(filterItem.props.multiple).toBe(true);
    expect(filterItem.props.required).toBeUndefined();
    expect(filterItem.props.rules).toBeUndefined();
  });
});
