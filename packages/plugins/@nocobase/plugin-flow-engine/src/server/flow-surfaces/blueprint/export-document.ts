/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { ACTION_KEY_BY_USE, BLOCK_KEY_BY_USE } from '../catalog';
import { deriveChartSemanticState } from '../chart-config';
import { throwBadRequest } from '../errors';
import { getPublicFieldTypeForUse } from '../field-type-resolver';
import { normalizeFlowSurfaceComposeKey } from '../service-utils';
import { FLOW_SURFACE_INTERNAL_META_KEY, getDeclaredKeyFromNode } from '../planning/key-registry';
import {
  normalizeActionLinkageRules,
  normalizeBlockLinkageRules,
  normalizeFieldLinkageRules,
} from '../reaction/linkage';
import { normalizeFieldValueRules } from '../reaction/field-value';
import { resolveReactionCapability, resolveReactionStorageNode, resolveReactionTarget } from '../reaction/resolver';
import { getReactionKindsForUse } from '../reaction/registry';
import type {
  FlowSurfaceActionLinkageRule,
  FlowSurfaceBlockLinkageRule,
  FlowSurfaceFieldLinkageRule,
  FlowSurfaceFieldValueRule,
  FlowSurfaceFieldLinkageScene,
  FlowSurfaceReactionKind,
  FlowSurfaceReactionSlot,
} from '../reaction/types';
import type {
  FlowSurfaceApplyBlueprintActionObjectSpec,
  FlowSurfaceApplyBlueprintAssetMap,
  FlowSurfaceApplyBlueprintBlockSpec,
  FlowSurfaceApplyBlueprintDocument,
  FlowSurfaceApplyBlueprintFieldObjectSpec,
  FlowSurfaceApplyBlueprintFieldSpec,
  FlowSurfaceApplyBlueprintLayout,
  FlowSurfaceApplyBlueprintLayoutCell,
  FlowSurfaceApplyBlueprintPopup,
  FlowSurfaceApplyBlueprintTabDocument,
} from './public-types';
import { normalizeApplyBlueprintToken } from './private-utils';

export type FlowSurfaceExportBlueprintUnsupportedPolicy = 'error' | 'warn';

export type FlowSurfaceExportBlueprintUnsupportedItem = {
  kind: 'page' | 'tab' | 'block' | 'field' | 'action' | 'recordAction' | 'reaction' | 'layout' | 'popup';
  use?: string;
  type?: string;
  path: string;
  reasonCode: string;
  manualAction: string;
};

export type FlowSurfaceExportBlueprintResult = {
  document: FlowSurfaceApplyBlueprintDocument;
  source: {
    target: {
      pageSchemaUid: string;
    };
    pageTitle?: string;
  };
  warnings: string[];
  unsupported: FlowSurfaceExportBlueprintUnsupportedItem[];
};

type FlowSurfaceExportNode = Record<string, unknown> & {
  uid?: string;
  use?: string;
  props?: Record<string, unknown>;
  decoratorProps?: Record<string, unknown>;
  stepParams?: Record<string, unknown>;
  flowRegistry?: Record<string, unknown>;
  template?: Record<string, unknown>;
  fieldsTemplate?: Record<string, unknown>;
  popup?: Record<string, unknown>;
  subModels?: Record<string, unknown>;
};

type FlowSurfaceExportBlueprintContext = {
  unsupportedPolicy: FlowSurfaceExportBlueprintUnsupportedPolicy;
  warnings: string[];
  unsupported: FlowSurfaceExportBlueprintUnsupportedItem[];
  chartAssets: FlowSurfaceApplyBlueprintAssetMap;
};

type KeyScope = {
  prefix: string;
  used: Set<string>;
};

type ExportedKeyBinding = {
  uid: string;
  key: string;
  fieldPaths?: string[];
};

type FlowSurfaceExportFieldResult = {
  spec: FlowSurfaceApplyBlueprintFieldSpec;
  uid?: string;
  bindingUids?: string[];
  key?: string;
  fieldPaths?: string[];
};

type FlowSurfaceExportActionResult = {
  spec: FlowSurfaceApplyBlueprintActionObjectSpec;
  uid?: string;
  key?: string;
};

type FlowSurfaceExportBlockResult = {
  spec?: FlowSurfaceApplyBlueprintBlockSpec;
  uid?: string;
  key?: string;
  descendantKeys?: ExportedKeyBinding[];
  fieldPaths?: string[];
};

type FlowSurfaceExportResourceContext = {
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
};

const UNSUPPORTED_MANUAL_ACTION = 'Recreate this node manually or add mapper support.';
const UNSUPPORTED_BLOCK_MANUAL_ACTION = 'Recreate this block manually or add mapper support.';
const APPLY_BLUEPRINT_UNSUPPORTED_BLOCK_TYPES = new Set(['form', 'map']);
const DATA_BLOCK_SETTING_GROUP_BY_TYPE: Record<string, string> = {
  table: 'tableSettings',
  createForm: 'formModelSettings',
  editForm: 'formModelSettings',
  details: 'detailsSettings',
  filterForm: 'formFilterBlockModelSettings',
  list: 'listSettings',
  gridCard: 'GridCardSettings',
  calendar: 'calendarSettings',
  kanban: 'kanbanSettings',
  tree: 'treeSettings',
  comments: 'commentsSettings',
  recordHistory: 'recordHistorySettings',
};
const FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details', 'filterForm']);
const CARD_FIELD_BLOCK_TYPES = new Set(['list', 'gridCard', 'kanban']);
const TABLE_ACTIONS_COLUMN_USE = 'TableActionsColumnModel';
const FLOW_REGISTRY_UNSUPPORTED_REASON = 'unsupported-flow-registry';
const TEMPLATE_SUMMARY_UNSUPPORTED_REASON = 'unsupported-template-summary';
const PUBLIC_POPUP_ACTION_TYPES = new Set(['addNew', 'addChild', 'view', 'edit', 'popup', 'duplicate']);
const BASIC_ACTION_STEP_PARAM_GROUPS = new Set([
  'buttonSettings',
  'deleteSettings',
  'popupSettings',
  'filterSettings',
  'clickSettings',
  'jsSettings',
]);
const BASIC_ACTION_PROP_KEYS = new Set([
  'title',
  'tooltip',
  'icon',
  'onlyIcon',
  'type',
  'danger',
  'color',
  'defaultFilterValue',
  'filterValue',
  'filterableFieldNames',
  'position',
]);
const BASIC_ACTION_BUTTON_GENERAL_KEYS = new Set(['title', 'tooltip', 'icon', 'onlyIcon', 'type', 'danger', 'color']);
const BASIC_DELETE_ACTION_TYPES = new Set(['delete', 'bulkDelete']);
const RECORD_HISTORY_GENERATED_ACTION_USES = new Set([
  'RecordHistoryExpandActionModel',
  'RecordHistoryCollapseActionModel',
]);
const BASIC_DELETE_CONFIRM_KEYS = new Set(['enable', 'title', 'content']);
const BASIC_INLINE_POPUP_OPEN_VIEW_KEYS = new Set(['mode', 'title', 'tryTemplate', 'defaultType']);
const BASIC_INLINE_POPUP_DEFAULT_RUNTIME_KEYS = new Set([
  'size',
  'pageModelClass',
  'dataSourceKey',
  'collectionName',
  'associationName',
  'sourceId',
  'filterByTk',
]);
const JS_ACTION_USES = new Set([
  'JSCollectionActionModel',
  'JSRecordActionModel',
  'JSFormActionModel',
  'FilterFormJSActionModel',
  'JSActionModel',
]);
const JS_ITEM_ACTION_USES = new Set(['JSItemActionModel']);
const BASIC_FIELD_STEP_PARAM_GROUPS = new Set([
  'fieldSettings',
  'tableColumnSettings',
  'detailItemSettings',
  'editItemSettings',
  'filterFormItemSettings',
  'jsSettings',
]);
const EXPORTED_RESOURCE_SETTING_PATHS = [
  'init.dataSourceKey',
  'init.collectionName',
  'init.associationName',
  'init.associationPathName',
  'init.sourceId',
  'init.filterByTk',
];
const EXPORTED_DATA_BLOCK_SETTING_PATHS = ['dataScope.filter.*', 'defaultSorting.sort', 'pageSize.pageSize'];
const EXPORTED_LIST_BLOCK_SETTING_PATHS = [...EXPORTED_DATA_BLOCK_SETTING_PATHS, 'layout.layout'];
const EXPORTED_GRID_CARD_BLOCK_SETTING_PATHS = [
  'columnCount.columnCount.xs',
  'columnCount.columnCount.sm',
  'columnCount.columnCount.md',
  'columnCount.columnCount.lg',
  'columnCount.columnCount.xl',
  'columnCount.columnCount.xxl',
  'rowCount.rowCount',
  'dataScope.filter.*',
  'defaultSorting.sort',
  'layout.layout',
];
const EXPORTED_KANBAN_BLOCK_SETTING_PATHS = [
  'grouping.groupField',
  'grouping.groupTitleField',
  'grouping.groupColorField',
  'grouping.groupOptions.*',
  'styleVariant.styleVariant',
  'defaultSorting.sort',
  'dragEnabled.dragEnabled',
  'dragSortBy.dragSortBy',
  'quickCreate.quickCreateEnabled',
  'popup.*',
  'pageSize.pageSize',
  'columnWidth.columnWidth',
  'dataScope.filter.*',
];
const EXPORTED_KANBAN_CARD_ITEM_SETTING_PATHS = [
  'click.enableCardClick',
  'popup.*',
  'layout.layout',
  'layout.labelAlign',
  'layout.labelWidth',
  'layout.labelWrap',
  'layout.colon',
];
const EXPORTED_ACTION_PANEL_BLOCK_SETTING_PATHS = ['layout.layout', 'ellipsis.ellipsis'];
const EXPORTED_RECORD_HISTORY_BLOCK_SETTING_PATHS = [
  'sortOrder.order',
  'dataScope.filter.*',
  'expand.expand',
  'template.apply',
];
const EXPORTED_CALENDAR_SETTING_PATHS = [
  'titleField.titleField',
  'colorField.colorFieldName',
  'startDateField.start',
  'endDateField.end',
  'defaultView.defaultView',
  'quickCreateEvent.enableQuickCreateEvent',
  'showLunar.showLunar',
  'weekStart.weekStart',
  'quickCreatePopupSettings.*',
  'eventPopupSettings.*',
  'dataScope.filter.*',
];
const EXPORTED_TREE_BLOCK_PROP_KEYS = new Set([
  'searchable',
  'defaultExpandAll',
  'includeDescendants',
  'fieldNames',
  'pageSize',
]);
const EXPORTED_CALENDAR_BLOCK_PROP_KEYS = new Set([
  'fieldNames',
  'defaultView',
  'enableQuickCreateEvent',
  'showLunar',
  'weekStart',
  'quickCreatePopupSettings',
  'eventPopupSettings',
]);
const EXPORTED_CALENDAR_POPUP_KEYS = new Set(['mode', 'size', 'title', 'tryTemplate', 'defaultType']);
const IGNORED_CALENDAR_POPUP_RUNTIME_KEYS = new Set([
  'uid',
  'pageModelClass',
  'collectionName',
  'dataSourceKey',
  'associationName',
  'filterByTk',
  'sourceId',
  'template',
  'popupTemplateUid',
  'popupTemplateContext',
  'popupTemplateMode',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
]);
const EXPORTED_KANBAN_BLOCK_PROP_KEYS = new Set([
  'groupField',
  'groupTitleField',
  'groupColorField',
  'groupOptions',
  'styleVariant',
  'sortField',
  'globalSort',
  'dragEnabled',
  'dragSortBy',
  'quickCreateEnabled',
  'popupMode',
  'popupSize',
  'popupTemplateUid',
  'popupPageModelClass',
  'popupTargetUid',
  'quickCreatePopupSettings',
  'pageSize',
  'columnWidth',
]);
const EXPORTED_KANBAN_CARD_ITEM_PROP_KEYS = new Set([
  'enableCardClick',
  'openMode',
  'popupSize',
  'popupTemplateUid',
  'pageModelClass',
  'popupTargetUid',
  'cardPopupSettings',
  'layout',
  'labelAlign',
  'labelWidth',
  'labelWrap',
  'colon',
]);
const EXPORTED_KANBAN_POPUP_KEYS = new Set(['mode', 'size', 'title', 'tryTemplate', 'defaultType']);
const IGNORED_KANBAN_POPUP_RUNTIME_KEYS = new Set([
  'uid',
  'pageModelClass',
  'collectionName',
  'dataSourceKey',
  'associationName',
  'filterByTk',
  'sourceId',
  'template',
  'popupTemplateUid',
  'popupTemplateContext',
  'popupTemplateMode',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
]);
const EXPORTED_ACTION_PANEL_BLOCK_PROP_KEYS = new Set(['layout', 'ellipsis']);
const EXPORTED_JS_BLOCK_DECORATOR_PROP_KEYS = new Set(['title', 'description']);
const EXPORTED_TREE_BLOCK_SETTING_PATHS = [
  'searchable.searchable',
  'defaultExpandAll.defaultExpandAll',
  'includeDescendants.includeDescendants',
  'titleField.titleField',
  ...EXPORTED_DATA_BLOCK_SETTING_PATHS,
];
const EXPORTED_BLOCK_CARD_SETTING_PATHS = [
  'titleDescription.title',
  'titleDescription.description',
  'blockHeight.height',
  'blockHeight.heightMode',
  'linkageRules.value',
];
const EXPORTED_SIMPLE_BLOCK_SETTING_PATHS_BY_TYPE: Record<string, readonly string[]> = {
  markdown: ['editMarkdown.content'],
  jsBlock: ['runJs.code', 'runJs.version'],
  iframe: ['editIframe'],
};
const EXPORTED_BLOCK_STEP_PARAM_PATHS_BY_GROUP: Record<string, readonly string[]> = {
  resourceSettings: EXPORTED_RESOURCE_SETTING_PATHS,
  TriggerChildPageSettings: EXPORTED_RESOURCE_SETTING_PATHS,
  ApprovalChildPageSettings: EXPORTED_RESOURCE_SETTING_PATHS,
  tableSettings: EXPORTED_DATA_BLOCK_SETTING_PATHS,
  formModelSettings: ['dataScope.filter.*', 'defaultSorting.sort', 'pageSize.pageSize', 'linkageRules.value'],
  detailsSettings: ['dataScope.filter.*', 'defaultSorting.sort', 'pageSize.pageSize', 'linkageRules.value'],
  formFilterBlockModelSettings: ['dataScope.filter.*', 'defaultSorting.sort', 'pageSize.pageSize'],
  listSettings: EXPORTED_LIST_BLOCK_SETTING_PATHS,
  GridCardSettings: EXPORTED_GRID_CARD_BLOCK_SETTING_PATHS,
  calendarSettings: EXPORTED_CALENDAR_SETTING_PATHS,
  kanbanSettings: EXPORTED_KANBAN_BLOCK_SETTING_PATHS,
  treeSettings: EXPORTED_TREE_BLOCK_SETTING_PATHS,
  commentsSettings: ['dataScope.filter.*', 'pageSize.pageSize'],
  actionPanelBlockSetting: EXPORTED_ACTION_PANEL_BLOCK_SETTING_PATHS,
  recordHistorySettings: EXPORTED_RECORD_HISTORY_BLOCK_SETTING_PATHS,
  cardSettings: EXPORTED_BLOCK_CARD_SETTING_PATHS,
  chartSettings: ['configure.*'],
};
const EXPORTED_TABLE_COLUMN_SETTING_PATHS = [
  'title.title',
  'tooltip.tooltip',
  'width.width',
  'fixed.fixed',
  'sorter.sorter',
  'quickEdit.editable',
  'fieldNames.label',
  'linkageRules.value',
];
const EXPORTED_DETAIL_ITEM_SETTING_PATHS = [
  'showLabel.showLabel',
  'label.title',
  'tooltip.tooltip',
  'description.description',
  'fieldNames.label',
  'linkageRules.value',
];
const EXPORTED_EDIT_ITEM_SETTING_PATHS = [
  'showLabel.showLabel',
  'label.label',
  'tooltip.tooltip',
  'description.description',
  'initialValue.defaultValue',
  'required.required',
  'pattern.pattern',
  'titleField.label',
  'linkageRules.value',
];
const EXPORTED_FILTER_FORM_ITEM_SETTING_PATHS = [
  'showLabel.showLabel',
  'label.label',
  'tooltip.tooltip',
  'description.description',
  'initialValue.defaultValue',
];
const EXPORTED_JS_FIELD_SETTING_PATHS = ['runJs.code', 'runJs.version'];
const EXPORTED_FIELD_DECORATOR_PROP_KEYS = new Set(['labelWidth', 'labelWrap']);
const TABLE_FIELD_PUBLIC_PROP_KEYS = new Set([
  'title',
  'tooltip',
  'width',
  'fixed',
  'sorter',
  'editable',
  'dataIndex',
  'titleField',
]);
const FORM_FIELD_PUBLIC_PROP_KEYS = new Set([
  'label',
  'tooltip',
  'extra',
  'showLabel',
  'initialValue',
  'required',
  'rules',
  'disabled',
  'multiple',
  'allowMultiple',
  'maxCount',
  'pattern',
  'titleField',
  'name',
]);
const DETAIL_FIELD_PUBLIC_PROP_KEYS = new Set([
  'label',
  'tooltip',
  'extra',
  'showLabel',
  'disabled',
  'pattern',
  'titleField',
]);
const FILTER_FIELD_PUBLIC_PROP_KEYS = new Set([
  'label',
  'tooltip',
  'extra',
  'showLabel',
  'initialValue',
  'multiple',
  'allowMultiple',
  'maxCount',
  'name',
]);
const FIELD_PUBLIC_PROP_KEYS_BY_USE: Record<string, ReadonlySet<string>> = {
  TableColumnModel: TABLE_FIELD_PUBLIC_PROP_KEYS,
  FormItemModel: FORM_FIELD_PUBLIC_PROP_KEYS,
  PatternFormItemModel: FORM_FIELD_PUBLIC_PROP_KEYS,
  DetailsItemModel: DETAIL_FIELD_PUBLIC_PROP_KEYS,
  ApprovalDetailsItemModel: DETAIL_FIELD_PUBLIC_PROP_KEYS,
  ApplyTaskCardDetailsItemModel: DETAIL_FIELD_PUBLIC_PROP_KEYS,
  ApprovalTaskCardDetailsItemModel: DETAIL_FIELD_PUBLIC_PROP_KEYS,
  FormAssociationItemModel: DETAIL_FIELD_PUBLIC_PROP_KEYS,
  FilterFormItemModel: FILTER_FIELD_PUBLIC_PROP_KEYS,
};
const REACTION_CONTEXT_SCALAR_PATHS = new Set(['role', 'locale', 'token', 'deviceType']);
const REACTION_CONTEXT_ROOT_PATHS = new Set([
  'user',
  'collection',
  'formValues',
  'record',
  'item',
  'popup',
  'urlSearchParams',
]);
const FIELD_TYPES_WITH_NESTED_FIELDS = new Set([
  'picker',
  'subForm',
  'subFormList',
  'subDetails',
  'subDetailsList',
  'subTable',
  'popupSubTable',
]);
const REACTION_KIND_TO_BLUEPRINT_TYPE: Record<
  FlowSurfaceReactionKind,
  'setFieldValueRules' | 'setBlockLinkageRules' | 'setFieldLinkageRules' | 'setActionLinkageRules'
