/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import * as _ from 'lodash';
import { operators as databaseOperators } from '@nocobase/database';
import { Op } from 'sequelize';
import * as antDesignIconAsn from '@ant-design/icons-svg';
import type { FlowSurfaceErrorItemInput } from './errors';
import { FlowSurfaceBadRequestError, throwAggregateBadRequest } from './errors';
import {
  formatChartBuilderSupportedRelationSubfields,
  getCollectionFields,
  getCollectionModelAttributes,
  getCollectionName,
  getInvalidChartBuilderRelationDirectSubfieldDetails,
  getUnsupportedChartBuilderRelationSubfieldDetails,
  getFieldFilterable,
  getFieldInterface,
  getFieldName,
  getFieldType,
  inferAssociationLeafDisplayFieldUse,
  inferFieldMenuEditableFieldUse,
  isAssociationField,
  normalizeFieldPath,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';
import { resolveRegisteredFieldBinding } from './field-binding-registry';
import { buildFlowSurfaceTitleFieldErrorDetails, resolveAssociationSafeTitleField } from './association-title-field';
import {
  CHART_BASIC_VISUAL_TYPES,
  CHART_QUERY_MODES,
  CHART_VISUAL_MODES,
  getChartBuilderResourceInit,
} from './chart-config';
import {
  buildFlowSurfaceDefaultFilterFromCollection,
  FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT,
  isFlowSurfaceDefaultFilterEligibleField,
  isFlowSurfacePublicDataSurfaceBlockType,
  resolveFlowSurfaceDefaultFilterFieldNames,
  resolveFlowSurfaceDefaultFilterRequiredFieldCount,
} from './public-data-surface-default-filter';
import {
  collectFlowSurfaceDefaultActionPopupFieldGroupFieldPaths,
  hasFlowSurfaceInlinePopupBlocks,
  hasFlowSurfaceInlinePopupTemplate,
  isFlowSurfaceDefaultActionPopupBusinessField,
  pickFlowSurfaceDefaultActionPopupFieldGroups,
  pickFlowSurfaceDefaultActionPopupFieldPaths,
} from './default-action-popup';
import { isRelationBackingForeignKeyField } from './relation-backing-foreign-key';
import { getFlowSurfaceDefaultBlockActions } from './default-block-actions';
import { hiddenPopupHostHasLocalContent } from './hidden-popup-contract';
import { FIELD_WRAPPER_USES } from './node-use-sets';
import { FLOW_SURFACE_INTERNAL_FIELD_KEYS } from './field-type-resolver';
import { hasFlowSurfaceTemplateDocument, hasFlowSurfaceTemplateReference } from './template-reference';
import { SINGLE_VALUE_ASSOCIATION_INTERFACES } from './association-interfaces';
import {
  getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride,
  normalizeFlowSurfaceApplyBlueprintDataSourceKey,
  resolveFlowSurfaceApplyBlueprintDefaultCollection,
} from './blueprint/defaults';
import { collectRunJsAuthoringErrors } from './runjs-authoring';
import { getConfigureOptionKeysForUse } from './configure-options';
import { buildFlowSurfaceContextResponse } from './context';
import type { FlowSurfaceContextResponse, FlowSurfaceContextVarInfo } from './types';
import {
  assertFlowSurfaceFilterGroupShape,
  FLOW_SURFACE_DATE_FILTER_OPERATORS,
  FLOW_SURFACE_EMPTY_FILTER_GROUP,
  isFlowSurfaceDateLikeFieldMeta,
  normalizeFlowSurfaceDateConditionValue,
  assertFlowSurfaceFilterOperator,
  FLOW_SURFACE_FILTER_GROUP_EXAMPLE,
  normalizeFlowSurfaceCompatibleFilterGroupValue,
} from './filter-group';

export type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

type AuthoringErrorInput = Omit<FlowSurfaceErrorItemInput, 'message'> & { message: string };

const FLOW_SURFACE_DATA_SCOPE_DATE_EMPTY_OPERATORS = new Set(['$empty', '$notEmpty']);
const FLOW_SURFACE_DATA_SCOPE_DATE_ALLOWED_OPERATORS = new Set([
  ...FLOW_SURFACE_DATE_FILTER_OPERATORS,
  ...FLOW_SURFACE_DATA_SCOPE_DATE_EMPTY_OPERATORS,
]);
const FLOW_SURFACE_DATA_SCOPE_DATE_UI_INCOMPATIBLE_OPERATORS = new Set([
  '$eq',
  '$ne',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$in',
  '$notIn',
]);

export interface FlowSurfaceAuthoringValidationContext {
  authoringActionName?: FlowSurfaceAuthoringWriteAction;
  applyBlueprintScriptAssets?: Record<string, any>;
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  getDefaultFieldGroups?: (dataSourceKey: string, collectionName: string) => any;
  findMenuGroupRoutesByTitle?: (title: string, transaction?: any) => Promise<any[]>;
  transaction?: any;
  hostBlockType?: string;
  hostCollectionName?: string;
  hostDataSourceKey?: string;
  currentCollectionName?: string;
  currentDataSourceKey?: string;
  isPopupSurface?: boolean;
  popupScene?: string;
  popupHasCurrentRecord?: boolean;
  enabledPackages?: ReadonlySet<string>;
  currentNode?: any;
  skipGeneratedPopupDefaultFieldGroups?: boolean;
  skipGeneratedLayoutSingleColumnErrors?: boolean;
  findModelById?: (
    uid: string,
    options?: {
      transaction?: any;
      includeAsyncNode?: boolean;
    },
  ) => Promise<any>;
  findOwningBlockGrid?: (uid: string, transaction?: any) => Promise<any>;
}

const MAIN_BLOCK_UNSUPPORTED_SECTIONS: Record<string, string[]> = {
  calendar: ['fields', 'fieldGroups', 'recordActions', 'fieldsLayout'],
  kanban: ['fieldGroups', 'recordActions', 'fieldsLayout'],
  tree: ['fields', 'fieldGroups', 'actions', 'recordActions', 'fieldsLayout'],
};

const FIELD_GROUP_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details']);
const FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details', 'filterForm']);
const DEFAULT_FORM_BEHAVIOR_REACTION_FORM_BLOCK_TYPES = new Set(['createForm', 'editForm']);
const SORTABLE_BLOCK_TYPES = new Set(['table', 'details', 'list', 'tree', 'kanban', 'gridCard', 'map']);
const CHART_BLOCK_TYPES = new Set(['chart']);
const COMMENTS_PAGE_SIZE_VALUES = new Set([5, 10, 20, 50, 100, 200]);
const RECORD_HISTORY_INTERNAL_COLLECTIONS = new Set(['recordHistories', 'recordFieldHistories']);
const VISIBLE_FIELD_REQUIRED_DATA_BLOCK_TYPES = new Set([
  'table',
  'list',
  'gridCard',
  'details',
  'createForm',
  'editForm',
  'filterForm',
  'kanban',
]);
const VISIBLE_FIELD_MINIMUM_DATA_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'details']);
const IMPLICIT_RELATION_TITLE_FIELD_DISPLAY_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'details']);
const IMPLICIT_RELATION_TITLE_FIELD_CONTAINER_USE_BY_BLOCK_TYPE: Record<string, string> = {
  details: 'DetailsItemModel',
  gridCard: 'GridCardItemModel',
  list: 'ListItemModel',
  table: 'TableColumnModel',
};
const RICH_COLLECTION_VISIBLE_FIELD_THRESHOLD = FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT * 2;
const RICH_DATA_BLOCK_VISIBLE_FIELD_MINIMUM = 3;
const NON_BUSINESS_VISIBLE_FIELD_NAMES = new Set([
  'id',
  'uid',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'createdBy',
  'updatedBy',
  'deletedBy',
  'createdById',
  'updatedById',
  'deletedById',
  'created_at',
  'updated_at',
  'deleted_at',
  'created_by',
  'updated_by',
  'deleted_by',
]);
const NON_BUSINESS_VISIBLE_FIELD_INTERFACES = new Set([
  'id',
  'createdAt',
  'updatedAt',
  'createdBy',
  'updatedBy',
  'sort',
]);
const NON_BUSINESS_VISIBLE_FIELD_TYPES = new Set([
  'action',
  'actions',
  'button',
  'divider',
  'operation',
  'operations',
  'sort',
]);
const VISIBLE_DATA_BLOCK_JS_COLUMN_BLOCK_TYPES = new Set(['table']);
const VISIBLE_DATA_BLOCK_JS_ITEM_BLOCK_TYPES = new Set(['createForm', 'editForm']);
const VISIBLE_DATA_BLOCK_DISPLAY_JS_FIELD_BLOCK_TYPES = new Set(['table', 'details', 'list', 'gridCard', 'kanban']);
const VISIBLE_DATA_BLOCK_EDITABLE_JS_FIELD_BLOCK_TYPES = new Set(['createForm', 'editForm']);
const ANT_DESIGN_ICON_NAMES = new Set(Object.keys(antDesignIconAsn || {}));
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

const GRID_CARD_ALLOWED_SETTINGS_KEYS = new Set([
  'title',
  'description',
  'height',
  'heightMode',
  'resource',
  'columns',
  'rowCount',
  'dataScope',
  'sort',
  'sorting',
  'layout',
]);
const TABLE_ALLOWED_SETTINGS_KEYS = new Set([...getConfigureOptionKeysForUse('TableBlockModel'), 'sort']);
const TABLE_INTERNAL_AUTHORING_KEYS = ['tableSettings', 'defaultSorting', 'stepParams'];
const TABLE_SETTINGS_REPAIR_HINT =
  'Use public table settings keys such as settings.pageSize, settings.sorting, settings.dataScope, settings.density, settings.showRowNumbers, settings.treeTable, settings.dragSort, and settings.dragSortBy. Do not nest persisted tableSettings/defaultSorting/stepParams payloads.';
const JS_BLOCK_ALLOWED_SETTINGS_KEYS = new Set([
  'title',
  'description',
  'className',
  'showBlockCard',
  'code',
  'version',
]);
const JS_BLOCK_TOP_LEVEL_JS_KEYS = ['code', 'version'] as const;
const JS_BLOCK_INTERNAL_AUTHORING_KEYS = ['props', 'decoratorProps', 'flowRegistry', 'stepParams'];
const JS_BLOCK_REPAIR_HINT =
  'This is a jsBlock payload shape problem. Repair this jsBlock using inline settings.code/settings.version/settings.showBlockCard, or applyBlueprint assets.scripts.<key>.code plus block.script with optional settings.showBlockCard. Do not change this block type to table, chart, actionPanel, gridCard, or another block type.';
const CHART_REPAIR_HINT =
  'This is a chart payload shape problem. Keep using chart and repair this chart using assets.charts.<key>.query/visual plus block.chart, or localized settings.query/settings.visual. Do not change this block type to table, jsBlock, actionPanel, gridCard, or another block type, and do not drop or defer the chart. KPI / summary numbers should use jsBlock; charts are for trends, distributions, rankings, and visual analysis.';
const REPAIR_ALL_ERRORS_AGENT_INSTRUCTION =
  'If this response contains errors[], fix every listed error in one payload revision before retrying the same write. Do not fix only this error and immediately retry.';
const JS_BLOCK_AGENT_INSTRUCTION = `${REPAIR_ALL_ERRORS_AGENT_INSTRUCTION} Do not skip, drop, defer, or replace this required jsBlock. Repair it as jsBlock.`;
const CHART_AGENT_INSTRUCTION = `${REPAIR_ALL_ERRORS_AGENT_INSTRUCTION} Do not skip, drop, defer, or replace this required chart. Repair it as chart.`;
const VISIBLE_DATA_BLOCK_FIELDS_REPAIR_HINT =
  'Add direct visible collection fields to this block. Do not rely on defaults.collections.*.fieldGroups, action-only fields, dividers, or generated popup/form defaults as a substitute for visible block fields.';
const JS_BLOCK_FORBIDDEN_FALLBACKS = [
  'table',
  'list',
  'chart',
  'actionPanel',
  'gridCard',
  'markdown',
  'drop jsBlock',
  'defer jsBlock',
];
const CHART_FORBIDDEN_FALLBACKS = [
  'table',
  'list',
  'jsBlock',
  'actionPanel',
  'gridCard',
  'markdown',
  'drop chart',
  'defer chart',
];

const CHART_QUERY_MODE_SET = new Set(CHART_QUERY_MODES);
const CHART_VISUAL_MODE_SET = new Set(CHART_VISUAL_MODES);
const CHART_BASIC_VISUAL_TYPE_SET = new Set(CHART_BASIC_VISUAL_TYPES);
const CHART_BASIC_VISUAL_TYPE_LIST = CHART_BASIC_VISUAL_TYPES.join(', ');
const STRICT_LOCALIZED_CHART_ACTIONS = new Set<FlowSurfaceAuthoringWriteAction>(['compose', 'addBlocks']);
const CHART_VISUAL_LEGACY_BUILDER_KEYS = new Set([
  'xField',
  'yField',
  'seriesField',
  'sizeField',
  'pieCategory',
  'pieValue',
  'doughnutCategory',
  'doughnutValue',
  'funnelCategory',
  'funnelValue',
]);
const CHART_REQUIRED_VISUAL_MAPPINGS_BY_TYPE: Record<string, string[]> = {
  line: ['x', 'y'],
  area: ['x', 'y'],
  bar: ['x', 'y'],
  barHorizontal: ['x', 'y'],
  scatter: ['x', 'y'],
  pie: ['category', 'value'],
  doughnut: ['category', 'value'],
  funnel: ['category', 'value'],
};
const CHART_BUILDER_QUERY_FORBIDDEN_KEYS = new Set(['collectionPath', 'sql', 'sqlDatasource']);
const CHART_SQL_QUERY_FORBIDDEN_KEYS = new Set([
  'resource',
  'collectionPath',
  'measures',
  'dimensions',
  'filter',
  'sorting',
  'limit',
  'offset',
]);
const CHART_CUSTOM_VISUAL_FORBIDDEN_KEYS = new Set(['type', 'mappings', 'style']);
const CHART_DEFAULT_DATA_SOURCE_KEY = 'main';

const JS_ITEM_COLLECTION_ACTION_HOST_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'calendar', 'kanban']);
const JS_ITEM_RECORD_ACTION_HOST_BLOCK_TYPES = new Set(['table', 'details', 'list', 'gridCard']);
const JS_ITEM_FORM_ACTION_HOST_BLOCK_TYPES = new Set(['createForm', 'editForm']);
const RELATION_FIELD_POPUP_HOST_BLOCK_TYPES = new Set(['table', 'list', 'gridCard', 'details']);
const RELATION_FIELD_POPUP_CURRENT_RECORD_BLOCK_TYPES = new Set(['details', 'editForm']);
const RELATION_FIELD_POPUP_ASSOCIATED_RECORDS_BLOCK_TYPES = new Set(['table', 'list', 'gridCard']);
const TREE_CONNECT_TARGET_BLOCK_USES = new Set([
  'TableBlockModel',
  'CalendarBlockModel',
  'TreeBlockModel',
  'KanbanBlockModel',
  'DetailsBlockModel',
  'ListBlockModel',
  'GridCardBlockModel',
  'ChartBlockModel',
  'MapBlockModel',
  'CommentsBlockModel',
  'RecordHistoryBlockModel',
]);
const HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE: Record<string, string[]> = {
  calendar: ['quickCreatePopup', 'eventPopup'],
  kanban: ['quickCreatePopup', 'cardPopup'],
};
const SUPPORTED_DEFAULT_FILTER_OPERATORS = buildSupportedDefaultFilterOperators();
const ACTION_TYPE_ALIASES = new Map([
  ['addchild', 'addChild'],
  ['addnew', 'addNew'],
  ['aiemployee', 'aiEmployee'],
  ['bulkupdate', 'bulkUpdate'],
  ['jsitem', 'jsItem'],
  ['selectview', 'selectView'],
  ['triggerworkflow', 'triggerWorkflow'],
  ['turnpages', 'turnPages'],
  ['updaterecord', 'updateRecord'],
]);
const CALENDAR_ACTION_TYPE_ALIASES = new Map([
  ['today', 'today'],
  ['turnpages', 'turnPages'],
  ['title', 'title'],
  ['selectview', 'selectView'],
  ['filter', 'filter'],
  ['addnew', 'addNew'],
  ['popup', 'popup'],
  ['refresh', 'refresh'],
  ['js', 'js'],
  ['jsitem', 'jsItem'],
  ['triggerworkflow', 'triggerWorkflow'],
]);
const KANBAN_ACTION_TYPE_ALIASES = new Map([
  ['filter', 'filter'],
  ['addnew', 'addNew'],
  ['aiemployee', 'aiEmployee'],
  ['popup', 'popup'],
  ['refresh', 'refresh'],
  ['js', 'js'],
  ['jsitem', 'jsItem'],
]);
const CALENDAR_ALLOWED_ACTION_TYPES = new Set(CALENDAR_ACTION_TYPE_ALIASES.values());
const KANBAN_ALLOWED_ACTION_TYPES = new Set(KANBAN_ACTION_TYPE_ALIASES.values());
const EDIT_ACTION_TYPES = new Set(['edit']);
const LARGE_GENERATED_POPUP_FIELD_GROUPS_THRESHOLD = 10;
type GeneratedPopupDefaultActionType = 'addNew' | 'view' | 'edit';
const DEFAULT_ACTION_POPUP_TYPES = new Set<GeneratedPopupDefaultActionType>(['addNew', 'view', 'edit']);
const DEFAULT_ACTION_POPUP_FIELD_CONTEXT_BY_TYPE: Record<
  GeneratedPopupDefaultActionType,
  {
    mode: 'details' | 'form';
    ownerUse: 'CreateFormModel' | 'DetailsBlockModel' | 'EditFormModel';
  }
> = {
  addNew: {
    mode: 'form',
    ownerUse: 'CreateFormModel',
  },
  view: {
    mode: 'details',
    ownerUse: 'DetailsBlockModel',
  },
  edit: {
    mode: 'form',
    ownerUse: 'EditFormModel',
  },
};
const HIDDEN_POPUP_ACTION_TYPE_BY_BLOCK_TYPE: Record<string, Record<string, GeneratedPopupDefaultActionType>> = {
  calendar: {
    quickCreatePopup: 'addNew',
    eventPopup: 'view',
  },
  kanban: {
    quickCreatePopup: 'addNew',
    cardPopup: 'view',
  },
};
const CONFIGURE_OPEN_VIEW_ACTION_TYPE_BY_MODEL_USE: Record<string, GeneratedPopupDefaultActionType> = {
  AddNewActionModel: 'addNew',
  AddChildActionModel: 'addNew',
  CalendarQuickCreateActionModel: 'addNew',
  KanbanQuickCreateActionModel: 'addNew',
  ViewActionModel: 'view',
  CalendarEventViewActionModel: 'view',
  KanbanCardViewActionModel: 'view',
  EditActionModel: 'edit',
};
const DEFAULTS_ALLOWED_KEYS = ['collections', 'dataSources'];
const DEFAULT_COLLECTION_ALLOWED_KEYS = ['fieldGroups', 'popups', 'formBehavior', 'formBehaviorDescriptionReview'];
const DEFAULT_FIELD_GROUP_ALLOWED_KEYS = ['key', 'title', 'fields'];
const DEFAULT_FIELD_ALLOWED_KEYS = ['field', 'titleField'];
const DEFAULT_FORM_BEHAVIOR_ALLOWED_KEYS = ['addNew', 'edit'];
const DEFAULT_FORM_BEHAVIOR_SCENE_ALLOWED_KEYS = ['fields', 'fieldLinkageRules'];
const DEFAULT_FORM_BEHAVIOR_FIELD_ALLOWED_KEYS = ['settings'];
const DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_ALLOWED_KEYS = ['fields'];
const DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_FIELD_ALLOWED_KEYS = ['decision', 'reasonCode'];
const DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_DECISIONS = new Set(['implemented', 'noUiBehavior', 'unsupported']);
const DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_REASON_CODES = new Set([
  'no-ui-behavior',
  'ambiguous-description',
  'unsupported-cross-field-validation',
  'unsupported-association-filter',
  'workflow-or-ai-generation-out-of-scope',
  'ai-generated-content-out-of-scope',
]);
const DEFAULT_POPUPS_ALLOWED_KEYS = ['view', 'addNew', 'edit', 'associations'];
const DEFAULT_POPUP_ACTION_ALLOWED_KEYS = ['name', 'description'];
const DEFAULT_POPUP_ASSOCIATION_ALLOWED_KEYS = ['view', 'addNew', 'edit'];
const DEFAULT_POPUP_ACTIONS = ['view', 'addNew', 'edit'];
const AUTHORING_AI_EMPLOYEE_WORK_CONTEXT_PUBLIC_KEYS = ['type', 'uid', 'target'];
const AUTHORING_AI_EMPLOYEE_TASK_PUBLIC_SETTING_KEYS = [
  'title',
  'message',
  'autoSend',
  'skillSettings',
  'model',
  'webSearch',
];
const AUTHORING_AI_EMPLOYEE_TASK_MESSAGE_PUBLIC_KEYS = ['system', 'user', 'workContext'];
const AUTHORING_AI_EMPLOYEE_TASK_MODEL_PUBLIC_KEYS = ['llmService', 'model'];
const AUTHORING_AI_EMPLOYEE_SKILL_SETTINGS_PUBLIC_KEYS = ['skills', 'tools', 'skillsVersion', 'toolsVersion'];
const AUTHORING_AI_EMPLOYEE_STYLE_PUBLIC_KEYS = ['size', 'mask'];
const AUTHORING_AI_EMPLOYEE_DEFAULT_STYLE = {
  size: 40,
  mask: false,
};

function buildCalendarMainBlockRepairDetails(section: string) {
  const popupSectionHint =
    section === 'fieldGroups' || section === 'recordActions' || section === 'fieldsLayout'
      ? ' Put event form/details content under settings.quickCreatePopup or settings.eventPopup instead of on the calendar main block.'
      : '';
  return {
    repairHint:
      'Calendar main block payload shape issue. Put event bindings under settings.titleField, settings.startField, settings.endField, and optional settings.colorField; do not put collection fields in block fields. Keep block type calendar and repair this payload.' +
      popupSectionHint,
    example: {
      type: 'calendar',
      collection: 'tasks',
      settings: {
        titleField: 'title',
        startField: 'startAt',
        endField: 'endAt',
      },
    },
  };
}

function buildKanbanMainBlockRepairDetails(section: string) {
  return {
    repairHint:
      'Kanban main block payload shape issue. Put card display fields in block fields, grouping in settings.groupField, and quick-create/card details under settings.quickCreatePopup or settings.cardPopup. Keep block type kanban and repair this payload.',
    section,
    example: {
      type: 'kanban',
      collection: 'tasks',
      fields: ['title', 'priority'],
      settings: {
        groupField: 'status',
      },
    },
  };
}

function buildTwoColumnLayoutRepairDetails() {
  return {
    repairHint:
      'When multiple non-filter blocks should share a row, put them in the same layout row. Do not place every block on a separate row.',
    example: {
      layout: {
        rows: [
          [
            { key: 'calendar', span: 12 },
            { key: 'kanban', span: 12 },
          ],
        ],
      },
    },
  };
}

export async function assertFlowSurfaceAuthoringPayload(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  const errors = await collectFlowSurfaceAuthoringErrors(actionName, values, context);
  if (errors.length) {
    throwAggregateBadRequest(errors);
  }
}

export async function collectFlowSurfaceAuthoringErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext = {},
): Promise<FlowSurfaceErrorItemInput[]> {
  const errors: AuthoringErrorInput[] = [];
  const validationContext: FlowSurfaceAuthoringValidationContext = {
    ...context,
    authoringActionName: actionName,
  };

  if (!_.isPlainObject(values)) {
    return errors;
  }
  validationContext.getDefaultFieldGroups =
    validationContext.getDefaultFieldGroups ||
    ((dataSourceKey, collectionName) =>
      resolveFlowSurfaceApplyBlueprintDefaultCollection({
        metadata: values?.defaults,
        dataSourceKey,
        collectionName,
      }).collectionDefaults?.fieldGroups);
  if (actionName === 'applyBlueprint' && _.isPlainObject(values?.assets?.scripts)) {
    validationContext.applyBlueprintScriptAssets = values.assets.scripts;
  }

  await collectNavigationGroupErrors(actionName, values, validationContext, errors);
  await collectNavigationIconErrors(actionName, values, validationContext, errors);
  collectTopLevelLayoutErrors(actionName, values, errors);
  collectDefaultsShapeErrors(values?.defaults, '$.defaults', errors);
  collectDefaultCollectionFieldGroupSemanticErrors(values?.defaults, validationContext, errors);
  collectDefaultFormBehaviorCompletenessErrors(actionName, values, validationContext, errors);
  collectApplyBlueprintChartAssetErrors(actionName, values, validationContext, errors);

  if (actionName === 'configure') {
    await collectConfigureErrors(values, errors, validationContext);
    appendRunJsAuthoringErrors(actionName, values, validationContext, errors);
    if (!validationContext.skipGeneratedPopupDefaultFieldGroups) {
      collectGeneratedPopupDefaultFieldGroupErrors(actionName, values, validationContext, errors);
    }
    return errors;
  }

  const blocks = getAuthoringBlocks(actionName, values);
  const localKeys = new Set<string>();
  if (actionName === 'applyBlueprint') {
    _.castArray(values?.tabs || []).forEach((tab) => {
      const scopePrefix = String(tab?.key || '').trim();
      _.castArray(tab?.blocks || []).forEach((block) => collectLocalKeys(block, localKeys, scopePrefix));
    });
  } else {
    blocks.forEach(({ block }) => collectLocalKeys(block, localKeys));
  }
  blocks.forEach(({ block, path }) => collectBlockErrors(block, path, errors, localKeys, validationContext));
  collectReactionErrors(values?.reaction, '$.reaction', localKeys, errors, {
    values,
    context: validationContext,
  });
  if (!validationContext.skipGeneratedPopupDefaultFieldGroups) {
    collectGeneratedPopupDefaultFieldGroupErrors(actionName, values, validationContext, errors);
  }
  appendRunJsAuthoringErrors(actionName, values, validationContext, errors);

  return errors;
}

function appendRunJsAuthoringErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  try {
    errors.push(...collectRunJsAuthoringErrors(actionName, values, context));
  } catch (error: any) {
    if (shouldKeepExistingChartAuthoringErrors(error, errors)) {
      return;
    }
    if (isChartBadRequestError(error)) {
      pushChartBadRequestAuthoringError(errors, error, actionName === 'configure' ? '$.changes' : '$');
      return;
    }
    throw error;
  }
}

function isChartBadRequestError(error: any) {
  return error instanceof FlowSurfaceBadRequestError && String(error.message || '').startsWith('chart ');
}

function shouldKeepExistingChartAuthoringErrors(error: any, errors: AuthoringErrorInput[]) {
  return isChartBadRequestError(error) && errors.some((item) => item.details?.repairHint === CHART_REPAIR_HINT);
}

function pushChartBadRequestAuthoringError(
  errors: AuthoringErrorInput[],
  error: FlowSurfaceBadRequestError,
  fallbackPath: string,
) {
  const details = _.isPlainObject(error.options?.details) ? error.options.details : {};
  pushAuthoringError(errors, {
    path: typeof error.options?.path === 'string' && error.options.path ? error.options.path : fallbackPath,
    ruleId:
      typeof error.options?.ruleId === 'string' && error.options.ruleId
        ? error.options.ruleId
        : 'chart-configure-invalid',
    message: error.message,
    details: withChartRepairHint(details),
  });
}

async function collectNavigationGroupErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (actionName !== 'applyBlueprint' || values?.mode !== 'create' || !_.isPlainObject(values?.navigation?.group)) {
    return;
  }
  if (!_.isUndefined(values.navigation.group.routeId) || !context.findMenuGroupRoutesByTitle) {
    return;
  }
  const groupTitle = String(values.navigation.group.title || '').trim();
  if (!groupTitle) {
    return;
  }
  const matchedRoutes = await context.findMenuGroupRoutesByTitle(groupTitle, context.transaction);
  const rootMatchedRoutes = filterRootMenuGroupRoutes(matchedRoutes);
  if (rootMatchedRoutes.length <= 1) {
    return;
  }
  pushAuthoringError(errors, {
    path: '$.navigation.group.title',
    ruleId: 'navigation-group-title-ambiguous',
    message: `flowSurfaces authoring $.navigation.group.title '${groupTitle}' matches ${rootMatchedRoutes.length} existing root menu groups; pass navigation.group.routeId explicitly`,
    details: {
      title: groupTitle,
      parentMenuRouteId: null,
      matches: rootMatchedRoutes.length,
    },
  });
}

async function collectNavigationIconErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (actionName !== 'applyBlueprint' || values?.mode !== 'create') {
    return;
  }
  const group = _.isPlainObject(values?.navigation?.group) ? values.navigation.group : null;
  const groupRouteId = String(group?.routeId || '').trim();
  if (group && !groupRouteId && group.hideInMenu !== true) {
    const groupIcon = String(group.icon || '').trim();
    if (!groupIcon && (await shouldRequireNewNavigationGroupIcon(group, context))) {
      pushAuthoringError(errors, {
        path: '$.navigation.group.icon',
        ruleId: 'navigation-icon-required',
        message: 'flowSurfaces authoring $.navigation.group.icon is required when creating a visible navigation group',
        details: {
          repairHint:
            'Pass a valid Ant Design icon name such as AppstoreOutlined, DashboardOutlined, or FolderOpenOutlined.',
        },
      });
    } else if (groupIcon && !isValidAntDesignIconName(groupIcon)) {
      pushAuthoringError(errors, {
        path: '$.navigation.group.icon',
        ruleId: 'navigation-icon-unknown',
        message: 'flowSurfaces authoring $.navigation.group.icon must be a valid Ant Design icon name',
        details: {
          icon: groupIcon,
        },
      });
    }
  } else if (group && String(group.icon || '').trim() && !isValidAntDesignIconName(group.icon)) {
    pushAuthoringError(errors, {
      path: '$.navigation.group.icon',
      ruleId: 'navigation-icon-unknown',
      message: 'flowSurfaces authoring $.navigation.group.icon must be a valid Ant Design icon name',
      details: {
        icon: String(group.icon || '').trim(),
      },
    });
  }

  const item = _.isPlainObject(values?.navigation?.item) ? values.navigation.item : null;
  const itemIcon = String(item?.icon || '').trim();
  if (itemIcon && !isValidAntDesignIconName(itemIcon)) {
    pushAuthoringError(errors, {
      path: '$.navigation.item.icon',
      ruleId: 'navigation-icon-unknown',
      message: 'flowSurfaces authoring $.navigation.item.icon must be a valid Ant Design icon name',
      details: {
        icon: itemIcon,
      },
    });
  }
  const pageIcon = String(values?.page?.icon || '').trim();
  if (pageIcon && !isValidAntDesignIconName(pageIcon)) {
    pushAuthoringError(errors, {
      path: '$.page.icon',
      ruleId: 'navigation-icon-unknown',
      message:
        'flowSurfaces authoring $.page.icon must be a valid Ant Design icon name when used as the create-mode page route icon',
      details: {
        icon: pageIcon,
      },
    });
  }
}

async function shouldRequireNewNavigationGroupIcon(group: any, context: FlowSurfaceAuthoringValidationContext) {
  const groupTitle = String(group?.title || '').trim();
  if (!groupTitle || !context.findMenuGroupRoutesByTitle) {
    return true;
  }
  const matchedRoutes = await context.findMenuGroupRoutesByTitle(groupTitle, context.transaction);
  return filterRootMenuGroupRoutes(matchedRoutes).length === 0;
}

function filterRootMenuGroupRoutes(routes: any[]) {
  return _.castArray(routes || []).filter((route) =>
    routeParentIdMatches(readAuthoringRouteField(route, 'parentId'), null),
  );
}

function readAuthoringRouteField(route: any, key: string) {
  return route?.get?.(key) ?? route?.[key];
}

function routeParentIdMatches(routeParentId: any, parentId: any) {
  if (_.isNil(routeParentId) && _.isNil(parentId)) {
    return true;
  }
  return String(routeParentId ?? '') === String(parentId ?? '');
}

function isValidAntDesignIconName(value: any) {
  const normalized = String(value || '').trim();
  return !!normalized && ANT_DESIGN_ICON_NAMES.has(normalized);
}

function getAuthoringBlocks(actionName: FlowSurfaceAuthoringWriteAction, values: any) {
  if (actionName === 'addBlock') {
    return [{ block: values, path: '$' }];
  }
  if (actionName === 'addBlocks') {
    return _.castArray(values.blocks || []).map((block, index) => ({
      block,
      path: `$.blocks[${index}]`,
    }));
  }
  if (actionName === 'compose') {
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

function collectApplyBlueprintChartAssetErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (actionName !== 'applyBlueprint') {
    return;
  }
  const chartAssets = _.isPlainObject(values?.assets?.charts) ? values.assets.charts : {};
  collectChartAssetRegistryErrors(chartAssets, '$.assets.charts', context, errors);
  _.castArray(values?.tabs || []).forEach((tab, tabIndex) => {
    collectChartAssetBlockListErrors(tab?.blocks, `$.tabs[${tabIndex}].blocks`, chartAssets, errors);
  });
}

function collectChartAssetBlockListErrors(
  blocks: any,
  path: string,
  chartAssets: Record<string, any>,
  errors: AuthoringErrorInput[],
) {
  if (!Array.isArray(blocks)) {
    return;
  }
  blocks.forEach((block, index) => collectChartAssetBlockTreeErrors(block, `${path}[${index}]`, chartAssets, errors));
}

function collectChartAssetBlockTreeErrors(
  block: any,
  path: string,
  chartAssets: Record<string, any>,
  errors: AuthoringErrorInput[],
) {
  if (!_.isPlainObject(block)) {
    return;
  }
  collectChartBlockAssetReferenceErrors(block, path, chartAssets, errors);
  collectChartAssetBlockListErrors(block.blocks, `${path}.blocks`, chartAssets, errors);
  collectChartAssetBlockListErrors(block.popup?.blocks, `${path}.popup.blocks`, chartAssets, errors);
  ['actions', 'recordActions'].forEach((slot) => {
    if (!Array.isArray(block[slot])) {
      return;
    }
    block[slot].forEach((action: any, index: number) => {
      collectChartAssetBlockListErrors(
        action?.popup?.blocks,
        `${path}.${slot}[${index}].popup.blocks`,
        chartAssets,
        errors,
      );
      collectChartAssetBlockListErrors(
        action?.openView?.blocks,
        `${path}.${slot}[${index}].openView.blocks`,
        chartAssets,
        errors,
      );
    });
  });
  if (Array.isArray(block.fields)) {
    block.fields.forEach((field: any, index: number) => {
      collectChartAssetBlockListErrors(
        field?.popup?.blocks,
        `${path}.fields[${index}].popup.blocks`,
        chartAssets,
        errors,
      );
    });
  }
  Object.entries(HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[String(block.type || '').trim()] || {}).forEach(([, key]) => {
    collectChartAssetBlockListErrors(
      block.settings?.[key]?.blocks,
      `${path}.settings.${key}.blocks`,
      chartAssets,
      errors,
    );
  });
}

function withJsBlockRepairHint(details: Record<string, any> = {}) {
  return {
    ...details,
    requiredBlockType: 'jsBlock',
    fixStrategy: 'repair_same_block_type',
    repairHint: JS_BLOCK_REPAIR_HINT,
    agentInstruction: JS_BLOCK_AGENT_INSTRUCTION,
    repairExample: {
      inlineBlock: {
        type: 'jsBlock',
        settings: {
          showBlockCard: true,
          code: 'ctx.render("Replace this with the required rendered UI");',
        },
      },
      assetBlock: {
        assets: {
          scripts: {
            scriptKey: {
              code: 'ctx.render("Replace this with the required rendered UI");',
            },
          },
        },
        block: {
          type: 'jsBlock',
          script: 'scriptKey',
          settings: {
            showBlockCard: true,
          },
        },
      },
    },
    forbiddenFallbacks: JS_BLOCK_FORBIDDEN_FALLBACKS,
  };
}

function withChartRepairHint(details: Record<string, any> = {}) {
  return {
    ...details,
    requiredBlockType: 'chart',
    fixStrategy: 'repair_same_block_type',
    repairHint: CHART_REPAIR_HINT,
    agentInstruction: CHART_AGENT_INSTRUCTION,
    repairSteps: [
      'Keep the block type as chart.',
      'Define assets.charts.<key>.query and assets.charts.<key>.visual.',
      'Reference that asset from the chart block with block.chart = <key>.',
      'Retry the chart payload instead of replacing the chart with another block type or omitting it.',
    ],
    expectedShape: {
      settings: {
        query: {
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
        },
        visual: {
          mode: 'basic',
          type: 'bar',
          mappings: {
            x: 'status',
            y: 'employeeCount',
          },
        },
      },
      legacySettings: {
        configure: {
          query: {
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
          },
          chart: {
            option: {
              mode: 'basic',
              builder: {
                type: 'bar',
                xField: 'status',
                yField: 'employeeCount',
              },
            },
          },
        },
      },
      assets: {
        charts: {
          chartKey: {
            query: 'builder/sql query configuration',
            visual: 'basic/custom visual configuration',
          },
        },
      },
      block: {
        type: 'chart',
        chart: 'chartKey',
      },
    },
    repairExample: {
      settings: {
        query: {
          mode: 'builder',
          resource: {
            dataSourceKey: 'main',
            collectionName: '<collectionName>',
          },
          measures: [
            {
              field: 'id',
              aggregation: 'count',
              alias: 'recordCount',
            },
          ],
          dimensions: [
            {
              field: '<dimensionField>',
            },
          ],
        },
        visual: {
          mode: 'basic',
          type: 'bar',
          mappings: {
            x: '<dimensionField>',
            y: 'recordCount',
          },
        },
      },
      assets: {
        charts: {
          chartKey: {
            query: {
              mode: 'builder',
              resource: {
                dataSourceKey: 'main',
                collectionName: '<collectionName>',
              },
              measures: [
                {
                  field: 'id',
                  aggregation: 'count',
                  alias: 'recordCount',
                },
              ],
              dimensions: [
                {
                  field: '<dimensionField>',
                },
              ],
            },
            visual: {
              mode: 'basic',
              type: 'bar',
              mappings: {
                x: '<dimensionField>',
                y: 'recordCount',
              },
            },
          },
        },
      },
      block: {
        type: 'chart',
        chart: 'chartKey',
      },
    },
    forbiddenFallbacks: CHART_FORBIDDEN_FALLBACKS,
  };
}

function withUnsupportedChartVisualTypeHint(details: Record<string, any> = {}) {
  const jsBlockHint =
    'Supported basic chart visual types are: ' +
    `${CHART_BASIC_VISUAL_TYPE_LIST}. ` +
    'If the required visualization cannot be represented by these chart types, use a jsBlock instead.';
  return {
    ...details,
    fixStrategy: 'use_supported_chart_type_or_jsBlock',
    repairHint: jsBlockHint,
    agentInstruction: `${REPAIR_ALL_ERRORS_AGENT_INSTRUCTION} Use one of the supported chart visual types, or use a jsBlock when the requested visualization is outside the chart plugin capabilities.`,
    supportedVisualTypes: [...CHART_BASIC_VISUAL_TYPES],
    alternativeBlockType: 'jsBlock',
    alternativeHint: jsBlockHint,
    forbiddenFallbacks: CHART_FORBIDDEN_FALLBACKS.filter((item) => item !== 'jsBlock'),
  };
}

function collectLocalizedChartSettingsErrors(
  block: any,
  blockType: string | undefined,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (
    blockType !== 'chart' ||
    !STRICT_LOCALIZED_CHART_ACTIONS.has(context.authoringActionName as FlowSurfaceAuthoringWriteAction)
  ) {
    return;
  }

  const settingsPath = `${path}.settings`;
  if (!_.isUndefined(block.settings) && !_.isPlainObject(block.settings)) {
    pushAuthoringError(errors, {
      path: settingsPath,
      ruleId: 'chart-localized-settings-invalid',
      message: `flowSurfaces authoring ${settingsPath} must be an object for compose/addBlocks chart blocks`,
      details: withChartRepairHint(),
    });
    return;
  }

  const settings = _.isPlainObject(block.settings) ? block.settings : {};
  if (hasOwn(settings, 'configure')) {
    if (['query', 'visual', 'events'].some((key) => hasOwn(settings, key))) {
      pushAuthoringError(errors, {
        path: settingsPath,
        ruleId: 'chart-localized-settings-mixed-configure',
        message: `flowSurfaces authoring ${settingsPath} cannot mix legacy configure with query/visual/events`,
        details: withChartRepairHint(),
      });
      return;
    }
    collectLocalizedLegacyChartConfigureErrors(settings.configure, `${settingsPath}.configure`, errors);
    return;
  }

  if (!hasOwn(settings, 'query') && !hasOwn(settings, 'visual')) {
    return;
  }

  collectChartAssetQueryErrors(settings, settingsPath, context, errors);
  collectChartAssetVisualErrors(settings, settingsPath, errors);
}

function collectLocalizedLegacyChartConfigureErrors(configure: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(configure)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'chart-configure-invalid',
      message: `flowSurfaces authoring ${path} must be an object`,
      details: withChartRepairHint(),
    });
    return;
  }

  collectLegacyChartQueryCompatibilityErrors(configure.query, `${path}.query`, errors);
}

