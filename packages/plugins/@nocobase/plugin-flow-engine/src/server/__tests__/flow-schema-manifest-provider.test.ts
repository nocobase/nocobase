/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Ajv from 'ajv';
import { type FlowSchemaManifestContribution, FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/server';
import { MockServer, createMockServer } from '@nocobase/test';
import { PluginActionBulkEditServer } from '../../../../plugin-action-bulk-edit/src/server/plugin';
import { PluginActionBulkUpdateServer } from '../../../../plugin-action-bulk-update/src/server/plugin';
import { PluginActionDuplicateServer } from '../../../../plugin-action-duplicate/src/server/plugin';
import { PluginActionExportServer } from '../../../../plugin-action-export/src/server';
import { flowSchemaManifestContribution as actionExportFlowSchemaManifestContribution } from '../../../../plugin-action-export/src/server/flow-schema-manifests';
import { PluginActionImportServer } from '../../../../plugin-action-import/src/server';
import { flowSchemaManifestContribution as actionImportFlowSchemaManifestContribution } from '../../../../plugin-action-import/src/server/flow-schema-manifests';
import { PluginBlockGridCardServer } from '../../../../plugin-block-grid-card/src/server/plugin';
import { PluginBlockWorkbenchServer } from '../../../../plugin-block-workbench/src/server/plugin';
import { PluginBlockIframeServer } from '../../../../plugin-block-iframe/src/server/plugin';
import { PluginBlockListServer } from '../../../../plugin-block-list/src/server/plugin';
import { PluginBlockMarkdownServer } from '../../../../plugin-block-markdown/src/server/plugin';
import { PluginCommentServer } from '../../../../plugin-comments/src/server/plugin';
import { flowSchemaManifestContribution as dataVisualizationFlowSchemaManifestContribution } from '../../../../plugin-data-visualization/src/server/flow-schema-manifests';
import { PluginDataVisualizationServer } from '../../../../plugin-data-visualization/src/server/plugin';
import { PluginMapServer } from '../../../../plugin-map/src/server/plugin';
import { PluginBlockReferenceServer } from '../../../../plugin-ui-templates/src/server/plugin';

class ProviderActionHostModel extends FlowModel {}

ProviderActionHostModel.define({
  label: 'Provider action host model',
  createModelOptions: {
    use: 'ProviderActionHostModel',
  },
});

ProviderActionHostModel.registerFlow({
  key: 'settings',
  steps: {
    toggle: {
      use: 'providerRecordAction',
    },
  },
});

class RecordManifestPlugin extends Plugin {
  get name() {
    return 'record-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      defaults: {
        strict: true,
      },
      actions: {
        providerRecordAction: {
          title: 'Provider record action',
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
          docs: {
            minimalExample: {
              enabled: true,
            },
          },
        } as any,
      },
      models: {
        ProviderManifestModel: {
          title: 'Provider manifest model',
          stepParamsSchema: {
            type: 'object',
            properties: {
              settings: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                },
                required: ['title'],
                additionalProperties: false,
              },
            },
            additionalProperties: true,
          },
          docs: {
            minimalExample: {
              uid: 'provider-manifest-model-1',
              use: 'ProviderManifestModel',
              stepParams: {
                settings: {
                  title: 'Provider title',
                },
              },
            },
          },
        } as any,
      },
    };
  }
}

class ArrayManifestPlugin extends Plugin {
  get name() {
    return 'array-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      defaults: {
        source: 'plugin',
        strict: false,
      },
      actions: [
        {
          name: 'providerArrayAction',
          title: 'Provider array action',
          paramsSchema: {
            type: 'object',
            properties: {
              mode: {
                type: 'string',
                enum: ['compact', 'full'],
              },
            },
            required: ['mode'],
            additionalProperties: false,
          },
        },
      ],
      models: [
        {
          use: 'ProviderArrayModel',
          title: 'Provider array model',
          stepParamsSchema: {
            type: 'object',
            properties: {
              settings: {
                type: 'object',
                properties: {
                  mode: {
                    type: 'string',
                    enum: ['compact', 'full'],
                  },
                },
                required: ['mode'],
                additionalProperties: false,
              },
            },
            additionalProperties: true,
          },
        },
      ],
    };
  }
}

class FirstMergedManifestPlugin extends Plugin {
  get name() {
    return 'first-merged-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      models: {
        MergedProviderModel: {
          title: 'Merged provider model',
          docs: {
            commonPatterns: [
              {
                title: 'First merge pattern',
              },
            ],
          },
        } as any,
      },
    };
  }
}

