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

describe('flow-model attach', () => {
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

  it('should attach existing subtree and keep async nodes', async () => {
    await repository.insertModel({ uid: 'parent', use: 'ParentModel' } as any);
    await repository.insertModel({
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
    } as any);

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
    await repository.insertModel({ uid: 'parent', use: 'ParentModel' } as any);
    await repository.insertModel({ uid: 'childB', use: 'ChildModel' } as any);
    await repository.insertModel({ uid: 'childA', use: 'ChildModel' } as any);

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
    await repository.insertModel({
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
    } as any);

    await expect(
      repository.attach('root', { parentId: 'desc', subKey: 'items', subType: 'array', position: 'last' }),
    ).rejects.toThrow(/cycle/i);
  });

  it('should reject object subKey conflict', async () => {
    await repository.insertModel({ uid: 'parent', use: 'ParentModel' } as any);
    await repository.insertModel({ uid: 'child1', use: 'ChildModel' } as any);
    await repository.insertModel({ uid: 'child2', use: 'ChildModel' } as any);

    await repository.attach('child1', { parentId: 'parent', subKey: 'grid', subType: 'object', position: 'last' });

    await expect(
      repository.attach('child2', { parentId: 'parent', subKey: 'grid', subType: 'object', position: 'last' }),
    ).rejects.toThrow(/already exists/i);
  });
});
