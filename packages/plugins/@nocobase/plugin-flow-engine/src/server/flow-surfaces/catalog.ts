/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  FlowSurfaceActionScope,
  FlowSurfaceCatalogItem,
  FlowSurfaceDomainContract,
  FlowSurfaceDomainGroupContract,
  FlowSurfaceLayoutCapabilities,
  FlowSurfaceNodeContract,
  FlowSurfaceNodeDomain,
} from './types';
import {
  ACTION_PANEL_ACTION_CONTAINER_USES,
  assertActionScopeMatchesContainer,
  assertKnownActionContainerUse,
  COLLECTION_BLOCK_ACTION_CONTAINER_USES,
  DETAILS_ACTION_CONTAINER_USES,
  FILTER_FORM_ACTION_CONTAINER_USES,
  FORM_ACTION_CONTAINER_USES,
  getActionContainerScope,
  LIST_BLOCK_ACTION_CONTAINER_USES,
  LIST_RECORD_ACTION_CONTAINER_USES,
  RECORD_ACTION_CONTAINER_USES,
  TABLE_BLOCK_ACTION_CONTAINER_USES,
  TABLE_ROW_ACTION_CONTAINER_USES,
} from './action-scope';
import { FlowSurfaceBadRequestError, FlowSurfaceInternalError } from './errors';
import { normalizeFieldContainerKind, shouldUseAssociationTitleTextDisplay } from './field-semantics';
import { getRegisteredFieldUses, resolveRegisteredFieldBinding } from './field-binding-registry';
import { FLOW_SURFACE_BLOCK_SUPPORT_MATRIX } from './support-matrix';

const ANY_VALUE_SCHEMA = {};
const STRING_SCHEMA = { type: 'string' };
const NULLABLE_STRING_SCHEMA = { type: 'string', nullable: true };
const BOOLEAN_SCHEMA = { type: 'boolean' };
const OPEN_VIEW_MODE_SCHEMA = { type: 'string', enum: ['drawer', 'dialog', 'embed'] };
const OPEN_VIEW_SCENE_SCHEMA = {
  type: 'string',
  enum: ['new', 'one', 'many', 'select', 'subForm', 'bulkEditForm', 'generic'],
};
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
  'openView.scene',
  'openView.dataSourceKey',
  'openView.collectionName',
  'openView.associationName',
  'openView.sourceId',
  'openView.filterByTk',
  'openView.title',
  'openView.uid',
  'openView.subModelKey',
  'openView.navigation',
  'openView.template',
  'openView.template.uid',
  'openView.template.mode',
];
const OPEN_VIEW_PATH_SCHEMAS = {
  'openView.mode': OPEN_VIEW_MODE_SCHEMA,
  'openView.size': STRING_SCHEMA,
  'openView.pageModelClass': STRING_SCHEMA,
  'openView.scene': OPEN_VIEW_SCENE_SCHEMA,
  'openView.dataSourceKey': STRING_SCHEMA,
  'openView.collectionName': STRING_SCHEMA,
  'openView.associationName': NULLABLE_STRING_SCHEMA,
  'openView.sourceId': STRING_SCHEMA,
  'openView.filterByTk': STRING_SCHEMA,
  'openView.title': STRING_SCHEMA,
  'openView.uid': STRING_SCHEMA,
  'openView.subModelKey': STRING_SCHEMA,
  'openView.navigation': BOOLEAN_SCHEMA,
  'openView.template': OBJECT_SCHEMA,
  'openView.template.uid': STRING_SCHEMA,
  'openView.template.mode': {
    type: 'string',
    enum: ['reference', 'copy'],
  },
};
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
const BLOCK_LINKAGE_CARD_SETTINGS_GROUP = {
  allowedPaths: ['linkageRules'],
  mergeStrategy: 'deep' as const,
  eventBindingSteps: ['linkageRules'],
  pathSchemas: {
    linkageRules: ARRAY_SCHEMA,
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
type FlowSurfaceActionRegistryItem = {
  publicKey: string;
  label: string;
  scope: FlowSurfaceActionScope;
  scene?: string;
  use: string;
  ownerPlugin: string;
  allowedContainerUses: string[];
  createSupported?: boolean;
};
const CORE_FLOW_SURFACE_OWNER_PLUGIN = '@nocobase/core/client';
const FLOW_SURFACE_BLOCK_OWNER_PLUGIN_BY_USE = new Map(
  FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((entry) => [entry.modelUse, entry.ownerPlugin]),
);
const JS_EDITABLE_FIELD_USE_SET = new Set(['JSEditableFieldModel']);
const JS_DISPLAY_FIELD_USE_SET = new Set(['JSFieldModel']);
const REGISTERED_EDITABLE_FIELD_USE_SET = getRegisteredFieldUses('editable');
const REGISTERED_DISPLAY_FIELD_USE_SET = getRegisteredFieldUses('display');
const REGISTERED_FILTER_FIELD_USE_SET = getRegisteredFieldUses('filter');
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
  ...REGISTERED_EDITABLE_FIELD_USE_SET,
  ...REGISTERED_DISPLAY_FIELD_USE_SET,
  ...REGISTERED_FILTER_FIELD_USE_SET,
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

const FORM_GRID_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['rows', 'sizes', 'rowOrder'],
  stepParams: ['formModelSettings', 'eventSettings'],
  flowRegistry: true,
  layoutCapabilities: GRID_LAYOUT_CAPABILITIES,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
  eventBindings: {
    formModelSettings: {
      stepKeys: ['layout', 'assignRules'],
    },
    eventSettings: {
      stepKeys: ['linkageRules'],
    },
  },
});
FORM_GRID_NODE_CONTRACT.domains.props = keyedDomain(['rows', 'sizes', 'rowOrder'], 'replace');
FORM_GRID_NODE_CONTRACT.domains.stepParams = groupedDomain({
  formModelSettings: FORM_MODEL_SETTINGS_GROUP,
  eventSettings: EVENT_SETTINGS_GROUP,
});

