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

describe('flow-model ensure', () => {
  let app: MockServer;
  let agent: any;
  let repository: FlowModelRepository;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    (app.pm.get('flow-engine') as any)?.registerFlowSchemas({
      modelManifests: [
        {
          use: 'EnsureContextualChildModel',
          source: 'official',
          strict: true,
          stepParamsSchema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        {
          use: 'EnsureContextualParentModel',
          source: 'official',
          strict: true,
          subModelSlots: {
            body: {
              type: 'object',
              use: 'EnsureContextualChildModel',
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

  it('should ensure by uid (create when missing, return when exists)', async () => {
    const created = await repository.ensureModel({ uid: 'ensure-root', use: 'RouteModel' });
    expect(created).toBeTruthy();
    expect(created.uid).toBe('ensure-root');
    expect(created.use).toBe('RouteModel');

    const ensuredAgain = await repository.ensureModel({ uid: 'ensure-root', use: 'AnotherModel' });
    expect(ensuredAgain).toBeTruthy();
    expect(ensuredAgain.uid).toBe('ensure-root');
    // should not overwrite existing model
    expect(ensuredAgain.use).toBe('RouteModel');
  });

  it('should ensure object child by (parentId+subKey) concurrently', async () => {
    await repository.insertModel({ uid: 'ensure-parent', use: 'ParentModel' } as any);

    const [a, b] = await Promise.all([
      repository.ensureModel({
        parentId: 'ensure-parent',
        subKey: 'page',
        subType: 'object',
        use: 'RootPageModel',
        async: true,
      }),
      repository.ensureModel({
        parentId: 'ensure-parent',
        subKey: 'page',
        subType: 'object',
        use: 'RootPageModel',
        async: true,
      }),
    ]);

    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a.uid).toBe(b.uid);

    const parent = await repository.findModelById('ensure-parent', { includeAsyncNode: true });
    expect(parent.subModels?.page).toBeTruthy();
    expect(parent.subModels.page.uid).toBe(a.uid);
  });

  it('should allow ensure object child payloads without uid through schema validation', async () => {
    await repository.insertModel({ uid: 'ensure-api-parent', use: 'ParentModel' } as any);

    const res = await agent.resource('flowModels').ensure({
      values: {
        parentId: 'ensure-api-parent',
        subKey: 'page',
        subType: 'object',
        use: 'RootPageModel',
        async: true,
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.parentId).toBe('ensure-api-parent');
    expect(res.body?.data?.subKey).toBe('page');
    expect(res.body?.data?.subType).toBe('object');
    expect(res.body?.data?.use).toBe('RootPageModel');
    expect(res.body?.data?.uid).toBeTruthy();
  });

  it('should validate nested child schema with parent context during ensure', async () => {
    const pass = await agent.resource('flowModels').ensure({
      values: {
        uid: 'ensure-context-root-pass',
        use: 'EnsureContextualParentModel',
        subModels: {
          body: {
            uid: 'ensure-context-child-pass',
            use: 'EnsureContextualChildModel',
            stepParams: {
              alpha: 'ok',
            },
          },
        },
      },
    });

    expect(pass.status).toBe(200);

    const fail = await agent.resource('flowModels').ensure({
      values: {
        uid: 'ensure-context-root-fail',
        use: 'EnsureContextualParentModel',
        subModels: {
          body: {
            uid: 'ensure-context-child-fail',
            use: 'EnsureContextualChildModel',
            stepParams: {
              beta: 1,
            },
          },
        },
      },
    });

    expect(fail.status).toBe(400);
    expect(fail.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(fail.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'ensure-context-child-fail',
          modelUse: 'EnsureContextualChildModel',
          section: 'stepParams',
        }),
      ]),
    );
  });
});
