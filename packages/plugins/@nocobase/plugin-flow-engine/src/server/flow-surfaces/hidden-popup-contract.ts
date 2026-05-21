/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  attachFlowSurfaceApplyBlueprintPopupDefaults,
  FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY,
} from './blueprint/defaults';
import type { FlowSurfaceApplyBlueprintPopupDefaultsMetadata } from './blueprint/defaults';
import { FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY } from './default-block-actions';
import { buildDefinedPayload, getNodeSubModelList, getSingleNodeSubModel } from './service-utils';
import { POPUP_HOST_STEP_PARAM_PATHS } from './template-service-utils';

export const OPEN_VIEW_MODE_ALIASES = {
  modal: 'dialog',
  page: 'embed',
} as const;

export const HIDDEN_POPUP_TEMPLATE_TARGET_KEYS = [
  'template',
  'tryTemplate',
  'popupTemplateUid',
  'popupTemplateContext',
  'popupTemplateMode',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
  'associationName',
  'filterByTk',
  'sourceId',
] as const;

const HIDDEN_POPUP_DISPLAY_OMIT_KEYS = [
  ...HIDDEN_POPUP_TEMPLATE_TARGET_KEYS,
  'uid',
  'collectionName',
  'dataSourceKey',
] as const;

const HIDDEN_POPUP_TEMPLATE_CLEAR_KEYS = [
  'popupTemplateUid',
  'popupTemplateContext',
  'popupTemplateMode',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
  'uid',
] as const;

export const HIDDEN_POPUP_DISPLAY_KEYS = ['mode', 'size', 'pageModelClass', 'title'] as const;

const HIDDEN_POPUP_RESOURCE_TARGET_KEYS = [
  'template',
  'popupTemplateUid',
  'popupTemplateContext',
  'popupTemplateMode',
  'popupTemplateHasFilterByTk',
  'popupTemplateHasSourceId',
  'collectionName',
  'dataSourceKey',
  'uid',
  'associationName',
  'filterByTk',
  'sourceId',
] as const;

export function normalizeHiddenPopupScalarSettings(popupSettings: Record<string, any>) {
  for (const key of [
    'mode',
    'size',
    'pageModelClass',
    'collectionName',
    'dataSourceKey',
    'associationName',
    'filterByTk',
    'sourceId',
    'title',
    'popupTemplateMode',
  ]) {
    if (!Object.prototype.hasOwnProperty.call(popupSettings, key)) {
      continue;
    }
    const value = popupSettings[key];
    if (_.isNull(value) || _.isUndefined(value)) {
      delete popupSettings[key];
      continue;
    }
    if (typeof value !== 'string') {
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      delete popupSettings[key];
      continue;
    }
    popupSettings[key] =
      key === 'mode' ? OPEN_VIEW_MODE_ALIASES[trimmed as keyof typeof OPEN_VIEW_MODE_ALIASES] || trimmed : trimmed;
  }
  if (Object.prototype.hasOwnProperty.call(popupSettings, 'uid') && typeof popupSettings.uid === 'string') {
    const uidValue = popupSettings.uid.trim();
    if (uidValue) {
      popupSettings.uid = uidValue;
    } else {
      delete popupSettings.uid;
    }
  }
}

export function attachHiddenPopupDefaults(
  popup: any,
  defaultsMetadata: FlowSurfaceApplyBlueprintPopupDefaultsMetadata | undefined,
) {
  if (!defaultsMetadata || !_.isPlainObject(popup)) {
    return popup;
  }
  return attachFlowSurfaceApplyBlueprintPopupDefaults(popup, defaultsMetadata);
}

export function normalizeBlockHiddenPopupSettings(
  settings: Record<string, any>,
  blockContext: string,
  keys: readonly string[],
  defaultsMetadata?: FlowSurfaceApplyBlueprintPopupDefaultsMetadata,
  assertPopupObject?: (message: string) => void,
) {
  if (!_.isPlainObject(settings)) {
    return settings;
  }
  const nextSettings = _.cloneDeep(settings);
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(settings, key)) {
      continue;
    }
    const value = settings[key];
    if (!_.isPlainObject(value) && !_.isNull(value)) {
      if (assertPopupObject) {
        assertPopupObject(`${blockContext}.settings.${key} must be an object`);
      } else {
        throw new Error(`${blockContext}.settings.${key} must be an object`);
      }
    }
    nextSettings[key] = attachHiddenPopupDefaults(value, defaultsMetadata);
  }
  return nextSettings;
}

