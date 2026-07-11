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
  getSchemaTitle,
  getSettingsSchemaProperties,
  getSettingsSchemaRequired,
  isSettingValueValid,
  normalizeSchemaType,
  RunJSSourceResolverRegistry,
  type JsonSchemaLike,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../components/runjs-source';
import { RunJSEditorField } from '../../components/runjs-studio';
import type { FieldModel } from '../base/FieldModel';
import {
  JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSFieldSourceModeField';

export const INLINE_SOURCE_MODE = 'inline';
export const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
export const JS_FIELD_OWNER_KIND = 'flowModel.fieldSettings';

export type JSFieldSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;

type JSFieldRunJSValue = RunJSValue;

type JSFieldSourceModeParams = {
  sourceMode?: string;
  sourceBinding?: unknown;
  settings?: unknown;
};

type JSFieldRuntimeError = {
  title: string;
  hint: string;
  message: string;
  code?: string;
  status?: number;
};

type ServerErrorShape = {
  code?: string;
  status?: number;
  message?: string;
};

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

const jsFieldRuntimeRunIds = new WeakMap<object, number>();

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
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
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
  const runId = (jsFieldRuntimeRunIds.get(model) || 0) + 1;
  jsFieldRuntimeRunIds.set(model, runId);
  return runId;
}

export function isCurrentJSFieldRuntimeRun(model: JSFieldRuntimeModel, runId: number): boolean {
  return jsFieldRuntimeRunIds.get(model) === runId;
}

export function createJSFieldSourceModeStep(): StepDefinition {
  return {
    title: '{{t("Code source")}}',
    uiMode: createRunJSSourceCascadeMenuUIMode({
      kind: 'js-field',
    }),
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
        'x-component-props': {
          kind: 'js-field',
        },
      },
      sourceBinding: {
        type: 'object',
        'x-display': 'hidden',
      },
      settings: {
        type: 'object',
        'x-display': 'hidden',
      },
    },
    defaultParams: getJSFieldSourceDefaultParams,
    beforeParamsSave: syncJSFieldSourceToRunJs,
    afterParamsSave: refreshJSFieldAfterSettingsSave,
  };
}

export function createJSFieldSourceBindingStep(): StepDefinition {
  return {
    title: '{{t("Light extension source")}}',
    hideInSettings: true,
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-display': 'hidden',
      },
      sourceBinding: {
        type: 'object',
        'x-decorator': 'FormItem',
        'x-component': JS_FIELD_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
        'x-component-props': {
          kind: 'js-field',
        },
      },
      settings: {
        type: 'object',
        'x-display': 'hidden',
      },
    },
    defaultParams: getJSFieldSourceDefaultParams,
    beforeParamsSave: syncJSFieldSourceToRunJs,
    afterParamsSave: refreshJSFieldAfterSettingsSave,
  };
}

export function createJSFieldRunJsUISchema(options: { scene: string; minHeight?: string } = { scene: 'block' }) {
  return {
    sourceMode: {
      type: 'string',
      'x-display': 'hidden',
    },
    sourceBinding: {
      type: 'object',
      'x-display': 'hidden',
    },
    settings: {
      type: 'object',
      'x-display': 'hidden',
    },
    code: {
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': RunJSEditorField,
      'x-component-props': {
        locatorFactory: 'flowModel.step',
        surfaceStyle: 'render',
        scene: options.scene,
        height: '100%',
        minHeight: options.minHeight || '320px',
        theme: 'light',
        enableLinter: true,
        containerStyle: {
          height: '100%',
          minHeight: 0,
          minWidth: 0,
        },
      },
    },
  };
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

async function getLightExtensionSettingsDescriptor(
  model: JSFieldRuntimeModel,
  params: Record<string, unknown>,
): Promise<RunJSSourceSettingsDescriptor | null> {
  if (
    normalizeJSFieldSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE ||
    !isRecord(params.sourceBinding)
  ) {
    return null;
  }

  const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
  if (typeof resolver?.getSettingsDescriptor !== 'function') {
    return null;
  }

  const descriptor = await resolver.getSettingsDescriptor({
    sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
    sourceBinding: params.sourceBinding as RunJSSourceBinding,
    settings: isRecord(params.settings) ? (params.settings as RunJSSourceSettings) : undefined,
    context: {
      modelUid: model.uid,
      ownerKind: JS_FIELD_OWNER_KIND,
      ownerLocator: buildJSFieldOwnerLocator(model),
    },
  });

  if (!descriptor || !isRecord(descriptor)) {
    return null;
  }

  return descriptor;
}

function getLightExtensionSettingDefaultValue(
  fieldName: string,
  fieldSchema: JsonSchemaLike,
  descriptorDefaults: Record<string, unknown>,
  legacySettings: Record<string, unknown>,
): unknown {
  if (Object.prototype.hasOwnProperty.call(legacySettings, fieldName)) {
    return cloneJsonValue(legacySettings[fieldName]);
  }
  if (Object.prototype.hasOwnProperty.call(descriptorDefaults, fieldName)) {
    return cloneJsonValue(descriptorDefaults[fieldName]);
  }
  if (Object.prototype.hasOwnProperty.call(fieldSchema, 'default')) {
    return cloneJsonValue(fieldSchema.default);
  }
  return undefined;
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
  const title = getSchemaTitle(fieldSchema, fieldName);
  const fieldType = normalizeSchemaType(fieldSchema);

  return [
    stepKey,
    {
      key: stepKey,
      title,
      sort,
      uiSchema: {
        value: {
          type: fieldType || 'string',
          title,
          'x-decorator': 'FormItem',
          'x-component': JS_FIELD_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
          'x-component-props': {
            fieldName,
            fieldSchema,
            required,
          },
        },
      },
      defaultParams() {
        return {
          value: cloneJsonValue(defaultValue),
        };
      },
      beforeParamsSave(ctx: FlowSettingsContext<JSFieldRuntimeModel>, params: Record<string, unknown>) {
        if (isSettingValueValid(fieldSchema, params?.value, required)) {
          syncLightExtensionSettingToRunJs(ctx, fieldName, params?.value);
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new FlowCancelSaveException('Light extension settings validation failed.');
      },
      afterParamsSave: refreshJSFieldAfterSettingsSave,
    },
  ];
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

function getLightExtensionStoredBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }

  return (
    toNonEmptyString(binding.entryTitle) || toNonEmptyString(binding.entryName) || toNonEmptyString(binding.repoTitle)
  );
}

function getLightExtensionFallbackBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }

  return toNonEmptyString(binding.entryId) || toNonEmptyString(binding.repoId);
}

