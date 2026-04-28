/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils';
import _ from 'lodash';
import { getConfigureOptionKeysForUse } from './configure-options';
import {
  FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY,
  type FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
} from './blueprint/defaults';
import {
  isFlowSurfaceError,
  normalizeFlowSurfaceError,
  throwBadRequest,
  throwConflict,
  throwForbidden,
  throwInternalError,
} from './errors';
import { getFieldInterface } from './service-helpers';
import type { FlowSurfaceNodeSpec, FlowSurfaceNodeSubModel } from './types';
import { FLOW_SURFACE_RESERVED_KEYS } from './planning/key-registry';
import {
  assertNoInternalFieldKeys,
  normalizePublicFieldNameList,
  normalizePublicFieldType,
  type FlowSurfacePublicRelationFieldType,
} from './field-type-resolver';

export function buildDefinedPayload(payload: Record<string, any>) {
  return _.pickBy(payload, (value) => !_.isUndefined(value));
}

export function normalizeFlowSurfaceComposeKey(key: any, context: string) {
  const normalized = typeof key === 'string' ? key.trim() : String(key || '').trim();
  if (!normalized) {
    throwBadRequest(`${context} key cannot be empty`);
  }
  if (FLOW_SURFACE_RESERVED_KEYS.has(normalized)) {
    throwBadRequest(`${context} key '${normalized}' is reserved`);
  }
  return normalized;
}

export function assertFlowSurfaceComposeUniqueKeys(
  items: Array<{
    key?: string;
  }>,
  context: string,
) {
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const key = typeof item?.key === 'string' ? item.key.trim() : '';
    if (!key) {
      return;
    }
    const previousIndex = seen.get(key);
    if (previousIndex) {
      throwBadRequest(`${context} key '${key}' is duplicated at #${previousIndex} and #${index + 1}`);
    }
    seen.set(key, index + 1);
  });
}

export function normalizeChartCardSettings(cardSettings: any) {
  if (!_.isPlainObject(cardSettings)) {
    return {};
  }

  const nextCardSettings = _.cloneDeep(cardSettings);
  const titleDescription = normalizeBlockTitleDescription(_.get(nextCardSettings, ['titleDescription']));
  if (titleDescription) {
    _.set(nextCardSettings, ['titleDescription'], titleDescription);
  } else {
    _.unset(nextCardSettings, ['titleDescription']);
  }

  const rawHeightMode = _.get(nextCardSettings, ['blockHeight', 'heightMode']);
  const rawHeight = _.get(nextCardSettings, ['blockHeight', 'height']);
  const normalizedHeightMode = _.isUndefined(rawHeightMode)
    ? !_.isUndefined(rawHeight)
      ? 'specifyValue'
      : undefined
    : normalizeChartCardHeightModeForWrite(rawHeightMode);
  if (normalizedHeightMode) {
    _.set(nextCardSettings, ['blockHeight', 'heightMode'], normalizedHeightMode);
    if (normalizedHeightMode === 'specifyValue' && !_.isUndefined(rawHeight)) {
      _.set(nextCardSettings, ['blockHeight', 'height'], rawHeight);
    } else {
      _.unset(nextCardSettings, ['blockHeight', 'height']);
    }
  } else {
    _.unset(nextCardSettings, ['blockHeight']);
  }

  if (_.isEmpty(_.get(nextCardSettings, ['blockHeight']))) {
    _.unset(nextCardSettings, ['blockHeight']);
  }

  return nextCardSettings;
}

