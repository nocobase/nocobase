/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisplayItemModel } from '@nocobase/flow-engine';
import { AssociationFieldGroupModel } from '../AssociationFieldGroupModel';

function createCollection(name: string, fields: any[]) {
  return {
    name,
    dataSourceKey: 'main',
    getFields: () => fields,
    getToOneAssociationFields: () => fields.filter((field) => field?.type === 'belongsTo' || field?.type === 'hasOne'),
  };
}

describe('AssociationFieldGroupModel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limits display association fields to relation / relation / field', () => {
    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({ modelName: 'InputFieldModel' } as any);

    const companies = createCollection('companies', [
      { name: 'title', title: 'Company title', interface: 'input', type: 'string' },
    ]);
    const departments = createCollection('departments', [
      { name: 'name', title: 'Department name', interface: 'input', type: 'string' },
      {
        name: 'company',
        title: 'Company',
        interface: 'm2o',
        type: 'belongsTo',
        target: 'companies',
        targetCollection: companies,
        isAssociationField: () => true,
      },
    ]);
    const users = createCollection('users', [
      {
        name: 'department',
        title: 'Department',
        interface: 'm2o',
        type: 'belongsTo',
        target: 'departments',
        targetCollection: departments,
        isAssociationField: () => true,
      },
    ]);
    const posts = createCollection('posts', [
      {
        name: 'user',
        title: 'User',
        interface: 'm2o',
        type: 'belongsTo',
        target: 'users',
        targetCollection: users,
        isAssociationField: () => true,
      },
    ]);

    const ctx = {
      collection: posts,
      t: (key: string) => key,
    } as any;

    const firstLevel = AssociationFieldGroupModel.defineChildren(ctx) as any[];
    const firstChildren = firstLevel[0].children();
    const firstAssociationGroup = firstChildren.find((item) => item.key === 'user-children-associationField');
    const secondLevel = firstAssociationGroup.children;
    const secondChildren = secondLevel[0].children();
    const secondFieldsGroup = secondChildren.find((item) => item.key === 'user.department-children-collectionField');

    expect(secondChildren.map((item) => item.key)).toContain('user.department-children-collectionField');
    expect(secondChildren.map((item) => item.key)).not.toContain('user.department-children-associationField');
    expect(secondFieldsGroup.children.map((item) => item.key)).toContain('c-user.department.name');
    expect(secondFieldsGroup.children.map((item) => item.key)).not.toContain('c-user.department.company');
  });
});
