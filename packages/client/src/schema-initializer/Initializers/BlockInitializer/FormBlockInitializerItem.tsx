import { TableOutlined } from '@ant-design/icons';
import { ISchema } from '@formily/react';
import { clone } from '@formily/shared';
import React from 'react';
import { SchemaInitializer } from '../../';
import { CollectionOptions, useCollectionManager } from '../../../collection-manager';

const collection: CollectionOptions = {
  name: 'collections',
  filterTargetKey: 'name',
  targetKey: 'name',
  fields: [
    {
      type: 'integer',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '数据表名称',
        type: 'number',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'name',
      interface: 'input',
      uiSchema: {
        title: '数据表标识',
        type: 'string',
        'x-component': 'Input',
        description: '使用英文',
      },
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fields',
      collectionName: 'collections',
      sourceKey: 'name',
      targetKey: 'name',
      uiSchema: {},
    },
  ],
};

export const collectionSchema: ISchema = {
  type: 'void',
  'x-collection': 'collections',
  'x-component': 'CardItem',
  'x-decorator': 'ResourceActionProvider',
  'x-decorator-props': {
    collection,
    request: {
      resource: 'collections',
      action: 'list',
      params: {
        pageSize: 5,
        filter: {},
        sort: ['sort'],
        appends: [],
      },
    },
  },
  properties: {
    actions: {
      type: 'void',
      'x-component': 'ActionBar',
      'x-action-initializer': 'AddActionButton',
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
      'x-component': 'VoidTable',
      'x-component-props': {
        rowKey: 'id',
        rowSelection: {
          type: 'checkbox',
        },
        useDataSource: '{{ useDataSourceFromRAC }}',
      },
      'x-column-initializer': 'AddTableColumn',
      properties: {
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
                view: {
                  type: 'void',
                  title: '配置字段',
                  'x-component': 'Action.Link',
                  'x-component-props': {},
                  properties: {
                    drawer: {
                      type: 'void',
                      'x-component': 'Action.Drawer',
                      title: 'Drawer Title',
                      properties: {},
                    },
                  },
                },
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

const itemWrap = SchemaInitializer.itemWrap;

export const FormBlockInitializerItem = itemWrap((props) => {
  const { insert } = props;
  const { collections } = useCollectionManager();

  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      onClick={() => {
        insert(clone(collectionSchema));
      }}
      items={[
        {
          type: 'itemGroup',
          title: 'select a data source',
          children: collections?.map((item) => {
            return {
              type: 'item',
              name: item.name,
              title: item.title,
            };
          }),
        },
      ]}
    >
      Form
    </SchemaInitializer.Item>
  );
});
