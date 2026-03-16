/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
import { PluginBlockIframeServer } from '../../../../plugin-block-iframe/src/server/plugin';
import { PluginBlockMarkdownServer } from '../../../../plugin-block-markdown/src/server/plugin';
import { flowSchemaManifestContribution as dataVisualizationFlowSchemaManifestContribution } from '../../../../plugin-data-visualization/src/server/flow-schema-manifests';
import { PluginDataVisualizationServer } from '../../../../plugin-data-visualization/src/server/plugin';

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
      inventory: {
        publicModels: ['ProviderManifestModel', 'ProviderMissingModel'],
        publicActions: ['providerRecordAction', 'providerMissingAction'],
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
      inventory: {
        publicModels: ['ProviderArrayModel', 'ProviderPluginMissingModel'],
        publicActions: ['providerArrayAction', 'providerPluginMissingAction'],
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
        PluginBlockMarkdownServer,
        PluginBlockIframeServer,
      ],
    });

    try {
      const officialAgent = officialApp.agent();

      const bundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: [
          'BulkUpdateActionModel',
          'BulkEditActionModel',
          'DuplicateActionModel',
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
          expect.objectContaining({ use: 'MarkdownBlockModel' }),
          expect.objectContaining({ use: 'IframeBlockModel' }),
        ]),
      );
      for (const item of bundle.body?.data?.items || []) {
        expect(
          Object.keys(item).filter((key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key)),
        ).toEqual([]);
      }
    } finally {
      await officialApp.destroy();
    }
  });

  it('should expose manifest bundles for additional official plugin packages', () => {
    expect(actionExportFlowSchemaManifestContribution.inventory?.publicModels).toContain('ExportActionModel');
    expect(actionImportFlowSchemaManifestContribution.inventory?.publicModels).toContain('ImportActionModel');
    expect(dataVisualizationFlowSchemaManifestContribution.inventory?.publicModels).toContain('ChartBlockModel');
    expect(typeof PluginActionExportServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginActionImportServer.prototype.getFlowSchemaManifests).toBe('function');
    expect(typeof PluginDataVisualizationServer.prototype.getFlowSchemaManifests).toBe('function');
  });
});
