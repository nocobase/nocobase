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
import { FilterFormItemModel } from '../FilterFormItemModel';

describe('FilterFormItemModel getFilterValue', () => {
  const createModelMock = ({
    defaultValue,
    fieldValue,
    association = true,
    fieldNames = { label: 'nickname', value: 'id' },
    collectionField = {},
  }: {
    defaultValue: any;
    fieldValue?: any;
    association?: boolean;
    fieldNames?: { label: string; value: string };
    collectionField?: Record<string, any>;
  }) => {
    return {
      mounted: false,
      props: { name: 'ownerId' },
      subModels: {
        field: {
          props: { fieldNames },
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

  it('falls back to collection target key when fieldNames value is missing', () => {
    const model = createModelMock({
      defaultValue: { id: 25, nickname: 'User 25' },
      fieldValue: undefined,
      fieldNames: undefined as any,
      collectionField: {
        fieldNames: undefined,
        targetKey: 'id',
        targetCollection: { filterTargetKey: 'id' },
      },
    });

    const value = FilterFormItemModel.prototype.getFilterValue.call(model as any);
    expect(value).toBe(25);
  });
});
