import { ISchema } from '@formily/react';
import { executionSchema } from './executions';



// const collection = {
//   name: 'workflows',
//   fields: [
//     {
//       type: 'string',
//       name: 'title',
//       interface: 'input',
//       uiSchema: {
//         title: '{{t("Name")}}',
//         type: 'string',
//         'x-component': 'Input',
//         required: true,
//       } as ISchema,
//     },
//     {
//       type: 'string',
//       name: 'type',
//       interface: 'select',
//     },
//     {
//       type: 'string',
//       name: 'description',
//       interface: 'textarea',
//       uiSchema: {
//         title: '{{t("Description")}}',
//         type: 'string',
//         'x-component': 'Input.TextArea',
//       } as ISchema,
//     },
//     {
//       type: 'boolean',
//       name: 'enabled',
//       interface: 'radio',
//       uiSchema: {
//         title: '{{t("Status")}}',
//         type: 'string',
//         enum: [
//           { label: '{{t("On")}}', value: true },
//           { label: '{{t("Off")}}', value: false },
//         ],
//         'x-component': 'Radio.Group',
//         'x-decorator': 'FormItem',
//         default: false
//       } as ISchema
//     }
//   ],
// };

export const graphCollections: ISchema = {
  type: 'object',
  properties: {
    provider: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        // collection,
        resourceName: 'collections',
        request: {
          resource: 'collections',
          action: 'list',
          params: {
            paginate: false,
            filter: {
              current: true
            },
          },
        },
      },
      'x-component': 'CollectionProvider',
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
              title: '{{t("Delete")}}',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ cm.useBulkDestroyAction }}',
                confirm: {
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
              },
            },
            create: {
              type: 'void',
              title: '{{t("Add new")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    initialValue: {
                      current: true
                    }
                  },
                  title: '{{t("Add new")}}',
                  properties: {
                    title: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    type: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    description: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: '{{ t("Cancel") }}',
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ cm.useCancelAction }}',
                          },
                        },
                        submit: {
                          title: '{{ t("Submit") }}',
                          'x-component': 'Action',
                          'x-component-props': {
                            type: 'primary',
                            useAction: '{{ cm.useCreateAction }}',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }
        },
        table: {
          type: 'void',
          'x-component': 'Table.Void',
          'x-component-props': {
            rowKey: 'id',
            rowSelection: {
              type: 'checkbox',
            },
            useDataSource: '{{ cm.useDataSourceFromRAC }}',
          },
          properties: {
            title: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                title: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              }
            },
            type: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                type: {
                  type: 'string',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                },
              }
            },
            enabled: {
              type: 'void',
              'x-decorator': 'Table.Column.Decorator',
              'x-component': 'Table.Column',
              properties: {
                enabled: {
                  type: 'boolean',
                  'x-component': 'CollectionField',
                  'x-read-pretty': true,
                  default: false
                },
              }
            },
          }
        }
      }
    }
  }
};
