/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/json-schema';
import type {
  RunJSSettingField,
  RunJSSettingsSchema,
  RunJSSettingsUISchemaOptions,
  RunJSSettingsUISchemaResult,
} from './types';
import { activeFieldKeys } from './values';

function baseSchema(field: RunJSSettingField): ISchema {
  return {
    title: field.title,
    description: field.description,
    required: field.required,
    'x-decorator': 'FormItem',
    'x-component-props': {
      disabled: field.disabled,
      placeholder: field.placeholder,
    },
  };
}

function withProps(schema: ISchema, props: Record<string, unknown>): ISchema {
  return {
    ...schema,
    'x-component-props': {
      ...(schema['x-component-props'] || {}),
      ...props,
    },
  };
}

function mapField(field: RunJSSettingField): ISchema {
  const schema = baseSchema(field);
  switch (field.type) {
    case 'string':
      return { ...schema, type: 'string', 'x-component': 'Input' };
    case 'text':
      return withProps({ ...schema, type: 'string', 'x-component': 'Input.TextArea' }, { autoSize: { minRows: 3 } });
    case 'number':
      return withProps(
        { ...schema, type: 'number', 'x-component': field.ui === 'slider' ? 'Slider' : 'NumberPicker' },
        {
          min: field.min,
          max: field.max,
          step: field.step,
        },
      );
    case 'boolean':
      return { ...schema, type: 'boolean', 'x-component': 'Switch' };
    case 'select':
      return withProps({ ...schema, 'x-component': 'Select' }, { options: field.options || [] });
    case 'multiSelect':
      return withProps(
        { ...schema, type: 'array', 'x-component': 'Select' },
        { mode: 'multiple', options: field.options || [] },
      );
    case 'date':
      return withProps(
        { ...schema, type: 'string', 'x-component': 'RunJSSettingsDatePicker' },
        { format: 'YYYY-MM-DD' },
      );
    case 'datetime':
      return withProps({ ...schema, type: 'string', 'x-component': 'RunJSSettingsDateTimePicker' }, { showTime: true });
    case 'color':
      return { ...schema, type: 'string', 'x-component': 'RunJSSettingsColorPicker' };
    case 'json':
      return withProps({ ...schema, 'x-component': 'RunJSSettingsJSONTextArea' }, { autoSize: { minRows: 6 } });
    case 'dataSource':
      return { ...schema, 'x-component': 'RunJSSettingsDataSourceSelect' };
    case 'collection':
      return withProps({ ...schema, 'x-component': 'RunJSSettingsCollectionSelect' }, { dataSource: field.dataSource });
    case 'collectionField':
      return withProps(
        { ...schema, 'x-component': 'RunJSSettingsCollectionFieldSelect' },
        { collection: field.collection, fieldTypes: field.fieldTypes },
      );
    default:
      return { ...schema, 'x-component': 'Input' };
  }
}

export function toFlowUISchema(
  schema: RunJSSettingsSchema,
  options: RunJSSettingsUISchemaOptions = {},
): RunJSSettingsUISchemaResult {
  const properties: RunJSSettingsUISchemaResult = {};
  const keys = options.fieldKeys?.length
    ? options.fieldKeys.filter((key) => !!schema.fields[key] && schema.fields[key]?.visible !== false)
    : activeFieldKeys(schema);
  for (const key of keys) {
    properties[key] = mapField(schema.fields[key]);
  }
  return properties;
}
