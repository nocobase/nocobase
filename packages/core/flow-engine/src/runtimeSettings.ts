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
import type { StepDefinition } from './types';

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
}

const RUNTIME_SETTING_KEY_RE = /^[A-Za-z_$][A-Za-z0-9_$-]*$/;
const RESERVED_RUNTIME_SETTING_KEYS = new Set(['runJs']);
const RUNTIME_SETTINGS_CALL = 'ctx.useSettings';

type RuntimeSettingsConfigExtraction = {
  hasRuntimeSettingsCall: boolean;
  hasUnsupportedRuntimeSettingsCall: boolean;
  configs: UseSettingsConfig[];
};

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
  if (_.isPlainObject(value)) {
    return 'object';
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
  return 'Input';
};

const isRuntimeSettingDefinition = (value: unknown): value is UseSettingsObjectDefinition => _.isPlainObject(value);

const getRuntimeSettingSchemaType = (type: UseSettingsFieldType, defaultValue: unknown) => {
  if (type === 'multiSelect') {
    return 'array';
  }
  if (type === 'json') {
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
  if (type === 'json' && typeof props.autoSize === 'undefined' && typeof props.rows === 'undefined') {
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

class RuntimeSettingsLiteralParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): unknown {
    const value = this.parseValue();
    this.skipIgnored();
    if (this.index < this.source.length) {
      throw new Error('Unexpected trailing content');
    }
    return value;
  }

  private parseValue(): unknown {
    this.skipIgnored();
    const char = this.source[this.index];
    if (char === '{') {
      return this.parseObject();
    }
    if (char === '[') {
      return this.parseArray();
    }
    if (char === '"' || char === "'" || char === '`') {
      return this.parseString();
    }
    if (char === '-' || /\d/.test(char || '')) {
      return this.parseNumber();
    }
    const identifier = this.readIdentifier();
    if (identifier === 'true') {
      return true;
    }
    if (identifier === 'false') {
      return false;
    }
    if (identifier === 'null') {
      return null;
    }
    if (identifier === 'undefined') {
      return undefined;
    }
    throw new Error('Unsupported literal value');
  }

  private parseObject(): Record<string, unknown> {
    this.expect('{');
    const value: Record<string, unknown> = {};
    this.skipIgnored();
    while (this.source[this.index] !== '}') {
      const key = this.parseKey();
      this.skipIgnored();
      this.expect(':');
      value[key] = this.parseValue();
      this.skipIgnored();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipIgnored();
        continue;
      }
      break;
    }
    this.expect('}');
    return value;
  }

  private parseArray(): unknown[] {
    this.expect('[');
    const value: unknown[] = [];
    this.skipIgnored();
    while (this.source[this.index] !== ']') {
      value.push(this.parseValue());
      this.skipIgnored();
      if (this.source[this.index] === ',') {
        this.index += 1;
        this.skipIgnored();
        continue;
      }
      break;
    }
    this.expect(']');
    return value;
  }

  private parseKey(): string {
    this.skipIgnored();
    const char = this.source[this.index];
    if (char === '"' || char === "'" || char === '`') {
      return String(this.parseString());
    }
    const identifier = this.readIdentifier();
    if (!identifier) {
      throw new Error('Expected object key');
    }
    return identifier;
  }

  private parseString(): string {
    const quote = this.source[this.index];
    this.index += 1;
    let value = '';
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (char === quote) {
        this.index += 1;
        return value;
      }
      if (char === '\\') {
        this.index += 1;
        value += this.readEscapedCharacter();
        continue;
      }
      value += char;
      this.index += 1;
    }
    throw new Error('Unterminated string literal');
  }

  private readEscapedCharacter(): string {
    const char = this.source[this.index];
    this.index += 1;
    switch (char) {
      case 'n':
        return '\n';
      case 'r':
        return '\r';
      case 't':
        return '\t';
      case 'b':
        return '\b';
      case 'f':
        return '\f';
      case 'v':
        return '\v';
      case '0':
        return '\0';
      default:
        return char || '';
    }
  }

  private parseNumber(): number {
    const match = this.source.slice(this.index).match(/^-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/);
    if (!match) {
      throw new Error('Invalid number literal');
    }
    this.index += match[0].length;
    return Number(match[0]);
  }

  private readIdentifier(): string {
    const match = this.source.slice(this.index).match(/^[A-Za-z_$][A-Za-z0-9_$]*/);
    if (!match) {
      return '';
    }
    this.index += match[0].length;
    return match[0];
  }

  private skipIgnored() {
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (/\s/.test(char)) {
        this.index += 1;
        continue;
      }
      if (char === '/' && this.source[this.index + 1] === '/') {
        this.index += 2;
        while (this.index < this.source.length && this.source[this.index] !== '\n') {
          this.index += 1;
        }
        continue;
      }
      if (char === '/' && this.source[this.index + 1] === '*') {
        this.index += 2;
        while (
          this.index < this.source.length &&
          !(this.source[this.index] === '*' && this.source[this.index + 1] === '/')
        ) {
          this.index += 1;
        }
        if (this.index < this.source.length) {
          this.index += 2;
        }
        continue;
      }
      break;
    }
  }

  private expect(char: string) {
    this.skipIgnored();
    if (this.source[this.index] !== char) {
      throw new Error(`Expected '${char}'`);
    }
    this.index += 1;
  }
}

const skipRunJsIgnored = (source: string, index: number) => {
  let cursor = index;
  while (cursor < source.length && /\s/.test(source[cursor])) {
    cursor += 1;
  }
  return cursor;
};

const isIdentifierPart = (char: string | undefined) => !!char && /[A-Za-z0-9_$]/.test(char);