function collectLegacyChartQueryCompatibilityErrors(query: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(query)) {
    return;
  }

  collectChartQueryFilterOperatorErrors(query, path, errors);

  const hasResource = hasOwn(query, 'resource');
  const hasCollectionPath = hasOwn(query, 'collectionPath');
  if (!hasResource && !hasCollectionPath) {
    return;
  }

  const resource = hasResource
    ? normalizeLegacyChartResourceForValidation(query.resource, `${path}.resource`, errors)
    : undefined;
  const collectionPathResource = hasCollectionPath
    ? normalizeLegacyChartCollectionPathResourceForValidation(query.collectionPath, `${path}.collectionPath`, errors)
    : undefined;

  if (
    hasResource &&
    hasCollectionPath &&
    resource &&
    collectionPathResource &&
    !_.isEqual(resource, collectionPathResource)
  ) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'chart-legacy-query-resource-conflict',
      message: `flowSurfaces authoring ${path}.resource and ${path}.collectionPath must reference the same collection`,
      details: withChartRepairHint({
        resource,
        collectionPathResource,
      }),
    });
  }
}

function normalizeLegacyChartCollectionPathResource(collectionPath: any) {
  if (!Array.isArray(collectionPath)) {
    return undefined;
  }
  const collectionName = normalizeLegacyChartRequiredString(collectionPath[1]);
  if (!collectionName) {
    return undefined;
  }
  const dataSourceKey = normalizeLegacyChartCollectionPathDataSourceKey(collectionPath[0]);
  if (!dataSourceKey) {
    return undefined;
  }
  return {
    dataSourceKey,
    collectionName,
  };
}

function normalizeLegacyChartResourceForValidation(resource: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(resource)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'chart-legacy-query-resource-invalid',
      message: `flowSurfaces authoring ${path} must be an object with string collectionName`,
      details: withChartRepairHint(),
    });
    return undefined;
  }

  const collectionName = normalizeLegacyChartRequiredString(resource.collectionName);
  if (!collectionName) {
    pushAuthoringError(errors, {
      path: `${path}.collectionName`,
      ruleId: 'chart-legacy-query-resource-invalid',
      message: `flowSurfaces authoring ${path}.collectionName must be a non-empty string`,
      details: withChartRepairHint(),
    });
    return undefined;
  }

  const dataSourceKey = normalizeLegacyChartResourceDataSourceKey(resource.dataSourceKey);
  if (!dataSourceKey) {
    pushAuthoringError(errors, {
      path: `${path}.dataSourceKey`,
      ruleId: 'chart-legacy-query-resource-invalid',
      message: `flowSurfaces authoring ${path}.dataSourceKey must be a non-empty string when provided`,
      details: withChartRepairHint(),
    });
    return undefined;
  }

  return {
    dataSourceKey,
    collectionName,
  };
}

function normalizeLegacyChartCollectionPathResourceForValidation(
  collectionPath: any,
  path: string,
  errors: AuthoringErrorInput[],
) {
  const resource = normalizeLegacyChartCollectionPathResource(collectionPath);
  if (!resource) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'chart-legacy-query-collection-path-invalid',
      message: `flowSurfaces authoring ${path} must be [dataSourceKey, collectionName] with string values and a non-empty collectionName`,
      details: withChartRepairHint(),
    });
  }
  return resource;
}

function normalizeLegacyChartRequiredString(input: any) {
  if (typeof input !== 'string') {
    return undefined;
  }
  return input.trim() || undefined;
}

function normalizeLegacyChartResourceDataSourceKey(input: any) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return CHART_DEFAULT_DATA_SOURCE_KEY;
  }
  return normalizeLegacyChartRequiredString(input);
}

function normalizeLegacyChartCollectionPathDataSourceKey(input: any) {
  if (_.isUndefined(input) || _.isNull(input)) {
    return CHART_DEFAULT_DATA_SOURCE_KEY;
  }
  if (typeof input === 'string' && !input.trim()) {
    return CHART_DEFAULT_DATA_SOURCE_KEY;
  }
  return normalizeLegacyChartRequiredString(input);
}

function collectChartBlockAssetReferenceErrors(
  block: any,
  path: string,
  chartAssets: Record<string, any>,
  errors: AuthoringErrorInput[],
) {
  if (!CHART_BLOCK_TYPES.has(String(block?.type || '').trim())) {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(block, 'stepParams')) {
    pushAuthoringError(errors, {
      path: `${path}.stepParams`,
      ruleId: 'chart-block-step-params-unsupported',
      message: `flowSurfaces authoring ${path}.stepParams is not accepted on public chart blocks; put chart configuration under assets.charts and reference it with block.chart`,
      details: withChartRepairHint(),
    });
  }
  const chartKey = String(block.chart || '').trim();
  if (!chartKey) {
    pushAuthoringError(errors, {
      path: `${path}.chart`,
      ruleId: 'chart-block-asset-reference-required',
      message: `flowSurfaces authoring ${path}.chart must reference one key from assets.charts`,
      details: withChartRepairHint(),
    });
    return;
  }
  if (!_.isPlainObject(chartAssets?.[chartKey])) {
    pushAuthoringError(errors, {
      path: `${path}.chart`,
      ruleId: 'chart-block-asset-reference-missing',
      message: `flowSurfaces authoring ${path}.chart references missing chart asset '${chartKey}'`,
      details: withChartRepairHint({
        chartKey,
      }),
    });
  }
}

function collectChartAssetRegistryErrors(
  charts: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (!_.isPlainObject(charts)) {
    return;
  }
  Object.entries(charts).forEach(([key, asset]) => {
    const assetPath = `${path}.${key}`;
    if (!_.isPlainObject(asset)) {
      pushAuthoringError(errors, {
        path: assetPath,
        ruleId: 'chart-asset-invalid',
        message: `flowSurfaces authoring ${assetPath} must be an object`,
        details: withChartRepairHint(),
      });
      return;
    }
    collectChartAssetQueryErrors(asset, assetPath, context, errors);
    collectChartAssetVisualErrors(asset, assetPath, errors);
  });
}

function collectChartAssetQueryErrors(
  asset: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const query = asset.query;
  if (!_.isPlainObject(query)) {
    pushAuthoringError(errors, {
      path: `${path}.query`,
      ruleId: 'chart-query-missing',
      message: `flowSurfaces authoring ${path}.query is required`,
      details: withChartRepairHint(),
    });
    return;
  }
  const mode = String(query.mode || 'builder').trim();
  if (!CHART_QUERY_MODE_SET.has(mode as any)) {
    pushAuthoringError(errors, {
      path: `${path}.query.mode`,
      ruleId: 'chart-query-mode-unsupported',
      message: `flowSurfaces authoring ${path}.query.mode '${mode}' is not supported`,
      details: withChartRepairHint({
        mode,
      }),
    });
    return;
  }
  if (mode === 'sql') {
    collectSqlChartAssetQueryErrors(query, path, errors);
    return;
  }
  collectBuilderChartAssetQueryErrors(query, path, context, errors);
}

function collectBuilderChartAssetQueryErrors(
  query: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const resource = _.isPlainObject(query.resource) ? query.resource : null;
  if (!String(resource?.collectionName || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.query.resource`,
      ruleId: 'chart-builder-query-resource-missing',
      message: `flowSurfaces authoring ${path}.query.resource.collectionName is required for builder chart assets`,
      details: withChartRepairHint(),
    });
  }
  if (!Array.isArray(query.measures) || !query.measures.length) {
    pushAuthoringError(errors, {
      path: `${path}.query.measures`,
      ruleId: 'chart-builder-query-measures-missing',
      message: `flowSurfaces authoring ${path}.query.measures must include at least one measure`,
      details: withChartRepairHint(),
    });
  }
  collectForbiddenObjectKeyErrors(
    query,
    `${path}.query`,
    CHART_BUILDER_QUERY_FORBIDDEN_KEYS,
    'chart-builder-query-forbidden-keys',
    errors,
    withChartRepairHint(),
  );
  collectChartQueryFilterOperatorErrors(query, `${path}.query`, errors, context);
  collectBuilderChartAssetFieldErrors(query, path, context, errors);
}

type FlowSurfaceDateConditionFieldContext = {
  field?: any;
  fieldPath?: string;
  fieldMeta?: {
    type?: string;
    interface?: string;
  };
};

type FlowSurfaceDateConditionFieldResolver = (fieldPath: string) => FlowSurfaceDateConditionFieldContext | null;

const AUTHORABLE_REACTION_SCALAR_CONTEXT_PATHS = new Set(['role', 'locale', 'token', 'deviceType']);
const AUTHORABLE_REACTION_CONTEXT_ROOTS = new Set([
  'user',
  'collection',
  'formValues',
  'record',
  'item',
  'popup',
  'urlSearchParams',
]);

function collectChartQueryFilterOperatorErrors(
  query: any,
  path: string,
  errors: AuthoringErrorInput[],
  context?: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(query) || !hasOwn(query, 'filter')) {
    return;
  }
  collectChartFilterOperatorErrors(
    query.filter,
    `${path}.filter`,
    errors,
    createChartQueryDateConditionFieldResolver(query, context),
  );
}

function collectChartFilterOperatorErrors(
  filter: any,
  path: string,
  errors: AuthoringErrorInput[],
  resolveField?: FlowSurfaceDateConditionFieldResolver | null,
) {
  if (_.isUndefined(filter) || _.isNull(filter) || !_.isPlainObject(filter)) {
    return;
  }
  if (Array.isArray(filter.items)) {
    collectChartFilterGroupOperatorErrors(filter.items, `${path}.items`, errors, resolveField);
    return;
  }
  collectBackendQueryFilterOperatorErrors(filter, path, errors, resolveField);
}

function collectChartFilterGroupOperatorErrors(
  items: any[],
  path: string,
  errors: AuthoringErrorInput[],
  resolveField?: FlowSurfaceDateConditionFieldResolver | null,
) {
  items.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!_.isPlainObject(item)) {
      return;
    }
    if (Array.isArray(item.items)) {
      collectChartFilterGroupOperatorErrors(item.items, `${itemPath}.items`, errors, resolveField);
      return;
    }
    if (hasOwn(item, 'operator')) {
      collectChartFilterOperatorError(item.operator, `${itemPath}.operator`, errors);
      const fieldPath = String(item.path || item.field || '').trim();
      collectChartFilterDateValueError(
        item.operator,
        item.value,
        `${itemPath}.value`,
        errors,
        fieldPath ? resolveField?.(fieldPath) || { fieldPath } : undefined,
      );
    }
  });
}

function collectBackendQueryFilterOperatorErrors(
  filter: Record<string, any>,
  path: string,
  errors: AuthoringErrorInput[],
  resolveField?: FlowSurfaceDateConditionFieldResolver | null,
) {
  Object.entries(filter).forEach(([field, condition]) => {
    const fieldPath = `${path}.${field}`;
    if ((field === '$and' || field === '$or') && Array.isArray(condition)) {
      condition.forEach((operand, index) =>
        collectChartFilterOperatorErrors(operand, `${fieldPath}[${index}]`, errors, resolveField),
      );
      return;
    }
    if (!_.isPlainObject(condition)) {
      return;
    }
    Object.keys(condition).forEach((operator) => {
      if (operator === '$and' || operator === '$or') {
        collectChartFilterOperatorErrors({ [operator]: condition[operator] }, fieldPath, errors, resolveField);
        return;
      }
      collectChartFilterOperatorError(operator, `${fieldPath}.${operator}`, errors);
      collectChartFilterDateValueError(
        operator,
        condition[operator],
        `${fieldPath}.${operator}`,
        errors,
        resolveField?.(field) || { fieldPath: field },
      );
    });
  });
}

function collectChartFilterOperatorError(operator: unknown, path: string, errors: AuthoringErrorInput[]) {
  try {
    assertFlowSurfaceFilterOperator(operator, path);
  } catch (error) {
    if (error instanceof FlowSurfaceBadRequestError) {
      pushChartBadRequestAuthoringError(errors, error, path);
      return;
    }
    throw error;
  }
}

function collectChartFilterDateValueError(
  operator: unknown,
  value: unknown,
  path: string,
  errors: AuthoringErrorInput[],
  fieldContext?: FlowSurfaceDateConditionFieldContext | null,
) {
  const fieldMeta = getDateConditionFieldContextMeta(fieldContext);
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : '';
  if (!FLOW_SURFACE_DATE_FILTER_OPERATORS.has(normalizedOperator) && !isFlowSurfaceDateLikeFieldMeta(fieldMeta)) {
    return;
  }
  try {
    normalizeFlowSurfaceDateConditionValue(operator, value, path, {
      fieldPath: fieldContext?.fieldPath,
      fieldType: fieldMeta.type,
      fieldInterface: fieldMeta.interface,
    });
  } catch (error) {
    if (error instanceof FlowSurfaceBadRequestError) {
      pushChartBadRequestAuthoringError(errors, error, path);
      return;
    }
    throw error;
  }
}

function createChartQueryDateConditionFieldResolver(
  query: any,
  context?: FlowSurfaceAuthoringValidationContext,
): FlowSurfaceDateConditionFieldResolver | null {
  const resource = _.isPlainObject(query?.resource) ? query.resource : null;
  const collectionName = String(resource?.collectionName || '').trim();
  if (!collectionName || typeof context?.getCollection !== 'function') {
    return null;
  }
  const dataSourceKey = String(resource?.dataSourceKey || 'main').trim() || 'main';
  const collection = context.getCollection(dataSourceKey, collectionName);
  if (!collection) {
    return null;
  }
  return (fieldPath: string) => {
    const normalizedFieldPath = normalizeFieldPath(fieldPath);
    const resolved = resolveDefaultFilterFieldPath(collection, normalizedFieldPath, dataSourceKey, context);
    return {
      fieldPath,
      field: resolved.field,
    };
  };
}

function getDateConditionFieldMeta(field: any) {
  return {
    type: getFieldType(field),
    interface: getFieldInterface(field),
  };
}

function getDateConditionFieldContextMeta(fieldContext?: FlowSurfaceDateConditionFieldContext | null) {
  return {
    ...getDateConditionFieldMeta(fieldContext?.field),
    ...(fieldContext?.fieldMeta || {}),
  };
}

function normalizeChartAssetFieldPath(input: any) {
  if (Array.isArray(input)) {
    return input
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join('.');
  }
  return String(input || '').trim();
}

function collectBuilderChartAssetFieldErrors(
  query: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const resource = _.isPlainObject(query.resource) ? query.resource : null;
  const collectionName = String(resource?.collectionName || '').trim();
  if (!collectionName || typeof context.getCollection !== 'function') {
    return;
  }
  const dataSourceKey = String(resource?.dataSourceKey || 'main').trim() || 'main';
  const collection = context.getCollection(dataSourceKey, collectionName);
  if (!collection) {
    return;
  }

  const selections = [
    ..._.castArray(query.measures || []).map((selection, index) => ({
      selection,
      kind: 'measure',
      fieldPath: `${path}.query.measures[${index}].field`,
    })),
    ..._.castArray(query.dimensions || []).map((selection, index) => ({
      selection,
      kind: 'dimension',
      fieldPath: `${path}.query.dimensions[${index}].field`,
    })),
  ];

  for (const item of selections) {
    if (!_.isPlainObject(item.selection)) {
      continue;
    }
    const fieldPath = normalizeChartAssetFieldPath(item.selection.field);
    if (!fieldPath) {
      continue;
    }
    const fieldPathParts = fieldPath.split('.').filter(Boolean);
    const isCountMeasureSelection =
      item.kind === 'measure' &&
      String(item.selection?.aggregation || '').trim() === 'count' &&
      !item.selection?.distinct;
    if (fieldPathParts.length > 1 && !isCountMeasureSelection) {
      const directAssociationPath = fieldPathParts[0];
      const directAssociationField = resolveFieldFromCollection(collection, directAssociationPath);
      const directAssociationTargetCollection =
        directAssociationField && isAssociationField(directAssociationField)
          ? resolveFieldTargetCollection(
              directAssociationField,
              dataSourceKey,
              (resolvedDataSourceKey, targetCollection) =>
                context.getCollection?.(resolvedDataSourceKey, targetCollection),
            )
          : null;
      const invalidDirectSubfield = directAssociationTargetCollection
        ? getInvalidChartBuilderRelationDirectSubfieldDetails({
            associationPathName: directAssociationPath,
            selectedSubfieldPath: fieldPathParts.slice(1).join('.'),
            targetCollection: directAssociationTargetCollection,
          })
        : null;
      if (invalidDirectSubfield) {
        pushAuthoringError(errors, {
          path: item.fieldPath,
          ruleId: 'chart-builder-query-relation-direct-subfield-required',
          message: `flowSurfaces authoring ${
            item.fieldPath
          } must reference a direct scalar child field under relation '${
            invalidDirectSubfield.associationPath
          }'. ${formatChartBuilderSupportedRelationSubfields(
            invalidDirectSubfield.associationPath,
            invalidDirectSubfield.supportedFields,
          )}`,
          details: withChartRepairHint({
            fieldPath,
            dataSourceKey,
            collectionName,
            ...invalidDirectSubfield,
          }),
        });
        continue;
      }
    }
    const field = resolveFieldFromCollection(collection, fieldPath);
    const associationPath = fieldPath.includes('.') ? fieldPath.split('.').slice(0, -1).join('.') : '';
    const leafFieldName = fieldPath.split('.').slice(-1)[0];
    const associationField = associationPath ? resolveFieldFromCollection(collection, associationPath) : null;
    const associationTargetCollection =
      associationField && isAssociationField(associationField)
        ? resolveFieldTargetCollection(
            associationField,
            dataSourceKey,
            (resolvedDataSourceKey, targetCollection) =>
              context.getCollection?.(resolvedDataSourceKey, targetCollection),
          )
        : null;
    const leafModelAttributes = getCollectionModelAttributes(associationTargetCollection || collection);
    const hasLeafModelAttribute = Object.prototype.hasOwnProperty.call(leafModelAttributes, leafFieldName);
    const isCountMeasureRelationSubfield =
      item.kind === 'measure' &&
      String(item.selection?.aggregation || '').trim() === 'count' &&
      !item.selection?.distinct &&
      associationField &&
      isAssociationField(associationField);
    const unsupportedRelationSubfield = associationTargetCollection
      ? getUnsupportedChartBuilderRelationSubfieldDetails({
          associationPathName: associationPath,
          leafFieldName,
          leafField: field,
          targetCollection: associationTargetCollection,
        })
      : null;
    if (!field) {
      const hasConcreteField = associationTargetCollection
        ? hasLeafModelAttribute || collectionHasConcreteField(associationTargetCollection, leafFieldName)
        : collectionHasConcreteField(collection, fieldPath);
      if (!hasConcreteField) {
        pushAuthoringError(errors, {
          path: item.fieldPath,
          ruleId: 'chart-builder-query-field-unknown',
          message: `flowSurfaces authoring ${item.fieldPath} references unknown field '${fieldPath}' on collection '${dataSourceKey}.${collectionName}'`,
          details: withChartRepairHint({
            fieldPath,
            dataSourceKey,
            collectionName,
          }),
        });
        continue;
      }
    }
    if (!fieldPath.includes('.') && field && isAssociationField(field)) {
      const suggestion = resolveChartBuilderAssociationSubfieldSuggestion(
        fieldPath,
        field,
        dataSourceKey,
        context.getCollection,
      );
      pushAuthoringError(errors, {
        path: item.fieldPath,
        ruleId: 'chart-builder-query-association-field-requires-subfield',
        message: `flowSurfaces authoring ${item.fieldPath} references association field '${fieldPath}' directly; use scalar subfield '${suggestion.suggestedFieldPath}' for builder charts`,
        details: withChartRepairHint({
          fieldPath,
          dataSourceKey,
          collectionName,
          ...suggestion,
        }),
      });
    }
    if (isCountMeasureRelationSubfield) {
      pushAuthoringError(errors, {
        path: item.fieldPath,
        ruleId: 'chart-builder-query-count-measure-relation-subfield',
        message: `flowSurfaces authoring ${item.fieldPath} counts relation subfield '${fieldPath}'; count a scalar base field such as 'id' and keep '${fieldPath}' as a dimension`,
        details: withChartRepairHint({
          fieldPath,
          dataSourceKey,
          collectionName,
          suggestedMeasure: {
            field: 'id',
            aggregation: 'count',
            alias: String(item.selection?.alias || '').trim() || 'recordCount',
          },
          suggestedDimension: {
            field: fieldPath,
          },
        }),
      });
      continue;
    }
    if (unsupportedRelationSubfield) {
      pushAuthoringError(errors, {
        path: item.fieldPath,
        ruleId: 'chart-builder-query-relation-subfield-column-unsupported',
        message: `flowSurfaces authoring ${
          item.fieldPath
        } references relation subfield '${fieldPath}', but current chart builder SQL generation cannot query relation subfield '${
          unsupportedRelationSubfield.leafFieldName
        }' because its database column is '${
          unsupportedRelationSubfield.columnName
        }'. ${formatChartBuilderSupportedRelationSubfields(
          associationPath,
          unsupportedRelationSubfield.supportedFields,
        )}`,
        details: withChartRepairHint({
          fieldPath,
          dataSourceKey,
          collectionName,
          ...unsupportedRelationSubfield,
        }),
      });
    }
  }
}

function resolveChartBuilderAssociationSubfieldSuggestion(
  fieldPath: string,
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
) {
  try {
    const resolved = resolveAssociationSafeTitleField(field, dataSourceKey, getCollection, { fieldPath });
    const titleField = resolved?.fieldName ? String(resolved.fieldName).trim() : '';
    if (titleField) {
      return {
        suggestedFieldPath: `${fieldPath}.${titleField}`,
        suggestedTitleField: titleField,
        targetCollectionName: getCollectionName(resolved?.targetCollection) || undefined,
      };
    }
  } catch {
    // Fall back to generic guidance; the title-field validator reports exact title-field problems elsewhere.
  }
  return {
    suggestedFieldPath: `${fieldPath}.<field>`,
  };
}

function collectSqlChartAssetQueryErrors(query: any, path: string, errors: AuthoringErrorInput[]) {
  if (!String(query.sql || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.query.sql`,
      ruleId: 'chart-sql-query-text-missing',
      message: `flowSurfaces authoring ${path}.query.sql must be a non-empty string`,
      details: withChartRepairHint(),
    });
  }
  collectForbiddenObjectKeyErrors(
    query,
    `${path}.query`,
    CHART_SQL_QUERY_FORBIDDEN_KEYS,
    'chart-sql-query-forbidden-builder-keys',
    errors,
    withChartRepairHint(),
  );
}

function collectChartAssetVisualErrors(asset: any, path: string, errors: AuthoringErrorInput[]) {
  const visual = asset.visual;
  if (!_.isPlainObject(visual)) {
    pushAuthoringError(errors, {
      path: `${path}.visual`,
      ruleId: 'chart-visual-missing',
      message: `flowSurfaces authoring ${path}.visual is required`,
      details: withChartRepairHint(),
    });
    return;
  }
  collectForbiddenObjectKeyErrors(
    visual,
    `${path}.visual`,
    CHART_VISUAL_LEGACY_BUILDER_KEYS,
    'chart-visual-legacy-builder-keys-unsupported',
    errors,
    withChartRepairHint(),
  );
  const mode = String(visual.mode || 'basic').trim();
  if (!CHART_VISUAL_MODE_SET.has(mode as any)) {
    pushAuthoringError(errors, {
      path: `${path}.visual.mode`,
      ruleId: 'chart-visual-mode-unsupported',
      message: `flowSurfaces authoring ${path}.visual.mode '${mode}' is not supported`,
      details: withChartRepairHint({
        mode,
      }),
    });
    return;
  }
  if (mode === 'custom') {
    if (!String(visual.raw || '').trim()) {
      pushAuthoringError(errors, {
        path: `${path}.visual.raw`,
        ruleId: 'chart-custom-visual-raw-missing',
        message: `flowSurfaces authoring ${path}.visual.raw is required for custom chart assets`,
        details: withChartRepairHint(),
      });
    }
    collectForbiddenObjectKeyErrors(
      visual,
      `${path}.visual`,
      CHART_CUSTOM_VISUAL_FORBIDDEN_KEYS,
      'chart-custom-visual-public-keys-unsupported',
      errors,
      withChartRepairHint(),
    );
    return;
  }
  const type = String(visual.type || '').trim();
  if (!type) {
    pushAuthoringError(errors, {
      path: `${path}.visual.type`,
      ruleId: 'chart-visual-type-missing',
      message: `flowSurfaces authoring ${path}.visual.type is required for basic chart assets`,
      details: withChartRepairHint(),
    });
  } else if (!CHART_BASIC_VISUAL_TYPE_SET.has(type as any)) {
    pushAuthoringError(errors, {
      path: `${path}.visual.type`,
      ruleId: 'chart-visual-type-unsupported',
      message: `flowSurfaces authoring ${path}.visual.type '${type}' is not supported. Supported basic chart visual types: ${CHART_BASIC_VISUAL_TYPE_LIST}. If these types do not satisfy the requirement, use a jsBlock instead.`,
      details: withUnsupportedChartVisualTypeHint({
        type,
      }),
    });
  }
  if (!_.isPlainObject(visual.mappings)) {
    pushAuthoringError(errors, {
      path: `${path}.visual.mappings`,
      ruleId: 'chart-visual-mappings-missing',
      message: `flowSurfaces authoring ${path}.visual.mappings is required for basic chart assets`,
      details: withChartRepairHint(),
    });
    return;
  }
  const missingMappings = _.castArray(CHART_REQUIRED_VISUAL_MAPPINGS_BY_TYPE[type] || []).filter(
    (mappingKey) => !String(visual.mappings[mappingKey] || '').trim(),
  );
  if (missingMappings.length) {
    pushAuthoringError(errors, {
      path: `${path}.visual.mappings`,
      ruleId: 'chart-visual-required-mappings-missing',
      message: `flowSurfaces authoring ${path}.visual.mappings is missing required keys: ${missingMappings.join(', ')}`,
      details: withChartRepairHint({
        type,
        missingMappings,
      }),
    });
  }
}

function collectForbiddenObjectKeyErrors(
  value: any,
  path: string,
  forbiddenKeys: Set<string>,
  ruleId: string,
  errors: AuthoringErrorInput[],
  details: Record<string, any> = {},
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const keys = Object.keys(value).filter((key) => forbiddenKeys.has(key));
  if (!keys.length) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId,
    message: `flowSurfaces authoring ${path} does not accept keys: ${keys.join(', ')}`,
    details: {
      ...details,
      keys,
    },
  });
}

function collectDefaultsShapeErrors(defaults: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(defaults)) {
    return;
  }
  if (!_.isPlainObject(defaults)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(defaults, path, DEFAULTS_ALLOWED_KEYS, 'defaults-unsupported-key', errors);
  collectDefaultCollectionsShapeErrors(defaults.collections, `${path}.collections`, errors, {
    skipCollectionNames: getMainDataSourceDefaultCollectionNames(defaults),
  });
  collectDefaultDataSourcesShapeErrors(defaults.dataSources, `${path}.dataSources`, errors);
}

function collectDefaultCollectionsShapeErrors(
  collections: any,
  path: string,
  errors: AuthoringErrorInput[],
  options: { skipCollectionNames?: Set<string> } = {},
) {
  if (_.isUndefined(collections)) {
    return;
  }
  if (!_.isPlainObject(collections)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-collections-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  Object.entries(collections).forEach(([collectionName, collectionDefaults]) => {
    const normalizedCollectionName = String(collectionName || '').trim();
    if (!normalizedCollectionName) {
      pushAuthoringError(errors, {
        path,
        ruleId: 'defaults-collection-name-required',
        message: `flowSurfaces authoring ${path} keys must be non-empty collection names`,
      });
      return;
    }
    if (options.skipCollectionNames?.has(normalizedCollectionName)) {
      return;
    }
    collectDefaultCollectionShapeErrors(collectionDefaults, `${path}.${normalizedCollectionName}`, errors);
  });
}

function collectDefaultDataSourcesShapeErrors(dataSources: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(dataSources)) {
    return;
  }
  if (!_.isPlainObject(dataSources)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-dataSources-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  const dataSourceDefaultsByKey = dataSources as Record<string, any>;
  Object.entries(dataSourceDefaultsByKey).forEach(([dataSourceKey, dataSourceDefaults]) => {
    const normalizedDataSourceKey = String(dataSourceKey || '').trim();
    if (!normalizedDataSourceKey) {
      pushAuthoringError(errors, {
        path,
        ruleId: 'defaults-dataSource-name-required',
        message: `flowSurfaces authoring ${path} keys must be non-empty data source names`,
      });
      return;
    }
    const dataSourcePath = `${path}.${normalizedDataSourceKey}`;
    if (!_.isPlainObject(dataSourceDefaults)) {
      pushAuthoringError(errors, {
        path: dataSourcePath,
        ruleId: 'defaults-dataSource-invalid-shape',
        message: `flowSurfaces authoring ${dataSourcePath} must be an object`,
      });
      return;
    }
    collectUnsupportedKeysErrors(
      dataSourceDefaults,
      dataSourcePath,
      ['collections'],
      'defaults-dataSource-unsupported-key',
      errors,
    );
    collectDefaultCollectionsShapeErrors(dataSourceDefaults.collections, `${dataSourcePath}.collections`, errors);
  });
}

function collectDefaultCollectionShapeErrors(collectionDefaults: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(collectionDefaults)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-collection-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    collectionDefaults,
    path,
    DEFAULT_COLLECTION_ALLOWED_KEYS,
    'defaults-collection-unsupported-key',
    errors,
  );
  collectDefaultFieldGroupsShapeErrors(collectionDefaults.fieldGroups, `${path}.fieldGroups`, errors);
  collectDefaultPopupsShapeErrors(collectionDefaults.popups, `${path}.popups`, errors);
  collectDefaultFormBehaviorShapeErrors(collectionDefaults.formBehavior, `${path}.formBehavior`, errors);
  collectDefaultFormBehaviorDescriptionReviewShapeErrors(
    collectionDefaults.formBehaviorDescriptionReview,
    `${path}.formBehaviorDescriptionReview`,
    errors,
  );
}

function collectDefaultFieldGroupsShapeErrors(fieldGroups: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(fieldGroups)) {
    return;
  }
  if (!Array.isArray(fieldGroups) || !fieldGroups.length) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-fieldGroups-invalid-shape',
      message: `flowSurfaces authoring ${path} must be a non-empty array`,
    });
    return;
  }
  fieldGroups.forEach((group, groupIndex) => {
    const groupPath = `${path}[${groupIndex}]`;
    if (!_.isPlainObject(group)) {
      pushAuthoringError(errors, {
        path: groupPath,
        ruleId: 'defaults-fieldGroups-group-invalid-shape',
        message: `flowSurfaces authoring ${groupPath} must be an object`,
      });
      return;
    }
    collectUnsupportedKeysErrors(
      group,
      groupPath,
      DEFAULT_FIELD_GROUP_ALLOWED_KEYS,
      'defaults-fieldGroups-group-unsupported-key',
      errors,
    );
    if (!String(group.title || '').trim()) {
      pushAuthoringError(errors, {
        path: `${groupPath}.title`,
        ruleId: 'defaults-fieldGroups-group-title-required',
        message: `flowSurfaces authoring ${groupPath}.title must be a non-empty string`,
      });
    }
    if (!Array.isArray(group.fields) || !group.fields.length) {
      pushAuthoringError(errors, {
        path: `${groupPath}.fields`,
        ruleId: 'defaults-fieldGroups-group-fields-required',
        message: `flowSurfaces authoring ${groupPath}.fields must be a non-empty array`,
      });
      return;
    }
    group.fields.forEach((field, fieldIndex) =>
      collectDefaultFieldShapeErrors(field, `${groupPath}.fields[${fieldIndex}]`, errors),
    );
  });
}