export function normalizeBlockTitleDescriptionValue(value: any) {
  if (_.isNull(value)) {
    return '';
  }
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeBlockTitleDescription(titleDescription: any) {
  if (!_.isPlainObject(titleDescription)) {
    return undefined;
  }

  const nextTitleDescription = _.cloneDeep(titleDescription);
  const title = normalizeBlockTitleDescriptionValue(nextTitleDescription.title);
  const description = normalizeBlockTitleDescriptionValue(nextTitleDescription.description);

  if (title) {
    nextTitleDescription.title = title;
  } else {
    delete nextTitleDescription.title;
  }

  if (description) {
    nextTitleDescription.description = description;
  } else {
    delete nextTitleDescription.description;
  }

  return Object.keys(nextTitleDescription).length ? nextTitleDescription : undefined;
}

export function buildBlockTitleDescriptionFromSemanticChanges(changes: Record<string, any>) {
  if (!hasDefinedValue(changes, ['title', 'description'])) {
    return undefined;
  }

  return {
    titleDescription: buildDefinedPayload({
      ...(hasOwnDefined(changes, 'title') ? { title: normalizeBlockTitleDescriptionValue(changes.title) } : {}),
      ...(hasOwnDefined(changes, 'description')
        ? { description: normalizeBlockTitleDescriptionValue(changes.description) }
        : {}),
    }),
  };
}

export function buildBlockCardSettingsFromSemanticChanges(changes: Record<string, any>) {
  const nextCardSettings = buildBlockTitleDescriptionFromSemanticChanges(changes) || {};
  const hasHeightPatch = hasOwnDefined(changes, 'height') || hasOwnDefined(changes, 'heightMode');

  if (hasHeightPatch) {
    const nextHeightMode = hasOwnDefined(changes, 'heightMode')
      ? normalizePublicBlockHeightMode(changes.heightMode)
      : hasOwnDefined(changes, 'height')
        ? 'specifyValue'
        : undefined;

    if (nextHeightMode) {
      _.set(nextCardSettings, ['blockHeight', 'heightMode'], nextHeightMode);
      if (nextHeightMode === 'specifyValue' && hasOwnDefined(changes, 'height')) {
        _.set(nextCardSettings, ['blockHeight', 'height'], changes.height);
      } else {
        _.unset(nextCardSettings, ['blockHeight', 'height']);
      }
    }
  }

  if (_.isEmpty(_.get(nextCardSettings, ['blockHeight']))) {
    _.unset(nextCardSettings, ['blockHeight']);
  }

  return Object.keys(nextCardSettings).length ? nextCardSettings : undefined;
}

export function buildChartCardSettingsFromSemanticChanges(currentCardSettings: any, changes: Record<string, any>) {
  const nextCardSettings = _.cloneDeep(currentCardSettings || {});

  const currentTitleDescription = _.get(currentCardSettings, ['titleDescription']);
  const nextTitleDescription = normalizeBlockTitleDescription(
    buildDefinedPayload({
      title: hasOwnDefined(changes, 'title')
        ? normalizeBlockTitleDescriptionValue(changes.title)
        : _.get(currentTitleDescription, ['title']),
      description: hasOwnDefined(changes, 'description')
        ? normalizeBlockTitleDescriptionValue(changes.description)
        : _.get(currentTitleDescription, ['description']),
    }),
  );

  if (nextTitleDescription) {
    _.set(nextCardSettings, ['titleDescription'], nextTitleDescription);
  } else {
    _.unset(nextCardSettings, ['titleDescription']);
  }

  const currentHeight = _.get(currentCardSettings, ['blockHeight', 'height']);
  const nextHeight = hasOwnDefined(changes, 'height') ? changes.height : currentHeight;
  const currentHeightMode = normalizeStoredChartCardHeightMode(
    _.get(currentCardSettings, ['blockHeight', 'heightMode']),
  );
  const nextHeightMode = hasOwnDefined(changes, 'heightMode')
    ? normalizePublicBlockHeightMode(changes.heightMode)
    : hasOwnDefined(changes, 'height')
      ? !_.isUndefined(nextHeight)
        ? 'specifyValue'
        : undefined
      : currentHeightMode ?? (!_.isUndefined(nextHeight) ? 'specifyValue' : undefined);

  if (nextHeightMode) {
    _.set(nextCardSettings, ['blockHeight', 'heightMode'], nextHeightMode);
    if (nextHeightMode === 'specifyValue' && !_.isUndefined(nextHeight)) {
      _.set(nextCardSettings, ['blockHeight', 'height'], nextHeight);
    } else {
      _.unset(nextCardSettings, ['blockHeight', 'height']);
    }
  } else {
    _.unset(nextCardSettings, ['blockHeight']);
  }

  if (_.isEmpty(_.get(nextCardSettings, ['blockHeight']))) {
    _.unset(nextCardSettings, ['blockHeight']);
  }

  return normalizeChartCardSettings(nextCardSettings);
}

export function buildPopupTabTree(options: {
  tabUid?: string;
  gridUid?: string;
  title?: string;
  icon?: string;
  documentTitle?: string;
  flowRegistry?: Record<string, any>;
}) {
  const tabUid = options.tabUid || uid();
  const gridUid = options.gridUid || uid();
  const title = options.title || 'Untitled';

  return {
    uid: tabUid,
    use: 'ChildPageTabModel',
    props: buildDefinedPayload({
      title,
      icon: options.icon,
    }),
    stepParams: {
      pageTabSettings: {
        tab: buildDefinedPayload({
          title,
          icon: options.icon,
          documentTitle: options.documentTitle,
        }),
      },
    },
    ...(typeof options.flowRegistry !== 'undefined' ? { flowRegistry: _.cloneDeep(options.flowRegistry) } : {}),
    subModels: {
      grid: {
        uid: gridUid,
        use: 'BlockGridModel',
      },
    },
  };
}

export function getSingleNodeSubModel(subModel?: FlowSurfaceNodeSubModel | null): FlowSurfaceNodeSpec | undefined {
  if (!subModel || Array.isArray(subModel)) {
    return undefined;
  }
  return subModel;
}

export function getNodeSubModelList(subModel?: FlowSurfaceNodeSubModel | null): FlowSurfaceNodeSpec[] {
  if (!subModel) {
    return [];
  }
  return Array.isArray(subModel) ? subModel : [subModel];
}

export function flattenModel(node: any, carry: Record<string, any> = {}) {
  if (!node?.uid) {
    return carry;
  }
  carry[node.uid] = {
    uid: node.uid,
    use: node.use,
    props: node.props,
    decoratorProps: node.decoratorProps,
    stepParams: node.stepParams,
    flowRegistry: node.flowRegistry,
    ...(node.template ? { template: node.template } : {}),
    ...(node.fieldsTemplate ? { fieldsTemplate: node.fieldsTemplate } : {}),
    ...(node.popup ? { popup: node.popup } : {}),
  };
  Object.values(node.subModels || {}).forEach((value) => {
    _.castArray(value as any).forEach((child) => flattenModel(child, carry));
  });
  return carry;
}

export function buildDefaultFieldState(containerUse: string, fieldUse: string, field: any) {
  const bindingDefaults = getFieldBindingDefaultProps(containerUse, fieldUse, field);
  return {
    wrapperProps: {},
    fieldProps: _.cloneDeep(bindingDefaults),
  };
}

export function hasOwnDefined(input: Record<string, any>, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key) && !_.isUndefined(input[key]);
}

