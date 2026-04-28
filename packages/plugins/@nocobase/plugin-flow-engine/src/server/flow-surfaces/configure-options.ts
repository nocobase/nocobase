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
  FlowSurfaceConfigureOption,
  FlowSurfaceConfigureOptions,
  FlowSurfaceContainerKind,
} from './types';
import { normalizeApprovalSemanticUse } from './approval';
import { FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES } from './field-type-resolver';

const stringOption = (
  description?: string,
  extra: Partial<FlowSurfaceConfigureOption> = {},
): FlowSurfaceConfigureOption => ({
  type: 'string',
  ...(description ? { description } : {}),
  ...extra,
});

const numberOption = (
  description?: string,
  extra: Partial<FlowSurfaceConfigureOption> = {},
): FlowSurfaceConfigureOption => ({
  type: 'number',
  ...(description ? { description } : {}),
  ...extra,
});

const booleanOption = (
  description?: string,
  extra: Partial<FlowSurfaceConfigureOption> = {},
): FlowSurfaceConfigureOption => ({
  type: 'boolean',
  ...(description ? { description } : {}),
  ...extra,
});

const objectOption = (
  description?: string,
  extra: Partial<FlowSurfaceConfigureOption> = {},
): FlowSurfaceConfigureOption => ({
  type: 'object',
  ...(description ? { description } : {}),
  ...extra,
});

const arrayOption = (
  description?: string,
  extra: Partial<FlowSurfaceConfigureOption> = {},
): FlowSurfaceConfigureOption => ({
  type: 'array',
  ...(description ? { description } : {}),
  ...extra,
});

const COMMON_RESOURCE = objectOption('Resource binding', {
  example: {
    dataSourceKey: 'main',
    collectionName: 'users',
  },
});

const FILTER_GROUP = objectOption('FilterGroup shape. Use null or {} for an empty filter.', {
  example: {
    logic: '$and',
    items: [],
  },
});

const SORTING = arrayOption('Sorting rule array', {
  example: [
    {
      field: 'createdAt',
      direction: 'desc',
    },
  ],
});

const CONNECT_FIELDS = objectOption('Tree connect data block targets', {
  example: {
    targets: [
      {
        targetId: 'target-block-uid',
        filterPaths: ['id'],
      },
    ],
  },
});

const OPEN_VIEW = objectOption('Popup or drawer open configuration', {
  example: {
    dataSourceKey: 'main',
    collectionName: 'roles',
    mode: 'drawer',
  },
});

const DISPLAY_STYLE = stringOption('Display style', {
  enum: ['text', 'tag'],
  example: 'tag',
});

const FIELD_TYPE = stringOption('Public relation field presentation type', {
  enum: [...FLOW_SURFACE_PUBLIC_RELATION_FIELD_TYPES],
  example: 'popupSubTable',
});

const RELATION_FIELDS = arrayOption('Relation target fields', {
  example: ['title', 'name'],
});

const SELECTOR_FIELDS = arrayOption('Record picker selector fields', {
  example: ['title', 'code'],
});

const RELATION_FIELD_TYPE_OPTIONS: FlowSurfaceConfigureOptions = {
  fieldType: FIELD_TYPE,
  fields: RELATION_FIELDS,
  selectorFields: SELECTOR_FIELDS,
  openMode: stringOption('Popup open mode', { example: 'drawer' }),
  popupSize: stringOption('Popup size', { example: 'medium' }),
  pageSize: numberOption('Page size', { example: 10 }),
  showIndex: booleanOption('Whether to show index', { example: true }),
};

const CONFIRM = objectOption('Confirmation dialog configuration. You can also pass a boolean directly.', {
  example: {
    enable: true,
    title: 'Confirm action',
    content: 'Do you want to continue?',
  },
});

const JS_CODE = stringOption('JS code', {
  example: 'return value?.toUpperCase?.() || value;',
});

const JS_VERSION = stringOption('JS code version', {
  example: 'v2',
});

const COMMON_BLOCK_HEADER_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Title', { example: 'User Table' }),
  description: stringOption('Description', { example: 'Team directory and summary' }),
};

const FILTER_FORM_HEADER_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Title', { example: 'User filters' }),
  displayTitle: booleanOption('Whether to display the title', { example: true }),
};

const COMMON_HEIGHT_OPTIONS: FlowSurfaceConfigureOptions = {
  height: numberOption('Height', { example: 520 }),
  heightMode: stringOption('Height mode', {
    enum: ['defaultHeight', 'specifyValue', 'fullHeight'],
    example: 'specifyValue',
  }),
};