const PAGE_NODE_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'enableTabs', 'icon', 'enableHeader'],
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
    allowedPaths: [
      'general.title',
      'general.documentTitle',
      'general.displayTitle',
      'general.enableTabs',
      'general.icon',
      'general.enableHeader',
    ],
    mergeStrategy: 'deep',
    eventBindingSteps: ['general'],
    pathSchemas: {
      'general.title': STRING_SCHEMA,
      'general.documentTitle': STRING_SCHEMA,
      'general.displayTitle': BOOLEAN_SCHEMA,
      'general.enableTabs': BOOLEAN_SCHEMA,
      'general.icon': STRING_SCHEMA,
      'general.enableHeader': BOOLEAN_SCHEMA,
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
  stepParams: ['resourceSettings', 'tableSettings', 'cardSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ['beforeRender', 'paginationChange'],
    object: ['click'],
  },
});
TABLE_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  tableSettings: TABLE_SETTINGS_GROUP,
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const CREATE_FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings', 'formSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const EDIT_FORM_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'formModelSettings', 'eventSettings', 'formSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const DETAILS_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'labelWidth', 'labelWrap'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['resourceSettings', 'detailsSettings', 'cardSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
    object: ['click'],
  },
});
DETAILS_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  resourceSettings: RESOURCE_SETTINGS_GROUP,
  detailsSettings: DETAILS_SETTINGS_GROUP,
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
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
  stepParams: ['resourceSettings', 'listSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const GRID_CARD_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle'],
  decoratorProps: ['height', 'heightMode'],
  stepParams: ['resourceSettings', 'GridCardSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
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

const CHART_CARD_SETTINGS_GROUP = {
  allowedPaths: ['titleDescription.title', 'blockHeight.heightMode', 'blockHeight.height', 'linkageRules'],
  clearable: true,
  mergeStrategy: 'deep' as const,
  eventBindingSteps: ['titleDescription', 'blockHeight', 'linkageRules'],
  pathSchemas: {
    'titleDescription.title': STRING_SCHEMA,
    'blockHeight.heightMode': STRING_SCHEMA,
    'blockHeight.height': NUMBER_SCHEMA,
    linkageRules: ARRAY_SCHEMA,
  },
};

const CHART_BLOCK_CONTRACT = createContract({
  editableDomains: ['stepParams', 'flowRegistry'],
  stepParams: ['cardSettings', 'chartSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
CHART_BLOCK_CONTRACT.domains.stepParams = groupedDomain({
  cardSettings: CHART_CARD_SETTINGS_GROUP,
  chartSettings: {
    allowedPaths: ['configure', 'configure.*'],
    clearable: true,
    mergeStrategy: 'replace',
    eventBindingSteps: [],
    pathSchemas: {
      configure: OBJECT_SCHEMA,
    },
  },
});

const ACTION_PANEL_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle', 'layout', 'ellipsis'],
  stepParams: ['actionPanelBlockSetting', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
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
  stepParams: ['resourceSettings', 'createMapBlock', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
});

const COMMENTS_BLOCK_CONTRACT = createContract({
  editableDomains: ['props', 'stepParams', 'flowRegistry'],
  props: ['title', 'displayTitle'],
  stepParams: ['resourceSettings', 'commentsSettings', 'cardSettings'],
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
  cardSettings: BLOCK_LINKAGE_CARD_SETTINGS_GROUP,
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
  stepParams: ['fieldSettings', 'editItemSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
FORM_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  editItemSettings: {
    allowedPaths: ['model.use'],
    mergeStrategy: 'deep',
    eventBindingSteps: ['model'],
    pathSchemas: {
      'model.use': STRING_SCHEMA,
    },
  },
});

const DETAILS_ITEM_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ['label', 'showLabel', 'tooltip', 'extra', 'titleField', 'pattern', 'disabled'],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings', 'detailItemSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: DEFAULT_DIRECT_EVENTS,
  },
});
DETAILS_ITEM_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  detailItemSettings: {
    allowedPaths: ['model.use'],
    mergeStrategy: 'deep',
    eventBindingSteps: ['model'],
    pathSchemas: {
      'model.use': STRING_SCHEMA,
    },
  },
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
    allowedPaths: [...FILTER_FORM_ITEM_ALLOWED_PATHS, 'model.use'],
    mergeStrategy: 'deep',
    pathSchemas: {
      'init.defaultTargetUid': STRING_SCHEMA,
      'init.filterField.name': STRING_SCHEMA,
      'init.filterField.title': STRING_SCHEMA,
      'init.filterField.interface': STRING_SCHEMA,
      'init.filterField.type': STRING_SCHEMA,
      'model.use': STRING_SCHEMA,
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
    allowedPaths: [...TABLE_COLUMN_ALLOWED_PATHS, 'model.use'],
    mergeStrategy: 'deep',
    pathSchemas: {
      'title.title': STRING_SCHEMA,
      'model.use': STRING_SCHEMA,
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
    'displayStyle',
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
      stepKeys: ['displayStyle', 'clickToOpen'],
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
    'displayStyle',
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
      stepKeys: ['displayStyle', 'clickToOpen'],
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
    allowedPaths: ['displayStyle.displayStyle', 'clickToOpen.clickToOpen'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['displayStyle', 'clickToOpen'],
    pathSchemas: {
      'displayStyle.displayStyle': STRING_SCHEMA,
      'clickToOpen.clickToOpen': BOOLEAN_SCHEMA,
    },
  },
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: OPEN_VIEW_PATH_SCHEMAS,
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
    allowedPaths: ['displayStyle.displayStyle', 'clickToOpen.clickToOpen'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['displayStyle', 'clickToOpen'],
    pathSchemas: {
      'displayStyle.displayStyle': STRING_SCHEMA,
      'clickToOpen.clickToOpen': BOOLEAN_SCHEMA,
    },
  },
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: OPEN_VIEW_PATH_SCHEMAS,
  },
});
const SUB_FORM_FIELD_NODE_CONTRACT = createContract({
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
    'displayStyle',
    'options',
  ],
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['fieldSettings', 'displayFieldSettings', 'popupSettings', 'eventSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    displayFieldSettings: {
      stepKeys: ['displayStyle', 'clickToOpen'],
    },
    popupSettings: {
      stepKeys: ['openView'],
    },
    eventSettings: {
      stepKeys: ['linkageRules'],
    },
  },
});
SUB_FORM_FIELD_NODE_CONTRACT.domains.stepParams = groupedDomain({
  fieldSettings: FIELD_SETTINGS_INIT_GROUP,
  displayFieldSettings: {
    allowedPaths: ['displayStyle.displayStyle', 'clickToOpen.clickToOpen'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['displayStyle', 'clickToOpen'],
    pathSchemas: {
      'displayStyle.displayStyle': STRING_SCHEMA,
      'clickToOpen.clickToOpen': BOOLEAN_SCHEMA,
    },
  },
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: OPEN_VIEW_PATH_SCHEMAS,
  },
  eventSettings: EVENT_SETTINGS_GROUP,
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
    pathSchemas: OPEN_VIEW_PATH_SCHEMAS,
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

const FILTER_FORM_SUBMIT_ACTION_CONTRACT = createContract({
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
      stepKeys: ['doFilter'],
    },
  },
});
FILTER_FORM_SUBMIT_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  submitSettings: {
    allowedPaths: [],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['doFilter'],
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

const BULK_EDIT_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'bulkEditSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    bulkEditSettings: {
      stepKeys: ['editMode'],
    },
  },
});
BULK_EDIT_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  bulkEditSettings: {
    allowedPaths: ['editMode.value'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['editMode'],
    pathSchemas: {
      'editMode.value': STRING_SCHEMA,
    },
  },
});

