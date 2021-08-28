import React from 'react';
import { range } from 'lodash';
import { ISchema } from '@formily/react';
import { SchemaRenderer } from '../..';
import { uid } from '@formily/shared';
import {
  CollectionsProvider,
  DesignableSwitchProvider,
} from '@nocobase/client/src/constate';
import { RequestProvider } from '@nocobase/client/src/demos/RequestProvider';

const schema = {
  name: 'table1',
  type: 'array',
  'x-designable-bar': 'Table.DesignableBar',
  'x-decorator': 'CardItem',
  'x-component': 'Table',
  default: [],
  'x-component-props': {
    collectionName: 'users',
    rowKey: 'id',
    dragSort: true,
    showIndex: true,
    refreshRequestOnChange: true,
    pagination: {
      pageSize: 10,
    },
  },
  properties: {
    [uid()]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      'x-designable-bar': 'Table.ActionBar.DesignableBar',
      properties: {
        [uid()]: {
          type: 'void',
          title: '筛选',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'filter',
          },
          'x-align': 'left',
          'x-component': 'Table.Filter',
          'x-designable-bar': 'Table.Filter.DesignableBar',
          'x-component-props': {
            fieldNames: [],
          },
        },
        [uid()]: {
          type: 'void',
          name: 'action1',
          title: '删除',
          'x-align': 'right',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'destroy',
          },
          'x-component': 'Action',
          'x-designable-bar': 'Table.Action.DesignableBar',
          'x-component-props': {
            icon: 'DeleteOutlined',
            confirm: {
              title: '删除数据',
              content: '删除后无法恢复，确定要删除吗？',
            },
            useAction: '{{ Table.useTableDestroyAction }}',
          },
        },
        [uid()]: {
          type: 'void',
          name: 'action1',
          title: '添加',
          'x-align': 'right',
          'x-decorator': 'AddNew.Displayed',
          'x-decorator-props': {
            displayName: 'create',
          },
          'x-component': 'Action',
          'x-component-props': {
            icon: 'PlusOutlined',
            type: 'primary',
          },
          'x-designable-bar': 'Table.Action.DesignableBar',
          properties: {
            modal: {
              type: 'void',
              title: '添加数据',
              'x-decorator': 'Form',
              'x-component': 'Action.Drawer',
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
      },
    },
    [uid()]: {
      type: 'void',
      title: '操作',
      'x-component': 'Table.Column',
      'x-component-props': {},
      'x-designable-bar': 'Table.Operation.DesignableBar',
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Action.Group',
          'x-component-props': {
            type: 'link',
          },
          properties: {
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: '查看',
              'x-component': 'Action',
              'x-component-props': {
                type: 'link',
              },
              'x-designable-bar': 'Table.Action.DesignableBar',
              'x-action-type': 'view',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '查看数据',
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    bodyStyle: {
                      background: '#f0f2f5',
                      // paddingTop: 0,
                    },
                  },
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Tabs',
                      'x-designable-bar': 'Tabs.DesignableBar',
                      properties: {
                        [uid()]: {
                          type: 'void',
                          title: '详情',
                          'x-designable-bar': 'Tabs.TabPane.DesignableBar',
                          'x-component': 'Tabs.TabPane',
                          'x-component-props': {},
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
              'x-component': 'Action',
              'x-component-props': {
                type: 'link',
              },
              'x-designable-bar': 'Table.Action.DesignableBar',
              'x-action-type': 'update',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '编辑数据',
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    useResource: '{{ Table.useResource }}',
                    useValues: '{{ Table.useTableRowRecord }}',
                  },
                  'x-component': 'Action.Drawer',
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
                    },
                  },
                },
              },
            },
            // [uid()]: {
            //   type: 'void',
            //   title: '删除',
            //   'x-component': 'Action',
            //   'x-designable-bar': 'Table.Action.DesignableBar',
            //   'x-action-type': 'destroy',
            //   'x-component-props': {
            //     type: 'link',
            //     useAction: '{{ Table.useTableDestroyAction }}',
            //   },
            // },
          },
        },
      },
    },
  },
};

export default () => {
  return (
    <div>
      <RequestProvider>
        <DesignableSwitchProvider>
          <CollectionsProvider>
            <SchemaRenderer schema={schema} />
          </CollectionsProvider>
        </DesignableSwitchProvider>
      </RequestProvider>
    </div>
  );
};
