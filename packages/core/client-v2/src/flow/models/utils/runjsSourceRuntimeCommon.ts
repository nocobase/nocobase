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
  type FlowRuntimeContext,
  type RuntimeFlowSettingDiagnosticPayload,
  type FlowSettingsContext,
  type StepDefinition,
} from '@nocobase/flow-engine';
import React from 'react';
import {
  getCanonicalRunJSSettings,
  getJsTemplateId,
  getJsTemplateSettingStepKey,
  isSettingsFieldVisible,
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
  setJsTemplateTopLevelSetting,
  type RunJSSettingsCondition,
} from '@nocobase/runjs/settings';

import {
  getSchemaTitle,
  getSettingsSchemaProperties,
  getSettingsSchemaRequired,
  normalizeSchemaType,
  readRunJSRuntimeError,
  RunJSSettingsDescriptorProviderRegistry,
  RunJSSourceResolverRegistry,
  shouldHideRunJSSourceMenu,
  validateRunJSSettings,
  validateRunJSSettingValue,
  type JsonSchemaLike,
  type RunJSSourceBinding,
  type RunJSSourceSettings,
  type RunJSSourceSettingsDescriptor,
} from '../../components/runjs-source';
import { RunJSEditorField, RunJSEditorRegistry, type RunJSSourceLocator } from '../../components/runjs-studio';

export const INLINE_SOURCE_MODE = 'inline';

/** Canonical persisted source mode for the product now named JS templates. */
export const JS_TEMPLATE_SOURCE_MODE = 'js-template';

export type JsTemplateSourceMode = typeof JS_TEMPLATE_SOURCE_MODE;
export type RunJSSourceMode = typeof INLINE_SOURCE_MODE | JsTemplateSourceMode;

export type RunJSSourceModeParams = {
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
  details?: Record<string, unknown>;
  paths?: string[];
};

type RuntimeErrorLabels = {
  defaultTitle: string;
  defaultHint: string;
  defaultMessage: string;
  outdatedHint: string;
  invalidSettingsHint: string;
};

type SourceStepHooks = Pick<StepDefinition, 'defaultParams' | 'beforeParamsSave' | 'afterParamsSave'>;

type JsTemplateSourcePlumbingOptions<TModel extends FlowModel> = {
  flowKey: string;
  stepKey: string;
  ownerKind: string;
  getOwnerLocator: (model: TModel) => Record<string, unknown>;
  getSourceLocator?: (model: TModel) => RunJSSourceLocator;
  afterParamsSave: (ctx: FlowSettingsContext<TModel>) => Promise<void>;
};

type PendingJsTemplateBindingSettings = {
  entryId: string;
  missingRequiredPaths: string[];
  schema: JsonSchemaLike;
};

type JsTemplateSelectOption = {
  label: string;
  value: string;
};

type JsTemplateCollectionField = {
  name?: unknown;
  title?: unknown;
  hidden?: unknown;
  options?: unknown;
};

type JsTemplateCollection = {
  name?: unknown;
  title?: unknown;
  hidden?: unknown;
  options?: unknown;
  getFields?: () => JsTemplateCollectionField[];
};

type JsTemplateDataSource = {
  key?: unknown;
  name?: unknown;
  getCollections?: () => JsTemplateCollection[];
  getCollection?: (name: string) => JsTemplateCollection | undefined;
};

type JsTemplateDataSourceManager = {
  getDataSources?: () => JsTemplateDataSource[];
  getDataSource?: (key: string) => JsTemplateDataSource | undefined;
};

const pendingJsTemplateBindingSettings = new WeakMap<object, PendingJsTemplateBindingSettings>();

export class JsTemplateSettingsValidationError extends FlowCancelSaveException {
  readonly code = 'JS_TEMPLATE_SETTINGS_INVALID';
  readonly paths: string[];

  constructor(paths: string[]) {
    super('JS Template settings validation failed.');
    this.name = 'JsTemplateSettingsValidationError';
    this.paths = paths;
  }
}

