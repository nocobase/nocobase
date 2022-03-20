import { ISchema } from '@formily/react';
import { CollectionOptions } from '../../collection-manager';

const collection: CollectionOptions = {
  name: 'uiSchemaTemplates',
  filterTargetKey: 'name',
  targetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '{{ t("Template name") }}',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
  ],
};

export const uiSchemaTemplatesSchema: ISchema = {
  type: 'object',
  properties: {
    block1: {
      type: 'void',
      'x-collection': 'collections',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        request: {
          resource: 'uiSchemaTemplates',
          action: 'list',
          params: {
            pageSize: 50,
            filter: {},
            // sort: ['sort'],
            appends: [],
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
              'x-component-props': {
                useAction: '{{ cm.useBulkDestroyActionAndRefreshCM }}',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{ t("Add block template") }}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
            },
          },
        },
        table: {
          type: 'void',
          'x-uid': 'input',
          'x-component': 'Table.Void',
          'x-component-props': {
            rowKey: 'name',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ cm.useDataSourceFromRAC }}',
          },
          properties: {
            column1: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                title: {
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column2: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                name: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              },
            },
            column3: {
              type: 'void',
              title: '{{ t("Actions") }}',
              'x-component': 'Table.Column',
              properties: {
                actions: {
                  type: 'void',
                  'x-component': 'Space',
                  'x-component-props': {
                    split: '|',
                  },
                  properties: {
                    view: {
                      type: 'void',
                      title: '{{ t("Configure fields") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {},
                    },
                    delete: {
                      type: 'void',
                      title: '{{ t("Delete") }}',
                      'x-component': 'Action.Link',
                      'x-component-props': {
                        confirm: {
                          title: "{{t('Delete record')}}",
                          content: "{{t('Are you sure you want to delete it?')}}",
                        },
                        useAction: '{{ cm.useDestroyActionAndRefreshCM }}',
                      },
                    },
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
