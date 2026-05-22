/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { hasFlowSurfaceInlinePopupBlocks } from './default-action-popup';
import { buildDefinedPayload, getSingleNodeSubModel } from './service-utils';
import {
  buildHiddenPopupActionStepParams,
  buildHiddenPopupOpenView,
  buildImplicitHiddenPopupDefaultContent,
  buildHiddenPopupResourceMismatchDisplayFallbackOpenView,
  buildPersistedHiddenPopupSettingsFromOpenView,
  HIDDEN_POPUP_DISPLAY_KEYS,
  hasExplicitHiddenPopupTargetSettings,
  hiddenPopupHostHasLocalContent,
  mergeHiddenPopupDisplaySettings,
  normalizeHiddenPopupSettings,
  resolveHiddenPopupHostOpenView,
  resolveHiddenPopupOpenViewTransition,
  resolveHiddenPopupOpenViewTransitionWithCandidate,
  resolveHiddenPopupSettingsOverride,
  stripHiddenPopupTargetSettings,
  unsetHiddenPopupPayloadPathAndPruneEmptyParents,
} from './hidden-popup-contract';
import type { HiddenPopupHostRuntime, HiddenPopupOpenViewNormalizer } from './hidden-popup-calendar';

export const KANBAN_POPUP_ACTION_UID_SUFFIX_BY_KEY = {
  quickCreateAction: '-quick-create-action',
  cardViewAction: '-card-view-action',
} as const;
export const KANBAN_POPUP_ACTION_KEYS = Object.keys(KANBAN_POPUP_ACTION_UID_SUFFIX_BY_KEY) as Array<
  keyof typeof KANBAN_POPUP_ACTION_UID_SUFFIX_BY_KEY
>;
export type KanbanPopupActionKey = (typeof KANBAN_POPUP_ACTION_KEYS)[number];
export const KANBAN_BLOCK_POPUP_PROP_KEYS = [
  'popupMode',
  'popupSize',
  'popupTemplateUid',
  'popupPageModelClass',
  'popupTargetUid',
  'quickCreatePopupSettings',
] as const;
export const KANBAN_CARD_POPUP_PROP_KEYS = [
  'openMode',
  'popupSize',
  'popupTemplateUid',
  'pageModelClass',
  'popupTargetUid',
  'cardPopupSettings',
] as const;

const KANBAN_POPUP_PATCH_PATH_BY_ACTION: Record<KanbanPopupActionKey, string[]> = {
  quickCreateAction: ['kanbanSettings', 'popup'],
  cardViewAction: ['cardSettings', 'popup'],
};
const KANBAN_POPUP_LOCAL_CONTENT_KEYS = ['blocks', 'layout', 'saveAsTemplate', 'defaultType'] as const;

export function normalizeKanbanPopupSettings(
  actionKey: KanbanPopupActionKey,
  popupSettings?: Record<string, any>,
  blockUid?: string,
) {
  const actionUid = blockUid && actionKey ? getKanbanPopupActionUid(blockUid, actionKey) : undefined;
  return normalizeHiddenPopupSettings(popupSettings, {
    invalidUids: [blockUid, actionUid],
    preserveApplyBlueprintDefaults: true,
  });
}

function stripKanbanPopupLocalContentSettings(popupSettings?: Record<string, any>) {
  if (!_.isPlainObject(popupSettings)) {
    return popupSettings;
  }
  return _.omit(_.cloneDeep(popupSettings), KANBAN_POPUP_LOCAL_CONTENT_KEYS);
}

function hasKanbanPopupLocalContent(popupSettings?: Record<string, any>) {
  return hasFlowSurfaceInlinePopupBlocks(popupSettings) || !_.isUndefined(popupSettings?.layout);
}

async function removeKanbanPopupHostLocalContent(
  runtime: HiddenPopupHostRuntime,
  actionUid: string,
  transaction?: any,
) {
  const actionNode = await runtime.repository.findModelById(actionUid, {
    transaction,
    includeAsyncNode: true,
  });
  const popupPageUid = String(getSingleNodeSubModel(actionNode?.subModels?.page)?.uid || '').trim();
  if (!popupPageUid) {
    return actionNode;
  }
  await runtime.removeNodeTreeWithBindings(popupPageUid, transaction);
  return runtime.repository.findModelById(actionUid, {
    transaction,
    includeAsyncNode: true,
  });
}

