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
import * as _ from 'lodash';
import type { FlowSurfaceErrorItemInput } from '../errors';
import { getRunJsAuthoringRule } from './rules';
import type { RunJsAuthoringInspectionInput, RunJsAuthoringRepairClass, RunJsAuthoringSurfaceStyle } from './types';

type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

type RunJsAuthoringContext = {
  authoringActionName?: FlowSurfaceAuthoringWriteAction;
  applyBlueprintScriptAssets?: Record<string, any>;
  currentNode?: any;
  hostBlockType?: string;
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
  name: string;
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

type CtxLibMemberCaseMismatch = {
  accessKind: 'bracket' | 'destructure' | 'member';
  capability: string;
  expectedCapability: string;
  expectedMember: string;
  index: number;
  member: string;
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
  nestedRunjsCalls: Array<{
    capability: string;
    index: number;
  }>;
  reactAsyncComponentReferences: Array<{
    capability: string;
    component: string;
    index: number;
  }>;
  sharedCtxResourceCallsInFunctions: SharedCtxResourceCallInFunction[];
};

type CtxMethodAlias = SourceRange & {
  capability: string;
  method: string;
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
  'collection',
  'console',
  'dataSourceManager',
  'date',
  'dayjs',
  'element',
  'engine',
  'form',
  'formValues',
  'getValue',
  'getVar',
  'importAsync',
  'initResource',
  'libs',
  'logger',
  'makeResource',
  'message',
  'modal',
  'model',
  'notification',
  'popup',
  'React',
  'ReactDOM',
  'record',
  'render',
  'request',
  'requireAsync',
  'resource',
  'role',
  'runAction',
  'runjs',
  'setValue',
  't',
  'user',
  'value',
  'viewer',
]);

const CHART_CTX_ROOTS = new Set(['data']);

