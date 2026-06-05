/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildFlowSurfaceCapabilitiesResponse } from '../flow-surfaces/capabilities';
import { resolveJsonCreateRecipe } from '../flow-surfaces/capability-recipe';
import { resolveDynamicCapabilityCreate } from '../flow-surfaces/capability-resolver';
import { FlowSurfaceAggregateError, FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { buildFlowSurfaceAutoSnapshot } from '../flow-surfaces/extractor';
import { FlowSurfacesService } from '../flow-surfaces/service';
import type { FlowSurfaceCapabilityAdmissionReport } from '../flow-surfaces/admission-report';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCatalogItem,
  FlowSurfaceDynamicCapabilityCreateActionName,
  FlowSurfaceJsonCreateRecipe,
  FlowSurfaceWriteTarget,
} from '../flow-surfaces/types';

describe('flowSurfaces dynamic capability create dry-run', () => {
  type TryAddDynamicBlockInput = {
    values: Record<string, unknown>;
    options: {
      transaction?: unknown;
      deferAutoLayout?: boolean;
      dynamicCapabilityActionName?: FlowSurfaceDynamicCapabilityCreateActionName;
    };
    enabledPackages: ReadonlySet<string>;
    blockType: string;
    target: FlowSurfaceWriteTarget;
    parentUid: string;
    subKey: string;
    subType: string;
    popupProfile: null;
  };

  type DynamicBlockWriteGateHarness = {
    resolveDynamicBlockTypes(enabledPackages: ReadonlySet<string>): Promise<Set<string>>;
    catalog(
      input: {
        target: FlowSurfaceWriteTarget;
        sections?: string[];
      },
      options: {
        transaction?: unknown;
        enabledPackages?: ReadonlySet<string>;
      },
    ): Promise<{
      blocks?: FlowSurfaceCatalogItem[];
    }>;
    tryAddDynamicBlock(input: TryAddDynamicBlockInput): Promise<unknown>;
  };

  type DynamicBlockCapabilityHarness = {
    resolveDynamicBlockCapability(
      publicType: string,
      enabledPackages: ReadonlySet<string>,
    ): Promise<{ publicItem: { publicType: string } } | null>;
  };

  type DynamicDispatchHarness = {
    dispatchOp(
      op: {
        type: 'addBlock';
      },
      resolvedValues: Record<string, unknown>,
      ctx: {
        transaction?: unknown;
        clientKeyToUid: Record<string, unknown>;
      },
      runtimeOptions?: {
        dynamicCapabilityActionName?: FlowSurfaceDynamicCapabilityCreateActionName;
      },
    ): Promise<unknown>;
  };

  type EnabledPackagesHarness = {
    resolveEnabledPluginPackages(options?: {
      transaction?: unknown;
      enabledPackages?: ReadonlySet<string>;
    }): Promise<ReadonlySet<string>>;
  };

  type TransactionHarness = {
    transaction<T>(callback: (transaction: unknown) => Promise<T>): Promise<T>;
  };

  type ComposePrivateHarness = {
    buildTargetAuthoringContext(input: {
      target: FlowSurfaceWriteTarget;
      transaction?: unknown;
    }): Promise<Record<string, unknown>>;
    findApprovalSurfaceRootForNode(uid: string, transaction?: unknown): Promise<unknown>;
  };

  type SurfaceContextGetterHarness = {
    readonly surfaceContext: {
      resolveBlockParent(target: FlowSurfaceWriteTarget, transaction?: unknown): Promise<{ parentUid: string }>;
    };
  };

  type RepositoryGetterHarness = {
    readonly repository: {
      findModelById(uid: string, options?: Record<string, unknown>): Promise<unknown>;
    };
  };

  type ApplyBlueprintPrivateHarness = {
    applyBlueprintWithTransaction(
      values: Record<string, unknown>,
      options?: {
        transaction?: unknown;
        currentRoles?: readonly string[];
        skipAuthoringValidation?: boolean;
      },
      createdKanbanSortFields?: Array<Record<string, unknown>>,
      resultOptions?: {
        readSurface: false;
      },
    ): Promise<unknown>;
    ensureSurfaceTableDefaultActionIntegrity(target: unknown, options?: Record<string, unknown>): Promise<void>;
  };

  type ApplyBlueprintActionHarness = {
    createMenu(values: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    createPage(values: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
    compose(values: Record<string, unknown>, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  };

  function createProviderRegistry(providers: FlowSurfaceCapabilitiesProvider[]) {
    return {
      listProviders: () => providers,
    };
  }

  function createGanttAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-gantt',
      pluginVersion: '1.0.0',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'snapshot-source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'GanttBlockModel',
          className: 'GanttBlockModel',
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'gantt',
          label: 'Gantt',
          modelUse: 'GanttBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
        {
          type: 'model.flowRegistered',
          modelUse: 'GanttBlockModel',
          flowKey: 'ganttSettings',
          title: 'Gantt settings',
          staticStatus: 'static',
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.settings.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createAdmissionChecks(): FlowSurfaceCapabilityAdmissionReport['records'][number]['checks'] {
    return {
      discovered: { ok: true },
      publicTypeStable: { ok: true },
      contractDeclared: { ok: true },
      targetCatalogVerified: { ok: true },
      dryRunCreate: { ok: true },
      readbackParity: { ok: true },
      unsafePayloadBlocked: { ok: true },
      testsPresent: { ok: true },
    };
  }

  function createVerifiedAutoAdmissionReport(): FlowSurfaceCapabilityAdmissionReport {
    return {
      version: 1,
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      records: [
        {
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          capabilityVersion: '1.0.0',
          manifestHash: 'manifest-hash',
          snapshotHash: 'v1:snapshot-source-hash',
          dryRunFixtureHash: 'fixture-hash',
          readiness: 'createEnabled',
          updatedAt: '2026-06-04T00:00:00.000Z',
          approvedAt: '2026-06-04T00:00:00.000Z',
          checks: createAdmissionChecks(),
        },
      ],
    };
  }

  function createDryRunProvider(
    input: {
      createSupported?: boolean;
      createRecipe?: FlowSurfaceJsonCreateRecipe;
      validateSettings?: FlowSurfaceCapabilitiesProvider['validateSettings'];
      resolveCreate?: FlowSurfaceCapabilitiesProvider['resolveCreate'];
      withoutResolveCreate?: boolean;
      acceptedAliases?: string[];
      modelUse?: string;
    } = {},
  ): FlowSurfaceCapabilitiesProvider {
    const modelUse = input.modelUse || 'TableBlockModel';
    return {
      ownerPlugin: '@nocobase/plugin-dry-run',
      getCapabilities: () => [
        {
          id: 'blocks.dryRun',
          kind: 'block',
          publicType: 'dryRun',
          ...(input.acceptedAliases ? { acceptedAliases: input.acceptedAliases } : {}),
          label: 'Dry run',
          semantic: {
            title: 'Dry run',
          },
          implementation: {
            modelUse,
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
                use: modelUse,
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

  it('should validate capability create without touching the flow model repository', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([createDryRunProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const repositoryGetter = vi
      .spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get')
      .mockImplementation(() => {
        throw new Error('validateCapabilityCreate must not access the flow model repository');
      });

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
      dryRunNode: {
        publicType: 'dryRun',
      },
    });
    expect(repositoryGetter).not.toHaveBeenCalled();
  });

  it('should map a verified auto snapshot Gantt payload into a guarded internal node', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const discovery = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginGantt.gantt'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
        catalog: async () => ({
          target: null,
          scenario: {
            surfaceKind: 'global',
          },
          selectedSections: ['blocks'],
          blocks: [],
        }),
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );
    expect(discovery.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        readiness: 'createEnabled',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
      }),
    ]);

    const directResponse = await resolveDynamicCapabilityCreate({
      publicType: 'pluginGantt.gantt',
      initParams: {
        collectionName: 'tasks',
        dataSourceKey: 'main',
      },
      settings: {},
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      providerRegistry: createProviderRegistry([]),
      autoSnapshots: [autoSnapshot],
      admissionReports: [createVerifiedAutoAdmissionReport()],
      capabilityPolicyConfig: verifiedAutoPolicy,
    });

    expect(directResponse.capability).toMatchObject({
      publicType: 'pluginGantt.gantt',
      ownerPlugin: '@nocobase/plugin-gantt',
      origin: 'autoSnapshot',
      readiness: 'createEnabled',
      availability: {
        create: {
          supported: true,
          acceptsInitParams: true,
          acceptsSettings: false,
        },
      },
      initParamsSchema: {
        required: ['collectionName'],
        properties: {
          collectionName: {
            type: 'string',
          },
          dataSourceKey: {
            type: 'string',
          },
        },
      },
    });
    expect(directResponse.publicPayload).toMatchObject({
      publicType: 'pluginGantt.gantt',
      initParams: {
        collectionName: 'tasks',
        dataSourceKey: 'main',
      },
      settings: {},
    });
    expect(directResponse.node).toMatchObject({
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'tasks',
            dataSourceKey: 'main',
          },
        },
      },
    });
    expect(JSON.stringify(directResponse.publicPayload)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(directResponse.publicPayload)).not.toContain('stepParams');

    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: verifiedAutoPolicy,
      },
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);

    const dryRunResponse = await service.validateCapabilityCreate(
      {
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );

    expect(dryRunResponse).toMatchObject({
      ok: true,
      capability: {
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        readiness: 'createEnabled',
        availability: {
          create: {
            supported: true,
          },
        },
      },
      normalizedPublicPayload: {
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
      },
      dryRunNode: {
        publicType: 'pluginGantt.gantt',
      },
    });
    expect(dryRunResponse.capability).not.toHaveProperty('identity');
    expect(JSON.stringify(dryRunResponse)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(dryRunResponse)).not.toContain('stepParams');
  });

  it('should accept provider publicType aliases while returning canonical payload', async () => {
    const provider = createDryRunProvider({
      acceptedAliases: ['legacyDryRun'],
    });
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness & DynamicBlockCapabilityHarness;

    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);
    expect(dynamicBlockTypes.has('legacyDryRun')).toBe(true);
    const resolvedAliasCapability = await harness.resolveDynamicBlockCapability('legacyDryRun', enabledPackages);
    expect(resolvedAliasCapability?.publicItem.publicType).toBe('dryRun');

    const directResponse = await resolveDynamicCapabilityCreate({
      publicType: 'legacyDryRun',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        pageSize: 20,
      },
      enabledPackages,
      providerRegistry: createProviderRegistry([provider]),
    });
    expect(directResponse.capability.publicType).toBe('dryRun');
    expect(directResponse.publicPayload).toMatchObject({
      publicType: 'dryRun',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        pageSize: 20,
      },
    });

    const dryRunResponse = await service.validateCapabilityCreate(
      {
        publicType: 'legacyDryRun',
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

    expect(dryRunResponse).toMatchObject({
      ok: true,
      capability: {
        publicType: 'dryRun',
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
    expect(JSON.stringify(dryRunResponse)).not.toContain('TableBlockModel');
    expect(JSON.stringify(dryRunResponse)).not.toContain('stepParams');
  });

  it('should persist provider alias writes and read back canonical public type', async () => {
    const providerModelUse = 'AliasDryRunBlockModel';
    const provider = createDryRunProvider({
      acceptedAliases: ['legacyDryRun'],
      modelUse: providerModelUse,
      resolveCreate: () => ({
        use: providerModelUse,
      }),
    });
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness & {
      projectDynamicBlockReadbackTypes<T>(node: T, options: { enabledPackages: ReadonlySet<string> }): Promise<T>;
    };
    const persistedPayloads: Record<string, unknown>[] = [];
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        return 'created-alias-dry-run';
      },
    } as unknown as RepositoryGetterHarness['repository']);

    const result = await harness.tryAddDynamicBlock({
      values: {
        type: 'legacyDryRun',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          pageSize: 20,
        },
      },
      options: {
        deferAutoLayout: true,
        dynamicCapabilityActionName: 'addBlock',
      },
      enabledPackages,
      blockType: 'legacyDryRun',
      target: {
        uid: 'target-grid',
      },
      parentUid: 'parent-grid',
      subKey: 'items',
      subType: 'array',
      popupProfile: null,
    });

    expect(result).toMatchObject({
      uid: 'created-alias-dry-run',
      parentUid: 'parent-grid',
      subKey: 'items',
    });
    expect(persistedPayloads).toEqual([
      expect.objectContaining({
        parentId: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        use: providerModelUse,
      }),
    ]);

    const projected = await harness.projectDynamicBlockReadbackTypes(
      {
        uid: 'created-alias-dry-run',
        use: providerModelUse,
      },
      {
        enabledPackages,
      },
    );
    expect(projected).toMatchObject({
      uid: 'created-alias-dry-run',
      use: providerModelUse,
      type: 'dryRun',
    });
  });

  it('should keep plugin-qualified provider aliases discovery-only for create', async () => {
    const provider = createDryRunProvider({
      acceptedAliases: ['@nocobase/plugin-dry-run:dryRun'],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: '@nocobase/plugin-dry-run:dryRun',
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
      options: {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          publicType: '@nocobase/plugin-dry-run:dryRun',
        },
      },
    });
  });

  it('should validate verified auto snapshot Gantt public payload before mapping', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {},
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'initParams.collectionName',
          ruleId: 'required',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: '   ',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'initParams.collectionName',
          ruleId: 'required',
        }),
      ],
    });

    let internalSettingsError: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          ganttSettings: {},
        },
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      internalSettingsError = caught;
    }

    expect(internalSettingsError).toBeInstanceOf(FlowSurfaceAggregateError);
    expect(internalSettingsError).toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'payload',
          ruleId: 'unsupported',
          message: 'public payload contains unsupported dynamic capability create fields',
        }),
      ],
    });
    expect(JSON.stringify(internalSettingsError)).not.toContain('ganttSettings');
    expect(JSON.stringify(internalSettingsError)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(internalSettingsError)).not.toContain('stepParams');

    let internalRawPayloadError: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        rawPublicPayload: {
          publicType: 'pluginGantt.gantt',
          modelUse: 'GanttBlockModel',
        },
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      internalRawPayloadError = caught;
    }

    expect(internalRawPayloadError).toBeInstanceOf(FlowSurfaceAggregateError);
    expect(internalRawPayloadError).toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'payload',
          ruleId: 'unsupported',
          message: 'public payload contains unsupported dynamic capability create fields',
        }),
      ],
    });
    expect(JSON.stringify(internalRawPayloadError)).not.toContain('modelUse');
    expect(JSON.stringify(internalRawPayloadError)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(internalRawPayloadError)).not.toContain('stepParams');
  });

  it('should keep verified auto dynamic create validation blocked under manifestOnly policy', async () => {
    const autoSnapshot = createGanttAutoSnapshot();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'manifest-required',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
  });

  it('should log validate capability failures without internal details', async () => {
    const auditLog = vi.fn();
    const autoSnapshot = createGanttAutoSnapshot();
    const service = new FlowSurfacesService({
      app: {
        logger: {
          info: auditLog,
        },
      },
      options: {
        flowSurfaceCapabilities: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      },
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);

    await expect(
      service.validateCapabilityCreate(
        {
          kind: 'block',
          ownerPlugin: '@nocobase/plugin-gantt',
          publicType: 'pluginGantt.gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {},
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          reasonCode: 'manifest-required',
        },
      },
    });

    expect(auditLog).toHaveBeenCalledWith(
      'flowSurfaces capability audit',
      expect.objectContaining({
        actionName: 'validateCapabilityCreate',
        event: 'capability.validate.failed',
        kind: 'block',
        ownerPlugin: '@nocobase/plugin-gantt',
        publicType: 'pluginGantt.gantt',
        reasonCode: 'manifest-required',
        durationMs: expect.any(Number),
      }),
    );
    const serializedLog = JSON.stringify(auditLog.mock.calls);
    expect(serializedLog).not.toContain('GanttBlockModel');
    expect(serializedLog).not.toContain('stepParams');
    expect(serializedLog).not.toContain('snapshot-source-hash');
  });

  it('should block provider dynamic create under discoveryOnly policy', async () => {
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
        providerRegistry: createProviderRegistry([createDryRunProvider()]),
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'discoveryOnly',
          },
        },
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces dynamic create capability 'dryRun' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
          publicType: 'dryRun',
        },
      },
    });
  });

  it('should require explicit verified auto allowlists before create validation reaches resolver contract', async () => {
    const autoSnapshot = createGanttAutoSnapshot();

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
          },
        },
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
  });

  it('should keep stale verified auto admission evidence from enabling create', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const staleAdmissionReport: FlowSurfaceCapabilityAdmissionReport = {
      ...createVerifiedAutoAdmissionReport(),
      records: createVerifiedAutoAdmissionReport().records.map((record) => ({
        ...record,
        snapshotHash: 'older-snapshot-hash',
      })),
    };
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    let error: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [staleAdmissionReport],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'snapshot-stale',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(JSON.stringify(error)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(error)).not.toContain('stepParams');
    expect(JSON.stringify(error)).not.toContain('older-snapshot-hash');
  });

  it('should keep legacy snapshot hash admission evidence from enabling create', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const currentAdmissionReport = createVerifiedAutoAdmissionReport();
    const legacySnapshotHashAdmissionReport: FlowSurfaceCapabilityAdmissionReport = {
      ...currentAdmissionReport,
      records: currentAdmissionReport.records.map((record) => ({
        ...record,
        snapshotHash: 'snapshot-source-hash',
      })),
    };
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    let error: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [legacySnapshotHashAdmissionReport],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'snapshot-stale',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(JSON.stringify(error)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(error)).not.toContain('stepParams');
    expect(JSON.stringify(error)).not.toContain('snapshot-source-hash');
  });

  it('should keep incompatible auto snapshot versions from enabling verifiedAuto create', async () => {
    const incompatibleAutoSnapshot = {
      ...createGanttAutoSnapshot(),
      version: 999,
    } as unknown as ReturnType<typeof createGanttAutoSnapshot>;
    const incompatibleAdmissionReport: FlowSurfaceCapabilityAdmissionReport = {
      ...createVerifiedAutoAdmissionReport(),
      records: createVerifiedAutoAdmissionReport().records.map((record) => ({
        ...record,
        snapshotHash: 'v999:snapshot-source-hash',
      })),
    };
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    let error: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [incompatibleAutoSnapshot],
        admissionReports: [incompatibleAdmissionReport],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'snapshot-stale',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(JSON.stringify(error)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(error)).not.toContain('stepParams');
    expect(JSON.stringify(error)).not.toContain('snapshot-source-hash');
  });

  it('should keep unapproved verifiedAuto admission evidence from enabling create', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoAdmissionReport = createVerifiedAutoAdmissionReport();
    const unapprovedAdmissionReport: FlowSurfaceCapabilityAdmissionReport = {
      ...verifiedAutoAdmissionReport,
      records: verifiedAutoAdmissionReport.records.map((record) => {
        const { approvedAt: _approvedAt, ...unapprovedRecord } = record;
        return unapprovedRecord;
      }),
    };
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    let error: unknown;
    try {
      await resolveDynamicCapabilityCreate({
        publicType: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        admissionReports: [unapprovedAdmissionReport],
        capabilityPolicyConfig: verifiedAutoPolicy,
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toMatchObject({
      message: `flowSurfaces dynamic create capability 'pluginGantt.gantt' is not enabled for writes`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(JSON.stringify(error)).not.toContain('approvedAt');
    expect(JSON.stringify(error)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(error)).not.toContain('stepParams');
    expect(JSON.stringify(error)).not.toContain('snapshot-source-hash');
  });

  it('should persist catalog-confirmed verified auto snapshot addBlock candidates through the gated mapping', async () => {
    const auditLog = vi.fn();
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const service = new FlowSurfacesService({
      app: {
        logger: {
          info: auditLog,
        },
      },
      options: {
        flowSurfaceCapabilities: verifiedAutoPolicy,
      },
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);
    const persistedPayloads: Record<string, unknown>[] = [];

    expect(dynamicBlockTypes.has('pluginGantt.gantt')).toBe(true);
    harness.catalog = async (input, options) => {
      expect(input).toMatchObject({
        target: {
          uid: 'target-grid',
        },
        sections: ['blocks'],
      });
      expect(options.enabledPackages).toBe(enabledPackages);
      return {
        blocks: [
          {
            key: 'pluginGantt.gantt',
            label: 'Gantt',
            use: 'pluginGantt.gantt',
            kind: 'block',
            publicType: 'pluginGantt.gantt',
            origin: 'autoSnapshot',
            createSupported: true,
          },
        ],
      };
    };
    type RepositoryGetterHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
      };
    };
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        return 'created-gantt-block';
      },
    });

    const result = await harness.tryAddDynamicBlock({
      values: {
        target: {
          uid: 'target-grid',
        },
        type: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
      },
      options: {
        deferAutoLayout: true,
        dynamicCapabilityActionName: 'addBlock',
      },
      enabledPackages,
      blockType: 'pluginGantt.gantt',
      target: {
        uid: 'target-grid',
      },
      parentUid: 'parent-grid',
      subKey: 'items',
      subType: 'array',
      popupProfile: null,
    });

    expect(result).toMatchObject({
      uid: 'created-gantt-block',
      parentUid: 'parent-grid',
      subKey: 'items',
    });
    expect(persistedPayloads).toHaveLength(1);
    expect(persistedPayloads[0]).toMatchObject({
      parentId: 'parent-grid',
      subKey: 'items',
      subType: 'array',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'tasks',
          },
        },
      },
    });
    expect(auditLog).toHaveBeenCalledWith(
      'flowSurfaces capability audit',
      expect.objectContaining({
        actionName: 'addBlock',
        event: 'capability.create.succeeded',
        kind: 'block',
        ownerPlugin: '@nocobase/plugin-gantt',
        publicType: 'pluginGantt.gantt',
        targetUid: 'target-grid',
        durationMs: expect.any(Number),
      }),
    );
    const serializedLog = JSON.stringify(auditLog.mock.calls);
    expect(serializedLog).not.toContain('GanttBlockModel');
    expect(serializedLog).not.toContain('stepParams');
    expect(serializedLog).not.toContain('snapshot-source-hash');
  });

  it('should reject target catalog items with explicit unsupported create availability', async () => {
    const auditLog = vi.fn();
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const service = new FlowSurfacesService({
      app: {
        logger: {
          info: auditLog,
        },
      },
      options: {
        flowSurfaceCapabilities: verifiedAutoPolicy,
      },
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    harness.catalog = async () => ({
      blocks: [
        {
          key: 'pluginGantt.gantt',
          label: 'Gantt',
          use: 'pluginGantt.gantt',
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
          availability: {
            render: {
              supported: true,
            },
            readback: {
              supported: true,
            },
            create: {
              supported: false,
              reasonCode: 'contract-not-verified',
              reasonSource: 'catalog',
            },
            configure: {
              supported: false,
              reasonCode: 'contract-not-verified',
              reasonSource: 'registry',
            },
          },
        },
      ],
    });
    type RepositoryCreateHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
      };
    };
    const upsertModel = vi.fn(async () => 'created-gantt-block');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'pluginGantt.gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {},
        },
        options: {
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages,
        blockType: 'pluginGantt.gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'pluginGantt.gantt' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(upsertModel).not.toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalledWith(
      'flowSurfaces capability audit',
      expect.objectContaining({
        actionName: 'addBlock',
        event: 'capability.create.blocked',
        kind: 'block',
        ownerPlugin: '@nocobase/plugin-gantt',
        publicType: 'pluginGantt.gantt',
        reasonCode: 'contract-not-verified',
        targetUid: 'target-grid',
      }),
    );
  });

  it('should log blocked addBlock auto snapshot candidates without internal details', async () => {
    const auditLog = vi.fn();
    const autoSnapshot = createGanttAutoSnapshot();
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const service = new FlowSurfacesService({
      app: {
        logger: {
          info: auditLog,
        },
      },
      options: {
        flowSurfaceCapabilities: verifiedAutoPolicy,
      },
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    harness.catalog = async () => ({
      blocks: [],
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'pluginGantt.gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {},
        },
        options: {
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages,
        blockType: 'pluginGantt.gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'pluginGantt.gantt' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'pluginGantt.gantt',
        },
      },
    });
    expect(auditLog).toHaveBeenCalledWith(
      'flowSurfaces capability audit',
      expect.objectContaining({
        actionName: 'addBlock',
        event: 'capability.create.blocked',
        kind: 'block',
        ownerPlugin: '@nocobase/plugin-gantt',
        publicType: 'pluginGantt.gantt',
        reasonCode: 'contract-not-verified',
        targetUid: 'target-grid',
        durationMs: expect.any(Number),
      }),
    );
    const serializedLog = JSON.stringify(auditLog.mock.calls);
    expect(serializedLog).not.toContain('GanttBlockModel');
    expect(serializedLog).not.toContain('stepParams');
    expect(serializedLog).not.toContain('snapshot-source-hash');
  });

  it('should preserve applyBlueprint action context for planned dynamic addBlock writes', async () => {
    const service = new FlowSurfacesService({} as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicDispatchHarness;
    const clientKeyToUid: Record<string, unknown> = {};
    const addBlock = vi.spyOn(service, 'addBlock').mockResolvedValue({
      uid: 'created-gantt-block',
      parentUid: 'parent-grid',
      subKey: 'items',
    } as unknown as Awaited<ReturnType<FlowSurfacesService['addBlock']>>);

    await harness.dispatchOp(
      {
        type: 'addBlock',
      },
      {
        target: {
          uid: 'target-grid',
        },
        type: 'pluginGantt.gantt',
        clientKey: 'plannedGantt',
      },
      {
        transaction: 'tx-1',
        clientKeyToUid,
      },
      {
        dynamicCapabilityActionName: 'applyBlueprint',
      },
    );

    expect(addBlock).toHaveBeenCalledTimes(1);
    expect(addBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pluginGantt.gantt',
        clientKey: 'plannedGantt',
      }),
      expect.objectContaining({
        transaction: 'tx-1',
        dynamicCapabilityActionName: 'applyBlueprint',
      }),
    );
    expect(clientKeyToUid).toMatchObject({
      plannedGantt: 'created-gantt-block',
    });
  });

  it('should route verified auto addBlocks items through the dynamic addBlock gate context', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    vi.spyOn(service as unknown as EnabledPackagesHarness, 'resolveEnabledPluginPackages').mockResolvedValue(
      enabledPackages,
    );
    vi.spyOn(service as unknown as TransactionHarness, 'transaction').mockImplementation((async (callback) =>
      callback('tx-add-blocks')) as TransactionHarness['transaction']);
    const addBlock = vi.spyOn(service, 'addBlock').mockResolvedValue({
      uid: 'batch-gantt-block',
      parentUid: 'target-grid',
      subKey: 'items',
    } as unknown as Awaited<ReturnType<FlowSurfacesService['addBlock']>>);
    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);

    expect(dynamicBlockTypes.has('pluginGantt.gantt')).toBe(true);

    const result = await service.addBlocks({
      target: {
        uid: 'target-grid',
      },
      blocks: [
        {
          key: 'plannedGantt',
          type: 'pluginGantt.gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {},
        },
      ],
    });

    expect(result).toMatchObject({
      successCount: 1,
      errorCount: 0,
      blocks: [
        {
          index: 0,
          key: 'plannedGantt',
          ok: true,
          result: {
            uid: 'batch-gantt-block',
          },
        },
      ],
    });
    expect(addBlock).toHaveBeenCalledTimes(1);
    expect(addBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          uid: 'target-grid',
        },
        key: 'plannedGantt',
        type: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
      }),
      expect.objectContaining({
        transaction: 'tx-add-blocks',
        enabledPackages,
        skipAuthoringValidation: true,
        dynamicCapabilityActionName: 'addBlocks',
      }),
    );
  });

  it('should route verified auto compose blocks through the dynamic addBlock gate context', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    vi.spyOn(service as unknown as EnabledPackagesHarness, 'resolveEnabledPluginPackages').mockResolvedValue(
      enabledPackages,
    );
    vi.spyOn(service as unknown as ComposePrivateHarness, 'buildTargetAuthoringContext').mockResolvedValue({});
    vi.spyOn(service as unknown as ComposePrivateHarness, 'findApprovalSurfaceRootForNode').mockResolvedValue(null);
    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      resolveBlockParent: async () => ({
        parentUid: 'grid-1',
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => ({
        uid,
        subModels: {
          items: uid === 'grid-1' ? [{ uid: 'compose-gantt-block' }] : [],
        },
      }),
    });
    const addBlock = vi.spyOn(service, 'addBlock').mockResolvedValue({
      uid: 'compose-gantt-block',
      parentUid: 'grid-1',
      subKey: 'items',
    } as unknown as Awaited<ReturnType<FlowSurfacesService['addBlock']>>);
    const setLayout = vi.spyOn(service, 'setLayout').mockResolvedValue({ ok: true });

    const result = await service.compose({
      target: {
        uid: 'target-tab',
      },
      blocks: [
        {
          key: 'plannedGantt',
          type: 'pluginGantt.gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {},
        },
      ],
    });

    expect(result).toMatchObject({
      target: {
        uid: 'grid-1',
      },
      mode: 'append',
      blocks: [
        {
          key: 'plannedGantt',
          type: 'pluginGantt.gantt',
          uid: 'compose-gantt-block',
        },
      ],
    });
    expect(addBlock).toHaveBeenCalledTimes(1);
    expect(addBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          uid: 'grid-1',
        },
        key: 'plannedGantt',
        type: 'pluginGantt.gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
      }),
      expect.objectContaining({
        enabledPackages,
        deferAutoLayout: true,
        skipDefaultBlockActions: true,
        skipAuthoringValidation: true,
        dynamicCapabilityActionName: 'compose',
      }),
    );
    expect(setLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          uid: 'grid-1',
        },
      }),
      expect.any(Object),
    );
  });

  it('should route verified auto applyBlueprint blocks through compose with applyBlueprint context', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const privateHarness = service as unknown as ApplyBlueprintPrivateHarness;
    const actionHarness = service as unknown as ApplyBlueprintActionHarness;
    vi.spyOn(service as unknown as EnabledPackagesHarness, 'resolveEnabledPluginPackages').mockResolvedValue(
      enabledPackages,
    );
    vi.spyOn(privateHarness, 'ensureSurfaceTableDefaultActionIntegrity').mockResolvedValue(undefined);
    vi.spyOn(actionHarness, 'createMenu').mockResolvedValue({
      routeId: 'menu-route-1',
    });
    vi.spyOn(actionHarness, 'createPage').mockResolvedValue({
      pageSchemaUid: 'page-schema-1',
      tabSchemaUid: 'tab-schema-1',
    });
    const compose = vi.spyOn(actionHarness, 'compose').mockResolvedValue({
      target: {
        uid: 'tab-schema-1',
      },
      mode: 'append',
      blocks: [
        {
          key: 'main.plannedGantt',
          type: 'pluginGantt.gantt',
          uid: 'blueprint-gantt-block',
        },
      ],
    });

    const result = await privateHarness.applyBlueprintWithTransaction(
      {
        mode: 'create',
        tabs: [
          {
            key: 'main',
            blocks: [
              {
                key: 'plannedGantt',
                type: 'pluginGantt.gantt',
                initParams: {
                  collectionName: 'tasks',
                },
                settings: {},
              },
            ],
          },
        ],
      },
      {
        transaction: 'tx-apply-blueprint',
        currentRoles: ['root'],
        skipAuthoringValidation: true,
      },
      [],
      {
        readSurface: false,
      },
    );

    expect(result).toMatchObject({
      version: '1',
      mode: 'create',
      pageLocator: {
        pageSchemaUid: 'page-schema-1',
      },
    });
    expect(compose).toHaveBeenCalledTimes(1);
    expect(compose).toHaveBeenCalledWith(
      expect.objectContaining({
        target: {
          uid: 'tab-schema-1',
        },
        mode: 'append',
        blocks: expect.arrayContaining([
          expect.objectContaining({
            type: 'pluginGantt.gantt',
            initParams: {
              collectionName: 'tasks',
            },
          }),
        ]),
      }),
      expect.objectContaining({
        transaction: 'tx-apply-blueprint',
        currentRoles: ['root'],
        dynamicCapabilityActionName: 'applyBlueprint',
      }),
    );
    expect(privateHarness.ensureSurfaceTableDefaultActionIntegrity).toHaveBeenCalledWith(
      {
        pageSchemaUid: 'page-schema-1',
      },
      expect.objectContaining({
        transaction: 'tx-apply-blueprint',
        enabledPackages,
      }),
    );
  });

  it('should leave ordinary unknown addBlock types on the existing catalog fallback path', async () => {
    const service = new FlowSurfacesService({
      options: {},
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'unknownTimeline',
        },
        options: {
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        blockType: 'unknownTimeline',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).resolves.toBeNull();
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

  it('should keep dry-run override from bypassing missing provider create contracts', async () => {
    const provider = createDryRunProvider({
      withoutResolveCreate: true,
    });

    let error: unknown;
    try {
      await resolveDynamicCapabilityCreate({
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
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect(error).toMatchObject({
      message: `flowSurfaces dynamic create capability 'dryRun' does not declare a create resolver`,
      options: {
        details: {
          reasonCode: 'missing-create-contract',
          reasonSource: 'registry',
          publicType: 'dryRun',
        },
      },
    });
    expect(JSON.stringify(error)).not.toContain('TableBlockModel');
    expect(JSON.stringify(error)).not.toContain('stepParams');
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
                legacyModelUses: ['LegacyGanttBlockModel'],
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
            uid: 'legacy-gantt-1',
            use: 'LegacyGanttBlockModel',
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
    expect(projected.subModels.items[1]).toMatchObject({
      use: 'LegacyGanttBlockModel',
      type: 'gantt',
    });
    expect(projected.subModels.items[2]).toEqual({
      uid: 'table-1',
      use: 'TableBlockModel',
    });
  });

  it('should annotate verified auto snapshot readback nodes with canonical public type', async () => {
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: verifiedAutoPolicy,
      },
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
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
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
    });

    expect(projected.subModels.items[0]).toMatchObject({
      use: 'GanttBlockModel',
      type: 'pluginGantt.gantt',
    });
    expect(projected.subModels.items[0]).not.toHaveProperty('identity');
    expect(projected.subModels.items[1]).toEqual({
      uid: 'table-1',
      use: 'TableBlockModel',
    });
  });

  it('should keep verified auto snapshot readback under manifestOnly downgrade', async () => {
    const manifestOnlyPolicy = {
      writePolicy: {
        mode: 'manifestOnly' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: manifestOnlyPolicy,
      },
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot()],
      flowSurfaceCapabilityAdmissionReports: [createVerifiedAutoAdmissionReport()],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
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
        ],
      },
    };

    const projected = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(tree, {
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
    });

    expect(projected.subModels.items[0]).toMatchObject({
      use: 'GanttBlockModel',
      type: 'pluginGantt.gantt',
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