function clearHiddenPopupTemplateBinding(popupSettings: Record<string, any>) {
  for (const key of HIDDEN_POPUP_TEMPLATE_CLEAR_KEYS) {
    delete popupSettings[key];
  }
  popupSettings.tryTemplate = false;
}

function hasRecordScopedHiddenPopupTemplateBinding(popupSettings: Record<string, any>) {
  return (
    !!popupSettings.popupTemplateHasFilterByTk ||
    !!popupSettings.popupTemplateHasSourceId ||
    !_.isUndefined(popupSettings.filterByTk) ||
    !_.isUndefined(popupSettings.sourceId) ||
    !!String(popupSettings.associationName || '').trim()
  );
}

export function normalizeHiddenPopupSettings(
  popupSettings?: Record<string, any>,
  options: {
    collectionOnly?: boolean;
    invalidUids?: any[];
    preserveApplyBlueprintDefaults?: boolean;
  } = {},
) {
  const nextParams = _.cloneDeep(popupSettings || {});
  if (!options.preserveApplyBlueprintDefaults) {
    delete nextParams[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY];
  }
  normalizeHiddenPopupScalarSettings(nextParams);

  const popupTemplateUidProvided = Object.prototype.hasOwnProperty.call(nextParams, 'popupTemplateUid');
  const popupTemplateUid =
    typeof nextParams.popupTemplateUid === 'string' ? nextParams.popupTemplateUid.trim() : nextParams.popupTemplateUid;
  if (popupTemplateUidProvided && (popupTemplateUid === null || popupTemplateUid === '')) {
    clearHiddenPopupTemplateBinding(nextParams);
  }

  if (options.collectionOnly) {
    if (hasRecordScopedHiddenPopupTemplateBinding(nextParams)) {
      clearHiddenPopupTemplateBinding(nextParams);
    }
    delete nextParams.associationName;
    delete nextParams.filterByTk;
    delete nextParams.sourceId;
  }

  const normalizedInvalidUids = new Set(
    (options.invalidUids || []).map((value) => String(value || '').trim()).filter(Boolean),
  );
  if (normalizedInvalidUids.size) {
    const normalizedUid = typeof nextParams.uid === 'string' ? nextParams.uid.trim() : nextParams.uid;
    if (!normalizedUid || normalizedInvalidUids.has(String(normalizedUid))) {
      delete nextParams.uid;
    } else {
      nextParams.uid = normalizedUid;
    }
  }

  if (nextParams.tryTemplate !== false) {
    delete nextParams.tryTemplate;
  }
  return nextParams;
}

export function stripHiddenPopupTargetSettings(
  popupSettings?: Record<string, any>,
  options: { disableTemplateAutoBind?: boolean } = {},
) {
  const nextParams = _.cloneDeep(popupSettings || {});
  for (const key of HIDDEN_POPUP_RESOURCE_TARGET_KEYS) {
    delete nextParams[key];
  }
  if (options.disableTemplateAutoBind || popupSettings?.tryTemplate === false) {
    nextParams.tryTemplate = false;
  }
  return nextParams;
}

function normalizeHiddenPopupResourceKey(value: any) {
  return String(value || '').trim();
}

function normalizeHiddenPopupDataSourceKey(value: any, collectionName?: string) {
  return normalizeHiddenPopupResourceKey(value) || (collectionName ? 'main' : '');
}

export function hiddenPopupOpenViewResourceDiffers(
  openView?: Record<string, any> | null,
  fallbackOpenView?: Record<string, any> | null,
) {
  if (!_.isPlainObject(openView) || !_.isPlainObject(fallbackOpenView)) {
    return false;
  }
  const expectedCollectionName = normalizeHiddenPopupResourceKey(fallbackOpenView.collectionName);
  const currentCollectionName = normalizeHiddenPopupResourceKey(openView.collectionName);
  if (expectedCollectionName && currentCollectionName && expectedCollectionName !== currentCollectionName) {
    return true;
  }
  const expectedDataSourceKey = normalizeHiddenPopupDataSourceKey(
    fallbackOpenView.dataSourceKey,
    expectedCollectionName,
  );
  const currentDataSourceKey = normalizeHiddenPopupDataSourceKey(openView.dataSourceKey, currentCollectionName);
  return !!expectedDataSourceKey && !!currentDataSourceKey && expectedDataSourceKey !== currentDataSourceKey;
}

