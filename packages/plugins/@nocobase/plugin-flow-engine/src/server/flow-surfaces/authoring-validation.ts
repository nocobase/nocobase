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
import type { FlowSurfaceErrorItemInput } from './errors';
import { throwAggregateBadRequest } from './errors';
import {
  getCollectionFields,
  getCollectionName,
  getFieldFilterable,
  getFieldInterface,
  getFieldName,
  getFieldType,
  isAssociationField,
  normalizeFieldPath,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from './service-helpers';
import { getChartBuilderResourceInit } from './chart-config';
import {
  isFlowSurfacePublicDataSurfaceBlockType,
  resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames,
} from './public-data-surface-default-filter';

export type FlowSurfaceAuthoringWriteAction = 'applyBlueprint' | 'compose' | 'addBlock' | 'addBlocks' | 'configure';

type AuthoringErrorInput = Omit<FlowSurfaceErrorItemInput, 'message'> & { message: string };

export interface FlowSurfaceAuthoringValidationContext {
  getCollection?: (dataSourceKey: string, collectionName: string) => any;
  findMenuGroupRoutesByTitle?: (title: string, transaction?: any) => Promise<any[]>;
  transaction?: any;
  hostBlockType?: string;
  hostCollectionName?: string;
  hostDataSourceKey?: string;
  currentNode?: any;
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
const SORTABLE_BLOCK_TYPES = new Set(['table', 'details', 'list', 'tree', 'kanban', 'gridCard', 'map']);
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
]);
const HIDDEN_POPUP_SETTINGS_KEYS_BY_BLOCK_TYPE: Record<string, string[]> = {
  calendar: ['quickCreatePopup', 'eventPopup'],
  kanban: ['quickCreatePopup', 'cardPopup'],
};
const SUPPORTED_DEFAULT_FILTER_OPERATORS = buildSupportedDefaultFilterOperators();
const ACTION_TYPE_ALIASES = new Map([
  ['addchild', 'addChild'],
  ['addnew', 'addNew'],
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
  ['popup', 'popup'],
  ['refresh', 'refresh'],
  ['js', 'js'],
  ['jsitem', 'jsItem'],
]);
const CALENDAR_ALLOWED_ACTION_TYPES = new Set(CALENDAR_ACTION_TYPE_ALIASES.values());
const KANBAN_ALLOWED_ACTION_TYPES = new Set(KANBAN_ACTION_TYPE_ALIASES.values());

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

  if (!_.isPlainObject(values)) {
    return errors;
  }

  await collectNavigationGroupErrors(actionName, values, context, errors);
  collectTopLevelLayoutErrors(actionName, values, errors);

  if (actionName === 'configure') {
    await collectConfigureErrors(values, errors, context);
    return errors;
  }

  const blocks = getAuthoringBlocks(actionName, values);
  const localKeys = new Set<string>();
  blocks.forEach(({ block }) => collectLocalKeys(block, localKeys));
  blocks.forEach(({ block, path }) => collectBlockErrors(block, path, errors, localKeys, context));
  collectReactionErrors(values?.reaction, '$.reaction', localKeys, errors);

  return errors;
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
  if (matchedRoutes.length <= 1) {
    return;
  }
  pushAuthoringError(errors, {
    path: '$.navigation.group.title',
    ruleId: 'navigation-group-title-ambiguous',
    message: `flowSurfaces authoring $.navigation.group.title '${groupTitle}' matches ${matchedRoutes.length} existing menu groups; pass navigation.group.routeId explicitly`,
    details: {
      title: groupTitle,
      matches: matchedRoutes.length,
    },
  });
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

  if (Object.prototype.hasOwnProperty.call(block, 'layout')) {
    pushAuthoringError(errors, {
      path: `${path}.layout`,
      ruleId: 'block-layout-unsupported',
      message: `flowSurfaces authoring ${path}.layout is not supported; layout is only allowed on tabs[] and popup`,
    });
  }

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
  collectUnsupportedFieldAuthoringHostErrors(block, blockType, path, errors);
  collectSortingAliasErrors(block.settings, `${path}.settings`, blockType, errors);
  collectFieldGroupsShapeErrors(block.fieldGroups, path, errors, block, context);
  collectFieldsLayoutErrors(block, path, errors);
  collectTemplateBackedPublicDataSurfaceDefaultOverrideErrors(block, blockType, path, errors);
  collectDefaultFilterErrors(block.defaultFilter, `${path}.defaultFilter`, errors, block, context);
  collectBlockDefaultFilterCommonFieldErrors(block, blockType, path, errors, context);
  collectDefaultActionSettingsFilterErrors(
    block.defaultActionSettings,
    `${path}.defaultActionSettings`,
    errors,
    block,
    context,
  );
  collectRequiredPublicDataSurfaceDefaultFilterError(block, blockType, path, errors);
  collectSemanticBindingErrors(block, blockType, path, errors, context);
  collectChartDisplayTitleErrors(block, blockType, path, errors);
  collectChartBuilderRelationFieldErrors(block, blockType, path, errors);
  collectTreeConnectFieldsErrors(block.settings?.connectFields, `${path}.settings.connectFields`, errors);
  collectGridCardSettingsErrors(block, blockType, path, errors);
  collectActionListErrors(block.actions, `${path}.actions`, errors, block, context, 'actions');
  collectActionListErrors(block.recordActions, `${path}.recordActions`, errors, block, context, 'recordActions');
  collectPopupErrors(block.popup, `${path}.popup`, errors, localKeys, context);
  collectNestedBlockErrors(block.blocks, `${path}.blocks`, errors, localKeys, context);
  collectHiddenPopupSettingsErrors(block.settings, `${path}.settings`, blockType, errors, context);
  collectReactionErrors(block.reaction, `${path}.reaction`, localKeys, errors);
  collectFieldListErrors(block.fields, `${path}.fields`, errors, localKeys, context, block);
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
    });
  });
}