export function hasMeaningfulChartSemanticPatch(input: Record<string, any>, key: string) {
  if (!Object.prototype.hasOwnProperty.call(input, key)) {
    return false;
  }
  const value = input[key];
  if (_.isNull(value)) {
    return true;
  }
  if (_.isPlainObject(value)) {
    return Object.keys(value).length > 0;
  }
  return !_.isUndefined(value);
}

export function hasDefinedValue(input: Record<string, any>, keys: string[]) {
  return keys.some((key) => hasOwnDefined(input, key));
}

export function ensureNoRawSimpleChangeKeys(changes: Record<string, any>) {
  const rawKeys = [
    'props',
    'decoratorProps',
    'stepParams',
    'flowRegistry',
    'use',
    'fieldUse',
    'fieldComponent',
    'fieldModel',
    'componentFields',
    'subModels',
  ];
  const forbidden = Object.keys(changes).filter((key) => rawKeys.includes(key));
  if (forbidden.length) {
    throwBadRequest(
      `flowSurfaces configure does not accept raw keys: ${forbidden.join(
        ', ',
      )}; use catalog.configureOptions and configure.changes instead`,
    );
  }
}

export function ensureNoRawDirectAddKeys(actionName: string, values: Record<string, any>, rawKeys: string[]) {
  const forbidden = rawKeys.filter((key) => hasOwnDefined(values || {}, key));
  if (!forbidden.length) {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} does not accept raw keys: ${forbidden.join(
      ', ',
    )}; use settings with catalog.configureOptions or fall back to updateSettings/apply for low-level control`,
  );
}

export function ensureNoDirectActionScopeKey(actionName: 'addAction' | 'addRecordAction', values: Record<string, any>) {
  if (_.isUndefined(values?.scope)) {
    return;
  }
  throwBadRequest(
    `flowSurfaces ${actionName} does not support scope; use addAction for non-record actions and addRecordAction for record actions`,
  );
}

export type NormalizedComposeFieldSpec = {
  index: number;
  key: string;
  fieldPath?: string;
  associationPathName?: string;
  renderer?: string;
  type?: string;
  fieldType?: FlowSurfacePublicRelationFieldType;
  fields?: string[];
  selectorFields?: string[];
  titleField?: string;
  openMode?: string;
  popupSize?: string;
  pageSize?: number;
  showIndex?: boolean;
  target?: string;
  settings: Record<string, any>;
  popup?: Record<string, any>;
  __autoPopupForRelationField?: boolean;
  [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata;
};

export function normalizeComposeFieldSpec(input: any, index: number): NormalizedComposeFieldSpec {
  if (typeof input === 'string') {
    const fieldPath = String(input || '').trim();
    if (!fieldPath) {
      throwBadRequest(`flowSurfaces compose field #${index + 1} cannot be empty`);
    }
    return {
      index: index + 1,
      key: fieldPath,
      fieldPath,
      settings: {},
      popup: undefined,
      __autoPopupForRelationField: true,
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces compose field #${index + 1} must be a string or object`);
  }
  assertNoInternalFieldKeys(input, `flowSurfaces compose field #${index + 1}`);
  assertNoInternalFieldKeys(input.settings, `flowSurfaces compose field #${index + 1}.settings`);
  const semanticType = String(input.type || '').trim() || undefined;
  const fieldPath = String(input.fieldPath || '').trim();
  const renderer = typeof input.renderer === 'undefined' ? undefined : String(input.renderer || '').trim();
  const fieldType = normalizePublicFieldType(input.fieldType, `compose field #${index + 1}`);
  const fields = normalizePublicFieldNameList(input.fields, `compose field #${index + 1}.fields`);
  const selectorFields = normalizePublicFieldNameList(
    input.selectorFields,
    `compose field #${index + 1}.selectorFields`,
  );
  const titleField = typeof input.titleField === 'undefined' ? undefined : String(input.titleField || '').trim();
  const openMode = typeof input.openMode === 'undefined' ? undefined : String(input.openMode || '').trim();
  const popupSize = typeof input.popupSize === 'undefined' ? undefined : String(input.popupSize || '').trim();
  const pageSize = typeof input.pageSize === 'undefined' ? undefined : Number(input.pageSize);
  const showIndex = typeof input.showIndex === 'undefined' ? undefined : !!input.showIndex;
  if (!_.isUndefined(input.popup) && !_.isPlainObject(input.popup)) {
    throwBadRequest(`flowSurfaces compose field #${index + 1} popup must be an object`);
  }
  if (!fieldPath && !semanticType) {
    throwBadRequest(`flowSurfaces compose field #${index + 1} requires fieldPath`);
  }
  if (semanticType && fieldPath) {
    throwBadRequest(
      `flowSurfaces compose field #${index + 1} cannot mix fieldPath with synthetic field type '${semanticType}'`,
    );
  }
  if (!_.isUndefined(input.target) && typeof input.target !== 'string') {
    throwBadRequest(`flowSurfaces compose field #${index + 1} target must be a string block key`);
  }
  const rawKey = String(input.key || semanticType || (renderer === 'js' ? `js:${fieldPath}` : fieldPath)).trim();
  const key = normalizeFlowSurfaceComposeKey(rawKey, `flowSurfaces compose field #${index + 1}`);
  const popupDefaultsMetadata = _.isPlainObject(input[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY])
    ? input[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]
    : undefined;
  return {
    index: index + 1,
    key,
    ...(fieldPath ? { fieldPath } : {}),
    associationPathName: String(input.associationPathName || '').trim() || undefined,
    ...(renderer ? { renderer } : {}),
    ...(semanticType ? { type: semanticType } : {}),
    ...(fieldType ? { fieldType } : {}),
    ...(!_.isUndefined(fields) ? { fields } : {}),
    ...(!_.isUndefined(selectorFields) ? { selectorFields } : {}),
    ...(titleField ? { titleField } : {}),
    ...(openMode ? { openMode } : {}),
    ...(popupSize ? { popupSize } : {}),
    ...(!_.isUndefined(pageSize) && Number.isFinite(pageSize) ? { pageSize } : {}),
    ...(!_.isUndefined(showIndex) ? { showIndex } : {}),
    target: typeof input.target === 'string' ? String(input.target || '').trim() || undefined : undefined,
    settings: _.isPlainObject(input.settings) ? input.settings : {},
    popup: _.isPlainObject(input.popup) ? input.popup : undefined,
    __autoPopupForRelationField: input.__autoPopupForRelationField === true,
    ...(popupDefaultsMetadata ? { [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]: popupDefaultsMetadata } : {}),
  };
}

