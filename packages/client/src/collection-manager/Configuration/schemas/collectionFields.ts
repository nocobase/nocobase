import { ISchema } from '@formily/react';
import { CollectionOptions } from '../../types';

const collection: CollectionOptions = {
  name: 'fields',
  fields: [
    {
      type: 'string',
      name: 'type',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Storage type") }}',
        type: 'string',
        'x-component': 'Select',
        enum: [
          {
            label: 'String',
            value: 'string',
          },
        ],
        required: true,
      },
    },
    {
      type: 'string',
      name: 'interface',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field interface") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field display name") }}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Field name") }}',
        type: 'string',
        'x-component': 'Input',
      },
    },
  ],
};

export const collectionFieldSchema: ISchema = {
  type: 'void',
  'x-collection-field': 'collections.fields',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    association: {
      sourceKey: 'name',
      targetKey: 'name',
    },
    collection,
    request: {
      resource: 'collections.fields',
      action: 'list',
      params: {
        pageSize: 50,
        filter: {},
        // sort: ['sort'],
        appends: ['uiSchema'],
      },
    },
  },
  // 'x-component': 'CollectionProvider',
  // 'x-component-props': {
  //   collection,
  // },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-component-props': {
        style: {
          marginBottom: 16,
        },
      },
      properties: {
        delete: {
          type: 'void',
          title: '{{ t("Delete") }}',
          'x-component': 'Action',
        },
        create: {
          type: 'void',
          title: '{{ t("Add new") }}',
          'x-component': 'AddFieldAction',
          'x-component-props': {
            type: 'primary',
          },
        },
      },
    },
    table: {
      type: 'void',
      'x-uid': 'input',
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ useDataSourceFromRAC }}',
      },
      properties: {
        column1: {
          type: 'void',
          title: '{{ t("Field display name") }}',
          'x-component': 'VoidTable.Column',
          properties: {
            'uiSchema.title': {
              type: 'number',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
        column2: {
          type: 'void',
          'x-decorator': 'TableColumnDecorator',
          'x-component': 'VoidTable.Column',
          properties: {
            name: {
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          'x-decorator': 'TableColumnDecorator',
          'x-component': 'VoidTable.Column',
          properties: {
            interface: {
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column4: {
          type: 'void',
          title: '{{ t("Actions") }}',
          'x-component': 'VoidTable.Column',
          properties: {
            actions: {
              type: 'void',
              'x-component': 'Space',
              'x-component-props': {
                split: '|',
              },
              properties: {
                update: {
                  type: 'void',
                  title: '{{ t("Edit") }}',
                  'x-component': 'EditFieldAction',
                  'x-component-props': {
                    type: 'primary',
                  },
                },
                delete: {
                  type: 'void',
                  title: '{{ t("Delete") }}',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    useAction: '{{ useDestroyActionAndRefreshCM }}',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