function collectFieldGroupsShapeErrors(
  fieldGroups: any,
  blockPath: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
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
      group.fields.forEach((fieldPath: any, fieldIndex: number) => {
        collectUnknownFieldPathError(fieldPath, `${groupPath}.fields[${fieldIndex}]`, block, context, errors);
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
  collectFieldGroupsShapeErrors(changes.fieldGroups, '$.changes', errors, changesBlock, context);
  collectSortingAliasErrors(changes, '$.changes', hostBlockType, errors);
  collectDefaultFilterErrors(changes.defaultFilter, '$.changes.defaultFilter', errors, changesBlock, context);
  collectSemanticBindingErrors(changesBlock, hostBlockType, '$.changes', errors, context);
  collectChartDisplayTitleErrors(changes, hostBlockType, '$.changes', errors);
  collectChartBuilderRelationFieldErrors(changes, hostBlockType, '$.changes', errors);
  collectGridCardSettingsErrors(changes, hostBlockType, '$.changes', errors, { directSettings: true });
  collectAssignValuesErrors(changes.assignValues, '$.changes.assignValues', errors, changesBlock, context);
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
  });
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
    collectPublicLayoutErrors(tab.layout, `$.tabs[${tabIndex}].layout`, getBlockKeys(tab.blocks), 'block', errors);
  });
}

