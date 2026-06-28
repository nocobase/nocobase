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

type TestCollectionField = {
  name?: string;
  title?: string;
  interface?: string;
  target?: string;
  targetCollection?: unknown;
  isAssociationField?: () => boolean;
};

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

  it('preserves configured display association field paths as nested cascader options', () => {
    const orgNameField = {
      name: 'orgname',
      title: '公司名称(单行文本)',
      interface: 'input',
      type: 'string',
      isAssociationField: () => false,
    };
    const orgCollection = {
      getFields: () => [orgNameField],
      getField: (name: string) => (name === 'orgname' ? orgNameField : null),
    };
    const orgAssociationField = {
      name: 'org_m2o',
      title: 'org_m2o',
      interface: 'm2o',
      type: 'belongsTo',
      target: 'org',
      isAssociationField: () => true,
      targetCollection: orgCollection,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'org_m2o' ? orgAssociationField : null),
      getFields: () => [orgAssociationField],
    };
    const displayAssociationItemModel = {
      props: { label: '公司名称(单行文本)' },
      getStepParams: (flowKey: string, stepKey: string) => {
        if (flowKey === 'fieldSettings' && stepKey === 'init') return { fieldPath: 'org_m2o.orgname' };
        return {};
      },
      subModels: {
        field: {
          context: { collectionField: orgNameField },
        },
      },
    };
    const formBlockModel = {
      context: { collection: rootCollection },
      subModels: { grid: { subModels: { items: [displayAssociationItemModel] } } },
    };

    const options = collectFieldAssignCascaderOptions({ formBlockModel, t: (s) => s });
    const orgOption = options.find((option) => option.value === 'org_m2o');

    expect(orgOption?.isLeaf).toBe(false);
    expect(orgOption?.children?.some((child) => child.value === 'orgname' && child.isLeaf === true)).toBe(true);
    expect(options.some((option) => option.value === 'orgname')).toBe(false);
  });

  it('hides configured association fields deeper than relation / relation / field', () => {
    const makeItem = (fieldPath: string, field: TestCollectionField, label: string) => ({
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
    const usersOption = options.find((item) => item.value === 'users');
    const departmentOption = usersOption?.children?.find((item) => item.value === 'department');

    expect(departmentOption?.children?.map((item) => item.value)).toContain('name');
    expect(departmentOption?.children?.map((item) => item.value)).not.toContain('company');
  });

  it('hides configured non-association fields under a third association level', () => {
    const codeField = {
      name: 'code',
      title: 'Code',
      interface: 'input',
      isAssociationField: () => false,
    };
    const companyCollection = {
      getField: (name: string) => (name === 'code' ? codeField : null),
      getFields: () => [codeField],
    };
    const companyField = {
      name: 'company',
      title: 'Company',
      interface: 'm2o',
      target: 'companies',
      isAssociationField: () => true,
      targetCollection: companyCollection,
    };
    const nameField = {
      name: 'name',
      title: 'Name',
      interface: 'input',
      isAssociationField: () => false,
    };
    const departmentCollection = {
      getField: (name: string) => (name === 'name' ? nameField : name === 'company' ? companyField : null),
      getFields: () => [nameField, companyField],
    };
    const departmentField = {
      name: 'department',
      title: 'Department',
      interface: 'm2o',
      target: 'departments',
      isAssociationField: () => true,
      targetCollection: departmentCollection,
    };
    const userCollection = {
      getField: (name: string) => (name === 'department' ? departmentField : null),
      getFields: () => [departmentField],
    };
    const usersField = {
      name: 'users',
      title: 'Users',
      interface: 'm2m',
      target: 'users',
      isAssociationField: () => true,
      targetCollection: userCollection,
    };
    const rootCollection = {
      getField: (name: string) => (name === 'users' ? usersField : null),
      getFields: () => [usersField],
    };
    const makeItem = (fieldPath: string, field: TestCollectionField, label: string) => ({
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
    const formBlockModel = {
      context: { collection: rootCollection },
      subModels: {
        grid: {
          subModels: {
            items: [
              makeItem('users.department.name', nameField, 'Department name'),
              makeItem('users.department.company.code', codeField, 'Company code'),
            ],
          },
        },
      },
    };

    const options = collectFieldAssignCascaderOptions({ formBlockModel, t: (s) => s });
    const usersOption = options.find((item) => item.value === 'users');
    const departmentOption = usersOption?.children?.find((item) => item.value === 'department');

    expect(departmentOption?.children?.map((item) => item.value)).toContain('name');
    expect(departmentOption?.children?.map((item) => item.value)).not.toContain('company');
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
