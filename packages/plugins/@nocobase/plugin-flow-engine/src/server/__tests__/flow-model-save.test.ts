/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv from 'ajv';
import { MockServer, createMockServer } from '@nocobase/test';
import { FlowModel } from '@nocobase/flow-engine';
import { vi } from 'vitest';

class SaveSchemaChildModel extends FlowModel {}
class SaveSchemaStrictModel extends FlowModel {}

const expectGridLayoutSchemaDocument = (document: any) => {
  expect(document?.jsonSchema?.properties?.stepParams).toMatchObject({
    properties: {
      gridSettings: {
        type: 'object',
        properties: {
          grid: {
            type: 'object',
            additionalProperties: false,
            properties: {
              rows: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
              sizes: {
                type: 'object',
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'number',
                  },
                },
              },
              rowOrder: {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
  });
};

const expectCollectionResourceSettingsSchemaDocument = (
  document: any,
  options: {
    keepLegacyResourceSettings2?: boolean;
  } = {},
) => {
  const initSchema = document?.jsonSchema?.properties?.stepParams?.properties?.resourceSettings?.properties?.init;

  expect(initSchema).toMatchObject({
    type: 'object',
    properties: {
      dataSourceKey: { type: 'string' },
      collectionName: { type: 'string' },
      associationName: { type: 'string' },
      sourceId: { type: ['string', 'number'] },
      filterByTk: { type: ['string', 'number'] },
    },
  });
  expect(initSchema?.required || []).toEqual(expect.arrayContaining(['dataSourceKey', 'collectionName']));
  if (options.keepLegacyResourceSettings2) {
    expect(document?.jsonSchema?.properties?.stepParams?.properties?.resourceSettings2).toBeDefined();
  }
};

const expectGenericFilterSchemaDocument = (schema: any) => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const validFilter = {
    logic: '$and',
    items: [
      {
        path: 'status',
        operator: '$eq',
        value: 'published',
      },
      {
        logic: '$or',
        items: [
          {
            path: 'createdBy',
            operator: '$eq',
            value: '{{ctx.currentUser.id}}',
          },
        ],
      },
    ],
  };
  const invalidFilter = {
    logic: '$and',
    items: [
      {
        foo: 'bar',
      },
    ],
  };

  expect(validate(validFilter), JSON.stringify(validate.errors)).toBe(true);
  expect(validate(invalidFilter), JSON.stringify(validate.errors)).toBe(false);
};

const expectStepParamsExampleMatchesDocument = (document: any, key: 'minimalExample' | 'skeleton') => {
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile({
    type: 'object',
    properties: {
      stepParams: document?.jsonSchema?.properties?.stepParams || {},
    },
    additionalProperties: true,
  });
  const ok = validate({
    stepParams: document?.[key]?.stepParams,
  });
  expect(ok, JSON.stringify(validate.errors)).toBe(true);
};

const clonePayload = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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
      modelContributions: [
        {
          use: 'SaveContextualChildModel',
          source: 'official',
          strict: false,
          stepParamsSchema: {
            type: 'object',
            additionalProperties: true,
          },
        },
        {
          use: 'SaveContextualParentAlphaModel',
          source: 'official',
          strict: false,
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
          strict: false,
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
          strict: false,
        },
        {
          use: 'SaveContextualAncestorModel',
          source: 'official',
          strict: false,
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

  it('should return uid by default', async () => {
    const res = await agent.resource('flowModels').save({
      values: { uid: 'save-default-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-default-1');
  });

  it('should return model when return=model', async () => {
    const res = await agent.resource('flowModels').save({
      return: 'model',
      values: { uid: 'save-model-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-model-1');
    expect(res.body?.data?.use).toBe('RouteModel');
  });

  it('should generate uid for a new root when save payload omits uid', async () => {
    const repository: any = app.db.getCollection('flowModels').repository;
    const res = await agent.resource('flowModels').save({
      values: { use: 'RouteModel', async: false },
    });

    expect(res.status).toBe(200);
    expect(typeof res.body?.data).toBe('string');

    const saved = await repository.findModelById(res.body?.data, { includeAsyncNode: true });
    expect(saved?.uid).toBe(res.body?.data);
    expect(saved?.use).toBe('RouteModel');
  });

  it('should allow partial save for an existing root without resubmitting required subModels', async () => {
    const repository: any = app.db.getCollection('flowModels').repository;

    const createRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-partial-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
        subModels: {
          body: [
            {
              uid: 'save-existing-partial-child',
              use: 'SaveSchemaChildModel',
            },
          ],
        },
      },
    });

    expect(createRes.status).toBe(200);

    const updateRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-partial-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
      },
    });

    expect(updateRes.status).toBe(200);

    const saved = await repository.findModelById('save-existing-partial-root', { includeAsyncNode: true });
    expect(saved?.subModels?.body?.[0]?.uid).toBe('save-existing-partial-child');
  });

  it('should skip direct schema validation for existing nodes during save', async () => {
    const repository: any = app.db.getCollection('flowModels').repository;

    const createRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-skip-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
        subModels: {
          body: [
            {
              uid: 'save-existing-skip-child',
              use: 'SaveSchemaChildModel',
            },
          ],
        },
      },
    });

    expect(createRes.status).toBe(200);

    const updateRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-skip-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: 'yes',
            },
          },
        },
      },
    });

    expect(updateRes.status).toBe(200);

    const saved = await repository.findModelById('save-existing-skip-root', { includeAsyncNode: true });
    expect(saved?.stepParams?.settings?.save?.enabled).toBe('yes');
  });

  it('should allow runtime placeholder child nodes when the existing root is validated loosely', async () => {
    const createRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-new-child-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
        subModels: {
          body: [
            {
              uid: 'save-existing-new-child-old',
              use: 'SaveSchemaChildModel',
            },
          ],
        },
      },
    });

    expect(createRes.status).toBe(200);

    const res = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-new-child-root',
        use: 'SaveSchemaStrictModel',
        subModels: {
          body: [
            {
              use: 'RuntimeFieldModel',
            },
          ],
        },
      },
    });

    expect(res.status).toBe(200);
    const appendedChildren = (res.body?.data?.subModels?.body || []).filter(
      (item) => item?.uid !== 'save-existing-new-child-old',
    );
    expect(appendedChildren).toHaveLength(1);
    expect(appendedChildren[0]?.uid).toEqual(expect.any(String));
    expect(appendedChildren[0]?.use).toBe('RuntimeFieldModel');
  });

  it('should continue validating legal new child nodes when the root already exists', async () => {
    const createRes = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-legal-child-root',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
        subModels: {
          body: [
            {
              uid: 'save-existing-legal-child-old',
              use: 'SaveSchemaChildModel',
            },
          ],
        },
      },
    });

    expect(createRes.status).toBe(200);

    const res = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-existing-legal-child-root',
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

    expect(res.status).toBe(200);
    expect(res.body?.data?.subModels?.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          uid: 'save-existing-legal-child-old',
          use: 'SaveSchemaChildModel',
        }),
      ]),
    );
    const appendedChildren = (res.body?.data?.subModels?.body || []).filter(
      (item) => item?.uid !== 'save-existing-legal-child-old',
    );
    expect(appendedChildren).toHaveLength(1);
    expect(appendedChildren[0]?.uid).toEqual(expect.any(String));
    expect(appendedChildren[0]?.use).toBe('SaveSchemaChildModel');
  });

  it('should reject invalid return before persisting', async () => {
    const repository: any = app.db.getCollection('flowModels').repository;

    const res = await agent.resource('flowModels').save({
      return: 'bad',
      values: { uid: 'save-invalid-return-1', use: 'RouteModel', async: false },
    });

    expect(res.status).toBe(400);
    const saved = await repository.findModelById('save-invalid-return-1', { includeAsyncNode: true });
    expect(saved).toBeNull();
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

    const gridUses = [
      'BlockGridModel',
      'FormGridModel',
      'DetailsGridModel',
      'FilterFormGridModel',
      'AssignFormGridModel',
    ];

    for (const use of gridUses) {
      const gridDoc = await agent.get('/flowModels:schema').query({ use });
      expect(gridDoc.status).toBe(200);
      expect(gridDoc.body?.data?.use).toBe(use);
      expectGridLayoutSchemaDocument(gridDoc.body?.data);
    }

    const blockGridDoc = await agent.get('/flowModels:schema').query({
      use: 'BlockGridModel',
    });
    expect(blockGridDoc.status).toBe(200);
    expect(blockGridDoc.body?.data?.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Two rows with 2 + 3 columns',
          snippet: expect.objectContaining({
            stepParams: expect.objectContaining({
              gridSettings: expect.objectContaining({
                grid: expect.objectContaining({
                  sizes: {
                    rowTop: [12, 12],
                    rowBottom: [8, 8, 8],
                  },
                  rowOrder: ['rowTop', 'rowBottom'],
                }),
              }),
            }),
          }),
        }),
      ]),
    );

    const gridBatch = await agent.post('/flowModels:schemas').send({
      uses: gridUses,
    });
    expect(gridBatch.status).toBe(200);
    expect((gridBatch.body?.data || []).map((item) => item.use).sort()).toEqual([...gridUses].sort());
    for (const item of gridBatch.body?.data || []) {
      expectGridLayoutSchemaDocument(item);
    }

    const collectionUses = ['CreateFormModel', 'EditFormModel', 'DetailsBlockModel', 'TableBlockModel'];
    const collectionBatch = await agent.post('/flowModels:schemas').send({
      uses: collectionUses,
    });
    expect(collectionBatch.status).toBe(200);
    expect((collectionBatch.body?.data || []).map((item) => item.use).sort()).toEqual([...collectionUses].sort());
    const collectionDocs = Object.fromEntries((collectionBatch.body?.data || []).map((item) => [item.use, item]));

    for (const use of ['CreateFormModel', 'EditFormModel', 'DetailsBlockModel']) {
      expectCollectionResourceSettingsSchemaDocument(collectionDocs[use]);
      expect(collectionDocs[use]?.minimalExample?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expect(collectionDocs[use]?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expectStepParamsExampleMatchesDocument(collectionDocs[use], 'minimalExample');
      expectStepParamsExampleMatchesDocument(collectionDocs[use], 'skeleton');
    }

    expectCollectionResourceSettingsSchemaDocument(collectionDocs.TableBlockModel, {
      keepLegacyResourceSettings2: true,
    });
    expect(collectionDocs.TableBlockModel?.minimalExample?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expect(collectionDocs.TableBlockModel?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
      dataSourceKey: 'main',
      collectionName: 'users',
    });
    expectStepParamsExampleMatchesDocument(collectionDocs.TableBlockModel, 'minimalExample');
    expectStepParamsExampleMatchesDocument(collectionDocs.TableBlockModel, 'skeleton');
    expectGenericFilterSchemaDocument(
      collectionDocs.TableBlockModel?.jsonSchema?.properties?.stepParams?.properties?.tableSettings?.properties
        ?.dataScope?.properties?.filter,
    );

    expect(collectionDocs.EditFormModel?.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Current record mode',
          snippet: expect.objectContaining({
            stepParams: expect.objectContaining({
              resourceSettings: {
                init: expect.objectContaining({
                  filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
                }),
              },
            }),
          }),
        }),
      ]),
    );
    expect(collectionDocs.DetailsBlockModel?.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Current record mode',
          snippet: expect.objectContaining({
            stepParams: expect.objectContaining({
              resourceSettings: {
                init: expect.objectContaining({
                  filterByTk: '{{ctx.view.inputArgs.filterByTk}}',
                }),
              },
            }),
          }),
        }),
      ]),
    );
    for (const use of ['CreateFormModel', 'TableBlockModel']) {
      expect(collectionDocs[use]?.commonPatterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Associated records in popup/new scene',
            snippet: expect.objectContaining({
              stepParams: expect.objectContaining({
                resourceSettings: {
                  init: expect.objectContaining({
                    associationName: 'users.roles',
                    sourceId: '{{ctx.view.inputArgs.sourceId}}',
                  }),
                },
              }),
            }),
          }),
        ]),
      );
    }
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
      uses: ['ActionModel', 'TableBlockModel', 'PageModel', 'JSBlockModel', 'BlockGridModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data).not.toHaveProperty('generatedAt');
    expect(bundle.body?.data).not.toHaveProperty('summary');
    expect(JSON.stringify(bundle.body?.data)).not.toContain('missing-model-contribution');
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'ActionModel',
        }),
        expect.objectContaining({
          use: 'TableBlockModel',
        }),
        expect.objectContaining({
          use: 'PageModel',
        }),
        expect.objectContaining({
          use: 'JSBlockModel',
        }),
        expect.objectContaining({
          use: 'BlockGridModel',
        }),
      ]),
    );
    const tableItem = (bundle.body?.data?.items || []).find((item) => item.use === 'TableBlockModel');
    const pageItem = (bundle.body?.data?.items || []).find((item) => item.use === 'PageModel');
    const jsBlockItem = (bundle.body?.data?.items || []).find((item) => item.use === 'JSBlockModel');
    const blockGridItem = (bundle.body?.data?.items || []).find((item) => item.use === 'BlockGridModel');
    for (const item of bundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'subModelCatalog'].includes(key))).toEqual([]);
      expect(item).not.toHaveProperty('dynamicHints');
      expect(item).not.toHaveProperty('commonPatterns');
      expect(item).not.toHaveProperty('antiPatterns');
      expect(item).not.toHaveProperty('keyEnums');
      expect(item).not.toHaveProperty('coverage');
      expect(item).not.toHaveProperty('hash');
      expect(item).not.toHaveProperty('source');
      expect(item).not.toHaveProperty('skeleton');
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
    expect(jsBlockItem?.subModelCatalog).toBeUndefined();
    expect(blockGridItem?.subModelCatalog).toMatchObject({
      items: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'TableBlockModel' }),
          expect.objectContaining({ use: 'JSBlockModel' }),
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
    const editFormItem = (formBundle.body?.data?.items || []).find((item) => item.use === 'EditFormModel');
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
                  expect.objectContaining({ use: 'JSItemModel' }),
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
      expect(Object.keys(item).filter((key) => !['use', 'title', 'subModelCatalog'].includes(key))).toEqual([]);
      expect(item).not.toHaveProperty('skeleton');
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

    const jsBlock = await agent.get('/flowModels:schema').query({
      use: 'JSBlockModel',
    });
    expect(jsBlock.status).toBe(200);
    expect(jsBlock.body?.data?.minimalExample).toMatchObject({
      use: 'JSBlockModel',
    });

    const saveJsBlock = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-js-block-minimal',
        use: 'JSBlockModel',
        stepParams: {
          jsSettings: {
            runJs: {
              version: 'v2',
              code: "ctx.render('<div>Hello JS block.</div>');",
            },
          },
        },
      },
    });
    expect(saveJsBlock.status).toBe(200);
    expect(saveJsBlock.body?.data?.use).toBe('JSBlockModel');
  });

  it('should discover and validate public block contributions from plugin providers', async () => {
    await app.destroy();
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine', 'block-workbench', 'ui-templates'],
    });
    agent = app.agent();

    const actionPanel = await agent.get('/flowModels:schema').query({
      use: 'ActionPanelBlockModel',
    });
    expect(actionPanel.status).toBe(200);
    expect(actionPanel.body?.data?.use).toBe('ActionPanelBlockModel');

    const reference = await agent.get('/flowModels:schema').query({
      use: 'ReferenceBlockModel',
    });
    expect(reference.status).toBe(200);
    expect(reference.body?.data?.use).toBe('ReferenceBlockModel');

    const schemas = await agent.post('/flowModels:schemas').send({
      uses: ['ActionPanelBlockModel', 'ReferenceBlockModel'],
    });
    expect(schemas.status).toBe(200);
    expect((schemas.body?.data || []).map((item) => item.use)).toEqual(
      expect.arrayContaining(['ActionPanelBlockModel', 'ReferenceBlockModel']),
    );

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['ActionPanelBlockModel', 'ReferenceBlockModel'],
    });
    expect(bundle.status).toBe(200);
    const actionPanelItem = (bundle.body?.data?.items || []).find((item) => item.use === 'ActionPanelBlockModel');
    const referenceItem = (bundle.body?.data?.items || []).find((item) => item.use === 'ReferenceBlockModel');
    expect(actionPanelItem?.subModelCatalog).toMatchObject({
      actions: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'PopupActionModel' }),
          expect.objectContaining({ use: 'LinkActionModel' }),
          expect.objectContaining({ use: 'JSActionModel' }),
          expect.objectContaining({ use: 'ActionPanelScanActionModel' }),
        ]),
      },
    });
    expect(referenceItem?.subModelCatalog).toBeUndefined();

    const saveActionPanel = await agent.resource('flowModels').save({
      values: {
        uid: 'save-action-panel-block',
        use: 'ActionPanelBlockModel',
        stepParams: {
          actionPanelBlockSetting: {
            layout: {
              layout: 'grid',
            },
          },
        },
        subModels: {
          actions: [
            {
              uid: 'save-action-panel-block-js-action',
              use: 'JSActionModel',
              stepParams: {
                buttonSettings: {
                  general: {
                    title: 'Run JS',
                    type: 'default',
                  },
                },
                clickSettings: {
                  runJs: {
                    version: 'v2',
                    code: "ctx.message.info('Hello JS action.');",
                  },
                },
              },
            },
          ],
        },
      },
    });
    expect(saveActionPanel.status).toBe(200);

    const saveReference = await agent.resource('flowModels').save({
      values: {
        uid: 'save-reference-block',
        use: 'ReferenceBlockModel',
        stepParams: {
          referenceSettings: {
            target: {
              targetUid: 'users-template-block',
              mode: 'reference',
            },
          },
        },
      },
    });
    expect(saveReference.status).toBe(200);

    const saveInvalidReference = await agent.resource('flowModels').save({
      values: {
        uid: 'save-reference-block-invalid',
        use: 'ReferenceBlockModel',
        stepParams: {
          referenceSettings: {
            target: {
              mode: 'reference',
            },
          },
        },
      },
    });
    expect(saveInvalidReference.status).toBe(200);
    expect(saveInvalidReference.body?.data).toBe('save-reference-block-invalid');
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
      return: 'model',
      values: {
        uid: 'save-internal-form-grid',
        use: 'FormGridModel',
      },
    });

    expect(saveConcrete.status).toBe(200);
    expect(saveConcrete.body?.data?.use).toBe('FormGridModel');

    const saveItem = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-internal-form-item',
        use: 'FormItemModel',
      },
    });

    expect(saveItem.status).toBe(200);
    expect(saveItem.body?.data?.use).toBe('FormItemModel');

    const saveSubmitAction = await agent.resource('flowModels').save({
      return: 'model',
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

  it('should expose popup action child page contracts in schema and bundle', async () => {
    const popupActionUses = [
      'PopupActionModel',
      'AddNewActionModel',
      'EditActionModel',
      'ViewActionModel',
      'PopupCollectionActionModel',
    ];

    for (const use of popupActionUses) {
      const schema = await agent.get('/flowModels:schema').query({ use });
      expect(schema.status).toBe(200);
      expect(schema.body?.data?.use).toBe(use);
      expect(schema.body?.data?.jsonSchema?.properties?.subModels?.properties?.page).toMatchObject({
        type: 'object',
        properties: {
          use: {
            const: 'ChildPageModel',
          },
        },
      });
      expect(
        schema.body?.data?.jsonSchema?.properties?.stepParams?.properties?.popupSettings?.properties?.openView,
      ).toMatchObject({
        type: 'object',
        properties: {
          pageModelClass: {
            type: 'string',
            enum: ['ChildPageModel', 'RootPageModel'],
          },
        },
      });
      expect(schema.body?.data?.minimalExample?.subModels?.page?.use).toBe('ChildPageModel');
      expect(schema.body?.data?.minimalExample?.stepParams?.popupSettings?.openView?.pageModelClass).toBe(
        'ChildPageModel',
      );
    }

    const childPage = await agent.get('/flowModels:schema').query({
      use: 'ChildPageModel',
    });
    expect(childPage.status).toBe(200);
    expect(childPage.body?.data?.jsonSchema?.properties?.subModels).toMatchObject({
      required: ['tabs'],
      properties: {
        tabs: {
          type: 'array',
          minItems: 1,
        },
      },
    });

    const childPageTab = await agent.get('/flowModels:schema').query({
      use: 'ChildPageTabModel',
    });
    expect(childPageTab.status).toBe(200);
    expect(childPageTab.body?.data?.jsonSchema?.properties?.subModels).toMatchObject({
      required: ['grid'],
      properties: {
        grid: {
          type: 'object',
          properties: {
            use: {
              const: 'BlockGridModel',
            },
          },
        },
      },
    });

    const batch = await agent.post('/flowModels:schemas').send({
      uses: [...popupActionUses, 'ChildPageModel', 'ChildPageTabModel'],
    });
    expect(batch.status).toBe(200);
    expect((batch.body?.data || []).map((item) => item.use)).toEqual(
      expect.arrayContaining([...popupActionUses, 'ChildPageModel', 'ChildPageTabModel']),
    );

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: [...popupActionUses, 'ChildPageModel', 'ChildPageTabModel'],
    });
    expect(bundle.status).toBe(200);
    expect((bundle.body?.data?.items || []).map((item) => item.use)).toEqual(
      expect.arrayContaining([...popupActionUses, 'ChildPageModel', 'ChildPageTabModel']),
    );

    const addNewItem = (bundle.body?.data?.items || []).find((item) => item.use === 'AddNewActionModel');
    expect(addNewItem?.subModelCatalog).toMatchObject({
      page: {
        type: 'object',
        candidates: [
          expect.objectContaining({
            use: 'ChildPageModel',
            subModelCatalog: {
              tabs: {
                type: 'array',
                required: true,
                minItems: 1,
                candidates: [
                  expect.objectContaining({
                    use: 'ChildPageTabModel',
                    subModelCatalog: {
                      grid: {
                        type: 'object',
                        required: true,
                        candidates: [expect.objectContaining({ use: 'BlockGridModel' })],
                      },
                    },
                  }),
                ],
              },
            },
          }),
        ],
      },
    });
  });

  it('should save popup action trees and validate popup child page contracts', async () => {
    const popupActionUses = ['AddNewActionModel', 'EditActionModel', 'ViewActionModel'];
    const popupDocs: Record<string, any> = {};
    const schemaAgent = app.agent();
    const saveAgent = app.agent();

    for (const use of popupActionUses) {
      const res = await schemaAgent.get('/flowModels:schema').query({ use });
      expect(res.status).toBe(200);
      popupDocs[use] = res.body?.data;
    }

    for (const use of popupActionUses) {
      const payload = clonePayload(popupDocs[use].minimalExample);
      payload.uid = `save-${use.toLowerCase()}`;
      const saveRes = await saveAgent.resource('flowModels').save({
        return: 'model',
        values: payload,
      });
      expect(saveRes.status).toBe(200);
      expect(saveRes.body?.data?.use).toBe(use);
    }

    const legacyPopup = await saveAgent.resource('flowModels').save({
      values: {
        uid: 'save-legacy-popup-action',
        use: 'PopupActionModel',
        stepParams: {
          buttonSettings: {
            general: {
              title: 'Popup',
              type: 'default',
            },
          },
          popupSettings: {
            openView: {
              mode: 'drawer',
              size: 'medium',
              pageModelClass: 'ChildPageModel',
            },
          },
        },
      },
    });
    expect(legacyPopup.status).toBe(200);

    const expectLoosePopupPayload = async (values: any) => {
      const res = await saveAgent.resource('flowModels').save({ values });
      expect(res.status).toBe(200);
      expect(res.body?.data).toBe(values.uid);
    };

    const addNewBase = clonePayload(popupDocs.AddNewActionModel.minimalExample);

    const wrongPageUse = clonePayload(addNewBase);
    wrongPageUse.uid = 'save-popup-invalid-page-use';
    wrongPageUse.subModels.page.use = 'PageModel';
    await expectLoosePopupPayload(wrongPageUse);

    const missingTabs = clonePayload(addNewBase);
    missingTabs.uid = 'save-popup-missing-tabs';
    delete missingTabs.subModels.page.subModels.tabs;
    await expectLoosePopupPayload(missingTabs);

    const emptyTabs = clonePayload(addNewBase);
    emptyTabs.uid = 'save-popup-empty-tabs';
    emptyTabs.subModels.page.subModels.tabs = [];
    await expectLoosePopupPayload(emptyTabs);

    const wrongTabUse = clonePayload(addNewBase);
    wrongTabUse.uid = 'save-popup-invalid-tab-use';
    wrongTabUse.subModels.page.subModels.tabs[0].use = 'PageTabModel';
    await expectLoosePopupPayload(wrongTabUse);

    const missingGrid = clonePayload(addNewBase);
    missingGrid.uid = 'save-popup-missing-grid';
    delete missingGrid.subModels.page.subModels.tabs[0].subModels.grid;
    await expectLoosePopupPayload(missingGrid);

    const wrongGridUse = clonePayload(addNewBase);
    wrongGridUse.uid = 'save-popup-invalid-grid-use';
    wrongGridUse.subModels.page.subModels.tabs[0].subModels.grid.use = 'FormGridModel';
    await expectLoosePopupPayload(wrongGridUse);

    const invalidPageModelClass = clonePayload(addNewBase);
    invalidPageModelClass.uid = 'save-popup-invalid-page-model-class';
    invalidPageModelClass.stepParams.popupSettings.openView.pageModelClass = 'UnknownPageModel';
    await expectLoosePopupPayload(invalidPageModelClass);
  });

  it('should expose real field model candidates and tolerate runtime field slot mismatches under loose validation', async () => {
    const originalGetFieldByPath = app.db.getFieldByPath?.bind(app.db);
    const originalGetDataSource = app.dataSourceManager.get.bind(app.dataSourceManager);
    vi.spyOn(app.db, 'getFieldByPath').mockImplementation((path: string) => {
      if (path === 'flow_field_schema_cases.title') {
        return {
          interface: 'input',
          type: 'string',
        } as any;
      }
      if (path === 'flow_field_schema_cases.website') {
        return {
          interface: 'url',
          type: 'string',
        } as any;
      }
      if (path === 'secondary_flow_field_schema_cases.website') {
        return {
          interface: 'input',
          type: 'string',
        } as any;
      }
      return originalGetFieldByPath?.(path);
    });
    vi.spyOn(app.dataSourceManager, 'get').mockImplementation((key: string) => {
      if (key === 'secondary') {
        return {
          collectionManager: {
            db: {
              getFieldByPath(path: string) {
                if (path === 'secondary_flow_field_schema_cases.website') {
                  return {
                    interface: 'url',
                    type: 'string',
                  } as any;
                }
                return undefined;
              },
              getCollection() {
                return undefined;
              },
            },
          },
        } as any;
      }

      return originalGetDataSource(key);
    });

    const inputField = await agent.get('/flowModels:schema').query({
      use: 'InputFieldModel',
    });
    expect(inputField.status).toBe(200);
    expect(inputField.body?.data?.use).toBe('InputFieldModel');

    const displayTextField = await agent.get('/flowModels:schema').query({
      use: 'DisplayTextFieldModel',
    });
    expect(displayTextField.status).toBe(200);
    expect(displayTextField.body?.data?.use).toBe('DisplayTextFieldModel');

    const displayUrlField = await agent.get('/flowModels:schema').query({
      use: 'DisplayURLFieldModel',
    });
    expect(displayUrlField.status).toBe(200);
    expect(displayUrlField.body?.data?.use).toBe('DisplayURLFieldModel');

    const jsField = await agent.get('/flowModels:schema').query({
      use: 'JSFieldModel',
    });
    expect(jsField.status).toBe(200);
    expect(jsField.body?.data?.use).toBe('JSFieldModel');
    expect(jsField.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        fieldSettings: {
          type: 'object',
        },
        jsSettings: {
          type: 'object',
          properties: {
            runJs: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                version: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    });
    expectStepParamsExampleMatchesDocument(jsField.body?.data, 'skeleton');

    const jsEditableField = await agent.get('/flowModels:schema').query({
      use: 'JSEditableFieldModel',
    });
    expect(jsEditableField.status).toBe(200);
    expect(jsEditableField.body?.data?.use).toBe('JSEditableFieldModel');
    expect(jsEditableField.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        fieldSettings: {
          type: 'object',
        },
        jsSettings: {
          type: 'object',
          properties: {
            runJs: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                version: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    });
    expectStepParamsExampleMatchesDocument(jsEditableField.body?.data, 'skeleton');

    const jsItem = await agent.get('/flowModels:schema').query({
      use: 'JSItemModel',
    });
    expect(jsItem.status).toBe(200);
    expect(jsItem.body?.data?.use).toBe('JSItemModel');
    expect(jsItem.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        jsSettings: {
          type: 'object',
          properties: {
            runJs: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                version: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    });
    expect(jsItem.body?.data?.minimalExample).toMatchObject({
      use: 'JSItemModel',
      stepParams: {
        jsSettings: {
          runJs: {
            version: 'v2',
          },
        },
      },
    });
    expectStepParamsExampleMatchesDocument(jsItem.body?.data, 'skeleton');

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['TableColumnModel', 'FormItemModel', 'InputFieldModel'],
    });

    expect(bundle.status).toBe(200);
    expect(JSON.stringify(bundle.body?.data)).not.toContain('RuntimeFieldModel');

    const tableColumn = (bundle.body?.data?.items || []).find((item) => item.use === 'TableColumnModel');
    expect(tableColumn?.subModelCatalog).toMatchObject({
      field: {
        type: 'object',
        candidates: expect.arrayContaining([
          expect.objectContaining({
            use: 'DisplayTextFieldModel',
            compatibility: expect.objectContaining({
              context: 'display-field',
              interfaces: expect.arrayContaining(['input']),
              isDefault: true,
              inheritParentFieldBinding: true,
            }),
          }),
          expect.objectContaining({
            use: 'DisplayURLFieldModel',
            compatibility: expect.objectContaining({
              context: 'display-field',
              interfaces: expect.arrayContaining(['url']),
              isDefault: true,
              inheritParentFieldBinding: true,
            }),
          }),
          expect.objectContaining({
            use: 'JSFieldModel',
            compatibility: expect.objectContaining({
              context: 'display-field',
              interfaces: ['*'],
              inheritParentFieldBinding: true,
            }),
          }),
        ]),
      },
    });

    const formItem = (bundle.body?.data?.items || []).find((item) => item.use === 'FormItemModel');
    expect(formItem?.subModelCatalog).toMatchObject({
      field: {
        type: 'object',
        candidates: expect.arrayContaining([
          expect.objectContaining({
            use: 'InputFieldModel',
            compatibility: expect.objectContaining({
              context: 'editable-field',
              interfaces: expect.arrayContaining(['input']),
              isDefault: true,
              inheritParentFieldBinding: true,
            }),
          }),
          expect.objectContaining({
            use: 'JSEditableFieldModel',
            compatibility: expect.objectContaining({
              context: 'editable-field',
              interfaces: ['*'],
              inheritParentFieldBinding: true,
            }),
          }),
        ]),
      },
    });

    const topLevelFieldItem = (bundle.body?.data?.items || []).find((item) => item.use === 'InputFieldModel');
    expect(topLevelFieldItem).not.toHaveProperty('skeleton');

    const saveTableDisplay = await agent.resource('flowModels').save({
      values: {
        uid: 'save-table-display-field',
        use: 'TableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'website',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-table-display-field-child',
            use: 'DisplayURLFieldModel',
          },
        },
      },
    });
    expect(saveTableDisplay.status).toBe(200);

    const saveTableJs = await agent.resource('flowModels').save({
      values: {
        uid: 'save-table-js-field',
        use: 'TableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'website',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-table-js-field-child',
            use: 'JSFieldModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'flow_field_schema_cases',
                  fieldPath: 'website',
                },
              },
              jsSettings: {
                runJs: {
                  version: 'v2',
                  code: '',
                },
              },
            },
          },
        },
      },
    });
    expect(saveTableJs.status).toBe(200);

    const saveDetailsJs = await agent.resource('flowModels').save({
      values: {
        uid: 'save-details-js-field',
        use: 'DetailsItemModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'title',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-details-js-field-child',
            use: 'JSFieldModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'flow_field_schema_cases',
                  fieldPath: 'title',
                },
              },
              jsSettings: {
                runJs: {
                  version: 'v2',
                  code: '',
                },
              },
            },
          },
        },
      },
    });
    expect(saveDetailsJs.status).toBe(200);

    const saveSecondaryDataSourceDisplay = await agent.resource('flowModels').save({
      values: {
        uid: 'save-secondary-data-source-display-field',
        use: 'TableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'secondary',
              collectionName: 'secondary_flow_field_schema_cases',
              fieldPath: 'website',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-secondary-data-source-display-field-child',
            use: 'DisplayURLFieldModel',
          },
        },
      },
    });
    expect(saveSecondaryDataSourceDisplay.status).toBe(200);
    expect(app.dataSourceManager.get).toHaveBeenCalledWith('secondary');

    const saveTableInput = await agent.resource('flowModels').save({
      values: {
        uid: 'save-table-input-field',
        use: 'TableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'website',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-table-input-field-child',
            use: 'InputFieldModel',
          },
        },
      },
    });
    expect(saveTableInput.status).toBe(200);
    expect(saveTableInput.body?.data).toBe('save-table-input-field');

    const saveTableRuntimePlaceholder = await agent.resource('flowModels').save({
      values: {
        uid: 'save-table-runtime-field',
        use: 'TableColumnModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'website',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-table-runtime-field-child',
            use: 'RuntimeFieldModel',
          },
        },
      },
    });
    expect(saveTableRuntimePlaceholder.status).toBe(200);
    expect(saveTableRuntimePlaceholder.body?.data).toBe('save-table-runtime-field');

    const saveFormInput = await agent.resource('flowModels').save({
      values: {
        uid: 'save-form-input-field',
        use: 'FormItemModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'title',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-form-input-field-child',
            use: 'InputFieldModel',
          },
        },
      },
    });
    expect(saveFormInput.status).toBe(200);

    const saveFormJs = await agent.resource('flowModels').save({
      values: {
        uid: 'save-form-js-field',
        use: 'FormItemModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'title',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-form-js-field-child',
            use: 'JSEditableFieldModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: 'main',
                  collectionName: 'flow_field_schema_cases',
                  fieldPath: 'title',
                },
              },
              jsSettings: {
                runJs: {
                  version: 'v2',
                  code: '',
                },
              },
            },
          },
        },
      },
    });
    expect(saveFormJs.status).toBe(200);

    const saveFormGridJsItem = await agent.resource('flowModels').save({
      values: {
        uid: 'save-form-grid-js-item',
        use: 'FormGridModel',
        subModels: {
          items: [
            {
              uid: 'save-form-grid-js-item-child',
              use: 'JSItemModel',
              stepParams: {
                jsSettings: {
                  runJs: {
                    version: 'v2',
                    code: "ctx.render('<div>Hello JS item.</div>');",
                  },
                },
              },
            },
          ],
        },
      },
    });
    expect(saveFormGridJsItem.status).toBe(200);

    const saveFormDisplay = await agent.resource('flowModels').save({
      values: {
        uid: 'save-form-display-field',
        use: 'FormItemModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'flow_field_schema_cases',
              fieldPath: 'title',
            },
          },
        },
        subModels: {
          field: {
            uid: 'save-form-display-field-child',
            use: 'DisplayTextFieldModel',
          },
        },
      },
    });
    expect(saveFormDisplay.status).toBe(200);
    expect(saveFormDisplay.body?.data).toBe('save-form-display-field');
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

    expect(betaFail.status).toBe(200);
    expect(betaFail.body?.data).toBe('ctx-beta-1');
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

    expect(fail.status).toBe(200);
    expect(fail.body?.data).toBe('ctx-ancestor-2');
  });

  it('should allow invalid save payloads once schema issues are downgraded to warnings', async () => {
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

    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-invalid-schema-1');
  });

  it('should tolerate props in payloads without treating them as schema contract', async () => {
    const res = await agent.resource('flowModels').save({
      return: 'model',
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

  it('should allow nested child props to be null during save', async () => {
    const res = await agent.resource('flowModels').save({
      return: 'model',
      values: {
        uid: 'save-ignore-props-null-parent',
        use: 'SaveSchemaStrictModel',
        stepParams: {
          settings: {
            save: {
              enabled: true,
            },
          },
        },
        subModels: {
          body: [
            {
              uid: 'save-ignore-props-null-child',
              use: 'SaveSchemaChildModel',
              props: null,
            },
          ],
        },
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-ignore-props-null-parent');
    expect(res.body?.data?.subModels?.body?.[0]?.uid).toBe('save-ignore-props-null-child');
  });

  it('should allow arbitrary objects inside generic filter trees when validation is loose', async () => {
    const res = await agent.resource('flowModels').save({
      values: {
        uid: 'save-invalid-filter-tree',
        use: 'TableBlockModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'users',
            },
          },
          tableSettings: {
            dataScope: {
              filter: {
                logic: '$and',
                items: [
                  {
                    foo: 'bar',
                  },
                ],
              },
            },
          },
        },
      },
    });

    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-invalid-filter-tree');
  });
});