> = {
  fieldValue: 'setFieldValueRules',
  blockLinkage: 'setBlockLinkageRules',
  fieldLinkage: 'setFieldLinkageRules',
  actionLinkage: 'setActionLinkageRules',
};

function isNode(value: unknown): value is FlowSurfaceExportNode {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function castNodeArray(value: unknown): FlowSurfaceExportNode[] {
  return _.castArray(value || []).filter(isNode);
}

function getSubNode(node: FlowSurfaceExportNode | undefined, key: string): FlowSurfaceExportNode | undefined {
  const value = node?.subModels?.[key];
  if (Array.isArray(value)) {
    return value.find(isNode);
  }
  return isNode(value) ? value : undefined;
}

function getSubNodeArray(node: FlowSurfaceExportNode | undefined, key: string): FlowSurfaceExportNode[] {
  return castNodeArray(node?.subModels?.[key]);
}

function readString(value: unknown): string | undefined {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || undefined;
}

function readStringOrNull(value: unknown): string | null | undefined {
  if (_.isNull(value)) {
    return null;
  }
  return readString(value);
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined;
}

function clonePlainObject(value: unknown): Record<string, unknown> | undefined {
  return _.isPlainObject(value) ? _.cloneDeep(value as Record<string, unknown>) : undefined;
}

function cloneArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? _.cloneDeep(value) : undefined;
}

function cloneDefinedValue(value: unknown) {
  return _.isUndefined(value) ? undefined : _.cloneDeep(value);
}

function firstDefined<T>(...values: Array<T | undefined>): T | undefined {
  return values.find((value) => !_.isUndefined(value));
}

function hasOwnValue(value: Record<string, unknown> | undefined, key: string) {
  return !!value && Object.prototype.hasOwnProperty.call(value, key) && !_.isUndefined(value[key]);
}

function getOwnValue(value: Record<string, unknown> | undefined, key: string) {
  return hasOwnValue(value, key) ? _.cloneDeep(value?.[key]) : undefined;
}

function hasNonEmptyPlainObject(value: unknown) {
  return _.isPlainObject(value) && Object.keys(value as Record<string, unknown>).length > 0;
}

function exportTemplateSummary(value: unknown) {
  if (!_.isPlainObject(value)) {
    return undefined;
  }
  const uid = readString((value as Record<string, unknown>).uid);
  const local = readString((value as Record<string, unknown>).local);
  if (!uid && !local) {
    return undefined;
  }
  return buildDefinedPayload({
    uid,
    local,
    mode: readString((value as Record<string, unknown>).mode),
  });
}

function exportPopupSummary(value: unknown): FlowSurfaceApplyBlueprintPopup | undefined {
  if (!_.isPlainObject(value)) {
    return undefined;
  }
  const template = exportTemplateSummary((value as Record<string, unknown>).template);
  return template ? { template } : undefined;
}

function hasUnsupportedTemplateSummary(node: FlowSurfaceExportNode | undefined) {
  const popup = node?.popup;
  const hasUnsupportedBlockTemplate = hasNonEmptyPlainObject(node?.template) && !exportTemplateSummary(node?.template);
  const hasUnsupportedPopupTemplate =
    readString(popup?.mode) === 'copy' || (hasNonEmptyPlainObject(popup?.template) && !exportPopupSummary(popup));
  return hasUnsupportedBlockTemplate || hasNonEmptyPlainObject(node?.fieldsTemplate) || hasUnsupportedPopupTemplate;
}

function templateSummaryManualAction(kind: FlowSurfaceExportBlueprintUnsupportedItem['kind']) {
  if (kind === 'block') {
    return 'Recreate this template-backed block manually or add mapper support.';
  }
  if (kind === 'field') {
    return 'Recreate this template-backed field popup manually or add mapper support.';
  }
  if (kind === 'action' || kind === 'recordAction') {
    return 'Recreate this template-backed action popup manually or add mapper support.';
  }
  return 'Recreate this template-backed surface manually or add mapper support.';
}

function isEmptyPlainContainer(value: unknown): boolean {
  if (_.isUndefined(value) || value === null) {
    return true;
  }
  if (_.isPlainObject(value)) {
    return Object.values(value as Record<string, unknown>).every(isEmptyPlainContainer);
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (!_.isPlainObject(value)) {
    return isEmptyPlainContainer(value) ? [] : [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (isEmptyPlainContainer(child)) {
      return [];
    }
    return collectLeafPaths(child, childPath);
  });
}

function pathMatchesAllowed(candidate: string, allowedPath: string) {
  if (allowedPath.endsWith('.*')) {
    const prefix = allowedPath.slice(0, -2);
    return candidate === prefix || candidate.startsWith(`${prefix}.`);
  }
  return candidate === allowedPath;
}

function hasUnsupportedLeafPath(value: unknown, allowedPaths: readonly string[]) {
  return collectLeafPaths(value).some(
    (path) => !allowedPaths.some((allowedPath) => pathMatchesAllowed(path, allowedPath)),
  );
}

function getPublicStepParamKeys(stepParams: Record<string, unknown>) {
  return Object.keys(stepParams).filter((key) => key !== FLOW_SURFACE_INTERNAL_META_KEY);
}

function buildDefinedPayload<T extends Record<string, unknown>>(input: T): Partial<T> {
  return _.pickBy(input, (value) => !_.isUndefined(value)) as Partial<T>;
}

function getByPath<T = unknown>(node: FlowSurfaceExportNode | undefined, path: string[]): T | undefined {
  return _.get(node, path) as T | undefined;
}

function recordUnsupported(ctx: FlowSurfaceExportBlueprintContext, item: FlowSurfaceExportBlueprintUnsupportedItem) {
  ctx.unsupported.push(item);
  ctx.warnings.push(`${item.path}: ${item.reasonCode} (${item.use || item.type || item.kind})`);
}

function assertNoUnsupported(ctx: FlowSurfaceExportBlueprintContext) {
  if (ctx.unsupportedPolicy !== 'error' || !ctx.unsupported.length) {
    return;
  }
  const first = ctx.unsupported[0];
  throwBadRequest(
    `flowSurfaces exportBlueprint cannot export ${first.kind} '${first.use || first.type || 'unknown'}' at ${
      first.path
    }: ${first.reasonCode}`,
  );
}

function normalizeKeyCandidate(value: string, fallback: string, context: string) {
  const token = normalizeApplyBlueprintToken(value, fallback);
  return normalizeFlowSurfaceComposeKey(token, context);
}

function stripScopePrefix(key: string | undefined, scopePrefix: string) {
  const normalized = String(key || '').trim();
  if (!normalized || !scopePrefix) {
    return normalized;
  }
  const prefix = `${scopePrefix}.`;
  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length);
  }
  if (normalized.includes('.')) {
    return normalized.split('.').filter(Boolean).pop() || normalized;
  }
  return normalized;
}

function getDeclaredKey(node: FlowSurfaceExportNode | undefined, scopePrefix: string) {
  return stripScopePrefix(getDeclaredKeyFromNode(node), scopePrefix);
}

function inferTabDeclaredKeyFromChildren(tab: FlowSurfaceExportNode) {
  const visit = (node: FlowSurfaceExportNode | undefined): string | undefined => {
    const rawKey = getDeclaredKeyFromNode(node);
    if (rawKey?.includes('.')) {
      return rawKey.split('.').filter(Boolean)[0];
    }
    for (const value of Object.values(node?.subModels || {})) {
      for (const child of castNodeArray(value)) {
        const matched = visit(child);
        if (matched) {
          return matched;
        }
      }
    }
    return undefined;
  };
  return visit(tab);
}

function dedupeKey(
  ctx: FlowSurfaceExportBlueprintContext,
  scope: KeyScope,
  candidate: string | undefined,
  fallback: string,
  path: string,
) {
  const normalized = normalizeKeyCandidate(candidate || fallback, fallback, path);
  if (!scope.used.has(normalized)) {
    scope.used.add(normalized);
    return normalized;
  }

  let suffix = 2;
  let next = `${normalized}_${suffix}`;
  while (scope.used.has(next)) {
    suffix += 1;
    next = `${normalized}_${suffix}`;
  }
  scope.used.add(next);
  ctx.warnings.push(`${path}: key '${normalized}' collided; exported as '${next}'`);
  return next;
}

function readPageTitle(page: FlowSurfaceExportNode) {
  return (
    readString(getByPath(page, ['stepParams', 'pageSettings', 'general', 'title'])) || readString(page.props?.title)
  );
}

function exportPage(
  ctx: FlowSurfaceExportBlueprintContext,
  page: FlowSurfaceExportNode,
  pageRoute: Record<string, unknown> | undefined,
): FlowSurfaceApplyBlueprintDocument['page'] {
  if (hasNonEmptyPlainObject(page.flowRegistry)) {
    recordUnsupported(ctx, {
      kind: 'page',
      use: readString(page.use),
      path: '$.page.flowRegistry',
      reasonCode: FLOW_REGISTRY_UNSUPPORTED_REASON,
      manualAction: 'Recreate these event flows manually or add mapper support.',
    });
  }

  const general = getByPath<Record<string, unknown>>(page, ['stepParams', 'pageSettings', 'general']) || {};
  return buildDefinedPayload({
    title: readPageTitle(page),
    icon: readString(general.icon) || readString(page.props?.icon),
    documentTitle: readString(general.documentTitle),
    enableHeader:
      typeof general.enableHeader === 'boolean'
        ? general.enableHeader
        : typeof page.props?.enableHeader === 'boolean'
          ? page.props.enableHeader
          : undefined,
    enableTabs:
      typeof general.enableTabs === 'boolean'
        ? general.enableTabs
        : typeof page.props?.enableTabs === 'boolean'
          ? page.props.enableTabs
          : undefined,
    displayTitle:
      typeof general.displayTitle === 'boolean'
        ? general.displayTitle
        : typeof page.props?.displayTitle === 'boolean'
          ? page.props.displayTitle
          : undefined,
  });
}

