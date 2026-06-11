/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { buildDefinedPayload, getSingleNodeSubModel } from './service-utils';
import {
  buildHiddenPopupActionStepParams,
  buildHiddenPopupOpenView,
  buildHiddenPopupResourceMismatchDisplayFallbackOpenView,
  buildPersistedHiddenPopupSettingsFromOpenView,
  HIDDEN_POPUP_DISPLAY_KEYS,
  hasExplicitHiddenPopupTargetSettings,
  mergeHiddenPopupDisplaySettings,
  normalizeHiddenPopupSettings,
  resolveHiddenPopupHostOpenView,
  resolveHiddenPopupOpenViewTransition,
  resolveHiddenPopupOpenViewTransitionWithCandidate,
  resolveHiddenPopupSettingsOverride,
  stripHiddenPopupTargetSettings,
  unsetHiddenPopupPayloadPathAndPruneEmptyParents,
} from './hidden-popup-contract';

export const CALENDAR_POPUP_ACTION_KEYS = ['quickCreateAction', 'eventViewAction'] as const;
export type CalendarPopupActionKey = (typeof CALENDAR_POPUP_ACTION_KEYS)[number];
export const CALENDAR_POPUP_PROP_KEYS = ['quickCreatePopupSettings', 'eventPopupSettings'] as const;

export type HiddenPopupOpenViewNormalizer = (
  actionName: string,
  value: any,
  options: {
    transaction?: any;
    popupTemplateHostUid?: string;
    popupActionContext?: {
      hasCurrentRecord?: boolean;
    };
  },
) => Promise<Record<string, any> | undefined> | Record<string, any> | undefined;

export type HiddenPopupTemplateOpenViewBuilder = (input: {
  actionName: string;
  actionUid: string;
  openView: Record<string, any>;
  popupSettings?: Record<string, any>;
  existingHost?: any;
  transaction?: any;
  hasCurrentRecord?: boolean;
  normalizePopupSettings: (popupSettings?: Record<string, any>) => Record<string, any>;
  mergeDisplaySettings: (
    openView: Record<string, any>,
    popupSettings?: Record<string, any>,
    fallbackOpenView?: Record<string, any> | null,
  ) => Record<string, any>;
}) => Promise<Record<string, any>> | Record<string, any>;

export type HiddenPopupHostDefaultContentEnsurer = (input: {
  actionName: string;
  actionUid: string;
  popupSettings?: Record<string, any>;
  transaction?: any;
  hasCurrentRecord?: boolean;
  mergeDisplaySettings: (
    openView: Record<string, any>,
    popupSettings?: Record<string, any>,
    fallbackOpenView?: Record<string, any> | null,
  ) => Record<string, any>;
}) => Promise<boolean> | boolean;

export type HiddenPopupHostRuntime = {
  repository: {
    findModelById: (uid: string, options?: any) => Promise<any>;
    patch: (payload: Record<string, any>, options?: any) => Promise<any>;
    upsertModel: (payload: Record<string, any>, options?: any) => Promise<any>;
  };
  applyPopupHostLocalContent?: (input: {
    actionName: string;
    actionUid: string;
    popupSettings?: Record<string, any>;
    transaction?: any;
    hasCurrentRecord?: boolean;
  }) => Promise<any> | any;
  buildPopupOpenViewWithTemplate: HiddenPopupTemplateOpenViewBuilder;
  clearFlowTemplateUsagesForNodeTree: (uid: string, transaction?: any) => Promise<any>;
  ensurePopupHostDefaultContent: HiddenPopupHostDefaultContentEnsurer;
  reconcilePopupOpenViewTransition: (
    uid: string,
    currentOpenView: Record<string, any> | null | undefined,
    nextOpenView: Record<string, any>,
    transaction?: any,
  ) => Promise<any>;
  removeNodeTreeWithBindings: (uid: string, transaction?: any) => Promise<any>;
  syncFlowTemplateUsagesForNodeTree: (uid: string, transaction?: any) => Promise<any>;
};

export function normalizeCalendarPopupSettings(actionKey: CalendarPopupActionKey, popupSettings?: Record<string, any>) {
  return normalizeHiddenPopupSettings(popupSettings, {
    collectionOnly: actionKey === 'quickCreateAction',
    preserveApplyBlueprintDefaults: true,
  });
}