export class JsTemplateSettingsConditionRuntimeError extends Error {
  readonly code = 'JS_TEMPLATE_SETTINGS_CONDITION_INVALID';
  readonly templateId: string;
  readonly propertyPath: string;
  readonly reason: string;
  readonly flowSettingsDiagnostic: RuntimeFlowSettingDiagnosticPayload;

  constructor(options: { templateId: string; propertyPath: string; cause: unknown; message?: string }) {
    const reason = options.cause instanceof Error ? options.cause.message : String(options.cause);
    super(
      options.message ||
        `JS Template "${options.templateId}" setting "${options.propertyPath}" has an invalid x-visible-when condition: ${reason}`,
    );
    this.name = 'JsTemplateSettingsConditionRuntimeError';
    this.templateId = options.templateId;
    this.propertyPath = options.propertyPath;
    this.reason = reason;
    this.flowSettingsDiagnostic = {
      code: this.code,
      message: this.message,
      details: {
        templateId: this.templateId,
        propertyPath: this.propertyPath,
        reason: this.reason,
      },
    };
  }
}

export function normalizeJsTemplateSourceMode(value: unknown): RunJSSourceMode {
  return value === JS_TEMPLATE_SOURCE_MODE ? JS_TEMPLATE_SOURCE_MODE : INLINE_SOURCE_MODE;
}