function readTabTitle(tab: FlowSurfaceExportNode) {
  return readString(getByPath(tab, ['stepParams', 'pageTabSettings', 'tab', 'title'])) || readString(tab.props?.title);
}

function exportTabChrome(tab: FlowSurfaceExportNode) {
  const tabSettings = getByPath<Record<string, unknown>>(tab, ['stepParams', 'pageTabSettings', 'tab']) || {};
  return buildDefinedPayload({
    title: readTabTitle(tab),
    icon: readString(tabSettings.icon) || readString(tab.props?.icon),
    documentTitle: readString(tabSettings.documentTitle),
  });
}

function readResourceInit(block: FlowSurfaceExportNode) {
  return (
    clonePlainObject(getByPath(block, ['stepParams', 'resourceSettings', 'init'])) ||
    clonePlainObject(getByPath(block, ['stepParams', 'TriggerChildPageSettings', 'init'])) ||
    clonePlainObject(getByPath(block, ['stepParams', 'ApprovalChildPageSettings', 'init']))
  );
}

function readBlockResourceContext(block: FlowSurfaceExportNode): FlowSurfaceExportResourceContext {
  const resourceInit = readResourceInit(block);
  const collectionName = readString(resourceInit?.collectionName);
  const dataSourceKey = readString(resourceInit?.dataSourceKey) || (collectionName ? 'main' : undefined);
  const associationName = readString(resourceInit?.associationName);
  return buildDefinedPayload({
    dataSourceKey,
    collectionName,
    associationName,
  });
}

function exportBlockResource(block: FlowSurfaceExportNode) {
  const resourceInit = readResourceInit(block);
  if (!resourceInit) {
    return {};
  }

  const dataSourceKey = readString(resourceInit.dataSourceKey);
  const collectionName = readString(resourceInit.collectionName);
  const associationName = readString(resourceInit.associationName);
  const associationPathName = readString(resourceInit.associationPathName);
  const sourceId = resourceInit.sourceId;
  const filterByTk = resourceInit.filterByTk;

  if (
    collectionName &&
    (!dataSourceKey || dataSourceKey === 'main') &&
    !associationName &&
    !associationPathName &&
    _.isUndefined(sourceId) &&
    _.isUndefined(filterByTk)
  ) {
    return {
      collection: collectionName,
    };
  }

  return {
    resource: buildDefinedPayload({
      dataSourceKey: dataSourceKey || (collectionName ? 'main' : undefined),
      collectionName,
      associationName,
      associationPathName,
      sourceId,
      filterByTk,
    }),
  };
}

function exportDataBlockSettings(block: FlowSurfaceExportNode, type: string) {
  if (type === 'recordHistory') {
    return {};
  }
  const groupKey = DATA_BLOCK_SETTING_GROUP_BY_TYPE[type];
  if (!groupKey) {
    return {};
  }
  const group = getByPath<Record<string, unknown>>(block, ['stepParams', groupKey]) || {};
  const defaultFilter = clonePlainObject(_.get(group, ['dataScope', 'filter']));
  const sorting = _.cloneDeep(_.get(group, ['defaultSorting', 'sort']));
  const pageSize = _.get(group, ['pageSize', 'pageSize']);
  const settings = buildDefinedPayload({
    sorting: _.isUndefined(sorting) ? undefined : sorting,
    pageSize: typeof pageSize === 'number' ? pageSize : undefined,
  });
  return buildDefinedPayload({
    defaultFilter,
    sorting: _.isUndefined(sorting) ? undefined : sorting,
    pageSize: typeof pageSize === 'number' ? pageSize : undefined,
    settings: Object.keys(settings).length ? settings : undefined,
  });
}

function exportListBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'list') {
    return {};
  }
  const listSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'listSettings']) || {};
  const settings = buildDefinedPayload({
    pageSize: readNumber(_.get(listSettings, ['pageSize', 'pageSize'])),
    sorting: cloneDefinedValue(_.get(listSettings, ['defaultSorting', 'sort'])),
    layout: readString(_.get(listSettings, ['layout', 'layout'])),
  });
  return Object.keys(settings).length ? { settings } : {};
}

function exportGridCardBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'gridCard') {
    return {};
  }
  const gridCardSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'GridCardSettings']) || {};
  const settings = buildDefinedPayload({
    columns: clonePlainObject(_.get(gridCardSettings, ['columnCount', 'columnCount'])),
    rowCount: readNumber(_.get(gridCardSettings, ['rowCount', 'rowCount'])),
    sorting: cloneDefinedValue(_.get(gridCardSettings, ['defaultSorting', 'sort'])),
    layout: readString(_.get(gridCardSettings, ['layout', 'layout'])),
  });
  return Object.keys(settings).length ? { settings } : {};
}

function exportTreeBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'tree') {
    return {};
  }
  const props = block.props || {};
  const treeSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'treeSettings']) || {};
  const settings = buildDefinedPayload({
    searchable:
      typeof props.searchable === 'boolean'
        ? props.searchable
        : typeof _.get(treeSettings, ['searchable', 'searchable']) === 'boolean'
          ? _.get(treeSettings, ['searchable', 'searchable'])
          : undefined,
    defaultExpandAll:
      typeof props.defaultExpandAll === 'boolean'
        ? props.defaultExpandAll
        : typeof _.get(treeSettings, ['defaultExpandAll', 'defaultExpandAll']) === 'boolean'
          ? _.get(treeSettings, ['defaultExpandAll', 'defaultExpandAll'])
          : undefined,
    includeDescendants:
      typeof props.includeDescendants === 'boolean'
        ? props.includeDescendants
        : typeof _.get(treeSettings, ['includeDescendants', 'includeDescendants']) === 'boolean'
          ? _.get(treeSettings, ['includeDescendants', 'includeDescendants'])
          : undefined,
    fieldNames: clonePlainObject(props.fieldNames),
    titleField: readString(_.get(treeSettings, ['titleField', 'titleField'])),
    pageSize:
      typeof props.pageSize === 'number'
        ? props.pageSize
        : typeof _.get(treeSettings, ['pageSize', 'pageSize']) === 'number'
          ? _.get(treeSettings, ['pageSize', 'pageSize'])
          : undefined,
  });

  return Object.keys(settings).length
    ? {
        settings,
      }
    : {};
}

function readBooleanSetting(propValue: unknown, settingValue: unknown) {
  if (typeof propValue === 'boolean') {
    return propValue;
  }
  return typeof settingValue === 'boolean' ? settingValue : undefined;
}

function readNumberSetting(propValue: unknown, settingValue: unknown) {
  if (typeof propValue === 'number') {
    return propValue;
  }
  return typeof settingValue === 'number' ? settingValue : undefined;
}

function readKanbanPopupSetting(block: FlowSurfaceExportNode, key: 'quickCreatePopup' | 'cardPopup') {
  if (key === 'quickCreatePopup') {
    const stepValue = getByPath<Record<string, unknown>>(block, ['stepParams', 'kanbanSettings', 'popup']);
    if (_.isPlainObject(stepValue)) {
      return stepValue;
    }
    const props = block.props || {};
    const propValue = _.isPlainObject(props.quickCreatePopupSettings)
      ? props.quickCreatePopupSettings
      : buildDefinedPayload({
          mode: props.popupMode,
          size: props.popupSize,
          popupTemplateUid: props.popupTemplateUid,
          pageModelClass: props.popupPageModelClass,
          uid: props.popupTargetUid,
        });
    return _.isPlainObject(propValue) ? (propValue as Record<string, unknown>) : undefined;
  }

  const item = getSubNode(block, 'item');
  const stepValue = getByPath<Record<string, unknown>>(item, ['stepParams', 'cardSettings', 'popup']);
  if (_.isPlainObject(stepValue)) {
    return stepValue;
  }
  const props = item?.props || {};
  const propValue = _.isPlainObject(props.cardPopupSettings)
    ? props.cardPopupSettings
    : buildDefinedPayload({
        mode: props.openMode,
        size: props.popupSize,
        popupTemplateUid: props.popupTemplateUid,
        pageModelClass: props.pageModelClass,
        uid: props.popupTargetUid,
      });
  return _.isPlainObject(propValue) ? (propValue as Record<string, unknown>) : undefined;
}

function exportKanbanPopupSetting(block: FlowSurfaceExportNode, key: 'quickCreatePopup' | 'cardPopup') {
  const value = readKanbanPopupSetting(block, key);
  if (!value) {
    return undefined;
  }
  const exported = buildDefinedPayload({
    mode: readString(value.mode),
    size: readString(value.size),
    title: readString(value.title),
    tryTemplate: readBoolean(value.tryTemplate),
    defaultType: readString(value.defaultType),
  });
  return Object.keys(exported).length ? exported : undefined;
}

function exportKanbanBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'kanban') {
    return {};
  }
  const props = block.props || {};
  const kanbanSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'kanbanSettings']) || {};
  const item = getSubNode(block, 'item');
  const itemProps = item?.props || {};
  const itemCardSettings = getByPath<Record<string, unknown>>(item, ['stepParams', 'cardSettings']) || {};
  const styleVariant = readString(_.get(kanbanSettings, ['styleVariant', 'styleVariant']));
  const settings = buildDefinedPayload({
    groupField: readString(_.get(kanbanSettings, ['grouping', 'groupField'])) || readString(props.groupField),
    groupTitleField: _.has(kanbanSettings, ['grouping', 'groupTitleField'])
      ? readStringOrNull(_.get(kanbanSettings, ['grouping', 'groupTitleField']))
      : readStringOrNull(props.groupTitleField),
    groupColorField: _.has(kanbanSettings, ['grouping', 'groupColorField'])
      ? readStringOrNull(_.get(kanbanSettings, ['grouping', 'groupColorField']))
      : readStringOrNull(props.groupColorField),
    groupOptions: firstDefined(
      cloneArray(_.get(kanbanSettings, ['grouping', 'groupOptions'])),
      cloneArray(props.groupOptions),
    ),
    styleVariant:
      styleVariant ||
      (readString(props.styleVariant) === 'color'
        ? 'filled'
        : readString(props.styleVariant) === 'default'
          ? 'default'
          : undefined),
    sorting: firstDefined(
      cloneDefinedValue(_.get(kanbanSettings, ['defaultSorting', 'sort'])),
      cloneDefinedValue(props.globalSort),
    ),
    dragEnabled: readBooleanSetting(props.dragEnabled, _.get(kanbanSettings, ['dragEnabled', 'dragEnabled'])),
    dragSortBy: firstDefined(
      readStringOrNull(_.get(kanbanSettings, ['dragSortBy', 'dragSortBy'])),
      readStringOrNull(props.dragSortBy),
    ),
    quickCreateEnabled: readBooleanSetting(
      props.quickCreateEnabled,
      _.get(kanbanSettings, ['quickCreate', 'quickCreateEnabled']),
    ),
    quickCreatePopup: exportKanbanPopupSetting(block, 'quickCreatePopup'),
    enableCardClick: readBooleanSetting(
      itemProps.enableCardClick,
      _.get(itemCardSettings, ['click', 'enableCardClick']),
    ),
    cardPopup: exportKanbanPopupSetting(block, 'cardPopup'),
    cardLayout: readString(itemProps.layout) || readString(_.get(itemCardSettings, ['layout', 'layout'])),
    cardLabelAlign: readString(itemProps.labelAlign) || readString(_.get(itemCardSettings, ['layout', 'labelAlign'])),
    cardLabelWidth: firstDefined(
      readStringOrNull(itemProps.labelWidth),
      readStringOrNull(_.get(itemCardSettings, ['layout', 'labelWidth'])),
    ),
    cardLabelWrap: readBooleanSetting(itemProps.labelWrap, _.get(itemCardSettings, ['layout', 'labelWrap'])),
    cardColon: readBooleanSetting(itemProps.colon, _.get(itemCardSettings, ['layout', 'colon'])),
    pageSize: readNumberSetting(props.pageSize, _.get(kanbanSettings, ['pageSize', 'pageSize'])),
    columnWidth: readNumberSetting(props.columnWidth, _.get(kanbanSettings, ['columnWidth', 'columnWidth'])),
  });
  return Object.keys(settings).length ? { settings } : {};
}

function readCalendarPopupSetting(
  block: FlowSurfaceExportNode,
  key: 'quickCreatePopupSettings' | 'eventPopupSettings',
) {
  const stepValue = getByPath<Record<string, unknown>>(block, ['stepParams', 'calendarSettings', key]);
  if (_.isPlainObject(stepValue)) {
    return stepValue;
  }
  const propValue = block.props?.[key];
  return _.isPlainObject(propValue) ? (propValue as Record<string, unknown>) : undefined;
}

function exportCalendarPopupSetting(
  block: FlowSurfaceExportNode,
  key: 'quickCreatePopupSettings' | 'eventPopupSettings',
) {
  const value = readCalendarPopupSetting(block, key);
  if (!value) {
    return undefined;
  }
  const exported = buildDefinedPayload({
    mode: readString(value.mode),
    size: readString(value.size),
    title: readString(value.title),
    tryTemplate: typeof value.tryTemplate === 'boolean' ? value.tryTemplate : undefined,
    defaultType: readString(value.defaultType),
  });
  return Object.keys(exported).length ? exported : undefined;
}

function hasUnsupportedCalendarPopupSetting(
  block: FlowSurfaceExportNode,
  key: 'quickCreatePopupSettings' | 'eventPopupSettings',
) {
  const value = readCalendarPopupSetting(block, key);
  if (!value) {
    return false;
  }
  return Object.keys(value).some((itemKey) => {
    const child = value[itemKey];
    if (_.isUndefined(child)) {
      return false;
    }
    return !EXPORTED_CALENDAR_POPUP_KEYS.has(itemKey) && !IGNORED_CALENDAR_POPUP_RUNTIME_KEYS.has(itemKey);
  });
}

function exportCalendarBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'calendar') {
    return {};
  }
  const props = block.props || {};
  const fieldNames = _.isPlainObject(props.fieldNames) ? (props.fieldNames as Record<string, unknown>) : {};
  const calendarSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'calendarSettings']) || {};
  const settings = buildDefinedPayload({
    titleField: readString(fieldNames.title) || readString(_.get(calendarSettings, ['titleField', 'titleField'])),
    colorField:
      readString(fieldNames.colorFieldName) || readString(_.get(calendarSettings, ['colorField', 'colorFieldName'])),
    startField: readString(fieldNames.start) || readString(_.get(calendarSettings, ['startDateField', 'start'])),
    endField: readString(fieldNames.end) || readString(_.get(calendarSettings, ['endDateField', 'end'])),
    defaultView: readString(props.defaultView) || readString(_.get(calendarSettings, ['defaultView', 'defaultView'])),
    quickCreateEvent: readBooleanSetting(
      props.enableQuickCreateEvent,
      _.get(calendarSettings, ['quickCreateEvent', 'enableQuickCreateEvent']),
    ),
    showLunar: readBooleanSetting(props.showLunar, _.get(calendarSettings, ['showLunar', 'showLunar'])),
    weekStart: readNumberSetting(props.weekStart, _.get(calendarSettings, ['weekStart', 'weekStart'])),
    quickCreatePopup: exportCalendarPopupSetting(block, 'quickCreatePopupSettings'),
    eventPopup: exportCalendarPopupSetting(block, 'eventPopupSettings'),
  });

  return Object.keys(settings).length
    ? {
        settings,
      }
    : {};
}

function exportActionPanelBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'actionPanel') {
    return {};
  }
  const props = block.props || {};
  const group = getByPath<Record<string, unknown>>(block, ['stepParams', 'actionPanelBlockSetting']) || {};
  const settings = buildDefinedPayload({
    layout: readString(props.layout) || readString(_.get(group, ['layout', 'layout'])),
    ellipsis: readBooleanSetting(props.ellipsis, _.get(group, ['ellipsis', 'ellipsis'])),
  });
  return Object.keys(settings).length ? { settings } : {};
}

function exportRecordHistoryBlockSettings(block: FlowSurfaceExportNode) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'recordHistory') {
    return {};
  }
  const group = getByPath<Record<string, unknown>>(block, ['stepParams', 'recordHistorySettings']) || {};
  const settings = buildDefinedPayload({
    sortOrder: clonePlainObject(_.get(group, ['sortOrder'])),
    dataScope: clonePlainObject(_.get(group, ['dataScope', 'filter'])),
    expand: clonePlainObject(_.get(group, ['expand'])),
    template: clonePlainObject(_.get(group, ['template'])),
  });
  return Object.keys(settings).length ? { settings } : {};
}

