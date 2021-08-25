import React from 'react';
import { range } from 'lodash';
import { ISchema } from '@formily/react';
import { SchemaRenderer } from '../..';
import { uid } from '@formily/shared';

const loadDataSource = (params?: any): Promise<any> => {
  const { page, pageSize = 50 } = params || {};
  console.log({ pageSize });
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        list: range(50 || pageSize).map(() => {
          return { id: uid(), title: uid() };
        }),
        total: 50,
      });
    }, 1000);
  });
};

const schema: ISchema = {
  type: 'array',
  name: 'arr',
  'x-component': 'Table',
  'x-component-props': {
    dragSort: true,
    showIndex: true,
    refreshRequestOnChange: false,
    clientSidePagination: true,
    dataRequest: '{{ loadDataSource }}',
    pagination: {
      pageSize: 2,
    },
  },
  // default: range(50).map(() => {
  //   return { id: uid(), title: uid() };
  // }),
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      'x-designable-bar': 'Table.ActionBar.DesignableBar',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Table.Filter',
          'x-designable-bar': 'Table.Filter.DesignableBar',
          'x-component-props': {
            fieldNames: [],
          },
        },
        [uid()]: {
          type: 'void',
          name: 'action1',
          title: '创建',
          'x-component': 'Action',
          'x-designable-bar': 'Table.Action.DesignableBar',
          properties: {
            modal: {
              type: 'void',
              title: '创建数据',
              'x-decorator': 'Form',
              'x-component': 'Action.Modal',
              'x-component-props': {
                useOkAction: '{{ Table.useTableCreateAction }}',
              },
              properties: {
                [uid()]: {
                  type: 'void',
                  'x-component': 'Grid',
                  'x-component-props': {
                    addNewComponent: 'AddNew.FormItem',
                  },
                },
              },
            },
          },
        },
        [uid()]: {
          type: 'void',
          name: 'action1',
          title: '删除',
          'x-component': 'Action',
          'x-designable-bar': 'Table.Action.DesignableBar',
          'x-component-props': {
            useAction: '{{ Table.useTableDestroyAction }}',
          },
        },
      },
    },
    column2: {
      type: 'void',
      title: '操作',
      'x-component': 'Table.Column',
      'x-component-props': {
        className: 'nb-table-operation',
      },
      properties: {
        action1: {
          type: 'void',
          name: 'dropdown1',
          'x-component': 'Action.Dropdown',
          'x-designable-bar': 'Action.DesignableBar',
          'x-component-props': {
            buttonProps: {
              icon: 'EllipsisOutlined',
            },
          },
          properties: {
            [uid()]: {
              type: 'void',
              title: '操作 1',
              'x-component': 'Menu.Action',
              'x-component-props': {
                style: {
                  minWidth: 150,
                },
                disabled: true,
              },
            },
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: '查看',
              'x-component': 'Menu.Action',
              'x-designable-bar': 'Table.Action.DesignableBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '查看',
                  'x-component': 'Action.Modal',
                  'x-component-props': {
                    bodyStyle: {
                      background: '#f0f2f5',
                      paddingTop: 0,
                    },
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Tabs',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Tabs.TabPane',
                          'x-component-props': {
                            tab: 'Tab1',
                          },
                          properties: {
                            [uid()]: {
                              type: 'void',
                              'x-component': 'Grid',
                              'x-component-props': {
                                addNewComponent: 'AddNew.PaneItem',
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
            [uid()]: {
              type: 'void',
              title: '编辑',
              'x-component': 'Menu.Action',
              'x-designable-bar': 'Table.Action.DesignableBar',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '编辑数据',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    useValues: '{{ Table.useTableRowRecord }}',
                  },
                  'x-component': 'Action.Modal',
                  'x-component-props': {
                    useOkAction: '{{ Table.useTableUpdateAction }}',
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                      properties: {
                        [uid()]: {
                          type: 'void',
                          'x-component': 'Grid.Row',
                          properties: {
                            [uid()]: {
                              type: 'void',
                              'x-component': 'Grid.Col',
                              properties: {
                                title: {
                                  title: '标题',
                                  type: 'string',
                                  'x-component': 'Input',
                                  'x-decorator': 'FormItem',
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
            [uid()]: {
              type: 'void',
              title: '删除',
              'x-component': 'Menu.Action',
              'x-component-props': {
                useAction: '{{ Table.useTableDestroyAction }}',
              },
            },
          },
        },
      },
    },
    column0: {
      type: 'void',
      title: 'ID',
      'x-component': 'Table.Column',
      'x-designable-bar': 'Table.Column.DesignableBar',
      properties: {
        id: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
    column1: {
      type: 'void',
      title: 'Title',
      'x-component': 'Table.Column',
      properties: {
        title: {
          type: 'string',
          'x-component': 'Input',
          'x-read-pretty': true,
        },
      },
    },
  },
};

export default () => {
  return (
    <div>
      <SchemaRenderer scope={{ loadDataSource }} schema={schema} />
    </div>
  );
};
