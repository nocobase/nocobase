/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  buildFlowSurfaceCapabilitiesResponse,
  buildFlowSurfaceDescribeCapabilityResponse,
} from '../flow-surfaces/capabilities';
import { FlowSurfacesService } from '../flow-surfaces/service';
import {
  collectAutoSnapshotPublicCapabilities,
  collectJsonInferredAutoSnapshotCatalogItems,
  collectProviderCatalogItems,
  collectVerifiedAutoSnapshotCatalogItems,
  filterProviderCatalogItemsForCatalog,
} from '../flow-surfaces/capability-registry';
import {
  normalizeFlowSurfaceCapabilityPolicyConfig,
  readFlowSurfaceCapabilityPolicyConfigFromPluginOptions,
  resolveFlowSurfaceVerifiedAutoAdmissionDecision,
} from '../flow-surfaces/capability-policy';
import { FlowSurfaceCapabilityProviderRegistry } from '../flow-surfaces/capability-provider';
import type { FlowSurfaceCapabilityAdmissionReport } from '../flow-surfaces/admission-report';
import { FlowSurfaceBadRequestError, FlowSurfaceForbiddenError } from '../flow-surfaces/errors';
import { buildFlowSurfaceAutoSnapshot } from '../flow-surfaces/extractor';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCapabilitiesValues,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityManifestItem,
  FlowSurfaceCapabilityWarning,
  FlowSurfaceCatalogItem,
  FlowSurfaceCatalogResponse,
  FlowSurfaceCatalogValues,
} from '../flow-surfaces/types';

