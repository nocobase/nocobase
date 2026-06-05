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
import { normalizeComposeFieldSpec } from '../flow-surfaces/service-utils';
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

  type JsonInferredCatalogHarness = {
    buildJsonInferredAutoSnapshotBlockCatalogItems(input: {
      hasTarget: boolean;
      resolved: unknown;
      scenario: Record<string, unknown>;
      selectedSections: string[];
      enabledPackages: ReadonlySet<string>;
    }): Promise<FlowSurfaceCatalogItem[]>;
  };

  type LocatorGetterHarness = {
    readonly locator: {
      resolve(target: FlowSurfaceWriteTarget, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
      findParentUid?(uid: string, transaction?: unknown): Promise<string>;
      resolveCollectionContext?(uid: string, transaction?: unknown): Promise<Record<string, unknown>>;
    };
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
      filterBlocksByTarget(node?: unknown, resolved?: unknown): FlowSurfaceCatalogItem[];
      resolveBlockParent(target: FlowSurfaceWriteTarget, transaction?: unknown): Promise<{ parentUid: string }>;
      resolveFieldContainer(uid: string, transaction?: unknown): Promise<unknown>;
      resolveActionContainer(
        target: FlowSurfaceWriteTarget,
        transaction?: unknown,
      ): Promise<{
        parentUid: string;
        subKey: string;
        subType: string;
        ownerUse: string;
        ownerUid?: string;
      }>;
      collectFilterFormTargets?(uid: string, transaction?: unknown): Promise<unknown[]>;
    };
  };

  type RepositoryGetterHarness = {
    readonly repository: {
      findModelById(uid: string, options?: Record<string, unknown>): Promise<unknown>;
      upsertModel?(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
    };
  };

  type AddActionPrivateHarness = {
    assertApprovalActionSingleton(parentUid: string, actionUse: string, transaction?: unknown): Promise<void>;
    syncFlowTemplateUsagesForNodeTree(rootUid: string, transaction?: unknown): Promise<void>;
    syncApprovalRuntimeConfigForNode(uid: string, transaction?: unknown): Promise<void>;
    collectComposeActionKeys(actionUid: string, transaction?: unknown): Promise<Record<string, unknown>>;
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

  type CollectionGetterHarness = {
    getCollection(dataSourceKey: string, collectionName: string): unknown;
  };

  type FieldCatalogPrivateHarness = {
    buildFieldCatalog(
      target: FlowSurfaceWriteTarget,
      options?: Record<string, unknown>,
    ): Promise<FlowSurfaceCatalogItem[]>;
  };

  type DynamicReadbackProjector = {
    projectDynamicBlockReadbackTypes<T>(
      node: T,
      options: { enabledPackages: ReadonlySet<string>; transaction?: unknown },
    ): Promise<T>;
  };

  function createProviderRegistry(providers: FlowSurfaceCapabilitiesProvider[]) {
    return {
      listProviders: () => providers,
    };
  }

  function createGanttAutoSnapshot(options: { inferredAuthoring?: boolean } = {}) {
    const ganttAllowedActionModelUses = [
      'GanttExpandCollapseActionModel',
      'GanttTodayActionModel',
      'FilterActionModel',
      'AddNewActionModel',
      'PopupCollectionActionModel',
      'BulkDeleteActionModel',
      'LinkActionModel',
      'RefreshActionModel',
      'BulkEditActionModel',
      'BulkUpdateActionModel',
      'ExportActionModel',
      'ImportActionModel',
      'CollectionTriggerWorkflowActionModel',
      'CustomRequestActionModel',
      'AIEmployeeActionModel',
      'JSItemActionModel',
      'JSCollectionActionModel',
    ];
    const snapshot = buildFlowSurfaceAutoSnapshot({
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
          createModelOptionsStatus: options.inferredAuthoring ? 'static' : 'dynamic',
          ...(options.inferredAuthoring
            ? {
                createModelOptionsUse: 'GanttBlockModel',
                createModelOptionsSubModels: {
                  actions: [],
                  columns: ['TableActionsColumnModel'],
                },
              }
            : {}),
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/GanttBlockModel.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
        ...(options.inferredAuthoring
          ? [
              {
                type: 'model.registered' as const,
                modelUse: 'GanttCollectionActionGroupModel',
                className: 'GanttCollectionActionGroupModel',
                source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/actions/GanttActionModels.tsx',
                evidenceSource: 'ast' as const,
                confidence: 'medium' as const,
              },
              ...ganttAllowedActionModelUses.map((actionModelUse, index) => ({
                type: 'menu.itemRegistered' as const,
                menuKey: `allowed-action-${String(index).padStart(2, '0')}`,
                modelUse: actionModelUse,
                slot: 'actions',
                createModelOptionsStatus: 'static' as const,
                createModelOptionsUse: actionModelUse,
                source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/actions/GanttActionModels.tsx',
                evidenceSource: 'ast' as const,
                confidence: 'medium' as const,
              })),
            ]
          : []),
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
    if (!options.inferredAuthoring) {
      delete snapshot.inferredAuthoring;
    }
    return snapshot;
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

  it('should map a verified auto snapshot Gantt payload into a guarded internal node when inferred authoring coexists', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
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
    expect(discovery.data.find((item) => item.publicType === 'pluginGantt.gantt')).toEqual(
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
    );

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
        autoCompleteDefaultPopup: false,
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

  it('should resolve JSON inferred Gantt snapshots into guarded internal create nodes without providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {},
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings.titleField',
          ruleId: 'required',
        }),
        expect.objectContaining({
          path: 'settings.startField',
          ruleId: 'required',
        }),
        expect.objectContaining({
          path: 'settings.endField',
          ruleId: 'required',
        }),
      ],
    });

    const directResponse = await resolveDynamicCapabilityCreate({
      publicType: 'pluginGantt.gantt',
      initParams: {
        collectionName: 'tasks',
        dataSourceKey: 'main',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
        progressField: 'progress',
        colorField: 'status',
        timeScale: 'week',
        pageSize: 50,
        showRowNumbers: true,
        treeTable: false,
        showTable: true,
        tableWidth: 320,
        enableDragToReschedule: true,
      },
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      providerRegistry: createProviderRegistry([]),
      autoSnapshots: [autoSnapshot],
    });

    expect(directResponse.capability).toMatchObject({
      publicType: 'gantt',
      ownerPlugin: '@nocobase/plugin-gantt',
      origin: 'autoSnapshot',
      readiness: 'createEnabled',
      availability: {
        create: {
          supported: true,
          acceptsInitParams: true,
          acceptsSettings: true,
        },
      },
    });
    expect(directResponse.publicPayload).toMatchObject({
      publicType: 'gantt',
      initParams: {
        collectionName: 'tasks',
        dataSourceKey: 'main',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
      },
    });
    expect(directResponse.node).toMatchObject({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
          progress: 'progress',
          color: 'status',
          range: 'week',
        },
      },
      stepParams: {
        resourceSettings: {
          init: {
            collectionName: 'tasks',
            dataSourceKey: 'main',
          },
        },
      },
      subModels: {
        actions: [],
        columns: [
          {
            use: 'TableActionsColumnModel',
          },
        ],
      },
    });
    expect(JSON.stringify(directResponse.publicPayload)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(directResponse.publicPayload)).not.toContain('TableActionsColumnModel');
    expect(JSON.stringify(directResponse.publicPayload)).not.toContain('stepParams');

    const mismatchedRecipeSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const [mismatchedCapability] = mismatchedRecipeSnapshot.inferredAuthoring?.capabilities || [];
    if (!mismatchedCapability?.createRecipe) {
      throw new Error('Expected Gantt inferred authoring create recipe');
    }
    mismatchedCapability.createRecipe.nodeTemplate.use = 'TableBlockModel';

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          titleField: 'title',
          startField: 'startAt',
          endField: 'endAt',
        },
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [mismatchedRecipeSnapshot],
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'settings',
          ruleId: 'contract-guard-failed',
        }),
      ],
    });

    await expect(
      resolveDynamicCapabilityCreate({
        publicType: 'gantt',
        initParams: {
          collectionName: 'tasks',
        },
        settings: {
          titleField: 'title',
          startField: 'startAt',
          endField: 'endAt',
          modelUse: 'GanttBlockModel',
        },
        rawPublicPayload: {
          publicType: 'gantt',
          settings: {
            titleField: 'title',
            startField: 'startAt',
            endField: 'endAt',
            modelUse: 'GanttBlockModel',
          },
        },
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
      }),
    ).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          path: 'payload',
          ruleId: 'unsupported',
        }),
      ],
    });
  });

  it('should allow validate-only JSON inferred dry-runs below high confidence without enabling writes', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const [capability] = autoSnapshot.inferredAuthoring?.capabilities || [];
    if (!capability) {
      throw new Error('Expected Gantt inferred authoring capability');
    }
    capability.confidence.write = 'medium';
    const input = {
      publicType: 'gantt',
      initParams: {
        collectionName: 'tasks',
      },
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
      },
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      providerRegistry: createProviderRegistry([]),
      autoSnapshots: [autoSnapshot],
    };

    await expect(resolveDynamicCapabilityCreate(input)).rejects.toMatchObject({
      message: `flowSurfaces dynamic create capability 'gantt' is not enabled for writes`,
      options: {
        details: expect.objectContaining({
          publicType: 'gantt',
          reasonCode: 'contract-not-verified',
        }),
      },
    });

    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    harness.catalog = async () => ({
      blocks: [],
    });
    const dryRunFromService = await service.validateCapabilityCreate(
      {
        publicType: 'gantt',
        initParams: input.initParams,
        settings: input.settings,
      },
      {
        enabledPackages: input.enabledPackages,
      },
    );
    expect(dryRunFromService.capability.availability.create).toMatchObject({
      supported: false,
      reasonCode: 'contract-not-verified',
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'gantt',
          initParams: input.initParams,
          settings: input.settings,
        },
        options: {
          deferAutoLayout: true,
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages: input.enabledPackages,
        blockType: 'gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'gantt' is not confirmed by target-scoped catalog`,
      options: {
        details: expect.objectContaining({
          reasonCode: 'contract-not-verified',
        }),
      },
    });

    const dryRun = await resolveDynamicCapabilityCreate({
      ...input,
      allowUnavailable: true,
      actionName: 'validateCapabilityCreate',
    });

    expect(dryRun.capability).toMatchObject({
      publicType: 'gantt',
      origin: 'autoSnapshot',
      readiness: 'discovered',
      availability: {
        create: {
          supported: false,
          reasonCode: 'contract-not-verified',
        },
      },
    });
    expect(dryRun.node).toMatchObject({
      use: 'GanttBlockModel',
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
        },
      },
    });
    expect(JSON.stringify(dryRun.publicPayload)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(dryRun.publicPayload)).not.toContain('stepParams');
  });

  it('should gate JSON inferred catalog projection by target placement', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as JsonInferredCatalogHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);

    await expect(
      harness.buildJsonInferredAutoSnapshotBlockCatalogItems({
        hasTarget: true,
        resolved: {
          uid: 'target-grid',
          kind: 'grid',
          target: {
            uid: 'target-grid',
          },
          pageRoute: {
            type: 'page',
          },
        },
        scenario: {
          surfaceKind: 'grid',
        },
        selectedSections: ['blocks'],
        enabledPackages,
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        createSupported: true,
      }),
    ]);

    await expect(
      harness.buildJsonInferredAutoSnapshotBlockCatalogItems({
        hasTarget: true,
        resolved: {
          uid: 'target-grid',
          kind: 'grid',
        },
        scenario: {
          surfaceKind: 'grid',
        },
        selectedSections: ['actions'],
        enabledPackages,
      }),
    ).resolves.toEqual([]);

    await expect(
      harness.buildJsonInferredAutoSnapshotBlockCatalogItems({
        hasTarget: true,
        resolved: {
          uid: 'target-field',
          kind: 'block',
        },
        scenario: {
          surfaceKind: 'block',
          fieldContainer: {
            kind: 'form',
          },
        },
        selectedSections: ['blocks'],
        enabledPackages,
      }),
    ).resolves.toEqual([]);
  });

  it('should persist catalog-confirmed JSON inferred Gantt addBlock candidates through the gated mapping', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const dynamicBlockTypes = await harness.resolveDynamicBlockTypes(enabledPackages);
    const persistedPayloads: Record<string, unknown>[] = [];

    expect(dynamicBlockTypes.has('gantt')).toBe(true);
    expect(dynamicBlockTypes.has('pluginGantt.gantt')).toBe(true);
    harness.catalog = async () => ({
      blocks: [
        {
          key: 'gantt',
          label: 'Gantt',
          use: 'gantt',
          kind: 'block',
          publicType: 'gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        return 'created-gantt-block';
      },
      findModelById: async () => ({
        uid: 'created-gantt-block',
        ...(persistedPayloads[0] || {}),
      }),
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
        settings: {
          titleField: 'title',
          startField: 'startAt',
          endField: 'endAt',
        },
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
      props: {
        fieldNames: {
          title: 'title',
          start: 'startAt',
          end: 'endAt',
        },
      },
      subModels: {
        actions: [],
        columns: [
          {
            use: 'TableActionsColumnModel',
          },
        ],
      },
    });
  });

  it('should expose Gantt child actions from JSON inferred child surfaces without server providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      props: {
        treeTable: true,
      },
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
      subModels: {
        actions: [],
      },
    };

    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async () => ganttNode,
    });
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
      template: 'tree',
    });

    const catalog = await service.catalog(
      {
        target: {
          uid: 'gantt-block',
        },
        sections: ['actions'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoCompleteDefaultPopup: false,
      },
    );

    expect(catalog.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttTodayAction',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
        }),
        expect.objectContaining({
          publicType: 'ganttExpandCollapseAction',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
        }),
        expect.objectContaining({
          publicType: 'filter',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
        }),
        expect.objectContaining({
          publicType: 'addNew',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
        }),
      ]),
    );
    const serialized = JSON.stringify(catalog.actions);
    expect(serialized).not.toContain('GanttTodayActionModel');
    expect(serialized).not.toContain('GanttExpandCollapseActionModel');
  });

  it('should add existing collection fields through JSON inferred Gantt column surfaces without server providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const persistedPayloads: Record<string, unknown>[] = [];
    const persistedNodesByUid = new Map<string, Record<string, unknown>>();
    const titleField = {
      name: 'title',
      type: 'string',
      interface: 'input',
      title: 'Title',
      uiSchema: {
        title: 'Title',
        type: 'string',
      },
      getComponentProps: () => ({}),
      isAssociationField: () => false,
    };
    const projectField = {
      name: 'project',
      type: 'belongsTo',
      interface: 'm2o',
      target: 'projects',
      title: 'Project',
      getComponentProps: () => ({}),
      isAssociationField: () => true,
    };
    const tasksCollection = {
      name: 'tasks',
      dataSourceKey: 'main',
      filterTargetKey: 'id',
      getFields: () => [titleField, projectField],
      getField: (name: string) => {
        if (name === 'title') {
          return titleField;
        }
        if (name === 'project') {
          return projectField;
        }
        return undefined;
      },
    };
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
      subModels: {
        actions: [],
        columns: [],
      },
    };

    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      filterBlocksByTarget: () => [],
      resolveBlockParent: async () => ({
        parentUid: 'gantt-block',
      }),
      resolveFieldContainer: async () => {
        throw new FlowSurfaceBadRequestError(`flowSurfaces addField target 'GanttBlockModel' is not a field container`);
      },
      resolveActionContainer: async () => {
        throw new FlowSurfaceBadRequestError(
          `flowSurfaces addAction target 'GanttBlockModel' is not an action surface`,
        );
      },
      collectFilterFormTargets: async () => [],
    });
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
      resolveCollectionContext: async () => ({
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => persistedNodesByUid.get(String(uid)) || ganttNode,
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        if (payload.uid) {
          persistedNodesByUid.set(String(payload.uid), payload);
        }
        const fieldNode = (payload.subModels as Record<string, unknown> | undefined)?.field as
          | Record<string, unknown>
          | undefined;
        if (fieldNode && typeof fieldNode === 'object' && !Array.isArray(fieldNode) && fieldNode.uid) {
          persistedNodesByUid.set(String(fieldNode.uid), fieldNode as Record<string, unknown>);
        }
        return String(payload.uid || 'created-gantt-column');
      },
    });
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue(tasksCollection);
    const fieldCatalogHarness = service as unknown as FieldCatalogPrivateHarness;

    const catalog = await service.catalog(
      {
        target: {
          uid: 'gantt-block',
        },
        sections: ['fields'],
      },
      {
        enabledPackages,
      },
    );

    expect(catalog.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'title',
          kind: 'field',
          publicType: expect.any(String),
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          supportLevel: 'create-only',
          availability: expect.objectContaining({
            create: expect.objectContaining({
              supported: true,
              acceptsSettings: false,
            }),
            configure: expect.objectContaining({
              supported: false,
              reasonCode: 'contract-not-verified',
            }),
          }),
        }),
      ]),
    );
    const serializedFieldCatalog = JSON.stringify(catalog.fields || []);
    expect(serializedFieldCatalog).not.toContain('jsColumn');
    expect(serializedFieldCatalog).not.toContain('"renderer":"js"');
    expect(serializedFieldCatalog).not.toContain('configureOptions');
    expect(serializedFieldCatalog).not.toContain('settingsSchema');

    const result = await service.addField(
      {
        target: {
          uid: 'gantt-block',
        },
        fieldPath: 'title',
      },
      {
        enabledPackages,
      },
    );

    expect(result).toMatchObject({
      parentUid: 'gantt-block',
      subKey: 'columns',
      fieldPath: 'title',
    });
    expect(persistedPayloads).toHaveLength(1);
    expect(persistedPayloads[0]).toMatchObject({
      parentId: 'gantt-block',
      subKey: 'columns',
      subType: 'array',
      use: 'TableColumnModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
            fieldPath: 'title',
          },
        },
      },
    });

    vi.spyOn(fieldCatalogHarness, 'buildFieldCatalog').mockResolvedValueOnce([]);
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'title',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      message: "flowSurfaces addField JSON inferred field 'title' is not confirmed by target-scoped catalog",
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          fieldPath: 'title',
        },
      },
    });
    expect(persistedPayloads).toHaveLength(1);

    vi.spyOn(fieldCatalogHarness, 'buildFieldCatalog').mockResolvedValueOnce([]);
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'project',
          __autoPopupForRelationField: true,
          __flowSurfaceApplyBlueprintPopupDefaults: {
            source: 'compose',
          },
        },
        {
          enabledPackages,
          allowJsonInferredFieldAutoPopupMetadata: true,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          fieldPath: 'project',
        },
      },
    });
    expect(persistedPayloads).toHaveLength(1);

    const internalStringFieldResult = await service.addField(
      {
        target: {
          uid: 'gantt-block',
        },
        fieldPath: 'project',
        __autoPopupForRelationField: true,
        __flowSurfaceApplyBlueprintPopupDefaults: {
          source: 'compose',
        },
      },
      {
        enabledPackages,
        allowJsonInferredFieldAutoPopupMetadata: true,
      },
    );

    expect(internalStringFieldResult).toMatchObject({
      parentUid: 'gantt-block',
      subKey: 'columns',
      fieldPath: 'project',
    });
    expect(persistedPayloads).toHaveLength(2);
    expect(persistedPayloads[1]).toMatchObject({
      parentId: 'gantt-block',
      subKey: 'columns',
      subType: 'array',
      use: 'TableColumnModel',
      stepParams: {
        fieldSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
            fieldPath: 'project',
          },
        },
      },
    });
    const serializedInternalStringFieldPayload = JSON.stringify(persistedPayloads[1]);
    expect(serializedInternalStringFieldPayload).not.toContain('__autoPopupForRelationField');
    expect(serializedInternalStringFieldPayload).not.toContain('__flowSurfaceApplyBlueprintPopupDefaults');
    expect(serializedInternalStringFieldPayload).not.toContain('popup');

    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          type: 'jsColumn',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      message: 'flowSurfaces addField JSON inferred field surfaces only support existing collection field creates',
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
          forbiddenKeys: ['type'],
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'title',
          renderer: 'js',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          forbiddenKeys: ['renderer'],
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          collectionName: 'otherTasks',
          fieldPath: 'title',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          forbiddenKeys: ['collectionName'],
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          associationPathName: 'project',
          fieldPath: 'name',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          forbiddenKeys: ['associationPathName'],
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'project.name',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          invalidFieldPath: 'project.name',
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'project',
          __autoPopupForRelationField: true,
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          forbiddenKeys: ['__autoPopupForRelationField'],
        },
      },
    });
    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'project',
          __flowSurfaceApplyBlueprintPopupDefaults: {
            source: 'compose',
          },
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          forbiddenKeys: ['__flowSurfaceApplyBlueprintPopupDefaults'],
        },
      },
    });
    expect(persistedPayloads).toHaveLength(2);
  });

  it('should reject public compose field objects that include internal popup metadata', () => {
    expect(() =>
      normalizeComposeFieldSpec(
        {
          key: 'project',
          fieldPath: 'project',
          __autoPopupForRelationField: true,
        },
        0,
      ),
    ).toThrow('flowSurfaces compose field #1 does not accept internal field metadata: __autoPopupForRelationField');
    expect(() =>
      normalizeComposeFieldSpec(
        {
          key: 'project',
          fieldPath: 'project',
          __flowSurfaceApplyBlueprintPopupDefaults: {
            source: 'compose',
          },
        },
        0,
      ),
    ).toThrow(
      'flowSurfaces compose field #1 does not accept internal field metadata: __flowSurfaceApplyBlueprintPopupDefaults',
    );
  });

  it('should reject JSON inferred Gantt field writes when readback binding drifts', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [createGanttAutoSnapshot({ inferredAuthoring: true })],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const titleField = {
      name: 'title',
      type: 'string',
      interface: 'input',
      title: 'Title',
      getComponentProps: () => ({}),
      isAssociationField: () => false,
    };
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
      subModels: {
        actions: [],
        columns: [],
      },
    };
    const persistedNodesByUid = new Map<string, Record<string, unknown>>();

    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      filterBlocksByTarget: () => [],
      resolveBlockParent: async () => ({
        parentUid: 'gantt-block',
      }),
      resolveFieldContainer: async () => {
        throw new FlowSurfaceBadRequestError(`flowSurfaces addField target 'GanttBlockModel' is not a field container`);
      },
      resolveActionContainer: async () => {
        throw new FlowSurfaceBadRequestError(
          `flowSurfaces addAction target 'GanttBlockModel' is not an action surface`,
        );
      },
      collectFilterFormTargets: async () => [],
    });
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
      resolveCollectionContext: async () => ({
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => persistedNodesByUid.get(String(uid)) || ganttNode,
      upsertModel: async (payload) => {
        if (payload.uid) {
          persistedNodesByUid.set(String(payload.uid), payload);
        }
        const fieldNode = (payload.subModels as Record<string, unknown> | undefined)?.field as
          | Record<string, unknown>
          | undefined;
        if (fieldNode?.uid) {
          const driftedFieldNode = JSON.parse(JSON.stringify(fieldNode)) as Record<string, unknown>;
          (
            ((driftedFieldNode.stepParams as Record<string, unknown>).fieldSettings as Record<string, unknown>)
              .init as Record<string, unknown>
          ).fieldPath = 'startAt';
          persistedNodesByUid.set(String(fieldNode.uid), driftedFieldNode);
        }
        return String(payload.uid || 'created-gantt-column');
      },
    });
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
      name: 'tasks',
      dataSourceKey: 'main',
      filterTargetKey: 'id',
      getFields: () => [titleField],
      getField: (name: string) => (name === 'title' ? titleField : undefined),
    });

    await expect(
      service.addField(
        {
          target: {
            uid: 'gantt-block',
          },
          fieldPath: 'title',
        },
        {
          enabledPackages,
        },
      ),
    ).rejects.toMatchObject({
      message: 'flowSurfaces addField JSON inferred field failed readback parity guard',
      options: {
        details: {
          reasonCode: 'readback-parity-failed',
          reasonSource: 'builder',
        },
      },
    });
  });

  it('should keep JSON inferred Gantt field surfaces closed without enabled plugin, json policy, or columns surface', async () => {
    const createService = (input: {
      enabledPackages: ReadonlySet<string>;
      writePolicyMode?: 'manifestOnly';
      hasColumns: boolean;
    }) => {
      const service = new FlowSurfacesService({
        options: input.writePolicyMode
          ? {
              flowSurfaceCapabilities: {
                writePolicy: {
                  mode: input.writePolicyMode,
                },
              },
            }
          : undefined,
        flowSurfaceAutoSnapshots: [createGanttAutoSnapshot({ inferredAuthoring: true })],
        flowSurfaceCapabilityProviders: createProviderRegistry([]),
      } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
      const persistedPayloads: Record<string, unknown>[] = [];
      const titleField = {
        name: 'title',
        type: 'string',
        interface: 'input',
        title: 'Title',
        getComponentProps: () => ({}),
        isAssociationField: () => false,
      };
      const ganttNode = {
        uid: 'gantt-block',
        use: 'GanttBlockModel',
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'tasks',
            },
          },
        },
        subModels: input.hasColumns
          ? {
              actions: [],
              columns: [],
            }
          : {
              actions: [],
            },
      };
      vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
        filterBlocksByTarget: () => [],
        resolveBlockParent: async () => ({
          parentUid: 'gantt-block',
        }),
        resolveFieldContainer: async () => {
          throw new FlowSurfaceBadRequestError(
            `flowSurfaces addField target 'GanttBlockModel' is not a field container`,
          );
        },
        resolveActionContainer: async () => {
          throw new FlowSurfaceBadRequestError(
            `flowSurfaces addAction target 'GanttBlockModel' is not an action surface`,
          );
        },
        collectFilterFormTargets: async () => [],
      });
      vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
        resolve: async () => ({
          uid: 'gantt-block',
          kind: 'block',
          target: {
            uid: 'gantt-block',
          },
          node: ganttNode,
        }),
        findParentUid: async () => '',
        resolveCollectionContext: async () => ({
          resourceInit: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        }),
      });
      vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
        findModelById: async () => ganttNode,
        upsertModel: async (payload) => {
          persistedPayloads.push(payload);
          return String(payload.uid || 'created-gantt-column');
        },
      });
      vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
        name: 'tasks',
        dataSourceKey: 'main',
        filterTargetKey: 'id',
        getFields: () => [titleField],
        getField: (name: string) => (name === 'title' ? titleField : undefined),
      });
      return {
        service,
        persistedPayloads,
        enabledPackages: input.enabledPackages,
      };
    };

    for (const scenario of [
      {
        enabledPackages: new Set<string>(),
        hasColumns: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        writePolicyMode: 'manifestOnly' as const,
        hasColumns: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        hasColumns: false,
      },
    ]) {
      const { service, persistedPayloads, enabledPackages } = createService(scenario);
      const catalog = await service.catalog(
        {
          target: {
            uid: 'gantt-block',
          },
          sections: ['fields'],
        },
        {
          enabledPackages,
        },
      );

      expect(catalog.fields || []).toEqual([]);
      await expect(
        service.addField(
          {
            target: {
              uid: 'gantt-block',
            },
            fieldPath: 'title',
          },
          {
            enabledPackages,
          },
        ),
      ).rejects.toBeInstanceOf(FlowSurfaceBadRequestError);
      expect(persistedPayloads).toHaveLength(0);
    }
  });

  it('should require a writable Gantt action child surface and action conditions before exposing JSON inferred actions', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
      subModels: {
        actions: [],
      },
    };
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async () => ganttNode,
    });
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
      template: 'tree',
    });

    const catalog = await service.catalog(
      {
        target: {
          uid: 'gantt-block',
        },
        sections: ['actions'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );

    expect(catalog.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttTodayAction',
        }),
      ]),
    );
    expect(catalog.actions || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttExpandCollapseAction',
        }),
      ]),
    );

    delete (ganttNode as { subModels?: unknown }).subModels;
    const noMaterializedSurfaceCatalog = await service.catalog(
      {
        target: {
          uid: 'gantt-block',
        },
        sections: ['actions'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    expect(noMaterializedSurfaceCatalog.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttTodayAction',
          ownerPlugin: '@nocobase/plugin-gantt',
        }),
      ]),
    );
    expect(noMaterializedSurfaceCatalog.actions || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttExpandCollapseAction',
        }),
      ]),
    );
  });

  it('should expose and write the first JSON inferred Gantt action after empty action surfaces round trip', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const persistedPayloads: Record<string, unknown>[] = [];
    let ownerNode: Record<string, unknown> = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      stepParams: {
        resourceSettings: {
          init: {
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
    };
    const persistedByUid = new Map<string, Record<string, unknown>>([['gantt-block', ownerNode]]);

    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      filterBlocksByTarget: () => [],
      resolveBlockParent: async () => ({
        parentUid: 'gantt-block',
      }),
      resolveFieldContainer: async () => {
        throw new FlowSurfaceBadRequestError(`flowSurfaces addField target 'GanttBlockModel' is not a field container`);
      },
      resolveActionContainer: async () => {
        throw new FlowSurfaceBadRequestError(
          `flowSurfaces addAction target 'GanttBlockModel' is not an action surface`,
        );
      },
      collectFilterFormTargets: async () => [],
    });
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ownerNode,
      }),
      findParentUid: async () => '',
      resolveCollectionContext: async () => ({
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => persistedByUid.get(uid) || null,
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        const actionNode = {
          uid: 'created-today-action',
          ...payload,
        };
        persistedByUid.set('created-today-action', actionNode);
        ownerNode = {
          ...ownerNode,
          subModels: {
            actions: [actionNode],
          },
        };
        persistedByUid.set('gantt-block', ownerNode);
        return 'created-today-action';
      },
    });
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
      template: 'collection',
    });
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'assertApprovalActionSingleton').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'syncFlowTemplateUsagesForNodeTree').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'syncApprovalRuntimeConfigForNode').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'collectComposeActionKeys').mockResolvedValue({});

    const catalog = await service.catalog(
      {
        target: {
          uid: 'gantt-block',
        },
        sections: ['actions'],
      },
      {
        enabledPackages,
      },
    );

    expect(ownerNode).not.toHaveProperty('subModels');
    expect(catalog.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'ganttTodayAction',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
        }),
      ]),
    );

    const result = await service.addAction(
      {
        target: {
          uid: 'gantt-block',
        },
        type: 'ganttTodayAction',
      },
      {
        enabledPackages,
      },
    );

    expect(result).toMatchObject({
      uid: 'created-today-action',
      parentUid: 'gantt-block',
      subKey: 'actions',
      scope: 'block',
    });
    expect(persistedPayloads).toEqual([
      expect.objectContaining({
        parentId: 'gantt-block',
        subKey: 'actions',
        subType: 'array',
        use: 'GanttTodayActionModel',
      }),
    ]);
  });

  it('should persist JSON inferred Gantt child actions through addAction without server providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const persistedPayloads: Record<string, unknown>[] = [];
    const persistedByUid = new Map<string, Record<string, unknown>>();
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      subModels: {
        actions: [],
      },
    };

    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      filterBlocksByTarget: () => [],
      resolveBlockParent: async () => ({
        parentUid: 'gantt-block',
      }),
      resolveFieldContainer: async () => null,
      resolveActionContainer: async () => ({
        parentUid: 'gantt-actions',
        subKey: 'actions',
        subType: 'array',
        ownerUse: 'GanttBlockModel',
        ownerUid: 'gantt-block',
      }),
      collectFilterFormTargets: async () => [],
    });
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
      resolveCollectionContext: async () => ({
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => persistedByUid.get(uid) || ganttNode,
      upsertModel: async (payload) => {
        const uid =
          payload.use === 'AddNewActionModel'
            ? 'created-add-new-action'
            : payload.use === 'GanttTodayActionModel'
              ? 'created-today-action'
              : 'created-action';
        persistedPayloads.push(payload);
        persistedByUid.set(uid, {
          uid,
          ...payload,
        });
        return uid;
      },
    });
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'assertApprovalActionSingleton').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'syncFlowTemplateUsagesForNodeTree').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'syncApprovalRuntimeConfigForNode').mockResolvedValue(
      undefined,
    );
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'collectComposeActionKeys').mockResolvedValue({});
    vi.spyOn(service as unknown as CollectionGetterHarness, 'getCollection').mockReturnValue({
      template: 'tree',
    });

    const result = await service.addAction(
      {
        target: {
          uid: 'gantt-block',
        },
        type: 'ganttTodayAction',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoCompleteDefaultPopup: false,
      },
    );

    expect(result).toEqual({
      uid: 'created-today-action',
      parentUid: 'gantt-actions',
      subKey: 'actions',
      scope: 'block',
    });
    expect(persistedPayloads).toEqual([
      expect.objectContaining({
        parentId: 'gantt-actions',
        subKey: 'actions',
        subType: 'array',
        use: 'GanttTodayActionModel',
      }),
    ]);
    const todayReadback = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(
      {
        ...ganttNode,
        subModels: {
          actions: [persistedByUid.get('created-today-action')],
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    expect((todayReadback as { subModels: { actions: Array<Record<string, unknown>> } }).subModels.actions[0]).toEqual(
      expect.objectContaining({
        type: 'ganttTodayAction',
      }),
    );
    const customRequestReadback = await (
      service as unknown as DynamicReadbackProjector
    ).projectDynamicBlockReadbackTypes(
      {
        ...ganttNode,
        subModels: {
          actions: [
            {
              uid: 'custom-request-action',
              use: 'CustomRequestActionModel',
            },
          ],
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    expect(
      (customRequestReadback as { subModels: { actions: Array<Record<string, unknown>> } }).subModels.actions[0],
    ).toEqual(
      expect.objectContaining({
        uid: 'custom-request-action',
        use: 'CustomRequestActionModel',
      }),
    );
    expect(
      (customRequestReadback as { subModels: { actions: Array<Record<string, unknown>> } }).subModels.actions[0],
    ).not.toHaveProperty('type');
    const nonTreeExpandReadback = await (
      service as unknown as DynamicReadbackProjector
    ).projectDynamicBlockReadbackTypes(
      {
        uid: 'gantt-non-tree-block',
        use: 'GanttBlockModel',
        props: {
          treeTable: false,
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'tasks',
            },
          },
          tableSettings: {
            treeTable: {
              treeTable: false,
            },
          },
        },
        subModels: {
          actions: [
            {
              uid: 'expand-collapse-action',
              use: 'GanttExpandCollapseActionModel',
            },
          ],
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    expect(
      (nonTreeExpandReadback as { subModels: { actions: Array<Record<string, unknown>> } }).subModels.actions[0],
    ).not.toHaveProperty('type');
    const treeExpandReadback = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(
      {
        uid: 'gantt-tree-block',
        use: 'GanttBlockModel',
        props: {
          treeTable: true,
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
              collectionName: 'tasks',
            },
          },
          tableSettings: {
            treeTable: {
              treeTable: true,
            },
          },
        },
        subModels: {
          actions: [
            {
              uid: 'expand-collapse-action',
              use: 'GanttExpandCollapseActionModel',
            },
          ],
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    expect(
      (treeExpandReadback as { subModels: { actions: Array<Record<string, unknown>> } }).subModels.actions[0],
    ).toEqual(
      expect.objectContaining({
        type: 'ganttExpandCollapseAction',
      }),
    );

    const addNewResult = await service.addAction(
      {
        target: {
          uid: 'gantt-block',
        },
        type: 'addNew',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoCompleteDefaultPopup: false,
      },
    );

    expect(addNewResult).toEqual({
      uid: 'created-add-new-action',
      parentUid: 'gantt-actions',
      subKey: 'actions',
      scope: 'block',
    });
    expect(persistedPayloads[1]).toMatchObject({
      parentId: 'gantt-actions',
      subKey: 'actions',
      subType: 'array',
      use: 'AddNewActionModel',
      props: {
        type: 'primary',
        title: '{{t("Add new")}}',
        icon: 'PlusOutlined',
      },
      stepParams: {
        popupSettings: {
          openView: {
            mode: 'drawer',
            size: 'medium',
            pageModelClass: 'ChildPageModel',
            dataSourceKey: 'main',
            collectionName: 'tasks',
          },
        },
      },
    });

    await expect(
      service.addAction(
        {
          target: {
            uid: 'gantt-block',
          },
          type: 'ganttTodayAction',
          settings: {},
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: expect.objectContaining({
          reasonCode: 'contract-not-verified',
          publicType: 'ganttTodayAction',
        }),
      },
    });

    await expect(
      service.addAction(
        {
          target: {
            uid: 'gantt-block',
          },
          type: 'ganttTodayAction',
        },
        {
          enabledPackages: new Set<string>(),
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceBadRequestError);
  });

  it('should reject JSON inferred Gantt child actions when standard builder defaults drift on readback', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const persistedByUid = new Map<string, Record<string, unknown>>();
    const ganttNode = {
      uid: 'gantt-block',
      use: 'GanttBlockModel',
      subModels: {
        actions: [],
      },
    };

    vi.spyOn(service as unknown as SurfaceContextGetterHarness, 'surfaceContext', 'get').mockReturnValue({
      filterBlocksByTarget: () => [],
      resolveBlockParent: async () => ({
        parentUid: 'gantt-block',
        subKey: 'actions',
        subType: 'array',
      }),
      resolveActionContainer: async () => ({
        ownerUid: 'gantt-block',
        ownerUse: 'GanttBlockModel',
        parentUid: 'gantt-actions',
        subKey: 'actions',
        subType: 'array',
      }),
      resolveFieldContainer: async () => null,
      collectFilterFormTargets: async () => [],
    });
    vi.spyOn(service as unknown as LocatorGetterHarness, 'locator', 'get').mockReturnValue({
      resolve: async () => ({
        uid: 'gantt-block',
        kind: 'block',
        target: {
          uid: 'gantt-block',
        },
        node: ganttNode,
      }),
      findParentUid: async () => '',
      resolveCollectionContext: async () => ({
        resourceInit: {
          dataSourceKey: 'main',
          collectionName: 'tasks',
        },
      }),
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      findModelById: async (uid) => persistedByUid.get(uid) || ganttNode,
      upsertModel: async (payload) => {
        persistedByUid.set('created-add-new-action', {
          uid: 'created-add-new-action',
          ...payload,
          stepParams: {},
        });
        return 'created-add-new-action';
      },
    });
    vi.spyOn(service as unknown as AddActionPrivateHarness, 'assertApprovalActionSingleton').mockResolvedValue(
      undefined,
    );

    await expect(
      service.addAction(
        {
          target: {
            uid: 'gantt-block',
          },
          type: 'addNew',
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
          autoCompleteDefaultPopup: false,
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: expect.objectContaining({
          reasonCode: 'readback-parity-failed',
          reasonSource: 'builder',
          publicType: 'addNew',
        }),
      },
    });
  });

  it('should reject JSON inferred addBlock writes when readback parity fails', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);

    harness.catalog = async () => ({
      blocks: [
        {
          key: 'gantt',
          label: 'Gantt',
          use: 'gantt',
          kind: 'block',
          publicType: 'gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async () => 'created-gantt-block',
      findModelById: async () => ({
        uid: 'created-gantt-block',
        use: 'TableBlockModel',
      }),
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            titleField: 'title',
            startField: 'startAt',
            endField: 'endAt',
          },
        },
        options: {
          deferAutoLayout: true,
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages,
        blockType: 'gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'gantt' failed readback parity guard`,
      options: {
        details: expect.objectContaining({
          reasonCode: 'readback-parity-failed',
          reasonSource: 'builder',
        }),
      },
    });
  });

  it('should reject JSON inferred Gantt addBlock writes when public settings or default subtrees drift on readback', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    let persistedPayload: Record<string, unknown> = {};

    harness.catalog = async () => ({
      blocks: [
        {
          key: 'gantt',
          label: 'Gantt',
          use: 'gantt',
          kind: 'block',
          publicType: 'gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayload = payload;
        return 'created-gantt-block';
      },
      findModelById: async () => ({
        uid: 'created-gantt-block',
        ...persistedPayload,
        props: {
          ...((persistedPayload.props as Record<string, unknown>) || {}),
          showTable: false,
        },
        subModels: {
          ...((persistedPayload.subModels as Record<string, unknown>) || {}),
          columns: [],
        },
      }),
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            titleField: 'title',
            startField: 'startAt',
            endField: 'endAt',
            pageSize: 50,
            showRowNumbers: true,
            showTable: true,
            tableWidth: 320,
            enableDragToReschedule: true,
          },
        },
        options: {
          deferAutoLayout: true,
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages,
        blockType: 'gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'gantt' failed readback parity guard`,
      options: {
        details: expect.objectContaining({
          reasonCode: 'readback-parity-failed',
          reasonSource: 'builder',
        }),
      },
    });
  });

  it('should reject JSON inferred Gantt addBlock writes when the actions child surface is missing on readback', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const service = new FlowSurfacesService({
      flowSurfaceAutoSnapshots: [autoSnapshot],
      flowSurfaceCapabilityProviders: createProviderRegistry([]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    let persistedPayload: Record<string, unknown> = {};

    harness.catalog = async () => ({
      blocks: [
        {
          key: 'gantt',
          label: 'Gantt',
          use: 'gantt',
          kind: 'block',
          publicType: 'gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          origin: 'autoSnapshot',
          createSupported: true,
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
    });
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayload = payload;
        return 'created-gantt-block';
      },
      findModelById: async () => {
        const subModels = (persistedPayload.subModels as Record<string, unknown>) || {};
        return {
          uid: 'created-gantt-block',
          ...persistedPayload,
          subModels: {
            columns: subModels.columns,
          },
        };
      },
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          target: {
            uid: 'target-grid',
          },
          type: 'gantt',
          initParams: {
            collectionName: 'tasks',
          },
          settings: {
            titleField: 'title',
            startField: 'startAt',
            endField: 'endAt',
          },
        },
        options: {
          deferAutoLayout: true,
          dynamicCapabilityActionName: 'addBlock',
        },
        enabledPackages,
        blockType: 'gantt',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'gantt' failed readback parity guard`,
      options: {
        details: expect.objectContaining({
          reasonCode: 'readback-parity-failed',
          reasonSource: 'builder',
        }),
      },
    });
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
            key: 'dryRun',
            label: 'Dry run',
            use: providerModelUse,
            kind: 'block',
            publicType: 'dryRun',
            ownerPlugin: '@nocobase/plugin-dry-run',
            origin: 'provider',
            createSupported: true,
            availability: {
              render: {
                supported: true,
              },
              readback: {
                supported: true,
              },
              create: {
                supported: true,
              },
              configure: {
                supported: false,
              },
            },
          },
        ],
      };
    };

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

  it('should require target catalog confirmation before provider block writes', async () => {
    const provider = createDryRunProvider();
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    harness.catalog = async (input, options) => {
      expect(input).toMatchObject({
        target: {
          uid: 'target-grid',
        },
        sections: ['blocks'],
      });
      expect(options.enabledPackages).toBe(enabledPackages);
      return {
        blocks: [],
      };
    };
    type RepositoryCreateHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
      };
    };
    const upsertModel = vi.fn(async () => 'created-dry-run');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
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
        blockType: 'dryRun',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'dryRun' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'dryRun',
        },
      },
    });
    expect(upsertModel).not.toHaveBeenCalled();
  });

  it('should reject provider writes confirmed only by a non-block catalog item', async () => {
    const provider = createDryRunProvider();
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
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
            key: 'dryRun',
            label: 'Dry run',
            use: 'dryRun',
            kind: 'action',
            publicType: 'dryRun',
            ownerPlugin: '@nocobase/plugin-dry-run',
            origin: 'provider',
            createSupported: true,
            availability: {
              render: {
                supported: true,
              },
              readback: {
                supported: true,
              },
              create: {
                supported: true,
              },
              configure: {
                supported: false,
              },
            },
          },
        ],
      };
    };
    type RepositoryCreateHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
      };
    };
    const upsertModel = vi.fn(async () => 'created-dry-run');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
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
        blockType: 'dryRun',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'dryRun' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'dryRun',
        },
      },
    });
    expect(upsertModel).not.toHaveBeenCalled();
  });

  it('should reject provider writes confirmed only by an auto snapshot catalog item', async () => {
    const provider = createDryRunProvider();
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    harness.catalog = async () => ({
      blocks: [
        {
          key: 'dryRun',
          label: 'Dry run',
          use: 'dryRun',
          kind: 'block',
          publicType: 'dryRun',
          ownerPlugin: '@nocobase/plugin-dry-run',
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
              supported: true,
            },
            configure: {
              supported: false,
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
    const upsertModel = vi.fn(async () => 'created-dry-run');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
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
        blockType: 'dryRun',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'dryRun' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'dryRun',
        },
      },
    });
    expect(upsertModel).not.toHaveBeenCalled();
  });

  it('should reject provider writes when target catalog createSupported is false', async () => {
    const provider = createDryRunProvider();
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    harness.catalog = async () => ({
      blocks: [
        {
          key: 'dryRun',
          label: 'Dry run',
          use: 'TableBlockModel',
          kind: 'block',
          publicType: 'dryRun',
          ownerPlugin: '@nocobase/plugin-dry-run',
          origin: 'provider',
          createSupported: false,
          availability: {
            render: {
              supported: true,
            },
            readback: {
              supported: true,
            },
            create: {
              supported: true,
            },
            configure: {
              supported: false,
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
    const upsertModel = vi.fn(async () => 'created-dry-run');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
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
        blockType: 'dryRun',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
      }),
    ).rejects.toMatchObject({
      message: `flowSurfaces addBlock dynamic block 'dryRun' is not confirmed by target-scoped catalog`,
      options: {
        details: {
          reasonCode: 'contract-not-verified',
          reasonSource: 'catalog',
          publicType: 'dryRun',
        },
      },
    });
    expect(upsertModel).not.toHaveBeenCalled();
  });

  it('should keep provider block writes read-only under discoveryOnly policy before catalog confirmation', async () => {
    const provider = createDryRunProvider();
    const enabledPackages = new Set(['@nocobase/plugin-dry-run']);
    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: {
          writePolicy: {
            mode: 'discoveryOnly' as const,
          },
        },
      },
      flowSurfaceCapabilityProviders: createProviderRegistry([provider]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const harness = service as unknown as DynamicBlockWriteGateHarness;
    const catalog = vi.fn(async () => ({
      blocks: [
        {
          key: 'dryRun',
          label: 'Dry run',
          use: 'dryRun',
          kind: 'block',
          publicType: 'dryRun',
          ownerPlugin: '@nocobase/plugin-dry-run',
          origin: 'provider',
          createSupported: true,
        },
      ],
    }));
    harness.catalog = catalog;
    type RepositoryCreateHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
      };
    };
    const upsertModel = vi.fn(async () => 'created-dry-run');
    vi.spyOn(service as unknown as RepositoryCreateHarness, 'repository', 'get').mockReturnValue({
      upsertModel,
    });

    await expect(
      harness.tryAddDynamicBlock({
        values: {
          type: 'dryRun',
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
        blockType: 'dryRun',
        target: {
          uid: 'target-grid',
        },
        parentUid: 'parent-grid',
        subKey: 'items',
        subType: 'array',
        popupProfile: null,
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
    expect(catalog).not.toHaveBeenCalled();
    expect(upsertModel).not.toHaveBeenCalled();
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

  it('should persist catalog-confirmed verified auto snapshot addBlock candidates when inferred authoring coexists', async () => {
    const auditLog = vi.fn();
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
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
    expect(dynamicBlockTypes.has('gantt')).toBe(true);
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
            ownerPlugin: '@nocobase/plugin-gantt',
            origin: 'autoSnapshot',
            createSupported: true,
          },
        ],
      };
    };
    type RepositoryGetterHarness = {
      readonly repository: {
        upsertModel(payload: Record<string, unknown>, options?: Record<string, unknown>): Promise<string>;
        findModelById(uid: string, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
      };
    };
    type DynamicReadbackProjector = {
      projectDynamicBlockReadbackTypes<T>(node: T, options: { enabledPackages: ReadonlySet<string> }): Promise<T>;
    };
    vi.spyOn(service as unknown as RepositoryGetterHarness, 'repository', 'get').mockReturnValue({
      upsertModel: async (payload) => {
        persistedPayloads.push(payload);
        return 'created-gantt-block';
      },
      findModelById: async () => ({
        uid: 'created-gantt-block',
        ...(persistedPayloads[0] || {}),
      }),
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
    const projectedReadbackPayload = await (
      service as unknown as DynamicReadbackProjector
    ).projectDynamicBlockReadbackTypes(persistedPayloads[0], {
      enabledPackages,
    });
    expect(projectedReadbackPayload).toMatchObject({
      use: 'GanttBlockModel',
      type: 'pluginGantt.gantt',
    });
    expect(projectedReadbackPayload).not.toHaveProperty('identity');
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

  it('should reject target catalog items whose owner does not match the auto snapshot capability', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
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
          ownerPlugin: '@nocobase/plugin-other',
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
              supported: true,
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
          resourceInit: {
            collectionName: 'tasks',
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
            uid: 'already-public-gantt-1',
            use: 'GanttBlockModel',
            type: 'customGantt',
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
      uid: 'already-public-gantt-1',
      use: 'GanttBlockModel',
      type: 'customGantt',
    });
    expect(projected.subModels.items[3]).toEqual({
      uid: 'table-1',
      use: 'TableBlockModel',
    });
  });

  it('should not annotate dynamic provider readback nodes when the owner plugin is disabled', async () => {
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
        ],
      },
    };

    const projected = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(tree, {
      enabledPackages: new Set<string>(),
    });

    expect(projected.subModels.items[0]).toEqual({
      uid: 'gantt-1',
      use: 'GanttBlockModel',
    });
    expect(projected.subModels.items[1]).toEqual({
      uid: 'legacy-gantt-1',
      use: 'LegacyGanttBlockModel',
    });
  });

  it('should not annotate provider readback nodes when readback is unsupported', async () => {
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([
        {
          ownerPlugin: '@nocobase/plugin-no-readback',
          getCapabilities: () => [
            {
              id: 'blocks.noReadback',
              kind: 'block',
              publicType: 'noReadback',
              label: 'No readback',
              semantic: {
                title: 'No readback',
              },
              implementation: {
                modelUse: 'NoReadbackBlockModel',
              },
              availability: {
                readback: {
                  supported: false,
                  reasonCode: 'readback-unsupported',
                  reasonSource: 'registry',
                },
                create: {
                  supported: true,
                },
              },
            },
          ],
          resolveCreate: () => ({
            use: 'NoReadbackBlockModel',
          }),
        },
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
            uid: 'no-readback-1',
            use: 'NoReadbackBlockModel',
          },
        ],
      },
    };

    const projected = await (service as unknown as DynamicReadbackProjector).projectDynamicBlockReadbackTypes(tree, {
      enabledPackages: new Set(['@nocobase/plugin-no-readback']),
    });

    expect(projected.subModels.items[0]).toEqual({
      uid: 'no-readback-1',
      use: 'NoReadbackBlockModel',
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