export function createJsTemplateSourcePlumbing<TModel extends FlowModel>(
  options: JsTemplateSourcePlumbingOptions<TModel>,
) {
  const getRunJsStepParams = (model: TModel): Record<string, unknown> =>
    cloneRecord(model.getStepParams(options.flowKey, options.stepKey));

  const getSettingsDescriptor = (model: TModel, params: Record<string, unknown>) =>
    getJsTemplateSettingsDescriptor({
      modelUid: model.uid,
      ownerKind: options.ownerKind,
      ownerLocator: options.getOwnerLocator(model),
      params,
      sourceLocator: options.getSourceLocator?.(model) || {
        kind: 'flowModel.step',
        modelUid: model.uid,
        flowKey: options.flowKey,
        stepKey: options.stepKey,
        paramPath: ['code'],
        versionPath: ['version'],
      },
    });

  const resolveBindingTitle = async (model: TModel, params: Record<string, unknown>) =>
    (await resolveJsTemplateBindingTitle({
      modelUid: model.uid,
      ownerKind: options.ownerKind,
      ownerLocator: options.getOwnerLocator(model),
      params,
    })) || getJsTemplateFallbackBindingTitle(params.sourceBinding);

  return {
    getRunJsStepParams,
    getSettingsDescriptor,
    getRuntimeSettings: (params: Record<string, unknown>): RunJSSourceSettings => cloneRecord(params.settings),
    getSourceDefaultParams(ctx: FlowSettingsContext<TModel>): RunJSSourceModeParams {
      const runJs = getRunJsStepParams(ctx.model);
      return {
        sourceMode: normalizeJsTemplateSourceMode(runJs.sourceMode),
        sourceBinding: isRecord(runJs.sourceBinding) ? cloneJsonValue(runJs.sourceBinding) : undefined,
        settings: isRecord(runJs.settings) ? cloneJsonValue(runJs.settings) : {},
      };
    },
    async beforeParamsSave(ctx: FlowSettingsContext<TModel>, params: RunJSSourceModeParams) {
      const sourceMode = normalizeJsTemplateSourceMode(params?.sourceMode);
      const sourceBinding = isRecord(params?.sourceBinding) ? cloneJsonValue(params.sourceBinding) : undefined;
      if (sourceMode === JS_TEMPLATE_SOURCE_MODE && !sourceBinding) {
        ctx.model.context?.message?.error?.(ctx.model.context.t('Select a JS Template'));
        throw new FlowCancelSaveException('JS Template source binding is required.');
      }
      const descriptor =
        sourceMode === JS_TEMPLATE_SOURCE_MODE
          ? await getSettingsDescriptor(ctx.model, { ...params, sourceMode, sourceBinding })
          : null;
      const normalized = normalizeJsTemplateSourceSettingsForBinding({
        currentRunJs: getRunJsStepParams(ctx.model),
        nextSourceMode: sourceMode,
        nextSourceBinding: sourceBinding,
        nextSettings: params.settings,
        descriptor,
      });
      setCanonicalJsTemplateSource(ctx.model, options.flowKey, {
        sourceMode,
        sourceBinding,
        settings: normalized.settings,
      });
      rememberJsTemplateBindingSettings(ctx.model, descriptor, normalized.missingRequiredPaths);
    },
    async afterSourceParamsSave(ctx: FlowSettingsContext<TModel>) {
      await options.afterParamsSave(ctx);
      await showPendingJsTemplateRequiredSettings(ctx.model, options.flowKey);
    },
    afterParamsSave: options.afterParamsSave,
    syncSetting(ctx: FlowSettingsContext<TModel>, fieldName: string, value: unknown) {
      setCanonicalJsTemplateSetting(ctx.model, options.flowKey, fieldName, value);
    },
    resolveBindingTitle,
    async getEditorTitle(model: TModel): Promise<string> {
      const translate = getModelTranslator(model);
      const params = getRunJsStepParams(model);
      const baseTitle = translate('Write JavaScript');
      if (normalizeJsTemplateSourceMode(params.sourceMode) !== JS_TEMPLATE_SOURCE_MODE) {
        return baseTitle;
      }
      const sourceTitle = await resolveBindingTitle(model, params);
      return sourceTitle
        ? `${baseTitle} (${translate('JS Template')}: ${sourceTitle})`
        : `${baseTitle} (${translate('JS Template')})`;
    },
  };
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

export function createJsTemplateSourceModeStep(options: {
  kind: string;
  component: string;
  createMenuUIMode: (options: { kind: string }) => unknown;
  hooks: SourceStepHooks;
}): StepDefinition {
  return {
    title: '{{t("Code source")}}',
    hideInSettings: shouldHideRunJSSourceMenu,
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

export function createJsTemplateSourceBindingStep(options: {
  kind: string;
  component: string;
  hooks: SourceStepHooks;
}): StepDefinition {
  return {
    title: '{{t("JS Template source")}}',
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

export function createJsTemplateRunJsUISchema(options: {
  kind: 'js-action' | 'js-field' | 'js-item' | 'js-page';
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
          jsTemplateKind: options.kind,
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

export function createRunJSEditorEmbedUIMode(title?: string) {
  const baseProps = title ? { title } : {};

  if (!RunJSEditorRegistry.getProviders().length) {
    return {
      type: 'embed' as const,
      props: {
        ...baseProps,
        styles: {
          body: {
            // The fallback inline editor positions itself with position:fixed; the transform makes the drawer body its containing block
            transform: 'translateX(0)',
          },
        },
      },
    };
  }

  return {
    type: 'embed' as const,
    props: {
      ...baseProps,
      footer: null,
      styles: {
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        },
      },
    },
  };
}

export async function getJsTemplateSettingsDescriptor(options: {
  modelUid: string;
  ownerKind: string;
  ownerLocator: Record<string, unknown>;
  params: Record<string, unknown>;
  sourceLocator?: RunJSSourceLocator;
}): Promise<RunJSSourceSettingsDescriptor | null> {
  const { params } = options;
  const sourceMode = normalizeJsTemplateSourceMode(params.sourceMode);
  const settings = isRecord(params.settings) ? (params.settings as RunJSSourceSettings) : undefined;
  const context = {
    modelUid: options.modelUid,
    ownerKind: options.ownerKind,
    ownerLocator: options.ownerLocator,
  };
  let descriptor: RunJSSourceSettingsDescriptor | undefined;
  if (sourceMode === JS_TEMPLATE_SOURCE_MODE) {
    if (!isRecord(params.sourceBinding)) {
      return null;
    }
    const resolver = RunJSSourceResolverRegistry.getResolver(JS_TEMPLATE_SOURCE_MODE);
    if (typeof resolver?.getSettingsDescriptor !== 'function') {
      return null;
    }
    descriptor = await resolver.getSettingsDescriptor({
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
      sourceBinding: params.sourceBinding as RunJSSourceBinding,
      settings,
      context,
    });
  } else {
    descriptor = await RunJSSettingsDescriptorProviderRegistry.getSettingsDescriptor({
      sourceMode: INLINE_SOURCE_MODE,
      sourceRef: isRecord(params.sourceRef) ? params.sourceRef : undefined,
      settings,
      runJs: {
        code: typeof params.code === 'string' ? params.code : '',
        version: typeof params.version === 'string' && params.version ? params.version : 'v2',
        sourceMode: INLINE_SOURCE_MODE,
        ...(settings ? { settings } : {}),
      },
      locator: options.sourceLocator,
      context,
    });
  }
  if (!isRecord(descriptor)) {
    return null;
  }
  if (!toNonEmptyString(descriptor.entryId)) {
    return null;
  }
  const schema = isRecord(descriptor.schema) ? descriptor.schema : null;
  const settingsSchemaHash = descriptor.settingsSchemaHash;
  if ((schema === null && settingsSchemaHash !== null) || (schema !== null && !toNonEmptyString(settingsSchemaHash))) {
    return null;
  }

  return descriptor as RunJSSourceSettingsDescriptor;
}

export async function resolveJsTemplateBindingTitle(options: {
  modelUid: string;
  ownerKind: string;
  ownerLocator: Record<string, unknown>;
  params: Record<string, unknown>;
}): Promise<string | undefined> {
  if (!isRecord(options.params.sourceBinding)) {
    return undefined;
  }
  const resolver = RunJSSourceResolverRegistry.getResolver(JS_TEMPLATE_SOURCE_MODE);
  if (typeof resolver?.getBindingTitle !== 'function') {
    return undefined;
  }
  try {
    const title = await resolver.getBindingTitle({
      sourceMode: JS_TEMPLATE_SOURCE_MODE,
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

export function createJsTemplateSettingStep<TModel extends FlowModel>(options: {
  templateId: string;
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
  const fieldType = normalizeSchemaType(fieldSchema) || 'string';
  const inlineSelect = createJsTemplateInlineSelectUIMode<TModel>({
    fieldSchema,
    savedRootValue: options.savedRootValue,
  });
  return [
    stepKey,
    {
      key: stepKey,
      title,
      sort,
      persistParams: false,
      ...(fieldType === 'boolean'
        ? {
            uiMode: {
              type: 'switch' as const,
              key: 'value',
            },
          }
        : {}),
      ...(inlineSelect ? { uiMode: inlineSelect } : {}),
      uiSchema: {
        value: {
          type: fieldType,
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
                throw new JsTemplateSettingsConditionRuntimeError({
                  templateId: options.templateId,
                  propertyPath: fieldName,
                  cause: error,
                  message: translate(
                    'JS Template "{{templateId}}" setting "{{propertyPath}}" has an invalid x-visible-when condition: {{reason}}',
                    {
                      templateId: options.templateId,
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
        throw new JsTemplateSettingsValidationError(validation.errors.map((issue) => issue.path));
      },
      afterParamsSave: options.afterParamsSave,
    },
  ];
}

function createJsTemplateInlineSelectUIMode<TModel extends FlowModel>(options: {
  fieldSchema: JsonSchemaLike;
  savedRootValue: Record<string, unknown>;
}): StepDefinition<TModel>['uiMode'] | undefined {
  const component = toNonEmptyString(options.fieldSchema['x-component']);
  if (component !== 'CollectionSelect' && component !== 'CollectionFieldSelect') {
    return undefined;
  }

  return (ctx: FlowRuntimeContext<TModel>) => ({
    type: 'select',
    key: 'value',
    props: {
      allowClear: true,
      showSearch: true,
      optionFilterProp: 'label',
      options: buildJsTemplateSettingSelectOptions({
        component,
        fieldSchema: options.fieldSchema,
        savedRootValue: options.savedRootValue,
        ctx,
      }),
    },
  });
}

function buildJsTemplateSettingSelectOptions<TModel extends FlowModel>(options: {
  component: 'CollectionSelect' | 'CollectionFieldSelect';
  fieldSchema: JsonSchemaLike;
  savedRootValue: Record<string, unknown>;
  ctx: FlowRuntimeContext<TModel>;
}): JsTemplateSelectOption[] {
  const manager = resolveJsTemplateDataSourceManager(options.ctx);
  const dataSource = resolveJsTemplateDataSource(manager, options.fieldSchema, options.savedRootValue, options.ctx);
  if (!dataSource) {
    return [];
  }
  if (options.component === 'CollectionSelect') {
    return toJsTemplateSelectOptions(dataSource.getCollections?.() || []);
  }

  const collectionName = resolveJsTemplateCollectionName(options.fieldSchema, options.savedRootValue);
  if (!collectionName) {
    return [];
  }
  return toJsTemplateSelectOptions(dataSource.getCollection?.(collectionName)?.getFields?.() || []);
}

function resolveJsTemplateDataSourceManager<TModel extends FlowModel>(
  ctx: FlowRuntimeContext<TModel>,
): JsTemplateDataSourceManager | undefined {
  const modelContext = getRecordProperty(getRecordProperty(ctx, 'model'), 'context');
  const manager =
    getRecordProperty(ctx, 'dataSourceManager') ||
    getRecordProperty(modelContext, 'dataSourceManager') ||
    getRecordProperty(getRecordProperty(ctx, 'app'), 'dataSourceManager');
  if (
    isRecord(manager) &&
    (typeof manager.getDataSource === 'function' || typeof manager.getDataSources === 'function')
  ) {
    return manager as JsTemplateDataSourceManager;
  }
  return undefined;
}

function resolveJsTemplateDataSource<TModel extends FlowModel>(
  manager: JsTemplateDataSourceManager | undefined,
  fieldSchema: JsonSchemaLike,
  savedRootValue: Record<string, unknown>,
  ctx: FlowRuntimeContext<TModel>,
): JsTemplateDataSource | undefined {
  if (!manager) {
    return undefined;
  }
  const componentProps = isRecord(fieldSchema['x-component-props']) ? fieldSchema['x-component-props'] : {};
  const dataSourceField = toNonEmptyString(componentProps.dataSourceField) || 'dataSource';
  const preferredKey =
    toNonEmptyString(componentProps.dataSource) ||
    toNonEmptyString(savedRootValue[dataSourceField]) ||
    toNonEmptyString(getRecordProperty(ctx, 'dataSourceKey'));
  if (preferredKey) {
    const preferred = manager.getDataSource?.(preferredKey);
    if (preferred) {
      return preferred;
    }
  }
  const main = manager.getDataSource?.('main');
  if (main) {
    return main;
  }
  return manager.getDataSources?.()[0];
}

function resolveJsTemplateCollectionName(
  fieldSchema: JsonSchemaLike,
  savedRootValue: Record<string, unknown>,
): string | undefined {
  const componentProps = isRecord(fieldSchema['x-component-props']) ? fieldSchema['x-component-props'] : {};
  return (
    toNonEmptyString(componentProps.collection) ||
    toNonEmptyString(componentProps.collectionName) ||
    toNonEmptyString(savedRootValue[toNonEmptyString(componentProps.collectionField) || 'collection'])
  );
}

function toJsTemplateSelectOptions(
  items: Array<JsTemplateCollection | JsTemplateCollectionField>,
): JsTemplateSelectOption[] {
  return items.flatMap((item) => {
    const options = isRecord(item.options) ? item.options : {};
    if (item.hidden === true || options.hidden === true) {
      return [];
    }
    const value = toNonEmptyString(item.name) || toNonEmptyString(options.name);
    if (!value) {
      return [];
    }
    return [{ label: toNonEmptyString(item.title) || toNonEmptyString(options.title) || value, value }];
  });
}

export function createJsTemplateSettingSteps<TModel extends FlowModel>(options: {
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
  const canonicalSettings = normalizeJsTemplateSettings(options.descriptor, options.settings);

  return Object.fromEntries(
    Object.entries(properties).map(([fieldName, fieldSchema], index) =>
      createJsTemplateSettingStep<TModel>({
        templateId: options.descriptor.entryId,
        fieldName,
        fieldSchema,
        required: requiredFields.has(fieldName),
        stepKey: getJsTemplateSettingStepKey(options.descriptor.entryId, fieldName),
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

export function resolveEffectiveRunJSSettings(
  descriptor: RunJSSourceSettingsDescriptor,
  settings: unknown,
): Record<string, unknown> {
  const overrides = isRecord(settings) ? settings : {};
  const effectiveSettings = normalizeJsTemplateSettings(descriptor, overrides);
  if (!isRecord(descriptor.schema)) {
    return effectiveSettings;
  }

  const overrideValidation = validateRunJSSettings({
    schema: descriptor.schema,
    settings: overrides,
    mode: 'binding',
  });
  const runtimeValidation = validateRunJSSettings({
    schema: descriptor.schema,
    settings: effectiveSettings,
    mode: 'runtime',
  });
  const invalidPaths = [...overrideValidation.errors, ...runtimeValidation.errors].map((issue) => issue.path);
  if (invalidPaths.length) {
    throw new JsTemplateSettingsValidationError(Array.from(new Set(invalidPaths)));
  }

  return effectiveSettings;
}

export function normalizeJsTemplateSourceSettings(options: {
  currentRunJs: Record<string, unknown>;
  nextSourceMode: RunJSSourceMode;
  nextSourceBinding?: Record<string, unknown>;
  nextSettings?: unknown;
  descriptor?: RunJSSourceSettingsDescriptor | null;
}): Record<string, unknown> {
  return normalizeJsTemplateSourceSettingsForBinding(options).settings;
}

export function normalizeJsTemplateSourceSettingsForBinding(options: {
  currentRunJs: Record<string, unknown>;
  nextSourceMode: RunJSSourceMode;
  nextSourceBinding?: Record<string, unknown>;
  nextSettings?: unknown;
  descriptor?: RunJSSourceSettingsDescriptor | null;
}): { settings: Record<string, unknown>; missingRequiredPaths: string[] } {
  if (options.nextSourceMode !== JS_TEMPLATE_SOURCE_MODE) {
    return {
      settings: isRecord(options.nextSettings)
        ? cloneRecord(options.nextSettings)
        : getCanonicalRunJSSettings(options.currentRunJs),
      missingRequiredPaths: [],
    };
  }
  if (!options.nextSourceBinding) {
    return { settings: {}, missingRequiredPaths: [] };
  }
  if (!options.descriptor) {
    throw new FlowCancelSaveException('JS Template settings descriptor is required.');
  }
  const settings = normalizeJsTemplateSelection({
    currentBinding: options.currentRunJs.sourceBinding,
    currentSettings: getCanonicalRunJSSettings(options.currentRunJs),
    submittedSettings: options.nextSettings,
    nextBinding: options.nextSourceBinding,
    descriptor: options.descriptor,
  });
  if (!isRecord(options.descriptor.schema)) {
    const sameEntry =
      getJsTemplateId(options.currentRunJs.sourceBinding) === getJsTemplateId(options.nextSourceBinding);
    const submittedPaths = sameEntry && isRecord(options.nextSettings) ? Object.keys(options.nextSettings) : [];
    if (submittedPaths.length > 0) {
      throw new JsTemplateSettingsValidationError(submittedPaths);
    }
    return { settings: {}, missingRequiredPaths: [] };
  }

  const validation = validateRunJSSettings({
    schema: options.descriptor.schema,
    settings,
    mode: 'binding',
  });
  const invalidPaths = validation.errors.map((issue) => issue.path);
  if (invalidPaths.length > 0) {
    throw new JsTemplateSettingsValidationError(Array.from(new Set(invalidPaths)));
  }

  return {
    settings,
    missingRequiredPaths: validation.missingRequiredPaths,
  };
}

export function rememberJsTemplateBindingSettings(
  model: object,
  descriptor: RunJSSourceSettingsDescriptor | null,
  missingRequiredPaths: string[],
): void {
  if (!descriptor || !isRecord(descriptor.schema) || missingRequiredPaths.length === 0) {
    pendingJsTemplateBindingSettings.delete(model);
    return;
  }
  pendingJsTemplateBindingSettings.set(model, {
    entryId: descriptor.entryId,
    missingRequiredPaths: [...missingRequiredPaths],
    schema: descriptor.schema,
  });
}

export async function showPendingJsTemplateRequiredSettings(model: FlowModel, flowKey: string): Promise<void> {
  const pending = pendingJsTemplateBindingSettings.get(model);
  pendingJsTemplateBindingSettings.delete(model);
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
              stepKey: getJsTemplateSettingStepKey(pending.entryId, fieldName),
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
    `${translate('Configure required JS Template settings')}: `,
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

export function setCanonicalJsTemplateSetting(
  model: CanonicalSettingsModel,
  flowKey: string,
  fieldName: string,
  value: unknown,
): void {
  const runJs = cloneRecord(model.getStepParams(flowKey, 'runJs'));
  model.setStepParams(flowKey, {
    runJs: {
      ...runJs,
      settings: setJsTemplateTopLevelSetting(getCanonicalRunJSSettings(runJs), fieldName, value),
    },
  });
}

export function setCanonicalJsTemplateSource(
  model: CanonicalSettingsModel,
  flowKey: string,
  value: {
    sourceMode: RunJSSourceMode;
    sourceBinding?: Record<string, unknown>;
    settings: Record<string, unknown>;
  },
): void {
  const runJs = cloneRecord(model.getStepParams(flowKey, 'runJs'));
  // JS Template bindings often omit `code`. When switching back to inline, pin the stored
  // string (or empty) so runtime/editor defaultParams never inject the welcome template, and studio
  // open always receives a valid initialSource.code.
  const nextRunJs: Record<string, unknown> = {
    ...runJs,
    sourceMode: value.sourceMode,
    settings: cloneRecord(value.settings),
  };
  if (value.sourceMode === INLINE_SOURCE_MODE) {
    nextRunJs.code = typeof runJs.code === 'string' ? runJs.code : '';
    if (value.sourceBinding) {
      nextRunJs.sourceBinding = value.sourceBinding;
    } else {
      delete nextRunJs.sourceBinding;
    }
  } else {
    nextRunJs.sourceBinding = value.sourceBinding;
  }
  model.setStepParams(flowKey, {
    runJs: nextRunJs,
  });
}

export function normalizeJsTemplateRuntimeError(error: unknown, labels: RuntimeErrorLabels): RuntimeErrorInfo {
  const source = readRunJSRuntimeError(error);
  const code = source.code;
  const normalizedCode = code?.toLowerCase() || '';
  const normalizedReasonCode = source.reasonCode?.toLowerCase() || '';
  const status = source.status;
  let title = labels.defaultTitle;
  let hint = labels.defaultHint;
  if (status === 403 || normalizedCode.includes('permission') || normalizedCode.includes('forbidden')) {
    title = 'JS Template access denied';
    hint = 'Ask an administrator for permission to use this JS Template.';
  } else if (normalizedCode.includes('project_not_found') || normalizedReasonCode.includes('project_missing')) {
    title = 'JS Template project missing';
    hint = 'Choose an available project or restore this project.';
  } else if (
    status === 404 ||
    normalizedCode.includes('template_not_found') ||
    normalizedCode.includes('missing') ||
    normalizedReasonCode.includes('template_missing')
  ) {
    title = 'JS Template missing';
    hint = 'Choose an available template or restore this template.';
  } else if (normalizedCode.includes('binding_outdated') || normalizedCode.includes('outdated')) {
    title = 'JS Template binding is outdated';
    hint = labels.outdatedHint;
  } else if (normalizedCode.includes('settings_invalid') || normalizedReasonCode.includes('settings_invalid')) {
    title = 'JS Template settings are invalid';
    hint = labels.invalidSettingsHint;
  } else if (normalizedCode.includes('project_archived') || normalizedReasonCode.includes('project_archived')) {
    title = 'JS Template project is archived';
    hint = 'Restore the project or choose a template from another project.';
  }
  return {
    title,
    hint,
    message: source.message || labels.defaultMessage,
    ...(code ? { code } : {}),
    ...(typeof status === 'number' ? { status } : {}),
    ...(source.details ? { details: source.details } : {}),
    ...(source.paths ? { paths: source.paths } : {}),
  };
}

export function getJsTemplateFallbackBindingTitle(binding: unknown): string | undefined {
  if (!isRecord(binding)) {
    return undefined;
  }
  return toNonEmptyString(binding.templateId) || toNonEmptyString(binding.projectId);
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