export function getKanbanInitialPopupSettings(
  actionKey: KanbanPopupActionKey,
  settings?: Record<string, any>,
  blockUid?: string,
) {
  const primaryKey = actionKey === 'quickCreateAction' ? 'quickCreatePopup' : 'cardPopup';
  const legacyKey = actionKey === 'quickCreateAction' ? 'quickCreatePopupSettings' : 'cardPopupSettings';
  const popupSettings = _.isPlainObject(settings?.[primaryKey])
    ? settings?.[primaryKey]
    : _.isPlainObject(settings?.[legacyKey])
      ? settings?.[legacyKey]
      : undefined;
  if (!_.isPlainObject(popupSettings)) {
    return undefined;
  }
  const normalized = normalizeKanbanPopupSettings(actionKey, popupSettings, blockUid);
  const persistable = stripKanbanPopupLocalContentSettings(normalized);
  return Object.keys(persistable || {}).length ? persistable : undefined;
}

export function getKanbanInitialPopupSettingsFromProps(
  actionKey: KanbanPopupActionKey,
  props?: Record<string, any>,
  blockUid?: string,
) {
  if (!_.isPlainObject(props)) {
    return undefined;
  }
  const rawSettings =
    actionKey === 'quickCreateAction'
      ? buildDefinedPayload({
          mode: props.popupMode,
          size: props.popupSize,
          popupTemplateUid: props.popupTemplateUid,
          pageModelClass: props.popupPageModelClass,
          uid: props.popupTargetUid,
        })
      : buildDefinedPayload({
          mode: props.cardOpenMode,
          size: props.cardPopupSize,
          popupTemplateUid: props.cardPopupTemplateUid,
          pageModelClass: props.cardPopupPageModelClass,
          uid: props.cardPopupTargetUid,
        });
  const normalized = normalizeKanbanPopupSettings(actionKey, rawSettings, blockUid);
  const persistable = stripKanbanPopupLocalContentSettings(normalized);
  return Object.keys(persistable || {}).length ? persistable : undefined;
}

export function getKanbanPopupActionUse(actionKey: KanbanPopupActionKey) {
  return actionKey === 'quickCreateAction' ? 'KanbanQuickCreateActionModel' : 'KanbanCardViewActionModel';
}

export function getKanbanPopupActionUid(kanbanUid: string, actionKey: KanbanPopupActionKey) {
  return `${kanbanUid}${KANBAN_POPUP_ACTION_UID_SUFFIX_BY_KEY[actionKey]}`;
}

export function getKanbanBlockResourceInit(blockNode: any) {
  const resourceInit = _.cloneDeep(_.get(blockNode, ['stepParams', 'resourceSettings', 'init']) || {});
  if (resourceInit.collectionName && !resourceInit.dataSourceKey) {
    resourceInit.dataSourceKey = 'main';
  }
  return resourceInit;
}

export function buildKanbanInitialStepParams(input: {
  stepParams?: Record<string, any>;
  props?: Record<string, any>;
  settings?: Record<string, any>;
}) {
  const nextStepParams = _.cloneDeep(input.stepParams || {});
  const initialQuickCreateEnabled = _.isBoolean(input.settings?.quickCreateEnabled)
    ? input.settings?.quickCreateEnabled
    : _.isBoolean(input.props?.quickCreateEnabled)
      ? input.props?.quickCreateEnabled
      : undefined;
  if (_.isBoolean(initialQuickCreateEnabled) && !_.has(nextStepParams, ['kanbanSettings', 'quickCreate'])) {
    _.set(nextStepParams, ['kanbanSettings', 'quickCreate'], {
      quickCreateEnabled: initialQuickCreateEnabled,
    });
  }
  const quickCreatePopup = _.has(nextStepParams, ['kanbanSettings', 'popup'])
    ? _.get(nextStepParams, ['kanbanSettings', 'popup'])
    : getKanbanInitialPopupSettings('quickCreateAction', input.settings) ||
      getKanbanInitialPopupSettings('quickCreateAction', input.props) ||
      getKanbanInitialPopupSettingsFromProps('quickCreateAction', input.props);
  if (_.isPlainObject(quickCreatePopup)) {
    _.set(nextStepParams, ['kanbanSettings', 'popup'], _.cloneDeep(quickCreatePopup));
  }
  const cardPopup = _.has(nextStepParams, ['cardSettings', 'popup'])
    ? _.get(nextStepParams, ['cardSettings', 'popup'])
    : getKanbanInitialPopupSettings('cardViewAction', input.settings) ||
      getKanbanInitialPopupSettings('cardViewAction', input.props) ||
      getKanbanInitialPopupSettingsFromProps('cardViewAction', input.props);
  if (_.isPlainObject(cardPopup)) {
    _.set(nextStepParams, ['cardSettings', 'popup'], _.cloneDeep(cardPopup));
  }
  return nextStepParams;
}

