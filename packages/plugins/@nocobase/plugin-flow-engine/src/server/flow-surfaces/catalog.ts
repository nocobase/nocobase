/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceCatalogItem,
  FlowSurfaceDomainContract,
  FlowSurfaceDomainGroupContract,
  FlowSurfaceLayoutCapabilities,
  FlowSurfaceNodeContract,
  FlowSurfaceNodeDomain,
} from './types';
import { FLOW_SURFACE_BLOCK_SUPPORT_MATRIX } from './support-matrix';

const ANY_VALUE_SCHEMA = {};
const STRING_SCHEMA = { type: 'string' };
const NULLABLE_STRING_SCHEMA = { type: 'string', nullable: true };
const BOOLEAN_SCHEMA = { type: 'boolean' };
const OBJECT_SCHEMA = { type: 'object' };
const NUMBER_SCHEMA = { type: 'number' };
const ARRAY_SCHEMA = { type: 'array' };
const FILTER_CONDITION_SCHEMA = {
  type: 'object',
  properties: {
    path: STRING_SCHEMA,
    operator: STRING_SCHEMA,
    value: ANY_VALUE_SCHEMA,
  },
  required: ['path', 'operator'],
  additionalProperties: true,
};
const FILTER_GROUP_SCHEMA = {
  type: 'object',
  properties: {
    logic: {
      type: 'string',
      enum: ['$and', '$or'],
    },
    items: {
      type: 'array',
      items: {
        oneOf: [FILTER_CONDITION_SCHEMA, ANY_VALUE_SCHEMA],
      },
    },
  },
  required: ['logic', 'items'],
  additionalProperties: false,
  'x-flowSurfaceFormat': 'filter-group',
};
const DEFAULT_DIRECT_EVENTS = ['beforeRender'];
const ACTION_DIRECT_EVENTS = ['click', 'beforeRender'];
const ACTION_OBJECT_EVENTS = ['click'];
const GRID_LAYOUT_CAPABILITIES: FlowSurfaceLayoutCapabilities = { supported: true };
const RUN_JS_ALLOWED_PATHS = ['runJs.code', 'runJs.version'];
const OPEN_VIEW_ALLOWED_PATHS = [
  'openView.mode',
  'openView.size',
  'openView.pageModelClass',
  'openView.dataSourceKey',
  'openView.collectionName',
  'openView.associationName',
  'openView.title',
  'openView.uid',
  'openView.subModelKey',
  'openView.navigation',
];
const CONFIRM_ALLOWED_PATHS = ['confirm.enable', 'confirm.title', 'confirm.content'];
const TABLE_COLUMN_ALLOWED_PATHS = ['title.title'];
const FILTER_FORM_ITEM_ALLOWED_PATHS = [
  'init.defaultTargetUid',
  'init.filterField.name',
  'init.filterField.title',
  'init.filterField.interface',
  'init.filterField.type',
  'initialValue.defaultValue',
];
const ACTION_PROP_KEYS = ['title', 'tooltip', 'icon', 'type', 'htmlType', 'position', 'danger', 'color'];
const ACTION_BUTTON_SETTINGS_GROUP = {
  allowedPaths: [
    'general.title',
    'general.tooltip',
    'general.icon',
    'general.type',
    'general.danger',
    'general.color',
    'linkageRules',
  ],
  mergeStrategy: 'deep' as const,
  eventBindingSteps: ['general', 'linkageRules'],
  pathSchemas: {
    'general.title': STRING_SCHEMA,
    'general.tooltip': STRING_SCHEMA,
    'general.icon': NULLABLE_STRING_SCHEMA,
    'general.type': STRING_SCHEMA,
    'general.danger': BOOLEAN_SCHEMA,
    'general.color': STRING_SCHEMA,
    linkageRules: ARRAY_SCHEMA,
  },
};
const RUN_JS_SETTINGS_GROUP = {
  allowedPaths: RUN_JS_ALLOWED_PATHS,
  mergeStrategy: 'deep' as const,
  eventBindingSteps: ['runJs'],
  pathSchemas: {
    'runJs.code': STRING_SCHEMA,
    'runJs.version': STRING_SCHEMA,
  },
};
const FIELD_SETTINGS_INIT_GROUP = {
  allowedPaths: [
    'init.dataSourceKey',
    'init.collectionName',
    'init.associationName',
    'init.associationPathName',
    'init.sourceId',
    'init.filterByTk',
    'init.fieldPath',
  ],
  mergeStrategy: 'deep' as const,
  pathSchemas: {
    'init.dataSourceKey': STRING_SCHEMA,
    'init.collectionName': STRING_SCHEMA,
    'init.associationName': STRING_SCHEMA,
    'init.associationPathName': STRING_SCHEMA,
    'init.fieldPath': STRING_SCHEMA,
  },
};
const RESOURCE_SETTINGS_GROUP = {
  allowedPaths: [
    'init.dataSourceKey',
    'init.collectionName',
    'init.associationName',
    'init.associationPathName',
    'init.sourceId',
    'init.filterByTk',
  ],
  eventBindingSteps: [],
  pathSchemas: {
    'init.dataSourceKey': STRING_SCHEMA,
    'init.collectionName': STRING_SCHEMA,
    'init.associationName': STRING_SCHEMA,
    'init.associationPathName': STRING_SCHEMA,
  },
};
const FORM_LAYOUT_ALLOWED_PATHS = [
  'layout.layout',
  'layout.labelAlign',
  'layout.labelWidth',
  'layout.labelWrap',
  'layout.colon',
];
const FORM_LAYOUT_PATH_SCHEMAS = {
  'layout.layout': STRING_SCHEMA,
  'layout.labelAlign': STRING_SCHEMA,
  'layout.labelWidth': NUMBER_SCHEMA,
  'layout.labelWrap': BOOLEAN_SCHEMA,
  'layout.colon': BOOLEAN_SCHEMA,
};
const FORM_MODEL_SETTINGS_GROUP = {
  allowedPaths: [...FORM_LAYOUT_ALLOWED_PATHS, 'assignRules.value'],
  eventBindingSteps: ['layout', 'assignRules'],
  pathSchemas: {
    ...FORM_LAYOUT_PATH_SCHEMAS,
    'assignRules.value': ARRAY_SCHEMA,
  },
};
const EVENT_SETTINGS_GROUP = {
  allowedPaths: ['linkageRules.value'],
  eventBindingSteps: ['linkageRules'],
  pathSchemas: {
    'linkageRules.value': ARRAY_SCHEMA,
  },
};
const CREATE_FORM_SETTINGS_EVENT_ONLY_GROUP = {
  allowedPaths: [],
  eventBindingSteps: ['init', 'refresh'],
};
const EDIT_FORM_SETTINGS_GROUP = {
  allowedPaths: ['dataScope.filter'],
  eventBindingSteps: ['init', 'dataScope', 'refresh'],
  pathSchemas: {
    'dataScope.filter': FILTER_GROUP_SCHEMA,
  },
};
const DETAILS_SETTINGS_GROUP = {
  allowedPaths: [...FORM_LAYOUT_ALLOWED_PATHS, 'dataScope.filter', 'defaultSorting.sort', 'linkageRules.value'],
  eventBindingSteps: ['layout', 'dataScope', 'defaultSorting', 'linkageRules'],
  pathSchemas: {
    ...FORM_LAYOUT_PATH_SCHEMAS,
    'dataScope.filter': FILTER_GROUP_SCHEMA,
    'defaultSorting.sort': ARRAY_SCHEMA,
    'linkageRules.value': ARRAY_SCHEMA,
  },
};
const FILTER_FORM_BLOCK_SETTINGS_GROUP = {
  allowedPaths: [...FORM_LAYOUT_ALLOWED_PATHS, 'defaultValues.value'],
  eventBindingSteps: ['layout', 'defaultValues'],
  pathSchemas: {
    ...FORM_LAYOUT_PATH_SCHEMAS,
    'defaultValues.value': ARRAY_SCHEMA,
  },
};
const TABLE_SETTINGS_GROUP = {
  allowedPaths: [
    'quickEdit.editable',
    'showRowNumbers.showIndex',
    'pageSize.pageSize',
    'dataScope.filter',
    'defaultSorting.sort',
    'treeTable.treeTable',
    'defaultExpandAllRows.defaultExpandAllRows',
    'tableDensity.size',
    'dragSort.dragSort',
    'dragSortBy.dragSortBy',
  ],
  eventBindingSteps: [
    'quickEdit',
    'showRowNumbers',
    'pageSize',
    'dataScope',
    'defaultSorting',
    'treeTable',
    'defaultExpandAllRows',
    'tableDensity',
    'dragSort',
    'dragSortBy',
  ],
  pathSchemas: {
    'quickEdit.editable': BOOLEAN_SCHEMA,
    'showRowNumbers.showIndex': BOOLEAN_SCHEMA,
    'pageSize.pageSize': NUMBER_SCHEMA,
    'dataScope.filter': FILTER_GROUP_SCHEMA,
    'defaultSorting.sort': ARRAY_SCHEMA,
    'treeTable.treeTable': BOOLEAN_SCHEMA,
    'defaultExpandAllRows.defaultExpandAllRows': BOOLEAN_SCHEMA,
    'tableDensity.size': STRING_SCHEMA,
    'dragSort.dragSort': BOOLEAN_SCHEMA,
    'dragSortBy.dragSortBy': STRING_SCHEMA,
  },
};
const FORM_FIELD_CONTAINER_USES = new Set([
  'FormBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'FormGridModel',
  'FormItemModel',
  'AssignFormModel',
  'AssignFormGridModel',
]);
const DETAILS_FIELD_CONTAINER_USES = new Set([
  'DetailsBlockModel',
  'DetailsGridModel',
  'DetailsItemModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'ListItemModel',
  'GridCardItemModel',
]);
const FILTER_FIELD_CONTAINER_USES = new Set(['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel']);
const TABLE_FIELD_CONTAINER_USES = new Set(['TableBlockModel', 'TableColumnModel']);
const TABLE_BLOCK_ACTION_CONTAINER_USES = ['TableBlockModel'];
const TABLE_ROW_ACTION_CONTAINER_USES = ['TableActionsColumnModel'];
const LIST_BLOCK_ACTION_CONTAINER_USES = ['ListBlockModel', 'GridCardBlockModel'];
const LIST_RECORD_ACTION_CONTAINER_USES = ['ListItemModel', 'GridCardItemModel'];
const DETAILS_ACTION_CONTAINER_USES = ['DetailsBlockModel'];
const FORM_ACTION_CONTAINER_USES = ['FormBlockModel', 'CreateFormModel', 'EditFormModel'];
const FILTER_FORM_ACTION_CONTAINER_USES = ['FilterFormBlockModel'];
const ACTION_PANEL_ACTION_CONTAINER_USES = ['ActionPanelBlockModel'];
const JS_EDITABLE_FIELD_USE_SET = new Set(['JSEditableFieldModel']);
const JS_DISPLAY_FIELD_USE_SET = new Set(['JSFieldModel']);
const EDITABLE_FIELD_USE_SET = new Set([
  ...JS_EDITABLE_FIELD_USE_SET,
  'RecordSelectFieldModel',
  'JsonFieldModel',
  'TextareaFieldModel',
  'IconFieldModel',
  'SelectFieldModel',
  'ColorFieldModel',
  'CheckboxFieldModel',
  'PasswordFieldModel',
  'NumberFieldModel',
  'PercentFieldModel',
  'DateTimeNoTzFieldModel',
  'DateOnlyFieldModel',
  'DateTimeTzFieldModel',
  'TimeFieldModel',
  'CollectionSelectorFieldModel',
  'RichTextFieldModel',
  'InputFieldModel',
]);
const DISPLAY_FIELD_USE_SET = new Set([
  ...JS_DISPLAY_FIELD_USE_SET,
  'DisplaySubItemFieldModel',
  'DisplaySubTableFieldModel',
  'DisplayHtmlFieldModel',
  'DisplayNumberFieldModel',
  'DisplayJSONFieldModel',
  'DisplayEnumFieldModel',
  'DisplayIconFieldModel',
  'DisplayCheckboxFieldModel',
  'DisplayPasswordFieldModel',
  'DisplayPercentFieldModel',
  'DisplayDateTimeFieldModel',
  'DisplayTextFieldModel',
  'DisplayURLFieldModel',
  'DisplayColorFieldModel',
  'DisplayTimeFieldModel',
]);
const FILTER_FIELD_USE_SET = new Set([
  'FilterFormRecordSelectFieldModel',
  'DateOnlyFilterFieldModel',
  'DateTimeNoTzFilterFieldModel',
  'DateTimeTzFilterFieldModel',
  'SelectFieldModel',
  'NumberFieldModel',
  'TimeFieldModel',
  'PercentFieldModel',
  'InputFieldModel',
]);
const KNOWN_FIELD_NODE_USES = new Set<string>([
  ...EDITABLE_FIELD_USE_SET,
  ...DISPLAY_FIELD_USE_SET,
  ...FILTER_FIELD_USE_SET,
]);