function createChartAssetKey(ctx: FlowSurfaceExportBlueprintContext, publicKey: string) {
  const base = normalizeApplyBlueprintToken(publicKey, 'chart');
  let candidate = base;
  let index = 2;
  while (Object.prototype.hasOwnProperty.call(ctx.chartAssets, candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }
  return candidate;
}

function exportChartBlockSettings(
  ctx: FlowSurfaceExportBlueprintContext,
  block: FlowSurfaceExportNode,
  publicKey: string,
  path: string,
) {
  if (BLOCK_KEY_BY_USE.get(String(block.use || '')) !== 'chart') {
    return {};
  }
  const configure = clonePlainObject(getByPath(block, ['stepParams', 'chartSettings', 'configure']));
  const semanticState = deriveChartSemanticState(configure);
  if (!semanticState.query || !semanticState.visual) {
    recordUnsupported(ctx, {
      kind: 'block',
      use: readString(block.use),
      type: 'chart',
      path: `${path}.settings`,
      reasonCode: 'unsupported-chart-configure',
      manualAction: 'Recreate this chart configuration manually or add mapper support.',
    });
    return null;
  }

  const assetKey = createChartAssetKey(ctx, publicKey);
  ctx.chartAssets[assetKey] = buildDefinedPayload({
    query: semanticState.query,
    visual: semanticState.visual,
    events: semanticState.events,
  }) as Record<string, unknown>;
  return {
    chart: assetKey,
  };
}

function exportCardSettings(block: FlowSurfaceExportNode) {
  const cardSettings = getByPath<Record<string, unknown>>(block, ['stepParams', 'cardSettings']) || {};
  const titleDescription = _.get(cardSettings, ['titleDescription']) as Record<string, unknown> | undefined;
  const blockHeight = _.get(cardSettings, ['blockHeight']) as Record<string, unknown> | undefined;
  return buildDefinedPayload({
    title: readString(titleDescription?.title),
    description: readString(titleDescription?.description),
    height: typeof blockHeight?.height === 'number' ? blockHeight.height : undefined,
    heightMode: readString(blockHeight?.heightMode),
  });
}

function exportSimpleBlockSettings(block: FlowSurfaceExportNode, type: string) {
  if (type === 'markdown') {
    const content =
      readString(getByPath(block, ['stepParams', 'markdownBlockSettings', 'editMarkdown', 'content'])) ||
      readString(block.props?.content) ||
      readString(block.props?.value);
    return content ? { settings: { content } } : {};
  }

  if (type === 'jsBlock') {
    const runJs = clonePlainObject(getByPath(block, ['stepParams', 'jsSettings', 'runJs']));
    return buildDefinedPayload({
      title: readString(block.decoratorProps?.title),
      description: readString(block.decoratorProps?.description),
      settings: runJs,
    });
  }

  if (type === 'iframe') {
    const editIframe = clonePlainObject(getByPath(block, ['stepParams', 'iframeBlockSettings', 'editIframe']));
    return editIframe ? { settings: editIframe } : {};
  }

  return {};
}

function getAllowedBlockStepParamPaths(type: string, groupKey: string): readonly string[] | undefined {
  if (groupKey === 'eventSettings') {
    return ['linkageRules.value'];
  }
  const simpleBlockSettings = EXPORTED_SIMPLE_BLOCK_SETTING_PATHS_BY_TYPE[type];
  if (
    (type === 'markdown' && groupKey === 'markdownBlockSettings') ||
    (type === 'jsBlock' && groupKey === 'jsSettings') ||
    (type === 'iframe' && groupKey === 'iframeBlockSettings')
  ) {
    return simpleBlockSettings || [];
  }
  return EXPORTED_BLOCK_STEP_PARAM_PATHS_BY_GROUP[groupKey];
}

function hasUnsupportedBlockProps(block: FlowSurfaceExportNode, type: string) {
  const props = block.props || {};
  const propKeys = Object.keys(props).filter((key) => !_.isUndefined(props[key]));
  if (!propKeys.length) {
    return false;
  }
  if (type === 'markdown') {
    return propKeys.some((key) => key !== 'content' && key !== 'value');
  }
  if (type === 'tree') {
    return propKeys.some((key) => !EXPORTED_TREE_BLOCK_PROP_KEYS.has(key));
  }
  if (type === 'calendar') {
    return propKeys.some((key) => !EXPORTED_CALENDAR_BLOCK_PROP_KEYS.has(key));
  }
  if (type === 'kanban') {
    return propKeys.some((key) => !EXPORTED_KANBAN_BLOCK_PROP_KEYS.has(key));
  }
  if (type === 'actionPanel') {
    return propKeys.some((key) => !EXPORTED_ACTION_PANEL_BLOCK_PROP_KEYS.has(key));
  }
  if (type === 'jsBlock') {
    return false;
  }
  return true;
}

function hasUnsupportedKanbanPopupSetting(block: FlowSurfaceExportNode, key: 'quickCreatePopup' | 'cardPopup') {
  const value = readKanbanPopupSetting(block, key);
  if (!value) {
    return false;
  }
  return Object.keys(value).some((itemKey) => {
    const child = value[itemKey];
    if (_.isUndefined(child)) {
      return false;
    }
    return !EXPORTED_KANBAN_POPUP_KEYS.has(itemKey) && !IGNORED_KANBAN_POPUP_RUNTIME_KEYS.has(itemKey);
  });
}

function hasUnsupportedKanbanItemPublicState(block: FlowSurfaceExportNode) {
  const item = getSubNode(block, 'item');
  if (!item) {
    return false;
  }
  if (hasNonEmptyPlainObject(item.flowRegistry)) {
    return true;
  }
  const props = item.props || {};
  const propKeys = Object.keys(props).filter((key) => !_.isUndefined(props[key]));
  if (propKeys.some((key) => !EXPORTED_KANBAN_CARD_ITEM_PROP_KEYS.has(key))) {
    return true;
  }
  return Object.entries(item.stepParams || {}).some(([groupKey, groupValue]) => {
    if (groupKey === FLOW_SURFACE_INTERNAL_META_KEY || isEmptyPlainContainer(groupValue)) {
      return false;
    }
    if (groupKey !== 'cardSettings') {
      return true;
    }
    return hasUnsupportedLeafPath(groupValue, EXPORTED_KANBAN_CARD_ITEM_SETTING_PATHS);
  });
}

function hasUnsupportedJsBlockDecoratorProps(block: FlowSurfaceExportNode) {
  const decoratorProps = block.decoratorProps || {};
  return Object.keys(decoratorProps).some((key) => {
    const value = decoratorProps[key];
    if (_.isUndefined(value)) {
      return false;
    }
    if (EXPORTED_JS_BLOCK_DECORATOR_PROP_KEYS.has(key)) {
      return false;
    }
    if (key === 'className') {
      return !!readString(value);
    }
    return true;
  });
}

function hasUnsupportedBlockPublicState(block: FlowSurfaceExportNode, type: string) {
  if (hasNonEmptyPlainObject(block.flowRegistry)) {
    return true;
  }
  if (hasUnsupportedBlockProps(block, type)) {
    return true;
  }
  if (
    type === 'calendar' &&
    (hasUnsupportedCalendarPopupSetting(block, 'quickCreatePopupSettings') ||
      hasUnsupportedCalendarPopupSetting(block, 'eventPopupSettings'))
  ) {
    return true;
  }
  if (
    type === 'kanban' &&
    (hasUnsupportedKanbanPopupSetting(block, 'quickCreatePopup') ||
      hasUnsupportedKanbanPopupSetting(block, 'cardPopup') ||
      hasUnsupportedKanbanItemPublicState(block))
  ) {
    return true;
  }
  if (type === 'jsBlock' && hasUnsupportedJsBlockDecoratorProps(block)) {
    return true;
  }
  return Object.entries(block.stepParams || {}).some(([groupKey, groupValue]) => {
    if (groupKey === FLOW_SURFACE_INTERNAL_META_KEY || isEmptyPlainContainer(groupValue)) {
      return false;
    }
    const allowedPaths = getAllowedBlockStepParamPaths(type, groupKey);
    if (!allowedPaths) {
      return true;
    }
    return hasUnsupportedLeafPath(groupValue, allowedPaths);
  });
}

function readFieldInit(fieldHost: FlowSurfaceExportNode) {
  return (
    clonePlainObject(getByPath(fieldHost, ['stepParams', 'fieldSettings', 'init'])) ||
    clonePlainObject(getByPath(getSubNode(fieldHost, 'field'), ['stepParams', 'fieldSettings', 'init']))
  );
}

function readFieldPath(fieldHost: FlowSurfaceExportNode) {
  return readString(readFieldInit(fieldHost)?.fieldPath);
}

function collectFieldBindingUids(fieldHost: FlowSurfaceExportNode) {
  return _.uniq(compactStringValues([fieldHost.uid, getSubNode(fieldHost, 'field')?.uid]));
}

function collectNestedFieldHostCandidates(fieldHost: FlowSurfaceExportNode, rootFieldPath: string) {
  const candidates: FlowSurfaceExportNode[] = [];
  const seenFieldPaths = new Set<string>();

  const visit = (node: FlowSurfaceExportNode | undefined) => {
    if (!node) {
      return;
    }
    const fieldPath = readFieldPath(node);
    if (fieldPath && fieldPath !== rootFieldPath && !seenFieldPaths.has(fieldPath)) {
      seenFieldPaths.add(fieldPath);
      candidates.push(node);
    }
    Object.values(node.subModels || {}).forEach((value) => {
      castNodeArray(value).forEach((child) => visit(child));
    });
  };

  Object.values(fieldHost.subModels || {}).forEach((value) => {
    castNodeArray(value).forEach((child) => visit(child));
  });
  return candidates;
}

function collectExportableNestedRelationFields(
  ctx: FlowSurfaceExportBlueprintContext,
  fieldHost: FlowSurfaceExportNode,
  rootFieldPath: string,
  path: string,
) {
  const fields: string[] = [];
  const fieldPaths: string[] = [];
  const candidates = collectNestedFieldHostCandidates(fieldHost, rootFieldPath);

  candidates.forEach((candidate, index) => {
    const fieldPath = readFieldPath(candidate);
    const relativeFieldPath = fieldPath?.startsWith(`${rootFieldPath}.`)
      ? fieldPath.slice(rootFieldPath.length + 1)
      : fieldPath;
    if (!fieldPath || !relativeFieldPath) {
      return;
    }
    const unsupportedReason = hasUnsupportedTemplateSummary(candidate)
      ? TEMPLATE_SUMMARY_UNSUPPORTED_REASON
      : isExportableNestedRelationField(candidate, relativeFieldPath)
        ? undefined
        : 'unsupported-node';
    if (unsupportedReason) {
      recordUnsupported(ctx, {
        kind: 'field',
        use: readString(candidate.use),
        path: `${path}[${index}]`,
        reasonCode: unsupportedReason,
        manualAction:
          unsupportedReason === TEMPLATE_SUMMARY_UNSUPPORTED_REASON
            ? templateSummaryManualAction('field')
            : UNSUPPORTED_MANUAL_ACTION,
      });
      return;
    }
    fields.push(relativeFieldPath);
    fieldPaths.push(fieldPath);
  });

  return {
    fields: _.uniq(fields),
    fieldPaths: _.uniq(fieldPaths),
  };
}

const DEFAULT_RELATION_OPEN_VIEW_SOURCE_ID = '{{ctx.view.inputArgs.sourceId}}';
const DEFAULT_RELATION_OPEN_VIEW_FILTER_BY_TK = '{{ctx.view.inputArgs.filterByTk}}';
const DEFAULT_RELATION_OPEN_VIEW_KEYS = new Set([
  'dataSourceKey',
  'collectionName',
  'associationName',
  'sourceId',
  'filterByTk',
]);

function isDefaultRelationOpenViewValue(key: string, value: unknown) {
  if (key === 'sourceId') {
    return _.isUndefined(value) || value === DEFAULT_RELATION_OPEN_VIEW_SOURCE_ID;
  }
  if (key === 'filterByTk') {
    return _.isUndefined(value) || value === DEFAULT_RELATION_OPEN_VIEW_FILTER_BY_TK;
  }
  return !!readString(value);
}

function isDefaultRelationDisplayOpenView(value: unknown) {
  if (!_.isPlainObject(value)) {
    return false;
  }
  const entries = Object.entries(value as Record<string, unknown>).filter(([, child]) => !_.isUndefined(child));
  if (!entries.length || entries.some(([key]) => !DEFAULT_RELATION_OPEN_VIEW_KEYS.has(key))) {
    return false;
  }
  return entries.every(([key, child]) => isDefaultRelationOpenViewValue(key, child));
}

function isDefaultReferencePopupSummary(value: unknown) {
  if (_.isUndefined(value) || value === null) {
    return true;
  }
  if (!_.isPlainObject(value)) {
    return false;
  }
  const popup = value as Record<string, unknown>;
  if (!Object.keys(popup).length) {
    return true;
  }
  const template = popup.template;
  if (Object.keys(popup).some((key) => key !== 'template') || !_.isPlainObject(template)) {
    return false;
  }
  const templateValue = template as Record<string, unknown>;
  return (
    Object.keys(templateValue).every((key) => key === 'uid' || key === 'mode') &&
    !!readString(templateValue.uid) &&
    readString(templateValue.mode) === 'reference'
  );
}

function isDefaultRelationDisplayClickToOpenState(innerField: FlowSurfaceExportNode) {
  return (
    innerField.use === 'DisplayTextFieldModel' &&
    getByPath(innerField, ['stepParams', 'displayFieldSettings', 'clickToOpen', 'clickToOpen']) === true &&
    isDefaultRelationDisplayOpenView(getByPath(innerField, ['stepParams', 'popupSettings', 'openView'])) &&
    isDefaultReferencePopupSummary(innerField.popup)
  );
}

function hasUnsupportedFieldHostProps(fieldHost: FlowSurfaceExportNode) {
  const props = fieldHost.props;
  const propKeys = Object.keys(props || {}).filter((key) => !_.isUndefined(props?.[key]));
  if (!propKeys.length) {
    return false;
  }
  const allowedKeys = FIELD_PUBLIC_PROP_KEYS_BY_USE[String(fieldHost.use || '')] || new Set<string>();
  return propKeys.some((key) => {
    if (key === 'titleField') {
      return props?.[key] !== null && typeof props?.[key] !== 'string';
    }
    return !allowedKeys.has(key);
  });
}

function hasUnsupportedFieldDecoratorProps(fieldHost: FlowSurfaceExportNode) {
  const decoratorProps = fieldHost.decoratorProps;
  const propKeys = Object.keys(decoratorProps || {}).filter((key) => !_.isUndefined(decoratorProps?.[key]));
  if (!propKeys.length) {
    return false;
  }
  if (fieldHost.use === 'TableColumnModel') {
    return true;
  }
  return propKeys.some((key) => !EXPORTED_FIELD_DECORATOR_PROP_KEYS.has(key));
}

function hasUnsupportedInnerFieldProps(
  innerField: FlowSurfaceExportNode,
  options: { allowDefaultClickToOpen?: boolean } = {},
) {
  const props = innerField.props;
  const propKeys = Object.keys(props || {}).filter((key) => !_.isUndefined(props?.[key]));
  if (!propKeys.length) {
    return false;
  }
  return propKeys.some((key) => {
    if (key === 'titleField') {
      return props?.[key] !== null && typeof props?.[key] !== 'string';
    }
    if (key === 'clickToOpen' && options.allowDefaultClickToOpen) {
      return props?.[key] !== true;
    }
    return true;
  });
}

function hasUnsupportedFieldStepParams(fieldHost: FlowSurfaceExportNode) {
  const stepParams = fieldHost.stepParams || {};
  return Object.entries(stepParams).some(([groupKey, groupValue]) => {
    if (groupKey === FLOW_SURFACE_INTERNAL_META_KEY || isEmptyPlainContainer(groupValue)) {
      return false;
    }
    if (!BASIC_FIELD_STEP_PARAM_GROUPS.has(groupKey)) {
      return true;
    }
    if (groupKey === 'fieldSettings') {
      return hasUnsupportedLeafPath(groupValue, [
        'init.dataSourceKey',
        'init.collectionName',
        'init.associationName',
        'init.associationPathName',
        'init.sourceId',
        'init.filterByTk',
        'init.fieldPath',
        'fieldType',
      ]);
    }
    if (groupKey === 'tableColumnSettings') {
      return hasUnsupportedLeafPath(groupValue, EXPORTED_TABLE_COLUMN_SETTING_PATHS);
    }
    if (groupKey === 'detailItemSettings') {
      return hasUnsupportedLeafPath(groupValue, EXPORTED_DETAIL_ITEM_SETTING_PATHS);
    }
    if (groupKey === 'editItemSettings') {
      return hasUnsupportedLeafPath(groupValue, EXPORTED_EDIT_ITEM_SETTING_PATHS);
    }
    if (groupKey === 'filterFormItemSettings') {
      return hasUnsupportedLeafPath(groupValue, EXPORTED_FILTER_FORM_ITEM_SETTING_PATHS);
    }
    if (groupKey === 'jsSettings') {
      return (
        (fieldHost.use !== 'JSColumnModel' && fieldHost.use !== 'JSItemModel' && !isEmptyPlainContainer(groupValue)) ||
        hasUnsupportedLeafPath(groupValue, EXPORTED_JS_FIELD_SETTING_PATHS)
      );
    }
    return true;
  });
}

function hasUnsupportedFieldPublicState(fieldHost: FlowSurfaceExportNode) {
  if (hasNonEmptyPlainObject(fieldHost.flowRegistry)) {
    return true;
  }
  if (hasUnsupportedFieldHostProps(fieldHost)) {
    return true;
  }
  if (hasUnsupportedFieldDecoratorProps(fieldHost)) {
    return true;
  }
  if (hasUnsupportedFieldStepParams(fieldHost)) {
    return true;
  }
  const innerField = getSubNode(fieldHost, 'field');
  if (innerField) {
    if (hasNonEmptyPlainObject(innerField.flowRegistry)) {
      return true;
    }
    if (
      hasUnsupportedInnerFieldProps(innerField, {
        allowDefaultClickToOpen: isDefaultRelationDisplayClickToOpenState(innerField),
      })
    ) {
      return true;
    }
  }
  return false;
}

function readLastFieldPathSegment(fieldPath: string) {
  const segments = fieldPath.split('.').filter(Boolean);
  return segments[segments.length - 1];
}

function hasUnsupportedNestedFieldHostProps(props: Record<string, unknown> | undefined, relativeFieldPath: string) {
  const propKeys = Object.keys(props || {}).filter((key) => !_.isUndefined(props?.[key]));
  if (!propKeys.length) {
    return false;
  }
  const defaultLabel = readLastFieldPathSegment(relativeFieldPath);
  return propKeys.some((key) => {
    if (key === 'label') {
      return props?.[key] !== defaultLabel;
    }
    return true;
  });
}

function hasUnsupportedNestedInnerFieldProps(innerField: FlowSurfaceExportNode) {
  const props = innerField.props;
  const propKeys = Object.keys(props || {}).filter((key) => !_.isUndefined(props?.[key]));
  if (!propKeys.length) {
    return false;
  }
  return propKeys.some((key) => {
    if (key === 'allowClear' && innerField.use === 'SelectFieldModel') {
      return props?.[key] !== true;
    }
    return true;
  });
}

function isExportableNestedRelationField(candidate: FlowSurfaceExportNode, relativeFieldPath: string) {
  if (hasNonEmptyPlainObject(candidate.flowRegistry)) {
    return false;
  }
  if (hasUnsupportedNestedFieldHostProps(candidate.props, relativeFieldPath)) {
    return false;
  }
  if (hasUnsupportedFieldStepParams(candidate)) {
    return false;
  }
  const innerField = getSubNode(candidate, 'field');
  if (!innerField) {
    return true;
  }
  if (hasNonEmptyPlainObject(innerField.flowRegistry)) {
    return false;
  }
  return !hasUnsupportedNestedInnerFieldProps(innerField);
}

function inferExportFieldType(innerField: FlowSurfaceExportNode | undefined) {
  const explicitFieldType = readString(getByPath(innerField, ['stepParams', 'fieldSettings', 'fieldType']));
  if (explicitFieldType) {
    return explicitFieldType;
  }
  const publicFieldType =
    getPublicFieldTypeForUse(readString(getByPath(innerField, ['stepParams', 'fieldBinding', 'use']))) ||
    getPublicFieldTypeForUse(readString(innerField?.use));
  return publicFieldType && FIELD_TYPES_WITH_NESTED_FIELDS.has(publicFieldType) ? publicFieldType : undefined;
}

function readFieldPublicSetting(
  fieldHost: FlowSurfaceExportNode,
  propKey: string,
  stepParamPaths: readonly string[][] = [],
) {
  const propValue = getOwnValue(fieldHost.props, propKey);
  if (!_.isUndefined(propValue)) {
    return propValue;
  }
  for (const stepParamPath of stepParamPaths) {
    const value = getByPath(fieldHost, ['stepParams', ...stepParamPath]);
    if (!_.isUndefined(value)) {
      return _.cloneDeep(value);
    }
  }
  return undefined;
}

function readFieldDecoratorSetting(fieldHost: FlowSurfaceExportNode, propKey: string) {
  return getOwnValue(fieldHost.decoratorProps, propKey);
}

function exportTableFieldPublicSettings(fieldHost: FlowSurfaceExportNode) {
  return {
    settings: buildDefinedPayload({
      title: readFieldPublicSetting(fieldHost, 'title', [['tableColumnSettings', 'title', 'title']]),
      tooltip: readFieldPublicSetting(fieldHost, 'tooltip', [['tableColumnSettings', 'tooltip', 'tooltip']]),
      width: readFieldPublicSetting(fieldHost, 'width', [['tableColumnSettings', 'width', 'width']]),
      fixed: readFieldPublicSetting(fieldHost, 'fixed', [['tableColumnSettings', 'fixed', 'fixed']]),
      sorter: readFieldPublicSetting(fieldHost, 'sorter', [['tableColumnSettings', 'sorter', 'sorter']]),
      editable: readFieldPublicSetting(fieldHost, 'editable', [['tableColumnSettings', 'quickEdit', 'editable']]),
      dataIndex: readFieldPublicSetting(fieldHost, 'dataIndex'),
    }),
  };
}

function exportFormFieldPublicSettings(fieldHost: FlowSurfaceExportNode) {
  const settings = buildDefinedPayload({
    tooltip: readFieldPublicSetting(fieldHost, 'tooltip', [['editItemSettings', 'tooltip', 'tooltip']]),
    extra: readFieldPublicSetting(fieldHost, 'extra', [['editItemSettings', 'description', 'description']]),
    showLabel: readFieldPublicSetting(fieldHost, 'showLabel', [['editItemSettings', 'showLabel', 'showLabel']]),
    initialValue: readFieldPublicSetting(fieldHost, 'initialValue', [
      ['editItemSettings', 'initialValue', 'defaultValue'],
    ]),
    required: readFieldPublicSetting(fieldHost, 'required', [['editItemSettings', 'required', 'required']]),
    rules: readFieldPublicSetting(fieldHost, 'rules'),
    disabled: readFieldPublicSetting(fieldHost, 'disabled'),
    multiple: readFieldPublicSetting(fieldHost, 'multiple'),
    allowMultiple: readFieldPublicSetting(fieldHost, 'allowMultiple'),
    maxCount: readFieldPublicSetting(fieldHost, 'maxCount'),
    pattern: readFieldPublicSetting(fieldHost, 'pattern', [['editItemSettings', 'pattern', 'pattern']]),
    name: readFieldPublicSetting(fieldHost, 'name'),
    labelWidth: readFieldDecoratorSetting(fieldHost, 'labelWidth'),
    labelWrap: readFieldDecoratorSetting(fieldHost, 'labelWrap'),
  });
  return buildDefinedPayload({
    label: readString(readFieldPublicSetting(fieldHost, 'label', [['editItemSettings', 'label', 'label']])),
    settings: Object.keys(settings).length ? settings : undefined,
  });
}

function exportDetailFieldPublicSettings(fieldHost: FlowSurfaceExportNode) {
  const settings = buildDefinedPayload({
    tooltip: readFieldPublicSetting(fieldHost, 'tooltip', [['detailItemSettings', 'tooltip', 'tooltip']]),
    extra: readFieldPublicSetting(fieldHost, 'extra', [['detailItemSettings', 'description', 'description']]),
    showLabel: readFieldPublicSetting(fieldHost, 'showLabel', [['detailItemSettings', 'showLabel', 'showLabel']]),
    disabled: readFieldPublicSetting(fieldHost, 'disabled'),
    pattern: readFieldPublicSetting(fieldHost, 'pattern'),
    labelWidth: readFieldDecoratorSetting(fieldHost, 'labelWidth'),
    labelWrap: readFieldDecoratorSetting(fieldHost, 'labelWrap'),
  });
  return buildDefinedPayload({
    label: readString(readFieldPublicSetting(fieldHost, 'label', [['detailItemSettings', 'label', 'title']])),
    settings: Object.keys(settings).length ? settings : undefined,
  });
}

function exportFilterFieldPublicSettings(fieldHost: FlowSurfaceExportNode) {
  const settings = buildDefinedPayload({
    tooltip: readFieldPublicSetting(fieldHost, 'tooltip', [['filterFormItemSettings', 'tooltip', 'tooltip']]),
    extra: readFieldPublicSetting(fieldHost, 'extra', [['filterFormItemSettings', 'description', 'description']]),
    showLabel: readFieldPublicSetting(fieldHost, 'showLabel', [['filterFormItemSettings', 'showLabel', 'showLabel']]),
    initialValue: readFieldPublicSetting(fieldHost, 'initialValue', [
      ['filterFormItemSettings', 'initialValue', 'defaultValue'],
    ]),
    multiple: readFieldPublicSetting(fieldHost, 'multiple'),
    allowMultiple: readFieldPublicSetting(fieldHost, 'allowMultiple'),
    maxCount: readFieldPublicSetting(fieldHost, 'maxCount'),
    name: readFieldPublicSetting(fieldHost, 'name'),
    labelWidth: readFieldDecoratorSetting(fieldHost, 'labelWidth'),
    labelWrap: readFieldDecoratorSetting(fieldHost, 'labelWrap'),
  });
  return buildDefinedPayload({
    label: readString(readFieldPublicSetting(fieldHost, 'label', [['filterFormItemSettings', 'label', 'label']])),
    settings: Object.keys(settings).length ? settings : undefined,
  });
}

function exportFieldPublicSettings(fieldHost: FlowSurfaceExportNode) {
  switch (fieldHost.use) {
    case 'TableColumnModel':
      return exportTableFieldPublicSettings(fieldHost);
    case 'FormItemModel':
    case 'PatternFormItemModel':
      return exportFormFieldPublicSettings(fieldHost);
    case 'DetailsItemModel':
    case 'ApprovalDetailsItemModel':
    case 'ApplyTaskCardDetailsItemModel':
    case 'ApprovalTaskCardDetailsItemModel':
    case 'FormAssociationItemModel':
      return exportDetailFieldPublicSettings(fieldHost);
    case 'FilterFormItemModel':
      return exportFilterFieldPublicSettings(fieldHost);
    default:
      return {};
  }
}

function exportFieldSettings(fieldHost: FlowSurfaceExportNode, nestedFields?: string[]) {
  if (hasUnsupportedFieldPublicState(fieldHost)) {
    return undefined;
  }

  if (fieldHost.use === 'JSColumnModel' || fieldHost.use === 'JSItemModel') {
    const runJs = clonePlainObject(getByPath(fieldHost, ['stepParams', 'jsSettings', 'runJs']));
    const type = fieldHost.use === 'JSColumnModel' ? 'jsColumn' : 'jsItem';
    return buildDefinedPayload({
      type,
      settings: runJs,
    });
  }

  const init = readFieldInit(fieldHost);
  const fieldPath = readString(init?.fieldPath);
  if (!fieldPath) {
    return undefined;
  }

  const publicSettings = exportFieldPublicSettings(fieldHost);
  const innerField = getSubNode(fieldHost, 'field');
  const fieldType = inferExportFieldType(innerField);
  const titleField =
    readString(getByPath(fieldHost, ['stepParams', 'tableColumnSettings', 'fieldNames', 'label'])) ||
    readString(getByPath(fieldHost, ['stepParams', 'detailItemSettings', 'fieldNames', 'label'])) ||
    readString(getByPath(fieldHost, ['stepParams', 'editItemSettings', 'titleField', 'label'])) ||
    readString(fieldHost.props?.titleField) ||
    readString(innerField?.props?.titleField);
  const popup = exportPopupSummary(fieldHost.popup);

  return buildDefinedPayload({
    field: fieldPath,
    associationPathName: readString(init?.associationPathName),
    fieldType,
    fields:
      fieldType && FIELD_TYPES_WITH_NESTED_FIELDS.has(fieldType) && nestedFields?.length ? nestedFields : undefined,
    label: (publicSettings as { label?: string }).label,
    titleField,
    settings: (publicSettings as { settings?: Record<string, unknown> }).settings,
    popup,
  });
}

function exportFields(
  ctx: FlowSurfaceExportBlueprintContext,
  fieldHosts: FlowSurfaceExportNode[],
  scope: KeyScope,
  path: string,
): FlowSurfaceExportFieldResult[] {
  return fieldHosts.flatMap((fieldHost, index) => {
    const fieldPath = `${path}[${index}]`;
    if (hasUnsupportedTemplateSummary(fieldHost)) {
      recordUnsupported(ctx, {
        kind: 'field',
        use: readString(fieldHost.use),
        path: fieldPath,
        reasonCode: TEMPLATE_SUMMARY_UNSUPPORTED_REASON,
        manualAction: templateSummaryManualAction('field'),
      });
      return [];
    }

    const rootFieldPath = readFieldPath(fieldHost);
    const nested = rootFieldPath
      ? collectExportableNestedRelationFields(ctx, fieldHost, rootFieldPath, `${fieldPath}.fields`)
      : { fields: [], fieldPaths: [] };
    const settings = exportFieldSettings(fieldHost, nested.fields);
    if (!settings) {
      recordUnsupported(ctx, {
        kind: 'field',
        use: readString(fieldHost.use),
        path: fieldPath,
        reasonCode: 'unsupported-node',
        manualAction: UNSUPPORTED_MANUAL_ACTION,
      });
      return [];
    }

    const fallback = readString((settings as { field?: unknown }).field) || `field_${index + 1}`;
    const key = dedupeKey(ctx, scope, getDeclaredKey(fieldHost, scope.prefix), fallback, `${fieldPath}.key`);
    const spec = buildDefinedPayload({
      key,
      ...(settings as Omit<FlowSurfaceApplyBlueprintFieldObjectSpec, 'key'>),
    }) as FlowSurfaceApplyBlueprintFieldObjectSpec;
    return [
      {
        spec,
        uid: fieldHost.uid,
        bindingUids: collectFieldBindingUids(fieldHost),
        key,
        fieldPaths: _.uniq(
          compactStringValues([(settings as { field?: unknown }).field as string | undefined, ...nested.fieldPaths]),
        ),
      },
    ];
  });
}

function getFieldHosts(block: FlowSurfaceExportNode, type: string) {
  if (type === 'table') {
    return getSubNodeArray(block, 'columns').filter((item) => item.use !== TABLE_ACTIONS_COLUMN_USE);
  }

  if (FIELD_GRID_BLOCK_TYPES.has(type)) {
    return getSubNodeArray(getSubNode(block, 'grid'), 'items');
  }

  if (CARD_FIELD_BLOCK_TYPES.has(type)) {
    return getSubNodeArray(getSubNode(getSubNode(block, 'item'), 'grid'), 'items');
  }

  return [];
}

function isDefaultPopupRuntimeOpenViewValue(
  key: string,
  value: unknown,
  resourceContext: FlowSurfaceExportResourceContext | undefined,
) {
  if (key === 'size') {
    return value === 'medium';
  }
  if (key === 'pageModelClass') {
    return value === 'ChildPageModel';
  }
  if (key === 'collectionName') {
    return !!resourceContext?.collectionName && readString(value) === resourceContext.collectionName;
  }
  if (key === 'associationName') {
    return !!resourceContext?.associationName && readString(value) === resourceContext.associationName;
  }
  if (key === 'sourceId') {
    return value === DEFAULT_RELATION_OPEN_VIEW_SOURCE_ID;
  }
  if (key === 'filterByTk') {
    return value === DEFAULT_RELATION_OPEN_VIEW_FILTER_BY_TK;
  }
  if (key === 'dataSourceKey') {
    const expectedDataSourceKey = resourceContext?.dataSourceKey || (resourceContext?.collectionName ? 'main' : '');
    return !!expectedDataSourceKey && readString(value) === expectedDataSourceKey;
  }
  return false;
}

function hasUnsupportedPopupSettings(
  popupSettings: Record<string, unknown> | undefined,
  type: string,
  resourceContext?: FlowSurfaceExportResourceContext,
) {
  if (!popupSettings) {
    return false;
  }
  if (!PUBLIC_POPUP_ACTION_TYPES.has(type)) {
    return true;
  }
  return Object.entries(popupSettings).some(([key, value]) => {
    if (BASIC_INLINE_POPUP_OPEN_VIEW_KEYS.has(key)) {
      return false;
    }
    if (BASIC_INLINE_POPUP_DEFAULT_RUNTIME_KEYS.has(key)) {
      return !isDefaultPopupRuntimeOpenViewValue(key, value, resourceContext);
    }
    return true;
  });
}

function exportActionButtonSettings(action: FlowSurfaceExportNode) {
  const general = getByPath<Record<string, unknown>>(action, ['stepParams', 'buttonSettings', 'general']) || {};
  const readValue = (key: string) => getOwnValue(action.props, key) ?? getOwnValue(general, key);
  return buildDefinedPayload({
    title: readValue('title'),
    tooltip: readValue('tooltip'),
    icon: readValue('icon'),
    onlyIcon: readValue('onlyIcon'),
    type: readValue('type'),
    danger: readValue('danger'),
    color: readValue('color'),
  });
}

function exportFilterActionSettings(action: FlowSurfaceExportNode) {
  const filterSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'filterSettings']);
  if (!filterSettings) {
    return undefined;
  }
  const defaultFilter = _.cloneDeep(_.get(filterSettings, ['defaultFilter', 'defaultFilter']));
  const filterableFieldNames = _.cloneDeep(_.get(filterSettings, ['filterableFieldNames', 'filterableFieldNames']));
  return buildDefinedPayload({
    defaultFilter: _.isUndefined(defaultFilter) ? undefined : defaultFilter,
    filterableFieldNames: _.isUndefined(filterableFieldNames) ? undefined : filterableFieldNames,
  });
}