export function resolveRequestedFieldComponent(values: Record<string, any> | undefined) {
  return undefined;
}

export function resolveRequestedFieldUse(values: Record<string, any> | undefined) {
  return resolveRequestedFieldComponent(values) || resolveRequestedFieldUseAlias(values);
}

export function resolveRequestedFieldUseAlias(values: Record<string, any> | undefined) {
  const legacyFieldUse = String(values?.fieldUse || '').trim();
  return legacyFieldUse || undefined;
}

export function normalizeComposeActionSpec(input: any, index: number) {
  if (typeof input === 'string') {
    const type = String(input || '').trim();
    if (!type) {
      throwBadRequest(`flowSurfaces compose action #${index + 1} cannot be empty`);
    }
    return {
      key: type,
      type,
      settings: {},
    };
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} must be a string or object`);
  }
  if (input.use || input.fieldUse || input.stepParams || input.props || input.decoratorProps || input.flowRegistry) {
    throwBadRequest('flowSurfaces compose action only accepts public semantic action fields');
  }
  const type = String(input.type || '').trim();
  if (!type) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} requires type`);
  }
  if (!_.isUndefined(input.scope)) {
    throwBadRequest(`flowSurfaces compose action #${index + 1} does not support scope, use actions or recordActions`);
  }
  const key = normalizeFlowSurfaceComposeKey(
    String(input.key || type).trim(),
    `flowSurfaces compose action #${index + 1}`,
  );
  const popup = _.isPlainObject(input.popup) ? input.popup : undefined;
  return {
    key,
    type,
    settings: _.isPlainObject(input.settings) ? input.settings : {},
    ...(popup ? { popup } : {}),
  };
}

