import { ISchema } from "@formily/react";

export const dataType: ISchema = {
  type: 'string',
  title: '数据类型',
  required: true,
  'x-decorator': 'FormItem',
  'x-component': 'Select',
  enum: [
    { label: 'Boolean', value: 'boolean' },
    { label: 'String', value: 'string' },
    { label: 'Text', value: 'text' },
    { label: 'Integer', value: 'integer' },
    { label: 'Float', value: 'float' },
    { label: 'Decimal', value: 'decimal' },
    { label: 'Date', value: 'date' },
    { label: 'DateOnly', value: 'dateonly' },
    { label: 'Time', value: 'time' },
    { label: 'Virtual', value: 'virtual' },
    { label: 'JSON', value: 'json' },
    { label: 'Password', value: 'password' },
    { label: 'HasOne', value: 'hasOne' },
    { label: 'HasMany', value: 'hasMany' },
    { label: 'BelongsTo', value: 'belongsTo' },
    { label: 'BelongsToMany', value: 'belongsToMany' },
  ],
}

export const dataSource: ISchema = {
  type: 'array',
  title: '可选项',
  'x-decorator': 'FormItem',
  'x-component': 'ArrayTable',
  'x-component-props': {
    pagination: false,
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
        'x-component-props': { title: '选项值' },
        "x-hidden": true,
        properties: {
          value: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
      column3: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { title: '选项' },
        properties: {
          label: {
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
      column4: {
        type: 'void',
        'x-component': 'ArrayTable.Column',
        'x-component-props': { title: '颜色' },
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
      title: '添加可选项',
    },
  },
};

export const defaultProps = {
  'uiSchema.title': {
    type: 'string',
    title: '字段名称',
    required: true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  name: {
    type: 'string',
    title: '字段标识',
    required: true,
    'x-disabled': true,
    'x-decorator': 'FormItem',
    'x-component': 'Input',
  },
  dataType,
  // 'uiSchema.required': {
  //   type: 'string',
  //   title: '必填',
  //   'x-decorator': 'FormItem',
  //   'x-component': 'Checkbox',
  // },
};
