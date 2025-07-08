/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Collection, Database } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import UiSchemaRepository from '../repository';

describe('ui_schema repository', () => {
  let app: MockServer;
  let db: Database;
  let repository: UiSchemaRepository;

  let treePathCollection: Collection;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['ui-schema-storage'],
    });

    db = app.db;
    repository = db.getCollection('uiSchemas').repository as UiSchemaRepository;
    treePathCollection = db.getCollection('uiSchemaTreePath');
  });

  it('should insert model', async () => {
    const model1 = {
      uid: 'uid1',
      use: 'TestModel',
    };
    const model2 = await repository.insertModel(model1);
    expect(model2).toBeDefined();
    expect(model2.uid).toBe('uid1');
    expect(model2.use).toBe('TestModel');
  });

  it('should insert model', async () => {
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

  it('should insert model', async () => {
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

  it('should insert model', async () => {
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

  it('should insert model', async () => {
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
    console.log(JSON.stringify(model2, null, 2));
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

  it('should upsert model', async () => {
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

  it('should upsert model', async () => {
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
    //   ['x-uid']: 'sub2-1',
    // });
    const model2 = await repository.findModelById('uid1');
    expect(model2.subModels.sub2[0].use).toBe('TestSubModel3');
    expect(model2.subModels.sub2[1].use).toBe('TestSubModel2');
    expect(model2.subModels.sub2[0].uid).toBe('sub2-2');
    expect(model2.subModels.sub2[1].uid).toBe('sub2-1');
  });
});