export function buildHiddenPopupOpenView(input: {
  actionUid: string;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
  normalizePopupSettings?: (popupSettings?: Record<string, any>) => Record<string, any>;
}) {
  const resourceInit = input.resourceInit || {};
  const defaults = buildDefinedPayload({
    mode: 'drawer',
    size: 'medium',
    pageModelClass: 'ChildPageModel',
    uid: input.actionUid,
    collectionName: resourceInit.collectionName,
    dataSourceKey: resourceInit.dataSourceKey || (resourceInit.collectionName ? 'main' : undefined),
  });
  const current = input.normalizePopupSettings
    ? input.normalizePopupSettings(input.popupSettings)
    : normalizeHiddenPopupSettings(input.popupSettings);
  const openViewSettings = _.omit(current, ['tryTemplate', FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]);
  return buildDefinedPayload({
    ...defaults,
    ...openViewSettings,
    uid: openViewSettings.uid || defaults.uid,
    collectionName: openViewSettings.collectionName || defaults.collectionName,
    dataSourceKey: openViewSettings.dataSourceKey || defaults.dataSourceKey,
  });
}

export function hasExplicitHiddenPopupTargetSettings(popupSettings?: Record<string, any>, defaultUid?: string) {
  if (!_.isPlainObject(popupSettings)) {
    return false;
  }
  const normalizedDefaultUid = String(defaultUid || '').trim();
  const uid = String(popupSettings.uid || '').trim();
  if (uid && (!normalizedDefaultUid || uid !== normalizedDefaultUid)) {
    return true;
  }
  return HIDDEN_POPUP_TEMPLATE_TARGET_KEYS.some((key) => {
    if (!Object.prototype.hasOwnProperty.call(popupSettings, key)) {
      return false;
    }
    const value = popupSettings[key];
    if (key === 'template') {
      return _.isPlainObject(value) && Object.keys(value).length > 0;
    }
    if (key === 'tryTemplate') {
      return value === false;
    }
    return value !== undefined && value !== null && value !== '';
  });
}

export function hasExplicitHiddenPopupResourceTargetSettings(popupSettings?: Record<string, any>, defaultUid?: string) {
  if (!_.isPlainObject(popupSettings)) {
    return false;
  }
  const normalizedDefaultUid = String(defaultUid || '').trim();
  const uid = String(popupSettings.uid || '').trim();
  if (uid && (!normalizedDefaultUid || uid !== normalizedDefaultUid)) {
    return true;
  }
  return HIDDEN_POPUP_RESOURCE_TARGET_KEYS.some((key) => {
    if (key === 'uid' || !Object.prototype.hasOwnProperty.call(popupSettings, key)) {
      return false;
    }
    const value = popupSettings[key];
    if (key === 'template') {
      return _.isPlainObject(value) && Object.keys(value).length > 0;
    }
    return value !== undefined && value !== null && value !== '';
  });
}

export function shouldPreserveExplicitHiddenPopupTemplateOpenView(openView: any, popupSettings?: Record<string, any>) {
  if (!_.isPlainObject(openView) || !_.isPlainObject(popupSettings)) {
    return false;
  }
  const expectedTemplateUid =
    String(
      (_.isPlainObject(popupSettings.template) ? popupSettings.template.uid : popupSettings.popupTemplateUid) || '',
    ).trim() || undefined;
  if (!expectedTemplateUid) {
    return false;
  }
  if (String(openView.popupTemplateUid || '').trim() !== expectedTemplateUid) {
    return false;
  }
  const expectedMode =
    String(
      (_.isPlainObject(popupSettings.template) ? popupSettings.template.mode : popupSettings.popupTemplateMode) || '',
    ).trim() || 'reference';
  const openViewMode = String(openView.popupTemplateMode || 'reference').trim() || 'reference';
  if (openViewMode !== expectedMode) {
    return false;
  }
  if (expectedMode === 'copy') {
    return !!openView.popupTemplateContext;
  }
  return true;
}