export function getCalendarPopupActionUse(actionKey: CalendarPopupActionKey) {
  return actionKey === 'quickCreateAction' ? 'CalendarQuickCreateActionModel' : 'CalendarEventViewActionModel';
}

export function getCalendarPopupPropKey(actionKey: CalendarPopupActionKey) {
  return actionKey === 'quickCreateAction' ? 'quickCreatePopupSettings' : 'eventPopupSettings';
}

export function getCalendarPopupActionUid(calendarUid: string, actionKey: CalendarPopupActionKey) {
  return `${calendarUid}-${actionKey}`;
}

export function getCalendarBlockResourceInit(blockNode: any) {
  const resourceInit = _.cloneDeep(_.get(blockNode, ['stepParams', 'resourceSettings', 'init']) || {});
  if (resourceInit.collectionName && !resourceInit.dataSourceKey) {
    resourceInit.dataSourceKey = 'main';
  }
  return resourceInit;
}

export function getCalendarPopupStoredSettings(blockNode: any, actionKey: CalendarPopupActionKey) {
  const propKey = getCalendarPopupPropKey(actionKey);
  const stepParamsPath = ['stepParams', 'calendarSettings', propKey];
  const rawSettings = _.has(blockNode, stepParamsPath)
    ? _.isPlainObject(_.get(blockNode, stepParamsPath))
      ? _.get(blockNode, stepParamsPath)
      : {}
    : _.isPlainObject(_.get(blockNode, ['props', propKey]))
      ? _.get(blockNode, ['props', propKey])
      : {};
  return normalizeCalendarPopupSettings(actionKey, _.cloneDeep(rawSettings || {}));
}

export async function replaceCalendarStoredPopupSettings(
  runtime: Pick<HiddenPopupHostRuntime, 'repository'>,
  blockNode: any,
  actionKey: CalendarPopupActionKey,
  popupSettings: Record<string, any>,
  transaction?: any,
) {
  if (!blockNode?.uid) {
    return;
  }
  const propKey = getCalendarPopupPropKey(actionKey);
  const path = ['calendarSettings', propKey];
  const nextStepParams = _.cloneDeep(blockNode.stepParams || {});
  if (Object.keys(popupSettings || {}).length) {
    _.set(nextStepParams, path, _.cloneDeep(popupSettings));
  } else {
    unsetHiddenPopupPayloadPathAndPruneEmptyParents(nextStepParams, path);
  }
  if (_.isEqual(nextStepParams, blockNode.stepParams || {})) {
    return;
  }
  await runtime.repository.patch(
    {
      uid: blockNode.uid,
      stepParams: nextStepParams,
    },
    { transaction },
  );
  blockNode.stepParams = nextStepParams;
}

async function persistCalendarPopupSettingsFromOpenView(
  runtime: Pick<HiddenPopupHostRuntime, 'repository'>,
  blockNode: any,
  actionKey: CalendarPopupActionKey,
  openView: Record<string, any>,
  popupSettings: Record<string, any>,
  transaction?: any,
) {
  const storedSettings = buildPersistedHiddenPopupSettingsFromOpenView({
    openView,
    popupSettings,
    expectedHostUid: getCalendarPopupActionUid(blockNode.uid, actionKey),
    normalizePopupSettings: (settings) => normalizeCalendarPopupSettings(actionKey, settings),
  });
  await replaceCalendarStoredPopupSettings(runtime, blockNode, actionKey, storedSettings, transaction);
}