function collectPublicLayoutErrors(
  layout: any,
  layoutPath: string,
  knownKeys: Set<string>,
  kind: 'block' | 'field',
  errors: AuthoringErrorInput[],
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
  rows.forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row) || !row.length) {
      pushAuthoringError(errors, {
        path: `${layoutPath}.rows[${rowIndex}]`,
        ruleId: `${kind}-layout-row-invalid-shape`,
        message: `flowSurfaces authoring ${layoutPath}.rows[${rowIndex}] must be a non-empty array`,
      });
      return;
    }
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
      if (!knownKeys.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: `${kind}-layout-unknown-key`,
          message: `flowSurfaces authoring ${cellPath} references unknown ${kind} '${key}'`,
        });
      }
    });
  });
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
  rows.forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row) || !row.length) {
      pushAuthoringError(errors, {
        path: `${layoutPath}.rows[${rowIndex}]`,
        ruleId: 'fieldsLayout-row-invalid-shape',
        message: `flowSurfaces authoring ${layoutPath}.rows[${rowIndex}] must be a non-empty array`,
      });
      return;
    }
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
      if (mentioned.has(key)) {
        pushAuthoringError(errors, {
          path: cellPath,
          ruleId: 'fieldsLayout-duplicate-field-key',
          message: `flowSurfaces authoring ${cellPath} duplicates field '${key}'`,
        });
      }
      mentioned.add(key);
    });
  });
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
  visitFilterItems(value, path, errors, block, context);
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

function collectRequiredPublicDataSurfaceDefaultFilterError(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
) {
  if (!isFlowSurfacePublicDataSurfaceBlockType(blockType) || !_.isUndefined(block?.template)) {
    return;
  }
  if (hasExplicitEffectiveDefaultFilter(block)) {
    return;
  }
  // Missing and explicit-but-invalid filters intentionally use different ruleIds:
  // this rule tells UI Builder that it must select a filter, while
  // collectDefaultFilterErrors reports malformed filters it already selected.
  pushAuthoringError(errors, {
    path: `${path}.defaultFilter`,
    ruleId: 'public-data-surface-default-filter-required',
    message: `flowSurfaces authoring ${path}.defaultFilter is required; UI Builder must choose an explicit defaultFilter for direct table/list/gridCard/calendar/kanban blocks`,
    details: {
      blockType,
      effectivePrecedence: [
        'filter actions[].settings.defaultFilter',
        'defaultActionSettings.filter.defaultFilter',
        'defaultFilter',
      ],
    },
  });
}

function collectTemplateBackedPublicDataSurfaceDefaultOverrideErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
) {
  if (!isFlowSurfacePublicDataSurfaceBlockType(blockType) || _.isUndefined(block?.template)) {
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

function collectBlockDefaultFilterCommonFieldErrors(
  block: any,
  blockType: string,
  path: string,
  errors: AuthoringErrorInput[],
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (
    !isFlowSurfacePublicDataSurfaceBlockType(blockType) ||
    !_.isUndefined(block?.template) ||
    !hasOwnDefined(block, 'defaultFilter')
  ) {
    return;
  }
  if (
    hasFilterActionSettingsKey(block, 'defaultFilter') ||
    hasFilterActionSettingsKey(block, 'filterableFieldNames') ||
    hasOwnDefined(block?.defaultActionSettings?.filter, 'defaultFilter') ||
    hasOwnDefined(block?.defaultActionSettings?.filter, 'filterableFieldNames')
  ) {
    return;
  }
  collectDefaultFilterCommonFieldErrors(block.defaultFilter, `${path}.defaultFilter`, errors, block, context);
}

function hasExplicitEffectiveDefaultFilter(block: any) {
  if (Array.isArray(block?.actions)) {
    if (hasFilterActionSettingsKey(block, 'defaultFilter')) {
      return true;
    }
  }
  if (hasOwnDefined(block?.defaultActionSettings?.filter, 'defaultFilter')) {
    return true;
  }
  return hasOwnDefined(block, 'defaultFilter');
}

function hasFilterActionSettingsKey(block: any, key: string) {
  return _.castArray(block?.actions || []).some(
    (action: any) => isFilterAction(action) && hasOwnDefined(action?.settings, key),
  );
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
  const effectiveDefaultFilter = hasOwnDefined(filterSettings, 'defaultFilter')
    ? { value: filterSettings.defaultFilter, path: `${filterSettingsPath}.defaultFilter` }
    : hasOwnDefined(block, 'defaultFilter')
      ? { value: block.defaultFilter, path: `${path.replace(/\.defaultActionSettings$/, '')}.defaultFilter` }
      : null;
  collectDefaultFilterFilterableFieldErrors(
    effectiveDefaultFilter?.value,
    effectiveDefaultFilter?.path || `${filterSettingsPath}.defaultFilter`,
    filterableFieldNames,
    errors,
  );
  if (_.isUndefined(filterableFieldNames)) {
    collectDefaultFilterCommonFieldErrors(
      effectiveDefaultFilter?.value,
      effectiveDefaultFilter?.path || `${filterSettingsPath}.defaultFilter`,
      errors,
      block,
      context,
    );
  }
}

function doesBlockConsumeDefaultFilterAction(block: any) {
  const blockType = String(block?.type || '').trim();
  return isFlowSurfacePublicDataSurfaceBlockType(blockType) && _.isUndefined(block?.template);
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
      return;
    }
    collectUnknownFieldPathError(fieldPath, `${settingsPath}.${settingKey}`, block, context, errors, {
      ruleId: `${blockType}-semantic-field-unknown`,
      message: `flowSurfaces authoring ${settingsPath}.${settingKey} references unknown ${blockType} semantic field '${fieldPath}'`,
    });
  });
}

