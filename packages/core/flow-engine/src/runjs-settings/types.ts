/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/json-schema';
import type { FlowModel } from '../models';

export type RunJSSettingsJSONValue =
  | null
  | boolean
  | number
  | string
  | RunJSSettingsJSONValue[]
  | { [key: string]: RunJSSettingsJSONValue };

export type RunJSSettingsKey = 'default';

export type DataSourceEnvelope = {
  $type: 'dataSource';
  name: string;
};

export type CollectionEnvelope = {
  $type: 'collection';
  dataSource: string;
  name: string;
};

export type CollectionFieldEnvelope = {
  $type: 'collectionField';
  dataSource: string;
  collection: string;
  name: string;
};

export type RunJSSettingsEnvelope = DataSourceEnvelope | CollectionEnvelope | CollectionFieldEnvelope;

export type RunJSSettingOptionValue = string | number | boolean | null;

export type RunJSSettingOption = {
  label: string;
  value: RunJSSettingOptionValue;
};

export type RunJSSettingFieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'datetime'
  | 'color'
  | 'dataSource'
  | 'collection'
  | 'collectionField'
  | 'json';

export type RunJSSettingField = {
  type: RunJSSettingFieldType;
  title?: string;
  description?: string;
  default?: RunJSSettingsJSONValue;
  required?: boolean;
  visible?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: RunJSSettingOption[];
  min?: number;
  max?: number;
  step?: number;
  ui?: string;
  dataSource?: `$${string}` | DataSourceEnvelope;
  collection?: `$${string}` | CollectionEnvelope;
  fieldTypes?: string[];
};

export type RunJSSettingsSchema = {
  version?: 1;
  title?: string;
  description?: string;
  fields: Record<string, RunJSSettingField>;
  order?: string[];
};

export type SettingsFactoryPhase = 'render' | 'settings-open' | 'settings-draft' | 'settings-save';

export type SettingsFactoryContext = {
  locale?: string;
  t?: (key: string, options?: Record<string, unknown>) => string;
  model: {
    uid?: string;
    use?: string;
    pageInfo?: unknown;
  };
  dataSourceManager?: unknown;
  getConfigValue: (name: string) => RunJSSettingsJSONValue | undefined;
};

export type SettingsFactoryArgs = {
  ctx: SettingsFactoryContext;
  values: Record<string, RunJSSettingsJSONValue>;
  draftValues?: Record<string, RunJSSettingsJSONValue>;
  phase: SettingsFactoryPhase;
};

export type RunJSSettingsFactory = (args: SettingsFactoryArgs) => RunJSSettingsSchema;

export type UseSettingsInput = RunJSSettingsSchema | RunJSSettingsFactory;

export type UseSettingsOptions = {
  key?: RunJSSettingsKey;
};

export type RuntimeSettingsRegistryEntry = {
  modelUid: string;
  modelUse: string;
  settingsKey: RunJSSettingsKey;
  schemaOrFactory?: UseSettingsInput;
  lastSchema?: RunJSSettingsSchema;
  lastError?: Error;
  runId: number;
  codeHash: string;
  registeredAt: number;
  status: 'current' | 'error';
};

export type RuntimeSettingsRunMeta = {
  modelUid: string;
  modelUse: string;
  runId: number;
  codeHash: string;
};

export type RuntimeSettingsEvaluateInput = {
  phase: SettingsFactoryPhase;
  values: Record<string, RunJSSettingsJSONValue>;
  draftValues?: Record<string, RunJSSettingsJSONValue>;
  ctx?: SettingsFactoryContext;
};

export type RuntimeSettingsEvaluateResult =
  | {
      schema: RunJSSettingsSchema;
      error?: undefined;
    }
  | {
      schema?: RunJSSettingsSchema;
      error: Error;
    };

export type RunJSSettingsUISchemaOptions = {
  values?: Record<string, RunJSSettingsJSONValue>;
};

export type RunJSSettingsUISchemaResult = Record<string, ISchema>;

export type RunJSSettingsModelLike = Pick<FlowModel, 'uid' | 'use' | 'getStepParams'> & {
  context?: {
    locale?: string;
    dataSourceManager?: unknown;
    t?: (key: string, options?: Record<string, unknown>) => string;
  };
};
