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
import { normalizeFieldPath } from '../service-helpers';
import type {
  FlowSurfaceBlueprintDsl,
  FlowSurfaceDslAction,
  FlowSurfaceDslBlock,
  FlowSurfaceDslDataSource,
  FlowSurfaceDslDocument,
  FlowSurfaceDslEntityRef,
  FlowSurfaceDslField,
  FlowSurfacePatchDsl,
  FlowSurfacePatchDslChange,
} from './types';
import {
  buildFlowSurfaceDslActionRef,
  buildFlowSurfaceDslFieldRef,
  FLOW_SURFACE_DSL_PATCH_SURFACE_DEFAULT_TARGET_OPS,
  isFlowSurfaceDslDefaultCrudActionType,
} from './utils';

const FLOW_SURFACE_DSL_PATCH_OPS = new Set([
  'page.destroy',
  'tab.add',
  'tab.update',
  'tab.move',
  'tab.remove',
  'block.add',
  'field.add',
  'action.add',
  'recordAction.add',
  'settings.update',
  'layout.replace',
  'node.move',
  'node.remove',
  'template.detach',
]);
function hasLocatorValue(locator: any) {
  return ['uid', 'pageSchemaUid', 'tabSchemaUid', 'routeId'].some((key) => {
    const value = locator?.[key];
    return !_.isNil(value) && String(value).trim() !== '';
  });
}

function assertNonEmptyString(value: any, context: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throwBadRequest(`${context} must be a non-empty string`);
  }
}

function hasOwn(input: any, key: string) {
  return !!input && Object.prototype.hasOwnProperty.call(input, key);
}

function assertDslEntityRef(entityRef: any, context: string) {
  if (!_.isPlainObject(entityRef)) {
    throwBadRequest(`${context} must be an object`);
  }
  if (typeof entityRef.id === 'string' && entityRef.id.trim()) {
    if (!_.isUndefined(entityRef.anchor) && (typeof entityRef.anchor !== 'string' || !entityRef.anchor.trim())) {
      throwBadRequest(`${context}.anchor must be a non-empty string when provided`);
    }
    return;
  }
  if (_.isPlainObject(entityRef.locator) && hasLocatorValue(entityRef.locator)) {
    return;
  }
  throwBadRequest(`${context} must be either { id } or { locator }`);
}