const PAGE_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Page title', { example: 'User Workspace' }),
  documentTitle: stringOption('Browser document title', { example: 'User Workspace' }),
  displayTitle: booleanOption('Whether to display the page title', { example: true }),
  enableTabs: booleanOption('Whether to enable top-level tabs', { example: true }),
  icon: stringOption('Icon', { example: 'UserOutlined' }),
  enableHeader: booleanOption('Whether to display the page header', { example: true }),
};

const TAB_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Tab title', { example: 'Overview' }),
  icon: stringOption('Icon', { example: 'TableOutlined' }),
  documentTitle: stringOption('Browser document title', { example: 'User Overview' }),
};

const TABLE_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  pageSize: numberOption('Page size', { example: 20 }),
  density: stringOption('Table density', { enum: ['large', 'middle', 'small'], example: 'middle' }),
  showRowNumbers: booleanOption('Whether to display row numbers', { example: true }),
  sorting: SORTING,
  dataScope: FILTER_GROUP,
  quickEdit: booleanOption('Whether to enable quick edit', { example: true }),
  treeTable: booleanOption('Whether this is a tree table', { example: false }),
  defaultExpandAllRows: booleanOption('Whether to expand all tree nodes by default', { example: false }),
  dragSort: booleanOption('Whether to enable drag sorting', { example: false }),
  dragSortBy: stringOption('Drag-sort field', { example: 'sort' }),
};

const FORM_COMMON_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('Layout key', { example: 'vertical' }),
  labelAlign: stringOption('Label alignment', { example: 'left' }),
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  assignRules: objectOption(
    'Raw assignment-rules payload. For AI/CLI authoring, prefer `getReactionMeta` + `setFieldValueRules` or blueprint `reaction.items[]` instead of guessing this configure key directly.',
    { example: {} },
  ),
  colon: booleanOption('Whether to display a colon after the label', { example: true }),
};

const EDIT_FORM_OPTIONS: FlowSurfaceConfigureOptions = {
  ...FORM_COMMON_OPTIONS,
  dataScope: FILTER_GROUP,
};

const DETAILS_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('Layout key', { example: 'vertical' }),
  labelAlign: stringOption('Label alignment', { example: 'left' }),
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  colon: booleanOption('Whether to display a colon after the label', { example: true }),
  sorting: SORTING,
  dataScope: FILTER_GROUP,
  linkageRules: arrayOption(
    'Raw linkage-rules payload. For AI/CLI authoring, prefer `getReactionMeta` + `setFieldLinkageRules` instead of guessing this configure key directly.',
    { example: [] },
  ),
};

const FILTER_FORM_OPTIONS: FlowSurfaceConfigureOptions = {
  ...FILTER_FORM_HEADER_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('Layout key', { example: 'vertical' }),
  labelAlign: stringOption('Label alignment', { example: 'left' }),
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  defaultValues: objectOption('Default filter values', { example: { status: 'draft' } }),
};

const LIST_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  pageSize: numberOption('Page size', { example: 20 }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  layout: stringOption('List layout', { example: 'vertical' }),
};

const CALENDAR_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  titleField: stringOption('Calendar event title field', { example: 'title' }),
  colorField: stringOption('Calendar event color field', { example: 'status' }),
  startField: stringOption('Calendar event start field', { example: 'startAt' }),
  endField: stringOption('Calendar event end field', { example: 'endAt' }),
  defaultView: stringOption('Default calendar view', { enum: ['month', 'week', 'day'], example: 'month' }),
  quickCreateEvent: booleanOption('Whether slot quick-create is enabled', { example: true }),
  showLunar: booleanOption('Whether lunar labels are displayed', { example: false }),
  weekStart: numberOption('Week start day. Use 1 for Monday or 0 for Sunday.', { example: 1 }),
  dataScope: FILTER_GROUP,
  linkageRules: arrayOption(
    'Raw linkage-rules payload. For AI/CLI authoring, prefer `getReactionMeta` + `setBlockLinkageRules` instead of guessing this configure key directly.',
    { example: [] },
  ),
  quickCreatePopup: OPEN_VIEW,
  eventPopup: OPEN_VIEW,
};