function keyedDomain(
  allowedKeys: string[],
  mergeStrategy: FlowSurfaceDomainContract['mergeStrategy'] = 'deep',
): FlowSurfaceDomainContract {
  return {
    allowedKeys,
    mergeStrategy,
    schema: {
      type: 'object',
      properties: Object.fromEntries(allowedKeys.map((key) => [key, ANY_VALUE_SCHEMA])),
      additionalProperties: false,
    },
  };
}

function wildcardDomain(mergeStrategy: FlowSurfaceDomainContract['mergeStrategy'] = 'deep'): FlowSurfaceDomainContract {
  return {
    allowedKeys: ['*'],
    wildcard: true,
    mergeStrategy,
    schema: {
      type: 'object',
      additionalProperties: true,
    },
  };
}

function pathListToSchema(paths: string[], pathSchemas?: Record<string, Record<string, any>>) {
  const root: Record<string, any> = {
    type: 'object',
    properties: {},
    additionalProperties: false,
  };

  for (const path of paths) {
    if (path === '*') {
      root.additionalProperties = true;
      continue;
    }
    const segments = path.split('.').filter(Boolean);
    let cursor = root;
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      if (segment === '*') {
        cursor.additionalProperties = true;
        break;
      }
      cursor.properties ||= {};
      if (index === segments.length - 1) {
        const fullPath = segments.slice(0, index + 1).join('.');
        cursor.properties[segment] = pathSchemas?.[fullPath] || ANY_VALUE_SCHEMA;
        continue;
      }
      cursor.properties[segment] ||= {
        type: 'object',
        properties: {},
        additionalProperties: false,
      };
      cursor = cursor.properties[segment];
    }
  }

  return root;
}

function groupedDomain(
  groups: Record<
    string,
    {
      allowedPaths: string[];
      clearable?: boolean;
      mergeStrategy?: FlowSurfaceDomainGroupContract['mergeStrategy'];
      schema?: Record<string, any>;
      eventBindingSteps?: FlowSurfaceDomainGroupContract['eventBindingSteps'];
      pathSchemas?: FlowSurfaceDomainGroupContract['pathSchemas'];
    }
  >,
  mergeStrategy: FlowSurfaceDomainContract['mergeStrategy'] = 'deep',
): FlowSurfaceDomainContract {
  const normalizedGroups = Object.fromEntries(
    Object.entries(groups).map(([key, definition]) => [
      key,
      {
        allowedPaths: definition.allowedPaths,
        clearable: definition.clearable,
        mergeStrategy: definition.mergeStrategy || mergeStrategy,
        schema: definition.schema || pathListToSchema(definition.allowedPaths, definition.pathSchemas),
        eventBindingSteps: definition.eventBindingSteps,
        pathSchemas: definition.pathSchemas,
      } as FlowSurfaceDomainGroupContract,
    ]),
  );

  return {
    allowedKeys: Object.keys(normalizedGroups),
    mergeStrategy,
    groups: normalizedGroups,
    schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(normalizedGroups).map(([key, definition]) => [key, definition.schema]),
      ),
      additionalProperties: false,
    },
  };
}

