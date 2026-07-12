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
  type FlowModel,
  type ParamObject,
  type FlowRuntimeContext,
  type RunJSValue,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';

import {
  resolveRuntimeRunJS,
  createRunJSSourceCascadeMenuUIMode,
  getDescriptorSchemaHash,
  getRunJSModelUse,
  getSettingsSchemaProperties,
  getSettingsSchemaRequired,
  type JsonSchemaLike,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
} from '../../components/runjs-source';
import {
  cloneJsonValue,
  cloneRecord,
  createLightExtensionRunJsUISchema,
  createLightExtensionSettingStep as createSharedLightExtensionSettingStep,
  createLightExtensionSourceBindingStep,
  createLightExtensionSourceModeStep,
  createRuntimeRunTracker,
  getLightExtensionFallbackBindingTitle,
  getLightExtensionSettingDefaultValue,
  getLightExtensionSettingsDescriptor as getSharedLightExtensionSettingsDescriptor,
  getLightExtensionStoredBindingTitle,
  getModelTranslator,
  getRecordProperty,
  INLINE_SOURCE_MODE,
  isRecord,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceMode,
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
      afterParamsSave: refreshJSActionAfterSettingsSave,
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
      afterParamsSave: refreshJSActionAfterSettingsSave,
    },
  });
}

export function createJSActionRunJsUISchema(options: { minHeight?: string } = {}) {
  return createLightExtensionRunJsUISchema({
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
  if (!descriptor?.schema) {
    return undefined;
  }

  const properties = getSettingsSchemaProperties(descriptor.schema);
  if (Object.keys(properties).length === 0) {
    return undefined;
  }

  const requiredFields = getSettingsSchemaRequired(descriptor.schema);
  const schemaHash = getDescriptorSchemaHash(descriptor);
  const descriptorDefaults = cloneRecord(descriptor.defaults);
  const legacySettings = isRecord(params.settings) ? params.settings : {};

  return Object.fromEntries(
    Object.entries(properties).map(([fieldName, fieldSchema], index) =>
      createLightExtensionSettingStep({
        fieldName,
        fieldSchema,
        required: requiredFields.has(fieldName),
        schemaHash,
        defaultValue: getLightExtensionSettingDefaultValue(fieldName, fieldSchema, descriptorDefaults, legacySettings),
        sort: 700 + index,
      }),
    ),
  );
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

function syncJSActionSourceToRunJs(ctx: FlowSettingsContext<JSActionRuntimeModel>, params: JSActionSourceModeParams) {
  const sourceMode = normalizeJSActionSourceMode(params?.sourceMode);
  const sourceBinding = isRecord(params.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
  if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
    ctx.model.context?.message?.error?.(ctx.model.context.t('Select a light extension entry'));
    throw new FlowCancelSaveException('Light extension source binding is required.');
  }
  const settings = isRecord(params.settings) ? cloneJsonValue(params.settings) : {};
  ctx.model.setStepParams('clickSettings', {
    sourceBinding: toParamObject(sourceBinding),
    settings: toParamObject(settings),
  });
  ctx.model.setStepParams('clickSettings', 'runJs', {
    ...getJSActionRunJsStepParams(ctx.model),
    sourceMode,
    sourceBinding,
    settings,
  });
}

async function refreshJSActionAfterSettingsSave(ctx: FlowSettingsContext<JSActionRuntimeModel>) {
  ctx.model.invalidateFlowCache('clickSettings', true);
  await ctx.model.rerender();
}

async function getLightExtensionSettingsDescriptor(model: JSActionRuntimeModel, params: Record<string, unknown>) {
  return getSharedLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: JS_ACTION_OWNER_KIND,
    ownerLocator: buildJSActionOwnerLocator(model),
    params,
  });
}

function createLightExtensionSettingStep(options: {
  fieldName: string;
  fieldSchema: JsonSchemaLike;
  required: boolean;
  schemaHash: string;
  defaultValue: unknown;
  sort: number;
}): [string, StepDefinition] {
  const { fieldName, fieldSchema, required, schemaHash, defaultValue, sort } = options;
  const stepKey = getLightExtensionSettingStepKey(fieldName, schemaHash);
  return createSharedLightExtensionSettingStep<JSActionRuntimeModel>({
    fieldName,
    fieldSchema,
    required,
    stepKey,
    defaultValue,
    sort,
    component: JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: syncLightExtensionSettingToRunJs,
    afterParamsSave: refreshJSActionAfterSettingsSave,
  });
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSActionRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  const runJs = getJSActionRunJsStepParams(ctx.model);
  const topLevelSettings = ctx.model.getStepParams('clickSettings', 'settings');
  const settings = isRecord(runJs.settings)
    ? cloneRecord(runJs.settings)
    : isRecord(topLevelSettings)
      ? cloneRecord(topLevelSettings)
      : {};
  settings[fieldName] = cloneJsonValue(value);
  ctx.model.setStepParams('clickSettings', {
    settings: toParamObject(settings),
  });
  ctx.model.setStepParams('clickSettings', 'runJs', {
    ...runJs,
    settings,
  });
}

function getJSActionRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
  const legacySettings = isRecord(params.settings) ? params.settings : {};
  return cloneRecord(legacySettings);
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

function sanitizeSettingFieldName(fieldName: string): string {
  const sanitized = fieldName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return (sanitized || 'field').slice(0, 48);
}

function getLightExtensionSettingStepKey(fieldName: string, schemaHash: string): string {
  return `leSetting__${sanitizeSettingFieldName(fieldName)}__${shortHash(`${fieldName}:${schemaHash}`)}`;
}

function getCallableProperty(value: unknown, key: string): ((...args: unknown[]) => unknown) | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return typeof property === 'function' ? (property as (...args: unknown[]) => unknown) : undefined;
}

function toParamObject(value: unknown): ParamObject {
  return isRecord(value) ? (value as ParamObject) : {};
}

function shortHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}
