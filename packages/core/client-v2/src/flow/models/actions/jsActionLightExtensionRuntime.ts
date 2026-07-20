/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  FlowCancelSaveException,
  FlowExitAllException,
  FlowExitException,
  type FlowModel,
  type FlowRuntimeContext,
  type RunJSValue,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';

import {
  resolveRuntimeRunJS,
  createRunJSSourceCascadeMenuUIMode,
  getRunJSModelUse,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
} from '../../components/runjs-source';
import {
  cloneJsonValue,
  cloneRecord,
  createLightExtensionRunJsUISchema,
  createLightExtensionSettingSteps,
  createLightExtensionSourceBindingStep,
  createLightExtensionSourceModeStep,
  createRuntimeRunTracker,
  getLightExtensionFallbackBindingTitle,
  getLightExtensionSettingsDescriptor as getSharedLightExtensionSettingsDescriptor,
  getLightExtensionStoredBindingTitle,
  getModelTranslator,
  getRecordProperty,
  INLINE_SOURCE_MODE,
  isRecord,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceSettingsForBinding,
  normalizeLightExtensionSourceMode,
  rememberLightExtensionBindingSettings,
  setCanonicalLightExtensionSetting,
  setCanonicalLightExtensionSource,
  showPendingLightExtensionRequiredSettings,
  type LightExtensionSourceMode,
  type LightExtensionSourceModeParams,
  type RuntimeErrorInfo,
} from '../utils/runjsSourceRuntimeCommon';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSActionSourceModeField';

export { INLINE_SOURCE_MODE, LIGHT_EXTENSION_SOURCE_MODE };
export const JS_ACTION_OWNER_KIND = 'flowModel.actionSettings';

export type JSActionSourceMode = LightExtensionSourceMode;

type JSActionRunJSValue = RunJSValue;

type JSActionSourceModeParams = LightExtensionSourceModeParams;

type JSActionRuntimeError = RuntimeErrorInfo;

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
};

type JSActionRuntimeModel = FlowModel & {
  uid: string;
  use?: string;
};

type JSActionRuntimeContext = FlowRuntimeContext<JSActionRuntimeModel> & {
  defineProperty: (key: string, options: Record<string, unknown>) => void;
  runjs: (code: string, globals?: Record<string, unknown>, options?: { version: string }) => Promise<unknown>;
};

const jsActionRuntimeRunTracker = createRuntimeRunTracker();

export function normalizeJSActionSourceMode(value: unknown): JSActionSourceMode {
  return normalizeLightExtensionSourceMode(value);
}

export function getJSActionRunJsStepParams(model: JSActionRuntimeModel): Record<string, unknown> {
  const params = model.getStepParams('clickSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

export function beginJSActionRuntimeRun(model: JSActionRuntimeModel): number {
  return jsActionRuntimeRunTracker.begin(model);
}

export function isCurrentJSActionRuntimeRun(model: JSActionRuntimeModel, runId: number): boolean {
  return jsActionRuntimeRunTracker.isCurrent(model, runId);
}

export function createJSActionSourceModeStep(): StepDefinition {
  return createLightExtensionSourceModeStep({
    kind: 'js-action',
    component: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    createMenuUIMode: createRunJSSourceCascadeMenuUIMode,
    hooks: {
      defaultParams: getJSActionSourceDefaultParams,
      beforeParamsSave: syncJSActionSourceToRunJs,
      afterParamsSave: refreshJSActionAfterSourceSave,
    },
  });
}

export function createJSActionSourceBindingStep(): StepDefinition {
  return createLightExtensionSourceBindingStep({
    kind: 'js-action',
    component: JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    hooks: {
      defaultParams: getJSActionSourceDefaultParams,
      beforeParamsSave: syncJSActionSourceToRunJs,
      afterParamsSave: refreshJSActionAfterSourceSave,
    },
  });
}

export function createJSActionRunJsUISchema(options: { minHeight?: string } = {}) {
  return createLightExtensionRunJsUISchema({
    kind: 'js-action',
    scene: 'eventFlow',
    surfaceStyle: 'action',
    minHeight: options.minHeight,
    decorateCode: false,
  });
}

export function createJSActionEmbeddedEditorUIMode(ctx: { model: JSActionRuntimeModel }) {
  return {
    type: 'embed' as const,
    props: {
      title: getJSActionRunJsEditorTitle(ctx),
      footer: null,
      maxWidth: '960px',
      minWidth: '720px',
      width: '45%',
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          transform: 'translateX(0)',
        },
      },
    },
  };
}

