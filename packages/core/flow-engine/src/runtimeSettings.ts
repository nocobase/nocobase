/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import _ from 'lodash';
import type { FlowModel } from './models';
import type { ParamObject, StepDefinition } from './types';

export type UseSettingsPrimitive = string | number | boolean | null;

type UseSettingsFieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'datetime'
  | 'color'
  | 'json'
  | 'object';

export interface UseSettingsObjectDefinition {
  title?: string;
  description?: string;
  default?: unknown;
  type?: UseSettingsFieldType;
  component?: string;
  componentProps?: Record<string, unknown>;
  options?: Array<{ label: string; value: unknown }>;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  ui?: string;
  properties?: Record<string, UseSettingsDefinition>;
  uiSchema?: Record<string, unknown>;
}

export type UseSettingsDefinition = UseSettingsPrimitive | UseSettingsObjectDefinition;
export type UseSettingsConfig = Record<string, UseSettingsDefinition>;

interface RuntimeSettingSource {
  sourceKey: string;
  flowKey: string;
  steps: Record<string, StepDefinition>;
}

export interface RuntimeSettingsDeclarationSession {
  model: FlowModel;
  sourceKey: string;
  flowKey: string;
  steps: Record<string, StepDefinition>;
  declared: boolean;
  preservePrevious?: boolean;
}

type RuntimeSettingValueMode = 'wrapped' | 'direct';

export interface RuntimeSettingStepMeta {
  settingKey: string;
  valueMode: RuntimeSettingValueMode;
}

type RuntimeSettingStepDefinition = StepDefinition & {
  runtimeSetting?: RuntimeSettingStepMeta;
};

const RUNTIME_SETTING_KEY_RE = /^[A-Za-z_$][A-Za-z0-9_$-]*$/;
const RESERVED_RUNTIME_SETTING_KEYS = new Set(['runJs']);
const RUNTIME_SETTINGS_VALUES_FLOW_KEY = 'runjsSettings';
const RUNTIME_SETTINGS_VALUES_STEP_KEY = 'configure';
const RUNTIME_SETTINGS_STEP_KEY_PREFIX = '__runtimeSettings__';

const humanizeRuntimeSettingKey = (key: string) =>
  key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());

