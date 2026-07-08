/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ElementProxy,
  FlowCancelSaveException,
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  type FlowModel,
  type FlowRuntimeContext,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import React from 'react';

import {
  resolveRuntimeRunJS,
  RunJSSourceResolverRegistry,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../components/runjs-source';
import { RunJSEditorField } from '../../components/runjs-studio';
import {
  JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSItemSourceModeField';

export const INLINE_SOURCE_MODE = 'inline';
export const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
export const JS_ITEM_OWNER_KIND = 'flowModel.itemSettings';

export type JSItemSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;

type JSItemRunJSValue = {
  code?: string;
  version?: string;
};

type JSItemSourceModeParams = {
  sourceMode?: string;
  sourceBinding?: unknown;
  settings?: unknown;
};

type JsonSchemaLike = Record<string, unknown>;

type SettingsValidationError = {
  label: string;
  message: string;
};

type JSItemRuntimeError = {
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

const jsItemRuntimeRunIds = new WeakMap<object, number>();

type JSItemRuntimeModel = FlowModel & {
  uid: string;
  use?: string;
  getStepParams(flowKey: string, stepKey: string): unknown;
  getStepParams(flowKey: string): Record<string, unknown> | undefined;
  setStepParams(flowKey: string, stepParams: Record<string, unknown>): void;
  setStepParams(flowKey: string, stepKey: string, params?: unknown): void;
  invalidateFlowCache(flowKey: string, deep?: boolean): void;
  rerender(): Promise<unknown>;
};

type JSItemRuntimeContext = FlowRuntimeContext<JSItemRuntimeModel> & {
  defineProperty: (key: string, options: Record<string, unknown>) => void;
  defineMethod?: (key: string, method: (...args: unknown[]) => unknown) => void;
  ref?: React.RefObject<HTMLElement>;
  runjs: (code: string, globals: Record<string, unknown>, options: { version: string }) => Promise<unknown>;
};

type JSItemEventHandler = (...args: unknown[]) => unknown;

type JSItemRuntimeBoundaryHandle = {
  capture: (error: unknown) => void;
};

type JSItemRuntimeErrorState = {
  capture?: (error: unknown) => void;
  cleanups: Set<() => void>;
  disposed: boolean;
  handleError: (error: unknown) => void;
  reactEventHandlers: WeakMap<JSItemEventHandler, JSItemEventHandler>;
  domEventHandlers: WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>;
  eventArgs: WeakMap<object, unknown>;
  scopeRoot?: Node | DocumentFragment | null;
};

type ReactCreateElementLike = (...args: unknown[]) => React.ReactElement | null;
type JSItemDomProtectionOptions = {
  protectAppendChild?: boolean;
};

const wrappedJSItemEventHandlers = new WeakSet<JSItemEventHandler>();
const protectedJSItemElementStates = new WeakMap<EventTarget, JSItemRuntimeErrorState>();
const jsItemRuntimeElementStates = new WeakMap<HTMLElement, JSItemRuntimeErrorState>();

export function normalizeJSItemSourceMode(value: unknown): JSItemSourceMode {
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
}

export function getJSItemRunJsStepParams(model: JSItemRuntimeModel): Record<string, unknown> {
  const params = model.getStepParams('jsSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

export function getJSItemSourceSignature(model: JSItemRuntimeModel, inlineCode?: string): string {
  const jsSettings = model.getStepParams('jsSettings') || {};
  const runJs = getJSItemRunJsStepParams(model);
  const sourceMode = normalizeJSItemSourceMode(runJs.sourceMode);
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

export function getJSItemContextSignature(model: JSItemRuntimeModel): string {
  return stableSerializeWithCircular({
    record: getRecordProperty(model.context, 'record'),
    item: getRecordProperty(model.context, 'item'),
  });
}

export function hasRunnableJSItemSource(model: JSItemRuntimeModel, inlineCode?: string): boolean {
  const runJs = getJSItemRunJsStepParams(model);
  if (normalizeJSItemSourceMode(runJs.sourceMode) === LIGHT_EXTENSION_SOURCE_MODE) {
    return isRecord(runJs.sourceBinding);
  }
  const code = typeof inlineCode === 'string' ? inlineCode : runJs.code;
  return typeof code === 'string' && code.trim().length > 0;
}

export function beginJSItemRuntimeRun(model: JSItemRuntimeModel): number {
  const runId = (jsItemRuntimeRunIds.get(model) || 0) + 1;
  jsItemRuntimeRunIds.set(model, runId);
  return runId;
}

export function isCurrentJSItemRuntimeRun(model: JSItemRuntimeModel, runId: number): boolean {
  return jsItemRuntimeRunIds.get(model) === runId;
}

export function createJSItemSourceModeStep(): StepDefinition {
  return {
    title: '{{t("Code source")}}',
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
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
    defaultParams: getJSItemSourceDefaultParams,
    beforeParamsSave: syncJSItemSourceToRunJs,
    afterParamsSave: refreshJSItemAfterSettingsSave,
  };
}

export function createJSItemSourceBindingStep(): StepDefinition {
  return {
    title: '{{t("Light extension source")}}',
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-display': 'hidden',
      },
      sourceBinding: {
        type: 'object',
        'x-decorator': 'FormItem',
        'x-component': JS_ITEM_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
      },
      settings: {
        type: 'object',
        'x-display': 'hidden',
      },
    },
    defaultParams: getJSItemSourceDefaultParams,
    beforeParamsSave: syncJSItemSourceToRunJs,
    afterParamsSave: refreshJSItemAfterSettingsSave,
  };
}

export function createJSItemRunJsUISchema(options: { scene: string; minHeight?: string } = { scene: 'block' }) {
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

export async function getJSItemRunJsEditorTitle(ctx: { model: JSItemRuntimeModel }): Promise<string> {
  const translate = getModelTranslator(ctx.model);
  const params = getJSItemRunJsStepParams(ctx.model);
  const baseTitle = translate('Write JavaScript');
  if (normalizeJSItemSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE) {
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

export async function getJSItemRuntimeFlowSettingSteps(
  model: JSItemRuntimeModel,
): Promise<Record<string, StepDefinition> | undefined> {
  const params = getJSItemRunJsStepParams(model);
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

export async function resolveJSItemRuntimeRunJS(input: {
  model: JSItemRuntimeModel;
  params: Record<string, unknown>;
  runJs: JSItemRunJSValue;
}): Promise<ResolvedRuntimeRunJS> {
  const { model, params, runJs } = input;
  const runtimeSettings = getJSItemRuntimeSettings(params);
  return resolveRuntimeRunJS({
    runJs,
    sourceMode: params.sourceMode as string | undefined,
    sourceBinding: isRecord(params.sourceBinding) ? (params.sourceBinding as RunJSSourceBinding) : undefined,
    settings: runtimeSettings,
    context: {
      modelUid: model.uid,
      ownerKind: JS_ITEM_OWNER_KIND,
      ownerLocator: buildJSItemOwnerLocator(model),
    },
  });
}

export async function runResolvedJSItemCode(input: {
  ctx: JSItemRuntimeContext;
  resolved: ResolvedRuntimeRunJS;
  params?: Record<string, unknown>;
  element?: HTMLElement;
  runtimeErrorTestId?: string;
}): Promise<void> {
  const { ctx, resolved, params, element, runtimeErrorTestId = 'js-item-runtime-error' } = input;
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
  ctx.defineProperty('item', {
    get: () => getRecordProperty(ctx.model.context, 'item'),
    cache: false,
  });
  ctx.defineProperty('record', {
    get: () => getRecordProperty(ctx.model.context, 'record'),
    cache: false,
  });
  const elementTarget = (ctx.ref?.current as HTMLElement | null) || element;
  const errorState = createJSItemRuntimeErrorState(async (error) => {
    await reportJSItemRuntimeErrorBestEffort({ ctx, error, resolved, params });
  }, elementTarget);
  if (elementTarget) {
    jsItemRuntimeElementStates.set(elementTarget, errorState);
  }
  errorState.capture = (error: unknown) => {
    renderJSItemRuntimeError(elementTarget, error, runtimeErrorTestId);
  };
  ctx.defineMethod?.('wrapRunJSReact', (react: unknown) =>
    isReactNamespace(react) ? wrapJSItemRuntimeReact(react, errorState) : react,
  );
  ctx.defineMethod?.('wrapRunJSVNode', (vnode: unknown) =>
    wrapJSItemRuntimeVNode({
      vnode,
      testId: runtimeErrorTestId,
      errorState,
    }),
  );
  ctx.defineProperty('element', {
    get: () => createProtectedJSItemElementProxy(elementTarget, errorState),
    cache: false,
  });

  const navigator = createSafeNavigator();
  const queryRoot = elementTarget || globalThis.document.createDocumentFragment();
  const document = createJSItemScopedDocument(queryRoot, errorState);
  const window = createJSItemRuntimeSafeWindow(navigator, errorState);
  const result = (await ctx.runjs(
    resolved.code,
    { window, document, navigator },
    { version: resolved.version },
  )) as RunJSExecutionResult;

  if (result?.success === false) {
    throw result.error || new Error('RunJS execution failed');
  }

  if (element && !globalThis.document.body.contains(element) && element.isConnected === false) {
    resetJSItemRuntimeElement(element);
  }
}

export async function runJSItemRuntime(input: {
  ctx: JSItemRuntimeContext;
  params: Record<string, unknown>;
  runJs: JSItemRunJSValue;
  element: HTMLElement;
  runtimeErrorTestId?: string;
}): Promise<void> {
  const { ctx, params, runJs, element, runtimeErrorTestId = 'js-item-runtime-error' } = input;
  const runId = beginJSItemRuntimeRun(ctx.model);
  let resolved: ResolvedRuntimeRunJS | undefined;
  try {
    resetJSItemRuntimeElement(element);
    resolved = await resolveJSItemRuntimeRunJS({
      model: ctx.model,
      params,
      runJs,
    });
    if (!isCurrentJSItemRuntimeRun(ctx.model, runId)) {
      return;
    }
    await runResolvedJSItemCode({
      ctx,
      resolved,
      params,
      element,
      runtimeErrorTestId,
    });
  } catch (error) {
    if (!isCurrentJSItemRuntimeRun(ctx.model, runId)) {
      return;
    }
    renderJSItemRuntimeError(element, error, runtimeErrorTestId);
    await reportJSItemRuntimeErrorBestEffort({ ctx, error, resolved, params });
  }
}

export async function reportJSItemRuntimeErrorBestEffort(input: {
  ctx: JSItemRuntimeContext;
  error: unknown;
  resolved?: ResolvedRuntimeRunJS;
  params?: Record<string, unknown>;
}): Promise<void> {
  const { ctx, error, resolved, params } = input;
  const reporter = getRuntimeErrorReporter(ctx);
  if (!reporter) {
    return;
  }

  const ownerLocator = buildJSItemOwnerLocator(ctx.model);
  const ownerLocatorHash = await hashReferenceOwnerLocatorForRuntime(ownerLocator);
  const fallbackBinding = isRecord(params?.sourceBinding) ? params.sourceBinding : undefined;
  const sourceBinding = resolved?.sourceBinding || fallbackBinding;
  const resolvedPublicationId = getNestedStringProperty(resolved?.context, ['lightExtension', 'publicationId']);
  try {
    await reporter({
      error,
      sourceMode: resolved?.sourceMode || params?.sourceMode,
      sourceBinding,
      sourceMap: resolved?.sourceMap,
      settings: resolved?.settings,
      repoId: getStringProperty(sourceBinding, 'repoId'),
      entryId: getStringProperty(sourceBinding, 'entryId'),
      publicationId: resolvedPublicationId || getStringProperty(sourceBinding, 'publicationId'),
      ownerKind: JS_ITEM_OWNER_KIND,
      ownerLocator,
      ownerLocatorHash,
      path:
        getStringProperty(resolved?.sourceMap, 'entryPath') ||
        getNestedStringProperty(resolved?.context, ['lightExtension', 'entryPath']) ||
        getStringProperty(sourceBinding, 'entryPath'),
    });
  } catch {
    // Runtime rendering must not fail because error reporting is unavailable.
  }
}

export function renderJSItemRuntimeError(element: HTMLElement, error: unknown, testId: string): void {
  resetJSItemRuntimeElement(element);
  element.appendChild(createJSItemRuntimeErrorDom(error, testId));
}

export function resetJSItemRuntimeElement(element: HTMLElement): void {
  disposeJSItemRuntimeElementState(element);
  const globalWithRunJsRoots = globalThis as typeof globalThis & {
    __nbRunjsRoots?: WeakMap<object, RunJSRootEntry>;
  };
  const rootMap = globalWithRunJsRoots.__nbRunjsRoots;
  const existingEntry = rootMap?.get(element);
  if (existingEntry) {
    disposeRunJSRootEntry(existingEntry);
    rootMap?.delete(element);
  }
  if (element.isConnected || element.ownerDocument?.contains(element)) {
    element.innerHTML = '';
  }
}

export function buildJSItemOwnerLocator(model: JSItemRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_ITEM_OWNER_KIND,
    modelUid: model.uid,
    use: getModelUse(model),
  };
}

function getJSItemSourceDefaultParams(ctx: FlowSettingsContext<JSItemRuntimeModel>): JSItemSourceModeParams {
  const runJs = getJSItemRunJsStepParams(ctx.model);
  return {
    sourceMode: normalizeJSItemSourceMode(runJs.sourceMode),
    sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
    settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
  };
}

function syncJSItemSourceToRunJs(ctx: FlowSettingsContext<JSItemRuntimeModel>, params: JSItemSourceModeParams) {
  const sourceMode = normalizeJSItemSourceMode(params?.sourceMode);
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
    ...getJSItemRunJsStepParams(ctx.model),
    sourceMode,
    sourceBinding,
    settings,
  });
}

async function refreshJSItemAfterSettingsSave(ctx: FlowSettingsContext<JSItemRuntimeModel>) {
  ctx.model.invalidateFlowCache('jsSettings', true);
  await ctx.model.rerender();
}

async function getLightExtensionSettingsDescriptor(
  model: JSItemRuntimeModel,
  params: Record<string, unknown>,
): Promise<RunJSSourceSettingsDescriptor | null> {
  if (normalizeJSItemSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE || !isRecord(params.sourceBinding)) {
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
      ownerKind: JS_ITEM_OWNER_KIND,
      ownerLocator: buildJSItemOwnerLocator(model),
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
          'x-component': JS_ITEM_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
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
      beforeParamsSave(ctx: FlowSettingsContext<JSItemRuntimeModel>, params: Record<string, unknown>) {
        const errors = validateSettingValue(fieldSchema, params?.value, required, title);
        if (errors.length === 0) {
          syncLightExtensionSettingToRunJs(ctx, fieldName, params?.value);
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new FlowCancelSaveException('Light extension settings validation failed.');
      },
      afterParamsSave: refreshJSItemAfterSettingsSave,
    },
  ];
}

function syncLightExtensionSettingToRunJs(
  ctx: FlowSettingsContext<JSItemRuntimeModel>,
  fieldName: string,
  value: unknown,
) {
  const runJs = getJSItemRunJsStepParams(ctx.model);
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

function getJSItemRuntimeSettings(params: Record<string, unknown>): RunJSSourceSettings {
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

async function resolveLightExtensionBindingTitle(ctx: { model: JSItemRuntimeModel }, params: Record<string, unknown>) {
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
        ownerKind: JS_ITEM_OWNER_KIND,
        ownerLocator: buildJSItemOwnerLocator(ctx.model),
      },
    });
    return toNonEmptyString(title);
  } catch (error) {
    console.warn('[NocoBase] Failed to resolve RunJS source binding title:', error);
    return undefined;
  }
}

function normalizeSchemaType(schema: JsonSchemaLike): string | undefined {
  const schemaType = schema.type;
  if (Array.isArray(schemaType)) {
    return schemaType.find((item): item is string => typeof item === 'string' && item !== 'null');
  }
  if (typeof schemaType === 'string') {
    return schemaType;
  }
  if (isRecord(schema.properties) || Array.isArray(schema.required)) {
    return 'object';
  }
  if (isRecord(schema.items)) {
    return 'array';
  }
  return undefined;
}

function getSettingsSchemaProperties(schema: unknown): Record<string, JsonSchemaLike> {
  if (!isRecord(schema) || !isRecord(schema.properties)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(schema.properties).filter(([, childSchema]) => isRecord(childSchema)),
  ) as Record<string, JsonSchemaLike>;
}

function getSettingsSchemaRequired(schema: unknown): Set<string> {
  if (!isRecord(schema) || !Array.isArray(schema.required)) {
    return new Set();
  }
  return new Set(schema.required.filter((item): item is string => typeof item === 'string'));
}

function getSchemaTitle(schema: JsonSchemaLike, fallback: string): string {
  return toNonEmptyString(schema.title) || fallback;
}

function getDescriptorSchemaHash(descriptor: RunJSSourceSettingsDescriptor): string {
  return toNonEmptyString(descriptor.schemaHash) || shortHash(stableSerialize(descriptor.schema || null));
}

function validateSettingValue(
  schema: JsonSchemaLike,
  value: unknown,
  required: boolean,
  label: string,
): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];
  const type = normalizeSchemaType(schema);

  if (required && value === undefined) {
    errors.push({ label, message: 'Required' });
    return errors;
  }

  if (value === undefined) {
    return errors;
  }

  if (type === 'string' && typeof value !== 'string') {
    errors.push({ label, message: 'Must be a string' });
  }
  if ((type === 'number' || type === 'integer') && typeof value !== 'number') {
    errors.push({ label, message: 'Must be a number' });
  }
  if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
    errors.push({ label, message: 'Must be an integer' });
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    errors.push({ label, message: 'Must be a boolean' });
  }
  if (type === 'array' && !Array.isArray(value)) {
    errors.push({ label, message: 'Must be an array' });
  }
  if (type === 'object' && !isRecord(value)) {
    errors.push({ label, message: 'Must be an object' });
  }
  if (type === 'object' && isRecord(value)) {
    errors.push(...validateObjectSettingValue(schema, value, label));
  }

  const enumValues = Array.isArray(schema.enum) ? schema.enum : null;
  if (enumValues && !enumValues.some((item) => stableSerialize(item) === stableSerialize(value))) {
    errors.push({ label, message: 'Must be one of the allowed values' });
  }

  if (typeof value === 'string') {
    const minLength = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLength = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    if (typeof minLength === 'number' && value.length < minLength) {
      errors.push({ label, message: 'Too short' });
    }
    if (typeof maxLength === 'number' && value.length > maxLength) {
      errors.push({ label, message: 'Too long' });
    }
    if (!isValidSettingStringFormat(toNonEmptyString(schema.format), value)) {
      errors.push({ label, message: 'Must match the required format' });
    }
  }

  if (typeof value === 'number') {
    const minimum = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const maximum = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    if (typeof minimum === 'number' && value < minimum) {
      errors.push({ label, message: 'Too small' });
    }
    if (typeof maximum === 'number' && value > maximum) {
      errors.push({ label, message: 'Too large' });
    }
  }

  if (Array.isArray(value) && isRecord(schema.items)) {
    value.forEach((item, index) => {
      const itemLabel = `${label}[${index}]`;
      if (normalizeSchemaType(schema.items as JsonSchemaLike) === 'object') {
        if (!isRecord(item)) {
          errors.push({ label: itemLabel, message: 'Must be an object' });
          return;
        }
        errors.push(...validateObjectSettingValue(schema.items as JsonSchemaLike, item, itemLabel));
        return;
      }
      errors.push(...validateSettingValue(schema.items as JsonSchemaLike, item, false, itemLabel));
    });
  }

  return errors;
}

