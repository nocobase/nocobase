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
      modelManifests: [
        {
          use: 'SaveContextualChildModel',
          source: 'official',
          strict: true,
          stepParamsSchema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        {
          use: 'SaveContextualParentAlphaModel',
          source: 'official',
          strict: true,
          subModelSlots: {
            body: {
              type: 'object',
              use: 'SaveContextualChildModel',
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
        {
          use: 'SaveContextualParentBetaModel',
          source: 'official',
          strict: true,
          subModelSlots: {
            body: {
              type: 'object',
              use: 'SaveContextualChildModel',
              childSchemaPatch: {
                stepParamsSchema: {
                  type: 'object',
                  properties: {
                    beta: {
                      type: 'number',
                    },
                  },
                  required: ['beta'],
                  additionalProperties: false,
                },
              },
            },
          },
        },
        {
          use: 'SaveContextualBridgeModel',
          source: 'official',
          strict: true,
        },
        {
          use: 'SaveContextualAncestorModel',
          source: 'official',
          strict: true,
          subModelSlots: {
            body: {
              type: 'object',
              use: 'SaveContextualBridgeModel',
              childSchemaPatch: {
                subModelSlots: {
                  leaf: {
                    type: 'object',
                    use: 'SaveContextualChildModel',
                    childSchemaPatch: {
                      stepParamsSchema: {
                        type: 'object',
                        properties: {
                          marker: {
                            type: 'string',
                          },
                          directOnly: {
                            type: 'string',
                          },
                        },
                        required: ['directOnly'],
                        additionalProperties: false,
                      },
                    },
                  },
                },
              },
              descendantSchemaPatches: [
                {
                  path: [
                    {
                      slotKey: 'leaf',
                      use: 'SaveContextualChildModel',
                    },
                  ],
                  patch: {
                    stepParamsSchema: {
                      type: 'object',
                      properties: {
                        marker: {
                          type: 'number',
                        },
                        ancestorOnly: {
                          type: 'boolean',
                        },
                      },
                      required: ['ancestorOnly'],
                      additionalProperties: true,
                    },
                  },
                },
              ],
            },
          },
        },
      ],
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
    expect(single.body?.data?.jsonSchema?.properties?.props).toBeUndefined();
    expect(single.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        settings: {
          properties: {
            save: {
              required: ['enabled'],
            },
          },
        },
      },
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

    const internalConcrete = await agent.post('/flowModels:schemas').send({
      uses: ['FormGridModel', 'FormItemModel', 'FormSubmitActionModel', 'BlockGridModel'],
    });

    expect(internalConcrete.status).toBe(200);
    expect((internalConcrete.body?.data || []).map((item) => item.use)).toEqual(
      expect.arrayContaining(['FormGridModel', 'FormItemModel', 'FormSubmitActionModel', 'BlockGridModel']),
    );

    const emptyBatch = await agent.post('/flowModels:schemas').send({});

    expect(emptyBatch.status).toBe(200);
    expect(emptyBatch.body?.data).toEqual([]);
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
      uses: ['ActionModel', 'TableBlockModel', 'PageModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data).not.toHaveProperty('generatedAt');
    expect(bundle.body?.data).not.toHaveProperty('summary');
    expect(JSON.stringify(bundle.body?.data)).not.toContain('missing-model-manifest');
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
          skeleton: expect.objectContaining({
            use: 'TableBlockModel',
          }),
        }),
        expect.objectContaining({
          use: 'PageModel',
          skeleton: expect.objectContaining({
            use: 'PageModel',
          }),
        }),
      ]),
    );
    const tableItem = (bundle.body?.data?.items || []).find((item) => item.use === 'TableBlockModel');
    const pageItem = (bundle.body?.data?.items || []).find((item) => item.use === 'PageModel');
    for (const item of bundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key))).toEqual(
        [],
      );
      expect(item).not.toHaveProperty('dynamicHints');
      expect(item).not.toHaveProperty('commonPatterns');
      expect(item).not.toHaveProperty('antiPatterns');
      expect(item).not.toHaveProperty('keyEnums');
      expect(item).not.toHaveProperty('coverage');
      expect(item).not.toHaveProperty('hash');
      expect(item).not.toHaveProperty('source');
    }
    expect(tableItem?.subModelCatalog).toMatchObject({
      columns: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'TableColumnModel' }),
          expect.objectContaining({ use: 'TableActionsColumnModel' }),
        ]),
      },
      actions: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'AddNewActionModel' }),
          expect.objectContaining({ use: 'RefreshActionModel' }),
        ]),
      },
    });
    expect(pageItem?.subModelCatalog).toMatchObject({
      tabs: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'RootPageTabModel' }),
          expect.objectContaining({ use: 'PageTabModel' }),
        ]),
      },
    });

    const formBundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['CreateFormModel', 'EditFormModel', 'FormBlockModel'],
    });

    expect(formBundle.status).toBe(200);
    expect((formBundle.body?.data?.items || []).map((item) => item.use)).toEqual(
      expect.arrayContaining(['CreateFormModel', 'EditFormModel']),
    );
    expect((formBundle.body?.data?.items || []).map((item) => item.use)).not.toContain('FormBlockModel');
    const internalBundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['FormGridModel', 'BlockGridModel'],
    });
    expect(internalBundle.status).toBe(200);
    expect((internalBundle.body?.data?.items || []).map((item) => item.use)).toEqual(
      expect.arrayContaining(['FormGridModel', 'BlockGridModel']),
    );
    const emptyBundle = await agent.post('/flowModels:schemaBundle').send({});
    expect(emptyBundle.status).toBe(200);
    expect(emptyBundle.body?.data?.items).toEqual([]);
    const createFormItem = (formBundle.body?.data?.items || []).find((item) => item.use === 'CreateFormModel');
    expect(createFormItem?.subModelCatalog).toMatchObject({
      grid: {
        type: 'object',
        candidates: [
          expect.objectContaining({
            use: 'FormGridModel',
            subModelCatalog: {
              items: {
                type: 'array',
                candidates: expect.arrayContaining([
                  expect.objectContaining({ use: 'FormItemModel' }),
                  expect.objectContaining({ use: 'FormAssociationItemModel' }),
                ]),
              },
            },
          }),
        ],
      },
      actions: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'FormSubmitActionModel' }),
          expect.objectContaining({ use: 'JSFormActionModel' }),
        ]),
      },
    });
    for (const item of formBundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key))).toEqual(
        [],
      );
    }

    const details = await agent.get('/flowModels:schema').query({
      use: 'DetailsBlockModel',
    });
    expect(details.status).toBe(200);
    expect(details.body?.data?.minimalExample).toMatchObject({
      use: 'DetailsBlockModel',
    });

    const filterForm = await agent.get('/flowModels:schema').query({
      use: 'FilterFormBlockModel',
    });
    expect(filterForm.status).toBe(200);
    expect(filterForm.body?.data?.minimalExample).toMatchObject({
      use: 'FilterFormBlockModel',
    });

    const rootPage = await agent.get('/flowModels:schema').query({
      use: 'RootPageModel',
    });
    expect(rootPage.status).toBe(200);
    expect(rootPage.body?.data?.minimalExample).toMatchObject({
      use: 'RootPageModel',
    });

    const updateRecord = await agent.get('/flowModels:schema').query({
      use: 'UpdateRecordActionModel',
    });
    expect(updateRecord.status).toBe(200);
    expect(updateRecord.body?.data?.minimalExample).toMatchObject({
      use: 'UpdateRecordActionModel',
    });
    expect(updateRecord.body?.data?.jsonSchema?.properties?.subModels?.properties?.assignForm).toBeDefined();
  });

  it('should allow direct discovery and save for internal concrete models while keeping abstract bases hidden', async () => {
    const internalConcrete = await agent.get('/flowModels:schema').query({
      use: 'FormGridModel',
    });

    expect(internalConcrete.status).toBe(200);
    expect(internalConcrete.body?.data?.use).toBe('FormGridModel');

    const blockGrid = await agent.get('/flowModels:schema').query({
      use: 'BlockGridModel',
    });

    expect(blockGrid.status).toBe(200);
    expect(blockGrid.body?.data?.use).toBe('BlockGridModel');

    const formItem = await agent.get('/flowModels:schema').query({
      use: 'FormItemModel',
    });

    expect(formItem.status).toBe(200);
    expect(formItem.body?.data?.use).toBe('FormItemModel');

    const formSubmit = await agent.get('/flowModels:schema').query({
      use: 'FormSubmitActionModel',
    });

    expect(formSubmit.status).toBe(200);
    expect(formSubmit.body?.data?.use).toBe('FormSubmitActionModel');

    const saveConcrete = await agent.resource('flowModels').save({
      values: {
        uid: 'save-internal-form-grid',
        use: 'FormGridModel',
      },
    });

    expect(saveConcrete.status).toBe(200);
    expect(saveConcrete.body?.data?.use).toBe('FormGridModel');

    const saveItem = await agent.resource('flowModels').save({
      values: {
        uid: 'save-internal-form-item',
        use: 'FormItemModel',
      },
    });

    expect(saveItem.status).toBe(200);
    expect(saveItem.body?.data?.use).toBe('FormItemModel');

    const saveSubmitAction = await agent.resource('flowModels').save({
      values: {
        uid: 'save-internal-form-submit',
        use: 'FormSubmitActionModel',
      },
    });

    expect(saveSubmitAction.status).toBe(200);
    expect(saveSubmitAction.body?.data?.use).toBe('FormSubmitActionModel');

    const internal = await agent.get('/flowModels:schema').query({
      use: 'FormBlockModel',
    });

    expect(internal.status).toBe(404);

    const createForm = await agent.get('/flowModels:schema').query({
      use: 'CreateFormModel',
    });

    expect(createForm.status).toBe(200);
    expect(createForm.body?.data?.use).toBe('CreateFormModel');
    expect(createForm.body?.data?.jsonSchema?.properties?.props).toBeUndefined();

    const saveInternal = await agent.resource('flowModels').save({
      values: {
        uid: 'save-internal-form-block',
        use: 'FormBlockModel',
      },
    });

    expect(saveInternal.status).toBe(400);
    expect(saveInternal.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(saveInternal.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'save-internal-form-block',
          modelUse: 'FormBlockModel',
          section: 'model',
          keyword: 'unsupported-model-use',
          message: 'Model use "FormBlockModel" is base/abstract and cannot be submitted directly.',
          suggestedUses: ['CreateFormModel', 'EditFormModel'],
        }),
      ]),
    );
  });

  it('should expose contextual nested child schema only from parent discovery documents', async () => {
    const child = await agent.get('/flowModels:schema').query({
      use: 'SaveContextualChildModel',
    });

    expect(child.status).toBe(200);
    expect(child.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      additionalProperties: true,
    });

    const alpha = await agent.get('/flowModels:schema').query({
      use: 'SaveContextualParentAlphaModel',
    });

    expect(alpha.status).toBe(200);
    expect(alpha.body?.data?.jsonSchema?.properties?.subModels?.properties?.body?.properties?.stepParams).toMatchObject(
      {
        properties: {
          alpha: {
            type: 'string',
          },
        },
        required: ['alpha'],
        additionalProperties: false,
      },
    );

    const ancestor = await agent.get('/flowModels:schema').query({
      use: 'SaveContextualAncestorModel',
    });

    expect(ancestor.status).toBe(200);
    expect(
      ancestor.body?.data?.jsonSchema?.properties?.subModels?.properties?.body?.properties?.subModels?.properties?.leaf
        ?.properties?.stepParams,
    ).toMatchObject({
      properties: {
        ancestorOnly: {
          type: 'boolean',
        },
        directOnly: {
          type: 'string',
        },
      },
      required: ['directOnly'],
      additionalProperties: false,
    });
  });

  it('should validate the same child use differently under different parent contexts', async () => {
    const alphaPass = await agent.resource('flowModels').save({
      values: {
        uid: 'ctx-alpha-1',
        use: 'SaveContextualParentAlphaModel',
        subModels: {
          body: {
            uid: 'ctx-child-alpha-1',
            use: 'SaveContextualChildModel',
            stepParams: {
              alpha: 'ok',
            },
          },
        },
      },
    });

    expect(alphaPass.status).toBe(200);

    const betaFail = await agent.resource('flowModels').save({
      values: {
        uid: 'ctx-beta-1',
        use: 'SaveContextualParentBetaModel',
        subModels: {
          body: {
            uid: 'ctx-child-beta-1',
            use: 'SaveContextualChildModel',
            stepParams: {
              alpha: 'ok',
            },
          },
        },
      },
    });

    expect(betaFail.status).toBe(400);
    expect(betaFail.body?.errors?.[0]?.code).toBe('INVALID_FLOW_MODEL_SCHEMA');
    expect(betaFail.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'ctx-child-beta-1',
          modelUse: 'SaveContextualChildModel',
          section: 'stepParams',
          keyword: expect.any(String),
        }),
      ]),
    );
  });

  it('should validate descendant patches through the full ancestor chain', async () => {
    const pass = await agent.resource('flowModels').save({
      values: {
        uid: 'ctx-ancestor-1',
        use: 'SaveContextualAncestorModel',
        subModels: {
          body: {
            uid: 'ctx-bridge-1',
            use: 'SaveContextualBridgeModel',
            subModels: {
              leaf: {
                uid: 'ctx-leaf-1',
                use: 'SaveContextualChildModel',
                stepParams: {
                  ancestorOnly: true,
                  directOnly: 'ok',
                  marker: 'direct',
                },
              },
            },
          },
        },
      },
    });

    expect(pass.status).toBe(200);

    const fail = await agent.resource('flowModels').save({
      values: {
        uid: 'ctx-ancestor-2',
        use: 'SaveContextualAncestorModel',
        subModels: {
          body: {
            uid: 'ctx-bridge-2',
            use: 'SaveContextualBridgeModel',
            subModels: {
              leaf: {
                uid: 'ctx-leaf-2',
                use: 'SaveContextualChildModel',
                stepParams: {
                  ancestorOnly: 'bad',
                  directOnly: 'ok',
                  marker: 'direct',
                },
              },
            },
          },
        },
      },
    });

    expect(fail.status).toBe(400);
    expect(fail.body?.errors?.[0]?.details?.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelUid: 'ctx-leaf-2',
          modelUse: 'SaveContextualChildModel',
          section: 'stepParams',
          expectedType: 'boolean',
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
            use: 'UnexpectedChildModel',
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

  it('should tolerate props in payloads without treating them as schema contract', async () => {
    const res = await agent.resource('flowModels').save({
      values: {
        uid: 'save-ignore-props-1',
        use: 'SaveSchemaStrictModel',
        props: {
          title: 123,
        },
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-ignore-props-1');
  });
});
