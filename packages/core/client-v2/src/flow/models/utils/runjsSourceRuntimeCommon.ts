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
  type RuntimeFlowSettingDiagnosticPayload,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import React from 'react';
import {
  getCanonicalRunJSSettings,
  getLightExtensionEntryId,
  getLightExtensionSettingStepKey,
  isSettingsFieldVisible,
  normalizeLightExtensionEntrySelection,
  normalizeLightExtensionSettings,
  setLightExtensionTopLevelSetting,
  type RunJSSettingsCondition,
} from '@nocobase/runjs/settings';

import {
  getSchemaTitle,
  getSettingsSchemaProperties,
  getSettingsSchemaRequired,
  normalizeSchemaType,
  RunJSSourceResolverRegistry,
  validateRunJSSettings,
  validateRunJSSettingValue,
  type JsonSchemaLike,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../components/runjs-source';
import { RunJSEditorField } from '../../components/runjs-studio';

export const INLINE_SOURCE_MODE = 'inline';
export const LIGHT_EXTENSION_SOURCE_MODE = 'light-extension';

export type LightExtensionSourceMode = typeof INLINE_SOURCE_MODE | typeof LIGHT_EXTENSION_SOURCE_MODE;

export type LightExtensionSourceModeParams = {
  sourceMode?: string;
  sourceBinding?: unknown;
  settings?: unknown;
};

type CanonicalSettingsModel = FlowModel & {
  getStepParams(flowKey: string, stepKey: string): unknown;
  setStepParams(flowKey: string, stepParams: Record<string, Record<string, unknown>>): void;
};

export type RuntimeErrorInfo = {
  title: string;
  hint: string;
  message: string;
  code?: string;
  status?: number;
};

type RuntimeErrorLabels = {
  defaultTitle: string;
  defaultHint: string;
  defaultMessage: string;
  outdatedHint: string;
  invalidSettingsHint: string;
};

type SourceStepHooks = Pick<StepDefinition, 'defaultParams' | 'beforeParamsSave' | 'afterParamsSave'>;

type PendingLightExtensionBindingSettings = {
  entryId: string;
  missingRequiredPaths: string[];
  schema: JsonSchemaLike;
};

const pendingLightExtensionBindingSettings = new WeakMap<object, PendingLightExtensionBindingSettings>();

export class LightExtensionSettingsValidationError extends FlowCancelSaveException {
  readonly code = 'LIGHT_EXTENSION_SETTINGS_INVALID';
  readonly paths: string[];

  constructor(paths: string[]) {
    super('Light extension settings validation failed.');
    this.name = 'LightExtensionSettingsValidationError';
    this.paths = paths;
  }
}

export class LightExtensionSettingsConditionRuntimeError extends Error {
  readonly code = 'LIGHT_EXTENSION_SETTINGS_CONDITION_INVALID';
  readonly entryId: string;
  readonly propertyPath: string;
  readonly reason: string;
  readonly flowSettingsDiagnostic: RuntimeFlowSettingDiagnosticPayload;

  constructor(options: { entryId: string; propertyPath: string; cause: unknown; message?: string }) {
    const reason = options.cause instanceof Error ? options.cause.message : String(options.cause);
    super(
      options.message ||
        `Light extension entry "${options.entryId}" setting "${options.propertyPath}" has an invalid x-visible-when condition: ${reason}`,
    );
    this.name = 'LightExtensionSettingsConditionRuntimeError';
    this.entryId = options.entryId;
    this.propertyPath = options.propertyPath;
    this.reason = reason;
    this.flowSettingsDiagnostic = {
      code: this.code,
      message: this.message,
      details: {
        entryId: this.entryId,
        propertyPath: this.propertyPath,
        reason: this.reason,
      },
    };
  }
}

export function normalizeLightExtensionSourceMode(value: unknown): LightExtensionSourceMode {
  return value === LIGHT_EXTENSION_SOURCE_MODE ? LIGHT_EXTENSION_SOURCE_MODE : INLINE_SOURCE_MODE;
}

export function createRuntimeRunTracker() {
  const runIds = new WeakMap<object, number>();
  return {
    begin(model: object): number {
      const runId = (runIds.get(model) || 0) + 1;
      runIds.set(model, runId);
      return runId;
    },
    isCurrent(model: object, runId: number): boolean {
      return runIds.get(model) === runId;
    },
  };
}

export function createLightExtensionSourceModeStep(options: {
  kind: string;
  component: string;
  createMenuUIMode: (options: { kind: string }) => unknown;
  hooks: SourceStepHooks;
}): StepDefinition {
  return {
    title: '{{t("Code source")}}',
    persistParams: false,
    uiMode: options.createMenuUIMode({ kind: options.kind }),
    useRawParams: true,
    uiSchema: {
      sourceMode: {
        type: 'string',
        'x-decorator': 'FormItem',
        'x-component': options.component,
        'x-component-props': { kind: options.kind },
      },
      sourceBinding: { type: 'object', 'x-display': 'hidden' },
      settings: { type: 'object', 'x-display': 'hidden' },
    },
    ...options.hooks,
  };
}

export function createLightExtensionSourceBindingStep(options: {
  kind: string;
  component: string;
  hooks: SourceStepHooks;
}): StepDefinition {
  return {
    title: '{{t("Light extension source")}}',
    hideInSettings: true,
    persistParams: false,
    useRawParams: true,
    uiSchema: {
      sourceMode: { type: 'string', 'x-display': 'hidden' },
      sourceBinding: {
        type: 'object',
        'x-decorator': 'FormItem',
        'x-component': options.component,
        'x-component-props': { kind: options.kind },
      },
      settings: { type: 'object', 'x-display': 'hidden' },
    },
    ...options.hooks,
  };
}

export function createLightExtensionRunJsUISchema(options: {
  kind: 'js-action' | 'js-field' | 'js-item';
  scene: string;
  surfaceStyle: 'action' | 'render' | 'value';
  minHeight?: string;
  decorateCode?: boolean;
}) {
  return {
    sourceMode: { type: 'string', 'x-display': 'hidden' },
    sourceBinding: { type: 'object', 'x-display': 'hidden' },
    settings: { type: 'object', 'x-display': 'hidden' },
    code: {
      type: 'string',
      ...(options.decorateCode === false ? {} : { 'x-decorator': 'FormItem' }),
      'x-component': RunJSEditorField,
      'x-component-props': {
        locatorFactory: 'flowModel.step',
        sourceMetadata: {
          lightExtensionKind: options.kind,
        },
        surfaceStyle: options.surfaceStyle,
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

export async function getLightExtensionSettingsDescriptor(options: {
  modelUid: string;
  ownerKind: string;
  ownerLocator: Record<string, unknown>;
  params: Record<string, unknown>;
}): Promise<RunJSSourceSettingsDescriptor | null> {
  const { params } = options;
  if (
    normalizeLightExtensionSourceMode(params.sourceMode) !== LIGHT_EXTENSION_SOURCE_MODE ||
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
      modelUid: options.modelUid,
      ownerKind: options.ownerKind,
      ownerLocator: options.ownerLocator,
    },
  });
  if (!isRecord(descriptor) || !toNonEmptyString(descriptor.entryId)) {
    return null;
  }
  const schema = isRecord(descriptor.schema) ? descriptor.schema : null;
  const settingsSchemaHash = descriptor.settingsSchemaHash;
  if ((schema === null && settingsSchemaHash !== null) || (schema !== null && !toNonEmptyString(settingsSchemaHash))) {
    return null;
  }

  return descriptor as unknown as RunJSSourceSettingsDescriptor;
}

export async function resolveLightExtensionBindingTitle(options: {
  modelUid: string;
  ownerKind: string;
  ownerLocator: Record<string, unknown>;
  params: Record<string, unknown>;
}): Promise<string | undefined> {
  if (!isRecord(options.params.sourceBinding)) {
    return undefined;
  }
  const resolver = RunJSSourceResolverRegistry.getResolver(LIGHT_EXTENSION_SOURCE_MODE);
  if (typeof resolver?.getBindingTitle !== 'function') {
    return undefined;
  }
  try {
    const title = await resolver.getBindingTitle({
      sourceMode: LIGHT_EXTENSION_SOURCE_MODE,
      sourceBinding: options.params.sourceBinding as RunJSSourceBinding,
      settings: isRecord(options.params.settings) ? (options.params.settings as RunJSSourceSettings) : undefined,
      context: {
        modelUid: options.modelUid,
        ownerKind: options.ownerKind,
        ownerLocator: options.ownerLocator,
      },
    });
    return toNonEmptyString(title);
  } catch (error) {
    console.warn('[NocoBase] Failed to resolve RunJS source binding title:', error);
    return undefined;
  }
}

export function createLightExtensionSettingStep<TModel extends FlowModel>(options: {
  entryId: string;
  fieldName: string;
  fieldSchema: JsonSchemaLike;
  required: boolean;
  stepKey: string;
  defaultValue: unknown;
  sort: number;
  component: string;
  rootSchema: JsonSchemaLike;
  descriptorDefaults: Record<string, unknown>;
  savedRootValue: Record<string, unknown>;
  syncValue: (ctx: FlowSettingsContext<TModel>, fieldName: string, value: unknown) => void;
  afterParamsSave: (ctx: FlowSettingsContext<TModel>) => Promise<void>;
}): [string, StepDefinition] {
  const { fieldName, fieldSchema, required, stepKey, defaultValue, sort } = options;
  const title = getSchemaTitle(fieldSchema, fieldName);
  const visibilityCondition = fieldSchema['x-visible-when'];
  return [
    stepKey,
    {
      key: stepKey,
      title,
      sort,
      persistParams: false,
      uiSchema: {
        value: {
          type: normalizeSchemaType(fieldSchema) || 'string',
          'x-decorator': 'FormItem',
          'x-component': options.component,
          'x-component-props': {
            fieldName,
            fieldPath: [fieldName],
            fieldSchema,
            rootSchema: options.rootSchema,
            savedRootValue: options.savedRootValue,
            descriptorDefaults: options.descriptorDefaults,
            required,
          },
        },
      },
      defaultParams: () => ({ value: cloneJsonValue(defaultValue) }),
      ...(typeof visibilityCondition === 'undefined'
        ? {}
        : {
            hideInSettings: (ctx) => {
              try {
                return !isSettingsFieldVisible(visibilityCondition as RunJSSettingsCondition, {
                  defaults: options.descriptorDefaults,
                  settings: options.savedRootValue,
                });
              } catch (error) {
                const reason = error instanceof Error ? error.message : String(error);
                const translate = getModelTranslator(ctx.model);
                throw new LightExtensionSettingsConditionRuntimeError({
                  entryId: options.entryId,
                  propertyPath: fieldName,
                  cause: error,
                  message: translate(
                    'Light extension entry "{{entryId}}" setting "{{propertyPath}}" has an invalid x-visible-when condition: {{reason}}',
                    {
                      entryId: options.entryId,
                      propertyPath: fieldName,
                      reason,
                    },
                  ),
                });
              }
            },
          }),
      beforeParamsSave(ctx: FlowSettingsContext<TModel>, params: Record<string, unknown>) {
        const validation = validateRunJSSettingValue({
          schema: fieldSchema,
          value: params?.value,
          required,
          mode: 'runtime',
          path: fieldName,
        });
        if (validation.errors.length === 0) {
          options.syncValue(ctx, fieldName, params?.value);
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new LightExtensionSettingsValidationError(validation.errors.map((issue) => issue.path));
      },
      afterParamsSave: options.afterParamsSave,
    },
  ];
}

export function createLightExtensionSettingSteps<TModel extends FlowModel>(options: {
  descriptor: RunJSSourceSettingsDescriptor;
  settings: Record<string, unknown>;
  component: string;
  sortStart?: number;
  syncValue: (ctx: FlowSettingsContext<TModel>, fieldName: string, value: unknown) => void;
  afterParamsSave: (ctx: FlowSettingsContext<TModel>) => Promise<void>;
}): Record<string, StepDefinition> | undefined {
  if (!options.descriptor.schema) {
    return undefined;
  }
  const properties = getSettingsSchemaProperties(options.descriptor.schema);
  if (Object.keys(properties).length === 0) {
    return undefined;
  }
  const requiredFields = getSettingsSchemaRequired(options.descriptor.schema);
  const canonicalSettings = normalizeLightExtensionSettings(options.descriptor, options.settings);

  return Object.fromEntries(
    Object.entries(properties).map(([fieldName, fieldSchema], index) =>
      createLightExtensionSettingStep<TModel>({
        entryId: options.descriptor.entryId,
        fieldName,
        fieldSchema,
        required: requiredFields.has(fieldName),
        stepKey: getLightExtensionSettingStepKey(options.descriptor.entryId, fieldName),
        defaultValue: canonicalSettings[fieldName],
        sort: (options.sortStart ?? 700) + index,
        component: options.component,
        rootSchema: options.descriptor.schema,
        descriptorDefaults: cloneRecord(options.descriptor.defaults),
        savedRootValue: cloneRecord(options.settings),
        syncValue: options.syncValue,
        afterParamsSave: options.afterParamsSave,
      }),
    ),
  );
}

export function normalizeLightExtensionSourceSettings(options: {
  currentRunJs: Record<string, unknown>;
  nextSourceMode: LightExtensionSourceMode;
  nextSourceBinding?: Record<string, unknown>;
  nextSettings?: unknown;
  descriptor?: RunJSSourceSettingsDescriptor | null;
}): Record<string, unknown> {
  return normalizeLightExtensionSourceSettingsForBinding(options).settings;
}

export function normalizeLightExtensionSourceSettingsForBinding(options: {
  currentRunJs: Record<string, unknown>;
  nextSourceMode: LightExtensionSourceMode;
  nextSourceBinding?: Record<string, unknown>;
  nextSettings?: unknown;
  descriptor?: RunJSSourceSettingsDescriptor | null;
}): { settings: Record<string, unknown>; missingRequiredPaths: string[] } {
  if (options.nextSourceMode !== LIGHT_EXTENSION_SOURCE_MODE || !options.nextSourceBinding) {
    return { settings: {}, missingRequiredPaths: [] };
  }
  if (!options.descriptor) {
    throw new FlowCancelSaveException('Light extension settings descriptor is required.');
  }
  const settings = normalizeLightExtensionEntrySelection({
    currentBinding: options.currentRunJs.sourceBinding,
    currentSettings: getCanonicalRunJSSettings(options.currentRunJs),
    submittedSettings: options.nextSettings,
    nextBinding: options.nextSourceBinding,
    descriptor: options.descriptor,
  });
  if (!isRecord(options.descriptor.schema)) {
    const sameEntry =
      getLightExtensionEntryId(options.currentRunJs.sourceBinding) ===
      getLightExtensionEntryId(options.nextSourceBinding);
    const submittedPaths = sameEntry && isRecord(options.nextSettings) ? Object.keys(options.nextSettings) : [];
    if (submittedPaths.length > 0) {
      throw new LightExtensionSettingsValidationError(submittedPaths);
    }
    return { settings: {}, missingRequiredPaths: [] };
  }

  const validation = validateRunJSSettings({
    schema: options.descriptor.schema,
    settings,
    mode: 'binding',
  });
  const sameEntry =
    getLightExtensionEntryId(options.currentRunJs.sourceBinding) ===
    getLightExtensionEntryId(options.nextSourceBinding);
  const submittedUnknownPaths =
    sameEntry && isRecord(options.nextSettings)
      ? validateRunJSSettings({
          schema: options.descriptor.schema,
          settings: options.nextSettings,
          mode: 'binding',
        })
          .errors.filter((issue) => issue.code === 'unknown')
          .map((issue) => issue.path)
      : [];
  const invalidPaths = [...validation.errors.map((issue) => issue.path), ...submittedUnknownPaths];
  if (invalidPaths.length > 0) {
    throw new LightExtensionSettingsValidationError(Array.from(new Set(invalidPaths)));
  }

  return {
    settings,
    missingRequiredPaths: validation.missingRequiredPaths,
  };
}

export function rememberLightExtensionBindingSettings(
  model: object,
  descriptor: RunJSSourceSettingsDescriptor | null,
  missingRequiredPaths: string[],
): void {
  if (!descriptor || !isRecord(descriptor.schema) || missingRequiredPaths.length === 0) {
    pendingLightExtensionBindingSettings.delete(model);
    return;
  }
  pendingLightExtensionBindingSettings.set(model, {
    entryId: descriptor.entryId,
    missingRequiredPaths: [...missingRequiredPaths],
    schema: descriptor.schema,
  });
}

export async function showPendingLightExtensionRequiredSettings(model: FlowModel, flowKey: string): Promise<void> {
  const pending = pendingLightExtensionBindingSettings.get(model);
  pendingLightExtensionBindingSettings.delete(model);
  if (!pending) {
    return;
  }

  const properties = getSettingsSchemaProperties(pending.schema);
  const menuEntries = Array.from(
    new Map(
      pending.missingRequiredPaths.flatMap((path) => {
        const fieldName = path.split('.')[0];
        const fieldSchema = properties[fieldName];
        if (!fieldName || !fieldSchema) {
          return [];
        }
        return [
          [
            fieldName,
            {
              label: getSchemaTitle(fieldSchema, fieldName),
              stepKey: getLightExtensionSettingStepKey(pending.entryId, fieldName),
            },
          ] as const,
        ];
      }),
    ).values(),
  );
  if (menuEntries.length === 0) {
    return;
  }

  const translate = getModelTranslator(model);
  const openSetting = (stepKey: string) => {
    model.openFlowSettings({ flowKey, stepKey });
  };
  const content = React.createElement(
    'span',
    null,
    `${translate('Configure required light extension settings')}: `,
    ...menuEntries.flatMap((entry, index) => [
      index > 0 ? ', ' : '',
      React.createElement(
        'button',
        {
          key: entry.stepKey,
          type: 'button',
          onClick: () => openSetting(entry.stepKey),
          style: {
            appearance: 'none',
            background: 'none',
            border: 0,
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
          },
        },
        entry.label,
      ),
    ]),
  );
  model.context?.message?.info?.({ content, duration: 0 });
}

export function setCanonicalLightExtensionSetting(
  model: CanonicalSettingsModel,
  flowKey: string,
  fieldName: string,
  value: unknown,
): void {
  const runJs = cloneRecord(model.getStepParams(flowKey, 'runJs'));
  model.setStepParams(flowKey, {
    runJs: {
      ...runJs,
      settings: setLightExtensionTopLevelSetting(getCanonicalRunJSSettings(runJs), fieldName, value),
    },
  });
}

export function setCanonicalLightExtensionSource(
  model: CanonicalSettingsModel,
  flowKey: string,
  value: {
    sourceMode: LightExtensionSourceMode;
    sourceBinding?: Record<string, unknown>;
    settings: Record<string, unknown>;
  },
): void {
  const runJs = cloneRecord(model.getStepParams(flowKey, 'runJs'));
  model.setStepParams(flowKey, {
    runJs: {
      ...runJs,
      sourceMode: value.sourceMode,
      sourceBinding: value.sourceBinding,
      settings: cloneRecord(value.settings),
    },
  });
}

export function normalizeLightExtensionRuntimeError(error: unknown, labels: RuntimeErrorLabels): RuntimeErrorInfo {
  const source = getRuntimeErrorSource(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const status = source.status;
  let title = labels.defaultTitle;
  let hint = labels.defaultHint;
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'Light extension access denied';
    hint = 'Ask an administrator for permission to use this light extension.';
  } else if (status === 404 || normalizedCode.includes('entry_not_found') || normalizedCode.includes('missing')) {
    title = 'Light extension entry missing';
    hint = 'Choose an available entry or restore this entry.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'Light extension binding is outdated';
    hint = labels.outdatedHint;
  } else if (normalizedCode.includes('settings_invalid')) {
    title = 'Light extension settings are invalid';
    hint = labels.invalidSettingsHint;
  } else if (normalizedCode.includes('repo_archived') || normalizedCode.includes('repository_archived')) {
    title = 'Light extension repository is archived';
    hint = 'Restore the repository or choose an entry from another repository.';
  }
  return {
    title,
    hint,
    message: source.message || labels.defaultMessage,
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
  };
}

export function getLightExtensionStoredBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }
  return (
    toNonEmptyString(binding.entryTitle) || toNonEmptyString(binding.entryName) || toNonEmptyString(binding.repoTitle)
  );
}

export function getLightExtensionFallbackBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }
  return toNonEmptyString(binding.entryId) || toNonEmptyString(binding.repoId);
}

