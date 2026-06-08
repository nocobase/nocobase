/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import FlowModelRepository from '../repository';
import { createFlowEngineMockServer } from './test-utils';

describe('ui_schema repository', () => {
  let app: MockServer;
  let db: Database;
  let repository: FlowModelRepository;

  let treePathCollection: Collection;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createFlowEngineMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });

    db = app.db;
    repository = db.getCollection('flowModels').repository as FlowModelRepository;
    treePathCollection = db.getCollection('flowModelTreePath');
  });

  it('should insert a flat model', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
  });

  it('should insert a model with mixed object and array subModels', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel',
        },
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBe('sub2-1');
    expect(model2.subModels.sub2[1].uid).toBe('sub2-2');
  });

  it('should use row uid and tree parent when stored options are polluted', async () => {
    await repository.insertModel({
      uid: 'read-parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'read-child',
            use: 'ChildModel',
          },
        ],
      },
    } as any);

    const row = await repository.model.findByPk('read-child');
    const options = FlowModelRepository.optionsToJson(row.get('options') || {});
    await row.update(
      {
        options: {
          ...options,
          uid: 'wrong-child',
          parent: 'wrong-parent',
          parentId: 'wrong-parent',
        },
      },
      {
        hooks: false,
      },
    );

    const parent = await repository.findModelById('read-parent', { includeAsyncNode: true });
    const child = parent.subModels.items[0];
    expect(child.uid).toBe('read-child');
    expect(child.parent).toBe('read-parent');
    expect(child.parentId).toBe('read-parent');

    const directChild = await repository.findModelById('read-child', { includeAsyncNode: true });
    expect(directChild.uid).toBe('read-child');
    expect(directChild.parent).toBe('read-parent');
    expect(directChild.parentId).toBe('read-parent');
  });

  it('should insert a deeply nested model tree', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel',
          subModels: {
            sub2: [
              {
                uid: 'sub2-1',
                use: 'TestSubModel2',
              },
              {
                uid: 'sub2-2',
                use: 'TestSubModel3',
              },
            ],
            sub3: {
              uid: 'sub3',
              use: 'TestSubModel4',
            },
          },
        },
      },
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.uid).toBe('sub1');
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub1.subModels).toBeDefined();
    expect(model2.subModels.sub1.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub1.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub1.subModels.sub2[0].uid).toBe('sub2-1');
    expect(model2.subModels.sub1.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub1.subModels.sub2[1].uid).toBe('sub2-2');
    expect(model2.subModels.sub1.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub1.subModels.sub3).toBeDefined();
    expect(model2.subModels.sub1.subModels.sub3.uid).toBe('sub3');
    expect(model2.subModels.sub1.subModels.sub3.use).toBe('TestSubModel4');
  });

  it('should auto-generate missing uids while inserting subModels', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          use: 'TestSubModel',
        },
        sub2: [
          {
            use: 'TestSubModel2',
          },
          {
            use: 'TestSubModel3',
          },
        ],
      },
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBeDefined();
    expect(model2.subModels.sub2[1].uid).toBeDefined();
  });

  it('should skip async subModels on insert readback by default', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          async: true, // 模拟异步加载
          use: 'TestSubModel',
        },
        sub2: [
          {
            async: true, // 模拟异步加载
            use: 'TestSubModel2',
          },
          {
            use: 'TestSubModel3',
          },
        ],
      },
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).not.toBeDefined();
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(1);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBeDefined();
  });

  it('findModelById includeAsyncNode', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          async: true, // 模拟异步加载
          use: 'TestSubModel',
        },
        sub2: [
          {
            async: true, // 模拟异步加载
            use: 'TestSubModel2',
          },
          {
            use: 'TestSubModel3',
          },
        ],
      },
    };
    await repository.insertModel(model1);
    const model2 = await repository.findModelById('uid1', { includeAsyncNode: true });
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBeDefined();
    expect(model2.subModels.sub2[1].uid).toBeDefined();
  });

  it('should upsert an existing model tree in place', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel',
        },
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    };
    const uid = await repository.upsertModel(model1);
    expect(uid).toBe('uid1');
    const model2 = await repository.findModelById('uid1');
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBe('sub2-1');
    expect(model2.subModels.sub2[1].uid).toBe('sub2-2');
    const model3 = {
      uid: 'uid1',
      use: 'TestModel_1',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel_1',
        },
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2_1',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3_1',
          },
        ],
      },
    };
    await repository.upsertModel(model3);
    const model4 = await repository.findModelById('uid1');
    expect(model4).toBeDefined();
    expect(model4.uid).toBe('uid1');
    expect(model4.use).toBe('TestModel_1');
    expect(model4.subModels).toBeDefined();
    expect(model4.subModels.sub1).toBeDefined();
    expect(model4.subModels.sub1.use).toBe('TestSubModel_1');
    expect(model4.subModels.sub2).toBeDefined();
    expect(model4.subModels.sub2.length).toBe(2);
    expect(model4.subModels.sub2[0].use).toBe('TestSubModel2_1');
    expect(model4.subModels.sub2[1].use).toBe('TestSubModel3_1');
    expect(model4.subModels.sub2[0].uid).toBe('sub2-1');
    expect(model4.subModels.sub2[1].uid).toBe('sub2-2');
    await repository.upsertModel({
      uid: 'sub2-2',
      use: 'TestSubModel3_2',
    });
    const model5 = await repository.findModelById('uid1');
    expect(model5.subModels.sub2[1].use).toBe('TestSubModel3_2');
  });

  it('should append a missing array child during upsert', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel',
        },
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    };
    const uid = await repository.upsertModel(model1);
    expect(uid).toBe('uid1');
    const model2 = await repository.findModelById('uid1');
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
    expect(model2.subModels).toBeDefined();
    expect(model2.subModels.sub1).toBeDefined();
    expect(model2.subModels.sub1.use).toBe('TestSubModel');
    expect(model2.subModels.sub2).toBeDefined();
    expect(model2.subModels.sub2.length).toBe(2);
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[0].uid).toBe('sub2-1');
    expect(model2.subModels.sub2[1].uid).toBe('sub2-2');
    const model3 = {
      uid: 'uid1',
      use: 'TestModel_1',
      subModels: {
        sub1: {
          uid: 'sub1',
          use: 'TestSubModel_1',
        },
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2_1',
          },
        ],
      },
    };
    await repository.upsertModel(model3);
    const model4 = await repository.findModelById('uid1');
    expect(model4).toBeDefined();
    expect(model4.uid).toBe('uid1');
    expect(model4.use).toBe('TestModel_1');
    expect(model4.subModels).toBeDefined();
    expect(model4.subModels.sub1).toBeDefined();
    expect(model4.subModels.sub1.use).toBe('TestSubModel_1');
    expect(model4.subModels.sub2).toBeDefined();
    expect(model4.subModels.sub2.length).toBe(2);
    expect(model4.subModels.sub2[0].use).toBe('TestSubModel2_1');
    expect(model4.subModels.sub2[0].uid).toBe('sub2-1');
    await repository.upsertModel({
      uid: 'sub2-2',
      parentId: 'uid1',
      subType: 'array',
      subKey: 'sub2',
      use: 'TestSubModel3_1',
    });
    const model5 = await repository.findModelById('uid1');
    expect(model5.subModels.sub2[1].use).toBe('TestSubModel3_1');
  });

  it('should drop polluted options uid when updating an existing model', async () => {
    await repository.insertModel({
      uid: 'update-parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'update-child',
            use: 'ChildModel',
          },
        ],
      },
    } as any);

    const row = await repository.model.findByPk('update-child');
    const options = FlowModelRepository.optionsToJson(row.get('options') || {});
    await row.update(
      {
        options: {
          ...options,
          uid: 'update-child',
        },
      },
      {
        hooks: false,
      },
    );

    await repository.upsertModel({
      uid: 'update-child',
      parentId: 'update-parent',
      subKey: 'items',
      subType: 'array',
      use: 'UpdatedChildModel',
    } as any);

    const updatedRow = await repository.model.findByPk('update-child');
    const updatedOptions = FlowModelRepository.optionsToJson(updatedRow.get('options') || {});
    expect(updatedOptions.uid).toBeUndefined();
    expect(updatedOptions.parent).toBe('update-parent');
    expect(updatedOptions.parentId).toBe('update-parent');

    const parent = await repository.findModelById('update-parent', { includeAsyncNode: true });
    expect(parent.subModels.items[0].uid).toBe('update-child');
    expect(parent.subModels.items[0].use).toBe('UpdatedChildModel');
  });

  it('should drop polluted options uid when patching a model', async () => {
    await repository.insertModel({
      uid: 'patch-model',
      use: 'PatchModel',
    } as any);

    const row = await repository.model.findByPk('patch-model');
    const options = FlowModelRepository.optionsToJson(row.get('options') || {});
    await row.update(
      {
        options: {
          ...options,
          uid: 'patch-model',
        },
      },
      {
        hooks: false,
      },
    );

    await repository.patch({
      uid: 'patch-model',
      stepParams: {
        patchSettings: {
          enabled: true,
        },
      },
    });

    const patchedRow = await repository.model.findByPk('patch-model');
    const patchedOptions = FlowModelRepository.optionsToJson(patchedRow.get('options') || {});
    expect(patchedOptions.uid).toBeUndefined();
    expect(patchedOptions.stepParams.patchSettings.enabled).toBe(true);
  });

  it('should drop polluted options uid when patching a schema tree', async () => {
    await repository.insert({
      uid: 'patch-schema-root',
      type: 'void',
      properties: {
        field: {
          uid: 'patch-schema-field',
          type: 'string',
          title: 'Original title',
        },
      },
    });

    const row = await repository.model.findByPk('patch-schema-field');
    const options = FlowModelRepository.optionsToJson(row.get('options') || {});
    await row.update(
      {
        options: {
          ...options,
          uid: 'patch-schema-field',
        },
      },
      {
        hooks: false,
      },
    );

    await repository.patch({
      uid: 'patch-schema-root',
      type: 'void',
      properties: {
        field: {
          type: 'string',
          title: 'Updated title',
        },
      },
    });

    const patchedRow = await repository.model.findByPk('patch-schema-field');
    const patchedOptions = FlowModelRepository.optionsToJson(patchedRow.get('options') || {});
    expect(patchedOptions.uid).toBeUndefined();
    expect(patchedOptions.title).toBe('Updated title');
  });

  it('should move model', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    };
    await repository.insertModel(model1);
    await repository.move({ sourceId: 'sub2-1', targetId: 'sub2-2', position: 'after' });
    // await repository.insertAdjacent('afterEnd', 'sub2-2', {
    //   ['uid']: 'sub2-1',
    // });
    const model2 = await repository.findModelById('uid1');
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[0].uid).toBe('sub2-2');
    expect(model2.subModels.sub2[1].uid).toBe('sub2-1');
  });

  it('should reject invalid move position', async () => {
    await repository.insertModel({
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    });

    await expect(
      repository.move({ sourceId: 'sub2-1', targetId: 'sub2-2', position: 'middle' as never }),
    ).rejects.toThrow('flowModels:move invalid position');
  });

  it('should ignore self move without changing sort', async () => {
    await repository.insertModel({
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    });

    await repository.move({ sourceId: 'sub2-1', targetId: 'sub2-1', position: 'before' });

    const model2 = await repository.findModelById('uid1');
    expect(model2.subModels.sub2.map((item) => item.uid)).toEqual(['sub2-1', 'sub2-2']);
    const rows = await treePathCollection.model.findAll({
      where: {
        ancestor: 'uid1',
        depth: 1,
      },
      order: [['sort', 'ASC']],
    });
    expect(rows.map((row) => row.get('sort'))).toEqual([1, 2]);
  });

  it('should normalize null sibling sort before moving model', async () => {
    await repository.insertModel({
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
          {
            uid: 'sub2-3',
            use: 'TestSubModel4',
          },
        ],
      },
    });

    await treePathCollection.model.update(
      { sort: null },
      {
        where: {
          ancestor: 'uid1',
          depth: 1,
        },
      },
    );

    await repository.move({ sourceId: 'sub2-3', targetId: 'sub2-2', position: 'before' });

    const model2 = await repository.findModelById('uid1');
    expect(model2.subModels.sub2.map((item) => item.uid)).toEqual(['sub2-1', 'sub2-3', 'sub2-2']);
    expect(model2.subModels.sub2.map((item) => item.sortIndex)).toEqual([1, 2, 3]);

    const rows = await treePathCollection.model.findAll({
      where: {
        ancestor: 'uid1',
        depth: 1,
      },
      order: [['sort', 'ASC']],
    });
    expect(rows.map((row) => row.get('descendant'))).toEqual(['sub2-1', 'sub2-3', 'sub2-2']);
    expect(rows.map((row) => row.get('sort'))).toEqual([1, 2, 3]);
  });

  it('should move a detached duplicated tree beside a target model', async () => {
    await repository.insertModel({
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
            subModels: {
              sub3: {
                uid: 'sub2-1-child',
                use: 'TestSubModelChild',
              },
            },
          },
          {
            uid: 'sub2-2',
            use: 'TestSubModel3',
          },
        ],
      },
    });

    const duplicated = await repository.duplicate('sub2-1');
    await repository.move({ sourceId: duplicated.uid, targetId: 'sub2-2', position: 'after' });

    const model2 = await repository.findModelById('uid1', { includeAsyncNode: true });
    expect(model2.subModels.sub2.map((item) => item.uid)).toEqual(['sub2-1', 'sub2-2', duplicated.uid]);
    expect(model2.subModels.sub2.map((item) => item.sortIndex)).toEqual([1, 2, 3]);
    expect(model2.subModels.sub2[2].parentId).toBe('uid1');
    expect(model2.subModels.sub2[2].subKey).toBe('sub2');
    expect(model2.subModels.sub2[2].subType).toBe('array');
    expect(model2.subModels.sub2[2].subModels.sub3).toBeTruthy();

    const duplicatedRow = await repository.model.findByPk(duplicated.uid);
    const duplicatedOptions = FlowModelRepository.optionsToJson(duplicatedRow.get('options') || {});
    expect(duplicatedOptions.parentId).toBe('uid1');
    expect(duplicatedOptions.subKey).toBe('sub2');
    expect(duplicatedOptions.subType).toBe('array');
  });

  it('should move a model across parents and normalize both sibling lists', async () => {
    await repository.insertModel({
      uid: 'root',
      use: 'RootModel',
      subModels: {
        left: [
          {
            uid: 'left-1',
            use: 'LeftModel1',
          },
          {
            uid: 'left-2',
            use: 'LeftModel2',
          },
        ],
        right: [
          {
            uid: 'right-1',
            use: 'RightModel1',
          },
          {
            uid: 'right-2',
            use: 'RightModel2',
          },
        ],
      },
    });

    await treePathCollection.model.update(
      { sort: null },
      {
        where: {
          ancestor: 'root',
          depth: 1,
        },
      },
    );

    await repository.move({ sourceId: 'left-1', targetId: 'right-2', position: 'before' });

    const root = await repository.findModelById('root', { includeAsyncNode: true });
    expect(root.subModels.left.map((item) => item.uid)).toEqual(['left-2']);
    expect(root.subModels.left.map((item) => item.sortIndex)).toEqual([1]);
    expect(root.subModels.right.map((item) => item.uid)).toEqual(['right-1', 'left-1', 'right-2']);
    expect(root.subModels.right.map((item) => item.sortIndex)).toEqual([1, 2, 3]);
    expect(root.subModels.right[1].parentId).toBe('root');
    expect(root.subModels.right[1].subKey).toBe('right');
    expect(root.subModels.right[1].subType).toBe('array');

    const movedRow = await repository.model.findByPk('left-1');
    const movedOptions = FlowModelRepository.optionsToJson(movedRow.get('options') || {});
    expect(movedOptions.parentId).toBe('root');
    expect(movedOptions.subKey).toBe('right');
    expect(movedOptions.subType).toBe('array');
  });

  it('should allow moving a duplicated object submodel beside an existing object submodel', async () => {
    await repository.insertModel({
      uid: 'form',
      use: 'FormModel',
      subModels: {
        grid: {
          uid: 'grid-1',
          use: 'GridModel',
        },
      },
    });

    const duplicated = await repository.duplicate('grid-1');
    await repository.move({ sourceId: duplicated.uid, targetId: 'grid-1', position: 'after' });
    await repository.remove('grid-1');

    const form = await repository.findModelById('form', { includeAsyncNode: true });
    expect(form.subModels.grid.uid).toBe(duplicated.uid);
    expect(form.subModels.grid.parentId).toBe('form');
    expect(form.subModels.grid.subKey).toBe('grid');
    expect(form.subModels.grid.subType).toBe('object');

    const duplicatedRow = await repository.model.findByPk(duplicated.uid);
    const duplicatedOptions = FlowModelRepository.optionsToJson(duplicatedRow.get('options') || {});
    expect(duplicatedOptions.parentId).toBe('form');
    expect(duplicatedOptions.subKey).toBe('grid');
    expect(duplicatedOptions.subType).toBe('object');
  });

  it('should reject moving a missing source model', async () => {
    await repository.insertModel({
      uid: 'uid1',
      use: 'TestModel',
      subModels: {
        sub2: [
          {
            uid: 'sub2-1',
            use: 'TestSubModel2',
          },
        ],
      },
    });

    await expect(repository.move({ sourceId: 'missing', targetId: 'sub2-1', position: 'after' })).rejects.toThrow(
      "flowModels:move sourceId 'missing' not found",
    );
  });

  it('should reject moving beside a detached target model', async () => {
    await repository.insertModel({ uid: 'source', use: 'SourceModel' });
    await repository.insertModel({ uid: 'target', use: 'TargetModel' });

    await expect(repository.move({ sourceId: 'source', targetId: 'target', position: 'after' })).rejects.toThrow(
      'flowModels:move target is not attached to a parent',
    );
  });

  it('should reject moving a model beside its descendant', async () => {
    await repository.insertModel({
      uid: 'root',
      use: 'RootModel',
      subModels: {
        items: [
          {
            uid: 'parent',
            use: 'ParentModel',
            subModels: {
              items: [
                {
                  uid: 'child',
                  use: 'ChildModel',
                },
              ],
            },
          },
        ],
      },
    });

    await expect(repository.move({ sourceId: 'parent', targetId: 'child', position: 'after' })).rejects.toThrow(
      'flowModels:move cycle detected',
    );
  });

  it('should sort schema children deterministically when sibling sort is null', () => {
    const schema = repository.nodesToSchema(
      [
        {
          uid: 'uid1',
          name: 'uid1',
          options: { type: 'object' },
          async: false,
          sort: 0,
        },
        {
          uid: 'field-b',
          name: 'fieldB',
          options: { type: 'string' },
          async: false,
          parent: 'uid1',
          type: 'properties',
          sort: null,
        },
        {
          uid: 'field-a',
          name: 'fieldA',
          options: { type: 'string' },
          async: false,
          parent: 'uid1',
          type: 'properties',
          sort: null,
        },
        {
          uid: 'field-c',
          name: 'fieldC',
          options: { type: 'string' },
          async: false,
          parent: 'uid1',
          type: 'properties',
          sort: '1',
        },
      ],
      'uid1',
    );

    expect(Object.keys(schema.properties)).toEqual(['fieldC', 'fieldA', 'fieldB']);
    expect(schema.properties.fieldC['x-index']).toBe(1);
  });
});
