/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import { DisplayItemModel, FlowEngine } from '@nocobase/flow-engine';
import { AssociationFieldGroupModel } from '../AssociationFieldGroupModel';

class LimitedAssociationFieldGroupModel extends AssociationFieldGroupModel {
  static itemModelName = 'TableColumnModel';
  static maxAssociationDepth = 2;
}

describe('AssociationFieldGroupModel depth control', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limits table association field nesting to relation / relation / normal field', async () => {
    vi.spyOn(DisplayItemModel, 'getDefaultBindingByField').mockReturnValue({
      modelName: 'MockFieldModel',
    } as any);

    const engine = new FlowEngine();
    const ds = engine.dataSourceManager.getDataSource('main');

    ds.addCollection({
      name: 'profiles',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'nickname', title: 'Nickname', type: 'string', interface: 'input' },
      ],
    });
    ds.addCollection({
      name: 'users',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'name', title: 'Name', type: 'string', interface: 'input' },
        { name: 'profile_id', type: 'integer', interface: 'number' },
        {
          name: 'profile',
          title: 'Profile',
          type: 'belongsTo',
          target: 'profiles',
          interface: 'm2o',
          foreignKey: 'profile_id',
        },
      ],
    });
    ds.addCollection({
      name: 'posts',
      fields: [
        { name: 'id', type: 'integer', interface: 'number' },
        { name: 'title', title: 'Title', type: 'string', interface: 'input' },
        { name: 'user_id', type: 'integer', interface: 'number' },
        {
          name: 'user',
          title: 'User',
          type: 'belongsTo',
          target: 'users',
          interface: 'm2o',
          foreignKey: 'user_id',
        },
      ],
    });

    const posts = ds.getCollection('posts');
    const ctx = {
      collection: posts,
      blockModel: {
        context: {
          collection: posts,
        },
      },
      t: (value: string) => value,
      engine,
    } as any;

    const children = LimitedAssociationFieldGroupModel.defineChildren(ctx) as any[];
    expect(children).toHaveLength(1);

    const firstLevelGroups = children[0].children();
    const associationGroup = firstLevelGroups.find((group) => group.key === 'user-children-associationField');
    expect(associationGroup).toBeTruthy();

    const secondLevelChildren = associationGroup.children;
    expect(secondLevelChildren).toHaveLength(1);
    expect(secondLevelChildren[0].key).toBe('user.profile-assocationField');

    const secondLevelGroups = secondLevelChildren[0].children();
    const nestedAssociationGroup = secondLevelGroups.find(
      (group) => group.key === 'user.profile-children-associationField',
    );
    expect(nestedAssociationGroup).toBeUndefined();

    const fieldGroup = secondLevelGroups.find((group) => group.key === 'user.profile-children-collectionField');
    expect(fieldGroup).toBeTruthy();
    expect(fieldGroup.children.some((item) => item.key === 'c-user.profile.nickname')).toBe(true);
  });
});
