/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { FlowSchemaRegistry } from '../FlowSchemaRegistry';
import { FlowModel } from '../models';

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

describe('FlowSchemaRegistry', () => {
  it('should infer JSON schema from static uiSchema', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerAction({
      name: 'schemaRegistryStaticAction',
      handler: () => null,
      uiSchema: {
        title: {
          type: 'string',
          required: true,
          'x-validator': {
            minLength: 2,
          },
        } as any,
        mode: {
          enum: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
        } as any,
      },
    });

    expect(registry.getAction('schemaRegistryStaticAction')?.schema).toMatchObject({
      type: 'object',
      properties: {
        title: {
          type: 'string',
          minLength: 2,
        },
        mode: {
          enum: ['a', 'b'],
        },
      },
      required: ['title'],
      additionalProperties: false,
    });
    expect(registry.getAction('schemaRegistryStaticAction')?.coverage.status).toBe('auto');
  });

  it('should apply action patch and step override with correct priority', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerAction({
      name: 'schemaRegistryPatchedAction',
      handler: () => null,
      uiSchema: {
        enabled: {
          type: 'boolean',
        } as any,
      },
      paramsSchemaPatch: {
        properties: {
          label: {
            type: 'string',
          },
        },
        required: ['label'],
      },
    });

    const patched = registry.resolveStepParamsSchema(
      {
        use: 'schemaRegistryPatchedAction',
      },
      'SchemaRegistryPatchedModel.settings.save',
    );

    expect(patched.schema).toMatchObject({
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
        },
        label: {
          type: 'string',
        },
      },
      required: ['label'],
      additionalProperties: false,
    });
    expect(patched.coverage).toBe('mixed');

    const overridden = registry.resolveStepParamsSchema(
      {
        use: 'schemaRegistryPatchedAction',
        paramsSchemaOverride: {
          type: 'object',
          properties: {
            only: {
              type: 'string',
            },
          },
          required: ['only'],
          additionalProperties: false,
        },
      },
      'SchemaRegistryPatchedModel.settings.save',
    );

    expect(overridden.schema).toEqual({
      type: 'object',
      properties: {
        only: {
          type: 'string',
        },
      },
      required: ['only'],
      additionalProperties: false,
    });
    expect(overridden.coverage).toBe('manual');
  });

  it('should build document schema, aggregate flow hints, and infer sub-model slots', () => {
    class SchemaRegistryChildModel extends FlowModel {}
    class SchemaRegistryParentModel extends FlowModel {}

    SchemaRegistryChildModel.define({
      label: 'Schema child',
    });
    SchemaRegistryParentModel.define({
      label: 'Schema parent',
      createModelOptions: {
        use: 'SchemaRegistryParentModel',
        subModels: {
          header: {
            use: 'SchemaRegistryChildModel',
          },
          items: [
            {
              use: 'SchemaRegistryChildModel',
            },
          ],
        },
      },
    });
    SchemaRegistryParentModel.registerFlow({
      key: 'settings',
      steps: {
        rename: {
          use: 'schemaRegistryRenameAction',
        },
        dynamic: {
          use: 'schemaRegistryDynamicAction',
        },
      },
    });

    const registry = new FlowSchemaRegistry();
    registry.registerActions({
      schemaRegistryRenameAction: {
        name: 'schemaRegistryRenameAction',
        handler: () => null,
        paramsSchema: {
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
      schemaRegistryDynamicAction: {
        name: 'schemaRegistryDynamicAction',
        handler: () => null,
        uiSchema: (() => ({
          enabled: {
            type: 'boolean',
          },
        })) as any,
      },
    });
    registry.registerModels({
      SchemaRegistryChildModel,
      SchemaRegistryParentModel,
    });

    const doc = registry.getModelDocument('SchemaRegistryParentModel');

    expect((doc.jsonSchema.properties?.subModels as any)?.properties?.header).toMatchObject({
      type: 'object',
      properties: {
        use: {
          const: 'SchemaRegistryChildModel',
        },
      },
    });
    expect((doc.jsonSchema.properties?.subModels as any)?.properties?.items).toMatchObject({
      type: 'array',
    });
    expect((doc.jsonSchema.properties?.stepParams as any)?.properties?.settings?.properties?.rename).toMatchObject({
      properties: {
        title: {
          type: 'string',
        },
      },
      required: ['title'],
      additionalProperties: false,
    });
    expect(doc.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'manual-schema-required',
          path: 'SchemaRegistryParentModel.subModels.header',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              slotKey: 'header',
              type: 'object',
              allowedUses: ['SchemaRegistryChildModel'],
            }),
          }),
        }),
        expect.objectContaining({
          kind: 'manual-schema-required',
          path: 'SchemaRegistryParentModel.subModels.items',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              slotKey: 'items',
              type: 'array',
              allowedUses: ['SchemaRegistryChildModel'],
            }),
          }),
        }),
        expect.objectContaining({
          kind: 'dynamic-ui-schema',
          path: 'actions.schemaRegistryDynamicAction',
          'x-flow': expect.objectContaining({
            unresolvedReason: 'function-ui-schema',
          }),
        }),
      ]),
    );
    expect(doc.coverage.status).toBe('mixed');
  });

  it('should emit dynamic child hints for function-based model metadata', () => {
    class SchemaRegistryDynamicModel extends FlowModel {}

    SchemaRegistryDynamicModel.define({
      label: 'Schema dynamic',
      children: (async () => []) as any,
      createModelOptions: (() => ({
        use: 'SchemaRegistryDynamicModel',
      })) as any,
    });

    const registry = new FlowSchemaRegistry();
    registry.registerModels({
      SchemaRegistryDynamicModel,
    });

    const doc = registry.getModelDocument('SchemaRegistryDynamicModel');

    expect(doc.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'dynamic-children',
          path: 'SchemaRegistryDynamicModel.meta.children',
        }),
        expect.objectContaining({
          kind: 'dynamic-children',
          path: 'SchemaRegistryDynamicModel.meta.createModelOptions',
        }),
      ]),
    );
  });

  it('should preserve nested grid layout step params schema in model documents', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryGridModel',
      stepParamsSchema: {
        type: 'object',
        properties: {
          gridSettings: {
            type: 'object',
            properties: {
              grid: {
                type: 'object',
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
                additionalProperties: false,
              },
            },
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    });

    const doc = registry.getModelDocument('SchemaRegistryGridModel');

    expectGridLayoutSchemaDocument(doc);
  });

  it('should build bundle-friendly documents from pure data manifests', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerInventory(
      {
        publicModels: ['SchemaRegistryManifestModel', 'SchemaRegistryMissingModel'],
        publicActions: ['schemaRegistryManifestAction', 'schemaRegistryMissingAction'],
      },
      'official',
    );

    registry.registerActionManifest({
      name: 'schemaRegistryManifestAction',
      title: 'Manifest action',
      paramsSchema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
      docs: {
        minimalExample: {
          enabled: true,
        },
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryManifestModel',
      title: 'Manifest model',
      stepParamsSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
              },
              toggle: {
                type: 'object',
                properties: {
                  enabled: {
                    type: 'boolean',
                  },
                },
                additionalProperties: false,
              },
            },
            required: ['title'],
            additionalProperties: false,
          },
        },
        additionalProperties: true,
      },
      subModelSlots: {
        body: {
          type: 'array',
          uses: ['SchemaRegistryChildModel'],
          schema: {
            type: 'object',
            required: ['uid', 'use'],
            properties: {
              uid: { type: 'string' },
              use: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
      },
      docs: {
        minimalExample: {
          uid: 'manifest-model-1',
          use: 'SchemaRegistryManifestModel',
          stepParams: {
            settings: {
              title: 'Manifest model',
            },
          },
        },
        commonPatterns: [
          {
            title: 'Minimal manifest model',
            snippet: {
              stepParams: {
                settings: {
                  title: 'Manifest model',
                },
              },
            },
          },
        ],
        antiPatterns: [
          {
            title: 'Missing title',
          },
        ],
        dynamicHints: [
          {
            kind: 'dynamic-children',
            path: 'SchemaRegistryManifestModel.subModels.body',
            message: 'body slot is curated manually.',
            'x-flow': {
              slotRules: {
                slotKey: 'body',
                type: 'array',
                allowedUses: ['SchemaRegistryChildModel'],
              },
            },
          },
        ],
      },
    });

    const doc = registry.getModelDocument('SchemaRegistryManifestModel');
    const bundle = registry.getSchemaBundle(['SchemaRegistryManifestModel']);
    const summary = registry.getCoverageSummary();

    expect(doc.minimalExample).toMatchObject({
      use: 'SchemaRegistryManifestModel',
    });
    expect(doc.skeleton).toMatchObject({
      uid: 'todo-uid',
      use: 'SchemaRegistryManifestModel',
    });
    expect(doc.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Minimal manifest model',
        }),
      ]),
    );
    expect(doc.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'SchemaRegistryManifestModel.subModels.body',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              allowedUses: ['SchemaRegistryChildModel'],
            }),
          }),
        }),
      ]),
    );
    expect(summary.registeredModels).toBe(1);
    expect(summary.registeredActions).toBe(1);
    expect(summary.publicOfficialModelsTotal).toBe(2);
    expect(summary.publicOfficialModelsCovered).toBe(1);
    expect(summary.publicOfficialStrictModels).toBe(0);
    expect(summary.publicOfficialUnresolvedModels).toBe(0);
    expect(summary.missingModelUses).toEqual(['SchemaRegistryMissingModel']);
    expect(summary.missingActionNames).toEqual(['schemaRegistryMissingAction']);
    expect(bundle).not.toHaveProperty('generatedAt');
    expect(bundle).not.toHaveProperty('summary');
    expect(bundle.items[0]).toMatchObject({
      use: 'SchemaRegistryManifestModel',
      skeleton: expect.objectContaining({
        use: 'SchemaRegistryManifestModel',
      }),
      subModelCatalog: {
        body: expect.objectContaining({
          type: 'array',
          candidates: [expect.objectContaining({ use: 'SchemaRegistryChildModel' })],
        }),
      },
    });
    expect(
      Object.keys(bundle.items[0] || {}).filter(
        (key) => !['use', 'title', 'skeleton', 'subModelCatalog'].includes(key),
      ),
    ).toEqual([]);
  });

  it('should truncate recursive ancestor snapshots in model documents', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryLoopRootModel',
      subModelSlots: {
        actions: {
          type: 'array',
          uses: ['SchemaRegistryLoopActionModel'],
        },
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryLoopActionModel',
      subModelSlots: {
        page: {
          type: 'object',
          use: 'SchemaRegistryLoopPageModel',
        },
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryLoopPageModel',
      subModelSlots: {
        tabs: {
          type: 'array',
          uses: ['SchemaRegistryLoopTabModel'],
        },
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryLoopTabModel',
      subModelSlots: {
        grid: {
          type: 'object',
          use: 'SchemaRegistryLoopGridModel',
        },
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryLoopGridModel',
      subModelSlots: {
        items: {
          type: 'array',
          uses: ['SchemaRegistryLoopRootModel'],
        },
      },
    });

    const doc = registry.getModelDocument('SchemaRegistryLoopRootModel');
    const rootSubModels = (doc.jsonSchema.properties?.subModels as any)?.properties;
    const actionNode = rootSubModels?.actions?.items;
    const actionSubModels = actionNode?.properties?.subModels?.properties;
    const pageNode = actionSubModels?.page;
    const pageSubModels = pageNode?.properties?.subModels?.properties;
    const tabNode = pageSubModels?.tabs?.items;
    const tabSubModels = tabNode?.properties?.subModels?.properties;
    const gridNode = tabSubModels?.grid;
    const gridSubModels = gridNode?.properties?.subModels?.properties;
    const recursiveRoot = gridSubModels?.items?.items;

    expect(recursiveRoot).toMatchObject({
      type: 'object',
      properties: {
        use: {
          const: 'SchemaRegistryLoopRootModel',
        },
        subModels: {
          type: 'object',
          additionalProperties: true,
        },
      },
    });
    expect((recursiveRoot?.properties?.subModels as any)?.properties).toBeUndefined();
  });

  it('should treat abstract models as non-queryable while allowing explicit internal concrete models', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryInternalBaseModel',
      exposure: 'internal',
      abstract: true,
      allowDirectUse: false,
      suggestedUses: ['SchemaRegistryPublicModel'],
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryInternalConcreteModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        properties: {
          enabled: {
            type: 'boolean',
          },
        },
        additionalProperties: true,
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryPublicModel',
      stepParamsSchema: {
        type: 'object',
        properties: {
          settings: {
            type: 'object',
            additionalProperties: true,
          },
        },
        additionalProperties: true,
      },
    });

    expect(registry.hasPublicModel('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.hasQueryableModel('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.hasPublicModel('SchemaRegistryPublicModel')).toBe(true);
    expect(registry.hasQueryableModel('SchemaRegistryInternalConcreteModel')).toBe(true);
    expect(registry.isDirectUseAllowed('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.isDirectUseAllowed('SchemaRegistryInternalConcreteModel')).toBe(true);
    expect(registry.getSuggestedUses('SchemaRegistryInternalBaseModel')).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.listModelUses({ publicOnly: true })).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.getCoverageSummary({ publicOnly: true }).registeredModels).toBe(1);
    expect(registry.getCoverageSummary({ publicOnly: true }).publicOfficialModelsTotal).toBe(0);
    expect(registry.getSchemaBundle().items).toEqual([]);
    expect(registry.getSchemaBundle(['SchemaRegistryInternalConcreteModel']).items.map((item) => item.use)).toEqual([
      'SchemaRegistryInternalConcreteModel',
    ]);
  });

  it('should resolve direct child schema patches by parent slot context', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryContextChildModel',
      stepParamsSchema: {
        type: 'object',
        properties: {
          shared: {
            type: 'string',
          },
        },
        additionalProperties: true,
      },
      source: 'official',
      strict: true,
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryParentAlphaModel',
      source: 'official',
      strict: true,
      subModelSlots: {
        body: {
          type: 'object',
          use: 'SchemaRegistryContextChildModel',
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
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryParentBetaModel',
      source: 'official',
      strict: true,
      subModelSlots: {
        body: {
          type: 'object',
          use: 'SchemaRegistryContextChildModel',
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
    });

    expect(
      registry.getModelDocument('SchemaRegistryContextChildModel').jsonSchema.properties?.stepParams,
    ).toMatchObject({
      properties: {
        shared: {
          type: 'string',
        },
      },
      additionalProperties: true,
    });

    expect(
      registry.resolveModelSchema('SchemaRegistryContextChildModel', [
        {
          parentUse: 'SchemaRegistryParentAlphaModel',
          slotKey: 'body',
          childUse: 'SchemaRegistryContextChildModel',
        },
      ]).stepParamsSchema,
    ).toMatchObject({
      properties: {
        shared: {
          type: 'string',
        },
        alpha: {
          type: 'string',
        },
      },
      required: ['alpha'],
      additionalProperties: false,
    });

    expect(
      (registry.getModelDocument('SchemaRegistryParentAlphaModel').jsonSchema.properties?.subModels as any)?.properties
        ?.body?.properties?.stepParams,
    ).toMatchObject({
      properties: {
        alpha: {
          type: 'string',
        },
      },
      required: ['alpha'],
      additionalProperties: false,
    });

    expect(
      (registry.getModelDocument('SchemaRegistryParentBetaModel').jsonSchema.properties?.subModels as any)?.properties
        ?.body?.properties?.stepParams,
    ).toMatchObject({
      properties: {
        beta: {
          type: 'number',
        },
      },
      required: ['beta'],
      additionalProperties: false,
    });

    const bundle = registry.getSchemaBundle(['SchemaRegistryParentAlphaModel', 'SchemaRegistryParentBetaModel']);
    const alphaItem = bundle.items.find((item) => item.use === 'SchemaRegistryParentAlphaModel');
    const betaItem = bundle.items.find((item) => item.use === 'SchemaRegistryParentBetaModel');

    expect(alphaItem?.subModelCatalog?.body?.candidates?.[0]?.skeleton?.stepParams).toMatchObject({
      alpha: '',
    });
    expect(betaItem?.subModelCatalog?.body?.candidates?.[0]?.skeleton?.stepParams).toMatchObject({
      beta: 0,
    });
  });

  it('should apply ancestor descendant patches before direct child patches', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryDescLeafModel',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      source: 'official',
      strict: true,
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryDescParentModel',
      source: 'official',
      strict: true,
      subModelSlots: {
        section: {
          type: 'object',
          use: 'SchemaRegistryDescBridgeModel',
          childSchemaPatch: {
            subModelSlots: {
              leaf: {
                type: 'object',
                use: 'SchemaRegistryDescLeafModel',
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
                  use: 'SchemaRegistryDescLeafModel',
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
    });

    const resolved = registry.resolveModelSchema('SchemaRegistryDescLeafModel', [
      {
        parentUse: 'SchemaRegistryDescParentModel',
        slotKey: 'section',
        childUse: 'SchemaRegistryDescBridgeModel',
      },
      {
        parentUse: 'SchemaRegistryDescBridgeModel',
        slotKey: 'leaf',
        childUse: 'SchemaRegistryDescLeafModel',
      },
    ]);

    expect(resolved.stepParamsSchema).toMatchObject({
      properties: {
        ancestorOnly: {
          type: 'boolean',
        },
        directOnly: {
          type: 'string',
        },
        marker: {
          type: 'string',
        },
      },
      required: ['directOnly'],
      additionalProperties: false,
    });

    expect(
      (registry.getModelDocument('SchemaRegistryDescParentModel').jsonSchema.properties?.subModels as any)?.properties
        ?.section?.properties?.subModels?.properties?.leaf?.properties?.stepParams,
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

  it('should only use legacy slot schema as fallback when no child use can be resolved', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryLegacyChildModel',
      stepParamsSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
        },
        required: ['title'],
        additionalProperties: false,
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryLegacyParentModel',
      subModelSlots: {
        body: {
          type: 'object',
          use: 'SchemaRegistryLegacyChildModel',
          schema: {
            type: 'object',
            required: ['uid', 'use'],
            properties: {
              uid: { type: 'string' },
              use: { type: 'string' },
            },
            additionalProperties: true,
          },
        },
      },
    });

    expect(
      (registry.getModelDocument('SchemaRegistryLegacyParentModel').jsonSchema.properties?.subModels as any)?.properties
        ?.body,
    ).toMatchObject({
      anyOf: expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            use: {
              const: 'SchemaRegistryLegacyChildModel',
            },
            stepParams: expect.objectContaining({
              required: ['title'],
              additionalProperties: false,
            }),
          }),
        }),
        expect.objectContaining({
          properties: expect.objectContaining({
            use: {
              type: 'string',
            },
          }),
        }),
      ]),
    });
  });

  it('should expose anonymous child snapshot patches when slot use is unresolved', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryAnonymousGridModel',
      stepParamsSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
          },
        },
        required: ['title'],
        additionalProperties: false,
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryAnonymousParentModel',
      subModelSlots: {
        body: {
          type: 'object',
          childSchemaPatch: {
            stepParamsSchema: {
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
            subModelSlots: {
              grid: {
                type: 'object',
                use: 'SchemaRegistryAnonymousGridModel',
              },
            },
          },
        },
      },
    });

    expect(
      (registry.getModelDocument('SchemaRegistryAnonymousParentModel').jsonSchema.properties?.subModels as any)
        ?.properties?.body,
    ).toMatchObject({
      properties: {
        use: {
          type: 'string',
        },
        stepParams: {
          properties: {
            mode: {
              type: 'string',
              enum: ['compact', 'full'],
            },
          },
          required: ['mode'],
          additionalProperties: false,
        },
        subModels: {
          properties: {
            grid: {
              properties: {
                use: {
                  const: 'SchemaRegistryAnonymousGridModel',
                },
                stepParams: {
                  required: ['title'],
                  additionalProperties: false,
                },
              },
            },
          },
        },
      },
    });

    const bundle = registry.getSchemaBundle(['SchemaRegistryAnonymousParentModel']);
    expect(bundle.items[0]).toMatchObject({
      use: 'SchemaRegistryAnonymousParentModel',
      subModelCatalog: {
        body: {
          type: 'object',
          open: true,
          candidates: [],
        },
      },
    });
  });

  it('should expose recursive sub-model catalogs for internal descendants without promoting them to top-level items', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryBundleLeafModel',
      exposure: 'internal',
      allowDirectUse: false,
      stepParamsSchema: {
        type: 'object',
        properties: {
          label: {
            type: 'string',
          },
        },
        required: ['label'],
        additionalProperties: false,
      },
      skeleton: {
        uid: 'bundle-leaf-uid',
        use: 'SchemaRegistryBundleLeafModel',
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryBundleChildModel',
      exposure: 'internal',
      allowDirectUse: false,
      subModelSlots: {
        items: {
          type: 'array',
          uses: ['SchemaRegistryBundleLeafModel'],
        },
        dynamicZone: {
          type: 'array',
        },
      },
      skeleton: {
        uid: 'bundle-child-uid',
        use: 'SchemaRegistryBundleChildModel',
        subModels: {
          items: [],
          dynamicZone: [],
        },
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryBundleParentModel',
      subModelSlots: {
        body: {
          type: 'object',
          use: 'SchemaRegistryBundleChildModel',
        },
      },
      skeleton: {
        uid: 'bundle-parent-uid',
        use: 'SchemaRegistryBundleParentModel',
        subModels: {
          body: {
            use: 'SchemaRegistryBundleChildModel',
          },
        },
      },
    });

    const publicBundle = registry.getSchemaBundle();
    const bundle = registry.getSchemaBundle(['SchemaRegistryBundleParentModel']);
    const explicitInternalBundle = registry.getSchemaBundle(['SchemaRegistryBundleChildModel']);

    expect(publicBundle.items).toEqual([]);
    expect(explicitInternalBundle.items.map((item) => item.use)).toEqual(['SchemaRegistryBundleChildModel']);
    expect(bundle.items[0]).toMatchObject({
      use: 'SchemaRegistryBundleParentModel',
      subModelCatalog: {
        body: {
          type: 'object',
          candidates: [
            expect.objectContaining({
              use: 'SchemaRegistryBundleChildModel',
              subModelCatalog: {
                items: {
                  type: 'array',
                  candidates: [expect.objectContaining({ use: 'SchemaRegistryBundleLeafModel' })],
                },
                dynamicZone: {
                  type: 'array',
                  open: true,
                  candidates: [],
                },
              },
            }),
          ],
        },
      },
    });
  });

  it('should resolve runtime field binding candidates with compatibility metadata', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerFieldBindingContexts([
      { name: 'editable-field' },
      { name: 'display-field' },
      { name: 'filter-field' },
      { name: 'table-column-field', inherits: ['display-field'] },
      { name: 'form-item-field', inherits: ['editable-field'] },
    ]);

    registry.registerModelManifest({
      use: 'InputFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'input-field-uid',
        use: 'InputFieldModel',
      },
    });
    registry.registerModelManifest({
      use: 'DisplayTextFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'display-text-field-uid',
        use: 'DisplayTextFieldModel',
      },
    });
    registry.registerModelManifest({
      use: 'RecordSelectFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'record-select-field-uid',
        use: 'RecordSelectFieldModel',
      },
    });
    registry.registerModelManifest({
      use: 'CascadeSelectFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'cascade-select-field-uid',
        use: 'CascadeSelectFieldModel',
      },
    });
    registry.registerFieldBindings([
      {
        context: 'editable-field',
        use: 'InputFieldModel',
        interfaces: ['input'],
        isDefault: true,
      },
      {
        context: 'display-field',
        use: 'DisplayTextFieldModel',
        interfaces: ['input'],
        isDefault: true,
      },
      {
        context: 'editable-field',
        use: 'RecordSelectFieldModel',
        interfaces: ['m2o'],
        isDefault: true,
        conditions: {
          association: true,
        },
      },
      {
        context: 'editable-field',
        use: 'CascadeSelectFieldModel',
        interfaces: ['m2o'],
        isDefault: true,
        order: 60,
        conditions: {
          association: true,
          targetCollectionTemplateIn: ['tree'],
        },
      },
    ]);

    registry.registerModelManifest({
      use: 'SchemaRegistryFieldHostModel',
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'form-item-field',
        },
      },
      skeleton: {
        uid: 'field-host-uid',
        use: 'SchemaRegistryFieldHostModel',
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryDisplayFieldHostModel',
      subModelSlots: {
        field: {
          type: 'object',
          fieldBindingContext: 'table-column-field',
        },
      },
      skeleton: {
        uid: 'display-field-host-uid',
        use: 'SchemaRegistryDisplayFieldHostModel',
      },
    });

    expect(
      registry.resolveFieldBindingCandidates('form-item-field', { interface: 'input' }).map((item) => item.use),
    ).toEqual(['InputFieldModel']);
    expect(
      registry
        .resolveFieldBindingCandidates('form-item-field', {
          interface: 'm2o',
          association: true,
          targetCollectionTemplate: 'tree',
        })
        .map((item) => item.use),
    ).toEqual(['CascadeSelectFieldModel', 'RecordSelectFieldModel']);

    const bundle = registry.getSchemaBundle(['SchemaRegistryFieldHostModel', 'SchemaRegistryDisplayFieldHostModel']);
    const formItem = bundle.items.find((item) => item.use === 'SchemaRegistryFieldHostModel');
    const tableItem = bundle.items.find((item) => item.use === 'SchemaRegistryDisplayFieldHostModel');

    expect(formItem?.subModelCatalog).toMatchObject({
      field: {
        type: 'object',
        candidates: expect.arrayContaining([
          expect.objectContaining({
            use: 'InputFieldModel',
            compatibility: expect.objectContaining({
              context: 'editable-field',
              interfaces: ['input'],
              isDefault: true,
              inheritParentFieldBinding: true,
            }),
          }),
          expect.objectContaining({
            use: 'RecordSelectFieldModel',
            compatibility: expect.objectContaining({
              context: 'editable-field',
              interfaces: ['m2o'],
              association: true,
              isDefault: true,
            }),
          }),
        ]),
      },
    });
    expect(tableItem?.subModelCatalog).toMatchObject({
      field: {
        type: 'object',
        candidates: [expect.objectContaining({ use: 'DisplayTextFieldModel' })],
      },
    });

    const hostDoc = registry.getModelDocument('SchemaRegistryFieldHostModel');
    expect(hostDoc.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'SchemaRegistryFieldHostModel.subModels.field',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              allowedUses: expect.arrayContaining([
                'InputFieldModel',
                'RecordSelectFieldModel',
                'CascadeSelectFieldModel',
              ]),
            }),
          }),
        }),
      ]),
    );
    expect(JSON.stringify(bundle)).not.toContain('RuntimeFieldModel');
  });

  it('should match wildcard field binding interfaces without breaking exact matches', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerFieldBindingContexts([{ name: 'editable-field' }]);
    registry.registerModelManifest({
      use: 'SchemaRegistryExactFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'exact-field-uid',
        use: 'SchemaRegistryExactFieldModel',
      },
    });
    registry.registerModelManifest({
      use: 'SchemaRegistryWildcardFieldModel',
      exposure: 'internal',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'wildcard-field-uid',
        use: 'SchemaRegistryWildcardFieldModel',
      },
    });

    registry.registerFieldBindings([
      {
        context: 'editable-field',
        use: 'SchemaRegistryExactFieldModel',
        interfaces: ['input'],
        isDefault: true,
      },
      {
        context: 'editable-field',
        use: 'SchemaRegistryWildcardFieldModel',
        interfaces: ['*'],
      },
    ]);

    expect(
      registry.resolveFieldBindingCandidates('editable-field', { interface: 'uuid' }).map((item) => item.use),
    ).toEqual(['SchemaRegistryWildcardFieldModel']);
    expect(
      registry.resolveFieldBindingCandidates('editable-field', { interface: 'input' }).map((item) => item.use),
    ).toEqual(['SchemaRegistryExactFieldModel', 'SchemaRegistryWildcardFieldModel']);
  });

  it('should project required and minItems slot constraints into schema documents and bundle catalogs', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryRequiredChildModel',
      title: 'Required child',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      skeleton: {
        uid: 'required-child',
        use: 'SchemaRegistryRequiredChildModel',
      },
    });

    registry.registerModelManifest({
      use: 'SchemaRegistryRequiredParentModel',
      title: 'Required parent',
      subModelSlots: {
        page: {
          type: 'object',
          use: 'SchemaRegistryRequiredChildModel',
          required: true,
        },
        tabs: {
          type: 'array',
          uses: ['SchemaRegistryRequiredChildModel'],
          required: true,
          minItems: 1,
        },
      },
      skeleton: {
        uid: 'required-parent',
        use: 'SchemaRegistryRequiredParentModel',
        subModels: {
          page: {
            uid: 'required-parent-page',
            use: 'SchemaRegistryRequiredChildModel',
          },
          tabs: [
            {
              uid: 'required-parent-tab',
              use: 'SchemaRegistryRequiredChildModel',
            },
          ],
        },
      },
    });

    const doc = registry.getModelDocument('SchemaRegistryRequiredParentModel');
    const bundle = registry.getSchemaBundle(['SchemaRegistryRequiredParentModel']);
    const bundleItem = bundle.items[0];

    expect(doc.jsonSchema.properties?.subModels).toMatchObject({
      type: 'object',
      required: ['page', 'tabs'],
      properties: {
        page: {
          type: 'object',
          properties: {
            use: {
              const: 'SchemaRegistryRequiredChildModel',
            },
          },
        },
        tabs: {
          type: 'array',
          minItems: 1,
        },
      },
    });
    expect(bundleItem?.subModelCatalog).toMatchObject({
      page: {
        type: 'object',
        required: true,
        candidates: [expect.objectContaining({ use: 'SchemaRegistryRequiredChildModel' })],
      },
      tabs: {
        type: 'array',
        required: true,
        minItems: 1,
        candidates: [expect.objectContaining({ use: 'SchemaRegistryRequiredChildModel' })],
      },
    });
  });
});