class SecondMergedManifestPlugin extends Plugin {
  get name() {
    return 'second-merged-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      models: {
        MergedProviderModel: {
          stepParamsSchema: {
            type: 'object',
            properties: {
              settings: {
                type: 'object',
                properties: {
                  enabled: {
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
              },
            },
            additionalProperties: true,
          },
          docs: {
            minimalExample: {
              uid: 'merged-provider-model-1',
              use: 'MergedProviderModel',
              stepParams: {
                settings: {
                  enabled: true,
                },
              },
            },
          },
        } as any,
      },
    };
  }
}

class EmptyManifestPlugin extends Plugin {
  get name() {
    return 'empty-manifest-plugin';
  }

  getFlowSchemaManifests() {
    return undefined;
  }
}

class FieldBindingManifestPlugin extends Plugin {
  get name() {
    return 'field-binding-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      fieldBindingContexts: [
        {
          name: 'provider-base-field',
        },
        {
          name: 'provider-form-field',
          inherits: ['provider-base-field'],
        },
      ],
      models: {
        ProviderBoundInputModel: {
          exposure: 'internal',
          stepParamsSchema: {
            type: 'object',
            additionalProperties: true,
          },
          skeleton: {
            uid: 'provider-bound-input-model',
            use: 'ProviderBoundInputModel',
          },
        } as any,
        ProviderFieldHostModel: {
          subModelSlots: {
            field: {
              type: 'object',
              fieldBindingContext: 'provider-form-field',
            },
          },
          skeleton: {
            uid: 'provider-field-host-model',
            use: 'ProviderFieldHostModel',
          },
        } as any,
      },
      fieldBindings: [
        {
          context: 'provider-base-field',
          use: 'ProviderBoundInputModel',
          interfaces: ['input'],
          isDefault: true,
          order: 10,
        },
      ],
    };
  }
}

class DisabledManifestPlugin extends Plugin {
  get name() {
    return 'disabled-manifest-plugin';
  }

  getFlowSchemaManifests(): FlowSchemaManifestContribution {
    return {
      models: {
        DisabledProviderModel: {
          stepParamsSchema: {
            type: 'object',
            properties: {
              settings: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                  },
                },
              },
            },
          },
        } as any,
      },
    };
  }
}

const officialPublicBlockUses = [
  'TableBlockModel',
  'DetailsBlockModel',
  'FilterFormBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'GridCardBlockModel',
  'IframeBlockModel',
  'ListBlockModel',
  'MarkdownBlockModel',
  'CommentsBlockModel',
  'MapBlockModel',
  'ChartBlockModel',
  'JSBlockModel',
  'ActionPanelBlockModel',
  'ReferenceBlockModel',
];

const publicTreeRootBlockUses = officialPublicBlockUses;

const ajv = new Ajv({ allErrors: true, strict: false });

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

