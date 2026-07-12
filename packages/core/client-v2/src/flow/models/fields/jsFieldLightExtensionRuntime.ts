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
import type { FieldModel } from '../base/FieldModel';
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
  getLightExtensionSettingStepKey,
  getLightExtensionSettingsDescriptor as getSharedLightExtensionSettingsDescriptor,
  getLightExtensionStoredBindingTitle,
  getModelTranslator,
  getRecordProperty,
  getStringProperty,
  INLINE_SOURCE_MODE,
  isRecord,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceMode,
  resolveLightExtensionBindingTitle as resolveSharedLightExtensionBindingTitle,
  stableSerialize,
  stableSerializeWithCircular,
  toNonEmptyString,
  type LightExtensionSourceMode,
  type LightExtensionSourceModeParams,
  type RuntimeErrorInfo,
} from '../utils/runjsSourceRuntimeCommon';
import {
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSFieldSourceModeField';

export { INLINE_SOURCE_MODE, LIGHT_EXTENSION_SOURCE_MODE };
export const JS_FIELD_OWNER_KIND = 'flowModel.fieldSettings';

export type JSFieldSourceMode = LightExtensionSourceMode;

type JSFieldRunJSValue = RunJSValue;

type JSFieldSourceModeParams = LightExtensionSourceModeParams;

type JSFieldRuntimeError = RuntimeErrorInfo;

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
};

type RunJSRootEntry = {
  root?: {
    unmount?: () => void;
  };
  disposeTheme?: () => void;
  unmount?: () => void;
};

const jsFieldRuntimeRunTracker = createRuntimeRunTracker();

type JSFieldRuntimeModel = FieldModel & {
  uid: string;
  use?: string;
  getStepParams(flowKey: string, stepKey: string): unknown;
  getStepParams(flowKey: string): Record<string, unknown> | undefined;
  setStepParams(flowKey: string, stepParams: Record<string, unknown>): void;
  setStepParams(flowKey: string, stepKey: string, params?: unknown): void;
  invalidateFlowCache(flowKey: string, deep?: boolean): void;
  rerender(): Promise<unknown>;
};

type JSFieldRuntimeContext = FlowRuntimeContext<JSFieldRuntimeModel> & {
  defineProperty: (key: string, options: Record<string, unknown>) => void;
  defineMethod?: (key: string, method: (...args: unknown[]) => unknown) => void;
  runjs: (code: string, globals?: Record<string, unknown>, options?: { version: string }) => Promise<unknown>;
};

export function normalizeJSFieldSourceMode(value: unknown): JSFieldSourceMode {
  return normalizeLightExtensionSourceMode(value);
}

