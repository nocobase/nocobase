/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { buildDefinedPayload, normalizeFlowSurfaceComposeKey } from '../service-utils';
import {
  mergeFlowSurfaceDefaultBlockActions,
  type FlowSurfaceDefaultBlockActionDescriptor,
} from '../default-block-actions';
import {
  assertFlowSurfaceConcreteDefaultFilterItem,
  backfillFlowSurfaceFilterActionDefaultFilter,
  normalizeFlowSurfacePublicBlockDefaultFilter,
} from '../public-data-surface-default-filter';
import {
  FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY,
  attachFlowSurfaceApplyBlueprintPopupDefaults,
  buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  type FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
} from './defaults';
import type { FlowSurfaceResourceBindingKey } from '../types';
import type {
  FlowSurfaceApplyBlueprintActionSpec,
  FlowSurfaceApplyBlueprintAssets,
  FlowSurfaceApplyBlueprintBlockResource,
  FlowSurfaceApplyBlueprintBlockSpec,
  FlowSurfaceApplyBlueprintDefaults,
  FlowSurfaceApplyBlueprintDocument,
  FlowSurfaceApplyBlueprintFieldGroupSpec,
  FlowSurfaceApplyBlueprintFieldObjectSpec,
  FlowSurfaceApplyBlueprintLayout,
  FlowSurfaceApplyBlueprintPopup,
  FlowSurfaceApplyBlueprintTabDocument,
} from './public-types';
import {
  assertNonEmptyString,
  assertOnlyAllowedKeys,
  buildApplyBlueprintTabPublicPath,
  buildScopedKey,
  cloneOptionalPlainObject,
  normalizeBlueprintLocalKey,
  readOptionalArray,
  readOptionalString,
  readString,
} from './private-utils';
import {
  assertNoInternalFieldKeys,
  normalizePublicFieldNameList,
  normalizePublicFieldType,
} from '../field-type-resolver';

type FlowSurfaceCompiledBlocks = {
  blocks: any[];
  blockKeysByLocalKey: Map<string, string>;
};

type FlowSurfaceCompiledPopup = {
  popup?: Record<string, any>;
  popupTitle?: string;
};

const APPLY_BLUEPRINT_BLOCK_TYPE_ENUM = [
  'table',
  'calendar',
  'kanban',
  'createForm',
  'editForm',
  'details',
  'filterForm',
  'list',
  'gridCard',
  'markdown',
  'iframe',
  'chart',
  'actionPanel',
  'jsBlock',
  'tree',
] as const;

const APPLY_BLUEPRINT_BLOCK_ALLOWED_KEYS = [
  'key',
  'type',
  'title',
  'collection',
  'dataSourceKey',
  'associationPathName',
  'binding',
  'associationField',
  'resource',
  'template',
  'settings',
  'fields',
  'fieldGroups',
  'fieldsLayout',
  'defaultFilter',
  'actions',
  'recordActions',
  'script',
  'chart',
];

const APPLY_BLUEPRINT_FIELD_ALLOWED_KEYS = [
  'key',
  'field',
  'associationPathName',
  'renderer',
  'type',
  'fieldType',
  'fields',
  'selectorFields',
  'titleField',
  'openMode',
  'popupSize',
  'pageSize',
  'showIndex',
  'label',
  'target',
  'settings',
  'popup',
  'script',
  'chart',
];

const APPLY_BLUEPRINT_FIELD_GROUP_ALLOWED_KEYS = ['key', 'title', 'fields'];
const APPLY_BLUEPRINT_ACTION_ALLOWED_KEYS = ['key', 'type', 'title', 'settings', 'popup', 'script', 'chart'];
const APPLY_BLUEPRINT_POPUP_ALLOWED_KEYS = [
  'title',
  'mode',
  'template',
  'tryTemplate',
  'defaultType',
  'saveAsTemplate',
  'blocks',
  'layout',
];
const APPLY_BLUEPRINT_POPUP_SAVE_AS_TEMPLATE_ALLOWED_KEYS = ['name', 'description', 'local'];
const APPLY_BLUEPRINT_LAYOUT_ALLOWED_KEYS = ['rows'];
const APPLY_BLUEPRINT_LAYOUT_CELL_ALLOWED_KEYS = ['key', 'span'];
const APPLY_BLUEPRINT_BLOCK_RESOURCE_ALLOWED_KEYS = [
  'binding',
  'dataSourceKey',
  'collectionName',
  'associationField',
  'associationName',
  'associationPathName',
  'sourceId',
  'filterByTk',
];
const APPLY_BLUEPRINT_BLOCK_RESOURCE_RAW_ONLY_KEYS = [
  'associationName',
  'associationPathName',
  'sourceId',
  'filterByTk',
];
const APPLY_BLUEPRINT_BLOCK_RESOURCE_SHORTHAND_KEYS = [
  'collection',
  'dataSourceKey',
  'associationPathName',
  'binding',
  'associationField',
];
const APPLY_BLUEPRINT_RECORD_CAPABLE_BLOCK_TYPES = new Set(['table', 'details', 'list', 'gridCard']);
const APPLY_BLUEPRINT_FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details', 'filterForm']);
const APPLY_BLUEPRINT_FIELD_GROUP_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details']);
const APPLY_BLUEPRINT_AUTO_PROMOTED_RECORD_ACTION_TYPES = new Set([
  'view',
  'edit',
  'delete',
  'updateRecord',
  'duplicate',
]);
const APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_TYPES = new Set(['addNew', 'view', 'edit']);
const APPLY_BLUEPRINT_BLOCK_TYPES = new Set<string>(APPLY_BLUEPRINT_BLOCK_TYPE_ENUM);
const APPLY_BLUEPRINT_ADD_CHILD_RECORD_ACTION_ERROR =
  "type 'addChild' must be authored under recordActions and is only valid when the live target catalog.recordActions exposes it for a tree collection table with treeTable enabled";

function assertNoBlockLevelLayout(input: Record<string, any>, context: string) {
  if (Object.prototype.hasOwnProperty.call(input, 'layout')) {
    throwBadRequest(`${context}.layout is not supported; layout is only allowed on tabs[] and popup`);
  }
}