function collectChartBuilderRelationFieldErrors(
  block: any,
  blockType: string,
  blockPath: string,
  errors: AuthoringErrorInput[],
) {
  const settingsPath = _.isPlainObject(block?.settings) ? `${blockPath}.settings` : blockPath;
  const settings = _.isPlainObject(block?.settings) ? block.settings : block;
  const query = blockType === 'chart' && _.isPlainObject(settings?.query) ? settings.query : null;
  if (!query) {
    return;
  }
  const mode = String(query.mode || 'builder')
    .trim()
    .toLowerCase();
  if (mode && mode !== 'builder') {
    return;
  }

  ['measures', 'dimensions', 'orders', 'sorting'].forEach((containerKey) => {
    const container = query[containerKey];
    if (!Array.isArray(container)) {
      return;
    }
    container.forEach((item: any, index: number) => {
      const field = _.isPlainObject(item) ? item.field : item;
      if (!isChartBuilderRelationFieldPath(field)) {
        return;
      }
      pushAuthoringError(errors, {
        path: `${settingsPath}.query.${containerKey}[${index}].field`,
        ruleId: 'chart-builder-relation-field-runtime-unsupported',
        message:
          'Builder chart query relation fields are not safe in the current charts:queryData runtime; use a SQL chart with an explicit join and stable aliases, or group by a scalar foreign-key field',
        details: {
          field,
        },
      });
    });
  });
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

function isChartBuilderRelationFieldPath(field: any) {
  if (Array.isArray(field)) {
    return field.filter((item) => typeof item === 'string' && item.trim()).length > 1;
  }
  return typeof field === 'string' && field.includes('.');
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
      Object.keys(child).forEach((operator) => {
        collectUnsupportedDefaultFilterOperatorError(operator, `${path}.${key}.${operator}`, errors);
      });
    }
  });
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
  actions.forEach((action, index) => collectActionErrors(action, `${path}[${index}]`, errors, block, context, slot));
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
  collectAssignValuesErrors(action.settings?.assignValues, `${path}.settings.assignValues`, errors, block, context);
  if (hasOwn(action, 'assignValues')) {
    pushAuthoringError(errors, {
      path: `${path}.assignValues`,
      ruleId: 'assignValues-top-level-unsupported',
      message: `flowSurfaces authoring ${path}.assignValues is not supported; use ${path}.settings.assignValues`,
    });
  }
  collectDefaultFilterErrors(action.defaultFilter, `${path}.defaultFilter`, errors, block, context);
  collectActionSettingsFilterErrors(action, path, errors, block, context);
  const localKeys = new Set<string>();
  collectLocalKeys(action.popup, localKeys);
  collectLocalKeys(action.openView, localKeys);
  collectPopupErrors(action.popup, `${path}.popup`, errors, localKeys, context);
  collectPopupErrors(action.openView, `${path}.openView`, errors, localKeys, context);
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
  const effectiveDefaultFilter = getEffectiveFilterActionDefaultFilter(block, action, path);
  collectDefaultFilterFilterableFieldErrors(
    effectiveDefaultFilter?.value,
    effectiveDefaultFilter?.path || `${settingsPath}.defaultFilter`,
    filterableFieldNames,
    errors,
  );
  if (_.isUndefined(filterableFieldNames)) {
    collectDefaultFilterCommonFieldErrors(
      effectiveDefaultFilter?.value,
      effectiveDefaultFilter?.path || `${settingsPath}.defaultFilter`,
      errors,
      block,
      context,
    );
  }
}