const findNextRuntimeSettingsCall = (source: string, start: number) => {
  let quote: string | undefined;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '/' && source[index + 1] === '/') {
      index += 2;
      while (index < source.length && source[index] !== '\n') {
        index += 1;
      }
      continue;
    }
    if (char === '/' && source[index + 1] === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index += 1;
      }
      index += 1;
      continue;
    }

    if (
      source.startsWith(RUNTIME_SETTINGS_CALL, index) &&
      !isIdentifierPart(source[index - 1]) &&
      !isIdentifierPart(source[index + RUNTIME_SETTINGS_CALL.length])
    ) {
      return index;
    }
  }
  return -1;
};

const findRuntimeSettingsObjectEnd = (source: string, start: number) => {
  let depth = 0;
  let quote: string | undefined;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') {
      depth += 1;
      continue;
    }
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  return -1;
};

const extractRuntimeSettingsConfigsFromRunJs = (code: string): RuntimeSettingsConfigExtraction => {
  const configs: UseSettingsConfig[] = [];
  let hasRuntimeSettingsCall = false;
  let hasUnsupportedRuntimeSettingsCall = false;
  let searchFrom = 0;
  while (searchFrom < code.length) {
    const callIndex = findNextRuntimeSettingsCall(code, searchFrom);
    if (callIndex < 0) {
      break;
    }
    hasRuntimeSettingsCall = true;
    let cursor = skipRunJsIgnored(code, callIndex + RUNTIME_SETTINGS_CALL.length);
    if (code[cursor] !== '(') {
      hasUnsupportedRuntimeSettingsCall = true;
      searchFrom = callIndex + RUNTIME_SETTINGS_CALL.length;
      continue;
    }
    cursor = skipRunJsIgnored(code, cursor + 1);
    if (code[cursor] !== '{') {
      hasUnsupportedRuntimeSettingsCall = true;
      searchFrom = cursor + 1;
      continue;
    }
    const objectEnd = findRuntimeSettingsObjectEnd(code, cursor);
    if (objectEnd < 0) {
      hasUnsupportedRuntimeSettingsCall = true;
      break;
    }
    const literal = code.slice(cursor, objectEnd + 1);
    try {
      const parsed = new RuntimeSettingsLiteralParser(literal).parse();
      if (_.isPlainObject(parsed)) {
        configs.push(parsed as UseSettingsConfig);
      }
    } catch (error) {
      hasUnsupportedRuntimeSettingsCall = true;
      console.warn('ctx.useSettings(config): only object literal declarations can be preloaded.', error);
    }
    searchFrom = objectEnd + 1;
  }
  return { configs, hasRuntimeSettingsCall, hasUnsupportedRuntimeSettingsCall };
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
      const savedParams = model?.getStepParams(flowKey, settingKey) as Record<string, unknown> | undefined;
      const hasSavedParams = typeof savedParams !== 'undefined';

      if (_.isPlainObject(definition.uiSchema)) {
        steps[settingKey] = {
          title,
          uiSchema: definition.uiSchema as Record<string, ISchema>,
          defaultParams: _.isPlainObject(defaultValue) ? { ...(defaultValue as Record<string, unknown>) } : {},
          uiMode: 'dialog',
        };
        values[settingKey] = hasSavedParams ? savedParams : defaultValue;
        return;
      }

      if (_.isPlainObject(definition.properties)) {
        const objectDefaults = _.isPlainObject(defaultValue) ? (defaultValue as Record<string, unknown>) : {};
        steps[settingKey] = {
          title,
          uiSchema: toRuntimeSettingPropertiesSchema(definition.properties),
          defaultParams: objectDefaults,
          uiMode: 'dialog',
        };
        values[settingKey] = hasSavedParams ? savedParams : objectDefaults;
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
      };
      values[settingKey] =
        savedParams && Object.prototype.hasOwnProperty.call(savedParams, 'value') ? savedParams.value : defaultValue;
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
    for (const source of sources.values()) {
      if (source.flowKey === flowKey) {
        Object.assign(steps, source.steps);
      }
    }
    return steps;
  }

  public getRuntimeSettingsDefaultValues(config: UseSettingsConfig): Record<string, unknown> {
    return this.normalizeConfig(undefined, '', config).values;
  }

  public syncRuntimeSettingsFromRunJsSource(model: FlowModel, flowKey: string, stepKey: string, code: unknown) {
    const source = typeof code === 'string' ? code : '';
    const { configs, hasRuntimeSettingsCall, hasUnsupportedRuntimeSettingsCall } =
      extractRuntimeSettingsConfigsFromRunJs(source);
    if (hasRuntimeSettingsCall && configs.length === 0) {
      return;
    }

    const sourceKey = `${model.uid}:${flowKey}:${stepKey}`;
    const session = this.beginRuntimeSettingsDeclaration(model, sourceKey, flowKey);
    const previous = this.getSourceMap(model)?.get(sourceKey);
    if (hasUnsupportedRuntimeSettingsCall && previous?.flowKey === flowKey) {
      session.steps = { ...previous.steps };
    }
    configs.forEach((config) => {
      this.defineRuntimeSettings(session, config);
    });
    this.commitRuntimeSettingsDeclaration(session);
  }

  public syncRuntimeSettingsFromStepParams(model: FlowModel, flowKey: string, stepKey = 'runJs') {
    const stepParams = model.getStepParams(flowKey, stepKey) as { code?: unknown } | undefined;
    if (!stepParams || !Object.prototype.hasOwnProperty.call(stepParams, 'code')) {
      return;
    }
    this.syncRuntimeSettingsFromRunJsSource(model, flowKey, stepKey, stepParams?.code);
  }
}