function buildSettingsSchema(contract: FlowSurfaceNodeContract) {
  return Object.fromEntries(
    Object.entries(contract.domains).map(([domain, definition]) => [
      domain,
      {
        ...definition?.schema,
        'x-allowedKeys': definition?.allowedKeys || [],
        'x-wildcard': !!definition?.wildcard,
        'x-mergeStrategy': definition?.mergeStrategy || 'deep',
        'x-groups': definition?.groups
          ? Object.fromEntries(
              Object.entries(definition.groups).map(([groupKey, group]) => [
                groupKey,
                {
                  allowedPaths: group.allowedPaths,
                  clearable: !!group.clearable,
                  mergeStrategy: group.mergeStrategy,
                  eventBindingSteps: group.eventBindingSteps,
                  pathSchemas: group.pathSchemas,
                },
              ]),
            )
          : undefined,
      },
    ]),
  );
}

function createContract(options: {
  editableDomains?: FlowSurfaceNodeDomain[];
  props?: string[];
  decoratorProps?: string[];
  stepParams?: string[];
  flowRegistry?: boolean;
  eventCapabilities?: FlowSurfaceNodeContract['eventCapabilities'];
  layoutCapabilities?: FlowSurfaceLayoutCapabilities;
  eventBindings?: FlowSurfaceNodeContract['eventBindings'];
}): FlowSurfaceNodeContract {
  const editableDomains = options.editableDomains || [];
  const domains: FlowSurfaceNodeContract['domains'] = {};

  if (editableDomains.includes('props')) {
    domains.props = keyedDomain(options.props || []);
  }
  if (editableDomains.includes('decoratorProps')) {
    domains.decoratorProps = keyedDomain(options.decoratorProps || []);
  }
  if (editableDomains.includes('stepParams')) {
    domains.stepParams = keyedDomain(options.stepParams || []);
  }
  if (editableDomains.includes('flowRegistry')) {
    domains.flowRegistry = wildcardDomain();
  }

  return {
    editableDomains,
    domains,
    eventCapabilities: options.eventCapabilities,
    layoutCapabilities: options.layoutCapabilities,
    eventBindings: options.eventBindings,
  };
}

export const READONLY_NODE_CONTRACT: FlowSurfaceNodeContract = {
  editableDomains: [],
  domains: {},
};

const GRID_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'flowRegistry'],
  props: ['rows', 'sizes', 'rowOrder'],
  flowRegistry: true,
  layoutCapabilities: GRID_LAYOUT_CAPABILITIES,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
GRID_NODE_CONTRACT.domains.props = keyedDomain(['rows', 'sizes', 'rowOrder'], 'replace');

const PAGE_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'enableTabs'],
  stepParams: ['pageSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    pageSettings: {
      stepKeys: ['general'],
    },
  },
});
PAGE_NODE_CONTRACT.domains.stepParams = groupedDomain({
  pageSettings: {
    allowedPaths: ['general.title', 'general.documentTitle', 'general.displayTitle', 'general.enableTabs'],
    mergeStrategy: 'deep',
    eventBindingSteps: ['general'],
    pathSchemas: {
      'general.title': STRING_SCHEMA,
      'general.documentTitle': STRING_SCHEMA,
      'general.displayTitle': BOOLEAN_SCHEMA,
      'general.enableTabs': BOOLEAN_SCHEMA,
    },
  },
});

const TAB_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'icon'],
  stepParams: ['pageTabSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    pageTabSettings: {
      stepKeys: ['tab'],
    },
  },
});
TAB_NODE_CONTRACT.domains.stepParams = groupedDomain({
  pageTabSettings: {
    allowedPaths: ['tab.title', 'tab.icon', 'tab.documentTitle'],
    mergeStrategy: 'deep',
    eventBindingSteps: ['tab'],
    pathSchemas: {
      'tab.title': STRING_SCHEMA,
      'tab.icon': STRING_SCHEMA,
      'tab.documentTitle': STRING_SCHEMA,
    },
  },
});

const TABLE_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'height', 'heightMode'],
  decoratorProps: ['height', 'heightMode'],
  stepParams: ['resourceSettings', 'tableSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ['beforeRender', 'paginationChange'],
    object: ['click'],
  },
});
TABLE_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  tableSettings: TABLE_SETTINGS_GROUP,
});

const FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['submit'],
  },
});
FORM_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  formModelSettings: FORM_MODEL_SETTINGS_GROUP,
  eventSettings: EVENT_SETTINGS_GROUP,
});

const CREATE_FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings', 'formSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['submit'],
  },
});
CREATE_FORM_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  formModelSettings: FORM_MODEL_SETTINGS_GROUP,
  eventSettings: EVENT_SETTINGS_GROUP,
  formSettings: CREATE_FORM_SETTINGS_EVENT_ONLY_GROUP,
});

const EDIT_FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings', 'formSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['submit'],
  },
});
EDIT_FORM_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  formModelSettings: FORM_MODEL_SETTINGS_GROUP,
  eventSettings: EVENT_SETTINGS_GROUP,
  formSettings: EDIT_FORM_SETTINGS_GROUP,
});

const DETAILS_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'detailsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
DETAILS_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  detailsSettings: DETAILS_SETTINGS_GROUP,
});

const FILTER_FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formFilterBlockModelSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['submit'],
  },
});
FILTER_FORM_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  formFilterBlockModelSettings: FILTER_FORM_BLOCK_SETTINGS_GROUP,
});

const LIST_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle'],
  decoratorProps: ['height', 'heightMode'],
  stepParams: ['resourceSettings', 'listSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
LIST_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: {
    allowedPaths: [
      'init.dataSourceKey',
      'init.collectionName',
      'init.associationName',
      'init.associationPathName',
      'init.sourceId',
      'init.filterByTk',
    ],
    eventBindingSteps: [],
    pathSchemas: {
      'init.dataSourceKey': STRING_SCHEMA,
      'init.collectionName': STRING_SCHEMA,
      'init.associationName': STRING_SCHEMA,
      'init.associationPathName': STRING_SCHEMA,
    },
  },
  listSettings: {
    allowedPaths: ['pageSize.pageSize', 'dataScope.filter', 'defaultSorting.*', 'layout.*', 'refreshData.*'],
    eventBindingSteps: [],
    pathSchemas: {
      'pageSize.pageSize': NUMBER_SCHEMA,
      'dataScope.filter': FILTER_GROUP_SCHEMA,
      'layout.layout': STRING_SCHEMA,
    },
  },
});

const GRID_CARD_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle'],
  decoratorProps: ['height', 'heightMode'],
  stepParams: ['resourceSettings', 'GridCardSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
GRID_CARD_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: {
    allowedPaths: [
      'init.dataSourceKey',
      'init.collectionName',
      'init.associationName',
      'init.associationPathName',
      'init.sourceId',
      'init.filterByTk',
    ],
    eventBindingSteps: [],
    pathSchemas: {
      'init.dataSourceKey': STRING_SCHEMA,
      'init.collectionName': STRING_SCHEMA,
      'init.associationName': STRING_SCHEMA,
      'init.associationPathName': STRING_SCHEMA,
    },
  },
  GridCardSettings: {
    allowedPaths: [
      'columnCount.columnCount.xs',
      'columnCount.columnCount.sm',
      'columnCount.columnCount.md',
      'columnCount.columnCount.lg',
      'columnCount.columnCount.xl',
      'columnCount.columnCount.xxl',
      'rowCount.rowCount',
      'dataScope.filter',
      'defaultSorting.*',
      'layout.*',
    ],
    eventBindingSteps: [],
    pathSchemas: {
      'columnCount.columnCount.xs': NUMBER_SCHEMA,
      'columnCount.columnCount.sm': NUMBER_SCHEMA,
      'columnCount.columnCount.md': NUMBER_SCHEMA,
      'columnCount.columnCount.lg': NUMBER_SCHEMA,
      'columnCount.columnCount.xl': NUMBER_SCHEMA,
      'columnCount.columnCount.xxl': NUMBER_SCHEMA,
      'rowCount.rowCount': NUMBER_SCHEMA,
      'dataScope.filter': FILTER_GROUP_SCHEMA,
      'layout.layout': STRING_SCHEMA,
    },
  },
});

