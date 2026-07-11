/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
  type FlowSurfaceAutoCapabilityCandidate,
  type FlowSurfaceAutoInferredAuthoring,
  type FlowSurfaceAutoInferredAuthoringCapability,
  type FlowSurfaceAutoMenuItem,
  type FlowSurfaceAutoSnapshot,
} from './types';

const GANTT_OWNER_PLUGIN = '@nocobase/plugin-gantt';
const GANTT_BLOCK_MODEL_USE = 'GanttBlockModel';
const GANTT_ACTION_GROUP_MODEL_USE = 'GanttCollectionActionGroupModel';
const GANTT_EVENT_VIEW_ACTION_MODEL_USE = 'GanttEventViewActionModel';
const GANTT_ACTION_COLUMN_MODEL_USE = 'TableActionsColumnModel';
const GANTT_RECORD_ACTION_MODEL_USES = ['ViewActionModel', 'EditActionModel', 'DeleteActionModel'];
const GANTT_TIME_SCALE_VALUES = ['hour', 'quarterDay', 'halfDay', 'day', 'week', 'month', 'year', 'quarterYear'];
const GANTT_MIN_TABLE_WIDTH = 120;
const GANTT_AUTHORING_TABLE_WIDTH = 680;
const GANTT_REQUIRED_ACTION_MODEL_USES = [
  'GanttExpandCollapseActionModel',
  'GanttTodayActionModel',
  'FilterActionModel',
  'RefreshActionModel',
  'BulkDeleteActionModel',
  'AddNewActionModel',
  'PopupCollectionActionModel',
];
const GANTT_ACTION_PUBLIC_TYPES_BY_MODEL_USE = new Map([
  ['FilterActionModel', 'filter'],
  ['AddNewActionModel', 'addNew'],
  ['PopupCollectionActionModel', 'popup'],
  ['ViewActionModel', 'view'],
  ['EditActionModel', 'edit'],
  ['DeleteActionModel', 'delete'],
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
const BUTTON_GENERAL_PROP_KEYS = ['title', 'tooltip', 'icon', 'type', 'danger', 'color'];

export function inferFlowSurfaceAutoSnapshotAuthoring(
  snapshot: FlowSurfaceAutoSnapshot,
  candidates: FlowSurfaceAutoCapabilityCandidate[],
): FlowSurfaceAutoInferredAuthoring | undefined {
  const genericCapabilities = candidates
    .filter((candidate) => candidate.kind === 'block')
    .map((candidate) => inferGenericBlockAuthoringCapability(snapshot, candidate));
  const ganttCapability = inferGanttAuthoringCapability(snapshot);
  const capabilities = ganttCapability
    ? genericCapabilities.map((capability) =>
        capability.modelUse === ganttCapability.modelUse ? ganttCapability : capability,
      )
    : genericCapabilities;
  return capabilities.length
    ? {
        contractVersion: FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
        capabilities,
      }
    : undefined;
}

function inferGenericBlockAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  candidate: FlowSurfaceAutoCapabilityCandidate,
): FlowSurfaceAutoInferredAuthoringCapability {
  const collectionRequired = isCollectionBackedBlock(snapshot, candidate.modelUse);
  const staticNodeTemplate = snapshot.menuItems.find(
    (item) => item.modelUse === candidate.modelUse && item.createModelOptions?.use === candidate.modelUse,
  )?.createModelOptions;
  const acceptedAliases = Array.from(
    new Set(
      snapshot.menuItems
        .filter((item) => item.modelUse === candidate.modelUse)
        .map((item) => item.menuKey)
        .filter((value): value is string => !!value && value !== candidate.publicType),
    ),
  );
  const initParams = [
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
      required: collectionRequired,
      schema: {
        type: 'string',
      },
      internalLens: {
        domain: 'stepParams' as const,
        path: 'resourceSettings.init.collectionName',
      },
    },
  ];

  return {
    kind: 'block',
    publicType: candidate.publicType,
    ...(acceptedAliases.length ? { acceptedAliases } : {}),
    ownerPlugin: snapshot.plugin,
    modelUse: candidate.modelUse,
    label: candidate.label,
    placement: {
      scenes: ['page', 'tab', 'popup'],
      slots: ['blocks'],
      ...(collectionRequired ? { collectionRequired: true } : {}),
    },
    confidence: {
      discovery: 'high',
      placement: 'high',
      tree: 'high',
      settings: 'high',
      write: 'high',
    },
    initParamsSchema: {
      type: 'object',
      additionalProperties: false,
      ...(collectionRequired ? { required: ['collectionName'] } : {}),
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
    createRecipe: {
      nodeTemplate: staticNodeTemplate || { use: candidate.modelUse },
      initParams,
    },
    evidence: candidate.evidence,
  };
}

function isCollectionBackedBlock(snapshot: FlowSurfaceAutoSnapshot, modelUse: string) {
  const baseClass = snapshot.models.find((model) => model.modelUse === modelUse)?.modelBaseClass;
  return (
    baseClass === 'CollectionBlockModel' ||
    baseClass === 'DataBlockModel' ||
    snapshot.flows.some(
      (flow) => flow.modelUse === modelUse && String(flow.flowKey || '').startsWith('resourceSettings'),
    )
  );
}

function inferGanttAuthoringCapability(
  snapshot: FlowSurfaceAutoSnapshot,
): FlowSurfaceAutoInferredAuthoringCapability | undefined {
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
  const hasEventViewActionEvidence = hasGanttEventViewActionEvidence(snapshot);
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
        example: GANTT_AUTHORING_TABLE_WIDTH,
      },
      enableDragToReschedule: {
        type: 'boolean' as const,
        example: true,
      },
    },
    createRecipe: {
      nodeTemplate: buildGanttCreateNodeTemplate({ hasEventViewActionEvidence }),
      initParams: [
        {
          name: 'dataSourceKey',
          required: false,
          schema: {
            type: 'string',
          },
          internalLens: [
            {
              domain: 'stepParams' as const,
              path: 'resourceSettings.init.dataSourceKey',
            },
            ...buildGanttColumnInitParamLenses('dataSourceKey'),
          ],
        },
        {
          name: 'collectionName',
          required: true,
          schema: {
            type: 'string',
          },
          internalLens: [
            {
              domain: 'stepParams' as const,
              path: 'resourceSettings.init.collectionName',
            },
            ...buildGanttColumnInitParamLenses('collectionName'),
          ],
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
            minimum: GANTT_MIN_TABLE_WIDTH,
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
        emptyWhenMissing: true,
        allowedChildren: allowedActionModelUses,
      },
      {
        key: 'gantt.columns',
        parentModelUse: GANTT_BLOCK_MODEL_USE,
        subModelKey: 'columns',
        kind: 'fieldComponent' as const,
        allowedChildren: ['TableColumnModel'],
      },
      {
        key: 'gantt.recordActions',
        parentModelUse: GANTT_ACTION_COLUMN_MODEL_USE,
        subModelKey: 'actions',
        kind: 'action' as const,
        allowedChildren: GANTT_RECORD_ACTION_MODEL_USES,
      },
      ...(hasEventViewActionEvidence
        ? [
            {
              key: 'gantt.eventViewAction',
              parentModelUse: GANTT_BLOCK_MODEL_USE,
              subModelKey: 'eventViewAction',
              kind: 'action' as const,
              allowedChildren: [GANTT_EVENT_VIEW_ACTION_MODEL_USE],
            },
          ]
        : []),
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
      ...GANTT_RECORD_ACTION_MODEL_USES.map((modelUse) => ({
        kind: 'action' as const,
        modelUse,
        publicType: toGanttActionPublicType(modelUse),
        label: toGanttActionLabel(modelUse),
        builderContainerUse: GANTT_ACTION_COLUMN_MODEL_USE,
      })),
      ...(hasEventViewActionEvidence
        ? [
            {
              kind: 'action' as const,
              modelUse: GANTT_EVENT_VIEW_ACTION_MODEL_USE,
              publicType: 'view',
              label: 'View',
              conditions: ['recordPopup'],
            },
          ]
        : []),
    ],
    popupHosts: [
      {
        key: 'gantt.addNewPopup',
        modelUse: 'AddNewActionModel',
        parentModelUse: GANTT_BLOCK_MODEL_USE,
        subModelKey: 'actions',
        defaultType: 'addNew' as const,
        hasCurrentRecord: false,
        templateStrategy: 'preferTemplateThenFallback' as const,
        confidence: 'high' as const,
        evidence: [
          {
            type: 'coreTemplate' as const,
            ref: 'core-template:gantt.actions.addNew.popup',
          },
        ],
      },
      {
        key: 'gantt.recordViewPopup',
        modelUse: 'ViewActionModel',
        parentModelUse: GANTT_ACTION_COLUMN_MODEL_USE,
        subModelKey: 'actions',
        defaultType: 'view' as const,
        hasCurrentRecord: true,
        templateStrategy: 'preferTemplateThenFallback' as const,
        confidence: 'high' as const,
        evidence: [
          {
            type: 'coreTemplate' as const,
            ref: 'core-template:gantt.recordActions.view.popup',
          },
        ],
      },
      {
        key: 'gantt.recordEditPopup',
        modelUse: 'EditActionModel',
        parentModelUse: GANTT_ACTION_COLUMN_MODEL_USE,
        subModelKey: 'actions',
        defaultType: 'edit' as const,
        hasCurrentRecord: true,
        templateStrategy: 'preferTemplateThenFallback' as const,
        confidence: 'high' as const,
        evidence: [
          {
            type: 'coreTemplate' as const,
            ref: 'core-template:gantt.recordActions.edit.popup',
          },
        ],
      },
      ...(hasEventViewActionEvidence
        ? [
            {
              key: 'gantt.eventViewPopup',
              modelUse: GANTT_EVENT_VIEW_ACTION_MODEL_USE,
              parentModelUse: GANTT_BLOCK_MODEL_USE,
              subModelKey: 'eventViewAction',
              parentOpenViewMirrorPaths: ['props.eventPopupSettings'],
              defaultType: 'view' as const,
              hasCurrentRecord: true,
              templateStrategy: 'preferTemplateThenFallback' as const,
              confidence: 'high' as const,
              evidence: [
                {
                  type: 'coreTemplate' as const,
                  ref: 'core-template:gantt.eventViewAction.popup',
                },
              ],
            },
          ]
        : []),
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

function hasGanttEventViewActionEvidence(snapshot: FlowSurfaceAutoSnapshot) {
  return snapshot.models.some((model) => model.modelUse === GANTT_EVENT_VIEW_ACTION_MODEL_USE);
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

function buildGanttCreateNodeTemplate(input: { hasEventViewActionEvidence: boolean }) {
  return {
    use: GANTT_BLOCK_MODEL_USE,
    props: {
      fieldNames: {
        range: 'day',
      },
      showTable: true,
      enableDragToReschedule: true,
      tableWidth: GANTT_AUTHORING_TABLE_WIDTH,
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
        tableWidth: {
          tableWidth: GANTT_AUTHORING_TABLE_WIDTH,
        },
      },
    },
    subModels: {
      actions: [
        buildGanttActionNode('FilterActionModel', {
          title: '{{t("Filter")}}',
          icon: 'FilterOutlined',
        }),
        buildGanttActionNode('GanttTodayActionModel', {
          type: 'default',
          title: '{{t("Today")}}',
          icon: 'AimOutlined',
        }),
        buildGanttActionNode('RefreshActionModel', {
          title: '{{t("Refresh")}}',
          icon: 'ReloadOutlined',
        }),
        buildGanttActionNode(
          'BulkDeleteActionModel',
          {
            title: '',
            tooltip: '{{t("Delete")}}',
            icon: 'DeleteOutlined',
            position: 'right',
          },
          {
            deleteSettings: {
              confirm: {
                enable: true,
                title: '{{t("Delete record")}}',
                content: '{{t("Are you sure you want to delete it?")}}',
              },
            },
          },
        ),
        buildGanttActionNode(
          'AddNewActionModel',
          {
            type: 'primary',
            title: '{{t("Add new")}}',
            icon: 'PlusOutlined',
          },
          {
            popupSettings: {
              openView: {},
            },
          },
        ),
      ],
      columns: [
        buildGanttFieldColumnNode(),
        buildGanttFieldColumnNode(),
        buildGanttFieldColumnNode(),
        buildGanttActionsColumnNode(),
      ],
      ...(input.hasEventViewActionEvidence
        ? {
            eventViewAction: {
              use: GANTT_EVENT_VIEW_ACTION_MODEL_USE,
              stepParams: {
                popupSettings: {
                  openView: {},
                },
              },
            },
          }
        : {}),
    },
  };
}

function buildGanttActionNode(use: string, props: Record<string, unknown>, stepParams?: Record<string, unknown>) {
  return {
    use,
    props,
    stepParams: {
      buttonSettings: {
        general: pickButtonGeneralProps(props),
      },
      ...(stepParams || {}),
    },
  };
}

function pickButtonGeneralProps(props: Record<string, unknown>) {
  return Object.fromEntries(BUTTON_GENERAL_PROP_KEYS.filter((key) => key in props).map((key) => [key, props[key]]));
}

function buildGanttFieldColumnNode() {
  return {
    use: 'TableColumnModel',
    props: {},
    stepParams: {
      fieldSettings: {
        init: {
          dataSourceKey: 'main',
        },
      },
      tableColumnSettings: {
        title: {},
        model: {
          use: 'DisplayTextFieldModel',
        },
      },
    },
    subModels: {
      field: {
        use: 'DisplayTextFieldModel',
        stepParams: {
          fieldSettings: {
            init: {
              dataSourceKey: 'main',
            },
          },
        },
      },
    },
  };
}

function buildGanttActionsColumnNode() {
  return {
    use: GANTT_ACTION_COLUMN_MODEL_USE,
    props: {
      title: '{{t("Actions")}}',
      width: 150,
    },
    subModels: {
      actions: [
        buildGanttActionNode(
          'ViewActionModel',
          {
            type: 'link',
            title: '{{t("View")}}',
            icon: null,
          },
          {
            popupSettings: {
              openView: {},
            },
          },
        ),
        buildGanttActionNode(
          'EditActionModel',
          {
            type: 'link',
            title: '{{t("Edit")}}',
            icon: null,
          },
          {
            popupSettings: {
              openView: {},
            },
          },
        ),
        buildGanttActionNode(
          'DeleteActionModel',
          {
            type: 'link',
            title: '{{t("Delete")}}',
            icon: null,
          },
          {
            deleteSettings: {
              confirm: {
                enable: true,
                title: '{{t("Delete record")}}',
                content: '{{t("Are you sure you want to delete it?")}}',
              },
            },
          },
        ),
      ],
    },
  };
}

function buildGanttColumnInitParamLenses(key: 'dataSourceKey' | 'collectionName') {
  return [0, 1, 2].flatMap((index) => [
    {
      domain: 'node' as const,
      path: `subModels.columns.${index}.stepParams.fieldSettings.init.${key}`,
    },
    {
      domain: 'node' as const,
      path: `subModels.columns.${index}.subModels.field.stepParams.fieldSettings.init.${key}`,
    },
  ]);
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
        minimum: GANTT_MIN_TABLE_WIDTH,
      },
      enableDragToReschedule: {
        type: 'boolean',
      },
    },
  };
}

