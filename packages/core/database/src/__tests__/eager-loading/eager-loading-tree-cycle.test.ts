/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Model } from 'sequelize';
import type Database from '../../database';
import type { Collection } from '../../collection';
import { queryParentSQL, setRecursiveParent } from '../../eager-loading/eager-loading-tree';

function createInstance(id: string, parentId: string | null) {
  const dataValues: Record<string, unknown> = { id, parentId };
  return {
    dataValues,
    get(key: string) {
      return dataValues[key];
    },
  } as unknown as Model;
}

describe('recursive parent eager loading', () => {
  it('keeps the complete parent chain when it is acyclic', () => {
    const categoryA = createInstance('a', null);
    const categoryB = createInstance('b', 'a');
    const categoryC = createInstance('c', 'b');

    setRecursiveParent(categoryC, [categoryA, categoryB, categoryC], 'id', 'parentId', 'parent');

    expect(categoryC.dataValues.parent).toBe(categoryB);
    expect(categoryB.dataValues.parent).toBe(categoryA);
  });

  it('stops linking parents when the relationship contains a cycle', () => {
    const categoryA = createInstance('a', 'b');
    const categoryB = createInstance('b', 'a');

    expect(() => setRecursiveParent(categoryA, [categoryA, categoryB], 'id', 'parentId', 'parent')).not.toThrow();
    expect(categoryA.dataValues.parent).toBe(categoryB);
    expect(categoryB.dataValues.parent).toBeUndefined();
    expect(() => JSON.stringify(categoryA)).not.toThrow();
  });

  it('uses a distinct recursive CTE so cyclic rows converge', () => {
    const collection = {
      quotedTableName: () => '"categories"',
      model: {
        rawAttributes: {
          id: { field: 'id' },
          parentId: { field: 'parent_id' },
        },
      },
    } as unknown as Collection;
    const db = {
      sequelize: {
        getQueryInterface: () => ({ quoteIdentifier: (value: string) => `"${value}"` }),
      },
    } as unknown as Database;

    const { sql } = queryParentSQL({ db, collection, foreignKey: 'parentId', targetKey: 'id', nodeIds: ['a'] });

    expect(sql).toContain('\n      UNION\n');
    expect(sql).not.toContain('UNION ALL');
  });
});
