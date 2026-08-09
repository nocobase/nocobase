/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const JS_TEMPLATE_SCHEMA_VERSION = 1;
export const JS_TEMPLATE_SCHEMA_URI = 'https://schemas.nocobase.com/js-template/entry-v1.schema.json';
export const JS_TEMPLATE_SCHEMA_LOCAL_PATH = '/js-templates/schemas/entry-v1.schema.json';
export const JS_TEMPLATE_KEY_PATTERN = '^[a-z0-9][a-z0-9-]{0,62}$';
export const JS_TEMPLATE_SETTINGS_PROPERTY_PATTERN = '^[A-Za-z_][A-Za-z0-9_-]{0,63}$';
export const JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT = 'nocobase:inferred-object';

export const JS_TEMPLATE_SETTINGS_SCHEMA_TYPES = ['object', 'array', 'string', 'number', 'integer', 'boolean'] as const;

export const JS_TEMPLATE_SETTINGS_SCHEMA_KEYWORDS = [
  'type',
  'title',
  'description',
  'default',
  'enum',
  'required',
  'properties',
  'items',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'format',
  'x-component',
  'x-component-props',
  'x-visible-when',
] as const;

export const JS_TEMPLATE_X_COMPONENT_WHITELIST = [
  'Input',
  'Input.TextArea',
  'InputNumber',
  'Select',
  'CollectionSelect',
  'CollectionFieldSelect',
  'RoleSelect',
  'DataSourceSelect',
  'Switch',
  'Checkbox',
  'Radio.Group',
  'DatePicker',
  'ColorPicker',
] as const;

export const JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS = ['$eq', '$ne', '$in', '$notIn', '$empty', '$notEmpty'] as const;
export const JS_TEMPLATE_SETTINGS_CONDITION_LOGICS = ['$and', '$or'] as const;
export const JS_TEMPLATE_SETTINGS_CONDITION_LIMITS = {
  maxDepth: 8,
  maxNodes: 64,
  maxItemsPerGroup: 32,
  maxPathSegments: 16,
} as const;

export type JsTemplateSettingsConditionOperator = (typeof JS_TEMPLATE_SETTINGS_CONDITION_OPERATORS)[number];
export type JsTemplateSettingsConditionLogic = (typeof JS_TEMPLATE_SETTINGS_CONDITION_LOGICS)[number];

export type JsTemplateSettingsCondition =
  | {
      path: string;
      operator: '$eq' | '$ne' | '$in' | '$notIn';
      value: unknown;
    }
  | {
      path: string;
      operator: '$empty' | '$notEmpty';
    }
  | {
      logic: JsTemplateSettingsConditionLogic;
      items: JsTemplateSettingsCondition[];
    };

export function buildJsTemplateSettingsSchema(settings: Record<string, unknown>): Record<string, unknown> {
  const normalized = normalizeSettingsProperties(settings);
  return {
    type: 'object',
    additionalProperties: false,
    ...(normalized.required.length ? { required: normalized.required } : {}),
    properties: normalized.properties,
  };
}

export function buildJsTemplateSettingsDefinition(settingsSchema: Record<string, unknown>): Record<string, unknown> {
  const properties = settingsSchema.properties;
  if (!isRecord(properties)) {
    return {};
  }

  return restoreSettingsProperties(properties, settingsSchema.required);
}

function normalizeSettingsProperties(settings: Record<string, unknown>): {
  properties: Record<string, unknown>;
  required: string[];
} {
  const required: string[] = [];
  const properties = Object.fromEntries(
    Object.entries(settings).map(([name, schema]) => {
      if (!isRecord(schema)) {
        return [name, cloneJsonValue(schema)];
      }
      if (schema.required === true) {
        required.push(name);
      }
      return [name, normalizeSettingsSchemaNode(schema)];
    }),
  );
  return { properties, required };
}

function normalizeSettingsSchemaNode(schema: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(schema)
    .filter(
      ([key]) =>
        key !== 'required' &&
        key !== 'properties' &&
        key !== 'items' &&
        key !== 'additionalProperties' &&
        key !== '$comment',
    )
    .map(([key, value]) => [key, cloneJsonValue(value)] as const);
  const normalized = Object.fromEntries(entries);
  const properties = schema.properties;
  const items = schema.items;
  const explicitRequired = schema.required;
  const isInferredObject =
    typeof schema.type === 'undefined' && (isRecord(properties) || Array.isArray(explicitRequired));

  if (isInferredObject) {
    normalized.type = 'object';
    normalized.$comment = JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT;
  }
  if (schema.type === 'object' || isInferredObject) {
    normalized.additionalProperties = false;
  }

  if (isRecord(properties)) {
    const nested = normalizeSettingsProperties(properties);
    normalized.properties = nested.properties;
    if (Array.isArray(explicitRequired)) {
      normalized.required = [
        ...explicitRequired.map((item) => cloneJsonValue(item)),
        ...nested.required.filter((name) => !explicitRequired.includes(name)),
      ];
    } else if (nested.required.length) {
      normalized.required = nested.required;
    } else if (typeof explicitRequired !== 'undefined' && typeof explicitRequired !== 'boolean') {
      normalized.required = cloneJsonValue(explicitRequired);
    }
  } else {
    if (typeof properties !== 'undefined') {
      normalized.properties = cloneJsonValue(properties);
    }
    if (typeof explicitRequired !== 'undefined' && typeof explicitRequired !== 'boolean') {
      normalized.required = cloneJsonValue(explicitRequired);
    }
  }

  if (isRecord(items)) {
    normalized.items = normalizeSettingsSchemaNode(items);
  } else if (typeof items !== 'undefined') {
    normalized.items = cloneJsonValue(items);
  }

  return normalized;
}

function restoreSettingsProperties(
  properties: Record<string, unknown>,
  requiredValue: unknown,
): Record<string, unknown> {
  const required = new Set(
    Array.isArray(requiredValue) ? requiredValue.filter((name): name is string => typeof name === 'string') : [],
  );
  return Object.fromEntries(
    Object.entries(properties).map(([name, schema]) => [
      name,
      isRecord(schema) ? restoreSettingsSchemaNode(schema, required.has(name)) : cloneJsonValue(schema),
    ]),
  );
}

function restoreSettingsSchemaNode(schema: Record<string, unknown>, required: boolean): Record<string, unknown> {
  const isInferredObject = schema.type === 'object' && schema.$comment === JS_TEMPLATE_SETTINGS_INFERRED_OBJECT_COMMENT;
  const entries = Object.entries(schema)
    .filter(
      ([key]) =>
        key !== 'required' &&
        key !== 'properties' &&
        key !== 'items' &&
        key !== 'additionalProperties' &&
        (!isInferredObject || (key !== 'type' && key !== '$comment')),
    )
    .map(([key, value]) => [key, cloneJsonValue(value)] as const);
  const restored = Object.fromEntries(entries);
  const properties = schema.properties;
  const items = schema.items;

  if (required) {
    restored.required = true;
  }
  if (isRecord(properties)) {
    restored.properties = restoreSettingsProperties(properties, schema.required);
  } else if (typeof properties !== 'undefined') {
    restored.properties = cloneJsonValue(properties);
  }
  if (!isRecord(properties) && Array.isArray(schema.required)) {
    restored.required = cloneJsonValue(schema.required);
  }
  if (isRecord(items)) {
    restored.items = restoreSettingsSchemaNode(items, false);
  } else if (typeof items !== 'undefined') {
    restored.items = cloneJsonValue(items);
  }

  return restored;
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
