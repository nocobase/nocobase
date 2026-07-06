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
};

export type SettingsValidationError = {
  label: string;
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
  if (isRecord(schema.default)) {
    return { ...schema.default };
  }
  if (!schema.properties) {
    return {};
  }

  const defaults: Record<string, unknown> = {};
  for (const [key, childSchema] of Object.entries(schema.properties)) {
    if (childSchema.default !== undefined) {
      defaults[key] = childSchema.default;
    } else if (normalizeType(childSchema) === 'object') {
      defaults[key] = getObjectDefaults(childSchema);
    }
  }
  return defaults;
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

  for (const [key, childSchema] of Object.entries(schema.properties || {})) {
    const childPath = [...path, key];
    const label = childSchema.title || childPath.join('.');
    const childType = normalizeType(childSchema);
    const hasRawChild = Object.prototype.hasOwnProperty.call(rawRecord, key);
    const hasDefaultChild = Object.prototype.hasOwnProperty.call(next, key);
    const rawChild = hasRawChild ? rawRecord[key] : next[key];

    if (required.has(key) && !hasDefaultChild && (!hasRawChild || rawChild === undefined)) {
      errors.push(createValidationError(label, 'Required'));
      next[key] = rawChild;
      continue;
    }

    if (childType === 'object') {
      if (rawChild !== undefined && !isRecord(rawChild)) {
        next[key] = rawChild;
        errors.push(createValidationError(label, 'Must be an object'));
        continue;
      }
      const childResult = normalizeSettings(childSchema, rawChild, childPath);
      next[key] = childResult.value;
      errors.push(...childResult.errors);
      continue;
    }

    const value = normalizePrimitiveValue(childSchema, rawChild);
    next[key] = value;
    errors.push(...validateLeafValue(childSchema, value, label));
  }

  return {
    value: next,
    errors,
  };
}

function validateLeafValue(schema: JsonSchema, value: unknown, label: string): SettingsValidationError[] {
  const errors: SettingsValidationError[] = [];
  const type = normalizeType(schema);

  if (value === undefined) {
    return errors;
  }

  if (type === 'string' && typeof value !== 'string') {
    errors.push(createValidationError(label, 'Must be a string'));
  }
  if ((type === 'number' || type === 'integer') && typeof value !== 'number') {
    errors.push(createValidationError(label, 'Must be a number'));
  }
  if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
    errors.push(createValidationError(label, 'Must be an integer'));
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    errors.push(createValidationError(label, 'Must be a boolean'));
  }
  if (type === 'array' && !Array.isArray(value)) {
    errors.push(createValidationError(label, 'Must be an array'));
  }
  if (schema.enum && !schema.enum.some((item) => stableSerialize(item) === stableSerialize(value))) {
    errors.push(createValidationError(label, 'Must be one of the allowed values'));
  }
  if (typeof value === 'string') {
    if (typeof schema.minLength === 'number' && value.length < schema.minLength) {
      errors.push(createValidationError(label, 'Too short'));
    }
    if (typeof schema.maxLength === 'number' && value.length > schema.maxLength) {
      errors.push(createValidationError(label, 'Too long'));
    }
    if (!isValidStringFormat(schema.format, value)) {
      errors.push(createValidationError(label, 'Must match the required format'));
    }
  }
  if (typeof value === 'number') {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(createValidationError(label, 'Too small'));
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(createValidationError(label, 'Too large'));
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => {
      const itemLabel = `${label}[${index}]`;
      if (normalizeType(schema.items as JsonSchema) === 'object') {
        if (!isRecord(item)) {
          errors.push(createValidationError(itemLabel, 'Must be an object'));
          return;
        }
        errors.push(...normalizeSettings(schema.items, item, [itemLabel]).errors);
        return;
      }
      errors.push(...validateLeafValue(schema.items as JsonSchema, item, itemLabel));
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

function createValidationError(label: string, message: string): SettingsValidationError {
  return { label, message };
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
  return errors.map((error) => `${error.label}: ${String(t(error.message))}`);
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

export function normalizeSettingsForSchema(schema: unknown, value: unknown): SettingsValidationResult {
  return normalizeSettings(schema, value);
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
          schema={childSchema}
          value={current[key]}
          onChange={handleChange}
          disabled={disabled}
        />
      ))}
    </Space>
  );
};

interface SettingsFieldProps {
  path: string[];
  schema: JsonSchema;
  value: unknown;
  onChange: (path: string[], value: unknown) => void;
  disabled?: boolean;
}

const SettingsField: React.FC<SettingsFieldProps> = ({ path, schema, value, onChange, disabled }) => {
  const label = schema.title || path[path.length - 1];
  const description = schema.description;
  const type = normalizeType(schema);

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
      {renderLeafInput({ path, schema, value, onChange, disabled })}
      {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
    </Space>
  );
};

function renderLeafInput(props: SettingsFieldProps) {
  const { path, schema, value, onChange, disabled } = props;
  const component = schema['x-component'];
  const type = normalizeType(schema);

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

export default SettingsAutoForm;
