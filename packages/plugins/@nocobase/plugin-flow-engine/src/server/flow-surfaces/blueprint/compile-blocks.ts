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
import type { FlowSurfaceResourceBindingKey } from '../types';
import type {
  FlowSurfaceApplyBlueprintActionSpec,
  FlowSurfaceApplyBlueprintAssets,
  FlowSurfaceApplyBlueprintBlockResource,
  FlowSurfaceApplyBlueprintBlockSpec,
  FlowSurfaceApplyBlueprintDocument,
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
  'label',
  'target',
  'settings',
  'popup',
  'script',
  'chart',
];

const APPLY_BLUEPRINT_ACTION_ALLOWED_KEYS = ['key', 'type', 'title', 'settings', 'popup', 'script', 'chart'];
const APPLY_BLUEPRINT_POPUP_ALLOWED_KEYS = ['title', 'mode', 'template', 'blocks', 'layout'];
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
const APPLY_BLUEPRINT_AUTO_PROMOTED_RECORD_ACTION_TYPES = new Set([
  'view',
  'edit',
  'delete',
  'updateRecord',
  'duplicate',
]);
const APPLY_BLUEPRINT_BLOCK_TYPES = new Set<string>(APPLY_BLUEPRINT_BLOCK_TYPE_ENUM);
const APPLY_BLUEPRINT_ADD_CHILD_RECORD_ACTION_ERROR =
  "type 'addChild' must be authored under recordActions and is only valid when the live target catalog.recordActions exposes it for a tree collection table with treeTable enabled";

function assertNoBlockLevelLayout(input: Record<string, any>, context: string) {
  if (Object.prototype.hasOwnProperty.call(input, 'layout')) {
    throwBadRequest(`${context}.layout is not supported; layout is only allowed on tabs[] and popup`);
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
  const rows = ensureLayoutRows(layout, context);
  if (!rows) {
    return undefined;
  }
  return {
    rows: rows.map((row, rowIndex) => {
      return row.map((item, itemIndex) => {
        if (typeof item === 'string') {
          const itemKey = readString(item);
          const resolved =
            blockKeysByLocalKey.get(itemKey) || [...blockKeysByLocalKey.values()].find((value) => value === itemKey);
          if (!resolved) {
            throwBadRequest(`${context}.rows[${rowIndex}][${itemIndex}] references unknown block '${item}'`);
          }
          return resolved;
        }
        const rawKey = assertNonEmptyString(item.key, `${context}.rows[${rowIndex}][${itemIndex}].key`);
        const resolved =
          blockKeysByLocalKey.get(rawKey) ||
          [...blockKeysByLocalKey.values()].find((value) => value === rawKey) ||
          rawKey;
        return buildDefinedPayload({
          key: resolved,
          span: _.isUndefined(item.span)
            ? undefined
            : _.isNumber(item.span)
              ? item.span
              : throwBadRequest(`${context}.rows[${rowIndex}][${itemIndex}].span must be a number`),
        });
      });
    }),
  };
}

function compilePopup(
  popup: FlowSurfaceApplyBlueprintPopup | undefined,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
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
  const compiledBlocks = popupBlocks.length
    ? compileBlocks(
        popupBlocks,
        scopePrefix,
        assets,
        `${context}.blocks`,
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

function compileField(
  input: string | FlowSurfaceApplyBlueprintFieldObjectSpec,
  index: number,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  localBlockKeys: Map<string, string>,
  context: string,
) {
  if (typeof input === 'string') {
    const fieldPath = assertNonEmptyString(input, `${context}[${index}]`);
    return {
      key: normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, fieldPath), `${context}[${index}]`),
      fieldPath,
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context}[${index}] must be a string or object`);
  }
  assertOnlyAllowedKeys(input, `${context}[${index}]`, APPLY_BLUEPRINT_FIELD_ALLOWED_KEYS);
  const fieldPath = readOptionalString(input.field);
  const syntheticType = readOptionalString(input.type);
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
  const popupResult = compilePopup(input.popup, `${key}.popup`, assets, `${context}[${index}].popup`);
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  return buildDefinedPayload({
    key,
    fieldPath,
    associationPathName: readOptionalString(input.associationPathName),
    renderer: readOptionalString(input.renderer),
    type: syntheticType,
    target: resolveTargetBlockKey(input.target, localBlockKeys, `${context}[${index}].target`),
    settings: Object.keys(settings).length ? settings : undefined,
    popup: popupResult.popup,
  });
}

function compileAction(
  input: FlowSurfaceApplyBlueprintActionSpec,
  index: number,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
) {
  if (typeof input === 'string') {
    const type = assertNonEmptyString(input, `${context}[${index}]`);
    return {
      key: normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, `${type}_${index + 1}`), `${context}[${index}]`),
      type,
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
  const popupResult = compilePopup(input.popup, `${key}.popup`, assets, `${context}[${index}].popup`, {
    ownerActionType: type,
  });
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  return buildDefinedPayload({
    key,
    type,
    settings: Object.keys(settings).length ? settings : undefined,
    popup: popupResult.popup,
  });
}

function compileBlocks(
  input: FlowSurfaceApplyBlueprintBlockSpec[],
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  requiredExplicitBlockKeys: Set<string> = new Set(),
): FlowSurfaceCompiledBlocks {
  const blockKeysByLocalKey = new Map<string, string>();
  const referencedBlockKeys = new Set<string>(requiredExplicitBlockKeys);
  const rawBlocks = _.castArray(input || []);

  rawBlocks.forEach((block, index) => {
    if (!_.isPlainObject(block)) {
      throwBadRequest(`${context}[${index}] must be an object`);
    }
    const fields = readOptionalItems(block?.fields, `${context}[${index}].fields`);
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
    assertOnlyAllowedKeys(block, `${context}[${index}]`, APPLY_BLUEPRINT_BLOCK_ALLOWED_KEYS);
    assertApplyBlueprintBlockType(readOptionalString(block.type), `${context}[${index}]`);
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
    const template = ensureOptionalTemplate(block.template, `${blockContext}.template`);
    const fields = readOptionalItems(block.fields, `${blockContext}.fields`);
    const { actions, recordActions } = splitApplyBlueprintBlockActionsByScope(block, blockContext);
    return buildDefinedPayload({
      key,
      type: readOptionalString(block.type),
      resource: buildBlockResource(block, blockContext),
      template,
      settings: Object.keys(settings).length ? settings : undefined,
      fields: fields.map((field, fieldIndex) =>
        compileField(field, fieldIndex, key, assets, blockKeysByLocalKey, `${blockContext}.fields`),
      ),
      actions: actions.map((action, actionIndex) =>
        compileAction(action, actionIndex, key, assets, `${blockContext}.actions`),
      ),
      recordActions: recordActions.map((action, actionIndex) =>
        compileAction(action, actionIndex, key, assets, `${blockContext}.recordActions`),
      ),
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