export function buildKanbanInitialItemProps(input: { props?: Record<string, any>; settings?: Record<string, any> }) {
  const enableCardClick = _.isBoolean(input.settings?.enableCardClick)
    ? input.settings?.enableCardClick
    : _.isBoolean(input.props?.enableCardClick)
      ? input.props?.enableCardClick
      : undefined;
  return buildDefinedPayload({
    ...(_.isBoolean(enableCardClick) ? { enableCardClick } : {}),
  });
}

export function buildKanbanInitialItemStepParams(input: {
  stepParams?: Record<string, any>;
  props?: Record<string, any>;
  settings?: Record<string, any>;
}) {
  const nextStepParams = _.cloneDeep(input.stepParams || {});
  const enableCardClick = _.isBoolean(input.settings?.enableCardClick)
    ? input.settings?.enableCardClick
    : _.isBoolean(input.props?.enableCardClick)
      ? input.props?.enableCardClick
      : undefined;
  if (_.isBoolean(enableCardClick) && !_.has(nextStepParams, ['cardSettings', 'click'])) {
    _.set(nextStepParams, ['cardSettings', 'click'], {
      enableCardClick,
    });
  }
  const cardPopup = _.has(nextStepParams, ['cardSettings', 'popup'])
    ? _.get(nextStepParams, ['cardSettings', 'popup'])
    : getKanbanInitialPopupSettings('cardViewAction', input.settings) ||
      getKanbanInitialPopupSettings('cardViewAction', input.props) ||
      getKanbanInitialPopupSettingsFromProps('cardViewAction', input.props);
  if (_.isPlainObject(cardPopup)) {
    _.set(nextStepParams, ['cardSettings', 'popup'], _.cloneDeep(cardPopup));
  }
  return nextStepParams;
}

export function getKanbanPopupStoredSettings(blockNode: any, actionKey: KanbanPopupActionKey) {
  const itemNode = getSingleNodeSubModel(blockNode?.subModels?.item);
  const rawPopupSettings = (() => {
    if (actionKey === 'quickCreateAction') {
      if (_.has(blockNode, ['stepParams', 'kanbanSettings', 'popup'])) {
        const settings = _.get(blockNode, ['stepParams', 'kanbanSettings', 'popup']);
        return _.isPlainObject(settings) ? settings : {};
      }
      return buildDefinedPayload({
        mode: blockNode?.props?.popupMode,
        size: blockNode?.props?.popupSize,
        popupTemplateUid: blockNode?.props?.popupTemplateUid,
        pageModelClass: blockNode?.props?.popupPageModelClass,
        uid: blockNode?.props?.popupTargetUid,
      });
    }
    if (_.has(itemNode, ['stepParams', 'cardSettings', 'popup'])) {
      const settings = _.get(itemNode, ['stepParams', 'cardSettings', 'popup']);
      return _.isPlainObject(settings) ? settings : {};
    }
    return buildDefinedPayload({
      mode: itemNode?.props?.openMode,
      size: itemNode?.props?.popupSize,
      popupTemplateUid: itemNode?.props?.popupTemplateUid,
      pageModelClass: itemNode?.props?.pageModelClass,
      uid: itemNode?.props?.popupTargetUid,
    });
  })();
  return normalizeKanbanPopupSettings(actionKey, rawPopupSettings, blockNode?.uid);
}

