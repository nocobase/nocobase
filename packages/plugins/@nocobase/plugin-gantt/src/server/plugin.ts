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
const GANTT_REQUIRED_SETTING_FIELDS = ['titleField', 'startField', 'endField'] as const;

type GanttFlowSurfaceCapabilityValidationError = {
  path: string;
  code: 'required' | 'invalid-type' | 'invalid-enum';
  message: string;
};

type GanttFlowSurfaceNodeSpec = {
  use: string;
  props?: Record<string, unknown>;
  stepParams?: Record<string, unknown>;
  subModels?: Record<string, GanttFlowSurfaceNodeSpec | GanttFlowSurfaceNodeSpec[]>;
};

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
  validateSettings?(
    capability: unknown,
    input: {
      initParams?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    },
  ): { ok: boolean; errors?: GanttFlowSurfaceCapabilityValidationError[] };
  resolveCreate?(
    capability: unknown,
    input: {
      initParams?: Record<string, unknown>;
      settings?: Record<string, unknown>;
    },
  ): GanttFlowSurfaceNodeSpec;
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
            required: [...GANTT_REQUIRED_SETTING_FIELDS],
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
                maximum: 200,
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
    validateSettings(_capability, input) {
      return validateGanttFlowSurfaceSettings(input);
    },
    resolveCreate(_capability, input) {
      return buildGanttFlowSurfaceNode(input);
    },
  };
}

function validateGanttFlowSurfaceSettings(input: {
  initParams?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}) {
  const initParams = input.initParams || {};
  const settings = input.settings || {};
  const errors: GanttFlowSurfaceCapabilityValidationError[] = [];
  if (typeof initParams.collectionName !== 'string' || !initParams.collectionName.trim()) {
    errors.push({
      path: 'initParams.collectionName',
      code: 'required',
      message: 'initParams.collectionName is required',
    });
  }
  for (const field of GANTT_REQUIRED_SETTING_FIELDS) {
    if (typeof settings[field] !== 'string' || !String(settings[field]).trim()) {
      errors.push({
        path: `settings.${field}`,
        code: 'required',
        message: `settings.${field} is required`,
      });
    }
  }
  for (const field of ['progressField', 'colorField'] as const) {
    if (typeof settings[field] !== 'undefined' && typeof settings[field] !== 'string') {
      errors.push({
        path: `settings.${field}`,
        code: 'invalid-type',
        message: `settings.${field} must be string`,
      });
    }
  }
  if (typeof settings.timeScale !== 'undefined' && !GANTT_TIME_SCALE_VALUES.includes(String(settings.timeScale))) {
    errors.push({
      path: 'settings.timeScale',
      code: 'invalid-enum',
      message: `settings.timeScale must be one of: ${GANTT_TIME_SCALE_VALUES.join(', ')}`,
    });
  }
  if (
    typeof settings.pageSize !== 'undefined' &&
    (typeof settings.pageSize !== 'number' ||
      !Number.isFinite(settings.pageSize) ||
      settings.pageSize < 1 ||
      settings.pageSize > 200)
  ) {
    errors.push({
      path: 'settings.pageSize',
      code: 'invalid-type',
      message: 'settings.pageSize must be between 1 and 200',
    });
  }
  return {
    ok: errors.length === 0,
    ...(errors.length ? { errors } : {}),
  };
}

function buildGanttFlowSurfaceNode(input: {
  initParams?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}): GanttFlowSurfaceNodeSpec {
  const initParams = input.initParams || {};
  const settings = input.settings || {};
  const fieldNames = {
    title: String(settings.titleField || ''),
    start: String(settings.startField || ''),
    end: String(settings.endField || ''),
    ...(typeof settings.progressField === 'string' && settings.progressField
      ? { progress: settings.progressField }
      : {}),
    ...(typeof settings.colorField === 'string' && settings.colorField ? { color: settings.colorField } : {}),
    range: typeof settings.timeScale === 'string' ? settings.timeScale : 'day',
  };
  return {
    use: 'GanttBlockModel',
    props: {
      fieldNames,
      showTable: settings.showTable !== false,
      enableDragToReschedule: settings.enableDragToReschedule !== false,
      ...(typeof settings.tableWidth === 'number' ? { tableWidth: settings.tableWidth } : {}),
      ...(typeof settings.treeTable === 'boolean' ? { treeTable: settings.treeTable } : {}),
    },
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: typeof initParams.dataSourceKey === 'string' ? initParams.dataSourceKey : 'main',
          collectionName: String(initParams.collectionName || ''),
        },
      },
      ganttSettings: {
        fields: fieldNames,
        ...(fieldNames.progress ? { processField: { progress: fieldNames.progress } } : {}),
        ...(fieldNames.color ? { colorField: { color: fieldNames.color } } : {}),
        showTable: {
          showTable: settings.showTable !== false,
        },
        ...(typeof settings.tableWidth === 'number' ? { tableWidth: { tableWidth: settings.tableWidth } } : {}),
        enableDragToReschedule: {
          enableDragToReschedule: settings.enableDragToReschedule !== false,
        },
      },
      tableSettings: {
        ...(typeof settings.pageSize === 'number' ? { pageSize: { pageSize: settings.pageSize } } : {}),
        ...(typeof settings.showRowNumbers === 'boolean'
          ? { showRowNumbers: { showIndex: settings.showRowNumbers } }
          : {}),
        ...(typeof settings.treeTable === 'boolean' ? { treeTable: { treeTable: settings.treeTable } } : {}),
      },
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