describe('flowSurfaces capabilities projection', () => {
  type ProviderCatalogItemsService = {
    buildProviderCatalogItems(input: {
      kind: 'block' | 'action' | 'field';
      enabledPackages: ReadonlySet<string>;
    }): Promise<FlowSurfaceCatalogItem[]>;
  };
  type DynamicBlockCapabilityService = {
    resolveDynamicBlockCapability(
      publicType: string,
      enabledPackages: ReadonlySet<string>,
    ): Promise<{ publicItem: { publicType: string } } | null>;
  };

  function createProviderRegistry(providers: FlowSurfaceCapabilitiesProvider[]) {
    return {
      listProviders: () => providers,
    };
  }

  it('should normalize and replace capability providers by owner plugin', () => {
    const registry = new FlowSurfaceCapabilityProviderRegistry();
    const firstGetCapabilities = () => [];
    const replacementGetCapabilities = () => [];

    registry.registerProvider({
      ownerPlugin: ' @nocobase/plugin-dry-run ',
      getCapabilities: firstGetCapabilities,
    });
    expect(registry.getRevision()).toBe('1');
    expect(registry.getVersion()).toBe('1');
    expect(registry.listProviders()).toEqual([
      expect.objectContaining({
        ownerPlugin: '@nocobase/plugin-dry-run',
        getCapabilities: firstGetCapabilities,
      }),
    ]);

    registry.registerProvider({
      ownerPlugin: '@nocobase/plugin-dry-run',
      getCapabilities: replacementGetCapabilities,
    });
    expect(registry.getRevision()).toBe('2');
    expect(registry.getVersion()).toBe('2');
    expect(registry.listProviders()).toEqual([
      expect.objectContaining({
        ownerPlugin: '@nocobase/plugin-dry-run',
        getCapabilities: replacementGetCapabilities,
      }),
    ]);
    expect(registry.listWarnings()).toEqual([
      expect.objectContaining({
        code: 'duplicate-provider',
        ownerPlugin: '@nocobase/plugin-dry-run',
      }),
    ]);

    registry.unregisterProvider(' @nocobase/plugin-dry-run ');
    expect(registry.getRevision()).toBe('3');
    expect(registry.getVersion()).toBe('3');
    expect(registry.listProviders()).toEqual([]);

    registry.unregisterProvider('@nocobase/plugin-dry-run');
    expect(registry.getRevision()).toBe('3');
    expect(registry.getVersion()).toBe('3');
  });

  it('should skip invalid capability providers without changing revision', () => {
    const registry = new FlowSurfaceCapabilityProviderRegistry();

    registry.registerProvider({
      ownerPlugin: ' ',
      getCapabilities: () => [],
    });
    registry.registerProvider({
      ownerPlugin: '@nocobase/plugin-invalid-provider',
    } as unknown as FlowSurfaceCapabilitiesProvider);

    expect(registry.getRevision()).toBe('0');
    expect(registry.getVersion()).toBe('0');
    expect(registry.listProviders()).toEqual([]);
    expect(registry.listWarnings()).toEqual([
      expect.objectContaining({
        code: 'invalid-provider',
        message: expect.stringContaining('ownerPlugin is empty'),
      }),
      expect.objectContaining({
        code: 'invalid-provider',
        ownerPlugin: '@nocobase/plugin-invalid-provider',
        message: expect.stringContaining('getCapabilities is missing'),
      }),
    ]);
  });

  function createGanttProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-gantt',
      getCapabilities: () => [
        {
          id: 'blocks.gantt',
          capabilityVersion: '1.0.0',
          kind: 'block',
          publicType: 'gantt',
          acceptedAliases: ['ganttBlock', '@nocobase/plugin-gantt:gantt'],
          label: 'Gantt',
          semantic: {
            title: 'Gantt',
            description: 'Visualizes collection records on a time scale.',
            aliases: ['gantt', 'timeline'],
          },
          placement: {
            scenes: ['page', 'tab'],
            slots: ['blocks'],
            collectionRequired: true,
          },
          implementation: {
            modelUse: 'GanttBlockModel',
          },
          availability: {
            create: {
              supported: true,
            },
            configure: {
              supported: false,
              reasonCode: 'contract-not-verified',
              reasonSource: 'registry',
            },
          },
          supportLevel: 'create-only',
          initParamsSchema: {
            type: 'object',
            required: ['collectionName'],
            properties: {
              collectionName: {
                type: 'string',
              },
            },
          },
          settingsSchema: {
            type: 'object',
            properties: {
              titleField: {
                type: 'string',
              },
              startField: {
                type: 'string',
              },
              endField: {
                type: 'string',
              },
              displaySettings: {
                type: 'object',
              },
            },
          },
          configureOptions: {
            titleField: {
              type: 'string',
            },
          },
          warnings: [
            {
              code: 'contract-not-verified',
              message: 'Gantt configure writes remain disabled in this test fixture.',
            },
          ],
        },
      ],
      resolveCreate: () => ({
        use: 'GanttBlockModel',
      }),
    };
  }

  function createAutoNamespacedGanttProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-gantt',
      getCapabilities: () => [
        {
          id: 'gantt',
          kind: 'block',
          label: 'Gantt provider',
          semantic: {
            title: 'Gantt provider',
          },
          implementation: {
            modelUse: 'GanttBlockModel',
          },
          availability: {
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
      resolveCreate: () => ({
        use: 'GanttBlockModel',
      }),
    };
  }

  function createRenamedGanttProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-gantt',
      getCapabilities: () => [
        {
          id: 'blocks.renamedGantt',
          capabilityVersion: '2.0.0',
          kind: 'block',
          publicType: 'renamedGantt',
          label: 'Renamed Gantt',
          semantic: {
            title: 'Renamed Gantt',
          },
          implementation: {
            modelUse: 'RenamedGanttBlockModel',
            legacyModelUses: ['GanttBlockModel', 'LegacyTimelineBlockModel'],
          },
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
      resolveCreate: () => ({
        use: 'RenamedGanttBlockModel',
      }),
    };
  }

  function createActionProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-action-provider',
      getCapabilities: () => [
        {
          id: 'actions.external',
          kind: 'action',
          publicType: 'externalAction',
          label: 'External action',
          semantic: {
            title: 'External action',
          },
          implementation: {
            modelUse: 'ExternalActionModel',
          },
        },
      ],
      resolveCreate: () => ({
        use: 'GanttBlockModel',
      }),
    };
  }

  function createConflictingTableProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-conflict',
      getCapabilities: () => [
        {
          id: 'blocks.tableConflict',
          kind: 'block',
          publicType: 'table',
          label: 'Table alternative',
          semantic: {
            title: 'Table alternative',
            aliases: ['table'],
          },
          implementation: {
            modelUse: 'TableAlternativeBlockModel',
          },
          availability: {
            render: {
              supported: true,
            },
            readback: {
              supported: true,
            },
          },
        },
      ],
    };
  }

  function createRenderUnsupportedProvider(): FlowSurfaceCapabilitiesProvider {
    return {
      ownerPlugin: '@nocobase/plugin-hidden',
      getCapabilities: () => [
        {
          id: 'blocks.hiddenRender',
          kind: 'block',
          publicType: 'hiddenRender',
          label: 'Hidden render',
          semantic: {
            title: 'Hidden render',
          },
          implementation: {
            modelUse: 'HiddenRenderBlockModel',
          },
          availability: {
            render: {
              supported: false,
              reasonCode: 'unsupported',
              reasonSource: 'provider',
            },
            readback: {
              supported: true,
            },
          },
        },
      ],
    };
  }

  function createGanttAutoSnapshot(
    options: {
      flowKey?: string;
      flowTitle?: string;
      menuKey?: string;
      menuLabel?: string;
      modelUse?: string;
      inferredAuthoring?: boolean;
      warnings?: FlowSurfaceCapabilityWarning[];
    } = {},
  ) {
    const modelUse = options.modelUse || 'GanttBlockModel';
    const menuKey = options.menuKey || 'gantt';
    const ganttAllowedActionModelUses = [
      'GanttExpandCollapseActionModel',
      'GanttTodayActionModel',
      'FilterActionModel',
      'RefreshActionModel',
      'BulkDeleteActionModel',
      'AddNewActionModel',
      'PopupCollectionActionModel',
      'LinkActionModel',
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
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'snapshot-source-hash',
      extractorVersion: 'test',
      warnings: options.warnings,
      events: [
        {
          type: 'model.registered',
          modelUse,
          className: modelUse,
          source: 'packages/plugins/@nocobase/plugin-gantt/src/client-v2/plugin.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey,
          label: options.menuLabel || 'Gantt',
          modelUse,
          slot: 'blocks',
          createModelOptionsStatus: options.inferredAuthoring ? 'static' : 'dynamic',
          ...(options.inferredAuthoring
            ? {
                createModelOptionsUse: modelUse,
                createModelOptionsSubModels: {
                  actions: [],
                  columns: ['TableActionsColumnModel'],
                },
              }
            : {}),
          source: `packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/${modelUse}.tsx`,
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
          modelUse,
          flowKey: options.flowKey || `${menuKey}Settings`,
          title: options.flowTitle || 'Gantt settings',
          staticStatus: 'static',
          source: `packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/${modelUse}.settings.tsx`,
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

  function createCalendarAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-calendar',
      pluginVersion: '1.0.0',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'calendar-source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'CalendarBlockModel',
          className: 'CalendarBlockModel',
          source: 'packages/plugins/@nocobase/plugin-calendar/src/client-v2/plugin.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'calendar',
          label: 'Calendar',
          modelUse: 'CalendarBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          source: 'packages/plugins/@nocobase/plugin-calendar/src/client-v2/models/CalendarBlockModel.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createSnapshotStaleWarning(message = 'Snapshot was generated before the current plugin build.') {
    return {
      code: 'snapshot-stale' as const,
      message,
    };
  }

  function createTableAlternativeAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-conflict',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'snapshot-source-hash',
      extractorVersion: 'test',
      warnings: [
        {
          code: 'readback-parity-missing',
          message: 'Snapshot readback parity has not been checked.',
        },
      ],
      events: [
        {
          type: 'model.registered',
          modelUse: 'TableAlternativeBlockModel',
          className: 'TableAlternativeBlockModel',
          source: 'packages/plugins/@nocobase/plugin-conflict/src/client-v2/plugin.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'tableAlternative',
          label: 'Shadow table alternative',
          modelUse: 'TableAlternativeBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          source: 'packages/plugins/@nocobase/plugin-conflict/src/client-v2/plugin.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createUnsafeAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-unsafe',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'unsafe-source-hash',
      extractorVersion: 'test',
      warnings: [
        {
          code: 'snapshot-stale',
          message: 'UnsafeBlockModel metadata came from packages/foo/src/client.tsx with props.',
        },
      ],
      events: [
        {
          type: 'model.registered',
          modelUse: 'UnsafeBlockModel',
          className: 'UnsafeBlockModel',
          source: 'packages/foo/src/client.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'unsafe',
          label: 'UnsafeBlockModel packages/foo/src/client.tsx',
          modelUse: 'UnsafeBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          source: 'packages/foo/src/client.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createUnsafePublicTypeAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-unsafe',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'unsafe-public-type-source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'PropsBlockModel',
          className: 'PropsBlockModel',
          source: 'packages/foo/src/PropsBlockModel.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'props',
          label: 'Props',
          modelUse: 'PropsBlockModel',
          slot: 'blocks',
          createModelOptionsStatus: 'static',
          source: 'packages/foo/src/PropsBlockModel.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createInputFieldAutoSnapshot() {
    return buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-fields',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'field-source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'InputFieldModel',
          className: 'InputFieldModel',
          source: 'packages/plugins/@nocobase/plugin-fields/src/client/InputFieldModel.tsx',
          evidenceSource: 'runtime',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'input',
          label: 'Input',
          modelUse: 'InputFieldModel',
          slot: 'fields',
          createModelOptionsStatus: 'static',
          source: 'packages/plugins/@nocobase/plugin-fields/src/client/InputFieldModel.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
  }

  function createCatalogRecorder() {
    const calls: FlowSurfaceCatalogValues[] = [];
    return {
      calls,
      catalog: async (values: FlowSurfaceCatalogValues) => {
        calls.push(values);
        const sections = new Set(values.sections || []);
        const expand = new Set(values.expand || []);
        return {
          target: null,
          scenario: {
            surfaceKind: 'global' as const,
          },
          selectedSections: values.sections || [],
          blocks: sections.has('blocks')
            ? [
                {
                  key: 'table',
                  label: 'Table',
                  use: 'TableBlockModel',
                  kind: 'block' as const,
                  publicType: 'table',
                  ownerPlugin: '@nocobase/core/client',
                  origin: 'builtInStatic' as const,
                  confidence: 'high' as const,
                  supportLevel: 'create-and-configure' as const,
                  availability: {
                    render: { supported: true },
                    readback: { supported: true },
                    create: { supported: true, acceptsInitParams: true, acceptsSettings: true },
                    configure: { supported: true },
                  },
                  semantic: {
                    title: 'Table',
                    description: 'Collection table block',
                    aliases: ['table', 'TableBlockModel'],
                  },
                  requiredInitParams: ['dataSourceKey', 'collectionName'],
                  ...(expand.has('item.contracts')
                    ? {
                        settingsSchema: {
                          type: 'object',
                          properties: {
                            pageSize: {
                              type: 'number',
                            },
                            title: {
                              type: 'string',
                            },
                          },
                        },
                      }
                    : {}),
                  configureOptions: {
                    pageSize: {
                      type: 'number' as const,
                    },
                  },
                  ...(expand.has('item.identity')
                    ? {
                        identity: {
                          capabilityId: 'builtInStatic:block:core:table',
                        },
                      }
                    : {}),
                },
              ]
            : undefined,
          actions: sections.has('actions')
            ? [
                {
                  key: 'refresh',
                  label: 'Refresh',
                  use: 'RefreshActionModel',
                  kind: 'action' as const,
                  publicType: 'refresh',
                  ownerPlugin: '@nocobase/core/client',
                  origin: 'builtInStatic' as const,
                  confidence: 'high' as const,
                  supportLevel: 'create-only' as const,
                  availability: {
                    render: { supported: true },
                    readback: { supported: true },
                    create: { supported: true },
                    configure: {
                      supported: false,
                      reasonCode: 'unsupported' as const,
                      reasonSource: 'catalog' as const,
                    },
                  },
                  semantic: {
                    title: 'Refresh',
                  },
                },
              ]
            : undefined,
          recordActions: sections.has('recordActions') ? [] : undefined,
          fields: sections.has('fields')
            ? [
                {
                  key: 'nickname',
                  label: 'Nickname',
                  use: 'InputFieldModel',
                  kind: 'field' as const,
                  publicType: 'input',
                  ownerPlugin: '@nocobase/core/client',
                  origin: 'builtInStatic' as const,
                  confidence: 'high' as const,
                  supportLevel: 'create-only' as const,
                  availability: {
                    render: { supported: true },
                    readback: { supported: true },
                    create: { supported: true },
                    configure: {
                      supported: false,
                      reasonCode: 'unsupported' as const,
                      reasonSource: 'catalog' as const,
                    },
                  },
                  semantic: {
                    title: 'Nickname',
                  },
                },
                {
                  key: 'script',
                  label: 'Script',
                  use: 'CodeFieldModel',
                  kind: 'field' as const,
                  publicType: 'code',
                  ownerPlugin: '@nocobase/plugin-field-code',
                  origin: 'builtInStatic' as const,
                  confidence: 'high' as const,
                  supportLevel: 'create-only' as const,
                  availability: {
                    render: { supported: true },
                    readback: { supported: true },
                    create: { supported: true },
                    configure: {
                      supported: false,
                      reasonCode: 'unsupported' as const,
                      reasonSource: 'catalog' as const,
                    },
                  },
                  semantic: {
                    title: 'Script',
                  },
                  ...(expand.has('item.identity')
                    ? {
                        identity: {
                          capabilityId: 'builtInStatic:fieldComponent:%40nocobase%2Fplugin-field-code:code',
                        },
                      }
                    : {}),
                },
              ]
            : undefined,
        };
      },
    };
  }

  function createAutoSnapshotService(autoSnapshots: readonly ReturnType<typeof createGanttAutoSnapshot>[]) {
    const recorder = createCatalogRecorder();
    class AutoSnapshotFlowSurfacesService extends FlowSurfacesService {
      override async catalog(input: FlowSurfaceCatalogValues): Promise<FlowSurfaceCatalogResponse> {
        return recorder.catalog(input);
      }
    }
    return {
      recorder,
      service: new AutoSnapshotFlowSurfacesService({
        flowSurfaceAutoSnapshots: autoSnapshots,
      } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]),
    };
  }

  function createDiagnosticsService(
    options: {
      autoSnapshots?: readonly ReturnType<typeof createGanttAutoSnapshot>[];
      snapshotWarnings?: Array<{
        source: 'snapshot';
        code: string;
        fileName: string;
        message: string;
      }>;
      providerRegistry?: ReturnType<typeof createProviderRegistry> | FlowSurfaceCapabilityProviderRegistry;
      pluginOptions?: Record<string, unknown>;
    } = {},
  ) {
    const recorder = createCatalogRecorder();
    class DiagnosticsFlowSurfacesService extends FlowSurfacesService {
      override async catalog(input: FlowSurfaceCatalogValues): Promise<FlowSurfaceCatalogResponse> {
        return recorder.catalog(input);
      }
    }
    return {
      recorder,
      service: new DiagnosticsFlowSurfacesService({
        options: options.pluginOptions || {},
        flowSurfaceAutoSnapshots: options.autoSnapshots || [],
        flowSurfaceAutoSnapshotLoadWarnings: options.snapshotWarnings || [],
        ...(options.providerRegistry ? { flowSurfaceCapabilityProviders: options.providerRegistry } : {}),
      } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]),
    };
  }

  function createDiagnosticsAdmissionChecks(
    overrides: Partial<FlowSurfaceCapabilityAdmissionReport['records'][number]['checks']> = {},
  ): FlowSurfaceCapabilityAdmissionReport['records'][number]['checks'] {
    return {
      discovered: { ok: true },
      publicTypeStable: { ok: true },
      contractDeclared: { ok: true },
      targetCatalogVerified: { ok: true },
      dryRunCreate: { ok: true },
      readbackParity: { ok: true },
      unsafePayloadBlocked: { ok: true },
      testsPresent: { ok: true },
      ...overrides,
    };
  }

  function createDiagnosticsAdmissionReport(): FlowSurfaceCapabilityAdmissionReport {
    return {
      version: 1,
      plugin: '@nocobase/plugin-gantt',
      generatedAt: '2026-06-04T00:00:00.000Z',
      records: [
        {
          capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
          kind: 'block',
          publicType: 'gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          readiness: 'blocked',
          updatedAt: '2026-06-04T00:00:00.000Z',
          checks: createDiagnosticsAdmissionChecks({
            targetCatalogVerified: { ok: false, reasonCode: 'target-required', message: 'Target catalog missing.' },
            dryRunCreate: {
              ok: false,
              reasonCode: 'dry-run-failed',
              message: 'Dry-run failed.',
              evidence: {
                internalModelUse: 'InternalEvidenceModel',
              },
            },
            readbackParity: { ok: false, reasonCode: 'readback-parity-failed' },
            unsafePayloadBlocked: { ok: false, reasonCode: 'unsafe-auto-discovery' },
            testsPresent: { ok: false, reasonCode: 'unsupported' },
          }),
        },
      ],
    };
  }

  function createVerifiedAutoAdmissionReport(
    options: {
      capabilityId?: string;
      generatedAt?: string;
      snapshotHash?: string;
      checks?: Partial<FlowSurfaceCapabilityAdmissionReport['records'][number]['checks']>;
    } = {},
  ): FlowSurfaceCapabilityAdmissionReport {
    return {
      version: 1,
      plugin: '@nocobase/plugin-gantt',
      generatedAt: options.generatedAt || '2026-06-04T00:00:00.000Z',
      records: [
        {
          capabilityId: options.capabilityId || '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          ownerPlugin: '@nocobase/plugin-gantt',
          capabilityVersion: '1.0.0',
          manifestHash: 'manifest-hash',
          snapshotHash: options.snapshotHash || 'v1:snapshot-source-hash',
          dryRunFixtureHash: 'fixture-hash',
          readiness: 'createEnabled',
          updatedAt: '2026-06-04T00:00:00.000Z',
          approvedAt: '2026-06-04T00:00:00.000Z',
          checks: createDiagnosticsAdmissionChecks(options.checks),
        },
      ],
    };
  }

  function createCalendarVerifiedAutoAdmissionReport(): FlowSurfaceCapabilityAdmissionReport {
    return {
      version: 1,
      plugin: '@nocobase/plugin-calendar',
      generatedAt: '2026-06-04T00:00:00.000Z',
      records: [
        {
          capabilityId: '@nocobase/plugin-calendar:autoSnapshot:block:pluginCalendar.calendar',
          kind: 'block',
          publicType: 'pluginCalendar.calendar',
          ownerPlugin: '@nocobase/plugin-calendar',
          capabilityVersion: '1.0.0',
          manifestHash: 'manifest-hash',
          snapshotHash: 'v1:calendar-source-hash',
          dryRunFixtureHash: 'fixture-hash',
          readiness: 'createEnabled',
          updatedAt: '2026-06-04T00:00:00.000Z',
          approvedAt: '2026-06-04T00:00:00.000Z',
          checks: createDiagnosticsAdmissionChecks(),
        },
      ],
    };
  }

  it('should return default public-safe discovery without identity or settings', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-flow-engine']),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(recorder.calls[0]).toEqual({
      sections: ['blocks', 'actions', 'recordActions'],
      expand: ['item.identity'],
    });
    expect(response.meta).toMatchObject({
      version: 1,
      generatedAt: '2026-06-03T00:00:00.000Z',
      enabledPlugins: ['@nocobase/core/client'],
      targetHintUsed: false,
    });
    expect(response.data.map((item) => [item.kind, item.publicType])).toEqual([
      ['block', 'table'],
      ['action', 'refresh'],
    ]);
    expect(response.data[0]).toMatchObject({
      publicTypeMeta: {
        value: 'table',
        source: 'builtIn',
      },
      availability: {
        create: {
          supported: true,
        },
      },
      placement: {
        slots: ['blocks'],
        collectionRequired: true,
      },
    });
    expect(response.data[0]).not.toHaveProperty('identity');
    expect(response.data[0]).not.toHaveProperty('settingsSchema');
    expect(response.data[0]).not.toHaveProperty('configureOptions');
    expect(JSON.stringify(response.data)).not.toContain('TableBlockModel');
    expect(JSON.stringify(response.data)).not.toContain('RefreshActionModel');
  });

  it('should honor target uid lookup and explicit identity/settings expands', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        kinds: ['fieldComponent', 'block'],
        target: {
          targetUid: 'target-1',
        },
        expand: ['item.identity', 'item.settings'],
      },
      {
        enabledPackages: new Set(),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(recorder.calls[0]).toEqual({
      target: {
        uid: 'target-1',
      },
      sections: ['blocks', 'fields'],
      expand: ['item.configureOptions', 'item.identity'],
    });
    expect(response.meta.targetHintUsed).toBe(true);
    expect(response.data.map((item) => [item.kind, item.publicType])).toEqual([
      ['block', 'table'],
      ['fieldComponent', 'input'],
      ['fieldComponent', 'code'],
    ]);
    expect(response.data[0]).toMatchObject({
      identity: {
        capabilityId: 'builtInStatic:block:core:table',
      },
      configureOptions: {
        pageSize: {
          type: 'number',
        },
      },
    });
    expect(response.data[0]).not.toHaveProperty('settingsSchema');
    expect(JSON.stringify(response.data)).not.toContain('props');
    expect(JSON.stringify(response.data)).not.toContain('stepParams');
    expect(JSON.stringify(response.data)).not.toContain('pageModelClass');
    expect(JSON.stringify(response.data)).not.toMatch(/Model/);
  });

  it('should preserve plugin ownership for target-scoped field capabilities', async () => {
    const recorder = createCatalogRecorder();
    const codeResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        kinds: ['fieldComponent'],
        ownerPlugins: ['@nocobase/plugin-field-code'],
        target: {
          uid: 'target-1',
        },
        expand: ['item.identity'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-field-code']),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(codeResponse.data).toEqual([
      expect.objectContaining({
        kind: 'fieldComponent',
        publicType: 'code',
        ownerPlugin: '@nocobase/plugin-field-code',
        identity: {
          capabilityId: 'builtInStatic:fieldComponent:%40nocobase%2Fplugin-field-code:code',
        },
      }),
    ]);
    expect(codeResponse.meta.enabledPlugins).toEqual(['@nocobase/plugin-field-code']);

    const coreResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        kinds: ['fieldComponent'],
        publicTypes: ['code'],
        ownerPlugins: ['@nocobase/core/client'],
        target: {
          uid: 'target-1',
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-field-code']),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(coreResponse.data).toEqual([]);
  });

  it('should reject reserved field binding and interface kinds until they are implemented', async () => {
    const recorder = createCatalogRecorder();

    for (const kind of ['fieldBinding', 'fieldInterface']) {
      let caught: unknown;
      try {
        await buildFlowSurfaceCapabilitiesResponse(
          {
            kinds: [kind as FlowSurfaceCapabilityKind],
          },
          {
            enabledPackages: new Set(),
            catalog: recorder.catalog,
            generatedAt: '2026-06-03T00:00:00.000Z',
          },
        );
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect((caught as Error).message).toContain(`'${kind}' is not supported`);
    }
    expect(recorder.calls).toHaveLength(0);
  });

  it('should reject scoped target hints and locale until capabilities supports scoped discovery', async () => {
    const recorder = createCatalogRecorder();
    const unsupportedRequests = [
      {
        target: {
          scene: 'page',
          slot: 'blocks',
          collectionName: 'tasks',
        },
      },
      {
        locale: 'en-US',
      },
      {
        target: {
          foo: 'bar',
        },
      },
      {
        foo: 'bar',
      },
    ] as unknown as FlowSurfaceCapabilitiesValues[];

    for (const input of unsupportedRequests) {
      let caught: unknown;
      try {
        await buildFlowSurfaceCapabilitiesResponse(input, {
          enabledPackages: new Set(),
          catalog: recorder.catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
        reasonCode: 'unsupported',
        reasonSource: 'catalog',
      });
    }
    expect(recorder.calls).toHaveLength(0);
  });

  it('should reject malformed target lookup instead of falling back to global discovery', async () => {
    const recorder = createCatalogRecorder();
    const malformedTargets = [
      {},
      {
        uid: '',
      },
      {
        targetUid: '',
      },
      {
        uid: 'target-1',
        targetUid: 'target-2',
      },
    ] as FlowSurfaceCapabilitiesValues['target'][];

    for (const target of malformedTargets) {
      let caught: unknown;
      try {
        await buildFlowSurfaceCapabilitiesResponse(
          {
            target,
          },
          {
            enabledPackages: new Set(['@nocobase/plugin-gantt']),
            providerRegistry: createProviderRegistry([createGanttProvider()]),
            catalog: recorder.catalog,
            generatedAt: '2026-06-03T00:00:00.000Z',
          },
        );
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    }
    expect(recorder.calls).toHaveLength(0);
  });

  it('should reject debugImplementation expand with a public reason code', async () => {
    const recorder = createCatalogRecorder();
    let caught: unknown;

    try {
      await buildFlowSurfaceCapabilitiesResponse(
        {
          expand: ['debugImplementation'],
        },
        {
          enabledPackages: new Set(),
          catalog: recorder.catalog,
        },
      );
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
      reasonCode: 'debug-expand-forbidden',
    });
    expect(recorder.calls).toHaveLength(0);
  });

  it('should expose enabled provider capabilities without leaking identity or settings by default', async () => {
    const recorder = createCatalogRecorder();
    const providerRegistry = createProviderRegistry([createGanttProvider()]);
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry,
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      kind: 'block',
      publicType: 'gantt',
      publicTypeMeta: {
        value: 'gantt',
        source: 'canary',
      },
      ownerPlugin: '@nocobase/plugin-gantt',
      origin: 'canaryOverlay',
      supportLevel: 'create-only',
      readiness: 'contractDeclared',
      availability: {
        create: {
          supported: true,
        },
      },
      semantic: {
        title: 'Gantt',
        aliases: ['gantt', 'timeline'],
      },
    });
    expect(response.data[0]).not.toHaveProperty('identity');
    expect(response.data[0]).not.toHaveProperty('initParamsSchema');
    expect(response.data[0]).not.toHaveProperty('settingsSchema');
    expect(response.data[0]).not.toHaveProperty('configureOptions');
    expect(response.data[0]).not.toHaveProperty('warnings');
    expect(response.meta.registrySources).toEqual([{ origin: 'canaryOverlay', count: 1 }]);
  });

  it('should normalize conservative capability policy defaults', () => {
    const config = normalizeFlowSurfaceCapabilityPolicyConfig();

    expect(config.writePolicy.mode).toBe('jsonInferred');
    expect(config.providerTimeoutMs).toBe(3000);
    expect(config.extractorSnapshotDir).toContain('flow-surfaces-capabilities');
    expect(typeof config.diagnosticsEnabled).toBe('boolean');
  });

  it('should downgrade invalid explicit capability write policy mode to discoveryOnly', async () => {
    const config = normalizeFlowSurfaceCapabilityPolicyConfig({
      writePolicy: {
        mode: 'jsonInfered',
        allowedOwners: '@nocobase/plugin-gantt',
      },
      providerTimeoutMs: 0,
      extractorSnapshotDir: '',
      diagnosticsEnabled: 'true',
    });

    expect(config.writePolicy.mode).toBe('discoveryOnly');
    expect(config.providerTimeoutMs).toBe(3000);
    expect(config.extractorSnapshotDir).toContain('flow-surfaces-capabilities');
    expect(config.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'flowSurfaceCapabilities.writePolicy.mode',
          message: expect.stringContaining('fallback to discoveryOnly'),
        }),
        expect.objectContaining({
          path: 'flowSurfaceCapabilities.writePolicy.allowedOwners',
          message: expect.stringContaining('ignore owner allowlist'),
        }),
        expect.objectContaining({
          path: 'flowSurfaceCapabilities.providerTimeoutMs',
          message: expect.stringContaining('fallback to default timeout'),
        }),
        expect.objectContaining({
          path: 'flowSurfaceCapabilities.extractorSnapshotDir',
          message: expect.stringContaining('fallback to default snapshot directory'),
        }),
        expect.objectContaining({
          path: 'flowSurfaceCapabilities.diagnosticsEnabled',
          message: expect.stringContaining('fallback to environment default'),
        }),
      ]),
    );

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        capabilityPolicyConfig: config,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should read capability policy config from plugin options', () => {
    const config = readFlowSurfaceCapabilityPolicyConfigFromPluginOptions({
      flowSurfaceCapabilities: {
        writePolicy: {
          mode: 'discoveryOnly',
          allowedOwners: [' @nocobase/plugin-gantt ', '@nocobase/plugin-gantt'],
          allowedPublicTypes: ['gantt', ''],
        },
        providerTimeoutMs: 5000,
        extractorSnapshotDir: 'storage/custom-flow-surfaces',
        diagnosticsEnabled: false,
      },
    });

    expect(config).toMatchObject({
      writePolicy: {
        mode: 'discoveryOnly',
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['gantt'],
      },
      providerTimeoutMs: 5000,
      extractorSnapshotDir: 'storage/custom-flow-surfaces',
      diagnosticsEnabled: false,
    });
  });

  it('should read legacy capability write policy options conservatively', () => {
    const config = readFlowSurfaceCapabilityPolicyConfigFromPluginOptions({
      flowSurfaceCapabilityPolicy: {
        mode: 'verifiedAuto',
        allowedOwners: [' @nocobase/plugin-gantt ', '@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt', 'pluginGantt.gantt', ''],
      },
    });

    expect(config).toMatchObject({
      writePolicy: {
        mode: 'verifiedAuto',
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
      providerTimeoutMs: 3000,
    });
    expect(config.extractorSnapshotDir).toContain('flow-surfaces-capabilities');
    expect(typeof config.diagnosticsEnabled).toBe('boolean');
  });

  it('should apply provider timeout config when building service provider catalog items', async () => {
    const hangingProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-hanging',
      getCapabilities: () => new Promise<FlowSurfaceCapabilityManifestItem[]>((_resolve) => undefined),
    };
    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: {
          providerTimeoutMs: 5,
        },
      },
      flowSurfaceCapabilityProviders: createProviderRegistry([hangingProvider, createGanttProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const accessor = service as unknown as ProviderCatalogItemsService;

    const items = await accessor.buildProviderCatalogItems({
      kind: 'block',
      enabledPackages: new Set(['@nocobase/plugin-hanging', '@nocobase/plugin-gantt']),
    });

    expect(items.map((item) => item.publicType)).toEqual(['gantt']);
  });

  it('should skip provider getCapabilities results that are not arrays', async () => {
    const malformedProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-malformed',
      getCapabilities: () => ({ id: 'not-an-array' }) as unknown as FlowSurfaceCapabilityManifestItem[],
    };
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([malformedProvider, createGanttProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const accessor = service as unknown as ProviderCatalogItemsService;

    const items = await accessor.buildProviderCatalogItems({
      kind: 'block',
      enabledPackages: new Set(['@nocobase/plugin-malformed', '@nocobase/plugin-gantt']),
    });

    expect(items.map((item) => item.publicType)).toEqual(['gantt']);
  });

  it('should skip malformed provider capability items while keeping valid items', async () => {
    const mixedProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-mixed',
      getCapabilities: () =>
        [
          {
            id: 'blocks.valid',
            kind: 'block',
            publicType: 'mixedValid',
            label: 'Mixed valid',
            semantic: {
              title: 'Mixed valid',
              aliases: 'not-an-array',
            },
            acceptedAliases: 'not-an-array',
            implementation: {
              modelUse: 'MixedValidBlockModel',
            },
            supportLevel: 'not-a-support-level',
            confidence: 'certain',
            warnings: [null],
          },
          null,
          {
            id: 'blocks.missingModelUse',
            kind: 'block',
            publicType: 'missingModelUse',
            implementation: {},
          },
          {
            id: 'fields.unsupported',
            kind: 'fieldComponent',
            publicType: 'unsupportedField',
            implementation: {
              modelUse: 'UnsupportedFieldModel',
            },
          },
        ] as unknown as FlowSurfaceCapabilityManifestItem[],
      resolveCreate: () => ({
        use: 'MixedValidBlockModel',
      }),
    };
    const service = new FlowSurfacesService({
      flowSurfaceCapabilityProviders: createProviderRegistry([mixedProvider, createGanttProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const accessor = service as unknown as ProviderCatalogItemsService;

    const items = await accessor.buildProviderCatalogItems({
      kind: 'block',
      enabledPackages: new Set(['@nocobase/plugin-mixed', '@nocobase/plugin-gantt']),
    });

    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          publicType: 'mixedValid',
          supportLevel: 'create-only',
          confidence: 'high',
        }),
        expect.objectContaining({
          publicType: 'gantt',
        }),
      ]),
    );
    expect(items.map((item) => item.publicType)).not.toEqual(
      expect.arrayContaining(['missingModelUse', 'unsupportedField']),
    );
  });

  it('should apply provider timeout config when resolving service dynamic block capabilities', async () => {
    const hangingProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-hanging',
      getCapabilities: () => new Promise<FlowSurfaceCapabilityManifestItem[]>((_resolve) => undefined),
    };
    const service = new FlowSurfacesService({
      options: {
        flowSurfaceCapabilities: {
          providerTimeoutMs: 5,
        },
      },
      flowSurfaceCapabilityProviders: createProviderRegistry([hangingProvider, createGanttProvider()]),
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const accessor = service as unknown as DynamicBlockCapabilityService;

    const capability = await accessor.resolveDynamicBlockCapability(
      'gantt',
      new Set(['@nocobase/plugin-hanging', '@nocobase/plugin-gantt']),
    );

    expect(capability?.publicItem.publicType).toBe('gantt');
  });

  it('should expose public-safe capability diagnostics when diagnostics are enabled', async () => {
    const { service } = createDiagnosticsService({
      autoSnapshots: [createGanttAutoSnapshot({ warnings: [createSnapshotStaleWarning()] })],
      providerRegistry: createProviderRegistry([createConflictingTableProvider()]),
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const response = await service.diagnoseCapabilities(
      {
        includeEvents: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-conflict', '@nocobase/plugin-gantt']),
        admissionReports: [createDiagnosticsAdmissionReport()],
      },
    );

    expect(response.meta).toMatchObject({
      version: 1,
      diagnosticsEnabled: true,
      implementationIncluded: false,
      eventsIncluded: false,
    });
    expect(response.data.registrySources).toEqual(
      expect.arrayContaining([
        { origin: 'builtInStatic', count: 2 },
        { origin: 'provider', count: 1 },
        { origin: 'autoSnapshot', count: 1 },
      ]),
    );
    expect(response.data.publicTypeConflicts).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'table',
        ownerPlugin: '@nocobase/plugin-conflict',
        reasonCode: 'public-type-conflict',
      }),
    ]);
    expect(response.data.staleSnapshots).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        reasonCode: 'snapshot-stale',
      }),
    ]);
    expect(response.data.admissionRecords).toEqual([
      expect.objectContaining({
        capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
        publicType: 'gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        readiness: 'blocked',
        failedChecks: expect.arrayContaining([
          expect.objectContaining({
            key: 'dryRunCreate',
            reasonCode: 'dry-run-failed',
          }),
        ]),
      }),
    ]);
    expect(JSON.stringify(response)).not.toContain('InternalEvidenceModel');
    expect(JSON.stringify(response)).not.toContain('TableAlternativeBlockModel');
  });

  it('should expose provider registry warnings only through diagnostics', async () => {
    const registry = new FlowSurfaceCapabilityProviderRegistry();
    registry.registerProvider({
      ownerPlugin: ' ',
      getCapabilities: () => [],
    });
    registry.registerProvider({
      ownerPlugin: '@nocobase/plugin-gantt',
      getCapabilities: () => [],
    });
    registry.registerProvider(createGanttProvider());

    const { service } = createDiagnosticsService({
      providerRegistry: registry,
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const capabilities = await service.capabilities(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    const diagnostics = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );

    expect(capabilities.data[0]).not.toHaveProperty('warnings');
    expect(diagnostics.data.warnings).toEqual([
      expect.objectContaining({
        source: 'provider',
        code: 'invalid-provider',
        message: expect.stringContaining('ownerPlugin is empty'),
      }),
      expect.objectContaining({
        source: 'provider',
        code: 'duplicate-provider',
        ownerPlugin: '@nocobase/plugin-gantt',
        message: expect.stringContaining('replaced by a later registration'),
      }),
    ]);
    expect(JSON.stringify(diagnostics)).not.toContain('GanttBlockModel');
  });

  it('should expose invalid policy config fallbacks only through diagnostics', async () => {
    const { service } = createDiagnosticsService({
      providerRegistry: createProviderRegistry([createGanttProvider()]),
      pluginOptions: {
        flowSurfaceCapabilities: {
          writePolicy: {
            mode: 'jsonInfered',
            allowedOwners: '@nocobase/plugin-gantt',
            allowedPublicTypes: 'gantt',
          },
          providerTimeoutMs: 0,
          extractorSnapshotDir: '',
          diagnosticsEnabled: true,
        },
      },
    });

    const capabilities = await service.capabilities(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    const diagnostics = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );

    expect(capabilities.data[0]).not.toHaveProperty('warnings');
    expect(diagnostics.data.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'policy',
          code: 'invalid-policy-config',
          path: 'flowSurfaceCapabilities.writePolicy.mode',
          message: expect.stringContaining('fallback to discoveryOnly'),
        }),
        expect.objectContaining({
          source: 'policy',
          code: 'invalid-policy-config',
          path: 'flowSurfaceCapabilities.writePolicy.allowedOwners',
          message: expect.stringContaining('ignore owner allowlist'),
        }),
        expect.objectContaining({
          source: 'policy',
          code: 'invalid-policy-config',
          path: 'flowSurfaceCapabilities.writePolicy.allowedPublicTypes',
          message: expect.stringContaining('ignore public type allowlist'),
        }),
        expect.objectContaining({
          source: 'policy',
          code: 'invalid-policy-config',
          path: 'flowSurfaceCapabilities.providerTimeoutMs',
          message: expect.stringContaining('fallback to default timeout'),
        }),
        expect.objectContaining({
          source: 'policy',
          code: 'invalid-policy-config',
          path: 'flowSurfaceCapabilities.extractorSnapshotDir',
          message: expect.stringContaining('fallback to default snapshot directory'),
        }),
      ]),
    );
  });

  it('should expose auto snapshot load warnings only through diagnostics', async () => {
    const { service } = createDiagnosticsService({
      autoSnapshots: [createGanttAutoSnapshot()],
      snapshotWarnings: [
        {
          source: 'snapshot',
          code: 'snapshot-file-skipped',
          fileName: 'malformed.json',
          message: 'Flow surface auto snapshot file was skipped because it is malformed or unsupported.',
        },
      ],
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const capabilities = await service.capabilities(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );
    const diagnostics = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      },
    );

    expect(capabilities.data[0]).not.toHaveProperty('warnings');
    expect(diagnostics.data.warnings).toEqual([
      expect.objectContaining({
        source: 'snapshot',
        code: 'snapshot-file-skipped',
        fileName: 'malformed.json',
      }),
    ]);
  });

  it('should downgrade create-enabled admission diagnostics when integrity fields are missing', async () => {
    const { service } = createDiagnosticsService({
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const response = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-flow-engine']),
        admissionReports: [
          {
            version: 1,
            plugin: '@nocobase/plugin-gantt',
            generatedAt: '2026-06-04T00:00:00.000Z',
            records: [
              {
                capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
                kind: 'block',
                publicType: 'gantt',
                ownerPlugin: '@nocobase/plugin-gantt',
                readiness: 'createEnabled',
                updatedAt: '2026-06-04T00:00:00.000Z',
                approvedAt: '2026-06-04T00:00:00.000Z',
                checks: createDiagnosticsAdmissionChecks(),
              },
            ],
          },
        ],
      },
    );

    expect(response.data.admissionRecords).toEqual([
      expect.objectContaining({
        capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
        readiness: 'blocked',
        failedChecks: [
          expect.objectContaining({
            key: 'reportIntegrity',
            reasonCode: 'snapshot-stale',
            message: expect.stringContaining('snapshotHash'),
          }),
        ],
      }),
    ]);
  });

  it('should downgrade create-enabled admission diagnostics when current capability integrity does not match', async () => {
    const { service } = createDiagnosticsService({
      autoSnapshots: [createGanttAutoSnapshot()],
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const response = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        admissionReports: [
          createVerifiedAutoAdmissionReport({
            snapshotHash: 'older-snapshot-hash',
          }),
        ],
      },
    );

    expect(response.data.admissionRecords).toEqual([
      expect.objectContaining({
        capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        readiness: 'blocked',
        failedChecks: [
          expect.objectContaining({
            key: 'reportIntegrity',
            reasonCode: 'snapshot-stale',
            message: expect.stringContaining('snapshotHash'),
          }),
        ],
      }),
    ]);
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain('older-snapshot-hash');
    expect(serialized).not.toContain('snapshot-source-hash');
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('fixture-hash');
  });

  it('should downgrade create-enabled admission diagnostics when report plugin does not own the record', async () => {
    const { service } = createDiagnosticsService({
      autoSnapshots: [createGanttAutoSnapshot()],
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const response = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        admissionReports: [
          {
            ...createVerifiedAutoAdmissionReport(),
            plugin: '@nocobase/plugin-other',
          },
        ],
      },
    );

    expect(response.data.admissionRecords).toEqual([
      expect.objectContaining({
        capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
        reportPlugin: '@nocobase/plugin-other',
        ownerPlugin: '@nocobase/plugin-gantt',
        readiness: 'blocked',
        failedChecks: [
          expect.objectContaining({
            key: 'admissionRecord',
            reasonCode: 'contract-not-verified',
            message: expect.stringContaining('ownerPlugin'),
          }),
        ],
      }),
    ]);
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain('snapshot-source-hash');
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('fixture-hash');
  });

  it('should downgrade create-enabled admission diagnostics when runtime evidence is not trusted', async () => {
    const { service } = createDiagnosticsService({
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: true,
        },
      },
    });

    const response = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-flow-engine']),
        admissionReports: [
          {
            version: 1,
            plugin: '@nocobase/plugin-gantt',
            generatedAt: '2026-06-04T00:00:00.000Z',
            records: [
              {
                capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
                kind: 'block',
                publicType: 'gantt',
                ownerPlugin: '@nocobase/plugin-gantt',
                capabilityVersion: '1.0.0',
                manifestHash: 'manifest-hash',
                snapshotHash: 'snapshot-hash',
                dryRunFixtureHash: 'fixture-hash',
                readiness: 'createEnabled',
                updatedAt: '2026-06-04T00:00:00.000Z',
                checks: createDiagnosticsAdmissionChecks({
                  dryRunCreate: {
                    ok: false,
                    reasonCode: 'dry-run-failed',
                    message: 'Dry-run failed.',
                    evidence: {
                      internalModelUse: 'InternalEvidenceModel',
                    },
                  },
                }),
              },
            ],
          },
        ],
      },
    );

    expect(response.data.admissionRecords).toEqual([
      expect.objectContaining({
        capabilityId: '@nocobase/plugin-gantt:canary:block:gantt',
        readiness: 'blocked',
        failedChecks: expect.arrayContaining([
          expect.objectContaining({
            key: 'approvedAt',
            reasonCode: 'contract-not-verified',
          }),
          expect.objectContaining({
            key: 'dryRunCreate',
            reasonCode: 'dry-run-failed',
            message: 'Dry-run failed.',
          }),
        ]),
      }),
    ]);
    expect(JSON.stringify(response)).not.toContain('InternalEvidenceModel');
  });

  it('should gate capability diagnostics by config or administrator role', async () => {
    const { service } = createDiagnosticsService({
      pluginOptions: {
        flowSurfaceCapabilities: {
          diagnosticsEnabled: false,
        },
      },
    });
    const enabledPackages = new Set(['@nocobase/plugin-flow-engine']);

    await expect(
      service.diagnoseCapabilities(
        {},
        {
          enabledPackages,
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceForbiddenError);

    await expect(
      service.diagnoseCapabilities(
        {
          includeImplementation: true,
        },
        {
          enabledPackages,
          currentRoles: ['admin'],
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceForbiddenError);

    const response = await service.diagnoseCapabilities(
      {},
      {
        enabledPackages,
        currentRoles: ['admin'],
      },
    );

    expect(response.meta.diagnosticsEnabled).toBe(false);
    expect(response.meta.implementationIncluded).toBe(false);
  });

  it('should project provider capabilities as read-only when policy is discoveryOnly', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'discoveryOnly',
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'canaryOverlay',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should keep provider capability details readable but read-only under discoveryOnly', async () => {
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'gantt',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'discoveryOnly',
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject({
      publicType: 'gantt',
      origin: 'canaryOverlay',
      supportLevel: 'readback-only',
      readiness: 'blocked',
      availability: expect.objectContaining({
        create: expect.objectContaining({
          supported: false,
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
        }),
      }),
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
        properties: {
          startField: {
            type: 'string',
          },
        },
      },
    });
    expect(JSON.stringify(response.data)).not.toContain('GanttBlockModel');
  });

  it('should let manifestOnly owner allowlists roll back one plugin capability writes', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-other'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should let manifestOnly publicType allowlists roll back one capability writes', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedPublicTypes: ['calendar'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should keep auto snapshots read-only under verifiedAuto until admission evidence exists', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'discovered',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should resolve verifiedAuto admission decisions without changing default projection', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );
    const item = response.data[0];

    expect(item.availability.create.supported).toBe(false);
    expect(resolveFlowSurfaceVerifiedAutoAdmissionDecision({ item })).toEqual({
      ok: false,
      readiness: 'discovered',
      reasonCode: 'manifest-required',
      failedChecks: [
        {
          key: 'admissionRecord',
          reasonCode: 'manifest-required',
          message: 'Verified auto admission requires writePolicy.mode to be verifiedAuto.',
        },
      ],
    });
    expect(
      resolveFlowSurfaceVerifiedAutoAdmissionDecision({
        item,
        config: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      }),
    ).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'admissionRecord',
          reasonCode: 'contract-not-verified',
          message: 'Verified auto admission requires matching runtime admission evidence.',
        },
      ],
    });
    expect(
      resolveFlowSurfaceVerifiedAutoAdmissionDecision({
        item,
        config: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        admissionEvidence: {
          ok: true,
          readiness: 'createEnabled',
          failedChecks: [],
        },
      }),
    ).toEqual({
      ok: true,
      readiness: 'createEnabled',
      failedChecks: [],
    });
  });

  it('should enable auto snapshot create projection only with verifiedAuto admission evidence', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
        includeWarnings: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-only',
        readiness: 'createEnabled',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
    expect(response.data[0].warnings || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
    expect(JSON.stringify(response.data[0])).not.toContain('snapshot-source-hash');
    expect(JSON.stringify(response.data[0])).not.toContain('fixture-hash');
    expect(JSON.stringify(response.data[0])).not.toContain('GanttBlockModel');
  });

  it('should project verifiedAuto admission through describeCapability without leaking evidence', async () => {
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'pluginGantt.gantt',
        expand: ['item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.meta.targetHintUsed).toBe(false);
    expect(response.data).toMatchObject({
      publicType: 'pluginGantt.gantt',
      origin: 'autoSnapshot',
      supportLevel: 'create-only',
      readiness: 'createEnabled',
      availability: expect.objectContaining({
        create: expect.objectContaining({
          supported: true,
        }),
      }),
    });
    expect(response.data.warnings || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
    const serialized = JSON.stringify(response.data);
    expect(serialized).not.toContain('snapshot-source-hash');
    expect(serialized).not.toContain('manifest-hash');
    expect(serialized).not.toContain('fixture-hash');
    expect(serialized).not.toContain('GanttBlockModel');
  });

  it('should keep auto snapshot details read-only when verifiedAuto is downgraded to manifestOnly', async () => {
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'pluginGantt.gantt',
        expand: ['item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject({
      publicType: 'pluginGantt.gantt',
      origin: 'autoSnapshot',
      supportLevel: 'readback-only',
      readiness: 'discovered',
      availability: expect.objectContaining({
        create: expect.objectContaining({
          supported: false,
          reasonCode: 'manifest-required',
          reasonSource: 'registry',
        }),
      }),
      warnings: expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    });
  });

  it('should keep verifiedAuto auto snapshots read-only when admission evidence is stale', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [
          createVerifiedAutoAdmissionReport({
            capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:otherGantt',
            generatedAt: '2026-06-05T00:00:00.000Z',
          }),
          createVerifiedAutoAdmissionReport({
            snapshotHash: 'older-snapshot-hash',
          }),
        ],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'snapshot-stale',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should keep admission reports from enabling auto snapshots under manifestOnly policy', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'discovered',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'manifest-required',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should keep admitted auto snapshots read-only under discoveryOnly policy', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'discoveryOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
  });

  it('should block verifiedAuto admission decisions without allowlist or trusted evidence', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );
    const item = response.data[0];

    expect(
      resolveFlowSurfaceVerifiedAutoAdmissionDecision({
        item,
        config: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-other'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        admissionEvidence: {
          ok: true,
          readiness: 'createEnabled',
          failedChecks: [],
        },
      }),
    ).toEqual({
      ok: false,
      readiness: 'discovered',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'admissionRecord',
          reasonCode: 'contract-not-verified',
          message: 'Verified auto admission requires the owner and publicType to match the write policy allowlist.',
        },
      ],
    });

    expect(
      resolveFlowSurfaceVerifiedAutoAdmissionDecision({
        item,
        config: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        admissionEvidence: {
          ok: false,
          readiness: 'blocked',
          reasonCode: 'snapshot-stale',
          failedChecks: [
            {
              key: 'reportIntegrity',
              reasonCode: 'snapshot-stale',
              message: 'Snapshot hash does not match current runtime.',
            },
          ],
        },
      }),
    ).toEqual({
      ok: false,
      readiness: 'blocked',
      reasonCode: 'snapshot-stale',
      failedChecks: [
        {
          key: 'reportIntegrity',
          reasonCode: 'snapshot-stale',
          message: 'Snapshot hash does not match current runtime.',
        },
      ],
    });
  });

  it('should expose auto snapshot capabilities as read-only discovery', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject([
      {
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        publicTypeMeta: {
          value: 'pluginGantt.gantt',
          source: 'autoNamespaced',
        },
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'discovered',
        availability: {
          render: {
            supported: true,
          },
          readback: {
            supported: true,
          },
          create: {
            supported: false,
            reasonCode: 'manifest-required',
            reasonSource: 'registry',
          },
          configure: {
            supported: false,
            reasonCode: 'manifest-required',
            reasonSource: 'registry',
          },
        },
      },
    ]);
    expect(response.data[0]).not.toHaveProperty('identity');
    expect(response.data[0]).not.toHaveProperty('warnings');
    expect(JSON.stringify(response.data[0])).not.toContain('GanttBlockModel');
    expect(response.meta.registrySources).toEqual([{ origin: 'autoSnapshot', count: 1 }]);
  });

  it('should expose high-confidence JSON inferred Gantt snapshots as create-enabled without providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    const ganttCapability = response.data.find((item) => item.publicType === 'gantt');
    expect(ganttCapability).toEqual(
      expect.objectContaining({
        kind: 'block',
        publicType: 'gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-with-settings',
        readiness: 'createEnabled',
        confidence: 'high',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
            acceptsInitParams: true,
            acceptsSettings: true,
          }),
        }),
        publicTypeMeta: expect.objectContaining({
          acceptedAliases: expect.arrayContaining(['pluginGantt.gantt', 'ganttBlock']),
        }),
        initParamsSchema: expect.objectContaining({
          required: ['collectionName'],
        }),
        settingsSchema: expect.objectContaining({
          required: ['titleField', 'startField', 'endField'],
        }),
      }),
    );
    const serialized = JSON.stringify(response.data);
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('TableActionsColumnModel');
    expect(serialized).not.toContain('stepParams');
    expect(serialized).not.toContain('props');

    const disabledResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set<string>(),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );
    expect(disabledResponse.data).toEqual([]);
  });

  it('should keep JSON inferred popup hosts with unsupported childSurfaceKey read-only', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const inferredCapability = autoSnapshot.inferredAuthoring?.capabilities.find((item) => item.publicType === 'gantt');
    const addNewPopupHost = inferredCapability?.popupHosts?.find((popupHost) => popupHost.defaultType === 'addNew');
    expect(addNewPopupHost).toBeTruthy();
    if (inferredCapability && addNewPopupHost) {
      inferredCapability.popupHosts = [
        {
          ...addNewPopupHost,
          key: 'gantt.unsupportedChildSurfacePopup',
          childSurfaceKey: 'gantt.actions',
        },
      ];
    }

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
        includeWarnings: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    const ganttCapability = response.data.find((item) => item.publicType === 'gantt');
    expect(ganttCapability).toEqual(
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'discovered',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'contract-not-verified',
          }),
        ]),
      }),
    );
  });

  it('should keep JSON inferred popup hosts with invalid openViewPath read-only', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const inferredCapability = autoSnapshot.inferredAuthoring?.capabilities.find((item) => item.publicType === 'gantt');
    const addNewPopupHost = inferredCapability?.popupHosts?.find((popupHost) => popupHost.defaultType === 'addNew');
    expect(addNewPopupHost).toBeTruthy();
    if (inferredCapability && addNewPopupHost) {
      inferredCapability.popupHosts = [
        {
          ...addNewPopupHost,
          key: 'gantt.invalidOpenViewPathPopup',
          openViewPath: 'stepParams.__proto__.openView',
        },
      ];
    }

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
        includeWarnings: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    const ganttCapability = response.data.find((item) => item.publicType === 'gantt');
    expect(ganttCapability).toEqual(
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'contract-not-verified',
          }),
        ]),
      }),
    );
  });

  it('should keep stale JSON inferred authoring contract snapshots read-only', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    if (!autoSnapshot.inferredAuthoring) {
      throw new Error('Expected Gantt inferred authoring capability');
    }
    delete autoSnapshot.inferredAuthoring.contractVersion;

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeUnavailable: true,
        includeWarnings: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    const ganttCapability = response.data.find((item) => item.publicType === 'gantt');
    expect(ganttCapability).toEqual(
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          render: expect.objectContaining({
            supported: false,
            reasonCode: 'snapshot-stale',
          }),
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'manifest-required',
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'snapshot-stale',
            message: expect.stringContaining('inferred authoring contract'),
          }),
        ]),
      }),
    );
  });

  it('should describe JSON inferred Gantt by accepted alias as the canonical capability', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'pluginGantt.gantt',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual(
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-with-settings',
        readiness: 'createEnabled',
        publicTypeMeta: expect.objectContaining({
          acceptedAliases: expect.arrayContaining(['pluginGantt.gantt']),
        }),
        settingsSchema: expect.objectContaining({
          required: ['titleField', 'startField', 'endField'],
        }),
      }),
    );
    expect(JSON.stringify(response.data)).not.toContain('GanttBlockModel');
  });

  it('should keep medium-confidence JSON inferred snapshots read-only by default', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const capability = autoSnapshot.inferredAuthoring?.capabilities.find((item) => item.publicType === 'gantt');
    if (!capability) {
      throw new Error('Expected Gantt inferred authoring capability');
    }
    capability.confidence.write = 'medium';
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        includeWarnings: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    const ganttCapability = response.data.find((item) => item.publicType === 'gantt');
    expect(ganttCapability).toEqual(
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'discovered',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'contract-not-verified',
          }),
        ]),
      }),
    );
  });

  it('should keep raw auto discovery beside JSON inferred authoring', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const publicItems = collectAutoSnapshotPublicCapabilities({
      autoSnapshots: [autoSnapshot],
      enabledPackages,
    });

    expect(publicItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'block',
          publicType: 'gantt',
          readiness: 'createEnabled',
          availability: expect.objectContaining({
            create: expect.objectContaining({
              supported: true,
            }),
          }),
        }),
        expect.objectContaining({
          kind: 'block',
          publicType: 'pluginGantt.gantt',
          origin: 'autoSnapshot',
          supportLevel: 'readback-only',
          readiness: 'discovered',
          availability: expect.objectContaining({
            create: expect.objectContaining({
              supported: false,
            }),
          }),
        }),
        expect.objectContaining({
          kind: 'action',
          publicType: 'pluginGantt.filter',
          origin: 'autoSnapshot',
          supportLevel: 'create-only',
          readiness: 'createEnabled',
          availability: expect.objectContaining({
            create: expect.objectContaining({
              supported: true,
            }),
          }),
        }),
      ]),
    );

    const described = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'pluginGantt.gantt',
      },
      {
        enabledPackages,
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(described.data).toMatchObject({
      publicType: 'gantt',
      origin: 'autoSnapshot',
      readiness: 'createEnabled',
      availability: {
        create: {
          supported: true,
        },
      },
    });
  });

  it('should drop unsafe JSON inferred public schemas before projection', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const capability = autoSnapshot.inferredAuthoring?.capabilities.find((item) => item.publicType === 'gantt');
    if (!capability) {
      throw new Error('Expected Gantt inferred authoring capability');
    }
    capability.initParamsSchema = {
      type: 'object',
      required: ['collectionName', 'stepParams', 'resourceInit'],
      properties: {
        collectionName: {
          type: 'string',
        },
        resourceInit: {
          type: 'object',
        },
        stepParams: {
          type: 'object',
        },
      },
    };
    capability.settingsSchema = {
      type: 'object',
      properties: {
        modelUse: {
          type: 'string',
        },
      },
    };
    capability.configureOptions = {
      nodeTemplate: {
        type: 'string',
      },
    };

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['gantt'],
        includeWarnings: true,
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([]),
        autoSnapshots: [autoSnapshot],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'autoSnapshot',
        supportLevel: 'readback-only',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            acceptsInitParams: false,
            acceptsSettings: false,
            reasonCode: 'contract-not-verified',
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'partial-settings-schema',
          }),
          expect.objectContaining({
            code: 'contract-not-verified',
          }),
        ]),
      }),
    ]);
    expect(response.data[0]).not.toHaveProperty('initParamsSchema');
    expect(response.data[0]).not.toHaveProperty('settingsSchema');
    expect(response.data[0]).not.toHaveProperty('configureOptions');
    expect(
      collectJsonInferredAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
      }),
    ).toEqual([]);
    const serialized = JSON.stringify(response);
    expect(serialized).not.toContain('stepParams');
    expect(serialized).not.toContain('modelUse');
    expect(serialized).not.toContain('nodeTemplate');
    expect(serialized).not.toContain('GanttBlockModel');
  });

  it('should apply jsonInferred allowlists before projecting inferred catalog items', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);

    expect(
      collectJsonInferredAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'jsonInferred',
            allowedOwners: ['@nocobase/plugin-other'],
          },
        },
      }),
    ).toEqual([]);

    expect(
      collectJsonInferredAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'jsonInferred',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['gantt'],
          },
        },
      }),
    ).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        createSupported: true,
      }),
    ]);
  });

  it('should mark manifest capabilities with failed dry-run readiness as blocked', async () => {
    const failedDryRunProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-failed-dry-run',
      getCapabilities: () => [
        {
          id: 'blocks.failedDryRun',
          kind: 'block',
          publicType: 'failedDryRun',
          label: 'Failed dry run',
          semantic: {
            title: 'Failed dry run',
          },
          placement: {
            scenes: ['page'],
            slots: ['blocks'],
          },
          implementation: {
            modelUse: 'FailedDryRunBlockModel',
          },
          availability: {
            create: {
              supported: false,
              reasonCode: 'dry-run-failed',
              reasonSource: 'provider',
            },
          },
          initParamsSchema: {
            type: 'object',
            additionalProperties: false,
          },
        },
      ],
      resolveCreate: () => ({
        use: 'FailedDryRunBlockModel',
      }),
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'failed',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-failed-dry-run']),
        providerRegistry: createProviderRegistry([failedDryRunProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'failedDryRun',
        origin: 'provider',
        readiness: 'blocked',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'dry-run-failed',
            reasonSource: 'provider',
          }),
        }),
      }),
    ]);
    expect(JSON.stringify(response.data[0])).not.toContain('FailedDryRunBlockModel');
  });

  it('should not let auto snapshots override same-owner provider capabilities', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginGantt.gantt'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createAutoNamespacedGanttProvider()]),
        autoSnapshots: [createGanttAutoSnapshot()],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'canaryOverlay',
        label: 'Gantt provider',
        readiness: 'contractDeclared',
        supportLevel: 'create-only',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
      }),
    ]);
    expect(response.data[0].readiness).not.toBe('createEnabled');
  });

  it('should merge fresh auto snapshot aliases into higher-priority provider capabilities', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'shadow',
        expand: ['item.settings', 'item.semantic', 'item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        autoSnapshots: [
          createGanttAutoSnapshot({
            menuLabel: 'Shadow timeline',
          }),
        ],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'canaryOverlay',
        label: 'Gantt',
        publicTypeMeta: expect.objectContaining({
          value: 'gantt',
          source: 'canary',
          acceptedAliases: ['ganttBlock'],
          searchAliases: expect.arrayContaining(['@nocobase/plugin-gantt:gantt', 'Shadow timeline']),
        }),
        semantic: {
          title: 'Gantt',
          description: 'Visualizes collection records on a time scale.',
          aliases: ['gantt', 'timeline'],
        },
        placement: {
          scenes: ['page', 'tab'],
          slots: ['blocks'],
          collectionRequired: true,
        },
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
        supportLevel: 'create-only',
        initParamsSchema: {
          type: 'object',
          required: ['collectionName'],
          properties: {
            collectionName: {
              type: 'string',
            },
          },
        },
        settingsSchema: {
          type: 'object',
          properties: {
            titleField: {
              type: 'string',
            },
            startField: {
              type: 'string',
            },
            endField: {
              type: 'string',
            },
            displaySettings: {
              type: 'object',
            },
          },
        },
        configureOptions: {
          titleField: {
            type: 'string',
          },
        },
        warnings: [
          {
            code: 'contract-not-verified',
            message: 'Gantt configure writes remain disabled in this test fixture.',
          },
        ],
      }),
    ]);
    expect(response.data[0].publicTypeMeta.searchAliases).toEqual(expect.arrayContaining(['pluginGantt.gantt']));
    expect(response.data[0].publicTypeMeta.searchAliases).not.toEqual(expect.arrayContaining(['GanttBlockModel']));
    expect(JSON.stringify(response.data[0])).not.toContain('GanttBlockModel');
    expect(JSON.stringify(response.data[0])).toContain('pluginGantt.gantt');
    expect(response.meta.registrySources).toEqual([{ origin: 'canaryOverlay', count: 1 }]);
  });

  it('should absorb auto snapshots through legacy provider model uses', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'legacy',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createRenamedGanttProvider()]),
        autoSnapshots: [
          createGanttAutoSnapshot({
            menuLabel: 'Legacy Gantt',
          }),
        ],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'renamedGantt',
        origin: 'canaryOverlay',
        label: 'Renamed Gantt',
        publicTypeMeta: expect.objectContaining({
          value: 'renamedGantt',
          source: 'canary',
          searchAliases: expect.arrayContaining(['Legacy Gantt', 'pluginGantt.gantt']),
        }),
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
      }),
    ]);
    expect(response.data.map((item) => item.publicType)).not.toContain('pluginGantt.gantt');
    expect(JSON.stringify(response.data[0])).not.toContain('GanttBlockModel');
  });

  it('should preserve multiple auto snapshot diagnostics absorbed by one provider', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'legacy',
        expand: ['item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createRenamedGanttProvider()]),
        autoSnapshots: [
          createGanttAutoSnapshot({
            menuLabel: 'Legacy Gantt',
            warnings: [
              {
                code: 'readback-parity-missing',
                message: 'Legacy Gantt readback parity has not been checked.',
              },
            ],
          }),
          createGanttAutoSnapshot({
            menuKey: 'legacyTimeline',
            menuLabel: 'Legacy Timeline',
            modelUse: 'LegacyTimelineBlockModel',
            warnings: [
              {
                code: 'partial-settings-schema',
                message: 'Legacy Timeline settings schema is incomplete.',
              },
            ],
          }),
        ],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'renamedGantt',
        origin: 'canaryOverlay',
        publicTypeMeta: expect.objectContaining({
          searchAliases: expect.arrayContaining([
            'Legacy Gantt',
            'pluginGantt.gantt',
            'Legacy Timeline',
            'pluginGantt.legacyTimeline',
          ]),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'readback-parity-missing',
          }),
          expect.objectContaining({
            code: 'partial-settings-schema',
          }),
        ]),
      }),
    ]);
    expect(response.data.map((item) => item.publicType)).not.toContain('pluginGantt.gantt');
    expect(response.data.map((item) => item.publicType)).not.toContain('pluginGantt.legacyTimeline');
    expect(response.data[0].warnings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
  });

  it('should merge stale auto snapshot warnings into provider diagnostics without default aliases', async () => {
    const baseOptions = {
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      providerRegistry: createProviderRegistry([createGanttProvider()]),
      autoSnapshots: [
        createGanttAutoSnapshot({
          menuLabel: 'Shadow timeline',
          warnings: [createSnapshotStaleWarning()],
        }),
      ],
      catalog: createCatalogRecorder().catalog,
      generatedAt: '2026-06-04T00:00:00.000Z',
    };
    const hiddenAlias = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'shadow',
      },
      baseOptions,
    );
    const diagnostics = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['gantt'],
        expand: ['item.warnings'],
      },
      baseOptions,
    );

    expect(hiddenAlias.data).toEqual([]);
    expect(diagnostics.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        origin: 'canaryOverlay',
        label: 'Gantt',
        publicTypeMeta: expect.not.objectContaining({
          searchAliases: expect.arrayContaining(['Shadow timeline']),
        }),
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'snapshot-stale',
          }),
        ]),
      }),
    ]);
    expect(diagnostics.data[0].warnings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
  });

  it('should expose stale auto snapshot diagnostics only with includeUnavailable', async () => {
    const hidden = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginGantt.gantt'],
        expand: ['item.identity', 'item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot({ warnings: [createSnapshotStaleWarning()] })],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(hidden.data).toEqual([]);

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginGantt.gantt'],
        includeUnavailable: true,
        expand: ['item.identity', 'item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot({ warnings: [createSnapshotStaleWarning()] })],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        identity: {
          capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
        },
        availability: expect.objectContaining({
          render: expect.objectContaining({
            supported: false,
            reasonCode: 'snapshot-stale',
            reasonSource: 'registry',
          }),
        }),
        readiness: 'blocked',
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'auto-discovered-readonly',
          }),
          expect.objectContaining({
            code: 'snapshot-stale',
          }),
        ]),
      }),
    ]);
  });

  it('should sanitize unsafe auto snapshot metadata before public exposure', async () => {
    const options = {
      enabledPackages: new Set(['@nocobase/plugin-unsafe']),
      autoSnapshots: [createUnsafeAutoSnapshot()],
      catalog: createCatalogRecorder().catalog,
      generatedAt: '2026-06-04T00:00:00.000Z',
    };
    const list = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginUnsafe.unsafe'],
        includeUnavailable: true,
        expand: ['item.semantic', 'item.warnings'],
      },
      options,
    );
    const detail = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'pluginUnsafe.unsafe',
        includeUnavailable: true,
        expand: ['item.semantic', 'item.warnings'],
      },
      options,
    );

    [list.data[0], detail.data].forEach((item) => {
      const serialized = JSON.stringify(item);
      expect(serialized).not.toContain('UnsafeBlockModel');
      expect(serialized).not.toContain('packages/foo');
      expect(serialized).not.toContain('props');
      expect(item).toMatchObject({
        publicType: 'pluginUnsafe.unsafe',
        label: 'pluginUnsafe.unsafe',
        semantic: {
          title: 'pluginUnsafe.unsafe',
          aliases: ['pluginUnsafe.unsafe', 'unsafe'],
        },
        warnings: expect.arrayContaining([
          {
            code: 'unsafe-semantic-text',
            message: 'Capability metadata was partially sanitized.',
          },
          {
            code: 'snapshot-stale',
            message: 'Capability metadata was partially sanitized.',
          },
        ]),
      });
    });
  });

  it('should reject unsafe auto snapshot public types before public exposure', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['pluginUnsafe.props'],
        includeUnavailable: true,
        expand: ['item.identity', 'item.semantic', 'item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-unsafe']),
        autoSnapshots: [createUnsafePublicTypeAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);
  });

  it('should expose inferred field component auto snapshots as create-enabled capabilities', async () => {
    const options = {
      enabledPackages: new Set(['@nocobase/plugin-fields']),
      autoSnapshots: [createInputFieldAutoSnapshot()],
      catalog: createCatalogRecorder().catalog,
      generatedAt: '2026-06-04T00:00:00.000Z',
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        kinds: ['fieldComponent'],
        publicTypes: ['pluginFields.input'],
        includeUnavailable: true,
        expand: ['item.identity'],
      },
      options,
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        kind: 'fieldComponent',
        publicType: 'pluginFields.input',
        origin: 'autoSnapshot',
        supportLevel: 'create-only',
        identity: {
          capabilityId: '@nocobase/plugin-fields:autoSnapshot:fieldComponent:pluginFields.input',
        },
        availability: expect.objectContaining({
          create: expect.objectContaining({ supported: true }),
        }),
      }),
    ]);

    await expect(
      buildFlowSurfaceDescribeCapabilityResponse(
        {
          capabilityId: response.data[0].identity?.capabilityId,
          includeUnavailable: true,
        },
        options,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'fieldComponent',
          publicType: 'pluginFields.input',
          supportLevel: 'create-only',
        }),
      }),
    );
  });

  it('should merge client-v2 auto snapshots into canonical core capabilities by model use', async () => {
    const coreSnapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/client-v2',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'core-client-v2-source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'RefreshActionModel',
          className: 'RefreshActionModel',
          source: 'src/flow/models/actions/RefreshActionModel.tsx',
          evidenceSource: 'ast',
          confidence: 'high',
        },
        {
          type: 'menu.itemRegistered',
          menuKey: 'refresh',
          label: 'Refresh',
          modelUse: 'RefreshActionModel',
          slot: 'actions',
          createModelOptionsStatus: 'static',
          source: 'src/flow/models/actions/RefreshActionModel.tsx',
          evidenceSource: 'ast',
          confidence: 'high',
        },
      ],
    });
    const { service } = createAutoSnapshotService([coreSnapshot]);
    const response = await service.capabilities(
      {
        kinds: ['action'],
        query: 'nocobaseClientV2.refresh',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(),
      },
    );

    expect(response.data.map((item) => item.publicType)).toEqual(['refresh']);
    expect(response.data[0]).toMatchObject({
      ownerPlugin: '@nocobase/core/client',
      origin: 'builtInStatic',
      availability: {
        create: expect.objectContaining({ supported: true }),
      },
    });
  });

  it('should hide auto snapshot capabilities when the owner plugin is disabled', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(),
        autoSnapshots: [createGanttAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);
  });

  it('should keep auto snapshot capabilities out of target-scoped discovery', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        target: {
          uid: 'target-1',
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [createGanttAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);

    let caught: unknown;
    try {
      await buildFlowSurfaceDescribeCapabilityResponse(
        {
          publicType: 'pluginGantt.gantt',
          target: {
            uid: 'target-1',
          },
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
          autoSnapshots: [createGanttAutoSnapshot()],
          catalog: createCatalogRecorder().catalog,
          generatedAt: '2026-06-04T00:00:00.000Z',
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
      reasonCode: 'unsupported',
      reasonSource: 'registry',
      publicType: 'pluginGantt.gantt',
    });
  });

  it('should keep verifiedAuto auto snapshot admission out of target-scoped discovery', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const admissionReports = [createVerifiedAutoAdmissionReport()];
    const capabilityPolicyConfig = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        target: {
          uid: 'target-1',
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [autoSnapshot],
        admissionReports,
        capabilityPolicyConfig,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.meta.targetHintUsed).toBe(true);
    expect(response.data).toEqual([]);

    let caught: unknown;
    try {
      await buildFlowSurfaceDescribeCapabilityResponse(
        {
          publicType: 'pluginGantt.gantt',
          target: {
            uid: 'target-1',
          },
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
          autoSnapshots: [autoSnapshot],
          admissionReports,
          capabilityPolicyConfig,
          catalog: createCatalogRecorder().catalog,
          generatedAt: '2026-06-04T00:00:00.000Z',
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
      reasonCode: 'unsupported',
      reasonSource: 'registry',
      publicType: 'pluginGantt.gantt',
    });
  });

  it('should expose auto snapshots through service capabilities and describeCapability', async () => {
    const { service } = createAutoSnapshotService([createGanttAutoSnapshot()]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);

    const capabilities = await service.capabilities(
      {
        query: 'gantt',
      },
      {
        enabledPackages,
      },
    );

    expect(capabilities.data).toMatchObject([
      {
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        availability: {
          create: {
            supported: false,
            reasonCode: 'manifest-required',
          },
          configure: {
            supported: false,
            reasonCode: 'manifest-required',
          },
        },
      },
    ]);

    const detail = await service.describeCapability(
      {
        publicType: 'pluginGantt.gantt',
        expand: ['item.warnings'],
      },
      {
        enabledPackages,
      },
    );

    expect(detail.data).toMatchObject({
      publicType: 'pluginGantt.gantt',
      identity: {
        capabilityId: '@nocobase/plugin-gantt:autoSnapshot:block:pluginGantt.gantt',
      },
      warnings: expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
      availability: {
        create: {
          supported: false,
        },
        configure: {
          supported: false,
        },
      },
    });
  });

  it('should prefer higher-priority public types and expose conflicts only diagnostically', async () => {
    const providerRegistry = createProviderRegistry([createConflictingTableProvider()]);
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'table',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-conflict']),
        providerRegistry,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        kind: 'block',
        publicType: 'table',
        ownerPlugin: '@nocobase/core/client',
      }),
    ]);

    const diagnostics = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['table'],
        ownerPlugins: ['@nocobase/plugin-conflict'],
        includeUnavailable: true,
        expand: ['item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-conflict']),
        providerRegistry,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(diagnostics.data).toEqual([
      expect.objectContaining({
        ownerPlugin: '@nocobase/plugin-conflict',
        publicType: 'table',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'public-type-conflict',
            reasonSource: 'registry',
          }),
        }),
        readiness: 'blocked',
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'public-type-conflict',
          }),
        ]),
      }),
    ]);
  });

  it('should preserve absorbed auto snapshot diagnostics after public type conflict marking', async () => {
    const providerRegistry = createProviderRegistry([createConflictingTableProvider()]);
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['table'],
        ownerPlugins: ['@nocobase/plugin-conflict'],
        includeUnavailable: true,
        expand: ['item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-conflict']),
        providerRegistry,
        autoSnapshots: [createTableAlternativeAutoSnapshot()],
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        ownerPlugin: '@nocobase/plugin-conflict',
        publicType: 'table',
        publicTypeMeta: expect.objectContaining({
          searchAliases: expect.arrayContaining(['Shadow table alternative']),
        }),
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'public-type-conflict',
            reasonSource: 'registry',
          }),
        }),
        readiness: 'blocked',
        warnings: expect.arrayContaining([
          expect.objectContaining({
            code: 'readback-parity-missing',
          }),
          expect.objectContaining({
            code: 'public-type-conflict',
          }),
        ]),
      }),
    ]);
    expect(response.data[0].warnings).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
  });

  it('should hide provider capabilities when their owner plugin is not enabled', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);
  });

  it('should match provider capabilities by accepted search aliases', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'ganttBlock',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        publicTypeMeta: expect.objectContaining({
          source: 'canary',
          acceptedAliases: ['ganttBlock'],
          searchAliases: expect.arrayContaining(['@nocobase/plugin-gantt:gantt']),
        }),
      }),
    ]);
  });

  it('should only expose provider capabilities returned by target-scoped catalog', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        target: {
          targetUid: 'target-1',
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(recorder.calls[0]).toMatchObject({
      target: {
        uid: 'target-1',
      },
    });
    expect(response.data).toEqual([]);
  });

  it('should reuse provider discovery for catalog and capability projection', async () => {
    const baseProvider = createGanttProvider();
    const getCapabilities = vi.fn(baseProvider.getCapabilities);
    const provider = { ...baseProvider, getCapabilities };
    const providerRegistry = createProviderRegistry([provider]);
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    class ProviderCatalogService extends FlowSurfacesService {
      override async catalog(
        values: FlowSurfaceCatalogValues,
        options: Parameters<FlowSurfacesService['catalog']>[1] = {},
      ): Promise<FlowSurfaceCatalogResponse> {
        return {
          target: null,
          scenario: {
            surfaceKind: 'global' as const,
          },
          selectedSections: values.sections || [],
          blocks: await collectProviderCatalogItems({
            providerRegistry,
            providerCapabilities: options.providerCapabilities,
            enabledPackages,
          }),
        };
      }
    }
    const service = new ProviderCatalogService({
      flowSurfaceCapabilityProviders: providerRegistry,
    } as unknown as ConstructorParameters<typeof FlowSurfacesService>[0]);
    const response = await service.capabilities(
      {
        query: 'gantt',
      },
      {
        enabledPackages,
      },
    );

    expect(getCapabilities).toHaveBeenCalledTimes(1);
    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        placement: {
          scenes: ['page', 'tab'],
          slots: ['blocks'],
          collectionRequired: true,
        },
      }),
    ]);
  });

  it('should return provider identity, settings, warnings, and full semantic only when expanded', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['gantt'],
        expand: ['item.identity', 'item.settings', 'item.warnings', 'item.semantic'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0]).toMatchObject({
      identity: {
        capabilityId: 'plugin:%40nocobase%2Fplugin-gantt#blocks.gantt',
        capabilityVersion: '1.0.0',
      },
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
        properties: {
          startField: {
            type: 'string',
          },
          displaySettings: {
            type: 'object',
          },
        },
      },
      configureOptions: {
        titleField: {
          type: 'string',
        },
      },
      warnings: [
        {
          code: 'contract-not-verified',
        },
      ],
      semantic: {
        description: 'Visualizes collection records on a time scale.',
      },
    });
  });

  it('should expose deprecated replacement metadata only through identity expand', async () => {
    const deprecatedProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-gantt',
      getCapabilities: () => [
        {
          id: 'blocks.legacyGantt',
          capabilityVersion: '1.0.0',
          kind: 'block',
          publicType: 'legacyGantt',
          acceptedAliases: ['oldGantt'],
          deprecated: true,
          replacedBy: {
            kind: 'block',
            publicType: 'gantt',
            ownerPlugin: '@nocobase/plugin-gantt',
          },
          label: 'Legacy Gantt',
          semantic: {
            title: 'Legacy Gantt',
          },
          implementation: {
            modelUse: 'LegacyGanttBlockModel',
          },
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
      resolveCreate: () => ({
        use: 'LegacyGanttBlockModel',
      }),
    };

    const defaultResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['legacyGantt'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([deprecatedProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );
    expect(defaultResponse.data[0]).not.toHaveProperty('identity');

    const expandedResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['oldGantt'],
        expand: ['item.identity'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([deprecatedProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(expandedResponse.data).toEqual([
      expect.objectContaining({
        publicType: 'legacyGantt',
        publicTypeMeta: expect.objectContaining({
          acceptedAliases: ['oldGantt'],
        }),
        identity: {
          capabilityId: 'plugin:%40nocobase%2Fplugin-gantt#blocks.legacyGantt',
          capabilityVersion: '1.0.0',
          deprecated: true,
          replacedBy: {
            kind: 'block',
            publicType: 'gantt',
            ownerPlugin: '@nocobase/plugin-gantt',
          },
        },
      }),
    ]);
    expect(JSON.stringify(expandedResponse.data)).not.toContain('LegacyGanttBlockModel');
  });

  it('should project provider catalog items for global catalog composition', async () => {
    const items = await collectProviderCatalogItems({
      providerRegistry: createProviderRegistry([createGanttProvider()]),
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      key: 'gantt',
      label: 'Gantt',
      use: 'GanttBlockModel',
      kind: 'block',
      ownerPlugin: '@nocobase/plugin-gantt',
      origin: 'canaryOverlay',
      createSupported: true,
      availability: {
        create: {
          supported: true,
        },
      },
      requiredInitParams: ['collectionName'],
    });
  });

  it('should project verifiedAuto auto snapshots into target-scoped catalog only after trusted admission', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const items = collectVerifiedAutoSnapshotCatalogItems({
      autoSnapshots: [autoSnapshot],
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      admissionReports: [createVerifiedAutoAdmissionReport()],
      capabilityPolicyConfig: {
        writePolicy: {
          mode: 'verifiedAuto',
          allowedOwners: ['@nocobase/plugin-gantt'],
          allowedPublicTypes: ['pluginGantt.gantt'],
        },
      },
    });

    expect(items).toEqual([
      expect.objectContaining({
        key: 'pluginGantt.gantt',
        label: 'Gantt',
        use: 'pluginGantt.gantt',
        kind: 'block',
        publicType: 'pluginGantt.gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-only',
        createSupported: true,
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
          configure: expect.objectContaining({
            supported: false,
            reasonCode: 'contract-not-verified',
            reasonSource: 'registry',
          }),
        }),
      }),
    ]);
    expect(items[0].warnings || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'auto-discovered-readonly',
        }),
      ]),
    );
    const serialized = JSON.stringify(items);
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('snapshot-source-hash');
    expect(serialized).not.toContain('manifest-hash');
    expect(serialized).not.toContain('fixture-hash');
  });

  it('should project JSON inferred auto snapshots into target-scoped catalog without providers', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const items = collectJsonInferredAutoSnapshotCatalogItems({
      autoSnapshots: [autoSnapshot],
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
    });

    expect(items).toEqual([
      expect.objectContaining({
        key: 'gantt',
        label: 'Gantt',
        use: 'gantt',
        kind: 'block',
        publicType: 'gantt',
        ownerPlugin: '@nocobase/plugin-gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-with-settings',
        createSupported: true,
        confidence: 'high',
        requiredInitParams: ['collectionName'],
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
            acceptsInitParams: true,
            acceptsSettings: true,
          }),
        }),
        settingsSchema: expect.objectContaining({
          required: ['titleField', 'startField', 'endField'],
        }),
        configureOptions: expect.objectContaining({
          titleField: expect.objectContaining({
            type: 'string',
          }),
        }),
      }),
    ]);
    expect(
      collectJsonInferredAutoSnapshotCatalogItems({ autoSnapshots: [autoSnapshot], enabledPackages: new Set() }),
    ).toEqual([]);
    expect(
      collectJsonInferredAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        placementFilter: (item) => item.placement?.slots?.includes('actions') === true,
      }),
    ).toEqual([]);
    expect(
      collectJsonInferredAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        placementFilter: (item) =>
          item.placement?.slots?.includes('blocks') === true && item.placement?.scenes?.includes('page') === true,
      }),
    ).toHaveLength(1);
    const serialized = JSON.stringify(items);
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('TableActionsColumnModel');
    expect(serialized).not.toContain('stepParams');
    expect(serialized).not.toContain('props');
  });

  it('should expose JSON inferred target-scoped settings contracts through capabilities and describe', async () => {
    const autoSnapshot = createGanttAutoSnapshot({ inferredAuthoring: true });
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const catalogItems = collectJsonInferredAutoSnapshotCatalogItems({
      autoSnapshots: [autoSnapshot],
      enabledPackages,
    });
    const catalog = async (values: FlowSurfaceCatalogValues): Promise<FlowSurfaceCatalogResponse> => ({
      target: {
        uid: 'target-grid',
      } as FlowSurfaceCatalogResponse['target'],
      scenario: {
        surfaceKind: 'global',
      },
      selectedSections: values.sections || ['blocks'],
      blocks: catalogItems,
    });

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        target: {
          uid: 'target-grid',
        },
        publicTypes: ['pluginGantt.gantt'],
        expand: ['item.settings'],
      },
      {
        enabledPackages,
        catalog,
        includeCatalogSettingsSchema: true,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        publicTypeMeta: expect.objectContaining({
          acceptedAliases: expect.arrayContaining(['pluginGantt.gantt']),
        }),
        origin: 'autoSnapshot',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
            acceptsInitParams: true,
            acceptsSettings: true,
          }),
        }),
        placement: expect.objectContaining({
          collectionRequired: true,
        }),
        settingsSchema: expect.objectContaining({
          required: ['titleField', 'startField', 'endField'],
        }),
        configureOptions: expect.objectContaining({
          startField: expect.objectContaining({
            type: 'string',
          }),
        }),
      }),
    ]);

    const described = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        target: {
          uid: 'target-grid',
        },
        publicType: 'pluginGantt.gantt',
        expand: ['item.settings'],
      },
      {
        enabledPackages,
        catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(described.data).toMatchObject({
      publicType: 'gantt',
      publicTypeMeta: {
        acceptedAliases: expect.arrayContaining(['pluginGantt.gantt']),
      },
      origin: 'autoSnapshot',
      settingsSchema: {
        required: ['titleField', 'startField', 'endField'],
      },
      configureOptions: {
        titleField: {
          type: 'string',
        },
      },
    });
    const serialized = JSON.stringify({ response, described });
    expect(serialized).not.toContain('GanttBlockModel');
    expect(serialized).not.toContain('TableActionsColumnModel');
    expect(serialized).not.toContain('stepParams');
    expect(serialized).not.toContain('props');
  });

  it('should keep verifiedAuto auto snapshots out of catalog without strict gates', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const enabledPackages = new Set(['@nocobase/plugin-gantt']);
    const verifiedAutoPolicy = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-gantt'],
        allowedPublicTypes: ['pluginGantt.gantt'],
      },
    };

    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
          },
        },
      }),
    ).toEqual([]);
    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'manifestOnly',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      }),
    ).toEqual([]);
    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-other'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      }),
    ).toEqual([]);
    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        admissionReports: [
          createVerifiedAutoAdmissionReport({
            snapshotHash: 'older-snapshot-hash',
          }),
        ],
        capabilityPolicyConfig: verifiedAutoPolicy,
      }),
    ).toEqual([]);
    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [
          {
            ...autoSnapshot,
            version: 999,
          } as unknown as ReturnType<typeof createGanttAutoSnapshot>,
        ],
        enabledPackages,
        admissionReports: [
          createVerifiedAutoAdmissionReport({
            snapshotHash: 'v999:snapshot-source-hash',
          }),
        ],
        capabilityPolicyConfig: verifiedAutoPolicy,
      }),
    ).toEqual([]);
    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages: new Set<string>(),
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: verifiedAutoPolicy,
      }),
    ).toEqual([]);
  });

  it('should suppress generic auto duplicates for statically known blocks', async () => {
    const autoSnapshot = createCalendarAutoSnapshot();
    const admissionReports = [createCalendarVerifiedAutoAdmissionReport()];
    const capabilityPolicyConfig = {
      writePolicy: {
        mode: 'verifiedAuto' as const,
        allowedOwners: ['@nocobase/plugin-calendar'],
        allowedPublicTypes: ['pluginCalendar.calendar'],
      },
    };
    const enabledPackages = new Set(['@nocobase/plugin-calendar']);

    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages,
        admissionReports,
        capabilityPolicyConfig,
      }),
    ).toEqual([]);

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'calendar',
        includeUnavailable: true,
      },
      {
        enabledPackages,
        autoSnapshots: [autoSnapshot],
        admissionReports,
        capabilityPolicyConfig,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);
    expect(JSON.stringify(response.data)).not.toContain('CalendarBlockModel');
    expect(JSON.stringify(response.data)).not.toContain('calendar-source-hash');
  });

  it('should require the admitted Gantt hidden model before verifiedAuto catalog projection', () => {
    const autoSnapshot = createGanttAutoSnapshot({
      modelUse: 'GanttModel',
    });

    expect(
      collectVerifiedAutoSnapshotCatalogItems({
        autoSnapshots: [autoSnapshot],
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
      }),
    ).toEqual([]);
  });

  it('should expose verifiedAuto auto snapshot catalog items through target-scoped capability projection', async () => {
    const autoSnapshot = createGanttAutoSnapshot();
    const catalogItems = collectVerifiedAutoSnapshotCatalogItems({
      autoSnapshots: [autoSnapshot],
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
      admissionReports: [createVerifiedAutoAdmissionReport()],
      capabilityPolicyConfig: {
        writePolicy: {
          mode: 'verifiedAuto',
          allowedOwners: ['@nocobase/plugin-gantt'],
          allowedPublicTypes: ['pluginGantt.gantt'],
        },
      },
    });
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
        target: {
          uid: 'target-1',
        },
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        autoSnapshots: [autoSnapshot],
        admissionReports: [createVerifiedAutoAdmissionReport()],
        capabilityPolicyConfig: {
          writePolicy: {
            mode: 'verifiedAuto',
            allowedOwners: ['@nocobase/plugin-gantt'],
            allowedPublicTypes: ['pluginGantt.gantt'],
          },
        },
        catalog: async (values) => ({
          target: null,
          scenario: {
            surfaceKind: 'global' as const,
          },
          selectedSections: values.sections || [],
          blocks: catalogItems,
        }),
        generatedAt: '2026-06-04T00:00:00.000Z',
      },
    );

    expect(response.meta.targetHintUsed).toBe(true);
    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'pluginGantt.gantt',
        origin: 'autoSnapshot',
        supportLevel: 'create-only',
        readiness: 'createEnabled',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
      }),
    ]);
    expect(JSON.stringify(response.data)).not.toContain('GanttBlockModel');
  });

  it('should drop provider catalog items that conflict with existing public catalog types', async () => {
    const providerCatalogItems = await collectProviderCatalogItems({
      providerRegistry: createProviderRegistry([createConflictingTableProvider()]),
      enabledPackages: new Set(['@nocobase/plugin-conflict']),
    });

    expect(
      filterProviderCatalogItemsForCatalog({
        existingItems: [
          {
            key: 'table',
            label: 'Table',
            use: 'TableBlockModel',
            kind: 'block',
            publicType: 'table',
          },
        ],
        providerItems: providerCatalogItems,
      }),
    ).toEqual([]);
  });

  it('should not duplicate static blocks with namespaced generic auto capabilities', async () => {
    const autoSnapshot = buildFlowSurfaceAutoSnapshot({
      plugin: '@nocobase/plugin-demo',
      generatedAt: '2026-06-04T00:00:00.000Z',
      sourceHash: 'source-hash',
      extractorVersion: 'test',
      events: [
        {
          type: 'model.registered',
          modelUse: 'TableBlockModel',
          className: 'TableBlockModel',
          source: 'packages/plugins/@nocobase/plugin-demo/src/client-v2/plugin.tsx',
          evidenceSource: 'ast',
          confidence: 'medium',
        },
      ],
    });
    const staticTable: FlowSurfaceCatalogItem = {
      key: 'table',
      label: 'Table',
      use: 'TableBlockModel',
      kind: 'block',
      publicType: 'table',
      createSupported: true,
    };
    const autoCatalogItems = collectJsonInferredAutoSnapshotCatalogItems({
      autoSnapshots: [autoSnapshot],
      enabledPackages: new Set(['@nocobase/plugin-demo']),
    });

    expect(autoCatalogItems).toHaveLength(1);
    expect(
      filterProviderCatalogItemsForCatalog({
        existingItems: [staticTable],
        providerItems: autoCatalogItems,
      }),
    ).toEqual([]);

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-demo']),
        autoSnapshots: [autoSnapshot],
        catalog: async () => ({
          target: null,
          scenario: {
            surfaceKind: 'global',
          },
          selectedSections: ['blocks'],
          blocks: [staticTable],
        }),
      },
    );

    expect(response.data.map((item) => item.publicType)).toEqual(['table']);
  });

  it('should ignore non-block provider capabilities until catalog placement is implemented', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        kinds: ['action'],
        query: 'external',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-action-provider']),
        providerRegistry: createProviderRegistry([createActionProvider()]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([]);
  });

  it('should not trust provider create/configure support without contracts', async () => {
    const optimisticProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-optimistic',
      getCapabilities: () => [
        {
          id: 'blocks.optimistic',
          kind: 'block',
          publicType: 'optimistic',
          label: 'Optimistic',
          semantic: {
            title: 'Optimistic',
          },
          implementation: {
            modelUse: 'OptimisticBlockModel',
          },
          availability: {
            create: {
              supported: true,
            },
            configure: {
              supported: true,
            },
          },
        },
      ],
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'optimistic',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-optimistic']),
        providerRegistry: createProviderRegistry([optimisticProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0].availability.create).toMatchObject({
      supported: false,
      reasonCode: 'missing-create-contract',
      reasonSource: 'registry',
    });
    expect(response.data[0].readiness).toBe('readbackVerified');
    expect(response.data[0].availability.configure).toMatchObject({
      supported: false,
      reasonCode: 'settings-schema-missing',
      reasonSource: 'registry',
    });
  });

  it('should keep provider catalog items without create contracts out of catalog projection', async () => {
    const optimisticProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-optimistic',
      getCapabilities: () => [
        {
          id: 'blocks.optimistic',
          kind: 'block',
          publicType: 'optimistic',
          label: 'Optimistic',
          semantic: {
            title: 'Optimistic',
          },
          implementation: {
            modelUse: 'OptimisticBlockModel',
          },
          availability: {
            create: {
              supported: true,
            },
          },
        },
      ],
    };

    await expect(
      collectProviderCatalogItems({
        providerRegistry: createProviderRegistry([optimisticProvider]),
        enabledPackages: new Set(['@nocobase/plugin-optimistic']),
      }),
    ).resolves.toEqual([]);
  });

  it('should keep provider catalog items with failed dry-run readiness out of catalog projection', async () => {
    const dryRunFailedProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-dry-run-failed',
      getCapabilities: () => [
        {
          id: 'blocks.failedDryRun',
          kind: 'block',
          publicType: 'failedDryRun',
          label: 'Failed dry run',
          semantic: {
            title: 'Failed dry run',
          },
          implementation: {
            modelUse: 'FailedDryRunBlockModel',
          },
          availability: {
            create: {
              supported: true,
              reasonCode: 'dry-run-failed',
              reasonSource: 'provider',
            },
          },
        },
      ],
      resolveCreate: () => ({
        use: 'FailedDryRunBlockModel',
      }),
    };
    const providerRegistry = createProviderRegistry([dryRunFailedProvider]);
    const enabledPackages = new Set(['@nocobase/plugin-dry-run-failed']);

    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['failedDryRun'],
        includeUnavailable: true,
      },
      {
        enabledPackages,
        providerRegistry,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-05T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'failedDryRun',
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: false,
            reasonCode: 'dry-run-failed',
            reasonSource: 'provider',
          }),
        }),
        readiness: 'blocked',
        supportLevel: 'readback-only',
      }),
    ]);
    expect(JSON.stringify(response.data)).not.toContain('FailedDryRunBlockModel');
    await expect(
      collectProviderCatalogItems({
        providerRegistry,
        enabledPackages,
      }),
    ).resolves.toEqual([]);
  });

  it('should allowlist provider availability metadata', async () => {
    const unsafeAvailability = {
      render: {
        supported: true,
        reasonCode: 'private-reason',
        reasonSource: 'private-source',
        modelUse: 'AvailabilityLeakModel',
      },
      readback: {
        supported: true,
        reasonCode: 'supported',
        reasonSource: 'provider',
        stepParams: {
          hidden: 'AvailabilityLeakModel',
        },
      },
      create: {
        supported: true,
        reasonCode: 'supported',
        reasonSource: 'provider',
        acceptsInitParams: true,
        acceptsSettings: true,
        hidden: 'AvailabilityLeakModel',
      },
      configure: {
        supported: false,
        reasonCode: 'private-reason',
        reasonSource: 'private-source',
        implementation: {
          modelUse: 'AvailabilityLeakModel',
        },
      },
    } as unknown as FlowSurfaceCapabilityManifestItem['availability'];
    const unsafeProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-availability',
      getCapabilities: () => [
        {
          id: 'blocks.availability',
          kind: 'block',
          publicType: 'availability',
          label: 'Availability',
          semantic: {
            title: 'Availability',
          },
          implementation: {
            modelUse: 'AvailabilityBlockModel',
          },
          createRecipe: {
            nodeTemplate: {
              use: 'AvailabilityBlockModel',
            },
          },
          settingsSchema: {
            type: 'object',
          },
          availability: unsafeAvailability,
        },
      ],
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['availability'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-availability']),
        providerRegistry: createProviderRegistry([unsafeProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0].availability).toMatchObject({
      render: {
        supported: true,
      },
      readback: {
        supported: true,
        reasonCode: 'supported',
        reasonSource: 'provider',
      },
      create: {
        supported: true,
        reasonCode: 'supported',
        reasonSource: 'provider',
        acceptsInitParams: true,
        acceptsSettings: true,
      },
      configure: {
        supported: false,
        reasonCode: 'unsupported',
        reasonSource: 'registry',
      },
    });
    expect(response.data[0].availability.render).not.toHaveProperty('reasonCode');
    expect(response.data[0].availability.render).not.toHaveProperty('reasonSource');
    expect(JSON.stringify(response.data)).not.toContain('AvailabilityLeakModel');
    expect(JSON.stringify(response.data)).not.toContain('stepParams');
    expect(JSON.stringify(response.data)).not.toContain('hidden');
    expect(JSON.stringify(response.data)).not.toContain('implementation');
    expect(JSON.stringify(response.data)).not.toContain('private-reason');
    expect(JSON.stringify(response.data)).not.toContain('private-source');
  });

  it('should sanitize provider aliases, nested examples, and unsafe public schemas', async () => {
    const unsafeProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-unsafe',
      getCapabilities: () => [
        {
          id: 'blocks.unsafe',
          kind: 'block',
          publicType: 'unsafeProvider',
          acceptedAliases: ['UnsafeBlockModel', 'safeAlias'],
          label: 'UnsafeBlockModel',
          semantic: {
            title: 'UnsafeBlockModel',
            description: 'Uses UnsafeBlockModel internally.',
            aliases: ['UnsafeBlockModel', 'safeSemanticAlias'],
            domainTags: ['UnsafeBlockModel', 'safe-domain'],
            intentTags: ['UnsafeBlockModel', 'safe intent'],
            examples: [
              {
                userIntent: 'safe example',
                publicPayloadSnippet: {
                  type: 'unsafeProvider',
                  settings: {
                    title: 'Safe',
                  },
                },
              },
              {
                userIntent: 'unsafe nested example',
                publicPayloadSnippet: {
                  type: 'unsafeProvider',
                  settings: {
                    stepParams: {
                      hidden: true,
                    },
                    resourceInit: {
                      collectionName: 'tasks',
                    },
                  },
                },
              },
            ],
          },
          placement: {
            scenes: ['page'],
            slots: ['blocks'],
            parentPublicTypes: ['UnsafeBlockModel', 'safeParent'],
            containerKinds: ['UnsafeContainerModel', 'safeContainer'],
          },
          implementation: {
            modelUse: 'UnsafeBlockModel',
          },
          settingsSchema: {
            type: 'object',
            properties: {
              stepParams: {
                type: 'object',
              },
              resourceSettings: {
                type: 'object',
              },
              resourceInit: {
                type: 'object',
              },
            },
          },
          configureOptions: {
            resourceInit: {
              type: 'object',
            },
            title: {
              type: 'string',
            },
          },
        },
      ],
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        publicTypes: ['unsafeProvider'],
        expand: ['item.semantic', 'item.settings', 'item.warnings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-unsafe']),
        providerRegistry: createProviderRegistry([unsafeProvider]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toHaveLength(1);
    expect(response.data[0].label).toBe('unsafeProvider');
    expect(response.data[0].placement).toMatchObject({
      parentPublicTypes: ['safeParent'],
      containerKinds: ['safeContainer'],
    });
    expect(response.data[0].publicTypeMeta).toMatchObject({
      acceptedAliases: ['safeAlias'],
      searchAliases: ['safeAlias', 'blocks.unsafe', 'unsafeProvider'],
    });
    expect(response.data[0].semantic).toMatchObject({
      title: 'unsafeProvider',
      aliases: ['safeSemanticAlias'],
      domainTags: ['safe-domain'],
      intentTags: ['safe intent'],
      examples: [
        {
          userIntent: 'safe example',
        },
      ],
    });
    expect(response.data[0].readiness).toBe('blocked');
    expect(response.data[0]).not.toHaveProperty('settingsSchema');
    expect(response.data[0]).not.toHaveProperty('configureOptions');
    expect(response.data[0].availability.configure).toMatchObject({
      supported: false,
      reasonCode: 'settings-schema-missing',
      reasonSource: 'registry',
    });
    expect(response.data[0].warnings?.map((warning) => warning.code)).toEqual(
      expect.arrayContaining(['unsafe-semantic-text', 'partial-settings-schema']),
    );
    expect(JSON.stringify(response.data)).not.toContain('UnsafeBlockModel');
    expect(JSON.stringify(response.data)).not.toContain('stepParams');
    expect(JSON.stringify(response.data)).not.toContain('resourceSettings');
    expect(JSON.stringify(response.data)).not.toContain('resourceInit');
  });

  it('should isolate provider failures and keep built-in capabilities available', async () => {
    const recorder = createCatalogRecorder();
    const brokenProvider: FlowSurfaceCapabilitiesProvider = {
      ownerPlugin: '@nocobase/plugin-broken',
      getCapabilities() {
        throw new Error('provider failed');
      },
    };
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {},
      {
        enabledPackages: new Set(['@nocobase/plugin-broken']),
        providerRegistry: createProviderRegistry([brokenProvider]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data.map((item) => [item.kind, item.publicType])).toEqual([
      ['block', 'table'],
      ['action', 'refresh'],
    ]);
  });

  it('should deduplicate provider capabilities already appended to catalog', async () => {
    const provider = createGanttProvider();
    const providerRegistry = createProviderRegistry([provider]);
    const providerCatalogItems = await collectProviderCatalogItems({
      providerRegistry,
      enabledPackages: new Set(['@nocobase/plugin-gantt']),
    });
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry,
        catalog: async () => ({
          target: null,
          scenario: {
            surfaceKind: 'global' as const,
          },
          selectedSections: ['blocks'],
          blocks: providerCatalogItems,
        }),
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toEqual([
      expect.objectContaining({
        publicType: 'gantt',
        publicTypeMeta: expect.objectContaining({
          source: 'canary',
          acceptedAliases: ['ganttBlock'],
          searchAliases: expect.arrayContaining(['@nocobase/plugin-gantt:gantt']),
        }),
      }),
    ]);

    const aliasResponse = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: 'ganttBlock',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry,
        catalog: async () => ({
          target: null,
          scenario: {
            surfaceKind: 'global' as const,
          },
          selectedSections: ['blocks'],
          blocks: providerCatalogItems,
        }),
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(aliasResponse.data.map((item) => item.publicType)).toEqual(['gantt']);
  });

  it('should describe one provider capability with public schemas when settings are expanded', async () => {
    const recorder = createCatalogRecorder();
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'gantt',
        target: {
          uid: 'target-1',
        },
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: recorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.meta).toEqual({
      version: 1,
      generatedAt: '2026-06-03T00:00:00.000Z',
      targetHintUsed: true,
    });
    expect(recorder.calls.map((call) => call.target || null)).toEqual([{ uid: 'target-1' }, null]);
    expect(response.data).toMatchObject({
      kind: 'block',
      publicType: 'gantt',
      ownerPlugin: '@nocobase/plugin-gantt',
      identity: {
        capabilityId: expect.any(String),
      },
      semantic: {
        description: 'Visualizes collection records on a time scale.',
      },
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
        properties: {
          startField: {
            type: 'string',
          },
        },
      },
      configureOptions: {
        titleField: {
          type: 'string',
        },
      },
      availability: {
        create: {
          supported: true,
        },
      },
    });
    expect(JSON.stringify(response.data)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(response.data)).not.toContain('stepParams');
    expect(JSON.stringify(response.data)).not.toContain('createRecipe');
  });

  it('should describe provider capabilities by accepted publicType alias with canonical output', async () => {
    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'ganttBlock',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject({
      publicType: 'gantt',
      publicTypeMeta: expect.objectContaining({
        acceptedAliases: expect.arrayContaining(['ganttBlock']),
      }),
      initParamsSchema: {
        required: ['collectionName'],
      },
      settingsSchema: {
        properties: {
          startField: {
            type: 'string',
          },
        },
      },
    });
    expect(JSON.stringify(response.data)).not.toContain('GanttBlockModel');
    expect(JSON.stringify(response.data)).not.toContain('stepParams');
  });

  it('should keep plugin-qualified provider aliases discovery-only for describe', async () => {
    const response = await buildFlowSurfaceCapabilitiesResponse(
      {
        query: '@nocobase/plugin-gantt:gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );
    expect(response.data.map((item) => item.publicType)).toEqual(['gantt']);

    await expect(
      buildFlowSurfaceDescribeCapabilityResponse(
        {
          publicType: '@nocobase/plugin-gantt:gantt',
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
          providerRegistry: createProviderRegistry([createGanttProvider()]),
          catalog: createCatalogRecorder().catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        },
      ),
    ).rejects.toMatchObject({
      options: {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          publicType: '@nocobase/plugin-gantt:gantt',
        },
      },
    });
  });

  it('should describe catalog-backed settings schema only when settings are expanded', async () => {
    const withoutSettings = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        kind: 'block',
        publicType: 'table',
      },
      {
        enabledPackages: new Set(),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );
    expect(withoutSettings.data).not.toHaveProperty('settingsSchema');
    expect(withoutSettings.data).not.toHaveProperty('configureOptions');

    const settingsRecorder = createCatalogRecorder();
    const withSettings = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        kind: 'block',
        publicType: 'table',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(),
        catalog: settingsRecorder.catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );
    expect(settingsRecorder.calls[0]).toEqual({
      sections: ['blocks'],
      expand: ['item.configureOptions', 'item.contracts', 'item.identity'],
    });
    expect(withSettings.data.settingsSchema).toMatchObject({
      type: 'object',
      properties: {
        pageSize: {
          type: 'number',
        },
      },
    });
    expect(withSettings.data.configureOptions).toMatchObject({
      pageSize: {
        type: 'number',
      },
    });

    const unsafeRecorder = createCatalogRecorder();
    const unsafeCatalog = async (values: FlowSurfaceCatalogValues) => {
      const response = await unsafeRecorder.catalog(values);
      return {
        ...response,
        blocks: [
          ...(response.blocks || []),
          {
            key: 'unsafeSchema',
            label: 'Unsafe schema',
            use: 'UnsafeSchemaBlockModel',
            kind: 'block' as const,
            publicType: 'unsafeSchema',
            ownerPlugin: '@nocobase/core/client',
            origin: 'builtInStatic' as const,
            confidence: 'high' as const,
            supportLevel: 'create-and-configure' as const,
            availability: {
              render: { supported: true },
              readback: { supported: true },
              create: { supported: true, acceptsInitParams: true, acceptsSettings: true },
              configure: { supported: true },
            },
            semantic: {
              title: 'Unsafe schema',
            },
            settingsSchema: {
              type: 'object',
              properties: {
                stepParams: {
                  type: 'object',
                  properties: {
                    openView: {
                      type: 'object',
                      properties: {
                        pageModelClass: {
                          type: 'string',
                          enum: ['UnsafeSchemaBlockModel'],
                        },
                      },
                    },
                  },
                },
              },
            },
            configureOptions: {
              resourceInit: {
                type: 'object' as const,
              },
              title: {
                type: 'string' as const,
              },
            },
          },
        ],
      };
    };

    const unsafe = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        kind: 'block',
        publicType: 'unsafeSchema',
        expand: ['item.settings'],
      },
      {
        enabledPackages: new Set(),
        catalog: unsafeCatalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );
    expect(unsafe.data).not.toHaveProperty('settingsSchema');
    expect(unsafe.data).not.toHaveProperty('configureOptions');
    expect(JSON.stringify(unsafe.data)).not.toContain('stepParams');
    expect(JSON.stringify(unsafe.data)).not.toContain('resourceInit');
    expect(JSON.stringify(unsafe.data)).not.toContain('UnsafeSchemaBlockModel');
  });

  it('should require includeUnavailable before describing a render-unsupported capability', async () => {
    const providerRegistry = createProviderRegistry([createRenderUnsupportedProvider()]);

    await expect(
      buildFlowSurfaceDescribeCapabilityResponse(
        {
          publicType: 'hiddenRender',
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-hidden']),
          providerRegistry,
          catalog: createCatalogRecorder().catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceBadRequestError);

    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'hiddenRender',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-hidden']),
        providerRegistry,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject({
      publicType: 'hiddenRender',
      availability: {
        render: {
          supported: false,
          reasonCode: 'unsupported',
        },
      },
    });
  });

  it('should reject targetless fieldComponent describe lookups before catalog lookup', async () => {
    const recorder = createCatalogRecorder();

    for (const input of [
      {
        kind: 'fieldComponent',
        publicType: 'code',
      },
      {
        capabilityId: 'builtInStatic:fieldComponent:%40nocobase%2Fplugin-field-code:code',
      },
    ] as const) {
      let caught: unknown;
      try {
        await buildFlowSurfaceDescribeCapabilityResponse(input, {
          enabledPackages: new Set(['@nocobase/plugin-field-code']),
          catalog: recorder.catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
      expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
        reasonCode: 'target-required',
        reasonSource: 'catalog',
        path: 'target',
      });
    }
    expect(recorder.calls).toHaveLength(0);
  });

  it('should describe one capability by read-only capabilityId', async () => {
    const firstResponse = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        publicType: 'gantt',
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        capabilityId: firstResponse.data.identity?.capabilityId,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-gantt']),
        providerRegistry: createProviderRegistry([createGanttProvider()]),
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data.publicType).toBe('gantt');
    expect(response.data.identity?.capabilityId).toBe(firstResponse.data.identity?.capabilityId);
    expect(response.data).not.toHaveProperty('settingsSchema');
    expect(response.data).not.toHaveProperty('configureOptions');
  });

  it('should require includeUnavailable before describing a lower-priority publicType conflict', async () => {
    const providerRegistry = createProviderRegistry([createConflictingTableProvider()]);

    await expect(
      buildFlowSurfaceDescribeCapabilityResponse(
        {
          kind: 'block',
          publicType: 'table',
          ownerPlugin: '@nocobase/plugin-conflict',
        },
        {
          enabledPackages: new Set(['@nocobase/plugin-conflict']),
          providerRegistry,
          catalog: createCatalogRecorder().catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        },
      ),
    ).rejects.toBeInstanceOf(FlowSurfaceBadRequestError);

    const response = await buildFlowSurfaceDescribeCapabilityResponse(
      {
        kind: 'block',
        publicType: 'table',
        ownerPlugin: '@nocobase/plugin-conflict',
        includeUnavailable: true,
      },
      {
        enabledPackages: new Set(['@nocobase/plugin-conflict']),
        providerRegistry,
        catalog: createCatalogRecorder().catalog,
        generatedAt: '2026-06-03T00:00:00.000Z',
      },
    );

    expect(response.data).toMatchObject({
      ownerPlugin: '@nocobase/plugin-conflict',
      availability: {
        create: {
          supported: false,
          reasonCode: 'public-type-conflict',
        },
      },
    });
  });

  it('should reject malformed describeCapability requests before catalog lookup', async () => {
    const recorder = createCatalogRecorder();

    for (const input of [
      {},
      {
        publicType: 'gantt',
        expand: ['debugImplementation'],
      },
      {
        publicType: 'gantt',
        target: {},
      },
      {
        publicType: 'gantt',
        foo: 'bar',
      },
      {
        publicType: {},
      },
      {
        capabilityId: ['x'],
      },
      {
        publicType: 'gantt',
        ownerPlugin: {},
      },
      {
        publicType: 'gantt',
        kind: 123,
      },
    ] as unknown[]) {
      let caught: unknown;
      try {
        await buildFlowSurfaceDescribeCapabilityResponse(input, {
          enabledPackages: new Set(['@nocobase/plugin-gantt']),
          providerRegistry: createProviderRegistry([createGanttProvider()]),
          catalog: recorder.catalog,
          generatedAt: '2026-06-03T00:00:00.000Z',
        });
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    }
    expect(recorder.calls).toHaveLength(0);
  });
});