function assertApplyBlueprintFieldsLayoutHost(block: Record<string, any>, context: string) {
  if (!Object.prototype.hasOwnProperty.call(block, 'fieldsLayout')) {
    return;
  }
  if (readOptionalString(block.type) === 'kanban') {
    throwBadRequest(`${context}.fieldsLayout is not supported on kanban main blocks; use fields[] only`);
  }
  if (APPLY_BLUEPRINT_FIELD_GRID_BLOCK_TYPES.has(readOptionalString(block.type) || '')) {
    return;
  }
  throwBadRequest(`${context}.fieldsLayout is only supported on createForm, editForm, details or filterForm`);
}

function assertApplyBlueprintCalendarMainContent(block: Record<string, any>, context: string) {
  if (readOptionalString(block.type) !== 'calendar') {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fields')) {
    throwBadRequest(
      `${context}.fields is not supported on calendar main blocks; add event fields under the quick-create or event-view popup host instead`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fieldGroups')) {
    throwBadRequest(
      `${context}.fieldGroups is not supported on calendar main blocks; add grouped fields under the quick-create or event-view popup host instead`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(block, 'recordActions')) {
    throwBadRequest(
      `${context}.recordActions is not supported on calendar main blocks; configure event actions inside the event-view popup host instead`,
    );
  }
}

function assertApplyBlueprintKanbanMainContent(block: Record<string, any>, context: string) {
  if (readOptionalString(block.type) !== 'kanban') {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fieldGroups')) {
    throwBadRequest(`${context}.fieldGroups is not supported on kanban main blocks; use fields instead`);
  }
  if (Object.prototype.hasOwnProperty.call(block, 'recordActions')) {
    throwBadRequest(`${context}.recordActions is not supported on kanban main blocks in v1`);
  }
}

function assertApplyBlueprintTreeMainContent(block: Record<string, any>, context: string) {
  if (readOptionalString(block.type) !== 'tree') {
    return;
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fields')) {
    throwBadRequest(`${context}.fields is not supported on tree blocks`);
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fieldGroups')) {
    throwBadRequest(`${context}.fieldGroups is not supported on tree blocks`);
  }
  if (Object.prototype.hasOwnProperty.call(block, 'actions')) {
    throwBadRequest(`${context}.actions is not supported on tree blocks`);
  }
  if (Object.prototype.hasOwnProperty.call(block, 'recordActions')) {
    throwBadRequest(`${context}.recordActions is not supported on tree blocks`);
  }
}

function assertApplyBlueprintBlockType(type: string | undefined, context: string) {
  if (!type) {
    return;
  }
  if (type === 'form') {
    throwBadRequest(`${context}.type 'form' is unsupported in applyBlueprint; use 'editForm' or 'createForm'`);
  }
  if (!APPLY_BLUEPRINT_BLOCK_TYPES.has(type)) {
    throwBadRequest(
      `${context}.type '${type}' is unsupported in applyBlueprint; supported types: ${APPLY_BLUEPRINT_BLOCK_TYPE_ENUM.join(
        ', ',
      )}`,
    );
  }
}

function normalizeEditPopupBlocks(
  input: FlowSurfaceApplyBlueprintBlockSpec[],
  context: string,
): FlowSurfaceApplyBlueprintBlockSpec[] {
  input.forEach((block, index) => {
    const blockType = readOptionalString(block?.type);
    if (blockType === 'form') {
      throwBadRequest(`${context}.blocks[${index}].type 'form' is unsupported in applyBlueprint; use 'editForm'`);
    }
  });
  const editFormBlocks = input.filter((block) => readOptionalString(block?.type) === 'editForm');
  if (!editFormBlocks.length) {
    throwBadRequest(`${context} custom edit popup must contain exactly one editForm block`);
  }
  if (editFormBlocks.length > 1) {
    throwBadRequest(`${context} custom edit popup must contain exactly one editForm block`);
  }

  return input.map((block, index) => {
    const blockType = readOptionalString(block?.type);
    if (blockType !== 'editForm') {
      return block;
    }

    if (!_.isPlainObject(block)) {
      return block;
    }

    if (!_.isUndefined(block.resource)) {
      if (_.isPlainObject(block.resource)) {
        const binding = 'binding' in block.resource ? readOptionalString(block.resource.binding) : undefined;
        if (!binding) {
          throwBadRequest(
            `${context}.blocks[${index}].resource must use binding='currentRecord' or be omitted in a custom edit popup`,
          );
        }
        if (binding !== 'currentRecord') {
          throwBadRequest(
            `${context}.blocks[${index}].resource.binding must be 'currentRecord' in a custom edit popup`,
          );
        }
      }
      return block;
    }

    const shorthandBinding = readOptionalString(block.binding);
    if (!_.isUndefined(shorthandBinding)) {
      if (shorthandBinding !== 'currentRecord') {
        throwBadRequest(`${context}.blocks[${index}].binding must be 'currentRecord' in a custom edit popup`);
      }
      return block;
    }

    const hasRawShorthandResource =
      !_.isUndefined(block.collection) ||
      !_.isUndefined(block.dataSourceKey) ||
      !_.isUndefined(block.associationPathName) ||
      !_.isUndefined(block.associationField);
    if (hasRawShorthandResource) {
      throwBadRequest(
        `${context}.blocks[${index}] must use binding='currentRecord' or omit resource entirely in a custom edit popup`,
      );
    }

    return {
      ...block,
      resource: {
        binding: 'currentRecord',
      },
    };
  });
}

function readAssociationFieldFromSingleSegmentPath(value: any, context: string) {
  const associationPathName = readOptionalString(value);
  if (!associationPathName) {
    return undefined;
  }
  const segments = associationPathName
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!segments.length) {
    throwBadRequest(`${context}.associationPathName must be a non-empty association field path`);
  }
  if (segments.length > 1) {
    throwBadRequest(
      `${context}.associationPathName '${associationPathName}' must be a single association field name when used with ${context}.binding; prefer ${context}.associationField for popup relation tables`,
    );
  }
  return segments[0];
}

function normalizeAssociatedRecordsBindingFromAssociationPath(
  input: Record<string, any>,
  context: string,
): {
  binding: FlowSurfaceResourceBindingKey;
  associationField?: string;
} | null {
  const binding = readOptionalString(input.binding) as FlowSurfaceResourceBindingKey | undefined;
  const associationLeaf = readAssociationFieldFromSingleSegmentPath(input.associationPathName, context);
  if (!binding || !associationLeaf) {
    return null;
  }
  if (binding !== 'currentRecord' && binding !== 'associatedRecords') {
    throwBadRequest(
      `${context} cannot mix ${context}.binding='${binding}' with ${context}.associationPathName; use associatedRecords + associationField on popup collection blocks`,
    );
  }
  const associationField = readOptionalString(input.associationField);
  if (associationField && associationField !== associationLeaf) {
    throwBadRequest(
      `${context}.associationField '${associationField}' conflicts with ${context}.associationPathName '${readOptionalString(
        input.associationPathName,
      )}'`,
    );
  }
  return {
    binding: 'associatedRecords',
    associationField: associationField || associationLeaf,
  };
}

function readApplyBlueprintActionType(input: any) {
  if (typeof input === 'string') {
    return readString(input);
  }
  if (_.isPlainObject(input)) {
    return readOptionalString(input.type);
  }
  return undefined;
}

function splitApplyBlueprintBlockActionsByScope(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  context: string,
): {
  actions: any[];
  recordActions: any[];
} {
  const rawActions = readOptionalItems(block.actions, `${context}.actions`);
  const rawRecordActions = readOptionalItems(block.recordActions, `${context}.recordActions`);
  const blockType = readOptionalString(block.type);
  if (!blockType || !APPLY_BLUEPRINT_RECORD_CAPABLE_BLOCK_TYPES.has(blockType)) {
    return {
      actions: rawActions,
      recordActions: rawRecordActions,
    };
  }
  const promotedRecordActions: any[] = [];
  const remainingActions: any[] = [];
  rawActions.forEach((action, index) => {
    const actionType = readApplyBlueprintActionType(action);
    if (actionType === 'addChild') {
      throwBadRequest(`${context}.actions[${index}] ${APPLY_BLUEPRINT_ADD_CHILD_RECORD_ACTION_ERROR}`);
    }
    if (actionType && APPLY_BLUEPRINT_AUTO_PROMOTED_RECORD_ACTION_TYPES.has(actionType)) {
      promotedRecordActions.push(action);
      return;
    }
    remainingActions.push(action);
  });
  return {
    actions: remainingActions,
    recordActions: [...rawRecordActions, ...promotedRecordActions],
  };
}

function resolveAssetSettings(
  settings: any,
  spec: Record<string, any>,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
) {
  const nextSettings = cloneOptionalPlainObject<Record<string, any>>(settings, `${context}.settings`) || {};

  const mergeAsset = (bucket: keyof FlowSurfaceApplyBlueprintAssets, assetKey: any) => {
    const normalizedKey = readOptionalString(assetKey);
    if (!normalizedKey) {
      return;
    }
    const registry = assets[bucket] || {};
    const asset = registry[normalizedKey];
    if (!_.isPlainObject(asset)) {
      throwBadRequest(`${context} ${bucket.slice(0, -1)} asset '${normalizedKey}' is not defined in assets.${bucket}`);
    }
    _.merge(nextSettings, _.cloneDeep(asset));
  };

  mergeAsset('charts', spec.chart);
  mergeAsset('scripts', spec.script);
  return nextSettings;
}

function readOptionalItems<T = any>(value: any, context: string): T[] {
  return readOptionalArray<T>(value, context) || [];
}

function ensureOptionalTemplate(value: any, context: string) {
  return cloneOptionalPlainObject<Record<string, any>>(value, context);
}

function resolvePopupTitleSettings(settings: Record<string, any>, title?: string) {
  if (!title) {
    return settings;
  }
  const nextSettings = _.cloneDeep(settings || {});
  if (_.isUndefined(_.get(nextSettings, ['openView', 'title']))) {
    _.set(nextSettings, ['openView', 'title'], title);
  }
  return nextSettings;
}

function normalizeBlockResourceObject(
  input: Record<string, any>,
  context: string,
): FlowSurfaceApplyBlueprintBlockResource {
  assertOnlyAllowedKeys(input, context, APPLY_BLUEPRINT_BLOCK_RESOURCE_ALLOWED_KEYS);

  const hasBinding = Object.prototype.hasOwnProperty.call(input, 'binding');
  if (hasBinding) {
    const normalizedAssociatedRecords = normalizeAssociatedRecordsBindingFromAssociationPath(input, context);
    const mixedRawKeys = APPLY_BLUEPRINT_BLOCK_RESOURCE_RAW_ONLY_KEYS.filter(
      (key) =>
        Object.prototype.hasOwnProperty.call(input, key) &&
        !(normalizedAssociatedRecords && key === 'associationPathName'),
    );
    if (mixedRawKeys.length) {
      throwBadRequest(
        `${context} cannot mix binding with ${mixedRawKeys.map((key) => `${context}.${key}`).join(', ')}`,
      );
    }
    return buildDefinedPayload({
      binding:
        normalizedAssociatedRecords?.binding ||
        (assertNonEmptyString(input.binding, `${context}.binding`) as FlowSurfaceResourceBindingKey),
      dataSourceKey: readOptionalString(input.dataSourceKey),
      collectionName: readOptionalString(input.collectionName),
      associationField: normalizedAssociatedRecords?.associationField || readOptionalString(input.associationField),
    }) as FlowSurfaceApplyBlueprintBlockResource;
  }

  if (Object.prototype.hasOwnProperty.call(input, 'associationField')) {
    throwBadRequest(`${context}.associationField only works when ${context}.binding is provided`);
  }

  const collectionName = readOptionalString(input.collectionName);
  const normalized = buildDefinedPayload({
    dataSourceKey: readOptionalString(input.dataSourceKey) || (collectionName ? 'main' : undefined),
    collectionName,
    associationName: readOptionalString(input.associationName),
    associationPathName: readOptionalString(input.associationPathName),
    sourceId: input.sourceId,
    filterByTk: input.filterByTk,
  }) as FlowSurfaceApplyBlueprintBlockResource;
  if (!Object.keys(normalized).length) {
    throwBadRequest(`${context} cannot be empty`);
  }
  return normalized;
}

function buildBlockResource(block: FlowSurfaceApplyBlueprintBlockSpec, context: string) {
  if (!_.isUndefined(block.resource)) {
    if (!_.isPlainObject(block.resource)) {
      throwBadRequest(`${context}.resource must be an object`);
    }
    const mixedShorthandKeys = APPLY_BLUEPRINT_BLOCK_RESOURCE_SHORTHAND_KEYS.filter((key) =>
      Object.prototype.hasOwnProperty.call(block, key),
    );
    if (mixedShorthandKeys.length) {
      throwBadRequest(
        `${context} cannot mix resource with ${mixedShorthandKeys.map((key) => `${context}.${key}`).join(', ')}`,
      );
    }
    return normalizeBlockResourceObject(block.resource, `${context}.resource`);
  }

  const binding = readOptionalString(block.binding) as FlowSurfaceResourceBindingKey | undefined;
  if (binding) {
    const normalizedAssociatedRecords = normalizeAssociatedRecordsBindingFromAssociationPath(
      block as Record<string, any>,
      context,
    );
    if (Object.prototype.hasOwnProperty.call(block, 'associationPathName') && !normalizedAssociatedRecords) {
      throwBadRequest(`${context} cannot mix ${context}.binding with ${context}.associationPathName`);
    }
    return buildDefinedPayload({
      binding: normalizedAssociatedRecords?.binding || binding,
      dataSourceKey: readOptionalString(block.dataSourceKey),
      collectionName: readOptionalString(block.collection),
      associationField: normalizedAssociatedRecords?.associationField || readOptionalString(block.associationField),
    });
  }
  if (Object.prototype.hasOwnProperty.call(block, 'associationField')) {
    throwBadRequest(`${context}.associationField only works when ${context}.binding is provided`);
  }
  const collectionName = readOptionalString(block.collection);
  if (!collectionName) {
    return undefined;
  }
  return buildDefinedPayload({
    dataSourceKey: readOptionalString(block.dataSourceKey) || 'main',
    collectionName,
    associationPathName: readOptionalString(block.associationPathName),
  });
}

function ensureLayoutRows(layout: FlowSurfaceApplyBlueprintLayout | undefined, context: string) {
  if (_.isUndefined(layout)) {
    return undefined;
  }
  if (!_.isPlainObject(layout)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertOnlyAllowedKeys(layout, context, APPLY_BLUEPRINT_LAYOUT_ALLOWED_KEYS);
  if (!Array.isArray(layout.rows) || !layout.rows.length) {
    throwBadRequest(`${context}.rows must be a non-empty array`);
  }
  return layout.rows.map((row, rowIndex) => {
    if (!Array.isArray(row) || !row.length) {
      throwBadRequest(`${context}.rows[${rowIndex}] must be a non-empty array`);
    }
    row.forEach((item, itemIndex) => {
      if (typeof item === 'string') {
        return;
      }
      if (!_.isPlainObject(item)) {
        throwBadRequest(`${context}.rows[${rowIndex}][${itemIndex}] must be a string or object`);
      }
      assertOnlyAllowedKeys(
        item,
        `${context}.rows[${rowIndex}][${itemIndex}]`,
        APPLY_BLUEPRINT_LAYOUT_CELL_ALLOWED_KEYS,
      );
    });
    return row;
  });
}

function autoLayoutFromBlockKeys(blockKeys: string[]) {
  return {
    rows: blockKeys.map((key) => [key]),
  };
}

export function collectReferencedBlockKeys(layout: FlowSurfaceApplyBlueprintLayout | undefined, context: string) {
  const referenced = new Set<string>();
  const rows = ensureLayoutRows(layout, context) || [];
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, itemIndex) => {
      if (typeof cell === 'string') {
        const key = readString(cell);
        if (key) {
          referenced.add(key);
        }
        return;
      }
      const key = assertNonEmptyString(cell.key, `${context}.rows[${rowIndex}][${itemIndex}].key`);
      if (key) {
        referenced.add(key);
      }
    });
  });
  return referenced;
}

