/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowModel } from '@nocobase/flow-engine';
import { clonePayload, createFlowEngineTestApp, destroyTestApp, expectPublicSchemaDocument } from './test-utils';

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
  let app: any;
  let agent: any;
  let repository: any;

  const saveModel = (values: any, options: Record<string, any> = {}) => {
    return agent.resource('flowModels').save({
      ...options,
      values,
    });
  };

  const querySchema = (use: string) => agent.get('/flowModels:schema').query({ use });
  const querySchemas = (uses: string[]) => agent.post('/flowModels:schemas').send({ uses });
  const querySchemaBundle = (uses: string[]) => agent.post('/flowModels:schemaBundle').send({ uses });
  const findSaved = (uid: string) => repository.findModelById(uid, { includeAsyncNode: true });
  const createStrictStepParams = (enabled: boolean | string = true) => ({
    settings: {
      save: {
        enabled,
      },
    },
  });

  async function seedStrictRoot(rootUid: string, child: Record<string, any>) {
    const res = await saveModel(
      {
        uid: rootUid,
        use: 'SaveSchemaStrictModel',
        stepParams: createStrictStepParams(),
        subModels: {
          body: [child],
        },
      },
      { return: 'model' },
    );

    expect(res.status).toBe(200);
    return res;
  }

  afterEach(async () => {
    await destroyTestApp(app);
    app = null;
  });

  beforeEach(async () => {
    ({ app, agent } = await createFlowEngineTestApp({
      registerSchemas(flowEnginePlugin) {
        flowEnginePlugin.registerFlowSchemas({
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
      },
    }));
    repository = app.db.getCollection('flowModels').repository;
  });

  it('should return uid by default', async () => {
    const res = await saveModel({ uid: 'save-default-1', use: 'RouteModel', async: false });

    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-default-1');
  });

  it('should return model when return=model', async () => {
    const res = await saveModel({ uid: 'save-model-1', use: 'RouteModel', async: false }, { return: 'model' });

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-model-1');
    expect(res.body?.data?.use).toBe('RouteModel');
    expect(res.body?.data?.async).toBe(false);
  });

  it('should generate uid for a new root when save payload omits uid', async () => {
    const res = await saveModel({ use: 'RouteModel', async: false });

    expect(res.status).toBe(200);
    expect(typeof res.body?.data).toBe('string');

    const saved = await findSaved(res.body?.data);
    expect(saved?.uid).toBe(res.body?.data);
    expect(saved?.use).toBe('RouteModel');
  });

  it('should allow partial save for an existing root without resubmitting required subModels', async () => {
    await seedStrictRoot('save-existing-partial-root', {
      uid: 'save-existing-partial-child',
      use: 'SaveSchemaChildModel',
    });

    const updateRes = await saveModel(
      {
        uid: 'save-existing-partial-root',
        use: 'SaveSchemaStrictModel',
        stepParams: createStrictStepParams(),
      },
      { return: 'model' },
    );

    expect(updateRes.status).toBe(200);

    const saved = await findSaved('save-existing-partial-root');
    expect(saved?.subModels?.body?.[0]?.uid).toBe('save-existing-partial-child');
  });

  it('should skip direct schema validation for existing nodes during save', async () => {
    await seedStrictRoot('save-existing-skip-root', {
      uid: 'save-existing-skip-child',
      use: 'SaveSchemaChildModel',
    });

    const updateRes = await saveModel(
      {
        uid: 'save-existing-skip-root',
        use: 'SaveSchemaStrictModel',
        stepParams: createStrictStepParams('yes'),
      },
      { return: 'model' },
    );

    expect(updateRes.status).toBe(200);

    const saved = await findSaved('save-existing-skip-root');
    expect(saved?.stepParams?.settings?.save?.enabled).toBe('yes');
  });

  it('should allow runtime placeholder child nodes when the existing root is validated loosely', async () => {
    await seedStrictRoot('save-existing-new-child-root', {
      uid: 'save-existing-new-child-old',
      use: 'SaveSchemaChildModel',
    });

    const res = await saveModel(
      {
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
      { return: 'model' },
    );

    expect(res.status).toBe(200);
    const appendedChildren = (res.body?.data?.subModels?.body || []).filter(
      (item) => item?.uid !== 'save-existing-new-child-old',
    );
    expect(appendedChildren).toHaveLength(1);
    expect(appendedChildren[0]?.uid).toEqual(expect.any(String));
    expect(appendedChildren[0]?.use).toBe('RuntimeFieldModel');
  });

  it('should continue validating legal new child nodes when the root already exists', async () => {
    await seedStrictRoot('save-existing-legal-child-root', {
      uid: 'save-existing-legal-child-old',
      use: 'SaveSchemaChildModel',
    });

    const res = await saveModel(
      {
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
      { return: 'model' },
    );

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
    const res = await saveModel({ uid: 'save-invalid-return-1', use: 'RouteModel', async: false }, { return: 'bad' });

    expect(res.status).toBe(400);
    const saved = await findSaved('save-invalid-return-1');
    expect(saved).toBeNull();
  });

  it('should expose schema discovery endpoints without authoring metadata', async () => {
    const single = await querySchema('SaveSchemaStrictModel');
    expect(single.status).toBe(200);
    expect(single.body?.data?.use).toBe('SaveSchemaStrictModel');
    expect(single.body?.data?.source).toBe('official');
    expectPublicSchemaDocument(single.body?.data);

    const batch = await querySchemas(['SaveSchemaStrictModel']);
    expect(batch.status).toBe(200);
    expect(batch.body?.data).toHaveLength(1);
    expect(batch.body?.data?.[0]?.use).toBe('SaveSchemaStrictModel');
    expectPublicSchemaDocument(batch.body?.data?.[0]);

    const bundle = await querySchemaBundle(['SaveSchemaStrictModel']);
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
    for (const use of ['FormGridModel', 'BlockGridModel', 'FormItemModel', 'FormSubmitActionModel']) {
      const schema = await querySchema(use);
      expect(schema.status).toBe(200);
      expect(schema.body?.data?.use).toBe(use);
    }

    for (const [use, uid] of [
      ['FormGridModel', 'save-internal-form-grid'],
      ['FormItemModel', 'save-internal-form-item'],
      ['FormSubmitActionModel', 'save-internal-form-submit'],
    ]) {
      const res = await saveModel({ uid, use }, { return: 'model' });
      expect(res.status).toBe(200);
      expect(res.body?.data?.use).toBe(use);
    }

    const internal = await querySchema('FormBlockModel');
    expect(internal.status).toBe(404);

    const createForm = await querySchema('CreateFormModel');
    expect(createForm.status).toBe(200);
    expect(createForm.body?.data?.use).toBe('CreateFormModel');
    expect(createForm.body?.data?.jsonSchema?.properties?.props).toBeUndefined();

    const saveInternal = await saveModel({
      uid: 'save-internal-form-block',
      use: 'FormBlockModel',
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
    const schema = await querySchema('AddNewActionModel');

    expect(schema.status).toBe(200);
    const payload = clonePayload(schema.body?.data?.minimalExample);
    payload.uid = 'save-add-new-action';

    const saveRes = await saveModel(payload, { return: 'model' });
    expect(saveRes.status).toBe(200);
    expect(saveRes.body?.data?.use).toBe('AddNewActionModel');

    const invalidPayload = clonePayload(schema.body?.data?.minimalExample);
    invalidPayload.uid = 'save-popup-missing-tabs';
    delete invalidPayload.subModels.page.subModels.tabs;

    const invalidRes = await saveModel(invalidPayload);
    expect(invalidRes.status).toBe(200);
    expect(invalidRes.body?.data).toBe('save-popup-missing-tabs');
  });

  it('should allow invalid save payloads once schema issues are downgraded to warnings', async () => {
    const res = await saveModel({
      uid: 'save-invalid-schema-1',
      use: 'SaveSchemaStrictModel',
      props: {
        title: 123,
      },
      stepParams: createStrictStepParams('yes'),
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
    });

    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-invalid-schema-1');
  });

  it('should tolerate props in payloads without treating them as schema contract', async () => {
    const res = await saveModel(
      {
        uid: 'save-ignore-props-1',
        use: 'SaveSchemaStrictModel',
        props: {
          title: 123,
        },
        stepParams: createStrictStepParams(),
      },
      { return: 'model' },
    );

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-ignore-props-1');
  });

  it('should allow nested child props to be null during save', async () => {
    const res = await saveModel(
      {
        uid: 'save-ignore-props-null-parent',
        use: 'SaveSchemaStrictModel',
        stepParams: createStrictStepParams(),
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
      { return: 'model' },
    );

    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-ignore-props-null-parent');
    expect(res.body?.data?.subModels?.body?.[0]?.uid).toBe('save-ignore-props-null-child');
  });
});
