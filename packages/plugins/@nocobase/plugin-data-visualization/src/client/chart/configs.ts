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
  options: { label: string; value: any }[];
}>;

export type AnySchemaProperties = SchemaProperties<any, any, any, any, any, any, any, any>;
export type GeneralConfig =
  | (FieldConfigProps & { settingType?: string })
  | ((props?: FieldConfigProps) => AnySchemaProperties);

export type Config = string | GeneralConfig | AnySchemaProperties;

const field = ({ name, title, required, defaultValue }: FieldConfigProps) => {
  return {
    [name || 'field']: {
      title: lang(title || 'Field'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-reactions': '{{ useChartFields }}',
      required,
      default: defaultValue,
    },
  };
};

const select = ({ name, title, required, defaultValue, options }: FieldConfigProps) => {
  return {
    [name || 'field']: {
      title: lang(title || 'Field'),
      type: 'string',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      required,
      default: defaultValue,
      enum: options.map((option) => ({
        label: lang(option.label),
        value: option.value,
      })),
    },
  };
};

const boolean = ({ name, title, defaultValue = false }: FieldConfigProps) => {
  return {
    [name || 'field']: {
      'x-content': lang(title || 'Field'),
      type: 'boolean',
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
      default: defaultValue,
    },
  };
};

export default {
  field,
  boolean,
  select,
  xField: {
    settingType: 'field',
    name: 'xField',
    title: 'xField',
    required: true,
  },
  yField: {
    settingType: 'field',
    name: 'yField',
    title: 'yField',
    required: true,
  },
  seriesField: {
    settingType: 'field',
    name: 'seriesField',
    title: 'seriesField',
  },
  colorField: {
    settingType: 'field',
    name: 'colorField',
    title: 'colorField',
    required: true,
  },
  isStack: {
    settingType: 'boolean',
    name: 'isStack',
    title: 'isStack',
  },
  smooth: {
    settingType: 'boolean',
    name: 'smooth',
    title: 'smooth',
  },
  isPercent: {
    settingType: 'boolean',
    name: 'isPercent',
    title: 'isPercent',
  },
  isGroup: {
    settingType: 'boolean',
    name: 'isGroup',
    title: 'isGroup',
  },
  showLegend: {
    settingType: 'boolean',
    name: 'showLegend',
    title: 'Show legend',
    defaultValue: true,
  },
  showLabel: {
    settingType: 'boolean',
    name: 'showLabel',
    title: 'Show label',
    defaultValue: true,
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