function compileLayout(
  layout: FlowSurfaceApplyBlueprintLayout | undefined,
  blockKeysByLocalKey: Map<string, string>,
  context: string,
): Record<string, any> | undefined {
  return compileScopedLayout(layout, blockKeysByLocalKey, context, 'block');
}

function resolveScopedLayoutKey(
  rawKey: string,
  keysByLocalKey: Map<string, string>,
  context: string,
  kind: 'block' | 'field',
) {
  const resolved = keysByLocalKey.get(rawKey) || [...keysByLocalKey.values()].find((value) => value === rawKey);
  if (!resolved) {
    throwBadRequest(`${context} references unknown ${kind} '${rawKey}'`);
  }
  return resolved;
}

function compileScopedLayout(
  layout: FlowSurfaceApplyBlueprintLayout | undefined,
  keysByLocalKey: Map<string, string>,
  context: string,
  kind: 'block' | 'field',
): Record<string, any> | undefined {
  const rows = ensureLayoutRows(layout, context);
  if (!rows) {
    return undefined;
  }
  return {
    rows: rows.map((row, rowIndex) => {
      return row.map((item, itemIndex) => {
        const cellContext = `${context}.rows[${rowIndex}][${itemIndex}]`;
        if (typeof item === 'string') {
          const itemKey = readString(item);
          return resolveScopedLayoutKey(itemKey, keysByLocalKey, cellContext, kind);
        }
        const rawKey = assertNonEmptyString(item.key, `${cellContext}.key`);
        const resolved = resolveScopedLayoutKey(rawKey, keysByLocalKey, cellContext, kind);
        return buildDefinedPayload({
          key: resolved,
          span: _.isUndefined(item.span)
            ? undefined
            : _.isNumber(item.span)
              ? item.span
              : throwBadRequest(`${cellContext}.span must be a number`),
        });
      });
    }),
  };
}

