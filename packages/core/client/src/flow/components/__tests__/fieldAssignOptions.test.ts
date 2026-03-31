/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { buildCustomFieldTargetPath } from '../../internal/utils/modelUtils';
import { collectFieldAssignCascaderOptions } from '../fieldAssignOptions';

describe('fieldAssignOptions', () => {
  it('marks subform node as non-leaf so Cascader can lazy-load target collection fields', () => {
    const usersCollection = {
      getFields: () => [
        { name: 'age', title: 'Age', interface: 'input', type: 'integer' },
        { name: 'name', title: 'Name', interface: 'input', type: 'string' },
      ],
    };

    const usersAssociationField = {
      name: 'users',
      title: 'Users',
      interface: 'o2m',
      type: 'hasMany',
      isAssociationField: () => true,
      targetCollection: usersCollection,
    };

    const rootCollection = {
      getField: (name: string) => {
        if (name === 'users') return usersAssociationField as any;
        return null;
      },
      getFields: () => [
        usersAssociationField,
        { name: 'title', title: 'Title', interface: 'input', type: 'string', isAssociationField: () => false },
      ],
    };

    const usersItemModel = {
      props: { label: 'Users' },
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') return { fieldPath: 'users' };
        return {};
      },
      subModels: {
        field: {
          context: { collectionField: usersAssociationField },
          subModels: { grid: { subModels: { items: [] } } },
        },
      },
    };

    const formBlockModel = {
      context: { collection: rootCollection },
      subModels: { grid: { subModels: { items: [usersItemModel] } } },
    };

    const t = (s: string) => s;

    const options = collectFieldAssignCascaderOptions({ formBlockModel, t });

    expect(options.some((o: any) => o?.value === 'users' && o?.isLeaf === false)).toBe(true);
    expect(options.some((o: any) => o?.value === 'title' && o?.label === 'Title' && o?.isLeaf === true)).toBe(true);
  });

  it('includes custom filter fields with stable target path token', () => {
    const customItemModel = {
      props: { label: 'Custom age' },
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'formItemSettings' && stepKey === 'fieldSettings') {
          return { name: 'custom_age' };
        }
        return {};
      },
      subModels: {
        field: {},
      },
    };

    const formBlockModel = {
      context: { collection: null },
      subModels: { grid: { subModels: { items: [customItemModel] } } },
    };

    const t = (s: string) => s;
    const options = collectFieldAssignCascaderOptions({ formBlockModel, t });
    const customTargetPath = buildCustomFieldTargetPath('custom_age');

    expect(
      options.some((o: any) => o?.value === customTargetPath && o?.label === 'Custom age' && o?.isLeaf === true),
    ).toBe(true);
  });
});
