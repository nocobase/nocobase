import { ISchema } from '@formily/react';

const collection = {
  name: 'executions',
  fields: [
    {
      type: 'number',
      name: 'workflow',
      interface: 'linkTo',
      uiSchema: {
        title: '所属工作流',
        type: 'string',
      } as ISchema,
    },
    {
      type: 'number',
      name: 'status',
      interface: 'select',
      uiSchema: {
        title: '执行状态',
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          { value: 0, label: '进行中' },
          { value: 1, label: '已完成' },
          { value: -1, label: '已失败' },
          { value: -2, label: '已取消' },
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
          workflow: {
            type: 'void',
            'x-decorator': 'Table.Column.Decorator',
            'x-component': 'Table.Column',
            properties: {
              workflow: {
                type: 'string',
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
          actions: {
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
                  config: {
                    type: 'void',
                    title: '查看',
                    'x-component': 'ExecutionLink'
                  },
                }
              }
            }
          }
        }
      }
    }
  }
};