async function resolveLightExtensionBindingTitle(ctx: { model: JSFieldRuntimeModel }, params: Record<string, unknown>) {
  if (!isRecord(params.sourceBinding)) {
    return undefined;
  }

  const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
  if (typeof resolver?.getBindingTitle !== 'function') {
    return undefined;
  }

  try {
    const title = await resolver.getBindingTitle({
      sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
      sourceBinding: params.sourceBinding as RunJSSourceBinding,
      settings: isRecord(params.settings) ? (params.settings as RunJSSourceSettings) : undefined,
      context: {
        modelUid: ctx.model.uid,
        ownerKind: JS_FIELD_OWNER_KIND,
        ownerLocator: buildJSFieldOwnerLocator(ctx.model),
      },
    });
    return toNonEmptyString(title);
  } catch (error) {
    console.warn('[NocoBase] Failed to resolve RunJS source binding title:', error);
    return undefined;
  }
}

function getFirstServerError(value: unknown): ServerErrorShape | null {
  if (!isRecord(value)) {
    return null;
  }

  if (Array.isArray(value.errors)) {
    const first = value.errors.find((item) => isRecord(item));
    return isRecord(first) ? first : null;
  }

  return isRecord(value.error) ? value.error : null;
}

function getRuntimeErrorSource(error: unknown): ServerErrorShape {
  if (isRecord(error)) {
    const response = isRecord(error.response) ? error.response : null;
    const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
    if (serverError) {
      return {
        code: toNonEmptyString(serverError.code),
        status: toNumber(serverError.status) ?? toNumber(response?.status),
        message: toNonEmptyString(serverError.message),
      };
    }

    return {
      code: toNonEmptyString(error.code),
      status: toNumber(error.status) ?? toNumber(response?.status),
      message: toNonEmptyString(error.message),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: typeof error === 'string' ? error : undefined,
  };
}

function normalizeRuntimeError(error: unknown): JSFieldRuntimeError {
  const source = getRuntimeErrorSource(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const status = source.status;

  let title = 'JavaScript field runtime error';
  let hint = 'Check the JavaScript field configuration and retry.';
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'Light extension access denied';
    hint = 'Ask an administrator for permission to use this light extension.';
  } else if (status === 404 || normalizedCode.includes('entry_not_found') || normalizedCode.includes('missing')) {
    title = 'Light extension entry missing';
    hint = 'Choose an available entry or restore this entry.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'Light extension binding is outdated';
    hint = 'Refresh the field settings and choose the current entry.';
  } else if (normalizedCode.includes('settings_invalid')) {
    title = 'Light extension settings are invalid';
    hint = 'Open the field settings and fix the light extension settings.';
  } else if (normalizedCode.includes('repo_archived') || normalizedCode.includes('repository_archived')) {
    title = 'Light extension repository is archived';
    hint = 'Restore the repository or choose an entry from another repository.';
  }

  return {
    title,
    hint,
    message: source.message || 'Failed to run JavaScript field',
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
  };
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

function getModelTranslator(model: JSFieldRuntimeModel): (text: string) => string {
  const t = model.context?.t;
  return typeof t === 'function' ? t.bind(model.context) : (text: string) => text;
}

function getStringProperty(value: unknown, key: string): string | undefined {
  return toNonEmptyString(getRecordProperty(value, key));
}

function getRecordProperty(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function cloneRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? cloneJsonValue(value) : {};
}

function cloneJsonValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  const serialized = JSON.stringify(value);
  return typeof serialized === 'undefined' ? 'undefined' : serialized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stableSerializeWithCircular(value: unknown): string {
  const seen = new WeakSet<object>();
  const normalize = (current: unknown): unknown => {
    if (Array.isArray(current)) {
      return current.map((item) => normalize(item));
    }
    if (isRecord(current)) {
      if (seen.has(current)) {
        return '[Circular]';
      }
      seen.add(current);
      return Object.fromEntries(
        Object.keys(current)
          .sort()
          .map((key) => [key, normalize(current[key])]),
      );
    }
    return current;
  };
  try {
    return JSON.stringify(normalize(value));
  } catch {
    return String(value);
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