function validateObjectSettingValue(
  schema: JsonSchemaLike,
  value: Record<string, unknown>,
  labelPrefix: string,
): SettingsValidationError[] {
  const properties = getSettingsSchemaProperties(schema);
  const requiredFields = getSettingsSchemaRequired(schema);
  return Object.entries(properties).flatMap(([childName, childSchema]) => {
    const childLabel = getSchemaTitle(childSchema, `${labelPrefix}.${childName}`);
    const childValue = Object.prototype.hasOwnProperty.call(value, childName) ? value[childName] : undefined;
    return validateSettingValue(childSchema, childValue, requiredFields.has(childName), childLabel);
  });
}

function isValidSettingStringFormat(format: string | undefined, value: string): boolean {
  if (!format) {
    return true;
  }
  if (format === 'date') {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
  }
  if (format === 'date-time') {
    return !Number.isNaN(Date.parse(value));
  }
  if (format === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  if (format === 'time') {
    return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(value);
  }
  if (format === 'uri' || format === 'url') {
    try {
      const url = new URL(value);
      return Boolean(url.protocol && url.hostname);
    } catch {
      return false;
    }
  }
  return true;
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

function normalizeRuntimeError(error: unknown): JSItemRuntimeError {
  const source = getRuntimeErrorSource(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const status = source.status;

  let title = 'JavaScript item runtime error';
  let hint = 'Check the JavaScript item configuration and retry.';
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'Light extension access denied';
    hint = 'Ask an administrator for permission to use this light extension publication.';
  } else if (status === 404 || normalizedCode.includes('publication_not_found') || normalizedCode.includes('missing')) {
    title = 'Light extension publication missing';
    hint = 'Choose an available publication or publish this entry again.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'Light extension binding is outdated';
    hint = 'Refresh the item settings and choose the current active publication.';
  } else if (normalizedCode.includes('settings_invalid')) {
    title = 'Light extension settings are invalid';
    hint = 'Open the item settings and fix the light extension settings.';
  } else if (normalizedCode.includes('repo_archived') || normalizedCode.includes('repository_archived')) {
    title = 'Light extension repository is archived';
    hint = 'Restore the repository or choose a publication from another repository.';
  }

  return {
    title,
    hint,
    message: source.message || 'Failed to run JavaScript item',
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
  };
}

function getRuntimeErrorReporter(ctx: JSItemRuntimeContext): ((payload: Record<string, unknown>) => unknown) | null {
  const directReporter = getCallableProperty(ctx, 'reportRuntimeError');
  if (directReporter) {
    return directReporter;
  }
  const modelContext = getRecordProperty(ctx.model, 'context');
  return getCallableProperty(modelContext, 'reportRuntimeError');
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

async function hashReferenceOwnerLocatorForRuntime(ownerLocator: Record<string, unknown>): Promise<string> {
  const serialized = stableSerialize(ownerLocator);
  const subtle = globalThis.crypto?.subtle;
  if (!subtle || typeof TextEncoder === 'undefined') {
    return `local:${shortHash(serialized)}`;
  }
  const bytes = new TextEncoder().encode(serialized);
  const digest = await subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}`;
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

function getModelUse(model: JSItemRuntimeModel): string | undefined {
  return (
    toNonEmptyString(getRecordProperty(model, 'use')) ||
    toNonEmptyString(getRecordProperty(getRecordProperty(model, '_options'), 'use')) ||
    toNonEmptyString(getRecordProperty(getRecordProperty(model, 'options'), 'use')) ||
    toNonEmptyString(getRecordProperty(getRecordProperty(model, 'createModelOptions'), 'use')) ||
    toNonEmptyString(model.constructor?.name)
  );
}

function getModelTranslator(model: JSItemRuntimeModel): (text: string) => string {
  const t = model.context?.t;
  return typeof t === 'function' ? t.bind(model.context) : (text: string) => text;
}

function getStringProperty(value: unknown, key: string): string | undefined {
  return toNonEmptyString(getRecordProperty(value, key));
}

function getNestedStringProperty(value: unknown, path: string[]): string | undefined {
  let current = value;
  for (const key of path) {
    current = getRecordProperty(current, key);
  }
  return toNonEmptyString(current);
}

function getRecordProperty(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

function getCallableProperty(value: unknown, key: string): ((payload: Record<string, unknown>) => unknown) | null {
  const property = getRecordProperty(value, key);
  return typeof property === 'function' ? (property as (payload: Record<string, unknown>) => unknown) : null;
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

function createJSItemRuntimeErrorDom(error: unknown, testId: string): HTMLElement {
  const normalized = normalizeRuntimeError(error);
  const errorElement = document.createElement('span');
  errorElement.setAttribute('role', 'alert');
  errorElement.setAttribute('data-testid', testId);
  errorElement.style.color = '#ff4d4f';
  errorElement.style.display = 'inline-block';
  errorElement.style.maxWidth = '100%';
  errorElement.style.whiteSpace = 'normal';
  errorElement.textContent = [normalized.title, normalized.message, normalized.code].filter(Boolean).join(' | ');
  return errorElement;
}

function createJSItemRuntimeErrorNode(error: unknown, testId: string): React.ReactElement {
  const normalized = normalizeRuntimeError(error);
  return React.createElement(
    'span',
    {
      role: 'alert',
      'data-testid': testId,
      style: {
        color: '#ff4d4f',
        display: 'inline-block',
        maxWidth: '100%',
        whiteSpace: 'normal',
      },
    },
    [normalized.title, normalized.message, normalized.code].filter(Boolean).join(' | '),
  );
}

function wrapJSItemRuntimeVNode(input: {
  vnode: unknown;
  testId: string;
  errorState: JSItemRuntimeErrorState;
}): unknown {
  const { vnode, testId, errorState } = input;
  if (!React.isValidElement(vnode)) {
    return vnode;
  }

  const boundaryRef = React.createRef<JSItemRuntimeBoundaryHandle>();
  errorState.capture = (error: unknown) => {
    boundaryRef.current?.capture(error);
  };
  const wrappedVNode = wrapJSItemEventHandlers(vnode, errorState);

  class JSItemRuntimeBoundary extends React.Component<{ children: React.ReactNode }, { error?: unknown }> {
    state: { error?: unknown } = {};

    static getDerivedStateFromError(error: unknown) {
      return { error };
    }

    capture(error: unknown) {
      this.setState({ error });
    }

    componentDidCatch(error: unknown) {
      errorState.handleError(error);
    }

    render() {
      if (this.state.error) {
        return createJSItemRuntimeErrorNode(this.state.error, testId);
      }
      return this.props.children;
    }
  }

  return React.createElement(JSItemRuntimeBoundary, { ref: boundaryRef }, wrappedVNode);
}

function createJSItemRuntimeErrorState(
  onError: (error: unknown) => void | Promise<void>,
  scopeRoot?: Node | DocumentFragment | null,
): JSItemRuntimeErrorState {
  const errorState: JSItemRuntimeErrorState = {
    cleanups: new Set<() => void>(),
    disposed: false,
    reactEventHandlers: new WeakMap<JSItemEventHandler, JSItemEventHandler>(),
    domEventHandlers: new WeakMap<EventListenerOrEventListenerObject, EventListenerOrEventListenerObject>(),
    eventArgs: new WeakMap<object, unknown>(),
    scopeRoot,
    handleError(error: unknown) {
      errorState.capture?.(error);
      reportJSItemVNodeRuntimeError(onError, error);
    },
  };
  return errorState;
}

function disposeJSItemRuntimeElementState(element: HTMLElement): void {
  const state = jsItemRuntimeElementStates.get(element);
  if (!state) {
    return;
  }
  jsItemRuntimeElementStates.delete(element);
  disposeJSItemRuntimeErrorState(state);
}

function disposeJSItemRuntimeErrorState(state: JSItemRuntimeErrorState): void {
  if (state.disposed) {
    return;
  }
  state.disposed = true;
  for (const cleanup of Array.from(state.cleanups).reverse()) {
    try {
      cleanup();
    } catch {
      // Ignore cleanup failures; stale JS Item effects must not break host rendering.
    }
  }
  state.cleanups.clear();
}

function registerJSItemRuntimeCleanup(state: JSItemRuntimeErrorState, cleanup: () => void): () => void {
  let active = true;
  const wrapped = () => {
    if (!active) {
      return;
    }
    active = false;
    state.cleanups.delete(wrapped);
    cleanup();
  };
  state.cleanups.add(wrapped);
  return wrapped;
}

function reportJSItemVNodeRuntimeError(onError: (error: unknown) => void | Promise<void>, error: unknown): void {
  const result = onError(error);
  if (isPromiseLike(result)) {
    result.catch(() => {
      // Runtime rendering must not fail because error reporting is unavailable.
    });
  }
}

function createProtectedJSItemElementProxy(element: HTMLElement, errorState: JSItemRuntimeErrorState): ElementProxy {
  const elementProxy = new ElementProxy(element);
  return new Proxy(elementProxy, {
    get(target, prop, receiver) {
      if (prop === 'addEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: AddEventListenerOptions | boolean,
        ) => {
          const wrapped = wrapJSItemDomEventListener(listener, errorState);
          element.addEventListener(type, wrapped, options);
          if (wrapped) {
            registerJSItemRuntimeCleanup(errorState, () => element.removeEventListener(type, wrapped, options));
          }
        };
      }
      if (prop === 'removeEventListener') {
        return (
          type: string,
          listener: EventListenerOrEventListenerObject | null,
          options?: EventListenerOptions | boolean,
        ) => {
          const wrapped = listener ? errorState.domEventHandlers.get(listener) : undefined;
          element.removeEventListener(type, wrapped || listener, options);
        };
      }
      if (prop === 'appendChild') {
        return (child: Node | string) => {
          const nextChild =
            typeof child === 'string'
              ? globalThis.document.createTextNode(child)
              : child instanceof EventTarget
                ? protectJSItemDomEventTarget(child, errorState)
                : child;
          return element.appendChild(nextChild as Node);
        };
      }
      if (prop === '__el') {
        return element;
      }
      if (prop === 'ownerDocument') {
        return createJSItemScopedDocument(element, errorState);
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: unknown[]) => protectJSItemDomValue(value(...args), element, errorState);
      }
      return protectJSItemDomValue(value, element, errorState);
    },
  });
}

function protectJSItemDomEventTarget<T extends EventTarget>(
  target: T,
  errorState: JSItemRuntimeErrorState,
  options: JSItemDomProtectionOptions = {},
): T {
  const { protectAppendChild = true } = options;
  protectedJSItemElementStates.set(target, errorState);
  if (targetHasOwnJSItemProtection(target)) {
    return target;
  }

  const originalAddEventListener = target.addEventListener.bind(target);
  const originalRemoveEventListener = target.removeEventListener.bind(target);
  Object.defineProperty(target, 'addEventListener', {
    configurable: true,
    value(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      const wrapped = wrapJSItemDomEventListener(listener, currentState);
      originalAddEventListener(type, wrapped, options);
      if (wrapped) {
        registerJSItemRuntimeCleanup(currentState, () => originalRemoveEventListener(type, wrapped, options));
      }
    },
  });
  Object.defineProperty(target, 'removeEventListener', {
    configurable: true,
    value(type: string, listener: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      const wrapped = listener ? currentState.domEventHandlers.get(listener) : undefined;
      originalRemoveEventListener(type, wrapped || listener, options);
    },
  });

  if (protectAppendChild && isNodeWithAppendChild(target)) {
    const originalAppendChild = target.appendChild.bind(target);
    Object.defineProperty(target, 'appendChild', {
      configurable: true,
      value(child: Node | string) {
        const currentState = protectedJSItemElementStates.get(target) || errorState;
        const nextChild =
          typeof child === 'string'
            ? globalThis.document.createTextNode(child)
            : child instanceof EventTarget
              ? protectJSItemDomEventTarget(child, currentState)
              : child;
        return originalAppendChild(nextChild as Node);
      },
    });
  }

  protectJSItemDomQuerySurface(target, errorState);
  if (target !== errorState.scopeRoot) {
    defineProtectedJSItemOwnerDocumentGetter(target, errorState);
  }
  defineProtectedJSItemDomGetter(target, 'parentNode', errorState);
  defineProtectedJSItemDomGetter(target, 'parentElement', errorState);
  defineProtectedJSItemDomGetter(target, 'offsetParent', errorState);

  Object.defineProperty(target, '__nbJSItemRuntimeProtected', {
    configurable: true,
    value: true,
  });
  return target;
}

function protectJSItemDomQuerySurface(target: EventTarget, errorState: JSItemRuntimeErrorState): void {
  if (!isJSItemQueryableNode(target)) {
    return;
  }

  const originalQuerySelector = target.querySelector.bind(target);
  Object.defineProperty(target, 'querySelector', {
    configurable: true,
    value(selectors: string) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomValue(originalQuerySelector(selectors), target, currentState);
    },
  });

  const originalQuerySelectorAll = target.querySelectorAll.bind(target);
  Object.defineProperty(target, 'querySelectorAll', {
    configurable: true,
    value(selectors: string) {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomCollection(originalQuerySelectorAll(selectors), target, currentState);
    },
  });
  if (typeof (target as { closest?: unknown }).closest === 'function') {
    const originalClosest = (target as Element).closest.bind(target as Element);
    Object.defineProperty(target, 'closest', {
      configurable: true,
      value(selectors: string) {
        const currentState = protectedJSItemElementStates.get(target) || errorState;
        return protectJSItemDomValue(originalClosest(selectors), currentState.scopeRoot, currentState);
      },
    });
  }

  defineProtectedJSItemDomGetter(target, 'children', errorState);
  defineProtectedJSItemDomGetter(target, 'childNodes', errorState);
  defineProtectedJSItemDomGetter(target, 'firstChild', errorState);
  defineProtectedJSItemDomGetter(target, 'firstElementChild', errorState);
  defineProtectedJSItemDomGetter(target, 'lastChild', errorState);
  defineProtectedJSItemDomGetter(target, 'lastElementChild', errorState);
}

function createJSItemScopedDocument(
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): Document {
  const queryRoot = root || errorState.scopeRoot || globalThis.document.createDocumentFragment();
  return createSafeDocument({
    defaultView: createJSItemRuntimeSafeWindow(createSafeNavigator(), errorState),
    createElement: (tagName: string, options?: ElementCreationOptions) =>
      protectJSItemDomEventTarget(globalThis.document.createElement(tagName, options), errorState),
    querySelector: (selectors: string) =>
      protectJSItemDomValue(queryRoot.querySelector(selectors), queryRoot, errorState),
    querySelectorAll: (selectors: string) =>
      protectJSItemDomCollection(queryRoot.querySelectorAll(selectors), queryRoot, errorState),
  }) as Document;
}

function defineProtectedJSItemOwnerDocumentGetter(target: EventTarget, errorState: JSItemRuntimeErrorState): void {
  const descriptor = findPropertyDescriptor(target, 'ownerDocument');
  if (!descriptor?.get) {
    return;
  }

  Object.defineProperty(target, 'ownerDocument', {
    configurable: true,
    get() {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return createJSItemScopedDocument(currentState.scopeRoot, currentState);
    },
  });
}

function createJSItemRuntimeSafeWindow(
  navigator: Navigator,
  errorState: JSItemRuntimeErrorState,
  extra?: Record<string, unknown>,
): ReturnType<typeof createSafeWindow> {
  const timeoutCleanups = new Map<unknown, () => void>();
  const intervalCleanups = new Map<unknown, () => void>();
  return createSafeWindow({
    navigator,
    ...createJSItemSafeWindowDomTypes(),
    ...(extra || {}),
    setTimeout(handler: TimerHandler, timeout?: number, ...args: unknown[]) {
      const wrappedHandler =
        typeof handler === 'function'
          ? (...callbackArgs: unknown[]) => {
              timeoutCleanups.delete(timerId);
              try {
                return handler(...callbackArgs);
              } catch (error) {
                errorState.handleError(error);
                return undefined;
              }
            }
          : handler;
      const timerId = globalThis.setTimeout(wrappedHandler as TimerHandler, timeout, ...args);
      const cleanup = registerJSItemRuntimeCleanup(errorState, () => {
        timeoutCleanups.delete(timerId);
        globalThis.clearTimeout(timerId);
      });
      timeoutCleanups.set(timerId, cleanup);
      return timerId;
    },
    clearTimeout(timerId: ReturnType<typeof globalThis.setTimeout>) {
      const cleanup = timeoutCleanups.get(timerId);
      if (cleanup) {
        cleanup();
        return;
      }
      globalThis.clearTimeout(timerId);
    },
    setInterval(handler: TimerHandler, timeout?: number, ...args: unknown[]) {
      const intervalId = globalThis.setInterval(
        typeof handler === 'function'
          ? (...callbackArgs: unknown[]) => {
              try {
                return handler(...callbackArgs);
              } catch (error) {
                errorState.handleError(error);
                return undefined;
              }
            }
          : handler,
        timeout,
        ...args,
      );
      const cleanup = registerJSItemRuntimeCleanup(errorState, () => {
        intervalCleanups.delete(intervalId);
        globalThis.clearInterval(intervalId);
      });
      intervalCleanups.set(intervalId, cleanup);
      return intervalId;
    },
    clearInterval(intervalId: ReturnType<typeof globalThis.setInterval>) {
      const cleanup = intervalCleanups.get(intervalId);
      if (cleanup) {
        cleanup();
        return;
      }
      globalThis.clearInterval(intervalId);
    },
    addEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: AddEventListenerOptions | boolean,
    ) {
      const wrapped = wrapJSItemDomEventListener(listener, errorState);
      globalThis.addEventListener(type, wrapped, options);
      if (wrapped) {
        registerJSItemRuntimeCleanup(errorState, () => globalThis.removeEventListener(type, wrapped, options));
      }
    },
    removeEventListener(
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: EventListenerOptions | boolean,
    ) {
      const wrapped = listener ? errorState.domEventHandlers.get(listener) : undefined;
      globalThis.removeEventListener(type, wrapped || listener, options);
    },
  });
}

function createJSItemSafeWindowDomTypes(): Record<string, unknown> {
  return {
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    Element: globalThis.Element,
    HTMLElement: globalThis.HTMLElement,
    KeyboardEvent: globalThis.KeyboardEvent,
    MouseEvent: globalThis.MouseEvent,
    Node: globalThis.Node,
    SVGElement: globalThis.SVGElement,
  };
}

function defineProtectedJSItemDomGetter(target: EventTarget, prop: string, errorState: JSItemRuntimeErrorState): void {
  const descriptor = findPropertyDescriptor(target, prop);
  if (!descriptor?.get) {
    return;
  }

  Object.defineProperty(target, prop, {
    configurable: true,
    get() {
      const currentState = protectedJSItemElementStates.get(target) || errorState;
      return protectJSItemDomValue(
        descriptor.get?.call(target),
        currentState.scopeRoot || (target as Node),
        currentState,
      );
    },
  });
}

function findPropertyDescriptor(target: EventTarget, prop: string): PropertyDescriptor | undefined {
  let current: object | null = target;
  while (current) {
    const descriptor = Object.getOwnPropertyDescriptor(current, prop);
    if (descriptor) {
      return descriptor;
    }
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function protectJSItemDomValue(
  value: unknown,
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): unknown {
  if (isJSItemDomCollection(value)) {
    return protectJSItemDomCollection(value, root, errorState);
  }
  if (!isNodeInsideJSItemRoot(value, root)) {
    return value instanceof Node ? null : value;
  }
  return value instanceof EventTarget ? protectJSItemDomEventTarget(value, errorState) : value;
}

function protectJSItemDomCollection<T extends ArrayLike<unknown>>(
  collection: T,
  root: Node | DocumentFragment | null | undefined,
  errorState: JSItemRuntimeErrorState,
): T {
  const protectItem = (item: unknown) => protectJSItemDomValue(item, root, errorState);
  const protectedCollection = new Proxy(collection as object, {
    get(target, prop) {
      if (prop === Symbol.iterator || prop === 'values') {
        return function* () {
          for (const item of Array.from(collection)) {
            yield protectItem(item);
          }
        };
      }
      if (prop === 'entries') {
        return function* () {
          let index = 0;
          for (const item of Array.from(collection)) {
            yield [index, protectItem(item)];
            index += 1;
          }
        };
      }
      if (prop === 'keys') {
        return function* () {
          for (let index = 0; index < collection.length; index += 1) {
            yield index;
          }
        };
      }
      if (typeof prop === 'string' && isJSItemArrayIndex(prop)) {
        return protectItem((target as Record<string, unknown>)[prop]);
      }

      const value = Reflect.get(target, prop);
      if (typeof value !== 'function') {
        return value;
      }
      if (prop === 'item' || prop === 'namedItem') {
        return (...args: unknown[]) => protectItem(value.apply(target, args));
      }
      if (prop === 'at') {
        return (...args: unknown[]) => protectItem(value.apply(target, args));
      }
      if (prop === 'forEach') {
        return (callback: (item: unknown, index: number, collection: T) => void, thisArg?: unknown) => {
          Array.from(collection).forEach((item, index) => {
            callback.call(thisArg, protectItem(item), index, protectedCollection);
          });
        };
      }
      return (...args: unknown[]) => protectJSItemDomValue(value.apply(target, args), root, errorState);
    },
  }) as T;
  return protectedCollection;
}

function isJSItemArrayIndex(prop: string): boolean {
  if (!/^(0|[1-9]\d*)$/.test(prop)) {
    return false;
  }
  const index = Number(prop);
  return Number.isSafeInteger(index);
}

function wrapJSItemRuntimeReact(react: typeof React, errorState: JSItemRuntimeErrorState): typeof React {
  const createElement: ReactCreateElementLike = (...args: unknown[]) => {
    const [type, props, ...children] = args;
    return react.createElement(
      type as React.ElementType,
      wrapJSItemRuntimeReactProps(props, errorState) as Record<string, unknown> | null,
      ...(children as React.ReactNode[]),
    );
  };

  return new Proxy(react, {
    get(target, prop, receiver) {
      if (prop === 'createElement') {
        return createElement;
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

function wrapJSItemRuntimeReactProps(props: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (!isRecord(props)) {
    return props;
  }

  let changed = false;
  const nextProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (isReactEventHandlerName(key) && typeof value === 'function') {
      nextProps[key] = wrapJSItemEventHandler(value as JSItemEventHandler, errorState, errorState.reactEventHandlers);
      changed = true;
      continue;
    }
    nextProps[key] = value;
  }

  return changed ? nextProps : props;
}

function wrapJSItemDomEventListener(
  listener: EventListenerOrEventListenerObject | null,
  errorState: JSItemRuntimeErrorState,
): EventListenerOrEventListenerObject | null {
  if (!listener) {
    return listener;
  }
  const cached = errorState.domEventHandlers.get(listener);
  if (cached) {
    return cached;
  }

  const wrapped =
    typeof listener === 'function'
      ? function (this: EventTarget, event: Event) {
          try {
            return listener.call(
              protectJSItemDomValue(this, errorState.scopeRoot, errorState) as EventTarget,
              protectJSItemRuntimeEventArg(event, errorState) as Event,
            );
          } catch (error) {
            errorState.handleError(error);
            return undefined;
          }
        }
      : {
          handleEvent(event: Event) {
            try {
              return listener.handleEvent(protectJSItemRuntimeEventArg(event, errorState) as Event);
            } catch (error) {
              errorState.handleError(error);
              return undefined;
            }
          },
        };
  errorState.domEventHandlers.set(listener, wrapped);
  return wrapped;
}

function protectJSItemRuntimeEventArg(value: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (!isRecord(value)) {
    return value;
  }
  if (!isJSItemEventLike(value)) {
    return value;
  }

  const cached = errorState.eventArgs.get(value);
  if (cached) {
    return cached;
  }

  const protectedEvent = new Proxy(value, {
    get(target, prop, receiver) {
      if (prop === 'target' || prop === 'currentTarget' || prop === 'srcElement') {
        return protectJSItemDomValue(Reflect.get(target, prop, receiver), errorState.scopeRoot, errorState);
      }
      if (prop === 'nativeEvent') {
        return protectJSItemRuntimeEventValue(Reflect.get(target, prop, receiver), errorState);
      }
      const property = Reflect.get(target, prop, receiver);
      if (typeof property === 'function') {
        return (...args: unknown[]) => protectJSItemRuntimeEventValue(property.apply(target, args), errorState);
      }
      return protectJSItemRuntimeEventValue(property, errorState);
    },
  });
  errorState.eventArgs.set(value, protectedEvent);
  return protectedEvent;
}

function protectJSItemRuntimeEventValue(value: unknown, errorState: JSItemRuntimeErrorState): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => protectJSItemRuntimeEventValue(item, errorState));
  }
  if (isJSItemWindowLike(value)) {
    return createJSItemRuntimeSafeWindow(createSafeNavigator(), errorState, {
      document: createJSItemScopedDocument(errorState.scopeRoot, errorState),
    });
  }
  if (value instanceof Document) {
    return createJSItemScopedDocument(errorState.scopeRoot, errorState);
  }
  if (value instanceof Event) {
    return protectJSItemRuntimeEventArg(value, errorState);
  }
  if (value instanceof Node || isJSItemDomCollection(value)) {
    return protectJSItemDomValue(value, errorState.scopeRoot, errorState);
  }
  return value;
}

function targetHasOwnJSItemProtection(target: EventTarget): boolean {
  return Boolean((target as { __nbJSItemRuntimeProtected?: boolean }).__nbJSItemRuntimeProtected);
}

function isNodeWithAppendChild(target: EventTarget): target is EventTarget & { appendChild: (child: Node) => Node } {
  return typeof (target as { appendChild?: unknown }).appendChild === 'function';
}

function isJSItemQueryableNode(
  target: EventTarget,
): target is EventTarget & ParentNode & { querySelector: ParentNode['querySelector'] } {
  return (
    typeof (target as { querySelector?: unknown }).querySelector === 'function' &&
    typeof (target as { querySelectorAll?: unknown }).querySelectorAll === 'function'
  );
}

function isJSItemDomCollection(value: unknown): value is ArrayLike<unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    typeof (value as { length?: unknown }).length === 'number' &&
    (Object.prototype.toString.call(value) === '[object NodeList]' ||
      Object.prototype.toString.call(value) === '[object HTMLCollection]')
  );
}

function isJSItemWindowLike(value: unknown): value is Window {
  return (
    Boolean(value) && typeof value === 'object' && (value === globalThis.window || (value as Window).window === value)
  );
}

function isNodeInsideJSItemRoot(value: unknown, root: Node | DocumentFragment | null | undefined): value is Node {
  if (!(value instanceof Node) || !root) {
    return false;
  }
  if (value === root) {
    return true;
  }
  return typeof root.contains === 'function' ? root.contains(value) : false;
}

function wrapJSItemEventHandlers(element: React.ReactElement, errorState: JSItemRuntimeErrorState): React.ReactElement {
  const props = element.props as Record<string, unknown>;
  let changed = false;
  const nextProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (isReactEventHandlerName(key) && typeof value === 'function') {
      nextProps[key] = wrapJSItemEventHandler(value as JSItemEventHandler, errorState);
      changed = true;
      continue;
    }
    nextProps[key] = value;
  }

  const children = props.children;
  const nextChildren = React.Children.map(children as React.ReactNode, (child) => {
    if (React.isValidElement(child)) {
      changed = true;
      return wrapJSItemEventHandlers(child, errorState);
    }
    return child;
  });

  if (!changed) {
    return element;
  }

  return React.cloneElement(element, nextProps, nextChildren);
}

function wrapJSItemEventHandler(
  handler: JSItemEventHandler,
  errorState: JSItemRuntimeErrorState,
  cache?: WeakMap<JSItemEventHandler, JSItemEventHandler>,
): JSItemEventHandler {
  if (wrappedJSItemEventHandlers.has(handler)) {
    return handler;
  }
  const cached = cache?.get(handler);
  if (cached) {
    return cached;
  }
  const wrappedHandler: JSItemEventHandler = (...args: unknown[]) => {
    try {
      const result = handler(...args.map((arg) => protectJSItemRuntimeEventArg(arg, errorState)));
      if (isPromiseLike(result)) {
        return result.catch((error) => {
          errorState.handleError(error);
          return undefined;
        });
      }
      return result;
    } catch (error) {
      errorState.handleError(error);
      return undefined;
    }
  };
  wrappedJSItemEventHandlers.add(wrappedHandler);
  cache?.set(handler, wrappedHandler);
  return wrappedHandler;
}

function isReactEventHandlerName(key: string): boolean {
  return /^on[A-Z]/.test(key);
}

function isReactNamespace(value: unknown): value is typeof React {
  return isRecord(value) && typeof value.createElement === 'function';
}

function isJSItemEventLike(value: Record<string, unknown>): boolean {
  return value instanceof Event || 'target' in value || 'currentTarget' in value || 'nativeEvent' in value;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.then === 'function' && typeof value.catch === 'function';
}