const BULK_UPDATE_ACTION_CONTRACT = createContract({
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
      stepKeys: ['confirm', 'updateMode', 'assignFieldValues'],
    },
    apply: {
      stepKeys: ['apply'],
    },
  },
});
BULK_UPDATE_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  assignSettings: {
    allowedPaths: [
      'confirm.enable',
      'confirm.title',
      'confirm.content',
      'updateMode.value',
      'assignFieldValues.assignedValues',
      'assignFieldValues.assignedValues.*',
    ],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['confirm', 'updateMode', 'assignFieldValues'],
    pathSchemas: {
      'confirm.enable': BOOLEAN_SCHEMA,
      'confirm.title': STRING_SCHEMA,
      'confirm.content': STRING_SCHEMA,
      'updateMode.value': STRING_SCHEMA,
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

const FILTER_FORM_COLLAPSE_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'collapseSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ['collapseToggle'],
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    collapseSettings: {
      stepKeys: ['toggle', 'defaultCollapsed'],
    },
  },
});
FILTER_FORM_COLLAPSE_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  collapseSettings: {
    allowedPaths: ['toggle.collapsedRows', 'defaultCollapsed.value'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['toggle', 'defaultCollapsed'],
    pathSchemas: {
      'toggle.collapsedRows': NUMBER_SCHEMA,
      'defaultCollapsed.value': BOOLEAN_SCHEMA,
    },
  },
});

const DUPLICATE_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'duplicateModeSettings', 'duplicateSettings', 'popupSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    duplicateModeSettings: {
      stepKeys: ['duplicateMode'],
    },
    duplicateSettings: {
      stepKeys: ['confirm'],
    },
    popupSettings: {
      stepKeys: ['confirm', 'openView'],
    },
  },
});
DUPLICATE_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  duplicateModeSettings: {
    allowedPaths: ['duplicateMode.duplicateMode', 'duplicateMode.collection'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['duplicateMode'],
    pathSchemas: {
      'duplicateMode.duplicateMode': STRING_SCHEMA,
      'duplicateMode.collection': STRING_SCHEMA,
    },
  },
  duplicateSettings: {
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
  popupSettings: {
    allowedPaths: [...CONFIRM_ALLOWED_PATHS, ...OPEN_VIEW_ALLOWED_PATHS],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['confirm', 'openView'],
    pathSchemas: {
      'confirm.enable': BOOLEAN_SCHEMA,
      'confirm.title': STRING_SCHEMA,
      'confirm.content': STRING_SCHEMA,
      ...OPEN_VIEW_PATH_SCHEMAS,
    },
  },
});

const UPLOAD_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'selectExitRecordSettings'],
  flowRegistry: true,
  eventCapabilities: {
    direct: ACTION_DIRECT_EVENTS,
    object: ACTION_OBJECT_EVENTS,
  },
  eventBindings: {
    buttonSettings: {
      stepKeys: ['general', 'linkageRules'],
    },
    selectExitRecordSettings: {
      stepKeys: ['openView'],
    },
  },
});
UPLOAD_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  selectExitRecordSettings: {
    allowedPaths: ['openView.mode', 'openView.size'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: {
      'openView.mode': OPEN_VIEW_MODE_SCHEMA,
      'openView.size': STRING_SCHEMA,
    },
  },
});