function buildCompactFieldLayoutRow(keys: string[], blockType?: string) {
  const normalizedKeys = keys.filter(Boolean);
  if (!normalizedKeys.length) {
    return [];
  }
  if (blockType === 'filterForm') {
    const span = normalizedKeys.length === 1 ? 24 : normalizedKeys.length === 2 ? 12 : 8;
    return normalizedKeys.map((key) => ({ key, span }));
  }
  if (normalizedKeys.length === 1) {
    return [{ key: normalizedKeys[0], span: 24 }];
  }
  return normalizedKeys.map((key) => ({ key, span: 12 }));
}

function buildAutoCompiledFieldsLayout(fields: Array<Record<string, any>>, blockType?: string) {
  if (!APPLY_BLUEPRINT_FIELD_GRID_BLOCK_TYPES.has(blockType || '') || !fields.length) {
    return undefined;
  }

  const rows: Array<Array<{ key: string; span: number }>> = [];
  const chunkSize = blockType === 'filterForm' ? 3 : 2;
  let pendingKeys: string[] = [];

  const flushPending = () => {
    if (!pendingKeys.length) {
      return;
    }
    rows.push(buildCompactFieldLayoutRow(pendingKeys, blockType));
    pendingKeys = [];
  };

  fields.forEach((field) => {
    const key = readOptionalString(field?.key);
    if (!key) {
      return;
    }
    if (readOptionalString(field?.type) === 'divider') {
      flushPending();
      rows.push([{ key, span: 24 }]);
      return;
    }
    pendingKeys.push(key);
    if (pendingKeys.length >= chunkSize) {
      flushPending();
    }
  });

  flushPending();
  return rows.length ? { rows } : undefined;
}