const MARKDOWN_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'content', 'value'],
  stepParams: ['markdownBlockSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
MARKDOWN_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  markdownBlockSettings: {
    allowedPaths: ['editMarkdown.content'],
    clearable: true,
    eventBindingSteps: [],
    pathSchemas: {
      'editMarkdown.content': STRING_SCHEMA,
    },
  },
});

const IFRAME_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'url', 'height', 'heightMode', 'mode', 'html', 'params', 'allow', 'htmlId'],
  stepParams: ['iframeBlockSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
IFRAME_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  iframeBlockSettings: {
    allowedPaths: [
      'editIframe.mode',
      'editIframe.url',
      'editIframe.html',
      'editIframe.params',
      'editIframe.allow',
      'editIframe.htmlId',
      'editIframe.height',
    ],
    clearable: true,
    eventBindingSteps: [],
    pathSchemas: {
      'editIframe.mode': STRING_SCHEMA,
      'editIframe.url': STRING_SCHEMA,
      'editIframe.html': STRING_SCHEMA,
      'editIframe.params': ARRAY_SCHEMA,
      'editIframe.allow': STRING_SCHEMA,
      'editIframe.htmlId': STRING_SCHEMA,
      'editIframe.height': NUMBER_SCHEMA,
    },
  },
});

const CHART_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'height', 'heightMode'],
  stepParams: ['chartSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
CHART_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  chartSettings: {
    allowedPaths: ['configure', 'configure.*'],
    clearable: true,
    eventBindingSteps: [],
    pathSchemas: {
      configure: OBJECT_SCHEMA,
    },
  },
});

const ACTION_PANEL_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'layout', 'ellipsis'],
  stepParams: ['actionPanelBlockSetting'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
ACTION_PANEL_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  actionPanelBlockSetting: {
    allowedPaths: ['layout.layout', 'ellipsis.ellipsis'],
    eventBindingSteps: [],
    pathSchemas: {
      'layout.layout': STRING_SCHEMA,
      'ellipsis.ellipsis': BOOLEAN_SCHEMA,
    },
  },
});

const JS_BLOCK_CONTRACT = createContract({
  editableDomains: ['decoratorProps', 'stepParams', 'flowRegistry'],
  decoratorProps: ['title', 'description', 'className'],
  stepParams: ['jsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    jsSettings: {
      stepKeys: ['runJs'],
    },
  },
});
JS_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  jsSettings: RUN_JS_SETTINGS_GROUP,
});

const MAP_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'height', 'heightMode', 'mapField', 'marker', 'lineSort', 'zoom'],
  stepParams: ['resourceSettings', 'createMapBlock'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
MAP_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: {
    allowedPaths: [
      'init.dataSourceKey',
      'init.collectionName',
      'init.associationName',
      'init.associationPathName',
      'init.sourceId',
      'init.filterByTk',
    ],
    eventBindingSteps: [],
    pathSchemas: {
      'init.dataSourceKey': STRING_SCHEMA,
      'init.collectionName': STRING_SCHEMA,
      'init.associationName': STRING_SCHEMA,
      'init.associationPathName': STRING_SCHEMA,
    },
  },
  createMapBlock: {
    allowedPaths: ['init.mapField', 'init.marker', 'addAppends.*', 'dataScope.filter', 'lineSort.sort', 'mapZoom.zoom'],
    eventBindingSteps: [],
    pathSchemas: {
      'init.mapField': ARRAY_SCHEMA,
      'init.marker': STRING_SCHEMA,
      'dataScope.filter': FILTER_GROUP_SCHEMA,
      'lineSort.sort': ARRAY_SCHEMA,
      'mapZoom.zoom': NUMBER_SCHEMA,
    },
  },
});

const COMMENTS_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle'],
  stepParams: ['resourceSettings', 'commentsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
COMMENTS_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: {
    allowedPaths: [
      'init.dataSourceKey',
      'init.collectionName',
      'init.associationName',
      'init.associationPathName',
      'init.sourceId',
      'init.filterByTk',
    ],
    eventBindingSteps: [],
    pathSchemas: {
      'init.dataSourceKey': STRING_SCHEMA,
      'init.collectionName': STRING_SCHEMA,
      'init.associationName': STRING_SCHEMA,
      'init.associationPathName': STRING_SCHEMA,
    },
  },
  commentsSettings: {
    allowedPaths: ['pageSize.pageSize', 'dataScope.filter'],
    clearable: true,
    eventBindingSteps: [],
    pathSchemas: {
      'pageSize.pageSize': NUMBER_SCHEMA,
      'dataScope.filter': FILTER_GROUP_SCHEMA,
    },
  },
});

const ACTION_COLUMN_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'tooltip', 'width', 'fixed'],
  stepParams: ['tableColumnSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
ACTION_COLUMN_CONTRACT.domains.stepParams = groupedDomain({
  tableColumnSettings: {
    allowedPaths: TABLE_COLUMN_ALLOWED_PATHS,
    mergeStrategy: 'deep',
    pathSchemas: {
      'title.title': STRING_SCHEMA,
    },
  },
});

const FORM_ITEM_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: [
    'label',
    'showLabel',
    'tooltip',
    'extra',
    'initialValue',
    'titleField',
    'name',
    'rules',
    'aclDisabled',
    'aclCreateDisabled',
    'disabled',
    'required',
    'pattern',
    'multiple',
    'allowMultiple',
    'maxCount',
  ],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
FORM_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
});

const DETAILS_ITEM_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['label', 'showLabel', 'tooltip', 'extra', 'titleField', 'pattern', 'disabled'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
DETAILS_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
});

const FILTER_FORM_ITEM_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['label', 'showLabel', 'tooltip', 'extra', 'initialValue', 'name', 'multiple', 'allowMultiple', 'maxCount'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings', 'filterFormItemSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
FILTER_FORM_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  filterFormItemSettings: {
    allowedPaths: FILTER_FORM_ITEM_ALLOWED_PATHS,
    mergeStrategy: 'deep',
    pathSchemas: {
      'init.defaultTargetUid': STRING_SCHEMA,
      'init.filterField.name': STRING_SCHEMA,
      'init.filterField.title': STRING_SCHEMA,
      'init.filterField.interface': STRING_SCHEMA,
      'init.filterField.type': STRING_SCHEMA,
    },
  },
});

const TABLE_COLUMN_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'tooltip', 'width', 'fixed', 'editable', 'sorter', 'dataIndex', 'titleField'],
  stepParams: ['fieldSettings', 'tableColumnSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
TABLE_COLUMN_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  tableColumnSettings: {
    allowedPaths: TABLE_COLUMN_ALLOWED_PATHS,
    mergeStrategy: 'deep',
    pathSchemas: {
      'title.title': STRING_SCHEMA,
    },
  },
});

const JS_COLUMN_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'tooltip', 'width', 'fixed'],
  stepParams: ['tableColumnSettings', 'jsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    jsSettings: {
      stepKeys: ['runJs'],
    },
  },
});
JS_COLUMN_CONTRACT.domains.stepParams = groupedDomain({
  tableColumnSettings: {
    allowedPaths: TABLE_COLUMN_ALLOWED_PATHS,
    mergeStrategy: 'deep',
    pathSchemas: {
      'title.title': STRING_SCHEMA,
    },
  },
  jsSettings: RUN_JS_SETTINGS_GROUP,
});

