import { CollectionSetting } from '@nocobase/test/client';

/**
 * 1. 创建一个名为 general 的 collection，其包含 时间、Percent 类型的字段
 */
export const generalWithDatetimeFields: CollectionSetting[] = [
  {
    name: 'general',
    title: 'General',
    fields: [
      {
        name: 'singleLineText',
        interface: 'input',
        uiSchema: {
          type: 'string',
          'x-component': 'Input',
          title: 'Single line text',
        },
      },
      {
        name: 'startDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'Start date time',
        },
      },
      {
        name: 'endDatetime',
        interface: 'datetime',
        uiSchema: {
          type: 'string',
          'x-component': 'DatePicker',
          title: 'End date time',
        },
      },
      {
        name: 'f_t22o7loai3j',
        interface: 'integer',
        isForeignKey: true,
        uiSchema: {
          type: 'number',
          title: 'f_t22o7loai3j',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        name: 'manyToOne',
        interface: 'm2o',
        foreignKey: 'f_t22o7loai3j',
        uiSchema: {
          'x-component': 'AssociationField',
          'x-component-props': {
            multiple: false,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
          title: 'Many to one',
        },
        target: 'users',
        targetKey: 'id',
      },
      {
        key: '46kjnywaamt',
        name: 'percent',
        type: 'float',
        interface: 'percent',
        uiSchema: {
          'x-component-props': {
            step: '0.01',
            stringMode: true,
            addonAfter: '%',
          },
          'x-component': 'Percent',
          title: 'Percent',
        },
      },
    ],
  },
];