export function buildKanbanPopupOpenView(input: {
  blockNode: any;
  actionKey: KanbanPopupActionKey;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
}) {
  const actionUid = getKanbanPopupActionUid(input.blockNode.uid, input.actionKey);
  const resourceInit = input.resourceInit || getKanbanBlockResourceInit(input.blockNode);
  return buildHiddenPopupOpenView({
    actionUid,
    resourceInit,
    popupSettings: input.popupSettings
      ? input.popupSettings
      : getKanbanPopupStoredSettings(input.blockNode, input.actionKey),
    normalizePopupSettings: (popupSettings) =>
      normalizeKanbanPopupSettings(input.actionKey, popupSettings, input.blockNode.uid),
  });
}

export async function normalizeKanbanPopupConfigureValue(input: {
  actionName: string;
  blockUid: string;
  actionKey: KanbanPopupActionKey;
  value: any;
  transaction?: any;
  normalizeOpenView: HiddenPopupOpenViewNormalizer;
}) {
  if (_.isUndefined(input.value)) {
    return undefined;
  }
  if (_.isNull(input.value)) {
    return {};
  }
  const actionUid = getKanbanPopupActionUid(input.blockUid, input.actionKey);
  const normalized = await input.normalizeOpenView(input.actionName, input.value, {
    transaction: input.transaction,
    popupTemplateHostUid: actionUid,
    popupActionContext: {
      hasCurrentRecord: input.actionKey === 'cardViewAction',
    },
  });
  return normalizeKanbanPopupSettings(
    input.actionKey,
    {
      ...(normalized || {}),
      ...(_.isPlainObject(input.value) && input.value.tryTemplate === false ? { tryTemplate: false } : {}),
    },
    input.blockUid,
  );
}

export function resolveKanbanInitialPopupOverride(
  settings: Record<string, any> | undefined,
  primaryKey: 'quickCreatePopup' | 'cardPopup',
  legacyKey: 'quickCreatePopupSettings' | 'cardPopupSettings',
) {
  if (!_.isPlainObject(settings)) {
    return undefined;
  }
  if (_.isPlainObject(settings[primaryKey])) {
    return settings[primaryKey];
  }
  if (_.isPlainObject(settings[legacyKey])) {
    return settings[legacyKey];
  }
  return undefined;
}

export function mergeKanbanPopupSettings(actionKey: KanbanPopupActionKey, current: any, value: any, blockUid?: string) {
  if (!_.isPlainObject(value)) {
    return {};
  }
  const currentBase =
    _.isPlainObject(current) && hasExplicitHiddenPopupTargetSettings(value)
      ? _.pick(_.cloneDeep(current), HIDDEN_POPUP_DISPLAY_KEYS)
      : current;
  const merged = _.isPlainObject(currentBase) ? { ..._.cloneDeep(currentBase), ..._.cloneDeep(value) } : value;
  return normalizeKanbanPopupSettings(actionKey, merged, blockUid);
}

export function stripKanbanPopupTargetSettingsForResourceChange(
  actionKey: KanbanPopupActionKey,
  popupSettings?: Record<string, any>,
  blockUid?: string,
) {
  return normalizeKanbanPopupSettings(
    actionKey,
    stripHiddenPopupTargetSettings(popupSettings, { disableTemplateAutoBind: true }),
    blockUid,
  );
}

export async function replaceKanbanStoredPopupSettings(
  runtime: Pick<HiddenPopupHostRuntime, 'repository'>,
  blockNode: any,
  actionKey: KanbanPopupActionKey,
  popupSettings: Record<string, any>,
  transaction?: any,
) {
  const targetNode = actionKey === 'quickCreateAction' ? blockNode : getSingleNodeSubModel(blockNode?.subModels?.item);
  if (!targetNode?.uid) {
    return;
  }
  const path = KANBAN_POPUP_PATCH_PATH_BY_ACTION[actionKey];
  const nextStepParams = _.cloneDeep(targetNode.stepParams || {});
  if (Object.keys(popupSettings || {}).length) {
    _.set(nextStepParams, path, _.cloneDeep(popupSettings));
  } else {
    unsetHiddenPopupPayloadPathAndPruneEmptyParents(nextStepParams, path);
  }
  if (_.isEqual(nextStepParams, targetNode.stepParams || {})) {
    return;
  }
  await runtime.repository.patch(
    {
      uid: targetNode.uid,
      stepParams: nextStepParams,
    },
    { transaction },
  );
  targetNode.stepParams = nextStepParams;
}

