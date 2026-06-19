/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { operators as databaseOperators } from '@nocobase/database';
import * as _ from 'lodash';
import { Op } from 'sequelize';
import type { FlowResourceInstanceType } from '../internal-types';
import type { RunJsAuthoringRepairClass, RunJsAuthoringSurfaceStyle } from '../types';

export const RENDER_MODEL_USES = new Set([
  'JSBlockModel',
  'JSColumnModel',
  'JSFieldModel',
  'JSItemModel',
  'JSEditableFieldModel',
  'FormJSFieldItemModel',
  'JSItemActionModel',
]);

export const ACTION_MODEL_USES = new Set([
  'JSActionModel',
  'JSFormActionModel',
  'JSRecordActionModel',
  'JSCollectionActionModel',
  'FilterFormJSActionModel',
  'ChartEventsModel',
]);

export const VALUE_MODEL_USES = new Set(['ChartOptionModel']);

export const KNOWN_MODEL_USES = new Set([...RENDER_MODEL_USES, ...ACTION_MODEL_USES, ...VALUE_MODEL_USES]);

export const PUBLIC_BLOCK_TYPE_BY_MODEL_USE: Record<string, string> = {
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

export const SURFACE_STYLE_BY_ID: Record<string, RunJsAuthoringSurfaceStyle> = {
  'event-flow.execute-javascript': 'action',
  'linkage.execute-javascript': 'action',
  'reaction.value-runjs': 'value',
  'custom-variable.runjs': 'value',
  'js-model.render': 'render',
  'js-model.action': 'action',
};

export const SURFACE_ALLOWED_MODEL_USES: Record<string, Set<string>> = {
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

export const ALLOWED_CTX_ROOTS = new Set([
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

export const CHART_CTX_ROOTS = new Set(['data']);

export const BLOCKED_CTX_CAPABILITIES: Record<string, { capability: string; reroute: string }> = {};

export const RUNJS_ALLOWED_BARE_GLOBALS = new Set([
  'ctx',
  'console',
  'window',
  'document',
  'navigator',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'Array',
  'ArrayBuffer',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Math',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'Reflect',
  'RegExp',
  'Set',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'URIError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'Intl',
  'JSON',
  'Blob',
  'URL',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'undefined',
  'NaN',
  'Infinity',
]);

export const RUNJS_ALLOWED_BARE_GLOBALS_BY_MODEL_USE: Record<string, Set<string>> = {
  ChartEventsModel: new Set(['chart', 'params']),
};

export const NON_METHOD_CALL_KEYWORDS = new Set(['catch', 'do', 'for', 'function', 'if', 'switch', 'while', 'with']);

export const ACTION_TYPE_ALIASES = new Map([
  ['jsitem', 'jsItem'],
  ['js-item', 'jsItem'],
]);

export const REACT_HOOK_NAMES = [
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

export const REACT_HOOK_PATTERN = REACT_HOOK_NAMES.map(escapeRegExp).join('|');
export const RUNJS_RESOURCE_ACTION_PATTERN = '(?:list|get|create|update|destroy)';
export const MAX_RUNJS_SOURCE_LENGTH = 64 * 1024;
export const MAX_RUNJS_TOTAL_SOURCE_LENGTH = 256 * 1024;
export const MAX_RUNJS_SOURCES_PER_REQUEST = 100;
export const MAX_RUNJS_ERRORS_PER_SOURCE = 20;
export const RUNJS_SUPPORTED_FILTER_OPERATORS = buildRunJsSupportedFilterOperators();
export const RUNJS_DATE_FILTER_OPERATORS = new Set([
  '$dateOn',
  '$dateNotOn',
  '$dateBefore',
  '$dateAfter',
  '$dateNotBefore',
  '$dateNotAfter',
  '$dateBetween',
]);
export const RUNJS_UNSUPPORTED_DATE_RANGE_VALUE_KEYS = new Set(['$dateFrom', '$dateTo']);
export const FLOW_RESOURCE_CLASS_NAMES = new Set([
  'FlowResource',
  'APIResource',
  'SingleRecordResource',
  'MultiRecordResource',
  'SQLResource',
]);
export const INIT_RESOURCE_CLASS_NAMES = new Set([
  'APIResource',
  'SingleRecordResource',
  'MultiRecordResource',
  'SQLResource',
]);
export const AST_CTX_METHOD_NAMES = new Set(['runjs', 'makeResource', 'initResource', 'render', 'request']);
export const RUNJS_CTX_NON_FUNCTION_ROOTS = new Set([
  'acl',
  'antd',
  'antdIcons',
  'api',
  'auth',
  'blockModel',
  'collection',
  'collectionField',
  'console',
  'dataSourceManager',
  'date',
  'element',
  'engine',
  'filterManager',
  'form',
  'formValues',
  'i18n',
  'libs',
  'location',
  'logger',
  'message',
  'modal',
  'model',
  'notification',
  'popup',
  'React',
  'ReactDOM',
  'record',
  'resource',
  'role',
  'route',
  'router',
  'sql',
  'user',
  'value',
  'view',
  'viewer',
]);
export const RUNJS_CTX_NON_FUNCTION_ROOTS_BY_MODEL_USE: Record<string, Set<string>> = {
  ChartEventsModel: CHART_CTX_ROOTS,
  ChartOptionModel: CHART_CTX_ROOTS,
};
export const REACT_NODE_COMPONENT_PROP_NAMES = new Set(['avatar', 'extra', 'icon', 'prefix', 'suffix']);
export const CANONICAL_CTX_LIB_MEMBERS = [
  'React',
  'ReactDOM',
  'antd',
  'dayjs',
  'antdIcons',
  'lodash',
  'formula',
  'math',
];
export const CTX_LIB_MEMBER_BY_LOWERCASE = new Map(
  CANONICAL_CTX_LIB_MEMBERS.map((member) => [member.toLowerCase(), member]),
);
export const RUNJS_CTX_LIB_ANTD_ALLOWED_MEMBERS = new Set([
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
export const RUNJS_CTX_LIB_ALLOWED_MEMBERS_BY_LIBRARY = new Map<string, Set<string>>([
  ['antd', RUNJS_CTX_LIB_ANTD_ALLOWED_MEMBERS],
]);
export const RUNJS_CTX_API_ALLOWED_MEMBERS = new Set(['auth', 'request', 'resource']);
export const RUNJS_CTX_API_AUTH_ALLOWED_MEMBERS = new Set(['authenticator', 'locale', 'role', 'token']);
export const RUNJS_RESOURCE_METHODS = new Set(['list', 'get', 'create', 'update', 'destroy']);
export const RUNJS_COLLECTION_RESOURCE_ACTIONS = new Set([
  'add',
  'create',
  'destroy',
  'firstOrCreate',
  'get',
  'list',
  'move',
  'query',
  'remove',
  'set',
  'toggle',
  'update',
  'updateOrCreate',
]);
export const RUNJS_COLLECTION_RESOURCE_ACTION_ALIASES = new Map<string, string[]>([
  ['create', ['create', 'firstOrCreate', 'updateOrCreate']],
  ['view', ['get', 'list', 'query']],
  ['update', ['add', 'move', 'remove', 'set', 'toggle', 'update']],
  ['destroy', ['destroy']],
]);
export const RUNJS_RESOURCE_ENDPOINT_ACTION_PATTERN = '[A-Za-z_$][\\w$-]*';
export const FLOW_RESOURCE_BASE_METHODS = new Set([
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
export const API_RESOURCE_METHODS = unionMethodSets([
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
export const RECORD_RESOURCE_METHODS = unionMethodSets([
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
export const RUNJS_RESOURCE_CHAINABLE_STATE_METHODS = new Set(['setDataSourceKey', 'setResourceName', 'setFilter']);
export const MULTI_RECORD_RESOURCE_METHODS = unionMethodSets([
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
export const SINGLE_RECORD_RESOURCE_METHODS = unionMethodSets([
  RECORD_RESOURCE_METHODS,
  new Set(['setSaveActionOptions', 'save', 'destroy', 'refresh']),
]);
export const SQL_RESOURCE_METHODS = unionMethodSets([
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
export const FLOW_RESOURCE_METHODS_BY_TYPE: Record<Exclude<FlowResourceInstanceType, 'unknown'>, Set<string>> = {
  FlowResource: FLOW_RESOURCE_BASE_METHODS,
  APIResource: API_RESOURCE_METHODS,
  SingleRecordResource: SINGLE_RECORD_RESOURCE_METHODS,
  MultiRecordResource: MULTI_RECORD_RESOURCE_METHODS,
  SQLResource: SQL_RESOURCE_METHODS,
};
export const UNKNOWN_FLOW_RESOURCE_METHODS = unionMethodSets(Object.values(FLOW_RESOURCE_METHODS_BY_TYPE));
export const FLOW_RESOURCE_METHOD_SUGGESTIONS = new Map([
  ['setFilters', 'setFilter'],
  ['getCount', 'getData'],
]);
export const CONTEXT_FIRST_REPAIR_CLASSES = new Set<RunJsAuthoringRepairClass>([
  'unknown-surface-stop',
  'unknown-model-stop',
  'ctx-root-mismatch-stop',
  'blocked-capability-reroute',
]);
export const RUNJS_FIX_AND_RETRY_INSTRUCTION =
  'Do not skip this JS/RunJS step. Fix the error and retry the same write. If the response contains errors[], fix every listed error in one payload revision before retrying. Do not remove, defer, or replace the JS/RunJS capability to bypass validation.';
export const RUNJS_CONTEXT_AND_RETRY_INSTRUCTION =
  'Do not skip this JS/RunJS step. Resolve the blocking context/problem first, then retry the same write. If the response contains errors[], fix every listed error in one payload revision before retrying. Do not remove, defer, or replace the JS/RunJS capability to bypass validation.';

function unionMethodSets(methodSets: Array<Set<string>>) {
  const union = new Set<string>();
  methodSets.forEach((methodSet) => {
    methodSet.forEach((method) => union.add(method));
  });
  return union;
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