function collectDefaultFieldShapeErrors(field: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isString(field)) {
    if (!field.trim()) {
      pushAuthoringError(errors, {
        path,
        ruleId: 'defaults-fieldGroups-field-field-required',
        message: `flowSurfaces authoring ${path} must be a non-empty field path`,
      });
    }
    return;
  }
  if (!_.isPlainObject(field)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-fieldGroups-field-invalid-shape',
      message: `flowSurfaces authoring ${path} must be a string or an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    field,
    path,
    DEFAULT_FIELD_ALLOWED_KEYS,
    'defaults-fieldGroups-field-unsupported-key',
    errors,
  );
  if (!String(field.field || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.field`,
      ruleId: 'defaults-fieldGroups-field-field-required',
      message: `flowSurfaces authoring ${path}.field must be a non-empty string`,
    });
  }
  if (!_.isUndefined(field.titleField) && !String(field.titleField || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.titleField`,
      ruleId: 'defaults-fieldGroups-field-titleField-required',
      message: `flowSurfaces authoring ${path}.titleField must be a non-empty string`,
    });
  }
}

function collectDefaultFormBehaviorShapeErrors(formBehavior: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(formBehavior)) {
    return;
  }
  if (!_.isPlainObject(formBehavior)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-formBehavior-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    formBehavior,
    path,
    DEFAULT_FORM_BEHAVIOR_ALLOWED_KEYS,
    'defaults-formBehavior-unsupported-key',
    errors,
  );
  ['addNew', 'edit'].forEach((action) =>
    collectDefaultFormBehaviorSceneShapeErrors(formBehavior[action], `${path}.${action}`, errors),
  );
}

function collectDefaultFormBehaviorSceneShapeErrors(scene: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(scene)) {
    return;
  }
  if (!_.isPlainObject(scene)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-formBehavior-scene-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    scene,
    path,
    DEFAULT_FORM_BEHAVIOR_SCENE_ALLOWED_KEYS,
    'defaults-formBehavior-scene-unsupported-key',
    errors,
  );
  if (!_.isUndefined(scene.fields)) {
    if (!_.isPlainObject(scene.fields)) {
      pushAuthoringError(errors, {
        path: `${path}.fields`,
        ruleId: 'defaults-formBehavior-fields-invalid-shape',
        message: `flowSurfaces authoring ${path}.fields must be an object`,
      });
    } else {
      Object.entries(scene.fields).forEach(([fieldPath, fieldConfig]) => {
        const normalizedFieldPath = String(fieldPath || '').trim();
        if (!normalizedFieldPath) {
          pushAuthoringError(errors, {
            path: `${path}.fields`,
            ruleId: 'defaults-formBehavior-field-name-required',
            message: `flowSurfaces authoring ${path}.fields keys must be non-empty field paths`,
          });
          return;
        }
        collectDefaultFormBehaviorFieldShapeErrors(fieldConfig, `${path}.fields.${normalizedFieldPath}`, errors);
      });
    }
  }
  if (!_.isUndefined(scene.fieldLinkageRules) && !Array.isArray(scene.fieldLinkageRules)) {
    pushAuthoringError(errors, {
      path: `${path}.fieldLinkageRules`,
      ruleId: 'defaults-formBehavior-linkageRules-invalid-shape',
      message: `flowSurfaces authoring ${path}.fieldLinkageRules must be an array`,
    });
  }
}

function collectDefaultFormBehaviorDescriptionReviewShapeErrors(
  review: any,
  path: string,
  errors: AuthoringErrorInput[],
) {
  if (_.isUndefined(review)) {
    return;
  }
  if (!_.isPlainObject(review)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-formBehaviorDescriptionReview-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectDescriptionReviewUnsupportedKeysErrors(review, path, errors);
  if (!_.isPlainObject(review.fields) || !Object.keys(review.fields).length) {
    pushAuthoringError(errors, {
      path: `${path}.fields`,
      ruleId: 'defaults-formBehaviorDescriptionReview-fields-invalid-shape',
      message: `flowSurfaces authoring ${path}.fields must be a non-empty object keyed by field path`,
      details: buildDescriptionReviewMigrationDetails(),
    });
  } else {
    Object.entries(review.fields).forEach(([fieldPath, entry]) => {
      const normalizedFieldPath = String(fieldPath || '').trim();
      if (!normalizedFieldPath) {
        pushAuthoringError(errors, {
          path: `${path}.fields`,
          ruleId: 'defaults-formBehaviorDescriptionReview-field-required',
          message: `flowSurfaces authoring ${path}.fields keys must be non-empty field paths`,
        });
        return;
      }
      if (_.isNull(entry)) {
        return;
      }
      if (!_.isPlainObject(entry)) {
        pushAuthoringError(errors, {
          path: `${path}.fields.${normalizedFieldPath}`,
          ruleId: 'defaults-formBehaviorDescriptionReview-field-invalid-shape',
          message: `flowSurfaces authoring ${path}.fields.${normalizedFieldPath} must be null or an object`,
          details: buildDescriptionReviewMigrationDetails(normalizedFieldPath),
        });
        return;
      }
      collectUnsupportedKeysErrors(
        entry,
        `${path}.fields.${normalizedFieldPath}`,
        DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_FIELD_ALLOWED_KEYS,
        'defaults-formBehaviorDescriptionReview-field-unsupported-key',
        errors,
      );
    });
  }
}

function collectDescriptionReviewUnsupportedKeysErrors(
  review: Record<string, any>,
  path: string,
  errors: AuthoringErrorInput[],
) {
  const unsupportedKeys = Object.keys(review).filter(
    (key) => !DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_ALLOWED_KEYS.includes(key),
  );
  if (!unsupportedKeys.length) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'defaults-formBehaviorDescriptionReview-unsupported-key',
    message: `flowSurfaces authoring ${path} only accepts ${DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_ALLOWED_KEYS.join(
      ', ',
    )}; unsupported keys: ${unsupportedKeys.join(', ')}`,
    details: {
      allowedKeys: DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_ALLOWED_KEYS,
      unsupportedKeys,
      ...buildDescriptionReviewMigrationDetails(),
    },
  });
}

function buildDescriptionReviewMigrationDetails(field = 'fieldName') {
  return {
    reason:
      'formBehaviorDescriptionReview now uses a field-keyed review map; old fields arrays and hasTried are not supported.',
    allowedShape:
      'formBehaviorDescriptionReview.fields must be an object keyed by field path; each value is null or a review object with decision and optional reasonCode.',
    migrationExample: {
      formBehaviorDescriptionReview: {
        fields: {
          [field]: {
            decision: 'unsupported',
            reasonCode: 'ambiguous-description',
          },
        },
      },
    },
    fixOptions: [
      {
        type: 'migrateReviewFieldsMap',
        whenToUse: 'Use when the payload still uses fields: string[] or hasTried.',
        patchSkeleton: {
          defaults: {
            collections: {
              collectionName: {
                formBehaviorDescriptionReview: {
                  fields: {
                    [field]: {
                      decision: 'unsupported',
                      reasonCode: 'ambiguous-description',
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  };
}

function hasEffectiveDefaultFormBehaviorSettings(settings: any) {
  if (!_.isPlainObject(settings)) {
    return false;
  }
  return Object.entries(settings).some(([key, value]) => {
    if (_.isUndefined(value)) {
      return false;
    }
    if (key === 'rules') {
      return Array.isArray(value) && value.length > 0;
    }
    return true;
  });
}

function collectDefaultFormBehaviorCoverageByField(formBehavior: any) {
  const coverage = new Map<string, string[]>();
  const addCoverage = (fieldPath: any, source: string) => {
    const normalized = String(fieldPath || '').trim();
    if (!normalized) {
      return;
    }
    coverage.set(normalized, [...(coverage.get(normalized) || []), source]);
  };
  ['addNew', 'edit'].forEach((action) => {
    const scene = formBehavior?.[action];
    if (_.isPlainObject(scene?.fields)) {
      Object.keys(scene.fields).forEach((fieldPath) => {
        if (hasEffectiveDefaultFormBehaviorSettings(scene.fields[fieldPath]?.settings)) {
          addCoverage(fieldPath, `formBehavior.${action}.fields.${fieldPath}.settings`);
        }
      });
    }
    _.castArray(scene?.fieldLinkageRules || []).forEach((rule, ruleIndex) => {
      _.castArray(rule?.then || []).forEach((thenAction) => {
        if (String(thenAction?.type || '').trim() !== 'setFieldState') {
          return;
        }
        _.castArray(thenAction?.fieldPaths || []).forEach((fieldPath) => {
          addCoverage(fieldPath, `formBehavior.${action}.fieldLinkageRules[${ruleIndex}]`);
        });
      });
    });
  });
  return coverage;
}

function getDescriptionReviewFieldsMap(review: any) {
  return _.isPlainObject(review?.fields) ? review.fields : {};
}

function buildDescriptionReviewImplementedFixOptions(collection: string, field: string) {
  return [
    {
      type: 'implementRequired',
      whenToUse: 'Use when the description means this field is always required.',
      patchSkeleton: {
        defaults: {
          collections: {
            [collection]: {
              formBehavior: {
                addNew: {
                  fields: {
                    [field]: {
                      settings: {
                        required: true,
                      },
                    },
                  },
                },
                edit: {
                  fields: {
                    [field]: {
                      settings: {
                        required: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      type: 'implementConditionalRequired',
      whenToUse: 'Use when the description means this field is conditionally required.',
      patchSkeleton: {
        defaults: {
          collections: {
            [collection]: {
              formBehavior: {
                addNew: {
                  fieldLinkageRules: [
                    {
                      key: `description-${field}-required`,
                      when: {
                        logic: '$and',
                        items: [],
                      },
                      then: [
                        {
                          type: 'setFieldState',
                          fieldPaths: [field],
                          state: 'required',
                        },
                      ],
                    },
                  ],
                },
                edit: {
                  fieldLinkageRules: [
                    {
                      key: `description-${field}-required`,
                      when: {
                        logic: '$and',
                        items: [],
                      },
                      then: [
                        {
                          type: 'setFieldState',
                          fieldPaths: [field],
                          state: 'required',
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    {
      type: 'changeDecision',
      whenToUse: 'Use only when the description is not UI behavior or is unsupported.',
      patchSkeleton: {
        defaults: {
          collections: {
            [collection]: {
              formBehaviorDescriptionReview: {
                fields: {
                  [field]: {
                    decision: 'unsupported',
                    reasonCode: 'ambiguous-description',
                  },
                },
              },
            },
          },
        },
      },
    },
  ];
}

function buildDescriptionReviewErrorDetails(input: {
  collection: string;
  dataSourceKey?: string;
  field: string;
  description?: string;
  decision?: string;
  reason?: string;
  coverage?: string[];
  missingCoverage?: string[];
}) {
  return {
    collection: input.collection,
    ...(input.dataSourceKey ? { dataSourceKey: input.dataSourceKey } : {}),
    field: input.field,
    description: input.description || '',
    ...(input.decision ? { decision: input.decision } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
    ...(input.coverage?.length ? { coverage: input.coverage } : {}),
    ...(input.missingCoverage?.length ? { missingCoverage: input.missingCoverage } : {}),
    fixOptions: buildDescriptionReviewImplementedFixOptions(input.collection, input.field),
  };
}

type DescriptionReviewReactionCoverageTarget = {
  values: any;
  collection: string;
  dataSourceKey?: string;
  context: FlowSurfaceAuthoringValidationContext;
};

type ApplyBlueprintReactionTargetBlock = {
  block: any;
  context: FlowSurfaceAuthoringValidationContext;
  path: string;
};

function collectReactionCoverageByField(reaction: any, targetOptions?: DescriptionReviewReactionCoverageTarget) {
  const coverage = new Map<string, string[]>();
  const addCoverage = (fieldPath: any, source: string) => {
    const normalized = String(fieldPath || '').trim();
    if (!normalized) {
      return;
    }
    coverage.set(normalized, [...(coverage.get(normalized) || []), source]);
  };
  _.castArray(reaction?.items || []).forEach((item, itemIndex) => {
    if (!_.isPlainObject(item) || String(item.type || '').trim() !== 'setFieldLinkageRules') {
      return;
    }
    const targetMatch = targetOptions
      ? resolveApplicableDescriptionReviewReactionTargetBlock(item, targetOptions)
      : null;
    if (targetOptions && !targetMatch) {
      return;
    }
    _.castArray(item.rules || []).forEach((rule, ruleIndex) => {
      _.castArray(rule?.then || []).forEach((thenAction) => {
        if (String(thenAction?.type || '').trim() !== 'setFieldState') {
          return;
        }
        _.castArray(thenAction?.fieldPaths || []).forEach((fieldPath) => {
          if (targetMatch && !hasBlockFieldPath(targetMatch.block, fieldPath)) {
            return;
          }
          addCoverage(fieldPath, `reaction.items[${itemIndex}].rules[${ruleIndex}]`);
        });
      });
    });
  });
  return coverage;
}

function resolveApplicableDescriptionReviewReactionTargetBlock(
  item: any,
  options: DescriptionReviewReactionCoverageTarget,
): ApplyBlueprintReactionTargetBlock | null {
  const target = getReactionItemTarget(item);
  if (!target) {
    return null;
  }
  const match = findApplyBlueprintReactionTargetBlock(options.values, target, options.context);
  if (!match) {
    return null;
  }
  const blockType = String(match.block?.type || '').trim();
  if (!DEFAULT_FORM_BEHAVIOR_REACTION_FORM_BLOCK_TYPES.has(blockType)) {
    return null;
  }
  const targetCollection = getBlockCollectionName(match.block, match.context);
  if (targetCollection !== options.collection) {
    return null;
  }
  const targetDataSourceKey = normalizeDataSourceKey(getBlockDataSourceKey(match.block, match.context));
  if (targetDataSourceKey !== normalizeDataSourceKey(options.dataSourceKey)) {
    return null;
  }
  return match;
}

function getReactionItemTarget(item: any) {
  const rawTarget = item?.target ?? item?.targetKey ?? item?.targetBlock;
  return typeof rawTarget === 'string' ? rawTarget.trim() : '';
}

function findApplyBlueprintReactionTargetBlock(
  values: any,
  target: string,
  context: FlowSurfaceAuthoringValidationContext,
): ApplyBlueprintReactionTargetBlock | null {
  const normalizedTarget = String(target || '').trim();
  if (!normalizedTarget) {
    return null;
  }
  for (const [tabIndex, tab] of _.castArray(values?.tabs || []).entries()) {
    if (!_.isPlainObject(tab)) {
      continue;
    }
    const tabScope = String(tab.key || '').trim();
    for (const [blockIndex, block] of _.castArray(tab.blocks || []).entries()) {
      const match = findBlockReactionTargetMatch(
        block,
        `$.tabs[${tabIndex}].blocks[${blockIndex}]`,
        tabScope,
        context,
        normalizedTarget,
      );
      if (match) {
        return match;
      }
    }
  }
  return null;
}

function findBlockReactionTargetMatch(
  block: any,
  path: string,
  scopePrefix: string,
  context: FlowSurfaceAuthoringValidationContext,
  target: string,
): ApplyBlueprintReactionTargetBlock | null {
  if (!_.isPlainObject(block)) {
    return null;
  }
  const blockKey = String(block.key || '').trim();
  if (blockKey && getScopedLocalKeyCandidates(blockKey, scopePrefix).includes(target)) {
    return { block, context, path };
  }

  const scopedBlockKey = getScopedLocalKey(blockKey, scopePrefix);
  const descendantContext = getBlockDescendantValidationContext(block, context);
  const popupScopes = new Set<string>([scopePrefix]);
  if (scopedBlockKey) {
    popupScopes.add(`${scopedBlockKey}.popup`);
  }

  for (const popupScope of popupScopes) {
    const match = findPopupReactionTargetMatch(block.popup, `${path}.popup`, popupScope, descendantContext, target);
    if (match) {
      return match;
    }
  }

  const fieldPopupMatch = findFieldPopupReactionTargetMatch(
    block.fields,
    `${path}.fields`,
    block,
    scopedBlockKey || scopePrefix,
    context,
    target,
  );
  if (fieldPopupMatch) {
    return fieldPopupMatch;
  }
  for (const [groupIndex, group] of _.castArray(block.fieldGroups || []).entries()) {
    const match = findFieldPopupReactionTargetMatch(
      group?.fields,
      `${path}.fieldGroups[${groupIndex}].fields`,
      block,
      scopedBlockKey || scopePrefix,
      context,
      target,
    );
    if (match) {
      return match;
    }
  }

  for (const slot of ['actions', 'recordActions']) {
    for (const [actionIndex, action] of _.castArray(block[slot] || []).entries()) {
      if (!_.isPlainObject(action) || !_.isPlainObject(action.popup)) {
        continue;
      }
      const actionKey = String(action.key || '').trim();
      const actionScopes = new Set<string>([scopePrefix]);
      if (actionKey && scopedBlockKey) {
        actionScopes.add(`${scopedBlockKey}.${slot}.${actionKey}`);
        actionScopes.add(`${scopedBlockKey}.${actionKey}`);
      }
      for (const actionScope of actionScopes) {
        const match = findPopupReactionTargetMatch(
          action.popup,
          `${path}.${slot}[${actionIndex}].popup`,
          actionScope,
          descendantContext,
          target,
        );
        if (match) {
          return match;
        }
      }
    }
  }

  const hiddenPopupKeys = HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[String(block.type || '').trim()] || [];
  for (const key of hiddenPopupKeys) {
    if (!_.isPlainObject(block.settings?.[key])) {
      continue;
    }
    const hiddenScope = scopedBlockKey ? `${scopedBlockKey}.settings.${key}` : scopePrefix;
    const match = findPopupReactionTargetMatch(
      block.settings[key],
      `${path}.settings.${key}`,
      hiddenScope,
      descendantContext,
      target,
    );
    if (match) {
      return match;
    }
  }

  for (const [childIndex, childBlock] of _.castArray(block.blocks || []).entries()) {
    const match = findBlockReactionTargetMatch(
      childBlock,
      `${path}.blocks[${childIndex}]`,
      scopePrefix,
      descendantContext,
      target,
    );
    if (match) {
      return match;
    }
  }
  return null;
}

function findPopupReactionTargetMatch(
  popup: any,
  path: string,
  scopePrefix: string,
  context: FlowSurfaceAuthoringValidationContext,
  target: string,
) {
  if (!_.isPlainObject(popup)) {
    return null;
  }
  for (const [blockIndex, block] of _.castArray(popup.blocks || []).entries()) {
    const match = findBlockReactionTargetMatch(block, `${path}.blocks[${blockIndex}]`, scopePrefix, context, target);
    if (match) {
      return match;
    }
  }
  return null;
}

function findFieldPopupReactionTargetMatch(
  fields: any,
  path: string,
  block: any,
  fieldScopePrefix: string,
  context: FlowSurfaceAuthoringValidationContext,
  target: string,
) {
  for (const [fieldIndex, field] of _.castArray(fields || []).entries()) {
    if (!_.isPlainObject(field) || !_.isPlainObject(field.popup)) {
      continue;
    }
    const fieldKey = getFieldReactionTargetLocalKey(field);
    if (!fieldKey) {
      continue;
    }
    const fieldPopupContext = getFieldPopupValidationContext(field, block, context);
    const scopedFieldKey = getScopedLocalKey(fieldKey, fieldScopePrefix);
    const fieldPopupScopes = new Set<string>();
    if (scopedFieldKey) {
      fieldPopupScopes.add(`${scopedFieldKey}.popup`);
    }
    if (fieldScopePrefix) {
      fieldPopupScopes.add(`${fieldScopePrefix}.fields.${fieldKey}`);
    }
    for (const popupScope of fieldPopupScopes) {
      const match = findPopupReactionTargetMatch(
        field.popup,
        `${path}[${fieldIndex}].popup`,
        popupScope,
        fieldPopupContext,
        target,
      );
      if (match) {
        return match;
      }
    }
  }
  return null;
}

function hasBlockFieldPath(block: any, fieldPath: any) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  if (!normalizedFieldPath) {
    return false;
  }
  const hasExplicitFields =
    Object.prototype.hasOwnProperty.call(block || {}, 'fields') ||
    Object.prototype.hasOwnProperty.call(block || {}, 'fieldGroups');
  const fields = [..._.castArray(block?.fields || [])];
  _.castArray(block?.fieldGroups || []).forEach((group) => {
    fields.push(..._.castArray(group?.fields || []));
  });
  if (hasExplicitFields && !fields.length) {
    return false;
  }
  if (!hasExplicitFields) {
    return true;
  }
  return fields.some((field) => getFieldPathInput(field) === normalizedFieldPath);
}

function getFieldReactionTargetLocalKey(field: any) {
  return String(field?.key || field?.name || field?.path || field?.fieldPath || field?.field || '').trim();
}

function getScopedLocalKey(localKey: string, scopePrefix: string) {
  if (!localKey) {
    return '';
  }
  return scopePrefix && !localKey.startsWith(`${scopePrefix}.`) ? `${scopePrefix}.${localKey}` : localKey;
}

function getScopedLocalKeyCandidates(localKey: string, scopePrefix: string) {
  const candidates = [localKey];
  const scopedKey = getScopedLocalKey(localKey, scopePrefix);
  if (scopedKey && scopedKey !== localKey) {
    candidates.push(scopedKey);
  }
  return candidates;
}

function mergeCoverageByField(...maps: Map<string, string[]>[]) {
  const coverage = new Map<string, string[]>();
  maps.forEach((map) => {
    map.forEach((sources, fieldPath) => {
      coverage.set(fieldPath, [...(coverage.get(fieldPath) || []), ...sources]);
    });
  });
  return coverage;
}

function collectDefaultFormBehaviorFieldShapeErrors(fieldConfig: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(fieldConfig)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-formBehavior-field-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    fieldConfig,
    path,
    DEFAULT_FORM_BEHAVIOR_FIELD_ALLOWED_KEYS,
    'defaults-formBehavior-field-unsupported-key',
    errors,
  );
  if (!_.isUndefined(fieldConfig.settings)) {
    if (!_.isPlainObject(fieldConfig.settings)) {
      pushAuthoringError(errors, {
        path: `${path}.settings`,
        ruleId: 'defaults-formBehavior-field-settings-invalid-shape',
        message: `flowSurfaces authoring ${path}.settings must be an object`,
      });
      return;
    }
    if (!_.isUndefined(fieldConfig.settings.rules) && !Array.isArray(fieldConfig.settings.rules)) {
      pushAuthoringError(errors, {
        path: `${path}.settings.rules`,
        ruleId: 'defaults-formBehavior-field-rules-invalid-shape',
        message: `flowSurfaces authoring ${path}.settings.rules must be an array`,
      });
    }
  }
}

function collectDefaultPopupsShapeErrors(popups: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(popups)) {
    return;
  }
  if (!_.isPlainObject(popups)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-popups-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectDefaultPopupActionMapShapeErrors(
    popups,
    path,
    DEFAULT_POPUPS_ALLOWED_KEYS,
    'defaults-popups-unsupported-key',
    errors,
  );
  if (_.isUndefined(popups.associations)) {
    return;
  }
  if (!_.isPlainObject(popups.associations)) {
    pushAuthoringError(errors, {
      path: `${path}.associations`,
      ruleId: 'defaults-popups-associations-invalid-shape',
      message: `flowSurfaces authoring ${path}.associations must be an object`,
    });
    return;
  }
  Object.entries(popups.associations).forEach(([associationName, actionMap]) => {
    const normalizedAssociationName = String(associationName || '').trim();
    if (!normalizedAssociationName) {
      pushAuthoringError(errors, {
        path: `${path}.associations`,
        ruleId: 'defaults-popups-association-name-required',
        message: `flowSurfaces authoring ${path}.associations keys must be non-empty field names`,
      });
      return;
    }
    collectDefaultPopupActionMapShapeErrors(
      actionMap,
      `${path}.associations.${normalizedAssociationName}`,
      DEFAULT_POPUP_ASSOCIATION_ALLOWED_KEYS,
      'defaults-popups-association-unsupported-key',
      errors,
    );
  });
}

function collectDefaultPopupActionMapShapeErrors(
  actionMap: any,
  path: string,
  allowedKeys: string[],
  unsupportedRuleId: string,
  errors: AuthoringErrorInput[],
) {
  if (!_.isPlainObject(actionMap)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-popups-action-map-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(actionMap, path, allowedKeys, unsupportedRuleId, errors);
  DEFAULT_POPUP_ACTIONS.forEach((action) =>
    collectDefaultPopupNameShapeErrors(actionMap[action], `${path}.${action}`, errors),
  );
}

function collectDefaultPopupNameShapeErrors(popupName: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(popupName)) {
    return;
  }
  if (!_.isPlainObject(popupName)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaults-popups-name-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  collectUnsupportedKeysErrors(
    popupName,
    path,
    DEFAULT_POPUP_ACTION_ALLOWED_KEYS,
    'defaults-popups-name-unsupported-key',
    errors,
  );
  if (!String(popupName.name || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.name`,
      ruleId: 'defaults-popups-name-name-required',
      message: `flowSurfaces authoring ${path}.name must be a non-empty string`,
    });
  }
  if (!String(popupName.description || '').trim()) {
    pushAuthoringError(errors, {
      path: `${path}.description`,
      ruleId: 'defaults-popups-name-description-required',
      message: `flowSurfaces authoring ${path}.description must be a non-empty string`,
    });
  }
}

function collectDefaultCollectionFieldGroupSemanticErrors(
  defaults: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (!context.getCollection || !_.isPlainObject(defaults)) {
    return;
  }
  forEachDefaultCollectionDefaults(defaults, (entry) => {
    const fieldGroups = entry.collectionDefaults.fieldGroups;
    if (!Array.isArray(fieldGroups)) {
      return;
    }
    const collection = context.getCollection?.(entry.dataSourceKey, entry.collectionName);
    if (!collection) {
      return;
    }
    const basePath = `${entry.path}.fieldGroups`;
    collectDefaultFieldGroupUnknownFieldErrors(fieldGroups, basePath, collection, errors);
    collectDefaultFieldGroupRelationTitleFieldErrors(
      fieldGroups,
      basePath,
      collection,
      entry.dataSourceKey,
      context,
      errors,
    );
  });
}

function forEachDefaultCollectionDefaults(
  defaults: any,
  visitor: (entry: {
    dataSourceKey: string;
    collectionName: string;
    collectionDefaults: Record<string, any>;
    path: string;
  }) => void,
) {
  const mainDataSourceCollectionOverrides = getMainDataSourceDefaultCollectionNames(defaults);
  if (_.isPlainObject(defaults?.collections)) {
    Object.entries(defaults.collections).forEach(([collectionName, collectionDefaults]) => {
      const normalizedCollectionName = String(collectionName || '').trim();
      if (!normalizedCollectionName || !_.isPlainObject(collectionDefaults)) {
        return;
      }
      if (mainDataSourceCollectionOverrides.has(normalizedCollectionName)) {
        return;
      }
      visitor({
        dataSourceKey: 'main',
        collectionName: normalizedCollectionName,
        collectionDefaults: collectionDefaults as Record<string, any>,
        path: `$.defaults.collections.${normalizedCollectionName}`,
      });
    });
  }
  if (!_.isPlainObject(defaults?.dataSources)) {
    return;
  }
  Object.entries(defaults.dataSources).forEach(([dataSourceKey, dataSourceDefaults]) => {
    const normalizedDataSourceKey = String(dataSourceKey || '').trim();
    const collections = _.isPlainObject(dataSourceDefaults)
      ? (dataSourceDefaults as { collections?: unknown }).collections
      : undefined;
    if (!normalizedDataSourceKey || !_.isPlainObject(collections)) {
      return;
    }
    Object.entries(collections).forEach(([collectionName, collectionDefaults]) => {
      const normalizedCollectionName = String(collectionName || '').trim();
      if (!normalizedCollectionName || !_.isPlainObject(collectionDefaults)) {
        return;
      }
      visitor({
        dataSourceKey: normalizedDataSourceKey,
        collectionName: normalizedCollectionName,
        collectionDefaults: collectionDefaults as Record<string, any>,
        path: `$.defaults.dataSources.${normalizedDataSourceKey}.collections.${normalizedCollectionName}`,
      });
    });
  });
}

function getMainDataSourceDefaultCollectionNames(defaults: any) {
  const names = new Set<string>();
  if (!_.isPlainObject(defaults?.dataSources)) {
    return names;
  }
  Object.entries(defaults.dataSources).forEach(([dataSourceKey, dataSourceDefaults]) => {
    if (String(dataSourceKey || '').trim() !== 'main') {
      return;
    }
    const collections = _.isPlainObject(dataSourceDefaults)
      ? (dataSourceDefaults as { collections?: unknown }).collections
      : undefined;
    if (!_.isPlainObject(collections)) {
      return;
    }
    Object.keys(collections).forEach((collectionName) => {
      const normalizedCollectionName = String(collectionName || '').trim();
      if (normalizedCollectionName) {
        names.add(normalizedCollectionName);
      }
    });
  });
  return names;
}

function collectDefaultFieldGroupUnknownFieldErrors(
  fieldGroups: any[],
  basePath: string,
  collection: any,
  errors: AuthoringErrorInput[],
) {
  forEachDefaultFieldGroupField(
    fieldGroups,
    (field, fieldPath, path) => {
      if (!fieldPath) {
        return;
      }
      if (resolveDefaultFieldGroupField(collection, fieldPath)) {
        return;
      }
      pushAuthoringError(errors, {
        path,
        ruleId: 'default-field-group-unknown-field',
        message: `flowSurfaces authoring ${path} references unknown collection default field '${fieldPath}'`,
        details: {
          fieldPath,
          collection: getCollectionName(collection),
          availableFields: getCollectionFields(collection).map(getFieldName).filter(Boolean),
        },
      });
    },
    basePath,
  );
}

function collectDefaultFieldGroupRelationTitleFieldErrors(
  fieldGroups: any[],
  basePath: string,
  collection: any,
  dataSourceKey: string,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  forEachDefaultFieldGroupField(
    fieldGroups,
    (field, fieldPath, path) => {
      if (!fieldPath || !_.isPlainObject(field) || !Object.prototype.hasOwnProperty.call(field, 'titleField')) {
        return;
      }
      const titleField = String(field.titleField || '').trim();
      if (!titleField) {
        return;
      }
      const resolvedField = resolveDefaultFieldGroupField(collection, fieldPath);
      if (!resolvedField || !isAssociationField(resolvedField)) {
        return;
      }
      const targetCollection = resolveFieldTargetCollection(
        resolvedField,
        dataSourceKey,
        (nextDataSourceKey, targetCollectionName) => context.getCollection?.(nextDataSourceKey, targetCollectionName),
      );
      if (!targetCollection) {
        return;
      }
      const targetField = resolveFieldFromCollection(targetCollection, titleField);
      if (titleField === 'id' || (targetField && isAssociationField(targetField))) {
        pushAuthoringError(errors, {
          path: `${path}.titleField`,
          ruleId: 'relation-titleField-unreadable',
          message: `flowSurfaces authoring ${path}.titleField cannot use unreadable relation title field '${titleField}'`,
          details: buildFlowSurfaceTitleFieldErrorDetails({
            action: context.authoringActionName,
            fieldPath,
            titleField,
            targetCollection,
            invalidReason: getRelationTitleFieldInvalidReason(titleField, targetField),
          }),
        });
        return;
      }
      if (!targetField) {
        pushAuthoringError(errors, {
          path: `${path}.titleField`,
          ruleId: 'relation-titleField-unknown',
          message: `flowSurfaces authoring ${path}.titleField references unknown relation title field '${titleField}'`,
          details: buildFlowSurfaceTitleFieldErrorDetails({
            action: context.authoringActionName,
            fieldPath,
            titleField,
            targetCollection,
            invalidReason: 'missing',
          }),
        });
      }
    },
    basePath,
  );
}

function collectDefaultFieldGroupsCoverageErrors(
  fieldGroups: any,
  basePath: string,
  collection: any,
  requiredFieldNames: string[],
  errors: AuthoringErrorInput[],
) {
  if (!Array.isArray(fieldGroups) || !fieldGroups.length || !requiredFieldNames.length) {
    return;
  }
  const providedFieldNames = new Set<string>();
  forEachDefaultFieldGroupField(
    fieldGroups,
    (_field, fieldPath) => {
      if (fieldPath && resolveDefaultFieldGroupField(collection, fieldPath)) {
        providedFieldNames.add(fieldPath);
      }
    },
    basePath,
  );
  const missingFieldNames = requiredFieldNames.filter((fieldName) => !providedFieldNames.has(fieldName));
  if (!missingFieldNames.length) {
    return;
  }
  pushAuthoringError(errors, {
    path: basePath,
    ruleId: 'default-field-groups-incomplete',
    message: `flowSurfaces authoring ${basePath} does not cover required generated popup fields: ${missingFieldNames.join(
      ', ',
    )}`,
    details: {
      collection: getCollectionName(collection),
      missingFieldNames,
    },
  });
}

function forEachDefaultFieldGroupField(
  fieldGroups: any[],
  visitor: (field: any, fieldPath: string, path: string) => void,
  basePath: string,
) {
  fieldGroups.forEach((group, groupIndex) => {
    if (!_.isPlainObject(group) || !Array.isArray(group.fields)) {
      return;
    }
    group.fields.forEach((field, fieldIndex) => {
      visitor(field, getDefaultFieldGroupFieldPath(field), `${basePath}[${groupIndex}].fields[${fieldIndex}]`);
    });
  });
}

function getDefaultFieldGroupFieldPath(field: any) {
  if (_.isString(field)) {
    return field.trim();
  }
  if (!_.isPlainObject(field)) {
    return '';
  }
  return String(field.field || '').trim();
}

function resolveDefaultFieldGroupField(collection: any, fieldPath: string) {
  if (!fieldPath || fieldPath.includes('.')) {
    return null;
  }
  return getCollectionFields(collection).find((field) => getFieldName(field) === fieldPath) || null;
}

function collectUnsupportedKeysErrors(
  value: Record<string, any>,
  path: string,
  allowedKeys: string[],
  ruleId: string,
  errors: AuthoringErrorInput[],
) {
  const unsupportedKeys = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (!unsupportedKeys.length) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId,
    message: `flowSurfaces authoring ${path} only accepts ${allowedKeys.join(
      ', ',
    )}; unsupported keys: ${unsupportedKeys.join(', ')}`,
    details: {
      allowedKeys,
      unsupportedKeys,
    },
  });
}

type GeneratedPopupDefaultFieldGroupRequirement = {
  dataSourceKey: string;
  collection: string;
  actionTypes: GeneratedPopupDefaultActionType[];
  triggerPaths: string[];
  triggerPathActionTypes: Record<string, GeneratedPopupDefaultActionType[]>;
};

function collectGeneratedPopupDefaultFieldGroupErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (!context.getCollection) {
    return;
  }
  const requirements = new Map<string, GeneratedPopupDefaultFieldGroupRequirement>();

  if (actionName === 'configure') {
    collectConfigureGeneratedPopupRequirements(values, context, requirements);
  } else {
    getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
      collectBlockGeneratedPopupRequirements(block, path, context, requirements),
    );
  }

  expandGeneratedViewPopupOneHopRequirements(requirements, values?.defaults, context);

  for (const requirement of requirements.values()) {
    const collection = context.getCollection(requirement.dataSourceKey, requirement.collection);
    if (!collection) {
      continue;
    }
    const defaultCollection = resolveDefaultCollectionDefaults(
      values?.defaults,
      requirement.dataSourceKey,
      requirement.collection,
    );
    const defaultFieldGroups = defaultCollection.collectionDefaults?.fieldGroups;
    const normalizedDefaultFieldGroups = Array.isArray(defaultFieldGroups) ? defaultFieldGroups : undefined;
    const businessFieldNames = getGeneratedPopupBusinessFieldNames(collection);
    const effectiveFieldNames = getGeneratedPopupEffectiveFieldNames({
      collection,
      dataSourceKey: requirement.dataSourceKey,
      actionTypes: requirement.actionTypes,
      fieldGroups: normalizedDefaultFieldGroups,
      context,
    });
    if (effectiveFieldNames.length <= LARGE_GENERATED_POPUP_FIELD_GROUPS_THRESHOLD) {
      continue;
    }
    collectDefaultFieldGroupsCoverageErrors(
      defaultFieldGroups,
      defaultCollection.fieldGroupsPath,
      collection,
      effectiveFieldNames,
      errors,
    );
    if (
      hasUsableDefaultCollectionFieldGroups(
        values?.defaults,
        requirement.dataSourceKey,
        requirement.collection,
        collection,
        requirement.dataSourceKey,
        requirement.actionTypes,
        context,
      )
    ) {
      continue;
    }
    const path = defaultCollection.fieldGroupsPath;
    if (errors.some((error) => error.path === path && error.ruleId === 'missing-default-field-groups')) {
      continue;
    }
    pushAuthoringError(errors, {
      path,
      ruleId: 'missing-default-field-groups',
      message: `flowSurfaces authoring ${path} is required because collection '${requirement.collection}' has ${effectiveFieldNames.length} generated popup fields and generated popups require collection-level fieldGroups`,
      details: {
        collection: requirement.collection,
        dataSourceKey: requirement.dataSourceKey,
        businessFieldCount: businessFieldNames.length,
        effectiveFieldCount: effectiveFieldNames.length,
        threshold: LARGE_GENERATED_POPUP_FIELD_GROUPS_THRESHOLD,
        actionTypes: requirement.actionTypes,
        requiredFieldNames: effectiveFieldNames,
        triggerPaths: requirement.triggerPaths,
      },
    });
  }
}

function collectDefaultFormBehaviorCompletenessErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (actionName !== 'applyBlueprint' || !context.getCollection) {
    return;
  }
  const requirements = new Map<string, GeneratedPopupDefaultFieldGroupRequirement>();
  getAuthoringBlocks(actionName, values).forEach(({ block, path }) =>
    collectBlockGeneratedPopupRequirements(block, path, context, requirements),
  );
  expandGeneratedViewPopupOneHopRequirements(requirements, values?.defaults, context);

  for (const requirement of requirements.values()) {
    const actionTypes = requirement.actionTypes.filter(
      (actionType): actionType is 'addNew' | 'edit' => actionType === 'addNew' || actionType === 'edit',
    );
    if (!actionTypes.length) {
      continue;
    }
    const collection = context.getCollection(requirement.dataSourceKey, requirement.collection);
    if (!collection) {
      continue;
    }
    const defaultCollection = resolveDefaultCollectionDefaults(
      values?.defaults,
      requirement.dataSourceKey,
      requirement.collection,
    );
    const defaultFieldGroups = defaultCollection.collectionDefaults?.fieldGroups;
    const describedFields = getGeneratedPopupDefaultFormDescribedFields({
      collection,
      dataSourceKey: requirement.dataSourceKey,
      actionTypes,
      fieldGroups: defaultFieldGroups,
      context,
    });
    const describedFieldNames = describedFields.map((field) => field.name);
    const describedFieldByName = new Map(describedFields.map((field) => [field.name, field]));
    if (!describedFieldNames.length) {
      continue;
    }
    const formBehaviorPath = `${defaultCollection.collectionPath}.formBehavior`;
    const reviewPath = `${defaultCollection.collectionPath}.formBehaviorDescriptionReview`;
    const collectionDefaults = defaultCollection.collectionDefaults || {};
    const hasOwnFormBehavior = Object.prototype.hasOwnProperty.call(collectionDefaults, 'formBehavior');
    const hasOwnReview = Object.prototype.hasOwnProperty.call(collectionDefaults, 'formBehaviorDescriptionReview');
    if (
      !hasOwnFormBehavior &&
      !hasOwnReview &&
      errors.some((error) => error.path === formBehaviorPath && error.ruleId === 'missing-description-form-behavior')
    ) {
      continue;
    }
    if (!hasOwnFormBehavior && !hasOwnReview) {
      pushAuthoringError(errors, {
        path: reviewPath,
        ruleId: 'missing-description-form-behavior',
        message: `flowSurfaces authoring ${reviewPath}.fields must review every described generated add/edit field for collection '${requirement.collection}'. Use decision implemented when structured formBehavior or linkage covers the field, or noUiBehavior/unsupported with reasonCode when it does not.`,
        details: {
          collection: requirement.collection,
          dataSourceKey: requirement.dataSourceKey,
          actionTypes,
          describedFieldNames,
          describedFields,
          triggerPaths: requirement.triggerPaths,
        },
      });
      continue;
    }

    const coverageByField = mergeCoverageByField(
      collectDefaultFormBehaviorCoverageByField(collectionDefaults.formBehavior),
      collectReactionCoverageByField(values?.reaction, {
        values,
        collection: requirement.collection,
        dataSourceKey: requirement.dataSourceKey,
        context,
      }),
    );
    const candidateFieldNames = getGeneratedPopupDefaultFormCandidateFieldNames({
      collection,
      dataSourceKey: requirement.dataSourceKey,
      actionTypes,
      fieldGroups: defaultFieldGroups,
      context,
    });
    const candidateFieldNameSet = new Set(candidateFieldNames);
    const describedFieldNameSet = new Set(describedFieldNames);
    const reviewFields = getDescriptionReviewFieldsMap(collectionDefaults.formBehaviorDescriptionReview);
    const reviewFieldNames = new Set(
      Object.keys(reviewFields)
        .map((field) => String(field || '').trim())
        .filter(Boolean),
    );
    const missingReviewFieldNames = describedFieldNames.filter((fieldName) => !reviewFieldNames.has(fieldName));
    const invalidReviewFieldNames = Array.from(reviewFieldNames).filter(
      (fieldName) => !candidateFieldNameSet.has(fieldName),
    );
    const emptyDescriptionReviewFieldNames = Array.from(reviewFieldNames).filter(
      (fieldName) => candidateFieldNameSet.has(fieldName) && !describedFieldNameSet.has(fieldName),
    );

    if (missingReviewFieldNames.length) {
      missingReviewFieldNames.forEach((fieldName) => {
        const field = describedFieldByName.get(fieldName);
        pushAuthoringError(errors, {
          path: `${reviewPath}.fields.${fieldName}`,
          ruleId: 'missing-description-form-behavior-review-field',
          message: `flowSurfaces authoring ${reviewPath}.fields.${fieldName} must review this described generated add/edit field.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            description: field?.description,
            reason: 'missing review object',
          }),
        });
      });
    }
    if (invalidReviewFieldNames.length) {
      invalidReviewFieldNames.forEach((fieldName) => {
        pushAuthoringError(errors, {
          path: `${reviewPath}.fields.${fieldName}`,
          ruleId: 'description-form-behavior-review-invalid-field',
          message: `flowSurfaces authoring ${reviewPath}.fields.${fieldName} only accepts described generated add/edit candidate fields for this collection.`,
          details: {
            invalidReviewFieldNames: [fieldName],
            describedFieldNames,
          },
        });
      });
    }
    if (emptyDescriptionReviewFieldNames.length) {
      emptyDescriptionReviewFieldNames.forEach((fieldName) => {
        if (_.isNull(reviewFields[fieldName])) {
          return;
        }
        pushAuthoringError(errors, {
          path: `${reviewPath}.fields.${fieldName}`,
          ruleId: 'description-review-empty-description-must-be-null',
          message: `flowSurfaces authoring ${reviewPath}.fields.${fieldName} may be omitted or set to null because this generated add/edit candidate field has no description.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            reason: 'empty description review entries must be null when present',
          }),
        });
      });
    }
    describedFieldNames.forEach((fieldName) => {
      if (!reviewFieldNames.has(fieldName)) {
        return;
      }
      const field = describedFieldByName.get(fieldName);
      const reviewEntry = reviewFields[fieldName];
      const fieldReviewPath = `${reviewPath}.fields.${fieldName}`;
      const coverage = coverageByField.get(fieldName) || [];
      if (_.isNull(reviewEntry)) {
        pushAuthoringError(errors, {
          path: fieldReviewPath,
          ruleId: 'description-review-required',
          message: `flowSurfaces authoring ${fieldReviewPath} must be a non-null review object because the field description is not empty.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            description: field?.description,
            reason: 'non-empty description cannot use null review',
          }),
        });
        return;
      }
      if (!_.isPlainObject(reviewEntry) || !Object.keys(reviewEntry).length) {
        pushAuthoringError(errors, {
          path: fieldReviewPath,
          ruleId: 'description-review-empty',
          message: `flowSurfaces authoring ${fieldReviewPath} must be a non-empty review object with decision.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            description: field?.description,
            reason: 'review object is missing decision',
          }),
        });
        return;
      }
      const decision = String(reviewEntry.decision || '').trim();
      if (!DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_DECISIONS.has(decision)) {
        pushAuthoringError(errors, {
          path: `${fieldReviewPath}.decision`,
          ruleId: 'description-review-decision-invalid',
          message: `flowSurfaces authoring ${fieldReviewPath}.decision must be one of implemented, noUiBehavior, unsupported.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            description: field?.description,
            decision,
            reason: 'invalid decision',
          }),
        });
        return;
      }
      if (decision === 'implemented' && !coverage.length) {
        pushAuthoringError(errors, {
          path: fieldReviewPath,
          ruleId: 'description-review-implemented-missing-coverage',
          message: `flowSurfaces authoring ${fieldReviewPath} is marked implemented, but no structured formBehavior or linkage coverage targets this field.`,
          details: buildDescriptionReviewErrorDetails({
            collection: requirement.collection,
            dataSourceKey: requirement.dataSourceKey,
            field: fieldName,
            description: field?.description,
            decision,
            missingCoverage: [
              `formBehavior.addNew.fields.${fieldName}.settings`,
              `formBehavior.edit.fields.${fieldName}.settings`,
              `formBehavior.addNew.fieldLinkageRules targeting ${fieldName}`,
              `formBehavior.edit.fieldLinkageRules targeting ${fieldName}`,
            ],
          }),
        });
      }
      if (decision !== 'implemented') {
        const reasonCode = String(reviewEntry.reasonCode || '').trim();
        if (!reasonCode) {
          pushAuthoringError(errors, {
            path: `${fieldReviewPath}.reasonCode`,
            ruleId: 'description-review-reason-code-required',
            message: `flowSurfaces authoring ${fieldReviewPath}.reasonCode is required when decision is ${decision}.`,
            details: buildDescriptionReviewErrorDetails({
              collection: requirement.collection,
              dataSourceKey: requirement.dataSourceKey,
              field: fieldName,
              description: field?.description,
              decision,
              reason: 'missing reasonCode',
            }),
          });
        } else if (!DEFAULT_FORM_BEHAVIOR_DESCRIPTION_REVIEW_REASON_CODES.has(reasonCode)) {
          pushAuthoringError(errors, {
            path: `${fieldReviewPath}.reasonCode`,
            ruleId: 'description-review-reason-code-invalid',
            message: `flowSurfaces authoring ${fieldReviewPath}.reasonCode is not allowed.`,
            details: buildDescriptionReviewErrorDetails({
              collection: requirement.collection,
              dataSourceKey: requirement.dataSourceKey,
              field: fieldName,
              description: field?.description,
              decision,
              reason: 'invalid reasonCode',
            }),
          });
        }
        if (coverage.length) {
          pushAuthoringError(errors, {
            path: fieldReviewPath,
            ruleId: 'description-review-nonimplemented-conflicts-with-coverage',
            message: `flowSurfaces authoring ${fieldReviewPath} is marked ${decision}, but structured coverage already targets this field.`,
            details: buildDescriptionReviewErrorDetails({
              collection: requirement.collection,
              dataSourceKey: requirement.dataSourceKey,
              field: fieldName,
              description: field?.description,
              decision,
              coverage,
              reason: 'non-implemented decision conflicts with existing coverage',
            }),
          });
        }
      }
    });
  }
}

function expandGeneratedViewPopupOneHopRequirements(
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
  defaults: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  const getCollection = context.getCollection;
  if (!getCollection) {
    return;
  }
  const baseRequirements = Array.from(requirements.values()).map((requirement) => ({
    ...requirement,
    actionTypes: [...requirement.actionTypes],
    triggerPaths: [...requirement.triggerPaths],
    triggerPathActionTypes: _.mapValues(requirement.triggerPathActionTypes, (actionTypes) => [...actionTypes]),
  }));
  const expanded = new Set<string>();
  for (const requirement of baseRequirements) {
    if (!requirement.actionTypes.includes('view')) {
      continue;
    }
    const expansionKey = `${requirement.dataSourceKey}.${requirement.collection}.view`;
    if (expanded.has(expansionKey)) {
      continue;
    }
    expanded.add(expansionKey);

    const collection = getCollection(requirement.dataSourceKey, requirement.collection);
    if (!collection) {
      continue;
    }
    const defaultFieldGroups = getDefaultCollectionFieldGroups(
      defaults,
      requirement.dataSourceKey,
      requirement.collection,
    );
    const runtimeCandidates = getGeneratedPopupRuntimeFieldCandidates({
      collection,
      dataSourceKey: requirement.dataSourceKey,
      actionType: 'view',
      fieldGroups: Array.isArray(defaultFieldGroups) ? defaultFieldGroups : undefined,
      context,
    });
    const selectedFieldPaths = getGeneratedViewPopupSelectedFieldPaths(
      runtimeCandidates,
      defaults,
      requirement.dataSourceKey,
      requirement.collection,
    );
    if (!selectedFieldPaths.size) {
      continue;
    }
    const viewTriggerPaths = getGeneratedPopupRequirementTriggerPathsForActionType(requirement, 'view');
    for (const candidate of runtimeCandidates) {
      const fieldPath = String(candidate?.fieldPath || '').trim();
      if (!fieldPath || !selectedFieldPaths.has(fieldPath)) {
        continue;
      }
      const field = candidate?.field;
      if (!isSingleValueAssociationField(field)) {
        continue;
      }
      const targetCollection = resolveFieldTargetCollection(field, requirement.dataSourceKey, getCollection);
      const targetCollectionName = getCollectionName(targetCollection);
      if (!targetCollectionName) {
        continue;
      }
      viewTriggerPaths.forEach((triggerPath) => {
        addGeneratedPopupRequirement(
          {
            dataSourceKey: requirement.dataSourceKey,
            collectionName: targetCollectionName,
            triggerPath: `${triggerPath}.fields.${fieldPath}.popup`,
            actionType: 'view',
          },
          requirements,
        );
      });
    }
  }
}

function getGeneratedViewPopupSelectedFieldPaths(
  runtimeCandidates: ReturnType<typeof getGeneratedPopupRuntimeFieldCandidates>,
  defaults: any,
  dataSourceKey: string,
  collectionName: string,
) {
  const defaultFieldGroups = getDefaultCollectionFieldGroups(defaults, dataSourceKey, collectionName);
  if (defaultFieldGroups) {
    return new Set(
      pickFlowSurfaceDefaultActionPopupFieldGroups(runtimeCandidates, defaultFieldGroups, {
        excludeAuditTimestampFields: false,
      }).flatMap((group) =>
        _.castArray(group.fields || [])
          .map(getFieldPathInput)
          .filter(Boolean),
      ),
    );
  }
  return new Set(
    pickFlowSurfaceDefaultActionPopupFieldPaths(runtimeCandidates, {
      excludeAuditTimestampFields: false,
    }),
  );
}

function getGeneratedPopupRequirementTriggerPathsForActionType(
  requirement: GeneratedPopupDefaultFieldGroupRequirement,
  actionType: GeneratedPopupDefaultActionType,
) {
  const paths = requirement.triggerPaths.filter(
    (triggerPath) => requirement.triggerPathActionTypes?.[triggerPath]?.includes(actionType),
  );
  if (paths.length) {
    return paths;
  }
  return requirement.actionTypes.includes(actionType) ? requirement.triggerPaths : [];
}

function collectConfigureGeneratedPopupRequirements(
  values: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  const changes = values?.changes;
  if (!_.isPlainObject(changes)) {
    return;
  }
  const hostBlockType = normalizeAuthoringHostBlockType(context.hostBlockType);
  const hasResourceChange = _.isPlainObject(changes.resource);
  const block = {
    type: hostBlockType,
    collection: hasResourceChange ? undefined : context.hostCollectionName,
    dataSourceKey: context.hostDataSourceKey,
    resource: hasResourceChange ? changes.resource : undefined,
  };
  if (hasResourceChange) {
    const keys = HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[hostBlockType] || [];
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        return;
      }
      const actionType = getHiddenPopupGeneratedActionType(hostBlockType, key);
      if (!actionType) {
        return;
      }
      addGeneratedPopupRequirementForBlock(block, context, `$.changes.resource.${key}`, requirements, actionType);
    });
  }
  collectHiddenPopupGeneratedPopupRequirements(changes, '$.changes', block, context, requirements);
  collectConfigureOpenViewGeneratedPopupRequirement(changes, context, requirements);
}

function collectConfigureOpenViewGeneratedPopupRequirement(
  changes: Record<string, any>,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!Object.prototype.hasOwnProperty.call(changes, 'openView') || !_.isPlainObject(changes.openView)) {
    return;
  }
  const popupHostNode = getConfigureOpenViewPopupHostNode(context.currentNode);
  if (!popupHostNode?.uid || !doesConfigureOpenViewGenerate(changes.openView, popupHostNode)) {
    return;
  }
  if (hiddenPopupHostHasLocalContent(popupHostNode)) {
    return;
  }
  const actionType = resolveConfigureOpenViewGeneratedActionType(context.currentNode, popupHostNode, changes.openView);
  if (!actionType) {
    return;
  }
  const collectionName = resolveConfigureOpenViewCollectionName(changes.openView, context, popupHostNode);
  if (!collectionName) {
    return;
  }
  addGeneratedPopupRequirement(
    {
      dataSourceKey: resolveConfigureOpenViewDataSourceKey(changes.openView, context, popupHostNode),
      collectionName,
      triggerPath: '$.changes.openView',
      actionType,
    },
    requirements,
  );
}

function getConfigureOpenViewPopupHostNode(currentNode: any) {
  const currentUse = String(currentNode?.use || '').trim();
  if (FIELD_WRAPPER_USES.has(currentUse)) {
    return currentNode?.subModels?.field || null;
  }
  return currentNode || null;
}

function doesConfigureOpenViewGenerate(openView: Record<string, any>, popupHostNode: any) {
  if (hasFlowSurfaceInlinePopupTemplate(openView) || String(openView.popupTemplateUid || '').trim()) {
    return false;
  }
  const openViewUid = String(openView.uid || '').trim();
  const popupHostUid = String(popupHostNode?.uid || '').trim();
  return !openViewUid || !popupHostUid || openViewUid === popupHostUid;
}

function resolveConfigureOpenViewGeneratedActionType(
  currentNode: any,
  popupHostNode: any,
  openView: Record<string, any>,
): GeneratedPopupDefaultActionType | undefined {
  const actionType =
    CONFIGURE_OPEN_VIEW_ACTION_TYPE_BY_MODEL_USE[String(popupHostNode?.use || '').trim()] ||
    CONFIGURE_OPEN_VIEW_ACTION_TYPE_BY_MODEL_USE[String(currentNode?.use || '').trim()];
  if (actionType) {
    return actionType;
  }
  if (!isConfigureOpenViewFieldHost(currentNode, popupHostNode)) {
    return undefined;
  }
  return normalizeDefaultPopupActionType(openView.defaultType) || 'view';
}

function isConfigureOpenViewFieldHost(currentNode: any, popupHostNode: any) {
  const currentUse = String(currentNode?.use || '').trim();
  const popupHostUse = String(popupHostNode?.use || '').trim();
  return (
    FIELD_WRAPPER_USES.has(currentUse) ||
    popupHostUse.endsWith('FieldModel') ||
    _.isPlainObject(popupHostNode?.stepParams?.fieldSettings?.init)
  );
}

function resolveConfigureOpenViewCollectionName(
  openView: Record<string, any>,
  context: FlowSurfaceAuthoringValidationContext,
  popupHostNode: any,
) {
  const openViewCollectionName = String(openView.collectionName || '').trim();
  if (openViewCollectionName) {
    return openViewCollectionName;
  }
  return (
    resolveConfigureFieldTargetCollectionName(popupHostNode, context) || String(context.hostCollectionName || '').trim()
  );
}

function resolveConfigureOpenViewDataSourceKey(
  openView: Record<string, any>,
  context: FlowSurfaceAuthoringValidationContext,
  popupHostNode: any,
) {
  return (
    String(openView.dataSourceKey || '').trim() ||
    String(popupHostNode?.stepParams?.fieldSettings?.init?.dataSourceKey || '').trim() ||
    String(context.hostDataSourceKey || '').trim() ||
    'main'
  );
}

function resolveConfigureFieldTargetCollectionName(fieldNode: any, context: FlowSurfaceAuthoringValidationContext) {
  const init = _.isPlainObject(fieldNode?.stepParams?.fieldSettings?.init)
    ? fieldNode.stepParams.fieldSettings.init
    : {};
  const sourceCollectionName = String(init.collectionName || '').trim();
  if (!sourceCollectionName || !context.getCollection) {
    return undefined;
  }
  const dataSourceKey = String(init.dataSourceKey || '').trim() || 'main';
  const sourceCollection = context.getCollection(dataSourceKey, sourceCollectionName);
  const fullFieldPath = normalizeFieldPath(init.fieldPath || '', init.associationPathName);
  const associationPath = String(init.associationPathName || '').trim() || fullFieldPath.split('.')[0];
  if (!associationPath) {
    return undefined;
  }
  const sourceField = resolveFieldFromCollection(sourceCollection, associationPath);
  const targetCollection = resolveFieldTargetCollection(sourceField, dataSourceKey, context.getCollection);
  return getCollectionName(targetCollection);
}

function collectBlockGeneratedPopupRequirements(
  block: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!_.isPlainObject(block)) {
    return;
  }
  const blockType = String(block.type || '').trim();
  const descendantContext = getBlockDescendantValidationContext(block, context);
  collectDefaultBlockActionGeneratedPopupRequirements(block, blockType, path, context, requirements);
  collectActionListGeneratedPopupRequirements(block.actions, `${path}.actions`, block, context, requirements);
  collectActionListGeneratedPopupRequirements(
    block.recordActions,
    `${path}.recordActions`,
    block,
    context,
    requirements,
  );
  collectHiddenPopupGeneratedPopupRequirements(block.settings, `${path}.settings`, block, context, requirements);
  collectFieldListGeneratedPopupRequirements(block.fields, `${path}.fields`, block, context, requirements);
  collectFieldGroupsGeneratedPopupRequirements(block.fieldGroups, `${path}.fieldGroups`, block, context, requirements);
  collectNestedBlocksGeneratedPopupRequirements(block.blocks, `${path}.blocks`, descendantContext, requirements);
}

function collectDefaultBlockActionGeneratedPopupRequirements(
  block: any,
  blockType: string,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!blockType || hasFlowSurfaceTemplateDocument(block?.template)) {
    return;
  }
  const descriptors = getFlowSurfaceDefaultBlockActions({
    blockType,
    template: block?.template,
  }).filter((descriptor) => _.isPlainObject(descriptor.popup));
  descriptors.forEach((descriptor) => {
    const actionType = normalizeDefaultPopupActionType(descriptor.type);
    if (!actionType) {
      return;
    }
    const slot = descriptor.scope === 'recordActions' ? 'recordActions' : 'actions';
    const actions = Array.isArray(block?.[slot]) ? block[slot] : [];
    const matchedIndex = actions.findIndex(
      (action: any) => resolveAuthoringActionType(action, block) === descriptor.type,
    );
    if (matchedIndex >= 0) {
      const matchedAction = actions[matchedIndex];
      if (_.isPlainObject(matchedAction) && !doesDefaultActionPopupGenerate(matchedAction.popup)) {
        return;
      }
      addGeneratedPopupRequirementForBlock(
        block,
        context,
        `${path}.${slot}[${matchedIndex}].popup`,
        requirements,
        actionType,
      );
      return;
    }
    addGeneratedPopupRequirementForBlock(
      block,
      context,
      `${path}.${slot}.${descriptor.type}`,
      requirements,
      actionType,
    );
  });
}

function collectActionListGeneratedPopupRequirements(
  actions: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!Array.isArray(actions)) {
    return;
  }
  const popupContext = getBlockDescendantValidationContext(block, context);
  actions.forEach((action, index) => {
    const actionPath = `${path}[${index}]`;
    const actionType = resolveDefaultPopupActionType(resolveAuthoringActionType(action, block));
    const defaultActionType = normalizeDefaultPopupActionType(actionType);
    if (_.isPlainObject(action) && defaultActionType && doesDefaultActionPopupGenerate(action.popup)) {
      addGeneratedPopupRequirementForBlock(block, context, `${actionPath}.popup`, requirements, defaultActionType);
    }
    if (_.isPlainObject(action)) {
      collectPopupGeneratedPopupRequirements(action.popup, `${actionPath}.popup`, popupContext, requirements);
      collectPopupGeneratedPopupRequirements(action.openView, `${actionPath}.openView`, popupContext, requirements);
    }
  });
}

function collectHiddenPopupGeneratedPopupRequirements(
  settings: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!_.isPlainObject(settings)) {
    return;
  }
  const blockType = String(block?.type || '').trim();
  const keys = HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[blockType] || [];
  const popupContext = getBlockDescendantValidationContext(block, context);
  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      return;
    }
    const actionType = getHiddenPopupGeneratedActionType(blockType, key);
    if (doesDefaultActionPopupGenerate(settings[key])) {
      addGeneratedPopupRequirementForBlock(block, context, `${path}.${key}`, requirements, actionType);
    }
    collectPopupGeneratedPopupRequirements(settings[key], `${path}.${key}`, popupContext, requirements);
  });
}

function collectFieldListGeneratedPopupRequirements(
  fields: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!Array.isArray(fields)) {
    return;
  }
  fields.forEach((field, index) => {
    const fieldPath = `${path}[${index}]`;
    if (_.isString(field)) {
      addGeneratedPopupRequirementForRelationField(field, fieldPath, block, context, requirements, 'view');
      return;
    }
    if (!_.isPlainObject(field)) {
      return;
    }
    if (_.isPlainObject(field.popup) && doesDefaultActionPopupGenerate(field.popup)) {
      addGeneratedPopupRequirementForRelationField(
        field,
        fieldPath,
        block,
        context,
        requirements,
        getRelationFieldGeneratedPopupActionType(field),
      );
    }
    collectPopupGeneratedPopupRequirements(
      field.popup,
      `${fieldPath}.popup`,
      getFieldPopupValidationContext(field, block, context),
      requirements,
    );
  });
}

function collectFieldGroupsGeneratedPopupRequirements(
  fieldGroups: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!Array.isArray(fieldGroups)) {
    return;
  }
  fieldGroups.forEach((group, groupIndex) => {
    if (!_.isPlainObject(group)) {
      return;
    }
    collectFieldListGeneratedPopupRequirements(
      group.fields,
      `${path}[${groupIndex}].fields`,
      block,
      context,
      requirements,
    );
  });
}

function collectPopupGeneratedPopupRequirements(
  popup: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!_.isPlainObject(popup)) {
    return;
  }
  collectNestedBlocksGeneratedPopupRequirements(popup.blocks, `${path}.blocks`, context, requirements);
}

function collectNestedBlocksGeneratedPopupRequirements(
  blocks: any,
  path: string,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  if (!Array.isArray(blocks)) {
    return;
  }
  blocks.forEach((block, index) =>
    collectBlockGeneratedPopupRequirements(block, `${path}[${index}]`, context, requirements),
  );
}

function addGeneratedPopupRequirementForBlock(
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  triggerPath: string,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
  actionType: GeneratedPopupDefaultActionType | undefined,
) {
  if (!actionType) {
    return;
  }
  const collectionName = getBlockCollectionName(block, context);
  if (!collectionName) {
    return;
  }
  addGeneratedPopupRequirement(
    {
      dataSourceKey: getBlockDataSourceKey(block, context),
      collectionName,
      triggerPath,
      actionType,
    },
    requirements,
  );
}

function addGeneratedPopupRequirementForRelationField(
  fieldSpec: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
  actionType: GeneratedPopupDefaultActionType,
) {
  const sourceCollection = getBlockCollection(block, context);
  if (!sourceCollection || !context.getCollection) {
    return;
  }
  const fieldPath = getFieldPathInput(fieldSpec);
  const sourceField = resolveFieldFromCollection(sourceCollection, fieldPath);
  if (!sourceField || !isAssociationField(sourceField)) {
    return;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const targetCollection = resolveFieldTargetCollection(sourceField, dataSourceKey, context.getCollection);
  const targetCollectionName = getCollectionName(targetCollection);
  if (!targetCollectionName) {
    return;
  }
  addGeneratedPopupRequirement(
    {
      dataSourceKey,
      collectionName: targetCollectionName,
      triggerPath: `${path}.popup`,
      actionType,
    },
    requirements,
  );
}

function addGeneratedPopupRequirement(
  input: {
    dataSourceKey: string;
    collectionName: string;
    triggerPath: string;
    actionType: GeneratedPopupDefaultActionType;
  },
  requirements: Map<string, GeneratedPopupDefaultFieldGroupRequirement>,
) {
  const dataSourceKey = normalizeDataSourceKey(input.dataSourceKey);
  const collection = String(input.collectionName || '').trim();
  if (!collection) {
    return;
  }
  const key = `${dataSourceKey}.${collection}`;
  const existing =
    requirements.get(key) ||
    ({
      dataSourceKey,
      collection,
      actionTypes: [],
      triggerPaths: [],
      triggerPathActionTypes: {},
    } as GeneratedPopupDefaultFieldGroupRequirement);
  if (!existing.actionTypes.includes(input.actionType)) {
    existing.actionTypes.push(input.actionType);
  }
  if (!existing.triggerPaths.includes(input.triggerPath)) {
    existing.triggerPaths.push(input.triggerPath);
  }
  const triggerActionTypes = existing.triggerPathActionTypes[input.triggerPath] || [];
  if (!triggerActionTypes.includes(input.actionType)) {
    existing.triggerPathActionTypes[input.triggerPath] = [...triggerActionTypes, input.actionType];
  }
  requirements.set(key, existing);
}

function isSingleValueAssociationField(field: any) {
  if (!field || !isAssociationField(field)) {
    return false;
  }
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  return SINGLE_VALUE_ASSOCIATION_INTERFACES.has(fieldInterface);
}

function resolveDefaultPopupActionType(actionType: string) {
  if (actionType === 'addChild') {
    return 'addNew';
  }
  return actionType;
}

function normalizeDefaultPopupActionType(actionType: any): GeneratedPopupDefaultActionType | undefined {
  const normalized = resolveDefaultPopupActionType(String(actionType || '').trim());
  if (!DEFAULT_ACTION_POPUP_TYPES.has(normalized as GeneratedPopupDefaultActionType)) {
    return undefined;
  }
  return normalized as GeneratedPopupDefaultActionType;
}

function getHiddenPopupGeneratedActionType(blockType: string, key: string) {
  return HIDDEN_POPUP_ACTION_TYPE_BY_BLOCK_TYPE[blockType]?.[key];
}

function getRelationFieldGeneratedPopupActionType(fieldSpec: any): GeneratedPopupDefaultActionType {
  const popup = _.isPlainObject(fieldSpec?.popup) ? fieldSpec.popup : undefined;
  return normalizeDefaultPopupActionType(popup?.defaultType) || 'view';
}

function doesDefaultActionPopupGenerate(popup: any) {
  if (_.isUndefined(popup)) {
    return true;
  }
  if (!_.isPlainObject(popup)) {
    return false;
  }
  return !hasFlowSurfaceInlinePopupTemplate(popup) && !hasFlowSurfaceInlinePopupBlocks(popup);
}

function getGeneratedPopupBusinessFieldCandidates(collection: any) {
  return getCollectionFields(collection).flatMap((field) => {
    const fieldName = String(getFieldName(field) || '').trim();
    if (!fieldName || !isFlowSurfaceDefaultActionPopupBusinessField(field)) {
      return [];
    }
    if (isRelationBackingForeignKeyField(collection, field)) {
      return [];
    }
    return [
      {
        field,
        fieldPath: fieldName,
      },
    ];
  });
}

function getGeneratedPopupBusinessFieldNames(collection: any) {
  const candidates = getGeneratedPopupBusinessFieldCandidates(collection);
  return pickFlowSurfaceDefaultActionPopupFieldPaths(candidates, {
    excludeAuditTimestampFields: true,
  });
}

function getGeneratedPopupEffectiveFieldNames(input: {
  collection: any;
  dataSourceKey: string;
  actionTypes: GeneratedPopupDefaultActionType[];
  fieldGroups?: any[];
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const requiredActionTypes: GeneratedPopupDefaultActionType[] = input.actionTypes.length
    ? input.actionTypes
    : ['view'];
  const fieldNames = new Set<string>();
  requiredActionTypes.forEach((actionType) => {
    pickFlowSurfaceDefaultActionPopupFieldPaths(
      getGeneratedPopupRuntimeFieldCandidates({
        collection: input.collection,
        dataSourceKey: input.dataSourceKey,
        actionType,
        fieldGroups: input.fieldGroups,
        context: input.context,
      }),
      {
        excludeAuditTimestampFields: actionType !== 'view',
      },
    ).forEach((fieldName) => fieldNames.add(fieldName));
  });
  return Array.from(fieldNames);
}

function getFieldDescription(field: any) {
  return String(field?.description || field?.options?.description || field?.uiSchema?.description || '').trim();
}

function getGeneratedPopupDefaultFormDescribedFields(input: {
  collection: any;
  dataSourceKey: string;
  actionTypes: ('addNew' | 'edit')[];
  fieldGroups?: any[];
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const describedFields = new Map<
    string,
    {
      name: string;
      title?: string;
      interface?: string;
      description: string;
      actionTypes: ('addNew' | 'edit')[];
    }
  >();
  input.actionTypes.forEach((actionType) => {
    const candidates = getGeneratedPopupRuntimeFieldCandidates({
      collection: input.collection,
      dataSourceKey: input.dataSourceKey,
      actionType,
      fieldGroups: input.fieldGroups,
      context: input.context,
    });
    const candidateByFieldPath = new Map<string, any>(
      candidates.map((candidate: any) => [String(candidate?.fieldPath || '').trim(), candidate?.field] as const),
    );
    getGeneratedPopupDefaultFormFieldPaths(candidates, input.fieldGroups).forEach((fieldPath) => {
      const normalizedFieldPath = String(fieldPath || '').trim();
      if (!normalizedFieldPath) {
        return;
      }
      const field = candidateByFieldPath.get(normalizedFieldPath);
      const description = getFieldDescription(field);
      if (!description) {
        return;
      }
      const existingField = describedFields.get(normalizedFieldPath);
      if (existingField) {
        if (!existingField.actionTypes.includes(actionType)) {
          existingField.actionTypes.push(actionType);
        }
        return;
      }
      describedFields.set(normalizedFieldPath, {
        name: normalizedFieldPath,
        title: String(field?.uiSchema?.title || field?.title || normalizedFieldPath).trim(),
        interface: getFieldInterface(field) || '',
        description,
        actionTypes: [actionType],
      });
    });
  });
  return Array.from(describedFields.values());
}

function getGeneratedPopupDefaultFormDescribedFieldNames(input: {
  collection: any;
  dataSourceKey: string;
  actionTypes: ('addNew' | 'edit')[];
  fieldGroups?: any[];
  context: FlowSurfaceAuthoringValidationContext;
}) {
  return getGeneratedPopupDefaultFormDescribedFields(input).map((field) => field.name);
}

function getGeneratedPopupDefaultFormCandidateFieldNames(input: {
  collection: any;
  dataSourceKey: string;
  actionTypes: ('addNew' | 'edit')[];
  fieldGroups?: any[];
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const fieldNames = new Set<string>();
  input.actionTypes.forEach((actionType) => {
    getGeneratedPopupDefaultFormFieldPaths(
      getGeneratedPopupRuntimeFieldCandidates({
        collection: input.collection,
        dataSourceKey: input.dataSourceKey,
        actionType,
        fieldGroups: input.fieldGroups,
        context: input.context,
      }),
      input.fieldGroups,
    ).forEach((fieldPath) => {
      const normalizedFieldPath = String(fieldPath || '').trim();
      if (normalizedFieldPath) {
        fieldNames.add(normalizedFieldPath);
      }
    });
  });
  return Array.from(fieldNames);
}

function getGeneratedPopupDefaultFormFieldPaths(candidates: any[], fieldGroups?: any[]) {
  const options = { excludeAuditTimestampFields: true };
  if (Array.isArray(fieldGroups) && fieldGroups.length) {
    return pickFlowSurfaceDefaultActionPopupFieldGroups(candidates, fieldGroups, options).flatMap((group) =>
      _.castArray(group.fields || [])
        .map(getFieldPathInput)
        .filter(Boolean),
    );
  }
  return pickFlowSurfaceDefaultActionPopupFieldPaths(candidates, options);
}

function getGeneratedPopupRuntimeFieldCandidates(input: {
  collection: any;
  dataSourceKey: string;
  actionType: GeneratedPopupDefaultActionType;
  fieldGroups?: any[];
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const candidateContext = DEFAULT_ACTION_POPUP_FIELD_CONTEXT_BY_TYPE[input.actionType];
  const explicitDefaultFieldPaths = collectFlowSurfaceDefaultActionPopupFieldGroupFieldPaths(input.fieldGroups);
  return getCollectionFields(input.collection).flatMap((field) => {
    const fieldName = getFieldName(field);
    if (!fieldName || !isFlowSurfaceDefaultActionPopupBusinessField(field)) {
      return [];
    }
    if (isRelationBackingForeignKeyField(input.collection, field) && !explicitDefaultFieldPaths.has(fieldName)) {
      return [];
    }
    const fieldInterface = getFieldInterface(field);

    const registeredBinding = resolveRegisteredFieldBinding({
      containerUse: candidateContext.ownerUse,
      field,
      dataSourceKey: input.dataSourceKey,
      enabledPackages: input.context.enabledPackages,
      getCollection: (dataSourceKey, collectionName) => input.context.getCollection?.(dataSourceKey, collectionName),
      useStrictOnly: true,
    });

    if (isAssociationField(field)) {
      if (!registeredBinding?.modelClassName) {
        const hasDefaultTitleFieldOverride = hasUsableDefaultFieldGroupRelationTitleFieldOverride({
          fieldGroups: input.fieldGroups,
          fieldPath: fieldName,
          field,
          dataSourceKey: input.dataSourceKey,
          context: input.context,
        });
        const safeTitleField = hasDefaultTitleFieldOverride
          ? { fieldName: fieldName }
          : tryResolveAssociationSafeTitleField(
              field,
              input.dataSourceKey,
              (dataSourceKey, collectionName) => input.context.getCollection?.(dataSourceKey, collectionName),
            );
        if (!safeTitleField?.fieldName) {
          return [];
        }
      }
    } else if (!registeredBinding?.modelClassName) {
      const hasLegacyCapability =
        candidateContext.mode === 'form'
          ? !!inferFieldMenuEditableFieldUse(fieldInterface)
          : !!inferAssociationLeafDisplayFieldUse(fieldInterface);
      if (!hasLegacyCapability) {
        return [];
      }
    }

    return [
      {
        field,
        fieldPath: fieldName,
      },
    ];
  });
}

function tryResolveAssociationSafeTitleField(
  field: any,
  dataSourceKey: string,
  getCollection: (dataSourceKey: string, collectionName: string) => any,
) {
  try {
    return resolveAssociationSafeTitleField(field, dataSourceKey, getCollection);
  } catch (error) {
    if (error instanceof FlowSurfaceBadRequestError) {
      return null;
    }
    throw error;
  }
}

function hasUsableDefaultFieldGroupRelationTitleFieldOverride(input: {
  fieldGroups?: any[];
  fieldPath: string;
  field: any;
  dataSourceKey: string;
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const titleField = getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride(input.fieldGroups, input.fieldPath);
  if (!titleField || titleField === 'id' || !input.context.getCollection) {
    return false;
  }
  const targetCollection = resolveFieldTargetCollection(
    input.field,
    input.dataSourceKey,
    (dataSourceKey, collectionName) => input.context.getCollection?.(dataSourceKey, collectionName),
  );
  const targetField = targetCollection ? resolveFieldFromCollection(targetCollection, titleField) : undefined;
  return !!targetField && !isAssociationField(targetField);
}

function hasUsableDefaultCollectionFieldGroups(
  defaults: any,
  dataSourceKey: string,
  collectionName: string,
  collection: any,
  requirementDataSourceKey: string,
  actionTypes: GeneratedPopupDefaultActionType[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  const fieldGroups = getDefaultCollectionFieldGroups(defaults, dataSourceKey, collectionName);
  if (!Array.isArray(fieldGroups) || !fieldGroups.length) {
    return false;
  }
  const requiredActionTypes: GeneratedPopupDefaultActionType[] = actionTypes.length ? actionTypes : ['view'];
  return requiredActionTypes.every((actionType) => {
    const pickedGroups = pickFlowSurfaceDefaultActionPopupFieldGroups(
      getGeneratedPopupRuntimeFieldCandidates({
        collection,
        dataSourceKey: requirementDataSourceKey,
        actionType,
        fieldGroups,
        context,
      }),
      fieldGroups,
      {
        excludeAuditTimestampFields: actionType !== 'view',
      },
    );
    return pickedGroups.length > 0;
  });
}

function resolveDefaultCollectionDefaults(defaults: any, dataSourceKey: string, collectionName: string) {
  const resolved = resolveFlowSurfaceApplyBlueprintDefaultCollection({
    metadata: _.isPlainObject(defaults) ? defaults : undefined,
    dataSourceKey: normalizeFlowSurfaceApplyBlueprintDataSourceKey(dataSourceKey),
    collectionName,
  });
  return {
    collectionDefaults: resolved.collectionDefaults,
    collectionPath: (resolved.path || `$.defaults.collections.${collectionName}.fieldGroups`).replace(
      /\.fieldGroups$/,
      '',
    ),
    fieldGroupsPath: resolved.path || `$.defaults.collections.${collectionName}.fieldGroups`,
  };
}

function getDefaultCollectionFieldGroups(defaults: any, dataSourceKey: string, collectionName: string) {
  return resolveDefaultCollectionDefaults(defaults, dataSourceKey, collectionName).collectionDefaults?.fieldGroups;
}

function getBlockDescendantValidationContext(
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
): FlowSurfaceAuthoringValidationContext {
  const collectionName = getBlockCollectionName(block, context);
  if (!collectionName) {
    return context;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  if (context.currentCollectionName === collectionName && context.currentDataSourceKey === dataSourceKey) {
    return context;
  }
  return {
    ...context,
    currentCollectionName: collectionName,
    currentDataSourceKey: dataSourceKey,
  };
}

function getFieldPopupValidationContext(
  fieldSpec: any,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
): FlowSurfaceAuthoringValidationContext {
  const fallbackContext = getBlockDescendantValidationContext(block, context);
  const fieldPath = getAssociationAwareFieldPathInput(fieldSpec);
  if (!fieldPath || !context.getCollection) {
    return fallbackContext;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return fallbackContext;
  }
  const field = resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  const parentAssociationFieldPath = fieldPath.includes('.')
    ? fieldPath.split('.').filter(Boolean).slice(0, -1).join('.')
    : '';
  const associationField = isAssociationField(field)
    ? field
    : parentAssociationFieldPath
      ? resolveFieldFromCollection(collection, normalizeFieldPath(parentAssociationFieldPath))
      : field;
  if (!associationField || !isAssociationField(associationField)) {
    return fallbackContext;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const targetCollection = resolveFieldTargetCollection(
    associationField,
    dataSourceKey,
    (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
  );
  const targetCollectionName = getCollectionName(targetCollection) || getFieldTargetName(associationField);
  if (!targetCollectionName) {
    return fallbackContext;
  }
  return {
    ...context,
    currentCollectionName: targetCollectionName,
    currentDataSourceKey:
      String(targetCollection?.dataSourceKey || targetCollection?.options?.dataSourceKey || dataSourceKey).trim() ||
      dataSourceKey,
  };
}

function collectBlockErrors(
  block: any,
  path: string,
  errors: AuthoringErrorInput[],
  localKeys: Set<string>,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(block)) {
    return;
  }

  const blockType = String(block.type || '').trim();
  const hasFields = Object.prototype.hasOwnProperty.call(block, 'fields');
  const hasFieldGroups = Object.prototype.hasOwnProperty.call(block, 'fieldGroups');
  const hasFieldsLayout = Object.prototype.hasOwnProperty.call(block, 'fieldsLayout');

  collectJsBlockPublicContractErrors(block, path, errors, context);
  collectApplyBlueprintScriptAssetReferenceErrors(block, path, errors, context);

  if (Object.prototype.hasOwnProperty.call(block, 'layout')) {
    pushAuthoringError(errors, {
      path: `${path}.layout`,
      ruleId: 'block-layout-unsupported',
      message: `flowSurfaces authoring ${path}.layout is not supported; layout is only allowed on tabs[] and popup`,
    });
  }

  collectRemovedDefaultActionOptOutErrors(block, path, errors);

  if (hasFields && hasFieldGroups) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'fields-fieldGroups-mutually-exclusive',
      message: `flowSurfaces authoring ${path} cannot mix fields with fieldGroups`,
    });
  }

  if (hasFieldGroups && hasFieldsLayout) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'fieldsLayout-fieldGroups-mutually-exclusive',
      message: `flowSurfaces authoring ${path} cannot mix fieldGroups with fieldsLayout`,
    });
  }

  collectUnsupportedMainBlockSectionErrors(block, blockType, path, errors);
  collectApplyBlueprintKanbanFieldLimitErrors(block, blockType, path, errors, context);
  collectUnsupportedFieldAuthoringHostErrors(block, blockType, path, errors);
  collectSortingAliasErrors(block.settings, `${path}.settings`, blockType, errors);
  collectFieldGroupsShapeErrors(block.fieldGroups, path, errors, block, context, localKeys);
  collectFieldsLayoutErrors(block, path, errors);
  collectTemplateBackedPublicDataSurfaceDefaultOverrideErrors(block, blockType, path, errors);
  collectDefaultFilterErrors(block.defaultFilter, `${path}.defaultFilter`, errors, block, context);
  collectEffectiveDefaultFilterFieldCountErrors(block, path, errors, context);
  collectDefaultActionSettingsFilterErrors(
    block.defaultActionSettings,
    `${path}.defaultActionSettings`,
    errors,
    block,
    context,
  );
  collectSemanticBindingErrors(block, blockType, path, errors, context);
  collectVisibleDataBlockFieldErrors(block, blockType, path, errors, context);
  collectCommentsBlockErrors(block, blockType, path, errors, context);
  collectRecordHistoryBlockErrors(block, blockType, path, errors, context);
  collectLocalizedChartSettingsErrors(block, blockType, path, errors, context);
  collectChartDisplayTitleErrors(block, blockType, path, errors);
  collectTreeTableExplicitFieldsErrors(block, blockType, path, errors, context);
  collectTreeConnectFieldsErrors(block.settings?.connectFields, `${path}.settings.connectFields`, errors);
  collectTableSettingsErrors(
    block,
    blockType,
    path,
    errors,
    {
      deferPublicDataScopeErrors: context.authoringActionName === 'addBlocks',
    },
    context,
  );
  collectGridCardSettingsErrors(block, blockType, path, errors);
  const descendantContext = getBlockDescendantValidationContext(block, context);
  collectActionListErrors(block.actions, `${path}.actions`, errors, block, descendantContext, 'actions');
  collectActionListErrors(
    block.recordActions,
    `${path}.recordActions`,
    errors,
    block,
    descendantContext,
    'recordActions',
  );
  collectPopupErrors(block.popup, `${path}.popup`, errors, localKeys, descendantContext);
  collectNestedBlockErrors(block.blocks, `${path}.blocks`, errors, localKeys, descendantContext);
  collectHiddenPopupSettingsErrors(block.settings, `${path}.settings`, blockType, errors, descendantContext);
  collectReactionErrors(block.reaction, `${path}.reaction`, localKeys, errors);
  collectFieldListErrors(block.fields, `${path}.fields`, errors, localKeys, context, block);
}

function collectJsBlockPublicContractErrors(
  block: any,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  const blockType = String(block?.type || '').trim();
  if (blockType === 'js') {
    pushAuthoringError(errors, {
      path: `${path}.type`,
      ruleId: 'jsBlock-type-alias-unsupported',
      message: `flowSurfaces authoring ${path}.type must be "jsBlock"; "js" is only an action type and is not a public JSBlock block alias. Use ${path}.settings.code for inline JSBlock code`,
      details: withJsBlockRepairHint(),
    });
    return;
  }
  if (blockType !== 'jsBlock') {
    return;
  }

  JS_BLOCK_TOP_LEVEL_JS_KEYS.forEach((key) => {
    if (!hasOwn(block, key)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${path}.${key}`,
      ruleId: `jsBlock-top-level-${key}-unsupported`,
      message: `flowSurfaces authoring ${path}.${key} is not accepted on public jsBlock blocks; use ${path}.settings.code, ${path}.settings.version, and ${path}.settings.showBlockCard for public JS block settings`,
      details: withJsBlockRepairHint({ key }),
    });
  });

  JS_BLOCK_INTERNAL_AUTHORING_KEYS.forEach((key) => {
    if (!hasOwn(block, key)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${path}.${key}`,
      ruleId: key === 'stepParams' ? 'jsBlock-stepParams-unsupported' : 'jsBlock-internal-field-unsupported',
      message: `flowSurfaces authoring ${path}.${key} is not accepted on public jsBlock blocks; use ${path}.settings.code, ${path}.settings.version, and ${path}.settings.showBlockCard instead of internal persisted fields`,
      details: withJsBlockRepairHint({
        key,
      }),
    });
  });

  if (hasOwn(block, 'script') && context.authoringActionName !== 'applyBlueprint') {
    pushAuthoringError(errors, {
      path: `${path}.script`,
      ruleId: 'jsBlock-script-unsupported',
      message: `flowSurfaces authoring ${path}.script is only supported by applyBlueprint assets.scripts; use ${path}.settings.code for localized jsBlock inline JS code`,
      details: withJsBlockRepairHint(),
    });
  }

  const settings = _.isPlainObject(block.settings) ? block.settings : undefined;
  if (settings) {
    Object.keys(settings).forEach((key) => {
      if (JS_BLOCK_ALLOWED_SETTINGS_KEYS.has(key)) {
        return;
      }
      pushAuthoringError(errors, {
        path: `${path}.settings.${key}`,
        ruleId: 'jsBlock-settings-unsupported-key',
        message: `flowSurfaces authoring ${path}.settings.${key} is not part of the public jsBlock contract; use ${path}.settings.code, ${path}.settings.version, and ${path}.settings.showBlockCard for public JS block settings`,
        details: withJsBlockRepairHint({
          key,
          allowedKeys: Array.from(JS_BLOCK_ALLOWED_SETTINGS_KEYS),
        }),
      });
    });
  }

  const inlineKeys = settings ? JS_BLOCK_TOP_LEVEL_JS_KEYS.filter((key) => hasOwn(settings, key)) : [];
  if (hasOwn(block, 'script') && inlineKeys.length) {
    pushAuthoringError(errors, {
      path: `${path}.script`,
      ruleId: 'jsBlock-mixed-inline-and-script',
      message: `flowSurfaces authoring ${path} cannot combine script asset references with ${inlineKeys
        .map((key) => `settings.${key}`)
        .join(', ')}; use either applyBlueprint assets.scripts + block.script or inline ${path}.settings.code`,
      details: withJsBlockRepairHint({
        inlineKeys,
      }),
    });
  }

  const hasInlineCode = typeof settings?.code === 'string' && !!settings.code.trim();
  const hasApplyBlueprintScriptInput = context.authoringActionName === 'applyBlueprint' && hasOwn(block, 'script');
  const hasScriptReference =
    context.authoringActionName === 'applyBlueprint' && typeof block.script === 'string' && !!block.script.trim();
  if (!hasInlineCode && !hasScriptReference && !hasApplyBlueprintScriptInput) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'jsBlock-source-required',
      message: `flowSurfaces authoring ${path} jsBlock must include inline ${path}.settings.code or, for applyBlueprint only, a block.script asset reference`,
      details: withJsBlockRepairHint(),
    });
  }
}

function collectJsBlockConfigurePublicContractErrors(changes: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(changes)) {
    return;
  }

  JS_BLOCK_INTERNAL_AUTHORING_KEYS.forEach((key) => {
    if (!hasOwn(changes, key)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${path}.${key}`,
      ruleId: key === 'stepParams' ? 'jsBlock-stepParams-unsupported' : 'jsBlock-internal-field-unsupported',
      message: `flowSurfaces authoring ${path}.${key} is not accepted on public jsBlock configure changes; use ${path}.code, ${path}.version, and ${path}.showBlockCard instead of internal persisted fields`,
      details: withJsBlockRepairHint({
        key,
      }),
    });
  });

  if (hasOwn(changes, 'script')) {
    pushAuthoringError(errors, {
      path: `${path}.script`,
      ruleId: 'jsBlock-script-unsupported',
      message: `flowSurfaces authoring ${path}.script is only supported by applyBlueprint assets.scripts; use ${path}.code for localized jsBlock configure JS code`,
      details: withJsBlockRepairHint(),
    });
  }

  const inlineKeys = JS_BLOCK_TOP_LEVEL_JS_KEYS.filter((key) => hasOwn(changes, key));
  if (hasOwn(changes, 'script') && inlineKeys.length) {
    pushAuthoringError(errors, {
      path: `${path}.script`,
      ruleId: 'jsBlock-mixed-inline-and-script',
      message: `flowSurfaces authoring ${path} cannot combine script asset references with ${inlineKeys
        .map((key) => `${path}.${key}`)
        .join(', ')}; use either applyBlueprint assets.scripts + block.script or localized ${path}.code`,
      details: withJsBlockRepairHint({
        inlineKeys,
      }),
    });
  }

  if (!hasOwn(changes, 'settings')) {
    return;
  }
  const settings = _.isPlainObject(changes.settings) ? changes.settings : undefined;
  if (!settings) {
    pushAuthoringError(errors, {
      path: `${path}.settings`,
      ruleId: 'jsBlock-settings-unsupported-key',
      message: `flowSurfaces authoring ${path}.settings is not part of the public jsBlock configure contract; use ${path}.code, ${path}.version, and ${path}.showBlockCard`,
      details: withJsBlockRepairHint(),
    });
    return;
  }
  Object.keys(settings).forEach((key) => {
    pushAuthoringError(errors, {
      path: `${path}.settings.${key}`,
      ruleId: 'jsBlock-settings-unsupported-key',
      message: `flowSurfaces authoring ${path}.settings.${key} is not part of the public jsBlock configure contract; use ${path}.${key}`,
      details: withJsBlockRepairHint({
        key,
      }),
    });
  });
}