const TREE_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  searchable: booleanOption('Whether search is enabled', { example: true }),
  defaultExpandAll: booleanOption('Whether all tree nodes are expanded by default', { example: false }),
  includeDescendants: booleanOption('Whether child nodes are included when filtering', { example: true }),
  titleField: stringOption('Tree node title field', { example: 'title' }),
  fieldNames: objectOption('Tree field names', { example: { title: 'title', key: 'id', children: 'children' } }),
  pageSize: numberOption('Root records per page', { example: 200 }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  connectFields: CONNECT_FIELDS,
};

const KANBAN_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  groupField: stringOption('Grouping field', { example: 'status' }),
  groupTitleField: stringOption('Association grouping title field', { example: 'title' }),
  groupColorField: stringOption('Association grouping color field', { example: 'color' }),
  groupOptions: arrayOption('Ordered kanban group options', {
    example: [
      { value: 'todo', label: 'To do', color: 'blue' },
      { value: 'done', label: 'Done', color: 'green' },
    ],
  }),
  styleVariant: stringOption('Kanban style variant', { enum: ['default', 'filled'], example: 'filled' }),
  sorting: SORTING,
  dragEnabled: booleanOption('Whether drag sorting is enabled', { example: true }),
  dragSortBy: stringOption('Drag-sort field', { example: 'status_sort' }),
  quickCreateEnabled: booleanOption('Whether per-column quick create is enabled', { example: true }),
  quickCreatePopup: OPEN_VIEW,
  enableCardClick: booleanOption('Whether cards can be clicked to open a popup', { example: true }),
  cardPopup: OPEN_VIEW,
  cardLayout: stringOption('Kanban card layout', { example: 'vertical' }),
  cardLabelAlign: stringOption('Kanban card label alignment', { example: 'left' }),
  cardLabelWidth: stringOption('Kanban card label width', { example: '120px' }),
  cardLabelWrap: booleanOption('Whether kanban card labels should wrap', { example: false }),
  cardColon: booleanOption('Whether kanban card labels display a colon', { example: true }),
  pageSize: numberOption('Page size', { example: 20 }),
  columnWidth: numberOption('Column width', { example: 300 }),
  dataScope: FILTER_GROUP,
};

const GRID_CARD_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  columns: objectOption('Column count. Pass a number or a full responsive object that includes xs/sm/md/lg/xl/xxl.', {
    example: {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 3,
      xxl: 4,
    },
  }),
  rowCount: numberOption('Items per row', { example: 3 }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  layout: stringOption('Card layout', { example: 'vertical' }),
};

const MARKDOWN_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  content: stringOption('Markdown content', { example: '# Team handbook' }),
};

const IFRAME_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  mode: stringOption('iframe mode', { example: 'url' }),
  url: stringOption('URL', { example: 'https://example.com/embed' }),
  html: stringOption('HTML content'),
  params: objectOption('URL parameters', { example: { id: '1' } }),
  allow: stringOption('allow attribute'),
  htmlId: stringOption('Embedded HTML node ID'),
};

const CHART_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  query: objectOption('Chart query DSL. Builder mode is recommended by default.', {
    example: {
      mode: 'builder',
      resource: {
        dataSourceKey: 'main',
        collectionName: 'employees',
      },
      measures: [
        {
          field: 'id',
          aggregation: 'count',
          alias: 'employeeCount',
        },
      ],
      dimensions: [{ field: 'department.title' }],
    },
  }),
  visual: objectOption('Chart visual DSL. Basic mode is recommended by default.', {
    example: {
      mode: 'basic',
      type: 'bar',
      mappings: {
        x: 'department.title',
        y: 'employeeCount',
      },
    },
  }),
  events: objectOption('Chart event DSL. Only raw JS code is exposed.', {
    example: {
      raw: 'chart.on("click", () => console.log("clicked"));',
    },
  }),
  configure: objectOption(
    'Chart configuration object. It is normalized by the same chart contract. Do not mix it with query/visual/events.',
    {
      example: {
        query: {
          mode: 'sql',
          sql: 'select department, count(*) as employeeCount from employees group by department',
          sqlDatasource: 'main',
        },
        chart: {
          option: {
            mode: 'basic',
            builder: {
              type: 'bar',
              xField: 'department',
              yField: 'employeeCount',
            },
          },
        },
      },
    },
  ),
};

const ACTION_PANEL_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  layout: stringOption('Layout key', { example: 'list' }),
  ellipsis: booleanOption('Whether to collapse overly long buttons', { example: false }),
};