const getRuntimeSettingType = (
  value: unknown,
  explicitType?: UseSettingsObjectDefinition['type'],
): UseSettingsFieldType => {
  if (explicitType) {
    return explicitType;
  }
  if (typeof value === 'number') {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (Array.isArray(value)) {
    return 'json';
  }
  if (_.isPlainObject(value)) {
    return 'json';
  }
  return 'string';
};

const getRuntimeSettingComponent = (type: UseSettingsFieldType, definition: UseSettingsObjectDefinition) => {
  if (definition.component) {
    return definition.component;
  }
  if (definition.options?.length) {
    return 'Select';
  }
  if (type === 'number') {
    return 'NumberPicker';
  }
  if (type === 'boolean') {
    return 'Switch';
  }
  if (type === 'text') {
    return 'Input.TextArea';
  }
  if (type === 'date' || type === 'datetime') {
    return 'DatePicker';
  }
  if (type === 'json') {
    return 'JsonTextArea';
  }
  if (type === 'object') {
    return 'JsonTextArea';
  }
  return 'Input';
};

const isRuntimeSettingDefinition = (value: unknown): value is UseSettingsObjectDefinition => _.isPlainObject(value);

const getRuntimeSettingSchemaType = (type: UseSettingsFieldType, defaultValue: unknown) => {
  if (type === 'multiSelect') {
    return 'array';
  }
  if (type === 'json' || type === 'object') {
    return Array.isArray(defaultValue) ? 'array' : 'object';
  }
  if (['text', 'select', 'date', 'datetime', 'color'].includes(type)) {
    return 'string';
  }
  return type;
};

const getRuntimeSettingComponentProps = (
  type: UseSettingsFieldType,
  definition: UseSettingsObjectDefinition,
): Record<string, unknown> | undefined => {
  const props: Record<string, unknown> = { ...(definition.componentProps || {}) };

  if (definition.placeholder) {
    props.placeholder = definition.placeholder;
  }
  if (typeof definition.min === 'number') {
    props.min = definition.min;
  }
  if (typeof definition.max === 'number') {
    props.max = definition.max;
  }
  if (typeof definition.step === 'number') {
    props.step = definition.step;
  }
  if (type === 'datetime') {
    props.showTime = true;
  }
  if (type === 'multiSelect') {
    props.mode = 'multiple';
  }
  if (
    (type === 'json' || type === 'object') &&
    typeof props.autoSize === 'undefined' &&
    typeof props.rows === 'undefined'
  ) {
    props.autoSize = { minRows: 4, maxRows: 16 };
  }

  return Object.keys(props).length ? props : undefined;
};

const toRuntimeSettingValueSchema = (settingKey: string, rawDefinition: UseSettingsDefinition): ISchema => {
  const isObjectDefinition = isRuntimeSettingDefinition(rawDefinition);
  const definition = isObjectDefinition ? rawDefinition : {};
  const defaultValue = isObjectDefinition ? definition.default : rawDefinition;
  const type = getRuntimeSettingType(defaultValue, definition.type);
  const title = definition.title || humanizeRuntimeSettingKey(settingKey);
  const schemaType = getRuntimeSettingSchemaType(type, defaultValue);
  const componentProps = getRuntimeSettingComponentProps(type, definition);
  const valueSchema: Record<string, unknown> = {
    type: schemaType,
    title,
    'x-decorator': 'FormItem',
    'x-component': getRuntimeSettingComponent(type, definition),
  };

  if (definition.description) {
    valueSchema.description = definition.description;
  }
  if (definition.options) {
    valueSchema.enum = definition.options;
  }
  if (componentProps) {
    valueSchema['x-component-props'] = componentProps;
  }
  if (definition.required) {
    valueSchema.required = true;
  }
  if (definition.disabled) {
    valueSchema['x-disabled'] = true;
  }

  return valueSchema as ISchema;
};

const getRuntimeSettingDefaultValue = (rawDefinition: UseSettingsDefinition): unknown => {
  if (!isRuntimeSettingDefinition(rawDefinition)) {
    return rawDefinition;
  }
  if (_.isPlainObject(rawDefinition.properties)) {
    const propertyDefaults: Record<string, unknown> = {};
    Object.entries(rawDefinition.properties).forEach(([propertyKey, propertyDefinition]) => {
      const propertyDefault = getRuntimeSettingDefaultValue(propertyDefinition);
      if (typeof propertyDefault !== 'undefined') {
        propertyDefaults[propertyKey] = propertyDefault;
      }
    });
    return {
      ...propertyDefaults,
      ...(_.isPlainObject(rawDefinition.default) ? (rawDefinition.default as Record<string, unknown>) : {}),
    };
  }
  return rawDefinition.default;
};

const toRuntimeSettingPropertiesSchema = (
  properties: Record<string, UseSettingsDefinition>,
): Record<string, ISchema> => {
  const schema: Record<string, ISchema> = {};
  Object.entries(properties).forEach(([propertyKey, propertyDefinition]) => {
    if (!RUNTIME_SETTING_KEY_RE.test(propertyKey)) {
      console.warn(`ctx.useSettings(config): invalid property key '${propertyKey}' skipped.`);
      return;
    }
    schema[propertyKey] = toRuntimeSettingValueSchema(propertyKey, propertyDefinition);
  });
  return schema;
};

export class RuntimeSettings {
  private readonly registry: WeakMap<FlowModel, Map<string, RuntimeSettingSource>> = new WeakMap();

  private getSourceMap(model: FlowModel, create = false) {
    let sources = this.registry.get(model);
    if (!sources && create) {
      sources = new Map<string, RuntimeSettingSource>();
      this.registry.set(model, sources);
    }
    return sources;
  }

  private emitChanged(model: FlowModel) {
    model.emitter?.emit('onRuntimeSettingsChanged');
  }

  private normalizeConfig(model: FlowModel | undefined, flowKey: string, config: UseSettingsConfig) {
    const steps: Record<string, StepDefinition> = {};
    const values: Record<string, unknown> = {};
    const savedValues = model ? this.getSavedValues(model) : {};

    if (!_.isPlainObject(config)) {
      console.warn('ctx.useSettings(config): config must be a plain object.');
      return { steps, values };
    }

    Object.entries(config).forEach(([settingKey, rawDefinition]) => {
      if (!RUNTIME_SETTING_KEY_RE.test(settingKey)) {
        console.warn(`ctx.useSettings(config): invalid setting key '${settingKey}' skipped.`);
        return;
      }
      if (RESERVED_RUNTIME_SETTING_KEYS.has(settingKey)) {
        console.warn(`ctx.useSettings(config): reserved setting key '${settingKey}' skipped.`);
        return;
      }

      const isObjectDefinition = isRuntimeSettingDefinition(rawDefinition);
      const definition = isObjectDefinition ? (rawDefinition as UseSettingsObjectDefinition) : {};
      const hasDefault = isObjectDefinition ? Object.prototype.hasOwnProperty.call(definition, 'default') : true;
      const defaultValue = getRuntimeSettingDefaultValue(rawDefinition);
      const title = definition.title || humanizeRuntimeSettingKey(settingKey);
      const hasSavedValue = Object.prototype.hasOwnProperty.call(savedValues, settingKey);
      const savedValue = savedValues[settingKey];

      if (_.isPlainObject(definition.uiSchema)) {
        steps[settingKey] = {
          title,
          uiSchema: definition.uiSchema as Record<string, ISchema>,
          defaultParams: _.isPlainObject(defaultValue) ? { ...(defaultValue as Record<string, unknown>) } : {},
          uiMode: 'dialog',
          runtimeSetting: { settingKey, valueMode: 'direct' },
        } as RuntimeSettingStepDefinition;
        values[settingKey] = hasSavedValue ? savedValue : defaultValue;
        return;
      }

      if (_.isPlainObject(definition.properties)) {
        const objectDefaults = _.isPlainObject(defaultValue) ? (defaultValue as Record<string, unknown>) : {};
        steps[settingKey] = {
          title,
          uiSchema: toRuntimeSettingPropertiesSchema(definition.properties),
          defaultParams: objectDefaults,
          uiMode: 'dialog',
          runtimeSetting: { settingKey, valueMode: 'direct' },
        } as RuntimeSettingStepDefinition;
        values[settingKey] = hasSavedValue ? savedValue : objectDefaults;
        return;
      }

      const valueSchema = toRuntimeSettingValueSchema(settingKey, rawDefinition);
      steps[settingKey] = {
        title,
        uiSchema: {
          value: valueSchema,
        },
        defaultParams: hasDefault ? { value: defaultValue } : {},
        uiMode: 'dialog',
        runtimeSetting: { settingKey, valueMode: 'wrapped' },
      } as RuntimeSettingStepDefinition;
      values[settingKey] = hasSavedValue ? savedValue : defaultValue;
    });

    return { steps, values };
  }

  public beginRuntimeSettingsDeclaration(
    model: FlowModel,
    sourceKey: string,
    flowKey: string,
  ): RuntimeSettingsDeclarationSession {
    return {
      model,
      sourceKey,
      flowKey,
      steps: {},
      declared: false,
    };
  }

  public defineRuntimeSettings(
    session: RuntimeSettingsDeclarationSession,
    config: UseSettingsConfig,
  ): Record<string, unknown>;
  public defineRuntimeSettings(
    model: FlowModel,
    sourceKey: string,
    flowKey: string,
    config: UseSettingsConfig,
  ): Record<string, unknown>;
  public defineRuntimeSettings(
    modelOrSession: FlowModel | RuntimeSettingsDeclarationSession,
    sourceKeyOrConfig: string | UseSettingsConfig,
    flowKey?: string,
    config?: UseSettingsConfig,
  ): Record<string, unknown> {
    if (typeof sourceKeyOrConfig !== 'string') {
      const session = modelOrSession as RuntimeSettingsDeclarationSession;
      const { steps, values } = this.normalizeConfig(session.model, session.flowKey, sourceKeyOrConfig);
      session.steps = { ...session.steps, ...steps };
      session.declared = true;
      return values;
    }

    const model = modelOrSession as FlowModel;
    const sourceKey = sourceKeyOrConfig;
    const session = this.beginRuntimeSettingsDeclaration(model, sourceKey, flowKey || '');
    const values = this.defineRuntimeSettings(session, config || {});
    this.commitRuntimeSettingsDeclaration(session);
    return values;
  }

  public commitRuntimeSettingsDeclaration(session: RuntimeSettingsDeclarationSession) {
    const sources = this.getSourceMap(session.model, true);
    if (!sources) {
      return;
    }

    const previous = sources.get(session.sourceKey);
    const hasSteps = Object.keys(session.steps).length > 0;
    if (!hasSteps) {
      if (session.preservePrevious) {
        return;
      }
      if (previous) {
        sources.delete(session.sourceKey);
        if (sources.size === 0) {
          this.registry.delete(session.model);
        }
        this.emitChanged(session.model);
      }
      return;
    }

    const next: RuntimeSettingSource = {
      sourceKey: session.sourceKey,
      flowKey: session.flowKey,
      steps: session.steps,
    };

    if (_.isEqual(previous, next)) {
      return;
    }

    sources.set(session.sourceKey, next);
    this.emitChanged(session.model);
  }

  public getRuntimeSettingSteps(model: FlowModel, flowKey: string): Record<string, StepDefinition> {
    const sources = this.getSourceMap(model);
    if (!sources) {
      return {};
    }

    const steps: Record<string, StepDefinition> = {};
    const staticSteps = model.getFlow(flowKey)?.steps || {};
    const runtimeSettingKeys = new Set<string>();
    for (const source of sources.values()) {
      if (source.flowKey === flowKey) {
        Object.entries(source.steps).forEach(([settingKey, step]) => {
          if (runtimeSettingKeys.has(settingKey)) {
            return;
          }
          runtimeSettingKeys.add(settingKey);
          const stepKey = this.getRuntimeSettingStepKey(settingKey, staticSteps, steps);
          steps[stepKey] = step;
        });
      }
    }
    return steps;
  }

  private getRuntimeSettingStepKey(
    settingKey: string,
    staticSteps: Record<string, StepDefinition>,
    runtimeSteps: Record<string, StepDefinition>,
  ) {
    if (
      !Object.prototype.hasOwnProperty.call(staticSteps, settingKey) &&
      !Object.prototype.hasOwnProperty.call(runtimeSteps, settingKey)
    ) {
      return settingKey;
    }

    const baseKey = `${RUNTIME_SETTINGS_STEP_KEY_PREFIX}${settingKey}`;
    let nextKey = baseKey;
    let index = 2;
    while (
      Object.prototype.hasOwnProperty.call(staticSteps, nextKey) ||
      Object.prototype.hasOwnProperty.call(runtimeSteps, nextKey)
    ) {
      nextKey = `${baseKey}_${index}`;
      index += 1;
    }
    return nextKey;
  }

  public getRuntimeSettingsDefaultValues(config: UseSettingsConfig): Record<string, unknown> {
    return this.normalizeConfig(undefined, '', config).values;
  }

  public getRuntimeSettingFormValues(model: FlowModel, step: StepDefinition): Record<string, unknown> {
    const runtimeSetting = getRuntimeSettingStepMeta(step);
    if (!runtimeSetting) {
      return {};
    }

    const savedValues = this.getSavedValues(model);
    if (!Object.prototype.hasOwnProperty.call(savedValues, runtimeSetting.settingKey)) {
      return {};
    }

    const savedValue = savedValues[runtimeSetting.settingKey];
    if (runtimeSetting.valueMode === 'wrapped') {
      return { value: savedValue };
    }
    return _.isPlainObject(savedValue) ? { ...(savedValue as Record<string, unknown>) } : {};
  }

  public setRuntimeSettingFormValues(model: FlowModel, step: StepDefinition, values: Record<string, unknown>) {
    const runtimeSetting = getRuntimeSettingStepMeta(step);
    if (!runtimeSetting) {
      return false;
    }

    const nextValue = runtimeSetting.valueMode === 'wrapped' ? values?.value : values;
    const nextParams: ParamObject = {};
    nextParams[runtimeSetting.settingKey] = nextValue;
    model.setStepParams(RUNTIME_SETTINGS_VALUES_FLOW_KEY, RUNTIME_SETTINGS_VALUES_STEP_KEY, nextParams);
    return true;
  }

  public clearRuntimeSettingsDeclaration(model: FlowModel, sourceKey: string) {
    const sources = this.getSourceMap(model);
    if (!sources || !sources.delete(sourceKey)) {
      return;
    }
    if (sources.size === 0) {
      this.registry.delete(model);
    }
    this.emitChanged(model);
  }

  public clearRuntimeSettingsFromStep(model: FlowModel, flowKey: string, stepKey = 'runJs') {
    this.clearRuntimeSettingsDeclaration(model, `${model.uid}:${flowKey}:${stepKey}`);
  }

  private getSavedValues(model: FlowModel): Record<string, unknown> {
    const values = model.getStepParams(RUNTIME_SETTINGS_VALUES_FLOW_KEY, RUNTIME_SETTINGS_VALUES_STEP_KEY);
    return _.isPlainObject(values) ? (values as Record<string, unknown>) : {};
  }
}

export const getRuntimeSettingStepMeta = (step: StepDefinition | undefined): RuntimeSettingStepMeta | undefined => {
  const runtimeSetting = (step as RuntimeSettingStepDefinition | undefined)?.runtimeSetting;
  if (!runtimeSetting || typeof runtimeSetting.settingKey !== 'string') {
    return undefined;
  }
  return runtimeSetting;
};

export const runtimeSettingsValuesPath = {
  flowKey: RUNTIME_SETTINGS_VALUES_FLOW_KEY,
  stepKey: RUNTIME_SETTINGS_VALUES_STEP_KEY,
} as const;
