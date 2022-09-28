import { ISchema } from '@formily/react';

const collection = {
  name: 'executions',
  fields: [
    {
      interface: 'createdAt',
      type: 'datetime',
      // field: 'createdAt',
      name: 'createdAt',
      uiSchema: {
        type: 'datetime',
        title: '{{t("Created at")}}',
        'x-component': 'DatePicker',
        'x-component-props': {},
        'x-read-pretty': true,
      } as ISchema,
    },
    {
      interface: 'number',
      type: 'number',
      name: 'workflowId',
      uiSchema: {
        type: 'number',
        title: '{{t("Version")}}',
        'x-component': 'InputNumber',
        'x-read-pretty': true,
      } as ISchema,
    },
    {
      type: 'number',
      name: 'status',
      interface: 'select',
      uiSchema: {
        title: '{{t("Status")}}',
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          { value: 0, label: '{{t("On going")}}' },
          { value: 1, label: '{{t("Succeeded")}}' },
          { value: -1, label: '{{t("Failed")}}' },
          { value: -2, label: '{{t("Canceled")}}' },
        ],
      } as ISchema,
    }
  ],
};

export const executionSchema = {
  provider: {
    type: 'void',
    'x-decorator': 'ExecutionResourceProvider',
    'x-decorator-props': {
      collection,
      resourceName: 'executions',
      request: {
        resource: 'executions',
        action: 'list',
        params: {
          pageSize: 50,
          sort: ['-createdAt'],
        },
      },
    },
    'x-component': 'CollectionProvider',
    'x-component-props': {
      collection,
    },
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
          // filter: {
          //   type: 'object',
          //   'x-component': 'Filter',
          // }
        }
      },
      table: {
        type: 'void',
        'x-component': 'Table.Void',
        'x-component-props': {
          rowKey: 'id',
          useDataSource: '{{ cm.useDataSourceFromRAC }}',
        },
        properties: {
          createdAt: {
            type: 'void',
            'x-decorator': 'Table.Column.Decorator',
            'x-component': 'Table.Column',
            properties: {
              createdAt: {
                type: 'datetime',
                'x-component': 'CollectionField',
                'x-component-props': {
                  showTime: true
                },
                'x-read-pretty': true,
              },
            }
          },
          workflowId: {
            type: 'void',
            'x-decorator': 'Table.Column.Decorator',
            'x-component': 'Table.Column',
            properties: {
              workflowId: {
                type: 'number',
                'x-component': 'CollectionField',
                'x-read-pretty': true,
              },
            }
          },
          status: {
            type: 'void',
            'x-decorator': 'Table.Column.Decorator',
            'x-component': 'Table.Column',
            properties: {
              status: {
                type: 'number',
                'x-component': 'CollectionField',
                'x-read-pretty': true,
              },
            }
          },
          // actions: {
          //   type: 'void',
          //   title: '{{ t("Actions") }}',
          //   'x-component': 'Table.Column',
          //   properties: {
          //     actions: {
          //       type: 'void',
          //       'x-component': 'Space',
          //       'x-component-props': {
          //         split: '|',
          //       },
          //       properties: {
          //         config: {
          //           type: 'void',
          //           title: '查看',
          //           'x-component': 'ExecutionLink'
          //         },
          //       }
          //     }
          //   }
          // }
        }
      }
    }
  }
};