const MAP_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  mapField: arrayOption('Map field path', { example: ['location'] }),
  marker: stringOption('Marker field', { example: 'name' }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  zoom: numberOption('Default zoom level', { example: 13 }),
};

const COMMENTS_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_HEADER_OPTIONS,
  resource: COMMON_RESOURCE,
  pageSize: numberOption('Page size', { example: 20 }),
  dataScope: FILTER_GROUP,
};

const JS_BLOCK_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Title', { example: 'Runtime Banner' }),
  description: stringOption('Description', { example: 'Custom JS block' }),
  className: stringOption('className', { example: 'users-banner' }),
  code: JS_CODE,
  version: JS_VERSION,
};

const ACTION_COLUMN_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Column title', { example: 'Actions' }),
  tooltip: stringOption('Column tooltip'),
  width: numberOption('Column width', { example: 220 }),
  fixed: stringOption('Fixed position', { example: 'right' }),
};

const TABLE_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Column title alias. It maps to title under table.', { example: 'Nickname' }),
  title: stringOption('Column title', { example: 'Nickname' }),
  tooltip: stringOption('Tooltip'),
  width: numberOption('Column width', { example: 240 }),
  fixed: stringOption('Fixed position', { example: 'left' }),
  sorter: booleanOption('Whether sortable', { example: true }),
  fieldPath: stringOption('Field path', { example: 'nickname' }),
  associationPathName: stringOption('Association path', { example: 'roles' }),
  editable: booleanOption('Whether editable', { example: false }),
  dataIndex: stringOption('Data index'),
  titleField: stringOption('Association display title field', { example: 'title' }),
  ...RELATION_FIELD_TYPE_OPTIONS,
  clickToOpen: booleanOption('Whether clicking can open details', { example: true }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const DETAILS_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Label', { example: 'Nickname' }),
  tooltip: stringOption('Tooltip'),
  extra: stringOption('Extra text'),
  showLabel: booleanOption('Whether to show the label', { example: true }),
  fieldPath: stringOption('Field path', { example: 'nickname' }),
  associationPathName: stringOption('Association path', { example: 'roles' }),
  disabled: booleanOption('Whether disabled', { example: false }),
  pattern: stringOption('Display mode'),
  titleField: stringOption('Association display title field', { example: 'title' }),
  ...RELATION_FIELD_TYPE_OPTIONS,
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  clickToOpen: booleanOption('Whether clicking can open details', { example: true }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FILTER_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Label', { example: 'Nickname' }),
  tooltip: stringOption('Tooltip'),
  extra: stringOption('Extra text'),
  showLabel: booleanOption('Whether to show the label', { example: true }),
  fieldPath: stringOption('Field path', { example: 'nickname' }),
  associationPathName: stringOption('Association path', { example: 'department' }),
  initialValue: objectOption('Initial value'),
  multiple: booleanOption('Whether multiple selection is enabled', { example: false }),
  allowMultiple: booleanOption('Whether multiple selection is allowed', { example: false }),
  maxCount: numberOption('Maximum count', { example: 5 }),
  name: stringOption('Field name override'),
  ...RELATION_FIELD_TYPE_OPTIONS,
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  clickToOpen: booleanOption('Whether clicking can open details', { example: false }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FORM_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Label', { example: 'Nickname' }),
  tooltip: stringOption('Tooltip'),
  extra: stringOption('Extra text'),
  showLabel: booleanOption('Whether to show the label', { example: true }),
  fieldPath: stringOption('Field path', { example: 'nickname' }),
  associationPathName: stringOption('Association path', { example: 'department' }),
  initialValue: objectOption('Initial value'),
  required: booleanOption('Whether required', { example: false }),
  disabled: booleanOption('Whether disabled', { example: false }),
  multiple: booleanOption('Whether multiple selection is enabled', { example: false }),
  allowMultiple: booleanOption('Whether multiple selection is allowed', { example: false }),
  maxCount: numberOption('Maximum count', { example: 5 }),
  pattern: stringOption('Input mode'),
  titleField: stringOption('Association display title field', { example: 'title' }),
  name: stringOption('Field name override'),
  ...RELATION_FIELD_TYPE_OPTIONS,
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  clickToOpen: booleanOption('Whether clicking can open details', { example: false }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FIELD_NODE_OPTIONS: FlowSurfaceConfigureOptions = {
  fieldPath: stringOption('Field path', { example: 'nickname' }),
  associationPathName: stringOption('Association path', { example: 'roles' }),
  titleField: stringOption('Association display title field', { example: 'title' }),
  clickToOpen: booleanOption('Whether clicking can open details', { example: true }),
  openView: OPEN_VIEW,
  title: stringOption('Title'),
  icon: stringOption('Icon'),
  autoSize: booleanOption('Whether to size automatically', { example: true }),
  allowClear: booleanOption('Whether clearing is allowed', { example: true }),
  multiple: booleanOption('Whether multiple selection is enabled', { example: false }),
  allowMultiple: booleanOption('Whether multiple selection is allowed', { example: false }),
  quickCreate: booleanOption('Whether quick create is allowed', { example: false }),
  displayStyle: DISPLAY_STYLE,
  options: objectOption('Component options'),
};

const JS_FIELD_NODE_OPTIONS: FlowSurfaceConfigureOptions = {
  ...FIELD_NODE_OPTIONS,
  code: JS_CODE,
  version: JS_VERSION,
};

const JS_COLUMN_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Column title', { example: 'Runtime Column' }),
  tooltip: stringOption('Tooltip'),
  width: numberOption('Column width', { example: 240 }),
  fixed: stringOption('Fixed position', { example: 'right' }),
  code: JS_CODE,
  version: JS_VERSION,
};

const JS_ITEM_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Label', { example: 'Runtime Item' }),
  tooltip: stringOption('Tooltip'),
  extra: stringOption('Extra text'),
  showLabel: booleanOption('Whether to show the label', { example: true }),
  labelWidth: stringOption('Label width', { example: '120px' }),
  labelWrap: booleanOption('Whether labels should wrap', { example: false }),
  code: JS_CODE,
  version: JS_VERSION,
};

const DIVIDER_ITEM_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('Divider label', { example: 'Basic information' }),
  orientation: stringOption('Label position', { example: 'left' }),
  dashed: booleanOption('Whether the divider is dashed', { example: false }),
  color: stringOption('Label color'),
  borderColor: stringOption('Divider line color'),
};

const ACTION_COMMON_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Button title', { example: 'Run' }),
  tooltip: stringOption('Tooltip'),
  icon: stringOption('Icon', { example: 'PlusOutlined' }),
  type: stringOption('Button type', { example: 'primary' }),
  color: stringOption('Color'),
  htmlType: stringOption('HTML button type', { example: 'submit' }),
  position: stringOption('Position'),
  danger: booleanOption('Whether this is a danger button', { example: false }),
};