export function normalizeSimpleResourceInit(input: any) {
  if (!input) {
    return undefined;
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest('flowSurfaces simple resource must be an object');
  }
  const normalized = buildDefinedPayload({
    dataSourceKey: input.dataSourceKey,
    collectionName: input.collectionName,
    associationName: input.associationName,
    associationPathName: input.associationPathName,
    sourceId: input.sourceId,
    filterByTk: input.filterByTk,
  });
  if (!Object.keys(normalized).length) {
    throwBadRequest('flowSurfaces simple resource cannot be empty');
  }
  return normalized;
}

export function isMissingRequiredResourceInitValue(value: any) {
  if (_.isNil(value)) {
    return true;
  }
  if (typeof value === 'string') {
    return !value.trim();
  }
  return false;
}

export function joinRequiredFieldPaths(paths: string[]) {
  if (paths.length <= 1) {
    return paths[0] || '';
  }
  if (paths.length === 2) {
    return `${paths[0]} and ${paths[1]}`;
  }
  return `${paths.slice(0, -1).join(', ')}, and ${paths[paths.length - 1]}`;
}

export function normalizeSimpleLayoutValue(layout: any) {
  if (_.isUndefined(layout)) {
    return undefined;
  }
  if (_.isPlainObject(layout)) {
    return layout.layout;
  }
  return layout;
}

export function normalizeGridCardColumns(columns: any) {
  if (_.isUndefined(columns)) {
    return undefined;
  }
  if (_.isNumber(columns) && columns > 0) {
    return {
      xs: columns,
      sm: columns,
      md: columns,
      lg: columns,
      xl: columns,
      xxl: columns,
    };
  }
  if (_.isPlainObject(columns)) {
    const requiredBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
    const missingBreakpoints = requiredBreakpoints.filter((key) => _.isUndefined(columns[key]));
    if (missingBreakpoints.length) {
      throwBadRequest(
        `flowSurfaces configure gridCard columns responsive object must include xs, sm, md, lg, xl, xxl; missing: ${missingBreakpoints.join(
          ', ',
        )}`,
      );
    }
    const invalidBreakpoints = requiredBreakpoints.filter((key) => !_.isNumber(columns[key]) || columns[key] <= 0);
    if (invalidBreakpoints.length) {
      throwBadRequest(
        `flowSurfaces configure gridCard columns responsive object values must be positive numbers; invalid: ${invalidBreakpoints.join(
          ', ',
        )}`,
      );
    }
    const normalized = buildDefinedPayload({
      xs: columns.xs,
      sm: columns.sm,
      md: columns.md,
      lg: columns.lg,
      xl: columns.xl,
      xxl: columns.xxl,
    });
    if (!Object.keys(normalized).length) {
      throwBadRequest('flowSurfaces configure gridCard columns cannot be empty');
    }
    return normalized;
  }
  throwBadRequest('flowSurfaces configure gridCard columns must be a number or responsive object');
}

