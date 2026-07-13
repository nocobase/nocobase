/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const LIGHT_EXTENSION_ENTRY_SCHEMA_VERSION = 1;
export const LIGHT_EXTENSION_ENTRY_SCHEMA_URI = 'https://schemas.nocobase.com/light-extension/entry-v1.schema.json';
export const LIGHT_EXTENSION_ENTRY_SCHEMA_LOCAL_PATH = '/light-extensions/schemas/entry-v1.schema.json';
export const LIGHT_EXTENSION_ENTRY_KEY_PATTERN = '^[a-z0-9][a-z0-9-]{0,62}$';
export const LIGHT_EXTENSION_SETTINGS_PROPERTY_PATTERN = '^[A-Za-z_][A-Za-z0-9_-]{0,63}$';

export const LIGHT_EXTENSION_SETTINGS_SCHEMA_TYPES = [
  'object',
  'array',
  'string',
  'number',
  'integer',
  'boolean',
] as const;

export const LIGHT_EXTENSION_SETTINGS_SCHEMA_KEYWORDS = [
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

export const LIGHT_EXTENSION_X_COMPONENT_WHITELIST = [
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

export const LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS = [
  '$eq',
  '$ne',
  '$in',
  '$notIn',
  '$empty',
  '$notEmpty',
] as const;
export const LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS = ['$and', '$or'] as const;
export const LIGHT_EXTENSION_SETTINGS_CONDITION_LIMITS = {
  maxDepth: 8,
  maxNodes: 64,
  maxItemsPerGroup: 32,
  maxPathSegments: 16,
} as const;

export type LightExtensionSettingsConditionOperator = (typeof LIGHT_EXTENSION_SETTINGS_CONDITION_OPERATORS)[number];
export type LightExtensionSettingsConditionLogic = (typeof LIGHT_EXTENSION_SETTINGS_CONDITION_LOGICS)[number];

export type LightExtensionSettingsCondition =
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
      logic: LightExtensionSettingsConditionLogic;
      items: LightExtensionSettingsCondition[];
    };