const BLOCKED_CTX_CAPABILITIES: Record<string, { capability: string; reroute: string }> = {
  openView: {
    capability: 'ctx.openView',
    reroute: 'popup-action-or-field-popup',
  },
};

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
const AST_CTX_METHOD_NAMES = new Set(['runjs', 'makeResource', 'initResource']);
const REACT_NODE_COMPONENT_PROP_NAMES = new Set(['avatar', 'extra', 'icon', 'prefix', 'suffix']);
const CANONICAL_CTX_LIB_MEMBERS = ['React', 'ReactDOM', 'antd', 'dayjs', 'antdIcons', 'lodash', 'formula', 'math'];
const CTX_LIB_MEMBER_BY_LOWERCASE = new Map(CANONICAL_CTX_LIB_MEMBERS.map((member) => [member.toLowerCase(), member]));
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
const MULTI_RECORD_RESOURCE_METHODS = unionMethodSets([
  RECORD_RESOURCE_METHODS,
  new Set([
    'setCreateActionOptions',
    'setUpdateActionOptions',
    'setSelectedRows',
    'getSelectedRows',
    'getCount',
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
const FLOW_RESOURCE_METHOD_SUGGESTIONS = new Map([['setFilters', 'setFilter']]);
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
    collectReactionRunJsErrors(values.reaction, '$.reaction', errors, validationContext.runJsSourceBudget);
    collectReactionRunJsErrors(
      values.changes?.reaction,
      '$.changes.reaction',
      errors,
      validationContext.runJsSourceBudget,
    );
    return dedupeErrors(errors);
  }

  if (actionName === 'applyBlueprint') {
    collectChartAssetRunJsErrors(values.assets?.charts, '$.assets.charts', errors, validationContext.runJsSourceBudget);
  }

  getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
    collectBlockRunJsErrors(block, path, validationContext, errors),
  );
  collectReactionRunJsErrors(values.reaction, '$.reaction', errors, validationContext.runJsSourceBudget);
  return dedupeErrors(errors);
}

export function collectFlowRegistryRunJsAuthoringErrors(
  flowRegistry: any,
  path = '$.flowRegistry',
): FlowSurfaceErrorItemInput[] {
  const errors: FlowSurfaceErrorItemInput[] = [];
  collectFlowRegistryRunJsErrors(flowRegistry, path, errors, createRunJsSourceBudget());
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
): FlowSurfaceErrorItemInput[] {
  const limitResult = collectRunJsSourceLimitErrors(input, budget);
  if (limitResult.skipInspection || limitResult.errors.length) {
    return limitResult.errors;
  }
  return inspectRunJsAuthoringCode(input);
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

export function inspectRunJsAuthoringCode(input: RunJsAuthoringInspectionInput): FlowSurfaceErrorItemInput[] {
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

  const scan = scanJavaScriptSource(source, parseResult.ast);
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
      ),
    );
  }
  if (hostBlockType === 'chart') {
    collectChartRawRunJsErrors(changes, '$.changes', errors, context.runJsSourceBudget);
    collectChartLegacyConfigureRunJsErrors(changes.configure, '$.changes.configure', errors, context.runJsSourceBudget);
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
    );
  });
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

  if (blockType === 'jsBlock') {
    collectRunJsSources(block, path, context).forEach((source) => {
      errors.push(
        ...inspectRunJsAuthoringCodeForWrite(
          {
            code: source.code,
            path: source.path,
            modelUse: 'JSBlockModel',
            surfaceStyle: 'render',
          },
          context.runJsSourceBudget,
        ),
      );
    });
  }
  if (blockType === 'chart') {
    collectChartRawRunJsErrors(block.settings, `${path}.settings`, errors, context.runJsSourceBudget);
    collectChartLegacyConfigureRunJsErrors(
      block.settings?.configure,
      `${path}.settings.configure`,
      errors,
      context.runJsSourceBudget,
    );
  }

  collectFieldListRunJsErrors(block.fields, `${path}.fields`, blockType, context, errors);
  _.castArray(block.fieldGroups || []).forEach((group, groupIndex) => {
    collectFieldListRunJsErrors(group?.fields, `${path}.fieldGroups[${groupIndex}].fields`, blockType, context, errors);
  });
  collectActionListRunJsErrors(block.actions, `${path}.actions`, blockType, 'actions', context, errors);
  collectActionListRunJsErrors(
    block.recordActions,
    `${path}.recordActions`,
    blockType,
    'recordActions',
    context,
    errors,
  );
  collectReactionRunJsErrors(block.reaction, `${path}.reaction`, errors, context.runJsSourceBudget);
  collectFlowRegistryRunJsErrors(block.flowRegistry, `${path}.flowRegistry`, errors, context.runJsSourceBudget);
  collectBlockListRunJsErrors(block.blocks, `${path}.blocks`, context, errors);
  collectBlockListRunJsErrors(block.popup?.blocks, `${path}.popup.blocks`, context, errors);
  collectReactionRunJsErrors(block.popup?.reaction, `${path}.popup.reaction`, errors, context.runJsSourceBudget);

  HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[blockType]?.forEach((key) => {
    collectBlockListRunJsErrors(block.settings?.[key]?.blocks, `${path}.settings.${key}.blocks`, context, errors);
    collectReactionRunJsErrors(
      block.settings?.[key]?.reaction,
      `${path}.settings.${key}.reaction`,
      errors,
      context.runJsSourceBudget,
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
          ),
        );
      });
    }
    collectReactionRunJsErrors(field.reaction, `${fieldPath}.reaction`, errors, context.runJsSourceBudget);
    collectActionListRunJsErrors(field.actions, `${fieldPath}.actions`, blockType, 'actions', context, errors);
    collectBlockListRunJsErrors(field.popup?.blocks, `${fieldPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(field.popup?.reaction, `${fieldPath}.popup.reaction`, errors, context.runJsSourceBudget);
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
          ),
        );
      });
    }
    collectReactionRunJsErrors(action.reaction, `${actionPath}.reaction`, errors, context.runJsSourceBudget);
    collectBlockListRunJsErrors(action.popup?.blocks, `${actionPath}.popup.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.popup?.reaction,
      `${actionPath}.popup.reaction`,
      errors,
      context.runJsSourceBudget,
    );
    collectBlockListRunJsErrors(action.openView?.blocks, `${actionPath}.openView.blocks`, context, errors);
    collectReactionRunJsErrors(
      action.openView?.reaction,
      `${actionPath}.openView.reaction`,
      errors,
      context.runJsSourceBudget,
    );
  });
}

