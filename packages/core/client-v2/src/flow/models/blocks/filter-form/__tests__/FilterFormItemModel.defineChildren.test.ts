/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import '../../../../index';
import { FilterableItemModel, FlowEngine } from '@nocobase/flow-engine';
import { CollectionBlockModel } from '../../../base';
import { CascadeSelectFieldModel } from '../../../fields/AssociationFieldModel/CascadeSelectFieldModel';
import { InputFieldModel } from '../../../fields/InputFieldModel';
import { NumberFieldModel } from '../../../fields/NumberFieldModel';
import { FilterFormRecordSelectFieldModel } from '../fields/FilterFormRecordSelectFieldModel';
import { FilterFormFieldModel } from '../fields/FilterFormFieldModel';
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

class TestCascaderFilterFieldModel extends FilterFormFieldModel {}

FilterableItemModel.bindModelToInterface('TestCascaderFilterFieldModel', ['testChinaRegion'], {
  isDefault: true,
  defaultProps: {
    fieldNames: {
      label: 'name',
      value: 'code',
    },
    labelInValue: true,
    multiple: false,
  },
});

describe('FilterFormItemModel defineChildren association fields', () => {
  it('hides default operator setting for association filter fields', () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel,
    });

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'association-filter-item-settings',
      use: 'FilterFormItemModel',
    });

    const defaultOperatorStep = filterItem.getFlow('filterFormItemSettings')?.steps?.defaultOperator as {
      hideInSettings?: (ctx: {
        collectionField?: unknown;
        model?: {
          subModels?: {
            field?: {
              context?: {
                collectionField?: unknown;
              };
            };
          };
        };
      }) => boolean;
    };
    expect(defaultOperatorStep?.hideInSettings?.({ collectionField: { isAssociationField: () => true } })).toBe(true);
    expect(
      defaultOperatorStep?.hideInSettings?.({
        model: { subModels: { field: { context: { collectionField: { target: 'departments' } } } } },
      }),
    ).toBe(true);
    expect(defaultOperatorStep?.hideInSettings?.({ collectionField: { interface: 'input', type: 'string' } })).toBe(
      false,
    );
  });

  it('groups association target fields and supports recursive paths', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      DummyCollectionBlockModel,
      InputFieldModel,
      NumberFieldModel,
      FilterFormRecordSelectFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds?.addCollection({
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
    ds?.addCollection({
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
    expect((departmentField as any)?.targetCollection).toBeTruthy();

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
    const managerAssociationGroup = managerGroups.find(
      (group: any) => group.key === 'department.manager-relation-fields',
    );

    const managerFieldKeys = (managerFieldsGroup?.children || []).map((item: any) => item.key);
    expect(managerFieldKeys).toContain('department.manager.name');
    expect(managerAssociationGroup).toBeUndefined();

    const targetItem = managerFieldsGroup?.children?.find((item: any) => item.key === 'department.manager.name');
    const createOptions = await targetItem.createModelOptions();
    const filterItem = engine.createModel({
      uid: 'filter-item',
      ...createOptions,
    } as any) as unknown as FilterFormItemModel;

    expect(filterItem.fieldPath).toBe('department.manager.name');
    expect(filterItem.collectionField).toBeTruthy();
  });

  it('lists filterable children from association field interfaces', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      DummyCollectionBlockModel,
      InputFieldModel,
      FilterFormRecordSelectFieldModel,
    });
    engine.context.defineProperty('t', {
      value: (value: string) => (value === '{{t("Province/city/area name")}}' ? '省/市/区名称' : value),
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds?.addCollection({
      name: 'students',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        {
          name: 'studentName',
          title: 'Student name',
          type: 'string',
          interface: 'input',
          filterable: { operators: [] },
        },
        {
          name: 'birthPlace',
          title: 'Birth place',
          type: 'belongsToMany',
          interface: 'chinaRegion',
          target: 'chinaRegions',
          filterable: {
            children: [
              {
                name: 'name',
                title: '{{t("Province/city/area name")}}',
                operators: 'string',
                schema: {
                  title: '{{t("Province/city/area name")}}',
                  type: 'string',
                  'x-component': 'Input',
                },
              },
            ],
          },
        },
      ],
    });

    const model = engine.createModel<DummyCollectionBlockModel>({
      uid: 'students-block',
      use: 'DummyCollectionBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'students',
          },
        },
      },
    });
    const getFilterFields = model.getFilterFields.bind(model);
    model.getFilterFields = async () => {
      const fields = await getFilterFields();
      return fields.map((field: any) =>
        field.name === 'birthPlace'
          ? {
              name: field.name,
              title: field.title,
              type: field.type,
              interface: field.interface,
              target: field.target,
              filterable: field.filterable,
              isAssociationField: () => true,
            }
          : field,
      ) as any;
    };

    const children = (await FilterFormItemModel.defineChildren({
      blockGridModel: {
        filterSubModels: (_key: string, predicate: (item: any) => boolean) => [model].filter(predicate),
      },
      t: (value: string) => value,
    } as any)) as any[];

    const groups = await children[0].children();
    const fieldsGroup = groups.find((group: any) => group.key === 'fields');
    const associationGroup = groups.find((group: any) => group.key === 'relation-fields');
    const fieldKeys = (fieldsGroup?.children || []).map((item: any) => item.key);
    const associationKeys = (associationGroup?.children || []).map((item: any) => item.key);

    expect(fieldKeys).toContain('studentName');
    expect(associationKeys).toContain('birthPlace-associationField');
    expect(associationKeys).not.toContain('studentName-associationField');

    const regionAssociation = associationGroup?.children?.find(
      (item: any) => item.key === 'birthPlace-associationField',
    );
    const regionGroups = await regionAssociation.children();
    const regionFieldsGroup = regionGroups.find((group: any) => group.key === 'birthPlace-fields');
    const regionNameItem = regionFieldsGroup?.children?.find((item: any) => item.key === 'birthPlace.name');

    expect(regionNameItem?.label).toBe('Birth place / 省/市/区名称');

    const createOptions = await regionNameItem.createModelOptions();
    const filterItem = engine.createModel({
      uid: 'filter-item-region-name',
      ...createOptions,
    } as any) as unknown as FilterFormItemModel;

    expect(filterItem.fieldPath).toBe('birthPlace.name');
    expect(filterItem.context.filterField).toMatchObject({
      name: 'name',
      title: 'Birth place / 省/市/区名称',
      interface: 'input',
      type: 'string',
    });
    expect(filterItem.context.filterField?.filterable?.operators).toBe('string');
    expect(filterItem.collectionField).toMatchObject({
      name: 'name',
      title: 'Birth place / 省/市/区名称',
      interface: 'input',
      type: 'string',
    });
    expect(filterItem.collectionField?.filterable?.operators).toBe('string');
    expect(filterItem.subModels.field).toBeInstanceOf(InputFieldModel);
  });

  it('uses explicit filterable binding for association fields that provide a filter model', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      DummyCollectionBlockModel,
      InputFieldModel,
      TestCascaderFilterFieldModel,
      FilterFormRecordSelectFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds?.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds?.addCollection({
      name: 'chinaRegions',
      fields: [
        { name: 'code', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds?.addCollection({
      name: 'students',
      filterTargetKey: 'id',
      fields: [
        {
          name: 'department',
          title: 'Department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          filterable: { operators: [] },
        },
        {
          name: 'birthPlace',
          title: 'Birth place',
          type: 'belongsToMany',
          interface: 'testChinaRegion',
          target: 'chinaRegions',
          targetKey: 'code',
          filterable: { operators: [] },
        },
      ],
    });

    const model = engine.createModel<DummyCollectionBlockModel>({
      uid: 'students-direct-region-block',
      use: 'DummyCollectionBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'students',
          },
        },
      },
    });

    const children = (await FilterFormItemModel.defineChildren({
      blockGridModel: {
        filterSubModels: (_key: string, predicate: (item: any) => boolean) => [model].filter(predicate),
      },
      t: (value: string) => value,
    } as any)) as any[];
    const groups = await children[0].children();
    const fieldsGroup = groups.find((group: any) => group.key === 'fields');
    const departmentItem = fieldsGroup?.children?.find((item: any) => item.key === 'department');
    const birthPlaceItem = fieldsGroup?.children?.find((item: any) => item.key === 'birthPlace');

    const departmentCreateOptions = await departmentItem.createModelOptions();
    const birthPlaceCreateOptions = await birthPlaceItem.createModelOptions();

    expect(departmentCreateOptions.subModels.field.use).toBe('FilterFormRecordSelectFieldModel');
    expect(birthPlaceCreateOptions.subModels.field.use).toBe('TestCascaderFilterFieldModel');
    expect(birthPlaceCreateOptions.subModels.field.props).toMatchObject({
      fieldNames: {
        label: 'name',
        value: 'code',
      },
      labelInValue: true,
      multiple: false,
    });

    const filterItem = engine.createModel({
      uid: 'filter-item-birth-place-direct',
      ...birthPlaceCreateOptions,
    } as any) as unknown as FilterFormItemModel;

    expect(filterItem.fieldPath).toBe('birthPlace');
    expect(filterItem.subModels.field).toBeInstanceOf(TestCascaderFilterFieldModel);
  });

  it('uses Cascader by default for tree to-one associations and keeps Dropdown for other associations', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      DummyCollectionBlockModel,
      CascadeSelectFieldModel,
      FilterFormRecordSelectFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds?.addCollection({
      name: 'organizations',
      template: 'tree',
      filterTargetKey: 'id',
      titleField: 'name',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds?.addCollection({
      name: 'departments',
      filterTargetKey: 'id',
      fields: [
        { name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds?.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [
        {
          name: 'organization',
          title: 'Organization',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'organizations',
          filterable: { operators: [] },
        },
        {
          name: 'department',
          title: 'Department',
          type: 'belongsTo',
          interface: 'm2o',
          target: 'departments',
          filterable: { operators: [] },
        },
        {
          name: 'organizations',
          title: 'Organizations',
          type: 'belongsToMany',
          interface: 'm2m',
          target: 'organizations',
          filterable: { operators: [] },
        },
      ],
    });

    const model = engine.createModel<DummyCollectionBlockModel>({
      uid: 'users-tree-association-block',
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

    const children = (await FilterFormItemModel.defineChildren({
      blockGridModel: {
        filterSubModels: (_key: string, predicate: (item: any) => boolean) => [model].filter(predicate),
      },
      t: (value: string) => value,
    } as any)) as any[];
    const groups = await children[0].children();
    const fieldsGroup = groups.find((group: any) => group.key === 'fields');
    const organizationItem = fieldsGroup?.children?.find((item: any) => item.key === 'organization');
    const departmentItem = fieldsGroup?.children?.find((item: any) => item.key === 'department');
    const organizationsItem = fieldsGroup?.children?.find((item: any) => item.key === 'organizations');

    const organizationCreateOptions = await organizationItem.createModelOptions();
    const departmentCreateOptions = await departmentItem.createModelOptions();
    const organizationsCreateOptions = await organizationsItem.createModelOptions();

    expect(organizationCreateOptions.subModels.field.use).toBe('CascadeSelectFieldModel');
    expect(organizationCreateOptions.subModels.field.props).toMatchObject({
      fieldNames: { label: 'name', value: 'id' },
    });
    expect(departmentCreateOptions.subModels.field.use).toBe('FilterFormRecordSelectFieldModel');
    expect(organizationsCreateOptions.subModels.field.use).toBe('FilterFormRecordSelectFieldModel');

    const filterItem = engine.createModel<FilterFormItemModel>({
      uid: 'filter-item-tree-organization',
      ...organizationCreateOptions,
    });
    const modelStep = filterItem.getFlow('filterFormItemSettings')?.steps?.model as any;
    const settingsContext = {
      engine,
      collectionField: ds?.getCollection('users')?.getField('organization'),
      t: (value: string) => engine.translate(value),
    };
    const options = modelStep.uiMode(settingsContext).props.options;

    expect(modelStep.hideInSettings(settingsContext)).not.toBe(true);
    expect(options).toEqual(
      expect.arrayContaining([
        { label: 'Dropdown select', value: 'FilterFormRecordSelectFieldModel' },
        { label: 'Cascader', value: 'CascadeSelectFieldModel' },
      ]),
    );
  });

  it('provides fallback field metadata for sql fields without collection context', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      NumberFieldModel,
    });

    const filterItem = engine.createModel({
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
    } as any) as unknown as FilterFormItemModel;

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.collectionField).toBeTruthy();
    expect(filterItem.collectionField?.name).toBe('id');
    expect(filterItem.collectionField?.interface).toBe('number');
  });

  it('keeps deleted-field detection when collection context exists', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      NumberFieldModel,
    });

    const ds = engine.dataSourceManager.getDataSource('main');
    expect(ds).toBeTruthy();
    ds?.addCollection({
      name: 'users',
      filterTargetKey: 'id',
      fields: [{ name: 'id', type: 'integer', interface: 'number', filterable: { operators: [] } }],
    });

    const filterItem = engine.createModel({
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
    } as any) as unknown as FilterFormItemModel;

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.collectionField).toBeFalsy();
  });

  it('uses field name as fallback label when sql filter field title is missing', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      NumberFieldModel,
    });

    const filterItem = engine.createModel({
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
    } as any) as unknown as FilterFormItemModel;

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.props.label).toBe('id');
  });

  it('applies getComponentProps from fallback sql field metadata', async () => {
    const engine = new FlowEngine();
    engine.registerModels({
      FilterFormItemModel: FilterFormItemModel as any,
      NumberFieldModel,
    });

    const filterItem = engine.createModel({
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
    } as any) as unknown as FilterFormItemModel;

    await filterItem.dispatchEvent('beforeRender');

    expect(filterItem.props.placeholder).toBe('sql-id');
    expect(filterItem.props.allowMultiple).toBe(true);
    expect(filterItem.props.multiple).toBe(true);
    expect(filterItem.props.required).toBeUndefined();
    expect(filterItem.props.rules).toBeUndefined();
  });
});
