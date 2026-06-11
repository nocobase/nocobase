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
import {
  buildFieldAssignCascaderOptionsFromCollection,
  collectFieldAssignCascaderOptions,
} from '../fieldAssignOptions';

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

  it('hides configured association fields deeper than relation / relation / field', () => {
    const makeItem = (fieldPath: string, field: any, label: string) => ({
      props: { label },
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') return { fieldPath };
        return {};
      },
      subModels: {
        field: {
          context: { collectionField: field },
        },
      },
    });

    const companyField = {
      name: 'company',
      title: 'Company',
      interface: 'm2o',
      target: 'companies',
      isAssociationField: () => true,
      targetCollection: { getFields: () => [] },
    };
    const nameField = {
      name: 'name',
      title: 'Name',
      interface: 'input',
      isAssociationField: () => false,
    };
    const formBlockModel = {
      context: { collection: null },
      subModels: {
        grid: {
          subModels: {
            items: [
              makeItem('users.department.name', nameField, 'Department name'),
              makeItem('users.department.company', companyField, 'Company'),
            ],
          },
        },
      },
    };

    const options = collectFieldAssignCascaderOptions({ formBlockModel, t: (s) => s });

    expect(options.map((item) => item.value)).toContain('name');
    expect(options.map((item) => item.value)).not.toContain('company');
  });

  it('hides lazy-loaded association selector options after two association levels', () => {
    const collection = {
      getFields: () => [
        { name: 'name', title: 'Name', interface: 'input' },
        {
          name: 'company',
          title: 'Company',
          interface: 'm2o',
          target: 'companies',
          targetCollection: { getFields: () => [] },
        },
      ],
    };

    const options = buildFieldAssignCascaderOptionsFromCollection(collection, (s) => s, { associationDepth: 2 });

    expect(options.map((item) => item.value)).toEqual(['name']);
  });
});
