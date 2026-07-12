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
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';

import {
  getSchemaTitle,
  isSettingValueValid,
  normalizeSchemaType,
  RunJSSourceResolverRegistry,
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
  return isRecord(descriptor) ? descriptor : null;
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

export function getLightExtensionSettingDefaultValue(
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
  return Object.prototype.hasOwnProperty.call(fieldSchema, 'default') ? cloneJsonValue(fieldSchema.default) : undefined;
}

export function createLightExtensionSettingStep<TModel extends FlowModel>(options: {
  fieldName: string;
  fieldSchema: JsonSchemaLike;
  required: boolean;
  stepKey: string;
  defaultValue: unknown;
  sort: number;
  component: string;
  syncValue: (ctx: FlowSettingsContext<TModel>, fieldName: string, value: unknown) => void;
  afterParamsSave: (ctx: FlowSettingsContext<TModel>) => Promise<void>;
}): [string, StepDefinition] {
  const { fieldName, fieldSchema, required, stepKey, defaultValue, sort } = options;
  const title = getSchemaTitle(fieldSchema, fieldName);
  return [
    stepKey,
    {
      key: stepKey,
      title,
      sort,
      uiSchema: {
        value: {
          type: normalizeSchemaType(fieldSchema) || 'string',
          title,
          'x-decorator': 'FormItem',
          'x-component': options.component,
          'x-component-props': { fieldName, fieldSchema, required },
        },
      },
      defaultParams: () => ({ value: cloneJsonValue(defaultValue) }),
      beforeParamsSave(ctx: FlowSettingsContext<TModel>, params: Record<string, unknown>) {
        if (isSettingValueValid(fieldSchema, params?.value, required)) {
          options.syncValue(ctx, fieldName, params?.value);
          return;
        }
        ctx.model.context?.message?.error?.(ctx.model.context.t('Settings validation failed'));
        throw new FlowCancelSaveException('Light extension settings validation failed.');
      },
      afterParamsSave: options.afterParamsSave,
    },
  ];
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

export function getModelTranslator(model: { context?: { t?: unknown } }): (text: string) => string {
  const t = model.context?.t;
  return typeof t === 'function' ? t.bind(model.context) : (text: string) => text;
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

export function getLightExtensionSettingStepKey(fieldName: string, schemaHash: string): string {
  const sanitized = fieldName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `leSetting__${(sanitized || 'field').slice(0, 48)}__${shortHash(`${fieldName}:${schemaHash}`)}`;
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