export function buildCalendarInitialStepParams(input: {
  stepParams?: Record<string, any>;
  props?: Record<string, any>;
  settings?: Record<string, any>;
}) {
  const nextStepParams = _.cloneDeep(input.stepParams || {});
  const props = input.props || {};
  const settings = input.settings || {};
  const quickCreatePopupSettings = _.has(nextStepParams, ['calendarSettings', 'quickCreatePopupSettings'])
    ? _.get(nextStepParams, ['calendarSettings', 'quickCreatePopupSettings'])
    : _.isPlainObject(props.quickCreatePopupSettings)
      ? props.quickCreatePopupSettings
      : _.isPlainObject(props.quickCreatePopup)
        ? props.quickCreatePopup
        : _.isPlainObject(settings.quickCreatePopupSettings)
          ? settings.quickCreatePopupSettings
          : _.isPlainObject(settings.quickCreatePopup)
            ? settings.quickCreatePopup
            : undefined;
  const eventPopupSettings = _.has(nextStepParams, ['calendarSettings', 'eventPopupSettings'])
    ? _.get(nextStepParams, ['calendarSettings', 'eventPopupSettings'])
    : _.isPlainObject(props.eventPopupSettings)
      ? props.eventPopupSettings
      : _.isPlainObject(props.eventPopup)
        ? props.eventPopup
        : _.isPlainObject(settings.eventPopupSettings)
          ? settings.eventPopupSettings
          : _.isPlainObject(settings.eventPopup)
            ? settings.eventPopup
            : undefined;
  if (_.isPlainObject(quickCreatePopupSettings)) {
    _.set(
      nextStepParams,
      ['calendarSettings', 'quickCreatePopupSettings'],
      normalizeCalendarPopupSettings('quickCreateAction', _.cloneDeep(quickCreatePopupSettings)),
    );
  }
  if (_.isPlainObject(eventPopupSettings)) {
    _.set(
      nextStepParams,
      ['calendarSettings', 'eventPopupSettings'],
      normalizeCalendarPopupSettings('eventViewAction', _.cloneDeep(eventPopupSettings)),
    );
  }
  return nextStepParams;
}

export function buildCalendarPopupOpenView(input: {
  blockNode: any;
  actionKey: CalendarPopupActionKey;
  resourceInit?: Record<string, any>;
  popupSettings?: Record<string, any>;
}) {
  const actionUid = getCalendarPopupActionUid(input.blockNode.uid, input.actionKey);
  const resourceInit = input.resourceInit || getCalendarBlockResourceInit(input.blockNode);
  return buildHiddenPopupOpenView({
    actionUid,
    resourceInit,
    popupSettings: input.popupSettings
      ? input.popupSettings
      : getCalendarPopupStoredSettings(input.blockNode, input.actionKey),
    normalizePopupSettings: (popupSettings) => normalizeCalendarPopupSettings(input.actionKey, popupSettings),
  });
}

export function mergeCalendarPopupSettings(actionKey: CalendarPopupActionKey, current: any, value: any) {
  if (!_.isPlainObject(value)) {
    return {};
  }
  const currentBase =
    _.isPlainObject(current) && hasExplicitHiddenPopupTargetSettings(value)
      ? _.pick(_.cloneDeep(current), HIDDEN_POPUP_DISPLAY_KEYS)
      : current;
  const merged = _.isPlainObject(currentBase) ? { ..._.cloneDeep(currentBase), ..._.cloneDeep(value) } : value;
  return normalizeCalendarPopupSettings(actionKey, merged);
}

export function stripCalendarPopupTargetSettingsForResourceChange(
  actionKey: CalendarPopupActionKey,
  popupSettings?: Record<string, any>,
) {
  return normalizeCalendarPopupSettings(
    actionKey,
    stripHiddenPopupTargetSettings(popupSettings, { disableTemplateAutoBind: true }),
  );
}

function mergeCalendarPopupDisplaySettings(
  actionKey: CalendarPopupActionKey,
  openView: Record<string, any>,
  popupSettings?: Record<string, any>,
  fallbackOpenView?: Record<string, any> | null,
  options: { preserveOpenViewDisplay?: boolean; preserveOpenViewDisplayFallback?: Record<string, any> | null } = {},
) {
  return mergeHiddenPopupDisplaySettings({
    openView,
    popupSettings,
    fallbackOpenView,
    normalizePopupSettings: (settings) => normalizeCalendarPopupSettings(actionKey, settings),
    preserveOpenViewDisplay: options.preserveOpenViewDisplay,
    preserveOpenViewDisplayFallback: options.preserveOpenViewDisplayFallback,
  });
}

