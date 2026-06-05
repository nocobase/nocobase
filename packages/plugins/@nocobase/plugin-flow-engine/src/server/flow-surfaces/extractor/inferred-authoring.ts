/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceAutoInferredAuthoring, FlowSurfaceAutoMenuItem, FlowSurfaceAutoSnapshot } from './types';

const GANTT_OWNER_PLUGIN = '@nocobase/plugin-gantt';
const GANTT_BLOCK_MODEL_USE = 'GanttBlockModel';
const GANTT_ACTION_GROUP_MODEL_USE = 'GanttCollectionActionGroupModel';
const GANTT_TIME_SCALE_VALUES = ['hour', 'quarterDay', 'halfDay', 'day', 'week', 'month', 'year', 'quarterYear'];
const GANTT_REQUIRED_ACTION_MODEL_USES = [
  'GanttExpandCollapseActionModel',
  'GanttTodayActionModel',
  'FilterActionModel',
  'AddNewActionModel',
  'PopupCollectionActionModel',
  'RefreshActionModel',
];
const GANTT_ACTION_PUBLIC_TYPES_BY_MODEL_USE = new Map([
  ['FilterActionModel', 'filter'],
  ['AddNewActionModel', 'addNew'],
  ['PopupCollectionActionModel', 'popup'],
  ['BulkDeleteActionModel', 'bulkDelete'],
  ['LinkActionModel', 'link'],
  ['RefreshActionModel', 'refresh'],
  ['BulkEditActionModel', 'bulkEdit'],
  ['BulkUpdateActionModel', 'bulkUpdate'],
  ['ExportActionModel', 'export'],
  ['ImportActionModel', 'import'],
  ['CollectionTriggerWorkflowActionModel', 'triggerWorkflow'],
  ['AIEmployeeActionModel', 'aiEmployee'],
  ['JSItemActionModel', 'jsItem'],
  ['JSCollectionActionModel', 'js'],
]);

export function inferFlowSurfaceAutoSnapshotAuthoring(
  snapshot: FlowSurfaceAutoSnapshot,
): FlowSurfaceAutoInferredAuthoring | undefined {
  const capabilities = [inferGanttAuthoringCapability(snapshot)].filter(
    (item): item is NonNullable<ReturnType<typeof inferGanttAuthoringCapability>> => !!item,
  );
  return capabilities.length ? { capabilities } : undefined;
}