export function shouldPreserveHiddenPopupOpenView(
  openView: any,
  expectedHostUid?: string,
  popupSettings?: Record<string, any>,
  fallbackOpenView?: Record<string, any> | null,
) {
  if (!_.isPlainObject(openView)) {
    return false;
  }
  const hostUid = String(openView.uid || '').trim();
  const normalizedExpectedHostUid = String(expectedHostUid || '').trim();
  const hasExternalUid = !!hostUid && !!normalizedExpectedHostUid && hostUid !== normalizedExpectedHostUid;
  const hasTemplateBinding =
    !!String(openView.popupTemplateUid || '').trim() ||
    !!openView.popupTemplateContext ||
    !!String(openView.popupTemplateMode || '').trim();
  const hasExplicitDisplayOverride = HIDDEN_POPUP_DISPLAY_KEYS.some((key) => {
    if (!Object.prototype.hasOwnProperty.call(openView, key)) {
      return false;
    }
    return !_.isEqual(openView[key], fallbackOpenView?.[key]);
  });
  if (hasExplicitHiddenPopupTargetSettings(popupSettings, expectedHostUid)) {
    if (shouldPreserveExplicitHiddenPopupTemplateOpenView(openView, popupSettings)) {
      return true;
    }
    return hasExplicitDisplayOverride && !hasTemplateBinding && !hasExternalUid;
  }
  return hasTemplateBinding || hasExternalUid || hasExplicitDisplayOverride;
}

export function getHiddenPopupDisplaySettings(
  popupSettings?: Record<string, any>,
  normalizePopupSettings?: (popupSettings?: Record<string, any>) => Record<string, any>,
) {
  return _.omit(
    normalizePopupSettings
      ? normalizePopupSettings(popupSettings || {})
      : normalizeHiddenPopupSettings(popupSettings || {}),
    HIDDEN_POPUP_DISPLAY_OMIT_KEYS,
  );
}

export function getHiddenPopupOpenViewDisplayFallback(
  openView?: Record<string, any> | null,
  fallbackOpenView?: Record<string, any> | null,
) {
  return buildDefinedPayload({
    mode: openView?.mode || fallbackOpenView?.mode,
    size: openView?.size || fallbackOpenView?.size,
    pageModelClass: openView?.pageModelClass || fallbackOpenView?.pageModelClass,
    title: openView?.title || fallbackOpenView?.title,
  });
}

export function mergeHiddenPopupDisplaySettings(input: {
  openView: Record<string, any>;
  popupSettings?: Record<string, any>;
  fallbackOpenView?: Record<string, any> | null;
  normalizePopupSettings?: (popupSettings?: Record<string, any>) => Record<string, any>;
  preserveOpenViewDisplay?: boolean;
  preserveOpenViewDisplayFallback?: Record<string, any> | null;
}) {
  const displaySettings = getHiddenPopupDisplaySettings(input.popupSettings, input.normalizePopupSettings);
  const merged = buildDefinedPayload({
    ...input.openView,
    ...displaySettings,
    ...getHiddenPopupOpenViewDisplayFallback({ ...input.openView, ...displaySettings }, input.fallbackOpenView),
    uid: input.openView.uid,
    collectionName: input.openView.collectionName,
    dataSourceKey: input.openView.dataSourceKey,
    associationName: input.openView.associationName,
    filterByTk: input.openView.filterByTk,
    sourceId: input.openView.sourceId,
    popupTemplateUid: input.openView.popupTemplateUid,
    popupTemplateContext: input.openView.popupTemplateContext,
    popupTemplateMode: input.openView.popupTemplateMode,
    popupTemplateHasFilterByTk: input.openView.popupTemplateHasFilterByTk,
    popupTemplateHasSourceId: input.openView.popupTemplateHasSourceId,
  });
  if (input.preserveOpenViewDisplay) {
    const displayFallback = input.preserveOpenViewDisplayFallback || input.fallbackOpenView;
    for (const key of HIDDEN_POPUP_DISPLAY_KEYS) {
      if (
        Object.prototype.hasOwnProperty.call(input.openView, key) &&
        !_.isEqual(input.openView[key], displayFallback?.[key])
      ) {
        merged[key] = input.openView[key];
      }
    }
  }
  return buildDefinedPayload(merged);
}