async function persistKanbanPopupSettingsFromOpenView(
  runtime: Pick<HiddenPopupHostRuntime, 'repository'>,
  blockNode: any,
  actionKey: KanbanPopupActionKey,
  openView: Record<string, any>,
  popupSettings: Record<string, any>,
  transaction?: any,
) {
  const storedSettings = buildPersistedHiddenPopupSettingsFromOpenView({
    openView,
    popupSettings,
    expectedHostUid: getKanbanPopupActionUid(blockNode.uid, actionKey),
    normalizePopupSettings: (settings) => normalizeKanbanPopupSettings(actionKey, settings, blockNode?.uid),
  });
  await replaceKanbanStoredPopupSettings(runtime, blockNode, actionKey, storedSettings, transaction);
}

function mergeKanbanPopupDisplaySettings(
  actionKey: KanbanPopupActionKey,
  openView: Record<string, any>,
  popupSettings?: Record<string, any>,
  fallbackOpenView?: Record<string, any> | null,
  options: { preserveOpenViewDisplay?: boolean; preserveOpenViewDisplayFallback?: Record<string, any> | null } = {},
) {
  return mergeHiddenPopupDisplaySettings({
    openView,
    popupSettings,
    fallbackOpenView,
    normalizePopupSettings: (settings) => normalizeKanbanPopupSettings(actionKey, settings),
    preserveOpenViewDisplay: options.preserveOpenViewDisplay,
    preserveOpenViewDisplayFallback: options.preserveOpenViewDisplayFallback,
  });
}

async function buildKanbanPopupOpenViewWithTemplate(
  runtime: Pick<HiddenPopupHostRuntime, 'buildPopupOpenViewWithTemplate'>,
  input: {
    blockNode: any;
    actionKey: KanbanPopupActionKey;
    resourceInit?: Record<string, any>;
    popupSettings?: Record<string, any>;
    transaction?: any;
  },
) {
  const actionUid = getKanbanPopupActionUid(input.blockNode.uid, input.actionKey);
  const openView = buildKanbanPopupOpenView(input);
  return runtime.buildPopupOpenViewWithTemplate({
    actionName: `kanban ${input.actionKey}`,
    actionUid,
    openView,
    popupSettings: input.popupSettings,
    existingHost: getSingleNodeSubModel(input.blockNode?.subModels?.[input.actionKey]),
    transaction: input.transaction,
    hasCurrentRecord: input.actionKey === 'cardViewAction',
    normalizePopupSettings: (popupSettings) =>
      normalizeKanbanPopupSettings(input.actionKey, popupSettings, input.blockNode.uid),
    mergeDisplaySettings: (nextOpenView, popupSettings, fallbackOpenView) =>
      mergeKanbanPopupDisplaySettings(input.actionKey, nextOpenView, popupSettings, fallbackOpenView),
  });
}

async function resolveKanbanPopupOpenViewWithFallback(
  runtime: Pick<HiddenPopupHostRuntime, 'buildPopupOpenViewWithTemplate'>,
  input: {
    blockNode: any;
    actionKey: KanbanPopupActionKey;
    resourceInit?: Record<string, any>;
    popupSettings?: Record<string, any>;
    transaction?: any;
  },
) {
  const baseOpenView = buildKanbanPopupOpenView(input);
  const openView = await buildKanbanPopupOpenViewWithTemplate(runtime, input);
  return mergeKanbanPopupDisplaySettings(input.actionKey, openView, input.popupSettings, baseOpenView);
}

async function ensureKanbanPopupHostDefaultContent(
  runtime: Pick<HiddenPopupHostRuntime, 'ensurePopupHostDefaultContent'>,
  input: {
    actionKey: KanbanPopupActionKey;
    actionUid: string;
    popupSettings?: Record<string, any>;
    transaction?: any;
  },
) {
  return runtime.ensurePopupHostDefaultContent({
    actionName: `kanban ${input.actionKey}`,
    actionUid: input.actionUid,
    popupSettings: input.popupSettings,
    transaction: input.transaction,
    hasCurrentRecord: input.actionKey === 'cardViewAction',
    mergeDisplaySettings: (openView, popupSettings, fallbackOpenView) =>
      mergeKanbanPopupDisplaySettings(input.actionKey, openView, popupSettings, fallbackOpenView),
  });
}

