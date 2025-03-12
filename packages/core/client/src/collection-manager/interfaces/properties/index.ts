/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { ISchema } from '@formily/react';
import { uid } from '@formily/shared';
import { css } from '@emotion/css';
import { DateFormatCom } from '../../../schema-component/antd/expiresRadio';
export * as operators from './operators';

export const type: ISchema = {
  type: 'string',
  title: '{{t("Storage type")}}',
  required: true,
  'x-disabled': true,
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  enum: [
    { label: 'Boolean', value: 'boolean' },
    { label: 'String', value: 'string' },
    { label: 'Text', value: 'text' },
    { label: 'Integer', value: 'integer' },
    { label: 'BigInteger', value: 'bigInt' },
    { label: 'Float', value: 'float' },
    { label: 'Double', value: 'double' },
    { label: 'Decimal', value: 'decimal' },
    { label: 'Date', value: 'date' },
    { label: 'DateOnly', value: 'dateonly' },
    { label: 'Time', value: 'time' },
    { label: 'Virtual', value: 'virtual' },
    { label: 'JSON', value: 'json' },
    { label: 'Password', value: 'password' },
    { label: 'One to one', value: 'hasOne' },
    { label: 'One to many', value: 'hasMany' },
    { label: 'Many to one', value: 'belongsTo' },
    { label: 'Many to many', value: 'belongsToMany' },
    { label: 'Snapshot', value: 'snapshot' },
  ],
};

export const unique = {
  type: 'boolean',
  'x-content': '{{t("Unique")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Checkbox',
  'x-disabled': '{{ !createMainOnly }}',
  'x-reactions': [
    {
      dependencies: ['primaryKey'],
      when: '{{$deps[0]}}',
      fulfill: {
        state: {
          value: false,
        },
      },
    },
  ],
};
export const primaryKey = {
  type: 'boolean',
  'x-content': '{{t("Primary")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Checkbox',
  'x-disabled': '{{ !createMainOnly }}',
  'x-reactions': [
    {
      dependencies: ['unique'],
      when: '{{$deps[0]&&createMainOnly}}',
      fulfill: {
        state: {
          value: false,
        },
      },
    },
  ],
};

export const autoIncrement = {
  type: 'boolean',
  title: '{{t("Auto increment")}}',
  'x-content': '{{t("Auto increment")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Checkbox',
  'x-disabled': '{{ !createMainOnly }}',
  'x-reactions': [
    {
      dependencies: ['primaryKey'],
      when: '{{$deps[0]&&createMainOnly}}',
      fulfill: {
        state: {
          value: true,
        },
      },
    },
  ],
};

export const autoFill = {
  type: 'boolean',
  title: '{{t("Default value")}}',
  'x-content': '{{t("Automatically generate default values")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Checkbox',
  default: true,
};

export const relationshipType: ISchema = {
  type: 'string',
  title: '{{t("Relationship type")}}',
  required: true,
  'x-disabled': true,
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  enum: [
    { label: "{{t('HasOne')}}", value: 'hasOne' },
    { label: "{{t('HasMany')}}", value: 'hasMany' },
    { label: "{{t('BelongsTo')}}", value: 'belongsTo' },
    { label: "{{t('BelongsToMany')}}", value: 'belongsToMany' },
  ],
};

export const constraintsProps = {
  onDelete: {
    type: 'string',
    title: '{{t("ON DELETE")}}',
    required: true,
    default: 'SET NULL',
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    enum: [
      { label: "{{t('SET NULL')}}", value: 'SET NULL' },
      { label: "{{t('RESTRICT')}}", value: 'RESTRICT' },
      { label: "{{t('CASCADE')}}", value: 'CASCADE' },
      { label: "{{t('NO ACTION')}}", value: 'NO ACTION' },
    ],
  },
};