function collectChartAssetRunJsErrors(
  charts: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
) {
  if (!_.isPlainObject(charts)) {
    return;
  }
  Object.entries(charts).forEach(([key, asset]) => {
    if (!_.isPlainObject(asset)) {
      return;
    }
    collectChartRawRunJsErrors(asset, `${path}.${key}`, errors, budget);
  });
}

function collectChartLegacyConfigureRunJsErrors(
  configure: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
) {
  if (!_.isPlainObject(configure)) {
    return;
  }
  const chart = _.isPlainObject(configure.chart) ? configure.chart : undefined;
  const option = _.isPlainObject(chart?.option) ? chart.option : undefined;
  const events = _.isPlainObject(chart?.events) ? chart.events : undefined;
  collectChartOptionRunJsErrors(option?.raw, `${path}.chart.option.raw`, errors, budget);
  collectChartEventsRunJsErrors(events?.raw, `${path}.chart.events.raw`, errors, budget);
}

function collectChartRawRunJsErrors(
  value: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const visual = _.isPlainObject(value.visual) ? value.visual : undefined;
  const events = _.isPlainObject(value.events) ? value.events : undefined;
  collectChartOptionRunJsErrors(visual?.raw, `${path}.visual.raw`, errors, budget);
  collectChartEventsRunJsErrors(events?.raw, `${path}.events.raw`, errors, budget);
}

function collectChartOptionRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
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
    ),
  );
}

function collectChartEventsRunJsErrors(
  code: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
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
    ),
  );
}

function collectReactionRunJsErrors(
  reaction: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
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
      collectEventFlowRunJsStepErrors(step, `${path}.${flowKey}.steps.${stepKey}`, errors, budget);
    });
  });
}

function collectEventFlowRunJsStepErrors(
  step: any,
  path: string,
  errors: FlowSurfaceErrorItemInput[],
  budget?: RunJsSourceBudget,
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

  const firstTopLevelRender = scan.topLevelCtxRenderCalls[0];
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

function scanJavaScriptSource(source: string, ast?: any) {
  const masked = maskJavaScriptSource(source);
  const functionRanges = findFunctionRanges(masked);
  const blockRanges = collectBraceRanges(masked);
  const staticBlockRanges = collectStaticBlockRanges(masked);
  const sourceBindings = collectSourceBindings(masked, functionRanges, blockRanges, staticBlockRanges);
  const stringLiteralBindings = collectStringLiteralBindings(source, masked, sourceBindings);
  const astInspection = ast ? inspectRunJsAst(ast, source, stringLiteralBindings) : undefined;
  const ctxRenderCalls = findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.|\.)\s*render\s*(?:\?\.)?\(/g, sourceBindings);
  const topLevelCtxRenderCalls = ctxRenderCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges));
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
    topLevelReturns,
    ctxRunjsCalls,
    nestedRunjsCalls: astInspection?.nestedRunjsCalls || ctxRunjsCalls,
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
    resourceCallsInReactHooks: collectResourceCallsInReactHooks(source, masked, reactHookCalls, sourceBindings),
    topLevelReactHookCalls: reactHookCalls.filter((entry) => !isInsideRanges(entry.index, functionRanges)),
    unboundReactCreateElementCalls: collectUnboundReactCreateElementCalls(masked, sourceBindings),
    reactComponentFunctionCalls: collectReactComponentFunctionCalls(masked, reactComponentAliases, sourceBindings),
    reactAsyncComponentReferences: astInspection?.reactAsyncComponentReferences || [],
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
    forbiddenBareGlobals,
    ctxMemberAccesses: collectCtxMemberAccesses(masked, sourceBindings),
    dynamicCtxAccesses: findUnboundCtxMatches(masked, /\bctx\s*(?:\?\.\s*)?\[/g, sourceBindings),
    isTopLevelFunctionWrapper: isTopLevelFunctionWrapper(masked, functionRanges, topLevelCtxRenderCalls),
  };
}