export async function ensureKanbanBlockPopupHosts(
  runtime: HiddenPopupHostRuntime,
  blockNode: any,
  transaction?: any,
  popupSettingsOverrides?: Partial<Record<KanbanPopupActionKey, Record<string, any> | undefined>>,
  options: {
    displayFallbackOpenViews?: Partial<Record<KanbanPopupActionKey, Record<string, any> | undefined>>;
  } = {},
) {
  if (!blockNode?.uid || blockNode.use !== 'KanbanBlockModel') {
    return blockNode;
  }

  const resourceInit = getKanbanBlockResourceInit(blockNode);
  let changed = false;

  for (const actionKey of KANBAN_POPUP_ACTION_KEYS) {
    let existing = getSingleNodeSubModel(blockNode.subModels?.[actionKey]);
    const expectedUid = getKanbanPopupActionUid(blockNode.uid, actionKey);
    const expectedUse = getKanbanPopupActionUse(actionKey);
    const popupSettingsOverride = resolveHiddenPopupSettingsOverride(popupSettingsOverrides, actionKey);
    const popupSettings = popupSettingsOverride ?? getKanbanPopupStoredSettings(blockNode, actionKey);
    const explicitPopupSettingsProvided =
      !!popupSettingsOverrides && Object.prototype.hasOwnProperty.call(popupSettingsOverrides, actionKey);
    const seedOpenView = buildKanbanPopupOpenView({
      blockNode,
      actionKey,
      resourceInit,
      popupSettings,
    });
    const displayFallbackOpenView = options.displayFallbackOpenViews?.[actionKey] || seedOpenView;
    const shouldReplaceExisting = existing?.uid && existing.uid !== expectedUid;
    if (!existing?.uid || shouldReplaceExisting || existing.use !== expectedUse) {
      if (shouldReplaceExisting) {
        await runtime.removeNodeTreeWithBindings(existing.uid, transaction);
      }

      await runtime.repository.upsertModel(
        {
          parentId: blockNode.uid,
          subKey: actionKey,
          subType: 'object',
          ...(existing?.uid === expectedUid ? _.cloneDeep(existing) : {}),
          uid: expectedUid,
          use: expectedUse,
          stepParams: buildHiddenPopupActionStepParams(
            existing?.uid === expectedUid ? existing.stepParams : {},
            seedOpenView,
          ),
        },
        { transaction },
      );
      existing = await runtime.repository.findModelById(expectedUid, {
        transaction,
        includeAsyncNode: true,
      });
      if (String(seedOpenView?.popupTemplateUid || '').trim()) {
        await runtime.clearFlowTemplateUsagesForNodeTree(expectedUid, transaction);
        await runtime.syncFlowTemplateUsagesForNodeTree(expectedUid, transaction);
      }
      changed = true;
    }
    const hasLocalPopupContent = hiddenPopupHostHasLocalContent(existing);
    const currentOpenView = resolveHiddenPopupHostOpenView(existing);
    const normalizedCurrentOpenView = normalizeKanbanPopupSettings(actionKey, currentOpenView, blockNode.uid);
    const popupOpenViewTransition = await resolveHiddenPopupOpenViewTransitionWithCandidate({
      existing,
      expectedUid,
      expectedUse,
      popupSettings,
      seedOpenView,
      currentOpenView,
      normalizedCurrentOpenView,
      displayFallbackOpenView,
      allowResourceMismatchRebuild: explicitPopupSettingsProvided,
      mergeDisplaySettings: (openView, popupSettings, fallbackOpenView, mergeOptions) =>
        mergeKanbanPopupDisplaySettings(actionKey, openView, popupSettings, fallbackOpenView, mergeOptions),
      resolveCandidateOpenView: () =>
        resolveKanbanPopupOpenViewWithFallback(runtime, {
          blockNode,
          actionKey,
          resourceInit,
          popupSettings,
          transaction,
        }),
    });
    const { openView } = popupOpenViewTransition;
    const shouldUpsert =
      !existing?.uid ||
      existing.use !== expectedUse ||
      (!hasLocalPopupContent && !_.isEqual(currentOpenView, openView)) ||
      (explicitPopupSettingsProvided && !_.isEqual(currentOpenView, openView));

    if (shouldUpsert) {
      if (existing?.uid && existing.uid === expectedUid && !_.isEqual(currentOpenView, openView)) {
        await runtime.reconcilePopupOpenViewTransition(expectedUid, currentOpenView, openView, transaction);
      }
      const shouldRefreshTemplateUsages = !_.isEqual(currentOpenView, openView);

      const nextActionNode = {
        ...(existing?.uid && existing.uid === expectedUid ? _.cloneDeep(existing) : {}),
        uid: expectedUid,
        use: expectedUse,
        stepParams: buildHiddenPopupActionStepParams(
          existing?.uid === expectedUid ? existing.stepParams : {},
          openView,
        ),
      };

      await runtime.repository.upsertModel(
        {
          parentId: blockNode.uid,
          subKey: actionKey,
          subType: 'object',
          ...nextActionNode,
        },
        { transaction },
      );
      if (shouldRefreshTemplateUsages || String(openView?.popupTemplateUid || '').trim()) {
        await runtime.clearFlowTemplateUsagesForNodeTree(expectedUid, transaction);
        if (String(openView?.popupTemplateUid || '').trim()) {
          await runtime.syncFlowTemplateUsagesForNodeTree(expectedUid, transaction);
        }
      }
      changed = true;
    }

    let completedLocalContent = false;
    if (
      explicitPopupSettingsProvided &&
      hasKanbanPopupLocalContent(popupSettings) &&
      runtime.applyPopupHostLocalContent
    ) {
      await runtime.applyPopupHostLocalContent({
        actionName: `kanban ${actionKey}`,
        actionUid: expectedUid,
        popupSettings,
        transaction,
        hasCurrentRecord: actionKey === 'cardViewAction',
      });
      existing = await runtime.repository.findModelById(expectedUid, {
        transaction,
        includeAsyncNode: true,
      });
      completedLocalContent = true;
    } else if (
      explicitPopupSettingsProvided &&
      !hasKanbanPopupLocalContent(popupSettings) &&
      buildImplicitHiddenPopupDefaultContent(popupSettings)
    ) {
      const localContentHost = await runtime.repository.findModelById(expectedUid, {
        transaction,
        includeAsyncNode: true,
      });
      if (hiddenPopupHostHasLocalContent(localContentHost)) {
        existing = await removeKanbanPopupHostLocalContent(runtime, expectedUid, transaction);
        changed = true;
      } else {
        existing = localContentHost;
      }
    }
    const completedDefaultContent = completedLocalContent
      ? false
      : await ensureKanbanPopupHostDefaultContent(runtime, {
          actionKey,
          actionUid: expectedUid,
          popupSettings,
          transaction,
        });
    if (completedDefaultContent) {
      existing = await runtime.repository.findModelById(expectedUid, {
        transaction,
        includeAsyncNode: true,
      });
    }
    const finalOpenView =
      completedDefaultContent || completedLocalContent ? resolveHiddenPopupHostOpenView(existing) : openView;
    await persistKanbanPopupSettingsFromOpenView(
      runtime,
      blockNode,
      actionKey,
      finalOpenView,
      popupSettings,
      transaction,
    );
    if (existing?.uid) {
      blockNode.subModels = {
        ...(blockNode.subModels || {}),
        [actionKey]: existing,
      };
    }
    changed = completedDefaultContent || completedLocalContent || changed;
  }

  if (!changed) {
    return blockNode;
  }

  const refreshed = await runtime.repository.findModelById(blockNode.uid, {
    transaction,
    includeAsyncNode: true,
  });
  if (refreshed?.uid) {
    return refreshed;
  }
  return blockNode;
}