const MAIL_SEND_ACTION_CONTRACT = createContract({
  editableDomains: ['props', 'decoratorProps', 'stepParams', 'flowRegistry'],
  props: ACTION_PROP_KEYS,
  decoratorProps: ['labelWidth', 'labelWrap'],
  stepParams: ['buttonSettings', 'popupSettings', 'sendEmailSettings'],
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
    sendEmailSettings: {
      stepKeys: ['emailFieldNames', 'defaultSelectAllRecords'],
    },
  },
});
MAIL_SEND_ACTION_CONTRACT.domains.stepParams = groupedDomain({
  buttonSettings: ACTION_BUTTON_SETTINGS_GROUP,
  popupSettings: {
    allowedPaths: OPEN_VIEW_ALLOWED_PATHS,
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['openView'],
    pathSchemas: OPEN_VIEW_PATH_SCHEMAS,
  },
  sendEmailSettings: {
    allowedPaths: ['emailFieldNames.value', 'defaultSelectAllRecords.value'],
    clearable: true,
    mergeStrategy: 'deep',
    eventBindingSteps: ['emailFieldNames', 'defaultSelectAllRecords'],
    pathSchemas: {
      'emailFieldNames.value': ARRAY_SCHEMA,
      'defaultSelectAllRecords.value': STRING_SCHEMA,
    },
  },
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

const NODE_CONTRACT_ENTRIES: Array<[string, FlowSurfaceNodeContract]> = [
  ['RootPageModel', PAGE_NODE_CONTRACT],
  ['ChildPageModel', PAGE_NODE_CONTRACT],
  ['RootPageTabModel', TAB_NODE_CONTRACT],
  ['ChildPageTabModel', TAB_NODE_CONTRACT],
  ['BlockGridModel', GRID_NODE_CONTRACT],
  ['FormGridModel', FORM_GRID_NODE_CONTRACT],
  ['DetailsGridModel', GRID_NODE_CONTRACT],
  ['FilterFormGridModel', GRID_NODE_CONTRACT],
  ['AssignFormGridModel', FORM_GRID_NODE_CONTRACT],
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
  ['FormAssociationItemModel', DETAILS_ITEM_CONTRACT],
  ['DetailsItemModel', DETAILS_ITEM_CONTRACT],
  ['FilterFormItemModel', FILTER_FORM_ITEM_CONTRACT],
  ['SubFormFieldModel', SUB_FORM_FIELD_NODE_CONTRACT],
  ['SubFormListFieldModel', SUB_FORM_FIELD_NODE_CONTRACT],
  ['TableColumnModel', TABLE_COLUMN_CONTRACT],
  ['JSColumnModel', JS_COLUMN_CONTRACT],
  ['JSItemModel', JS_ITEM_CONTRACT],
  ['FormJSFieldItemModel', JS_ITEM_CONTRACT],
  ['AddNewActionModel', POPUP_ACTION_CONTRACT],
  ['ViewActionModel', POPUP_ACTION_CONTRACT],
  ['EditActionModel', POPUP_ACTION_CONTRACT],
  ['PopupCollectionActionModel', POPUP_ACTION_CONTRACT],
  ['AddChildActionModel', POPUP_ACTION_CONTRACT],
  ['DeleteActionModel', DELETE_ACTION_CONTRACT],
  ['BulkDeleteActionModel', DELETE_ACTION_CONTRACT],
  ['UpdateRecordActionModel', UPDATE_RECORD_ACTION_CONTRACT],
  ['BulkEditActionModel', BULK_EDIT_ACTION_CONTRACT],
  ['BulkUpdateActionModel', BULK_UPDATE_ACTION_CONTRACT],
  ['DuplicateActionModel', DUPLICATE_ACTION_CONTRACT],
  ['FormSubmitActionModel', SUBMIT_ACTION_CONTRACT],
  ['FilterFormSubmitActionModel', FILTER_FORM_SUBMIT_ACTION_CONTRACT],
  ['FilterFormResetActionModel', SIMPLE_ACTION_CONTRACT],
  ['FilterFormCollapseActionModel', FILTER_FORM_COLLAPSE_ACTION_CONTRACT],
  ['FilterActionModel', SIMPLE_ACTION_CONTRACT],
  ['RefreshActionModel', SIMPLE_ACTION_CONTRACT],
  ['LinkActionModel', SIMPLE_ACTION_CONTRACT],
  ['ExpandCollapseActionModel', SIMPLE_ACTION_CONTRACT],
  ['ExportActionModel', SIMPLE_ACTION_CONTRACT],
  ['ExportAttachmentActionModel', SIMPLE_ACTION_CONTRACT],
  ['ImportActionModel', SIMPLE_ACTION_CONTRACT],
  ['TemplatePrintCollectionActionModel', SIMPLE_ACTION_CONTRACT],
  ['TemplatePrintRecordActionModel', SIMPLE_ACTION_CONTRACT],
  ['CollectionTriggerWorkflowActionModel', SIMPLE_ACTION_CONTRACT],
  ['RecordTriggerWorkflowActionModel', SIMPLE_ACTION_CONTRACT],
  ['FormTriggerWorkflowActionModel', SIMPLE_ACTION_CONTRACT],
  ['WorkbenchTriggerWorkflowActionModel', SIMPLE_ACTION_CONTRACT],
  ['UploadActionModel', UPLOAD_ACTION_CONTRACT],
  ['MailSendActionModel', MAIL_SEND_ACTION_CONTRACT],
  ['JSCollectionActionModel', JS_ACTION_CONTRACT],
  ['JSRecordActionModel', JS_ACTION_CONTRACT],
  ['JSFormActionModel', JS_ACTION_CONTRACT],
  ['FilterFormJSActionModel', JS_ACTION_CONTRACT],
  ['JSItemActionModel', JS_ACTION_CONTRACT],
  ['JSActionModel', JS_ACTION_CONTRACT],
];

NODE_CONTRACT_ENTRIES.forEach(([use, contract]) => registerNodeContract(use, contract));

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
  return normalizeFieldContainerKind(containerUse);
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
    // Real frontend saved fixtures still read back these enum-like displays as text fields.
    select: 'DisplayTextFieldModel',
    multipleSelect: 'DisplayTextFieldModel',
    radioGroup: 'DisplayTextFieldModel',
    checkboxGroup: 'DisplayTextFieldModel',
    collection: 'DisplayTextFieldModel',
    tableoid: 'DisplayTextFieldModel',
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

function getAllowedFieldUseSet(containerUse?: string, enabledPackages?: ReadonlySet<string>) {
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'form':
      return new Set([...EDITABLE_FIELD_USE_SET, ...getRegisteredFieldUses('editable', enabledPackages)]);
    case 'details':
    case 'table':
      return new Set([...DISPLAY_FIELD_USE_SET, ...getRegisteredFieldUses('display', enabledPackages)]);
    case 'filter-form':
      return new Set([...FILTER_FIELD_USE_SET, ...getRegisteredFieldUses('filter', enabledPackages)]);
    default:
      return null;
  }
}

function inferFieldUseByContainer(
  containerUse: string,
  field: any,
  options: {
    enabledPackages?: ReadonlySet<string>;
    dataSourceKey?: string;
    getCollection?: (dataSourceKey: string, collectionName: string) => any;
  } = {},
) {
  const fieldInterface = field?.interface || field?.options?.interface;
  const registeredBinding = resolveRegisteredFieldBinding({
    containerUse,
    field,
    dataSourceKey: options.dataSourceKey,
    enabledPackages: options.enabledPackages,
    getCollection: options.getCollection,
  });
  if (registeredBinding?.modelClassName) {
    return registeredBinding.modelClassName;
  }
  if (
    shouldUseAssociationTitleTextDisplay({
      containerUse,
      fieldInterface,
    })
  ) {
    return 'DisplayTextFieldModel';
  }
  switch (normalizeFieldContainerUse(containerUse)) {
    case 'filter-form':
      return inferFilterFieldUse(fieldInterface);
    case 'form':
      return inferEditableFieldUse(fieldInterface);
    case 'details':
      return inferDisplayFieldUse(fieldInterface);
    case 'table':
      return inferDisplayFieldUse(fieldInterface);
    default:
      throw new FlowSurfaceBadRequestError(`flowSurfaces field container '${containerUse}' is not supported`);
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
      throw new FlowSurfaceBadRequestError(`flowSurfaces field renderer 'js' is not allowed under '${containerUse}'`);
    default:
      throw new FlowSurfaceBadRequestError(`flowSurfaces field container '${containerUse}' is not supported`);
  }
}

function resolveStandaloneFieldUse(input: { requestedType?: string; containerUse?: string }) {
  const requestedType = String(input.requestedType || '').trim();
  if (!requestedType) {
    return undefined;
  }
  if (requestedType === 'jsColumn') {
    if (normalizeFieldContainerUse(input.containerUse) !== 'table') {
      throw new FlowSurfaceBadRequestError(`flowSurfaces field type 'jsColumn' is only allowed under table containers`);
    }
    return 'JSColumnModel';
  }
  if (requestedType === 'jsItem') {
    if (normalizeFieldContainerUse(input.containerUse) !== 'form') {
      throw new FlowSurfaceBadRequestError(`flowSurfaces field type 'jsItem' is only allowed under form containers`);
    }
    return 'JSItemModel';
  }
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces field type '${requestedType}' is not a supported public capability`,
  );
}

export function resolveSupportedFieldCapability(input: {
  containerUse: string;
  field?: any;
  requestedFieldUse?: string;
  requestedWrapperUse?: string;
  allowUnresolvedFieldUse?: boolean;
  requestedRenderer?: string;
  requestedType?: string;
  enabledPackages?: ReadonlySet<string>;
  dataSourceKey?: string;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
}) {
  const requestedRenderer =
    typeof input.requestedRenderer === 'undefined' ? undefined : String(input.requestedRenderer || '').trim();
  if (typeof requestedRenderer !== 'undefined' && requestedRenderer !== 'js') {
    throw new FlowSurfaceBadRequestError(`flowSurfaces field renderer '${requestedRenderer}' is not supported`);
  }

  const standaloneUse = resolveStandaloneFieldUse({
    requestedType: input.requestedType,
    containerUse: input.containerUse,
  });
  if (standaloneUse) {
    if (input.requestedWrapperUse && input.requestedWrapperUse !== standaloneUse) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces field wrapper '${input.requestedWrapperUse}' is not allowed for field type '${input.requestedType}', expected '${standaloneUse}'`,
      );
    }
    if (input.requestedFieldUse && input.requestedFieldUse !== standaloneUse) {
      throw new FlowSurfaceBadRequestError(
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
    throw new FlowSurfaceBadRequestError(`flowSurfaces field container '${input.containerUse}' is not supported`);
  }

  if (input.requestedWrapperUse && input.requestedWrapperUse !== wrapperUse) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces field wrapper '${input.requestedWrapperUse}' is not allowed under '${input.containerUse}', expected '${wrapperUse}'`,
    );
  }

  const inferredFieldUse =
    requestedRenderer === 'js'
      ? inferJsFieldUseByContainer(input.containerUse)
      : input.field
        ? inferFieldUseByContainer(input.containerUse, input.field, {
            enabledPackages: input.enabledPackages,
            dataSourceKey: input.dataSourceKey,
            getCollection: input.getCollection,
          })
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
    throw new FlowSurfaceBadRequestError(`flowSurfaces field '${input.containerUse}' requires a supported fieldUse`);
  }

  if (
    input.requestedFieldUse &&
    inferredFieldUse &&
    input.requestedFieldUse !== inferredFieldUse &&
    KNOWN_FIELD_NODE_USES.has(input.requestedFieldUse)
  ) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces fieldUse '${input.requestedFieldUse}' does not match inferred fieldUse '${inferredFieldUse}' under '${input.containerUse}'`,
    );
  }

  const allowedFieldUses = getAllowedFieldUseSet(input.containerUse, input.enabledPackages);
  if (!allowedFieldUses?.has(fieldUse)) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces fieldUse '${fieldUse}' is not allowed under '${input.containerUse}'`,
    );
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

function getContainerScopedActionCatalogItems(
  items: FlowSurfaceCatalogItem[],
  containerUse?: string,
  options: {
    allowUnknownContainer?: boolean;
    context: string;
  } = {
    context: 'resolveAction',
  },
) {
  if (!containerUse) {
    return items;
  }
  const containerScope = getActionContainerScope(containerUse);
  if (!containerScope) {
    if (options.allowUnknownContainer) {
      return [];
    }
    assertKnownActionContainerUse({
      containerUse,
      context: options.context,
    });
    return [];
  }
  return items.filter((item) => item.scope === containerScope && isActionAllowedInContainer(item, containerUse));
}

function toPublicActionCatalogItem(item: FlowSurfaceCatalogItem): FlowSurfaceCatalogItem {
  return item;
}

function dedupeActionCatalogItems(
  items: FlowSurfaceCatalogItem[],
  dedupeBy: (item: FlowSurfaceCatalogItem) => string,
): FlowSurfaceCatalogItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = dedupeBy(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function getAvailableActionCatalogItems(
  containerUse?: string,
  scope?: FlowSurfaceActionScope,
  enabledPackages?: ReadonlySet<string>,
) {
  const visible = getContainerScopedActionCatalogItems(actionCatalog, containerUse, {
    allowUnknownContainer: true,
    context: 'catalog',
  });
  const scoped = scope ? visible.filter((item) => item.scope === scope) : visible;
  const normalized = scoped.map((item) => toPublicActionCatalogItem(item));
  return dedupeActionCatalogItems(
    filterAvailableCatalogItems(normalized, enabledPackages),
    containerUse ? (item) => `${item.key}:${item.use}` : (item) => `${item.key}:${item.scope || ''}:${item.use}`,
  );
}

const COLLECTION_RESOURCE_REQUIRED = new Set([
  'TableBlockModel',
  'CreateFormModel',
  'EditFormModel',
  'FormBlockModel',
  'DetailsBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
]);

const PUBLIC_BLOCK_SUPPORT_MATRIX = FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.filter((entry) => entry.topLevelAddable);

export const blockCatalog: FlowSurfaceCatalogItem[] = PUBLIC_BLOCK_SUPPORT_MATRIX.map((entry) =>
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

const actionRegistry: FlowSurfaceActionRegistryItem[] = [
  {
    publicKey: 'filter',
    label: 'Filter',
    scope: 'block',
    scene: 'collection',
    use: 'FilterActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'addNew',
    label: 'Add new',
    scope: 'block',
    scene: 'collection',
    use: 'AddNewActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'popup',
    label: 'Popup',
    scope: 'block',
    scene: 'collection',
    use: 'PopupCollectionActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'refresh',
    label: 'Refresh',
    scope: 'block',
    scene: 'collection',
    use: 'RefreshActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'expandCollapse',
    label: 'Expand/Collapse',
    scope: 'block',
    scene: 'collection',
    use: 'ExpandCollapseActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'bulkDelete',
    label: 'Bulk delete',
    scope: 'block',
    scene: 'collection',
    use: 'BulkDeleteActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'bulkEdit',
    label: 'Bulk edit',
    scope: 'block',
    scene: 'collection',
    use: 'BulkEditActionModel',
    ownerPlugin: '@nocobase/plugin-action-bulk-edit',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'bulkUpdate',
    label: 'Bulk update',
    scope: 'block',
    scene: 'collection',
    use: 'BulkUpdateActionModel',
    ownerPlugin: '@nocobase/plugin-action-bulk-update',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'export',
    label: 'Export',
    scope: 'block',
    scene: 'collection',
    use: 'ExportActionModel',
    ownerPlugin: '@nocobase/plugin-action-export',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'exportAttachments',
    label: 'Export attachments',
    scope: 'block',
    scene: 'collection',
    use: 'ExportAttachmentActionModel',
    ownerPlugin: '@nocobase/plugin-action-export',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'import',
    label: 'Import',
    scope: 'block',
    scene: 'collection',
    use: 'ImportActionModel',
    ownerPlugin: '@nocobase/plugin-action-import',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'link',
    label: 'Link',
    scope: 'block',
    scene: 'collection',
    use: 'LinkActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'upload',
    label: 'Upload',
    scope: 'block',
    scene: 'collection',
    use: 'UploadActionModel',
    ownerPlugin: '@nocobase/plugin-file-manager',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'js',
    label: 'JS action',
    scope: 'block',
    scene: 'collection',
    use: 'JSCollectionActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'composeEmail',
    label: 'Compose email',
    scope: 'block',
    scene: 'collection',
    use: 'MailSendActionModel',
    ownerPlugin: '@nocobase/plugin-email-manager',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'templatePrint',
    label: 'Template print',
    scope: 'block',
    scene: 'collection',
    use: 'TemplatePrintCollectionActionModel',
    ownerPlugin: '@nocobase/plugin-action-template-print',
    allowedContainerUses: TABLE_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'triggerWorkflow',
    label: 'Trigger workflow',
    scope: 'block',
    scene: 'collection',
    use: 'CollectionTriggerWorkflowActionModel',
    ownerPlugin: '@nocobase/plugin-workflow-custom-action-trigger',
    allowedContainerUses: COLLECTION_BLOCK_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'duplicate',
    label: 'Duplicate',
    scope: 'record',
    scene: 'record',
    use: 'DuplicateActionModel',
    ownerPlugin: '@nocobase/plugin-action-duplicate',
    allowedContainerUses: TABLE_ROW_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'addChild',
    label: 'Add child',
    scope: 'record',
    scene: 'record',
    use: 'AddChildActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: TABLE_ROW_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'view',
    label: 'View',
    scope: 'record',
    scene: 'record',
    use: 'ViewActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'edit',
    label: 'Edit',
    scope: 'record',
    scene: 'record',
    use: 'EditActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'popup',
    label: 'Popup',
    scope: 'record',
    scene: 'record',
    use: 'PopupCollectionActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'composeEmail',
    label: 'Compose email',
    scope: 'record',
    scene: 'record',
    use: 'MailSendActionModel',
    ownerPlugin: '@nocobase/plugin-email-manager',
    allowedContainerUses: [...TABLE_ROW_ACTION_CONTAINER_USES, ...DETAILS_ACTION_CONTAINER_USES],
    createSupported: true,
  },
  {
    publicKey: 'delete',
    label: 'Delete',
    scope: 'record',
    scene: 'record',
    use: 'DeleteActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'updateRecord',
    label: 'Update record',
    scope: 'record',
    scene: 'record',
    use: 'UpdateRecordActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'js',
    label: 'JS action',
    scope: 'record',
    scene: 'record',
    use: 'JSRecordActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'templatePrint',
    label: 'Template print',
    scope: 'record',
    scene: 'record',
    use: 'TemplatePrintRecordActionModel',
    ownerPlugin: '@nocobase/plugin-action-template-print',
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'triggerWorkflow',
    label: 'Trigger workflow',
    scope: 'record',
    scene: 'record',
    use: 'RecordTriggerWorkflowActionModel',
    ownerPlugin: '@nocobase/plugin-workflow-custom-action-trigger',
    allowedContainerUses: RECORD_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'submit',
    label: 'Submit',
    scope: 'form',
    scene: 'form',
    use: 'FormSubmitActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'js',
    label: 'JS action',
    scope: 'form',
    scene: 'form',
    use: 'JSFormActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'jsItem',
    label: 'JS item',
    scope: 'form',
    scene: 'form',
    use: 'JSItemActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'triggerWorkflow',
    label: 'Trigger workflow',
    scope: 'form',
    scene: 'form',
    use: 'FormTriggerWorkflowActionModel',
    ownerPlugin: '@nocobase/plugin-workflow-custom-action-trigger',
    allowedContainerUses: FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'submit',
    label: 'Submit',
    scope: 'filterForm',
    scene: 'form',
    use: 'FilterFormSubmitActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'reset',
    label: 'Reset',
    scope: 'filterForm',
    scene: 'form',
    use: 'FilterFormResetActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'collapse',
    label: 'Collapse',
    scope: 'filterForm',
    scene: 'form',
    use: 'FilterFormCollapseActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'js',
    label: 'JS action',
    scope: 'filterForm',
    scene: 'form',
    use: 'FilterFormJSActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: FILTER_FORM_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'js',
    label: 'JS action',
    scope: 'actionPanel',
    scene: 'all',
    use: 'JSActionModel',
    ownerPlugin: CORE_FLOW_SURFACE_OWNER_PLUGIN,
    allowedContainerUses: ACTION_PANEL_ACTION_CONTAINER_USES,
    createSupported: true,
  },
  {
    publicKey: 'triggerWorkflow',
    label: 'Trigger workflow',
    scope: 'actionPanel',
    scene: 'all',
    use: 'WorkbenchTriggerWorkflowActionModel',
    ownerPlugin: '@nocobase/plugin-workflow-custom-action-trigger',
    allowedContainerUses: ACTION_PANEL_ACTION_CONTAINER_USES,
    createSupported: true,
  },
];
const FLOW_SURFACE_ACTION_OWNER_PLUGIN_BY_USE = actionRegistry.reduce((map, item) => {
  if (!map.has(item.use)) {
    map.set(item.use, item.ownerPlugin);
  }
  return map;
}, new Map<string, string>());

function throwCatalogInvariant(message: string): never {
  throw new FlowSurfaceInternalError(message, 'FLOW_SURFACE_INTERNAL_INVARIANT');
}

function validateActionRegistryItem(item: FlowSurfaceActionRegistryItem) {
  if (!item.ownerPlugin.trim()) {
    throwCatalogInvariant(`flowSurfaces action registry '${item.publicKey}' must declare ownerPlugin`);
  }
  if (!item.allowedContainerUses.length) {
    throwCatalogInvariant(`flowSurfaces action registry '${item.publicKey}' must declare allowedContainerUses`);
  }
  if (!nodeContracts.has(item.use)) {
    throwCatalogInvariant(`flowSurfaces action registry '${item.publicKey}' references unsupported use '${item.use}'`);
  }
  item.allowedContainerUses.forEach((containerUse) =>
    assertActionScopeMatchesContainer({
      actionScope: item.scope,
      containerUse,
      context: `action registry '${item.publicKey}'`,
    }),
  );
}

actionRegistry.forEach((item) => validateActionRegistryItem(item));

function makeActionCatalogItem(item: FlowSurfaceActionRegistryItem): FlowSurfaceCatalogItem {
  return makeCatalogItem({
    key: item.publicKey,
    label: item.label,
    kind: 'action',
    scope: item.scope,
    scene: item.scene,
    use: item.use,
    allowedContainerUses: item.allowedContainerUses,
    createSupported: item.createSupported,
  });
}

export const actionCatalog: FlowSurfaceCatalogItem[] = actionRegistry.map((item) => makeActionCatalogItem(item));
export const ACTION_PUBLIC_KEYS = dedupeActionCatalogItems(actionCatalog, (item) => item.key).map((item) => item.key);

export const SERVICE_SUPPORTED_FLOW_SURFACE_BLOCK_KEYS = PUBLIC_BLOCK_SUPPORT_MATRIX.filter(
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
export const ACTION_CATALOG_BY_USE = actionCatalog.reduce((map, item) => {
  const entries = map.get(item.use) || [];
  entries.push(item);
  map.set(item.use, entries);
  return map;
}, new Map<string, FlowSurfaceCatalogItem[]>());
export const BLOCK_KEY_BY_USE = new Map(FLOW_SURFACE_BLOCK_SUPPORT_MATRIX.map((item) => [item.modelUse, item.key]));
export const ACTION_KEY_BY_USE = new Map(actionCatalog.map((item) => [item.use, toPublicActionCatalogItem(item).key]));

function getCatalogItemOwnerPlugin(item: Pick<FlowSurfaceCatalogItem, 'kind' | 'use'>) {
  if (item.kind === 'block') {
    return FLOW_SURFACE_BLOCK_OWNER_PLUGIN_BY_USE.get(item.use);
  }
  if (item.kind === 'action') {
    return FLOW_SURFACE_ACTION_OWNER_PLUGIN_BY_USE.get(item.use);
  }
  return undefined;
}

function isAlwaysAvailableCatalogOwnerPlugin(ownerPlugin?: string) {
  return !ownerPlugin || ownerPlugin === CORE_FLOW_SURFACE_OWNER_PLUGIN;
}

function throwUnavailableCatalogItem(
  item: Pick<FlowSurfaceCatalogItem, 'kind' | 'key' | 'use'>,
  options: {
    context: string;
    requestedType?: string;
    requestedUse?: string;
  },
): never {
  const requested =
    String(options.requestedType || '').trim() ||
    String(options.requestedUse || '').trim() ||
    String(item.key || '').trim() ||
    String(item.use || '').trim();
  const ownerPlugin = getCatalogItemOwnerPlugin(item);
  const reason =
    ownerPlugin && !isAlwaysAvailableCatalogOwnerPlugin(ownerPlugin)
      ? ` because plugin '${ownerPlugin}' is not enabled`
      : '';
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces ${options.context} ${item.kind} '${requested}' is not available in the current app instance${reason}`,
  );
}

