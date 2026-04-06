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

const COMMON_RESOURCE = objectOption('资源绑定', {
  example: {
    dataSourceKey: 'main',
    collectionName: 'users',
  },
});

const FILTER_GROUP = objectOption('FilterGroup 结构；空筛选可传 null 或 {}', {
  example: {
    logic: '$and',
    items: [],
  },
});

const SORTING = arrayOption('排序规则数组', {
  example: [
    {
      field: 'createdAt',
      direction: 'desc',
    },
  ],
});

const OPEN_VIEW = objectOption('弹窗/抽屉打开配置', {
  example: {
    dataSourceKey: 'main',
    collectionName: 'roles',
    mode: 'drawer',
  },
});

const CONFIRM = objectOption('确认弹窗配置，也可直接传 boolean', {
  example: {
    enable: true,
    title: '确认执行',
    content: '确定继续吗？',
  },
});

const JS_CODE = stringOption('JS 代码', {
  example: 'return value?.toUpperCase?.() || value;',
});

const JS_VERSION = stringOption('JS 代码版本', {
  example: 'v2',
});

const COMMON_BLOCK_TITLE_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('标题', { example: '用户表' }),
  displayTitle: booleanOption('是否显示标题', { example: true }),
};

const COMMON_HEIGHT_OPTIONS: FlowSurfaceConfigureOptions = {
  height: numberOption('高度', { example: 520 }),
  heightMode: stringOption('高度模式', {
    enum: ['defaultHeight', 'specifyValue', 'fullHeight'],
    example: 'specifyValue',
  }),
};

const PAGE_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('页面标题', { example: '用户工作台' }),
  documentTitle: stringOption('浏览器文档标题', { example: '用户工作台' }),
  displayTitle: booleanOption('是否显示页面标题', { example: true }),
  enableTabs: booleanOption('是否启用顶层 tabs', { example: true }),
  icon: stringOption('图标', { example: 'UserOutlined' }),
  enableHeader: booleanOption('是否显示页面 header', { example: true }),
};

const TAB_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('Tab 标题', { example: '概览' }),
  icon: stringOption('图标', { example: 'TableOutlined' }),
  documentTitle: stringOption('浏览器文档标题', { example: '用户概览' }),
};

const TABLE_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  pageSize: numberOption('分页大小', { example: 20 }),
  density: stringOption('表格密度', { enum: ['large', 'middle', 'small'], example: 'middle' }),
  showRowNumbers: booleanOption('是否显示行号', { example: true }),
  sorting: SORTING,
  dataScope: FILTER_GROUP,
  quickEdit: booleanOption('是否启用快捷编辑', { example: true }),
  treeTable: booleanOption('是否树表', { example: false }),
  defaultExpandAllRows: booleanOption('是否默认展开全部树节点', { example: false }),
  dragSort: booleanOption('是否启用拖拽排序', { example: false }),
  dragSortBy: stringOption('拖拽排序字段', { example: 'sort' }),
};

const FORM_COMMON_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('布局 key', { example: 'vertical' }),
  labelAlign: stringOption('标签对齐方式', { example: 'left' }),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  assignRules: objectOption('赋值规则', { example: {} }),
  colon: booleanOption('标签后是否显示冒号', { example: true }),
};

const EDIT_FORM_OPTIONS: FlowSurfaceConfigureOptions = {
  ...FORM_COMMON_OPTIONS,
  dataScope: FILTER_GROUP,
};

const DETAILS_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('布局 key', { example: 'vertical' }),
  labelAlign: stringOption('标签对齐方式', { example: 'left' }),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  colon: booleanOption('标签后是否显示冒号', { example: true }),
  sorting: SORTING,
  dataScope: FILTER_GROUP,
  linkageRules: arrayOption('联动规则', { example: [] }),
};

const FILTER_FORM_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  resource: COMMON_RESOURCE,
  layout: stringOption('布局 key', { example: 'vertical' }),
  labelAlign: stringOption('标签对齐方式', { example: 'left' }),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  defaultValues: objectOption('默认筛选值', { example: { status: 'draft' } }),
};

const LIST_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  pageSize: numberOption('分页大小', { example: 20 }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  layout: stringOption('列表布局', { example: 'vertical' }),
};

const GRID_CARD_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  resource: COMMON_RESOURCE,
  columns: objectOption('列数；可传数字或完整响应式对象（必须包含 xs/sm/md/lg/xl/xxl）', {
    example: {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 3,
      xxl: 4,
    },
  }),
  rowCount: numberOption('每行条目数', { example: 3 }),
  dataScope: FILTER_GROUP,
  sorting: SORTING,
  layout: stringOption('卡片布局', { example: 'vertical' }),
};

const MARKDOWN_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  content: stringOption('Markdown 内容', { example: '# Team handbook' }),
};

const IFRAME_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  mode: stringOption('iframe 模式', { example: 'url' }),
  url: stringOption('URL', { example: 'https://example.com/embed' }),
  html: stringOption('HTML 内容'),
  params: objectOption('URL 参数', { example: { id: '1' } }),
  allow: stringOption('allow 属性'),
  htmlId: stringOption('内嵌 html 节点 ID'),
};