function collectRemovedDefaultActionOptOutErrors(block: any, path: string, errors: AuthoringErrorInput[]) {
  const removedKeys = ['skipDefaultActions', 'skipDefaultRecordActions'].filter((key) =>
    Object.prototype.hasOwnProperty.call(block, key),
  );
  if (!removedKeys.length) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'default-actions-opt-out-unsupported',
    message:
      'flowSurfaces authoring no longer supports skipDefaultActions or skipDefaultRecordActions; default actions always merge with explicit actions',
    details: {
      keys: removedKeys,
    },
  });
}

function collectUnsupportedMainBlockSectionErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
) {
  const unsupportedSections = MAIN_BLOCK_UNSUPPORTED_SECTIONS[blockType];
  if (!unsupportedSections) {
    return;
  }

  unsupportedSections.forEach((section) => {
    if (!Object.prototype.hasOwnProperty.call(block, section)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${path}.${section}`,
      ruleId: `${blockType}-main-block-unsupported-${section}`,
      message: `flowSurfaces authoring ${path} ${blockType} main blocks do not support ${section}`,
      details:
        blockType === 'calendar'
          ? buildCalendarMainBlockRepairDetails(section)
          : blockType === 'kanban'
            ? buildKanbanMainBlockRepairDetails(section)
            : undefined,
    });
  });
}

function collectApplyBlueprintKanbanFieldLimitErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (
    context.authoringActionName !== 'applyBlueprint' ||
    blockType !== 'kanban' ||
    hasFlowSurfaceTemplateReference(block?.template) ||
    !Array.isArray(block.fields)
  ) {
    return;
  }
  if (block.fields.length <= 2) {
    return;
  }
  pushAuthoringError(errors, {
    path: `${path}.fields`,
    ruleId: 'kanban-main-fields-too-many',
    message: `flowSurfaces authoring ${path}.fields supports at most 2 fields for applyBlueprint kanban main blocks`,
    details: {
      max: 2,
      count: block.fields.length,
      repairHint:
        'Kanban main block fields controls compact card display only. Keep at most 2 fields in applyBlueprint kanban fields, move richer card details to settings.cardPopup, and keep block type kanban.',
    },
  });
}

function collectFieldGroupsShapeErrors(
  fieldGroups: any,
  blockPath: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
  localKeys: Set<string> = new Set<string>(),
) {
  if (typeof fieldGroups === 'undefined') {
    return;
  }
  if (!Array.isArray(fieldGroups) || !fieldGroups.length) {
    pushAuthoringError(errors, {
      path: `${blockPath}.fieldGroups`,
      ruleId: 'fieldGroups-invalid-shape',
      message: `flowSurfaces authoring ${blockPath}.fieldGroups must be a non-empty array`,
    });
    return;
  }

  fieldGroups.forEach((group, index) => {
    const groupPath = `${blockPath}.fieldGroups[${index}]`;
    if (!_.isPlainObject(group)) {
      pushAuthoringError(errors, {
        path: groupPath,
        ruleId: 'fieldGroups-group-invalid-shape',
        message: `flowSurfaces authoring ${groupPath} must be an object`,
      });
      return;
    }
    if (!String(group.title || '').trim()) {
      pushAuthoringError(errors, {
        path: `${groupPath}.title`,
        ruleId: 'fieldGroups-group-title-required',
        message: `flowSurfaces authoring ${groupPath}.title is required`,
      });
    }
    if (!Array.isArray(group.fields) || !group.fields.length) {
      pushAuthoringError(errors, {
        path: `${groupPath}.fields`,
        ruleId: 'fieldGroups-group-fields-required',
        message: `flowSurfaces authoring ${groupPath}.fields must be a non-empty array`,
      });
    } else {
      group.fields.forEach((field: any, fieldIndex: number) => {
        const itemPath = `${groupPath}.fields[${fieldIndex}]`;
        collectInternalFieldKeysErrors(field, itemPath, errors);
        const fieldPath = getAssociationAwareFieldPathInput(field);
        if (fieldPath) {
          collectUnknownFieldPathError(fieldPath, itemPath, block, context, errors);
        }
        collectImplicitRelationTitleFieldErrors(field, itemPath, block, context, errors);
        if (!_.isPlainObject(field)) {
          return;
        }
        collectApplyBlueprintScriptAssetReferenceErrors(field, itemPath, errors, context);
        collectRelationTitleFieldErrors(field, itemPath, block, context, errors);
        collectRelationPopupResourceErrors(field, itemPath, block, context, errors);
        collectPopupErrors(
          field.popup,
          `${itemPath}.popup`,
          errors,
          localKeys,
          getFieldPopupValidationContext(field, block, context),
        );
      });
    }
  });
}

async function collectConfigureErrors(
  values: any,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  const changes = values.changes;
  if (!_.isPlainObject(changes)) {
    return;
  }
  const hostBlockType = normalizeAuthoringHostBlockType(context.hostBlockType);
  const changesBlock = {
    ...changes,
    type: hostBlockType,
    collection: context.hostCollectionName,
    dataSourceKey: context.hostDataSourceKey,
  };
  const localKeys = new Set<string>();
  collectLocalKeys(changes, localKeys);
  if (hostBlockType === 'jsBlock') {
    collectJsBlockConfigurePublicContractErrors(changes, '$.changes', errors);
  }
  if (
    Object.prototype.hasOwnProperty.call(changes, 'fieldsLayout') &&
    Object.prototype.hasOwnProperty.call(changes, 'fieldGroups')
  ) {
    pushAuthoringError(errors, {
      path: '$.changes',
      ruleId: 'configure-fieldsLayout-fieldGroups-mutually-exclusive',
      message: 'flowSurfaces authoring $.changes cannot mix fieldsLayout with fieldGroups',
    });
  }
  collectUnsupportedFieldAuthoringHostErrors(changesBlock, hostBlockType, '$.changes', errors);
  collectFieldGroupsShapeErrors(changes.fieldGroups, '$.changes', errors, changesBlock, context, localKeys);
  collectSortingAliasErrors(changes, '$.changes', hostBlockType, errors);
  collectDefaultFilterErrors(changes.defaultFilter, '$.changes.defaultFilter', errors, changesBlock, context);
  collectSemanticBindingErrors(changesBlock, hostBlockType, '$.changes', errors, context);
  collectCommentsBlockErrors(changesBlock, hostBlockType, '$.changes', errors, context);
  collectRecordHistoryBlockErrors(changesBlock, hostBlockType, '$.changes', errors, context);
  collectChartDisplayTitleErrors(changes, hostBlockType, '$.changes', errors);
  collectChartConfigureFilterOperatorErrors(changes, hostBlockType, '$.changes', errors, context);
  collectTableSettingsErrors(changes, hostBlockType, '$.changes', errors, { directSettings: true }, context);
  collectGridCardSettingsErrors(changes, hostBlockType, '$.changes', errors, { directSettings: true });
  collectAssignValuesErrors(changes.assignValues, '$.changes.assignValues', errors, changesBlock, context);
  collectTriggerWorkflowsErrors(changes.triggerWorkflows, '$.changes.triggerWorkflows', errors);
  collectLinkageRulesErrors(changes.linkageRules, '$.changes.linkageRules', errors);
  collectFieldListInternalKeyErrors(changes.fields, '$.changes.fields', errors);
  const connectFieldsTargets = collectTreeConnectFieldsErrors(changes.connectFields, '$.changes.connectFields', errors);
  await collectTreeConnectFieldsLiveErrors(connectFieldsTargets, changes, '$.changes.connectFields', errors, context);
  collectPopupLikeErrors(changes.popup, '$.changes.popup', errors, context);
  collectHiddenPopupSettingsErrors(changes, '$.changes', hostBlockType, errors, context);
}

function normalizeAuthoringHostBlockType(value: any) {
  const normalized = String(value || '').trim();
  return PUBLIC_BLOCK_TYPE_BY_MODEL_USE[normalized] || normalized;
}

function collectUnsupportedFieldAuthoringHostErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
) {
  if (Object.prototype.hasOwnProperty.call(block, 'fieldGroups') && !FIELD_GROUP_BLOCK_TYPES.has(blockType)) {
    pushAuthoringError(errors, {
      path: `${blockPath}.fieldGroups`,
      ruleId: 'fieldGroups-host-unsupported',
      message: `flowSurfaces authoring ${blockPath}.fieldGroups is only supported on createForm, editForm, or details blocks`,
      details: {
        blockType,
        supportedBlockTypes: Array.from(FIELD_GROUP_BLOCK_TYPES),
      },
    });
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fieldsLayout') && !FIELD_GRID_BLOCK_TYPES.has(blockType)) {
    pushAuthoringError(errors, {
      path: `${blockPath}.fieldsLayout`,
      ruleId: 'fieldsLayout-host-unsupported',
      message: `flowSurfaces authoring ${blockPath}.fieldsLayout is only supported on createForm, editForm, details, or filterForm blocks`,
      details: {
        blockType,
        supportedBlockTypes: Array.from(FIELD_GRID_BLOCK_TYPES),
      },
    });
  }
}

function pushAuthoringError(errors: AuthoringErrorInput[], error: AuthoringErrorInput) {
  errors.push({
    type: 'bad_request',
    code: 'FLOW_SURFACE_AUTHORING_VALIDATION_ERROR',
    status: 400,
    ...error,
    message: appendRepairHintToAuthoringMessage(error),
  });
}

function appendRepairHintToAuthoringMessage(error: AuthoringErrorInput) {
  const repairHint = typeof error.details?.repairHint === 'string' ? error.details.repairHint.trim() : '';
  if (!repairHint || error.message.includes(repairHint)) {
    return error.message;
  }
  return `${error.message}. ${repairHint}`;
}

function hasOwnDefined(value: any, key: string) {
  return _.isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, key) && !_.isUndefined(value[key]);
}

function hasOwn(value: any, key: string) {
  return _.isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function buildSupportedDefaultFilterOperators() {
  const supported = new Set<string>(Object.keys(databaseOperators || {}));
  for (const key in Op) {
    const snakeKey = _.snakeCase(key);
    supported.add(`$${key}`);
    supported.add(`$${snakeKey}`);
    supported.add(`$${snakeKey.replace(/_/g, '')}`);
  }
  return supported;
}

function isSupportedDefaultFilterOperator(operator: any) {
  return typeof operator === 'string' && SUPPORTED_DEFAULT_FILTER_OPERATORS.has(operator.trim());
}

function collectUnsupportedDefaultFilterOperatorError(operator: any, path: string, errors: AuthoringErrorInput[]) {
  const normalizedOperator = String(operator || '').trim();
  if (!normalizedOperator || isSupportedDefaultFilterOperator(normalizedOperator)) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'defaultFilter-invalid-operator',
    message: `flowSurfaces authoring ${path} must use a supported filter operator`,
    details: {
      operator: normalizedOperator,
    },
  });
}

function collectDefaultFilterDateValueError(
  operator: any,
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  fieldContext?: FlowSurfaceDateConditionFieldContext | null,
  options: {
    allowContextPathValue?: boolean;
  } = {},
) {
  const fieldMeta = getDateConditionFieldContextMeta(fieldContext);
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : '';
  if (!FLOW_SURFACE_DATE_FILTER_OPERATORS.has(normalizedOperator) && !isFlowSurfaceDateLikeFieldMeta(fieldMeta)) {
    return;
  }
  try {
    normalizeFlowSurfaceDateConditionValue(operator, value, path, {
      fieldPath: fieldContext?.fieldPath,
      fieldType: fieldMeta.type,
      fieldInterface: fieldMeta.interface,
      allowContextPathValue: options.allowContextPathValue,
    });
  } catch (error) {
    if (!(error instanceof FlowSurfaceBadRequestError)) {
      throw error;
    }
    const details = _.isPlainObject(error.options?.details) ? error.options.details : {};
    pushAuthoringError(errors, {
      path: typeof error.options?.path === 'string' && error.options.path ? error.options.path : path,
      ruleId:
        typeof error.options?.ruleId === 'string' && error.options.ruleId
          ? error.options.ruleId
          : 'filter-group-date-value-invalid',
      message: error.message,
      details,
    });
  }
}

function collectPublicDataScopeDateOperatorError(
  operator: any,
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  fieldContext?: FlowSurfaceDateConditionFieldContext | null,
) {
  const fieldMeta = getDateConditionFieldContextMeta(fieldContext);
  if (!isFlowSurfaceDateLikeFieldMeta(fieldMeta)) {
    return;
  }
  const normalizedOperator = typeof operator === 'string' ? operator.trim() : '';
  if (FLOW_SURFACE_DATA_SCOPE_DATE_ALLOWED_OPERATORS.has(normalizedOperator)) {
    return;
  }

  const isComparisonOperator = FLOW_SURFACE_DATA_SCOPE_DATE_UI_INCOMPATIBLE_OPERATORS.has(normalizedOperator);
  const suggestedOperator = isComparisonOperator
    ? getSuggestedPublicDataScopeDateOperator(normalizedOperator)
    : undefined;
  const suggestedValue = getSuggestedPublicDataScopeDateValue(value);
  pushAuthoringError(errors, {
    path,
    ruleId: 'dataScope-date-operator-ui-incompatible',
    message: `flowSurfaces authoring ${path} cannot use operator '${normalizedOperator}' for a date/datetime DataScope condition`,
    details: {
      fieldPath: fieldContext?.fieldPath,
      fieldType: fieldMeta.type,
      fieldInterface: fieldMeta.interface,
      invalidOperator: normalizedOperator,
      invalidValue: value,
      allowedOperators: Array.from(FLOW_SURFACE_DATA_SCOPE_DATE_ALLOWED_OPERATORS),
      ...(suggestedOperator ? { suggestedOperator } : {}),
      ...(typeof suggestedValue !== 'undefined' ? { suggestedValue } : {}),
      repairHint:
        'For public settings.dataScope date/datetime fields, use UI date operators such as $dateOn with UI date values like "2026-07-05"; do not move fixed data-range conditions to defaultFilter.',
      repairExample: {
        logic: '$and',
        items: [
          {
            path: fieldContext?.fieldPath || 'createdAt',
            operator: suggestedOperator || '$dateOn',
            value: typeof suggestedValue !== 'undefined' ? suggestedValue : '2026-07-05',
          },
        ],
      },
      agentInstruction:
        'Replace date/datetime DataScope comparison operators with $dateOn/$dateNotOn/$dateBefore/$dateAfter/$dateNotBefore/$dateNotAfter/$dateBetween and UI date values. Keep the condition in dataScope when it is a fixed data range.',
    },
  });
}

function getSuggestedPublicDataScopeDateOperator(operator: string) {
  switch (operator) {
    case '$eq':
      return '$dateOn';
    case '$ne':
      return '$dateNotOn';
    case '$lt':
      return '$dateBefore';
    case '$lte':
      return '$dateNotAfter';
    case '$gt':
      return '$dateAfter';
    case '$gte':
      return '$dateNotBefore';
    default:
      return undefined;
  }
}

function getSuggestedPublicDataScopeDateValue(value: any) {
  if (typeof value === 'string') {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    if (match) {
      return match[1];
    }
  }
  if (Array.isArray(value)) {
    const suggested = value
      .map((item) => (typeof item === 'string' ? /^(\d{4}-\d{2}-\d{2})/.exec(item.trim())?.[1] : undefined))
      .filter(Boolean);
    if (suggested.length === value.length && suggested.length > 0) {
      return suggested;
    }
  }
  return undefined;
}

function collectTopLevelLayoutErrors(
  actionName: FlowSurfaceAuthoringWriteAction,
  values: any,
  errors: AuthoringErrorInput[],
) {
  if (actionName !== 'applyBlueprint') {
    return;
  }
  _.castArray(values.tabs || []).forEach((tab, tabIndex) => {
    if (!_.isPlainObject(tab)) {
      return;
    }
    collectPublicLayoutErrors(
      tab.layout,
      `$.tabs[${tabIndex}].layout`,
      getBlockLayoutEntries(tab.blocks, `$.tabs[${tabIndex}].blocks`),
      'block',
      errors,
    );
  });
}

function collectPublicLayoutErrors(
  layout: any,
  layoutPath: string,
  knownEntries: LayoutKnownEntry[],
  kind: 'block' | 'field',
  errors: AuthoringErrorInput[],
  options: { skipSingleColumn?: boolean } = {},
) {
  if (_.isUndefined(layout)) {
    return;
  }
  if (!_.isPlainObject(layout)) {
    pushAuthoringError(errors, {
      path: layoutPath,
      ruleId: `${kind}-layout-invalid-shape`,
      message: `flowSurfaces authoring ${layoutPath} must be an object`,
    });
    return;
  }
  const rows = layout.rows;
  if (!Array.isArray(rows) || !rows.length) {
    pushAuthoringError(errors, {
      path: `${layoutPath}.rows`,
      ruleId: `${kind}-layout-rows-required`,
      message: `flowSurfaces authoring ${layoutPath}.rows must be a non-empty array`,
    });
    return;
  }
  const knownByKey = new Map<string, LayoutKnownEntry>();
  knownEntries.forEach((entry) => {
    if (entry.key && !knownByKey.has(entry.key)) {
      knownByKey.set(entry.key, entry);
    }
  });
  if (kind === 'block') {
    knownEntries
      .filter((entry) => !entry.key)
      .forEach((entry) => {
        pushAuthoringError(errors, {
          path: `${entry.path}.key`,
          ruleId: 'block-layout-key-required',
          message: `flowSurfaces authoring ${entry.path}.key is required when explicit layout is provided`,
        });
      });
  }
  const mentioned = new Set<string>();
  const rowKeys: string[][] = [];
  rows.forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row) || !row.length) {
      pushAuthoringError(errors, {
        path: `${layoutPath}.rows[${rowIndex}]`,
        ruleId: `${kind}-layout-row-invalid-shape`,
        message: `flowSurfaces authoring ${layoutPath}.rows[${rowIndex}] must be a non-empty array`,
      });
      return;
    }
    const currentRowKeys: string[] = [];
    rowKeys.push(currentRowKeys);
    row.forEach((cell: any, cellIndex: number) => {
      const key = getLayoutCellKey(cell);
      const cellPath = `${layoutPath}.rows[${rowIndex}][${cellIndex}]`;
      if (!key) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: `${kind}-layout-cell-invalid-shape`,
          message: `flowSurfaces authoring ${cellPath} must reference a ${kind} key`,
        });
        return;
      }
      currentRowKeys.push(key);
      if (!knownByKey.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: `${kind}-layout-unknown-key`,
          message: `flowSurfaces authoring ${cellPath} references unknown ${kind} '${key}'`,
        });
      }
      if (mentioned.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: `${kind}-layout-duplicate-key`,
          message: `flowSurfaces authoring ${cellPath} duplicates ${kind} '${key}'`,
        });
      }
      mentioned.add(key);
    });
  });
  for (const entry of knownByKey.values()) {
    if (mentioned.has(entry.key)) {
      continue;
    }
    pushAuthoringError(errors, {
      path: entry.path,
      ruleId: `${kind}-layout-missing-key`,
      message: `flowSurfaces authoring ${entry.path} must appear exactly once in explicit layout rows`,
    });
  }
  if (kind !== 'block' || knownByKey.size <= 1) {
    return;
  }
  const filterKeys = Array.from(knownByKey.values())
    .filter((entry) => isFilterBlockType(entry.type))
    .map((entry) => entry.key);
  if (filterKeys.length) {
    const firstRow = rowKeys[0] || [];
    const firstRowContainsOnlyFilters =
      firstRow.length > 0 && firstRow.every((key) => filterKeys.includes(key) || !knownByKey.has(key));
    const allFiltersPlacedFirst = filterKeys.every((key) => firstRow.includes(key));
    if (!firstRowContainsOnlyFilters || !allFiltersPlacedFirst) {
      pushAuthoringError(errors, {
        path: `${layoutPath}.rows[0]`,
        ruleId: 'block-layout-filter-must-lead',
        message: `flowSurfaces authoring ${layoutPath}.rows[0] must place all filter blocks alone in the first row`,
      });
    }
  }
  const nonFilterKeys = new Set(
    Array.from(knownByKey.values())
      .filter((entry) => !isFilterBlockType(entry.type))
      .map((entry) => entry.key),
  );
  const nonFilterRows = rowKeys
    .map((row) => row.filter((key) => nonFilterKeys.has(key)))
    .filter((row) => row.length > 0);
  if (
    !options.skipSingleColumn &&
    nonFilterKeys.size > 1 &&
    nonFilterRows.length >= nonFilterKeys.size &&
    nonFilterRows.every((row) => row.length <= 1)
  ) {
    pushAuthoringError(errors, {
      path: `${layoutPath}.rows`,
      ruleId: 'block-layout-single-column',
      message: `flowSurfaces authoring ${layoutPath}.rows must not place every non-filter block on its own row`,
      details: buildTwoColumnLayoutRepairDetails(),
    });
  }
}

function collectFieldsLayoutErrors(block: any, blockPath: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(block.fieldsLayout)) {
    return;
  }
  const layoutPath = `${blockPath}.fieldsLayout`;
  if (!_.isPlainObject(block.fieldsLayout)) {
    pushAuthoringError(errors, {
      path: layoutPath,
      ruleId: 'fieldsLayout-invalid-shape',
      message: `flowSurfaces authoring ${layoutPath} must be an object`,
    });
    return;
  }
  const fieldKeys = getFieldKeys(block.fields);
  if (!fieldKeys.length) {
    pushAuthoringError(errors, {
      path: layoutPath,
      ruleId: 'fieldsLayout-fields-required',
      message: `flowSurfaces authoring ${layoutPath} requires fields[] on the same block`,
    });
    return;
  }
  const rows = block.fieldsLayout.rows;
  if (!Array.isArray(rows) || !rows.length) {
    pushAuthoringError(errors, {
      path: `${layoutPath}.rows`,
      ruleId: 'fieldsLayout-rows-required',
      message: `flowSurfaces authoring ${layoutPath}.rows must be a non-empty array`,
    });
    return;
  }
  const known = new Set(fieldKeys);
  const mentioned = new Set<string>();
  const rowFieldCounts: number[] = [];
  rows.forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row) || !row.length) {
      pushAuthoringError(errors, {
        path: `${layoutPath}.rows[${rowIndex}]`,
        ruleId: 'fieldsLayout-row-invalid-shape',
        message: `flowSurfaces authoring ${layoutPath}.rows[${rowIndex}] must be a non-empty array`,
      });
      return;
    }
    let rowFieldCount = 0;
    row.forEach((cell: any, cellIndex: number) => {
      const key = getLayoutCellKey(cell);
      const cellPath = `${layoutPath}.rows[${rowIndex}][${cellIndex}]`;
      if (!key) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: 'fieldsLayout-cell-invalid-shape',
          message: `flowSurfaces authoring ${cellPath} must reference a field key`,
        });
        return;
      }
      if (!known.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: 'fieldsLayout-unknown-field-key',
          message: `flowSurfaces authoring ${cellPath} references unknown field '${key}'`,
        });
      }
      if (known.has(key)) {
        rowFieldCount += 1;
      }
      if (mentioned.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: 'fieldsLayout-duplicate-field-key',
          message: `flowSurfaces authoring ${cellPath} duplicates field '${key}'`,
        });
      }
      mentioned.add(key);
    });
    if (rowFieldCount > 0) {
      rowFieldCounts.push(rowFieldCount);
    }
  });
  fieldKeys.forEach((key, index) => {
    if (mentioned.has(key)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${blockPath}.fields[${index}]`,
      ruleId: 'fieldsLayout-missing-field-key',
      message: `flowSurfaces authoring ${blockPath}.fields[${index}] must appear exactly once in fieldsLayout rows`,
    });
  });
  const blockType = String(block.type || '').trim();
  const requiresCompactRows =
    (blockType === 'filterForm' && fieldKeys.length >= 3) || (blockType !== 'filterForm' && fieldKeys.length >= 2);
  if (requiresCompactRows && rowFieldCounts.length >= fieldKeys.length && rowFieldCounts.every((count) => count <= 1)) {
    pushAuthoringError(errors, {
      path: `${layoutPath}.rows`,
      ruleId: 'fieldsLayout-single-column',
      message: `flowSurfaces authoring ${layoutPath}.rows must not place every field on its own row`,
    });
  }
}

function collectSortingAliasErrors(
  settings: any,
  settingsPath: string,
  blockType: string | undefined,
  errors: AuthoringErrorInput[],
) {
  if (!_.isPlainObject(settings) || !Object.prototype.hasOwnProperty.call(settings, 'sort')) {
    return;
  }
  if (blockType && !SORTABLE_BLOCK_TYPES.has(blockType)) {
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(settings, 'sorting')) {
    collectSortingShapeErrors(settings.sort, `${settingsPath}.sort`, errors);
    return;
  }
  const sort = normalizeAuthoringSorting(settings.sort, `${settingsPath}.sort`, errors);
  const sorting = normalizeAuthoringSorting(settings.sorting, `${settingsPath}.sorting`, errors);
  if (!sort || !sorting) {
    return;
  }
  if (!_.isEqual(sort, sorting)) {
    pushAuthoringError(errors, {
      path: `${settingsPath}.sort`,
      ruleId: 'sort-alias-conflict',
      message: `flowSurfaces authoring ${settingsPath}.sort conflicts with ${settingsPath}.sorting; use canonical sorting`,
    });
  }
}

function collectSortingShapeErrors(value: any, path: string, errors: AuthoringErrorInput[]) {
  normalizeAuthoringSorting(value, path, errors);
}

function normalizeAuthoringSorting(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (!Array.isArray(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'sort-alias-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an array`,
    });
    return null;
  }
  const normalized: Array<{ field: string; direction: 'asc' | 'desc' }> = [];
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (typeof item === 'string') {
      const raw = item.trim();
      const field = raw.startsWith('-') ? raw.slice(1).trim() : raw;
      if (!field) {
        pushAuthoringError(errors, {
          path: itemPath,
          ruleId: 'sort-alias-field-required',
          message: `flowSurfaces authoring ${itemPath} must include a non-empty field`,
        });
        return;
      }
      normalized.push({
        field,
        direction: raw.startsWith('-') ? 'desc' : 'asc',
      });
      return;
    }
    if (!_.isPlainObject(item)) {
      pushAuthoringError(errors, {
        path: itemPath,
        ruleId: 'sort-alias-item-invalid-shape',
        message: `flowSurfaces authoring ${itemPath} must be a string or an object with field and direction`,
      });
      return;
    }
    const field = String(item.field || '').trim();
    if (!field) {
      pushAuthoringError(errors, {
        path: `${itemPath}.field`,
        ruleId: 'sort-alias-field-required',
        message: `flowSurfaces authoring ${itemPath}.field must be a non-empty field`,
      });
    }
    const direction = normalizeAuthoringSortDirection(item.direction, `${itemPath}.direction`, errors);
    if (field && direction) {
      normalized.push({
        field,
        direction,
      });
    }
  });
  return normalized;
}

function normalizeAuthoringSortDirection(value: any, path: string, errors: AuthoringErrorInput[]) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized || normalized === 'asc' || normalized === 'ascend' || normalized === 'ascending') {
    return 'asc';
  }
  if (normalized === 'desc' || normalized === 'descend' || normalized === 'descending') {
    return 'desc';
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'sort-alias-direction-invalid',
    message: `flowSurfaces authoring ${path} must be 'asc' or 'desc'`,
  });
  return null;
}

function collectDefaultFilterErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (_.isUndefined(value)) {
    return;
  }
  if (value === null || (_.isPlainObject(value) && !Object.keys(value).length)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-explicit-empty',
      message: `flowSurfaces authoring ${path} cannot be explicitly empty`,
    });
    return;
  }
  if (!_.isPlainObject(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-invalid-shape',
      message: `flowSurfaces authoring ${path} must be a filter group object`,
    });
    return;
  }
  collectDefaultFilterGroupShapeErrors(value, path, errors);
  if (!hasConcreteFilterItem(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-explicit-empty',
      message: `flowSurfaces authoring ${path} must include at least one concrete filter item`,
    });
  }
  collectDefaultFilterFieldCountErrors(value, path, errors, block, context);
  visitFilterItems(value, path, errors, block, context);
}

function collectDefaultFilterFieldCountErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  const fieldNames = resolveFlowSurfaceDefaultFilterFieldNames(value).filter((fieldName) =>
    isFlowSurfaceDefaultFilterFieldPathEligible(fieldName, block, context),
  );
  const requiredFieldCount = resolveDefaultFilterRequiredFieldCount(block, context);
  if (fieldNames.length >= requiredFieldCount) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'defaultFilter-minimum-fields',
    message: `flowSurfaces authoring ${path} must include at least ${requiredFieldCount} filterable fields`,
    details: {
      fieldCount: fieldNames.length,
      requiredFieldCount,
      fieldNames,
    },
  });
}

function isFlowSurfaceDefaultFilterFieldPathEligible(
  fieldPath: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!isDirectDefaultFilterFieldPath(fieldPath)) {
    return false;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return false;
  }
  const resolved = resolveDefaultFilterFieldPath(
    collection,
    normalizeFieldPath(fieldPath),
    getBlockDataSourceKey(block, context),
    context,
  );
  return !!resolved.field && isFlowSurfaceDefaultFilterEligibleField(resolved.field);
}

function isDirectDefaultFilterFieldPath(fieldPath: string) {
  return normalizeFieldPath(fieldPath).split('.').filter(Boolean).length === 1;
}

function resolveDefaultFilterRequiredFieldCount(block?: any, context: FlowSurfaceAuthoringValidationContext = {}) {
  const collection = block ? getBlockCollection(block, context) : null;
  if (!collection) {
    return FLOW_SURFACE_DEFAULT_FILTER_REQUIRED_FIELD_COUNT;
  }
  return resolveFlowSurfaceDefaultFilterRequiredFieldCount(collection);
}

