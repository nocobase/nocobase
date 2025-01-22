/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DEFAULT_DATA_SOURCE_KEY, VariablesContextType } from '@nocobase/client';
import { moment2str } from '@nocobase/utils/client';
import dayjs from 'dayjs';
import { Schema } from '@formily/react';

export const getOptionsSchema = () => {
  const options = {
    title: '{{t("Options")}}',
    type: 'array',
    'x-decorator': 'FormItem',
    'x-component': 'ArrayItems',
    items: {
      type: 'object',
      'x-decorator': 'ArrayItems.Item',
      properties: {
        space: {
          type: 'void',
          'x-component': 'Space',
          properties: {
            label: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{t("Option label")}}',
              },
              required: true,
            },
            value: {
              type: 'string',
              'x-decorator': 'FormItem',
              'x-component': 'Input',
              'x-component-props': {
                placeholder: '{{t("Option value")}}',
              },
              required: true,
            },
            remove: {
              type: 'void',
              'x-decorator': 'FormItem',
              'x-component': 'ArrayItems.Remove',
            },
          },
        },
      },
    },
    properties: {
      add: {
        type: 'void',
        title: 'Add',
        'x-component': 'ArrayItems.Addition',
      },
    },
  };
  return options;
};

export const getPropsSchemaByComponent = (component: string) => {
  const showTime = {
    type: 'boolean',
    'x-content': '{{ t("Show time") }}',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
  };
  const dateFormat = {
    type: 'string',
    title: '{{t("Date format")}}',
    'x-component': 'Radio.Group',
    'x-decorator': 'FormItem',
    default: 'YYYY-MM-DD',
    enum: [
      {
        label: '{{t("Year/Month/Day")}}',
        value: 'YYYY/MM/DD',
      },
      {
        label: '{{t("Year-Month-Day")}}',
        value: 'YYYY-MM-DD',
      },
      {
        label: '{{t("Day/Month/Year")}}',
        value: 'DD/MM/YYYY',
      },
    ],
  };
  const options = getOptionsSchema();
  const propsSchema = {
    DatePicker: {
      type: 'object',
      properties: {
        dateFormat,
        showTime,
      },
    },
    'DatePicker.RangePicker': {
      type: 'object',
      properties: {
        dateFormat,
        showTime,
      },
    },
    Select: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: [
            {
              label: '{{ t("Single select") }}',
              value: '',
            },
            {
              label: '{{ t("Multiple select") }}',
              value: 'multiple',
            },
          ],
          'x-decorator': 'FormItem',
          'x-component': 'Radio.Group',
          'x-component-props': {
            defaultValue: '',
          },
        },
        options,
      },
    },
    'Checkbox.Group': {
      type: 'object',
      properties: {
        options,
      },
    },
    'Radio.Group': {
      type: 'object',
      properties: {
        options,
      },
    },
  };
  return propsSchema[component];
};

export const transformValue = (value: any, props: any) => {
  if (!value) {
    return value;
  }
  if (dayjs.isDayjs(value)) {
    if (!props.showTime) {
      value = value.startOf('day');
    }
    return moment2str(value, props);
  }
  if (Array.isArray(value) && value.length && dayjs.isDayjs(value[0])) {
    let start = value[0];
    let end = value[1];
    if (props.showTime) {
      start = start.startOf('day');
      end = end.endOf('day');
    }
    return [start.toISOString(), end.toISOString()];
  }
  return value;
};

export const setDefaultValue = async (field: any, variablesCtx: VariablesContextType, localVariables?: any) => {
  const defaultValue = field.initialValue;
  const isVariable =
    typeof defaultValue === 'string' && defaultValue?.startsWith('{{$') && defaultValue?.endsWith('}}');
  if (!isVariable || !variablesCtx) {
    field.setValue(defaultValue);
    field.setInitialValue(defaultValue);
  } else {
    field.loading = true;
    const { value } = await variablesCtx.parseVariable(defaultValue, localVariables);
    const transformedValue = transformValue(value, field.componentProps);
    field.setValue(transformedValue);
    field.setInitialValue(transformedValue);
    field.loading = false;
  }
};

export const FILTER_FIELD_PREFIX_SEPARATOR = '-';

export const getFilterFieldPrefix = (dataSource: string, fieldName: string) => {
  return dataSource ? `${dataSource}${FILTER_FIELD_PREFIX_SEPARATOR}${fieldName}` : fieldName;
};

// [dataSource-]collection.fieldName.associateName
export const parseFilterFieldName = (name: string) => {
  const [prefix, fieldName] = name.split(FILTER_FIELD_PREFIX_SEPARATOR);
  if (fieldName) {
    return { dataSource: prefix, fieldName };
  }
  return { dataSource: DEFAULT_DATA_SOURCE_KEY, fieldName: prefix };
};

export const findSchema = (schema: Schema, key: string, targetName: string) => {
  if (!Schema.isSchemaInstance(schema)) return null;
  return schema.reduceProperties((buf, s) => {
    let fieldName = s[key];
    if (!fieldName.includes(FILTER_FIELD_PREFIX_SEPARATOR)) {
      fieldName = `${DEFAULT_DATA_SOURCE_KEY}${FILTER_FIELD_PREFIX_SEPARATOR}${fieldName}`;
    }
    if (fieldName === targetName) {
      return s;
    }
    if (s['x-component'] !== 'Action.Container' && s['x-component'] !== 'AssociationField.Viewer') {
      const c = findSchema(s, key, targetName);
      if (c) {
        return c;
      }
    }

    return buf;
  });
};