function compileFieldGroups(
  fieldGroups: FlowSurfaceApplyBlueprintFieldGroupSpec[],
  context: string,
): Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec> {
  const expanded: Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec> = [];

  fieldGroups.forEach((group, groupIndex) => {
    const groupContext = `${context}[${groupIndex}]`;
    if (!_.isPlainObject(group)) {
      throwBadRequest(`${groupContext} must be an object`);
    }
    assertOnlyAllowedKeys(group, groupContext, APPLY_BLUEPRINT_FIELD_GROUP_ALLOWED_KEYS);
    const title = assertNonEmptyString(group.title, `${groupContext}.title`);
    const groupFields = readOptionalItems(group.fields, `${groupContext}.fields`);
    if (!groupFields.length) {
      throwBadRequest(`${groupContext}.fields must be a non-empty array`);
    }

    const groupLocalKey = normalizeBlueprintLocalKey(
      group.key,
      title || `group_${groupIndex + 1}`,
      `${groupContext}.key`,
    );
    expanded.push({
      key: `${groupLocalKey}_divider`,
      type: 'divider',
      settings: {
        label: title,
        orientation: 'left',
      },
    });
    expanded.push(...groupFields);
  });

  return expanded;
}

function resolveBlockFieldInputs(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  context: string,
): Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec> {
  const hasFields = Object.prototype.hasOwnProperty.call(block, 'fields');
  const hasFieldGroups = Object.prototype.hasOwnProperty.call(block, 'fieldGroups');
  if (hasFields && hasFieldGroups) {
    throwBadRequest(`${context} cannot mix fields with fieldGroups`);
  }
  if (!hasFieldGroups) {
    return readOptionalItems(block.fields, `${context}.fields`);
  }

  const blockType = readOptionalString(block.type);
  if (!APPLY_BLUEPRINT_FIELD_GROUP_BLOCK_TYPES.has(blockType || '')) {
    throwBadRequest(`${context}.fieldGroups is only supported on createForm, editForm or details`);
  }
  if (Object.prototype.hasOwnProperty.call(block, 'fieldsLayout')) {
    throwBadRequest(`${context}.fieldsLayout cannot be combined with ${context}.fieldGroups`);
  }

  const fieldGroups = readOptionalArray<FlowSurfaceApplyBlueprintFieldGroupSpec>(
    block.fieldGroups,
    `${context}.fieldGroups`,
  );
  if (!fieldGroups?.length) {
    throwBadRequest(`${context}.fieldGroups must be a non-empty array`);
  }
  return compileFieldGroups(fieldGroups, `${context}.fieldGroups`);
}