function collectEffectiveDefaultFilterFieldCountErrors(
  block: any,
  blockPath: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!doesBlockConsumeDefaultFilterAction(block)) {
    return;
  }
  if (hasOwnDefined(block, 'defaultFilter') || hasOwnDefined(block?.defaultActionSettings?.filter, 'defaultFilter')) {
    return;
  }
  const effectiveDefaultFilter = getEffectiveFilterSettingsDefaultFilter(
    block,
    undefined,
    `${blockPath}.defaultActionSettings.filter`,
    blockPath,
    context,
  );
  if (!effectiveDefaultFilter) {
    return;
  }
  collectDefaultFilterFieldCountErrors(
    effectiveDefaultFilter.value,
    effectiveDefaultFilter.path,
    errors,
    block,
    context,
  );
}

function collectDefaultFilterGroupShapeErrors(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-invalid-shape',
      message: `flowSurfaces authoring ${path} must be a filter group object`,
    });
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'logic')) {
    pushAuthoringError(errors, {
      path: `${path}.logic`,
      ruleId: 'defaultFilter-logic-required',
      message: `flowSurfaces authoring ${path}.logic is required`,
    });
  } else if (value.logic !== '$and' && value.logic !== '$or') {
    pushAuthoringError(errors, {
      path: `${path}.logic`,
      ruleId: 'defaultFilter-invalid-logic',
      message: `flowSurfaces authoring ${path}.logic must be '$and' or '$or'`,
    });
  }
  if (!Object.prototype.hasOwnProperty.call(value, 'items')) {
    pushAuthoringError(errors, {
      path: `${path}.items`,
      ruleId: 'defaultFilter-items-required',
      message: `flowSurfaces authoring ${path}.items is required`,
    });
    return;
  }
  if (!Array.isArray(value.items)) {
    pushAuthoringError(errors, {
      path: `${path}.items`,
      ruleId: 'defaultFilter-items-invalid-shape',
      message: `flowSurfaces authoring ${path}.items must be an array`,
    });
    return;
  }
  value.items.forEach((item: any, index: number) => {
    const itemPath = `${path}.items[${index}]`;
    if (_.isPlainObject(item) && Object.prototype.hasOwnProperty.call(item, 'logic')) {
      collectDefaultFilterGroupShapeErrors(item, itemPath, errors);
      return;
    }
    if (!_.isPlainObject(item)) {
      pushAuthoringError(errors, {
        path: itemPath,
        ruleId: 'defaultFilter-item-invalid-shape',
        message: `flowSurfaces authoring ${itemPath} must be a filter item object`,
      });
      return;
    }
    const itemFieldPath =
      typeof item.path === 'string' && item.path.trim()
        ? item.path.trim()
        : typeof item.field === 'string' && item.field.trim()
          ? item.field.trim()
          : '';
    const itemOperator = typeof item.operator === 'string' && item.operator.trim() ? item.operator.trim() : '';
    if (!itemFieldPath || !itemOperator) {
      pushAuthoringError(errors, {
        path: itemPath,
        ruleId: 'defaultFilter-item-invalid-shape',
        message: `flowSurfaces authoring ${itemPath} must include path and operator`,
      });
    }
  });
}

function collectTemplateBackedPublicDataSurfaceDefaultOverrideErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
) {
  if (!isFlowSurfacePublicDataSurfaceBlockType(blockType) || !hasFlowSurfaceTemplateDocument(block?.template)) {
    return;
  }
  if (hasOwn(block, 'defaultFilter')) {
    pushAuthoringError(errors, {
      path: `${path}.defaultFilter`,
      ruleId: 'data-surface-block-default-filter-template-unsupported',
      message:
        'Template-backed table, list, gridCard, calendar, and kanban blocks do not support block-level defaultFilter; only direct blocks may define it.',
    });
  }
  if (hasOwn(block, 'defaultActionSettings')) {
    pushAuthoringError(errors, {
      path: `${path}.defaultActionSettings`,
      ruleId: 'data-surface-block-default-action-settings-template-unsupported',
      message:
        'Template-backed table, list, gridCard, calendar, and kanban blocks do not support defaultActionSettings; use filter action settings on direct blocks instead.',
    });
  }
}

function collectDefaultActionSettingsFilterErrors(
  defaultActionSettings: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (_.isUndefined(defaultActionSettings)) {
    return;
  }
  if (!_.isPlainObject(defaultActionSettings)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultActionSettings-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(defaultActionSettings, 'filter')) {
    return;
  }
  if (!doesBlockConsumeDefaultFilterAction(block)) {
    return;
  }
  const filterSettings = defaultActionSettings.filter;
  const filterSettingsPath = `${path}.filter`;
  if (!_.isPlainObject(filterSettings)) {
    pushAuthoringError(errors, {
      path: filterSettingsPath,
      ruleId: 'defaultActionSettings-filter-invalid-shape',
      message: `flowSurfaces authoring ${filterSettingsPath} must be an object`,
    });
    return;
  }
  collectDefaultFilterErrors(
    filterSettings.defaultFilter,
    `${filterSettingsPath}.defaultFilter`,
    errors,
    block,
    context,
  );
  const filterableFieldNames = collectFilterableFieldNamesErrors(
    filterSettings.filterableFieldNames,
    `${filterSettingsPath}.filterableFieldNames`,
    errors,
    block,
    context,
  );
  const blockPath = path.replace(/\.defaultActionSettings$/, '');
  const effectiveDefaultFilter = getEffectiveFilterSettingsDefaultFilter(
    block,
    filterSettings,
    filterSettingsPath,
    blockPath,
    context,
  );
  collectDefaultFilterFilterableFieldErrors(
    effectiveDefaultFilter?.value,
    effectiveDefaultFilter?.path || `${filterSettingsPath}.defaultFilter`,
    filterableFieldNames,
    errors,
  );
}

function doesBlockConsumeDefaultFilterAction(block: any) {
  const blockType = String(block?.type || '').trim();
  return isFlowSurfacePublicDataSurfaceBlockType(blockType) && !hasFlowSurfaceTemplateDocument(block?.template);
}

function collectVisibleDataBlockFieldErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!VISIBLE_FIELD_REQUIRED_DATA_BLOCK_TYPES.has(blockType) || hasFlowSurfaceTemplateReference(block?.template)) {
    return;
  }
  const fieldEntries = collectVisibleDataBlockFieldEntries(block, path);
  const validBusinessFieldNames = collectVisibleDataBlockValidBusinessFieldNames(block, context, fieldEntries);
  const hasJsFieldEntry = hasVisibleDataBlockJsFieldEntry(fieldEntries, blockType);
  if (hasJsFieldEntry) {
    return;
  }
  if (!fieldEntries.length || !validBusinessFieldNames.length) {
    const hasBlockFields = Array.isArray(block?.fields);
    const hasBlockFieldGroups = Array.isArray(block?.fieldGroups);
    const fieldConfigPath = !hasBlockFields && hasBlockFieldGroups ? `${path}.fieldGroups` : `${path}.fields`;
    const fieldConfigLabel = !hasBlockFields && hasBlockFieldGroups ? `${path}.fieldGroups[].fields` : `${path}.fields`;
    const suggestedFields = pickVisibleDataBlockFieldSuggestions(block, context);
    pushAuthoringError(errors, {
      path: fieldConfigPath,
      ruleId: 'data-block-visible-fields-required',
      message: `flowSurfaces authoring ${path} ${blockType} block has no valid business fields. Add collection field names to ${fieldConfigLabel}; defaults.collections.*.fieldGroups only configures generated popups/forms and is not a substitute for visible block columns.`,
      details: {
        blockType,
        collection: getBlockCollectionName(block, context),
        fieldCount: fieldEntries.length,
        repairHint: VISIBLE_DATA_BLOCK_FIELDS_REPAIR_HINT,
        agentInstruction: REPAIR_ALL_ERRORS_AGENT_INSTRUCTION,
        ...(suggestedFields.length ? { suggestion: { fields: suggestedFields } } : {}),
      },
    });
    return;
  }

  if (!VISIBLE_FIELD_MINIMUM_DATA_BLOCK_TYPES.has(blockType)) {
    return;
  }
  if (hasUnknownVisibleDataBlockFieldPath(block, context, fieldEntries)) {
    return;
  }
  const eligibleBusinessFields = collectVisibleDataBlockEligibleBusinessFieldNames(block, context);
  if (eligibleBusinessFields.length < RICH_COLLECTION_VISIBLE_FIELD_THRESHOLD) {
    return;
  }
  const requiredFieldCount = Math.min(RICH_DATA_BLOCK_VISIBLE_FIELD_MINIMUM, eligibleBusinessFields.length);
  if (validBusinessFieldNames.length >= requiredFieldCount) {
    return;
  }
  const hasBlockFields = Array.isArray(block?.fields);
  const hasBlockFieldGroups = Array.isArray(block?.fieldGroups);
  const fieldConfigPath = !hasBlockFields && hasBlockFieldGroups ? `${path}.fieldGroups` : `${path}.fields`;
  const fieldConfigLabel = !hasBlockFields && hasBlockFieldGroups ? `${path}.fieldGroups[].fields` : `${path}.fields`;
  pushAuthoringError(errors, {
    path: fieldConfigPath,
    ruleId: 'data-block-visible-fields-minimum',
    message: `flowSurfaces authoring ${path} ${blockType} block only has ${validBusinessFieldNames.length} valid business field(s). Add at least ${requiredFieldCount} collection field names to ${fieldConfigLabel}; defaults.collections.*.fieldGroups only configures generated popups/forms and is not a substitute for visible block columns.`,
    details: {
      blockType,
      collection: getBlockCollectionName(block, context),
      fieldCount: validBusinessFieldNames.length,
      requiredFieldCount,
      eligibleBusinessFieldCount: eligibleBusinessFields.length,
      repairHint: VISIBLE_DATA_BLOCK_FIELDS_REPAIR_HINT,
      agentInstruction: REPAIR_ALL_ERRORS_AGENT_INSTRUCTION,
      suggestion: {
        fields: eligibleBusinessFields.slice(0, requiredFieldCount),
      },
    },
  });
}

function collectVisibleDataBlockFieldEntries(block: any, path: string): Array<{ field: any; path: string }> {
  const entries: Array<{ field: any; path: string }> = [];
  if (Array.isArray(block?.fields)) {
    block.fields.forEach((field: any, index: number) => {
      entries.push({ field, path: `${path}.fields[${index}]` });
    });
  }
  if (Array.isArray(block?.fieldGroups)) {
    block.fieldGroups.forEach((group: any, groupIndex: number) => {
      if (!Array.isArray(group?.fields)) {
        return;
      }
      group.fields.forEach((field: any, fieldIndex: number) => {
        entries.push({
          field,
          path: `${path}.fieldGroups[${groupIndex}].fields[${fieldIndex}]`,
        });
      });
    });
  }
  return entries;
}

function hasVisibleDataBlockJsFieldEntry(fieldEntries: Array<{ field: any; path: string }>, blockType: string) {
  return fieldEntries.some((entry) => isVisibleDataBlockJsField(entry.field, blockType));
}

function isVisibleDataBlockJsField(field: any, blockType: string) {
  if (!_.isPlainObject(field)) {
    return false;
  }
  if (field.hidden === true || field.internal === true || field.actionOnly === true) {
    return false;
  }
  const normalizedType = normalizeVisibleDataBlockJsFieldToken(field.type);
  if (normalizedType === 'jscolumn') {
    return VISIBLE_DATA_BLOCK_JS_COLUMN_BLOCK_TYPES.has(blockType);
  }
  if (normalizedType === 'jsitem') {
    return VISIBLE_DATA_BLOCK_JS_ITEM_BLOCK_TYPES.has(blockType);
  }
  if (
    String(field.renderer || '')
      .trim()
      .toLowerCase() === 'js'
  ) {
    return isVisibleDataBlockBoundJsFieldBlockType(blockType) && !!getAssociationAwareFieldPathInput(field);
  }
  const fieldUse = String(field.use || field.fieldUse || '').trim();
  if (fieldUse === 'JSColumnModel') {
    return VISIBLE_DATA_BLOCK_JS_COLUMN_BLOCK_TYPES.has(blockType);
  }
  if (fieldUse === 'JSItemModel') {
    return VISIBLE_DATA_BLOCK_JS_ITEM_BLOCK_TYPES.has(blockType);
  }
  if (fieldUse === 'JSFieldModel') {
    return VISIBLE_DATA_BLOCK_DISPLAY_JS_FIELD_BLOCK_TYPES.has(blockType) && !!getAssociationAwareFieldPathInput(field);
  }
  if (fieldUse === 'JSEditableFieldModel') {
    return (
      VISIBLE_DATA_BLOCK_EDITABLE_JS_FIELD_BLOCK_TYPES.has(blockType) && !!getAssociationAwareFieldPathInput(field)
    );
  }
  return false;
}

function isVisibleDataBlockBoundJsFieldBlockType(blockType: string) {
  return (
    VISIBLE_DATA_BLOCK_DISPLAY_JS_FIELD_BLOCK_TYPES.has(blockType) ||
    VISIBLE_DATA_BLOCK_EDITABLE_JS_FIELD_BLOCK_TYPES.has(blockType)
  );
}

function normalizeVisibleDataBlockJsFieldToken(value: any) {
  return String(value || '')
    .trim()
    .replace(/[-_]/g, '')
    .toLowerCase();
}

function collectVisibleDataBlockValidBusinessFieldNames(
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  fieldEntries: Array<{ field: any; path: string }>,
) {
  const names = new Set<string>();
  fieldEntries.forEach((entry) => {
    const fieldPath = getAssociationAwareFieldPathInput(entry.field);
    if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
      return;
    }
    if (!isVisibleDataBlockBusinessField(entry.field, block, context)) {
      return;
    }
    names.add(normalizeFieldPath(fieldPath));
  });
  return Array.from(names);
}

function hasUnknownVisibleDataBlockFieldPath(
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  fieldEntries: Array<{ field: any; path: string }>,
) {
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return false;
  }
  return fieldEntries.some((entry) => {
    const fieldPath = getAssociationAwareFieldPathInput(entry.field);
    if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
      return false;
    }
    return !resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  });
}

function collectVisibleDataBlockEligibleBusinessFieldNames(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return [];
  }
  return getCollectionFields(collection)
    .map((field) => {
      const name = String(getFieldName(field) || '').trim();
      if (!name || !isVisibleDataBlockMinimumCandidateResolvedField(field, name)) {
        return '';
      }
      return name;
    })
    .filter(Boolean);
}

function isVisibleDataBlockMinimumCandidateResolvedField(field: any, fieldName: string) {
  if (!isVisibleDataBlockBusinessResolvedField(field, fieldName)) {
    return false;
  }
  if (isAssociationField(field)) {
    return false;
  }
  if (/Id$/.test(fieldName)) {
    return false;
  }
  return true;
}

function isVisibleDataBlockBusinessField(field: any, block: any, context: FlowSurfaceAuthoringValidationContext) {
  const fieldPath = getAssociationAwareFieldPathInput(field);
  if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
    return false;
  }
  if (_.isPlainObject(field)) {
    if (field.hidden === true || field.internal === true || field.synthetic === true || field.actionOnly === true) {
      return false;
    }
    const semanticType = String(field.type || field.fieldType || field.interface || '').trim();
    if (semanticType && NON_BUSINESS_VISIBLE_FIELD_TYPES.has(semanticType)) {
      return false;
    }
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return true;
  }
  const resolvedField = resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  if (!resolvedField) {
    return true;
  }
  const fieldName = getFieldName(resolvedField) || fieldPath;
  return isVisibleDataBlockBusinessResolvedField(resolvedField, fieldName);
}

function pickVisibleDataBlockFieldSuggestions(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return [];
  }
  return getCollectionFields(collection)
    .map((field) => {
      const name = String(getFieldName(field) || '').trim();
      if (!name || !isVisibleDataBlockBusinessResolvedField(field, name)) {
        return '';
      }
      return name;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function isVisibleDataBlockBusinessResolvedField(field: any, fieldName: string) {
  if (NON_BUSINESS_VISIBLE_FIELD_NAMES.has(fieldName)) {
    return false;
  }
  const fieldInterface = String(getFieldInterface(field) || '').trim();
  if (NON_BUSINESS_VISIBLE_FIELD_INTERFACES.has(fieldInterface)) {
    return false;
  }
  const fieldType = String(getFieldType(field) || '').trim();
  if (NON_BUSINESS_VISIBLE_FIELD_TYPES.has(fieldType)) {
    return false;
  }
  if (field?.hidden === true || field?.options?.hidden === true) {
    return false;
  }
  return true;
}

function hasConcreteFilterItem(value: any): boolean {
  if (!_.isPlainObject(value)) {
    return false;
  }
  if (
    typeof value.path === 'string' &&
    value.path.trim() &&
    typeof value.operator === 'string' &&
    value.operator.trim()
  ) {
    return true;
  }
  if (!Array.isArray(value.items)) {
    return false;
  }
  return value.items.some((item: any) => hasConcreteFilterItem(item));
}

function collectSemanticBindingErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  const hasSettings = _.isPlainObject(block.settings);
  const settings = hasSettings ? block.settings : block;
  const settingsPath = hasSettings ? `${blockPath}.settings` : blockPath;
  if (!_.isPlainObject(settings)) {
    return;
  }
  const semanticFields: string[] =
    blockType === 'calendar'
      ? ['titleField', 'colorField', 'startField', 'endField']
      : blockType === 'kanban'
        ? ['groupField', 'dragSortBy']
        : [];
  if (!semanticFields.length) {
    return;
  }
  semanticFields.forEach((settingKey) => {
    if (!Object.prototype.hasOwnProperty.call(settings, settingKey)) {
      return;
    }
    const fieldPath = String(settings[settingKey] || '').trim();
    if (!fieldPath) {
      if (context.authoringActionName === 'applyBlueprint' && blockType === 'kanban' && settingKey === 'groupField') {
        pushAuthoringError(errors, {
          path: `${settingsPath}.${settingKey}`,
          ruleId: 'kanban-group-field-required',
          message: `flowSurfaces authoring ${settingsPath}.${settingKey} must be a non-empty field name`,
        });
      }
      return;
    }
    collectUnknownFieldPathError(fieldPath, `${settingsPath}.${settingKey}`, block, context, errors, {
      ruleId: `${blockType}-semantic-field-unknown`,
      message: `flowSurfaces authoring ${settingsPath}.${settingKey} references unknown ${blockType} semantic field '${fieldPath}'`,
    });
  });
}

function collectCommentsBlockErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (blockType !== 'comments') {
    return;
  }
  const settings = _.isPlainObject(block.settings) ? block.settings : block;
  const settingsPath = _.isPlainObject(block.settings) ? `${blockPath}.settings` : blockPath;
  if (_.isPlainObject(settings) && hasOwnDefined(settings, 'pageSize')) {
    const pageSize = Number(settings.pageSize);
    if (!COMMENTS_PAGE_SIZE_VALUES.has(pageSize)) {
      pushAuthoringError(errors, {
        path: `${settingsPath}.pageSize`,
        ruleId: 'comments-pageSize-unsupported',
        message: `flowSurfaces authoring ${settingsPath}.pageSize must be one of ${Array.from(
          COMMENTS_PAGE_SIZE_VALUES,
        ).join(', ')}`,
      });
    }
  }

  const binding = getResourceBinding(block);
  if (context.isPopupSurface) {
    if (binding && binding !== 'associatedrecords') {
      const rawBinding =
        String(block?.resource?.binding || block?.binding || '').trim() ||
        (binding === 'currentrecord' ? 'currentRecord' : binding);
      pushAuthoringError(errors, {
        path: `${blockPath}.resource.binding`,
        ruleId: 'comments-popup-binding-unsupported',
        message: `flowSurfaces authoring ${blockPath} comments blocks in popups do not support resource.binding='${rawBinding}'; use resource.binding='associatedRecords'`,
      });
      return;
    }
    if (binding === 'associatedrecords') {
      collectCommentsAssociationFieldErrors(block, blockPath, errors, context);
    }
    return;
  }

  if (binding === 'associatedrecords' || binding === 'currentrecord') {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.binding`,
      ruleId: 'comments-page-binding-unsupported',
      message: `flowSurfaces authoring ${blockPath} comments blocks outside popups require a direct comment template collection resource`,
    });
    return;
  }

  const collection = getBlockCollection(block, context);
  if (collection && !isCommentTemplateCollection(collection)) {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.collectionName`,
      ruleId: 'comments-collection-template-required',
      message: `flowSurfaces authoring ${blockPath} comments block requires a comment template collection`,
      details: {
        collection: getCollectionName(collection),
      },
    });
  }
}

function collectCommentsAssociationFieldErrors(
  block: any,
  blockPath: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  const associationFieldName = getResourceAssociationFieldName(block);
  if (!associationFieldName || !context.getCollection) {
    return;
  }
  const sourceCollectionName = String(context.currentCollectionName || context.hostCollectionName || '').trim();
  if (!sourceCollectionName) {
    return;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const sourceCollection = context.getCollection(dataSourceKey, sourceCollectionName);
  const associationField = sourceCollection
    ? resolveFieldFromCollection(sourceCollection, normalizeFieldPath(associationFieldName))
    : null;
  if (!associationField || !isAssociationField(associationField)) {
    return;
  }
  const fieldType = String(getFieldType(associationField) || '')
    .trim()
    .toLowerCase();
  const targetCollection = resolveFieldTargetCollection(
    associationField,
    dataSourceKey,
    (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
  );
  if (
    (fieldType === 'hasmany' || fieldType === 'belongstomany') &&
    targetCollection &&
    isCommentTemplateCollection(targetCollection)
  ) {
    return;
  }
  pushAuthoringError(errors, {
    path: `${blockPath}.resource.associationField`,
    ruleId: 'comments-association-field-unsupported',
    message: `flowSurfaces authoring ${blockPath} associationField '${associationFieldName}' is not available; comments popup blocks require a hasMany or belongsToMany associationField targeting a comment template collection`,
    details: {
      associationField: associationFieldName,
      fieldType,
      targetCollection: getCollectionName(targetCollection),
    },
  });
}

function collectRecordHistoryBlockErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (blockType !== 'recordHistory') {
    return;
  }
  const settings = _.isPlainObject(block.settings) ? block.settings : block;
  const settingsPath = _.isPlainObject(block.settings) ? `${blockPath}.settings` : blockPath;
  collectRecordHistorySettingsErrors(settings, settingsPath, errors);

  const binding = getResourceBinding(block);
  if (binding === 'associatedrecords') {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.binding`,
      ruleId: 'recordHistory-association-resource-unsupported',
      message: `flowSurfaces authoring ${blockPath} recordHistory blocks do not support resource.binding='associatedRecords'`,
    });
  }
  if (binding === 'currentrecord' && (!context.isPopupSurface || context.popupScene !== 'one')) {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.binding`,
      ruleId: 'recordHistory-currentRecord-popup-required',
      message: `flowSurfaces authoring ${blockPath} recordHistory resource.binding='currentRecord' is only supported in one-record popup/details scenes`,
    });
  }

  const collectionName = getBlockCollectionName(block, context);
  if (!collectionName) {
    return;
  }
  if (RECORD_HISTORY_INTERNAL_COLLECTIONS.has(collectionName)) {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.collectionName`,
      ruleId: 'recordHistory-internal-collection-unsupported',
      message: `flowSurfaces authoring ${blockPath} recordHistory does not support internal collection '${collectionName}'`,
    });
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  const filterTargetKey = getRecordHistoryDeclaredFilterTargetKey(collection);
  if (!filterTargetKey || !collectionHasConcreteField(collection, filterTargetKey)) {
    pushAuthoringError(errors, {
      path: `${blockPath}.resource.collectionName`,
      ruleId: 'recordHistory-filterTargetKey-required',
      message: `flowSurfaces authoring ${blockPath} recordHistory requires a real filterTargetKey`,
      details: {
        collection: collectionName,
        filterTargetKey,
      },
    });
  }
}

function collectRecordHistorySettingsErrors(settings: any, settingsPath: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(settings)) {
    return;
  }
  if (hasOwnDefined(settings, 'sortOrder')) {
    const order = String(settings.sortOrder?.order || '').trim();
    if (!_.isPlainObject(settings.sortOrder) || (order !== 'asc' && order !== 'desc')) {
      pushAuthoringError(errors, {
        path: `${settingsPath}.sortOrder.order`,
        ruleId: 'recordHistory-sortOrder-unsupported',
        message: `flowSurfaces authoring ${settingsPath}.sortOrder.order must be 'asc' or 'desc'`,
      });
    }
  }
  if (hasOwnDefined(settings, 'expand')) {
    if (!_.isPlainObject(settings.expand) || typeof settings.expand.expand !== 'boolean') {
      pushAuthoringError(errors, {
        path: `${settingsPath}.expand.expand`,
        ruleId: 'recordHistory-expand-invalid',
        message: `flowSurfaces authoring ${settingsPath}.expand.expand must be a boolean`,
      });
    }
  }
  if (hasOwnDefined(settings, 'template')) {
    if (!_.isPlainObject(settings.template) || settings.template.apply !== 'current') {
      pushAuthoringError(errors, {
        path: `${settingsPath}.template.apply`,
        ruleId: 'recordHistory-template-unsupported',
        message: `flowSurfaces authoring ${settingsPath}.template only supports apply='current'`,
      });
    }
  }
}

function collectChartDisplayTitleErrors(
  block: any,
  blockType: string | undefined,
  blockPath: string,
  errors: AuthoringErrorInput[],
) {
  if (blockType !== 'chart' || !_.isPlainObject(block?.settings || block)) {
    return;
  }
  const settingsPath = _.isPlainObject(block?.settings) ? `${blockPath}.settings` : blockPath;
  const settings = _.isPlainObject(block?.settings) ? block.settings : block;
  if (!Object.prototype.hasOwnProperty.call(settings, 'displayTitle')) {
    return;
  }
  pushAuthoringError(errors, {
    path: `${settingsPath}.displayTitle`,
    ruleId: 'chart-display-title-unsupported',
    message:
      'Chart block settings do not support displayTitle in the current flowSurfaces runtime; keep settings.title and omit displayTitle.',
  });
}

function collectChartConfigureFilterOperatorErrors(
  changes: any,
  hostBlockType: string | undefined,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (hostBlockType !== 'chart' || !_.isPlainObject(changes)) {
    return;
  }
  collectChartQueryFilterOperatorErrors(changes.query, `${path}.query`, errors, context);
  if (_.isPlainObject(changes.configure)) {
    collectChartQueryFilterOperatorErrors(changes.configure.query, `${path}.configure.query`, errors, context);
  }
}

function visitFilterItems(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitFilterItems(item, `${path}[${index}]`, errors, block, context));
    return;
  }
  if (!_.isPlainObject(value)) {
    return;
  }
  const fieldRef =
    typeof value.path === 'string'
      ? { value: value.path, path: `${path}.path` }
      : typeof value.field === 'string'
        ? { value: value.field, path: `${path}.field` }
        : null;
  if (fieldRef) {
    collectDefaultFilterFieldPathError(fieldRef.value, fieldRef.path, block, context, errors);
  }
  if (typeof value.operator === 'string') {
    collectUnsupportedDefaultFilterOperatorError(value.operator, `${path}.operator`, errors);
    collectDefaultFilterDateValueError(
      value.operator,
      value.value,
      `${path}.value`,
      errors,
      fieldRef ? resolveDefaultFilterDateConditionField(fieldRef.value, block, context) : undefined,
    );
  }
  const filterItems = value.items;
  if (Array.isArray(filterItems)) {
    filterItems.forEach((item, index) => visitFilterItems(item, `${path}.items[${index}]`, errors, block, context));
  }
  Object.entries(value).forEach(([key, child]) => {
    if (key === '$and' || key === '$or') {
      if (!Array.isArray(child) || !child.length) {
        pushAuthoringError(errors, {
          path: `${path}.${key}`,
          ruleId: 'defaultFilter-logical-operator-invalid-shape',
          message: `flowSurfaces authoring ${path}.${key} must be a non-empty array`,
        });
        return;
      }
      visitFilterItems(child, `${path}.${key}`, errors, block, context);
      return;
    }
    if (
      key.startsWith('$') ||
      key === 'logic' ||
      key === 'items' ||
      key === 'path' ||
      key === 'field' ||
      key === 'operator' ||
      key === 'value'
    ) {
      return;
    }
    collectDefaultFilterFieldPathError(key, `${path}.${key}`, block, context, errors);
    if (_.isPlainObject(child)) {
      Object.entries(child).forEach(([operator, operatorValue]) => {
        collectUnsupportedDefaultFilterOperatorError(operator, `${path}.${key}.${operator}`, errors);
        collectDefaultFilterDateValueError(
          operator,
          operatorValue,
          `${path}.${key}.${operator}`,
          errors,
          resolveDefaultFilterDateConditionField(key, block, context),
        );
      });
    }
  });
}

function resolveDefaultFilterDateConditionField(
  rawFieldPath: any,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
): FlowSurfaceDateConditionFieldContext | null {
  const fieldPath = String(rawFieldPath || '').trim();
  if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
    return null;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return null;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const resolved = resolveDefaultFilterFieldPath(collection, normalizeFieldPath(fieldPath), dataSourceKey, context);
  return {
    fieldPath,
    field: resolved.field,
  };
}

function collectTreeConnectFieldsErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
): Array<{
  targetBlockUid: string;
  filterPaths?: string[];
  path: string;
}> {
  if (_.isUndefined(value)) {
    return [];
  }
  if (!_.isPlainObject(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'tree-connectFields-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return [];
  }
  if (!Array.isArray(value.targets)) {
    pushAuthoringError(errors, {
      path: `${path}.targets`,
      ruleId: 'tree-connectFields-targets-invalid-shape',
      message: `flowSurfaces authoring ${path}.targets must be an array`,
    });
    return [];
  }
  const normalizedTargets: Array<{
    targetBlockUid: string;
    filterPaths?: string[];
    path: string;
  }> = [];
  const seenTargetBlockUids = new Set<string>();
  value.targets.forEach((target: any, index: number) => {
    const targetPath = `${path}.targets[${index}]`;
    if (!_.isPlainObject(target)) {
      pushAuthoringError(errors, {
        path: targetPath,
        ruleId: 'tree-connectFields-target-invalid-shape',
        message: `flowSurfaces authoring ${targetPath} must be an object`,
      });
      return;
    }
    const targetBlockUid = String(target.targetId || target.targetBlockUid || target.target || '').trim();
    let targetInvalid = false;
    if (!targetBlockUid) {
      pushAuthoringError(errors, {
        path: targetPath,
        ruleId: 'tree-connectFields-target-required',
        message: `flowSurfaces authoring ${targetPath} requires targetId`,
      });
      targetInvalid = true;
    } else if (seenTargetBlockUids.has(targetBlockUid)) {
      pushAuthoringError(errors, {
        path: targetPath,
        ruleId: 'tree-connectFields-target-duplicate',
        message: `flowSurfaces authoring ${targetPath} duplicate targetId '${targetBlockUid}'`,
        details: {
          targetBlockUid,
        },
      });
      targetInvalid = true;
    } else {
      seenTargetBlockUids.add(targetBlockUid);
    }
    let filterPaths: string[] | undefined;
    let filterPathsInvalid = false;
    if (Object.prototype.hasOwnProperty.call(target, 'filterPaths')) {
      if (!Array.isArray(target.filterPaths) || !target.filterPaths.length) {
        pushAuthoringError(errors, {
          path: `${targetPath}.filterPaths`,
          ruleId: 'tree-connectFields-filterPaths-invalid-shape',
          message: `flowSurfaces authoring ${targetPath}.filterPaths must be a non-empty string array`,
        });
        filterPathsInvalid = true;
      } else {
        filterPaths = [];
        target.filterPaths.forEach((filterPath: any, pathIndex: number) => {
          if (typeof filterPath !== 'string' || !filterPath.trim()) {
            pushAuthoringError(errors, {
              path: `${targetPath}.filterPaths[${pathIndex}]`,
              ruleId: 'tree-connectFields-filterPath-invalid-shape',
              message: `flowSurfaces authoring ${targetPath}.filterPaths[${pathIndex}] must be a non-empty string`,
            });
            filterPathsInvalid = true;
            return;
          }
          filterPaths?.push(normalizeFieldPath(filterPath));
        });
      }
    }
    if (targetInvalid || filterPathsInvalid) {
      return;
    }
    normalizedTargets.push({
      targetBlockUid,
      path: targetPath,
      ...(filterPaths ? { filterPaths } : {}),
    });
  });
  return normalizedTargets;
}

async function collectTreeConnectFieldsLiveErrors(
  targets: Array<{
    targetBlockUid: string;
    filterPaths?: string[];
    path: string;
  }>,
  changes: any,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!targets.length) {
    return;
  }
  const treeNode = context.currentNode;
  if (
    treeNode?.use !== 'TreeBlockModel' ||
    !treeNode?.uid ||
    !context.findModelById ||
    !context.findOwningBlockGrid ||
    !context.getCollection
  ) {
    return;
  }

  const blockGrid = await context.findOwningBlockGrid(treeNode.uid, context.transaction);
  if (!blockGrid?.uid) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'tree-connectFields-source-grid-missing',
      message: `flowSurfaces authoring ${path} tree block '${treeNode.uid}' is not under a block grid`,
      details: {
        treeBlockUid: treeNode.uid,
      },
    });
    return;
  }

  const treeResourceInit = getTreeConnectDataBlockResourceInit(treeNode, changes?.resource);
  const treeDataSourceKey = normalizeDataSourceKey(treeResourceInit?.dataSourceKey);
  const treeCollectionName = String(treeResourceInit?.collectionName || '').trim();
  if (!treeCollectionName) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'tree-connectFields-source-collection-required',
      message: `flowSurfaces authoring ${path} tree block '${treeNode.uid}' requires resource.collectionName`,
      details: {
        treeBlockUid: treeNode.uid,
      },
    });
    return;
  }
  const treeCollection = context.getCollection(treeDataSourceKey, treeCollectionName);
  if (!treeCollection) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'tree-connectFields-source-collection-missing',
      message: `flowSurfaces authoring ${path} source collection '${treeDataSourceKey}.${treeCollectionName}' not found`,
      details: {
        dataSourceKey: treeDataSourceKey,
        collectionName: treeCollectionName,
      },
    });
    return;
  }

  const treeKeyFieldPath = getTreeConnectSelectedKeyFieldPath(treeNode, treeCollection, changes);
  const treeKeyField = resolveTreeConnectComparableField(treeCollection, treeKeyFieldPath);
  const treeKeyKind = normalizeTreeConnectValueKind(treeKeyField);

  for (const target of targets) {
    if (target.targetBlockUid === treeNode.uid) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-self',
        message: `flowSurfaces authoring ${target.path} targetId cannot be the tree block itself`,
        details: {
          targetBlockUid: target.targetBlockUid,
        },
      });
      continue;
    }

    const targetNode = await context.findModelById(target.targetBlockUid, {
      transaction: context.transaction,
      includeAsyncNode: true,
    });
    if (!targetNode?.uid) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-not-found',
        message: `flowSurfaces authoring ${target.path} targetId '${target.targetBlockUid}' not found`,
        details: {
          targetBlockUid: target.targetBlockUid,
        },
      });
      continue;
    }

    if (!TREE_CONNECT_TARGET_BLOCK_USES.has(targetNode.use || '')) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-unsupported',
        message: `flowSurfaces authoring ${target.path} target '${target.targetBlockUid}' does not support tree connectFields`,
        details: {
          targetBlockUid: target.targetBlockUid,
          targetUse: targetNode.use,
        },
      });
      continue;
    }

    const targetGrid = await context.findOwningBlockGrid(targetNode.uid, context.transaction);
    if (targetGrid?.uid !== blockGrid.uid) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-grid-mismatch',
        message: `flowSurfaces authoring ${target.path} target '${target.targetBlockUid}' must be in the same block grid`,
        details: {
          targetBlockUid: target.targetBlockUid,
          sourceGridUid: blockGrid.uid,
          targetGridUid: targetGrid?.uid,
        },
      });
      continue;
    }

    const targetResourceInit = getTreeConnectDataBlockResourceInit(targetNode);
    const targetDataSourceKey = normalizeDataSourceKey(targetResourceInit?.dataSourceKey);
    const targetCollectionName = String(targetResourceInit?.collectionName || '').trim();
    if (!targetCollectionName) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-collection-required',
        message: `flowSurfaces authoring ${target.path} target '${target.targetBlockUid}' requires resource.collectionName`,
        details: {
          targetBlockUid: target.targetBlockUid,
        },
      });
      continue;
    }
    const targetCollection = context.getCollection(targetDataSourceKey, targetCollectionName);
    if (!targetCollection) {
      pushAuthoringError(errors, {
        path: target.path,
        ruleId: 'tree-connectFields-target-collection-missing',
        message: `flowSurfaces authoring ${target.path} target collection '${targetDataSourceKey}.${targetCollectionName}' not found`,
        details: {
          targetBlockUid: target.targetBlockUid,
          dataSourceKey: targetDataSourceKey,
          collectionName: targetCollectionName,
        },
      });
      continue;
    }

    collectTreeConnectFilterPathLiveErrors({
      target,
      targetCollection,
      targetDataSourceKey,
      targetCollectionName,
      treeDataSourceKey,
      treeCollectionName,
      treeKeyFieldPath,
      treeKeyKind,
      errors,
    });
  }
}

function collectTreeConnectFilterPathLiveErrors(input: {
  target: {
    targetBlockUid: string;
    filterPaths?: string[];
    path: string;
  };
  targetCollection: any;
  targetDataSourceKey: string;
  targetCollectionName: string;
  treeDataSourceKey: string;
  treeCollectionName: string;
  treeKeyFieldPath: string;
  treeKeyKind?: 'number' | 'string' | 'date' | 'boolean';
  errors: AuthoringErrorInput[];
}) {
  const isSameCollection =
    input.treeDataSourceKey === input.targetDataSourceKey && input.treeCollectionName === input.targetCollectionName;
  const normalizedPaths =
    input.target.filterPaths && input.target.filterPaths.length
      ? input.target.filterPaths
      : isSameCollection
        ? [getCollectionFilterTargetKey(input.targetCollection)]
        : undefined;
  if (!normalizedPaths?.length) {
    pushAuthoringError(input.errors, {
      path: `${input.target.path}.filterPaths`,
      ruleId: 'tree-connectFields-filterPaths-required',
      message: `flowSurfaces authoring ${input.target.path} requires filterPaths when target collection differs from tree collection`,
      details: {
        targetBlockUid: input.target.targetBlockUid,
        treeCollection: `${input.treeDataSourceKey}.${input.treeCollectionName}`,
        targetCollection: `${input.targetDataSourceKey}.${input.targetCollectionName}`,
      },
    });
    return;
  }

  const filterTargetKey = getCollectionFilterTargetKey(input.targetCollection);
  normalizedPaths.forEach((fieldPath, index) => {
    const normalizedFieldPath = normalizeFieldPath(fieldPath);
    const isBuiltInTargetPath = normalizedFieldPath === 'id' || normalizedFieldPath === filterTargetKey;
    const targetField = resolveTreeConnectComparableField(input.targetCollection, normalizedFieldPath);
    const fieldPathErrorPath = input.target.filterPaths?.length
      ? `${input.target.path}.filterPaths[${index}]`
      : `${input.target.path}.filterPaths`;
    if (!isBuiltInTargetPath && !targetField) {
      pushAuthoringError(input.errors, {
        path: fieldPathErrorPath,
        ruleId: 'tree-connectFields-filterPath-unknown',
        message: `flowSurfaces authoring ${fieldPathErrorPath} references unknown target field '${normalizedFieldPath}'`,
        details: {
          fieldPath: normalizedFieldPath,
          targetCollection: `${input.targetDataSourceKey}.${input.targetCollectionName}`,
          availableFields: getCollectionFields(input.targetCollection)
            .map((field) => String(getFieldName(field) || '').trim())
            .filter(Boolean),
        },
      });
      return;
    }
    const targetKind = normalizeTreeConnectValueKind(targetField);
    if (input.treeKeyKind && targetKind && input.treeKeyKind !== targetKind) {
      pushAuthoringError(input.errors, {
        path: fieldPathErrorPath,
        ruleId: 'tree-connectFields-filterPath-type-mismatch',
        message: `flowSurfaces authoring ${fieldPathErrorPath} is not type-compatible with tree selected key '${input.treeKeyFieldPath}'`,
        details: {
          fieldPath: normalizedFieldPath,
          treeKeyFieldPath: input.treeKeyFieldPath,
          treeKeyKind: input.treeKeyKind,
          targetKind,
        },
      });
    }
  });
}

function getTreeConnectDataBlockResourceInit(node: any, resourcePatch?: any) {
  if (_.isPlainObject(resourcePatch)) {
    return {
      ...resourcePatch,
      dataSourceKey: normalizeDataSourceKey(resourcePatch.dataSourceKey),
    };
  }
  if (node?.use === 'ChartBlockModel') {
    return getChartBuilderResourceInit(_.get(node, ['stepParams', 'chartSettings', 'configure']));
  }
  const init = _.cloneDeep(_.get(node, ['stepParams', 'resourceSettings', 'init']) || {});
  if (init.collectionName && !init.dataSourceKey) {
    init.dataSourceKey = 'main';
  }
  return init;
}

function getTreeConnectSelectedKeyFieldPath(treeNode: any, treeCollection: any, changes: any) {
  const configuredKey = String(
    _.get(changes, ['fieldNames', 'key']) || _.get(treeNode, ['props', 'fieldNames', 'key']) || '',
  ).trim();
  return configuredKey ? normalizeFieldPath(configuredKey) : getCollectionFilterTargetKey(treeCollection);
}

function resolveTreeConnectComparableField(collection: any, fieldPath: string) {
  const normalizedFieldPath = normalizeFieldPath(fieldPath);
  const resolvedField = resolveFieldFromCollection(collection, normalizedFieldPath);
  if (resolvedField) {
    return resolvedField;
  }
  if (normalizedFieldPath === 'id') {
    return {
      name: 'id',
      type: 'bigInt',
      interface: 'integer',
    };
  }
  return null;
}

function normalizeTreeConnectValueKind(field: any): 'number' | 'string' | 'date' | 'boolean' | undefined {
  const fieldType = String(getFieldType(field) || '')
    .trim()
    .toLowerCase();
  const fieldInterface = String(getFieldInterface(field) || '')
    .trim()
    .toLowerCase();
  if (
    ['bigint', 'integer', 'int', 'number', 'float', 'double', 'decimal', 'real'].includes(fieldType) ||
    ['bigint', 'integer', 'number', 'percent'].includes(fieldInterface)
  ) {
    return 'number';
  }
  if (
    ['string', 'text', 'uid', 'uuid', 'varchar', 'char'].includes(fieldType) ||
    ['input', 'textarea', 'select', 'radiogroup', 'url', 'email', 'phone'].includes(fieldInterface)
  ) {
    return 'string';
  }
  if (['date', 'datetime', 'time'].includes(fieldType) || ['date', 'datetime', 'time'].includes(fieldInterface)) {
    return 'date';
  }
  if (fieldType === 'boolean' || fieldInterface === 'boolean') {
    return 'boolean';
  }
  return undefined;
}

function getCollectionFilterTargetKey(collection: any) {
  return (
    (Array.isArray(collection?.filterTargetKey) ? collection?.filterTargetKey?.[0] : collection?.filterTargetKey) ||
    (Array.isArray(collection?.options?.filterTargetKey)
      ? collection?.options?.filterTargetKey?.[0]
      : collection?.options?.filterTargetKey) ||
    'id'
  );
}

function normalizeDataSourceKey(value: any) {
  return String(value || 'main').trim() || 'main';
}

function collectTableSettingsErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
  options: { directSettings?: boolean; deferPublicDataScopeErrors?: boolean } = {},
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (blockType !== 'table' || !_.isPlainObject(block)) {
    return;
  }
  TABLE_INTERNAL_AUTHORING_KEYS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(block, key)) {
      pushTableSettingsUnsupportedError(errors, `${blockPath}.${key}`, key);
    }
  });
  const hasSettings = _.isPlainObject(block?.settings);
  if (!hasSettings) {
    if (options.directSettings === true && !shouldDeferPublicDataScopeErrorsToBatchItem(blockPath, errors, options)) {
      collectPublicDataScopeErrors(block.dataScope, `${blockPath}.dataScope`, errors, block, context);
    }
    return;
  }
  const settings = block.settings;
  const settingsPath = `${blockPath}.settings`;

  Object.keys(settings).forEach((key) => {
    if (TABLE_ALLOWED_SETTINGS_KEYS.has(key) && options.directSettings !== true) {
      return;
    }
    if (options.directSettings === true && !TABLE_INTERNAL_AUTHORING_KEYS.includes(key)) {
      return;
    }
    pushTableSettingsUnsupportedError(errors, `${settingsPath}.${key}`, key);
  });
  if (!shouldDeferPublicDataScopeErrorsToBatchItem(blockPath, errors, options)) {
    collectPublicDataScopeErrors(settings.dataScope, `${settingsPath}.dataScope`, errors, block, context);
  }
}

function pushTableSettingsUnsupportedError(errors: AuthoringErrorInput[], path: string, key: string) {
  pushAuthoringError(errors, {
    path,
    ruleId: 'table-settings-unsupported-key',
    message: `flowSurfaces authoring ${path} is not part of the public table settings contract`,
    details: {
      key,
      allowedKeys: Array.from(TABLE_ALLOWED_SETTINGS_KEYS),
      repairHint: TABLE_SETTINGS_REPAIR_HINT,
    },
  });
}

function collectPublicDataScopeErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (_.isUndefined(value)) {
    return;
  }
  if (value === null || (_.isPlainObject(value) && !Object.keys(value).length)) {
    return;
  }
  const validationValue = normalizePublicDataScopeValueForValidation(value);
  try {
    assertFlowSurfaceFilterGroupShape(validationValue);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    pushAuthoringError(errors, {
      path,
      ruleId: 'dataScope-filter-group-invalid-shape',
      message: `flowSurfaces authoring ${path} expects FilterGroup like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}: ${reason}`,
      details: {
        repairHint:
          'Use settings.dataScope with logic/items, for example {"logic":"$and","items":[{"path":"status","operator":"$eq","value":"Active"}]}; do not use a field-name map.',
      },
    });
    return;
  }
  collectPublicDataScopeFieldPathErrors(validationValue, path, errors, block, context);
  collectFilterGroupDateConditionErrors(validationValue, path, errors, block, context);
}

function collectPublicDataScopeFieldPathErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  if (hasOwn(value, 'operator')) {
    collectPublicDataScopeFieldPathError(value.path, `${path}.path`, block, context, errors);
  }
  if (Array.isArray(value.items)) {
    value.items.forEach((item, index) =>
      collectPublicDataScopeFieldPathErrors(item, `${path}.items[${index}]`, errors, block, context),
    );
  }
}

function collectPublicDataScopeFieldPathError(
  rawFieldPath: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const fieldPath = String(rawFieldPath || '').trim();
  if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  const resolved = resolveDefaultFilterFieldPath(
    collection,
    normalizeFieldPath(fieldPath),
    getBlockDataSourceKey(block, context),
    context,
  );
  if (!resolved.field) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'field-path-unknown',
      message: `flowSurfaces authoring ${path} references unknown field '${fieldPath}'`,
      details: {
        fieldPath,
        collection: getCollectionName(resolved.collection || collection),
        availableFields: getCollectionFields(resolved.collection || collection)
          .map((field) => String(getFieldName(field) || '').trim())
          .filter(Boolean),
      },
    });
    return;
  }
  if (isAssociationField(resolved.field)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-relation-field-unsupported',
      message: `flowSurfaces authoring ${path} cannot use relation field '${fieldPath}' itself; use a scalar subfield instead`,
      details: {
        fieldPath,
        fieldName: getFieldName(resolved.field),
      },
    });
  }
}

function shouldDeferPublicDataScopeErrorsToBatchItem(
  blockPath: string,
  errors: AuthoringErrorInput[],
  options: { deferPublicDataScopeErrors?: boolean },
) {
  if (options.deferPublicDataScopeErrors !== true) {
    return false;
  }
  if (!/^\$\.blocks\[\d+\]$/.test(blockPath)) {
    return false;
  }
  return !errors.some((error) => error.path === `${blockPath}.settings.dataScope`);
}

function normalizePublicDataScopeValueForValidation(value: any) {
  if (!_.isPlainObject(value)) {
    return value;
  }
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === 'filter') {
    return value.filter;
  }
  return value;
}

function collectFilterGroupDateConditionErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(value)) {
    return;
  }
  if (Array.isArray(value.items)) {
    value.items.forEach((item, index) =>
      collectFilterGroupDateConditionErrors(item, `${path}.items[${index}]`, errors, block, context),
    );
    return;
  }
  if (!hasOwn(value, 'operator')) {
    return;
  }
  const fieldPath = String(value.path || value.field || '').trim();
  const fieldContext = fieldPath ? resolveDefaultFilterDateConditionField(fieldPath, block, context) : undefined;
  collectPublicDataScopeDateOperatorError(value.operator, value.value, `${path}.operator`, errors, fieldContext);
  collectDefaultFilterDateValueError(value.operator, value.value, `${path}.value`, errors, fieldContext);
}

function collectGridCardSettingsErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
  options: { directSettings?: boolean } = {},
) {
  const hasSettings = _.isPlainObject(block?.settings);
  if (!hasSettings && options.directSettings !== true) {
    return;
  }
  const settings = hasSettings ? block.settings : block;
  const settingsPath = hasSettings ? `${blockPath}.settings` : blockPath;
  if (blockType !== 'gridCard' || !_.isPlainObject(settings)) {
    return;
  }

  Object.keys(settings).forEach((key) => {
    if (GRID_CARD_ALLOWED_SETTINGS_KEYS.has(key)) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${settingsPath}.${key}`,
      ruleId: 'grid-card-settings-unsupported',
      message: `flowSurfaces authoring ${settingsPath}.${key} is not supported by gridCard settings`,
      details: {
        key,
        allowedKeys: Array.from(GRID_CARD_ALLOWED_SETTINGS_KEYS),
      },
    });
  });

  if (Object.prototype.hasOwnProperty.call(settings, 'columns')) {
    collectGridCardColumnsErrors(settings.columns, `${settingsPath}.columns`, errors);
  }

  if (
    Object.prototype.hasOwnProperty.call(settings, 'rowCount') &&
    (!_.isNumber(settings.rowCount) || settings.rowCount <= 0)
  ) {
    pushAuthoringError(errors, {
      path: `${settingsPath}.rowCount`,
      ruleId: 'gridCard-rowCount-invalid',
      message: `flowSurfaces authoring ${settingsPath}.rowCount must be a positive number`,
    });
  }
}