const FIELD_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: [
    'title',
    'icon',
    'titleField',
    'clickToOpen',
    'autoSize',
    'allowMultiple',
    'multiple',
    'quickCreate',
    'allowClear',
    'mode',
    'options',
  ],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings', 'displayFieldSettings', 'popupSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    displayFieldSettings: {
      stepKeys: ['clickToOpen'],
    },
    popupSettings: {
      stepKeys: ['openView'],
    },
  },
});

const JS_FIELD_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: [
    'title',
    'icon',
    'titleField',
    'clickToOpen',
    'autoSize',
    'allowMultiple',
    'multiple',
    'quickCreate',
    'allowClear',
    'mode',
    'options',
  ],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings', 'displayFieldSettings', 'popupSettings', 'jsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    displayFieldSettings: {
      stepKeys: ['clickToOpen'],
    },
    popupSettings: {
      stepKeys: ['openView'],
    },
    jsSettings: {
      stepKeys: ['runJs'],
    },
  },
});
JS_FIELD_NODE_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  displayFieldSettings: {
    allowedPaths: ['clickToOpen.clickToOpen'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['clickToOpen'],
    pathSchemas: {
      'clickToOpen.clickToOpen': BOOLEAN_SCHEMA,
    },
  },
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: {
      'openView.mode': STRING_SCHEMA,
      'openView.size': STRING_SCHEMA,
      'openView.pageModelClass': STRING_SCHEMA,
      'openView.dataSourceKey': STRING_SCHEMA,
      'openView.collectionName': STRING_SCHEMA,
      'openView.associationName': STRING_SCHEMA,
      'openView.title': STRING_SCHEMA,
      'openView.uid': STRING_SCHEMA,
      'openView.subModelKey': STRING_SCHEMA,
      'openView.navigation': BOOLEAN_SCHEMA,
    },
  },
  jsSettings: RUN_JS_SETTINGS_GROUP,
});

const JS_ITEM_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['label', 'showLabel', 'tooltip', 'extra'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['jsSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    jsSettings: {
      stepKeys: ['runJs'],
    },
  },
});
JS_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  jsSettings: RUN_JS_SETTINGS_GROUP,
});
FIELD_NODE_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  displayFieldSettings: {
    allowedPaths: ['clickToOpen.clickToOpen'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['clickToOpen'],
    pathSchemas: {
      'clickToOpen.clickToOpen': BOOLEAN_SCHEMA,
    },
  },
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: {
      'openView.mode': STRING_SCHEMA,
      'openView.size': STRING_SCHEMA,
      'openView.pageModelClass': STRING_SCHEMA,
      'openView.dataSourceKey': STRING_SCHEMA,
      'openView.collectionName': STRING_SCHEMA,
      'openView.associationName': STRING_SCHEMA,
      'openView.title': STRING_SCHEMA,
      'openView.uid': STRING_SCHEMA,
      'openView.subModelKey': STRING_SCHEMA,
      'openView.navigation': BOOLEAN_SCHEMA,
    },
  },
});

const POPUP_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'popupSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    popupSettings: {
      stepKeys: ['openView'],
    },
  },
});
POPUP_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: {
      'openView.mode': STRING_SCHEMA,
      'openView.size': STRING_SCHEMA,
      'openView.pageModelClass': STRING_SCHEMA,
      'openView.dataSourceKey': STRING_SCHEMA,
      'openView.collectionName': STRING_SCHEMA,
      'openView.associationName': STRING_SCHEMA,
      'openView.title': STRING_SCHEMA,
      'openView.uid': STRING_SCHEMA,
      'openView.subModelKey': STRING_SCHEMA,
      'openView.navigation': BOOLEAN_SCHEMA,
    },
  },
});

const DELETE_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'deleteSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    deleteSettings: {
      stepKeys: ['confirm'],
    },
  },
});
DELETE_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  deleteSettings: {
    allowedPaths: CONFIRM_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['confirm'],
    pathSchemas: {
      'confirm.enable': BOOLEAN_SCHEMA,
      'confirm.title': STRING_SCHEMA,
      'confirm.content': STRING_SCHEMA,
    },
  },
});

const UPDATE_RECORD_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'assignSettings', 'apply'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    assignSettings: {
      stepKeys: ['confirm', 'assignFieldValues'],
    },
    apply: {
      stepKeys: ['apply'],
    },
  },
});
UPDATE_RECORD_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  assignSettings: {
    allowedPaths: [
      'confirm.enable',
      'confirm.title',
      'confirm.content',
      'assignFieldValues.assignedValues',
      'assignFieldValues.assignedValues.*',
    ],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['confirm', 'assignFieldValues'],
    pathSchemas: {
      'confirm.enable': BOOLEAN_SCHEMA,
      'confirm.title': STRING_SCHEMA,
      'confirm.content': STRING_SCHEMA,
      'assignFieldValues.assignedValues': OBJECT_SCHEMA,
    },
  },
  apply: {
    allowedPaths: ['apply.assignedValues', 'apply.assignedValues.*'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['apply'],
    pathSchemas: {
      'apply.assignedValues': OBJECT_SCHEMA,
    },
  },
});

const SUBMIT_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'submitSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    submitSettings: {
      stepKeys: ['confirm'],
    },
  },
});
SUBMIT_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  submitSettings: {
    allowedPaths: CONFIRM_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['confirm'],
    pathSchemas: {
      'confirm.enable': BOOLEAN_SCHEMA,
      'confirm.title': STRING_SCHEMA,
      'confirm.content': STRING_SCHEMA,
    },
  },
});

const SIMPLE_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
  },
});
SIMPLE_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
});

const JS_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'clickSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    clickSettings: {
      stepKeys: ['runJs'],
    },
  },
});
JS_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  clickSettings: RUN_JS_SETTINGS_GROUP,
});

const nodeContracts = new Map<string, FlowSurfaceNodeContract>();

function registerNodeContract(use: string, contract: FlowSurfaceNodeContract) {
  nodeContracts.set(use, contract);
}

[
  ['RootPageModel', PAGE_NODE_CONTRACT],
  ['ChildPageModel', PAGE_NODE_CONTRACT],
  ['RootPageTabModel', TAB_NODE_CONTRACT],
  ['ChildPageTabModel', TAB_NODE_CONTRACT],
  ['BlockGridModel', GRID_NODE_CONTRACT],
  ['FormGridModel', GRID_NODE_CONTRACT],
  ['DetailsGridModel', GRID_NODE_CONTRACT],
  ['FilterFormGridModel', GRID_NODE_CONTRACT],
  ['AssignFormGridModel', GRID_NODE_CONTRACT],
  ['TableBlockModel', TABLE_BLOCK_CONTRACT],
  ['CreateFormModel', CREATE_FORM_BLOCK_CONTRACT],
  ['EditFormModel', EDIT_FORM_BLOCK_CONTRACT],
  ['FormBlockModel', FORM_BLOCK_CONTRACT],
  ['AssignFormModel', FORM_BLOCK_CONTRACT],
  ['DetailsBlockModel', DETAILS_BLOCK_CONTRACT],
  ['FilterFormBlockModel', FILTER_FORM_BLOCK_CONTRACT],
  ['ListBlockModel', LIST_BLOCK_CONTRACT],
  ['GridCardBlockModel', GRID_CARD_BLOCK_CONTRACT],
  ['JSBlockModel', JS_BLOCK_CONTRACT],
  ['MarkdownBlockModel', MARKDOWN_BLOCK_CONTRACT],
  ['IframeBlockModel', IFRAME_BLOCK_CONTRACT],
  ['ChartBlockModel', CHART_BLOCK_CONTRACT],
  ['ActionPanelBlockModel', ACTION_PANEL_BLOCK_CONTRACT],
  ['MapBlockModel', MAP_BLOCK_CONTRACT],
  ['CommentsBlockModel', COMMENTS_BLOCK_CONTRACT],
  ['TableActionsColumnModel', ACTION_COLUMN_CONTRACT],
  ['FormItemModel', FORM_ITEM_CONTRACT],
  ['DetailsItemModel', DETAILS_ITEM_CONTRACT],
  ['FilterFormItemModel', FILTER_FORM_ITEM_CONTRACT],
  ['TableColumnModel', TABLE_COLUMN_CONTRACT],
  ['JSColumnModel', JS_COLUMN_CONTRACT],
  ['JSItemModel', JS_ITEM_CONTRACT],
  ['AddNewActionModel', POPUP_ACTION_CONTRACT],
  ['ViewActionModel', POPUP_ACTION_CONTRACT],
  ['EditActionModel', POPUP_ACTION_CONTRACT],
  ['PopupCollectionActionModel', POPUP_ACTION_CONTRACT],
  ['DeleteActionModel', DELETE_ACTION_CONTRACT],
  ['BulkDeleteActionModel', DELETE_ACTION_CONTRACT],
  ['UpdateRecordActionModel', UPDATE_RECORD_ACTION_CONTRACT],
  ['FormSubmitActionModel', SUBMIT_ACTION_CONTRACT],
  ['FilterFormSubmitActionModel', SUBMIT_ACTION_CONTRACT],
  ['FilterFormResetActionModel', SIMPLE_ACTION_CONTRACT],
  ['RefreshActionModel', SIMPLE_ACTION_CONTRACT],
  ['LinkActionModel', SIMPLE_ACTION_CONTRACT],
  ['JSCollectionActionModel', JS_ACTION_CONTRACT],
  ['JSRecordActionModel', JS_ACTION_CONTRACT],
  ['JSFormActionModel', JS_ACTION_CONTRACT],
  ['FilterFormJSActionModel', JS_ACTION_CONTRACT],
  ['JSActionModel', JS_ACTION_CONTRACT],
].forEach(([use, contract]) => registerNodeContract(use, contract as FlowSurfaceNodeContract));