const expectStepParamsExampleMatchesDocument = (document: any, key: 'minimalExample' | 'skeleton') => {
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

describe('flow schema manifest provider', () => {
  let app: MockServer;
  let agent: any;

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: [
        'flow-engine',
        RecordManifestPlugin,
        ArrayManifestPlugin,
        FirstMergedManifestPlugin,
        SecondMergedManifestPlugin,
        EmptyManifestPlugin,
        FieldBindingManifestPlugin,
        [DisabledManifestPlugin, { name: 'disabled-manifest-plugin', enabled: false }],
      ],
    });

    (app.pm.get('flow-engine') as any)?.registerFlowSchemas({
      models: {
        ProviderActionHostModel,
      },
    });

    agent = app.agent();
  });

  afterEach(async () => {
    if (app) {
      await app.destroy();
      app = null as any;
    }
  });

  it('should collect plugin provider manifests and apply defaults', async () => {
    const single = await agent.get('/flowModels:schema').query({
      use: 'ProviderManifestModel',
    });

    expect(single.status).toBe(200);
    expect(single.body?.data?.coverage).toMatchObject({
      source: 'third-party',
      strict: true,
      status: 'manual',
    });
    expect(single.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        settings: {
          required: ['title'],
          additionalProperties: false,
        },
      },
    });

    const flowEnginePlugin = app.pm.get('flow-engine') as any;
    expect(flowEnginePlugin.flowSchemaService.registry.getAction('providerRecordAction')).toEqual(
      expect.objectContaining({
        name: 'providerRecordAction',
        coverage: expect.objectContaining({
          source: 'third-party',
          strict: true,
          status: 'manual',
        }),
        schema: expect.objectContaining({
          required: ['enabled'],
          additionalProperties: false,
        }),
      }),
    );

    const host = await agent.get('/flowModels:schema').query({
      use: 'ProviderActionHostModel',
    });

    expect(host.status).toBe(200);
    expect(host.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        settings: {
          properties: {
            toggle: {
              required: ['enabled'],
              additionalProperties: false,
            },
          },
        },
      },
    });
  });

  it('should normalize array manifests and keep builtin flow-engine manifests discoverable', async () => {
    const arrayModel = await agent.get('/flowModels:schema').query({
      use: 'ProviderArrayModel',
    });

    expect(arrayModel.status).toBe(200);
    expect(arrayModel.body?.data?.coverage).toMatchObject({
      source: 'plugin',
      strict: false,
      status: 'manual',
    });
    expect(arrayModel.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        settings: {
          required: ['mode'],
          additionalProperties: false,
        },
      },
    });

    const flowEnginePlugin = app.pm.get('flow-engine') as any;
    expect(flowEnginePlugin.flowSchemaService.registry.getAction('providerArrayAction')).toEqual(
      expect.objectContaining({
        coverage: expect.objectContaining({
          source: 'plugin',
          strict: false,
          status: 'manual',
        }),
        schema: expect.objectContaining({
          required: ['mode'],
          additionalProperties: false,
        }),
      }),
    );

    const builtin = await agent.get('/flowModels:schema').query({
      use: 'PageModel',
    });

    expect(builtin.status).toBe(200);
    expect(builtin.body?.data?.coverage).toMatchObject({
      source: 'official',
      strict: true,
      status: 'manual',
    });
    expect(builtin.body?.data?.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: expect.any(String),
          path: expect.any(String),
        }),
      ]),
    );

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['PageModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data).not.toHaveProperty('generatedAt');
    expect(bundle.body?.data).not.toHaveProperty('summary');
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'PageModel',
          skeleton: expect.objectContaining({
            use: 'PageModel',
          }),
        }),
      ]),
    );
    const pageItem = (bundle.body?.data?.items || []).find((item) => item.use === 'PageModel');
    for (const item of bundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key))).toEqual(
        [],
      );
      expect(item).not.toHaveProperty('dynamicHints');
      expect(item).not.toHaveProperty('coverage');
      expect(item).not.toHaveProperty('hash');
      expect(item).not.toHaveProperty('source');
    }
    expect(pageItem?.subModelCatalog).toMatchObject({
      tabs: {
        type: 'array',
        candidates: expect.arrayContaining([
          expect.objectContaining({ use: 'RootPageTabModel' }),
          expect.objectContaining({ use: 'PageTabModel' }),
        ]),
      },
    });
  });

  it('should expose lightweight schema bundles for plugin contributions', async () => {
    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['ProviderManifestModel', 'ProviderArrayModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data).not.toHaveProperty('generatedAt');
    expect(bundle.body?.data).not.toHaveProperty('summary');
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ use: 'ProviderManifestModel' }),
        expect.objectContaining({ use: 'ProviderArrayModel' }),
      ]),
    );
    for (const item of bundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key))).toEqual(
        [],
      );
    }
  });

  it('should preserve existing merge semantics across plugin providers', async () => {
    const res = await agent.get('/flowModels:schema').query({
      use: 'MergedProviderModel',
    });

    expect(res.status).toBe(200);
    expect(res.body?.data?.jsonSchema?.properties?.stepParams).toMatchObject({
      properties: {
        settings: {
          properties: {
            enabled: {
              type: 'boolean',
            },
          },
          additionalProperties: false,
        },
      },
    });
    expect(res.body?.data?.minimalExample).toMatchObject({
      use: 'MergedProviderModel',
      stepParams: {
        settings: {
          enabled: true,
        },
      },
    });
  });

  it('should collect field binding contexts and bindings from plugin providers', async () => {
    const flowEnginePlugin = app.pm.get('flow-engine') as any;
    expect(
      flowEnginePlugin.flowSchemaService.registry
        .resolveFieldBindingCandidates('provider-form-field', { interface: 'input' })
        .map((item) => item.use),
    ).toEqual(['ProviderBoundInputModel']);

    const bundle = await agent.post('/flowModels:schemaBundle').send({
      uses: ['ProviderFieldHostModel'],
    });

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          use: 'ProviderFieldHostModel',
          subModelCatalog: {
            field: {
              type: 'object',
              candidates: [
                expect.objectContaining({
                  use: 'ProviderBoundInputModel',
                  compatibility: expect.objectContaining({
                    context: 'provider-base-field',
                    interfaces: ['input'],
                    isDefault: true,
                    order: 10,
                    inheritParentFieldBinding: true,
                  }),
                }),
              ],
            },
          },
        }),
      ]),
    );
  });

  it('should skip disabled or empty providers during collection', async () => {
    const disabled = await agent.get('/flowModels:schema').query({
      use: 'DisabledProviderModel',
    });

    expect(disabled.status).toBe(404);

    const batch = await agent.post('/flowModels:schemas').send({
      uses: [],
    });

    expect(batch.status).toBe(200);
    expect(batch.body?.data).toEqual([]);
  });

  it('should collect manifests from official plugin providers', async () => {
    await app.destroy();
    app = null as any;

    const officialApp = await createMockServer({
      registerActions: true,
      plugins: [
        'flow-engine',
        PluginActionBulkUpdateServer,
        PluginActionBulkEditServer,
        PluginActionDuplicateServer,
        PluginBlockWorkbenchServer,
        PluginBlockMarkdownServer,
        PluginBlockIframeServer,
        PluginBlockReferenceServer,
      ],
    });

    try {
      const officialAgent = officialApp.agent();

      const bundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: [
          'BulkUpdateActionModel',
          'BulkEditActionModel',
          'DuplicateActionModel',
          'JSBlockModel',
          'BlockGridModel',
          'ActionPanelBlockModel',
          'ReferenceBlockModel',
          'MarkdownBlockModel',
          'IframeBlockModel',
        ],
      });

      expect(bundle.status).toBe(200);
      expect(bundle.body?.data).not.toHaveProperty('generatedAt');
      expect(bundle.body?.data).not.toHaveProperty('summary');
      expect(bundle.body?.data?.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ use: 'BulkUpdateActionModel' }),
          expect.objectContaining({ use: 'BulkEditActionModel' }),
          expect.objectContaining({ use: 'DuplicateActionModel' }),
          expect.objectContaining({ use: 'JSBlockModel' }),
          expect.objectContaining({ use: 'BlockGridModel' }),
          expect.objectContaining({ use: 'ActionPanelBlockModel' }),
          expect.objectContaining({ use: 'ReferenceBlockModel' }),
          expect.objectContaining({ use: 'MarkdownBlockModel' }),
          expect.objectContaining({ use: 'IframeBlockModel' }),
        ]),
      );
      for (const item of bundle.body?.data?.items || []) {
        expect(
          Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key)),
        ).toEqual([]);
      }

      const jsBlock = await officialAgent.get('/flowModels:schema').query({
        use: 'JSBlockModel',
      });
      expect(jsBlock.status).toBe(200);

      const bulkEditGrid = await officialAgent.get('/flowModels:schema').query({
        use: 'BulkEditBlockGridModel',
      });
      expect(bulkEditGrid.status).toBe(200);
      expectGridLayoutSchemaDocument(bulkEditGrid.body?.data);
      expect(bulkEditGrid.body?.data?.commonPatterns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: 'Two rows with 2 + 3 columns',
          }),
        ]),
      );

      const bulkEditGridBatch = await officialAgent.post('/flowModels:schemas').send({
        uses: ['BulkEditBlockGridModel'],
      });
      expect(bulkEditGridBatch.status).toBe(200);
      expect((bulkEditGridBatch.body?.data || []).map((item) => item.use)).toEqual(['BulkEditBlockGridModel']);
      expectGridLayoutSchemaDocument(bulkEditGridBatch.body?.data?.[0]);

      const actionPanel = await officialAgent.get('/flowModels:schema').query({
        use: 'ActionPanelBlockModel',
      });
      expect(actionPanel.status).toBe(200);

      const reference = await officialAgent.get('/flowModels:schema').query({
        use: 'ReferenceBlockModel',
      });
      expect(reference.status).toBe(200);

      const blockGridItem = (bundle.body?.data?.items || []).find((item) => item.use === 'BlockGridModel');
      expect(blockGridItem?.subModelCatalog).toMatchObject({
        items: {
          type: 'array',
          candidates: expect.arrayContaining([
            expect.objectContaining({ use: 'TableBlockModel' }),
            expect.objectContaining({ use: 'JSBlockModel' }),
            expect.objectContaining({ use: 'ActionPanelBlockModel' }),
            expect.objectContaining({ use: 'MarkdownBlockModel' }),
            expect.objectContaining({ use: 'IframeBlockModel' }),
            expect.objectContaining({ use: 'ReferenceBlockModel' }),
          ]),
        },
      });
    } finally {
      await officialApp.destroy();
    }
  });

  it('should support every official public block through explicit discovery APIs', async () => {
    await app.destroy();
    app = null as any;

    const officialApp = await createMockServer({
      registerActions: true,
      plugins: [
        'flow-engine',
        PluginBlockGridCardServer,
        PluginBlockIframeServer,
        PluginBlockListServer,
        PluginBlockMarkdownServer,
        PluginBlockWorkbenchServer,
        PluginCommentServer,
        PluginDataVisualizationServer,
        PluginMapServer,
        PluginBlockReferenceServer,
      ],
    });

    try {
      const officialAgent = officialApp.agent();

      for (const use of officialPublicBlockUses) {
        const single = await officialAgent.get('/flowModels:schema').query({ use });
        expect(single.status).toBe(200);
        expect(single.body?.data?.use).toBe(use);
      }

      const schemas = await officialAgent.post('/flowModels:schemas').send({
        uses: officialPublicBlockUses,
      });
      expect(schemas.status).toBe(200);
      expect((schemas.body?.data || []).map((item) => item.use).sort()).toEqual([...officialPublicBlockUses].sort());

      const bundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: officialPublicBlockUses,
      });
      expect(bundle.status).toBe(200);
      expect((bundle.body?.data?.items || []).map((item) => item.use).sort()).toEqual(
        [...officialPublicBlockUses].sort(),
      );

      const blockGridBundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: ['BlockGridModel'],
      });
      expect(blockGridBundle.status).toBe(200);
      const blockGridItem = (blockGridBundle.body?.data?.items || []).find((item) => item.use === 'BlockGridModel');
      const blockCandidates = (blockGridItem?.subModelCatalog?.items?.candidates || []).map((item) => item.use);
      expect(blockCandidates).toEqual(expect.arrayContaining(publicTreeRootBlockUses));

      const pageBundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: ['PageModel'],
      });
      expect(pageBundle.status).toBe(200);
      const pageItem = (pageBundle.body?.data?.items || []).find((item) => item.use === 'PageModel');
      const tabCandidates = pageItem?.subModelCatalog?.tabs?.candidates || [];
      const nestedBlockCandidates = tabCandidates.flatMap(
        (tab) =>
          tab?.subModelCatalog?.grid?.candidates?.flatMap((grid) => grid?.subModelCatalog?.items?.candidates || []) ||
          [],
      );
      expect(nestedBlockCandidates.map((item) => item.use)).toEqual(expect.arrayContaining(publicTreeRootBlockUses));

      const listBlock = await officialAgent.get('/flowModels:schema').query({
        use: 'ListBlockModel',
      });
      expect(listBlock.status).toBe(200);
      expectCollectionResourceSettingsSchemaDocument(listBlock.body?.data, {
        keepLegacyResourceSettings2: true,
      });
      expect(listBlock.body?.data?.minimalExample?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expect(listBlock.body?.data?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expectStepParamsExampleMatchesDocument(listBlock.body?.data, 'minimalExample');
      expectStepParamsExampleMatchesDocument(listBlock.body?.data, 'skeleton');
      expect(listBlock.body?.data?.commonPatterns).toEqual(
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

      const gridCardBlock = await officialAgent.get('/flowModels:schema').query({
        use: 'GridCardBlockModel',
      });
      expect(gridCardBlock.status).toBe(200);
      expectCollectionResourceSettingsSchemaDocument(gridCardBlock.body?.data, {
        keepLegacyResourceSettings2: true,
      });
      expect(gridCardBlock.body?.data?.minimalExample?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expect(gridCardBlock.body?.data?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expectStepParamsExampleMatchesDocument(gridCardBlock.body?.data, 'minimalExample');
      expectStepParamsExampleMatchesDocument(gridCardBlock.body?.data, 'skeleton');
      expect(gridCardBlock.body?.data?.commonPatterns).toEqual(
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

      const collectionBundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: ['ListBlockModel', 'GridCardBlockModel'],
      });
      expect(collectionBundle.status).toBe(200);
      const listItem = (collectionBundle.body?.data?.items || []).find((item) => item.use === 'ListBlockModel');
      const gridCardItem = (collectionBundle.body?.data?.items || []).find((item) => item.use === 'GridCardBlockModel');
      expect(listItem?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
      expect(gridCardItem?.skeleton?.stepParams?.resourceSettings?.init).toMatchObject({
        dataSourceKey: 'main',
        collectionName: 'users',
      });
    } finally {
      await officialApp.destroy();
    }
  });

  it('should expose manifest bundles for additional official plugin packages', () => {
    expect(typeof PluginActionExportServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginActionImportServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginDataVisualizationServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginBlockGridCardServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginBlockListServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginBlockWorkbenchServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginCommentServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginMapServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginBlockReferenceServer.prototype.getFlowSchemaManifests).toBe('function');
  });
});