const ACTION_OPEN_VIEW_OPTIONS: FlowSurfaceConfigureOptions = {
  openView: OPEN_VIEW,
};

const ACTION_CONFIRM_OPTIONS: FlowSurfaceConfigureOptions = {
  confirm: CONFIRM,
};

const ACTION_ASSIGN_OPTIONS: FlowSurfaceConfigureOptions = {
  assignValues: objectOption('Bulk or single-record assigned values', { example: { status: 'published' } }),
  updateMode: stringOption('Update mode', { example: 'overwrite' }),
};

const APPROVAL_ASSIGN_ACTION_OPTIONS: FlowSurfaceConfigureOptions = {
  assignValues: objectOption('Assigned values persisted with the approval action payload', {
    example: { department: 'finance' },
  }),
};

const ACTION_LINKAGE_OPTIONS: FlowSurfaceConfigureOptions = {
  linkageRules: arrayOption(
    'Raw linkage-rules payload. For AI/CLI authoring, prefer `getReactionMeta` + `setActionLinkageRules` instead of guessing this configure key directly.',
    { example: [] },
  ),
};

const FILTER_ACTION_OPTIONS: FlowSurfaceConfigureOptions = {
  filterableFieldNames: arrayOption('Allowed filter field name list', {
    example: ['username', 'email', 'roles'],
  }),
  defaultFilter: FILTER_GROUP,
};

const ACTION_JS_OPTIONS: FlowSurfaceConfigureOptions = {
  code: JS_CODE,
  version: JS_VERSION,
};

const APPROVAL_RETURN_ACTION_OPTIONS: FlowSurfaceConfigureOptions = {
  approvalReturn: objectOption('Approval return-node settings', {
    example: {
      type: 'specific',
      target: 'approval-node-key',
    },
  }),
};

const APPROVAL_COMMENT_ACTION_OPTIONS: FlowSurfaceConfigureOptions = {
  commentFormUid: stringOption('Comment form model uid', {
    example: 'comment-form-uid',
  }),
};