KNOWN_FIELD_NODE_USES.forEach((use) =>
  registerNodeContract(
    use,
    JS_DISPLAY_FIELD_USE_SET.has(use) || JS_EDITABLE_FIELD_USE_SET.has(use)
      ? JS_FIELD_NODE_CONTRACT
      : FIELD_NODE_CONTRACT,
  ),
);

function makeCatalogItem(
  item: Omit<
    FlowSurfaceCatalogItem,
    'editableDomains' | 'settingsSchema' | 'settingsContract' | 'eventCapabilities' | 'layoutCapabilities'
  >,
): FlowSurfaceCatalogItem {
  const contract = getNodeContract(item.use);
  return {
    ...item,
    editableDomains: [...contract.editableDomains],
    settingsSchema: buildSettingsSchema(contract),
    settingsContract: contract.domains,
    eventCapabilities: contract.eventCapabilities,
    layoutCapabilities: contract.layoutCapabilities,
  };
}

function normalizeFieldContainerUse(containerUse?: string) {
  const normalized = String(containerUse || '').trim();
  if (FORM_FIELD_CONTAINER_USES.has(normalized)) {
    return 'form';
  }
  if (DETAILS_FIELD_CONTAINER_USES.has(normalized)) {
    return 'details';
  }
  if (FILTER_FIELD_CONTAINER_USES.has(normalized)) {
    return 'filter-form';
  }
  if (TABLE_FIELD_CONTAINER_USES.has(normalized)) {
    return 'table';
  }
  return null;
}

function getFieldWrapperUseForContainer(containerUse?: string) {
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'form':
      return 'FormItemModel';
    case 'details':
      return 'DetailsItemModel';
    case 'filter-form':
      return 'FilterFormItemModel';
    case 'table':
      return 'TableColumnModel';
    default:
      return null;
  }
}

function inferEditableFieldUse(fieldInterface: string) {
  if (['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'].includes(fieldInterface)) {
    return 'RecordSelectFieldModel';
  }
  const map = {
    json: 'JsonFieldModel',
    textarea: 'TextareaFieldModel',
    icon: 'IconFieldModel',
    radioGroup: 'SelectFieldModel',
    color: 'ColorFieldModel',
    select: 'SelectFieldModel',
    multipleSelect: 'SelectFieldModel',
    checkboxGroup: 'SelectFieldModel',
    checkbox: 'CheckboxFieldModel',
    password: 'PasswordFieldModel',
    number: 'NumberFieldModel',
    integer: 'NumberFieldModel',
    id: 'NumberFieldModel',
    snowflakeId: 'NumberFieldModel',
    percent: 'PercentFieldModel',
    datetimeNoTz: 'DateTimeNoTzFieldModel',
    date: 'DateOnlyFieldModel',
    datetime: 'DateTimeTzFieldModel',
    createdAt: 'DateTimeTzFieldModel',
    updatedAt: 'DateTimeTzFieldModel',
    unixTimestamp: 'DateTimeTzFieldModel',
    time: 'TimeFieldModel',
    collection: 'CollectionSelectorFieldModel',
    tableoid: 'CollectionSelectorFieldModel',
    richText: 'RichTextFieldModel',
    input: 'InputFieldModel',
    email: 'InputFieldModel',
    phone: 'InputFieldModel',
    uuid: 'InputFieldModel',
    url: 'InputFieldModel',
    nanoid: 'InputFieldModel',
  };
  return map[fieldInterface] || 'InputFieldModel';
}

function inferDisplayFieldUse(fieldInterface: string) {
  if (['m2o', 'o2o', 'oho', 'obo', 'updatedBy', 'createdBy'].includes(fieldInterface)) {
    return 'DisplaySubItemFieldModel';
  }
  if (['m2m', 'o2m', 'mbm'].includes(fieldInterface)) {
    return 'DisplaySubTableFieldModel';
  }
  const map = {
    richText: 'DisplayHtmlFieldModel',
    number: 'DisplayNumberFieldModel',
    integer: 'DisplayNumberFieldModel',
    id: 'DisplayNumberFieldModel',
    snowflakeId: 'DisplayNumberFieldModel',
    json: 'DisplayJSONFieldModel',
    select: 'DisplayEnumFieldModel',
    multipleSelect: 'DisplayEnumFieldModel',
    radioGroup: 'DisplayEnumFieldModel',
    checkboxGroup: 'DisplayEnumFieldModel',
    collection: 'DisplayEnumFieldModel',
    tableoid: 'DisplayEnumFieldModel',
    icon: 'DisplayIconFieldModel',
    checkbox: 'DisplayCheckboxFieldModel',
    password: 'DisplayPasswordFieldModel',
    percent: 'DisplayPercentFieldModel',
    date: 'DisplayDateTimeFieldModel',
    datetimeNoTz: 'DisplayDateTimeFieldModel',
    createdAt: 'DisplayDateTimeFieldModel',
    datetime: 'DisplayDateTimeFieldModel',
    updatedAt: 'DisplayDateTimeFieldModel',
    unixTimestamp: 'DisplayDateTimeFieldModel',
    formula: 'DisplayDateTimeFieldModel',
    input: 'DisplayTextFieldModel',
    email: 'DisplayTextFieldModel',
    phone: 'DisplayTextFieldModel',
    uuid: 'DisplayTextFieldModel',
    textarea: 'DisplayTextFieldModel',
    nanoid: 'DisplayTextFieldModel',
    url: 'DisplayURLFieldModel',
    color: 'DisplayColorFieldModel',
    time: 'DisplayTimeFieldModel',
  };
  return map[fieldInterface] || 'DisplayTextFieldModel';
}

function inferFilterFieldUse(fieldInterface: string) {
  if (['m2m', 'm2o', 'o2o', 'o2m', 'oho', 'obo', 'updatedBy', 'createdBy', 'mbm'].includes(fieldInterface)) {
    return 'FilterFormRecordSelectFieldModel';
  }
  const map = {
    date: 'DateOnlyFilterFieldModel',
    datetimeNoTz: 'DateTimeNoTzFilterFieldModel',
    createdAt: 'DateTimeTzFilterFieldModel',
    datetime: 'DateTimeTzFilterFieldModel',
    updatedAt: 'DateTimeTzFilterFieldModel',
    unixTimestamp: 'DateTimeTzFilterFieldModel',
    select: 'SelectFieldModel',
    multipleSelect: 'SelectFieldModel',
    radioGroup: 'SelectFieldModel',
    checkboxGroup: 'SelectFieldModel',
    checkbox: 'SelectFieldModel',
    number: 'NumberFieldModel',
    integer: 'NumberFieldModel',
    id: 'NumberFieldModel',
    snowflakeId: 'NumberFieldModel',
    time: 'TimeFieldModel',
    percent: 'PercentFieldModel',
    input: 'InputFieldModel',
    email: 'InputFieldModel',
    phone: 'InputFieldModel',
    uuid: 'InputFieldModel',
    url: 'InputFieldModel',
    nanoid: 'InputFieldModel',
  };
  return map[fieldInterface] || 'InputFieldModel';
}