export const reverseFieldProperties: Record<string, ISchema> = {
  reverse: {
    type: 'void',
    'x-component': 'div',
    properties: {
      autoCreateReverseField: {
        type: 'boolean',
        default: false,
        'x-decorator': 'FormItem',
        'x-component': 'Checkbox',
        'x-content': '{{t("Create inverse field in the target collection")}}',
        'x-reactions': [
          {
            target: 'reverseField.type',
            when: '{{!!$self.value}}',
            fulfill: {
              state: {
                hidden: false,
              },
            },
            otherwise: {
              state: {
                hidden: true,
              },
            },
          },
          {
            target: 'reverseField.uiSchema.title',
            when: '{{!!$self.value}}',
            fulfill: {
              state: {
                hidden: false,
              },
            },
            otherwise: {
              state: {
                hidden: true,
              },
            },
          },
          {
            target: 'reverseField.name',
            when: '{{!!$self.value}}',
            fulfill: {
              state: {
                hidden: false,
              },
            },
            otherwise: {
              state: {
                hidden: true,
              },
            },
          },
          (field) => {
            const values = field.form.values;
            const { reverseField } = values;
            field.value = !!reverseField?.key;
            field.disabled = !!reverseField?.key;
          },
        ],
      },
      'reverseField.type': {
        ...relationshipType,
        title: '{{t("Inverse relationship type")}}',
      },
      'reverseField.uiSchema.title': {
        type: 'string',
        title: '{{t("Inverse field display name")}}',
        default: '{{record.title}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-disabled': '{{ !showReverseFieldConfig }}',
      },
      'reverseField.name': {
        type: 'string',
        title: '{{t("Inverse field name")}}',
        required: true,
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-validator': 'uid',
        'x-disabled': '{{ !showReverseFieldConfig }}',
        description:
          "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
      },
    },
  },
};

export const dateTimeProps: { [key: string]: ISchema } = {
  'uiSchema.x-component-props.picker': {
    type: 'string',
    title: '{{t("Picker")}}',
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
    default: 'date',
    enum: [
      {
        label: '{{t("Date")}}',
        value: 'date',
      },
      // {
      //   label: '{{t("Week")}}',
      //   value: 'week',
      // },
      {
        label: '{{t("Month")}}',
        value: 'month',
      },
      {
        label: '{{t("Quarter")}}',
        value: 'quarter',
      },
      {
        label: '{{t("Year")}}',
        value: 'year',
      },
    ],
  },

  'uiSchema.x-component-props.dateFormat': {
    type: 'string',
    title: '{{t("Date format")}}',
    'x-decorator': 'FormItem',
    'x-component': 'ExpiresRadio',
    'x-decorator-props': {},
    'x-component-props': {
      className: css`
        .ant-radio-wrapper {
          display: flex;
          margin: 5px 0px;
        }
      `,
      defaultValue: 'dddd',
      formats: ['MMMM Do YYYY', 'YYYY-MM-DD', 'MM/DD/YY', 'YYYY/MM/DD', 'DD/MM/YYYY'],
    },
    default: 'YYYY-MM-DD',
    enum: [
      {
        label: DateFormatCom({ format: 'MMMM Do YYYY' }),
        value: 'MMMM Do YYYY',
      },
      {
        label: DateFormatCom({ format: 'YYYY-MM-DD' }),
        value: 'YYYY-MM-DD',
      },
      {
        label: DateFormatCom({ format: 'MM/DD/YY' }),
        value: 'MM/DD/YY',
      },
      {
        label: DateFormatCom({ format: 'YYYY/MM/DD' }),
        value: 'YYYY/MM/DD',
      },
      {
        label: DateFormatCom({ format: 'DD/MM/YYYY' }),
        value: 'DD/MM/YYYY',
      },
      {
        label: 'custom',
        value: 'custom',
      },
    ],
    'x-reactions': {
      dependencies: ['uiSchema.x-component-props.picker'],
      fulfill: {
        state: {
          value: `{{ getPickerFormat($deps[0])}}`,
          componentProps: { picker: `{{$deps[0]}}` },
        },
      },
    },
  },
  'uiSchema.x-component-props.showTime': {
    type: 'boolean',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
    'x-content': '{{t("Show time")}}',
    'x-reactions': [
      `{{(field) => {
         field.query('..[].timeFormat').take(f => {
           f.display = field.value ? 'visible' : 'none';
           f.value='HH:mm:ss'
         });
       }}}`,
      {
        dependencies: ['uiSchema.x-component-props.picker'],
        when: '{{$deps[0]==="date"}}',
        fulfill: {
          state: {
            hidden: false,
          },
        },
        otherwise: {
          state: {
            hidden: true,
            value: false,
          },
        },
      },
    ],
  },
  'uiSchema.x-component-props.timeFormat': {
    type: 'string',
    title: '{{t("Time format")}}',
    'x-component': 'Radio.Group',
    'x-decorator': 'FormItem',
    default: 'HH:mm:ss',
    enum: [
      {
        label: '{{t("12 hour")}}',
        value: 'hh:mm:ss a',
      },
      {
        label: '{{t("24 hour")}}',
        value: 'HH:mm:ss',
      },
    ],
    'x-reactions': {
      dependencies: ['uiSchema.x-component-props.showTime'],
      fulfill: {
        state: {
          hidden: `{{ !$deps[0] }}`,
        },
      },
    },
  },
};