function inspectRunJsAst(ast: any, source: string, stringBindings: StringLiteralBinding[]): RunJsAstInspection {
  const identifierBindings = collectAstIdentifierBindingsFromAst(ast, source);
  const aliases = collectCtxMethodAliasesFromAst(ast, source, identifierBindings);
  const ctxApiAliases = collectCtxApiAliasesFromAst(ast, source, identifierBindings);
  const ctxApiResourceAliases = collectCtxApiResourceAliasesFromAst(ast, source, ctxApiAliases, identifierBindings);
  const reactNamespaceAliases = collectReactNamespaceAliasesFromAst(ast, source, identifierBindings);
  const reactCreateElementAliases = collectReactCreateElementAliasesFromAst(
    ast,
    source,
    identifierBindings,
    reactNamespaceAliases,
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
  const invalidApiResourceCalls: RunJsAstInspection['invalidApiResourceCalls'] = [];
  const invalidResourceTypeCalls: RunJsAstInspection['invalidResourceTypeCalls'] = [];
  const invalidFlowResourceListCalls: RunJsAstInspection['invalidFlowResourceListCalls'] = [];
  const invalidFlowResourceMethodCalls: RunJsAstInspection['invalidFlowResourceMethodCalls'] = [];
  const reactAsyncComponentReferences: RunJsAstInspection['reactAsyncComponentReferences'] = [];
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
    invalidResourceTypeCalls: dedupeAstResourceEntries(invalidResourceTypeCalls),
    invalidFlowResourceListCalls: dedupeIndexedEntries(invalidFlowResourceListCalls).sort(
      (left, right) => left.index - right.index,
    ),
    invalidFlowResourceMethodCalls: dedupeIndexedEntries(invalidFlowResourceMethodCalls).sort(
      (left, right) => left.index - right.index,
    ),
    nestedRunjsCalls: dedupeIndexedEntries(nestedRunjsCalls).sort((left, right) => left.index - right.index),
    reactAsyncComponentReferences: dedupeIndexedEntries(reactAsyncComponentReferences).sort(
      (left, right) => left.index - right.index,
    ),
    sharedCtxResourceCallsInFunctions,
  };
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

function trimAstAliasesAfterWrites<
  T extends SourceRange & { declarationStart?: number; executionScope: SourceRange; name: string },
>(
  aliases: T[],
  writes: Array<{ alwaysRunsInExecutionScope: boolean; executionScope: SourceRange; index: number; name: string }>,
  identifierBindings: AstIdentifierBinding[],
): T[] {
  return aliases.map((alias) => {
    const aliasDeclarationStart = alias.declarationStart ?? alias.start;
    const nextWrite = writes
      .filter(
        (write) =>
          write.name === alias.name &&
          write.index > aliasDeclarationStart &&
          write.index >= alias.start &&
          write.index < alias.end &&
          write.alwaysRunsInExecutionScope &&
          isSameAstRange(write.executionScope, alias.executionScope) &&
          !hasAstShadowBinding(alias.name, write.index, alias, identifierBindings),
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
      if (node.argument?.type === 'Identifier') {
        writes.push({
          alwaysRunsInExecutionScope: isAstAlwaysExecutedInCurrentExecutionScope(ancestors),
          executionScope: getAstExecutionScopeRange(ancestors, source.length),
          name: node.argument.name,
          index: typeof node.argument.start === 'number' ? node.argument.start : node.start || 0,
        });
      }
    },
    ForInStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForInSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      collectAstPatternBindingIdentifiers(node.left, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope: isAstAlwaysExecutedInCurrentExecutionScope(ancestors),
          executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.left?.start || node.start || 0,
        });
      });
    },
    ForOfStatement(node: any, ancestors: any[]) {
      if (!isAstDefinitelyNonEmptyForOfSource(node.right) || node.left?.type === 'VariableDeclaration') {
        return;
      }
      const executionScope = getAstExecutionScopeRange(ancestors, source.length);
      collectAstPatternBindingIdentifiers(node.left, (name, bindingNode) => {
        writes.push({
          alwaysRunsInExecutionScope: isAstAlwaysExecutedInCurrentExecutionScope(ancestors),
          executionScope,
          name,
          index: typeof bindingNode?.start === 'number' ? bindingNode.start : node.left?.start || node.start || 0,
        });
      });
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
      const capability = getReactCreateElementCapabilityFromAst(node.right, identifierBindings, namespaceAliases);
      if (capability) {
        addAlias(node.left.name, capability, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      const isVar = declaration?.kind === 'var';
      if (node.id?.type === 'Identifier') {
        const capability = getReactCreateElementCapabilityFromAst(node.init, identifierBindings, namespaceAliases);
        if (capability) {
          addAlias(node.id.name, capability, node, ancestors, isVar);
        }
        return;
      }
      if (
        node.id?.type === 'ObjectPattern' &&
        getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases)
      ) {
        const namespace = getReactNamespaceCapabilityFromAst(node.init, identifierBindings, namespaceAliases);
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
): ReactNamespaceAlias[] {
  const aliases: ReactNamespaceAlias[] = [];
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
      const capability = getDirectReactNamespaceCapabilityFromAst(node.right, identifierBindings);
      if (capability) {
        addAlias(node.left.name, capability, node, ancestors);
      }
    },
    VariableDeclarator(node: any, ancestors: any[]) {
      if (node.id?.type !== 'Identifier') {
        return;
      }
      const capability = getDirectReactNamespaceCapabilityFromAst(node.init, identifierBindings);
      if (!capability) {
        return;
      }
      const declaration = findAstAncestor(ancestors, 'VariableDeclaration');
      addAlias(node.id.name, capability, node, ancestors, declaration?.kind === 'var');
    },
  });

  return aliases;
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
) {
  const member = unwrapAstChainExpression(node);
  if (!member || member.type !== 'MemberExpression') {
    return '';
  }
  const propertyName = getAstStaticPropertyName(member);
  if (propertyName !== 'createElement') {
    return '';
  }
  const namespace = getReactNamespaceCapabilityFromAst(member.object, identifierBindings, namespaceAliases);
  return namespace ? `${namespace}.createElement` : '';
}

