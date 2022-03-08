import { ISchema, useForm } from '@formily/react';

const collection = {
  name: 'workflows',
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '流程名称',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    // {
    //   type: 'string',
    //   name: 'description',
    //   interface: 'textarea',
    //   uiSchema: {
    //     title: '描述',
    //     type: 'string',
    //     'x-component': 'TextArea',
    //   } as ISchema,
    // },
    {
      type: 'string',
      name: 'type',
      interface: 'select',
      uiSchema: {
        title: '触发方式',
        type: 'string',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: [
          { value: 'model', label: '数据变动' }
        ],
      } as ISchema,
    },
    {
      type: 'boolean',
      name: 'enabled',
      interface: 'radio',
      uiSchema: {
        title: '状态',
        type: 'string',
        enum: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
        'x-component': 'Radio.Group',
        'x-decorator': 'FormItem',
      } as ISchema
    }
  ],
};

export const workflowSchema: ISchema = {
  type: 'object',
  properties: {
    provider: {
      type: 'void',
      'x-decorator': 'ResourceActionProvider',
      'x-decorator-props': {
        collection,
        resourceName: 'workflows',
        request: {
          resource: 'workflows',
          action: 'list',
          params: {
            pageSize: 50,
            filter: {},
            sort: ['createdAt'],
            appends: [],
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
            delete: {
              type: 'void',
              title: '删除',
              'x-component': 'Action',
            },
            create: {
              type: 'void',
              title: '添加工作流',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
              },
              properties: {
                drawer: {
                  type: 'void',
                  'x-component': 'Action.Drawer',
                  'x-decorator': 'Form',
                  title: '添加工作流',
                  properties: {
                    title: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    description: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    type: {
                      'x-component': 'CollectionField',
                      'x-decorator': 'FormItem',
                    },
                    footer: {
                      type: 'void',
                      'x-component': 'Action.Drawer.Footer',
                      properties: {
                        cancel: {
                          title: 'Cancel',
                          'x-component': 'Action',
                          'x-component-props': {
                            useAction: '{{ cm.useCancelAction }}',
                          },
                        },
                        submit: {
                          title: 'Submit',
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
                    triggerConfig: {
                      type: 'void',
                      title: '触发器配置',
                      'x-component': 'TriggerConfig',
                      'x-component-props': {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
