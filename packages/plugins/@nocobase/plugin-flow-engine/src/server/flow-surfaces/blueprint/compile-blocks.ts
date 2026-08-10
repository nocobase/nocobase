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
  FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY,
  mergeFlowSurfaceDefaultBlockActions,
} from '../default-block-actions';
import type { FlowSurfaceDefaultBlockActionDescriptor } from '../default-block-actions';
import {
  countFlowSurfaceNonTemplateTitleCleanupDataBlocks,
  isFlowSurfaceNonTemplateTitleCleanupDataBlock,
} from '../data-block-rules';
import {
  assertFlowSurfaceConcreteDefaultFilterItem,
  backfillFlowSurfaceFilterActionDefaultFilter,
  buildFlowSurfaceDefaultFilterFromCollection,
  clampFlowSurfaceDefaultFilterToCandidateLimit,
  isFlowSurfacePublicDataSurfaceBlockType,
  normalizeFlowSurfacePublicBlockDefaultFilter,
} from '../public-data-surface-default-filter';
import { normalizeFlowSurfacePublicSortingAlias } from '../public-compatibility';
import {
  FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY,
  attachFlowSurfaceApplyBlueprintPopupDefaults,
  buildFlowSurfaceApplyBlueprintPopupDefaultsMetadata,
} from './defaults';
import type { FlowSurfaceApplyBlueprintPopupDefaultsMetadata } from './defaults';
import { normalizeBlockHiddenPopupSettings } from '../hidden-popup-contract';
import type { FlowSurfaceResourceBindingKey } from '../types';
import {
  getCollectionFields,
  getCollectionName,
  getFieldInterface,
  getFieldName,
  getFieldTarget,
  getFieldType,
  resolveAssociationNameFromField,
  resolveFieldFromCollection,
  resolveFieldTargetCollection,
} from '../service-helpers';
import { hasFlowSurfaceTemplateDocument, hasFlowSurfaceTemplateReference } from '../template-reference';
import { buildFlowSurfaceAutoFieldGridLayout, resolveFlowSurfaceFieldGridFieldInterface } from '../field-grid-layout';
import type {
  FlowSurfaceApplyBlueprintCollectionResolver,
  FlowSurfaceApplyBlueprintActionSpec,
  FlowSurfaceApplyBlueprintAssets,
  FlowSurfaceApplyBlueprintBlockResource,
  FlowSurfaceApplyBlueprintBlockSpec,
  FlowSurfaceApplyBlueprintDefaults,
  FlowSurfaceApplyBlueprintDocument,
  FlowSurfaceApplyBlueprintFieldGroupSpec,
  FlowSurfaceApplyBlueprintFieldObjectSpec,
  FlowSurfaceApplyBlueprintLayout,
  FlowSurfaceApplyBlueprintMode,
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

type FlowSurfaceReadableBlockResource = {
  binding?: FlowSurfaceResourceBindingKey;
  dataSourceKey?: string;
  collectionName?: string;
  associationName?: string;
  associationField?: string;
  associationPathName?: string;
};

type FlowSurfaceCompilePopupOptions = {
  ownerActionType?: string;
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver;
  mode?: FlowSurfaceApplyBlueprintMode;
  popupDepth?: number;
  triggerKind?: 'field' | 'action' | 'recordAction';
  triggerLabel?: string;
  hostBlock?: FlowSurfaceApplyBlueprintBlockSpec;
  dataSourceKey?: string;
  surfaceCollectionName?: string;
  associationName?: string;
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
  'comments',
  'recordHistory',
  'actionPanel',
  'jsBlock',
  'tree',
] as const;

const APPLY_BLUEPRINT_BLOCK_ALLOWED_KEYS = [
  'key',
  'type',
  'title',
  'description',
  'height',
  'heightMode',
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
  'pageSize',
  'sort',
  'sorting',
  'titleField',
  'colorField',
  'startField',
  'endField',
];

const APPLY_BLUEPRINT_FIELD_ALLOWED_KEYS = [
  'key',
  'field',
  'associationPathName',
  'renderer',
  'type',
  'fieldType',
  'fields',
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
const APPLY_BLUEPRINT_POPUP_COMPOSE_MODES = new Set(['replace', 'append']);
const APPLY_BLUEPRINT_POPUP_DISPLAY_MODE_ALIASES: Record<string, string> = {
  modal: 'dialog',
  page: 'embed',
};
const APPLY_BLUEPRINT_POPUP_DISPLAY_MODES = new Set(['drawer', 'dialog', 'embed', 'page', 'modal']);
const APPLY_BLUEPRINT_CALENDAR_FIELD_BINDING_KEYS = ['titleField', 'colorField', 'startField', 'endField'] as const;
const APPLY_BLUEPRINT_POPUP_PAGE_MODE_BLOCK_THRESHOLD = 3;
const APPLY_BLUEPRINT_POPUP_PAGE_MODE_FIELD_THRESHOLD = 20;
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
const APPLY_BLUEPRINT_RECORD_CAPABLE_BLOCK_TYPES = new Set(['table', 'details', 'list', 'gridCard', 'comments']);
const APPLY_BLUEPRINT_FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details', 'filterForm']);
const APPLY_BLUEPRINT_FIELD_GROUP_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details']);
const APPLY_BLUEPRINT_AUTO_PROMOTED_RECORD_ACTION_TYPES = new Set([
  'view',
  'edit',
  'delete',
  'updateRecord',
  'duplicate',
]);
const APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_TYPES = new Set(['addNew', 'addChild', 'view', 'edit']);
const APPLY_BLUEPRINT_BLOCK_TYPES = new Set<string>(APPLY_BLUEPRINT_BLOCK_TYPE_ENUM);
const APPLY_BLUEPRINT_ADD_CHILD_RECORD_ACTION_ERROR =
  "type 'addChild' must be authored under recordActions and is only valid when the live target catalog.recordActions exposes it for a tree collection table with treeTable enabled";
const AI_EMPLOYEE_ACTION_TYPE = 'aiEmployee';

function assertNoBlockLevelLayout(input: Record<string, any>, context: string) {
  if (Object.prototype.hasOwnProperty.call(input, 'layout')) {
    throwBadRequest(`${context}.layout is not supported; layout is only allowed on tabs[] and popup`);
  }
}

function normalizeApplyBlueprintCalendarPopupSettings(
  settings: Record<string, any>,
  blockContext: string,
  defaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
) {
  return normalizeBlockHiddenPopupSettings(
    settings,
    blockContext,
    ['quickCreatePopup', 'eventPopup'],
    defaultsMetadata,
    throwBadRequest,
  );
}

function normalizeApplyBlueprintKanbanPopupSettings(
  settings: Record<string, any>,
  blockContext: string,
  defaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
) {
  return normalizeBlockHiddenPopupSettings(
    settings,
    blockContext,
    ['quickCreatePopup', 'cardPopup'],
    defaultsMetadata,
    throwBadRequest,
  );
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
      `${context}.recordActions is not supported on calendar main blocks; use actions[] for calendar block actions or configure event actions inside the event-view popup host instead`,
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
    throwBadRequest(
      `${context}.recordActions is not supported on kanban main blocks in v1; use actions[] for kanban block actions`,
    );
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
    if (_.isUndefined(assetKey)) {
      return;
    }
    if (typeof assetKey !== 'string') {
      if (bucket === 'scripts') {
        throwBadRequest(`${context}.script must be a string asset key; use settings.code for inline JS code`);
      }
      return;
    }
    const normalizedKey = readOptionalString(assetKey);
    if (!normalizedKey) {
      if (bucket === 'scripts') {
        throwBadRequest(`${context}.script must be a non-empty string asset key; use settings.code for inline JS code`);
      }
      return;
    }
    const registry = assets[bucket] || {};
    const asset = registry[normalizedKey];
    if (!_.isPlainObject(asset)) {
      throwBadRequest(`${context} ${bucket.slice(0, -1)} asset '${normalizedKey}' is not defined in assets.${bucket}`);
    }
    if (bucket === 'scripts' && !readOptionalString(asset.code)) {
      throwBadRequest(
        `${context}.script references script asset '${normalizedKey}' without non-empty code; use settings.code for inline JS code`,
      );
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

function normalizeApplyBlueprintPopupMode(value: any, context: string) {
  const rawMode = readOptionalString(value);
  if (!rawMode) {
    return {};
  }
  if (APPLY_BLUEPRINT_POPUP_COMPOSE_MODES.has(rawMode)) {
    return {
      composeMode: rawMode as 'replace' | 'append',
    };
  }
  if (APPLY_BLUEPRINT_POPUP_DISPLAY_MODES.has(rawMode)) {
    return {
      displayMode: APPLY_BLUEPRINT_POPUP_DISPLAY_MODE_ALIASES[rawMode] || rawMode,
    };
  }
  throwBadRequest(`${context}.mode must be 'replace', 'append', 'drawer', 'dialog' or 'page'`);
}

function countApplyBlueprintPopupDirectEffectiveFields(blocks: FlowSurfaceApplyBlueprintBlockSpec[]) {
  return blocks.reduce((count, block) => {
    if (!_.isPlainObject(block) || readOptionalString(block.type) === 'filterForm') {
      return count;
    }
    const fields = Object.prototype.hasOwnProperty.call(block, 'fieldGroups')
      ? _.castArray(block.fieldGroups || []).flatMap((group: any) => _.castArray(group?.fields || []))
      : _.castArray(block.fields || []);
    return (
      count +
      fields.filter((field: any) => {
        if (_.isPlainObject(field)) {
          const type = String(field.type || '').trim();
          return type !== 'divider' && type !== 'jsitem' && type !== 'jscolumn';
        }
        return !!String(field || '').trim();
      }).length
    );
  }, 0);
}

function countApplyBlueprintPopupNonFilterBlocks(blocks: FlowSurfaceApplyBlueprintBlockSpec[]) {
  return blocks.filter((block) => _.isPlainObject(block) && readOptionalString(block.type) !== 'filterForm').length;
}

function shouldDefaultApplyBlueprintPopupDisplayPage(
  popup: FlowSurfaceApplyBlueprintPopup,
  popupBlocks: FlowSurfaceApplyBlueprintBlockSpec[],
  options: { popupDepth?: number },
) {
  if (hasFlowSurfaceTemplateReference(popup.template)) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(popup, 'mode')) {
    return false;
  }
  if ((options.popupDepth || 1) !== 1) {
    return false;
  }
  if (!popupBlocks.length) {
    return false;
  }
  return (
    countApplyBlueprintPopupNonFilterBlocks(popupBlocks) > APPLY_BLUEPRINT_POPUP_PAGE_MODE_BLOCK_THRESHOLD ||
    countApplyBlueprintPopupDirectEffectiveFields(popupBlocks) > APPLY_BLUEPRINT_POPUP_PAGE_MODE_FIELD_THRESHOLD
  );
}

const MAX_AUTO_TEMPLATE_NAME_LENGTH = 80;
const MAX_AUTO_TEMPLATE_DESCRIPTION_LENGTH = 240;
const MAX_HEADER_TEXT = 60;
const CJK_TEXT_PATTERN = /[\u3400-\u9fff\uf900-\ufaff]/;

function normalizeMetadataText(value: any) {
  return typeof value === 'string' ? value.trim() : String(value || '').trim();
}

function trimAutoTemplateLabel(value: any, maxLength = MAX_AUTO_TEMPLATE_NAME_LENGTH) {
  const source = normalizeMetadataText(value);
  if (!source) {
    return '';
  }
  if (source.length <= maxLength) {
    return source;
  }
  if (maxLength <= 3) {
    return source.slice(0, maxLength);
  }
  return `${source.slice(0, maxLength - 3)}...`;
}

function getApplyBlueprintCollectionLabel(block?: Record<string, any>) {
  return (
    normalizeMetadataText(block?.collection) ||
    normalizeMetadataText(block?.resourceInit?.collectionName) ||
    normalizeMetadataText(block?.resourceInit?.collection) ||
    normalizeMetadataText(block?.resource?.collectionName) ||
    normalizeMetadataText(block?.resource?.collection) ||
    ''
  );
}

function getApplyBlueprintAssociationLabel(block?: Record<string, any>) {
  return (
    normalizeMetadataText(block?.associationName) ||
    normalizeMetadataText(block?.resourceInit?.associationName) ||
    normalizeMetadataText(block?.resource?.associationName) ||
    normalizeMetadataText(block?.associationField) ||
    normalizeMetadataText(block?.resource?.associationField) ||
    ''
  );
}

function buildApplyBlueprintBlockHeader(block?: Record<string, any>) {
  return (
    normalizeMetadataText(block?.title) ||
    getApplyBlueprintCollectionLabel(block) ||
    normalizeMetadataText(block?.key) ||
    normalizeMetadataText(block?.type)
  );
}

function inferPopupTemplateMetadataLocale(
  popup: FlowSurfaceApplyBlueprintPopup,
  options: { triggerLabel?: string; hostBlock?: FlowSurfaceApplyBlueprintBlockSpec },
) {
  const candidates = [
    popup.title,
    options.triggerLabel,
    options.hostBlock?.title,
    options.hostBlock?.key,
    getApplyBlueprintCollectionLabel(options.hostBlock),
    ..._.castArray(popup.blocks || []).flatMap((block: any) => [
      block?.title,
      block?.key,
      block?.type,
      getApplyBlueprintCollectionLabel(block),
    ]),
  ];
  return candidates.some((value) => CJK_TEXT_PATTERN.test(normalizeMetadataText(value))) ? 'zh' : 'en';
}

function getPopupTemplateTriggerLabel(kind: string | undefined, locale: string) {
  const normalizedKind = String(kind || '').trim();
  if (locale === 'zh') {
    if (normalizedKind === 'field') {
      return '字段';
    }
    if (normalizedKind === 'recordAction') {
      return '记录操作';
    }
    if (normalizedKind === 'action') {
      return '操作';
    }
    return '弹窗';
  }
  if (normalizedKind === 'field') {
    return 'field';
  }
  if (normalizedKind === 'recordAction') {
    return 'record action';
  }
  if (normalizedKind === 'action') {
    return 'action';
  }
  return 'popup';
}

function describePopupTemplateTrigger(kind: string | undefined, label: string | undefined, locale: string) {
  const kindLabel = getPopupTemplateTriggerLabel(kind, locale);
  const normalizedLabel = normalizeMetadataText(label);
  if (!normalizedLabel) {
    return kindLabel;
  }
  return locale === 'zh' ? `${kindLabel}“${normalizedLabel}”` : `${kindLabel} "${normalizedLabel}"`;
}

function describePopupTemplateHost(block: FlowSurfaceApplyBlueprintBlockSpec | undefined, locale: string) {
  return (
    normalizeMetadataText(block?.title) ||
    getApplyBlueprintCollectionLabel(block) ||
    normalizeMetadataText(block?.key) ||
    normalizeMetadataText(block?.type) ||
    (locale === 'zh' ? '当前区块' : 'current block')
  );
}

function summarizePopupTemplateBlocks(blocks: FlowSurfaceApplyBlueprintBlockSpec[] | undefined, locale: string) {
  const labels = _.uniq(
    _.castArray(blocks || [])
      .map((block: any) => trimAutoTemplateLabel(buildApplyBlueprintBlockHeader(block), MAX_HEADER_TEXT))
      .filter(Boolean),
  ).slice(0, 3);
  if (!labels.length) {
    return locale === 'zh' ? '本地 popup 内容' : 'local popup content';
  }
  return labels.join(locale === 'zh' ? '、' : ', ');
}

function inferPopupTemplateMetadataScene(popup: FlowSurfaceApplyBlueprintPopup, options: { ownerActionType?: string }) {
  const requestedDefaultType = normalizeMetadataText((popup as any).defaultType);
  if (requestedDefaultType === 'view' || requestedDefaultType === 'edit') {
    return requestedDefaultType;
  }
  const ownerActionType = normalizeMetadataText(options.ownerActionType);
  if (ownerActionType === 'edit') {
    return 'edit';
  }
  if (ownerActionType === 'addNew' || ownerActionType === 'addChild') {
    return 'addNew';
  }
  if (ownerActionType === 'view') {
    return 'view';
  }
  const firstBlockType = normalizeMetadataText(_.castArray(popup.blocks || [])[0]?.type);
  if (firstBlockType === 'details') {
    return 'view';
  }
  if (firstBlockType === 'editForm') {
    return 'edit';
  }
  if (firstBlockType === 'createForm') {
    return 'addNew';
  }
  return 'generic';
}

function describePopupTemplateMatchContext(
  popup: FlowSurfaceApplyBlueprintPopup,
  options: {
    hostBlock?: FlowSurfaceApplyBlueprintBlockSpec;
    ownerActionType?: string;
    associationName?: string;
  },
  locale: string,
) {
  const popupBlocks = _.castArray(popup.blocks || []);
  const firstResourceBlock = popupBlocks.find(
    (block: any) => getApplyBlueprintCollectionLabel(block) || getApplyBlueprintAssociationLabel(block),
  );
  const collectionLabel =
    getApplyBlueprintCollectionLabel(firstResourceBlock) || getApplyBlueprintCollectionLabel(options.hostBlock);
  const associationLabel =
    normalizeMetadataText(options.associationName) ||
    getApplyBlueprintAssociationLabel(firstResourceBlock) ||
    getApplyBlueprintAssociationLabel(options.hostBlock);
  const scene = inferPopupTemplateMetadataScene(popup, options);
  const parts = locale === 'zh' ? [`场景：${scene}`] : [`Scene: ${scene}`];
  if (collectionLabel) {
    parts.push(locale === 'zh' ? `数据表：${collectionLabel}` : `collection: ${collectionLabel}`);
  }
  if (associationLabel) {
    parts.push(locale === 'zh' ? `关系：${associationLabel}` : `association: ${associationLabel}`);
  }
  return parts.join(locale === 'zh' ? '；' : '; ');
}

function buildApplyBlueprintAutoSaveTemplateMetadata(
  popup: FlowSurfaceApplyBlueprintPopup,
  options: {
    triggerKind?: string;
    triggerLabel?: string;
    hostBlock?: FlowSurfaceApplyBlueprintBlockSpec;
    ownerActionType?: string;
    associationName?: string;
  },
) {
  const locale = inferPopupTemplateMetadataLocale(popup, options);
  const popupTitle = normalizeMetadataText(popup.title);
  const hostLabel = describePopupTemplateHost(options.hostBlock, locale);
  const triggerLabel = describePopupTemplateTrigger(options.triggerKind, options.triggerLabel, locale);
  const contentLabel = summarizePopupTemplateBlocks(popup.blocks, locale);
  const matchContextLabel = describePopupTemplateMatchContext(popup, options, locale);
  const associationName = normalizeMetadataText(options.associationName);
  const directName = popupTitle
    ? locale === 'zh'
      ? `${popupTitle}弹窗模板`
      : `${popupTitle} popup template`
    : locale === 'zh'
      ? `${hostLabel} ${triggerLabel} 弹窗模板`
      : `${hostLabel} ${triggerLabel} popup template`;
  const relationBaseName = popupTitle || `${hostLabel} ${triggerLabel}`;
  const name = associationName ? `${relationBaseName}(${associationName})` : directName;
  const contextLabel = associationName
    ? locale === 'zh'
      ? `上下文：关联 ${associationName}`
      : `context: relation ${associationName}`
    : locale === 'zh'
      ? '上下文：直接/当前记录'
      : 'context: direct/current record';
  const description =
    locale === 'zh'
      ? `复用弹窗模板。${matchContextLabel}；宿主：${hostLabel}；触发器：${triggerLabel}；${contextLabel}；内容：${contentLabel}。`
      : `Reusable popup template. ${matchContextLabel}; host: ${hostLabel}; trigger: ${triggerLabel}; ${contextLabel}; content: ${contentLabel}.`;
  return {
    name: trimAutoTemplateLabel(name, MAX_AUTO_TEMPLATE_NAME_LENGTH),
    description: trimAutoTemplateLabel(description, MAX_AUTO_TEMPLATE_DESCRIPTION_LENGTH),
  };
}

function buildPopupOpenViewContext(options: FlowSurfaceCompilePopupOptions) {
  const associationName = normalizeMetadataText(options.associationName);
  if (!associationName) {
    return {};
  }
  return buildDefinedPayload({
    dataSourceKey: normalizeMetadataText(options.dataSourceKey) || undefined,
    collectionName: normalizeMetadataText(options.surfaceCollectionName) || undefined,
    associationName,
  });
}

function normalizeApplyBlueprintCalendarCompatSettings(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  settings: Record<string, any>,
) {
  if (readOptionalString(block.type) !== 'calendar') {
    return settings;
  }
  let nextSettings = settings;
  const ensureNextSettings = () => {
    if (nextSettings === settings) {
      nextSettings = _.cloneDeep(settings || {});
    }
    return nextSettings;
  };
  for (const key of APPLY_BLUEPRINT_CALENDAR_FIELD_BINDING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(block, key) && !Object.prototype.hasOwnProperty.call(nextSettings, key)) {
      ensureNextSettings()[key] = (block as any)[key];
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(nextSettings, 'quickCreateEnabled') &&
    !Object.prototype.hasOwnProperty.call(nextSettings, 'quickCreateEvent')
  ) {
    ensureNextSettings().quickCreateEvent = nextSettings.quickCreateEnabled;
  }
  if (nextSettings !== settings) {
    delete nextSettings.quickCreateEnabled;
  }
  return nextSettings;
}

function isApplyBlueprintCompatibleTreeTableDragSortFieldMeta(field: any) {
  if (String(getFieldInterface(field) || getFieldType(field) || '').trim() !== 'sort') {
    return false;
  }
  return (
    !String(getFieldTarget(field) || '').trim() && !String(field?.scopeKey || field?.options?.scopeKey || '').trim()
  );
}

function getApplyBlueprintCompatibleTreeTableDragSortFieldName(collection: any) {
  return getFieldName(getCollectionFields(collection).find(isApplyBlueprintCompatibleTreeTableDragSortFieldMeta));
}

function isApplyBlueprintCompatibleTreeTableDragSortField(collection: any, fieldName: string) {
  const field = getCollectionFields(collection).find((candidate) => getFieldName(candidate) === fieldName);
  return !!field && isApplyBlueprintCompatibleTreeTableDragSortFieldMeta(field);
}

function normalizeApplyBlueprintTreeTableDragSortBy(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  settings: Record<string, any>,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
) {
  if (
    readOptionalString(block.type) !== 'table' ||
    settings?.treeTable !== true ||
    !Object.prototype.hasOwnProperty.call(settings || {}, 'dragSortBy')
  ) {
    return settings;
  }
  const collection = resolveBlueprintBlockCollection(block, getCollection);
  if (!collection) {
    return settings;
  }
  const currentFieldName = readOptionalString(settings.dragSortBy);
  if (currentFieldName && isApplyBlueprintCompatibleTreeTableDragSortField(collection, currentFieldName)) {
    return settings;
  }
  const nextSettings = _.cloneDeep(settings || {});
  const replacementFieldName = getApplyBlueprintCompatibleTreeTableDragSortFieldName(collection);
  if (replacementFieldName) {
    nextSettings.dragSortBy = replacementFieldName;
  } else {
    delete nextSettings.dragSortBy;
  }
  return nextSettings;
}

function isApplyBlueprintTreeTableBlock(
  blockType: string | undefined,
  settings: Record<string, any>,
  template: unknown,
  block: FlowSurfaceApplyBlueprintBlockSpec,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
) {
  return (
    blockType === 'table' &&
    settings?.treeTable === true &&
    !hasFlowSurfaceTemplateDocument(template) &&
    canInjectTreeTableAddChildDefault(block, getCollection)
  );
}

function getTreeTableFirstFieldPath(fields: Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec>) {
  const firstField = fields.find((field) => {
    if (typeof field === 'string') {
      return !!field.trim();
    }
    return _.isPlainObject(field) && !!readOptionalString(field.field);
  });
  if (typeof firstField === 'string') {
    return firstField.trim();
  }
  return readOptionalString(firstField?.field);
}

function isUnreadableTreeTableFirstColumnName(fieldPath: string) {
  const normalizedFieldPath = String(fieldPath || '').trim();
  if (!normalizedFieldPath || normalizedFieldPath.includes('.')) {
    return false;
  }
  const normalizedLowerFieldPath = normalizedFieldPath.toLowerCase();
  return (
    ['id', 'uid', 'uuid', 'parentid'].includes(normalizedLowerFieldPath) ||
    /(?:Id|ID|Uid|UID)$/.test(normalizedFieldPath) ||
    normalizedLowerFieldPath.endsWith('_id') ||
    normalizedLowerFieldPath.endsWith('_uid')
  );
}

function isUnreadableTreeTableFirstColumnField(field: any) {
  return (
    !!field?.primaryKey ||
    !!field?.options?.primaryKey ||
    !!field?.foreignKey ||
    !!field?.options?.foreignKey ||
    isApplyBlueprintAssociationField(field) ||
    isUnreadableTreeTableFirstColumnName(getFieldName(field))
  );
}

function isReadableTreeTableFirstColumnField(fieldPath: string, collection: any) {
  if (!fieldPath || fieldPath.includes('.')) {
    return false;
  }
  const field = collection ? resolveFieldFromCollection(collection, fieldPath) : undefined;
  return (
    !!field &&
    !!getFieldInterface(field) &&
    !isUnreadableTreeTableFirstColumnName(fieldPath) &&
    !isUnreadableTreeTableFirstColumnField(field)
  );
}

function reorderApplyBlueprintTreeTableExplicitFields(input: {
  blockType?: string;
  settings: Record<string, any>;
  template: unknown;
  block: FlowSurfaceApplyBlueprintBlockSpec;
  fields: Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec>;
  collection: any;
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver;
  context: string;
}) {
  if (
    !Object.prototype.hasOwnProperty.call(input.block, 'fields') ||
    !isApplyBlueprintTreeTableBlock(input.blockType, input.settings, input.template, input.block, input.getCollection)
  ) {
    return input.fields;
  }
  const firstFieldPath = getTreeTableFirstFieldPath(input.fields);
  if (firstFieldPath && isReadableTreeTableFirstColumnField(firstFieldPath, input.collection)) {
    return input.fields;
  }
  const readableIndex = input.fields.findIndex((field) =>
    isReadableTreeTableFirstColumnField(getTreeTableFirstFieldPath([field]), input.collection),
  );
  if (readableIndex >= 0) {
    const nextFields = input.fields.slice();
    const [readableField] = nextFields.splice(readableIndex, 1);
    nextFields.unshift(readableField);
    return nextFields;
  }
  throwBadRequest(
    `${input.context}.fields[0] tree table explicit fields must include at least one direct readable non-association field; do not rely on applyBlueprint to inject a title/name fallback`,
  );
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

function buildBlockResource(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  context: string,
  resourceContext?: FlowSurfaceCompileResourceContext,
  blockType?: string,
) {
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
  if (!collectionName && !isFlowSurfacePublicDataSurfaceBlockType(blockType || '')) {
    return undefined;
  }
  const inheritedCollectionName = readOptionalString(resourceContext?.surfaceCollectionName);
  if (!collectionName && !inheritedCollectionName) {
    return undefined;
  }
  return buildDefinedPayload({
    binding: !collectionName && inheritedCollectionName ? 'otherRecords' : undefined,
    dataSourceKey:
      readOptionalString(block.dataSourceKey) || readOptionalString(resourceContext?.dataSourceKey) || 'main',
    collectionName: collectionName || inheritedCollectionName,
    associationPathName: readOptionalString(block.associationPathName),
  });
}

type FlowSurfaceCompileResourceContext = {
  dataSourceKey?: string;
  surfaceCollectionName?: string;
  associationName?: string;
};

const APPLY_BLUEPRINT_ASSOCIATION_FIELD_TYPES = new Set([
  'belongsto',
  'hasone',
  'hasmany',
  'belongstomany',
  'belongstoarray',
  'onetoone',
]);

const APPLY_BLUEPRINT_ASSOCIATION_FIELD_INTERFACES = new Set([
  'm2o',
  'o2m',
  'm2m',
  'o2o',
  'mbm',
  'obo',
  'oho',
  'manytoone',
  'onetomany',
  'manytomany',
]);

function getApplyBlueprintAssociationFieldRoot(value: any) {
  return String(value || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean)[0];
}

function isApplyBlueprintAssociationField(field: any) {
  if (!field) {
    return false;
  }
  if (getFieldTarget(field)) {
    return true;
  }
  const fieldType = String(getFieldType(field) || '').toLowerCase();
  if (APPLY_BLUEPRINT_ASSOCIATION_FIELD_TYPES.has(fieldType)) {
    return true;
  }
  const fieldInterface = String(getFieldInterface(field) || '').toLowerCase();
  return APPLY_BLUEPRINT_ASSOCIATION_FIELD_INTERFACES.has(fieldInterface);
}

function resolveApplyBlueprintAssociationFieldFromPath(collection: any, fieldPath?: string) {
  const normalizedFieldPath = normalizeMetadataText(fieldPath);
  if (!collection || !normalizedFieldPath) {
    return { field: undefined, associationPath: '' };
  }
  const field = resolveFieldFromCollection(collection, normalizedFieldPath);
  if (isApplyBlueprintAssociationField(field)) {
    return { field, associationPath: normalizedFieldPath };
  }
  const parentPath = normalizedFieldPath.includes('.')
    ? normalizedFieldPath.split('.').filter(Boolean).slice(0, -1).join('.')
    : '';
  if (!parentPath) {
    return { field, associationPath: normalizedFieldPath };
  }
  const parentField = resolveFieldFromCollection(collection, parentPath);
  return { field: parentField, associationPath: parentPath };
}

function resolveApplyBlueprintAssociationContext(input: {
  dataSourceKey?: string;
  sourceCollectionName?: string;
  associationField?: string;
  targetCollectionName?: string;
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver;
  requireAssociationField?: boolean;
}): FlowSurfaceCompileResourceContext | undefined {
  const sourceCollectionName = normalizeMetadataText(input.sourceCollectionName);
  const associationFieldPath = normalizeMetadataText(input.associationField);
  if (!sourceCollectionName || !associationFieldPath) {
    return undefined;
  }

  const dataSourceKey = normalizeMetadataText(input.dataSourceKey) || 'main';
  const sourceCollection = input.getCollection?.(dataSourceKey, sourceCollectionName);
  const { field, associationPath } = resolveApplyBlueprintAssociationFieldFromPath(
    sourceCollection,
    associationFieldPath,
  );
  if (input.requireAssociationField && !isApplyBlueprintAssociationField(field)) {
    return undefined;
  }
  const targetCollection = resolveFieldTargetCollection(field, dataSourceKey, input.getCollection);

  const targetCollectionName =
    normalizeMetadataText(input.targetCollectionName) ||
    normalizeMetadataText(getCollectionName(targetCollection)) ||
    normalizeMetadataText(getFieldTarget(field));
  const resolvedAssociationName = resolveAssociationNameFromField(
    field,
    associationPath.includes('.') ? undefined : sourceCollection,
  );
  return {
    dataSourceKey,
    surfaceCollectionName: targetCollectionName || undefined,
    associationName: resolvedAssociationName || `${sourceCollectionName}.${associationPath || associationFieldPath}`,
  };
}

function getApplyBlueprintBlockResourceObject(block?: FlowSurfaceApplyBlueprintBlockSpec) {
  return _.isPlainObject(block?.resource) ? (block.resource as FlowSurfaceReadableBlockResource) : undefined;
}

function getApplyBlueprintBlockBinding(block?: FlowSurfaceApplyBlueprintBlockSpec) {
  const resource = getApplyBlueprintBlockResourceObject(block);
  return normalizeMetadataText(block?.binding) || normalizeMetadataText(resource?.binding);
}

function getApplyBlueprintBlockDataSourceKey(
  block: FlowSurfaceApplyBlueprintBlockSpec | undefined,
  parentContext?: FlowSurfaceCompileResourceContext,
) {
  const resource = getApplyBlueprintBlockResourceObject(block);
  return (
    normalizeMetadataText(block?.dataSourceKey) ||
    normalizeMetadataText(resource?.dataSourceKey) ||
    parentContext?.dataSourceKey ||
    'main'
  );
}

function getApplyBlueprintBlockDirectCollection(block?: FlowSurfaceApplyBlueprintBlockSpec) {
  const resource = getApplyBlueprintBlockResourceObject(block);
  return normalizeMetadataText(block?.collection) || normalizeMetadataText(resource?.collectionName);
}

function getApplyBlueprintBlockExplicitAssociationName(block?: FlowSurfaceApplyBlueprintBlockSpec) {
  const resource = getApplyBlueprintBlockResourceObject(block);
  return normalizeMetadataText((block as any)?.associationName) || normalizeMetadataText(resource?.associationName);
}

function getApplyBlueprintBlockAssociationField(block: FlowSurfaceApplyBlueprintBlockSpec, context: string) {
  const resource = getApplyBlueprintBlockResourceObject(block);
  return (
    normalizeMetadataText(resource?.associationField) ||
    normalizeMetadataText(block.associationField) ||
    readAssociationFieldFromSingleSegmentPath(resource?.associationPathName, `${context}.resource`) ||
    readAssociationFieldFromSingleSegmentPath(block.associationPathName, context)
  );
}

function resolveApplyBlueprintBlockResourceContext(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  parentContext: FlowSurfaceCompileResourceContext | undefined,
  getCollection: FlowSurfaceApplyBlueprintCollectionResolver | undefined,
  context: string,
): FlowSurfaceCompileResourceContext {
  const dataSourceKey = getApplyBlueprintBlockDataSourceKey(block, parentContext);
  const directCollectionName = getApplyBlueprintBlockDirectCollection(block);
  const explicitAssociationName = getApplyBlueprintBlockExplicitAssociationName(block);
  if (explicitAssociationName) {
    return {
      dataSourceKey,
      surfaceCollectionName: directCollectionName || parentContext?.surfaceCollectionName,
      associationName: explicitAssociationName,
    };
  }

  const resource = getApplyBlueprintBlockResourceObject(block);
  const normalizedAssociatedRecords = getApplyBlueprintBlockBinding(block)
    ? normalizeAssociatedRecordsBindingFromAssociationPath(
        (resource || block) as Record<string, any>,
        resource ? `${context}.resource` : context,
      )
    : null;
  const binding = (normalizedAssociatedRecords?.binding || getApplyBlueprintBlockBinding(block)).toLowerCase();
  if (binding === 'associatedrecords') {
    const associationField =
      normalizedAssociatedRecords?.associationField || getApplyBlueprintBlockAssociationField(block, context);
    const associatedContext = resolveApplyBlueprintAssociationContext({
      dataSourceKey,
      sourceCollectionName: parentContext?.surfaceCollectionName,
      associationField,
      targetCollectionName: directCollectionName,
      getCollection,
    });
    return {
      dataSourceKey,
      surfaceCollectionName:
        directCollectionName || associatedContext?.surfaceCollectionName || parentContext?.surfaceCollectionName,
      associationName: associatedContext?.associationName || parentContext?.associationName,
    };
  }

  return {
    dataSourceKey,
    surfaceCollectionName: directCollectionName || parentContext?.surfaceCollectionName,
    associationName: parentContext?.associationName,
  };
}

function resolveApplyBlueprintFieldAssociationContext(input: {
  fieldPath?: string;
  parentContext: FlowSurfaceCompileResourceContext;
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver;
}) {
  return resolveApplyBlueprintAssociationContext({
    dataSourceKey: input.parentContext.dataSourceKey,
    sourceCollectionName: input.parentContext.surfaceCollectionName,
    associationField: input.fieldPath,
    getCollection: input.getCollection,
    requireAssociationField: true,
  });
}

function getApplyBlueprintFieldAssociationPath(input: FlowSurfaceApplyBlueprintFieldObjectSpec) {
  const associationPathName = readOptionalString(input.associationPathName);
  const fieldPath = readOptionalString(input.field);
  if (!associationPathName) {
    return fieldPath;
  }
  if (!fieldPath || fieldPath === associationPathName || fieldPath.startsWith(`${associationPathName}.`)) {
    return associationPathName;
  }
  return `${associationPathName}.${fieldPath}`;
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

function buildAutoCompiledFieldsLayout(fields: Array<Record<string, any>>, blockType?: string, collection?: any) {
  return buildFlowSurfaceAutoFieldGridLayout(
    fields.map((field) => ({
      key: readOptionalString(field?.key),
      type: readOptionalString(field?.type),
      fieldPath: readOptionalString(field?.fieldPath),
      associationPathName: readOptionalString(field?.associationPathName),
      fieldInterface: resolveFlowSurfaceFieldGridFieldInterface({
        collection,
        fieldPath: readOptionalString(field?.fieldPath),
        associationPathName: readOptionalString(field?.associationPathName),
      }),
    })),
    blockType,
  );
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

function buildAutoFieldGroupFieldPathsFromCollection(collection: any) {
  const fields = getCollectionFields(collection);
  const associationForeignKeys = new Set(
    fields
      .filter((field) => getFieldType(field) === 'belongsTo')
      .map((field) => String(field?.foreignKey || field?.options?.foreignKey || '').trim())
      .filter(Boolean),
  );
  return fields
    .filter((field) => {
      const name = getFieldName(field);
      if (!name || name === 'id') {
        return false;
      }
      if (associationForeignKeys.has(name)) {
        return false;
      }
      if (field?.hidden || field?.options?.hidden) {
        return false;
      }
      if (typeof field?.isAssociationField === 'function' && field.isAssociationField()) {
        return false;
      }
      const type = String(field?.type || field?.options?.type || '').trim();
      return !['belongsTo', 'hasOne', 'hasMany', 'belongsToMany', 'json', 'password'].includes(type);
    })
    .map((field) => getFieldName(field))
    .filter((name): name is string => !!name);
}

function buildAutoFieldGroupsFromCollection(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
): FlowSurfaceApplyBlueprintFieldGroupSpec[] | undefined {
  const blockType = readOptionalString(block.type);
  if (!APPLY_BLUEPRINT_FIELD_GROUP_BLOCK_TYPES.has(blockType || '')) {
    return undefined;
  }
  const collection = resolveBlueprintBlockCollection(block, getCollection);
  const fields = buildAutoFieldGroupFieldPathsFromCollection(collection);
  if (!fields.length) {
    return undefined;
  }
  return [
    {
      key: 'main',
      title: 'Main',
      fields,
    },
  ];
}

function resolveBlockFieldInputs(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  context: string,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
): Array<string | FlowSurfaceApplyBlueprintFieldObjectSpec> {
  const hasFields = Object.prototype.hasOwnProperty.call(block, 'fields');
  const hasFieldGroups = Object.prototype.hasOwnProperty.call(block, 'fieldGroups');
  if (hasFields && hasFieldGroups) {
    throwBadRequest(`${context} cannot mix fields with fieldGroups`);
  }
  if (!hasFieldGroups) {
    if (!hasFields) {
      const autoFieldGroups = buildAutoFieldGroupsFromCollection(block, getCollection);
      if (autoFieldGroups?.length) {
        return compileFieldGroups(autoFieldGroups, `${context}.fieldGroups`);
      }
    }
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

function attachDefaultActionPopupMetadata(
  popup: Record<string, any> | undefined,
  actionType: string | undefined,
  metadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
) {
  const defaultPopup = actionType === 'addChild' && _.isUndefined(popup) ? {} : popup;
  return attachCompiledPopupDefaults(defaultPopup, metadata);
}

function isFieldClickToOpenEnabled(settings: Record<string, any> | undefined) {
  if (!_.isPlainObject(settings) || !Object.prototype.hasOwnProperty.call(settings, 'clickToOpen')) {
    return false;
  }
  const value = settings.clickToOpen;
  return value === true || (_.isPlainObject(value) && value.clickToOpen === true);
}

function buildGeneratedDefaultFieldPopup(): FlowSurfaceApplyBlueprintPopup {
  return {
    tryTemplate: true,
    defaultType: 'view',
  };
}

function hasNestedDefaultPopupMetadata(value: any): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => hasNestedDefaultPopupMetadata(item));
  }
  if (!_.isPlainObject(value)) {
    return false;
  }
  const popup = value.popup;
  if (
    _.isPlainObject(popup) &&
    Object.prototype.hasOwnProperty.call(popup, FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY)
  ) {
    return true;
  }
  return Object.entries(value).some(([key, item]) => key !== 'popup' && hasNestedDefaultPopupMetadata(item));
}

function compilePopup(
  popup: FlowSurfaceApplyBlueprintPopup | undefined,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
  options: FlowSurfaceCompilePopupOptions = {},
): FlowSurfaceCompiledPopup {
  if (_.isUndefined(popup)) {
    return {};
  }
  if (!_.isPlainObject(popup)) {
    throwBadRequest(`${context} must be an object`);
  }
  assertOnlyAllowedKeys(popup, context, APPLY_BLUEPRINT_POPUP_ALLOWED_KEYS);
  const popupTitle = readOptionalString(popup.title);
  const popupMode = normalizeApplyBlueprintPopupMode(popup.mode, context);
  const template = ensureOptionalTemplate(popup.template, `${context}.template`);
  const hasTemplateReference = hasFlowSurfaceTemplateReference(template);
  const hasTemplateDocument = hasFlowSurfaceTemplateDocument(template);
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
  if (saveAsTemplate && hasTemplateReference) {
    throwBadRequest(`${context}.saveAsTemplate cannot be combined with ${context}.template`);
  }
  if (hasTemplateReference) {
    const openViewContext = buildPopupOpenViewContext(options);
    const openView = buildDefinedPayload({
      ...openViewContext,
      ...(popupMode.displayMode ? { mode: popupMode.displayMode } : {}),
    });
    return {
      popup: buildDefinedPayload({
        template,
        ...(Object.keys(openView).length ? { openView } : {}),
      }),
      popupTitle,
    };
  }
  const rawPopupBlocks = readOptionalItems<FlowSurfaceApplyBlueprintBlockSpec>(popup.blocks, `${context}.blocks`);
  const popupBlocks =
    options.ownerActionType === 'edit' && rawPopupBlocks.length
      ? normalizeEditPopupBlocks(rawPopupBlocks, context)
      : rawPopupBlocks;
  const isMultiBlockEditPopup = options.ownerActionType === 'edit' && popupBlocks.length > 1;
  const compiledBlocks = popupBlocks.length
    ? compileBlocks(
        popupBlocks,
        scopePrefix,
        assets,
        `${context}.blocks`,
        defaults,
        collectReferencedBlockKeys(popup.layout, `${context}.layout`),
        options.getCollection,
        {
          mode: options.mode,
          popupDepth: (options.popupDepth || 1) + 1,
          dataSourceKey: options.dataSourceKey,
          surfaceCollectionName: options.surfaceCollectionName,
          associationName: options.associationName,
        },
      )
    : { blocks: [], blockKeysByLocalKey: new Map<string, string>() };
  const hasNestedDefaultPopup = hasNestedDefaultPopupMetadata(compiledBlocks.blocks);
  const willAutoTryTemplate =
    _.isUndefined(popup.tryTemplate) &&
    options.mode === 'create' &&
    !hasTemplateDocument &&
    popupBlocks.length > 0 &&
    !isMultiBlockEditPopup &&
    !hasNestedDefaultPopup;
  if (saveAsTemplate && !popupBlocks.length && tryTemplate !== true && !willAutoTryTemplate) {
    throwBadRequest(`${context}.saveAsTemplate requires explicit popup.blocks`);
  }
  const layout =
    popupBlocks.length || popup.layout
      ? compileLayout(
          popup.layout || autoLayoutFromBlockKeys(compiledBlocks.blocks.map((block: any) => block.key)),
          compiledBlocks.blockKeysByLocalKey,
          `${context}.layout`,
        )
      : undefined;
  const autoSaveAsTemplate =
    _.isUndefined(saveAsTemplate) &&
    options.mode === 'create' &&
    !hasTemplateDocument &&
    popupBlocks.length > 0 &&
    !isMultiBlockEditPopup &&
    !hasNestedDefaultPopup
      ? buildApplyBlueprintAutoSaveTemplateMetadata(popup, options)
      : undefined;
  const effectiveTryTemplate = willAutoTryTemplate ? true : tryTemplate;
  const displayMode =
    popupMode.displayMode ||
    (shouldDefaultApplyBlueprintPopupDisplayPage(popup, popupBlocks, options)
      ? 'embed'
      : popupBlocks.length && (options.popupDepth || 1) > 1
        ? 'drawer'
        : undefined);
  const openViewContext = buildPopupOpenViewContext(options);
  const openView = buildDefinedPayload({
    ...openViewContext,
    ...(displayMode ? { mode: displayMode } : {}),
  });
  const compiledPopup = buildDefinedPayload({
    mode: popupMode.composeMode || (popupBlocks.length || layout ? 'replace' : undefined),
    template: hasTemplateDocument ? template : undefined,
    ...(Object.keys(openView).length ? { openView } : {}),
    ...(!_.isUndefined(effectiveTryTemplate) ? { tryTemplate: effectiveTryTemplate } : {}),
    ...(defaultType ? { defaultType } : {}),
    ...(saveAsTemplate || autoSaveAsTemplate ? { saveAsTemplate: saveAsTemplate || autoSaveAsTemplate } : {}),
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

function collectAIEmployeeWorkContextTargetKeys(value: any, context: string) {
  if (_.isUndefined(value) || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${context} must be an array`);
  }
  return value
    .map((item, index) => {
      if (!_.isPlainObject(item)) {
        throwBadRequest(`${context}[${index}] must be an object`);
      }
      if (!Object.prototype.hasOwnProperty.call(item, 'target')) {
        return '';
      }
      if (typeof item.target !== 'string') {
        throwBadRequest(`${context}[${index}].target must be 'self' or a string block key`);
      }
      const normalizedTarget = item.target.trim();
      if (!normalizedTarget || normalizedTarget === 'self') {
        return '';
      }
      return normalizeFlowSurfaceComposeKey(normalizedTarget, `${context}[${index}].target`);
    })
    .filter(Boolean);
}

function collectAIEmployeeActionSettingsTargetKeys(settings: any, context: string) {
  if (!_.isPlainObject(settings)) {
    return [];
  }
  const targets: string[] = [];
  if (Object.prototype.hasOwnProperty.call(settings, 'workContext')) {
    targets.push(...collectAIEmployeeWorkContextTargetKeys(settings.workContext, `${context}.workContext`));
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'tasks')) {
    if (!Array.isArray(settings.tasks)) {
      throwBadRequest(`${context}.tasks must be an array`);
    }
    settings.tasks.forEach((task: any, taskIndex: number) => {
      if (!_.isPlainObject(task)) {
        throwBadRequest(`${context}.tasks[${taskIndex}] must be an object`);
      }
      if (_.isPlainObject(task.message) && Object.prototype.hasOwnProperty.call(task.message, 'workContext')) {
        targets.push(
          ...collectAIEmployeeWorkContextTargetKeys(
            task.message.workContext,
            `${context}.tasks[${taskIndex}].message.workContext`,
          ),
        );
      }
    });
  }
  return targets;
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

function compileAIEmployeeWorkContextTargets(value: any, localBlockKeys: Map<string, string>, context: string) {
  if (_.isUndefined(value) || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throwBadRequest(`${context} must be an array`);
  }
  return value.map((item, index) => {
    if (!_.isPlainObject(item)) {
      throwBadRequest(`${context}[${index}] must be an object`);
    }
    if (!Object.prototype.hasOwnProperty.call(item, 'target')) {
      return item;
    }
    if (typeof item.target !== 'string') {
      throwBadRequest(`${context}[${index}].target must be 'self' or a string block key`);
    }
    const normalizedTarget = item.target.trim();
    if (!normalizedTarget || normalizedTarget === 'self') {
      return item;
    }
    return {
      ...item,
      target: resolveTargetBlockKey(item.target, localBlockKeys, `${context}[${index}].target`),
    };
  });
}

function compileAIEmployeeActionSettingsTargets(
  settings: Record<string, any>,
  localBlockKeys: Map<string, string>,
  context: string,
) {
  if (!_.isPlainObject(settings)) {
    return settings;
  }
  let nextSettings = settings;
  if (Object.prototype.hasOwnProperty.call(settings, 'workContext')) {
    nextSettings = nextSettings === settings ? _.cloneDeep(settings) : nextSettings;
    nextSettings.workContext = compileAIEmployeeWorkContextTargets(
      settings.workContext,
      localBlockKeys,
      `${context}.settings.workContext`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(settings, 'tasks')) {
    if (!Array.isArray(settings.tasks)) {
      throwBadRequest(`${context}.settings.tasks must be an array`);
    }
    nextSettings = nextSettings === settings ? _.cloneDeep(settings) : nextSettings;
    nextSettings.tasks = settings.tasks.map((task: any, taskIndex: number) => {
      if (!_.isPlainObject(task)) {
        throwBadRequest(`${context}.settings.tasks[${taskIndex}] must be an object`);
      }
      if (!_.isPlainObject(task.message) || !Object.prototype.hasOwnProperty.call(task.message, 'workContext')) {
        return task;
      }
      return {
        ...task,
        message: {
          ...task.message,
          workContext: compileAIEmployeeWorkContextTargets(
            task.message.workContext,
            localBlockKeys,
            `${context}.settings.tasks[${taskIndex}].message.workContext`,
          ),
        },
      };
    });
  }
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
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
  popupOptions: FlowSurfaceCompilePopupOptions = {},
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
  const parentResourceContext: FlowSurfaceCompileResourceContext = {
    dataSourceKey: popupOptions.dataSourceKey,
    surfaceCollectionName: popupOptions.surfaceCollectionName,
    associationName: popupOptions.associationName,
  };
  const fieldAssociationContext = resolveApplyBlueprintFieldAssociationContext({
    fieldPath: getApplyBlueprintFieldAssociationPath(input),
    parentContext: parentResourceContext,
    getCollection,
  });
  const shouldAutoCompleteClickPopup = _.isUndefined(input.popup) && isFieldClickToOpenEnabled(settings);
  const popupInput = shouldAutoCompleteClickPopup ? buildGeneratedDefaultFieldPopup() : input.popup;
  const shouldAutoRelationFieldPopup = _.isUndefined(input.popup) && !!fieldPath && !syntheticType;
  const popupResult = compilePopup(popupInput, `${key}.popup`, assets, `${context}[${index}].popup`, defaults, {
    getCollection,
    mode: popupOptions.mode,
    popupDepth: popupOptions.popupDepth,
    triggerKind: 'field',
    triggerLabel: input.label || input.field || input.key,
    hostBlock: popupOptions.hostBlock,
    dataSourceKey: fieldAssociationContext?.dataSourceKey || popupOptions.dataSourceKey,
    surfaceCollectionName: fieldAssociationContext?.surfaceCollectionName || popupOptions.surfaceCollectionName,
    associationName: fieldAssociationContext?.associationName || popupOptions.associationName,
  });
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  const popup = shouldAttachDefaultPopupMetadata(popupInput, undefined)
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
    titleField: readOptionalString((input as any).titleField),
    openMode: readOptionalString((input as any).openMode),
    popupSize: readOptionalString((input as any).popupSize),
    pageSize: (input as any).pageSize,
    showIndex: (input as any).showIndex,
    target: resolveTargetBlockKey(input.target, localBlockKeys, `${context}[${index}].target`),
    settings: Object.keys(settings).length ? settings : undefined,
    popup,
    __autoPopupForRelationField: shouldAutoRelationFieldPopup ? true : undefined,
    ...(shouldAutoRelationFieldPopup && popupDefaultsMetadata
      ? { [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: _.cloneDeep(popupDefaultsMetadata) }
      : {}),
  });
}

function compileAction(
  input: FlowSurfaceApplyBlueprintActionSpec,
  index: number,
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  localBlockKeys: Map<string, string>,
  context: string,
  popupDefaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
  options: {
    avoidKeys?: Set<string>;
    generatedConflictPrefix?: string;
    popupOptions?: FlowSurfaceCompilePopupOptions;
    triggerKind?: 'action' | 'recordAction';
  } = {},
) {
  const buildActionKey = (localKey: string, isExplicit: boolean, keyContext: string) => {
    const key = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, localKey), keyContext);
    const avoidKeys = options.avoidKeys;
    if (!avoidKeys?.has(key)) {
      return key;
    }
    if (isExplicit) {
      throwBadRequest(`${keyContext} '${key}' duplicates an action key in the same block`);
    }
    const prefix = options.generatedConflictPrefix
      ? normalizeFlowSurfaceComposeKey(options.generatedConflictPrefix, keyContext)
      : undefined;
    const baseLocalKey = prefix ? `${prefix}_${localKey}` : localKey;
    let candidate = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, baseLocalKey), keyContext);
    let suffix = 2;
    while (avoidKeys.has(candidate)) {
      candidate = normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, `${baseLocalKey}_${suffix}`), keyContext);
      suffix += 1;
    }
    return candidate;
  };

  if (typeof input === 'string') {
    const type = assertNonEmptyString(input, `${context}[${index}]`);
    const localKey = normalizeBlueprintLocalKey(undefined, `${type}_${index + 1}`, `${context}[${index}]`);
    const defaultPopup = APPLY_BLUEPRINT_DEFAULT_POPUP_ACTION_TYPES.has(type)
      ? attachDefaultActionPopupMetadata(undefined, type, popupDefaultsMetadata)
      : undefined;
    return {
      key: buildActionKey(localKey, false, `${context}[${index}]`),
      type,
      ...(defaultPopup ? { popup: defaultPopup } : {}),
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`${context}[${index}] must be a string or object`);
  }
  assertOnlyAllowedKeys(input, `${context}[${index}]`, APPLY_BLUEPRINT_ACTION_ALLOWED_KEYS);
  const type = assertNonEmptyString(input.type, `${context}[${index}].type`);
  const hasExplicitKey = readOptionalString(input.key);
  const localKey = normalizeBlueprintLocalKey(input.key, `${type}_${index + 1}`, `${context}[${index}].key`);
  const key = buildActionKey(localKey, !!hasExplicitKey, `${context}[${index}].key`);
  let settings = resolveAssetSettings(input.settings, input, assets, `${context}[${index}]`);
  if (type !== AI_EMPLOYEE_ACTION_TYPE && readOptionalString(input.title) && _.isUndefined(settings.title)) {
    settings.title = readOptionalString(input.title);
  }
  if (type === AI_EMPLOYEE_ACTION_TYPE) {
    settings = compileAIEmployeeActionSettingsTargets(settings, localBlockKeys, `${context}[${index}]`);
  }
  const popupResult = compilePopup(input.popup, `${key}.popup`, assets, `${context}[${index}].popup`, defaults, {
    ownerActionType: type,
    getCollection,
    mode: options.popupOptions?.mode,
    popupDepth: options.popupOptions?.popupDepth,
    triggerKind: options.triggerKind,
    triggerLabel: input.title || input.key || input.type,
    hostBlock: options.popupOptions?.hostBlock,
    dataSourceKey: options.popupOptions?.dataSourceKey,
    surfaceCollectionName: options.popupOptions?.surfaceCollectionName,
    associationName: options.popupOptions?.associationName,
  });
  settings = resolvePopupTitleSettings(settings, popupResult.popupTitle);
  const popup = shouldAttachDefaultPopupMetadata(input.popup, type)
    ? attachDefaultActionPopupMetadata(popupResult.popup, type, popupDefaultsMetadata)
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
  popupOptions: FlowSurfaceCompilePopupOptions = {},
) {
  const descriptorPopup = descriptor.popup ? _.cloneDeep(descriptor.popup) : undefined;
  let popup = descriptorPopup;
  const openViewContext = buildPopupOpenViewContext(popupOptions);
  if (popup && Object.keys(openViewContext).length) {
    popup = {
      ...popup,
      openView: buildDefinedPayload({
        ...openViewContext,
        ...(_.isPlainObject(popup.openView) ? popup.openView : {}),
      }),
    };
  }
  popup = shouldAttachDefaultPopupMetadata(popup, descriptor.type)
    ? attachCompiledPopupDefaults(popup, popupDefaultsMetadata)
    : undefined;
  const localKey = descriptor.type === 'submit' ? 'submitAction' : `${descriptor.type}_default_${index + 1}`;
  return buildDefinedPayload({
    key: normalizeFlowSurfaceComposeKey(buildScopedKey(scopePrefix, localKey), `${context}[${index}]`),
    type: descriptor.type,
    popup,
  });
}

function shouldStripSingleScopeApplyBlueprintDataBlockTitle(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  rawBlocks: FlowSurfaceApplyBlueprintBlockSpec[],
) {
  if (!isFlowSurfaceNonTemplateTitleCleanupDataBlock(block)) {
    return false;
  }
  return countFlowSurfaceNonTemplateTitleCleanupDataBlocks(rawBlocks) === 1;
}

function isTreeCollection(collection?: any) {
  return collection?.template === 'tree' || collection?.options?.template === 'tree' || collection?.tree === true;
}

function resolveTreeChildrenFieldName(collection?: any) {
  const field = getCollectionFields(collection).find(
    (candidate) => candidate?.treeChildren === true || candidate?.options?.treeChildren === true,
  );
  return getFieldName(field);
}

function canInjectTreeTableAddChildDefault(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
) {
  if (!getCollection) {
    return false;
  }
  const resource = _.isPlainObject(block.resource) ? block.resource : undefined;
  const dataSourceKey =
    readOptionalString(block.dataSourceKey) || readOptionalString(resource?.dataSourceKey) || 'main';
  const collectionName = readOptionalString(block.collection) || readOptionalString(resource?.collectionName);
  if (!collectionName) {
    return false;
  }
  const collection = getCollection(dataSourceKey, collectionName);
  if (!collection) {
    return false;
  }
  if (!isTreeCollection(collection)) {
    return false;
  }
  return !!resolveTreeChildrenFieldName(collection);
}

function resolveBlueprintBlockCollection(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
) {
  if (!getCollection) {
    return null;
  }
  const resource = _.isPlainObject(block.resource) ? block.resource : undefined;
  const dataSourceKey =
    readOptionalString(block.dataSourceKey) || readOptionalString(resource?.dataSourceKey) || 'main';
  const collectionName = readOptionalString(block.collection) || readOptionalString(resource?.collectionName);
  if (!collectionName) {
    return null;
  }
  return getCollection(dataSourceKey, collectionName);
}

function hasExplicitAddChildRecordAction(recordActions: any[]) {
  return recordActions.some((action) => {
    if (typeof action === 'string') {
      return action.trim() === 'addChild';
    }
    return readOptionalString(action?.type) === 'addChild';
  });
}

function buildTreeTableAddChildDefaultAction(
  scopePrefix: string,
  context: string,
  index: number,
  popupDefaultsMetadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
  popupOptions: FlowSurfaceCompilePopupOptions = {},
) {
  const descriptorPopup = {
    tryTemplate: true,
    [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
  };
  return compileInjectedDefaultAction(
    {
      type: 'addChild',
      scope: 'recordActions',
      popup: descriptorPopup,
    },
    scopePrefix,
    context,
    index,
    popupDefaultsMetadata,
    popupOptions,
  );
}

function compileBlocks(
  input: FlowSurfaceApplyBlueprintBlockSpec[],
  scopePrefix: string,
  assets: FlowSurfaceApplyBlueprintAssets,
  context: string,
  defaults?: FlowSurfaceApplyBlueprintDefaults,
  requiredExplicitBlockKeys: Set<string> = new Set(),
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
  options: {
    mode?: FlowSurfaceApplyBlueprintMode;
    popupDepth?: number;
    dataSourceKey?: string;
    surfaceCollectionName?: string;
    associationName?: string;
  } = {},
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
    const fields = resolveBlockFieldInputs(block, `${context}[${index}]`, getCollection);
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
    const collectActionTargets = (items: any[], slot: 'actions' | 'recordActions') => {
      items.forEach((action: any, actionIndex: number) => {
        if (readApplyBlueprintActionType(action) !== AI_EMPLOYEE_ACTION_TYPE || !_.isPlainObject(action)) {
          return;
        }
        collectAIEmployeeActionSettingsTargetKeys(
          action.settings,
          `${context}[${index}].${slot}[${actionIndex}]`,
        ).forEach((targetKey) => referencedBlockKeys.add(targetKey));
      });
    };
    collectActionTargets(readOptionalItems(block.actions, `${context}[${index}].actions`), 'actions');
    collectActionTargets(readOptionalItems(block.recordActions, `${context}[${index}].recordActions`), 'recordActions');
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
    const blockType = readOptionalString(block.type);
    const parentResourceContext: FlowSurfaceCompileResourceContext = {
      dataSourceKey: options.dataSourceKey,
      surfaceCollectionName: options.surfaceCollectionName,
      associationName: options.associationName,
    };
    const blockResourceContext = resolveApplyBlueprintBlockResourceContext(
      block,
      parentResourceContext,
      getCollection,
      blockContext,
    );
    const stripSingleScopeTitle = shouldStripSingleScopeApplyBlueprintDataBlockTitle(block, rawBlocks);
    let settings = resolveAssetSettings(block.settings, block, assets, blockContext);
    settings = normalizeApplyBlueprintCalendarCompatSettings(block, settings);
    if (!stripSingleScopeTitle && readOptionalString(block.title) && _.isUndefined(settings.title)) {
      settings.title = readOptionalString(block.title);
    }
    if (stripSingleScopeTitle && Object.prototype.hasOwnProperty.call(settings, 'title')) {
      delete settings.title;
    }
    if (readOptionalString(block.description) && _.isUndefined(settings.description)) {
      settings.description = readOptionalString(block.description);
    }
    if (!_.isUndefined(block.height) && _.isUndefined(settings.height)) {
      settings.height = block.height;
    }
    if (!_.isUndefined(block.heightMode) && _.isUndefined(settings.heightMode)) {
      settings.heightMode = block.heightMode;
    }
    settings = normalizeFlowSurfacePublicSortingAlias({
      context: `${blockContext}.settings`,
      type: blockType,
      settings,
    });
    settings = normalizeApplyBlueprintTreeTableDragSortBy(block, settings, getCollection);
    if (blockType === 'calendar') {
      settings = normalizeApplyBlueprintCalendarPopupSettings(settings, blockContext, popupDefaultsMetadata);
    } else if (blockType === 'kanban') {
      settings = normalizeApplyBlueprintKanbanPopupSettings(settings, blockContext, popupDefaultsMetadata);
    }
    const template = ensureOptionalTemplate(block.template, `${blockContext}.template`);
    const isTemplateBackedBlock = hasFlowSurfaceTemplateReference(template);
    const explicitBlockDefaultFilter = normalizeFlowSurfacePublicBlockDefaultFilter(
      'applyBlueprint',
      block.defaultFilter,
      {
        blockType,
        template,
        path: blockContext,
      },
    );
    const blockDefaultFilter = !_.isUndefined(explicitBlockDefaultFilter)
      ? explicitBlockDefaultFilter
      : buildApplyBlueprintDefaultFilter(block, blockType, template, getCollection);
    const effectiveBlockDefaultFilter = !_.isUndefined(blockDefaultFilter)
      ? clampFlowSurfaceDefaultFilterToCandidateLimit(blockDefaultFilter)
      : undefined;
    if (!_.isUndefined(effectiveBlockDefaultFilter)) {
      assertFlowSurfaceConcreteDefaultFilterItem('applyBlueprint', effectiveBlockDefaultFilter, {
        path: blockContext,
      });
    }
    const rawFieldInputs = resolveBlockFieldInputs(block, blockContext, getCollection);
    const fieldGridCollection =
      getCollection && blockResourceContext.surfaceCollectionName
        ? getCollection(blockResourceContext.dataSourceKey || 'main', blockResourceContext.surfaceCollectionName)
        : null;
    const fieldInputs = reorderApplyBlueprintTreeTableExplicitFields({
      blockType,
      settings,
      template,
      block,
      fields: rawFieldInputs,
      collection: fieldGridCollection,
      getCollection,
      context: blockContext,
    });
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
        getCollection,
        {
          mode: options.mode,
          popupDepth: options.popupDepth || 1,
          hostBlock: block,
          dataSourceKey: blockResourceContext.dataSourceKey,
          surfaceCollectionName: blockResourceContext.surfaceCollectionName,
          associationName: blockResourceContext.associationName,
        },
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
      : buildAutoCompiledFieldsLayout(fields, readOptionalString(block.type), fieldGridCollection);
    const { actions, recordActions } = splitApplyBlueprintBlockActionsByScope(block, blockContext);
    const explicitActions = actions.map((action, actionIndex) =>
      compileAction(
        action,
        actionIndex,
        key,
        assets,
        blockKeysByLocalKey,
        `${blockContext}.actions`,
        popupDefaultsMetadata,
        defaults,
        getCollection,
        {
          popupOptions: {
            mode: options.mode,
            popupDepth: options.popupDepth || 1,
            hostBlock: block,
            dataSourceKey: blockResourceContext.dataSourceKey,
            surfaceCollectionName: blockResourceContext.surfaceCollectionName,
            associationName: blockResourceContext.associationName,
          },
          triggerKind: 'action',
        },
      ),
    );
    const explicitActionKeys = new Set(explicitActions.map((action) => action.key).filter(Boolean));
    const explicitRecordActions = recordActions.map((action, actionIndex) =>
      compileAction(
        action,
        actionIndex,
        key,
        assets,
        blockKeysByLocalKey,
        `${blockContext}.recordActions`,
        popupDefaultsMetadata,
        defaults,
        getCollection,
        {
          avoidKeys: explicitActionKeys,
          generatedConflictPrefix: 'record',
          popupOptions: {
            mode: options.mode,
            popupDepth: options.popupDepth || 1,
            hostBlock: block,
            dataSourceKey: blockResourceContext.dataSourceKey,
            surfaceCollectionName: blockResourceContext.surfaceCollectionName,
            associationName: blockResourceContext.associationName,
          },
          triggerKind: 'recordAction',
        },
      ),
    );
    const shouldInjectAddChild = isApplyBlueprintTreeTableBlock(blockType, settings, template, block, getCollection);
    const injectedActionIndexes = {
      actions: explicitActions.length,
      recordActions: explicitRecordActions.length,
    };
    const mergedActions = mergeFlowSurfaceDefaultBlockActions({
      blockType,
      template,
      actions: explicitActions,
      recordActions: explicitRecordActions,
      mergeRecordActionDefaults: !shouldInjectAddChild,
      createAction: (descriptor) =>
        compileInjectedDefaultAction(
          descriptor,
          key,
          `${blockContext}.${descriptor.scope}`,
          injectedActionIndexes[descriptor.scope]++,
          popupDefaultsMetadata,
          {
            mode: options.mode,
            popupDepth: options.popupDepth || 1,
            hostBlock: block,
            dataSourceKey: blockResourceContext.dataSourceKey,
            surfaceCollectionName: blockResourceContext.surfaceCollectionName,
            associationName: blockResourceContext.associationName,
          },
        ),
    });
    const finalRecordActions =
      blockType === 'table' && shouldInjectAddChild && !hasExplicitAddChildRecordAction(mergedActions.recordActions)
        ? [
            ...mergedActions.recordActions,
            buildTreeTableAddChildDefaultAction(
              key,
              `${blockContext}.recordActions`,
              injectedActionIndexes.recordActions++,
              popupDefaultsMetadata,
              {
                mode: options.mode,
                popupDepth: options.popupDepth || 1,
                hostBlock: block,
                dataSourceKey: blockResourceContext.dataSourceKey,
                surfaceCollectionName: blockResourceContext.surfaceCollectionName,
                associationName: blockResourceContext.associationName,
              },
            ),
          ]
        : mergedActions.recordActions;
    const actionsWithDefaultFilter = backfillFlowSurfaceFilterActionDefaultFilter(
      mergedActions.actions,
      effectiveBlockDefaultFilter,
    );
    return buildDefinedPayload({
      key,
      type: isTemplateBackedBlock ? undefined : blockType,
      resource: isTemplateBackedBlock
        ? undefined
        : buildBlockResource(block, blockContext, blockResourceContext, blockType),
      template,
      defaultFilter: !isTemplateBackedBlock ? effectiveBlockDefaultFilter : undefined,
      settings: Object.keys(settings).length
        ? compileTreeConnectSettingsTargets(settings, blockKeysByLocalKey, blockContext)
        : undefined,
      fields: isTemplateBackedBlock || blockType === 'calendar' || blockType === 'tree' ? undefined : fields,
      fieldsLayout:
        isTemplateBackedBlock || blockType === 'calendar' || blockType === 'kanban' || blockType === 'tree'
          ? undefined
          : fieldsLayout,
      actions: isTemplateBackedBlock || blockType === 'tree' ? undefined : actionsWithDefaultFilter,
      recordActions:
        isTemplateBackedBlock || blockType === 'calendar' || blockType === 'kanban' || blockType === 'tree'
          ? undefined
          : finalRecordActions,
    });
  });

  return {
    blocks,
    blockKeysByLocalKey,
  };
}

function buildApplyBlueprintDefaultFilter(
  block: FlowSurfaceApplyBlueprintBlockSpec,
  blockType: string | undefined,
  template: unknown,
  getCollection?: FlowSurfaceApplyBlueprintCollectionResolver,
) {
  if (
    !blockType ||
    !isFlowSurfacePublicDataSurfaceBlockType(blockType) ||
    hasFlowSurfaceTemplateDocument(template) ||
    !getCollection
  ) {
    return undefined;
  }
  const collection = resolveBlueprintBlockCollection(block, getCollection);
  return buildFlowSurfaceDefaultFilterFromCollection(collection);
}

export function compileTabComposeValues(
  tab: FlowSurfaceApplyBlueprintTabDocument,
  document: FlowSurfaceApplyBlueprintDocument,
  tabIndex: number,
  options: {
    mode: 'append' | 'replace';
    getCollection?: FlowSurfaceApplyBlueprintCollectionResolver;
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
    options.getCollection,
    {
      mode: document.mode,
    },
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
    defaults: document.defaults,
  });
}