export function normalizeSimpleConfirm(confirm: any) {
  if (_.isBoolean(confirm)) {
    return {
      enable: confirm,
    };
  }
  if (_.isPlainObject(confirm)) {
    return buildDefinedPayload({
      enable: confirm.enable,
      title: confirm.title,
      content: confirm.content,
    });
  }
  throwBadRequest('flowSurfaces configure confirm must be a boolean or object');
}

export function assertSupportedSimpleChanges(context: string, changes: Record<string, any>, allowedKeys: string[]) {
  const unknownKeys = Object.keys(changes).filter((key) => !allowedKeys.includes(key));
  if (!unknownKeys.length) {
    return;
  }
  throwBadRequest(
    `flowSurfaces configure ${context} does not support: ${unknownKeys.join(
      ', ',
    )}; supported configureOptions: ${allowedKeys.join(', ')}`,
  );
}

export function hasLegacyLocatorFields(input: any, options: { allowRootUid?: boolean } = {}) {
  if (!_.isPlainObject(input)) {
    return false;
  }
  const keys = ['pageSchemaUid', 'tabSchemaUid', 'routeId', 'schemaUid'];
  if (options.allowRootUid) {
    keys.push('uid');
  }
  return keys.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

export function rethrowInlineConfigurationError(error: any, prefix: string): never {
  const message = `${prefix}: ${error?.message || String(error)}`;
  if (isFlowSurfaceError(error)) {
    const normalized = normalizeFlowSurfaceError(error);
    if (normalized.type === 'bad_request') {
      throwBadRequest(message, normalized.code);
    }
    if (normalized.type === 'conflict') {
      throwConflict(message, normalized.code);
    }
    if (normalized.type === 'forbidden') {
      throwForbidden(message, normalized.code);
    }
    throwInternalError(message, normalized.code);
  }
  throwInternalError(message);
}

export function toFlowSurfaceBatchItemError(error: any) {
  const normalized = normalizeFlowSurfaceError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    status: normalized.status,
    type: normalized.type,
  };
}

export function splitComposeFieldChanges(changes: Record<string, any>, wrapperUse?: string) {
  ensureNoRawSimpleChangeKeys(changes);
  const supportedKeys = getConfigureOptionKeysForUse(wrapperUse || 'FormItemModel');
  assertSupportedSimpleChanges('field', changes, supportedKeys);
  const wrapperChanges = _.pick(changes, [
    'label',
    'tooltip',
    'extra',
    'showLabel',
    'width',
    'fixed',
    'sorter',
    'fieldPath',
    'associationPathName',
    'initialValue',
    'required',
    'disabled',
    'maxCount',
    'pattern',
    'dataIndex',
    'editable',
    'labelWidth',
    'labelWrap',
    'name',
    'fieldType',
    'fields',
    'selectorFields',
    'titleField',
    'openMode',
    'popupSize',
    'pageSize',
    'showIndex',
    ...(wrapperUse === 'TableColumnModel' ? ['title'] : []),
  ]);
  const fieldChanges = _.pick(changes, [
    'clickToOpen',
    'openView',
    ...(wrapperUse === 'TableColumnModel' ? [] : ['title']),
    'icon',
    'autoSize',
    'allowClear',
    'multiple',
    'allowMultiple',
    'quickCreate',
    'displayStyle',
    'options',
    'code',
    'version',
  ]);
  return {
    wrapperChanges: _.pickBy(wrapperChanges, (value) => !_.isUndefined(value)),
    fieldChanges: _.pickBy(fieldChanges, (value) => !_.isUndefined(value)),
  };
}

export function getCatalogRecordActionContainerUse(use?: string) {
  switch (String(use || '').trim()) {
    case 'TableBlockModel':
    case 'TableActionsColumnModel':
      return 'TableActionsColumnModel';
    case 'DetailsBlockModel':
      return 'DetailsBlockModel';
    case 'ListBlockModel':
    case 'ListItemModel':
      return 'ListItemModel';
    case 'GridCardBlockModel':
    case 'GridCardItemModel':
      return 'GridCardItemModel';
    default:
      return null;
  }
}

