/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import * as acornWalk from 'acorn-walk';
import { operators as databaseOperators } from '@nocobase/database';
import * as _ from 'lodash';
import { Op } from 'sequelize';
import type { FlowSurfaceErrorItemInput } from '../errors';
import {
  getCollectionFields,
  getFieldInterface,
  getCollectionName,
  getFieldName,
  getFieldType,
  isAssociationField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from '../service-helpers';
import { getChartBuilderResourceInit } from '../chart-config';
import { getRunJsAuthoringRule } from './rules';
import type { RunJsAuthoringInspectionInput, RunJsAuthoringRepairClass, RunJsAuthoringSurfaceStyle } from './types';

type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

type RunJsAuthoringContext = {
  authoringActionName?: FlowSurfaceAuthoringWriteAction;
  applyBlueprintScriptAssets?: Record<string, any>;
  currentCollectionName?: string;
  currentDataSourceKey?: string;
  currentNode?: any;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  hostBlockType?: string;
  hostCollectionName?: string;
  hostDataSourceKey?: string;
  runJsSourceBudget?: RunJsSourceBudget;
};

type RunJsCodeSource = {
  code: string;
  path: string;
};

type PlainRecord = Record<string, any>;

type SourceRange = {
  start: number;
  end: number;
};

type SourceBinding = SourceRange & {
  declarationStart?: number;
  name: string;
};

type StringLiteralBinding = SourceBinding & {
  value: string;
};

type StaticStringBinding = StringLiteralBinding;

type ReactComponentAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

type ReactAsyncComponentBinding = SourceRange & {
  capability: string;
  component: string;
  declarationStart?: number;
  name: string;
};

type ReactCreateElementAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

type ReactNamespaceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  precedenceStart?: number;
};

type ReactDefaultAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  precedenceStart?: number;
};

type AstCapabilityAlias = SourceRange & {
  capability: string;
  name: string;
  precedenceStart?: number;
};

const AST_DYNAMIC_MEMBER_ALIAS = '[*]';

type InvalidReactRuntimeBinding = SourceRange & {
  binding: string;
  capability: string;
  declarationStart?: number;
  index: number;
  ruleId: 'runjs-react-default-alias-forbidden';
};

type FlowResourceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  name: string;
};

type FlowResourceInstanceType =
  | 'unknown'
  | 'FlowResource'
  | 'APIResource'
  | 'SingleRecordResource'
  | 'MultiRecordResource'
  | 'SQLResource';

type AstFlowResourceAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  resourceType: FlowResourceInstanceType;
};

type AstFlowResourceSource = {
  capability: string;
  index: number;
  resourceType: FlowResourceInstanceType;
};

type AstRunJsResourceState = {
  capability: string;
  collectionName?: string;
  dataSourceKey: string;
  resourceType: FlowResourceInstanceType;
};

type CtxLibMemberCaseMismatch = {
  accessKind: 'bracket' | 'destructure' | 'member';
  capability: string;
  expectedCapability: string;
  expectedMember: string;
  index: number;
  member: string;
};

type InvalidCtxLibMemberAccess = {
  accessKind: 'bracket' | 'destructure' | 'member';
  capability: string;
  index: number;
  library: string;
  member: string;
  ruleId: 'runjs-ctx-libs-member-unknown';
  suggestedImport?: string;
};

type CallArgumentSource = SourceRange & {
  source: string;
};

type ResourceCallInReactHook = {
  capability: string;
  hook: string;
  index: number;
};

type SharedCtxResourceCallInFunction = {
  capability: string;
  functionName?: string;
  index: number;
};

type RunJsSourceBudget = {
  count: number;
  countLimitReported?: boolean;
  totalLength: number;
  totalLimitReported?: boolean;
};

type RunJsAstInspection = {
  invalidApiResourceCalls: Array<{
    index: number;
    match: string;
    matchIndex?: number;
    method: string;
  }>;
  invalidCtxApiMemberAccesses: Array<{
    capability: string;
    index: number;
    match?: string;
    matchIndex?: number;
    member?: string;
    ruleId: string;
  }>;
  invalidCtxLibMemberAccesses: InvalidCtxLibMemberAccess[];
  invalidResourceTypeCalls: Array<{
    capability: string;
    expression?: string;
    index: number;
    resourceType?: string;
    ruleId: string;
  }>;
  invalidFlowResourceListCalls: Array<{
    capability: string;
    index: number;
  }>;
  invalidFlowResourceMethodCalls: Array<{
    capability: string;
    index: number;
    method: string;
    resourceType?: FlowResourceInstanceType;
    suggestedMethod?: string;
  }>;
  invalidResourceFilterCalls: Array<{
    availableFields?: string[];
    capability: string;
    collectionName?: string;
    dataSourceKey?: string;
    fieldInterface?: string;
    fieldPath?: string;
    fieldType?: string;
    index: number;
    message: string;
    operator?: string;
    resourceType?: FlowResourceInstanceType;
    ruleId: string;
    unsupportedKeys?: string[];
    suggestedOperator?: string;
    suggestedValue?: any;
    examples?: Record<string, any>;
  }>;
  nestedRunjsCalls: Array<{
    capability: string;
    index: number;
  }>;
  invalidReactRuntimeBindings: InvalidReactRuntimeBinding[];
  reactAsyncComponentReferences: Array<{
    capability: string;
    component: string;
    index: number;
  }>;
  reactComponentCtxRenderCalls: Array<{
    capability: string;
    component: string;
    index: number;
  }>;
  sharedCtxResourceCallsInFunctions: SharedCtxResourceCallInFunction[];
  topLevelReachableCtxRenderCalls: Array<{
    capability: string;
    index: number;
  }>;
};

type CtxMethodAlias = SourceRange & {
  capability: string;
  method: string;
  name: string;
};

type CtxRootAlias = SourceRange & {
  capability: 'ctx';
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

type CtxLibsRootAlias = SourceRange & {
  capability: 'ctx.libs';
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

type CtxLibAlias = SourceRange & {
  capability: string;
  declarationStart?: number;
  executionScope: SourceRange;
  library: string;
  name: string;
};

type CtxApiCapability = 'ctx.api' | 'ctx.api.auth' | 'ctx.api.request' | 'ctx.api.resource' | `ctx.api.auth.${string}`;

type CtxApiAlias = SourceRange & {
  capability: CtxApiCapability;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
};

type CtxApiResourceHandleAlias = SourceRange & {
  calleeSource: string;
  declarationStart?: number;
  executionScope: SourceRange;
  name: string;
  resourceName?: string;
};

type CtxApiResourceMethodAlias = SourceRange & {
  declarationStart?: number;
  executionScope: SourceRange;
  method: string;
  name: string;
};

type CtxApiResourceAliases = {
  handles: CtxApiResourceHandleAlias[];
  methods: CtxApiResourceMethodAlias[];
};

type AstIdentifierBinding = SourceRange & {
  name: string;
};

type AstFunctionBinding = SourceRange & {
  declarationStart: number;
  functionNode: any;
  hoisted: boolean;
  name: string;
  scopeStart: number;
};

type AstCtxRenderCall = {
  args: any[];
  capability: string;
  index: number;
};

const AcornParserWithJsx = acorn.Parser.extend(jsx());
const ACORN_WALK_BASE = {
  ...(acornWalk as any).base,
  JSXElement(node: any, state: any, callback: any) {
    callback(node.openingElement, state);
    for (const child of node.children || []) {
      callback(child, state);
    }
    if (node.closingElement) {
      callback(node.closingElement, state);
    }
  },
  JSXFragment(node: any, state: any, callback: any) {
    callback(node.openingFragment, state);
    for (const child of node.children || []) {
      callback(child, state);
    }
    callback(node.closingFragment, state);
  },
  JSXOpeningElement(node: any, state: any, callback: any) {
    callback(node.name, state);
    for (const attribute of node.attributes || []) {
      callback(attribute, state);
    }
  },
  JSXClosingElement(node: any, state: any, callback: any) {
    callback(node.name, state);
  },
  JSXAttribute(node: any, state: any, callback: any) {
    callback(node.name, state);
    if (node.value) {
      callback(node.value, state);
    }
  },
  JSXExpressionContainer(node: any, state: any, callback: any) {
    callback(node.expression, state);
  },
  JSXSpreadAttribute(node: any, state: any, callback: any) {
    callback(node.argument, state);
  },
  JSXMemberExpression(node: any, state: any, callback: any) {
    callback(node.object, state);
    callback(node.property, state);
  },
  JSXNamespacedName(node: any, state: any, callback: any) {
    callback(node.namespace, state);
    callback(node.name, state);
  },
  JSXIdentifier() {},
  JSXText() {},
  JSXEmptyExpression() {},
  JSXOpeningFragment() {},
  JSXClosingFragment() {},
};

const HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE: Record<string, string[]> = {
  calendar: ['quickCreatePopup', 'eventPopup'],
  kanban: ['quickCreatePopup', 'cardPopup'],
};

const RENDER_MODEL_USES = new Set([
  'JSBlockModel',
  'JSColumnModel',
  'JSFieldModel',
  'JSItemModel',
  'JSEditableFieldModel',
  'FormJSFieldItemModel',
  'JSItemActionModel',
]);

const ACTION_MODEL_USES = new Set([
  'JSActionModel',
  'JSFormActionModel',
  'JSRecordActionModel',
  'JSCollectionActionModel',
  'FilterFormJSActionModel',
  'ChartEventsModel',
]);

const VALUE_MODEL_USES = new Set(['ChartOptionModel']);

const KNOWN_MODEL_USES = new Set([...RENDER_MODEL_USES, ...ACTION_MODEL_USES, ...VALUE_MODEL_USES]);

const PUBLIC_BLOCK_TYPE_BY_MODEL_USE: Record<string, string> = {
  TableBlockModel: 'table',
  CalendarBlockModel: 'calendar',
  TreeBlockModel: 'tree',
  KanbanBlockModel: 'kanban',
  FormBlockModel: 'editForm',
  CreateFormModel: 'createForm',
  EditFormModel: 'editForm',
  DetailsBlockModel: 'details',
  FilterFormBlockModel: 'filterForm',
  ListBlockModel: 'list',
  GridCardBlockModel: 'gridCard',
  ChartBlockModel: 'chart',
  MapBlockModel: 'map',
  CommentsBlockModel: 'comments',
  RecordHistoryBlockModel: 'recordHistory',
  JSBlockModel: 'jsBlock',
  MarkdownBlockModel: 'markdown',
  IframeBlockModel: 'iframe',
  ActionPanelBlockModel: 'actionPanel',
};

const SURFACE_STYLE_BY_ID: Record<string, RunJsAuthoringSurfaceStyle> = {
  'event-flow.execute-javascript': 'action',
  'linkage.execute-javascript': 'action',
  'reaction.value-runjs': 'value',
  'custom-variable.runjs': 'value',
  'js-model.render': 'render',
  'js-model.action': 'action',
};

const SURFACE_ALLOWED_MODEL_USES: Record<string, Set<string>> = {
  'event-flow.execute-javascript': new Set(['JSActionModel']),
  'linkage.execute-javascript': new Set([
    'JSEditableFieldModel',
    'JSItemModel',
    'JSRecordActionModel',
    'JSCollectionActionModel',
    'JSItemActionModel',
    'FormJSFieldItemModel',
  ]),
  'reaction.value-runjs': new Set(['JSEditableFieldModel', 'JSItemModel', 'FormJSFieldItemModel']),
  'custom-variable.runjs': new Set(['JSEditableFieldModel', 'JSItemModel', 'FormJSFieldItemModel']),
  'js-model.render': RENDER_MODEL_USES,
  'js-model.action': ACTION_MODEL_USES,
};

const ALLOWED_CTX_ROOTS = new Set([
  'acl',
  'antd',
  'antdIcons',
  'api',
  'auth',
  'blockModel',
  'collection',
  'collectionField',
  'console',
  'createResource',
  'dataSourceManager',
  'date',
  'dayjs',
  'element',
  'engine',
  'exit',
  'exitAll',
  'filterManager',
  'form',
  'formValues',
  'getApiInfos',
  'getEnvInfos',
  'getModel',
  'getValue',
  'getVar',
  'getVarInfos',
  'i18n',
  'importAsync',
  'initResource',
  'libs',
  'location',
  'logger',
  'makeResource',
  'message',
  'modal',
  'model',
  'notification',
  'off',
  'on',
  'openView',
  'popup',
  'React',
  'ReactDOM',
  'record',
  'render',
  'request',
  'requireAsync',
  'resolveJsonTemplate',
  'resource',
  'role',
  'route',
  'router',
  'runAction',
  'runjs',
  'setValue',
  'sql',
  't',
  'user',
  'useResource',
  'value',
  'view',
  'viewer',
]);

const CHART_CTX_ROOTS = new Set(['data']);

const BLOCKED_CTX_CAPABILITIES: Record<string, { capability: string; reroute: string }> = {};

const FORBIDDEN_BARE_GLOBALS = new Set([
  'fetch',
  'localStorage',
  'sessionStorage',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'SharedWorker',
  'ServiceWorker',
  'BroadcastChannel',
  'EventSource',
  'indexedDB',
  'caches',
  'Function',
  'eval',
  'globalThis',
  'Intl',
  'process',
  'require',
  'module',
  'exports',
  'location',
]);

const NON_METHOD_CALL_KEYWORDS = new Set(['catch', 'do', 'for', 'function', 'if', 'switch', 'while', 'with']);

const ACTION_TYPE_ALIASES = new Map([
  ['jsitem', 'jsItem'],
  ['js-item', 'jsItem'],
]);

const REACT_HOOK_NAMES = [
  'useActionState',
  'useCallback',
  'useContext',
  'useDebugValue',
  'useDeferredValue',
  'useEffect',
  'useId',
  'useImperativeHandle',
  'useInsertionEffect',
  'useLayoutEffect',
  'useMemo',
  'useOptimistic',
  'useReducer',
  'useRef',
  'useState',
  'useSyncExternalStore',
  'useTransition',
];

const REACT_HOOK_PATTERN = REACT_HOOK_NAMES.map(escapeRegExp).join('|');
const RUNJS_RESOURCE_ACTION_PATTERN = '(?:list|get|create|update|destroy)';
const MAX_RUNJS_SOURCE_LENGTH = 64 * 1024;
const MAX_RUNJS_TOTAL_SOURCE_LENGTH = 256 * 1024;
const MAX_RUNJS_SOURCES_PER_REQUEST = 100;
const MAX_RUNJS_ERRORS_PER_SOURCE = 20;
const RUNJS_SUPPORTED_FILTER_OPERATORS = buildRunJsSupportedFilterOperators();
const RUNJS_DATE_FILTER_OPERATORS = new Set([
  '$dateOn',
  '$dateNotOn',
  '$dateBefore',
  '$dateAfter',
  '$dateNotBefore',
  '$dateNotAfter',
  '$dateBetween',
]);
const RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS = new Set(['$dateFrom', '$dateTo']);
const FLOW_RESOURCE_CLASS_NAMES = new Set([
  'FlowResource',
  'APIResource',
  'SingleRecordResource',
  'MultiRecordResource',
  'SQLResource',
]);
const INIT_RESOURCE_CLASS_NAMES = new Set([
  'APIResource',
  'SingleRecordResource',
  'MultiRecordResource',
  'SQLResource',
]);
const AST_CTX_METHOD_NAMES = new Set(['runjs', 'makeResource', 'initResource', 'render']);
const REACT_NODE_COMPONENT_PROP_NAMES = new Set(['avatar', 'extra', 'icon', 'prefix', 'suffix']);
const CANONICAL_CTX_LIB_MEMBERS = ['React', 'ReactDOM', 'antd', 'dayjs', 'antdIcons', 'lodash', 'formula', 'math'];
const CTX_LIB_MEMBER_BY_LOWERCASE = new Map(CANONICAL_CTX_LIB_MEMBERS.map((member) => [member.toLowerCase(), member]));
const RUNJS_CTX_LIB_ANTD_ALLOWED_MEMBERS = new Set([
  'Affix',
  'Alert',
  'Anchor',
  'App',
  'AutoComplete',
  'Avatar',
  'BackTop',
  'Badge',
  'Breadcrumb',
  'Button',
  'Calendar',
  'Card',
  'Carousel',
  'Cascader',
  'Checkbox',
  'Col',
  'Collapse',
  'ColorPicker',
  'ConfigProvider',
  'DatePicker',
  'Descriptions',
  'Divider',
  'Drawer',
  'Dropdown',
  'Empty',
  'Flex',
  'FloatButton',
  'Form',
  'Grid',
  'Image',
  'Input',
  'InputNumber',
  'Layout',
  'List',
  'Mentions',
  'Menu',
  'Modal',
  'Pagination',
  'Popconfirm',
  'Popover',
  'Progress',
  'QRCode',
  'Radio',
  'Rate',
  'Result',
  'Row',
  'Segmented',
  'Select',
  'Skeleton',
  'Slider',
  'Space',
  'Spin',
  'Splitter',
  'Statistic',
  'Steps',
  'Switch',
  'Table',
  'Tabs',
  'Tag',
  'TimePicker',
  'Timeline',
  'Tooltip',
  'Tour',
  'Transfer',
  'Tree',
  'TreeSelect',
  'Typography',
  'Upload',
  'Watermark',
  'message',
  'notification',
  'theme',
  'unstableSetRender',
  'version',
]);
const RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY = new Map<string, Set<string>>([
  ['antd', RUNJS_CTX_LIB_ANTD_ALLOWED_MEMBERS],
]);
const RUNJS_CTX_API_ALLOWED_MEMBERS = new Set(['auth', 'request', 'resource']);
const RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS = new Set(['authenticator', 'locale', 'role', 'token']);
const RUNJS_RESOURCE_METHODS = new Set(['list', 'get', 'create', 'update', 'destroy']);
const FLOW_RESOURCE_BASE_METHODS = new Set([
  'getData',
  'hasData',
  'setData',
  'getMeta',
  'setMeta',
  'getError',
  'setError',
  'clearError',
  'refresh',
  'on',
  'once',
  'off',
  'emit',
]);
const API_RESOURCE_METHODS = unionMethodSets([
  FLOW_RESOURCE_BASE_METHODS,
  new Set([
    'setAPIClient',
    'getURL',
    'setURL',
    'clearRequestParameters',
    'setRequestParameters',
    'setRequestMethod',
    'addRequestHeader',
    'removeRequestHeader',
    'addRequestParameter',
    'getRequestParameter',
    'removeRequestParameter',
    'setRequestBody',
    'setRequestOptions',
    'getRequestOptions',
    'refresh',
  ]),
]);
const RECORD_RESOURCE_METHODS = unionMethodSets([
  API_RESOURCE_METHODS,
  new Set([
    'setRefreshAction',
    'mergeRequestConfig',
    'setRunActionOptions',
    'runAction',
    'setResourceName',
    'getResourceName',
    'setSourceId',
    'getSourceId',
    'setDataSourceKey',
    'getDataSourceKey',
    'setFilter',
    'getFilter',
    'resetFilter',
    'addFilterGroup',
    'removeFilterGroup',
    'setAppends',
    'getAppends',
    'addAppends',
    'removeAppends',
    'getUpdateAssociationValues',
    'addUpdateAssociationValues',
    'jsonStringify',
    'setFilterByTk',
    'getFilterByTk',
    'setFields',
    'getFields',
    'setSort',
    'getSort',
    'setExcept',
    'getExcept',
    'setWhitelist',
    'getWhitelist',
    'setBlacklist',
    'getBlacklist',
  ]),
]);
const RUNJS_RESOURCE_CHAINABLE_STATE_METHODS = new Set(['setDataSourceKey', 'setResourceName', 'setFilter']);
const MULTI_RECORD_RESOURCE_METHODS = unionMethodSets([
  RECORD_RESOURCE_METHODS,
  new Set([
    'setCreateActionOptions',
    'setUpdateActionOptions',
    'setSelectedRows',
    'getSelectedRows',
    'setPage',
    'getPage',
    'setPageSize',
    'getPageSize',
    'getTotalPage',
    'getCell',
    'next',
    'previous',
    'goto',
    'create',
    'get',
    'update',
    'destroySelectedRows',
    'destroy',
    'setItem',
    'refresh',
  ]),
]);
const SINGLE_RECORD_RESOURCE_METHODS = unionMethodSets([
  RECORD_RESOURCE_METHODS,
  new Set(['setSaveActionOptions', 'save', 'destroy', 'refresh']),
]);
const SQL_RESOURCE_METHODS = unionMethodSets([
  RECORD_RESOURCE_METHODS,
  new Set([
    'setDebug',
    'setPage',
    'getPage',
    'setPageSize',
    'getPageSize',
    'next',
    'previous',
    'goto',
    'setDataSourceKey',
    'setSQLType',
    'setSQL',
    'setFilterByTk',
    'setFilter',
    'setBind',
    'setLiquidContext',
    'run',
    'runBySQL',
    'runById',
    'refresh',
  ]),
]);
const FLOW_RESOURCE_METHODS_BY_TYPE: Record<Exclude<FlowResourceInstanceType, 'unknown'>, Set<string>> = {
  FlowResource: FLOW_RESOURCE_BASE_METHODS,
  APIResource: API_RESOURCE_METHODS,
  SingleRecordResource: SINGLE_RECORD_RESOURCE_METHODS,
  MultiRecordResource: MULTI_RECORD_RESOURCE_METHODS,
  SQLResource: SQL_RESOURCE_METHODS,
};
const UNKNOWN_FLOW_RESOURCE_METHODS = unionMethodSets(Object.values(FLOW_RESOURCE_METHODS_BY_TYPE));
const FLOW_RESOURCE_METHOD_SUGGESTIONS = new Map([
  ['setFilters', 'setFilter'],
  ['getCount', 'getData'],
]);
const CONTEXT_FIRST_REPAIR_CLASSES = new Set<RunJsAuthoringRepairClass>([
  'unknown-surface-stop',
  'unknown-model-stop',
  'ctx-root-mismatch-stop',
  'blocked-capability-reroute',
]);
const RUNJS_FIX_AND_RETRY_INSTRUCTION = 'Do not skip this JS/RunJS step. Fix the error and retry the same write.';
const RUNJS_CONTEXT_AND_RETRY_INSTRUCTION =
  'Do not skip this JS/RunJS step. Resolve the blocking context/problem first, then retry the same write.';

function unionMethodSets(methodSets: Array<Set<string>>) {
  const union = new Set<string>();
  methodSets.forEach((methodSet) => {
    methodSet.forEach((method) => union.add(method));
  });
  return union;
}

function asPlainRecord(value: unknown): PlainRecord | undefined {
  return _.isPlainObject(value) ? (value as PlainRecord) : undefined;
}

export function collectRunJsAuthoringErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  const validationContext = {
    ...context,
    authoringActionName: actionName,
    runJsSourceBudget: createRunJsSourceBudget(),
  };
  if (!_.isPlainObject(values)) {
    return errors;
  }

  if (actionName === 'configure') {
    collectConfigureRunJsErrors(values, validationContext, errors);
    collectReactionRunJsErrors(
      values.reaction,
      '$.reaction',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
    collectReactionRunJsErrors(
      values.changes?.reaction,
      '$.changes.reaction',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
    return dedupeErrors(errors);
  }

  if (actionName === 'applyBlueprint') {
    collectChartAssetRunJsErrors(
      values.assets?.charts,
      '$.assets.charts',
      errors,
      validationContext.runJsSourceBudget,
      validationContext,
    );
  }

  getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
    collectBlockRunJsErrors(block, path, validationContext, errors),
  );
  collectReactionRunJsErrors(
    values.reaction,
    '$.reaction',
    errors,
    validationContext.runJsSourceBudget,
    validationContext,
  );
  return dedupeErrors(errors);
}

export function collectFlowRegistryRunJsAuthoringErrors(
  flowRegistry: any,
  path = '$.flowRegistry',
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  collectFlowRegistryRunJsErrors(flowRegistry, path, errors, createRunJsSourceBudget(), context);
  return dedupeErrors(errors);
}

function createRunJsSourceBudget(): RunJsSourceBudget {
  return {
    count: 0,
    totalLength: 0,
  };
}

function inspectRunJsAuthoringCodeForWrite(
  input: RunJsAuthoringInspectionInput,
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const limitResult = collectRunJsSourceLimitErrors(input, budget);
  if (limitResult.skipInspection || limitResult.errors.length) {
    return limitResult.errors;
  }
  return inspectRunJsAuthoringCode(input, context);
}

function collectRunJsSourceLimitErrors(
  input: RunJsAuthoringInspectionInput,
  budget?: RunJsSourceBudget,
): { errors: FlowSurfaceErrorItemInput[]; skipInspection: boolean } {
  const source = String(input.code || '');
  const sourceLength = source.length;
  const modelUse = normalizeText(input.modelUse);
  const surface = normalizeText(input.surface);
  const errors: FlowSurfaceErrorItemInput[] = [];

  if (budget) {
    budget.count += 1;
    budget.totalLength += sourceLength;
  }

  const pushLimitError = (ruleId: string, message: string, details?: Record<string, any>) => {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'source-limit-stop',
        ruleId,
        message,
        modelUse,
        surface,
        index: 0,
        source,
        details,
      }),
    );
  };

  const sourceTooLarge = sourceLength > MAX_RUNJS_SOURCE_LENGTH;
  if (sourceTooLarge && (!budget || budget.count <= MAX_RUNJS_SOURCES_PER_REQUEST)) {
    pushLimitError(
      'runjs-source-too-large',
      `flowSurfaces authoring ${input.path} RunJS source is too large to validate safely`,
      {
        maxSourceLength: MAX_RUNJS_SOURCE_LENGTH,
        sourceLength,
      },
    );
  }

  let requestLimitExceeded = false;
  if (budget && budget.count > MAX_RUNJS_SOURCES_PER_REQUEST) {
    requestLimitExceeded = true;
    if (!budget.countLimitReported) {
      budget.countLimitReported = true;
      pushLimitError(
        'runjs-too-many-sources',
        `flowSurfaces authoring request contains too many RunJS sources to validate safely`,
        {
          maxSources: MAX_RUNJS_SOURCES_PER_REQUEST,
          sourceCount: budget.count,
        },
      );
    }
  }

  if (budget && budget.totalLength > MAX_RUNJS_TOTAL_SOURCE_LENGTH) {
    requestLimitExceeded = true;
    if (!budget.totalLimitReported) {
      budget.totalLimitReported = true;
      pushLimitError(
        'runjs-total-source-too-large',
        `flowSurfaces authoring request contains too much RunJS source to validate safely`,
        {
          maxTotalSourceLength: MAX_RUNJS_TOTAL_SOURCE_LENGTH,
          totalSourceLength: budget.totalLength,
        },
      );
    }
  }

  return { errors, skipInspection: sourceTooLarge || requestLimitExceeded };
}

export function inspectRunJsAuthoringCode(
  input: RunJsAuthoringInspectionInput,
  context: RunJsAuthoringContext = {},
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  const source = String(input.code || '');
  const modelUse = normalizeText(input.modelUse);
  const surface = normalizeText(input.surface);
  const surfaceStyle = resolveSurfaceStyle(input);
  const sourceLimitResult = collectRunJsSourceLimitErrors(input);
  if (sourceLimitResult.skipInspection || sourceLimitResult.errors.length) {
    return sourceLimitResult.errors;
  }

  if (surface && !SURFACE_STYLE_BY_ID[surface]) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} references unknown RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (modelUse && !KNOWN_MODEL_USES.has(modelUse)) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} references unknown JS model '${modelUse}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (
    surface &&
    modelUse &&
    SURFACE_ALLOWED_MODEL_USES[surface] &&
    !SURFACE_ALLOWED_MODEL_USES[surface].has(modelUse)
  ) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'unknown-model-stop',
        message: `flowSurfaces authoring ${input.path} model '${modelUse}' is not supported by RunJS surface '${surface}'`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  if (!surfaceStyle) {
    errors.push(
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: modelUse ? 'unknown-model-stop' : 'unknown-surface-stop',
        message: `flowSurfaces authoring ${input.path} cannot resolve a RunJS validation surface`,
        modelUse,
        surface,
        index: 0,
        source,
      }),
    );
    return errors;
  }

  const parseResult = parseRunJsAuthoringAst(source);
  if (parseResult.error) {
    return [
      buildRunJsAuthoringError({
        path: input.path,
        repairClass: 'syntax-stop',
        ruleId: 'runjs-syntax-invalid',
        message: `flowSurfaces authoring ${input.path} has invalid JavaScript syntax: ${parseResult.error.message}`,
        modelUse,
        surface,
        index: parseResult.error.index,
        source,
        details: {
          syntaxMessage: parseResult.error.message,
        },
      }),
    ];
  }

  const scan = scanJavaScriptSource(source, parseResult.ast, context);
  collectNestedRunJsErrors(input.path, source, scan, modelUse, surface, errors);
  collectResourceApiErrors(input.path, source, scan, modelUse, surface, errors);
  collectResourceRuntimeErrors(input.path, source, scan, modelUse, surface, errors);
  collectDirectDomErrors(input.path, source, scan, modelUse, surface, errors);
  collectGlobalErrors(input.path, source, scan, modelUse, surface, errors);
  collectReactRuntimeErrors(input.path, source, scan, modelUse, surface, errors);
  collectCtxContractErrors(input.path, source, scan, modelUse, surface, errors);
  collectSurfaceStyleErrors(input.path, source, scan, surfaceStyle, modelUse, surface, errors);
  return dedupeErrors(errors).slice(0, MAX_RUNJS_ERRORS_PER_SOURCE);
}

function collectConfigureRunJsErrors(values: any, context: RunJsAuthoringContext, errors: FlowSurfaceErrorItemInput[]) {
  const changes = values.changes;
  if (!_.isPlainObject(changes)) {
    return;
  }
  const modelUse = resolveConfigureModelUse(context.currentNode);
  const surfaceStyle = resolveModelSurfaceStyle(modelUse);
  const hostBlockType = resolveConfigureBlockType(context);
  if (typeof changes.code === 'string' && changes.code.trim()) {
    errors.push(
      ...inspectRunJsAuthoringCodeForWrite(
        {
          code: changes.code,
          path: '$.changes.code',
          modelUse: modelUse || 'unknown',
          surfaceStyle,
        },
        context.runJsSourceBudget,
        context,
      ),
    );
  }
  if (hostBlockType === 'chart') {
    collectChartRawRunJsErrors(changes, '$.changes', errors, context.runJsSourceBudget, context);
    collectChartLegacyConfigureRunJsErrors(
      changes.configure,
      '$.changes.configure',
      errors,
      context.runJsSourceBudget,
      context,
    );
  }

  const recursiveChanges = {
    ...changes,
    type: hostBlockType,
  };
  delete recursiveChanges.code;
  delete recursiveChanges.source;
  if (_.isPlainObject(recursiveChanges.settings)) {
    recursiveChanges.settings = _.omit(recursiveChanges.settings, ['code', 'source']);
  }
  collectBlockRunJsErrors(recursiveChanges, '$.changes', context, errors);
  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[hostBlockType]?.forEach((key) => {
    collectBlockListRunJsErrors(changes?.[key]?.blocks, `$.changes.${key}.blocks`, context, errors);
    collectReactionRunJsErrors(
      changes?.[key]?.reaction,
      `$.changes.${key}.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function createRunJsResourceContext(context: RunJsAuthoringContext, resourceInit: any): RunJsAuthoringContext {
  const collectionName = normalizeText(resourceInit?.collectionName);
  if (!collectionName) {
    return context;
  }
  const dataSourceKey =
    normalizeText(resourceInit?.dataSourceKey) ||
    normalizeText(context.currentDataSourceKey || context.hostDataSourceKey) ||
    'main';
  return {
    ...context,
    currentDataSourceKey: dataSourceKey,
    currentCollectionName: collectionName,
  };
}

function getRunJsBlockResourceInit(block: any, blockType: string) {
  const resourceInit = asPlainRecord(block?.resourceInit);
  const resource = asPlainRecord(block?.resource);
  const chartResourceInit =
    blockType === 'chart'
      ? getChartBuilderResourceInit(block?.settings?.configure || block?.configure || block?.chartSettings?.configure)
      : null;
  return {
    dataSourceKey:
      block?.dataSourceKey ||
      resource?.dataSourceKey ||
      resourceInit?.dataSourceKey ||
      chartResourceInit?.dataSourceKey,
    collectionName:
      block?.collection ||
      resource?.collectionName ||
      resourceInit?.collectionName ||
      chartResourceInit?.collectionName,
  };
}

function getAuthoringBlocks(actionName: FlowSurfaceAuthoringWriteAction, values: any) {
  if (actionName === 'addBlock') {
    return [{ block: values, path: '$' }];
  }
  if (actionName === 'addBlocks' || actionName === 'compose') {
    return _.castArray(values.blocks || []).map((block, index) => ({
      block,
      path: `$.blocks[${index}]`,
    }));
  }
  if (actionName === 'applyBlueprint') {
    return _.castArray(values.tabs || []).flatMap((tab, tabIndex) =>
      _.castArray(tab?.blocks || []).map((block, blockIndex) => ({
        block,
        path: `$.tabs[${tabIndex}].blocks[${blockIndex}]`,
      })),
    );
  }
  return [];
}

function collectBlockRunJsErrors(
  block: any,
  path: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!_.isPlainObject(block)) {
    return;
  }
  const blockType = resolvePublicBlockType(block.type || block.use);
  const blockContext = createRunJsResourceContext(context, getRunJsBlockResourceInit(block, blockType));

  if (blockType === 'jsBlock') {
    collectRunJsSources(block, path, blockContext).forEach((source) => {
      errors.push(
        ...inspectRunJsAuthoringCodeForWrite(
          {
            code: source.code,
            path: source.path,
            modelUse: 'JSBlockModel',
            surfaceStyle: 'render',
          },
          blockContext.runJsSourceBudget,
          blockContext,
        ),
      );
    });
  }
  if (blockType === 'chart') {
    collectChartRawRunJsErrors(
      block.settings,
      `${path}.settings`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
    collectChartLegacyConfigureRunJsErrors(
      block.settings?.configure,
      `${path}.settings.configure`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
  }

  collectFieldListRunJsErrors(block.fields, `${path}.fields`, blockType, blockContext, errors);
  _.castArray(block.fieldGroups || []).forEach((group, groupIndex) => {
    collectFieldListRunJsErrors(
      group?.fields,
      `${path}.fieldGroups[${groupIndex}].fields`,
      blockType,
      blockContext,
      errors,
    );
  });
  collectActionListRunJsErrors(block.actions, `${path}.actions`, blockType, 'actions', blockContext, errors);
  collectActionListRunJsErrors(
    block.recordActions,
    `${path}.recordActions`,
    blockType,
    'recordActions',
    blockContext,
    errors,
  );
  collectReactionRunJsErrors(block.reaction, `${path}.reaction`, errors, blockContext.runJsSourceBudget, blockContext);
  collectFlowRegistryRunJsErrors(
    block.flowRegistry,
    `${path}.flowRegistry`,
    errors,
    blockContext.runJsSourceBudget,
    blockContext,
  );
  collectBlockListRunJsErrors(block.blocks, `${path}.blocks`, blockContext, errors);
  collectBlockListRunJsErrors(block.popup?.blocks, `${path}.popup.blocks`, blockContext, errors);
  collectReactionRunJsErrors(
    block.popup?.reaction,
    `${path}.popup.reaction`,
    errors,
    blockContext.runJsSourceBudget,
    blockContext,
  );

  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[blockType]?.forEach((key) => {
    collectBlockListRunJsErrors(block.settings?.[key]?.blocks, `${path}.settings.${key}.blocks`, blockContext, errors);
    collectReactionRunJsErrors(
      block.settings?.[key]?.reaction,
      `${path}.settings.${key}.reaction`,
      errors,
      blockContext.runJsSourceBudget,
      blockContext,
    );
  });
}

function collectBlockListRunJsErrors(
  blocks: any,
  path: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(blocks)) {
    return;
  }
  blocks.forEach((block, index) => collectBlockRunJsErrors(block, `${path}[${index}]`, context, errors));
}

function collectFieldListRunJsErrors(
  fields: any,
  path: string,
  blockType: string,
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(fields)) {
    return;
  }
  fields.forEach((field, index) => {
    const fieldPath = `${path}[${index}]`;
    if (!_.isPlainObject(field)) {
      return;
    }
    const type = normalizeText(field.type);
    const renderer = normalizeText(field.renderer);
    const modelUse = resolveFieldModelUse(type, renderer, blockType);
    if (modelUse) {
      collectRunJsSources(field, fieldPath, context).forEach((source) => {
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code: source.code,
              path: source.path,
              modelUse,
              surfaceStyle: 'render',
            },
            context.runJsSourceBudget,
            context,
          ),
        );
      });
    }
    collectReactionRunJsErrors(field.reaction, `${fieldPath}.reaction`, errors, context.runJsSourceBudget, context);
    collectActionListRunJsErrors(field.actions, `${fieldPath}.actions`, blockType, 'actions', context, errors);
    collectBlockListRunJsErrors(field.popup?.blocks, `${fieldPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(
      field.popup?.reaction,
      `${fieldPath}.popup.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function collectActionListRunJsErrors(
  actions: any,
  path: string,
  blockType: string,
  slot: 'actions' | 'recordActions',
  context: RunJsAuthoringContext,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!Array.isArray(actions)) {
    return;
  }
  actions.forEach((action, index) => {
    const actionPath = `${path}[${index}]`;
    if (!_.isPlainObject(action)) {
      return;
    }
    const actionType = normalizeActionType(action.type || action.key || action.action || action.use);
    const modelUse = resolveActionModelUse(actionType, blockType, slot);
    if (modelUse) {
      collectRunJsSources(action, actionPath, context).forEach((source) => {
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code: source.code,
              path: source.path,
              modelUse,
              surfaceStyle: resolveModelSurfaceStyle(modelUse),
            },
            context.runJsSourceBudget,
            context,
          ),
        );
      });
    }
    collectReactionRunJsErrors(action.reaction, `${actionPath}.reaction`, errors, context.runJsSourceBudget, context);
    collectBlockListRunJsErrors(action.popup?.blocks, `${actionPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.popup?.reaction,
      `${actionPath}.popup.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
    collectBlockListRunJsErrors(action.openView?.blocks, `${actionPath}.openView.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.openView?.reaction,
      `${actionPath}.openView.reaction`,
      errors,
      context.runJsSourceBudget,
      context,
    );
  });
}

function collectChartAssetRunJsErrors(
  charts: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(charts)) {
    return;
  }
  Object.entries(charts).forEach(([key, asset]) => {
    if (!_.isPlainObject(asset)) {
      return;
    }
    collectChartRawRunJsErrors(
      asset,
      `${path}.${key}`,
      errors,
      budget,
      createRunJsResourceContext(context, getChartBuilderResourceInit(asset)),
    );
  });
}

function collectChartLegacyConfigureRunJsErrors(
  configure: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(configure)) {
    return;
  }
  const chartContext = createRunJsResourceContext(context, getChartBuilderResourceInit(configure));
  const chart = _.isPlainObject(configure.chart) ? configure.chart : undefined;
  const option = _.isPlainObject(chart?.option) ? chart.option : undefined;
  const events = _.isPlainObject(chart?.events) ? chart.events : undefined;
  collectChartOptionRunJsErrors(option?.raw, `${path}.chart.option.raw`, errors, budget, chartContext);
  collectChartEventsRunJsErrors(events?.raw, `${path}.chart.events.raw`, errors, budget, chartContext);
}

function collectChartRawRunJsErrors(
  value: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const chartContext = createRunJsResourceContext(context, getChartBuilderResourceInit(value));
  const visual = _.isPlainObject(value.visual) ? value.visual : undefined;
  const events = _.isPlainObject(value.events) ? value.events : undefined;
  collectChartOptionRunJsErrors(visual?.raw, `${path}.visual.raw`, errors, budget, chartContext);
  collectChartEventsRunJsErrors(events?.raw, `${path}.events.raw`, errors, budget, chartContext);
}

function collectChartOptionRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCodeForWrite(
      {
        code,
        path,
        modelUse: 'ChartOptionModel',
        surfaceStyle: 'value',
      },
      budget,
      context,
    ),
  );
}

function collectChartEventsRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (typeof code !== 'string' || !code.trim()) {
    return;
  }
  errors.push(
    ...inspectRunJsAuthoringCodeForWrite(
      {
        code,
        path,
        modelUse: 'ChartEventsModel',
        surfaceStyle: 'action',
      },
      budget,
      context,
    ),
  );
}

function collectReactionRunJsErrors(
  reaction: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  if (!reaction || (!_.isPlainObject(reaction) && !Array.isArray(reaction))) {
    return;
  }
  const visit = (value: any, valuePath: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${valuePath}[${index}]`));
      return;
    }
    if (!_.isPlainObject(value)) {
      return;
    }
    if (value.source === 'runjs' && typeof value.code === 'string' && value.code.trim()) {
      errors.push(
        ...inspectRunJsAuthoringCodeForWrite(
          {
            code: value.code,
            path: `${valuePath}.code`,
            surface: 'reaction.value-runjs',
            surfaceStyle: 'value',
          },
          budget,
          context,
        ),
      );
    }
    const actionType = normalizeText(value.type || value.name);
    if (actionType === 'runjs' || /runjs/i.test(actionType)) {
      const code =
        typeof value.code === 'string'
          ? value.code
          : typeof value.params?.value?.script === 'string'
            ? value.params.value.script
            : typeof value.params?.code === 'string'
              ? value.params.code
              : '';
      if (code.trim()) {
        const codePath =
          typeof value.code === 'string'
            ? `${valuePath}.code`
            : typeof value.params?.value?.script === 'string'
              ? `${valuePath}.params.value.script`
              : `${valuePath}.params.code`;
        errors.push(
          ...inspectRunJsAuthoringCodeForWrite(
            {
              code,
              path: codePath,
              surface: 'linkage.execute-javascript',
              surfaceStyle: 'action',
            },
            budget,
            context,
          ),
        );
      }
    }
    Object.entries(value).forEach(([key, child]) => {
      if (key === 'code' || key === 'params') {
        return;
      }
      visit(child, `${valuePath}.${key}`);
    });
  };
  visit(reaction, path);
}

function collectFlowRegistryRunJsErrors(
  flowRegistry: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  const registry = asPlainRecord(flowRegistry);
  if (!registry) {
    return;
  }
  Object.entries(registry).forEach(([flowKey, flowValue]) => {
    const flow = asPlainRecord(flowValue);
    if (!flow) {
      return;
    }
    const steps = asPlainRecord(flow.steps) || {};
    Object.entries(steps).forEach(([stepKey, stepValue]) => {
      const step = asPlainRecord(stepValue);
      if (!step || normalizeText(step.use || step.type || step.action || step.key) !== 'runjs') {
        return;
      }
      collectEventFlowRunJsStepErrors(step, `${path}.${flowKey}.steps.${stepKey}`, errors, budget, context);
    });
  });
}

function collectEventFlowRunJsStepErrors(
  step: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
  context: RunJsAuthoringContext = {},
) {
  const addSource = (code: any, sourcePath: string) => {
    if (typeof code !== 'string' || !code.trim()) {
      return;
    }
    errors.push(
      ...inspectRunJsAuthoringCodeForWrite(
        {
          code,
          path: sourcePath,
          surface: 'event-flow.execute-javascript',
          modelUse: 'JSActionModel',
          surfaceStyle: 'action',
        },
        budget,
        context,
      ),
    );
  };

  addSource(step.defaultParams?.code, `${path}.defaultParams.code`);
  addSource(step.params?.code, `${path}.params.code`);
  addSource(step.defaultParams?.value?.script, `${path}.defaultParams.value.script`);
  addSource(step.params?.value?.script, `${path}.params.value.script`);
}

function collectRunJsSources(spec: any, path: string, context: RunJsAuthoringContext): RunJsCodeSource[] {
  const sources: RunJsCodeSource[] = [];
  const settings = _.isPlainObject(spec.settings) ? spec.settings : undefined;
  const addSource = (code: any, sourcePath: string) => {
    if (typeof code === 'string' && code.trim()) {
      sources.push({ code, path: sourcePath });
    }
  };

  addSource(settings?.code, `${path}.settings.code`);
  addSource(settings?.source, `${path}.settings.source`);
  addSource(spec.code, `${path}.code`);
  addSource(spec.source, `${path}.source`);

  if (context.authoringActionName === 'applyBlueprint' && typeof spec.script === 'string' && spec.script.trim()) {
    const scriptKey = spec.script.trim();
    const asset = _.isPlainObject(context.applyBlueprintScriptAssets)
      ? context.applyBlueprintScriptAssets[scriptKey]
      : undefined;
    if (_.isPlainObject(asset) && typeof asset.code === 'string' && asset.code.trim()) {
      sources.push({
        code: asset.code,
        path: `${path}.script`,
      });
    }
  }

  return sources;
}

function parseRunJsAuthoringAst(source: string): { ast?: any; error?: { index: number; message: string } } {
  try {
    return {
      ast: AcornParserWithJsx.parse(source, {
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
        ecmaVersion: 'latest',
        locations: true,
        sourceType: 'script',
      }),
    };
  } catch (error) {
    const acornError = error as Error & { pos?: number };
    return {
      error: {
        index: typeof acornError.pos === 'number' ? acornError.pos : 0,
        message: acornError.message || 'Invalid JavaScript syntax',
      },
    };
  }
}

function collectNestedRunJsErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.nestedRunjsCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'nested-runjs-stop',
        ruleId: 'runjs-nested-runjs-forbidden',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}(...) from authored RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
        },
      }),
    );
  });
}

function collectSurfaceStyleErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  surfaceStyle: RunJsAuthoringSurfaceStyle,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (surfaceStyle === 'value') {
    const render = scan.ctxRenderCalls[0];
    if (render) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'value-surface-forbids-render',
          message: `flowSurfaces authoring ${path} value RunJS must return a value and cannot call ctx.render(...)`,
          modelUse,
          surface,
          index: render.index,
          source,
        }),
      );
    }
    if (!scan.topLevelReturns.length) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'missing-top-level-return',
          message: `flowSurfaces authoring ${path} value RunJS must include a top-level return`,
          modelUse,
          surface,
          index: 0,
          source,
        }),
      );
    }
    return;
  }

  if (surfaceStyle !== 'render') {
    return;
  }

  if (scan.reactComponentCtxRenderCalls.length) {
    scan.reactComponentCtxRenderCalls.forEach((entry) => {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'react-runtime-contract-stop',
          ruleId: 'runjs-react-component-ctx-render-forbidden',
          message: `flowSurfaces authoring ${path} React component ${entry.component} cannot call ctx.render(...) while React is rendering it; return JSX from ${entry.component} and keep ctx.render(<${entry.component} />) on the directly executed render path`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            component: entry.component,
          },
        }),
      );
    });
    return;
  }

  const firstTopLevelRender = scan.topLevelReachableCtxRenderCalls[0];
  const firstTopLevelReturn = scan.topLevelReturns[0];
  if (firstTopLevelRender && (!firstTopLevelReturn || firstTopLevelRender.index < firstTopLevelReturn.index)) {
    return;
  }
  if (firstTopLevelRender && firstTopLevelReturn && firstTopLevelReturn.index < firstTopLevelRender.index) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be reachable before any top-level return`,
        modelUse,
        surface,
        index: firstTopLevelRender.index,
        source,
      }),
    );
    return;
  }
  if (scan.directDomWrites[0]) {
    return;
  }
  if (scan.isTopLevelFunctionWrapper) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-top-level-function-wrapper',
        message: `flowSurfaces authoring ${path} render code cannot hide all render logic inside an uncalled top-level function`,
        modelUse,
        surface,
        index: scan.functionRanges[0]?.start || 0,
        source,
      }),
    );
    return;
  }
  if (scan.ctxRenderCalls.length) {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'render-unreachable-render-call',
        message: `flowSurfaces authoring ${path} ctx.render(...) must be on the directly executed top-level path`,
        modelUse,
        surface,
        index: scan.ctxRenderCalls[0].index,
        source,
      }),
    );
    return;
  }
  errors.push(
    buildRunJsAuthoringError({
      path,
      repairClass: 'replace-innerhtml-with-render',
      ruleId: 'runjs-render-required',
      message: `flowSurfaces authoring ${path} render JS surfaces must call ctx.render(...) from reachable top-level code`,
      modelUse,
      surface,
      index: 0,
      source,
    }),
  );
}

function collectResourceApiErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (!scan.nestedRunjsCalls.length) {
    scan.ctxRunjsCalls.forEach((entry) => {
      const endpoint = getResourceLikeCtxRunjsEntrypoint(source, scan.masked, entry.index);
      if (!endpoint) {
        return;
      }
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'switch-to-resource-api',
          message: `flowSurfaces authoring ${path} must use resource APIs for collection access; ctx.runjs(...) executes JavaScript strings, not resource endpoints`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: 'ctx.runjs',
            endpoint,
          },
        }),
      );
    });
  }
  scan.ctxRequestCalls.forEach((entry) => {
    if (!isResourceLikeCtxRequest(source, scan.masked, entry.index)) {
      return;
    }
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        message: `flowSurfaces authoring ${path} must use resource APIs instead of ctx request APIs for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.invalidApiResourceCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'switch-to-resource-api',
        ruleId: 'runjs-api-resource-call-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.match}(...); use resource APIs or ctx.request(...) for collection access`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
          method: entry.method,
        },
      }),
    );
  });
}

function collectResourceRuntimeErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  if (modelUse === 'JSBlockModel') {
    scan.resourceCallsInReactHooks.forEach((entry) => {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'resource-runtime-contract-stop',
          ruleId: 'runjs-jsblock-resource-hook-forbidden',
          message: `flowSurfaces authoring ${path} cannot use ${entry.capability} inside React Hook ${entry.hook}(...) in JSBlock render code; load resource data before ctx.render(...) and pass values into the rendered component`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            hook: entry.hook,
          },
        }),
      );
    });
    scan.sharedCtxResourceCallsInFunctions.forEach((entry) => {
      const functionScope = entry.functionName
        ? ` inside function '${entry.functionName}'`
        : ' inside a nested function';
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'resource-runtime-contract-stop',
          ruleId: 'runjs-jsblock-shared-resource-helper-forbidden',
          message: `flowSurfaces authoring ${path} cannot use ${entry.capability}${functionScope} in JSBlock render code; ctx.initResource reuses ctx.resource across calls and can retain stale request params. Use a local ctx.makeResource(...) resource inside the helper instead`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            capability: entry.capability,
            functionName: entry.functionName,
          },
        }),
      );
    });
  }
  scan.invalidResourceTypeCalls.forEach((entry) => {
    const message =
      entry.ruleId === 'runjs-make-resource-type-invalid'
        ? `flowSurfaces authoring ${path} ${entry.capability}(...) expects a FlowResource class name, not collection '${entry.resourceType}'`
        : `flowSurfaces authoring ${path} cannot validate dynamic ${entry.capability}(...) resource type '${entry.expression}'`;
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: entry.ruleId,
        message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          expression: entry.expression,
          resourceType: entry.resourceType,
        },
      }),
    );
  });
  scan.invalidFlowResourceMethodCalls.forEach((entry) => {
    const suggestedMethod = entry.suggestedMethod ? `; use ${entry.suggestedMethod}(...) instead` : '';
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-flow-resource-method-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}(...); FlowResource method '${entry.method}' is not supported${suggestedMethod}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          method: entry.method,
          resourceType: entry.resourceType,
          suggestedMethod: entry.suggestedMethod,
        },
      }),
    );
  });
  scan.invalidFlowResourceListCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: 'runjs-flow-resource-list-method-invalid',
        message: `flowSurfaces authoring ${path} cannot call ${entry.capability}; FlowResource instances fetch through refresh() and expose getData()/getMeta()`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          method: 'list',
        },
      }),
    );
  });
  scan.invalidResourceFilterCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'resource-runtime-contract-stop',
        ruleId: entry.ruleId,
        message: entry.message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          resourceType: entry.resourceType,
          dataSourceKey: entry.dataSourceKey,
          collectionName: entry.collectionName,
          fieldInterface: entry.fieldInterface,
          fieldPath: entry.fieldPath,
          fieldType: entry.fieldType,
          operator: entry.operator,
          unsupportedKeys: entry.unsupportedKeys,
          suggestedOperator: entry.suggestedOperator,
          suggestedValue: entry.suggestedValue,
          examples: entry.examples,
          availableFields: entry.availableFields,
        },
      }),
    );
  });
}

function collectReactRuntimeErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.topLevelReactHookCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-hook-top-level-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React Hook ${entry.hook}(...) from top-level RunJS code`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          hook: entry.hook,
          capability: entry.match,
        },
      }),
    );
  });
  scan.unboundReactCreateElementCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-global-unbound',
        message: `flowSurfaces authoring ${path} cannot use bare React.createElement(...) without binding React from ctx.React`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'React.createElement',
        },
      }),
    );
  });
  scan.invalidReactRuntimeBindings.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: entry.ruleId,
        message: `flowSurfaces authoring ${path} cannot bind ${entry.binding} from ${entry.capability}; bind React with "const React = ctx.React" before using JSX or React.createElement`,
        modelUse,
        surface,
        index: entry.declarationStart ?? entry.start,
        source,
        details: {
          binding: entry.binding,
          capability: entry.capability,
          repairClass: 'react-runtime-contract-stop',
        },
      }),
    );
  });
  scan.reactComponentFunctionCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-call-forbidden',
        message: `flowSurfaces authoring ${path} cannot call React component ${entry.component} as a plain function`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.reactAsyncComponentReferences.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-async-component-forbidden',
        message: `flowSurfaces authoring ${path} cannot render async function ${entry.component} as a React component because React receives a Promise`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.ctxRenderComponentSignatureCalls.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-render-component-signature-invalid',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} directly to ctx.render(...)`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
        },
      }),
    );
  });
  scan.reactComponentPropReferences.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'react-runtime-contract-stop',
        ruleId: 'runjs-react-component-prop-node-required',
        message: `flowSurfaces authoring ${path} cannot pass React component ${entry.component} as ${entry.prop}; create a React element first`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          component: entry.component,
          prop: entry.prop,
        },
      }),
    );
  });
}

function collectDirectDomErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.directDomAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} cannot alias ctx.element in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: 'ctx.element',
          alias: entry.alias,
        },
      }),
    );
  });
  scan.directDomWrites.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'replace-innerhtml-with-render',
        ruleId: 'runjs-direct-dom-render-forbidden',
        message: `flowSurfaces authoring ${path} must render through ctx.render(...) instead of direct DOM writes`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.match,
        },
      }),
    );
  });
}

function collectGlobalErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.windowDocumentNavigatorAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        message: `flowSurfaces authoring ${path} cannot alias forbidden global ${entry.root}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.root,
          alias: entry.alias,
        },
      }),
    );
  });
  scan.windowDocumentNavigatorUses.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        ruleId: `runjs-${entry.root}-property-blocked`,
        message: `flowSurfaces authoring ${path} cannot access ${entry.root}.${entry.member} in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.root,
          member: entry.member,
        },
      }),
    );
  });
  scan.forbiddenBareGlobals.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'blocked-global-stop',
        message: `flowSurfaces authoring ${path} cannot access forbidden global ${entry.name}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          global: entry.name,
        },
      }),
    );
  });
}

function collectCtxContractErrors(
  path: string,
  source: string,
  scan: ReturnType<typeof scanJavaScriptSource>,
  modelUse: string,
  surface: string,
  errors: FlowSurfaceErrorItemInput[],
) {
  scan.ctxAliases.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-ctx-root-unknown',
        message: `flowSurfaces authoring ${path} cannot alias ctx in RunJS`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          member: entry.alias,
        },
      }),
    );
  });
  scan.ctxLibMemberCaseMismatches.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-libs-member-mismatch-stop',
        ruleId: 'runjs-ctx-libs-member-case-invalid',
        message: `flowSurfaces authoring ${path} ${entry.capability} is not a valid RunJS library key; use ${entry.expectedCapability} because ctx.libs keys are case-sensitive`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          accessKind: entry.accessKind,
          capability: entry.capability,
          expectedCapability: entry.expectedCapability,
          expectedMember: entry.expectedMember,
          member: entry.member,
        },
      }),
    );
  });
  scan.invalidCtxLibMemberAccesses.forEach((entry) => {
    const importHint = entry.suggestedImport
      ? `; import it with await ctx.importAsync('${entry.suggestedImport}') instead`
      : '';
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-libs-member-mismatch-stop',
        ruleId: entry.ruleId,
        message: `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.libs.${entry.library} member${importHint}`,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          accessKind: entry.accessKind,
          capability: entry.capability,
          library: entry.library,
          member: entry.member,
          suggestedImport: entry.suggestedImport,
        },
      }),
    );
  });
  scan.invalidCtxApiMemberAccesses.forEach((entry) => {
    const message =
      entry.ruleId === 'runjs-ctx-api-member-dynamic-unresolved'
        ? `flowSurfaces authoring ${path} cannot validate dynamic ${entry.capability} access`
        : entry.ruleId === 'runjs-ctx-api-auth-member-readonly'
          ? `flowSurfaces authoring ${path} cannot write readonly RunJS ${entry.capability}; read ctx.api.auth.locale, role, token, or authenticator without mutating them`
          : entry.ruleId === 'runjs-ctx-api-auth-member-unsupported'
            ? `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.api.auth member; read ctx.api.auth.locale, role, token, or authenticator instead`
            : `flowSurfaces authoring ${path} ${entry.capability} is not a supported RunJS ctx.api member; use ctx.request(...), ctx.api.request(...), ctx.api.resource(...), or readonly ctx.api.auth fields`;
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: entry.ruleId,
        message,
        modelUse,
        surface,
        index: entry.index,
        source,
        details: {
          capability: entry.capability,
          member: entry.member,
        },
      }),
    );
  });
  scan.dynamicCtxAccesses.forEach((entry) => {
    errors.push(
      buildRunJsAuthoringError({
        path,
        repairClass: 'ctx-root-mismatch-stop',
        ruleId: 'runjs-dynamic-ctx-member-unresolved',
        message: `flowSurfaces authoring ${path} cannot validate dynamic ctx[...] access`,
        modelUse,
        surface,
        index: entry.index,
        source,
      }),
    );
  });
  scan.ctxMemberAccesses.forEach((entry) => {
    const blocked = BLOCKED_CTX_CAPABILITIES[entry.member];
    if (blocked) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'blocked-capability-reroute',
          message: `flowSurfaces authoring ${path} ${blocked.capability} must be configured outside RunJS`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: blocked,
        }),
      );
      return;
    }
    if (!isAllowedCtxRoot(entry.member, modelUse)) {
      errors.push(
        buildRunJsAuthoringError({
          path,
          repairClass: 'ctx-root-mismatch-stop',
          message: `flowSurfaces authoring ${path} ctx.${entry.member} is not a supported RunJS ctx root`,
          modelUse,
          surface,
          index: entry.index,
          source,
          details: {
            member: entry.member,
          },
        }),
      );
    }
  });
}

function isAllowedCtxRoot(member: string, modelUse: string) {
  return (
    ALLOWED_CTX_ROOTS.has(member) ||
    ((modelUse === 'ChartOptionModel' || modelUse === 'ChartEventsModel') && CHART_CTX_ROOTS.has(member))
  );
}

function scanJavaScriptSource(source: string, ast?: any, context: RunJsAuthoringContext = {}) {
  const masked = maskJavaScriptSource(source);
  const functionRanges = findFunctionRanges(masked);
  const blockRanges = collectBraceRanges(masked);
  const staticBlockRanges = collectStaticBlockRanges(masked);
  const sourceBindings = collectSourceBindings(masked, functionRanges, blockRanges, staticBlockRanges);
  const stringLiteralBindings = collectStringLiteralBindings(source, masked, sourceBindings);
  const astInspection = ast ? inspectRunJsAst(ast, source, stringLiteralBindings, context) : undefined;
  const ctxRenderCalls = findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g, sourceBindings);
  const topLevelCtxRenderCalls = ctxRenderCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges));
  const topLevelReachableCtxRenderCalls = astInspection
    ? dedupeIndexedEntries(astInspection.topLevelReachableCtxRenderCalls).sort(
        (left, right) => left.index - right.index,
      )
    : topLevelCtxRenderCalls;
  const topLevelReturns = findMatches(masked, /\breturn\b/g).filter(
    (entry) => !isInsideRanges(entry.index, functionRanges),
  );
  const ctxRunjsCalls = findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.|\.)\s*runjs\s*(?:\?\.)?\(/g, sourceBindings);
  const ctxRequestCalls = findUnboundCtxMatches(
    masked,
    /\bctx\s*(?:\?\.|\.)\s*(?:api\s*(?:\?\.|\.)\s*)?request\s*(?:\?\.)?\(/g,
    sourceBindings,
  );
  const reactHookCalls = collectReactHookCalls(masked, sourceBindings);
  const reactComponentAliases = collectReactComponentAliases(masked, sourceBindings);
  const flowResourceAliases = collectFlowResourceAliases(masked, sourceBindings);
  const directDomWrites = collectDirectDomWrites(source, masked, sourceBindings);
  const directDomAliases = collectDirectDomAliases(masked, sourceBindings);
  const windowDocumentNavigatorUses = collectWindowDocumentNavigatorUses(source, masked, sourceBindings);
  const windowDocumentNavigatorAliases = collectWindowDocumentNavigatorAliases(masked, sourceBindings);
  const ctxAliases = collectCtxAliases(masked, sourceBindings);
  const forbiddenBareGlobals = collectForbiddenBareGlobals(masked, sourceBindings);
  return {
    source,
    masked,
    functionRanges,
    blockRanges,
    sourceBindings,
    ctxRenderCalls,
    topLevelCtxRenderCalls,
    topLevelReachableCtxRenderCalls,
    topLevelReturns,
    ctxRunjsCalls,
    nestedRunjsCalls: astInspection?.nestedRunjsCalls || ctxRunjsCalls,
    invalidReactRuntimeBindings: astInspection?.invalidReactRuntimeBindings || [],
    ctxRequestCalls,
    invalidApiResourceCalls: dedupeIndexedEntries([
      ...collectInvalidApiResourceCalls(source, masked, sourceBindings),
      ...(astInspection?.invalidApiResourceCalls || []),
    ]).sort((left, right) => left.index - right.index),
    invalidResourceTypeCalls:
      astInspection?.invalidResourceTypeCalls ||
      collectInvalidResourceTypeCalls(source, masked, stringLiteralBindings, sourceBindings),
    invalidFlowResourceListCalls: dedupeIndexedEntries([
      ...collectInvalidFlowResourceListCalls(masked, flowResourceAliases, sourceBindings),
      ...(astInspection?.invalidFlowResourceListCalls || []),
    ]).sort((left, right) => left.index - right.index),
    invalidFlowResourceMethodCalls: astInspection?.invalidFlowResourceMethodCalls || [],
    invalidResourceFilterCalls: astInspection?.invalidResourceFilterCalls || [],
    resourceCallsInReactHooks: collectResourceCallsInReactHooks(source, masked, reactHookCalls, sourceBindings),
    topLevelReactHookCalls: reactHookCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges)),
    unboundReactCreateElementCalls: collectUnboundReactCreateElementCalls(masked, sourceBindings),
    reactComponentFunctionCalls: collectReactComponentFunctionCalls(masked, reactComponentAliases, sourceBindings),
    reactAsyncComponentReferences: astInspection?.reactAsyncComponentReferences || [],
    reactComponentCtxRenderCalls: astInspection?.reactComponentCtxRenderCalls || [],
    sharedCtxResourceCallsInFunctions: astInspection?.sharedCtxResourceCallsInFunctions || [],
    ctxRenderComponentSignatureCalls: collectCtxRenderComponentSignatureCalls(
      source,
      masked,
      reactComponentAliases,
      sourceBindings,
    ),
    reactComponentPropReferences: collectReactComponentPropReferences(
      source,
      masked,
      reactComponentAliases,
      sourceBindings,
    ),
    directDomWrites,
    directDomAliases,
    windowDocumentNavigatorUses,
    windowDocumentNavigatorAliases,
    ctxAliases,
    ctxLibMemberCaseMismatches: collectCtxLibMemberCaseMismatches(source, masked, sourceBindings),
    invalidCtxApiMemberAccesses: astInspection?.invalidCtxApiMemberAccesses || [],
    invalidCtxLibMemberAccesses: astInspection?.invalidCtxLibMemberAccesses || [],
    forbiddenBareGlobals,
    ctxMemberAccesses: collectCtxMemberAccesses(masked, sourceBindings),
    dynamicCtxAccesses: findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.\s*)?\[/g, sourceBindings),
    isTopLevelFunctionWrapper: isTopLevelFunctionWrapper(masked, functionRanges, topLevelReachableCtxRenderCalls),
  };
}

function inspectRunJsAst(
  ast: any,
  source: string,
  stringBindings: StringLiteralBinding[],
  context: RunJsAuthoringContext = {},
): RunJsAstInspection {
  const identifierBindings = collectAstIdentifierBindingsFromAst(ast, source);
  const functionBindings = collectAstFunctionBindingsFromAst(ast, source);
  const aliases = collectCtxMethodAliasesFromAst(ast, source, identifierBindings);
  const ctxRootAliases = collectCtxRootAliasesFromAst(ast, source, identifierBindings);
  const ctxApiAliases = collectCtxApiAliasesFromAst(ast, source, identifierBindings);
  const ctxLibsRootAliases = collectCtxLibsRootAliasesFromAst(ast, source, identifierBindings);
  const ctxLibAliases = collectCtxLibAliasesFromAst(ast, source, ctxLibsRootAliases, identifierBindings);
  const ctxApiResourceAliases = collectCtxApiResourceAliasesFromAst(ast, source, ctxApiAliases, identifierBindings);
  const reactNamespaceAliases = collectReactNamespaceAliasesFromAst(ast, source, identifierBindings, ctxRootAliases);
  const reactDefaultAliases = collectReactDefaultAliasesFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
  );
  const invalidReactRuntimeBindings = collectAstInvalidReactRuntimeBindingsFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
    reactDefaultAliases,
  );
  const reactCreateElementAliases = collectReactCreateElementAliasesFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
    ctxRootAliases,
  );
  const asyncComponentBindings = collectReactAsyncComponentBindingsFromAst(ast, source, identifierBindings);
  const staticStringBindings = [...stringBindings, ...collectStaticStringBindingsFromAst(ast, source)];
  const flowResourceAliases = collectAstFlowResourceAliasesFromAst(
    ast,
    source,
    aliases,
    staticStringBindings,
    identifierBindings,
  );
  const nestedRunjsCalls: RunJsAstInspection['nestedRunjsCalls'] = [];
  const invalidCtxApiMemberAccesses: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [
    ...collectAstInvalidCtxApiPatternAccesses(ast, ctxApiAliases, identifierBindings),
  ];
  const invalidCtxLibMemberAccesses: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [
    ...collectAstInvalidCtxLibPatternAccesses(ast, ctxLibAliases, ctxLibsRootAliases, identifierBindings, source),
  ];
  const invalidApiResourceCalls: RunJsAstInspection['invalidApiResourceCalls'] = [];
  const invalidResourceTypeCalls: RunJsAstInspection['invalidResourceTypeCalls'] = [];
  const invalidFlowResourceListCalls: RunJsAstInspection['invalidFlowResourceListCalls'] = [];
  const invalidFlowResourceMethodCalls: RunJsAstInspection['invalidFlowResourceMethodCalls'] = [];
  const invalidResourceFilterCalls = collectAstInvalidResourceFilterCalls(
    ast,
    source,
    flowResourceAliases,
    identifierBindings,
    aliases,
    staticStringBindings,
    context,
  );
  const reactAsyncComponentReferences: RunJsAstInspection['reactAsyncComponentReferences'] = [];
  const topLevelReachableCtxRenderCalls = collectAstTopLevelReachableCtxRenderCallsFromAst(
    ast,
    aliases,
    identifierBindings,
    functionBindings,
  );
  const reactComponentCtxRenderCalls = collectAstReactComponentCtxRenderCallsFromAst(
    topLevelReachableCtxRenderCalls,
    aliases,
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
  );
  const sharedCtxResourceCallsInFunctions = collectAstSharedCtxResourceCallsInFunctions(
    ast,
    source,
    aliases,
    identifierBindings,
  );

  walkAstSimple(ast, {
    CallExpression(node: any) {
      const method = resolveCtxMethodCall(node, aliases, identifierBindings);
      if (method) {
        if (method.method === 'runjs') {
          nestedRunjsCalls.push({
            capability: method.capability,
            index: node.start || 0,
          });
          return;
        }
        if (method.method === 'makeResource' || method.method === 'initResource') {
          invalidResourceTypeCalls.push(
            ...collectAstInvalidResourceTypeCall(
              node,
              method.method,
              method.capability,
              source,
              staticStringBindings,
              identifierBindings,
            ),
          );
        }
      }
      const flowResourceMethodCall = collectAstInvalidFlowResourceMethodCall(
        node,
        flowResourceAliases,
        source,
        identifierBindings,
        aliases,
        staticStringBindings,
      );
      flowResourceMethodCall.invalidListCalls.forEach((entry) => invalidFlowResourceListCalls.push(entry));
      flowResourceMethodCall.invalidMethodCalls.forEach((entry) => invalidFlowResourceMethodCalls.push(entry));
      collectAstInvalidApiResourceCall(node, ctxApiAliases, ctxApiResourceAliases, source, identifierBindings).forEach(
        (entry) => invalidApiResourceCalls.push(entry),
      );
      collectAstReactAsyncComponentReferences(
        node,
        asyncComponentBindings,
        reactCreateElementAliases,
        identifierBindings,
      ).forEach((entry) => reactAsyncComponentReferences.push(entry));
    },
    MemberExpression(node: any) {
      const invalidCtxLibAccess = collectAstInvalidCtxLibMemberAccess(
        node,
        ctxLibAliases,
        ctxLibsRootAliases,
        identifierBindings,
        source,
      );
      if (invalidCtxLibAccess) {
        invalidCtxLibMemberAccesses.push(invalidCtxLibAccess);
      }
      const invalidCtxApiAccess = collectAstInvalidCtxApiMemberAccess(node, ctxApiAliases, identifierBindings, source);
      if (invalidCtxApiAccess) {
        invalidCtxApiMemberAccesses.push(invalidCtxApiAccess);
      }
    },
    AssignmentExpression(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    UpdateExpression(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.argument, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    UnaryExpression(node: any) {
      if (node.operator !== 'delete') {
        return;
      }
      collectAstInvalidCtxApiReadonlyWrites(node.argument, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    ForInStatement(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
    ForOfStatement(node: any) {
      collectAstInvalidCtxApiReadonlyWrites(node.left, ctxApiAliases, identifierBindings).forEach((entry) =>
        invalidCtxApiMemberAccesses.push(entry),
      );
    },
  });

  const dedupedInvalidApiResourceCalls = dedupeIndexedEntries(invalidApiResourceCalls).sort(
    (left, right) => left.index - right.index,
  );

  return {
    invalidApiResourceCalls: dedupedInvalidApiResourceCalls,
    invalidCtxApiMemberAccesses: filterInvalidCtxApiMemberAccessesForResourceCalls(
      dedupeIndexedEntries(invalidCtxApiMemberAccesses),
      dedupedInvalidApiResourceCalls,
    ).sort((left, right) => left.index - right.index),
    invalidCtxLibMemberAccesses: dedupeIndexedEntries(invalidCtxLibMemberAccesses).sort(
      (left, right) => left.index - right.index,
    ),
    invalidResourceTypeCalls: dedupeAstResourceEntries(invalidResourceTypeCalls),
    invalidFlowResourceListCalls: dedupeIndexedEntries(invalidFlowResourceListCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidFlowResourceMethodCalls: dedupeIndexedEntries(invalidFlowResourceMethodCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidResourceFilterCalls: dedupeIndexedEntries(invalidResourceFilterCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidReactRuntimeBindings: dedupeIndexedEntries(invalidReactRuntimeBindings).sort(
      (left, right) => left.start - right.start,
    ),
    nestedRunjsCalls: dedupeIndexedEntries(nestedRunjsCalls).sort((left, right) => left.index - right.index),
    reactAsyncComponentReferences: dedupeIndexedEntries(reactAsyncComponentReferences).sort(
      (left, right) => left.index - right.index,
    ),
    reactComponentCtxRenderCalls,
    sharedCtxResourceCallsInFunctions,
    topLevelReachableCtxRenderCalls,
  };
}

function collectCtxRootAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxRootAlias[] {
  const aliases: CtxRootAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, node: any, ancestors: any[], isVar = false, scopeOverride?: SourceRange) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: 'ctx',
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator) || node.left?.type !== 'Identifier') {
        return;
      }
      if (isCtxRootFromAst(node.right, getActiveAliases(), identifierBindings)) {
        addAlias(
          node.left.name,
          node,
          ancestors,
          false,
          getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
        );
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isCtxRootFromAst(node.init, getActiveAliases(), identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addAlias(node.id.name, node, ancestors, declaration?.kind === 'var');
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectCtxMethodAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxMethodAlias[] {
  const aliases: CtxMethodAlias[] = [];
  const addAlias = (name: string, method: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: `ctx.${method}`,
      method,
      name,
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const method = getCtxMethodName(node.right, identifierBindings);
      if (method) {
        addAlias(node.left.name, method, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const method = getCtxMethodName(node.init, identifierBindings);
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier' && method) {
        addAlias(node.id.name, method, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.init, identifierBindings)) {
        collectAstObjectPatternAliases(node.id, (name, member, aliasNode) => {
          if (AST_CTX_METHOD_NAMES.has(member)) {
            addAlias(name, member, aliasNode || node, ancestors, isVar);
          }
        });
      }
    },
  });

  return aliases;
}

function collectCtxApiAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias[] {
  const aliases: CtxApiAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: CtxApiAlias['capability'],
    node: any,
    ancestors: any[],
    isVar = false,
  ) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimCtxApiAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const capability =
        getCtxApiCapabilityFromAst(node.right, activeAliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.right, activeAliases, identifierBindings);
      if (node.left?.type === 'Identifier' && capability) {
        addAlias(node.left.name, capability, node, ancestors);
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxApiObjectPatternAliases(node.left, capability, (name, aliasCapability, aliasNode) => {
          addAlias(name, aliasCapability, aliasNode || node, ancestors);
        });
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      const activeAliases = getActiveAliases();
      const capability =
        getCtxApiCapabilityFromAst(node.init, activeAliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.init, activeAliases, identifierBindings);
      if (node.id?.type === 'Identifier' && capability) {
        addAlias(node.id.name, capability, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxApiObjectPatternAliases(node.id, capability, (name, aliasCapability, aliasNode) => {
          addAlias(name, aliasCapability, aliasNode || node, ancestors, isVar);
        });
      }
    },
  });

  return trimCtxApiAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectCtxApiObjectPatternAliases(
  pattern: any,
  capability: CtxApiCapability | '',
  addAlias: (name: string, capability: CtxApiCapability, node?: any) => void,
) {
  if (capability === 'ctx.api') {
    for (const property of pattern?.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      const alias = getAstBindingIdentifierName(property.value);
      const aliasNode = getAstBindingIdentifierNode(property.value);
      if (member && alias && RUNJS_CTX_API_ALLOWED_MEMBERS.has(member)) {
        addAlias(alias, `ctx.api.${member}` as CtxApiCapability, aliasNode);
      }
      if (member === 'auth') {
        const nestedPattern = getAstObjectPatternFromValue(property.value);
        if (nestedPattern) {
          collectCtxApiObjectPatternAliases(nestedPattern, 'ctx.api.auth', addAlias);
        }
      }
    }
    return;
  }
  if (capability === 'ctx.api.auth') {
    collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
      if (RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(member)) {
        addAlias(name, `ctx.api.auth.${member}` as CtxApiCapability, aliasNode);
      }
    });
  }
}

function trimCtxApiAliasesAfterWrites(
  aliases: CtxApiAlias[],
  writes: Array<{ alwaysRunsInExecutionScope: boolean; executionScope: SourceRange; index: number; name: string }>,
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias[] {
  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectCtxLibsRootAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): CtxLibsRootAlias[] {
  const aliases: CtxLibsRootAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: 'ctx.libs',
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      if (
        node.left?.type === 'Identifier' &&
        isCtxLibsRootFromAst(node.right, getActiveAliases(), identifierBindings)
      ) {
        addAlias(node.left.name, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isCtxLibsRootFromAst(node.init, getActiveAliases(), identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addAlias(node.id.name, node, ancestors, declaration?.kind === 'var');
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectCtxLibAliasesFromAst(
  ast: any,
  source: string,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxLibAlias[] {
  const aliases: CtxLibAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (name: string, library: string, capability: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      library,
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const sourcePath = getCtxLibMemberPathFromAst(node.right, activeAliases, rootAliases, identifierBindings, source);
      if (
        node.left?.type === 'Identifier' &&
        sourcePath &&
        !sourcePath.hasDynamicMember &&
        !sourcePath.members.length
      ) {
        addAlias(node.left.name, sourcePath.library, sourcePath.rootCapability, node, ancestors);
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxLibObjectPatternAliases(
          node.left,
          node.right,
          rootAliases,
          identifierBindings,
          (name, alias, aliasNode) => {
            addAlias(name, alias.library, alias.capability, aliasNode || node, ancestors);
          },
        );
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      const activeAliases = getActiveAliases();
      const sourcePath = getCtxLibMemberPathFromAst(node.init, activeAliases, rootAliases, identifierBindings, source);
      if (node.id?.type === 'Identifier' && sourcePath && !sourcePath.hasDynamicMember && !sourcePath.members.length) {
        addAlias(node.id.name, sourcePath.library, sourcePath.rootCapability, node, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxLibObjectPatternAliases(
          node.id,
          node.init,
          rootAliases,
          identifierBindings,
          (name, alias, aliasNode) => {
            addAlias(name, alias.library, alias.capability, aliasNode || node, ancestors, isVar);
          },
        );
      }
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectCtxLibObjectPatternAliases(
  pattern: any,
  sourceNode: any,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  addAlias: (name: string, alias: { capability: string; library: string }, node?: any) => void,
) {
  if (!isCtxLibsRootFromAst(sourceNode, rootAliases, identifierBindings)) {
    return;
  }
  collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
    if (member) {
      addAlias(name, { capability: `ctx.libs.${member}`, library: member }, aliasNode);
    }
  });
}

function trimAstAliasesAfterWrites<
  T extends SourceRange & { declarationStart?: number; executionScope: SourceRange; name: string },
>(
  aliases: T[],
  writes: Array<{ alwaysRunsInExecutionScope: boolean; executionScope: SourceRange; index: number; name: string }>,
  identifierBindings: AstIdentifierBinding[],
): T[] {
  return aliases.map((alias) => {
    const aliasDeclarationStart = alias.declarationStart ?? alias.start;
    const aliasRootName = getAstAliasRootName(alias.name);
    const nextWrite = writes
      .filter(
        (write) =>
          (write.name === alias.name || (alias.name.includes('.') && write.name === aliasRootName)) &&
          write.index > aliasDeclarationStart &&
          write.index >= alias.start &&
          write.index < alias.end &&
          write.alwaysRunsInExecutionScope &&
          isSameAstRange(write.executionScope, alias.executionScope) &&
          !hasAstShadowBinding(aliasRootName, write.index, alias, identifierBindings),
      )
      .sort((left, right) => left.index - right.index)[0];
    return nextWrite ? { ...alias, end: nextWrite.index } : alias;
  });
}

function collectAstIdentifierWritesFromAst(
  ast: any,
  source: string,
): Array<{ alwaysRunsInExecutionScope: boolean; executionScope: SourceRange; index: number; name: string }> {
  const writes: Array<{
    alwaysRunsInExecutionScope: boolean;
    executionScope: SourceRange;
    index: number;
    name: string;
  }> = [];
  const addLoopHeaderWrites = (target: any, ancestors: any[], fallbackIndex: number) => {
    const executionScope = getAstExecutionScopeRange(ancestors, source.length);
    const alwaysRunsInExecutionScope = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
    collectAstPatternBindingIdentifiers(target, (name, bindingNode) => {
      writes.push({
        alwaysRunsInExecutionScope,
        executionScope,
        name,
        index: typeof bindingNode?.start === 'number' ? bindingNode.start : fallbackIndex,
      });
    });
    collectAstPatternMemberExpressions(target, (memberNode) => {
      const memberWrite = getAstMemberAliasLookup(memberNode);
      if (!memberWrite) {
        return;
      }
      writes.push({
        alwaysRunsInExecutionScope,
        executionScope,
        name: memberWrite.aliasName,
        index: memberWrite.index,
      });
    });
  };
  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstDefiniteAssignmentOperator(node.operator)) {
        return;
      }
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const alwaysRunsInExecutionScope = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      collectAstPatternBindingIdentifiers(node.left, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope,
          executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.start || 0,
        });
      });
      collectAstPatternMemberExpressions(node.left, (memberNode) => {
        const memberWrite = getAstMemberAliasLookup(memberNode);
        if (!memberWrite) {
          return;
        }
        writes.push({
          alwaysRunsInExecutionScope,
          executionScope,
          name: memberWrite.aliasName,
          index: memberWrite.index,
        });
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (!node.init) {
        return;
      }
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const alwaysRunsInExecutionScope = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      collectAstPatternBindingIdentifiers(node.id, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope,
          executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.start || 0,
        });
      });
    },
    UpdateExpression(node: any, ancestors: any[]) {
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const alwaysRunsInExecutionScope = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      if (node.argument?.type === 'Identifier') {
        writes.push({
          alwaysRunsInExecutionScope,
          executionScope,
          name: node.argument.name,
          index: typeof node.argument.start === 'number' ? node.argument.start : node.start || 0,
        });
      }
      collectAstPatternMemberExpressions(node.argument, (memberNode) => {
        const memberWrite = getAstMemberAliasLookup(memberNode);
        if (!memberWrite) {
          return;
        }
        writes.push({
          alwaysRunsInExecutionScope,
          executionScope,
          name: memberWrite.aliasName,
          index: memberWrite.index,
        });
      });
    },
    ForInStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForInSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      addLoopHeaderWrites(node.left, ancestors, node.left?.start || node.start || 0);
    },
    ForOfStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForOfSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      addLoopHeaderWrites(node.left, ancestors, node.left?.start || node.start || 0);
    },
  });
  return writes;
}

function isAstDefinitelyNonEmptyForInSource(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ObjectExpression') {
    return (unwrapped.properties || []).some(isAstDefinitelyEnumerableObjectProperty);
  }
  return false;
}

function isAstDefinitelyNonEmptyForOfSource(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ArrayExpression') {
    return (unwrapped.elements || []).some(isAstDefinitelyNonEmptyArrayElement);
  }
  return false;
}

function getAstLoopPatternTarget(left: any) {
  if (left?.type === 'VariableDeclaration') {
    return left.declarations?.length === 1 ? left.declarations[0]?.id : undefined;
  }
  return left;
}

function isAstForOfLoopVariableDeclaratorWithSourceTargets<T extends AstCapabilityAlias>(
  node: any,
  ancestors: any[],
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const declaration = ancestors[ancestors.length - 2];
  const loop = ancestors[ancestors.length - 3];
  return (
    declaration?.type === 'VariableDeclaration' &&
    loop?.type === 'ForOfStatement' &&
    loop.left === declaration &&
    declaration.declarations?.length === 1 &&
    declaration.declarations[0] === node &&
    hasAstForOfSourceTargets(loop.right, aliases, identifierBindings)
  );
}

function hasAstForOfSourceTargets<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  let hasSourceTarget = false;
  collectAstForOfSourceTargets(sourceNode, aliases, identifierBindings, () => {
    hasSourceTarget = true;
  });
  return hasSourceTarget;
}

function collectAstForOfSourceTargets<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (sourceTarget: any) => void,
) {
  const seenTargets = new Set<string>();
  const emitSourceTarget = (sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const key = sourceTarget.aliasName
      ? `${sourceTarget.aliasName}@${sourceTarget.index || 0}`
      : sourceTarget.node
        ? `${sourceTarget.node.start || 0}:${sourceTarget.node.end || 0}`
        : `source:${sourceTarget.index || 0}`;
    if (seenTargets.has(key)) {
      return;
    }
    seenTargets.add(key);
    visit(sourceTarget);
  };
  const collectSourceTargets = (node: any) => {
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return;
    }
    if (unwrapped.type === 'ConditionalExpression') {
      collectSourceTargets(unwrapped.consequent);
      collectSourceTargets(unwrapped.alternate);
      return;
    }
    if (unwrapped.type === 'LogicalExpression') {
      collectSourceTargets(unwrapped.left);
      collectSourceTargets(unwrapped.right);
      return;
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      collectSourceTargets(expressions[expressions.length - 1]);
      return;
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      collectSourceTargets(unwrapped.right);
      return;
    }
    if (unwrapped.type === 'ArrayExpression') {
      for (const element of unwrapped.elements || []) {
        if (!element) {
          continue;
        }
        if (element.type === 'SpreadElement') {
          collectSourceTargets(element.argument);
          continue;
        }
        emitSourceTarget(createAstPatternSourceTarget(element));
      }
      return;
    }
    const sourceTarget = createAstPatternSourceTarget(unwrapped);
    collectAstForOfSourceTargetElementMembers(sourceTarget, aliases, identifierBindings).forEach((member) => {
      emitSourceTarget(getAstPatternMemberSourceTarget(sourceTarget, member));
    });
  };
  collectSourceTargets(sourceNode);
}

function collectAstForOfSourceTargetElementMembers<T extends AstCapabilityAlias>(
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const members = new Set<string>();
  collectAstRestCarrierAliasCopies(sourceTarget, '__forof__', aliases, identifierBindings, (suffix) => {
    const firstMember = suffix.split('.')[0];
    const numericMember = Number(firstMember);
    if (firstMember === AST_DYNAMIC_MEMBER_ALIAS || (Number.isInteger(numericMember) && numericMember >= 0)) {
      members.add(firstMember);
    }
  });
  return members;
}

function isAstDefinitelyNonEmptyArrayElement(element: any): boolean {
  if (!element) {
    return true;
  }
  if (element.type === 'SpreadElement') {
    return isAstDefinitelyNonEmptyForOfSource(element.argument);
  }
  return true;
}

function isAstDefinitelyEnumerableObjectProperty(property: any) {
  if (!property || property.type === 'SpreadElement' || property.type !== 'Property') {
    return false;
  }
  if (property.computed) {
    return isAstDefinitelyEnumerableComputedObjectKey(property.key);
  }
  const key = property.key;
  const isProtoSetter =
    !property.method &&
    !property.shorthand &&
    (property.kind || 'init') === 'init' &&
    ((key?.type === 'Identifier' && key.name === '__proto__') ||
      (key?.type === 'Literal' && key.value === '__proto__'));
  if (isProtoSetter) {
    // Prototype-setter literals can affect inherited keys, but are not an own enumerable key themselves.
    return false;
  }
  if (key?.type === 'Identifier') {
    return true;
  }
  if (key?.type === 'Literal') {
    return true;
  }
  return true;
}

function isAstDefinitelyEnumerableComputedObjectKey(key: any): boolean {
  const unwrapped = unwrapAstChainExpression(key);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'Literal') {
    return (
      typeof unwrapped.value === 'string' ||
      typeof unwrapped.value === 'number' ||
      typeof unwrapped.value === 'boolean' ||
      typeof unwrapped.value === 'bigint' ||
      unwrapped.value === null
    );
  }
  if (unwrapped.type === 'TemplateLiteral') {
    return (unwrapped.expressions || []).length === 0;
  }
  return false;
}

function collectReactCreateElementAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
): ReactCreateElementAlias[] {
  const aliases: ReactCreateElementAlias[] = [];
  const addAlias = (name: string, capability: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const capability = getReactCreateElementCapabilityFromAst(
        node.right,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
      );
      if (capability) {
        addAlias(node.left.name, capability, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactCreateElementCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternAliases(node.id, (name, member, aliasNode) => {
          if (member === 'createElement') {
            addAlias(name, `${namespace}.createElement`, aliasNode || node, ancestors, isVar);
          }
        });
      }
    },
  });

  return aliases;
}

function collectReactNamespaceAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxRootAliases: CtxRootAlias[],
): ReactNamespaceAlias[] {
  const aliases: ReactNamespaceAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: string,
    node: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    precedenceStart?: number,
  ) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
      ...(typeof precedenceStart === 'number' ? { precedenceStart } : {}),
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      const capability = getReactNamespaceCapabilityFromAst(
        node.right,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (node.left?.type === 'Identifier' && capability) {
        addAlias(
          node.left.name,
          capability,
          node,
          ancestors,
          false,
          getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
        );
        return;
      }
      if (node.left?.type === 'MemberExpression' && capability) {
        const memberAlias = getAstMemberAliasLookup(node.left);
        if (memberAlias) {
          addAlias(
            memberAlias.aliasName,
            capability,
            node.left,
            ancestors,
            false,
            getAstMemberAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
        return;
      }
      if (node.left?.type === 'Identifier') {
        collectReactNamespaceCarrierAliasesFromAst(
          node.left.name,
          node.right,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
          (member, capability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.left.name}.${member}`,
              capability,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
              precedenceStart,
            );
          },
        );
      }
      if (
        node.operator === '=' &&
        node.left?.type === 'ObjectPattern' &&
        isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)
      ) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(
              alias,
              'ctx.React',
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.operator === '=') {
        collectReactNamespacePatternSourceAliasesFromAst(node.left, node.right, ancestors, false);
        collectReactNamespacePatternDefaultAliasesFromAst(node.left, ancestors, false, undefined, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const isVar = node.left?.type === 'VariableDeclaration' && node.left.kind === 'var';
      const activeAliases = getActiveAliases();
      collectAstForOfSourceTargets(node.right, activeAliases, identifierBindings, (loopSourceTarget) => {
        collectReactNamespacePatternSourceTargetAliasesFromAst(target, loopSourceTarget, ancestors, isVar);
        collectReactNamespacePatternDefaultAliasesFromSourceTarget(
          target,
          ancestors,
          isVar,
          undefined,
          loopSourceTarget,
        );
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const activeAliases = getActiveAliases();
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, activeAliases, identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        collectReactNamespaceCarrierAliasesFromAst(
          node.id.name,
          node.init,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
          (member, memberCapability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.id.name}.${member}`,
              memberCapability,
              aliasNode || node,
              ancestors,
              isVar,
              undefined,
              precedenceStart,
            );
          },
        );
        collectReactNamespacePatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(alias, 'ctx.React', aliasNode || node, ancestors, isVar);
          }
        });
      }
      collectReactNamespacePatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
      collectReactNamespacePatternDefaultAliasesFromAst(node.id, ancestors, isVar, undefined, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectReactNamespaceFunctionParamAliasesFromAst(node, ancestors);
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  function collectReactNamespaceFunctionParamAliasesFromAst(node: any, ancestors: any[]) {
    const scope = {
      start: typeof node.start === 'number' ? node.start : 0,
      end: typeof node.end === 'number' ? node.end : source.length,
    };
    const activeAliases = getActiveAliases();
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectReactNamespacePatternDefaultAliasesFromAst(param, ancestors, false, scope);
        continue;
      }
      collectReactNamespacePatternDefaultAliasesFromAst(param.left, ancestors, false, scope, param.right);
      collectReactNamespacePatternSourceAliasesFromAst(param.left, param.right, ancestors, false, scope);
      if (param.left?.type === 'Identifier') {
        const capability = getReactNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(param.left.name, capability, param.left, ancestors, false, scope);
        }
        continue;
      }
      if (param.left?.type === 'ObjectPattern' && isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'React') {
            addAlias(alias, 'ctx.React', aliasNode || param, ancestors, false, scope);
          }
        });
      }
    }
  }

  function collectReactNamespacePatternSourceAliasesFromAst(
    pattern: any,
    sourceNode: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    collectReactNamespacePatternSourceTargetAliasesFromAst(
      pattern,
      createAstPatternSourceTarget(sourceNode),
      ancestors,
      isVar,
      scopeOverride,
    );
  }

  function collectReactNamespacePatternSourceTargetAliasesFromAst(
    pattern: any,
    sourceTarget: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const activeAliases = getActiveAliases();
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const capability = getReactNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (!capability) {
        return;
      }
      addReactNamespaceAliasTarget(target, capability, ancestors, isVar, scopeOverride);
    });
    const collectCarrierTarget = (carrierTarget: {
      sourceAlias?: ReactNamespaceAlias;
      sourceTarget?: any;
      target: any;
      targetAliasName: string;
    }) => {
      if (carrierTarget.sourceAlias) {
        const precedenceStart = getAstAliasPrecedenceStart(carrierTarget.sourceAlias);
        addReactNamespaceAliasByName(
          carrierTarget.targetAliasName,
          carrierTarget.sourceAlias.capability,
          carrierTarget.target,
          ancestors,
          isVar,
          scopeOverride,
          carrierTarget.sourceTarget?.node,
          precedenceStart,
        );
        return;
      }
      const capability = getReactNamespaceCapabilityFromAstPatternSource(
        carrierTarget.sourceTarget,
        identifierBindings,
        activeAliases,
        ctxRootAliases,
      );
      if (!capability) {
        return;
      }
      addReactNamespaceAliasByName(
        carrierTarget.targetAliasName,
        capability,
        carrierTarget.target,
        ancestors,
        isVar,
        scopeOverride,
        carrierTarget.sourceTarget?.node,
      );
    };
    collectAstPatternCarrierSourceTargetsFromSourceTarget(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
    collectAstPatternRestCarrierSourceTargetsRec(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
  }

  function collectReactNamespacePatternDefaultAliasesFromAst(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceNode?: any,
  ) {
    collectReactNamespacePatternDefaultAliasesFromSourceTarget(
      pattern,
      ancestors,
      isVar,
      scopeOverride,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectReactNamespacePatternDefaultAliasesFromSourceTarget(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(sourceTarget, identifierBindings, aliases, ctxRootAliases)
        ) {
          return;
        }
        const activeAliases = getActiveAliases();
        const capability = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          activeAliases,
          ctxRootAliases,
        );
        if (capability && defaultPattern?.type === 'Identifier') {
          addAlias(alias, capability, aliasNode || defaultPattern, ancestors, isVar, scopeOverride);
        }
        if (defaultPattern?.type === 'Identifier') {
          collectReactNamespaceCarrierAliasesFromAst(
            alias,
            valueNode,
            identifierBindings,
            activeAliases,
            ctxRootAliases,
            (member, memberCapability, memberAliasNode, precedenceStart) => {
              addAlias(
                `${alias}.${member}`,
                memberCapability,
                memberAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
                precedenceStart,
              );
            },
          );
        }
        if (
          defaultPattern?.type === 'ObjectPattern' &&
          isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)
        ) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'React') {
              addAlias(
                pathAlias,
                'ctx.React',
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
      },
    );
  }

  function addReactNamespaceAliasTarget(
    target: any,
    capability: string,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    if (unwrapped?.type === 'Identifier') {
      addAlias(
        unwrapped.name,
        capability,
        unwrapped,
        ancestors,
        isVar,
        scopeOverride || getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
      return;
    }
    if (unwrapped?.type === 'MemberExpression') {
      const memberAlias = getAstMemberAliasLookup(unwrapped);
      if (!memberAlias) {
        return;
      }
      addAlias(
        memberAlias.aliasName,
        capability,
        unwrapped,
        ancestors,
        false,
        scopeOverride || getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
    }
  }

  function addReactNamespaceAliasByName(
    name: string,
    capability: string,
    target: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    aliasNode?: any,
    precedenceStart?: number,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    const scope =
      scopeOverride ||
      (unwrapped?.type === 'MemberExpression'
        ? getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings)
        : getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings));
    addAlias(
      name,
      capability,
      unwrapAstChainExpression(aliasNode) || aliasNode || unwrapped || target,
      ancestors,
      isVar,
      scope,
      precedenceStart,
    );
  }
}

function collectReactDefaultAliasesFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
): ReactDefaultAlias[] {
  const aliases: ReactDefaultAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addAlias = (
    name: string,
    capability: string,
    node: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    precedenceStart?: number,
  ) => {
    const scope = scopeOverride || getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability,
      name,
      declarationStart: typeof node.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      start: typeof node.start === 'number' ? node.start : scope.start,
      end: scope.end,
      ...(typeof precedenceStart === 'number' ? { precedenceStart } : {}),
    });
  };
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const activeAliases = getActiveAliases();
      if (node.left?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(
            node.left.name,
            capability,
            node,
            ancestors,
            false,
            getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
        collectReactDefaultCarrierAliasesFromAst(
          node.left.name,
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
          (member, capability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.left.name}.${member}`,
              capability,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
              precedenceStart,
            );
          },
        );
        return;
      }
      const memberAlias = getAstMemberAliasLookup(node.left);
      if (node.left?.type === 'MemberExpression' && memberAlias) {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(
            memberAlias.aliasName,
            capability,
            node.left,
            ancestors,
            false,
            getAstMemberAssignmentTargetScope(node.left, ancestors, source.length, identifierBindings),
          );
        }
      }
      if (
        node.left?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.right, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default') {
            addAlias(
              alias,
              `${namespace}.default`,
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.left?.type === 'ObjectPattern' && isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
            addAlias(
              alias,
              'ctx.React.default',
              aliasNode || node,
              ancestors,
              false,
              getAstAssignmentTargetScope(aliasNode, ancestors, source.length, identifierBindings),
            );
          }
        });
      }
      if (node.operator === '=') {
        collectReactDefaultPatternSourceAliasesFromAst(node.left, node.right, ancestors, false);
        collectReactDefaultPatternDefaultAliasesFromAst(node.left, ancestors, false, undefined, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const isVar = node.left?.type === 'VariableDeclaration' && node.left.kind === 'var';
      const activeAliases = getActiveAliases();
      const sourceTargetAliases = [...namespaceAliases, ...activeAliases];
      collectAstForOfSourceTargets(node.right, sourceTargetAliases, identifierBindings, (loopSourceTarget) => {
        collectReactDefaultPatternSourceTargetAliasesFromAst(target, loopSourceTarget, ancestors, isVar);
        collectReactDefaultPatternDefaultAliasesFromSourceTarget(target, ancestors, isVar, undefined, loopSourceTarget);
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const activeAliases = getActiveAliases();
      const sourceTargetAliases = [...namespaceAliases, ...activeAliases];
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, sourceTargetAliases, identifierBindings)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          getActiveAliases(),
        );
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        collectReactDefaultCarrierAliasesFromAst(
          node.id.name,
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          getActiveAliases(),
          (member, memberCapability, aliasNode, precedenceStart) => {
            addAlias(
              `${node.id.name}.${member}`,
              memberCapability,
              aliasNode || node,
              ancestors,
              isVar,
              undefined,
              precedenceStart,
            );
          },
        );
        collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default') {
            addAlias(alias, `${namespace}.default`, aliasNode || node, ancestors, isVar);
          }
        });
        collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
            addAlias(alias, 'ctx.React.default', aliasNode || node, ancestors, isVar);
          }
        });
      }
      collectReactDefaultPatternSourceAliasesFromAst(node.id, node.init, ancestors, isVar);
      collectReactDefaultPatternDefaultAliasesFromAst(node.id, ancestors, isVar, undefined, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectReactDefaultFunctionParamAliasesFromAst(node, ancestors);
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);

  function collectReactDefaultFunctionParamAliasesFromAst(node: any, ancestors: any[]) {
    const scope = {
      start: typeof node.start === 'number' ? node.start : 0,
      end: typeof node.end === 'number' ? node.end : source.length,
    };
    const activeAliases = getActiveAliases();
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectReactDefaultPatternDefaultAliasesFromAst(param, ancestors, false, scope);
        continue;
      }
      collectReactDefaultPatternDefaultAliasesFromAst(param.left, ancestors, false, scope, param.right);
      collectReactDefaultPatternSourceAliasesFromAst(param.left, param.right, ancestors, false, scope);
      if (param.left?.type === 'Identifier') {
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability) {
          addAlias(param.left.name, capability, param.left, ancestors, false, scope);
        }
        continue;
      }
      if (param.left?.type === 'ObjectPattern') {
        const namespace = getReactNamespaceCapabilityFromAst(
          param.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
            if (members.length === 1 && members[0] === 'default') {
              addAlias(alias, `${namespace}.default`, aliasNode || param, ancestors, false, scope);
            }
          });
        }
        if (isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
              addAlias(alias, 'ctx.React.default', aliasNode || param, ancestors, false, scope);
            }
          });
        }
      }
    }
  }

  function collectReactDefaultPatternSourceAliasesFromAst(
    pattern: any,
    sourceNode: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    collectReactDefaultPatternSourceTargetAliasesFromAst(
      pattern,
      createAstPatternSourceTarget(sourceNode),
      ancestors,
      isVar,
      scopeOverride,
    );
  }

  function collectReactDefaultPatternSourceTargetAliasesFromAst(
    pattern: any,
    sourceTarget: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const activeAliases = getActiveAliases();
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        activeAliases,
      );
      if (!capability) {
        return;
      }
      addReactDefaultAliasTarget(target, capability, ancestors, isVar, scopeOverride);
    });
    const collectCarrierTarget = (carrierTarget: {
      sourceAlias?: ReactDefaultAlias;
      sourceTarget?: any;
      target: any;
      targetAliasName: string;
    }) => {
      if (carrierTarget.sourceAlias) {
        const precedenceStart = getAstAliasPrecedenceStart(carrierTarget.sourceAlias);
        addReactDefaultAliasByName(
          carrierTarget.targetAliasName,
          carrierTarget.sourceAlias.capability,
          carrierTarget.target,
          ancestors,
          isVar,
          scopeOverride,
          carrierTarget.sourceTarget?.node,
          precedenceStart,
        );
        return;
      }
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        carrierTarget.sourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        activeAliases,
      );
      if (!capability) {
        return;
      }
      addReactDefaultAliasByName(
        carrierTarget.targetAliasName,
        capability,
        carrierTarget.target,
        ancestors,
        isVar,
        scopeOverride,
        carrierTarget.sourceTarget?.node,
      );
    };
    collectAstPatternCarrierSourceTargetsFromSourceTarget(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
    collectAstPatternRestCarrierSourceTargetsRec(
      pattern,
      sourceTarget,
      activeAliases,
      identifierBindings,
      collectCarrierTarget,
    );
  }

  function collectReactDefaultPatternDefaultAliasesFromAst(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceNode?: any,
  ) {
    collectReactDefaultPatternDefaultAliasesFromSourceTarget(
      pattern,
      ancestors,
      isVar,
      scopeOverride,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectReactDefaultPatternDefaultAliasesFromSourceTarget(
    pattern: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(
            sourceTarget,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
          )
        ) {
          return;
        }
        const activeAliases = getActiveAliases();
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          activeAliases,
        );
        if (capability && defaultPattern?.type === 'Identifier') {
          addAlias(alias, capability, aliasNode || defaultPattern, ancestors, isVar, scopeOverride);
        }
        if (defaultPattern?.type === 'Identifier') {
          collectReactDefaultCarrierAliasesFromAst(
            alias,
            valueNode,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
            activeAliases,
            (member, memberCapability, memberAliasNode, precedenceStart) => {
              addAlias(
                `${alias}.${member}`,
                memberCapability,
                memberAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
                precedenceStart,
              );
            },
          );
        }
        if (defaultPattern?.type !== 'ObjectPattern') {
          return;
        }
        const namespace = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'default') {
              addAlias(
                pathAlias,
                `${namespace}.default`,
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
        if (isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default') {
              addAlias(
                pathAlias,
                'ctx.React.default',
                pathAliasNode || aliasNode || defaultPattern,
                ancestors,
                isVar,
                scopeOverride,
              );
            }
          });
        }
      },
    );
  }

  function addReactDefaultAliasTarget(
    target: any,
    capability: string,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    if (unwrapped?.type === 'Identifier') {
      addAlias(
        unwrapped.name,
        capability,
        unwrapped,
        ancestors,
        isVar,
        scopeOverride || getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
      return;
    }
    if (unwrapped?.type === 'MemberExpression') {
      const memberAlias = getAstMemberAliasLookup(unwrapped);
      if (!memberAlias) {
        return;
      }
      addAlias(
        memberAlias.aliasName,
        capability,
        unwrapped,
        ancestors,
        false,
        scopeOverride || getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings),
      );
    }
  }

  function addReactDefaultAliasByName(
    name: string,
    capability: string,
    target: any,
    ancestors: any[],
    isVar = false,
    scopeOverride?: SourceRange,
    aliasNode?: any,
    precedenceStart?: number,
  ) {
    const unwrapped = unwrapAstChainExpression(target);
    const scope =
      scopeOverride ||
      (unwrapped?.type === 'MemberExpression'
        ? getAstMemberAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings)
        : getAstAssignmentTargetScope(unwrapped, ancestors, source.length, identifierBindings));
    addAlias(
      name,
      capability,
      unwrapAstChainExpression(aliasNode) || aliasNode || unwrapped || target,
      ancestors,
      isVar,
      scope,
      precedenceStart,
    );
  }
}

function collectAstInvalidReactRuntimeBindingsFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[] = [],
): InvalidReactRuntimeBinding[] {
  const entries: InvalidReactRuntimeBinding[] = [];
  const addEntry = (binding: string, capability: string, node: any, ancestors: any[]) => {
    const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
    const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
    entries.push({
      binding,
      capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      index: typeof node?.start === 'number' ? node.start : scope.start,
      ruleId: 'runjs-react-default-alias-forbidden',
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: typeof node?.end === 'number' ? node.end : scope.end,
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      if (node.left?.type === 'Identifier' && node.left.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(node.right);
        if (capability) {
          addEntry(node.left.name, capability, node.left, ancestors);
        }
        return;
      }
      if (
        node.left?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.right, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.right,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || node, ancestors);
          }
        });
      }
      if (node.left?.type === 'ObjectPattern' && isCtxRootFromAst(node.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || node, ancestors);
          }
        });
      }
      if (node.operator === '=') {
        collectInvalidReactPatternSourceBindingsFromAst(node.left, node.right, ancestors);
        collectInvalidReactPatternDefaultBindingsFromAst(node.left, ancestors, node.right);
      }
    },
    ForOfStatement(node: any, ancestors: any[]) {
      const target = getAstLoopPatternTarget(node.left);
      if (!target) {
        return;
      }
      const sourceTargetAliases = [...namespaceAliases, ...defaultAliases];
      collectAstForOfSourceTargets(node.right, sourceTargetAliases, identifierBindings, (loopSourceTarget) => {
        collectInvalidReactPatternSourceTargetBindingsFromAst(target, loopSourceTarget, ancestors);
        collectInvalidReactPatternDefaultBindingsFromSourceTarget(target, ancestors, loopSourceTarget);
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const sourceTargetAliases = [...namespaceAliases, ...defaultAliases];
      if (isAstForOfLoopVariableDeclaratorWithSourceTargets(node, ancestors, sourceTargetAliases, identifierBindings)) {
        return;
      }
      if (node.id?.type === 'Identifier' && node.id.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(node.init);
        if (capability) {
          addEntry(node.id.name, capability, node.id, ancestors);
        }
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases, ctxRootAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(
          node.init,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || node, ancestors);
          }
        });
        collectInvalidReactPatternSourceBindingsFromAst(node.id, node.init, ancestors);
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isCtxRootFromAst(node.init, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(node.id, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || node, ancestors);
          }
        });
      }
      collectInvalidReactPatternSourceBindingsFromAst(node.id, node.init, ancestors);
      collectInvalidReactPatternDefaultBindingsFromAst(node.id, ancestors, node.init);
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
    FunctionExpression(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
    ArrowFunctionExpression(node: any, ancestors: any[]) {
      collectInvalidReactFunctionParamBindingsFromAst(node, ancestors);
    },
  });

  return entries;

  function collectInvalidReactFunctionParamBindingsFromAst(node: any, ancestors: any[]) {
    for (const param of node.params || []) {
      if (param?.type !== 'AssignmentPattern') {
        collectInvalidReactPatternDefaultBindingsFromAst(param, ancestors);
        continue;
      }
      collectInvalidReactPatternDefaultBindingsFromAst(param.left, ancestors, param.right);
      collectInvalidReactPatternSourceBindingsFromAst(param.left, param.right, ancestors);
      if (param.left?.type === 'Identifier' && param.left.name === 'React') {
        const capability = getInvalidReactDefaultCapabilityFromSource(param.right);
        if (capability) {
          addEntry(param.left.name, capability, param.left, ancestors);
        }
        continue;
      }
      if (param.left?.type !== 'ObjectPattern') {
        continue;
      }
      const namespace = getReactNamespaceCapabilityFromAst(
        param.right,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
      );
      if (namespace) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 1 && members[0] === 'default' && alias === 'React') {
            addEntry(alias, `${namespace}.default`, aliasNode || param, ancestors);
          }
        });
      }
      if (isCtxRootFromAst(param.right, ctxRootAliases, identifierBindings)) {
        collectAstObjectPatternPathAliases(param.left, (alias, members, aliasNode) => {
          if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && alias === 'React') {
            addEntry(alias, 'ctx.React.default', aliasNode || param, ancestors);
          }
        });
      }
    }
  }

  function getInvalidReactDefaultCapabilityFromSource(sourceNode: any) {
    if (!sourceNode) {
      return '';
    }
    return getReactDefaultNamespaceCapabilityFromAstPatternSource(
      createAstPatternSourceTarget(sourceNode),
      identifierBindings,
      namespaceAliases,
      ctxRootAliases,
      defaultAliases,
    );
  }

  function collectInvalidReactPatternSourceBindingsFromAst(pattern: any, sourceNode: any, ancestors: any[]) {
    collectInvalidReactPatternSourceTargetBindingsFromAst(pattern, createAstPatternSourceTarget(sourceNode), ancestors);
  }

  function collectInvalidReactPatternSourceTargetBindingsFromAst(pattern: any, sourceTarget: any, ancestors: any[]) {
    collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
      const unwrapped = unwrapAstChainExpression(target);
      if (unwrapped?.type !== 'Identifier' || unwrapped.name !== 'React') {
        return;
      }
      const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
        patternSourceTarget,
        identifierBindings,
        namespaceAliases,
        ctxRootAliases,
        defaultAliases,
      );
      if (capability) {
        addEntry(unwrapped.name, capability, unwrapped, ancestors);
      }
    });
  }

  function collectInvalidReactPatternDefaultBindingsFromAst(pattern: any, ancestors: any[], sourceNode?: any) {
    collectInvalidReactPatternDefaultBindingsFromSourceTarget(
      pattern,
      ancestors,
      createMaybeAstPatternSourceTarget(sourceNode),
    );
  }

  function collectInvalidReactPatternDefaultBindingsFromSourceTarget(
    pattern: any,
    ancestors: any[],
    sourceTarget?: any,
  ) {
    collectAstPatternDefaultValueAliasesWithSource(
      pattern,
      sourceTarget,
      (alias, valueNode, aliasNode, defaultPattern, sourceTarget) => {
        if (
          isAstPatternDefaultValueSuppressedByReactNamespace(
            sourceTarget,
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
          )
        ) {
          return;
        }
        const capability = getReactDefaultNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          defaultAliases,
        );
        if (capability && alias === 'React' && defaultPattern?.type === 'Identifier') {
          addEntry(alias, capability, aliasNode || defaultPattern, ancestors);
        }
        if (defaultPattern?.type !== 'ObjectPattern') {
          return;
        }
        const namespace = getReactNamespaceCapabilityFromAst(
          valueNode,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (namespace) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 1 && members[0] === 'default' && pathAlias === 'React') {
              addEntry(pathAlias, `${namespace}.default`, pathAliasNode || aliasNode || defaultPattern, ancestors);
            }
          });
        }
        if (isCtxRootFromAst(valueNode, ctxRootAliases, identifierBindings)) {
          collectAstObjectPatternPathAliases(defaultPattern, (pathAlias, members, pathAliasNode) => {
            if (members.length === 2 && members[0] === 'React' && members[1] === 'default' && pathAlias === 'React') {
              addEntry(pathAlias, 'ctx.React.default', pathAliasNode || aliasNode || defaultPattern, ancestors);
            }
          });
        }
      },
    );
  }
}

function collectReactNamespaceCarrierAliasesFromAst(
  containerName: string,
  sourceNode: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  addAlias: (member: string, capability: string, node?: any, precedenceStart?: number) => void,
) {
  const visitedTargets = new Set<string>();
  const collectAliases = (targetAliasName: string, sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const visitKey = `${targetAliasName}:${sourceTarget.aliasName || ''}:${sourceTarget.node?.start || 0}:${
      sourceTarget.node?.end || 0
    }:${sourceTarget.index || 0}`;
    if (visitedTargets.has(visitKey)) {
      return;
    }
    visitedTargets.add(visitKey);
    collectAstCarrierSourceTargets(
      undefined,
      targetAliasName,
      sourceTarget,
      namespaceAliases,
      identifierBindings,
      (carrierTarget) => {
        const member = getAstNestedCarrierMemberName(containerName, carrierTarget.targetAliasName);
        if (!member) {
          return;
        }
        if (carrierTarget.sourceAlias) {
          addAlias(
            member,
            carrierTarget.sourceAlias.capability,
            carrierTarget.sourceTarget?.node,
            getAstAliasPrecedenceStart(carrierTarget.sourceAlias),
          );
          return;
        }
        const capability = getReactNamespaceCapabilityFromAstPatternSource(
          carrierTarget.sourceTarget,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
        );
        if (capability) {
          addAlias(member, capability, carrierTarget.sourceTarget?.node);
        }
        collectAliases(carrierTarget.targetAliasName, carrierTarget.sourceTarget);
      },
    );
  };
  collectAliases(containerName, createAstPatternSourceTarget(sourceNode));
}

function collectReactDefaultCarrierAliasesFromAst(
  containerName: string,
  sourceNode: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[],
  addAlias: (member: string, capability: string, node?: any, precedenceStart?: number) => void,
) {
  const carrierAliases: AstCapabilityAlias[] = [...namespaceAliases, ...defaultAliases];
  const visitedTargets = new Set<string>();
  const collectAliases = (targetAliasName: string, sourceTarget: any) => {
    if (!sourceTarget) {
      return;
    }
    const visitKey = `${targetAliasName}:${sourceTarget.aliasName || ''}:${sourceTarget.node?.start || 0}:${
      sourceTarget.node?.end || 0
    }:${sourceTarget.index || 0}`;
    if (visitedTargets.has(visitKey)) {
      return;
    }
    visitedTargets.add(visitKey);
    collectAstCarrierSourceTargets(
      undefined,
      targetAliasName,
      sourceTarget,
      carrierAliases,
      identifierBindings,
      (carrierTarget) => {
        const member = getAstNestedCarrierMemberName(containerName, carrierTarget.targetAliasName);
        if (!member) {
          return;
        }
        if (carrierTarget.sourceAlias) {
          const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
            {
              aliasName: carrierTarget.sourceAlias.name,
              index: carrierTarget.sourceAlias.start,
              rootName: getAstAliasRootName(carrierTarget.sourceAlias.name),
            },
            identifierBindings,
            namespaceAliases,
            ctxRootAliases,
            defaultAliases,
          );
          if (capability) {
            addAlias(
              member,
              capability,
              carrierTarget.sourceTarget?.node,
              getAstAliasPrecedenceStart(carrierTarget.sourceAlias),
            );
          }
          return;
        }
        const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
          carrierTarget.sourceTarget,
          identifierBindings,
          namespaceAliases,
          ctxRootAliases,
          defaultAliases,
        );
        if (capability) {
          addAlias(member, capability, carrierTarget.sourceTarget?.node);
        }
        collectAliases(carrierTarget.targetAliasName, carrierTarget.sourceTarget);
      },
    );
  };
  collectAliases(containerName, createAstPatternSourceTarget(sourceNode));
}

function getAstNestedCarrierMemberName(containerName: string, targetAliasName: string) {
  const prefix = `${containerName}.`;
  return targetAliasName.startsWith(prefix) ? targetAliasName.slice(prefix.length) : '';
}

function collectReactAsyncComponentBindingsFromAst(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): ReactAsyncComponentBinding[] {
  const bindings: ReactAsyncComponentBinding[] = [];
  const addBinding = (name: string, componentNode: any, scope: SourceRange, declarationNode?: any) => {
    if (!/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const declarationStart =
      typeof declarationNode?.start === 'number'
        ? declarationNode.start
        : typeof componentNode?.start === 'number'
          ? componentNode.start
          : scope.start;
    bindings.push({
      capability: name,
      component: name,
      declarationStart,
      name,
      start: scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      if (!node.async || node.id?.type !== 'Identifier') {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      addBinding(node.id.name, node.id, scope, node);
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isAstAsyncFunctionLike(node.init)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      addBinding(node.id.name, node.id, scope, node);
    },
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier' || !isAstAsyncFunctionLike(node.right)) {
        return;
      }
      const scope = getAstBindingScopeRange(ancestors, source.length);
      addBinding(node.left.name, node.left, scope, node);
    },
  });

  return bindings;
}

function collectAstReactAsyncComponentReferences(
  node: any,
  asyncComponentBindings: ReactAsyncComponentBinding[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
): Array<{ capability: string; component: string; index: number }> {
  const capability = getReactCreateElementCallCapabilityFromAst(node, reactCreateElementAliases, identifierBindings);
  if (!capability) {
    return [];
  }
  const component = resolveAstAsyncComponentBinding(node.arguments?.[0], asyncComponentBindings, identifierBindings);
  return component
    ? [
        {
          capability,
          component: component.component,
          index: typeof node.arguments?.[0]?.start === 'number' ? node.arguments[0].start : node.start || 0,
        },
      ]
    : [];
}

function resolveAstAsyncComponentBinding(
  node: any,
  bindings: ReactAsyncComponentBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped || unwrapped.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, bindings, identifierBindings);
}

function collectAstReactComponentCtxRenderCallsFromAst(
  renderCalls: AstCtxRenderCall[],
  ctxMethodAliases: CtxMethodAlias[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
): RunJsAstInspection['reactComponentCtxRenderCalls'] {
  if (!renderCalls.length) {
    return [];
  }

  const entries: RunJsAstInspection['reactComponentCtxRenderCalls'] = [];
  const pending = renderCalls.flatMap((call) =>
    collectAstReactComponentUsagesFromRenderCall(call, reactCreateElementAliases, identifierBindings, functionBindings),
  );
  const visitedComponents = new Set<string>();

  while (pending.length) {
    const usage = pending.shift();
    if (!usage) {
      continue;
    }
    const componentKey = `${usage.functionBinding.name}:${usage.functionBinding.declarationStart}`;
    if (visitedComponents.has(componentKey)) {
      continue;
    }
    visitedComponents.add(componentKey);

    const renderCall = findCtxRenderCallInFunction(
      usage.functionBinding.functionNode,
      ctxMethodAliases,
      identifierBindings,
      functionBindings,
      { bindingMode: 'lexical' },
    );
    if (!renderCall) {
      pending.push(
        ...collectAstReactComponentUsagesOnFunctionRenderPath(
          usage.functionBinding.functionNode,
          reactCreateElementAliases,
          identifierBindings,
          functionBindings,
        ),
      );
      continue;
    }
    entries.push({
      capability: renderCall.capability,
      component: usage.functionBinding.name,
      index: renderCall.index,
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectAstReactComponentUsagesFromRenderCall(
  renderCall: AstCtxRenderCall,
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
) {
  const usages = collectAstReactComponentUsagesFromNodes(
    renderCall.args,
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
  );

  renderCall.args.forEach((arg) => {
    walkAstAncestor(arg, {
      CallExpression(node: any) {
        const callee = unwrapAstChainExpression(node.callee);
        if (callee?.type !== 'Identifier') {
          return;
        }
        const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
          bindingMode: 'initialized',
          initializedIndex: renderCall.index,
        });
        if (!helper) {
          return;
        }
        usages.push(
          ...collectAstReactComponentUsagesOnFunctionRenderPath(
            helper.functionNode,
            reactCreateElementAliases,
            identifierBindings,
            functionBindings,
          ),
        );
      },
    });
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

function collectAstReactComponentUsagesFromNodes(
  nodes: any[],
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: { nearestFunction?: any } = {},
) {
  const usages: Array<{ functionBinding: AstFunctionBinding; index: number }> = [];
  const addUsage = (name: string | undefined, index: number) => {
    if (!name || !/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const functionBinding = resolveAstFunctionBinding(name, index, functionBindings, identifierBindings, {
      bindingMode: 'lexical',
    });
    if (functionBinding) {
      usages.push({ functionBinding, index });
    }
  };

  nodes.forEach((rootNode) => {
    if (!rootNode) {
      return;
    }
    walkAstAncestor(rootNode, {
      JSXOpeningElement(node: any, ancestors: any[]) {
        if (options.nearestFunction && findNearestAstFunctionAncestor(ancestors) !== options.nearestFunction) {
          return;
        }
        addUsage(getAstJSXIdentifierName(node.name), node.start || 0);
      },
      CallExpression(node: any, ancestors: any[]) {
        if (options.nearestFunction && findNearestAstFunctionAncestor(ancestors) !== options.nearestFunction) {
          return;
        }
        if (!getReactCreateElementCallCapabilityFromAst(node, reactCreateElementAliases, identifierBindings)) {
          return;
        }
        const component = unwrapAstChainExpression(node.arguments?.[0]);
        if (component?.type === 'Identifier') {
          addUsage(component.name, component.start || node.start || 0);
        }
      },
    });
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

function collectAstReactComponentUsagesOnFunctionRenderPath(
  functionNode: any,
  reactCreateElementAliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  visited: Set<any> = new Set<any>(),
) {
  if (visited.has(functionNode)) {
    return [];
  }
  visited.add(functionNode);
  const usages = collectAstReactComponentUsagesFromNodes(
    [functionNode],
    reactCreateElementAliases,
    identifierBindings,
    functionBindings,
    { nearestFunction: functionNode },
  );

  walkAstAncestor(functionNode, {
    CallExpression(node: any, ancestors: any[]) {
      const nearestFunction = findNearestAstFunctionAncestor(ancestors);
      if (nearestFunction !== functionNode) {
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
        bindingMode: 'lexical',
      });
      if (!helper) {
        return;
      }
      usages.push(
        ...collectAstReactComponentUsagesOnFunctionRenderPath(
          helper.functionNode,
          reactCreateElementAliases,
          identifierBindings,
          functionBindings,
          visited,
        ),
      );
    },
  });

  return dedupeAstFunctionUsageEntries(usages).sort((left, right) => left.index - right.index);
}

function collectAstTopLevelReachableCtxRenderCallsFromAst(
  ast: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
): AstCtxRenderCall[] {
  const entries: AstCtxRenderCall[] = [];
  walkAstAncestor(ast, {
    CallExpression(node: any, ancestors: any[]) {
      if (findNearestAstFunctionAncestor(ancestors)) {
        return;
      }
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'render') {
        entries.push({
          args: [...(node.arguments || [])],
          capability: method.capability,
          index: node.start || 0,
        });
        return;
      }
      if (!functionBindings.length) {
        return;
      }
      if (!isAstAlwaysExecutedInCurrentExecutionScope(ancestors)) {
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings);
      if (!helper) {
        return;
      }
      const helperRenderCalls = collectCtxRenderCallsInFunction(
        helper.functionNode,
        ctxMethodAliases,
        identifierBindings,
        functionBindings,
        {
          bindingMode: 'initialized',
          initializedIndex: node.start || 0,
        },
      );
      helperRenderCalls.forEach((renderCall) => {
        entries.push({
          ...renderCall,
          index: node.start || renderCall.index,
        });
      });
    },
  });

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function getAstJSXIdentifierName(node: any): string | undefined {
  if (node?.type === 'JSXIdentifier') {
    return node.name;
  }
  return undefined;
}

function findNearestAstFunctionAncestor(ancestors: any[]) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (isAstFunctionLike(ancestors[index])) {
      return ancestors[index];
    }
  }
  return undefined;
}

function collectCtxRenderCallsInFunction(
  functionNode: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: {
    bindingMode: 'initialized' | 'lexical' | 'source';
    initializedIndex?: number;
  },
  visited: Set<any> = new Set<any>(),
): AstCtxRenderCall[] {
  if (visited.has(functionNode)) {
    return [];
  }
  visited.add(functionNode);
  const renderCalls: AstCtxRenderCall[] = [];
  walkAstAncestor(functionNode, {
    CallExpression(node: any, ancestors: any[]) {
      const nearestFunction = findNearestAstFunctionAncestor(ancestors);
      if (nearestFunction !== functionNode) {
        return;
      }
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'render') {
        renderCalls.push({
          args: [...(node.arguments || [])],
          capability: method.capability,
          index: node.start || 0,
        });
        return;
      }
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstFunctionBinding(callee.name, node.start || 0, functionBindings, identifierBindings, {
        bindingMode: options.bindingMode,
        initializedIndex: options.initializedIndex,
        currentFunctionNode: functionNode,
      });
      if (!helper) {
        return;
      }
      renderCalls.push(
        ...collectCtxRenderCallsInFunction(
          helper.functionNode,
          ctxMethodAliases,
          identifierBindings,
          functionBindings,
          options,
          visited,
        ),
      );
    },
  });
  return renderCalls;
}

function findCtxRenderCallInFunction(
  functionNode: any,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
  functionBindings: AstFunctionBinding[],
  options: {
    bindingMode: 'initialized' | 'lexical' | 'source';
    initializedIndex?: number;
  },
): AstCtxRenderCall | undefined {
  return collectCtxRenderCallsInFunction(
    functionNode,
    ctxMethodAliases,
    identifierBindings,
    functionBindings,
    options,
  )[0];
}

function resolveAstFunctionBinding(
  name: string,
  index: number,
  functionBindings: AstFunctionBinding[],
  identifierBindings: AstIdentifierBinding[],
  options: {
    bindingMode?: 'initialized' | 'lexical' | 'source';
    currentFunctionNode?: any;
    initializedIndex?: number;
  } = {},
) {
  if (options.bindingMode === 'lexical' || options.bindingMode === 'initialized') {
    const candidates = functionBindings
      .filter((entry) => entry.name === name && index >= entry.scopeStart && index < entry.end)
      .filter((entry) => {
        if (options.bindingMode !== 'initialized') {
          return true;
        }
        const initializedIndex = isAstFunctionBindingScopedInsideNode(entry, options.currentFunctionNode)
          ? index
          : options.initializedIndex ?? index;
        return entry.hoisted || entry.declarationStart <= initializedIndex;
      })
      .sort((left, right) => right.scopeStart - left.scopeStart || right.declarationStart - left.declarationStart);
    return candidates.find(
      (entry) =>
        !hasAstShadowBinding(
          name,
          index,
          {
            start: entry.scopeStart,
            end: entry.end,
          },
          identifierBindings,
        ),
    );
  }
  return resolveAstAliasBinding(name, index, functionBindings, identifierBindings);
}

function isAstFunctionBindingScopedInsideNode(entry: AstFunctionBinding, node: any) {
  return (
    typeof node?.start === 'number' &&
    typeof node?.end === 'number' &&
    entry.scopeStart >= node.start &&
    entry.end <= node.end
  );
}

function dedupeAstFunctionUsageEntries(entries: Array<{ functionBinding: AstFunctionBinding; index: number }>) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.functionBinding.name}:${entry.functionBinding.declarationStart}:${entry.index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getReactCreateElementCallCapabilityFromAst(
  node: any,
  aliases: ReactCreateElementAlias[],
  identifierBindings: AstIdentifierBinding[],
) {
  const callee = unwrapAstChainExpression(node.callee);
  if (callee?.type === 'Identifier') {
    const alias = resolveAstAliasBinding(callee.name, node.start || 0, aliases, identifierBindings);
    return alias?.capability || '';
  }
  return getReactCreateElementCapabilityFromAst(callee, identifierBindings, []);
}

function getReactCreateElementCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  if (propertyName !== 'createElement') {
    return '';
  }
  const namespace = getReactNamespaceCapabilityFromAst(
    member.object,
    identifierBindings,
    namespaceAliases,
    ctxRootAliases,
  );
  return namespace ? `${namespace}.createElement` : '';
}

function getReactNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getReactNamespaceCapabilityFromAst(unwrapped.consequent, identifierBindings, aliases, ctxRootAliases) ||
      getReactNamespaceCapabilityFromAst(unwrapped.alternate, identifierBindings, aliases, ctxRootAliases)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      getReactNamespaceCapabilityFromAst(unwrapped.left, identifierBindings, aliases, ctxRootAliases) ||
      getReactNamespaceCapabilityFromAst(unwrapped.right, identifierBindings, aliases, ctxRootAliases)
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getReactNamespaceCapabilityFromAst(
      expressions[expressions.length - 1],
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getReactNamespaceCapabilityFromAst(unwrapped.right, identifierBindings, aliases, ctxRootAliases);
  }
  if (unwrapped.type === 'Identifier') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    const alias = resolveAstAliasBinding(unwrapped.name, index, aliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  if (unwrapped.type === 'MemberExpression') {
    const alias = resolveAstMemberAliasBinding(unwrapped, aliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  return getDirectReactNamespaceCapabilityFromAst(unwrapped, identifierBindings, ctxRootAliases);
}

function getReactDefaultNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
  defaultAliases: ReactDefaultAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.consequent,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      ) ||
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.alternate,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      )
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.left,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      ) ||
      getReactDefaultNamespaceCapabilityFromAst(
        unwrapped.right,
        identifierBindings,
        aliases,
        ctxRootAliases,
        defaultAliases,
      )
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getReactDefaultNamespaceCapabilityFromAst(
      expressions[expressions.length - 1],
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getReactDefaultNamespaceCapabilityFromAst(
      unwrapped.right,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
  }
  if (unwrapped.type === 'Identifier') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    const alias = resolveAstAliasBinding(unwrapped.name, index, defaultAliases, identifierBindings);
    return alias?.capability || '';
  }
  if (unwrapped.type === 'MemberExpression') {
    const alias = resolveAstMemberAliasBinding(unwrapped, defaultAliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  if (unwrapped.type !== 'MemberExpression' || getAstStaticPropertyName(unwrapped) !== 'default') {
    return '';
  }
  const namespace = getReactNamespaceCapabilityFromAst(unwrapped.object, identifierBindings, aliases, ctxRootAliases);
  return namespace ? `${namespace}.default` : '';
}

function getDirectReactNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  ctxRootAliases: CtxRootAlias[] = [],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'Identifier' && unwrapped.name === 'React') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    return hasAstActiveBinding('React', index, identifierBindings) ? '' : 'React';
  }
  if (unwrapped.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(unwrapped);
  if (propertyName !== 'React') {
    return '';
  }
  if (isCtxRootFromAst(unwrapped.object, ctxRootAliases, identifierBindings)) {
    return 'ctx.React';
  }
  const object = unwrapAstChainExpression(unwrapped.object);
  if (
    object?.type === 'MemberExpression' &&
    getAstStaticPropertyName(object) === 'libs' &&
    isCtxRootFromAst(object.object, ctxRootAliases, identifierBindings)
  ) {
    return 'ctx.libs.React';
  }
  return '';
}

function isAstAsyncFunctionLike(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  return (
    !!unwrapped?.async && (unwrapped.type === 'FunctionExpression' || unwrapped.type === 'ArrowFunctionExpression')
  );
}

function collectAstIdentifierBindingsFromAst(ast: any, source: string): AstIdentifierBinding[] {
  const bindings: AstIdentifierBinding[] = [];
  const addBinding = (name: string, node: any, scope: SourceRange) => {
    if (!name) {
      return;
    }
    bindings.push({
      name,
      start: scope.start,
      end: scope.end,
    });
  };

  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      collectAstPatternBindingIdentifiers(node.id, (name, bindingNode) => addBinding(name, bindingNode, scope));
    },
    FunctionDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node.id, parentScope);
      }
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    FunctionExpression(node: any) {
      if (node.id?.type === 'Identifier') {
        bindings.push({
          name: node.id.name,
          start: typeof node.id.start === 'number' ? node.id.start : typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : source.length,
        });
      }
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    ArrowFunctionExpression(node: any) {
      addAstFunctionParamBindings(bindings, node, source.length);
    },
    ClassDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node.id, parentScope);
      }
    },
    ClassExpression(node: any) {
      if (node.id?.type === 'Identifier') {
        bindings.push({
          name: node.id.name,
          start: typeof node.id.start === 'number' ? node.id.start : typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : source.length,
        });
      }
    },
    CatchClause(node: any) {
      const scope = {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : source.length,
      };
      collectAstPatternBindingIdentifiers(node.param, (name, bindingNode) => addBinding(name, bindingNode, scope));
    },
  });

  return bindings;
}

function collectAstFunctionBindingsFromAst(ast: any, source: string): AstFunctionBinding[] {
  const bindings: AstFunctionBinding[] = [];
  const addBinding = (
    name: string,
    functionNode: any,
    scope: SourceRange,
    declarationNode: any,
    bindingStart = scope.start,
    hoisted = false,
  ) => {
    if (!name || !isAstFunctionLike(functionNode)) {
      return;
    }
    bindings.push({
      name,
      functionNode,
      declarationStart:
        typeof declarationNode?.start === 'number'
          ? declarationNode.start
          : typeof functionNode.start === 'number'
            ? functionNode.start
            : scope.start,
      start: bindingStart,
      end: scope.end,
      hoisted,
      scopeStart: scope.start,
    });
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      const parentScope = getAstBindingScopeRange(ancestors.slice(0, -1), source.length);
      if (node.id?.type === 'Identifier') {
        addBinding(node.id.name, node, parentScope, node.id, parentScope.start, true);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      const functionNode = unwrapAstChainExpression(node.init);
      if (!isAstFunctionLike(functionNode)) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      addBinding(
        node.id.name,
        functionNode,
        scope,
        node.id,
        typeof node.id.start === 'number' ? node.id.start : scope.start,
      );
    },
    AssignmentExpression(node: any, ancestors: any[]) {
      if (node.operator !== '=' || node.left?.type !== 'Identifier') {
        return;
      }
      const functionNode = unwrapAstChainExpression(node.right);
      if (!isAstFunctionLike(functionNode)) {
        return;
      }
      const scope = getAstExecutionScopeRange(ancestors, source.length);
      addBinding(
        node.left.name,
        functionNode,
        scope,
        node.left,
        typeof node.left.start === 'number' ? node.left.start : scope.start,
      );
    },
  });

  return bindings;
}

function collectStaticStringBindingsFromAst(ast: any, source: string): StaticStringBinding[] {
  const bindings: StaticStringBinding[] = [];
  walkAstAncestor(ast, {
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      const resolved = resolveAstStaticStringValue(node.init, source);
      if (typeof resolved !== 'string') {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const scope = getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var');
      bindings.push({
        name: node.id.name,
        value: resolved,
        start: typeof node.start === 'number' ? node.start : scope.start,
        end: scope.end,
      });
    },
  });
  return bindings;
}

function collectCtxApiResourceAliasesFromAst(
  ast: any,
  source: string,
  ctxApiAliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceAliases {
  type ResourceHandleSource = { args: any[]; calleeSource: string; index: number } | CtxApiResourceHandleAlias;

  const handles: CtxApiResourceHandleAlias[] = [];
  const methods: CtxApiResourceMethodAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const addHandleAlias = (
    name: string,
    resourceFactoryCall: { args: any[]; calleeSource: string; index: number } | CtxApiResourceHandleAlias,
    node: any,
    ancestors: any[],
    isVar = false,
  ) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    handles.push({
      calleeSource: resourceFactoryCall.calleeSource,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      resourceName:
        'args' in resourceFactoryCall
          ? resolveAstStaticStringValue(resourceFactoryCall.args?.[0], source)
          : resourceFactoryCall.resourceName,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const addMethodAlias = (name: string, method: string, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    methods.push({
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      method,
      name,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const getActiveHandles = () => trimAstAliasesAfterWrites(handles, writes, identifierBindings);
  const getActiveMethods = () => trimAstAliasesAfterWrites(methods, writes, identifierBindings);
  const collectMethodAliases = (pattern: any, sourceNode: any, ancestors: any[], isVar = false) => {
    if (!sourceNode) {
      return;
    }
    collectAstObjectPatternAliases(pattern, (name, method, aliasNode) => {
      if (RUNJS_RESOURCE_METHODS.has(method)) {
        addMethodAlias(name, method, aliasNode || pattern, ancestors, isVar);
      }
    });
  };
  const getDirectResourceHandleSource = (node: any): ResourceHandleSource | undefined =>
    getCtxApiResourceCallFromAst(node, ctxApiAliases, source, identifierBindings) ||
    getCtxApiResourceHandleAliasFromAst(node, getActiveHandles(), identifierBindings);
  const getMaybeResourceHandleSource = (node: any): ResourceHandleSource | undefined =>
    collectPossibleResourceHandleSources(node)[0];
  const collectPossibleResourceHandleSources = (node: any): ResourceHandleSource[] => {
    const directSource = getDirectResourceHandleSource(node);
    if (directSource) {
      return [directSource];
    }
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return [];
    }
    if (unwrapped.type === 'ConditionalExpression') {
      return [
        ...collectPossibleResourceHandleSources(unwrapped.consequent),
        ...collectPossibleResourceHandleSources(unwrapped.alternate),
      ];
    }
    if (unwrapped.type === 'LogicalExpression') {
      const leftSources = collectPossibleResourceHandleSources(unwrapped.left);
      const rightSources = collectPossibleResourceHandleSources(unwrapped.right);
      if (unwrapped.operator === '&&' && leftSources.length) {
        return rightSources;
      }
      if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftSources.length) {
        return leftSources;
      }
      return [...leftSources, ...rightSources];
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      return collectPossibleResourceHandleSources(expressions[expressions.length - 1]);
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      return collectPossibleResourceHandleSources(unwrapped.right);
    }
    return [];
  };
  const getDirectResourceMethodSource = (node: any): { method: string } | undefined => {
    const methodAlias = getCtxApiResourceMethodAliasFromAst(node, getActiveMethods(), identifierBindings);
    if (methodAlias) {
      return { method: methodAlias.method };
    }
    const member = unwrapAstChainExpression(node);
    if (!member || member.type !== 'MemberExpression') {
      return undefined;
    }
    const method = getAstStaticPropertyName(member);
    if (!RUNJS_RESOURCE_METHODS.has(method) || !getMaybeResourceHandleSource(member.object)) {
      return undefined;
    }
    return { method };
  };
  const getMaybeResourceMethodSource = (node: any): { method: string } | undefined => {
    const sources = collectPossibleResourceMethodSources(node);
    return sources[0];
  };
  const collectPossibleResourceMethodSources = (node: any): Array<{ method: string }> => {
    const directSource = getDirectResourceMethodSource(node);
    if (directSource) {
      return [directSource];
    }
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return [];
    }
    if (unwrapped.type === 'ConditionalExpression') {
      return [
        ...collectPossibleResourceMethodSources(unwrapped.consequent),
        ...collectPossibleResourceMethodSources(unwrapped.alternate),
      ];
    }
    if (unwrapped.type === 'LogicalExpression') {
      const leftSources = collectPossibleResourceMethodSources(unwrapped.left);
      const rightSources = collectPossibleResourceMethodSources(unwrapped.right);
      if (unwrapped.operator === '&&' && leftSources.length) {
        return rightSources;
      }
      if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftSources.length) {
        return leftSources;
      }
      return [...leftSources, ...rightSources];
    }
    if (unwrapped.type === 'SequenceExpression') {
      const expressions = unwrapped.expressions || [];
      return collectPossibleResourceMethodSources(expressions[expressions.length - 1]);
    }
    if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
      return collectPossibleResourceMethodSources(unwrapped.right);
    }
    return [];
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (isAstCtxApiAliasAssignmentOperator(node.operator) && node.left?.type === 'Identifier') {
        const resourceMethodSource = getMaybeResourceMethodSource(node.right);
        if (resourceMethodSource) {
          addMethodAlias(node.left.name, resourceMethodSource.method, node, ancestors);
          return;
        }
        const resourceHandleSource = getMaybeResourceHandleSource(node.right);
        if (resourceHandleSource) {
          addHandleAlias(node.left.name, resourceHandleSource, node, ancestors);
          return;
        }
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectMethodAliases(node.left, getMaybeResourceHandleSource(node.right), ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const resourceMethodSource = getMaybeResourceMethodSource(node.init);
        if (resourceMethodSource) {
          addMethodAlias(node.id.name, resourceMethodSource.method, node, ancestors, isVar);
          return;
        }
        const resourceHandleSource = getMaybeResourceHandleSource(node.init);
        if (resourceHandleSource) {
          addHandleAlias(node.id.name, resourceHandleSource, node, ancestors, isVar);
          return;
        }
      }
      const resourceHandleSource = getMaybeResourceHandleSource(node.init);
      if (node.id?.type === 'ObjectPattern') {
        collectMethodAliases(node.id, resourceHandleSource, ancestors, isVar);
      }
    },
  });

  return {
    handles: trimAstAliasesAfterWrites(handles, writes, identifierBindings),
    methods: trimAstAliasesAfterWrites(methods, writes, identifierBindings),
  };
}

function collectAstInvalidApiResourceCall(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'] {
  const entries: RunJsAstInspection['invalidApiResourceCalls'] = [];
  const callee = unwrapAstChainExpression(node.callee);
  const chainedResourceMethod = getCtxApiResourceChainedMethodFromAst(
    callee,
    aliases,
    resourceAliases,
    source,
    identifierBindings,
  );
  if (chainedResourceMethod) {
    entries.push(chainedResourceMethod);
  }

  const resourceFactoryCall = getCtxApiResourceCallFromAst(node, aliases, source, identifierBindings);
  if (!resourceFactoryCall) {
    return entries;
  }

  const method = resolveAstStaticStringValue(node.arguments?.[0], source);
  if (method && RUNJS_RESOURCE_METHODS.has(method)) {
    entries.push({
      index: resourceFactoryCall.index,
      match: `${resourceFactoryCall.calleeSource}('${method}')`,
      matchIndex: resourceFactoryCall.index,
      method,
    });
  }

  const resourceName = resolveAstStaticStringValue(node.arguments?.[0], source);
  const action = resolveAstStaticStringValue(node.arguments?.[1], source);
  if (action && RUNJS_RESOURCE_METHODS.has(action)) {
    entries.push({
      index: resourceFactoryCall.index,
      match: resourceName
        ? `${resourceFactoryCall.calleeSource}('${resourceName}', '${action}')`
        : `${resourceFactoryCall.calleeSource}(..., '${action}')`,
      matchIndex: resourceFactoryCall.index,
      method: action,
    });
  }

  return entries;
}

function getCtxApiResourceChainedMethodFromAst(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'][number] | undefined {
  const callee = unwrapAstChainExpression(node);
  const wrappedMethod = getWrappedCtxApiResourceChainedMethodFromAst(
    callee,
    aliases,
    resourceAliases,
    source,
    identifierBindings,
  );
  if (wrappedMethod) {
    return wrappedMethod;
  }
  const methodAlias = getMaybeCtxApiResourceMethodAliasFromAst(callee, resourceAliases.methods, identifierBindings);
  if (methodAlias) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method: methodAlias.method,
    };
  }
  if (!callee || callee.type !== 'MemberExpression') {
    return undefined;
  }

  const invocationMember = getAstStaticPropertyName(callee);
  if (invocationMember === 'call' || invocationMember === 'apply' || invocationMember === 'bind') {
    const targetMethod = getCtxApiResourceChainedMethodFromAst(
      callee.object,
      aliases,
      resourceAliases,
      source,
      identifierBindings,
    );
    if (targetMethod) {
      return {
        ...targetMethod,
        index: typeof callee.start === 'number' ? callee.start : targetMethod.index,
        match: getAstSource(callee, source),
        matchIndex: typeof callee.start === 'number' ? callee.start : targetMethod.matchIndex,
      };
    }
  }

  const method = getAstStaticPropertyName(callee);
  if (!RUNJS_RESOURCE_METHODS.has(method)) {
    return undefined;
  }

  const resourceHandleAlias = getMaybeCtxApiResourceHandleAliasFromAst(
    callee.object,
    resourceAliases.handles,
    identifierBindings,
  );
  if (resourceHandleAlias) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method,
    };
  }

  const objectPath = getCtxApiMemberPathFromAst(callee.object, aliases, identifierBindings);
  if (isCtxApiResourcePath(objectPath)) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      match: getAstSource(callee, source),
      matchIndex: typeof callee.start === 'number' ? callee.start : 0,
      method,
    };
  }

  const resourceFactoryCall = getMaybeCtxApiResourceCallFromAst(callee.object, aliases, source, identifierBindings);
  if (!resourceFactoryCall) {
    return undefined;
  }
  const resourceName = resolveAstStaticStringValue(resourceFactoryCall.args?.[0], source);
  return {
    index: resourceFactoryCall.index,
    match: resourceName
      ? `${resourceFactoryCall.calleeSource}('${resourceName}').${method}`
      : `${resourceFactoryCall.calleeSource}(...).${method}`,
    matchIndex: resourceFactoryCall.index,
    method,
  };
}

function getWrappedCtxApiResourceChainedMethodFromAst(
  node: any,
  aliases: CtxApiAlias[],
  resourceAliases: CtxApiResourceAliases,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidApiResourceCalls'][number] | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }

  const wrapEntry = (entry: RunJsAstInspection['invalidApiResourceCalls'][number] | undefined) => {
    if (!entry) {
      return undefined;
    }
    return {
      ...entry,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : entry.index,
      match: getAstSource(unwrapped, source),
      matchIndex: typeof unwrapped.start === 'number' ? unwrapped.start : entry.matchIndex,
    };
  };

  if (unwrapped.type === 'ConditionalExpression') {
    return (
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(
          unwrapped.consequent,
          aliases,
          resourceAliases,
          source,
          identifierBindings,
        ),
      ) ||
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(
          unwrapped.alternate,
          aliases,
          resourceAliases,
          source,
          identifierBindings,
        ),
      )
    );
  }

  if (unwrapped.type === 'LogicalExpression') {
    const leftEntry = getCtxApiResourceChainedMethodFromAst(
      unwrapped.left,
      aliases,
      resourceAliases,
      source,
      identifierBindings,
    );
    if (unwrapped.operator === '&&') {
      return wrapEntry(
        getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
      );
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftEntry) {
      return wrapEntry(leftEntry);
    }
    return (
      wrapEntry(leftEntry) ||
      wrapEntry(
        getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
      )
    );
  }

  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return wrapEntry(
      getCtxApiResourceChainedMethodFromAst(
        expressions[expressions.length - 1],
        aliases,
        resourceAliases,
        source,
        identifierBindings,
      ),
    );
  }

  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return wrapEntry(
      getCtxApiResourceChainedMethodFromAst(unwrapped.right, aliases, resourceAliases, source, identifierBindings),
    );
  }

  return undefined;
}

function getCtxApiResourceHandleAliasFromAst(
  node: any,
  aliases: CtxApiResourceHandleAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceHandleAlias | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
}

function getCtxApiResourceMethodAliasFromAst(
  node: any,
  aliases: CtxApiResourceMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceMethodAlias | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'Identifier') {
    return undefined;
  }
  return resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
}

function getMaybeCtxApiResourceHandleAliasFromAst(
  node: any,
  aliases: CtxApiResourceHandleAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceHandleAlias | undefined {
  const directAlias = getCtxApiResourceHandleAliasFromAst(node, aliases, identifierBindings);
  if (directAlias) {
    return directAlias;
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.consequent, aliases, identifierBindings) ||
      getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftAlias = getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.left, aliases, identifierBindings);
    if (unwrapped.operator === '&&') {
      return getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.right, aliases, identifierBindings);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftAlias) {
      return leftAlias;
    }
    return leftAlias || getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getMaybeCtxApiResourceHandleAliasFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getMaybeCtxApiResourceHandleAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  return undefined;
}

function getMaybeCtxApiResourceMethodAliasFromAst(
  node: any,
  aliases: CtxApiResourceMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiResourceMethodAlias | undefined {
  const directAlias = getCtxApiResourceMethodAliasFromAst(node, aliases, identifierBindings);
  if (directAlias) {
    return directAlias;
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.consequent, aliases, identifierBindings) ||
      getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftAlias = getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.left, aliases, identifierBindings);
    if (unwrapped.operator === '&&') {
      return getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftAlias) {
      return leftAlias;
    }
    return leftAlias || getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getMaybeCtxApiResourceMethodAliasFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getMaybeCtxApiResourceMethodAliasFromAst(unwrapped.right, aliases, identifierBindings);
  }
  return undefined;
}

function getCtxApiResourceCallFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { args: any[]; calleeSource: string; index: number } | undefined {
  const call = unwrapAstChainExpression(node);
  if (!call || call.type !== 'CallExpression') {
    return undefined;
  }
  const callee = getCtxApiResourceCalleeFromAst(call.callee, aliases, source, identifierBindings);
  if (!callee) {
    return undefined;
  }
  return {
    args: call.arguments || [],
    calleeSource: callee.source,
    index: typeof call.start === 'number' ? call.start : callee.index,
  };
}

function getCtxApiResourceCalleeFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { index: number; source: string } | undefined {
  const callee = unwrapAstChainExpression(node);
  if (!callee) {
    return undefined;
  }
  const path = getCtxApiMemberPathFromAst(callee, aliases, identifierBindings);
  if (isCtxApiResourcePath(path)) {
    return {
      index: typeof callee.start === 'number' ? callee.start : 0,
      source: getAstSource(callee, source),
    };
  }

  const wrapEntry = (entry: { index: number; source: string } | undefined) => {
    if (!entry) {
      return undefined;
    }
    return {
      index: typeof callee.start === 'number' ? callee.start : entry.index,
      source: getAstSource(callee, source),
    };
  };

  if (callee.type === 'ConditionalExpression') {
    return (
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.consequent, aliases, source, identifierBindings)) ||
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.alternate, aliases, source, identifierBindings))
    );
  }

  if (callee.type === 'LogicalExpression') {
    const leftEntry = getCtxApiResourceCalleeFromAst(callee.left, aliases, source, identifierBindings);
    if (callee.operator === '&&') {
      return wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings));
    }
    if ((callee.operator === '||' || callee.operator === '??') && leftEntry) {
      return wrapEntry(leftEntry);
    }
    return (
      wrapEntry(leftEntry) ||
      wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings))
    );
  }

  if (callee.type === 'SequenceExpression') {
    const expressions = callee.expressions || [];
    return wrapEntry(
      getCtxApiResourceCalleeFromAst(expressions[expressions.length - 1], aliases, source, identifierBindings),
    );
  }

  if (callee.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(callee.operator)) {
    return wrapEntry(getCtxApiResourceCalleeFromAst(callee.right, aliases, source, identifierBindings));
  }

  return undefined;
}

function getMaybeCtxApiResourceCallFromAst(
  node: any,
  aliases: CtxApiAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
): { args: any[]; calleeSource: string; index: number } | undefined {
  const directCall = getCtxApiResourceCallFromAst(node, aliases, source, identifierBindings);
  if (directCall) {
    return directCall;
  }
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      getMaybeCtxApiResourceCallFromAst(unwrapped.consequent, aliases, source, identifierBindings) ||
      getMaybeCtxApiResourceCallFromAst(unwrapped.alternate, aliases, source, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    const leftCall = getMaybeCtxApiResourceCallFromAst(unwrapped.left, aliases, source, identifierBindings);
    if (unwrapped.operator === '&&') {
      return getMaybeCtxApiResourceCallFromAst(unwrapped.right, aliases, source, identifierBindings);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftCall) {
      return leftCall;
    }
    return leftCall || getMaybeCtxApiResourceCallFromAst(unwrapped.right, aliases, source, identifierBindings);
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return getMaybeCtxApiResourceCallFromAst(expressions[expressions.length - 1], aliases, source, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return getMaybeCtxApiResourceCallFromAst(unwrapped.right, aliases, source, identifierBindings);
  }
  return undefined;
}

function filterInvalidCtxApiMemberAccessesForResourceCalls(
  memberAccesses: RunJsAstInspection['invalidCtxApiMemberAccesses'],
  resourceCalls: RunJsAstInspection['invalidApiResourceCalls'],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const resourceCallMatches = new Set(resourceCalls.map((entry) => entry.match));
  const resourceCallMatchRanges = new Set(
    resourceCalls
      .filter((entry) => typeof entry.matchIndex === 'number')
      .map((entry) => `${entry.matchIndex}:${entry.match}`),
  );
  return memberAccesses.filter((entry) => {
    if (entry.ruleId !== 'runjs-ctx-api-member-unknown') {
      return true;
    }
    if (!entry.match || !entry.capability.startsWith('ctx.api.resource.')) {
      return true;
    }
    if (typeof entry.matchIndex === 'number') {
      return !resourceCallMatchRanges.has(`${entry.matchIndex}:${entry.match}`);
    }
    return !resourceCallMatches.has(entry.match);
  });
}

function isCtxApiResourcePath(
  path: ReturnType<typeof getCtxApiMemberPathFromAst>,
): path is NonNullable<ReturnType<typeof getCtxApiMemberPathFromAst>> {
  return !!path && !path.hasDynamicMember && path.members.length === 1 && path.members[0].name === 'resource';
}

function collectAstInvalidResourceTypeCall(
  node: any,
  method: string,
  capability: string,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidResourceTypeCalls'] {
  const firstArg = node.arguments?.[0];
  if (!firstArg) {
    return [
      {
        capability,
        expression: '',
        index: node.start || 0,
        ruleId: 'runjs-make-resource-type-unresolved',
      },
    ];
  }
  const resolved = resolveAstResourceTypeExpression(firstArg, source, stringBindings, identifierBindings);
  if (resolved.status === 'unresolved') {
    return [
      {
        capability,
        expression: resolved.expression,
        index: node.start || 0,
        ruleId: 'runjs-make-resource-type-unresolved',
      },
    ];
  }
  const allowedResourceTypes = method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
  if (!allowedResourceTypes.has(resolved.value)) {
    return [
      {
        capability,
        expression: source.slice(firstArg.start || 0, firstArg.end || firstArg.start || 0).trim(),
        index: node.start || 0,
        resourceType: resolved.value,
        ruleId: 'runjs-make-resource-type-invalid',
      },
    ];
  }
  return [];
}

function collectAstFlowResourceAliasesFromAst(
  ast: any,
  source: string,
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): AstFlowResourceAlias[] {
  const aliases: AstFlowResourceAlias[] = [];
  const writes = collectAstIdentifierWritesFromAst(ast, source);
  const getActiveAliases = () => trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
  const addAlias = (name: string, resource: AstFlowResourceSource, node: any, ancestors: any[], isVar = false) => {
    const scope = getAstBindingScopeRange(ancestors, source.length, isVar);
    aliases.push({
      capability: resource.capability,
      declarationStart: typeof node?.start === 'number' ? node.start : scope.start,
      executionScope: getAstExecutionScopeRange(ancestors, source.length),
      name,
      resourceType: resource.resourceType,
      start: typeof node?.start === 'number' ? node.start : scope.start,
      end: scope.end,
    });
  };
  const collectCtxResourcePatternAliases = (pattern: any, ctxNode: any, ancestors: any[], isVar = false) => {
    if (!isUnshadowedCtxIdentifier(ctxNode, identifierBindings)) {
      return;
    }
    collectAstObjectPatternAliases(pattern, (name, member, aliasNode) => {
      if (member === 'resource') {
        addAlias(
          name,
          {
            capability: 'ctx.resource',
            index: typeof ctxNode?.start === 'number' ? ctxNode.start : 0,
            resourceType: 'unknown',
          },
          aliasNode || pattern,
          ancestors,
          isVar,
        );
      }
    });
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (isAstCtxApiAliasAssignmentOperator(node.operator) && node.left?.type === 'Identifier') {
        const resource = getMaybeAstFlowResourceSourceFromAst(
          node.right,
          getActiveAliases(),
          source,
          identifierBindings,
          ctxMethodAliases,
          stringBindings,
        );
        if (resource) {
          addAlias(node.left.name, resource, node, ancestors);
        }
        return;
      }
      if (node.operator === '=' && node.left?.type === 'ObjectPattern') {
        collectCtxResourcePatternAliases(node.left, node.right, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const resource = getMaybeAstFlowResourceSourceFromAst(
          node.init,
          getActiveAliases(),
          source,
          identifierBindings,
          ctxMethodAliases,
          stringBindings,
        );
        if (resource) {
          addAlias(node.id.name, resource, node, ancestors, isVar);
        }
        return;
      }
      if (node.id?.type === 'ObjectPattern') {
        collectCtxResourcePatternAliases(node.id, node.init, ancestors, isVar);
      }
    },
  });

  return trimAstAliasesAfterWrites(aliases, writes, identifierBindings);
}

function collectAstInvalidFlowResourceMethodCall(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): {
  invalidListCalls: RunJsAstInspection['invalidFlowResourceListCalls'];
  invalidMethodCalls: RunJsAstInspection['invalidFlowResourceMethodCalls'];
} {
  const callee = unwrapAstChainExpression(node.callee);
  if (!callee || callee.type !== 'MemberExpression') {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const method = getAstStaticPropertyName(callee);
  if (!method) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const resource = getMaybeAstFlowResourceSourceFromAst(
    callee.object,
    aliases,
    source,
    identifierBindings,
    ctxMethodAliases,
    stringBindings,
  );
  if (!resource) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  const capability = getAstSource(callee, source);
  if (method === 'list') {
    return {
      invalidListCalls: [
        {
          capability,
          index: typeof callee.start === 'number' ? callee.start : node.start || 0,
        },
      ],
      invalidMethodCalls: [],
    };
  }
  if (getFlowResourceAllowedMethods(resource.resourceType).has(method)) {
    return { invalidListCalls: [], invalidMethodCalls: [] };
  }
  return {
    invalidListCalls: [],
    invalidMethodCalls: [
      {
        capability,
        index:
          typeof callee.property?.start === 'number'
            ? callee.property.start
            : typeof callee.start === 'number'
              ? callee.start
              : node.start || 0,
        method,
        resourceType: resource.resourceType,
        suggestedMethod: getSuggestedFlowResourceMethod(method),
      },
    ],
  };
}

function collectAstInvalidResourceFilterCalls(
  ast: any,
  source: string,
  aliases: AstFlowResourceAlias[],
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
  context: RunJsAuthoringContext,
): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (!context.getCollection) {
    return [];
  }
  const entries: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  const ctxResourceStates = new Map<string, { scope: SourceRange; state: AstRunJsResourceState }>();
  const aliasStates = new Map<string, AstRunJsResourceState>();
  type ResourceFilterEvent =
    | {
        type: 'aliasBind';
        aliasName: string;
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        sourceNode: any;
      }
    | {
        type: 'ctxResourceAliasBind';
        aliasName: string;
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
      }
    | {
        type: 'initResource';
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        resourceType: FlowResourceInstanceType;
      }
    | {
        type: 'resourceCall';
        alwaysRuns: boolean;
        end: number;
        executionScope: SourceRange;
        index: number;
        node: any;
      };
  type ResourceExpressionTarget = {
    capability: string;
    state: AstRunJsResourceState;
    updateState: (state: AstRunJsResourceState) => void;
  };
  const events: ResourceFilterEvent[] = [];
  const scopeKey = (scope: SourceRange) => `${scope.start}:${scope.end}`;
  const aliasKey = (alias: AstFlowResourceAlias) => `${alias.name}:${alias.declarationStart ?? alias.start}`;
  const mergeResourceState = (
    state: AstRunJsResourceState,
    nextState: AstRunJsResourceState,
  ): AstRunJsResourceState => {
    state.capability = nextState.capability;
    state.dataSourceKey = nextState.dataSourceKey;
    state.resourceType = nextState.resourceType;
    state.collectionName = nextState.collectionName;
    return state;
  };
  const defaultCtxState = (): AstRunJsResourceState => ({
    capability: 'ctx.resource',
    collectionName: normalizeText(context.currentCollectionName || context.hostCollectionName) || undefined,
    dataSourceKey: normalizeText(context.currentDataSourceKey || context.hostDataSourceKey) || 'main',
    resourceType: 'unknown',
  });
  const getAliasState = (alias: AstFlowResourceAlias): AstRunJsResourceState => {
    const key = aliasKey(alias);
    const current = aliasStates.get(key);
    if (current) {
      return current;
    }
    const initial =
      alias.capability === 'ctx.resource'
        ? {
            ...defaultCtxState(),
            resourceType: alias.resourceType === 'unknown' ? defaultCtxState().resourceType : alias.resourceType,
          }
        : {
            capability: alias.capability,
            dataSourceKey: 'main',
            resourceType: alias.resourceType,
          };
    aliasStates.set(key, initial);
    return initial;
  };
  const setAliasState = (alias: AstFlowResourceAlias, state: AstRunJsResourceState) => {
    if (alias.resourceType !== 'unknown') {
      state.resourceType = alias.resourceType;
    }
    aliasStates.set(aliasKey(alias), state);
    return state;
  };
  const setCtxState = (executionScope: SourceRange, state: AstRunJsResourceState) => {
    const nextState = {
      ...state,
      capability: 'ctx.resource',
    };
    ctxResourceStates.set(scopeKey(executionScope), {
      scope: executionScope,
      state: nextState,
    });
    return nextState;
  };
  const getCtxState = (executionScope: SourceRange) => {
    const exact = ctxResourceStates.get(scopeKey(executionScope))?.state;
    if (exact) {
      return exact;
    }
    const inherited = Array.from(ctxResourceStates.values())
      .filter(({ scope }) => scope.start <= executionScope.start && scope.end >= executionScope.end)
      .sort(
        (left, right) =>
          left.scope.end - left.scope.start - (right.scope.end - right.scope.start) ||
          right.scope.start - left.scope.start,
      )[0]?.state;
    if (inherited) {
      return inherited;
    }
    return setCtxState(executionScope, defaultCtxState());
  };
  const findDeclaredAlias = (aliasName: string, index: number) =>
    aliases
      .filter((alias) => alias.name === aliasName && (alias.declarationStart ?? alias.start) <= index)
      .sort((left, right) => (right.declarationStart ?? right.start) - (left.declarationStart ?? left.start))[0];
  const resolveStaticStringArg = (node: any) => {
    const resolved = resolveAstResourceTypeExpression(node, source, stringBindings, identifierBindings);
    return resolved.status === 'resolved' ? resolved.value : undefined;
  };
  const applyStaticResourceStateMethod = (
    state: AstRunJsResourceState,
    method: string,
    node: any,
  ): AstRunJsResourceState => {
    if (method === 'setDataSourceKey') {
      const dataSourceKey = resolveStaticStringArg(node.arguments?.[0]);
      return {
        ...state,
        dataSourceKey: dataSourceKey || '',
      };
    }
    if (method === 'setResourceName') {
      const collectionName = resolveStaticStringArg(node.arguments?.[0]);
      return {
        ...state,
        collectionName,
      };
    }
    return state;
  };
  const getAliasResourceTarget = (
    alias: AstFlowResourceAlias,
    executionScope: SourceRange,
  ): ResourceExpressionTarget => ({
    capability: alias.capability,
    state: getAliasState(alias),
    updateState: (nextState) => {
      mergeResourceState(getAliasState(alias), nextState);
    },
  });
  const resolveResourceExpressionTarget = (
    node: any,
    executionScope: SourceRange,
  ): ResourceExpressionTarget | undefined => {
    const unwrapped = unwrapAstChainExpression(node);
    if (!unwrapped) {
      return undefined;
    }
    if (isAstCtxResourceMember(unwrapped, identifierBindings)) {
      return {
        capability: 'ctx.resource',
        state: getCtxState(executionScope),
        updateState: (nextState) => mergeResourceState(getCtxState(executionScope), nextState),
      };
    }
    if (unwrapped.type === 'Identifier') {
      const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
      return alias ? getAliasResourceTarget(alias, executionScope) : undefined;
    }
    const factory = getAstFlowResourceFactoryCallFromAst(
      unwrapped,
      ctxMethodAliases,
      source,
      stringBindings,
      identifierBindings,
    );
    if (factory) {
      return {
        capability: factory.capability,
        state: {
          capability: factory.capability,
          dataSourceKey: 'main',
          resourceType: factory.resourceType,
        },
        updateState: _.noop,
      };
    }
    if (unwrapped.type === 'CallExpression') {
      const callTarget = getResourceCallTarget(unwrapped, executionScope);
      if (!callTarget || !RUNJS_RESOURCE_CHAINABLE_STATE_METHODS.has(callTarget.method)) {
        return undefined;
      }
      return {
        ...callTarget,
        state: applyStaticResourceStateMethod(callTarget.state, callTarget.method, unwrapped),
      };
    }
    return undefined;
  };
  const resolveExpressionState = (node: any, executionScope: SourceRange): AstRunJsResourceState | undefined =>
    resolveResourceExpressionTarget(node, executionScope)?.state;
  const getResourceCallTarget = (
    node: any,
    executionScope: SourceRange,
  ):
    | {
        capability: string;
        method: string;
        state: AstRunJsResourceState;
        updateState: (state: AstRunJsResourceState) => void;
      }
    | undefined => {
    const callee = unwrapAstChainExpression(node.callee);
    if (!callee || callee.type !== 'MemberExpression') {
      return undefined;
    }
    const method = getAstStaticPropertyName(callee);
    if (!method) {
      return undefined;
    }
    const objectTarget = resolveResourceExpressionTarget(callee.object, executionScope);
    if (objectTarget) {
      return {
        ...objectTarget,
        capability: getAstSource(callee, source),
        method,
      };
    }
    return undefined;
  };
  walkAstAncestor(ast, {
    AssignmentExpression(node: any, ancestors: any[]) {
      if (!isAstCtxApiAliasAssignmentOperator(node.operator)) {
        return;
      }
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      if (node.left?.type === 'Identifier') {
        events.push({
          type: 'aliasBind',
          aliasName: node.left.name,
          alwaysRuns,
          end: typeof node.end === 'number' ? node.end : node.start || 0,
          executionScope,
          index: node.start || 0,
          sourceNode: node.right,
        });
        return;
      }
      if (node.left?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.right, identifierBindings)) {
        collectAstObjectPatternAliases(node.left, (aliasName, member, aliasNode) => {
          if (member !== 'resource') {
            return;
          }
          events.push({
            type: 'ctxResourceAliasBind',
            aliasName,
            alwaysRuns,
            end: typeof aliasNode?.end === 'number' ? aliasNode.end : node.end || node.start || 0,
            executionScope,
            index: typeof aliasNode?.start === 'number' ? aliasNode.start : node.start || 0,
          });
        });
      }
    },
    CallExpression(node: any, ancestors: any[]) {
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const ctxMethod = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (ctxMethod?.method === 'initResource') {
        const resolved = node.arguments?.[0]
          ? resolveAstResourceTypeExpression(node.arguments[0], source, stringBindings, identifierBindings)
          : undefined;
        events.push({
          type: 'initResource',
          alwaysRuns,
          end: typeof node.end === 'number' ? node.end : node.start || 0,
          executionScope,
          index: node.start || 0,
          resourceType:
            resolved?.status === 'resolved' && INIT_RESOURCE_CLASS_NAMES.has(resolved.value)
              ? (resolved.value as FlowResourceInstanceType)
              : 'unknown',
        });
      }
      if (!getResourceCallTarget(node, executionScope)) {
        return;
      }
      events.push({
        type: 'resourceCall',
        alwaysRuns,
        end: typeof node.end === 'number' ? node.end : node.start || 0,
        executionScope,
        index: node.start || 0,
        node,
      });
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const alwaysRuns = isAstAlwaysExecutedInCurrentExecutionScope(ancestors);
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      if (node.id?.type === 'Identifier') {
        events.push({
          type: 'aliasBind',
          aliasName: node.id.name,
          alwaysRuns,
          end: typeof node.end === 'number' ? node.end : node.start || 0,
          executionScope,
          index: node.start || 0,
          sourceNode: node.init,
        });
        return;
      }
      if (node.id?.type === 'ObjectPattern' && isUnshadowedCtxIdentifier(node.init, identifierBindings)) {
        collectAstObjectPatternAliases(node.id, (aliasName, member, aliasNode) => {
          if (member !== 'resource') {
            return;
          }
          events.push({
            type: 'ctxResourceAliasBind',
            aliasName,
            alwaysRuns,
            end: typeof aliasNode?.end === 'number' ? aliasNode.end : node.end || node.start || 0,
            executionScope,
            index: typeof aliasNode?.start === 'number' ? aliasNode.start : node.start || 0,
          });
        });
      }
    },
  });

  // Candidate discovery can touch state through getResourceCallTarget().
  // Replay from a clean state so nested functions inherit the outer ctx.resource
  // configuration that is in effect when they are called.
  ctxResourceStates.clear();
  aliasStates.clear();

  const resourceFilterScopes = Array.from(
    new Map(events.map((event) => [scopeKey(event.executionScope), event.executionScope])).values(),
  );
  const resourceFilterScopeDepth = (scope: SourceRange) =>
    resourceFilterScopes.filter(
      (candidate) => candidate.start < scope.start && candidate.end >= scope.end && !isSameAstRange(candidate, scope),
    ).length;

  events
    .sort(
      (left, right) =>
        resourceFilterScopeDepth(left.executionScope) - resourceFilterScopeDepth(right.executionScope) ||
        left.executionScope.start - right.executionScope.start ||
        left.index - right.index ||
        left.end - right.end,
    )
    .forEach((event) => {
      if (event.type === 'initResource') {
        if (!event.alwaysRuns) {
          return;
        }
        setCtxState(event.executionScope, {
          capability: 'ctx.resource',
          dataSourceKey: 'main',
          resourceType: event.resourceType,
        });
        return;
      }
      if (event.type === 'aliasBind') {
        if (!event.alwaysRuns) {
          return;
        }
        const alias = findDeclaredAlias(event.aliasName, event.index);
        const state = resolveExpressionState(event.sourceNode, event.executionScope);
        if (alias && state) {
          setAliasState(alias, state);
        }
        return;
      }
      if (event.type === 'ctxResourceAliasBind') {
        if (!event.alwaysRuns) {
          return;
        }
        const alias = findDeclaredAlias(event.aliasName, event.index);
        if (alias) {
          setAliasState(alias, getCtxState(event.executionScope));
        }
        return;
      }
      const target = getResourceCallTarget(event.node, event.executionScope);
      if (!target) {
        return;
      }
      if (target.method === 'setDataSourceKey') {
        if (!event.alwaysRuns) {
          return;
        }
        target.updateState(applyStaticResourceStateMethod(target.state, target.method, event.node));
        return;
      }
      if (target.method === 'setResourceName') {
        if (!event.alwaysRuns) {
          return;
        }
        target.updateState(applyStaticResourceStateMethod(target.state, target.method, event.node));
        return;
      }
      if (target.method !== 'setFilter') {
        return;
      }
      const filterArg = unwrapAstChainExpression(event.node.arguments?.[0]);
      if (!filterArg || filterArg.type !== 'ObjectExpression') {
        return;
      }
      entries.push(
        ...collectAstResourceFilterObjectErrors({
          source,
          path: '',
          capability: target.capability,
          dataSourceKey: target.state.dataSourceKey,
          collectionName: target.state.collectionName,
          resourceType: target.state.resourceType,
          filterObject: filterArg,
          context,
          index: typeof filterArg.start === 'number' ? filterArg.start : event.node.start || 0,
        }),
      );
    });

  entries.push(
    ...collectAstForwardedResourceFilterArgumentErrors({
      ast,
      source,
      identifierBindings,
      stringBindings,
      context,
    }),
  );

  return entries;
}

function collectAstForwardedResourceFilterArgumentErrors(input: {
  ast: any;
  source: string;
  identifierBindings: AstIdentifierBinding[];
  stringBindings: StaticStringBinding[];
  context: RunJsAuthoringContext;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const helpers = collectAstResourceFilterHelpers(input.ast, input.source, input.identifierBindings);
  if (!helpers.length) {
    return [];
  }

  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  walkAstAncestor(input.ast, {
    CallExpression(node: any) {
      const callee = unwrapAstChainExpression(node.callee);
      if (callee?.type !== 'Identifier') {
        return;
      }
      const helper = resolveAstAliasBinding(callee.name, node.start || 0, helpers, input.identifierBindings);
      if (!helper) {
        return;
      }

      const filterArg = unwrapAstChainExpression(node.arguments?.[helper.filterParamIndex]);
      if (filterArg?.type !== 'ObjectExpression') {
        return;
      }

      const collectionName =
        helper.collectionName ||
        resolveAstResourceFilterHelperCollectionName(
          helper,
          node.arguments,
          input.source,
          input.stringBindings,
          input.identifierBindings,
        );
      if (!collectionName) {
        return;
      }

      errors.push(
        ...collectAstResourceFilterObjectErrors({
          source: input.source,
          path: '',
          capability: `${helper.name}.setFilter`,
          dataSourceKey: helper.dataSourceKey || 'main',
          collectionName,
          resourceType: helper.resourceType || 'unknown',
          filterObject: filterArg,
          context: input.context,
          index: typeof filterArg.start === 'number' ? filterArg.start : node.start || 0,
        }),
      );
    },
  });
  return errors;
}

type AstResourceFilterHelper = SourceRange & {
  collectionName?: string;
  collectionParamIndex?: number;
  dataSourceKey?: string;
  declarationStart?: number;
  filterParamIndex: number;
  name: string;
  resourceType?: FlowResourceInstanceType;
};

type AstResourceFilterHelperResourceState = {
  collectionName: string;
  collectionParamNames: Set<string>;
  dataSourceKey: string;
  filterParamNames: Set<string>;
  resourceType?: FlowResourceInstanceType;
};

function collectAstResourceFilterHelpers(
  ast: any,
  source: string,
  identifierBindings: AstIdentifierBinding[],
): AstResourceFilterHelper[] {
  const helpers: AstResourceFilterHelper[] = [];
  const addHelper = (name: string, functionNode: any, bindingNode: any, scope: SourceRange) => {
    if (!name || !functionNode?.params?.length) {
      return;
    }
    const paramNames = functionNode.params.map(getAstBindingIdentifierName);
    const resourceStates = new Map<string, AstResourceFilterHelperResourceState>();
    const isInsideNestedFunction = (ancestors: any[]) =>
      ancestors.some((ancestor) => ancestor !== functionNode.body && isAstFunctionLike(ancestor));
    const ensureResourceState = (
      name: string,
      factory?: AstFlowResourceSource,
    ): AstResourceFilterHelperResourceState | undefined => {
      if (!name) {
        return undefined;
      }
      const existing = resourceStates.get(name);
      if (existing) {
        if (factory?.resourceType) {
          existing.resourceType = factory.resourceType;
        }
        return existing;
      }
      const state: AstResourceFilterHelperResourceState = {
        collectionName: '',
        collectionParamNames: new Set(),
        dataSourceKey: 'main',
        filterParamNames: new Set(),
        resourceType: factory?.resourceType,
      };
      resourceStates.set(name, state);
      return state;
    };
    const getResourceStateForMember = (memberExpression: any): AstResourceFilterHelperResourceState | undefined => {
      const object = unwrapAstChainExpression(memberExpression?.object);
      if (object?.type !== 'Identifier') {
        return undefined;
      }
      return resourceStates.get(object.name);
    };
    const collectResourceAlias = (aliasName: string, sourceNode: any) => {
      const factory = getAstFlowResourceFactoryCallFromAst(sourceNode, [], source, [], identifierBindings);
      if (factory) {
        ensureResourceState(aliasName, factory);
      }
    };

    walkAstAncestor(functionNode.body || functionNode, {
      AssignmentExpression(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors) || node.left?.type !== 'Identifier') {
          return;
        }
        collectResourceAlias(node.left.name, node.right);
      },
      CallExpression(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors)) {
          return;
        }
        const callee = unwrapAstChainExpression(node.callee);
        if (callee?.type !== 'MemberExpression') {
          return;
        }
        const resourceState = getResourceStateForMember(callee);
        if (!resourceState) {
          return;
        }
        const method = getAstStaticPropertyName(callee);
        if (method === 'setFilter') {
          const arg = unwrapAstChainExpression(node.arguments?.[0]);
          if (arg?.type === 'Identifier' && paramNames.includes(arg.name)) {
            resourceState.filterParamNames.add(arg.name);
          }
          return;
        }
        if (method === 'setResourceName') {
          const arg = unwrapAstChainExpression(node.arguments?.[0]);
          if (arg?.type === 'Identifier' && paramNames.includes(arg.name)) {
            resourceState.collectionParamNames.add(arg.name);
            return;
          }
          const resolved = resolveAstStaticStringValue(arg, source);
          if (typeof resolved === 'string') {
            resourceState.collectionName = resolved;
          }
          return;
        }
        if (method === 'setDataSourceKey') {
          const resolved = resolveAstStaticStringValue(node.arguments?.[0], source);
          if (typeof resolved === 'string') {
            resourceState.dataSourceKey = resolved;
          }
        }
      },
      VariableDeclarator(node: any, ancestors: any[]) {
        if (isInsideNestedFunction(ancestors) || node.id?.type !== 'Identifier') {
          return;
        }
        collectResourceAlias(node.id.name, node.init);
      },
    });

    for (const state of resourceStates.values()) {
      state.filterParamNames.forEach((filterParamName) => {
        const filterParamIndex = paramNames.indexOf(filterParamName);
        if (filterParamIndex < 0) {
          return;
        }
        const collectionParamIndex = Array.from(state.collectionParamNames)
          .map((paramName) => paramNames.indexOf(paramName))
          .find((index) => index >= 0);
        helpers.push({
          collectionName: state.collectionName,
          collectionParamIndex,
          dataSourceKey: state.dataSourceKey,
          declarationStart: typeof bindingNode?.start === 'number' ? bindingNode.start : scope.start,
          filterParamIndex,
          name,
          resourceType: state.resourceType,
          start: scope.start,
          end: scope.end,
        });
      });
    }
  };

  walkAstAncestor(ast, {
    FunctionDeclaration(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      addHelper(node.id.name, node, node.id, getAstBindingScopeRange(ancestors.slice(0, -1), source.length));
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier' || !isAstFunctionLike(unwrapAstChainExpression(node.init))) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addHelper(
        node.id.name,
        unwrapAstChainExpression(node.init),
        node.id,
        getAstBindingScopeRange(ancestors, source.length, declaration?.kind === 'var'),
      );
    },
  });

  return helpers;
}

function resolveAstResourceFilterHelperCollectionName(
  helper: AstResourceFilterHelper,
  args: any[],
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
) {
  if (typeof helper.collectionParamIndex !== 'number') {
    return '';
  }
  const arg = args?.[helper.collectionParamIndex];
  if (!arg) {
    return '';
  }
  const resolved = resolveAstResourceTypeExpression(arg, source, stringBindings, identifierBindings);
  return resolved.status === 'resolved' ? resolved.value : '';
}

function collectAstResourceFilterObjectErrors(input: {
  source: string;
  path: string;
  capability: string;
  dataSourceKey?: string;
  collectionName?: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  index: number;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (
    input.resourceType !== 'unknown' &&
    input.resourceType !== 'MultiRecordResource' &&
    input.resourceType !== 'SingleRecordResource'
  ) {
    return [];
  }
  if (!input.dataSourceKey || !input.collectionName || !input.context.getCollection) {
    return [];
  }
  const dataSourceKey = input.dataSourceKey;
  const collectionName = input.collectionName;
  const collection = input.context.getCollection(dataSourceKey, collectionName);
  if (!collection) {
    return [
      {
        capability: input.capability,
        collectionName,
        dataSourceKey,
        index: input.index,
        message: `flowSurfaces authoring ${input.capability}(...) references unknown collection '${dataSourceKey}.${collectionName}' while validating setFilter(...)`,
        resourceType: input.resourceType,
        ruleId: 'runjs-resource-collection-unknown',
      },
    ];
  }
  return collectAstResourceFilterProperties({
    ...input,
    collectionName,
    dataSourceKey,
    collection,
    rootCollection: collection,
  });
}

function collectAstResourceFilterProperties(input: {
  source: string;
  path: string;
  capability: string;
  dataSourceKey: string;
  collectionName: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  collection: any;
  rootCollection: any;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  for (const property of input.filterObject.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!key) {
      continue;
    }
    const keyIndex = typeof property.key?.start === 'number' ? property.key.start : property.start || 0;
    if (key === '$not') {
      const value = unwrapAstChainExpression(property.value);
      if (value?.type === 'ObjectExpression') {
        errors.push(
          ...collectAstResourceFilterProperties({
            ...input,
            filterObject: value,
          }),
        );
      }
      continue;
    }
    if (key === '$and' || key === '$or') {
      const value = unwrapAstChainExpression(property.value);
      if (value?.type === 'ArrayExpression') {
        for (const element of value.elements || []) {
          const child = unwrapAstChainExpression(element);
          if (child?.type === 'ObjectExpression') {
            errors.push(
              ...collectAstResourceFilterProperties({
                ...input,
                filterObject: child,
              }),
            );
          }
        }
      }
      continue;
    }
    if (key.startsWith('$')) {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      continue;
    }
    const fieldPath = input.path ? `${input.path}.${key}` : key;
    const resolved = resolveRunJsResourceFilterFieldPath(
      input.rootCollection,
      input.dataSourceKey,
      fieldPath,
      input.context,
    );
    if (!resolved.field) {
      errors.push(
        buildRunJsResourceFilterFieldError({
          ...input,
          collection: resolved.collection || input.collection,
          fieldPath,
          index: keyIndex,
        }),
      );
      continue;
    }
    const value = unwrapAstChainExpression(property.value);
    if (value?.type === 'ObjectExpression') {
      errors.push(
        ...collectAstResourceFilterValueObjectErrors({
          ...input,
          field: resolved.field,
          fieldPath,
          filterObject: value,
          collection: resolved.collection || input.collection,
        }),
      );
    }
  }
  return errors;
}

function collectAstResourceFilterValueObjectErrors(input: {
  source: string;
  capability: string;
  dataSourceKey: string;
  collectionName: string;
  resourceType: FlowResourceInstanceType;
  filterObject: any;
  context: RunJsAuthoringContext;
  collection: any;
  rootCollection: any;
  field: any;
  fieldPath: string;
}): RunJsAstInspection['invalidResourceFilterCalls'] {
  const errors: RunJsAstInspection['invalidResourceFilterCalls'] = [];
  if (isRunJsJsonLikeField(input.field)) {
    return errors;
  }
  for (const property of input.filterObject.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!key) {
      continue;
    }
    const keyIndex = typeof property.key?.start === 'number' ? property.key.start : property.start || 0;
    if (key === '$not') {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      const value = unwrapAstChainExpression(property.value);
      if (value?.type === 'ObjectExpression') {
        errors.push(
          ...collectAstResourceFilterValueObjectErrors({
            ...input,
            filterObject: value,
          }),
        );
      }
      continue;
    }
    if (key.startsWith('$')) {
      collectAstResourceFilterOperatorErrors(key, keyIndex, input).forEach((entry) => errors.push(entry));
      const invalidDateValue = buildRunJsResourceDateFilterValueError(key, keyIndex, property.value, input);
      if (invalidDateValue) {
        errors.push(invalidDateValue);
      }
      continue;
    }
    if (!isAssociationField(input.field)) {
      errors.push(buildRunJsResourceFilterOperatorError(key, keyIndex, input));
      continue;
    }
    const nestedFieldPath = `${input.fieldPath}.${key}`;
    const resolved = resolveRunJsResourceFilterFieldPath(
      input.rootCollection,
      input.dataSourceKey,
      nestedFieldPath,
      input.context,
    );
    if (!resolved.field) {
      errors.push(
        buildRunJsResourceFilterFieldError({
          ...input,
          collection: resolved.collection || input.collection,
          fieldPath: nestedFieldPath,
          index: keyIndex,
        }),
      );
      continue;
    }
    const value = unwrapAstChainExpression(property.value);
    if (value?.type === 'ObjectExpression') {
      errors.push(
        ...collectAstResourceFilterValueObjectErrors({
          ...input,
          collection: resolved.collection || input.collection,
          field: resolved.field,
          fieldPath: nestedFieldPath,
          filterObject: value,
        }),
      );
    }
  }
  return errors;
}

function collectAstResourceFilterOperatorErrors(
  operator: string,
  index: number,
  input: {
    capability: string;
    dataSourceKey: string;
    collectionName: string;
    resourceType: FlowResourceInstanceType;
  },
): RunJsAstInspection['invalidResourceFilterCalls'] {
  if (isRunJsSupportedFilterOperator(operator)) {
    return [];
  }
  return [
    {
      capability: input.capability,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      index,
      message: `flowSurfaces authoring ${input.capability}(...) uses unsupported filter operator '${operator}'`,
      operator,
      resourceType: input.resourceType,
      ruleId: 'runjs-resource-filter-operator-invalid',
    },
  ];
}

function buildRunJsResourceFilterOperatorError(
  operator: string,
  index: number,
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    fieldPath: string;
    resourceType: FlowResourceInstanceType;
  },
): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const suggestedOperator = getSuggestedRunJsFilterOperator(operator);
  if (suggestedOperator) {
    return {
      capability: input.capability,
      collectionName: input.collectionName,
      dataSourceKey: input.dataSourceKey,
      fieldPath: input.fieldPath,
      index,
      message: `flowSurfaces authoring ${input.capability}(...) uses filter operator '${operator}' without '$' for field '${input.fieldPath}'; use '${suggestedOperator}'`,
      operator,
      resourceType: input.resourceType,
      ruleId: 'runjs-resource-filter-operator-missing-dollar',
      suggestedOperator,
    };
  }
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    fieldPath: input.fieldPath,
    index,
    message: `flowSurfaces authoring ${input.capability}(...) uses unsupported filter operator '${operator}' for field '${input.fieldPath}'`,
    operator,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-operator-invalid',
  };
}

function buildRunJsResourceDateFilterValueError(
  operator: string,
  index: number,
  valueNode: any,
  input: {
    capability: string;
    collectionName: string;
    dataSourceKey: string;
    field: any;
    fieldPath: string;
    resourceType: FlowResourceInstanceType;
    source: string;
  },
): RunJsAstInspection['invalidResourceFilterCalls'][number] | null {
  const valueObject = unwrapAstChainExpression(valueNode);
  if (!isRunJsDateFilterOperator(operator) || valueObject?.type !== 'ObjectExpression') {
    return null;
  }
  const unsupportedKeys = collectRunJsUnsupportedDateRangeValueKeys(valueObject);
  if (!unsupportedKeys.length) {
    return null;
  }
  const suggestedValue = buildSuggestedRunJsDateRangeValue(valueObject, input.source);
  const relativeExample = suggestedValue || { type: 'past', number: 7, unit: 'day' };
  const examples = {
    relativePeriod: {
      [input.fieldPath]: {
        [operator]: relativeExample,
      },
    },
    explicitRange: {
      [input.fieldPath]: {
        $dateBetween: ['YYYY-MM-DD', 'YYYY-MM-DD'],
      },
    },
  };
  const suggestedText = suggestedValue
    ? `use ${operator}: ${JSON.stringify(suggestedValue)} for this relative period`
    : `use a frontend relative period object such as ${JSON.stringify(relativeExample)}`;
  const fieldType = String(getFieldType(input.field) || '').trim();
  const fieldInterface = String(getFieldInterface(input.field) || '').trim();
  return {
    capability: input.capability,
    collectionName: input.collectionName,
    dataSourceKey: input.dataSourceKey,
    examples,
    fieldPath: input.fieldPath,
    index,
    message: `flowSurfaces authoring ${input.capability}(...) uses invalid date filter value for field '${
      input.fieldPath
    }' with operator '${operator}': ${unsupportedKeys.join(
      ', ',
    )} are not supported FlowResource date filter keys. ${suggestedText}, or use $dateBetween with ["YYYY-MM-DD", "YYYY-MM-DD"].`,
    operator,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-date-range-object-invalid',
    suggestedOperator: operator === '$dateBetween' ? '$dateBetween' : operator,
    suggestedValue: relativeExample,
    unsupportedKeys,
    fieldType,
    fieldInterface,
  };
}

function isRunJsDateFilterOperator(operator: string) {
  return RUNJS_DATE_FILTER_OPERATORS.has(String(operator || '').trim());
}

function collectRunJsUnsupportedDateRangeValueKeys(objectExpression: any) {
  const keys: string[] = [];
  for (const property of objectExpression.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS.has(key)) {
      keys.push(key);
    }
  }
  return keys;
}

function buildSuggestedRunJsDateRangeValue(objectExpression: any, source: string) {
  const values: Record<string, string> = {};
  for (const property of objectExpression.properties || []) {
    if (!property || property.type === 'SpreadElement') {
      continue;
    }
    const key = getAstStaticPropertyName(property);
    if (!RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS.has(key)) {
      continue;
    }
    const value = resolveAstStaticStringValue(property.value, source);
    if (typeof value === 'string') {
      values[key] = value.trim();
    }
  }

  const from = values.$dateFrom;
  const to = values.$dateTo;
  const fromOffset = parseRunJsRelativeDateOffset(from);
  const toOffset = parseRunJsRelativeDateOffset(to);
  if (to === 'now' && fromOffset?.direction === 'past') {
    return {
      type: 'past',
      number: fromOffset.number,
      unit: fromOffset.unit,
    };
  }
  if (from === 'now' && toOffset?.direction === 'next') {
    return {
      type: 'next',
      number: toOffset.number,
      unit: toOffset.unit,
    };
  }
  return undefined;
}

function parseRunJsRelativeDateOffset(value: string | undefined) {
  const match = String(value || '')
    .trim()
    .match(/^([+-])\s*(\d+)\s*(d|day|days|w|week|weeks|m|mo|month|months|q|quarter|quarters|y|year|years)$/i);
  if (!match) {
    return null;
  }
  const unit = normalizeRunJsRelativeDateUnit(match[3]);
  if (!unit) {
    return null;
  }
  return {
    direction: match[1] === '-' ? 'past' : 'next',
    number: Number(match[2]),
    unit,
  };
}

function normalizeRunJsRelativeDateUnit(value: string): 'day' | 'week' | 'month' | 'quarter' | 'year' | '' {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'd' || normalized === 'day' || normalized === 'days') {
    return 'day';
  }
  if (normalized === 'w' || normalized === 'week' || normalized === 'weeks') {
    return 'week';
  }
  if (normalized === 'm' || normalized === 'mo' || normalized === 'month' || normalized === 'months') {
    return 'month';
  }
  if (normalized === 'q' || normalized === 'quarter' || normalized === 'quarters') {
    return 'quarter';
  }
  if (normalized === 'y' || normalized === 'year' || normalized === 'years') {
    return 'year';
  }
  return '';
}

function buildRunJsResourceFilterFieldError(input: {
  capability: string;
  collection: any;
  collectionName: string;
  dataSourceKey: string;
  fieldPath: string;
  index: number;
  resourceType: FlowResourceInstanceType;
}): RunJsAstInspection['invalidResourceFilterCalls'][number] {
  const collectionName = getCollectionName(input.collection) || input.collectionName;
  return {
    availableFields: getCollectionFields(input.collection)
      .map((field) => String(getFieldName(field) || '').trim())
      .filter(Boolean),
    capability: input.capability,
    collectionName,
    dataSourceKey: input.dataSourceKey,
    fieldPath: input.fieldPath,
    index: input.index,
    message: `flowSurfaces authoring ${input.capability}(...) references unknown filter field '${input.fieldPath}' on collection '${collectionName}'`,
    resourceType: input.resourceType,
    ruleId: 'runjs-resource-filter-field-unknown',
  };
}

function resolveRunJsResourceFilterFieldPath(
  collection: any,
  dataSourceKey: string,
  fieldPath: string,
  context: RunJsAuthoringContext,
): { collection: any; field: any } {
  if (typeof collection?.getFieldByPath === 'function') {
    const direct = collection.getFieldByPath(fieldPath);
    if (direct) {
      return { collection, field: direct };
    }
  }
  const direct = resolveFieldFromCollection(collection, fieldPath);
  if (direct) {
    return { collection, field: direct };
  }
  let currentCollection = collection;
  let currentDataSourceKey = dataSourceKey || collection?.dataSourceKey || 'main';
  const parts = String(fieldPath || '')
    .split('.')
    .filter(Boolean);
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const field = getRunJsCollectionField(currentCollection, part);
    if (!field) {
      return { collection: currentCollection, field: null };
    }
    if (index === parts.length - 1) {
      return { collection: currentCollection, field };
    }
    if (!isAssociationField(field)) {
      return { collection: currentCollection, field: null };
    }
    const targetCollection = resolveFieldTargetCollection(
      field,
      currentCollection?.dataSourceKey || currentDataSourceKey,
      (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
    );
    if (!targetCollection) {
      return { collection: currentCollection, field: null };
    }
    currentCollection = targetCollection;
    currentDataSourceKey = targetCollection?.dataSourceKey || currentDataSourceKey;
  }
  return { collection: currentCollection, field: null };
}

function getRunJsCollectionField(collection: any, fieldName: string) {
  const normalized = String(fieldName || '').trim();
  if (!normalized) {
    return null;
  }
  const field = collection?.getField?.(normalized) || collection?.fields?.get?.(normalized);
  if (field) {
    return field;
  }
  const modelAttributes =
    (typeof collection?.model?.getAttributes === 'function' ? collection.model.getAttributes() : null) ||
    collection?.model?.rawAttributes ||
    collection?.model?.attributes ||
    {};
  const modelAttribute = modelAttributes?.[normalized];
  if (modelAttribute) {
    return {
      name: normalized,
      type: modelAttribute.type?.key || modelAttribute.type,
      interface: modelAttribute.interface,
    };
  }
  if (normalized === 'id') {
    return {
      name: 'id',
      type: 'bigInt',
      interface: 'id',
    };
  }
  return null;
}

function isRunJsJsonLikeField(field: any) {
  const type = String(getFieldType(field) || '')
    .trim()
    .toLowerCase();
  return type === 'json' || type === 'jsonb' || type === 'array';
}

function buildRunJsSupportedFilterOperators() {
  const supported = new Set<string>(Object.keys(databaseOperators || {}));
  for (const key in Op) {
    const snakeKey = _.snakeCase(key);
    supported.add(`$${key}`);
    supported.add(`$${snakeKey}`);
    supported.add(`$${snakeKey.replace(/_/g, '')}`);
  }
  return supported;
}

function isRunJsSupportedFilterOperator(operator: string) {
  return RUNJS_SUPPORTED_FILTER_OPERATORS.has(String(operator || '').trim());
}

function getSuggestedRunJsFilterOperator(operator: string) {
  const normalized = String(operator || '').trim();
  if (!normalized || normalized.startsWith('$')) {
    return '';
  }
  const suggested = `$${normalized}`;
  return isRunJsSupportedFilterOperator(suggested) ? suggested : '';
}

function getMaybeAstFlowResourceSourceFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource | undefined {
  return selectAstFlowResourceSource(
    collectPossibleAstFlowResourceSourcesFromAst(
      node,
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    ),
  );
}

function collectPossibleAstFlowResourceSourcesFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource[] {
  const direct = getDirectAstFlowResourceSourceFromAst(
    node,
    aliases,
    source,
    identifierBindings,
    ctxMethodAliases,
    stringBindings,
  );
  if (direct) {
    return [direct];
  }

  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return [
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.consequent,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.alternate,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
    ];
  }
  if (unwrapped.type === 'LogicalExpression') {
    return [
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.left,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
      ...collectPossibleAstFlowResourceSourcesFromAst(
        unwrapped.right,
        aliases,
        source,
        identifierBindings,
        ctxMethodAliases,
        stringBindings,
      ),
    ];
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectPossibleAstFlowResourceSourcesFromAst(
      expressions[expressions.length - 1],
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    );
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectPossibleAstFlowResourceSourcesFromAst(
      unwrapped.right,
      aliases,
      source,
      identifierBindings,
      ctxMethodAliases,
      stringBindings,
    );
  }
  return [];
}

function getDirectAstFlowResourceSourceFromAst(
  node: any,
  aliases: AstFlowResourceAlias[],
  source: string,
  identifierBindings: AstIdentifierBinding[],
  ctxMethodAliases: CtxMethodAlias[],
  stringBindings: StaticStringBinding[],
): AstFlowResourceSource | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    return alias
      ? {
          capability: alias.capability,
          index: typeof unwrapped.start === 'number' ? unwrapped.start : alias.start,
          resourceType: alias.resourceType,
        }
      : undefined;
  }
  if (isAstCtxResourceMember(unwrapped, identifierBindings)) {
    return {
      capability: 'ctx.resource',
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      resourceType: 'unknown',
    };
  }
  return getAstFlowResourceFactoryCallFromAst(unwrapped, ctxMethodAliases, source, stringBindings, identifierBindings);
}

function getAstFlowResourceFactoryCallFromAst(
  node: any,
  ctxMethodAliases: CtxMethodAlias[],
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): AstFlowResourceSource | undefined {
  const call = unwrapAstChainExpression(node);
  if (!call || call.type !== 'CallExpression') {
    return undefined;
  }
  const method = resolveCtxMethodCall(call, ctxMethodAliases, identifierBindings);
  if (!method || (method.method !== 'makeResource' && method.method !== 'initResource')) {
    return undefined;
  }
  const firstArg = call.arguments?.[0];
  if (!firstArg) {
    return undefined;
  }
  const resolved = resolveAstResourceTypeExpression(firstArg, source, stringBindings, identifierBindings);
  if (resolved.status !== 'resolved') {
    return undefined;
  }
  const allowedResourceTypes = method.method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
  if (!allowedResourceTypes.has(resolved.value) || !isKnownFlowResourceInstanceType(resolved.value)) {
    return undefined;
  }
  return {
    capability: method.capability,
    index: typeof call.start === 'number' ? call.start : 0,
    resourceType: resolved.value,
  };
}

function isAstCtxResourceMember(node: any, identifierBindings: AstIdentifierBinding[]) {
  const member = unwrapAstChainExpression(node);
  return (
    member?.type === 'MemberExpression' &&
    getAstStaticPropertyName(member) === 'resource' &&
    isUnshadowedCtxIdentifier(member.object, identifierBindings)
  );
}

function selectAstFlowResourceSource(sources: AstFlowResourceSource[]): AstFlowResourceSource | undefined {
  if (!sources.length) {
    return undefined;
  }
  const resourceTypes = [...new Set(sources.map((entry) => entry.resourceType))];
  if (resourceTypes.length === 1) {
    return sources[0];
  }
  return {
    capability: sources.map((entry) => entry.capability).join('|'),
    index: Math.min(...sources.map((entry) => entry.index)),
    resourceType: 'unknown',
  };
}

function getFlowResourceAllowedMethods(resourceType: FlowResourceInstanceType | undefined) {
  if (!resourceType || resourceType === 'unknown') {
    return UNKNOWN_FLOW_RESOURCE_METHODS;
  }
  return FLOW_RESOURCE_METHODS_BY_TYPE[resourceType] || UNKNOWN_FLOW_RESOURCE_METHODS;
}

function getSuggestedFlowResourceMethod(method: string) {
  const exactSuggestion = FLOW_RESOURCE_METHOD_SUGGESTIONS.get(method);
  if (exactSuggestion) {
    return exactSuggestion;
  }
  if (method.endsWith('s')) {
    const singular = method.slice(0, -1);
    if (UNKNOWN_FLOW_RESOURCE_METHODS.has(singular)) {
      return singular;
    }
  }
  return undefined;
}

function isKnownFlowResourceInstanceType(value: string): value is Exclude<FlowResourceInstanceType, 'unknown'> {
  return value in FLOW_RESOURCE_METHODS_BY_TYPE;
}

function collectAstInvalidCtxLibPatternAccesses(
  ast: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxLibMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [];
  const collectPattern = (pattern: any, sourceNode: any) => {
    const sourcePath = getCtxLibMemberPathFromAst(sourceNode, aliases, rootAliases, identifierBindings, source);
    if (!sourcePath || sourcePath.hasDynamicMember || sourcePath.members.length) {
      return;
    }
    collectInvalidCtxLibObjectPatternAccesses(pattern, sourcePath).forEach((entry) => entries.push(entry));
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any) {
      if (node.operator !== '=' || node.left?.type !== 'ObjectPattern') {
        return;
      }
      collectPattern(node.left, node.right);
    },
    VariableDeclarator(node: any) {
      if (node.id?.type !== 'ObjectPattern') {
        return;
      }
      collectPattern(node.id, node.init);
    },
  });

  return dedupeIndexedEntries(entries);
}

function collectInvalidCtxLibObjectPatternAccesses(
  pattern: any,
  sourcePath: NonNullable<ReturnType<typeof getCtxLibMemberPathFromAst>>,
): RunJsAstInspection['invalidCtxLibMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxLibMemberAccesses'] = [];
  for (const property of pattern?.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (!member) {
      continue;
    }
    const invalidAccess = buildInvalidCtxLibMemberAccess({
      ...sourcePath,
      members: [
        {
          accessKind: 'destructure',
          index: typeof property.key?.start === 'number' ? property.key.start : property.start || 0,
          name: member,
        },
      ],
    });
    if (invalidAccess) {
      entries.push(invalidAccess);
    }
  }
  return entries;
}

function collectAstInvalidCtxLibMemberAccess(
  node: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxLibMemberAccesses'][number] | undefined {
  const path = getCtxLibMemberPathFromAst(node, aliases, rootAliases, identifierBindings, source);
  if (!path || path.hasDynamicMember || !path.members.length) {
    return undefined;
  }
  return buildInvalidCtxLibMemberAccess(path);
}

function buildInvalidCtxLibMemberAccess(path: {
  library: string;
  members: Array<{ accessKind: 'bracket' | 'destructure' | 'member'; index: number; name: string }>;
  rootCapability: string;
}): RunJsAstInspection['invalidCtxLibMemberAccesses'][number] | undefined {
  const allowedMembers = RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY.get(path.library);
  const member = path.members[0];
  if (!allowedMembers || !member || allowedMembers.has(member.name)) {
    return undefined;
  }
  return {
    accessKind: member.accessKind,
    capability: getCtxLibMemberCapability(path.rootCapability, member),
    index: member.index,
    library: path.library,
    member: member.name,
    ruleId: 'runjs-ctx-libs-member-unknown',
    suggestedImport: getSuggestedCtxLibMemberImport(path.library, member.name),
  };
}

function getCtxLibMemberCapability(
  rootCapability: string,
  member: { accessKind: 'bracket' | 'destructure' | 'member'; name: string },
) {
  return member.accessKind === 'bracket'
    ? `${rootCapability}[${JSON.stringify(member.name)}]`
    : `${rootCapability}.${member.name}`;
}

function getSuggestedCtxLibMemberImport(library: string, member: string) {
  if (library === 'antd' && member === 'colors') {
    return '@ant-design/colors';
  }
  return undefined;
}

function getCtxLibMemberPathFromAst(
  node: any,
  aliases: CtxLibAlias[],
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
):
  | {
      dynamicIndex: number;
      hasDynamicMember: boolean;
      library: string;
      libraryIndex: number;
      memberIndex: number;
      members: Array<{ accessKind: 'bracket' | 'destructure' | 'member'; index: number; name: string }>;
      rootCapability: string;
    }
  | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    if (!alias) {
      return undefined;
    }
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : alias.start;
    return {
      dynamicIndex: index,
      hasDynamicMember: false,
      library: alias.library,
      libraryIndex: index,
      memberIndex: index,
      members: [],
      rootCapability: alias.capability,
    };
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }

  const objectPath = getCtxLibMemberPathFromAst(unwrapped.object, aliases, rootAliases, identifierBindings, source);
  if (objectPath) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    return {
      ...objectPath,
      dynamicIndex: propertyName ? objectPath.dynamicIndex : propertyIndex,
      hasDynamicMember: objectPath.hasDynamicMember || !propertyName,
      memberIndex: objectPath.members.length ? objectPath.memberIndex : propertyIndex,
      members: propertyName
        ? [
            ...objectPath.members,
            {
              accessKind: unwrapped.computed ? 'bracket' : 'member',
              index: propertyIndex,
              name: propertyName,
            },
          ]
        : objectPath.members,
    };
  }

  return getDirectCtxLibPathFromAst(unwrapped, rootAliases, identifierBindings, source);
}

function getDirectCtxLibPathFromAst(
  node: any,
  rootAliases: CtxLibsRootAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): ReturnType<typeof getCtxLibMemberPathFromAst> {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return undefined;
  }
  const propertyName = getAstStaticPropertyName(member);
  if (!propertyName) {
    return undefined;
  }
  const propertyIndex = typeof member.property?.start === 'number' ? member.property.start : member.start || 0;
  if (isCtxLibsRootFromAst(member.object, rootAliases, identifierBindings)) {
    return {
      dynamicIndex: propertyIndex,
      hasDynamicMember: false,
      library: propertyName,
      libraryIndex: propertyIndex,
      memberIndex: propertyIndex,
      members: [],
      rootCapability: getAstSource(member, source) || `ctx.libs.${propertyName}`,
    };
  }
  if (
    CANONICAL_CTX_LIB_MEMBERS.includes(propertyName) &&
    isUnshadowedCtxIdentifier(member.object, identifierBindings)
  ) {
    return {
      dynamicIndex: propertyIndex,
      hasDynamicMember: false,
      library: propertyName,
      libraryIndex: propertyIndex,
      memberIndex: propertyIndex,
      members: [],
      rootCapability: getAstSource(member, source) || `ctx.${propertyName}`,
    };
  }
  return undefined;
}

function isCtxLibsRootFromAst(node: any, rootAliases: CtxLibsRootAlias[], identifierBindings: AstIdentifierBinding[]) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'Identifier') {
    return !!resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, rootAliases, identifierBindings);
  }
  return (
    unwrapped.type === 'MemberExpression' &&
    getAstStaticPropertyName(unwrapped) === 'libs' &&
    isUnshadowedCtxIdentifier(unwrapped.object, identifierBindings)
  );
}

function collectAstInvalidCtxApiPatternAccesses(
  ast: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  const collectPattern = (pattern: any, capability: CtxApiAlias['capability']) => {
    collectInvalidCtxApiObjectPatternAccesses(pattern, getCtxApiCapabilityMemberPrefix(capability)).forEach((entry) =>
      entries.push(entry),
    );
  };

  walkAstAncestor(ast, {
    AssignmentExpression(node: any) {
      if (node.operator !== '=' || node.left?.type !== 'ObjectPattern') {
        return;
      }
      const capability =
        getCtxApiCapabilityFromAst(node.right, aliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.right, aliases, identifierBindings);
      if (capability) {
        collectPattern(node.left, capability);
      }
    },
    VariableDeclarator(node: any) {
      if (node.id?.type !== 'ObjectPattern') {
        return;
      }
      const capability =
        getCtxApiCapabilityFromAst(node.init, aliases, identifierBindings) ||
        getMaybeCtxApiCapabilityFromAst(node.init, aliases, identifierBindings);
      if (capability) {
        collectPattern(node.id, capability);
      }
    },
  });

  return dedupeIndexedEntries(entries);
}

function getCtxApiCapabilityMemberPrefix(capability: CtxApiAlias['capability']) {
  if (capability === 'ctx.api.auth') {
    return ['auth'];
  }
  if (capability.startsWith('ctx.api.auth.')) {
    return ['auth', capability.slice('ctx.api.auth.'.length)];
  }
  if (capability === 'ctx.api.request') {
    return ['request'];
  }
  if (capability === 'ctx.api.resource') {
    return ['resource'];
  }
  return [];
}

function collectInvalidCtxApiObjectPatternAccesses(
  pattern: any,
  prefix: string[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  for (const property of pattern?.properties || []) {
    if (!property) {
      continue;
    }
    if (property.type === 'RestElement') {
      const dynamicAccess = buildInvalidCtxApiMemberAccess([...prefix, '[...]'], property.start || 0, true);
      if (dynamicAccess) {
        entries.push(dynamicAccess);
      }
      continue;
    }
    if (property.type !== 'Property') {
      continue;
    }

    const member = getAstStaticPropertyName(property);
    if (!member) {
      const dynamicAccess = buildInvalidCtxApiMemberAccess([...prefix, '[...]'], property.start || 0, true);
      if (dynamicAccess) {
        entries.push(dynamicAccess);
      }
      continue;
    }

    const memberPath = [...prefix, member];
    const invalidAccess = buildInvalidCtxApiMemberAccess(
      memberPath,
      typeof property.key?.start === 'number' ? property.key.start : property.start || 0,
    );
    if (invalidAccess) {
      entries.push(invalidAccess);
      continue;
    }

    const nestedPattern = getAstObjectPatternFromValue(property.value);
    if (nestedPattern) {
      collectInvalidCtxApiObjectPatternAccesses(nestedPattern, memberPath).forEach((entry) => entries.push(entry));
    }
  }
  return entries;
}

function collectAstInvalidCtxApiMemberAccess(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
  source: string,
): RunJsAstInspection['invalidCtxApiMemberAccesses'][number] | undefined {
  const access = getCtxApiMemberAccessFromAst(node, aliases, identifierBindings);
  if (!access || !access.memberPath.length) {
    return undefined;
  }
  const invalidAccess = buildInvalidCtxApiMemberAccess(
    access.memberPath,
    access.hasDynamicMember ? access.dynamicIndex : access.memberIndex,
    access.hasDynamicMember,
  );
  return invalidAccess
    ? { ...invalidAccess, match: getAstSource(node, source), matchIndex: node.start || 0 }
    : undefined;
}

function buildInvalidCtxApiMemberAccess(
  memberPath: string[],
  index: number,
  hasDynamicMember = false,
): RunJsAstInspection['invalidCtxApiMemberAccesses'][number] | undefined {
  const capability = `ctx.api.${memberPath.join('.')}`;
  const topLevelMember = memberPath[0];

  if (hasDynamicMember) {
    return {
      capability,
      index,
      ruleId: 'runjs-ctx-api-member-dynamic-unresolved',
    };
  }

  if (!RUNJS_CTX_API_ALLOWED_MEMBERS.has(topLevelMember)) {
    return {
      capability,
      index,
      member: topLevelMember,
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'request' && memberPath.length > 1) {
    return {
      capability,
      index,
      member: memberPath[1],
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'resource' && memberPath.length > 1) {
    return {
      capability,
      index,
      member: memberPath[1],
      ruleId: 'runjs-ctx-api-member-unknown',
    };
  }

  if (topLevelMember === 'auth' && memberPath.length > 1) {
    const authMember = memberPath[1];
    if (!RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(authMember)) {
      return {
        capability,
        index,
        member: authMember,
        ruleId: 'runjs-ctx-api-auth-member-unsupported',
      };
    }
  }

  return undefined;
}

function collectAstInvalidCtxApiReadonlyWrites(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): RunJsAstInspection['invalidCtxApiMemberAccesses'] {
  const entries: RunJsAstInspection['invalidCtxApiMemberAccesses'] = [];
  collectAstWriteTargetNodes(node, (target) => {
    const path = getCtxApiMemberPathFromAst(target, aliases, identifierBindings);
    if (!path?.isCtxApi || path.hasDynamicMember) {
      return;
    }
    const memberPath = path.members.map((member) => member.name);
    if (memberPath[0] !== 'auth') {
      return;
    }
    if (memberPath.length === 1 || RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(memberPath[1])) {
      entries.push({
        capability: `ctx.api.${memberPath.join('.')}`,
        index: path.memberIndex,
        member: memberPath[1] || 'auth',
        ruleId: 'runjs-ctx-api-auth-member-readonly',
      });
    }
  });
  return entries;
}

function collectAstWriteTargetNodes(node: any, visit: (node: any) => void) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'MemberExpression') {
    visit(unwrapped);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstWriteTargetNodes(unwrapped.left, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstWriteTargetNodes(unwrapped.argument, visit);
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (const element of unwrapped.elements || []) {
      collectAstWriteTargetNodes(element, visit);
    }
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstWriteTargetNodes(property.argument, visit);
        continue;
      }
      if (property.type === 'Property') {
        collectAstWriteTargetNodes(property.value, visit);
      }
    }
  }
}

function getAstObjectPatternFromValue(node: any): any | undefined {
  if (node?.type === 'ObjectPattern') {
    return node;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'ObjectPattern') {
    return node.left;
  }
  return undefined;
}

function getCtxApiMemberAccessFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): { dynamicIndex: number; hasDynamicMember: boolean; memberIndex: number; memberPath: string[] } | undefined {
  const path = getCtxApiMemberPathFromAst(node, aliases, identifierBindings);
  if (!path?.isCtxApi) {
    return undefined;
  }
  const memberPath = path.members.map((member) => member.name);
  if (path.hasDynamicMember) {
    memberPath.push('[...]');
  }
  if (!memberPath.length) {
    return undefined;
  }
  return {
    dynamicIndex: path.dynamicIndex,
    hasDynamicMember: path.hasDynamicMember,
    memberIndex: path.memberIndex,
    memberPath,
  };
}

function getCtxApiMemberPathFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
):
  | {
      dynamicIndex: number;
      hasDynamicMember: boolean;
      isCtxApi: true;
      memberIndex: number;
      members: Array<{ index: number; name: string }>;
    }
  | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Identifier') {
    const alias = resolveAstAliasBinding(unwrapped.name, unwrapped.start || 0, aliases, identifierBindings);
    if (!alias) {
      return undefined;
    }
    return {
      dynamicIndex: unwrapped.start || 0,
      hasDynamicMember: false,
      isCtxApi: true,
      memberIndex: unwrapped.start || 0,
      members: getCtxApiAliasMemberPath(alias, unwrapped.start || 0),
    };
  }
  if (unwrapped.type !== 'MemberExpression') {
    return undefined;
  }

  const objectPath = getCtxApiMemberPathFromAst(unwrapped.object, aliases, identifierBindings);
  if (objectPath?.isCtxApi) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    return {
      ...objectPath,
      dynamicIndex: propertyName ? objectPath.dynamicIndex : propertyIndex,
      hasDynamicMember: objectPath.hasDynamicMember || !propertyName,
      memberIndex: objectPath.members.length ? objectPath.memberIndex : propertyIndex,
      members: propertyName
        ? [...objectPath.members, { index: propertyIndex, name: propertyName }]
        : objectPath.members,
    };
  }

  const objectCapability = getMaybeCtxApiCapabilityFromAst(unwrapped.object, aliases, identifierBindings);
  if (objectCapability) {
    const propertyName = getAstStaticPropertyName(unwrapped);
    const propertyIndex =
      typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
    const members = getCtxApiCapabilityMemberPath(objectCapability, unwrapped.object?.start || propertyIndex);
    return {
      dynamicIndex: propertyName ? propertyIndex : propertyIndex,
      hasDynamicMember: !propertyName,
      isCtxApi: true,
      memberIndex: members.length ? members[0].index : propertyIndex,
      members: propertyName ? [...members, { index: propertyIndex, name: propertyName }] : members,
    };
  }

  if (!isUnshadowedCtxIdentifier(unwrapped.object, identifierBindings)) {
    return undefined;
  }
  const propertyName = getAstStaticPropertyName(unwrapped);
  if (propertyName !== 'api') {
    return undefined;
  }
  const propertyIndex = typeof unwrapped.property?.start === 'number' ? unwrapped.property.start : unwrapped.start || 0;
  return {
    dynamicIndex: propertyIndex,
    hasDynamicMember: false,
    isCtxApi: true,
    memberIndex: propertyIndex,
    members: [],
  };
}

function getCtxApiAliasMemberPath(alias: CtxApiAlias, index: number): Array<{ index: number; name: string }> {
  return getCtxApiCapabilityMemberPath(alias.capability, index);
}

function getCtxApiCapabilityMemberPath(
  capability: CtxApiAlias['capability'],
  index: number,
): Array<{ index: number; name: string }> {
  if (capability === 'ctx.api.auth') {
    return [{ index, name: 'auth' }];
  }
  if (capability.startsWith('ctx.api.auth.')) {
    return [
      { index, name: 'auth' },
      { index, name: capability.slice('ctx.api.auth.'.length) },
    ];
  }
  if (capability === 'ctx.api.request') {
    return [{ index, name: 'request' }];
  }
  if (capability === 'ctx.api.resource') {
    return [{ index, name: 'resource' }];
  }
  return [];
}

function getCtxApiCapabilityFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'] | '' {
  const path = getCtxApiMemberPathFromAst(node, aliases, identifierBindings);
  if (!path?.isCtxApi || path.hasDynamicMember) {
    return '';
  }
  if (!path.members.length) {
    return 'ctx.api';
  }
  if (path.members.length === 1 && RUNJS_CTX_API_ALLOWED_MEMBERS.has(path.members[0].name)) {
    return `ctx.api.${path.members[0].name}` as CtxApiAlias['capability'];
  }
  if (
    path.members.length === 2 &&
    path.members[0].name === 'auth' &&
    RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS.has(path.members[1].name)
  ) {
    return `ctx.api.auth.${path.members[1].name}` as CtxApiAlias['capability'];
  }
  return '';
}

function getMaybeCtxApiCapabilityFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'] | '' {
  return selectCtxApiCapability(collectPossibleCtxApiCapabilitiesFromAst(node, aliases, identifierBindings));
}

function collectPossibleCtxApiCapabilitiesFromAst(
  node: any,
  aliases: CtxApiAlias[],
  identifierBindings: AstIdentifierBinding[],
): CtxApiAlias['capability'][] {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return [];
  }

  const directCapability = getCtxApiCapabilityFromAst(unwrapped, aliases, identifierBindings);
  if (directCapability) {
    return [directCapability];
  }

  if (unwrapped.type === 'ConditionalExpression') {
    return uniqueCtxApiCapabilities([
      ...collectPossibleCtxApiCapabilitiesFromAst(unwrapped.consequent, aliases, identifierBindings),
      ...collectPossibleCtxApiCapabilitiesFromAst(unwrapped.alternate, aliases, identifierBindings),
    ]);
  }

  if (unwrapped.type === 'LogicalExpression') {
    const leftCapabilities = collectPossibleCtxApiCapabilitiesFromAst(unwrapped.left, aliases, identifierBindings);
    const rightCapabilities = collectPossibleCtxApiCapabilitiesFromAst(unwrapped.right, aliases, identifierBindings);
    if (unwrapped.operator === '&&' && leftCapabilities.length) {
      return leftCapabilities.every(isCtxApiCapabilityDefinitelyTruthy)
        ? uniqueCtxApiCapabilities(rightCapabilities)
        : uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
    }
    if ((unwrapped.operator === '||' || unwrapped.operator === '??') && leftCapabilities.length) {
      return leftCapabilities.every(isCtxApiCapabilityDefinitelyTruthy)
        ? uniqueCtxApiCapabilities(leftCapabilities)
        : uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
    }
    return uniqueCtxApiCapabilities([...leftCapabilities, ...rightCapabilities]);
  }

  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return collectPossibleCtxApiCapabilitiesFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }

  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return collectPossibleCtxApiCapabilitiesFromAst(unwrapped.right, aliases, identifierBindings);
  }

  return [];
}

function selectCtxApiCapability(capabilities: CtxApiAlias['capability'][]): CtxApiAlias['capability'] | '' {
  const uniqueCapabilities = uniqueCtxApiCapabilities(capabilities);
  if (!uniqueCapabilities.length) {
    return '';
  }
  if (uniqueCapabilities.length === 1) {
    return uniqueCapabilities[0];
  }
  if (uniqueCapabilities.some((capability) => capability === 'ctx.api')) {
    return 'ctx.api';
  }
  const topLevelMembers = new Set(uniqueCapabilities.map((capability) => capability.split('.')[2]));
  if (topLevelMembers.size > 1) {
    return 'ctx.api';
  }
  const topLevelMember = [...topLevelMembers][0];
  if (topLevelMember === 'auth') {
    return 'ctx.api.auth';
  }
  if (topLevelMember === 'request' || topLevelMember === 'resource') {
    return `ctx.api.${topLevelMember}` as CtxApiAlias['capability'];
  }
  return 'ctx.api';
}

function uniqueCtxApiCapabilities(capabilities: Array<CtxApiAlias['capability'] | ''>): CtxApiAlias['capability'][] {
  return [...new Set(capabilities.filter(Boolean) as CtxApiAlias['capability'][])];
}

function isCtxApiCapabilityDefinitelyTruthy(capability: CtxApiAlias['capability']) {
  return (
    capability === 'ctx.api' ||
    capability === 'ctx.api.auth' ||
    capability === 'ctx.api.request' ||
    capability === 'ctx.api.resource' ||
    capability === 'ctx.api.auth.authenticator'
  );
}

function resolveCtxMethodCall(node: any, aliases: CtxMethodAlias[], identifierBindings: AstIdentifierBinding[]) {
  const callee = unwrapAstChainExpression(node.callee);
  const directMethod = getCtxMethodName(callee, identifierBindings);
  if (directMethod) {
    return {
      capability: `ctx.${directMethod}`,
      method: directMethod,
    };
  }
  if (callee?.type === 'Identifier') {
    const alias = resolveAstAliasBinding(callee.name, node.start || 0, aliases, identifierBindings);
    if (alias) {
      return alias;
    }
  }
  return undefined;
}

function getCtxMethodName(node: any, identifierBindings: AstIdentifierBinding[]) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression' || !isUnshadowedCtxIdentifier(member.object, identifierBindings)) {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  return AST_CTX_METHOD_NAMES.has(propertyName) ? propertyName : '';
}

function resolveAstResourceTypeExpression(
  node: any,
  source: string,
  stringBindings: StaticStringBinding[],
  identifierBindings: AstIdentifierBinding[],
): { status: 'resolved'; value: string } | { status: 'unresolved'; expression: string } {
  const resolved = resolveAstStaticStringValue(node, source);
  if (typeof resolved === 'string') {
    return { status: 'resolved', value: resolved };
  }
  if (node?.type === 'Identifier') {
    const binding = resolveAstAliasBinding(node.name, node.start || 0, stringBindings, identifierBindings);
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  return {
    status: 'unresolved',
    expression: source.slice(node?.start || 0, node?.end || node?.start || 0).trim(),
  };
}

function resolveAstStaticStringValue(node: any, source: string): string | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'Literal' && typeof unwrapped.value === 'string') {
    return unwrapped.value;
  }
  if (unwrapped.type === 'TemplateLiteral' && !unwrapped.expressions?.length) {
    return unwrapped.quasis?.[0]?.value?.cooked ?? source.slice(unwrapped.start + 1, unwrapped.end - 1);
  }
  return undefined;
}

function resolveAstAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter((entry) => entry.name === name && index >= entry.start && index < entry.end)
    .sort((left, right) => right.start - left.start);
  return candidates.find((entry) => !hasAstShadowBinding(name, index, entry, identifierBindings));
}

function resolveAstMemberAliasBinding<T extends SourceRange & { name: string }>(
  node: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const lookup = getAstMemberAliasLookup(node);
  if (!lookup) {
    return undefined;
  }
  return resolveAstNamedAliasBinding(lookup.aliasName, lookup.index, lookup.rootName, aliases, identifierBindings);
}

function getAstMemberAliasLookup(node: any): { aliasName: string; index: number; rootName: string } | undefined {
  const member = unwrapAstChainExpression(node);
  if (member?.type !== 'MemberExpression') {
    return undefined;
  }
  const memberKey = getAstStaticMemberKey(member);
  if (!memberKey) {
    return undefined;
  }
  const object = unwrapAstChainExpression(member.object);
  if (object?.type === 'Identifier') {
    return {
      aliasName: `${object.name}.${memberKey}`,
      index: typeof member.start === 'number' ? member.start : typeof object.start === 'number' ? object.start : 0,
      rootName: object.name,
    };
  }
  const objectLookup = getAstMemberAliasLookup(object);
  if (!objectLookup) {
    return undefined;
  }
  return {
    aliasName: `${objectLookup.aliasName}.${memberKey}`,
    index: typeof member.start === 'number' ? member.start : objectLookup.index,
    rootName: objectLookup.rootName,
  };
}

function getAstAliasRootName(name: string) {
  return String(name || '').split('.')[0] || name;
}

function resolveAstNamedAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  rootName: string | undefined,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter((entry) => entry.name === name && index >= entry.start && index < entry.end)
    .sort((left, right) => right.start - left.start);
  return candidates.find(
    (entry) => !hasAstShadowBinding(rootName || getAstAliasRootName(name), index, entry, identifierBindings),
  );
}

function resolveAstDynamicAliasBinding<T extends SourceRange & { name: string }>(
  name: string,
  index: number,
  rootName: string | undefined,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
): T | undefined {
  const candidates = aliases
    .filter(
      (entry) =>
        entry.name !== name &&
        index >= entry.start &&
        index < entry.end &&
        isAstDynamicMemberAliasMatch(entry.name, name),
    )
    .sort((left, right) => right.start - left.start);
  return candidates.find(
    (entry) => !hasAstShadowBinding(rootName || getAstAliasRootName(name), index, entry, identifierBindings),
  );
}

function compareAstAliasPrecedence(
  left: SourceRange & { precedenceStart?: number },
  right: SourceRange & { precedenceStart?: number },
) {
  if (left.start !== right.start) {
    return left.start - right.start;
  }
  return getAstAliasPrecedenceStart(left) - getAstAliasPrecedenceStart(right);
}

function getAstAliasPrecedenceStart(alias: SourceRange & { precedenceStart?: number }) {
  return typeof alias.precedenceStart === 'number' ? alias.precedenceStart : alias.start;
}

function isAstDynamicMemberAliasMatch(patternName: string, name: string) {
  if (!patternName.includes(AST_DYNAMIC_MEMBER_ALIAS)) {
    return false;
  }
  const patternParts = patternName.split('.');
  const nameParts = name.split('.');
  return (
    patternParts.length === nameParts.length &&
    patternParts.every((part, index) => part === AST_DYNAMIC_MEMBER_ALIAS || part === nameParts[index])
  );
}

function getReactNamespaceCapabilityFromAstPatternSource(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  if (sourceTarget?.ambiguous) {
    return '';
  }
  if (sourceTarget?.node) {
    const capability = getReactNamespaceCapabilityFromAst(
      sourceTarget.node,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (capability) {
      return capability;
    }
  }
  const fallbackCapability = getReactNamespaceCapabilityFromAstPatternFallbackSources(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
  );
  if (fallbackCapability) {
    return fallbackCapability;
  }
  if (!sourceTarget?.aliasName) {
    return '';
  }
  const directCapability = getDirectReactNamespaceCapabilityFromAstAliasName(sourceTarget, identifierBindings);
  if (directCapability) {
    return directCapability;
  }
  const alias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  return alias?.capability || '';
}

function getReactDefaultNamespaceCapabilityFromAstPatternSource(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[] = [],
  defaultAliases: ReactDefaultAlias[] = [],
) {
  if (sourceTarget?.node) {
    const capability = getReactDefaultNamespaceCapabilityFromAst(
      sourceTarget.node,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
    if (capability) {
      return capability;
    }
  }
  const fallbackCapability = getReactDefaultCapabilityFromAstPatternFallbackSources(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
    defaultAliases,
  );
  if (fallbackCapability) {
    return fallbackCapability;
  }
  if (!sourceTarget?.aliasName) {
    return '';
  }
  const directCapability = getDirectReactDefaultCapabilityFromAstAliasName(sourceTarget, identifierBindings);
  if (directCapability) {
    return directCapability;
  }
  const exactAlias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    defaultAliases,
    identifierBindings,
  );
  if (exactAlias) {
    return exactAlias.capability;
  }
  const dynamicAlias = resolveAstDynamicAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    defaultAliases,
    identifierBindings,
  );
  const exactNamespaceAlias = resolveAstNamedAliasBinding(
    sourceTarget.aliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  if (dynamicAlias && (!exactNamespaceAlias || compareAstAliasPrecedence(dynamicAlias, exactNamespaceAlias) >= 0)) {
    return dynamicAlias.capability;
  }
  const exactNamespaceCapability = getReactNamespaceCapabilityFromAstPatternSource(
    sourceTarget,
    identifierBindings,
    aliases,
    ctxRootAliases,
  );
  if (exactNamespaceCapability) {
    return '';
  }
  if (dynamicAlias) {
    return dynamicAlias.capability;
  }
  const namespaceAliasName = getAstDefaultMemberAliasBase(sourceTarget.aliasName);
  if (!namespaceAliasName) {
    return '';
  }
  const directNamespaceCapability = getDirectReactNamespaceCapabilityFromAstAliasName(
    {
      ...sourceTarget,
      aliasName: namespaceAliasName,
    },
    identifierBindings,
  );
  if (directNamespaceCapability) {
    return `${directNamespaceCapability}.default`;
  }
  const namespaceAlias = resolveAstNamedAliasBinding(
    namespaceAliasName,
    sourceTarget.index || 0,
    sourceTarget.rootName,
    aliases,
    identifierBindings,
  );
  return namespaceAlias ? `${namespaceAlias.capability}.default` : '';
}

function getReactNamespaceCapabilityFromAstPatternFallbackSources(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  for (const fallbackTarget of sourceTarget?.fallbackSourceTargets || []) {
    const capability = getReactNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (capability) {
      return capability;
    }
  }
  return '';
}

function getReactDefaultCapabilityFromAstPatternFallbackSources(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
  defaultAliases: ReactDefaultAlias[],
) {
  for (const fallbackTarget of sourceTarget?.fallbackSourceTargets || []) {
    const capability = getReactDefaultNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
      defaultAliases,
    );
    if (capability) {
      return capability;
    }
    const namespaceCapability = getReactNamespaceCapabilityFromAstPatternSource(
      fallbackTarget,
      identifierBindings,
      aliases,
      ctxRootAliases,
    );
    if (namespaceCapability) {
      return '';
    }
  }
  return '';
}

function getAstDefaultMemberAliasBase(aliasName: string) {
  const suffix = '.default';
  return aliasName.endsWith(suffix) ? aliasName.slice(0, -suffix.length) : '';
}

function getDirectReactNamespaceCapabilityFromAstAliasName(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
) {
  const aliasName = String(sourceTarget?.aliasName || '');
  const index = sourceTarget?.index || 0;
  if (aliasName === 'React' && !hasAstActiveBinding('React', index, identifierBindings)) {
    return 'React';
  }
  if (
    aliasName === 'ctx.React' &&
    sourceTarget.rootName === 'ctx' &&
    !hasAstActiveBinding('ctx', index, identifierBindings)
  ) {
    return 'ctx.React';
  }
  if (
    aliasName === 'ctx.libs.React' &&
    sourceTarget.rootName === 'ctx' &&
    !hasAstActiveBinding('ctx', index, identifierBindings)
  ) {
    return 'ctx.libs.React';
  }
  return '';
}

function getDirectReactDefaultCapabilityFromAstAliasName(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
) {
  const namespaceAliasName = getAstDefaultMemberAliasBase(String(sourceTarget?.aliasName || ''));
  if (!namespaceAliasName) {
    return '';
  }
  const namespaceCapability = getDirectReactNamespaceCapabilityFromAstAliasName(
    {
      ...sourceTarget,
      aliasName: namespaceAliasName,
    },
    identifierBindings,
  );
  return namespaceCapability ? `${namespaceCapability}.default` : '';
}

function resolveAstActiveIdentifierBinding(
  name: string,
  index: number,
  identifierBindings: AstIdentifierBinding[],
): AstIdentifierBinding | undefined {
  return identifierBindings
    .filter((binding) => binding.name === name && index >= binding.start && index < binding.end)
    .sort(
      (left, right) =>
        left.end - left.start - (right.end - right.start) || right.start - left.start || right.end - left.end,
    )[0];
}

function hasAstShadowBinding(
  name: string,
  index: number,
  alias: SourceRange,
  identifierBindings: AstIdentifierBinding[],
) {
  return identifierBindings.some(
    (binding) => binding.name === name && binding.start > alias.start && index >= binding.start && index < binding.end,
  );
}

function addAstFunctionParamBindings(bindings: AstIdentifierBinding[], node: any, sourceLength: number) {
  const scope = {
    start: typeof node.start === 'number' ? node.start : 0,
    end: typeof node.end === 'number' ? node.end : sourceLength,
  };
  for (const param of node.params || []) {
    collectAstPatternBindingIdentifiers(param, (name, bindingNode) => {
      bindings.push({
        name,
        start: typeof bindingNode?.start === 'number' ? bindingNode.start : scope.start,
        end: scope.end,
      });
    });
  }
}

function collectAstPatternBindingIdentifiers(node: any, addBinding: (name: string, node: any) => void) {
  if (!node) {
    return;
  }
  if (node.type === 'Identifier') {
    addBinding(node.name, node);
    return;
  }
  if (node.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(node.left, addBinding);
    return;
  }
  if (node.type === 'RestElement') {
    collectAstPatternBindingIdentifiers(node.argument, addBinding);
    return;
  }
  if (node.type === 'ArrayPattern') {
    for (const element of node.elements || []) {
      collectAstPatternBindingIdentifiers(element, addBinding);
    }
    return;
  }
  if (node.type === 'ObjectPattern') {
    for (const property of node.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternBindingIdentifiers(property.argument, addBinding);
        continue;
      }
      if (property.type === 'Property') {
        collectAstPatternBindingIdentifiers(property.value, addBinding);
      }
    }
  }
}

function collectAstObjectPatternAliases(pattern: any, addAlias: (alias: string, member: string, node?: any) => void) {
  for (const property of pattern.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    const alias = getAstBindingIdentifierName(property.value);
    const aliasNode = getAstBindingIdentifierNode(property.value);
    if (member && alias) {
      addAlias(alias, member, aliasNode);
    }
  }
}

function collectAstObjectPatternPathAliases(
  pattern: any,
  addAlias: (alias: string, members: string[], node?: any) => void,
  parentMembers: string[] = [],
) {
  for (const property of pattern.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (!member) {
      continue;
    }
    const members = [...parentMembers, member];
    const alias = getAstBindingIdentifierName(property.value);
    const aliasNode = getAstBindingIdentifierNode(property.value);
    if (alias) {
      addAlias(alias, members, aliasNode);
    }
    const nestedPattern = getAstObjectPatternFromValue(property.value);
    if (nestedPattern) {
      collectAstObjectPatternPathAliases(nestedPattern, addAlias, members);
    }
  }
}

function collectAstPatternDefaultValueAliases(
  pattern: any,
  addAlias: (alias: string, valueNode: any, aliasNode: any, defaultPattern: any) => void,
) {
  if (!pattern) {
    return;
  }
  if (pattern.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(pattern.left, (alias, aliasNode) => {
      addAlias(alias, pattern.right, aliasNode, pattern.left);
    });
    collectAstPatternDefaultValueAliases(pattern.left, addAlias);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternDefaultValueAliases(property.argument, addAlias);
        continue;
      }
      if (property.type === 'Property') {
        collectAstPatternDefaultValueAliases(property.value, addAlias);
      }
    }
    return;
  }
  if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements || []) {
      collectAstPatternDefaultValueAliases(element, addAlias);
    }
    return;
  }
  if (pattern.type === 'RestElement') {
    collectAstPatternDefaultValueAliases(pattern.argument, addAlias);
  }
}

function collectAstPatternDefaultValueAliasesWithSource(
  pattern: any,
  sourceTarget: any,
  addAlias: (alias: string, valueNode: any, aliasNode: any, defaultPattern: any, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternBindingIdentifiers(unwrapped.left, (alias, aliasNode) => {
      addAlias(alias, unwrapped.right, aliasNode, unwrapped.left, sourceTarget);
    });
    collectAstPatternDefaultValueAliasesWithSource(unwrapped.left, sourceTarget, addAlias);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstPatternDefaultValueAliasesWithSource(property.argument, undefined, addAlias);
        continue;
      }
      if (property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      collectAstPatternDefaultValueAliasesWithSource(
        property.value,
        member ? getAstPatternMemberSourceTarget(sourceTarget, member) : undefined,
        addAlias,
      );
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      collectAstPatternDefaultValueAliasesWithSource(
        unwrapped.elements[index],
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        addAlias,
      );
    }
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternDefaultValueAliasesWithSource(unwrapped.argument, undefined, addAlias);
  }
}

function collectAstPatternSourceTargets(
  pattern: any,
  sourceNode: any,
  visit: (target: any, sourceTarget: any) => void,
) {
  collectAstPatternSourceTargetsRec(pattern, createAstPatternSourceTarget(sourceNode), visit);
}

function collectAstPatternCarrierSourceTargets<T extends AstCapabilityAlias>(
  pattern: any,
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternCarrierSourceTargetsFromSourceTarget(
    pattern,
    createAstPatternSourceTarget(sourceNode),
    aliases,
    identifierBindings,
    visit,
  );
}

function collectAstPatternCarrierSourceTargetsFromSourceTarget<T extends AstCapabilityAlias>(
  pattern: any,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternSourceTargetsRec(pattern, sourceTarget, (target, patternSourceTarget) => {
    const targetLookup = getAstPatternTargetAliasLookup(target);
    if (!targetLookup) {
      return;
    }
    collectAstCarrierSourceTargets(
      target,
      targetLookup.aliasName,
      patternSourceTarget,
      aliases,
      identifierBindings,
      visit,
    );
  });
}

function collectAstPatternSourceTargetsRec(
  pattern: any,
  sourceTarget: any,
  visit: (target: any, sourceTarget: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'Identifier' || unwrapped.type === 'MemberExpression') {
    visit(unwrapped, sourceTarget);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternSourceTargetsRec(unwrapped.left, sourceTarget, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternSourceTargetsRec(unwrapped.argument, sourceTarget, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      if (!member) {
        continue;
      }
      collectAstPatternSourceTargetsRec(property.value, getAstPatternMemberSourceTarget(sourceTarget, member), visit);
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      if (unwrapped.elements[index]?.type === 'RestElement') {
        continue;
      }
      collectAstPatternSourceTargetsRec(
        unwrapped.elements[index],
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        visit,
      );
    }
  }
}

function collectAstPatternRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  pattern: any,
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstPatternRestCarrierSourceTargetsRec(
    pattern,
    createAstPatternSourceTarget(sourceNode),
    aliases,
    identifierBindings,
    visit,
  );
}

function collectAstPatternRestCarrierSourceTargetsRec<T extends AstCapabilityAlias>(
  pattern: any,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternRestCarrierSourceTargetsRec(unwrapped.left, sourceTarget, aliases, identifierBindings, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    const excludedMembers = collectAstObjectPatternStaticMembers(unwrapped);
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      if (property.type === 'RestElement') {
        collectAstObjectRestCarrierSourceTargets(
          property.argument,
          sourceTarget,
          excludedMembers,
          aliases,
          identifierBindings,
          visit,
        );
        continue;
      }
      if (property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticPropertyName(property);
      if (!member) {
        continue;
      }
      collectAstPatternRestCarrierSourceTargetsRec(
        property.value,
        getAstPatternMemberSourceTarget(sourceTarget, member),
        aliases,
        identifierBindings,
        visit,
      );
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element) {
        continue;
      }
      if (element.type === 'RestElement') {
        collectAstArrayRestCarrierSourceTargets(
          element.argument,
          sourceTarget,
          index,
          aliases,
          identifierBindings,
          visit,
        );
        continue;
      }
      collectAstPatternRestCarrierSourceTargetsRec(
        element,
        getAstPatternMemberSourceTarget(sourceTarget, String(index)),
        aliases,
        identifierBindings,
        visit,
      );
    }
  }
}

function collectAstObjectRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  sourceTarget: any,
  excludedMembers: Set<string>,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const targetLookup = getAstPatternTargetAliasLookup(target);
  if (!targetLookup) {
    return;
  }
  collectAstCarrierCandidateMembers(sourceTarget?.node, aliases, identifierBindings).forEach((member) => {
    if (excludedMembers.has(member)) {
      return;
    }
    const memberSourceTarget = getAstStaticCarrierMemberSourceTarget(sourceTarget?.node, member);
    if (!memberSourceTarget) {
      return;
    }
    visit({
      sourceTarget: memberSourceTarget,
      target,
      targetAliasName: `${targetLookup.aliasName}.${member}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || excludedMembers.has(firstMember)) {
        return;
      }
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetLookup.aliasName}.${suffix}`,
      });
    },
  );
  collectAstObjectSpreadCarrierCopies(
    sourceTarget?.node,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || excludedMembers.has(firstMember)) {
        return;
      }
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetLookup.aliasName}.${suffix}`,
      });
    },
    excludedMembers,
  );
}

function collectAstCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  targetAliasName: string,
  sourceTarget: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  collectAstKnownCarrierMembers(sourceTarget?.node, (member, valueNode) => {
    visit({
      sourceTarget: createAstPatternSourceTarget(valueNode),
      target,
      targetAliasName: `${targetAliasName}.${member}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetAliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetAliasName}.${suffix}`,
      });
    },
  );
  collectAstLiteralSpreadCarrierCopies(
    sourceTarget?.node,
    targetAliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetAliasName}.${suffix}`,
      });
    },
  );
  collectAstDynamicCarrierSourceTargets(sourceTarget?.node, (suffix, dynamicSourceTarget) => {
    visit({
      sourceTarget: dynamicSourceTarget,
      target,
      targetAliasName: `${targetAliasName}.${suffix}`,
    });
  });
}

function collectAstArrayRestCarrierSourceTargets<T extends AstCapabilityAlias>(
  target: any,
  sourceTarget: any,
  restStartIndex: number,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (target: { sourceAlias?: T; sourceTarget?: any; target: any; targetAliasName: string }) => void,
) {
  const targetLookup = getAstPatternTargetAliasLookup(target);
  if (!targetLookup) {
    return;
  }
  const mapRestSuffix = (suffix: string) => {
    const [sourceIndexText, ...restSuffixParts] = suffix.split('.');
    const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
    if (sourceIndexText === AST_DYNAMIC_MEMBER_ALIAS) {
      return `${AST_DYNAMIC_MEMBER_ALIAS}${restSuffix}`;
    }
    const sourceIndex = Number(sourceIndexText);
    if (!Number.isInteger(sourceIndex) || sourceIndex < restStartIndex) {
      return '';
    }
    return `${sourceIndex - restStartIndex}${restSuffix}`;
  };
  collectAstKnownCarrierMembers(sourceTarget?.node, (member, valueNode) => {
    const sourceIndex = Number(member);
    if (!Number.isInteger(sourceIndex) || sourceIndex < restStartIndex) {
      return;
    }
    visit({
      sourceTarget: createAstPatternSourceTarget(valueNode),
      target,
      targetAliasName: `${targetLookup.aliasName}.${sourceIndex - restStartIndex}`,
    });
  });
  collectAstRestCarrierAliasCopies(
    sourceTarget,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias) => {
      const mappedSuffix = mapRestSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit({
        sourceAlias,
        target,
        targetAliasName: `${targetLookup.aliasName}.${mappedSuffix}`,
      });
    },
  );
  collectAstArraySpreadCarrierCopies(
    sourceTarget?.node,
    targetLookup.aliasName,
    aliases,
    identifierBindings,
    (suffix, sourceAlias, spreadSourceTarget) => {
      const mappedSuffix = mapRestSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit({
        sourceAlias,
        sourceTarget: spreadSourceTarget,
        target,
        targetAliasName: `${targetLookup.aliasName}.${mappedSuffix}`,
      });
    },
  );
}

function collectAstRestCarrierAliasCopies<T extends AstCapabilityAlias>(
  sourceTarget: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias: T) => void,
) {
  const sourceAliasName = sourceTarget?.aliasName;
  if (!sourceAliasName) {
    return;
  }
  const sourcePrefix = `${sourceAliasName}.`;
  const sourceIndex = sourceTarget.index || 0;
  const rootName = sourceTarget.rootName || getAstAliasRootName(sourceAliasName);
  const copied = new Set<string>();
  const sourceAliases = aliases
    .filter((entry) => entry.name.startsWith(sourcePrefix) && sourceIndex >= entry.start && sourceIndex < entry.end)
    .sort((left, right) => right.start - left.start);
  for (const sourceAlias of sourceAliases) {
    const suffix = sourceAlias.name.slice(sourcePrefix.length);
    if (!suffix || copied.has(`${targetAliasName}.${suffix}`)) {
      continue;
    }
    if (hasAstShadowBinding(rootName, sourceIndex, sourceAlias, identifierBindings)) {
      continue;
    }
    copied.add(`${targetAliasName}.${suffix}`);
    visit(suffix, sourceAlias);
  }
}

function collectAstLiteralSpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
) {
  collectAstObjectSpreadCarrierCopies(sourceNode, targetAliasName, aliases, identifierBindings, visit);
  collectAstArraySpreadCarrierCopies(sourceNode, targetAliasName, aliases, identifierBindings, visit);
}

function collectAstCarrierCandidateMembers<T extends AstCapabilityAlias>(
  sourceNode: any,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
) {
  const members = new Set<string>();
  collectAstStaticCarrierMembers(sourceNode, (member) => members.add(member));
  collectAstKnownCarrierMembers(sourceNode, (member) => members.add(member));
  collectAstLiteralSpreadCarrierCopies(sourceNode, '__candidate__', aliases, identifierBindings, (suffix) => {
    const firstMember = suffix.split('.')[0];
    if (firstMember) {
      members.add(firstMember);
    }
  });
  collectAstDynamicCarrierSourceTargets(sourceNode, (suffix) => {
    const firstMember = suffix.split('.')[0];
    if (firstMember) {
      members.add(firstMember);
    }
  });
  return members;
}

function collectAstObjectSpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
  excludedMembers = new Set<string>(),
) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ObjectExpression') {
    return;
  }
  const seenMembers = new Set<string>(excludedMembers);
  for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
    const property = unwrapped.properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'Property') {
      const member = getAstStaticMemberKey(property);
      if (member) {
        seenMembers.add(member);
      }
      continue;
    }
    if (property.type !== 'SpreadElement') {
      continue;
    }
    const sourceTarget = createAstPatternSourceTarget(property.argument);
    const visitSpreadMember = (suffix: string, sourceAlias?: T, spreadSourceTarget?: any) => {
      const firstMember = suffix.split('.')[0];
      if (!firstMember || seenMembers.has(firstMember)) {
        return;
      }
      seenMembers.add(firstMember);
      visit(suffix, sourceAlias, spreadSourceTarget);
    };
    collectAstRestCarrierAliasCopies(
      sourceTarget,
      targetAliasName,
      aliases,
      identifierBindings,
      (suffix, sourceAlias) => visitSpreadMember(suffix, sourceAlias, sourceTarget),
    );
    collectAstStaticCarrierMemberSourceTargets(property.argument, (suffix, spreadSourceTarget) =>
      visitSpreadMember(suffix, undefined, spreadSourceTarget),
    );
    collectAstDynamicCarrierSourceTargets(property.argument, (suffix, dynamicSourceTarget) => {
      visitSpreadMember(suffix, undefined, dynamicSourceTarget);
    });
  }
}

function collectAstDynamicCarrierSourceTargets(sourceNode: any, visit: (suffix: string, sourceTarget: any) => void) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ObjectExpression') {
    return;
  }
  for (const property of unwrapped.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticMemberKey(property);
    if (member) {
      continue;
    }
    visit(
      AST_DYNAMIC_MEMBER_ALIAS,
      createAstAmbiguousSourceTarget(createAstPatternSourceTarget(property.value || property)),
    );
  }
}

function collectAstArraySpreadCarrierCopies<T extends AstCapabilityAlias>(
  sourceNode: any,
  targetAliasName: string,
  aliases: T[],
  identifierBindings: AstIdentifierBinding[],
  visit: (suffix: string, sourceAlias?: T, sourceTarget?: any) => void,
) {
  const unwrapped = unwrapAstChainExpression(sourceNode);
  if (unwrapped?.type !== 'ArrayExpression') {
    return;
  }
  let concreteIndexOffset = 0;
  let hasUnboundedSpread = false;
  for (const element of unwrapped.elements || []) {
    if (!element) {
      if (!hasUnboundedSpread) {
        concreteIndexOffset += 1;
      }
      continue;
    }
    if (element.type !== 'SpreadElement') {
      if (!hasUnboundedSpread) {
        concreteIndexOffset += 1;
        continue;
      }
      visit(AST_DYNAMIC_MEMBER_ALIAS, undefined, createAstPatternSourceTarget(element));
      continue;
    }
    if (hasUnboundedSpread) {
      const sourceTarget = createAstPatternSourceTarget(element.argument);
      const mapUnboundedSpreadSuffix = (suffix: string) => {
        const [, ...restSuffixParts] = suffix.split('.');
        const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
        return `${AST_DYNAMIC_MEMBER_ALIAS}${restSuffix}`;
      };
      collectAstRestCarrierAliasCopies(
        sourceTarget,
        targetAliasName,
        aliases,
        identifierBindings,
        (suffix, sourceAlias) => {
          visit(mapUnboundedSpreadSuffix(suffix), sourceAlias, sourceTarget);
        },
      );
      collectAstStaticCarrierMemberSourceTargets(element.argument, (suffix, spreadSourceTarget) => {
        visit(mapUnboundedSpreadSuffix(suffix), undefined, spreadSourceTarget);
      });
      continue;
    }
    const sourceTarget = createAstPatternSourceTarget(element.argument);
    const mapSpreadSuffix = (suffix: string) => {
      const [sourceIndexText, ...restSuffixParts] = suffix.split('.');
      const sourceIndex = Number(sourceIndexText);
      if (!Number.isInteger(sourceIndex) || sourceIndex < 0) {
        return '';
      }
      const restSuffix = restSuffixParts.length ? `.${restSuffixParts.join('.')}` : '';
      const targetIndex = hasUnboundedSpread ? sourceIndex : sourceIndex + concreteIndexOffset;
      return `${targetIndex}${restSuffix}`;
    };
    collectAstRestCarrierAliasCopies(
      sourceTarget,
      targetAliasName,
      aliases,
      identifierBindings,
      (suffix, sourceAlias) => {
        const mappedSuffix = mapSpreadSuffix(suffix);
        if (!mappedSuffix) {
          return;
        }
        visit(mappedSuffix, sourceAlias, sourceTarget);
      },
    );
    collectAstStaticCarrierMemberSourceTargets(element.argument, (suffix, spreadSourceTarget) => {
      const mappedSuffix = mapSpreadSuffix(suffix);
      if (!mappedSuffix) {
        return;
      }
      visit(mappedSuffix, undefined, spreadSourceTarget);
    });
    const spreadLength = getAstStaticArrayElementCount(element.argument);
    if (!hasUnboundedSpread && typeof spreadLength === 'number') {
      concreteIndexOffset += spreadLength;
      continue;
    }
    hasUnboundedSpread = true;
  }
}

function collectAstStaticCarrierMemberSourceTargets(node: any, visit: (member: string, sourceTarget: any) => void) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    const seenMembers = new Set<string>();
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type === 'SpreadElement') {
        collectAstStaticCarrierMemberSourceTargets(property.argument, (member, sourceTarget) => {
          if (seenMembers.has(member)) {
            return;
          }
          seenMembers.add(member);
          visit(member, sourceTarget);
        });
        continue;
      }
      if (property.type !== 'Property') {
        break;
      }
      const member = getAstStaticMemberKey(property);
      if (!member) {
        break;
      }
      if (seenMembers.has(member)) {
        continue;
      }
      seenMembers.add(member);
      visit(member, createAstPatternSourceTarget(property.value));
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    let targetIndex = 0;
    for (const element of unwrapped.elements || []) {
      if (!element) {
        targetIndex += 1;
        continue;
      }
      if (element.type !== 'SpreadElement') {
        visit(String(targetIndex), createAstPatternSourceTarget(element));
        targetIndex += 1;
        continue;
      }
      const spreadLength = getAstStaticArrayElementCount(element.argument);
      if (typeof spreadLength !== 'number') {
        return;
      }
      collectAstStaticCarrierMemberSourceTargets(element.argument, (member, sourceTarget) => {
        const sourceIndex = Number(member);
        if (!Number.isInteger(sourceIndex) || sourceIndex < 0) {
          return;
        }
        visit(String(targetIndex + sourceIndex), sourceTarget);
      });
      targetIndex += spreadLength;
    }
  }
}

function getAstStaticArrayElementCount(node: any): number | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type !== 'ArrayExpression') {
    return undefined;
  }
  let count = 0;
  for (const element of unwrapped.elements || []) {
    if (!element) {
      count += 1;
      continue;
    }
    if (element.type !== 'SpreadElement') {
      count += 1;
      continue;
    }
    const spreadLength = getAstStaticArrayElementCount(element.argument);
    if (typeof spreadLength !== 'number') {
      return undefined;
    }
    count += spreadLength;
  }
  return count;
}

function collectAstObjectPatternStaticMembers(pattern: any) {
  const members = new Set<string>();
  for (const property of pattern?.properties || []) {
    if (!property || property.type !== 'Property') {
      continue;
    }
    const member = getAstStaticPropertyName(property);
    if (member) {
      members.add(member);
    }
  }
  return members;
}

function getAstPatternTargetAliasLookup(
  target: any,
): { aliasName: string; index: number; rootName: string } | undefined {
  const unwrapped = unwrapAstChainExpression(target);
  if (unwrapped?.type === 'Identifier') {
    return {
      aliasName: unwrapped.name,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      rootName: unwrapped.name,
    };
  }
  return getAstMemberAliasLookup(unwrapped);
}

function collectAstPatternMemberExpressions(pattern: any, visit: (memberNode: any) => void) {
  const unwrapped = unwrapAstChainExpression(pattern);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'MemberExpression') {
    visit(unwrapped);
    return;
  }
  if (unwrapped.type === 'AssignmentPattern') {
    collectAstPatternMemberExpressions(unwrapped.left, visit);
    return;
  }
  if (unwrapped.type === 'RestElement') {
    collectAstPatternMemberExpressions(unwrapped.argument, visit);
    return;
  }
  if (unwrapped.type === 'ObjectPattern') {
    for (const property of unwrapped.properties || []) {
      if (!property) {
        continue;
      }
      collectAstPatternMemberExpressions(property.type === 'Property' ? property.value : property.argument, visit);
    }
    return;
  }
  if (unwrapped.type === 'ArrayPattern') {
    for (const element of unwrapped.elements || []) {
      collectAstPatternMemberExpressions(element, visit);
    }
  }
}

function createAstPatternSourceTarget(node: any) {
  const sourceRoot = getAstPatternSourceRoot(node);
  return {
    node,
    aliasName: sourceRoot?.aliasName,
    rootName: sourceRoot?.rootName,
    index: sourceRoot?.index ?? (typeof node?.start === 'number' ? node.start : 0),
  };
}

function createMaybeAstPatternSourceTarget(node: any) {
  return node ? createAstPatternSourceTarget(node) : undefined;
}

function isAstPatternDefaultValueSuppressedByReactNamespace(
  sourceTarget: any,
  identifierBindings: AstIdentifierBinding[],
  namespaceAliases: ReactNamespaceAlias[],
  ctxRootAliases: CtxRootAlias[],
) {
  if (!sourceTarget) {
    return false;
  }
  return Boolean(
    getReactNamespaceCapabilityFromAstPatternSource(sourceTarget, identifierBindings, namespaceAliases, ctxRootAliases),
  );
}

function getAstPatternMemberSourceTarget(sourceTarget: any, member: string) {
  const memberSourceTarget = getAstStaticCarrierMemberSourceTarget(sourceTarget?.node, member);
  if (memberSourceTarget) {
    return memberSourceTarget;
  }
  const sourceRoot = sourceTarget?.aliasName ? sourceTarget : getAstPatternSourceRoot(sourceTarget?.node);
  if (sourceRoot?.aliasName) {
    return {
      aliasName: `${sourceRoot.aliasName}.${member}`,
      rootName: sourceRoot.rootName,
      index: sourceRoot.index ?? sourceTarget?.index ?? 0,
    };
  }
  return { index: sourceTarget?.index ?? 0 };
}

function getAstStaticCarrierMemberSourceTarget(node: any, member: string): any {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ObjectExpression') {
    return getAstObjectCarrierMemberSourceTarget(unwrapped, member);
  }
  if (unwrapped.type === 'ArrayExpression') {
    return getAstArrayCarrierMemberSourceTarget(unwrapped, member);
  }
  return undefined;
}

function getAstObjectCarrierMemberSourceTarget(node: any, member: string): any {
  const fallbackSourceTargets: any[] = [];
  for (let index = (node.properties || []).length - 1; index >= 0; index -= 1) {
    const property = node.properties[index];
    if (!property) {
      continue;
    }
    if (property.type === 'SpreadElement') {
      const spreadTarget = getAstSpreadMemberSourceTarget(property.argument, member);
      if (spreadTarget) {
        fallbackSourceTargets.push(spreadTarget);
      }
      continue;
    }
    if (property.type !== 'Property') {
      return createAstFallbackSourceTarget(fallbackSourceTargets, property.start || node.start || 0);
    }
    const propertyKey = getAstStaticMemberKey(property);
    if (!propertyKey) {
      fallbackSourceTargets.push(createAstAmbiguousSourceTarget(createAstPatternSourceTarget(property.value)));
      continue;
    }
    if (propertyKey !== member) {
      continue;
    }
    const propertyTarget = createAstPatternSourceTarget(property.value);
    if (!fallbackSourceTargets.length) {
      return propertyTarget;
    }
    return createAstFallbackSourceTarget(
      [...fallbackSourceTargets, propertyTarget],
      typeof property.value?.start === 'number' ? property.value.start : property.start || node.start || 0,
    );
  }
  return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
}

function getAstArrayCarrierMemberSourceTarget(node: any, member: string): any {
  const targetIndex = Number(member);
  if (!Number.isInteger(targetIndex) || targetIndex < 0) {
    return undefined;
  }
  const fallbackSourceTargets: any[] = [];
  let concreteIndex = 0;
  let hasSpreadBefore = false;
  for (const element of node.elements || []) {
    if (!element) {
      if (!hasSpreadBefore && concreteIndex === targetIndex && !fallbackSourceTargets.length) {
        return undefined;
      }
      concreteIndex += 1;
      continue;
    }
    if (element.type === 'SpreadElement') {
      const spreadLength = getAstStaticArrayElementCount(element.argument);
      if (!hasSpreadBefore && typeof spreadLength === 'number') {
        const spreadIndex = targetIndex - concreteIndex;
        if (spreadIndex < 0) {
          return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
        }
        if (spreadIndex < spreadLength) {
          return getAstSpreadMemberSourceTarget(element.argument, String(spreadIndex));
        }
        concreteIndex += spreadLength;
        continue;
      }
      const spreadMember = hasSpreadBefore ? String(targetIndex) : String(targetIndex - concreteIndex);
      if (targetIndex >= concreteIndex || hasSpreadBefore) {
        const spreadTarget = getAstSpreadMemberSourceTarget(element.argument, spreadMember);
        if (spreadTarget) {
          fallbackSourceTargets.push(hasSpreadBefore ? createAstAmbiguousSourceTarget(spreadTarget) : spreadTarget);
        }
      }
      hasSpreadBefore = true;
      continue;
    }
    if (!hasSpreadBefore && concreteIndex === targetIndex) {
      const elementTarget = createAstPatternSourceTarget(element);
      if (!fallbackSourceTargets.length) {
        return elementTarget;
      }
      return createAstFallbackSourceTarget(
        [...fallbackSourceTargets, elementTarget],
        typeof element.start === 'number' ? element.start : node.start || 0,
      );
    }
    if (hasSpreadBefore) {
      fallbackSourceTargets.push(createAstAmbiguousSourceTarget(createAstPatternSourceTarget(element)));
    }
    concreteIndex += 1;
  }
  return createAstFallbackSourceTarget(fallbackSourceTargets, node.start || 0);
}

function createAstAmbiguousSourceTarget(sourceTarget: any) {
  return sourceTarget ? { ...sourceTarget, ambiguous: true } : undefined;
}

function getAstSpreadMemberSourceTarget(spreadArgument: any, member: string): any {
  const sourceRoot = getAstPatternSourceRoot(spreadArgument);
  if (sourceRoot?.aliasName) {
    return {
      aliasName: `${sourceRoot.aliasName}.${member}`,
      rootName: sourceRoot.rootName,
      index: sourceRoot.index ?? (typeof spreadArgument?.start === 'number' ? spreadArgument.start : 0),
    };
  }
  return getAstStaticCarrierMemberSourceTarget(spreadArgument, member);
}

function createAstFallbackSourceTarget(fallbackSourceTargets: any[], index: number) {
  const targets = fallbackSourceTargets.filter(Boolean);
  return targets.length
    ? {
        fallbackSourceTargets: targets,
        index,
      }
    : undefined;
}

function getAstPatternSourceRoot(node: any): { aliasName: string; index: number; rootName: string } | undefined {
  const unwrapped = unwrapAstChainExpression(node);
  if (unwrapped?.type === 'Identifier') {
    return {
      aliasName: unwrapped.name,
      index: typeof unwrapped.start === 'number' ? unwrapped.start : 0,
      rootName: unwrapped.name,
    };
  }
  return getAstMemberAliasLookup(unwrapped);
}

function getAstStaticCarrierMemberValue(node: any, member: string) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return undefined;
  }
  if (unwrapped.type === 'ObjectExpression') {
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type !== 'Property') {
        return undefined;
      }
      const propertyKey = getAstStaticMemberKey(property);
      if (!propertyKey) {
        return undefined;
      }
      if (propertyKey === member) {
        return property.value;
      }
    }
  }
  if (unwrapped.type === 'ArrayExpression') {
    const index = Number(member);
    if (Number.isInteger(index) && index >= 0) {
      const element = unwrapped.elements?.[index];
      return element && element.type !== 'SpreadElement' ? element : undefined;
    }
  }
  return undefined;
}

function collectAstKnownCarrierMembers(node: any, visit: (member: string, valueNode: any, aliasNode?: any) => void) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    const seenMembers = new Set<string>();
    for (let index = (unwrapped.properties || []).length - 1; index >= 0; index -= 1) {
      const property = unwrapped.properties[index];
      if (!property) {
        continue;
      }
      if (property.type !== 'Property') {
        return;
      }
      const member = getAstStaticMemberKey(property);
      if (!member) {
        return;
      }
      if (seenMembers.has(member)) {
        continue;
      }
      seenMembers.add(member);
      visit(member, property.value, property.value || property);
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element || element.type === 'SpreadElement') {
        return;
      }
      visit(String(index), element, element);
    }
  }
}

function collectAstStaticCarrierMembers(node: any, visit: (member: string, valueNode: any, aliasNode?: any) => void) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return;
  }
  if (unwrapped.type === 'ObjectExpression') {
    for (const property of unwrapped.properties || []) {
      if (!property || property.type !== 'Property') {
        continue;
      }
      const member = getAstStaticMemberKey(property);
      if (member) {
        visit(member, property.value, property.value || property);
      }
    }
    return;
  }
  if (unwrapped.type === 'ArrayExpression') {
    for (let index = 0; index < (unwrapped.elements || []).length; index += 1) {
      const element = unwrapped.elements[index];
      if (!element || element.type === 'SpreadElement') {
        continue;
      }
      visit(String(index), element, element);
    }
  }
}

function getAstBindingIdentifierNode(node: any): any {
  if (node?.type === 'Identifier') {
    return node;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'Identifier') {
    return node.left;
  }
  return undefined;
}

function getAstBindingIdentifierName(node: any): string {
  if (node?.type === 'Identifier') {
    return node.name;
  }
  if (node?.type === 'AssignmentPattern' && node.left?.type === 'Identifier') {
    return node.left.name;
  }
  return '';
}

function getAstSource(node: any, source: string) {
  return source.slice(node?.start || 0, node?.end || node?.start || 0).trim();
}

function getAstStaticPropertyName(node: any): string {
  const property = node?.key || node?.property;
  if (!property) {
    return '';
  }
  if (!node.computed && property.type === 'Identifier') {
    return property.name;
  }
  const unwrapped = unwrapAstChainExpression(property);
  if (unwrapped?.type === 'Literal' && (typeof unwrapped.value === 'string' || typeof unwrapped.value === 'number')) {
    return String(unwrapped.value);
  }
  const value = resolveAstStaticStringValue(property, '');
  return typeof value === 'string' ? value : '';
}

function getAstStaticMemberKey(node: any): string {
  const property = node?.key || node?.property;
  if (!property) {
    return '';
  }
  if (!node.computed && property.type === 'Identifier') {
    return property.name;
  }
  const unwrapped = unwrapAstChainExpression(property);
  if (unwrapped?.type === 'Literal') {
    if (typeof unwrapped.value === 'string' || typeof unwrapped.value === 'number') {
      return String(unwrapped.value);
    }
    return '';
  }
  const value = resolveAstStaticStringValue(property, '');
  return typeof value === 'string' ? value : '';
}

function isCtxIdentifier(node: any) {
  const unwrapped = unwrapAstChainExpression(node);
  return unwrapped?.type === 'Identifier' && unwrapped.name === 'ctx';
}

function isUnshadowedCtxIdentifier(node: any, identifierBindings: AstIdentifierBinding[]) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!isCtxIdentifier(unwrapped)) {
    return false;
  }
  const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
  return !hasAstActiveBinding('ctx', index, identifierBindings);
}

function isCtxRootFromAst(node: any, aliases: CtxRootAlias[], identifierBindings: AstIdentifierBinding[]) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return false;
  }
  if (unwrapped.type === 'ConditionalExpression') {
    return (
      isCtxRootFromAst(unwrapped.consequent, aliases, identifierBindings) ||
      isCtxRootFromAst(unwrapped.alternate, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'LogicalExpression') {
    return (
      isCtxRootFromAst(unwrapped.left, aliases, identifierBindings) ||
      isCtxRootFromAst(unwrapped.right, aliases, identifierBindings)
    );
  }
  if (unwrapped.type === 'SequenceExpression') {
    const expressions = unwrapped.expressions || [];
    return isCtxRootFromAst(expressions[expressions.length - 1], aliases, identifierBindings);
  }
  if (unwrapped.type === 'AssignmentExpression' && isAstCtxApiAliasAssignmentOperator(unwrapped.operator)) {
    return isCtxRootFromAst(unwrapped.right, aliases, identifierBindings);
  }
  if (isUnshadowedCtxIdentifier(unwrapped, identifierBindings)) {
    return true;
  }
  if (unwrapped.type !== 'Identifier') {
    return false;
  }
  const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
  return !!resolveAstAliasBinding(unwrapped.name, index, aliases, identifierBindings);
}

function hasAstActiveBinding(name: string, index: number, identifierBindings: AstIdentifierBinding[]) {
  return identifierBindings.some((binding) => binding.name === name && index >= binding.start && index < binding.end);
}

function unwrapAstChainExpression(node: any): any {
  let current = node;
  while (current?.type === 'ChainExpression') {
    current = current.expression;
  }
  return current;
}

function findAstAncestor(ancestors: any[], type: string) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    if (ancestors[index]?.type === type) {
      return ancestors[index];
    }
  }
  return undefined;
}

function getAstExecutionScopeRange(ancestors: any[], sourceLength: number): SourceRange {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node) {
      continue;
    }
    if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
      return {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : sourceLength,
      };
    }
  }
  return { start: 0, end: sourceLength };
}

function isAstAlwaysExecutedInCurrentExecutionScope(ancestors: any[]) {
  const conditionalAncestorTypes = new Set([
    'ConditionalExpression',
    'DoWhileStatement',
    'ForStatement',
    'IfStatement',
    'LogicalExpression',
    'SwitchCase',
    'SwitchStatement',
    'WhileStatement',
    'WithStatement',
  ]);
  const currentNodeIndex = ancestors.length - 1;
  for (let index = currentNodeIndex - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node) {
      continue;
    }
    if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
      return true;
    }
    if (node.type === 'ForInStatement' && !isAstDefinitelyNonEmptyForInSource(node.right)) {
      return false;
    }
    if (node.type === 'ForOfStatement' && !isAstDefinitelyNonEmptyForOfSource(node.right)) {
      return false;
    }
    if (node.type === 'CatchClause') {
      return false;
    }
    if (node.type === 'TryStatement') {
      const child = ancestors[index + 1];
      if (child !== node.block && child !== node.finalizer) {
        return false;
      }
      continue;
    }
    if (conditionalAncestorTypes.has(node.type)) {
      return false;
    }
  }
  return true;
}

function isAstCtxApiAliasAssignmentOperator(operator: string) {
  return operator === '=' || operator === '||=' || operator === '&&=' || operator === '??=';
}

function isAstDefiniteAssignmentOperator(operator: string) {
  return operator === '=' || operator === '&&=';
}

function getAstAssignmentTargetScope(
  target: any,
  ancestors: any[],
  sourceLength: number,
  identifierBindings: AstIdentifierBinding[],
): SourceRange {
  const fallbackScope = getAstBindingScopeRange(ancestors, sourceLength);
  if (target?.type === 'Identifier') {
    const index = typeof target.start === 'number' ? target.start : 0;
    const binding = resolveAstActiveIdentifierBinding(target.name, index, identifierBindings);
    if (binding) {
      const executionScope = getAstExecutionScopeRange(ancestors, sourceLength);
      if (binding.start < executionScope.start && binding.end >= executionScope.end) {
        return fallbackScope;
      }
      return {
        start: binding.start,
        end: binding.end,
      };
    }
  }
  return fallbackScope;
}

function getAstMemberAssignmentTargetScope(
  target: any,
  ancestors: any[],
  sourceLength: number,
  identifierBindings: AstIdentifierBinding[],
): SourceRange {
  const fallbackScope = getAstBindingScopeRange(ancestors, sourceLength);
  const lookup = getAstMemberAliasLookup(target);
  if (!lookup) {
    return fallbackScope;
  }
  const binding = resolveAstActiveIdentifierBinding(lookup.rootName, lookup.index, identifierBindings);
  if (!binding) {
    return fallbackScope;
  }
  const executionScope = getAstExecutionScopeRange(ancestors, sourceLength);
  if (binding.start < executionScope.start && binding.end >= executionScope.end) {
    return fallbackScope;
  }
  return {
    start: binding.start,
    end: binding.end,
  };
}

function getAstBindingScopeRange(ancestors: any[], sourceLength: number, functionScoped = false): SourceRange {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const node = ancestors[index];
    if (!node || node.type === 'VariableDeclarator' || node.type === 'VariableDeclaration') {
      continue;
    }
    if (functionScoped) {
      if (node.type === 'Program' || node.type === 'StaticBlock' || isAstFunctionLike(node)) {
        return {
          start: typeof node.start === 'number' ? node.start : 0,
          end: typeof node.end === 'number' ? node.end : sourceLength,
        };
      }
      continue;
    }
    if (
      node.type === 'Program' ||
      node.type === 'BlockStatement' ||
      node.type === 'ForStatement' ||
      node.type === 'ForInStatement' ||
      node.type === 'ForOfStatement' ||
      node.type === 'SwitchStatement' ||
      node.type === 'StaticBlock' ||
      isAstFunctionLike(node)
    ) {
      return {
        start: typeof node.start === 'number' ? node.start : 0,
        end: typeof node.end === 'number' ? node.end : sourceLength,
      };
    }
  }
  return { start: 0, end: sourceLength };
}

function isSameAstRange(left: SourceRange, right: SourceRange) {
  return left.start === right.start && left.end === right.end;
}

function isAstFunctionLike(node: any) {
  return (
    !!node &&
    (node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression')
  );
}

function walkAstSimple(ast: any, visitors: Record<string, (...args: any[]) => void>) {
  (acornWalk as any).simple(ast, visitors, ACORN_WALK_BASE);
}

function walkAstAncestor(ast: any, visitors: Record<string, (...args: any[]) => void>) {
  (acornWalk as any).ancestor(ast, visitors, ACORN_WALK_BASE);
}

function dedupeAstResourceEntries(entries: RunJsAstInspection['invalidResourceTypeCalls']) {
  const seen = new Set<string>();
  return entries
    .filter((entry) => {
      const key = `${entry.ruleId}:${entry.capability}:${entry.index}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.index - right.index);
}

function maskJavaScriptSource(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteral(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      const start = index;
      index = skipRegexLiteral(source, index);
      maskRange(start, index);
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      const start = index;
      index += 1;
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

function maskJavaScriptComments(source: string) {
  const chars = source.split('');
  const maskRange = (start: number, end: number) => {
    for (let index = start; index < end; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const start = index;
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      maskRange(start, index);
      continue;
    }
    if (char === '/' && next === '*') {
      const start = index;
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      maskRange(start, index);
      continue;
    }
    if (char === '`') {
      index = maskTemplateLiteralComments(source, chars, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(chars, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    index += 1;
  }
  return chars.join('');
}

function maskTemplateLiteralComments(source: string, chars: string[], start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptComments(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

function maskTemplateLiteral(source: string, chars: string[], start: number) {
  const maskRange = (from: number, to: number) => {
    for (let index = from; index < to; index += 1) {
      if (chars[index] !== '\n' && chars[index] !== '\r') {
        chars[index] = ' ';
      }
    }
  };
  maskRange(start, start + 1);
  let index = start + 1;
  let chunkStart = index;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      maskRange(chunkStart, index + 1);
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      maskRange(chunkStart, index + 2);
      const expressionStart = index + 2;
      const expressionEnd = findTemplateExpressionEnd(source, expressionStart);
      const expressionMasked = maskJavaScriptSource(source.slice(expressionStart, expressionEnd));
      for (let offset = 0; offset < expressionMasked.length; offset += 1) {
        chars[expressionStart + offset] = expressionMasked[offset];
      }
      if (expressionEnd < source.length) {
        maskRange(expressionEnd, expressionEnd + 1);
      }
      index = Math.min(source.length, expressionEnd + 1);
      chunkStart = index;
      continue;
    }
    index += 1;
  }
  maskRange(chunkStart, source.length);
  return source.length;
}

function findTemplateExpressionEnd(source: string, start: number) {
  let depth = 1;
  let index = start;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(source.length, index + 2);
      continue;
    }
    if (char === '"' || char === "'") {
      index = skipQuotedLiteral(source, index, char);
      continue;
    }
    if (char === '`') {
      index = skipTemplateLiteral(source, index);
      continue;
    }
    if (char === '/' && isRegexLiteralStart(source, index)) {
      index = skipRegexLiteral(source, index);
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
    index += 1;
  }
  return source.length;
}

function skipRegexLiteral(source: string, start: number) {
  let index = start + 1;
  let inCharacterClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '[') {
      inCharacterClass = true;
      index += 1;
      continue;
    }
    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      index += 1;
      continue;
    }
    if ((char === '\n' || char === '\r') && !inCharacterClass) {
      return index;
    }
    if (char === '/' && !inCharacterClass) {
      index += 1;
      while (index < source.length && /[A-Za-z]/.test(source[index])) {
        index += 1;
      }
      return index;
    }
    index += 1;
  }
  return source.length;
}

function isRegexLiteralStart(sourceLike: string | string[], slashIndex: number) {
  const previous = getPreviousSignificantToken(sourceLike, slashIndex);
  if (!previous) {
    return true;
  }
  if (/^[([{=,:;!~?&|^+\-*%<>]$/.test(previous)) {
    return true;
  }
  return ['return', 'throw', 'case', 'delete', 'void', 'typeof', 'instanceof', 'yield', 'await', 'else'].includes(
    previous,
  );
}

function getPreviousSignificantToken(sourceLike: string | string[], beforeIndex: number) {
  return getPreviousSignificantTokenInfo(sourceLike, beforeIndex)?.token || '';
}

function getPreviousSignificantTokenInfo(sourceLike: string | string[], beforeIndex: number) {
  let index = beforeIndex - 1;
  while (index >= 0 && /\s/.test(sourceLike[index])) {
    index -= 1;
  }
  if (index < 0) {
    return undefined;
  }
  const char = sourceLike[index];
  if (/[A-Za-z_$]/.test(char)) {
    let start = index;
    while (start > 0 && /[\w$]/.test(sourceLike[start - 1])) {
      start -= 1;
    }
    return {
      token: Array.isArray(sourceLike)
        ? sourceLike.slice(start, index + 1).join('')
        : sourceLike.slice(start, index + 1),
      start,
      end: index + 1,
    };
  }
  return {
    token: char,
    start: index,
    end: index + 1,
  };
}

function skipQuotedLiteral(source: string, start: number, quote: string) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

function skipTemplateLiteral(source: string, start: number) {
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === '`') {
      return index + 1;
    }
    if (source[index] === '$' && source[index + 1] === '{') {
      const expressionEnd = findTemplateExpressionEnd(source, index + 2);
      index = Math.min(source.length, expressionEnd + 1);
      continue;
    }
    index += 1;
  }
  return source.length;
}

function findFunctionRanges(masked: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  collectFunctionRanges(masked, /\bfunction\b[^{]*\{/g, ranges);
  collectFunctionRanges(masked, /=>\s*\{/g, ranges);
  collectArrowExpressionRanges(masked, ranges);
  collectMethodFunctionRanges(masked, ranges);
  return mergeRanges(ranges);
}

function collectFunctionRanges(masked: string, pattern: RegExp, ranges: SourceRange[]) {
  for (const match of masked.matchAll(pattern)) {
    const openBrace = masked.indexOf('{', match.index || 0);
    if (openBrace < 0) {
      continue;
    }
    const closeBrace = findMatchingBrace(masked, openBrace);
    if (closeBrace > openBrace) {
      ranges.push({ start: openBrace, end: closeBrace + 1 });
    }
  }
}

function collectArrowExpressionRanges(masked: string, ranges: SourceRange[]) {
  for (const match of masked.matchAll(/=>/g)) {
    let start = (match.index || 0) + match[0].length;
    while (start < masked.length && /\s/.test(masked[start])) {
      start += 1;
    }
    if (masked[start] === '{') {
      continue;
    }
    const end = findArrowExpressionEnd(masked, start);
    if (end > start) {
      ranges.push({ start, end });
    }
  }
}

function collectMethodFunctionRanges(masked: string, ranges: SourceRange[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    ranges.push(candidate.bodyRange);
  });
}

function collectMethodCandidates(masked: string) {
  const candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }> = [];
  const pattern = /\b(?:(?:static|async|get|set)\s+)*(?:\*\s*)?([A-Za-z_$][\w$]*)\s*\(/g;
  for (const match of masked.matchAll(pattern)) {
    const matchIndex = match.index || 0;
    const methodName = match[1];
    if (NON_METHOD_CALL_KEYWORDS.has(methodName)) {
      continue;
    }
    const previous = getPreviousSignificantToken(masked, matchIndex);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const openParen = masked.indexOf('(', matchIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
  collectComputedMethodCandidates(masked, candidates);
  return candidates;
}

function collectComputedMethodCandidates(
  masked: string,
  candidates: Array<{ paramsStart: number; paramsEnd: number; bodyRange: SourceRange }>,
) {
  for (const match of masked.matchAll(/\[/g)) {
    const openBracket = match.index || 0;
    const previous = findMethodPrefixToken(masked, openBracket);
    if (!['{', ',', ';', '}'].includes(previous)) {
      continue;
    }
    const closeBracket = findMatchingDelimiter(masked, openBracket);
    if (closeBracket <= openBracket) {
      continue;
    }
    let openParen = closeBracket + 1;
    while (openParen < masked.length && /\s/.test(masked[openParen])) {
      openParen += 1;
    }
    if (masked[openParen] !== '(') {
      continue;
    }
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      candidates.push({
        paramsStart: openParen + 1,
        paramsEnd: closeParen,
        bodyRange,
      });
    }
  }
}

function findMethodPrefixToken(masked: string, beforeIndex: number) {
  let previous = getPreviousSignificantTokenInfo(masked, beforeIndex);
  while (previous && ['static', 'async', 'get', 'set', '*'].includes(previous.token)) {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  return previous?.token || '';
}

function findArrowExpressionEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';' || char === ',' || char === '\n' || char === '\r') {
        return index;
      }
      if (char === ')') {
        return index;
      }
    }
    if (char === '(') {
      parenDepth += 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
  }
  return masked.length;
}

function findMatchingBrace(masked: string, openBrace: number) {
  return findMatchingDelimiter(masked, openBrace);
}

function findMatchingDelimiter(masked: string, openIndex: number) {
  const closeByOpen: Record<string, string> = {
    '(': ')',
    '[': ']',
    '{': '}',
  };
  const stack = [closeByOpen[masked[openIndex]]];
  if (!stack[0]) {
    return -1;
  }
  for (let index = openIndex + 1; index < masked.length; index += 1) {
    const char = masked[index];
    if (closeByOpen[char]) {
      stack.push(closeByOpen[char]);
      continue;
    }
    if (char === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) {
        return index;
      }
    }
  }
  return -1;
}

function collectBraceRanges(masked: string) {
  const ranges: SourceRange[] = [];
  for (let index = 0; index < masked.length; index += 1) {
    if (masked[index] !== '{') {
      continue;
    }
    const closeBrace = findMatchingDelimiter(masked, index);
    if (closeBrace > index) {
      ranges.push({ start: index, end: closeBrace + 1 });
    }
  }
  return ranges;
}

function collectStaticBlockRanges(masked: string) {
  const ranges: SourceRange[] = [];
  for (const match of masked.matchAll(/\bstatic\s*\{/g)) {
    const openBrace = masked.indexOf('{', match.index || 0);
    const closeBrace = findMatchingDelimiter(masked, openBrace);
    if (closeBrace > openBrace) {
      ranges.push({ start: openBrace, end: closeBrace + 1 });
    }
  }
  return mergeRanges(ranges);
}

function mergeRanges(ranges: SourceRange[]) {
  const sorted = ranges.slice().sort((left, right) => left.start - right.start);
  const merged: SourceRange[] = [];
  sorted.forEach((range) => {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
      return;
    }
    merged.push({ ...range });
  });
  return merged;
}

function isInsideRanges(index: number, ranges: SourceRange[]) {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function findMatches(masked: string, pattern: RegExp) {
  return [...masked.matchAll(pattern)].map((match) => ({
    index: match.index || 0,
    match: match[0],
  }));
}

function findUnboundCtxMatches(masked: string, pattern: RegExp, bindings: SourceBinding[]) {
  return findMatches(masked, pattern).filter((entry) => !isNameBoundAtIndex(bindings, 'ctx', entry.index));
}

function collectSourceBindings(
  masked: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
) {
  const bindings: SourceBinding[] = [];
  for (const match of masked.matchAll(/\b(const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    const kind = match[1];
    const matchIndex = match.index || 0;
    if ((kind === 'function' || kind === 'class') && isNamedFunctionOrClassExpression(masked, matchIndex, kind)) {
      const expressionRange = findNamedFunctionOrClassExpressionRange(masked, matchIndex, kind);
      if (expressionRange) {
        bindings.push({
          name: match[2],
          declarationStart: matchIndex,
          start: expressionRange.start,
          end: expressionRange.end,
        });
      }
      continue;
    }
    addSourceBinding(
      bindings,
      functionRanges,
      blockRanges,
      staticBlockRanges,
      masked,
      match[2],
      matchIndex,
      masked.length,
      kind,
    );
  }
  collectDestructuredVariableBindingNames(masked, functionRanges, blockRanges, staticBlockRanges, bindings);
  collectParameterBindingNames(masked, bindings);
  return bindings;
}

function collectStringLiteralBindings(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: StringLiteralBinding[] = [];
  const commentMasked = maskJavaScriptComments(source);
  for (const match of commentMasked.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['"`])/g)) {
    const declarationIndex = match.index || 0;
    const literalStart = declarationIndex + match[0].lastIndexOf(match[2]);
    const statementEnd = findSingleStatementEnd(masked, declarationIndex);
    const literal = readCompleteStringLiteral(source.slice(literalStart, statementEnd));
    if (!literal) {
      continue;
    }
    const binding = findSourceBindingByDeclaration(bindings, match[1], declarationIndex);
    entries.push({
      name: match[1],
      value: literal.value,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  }
  return entries;
}

function isNamedFunctionOrClassExpression(masked: string, keywordIndex: number, kind: string) {
  let previous = getPreviousSignificantTokenInfo(masked, keywordIndex);
  if (kind === 'function' && previous?.token === 'async') {
    previous = getPreviousSignificantTokenInfo(masked, previous.start);
  }
  if (!previous) {
    return false;
  }
  return isExpressionPrefixToken(previous.token);
}

function isExpressionPrefixToken(token: string) {
  return (
    [
      '=',
      '(',
      '[',
      ',',
      ':',
      '?',
      'return',
      'throw',
      'yield',
      'await',
      'case',
      'new',
      'delete',
      'void',
      'typeof',
    ].includes(token) || /^[!~+\-*%&|^<>]$/.test(token)
  );
}

function findNamedFunctionOrClassExpressionRange(masked: string, keywordIndex: number, kind: string) {
  if (kind === 'function') {
    const openParen = masked.indexOf('(', keywordIndex);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = closeParen > openParen ? findBraceBodyAfter(masked, closeParen) : undefined;
    return bodyRange ? { start: keywordIndex, end: bodyRange.end } : undefined;
  }

  const openBrace = masked.indexOf('{', keywordIndex);
  const closeBrace = findMatchingDelimiter(masked, openBrace);
  return closeBrace > openBrace ? { start: openBrace, end: closeBrace + 1 } : undefined;
}

function addSourceBinding(
  bindings: SourceBinding[],
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
  masked: string,
  name: string,
  start: number,
  sourceEnd: number,
  kind: string,
) {
  const scope = resolveBindingScope(masked, sourceEnd, start, kind, functionRanges, blockRanges, staticBlockRanges);
  bindings.push({
    name,
    declarationStart: start,
    start: scope.start,
    end: scope.end,
  });
}

function resolveBindingScope(
  masked: string,
  sourceEnd: number,
  start: number,
  kind: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
): SourceRange {
  const forScope = ['const', 'let', 'class'].includes(kind)
    ? findForScopeForDeclaration(masked, start, blockRanges)
    : undefined;
  if (forScope) {
    return forScope;
  }
  if (['const', 'let', 'class'].includes(kind)) {
    return findInnermostRange(start, blockRanges) || { start: 0, end: sourceEnd };
  }
  const functionScope = findInnermostRange(start, functionRanges);
  if (functionScope) {
    return functionScope;
  }
  const staticBlockScope = findInnermostRange(start, staticBlockRanges);
  if (staticBlockScope) {
    return staticBlockScope;
  }
  return { start: 0, end: sourceEnd };
}

function findForScopeForDeclaration(masked: string, start: number, blockRanges: SourceRange[]) {
  const forHeader = findForHeaderRangeContaining(masked, start);
  if (!forHeader) {
    return undefined;
  }
  const bodyRange = findFollowingStatementRange(masked, forHeader.end, blockRanges);
  return bodyRange ? { start: forHeader.start, end: bodyRange.end } : undefined;
}

function findForHeaderRangeContaining(masked: string, start: number) {
  for (const match of masked.matchAll(/\bfor\s*(?:await\s*)?\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (start > openParen && start < closeParen) {
      return { start: openParen + 1, end: closeParen };
    }
  }
  return undefined;
}

function findFollowingBraceRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  return masked[cursor] === '{' ? blockRanges.find((range) => range.start === cursor) : undefined;
}

function findFollowingStatementRange(masked: string, afterIndex: number, blockRanges: SourceRange[]) {
  const braceRange = findFollowingBraceRange(masked, afterIndex, blockRanges);
  if (braceRange) {
    return braceRange;
  }
  let start = afterIndex + 1;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (start >= masked.length) {
    return undefined;
  }
  const end = findSingleStatementEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

function findSingleStatementEnd(masked: string, start: number) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = start; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    }
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      if (char === ';') {
        return index + 1;
      }
      if (char === '\n' || char === '\r') {
        return index;
      }
    }
  }
  return masked.length;
}

function collectDestructuredVariableBindingNames(
  masked: string,
  functionRanges: SourceRange[],
  blockRanges: SourceRange[],
  staticBlockRanges: SourceRange[],
  bindings: SourceBinding[],
) {
  for (const match of masked.matchAll(/\b(const|let|var)\s*(\{|\[)/g)) {
    const start = (match.index || 0) + match[0].length - 1;
    const end = findMatchingDelimiter(masked, start);
    if (end > start) {
      extractBindingPatternNames(masked.slice(start, end + 1)).forEach((name) => {
        addSourceBinding(
          bindings,
          functionRanges,
          blockRanges,
          staticBlockRanges,
          masked,
          name,
          match.index || 0,
          masked.length,
          match[1],
        );
      });
    }
  }
}

function collectParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\bfunction\b[^(]*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\bcatch\s*\(/g)) {
    const openParen = masked.indexOf('(', match.index || 0);
    const closeParen = findMatchingDelimiter(masked, openParen);
    const bodyRange = findBraceBodyAfter(masked, closeParen);
    if (closeParen > openParen && bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  collectArrowParameterBindingNames(masked, bindings);
  collectMethodParameterBindingNames(masked, bindings);
}

function collectArrowParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  for (const match of masked.matchAll(/\(/g)) {
    const openParen = match.index || 0;
    const closeParen = findMatchingDelimiter(masked, openParen);
    if (closeParen <= openParen) {
      continue;
    }
    let cursor = closeParen + 1;
    while (cursor < masked.length && /\s/.test(masked[cursor])) {
      cursor += 1;
    }
    if (masked.slice(cursor, cursor + 2) !== '=>') {
      continue;
    }
    const bodyRange = findArrowBodyRange(masked, cursor + 2);
    if (bodyRange) {
      addParameterBindings(bindings, masked.slice(openParen + 1, closeParen), {
        start: openParen + 1,
        end: bodyRange.end,
      });
    }
  }
  for (const match of masked.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) {
    const arrowIndex = (match.index || 0) + match[0].lastIndexOf('=>');
    const bodyRange = findArrowBodyRange(masked, arrowIndex + 2);
    if (bodyRange) {
      bindings.push({
        name: match[1],
        declarationStart: match.index || 0,
        start: match.index || 0,
        end: bodyRange.end,
      });
    }
  }
}

function collectMethodParameterBindingNames(masked: string, bindings: SourceBinding[]) {
  collectMethodCandidates(masked).forEach((candidate) => {
    addParameterBindings(bindings, masked.slice(candidate.paramsStart, candidate.paramsEnd), {
      start: candidate.paramsStart,
      end: candidate.bodyRange.end,
    });
  });
}

function findBraceBodyAfter(masked: string, afterIndex: number): SourceRange | undefined {
  let cursor = afterIndex + 1;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] !== '{') {
    return undefined;
  }
  const closeBrace = findMatchingDelimiter(masked, cursor);
  return closeBrace > cursor ? { start: cursor, end: closeBrace + 1 } : undefined;
}

function findArrowBodyRange(masked: string, afterArrowIndex: number): SourceRange | undefined {
  let start = afterArrowIndex;
  while (start < masked.length && /\s/.test(masked[start])) {
    start += 1;
  }
  if (masked[start] === '{') {
    const closeBrace = findMatchingDelimiter(masked, start);
    return closeBrace > start ? { start, end: closeBrace + 1 } : undefined;
  }
  const end = findArrowExpressionEnd(masked, start);
  return end > start ? { start, end } : undefined;
}

function addParameterBindings(bindings: SourceBinding[], params: string, range: SourceRange) {
  splitTopLevel(params, ',').forEach((param) => {
    extractBindingPatternNames(param).forEach((name) => {
      bindings.push({ name, declarationStart: range.start, ...range });
    });
  });
}

function extractBindingPatternNames(pattern: string) {
  const names = new Set<string>();
  collectBindingPatternNames(pattern, names);
  return [...names];
}

function collectBindingPatternNames(pattern: string, names: Set<string>) {
  const trimmed = trimBindingElement(pattern);
  if (!trimmed) {
    return;
  }
  if (trimmed.startsWith('{')) {
    collectObjectBindingPatternNames(trimmed, names);
    return;
  }
  if (trimmed.startsWith('[')) {
    collectArrayBindingPatternNames(trimmed, names);
    return;
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  if (match) {
    names.add(match[1]);
  }
}

function collectObjectBindingPatternNames(pattern: string, names: Set<string>) {
  const body = stripEnclosure(pattern, '{', '}');
  splitTopLevel(body, ',').forEach((element) => {
    const trimmed = element.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.startsWith('...')) {
      collectBindingPatternNames(trimmed.slice(3), names);
      return;
    }
    const colon = findTopLevelChar(trimmed, ':');
    collectBindingPatternNames(colon >= 0 ? trimmed.slice(colon + 1) : trimmed, names);
  });
}

function collectArrayBindingPatternNames(pattern: string, names: Set<string>) {
  splitTopLevel(stripEnclosure(pattern, '[', ']'), ',').forEach((element) =>
    collectBindingPatternNames(element, names),
  );
}

function trimBindingElement(pattern: string) {
  const withoutRest = pattern
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  const equal = findTopLevelChar(withoutRest, '=');
  return (equal >= 0 ? withoutRest.slice(0, equal) : withoutRest).trim();
}

function stripEnclosure(pattern: string, open: string, close: string) {
  const trimmed = pattern.trim();
  return trimmed.startsWith(open) && trimmed.endsWith(close) ? trimmed.slice(1, -1) : trimmed;
}

function splitTopLevel(value: string, separator: string) {
  const parts: string[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function splitTopLevelWithRanges(value: string, separator: string) {
  const parts: CallArgumentSource[] = [];
  let start = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === separator && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      parts.push({ source: value.slice(start, index), start, end: index });
      start = index + 1;
    }
  }
  parts.push({ source: value.slice(start), start, end: value.length });
  return parts;
}

function findTopLevelChar(value: string, target: string) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === target && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      return index;
    }
  }
  return -1;
}

function findInnermostRange(index: number, ranges: SourceRange[]) {
  return ranges
    .filter((range) => index >= range.start && index < range.end)
    .sort((left, right) => left.end - left.start - (right.end - right.start))[0];
}

function isNameBoundAtIndex(bindings: SourceBinding[], name: string, index: number) {
  return bindings.some((binding) => binding.name === name && index >= binding.start && index < binding.end);
}

function findSourceBindingByDeclaration(bindings: SourceBinding[], name: string, declarationStart: number) {
  return bindings.find((entry) => entry.name === name && (entry.declarationStart ?? entry.start) === declarationStart);
}

function isSourceAliasShadowedAtIndex(
  alias: SourceRange & { declarationStart?: number; name: string },
  bindings: SourceBinding[],
  index: number,
) {
  const aliasDeclarationStart = alias.declarationStart ?? alias.start;
  return bindings.some(
    (binding) =>
      binding.name === alias.name &&
      index >= binding.start &&
      index < binding.end &&
      (binding.declarationStart ?? binding.start) !== aliasDeclarationStart,
  );
}

function collectForbiddenBareGlobals(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ name: string; index: number }> = [];
  for (const name of FORBIDDEN_BARE_GLOBALS) {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(name)}\\b`, 'g');
    for (const match of masked.matchAll(pattern)) {
      if (
        !isNameBoundAtIndex(bindings, name, match.index || 0) &&
        !isObjectPropertyKey(masked, match.index || 0, name)
      ) {
        entries.push({ name, index: match.index || 0 });
      }
    }
  }
  return entries.sort((left, right) => left.index - right.index);
}

function collectInvalidApiResourceCalls(source: string, masked: string, bindings: SourceBinding[]) {
  const resourceMethods = new Set(['list', 'get', 'create', 'update', 'destroy']);
  const entries = [
    ...masked.matchAll(
      /\bctx\s*(?:\?\.|\.)\s*api\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*(list|get|create|update|destroy)\s*(?:\?\.)?\(/g,
    ),
  ]
    .filter((match) => !isNameBoundAtIndex(bindings, 'ctx', match.index || 0))
    .map((match) => ({
      index: match.index || 0,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
      method: match[1],
    }));

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*api\s*(?:\?\.|\.)\s*resource\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const openParen = masked.indexOf('(', index);
    const closeParen = openParen >= 0 ? findMatchingDelimiter(masked, openParen) : -1;
    const args = getCallArgumentSources(source, masked, index);
    if (args.length >= 2) {
      const method = readCompleteStringLiteral(args[0]?.source || '')?.value;
      if (method && resourceMethods.has(method)) {
        entries.push({
          index,
          match: `ctx.api.resource('${method}')`,
          method,
        });
      }
      const resourceName = readCompleteStringLiteral(args[0]?.source || '')?.value;
      const action = readCompleteStringLiteral(args[1]?.source || '')?.value;
      if (action && resourceMethods.has(action)) {
        entries.push({
          index,
          match: resourceName
            ? `ctx.api.resource('${resourceName}', '${action}')`
            : `ctx.api.resource(..., '${action}')`,
          method: action,
        });
      }
    }
    if (closeParen < 0) {
      continue;
    }
    const chainedMethod = masked
      .slice(closeParen + 1, closeParen + 96)
      .match(/^\s*(?:\?\.|\.)\s*(list|get|create|update|destroy)\s*(?:\?\.)?\(/);
    if (!chainedMethod) {
      continue;
    }
    const method = chainedMethod[1];
    const resourceName = readCompleteStringLiteral(args[0]?.source || '')?.value;
    entries.push({
      index,
      match: resourceName ? `ctx.api.resource('${resourceName}').${method}` : `ctx.api.resource(...).${method}`,
      method,
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectInvalidResourceTypeCalls(
  source: string,
  masked: string,
  stringBindings: StringLiteralBinding[],
  bindings: SourceBinding[],
) {
  const entries: Array<{
    capability: string;
    expression?: string;
    index: number;
    message?: string;
    resourceType?: string;
    ruleId: string;
  }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const method = match[1];
    const capability = `ctx.${method}`;
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      entries.push({
        capability,
        expression: '',
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate ${capability}(...) without a resource type`,
      });
      continue;
    }
    const resolved = resolveResourceTypeExpression(firstArg, stringBindings);
    if (resolved.status === 'unresolved') {
      entries.push({
        capability,
        expression: resolved.expression,
        index,
        ruleId: 'runjs-make-resource-type-unresolved',
        message: `flowSurfaces authoring cannot validate dynamic ${capability}(...) resource type '${resolved.expression}'`,
      });
      continue;
    }
    const allowedResourceTypes = method === 'initResource' ? INIT_RESOURCE_CLASS_NAMES : FLOW_RESOURCE_CLASS_NAMES;
    if (!allowedResourceTypes.has(resolved.value)) {
      entries.push({
        capability,
        index,
        resourceType: resolved.value,
        ruleId: 'runjs-make-resource-type-invalid',
        message: `flowSurfaces authoring ${capability}(...) expects a FlowResource class name, not collection '${resolved.value}'`,
      });
    }
  }
  return entries;
}

function collectResourceCallsInReactHooks(
  source: string,
  masked: string,
  reactHookCalls: Array<{ hook: string; index: number; match: string }>,
  bindings: SourceBinding[],
): ResourceCallInReactHook[] {
  const hookArgumentRanges = reactHookCalls
    .map((hook) => {
      const firstArg = getCallArgumentSources(source, masked, hook.index)[0];
      return firstArg ? { hook: hook.hook, range: firstArg } : null;
    })
    .filter(Boolean) as Array<{ hook: string; range: SourceRange }>;
  if (!hookArgumentRanges.length) {
    return [];
  }

  const entries: ResourceCallInReactHook[] = [];
  const pattern = /\bctx\s*(?:\?\.|\.)\s*(?:(makeResource|initResource)\s*(?:\?\.)?\(|resource\b)/g;
  for (const match of masked.matchAll(pattern)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const hook = hookArgumentRanges.find((entry) => index >= entry.range.start && index < entry.range.end);
    if (!hook) {
      continue;
    }
    entries.push({
      capability: match[1] ? `ctx.${match[1]}` : 'ctx.resource',
      hook: hook.hook,
      index,
    });
  }
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectAstSharedCtxResourceCallsInFunctions(
  ast: any,
  source: string,
  ctxMethodAliases: CtxMethodAlias[],
  identifierBindings: AstIdentifierBinding[],
): SharedCtxResourceCallInFunction[] {
  const entries: SharedCtxResourceCallInFunction[] = [];
  const seen = new Set<string>();

  const addEntry = (capability: string, index: number, ancestors: any[]) => {
    const functionNode = getNearestAstFunctionAncestor(ancestors);
    if (!functionNode) {
      return;
    }
    const functionName = getAstFunctionDisplayName(functionNode, ancestors);
    const key = `${capability}:${functionNode.start || 0}:${functionNode.end || source.length}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    entries.push({
      capability,
      functionName,
      index,
    });
  };

  walkAstAncestor(ast, {
    CallExpression(node: any, ancestors: any[]) {
      const method = resolveCtxMethodCall(node, ctxMethodAliases, identifierBindings);
      if (method?.method === 'initResource') {
        addEntry(method.capability, node.start || 0, ancestors);
      }
    },
    MemberExpression(node: any, ancestors: any[]) {
      if (isAstCtxResourceMember(node, identifierBindings)) {
        addEntry('ctx.resource', node.start || 0, ancestors);
      }
    },
  });

  return entries.sort((left, right) => left.index - right.index);
}

function getNearestAstFunctionAncestor(ancestors: any[]) {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (isAstFunctionLike(ancestor)) {
      return ancestor;
    }
  }
  return undefined;
}

function getAstFunctionDisplayName(functionNode: any, ancestors: any[]) {
  if (functionNode?.id?.type === 'Identifier') {
    return functionNode.id.name;
  }
  const functionIndex = ancestors.findIndex((ancestor) => ancestor === functionNode);
  const parent = functionIndex >= 0 ? ancestors[functionIndex - 1] : undefined;
  if (parent?.type === 'VariableDeclarator' && parent.id?.type === 'Identifier') {
    return parent.id.name;
  }
  if (parent?.type === 'Property') {
    const key = getAstStaticPropertyName(parent);
    if (key) {
      return key;
    }
  }
  return undefined;
}

function resolveResourceTypeExpression(
  arg: CallArgumentSource,
  stringBindings: StringLiteralBinding[],
): { status: 'resolved'; value: string } | { status: 'unresolved'; expression: string } {
  const expression = arg.source.trim();
  const leadingLength = arg.source.length - arg.source.trimStart().length;
  const expressionIndex = arg.start + leadingLength;
  const literal = readCompleteStringLiteral(arg.source);
  if (literal) {
    return { status: 'resolved', value: literal.value };
  }
  if (/^[A-Za-z_$][\w$]*$/.test(expression)) {
    const binding = stringBindings.find(
      (entry) => entry.name === expression && expressionIndex >= entry.start && expressionIndex < entry.end,
    );
    if (binding) {
      return { status: 'resolved', value: binding.value };
    }
  }
  return {
    status: 'unresolved',
    expression,
  };
}

function collectFlowResourceAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: FlowResourceAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    const binding = findSourceBindingByDeclaration(bindings, name, declarationIndex);
    aliases.push({
      name,
      capability,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', (match.index || 0) + match[0].lastIndexOf('ctx'))) {
      continue;
    }
    addAlias(match[1], `ctx.${match[2]}`, match.index || 0);
  }
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*resource\b/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', (match.index || 0) + match[0].lastIndexOf('ctx'))) {
      continue;
    }
    addAlias(match[1], 'ctx.resource', match.index || 0);
  }
  return aliases;
}

function collectInvalidFlowResourceListCalls(masked: string, aliases: FlowResourceAlias[], bindings: SourceBinding[]) {
  const entries: Array<{ capability: string; index: number }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*resource\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g)) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    entries.push({
      index: match.index || 0,
      capability: 'ctx.resource.list',
    });
  }
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(makeResource|initResource)\s*(?:\?\.)?\([^)]*\)\s*(?:\?\.|\.)\s*list\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    entries.push({
      index: match.index || 0,
      capability: `ctx.${match[1]}(...).list`,
    });
  }
  aliases.forEach((alias) => {
    const pattern = new RegExp(
      `(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.|\\.)\\s*list\\s*(?:\\?\\.)?\\(`,
      'g',
    );
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      if (isSourceAliasShadowedAtIndex(alias, bindings, index)) {
        continue;
      }
      entries.push({
        index,
        capability: `${alias.name}.list`,
      });
    }
  });
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectCtxLibMemberCaseMismatches(
  source: string,
  masked: string,
  bindings: SourceBinding[],
): CtxLibMemberCaseMismatch[] {
  const entries: CtxLibMemberCaseMismatch[] = [];
  const addEntry = (
    index: number,
    member: string,
    accessKind: CtxLibMemberCaseMismatch['accessKind'],
    capability?: string,
  ) => {
    const expectedMember = CTX_LIB_MEMBER_BY_LOWERCASE.get(member.toLowerCase());
    if (!expectedMember || expectedMember === member) {
      return;
    }
    entries.push({
      accessKind,
      capability: capability || `ctx.libs.${member}`,
      expectedCapability: `ctx.libs.${expectedMember}`,
      expectedMember,
      index,
      member,
    });
  };

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*libs\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const member = match[1];
    addEntry(index + match[0].lastIndexOf(member), member, 'member');
  }

  for (const match of source.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*libs\s*(?:\?\.)?\s*\[\s*(['"])([A-Za-z_$][\w$]*)\1\s*\]/g,
  )) {
    const index = match.index || 0;
    if (masked.slice(index, index + 3) !== 'ctx' || isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const quote = match[1];
    const member = match[2];
    addEntry(index + match[0].indexOf(member), member, 'bracket', `ctx.libs[${quote}${member}${quote}]`);
  }

  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\s*(?:\?\.|\.)\s*libs\b/g)) {
    const declarationIndex = match.index || 0;
    const ctxIndex = declarationIndex + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const bindingPattern = match[1];
    const patternStart = declarationIndex + match[0].indexOf(bindingPattern);
    splitTopLevelWithRanges(bindingPattern, ',').forEach((property) => {
      const prop = readObjectBindingPropertyName(property.source);
      if (!prop) {
        return;
      }
      addEntry(patternStart + property.start + prop.offset, prop.name, 'destructure', `ctx.libs.${prop.name}`);
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function readObjectBindingPropertyName(element: string): { name: string; offset: number } | undefined {
  const trimmed = element.trim();
  if (!trimmed || trimmed.startsWith('...') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return undefined;
  }
  const normalized = trimBindingElement(trimmed);
  const colon = findTopLevelChar(normalized, ':');
  const rawProperty = (colon >= 0 ? normalized.slice(0, colon) : normalized).trim();
  const name = normalizeObjectPropertyName(rawProperty);
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
    return undefined;
  }
  const offset = Math.max(0, element.indexOf(name));
  return { name, offset };
}

function collectReactHookCalls(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ hook: string; index: number; match: string }> = [];
  const memberPattern = new RegExp(
    `\\b(?:(?:ctx\\s*(?:\\?\\.|\\.)\\s*(?:libs\\s*(?:\\?\\.|\\.)\\s*)?React)|React)\\s*(?:\\?\\.|\\.)\\s*(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`,
    'g',
  );
  for (const match of masked.matchAll(memberPattern)) {
    const index = match.index || 0;
    if (masked.slice(index, index + 3) === 'ctx' && isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    entries.push({
      hook: match[1],
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  const barePattern = new RegExp(`(?<![.$\\w])(${REACT_HOOK_PATTERN})\\s*(?:\\?\\.)?\\(`, 'g');
  for (const match of masked.matchAll(barePattern)) {
    const index = match.index || 0;
    const hook = match[1];
    if (getPreviousSignificantToken(masked, index) === 'function' || isObjectPropertyKey(masked, index, hook)) {
      continue;
    }
    entries.push({
      hook,
      index,
      match: match[0].replace(/\s*(?:\?\.)?\($/, ''),
    });
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectUnboundReactCreateElementCalls(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number }> = [];
  for (const match of masked.matchAll(/(?<![.$\w])React\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (!isNameBoundAtIndex(bindings, 'React', index)) {
      entries.push({ index });
    }
  }
  return entries;
}

function collectReactComponentAliases(masked: string, bindings: SourceBinding[]) {
  const aliases: ReactComponentAlias[] = [];
  const addAlias = (name: string, capability: string, declarationIndex: number) => {
    if (!/^[A-Z][\w$]*$/.test(name)) {
      return;
    }
    const binding = findSourceBindingByDeclaration(bindings, name, declarationIndex);
    aliases.push({
      name,
      capability,
      declarationStart: declarationIndex,
      start: declarationIndex,
      end: binding?.end ?? masked.length,
    });
  };

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\b/g,
  )) {
    const declarationIndex = match.index || 0;
    const ctxIndex = declarationIndex + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    collectObjectBindingAliases(match[1]).forEach((alias) =>
      addAlias(alias, `${namespace}.${alias}`, declarationIndex),
    );
  }

  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s+([A-Z][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\b/g,
  )) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    const namespace = `ctx.${match[2] ? 'libs.' : ''}${match[3]}`;
    addAlias(match[1], `${namespace}.${match[4]}`, match.index || 0);
  }

  return aliases;
}

function collectReactComponentFunctionCalls(masked: string, aliases: ReactComponentAlias[], bindings: SourceBinding[]) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(
    /\bctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)\s*(?:\?\.)?\(/g,
  )) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    const namespace = `ctx.${match[1] ? 'libs.' : ''}${match[2]}`;
    entries.push({
      index: match.index || 0,
      component: match[3],
      capability: `${namespace}.${match[3]}`,
    });
  }

  aliases.forEach((alias) => {
    const pattern = new RegExp(`(?<![.$\\w])${escapeRegExp(alias.name)}\\s*(?:\\?\\.)?\\(`, 'g');
    for (const match of masked.matchAll(pattern)) {
      const index = match.index || 0;
      if (index <= alias.start || index >= alias.end) {
        continue;
      }
      if (isSourceAliasShadowedAtIndex(alias, bindings, index)) {
        continue;
      }
      const previous = getPreviousSignificantToken(masked, index);
      if (previous === 'function' || isObjectPropertyKey(masked, index, alias.name)) {
        continue;
      }
      entries.push({
        index,
        component: alias.name,
        capability: alias.capability,
      });
    }
  });

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectCtxRenderComponentSignatureCalls(
  source: string,
  masked: string,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string }> = [];
  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    const index = match.index || 0;
    if (isNameBoundAtIndex(bindings, 'ctx', index)) {
      continue;
    }
    const firstArg = getCallArgumentSources(source, masked, index)[0];
    if (!firstArg) {
      continue;
    }
    const reference = readReactComponentReference(firstArg.source, aliases, firstArg.start, bindings);
    if (reference) {
      entries.push({
        index: firstArg.start,
        ...reference,
      });
    }
  }
  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactComponentPropReferences(
  source: string,
  masked: string,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const inspectPropsArg = (arg: CallArgumentSource | undefined) => {
    if (!arg) {
      return;
    }
    collectReactComponentPropReferencesFromObject(arg, aliases, bindings).forEach((entry) => entries.push(entry));
  };

  for (const match of masked.matchAll(
    /\b(?:(?:ctx\s*(?:\?\.|\.)\s*(?:libs\s*(?:\?\.|\.)\s*)?React)|React)\s*(?:\?\.|\.)\s*createElement\s*(?:\?\.)?\(/g,
  )) {
    if (
      masked.slice(match.index || 0, (match.index || 0) + 3) === 'ctx' &&
      isNameBoundAtIndex(bindings, 'ctx', match.index || 0)
    ) {
      continue;
    }
    inspectPropsArg(getCallArgumentSources(source, masked, match.index || 0)[1]);
  }

  for (const match of masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g)) {
    if (isNameBoundAtIndex(bindings, 'ctx', match.index || 0)) {
      continue;
    }
    const args = getCallArgumentSources(source, masked, match.index || 0);
    if (!readReactComponentReference(args[0]?.source || '', aliases, args[0]?.start || 0, bindings)) {
      continue;
    }
    inspectPropsArg(args[1]);
  }

  return dedupeIndexedEntries(entries).sort((left, right) => left.index - right.index);
}

function collectReactComponentPropReferencesFromObject(
  arg: CallArgumentSource,
  aliases: ReactComponentAlias[],
  bindings: SourceBinding[],
) {
  const entries: Array<{ index: number; component: string; capability: string; prop: string }> = [];
  const localMasked = maskJavaScriptSource(arg.source);
  const openOffset = arg.source.search(/\S/);
  if (openOffset < 0 || arg.source[openOffset] !== '{') {
    return entries;
  }
  const closeOffset = findMatchingDelimiter(localMasked, openOffset);
  if (closeOffset <= openOffset) {
    return entries;
  }
  const body = arg.source.slice(openOffset + 1, closeOffset);
  const bodyStart = arg.start + openOffset + 1;
  splitTopLevelWithRanges(body, ',').forEach((property) => {
    const colon = findTopLevelChar(property.source, ':');
    if (colon < 0) {
      return;
    }
    const propName = normalizeObjectPropertyName(property.source.slice(0, colon));
    if (!REACT_NODE_COMPONENT_PROP_NAMES.has(propName)) {
      return;
    }
    const rawValue = property.source.slice(colon + 1);
    const leading = rawValue.length - rawValue.trimStart().length;
    const valueStart = bodyStart + property.start + colon + 1 + leading;
    const reference = readReactComponentReference(rawValue, aliases, valueStart, bindings);
    if (!reference) {
      return;
    }
    entries.push({
      index: valueStart,
      prop: propName,
      ...reference,
    });
  });
  return entries;
}

function readReactComponentReference(
  expression: string,
  aliases: ReactComponentAlias[],
  expressionIndex: number,
  bindings: SourceBinding[],
): { component: string; capability: string } | undefined {
  const normalized = maskJavaScriptComments(expression).trim();
  const ctxMatch = normalized.match(
    /^ctx\s*(?:\?\.|\.)\s*(?:(libs)\s*(?:\?\.|\.)\s*)?(antdIcons|antd)\s*(?:\?\.|\.)\s*([A-Z][\w$]*)$/,
  );
  if (ctxMatch) {
    if (isNameBoundAtIndex(bindings, 'ctx', expressionIndex)) {
      return undefined;
    }
    const namespace = `ctx.${ctxMatch[1] ? 'libs.' : ''}${ctxMatch[2]}`;
    return {
      component: ctxMatch[3],
      capability: `${namespace}.${ctxMatch[3]}`,
    };
  }

  const aliasMatch = normalized.match(/^([A-Z][\w$]*)$/);
  if (!aliasMatch) {
    return undefined;
  }
  const alias = aliases.find(
    (entry) =>
      entry.name === aliasMatch[1] &&
      expressionIndex >= entry.start &&
      expressionIndex < entry.end &&
      !isSourceAliasShadowedAtIndex(entry, bindings, expressionIndex),
  );
  return alias
    ? {
        component: alias.name,
        capability: alias.capability,
      }
    : undefined;
}

function normalizeObjectPropertyName(value: string) {
  return value.trim().replace(/^['"]([A-Za-z_$][\w$]*)['"]$/, '$1');
}

function dedupeIndexedEntries<T extends { index: number; match?: string; capability?: string; component?: string }>(
  entries: T[],
) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.index}:${entry.match || ''}:${entry.capability || ''}:${entry.component || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isObjectPropertyKey(masked: string, index: number, name: string) {
  let cursor = index + name.length;
  while (cursor < masked.length && /\s/.test(masked[cursor])) {
    cursor += 1;
  }
  if (masked[cursor] === ':') {
    return true;
  }
  if (masked[cursor] !== '(') {
    return false;
  }
  const previous = getPreviousSignificantToken(masked, index);
  return previous === '{' || previous === ',';
}

function collectDirectDomWrites(source: string, masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ index: number; match: string }> = [];
  const commentMasked = maskJavaScriptComments(source);
  const pattern =
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|\b(document)\s*(?:\?\.|\.)\s*(createElement)\b|\b(element)\s*(?:\?\.|\.)\s*(innerHTML|insertAdjacentHTML)\b|(?<![.$\w])(insertAdjacentHTML)\s*(?:\?\.)?\(/g;
  for (const match of masked.matchAll(pattern)) {
    const index = match.index || 0;
    const boundRoot = match[3] || match[5];
    const bareFunction = match[7];
    if (
      (match[1] === 'ctx' && isNameBoundAtIndex(bindings, 'ctx', index)) ||
      (boundRoot && isNameBoundAtIndex(bindings, boundRoot, index)) ||
      (bareFunction && isNameBoundAtIndex(bindings, bareFunction, index))
    ) {
      continue;
    }
    entries.push({ index, match: match[0].replace(/\s*(?:\?\.)?\($/, '') });
  }
  for (const match of commentMasked.matchAll(
    /\b(ctx)\s*(?:\?\.|\.)\s*element\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, 'ctx') &&
      !isNameBoundAtIndex(bindings, 'ctx', index) &&
      (dynamicMember || isDirectDomMember(member))
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  for (const match of commentMasked.matchAll(
    /\b(document)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || member === 'createElement')
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  for (const match of commentMasked.matchAll(
    /\b(element)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const member = match[3] || '';
    const dynamicMember = Boolean(match[4]);
    if (
      isCodeTokenAt(masked, index, match[1]) &&
      !isNameBoundAtIndex(bindings, match[1], index) &&
      (dynamicMember || isDirectDomMember(member))
    ) {
      entries.push({ index, match: match[0] });
    }
  }
  return entries;
}

function collectWindowDocumentNavigatorUses(source: string, masked: string, bindings: SourceBinding[]) {
  const commentMasked = maskJavaScriptComments(source);
  const entries = [...masked.matchAll(/\b(window|document|navigator)\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => !isNameBoundAtIndex(bindings, match[1], match.index || 0))
    .map((match) => ({
      root: match[1],
      member: match[2],
      index: match.index || 0,
    }));
  for (const match of commentMasked.matchAll(
    /\b(window|document|navigator)\s*(?:\?\.\s*)?\[\s*(?:(['"])([A-Za-z_$][\w$]*)\2|([^\]]+))\s*\]/g,
  )) {
    const index = match.index || 0;
    const root = match[1];
    if (!isCodeTokenAt(masked, index, root) || isNameBoundAtIndex(bindings, root, index)) {
      continue;
    }
    entries.push({
      root,
      member: match[3] || '[dynamic]',
      index,
    });
  }
  return entries.sort((left, right) => left.index - right.index);
}

function collectWindowDocumentNavigatorAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; root: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*(window|document|navigator)\b/g,
    ],
    (match) => {
      const alias = match[1];
      const root = match[2];
      const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
      if (alias === root || isNameBoundAtIndex(bindings, root, rootIndex)) {
        return;
      }
      entries.push({ alias, root, index: rootIndex });
    },
  );
  for (const match of masked.matchAll(
    /\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(window|document|navigator)\b(?!\s*(?:\.|\?\.))/g,
  )) {
    const root = match[2];
    const rootIndex = (match.index || 0) + match[0].lastIndexOf(root);
    if (isNameBoundAtIndex(bindings, root, rootIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, root, index: rootIndex });
    });
  }
  return dedupeAliasEntries(entries);
}

function collectDirectDomAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\s*(?:\?\.|\.)\s*element\b/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1])
      .filter((alias) => alias === 'element')
      .forEach((alias) => {
        entries.push({ alias, index: ctxIndex });
      });
  }
  return dedupeAliasEntries(entries);
}

function collectCtxAliases(masked: string, bindings: SourceBinding[]) {
  const entries: Array<{ alias: string; index: number }> = [];
  collectAliasMatches(
    masked,
    [
      /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
      /(?<![.$\w])([A-Za-z_$][\w$]*)\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g,
    ],
    (match) => {
      const alias = match[1];
      const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
      if (alias === 'ctx' || isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
        return;
      }
      entries.push({ alias, index: ctxIndex });
    },
  );
  for (const match of masked.matchAll(/\b(?:const|let|var)\s*\{([^}]*)\}\s*=\s*ctx\b(?!\s*(?:\.|\?\.))/g)) {
    const ctxIndex = (match.index || 0) + match[0].lastIndexOf('ctx');
    if (isNameBoundAtIndex(bindings, 'ctx', ctxIndex)) {
      continue;
    }
    collectObjectBindingAliases(match[1]).forEach((alias) => {
      entries.push({ alias, index: ctxIndex });
    });
  }
  return dedupeAliasEntries(entries);
}

function collectAliasMatches(
  masked: string,
  patterns: RegExp[],
  onMatch: (match: RegExpMatchArray & { index?: number }) => void,
) {
  patterns.forEach((pattern) => {
    for (const match of masked.matchAll(pattern)) {
      onMatch(match);
    }
  });
}

function dedupeAliasEntries<T extends { alias: string; index: number }>(entries: T[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.alias}:${entry.index}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function collectObjectBindingAliases(pattern: string) {
  return splitTopLevel(pattern, ',')
    .flatMap((element) => collectObjectBindingElementAliases(element))
    .filter(Boolean);
}

function collectObjectBindingElementAliases(element: string): string[] {
  const trimmed = element
    .trim()
    .replace(/^\.\.\./, '')
    .trim();
  if (!trimmed || trimmed.startsWith('{')) {
    return [];
  }
  const colon = findTopLevelChar(trimmed, ':');
  if (colon >= 0) {
    const right = trimBindingElement(trimmed.slice(colon + 1));
    const match = right.match(/^([A-Za-z_$][\w$]*)\b/);
    return match ? [match[1]] : [];
  }
  const match = trimmed.match(/^([A-Za-z_$][\w$]*)\b/);
  return match ? [match[1]] : [];
}

function isDirectDomMember(member: string) {
  return member === 'innerHTML' || member === 'insertAdjacentHTML';
}

function isCodeTokenAt(masked: string, index: number, token: string) {
  return masked.slice(index, index + token.length) === token;
}

function collectCtxMemberAccesses(masked: string, bindings: SourceBinding[]) {
  return [...masked.matchAll(/\bctx\s*(?:\?\.|\.)\s*([A-Za-z_$][\w$]*)/g)]
    .filter((match) => !isNameBoundAtIndex(bindings, 'ctx', match.index || 0))
    .map((match) => ({
      member: match[1],
      index: match.index || 0,
    }));
}

function isTopLevelFunctionWrapper(masked: string, functionRanges: SourceRange[], topLevelCtxRenderCalls: any[]) {
  if (topLevelCtxRenderCalls.length || !functionRanges.length) {
    return false;
  }
  return /^\s*(?:async\s+)?function\b/.test(masked) || /^\s*(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=/.test(masked);
}

function resolveFieldModelUse(type: string, renderer: string, blockType: string) {
  if (type === 'jsColumn') {
    return 'JSColumnModel';
  }
  if (type === 'jsItem') {
    return 'JSItemModel';
  }
  if (renderer === 'js') {
    return ['createForm', 'editForm'].includes(blockType) ? 'JSEditableFieldModel' : 'JSFieldModel';
  }
  return '';
}

function resolveActionModelUse(actionType: string, blockType: string, slot: 'actions' | 'recordActions') {
  if (actionType === 'jsItem') {
    return 'JSItemActionModel';
  }
  if (actionType !== 'js') {
    return '';
  }
  if (slot === 'recordActions') {
    return 'JSRecordActionModel';
  }
  if (['createForm', 'editForm'].includes(blockType)) {
    return 'JSFormActionModel';
  }
  if (blockType === 'filterForm') {
    return 'FilterFormJSActionModel';
  }
  if (['table', 'list', 'gridCard', 'calendar', 'kanban'].includes(blockType)) {
    return 'JSCollectionActionModel';
  }
  return 'JSActionModel';
}

function resolveConfigureModelUse(currentNode: any) {
  const currentUse = normalizeText(currentNode?.use);
  if (KNOWN_MODEL_USES.has(currentUse)) {
    return currentUse;
  }
  const fieldUse = normalizeText(currentNode?.subModels?.field?.use);
  if (KNOWN_MODEL_USES.has(fieldUse)) {
    return fieldUse;
  }
  return '';
}

function resolveConfigureBlockType(context: RunJsAuthoringContext) {
  const hostBlockType = normalizeText(context.hostBlockType);
  if (hostBlockType) {
    return resolvePublicBlockType(hostBlockType);
  }
  const currentUse = normalizeText(context.currentNode?.use);
  return resolvePublicBlockType(currentUse);
}

function resolvePublicBlockType(value: any) {
  const normalized = normalizeText(value);
  return PUBLIC_BLOCK_TYPE_BY_MODEL_USE[normalized] || normalized;
}

function resolveSurfaceStyle(input: RunJsAuthoringInspectionInput): RunJsAuthoringSurfaceStyle | undefined {
  if (input.surfaceStyle) {
    return input.surfaceStyle;
  }
  const surface = normalizeText(input.surface);
  if (surface && SURFACE_STYLE_BY_ID[surface]) {
    return SURFACE_STYLE_BY_ID[surface];
  }
  return resolveModelSurfaceStyle(input.modelUse);
}

function resolveModelSurfaceStyle(modelUse: any): RunJsAuthoringSurfaceStyle | undefined {
  const normalized = normalizeText(modelUse);
  if (RENDER_MODEL_USES.has(normalized)) {
    return 'render';
  }
  if (ACTION_MODEL_USES.has(normalized)) {
    return 'action';
  }
  if (VALUE_MODEL_USES.has(normalized)) {
    return 'value';
  }
  return undefined;
}

function normalizeActionType(value: any) {
  const normalized = normalizeText(value);
  return ACTION_TYPE_ALIASES.get(normalized.toLowerCase()) || normalized;
}

function normalizeText(value: any) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildRunJsAuthoringError(input: {
  path: string;
  repairClass: RunJsAuthoringRepairClass;
  message: string;
  modelUse?: string;
  surface?: string;
  index: number;
  source: string;
  ruleId?: string;
  details?: Record<string, any>;
}): FlowSurfaceErrorItemInput {
  const rule = getRunJsAuthoringRule(input.repairClass);
  const loc = getLineColumn(input.source, input.index);
  const agentInstruction = getRunJsAuthoringAgentInstruction(input.repairClass);
  return {
    path: input.path,
    ruleId: input.ruleId || rule.defaultRuleId,
    message: buildRunJsAuthoringErrorMessage(input.message, agentInstruction, rule.suggestedAction),
    details: buildDefinedDetails({
      repairClass: input.repairClass,
      suggestedAction: rule.suggestedAction,
      skipForbidden: true,
      mustRetry: true,
      agentInstruction,
      line: loc.line,
      column: loc.column,
      ...input.details,
    }),
  };
}

function getRunJsAuthoringAgentInstruction(repairClass: RunJsAuthoringRepairClass) {
  return CONTEXT_FIRST_REPAIR_CLASSES.has(repairClass)
    ? RUNJS_CONTEXT_AND_RETRY_INSTRUCTION
    : RUNJS_FIX_AND_RETRY_INSTRUCTION;
}

function buildRunJsAuthoringErrorMessage(message: string, agentInstruction: string, suggestedAction: string) {
  return [message, agentInstruction, suggestedAction ? `Suggested fix: ${suggestedAction}` : '']
    .filter(Boolean)
    .join(' ');
}

function buildDefinedDetails(details: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => typeof value !== 'undefined' && value !== ''),
  );
}

function getLineColumn(source: string, index: number) {
  const safeIndex = Math.max(0, Math.min(index, source.length));
  const prefix = source.slice(0, safeIndex);
  const lines = prefix.split(/\r\n|\r|\n/);
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function dedupeErrors(errors: FlowSurfaceErrorItemInput[]) {
  const seen = new Set<string>();
  return errors.filter((error) => {
    const key = `${error.path}:${error.ruleId}:${error.details?.line}:${error.details?.column}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isResourceLikeCtxRequest(source: string, masked: string, index: number) {
  const args = getCallArgumentSource(source, masked, index);
  if (!args) {
    return false;
  }
  const firstArg = getCallFirstArgumentSource(source, masked, index);
  const firstArgLiteral = firstArg ? readLeadingStringLiteral(firstArg) : undefined;
  if (firstArgLiteral) {
    return isResourceLikeCtxRequestUrl(firstArgLiteral.value.trim());
  }
  const urlMatch = args.match(/\burl\s*:\s*(['"`])([^'"`]+)\1/i) || args.match(/^\s*(['"`])([^'"`]+)\1\s*$/);
  if (urlMatch) {
    return isResourceLikeCtxRequestUrl(urlMatch[2].trim());
  }
  return /\b(?:resource|collectionName|collection)\s*:/i.test(args);
}

function isResourceLikeCtxRequestUrl(url: string) {
  if (/^(?:https?:)?\/\//i.test(url)) {
    return false;
  }
  const resourceUrl = url.replace(/^\/api\//i, '').replace(/^\//, '');
  return isResourceLikeRequestUrl(resourceUrl);
}

function isResourceLikeRequestUrl(url: string) {
  return /^(?:[A-Za-z_$][\w$.-]*|\$\{[^}]+\}):(?:list|get)(?:\b|[/?#])/i.test(url);
}

function getResourceLikeCtxRunjsEntrypoint(source: string, masked: string, index: number) {
  const firstArg = getCallFirstArgumentSource(source, masked, index);
  if (!firstArg) {
    return '';
  }
  const literal = readLeadingStringLiteral(firstArg);
  if (literal) {
    const endpoint = literal.value.trim();
    return isResourceLikeRunjsEntrypoint(endpoint) ? endpoint : '';
  }
  const expression = firstArg.trim();
  return isResourceLikeRunjsEntrypointExpression(expression) ? expression : '';
}

function readLeadingStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const quote = value[index];
  if (quote !== '"' && quote !== "'" && quote !== '`') {
    return undefined;
  }
  let cursor = index + 1;
  let output = '';
  while (cursor < value.length) {
    const char = value[cursor];
    if (char === '\\') {
      output += value.slice(cursor, Math.min(value.length, cursor + 2));
      cursor += 2;
      continue;
    }
    if (char === quote) {
      return {
        value: output,
        end: cursor + 1,
      };
    }
    output += char;
    cursor += 1;
  }
  return undefined;
}

function readCompleteStringLiteral(value: string) {
  const index = skipJavaScriptTrivia(value, 0);
  const literal = readLeadingStringLiteral(value);
  if (!literal) {
    return undefined;
  }
  const rawLiteral = value.slice(index, literal.end);
  if (rawLiteral.startsWith('`') && rawLiteral.includes('${')) {
    return undefined;
  }
  const rest = value.slice(literal.end);
  if (/^[ \t]*(?:\r\n|\r|\n)/.test(rest)) {
    return literal;
  }
  const restIndex = skipJavaScriptTrivia(rest, 0);
  const next = rest[restIndex];
  if (!next || /[,;)\]}]/.test(next)) {
    return literal;
  }
  return undefined;
}

function isResourceLikeRunjsEntrypoint(value: string) {
  const trimmed = value.trim();
  const action = RUNJS_RESOURCE_ACTION_PATTERN;
  return (
    new RegExp(`^(?:resource|collection):${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`^[A-Za-z_$][\\w$.-]*:${action}(?:$|[/?#])`, 'i').test(trimmed) ||
    new RegExp(`\\$\\{[^}]+\\}\\s*:${action}(?:$|[/?#])`, 'i').test(trimmed)
  );
}

function isResourceLikeRunjsEntrypointExpression(value: string) {
  const withoutComments = maskJavaScriptComments(value);
  return new RegExp(`(['"\`])\\s*:${RUNJS_RESOURCE_ACTION_PATTERN}\\1`).test(withoutComments);
}

function skipJavaScriptTrivia(value: string, start: number) {
  let index = start;
  while (index < value.length) {
    while (index < value.length && /\s/.test(value[index])) {
      index += 1;
    }
    if (value[index] === '/' && value[index + 1] === '/') {
      index += 2;
      while (index < value.length && value[index] !== '\n' && value[index] !== '\r') {
        index += 1;
      }
      continue;
    }
    if (value[index] === '/' && value[index + 1] === '*') {
      index += 2;
      while (index < value.length && !(value[index] === '*' && value[index + 1] === '/')) {
        index += 1;
      }
      index = Math.min(value.length, index + 2);
      continue;
    }
    return index;
  }
  return index;
}

function getCallFirstArgumentSource(source: string, masked: string, index: number) {
  return getCallArgumentSources(source, masked, index)[0]?.source || '';
}

function getCallArgumentSources(source: string, masked: string, index: number) {
  const args: CallArgumentSource[] = [];
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return args;
  }
  let parenDepth = 1;
  let bracketDepth = 0;
  let braceDepth = 0;
  let argStart = openParen + 1;
  for (let cursor = openParen + 1; cursor < masked.length; cursor += 1) {
    const char = masked[cursor];
    if (char === '(') {
      parenDepth += 1;
    } else if (char === ')' && parenDepth > 0) {
      parenDepth -= 1;
      if (parenDepth === 0) {
        if (cursor > argStart || source.slice(argStart, cursor).trim()) {
          args.push({
            source: source.slice(argStart, cursor),
            start: argStart,
            end: cursor,
          });
        }
        return args;
      }
    } else if (char === '[') {
      bracketDepth += 1;
    } else if (char === ']' && bracketDepth > 0) {
      bracketDepth -= 1;
    } else if (char === '{') {
      braceDepth += 1;
    } else if (char === '}' && braceDepth > 0) {
      braceDepth -= 1;
    } else if (char === ',' && parenDepth === 1 && bracketDepth === 0 && braceDepth === 0) {
      args.push({
        source: source.slice(argStart, cursor),
        start: argStart,
        end: cursor,
      });
      argStart = cursor + 1;
    }
  }
  return args;
}

function getCallArgumentSource(source: string, masked: string, index: number) {
  const openParen = masked.indexOf('(', index);
  if (openParen < 0) {
    return '';
  }
  let depth = 0;
  for (let cursor = openParen; cursor < masked.length; cursor += 1) {
    if (masked[cursor] === '(') {
      depth += 1;
    } else if (masked[cursor] === ')') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(openParen + 1, cursor);
      }
    }
  }
  return '';
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