function getAllowedFieldUseSet(containerUse?: string) {
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'form':
      return EDITABLE_FIELD_USE_SET;
    case 'details':
    case 'table':
      return DISPLAY_FIELD_USE_SET;
    case 'filter-form':
      return FILTER_FIELD_USE_SET;
    default:
      return null;
  }
}

function inferFieldUseByContainer(containerUse: string, field: any) {
  const fieldInterface = field?.interface || field?.options?.interface;
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'filter-form':
      return inferFilterFieldUse(fieldInterface);
    case 'form':
      return inferEditableFieldUse(fieldInterface);
    case 'details':
    case 'table':
      return inferDisplayFieldUse(fieldInterface);
    default:
      throw new Error(`flowSurfaces field container '${containerUse}' is not supported`);
  }
}

function inferJsFieldUseByContainer(containerUse?: string) {
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'form':
      return 'JSEditableFieldModel';
    case 'details':
    case 'table':
      return 'JSFieldModel';
    case 'filter-form':
      throw new Error(`flowSurfaces field renderer 'js' is not allowed under '${containerUse}'`);
    default:
      throw new Error(`flowSurfaces field container '${containerUse}' is not supported`);
  }
}

function resolveStandaloneFieldUse(input: { requestedType?: string; containerUse?: string }) {
  const requestedType = String(input.requestedType || '').trim();
  if (!requestedType) {
    return undefined;
  }
  if (requestedType === 'jsColumn') {
    if (normalizeFieldContainerUse(input.containerUse) !== 'table') {
      throw new Error(`flowSurfaces field type 'jsColumn' is only allowed under table containers`);
    }
    return 'JSColumnModel';
  }
  if (requestedType === 'jsItem') {
    if (normalizeFieldContainerUse(input.containerUse) !== 'form') {
      throw new Error(`flowSurfaces field type 'jsItem' is only allowed under form containers`);
    }
    return 'JSItemModel';
  }
  throw new Error(`flowSurfaces field type '${requestedType}' is not a supported public capability`);
}

export function resolveSupportedFieldCapability(input: {
  containerUse: string;
  field?: any;
  requestedFieldUse?: string;
  requestedWrapperUse?: string;
  allowUnresolvedFieldUse?: boolean;
  requestedRenderer?: string;
  requestedType?: string;
}) {
  const requestedRenderer =
    typeof input.requestedRenderer === 'undefined' ? undefined : String(input.requestedRenderer || '').trim();
  if (typeof requestedRenderer !== 'undefined' && requestedRenderer !== 'js') {
    throw new Error(`flowSurfaces field renderer '${requestedRenderer}' is not supported`);
  }

  const standaloneUse = resolveStandaloneFieldUse({
    requestedType: input.requestedType,
    containerUse: input.containerUse,
  });
  if (standaloneUse) {
    if (input.requestedWrapperUse && input.requestedWrapperUse !== standaloneUse) {
      throw new Error(
        `flowSurfaces field wrapper '${input.requestedWrapperUse}' is not allowed for field type '${input.requestedType}', expected '${standaloneUse}'`,
      );
    }
    if (input.requestedFieldUse && input.requestedFieldUse !== standaloneUse) {
      throw new Error(
        `flowSurfaces fieldUse '${input.requestedFieldUse}' does not match field type '${input.requestedType}', expected '${standaloneUse}'`,
      );
    }
    return {
      wrapperUse: undefined,
      fieldUse: undefined,
      inferredFieldUse: undefined,
      standaloneUse,
      renderer: undefined,
    };
  }

  const wrapperUse = getFieldWrapperUseForContainer(input.containerUse);
  if (!wrapperUse) {
    throw new Error(`flowSurfaces field container '${input.containerUse}' is not supported`);
  }

  if (input.requestedWrapperUse && input.requestedWrapperUse !== wrapperUse) {
    throw new Error(
      `flowSurfaces field wrapper '${input.requestedWrapperUse}' is not allowed under '${input.containerUse}', expected '${wrapperUse}'`,
    );
  }

  const inferredFieldUse =
    requestedRenderer === 'js'
      ? inferJsFieldUseByContainer(input.containerUse)
      : input.field
        ? inferFieldUseByContainer(input.containerUse, input.field)
        : undefined;
  const fieldUse = input.requestedFieldUse || inferredFieldUse;
  if (!fieldUse) {
    if (input.allowUnresolvedFieldUse) {
      return {
        wrapperUse,
        fieldUse: undefined,
        inferredFieldUse,
        standaloneUse: undefined,
        renderer: requestedRenderer,
      };
    }
    throw new Error(`flowSurfaces field '${input.containerUse}' requires a supported fieldUse`);
  }

  if (
    input.requestedFieldUse &&
    inferredFieldUse &&
    input.requestedFieldUse !== inferredFieldUse &&
    KNOWN_FIELD_NODE_USES.has(input.requestedFieldUse)
  ) {
    throw new Error(
      `flowSurfaces fieldUse '${input.requestedFieldUse}' does not match inferred fieldUse '${inferredFieldUse}' under '${input.containerUse}'`,
    );
  }

  const allowedFieldUses = getAllowedFieldUseSet(input.containerUse);
  if (!allowedFieldUses?.has(fieldUse)) {
    throw new Error(`flowSurfaces fieldUse '${fieldUse}' is not allowed under '${input.containerUse}'`);
  }

  return {
    wrapperUse,
    fieldUse,
    inferredFieldUse,
    standaloneUse: undefined,
    renderer: requestedRenderer,
  };
}

function isActionAllowedInContainer(item: FlowSurfaceCatalogItem, containerUse?: string) {
  if (!containerUse) {
    return true;
  }
  return Array.isArray(item.allowedContainerUses) && item.allowedContainerUses.includes(containerUse);
}

function toPublicActionCatalogItem(item: FlowSurfaceCatalogItem, containerUse?: string): FlowSurfaceCatalogItem {
  if (item.key === 'filterSubmit' && containerUse === 'FilterFormBlockModel') {
    return {
      ...item,
      key: 'submit',
    };
  }
  return item;
}