function exportDeleteActionSettings(action: FlowSurfaceExportNode, type: string) {
  if (!BASIC_DELETE_ACTION_TYPES.has(type)) {
    return undefined;
  }
  const confirm = clonePlainObject(getByPath(action, ['stepParams', 'deleteSettings', 'confirm']));
  return confirm ? { confirm } : undefined;
}

function readActionRunJsSettings(action: FlowSurfaceExportNode) {
  return (
    clonePlainObject(getByPath(action, ['stepParams', 'clickSettings', 'runJs'])) ||
    clonePlainObject(getByPath(action, ['stepParams', 'jsSettings', 'runJs']))
  );
}

function hasUnsupportedActionButtonSettings(action: FlowSurfaceExportNode) {
  const buttonSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'buttonSettings']);
  if (!buttonSettings) {
    return false;
  }
  const unsupportedGroups = Object.keys(buttonSettings).filter((key) => key !== 'general' && key !== 'linkageRules');
  if (unsupportedGroups.length) {
    return true;
  }
  const general = getByPath<Record<string, unknown>>(action, ['stepParams', 'buttonSettings', 'general']);
  if (!general) {
    return false;
  }
  return Object.keys(general).some((key) => !BASIC_ACTION_BUTTON_GENERAL_KEYS.has(key));
}

function hasUnsupportedActionFilterSettings(action: FlowSurfaceExportNode, type: string) {
  const filterSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'filterSettings']);
  if (!filterSettings) {
    return false;
  }
  if (type !== 'filter') {
    return true;
  }
  const unsupportedGroups = Object.keys(filterSettings).filter(
    (key) => key !== 'defaultFilter' && key !== 'filterableFieldNames',
  );
  if (unsupportedGroups.length) {
    return true;
  }
  const defaultFilter = getByPath<Record<string, unknown>>(action, ['stepParams', 'filterSettings', 'defaultFilter']);
  const filterableFieldNames = getByPath<Record<string, unknown>>(action, [
    'stepParams',
    'filterSettings',
    'filterableFieldNames',
  ]);
  return (
    (defaultFilter && Object.keys(defaultFilter).some((key) => key !== 'defaultFilter')) ||
    (filterableFieldNames && Object.keys(filterableFieldNames).some((key) => key !== 'filterableFieldNames'))
  );
}

function hasUnsupportedActionDeleteSettings(action: FlowSurfaceExportNode, type: string) {
  const deleteSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'deleteSettings']);
  if (!deleteSettings) {
    return false;
  }
  if (!BASIC_DELETE_ACTION_TYPES.has(type)) {
    return true;
  }
  const unsupportedGroups = Object.keys(deleteSettings).filter((key) => key !== 'confirm');
  if (unsupportedGroups.length) {
    return true;
  }
  const confirm = getByPath<Record<string, unknown>>(action, ['stepParams', 'deleteSettings', 'confirm']);
  return !!confirm && Object.keys(confirm).some((key) => !BASIC_DELETE_CONFIRM_KEYS.has(key));
}

function hasUnsupportedActionRunJsSettings(action: FlowSurfaceExportNode, type: string) {
  const clickSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'clickSettings']);
  const jsSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'jsSettings']);
  if (!clickSettings && !jsSettings) {
    return false;
  }
  if (type !== 'js' && type !== 'jsItem') {
    return true;
  }
  const unsupportedClickSettings = clickSettings && Object.keys(clickSettings).some((key) => key !== 'runJs');
  const unsupportedJsSettings = jsSettings && Object.keys(jsSettings).some((key) => key !== 'runJs');
  if (unsupportedClickSettings || unsupportedJsSettings) {
    return true;
  }
  if (clickSettings && !JS_ACTION_USES.has(String(action.use || ''))) {
    return true;
  }
  if (jsSettings && !JS_ITEM_ACTION_USES.has(String(action.use || ''))) {
    return true;
  }
  const runJs = readActionRunJsSettings(action);
  return !!runJs && Object.keys(runJs).some((key) => key !== 'code' && key !== 'version');
}

function isActionPropExportable(action: FlowSurfaceExportNode, type: string, key: string) {
  if (!BASIC_ACTION_PROP_KEYS.has(key)) {
    return false;
  }
  if (key === 'position') {
    return type === 'bulkDelete' && action.props?.position === 'right';
  }
  if (key === 'filterableFieldNames') {
    const exportedFilter = exportFilterActionSettings(action);
    return type === 'filter' && _.isEqual(action.props?.filterableFieldNames, exportedFilter?.filterableFieldNames);
  }
  if (key === 'defaultFilterValue' || key === 'filterValue') {
    const exportedFilter = exportFilterActionSettings(action);
    return type === 'filter' && _.isEqual(action.props?.[key], exportedFilter?.defaultFilter);
  }
  return true;
}