function inferGanttAuthoringCapability(snapshot: FlowSurfaceAutoSnapshot) {
  if (snapshot.plugin !== GANTT_OWNER_PLUGIN) {
    return undefined;
  }
  if (!snapshot.models.some((model) => model.modelUse === GANTT_BLOCK_MODEL_USE)) {
    return undefined;
  }
  if (!hasStaticGanttCreateModelOptions(snapshot)) {
    return undefined;
  }
  const createModelOptions = getStaticGanttCreateModelOptions(snapshot);
  const allowedActionModelUses = getGanttAllowedActionModelUses(snapshot);
  const hasActionSurfaceEvidence = hasGanttActionSurfaceEvidence(snapshot, allowedActionModelUses);
  const hasDefaultTreeEvidence = hasStaticGanttDefaultTreeEvidence(createModelOptions);
  const confidence = hasActionSurfaceEvidence && hasDefaultTreeEvidence ? 'high' : 'medium';
  const warnings =
    confidence === 'high'
      ? []
      : [
          {
            code: 'contract-not-verified' as const,
            message: 'Gantt inferred authoring is missing static action or default subtree evidence.',
          },
        ];

  return {
    kind: 'block' as const,
    publicType: 'gantt',
    acceptedAliases: ['pluginGantt.gantt', 'ganttBlock', '@nocobase/plugin-gantt:gantt'],
    ownerPlugin: GANTT_OWNER_PLUGIN,
    modelUse: GANTT_BLOCK_MODEL_USE,
    label: 'Gantt',
    placement: {
      scenes: ['page', 'tab', 'popup'],
      slots: ['blocks'],
      collectionRequired: true,
    },
    confidence: {
      discovery: 'high' as const,
      placement: 'high' as const,
      tree: confidence,
      settings: 'high' as const,
      write: confidence,
    },
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
    settingsSchema: buildGanttSettingsSchema(),
    configureOptions: {
      titleField: {
        type: 'string' as const,
        description: 'Collection field used as the task title.',
      },
      startField: {
        type: 'string' as const,
        description: 'Date-like collection field used as the task start date.',
      },
      endField: {
        type: 'string' as const,
        description: 'Date-like collection field used as the task end date.',
      },
      progressField: {
        type: 'string' as const,
        description: 'Optional numeric collection field used as task progress.',
      },
      colorField: {
        type: 'string' as const,
        description: 'Optional select or color field used as the task color.',
      },
      timeScale: {
        type: 'string' as const,
        enum: GANTT_TIME_SCALE_VALUES,
        example: 'day',
      },
      pageSize: {
        type: 'number' as const,
        example: 20,
      },
      showRowNumbers: {
        type: 'boolean' as const,
        example: true,
      },
      treeTable: {
        type: 'boolean' as const,
        example: false,
      },
      showTable: {
        type: 'boolean' as const,
        example: true,
      },
      tableWidth: {
        type: 'number' as const,
        example: 320,
      },
      enableDragToReschedule: {
        type: 'boolean' as const,
        example: true,
      },
    },
    createRecipe: {
      nodeTemplate: {
        use: GANTT_BLOCK_MODEL_USE,
        props: {
          fieldNames: {
            range: 'day',
          },
          showTable: true,
          enableDragToReschedule: true,
        },
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: 'main',
            },
          },
          ganttSettings: {
            fields: {
              range: 'day',
            },
            showTable: {
              showTable: true,
            },
            enableDragToReschedule: {
              enableDragToReschedule: true,
            },
          },
        },
        subModels: {
          actions: [],
          columns: [
            {
              use: 'TableActionsColumnModel',
              props: {
                title: 'Actions',
                width: 150,
              },
            },
          ],
        },
      },
      initParams: [
        {
          name: 'dataSourceKey',
          required: false,
          schema: {
            type: 'string',
          },
          internalLens: {
            domain: 'stepParams' as const,
            path: 'resourceSettings.init.dataSourceKey',
          },
        },
        {
          name: 'collectionName',
          required: true,
          schema: {
            type: 'string',
          },
          internalLens: {
            domain: 'stepParams' as const,
            path: 'resourceSettings.init.collectionName',
          },
        },
      ],
      settings: [
        ...buildGanttFieldSettingLenses(),
        {
          key: 'timeScale',
          schema: {
            type: 'string',
            enum: GANTT_TIME_SCALE_VALUES,
          },
          default: 'day',
          internalLens: [
            {
              domain: 'props' as const,
              path: 'fieldNames.range',
            },
            {
              domain: 'stepParams' as const,
              path: 'ganttSettings.fields.range',
            },
          ],
        },
        {
          key: 'pageSize',
          schema: {
            type: 'number',
            minimum: 1,
            maximum: 200,
          },
          internalLens: {
            domain: 'stepParams' as const,
            path: 'tableSettings.pageSize.pageSize',
          },
        },
        {
          key: 'showRowNumbers',
          schema: {
            type: 'boolean',
          },
          internalLens: {
            domain: 'stepParams' as const,
            path: 'tableSettings.showRowNumbers.showIndex',
          },
        },
        {
          key: 'treeTable',
          schema: {
            type: 'boolean',
          },
          internalLens: [
            {
              domain: 'props' as const,
              path: 'treeTable',
            },
            {
              domain: 'stepParams' as const,
              path: 'tableSettings.treeTable.treeTable',
            },
          ],
        },
        {
          key: 'showTable',
          schema: {
            type: 'boolean',
          },
          internalLens: [
            {
              domain: 'props' as const,
              path: 'showTable',
            },
            {
              domain: 'stepParams' as const,
              path: 'ganttSettings.showTable.showTable',
            },
          ],
        },
        {
          key: 'tableWidth',
          schema: {
            type: 'number',
            minimum: 120,
          },
          internalLens: [
            {
              domain: 'props' as const,
              path: 'tableWidth',
            },
            {
              domain: 'stepParams' as const,
              path: 'ganttSettings.tableWidth.tableWidth',
            },
          ],
        },
        {
          key: 'enableDragToReschedule',
          schema: {
            type: 'boolean',
          },
          internalLens: [
            {
              domain: 'props' as const,
              path: 'enableDragToReschedule',
            },
            {
              domain: 'stepParams' as const,
              path: 'ganttSettings.enableDragToReschedule.enableDragToReschedule',
            },
          ],
        },
      ],
    },
    childSurfaces: [
      {
        key: 'gantt.actions',
        parentModelUse: GANTT_BLOCK_MODEL_USE,
        subModelKey: 'actions',
        kind: 'action' as const,
        allowedChildren: allowedActionModelUses,
      },
      {
        key: 'gantt.columns',
        parentModelUse: GANTT_BLOCK_MODEL_USE,
        subModelKey: 'columns',
        kind: 'fieldComponent' as const,
        allowedChildren: ['TableColumnModel'],
      },
    ],
    allowedChildren: [
      ...allowedActionModelUses.map((modelUse) => ({
        kind: 'action' as const,
        modelUse,
        publicType: toGanttActionPublicType(modelUse),
        label: toGanttActionLabel(modelUse),
        ...(modelUse === 'GanttExpandCollapseActionModel'
          ? { conditions: ['treeCollection', 'treeTableEnabled'] }
          : {}),
        ...(!modelUse.startsWith('Gantt') ? { builderContainerUse: 'TableBlockModel' } : {}),
      })),
      {
        kind: 'fieldComponent' as const,
        modelUse: 'TableColumnModel',
        publicType: 'collectionField',
        label: 'Collection field',
        builderContainerUse: 'TableBlockModel',
      },
    ],
    evidence: [
      {
        type: 'model' as const,
        ref: GANTT_BLOCK_MODEL_USE,
      },
      {
        type: 'model' as const,
        ref: GANTT_ACTION_GROUP_MODEL_USE,
      },
      {
        type: 'menuItem' as const,
        ref: 'gantt',
      },
      {
        type: 'coreTemplate' as const,
        ref: 'core-template:gantt',
      },
    ],
    ...(warnings.length ? { warnings } : {}),
  };
}

