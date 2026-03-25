/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import FlowModelRepository from '../repository';
import { createFlowEngineTestApp, destroyTestApp } from './test-utils';

describe('flow-model attach', () => {
  let app: any;
  let repository: FlowModelRepository;

  const insertModel = (model: Record<string, any>) => repository.insertModel(model as any);

  afterEach(async () => {
    await destroyTestApp(app);
    app = null;
  });

  beforeEach(async () => {
    ({ app } = await createFlowEngineTestApp());
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  it('should attach existing subtree and keep async nodes', async () => {
    await insertModel({ uid: 'parent', use: 'ParentModel' });
    await insertModel({
      uid: 'childA',
      use: 'ChildModel',
      subModels: {
        page: {
          uid: 'page',
          async: true,
          use: 'PageModel',
          subModels: {
            content: {
              uid: 'content',
              use: 'ContentModel',
            },
          },
        },
      },
    });

    const attached = await repository.attach('childA', {
      parentId: 'parent',
      subKey: 'items',
      subType: 'array',
      position: 'last',
    });

    expect(attached).toBeTruthy();
    expect(attached.uid).toBe('childA');
    expect(attached.parentId).toBe('parent');
    expect(attached.subKey).toBe('items');
    expect(attached.subType).toBe('array');
    expect(attached.subModels?.page).toBeTruthy();
    expect(attached.subModels.page.subModels?.content).toBeTruthy();

    const nodes = await repository.findNodesById('childA', { includeAsyncNode: true });
    const pageNode = nodes.find((n: any) => n?.uid === 'page');
    expect(pageNode?.async).toBeTruthy();

    const parent = await repository.findModelById('parent', { includeAsyncNode: true });
    expect(parent.subModels?.items).toBeTruthy();
    expect(parent.subModels.items).toHaveLength(1);
    expect(parent.subModels.items[0].uid).toBe('childA');
  });

  it('should support ordering (before/after) when attaching into array subKey', async () => {
    await insertModel({ uid: 'parent', use: 'ParentModel' });
    await insertModel({ uid: 'childB', use: 'ChildModel' });
    await insertModel({ uid: 'childA', use: 'ChildModel' });

    await repository.attach('childB', { parentId: 'parent', subKey: 'items', subType: 'array', position: 'last' });
    await repository.attach('childA', {
      parentId: 'parent',
      subKey: 'items',
      subType: 'array',
      position: { type: 'before', target: 'childB' },
    });

    const parent = await repository.findModelById('parent', { includeAsyncNode: true });
    expect(parent.subModels?.items).toBeTruthy();
    expect(parent.subModels.items).toHaveLength(2);
    expect(parent.subModels.items[0].uid).toBe('childA');
    expect(parent.subModels.items[1].uid).toBe('childB');
  });

  it('should reject cycle', async () => {
    await insertModel({
      uid: 'root',
      use: 'RootModel',
      subModels: {
        items: [
          {
            uid: 'desc',
            use: 'DescModel',
          },
        ],
      },
    });

    await expect(
      repository.attach('root', { parentId: 'desc', subKey: 'items', subType: 'array', position: 'last' }),
    ).rejects.toThrow(/cycle/i);
  });

  it('should reject object subKey conflict', async () => {
    await insertModel({ uid: 'parent', use: 'ParentModel' });
    await insertModel({ uid: 'child1', use: 'ChildModel' });
    await insertModel({ uid: 'child2', use: 'ChildModel' });

    await repository.attach('child1', { parentId: 'parent', subKey: 'grid', subType: 'object', position: 'last' });

    await expect(
      repository.attach('child2', { parentId: 'parent', subKey: 'grid', subType: 'object', position: 'last' }),
    ).rejects.toThrow(/already exists/i);
  });
});
