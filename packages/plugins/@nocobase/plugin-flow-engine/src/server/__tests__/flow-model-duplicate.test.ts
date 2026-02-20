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

  it('should duplicate subtree and keep subtree linkage', async () => {
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

    // 保持子树内部关联，不强制要求根节点重新挂载到原父级
    expect(duplicated.subKey).toBe('items');
    expect(duplicated.subType).toBe('array');

    // child action should be under new root and parentId should be new root uid
    const newAction = duplicated.subModels.actions;
    expect(newAction).toBeTruthy();
    expect(newAction.uid).not.toBe('act');
    expect(newAction.parentId).toBe(newRootUid);

    // stepParams deep replacement: refRoot should point to new root uid
    expect(newAction.stepParams?.refRoot).toBe(newRootUid);
  });

  it('should duplicate when a node has multiple parents in tree path', async () => {
    const tree = {
      uid: 'tree-parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'tree-root',
            use: 'RootModel',
            subModels: {
              inner: {
                uid: 'p-in',
                use: 'InnerParentModel',
                subModels: {
                  child: {
                    uid: 'shared-child',
                    use: 'ChildModel',
                  },
                },
              },
            },
          },
        ],
      },
    } as any;

    await repository.insertModel(tree);

    const treePath = app.db.getCollection('flowModelTreePath').repository;
    await treePath.create({
      values: {
        ancestor: 'z-external-parent',
        descendant: 'shared-child',
        depth: 1,
      },
    });

    const duplicated = await repository.duplicate('tree-root');
    expect(duplicated).toBeTruthy();
    expect(duplicated.uid).not.toBe('tree-root');

    const newInner = duplicated.subModels.inner;
    expect(newInner).toBeTruthy();
    expect(newInner.uid).not.toBe('p-in');

    const newChild = newInner.subModels.child;
    expect(newChild).toBeTruthy();
    expect(newChild.uid).not.toBe('shared-child');
    expect(newChild.parentId).toBe(newInner.uid);
  });

  it('should duplicate async subtrees (async nodes are not returned by default)', async () => {
    const tree = {
      uid: 'dup-parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'dup-root',
            use: 'RootModel',
            subModels: {
              // 模拟弹窗/子页面等按需加载的异步子树
              page: {
                uid: 'dup-page',
                async: true,
                use: 'PageModel',
                subModels: {
                  content: {
                    uid: 'dup-page-content',
                    use: 'ContentModel',
                  },
                },
              },
            },
          },
        ],
      },
    } as any;

    await repository.insertModel(tree);

    const duplicated = await repository.duplicate('dup-root');
    expect(duplicated).toBeTruthy();
    expect(duplicated.uid).not.toBe('dup-root');

    // duplicate() 默认返回不包含 async 子树（与 findModelById 的默认行为一致）
    expect(duplicated.subModels?.page).toBeUndefined();

    // 需要显式 includeAsyncNode 才能读取到异步子树
    const duplicatedWithAsync = await repository.findModelById(duplicated.uid, { includeAsyncNode: true });
    const newPage = duplicatedWithAsync.subModels?.page;
    expect(newPage).toBeTruthy();
    expect(newPage.uid).not.toBe('dup-page');
    expect(newPage.parentId).toBe(duplicated.uid);

    const newContent = newPage.subModels?.content;
    expect(newContent).toBeTruthy();
    expect(newContent.uid).not.toBe('dup-page-content');
    expect(newContent.parentId).toBe(newPage.uid);
  });
});
