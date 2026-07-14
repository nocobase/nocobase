/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  Alert,
  Checkbox,
  ColorPicker,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import type { SelectProps } from 'antd';
import { ApplicationContext } from '@nocobase/client-v2';
import {
  extractRunJSSettingsDefaults,
  isSettingsFieldVisible,
  type RunJSSettingsCondition,
} from '@nocobase/runjs/settings';
import dayjs, { type Dayjs } from 'dayjs';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';

export type JsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: string;
  'x-component'?: string;
  'x-component-props'?: Record<string, unknown>;
  'x-visible-when'?: RunJSSettingsCondition;
};

export type SettingsValidationError = {
  code?: string;
  label: string;
  path?: string;
  message: string;
};

export type SettingsValidationResult = {
  value: Record<string, unknown>;
  errors: SettingsValidationError[];
};

export interface SettingsAutoFormProps {
  schema?: Record<string, unknown> | null;
  value?: Record<string, unknown> | null;
  onChange?: (value: Record<string, unknown>, validation: SettingsValidationResult) => void;
  disabled?: boolean;
}

export interface SettingsSingleFieldProps {
  fieldName?: string;
  fieldPath?: string[] | string;
  fieldSchema?: Record<string, unknown> | JsonSchema | null;
  rootSchema?: Record<string, unknown> | JsonSchema | null;
  savedRootValue?: Record<string, unknown> | null;
  descriptorDefaults?: Record<string, unknown> | null;
  required?: boolean;
  value?: unknown;
  onChange?: (value: unknown, validation: SettingsValidationResult) => void;
  disabled?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asSchema(value: unknown): JsonSchema {
  return isRecord(value) ? (value as JsonSchema) : {};
}

function normalizeType(schema: JsonSchema): string | undefined {
  if (Array.isArray(schema.type)) {
    return schema.type.find((item) => item !== 'null');
  }
  if (schema.type) {
    return schema.type;
  }
  if (schema.properties || schema.required) {
    return 'object';
  }
  if (schema.items) {
    return 'array';
  }
  return undefined;
}

function getObjectDefaults(schema: JsonSchema): Record<string, unknown> {
  return extractRunJSSettingsDefaults(schema);
}

function normalizePrimitiveValue(schema: JsonSchema, value: unknown): unknown {
  const type = normalizeType(schema);
  if (value === undefined) {
    return schema.default;
  }
  if (type === 'integer') {
    return typeof value === 'number' ? Math.trunc(value) : value;
  }
  return value;
}

function normalizeSettings(schemaInput: unknown, rawValue: unknown, path: string[] = []): SettingsValidationResult {
  const schema = asSchema(schemaInput);
  const type = normalizeType(schema);
  const errors: SettingsValidationError[] = [];

  if (type !== 'object') {
    return {
      value: {},
      errors,
    };
  }

  const rawRecord = isRecord(rawValue) ? rawValue : {};
  const next: Record<string, unknown> = getObjectDefaults(schema);
  const required = new Set(schema.required || []);
  const properties = schema.properties || {};

  for (const [key, rawChild] of Object.entries(rawRecord)) {
    if (Object.prototype.hasOwnProperty.call(properties, key)) {
      continue;
    }
    const childPath = [...path, key];
    next[key] = cloneJsonValue(rawChild);
    errors.push(
      createValidationError(childPath.join('.'), 'Unknown property', childPath.join('.'), 'settings_unknown_property'),
    );
  }

  for (const [key, childSchema] of Object.entries(properties)) {
    const childPath = [...path, key];
    const settingsPath = childPath.join('.');
    const label = childSchema.title || settingsPath;
    const childType = normalizeType(childSchema);
    const hasRawChild = Object.prototype.hasOwnProperty.call(rawRecord, key);
    const hasDefaultChild = Object.prototype.hasOwnProperty.call(next, key);
    const rawChild = hasRawChild ? rawRecord[key] : next[key];

    if (required.has(key) && !hasDefaultChild && (!hasRawChild || rawChild === undefined)) {
      errors.push(createValidationError(label, 'Required', settingsPath));
      next[key] = rawChild;
      continue;
    }

    if (childType === 'object') {
      if (rawChild !== undefined && !isRecord(rawChild)) {
        next[key] = rawChild;
        errors.push(createValidationError(label, 'Must be an object', settingsPath));
        continue;
      }
      const childResult = normalizeSettings(childSchema, rawChild, childPath);
      next[key] = childResult.value;
      errors.push(...childResult.errors);
      continue;
    }

    const value = normalizePrimitiveValue(childSchema, rawChild);
    next[key] = value;
    errors.push(...validateLeafValue(childSchema, value, label, settingsPath));
  }

  return {
    value: next,
    errors,
  };
}

function validateLeafValue(
  schema: JsonSchema,
  value: unknown,
  label: string,
  path: string = label,
): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];
  const type = normalizeType(schema);

  if (value === undefined) {
    return errors;
  }

  if (type === 'string' && typeof value !== 'string') {
    errors.push(createValidationError(label, 'Must be a string', path));
  }
  if ((type === 'number' || type === 'integer') && typeof value !== 'number') {
    errors.push(createValidationError(label, 'Must be a number', path));
  }
  if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
    errors.push(createValidationError(label, 'Must be an integer', path));
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    errors.push(createValidationError(label, 'Must be a boolean', path));
  }
  if (type === 'array' && !Array.isArray(value)) {
    errors.push(createValidationError(label, 'Must be an array', path));
  }
  if (schema.enum && !schema.enum.some((item) => stableSerialize(item) === stableSerialize(value))) {
    errors.push(createValidationError(label, 'Must be one of the allowed values', path));
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(createValidationError(label, 'Too short', path));
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(createValidationError(label, 'Too long', path));
    }
    if (!isValidStringFormat(schema.format, value)) {
      errors.push(createValidationError(label, 'Must match the required format', path));
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(createValidationError(label, 'Too small', path));
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(createValidationError(label, 'Too large', path));
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      const itemLabel = `${label}[${index}]`;
      const itemPath = `${path}[${index}]`;
      if (normalizeType(schema.items as JsonSchema) === 'object') {
        if (!isRecord(item)) {
          errors.push(createValidationError(itemLabel, 'Must be an object', itemPath));
          return;
        }
        errors.push(...normalizeSettings(schema.items, item, [itemPath]).errors);
        return;
      }
      errors.push(...validateLeafValue(schema.items as JsonSchema, item, itemLabel, itemPath));
    });
  }

  return errors;
}