export function normalizeRowSpans(spans?: Array<number | undefined>) {
  const numericSpans = _.castArray(spans || []).map((span) => {
    if (_.isNumber(span) && span > 0) {
      return span;
    }
    return 1;
  });
  const total = numericSpans.reduce((sum, value) => sum + value, 0);
  if (!total) {
    return numericSpans.map(() => 24);
  }
  if (total === 24 && numericSpans.every((value) => Number.isInteger(value))) {
    return numericSpans;
  }
  const raw = numericSpans.map((value) => (value / total) * 24);
  const base = raw.map((value) => Math.max(1, Math.floor(value)));
  let remainder = 24 - base.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({
      index,
      fraction: value - Math.floor(value),
    }))
    .sort((left, right) => right.fraction - left.fraction || left.index - right.index);
  let cursor = 0;
  while (remainder > 0 && order.length) {
    base[order[cursor % order.length].index] += 1;
    remainder -= 1;
    cursor += 1;
  }
  while (remainder < 0 && order.length) {
    const target = order[(cursor + order.length - 1) % order.length].index;
    if (base[target] > 1) {
      base[target] -= 1;
      remainder += 1;
    }
    cursor += 1;
  }
  return base;
}

export function normalizePublicBlockHeightMode(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  if (_.isNull(input)) {
    throwBadRequest('flowSurfaces configure heightMode cannot be null');
  }
  const normalized = String(input || '').trim();
  if (!normalized) {
    throwBadRequest('flowSurfaces configure heightMode cannot be empty');
  }
  const aliased = normalized === 'fixed' ? 'specifyValue' : normalized;
  if (!['defaultHeight', 'specifyValue', 'fullHeight'].includes(aliased)) {
    throwBadRequest('flowSurfaces configure heightMode must be one of: defaultHeight, specifyValue, fullHeight');
  }
  return aliased;
}

export function normalizeStoredChartCardHeightMode(input: any) {
  if (_.isUndefined(input) || _.isNull(input) || String(input).trim() === '') {
    return undefined;
  }
  try {
    return normalizePublicBlockHeightMode(input);
  } catch {
    return undefined;
  }
}

export function normalizeChartCardHeightModeForWrite(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  if (_.isNull(input)) {
    throwBadRequest('flowSurfaces updateSettings chart stepParams.cardSettings.blockHeight.heightMode cannot be null');
  }
  const normalized = String(input).trim();
  if (!normalized) {
    throwBadRequest('flowSurfaces updateSettings chart stepParams.cardSettings.blockHeight.heightMode cannot be empty');
  }
  try {
    return normalizePublicBlockHeightMode(normalized);
  } catch {
    throwBadRequest(
      'flowSurfaces updateSettings chart stepParams.cardSettings.blockHeight.heightMode must be one of: defaultHeight, specifyValue, fullHeight',
    );
  }
}

export function isFieldNodeUse(use?: string) {
  return !!use && use.endsWith('FieldModel');
}

export function getFieldBindingDefaultProps(containerUse: string, fieldUse: string, field: any) {
  const fieldInterface = getFieldInterface(field);
  const defaults: Record<string, any> = {};
  const isFilterField = ['FilterFormBlockModel', 'FilterFormGridModel', 'FilterFormItemModel'].includes(containerUse);

  if (fieldUse === 'TextareaFieldModel') {
    defaults.autoSize = {
      maxRows: 10,
      minRows: 3,
    };
  }

  if (fieldUse === 'FilterFormRecordSelectFieldModel') {
    defaults.allowMultiple = true;
    defaults.multiple = true;
    defaults.quickCreate = 'none';
  }

  if (fieldUse === 'SelectFieldModel') {
    if (['select', 'multipleSelect', 'radioGroup'].includes(fieldInterface)) {
      defaults.allowClear = true;
    }
    if (fieldInterface === 'checkboxGroup') {
      defaults.allowClear = true;
      defaults.mode = 'tags';
    }
    if (isFilterField && fieldInterface === 'checkbox') {
      defaults.allowClear = true;
      defaults.multiple = false;
      defaults.options = [
        {
          label: '{{t("Yes")}}',
          value: true,
        },
        {
          label: '{{t("No")}}',
          value: false,
        },
      ];
    }
  }

  return defaults;
}