function hasUnsupportedActionPublicState(
  action: FlowSurfaceExportNode,
  type: string,
  resourceContext?: FlowSurfaceExportResourceContext,
) {
  if (type === 'aiEmployee') {
    return true;
  }
  const props = action.props || {};
  if (Object.keys(props).some((key) => !isActionPropExportable(action, type, key))) {
    return true;
  }
  const stepParams = action.stepParams || {};
  if (getPublicStepParamKeys(stepParams).some((key) => !BASIC_ACTION_STEP_PARAM_GROUPS.has(key))) {
    return true;
  }
  if (
    hasUnsupportedActionButtonSettings(action) ||
    hasUnsupportedActionFilterSettings(action, type) ||
    hasUnsupportedActionDeleteSettings(action, type) ||
    hasUnsupportedActionRunJsSettings(action, type)
  ) {
    return true;
  }
  const popupSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'popupSettings']);
  if (popupSettings && Object.keys(popupSettings).some((key) => key !== 'openView')) {
    return true;
  }
  if (getSubNode(action, 'page')) {
    return true;
  }
  const openView = getByPath<Record<string, unknown>>(action, ['stepParams', 'popupSettings', 'openView']);
  if (hasUnsupportedPopupSettings(openView, type, resourceContext)) {
    return true;
  }
  return hasNonEmptyPlainObject(action.flowRegistry);
}

function exportActionSettings(action: FlowSurfaceExportNode, resourceContext?: FlowSurfaceExportResourceContext) {
  const type = ACTION_KEY_BY_USE.get(String(action.use || ''));
  if (!type) {
    return undefined;
  }
  if (hasUnsupportedActionPublicState(action, type, resourceContext)) {
    return undefined;
  }

  const popupSettings = getByPath<Record<string, unknown>>(action, ['stepParams', 'popupSettings', 'openView']);
  const popupTemplate = exportPopupSummary(action.popup);
  const settings = buildDefinedPayload({
    ...exportActionButtonSettings(action),
    ...(type === 'filter' ? exportFilterActionSettings(action) : {}),
    ...exportDeleteActionSettings(action, type),
    ...(type === 'js' || type === 'jsItem' ? readActionRunJsSettings(action) : {}),
  });
  const popup =
    _.isPlainObject(popupSettings) && PUBLIC_POPUP_ACTION_TYPES.has(type)
      ? buildDefinedPayload({
          title: readString(popupSettings.title),
          mode: readString(popupSettings.mode) as FlowSurfaceApplyBlueprintPopup['mode'],
          tryTemplate: typeof popupSettings.tryTemplate === 'boolean' ? popupSettings.tryTemplate : undefined,
          defaultType:
            type === 'view'
              ? 'view'
              : type === 'edit'
                ? 'edit'
                : (readString(popupSettings.defaultType) as 'view' | 'edit' | undefined),
          ...popupTemplate,
        })
      : popupTemplate;

  return buildDefinedPayload({
    type,
    settings: settings && Object.keys(settings).length ? settings : undefined,
    popup: popup && Object.keys(popup).length ? popup : undefined,
  });
}

function exportActions(
  ctx: FlowSurfaceExportBlueprintContext,
  actions: FlowSurfaceExportNode[],
  scope: KeyScope,
  kind: 'action' | 'recordAction',
  path: string,
  resourceContext?: FlowSurfaceExportResourceContext,
): FlowSurfaceExportActionResult[] {
  return actions.flatMap((action, index) => {
    const actionPath = `${path}[${index}]`;
    if (hasUnsupportedTemplateSummary(action)) {
      recordUnsupported(ctx, {
        kind,
        use: readString(action.use),
        path: actionPath,
        reasonCode: TEMPLATE_SUMMARY_UNSUPPORTED_REASON,
        manualAction: templateSummaryManualAction(kind),
      });
      return [];
    }

    const settings = exportActionSettings(action, resourceContext);
    if (!settings?.type) {
      recordUnsupported(ctx, {
        kind,
        use: readString(action.use),
        path: actionPath,
        reasonCode: 'unsupported-node',
        manualAction: UNSUPPORTED_MANUAL_ACTION,
      });
      return [];
    }

    const key = dedupeKey(ctx, scope, getDeclaredKey(action, scope.prefix), settings.type, `${actionPath}.key`);
    const spec = buildDefinedPayload({
      key,
      ...settings,
    }) as FlowSurfaceApplyBlueprintActionObjectSpec;
    return [
      {
        spec,
        uid: action.uid,
        key,
      },
    ];
  });
}

function getRecordActionHosts(block: FlowSurfaceExportNode, type: string) {
  if (type === 'table') {
    const actionsColumn = getSubNodeArray(block, 'columns').find((item) => item.use === TABLE_ACTIONS_COLUMN_USE);
    return getSubNodeArray(actionsColumn, 'actions');
  }

  if (type === 'list' || type === 'gridCard' || type === 'comments') {
    return getSubNodeArray(getSubNode(block, 'item'), 'actions');
  }

  return [];
}

function getBlockActionHosts(block: FlowSurfaceExportNode, type: string) {
  const actions = getSubNodeArray(block, 'actions');
  if (type !== 'recordHistory') {
    return actions;
  }
  return actions.filter((action) => !RECORD_HISTORY_GENERATED_ACTION_USES.has(String(action.use || '')));
}

function buildLayoutFromGrid(
  ctx: FlowSurfaceExportBlueprintContext,
  grid: FlowSurfaceExportNode | undefined,
  uidToLocalKey: ReadonlyMap<string, string>,
  path: string,
) {
  const rows = _.isPlainObject(grid?.props?.rows) ? (grid?.props?.rows as Record<string, unknown>) : {};
  const rowOrder = Array.isArray(grid?.props?.rowOrder)
    ? (grid?.props?.rowOrder as unknown[]).map((item) => String(item)).filter(Boolean)
    : Object.keys(rows);
  const sizes = _.isPlainObject(grid?.props?.sizes) ? (grid?.props?.sizes as Record<string, unknown>) : {};
  if (!rowOrder.length) {
    return undefined;
  }

  const layoutRows: FlowSurfaceApplyBlueprintLayoutCell[][] = [];
  for (const rowKey of rowOrder) {
    const row = Array.isArray(rows[rowKey]) ? (rows[rowKey] as unknown[]) : [];
    const rowSizes = Array.isArray(sizes[rowKey]) ? (sizes[rowKey] as unknown[]) : [];
    const cells = row.flatMap((cell, cellIndex) => {
      const uid = Array.isArray(cell) ? readString(cell[0]) : readString(cell);
      const key = uid ? uidToLocalKey.get(uid) : undefined;
      if (!key) {
        recordUnsupported(ctx, {
          kind: 'layout',
          path: `${path}.${rowKey}[${cellIndex}]`,
          reasonCode: 'unsupported-layout-cell',
          manualAction: 'Recreate this layout manually or add mapper support.',
        });
        return [];
      }
      const span = typeof rowSizes[cellIndex] === 'number' ? (rowSizes[cellIndex] as number) : undefined;
      return [span && span !== 24 ? { key, span } : key];
    });
    if (cells.length) {
      layoutRows.push(cells);
    }
  }

  return layoutRows.length
    ? {
        rows: layoutRows,
      }
    : undefined;
}

function buildAutoLayoutFromKeys(keys: string[]): FlowSurfaceApplyBlueprintLayout {
  return {
    rows: keys.map((key) => [key]),
  };
}

function exportFieldsLayout(
  ctx: FlowSurfaceExportBlueprintContext,
  block: FlowSurfaceExportNode,
  type: string,
  fields: FlowSurfaceExportFieldResult[],
) {
  if (!FIELD_GRID_BLOCK_TYPES.has(type)) {
    return undefined;
  }
  const grid = getSubNode(block, 'grid');
  const uidToLocalKey = new Map<string, string>();
  fields.forEach((field) => {
    if (field.uid && field.key) {
      uidToLocalKey.set(field.uid, field.key);
    }
  });
  return buildLayoutFromGrid(ctx, grid, uidToLocalKey, '$.fieldsLayout');
}

function prefixExportedKey(prefix: string, key: string) {
  return prefix ? `${prefix}.${key}` : key;
}

function exportBlock(
  ctx: FlowSurfaceExportBlueprintContext,
  block: FlowSurfaceExportNode,
  scope: KeyScope,
  index: number,
  path: string,
): FlowSurfaceExportBlockResult {
  const type = BLOCK_KEY_BY_USE.get(String(block.use || ''));
  if (!type || APPLY_BLUEPRINT_UNSUPPORTED_BLOCK_TYPES.has(type)) {
    recordUnsupported(ctx, {
      kind: 'block',
      use: readString(block.use),
      type,
      path,
      reasonCode: 'unsupported-node',
      manualAction: UNSUPPORTED_BLOCK_MANUAL_ACTION,
    });
    return {};
  }
  if (hasUnsupportedTemplateSummary(block)) {
    recordUnsupported(ctx, {
      kind: 'block',
      use: readString(block.use),
      type,
      path,
      reasonCode: TEMPLATE_SUMMARY_UNSUPPORTED_REASON,
      manualAction: templateSummaryManualAction('block'),
    });
    return {};
  }
  if (hasUnsupportedBlockPublicState(block, type)) {
    recordUnsupported(ctx, {
      kind: 'block',
      use: readString(block.use),
      type,
      path,
      reasonCode: 'unsupported-public-state',
      manualAction: UNSUPPORTED_BLOCK_MANUAL_ACTION,
    });
    return {};
  }

  const key = dedupeKey(ctx, scope, getDeclaredKey(block, scope.prefix), `${type}_${index + 1}`, `${path}.key`);
  const childScope = {
    prefix: scope.prefix ? `${scope.prefix}.${key}` : key,
    used: new Set<string>(),
  };
  const resourceContext = readBlockResourceContext(block);
  const fieldHosts = getFieldHosts(block, type);
  const fieldResults = exportFields(ctx, fieldHosts, childScope, `${path}.fields`);
  const actionResults = exportActions(
    ctx,
    getBlockActionHosts(block, type),
    childScope,
    'action',
    `${path}.actions`,
    resourceContext,
  );
  const recordActionResults = exportActions(
    ctx,
    getRecordActionHosts(block, type),
    childScope,
    'recordAction',
    `${path}.recordActions`,
    resourceContext,
  );
  const fieldsLayout = exportFieldsLayout(ctx, block, type, fieldResults);
  const fields = fieldResults.map((item) => item.spec);
  const fieldPaths = _.uniq(fieldResults.flatMap((field) => field.fieldPaths || []));
  const actions = actionResults.map((item) => item.spec);
  const recordActions = recordActionResults.map((item) => item.spec);
  const blockPublicKey = prefixExportedKey(scope.prefix, key);
  const chartSettings = exportChartBlockSettings(ctx, block, blockPublicKey, path);
  if (chartSettings === null) {
    return {};
  }
  const descendantKeys: ExportedKeyBinding[] = [
    ...fieldResults.flatMap((item) =>
      item.key
        ? (item.bindingUids || compactStringValues([item.uid])).map((bindingUid) => ({
            uid: bindingUid,
            key: prefixExportedKey(blockPublicKey, item.key),
            fieldPaths: item.fieldPaths,
          }))
        : [],
    ),
    ...[...actionResults, ...recordActionResults].flatMap((item) =>
      item.uid && item.key
        ? [
            {
              uid: item.uid,
              key: prefixExportedKey(blockPublicKey, item.key),
              fieldPaths,
            },
          ]
        : [],
    ),
  ];

  const spec = buildDefinedPayload({
    key,
    type,
    ...exportBlockResource(block),
    ...exportCardSettings(block),
    ...exportDataBlockSettings(block, type),
    ...exportListBlockSettings(block),
    ...exportGridCardBlockSettings(block),
    ...exportKanbanBlockSettings(block),
    ...exportTreeBlockSettings(block),
    ...exportCalendarBlockSettings(block),
    ...exportActionPanelBlockSettings(block),
    ...exportRecordHistoryBlockSettings(block),
    ...chartSettings,
    ...exportSimpleBlockSettings(block, type),
    template: exportTemplateSummary(block.template),
    fields: fields.length ? fields : undefined,
    fieldsLayout,
    actions: actions.length ? actions : undefined,
    recordActions: recordActions.length ? recordActions : undefined,
  }) as FlowSurfaceApplyBlueprintBlockSpec;

  return {
    spec,
    uid: block.uid,
    key,
    descendantKeys,
    fieldPaths,
  };
}

function extractReactionCanonicalRules(node: FlowSurfaceExportNode, slot: FlowSurfaceReactionSlot) {
  const stepRoot = _.get(node, ['stepParams', slot.flowKey, slot.stepKey]);
  const rawValue = slot.valuePath == null ? stepRoot : _.get(stepRoot, slot.valuePath);
  return Array.isArray(rawValue) ? _.cloneDeep(rawValue) : [];
}

function buildReactionFieldPathMaps(node: FlowSurfaceExportNode, scene: string) {
  const uidToPath = new Map<string, string>();
  const visit = (current: FlowSurfaceExportNode | undefined, depth: number) => {
    if (!current) {
      return;
    }
    const isSubFormHostRoot =
      scene === 'subForm' &&
      depth === 0 &&
      (current.use === 'SubFormFieldModel' || current.use === 'SubFormListFieldModel');
    if (!isSubFormHostRoot) {
      const init = readFieldInit(current);
      const fieldPath = readString(init?.fieldPath);
      if (current.uid && fieldPath && !uidToPath.has(current.uid)) {
        uidToPath.set(current.uid, fieldPath);
      }
    }
    Object.values(current.subModels || {}).forEach((value) => {
      castNodeArray(value).forEach((child) => visit(child, depth + 1));
    });
  };
  visit(node, 0);
  return uidToPath;
}

function normalizeReactionRules(
  kind: FlowSurfaceReactionKind,
  canonicalRules: unknown[],
  node: FlowSurfaceExportNode,
  scene: string,
) {
  if (kind === 'fieldValue') {
    return normalizeFieldValueExportRules(canonicalRules);
  }
  if (kind === 'blockLinkage') {
    return normalizeBlockLinkageRules(canonicalRules as FlowSurfaceBlockLinkageRule[]);
  }
  if (kind === 'actionLinkage') {
    return normalizeActionLinkageRules(canonicalRules as FlowSurfaceActionLinkageRule[]);
  }
  const uidToPath = buildReactionFieldPathMaps(node, scene);
  return normalizeFieldLinkageRules(canonicalRules as FlowSurfaceFieldLinkageRule[], {
    scene: scene as FlowSurfaceFieldLinkageScene,
    resolveFieldPath: (fieldUid) => uidToPath.get(String(fieldUid || '').trim()),
  });
}

function normalizeFieldValueExportRules(canonicalRules: unknown[]) {
  return normalizeFieldValueRules(
    canonicalRules.map((rule) => {
      if (!_.isPlainObject(rule)) {
        return rule as FlowSurfaceFieldValueRule;
      }
      const current = rule as Record<string, unknown>;
      return {
        ...current,
        enabled: _.isUndefined(current.enabled) ? current.enable : current.enabled,
        when: _.isUndefined(current.when) ? current.condition : current.when,
      } as FlowSurfaceFieldValueRule;
    }),
  );
}