function resolveApplyBlueprintFieldLocalKey(
  input: string | FlowSurfaceApplyBlueprintFieldObjectSpec,
  index: number,
  context: string,
) {
  if (typeof input === 'string') {
    return assertNonEmptyString(input, `${context}[${index}]`);
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context}[${index}] must be a string or object`);
  }
  const fieldPath = readOptionalString(input.field);
  const syntheticType = readOptionalString(input.type);
  if (!fieldPath && !syntheticType) {
    throwBadRequest(`${context}[${index}] requires field or type`);
  }
  if (fieldPath && syntheticType) {
    throwBadRequest(`${context}[${index}] cannot mix field with synthetic type`);
  }
  return normalizeBlueprintLocalKey(
    input.key,
    fieldPath || (syntheticType ? `${syntheticType}_${index + 1}` : `field_${index + 1}`),
    `${context}[${index}].key`,
  );
}

function buildCompiledFieldKeyMap(
  inputs: Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec>,
  compiledFields: Array<Record<string, any>>,
  context: string,
) {
  const fieldKeysByLocalKey = new Map<string, string>();
  inputs.forEach((input, index) => {
    const localKey = resolveApplyBlueprintFieldLocalKey(input, index, context);
    const compiledKey = readOptionalString(compiledFields[index]?.key);
    if (!compiledKey) {
      throwBadRequest(`${context}[${index}] key '${localKey}' is missing after field key compilation`);
    }
    if (fieldKeysByLocalKey.has(localKey)) {
      throwBadRequest(`${context}[${index}] key '${localKey}' is duplicated`);
    }
    fieldKeysByLocalKey.set(localKey, compiledKey);
  });
  return fieldKeysByLocalKey;
}

function shouldAttachDefaultPopupMetadata(
  popup: FlowSurfaceApplyBlueprintPopup | undefined,
  itemType?: string,
  options: { autoRelationField?: boolean } = {},
) {
  return (
    !_.isUndefined(popup) || options.autoRelationField || APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_TYPES.has(itemType || '')
  );
}

function attachCompiledPopupDefaults(
  popup: Record<string, any> | undefined,
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
) {
  return attachFlowSurfaceApplyBlueprintPopupDefaults(popup, metadata);
}

function compilePopup(
  popup: FlowSurfaceApplyBlueprintPopup | undefined,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
  options: {
    ownerActionType?: string;
  } = {},
): FlowSurfaceCompiledPopup {
  if (_.isUndefined(popup)) {
    return {};
  }
  if (!_.isPlainObject(popup)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertOnlyAllowedKeys(popup, context, APPLY_BLUEPRINT_POPUP_ALLOWED_KEYS);
  const popupTitle = readOptionalString(popup.title);
  const template = ensureOptionalTemplate(popup.template, `${context}.template`);
  const tryTemplate = _.isUndefined(popup.tryTemplate)
    ? undefined
    : _.isBoolean(popup.tryTemplate)
      ? popup.tryTemplate
      : throwBadRequest(`${context}.tryTemplate must be a boolean`);
  const defaultType = _.isUndefined(popup.defaultType)
    ? undefined
    : popup.defaultType === 'view' || popup.defaultType === 'edit'
      ? popup.defaultType
      : throwBadRequest(`${context}.defaultType must be 'view' or 'edit'`);
  const saveAsTemplate = _.isUndefined(popup.saveAsTemplate)
    ? undefined
    : _.isPlainObject(popup.saveAsTemplate)
      ? (assertOnlyAllowedKeys(
          popup.saveAsTemplate,
          `${context}.saveAsTemplate`,
          APPLY_BLUEPRINT_POPUP_SAVE_AS_TEMPLATE_ALLOWED_KEYS,
        ),
        {
          name: assertNonEmptyString(popup.saveAsTemplate.name, `${context}.saveAsTemplate.name`),
          description: assertNonEmptyString(popup.saveAsTemplate.description, `${context}.saveAsTemplate.description`),
          local: readOptionalString(popup.saveAsTemplate.local),
        })
      : throwBadRequest(`${context}.saveAsTemplate must be an object`);
  if (saveAsTemplate && template) {
    throwBadRequest(`${context}.saveAsTemplate cannot be combined with ${context}.template`);
  }
  if (template) {
    return {
      popup: {
        template,
      },
      popupTitle,
    };
  }
  const rawPopupBlocks = readOptionalItems<FlowSurfaceApplyBlueprintBlockSpec>(popup.blocks, `${context}.blocks`);
  const popupBlocks =
    options.ownerActionType === 'edit' && rawPopupBlocks.length
      ? normalizeEditPopupBlocks(rawPopupBlocks, context)
      : rawPopupBlocks;
  if (saveAsTemplate && !popupBlocks.length && tryTemplate !== true) {
    throwBadRequest(`${context}.saveAsTemplate requires explicit popup.blocks`);
  }
  const compiledBlocks = popupBlocks.length
    ? compileBlocks(
        popupBlocks,
        scopePrefix,
        assets,
        `${context}.blocks`,
        defaults,
        collectReferencedBlockKeys(popup.layout, `${context}.layout`),
      )
    : { blocks: [], blockKeysByLocalKey: new Map<string, string>() };
  const layout =
    popupBlocks.length || popup.layout
      ? compileLayout(
          popup.layout || autoLayoutFromBlockKeys(compiledBlocks.blocks.map((block: any) => block.key)),
          compiledBlocks.blockKeysByLocalKey,
          `${context}.layout`,
        )
      : undefined;
  const popupMode = readOptionalString(popup.mode) as 'replace' | 'append' | undefined;
  if (popupMode && popupMode !== 'replace' && popupMode !== 'append') {
    throwBadRequest(`${context}.mode must be 'replace' or 'append'`);
  }
  const compiledPopup = buildDefinedPayload({
    mode: popupMode || (popupBlocks.length || template || layout ? 'replace' : undefined),
    template,
    ...(tryTemplate ? { tryTemplate: true } : {}),
    ...(defaultType ? { defaultType } : {}),
    ...(saveAsTemplate ? { saveAsTemplate } : {}),
    blocks: compiledBlocks.blocks.length ? compiledBlocks.blocks : undefined,
    layout,
  });
  return {
    popup: Object.keys(compiledPopup).length ? compiledPopup : {},
    popupTitle,
  };
}

function resolveTargetBlockKey(value: any, localBlockKeys: Map<string, string>, context: string): string | undefined {
  if (_.isUndefined(value) || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'string') {
    const normalized = readString(value);
    return localBlockKeys.get(normalized) || normalized;
  }
  throwBadRequest(`${context} must be a string block key`);
}

function collectTreeConnectTargetKeys(settings: any, context: string) {
  if (!_.isPlainObject(settings?.connectFields)) {
    return [];
  }
  if (_.isUndefined(settings.connectFields.targets)) {
    return [];
  }
  if (!Array.isArray(settings.connectFields.targets)) {
    throwBadRequest(`${context}.settings.connectFields.targets must be an array`);
  }
  const seenTargets = new Set<string>();
  return settings.connectFields.targets
    .map((target: any, targetIndex: number) => {
      if (!_.isPlainObject(target)) {
        throwBadRequest(`${context}.settings.connectFields.targets[${targetIndex}] must be an object`);
      }
      if (_.isUndefined(target.target) || target.target === null || target.target === '') {
        return '';
      }
      if (typeof target.target !== 'string') {
        throwBadRequest(`${context}.settings.connectFields.targets[${targetIndex}].target must be a string block key`);
      }
      const normalizedTarget = normalizeFlowSurfaceComposeKey(
        target.target,
        `${context}.settings.connectFields.targets[${targetIndex}].target`,
      );
      if (seenTargets.has(normalizedTarget)) {
        throwBadRequest(
          `${context}.settings.connectFields.targets[${targetIndex}].target duplicate target '${normalizedTarget}' in tree connectFields`,
        );
      }
      seenTargets.add(normalizedTarget);
      return normalizedTarget;
    })
    .filter(Boolean);
}

function compileTreeConnectSettingsTargets(
  settings: Record<string, any>,
  localBlockKeys: Map<string, string>,
  context: string,
) {
  if (!_.isPlainObject(settings?.connectFields) || !Array.isArray(settings.connectFields.targets)) {
    return settings;
  }
  const nextSettings = _.cloneDeep(settings);
  nextSettings.connectFields.targets = nextSettings.connectFields.targets.map((target: any, targetIndex: number) => {
    if (!_.isPlainObject(target) || _.isUndefined(target.target) || target.target === null || target.target === '') {
      return target;
    }
    return {
      ...target,
      target: resolveTargetBlockKey(
        target.target,
        localBlockKeys,
        `${context}.settings.connectFields.targets[${targetIndex}].target`,
      ),
    };
  });
  return nextSettings;
}

function compileField(
  input: string | FlowSurfaceApplyBlueprintFieldObjectSpec,
  index: number,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  localBlockKeys: Map<string, string>,
  context: string,
  popupDefaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
) {
  if (typeof input === 'string') {
    const fieldPath = assertNonEmptyString(input, `${context}[${index}]`);
    return {
      key: normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, fieldPath), `${context}[${index}]`),
      fieldPath,
      __autoPopupForRelationField: true,
      ...(popupDefaultsMetadata
        ? { [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: _.cloneDeep(popupDefaultsMetadata) }
        : {}),
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context}[${index}] must be a string or object`);
  }
  assertOnlyAllowedKeys(input, `${context}[${index}]`, APPLY_BLUEPRINT_FIELD_ALLOWED_KEYS);
  assertNoInternalFieldKeys(input, `${context}[${index}]`);
  assertNoInternalFieldKeys(input.settings, `${context}[${index}].settings`);
  const fieldPath = readOptionalString(input.field);
  const syntheticType = readOptionalString(input.type);
  const fieldType = normalizePublicFieldType((input as any).fieldType, `${context}[${index}]`);
  const fields = normalizePublicFieldNameList((input as any).fields, `${context}[${index}].fields`);
  const selectorFields = normalizePublicFieldNameList(
    (input as any).selectorFields,
    `${context}[${index}].selectorFields`,
  );
  if (!fieldPath && !syntheticType) {
    throwBadRequest(`${context}[${index}] requires field or type`);
  }
  if (fieldPath && syntheticType) {
    throwBadRequest(`${context}[${index}] cannot mix field with synthetic type`);
  }
  const localKey = normalizeBlueprintLocalKey(
    input.key,
    fieldPath || (syntheticType ? `${syntheticType}_${index + 1}` : `field_${index + 1}`),
    `${context}[${index}].key`,
  );
  const key = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, localKey), `${context}[${index}]`);
  let settings = resolveAssetSettings(input.settings, input, assets, `${context}[${index}]`);
  if (readOptionalString(input.label) && _.isUndefined(settings.label)) {
    settings.label = readOptionalString(input.label);
  }
  const popupResult = compilePopup(input.popup, `${key}.popup`, assets, `${context}[${index}].popup`, defaults);
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  const popup = shouldAttachDefaultPopupMetadata(input.popup, undefined)
    ? attachCompiledPopupDefaults(popupResult.popup, popupDefaultsMetadata)
    : popupResult.popup;
  return buildDefinedPayload({
    key,
    fieldPath,
    associationPathName: readOptionalString(input.associationPathName),
    renderer: readOptionalString(input.renderer),
    type: syntheticType,
    fieldType,
    fields,
    selectorFields,
    titleField: readOptionalString((input as any).titleField),
    openMode: readOptionalString((input as any).openMode),
    popupSize: readOptionalString((input as any).popupSize),
    pageSize: (input as any).pageSize,
    showIndex: (input as any).showIndex,
    target: resolveTargetBlockKey(input.target, localBlockKeys, `${context}[${index}].target`),
    settings: Object.keys(settings).length ? settings : undefined,
    popup,
  });
}