async function ensureCalendarPopupHostDefaultContent(
  runtime: Pick<HiddenPopupHostRuntime, 'ensurePopupHostDefaultContent'>,
  input: {
    actionKey: CalendarPopupActionKey;
    actionUid: string;
    popupSettings?: Record<string, any>;
    transaction?: any;
  },
) {
  return runtime.ensurePopupHostDefaultContent({
    actionName: `calendar ${input.actionKey}`,
    actionUid: input.actionUid,
    popupSettings: input.popupSettings,
    transaction: input.transaction,
    hasCurrentRecord: input.actionKey === 'eventViewAction',
    mergeDisplaySettings: (openView, popupSettings, fallbackOpenView) =>
      mergeCalendarPopupDisplaySettings(input.actionKey, openView, popupSettings, fallbackOpenView),
  });
}

async function buildCalendarPopupOpenViewWithTemplate(
  runtime: Pick<HiddenPopupHostRuntime, 'buildPopupOpenViewWithTemplate'>,
  input: {
    blockNode: any;
    actionKey: CalendarPopupActionKey;
    resourceInit?: Record<string, any>;
    popupSettings?: Record<string, any>;
    transaction?: any;
  },
) {
  const actionUid = getCalendarPopupActionUid(input.blockNode.uid, input.actionKey);
  const openView = buildCalendarPopupOpenView(input);
  return runtime.buildPopupOpenViewWithTemplate({
    actionName: `calendar ${input.actionKey}`,
    actionUid,
    openView,
    popupSettings: input.popupSettings,
    existingHost: getSingleNodeSubModel(input.blockNode?.subModels?.[input.actionKey]),
    transaction: input.transaction,
    hasCurrentRecord: input.actionKey === 'eventViewAction',
    normalizePopupSettings: (popupSettings) => normalizeCalendarPopupSettings(input.actionKey, popupSettings),
    mergeDisplaySettings: (nextOpenView, popupSettings, fallbackOpenView) =>
      mergeCalendarPopupDisplaySettings(input.actionKey, nextOpenView, popupSettings, fallbackOpenView),
  });
}

