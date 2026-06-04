/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import type { MetaTreeNode } from '@nocobase/flow-engine';
import { limitAssociationMetaTree } from '../metaTreeAssociationDepth';

describe('limitAssociationMetaTree', () => {
  it('keeps relation / relation / normal field and removes deeper relation fields', async () => {
    const tree: MetaTreeNode[] = [
      {
        name: 'user',
        title: 'User',
        type: 'object',
        interface: 'm2o',
        options: { target: 'users' },
        paths: ['collection', 'user'],
        children: async () => [
          {
            name: 'department',
            title: 'Department',
            type: 'object',
            interface: 'm2o',
            options: { target: 'departments' },
            paths: ['collection', 'user', 'department'],
            children: async () => [
              {
                name: 'name',
                title: 'Name',
                type: 'string',
                interface: 'input',
                paths: ['collection', 'user', 'department', 'name'],
              },
              {
                name: 'company',
                title: 'Company',
                type: 'object',
                interface: 'm2o',
                options: { target: 'companies' },
                paths: ['collection', 'user', 'department', 'company'],
              },
            ],
          },
        ],
      },
    ];

    const limited = limitAssociationMetaTree(tree);
    const userChildren = await (limited[0].children as () => Promise<MetaTreeNode[]>)();
    const departmentChildren = await (userChildren[0].children as () => Promise<MetaTreeNode[]>)();

    expect(departmentChildren.map((node) => node.name)).toEqual(['name']);
  });
});