export async function getJSActionRuntimeFlowSettingSteps(
  model: JSActionRuntimeModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getJSActionRunJsStepParams(model);
  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor) {
    return undefined;
  }
  return createLightExtensionSettingSteps<JSActionRuntimeModel>({
    descriptor,
    settings: isRecord(params.settings) ? params.settings : {},
    component: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: syncLightExtensionSettingToRunJs,
    afterParamsSave: refreshJSActionAfterSettingsSave,
  });
}

export async function runJSActionRuntime(input: {
  ctx: JSActionRuntimeContext;
  params: Record<string, unknown>;
  runJs: JSActionRunJSValue;
}): Promise<void> {
  const { ctx, params, runJs } = input;
  const runId = beginJSActionRuntimeRun(ctx.model);
  ctx.model.setProps('loading', true);
  try {
    const resolved = await resolveJSActionRuntimeRunJS({
      model: ctx.model,
      params,
      runJs,
    });
    if (!isCurrentJSActionRuntimeRun(ctx.model, runId)) {
      return;
    }
    await runResolvedJSActionCode({ ctx, resolved });
  } catch (error) {
    if (!isCurrentJSActionRuntimeRun(ctx.model, runId)) {
      return;
    }
    if (error instanceof FlowExitException || error instanceof FlowExitAllException) {
      throw error;
    }
    showJSActionRuntimeError(ctx, error);
  } finally {
    if (isCurrentJSActionRuntimeRun(ctx.model, runId)) {
      ctx.model.setProps('loading', false);
    }
  }
}

export async function resolveJSActionRuntimeRunJS(input: {
  model: JSActionRuntimeModel;
  params: Record<string, unknown>;
  runJs: JSActionRunJSValue;
}): Promise<ResolvedRuntimeRunJS> {
  const { model, params, runJs } = input;
  const runtimeSettings = getJSActionRuntimeSettings(params);
  return resolveRuntimeRunJS({
    runJs,
    sourceMode: params.sourceMode as string | undefined,
    sourceBinding: isRecord(params.sourceBinding) ? (params.sourceBinding as RunJSSourceBinding) : undefined,
    settings: runtimeSettings,
    context: {
      modelUid: model.uid,
      ownerKind: JS_ACTION_OWNER_KIND,
      ownerLocator: buildJSActionOwnerLocator(model),
    },
  });
}

export async function runResolvedJSActionCode(input: {
  ctx: JSActionRuntimeContext;
  resolved: ResolvedRuntimeRunJS;
}): Promise<void> {
  const { ctx, resolved } = input;
  ctx.defineProperty('settings', {
    value: resolved.settings,
  });
  ctx.defineProperty('runJsSource', {
    value: {
      sourceMode: resolved.sourceMode,
      sourceBinding: resolved.sourceBinding,
      sourceMap: resolved.sourceMap,
      context: resolved.context,
    },
  });

  const result = (await ctx.runjs(resolved.code, undefined, { version: resolved.version })) as RunJSExecutionResult;

  if (result?.success === false) {
    throw result.error || new Error('RunJS execution failed');
  }
}

export function buildJSActionOwnerLocator(model: JSActionRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_ACTION_OWNER_KIND,
    modelUid: model.uid,
    use: getRunJSModelUse(model),
  };
}

function getJSActionSourceDefaultParams(ctx: FlowSettingsContext<JSActionRuntimeModel>): JSActionSourceModeParams {
  const runJs = getJSActionRunJsStepParams(ctx.model);
  return {
    sourceMode: normalizeJSActionSourceMode(runJs.sourceMode),
    sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
    settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
  };
}