function compactStringValues(values: Array<string | undefined>) {
  return values.filter((value): value is string => !!value);
}

function collectSourcePathReferences(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectSourcePathReferences(item));
  }
  if (!_.isPlainObject(value)) {
    return [];
  }
  const source = readString((value as Record<string, unknown>).source);
  if (source) {
    return source === 'path' ? compactStringValues([readString((value as Record<string, unknown>).path)]) : [];
  }
  return Object.values(value as Record<string, unknown>).flatMap((item) => collectSourcePathReferences(item));
}

function collectReactionFilterFieldPaths(filter: unknown): string[] {
  const visit = (node: unknown): string[] => {
    if (Array.isArray(node)) {
      return node.flatMap((item) => visit(item));
    }
    if (!_.isPlainObject(node)) {
      return [];
    }

    const current = node as Record<string, unknown>;
    const source = readString(current.source);
    if (source) {
      return source === 'path' ? compactStringValues([readString(current.path)]) : [];
    }

    const currentPath = readString(current.path);
    return _.uniq([
      ...(currentPath ? [currentPath] : []),
      ...Object.entries(current).flatMap(([key, value]) => (key === 'path' ? [] : visit(value))),
    ]);
  };

  return _.uniq(visit(filter));
}

function collectFieldLinkageReferencedPaths(rule: FlowSurfaceFieldLinkageRule) {
  return compactStringValues(
    _.uniq([
      ...collectReactionFilterFieldPaths(rule.when),
      ...(rule.then || []).flatMap((action) => {
        if (action.type === 'setFieldState') {
          return action.fieldPaths || [];
        }
        if (action.type === 'assignField' || action.type === 'setFieldDefaultValue') {
          return (action.items || []).flatMap((item) => [
            item.targetPath,
            ...collectReactionFilterFieldPaths(item.when),
            ...collectSourcePathReferences(item.value),
          ]);
        }
        return [];
      }),
    ]),
  );
}

function collectFieldValueReferencedPaths(rule: FlowSurfaceFieldValueRule) {
  return compactStringValues(
    _.uniq([
      rule.targetPath,
      ...collectReactionFilterFieldPaths(rule.when),
      ...collectSourcePathReferences(rule.value),
    ]),
  );
}

function collectBlockLinkageReferencedPaths(rule: FlowSurfaceBlockLinkageRule) {
  return collectReactionFilterFieldPaths(rule.when);
}

function collectActionLinkageReferencedPaths(rule: FlowSurfaceActionLinkageRule) {
  return collectReactionFilterFieldPaths(rule.when);
}

function shouldCheckExportedFieldPath(path: string) {
  const [root] = String(path || '')
    .trim()
    .split('.')
    .filter(Boolean);
  if (!root) {
    return false;
  }
  return !REACTION_CONTEXT_SCALAR_PATHS.has(root) && !REACTION_CONTEXT_ROOT_PATHS.has(root);
}

function filterUnavailableReactionFieldReferenceRules<TRule>(
  ctx: FlowSurfaceExportBlueprintContext,
  rules: TRule[],
  targetKey: string,
  exportedFieldPaths: ReadonlySet<string> | undefined,
  collectReferencedPaths: (rule: TRule) => string[],
) {
  if (!exportedFieldPaths) {
    return rules;
  }

  const filtered = rules.filter((rule) =>
    collectReferencedPaths(rule)
      .filter(shouldCheckExportedFieldPath)
      .every((fieldPath) => exportedFieldPaths.has(fieldPath)),
  );
  if (filtered.length !== rules.length) {
    recordUnsupported(ctx, {
      kind: 'reaction',
      path: `$.reaction.${targetKey}`,
      reasonCode: 'unsupported-reaction-target-field',
      manualAction: 'Recreate reaction rules that reference skipped fields manually or add mapper support.',
    });
  }
  return filtered;
}

function filterUnavailableFieldLinkageRules(
  ctx: FlowSurfaceExportBlueprintContext,
  rules: FlowSurfaceFieldLinkageRule[],
  targetKey: string,
  exportedFieldPaths: ReadonlySet<string> | undefined,
) {
  return filterUnavailableReactionFieldReferenceRules(
    ctx,
    rules,
    targetKey,
    exportedFieldPaths,
    collectFieldLinkageReferencedPaths,
  );
}

function filterUnavailableFieldValueRules(
  ctx: FlowSurfaceExportBlueprintContext,
  rules: FlowSurfaceFieldValueRule[],
  targetKey: string,
  exportedFieldPaths: ReadonlySet<string> | undefined,
) {
  return filterUnavailableReactionFieldReferenceRules(
    ctx,
    rules,
    targetKey,
    exportedFieldPaths,
    collectFieldValueReferencedPaths,
  );
}

function filterUnavailableReactionRules(
  ctx: FlowSurfaceExportBlueprintContext,
  kind: FlowSurfaceReactionKind,
  rules:
    | FlowSurfaceFieldValueRule[]
    | FlowSurfaceBlockLinkageRule[]
    | FlowSurfaceFieldLinkageRule[]
    | FlowSurfaceActionLinkageRule[],
  targetKey: string,
  exportedFieldPaths: ReadonlySet<string> | undefined,
) {
  if (kind === 'fieldValue') {
    return filterUnavailableFieldValueRules(ctx, rules as FlowSurfaceFieldValueRule[], targetKey, exportedFieldPaths);
  }
  if (kind === 'fieldLinkage') {
    return filterUnavailableFieldLinkageRules(
      ctx,
      rules as FlowSurfaceFieldLinkageRule[],
      targetKey,
      exportedFieldPaths,
    );
  }
  if (kind === 'blockLinkage') {
    return filterUnavailableReactionFieldReferenceRules(
      ctx,
      rules as FlowSurfaceBlockLinkageRule[],
      targetKey,
      exportedFieldPaths,
      collectBlockLinkageReferencedPaths,
    );
  }
  if (kind === 'actionLinkage') {
    return filterUnavailableReactionFieldReferenceRules(
      ctx,
      rules as FlowSurfaceActionLinkageRule[],
      targetKey,
      exportedFieldPaths,
      collectActionLinkageReferencedPaths,
    );
  }
  return rules;
}

function exportReactionItems(
  ctx: FlowSurfaceExportBlueprintContext,
  root: FlowSurfaceExportNode,
  keyByUid: ReadonlyMap<string, string>,
  fieldPathsByTargetKey: ReadonlyMap<string, ReadonlySet<string>>,
) {
  const items: NonNullable<FlowSurfaceApplyBlueprintDocument['reaction']>['items'] = [];
  const visit = (node: FlowSurfaceExportNode | undefined) => {
    if (!node?.uid) {
      return;
    }
    const targetKey = keyByUid.get(node.uid);
    if (targetKey && getReactionKindsForUse(node.use).length) {
      try {
        const resolvedTarget = resolveReactionTarget({
          target: {
            uid: node.uid,
          },
          node,
          use: node.use,
        });
        for (const capability of resolvedTarget.capabilities) {
          const resolvedCapability = resolveReactionCapability(resolvedTarget, capability.kind);
          const storageNode = resolveReactionStorageNode(resolvedTarget, resolvedCapability);
          const canonicalRules = extractReactionCanonicalRules(storageNode, resolvedCapability.resolvedSlot);
          if (!canonicalRules.length) {
            continue;
          }
          const normalizedRules = normalizeReactionRules(
            capability.kind,
            canonicalRules,
            node,
            resolvedCapability.resolvedScene,
          );
          const rules = filterUnavailableReactionRules(
            ctx,
            capability.kind,
            normalizedRules,
            targetKey,
            fieldPathsByTargetKey.get(targetKey),
          );
          if (!rules.length) {
            continue;
          }
          items.push({
            type: REACTION_KIND_TO_BLUEPRINT_TYPE[capability.kind],
            target: targetKey,
            rules: rules as never,
          });
        }
      } catch (error) {
        recordUnsupported(ctx, {
          kind: 'reaction',
          use: readString(node.use),
          path: `$.reaction.${targetKey}`,
          reasonCode: 'unsupported-reaction',
          manualAction: 'Recreate these reaction rules manually or add mapper support.',
        });
      }
    }

    Object.values(node.subModels || {}).forEach((value) => {
      castNodeArray(value).forEach((child) => visit(child));
    });
  };
  visit(root);
  return items.length ? { items } : undefined;
}

function exportTab(
  ctx: FlowSurfaceExportBlueprintContext,
  tab: FlowSurfaceExportNode,
  index: number,
  keyByUid: Map<string, string>,
  fieldPathsByTargetKey: Map<string, ReadonlySet<string>>,
) {
  if (hasNonEmptyPlainObject(tab.flowRegistry)) {
    recordUnsupported(ctx, {
      kind: 'tab',
      use: readString(tab.use),
      path: `$.tabs[${index}].flowRegistry`,
      reasonCode: FLOW_REGISTRY_UNSUPPORTED_REASON,
      manualAction: 'Recreate these event flows manually or add mapper support.',
    });
    return undefined;
  }

  const tabScope: KeyScope = {
    prefix: '',
    used: new Set<string>(),
  };
  const tabKey = dedupeKey(
    ctx,
    tabScope,
    getDeclaredKey(tab, '') || inferTabDeclaredKeyFromChildren(tab),
    `tab_${index + 1}`,
    `$.tabs[${index}].key`,
  );
  const blockScope: KeyScope = {
    prefix: tabKey,
    used: new Set<string>(),
  };
  const grid = getSubNode(tab, 'grid');
  if (hasNonEmptyPlainObject(grid?.flowRegistry)) {
    recordUnsupported(ctx, {
      kind: 'layout',
      use: readString(grid?.use),
      path: `$.tabs[${index}].grid.flowRegistry`,
      reasonCode: FLOW_REGISTRY_UNSUPPORTED_REASON,
      manualAction: 'Recreate these event flows manually or add mapper support.',
    });
    return undefined;
  }
  const blockResults = getSubNodeArray(grid, 'items').map((block, blockIndex) =>
    exportBlock(ctx, block, blockScope, blockIndex, `$.tabs[${index}].blocks[${blockIndex}]`),
  );
  const blocks = blockResults.flatMap((item) => (item.spec ? [item.spec] : []));
  blockResults.forEach((item) => {
    if (item.uid && item.key) {
      keyByUid.set(item.uid, `${tabKey}.${item.key}`);
      fieldPathsByTargetKey.set(`${tabKey}.${item.key}`, new Set(item.fieldPaths || []));
    }
    item.descendantKeys?.forEach((binding) => {
      keyByUid.set(binding.uid, binding.key);
      if (binding.fieldPaths?.length) {
        fieldPathsByTargetKey.set(binding.key, new Set(binding.fieldPaths));
      }
    });
  });
  const uidToLocalKey = new Map<string, string>();
  blockResults.forEach((item) => {
    if (item.uid && item.key) {
      uidToLocalKey.set(item.uid, item.key);
    }
  });
  const layout = buildLayoutFromGrid(ctx, grid, uidToLocalKey, `$.tabs[${index}].layout`);

  if (!blocks.length) {
    recordUnsupported(ctx, {
      kind: 'tab',
      use: readString(tab.use),
      path: `$.tabs[${index}]`,
      reasonCode: 'empty-tab',
      manualAction: 'Add at least one supported block before exporting this tab.',
    });
    return undefined;
  }

  return buildDefinedPayload({
    key: tabKey,
    ...exportTabChrome(tab),
    blocks,
    layout: layout || buildAutoLayoutFromKeys(blocks.map((block) => block.key).filter(Boolean) as string[]),
  }) as FlowSurfaceApplyBlueprintTabDocument;
}

export function exportFlowSurfaceBlueprintDocument(input: {
  page: FlowSurfaceExportNode;
  pageRoute?: Record<string, unknown>;
  target: {
    pageSchemaUid: string;
  };
  unsupportedPolicy?: FlowSurfaceExportBlueprintUnsupportedPolicy;
}): FlowSurfaceExportBlueprintResult {
  const ctx: FlowSurfaceExportBlueprintContext = {
    unsupportedPolicy: input.unsupportedPolicy || 'error',
    warnings: [],
    unsupported: [],
    chartAssets: {},
  };
  const keyByUid = new Map<string, string>();
  const fieldPathsByTargetKey = new Map<string, ReadonlySet<string>>();
  const tabs = getSubNodeArray(input.page, 'tabs').flatMap((tab, index) => {
    const exportedTab = exportTab(ctx, tab, index, keyByUid, fieldPathsByTargetKey);
    return exportedTab ? [exportedTab] : [];
  });
  if (!tabs.length) {
    recordUnsupported(ctx, {
      kind: 'page',
      use: readString(input.page.use),
      path: '$.tabs',
      reasonCode: 'empty-page',
      manualAction: 'Add at least one supported tab before exporting this page.',
    });
  }

  const page = exportPage(ctx, input.page, input.pageRoute);
  if (tabs.length === 1 && page?.enableTabs === true) {
    recordUnsupported(ctx, {
      kind: 'page',
      use: readString(input.page.use),
      path: '$.page.enableTabs',
      reasonCode: 'unsupported-single-tab-enable-tabs',
      manualAction: 'Disable page tabs for single-tab pages or add replace schema support for single-tab tab chrome.',
    });
  }
  const reaction = exportReactionItems(ctx, input.page, keyByUid, fieldPathsByTargetKey);
  assertNoUnsupported(ctx);
  if (!tabs.length) {
    throwBadRequest(`flowSurfaces exportBlueprint cannot export a page without at least one supported tab`);
  }

  const document: FlowSurfaceApplyBlueprintDocument = {
    version: '1',
    mode: 'replace',
    target: {
      pageSchemaUid: input.target.pageSchemaUid,
    },
    ...(Object.keys(page || {}).length ? { page } : {}),
    tabs,
    assets: {
      scripts: {},
      charts: ctx.chartAssets,
    },
    ...(reaction ? { reaction } : {}),
  };

  return {
    document,
    source: {
      target: {
        pageSchemaUid: input.target.pageSchemaUid,
      },
      pageTitle: readPageTitle(input.page),
    },
    warnings: ctx.warnings,
    unsupported: ctx.unsupported,
  };
}