export function getHiddenPopupOpenViewDisplayOverrides(
  openView?: Record<string, any> | null,
  fallbackOpenView?: Record<string, any> | null,
) {
  if (!_.isPlainObject(openView)) {
    return {};
  }
  const overrides: Record<string, any> = {};
  for (const key of HIDDEN_POPUP_DISPLAY_KEYS) {
    if (Object.prototype.hasOwnProperty.call(openView, key) && !_.isEqual(openView[key], fallbackOpenView?.[key])) {
      overrides[key] = openView[key];
    }
  }
  return buildDefinedPayload(overrides);
}

export function mergeHiddenPopupOpenViewDisplayOverrides(input: {
  openView: Record<string, any>;
  displayOpenView?: Record<string, any> | null;
  fallbackOpenView?: Record<string, any> | null;
  displayFallbackOpenView?: Record<string, any> | null;
}) {
  const merged = _.cloneDeep(input.openView || {});
  if (!_.isPlainObject(input.displayOpenView)) {
    return buildDefinedPayload(merged);
  }
  const displayFallback = input.displayFallbackOpenView || input.fallbackOpenView;
  Object.assign(merged, getHiddenPopupOpenViewDisplayOverrides(input.displayOpenView, displayFallback));
  return buildDefinedPayload(merged);
}

export function resolveHiddenPopupOpenViewTransition(input: {
  existing?: any;
  expectedUid: string;
  expectedUse: string;
  popupSettings?: Record<string, any>;
  seedOpenView: Record<string, any>;
  candidateOpenView?: Record<string, any>;
  currentOpenView?: Record<string, any> | null;
  normalizedCurrentOpenView?: Record<string, any> | null;
  preservedOpenView?: Record<string, any> | null;
  displayFallbackOpenView?: Record<string, any> | null;
  resourceMismatchDisplayFallbackOpenView?: Record<string, any> | null;
  allowResourceMismatchRebuild?: boolean;
  mergeDisplaySettings: (
    openView: Record<string, any>,
    popupSettings?: Record<string, any>,
    fallbackOpenView?: Record<string, any> | null,
    options?: {
      preserveOpenViewDisplay?: boolean;
      preserveOpenViewDisplayFallback?: Record<string, any> | null;
    },
  ) => Record<string, any>;
}) {
  const canUseExisting = input.existing?.uid === input.expectedUid && input.existing.use === input.expectedUse;
  const normalizedCurrentOpenView = _.isPlainObject(input.normalizedCurrentOpenView)
    ? input.normalizedCurrentOpenView
    : {};
  const currentOpenView = _.isPlainObject(input.currentOpenView) ? input.currentOpenView : normalizedCurrentOpenView;
  const preservedOpenView = _.isPlainObject(input.preservedOpenView)
    ? input.preservedOpenView
    : normalizedCurrentOpenView;
  const displayFallbackOpenView = input.displayFallbackOpenView || input.seedOpenView;
  const resourceMismatchDisplayFallbackOpenView =
    input.resourceMismatchDisplayFallbackOpenView || displayFallbackOpenView;
  const shouldRebuildForResourceMismatch =
    !!input.allowResourceMismatchRebuild &&
    canUseExisting &&
    !hasExplicitHiddenPopupResourceTargetSettings(input.popupSettings, input.expectedUid) &&
    hiddenPopupOpenViewResourceDiffers(normalizedCurrentOpenView, input.seedOpenView);
  const shouldPreservePersistedOpenView =
    canUseExisting &&
    !shouldRebuildForResourceMismatch &&
    shouldPreserveHiddenPopupOpenView(preservedOpenView, input.expectedUid, input.popupSettings, input.seedOpenView);
  const openView = shouldPreservePersistedOpenView
    ? input.mergeDisplaySettings(preservedOpenView, input.popupSettings, input.seedOpenView, {
        preserveOpenViewDisplay: true,
        preserveOpenViewDisplayFallback: displayFallbackOpenView,
      })
    : buildDefinedPayload({
        ...mergeHiddenPopupOpenViewDisplayOverrides({
          openView: input.candidateOpenView || input.seedOpenView,
          displayOpenView: shouldRebuildForResourceMismatch ? normalizedCurrentOpenView : null,
          fallbackOpenView: input.seedOpenView,
          displayFallbackOpenView: shouldRebuildForResourceMismatch
            ? resourceMismatchDisplayFallbackOpenView
            : displayFallbackOpenView,
        }),
      });

  return {
    openView,
    shouldRebuildForResourceMismatch,
    shouldPreservePersistedOpenView,
    currentOpenView,
    normalizedCurrentOpenView,
  };
}