function collectGridCardColumnsErrors(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isNumber(value)) {
    if (value > 0) {
      return;
    }
    pushAuthoringError(errors, {
      path,
      ruleId: 'gridCard-columns-invalid',
      message: `flowSurfaces authoring ${path} must be a positive number or responsive object`,
    });
    return;
  }

  if (!_.isPlainObject(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'gridCard-columns-invalid',
      message: `flowSurfaces authoring ${path} must be a positive number or responsive object`,
    });
    return;
  }

  const requiredBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  const missingBreakpoints = requiredBreakpoints.filter((key) => _.isUndefined(value[key]));
  if (missingBreakpoints.length) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'gridCard-columns-missing-breakpoints',
      message: `flowSurfaces authoring ${path} responsive object must include xs, sm, md, lg, xl, xxl`,
      details: {
        missingBreakpoints,
      },
    });
  }

  const invalidBreakpoints = requiredBreakpoints.filter(
    (key) => !_.isUndefined(value[key]) && (!_.isNumber(value[key]) || value[key] <= 0),
  );
  if (invalidBreakpoints.length) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'gridCard-columns-invalid-breakpoints',
      message: `flowSurfaces authoring ${path} responsive object values must be positive numbers`,
      details: {
        invalidBreakpoints,
      },
    });
  }
}

function collectActionListErrors(
  actions: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
  slot = 'actions',
) {
  if (!Array.isArray(actions)) {
    return;
  }
  collectDuplicateAIEmployeeActionErrors(actions, path, errors, block);
  actions.forEach((action, index) => collectActionErrors(action, `${path}[${index}]`, errors, block, context, slot));
}

function collectDuplicateAIEmployeeActionErrors(
  actions: any[],
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
) {
  const seen = new Map<string, string>();
  actions.forEach((action, index) => {
    const actionType = resolveAuthoringActionType(action, block);
    if (actionType !== 'aiEmployee' || !_.isPlainObject(action)) {
      return;
    }
    const identity = buildAuthoringAIEmployeeActionIdentity(action.settings);
    if (!identity) {
      return;
    }
    const currentPath = `${path}[${index}]`;
    const previousPath = seen.get(identity);
    if (previousPath) {
      pushAuthoringError(errors, {
        path: currentPath,
        ruleId: 'duplicate-ai-employee-action',
        message: `flowSurfaces authoring ${currentPath} duplicates an existing AI employee action in the same action container; reuse or update the existing button instead of appending another identical AI employee action.`,
        details: {
          duplicateOf: previousPath,
          repairHint:
            'Remove the duplicate aiEmployee action, or change username, task title/key, or workContext if this is a genuinely different AI employee action.',
        },
      });
      return;
    }
    seen.set(identity, currentPath);
  });
}

function buildAuthoringAIEmployeeActionIdentity(settings: any) {
  if (!_.isPlainObject(settings)) {
    return '';
  }
  const username = String(settings.username || '').trim();
  if (!username) {
    return '';
  }
  return stableSerializeAuthoringValue(normalizeAuthoringAIEmployeePublicSettingsForIdentity(settings));
}

function normalizeAuthoringAIEmployeePublicSettingsForIdentity(settings: Record<string, any>) {
  const workContext = Object.prototype.hasOwnProperty.call(settings, 'workContext')
    ? normalizeAuthoringAIEmployeeWorkContextForIdentity(settings.workContext)
    : [{ type: 'flow-model', target: 'self' }];
  return {
    username: String(settings.username || '').trim(),
    auto: typeof settings.auto === 'boolean' ? settings.auto : false,
    workContext,
    tasks: normalizeAuthoringAIEmployeeTasksForIdentity(settings.tasks, workContext),
    style: {
      ...AUTHORING_AI_EMPLOYEE_DEFAULT_STYLE,
      ...(_.isPlainObject(settings.style) ? _.pick(settings.style, AUTHORING_AI_EMPLOYEE_STYLE_PUBLIC_KEYS) : {}),
    },
  };
}

function normalizeAuthoringAIEmployeeWorkContextForIdentity(value: any) {
  return _.castArray(value || []).map((item: any) => {
    if (!_.isPlainObject(item)) {
      return item;
    }
    const output = _.pick(item, AUTHORING_AI_EMPLOYEE_WORK_CONTEXT_PUBLIC_KEYS);
    if (!Object.prototype.hasOwnProperty.call(output, 'type') || _.isUndefined(output.type) || output.type === null) {
      output.type = 'flow-model';
    }
    return output;
  });
}

function normalizeAuthoringAIEmployeeTaskWorkContextForIdentity(value: any, defaultWorkContext?: any[]) {
  const normalized = normalizeAuthoringAIEmployeeWorkContextForIdentity(value);
  if (Array.isArray(defaultWorkContext) && !normalized.length) {
    return _.cloneDeep(defaultWorkContext);
  }
  return normalized;
}

function normalizeAuthoringAIEmployeeTasksForIdentity(value: any, defaultWorkContext?: any[]) {
  return _.castArray(value || []).map((task: any) => {
    if (!_.isPlainObject(task)) {
      return task;
    }
    const output = _.pick(task, AUTHORING_AI_EMPLOYEE_TASK_PUBLIC_SETTING_KEYS);
    if (_.isPlainObject(output.message)) {
      output.message = _.pick(output.message, AUTHORING_AI_EMPLOYEE_TASK_MESSAGE_PUBLIC_KEYS);
      if (Object.prototype.hasOwnProperty.call(output.message, 'workContext')) {
        output.message.workContext = normalizeAuthoringAIEmployeeTaskWorkContextForIdentity(
          output.message.workContext,
          defaultWorkContext,
        );
      }
    }
    if (
      Object.prototype.hasOwnProperty.call(task, 'prompt') &&
      !Object.prototype.hasOwnProperty.call(output.message || {}, 'user')
    ) {
      output.message = {
        ...(_.isPlainObject(output.message) ? output.message : {}),
        user: task.prompt,
      };
    }
    if (!_.isPlainObject(output.message) && Array.isArray(defaultWorkContext)) {
      output.message = {
        workContext: _.cloneDeep(defaultWorkContext),
      };
    } else if (
      _.isPlainObject(output.message) &&
      !Object.prototype.hasOwnProperty.call(output.message, 'workContext')
    ) {
      output.message.workContext = _.cloneDeep(defaultWorkContext || []);
    }
    if (_.isPlainObject(output.model)) {
      output.model = _.pick(output.model, AUTHORING_AI_EMPLOYEE_TASK_MODEL_PUBLIC_KEYS);
    }
    if (_.isPlainObject(output.skillSettings)) {
      output.skillSettings = _.pick(output.skillSettings, AUTHORING_AI_EMPLOYEE_SKILL_SETTINGS_PUBLIC_KEYS);
      if (
        Array.isArray(output.skillSettings.skills) &&
        !Object.prototype.hasOwnProperty.call(output.skillSettings, 'skillsVersion')
      ) {
        output.skillSettings.skillsVersion = 2;
      }
      if (
        Array.isArray(output.skillSettings.tools) &&
        !Object.prototype.hasOwnProperty.call(output.skillSettings, 'toolsVersion')
      ) {
        output.skillSettings.toolsVersion = 2;
      }
    }
    return output;
  });
}

function stableSerializeAuthoringValue(value: any): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerializeAuthoringValue(item)).join(',')}]`;
  }
  if (_.isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerializeAuthoringValue(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function resolveAuthoringActionType(action: any, block?: any) {
  const rawType = typeof action === 'string' ? action : _.isPlainObject(action) ? action.type : '';
  const normalized = String(rawType || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return '';
  }
  const blockType = String(block?.type || '').trim();
  if (blockType === 'calendar') {
    return CALENDAR_ACTION_TYPE_ALIASES.get(normalized) || '';
  }
  if (blockType === 'kanban') {
    return KANBAN_ACTION_TYPE_ALIASES.get(normalized) || '';
  }
  return ACTION_TYPE_ALIASES.get(normalized) || String(rawType || '').trim();
}

function collectActionSlotErrors(
  actionType: string,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  slot = 'actions',
) {
  const blockType = String(block?.type || '').trim();
  if (slot === 'actions' && actionType === 'addChild') {
    pushAuthoringError(errors, {
      path,
      ruleId: 'add-child-must-use-record-actions',
      message:
        '`addChild` must stay under `recordActions`; whole-page blueprint drafts may still author it there, but final apply only works when the live target `catalog.recordActions` exposes it for a tree collection table with `treeTable` enabled.`',
    });
  }
  if (slot === 'recordActions' && actionType === 'bulkUpdate') {
    pushAuthoringError(errors, {
      path,
      ruleId: 'bulk-update-must-use-actions',
      message: '`bulkUpdate` is a collection action and must be authored under block actions.',
    });
  }
  if (slot === 'actions' && actionType === 'updateRecord') {
    pushAuthoringError(errors, {
      path,
      ruleId: 'update-record-must-use-record-actions',
      message: '`updateRecord` is a record action and must be authored under recordActions.',
    });
  }
  if (slot === 'actions' && blockType === 'calendar' && !CALENDAR_ALLOWED_ACTION_TYPES.has(actionType)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'calendar-action-unsupported',
      message: `calendar blocks only support actions: ${Array.from(CALENDAR_ALLOWED_ACTION_TYPES).join(', ')}.`,
    });
  }
  if (slot === 'actions' && blockType === 'kanban' && !KANBAN_ALLOWED_ACTION_TYPES.has(actionType)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'kanban-action-unsupported',
      message: `kanban blocks only support actions: ${Array.from(KANBAN_ALLOWED_ACTION_TYPES).join(', ')}.`,
    });
  }
}

function collectActionErrors(
  action: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
  slot = 'actions',
) {
  const actionType = resolveAuthoringActionType(action, block);
  collectActionSlotErrors(actionType, path, errors, block, slot);
  if (!_.isPlainObject(action)) {
    return;
  }
  collectApplyBlueprintScriptAssetReferenceErrors(action, path, errors, context);
  collectAssignValuesErrors(action.settings?.assignValues, `${path}.settings.assignValues`, errors, block, context);
  collectTriggerWorkflowsErrors(action.settings?.triggerWorkflows, `${path}.settings.triggerWorkflows`, errors);
  collectLinkageRulesErrors(action.settings?.linkageRules, `${path}.settings.linkageRules`, errors);
  if (hasOwn(action, 'assignValues')) {
    pushAuthoringError(errors, {
      path: `${path}.assignValues`,
      ruleId: 'assignValues-top-level-unsupported',
      message: `flowSurfaces authoring ${path}.assignValues is not supported; use ${path}.settings.assignValues`,
    });
  }
  if (hasOwn(action, 'triggerWorkflows')) {
    pushAuthoringError(errors, {
      path: `${path}.triggerWorkflows`,
      ruleId: 'triggerWorkflows-top-level-unsupported',
      message: `flowSurfaces authoring ${path}.triggerWorkflows is not supported; use ${path}.settings.triggerWorkflows`,
    });
  }
  collectDefaultFilterErrors(action.defaultFilter, `${path}.defaultFilter`, errors, block, context);
  collectActionSettingsFilterErrors(action, path, errors, block, context);
  const localKeys = new Set<string>();
  collectLocalKeys(action.popup, localKeys);
  collectLocalKeys(action.openView, localKeys);
  collectPopupErrors(action.popup, `${path}.popup`, errors, localKeys, context);
  collectPopupErrors(action.openView, `${path}.openView`, errors, localKeys, context);
  collectCustomEditPopupErrors(actionType, action.popup, `${path}.popup`, errors);
  collectCustomEditPopupErrors(actionType, action.openView, `${path}.openView`, errors);
  if (actionType === 'jsItem') {
    if (!isJsItemActionSlotSupported(String(block?.type || '').trim(), slot)) {
      pushAuthoringError(errors, {
        path,
        ruleId: 'js-item-action-slot-unsupported',
        message:
          'flowSurfaces authoring jsItem actions are only supported in block actions for table/list/gridCard/calendar/kanban, in recordActions for record-capable hosts, or in form actions for createForm/editForm',
        details: {
          blockType: String(block?.type || '').trim(),
          slot,
        },
      });
    }
    const hasRunnableSource =
      (typeof action.source === 'string' && action.source.trim()) ||
      (typeof action.code === 'string' && action.code.trim()) ||
      hasApplyBlueprintRunnableScriptAssetReference(action.script, context) ||
      (typeof action.settings?.source === 'string' && action.settings.source.trim()) ||
      (typeof action.settings?.code === 'string' && action.settings.code.trim());
    if (!hasRunnableSource) {
      pushAuthoringError(errors, {
        path,
        ruleId: 'jsItem-source-required',
        message: `flowSurfaces authoring ${path} jsItem requires runnable source`,
      });
    }
  }
}

function collectCustomEditPopupErrors(actionType: string, popup: any, path: string, errors: AuthoringErrorInput[]) {
  if (
    !EDIT_ACTION_TYPES.has(actionType) ||
    !_.isPlainObject(popup) ||
    hasFlowSurfaceTemplateReference(popup.template) ||
    !Array.isArray(popup.blocks)
  ) {
    return;
  }
  const editFormCount = popup.blocks.filter((block) => {
    return _.isPlainObject(block) && String(block.type || '').trim() === 'editForm';
  }).length;
  if (editFormCount === 1) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'custom-edit-popup-edit-form-count',
    message: `flowSurfaces authoring ${path} custom edit popup must contain exactly one editForm block; found ${editFormCount}`,
  });
}

function collectActionSettingsFilterErrors(
  action: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  const settings = action?.settings;
  const settingsPath = `${path}.settings`;
  if (!_.isPlainObject(settings)) {
    return;
  }
  if (!isFilterAction(action)) {
    if (hasOwnDefined(settings, 'defaultFilter')) {
      pushAuthoringError(errors, {
        path: `${settingsPath}.defaultFilter`,
        ruleId: 'defaultFilter-action-settings-unsupported',
        message: `flowSurfaces authoring ${settingsPath}.defaultFilter is only supported on filter actions`,
      });
    }
    if (hasOwnDefined(settings, 'filterableFieldNames')) {
      pushAuthoringError(errors, {
        path: `${settingsPath}.filterableFieldNames`,
        ruleId: 'filterableFieldNames-action-settings-unsupported',
        message: `flowSurfaces authoring ${settingsPath}.filterableFieldNames is only supported on filter actions`,
      });
    }
    return;
  }
  collectDefaultFilterErrors(settings.defaultFilter, `${settingsPath}.defaultFilter`, errors, block, context);
  const filterableFieldNames = collectFilterableFieldNamesErrors(
    settings.filterableFieldNames,
    `${settingsPath}.filterableFieldNames`,
    errors,
    block,
    context,
  );
  const effectiveDefaultFilter = getEffectiveFilterActionDefaultFilter(block, action, path, context);
  collectDefaultFilterFilterableFieldErrors(
    effectiveDefaultFilter?.value,
    effectiveDefaultFilter?.path || `${settingsPath}.defaultFilter`,
    filterableFieldNames,
    errors,
  );
}

function getEffectiveFilterActionDefaultFilter(
  block: any,
  action: any,
  actionPath: string,
  context: FlowSurfaceAuthoringValidationContext,
) {
  const settings = action?.settings;
  const blockPath = getBlockPathFromActionPath(actionPath);
  return getEffectiveFilterSettingsDefaultFilter(block, settings, `${actionPath}.settings`, blockPath, context);
}

function getEffectiveFilterSettingsDefaultFilter(
  block: any,
  settings: any,
  settingsPath: string,
  blockPath: string,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (hasOwnDefined(settings, 'defaultFilter')) {
    return {
      value: settings.defaultFilter,
      path: `${settingsPath}.defaultFilter`,
    };
  }
  if (hasOwnDefined(block?.defaultActionSettings?.filter, 'defaultFilter')) {
    return {
      value: block.defaultActionSettings.filter.defaultFilter,
      path: `${blockPath}.defaultActionSettings.filter.defaultFilter`,
    };
  }
  if (hasOwnDefined(block, 'defaultFilter')) {
    return {
      value: block.defaultFilter,
      path: `${blockPath}.defaultFilter`,
    };
  }
  const generatedDefaultFilter = buildGeneratedDefaultFilterForBlock(block, context);
  if (!_.isUndefined(generatedDefaultFilter)) {
    return {
      value: generatedDefaultFilter,
      path: `${blockPath}.defaultFilter`,
    };
  }
  return null;
}

function buildGeneratedDefaultFilterForBlock(block: any, context: FlowSurfaceAuthoringValidationContext) {
  if (!doesBlockConsumeDefaultFilterAction(block)) {
    return undefined;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return undefined;
  }
  return buildFlowSurfaceDefaultFilterFromCollection(collection);
}

function getBlockPathFromActionPath(actionPath: string) {
  const match = actionPath.match(/^(.*)\.(?:actions|recordActions)\[\d+\]$/);
  return match?.[1] || actionPath;
}

function collectFilterableFieldNamesErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'filterableFieldNames-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an array of field paths`,
    });
    return undefined;
  }
  const normalized: string[] = [];
  value.forEach((fieldPath, index) => {
    const itemPath = `${path}[${index}]`;
    if (typeof fieldPath !== 'string' || !fieldPath.trim()) {
      pushAuthoringError(errors, {
        path: itemPath,
        ruleId: 'filterableFieldNames-item-invalid-shape',
        message: `flowSurfaces authoring ${itemPath} must be a non-empty string`,
      });
      return;
    }
    const normalizedFieldPath = fieldPath.trim();
    normalized.push(normalizedFieldPath);
    collectDefaultFilterFieldPathError(normalizedFieldPath, itemPath, block, context, errors);
  });
  return normalized;
}

function collectDefaultFilterFilterableFieldErrors(
  defaultFilter: any,
  defaultFilterPath: string,
  filterableFieldNames: string[] | undefined,
  errors: AuthoringErrorInput[],
) {
  if (_.isUndefined(defaultFilter) || !filterableFieldNames) {
    return;
  }
  const allowed = new Set(filterableFieldNames);
  collectDefaultFilterFieldRefs(defaultFilter, defaultFilterPath).forEach((ref) => {
    if (allowed.has(ref.fieldPath)) {
      return;
    }
    pushAuthoringError(errors, {
      path: ref.path,
      ruleId: 'defaultFilter-filterable-field-missing',
      message: `flowSurfaces authoring ${ref.path} references field '${ref.fieldPath}' that is not listed in filterableFieldNames`,
      details: {
        fieldPath: ref.fieldPath,
        filterableFieldNames,
      },
    });
  });
}

function collectDefaultFilterFieldRefs(value: any, path: string): Array<{ fieldPath: string; path: string }> {
  const refs: Array<{ fieldPath: string; path: string }> = [];
  visitDefaultFilterFieldRefs(value, path, refs);
  return refs;
}

function visitDefaultFilterFieldRefs(value: any, path: string, refs: Array<{ fieldPath: string; path: string }>) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitDefaultFilterFieldRefs(item, `${path}[${index}]`, refs));
    return;
  }
  if (!_.isPlainObject(value)) {
    return;
  }
  const explicitFieldPath =
    typeof value.path === 'string' && value.path.trim()
      ? { fieldPath: value.path.trim(), path: `${path}.path` }
      : typeof value.field === 'string' && value.field.trim()
        ? { fieldPath: value.field.trim(), path: `${path}.field` }
        : null;
  if (explicitFieldPath) {
    refs.push(explicitFieldPath);
  }
  if (Array.isArray(value.items)) {
    value.items.forEach((item: any, index: number) =>
      visitDefaultFilterFieldRefs(item, `${path}.items[${index}]`, refs),
    );
  }
  Object.entries(value).forEach(([key, child]) => {
    if (
      key.startsWith('$') ||
      key === 'logic' ||
      key === 'items' ||
      key === 'path' ||
      key === 'field' ||
      key === 'operator' ||
      key === 'value'
    ) {
      return;
    }
    refs.push({
      fieldPath: key,
      path: `${path}.${key}`,
    });
    if (_.isPlainObject(child) || Array.isArray(child)) {
      visitDefaultFilterFieldRefs(child, `${path}.${key}`, refs);
    }
  });
}

function isFilterAction(action: any) {
  return [action?.type, action?.key, action?.action, action?.use]
    .map((value) =>
      String(value || '')
        .trim()
        .toLowerCase(),
    )
    .some((value) => value === 'filter' || value === 'filteractionmodel' || value === 'filter-action');
}

function isJsItemActionType(action: any) {
  const actionType = String(action?.type || action?.key || action?.action || '')
    .trim()
    .toLowerCase();
  return actionType === 'jsitem' || actionType === 'js-item';
}

function isJsItemActionSlotSupported(blockType: string, slot: string) {
  if (slot === 'recordActions') {
    return JS_ITEM_RECORD_ACTION_HOST_BLOCK_TYPES.has(blockType);
  }
  return (
    JS_ITEM_COLLECTION_ACTION_HOST_BLOCK_TYPES.has(blockType) || JS_ITEM_FORM_ACTION_HOST_BLOCK_TYPES.has(blockType)
  );
}

function collectAssignValuesErrors(
  value: any,
  path: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (_.isUndefined(value)) {
    return;
  }
  if (!_.isPlainObject(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'assignValues-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an object`,
    });
    return;
  }
  Object.keys(value).forEach((fieldPath) => {
    collectUnknownFieldPathError(fieldPath, `${path}.${fieldPath}`, block, context, errors);
  });
}

function collectTriggerWorkflowsErrors(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(value)) {
    return;
  }
  if (!Array.isArray(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'triggerWorkflows-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an array`,
    });
    return;
  }
  value.forEach((item, index) => {
    if (!_.isPlainObject(item)) {
      pushAuthoringError(errors, {
        path: `${path}[${index}]`,
        ruleId: 'triggerWorkflows-invalid-shape',
        message: `flowSurfaces authoring ${path}[${index}] must be an object`,
      });
      return;
    }
    if (typeof item.workflowKey !== 'string' || !item.workflowKey.trim()) {
      pushAuthoringError(errors, {
        path: `${path}[${index}].workflowKey`,
        ruleId: 'triggerWorkflows-invalid-shape',
        message: `flowSurfaces authoring ${path}[${index}].workflowKey must be a non-empty string`,
      });
    }
    if (hasOwn(item, 'context') && typeof item.context !== 'string') {
      pushAuthoringError(errors, {
        path: `${path}[${index}].context`,
        ruleId: 'triggerWorkflows-invalid-shape',
        message: `flowSurfaces authoring ${path}[${index}].context must be a string`,
      });
    }
  });
}

function collectLinkageRulesErrors(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (_.isUndefined(value)) {
    return;
  }
  if (!Array.isArray(value)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'linkageRules-invalid-shape',
      message: `flowSurfaces authoring ${path} must be an array`,
    });
    return;
  }
  value.forEach((rule, index) => {
    const rulePath = `${path}[${index}]`;
    if (!_.isPlainObject(rule)) {
      pushAuthoringError(errors, {
        path: rulePath,
        ruleId: 'linkageRules-rule-invalid-shape',
        message: `flowSurfaces authoring ${rulePath} must be an object`,
      });
      return;
    }

    const conditionPath = hasOwn(rule, 'condition')
      ? `${rulePath}.condition`
      : hasOwn(rule, 'when')
        ? `${rulePath}.when`
        : `${rulePath}.condition`;
    const conditionValue = hasOwn(rule, 'condition')
      ? rule.condition
      : hasOwn(rule, 'when')
        ? rule.when
        : FLOW_SURFACE_EMPTY_FILTER_GROUP;
    try {
      normalizeFlowSurfaceCompatibleFilterGroupValue(
        conditionValue,
        `flowSurfaces authoring ${conditionPath} expects FilterGroup or backend query filter like ${FLOW_SURFACE_FILTER_GROUP_EXAMPLE}`,
        { strictDateValues: true },
      );
    } catch (error) {
      pushAuthoringError(errors, {
        path: conditionPath,
        ruleId: 'linkageRules-condition-invalid-shape',
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (hasOwn(rule, 'actions') && !Array.isArray(rule.actions)) {
      pushAuthoringError(errors, {
        path: `${rulePath}.actions`,
        ruleId: 'linkageRules-actions-invalid-shape',
        message: `flowSurfaces authoring ${rulePath}.actions must be an array`,
      });
    }
    if (hasOwn(rule, 'then') && !Array.isArray(rule.then)) {
      pushAuthoringError(errors, {
        path: `${rulePath}.then`,
        ruleId: 'linkageRules-actions-invalid-shape',
        message: `flowSurfaces authoring ${rulePath}.then must be an array`,
      });
    }
  });
}

function collectPopupErrors(
  popup: any,
  path: string,
  errors: AuthoringErrorInput[],
  localKeys: Set<string>,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (!_.isPlainObject(popup)) {
    return;
  }
  if (!_.isUndefined(popup.saveAsTemplate) && hasFlowSurfaceTemplateReference(popup.template)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'popup-saveAsTemplate-template-conflict',
      message: `flowSurfaces authoring ${path} cannot combine saveAsTemplate with template`,
    });
  }
  if (hasFlowSurfaceTemplateReference(popup.template)) {
    return;
  }
  collectPublicLayoutErrors(
    popup.layout,
    `${path}.layout`,
    getBlockLayoutEntries(popup.blocks, `${path}.blocks`),
    'block',
    errors,
    {
      skipSingleColumn: context.skipGeneratedLayoutSingleColumnErrors === true,
    },
  );
  collectReactionErrors(popup.reaction, `${path}.reaction`, localKeys, errors);
  collectNestedBlockErrors(popup.blocks, `${path}.blocks`, errors, localKeys, context);
}

function collectPopupLikeErrors(
  popup: any,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(popup)) {
    return;
  }
  const localKeys = new Set<string>();
  collectLocalKeys(popup, localKeys);
  collectPopupErrors(popup, path, errors, localKeys, context);
}

function collectHiddenPopupSettingsErrors(
  settings: any,
  path: string,
  blockType: string | undefined,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!_.isPlainObject(settings)) {
    return;
  }
  const keys = HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE[String(blockType || '').trim()] || [];
  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      return;
    }
    collectPopupLikeErrors(settings[key], `${path}.${key}`, errors, context);
  });
}

function collectNestedBlockErrors(
  blocks: any,
  path: string,
  errors: AuthoringErrorInput[],
  localKeys: Set<string>,
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (!Array.isArray(blocks)) {
    return;
  }
  blocks.forEach((block, index) => collectBlockErrors(block, `${path}[${index}]`, errors, localKeys, context));
}