function getReactNamespaceCapabilityFromAst(
  node: any,
  identifierBindings: AstIdentifierBinding[],
  aliases: ReactNamespaceAlias[],
) {
  const unwrapped = unwrapAstChainExpression(node);
  if (!unwrapped) {
    return '';
  }
  if (unwrapped.type === 'Identifier') {
    const index = typeof unwrapped.start === 'number' ? unwrapped.start : 0;
    const alias = resolveAstAliasBinding(unwrapped.name, index, aliases, identifierBindings);
    if (alias) {
      return alias.capability;
    }
  }
  return getDirectReactNamespaceCapabilityFromAst(unwrapped, identifierBindings);
}

function getDirectReactNamespaceCapabilityFromAst(node: any, identifierBindings: AstIdentifierBinding[]) {
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
  if (isUnshadowedCtxIdentifier(unwrapped.object, identifierBindings)) {
    return 'ctx.React';
  }
  const object = unwrapAstChainExpression(unwrapped.object);
  if (
    object?.type === 'MemberExpression' &&
    getAstStaticPropertyName(object) === 'libs' &&
    isUnshadowedCtxIdentifier(object.object, identifierBindings)
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
    'CatchClause',
    'ConditionalExpression',
    'DoWhileStatement',
    'ForStatement',
    'IfStatement',
    'LogicalExpression',
    'SwitchCase',
    'SwitchStatement',
    'TryStatement',
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
    node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
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