export function getJSFieldRunJsStepParams(model: JSFieldRuntimeModel): Record<string, unknown> {
  const params = model.getStepParams('jsSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

export function getJSFieldSourceSignature(model: JSFieldRuntimeModel, inlineCode?: string): string {
  const jsSettings = model.getStepParams('jsSettings') || {};
  const runJs = getJSFieldRunJsStepParams(model);
  const sourceMode = normalizeJSFieldSourceMode(runJs.sourceMode);
  const runtimeSettingsParams = Object.fromEntries(
    Object.entries(jsSettings).filter(([key]) => key.startsWith('leSetting__')),
  );

  return stableSerialize({
    sourceMode,
    sourceBinding: runJs.sourceBinding,
    settings: runJs.settings,
    runtimeSettingsParams,
    code: typeof inlineCode === 'string' ? inlineCode : runJs.code,
    version: runJs.version,
  });
}

export function getJSFieldContextSignature(model: JSFieldRuntimeModel): string {
  return stableSerializeWithCircular({
    record: getRecordProperty(model.context, 'record'),
    collectionField: getCollectionFieldSignature(getRecordProperty(model.context, 'collectionField')),
  });
}

export function hasRunnableJSFieldSource(model: JSFieldRuntimeModel, inlineCode?: string): boolean {
  const runJs = getJSFieldRunJsStepParams(model);
  if (normalizeJSFieldSourceMode(runJs.sourceMode) === LIGHT_EXTENSION_SOURCE_MODE) {
    return isRecord(runJs.sourceBinding);
  }
  const code = typeof inlineCode === 'string' ? inlineCode : runJs.code;
  return typeof code === 'string' && code.trim().length > 0;
}

export function beginJSFieldRuntimeRun(model: JSFieldRuntimeModel): number {
  return jsFieldRuntimeRunTracker.begin(model);
}

export function isCurrentJSFieldRuntimeRun(model: JSFieldRuntimeModel, runId: number): boolean {
  return jsFieldRuntimeRunTracker.isCurrent(model, runId);
}

export function createJSFieldSourceModeStep(): StepDefinition {
  return createLightExtensionSourceModeStep({
    kind: 'js-field',
    component: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    createMenuUIMode: createRunJSSourceCascadeMenuUIMode,
    hooks: {
      defaultParams: getJSFieldSourceDefaultParams,
      beforeParamsSave: syncJSFieldSourceToRunJs,
      afterParamsSave: refreshJSFieldAfterSettingsSave,
    },
  });
}

export function createJSFieldSourceBindingStep(): StepDefinition {
  return createLightExtensionSourceBindingStep({
    kind: 'js-field',
    component: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    hooks: {
      defaultParams: getJSFieldSourceDefaultParams,
      beforeParamsSave: syncJSFieldSourceToRunJs,
      afterParamsSave: refreshJSFieldAfterSettingsSave,
    },
  });
}

export function createJSFieldRunJsUISchema(options: { scene: string; minHeight?: string } = { scene: 'block' }) {
  return createLightExtensionRunJsUISchema({
    scene: options.scene,
    surfaceStyle: 'render',
    minHeight: options.minHeight,
  });
}

export async function getJSFieldRunJsEditorTitle(ctx: { model: JSFieldRuntimeModel }): Promise<string> {
  const translate = getModelTranslator(ctx.model);
  const params = getJSFieldRunJsStepParams(ctx.model);
  const baseTitle = translate('Write JavaScript');
  if (normalizeJSFieldSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
    return baseTitle;
  }

  const sourceTitle =
    getLightExtensionStoredBindingTitle(params.sourceBinding) ||
    (await resolveLightExtensionBindingTitle(ctx, params)) ||
    getLightExtensionFallbackBindingTitle(params.sourceBinding);
  return sourceTitle
    ? `${baseTitle} (${translate('Light extension')}: ${sourceTitle})`
    : `${baseTitle} (${translate('Light extension')})`;
}

export async function getJSFieldRuntimeFlowSettingSteps(
  model: JSFieldRuntimeModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getJSFieldRunJsStepParams(model);
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

export async function resolveJSFieldRuntimeRunJS(input: {
  model: JSFieldRuntimeModel;
  params: Record<string, unknown>;
  runJs: JSFieldRunJSValue;
}): Promise<ResolvedRuntimeRunJS> {
  const { model, params, runJs } = input;
  const runtimeSettings = getJSFieldRuntimeSettings(params);
  return resolveRuntimeRunJS({
    runJs,
    sourceMode: params.sourceMode as string | undefined,
    sourceBinding: isRecord(params.sourceBinding) ? (params.sourceBinding as RunJSSourceBinding) : undefined,
    settings: runtimeSettings,
    context: {
      modelUid: model.uid,
      ownerKind: JS_FIELD_OWNER_KIND,
      ownerLocator: buildJSFieldOwnerLocator(model),
    },
  });
}

export async function runResolvedJSFieldCode(input: {
  ctx: JSFieldRuntimeContext;
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

export function renderJSFieldRuntimeError(element: HTMLElement, error: unknown, testId: string): void {
  const normalized = normalizeRuntimeError(error);
  resetJSFieldRuntimeElement(element);
  const errorElement = document.createElement('span');
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('data-testid', testId);
  errorElement.style.color = '#ff4d4f';
  errorElement.style.display = 'inline-block';
  errorElement.style.maxWidth = '100%';
  errorElement.style.whiteSpace = 'normal';
  errorElement.textContent = [normalized.title, normalized.message, normalized.code].filter(Boolean).join(' | ');
  element.appendChild(errorElement);
}

export function resetJSFieldRuntimeElement(element: HTMLElement): void {
  const globalWithRunJsRoots = globalThis as typeof globalThis & {
    __nbRunjsRoots?: WeakMap<object, RunJSRootEntry>;
  };
  const rootMap = globalWithRunJsRoots.__nbRunjsRoots;
  const existingEntry = rootMap?.get(element);
  if (existingEntry) {
    disposeRunJSRootEntry(existingEntry);
    rootMap?.delete(element);
  }
  element.innerHTML = '';
}

export function buildJSFieldOwnerLocator(model: JSFieldRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_FIELD_OWNER_KIND,
    modelUid: model.uid,
    use: getRunJSModelUse(model),
  };
}

function getJSFieldSourceDefaultParams(ctx: FlowSettingsContext<JSFieldRuntimeModel>): JSFieldSourceModeParams {
  const runJs = getJSFieldRunJsStepParams(ctx.model);
  return {
    sourceMode: normalizeJSFieldSourceMode(runJs.sourceMode),
    sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
    settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
  };
}

function syncJSFieldSourceToRunJs(ctx: FlowSettingsContext<JSFieldRuntimeModel>, params: JSFieldSourceModeParams) {
  const sourceMode = normalizeJSFieldSourceMode(params?.sourceMode);
  const sourceBinding = isRecord(params.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
  if (sourceMode === LIGHT_EXTENSION_SOURCE_MODE && !sourceBinding) {
    ctx.model.context?.message?.error?.(ctx.model.context.t('Select a light extension entry'));
    throw new FlowCancelSaveException('Light extension source binding is required.');
  }
  const settings = isRecord(params.settings) ? cloneJsonValue(params.settings) : {};
  ctx.model.setStepParams('jsSettings', {
    sourceBinding,
    settings,
  });
  ctx.model.setStepParams('jsSettings', 'runJs', {
    ...getJSFieldRunJsStepParams(ctx.model),
    sourceMode,
    sourceBinding,
    settings,
  });
}

async function refreshJSFieldAfterSettingsSave(ctx: FlowSettingsContext<JSFieldRuntimeModel>) {
  ctx.model.invalidateFlowCache('jsSettings', true);
  await ctx.model.rerender();
}

async function getLightExtensionSettingsDescriptor(model: JSFieldRuntimeModel, params: Record<string, unknown>) {
  return getSharedLightExtensionSettingsDescriptor({
    modelUid: model.uid,
    ownerKind: JS_FIELD_OWNER_KIND,
    ownerLocator: buildJSFieldOwnerLocator(model),
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
  return createSharedLightExtensionSettingStep<JSFieldRuntimeModel>({
    fieldName,
    fieldSchema,
    required,
    stepKey: getLightExtensionSettingStepKey(fieldName, schemaHash),
    defaultValue,
    sort,
    component: JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: syncLightExtensionSettingToRunJs,
    afterParamsSave: refreshJSFieldAfterSettingsSave,
  });
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSFieldRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  const runJs = getJSFieldRunJsStepParams(ctx.model);
  const topLevelSettings = ctx.model.getStepParams('jsSettings', 'settings');
  const settings = isRecord(runJs.settings)
    ? cloneRecord(runJs.settings)
    : isRecord(topLevelSettings)
      ? cloneRecord(topLevelSettings)
      : {};
  settings[fieldName] = cloneJsonValue(value);
  ctx.model.setStepParams('jsSettings', {
    settings,
  });
  ctx.model.setStepParams('jsSettings', 'runJs', {
    ...runJs,
    settings,
  });
}

function getJSFieldRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
  const legacySettings = isRecord(params.settings) ? params.settings : {};
  return cloneRecord(legacySettings);
}

async function resolveLightExtensionBindingTitle(ctx: { model: JSFieldRuntimeModel }, params: Record<string, unknown>) {
  return resolveSharedLightExtensionBindingTitle({
    modelUid: ctx.model.uid,
    ownerKind: JS_FIELD_OWNER_KIND,
    ownerLocator: buildJSFieldOwnerLocator(ctx.model),
    params,
  });
}

function normalizeRuntimeError(error: unknown): JSFieldRuntimeError {
  return normalizeLightExtensionRuntimeError(error, {
    defaultTitle: 'JavaScript field runtime error',
    defaultHint: 'Check the JavaScript field configuration and retry.',
    defaultMessage: 'Failed to run JavaScript field',
    outdatedHint: 'Refresh the field settings and choose the current entry.',
    invalidSettingsHint: 'Open the field settings and fix the light extension settings.',
  });
}

function disposeRunJSRootEntry(entry: RunJSRootEntry): void {
  if (typeof entry.disposeTheme === 'function') {
    try {
      entry.disposeTheme();
    } catch {
      // ignore cleanup failures
    }
  }
  const root = entry.root || entry;
  if (typeof root.unmount === 'function') {
    try {
      root.unmount();
    } catch {
      // ignore cleanup failures
    }
  }
}

function getCollectionFieldSignature(value: unknown): unknown {
  if (!isRecord(value)) {
    return value;
  }
  return {
    name: value.name,
    type: value.type,
    interface: value.interface,
    collectionName: getRecordProperty(value.collection, 'name'),
    targetCollectionName: getRecordProperty(value.targetCollection, 'name'),
  };
}
