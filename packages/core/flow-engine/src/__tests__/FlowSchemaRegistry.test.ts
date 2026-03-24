/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
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

const objectSchema = (
  properties: Record<string, any> = {},
  options: {
    required?: string[];
    additionalProperties?: boolean | Record<string, any>;
  } = {},
) => {
  const { required = [], additionalProperties = true } = options;

  return {
    type: 'object',
    properties,
    ...(required.length ? { required } : {}),
    additionalProperties,
  };
};

const modelContribution = (use: string, extra: Record<string, any> = {}) => ({
  use,
  stepParamsSchema: objectSchema(),
  ...extra,
});

const internalModelContribution = (use: string, uid: string, extra: Record<string, any> = {}) => ({
  use,
  exposure: 'internal',
  stepParamsSchema: objectSchema(),
  skeleton: {
    uid,
    use,
  },
  ...extra,
});

const objectSlot = (extra: Record<string, any> = {}) => ({
  type: 'object',
  ...extra,
});

const arraySlot = (extra: Record<string, any> = {}) => ({
  type: 'array',
  ...extra,
});

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

  it('should invalidate cached model documents after late action registration', () => {
    class SchemaRegistryLateActionHostModel extends FlowModel {}

    SchemaRegistryLateActionHostModel.define({
      label: 'Late action host',
    });
    SchemaRegistryLateActionHostModel.registerFlow({
      key: 'settings',
      steps: {
        save: {
          use: 'schemaRegistryLateAction',
        },
      },
    });

    const registry = new FlowSchemaRegistry();
    registry.registerModels({
      SchemaRegistryLateActionHostModel,
    });

    const before = registry.getModelDocument('SchemaRegistryLateActionHostModel');
    expect((before.jsonSchema.properties?.stepParams as any)?.properties?.settings?.properties?.save).toMatchObject({
      type: 'object',
      additionalProperties: true,
    });

    registry.registerActionContribution({
      name: 'schemaRegistryLateAction',
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
    });

    const after = registry.getModelDocument('SchemaRegistryLateActionHostModel');
    expect((after.jsonSchema.properties?.stepParams as any)?.properties?.settings?.properties?.save).toMatchObject({
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
        },
      },
      required: ['enabled'],
      additionalProperties: false,
    });
    expect(after.hash).not.toBe(before.hash);
  });

  it('should keep existing coverage metadata when later model contributions only add docs', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution({
      use: 'SchemaRegistryCoverageModel',
      stepParamsSchema: objectSchema(),
      source: 'official',
      strict: true,
    });

    registry.registerModelContribution({
      use: 'SchemaRegistryCoverageModel',
      docs: {
        description: 'docs only update',
      },
      source: 'plugin',
      strict: false,
    });

    expect(registry.getModel('SchemaRegistryCoverageModel')?.coverage).toEqual({
      status: 'manual',
      source: 'official',
      strict: true,
    });
  });

  it('should treat flowRegistrySchemaPatch-only contributions as schema coverage', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution({
      use: 'SchemaRegistryFlowRegistryPatchModel',
      flowRegistrySchemaPatch: {
        properties: {
          eventFlow: {
            type: 'object',
            properties: {
              enabled: {
                type: 'boolean',
              },
            },
            additionalProperties: false,
          },
        },
      },
      source: 'plugin',
      strict: true,
    });

    expect(registry.getModel('SchemaRegistryFlowRegistryPatchModel')?.coverage).toEqual({
      status: 'manual',
      source: 'plugin',
      strict: true,
    });
    expect(registry.buildStaticFlowRegistrySchema('SchemaRegistryFlowRegistryPatchModel')).toMatchObject({
      properties: {
        eventFlow: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
            },
          },
          additionalProperties: false,
        },
      },
    });
  });

  it('should resolve slot use expansions from inventory without model-specific hardcoding', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution(
      modelContribution('SchemaRegistryDeclaredSlotChildModel', {
        title: 'Declared child',
      }),
    );
    registry.registerModelContribution(
      modelContribution('SchemaRegistryExpandedSlotChildModel', {
        title: 'Expanded child',
      }),
    );
    registry.registerModelContribution(
      modelContribution('SchemaRegistrySlotExpansionParentModel', {
        subModelSlots: {
          items: arraySlot({
            uses: ['SchemaRegistryDeclaredSlotChildModel'],
          }),
        },
      }),
    );
    registry.registerInventory(
      {
        slotUseExpansions: [
          {
            parentUse: 'SchemaRegistrySlotExpansionParentModel',
            slotKey: 'items',
            uses: ['SchemaRegistryExpandedSlotChildModel', 'SchemaRegistryDeclaredSlotChildModel'],
          },
        ],
      },
      'official',
    );

    expect(
      registry.resolveSlotAllowedUses(
        'SchemaRegistrySlotExpansionParentModel',
        'items',
        registry.getModel('SchemaRegistrySlotExpansionParentModel')?.subModelSlots?.items,
      ),
    ).toEqual(['SchemaRegistryDeclaredSlotChildModel', 'SchemaRegistryExpandedSlotChildModel']);
    expect(registry.getSchemaBundle(['SchemaRegistrySlotExpansionParentModel']).items[0]).toMatchObject({
      use: 'SchemaRegistrySlotExpansionParentModel',
      subModelCatalog: {
        items: {
          type: 'array',
          candidates: [
            expect.objectContaining({ use: 'SchemaRegistryDeclaredSlotChildModel' }),
            expect.objectContaining({ use: 'SchemaRegistryExpandedSlotChildModel' }),
          ],
        },
      },
    });
  });

  it('should accept public tree roots in inventory contributions', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution(
      modelContribution('SchemaRegistryInventoryRootModel', {
        exposure: 'internal',
      }),
    );

    expect(() =>
      registry.registerInventory(
        {
          publicTreeRoots: ['SchemaRegistryInventoryRootModel'],
        },
        'official',
      ),
    ).not.toThrow();
    expect(registry.hasQueryableModel('SchemaRegistryInventoryRootModel')).toBe(true);
    expect(registry.listPublicTreeRoots()).toEqual(['SchemaRegistryInventoryRootModel']);
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

    registry.registerModelContribution({
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

  it('should build bundle-friendly documents from pure data contributions', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerActionContribution({
      name: 'schemaRegistryContributionAction',
      title: 'Contribution action',
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

    registry.registerModelContribution({
      use: 'SchemaRegistryContributionModel',
      title: 'Contribution model',
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
          uid: 'contribution-model-1',
          use: 'SchemaRegistryContributionModel',
          stepParams: {
            settings: {
              title: 'Contribution model',
            },
          },
        },
        commonPatterns: [
          {
            title: 'Minimal contribution model',
            snippet: {
              stepParams: {
                settings: {
                  title: 'Contribution model',
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
            path: 'SchemaRegistryContributionModel.subModels.body',
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

    const doc = registry.getModelDocument('SchemaRegistryContributionModel');
    const bundle = registry.getSchemaBundle(['SchemaRegistryContributionModel']);

    expect(doc.minimalExample).toMatchObject({
      use: 'SchemaRegistryContributionModel',
    });
    expect(doc.skeleton).toMatchObject({
      uid: 'todo-uid',
      use: 'SchemaRegistryContributionModel',
    });
    expect(doc.commonPatterns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: 'Minimal contribution model',
        }),
      ]),
    );
    expect(doc.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'SchemaRegistryContributionModel.subModels.body',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              allowedUses: ['SchemaRegistryChildModel'],
            }),
          }),
        }),
      ]),
    );
    expect(bundle).not.toHaveProperty('generatedAt');
    expect(bundle).not.toHaveProperty('summary');
    expect(bundle.items[0]).toMatchObject({
      use: 'SchemaRegistryContributionModel',
      subModelCatalog: {
        body: expect.objectContaining({
          type: 'array',
          candidates: [expect.objectContaining({ use: 'SchemaRegistryChildModel' })],
        }),
      },
    });
    expect(
      Object.keys(bundle.items[0] || {}).filter((key) => !['use', 'title', 'subModelCatalog'].includes(key)),
    ).toEqual([]);
  });

  it('should truncate recursive ancestor snapshots in model documents', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution({
      use: 'SchemaRegistryLoopRootModel',
      subModelSlots: {
        actions: {
          type: 'array',
          uses: ['SchemaRegistryLoopActionModel'],
        },
      },
    });
    registry.registerModelContribution({
      use: 'SchemaRegistryLoopActionModel',
      subModelSlots: {
        page: {
          type: 'object',
          use: 'SchemaRegistryLoopPageModel',
        },
      },
    });
    registry.registerModelContribution({
      use: 'SchemaRegistryLoopPageModel',
      subModelSlots: {
        tabs: {
          type: 'array',
          uses: ['SchemaRegistryLoopTabModel'],
        },
      },
    });
    registry.registerModelContribution({
      use: 'SchemaRegistryLoopTabModel',
      subModelSlots: {
        grid: {
          type: 'object',
          use: 'SchemaRegistryLoopGridModel',
        },
      },
    });
    registry.registerModelContribution({
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

    registry.registerModelContribution({
      use: 'SchemaRegistryInternalBaseModel',
      exposure: 'internal',
      abstract: true,
      allowDirectUse: false,
      suggestedUses: ['SchemaRegistryPublicModel'],
    });
    registry.registerModelContribution({
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
    registry.registerModelContribution({
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

    expect(registry.hasQueryableModel('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.hasQueryableModel('SchemaRegistryInternalConcreteModel')).toBe(true);
    expect(registry.isDirectUseAllowed('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.isDirectUseAllowed('SchemaRegistryInternalConcreteModel')).toBe(true);
    expect(registry.getSuggestedUses('SchemaRegistryInternalBaseModel')).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.listModelUses({ publicOnly: true })).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.getSchemaBundle().items).toEqual([]);
    expect(registry.getSchemaBundle(['SchemaRegistryInternalConcreteModel']).items.map((item) => item.use)).toEqual([
      'SchemaRegistryInternalConcreteModel',
    ]);
  });

  it('should resolve direct child schema patches by parent slot context', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    expect(alphaItem?.subModelCatalog?.body?.candidates?.map((item) => item.use)).toEqual([
      'SchemaRegistryContextChildModel',
    ]);
    expect(betaItem?.subModelCatalog?.body?.candidates?.map((item) => item.use)).toEqual([
      'SchemaRegistryContextChildModel',
    ]);
  });

  it('should apply ancestor descendant patches before direct child patches', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution({
      use: 'SchemaRegistryDescLeafModel',
      stepParamsSchema: {
        type: 'object',
        additionalProperties: true,
      },
      source: 'official',
      strict: true,
    });

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    registry.registerModelContribution({
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

    registry.registerModelContribution(
      internalModelContribution('SchemaRegistryBundleLeafModel', 'bundle-leaf-uid', {
        allowDirectUse: false,
        stepParamsSchema: objectSchema(
          {
            label: {
              type: 'string',
            },
          },
          { required: ['label'], additionalProperties: false },
        ),
      }),
    );

    registry.registerModelContribution(
      internalModelContribution('SchemaRegistryBundleChildModel', 'bundle-child-uid', {
        allowDirectUse: false,
        skeleton: {
          uid: 'bundle-child-uid',
          use: 'SchemaRegistryBundleChildModel',
          subModels: {
            items: [],
            dynamicZone: [],
          },
        },
        subModelSlots: {
          items: arraySlot({
            uses: ['SchemaRegistryBundleLeafModel'],
          }),
          dynamicZone: arraySlot(),
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryBundleParentModel', {
        skeleton: {
          uid: 'bundle-parent-uid',
          use: 'SchemaRegistryBundleParentModel',
          subModels: {
            body: {
              use: 'SchemaRegistryBundleChildModel',
            },
          },
        },
        subModelSlots: {
          body: objectSlot({
            use: 'SchemaRegistryBundleChildModel',
          }),
        },
      }),
    );

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

    registry.registerModelContribution(internalModelContribution('InputFieldModel', 'input-field-uid'));
    registry.registerModelContribution(internalModelContribution('DisplayTextFieldModel', 'display-text-field-uid'));
    registry.registerModelContribution(internalModelContribution('RecordSelectFieldModel', 'record-select-field-uid'));
    registry.registerModelContribution(
      internalModelContribution('CascadeSelectFieldModel', 'cascade-select-field-uid'),
    );
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

    registry.registerModelContribution(
      modelContribution('SchemaRegistryFieldHostModel', {
        skeleton: {
          uid: 'field-host-uid',
          use: 'SchemaRegistryFieldHostModel',
        },
        subModelSlots: {
          field: objectSlot({
            fieldBindingContext: 'form-item-field',
          }),
        },
      }),
    );
    registry.registerModelContribution(
      modelContribution('SchemaRegistryDisplayFieldHostModel', {
        skeleton: {
          uid: 'display-field-host-uid',
          use: 'SchemaRegistryDisplayFieldHostModel',
        },
        subModelSlots: {
          field: objectSlot({
            fieldBindingContext: 'table-column-field',
          }),
        },
      }),
    );

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
    registry.registerModelContribution(internalModelContribution('SchemaRegistryExactFieldModel', 'exact-field-uid'));
    registry.registerModelContribution(
      internalModelContribution('SchemaRegistryWildcardFieldModel', 'wildcard-field-uid'),
    );

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

    registry.registerModelContribution(
      modelContribution('SchemaRegistryRequiredChildModel', {
        title: 'Required child',
        skeleton: {
          uid: 'required-child',
          use: 'SchemaRegistryRequiredChildModel',
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryRequiredParentModel', {
        title: 'Required parent',
        subModelSlots: {
          page: objectSlot({
            use: 'SchemaRegistryRequiredChildModel',
            required: true,
          }),
          tabs: arraySlot({
            uses: ['SchemaRegistryRequiredChildModel'],
            required: true,
            minItems: 1,
          }),
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
      }),
    );

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

  it('should expose nested popup page slots in schema documents and bundle catalogs', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution(
      modelContribution('SchemaRegistryPopupGridModel', {
        skeleton: {
          uid: 'popup-grid',
          use: 'SchemaRegistryPopupGridModel',
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryPopupTabModel', {
        subModelSlots: {
          grid: objectSlot({
            use: 'SchemaRegistryPopupGridModel',
            required: true,
          }),
        },
        skeleton: {
          uid: 'popup-tab',
          use: 'SchemaRegistryPopupTabModel',
          subModels: {
            grid: {
              uid: 'popup-tab-grid',
              use: 'SchemaRegistryPopupGridModel',
            },
          },
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryPopupPageModel', {
        subModelSlots: {
          tabs: arraySlot({
            uses: ['SchemaRegistryPopupTabModel'],
            required: true,
            minItems: 1,
          }),
        },
        skeleton: {
          uid: 'popup-page',
          use: 'SchemaRegistryPopupPageModel',
          subModels: {
            tabs: [
              {
                uid: 'popup-page-tab',
                use: 'SchemaRegistryPopupTabModel',
                subModels: {
                  grid: {
                    uid: 'popup-page-tab-grid',
                    use: 'SchemaRegistryPopupGridModel',
                  },
                },
              },
            ],
          },
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryPopupActionModel', {
        stepParamsSchema: objectSchema({
          popupSettings: objectSchema(
            {
              openView: objectSchema(
                {
                  pageModelClass: {
                    type: 'string',
                    enum: ['SchemaRegistryPopupPageModel', 'SchemaRegistryRootPageModel'],
                  },
                },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: true },
          ),
        }),
        subModelSlots: {
          page: objectSlot({
            use: 'SchemaRegistryPopupPageModel',
          }),
        },
        skeleton: {
          uid: 'popup-action',
          use: 'SchemaRegistryPopupActionModel',
          stepParams: {
            popupSettings: {
              openView: {
                pageModelClass: 'SchemaRegistryPopupPageModel',
              },
            },
          },
          subModels: {
            page: {
              uid: 'popup-action-page',
              use: 'SchemaRegistryPopupPageModel',
              subModels: {
                tabs: [
                  {
                    uid: 'popup-action-page-tab',
                    use: 'SchemaRegistryPopupTabModel',
                    subModels: {
                      grid: {
                        uid: 'popup-action-page-grid',
                        use: 'SchemaRegistryPopupGridModel',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      }),
    );

    const doc = registry.getModelDocument('SchemaRegistryPopupActionModel');
    const bundle = registry.getSchemaBundle(['SchemaRegistryPopupActionModel']);
    const item = bundle.items[0];

    expect((doc.jsonSchema.properties?.subModels as any)?.properties?.page).toMatchObject({
      type: 'object',
      properties: {
        use: {
          const: 'SchemaRegistryPopupPageModel',
        },
      },
    });
    expect(
      (doc.jsonSchema.properties?.stepParams as any)?.properties?.popupSettings?.properties?.openView,
    ).toMatchObject({
      type: 'object',
      properties: {
        pageModelClass: {
          type: 'string',
          enum: ['SchemaRegistryPopupPageModel', 'SchemaRegistryRootPageModel'],
        },
      },
    });
    expect(doc.minimalExample).toMatchObject({
      use: 'SchemaRegistryPopupActionModel',
      subModels: {
        page: {
          use: 'SchemaRegistryPopupPageModel',
        },
      },
      stepParams: {
        popupSettings: {
          openView: {
            pageModelClass: 'SchemaRegistryPopupPageModel',
          },
        },
      },
    });
    expect(item?.subModelCatalog).toMatchObject({
      page: {
        type: 'object',
        candidates: [
          expect.objectContaining({
            use: 'SchemaRegistryPopupPageModel',
            subModelCatalog: {
              tabs: {
                type: 'array',
                required: true,
                minItems: 1,
                candidates: [
                  expect.objectContaining({
                    use: 'SchemaRegistryPopupTabModel',
                    subModelCatalog: {
                      grid: {
                        type: 'object',
                        required: true,
                        candidates: [expect.objectContaining({ use: 'SchemaRegistryPopupGridModel' })],
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

  it('should expose compact public documents without recursive schema or nested hints by default', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelContribution(
      modelContribution('SchemaRegistryCompactLeafModel', {
        stepParamsSchema: objectSchema(
          {
            leaf: { type: 'string' },
          },
          { additionalProperties: false },
        ),
        dynamicHints: [
          {
            kind: 'dynamic-ui-schema',
            path: 'SchemaRegistryCompactLeafModel.stepParams.leaf',
            message: 'Leaf settings are dynamic.',
          },
        ],
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryCompactChildModel', {
        stepParamsSchema: objectSchema(
          {
            child: { type: 'string' },
          },
          { additionalProperties: false },
        ),
        dynamicHints: [
          {
            kind: 'dynamic-ui-schema',
            path: 'SchemaRegistryCompactChildModel.stepParams.child',
            message: 'Child settings are dynamic.',
          },
        ],
        subModelSlots: {
          footer: objectSlot({
            use: 'SchemaRegistryCompactLeafModel',
          }),
        },
      }),
    );

    registry.registerModelContribution(
      modelContribution('SchemaRegistryCompactParentModel', {
        stepParamsSchema: objectSchema(
          {
            enabled: { type: 'boolean' },
          },
          { additionalProperties: false },
        ),
        subModelSlots: {
          body: objectSlot({
            use: 'SchemaRegistryCompactChildModel',
            required: true,
          }),
        },
      }),
    );

    const compact = registry.getPublicModelDocument('SchemaRegistryCompactParentModel');
    const full = registry.getPublicModelDocument('SchemaRegistryCompactParentModel', { detail: 'full' });

    expect(compact).not.toHaveProperty('coverage');
    expect(compact).not.toHaveProperty('skeleton');
    expect(compact).not.toHaveProperty('examples');
    expect(compact.dynamicHints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'SchemaRegistryCompactParentModel.subModels.body',
        }),
      ]),
    );
    expect(JSON.stringify(compact.dynamicHints)).not.toContain('SchemaRegistryCompactChildModel.stepParams.child');
    expect(
      (compact.jsonSchema.properties?.subModels as any)?.properties?.body?.properties?.subModels?.properties?.footer,
    ).toBeUndefined();
    expect((full.dynamicHints || []).length).toBeGreaterThan(compact.dynamicHints.length);
    expect(
      (full.jsonSchema.properties?.subModels as any)?.properties?.body?.properties?.subModels?.properties,
    ).toMatchObject({
      footer: {
        type: 'object',
        properties: {
          use: {
            const: 'SchemaRegistryCompactLeafModel',
          },
        },
      },
    });
  });
});
