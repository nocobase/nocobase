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

function objectSchema(
  properties: Record<string, any> = {},
  options: {
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  } = {},
) {
  const { required = [], additionalProperties = true } = options;

  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties,
  };
}

function looseModelContribution(use: string, extra: Record<string, any> = {}) {
  return {
    use,
    source: 'official',
    strict: false,
    stepParamsSchema: objectSchema(),
    ...extra,
  };
}

function objectSlot(extra: Record<string, any> = {}) {
  return {
    type: 'object',
    ...extra,
  };
}

describe('flow-model ensure', () => {
  let app: any;
  let agent: any;
  let repository: FlowModelRepository;

  const insertModel = (model: Record<string, any>) => repository.insertModel(model as any);
  const ensureModel = (values: Record<string, any>) => agent.resource('flowModels').ensure({ values });
  const queryFindOne = (params: Record<string, any>) => agent.get('/flowModels:findOne').query(params);

  afterEach(async () => {
    await destroyTestApp(app);
    app = null;
  });

  beforeEach(async () => {
    ({ app, agent } = await createFlowEngineTestApp({
      registerSchemas(flowEnginePlugin) {
        flowEnginePlugin.registerFlowSchemas({
          modelContributions: [
            looseModelContribution('EnsureContextualChildModel'),
            looseModelContribution('EnsureContextualParentModel', {
              subModelSlots: {
                body: objectSlot({
                  use: 'EnsureContextualChildModel',
                  childSchemaPatch: {
                    stepParamsSchema: objectSchema(
                      {
                        alpha: {
                          type: 'string',
                        },
                      },
                      { required: ['alpha'], additionalProperties: false },
                    ),
                  },
                }),
              },
            }),
          ],
        });
      },
    }));
    repository = app.db.getCollection('flowModels').repository as FlowModelRepository;
  });

  it('should ensure by uid (create when missing, return when exists)', async () => {
    const created: any = await repository.ensureModel({ uid: 'ensure-root', use: 'RouteModel' });
    expect(created).toBeTruthy();
    expect(created.uid).toBe('ensure-root');
    expect(created.use).toBe('RouteModel');

    const ensuredAgain: any = await repository.ensureModel({ uid: 'ensure-root', use: 'AnotherModel' });
    expect(ensuredAgain).toBeTruthy();
    expect(ensuredAgain.uid).toBe('ensure-root');
    // should not overwrite existing model
    expect(ensuredAgain.use).toBe('RouteModel');
  });

  it('should ensure object child by (parentId+subKey) concurrently', async () => {
    await insertModel({ uid: 'ensure-parent', use: 'ParentModel' });

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
    await insertModel({ uid: 'ensure-api-parent', use: 'ParentModel' });

    const res = await ensureModel({
      parentId: 'ensure-api-parent',
      subKey: 'page',
      subType: 'object',
      use: 'RootPageModel',
      async: true,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.parentId).toBe('ensure-api-parent');
    expect(res.body?.data?.subKey).toBe('page');
    expect(res.body?.data?.subType).toBe('object');
    expect(res.body?.data?.use).toBe('RootPageModel');
    expect(res.body?.data?.uid).toBeTruthy();
  });

  it('should allow HTTP ensure to return an existing uid without requiring use', async () => {
    await insertModel({ uid: 'ensure-api-existing', use: 'RouteModel' });

    const res = await ensureModel({
      uid: 'ensure-api-existing',
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('ensure-api-existing');
    expect(res.body?.data?.use).toBe('RouteModel');
  });

  it('should preserve full snapshot fields when ensure creates a root model by uid', async () => {
    const res = await ensureModel({
      uid: 'ensure-http-root-fields',
      use: 'RouteModel',
      async: true,
      scene: 'update',
      delegateToParent: false,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('ensure-http-root-fields');
    expect(res.body?.data?.use).toBe('RouteModel');
    expect(res.body?.data?.async).toBe(true);
    expect(res.body?.data?.scene).toBe('update');
    expect(res.body?.data?.delegateToParent).toBe(false);

    const saved = await repository.findModelById('ensure-http-root-fields', { includeAsyncNode: true });
    expect(saved?.async).toBe(true);
    expect(saved?.scene).toBe('update');
    expect(saved?.delegateToParent).toBe(false);
  });

  it('should allow ensuring internal concrete child models directly', async () => {
    await insertModel({ uid: 'ensure-tab-parent', use: 'PageTabModel' });

    const res = await ensureModel({
      parentId: 'ensure-tab-parent',
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
      async: true,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.parentId).toBe('ensure-tab-parent');
    expect(res.body?.data?.subKey).toBe('grid');
    expect(res.body?.data?.subType).toBe('object');
    expect(res.body?.data?.use).toBe('BlockGridModel');
    expect(res.body?.data?.uid).toBeTruthy();
  });

  it('should preserve full snapshot fields when ensure creates an object child model', async () => {
    await insertModel({ uid: 'ensure-grid-parent', use: 'PageTabModel' });

    const filterManager = [{ filterId: 'filter-1', targetId: 'target-1' }];
    const res = await ensureModel({
      parentId: 'ensure-grid-parent',
      subKey: 'update.edit-form-grid-block',
      subType: 'object',
      use: 'BlockGridModel',
      async: true,
      delegateToParent: false,
      scene: 'update',
      filterManager,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.parentId).toBe('ensure-grid-parent');
    expect(res.body?.data?.subKey).toBe('update.edit-form-grid-block');
    expect(res.body?.data?.subType).toBe('object');
    expect(res.body?.data?.use).toBe('BlockGridModel');
    expect(res.body?.data?.async).toBe(true);
    expect(res.body?.data?.scene).toBe('update');
    expect(res.body?.data?.delegateToParent).toBe(false);
    expect(res.body?.data?.filterManager).toEqual(filterManager);

    const findRes = await queryFindOne({
      parentId: 'ensure-grid-parent',
      subKey: 'update.edit-form-grid-block',
      includeAsyncNode: true,
    });

    expect(findRes.status).toBe(200);
    expect(findRes.body?.data?.uid).toBe(res.body?.data?.uid);
    expect(findRes.body?.data?.async).toBe(true);
    expect(findRes.body?.data?.scene).toBe('update');
    expect(findRes.body?.data?.delegateToParent).toBe(false);
    expect(findRes.body?.data?.filterManager).toEqual(filterManager);
  });

  it('should allow props to be null during ensure object child creation', async () => {
    await insertModel({ uid: 'ensure-null-props-parent', use: 'PageTabModel' });

    const res = await ensureModel({
      parentId: 'ensure-null-props-parent',
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
      props: null,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.parentId).toBe('ensure-null-props-parent');
    expect(res.body?.data?.subKey).toBe('grid');
    expect(res.body?.data?.use).toBe('BlockGridModel');
  });

  it('should warn and reuse the first object child when duplicate children already exist', async () => {
    await insertModel({ uid: 'ensure-duplicate-grid-parent', use: 'PageTabModel' });
    await repository.upsertModel({
      uid: 'ensure-duplicate-grid-a',
      parentId: 'ensure-duplicate-grid-parent',
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
    });
    await repository.upsertModel({
      uid: 'ensure-duplicate-grid-b',
      parentId: 'ensure-duplicate-grid-parent',
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
    });

    const warnSpy = vi.spyOn(app.db.logger, 'warn');

    const res = await ensureModel({
      parentId: 'ensure-duplicate-grid-parent',
      subKey: 'grid',
      subType: 'object',
      use: 'BlockGridModel',
      async: true,
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('ensure-duplicate-grid-a');
    expect(res.body?.data?.parentId).toBe('ensure-duplicate-grid-parent');
    expect(res.body?.data?.subKey).toBe('grid');
    expect(res.body?.data?.subType).toBe('object');
    expect(res.body?.data?.use).toBe('BlockGridModel');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('using first child');
    expect(warnSpy.mock.calls[0][1]).toMatchObject({
      action: 'flowModels:ensure',
      type: 'flow-model-duplicate-object-child',
      parentId: 'ensure-duplicate-grid-parent',
      subKey: 'grid',
      childUids: ['ensure-duplicate-grid-a', 'ensure-duplicate-grid-b'],
    });

    warnSpy.mockRestore();
  });

  it('should allow ensure to create popup child pages with lazy nested tabs missing uid and grid', async () => {
    await insertModel({ uid: 'ensure-popup-parent', use: 'AddNewActionModel' });

    const res = await ensureModel({
      parentId: 'ensure-popup-parent',
      subKey: 'page',
      subType: 'object',
      use: 'ChildPageModel',
      async: true,
      stepParams: {
        pageSettings: {
          general: {
            displayTitle: false,
            enableTabs: true,
          },
        },
      },
      subModels: {
        tabs: [
          {
            use: 'ChildPageTabModel',
            stepParams: {
              pageTabSettings: {
                tab: {
                  title: 'Details',
                },
              },
            },
          },
        ],
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.use).toBe('ChildPageModel');
    expect(res.body?.data?.uid).toBeTruthy();
    expect(res.body?.data?.subModels?.tabs?.[0]).toMatchObject({
      use: 'ChildPageTabModel',
      stepParams: {
        pageTabSettings: {
          tab: {
            title: 'Details',
          },
        },
      },
    });
    expect(res.body?.data?.subModels?.tabs?.[0]?.uid).toBeTruthy();
    expect(res.body?.data?.subModels?.tabs?.[0]?.subModels?.grid).toBeUndefined();
  });

  it('should allow nested child schema mismatches with parent context during ensure when validation is loose', async () => {
    const pass = await ensureModel({
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
    });

    expect(pass.status).toBe(200);

    const fail = await ensureModel({
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
    });

    expect(fail.status).toBe(200);
    expect(fail.body?.data?.uid).toBe('ensure-context-root-fail');
  });
});