function hasStaticGanttCreateModelOptions(snapshot: FlowSurfaceAutoSnapshot) {
  return !!getStaticGanttCreateModelOptions(snapshot);
}

function getStaticGanttCreateModelOptions(snapshot: FlowSurfaceAutoSnapshot) {
  return snapshot.menuItems.find(
    (item) =>
      item.modelUse === GANTT_BLOCK_MODEL_USE &&
      item.createModelOptionsStatus === 'static' &&
      item.createModelOptionsUse === GANTT_BLOCK_MODEL_USE,
  );
}

function hasGanttActionSurfaceEvidence(snapshot: FlowSurfaceAutoSnapshot, allowedActionModelUses: string[]) {
  const modelUses = new Set(snapshot.models.map((model) => model.modelUse));
  return (
    modelUses.has(GANTT_ACTION_GROUP_MODEL_USE) &&
    GANTT_REQUIRED_ACTION_MODEL_USES.every((modelUse) => allowedActionModelUses.includes(modelUse))
  );
}

function hasStaticGanttDefaultTreeEvidence(createModelOptions: FlowSurfaceAutoMenuItem | undefined) {
  const subModels = createModelOptions?.createModelOptionsSubModels || {};
  return Array.isArray(subModels.actions) && (subModels.columns || []).includes('TableActionsColumnModel');
}

function getGanttAllowedActionModelUses(snapshot: FlowSurfaceAutoSnapshot) {
  const seen = new Set<string>();
  return snapshot.menuItems.flatMap((item) => {
    const modelUse = String(item.modelUse || '').trim();
    if (
      item.slot !== 'actions' ||
      item.createModelOptionsStatus !== 'static' ||
      !/ActionModel$/.test(modelUse) ||
      seen.has(modelUse)
    ) {
      return [];
    }
    seen.add(modelUse);
    return [modelUse];
  });
}

function buildGanttSettingsSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['titleField', 'startField', 'endField'],
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
  };
}

function buildGanttFieldSettingLenses() {
  return [
    buildGanttFieldSettingLens('titleField', 'title'),
    buildGanttFieldSettingLens('startField', 'start'),
    buildGanttFieldSettingLens('endField', 'end'),
    buildGanttFieldSettingLens('progressField', 'progress'),
    buildGanttFieldSettingLens('colorField', 'color'),
  ];
}

function buildGanttFieldSettingLens(key: string, internalKey: string) {
  const lenses = [
    {
      domain: 'props' as const,
      path: `fieldNames.${internalKey}`,
    },
    {
      domain: 'stepParams' as const,
      path: `ganttSettings.fields.${internalKey}`,
    },
  ];
  if (internalKey === 'progress') {
    lenses.push({
      domain: 'stepParams' as const,
      path: 'ganttSettings.processField.progress',
    });
  }
  if (internalKey === 'color') {
    lenses.push({
      domain: 'stepParams' as const,
      path: 'ganttSettings.colorField.color',
    });
  }
  return {
    key,
    schema: {
      type: 'string',
    },
    internalLens: lenses,
  };
}

function toGanttActionPublicType(modelUse: string) {
  const mapped = GANTT_ACTION_PUBLIC_TYPES_BY_MODEL_USE.get(modelUse);
  if (mapped) {
    return mapped;
  }
  return modelUse
    .replace(/Model$/, '')
    .replace(/^Gantt/, 'gantt')
    .replace(/^FilterAction$/, 'filter')
    .replace(/^AddNewAction$/, 'addNew')
    .replace(/^PopupCollectionAction$/, 'popup')
    .replace(/^RefreshAction$/, 'refresh');
}

function toGanttActionLabel(modelUse: string) {
  return modelUse
    .replace(/Model$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^Gantt /, '');
}
