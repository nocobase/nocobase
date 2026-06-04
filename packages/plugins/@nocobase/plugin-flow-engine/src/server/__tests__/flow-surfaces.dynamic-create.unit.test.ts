/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { resolveJsonCreateRecipe } from '../flow-surfaces/capability-recipe';
import { resolveDynamicCapabilityCreate } from '../flow-surfaces/capability-resolver';
import { FlowSurfaceAggregateError, FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { FlowSurfacesService } from '../flow-surfaces/service';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCatalogItem,
  FlowSurfaceJsonCreateRecipe,
} from '../flow-surfaces/types';

describe('flowSurfaces dynamic capability create dry-run', () => {
  function createProviderRegistry(providers: FlowSurfaceCapabilitiesProvider[]) {
    return {
      listProviders: () => providers,
    };
  }

  function createDryRunProvider(
    input: {
      createSupported?: boolean;
      createRecipe?: FlowSurfaceJsonCreateRecipe;
      validateSettings?: FlowSurfaceCapabilitiesProvider['validateSettings'];
      resolveCreate?: FlowSurfaceCapabilitiesProvider['resolveCreate'];
      withoutResolveCreate?: boolean;
    } = {},
  ): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-dry-run',
      getCapabilities: () => [
        {
          id: 'blocks.dryRun',
          kind: 'block',
          publicType: 'dryRun',
          label: 'Dry run',
          semantic: {
            title: 'Dry run',
          },
          implementation: {
            modelUse: 'TableBlockModel',
          },
          availability: {
            create: {
              supported: input.createSupported !== false,
            },
          },
          initParamsSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['collectionName'],
            properties: {
              collectionName: {
                type: 'string',
              },
            },
          },
          settingsSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['pageSize'],
            properties: {
              pageSize: {
                type: 'number',
                minimum: 1,
                maximum: 200,
              },
              filter: {
                type: 'object',
              },
              displaySettings: {
                type: 'object',
              },
            },
          },
          ...(input.createRecipe ? { createRecipe: input.createRecipe } : {}),
        },
      ],
      validateSettings: input.validateSettings,
      ...(input.withoutResolveCreate
        ? {}
        : {
            resolveCreate:
              input.resolveCreate ||
              ((_capability, publicInput) => ({
                use: 'TableBlockModel',
                stepParams: {
                  resourceSettings: {
                    init: {
                      collectionName: publicInput.initParams?.collectionName,
                    },
                  },
                  tableSettings: {
                    pageSize: {
                      pageSize: publicInput.settings?.pageSize,
                    },
                  },
                },
              })),
          }),
    };
  }

  function createHangingProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-hanging',
      getCapabilities: () => new Promise(() => undefined),
    };
  }

  function createTableRecipe(): FlowSurfaceJsonCreateRecipe {
    return {
      nodeTemplate: {
        use: 'TableBlockModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
            },
          },
        },
      },
      initParams: [
        {
          name: 'collectionName',
          required: true,
          schema: {
            type: 'string',
          },
          internalLens: {
            domain: 'stepParams',
            path: 'resourceSettings.init.collectionName',
          },
        },
      ],
      settings: [
        {
          key: 'pageSize',
          schema: {
            type: 'number',
          },
          internalLens: {
            domain: 'stepParams',
            path: 'tableSettings.pageSize.pageSize',
          },
        },
      ],
    };
  }

  it('should compile JSON create recipes with safe lenses only', () => {
    const node = resolveJsonCreateRecipe({
      recipe: {
        nodeTemplate: {
          use: 'TableBlockModel',
          props: {
            fieldNames: {
              title: 'oldTitle',
            },
          },
          flowRegistry: {
            beforeRender: [],
          },
        },
        initParams: [
          {
            name: 'collectionName',
            required: true,
            schema: {
              type: 'string',
            },
            internalLens: {
              domain: 'stepParams',
              path: 'resourceSettings.init.collectionName',
            },
          },
        ],
        settings: [
          {
            key: 'fieldNames',
            schema: {
              type: 'object',
            },
            internalLens: {
              domain: 'props',
              path: 'fieldNames',
              mode: 'merge',
            },
          },
          {
            key: 'beforeRender',
            schema: {
              type: 'object',
            },
            internalLens: {
              domain: 'flowRegistry',
              path: 'beforeRender',
              mode: 'append',
            },
          },
        ],
      },
      publicInput: {
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          fieldNames: {
            start: 'startAt',
          },
          beforeRender: {
            name: 'noop',
          },
        },
      },
    });

    expect(node).toMatchObject({
      props: {
        fieldNames: {
          title: 'oldTitle',
          start: 'startAt',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'tasks',
          },
        },
      },
      flowRegistry: {
        beforeRender: [
          {
            name: 'noop',
          },
        ],
      },
    });

    expect(() =>
      resolveJsonCreateRecipe({
        recipe: {
          nodeTemplate: {
            use: 'TableBlockModel',
          },
          settings: [
            {
              key: 'unsafe',
              schema: {
                type: 'string',
              },
              internalLens: {
                domain: 'props',
                path: '__proto__.polluted',
              },
            },
          ],
        },
        publicInput: {
          settings: {
            unsafe: 'value',
          },
        },
      }),
    ).toThrow(FlowSurfaceAggregateError);
  });

  it('should resolve a public provider payload into a guarded node without enabling writes globally', async () => {
    const response = await resolveDynamicCapabilityCreate({
      publicType: 'dryRun',
      rawPublicPayload: {
        publicType: 'tampered',
        settings: {
          pageSize: 999,
        },
      },
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        pageSize: 20,
      },
      enabledPackages: new Set(['@nocobase/plugin-dry-run']),
      providerRegistry: createProviderRegistry([createDryRunProvider()]),
    });

    expect(response.capability.publicType).toBe('dryRun');
    expect(response.publicPayload).toMatchObject({
      publicType: 'dryRun',
      settings: {
        pageSize: 20,
      },
    });
    expect(response.node).toMatchObject({
      use: 'TableBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'tasks',
          },
        },
        tableSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      },
    });
    expect(JSON.stringify(response.publicPayload)).not.toContain('stepParams');
  });

  it('should expose validateCapabilityCreate as a public dry-run without internal node details', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([createDryRunProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);

    const response = await service.validateCapabilityCreate(
      {
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
      },
      {
        enabledPackages,
      },
    );

    expect(response).toMatchObject({
      ok: true,
      capability: {
        publicType: 'dryRun',
        readiness: 'contractDeclared',
      },
      normalizedPublicPayload: {
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
      },
      dryRunNode: {
        publicType: 'dryRun',
      },
    });
    expect(response).not.toHaveProperty('node');
    expect(response.capability).not.toHaveProperty('identity');
    expect(JSON.stringify(response)).not.toContain('TableBlockModel');
    expect(JSON.stringify(response)).not.toContain('stepParams');

    await expect(
      service.validateCapabilityCreate(
        {
          publicType: 'dryRun',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            pageSize: 20,
          },
          stepParams: {
            hidden: true,
          },
        } as unknown as Parameters<FlowSurfacesService['validateCapabilityCreate']>[0],
        {
          enabledPackages,
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceAggregateError);
  });

  it('should resolve recipe-only capabilities without calling provider resolveCreate', async () => {
    const response = await resolveDynamicCapabilityCreate({
      publicType: 'dryRun',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        pageSize: 20,
      },
      enabledPackages: new Set(['@nocobase/plugin-dry-run']),
      providerRegistry: createProviderRegistry([
        createDryRunProvider({
          createRecipe: createTableRecipe(),
          withoutResolveCreate: true,
        }),
      ]),
    });

    expect(response.node).toMatchObject({
      use: 'TableBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
        tableSettings: {
          pageSize: {
            pageSize: 20,
          },
        },
      },
    });
  });

  it('should isolate provider getCapabilities timeout and continue resolving other providers', async () => {
    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        providerTimeoutMs: 5,
        enabledPackages: new Set(['@nocobase/plugin-hanging', '@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([createHangingProvider(), createDryRunProvider()]),
      }),
    ).resolves.toMatchObject({
      node: {
        use: 'TableBlockModel',
      },
    });
  });

  it('should reject internal public payload keys before provider validation or create', async () => {
    const validateSettings = vi.fn();
    const resolveCreate = vi.fn();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        rawPublicPayload: {
          stepParams: {
            hidden: true,
          },
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings,
            resolveCreate,
          }),
        ]),
      }),
    ).rejects.toBeInstanceOf(FlowSurfaceAggregateError);
    expect(validateSettings).not.toHaveBeenCalled();
    expect(resolveCreate).not.toHaveBeenCalled();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        rawPublicPayload: {
          resourceSettings: {
            hidden: true,
          },
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings,
            resolveCreate,
          }),
        ]),
      }),
    ).rejects.toBeInstanceOf(FlowSurfaceAggregateError);
    expect(validateSettings).not.toHaveBeenCalled();
    expect(resolveCreate).not.toHaveBeenCalled();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        rawPublicPayload: {
          settings: {
            tableSettings: {
              hidden: true,
            },
          },
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings,
            resolveCreate,
          }),
        ]),
      }),
    ).rejects.toBeInstanceOf(FlowSurfaceAggregateError);
    expect(validateSettings).not.toHaveBeenCalled();
    expect(resolveCreate).not.toHaveBeenCalled();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        rawPublicPayload: {
          settings: {
            stepParams: {
              hidden: true,
            },
          },
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings,
            resolveCreate,
          }),
        ]),
      }),
    ).rejects.toBeInstanceOf(FlowSurfaceAggregateError);
    expect(validateSettings).not.toHaveBeenCalled();
    expect(resolveCreate).not.toHaveBeenCalled();
  });

  it('should aggregate public schema and provider validation errors', async () => {
    const provider = createDryRunProvider({
      validateSettings: () => ({
        ok: false,
        errors: [
          {
            path: 'settings.pageSize',
            code: 'invalid-type',
            message: 'settings.pageSize must match collection limits',
          },
        ],
      }),
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {},
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([provider]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'initParams.collectionName',
          ruleId: 'required',
        }),
      ],
    });

    let nestedProviderError: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
          displaySettings: {},
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => ({
              ok: false,
              errors: [
                {
                  path: 'settings.displaySettings.internalMode',
                  code: 'invalid-type',
                  message: 'internalMode is invalid',
                },
              ],
            }),
          }),
        ]),
      });
    } catch (error) {
      nestedProviderError = error;
    }
    expect(nestedProviderError).toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings.displaySettings',
          ruleId: 'invalid-type',
          message: 'provider validateSettings failed',
        }),
      ],
    });
    expect(JSON.stringify(nestedProviderError)).not.toContain('internalMode');

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
          displaySettings: {},
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => ({
              ok: false,
              errors: [
                {
                  path: 'settings.displaySettings',
                  code: 'invalid-type',
                  message: 'displaySettings must include a mode',
                },
              ],
            }),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings.displaySettings',
          ruleId: 'invalid-type',
          message: 'displaySettings must include a mode',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => ({
              ok: false,
              errors: [
                {
                  path: 'settings.resourceSettings.init.collectionName',
                  code: 'provider-error',
                  message: 'resourceSettings.init.collectionName is invalid',
                },
              ],
            }),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider validateSettings failed',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        providerTimeoutMs: 5,
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => new Promise(() => undefined),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider validateSettings timed out',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => {
              throw new Error('resourceSettings.init.collectionName is invalid');
            },
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider validateSettings failed',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        providerTimeoutMs: 5,
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            resolveCreate: () => new Promise(() => undefined),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider resolveCreate timed out',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => ({
              ok: false,
              errors: [
                {
                  path: 'stepParams.resourceSettings',
                  code: 'provider-error',
                  message: 'GanttBlockModel leaked modelUse and stepParams',
                },
              ],
            }),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider validateSettings failed',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => {
              throw new Error('GanttBlockModel leaked modelUse and stepParams');
            },
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
          message: 'provider validateSettings failed',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
          filter: 'invalid',
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([createDryRunProvider()]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings.filter',
          ruleId: 'invalid-type',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([provider]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings.pageSize',
          ruleId: 'invalid-type',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            validateSettings: () => ({
              ok: false,
            }),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'provider-error',
        }),
      ],
    });
  });

  it('should require explicit dry-run override for create-disabled capabilities', async () => {
    const provider = createDryRunProvider({
      createSupported: false,
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([provider]),
      }),
    ).rejects.toBeInstanceOf(FlowSurfaceBadRequestError);

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        allowUnavailable: true,
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([provider]),
      }),
    ).resolves.toMatchObject({
      node: {
        use: 'TableBlockModel',
      },
    });
  });

  it('should reject provider-created nodes that fail the contract guard', async () => {
    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'dryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
        enabledPackages: new Set(['@nocobase/plugin-dry-run']),
        providerRegistry: createProviderRegistry([
          createDryRunProvider({
            resolveCreate: () => ({
              use: 'UnknownDynamicBlockModel',
              stepParams: {
                hidden: true,
              },
            }),
          }),
        ]),
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          ruleId: 'contract-guard-failed',
        }),
      ],
    });
  });

  it('should annotate dynamic provider readback nodes with canonical public type', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([
        {
          ownerPlugin: '@nocobase/plugin-gantt',
          getCapabilities: () => [
            {
              id: 'blocks.gantt',
              kind: 'block',
              publicType: 'gantt',
              label: 'Gantt',
              semantic: {
                title: 'Gantt',
              },
              implementation: {
                modelUse: 'GanttBlockModel',
              },
              availability: {
                create: {
                  supported: true,
                },
              },
            },
          ],
          resolveCreate: () => ({
            use: 'GanttBlockModel',
          }),
        },
        createDryRunProvider(),
      ]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    type DynamicReadbackProjector = {
      projectDynamicBlockReadbackTypes<T>(node: T, options: { enabledPackages: ReadonlySet<string> }): Promise<T>;
    };
    const tree = {
      uid: 'root',
      use: 'GridModel',
      subModels: {
        items: [
          {
            uid: 'gantt-1',
            use: 'GanttBlockModel',
          },
          {
            uid: 'table-1',
            use: 'TableBlockModel',
          },
        ],
      },
    };

    const projected = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(tree, {
      enabledPackages: new Set(['@nocobase/plugin-gantt', '@nocobase/plugin-dry-run']),
    });

    expect(projected.subModels.items[0]).toMatchObject({
      use: 'GanttBlockModel',
      type: 'gantt',
    });
    expect(projected.subModels.items[1]).toEqual({
      uid: 'table-1',
      use: 'TableBlockModel',
    });
  });

  it('should keep provider-backed block catalog items out of popup-scoped raw projection', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([createDryRunProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    type ProviderBlockCatalogBuilder = {
      buildProviderBlockCatalogItems(input: {
        builtInBlocks: FlowSurfaceCatalogItem[];
        popupProfile: unknown;
        enabledPackages: ReadonlySet<string>;
      }): Promise<FlowSurfaceCatalogItem[]>;
    };
    const buildProviderBlockCatalogItems = (
      service as unknown as ProviderBlockCatalogBuilder
    ).buildProviderBlockCatalogItems.bind(service);
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);

    await expect(
      buildProviderBlockCatalogItems({
        builtInBlocks: [],
        popupProfile: null,
        enabledPackages,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        key: 'dryRun',
        publicType: 'dryRun',
        use: 'TableBlockModel',
      }),
    ]);

    await expect(
      buildProviderBlockCatalogItems({
        builtInBlocks: [],
        popupProfile: {
          isPopupSurface: true,
          hasCurrentRecord: true,
          hasAssociationContext: false,
          scene: 'one',
        },
        enabledPackages,
      }),
    ).resolves.toEqual([]);
  });

  it('should route create-disabled provider block writes through dynamic availability gating', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([createDryRunProvider({ createSupported: false })]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    type DynamicWriteHarness = {
      resolveDynamicBlockTypes(enabledPackages: ReadonlySet<string>): Promise<Set<string>>;
      normalizeComposeBlocks(
        input: unknown,
        enabledPackages: ReadonlySet<string>,
        popupDefaultsMetadata: undefined,
        resourceFallback: undefined,
        dynamicBlockTypes: ReadonlySet<string>,
      ): Array<{
        key: string;
        type?: string;
        isDynamic?: boolean;
        initParams?: Record<string, unknown>;
        settings?: Record<string, unknown>;
      }>;
      tryAddDynamicBlock(input: {
        values: Record<string, unknown>;
        options: Record<string, unknown>;
        enabledPackages: ReadonlySet<string>;
        blockType: string;
        target: { uid: string };
        parentUid: string;
        subKey: string;
        subType: string;
        popupProfile: null;
        semanticResource: undefined;
      }): Promise<unknown>;
    };
    const harness = service as unknown as DynamicWriteHarness;
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);

    expect(dynamicBlockTypes.has('dryRun')).toBe(true);
    const [normalizedBlock] = harness.normalizeComposeBlocks(
      [
        {
          key: 'disabledDryRun',
          type: 'dryRun',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            pageSize: 20,
          },
        },
      ],
      enabledPackages,
      undefined,
      undefined,
      dynamicBlockTypes,
    );
    expect(normalizedBlock).toMatchObject({
      key: 'disabledDryRun',
      type: 'dryRun',
      isDynamic: true,
    });

    let caught: unknown;
    try {
      await harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            pageSize: 20,
          },
        },
        options: {},
        enabledPackages,
        blockType: 'dryRun',
        target: {
          uid: 'grid-1',
        },
        parentUid: 'grid-1',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
        semanticResource: undefined,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(caught).toMatchObject({
      message: `flowSurfaces dynamic create capability 'dryRun' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          publicType: 'dryRun',
        },
      },
    });
  });

  it('should not classify provider block public types that collide with built-ins as dynamic', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([
        {
          ownerPlugin: '@nocobase/plugin-conflict',
          getCapabilities: () => [
            {
              id: 'blocks.tableConflict',
              kind: 'block',
              publicType: 'table',
              label: 'Table alternative',
              semantic: {
                title: 'Table alternative',
              },
              implementation: {
                modelUse: 'TableAlternativeBlockModel',
              },
              availability: {
                create: {
                  supported: false,
                },
              },
            },
          ],
        },
      ]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    type DynamicBlockTypeResolver = {
      resolveDynamicBlockTypes(enabledPackages: ReadonlySet<string>): Promise<Set<string>>;
      tryAddDynamicBlock(input: {
        values: Record<string, unknown>;
        options: Record<string, unknown>;
        enabledPackages: ReadonlySet<string>;
        blockType: string;
        target: { uid: string };
        parentUid: string;
        subKey: string;
        subType: string;
        popupProfile: null;
        semanticResource: undefined;
      }): Promise<unknown>;
    };
    const harness = service as unknown as DynamicBlockTypeResolver;
    const enabledPackages = new Set(['@nocobase/plugin-conflict']);
    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);

    expect(dynamicBlockTypes.has('table')).toBe(false);
    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'table',
        },
        options: {},
        enabledPackages,
        blockType: 'table',
        target: {
          uid: 'grid-1',
        },
        parentUid: 'grid-1',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
        semanticResource: undefined,
      }),
    ).resolves.toBeNull();
  });
});