export const timeProps: { [key: string]: ISchema } = {
  'uiSchema.x-component-props.format': {
    type: 'string',
    title: '{{t("Time format")}}',
    'x-component': 'ExpiresRadio',
    'x-decorator': 'FormItem',
    'x-component-props': {
      className: css`
        color: red;
        .ant-radio-wrapper {
          display: flex;
          margin: 5px 0px;
        }
      `,
      defaultValue: 'h:mm a',
      formats: ['hh:mm:ss a', 'HH:mm:ss'],
      timeFormat: true,
    },
    default: 'HH:mm:ss',
    enum: [
      {
        label: DateFormatCom({ format: 'hh:mm:ss a' }),
        value: 'hh:mm:ss a',
      },
      {
        label: DateFormatCom({ format: 'HH:mm:ss' }),
        value: 'HH:mm:ss',
      },
      {
        label: 'custom',
        value: 'custom',
      },
    ],
  },
};

export const dataSource: ISchema = {
  type: 'array',
  title: '{{t("Options")}}',
  'x-decorator': 'FormItem',
  'x-component': 'ArrayTable',
  'x-component-props': {
    pagination: {
      pageSize: 1000,
    },
    // scroll: { x: '100%' },
  },
  items: {
    type: 'object',
    properties: {
      column1: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { width: 50, title: '', align: 'center' },
        properties: {
          sort: {
            type: 'void',
            'x-component': 'ArrayTable.SortHandle',
          },
        },
      },
      column2: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { title: '{{t("Option value")}}' },
        // 'x-hidden': true,
        properties: {
          value: {
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            'x-reactions': (field: Field) => {
              if (!field.initialValue && !field.initialized) {
                field.initialValue = uid();
                field.setValue(uid());
              }
            },
          },
        },
      },
      column3: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { title: '{{t("Option label")}}' },
        properties: {
          label: {
            type: 'string',
            required: true,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
      column4: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { title: '{{t("Color")}}' },
        properties: {
          color: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'ColorSelect',
          },
        },
      },
      column5: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': {
          title: '',
          dataIndex: 'operations',
          fixed: 'right',
        },
        properties: {
          item: {
            type: 'void',
            'x-component': 'FormItem',
            properties: {
              remove: {
                type: 'void',
                'x-component': 'ArrayTable.Remove',
              },
            },
          },
        },
      },
    },
  },
  properties: {
    add: {
      type: 'void',
      'x-component': 'ArrayTable.Addition',
      'x-component-props': {
        randomValue: true,
      },
      title: "{{t('Add option')}}",
    },
  },
};

export const defaultProps = {
  'uiSchema.title': {
    type: 'string',
    title: '{{t("Field display name")}}',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '{{t("Field name")}}',
    required: true,
    'x-disabled': '{{ !createOnly }}',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-validator': 'uid',
    description:
      "{{t('Randomly generated and can be modified. Support letters, numbers and underscores, must start with an letter.')}}",
  },
};

export const recordPickerViewer = {
  type: 'void',
  title: '{{ t("View record") }}',
  'x-component': 'RecordPicker.Viewer',
  'x-component-props': {
    className: 'nb-action-popup',
  },
  properties: {
    tabs: {
      type: 'void',
      'x-component': 'Tabs',
      'x-component-props': {},
      'x-initializer': 'popup:addTab',
      properties: {
        tab1: {
          type: 'void',
          title: '{{t("Details")}}',
          'x-component': 'Tabs.TabPane',
          'x-designer': 'Tabs.Designer',
          'x-component-props': {},
          properties: {
            grid: {
              type: 'void',
              'x-component': 'Grid',
              'x-initializer': 'popup:common:addBlock',
              properties: {},
            },
          },
        },
      },
    },
  },
};

export const collectionDataSource: ISchema = {
  type: 'string',
  title: '{{t("Options")}}',
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  'x-component-props': {
    multiple: true,
  },
  enum: '{{collections}}',
};