function buildGanttFieldSettingLenses() {
  return [
    buildGanttFieldSettingLens('titleField', 'title', 0),
    buildGanttFieldSettingLens('startField', 'start', 1),
    buildGanttFieldSettingLens('endField', 'end', 2),
    buildGanttFieldSettingLens('progressField', 'progress'),
    buildGanttFieldSettingLens('colorField', 'color'),
  ];
}

function buildGanttFieldSettingLens(key: string, internalKey: string, columnIndex?: number) {
  const lenses: Array<{ domain: 'props' | 'stepParams' | 'node'; path: string }> = [
    {
      domain: 'props' as const,
      path: `fieldNames.${internalKey}`,
    },
    {
      domain: 'stepParams' as const,
      path: `ganttSettings.fields.${internalKey}`,
    },
  ];
  if (typeof columnIndex === 'number') {
    lenses.push(
      {
        domain: 'node' as const,
        path: `subModels.columns.${columnIndex}.props.title`,
      },
      {
        domain: 'node' as const,
        path: `subModels.columns.${columnIndex}.props.dataIndex`,
      },
      {
        domain: 'node' as const,
        path: `subModels.columns.${columnIndex}.stepParams.fieldSettings.init.fieldPath`,
      },
      {
        domain: 'node' as const,
        path: `subModels.columns.${columnIndex}.stepParams.tableColumnSettings.title.title`,
      },
      {
        domain: 'node' as const,
        path: `subModels.columns.${columnIndex}.subModels.field.stepParams.fieldSettings.init.fieldPath`,
      },
    );
  }
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
