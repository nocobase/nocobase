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
  createSafeDocument,
  createSafeNavigator,
  createSafeWindow,
  type FlowModel,
  type FlowRuntimeContext,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';

import {
  resolveRuntimeRunJS,
  createRunJSSourceCascadeMenuUIMode,
  RunJSSourceResolverRegistry,
  type ResolvedRuntimeRunJS,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../components/runjs-source';
import { RunJSEditorField } from '../../components/runjs-studio';
import {
  JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
  JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
} from './JSActionSourceModeField';

export const INLINE_SOURCE_MODE = 'inline';
export const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';
export const JS_ACTION_OWNER_KIND = 'flowModel.actionSettings';

export type JSActionSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;

type JSActionRunJSValue = {
  code?: string;
  version?: string;
};

type JSActionSourceModeParams = {
  sourceMode?: string;
  sourceBinding?: unknown;
  settings?: unknown;
};

type JsonSchemaLike = Record<string, unknown>;

type SettingsValidationError = {
  label: string;
  message: string;
};

type JSActionRuntimeError = {
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

type JSActionRuntimeModel = FlowModel & {
  uid: string;
  use?: string;
};

type JSActionRuntimeContext = FlowRuntimeContext<JSActionRuntimeModel> & {
  defineProperty: (key: string, options: Record<string, unknown>) => void;
  runjs: (code: string, globals: Record<string, unknown>, options: { version: string }) => Promise<unknown>;
};

const jsActionRuntimeRunIds = new WeakMap<object, number>();

export function normalizeJSActionSourceMode(value: unknown): JSActionSourceMode {
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
}

export function getJSActionRunJsStepParams(model: JSActionRuntimeModel): Record<string, unknown> {
  const params = model.getStepParams('clickSettings', 'runJs');
  return isRecord(params) ? { ...params } : {};
}

export function beginJSActionRuntimeRun(model: JSActionRuntimeModel): number {
  const runId = (jsActionRuntimeRunIds.get(model) || 0) + 1;
  jsActionRuntimeRunIds.set(model, runId);
  return runId;
}

export function isCurrentJSActionRuntimeRun(model: JSActionRuntimeModel, runId: number): boolean {
  return jsActionRuntimeRunIds.get(model) === runId;
}

export function createJSActionSourceModeStep(): StepDefinition {
  return {
    title: '{{t("Code source")}}',
    uiMode: createRunJSSourceCascadeMenuUIMode({
      kind: 'js-action',
      defaultVersionPolicy: 'follow-active',
    }),
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
        'x-component-props': {
          kind: 'js-action',
          defaultVersionPolicy: 'follow-active',
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
    defaultParams: getJSActionSourceDefaultParams,
    beforeParamsSave: syncJSActionSourceToRunJs,
    afterParamsSave: refreshJSActionAfterSettingsSave,
  };
}

export function createJSActionSourceBindingStep(): StepDefinition {
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
        'x-component': JS_ACTION_LIGHT_EXTENSION_FULL_SOURCE_FIELD,
        'x-component-props': {
          kind: 'js-action',
          defaultVersionPolicy: 'follow-active',
        },
      },
      settings: {
        type: 'object',
        'x-display': 'hidden',
      },
    },
    defaultParams: getJSActionSourceDefaultParams,
    beforeParamsSave: syncJSActionSourceToRunJs,
    afterParamsSave: refreshJSActionAfterSettingsSave,
  };
}