const CHART_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  ...COMMON_HEIGHT_OPTIONS,
  query: objectOption('图表查询 DSL；默认推荐 builder 模式', {
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
  visual: objectOption('图表展示 DSL；默认推荐 basic 模式', {
    example: {
      mode: 'basic',
      type: 'bar',
      mappings: {
        x: 'department.title',
        y: 'employeeCount',
      },
    },
  }),
  events: objectOption('图表事件 DSL；仅暴露 raw JS 代码', {
    example: {
      raw: 'chart.on("click", () => console.log("clicked"));',
    },
  }),
  configure: objectOption('图表配置对象；会经过同一套 chart contract 规范化，不要与 query/visual/events 混用', {
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
  }),
};

const ACTION_PANEL_OPTIONS: FlowSurfaceConfigureOptions = {
  ...COMMON_BLOCK_TITLE_OPTIONS,
  layout: stringOption('布局 key', { example: 'list' }),
  ellipsis: booleanOption('是否折叠过长按钮', { example: false }),
};

const JS_BLOCK_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('标题', { example: '运行时横幅' }),
  description: stringOption('描述', { example: '自定义 JS 区块' }),
  className: stringOption('className', { example: 'users-banner' }),
  code: JS_CODE,
  version: JS_VERSION,
};

const ACTION_COLUMN_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('列标题', { example: '操作' }),
  tooltip: stringOption('列提示'),
  width: numberOption('列宽', { example: 220 }),
  fixed: stringOption('固定位置', { example: 'right' }),
};