export function projectKanbanBlockPopupHosts<T = any>(node: T): T {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const current: any = node;
  if (!current?.uid || current.use !== 'KanbanBlockModel') {
    return node;
  }

  const resourceInit = getKanbanBlockResourceInit(current);
  let nextSubModels = current.subModels;
  let changed = false;

  for (const actionKey of KANBAN_POPUP_ACTION_KEYS) {
    const existing = getSingleNodeSubModel(current.subModels?.[actionKey]);
    const expectedUid = getKanbanPopupActionUid(current.uid, actionKey);
    const expectedUse = getKanbanPopupActionUse(actionKey);
    const popupSettings = getKanbanPopupStoredSettings(current, actionKey);
    const persistedOpenView = resolveHiddenPopupHostOpenView(existing);
    const seedOpenView = buildKanbanPopupOpenView({
      blockNode: current,
      actionKey,
      resourceInit,
      popupSettings,
    });
    const currentOpenView = resolveHiddenPopupHostOpenView(existing);
    const normalizedCurrentOpenView = normalizeKanbanPopupSettings(actionKey, currentOpenView, current.uid);
    const { openView } = resolveHiddenPopupOpenViewTransition({
      existing,
      expectedUid,
      expectedUse,
      popupSettings,
      seedOpenView,
      candidateOpenView: seedOpenView,
      currentOpenView,
      normalizedCurrentOpenView,
      preservedOpenView: persistedOpenView,
      resourceMismatchDisplayFallbackOpenView: buildHiddenPopupResourceMismatchDisplayFallbackOpenView({
        normalizedCurrentOpenView,
        resourceInit,
        popupSettings,
        stripPopupTargetSettingsForResourceChange: (popupSettings) =>
          stripKanbanPopupTargetSettingsForResourceChange(actionKey, popupSettings, current.uid),
        buildOpenView: ({ resourceInit, popupSettings }) =>
          buildKanbanPopupOpenView({
            blockNode: current,
            actionKey,
            resourceInit,
            popupSettings,
          }),
      }),
      allowResourceMismatchRebuild: true,
      mergeDisplaySettings: (openView, popupSettings, fallbackOpenView, mergeOptions) =>
        mergeKanbanPopupDisplaySettings(actionKey, openView, popupSettings, fallbackOpenView, mergeOptions),
    });

    if (existing?.uid === expectedUid && existing.use === expectedUse && _.isEqual(currentOpenView, openView)) {
      continue;
    }

    const nextActionNode = {
      ...(existing?.uid === expectedUid ? _.cloneDeep(existing) : {}),
      uid: expectedUid,
      use: expectedUse,
      stepParams: buildHiddenPopupActionStepParams(existing?.uid === expectedUid ? existing.stepParams : {}, openView),
    };

    if (!changed) {
      nextSubModels = {
        ...(current.subModels || {}),
      };
      changed = true;
    }
    nextSubModels[actionKey] = nextActionNode;
  }

  if (!changed) {
    return node;
  }

  return {
    ...current,
    subModels: nextSubModels,
  };
}