async function syncJSActionSourceToRunJs(
  ctx: FlowSettingsContext<JSActionRuntimeModel>,
  params: JSActionSourceModeParams,
) {
  const sourceMode = normalizeJSActionSourceMode(params?.sourceMode);
  const sourceBinding = isRecord(params.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
  if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
    ctx.model.context?.message?.error?.(ctx.model.context.t('Select a light extension entry'));
    throw new FlowCancelSaveException('Light extension source binding is required.');
  }
  const currentRunJs = getJSActionRunJsStepParams(ctx.model);
  const descriptor =
    sourceMode === LIGHT_EXTENSION_SOURCE_MODE
      ? await getLightExtensionSettingsDescriptor(ctx.model, { ...params, sourceMode, sourceBinding })
      : null;
  const normalized = normalizeLightExtensionSourceSettingsForBinding({
    currentRunJs,
    nextSourceMode: sourceMode,
    nextSourceBinding: sourceBinding,
    nextSettings: params.settings,
    descriptor,
  });
  setCanonicalLightExtensionSource(ctx.model, 'clickSettings', {
    sourceMode,
    sourceBinding,
    settings: normalized.settings,
  });
  rememberLightExtensionBindingSettings(ctx.model, descriptor, normalized.missingRequiredPaths);
}

async function refreshJSActionAfterSettingsSave(ctx: FlowSettingsContext<JSActionRuntimeModel>) {
  ctx.model.invalidateFlowCache('clickSettings', true);
  await ctx.model.rerender();
}

async function refreshJSActionAfterSourceSave(ctx: FlowSettingsContext<JSActionRuntimeModel>) {
  await refreshJSActionAfterSettingsSave(ctx);
  await showPendingLightExtensionRequiredSettings(ctx.model, 'clickSettings');
}

async function getLightExtensionSettingsDescriptor(model: JSActionRuntimeModel, params: Record<string, unknown>) {
  return getSharedLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: JS_ACTION_OWNER_KIND,
    ownerLocator: buildJSActionOwnerLocator(model),
    params,
    sourceLocator: {
      kind: 'flowModel.step',
      modelUid: model.uid,
      flowKey: 'clickSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    },
  });
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSActionRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  setCanonicalLightExtensionSetting(ctx.model, 'clickSettings', fieldName, value);
}

function getJSActionRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
  return cloneRecord(params.settings);
}

function getJSActionRunJsEditorTitle(ctx: { model: JSActionRuntimeModel }): string {
  const translate = getModelTranslator(ctx.model);
  const params = getJSActionRunJsStepParams(ctx.model);
  const baseTitle = translate('Write JavaScript');
  if (normalizeJSActionSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
    return baseTitle;
  }

  const sourceTitle =
    getLightExtensionStoredBindingTitle(params.sourceBinding) ||
    getLightExtensionFallbackBindingTitle(params.sourceBinding);
  return sourceTitle
    ? `${baseTitle} (${translate('Light extension')}: ${sourceTitle})`
    : `${baseTitle} (${translate('Light extension')})`;
}

function showJSActionRuntimeError(ctx: JSActionRuntimeContext, error: unknown) {
  const normalized = normalizeRuntimeError(error);
  const message = getRecordProperty(ctx, 'message');
  const showError = getCallableProperty(message, 'error');
  const translate = getCallableProperty(ctx, 't') || getCallableProperty(ctx.model.context, 't');
  const fallbackMessage =
    typeof translate === 'function' ? translate('Failed to run JavaScript action') : 'Failed to run JavaScript action';
  showError?.(normalized.message || fallbackMessage);
}

function normalizeRuntimeError(error: unknown): JSActionRuntimeError {
  return normalizeLightExtensionRuntimeError(error, {
    defaultTitle: 'JavaScript action runtime error',
    defaultHint: 'Check the JavaScript action configuration and retry.',
    defaultMessage: 'Failed to run JavaScript action',
    outdatedHint: 'Refresh the action settings and choose the current entry.',
    invalidSettingsHint: 'Open the action settings and fix the light extension settings.',
  });
}

function getCallableProperty(value: unknown, key: string): ((...args: unknown[]) => unknown) | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return typeof property === 'function' ? (property as (...args: unknown[]) => unknown) : undefined;
}
