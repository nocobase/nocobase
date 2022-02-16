import { ISchema } from '@formily/react';

const collection = {
  name: 'fields',
  fields: [
    {
      type: 'string',
      name: 'type',
      interface: 'input',
      uiSchema: {
        title: '存储类型',
        type: 'string',
        'x-component': 'Select',
        enum: [
          {
            label: 'String',
            value: 'string',
          },
        ],
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '字段名称',
        type: 'string',
        'x-component': 'Input',
        required: true,
      } as ISchema,
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '字段标识',
        type: 'string',
        'x-component': 'Input',
        description: '使用英文',
      } as ISchema,
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
    request: {
      resource: 'collections.fields',
      action: 'list',
      params: {
        pageSize: 5,
        filter: {},
        sort: ['sort'],
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
      properties: {
        delete: {
          type: 'void',
          title: '删除',
          'x-component': 'Action',
        },
        create: {
          type: 'void',
          title: '创建',
          'x-component': 'Action',
          'x-component-props': {
            type: 'primary',
          },
          properties: {
            drawer: {
              type: 'void',
              'x-component': 'Action.Drawer',
              'x-decorator': 'Form',
              title: 'Drawer Title',
              properties: {
                type: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                },
                title: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                },
                name: {
                  'x-component': 'CollectionField',
                  'x-decorator': 'FormItem',
                },
                footer: {
                  type: 'void',
                  'x-component': 'Action.Drawer.Footer',
                  properties: {
                    action1: {
                      title: 'Cancel',
                      'x-component': 'Action',
                      'x-component-props': {
                        useAction: '{{ useCancelAction }}',
                      },
                    },
                    action2: {
                      title: 'Submit',
                      'x-component': 'Action',
                      'x-component-props': {
                        type: 'primary',
                        useAction: '{{ useCreateAction }}',
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
    table1: {
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
          'x-decorator': 'TableColumnDecorator',
          'x-component': 'VoidTable.Column',
          properties: {
            title: {
              type: 'number',
              'x-component': 'CollectionField',
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
              type: 'string',
              'x-component': 'CollectionField',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          title: 'Actions',
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
                  title: '编辑',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    type: 'primary',
                  },
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      'x-decorator': 'Form',
                      'x-decorator-props': {
                        useValues: '{{ useValues }}',
                      },
                      title: 'Drawer Title',
                      properties: {
                        title: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                        },
                        name: {
                          'x-component': 'CollectionField',
                          'x-decorator': 'FormItem',
                          'x-disabled': true,
                        },
                        footer: {
                          type: 'void',
                          'x-component': 'Action.Drawer.Footer',
                          properties: {
                            action1: {
                              title: 'Cancel',
                              'x-component': 'Action',
                              'x-component-props': {
                                useAction: '{{ useCancelAction }}',
                              },
                            },
                            action2: {
                              title: 'Submit',
                              'x-component': 'Action',
                              'x-component-props': {
                                type: 'primary',
                                useAction: '{{ useUpdateAction }}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                delete: {
                  type: 'void',
                  title: '删除',
                  'x-component': 'Action.Link',
                  'x-component-props': {
                    useAction: '{{ useDestroyAction }}',
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