function validateBlueprintDataSource(
  dataSource: FlowSurfaceDslDataSource,
  index: number,
  popupIds: Set<string>,
  seenKeys: Set<string>,
) {
  const context = `flowSurfaces dsl blueprint dataSources[${index}]`;
  if (!_.isPlainObject(dataSource)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertNonEmptyString(dataSource.key, `${context}.key`);
  if (seenKeys.has(dataSource.key)) {
    throwBadRequest(`${context}.key '${dataSource.key}' is duplicated`);
  }
  seenKeys.add(dataSource.key);
  if (dataSource.kind === 'collection') {
    assertNonEmptyString(dataSource.collectionName, `${context}.collectionName`);
    return;
  }
  if (dataSource.kind === 'association') {
    assertNonEmptyString(dataSource.collectionName, `${context}.collectionName`);
    assertNonEmptyString(dataSource.associationPathName, `${context}.associationPathName`);
    return;
  }
  if (dataSource.kind === 'binding') {
    if (hasOwn(dataSource, 'scope')) {
      throwBadRequest(`${context}.scope is no longer supported; binding dataSources are implicitly popup-scoped`);
    }
    assertNonEmptyString(dataSource.popupId, `${context}.popupId`);
    if (!popupIds.has(dataSource.popupId)) {
      throwBadRequest(`${context}.popupId '${dataSource.popupId}' is not defined in popups[]`);
    }
    assertNonEmptyString(dataSource.binding, `${context}.binding`);
    if (dataSource.binding === 'associatedRecords') {
      assertNonEmptyString(dataSource.associationField, `${context}.associationField`);
    }
    return;
  }
  throwBadRequest(`${context}.kind '${(dataSource as any).kind || ''}' is not supported`);
}

function validateBlueprintField(
  block: FlowSurfaceDslBlock,
  field: FlowSurfaceDslField,
  fieldIndex: number,
  contextPrefix: string,
  generatedRefs: Set<string>,
  pageBlockIds: Set<string>,
) {
  const context = `${contextPrefix}.fields[${fieldIndex}]`;
  if (!_.isPlainObject(field)) {
    throwBadRequest(`${context} must be an object`);
  }
  if (!field.fieldPath && !field.type) {
    throwBadRequest(`${context} requires fieldPath or type`);
  }
  if (field.fieldPath && field.type) {
    throwBadRequest(`${context} cannot mix fieldPath with synthetic field type`);
  }
  if (!_.isUndefined(field.target)) {
    if (typeof field.target === 'string') {
      if (!pageBlockIds.has(field.target.trim())) {
        throwBadRequest(`${context}.target '${field.target}' is not a known page block id`);
      }
    } else if (
      _.isPlainObject(field.target) &&
      typeof field.target.blockId === 'string' &&
      field.target.blockId.trim()
    ) {
      if (!pageBlockIds.has(field.target.blockId.trim())) {
        throwBadRequest(`${context}.target.blockId '${field.target.blockId}' is not a known page block id`);
      }
    } else {
      throwBadRequest(`${context}.target must be a block id string or { blockId }`);
    }
  }
  const generatedRef = buildFlowSurfaceDslFieldRef(block.id, field, fieldIndex);
  if (generatedRefs.has(generatedRef)) {
    throwBadRequest(`${context} generated ref '${generatedRef}' is duplicated`);
  }
  generatedRefs.add(generatedRef);
}

function validateBlueprintAction(
  block: FlowSurfaceDslBlock,
  action: FlowSurfaceDslAction,
  actionIndex: number,
  scope: 'actions' | 'recordActions',
  contextPrefix: string,
  generatedRefs: Set<string>,
  popupIds: Set<string>,
  popupUsages: Map<string, Set<string>>,
) {
  const context = `${contextPrefix}.${scope}[${actionIndex}]`;
  if (!_.isPlainObject(action)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertNonEmptyString(action.type, `${context}.type`);
  if (!_.isUndefined(action.popupId)) {
    assertNonEmptyString(action.popupId, `${context}.popupId`);
    if (!popupIds.has(String(action.popupId).trim())) {
      throwBadRequest(`${context}.popupId '${action.popupId}' is not defined in popups[]`);
    }
    const popupId = String(action.popupId).trim();
    const types = popupUsages.get(popupId) || new Set<string>();
    types.add(String(action.type).trim());
    popupUsages.set(popupId, types);
  }
  const generatedRef = buildFlowSurfaceDslActionRef(block.id, scope, action, actionIndex);
  if (generatedRefs.has(generatedRef)) {
    throwBadRequest(`${context} generated ref '${generatedRef}' is duplicated`);
  }
  generatedRefs.add(generatedRef);
}

function validateBlueprintBlock(
  block: FlowSurfaceDslBlock,
  contextPrefix: string,
  dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>,
  generatedRefs: Set<string>,
  popupIds: Set<string>,
  popupUsages: Map<string, Set<string>>,
  pageBlockIds: Set<string>,
  currentPopupId?: string,
) {
  if (!_.isPlainObject(block)) {
    throwBadRequest(`${contextPrefix} must be an object`);
  }
  assertNonEmptyString(block.id, `${contextPrefix}.id`);
  assertNonEmptyString(block.type, `${contextPrefix}.type`);
  if (typeof block.dataBound !== 'boolean') {
    throwBadRequest(`${contextPrefix}.dataBound must be a boolean`);
  }
  if (block.dataBound) {
    assertNonEmptyString(block.dataSourceKey, `${contextPrefix}.dataSourceKey`);
    const dataSource = dataSourcesByKey.get(String(block.dataSourceKey).trim());
    if (!dataSource) {
      throwBadRequest(`${contextPrefix}.dataSourceKey '${block.dataSourceKey}' is not defined in dataSources[]`);
    }
    if (dataSource.kind === 'binding') {
      if (!currentPopupId) {
        throwBadRequest(
          `${contextPrefix}.dataSourceKey '${block.dataSourceKey}' uses popup binding outside popup scope`,
        );
      }
      if (dataSource.popupId !== currentPopupId) {
        throwBadRequest(
          `${contextPrefix}.dataSourceKey '${block.dataSourceKey}' belongs to popup '${dataSource.popupId}', not '${currentPopupId}'`,
        );
      }
    }
  }

  const fields = _.castArray(block.fields || []);
  const actions = _.castArray(block.actions || []);
  const recordActions = _.castArray(block.recordActions || []);
  fields.forEach((field, index) =>
    validateBlueprintField(block, field, index, contextPrefix, generatedRefs, pageBlockIds),
  );
  actions.forEach((action, index) =>
    validateBlueprintAction(block, action, index, 'actions', contextPrefix, generatedRefs, popupIds, popupUsages),
  );
  recordActions.forEach((action, index) =>
    validateBlueprintAction(block, action, index, 'recordActions', contextPrefix, generatedRefs, popupIds, popupUsages),
  );
}

function validateBlueprintRowsColumnsLayout(layout: any, context: string, blockIds: Set<string>) {
  if (!_.isPlainObject(layout)) {
    throwBadRequest(`${context} must be an object`);
  }
  const kind = String(layout.kind || 'rows-columns').trim() || 'rows-columns';
  if (kind !== 'rows-columns') {
    throwBadRequest(`${context}.kind '${kind}' is not supported`);
  }
  const rows = _.castArray(layout.rows || []);
  if (!rows.length) {
    throwBadRequest(`${context}.rows must not be empty`);
  }
  const mentioned = new Set<string>();
  rows.forEach((row, rowIndex) => {
    if (!_.isPlainObject(row)) {
      throwBadRequest(`${context}.rows[${rowIndex}] must be an object`);
    }
    const columns = _.castArray((row as any).columns || []);
    if (!columns.length) {
      throwBadRequest(`${context}.rows[${rowIndex}].columns must not be empty`);
    }
    columns.forEach((column, columnIndex) => {
      if (!_.isPlainObject(column)) {
        throwBadRequest(`${context}.rows[${rowIndex}].columns[${columnIndex}] must be an object`);
      }
      const items = _.castArray((column as any).items || [])
        .map((item) => String(item || '').trim())
        .filter(Boolean);
      if (!items.length) {
        throwBadRequest(`${context}.rows[${rowIndex}].columns[${columnIndex}].items must not be empty`);
      }
      if (items.length !== 1) {
        throwBadRequest(`${context}.rows[${rowIndex}].columns[${columnIndex}] currently supports exactly one item`);
      }
      items.forEach((blockId) => {
        if (!blockIds.has(blockId)) {
          throwBadRequest(`${context} item '${blockId}' is not defined in blocks[]`);
        }
        if (mentioned.has(blockId)) {
          throwBadRequest(`${context} item '${blockId}' is duplicated`);
        }
        mentioned.add(blockId);
      });
    });
  });
  const missing = [...blockIds].filter((blockId) => !mentioned.has(blockId));
  if (missing.length) {
    throwBadRequest(`${context} is missing blocks: ${missing.join(', ')}`);
  }
}

function validateBlueprintLayout(blueprint: FlowSurfaceBlueprintDsl, pageBlockIds: Set<string>) {
  validateBlueprintRowsColumnsLayout(blueprint.layout, 'flowSurfaces dsl blueprint layout', pageBlockIds);
}

function validateBlueprintInteractions(
  blueprint: FlowSurfaceBlueprintDsl,
  pageBlocksById: Map<string, FlowSurfaceDslBlock>,
) {
  blueprint.interactions.forEach((interaction, index) => {
    const context = `flowSurfaces dsl blueprint interactions[${index}]`;
    if (!_.isPlainObject(interaction)) {
      throwBadRequest(`${context} must be an object`);
    }
    if (interaction.type !== 'filter-target') {
      throwBadRequest(`${context}.type '${(interaction as any).type || ''}' is not supported`);
    }
    assertNonEmptyString(interaction.sourceBlockId, `${context}.sourceBlockId`);
    assertNonEmptyString(interaction.targetBlockId, `${context}.targetBlockId`);
    assertNonEmptyString(interaction.fieldPath, `${context}.fieldPath`);
    const sourceBlock = pageBlocksById.get(String(interaction.sourceBlockId).trim());
    const targetBlock = pageBlocksById.get(String(interaction.targetBlockId).trim());
    if (!sourceBlock) {
      throwBadRequest(`${context}.sourceBlockId '${interaction.sourceBlockId}' is not defined in blocks[]`);
    }
    if (!targetBlock) {
      throwBadRequest(`${context}.targetBlockId '${interaction.targetBlockId}' is not defined in blocks[]`);
    }
    const expectedFieldPath = normalizeFieldPath(interaction.fieldPath, interaction.associationPathName);
    const matchedField = _.castArray(sourceBlock.fields || []).find((field: any) => {
      if (!_.isPlainObject(field)) {
        return false;
      }
      return normalizeFieldPath(field.fieldPath || '', field.associationPathName) === expectedFieldPath;
    });
    if (!matchedField) {
      throwBadRequest(`${context} source field '${expectedFieldPath}' is not defined on '${sourceBlock.id}'`);
    }
  });
}

function validateBlueprintPopups(blueprint: FlowSurfaceBlueprintDsl, popupUsages: Map<string, Set<string>>) {
  blueprint.popups.forEach((popup, index) => {
    const context = `flowSurfaces dsl blueprint popups[${index}]`;
    if (!_.isPlainObject(popup)) {
      throwBadRequest(`${context} must be an object`);
    }
    assertNonEmptyString(popup.id, `${context}.id`);
    if (!['completed', 'shell-only'].includes(String(popup.completion || '').trim())) {
      throwBadRequest(`${context}.completion must be 'completed' or 'shell-only'`);
    }
    const inboundTypes = [...(popupUsages.get(popup.id) || new Set<string>())];
    const popupBlocks = _.castArray(popup.blocks || []);
    if (!_.isUndefined(popup.layout)) {
      if (!popupBlocks.length) {
        throwBadRequest(`${context}.layout requires popup blocks`);
      }
      validateBlueprintRowsColumnsLayout(
        popup.layout,
        `${context}.layout`,
        new Set(popupBlocks.map((block) => String(block?.id || '').trim()).filter(Boolean)),
      );
    }
    if (popup.completion === 'shell-only' && inboundTypes.some((type) => isFlowSurfaceDslDefaultCrudActionType(type))) {
      throwBadRequest(
        `${context}.completion 'shell-only' is not safe for default CRUD popup actions; provide explicit popup blocks instead`,
      );
    }
    if (popup.completion === 'completed' && !popupBlocks.length) {
      if (!inboundTypes.length) {
        throwBadRequest(`${context}.completion 'completed' requires inbound popup usage or explicit blocks`);
      }
      if (inboundTypes.length !== 1 || !isFlowSurfaceDslDefaultCrudActionType(inboundTypes[0])) {
        throwBadRequest(
          `${context}.completion 'completed' without blocks requires exactly one backend-default CRUD popup type`,
        );
      }
    }
  });
}

function validateBlueprint(blueprint: FlowSurfaceBlueprintDsl) {
  if (blueprint.version !== '1') {
    throwBadRequest(`flowSurfaces dsl blueprint version '${blueprint.version}' is not supported`);
  }
  if (hasOwn(blueprint, 'intent')) {
    throwBadRequest(`flowSurfaces dsl blueprint intent is no longer supported`);
  }
  assertNonEmptyString(blueprint.title, `flowSurfaces dsl blueprint title`);
  if (!_.isPlainObject(blueprint.target)) {
    throwBadRequest(`flowSurfaces dsl blueprint target must be an object`);
  }
  const targetMode = String((blueprint.target as any).mode || '').trim();
  if (!['create-page', 'update-page'].includes(targetMode)) {
    throwBadRequest(`flowSurfaces dsl blueprint target.mode '${targetMode || ''}' is not supported`);
  }
  if (targetMode === 'update-page' && !hasLocatorValue((blueprint.target as any).locator)) {
    throwBadRequest(`flowSurfaces dsl blueprint target.locator is required for update-page`);
  }
  if (!_.isUndefined(blueprint.navigation) && !_.isPlainObject(blueprint.navigation)) {
    throwBadRequest(`flowSurfaces dsl blueprint navigation must be an object`);
  }
  if (!blueprint.blocks.length) {
    throwBadRequest(`flowSurfaces dsl blueprint blocks must not be empty`);
  }

  const popupIds = new Set<string>();
  blueprint.popups.forEach((popup, index) => {
    if (!_.isPlainObject(popup)) {
      throwBadRequest(`flowSurfaces dsl blueprint popups[${index}] must be an object`);
    }
    assertNonEmptyString(popup.id, `flowSurfaces dsl blueprint popups[${index}].id`);
    if (popupIds.has(popup.id)) {
      throwBadRequest(`flowSurfaces dsl blueprint popup id '${popup.id}' is duplicated`);
    }
    popupIds.add(popup.id);
  });

  const dataSourcesByKey = new Map<string, FlowSurfaceDslDataSource>();
  const dataSourceSeenKeys = new Set<string>();
  blueprint.dataSources.forEach((dataSource, index) => {
    validateBlueprintDataSource(dataSource, index, popupIds, dataSourceSeenKeys);
    dataSourcesByKey.set(dataSource.key, dataSource);
  });

  const pageBlockIds = new Set<string>();
  const pageBlocksById = new Map<string, FlowSurfaceDslBlock>();
  blueprint.blocks.forEach((block, index) => {
    const context = `flowSurfaces dsl blueprint blocks[${index}]`;
    if (!_.isPlainObject(block)) {
      throwBadRequest(`${context} must be an object`);
    }
    assertNonEmptyString(block.id, `${context}.id`);
    if (pageBlockIds.has(block.id)) {
      throwBadRequest(`${context}.id '${block.id}' is duplicated`);
    }
    pageBlockIds.add(block.id);
    pageBlocksById.set(block.id, block);
  });

  const allBlockIds = new Set<string>(pageBlockIds);
  blueprint.popups.forEach((popup, index) => {
    _.castArray(popup.blocks || []).forEach((block, blockIndex) => {
      const context = `flowSurfaces dsl blueprint popups[${index}].blocks[${blockIndex}]`;
      if (!_.isPlainObject(block)) {
        throwBadRequest(`${context} must be an object`);
      }
      assertNonEmptyString(block.id, `${context}.id`);
      if (allBlockIds.has(block.id)) {
        throwBadRequest(`${context}.id '${block.id}' is duplicated`);
      }
      allBlockIds.add(block.id);
    });
  });

  const generatedRefs = new Set<string>();
  const popupUsages = new Map<string, Set<string>>();
  blueprint.blocks.forEach((block, index) =>
    validateBlueprintBlock(
      block,
      `flowSurfaces dsl blueprint blocks[${index}]`,
      dataSourcesByKey,
      generatedRefs,
      popupIds,
      popupUsages,
      pageBlockIds,
    ),
  );
  blueprint.popups.forEach((popup, popupIndex) => {
    _.castArray(popup.blocks || []).forEach((block, blockIndex) =>
      validateBlueprintBlock(
        block,
        `flowSurfaces dsl blueprint popups[${popupIndex}].blocks[${blockIndex}]`,
        dataSourcesByKey,
        generatedRefs,
        popupIds,
        popupUsages,
        pageBlockIds,
        popup.id,
      ),
    );
  });

  validateBlueprintLayout(blueprint, pageBlockIds);
  validateBlueprintInteractions(blueprint, pageBlocksById);
  validateBlueprintPopups(blueprint, popupUsages);
}

function validatePatchFieldSpec(field: FlowSurfaceDslField, context: string) {
  if (!_.isPlainObject(field)) {
    throwBadRequest(`${context} must be an object`);
  }
  if (!field.fieldPath && !field.type) {
    throwBadRequest(`${context} requires fieldPath or type`);
  }
  if (field.fieldPath && field.type) {
    throwBadRequest(`${context} cannot mix fieldPath with synthetic field type`);
  }
  if (!_.isUndefined(field.target)) {
    if (typeof field.target === 'string') {
      if (!field.target.trim()) {
        throwBadRequest(`${context}.target must be a non-empty string when provided`);
      }
    } else if (
      _.isPlainObject(field.target) &&
      typeof field.target.blockId === 'string' &&
      field.target.blockId.trim()
    ) {
      // pass
    } else {
      throwBadRequest(`${context}.target must be a block id string or { blockId }`);
    }
  }
}

function validatePatchActionSpec(
  action: FlowSurfaceDslAction,
  context: string,
  popupIds: Set<string>,
  popupUsages: Map<string, Set<string>>,
) {
  if (!_.isPlainObject(action)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertNonEmptyString(action.type, `${context}.type`);
  if (!_.isUndefined(action.popupId)) {
    assertNonEmptyString(action.popupId, `${context}.popupId`);
    if (!popupIds.has(String(action.popupId).trim())) {
      throwBadRequest(`${context}.popupId '${action.popupId}' is not defined in popups[]`);
    }
    const popupId = String(action.popupId).trim();
    const types = popupUsages.get(popupId) || new Set<string>();
    types.add(String(action.type).trim());
    popupUsages.set(popupId, types);
  }
}

function validatePatchRowsColumnsLayout(layout: any, context: string) {
  if (!_.isPlainObject(layout)) {
    throwBadRequest(`${context} must be an object`);
  }
  const kind = String(layout.kind || 'rows-columns').trim() || 'rows-columns';
  if (kind !== 'rows-columns') {
    throwBadRequest(`${context}.kind '${kind}' is not supported`);
  }
  const rows = _.castArray(layout.rows || []);
  if (!rows.length) {
    throwBadRequest(`${context}.rows must not be empty`);
  }
  const mentioned = new Set<string>();
  rows.forEach((row, rowIndex) => {
    if (!_.isPlainObject(row)) {
      throwBadRequest(`${context}.rows[${rowIndex}] must be an object`);
    }
    const columns = _.castArray((row as any).columns || []);
    if (!columns.length) {
      throwBadRequest(`${context}.rows[${rowIndex}].columns must not be empty`);
    }
    columns.forEach((column, columnIndex) => {
      if (!_.isPlainObject(column)) {
        throwBadRequest(`${context}.rows[${rowIndex}].columns[${columnIndex}] must be an object`);
      }
      const items = _.castArray((column as any).items || [])
        .map((item) => String(item || '').trim())
        .filter(Boolean);
      if (!items.length) {
        throwBadRequest(`${context}.rows[${rowIndex}].columns[${columnIndex}].items must not be empty`);
      }
      items.forEach((itemId) => {
        if (mentioned.has(itemId)) {
          throwBadRequest(`${context} item '${itemId}' is duplicated`);
        }
        mentioned.add(itemId);
      });
    });
  });
}

function requiresPatchTarget(change: FlowSurfacePatchDslChange) {
  return !FLOW_SURFACE_DSL_PATCH_SURFACE_DEFAULT_TARGET_OPS.has(change.op);
}

function requiresPatchSource(change: FlowSurfacePatchDslChange) {
  return ['tab.move', 'node.move'].includes(change.op);
}

function validatePatchChange(
  change: FlowSurfacePatchDslChange,
  index: number,
  deps: {
    dataSourcesByKey: Map<string, FlowSurfaceDslDataSource>;
    popupIds: Set<string>;
    popupUsages: Map<string, Set<string>>;
    addedBlockIds: Set<string>;
  },
) {
  const context = `flowSurfaces dsl patch changes[${index}]`;
  if (!_.isPlainObject(change)) {
    throwBadRequest(`${context} must be an object`);
  }
  if (!FLOW_SURFACE_DSL_PATCH_OPS.has(String(change.op || '').trim())) {
    throwBadRequest(`${context}.op '${(change as any).op || ''}' is not supported`);
  }
  if (requiresPatchTarget(change) && _.isUndefined(change.target)) {
    throwBadRequest(`${context}.target is required for '${change.op}'`);
  }
  if (requiresPatchSource(change) && _.isUndefined(change.source)) {
    throwBadRequest(`${context}.source is required for '${change.op}'`);
  }
  if (!_.isUndefined(change.target)) {
    assertDslEntityRef(change.target as FlowSurfaceDslEntityRef, `${context}.target`);
  }
  if (!_.isUndefined(change.source)) {
    assertDslEntityRef(change.source as FlowSurfaceDslEntityRef, `${context}.source`);
  }
  if (!_.isUndefined(change.values) && !_.isPlainObject(change.values)) {
    throwBadRequest(`${context}.values must be an object when provided`);
  }
  const values = _.isPlainObject(change.values) ? change.values : {};

  switch (change.op) {
    case 'block.add': {
      if (!_.isPlainObject(values.block)) {
        throwBadRequest(`${context}.values.block is required`);
      }
      validateBlueprintBlock(
        values.block as FlowSurfaceDslBlock,
        `${context}.values.block`,
        deps.dataSourcesByKey,
        new Set<string>(),
        deps.popupIds,
        deps.popupUsages,
        deps.addedBlockIds,
      );
      return;
    }
    case 'field.add': {
      if (!_.isPlainObject(values.field)) {
        throwBadRequest(`${context}.values.field is required`);
      }
      validatePatchFieldSpec(values.field as FlowSurfaceDslField, `${context}.values.field`);
      return;
    }
    case 'action.add':
    case 'recordAction.add': {
      if (!_.isPlainObject(values.action)) {
        throwBadRequest(`${context}.values.action is required`);
      }
      validatePatchActionSpec(
        values.action as FlowSurfaceDslAction,
        `${context}.values.action`,
        deps.popupIds,
        deps.popupUsages,
      );
      return;
    }
    case 'settings.update':
      if (!_.isPlainObject(values.changes)) {
        throwBadRequest(`${context}.values.changes is required`);
      }
      return;
    case 'layout.replace':
      if (!_.isPlainObject(values.layout)) {
        throwBadRequest(`${context}.values.layout is required`);
      }
      validatePatchRowsColumnsLayout(values.layout, `${context}.values.layout`);
      return;
    default:
      return;
  }
}

function validatePatch(patch: FlowSurfacePatchDsl) {
  if (patch.version !== '1') {
    throwBadRequest(`flowSurfaces dsl patch version '${patch.version}' is not supported`);
  }
  if (
    !_.isPlainObject(patch.target) ||
    !_.isPlainObject(patch.target.locator) ||
    !hasLocatorValue(patch.target.locator)
  ) {
    throwBadRequest(`flowSurfaces dsl patch target.locator is required`);
  }
  if (!patch.changes.length) {
    throwBadRequest(`flowSurfaces dsl patch changes must not be empty`);
  }
  const popupIds = new Set<string>();
  _.castArray(patch.popups || []).forEach((popup, index) => {
    if (!_.isPlainObject(popup)) {
      throwBadRequest(`flowSurfaces dsl patch popups[${index}] must be an object`);
    }
    assertNonEmptyString(popup.id, `flowSurfaces dsl patch popups[${index}].id`);
    if (popupIds.has(popup.id)) {
      throwBadRequest(`flowSurfaces dsl patch popup id '${popup.id}' is duplicated`);
    }
    popupIds.add(popup.id);
  });

  const dataSourcesByKey = new Map<string, FlowSurfaceDslDataSource>();
  const dataSourceSeenKeys = new Set<string>();
  _.castArray(patch.dataSources || []).forEach((dataSource, index) => {
    validateBlueprintDataSource(dataSource, index, popupIds, dataSourceSeenKeys);
    dataSourcesByKey.set(dataSource.key, dataSource);
  });

  const addedBlockIds = new Set<string>();
  patch.changes.forEach((change, index) => {
    const block = _.isPlainObject(change?.values?.block) ? change.values.block : null;
    if (!block) {
      return;
    }
    const context = `flowSurfaces dsl patch changes[${index}].values.block`;
    assertNonEmptyString(block.id, `${context}.id`);
    if (addedBlockIds.has(block.id)) {
      throwBadRequest(`${context}.id '${block.id}' is duplicated`);
    }
    addedBlockIds.add(block.id);
  });

  const generatedRefs = new Set<string>();
  const popupUsages = new Map<string, Set<string>>();
  patch.changes.forEach((change, index) =>
    validatePatchChange(change, index, {
      dataSourcesByKey,
      popupIds,
      popupUsages,
      addedBlockIds,
    }),
  );

  _.castArray(patch.popups || []).forEach((popup, popupIndex) => {
    _.castArray(popup.blocks || []).forEach((block, blockIndex) =>
      validateBlueprintBlock(
        block,
        `flowSurfaces dsl patch popups[${popupIndex}].blocks[${blockIndex}]`,
        dataSourcesByKey,
        generatedRefs,
        popupIds,
        popupUsages,
        addedBlockIds,
        popup.id,
      ),
    );
  });
  validateBlueprintPopups(
    {
      popups: _.castArray(patch.popups || []),
    } as FlowSurfaceBlueprintDsl,
    popupUsages,
  );
}

export function validateFlowSurfaceDslDocument(actionName: 'validateDsl' | 'executeDsl', dsl: FlowSurfaceDslDocument) {
  if (dsl.kind === 'patch') {
    validatePatch(dsl);
    return;
  }
  if (dsl.kind === 'blueprint') {
    validateBlueprint(dsl);
    return;
  }
  throwBadRequest(`flowSurfaces ${actionName} dsl.kind '${(dsl as any).kind || ''}' is not supported`);
}