function compileAction(
  input: FlowSurfaceApplyBlueprintActionSpec,
  index: number,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  popupDefaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
) {
  if (typeof input === 'string') {
    const type = assertNonEmptyString(input, `${context}[${index}]`);
    return {
      key: normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, `${type}_${index + 1}`), `${context}[${index}]`),
      type,
      ...(APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_TYPES.has(type)
        ? { popup: attachCompiledPopupDefaults(undefined, popupDefaultsMetadata) }
        : {}),
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context}[${index}] must be a string or object`);
  }
  assertOnlyAllowedKeys(input, `${context}[${index}]`, APPLY_BLUEPRINT_ACTION_ALLOWED_KEYS);
  const type = assertNonEmptyString(input.type, `${context}[${index}].type`);
  const localKey = normalizeBlueprintLocalKey(input.key, `${type}_${index + 1}`, `${context}[${index}].key`);
  const key = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, localKey), `${context}[${index}]`);
  let settings = resolveAssetSettings(input.settings, input, assets, `${context}[${index}]`);
  if (readOptionalString(input.title) && _.isUndefined(settings.title)) {
    settings.title = readOptionalString(input.title);
  }
  const popupResult = compilePopup(input.popup, `${key}.popup`, assets, `${context}[${index}].popup`, defaults, {
    ownerActionType: type,
  });
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  const popup = shouldAttachDefaultPopupMetadata(input.popup, type)
    ? attachCompiledPopupDefaults(popupResult.popup, popupDefaultsMetadata)
    : popupResult.popup;
  return buildDefinedPayload({
    key,
    type,
    settings: Object.keys(settings).length ? settings : undefined,
    popup,
  });
}

function compileInjectedDefaultAction(
  descriptor: FlowSurfaceDefaultBlockActionDescriptor,
  scopePrefix: string,
  context: string,
  index: number,
  popupDefaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
) {
  const descriptorPopup = descriptor.popup ? _.cloneDeep(descriptor.popup) : undefined;
  const popup = shouldAttachDefaultPopupMetadata(descriptorPopup, descriptor.type)
    ? attachCompiledPopupDefaults(descriptorPopup, popupDefaultsMetadata)
    : undefined;
  return buildDefinedPayload({
    key: normalizeFlowSurfaceComposeKey(
      buildScopedKey(scopePrefix, `${descriptor.type}_default_${index + 1}`),
      `${context}[${index}]`,
    ),
    type: descriptor.type,
    popup,
  });
}

function compileBlocks(
  input: FlowSurfaceApplyBlueprintBlockSpec[],
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
  requiredExplicitBlockKeys: Set<string> = new Set(),
): FlowSurfaceCompiledBlocks {
  const blockKeysByLocalKey = new Map<string, string>();
  const referencedBlockKeys = new Set<string>(requiredExplicitBlockKeys);
  const rawBlocks = _.castArray(input || []);
  const popupDefaultsMetadata = buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata(defaults);

  rawBlocks.forEach((block, index) => {
    if (!_.isPlainObject(block)) {
      throwBadRequest(`${context}[${index}] must be an object`);
    }
    assertApplyBlueprintCalendarMainContent(block, `${context}[${index}]`);
    assertApplyBlueprintKanbanMainContent(block, `${context}[${index}]`);
    assertApplyBlueprintTreeMainContent(block, `${context}[${index}]`);
    const fields = resolveBlockFieldInputs(block, `${context}[${index}]`);
    collectTreeConnectTargetKeys(block.settings, `${context}[${index}]`).forEach((targetKey) => {
      referencedBlockKeys.add(targetKey);
    });
    fields.forEach((field: any, fieldIndex: number) => {
      if (typeof field?.target !== 'string' || !field.target.trim()) {
        return;
      }
      referencedBlockKeys.add(
        normalizeFlowSurfaceComposeKey(field.target, `${context}[${index}].fields[${fieldIndex}].target`),
      );
    });
  });

  rawBlocks.forEach((block, index) => {
    if (!_.isPlainObject(block)) {
      throwBadRequest(`${context}[${index}] must be an object`);
    }
    assertNoBlockLevelLayout(block, `${context}[${index}]`);
    assertApplyBlueprintFieldsLayoutHost(block, `${context}[${index}]`);
    assertOnlyAllowedKeys(block, `${context}[${index}]`, APPLY_BLUEPRINT_BLOCK_ALLOWED_KEYS);
    assertApplyBlueprintBlockType(readOptionalString(block.type), `${context}[${index}]`);
    assertApplyBlueprintCalendarMainContent(block, `${context}[${index}]`);
    assertApplyBlueprintKanbanMainContent(block, `${context}[${index}]`);
    assertApplyBlueprintTreeMainContent(block, `${context}[${index}]`);
    const explicitKey = readString(block.key);
    const fallback = block.type ? `${block.type}_${index + 1}` : `block_${index + 1}`;
    const localKey = normalizeBlueprintLocalKey(block.key, fallback, `${context}[${index}].key`);
    if (!explicitKey && referencedBlockKeys.has(localKey)) {
      throwBadRequest(
        `${context}[${index}] must provide key explicitly because it is referenced by layout or field.target`,
      );
    }
    if (blockKeysByLocalKey.has(localKey)) {
      throwBadRequest(`${context}[${index}] key '${localKey}' is duplicated`);
    }
    const key = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, localKey), `${context}[${index}]`);
    blockKeysByLocalKey.set(localKey, key);
  });

  const blocks = rawBlocks.map((block, index) => {
    const blockContext = `${context}[${index}]`;
    const localKey = normalizeBlueprintLocalKey(
      block.key,
      block.type ? `${block.type}_${index + 1}` : `block_${index + 1}`,
      `${blockContext}.key`,
    );
    const key = blockKeysByLocalKey.get(localKey);
    if (!key) {
      throwBadRequest(`${blockContext} key '${localKey}' is missing after block key compilation`);
    }
    const settings = resolveAssetSettings(block.settings, block, assets, blockContext);
    if (readOptionalString(block.title) && _.isUndefined(settings.title)) {
      settings.title = readOptionalString(block.title);
    }
    const blockType = readOptionalString(block.type);
    const template = ensureOptionalTemplate(block.template, `${blockContext}.template`);
    const blockDefaultFilter = normalizeFlowSurfacePublicBlockDefaultFilter('applyBlueprint', block.defaultFilter, {
      blockType,
      template,
      path: blockContext,
    });
    if (!_.isUndefined(blockDefaultFilter)) {
      assertFlowSurfaceConcreteDefaultFilterItem('applyBlueprint', blockDefaultFilter, {
        path: blockContext,
      });
    }
    const fieldInputs = resolveBlockFieldInputs(block, blockContext);
    const fields = fieldInputs.map((field, fieldIndex) =>
      compileField(
        field,
        fieldIndex,
        key,
        assets,
        blockKeysByLocalKey,
        `${blockContext}.fields`,
        popupDefaultsMetadata,
        defaults,
      ),
    );
    const fieldsLayout = Object.prototype.hasOwnProperty.call(block, 'fieldsLayout')
      ? compileScopedLayout(
          _.isUndefined(block.fieldsLayout)
            ? undefined
            : _.isPlainObject(block.fieldsLayout)
              ? (block.fieldsLayout as FlowSurfaceApplyBlueprintLayout)
              : throwBadRequest(`${blockContext}.fieldsLayout must be an object`),
          buildCompiledFieldKeyMap(fieldInputs, fields, `${blockContext}.fields`),
          `${blockContext}.fieldsLayout`,
          'field',
        )
      : buildAutoCompiledFieldsLayout(fields, readOptionalString(block.type));
    const { actions, recordActions } = splitApplyBlueprintBlockActionsByScope(block, blockContext);
    const explicitActions = actions.map((action, actionIndex) =>
      compileAction(action, actionIndex, key, assets, `${blockContext}.actions`, popupDefaultsMetadata, defaults),
    );
    const explicitRecordActions = recordActions.map((action, actionIndex) =>
      compileAction(action, actionIndex, key, assets, `${blockContext}.recordActions`, popupDefaultsMetadata, defaults),
    );
    const injectedActionIndexes = {
      actions: explicitActions.length,
      recordActions: explicitRecordActions.length,
    };
    const mergedActions = mergeFlowSurfaceDefaultBlockActions({
      blockType,
      template,
      actions: explicitActions,
      recordActions: explicitRecordActions,
      createAction: (descriptor) =>
        compileInjectedDefaultAction(
          descriptor,
          key,
          `${blockContext}.${descriptor.scope}`,
          injectedActionIndexes[descriptor.scope]++,
          popupDefaultsMetadata,
        ),
    });
    const actionsWithDefaultFilter = backfillFlowSurfaceFilterActionDefaultFilter(
      mergedActions.actions,
      blockDefaultFilter,
    );
    return buildDefinedPayload({
      key,
      type: blockType,
      resource: buildBlockResource(block, blockContext),
      template,
      settings: Object.keys(settings).length
        ? compileTreeConnectSettingsTargets(settings, blockKeysByLocalKey, blockContext)
        : undefined,
      fields: blockType === 'calendar' || blockType === 'tree' ? undefined : fields,
      fieldsLayout:
        blockType === 'calendar' || blockType === 'kanban' || blockType === 'tree' ? undefined : fieldsLayout,
      actions: blockType === 'tree' ? undefined : actionsWithDefaultFilter,
      recordActions:
        blockType === 'calendar' || blockType === 'kanban' || blockType === 'tree'
          ? undefined
          : mergedActions.recordActions,
    });
  });

  return {
    blocks,
    blockKeysByLocalKey,
  };
}

export function compileTabComposeValues(
  tab: FlowSurfaceApplyBlueprintTabDocument,
  document: FlowSurfaceApplyBlueprintDocument,
  tabIndex: number,
  options: {
    mode: 'append' | 'replace';
  },
) {
  const tabPublicPath = buildApplyBlueprintTabPublicPath(tabIndex);
  const blocksPath = `${tabPublicPath}.blocks`;
  const layoutPath = `${tabPublicPath}.layout`;
  const compiledBlocks = compileBlocks(
    tab.blocks,
    tab.key,
    document.assets,
    blocksPath,
    document.defaults,
    collectReferencedBlockKeys(tab.layout, layoutPath),
  );
  const layout = compileLayout(
    tab.layout || autoLayoutFromBlockKeys(compiledBlocks.blocks.map((block) => block.key)),
    compiledBlocks.blockKeysByLocalKey,
    layoutPath,
  );
  return buildDefinedPayload({
    mode: options.mode,
    blocks: compiledBlocks.blocks,
    layout,
  });
}
