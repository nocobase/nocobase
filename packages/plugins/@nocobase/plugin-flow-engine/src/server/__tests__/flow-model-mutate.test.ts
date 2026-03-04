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

describe('flow-model mutate', () => {
  let app: MockServer;
  let repository: FlowModelRepository;
  let agent: any;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
    agent = app.agent();
  });

  it('should support $ref chaining (duplicate -> attach)', async () => {
    await repository.insertModel({ uid: 'mut-parent', use: 'ParentModel' } as any);
    await repository.insertModel({
      uid: 'mut-source',
      use: 'SourceModel',
      subModels: {
        inner: {
          uid: 'mut-source-inner',
          use: 'InnerModel',
        },
      },
    } as any);

    const res = await agent.resource('flowModels').mutate({
      values: {
        atomic: true,
        ops: [
          {
            opId: 'dup',
            type: 'duplicate',
            params: { uid: 'mut-source', targetUid: 'mut-target' },
          },
          {
            opId: 'att',
            type: 'attach',
            params: {
              uid: '$ref:dup.uid',
              parentId: 'mut-parent',
              subKey: 'items',
              subType: 'array',
              position: 'last',
            },
          },
        ],
        returnModels: ['mut-parent', 'mut-target'],
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.results).toHaveLength(2);
    expect(res.body?.data?.results[0]?.opId).toBe('dup');
    expect(res.body?.data?.results[0]?.ok).toBeTruthy();
    expect(res.body?.data?.results[0]?.output?.uid).toBe('mut-target');

    expect(res.body?.data?.results[1]?.opId).toBe('att');
    expect(res.body?.data?.results[1]?.ok).toBeTruthy();
    expect(res.body?.data?.results[1]?.output?.uid).toBe('mut-target');
    expect(res.body?.data?.results[1]?.output?.parentId).toBe('mut-parent');

    const parent = res.body?.data?.models?.['mut-parent'];
    expect(parent).toBeTruthy();
    expect(parent.subModels?.items).toBeTruthy();
    expect(parent.subModels.items).toHaveLength(1);
    expect(parent.subModels.items[0].uid).toBe('mut-target');
  });

  it('should rollback when an op fails (atomic)', async () => {
    const res = await agent.resource('flowModels').mutate({
      values: {
        atomic: true,
        ops: [
          {
            opId: 'up1',
            type: 'upsert',
            params: { values: { uid: 'mut-rollback', use: 'TestModel' } },
          },
          {
            opId: 'badAttach',
            type: 'attach',
            params: {
              uid: '$ref:up1.uid',
              parentId: 'missing-parent',
              subKey: 'items',
              subType: 'array',
              position: 'last',
            },
          },
        ],
      },
    });

    expect(res.status).toBe(404);

    const after = await repository.findModelById('mut-rollback', { includeAsyncNode: true });
    expect(after).toBeNull();
  });

  it('should return 409 when duplicate targetUid already exists and is not produced by this op', async () => {
    await repository.insertModel({ uid: 'mut-existing', use: 'OtherModel' } as any);
    await repository.insertModel({ uid: 'mut-source2', use: 'SourceModel' } as any);

    const res = await agent.resource('flowModels').mutate({
      values: {
        atomic: true,
        ops: [
          {
            opId: 'dup',
            type: 'duplicate',
            params: { uid: 'mut-source2', targetUid: 'mut-existing' },
          },
        ],
      },
    });

    expect(res.status).toBe(409);
  });

  it('should be retry-safe for duplicate(targetUid) replays', async () => {
    await repository.insertModel({
      uid: 'mut-source3',
      use: 'SourceModel',
      subModels: {
        inner: {
          uid: 'mut-source3-inner',
          use: 'InnerModel',
        },
      },
    } as any);

    const request = {
      values: {
        atomic: true,
        ops: [
          {
            opId: 'dup',
            type: 'duplicate',
            params: { uid: 'mut-source3', targetUid: 'mut-target3' },
          },
        ],
        returnModels: ['mut-target3'],
      },
    };

    const res1 = await agent.resource('flowModels').mutate(request as any);
    const res2 = await agent.resource('flowModels').mutate(request as any);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const m1 = res1.body?.data?.models?.['mut-target3'];
    const m2 = res2.body?.data?.models?.['mut-target3'];
    expect(m1?.uid).toBe('mut-target3');
    expect(m2?.uid).toBe('mut-target3');
    expect(m1?.subModels?.inner?.uid).toBe(m2?.subModels?.inner?.uid);
  });
});