export function projectKanbanBlockPopupHostsInTree<T = any>(node: T): T {
  if (!node || typeof node !== 'object') {
    return node;
  }

  let current: any = projectKanbanBlockPopupHosts(node);
  let nextSubModels = current?.subModels;
  let changed = current !== node;

  if (!nextSubModels || typeof nextSubModels !== 'object') {
    return current;
  }

  for (const [subKey, value] of Object.entries(nextSubModels)) {
    if (Array.isArray(value)) {
      const nextItems = [];
      let itemsChanged = false;
      for (const item of value) {
        const nextItem = projectKanbanBlockPopupHostsInTree(item);
        nextItems.push(nextItem);
        itemsChanged = itemsChanged || nextItem !== item;
      }
      if (!itemsChanged) {
        continue;
      }
      if (!changed) {
        current = {
          ...current,
          subModels: {
            ...nextSubModels,
          },
        };
        nextSubModels = current.subModels;
        changed = true;
      }
      nextSubModels[subKey] = nextItems;
      continue;
    }

    const nextValue = projectKanbanBlockPopupHostsInTree(value);
    if (nextValue === value) {
      continue;
    }
    if (!changed) {
      current = {
        ...current,
        subModels: {
          ...nextSubModels,
        },
      };
      nextSubModels = current.subModels;
      changed = true;
    }
    nextSubModels[subKey] = nextValue;
  }

  return current;
}