const APPROVAL_REASSIGN_ACTION_OPTIONS: FlowSurfaceConfigureOptions = {
  assigneesScope: objectOption('Approval reassignee scope', {
    example: {
      assignees: [1, '{{$context.user.id}}'],
      extraFieldKey: 'departmentId',
    },
  }),
};

const ACTION_EDIT_MODE_OPTIONS: FlowSurfaceConfigureOptions = {
  editMode: stringOption('Bulk edit mode', { example: 'drawer' }),
};

const ACTION_DUPLICATE_MODE_OPTIONS: FlowSurfaceConfigureOptions = {
  duplicateMode: stringOption('Duplicate mode', { example: 'popup' }),
};

const ACTION_COLLAPSE_OPTIONS: FlowSurfaceConfigureOptions = {
  collapsedRows: numberOption('Default collapsed row count', { example: 2 }),
  defaultCollapsed: booleanOption('Whether collapsed by default', { example: true }),
};

const ACTION_EMAIL_OPTIONS: FlowSurfaceConfigureOptions = {
  emailFieldNames: arrayOption('Email field name list', { example: ['email'] }),
  defaultSelectAllRecords: booleanOption('Whether all records are selected by default', { example: false }),
};

const CALENDAR_ACTION_POSITION_OPTIONS: FlowSurfaceConfigureOptions = {
  position: stringOption('Position', { enum: ['left', 'right'], example: 'left' }),
};

const GLOBAL_FLOW_CONTEXT_OPTION_KEYS = new Set([
  'assignRules',
  'confirm',
  'dataScope',
  'defaultFilter',
  'defaultValues',
  'initialValue',
  'linkageRules',
  'assignValues',
  'assigneesScope',
]);

const FLOW_CONTEXT_OPTION_KEYS_BY_USE: Record<string, string[]> = {
  RootPageModel: ['documentTitle'],
  RootPageTabModel: ['documentTitle'],
  TriggerChildPageModel: ['documentTitle'],
  ApprovalChildPageModel: ['documentTitle'],
  TriggerChildPageTabModel: ['documentTitle'],
  ApprovalChildPageTabModel: ['documentTitle'],
};

function cloneOptions(options: FlowSurfaceConfigureOptions): FlowSurfaceConfigureOptions {
  return Object.fromEntries(Object.entries(options).map(([key, value]) => [key, { ...value }]));
}

function mergeOptions(...groups: FlowSurfaceConfigureOptions[]): FlowSurfaceConfigureOptions {
  return Object.assign({}, ...groups.map((group) => cloneOptions(group)));
}

function annotateFlowContextSupport(use: string | undefined, options: FlowSurfaceConfigureOptions) {
  const keys = new Set<string>([
    ...GLOBAL_FLOW_CONTEXT_OPTION_KEYS,
    ...(FLOW_CONTEXT_OPTION_KEYS_BY_USE[String(use || '').trim()] || []),
  ]);
  for (const key of keys) {
    if (options[key]) {
      options[key] = {
        ...options[key],
        supportsFlowContext: true,
      };
    }
  }
  return options;
}

function isGenericFieldNodeUse(use?: string) {
  const normalized = String(use || '').trim();
  return !!normalized && normalized.endsWith('FieldModel');
}