export async function resolveHiddenPopupOpenViewTransitionWithCandidate(
  input: Parameters<typeof resolveHiddenPopupOpenViewTransition>[0] & {
    resolveCandidateOpenView: () => Promise<Record<string, any>> | Record<string, any>;
  },
) {
  const transition = resolveHiddenPopupOpenViewTransition(input);
  if (transition.shouldPreservePersistedOpenView) {
    return transition;
  }
  return resolveHiddenPopupOpenViewTransition({
    ...input,
    candidateOpenView: await input.resolveCandidateOpenView(),
  });
}

export function buildHiddenPopupResourceMismatchDisplayFallbackOpenView(input: {
  normalizedCurrentOpenView?: Record<string, any> | null;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
  stripPopupTargetSettingsForResourceChange: (popupSettings?: Record<string, any>) => Record<string, any>;
  buildOpenView: (input: {
    resourceInit?: Record<string, any>;
    popupSettings?: Record<string, any>;
  }) => Record<string, any>;
}) {
  const normalizedCurrentOpenView = _.isPlainObject(input.normalizedCurrentOpenView)
    ? input.normalizedCurrentOpenView
    : {};
  const resourceInit = normalizedCurrentOpenView.collectionName
    ? buildDefinedPayload({
        collectionName: normalizedCurrentOpenView.collectionName,
        dataSourceKey: normalizedCurrentOpenView.dataSourceKey,
      })
    : input.resourceInit;
  return input.buildOpenView({
    resourceInit,
    popupSettings: input.stripPopupTargetSettingsForResourceChange(input.popupSettings),
  });
}

export function buildHiddenPopupActionStepParams(existingStepParams: any, openView: Record<string, any>) {
  const nextStepParams = _.cloneDeep(existingStepParams || {});
  const popupSettings = _.isPlainObject(nextStepParams.popupSettings) ? _.cloneDeep(nextStepParams.popupSettings) : {};
  popupSettings.openView = _.omit(_.cloneDeep(openView || {}), ['tryTemplate']);
  nextStepParams.popupSettings = popupSettings;
  return nextStepParams;
}

export function buildPersistedHiddenPopupSettingsFromOpenView(input: {
  openView?: Record<string, any> | null;
  popupSettings?: Record<string, any>;
  expectedHostUid?: string;
  normalizePopupSettings: (popupSettings?: Record<string, any>) => Record<string, any>;
}) {
  const normalizedOpenView = input.normalizePopupSettings(_.cloneDeep(input.openView || {}));
  const normalizedExpectedHostUid = String(input.expectedHostUid || '').trim();
  const openViewUid = String(normalizedOpenView.uid || '').trim();
  const templateSettings = buildDefinedPayload({
    popupTemplateUid: normalizedOpenView.popupTemplateUid,
    popupTemplateContext: normalizedOpenView.popupTemplateContext,
    popupTemplateMode: normalizedOpenView.popupTemplateMode,
    popupTemplateHasFilterByTk: normalizedOpenView.popupTemplateHasFilterByTk,
    popupTemplateHasSourceId: normalizedOpenView.popupTemplateHasSourceId,
  });
  const targetSettings = buildDefinedPayload({
    ...(openViewUid && openViewUid !== normalizedExpectedHostUid ? { uid: openViewUid } : {}),
    associationName: normalizedOpenView.associationName,
    filterByTk: normalizedOpenView.filterByTk,
    sourceId: normalizedOpenView.sourceId,
  });
  const displaySettings = _.pick(input.normalizePopupSettings(input.popupSettings || {}), HIDDEN_POPUP_DISPLAY_KEYS);
  const explicitTryTemplateOptOut = _.isPlainObject(input.popupSettings) && input.popupSettings.tryTemplate === false;
  return input.normalizePopupSettings(
    buildDefinedPayload({
      ...templateSettings,
      ...targetSettings,
      ...displaySettings,
      ...(explicitTryTemplateOptOut ? { tryTemplate: false } : {}),
    }),
  );
}

