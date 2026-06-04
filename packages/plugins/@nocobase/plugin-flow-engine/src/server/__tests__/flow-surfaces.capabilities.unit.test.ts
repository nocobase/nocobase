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
  collectProviderCatalogItems,
  filterProviderCatalogItemsForCatalog,
} from '../flow-surfaces/capability-registry';
import { FlowSurfaceBadRequestError } from '../flow-surfaces/errors';
import { buildFlowSurfaceAutoSnapshot } from '../flow-surfaces/extractor';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCapabilitiesValues,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityManifestItem,
  FlowSurfaceCapabilityWarning,
  FlowSurfaceCatalogResponse,
  FlowSurfaceCatalogValues,
} from '../flow-surfaces/types';

describe('flowSurfaces capabilities projection', () => {
  function createProviderRegistry(providers: FlowSurfaceCapabilitiesProvider[]) {
    return {
      listProviders: () => providers,
    };
  }

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
      warnings?: FlowSurfaceCapabilityWarning[];
    } = {},
  ) {
    const modelUse = options.modelUse || 'GanttBlockModel';
    const menuKey = options.menuKey || 'gantt';
    return buildFlowSurfaceAutoSnapshot({
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
          createModelOptionsStatus: 'static',
          source: `packages/plugins/@nocobase/plugin-gantt/src/client-v2/models/${modelUse}.tsx`,
          evidenceSource: 'ast',
          confidence: 'medium',
        },
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
        availability: expect.objectContaining({
          create: expect.objectContaining({
            supported: true,
          }),
        }),
      }),
    ]);
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
          acceptedAliases: ['ganttBlock', '@nocobase/plugin-gantt:gantt'],
          searchAliases: expect.arrayContaining(['Shadow timeline']),
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
          aliases: ['pluginUnsafe.unsafe'],
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
          expect.objectContaining({
            code: 'auto-discovered-readonly',
          }),
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

  it('should keep field component auto snapshots out of global discovery', async () => {
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
      },
      options,
    );

    expect(response.data).toEqual([]);

    let caught: unknown;
    try {
      await buildFlowSurfaceDescribeCapabilityResponse(
        {
          publicType: 'pluginFields.input',
        },
        options,
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(FlowSurfaceBadRequestError);
    expect((caught as FlowSurfaceBadRequestError).options.details).toMatchObject({
      reasonCode: 'unsupported',
      reasonSource: 'registry',
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
          acceptedAliases: ['ganttBlock', '@nocobase/plugin-gantt:gantt'],
        }),
      }),
    ]);
  });

  it('should keep provider capabilities global-only until target placement filtering exists', async () => {
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
          acceptedAliases: ['ganttBlock', '@nocobase/plugin-gantt:gantt'],
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
    expect(JSON.stringify(unsafe.data)).not.toContain('stepParams');
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