export function getModelTranslator(model: {
  context?: { t?: unknown };
}): (text: string, options?: Record<string, unknown>) => string {
  const t = model.context?.t;
  return typeof t === 'function'
    ? (text: string, options?: Record<string, unknown>) => Reflect.apply(t, model.context, [text, options])
    : (text: string) => text;
}

export function getStringProperty(value: unknown, key: string): string | undefined {
  return toNonEmptyString(getRecordProperty(value, key));
}

export function getRecordProperty(value: unknown, key: string): unknown {
  return isRecord(value) ? value[key] : undefined;
}

export function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function cloneRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? cloneJsonValue(value) : {};
}

export function cloneJsonValue<T>(value: T): T {
  if (value === undefined) {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function shortHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36).padStart(6, '0').slice(0, 8);
}

export function stableSerialize(value: unknown): string {
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

export function stableSerializeWithCircular(value: unknown): string {
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

function getFirstServerError(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }
  if (Array.isArray(value.errors)) {
    const first = value.errors.find((item) => isRecord(item));
    return isRecord(first) ? first : null;
  }
  return isRecord(value.error) ? value.error : null;
}

function getRuntimeErrorSource(error: unknown): { code?: string; status?: number; message?: string } {
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
    return { message: error.message };
  }
  return { message: typeof error === 'string' ? error : undefined };
}
