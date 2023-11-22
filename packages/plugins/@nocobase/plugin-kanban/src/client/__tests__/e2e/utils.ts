import { CollectionSetting } from '@nocobase/test/client';

/**
 * 1. 创建一个名为 general 的 collection，其包含 single select 类型的字段
 */
export const generalWithSingleSelect: CollectionSetting[] = [
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
        name: 'singleSelect',
        interface: 'select',
        uiSchema: {
          enum: [
            {
              value: 'option1',
              label: 'option1',
              color: 'red',
            },
            {
              value: 'option2',
              label: 'option2',
              color: 'magenta',
            },
            {
              value: 'option3',
              label: 'option3',
              color: 'volcano',
            },
          ],
          type: 'string',
          'x-component': 'Select',
          title: 'Single select',
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
    ],
  },
];
