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

const expectPublicSchemaDocument = (document: any) => {
  expect(document).not.toHaveProperty('coverage');
  expect(document).not.toHaveProperty('skeleton');
  expect(document).not.toHaveProperty('examples');
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
    if (app) {
      await app.destroy();
    }
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

  it('should expose schema discovery endpoints without authoring metadata', async () => {
    const single = await agent.get('/flowModels:schema').query({
      use: 'SaveSchemaStrictModel',
    });
    expect(single.status).toBe(200);
    expect(single.body?.data?.use).toBe('SaveSchemaStrictModel');
    expect(single.body?.data?.source).toBe('official');
    expectPublicSchemaDocument(single.body?.data);

    const batch = await agent.post('/flowModels:schemas').send({
      uses: ['SaveSchemaStrictModel'],
    });
    expect(batch.status).toBe(200);
    expect(batch.body?.data).toHaveLength(1);
    expect(batch.body?.data?.[0]?.use).toBe('SaveSchemaStrictModel');
    expectPublicSchemaDocument(batch.body?.data?.[0]);

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['SaveSchemaStrictModel'],
    });
    expect(bundle.status).toBe(200);
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'SaveSchemaStrictModel',
        }),
      ]),
    );
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

  it('should save popup action examples while keeping popup validation loose', async () => {
    const schema = await agent.get('/flowModels:schema').query({
      use: 'AddNewActionModel',
    });

    expect(schema.status).toBe(200);
    const payload = clonePayload(schema.body?.data?.minimalExample);
    payload.uid = 'save-add-new-action';

    const saveRes = await agent.resource('flowModels').save({
      return: 'model',
      values: payload,
    });
    expect(saveRes.status).toBe(200);
    expect(saveRes.body?.data?.use).toBe('AddNewActionModel');

    const invalidPayload = clonePayload(schema.body?.data?.minimalExample);
    invalidPayload.uid = 'save-popup-missing-tabs';
    delete invalidPayload.subModels.page.subModels.tabs;

    const invalidRes = await agent.resource('flowModels').save({
      values: invalidPayload,
    });
    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body?.data).toBe('save-popup-missing-tabs');
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
});
