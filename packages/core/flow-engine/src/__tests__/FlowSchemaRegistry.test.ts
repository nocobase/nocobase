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
    expect(bundle.summary.registeredModels).toBe(1);
    expect(bundle.summary.registeredActions).toBe(1);
    expect(bundle.summary.publicOfficialModelsTotal).toBe(2);
    expect(bundle.summary.publicOfficialModelsCovered).toBe(1);
    expect(bundle.summary.publicOfficialStrictModels).toBe(0);
    expect(bundle.summary.publicOfficialUnresolvedModels).toBe(0);
    expect(bundle.summary.missingModelUses).toEqual(['SchemaRegistryMissingModel']);
    expect(bundle.summary.missingActionNames).toEqual(['schemaRegistryMissingAction']);
    expect(bundle.items[0]).toMatchObject({
      use: 'SchemaRegistryManifestModel',
      dynamicHints: expect.arrayContaining([
        expect.objectContaining({
          path: 'SchemaRegistryManifestModel.subModels.body',
          'x-flow': expect.objectContaining({
            slotRules: expect.objectContaining({
              allowedUses: ['SchemaRegistryChildModel'],
            }),
          }),
        }),
      ]),
    });
    expect(bundle.items[0]?.keyEnums?.['#/properties/use']).toEqual(['SchemaRegistryManifestModel']);
  });

  it('should filter internal models from public discovery helpers', () => {
    const registry = new FlowSchemaRegistry();

    registry.registerModelManifest({
      use: 'SchemaRegistryInternalBaseModel',
      exposure: 'internal',
      allowDirectUse: false,
      suggestedUses: ['SchemaRegistryPublicModel'],
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
    expect(registry.hasPublicModel('SchemaRegistryPublicModel')).toBe(true);
    expect(registry.isDirectUseAllowed('SchemaRegistryInternalBaseModel')).toBe(false);
    expect(registry.getSuggestedUses('SchemaRegistryInternalBaseModel')).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.listModelUses({ publicOnly: true })).toEqual(['SchemaRegistryPublicModel']);
    expect(registry.getSchemaBundle().summary.registeredModels).toBe(1);
    expect(registry.getSchemaBundle().summary.publicOfficialModelsTotal).toBe(0);
    expect(registry.getSchemaBundle().items.map((item) => item.use)).toEqual(['SchemaRegistryPublicModel']);
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
      properties: {
        use: {
          const: 'SchemaRegistryLegacyChildModel',
        },
        stepParams: {
          required: ['title'],
          additionalProperties: false,
        },
      },
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
  });
});
