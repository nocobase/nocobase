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
import { CascadeSelectFieldModel } from '../../../fields/AssociationFieldModel/CascadeSelectFieldModel';
import { FilterFormItemModel } from '../FilterFormItemModel';

describe('FilterFormItemModel getFilterValue', () => {
  const createModelMock = ({
    defaultValue,
    fieldValue,
    association = true,
    fieldNames = { label: 'nickname', value: 'id' },
    collectionField = {},
    fieldProps = {},
  }: {
    defaultValue: any;
    fieldValue?: any;
    association?: boolean;
    fieldNames?: { label: string; value: string };
    collectionField?: Record<string, any>;
    fieldProps?: Record<string, any>;
  }) => {
    return {
      mounted: false,
      props: { name: 'ownerId' },
      subModels: {
        field: {
          props: { fieldNames, ...fieldProps },
          context: {
            collectionField: {
              isAssociationField: () => association,
              fieldNames,
              targetKey: 'id',
              targetCollection: { filterTargetKey: 'id' },
              ...collectionField,
            },
          },
          getFilterValue: vi.fn(() => fieldValue),
        },
      },
      context: {
        form: {
          getFieldValue: vi.fn(() => fieldValue),
        },
      },
      getDefaultValue: vi.fn(() => defaultValue),
      getStepParams: vi.fn(() => undefined),
      getCurrentOperatorMeta: vi.fn(() => null),
      normalizeAssociationFilterValue: FilterFormItemModel.prototype.normalizeAssociationFilterValue,
    };
  };

  it('normalizes association object default value to primary key before mounted', () => {
    const model = createModelMock({
      defaultValue: { id: 1, nickname: 'Super Admin' },
      fieldValue: undefined,
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe(1);
  });

  it('normalizes association array default value to primary key array before mounted', () => {
    const model = createModelMock({
      defaultValue: [
        { id: 1, nickname: 'Super Admin' },
        { id: 2, nickname: 'user1' },
      ],
      fieldValue: undefined,
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toEqual([1, 2]);
  });

  it('keeps non-association default object as-is', () => {
    const model = createModelMock({
      association: false,
      defaultValue: { code: 'A', label: 'Alpha' },
      fieldValue: undefined,
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toEqual({ code: 'A', label: 'Alpha' });
  });

  it('normalizes association field value object before mounted', () => {
    const model = createModelMock({
      defaultValue: undefined,
      fieldValue: { id: 23, name: 'User 23' },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe(23);
  });

  it('uses current form value when association field props are not synchronized yet', () => {
    const model = createModelMock({
      defaultValue: undefined,
      fieldValue: [3],
      fieldNames: { label: 'nickname', value: 'uuid' },
      collectionField: { type: 'belongsTo', interface: 'm2o' },
    });
    model.context.form.getFieldValue.mockReturnValue([{ id: 3, uuid: 'org-3', nickname: 'Org 3' }]);

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe('org-3');
  });

  it('keeps to-one association arrays when allowMultiple is enabled', () => {
    const model = createModelMock({
      defaultValue: undefined,
      fieldValue: [
        { id: 5, nickname: 'Org 5' },
        { id: 6, nickname: 'Org 6' },
      ],
      collectionField: { type: 'belongsTo', interface: 'm2o' },
      fieldProps: { allowMultiple: true, multiple: true },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toEqual([5, 6]);
  });

  it('keeps association arrays for to-many fields', () => {
    const model = createModelMock({
      defaultValue: [
        { id: 3, uuid: 'org-3', nickname: 'Org 3' },
        { id: 4, uuid: 'org-4', nickname: 'Org 4' },
      ],
      fieldValue: undefined,
      fieldNames: { label: 'nickname', value: 'uuid' },
      collectionField: { type: 'belongsToMany', interface: 'm2m' },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toEqual(['org-3', 'org-4']);
  });

  it('uses target collection filter target key for association default records', () => {
    const model = createModelMock({
      defaultValue: { id: 3, uuid: 'org-3', nickname: 'Org 3' },
      fieldValue: undefined,
      fieldNames: null as any,
      collectionField: {
        targetKey: 'id',
        targetCollection: { filterTargetKey: 'uuid' },
      },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe('org-3');
  });

  it('falls back to collection target key when fieldNames value is missing', () => {
    const model = createModelMock({
      defaultValue: { id: 25, nickname: 'User 25' },
      fieldValue: undefined,
      fieldNames: null as any,
      collectionField: {
        fieldNames: null,
        targetKey: 'id',
        targetCollection: { filterTargetKey: 'id' },
      },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe(25);
  });

  it('uses the tree Cascader leaf target key with the equality operator', () => {
    const engine = new FlowEngine();
    engine.registerModels({ CascadeSelectFieldModel });

    const ds = engine.dataSourceManager.getDataSource('main');
    ds?.addCollection({
      name: 'organizations',
      template: 'tree',
      filterTargetKey: 'code',
      fields: [
        { name: 'code', type: 'string', interface: 'input', filterable: { operators: [] } },
        { name: 'name', type: 'string', interface: 'input', filterable: { operators: [] } },
      ],
    });
    ds?.addCollection({
      name: 'users',
      fields: [
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

    const fieldModel = engine.createModel<CascadeSelectFieldModel>({
      uid: 'tree-cascader-filter-field',
      use: 'CascadeSelectFieldModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'users',
            fieldPath: 'organization',
          },
        },
      },
      props: {
        fieldNames: { label: 'name', value: 'code' },
        value: {
          code: 'leaf',
          name: 'Leaf organization',
          parent: { code: 'root', name: 'Root organization', parent: null },
        },
      },
    });
    const model = {
      mounted: true,
      props: { name: 'organization' },
      subModels: { field: fieldModel },
      context: {
        form: {
          getFieldValue: vi.fn(() => fieldModel.props.value),
        },
      },
      getDefaultValue: vi.fn(() => undefined),
      getStepParams: vi.fn(() => undefined),
      getCurrentOperatorMeta: vi.fn(() => null),
      normalizeAssociationFilterValue: FilterFormItemModel.prototype.normalizeAssociationFilterValue,
    };

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as unknown as FilterFormItemModel);

    expect(fieldModel.operator).toBe('$eq');
    expect(value).toBe('leaf');
  });
});