function getEffectiveFilterActionDefaultFilter(block: any, action: any, actionPath: string) {
  const settings = action?.settings;
  if (hasOwnDefined(settings, 'defaultFilter')) {
    return {
      value: settings.defaultFilter,
      path: `${actionPath}.settings.defaultFilter`,
    };
  }
  const blockPath = getBlockPathFromActionPath(actionPath);
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
  return null;
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

function collectDefaultFilterCommonFieldErrors(
  defaultFilter: any,
  defaultFilterPath: string,
  errors: AuthoringErrorInput[],
  block?: any,
  context: FlowSurfaceAuthoringValidationContext = {},
) {
  if (_.isUndefined(defaultFilter) || !hasConcreteFilterItem(defaultFilter)) {
    return;
  }
  const collection = getBlockCollection(block, context);
  if (!collection) {
    return;
  }
  const minimumCandidateFieldNames = resolveFlowSurfaceDefaultFilterMinimumCandidateFieldNames(collection);
  if (!minimumCandidateFieldNames.length) {
    return;
  }
  const refs = collectDefaultFilterFieldRefs(defaultFilter, defaultFilterPath);
  const coveredCandidateFieldNames = minimumCandidateFieldNames.filter((fieldName) =>
    refs.some((ref) => ref.fieldPath === fieldName),
  );
  if (coveredCandidateFieldNames.length >= minimumCandidateFieldNames.length) {
    return;
  }
  const collectionName = getCollectionName(collection) || getBlockCollectionName(block, context);
  const errorPath = `${defaultFilterPath}.items`;
  if (errors.some((error) => error.path === errorPath && error.ruleId === 'defaultFilter-common-fields-incomplete')) {
    return;
  }
  pushAuthoringError(errors, {
    path: errorPath,
    ruleId: 'defaultFilter-common-fields-incomplete',
    message: `flowSurfaces authoring ${defaultFilterPath}.items must cover at least ${
      minimumCandidateFieldNames.length
    } common business fields when available for collection ${collectionName}: ${minimumCandidateFieldNames.join(', ')}`,
    details: {
      collection: collectionName,
      minimumCandidateFieldNames,
      coveredCandidateFieldCount: coveredCandidateFieldNames.length,
    },
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
  if (!_.isUndefined(popup.saveAsTemplate) && !_.isUndefined(popup.template)) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'popup-saveAsTemplate-template-conflict',
      message: `flowSurfaces authoring ${path} cannot combine saveAsTemplate with template`,
    });
  }
  collectPublicLayoutErrors(popup.layout, `${path}.layout`, getBlockKeys(popup.blocks), 'block', errors);
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

function collectReactionErrors(reaction: any, path: string, localKeys: Set<string>, errors: AuthoringErrorInput[]) {
  const items = Array.isArray(reaction?.items) ? reaction.items : [];
  items.forEach((item: any, index: number) => {
    const target = String(item?.target || item?.targetKey || item?.targetBlock || '').trim();
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
  });
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
    const fieldPath = getFieldPathInput(field);
    if (fieldPath) {
      collectUnknownFieldPathError(fieldPath, `${path}[${index}]`, block, context, errors);
    }
    if (!_.isPlainObject(field)) {
      return;
    }
    collectRelationTitleFieldErrors(field, `${path}[${index}]`, block, context, errors);
    collectRelationPopupResourceErrors(field, `${path}[${index}]`, block, context, errors);
    collectPopupErrors(field.popup, `${path}[${index}].popup`, errors, localKeys, context);
    collectActionListErrors(field.actions, `${path}[${index}].actions`, errors, block, context);
    collectReactionErrors(field.reaction, `${path}[${index}].reaction`, localKeys, errors);
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
      if (popupAssociationField && popupAssociationField !== fieldPath) {
        pushAuthoringError(errors, {
          path: `${popupBlockPath}.resource.associationField`,
          ruleId: 'relation-popup-associated-records-association-field-required',
          message: `flowSurfaces authoring ${popupBlockPath} must use resource.associationField='${fieldPath}'`,
          details: {
            expectedAssociationField: fieldPath,
            actualAssociationField: popupAssociationField,
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
      details: {
        fieldPath,
        titleField,
        targetCollection: getCollectionName(targetCollection),
      },
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
    details: {
      fieldPath,
      titleField,
      targetCollection: getCollectionName(targetCollection),
      availableFields: getCollectionFields(targetCollection)
        .map((field) => String(field?.name || field?.options?.name || '').trim())
        .filter(Boolean),
    },
  });
}

function getResourceBinding(block: any) {
  return String(block?.resource?.binding || block?.binding || '')
    .trim()
    .toLowerCase();
}

function getFieldTargetName(field: any) {
  return String(field?.target || field?.options?.target || '').trim();
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
      message: `flowSurfaces authoring ${path} cannot use relation field '${fieldPath}' itself; use a relation child path such as '${fieldPath}.title'`,
      details: {
        fieldPath,
        fieldName: getFieldName(resolved.field),
      },
    });
    return;
  }
  if (!getFieldInterface(resolved.field) || getFieldFilterable(resolved.field) === false) {
    pushAuthoringError(errors, {
      path,
      ruleId: 'defaultFilter-field-unfilterable',
      message: `flowSurfaces authoring ${path} references field '${fieldPath}' that is not filterable by UI Builder`,
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
  return String(
    block?.collection ||
      block?.resource?.collectionName ||
      resourceInit?.collectionName ||
      context.hostCollectionName ||
      '',
  ).trim();
}

function getBlockDataSourceKey(block: any, context: FlowSurfaceAuthoringValidationContext) {
  const resourceInit = _.isPlainObject(block?.resourceInit) ? block.resourceInit : undefined;
  return (
    String(
      block?.dataSourceKey ||
        block?.resource?.dataSourceKey ||
        resourceInit?.dataSourceKey ||
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

function collectLocalKeys(value: any, keys: Set<string>) {
  if (!_.isPlainObject(value)) {
    return;
  }
  const key = String(value.key || '').trim();
  if (key) {
    keys.add(key);
  }
  _.castArray(value.fields || []).forEach((field) => {
    if (_.isPlainObject(field)) {
      const fieldKey = String(field.key || field.name || field.path || '').trim();
      if (fieldKey) {
        keys.add(fieldKey);
      }
      collectLocalKeys(field.popup, keys);
    }
  });
  _.castArray(value.actions || []).forEach((action) => {
    if (_.isPlainObject(action)) {
      const actionKey = String(action.key || '').trim();
      if (actionKey) {
        keys.add(actionKey);
      }
    }
  });
  _.castArray(value.recordActions || []).forEach((action) => {
    if (_.isPlainObject(action)) {
      const actionKey = String(action.key || '').trim();
      if (actionKey) {
        keys.add(actionKey);
      }
    }
  });
  _.castArray(value.blocks || []).forEach((block) => collectLocalKeys(block, keys));
  _.castArray(value.popup?.blocks || []).forEach((block) => collectLocalKeys(block, keys));
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

function getLayoutCellKey(cell: any): string {
  if (typeof cell === 'string') {
    return cell.trim();
  }
  if (_.isPlainObject(cell)) {
    return String(cell.key || cell.field || cell.name || '').trim();
  }
  return '';
}