function getActionConfigureOptionsByUse(use?: string): FlowSurfaceConfigureOptions {
  const normalized = String(use || '').trim();
  if (!normalized) {
    return {};
  }

  const base = [ACTION_COMMON_OPTIONS];
  const merged = (...extra: FlowSurfaceConfigureOptions[]) => mergeOptions(...base, ...extra);

  switch (normalized) {
    case 'CalendarTodayActionModel':
      return merged(CALENDAR_ACTION_POSITION_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'CalendarNavActionModel':
    case 'CalendarTitleActionModel':
    case 'CalendarViewSelectActionModel':
      return mergeOptions(CALENDAR_ACTION_POSITION_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'AddNewActionModel':
    case 'ViewActionModel':
    case 'EditActionModel':
    case 'PopupCollectionActionModel':
    case 'UploadActionModel':
      return merged(ACTION_OPEN_VIEW_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'DeleteActionModel':
    case 'BulkDeleteActionModel':
      return merged(ACTION_CONFIRM_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'FormSubmitActionModel':
      return merged(ACTION_CONFIRM_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'UpdateRecordActionModel':
    case 'BulkUpdateActionModel':
      return merged(ACTION_CONFIRM_OPTIONS, ACTION_ASSIGN_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'BulkEditActionModel':
      return merged(ACTION_EDIT_MODE_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'DuplicateActionModel':
      return merged(ACTION_OPEN_VIEW_OPTIONS, ACTION_DUPLICATE_MODE_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'AddChildActionModel':
      return merged(ACTION_OPEN_VIEW_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'FilterFormCollapseActionModel':
      return merged(ACTION_COLLAPSE_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'MailSendActionModel':
      return merged(ACTION_OPEN_VIEW_OPTIONS, ACTION_EMAIL_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'JSCollectionActionModel':
    case 'JSRecordActionModel':
    case 'JSFormActionModel':
    case 'JSItemActionModel':
    case 'FilterFormJSActionModel':
    case 'JSActionModel':
      return merged(ACTION_JS_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'LinkActionModel':
    case 'ExportActionModel':
    case 'ExportAttachmentActionModel':
    case 'ImportActionModel':
    case 'TemplatePrintCollectionActionModel':
    case 'TemplatePrintRecordActionModel':
    case 'CollectionTriggerWorkflowActionModel':
    case 'RecordTriggerWorkflowActionModel':
    case 'FormTriggerWorkflowActionModel':
    case 'WorkbenchTriggerWorkflowActionModel':
    case 'RefreshActionModel':
    case 'ExpandCollapseActionModel':
    case 'FilterFormSubmitActionModel':
    case 'FilterFormResetActionModel':
      return merged(ACTION_LINKAGE_OPTIONS);
    case 'FilterActionModel':
      return merged(FILTER_ACTION_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'ApplyFormSubmitModel':
    case 'ApplyFormSaveDraftModel':
      return merged(ACTION_CONFIRM_OPTIONS, APPROVAL_ASSIGN_ACTION_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'ApplyFormWithdrawModel':
      return merged(ACTION_CONFIRM_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'ProcessFormApproveModel':
    case 'ProcessFormRejectModel':
      return merged(APPROVAL_COMMENT_ACTION_OPTIONS, ACTION_LINKAGE_OPTIONS);
    case 'ProcessFormReturnModel':
      return merged(APPROVAL_COMMENT_ACTION_OPTIONS, ACTION_LINKAGE_OPTIONS, APPROVAL_RETURN_ACTION_OPTIONS);
    case 'ProcessFormDelegateModel':
    case 'ProcessFormAddAssigneeModel':
      return merged(ACTION_LINKAGE_OPTIONS, APPROVAL_REASSIGN_ACTION_OPTIONS);
    default:
      return {};
  }
}

export function getConfigureOptionsForUse(use?: string): FlowSurfaceConfigureOptions {
  const normalized = String(use || '').trim();
  const semanticUse = normalizeApprovalSemanticUse(normalized);
  let options: FlowSurfaceConfigureOptions;
  switch (normalized) {
    case 'TriggerChildPageModel':
    case 'ApprovalChildPageModel':
      options = cloneOptions(PAGE_OPTIONS);
      break;
    case 'TriggerChildPageTabModel':
    case 'ApprovalChildPageTabModel':
      options = cloneOptions(TAB_OPTIONS);
      break;
    case 'ApplyFormModel':
    case 'ProcessFormModel':
      options = cloneOptions(FORM_COMMON_OPTIONS);
      break;
    case 'ApprovalDetailsModel':
    case 'ApplyTaskCardDetailsModel':
    case 'ApprovalTaskCardDetailsModel':
      options = cloneOptions(DETAILS_OPTIONS);
      break;
    case 'PatternFormItemModel':
      options = cloneOptions(FORM_FIELD_WRAPPER_OPTIONS);
      break;
    case 'ApprovalDetailsItemModel':
    case 'ApplyTaskCardDetailsItemModel':
    case 'ApprovalTaskCardDetailsItemModel':
      options = cloneOptions(DETAILS_FIELD_WRAPPER_OPTIONS);
      break;
    case 'RootPageModel':
      options = cloneOptions(PAGE_OPTIONS);
      break;
    case 'RootPageTabModel':
      options = cloneOptions(TAB_OPTIONS);
      break;
    case 'TableBlockModel':
      options = cloneOptions(TABLE_OPTIONS);
      break;
    case 'CalendarBlockModel':
      options = cloneOptions(CALENDAR_OPTIONS);
      break;
    case 'TreeBlockModel':
      options = cloneOptions(TREE_OPTIONS);
      break;
    case 'KanbanBlockModel':
      options = cloneOptions(KANBAN_OPTIONS);
      break;
    case 'FormBlockModel':
    case 'CreateFormModel':
      options = cloneOptions(FORM_COMMON_OPTIONS);
      break;
    case 'EditFormModel':
      options = cloneOptions(EDIT_FORM_OPTIONS);
      break;
    case 'DetailsBlockModel':
      options = cloneOptions(DETAILS_OPTIONS);
      break;
    case 'FilterFormBlockModel':
      options = cloneOptions(FILTER_FORM_OPTIONS);
      break;
    case 'ListBlockModel':
      options = cloneOptions(LIST_OPTIONS);
      break;
    case 'GridCardBlockModel':
      options = cloneOptions(GRID_CARD_OPTIONS);
      break;
    case 'MarkdownBlockModel':
      options = cloneOptions(MARKDOWN_OPTIONS);
      break;
    case 'IframeBlockModel':
      options = cloneOptions(IFRAME_OPTIONS);
      break;
    case 'ChartBlockModel':
      options = cloneOptions(CHART_OPTIONS);
      break;
    case 'ActionPanelBlockModel':
      options = cloneOptions(ACTION_PANEL_OPTIONS);
      break;
    case 'MapBlockModel':
      options = cloneOptions(MAP_OPTIONS);
      break;
    case 'CommentsBlockModel':
      options = cloneOptions(COMMENTS_OPTIONS);
      break;
    case 'JSBlockModel':
      options = cloneOptions(JS_BLOCK_OPTIONS);
      break;
    case 'TableActionsColumnModel':
      options = cloneOptions(ACTION_COLUMN_OPTIONS);
      break;
    case 'TableColumnModel':
      options = cloneOptions(TABLE_FIELD_WRAPPER_OPTIONS);
      break;
    case 'DetailsItemModel':
      options = cloneOptions(DETAILS_FIELD_WRAPPER_OPTIONS);
      break;
    case 'FormAssociationItemModel':
      options = cloneOptions(DETAILS_FIELD_WRAPPER_OPTIONS);
      break;
    case 'FilterFormItemModel':
      options = cloneOptions(FILTER_FIELD_WRAPPER_OPTIONS);
      break;
    case 'FormItemModel':
      options = cloneOptions(FORM_FIELD_WRAPPER_OPTIONS);
      break;
    case 'JSFieldModel':
    case 'JSEditableFieldModel':
      options = cloneOptions(JS_FIELD_NODE_OPTIONS);
      break;
    case 'JSColumnModel':
      options = cloneOptions(JS_COLUMN_OPTIONS);
      break;
    case 'JSItemModel':
    case 'FormJSFieldItemModel':
      options = cloneOptions(JS_ITEM_OPTIONS);
      break;
    case 'DividerItemModel':
      options = cloneOptions(DIVIDER_ITEM_OPTIONS);
      break;
    default:
      if (isGenericFieldNodeUse(normalized) || isGenericFieldNodeUse(semanticUse)) {
        options = cloneOptions(FIELD_NODE_OPTIONS);
        break;
      }
      options = getActionConfigureOptionsByUse(normalized);
      break;
  }
  return annotateFlowContextSupport(normalized, options);
}

export function getConfigureOptionsForResolvedNode(input: {
  kind?: FlowSurfaceContainerKind;
  use?: string;
}): FlowSurfaceConfigureOptions {
  if (input.kind === 'page') {
    return annotateFlowContextSupport('RootPageModel', cloneOptions(PAGE_OPTIONS));
  }
  if (input.kind === 'tab') {
    return annotateFlowContextSupport('RootPageTabModel', cloneOptions(TAB_OPTIONS));
  }
  return getConfigureOptionsForUse(input.use);
}

export function getConfigureOptionsForCatalogItem(
  item?: Pick<FlowSurfaceCatalogItem, 'kind' | 'use'> | { kind?: FlowSurfaceCatalogItem['kind']; use?: string } | null,
): FlowSurfaceConfigureOptions {
  if (!item) {
    return {};
  }
  return getConfigureOptionsForUse(item.use);
}

export function getConfigureOptionKeysForUse(use?: string) {
  return Object.keys(getConfigureOptionsForUse(use));
}

export function getConfigureOptionKeysForResolvedNode(input: { kind?: FlowSurfaceContainerKind; use?: string }) {
  return Object.keys(getConfigureOptionsForResolvedNode(input));
}
