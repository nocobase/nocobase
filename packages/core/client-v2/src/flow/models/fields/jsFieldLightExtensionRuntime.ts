/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  resetRunJSRuntimeElement,
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
} from '../../components/runjs-source';
import type { FieldModel } from '../base/FieldModel';
import {
  createLightExtensionRunJsUISchema,
  createRunJSEditorEmbedUIMode,
  createLightExtensionSettingSteps,
  createLightExtensionSourcePlumbing,
  createLightExtensionSourceBindingStep,
  createLightExtensionSourceModeStep,
  createRuntimeRunTracker,
  getRecordProperty,
  getStringProperty,
  INLINE_SOURCE_MODE,
  isRecord,
  LIGHT_EXTENSION_SOURCE_MODE,
  normalizeLightExtensionRuntimeError,
  normalizeLightExtensionSourceMode,
  stableSerialize,
  stableSerializeWithCircular,
  toNonEmptyString,
  type LightExtensionSourceMode,
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

type JSFieldRuntimeError = RuntimeErrorInfo;

type RunJSExecutionResult = {
  success?: boolean;
  error?: unknown;
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

const jsFieldSource = createLightExtensionSourcePlumbing<JSFieldRuntimeModel>({
  flowKey: 'jsSettings',
  stepKey: 'runJs',
  ownerKind: JS_FIELD_OWNER_KIND,
  getOwnerLocator: buildJSFieldOwnerLocator,
  afterParamsSave: refreshJSFieldAfterSettingsSave,
});

export function normalizeJSFieldSourceMode(value: unknown): JSFieldSourceMode {
  return normalizeLightExtensionSourceMode(value);
}

export function getJSFieldRunJsStepParams(model: JSFieldRuntimeModel): Record<string, unknown> {
  return jsFieldSource.getRunJsStepParams(model);
}

export function getJSFieldSourceSignature(model: JSFieldRuntimeModel, inlineCode?: string): string {
  const runJs = getJSFieldRunJsStepParams(model);
  const sourceMode = normalizeJSFieldSourceMode(runJs.sourceMode);

  return stableSerialize({
    sourceMode,
    sourceBinding: runJs.sourceBinding,
    settings: runJs.settings,
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
      beforeParamsSave: jsFieldSource.beforeParamsSave,
      afterParamsSave: jsFieldSource.afterSourceParamsSave,
    },
  });
}

export function createJSFieldSourceBindingStep(): StepDefinition {
  return createLightExtensionSourceBindingStep({
    kind: 'js-field',
    component: JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
    hooks: {
      defaultParams: getJSFieldSourceDefaultParams,
      beforeParamsSave: jsFieldSource.beforeParamsSave,
      afterParamsSave: jsFieldSource.afterSourceParamsSave,
    },
  });
}

export function createJSFieldRunJsUISchema(options: { scene: string; minHeight?: string } = { scene: 'block' }) {
  return createLightExtensionRunJsUISchema({
    kind: 'js-field',
    scene: options.scene,
    surfaceStyle: 'render',
    minHeight: options.minHeight,
  });
}

export async function createJSFieldEmbeddedEditorUIMode(ctx: { model: JSFieldRuntimeModel }) {
  return createRunJSEditorEmbedUIMode(await getJSFieldRunJsEditorTitle(ctx));
}

export async function getJSFieldRunJsEditorTitle(ctx: { model: JSFieldRuntimeModel }): Promise<string> {
  return jsFieldSource.getEditorTitle(ctx.model);
}

export async function getJSFieldRuntimeFlowSettingSteps(
  model: JSFieldRuntimeModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getJSFieldRunJsStepParams(model);
  const descriptor = await getLightExtensionSettingsDescriptor(model, params);
  if (!descriptor) {
    return undefined;
  }
  return createLightExtensionSettingSteps<JSFieldRuntimeModel>({
    descriptor,
    settings: isRecord(params.settings) ? params.settings : {},
    component: JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
    syncValue: syncLightExtensionSettingToRunJs,
    afterParamsSave: refreshJSFieldAfterSettingsSave,
  });
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

  // Inline scripts keep the released behavior: envelope failures stay silent instead of rendering an error
  if (result?.success === false && resolved.sourceMode !== INLINE_SOURCE_MODE) {
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
  resetRunJSRuntimeElement(element);
}

export function buildJSFieldOwnerLocator(model: JSFieldRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_FIELD_OWNER_KIND,
    modelUid: model.uid,
    use: getRunJSModelUse(model),
  };
}

function getJSFieldSourceDefaultParams(ctx: FlowSettingsContext<JSFieldRuntimeModel>) {
  return jsFieldSource.getSourceDefaultParams(ctx);
}

async function refreshJSFieldAfterSettingsSave(ctx: FlowSettingsContext<JSFieldRuntimeModel>) {
  ctx.model.invalidateFlowCache('jsSettings', true);
  await ctx.model.rerender();
}

async function getLightExtensionSettingsDescriptor(model: JSFieldRuntimeModel, params: Record<string, unknown>) {
  return jsFieldSource.getSettingsDescriptor(model, params);
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSFieldRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  jsFieldSource.syncSetting(ctx, fieldName, value);
}

const getJSFieldRuntimeSettings = jsFieldSource.getRuntimeSettings;

function normalizeRuntimeError(error: unknown): JSFieldRuntimeError {
  return normalizeLightExtensionRuntimeError(error, {
    defaultTitle: 'JavaScript field runtime error',
    defaultHint: 'Check the JavaScript field configuration and retry.',
    defaultMessage: 'Failed to run JavaScript field',
    outdatedHint: 'Refresh the field settings and choose the current entry.',
    invalidSettingsHint: 'Open the field settings and fix the light extension settings.',
  });
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
