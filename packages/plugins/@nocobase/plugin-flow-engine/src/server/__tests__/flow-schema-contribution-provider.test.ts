/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type FlowSchemaContribution, FlowModel } from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/server';
import { PluginActionBulkUpdateServer } from '../../../../plugin-action-bulk-update/src/server/plugin';
import { PluginBlockReferenceServer } from '../../../../plugin-ui-templates/src/server/plugin';
import { createFlowEngineTestApp, destroyTestApp, expectPublicSchemaDocument } from './test-utils';

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

class RecordContributionPlugin extends Plugin {
  get name() {
    return 'record-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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
        ProviderContributionModel: {
          title: 'Provider contribution model',
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
              uid: 'provider-contribution-model-1',
              use: 'ProviderContributionModel',
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

class ArrayContributionPlugin extends Plugin {
  get name() {
    return 'array-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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

class FirstMergedContributionPlugin extends Plugin {
  get name() {
    return 'first-merged-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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

class SecondMergedContributionPlugin extends Plugin {
  get name() {
    return 'second-merged-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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

class EmptyContributionPlugin extends Plugin {
  get name() {
    return 'empty-contribution-plugin';
  }

  getFlowSchemaContributions() {
    return undefined;
  }
}

class FieldBindingContributionPlugin extends Plugin {
  get name() {
    return 'field-binding-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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

class DisabledContributionPlugin extends Plugin {
  get name() {
    return 'disabled-contribution-plugin';
  }

  getFlowSchemaContributions(): FlowSchemaContribution {
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

describe('flow schema contribution provider', () => {
  let app: any;
  let agent: any;
  let flowEnginePlugin: any;

  const querySchema = (use: string) => agent.get('/flowModels:schema').query({ use });
  const querySchemaBundle = (uses: string[]) => agent.post('/flowModels:schemaBundle').send({ uses });
  const querySchemas = (uses: string[]) => agent.post('/flowModels:schemas').send({ uses });

  const createOfficialProviderApp = () =>
    createFlowEngineTestApp({
      plugins: ['flow-engine', PluginActionBulkUpdateServer, PluginBlockReferenceServer],
    });

  beforeEach(async () => {
    ({ app, agent, flowEnginePlugin } = await createFlowEngineTestApp({
      plugins: [
        'flow-engine',
        RecordContributionPlugin,
        ArrayContributionPlugin,
        FirstMergedContributionPlugin,
        SecondMergedContributionPlugin,
        EmptyContributionPlugin,
        FieldBindingContributionPlugin,
        [DisabledContributionPlugin, { name: 'disabled-contribution-plugin', enabled: false }],
      ],
      registerSchemas(plugin) {
        plugin.registerFlowSchemas({
          models: {
            ProviderActionHostModel,
          },
        });
      },
    }));
  });

  afterEach(async () => {
    await destroyTestApp(app);
    app = null;
    flowEnginePlugin = null;
  });

  it('should collect plugin provider contributions and apply defaults', async () => {
    const single = await querySchema('ProviderContributionModel');

    expect(single.status).toBe(200);
    expectPublicSchemaDocument(single.body?.data);
    expect(single.body?.data?.source).toBe('third-party');
    expect(single.body?.data?.minimalExample).toMatchObject({
      use: 'ProviderContributionModel',
    });

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

    const host = await querySchema('ProviderActionHostModel');
    expect(host.status).toBe(200);
    expect(host.body?.data?.use).toBe('ProviderActionHostModel');
  });

  it('should default direct registerFlowSchemas contributions to third-party source', async () => {
    flowEnginePlugin.registerFlowSchemas({
      actionContributions: [
        {
          name: 'directContributionAction',
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
      ],
      modelContributions: [
        {
          use: 'DirectContributionModel',
          strict: true,
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
        },
      ],
    });

    const schema = await querySchema('DirectContributionModel');

    expect(schema.status).toBe(200);
    expectPublicSchemaDocument(schema.body?.data);
    expect(schema.body?.data?.source).toBe('third-party');
    expect(flowEnginePlugin.flowSchemaService.registry.getAction('directContributionAction')).toEqual(
      expect.objectContaining({
        coverage: expect.objectContaining({
          source: 'third-party',
          status: 'manual',
        }),
      }),
    );
  });

  it('should normalize array contributions and keep builtin flow-engine contributions discoverable', async () => {
    const arrayModel = await querySchema('ProviderArrayModel');

    expect(arrayModel.status).toBe(200);
    expectPublicSchemaDocument(arrayModel.body?.data);
    expect(arrayModel.body?.data?.source).toBe('plugin');

    expect(flowEnginePlugin.flowSchemaService.registry.getAction('providerArrayAction')).toEqual(
      expect.objectContaining({
        coverage: expect.objectContaining({
          source: 'plugin',
          strict: false,
          status: 'manual',
        }),
      }),
    );

    const builtin = await querySchema('PageModel');
    expect(builtin.status).toBe(200);
    expectPublicSchemaDocument(builtin.body?.data);
    expect(builtin.body?.data?.source).toBe('official');
  });

  it('should expose lightweight schema bundles for plugin contributions', async () => {
    const bundle = await querySchemaBundle(['ProviderContributionModel', 'ProviderArrayModel']);

    expect(bundle.status).toBe(200);
    expect(bundle.body?.data?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ use: 'ProviderContributionModel' }),
        expect.objectContaining({ use: 'ProviderArrayModel' }),
      ]),
    );
    for (const item of bundle.body?.data?.items || []) {
      expect(Object.keys(item).filter((key) => !['use', 'title', 'subModelCatalog'].includes(key))).toEqual([]);
      expect(item).not.toHaveProperty('skeleton');
    }
  });

  it('should preserve existing merge semantics across plugin providers', async () => {
    const res = await querySchema('MergedProviderModel');

    expect(res.status).toBe(200);
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
    expect(
      flowEnginePlugin.flowSchemaService.registry
        .resolveFieldBindingCandidates('provider-form-field', { interface: 'input' })
        .map((item) => item.use),
    ).toEqual(['ProviderBoundInputModel']);

    const bundle = await querySchemaBundle(['ProviderFieldHostModel']);

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
    const disabled = await querySchema('DisabledProviderModel');
    expect(disabled.status).toBe(404);

    const batch = await querySchemas([]);
    expect(batch.status).toBe(200);
    expect(batch.body?.data).toEqual([]);
  });

  it('should collect contributions from representative official plugin providers', async () => {
    await destroyTestApp(app);
    app = null;
    flowEnginePlugin = null;

    const { app: officialApp, agent: officialAgent } = await createOfficialProviderApp();

    try {
      const bundle = await officialAgent.post('/flowModels:schemaBundle').send({
        uses: ['BulkUpdateActionModel', 'ReferenceBlockModel'],
      });
      expect(bundle.status).toBe(200);
      expect(bundle.body?.data?.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ use: 'BulkUpdateActionModel' }),
          expect.objectContaining({ use: 'ReferenceBlockModel' }),
        ]),
      );

      const reference = await officialAgent.get('/flowModels:schema').query({
        use: 'ReferenceBlockModel',
      });
      expect(reference.status).toBe(200);
      expect(reference.body?.data?.use).toBe('ReferenceBlockModel');
    } finally {
      await destroyTestApp(officialApp);
    }
  });
});