export function createJSActionRunJsUISchema(options: { minHeight?: string } = {}) {
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
      'x-component': RunJSEditorField,
      'x-component-props': {
        locatorFactory: 'flowModel.step',
        surfaceStyle: 'action',
        scene: 'eventFlow',
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
  let resolved: ResolvedRuntimeRunJS | undefined;

  ctx.model.setProps('loading', true);
  try {
    resolved = await resolveJSActionRuntimeRunJS({
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
    await reportJSActionRuntimeErrorBestEffort({ ctx, error, resolved, params });
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

  const navigator = createSafeNavigator();
  const result = (await ctx.runjs(
    resolved.code,
    { window: createSafeWindow({ navigator }), document: createSafeDocument(), navigator },
    { version: resolved.version },
  )) as RunJSExecutionResult;

  if (result?.success === false) {
    throw result.error || new Error('RunJS execution failed');
  }
}

export async function reportJSActionRuntimeErrorBestEffort(input: {
  ctx: JSActionRuntimeContext;
  error: unknown;
  resolved?: ResolvedRuntimeRunJS;
  params?: Record<string, unknown>;
}): Promise<void> {
  const { ctx, error, resolved, params } = input;
  const reporter = getRuntimeErrorReporter(ctx);
  if (!reporter) {
    return;
  }

  const ownerLocator = buildJSActionOwnerLocator(ctx.model);
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
      ownerKind: JS_ACTION_OWNER_KIND,
      ownerLocator,
      ownerLocatorHash,
      path:
        getStringProperty(resolved?.sourceMap, 'entryPath') ||
        getNestedStringProperty(resolved?.context, ['lightExtension', 'entryPath']) ||
        getStringProperty(sourceBinding, 'entryPath'),
    });
  } catch {
    // Action execution must not fail because runtime error reporting is unavailable.
  }
}

export function buildJSActionOwnerLocator(model: JSActionRuntimeModel): Record<string, unknown> {
  return {
    kind: JS_ACTION_OWNER_KIND,
    modelUid: model.uid,
    use: getModelUse(model),
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
    sourceBinding,
    settings,
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

async function getLightExtensionSettingsDescriptor(
  model: JSActionRuntimeModel,
  params: Record<string, unknown>,
): Promise<RunJSSourceSettingsDescriptor | null> {
  if (
    normalizeJSActionSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE ||
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
      ownerKind: JS_ACTION_OWNER_KIND,
      ownerLocator: buildJSActionOwnerLocator(model),
    },
  });

  if (!descriptor || !isRecord(descriptor)) {
    return null;
  }

  return descriptor;
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
          'x-component': JS_ACTION_LIGHT_EXTENSION_SETTINGS_STEP_FIELD,
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
      beforeParamsSave(ctx: FlowSettingsContext<JSActionRuntimeModel>, params: Record<string, unknown>) {
        const errors = validateSettingValue(fieldSchema, params?.value, required, title);
        if (errors.length === 0) {
          syncLightExtensionSettingToRunJs(ctx, fieldName, params?.value);
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new FlowCancelSaveException('Light extension settings validation failed.');
      },
      afterParamsSave: refreshJSActionAfterSettingsSave,
    },
  ];
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
    settings,
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

function showJSActionRuntimeError(ctx: JSActionRuntimeContext, error: unknown) {
  const normalized = normalizeRuntimeError(error);
  const message = getRecordProperty(ctx, 'message');
  const showError = getCallableProperty(message, 'error');
  const translate = getCallableProperty(ctx, 't') || getCallableProperty(ctx.model.context, 't');
  const fallbackMessage =
    typeof translate === 'function' ? translate('Failed to run JavaScript action') : 'Failed to run JavaScript action';
  showError?.(normalized.message || fallbackMessage);
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

function normalizeRuntimeError(error: unknown): JSActionRuntimeError {
  const source = getRuntimeErrorSource(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const status = source.status;

  let title = 'JavaScript action runtime error';
  let hint = 'Check the JavaScript action configuration and retry.';
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'Light extension access denied';
    hint = 'Ask an administrator for permission to use this light extension publication.';
  } else if (status === 404 || normalizedCode.includes('publication_not_found') || normalizedCode.includes('missing')) {
    title = 'Light extension publication missing';
    hint = 'Choose an available publication or publish this entry again.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'Light extension binding is outdated';
    hint = 'Refresh the action settings and choose the current active publication.';
  } else if (normalizedCode.includes('settings_invalid')) {
    title = 'Light extension settings are invalid';
    hint = 'Open the action settings and fix the light extension settings.';
  } else if (normalizedCode.includes('repo_archived') || normalizedCode.includes('repository_archived')) {
    title = 'Light extension repository is archived';
    hint = 'Restore the repository or choose a publication from another repository.';
  }

  return {
    title,
    hint,
    message: source.message || 'Failed to run JavaScript action',
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
  };
}

function getRuntimeErrorReporter(ctx: JSActionRuntimeContext): ((payload: Record<string, unknown>) => unknown) | null {
  const directReporter = getCallableProperty(ctx, 'reportRuntimeError');
  if (directReporter) {
    return directReporter;
  }
  const modelContext = getRecordProperty(ctx.model, 'context');
  return getCallableProperty(modelContext, 'reportRuntimeError');
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

function getModelUse(model: JSActionRuntimeModel): string | undefined {
  return (
    getStringProperty(model, 'use') ||
    getStringProperty(getRecordProperty(model, '_options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'createModelOptions'), 'use') ||
    toNonEmptyString(model.constructor?.name)
  );
}

function getModelTranslator(model: JSActionRuntimeModel): (text: string) => string {
  const t = model.context?.t;
  return typeof t === 'function' ? t.bind(model.context) : (text: string) => text;
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

function getStringProperty(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  return toNonEmptyString(value[key]);
}

function getNestedStringProperty(value: unknown, path: string[]): string | undefined {
  let current = value;
  for (const key of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[key];
  }
  return toNonEmptyString(current);
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return isRecord(property) ? property : undefined;
}

function getBooleanProperty(value: unknown, key: string): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return value[key] === true;
}

function getCallableProperty(value: unknown, key: string): ((...args: unknown[]) => unknown) | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const property = value[key];
  return typeof property === 'function' ? (property as (...args: unknown[]) => unknown) : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function cloneRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? (cloneJsonValue(value) as Record<string, unknown>) : {};
}

function cloneJsonValue<T>(value: T): T {
  if (typeof value === 'undefined') {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shortHash(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
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
