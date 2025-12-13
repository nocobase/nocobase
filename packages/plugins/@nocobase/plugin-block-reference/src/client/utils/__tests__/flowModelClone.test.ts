/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect } from 'vitest';
import { FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { duplicateModelTreeLocally } from '../flowModelClone';

class RootModel extends FlowModel {}
class ChildModel extends FlowModel {}

describe('duplicateModelTreeLocally', () => {
  it('duplicates a tree and remaps uids', () => {
    const engine = new FlowEngine();
    engine.registerModels({ RootModel, ChildModel });

    const root = engine.createModel<RootModel>({
      uid: 'root',
      use: 'RootModel',
      stepParams: {
        x: 'child-1',
        deep: { a: ['child-2'] },
      },
    });

    const child1 = engine.createModel<ChildModel>({
      uid: 'child-1',
      use: 'ChildModel',
      parentId: root.uid,
      subKey: 'items',
      subType: 'array',
    });
    const child2 = engine.createModel<ChildModel>({
      uid: 'child-2',
      use: 'ChildModel',
      parentId: root.uid,
      subKey: 'items',
      subType: 'array',
    });

    root.addSubModel('items', child1);
    root.addSubModel('items', child2);

    const { duplicated, uidMap } = duplicateModelTreeLocally(root);

    expect(duplicated.uid).not.toBe(root.uid);
    expect(uidMap[root.uid]).toBe(duplicated.uid);

    // stepParams string refs should be remapped
    expect(duplicated.stepParams.x).toBe(uidMap['child-1']);
    expect(duplicated.stepParams.deep.a[0]).toBe(uidMap['child-2']);

    // children should be duplicated
    expect(Array.isArray(duplicated.subModels?.items)).toBe(true);
    expect(duplicated.subModels.items.length).toBe(2);
    const childUids = duplicated.subModels.items.map((c) => c.uid);
    expect(childUids).toEqual([uidMap['child-1'], uidMap['child-2']]);

    // parentId should be rewritten during recursion
    expect(duplicated.subModels.items[0].parentId).toBe(duplicated.uid);
    expect(duplicated.subModels.items[1].parentId).toBe(duplicated.uid);
  });
});
