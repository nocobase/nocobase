/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, type InstallOptions } from '@nocobase/server';

const GANTT_OWNER_PLUGIN = '@nocobase/plugin-gantt';
const GANTT_TIME_SCALE_VALUES = ['hour', 'quarterDay', 'halfDay', 'day', 'week', 'month', 'year', 'quarterYear'];

type GanttFlowSurfaceCapabilityManifestItem = {
  id: string;
  capabilityVersion?: string;
  kind: 'block';
  publicType: string;
  acceptedAliases?: string[];
  label: string;
  semantic: {
    title: string;
    description?: string;
    aliases?: string[];
    domainTags?: string[];
    intentTags?: string[];
    suitableScenes?: string[];
  };
  placement?: {
    scenes?: Array<'page' | 'tab' | 'popup'>;
    slots?: Array<'blocks'>;
    collectionRequired?: boolean;
  };
  implementation: {
    modelUse: string;
    legacyModelUses?: string[];
  };
  availability?: {
    render?: { supported: boolean };
    readback?: { supported: boolean };
    create?: { supported: boolean; reasonCode?: 'missing-create-contract'; reasonSource?: 'registry' };
    configure?: { supported: boolean; reasonCode?: 'contract-not-verified'; reasonSource?: 'registry' };
  };
  supportLevel?: 'readback-only';
  confidence?: 'high';
  initParamsSchema?: Record<string, unknown>;
  settingsSchema?: Record<string, unknown>;
  configureOptions?: Record<
    string,
    {
      type: 'string' | 'number' | 'boolean';
      description?: string;
      enum?: Array<string | number | boolean>;
      example?: string | number | boolean;
    }
  >;
  warnings?: Array<{
    code: 'contract-not-verified';
    message: string;
  }>;
};

type GanttFlowSurfaceCapabilitiesProvider = {
  ownerPlugin: string;
  getCapabilities(ctx: {
    app?: unknown;
    enabledPlugins: ReadonlySet<string>;
  }): GanttFlowSurfaceCapabilityManifestItem[];
};

type FlowSurfaceCapabilityProviderRegistryLike = {
  registerProvider(provider: GanttFlowSurfaceCapabilitiesProvider): void;
  unregisterProvider(ownerPlugin: string): void;
};

type FlowEnginePluginLike = {
  flowSurfaceCapabilityProviders?: FlowSurfaceCapabilityProviderRegistryLike;
};

export function createGanttFlowSurfaceCapabilityProvider(): GanttFlowSurfaceCapabilitiesProvider {
  return {
    ownerPlugin: GANTT_OWNER_PLUGIN,
    getCapabilities() {
      return [
        {
          id: 'blocks.gantt',
          capabilityVersion: '1.0.0',
          kind: 'block',
          publicType: 'gantt',
          acceptedAliases: ['ganttBlock', '@nocobase/plugin-gantt:gantt'],
          label: 'Gantt',
          semantic: {
            title: 'Gantt',
            description: 'Visualizes collection records on a time scale using start and end date fields.',
            aliases: ['gantt', 'timeline', 'schedule'],
            domainTags: ['project-management', 'schedule', 'timeline'],
            intentTags: ['show timeline', 'track dates', 'plan tasks'],
            suitableScenes: ['page', 'tab', 'popup'],
          },
          placement: {
            scenes: ['page', 'tab', 'popup'],
            slots: ['blocks'],
            collectionRequired: true,
          },
          implementation: {
            modelUse: 'GanttBlockModel',
          },
          availability: {
            render: { supported: true },
            readback: { supported: true },
            create: {
              supported: false,
              reasonCode: 'missing-create-contract',
              reasonSource: 'registry',
            },
            configure: {
              supported: false,
              reasonCode: 'contract-not-verified',
              reasonSource: 'registry',
            },
          },
          supportLevel: 'readback-only',
          confidence: 'high',
          initParamsSchema: {
            type: 'object',
            additionalProperties: false,
            required: ['collectionName'],
            properties: {
              dataSourceKey: {
                type: 'string',
                default: 'main',
              },
              collectionName: {
                type: 'string',
              },
            },
          },
          settingsSchema: {
            type: 'object',
            additionalProperties: false,
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
              progressField: {
                type: 'string',
              },
              colorField: {
                type: 'string',
              },
              timeScale: {
                type: 'string',
                enum: GANTT_TIME_SCALE_VALUES,
                default: 'day',
              },
              pageSize: {
                type: 'number',
                minimum: 1,
              },
              showRowNumbers: {
                type: 'boolean',
              },
              treeTable: {
                type: 'boolean',
              },
              showTable: {
                type: 'boolean',
              },
              tableWidth: {
                type: 'number',
                minimum: 120,
              },
              enableDragToReschedule: {
                type: 'boolean',
              },
            },
          },
          configureOptions: {
            titleField: {
              type: 'string',
              description: 'Collection field used as the task title.',
            },
            startField: {
              type: 'string',
              description: 'Date-like collection field used as the task start date.',
            },
            endField: {
              type: 'string',
              description: 'Date-like collection field used as the task end date.',
            },
            progressField: {
              type: 'string',
              description: 'Optional numeric collection field used as task progress.',
            },
            colorField: {
              type: 'string',
              description: 'Optional select or color field used as the task color.',
            },
            timeScale: {
              type: 'string',
              enum: GANTT_TIME_SCALE_VALUES,
              example: 'day',
            },
            pageSize: {
              type: 'number',
              example: 20,
            },
            showRowNumbers: {
              type: 'boolean',
              example: true,
            },
            treeTable: {
              type: 'boolean',
              example: false,
            },
            showTable: {
              type: 'boolean',
              example: true,
            },
            tableWidth: {
              type: 'number',
              example: 320,
            },
            enableDragToReschedule: {
              type: 'boolean',
              example: true,
            },
          },
          warnings: [
            {
              code: 'contract-not-verified',
              message: 'Gantt is exposed for discovery only until create and readback parity are verified.',
            },
          ],
        },
      ];
    },
  };
}

export class PluginGanttServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.registerFlowSurfaceCapabilitiesProvider();
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {
    this.registerFlowSurfaceCapabilitiesProvider();
  }

  async afterDisable() {
    this.unregisterFlowSurfaceCapabilitiesProvider();
  }

  async remove() {
    this.unregisterFlowSurfaceCapabilitiesProvider();
  }

  private registerFlowSurfaceCapabilitiesProvider() {
    try {
      const registry = this.getFlowSurfaceCapabilityProviderRegistry();
      if (!registry) {
        return;
      }

      registry.registerProvider(createGanttFlowSurfaceCapabilityProvider());
    } catch {
      // Flow Surface discovery is optional; Gantt must still load if the registry is unavailable.
    }
  }

  private unregisterFlowSurfaceCapabilitiesProvider() {
    try {
      this.getFlowSurfaceCapabilityProviderRegistry()?.unregisterProvider(GANTT_OWNER_PLUGIN);
    } catch {
      // Flow Surface discovery is optional; Gantt must still unload if the registry is unavailable.
    }
  }

  private getFlowSurfaceCapabilityProviderRegistry() {
    const flowEngine = this.app.pm.get('flow-engine') as FlowEnginePluginLike | undefined;
    return flowEngine?.flowSurfaceCapabilityProviders;
  }
}

export default PluginGanttServer;
