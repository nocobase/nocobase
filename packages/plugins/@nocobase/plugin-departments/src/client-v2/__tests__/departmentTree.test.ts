/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';

import { buildDepartmentTree, buildLazyDepartmentTreeNodes } from '../shared/department';

describe('department tree helpers', () => {
  it('builds department tree from flat department records', () => {
    expect(
      buildDepartmentTree([
        { id: 1, title: 'Headquarters' },
        { id: 2, title: 'Engineering', parentId: 1 },
        { id: 3, title: 'Frontend', parentId: 2 },
        { id: 4, title: 'Sales' },
      ]),
    ).toEqual([
      {
        id: 1,
        title: 'Headquarters',
        children: [
          {
            id: 2,
            title: 'Engineering',
            parentId: 1,
            children: [
              {
                id: 3,
                title: 'Frontend',
                parentId: 2,
              },
            ],
          },
        ],
      },
      {
        id: 4,
        title: 'Sales',
      },
    ]);
  });

  it('keeps records with missing parents as roots', () => {
    expect(buildDepartmentTree([{ id: 2, title: 'Engineering', parentId: 1 }])).toEqual([
      {
        id: 2,
        title: 'Engineering',
        parentId: 1,
      },
    ]);
  });

  it('keeps empty children only for lazy-loaded non-leaf departments', () => {
    expect(
      buildLazyDepartmentTreeNodes([
        { id: 1, title: 'Headquarters', isLeaf: false },
        { id: 2, title: 'Engineering', isLeaf: true, children: [] },
        { id: 3, title: 'Sales' },
      ]),
    ).toEqual([
      {
        id: 1,
        title: 'Headquarters',
        isLeaf: false,
        children: [],
      },
      {
        id: 2,
        title: 'Engineering',
        isLeaf: true,
      },
      {
        id: 3,
        title: 'Sales',
      },
    ]);
  });
});
