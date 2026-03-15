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

class SaveSchemaChildModel extends FlowModel {}
class SaveSchemaStrictModel extends FlowModel {}

SaveSchemaChildModel.define({
  label: 'Save schema child',
});

SaveSchemaStrictModel.define({
  label: 'Save schema strict model',
  createModelOptions: {
    use: 'SaveSchemaStrictModel',
    subModels: {
      body: [
        {
          use: 'SaveSchemaChildModel',
        },
      ],
    },
  },
  schema: {
    propsSchema: {
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

SaveSchemaStrictModel.registerFlow({
  key: 'settings',
  steps: {
    save: {
      use: 'saveSchemaStrictAction',
    },
  },
});

describe('flow-model save', () => {
  let app: MockServer;
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
        SaveSchemaChildModel,
        SaveSchemaStrictModel,
      },
      actions: {
        saveSchemaStrictAction: {
          name: 'saveSchemaStrictAction',
          handler: () => null,
          paramsSchema: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
              },
            },
            required: ['enabled'],
            additionalProperties: false,
          },
        },
      },
    });
    agent = app.agent();
  });

  it('should return model by default', async () => {
    const res = await agent.resource('flowModels').save({
      values: { uid: 'save-default-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-default-1');
    expect(res.body?.data?.use).toBe('RouteModel');
  });

  it('should return uid when return=uid', async () => {
    const res = await agent.resource('flowModels').save({
      return: 'uid',
      values: { uid: 'save-uid-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-uid-1');
  });

  it('should expose schema discovery documents', async () => {
    const single = await agent.get('/flowModels:schema').query({
      use: 'SaveSchemaStrictModel',
    });

    expect(single.status).toBe(200);
    expect(single.body?.data?.use).toBe('SaveSchemaStrictModel');
    expect(single.body?.data?.coverage?.source).toBe('official');
    expect(single.body?.data?.jsonSchema?.properties?.props).toMatchObject({
      required: ['title'],
      additionalProperties: false,
    });
    expect(single.body?.data?.minimalExample).toMatchObject({
      use: 'SaveSchemaStrictModel',
    });
    expect(single.body?.data?.skeleton).toMatchObject({
      uid: 'todo-uid',
      use: 'SaveSchemaStrictModel',
    });

    const batch = await agent.post('/flowModels:schemas').send({
      uses: ['SaveSchemaStrictModel'],
    });

    expect(batch.status).toBe(200);
    expect(batch.body?.data).toHaveLength(1);
    expect(batch.body?.data?.[0]?.use).toBe('SaveSchemaStrictModel');
  });

  it('should expose builtin official schema bundle for prompt bootstrapping', async () => {
    const actionModel = await agent.get('/flowModels:schema').query({
      use: 'ActionModel',
    });

    expect(actionModel.status).toBe(200);
    expect(actionModel.body?.data?.use).toBe('ActionModel');
    expect(actionModel.body?.data?.minimalExample).toMatchObject({
      use: 'ActionModel',
    });
    expect(actionModel.body?.data?.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Primary submit action',
        }),
      ]),
    );

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['ActionModel', 'TableBlockModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data?.summary?.registeredModels).toBeGreaterThanOrEqual(2);
    expect(bundle.body?.data?.summary?.registeredActions).toBeGreaterThanOrEqual(1);
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'ActionModel',
          skeleton: expect.objectContaining({
            uid: 'todo-uid',
            use: 'ActionModel',
          }),
        }),
        expect.objectContaining({
          use: 'TableBlockModel',
          dynamicHints: expect.arrayContaining([
            expect.objectContaining({
              path: 'TableBlockModel.subModels.columns',
              'x-flow': expect.objectContaining({
                slotRules: expect.objectContaining({
                  slotKey: 'columns',
                  type: 'array',
                }),
                unresolvedReason: 'runtime-table-columns',
              }),
            }),
          ]),
        }),
      ]),
    );
  });

  it('should return structured schema validation errors for invalid save payload', async () => {
    const res = await agent.resource('flowModels').save({
      values: {
        uid: 'save-invalid-schema-1',
        use: 'SaveSchemaStrictModel',
        props: {
          title: 123,
        },
        stepParams: {
          settings: {
            save: {
              enabled: 'yes',
            },
          },
        },
        flowRegistry: {
          customFlow: {
            title: 'Custom flow',
            on: {
              eventName: 'click',
              phase: 'beforeStep',
              flowKey: 'customFlow',
            },
            steps: {
              missing: {
                use: 'missingAction',
              },
            },
          },
        },
        subModels: {
          body: {
            uid: 'save-invalid-schema-child',
            use: 'SaveSchemaChildModel',
          },
        },
      },
    });

    expect(res.status).toBe(400);
    expect(res.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(res.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'save-invalid-schema-1',
          modelUse: 'SaveSchemaStrictModel',
          section: 'props',
          expectedType: 'string',
          schemaHash: expect.any(String),
        }),
        expect.objectContaining({
          modelUid: 'save-invalid-schema-1',
          modelUse: 'SaveSchemaStrictModel',
          section: 'stepParams',
        }),
        expect.objectContaining({
          modelUid: 'save-invalid-schema-1',
          modelUse: 'SaveSchemaStrictModel',
          section: 'flowRegistry',
          suggestedUses: expect.any(Array),
        }),
        expect.objectContaining({
          modelUid: 'save-invalid-schema-1',
          modelUse: 'SaveSchemaStrictModel',
          section: 'subModels',
          suggestedUses: ['SaveSchemaChildModel'],
        }),
      ]),
    );
  });
});
