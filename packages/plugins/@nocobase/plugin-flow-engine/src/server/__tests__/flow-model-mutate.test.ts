/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import FlowModelRepository from '../repository';
import { createFlowEngineTestApp, destroyTestApp } from './test-utils';

class MutateSchemaStrictModel extends FlowModel {}

MutateSchemaStrictModel.define({
  label: 'Mutate schema strict model',
  schema: {
    stepParamsSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
      },
      required: ['title'],
      additionalProperties: false,
    },
    source: 'official',
  },
});

describe('flow-model mutate', () => {
  let app: any;
  let repository: FlowModelRepository;
  let agent: any;

  const mutate = (values: any) => agent.resource('flowModels').mutate({ values });
  const insertModelTree = (model: Record<string, any>) => repository.insertModel(model as any);
  const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await new Promise<T>((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
        return promise.then(resolve).catch(reject);
      });
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  };

  afterEach(async () => {
    await destroyTestApp(app);
    app = null;
  });

  beforeEach(async () => {
    ({ app, agent } = await createFlowEngineTestApp({
      registerSchemas(flowEnginePlugin) {
        flowEnginePlugin.registerFlowSchemas({
          models: {
            MutateSchemaStrictModel,
          },
          modelContributions: [
            {
              use: 'MutateContextualChildModel',
              source: 'official',
              strict: false,
              stepParamsSchema: {
                type: 'object',
                additionalProperties: true,
              },
            },
            {
              use: 'MutateContextualParentModel',
              source: 'official',
              strict: false,
              subModelSlots: {
                body: {
                  type: 'object',
                  use: 'MutateContextualChildModel',
                  childSchemaPatch: {
                    stepParamsSchema: {
                      type: 'object',
                      properties: {
                        alpha: {
                          type: 'string',
                        },
                      },
                      required: ['alpha'],
                      additionalProperties: false,
                    },
                  },
                },
              },
            },
          ],
        });
      },
    }));
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  it('should support $ref chaining (duplicate -> attach)', async () => {
    await insertModelTree({ uid: 'mut-parent', use: 'ParentModel' });
    await insertModelTree({
      uid: 'mut-source',
      use: 'SourceModel',
      subModels: {
        inner: {
          uid: 'mut-source-inner',
          use: 'InnerModel',
        },
      },
    });

    const res = await mutate({
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
    const res = await mutate({
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
    });

    expect(res.status).toBe(404);

    const after = await repository.findModelById('mut-rollback', { includeAsyncNode: true });
    expect(after).toBeNull();
  });

  it('should release ensure object-child lock after rollback and allow retry', async () => {
    await insertModelTree({ uid: 'mut-ensure-parent', use: 'MutateContextualParentModel' });

    const failed = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'ens',
          type: 'ensure',
          params: {
            parentId: 'mut-ensure-parent',
            subKey: 'body',
            subType: 'object',
            use: 'MutateContextualChildModel',
          },
        },
        {
          opId: 'badAttach',
          type: 'attach',
          params: {
            uid: '$ref:ens.uid',
            parentId: 'missing-parent',
            subKey: 'items',
            subType: 'array',
            position: 'last',
          },
        },
      ],
    });

    expect(failed.status).toBe(404);
    expect(
      await repository.findModelByParentId('mut-ensure-parent', {
        subKey: 'body',
        includeAsyncNode: true,
      }),
    ).toBeNull();

    const retried: any = await withTimeout(
      mutate({
        atomic: true,
        ops: [
          {
            opId: 'ens',
            type: 'ensure',
            params: {
              parentId: 'mut-ensure-parent',
              subKey: 'body',
              subType: 'object',
              use: 'MutateContextualChildModel',
              stepParams: {
                alpha: 'retry-ok',
              },
            },
          },
        ],
        returnModels: ['mut-ensure-parent'],
      }),
      3000,
      'flowModels:mutate ensure retry should not hang after rollback',
    );

    expect(retried.status).toBe(200);
    expect(retried.body?.data?.results?.[0]).toMatchObject({
      opId: 'ens',
      ok: true,
    });
    expect(retried.body?.data?.results?.[0]?.output?.stepParams?.alpha).toBe('retry-ok');
    expect(retried.body?.data?.models?.['mut-ensure-parent']?.subModels?.body?.stepParams?.alpha).toBe('retry-ok');
  });

  it('should return 409 when duplicate targetUid already exists and is not produced by this op', async () => {
    await insertModelTree({ uid: 'mut-existing', use: 'OtherModel' });
    await insertModelTree({ uid: 'mut-source2', use: 'SourceModel' });

    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'dup',
          type: 'duplicate',
          params: { uid: 'mut-source2', targetUid: 'mut-existing' },
        },
      ],
    });

    expect(res.status).toBe(409);
  });

  it('should be retry-safe for duplicate(targetUid) replays', async () => {
    await insertModelTree({
      uid: 'mut-source3',
      use: 'SourceModel',
      subModels: {
        inner: {
          uid: 'mut-source3-inner',
          use: 'InnerModel',
        },
      },
    });

    const request = {
      atomic: true,
      ops: [
        {
          opId: 'dup',
          type: 'duplicate',
          params: { uid: 'mut-source3', targetUid: 'mut-target3' },
        },
      ],
      returnModels: ['mut-target3'],
    };

    const res1 = await mutate(request);
    const res2 = await mutate(request);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const m1 = res1.body?.data?.models?.['mut-target3'];
    const m2 = res2.body?.data?.models?.['mut-target3'];
    expect(m1?.uid).toBe('mut-target3');
    expect(m2?.uid).toBe('mut-target3');
    expect(m1?.subModels?.inner?.uid).toBe(m2?.subModels?.inner?.uid);
  });

  it('should no-op when mutate move targets itself', async () => {
    await insertModelTree({
      uid: 'mut-self-parent',
      use: 'ParentModel',
      subModels: {
        items: [
          {
            uid: 'mut-self-1',
            use: 'SourceModel',
          },
          {
            uid: 'mut-self-2',
            use: 'SourceModel',
          },
        ],
      },
    });

    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'move-self',
          type: 'move',
          params: { sourceId: 'mut-self-1', targetId: 'mut-self-1', position: 'after' },
        },
      ],
      returnModels: ['mut-self-parent'],
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.results?.[0]).toMatchObject({
      opId: 'move-self',
      ok: true,
    });
    expect(res.body?.data?.models?.['mut-self-parent']?.subModels?.items?.[0]?.uid).toBe('mut-self-1');
    expect(res.body?.data?.models?.['mut-self-parent']?.subModels?.items?.[1]?.uid).toBe('mut-self-2');
  });

  it('should validate resolved $ref payloads before commit and rollback atomically', async () => {
    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'seed',
          type: 'upsert',
          params: {
            values: {
              uid: 'mut-ref-seed',
              use: 'LooseSourceModel',
              stepParams: {
                title: 123,
              },
            },
          },
        },
        {
          opId: 'strict',
          type: 'upsert',
          params: {
            values: {
              uid: 'mut-ref-strict',
              use: 'MutateSchemaStrictModel',
              stepParams: {
                title: '$ref:seed.stepParams.title',
              },
            },
          },
        },
      ],
    });

    expect(res.status).toBe(200);

    const seeded = await repository.findModelById('mut-ref-seed', { includeAsyncNode: true });
    const strict: any = await repository.findModelById('mut-ref-strict', { includeAsyncNode: true });
    expect(seeded).not.toBeNull();
    expect(strict).not.toBeNull();
    expect(strict?.stepParams?.title).toBe(123);
  });

  it('should allow contextual nested child schema mismatches during mutate upsert when validation is loose', async () => {
    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'ctx-upsert',
          type: 'upsert',
          params: {
            values: {
              uid: 'mut-context-root',
              use: 'MutateContextualParentModel',
              subModels: {
                body: {
                  uid: 'mut-context-child',
                  use: 'MutateContextualChildModel',
                  stepParams: {
                    beta: 1,
                  },
                },
              },
            },
          },
        },
      ],
    });

    expect(res.status).toBe(200);
    const saved = await repository.findModelById('mut-context-root', { includeAsyncNode: true });
    expect(saved?.subModels?.body?.uid).toBe('mut-context-child');
  });

  it('should allow props to be null in nested mutate upsert payloads', async () => {
    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'ctx-upsert-pass',
          type: 'upsert',
          params: {
            values: {
              uid: 'mut-context-root-pass',
              use: 'MutateContextualParentModel',
              subModels: {
                body: {
                  uid: 'mut-context-child-pass',
                  use: 'MutateContextualChildModel',
                  props: null,
                  stepParams: {
                    alpha: 'ok',
                  },
                },
              },
            },
          },
        },
      ],
      returnModels: ['mut-context-root-pass'],
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.models?.['mut-context-root-pass']?.subModels?.body?.uid).toBe('mut-context-child-pass');
  });

  it('should rollback when a post-next middleware throws', async () => {
    await insertModelTree({ uid: 'mut-source-after-next', use: 'SourceModel' });

    app.resourceManager.use(async (ctx, next) => {
      if (ctx?.action?.resourceName === 'flowModels' && ctx?.action?.actionName === 'mutate') {
        await next();
        throw new Error('after-next failure');
      }
      return next();
    });

    const res = await mutate({
      atomic: true,
      ops: [
        {
          opId: 'dup',
          type: 'duplicate',
          params: { uid: 'mut-source-after-next', targetUid: 'mut-target-after-next' },
        },
      ],
    });

    expect(res.status).toBe(500);
    expect(await repository.findModelById('mut-target-after-next', { includeAsyncNode: true })).toBeNull();
  });
});
