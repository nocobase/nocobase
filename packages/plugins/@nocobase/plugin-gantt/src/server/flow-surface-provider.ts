/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilitiesProvider } from '@nocobase/plugin-flow-engine/server';

export const ganttFlowSurfaceCapabilitiesProvider: FlowSurfaceCapabilitiesProvider = {
  ownerPlugin: '@nocobase/plugin-gantt',
  getCapabilities: () => [
    {
      id: 'blocks.gantt',
      capabilityVersion: '1.0.0',
      kind: 'block',
      publicType: 'gantt',
      acceptedAliases: ['pluginGantt.gantt', 'ganttBlock', '@nocobase/plugin-gantt:gantt'],
      label: 'Gantt',
      semantic: {
        title: 'Gantt',
        description: 'Visualizes collection records on a time scale.',
        aliases: ['gantt', 'timeline'],
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
          supported: true,
          acceptsInitParams: true,
          acceptsSettings: false,
        },
        configure: {
          supported: false,
          reasonCode: 'unsupported',
          reasonSource: 'provider',
        },
      },
      supportLevel: 'create-only',
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
        properties: {},
      },
    },
  ],
  resolveCreate: (_capability, input) => ({
    use: 'GanttBlockModel',
    props: {
      enableDragToReschedule: true,
      scrollToTodayOnFirstRender: false,
      showTable: true,
    },
    stepParams: {
      resourceSettings: {
        init: {
          dataSourceKey: input.initParams?.dataSourceKey || 'main',
          collectionName: input.initParams?.collectionName,
        },
      },
    },
    subModels: {
      actions: [],
      columns: [
        {
          use: 'TableActionsColumnModel',
          props: {
            title: '{{t("Actions")}}',
            width: 150,
          },
        },
      ],
    },
  }),
};