export function isCatalogItemAvailable(
  item: Pick<FlowSurfaceCatalogItem, 'kind' | 'use'>,
  enabledPackages?: ReadonlySet<string>,
) {
  if (!enabledPackages) {
    return true;
  }
  const ownerPlugin = getCatalogItemOwnerPlugin(item);
  return isAlwaysAvailableCatalogOwnerPlugin(ownerPlugin) || (ownerPlugin ? enabledPackages.has(ownerPlugin) : false);
}

export function filterAvailableCatalogItems<T extends Pick<FlowSurfaceCatalogItem, 'kind' | 'use'>>(
  items: T[],
  enabledPackages?: ReadonlySet<string>,
) {
  if (!enabledPackages) {
    return [...items];
  }
  return items.filter((item) => isCatalogItemAvailable(item, enabledPackages));
}

function normalizeActionCatalogKey(type?: string) {
  return String(type || '').trim();
}

export function resolveSupportedBlockCatalogItem(
  input: {
    type?: string;
    use?: string;
  },
  options: {
    context?: string;
    enabledPackages?: ReadonlySet<string>;
    requireCreateSupported?: boolean;
  } = {},
) {
  const item =
    (input.type ? BLOCK_CATALOG_BY_KEY.get(String(input.type).trim()) : undefined) ||
    (input.use ? BLOCK_CATALOG_BY_USE.get(String(input.use).trim()) : undefined);

  if (!item) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces addBlock only supports registered block types/uses`);
  }
  if (!isCatalogItemAvailable(item, options.enabledPackages)) {
    throwUnavailableCatalogItem(item, {
      context: options.context || 'addBlock',
      requestedType: input.type,
      requestedUse: input.use,
    });
  }
  if (options.requireCreateSupported && item.createSupported === false) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces addBlock does not support creating '${item.key}' yet`);
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
    context?: string;
    enabledPackages?: ReadonlySet<string>;
    requireCreateSupported?: boolean;
  } = {},
) {
  const requestedType = String(input.type || '').trim();
  const normalizedUse = String(input.use || '').trim();
  let item: FlowSurfaceCatalogItem | undefined;
  if (input.containerUse) {
    assertKnownActionContainerUse({
      containerUse: input.containerUse,
      context: 'resolveAction',
    });
  }

  if (normalizedUse) {
    const useCandidates = ACTION_CATALOG_BY_USE.get(normalizedUse) || [];
    const availableUseCandidates = filterAvailableCatalogItems(useCandidates, options.enabledPackages);
    const matchedAll = getContainerScopedActionCatalogItems(useCandidates, input.containerUse);
    const matched = getContainerScopedActionCatalogItems(availableUseCandidates, input.containerUse);
    if (useCandidates.length && input.containerUse && !matchedAll.length) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces addAction '${normalizedUse}' is not allowed under '${input.containerUse}'`,
      );
    }
    if ((matchedAll.length || useCandidates.length) && !matched.length && !availableUseCandidates.length) {
      throwUnavailableCatalogItem(useCandidates[0], {
        context: options.context || 'addAction',
        requestedUse: normalizedUse,
      });
    }
    if (matchedAll.length && !matched.length) {
      throwUnavailableCatalogItem(matchedAll[0], {
        context: options.context || 'addAction',
        requestedUse: normalizedUse,
      });
    }
    if (matched.length > 1 && !input.containerUse) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces addAction use '${normalizedUse}' requires containerUse to resolve a public action capability`,
      );
    }
    item = matched[0];
  }

  if (!item && requestedType) {
    const normalizedType = normalizeActionCatalogKey(input.type);
    const candidates = (normalizedType ? ACTION_CATALOG_BY_KEY.get(normalizedType) : undefined) || [];
    const availableCandidates = filterAvailableCatalogItems(candidates, options.enabledPackages);
    const matchedAll = getContainerScopedActionCatalogItems(candidates, input.containerUse);
    const matched = getContainerScopedActionCatalogItems(availableCandidates, input.containerUse);
    if (candidates.length && input.containerUse && !matchedAll.length) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces addAction '${requestedType}' is not allowed under '${input.containerUse}'`,
      );
    }
    if ((matchedAll.length || candidates.length) && !matched.length && !availableCandidates.length) {
      throwUnavailableCatalogItem(candidates[0], {
        context: options.context || 'addAction',
        requestedType,
      });
    }
    if (matchedAll.length && !matched.length) {
      throwUnavailableCatalogItem(matchedAll[0], {
        context: options.context || 'addAction',
        requestedType,
      });
    }
    if (matched.length > 1 && !input.containerUse) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces addAction type '${requestedType}' requires containerUse to resolve a public action capability`,
      );
    }
    item = matched[0];
  }

  if (!item) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces addAction only supports registered action types/uses`);
  }
  if (!isCatalogItemAvailable(item, options.enabledPackages)) {
    throwUnavailableCatalogItem(item, {
      context: options.context || 'addAction',
      requestedType: input.type,
      requestedUse: input.use,
    });
  }
  if (requestedType) {
    const publicKey = toPublicActionCatalogItem(item).key;
    if (requestedType !== publicKey) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces addAction only supports public action type '${publicKey}' under '${
          input.containerUse || 'unknown'
        }'`,
      );
    }
  }
  if (input.containerUse && !isActionAllowedInContainer(item, input.containerUse)) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces addAction '${toPublicActionCatalogItem(item).key}' is not allowed under '${input.containerUse}'`,
    );
  }
  if (options.requireCreateSupported && item.createSupported === false) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces addAction does not support creating '${item.key}' yet`);
  }
  return item;
}

export function getNodeContract(use?: string): FlowSurfaceNodeContract {
  if (use) {
    const contract = nodeContracts.get(use);
    if (contract) {
      return contract;
    }
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