const TABLE_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('列标题别名；table 下会映射到 title', { example: '昵称' }),
  title: stringOption('列标题', { example: '昵称' }),
  tooltip: stringOption('提示'),
  width: numberOption('列宽', { example: 240 }),
  fixed: stringOption('固定位置', { example: 'left' }),
  sorter: booleanOption('是否可排序', { example: true }),
  fieldPath: stringOption('字段路径', { example: 'nickname' }),
  associationPathName: stringOption('关联路径', { example: 'roles' }),
  editable: booleanOption('是否可编辑', { example: false }),
  dataIndex: stringOption('数据索引'),
  titleField: stringOption('关系展示标题字段', { example: 'title' }),
  clickToOpen: booleanOption('是否可点击打开详情', { example: true }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const DETAILS_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('标签', { example: '昵称' }),
  tooltip: stringOption('提示'),
  extra: stringOption('额外说明'),
  showLabel: booleanOption('是否显示标签', { example: true }),
  fieldPath: stringOption('字段路径', { example: 'nickname' }),
  associationPathName: stringOption('关联路径', { example: 'roles' }),
  disabled: booleanOption('是否禁用', { example: false }),
  pattern: stringOption('显示模式'),
  titleField: stringOption('关系展示标题字段', { example: 'title' }),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  clickToOpen: booleanOption('是否可点击打开详情', { example: true }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FILTER_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('标签', { example: '昵称' }),
  tooltip: stringOption('提示'),
  extra: stringOption('额外说明'),
  showLabel: booleanOption('是否显示标签', { example: true }),
  fieldPath: stringOption('字段路径', { example: 'nickname' }),
  associationPathName: stringOption('关联路径', { example: 'department' }),
  initialValue: objectOption('初始值'),
  multiple: booleanOption('是否多选', { example: false }),
  allowMultiple: booleanOption('是否允许多选', { example: false }),
  maxCount: numberOption('最多数量', { example: 5 }),
  name: stringOption('字段名覆盖'),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  clickToOpen: booleanOption('是否可点击打开详情', { example: false }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FORM_FIELD_WRAPPER_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('标签', { example: '昵称' }),
  tooltip: stringOption('提示'),
  extra: stringOption('额外说明'),
  showLabel: booleanOption('是否显示标签', { example: true }),
  fieldPath: stringOption('字段路径', { example: 'nickname' }),
  associationPathName: stringOption('关联路径', { example: 'department' }),
  initialValue: objectOption('初始值'),
  required: booleanOption('是否必填', { example: false }),
  disabled: booleanOption('是否禁用', { example: false }),
  multiple: booleanOption('是否多选', { example: false }),
  allowMultiple: booleanOption('是否允许多选', { example: false }),
  maxCount: numberOption('最多数量', { example: 5 }),
  pattern: stringOption('输入模式'),
  titleField: stringOption('关系展示标题字段', { example: 'title' }),
  name: stringOption('字段名覆盖'),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  clickToOpen: booleanOption('是否可点击打开详情', { example: false }),
  openView: OPEN_VIEW,
  code: JS_CODE,
  version: JS_VERSION,
};

const FIELD_NODE_OPTIONS: FlowSurfaceConfigureOptions = {
  fieldPath: stringOption('字段路径', { example: 'nickname' }),
  associationPathName: stringOption('关联路径', { example: 'roles' }),
  titleField: stringOption('关系展示标题字段', { example: 'title' }),
  clickToOpen: booleanOption('是否可点击打开详情', { example: true }),
  openView: OPEN_VIEW,
  title: stringOption('标题'),
  icon: stringOption('图标'),
  autoSize: booleanOption('是否自动尺寸', { example: true }),
  allowClear: booleanOption('是否允许清空', { example: true }),
  multiple: booleanOption('是否多选', { example: false }),
  allowMultiple: booleanOption('是否允许多选', { example: false }),
  quickCreate: booleanOption('是否允许快捷创建', { example: false }),
  mode: stringOption('组件模式'),
  options: objectOption('组件选项'),
};

const JS_FIELD_NODE_OPTIONS: FlowSurfaceConfigureOptions = {
  ...FIELD_NODE_OPTIONS,
  code: JS_CODE,
  version: JS_VERSION,
};

const JS_COLUMN_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('列标题', { example: '运行时列' }),
  tooltip: stringOption('提示'),
  width: numberOption('列宽', { example: 240 }),
  fixed: stringOption('固定位置', { example: 'right' }),
  code: JS_CODE,
  version: JS_VERSION,
};

const JS_ITEM_OPTIONS: FlowSurfaceConfigureOptions = {
  label: stringOption('标签', { example: '运行时项' }),
  tooltip: stringOption('提示'),
  extra: stringOption('额外说明'),
  showLabel: booleanOption('是否显示标签', { example: true }),
  labelWidth: stringOption('标签宽度', { example: '120px' }),
  labelWrap: booleanOption('标签是否换行', { example: false }),
  code: JS_CODE,
  version: JS_VERSION,
};

const ACTION_COMMON_OPTIONS: FlowSurfaceConfigureOptions = {
  title: stringOption('按钮标题', { example: '执行' }),
  tooltip: stringOption('提示'),
  icon: stringOption('图标', { example: 'PlusOutlined' }),
  type: stringOption('按钮类型', { example: 'primary' }),
  color: stringOption('颜色'),
  htmlType: stringOption('HTML 按钮类型', { example: 'submit' }),
  position: stringOption('位置'),
  danger: booleanOption('是否危险按钮', { example: false }),
};

const ACTION_OPEN_VIEW_OPTIONS: FlowSurfaceConfigureOptions = {
  openView: OPEN_VIEW,
};

const ACTION_CONFIRM_OPTIONS: FlowSurfaceConfigureOptions = {
  confirm: CONFIRM,
};

const ACTION_ASSIGN_OPTIONS: FlowSurfaceConfigureOptions = {
  assignValues: objectOption('批量/单条赋值内容', { example: { status: 'published' } }),
  updateMode: stringOption('更新模式', { example: 'overwrite' }),
};

const ACTION_LINKAGE_OPTIONS: FlowSurfaceConfigureOptions = {
  linkageRules: arrayOption('联动规则', { example: [] }),
};

const ACTION_JS_OPTIONS: FlowSurfaceConfigureOptions = {
  code: JS_CODE,
  version: JS_VERSION,
};

const ACTION_EDIT_MODE_OPTIONS: FlowSurfaceConfigureOptions = {
  editMode: stringOption('批量编辑模式', { example: 'drawer' }),
};

const ACTION_DUPLICATE_MODE_OPTIONS: FlowSurfaceConfigureOptions = {
  duplicateMode: stringOption('复制模式', { example: 'popup' }),
};

const ACTION_COLLAPSE_OPTIONS: FlowSurfaceConfigureOptions = {
  collapsedRows: numberOption('默认折叠行数', { example: 2 }),
  defaultCollapsed: booleanOption('是否默认折叠', { example: true }),
};

const ACTION_EMAIL_OPTIONS: FlowSurfaceConfigureOptions = {
  emailFieldNames: arrayOption('邮件字段名列表', { example: ['email'] }),
  defaultSelectAllRecords: booleanOption('是否默认全选记录', { example: false }),
};

const GLOBAL_FLOW_CONTEXT_OPTION_KEYS = new Set([
  'assignRules',
  'confirm',
  'dataScope',
  'defaultValues',
  'initialValue',
  'linkageRules',
  'assignValues',
]);

const FLOW_CONTEXT_OPTION_KEYS_BY_USE: Record<string, string[]> = {
  RootPageModel: ['documentTitle'],
  RootPageTabModel: ['documentTitle'],
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
    case 'FilterActionModel':
    case 'ExpandCollapseActionModel':
    case 'FilterFormSubmitActionModel':
    case 'FilterFormResetActionModel':
      return merged(ACTION_LINKAGE_OPTIONS);
    default:
      return {};
  }
}

export function getConfigureOptionsForUse(use?: string): FlowSurfaceConfigureOptions {
  const normalized = String(use || '').trim();
  let options: FlowSurfaceConfigureOptions;
  switch (normalized) {
    case 'RootPageModel':
      options = cloneOptions(PAGE_OPTIONS);
      break;
    case 'RootPageTabModel':
      options = cloneOptions(TAB_OPTIONS);
      break;
    case 'TableBlockModel':
      options = cloneOptions(TABLE_OPTIONS);
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
    default:
      if (isGenericFieldNodeUse(normalized)) {
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
