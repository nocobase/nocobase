/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import FlowModelRepository from '../repository';

describe('flow-model duplicate', () => {
  let app: MockServer;
  let repository: FlowModelRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  it('should duplicate subtree and keep parent linkage (attach to original parent, insert after original)', async () => {
    // Build parent -> root(uid: 'root') -> actions(uid: 'act')
    const parent = {
      uid: 'parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'root',
            use: 'TestModel',
            subModels: {
              actions: {
                uid: 'act',
                use: 'ChildModel',
                stepParams: { refRoot: 'root' },
              },
            },
          },
        ],
      },
    } as any;

    const saved = await repository.insertModel(parent);
    expect(saved.uid).toBe('parent');
    expect(saved.subModels.items.length).toBe(1);
    expect(saved.subModels.items[0].uid).toBe('root');
    expect(saved.subModels.items[0].subModels.actions.uid).toBe('act');

    const duplicated = await repository.duplicate('root');
    expect(duplicated).toBeTruthy();
    expect(duplicated.uid).not.toBe('root');
    const newRootUid = duplicated.uid;

    // parentId of duplicated root should be original parent
    expect(duplicated.parentId).toBe('parent');
    expect(duplicated.subKey).toBe('items');
    expect(duplicated.subType).toBe('array');

    // child action should be under new root and parentId should be new root uid
    const newAction = duplicated.subModels.actions;
    expect(newAction).toBeTruthy();
    expect(newAction.uid).not.toBe('act');
    expect(newAction.parentId).toBe(newRootUid);

    // stepParams deep replacement: refRoot should point to new root uid
    expect(newAction.stepParams?.refRoot).toBe(newRootUid);

    // Under parent: original first, then duplicated (insert after original)
    const parentAfter = await repository.findModelById('parent', { includeAsyncNode: true });
    const items = parentAfter.subModels.items;
    expect(items.length).toBe(2);
    expect(items[0].uid).toBe('root');
    expect(items[1].uid).toBe(newRootUid);
  });
});