function isValidStringFormat(format: string | undefined, value: string): boolean {
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

function createValidationError(
  label: string,
  message: string,
  path: string = label,
  code?: string,
): SettingsValidationError {
  return { code, label, path, message };
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

export function formatSettingsValidationErrors(
  errors: SettingsValidationError[],
  t: (key: string) => unknown,
): string[] {
  return errors.map((error) => `${error.path || error.label}: ${String(t(error.message))}`);
}

function updateAtPath(root: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  if (path.length === 0) {
    return root;
  }

  const next = { ...root };
  let cursor = next;
  for (const key of path.slice(0, -1)) {
    const child = isRecord(cursor[key]) ? { ...(cursor[key] as Record<string, unknown>) } : {};
    cursor[key] = child;
    cursor = child;
  }
  cursor[path[path.length - 1]] = value;
  return next;
}

function deepMergeRecords(
  defaults: Record<string, unknown>,
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const next = cloneRecord(defaults);
  for (const [key, value] of Object.entries(overrides)) {
    next[key] = isRecord(next[key]) && isRecord(value) ? deepMergeRecords(next[key], value) : cloneJsonValue(value);
  }
  return next;
}

function replaceValueAtPath(root: Record<string, unknown>, path: string[], value: unknown): Record<string, unknown> {
  return updateAtPath(cloneRecord(root), path, cloneJsonValue(value));
}

function normalizeFieldPath(fieldPath: string[] | string | undefined, fieldName: string): string[] {
  const path = Array.isArray(fieldPath)
    ? fieldPath.filter((segment): segment is string => typeof segment === 'string' && Boolean(segment))
    : typeof fieldPath === 'string'
      ? fieldPath.split('.').filter(Boolean)
      : [];
  return path.length > 0 ? path : [fieldName];
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

export function normalizeSettingsForSchema(schema: unknown, value: unknown): SettingsValidationResult {
  const rootSchema = asSchema(schema);
  const result = normalizeSettings(rootSchema, value);
  const normalizedValue = normalizeAdvancedSelectorValues(rootSchema, result.value, result.value);
  if (JSON.stringify(normalizedValue) === JSON.stringify(result.value)) {
    return result;
  }
  const normalizedResult = normalizeSettings(rootSchema, normalizedValue);

  return {
    ...normalizedResult,
    value: normalizeAdvancedSelectorValues(rootSchema, normalizedResult.value, normalizedResult.value),
  };
}

export function serializeDatePickerValue(schema: JsonSchema, value: Dayjs | null): string | undefined {
  if (!value) {
    return undefined;
  }
  return schema.format === 'date' ? value.format('YYYY-MM-DD') : value.toISOString();
}

export const SettingsAutoForm: React.FC<SettingsAutoFormProps> = ({ schema, value, onChange, disabled }) => {
  const { t } = useTranslation(NAMESPACE);
  const rootSchema = React.useMemo(() => asSchema(schema), [schema]);
  const current = React.useMemo(() => normalizeSettingsForSchema(rootSchema, value).value, [rootSchema, value]);
  const validation = React.useMemo(() => normalizeSettingsForSchema(rootSchema, current), [rootSchema, current]);
  const lastReportedRef = React.useRef<string>();
  const validationErrors = React.useMemo(
    () => formatSettingsValidationErrors(validation.errors, t),
    [t, validation.errors],
  );

  React.useEffect(() => {
    const normalizedValue = isRecord(value) ? value : {};
    const valueChanged = JSON.stringify(current) !== JSON.stringify(normalizedValue);
    const reportKey = JSON.stringify({
      value: current,
      errors: validation.errors,
    });
    if (!valueChanged && lastReportedRef.current === reportKey) {
      return;
    }
    lastReportedRef.current = reportKey;
    onChange?.(current, validation);
  }, [current, onChange, validation, value]);

  if (!rootSchema.properties || Object.keys(rootSchema.properties).length === 0) {
    return <Alert type="info" showIcon message={t('No settings')} />;
  }

  const handleChange = (path: string[], nextValue: unknown) => {
    const next = updateAtPath(current, path, nextValue);
    onChange?.(next, normalizeSettingsForSchema(rootSchema, next));
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {validation.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={t('Settings validation failed')}
          description={validationErrors.join('\n')}
        />
      ) : null}
      {Object.entries(rootSchema.properties).map(([key, childSchema]) => (
        <SettingsField
          key={key}
          path={[key]}
          rootValue={current}
          scopeValues={[current]}
          schema={childSchema}
          value={current[key]}
          onChange={handleChange}
          disabled={disabled}
        />
      ))}
    </Space>
  );
};

export const SettingsSingleField: React.FC<SettingsSingleFieldProps> = ({
  fieldName = 'value',
  fieldPath,
  fieldSchema,
  rootSchema,
  savedRootValue,
  descriptorDefaults,
  required,
  value,
  onChange,
  disabled,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const schema = React.useMemo(() => asSchema(fieldSchema), [fieldSchema]);
  const resolvedFieldPath = React.useMemo(() => normalizeFieldPath(fieldPath, fieldName), [fieldName, fieldPath]);
  const validationSchema = React.useMemo(
    () => ({
      type: 'object',
      required: required ? [fieldName] : [],
      properties: {
        [fieldName]: schema,
      },
    }),
    [fieldName, required, schema],
  );
  const fieldDraftValue = React.useMemo(() => cloneJsonValue(value), [value]);
  const validation = React.useMemo(
    () => normalizeSettingsForSchema(validationSchema, { [fieldName]: fieldDraftValue }),
    [fieldDraftValue, fieldName, validationSchema],
  );
  const candidateRootValue = React.useMemo(() => {
    const schemaDefaults = getObjectDefaults(asSchema(rootSchema));
    const defaults = deepMergeRecords(schemaDefaults, cloneRecord(descriptorDefaults));
    const saved = deepMergeRecords(defaults, cloneRecord(savedRootValue));
    return replaceValueAtPath(saved, resolvedFieldPath, fieldDraftValue);
  }, [descriptorDefaults, fieldDraftValue, resolvedFieldPath, rootSchema, savedRootValue]);
  const lastReportedRef = React.useRef<string>();
  const validationErrors = React.useMemo(
    () => formatSettingsValidationErrors(validation.errors, t),
    [t, validation.errors],
  );

  React.useEffect(() => {
    const reportKey = JSON.stringify({
      value: fieldDraftValue,
      errors: validation.errors,
    });
    if (lastReportedRef.current === reportKey) {
      return;
    }
    lastReportedRef.current = reportKey;
    onChange?.(cloneJsonValue(fieldDraftValue), validation);
  }, [fieldDraftValue, onChange, validation]);

  const handleChange = (path: string[], nextValue: unknown) => {
    const nextCandidateRoot = updateAtPath(candidateRootValue, path, nextValue);
    const nextFieldValue = getValueAtPath(nextCandidateRoot, resolvedFieldPath);
    const nextValidation = normalizeSettingsForSchema(validationSchema, { [fieldName]: nextFieldValue });
    onChange?.(cloneJsonValue(nextFieldValue), nextValidation);
  };

  const fieldRecord = isRecord(fieldDraftValue) ? fieldDraftValue : {};
  const scopeValues = [fieldRecord, candidateRootValue];
  const content =
    normalizeType(schema) === 'object' ? (
      Object.entries(schema.properties || {}).map(([key, childSchema]) => (
        <SettingsField
          key={key}
          path={[...resolvedFieldPath, key]}
          rootValue={candidateRootValue}
          scopeValues={scopeValues}
          schema={childSchema}
          value={fieldRecord[key]}
          onChange={handleChange}
          disabled={disabled}
        />
      ))
    ) : (
      <SettingsField
        path={resolvedFieldPath}
        rootValue={candidateRootValue}
        scopeValues={scopeValues}
        schema={schema}
        value={fieldDraftValue}
        onChange={handleChange}
        disabled={disabled}
      />
    );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {validation.errors.length > 0 ? (
        <Alert
          type="error"
          showIcon
          message={t('Settings validation failed')}
          description={validationErrors.join('\n')}
        />
      ) : null}
      {content}
    </Space>
  );
};

interface SettingsFieldProps {
  path: string[];
  rootValue: Record<string, unknown>;
  scopeValues: Array<Record<string, unknown>>;
  schema: JsonSchema;
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
  disabled?: boolean;
}

const SettingsField: React.FC<SettingsFieldProps> = ({
  path,
  rootValue,
  scopeValues,
  schema,
  value,
  onChange,
  disabled,
}) => {
  const label = schema.title || path[path.length - 1];
  const description = schema.description;
  const type = normalizeType(schema);
  const condition = schema['x-visible-when'];

  if (condition && !isSettingsFieldVisible(condition, { settings: rootValue })) {
    return null;
  }

  if (type === 'object') {
    const record = isRecord(value) ? value : {};
    return (
      <div>
        <Divider orientation="left" plain>
          {label}
        </Divider>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {Object.entries(schema.properties || {}).map(([key, childSchema]) => (
            <SettingsField
              key={key}
              path={[...path, key]}
              rootValue={rootValue}
              scopeValues={[record, ...scopeValues]}
              schema={childSchema}
              value={record[key]}
              onChange={onChange}
              disabled={disabled}
            />
          ))}
        </Space>
      </div>
    );
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={4}>
      <Typography.Text>{label}</Typography.Text>
      {renderLeafInput({ path, rootValue, scopeValues, schema, value, onChange, disabled })}
      {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
    </Space>
  );
};

function renderLeafInput(props: SettingsFieldProps) {
  const { path, rootValue, scopeValues, schema, value, onChange, disabled } = props;
  const component = schema['x-component'];
  const type = normalizeType(schema);

  if (
    component === 'CollectionSelect' ||
    component === 'CollectionFieldSelect' ||
    component === 'RoleSelect' ||
    component === 'DataSourceSelect'
  ) {
    return (
      <SettingsAdvancedSelect
        component={component}
        disabled={disabled}
        onChange={(next) => onChange(path, next)}
        rootValue={rootValue}
        scopeValues={scopeValues}
        schema={schema}
        value={value}
      />
    );
  }

  if (schema.enum && schema.enum.every(isPrimitiveSelectValue)) {
    const options = schema.enum.map((item) => ({
      label: String(item),
      value: item as string | number | boolean,
    }));
    if (component === 'Radio.Group') {
      return (
        <Radio.Group
          disabled={disabled}
          options={options}
          value={value}
          onChange={(event) => onChange(path, event.target.value)}
        />
      );
    }
    return <Select disabled={disabled} options={options} value={value} onChange={(next) => onChange(path, next)} />;
  }

  if (schema.enum && !schema.enum.every(isPrimitiveSelectValue)) {
    return (
      <Input.TextArea
        disabled={disabled}
        value={value === undefined ? '' : JSON.stringify(value, null, 2)}
        autoSize={{ minRows: 3, maxRows: 8 }}
        onChange={(event) => {
          try {
            onChange(path, event.target.value ? JSON.parse(event.target.value) : undefined);
          } catch {
            onChange(path, event.target.value);
          }
        }}
      />
    );
  }

  if (type === 'boolean') {
    if (component === 'Checkbox') {
      return (
        <Checkbox
          disabled={disabled}
          checked={Boolean(value)}
          onChange={(event) => onChange(path, event.target.checked)}
        />
      );
    }
    return <Switch disabled={disabled} checked={Boolean(value)} onChange={(checked) => onChange(path, checked)} />;
  }

  if (type === 'number' || type === 'integer') {
    return (
      <InputNumber
        disabled={disabled}
        style={{ width: '100%' }}
        value={typeof value === 'number' ? value : undefined}
        min={schema.minimum}
        max={schema.maximum}
        step={type === 'integer' ? 1 : undefined}
        precision={type === 'integer' ? 0 : undefined}
        onChange={(next) => onChange(path, typeof next === 'number' ? next : undefined)}
      />
    );
  }

  if (type === 'array') {
    return (
      <Input.TextArea
        disabled={disabled}
        value={value === undefined ? '' : JSON.stringify(value, null, 2)}
        autoSize={{ minRows: 3, maxRows: 8 }}
        onChange={(event) => {
          try {
            onChange(path, event.target.value ? JSON.parse(event.target.value) : undefined);
          } catch {
            onChange(path, event.target.value);
          }
        }}
      />
    );
  }

  if (schema.format === 'date' || schema.format === 'date-time' || component === 'DatePicker') {
    const dateValue = typeof value === 'string' && value ? dayjs(value) : undefined;
    return (
      <DatePicker
        disabled={disabled}
        style={{ width: '100%' }}
        showTime={schema.format === 'date-time'}
        value={dateValue}
        onChange={(next) => onChange(path, serializeDatePickerValue(schema, next))}
      />
    );
  }

  if (component === 'ColorPicker') {
    return (
      <ColorPicker
        disabled={disabled}
        showText
        value={typeof value === 'string' ? value : undefined}
        onChange={(_color, hex) => onChange(path, hex)}
      />
    );
  }

  if (component === 'Input.TextArea') {
    return (
      <Input.TextArea
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        autoSize={{ minRows: 2, maxRows: 6 }}
        onChange={(event) => onChange(path, event.target.value)}
      />
    );
  }

  return (
    <Input
      disabled={disabled}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(path, event.target.value)}
    />
  );
}

function isPrimitiveSelectValue(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

type AdvancedComponentName = 'CollectionSelect' | 'CollectionFieldSelect' | 'RoleSelect' | 'DataSourceSelect';

type SettingsSelectOption = NonNullable<SelectProps<string>['options']>[number];

interface SettingsAdvancedSelectProps {
  component: AdvancedComponentName;
  schema: JsonSchema;
  rootValue: Record<string, unknown>;
  scopeValues: Array<Record<string, unknown>>;
  value: unknown;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

interface SettingsDataSourceManager {
  getDataSources?: () => SettingsDataSource[];
  getDataSource?: (key: string) => SettingsDataSource | undefined;
}

interface SettingsDataSource {
  key?: string;
  name?: string;
  displayName?: string;
  getCollections?: () => SettingsCollection[];
  getCollection?: (name: string) => SettingsCollection | undefined;
}

interface SettingsCollection {
  name?: string;
  title?: string;
  hidden?: boolean;
  getFields?: () => SettingsCollectionField[];
}

interface SettingsCollectionField {
  name?: string;
  title?: string;
  hidden?: boolean;
}

interface SettingsApplicationLike {
  apiClient?: SettingsApiClient;
  dataSourceManager?: SettingsDataSourceManager;
  flowEngine?: {
    context?: {
      user?: {
        roles?: SettingsRole[];
      };
      t?: (key: string) => string;
    };
  };
}

interface SettingsRole {
  name?: string;
  title?: string;
}

interface SettingsApiClient {
  resource?: (name: string) => SettingsApiResource | undefined;
}

interface SettingsApiResource {
  list?: (params?: Record<string, unknown>) => Promise<unknown>;
}

const SettingsAdvancedSelect: React.FC<SettingsAdvancedSelectProps> = ({
  component,
  disabled,
  onChange,
  rootValue,
  scopeValues,
  schema,
  value,
}) => {
  const { t } = useTranslation(NAMESPACE);
  const app = React.useContext(ApplicationContext) as SettingsApplicationLike | null;
  const [systemRoles, setSystemRoles] = React.useState<SettingsRole[]>([]);
  const selectedCollectionName =
    component === 'CollectionFieldSelect' ? resolveCollectionName(schema, rootValue, scopeValues) : undefined;
  React.useEffect(() => {
    if (component !== 'RoleSelect') {
      return undefined;
    }
    const roleResource = app?.apiClient?.resource?.('roles');
    if (!roleResource?.list) {
      setSystemRoles([]);
      return undefined;
    }
    let ignore = false;
    roleResource
      .list({
        appends: [],
        filter: { 'name.$ne': 'root' },
        paginate: false,
        showAnonymous: true,
        sort: ['createdAt'],
      })
      .then((response) => {
        if (!ignore) {
          setSystemRoles(parseRoleListResponse(response));
        }
      })
      .catch(() => {
        if (!ignore) {
          setSystemRoles([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, [app, component]);
  const options = React.useMemo(
    () => buildAdvancedSelectOptions({ app, component, rootValue, scopeValues, schema, systemRoles }),
    [app, component, rootValue, scopeValues, schema, systemRoles],
  );
  const isFieldSelectWaitingForCollection = component === 'CollectionFieldSelect' && !selectedCollectionName;

  return (
    <Select
      allowClear
      disabled={disabled || isFieldSelectWaitingForCollection}
      optionFilterProp="label"
      options={options}
      placeholder={getAdvancedSelectPlaceholder(component, t)}
      showSearch
      style={{ width: '100%' }}
      value={normalizeAdvancedSelectValue(component, value, selectedCollectionName)}
      onChange={(next) => onChange(next)}
    />
  );
};

function buildAdvancedSelectOptions(input: {
  app: SettingsApplicationLike | null;
  component: AdvancedComponentName;
  rootValue: Record<string, unknown>;
  scopeValues: Array<Record<string, unknown>>;
  schema: JsonSchema;
  systemRoles: SettingsRole[];
}): SettingsSelectOption[] {
  const dataSourceManager = input.app?.dataSourceManager;
  if (input.component === 'DataSourceSelect') {
    return getDataSources(dataSourceManager).map((dataSource) => ({
      label: dataSource.displayName || dataSource.key || dataSource.name || '',
      value: dataSource.key || dataSource.name || '',
    }));
  }
  if (input.component === 'RoleSelect') {
    const translate = input.app?.flowEngine?.context?.t;
    return mergeRoleOptions(input.systemRoles, input.app?.flowEngine?.context?.user?.roles || [])
      .filter((role) => role.name && role.name !== '__union__')
      .map((role) => ({
        label: role.title ? translate?.(role.title) || role.title : role.name || '',
        value: role.name || '',
      }));
  }

  const selectedDataSourceKey = resolveDataSourceKey(
    input.schema,
    input.rootValue,
    input.scopeValues,
    dataSourceManager,
  );
  const selectedDataSource = getSelectedDataSource(dataSourceManager, selectedDataSourceKey);
  if (input.component === 'CollectionSelect') {
    return getCollections(selectedDataSource)
      .filter((collection) => !collection.hidden)
      .map((collection) => ({
        label: collection.title || collection.name || '',
        value: collection.name || '',
      }));
  }

  const selectedCollectionName = resolveCollectionName(input.schema, input.rootValue, input.scopeValues);
  const selectedCollection = selectedCollectionName
    ? selectedDataSource?.getCollection?.(selectedCollectionName)
    : undefined;
  if (selectedCollection) {
    return getFields(selectedCollection).map((field) => ({
      label: field.title || field.name || '',
      value: field.name || '',
    }));
  }

  return [];
}

function getAdvancedSelectPlaceholder(component: AdvancedComponentName, t: (key: string) => unknown): string {
  if (component === 'CollectionSelect') {
    return String(t('Select collection'));
  }
  if (component === 'CollectionFieldSelect') {
    return String(t('Select collection field'));
  }
  if (component === 'RoleSelect') {
    return String(t('Select role'));
  }
  return String(t('Select data source'));
}

function resolveDataSourceKey(
  schema: JsonSchema,
  rootValue: Record<string, unknown>,
  scopeValues: Array<Record<string, unknown>>,
  dataSourceManager?: SettingsDataSourceManager,
): string | undefined {
  const componentProps = isRecord(schema['x-component-props']) ? schema['x-component-props'] : {};
  const explicitDataSource = toNonEmptyString(componentProps.dataSource);
  if (explicitDataSource) {
    return explicitDataSource;
  }
  const dataSourceField = toNonEmptyString(componentProps.dataSourceField) || 'dataSource';
  const dataSourceFromField = resolveSettingsFieldReference(dataSourceField, rootValue, scopeValues);
  if (dataSourceFromField) {
    return dataSourceFromField;
  }
  const dataSources = getDataSources(dataSourceManager);
  return dataSources.length === 1 ? dataSources[0].key || dataSources[0].name : undefined;
}

function resolveCollectionName(
  schema: JsonSchema,
  rootValue: Record<string, unknown>,
  scopeValues: Array<Record<string, unknown>>,
): string | undefined {
  const componentProps = isRecord(schema['x-component-props']) ? schema['x-component-props'] : {};
  const explicitCollection =
    toNonEmptyString(componentProps.collection) || toNonEmptyString(componentProps.collectionName);
  if (explicitCollection) {
    return explicitCollection;
  }
  const collectionField = toNonEmptyString(componentProps.collectionField) || 'collection';
  return resolveSettingsFieldReference(collectionField, rootValue, scopeValues);
}

function normalizeAdvancedSelectorValues(
  schema: JsonSchema,
  value: Record<string, unknown>,
  rootValue: Record<string, unknown>,
  scopeValues: Array<Record<string, unknown>> = [rootValue],
): Record<string, unknown> {
  const next = { ...value };
  for (const [key, childSchema] of Object.entries(schema.properties || {})) {
    const childValue = next[key];
    if (normalizeType(childSchema) === 'object' && isRecord(childValue)) {
      next[key] = normalizeAdvancedSelectorValues(childSchema, childValue, rootValue, [childValue, ...scopeValues]);
      continue;
    }
    if (childSchema['x-component'] !== 'CollectionFieldSelect' || typeof childValue !== 'string') {
      continue;
    }
    const selectedCollectionName = resolveCollectionName(childSchema, rootValue, [next, ...scopeValues]);
    const normalizedFieldName = normalizeCollectionFieldValue(childValue, selectedCollectionName);
    if (normalizedFieldName !== childValue) {
      next[key] = normalizedFieldName;
    }
  }
  return next;
}

function normalizeAdvancedSelectValue(
  component: AdvancedComponentName,
  value: unknown,
  selectedCollectionName?: string,
): string | undefined {
  if (component === 'CollectionFieldSelect' && typeof value === 'string') {
    return normalizeCollectionFieldValue(value, selectedCollectionName);
  }
  return typeof value === 'string' ? value : undefined;
}

function normalizeCollectionFieldValue(value: string, selectedCollectionName?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const prefix = selectedCollectionName ? `${selectedCollectionName}.` : '';
  if (prefix && value.startsWith(prefix)) {
    return value.slice(prefix.length) || undefined;
  }
  return value.includes('.') ? undefined : value;
}

function resolveSettingsFieldReference(
  fieldReference: string,
  rootValue: Record<string, unknown>,
  scopeValues: Array<Record<string, unknown>>,
): string | undefined {
  if (fieldReference.includes('.')) {
    return toNonEmptyString(getValueAtPath(rootValue, fieldReference.split('.')));
  }
  for (const scopeValue of scopeValues) {
    const value = toNonEmptyString(scopeValue[fieldReference]);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function mergeRoleOptions(systemRoles: SettingsRole[], fallbackRoles: SettingsRole[]): SettingsRole[] {
  const byName = new Map<string, SettingsRole>();
  for (const role of [...systemRoles, ...fallbackRoles]) {
    if (role.name && !byName.has(role.name)) {
      byName.set(role.name, role);
    }
  }
  return Array.from(byName.values());
}

function parseRoleListResponse(response: unknown): SettingsRole[] {
  const responseData = isRecord(response) ? response.data : undefined;
  const payload = isRecord(responseData) ? responseData.data : responseData;
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload.filter(isSettingsRole);
}

function isSettingsRole(value: unknown): value is SettingsRole {
  return isRecord(value) && typeof value.name === 'string';
}

function getValueAtPath(root: Record<string, unknown>, path: string[]): unknown {
  let cursor: unknown = root;
  for (const segment of path) {
    if (!isRecord(cursor)) {
      return undefined;
    }
    cursor = cursor[segment];
  }
  return cursor;
}

function getSelectedDataSource(
  dataSourceManager: SettingsDataSourceManager | undefined,
  dataSourceKey: string | undefined,
): SettingsDataSource | undefined {
  if (dataSourceKey) {
    return dataSourceManager?.getDataSource?.(dataSourceKey);
  }
  const dataSources = getDataSources(dataSourceManager);
  return dataSources[0];
}

function getDataSources(dataSourceManager?: SettingsDataSourceManager): SettingsDataSource[] {
  return dataSourceManager?.getDataSources?.() || [];
}

function getCollections(dataSource?: SettingsDataSource): SettingsCollection[] {
  return dataSource?.getCollections?.() || [];
}

function getFields(collection: SettingsCollection): SettingsCollectionField[] {
  return (collection.getFields?.() || []).filter((field) => !field.hidden);
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

export default SettingsAutoForm;