function collectReactionErrors(
  reaction: any,
  path: string,
  localKeys: Set<string>,
  errors: AuthoringErrorInput[],
  options: {
    values?: any;
    context?: FlowSurfaceAuthoringValidationContext;
  } = {},
) {
  const items = Array.isArray(reaction?.items) ? reaction.items : [];
  items.forEach((item: any, index: number) => {
    const rawTarget = item?.target ?? item?.targetKey ?? item?.targetBlock;
    if (typeof rawTarget !== 'string') {
      return;
    }
    const target = rawTarget.trim();
    if (!target) {
      return;
    }
    if (!localKeys.has(target)) {
      pushAuthoringError(errors, {
        path: `${path}.items[${index}].target`,
        ruleId: 'reaction-target-unknown',
        message: `flowSurfaces authoring ${path}.items[${index}].target references unknown local target '${target}'`,
      });
    }
    collectReactionItemDateConditionErrors(item, `${path}.items[${index}]`, target, errors, options);
  });
}

function collectReactionItemDateConditionErrors(
  item: any,
  path: string,
  target: string,
  errors: AuthoringErrorInput[],
  options: {
    values?: any;
    context?: FlowSurfaceAuthoringValidationContext;
  },
) {
  if (!_.isPlainObject(item) || !_.isPlainObject(options.values) || !options.context) {
    return;
  }
  const targetMatch = findApplyBlueprintReactionTargetBlock(options.values, target, options.context);
  if (!targetMatch) {
    return;
  }
  const type = String(item.type || '').trim();
  const conditionFieldMetaByPath = buildApplyBlueprintReactionConditionFieldMetaByPath(
    targetMatch.block,
    targetMatch.context,
  );
  _.castArray(item.rules || []).forEach((rule, ruleIndex) => {
    collectReactionFilterDateConditionErrors(
      rule?.when ?? rule?.condition,
      `${path}.rules[${ruleIndex}].when`,
      errors,
      targetMatch.block,
      targetMatch.context,
      conditionFieldMetaByPath,
    );
    if (type !== 'setFieldLinkageRules') {
      return;
    }
    _.castArray(rule?.then || rule?.actions || []).forEach((action, actionIndex) => {
      _.castArray(action?.items || []).forEach((assignItem, itemIndex) => {
        collectReactionFilterDateConditionErrors(
          assignItem?.when ?? assignItem?.condition,
          `${path}.rules[${ruleIndex}].then[${actionIndex}].items[${itemIndex}].when`,
          errors,
          targetMatch.block,
          targetMatch.context,
          conditionFieldMetaByPath,
        );
      });
    });
  });
}

function collectReactionFilterDateConditionErrors(
  filter: any,
  path: string,
  errors: AuthoringErrorInput[],
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  fieldMetaByPath: Record<string, { type?: string; interface?: string }> = {},
) {
  if (!_.isPlainObject(filter)) {
    return;
  }
  if (Array.isArray(filter.items)) {
    filter.items.forEach((item, index) =>
      collectReactionFilterDateConditionErrors(
        item,
        `${path}.items[${index}]`,
        errors,
        block,
        context,
        fieldMetaByPath,
      ),
    );
    return;
  }
  if (!hasOwn(filter, 'operator')) {
    return;
  }
  const conditionPath = normalizeReactionConditionPath(filter.path);
  const fieldContext = resolveReactionConditionFieldContext(conditionPath, block, context, fieldMetaByPath);
  collectDefaultFilterDateValueError(filter.operator, filter.value, `${path}.value`, errors, fieldContext, {
    allowContextPathValue: true,
  });
}

function normalizeReactionConditionPath(rawPath: any) {
  const value = String(rawPath || '').trim();
  const templateMatch = /^\{\{\s*ctx(?:\.([^}]+?))?\s*\}\}$/.exec(value);
  const path = templateMatch ? String(templateMatch[1] || '').trim() : value.replace(/^ctx\./, '');
  return path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join('.');
}

function buildApplyBlueprintReactionConditionFieldMetaByPath(
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
) {
  const collection = getBlockCollection(block, context);
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const userCollection =
    context.getCollection?.('main', 'users') || context.getCollection?.(dataSourceKey, 'users') || null;
  const response = buildFlowSurfaceContextResponse({
    semantic: {
      collection,
      userCollection,
      recordCollection: collection,
      formValuesCollection: collection,
      itemCollections: collection ? [collection] : [],
      itemRootCollection: collection || undefined,
      popupLevels:
        context.isPopupSurface || context.popupHasCurrentRecord
          ? [
              {
                recordCollection: collection,
                sourceRecordCollection: collection,
              },
            ]
          : [],
    },
    maxDepth: 4,
  });
  const fieldMetaByPath = collectAuthorableReactionContextFieldMetaByPath(response);
  addCollectionFieldMetaAliases(fieldMetaByPath, collection, ['collection', 'record', 'formValues']);
  addCollectionFieldMetaAliases(fieldMetaByPath, collection, ['item'], {
    preserveExisting: true,
    reservedKeys: new Set(['index', 'length', 'value', 'parentItem']),
  });
  if (userCollection) {
    addCollectionFieldMetaAliases(fieldMetaByPath, userCollection, ['user']);
  }
  return fieldMetaByPath;
}

function collectAuthorableReactionContextFieldMetaByPath(context: FlowSurfaceContextResponse) {
  const fieldMetaByPath: Record<string, { type?: string; interface?: string }> = {};
  const visit = (prefix: string, info: FlowSurfaceContextVarInfo | undefined) => {
    if (!prefix || !info) {
      return;
    }
    if (isAuthorableReactionContextPath(prefix)) {
      fieldMetaByPath[prefix] = {
        ...(info.type ? { type: info.type } : {}),
        ...(info.interface ? { interface: info.interface } : {}),
      };
    }
    if (info.dynamicProperties) {
      visit(`${prefix}.*`, info.dynamicProperties);
    }
    Object.entries(info.properties || {}).forEach(([key, child]) => visit(`${prefix}.${key}`, child));
  };

  Object.entries(context?.vars || {}).forEach(([key, info]) => visit(key, info));
  return fieldMetaByPath;
}

function isAuthorableReactionContextPath(path: string) {
  const segments = String(path || '')
    .split('.')
    .filter(Boolean);
  const root = segments[0];
  if (!root) {
    return false;
  }
  if (AUTHORABLE_REACTION_SCALAR_CONTEXT_PATHS.has(root)) {
    return segments.length === 1;
  }
  return AUTHORABLE_REACTION_CONTEXT_ROOTS.has(root);
}

function addCollectionFieldMetaAliases(
  fieldMetaByPath: Record<string, { type?: string; interface?: string }>,
  collection: any,
  roots: string[],
  options: {
    preserveExisting?: boolean;
    reservedKeys?: Set<string>;
  } = {},
) {
  for (const field of getCollectionFields(collection)) {
    const fieldName = getFieldName(field);
    if (!fieldName) {
      continue;
    }
    const fieldMeta = {
      ...(getFieldType(field) ? { type: getFieldType(field) } : {}),
      ...(getFieldInterface(field) ? { interface: getFieldInterface(field) } : {}),
    };
    for (const root of roots) {
      if (options.reservedKeys?.has(fieldName)) {
        continue;
      }
      const aliasPath = `${root}.${fieldName}`;
      if (options.preserveExisting && fieldMetaByPath[aliasPath]) {
        continue;
      }
      fieldMetaByPath[aliasPath] = {
        ...fieldMetaByPath[aliasPath],
        ...fieldMeta,
      };
    }
  }
}

function resolveReactionConditionFieldContext(
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  fieldMetaByPath: Record<string, { type?: string; interface?: string }>,
): FlowSurfaceDateConditionFieldContext | undefined {
  const normalized = String(path || '').trim();
  const contextMeta = resolveReactionConditionFieldMeta(normalized, fieldMetaByPath);
  if (contextMeta) {
    return {
      fieldPath: normalized,
      fieldMeta: contextMeta,
    };
  }
  const fieldPath = resolveReactionConditionFieldPath(normalized);
  return fieldPath ? resolveDefaultFilterDateConditionField(fieldPath, block, context) || undefined : undefined;
}

function resolveReactionConditionFieldMeta(
  path: string,
  fieldMetaByPath: Record<string, { type?: string; interface?: string }>,
) {
  if (fieldMetaByPath[path]) {
    return fieldMetaByPath[path];
  }
  const wildcardPath = Object.keys(fieldMetaByPath)
    .filter((candidate) => candidate.endsWith('.*'))
    .sort((a, b) => b.length - a.length)
    .find((candidate) => {
      const prefix = candidate.slice(0, -2);
      return path.startsWith(`${prefix}.`) && path.length > prefix.length + 1;
    });
  return wildcardPath ? fieldMetaByPath[wildcardPath] : undefined;
}

function resolveReactionConditionFieldPath(path: string) {
  const normalized = String(path || '').trim();
  const prefixes = ['formValues.', 'record.', 'item.value.', 'item.', 'popup.record.', 'collection.', 'user.'];
  const prefix = prefixes.find((candidate) => normalized.startsWith(candidate));
  return prefix ? normalized.slice(prefix.length) : '';
}

function collectFieldListErrors(
  fields: any,
  path: string,
  errors: AuthoringErrorInput[],
  localKeys: Set<string>,
  context: FlowSurfaceAuthoringValidationContext,
  block?: any,
) {
  if (!Array.isArray(fields)) {
    return;
  }
  fields.forEach((field, index) => {
    collectInternalFieldKeysErrors(field, `${path}[${index}]`, errors);
    const fieldPath = getAssociationAwareFieldPathInput(field);
    if (fieldPath) {
      collectUnknownFieldPathError(fieldPath, `${path}[${index}]`, block, context, errors);
    }
    collectImplicitRelationTitleFieldErrors(field, `${path}[${index}]`, block, context, errors);
    if (!_.isPlainObject(field)) {
      return;
    }
    collectApplyBlueprintScriptAssetReferenceErrors(field, `${path}[${index}]`, errors, context);
    collectRelationTitleFieldErrors(field, `${path}[${index}]`, block, context, errors);
    collectRelationPopupResourceErrors(field, `${path}[${index}]`, block, context, errors);
    collectPopupErrors(
      field.popup,
      `${path}[${index}].popup`,
      errors,
      localKeys,
      getFieldPopupValidationContext(field, block, context),
    );
    collectActionListErrors(field.actions, `${path}[${index}].actions`, errors, block, context);
    collectReactionErrors(field.reaction, `${path}[${index}].reaction`, localKeys, errors);
  });
}

function isAuthoringTreeCollection(collection?: any) {
  return collection?.template === 'tree' || collection?.options?.template === 'tree' || collection?.tree === true;
}

function resolveAuthoringTreeChildrenFieldName(collection?: any) {
  const field = getCollectionFields(collection).find(
    (candidate) => candidate?.treeChildren === true || candidate?.options?.treeChildren === true,
  );
  return getFieldName(field);
}

function isAuthoringTreeTableBlock(block: any, blockType: string, context: FlowSurfaceAuthoringValidationContext) {
  if (blockType !== 'table' || block?.settings?.treeTable !== true || hasFlowSurfaceTemplateDocument(block?.template)) {
    return false;
  }
  const collection = getBlockCollection(block, context);
  return isAuthoringTreeCollection(collection) && !!resolveAuthoringTreeChildrenFieldName(collection);
}

function isUnreadableTreeTableFirstColumnName(fieldName: any) {
  const normalizedFieldName = String(fieldName || '').trim();
  const lowerName = normalizedFieldName.toLowerCase();
  return (
    !normalizedFieldName ||
    normalizedFieldName.includes('.') ||
    ['id', 'uid', 'uuid', 'parentid'].includes(lowerName) ||
    /^parent[_-]?id$/i.test(normalizedFieldName) ||
    /(?:^|[_-])(id|uid)$/i.test(normalizedFieldName) ||
    /(?:Id|ID|Uid|UID)$/.test(normalizedFieldName)
  );
}

function isDirectTreeTableFirstColumnName(fieldName: any) {
  return !isUnreadableTreeTableFirstColumnName(fieldName);
}

function isUsableTreeTableFirstColumnField(fieldPath: string, collection: any) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  if (!isDirectTreeTableFirstColumnName(normalizedFieldPath)) {
    return false;
  }
  const field = resolveFieldFromCollection(collection, normalizeFieldPath(normalizedFieldPath));
  return !!field && !!getFieldInterface(field) && !isAssociationField(field);
}

function collectTreeTableExplicitFieldsErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (
    !Object.prototype.hasOwnProperty.call(block, 'fields') ||
    !Array.isArray(block.fields) ||
    !isAuthoringTreeTableBlock(block, blockType, context)
  ) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (
    block.fields.some((field: any) =>
      isUsableTreeTableFirstColumnField(getAssociationAwareFieldPathInput(field), collection),
    )
  ) {
    return;
  }
  pushAuthoringError(errors, {
    path: `${path}.fields[0]`,
    ruleId: 'tree-table-explicit-fields-readable-required',
    message: `flowSurfaces authoring ${path}.fields[0] tree table explicit fields must include at least one direct readable non-association field; do not rely on addBlock/compose to inject a title/name fallback`,
  });
}

function collectFieldListInternalKeyErrors(fields: any, path: string, errors: AuthoringErrorInput[]) {
  if (!Array.isArray(fields)) {
    return;
  }
  fields.forEach((field, index) => collectInternalFieldKeysErrors(field, `${path}[${index}]`, errors));
}

function collectApplyBlueprintScriptAssetReferenceErrors(
  spec: any,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext,
) {
  if (context.authoringActionName !== 'applyBlueprint' || !_.isPlainObject(spec) || _.isUndefined(spec.script)) {
    return;
  }
  const publicPath = path.replace(/^\$\./, '');
  if (typeof spec.script === 'string') {
    const scriptKey = spec.script.trim();
    if (!scriptKey) {
      pushAuthoringError(errors, {
        path: `${path}.script`,
        ruleId: 'apply-blueprint-script-asset-key-invalid',
        message: `flowSurfaces applyBlueprint ${publicPath}.script must be a non-empty string asset key; use settings.code for inline JS code`,
        details: withJsBlockRepairHint(),
      });
      return;
    }
    const scriptAssets = context.applyBlueprintScriptAssets;
    if (
      !_.isPlainObject(scriptAssets) ||
      !hasOwn(scriptAssets, scriptKey) ||
      !_.isPlainObject(scriptAssets[scriptKey]) ||
      (typeof scriptAssets[scriptKey].code === 'string' && scriptAssets[scriptKey].code.trim())
    ) {
      return;
    }
    pushAuthoringError(errors, {
      path: `${path}.script`,
      ruleId: 'apply-blueprint-script-asset-code-required',
      message: `flowSurfaces applyBlueprint ${publicPath}.script references script asset '${scriptKey}' without non-empty code; use settings.code for inline JS code`,
      details: withJsBlockRepairHint({
        scriptKey,
      }),
    });
    return;
  }
  pushAuthoringError(errors, {
    path: `${path}.script`,
    ruleId: 'apply-blueprint-script-asset-key-invalid',
    message: `flowSurfaces applyBlueprint ${publicPath}.script must be a string asset key; use settings.code for inline JS code`,
    details: withJsBlockRepairHint(),
  });
}

function hasApplyBlueprintRunnableScriptAssetReference(script: any, context: FlowSurfaceAuthoringValidationContext) {
  if (context.authoringActionName !== 'applyBlueprint' || typeof script !== 'string' || !script.trim()) {
    return false;
  }
  const scriptKey = script.trim();
  const scriptAssets = context.applyBlueprintScriptAssets;
  if (!_.isPlainObject(scriptAssets) || !hasOwn(scriptAssets, scriptKey) || !_.isPlainObject(scriptAssets[scriptKey])) {
    return true;
  }
  return typeof scriptAssets[scriptKey].code === 'string' && !!scriptAssets[scriptKey].code.trim();
}

function collectInternalFieldKeysErrors(field: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(field)) {
    return;
  }
  collectInternalFieldKeysOnObject(field, path, errors);
  collectInternalFieldKeysOnObject(field.settings, `${path}.settings`, errors);
}

function collectInternalFieldKeysOnObject(value: any, path: string, errors: AuthoringErrorInput[]) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const forbidden = FLOW_SURFACE_INTERNAL_FIELD_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(value, key));
  if (!forbidden.length) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: 'internal-field-keys-not-public',
    message: `flowSurfaces authoring ${path} field objects must use public fieldType/fields/titleField keys; remove internal keys: ${forbidden.join(
      ', ',
    )}`,
    details: {
      keys: forbidden,
    },
  });
}

function collectRelationPopupResourceErrors(
  fieldSpec: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const hostBlockType = String(block?.type || '').trim();
  if (!RELATION_FIELD_POPUP_HOST_BLOCK_TYPES.has(hostBlockType) || !Array.isArray(fieldSpec?.popup?.blocks)) {
    return;
  }

  const fieldPath = getFieldPathInput(fieldSpec);
  if (!fieldPath || fieldPath.includes('.')) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  const associationField = resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  if (!associationField || !isAssociationField(associationField)) {
    return;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const targetCollection = resolveFieldTargetCollection(
    associationField,
    dataSourceKey,
    (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
  );
  const targetCollectionName = getCollectionName(targetCollection) || getFieldTargetName(associationField);

  fieldSpec.popup.blocks.forEach((popupBlock: any, blockIndex: number) => {
    if (!_.isPlainObject(popupBlock)) {
      return;
    }
    const popupBlockType = String(popupBlock.type || '').trim();
    const popupBlockPath = `${path}.popup.blocks[${blockIndex}]`;
    const binding = getResourceBinding(popupBlock);
    const popupCollectionName = String(popupBlock.collection || popupBlock.resource?.collectionName || '').trim();

    if (RELATION_FIELD_POPUP_CURRENT_RECORD_BLOCK_TYPES.has(popupBlockType)) {
      if (targetCollectionName && popupCollectionName && popupCollectionName !== targetCollectionName) {
        pushAuthoringError(errors, {
          path: `${popupBlockPath}.resource.collectionName`,
          ruleId: 'relation-popup-current-record-target-mismatch',
          message: `flowSurfaces authoring ${popupBlockPath} must target relation collection '${targetCollectionName}'`,
          details: {
            associationField: fieldPath,
            expectedCollectionName: targetCollectionName,
            actualCollectionName: popupCollectionName,
          },
        });
      }
      if (binding && binding !== 'currentrecord' && binding !== 'currentcollection') {
        pushAuthoringError(errors, {
          path: `${popupBlockPath}.resource.binding`,
          ruleId: 'relation-popup-current-record-binding-required',
          message: `flowSurfaces authoring ${popupBlockPath} must use resource.binding='currentRecord' for relation field popups`,
          details: {
            associationField: fieldPath,
            binding,
          },
        });
      }
      return;
    }

    if (RELATION_FIELD_POPUP_ASSOCIATED_RECORDS_BLOCK_TYPES.has(popupBlockType)) {
      if (binding !== 'associatedrecords') {
        pushAuthoringError(errors, {
          path: `${popupBlockPath}.resource.binding`,
          ruleId: 'relation-popup-associated-records-binding-required',
          message: `flowSurfaces authoring ${popupBlockPath} must use resource.binding='associatedRecords' for relation field popup lists`,
          details: {
            associationField: fieldPath,
            binding,
          },
        });
        return;
      }
      const popupAssociationField = String(
        popupBlock.associationField ||
          popupBlock.resource?.associationField ||
          popupBlock.resource?.associationPathName ||
          '',
      ).trim();
      const targetPopupAssociationField =
        targetCollection && popupAssociationField
          ? resolveFieldFromCollection(targetCollection, normalizeFieldPath(popupAssociationField))
          : null;
      const isTargetCollectionAssociation =
        targetPopupAssociationField && isAssociationField(targetPopupAssociationField);
      if (popupAssociationField && popupAssociationField !== fieldPath && !isTargetCollectionAssociation) {
        pushAuthoringError(errors, {
          path: `${popupBlockPath}.resource.associationField`,
          ruleId: 'relation-popup-associated-records-association-field-required',
          message: `flowSurfaces authoring ${popupBlockPath} must use resource.associationField='${fieldPath}' or an association on relation target collection '${targetCollectionName}'`,
          details: {
            expectedAssociationField: fieldPath,
            actualAssociationField: popupAssociationField,
            targetCollectionName,
          },
        });
      }
    }
  });
}

function collectRelationTitleFieldErrors(
  fieldSpec: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (!Object.prototype.hasOwnProperty.call(fieldSpec, 'titleField')) {
    return;
  }
  const titleField = String(fieldSpec.titleField || '').trim();
  if (!titleField) {
    pushAuthoringError(errors, {
      path: `${path}.titleField`,
      ruleId: 'relation-titleField-invalid-shape',
      message: `flowSurfaces authoring ${path}.titleField must be a non-empty string`,
    });
    return;
  }
  const fieldPath = getFieldPathInput(fieldSpec);
  const collection = getBlockCollection(block, context);
  if (!fieldPath || !collection) {
    return;
  }
  const resolvedField = resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  if (!resolvedField || !isAssociationField(resolvedField)) {
    pushAuthoringError(errors, {
      path: `${path}.titleField`,
      ruleId: 'relation-titleField-non-association',
      message: `flowSurfaces authoring ${path}.titleField is only supported for association fields`,
      details: {
        fieldPath,
      },
    });
    return;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  const targetCollection = resolveFieldTargetCollection(
    resolvedField,
    dataSourceKey,
    (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
  );
  if (!targetCollection) {
    return;
  }
  const titleFieldTarget = resolveFieldFromCollection(targetCollection, titleField);
  if (titleField === 'id' || (titleFieldTarget && isAssociationField(titleFieldTarget))) {
    pushAuthoringError(errors, {
      path: `${path}.titleField`,
      ruleId: 'relation-titleField-unreadable',
      message: `flowSurfaces authoring ${path}.titleField cannot use unreadable relation title field '${titleField}'`,
      details: buildFlowSurfaceTitleFieldErrorDetails({
        action: context.authoringActionName,
        fieldPath,
        titleField,
        targetCollection,
        invalidReason: getRelationTitleFieldInvalidReason(titleField, titleFieldTarget),
      }),
    });
    return;
  }
  if (titleFieldTarget) {
    return;
  }
  pushAuthoringError(errors, {
    path: `${path}.titleField`,
    ruleId: 'relation-titleField-unknown',
    message: `flowSurfaces authoring ${path}.titleField references unknown relation title field '${titleField}'`,
    details: buildFlowSurfaceTitleFieldErrorDetails({
      action: context.authoringActionName,
      fieldPath,
      titleField,
      targetCollection,
      invalidReason: 'missing',
    }),
  });
}

function collectImplicitRelationTitleFieldErrors(
  fieldSpec: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  if (context.authoringActionName !== 'applyBlueprint') {
    return;
  }
  const hostBlockType = String(block?.type || '').trim();
  if (!IMPLICIT_RELATION_TITLE_FIELD_DISPLAY_BLOCK_TYPES.has(hostBlockType)) {
    return;
  }
  if (_.isPlainObject(fieldSpec) && fieldSpec.__autoPopupForRelationField === true) {
    return;
  }
  if (_.isPlainObject(fieldSpec) && Object.prototype.hasOwnProperty.call(fieldSpec, 'titleField')) {
    return;
  }
  const fieldPath = getFieldPathInput(fieldSpec);
  if (!fieldPath || fieldPath.includes('.')) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection || !context.getCollection) {
    return;
  }
  const resolvedField = resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath));
  if (!resolvedField || !isAssociationField(resolvedField)) {
    return;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  if (
    hasUsableDefaultFieldGroupRelationTitleField({
      fieldGroups: context.getDefaultFieldGroups?.(dataSourceKey, getBlockCollectionName(block, context)),
      fieldPath,
      field: resolvedField,
      dataSourceKey,
      context,
    })
  ) {
    return;
  }
  const registeredBinding = resolveRegisteredFieldBinding({
    containerUse: IMPLICIT_RELATION_TITLE_FIELD_CONTAINER_USE_BY_BLOCK_TYPE[hostBlockType],
    field: resolvedField,
    dataSourceKey,
    enabledPackages: context.enabledPackages,
    getCollection: (resolvedDataSourceKey, targetCollectionName) =>
      context.getCollection?.(resolvedDataSourceKey, targetCollectionName),
    useStrictOnly: true,
  });
  if (registeredBinding?.modelClassName) {
    return;
  }
  try {
    const resolvedTitleField = resolveAssociationSafeTitleField(resolvedField, dataSourceKey, context.getCollection, {
      action: context.authoringActionName,
      path: `${path}.titleField`,
      fieldPath,
    });
    if (!resolvedTitleField?.fieldName) {
      pushAuthoringError(errors, {
        path: `${path}.titleField`,
        ruleId: 'relation-titleField-unavailable',
        message: `flowSurfaces authoring ${path} relation field '${fieldPath}' requires an explicit readable titleField`,
        details: {
          fieldPath,
          repairHint: `Use object field form such as {"field":"${fieldPath}","titleField":"<readable target field>"}.`,
        },
      });
    }
  } catch (error) {
    if (!(error instanceof FlowSurfaceBadRequestError)) {
      throw error;
    }
    pushAuthoringError(errors, {
      path: `${path}.titleField`,
      ruleId: error.options.ruleId || 'relation-titleField-unavailable',
      message: `flowSurfaces authoring ${path} relation field '${fieldPath}' requires an explicit readable titleField`,
      details: {
        ...(error.options.details || {}),
        fieldPath,
        repairHint: `Use object field form such as {"field":"${fieldPath}","titleField":"<readable target field>"}.`,
      },
    });
  }
}

function hasUsableDefaultFieldGroupRelationTitleField(input: {
  fieldGroups?: any;
  fieldPath: string;
  field: any;
  dataSourceKey: string;
  context: FlowSurfaceAuthoringValidationContext;
}) {
  const titleField = getFlowSurfaceDefaultFieldGroupRelationTitleFieldOverride(input.fieldGroups, input.fieldPath);
  if (!titleField || titleField === 'id' || !input.context.getCollection) {
    return false;
  }
  const targetCollection = resolveFieldTargetCollection(
    input.field,
    input.dataSourceKey,
    (dataSourceKey, collectionName) => input.context.getCollection?.(dataSourceKey, collectionName),
  );
  const targetField = targetCollection ? resolveFieldFromCollection(targetCollection, titleField) : undefined;
  return !!targetField && !isAssociationField(targetField);
}

function getRelationTitleFieldInvalidReason(titleField: string, targetField: any) {
  if (titleField === 'id') {
    return 'id';
  }
  if (targetField && isAssociationField(targetField)) {
    return 'association';
  }
  return undefined;
}

function getResourceBinding(block: any) {
  return String(block?.resource?.binding || block?.binding || '')
    .trim()
    .toLowerCase();
}

function getResourceAssociationFieldName(block: any) {
  return String(
    block?.associationField || block?.resource?.associationField || block?.resource?.associationPathName || '',
  ).trim();
}

function getFieldTargetName(field: any) {
  return String(field?.target || field?.options?.target || '').trim();
}

function isCommentTemplateCollection(collection: any) {
  return collection?.template === 'comment' || collection?.options?.template === 'comment';
}

function getRecordHistoryDeclaredFilterTargetKey(collection: any) {
  const raw = Array.isArray(collection?.filterTargetKey)
    ? collection.filterTargetKey[0]
    : !_.isUndefined(collection?.filterTargetKey)
      ? collection.filterTargetKey
      : Array.isArray(collection?.options?.filterTargetKey)
        ? collection.options.filterTargetKey[0]
        : collection?.options?.filterTargetKey;
  return String(raw || '').trim();
}

function collectionHasConcreteField(collection: any, fieldName: string) {
  const normalized = String(fieldName || '').trim();
  if (!normalized) {
    return false;
  }
  const modelAttributes = getCollectionModelAttributes(collection);
  const primaryKeyAttributes = _.castArray(
    collection?.model?.primaryKeyAttributes || collection?.model?.primaryKeyAttribute || [],
  );
  const modelAttribute = modelAttributes?.[normalized];
  const isModelPrimaryKey = primaryKeyAttributes.includes(normalized) || !!modelAttribute?.primaryKey;
  return !!(
    resolveFieldFromCollection(collection, normalized) ||
    collection?.getField?.(normalized) ||
    getCollectionFields(collection).some((field) => getFieldName(field) === normalized) ||
    isModelPrimaryKey
  );
}

function collectDefaultFilterFieldPathError(
  rawFieldPath: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
) {
  const fieldPath = String(rawFieldPath || '').trim();
  if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  if (!isDirectDefaultFilterFieldPath(fieldPath)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-field-ineligible',
      message: `flowSurfaces authoring ${path} references field '${fieldPath}' that is not eligible for defaultFilter`,
      details: {
        fieldPath,
      },
    });
    return;
  }
  const resolved = resolveDefaultFilterFieldPath(
    collection,
    normalizeFieldPath(fieldPath),
    getBlockDataSourceKey(block, context),
    context,
  );
  if (!resolved.field) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'field-path-unknown',
      message: `flowSurfaces authoring ${path} references unknown field '${fieldPath}'`,
      details: {
        fieldPath,
        collection: getCollectionName(resolved.collection || collection),
        availableFields: getCollectionFields(resolved.collection || collection)
          .map((field) => String(getFieldName(field) || '').trim())
          .filter(Boolean),
      },
    });
    return;
  }
  if (isAssociationField(resolved.field)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-relation-field-unsupported',
      message: `flowSurfaces authoring ${path} cannot use relation field '${fieldPath}' itself; use a direct scalar field instead`,
      details: {
        fieldPath,
        fieldName: getFieldName(resolved.field),
      },
    });
    return;
  }
  if (!isFlowSurfaceDefaultFilterEligibleField(resolved.field)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-field-ineligible',
      message: `flowSurfaces authoring ${path} references field '${fieldPath}' that is not eligible for defaultFilter`,
      details: {
        fieldPath,
        fieldName: getFieldName(resolved.field),
        interface: getFieldInterface(resolved.field),
        filterable: getFieldFilterable(resolved.field),
      },
    });
  }
}

function resolveDefaultFilterFieldPath(
  collection: any,
  fieldPath: string,
  dataSourceKey: string,
  context: FlowSurfaceAuthoringValidationContext,
) {
  const segments = String(fieldPath || '')
    .split('.')
    .filter(Boolean);
  let currentCollection = collection;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const field = getCollectionField(currentCollection, segment);
    if (!field) {
      return { collection: currentCollection, field: null };
    }
    if (index === segments.length - 1) {
      return { collection: currentCollection, field };
    }
    if (!isAssociationField(field)) {
      return { collection: currentCollection, field: null };
    }
    const targetCollection = resolveFieldTargetCollection(
      field,
      dataSourceKey,
      (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
    );
    if (!targetCollection) {
      return { collection: currentCollection, field: null };
    }
    currentCollection = targetCollection;
  }
  return { collection, field: null };
}

function getCollectionField(collection: any, fieldName: string) {
  return collection?.getField?.(fieldName) || collection?.fields?.get?.(fieldName) || null;
}

function collectUnknownFieldPathError(
  rawFieldPath: any,
  path: string,
  block: any,
  context: FlowSurfaceAuthoringValidationContext,
  errors: AuthoringErrorInput[],
  options: Partial<Pick<AuthoringErrorInput, 'ruleId' | 'message'>> = {},
) {
  const fieldPath = String(rawFieldPath || '').trim();
  if (!fieldPath || fieldPath.startsWith('$') || fieldPath.startsWith('{{')) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  if (resolveFieldFromCollection(collection, normalizeFieldPath(fieldPath))) {
    return;
  }
  pushAuthoringError(errors, {
    path,
    ruleId: options.ruleId || 'field-path-unknown',
    message: options.message || `flowSurfaces authoring ${path} references unknown field '${fieldPath}'`,
    details: {
      fieldPath,
      collection: collection?.name || collection?.options?.name,
      availableFields: getCollectionFields(collection)
        .map((field) => String(field?.name || field?.options?.name || '').trim())
        .filter(Boolean),
    },
  });
}

function getBlockCollection(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const collectionName = getBlockCollectionName(block, context);
  if (!collectionName || !context.getCollection) {
    return null;
  }
  const dataSourceKey = getBlockDataSourceKey(block, context);
  return context.getCollection(dataSourceKey, collectionName);
}

function getBlockCollectionName(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const resourceInit = _.isPlainObject(block?.resourceInit) ? block.resourceInit : undefined;
  const associatedRecordsCollectionName = getBlockAssociatedRecordsTargetCollectionName(block, context);
  if (associatedRecordsCollectionName) {
    return associatedRecordsCollectionName;
  }
  return String(
    block?.collection ||
      block?.resource?.collectionName ||
      resourceInit?.collectionName ||
      context.currentCollectionName ||
      context.hostCollectionName ||
      '',
  ).trim();
}

function getBlockAssociatedRecordsTargetCollectionName(block: any, context: FlowSurfaceAuthoringValidationContext) {
  if (getResourceBinding(block) !== 'associatedrecords') {
    return '';
  }
  const associationFieldPath = String(
    block?.associationField || block?.resource?.associationField || block?.resource?.associationPathName || '',
  ).trim();
  if (!associationFieldPath || !context.getCollection) {
    return '';
  }
  const sourceCollectionName = String(context.currentCollectionName || context.hostCollectionName || '').trim();
  if (!sourceCollectionName) {
    return '';
  }
  const hostDataSourceKey = getBlockDataSourceKey(block, context);
  const hostCollection = context.getCollection(hostDataSourceKey, sourceCollectionName) || null;
  if (!hostCollection) {
    return '';
  }
  const associationField = resolveFieldFromCollection(hostCollection, normalizeFieldPath(associationFieldPath));
  if (!associationField || !isAssociationField(associationField)) {
    return '';
  }
  const targetCollection = resolveFieldTargetCollection(
    associationField,
    hostDataSourceKey,
    (nextDataSourceKey, collectionName) => context.getCollection?.(nextDataSourceKey, collectionName),
  );
  return getCollectionName(targetCollection) || getFieldTargetName(associationField) || '';
}

function getBlockDataSourceKey(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const resourceInit = _.isPlainObject(block?.resourceInit) ? block.resourceInit : undefined;
  return (
    String(
      block?.dataSourceKey ||
        block?.resource?.dataSourceKey ||
        resourceInit?.dataSourceKey ||
        context.currentDataSourceKey ||
        context.hostDataSourceKey ||
        'main',
    ).trim() || 'main'
  );
}

function getFieldPathInput(field: any): string {
  if (typeof field === 'string') {
    return field.trim();
  }
  if (_.isPlainObject(field)) {
    return String(field.path || field.fieldPath || field.field || field.name || '').trim();
  }
  return '';
}

function getAssociationAwareFieldPathInput(field: any): string {
  const fieldPath = getFieldPathInput(field);
  if (!_.isPlainObject(field)) {
    return fieldPath;
  }
  const associationPathName = String(field.associationPathName || '').trim();
  if (!associationPathName) {
    return fieldPath;
  }
  if (!fieldPath || fieldPath === associationPathName || fieldPath.startsWith(`${associationPathName}.`)) {
    return associationPathName;
  }
  return `${associationPathName}.${fieldPath}`;
}

function collectLocalKeys(value: any, keys: Set<string>, scopePrefix = '') {
  if (!_.isPlainObject(value)) {
    return;
  }
  const addKey = (rawKey: string) => {
    const key = String(rawKey || '').trim();
    if (!key) {
      return;
    }
    keys.add(key);
    if (scopePrefix && !key.startsWith(`${scopePrefix}.`)) {
      keys.add(`${scopePrefix}.${key}`);
    }
  };
  const key = String(value.key || '').trim();
  addKey(key);
  const scopedValueKey = scopePrefix && key && !key.startsWith(`${scopePrefix}.`) ? `${scopePrefix}.${key}` : key;
  const collectFieldLocalKeys = (field: any) => {
    const fieldKey = _.isPlainObject(field)
      ? String(field.key || field.name || field.path || field.fieldPath || field.field || '').trim()
      : getFieldPathInput(field);
    addKey(fieldKey);
    const fieldScopePrefix = scopedValueKey || scopePrefix;
    const scopedFieldKey =
      fieldKey && fieldScopePrefix && !fieldKey.startsWith(`${fieldScopePrefix}.`)
        ? `${fieldScopePrefix}.${fieldKey}`
        : fieldKey;
    addKey(scopedFieldKey);
    if (_.isPlainObject(field)) {
      collectLocalKeys(field.popup, keys, scopedFieldKey ? `${scopedFieldKey}.popup` : '');
    }
  };
  _.castArray(value.fields || []).forEach((field) => {
    collectFieldLocalKeys(field);
  });
  _.castArray(value.fieldGroups || []).forEach((group) => {
    _.castArray(group?.fields || []).forEach((field) => {
      collectFieldLocalKeys(field);
    });
  });
  _.castArray(value.actions || []).forEach((action) => {
    if (_.isPlainObject(action)) {
      const actionKey = String(action.key || '').trim();
      addKey(actionKey);
      if (scopedValueKey && actionKey && !actionKey.startsWith(`${scopedValueKey}.`)) {
        keys.add(`${scopedValueKey}.${actionKey}`);
      }
    }
  });
  _.castArray(value.recordActions || []).forEach((action) => {
    if (_.isPlainObject(action)) {
      const actionKey = String(action.key || '').trim();
      addKey(actionKey);
      if (scopedValueKey && actionKey && !actionKey.startsWith(`${scopedValueKey}.`)) {
        keys.add(`${scopedValueKey}.${actionKey}`);
      }
    }
  });
  _.castArray(value.blocks || []).forEach((block) => collectLocalKeys(block, keys, scopePrefix));
  _.castArray(value.popup?.blocks || []).forEach((block) => collectLocalKeys(block, keys, scopePrefix));
}

function getFieldKeys(fields: any): string[] {
  if (!Array.isArray(fields)) {
    return [];
  }
  return fields
    .map((field) => {
      if (typeof field === 'string') {
        return field.trim();
      }
      if (_.isPlainObject(field)) {
        return String(field.key || field.name || field.path || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

function getBlockKeys(blocks: any): Set<string> {
  const keys = new Set<string>();
  _.castArray(blocks || []).forEach((block) => {
    if (!_.isPlainObject(block)) {
      return;
    }
    const key = String(block.key || '').trim();
    if (key) {
      keys.add(key);
    }
  });
  return keys;
}

interface LayoutKnownEntry {
  key: string;
  path: string;
  type?: string;
}

function getBlockLayoutEntries(blocks: any, blocksPath: string): LayoutKnownEntry[] {
  return _.castArray(blocks || [])
    .map((block, index) => {
      if (!_.isPlainObject(block)) {
        return null;
      }
      return {
        key: String(block.key || '').trim(),
        path: `${blocksPath}[${index}]`,
        type: String(block.type || '').trim(),
      };
    })
    .filter(Boolean) as LayoutKnownEntry[];
}

function isFilterBlockType(blockType: any) {
  return String(blockType || '').trim() === 'filterForm';
}

function getLayoutCellKey(cell: any): string {
  if (typeof cell === 'string') {
    return cell.trim();
  }
  if (_.isPlainObject(cell)) {
    return String(cell.key || cell.field || cell.name || '').trim();
  }
  return '';
}