export async function normalizeCalendarPopupConfigureValue(input: {
  actionName: string;
  blockUid: string;
  actionKey: CalendarPopupActionKey;
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
  const actionUid = getCalendarPopupActionUid(input.blockUid, input.actionKey);
  const normalized = await input.normalizeOpenView(input.actionName, input.value, {
    transaction: input.transaction,
    popupTemplateHostUid: actionUid,
    popupActionContext: {
      hasCurrentRecord: input.actionKey === 'eventViewAction',
    },
  });
  return normalizeCalendarPopupSettings(input.actionKey, {
    ...(normalized || {}),
    ...(_.isPlainObject(input.value) && input.value.tryTemplate === false ? { tryTemplate: false } : {}),
  });
}

export function normalizeCalendarInlineSettingsForConfigure(settings?: Record<string, any>) {
  if (!_.isPlainObject(settings)) {
    return settings;
  }
  const nextSettings = _.cloneDeep(settings);
  if (Object.prototype.hasOwnProperty.call(nextSettings, 'quickCreatePopupSettings')) {
    if (!Object.prototype.hasOwnProperty.call(nextSettings, 'quickCreatePopup')) {
      nextSettings.quickCreatePopup = nextSettings.quickCreatePopupSettings;
    }
    delete nextSettings.quickCreatePopupSettings;
  }
  if (Object.prototype.hasOwnProperty.call(nextSettings, 'eventPopupSettings')) {
    if (!Object.prototype.hasOwnProperty.call(nextSettings, 'eventPopup')) {
      nextSettings.eventPopup = nextSettings.eventPopupSettings;
    }
    delete nextSettings.eventPopupSettings;
  }
  return nextSettings;
}

export function resolveCalendarInitialPopupOverride(
  settings: Record<string, any> | undefined,
  primaryKey: 'quickCreatePopup' | 'eventPopup',
  legacyKey: 'quickCreatePopupSettings' | 'eventPopupSettings',
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

export async function ensureCalendarBlockPopupHosts(
  runtime: HiddenPopupHostRuntime,
  blockNode: any,
  transaction?: any,
  popupSettingsOverrides?: Partial<Record<CalendarPopupActionKey, Record<string, any> | undefined>>,
  options: {
    displayFallbackOpenViews?: Partial<Record<CalendarPopupActionKey, Record<string, any> | undefined>>;
  } = {},
) {
  if (!blockNode?.uid || blockNode.use !== 'CalendarBlockModel') {
    return blockNode;
  }

  const resourceInit = getCalendarBlockResourceInit(blockNode);
  let changed = false;

  for (const actionKey of CALENDAR_POPUP_ACTION_KEYS) {
    let existing = getSingleNodeSubModel(blockNode.subModels?.[actionKey]);
    const expectedUid = getCalendarPopupActionUid(blockNode.uid, actionKey);
    const expectedUse = getCalendarPopupActionUse(actionKey);
    const popupSettingsOverride = resolveHiddenPopupSettingsOverride(popupSettingsOverrides, actionKey);
    const explicitPopupSettingsProvided =
      !!popupSettingsOverrides && Object.prototype.hasOwnProperty.call(popupSettingsOverrides, actionKey);
    const popupSettings = popupSettingsOverride ?? getCalendarPopupStoredSettings(blockNode, actionKey);
    const seedOpenView = buildCalendarPopupOpenView({
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
    const currentOpenView = resolveHiddenPopupHostOpenView(existing);
    const normalizedCurrentOpenView = normalizeCalendarPopupSettings(actionKey, currentOpenView);
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
        mergeCalendarPopupDisplaySettings(actionKey, openView, popupSettings, fallbackOpenView, mergeOptions),
      resolveCandidateOpenView: () =>
        buildCalendarPopupOpenViewWithTemplate(runtime, {
          blockNode,
          actionKey,
          resourceInit,
          popupSettings,
          transaction,
        }),
    });
    const { openView } = popupOpenViewTransition;
    const shouldUpsert = !existing?.uid || existing.use !== expectedUse || !_.isEqual(currentOpenView, openView);

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

    const completedDefaultContent = await ensureCalendarPopupHostDefaultContent(runtime, {
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
    const finalOpenView = completedDefaultContent ? resolveHiddenPopupHostOpenView(existing) : openView;
    await persistCalendarPopupSettingsFromOpenView(
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
    changed = completedDefaultContent || changed;
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

export function projectCalendarBlockPopupHosts<T = any>(node: T): T {
  if (!node || typeof node !== 'object') {
    return node;
  }

  const current: any = node;
  if (!current?.uid || current.use !== 'CalendarBlockModel') {
    return node;
  }

  const resourceInit = getCalendarBlockResourceInit(current);
  let nextSubModels = current.subModels;
  let changed = false;

  for (const actionKey of CALENDAR_POPUP_ACTION_KEYS) {
    const existing = getSingleNodeSubModel(current.subModels?.[actionKey]);
    const expectedUid = getCalendarPopupActionUid(current.uid, actionKey);
    const expectedUse = getCalendarPopupActionUse(actionKey);
    const popupSettings = getCalendarPopupStoredSettings(current, actionKey);
    const persistedOpenView = resolveHiddenPopupHostOpenView(existing);
    const seedOpenView = buildCalendarPopupOpenView({
      blockNode: current,
      actionKey,
      resourceInit,
      popupSettings,
    });
    const currentOpenView = resolveHiddenPopupHostOpenView(existing);
    const normalizedCurrentOpenView = normalizeCalendarPopupSettings(actionKey, currentOpenView);
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
          stripCalendarPopupTargetSettingsForResourceChange(actionKey, popupSettings),
        buildOpenView: ({ resourceInit, popupSettings }) =>
          buildCalendarPopupOpenView({
            blockNode: current,
            actionKey,
            resourceInit,
            popupSettings,
          }),
      }),
      allowResourceMismatchRebuild: true,
      mergeDisplaySettings: (openView, popupSettings, fallbackOpenView, mergeOptions) =>
        mergeCalendarPopupDisplaySettings(actionKey, openView, popupSettings, fallbackOpenView, mergeOptions),
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

export function projectCalendarBlockPopupHostsInTree<T = any>(node: T): T {
  if (!node || typeof node !== 'object') {
    return node;
  }

  let current: any = projectCalendarBlockPopupHosts(node);
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
        const nextItem = projectCalendarBlockPopupHostsInTree(item);
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

    const nextValue = projectCalendarBlockPopupHostsInTree(value);
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
