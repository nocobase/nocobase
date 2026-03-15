/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { FlowModel } from '@nocobase/flow-engine';
import FlowModelRepository from '../repository';

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
    (app.pm.get('flow-engine') as any)?.registerFlowSchemas({
      models: {
        MutateSchemaStrictModel,
      },
      modelManifests: [
        {
          use: 'MutateContextualChildModel',
          source: 'official',
          strict: true,
          stepParamsSchema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        {
          use: 'MutateContextualParentModel',
          source: 'official',
          strict: true,
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

  it('should validate resolved $ref payloads before commit and rollback atomically', async () => {
    const res = await agent.resource('flowModels').mutate({
      values: {
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
      },
    });

    expect(res.status).toBe(400);
    expect(res.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(res.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'mut-ref-strict',
          modelUse: 'MutateSchemaStrictModel',
          section: 'stepParams',
          expectedType: 'string',
          schemaHash: expect.any(String),
        }),
      ]),
    );

    const seeded = await repository.findModelById('mut-ref-seed', { includeAsyncNode: true });
    const strict = await repository.findModelById('mut-ref-strict', { includeAsyncNode: true });
    expect(seeded).toBeNull();
    expect(strict).toBeNull();
  });

  it('should validate contextual nested child schema during mutate upsert', async () => {
    const res = await agent.resource('flowModels').mutate({
      values: {
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
      },
    });

    expect(res.status).toBe(400);
    expect(res.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(res.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'mut-context-child',
          modelUse: 'MutateContextualChildModel',
          section: 'stepParams',
        }),
      ]),
    );
  });
});