export function getAvailableActionCatalogItems(containerUse?: string) {
  const visible = containerUse
    ? actionCatalog.filter((item) => isActionAllowedInContainer(item, containerUse))
    : actionCatalog.filter((item) => item.key !== 'filterSubmit');
  const normalized = visible.map((item) => toPublicActionCatalogItem(item, containerUse));
  const dedupeBy = containerUse
    ? (item: FlowSurfaceCatalogItem) => `${item.key}:${item.use}`
    : (item: FlowSurfaceCatalogItem) => item.key;
  const seen = new Set<string>();
  return normalized.filter((item) => {
    const key = dedupeBy(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const COLLECTION_RESOURCE_REQUIRED = new Set([
  'TableBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'FormBlockModel',
  'DetailsBlockModel',
  'FilterFormBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);

export const blockCatalog: FlowSurfaceCatalogItem[] = FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) =>
  makeCatalogItem({
    key: entry.key,
    label: entry.label,
    kind: 'block',
    use: entry.modelUse,
    requiredInitParams: COLLECTION_RESOURCE_REQUIRED.has(entry.modelUse)
      ? ['dataSourceKey', 'collectionName']
      : undefined,
    createSupported: entry.createSupported,
  }),
);

export const actionCatalog: FlowSurfaceCatalogItem[] = [
  makeCatalogItem({
    key: 'addNew',
    label: 'Add new',
    kind: 'action',
    scene: 'collection',
    use: 'AddNewActionModel',
    allowedContainerUses: [...TABLE_BLOCK_ACTION_CONTAINER_USES, ...LIST_BLOCK_ACTION_CONTAINER_USES],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'view',
    label: 'View',
    kind: 'action',
    scene: 'record',
    use: 'ViewActionModel',
    allowedContainerUses: [
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'edit',
    label: 'Edit',
    kind: 'action',
    scene: 'record',
    use: 'EditActionModel',
    allowedContainerUses: [
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'popup',
    label: 'Popup',
    kind: 'action',
    scene: 'all',
    use: 'PopupCollectionActionModel',
    allowedContainerUses: [
      ...TABLE_BLOCK_ACTION_CONTAINER_USES,
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'refresh',
    label: 'Refresh',
    kind: 'action',
    scene: 'collection',
    use: 'RefreshActionModel',
    allowedContainerUses: [...TABLE_BLOCK_ACTION_CONTAINER_USES, ...LIST_BLOCK_ACTION_CONTAINER_USES],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'bulkDelete',
    label: 'Bulk delete',
    kind: 'action',
    scene: 'collection',
    use: 'BulkDeleteActionModel',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'delete',
    label: 'Delete',
    kind: 'action',
    scene: 'record',
    use: 'DeleteActionModel',
    allowedContainerUses: [
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'updateRecord',
    label: 'Update record',
    kind: 'action',
    scene: 'record',
    use: 'UpdateRecordActionModel',
    allowedContainerUses: [
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'link',
    label: 'Link',
    kind: 'action',
    scene: 'collection',
    use: 'LinkActionModel',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'submit',
    label: 'Submit',
    kind: 'action',
    scene: 'form',
    use: 'FormSubmitActionModel',
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'filterSubmit',
    label: 'Submit',
    kind: 'action',
    scene: 'form',
    use: 'FilterFormSubmitActionModel',
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'reset',
    label: 'Reset',
    kind: 'action',
    scene: 'form',
    use: 'FilterFormResetActionModel',
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'js',
    label: 'JS action',
    kind: 'action',
    scene: 'collection',
    use: 'JSCollectionActionModel',
    allowedContainerUses: [...TABLE_BLOCK_ACTION_CONTAINER_USES, ...LIST_BLOCK_ACTION_CONTAINER_USES],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'js',
    label: 'JS action',
    kind: 'action',
    scene: 'record',
    use: 'JSRecordActionModel',
    allowedContainerUses: [
      ...TABLE_ROW_ACTION_CONTAINER_USES,
      ...DETAILS_ACTION_CONTAINER_USES,
      ...LIST_RECORD_ACTION_CONTAINER_USES,
    ],
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'js',
    label: 'JS action',
    kind: 'action',
    scene: 'form',
    use: 'JSFormActionModel',
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'js',
    label: 'JS action',
    kind: 'action',
    scene: 'form',
    use: 'FilterFormJSActionModel',
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
  makeCatalogItem({
    key: 'js',
    label: 'JS action',
    kind: 'action',
    scene: 'all',
    use: 'JSActionModel',
    allowedContainerUses: ACTION_PANEL_ACTION_CONTAINER_USES,
    createSupported: true,
  }),
];

export const SERVICE_SUPPORTED_FLOW_SURFACE_BLOCK_KEYS = FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.filter(
  (entry) => entry.createSupported,
).map((entry) => entry.key);
export const BLOCK_CATALOG_BY_KEY = new Map(blockCatalog.map((item) => [item.key, item]));
export const BLOCK_CATALOG_BY_USE = new Map(blockCatalog.map((item) => [item.use, item]));
export const ACTION_CATALOG_BY_KEY = actionCatalog.reduce((map, item) => {
  const entries = map.get(item.key) || [];
  entries.push(item);
  map.set(item.key, entries);
  return map;
}, new Map<string, FlowSurfaceCatalogItem[]>());
export const ACTION_CATALOG_BY_USE = new Map(actionCatalog.map((item) => [item.use, item]));
export const BLOCK_KEY_BY_USE = new Map(blockCatalog.map((item) => [item.use, item.key]));
export const ACTION_KEY_BY_USE = new Map(actionCatalog.map((item) => [item.use, toPublicActionCatalogItem(item).key]));

function normalizeActionCatalogKey(type?: string, containerUse?: string) {
  if (String(type || '').trim() === 'submit' && containerUse === 'FilterFormBlockModel') {
    return 'filterSubmit';
  }
  return String(type || '').trim();
}

export function resolveSupportedBlockCatalogItem(
  input: {
    type?: string;
    use?: string;
  },
  options: {
    requireCreateSupported?: boolean;
  } = {},
) {
  const item =
    (input.type ? BLOCK_CATALOG_BY_KEY.get(String(input.type).trim()) : undefined) ||
    (input.use ? BLOCK_CATALOG_BY_USE.get(String(input.use).trim()) : undefined);

  if (!item) {
    throw new Error(`flowSurfaces addBlock only supports registered block types/uses`);
  }
  if (options.requireCreateSupported && item.createSupported === false) {
    throw new Error(`flowSurfaces addBlock does not support creating '${item.key}' yet`);
  }
  return item;
}

export function resolveSupportedActionCatalogItem(
  input: {
    type?: string;
    use?: string;
    containerUse?: string;
  },
  options: {
    requireCreateSupported?: boolean;
  } = {},
) {
  const requestedType = String(input.type || '').trim();
  const normalizedUse = String(input.use || '').trim();
  let item = normalizedUse ? ACTION_CATALOG_BY_USE.get(normalizedUse) : undefined;

  if (!item && requestedType) {
    const normalizedType = normalizeActionCatalogKey(input.type, input.containerUse);
    const candidates = (normalizedType ? ACTION_CATALOG_BY_KEY.get(normalizedType) : undefined) || [];
    const matched = candidates.filter(
      (candidate) => !input.containerUse || isActionAllowedInContainer(candidate, input.containerUse),
    );
    if (candidates.length && input.containerUse && !matched.length) {
      throw new Error(`flowSurfaces addAction '${requestedType}' is not allowed under '${input.containerUse}'`);
    }
    if (matched.length > 1 && !input.containerUse) {
      throw new Error(
        `flowSurfaces addAction type '${requestedType}' requires containerUse to resolve a public action capability`,
      );
    }
    item = matched[0];
  }

  if (!item) {
    throw new Error(`flowSurfaces addAction only supports registered action types/uses`);
  }
  if (requestedType) {
    const publicKey = toPublicActionCatalogItem(item, input.containerUse).key;
    if (requestedType !== publicKey) {
      throw new Error(
        `flowSurfaces addAction only supports public action type '${publicKey}' under '${
          input.containerUse || 'unknown'
        }'`,
      );
    }
  }
  if (input.containerUse && !isActionAllowedInContainer(item, input.containerUse)) {
    throw new Error(
      `flowSurfaces addAction '${toPublicActionCatalogItem(item, input.containerUse).key}' is not allowed under '${
        input.containerUse
      }'`,
    );
  }
  if (options.requireCreateSupported && item.createSupported === false) {
    throw new Error(`flowSurfaces addAction does not support creating '${item.key}' yet`);
  }
  return item;
}

export function getNodeContract(use?: string): FlowSurfaceNodeContract {
  if (use && nodeContracts.has(use)) {
    return nodeContracts.get(use)!;
  }

  return READONLY_NODE_CONTRACT;
}

export function getEditableDomainsForUse(use?: string): FlowSurfaceNodeDomain[] {
  return [...getNodeContract(use).editableDomains];
}

export function getSettingsSchemaForUse(use?: string): Record<string, any> {
  return buildSettingsSchema(getNodeContract(use));
}

export function getLayoutCapabilitiesForUse(use?: string): FlowSurfaceLayoutCapabilities | undefined {
  return getNodeContract(use).layoutCapabilities;
}