export function unsetHiddenPopupPayloadPathAndPruneEmptyParents(payload: Record<string, any>, path: Array<string>) {
  _.unset(payload, path);
  for (let index = path.length - 1; index > 0; index -= 1) {
    const parentPath = path.slice(0, index);
    const parentValue = _.get(payload, parentPath);
    if (!_.isPlainObject(parentValue) || Object.keys(parentValue).length > 0) {
      break;
    }
    _.unset(payload, parentPath);
  }
}

export function buildImplicitHiddenPopupDefaultContent(popupSettings?: Record<string, any>) {
  const defaultsMetadata = _.isPlainObject(popupSettings)
    ? _.pick(popupSettings, [FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY])
    : {};
  const hasDefaultsMetadata = _.isPlainObject(defaultsMetadata[FLOW_SURFACE_APPLY_BLUEPRINT_POPUP_DEFAULTS_KEY]);
  if (_.isPlainObject(popupSettings) && popupSettings.tryTemplate === false && !hasDefaultsMetadata) {
    return undefined;
  }
  return {
    ...defaultsMetadata,
    tryTemplate: hasDefaultsMetadata ? popupSettings?.tryTemplate === true : true,
    [FLOW_SURFACE_INTERNAL_AUTO_SAVE_DEFAULT_POPUP_TEMPLATE_KEY]: true,
  };
}

export function hiddenPopupHostHasLocalContent(actionNode: any) {
  const popupPage = getSingleNodeSubModel(actionNode?.subModels?.page);
  const popupTab = _.castArray(popupPage?.subModels?.tabs || [])[0];
  const popupGrid = getSingleNodeSubModel(popupTab?.subModels?.grid);
  return getNodeSubModelList(popupGrid?.subModels?.items).length > 0;
}

export function shouldAutoBindHiddenPopupTemplate(
  openView: Record<string, any>,
  popupSettings?: Record<string, any>,
  expectedHostUid?: string,
  options: { hostHasLocalContent?: boolean } = {},
) {
  if (!_.isPlainObject(openView)) {
    return false;
  }
  const rawPopupSettings = _.isPlainObject(popupSettings) ? popupSettings : {};
  if ((rawPopupSettings as any).tryTemplate === false) {
    return false;
  }
  const hostUid = String(openView.uid || '').trim();
  const normalizedExpectedHostUid = String(expectedHostUid || '').trim();
  const hasExternalUid = !!hostUid && !!normalizedExpectedHostUid && hostUid !== normalizedExpectedHostUid;
  if (!hasExternalUid && options.hostHasLocalContent) {
    return false;
  }
  return (
    !String(openView.popupTemplateUid || '').trim() &&
    !openView.popupTemplateContext &&
    !String(openView.popupTemplateMode || '').trim() &&
    !_.isPlainObject(openView.template) &&
    !!hostUid &&
    !hasExternalUid
  );
}

export function resolveHiddenPopupHostOpenView(node: any) {
  for (const [flowKey, stepKey] of POPUP_HOST_STEP_PARAM_PATHS) {
    const openView = _.get(node, ['stepParams', flowKey, stepKey]);
    if (_.isPlainObject(openView)) {
      return openView;
    }
  }
  return null;
}

export function resolveHiddenPopupSettingsOverride<TActionKey extends string>(
  overrides: Partial<Record<TActionKey, Record<string, any> | undefined>> | undefined,
  actionKey: TActionKey,
) {
  if (!overrides || !Object.prototype.hasOwnProperty.call(overrides, actionKey)) {
    return undefined;
  }
  return overrides[actionKey];
}
