/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaProperties } from '@formily/react';
import { lang } from '../locale';

export type FieldConfigProps = Partial<{
  name: string;
  title: string;
  required: boolean;
  defaultValue: any;
  description: string;
  options: { label: string; value: any }[];
  componentProps: Record<string, any>;
}>;

export type AnySchemaProperties = SchemaProperties<any, any, any, any, any, any, any, any>;
export type ConfigType =
  | (FieldConfigProps & { configType?: string })
  | ((props?: FieldConfigProps) => AnySchemaProperties)
  | AnySchemaProperties;

export type Config = string | ConfigType;

const field = ({ name, title, required, defaultValue, description }: FieldConfigProps) => {
  return {
    [name]: {
      title: lang(title),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required,
      description,
      default: defaultValue,
    },
  };
};

const select = ({ name, title, required, defaultValue, options, description }: FieldConfigProps) => {
  return {
    [name]: {
      title: lang(title),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      required,
      default: defaultValue,
      description,
      enum: options,
    },
  };
};

const boolean = ({ name, title, defaultValue = false, description }: FieldConfigProps) => {
  return {
    [name]: {
      'x-content': lang(title),
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: defaultValue,
      description,
    },
  };
};

const radio = ({ name, title, defaultValue, options, description, componentProps }: FieldConfigProps) => {
  return {
    [name]: {
      title: lang(title),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      'x-component-props': {
        ...componentProps,
      },
      default: defaultValue,
      description,
      enum: options,
    },
  };
};

const percent = ({ name, title, defaultValue, description }: FieldConfigProps) => {
  return {
    [name]: {
      title,
      type: 'number',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: defaultValue,
      description,
      'x-component-props': {
        suffix: '%',
      },
    },
  };
};

const input = ({ name, title, required, defaultValue, description }: FieldConfigProps) => {
  return {
    [name]: {
      title: lang(title),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required,
      default: defaultValue,
      description,
    },
  };
};

export default {
  field,
  input,
  boolean,
  select,
  radio,
  percent,
  xField: {
    configType: 'field',
    name: 'xField',
    title: 'xField',
    required: true,
  },
  yField: {
    configType: 'field',
    name: 'yField',
    title: 'yField',
    required: true,
  },
  seriesField: {
    configType: 'field',
    name: 'seriesField',
    title: 'seriesField',
  },
  colorField: {
    configType: 'field',
    name: 'colorField',
    title: 'colorField',
    required: true,
  },
  isStack: {
    configType: 'boolean',
    name: 'isStack',
    title: 'isStack',
  },
  smooth: {
    configType: 'boolean',
    name: 'smooth',
    title: 'smooth',
  },
  isPercent: {
    configType: 'boolean',
    name: 'isPercent',
    title: 'isPercent',
  },
  isGroup: {
    configType: 'boolean',
    name: 'isGroup',
    title: 'isGroup',
  },
  size: () => ({
    size: {
      title: lang('Size'),
      type: 'object',
      'x-decorator': 'FormItem',
      'x-component': 'Space',
      properties: {
        type: {
          'x-component': 'Select',
          'x-component-props': {
            allowClear: false,
          },
          default: 'ratio',
          enum: [
            {
              label: lang('Aspect ratio'),
              value: 'ratio',
            },
            {
              label: lang('Fixed height'),
              value: 'fixed',
            },
          ],
        },
        fixed: {
          type: 'number',
          'x-component': 'InputNumber',
          'x-component-props': {
            min: 0,
            addonAfter: 'px',
          },
          'x-reactions': [
            {
              dependencies: ['.type'],
              fulfill: {
                state: {
                  visible: "{{$deps[0] === 'fixed'}}",
                },
              },
            },
          ],
        },
        ratio: {
          type: 'object',
          'x-component': 'Space',
          'x-reactions': [
            {
              dependencies: ['.type'],
              fulfill: {
                state: {
                  visible: "{{$deps[0] === 'ratio'}}",
                },
              },
            },
          ],
          properties: {
            width: {
              type: 'number',
              'x-component': 'InputNumber',
              'x-component-props': {
                placeholder: lang('Width'),
                min: 1,
              },
            },
            colon: {
              type: 'void',
              'x-component': 'Text',
              'x-component-props': {
                children: ':',
              },
            },
            height: {
              type: 'number',
              'x-component': 'InputNumber',
              'x-component-props': {
                placeholder: lang('Height'),
                min: 1,
              },
            },
          },
        },
      },
    },
  }),
};
