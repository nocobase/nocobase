import React, {
  Children,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { FormDialog, FormLayout } from '@formily/antd';
import {
  connect,
  observer,
  mapProps,
  mapReadPretty,
  useField,
  useFieldSchema,
  RecursionField,
  Schema,
  useForm,
} from '@formily/react';
import {
  Menu,
  MenuProps,
  MenuItemProps,
  SubMenuProps,
  DividerProps,
  Dropdown,
  Modal,
  Button,
  Spin,
  Switch,
  Checkbox,
} from 'antd';
import {
  MenuOutlined,
  GroupOutlined,
  PlusOutlined,
  LinkOutlined,
  AppstoreAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  LoadingOutlined,
  DownOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import {
  createCollectionField,
  createOrUpdateCollection,
  createSchema,
  ISchema,
  removeSchema,
  useDesignable,
  useSchemaPath,
} from '../';
import { uid } from '@formily/shared';
import { getSchemaPath, SchemaField } from '../../components/schema-renderer';
import { cloneDeep } from 'lodash';
import { options } from '../database-field/interfaces';

import './style.less';
import IconPicker from '../../components/icon-picker';
import { barChartConfig, columnChartConfig } from './chart';
import { isGridRowOrCol } from '../grid';
import {
  useCollectionContext,
  useCollectionsContext,
  useDisplayedMapContext,
} from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { BlockSchemaContext } from '../../context';

const generateGridBlock = (schema: ISchema) => {
  const name = schema.name || uid();
  return {
    type: 'void',
    name: uid(),
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [name]: schema,
        },
      },
    },
  };
};

const isGrid = (schema: Schema) => {
  return schema['x-component'] === 'Grid';
};

const isGridBlock = (schema: Schema) => {
  if (schema.parent['x-component'] !== 'Grid.Col') {
    return false;
  }
  // Grid.Col 里有多少 Block
  if (Object.keys(schema.parent.properties).length > 1) {
    return false;
  }
  // 有多少 Grid.Row
  if (Object.keys(schema.parent.parent.properties).length > 1) {
    return false;
  }
  return true;
};

function generateCardItemSchema(component) {
  const defaults: { [key: string]: ISchema } = {
    'Markdown.Void': {
      type: 'void',
      default: '这是一段演示文字，**支持使用 Markdown 语法**',
      'x-designable-bar': 'Markdown.Void.DesignableBar',
      'x-decorator': 'CardItem',
      'x-read-pretty': true,
      'x-component': 'Markdown.Void',
    },
    Table: {
      type: 'array',
      'x-designable-bar': 'Table.DesignableBar',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
      default: [
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
        // { key: uid(), field1: uid(), field2: uid() },
      ],
      'x-component-props': {
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
                  content: '删除后无法恢复，确定要删除吗？'
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
    },
    Form: {
      type: 'void',
      name: uid(),
      'x-decorator': 'CardItem',
      'x-component': 'Form',
      'x-component-props': {
        showDefaultButtons: true,
      },
      'x-designable-bar': 'Form.DesignableBar',
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
    Kanban: {
      type: 'array',
      'x-component': 'Kanban',
      'x-designable-bar': 'Kanban.DesignableBar',
      'x-component-props': {},
      'x-decorator': 'CardItem',
      'x-decorator-props': {
        style: {
          background: 'none',
        },
        bodyStyle: {
          padding: 0,
        },
      },
      properties: {
        create: {
          type: 'void',
          title: '添加卡片',
          // 'x-designable-bar': 'Kanban.AddCardDesignableBar',
          'x-component': 'Kanban.Card.AddNew',
          // 'x-decorator': 'AddNew.Displayed',
          'x-component-props': {
            type: 'text',
            icon: 'PlusOutlined',
          },
          properties: {
            modal: {
              type: 'void',
              title: '添加数据',
              'x-decorator': 'Form',
              'x-decorator-props': {
                useResource: '{{ Kanban.useCreateResource }}',
              },
              'x-component': 'Action.Drawer',
              'x-component-props': {
                useOkAction: '{{ Kanban.useCreateAction }}',
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
        card1: {
          type: 'void',
          name: uid(),
          'x-decorator': 'Form',
          'x-component': 'Kanban.Card',
          'x-designable-bar': 'Kanban.Card.DesignableBar',
          'x-read-pretty': true,
          'x-decorator-props': {
            useResource: '{{ Kanban.useRowResource }}',
          },
          properties: {},
        },
        view1: {
          type: 'void',
          title: '编辑数据',
          'x-decorator': 'Form',
          'x-component': 'Kanban.Card.View',
          'x-component-props': {
            useOkAction: '{{ Kanban.useUpdateAction }}',
          },
          'x-decorator-props': {
            useResource: '{{ Kanban.useSingleResource }}',
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
    Calendar: {
      type: 'array',
      name: 'calendar1',
      'x-component': 'Calendar',
      'x-designable-bar': 'Calendar.DesignableBar',
      'x-decorator': 'CardItem',
      default: [],
      properties: {
        toolbar: {
          type: 'void',
          'x-component': 'Calendar.Toolbar',
          properties: {
            today: {
              type: 'void',
              title: '今天',
              'x-designable-bar': 'Calendar.ActionDesignableBar',
              'x-component': 'Calendar.Today',
              'x-align': 'left',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'today',
              },
            },
            nav: {
              type: 'void',
              title: '翻页',
              'x-designable-bar': 'Calendar.ActionDesignableBar',
              'x-component': 'Calendar.Nav',
              'x-align': 'left',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'nav',
              },
            },
            title: {
              type: 'void',
              title: '标题',
              'x-designable-bar': 'Calendar.ActionDesignableBar',
              'x-component': 'Calendar.Title',
              'x-align': 'left',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'title',
              },
            },
            viewSelect: {
              type: 'void',
              title: '视图切换',
              'x-designable-bar': 'Calendar.ActionDesignableBar',
              'x-component': 'Calendar.ViewSelect',
              'x-align': 'right',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'viewSelect',
              },
            },
            filter: {
              type: 'void',
              title: '筛选',
              'x-align': 'right',
              'x-designable-bar': 'Calendar.Filter.DesignableBar',
              'x-component': 'Calendar.Filter',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'filter',
              },
            },
            create: {
              type: 'void',
              title: '添加',
              'x-align': 'right',
              'x-designable-bar': 'Calendar.ActionDesignableBar',
              'x-component': 'Action',
              'x-decorator': 'AddNew.Displayed',
              'x-decorator-props': {
                displayName: 'create',
              },
              'x-component-props': {
                type: 'primary',
                icon: 'PlusOutlined',
              },
              properties: {
                modal: {
                  type: 'void',
                  title: '添加数据',
                  'x-decorator': 'Form',
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    useOkAction: '{{ Calendar.useCreateAction }}',
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
        event: {
          type: 'void',
          'x-component': 'Calendar.Event',
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
    'Chart.Column': {
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Chart.Column',
      'x-designable-bar': 'Chart.DesignableBar',
      'x-component-props': {
        config: cloneDeep(columnChartConfig),
      },
    },
    'Chart.Bar': {
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Chart.Bar',
      'x-designable-bar': 'Chart.DesignableBar',
      'x-component-props': {
        config: cloneDeep(barChartConfig),
      },
    },
    'Ref.ActionLogs': {
      type: 'array',
      name: 'table',
      'x-decorator': 'CardItem',
      'x-component': 'Table',
      'x-designable-bar': 'Table.SimpleDesignableBar',
      default: [],
      'x-component-props': {
        useResource: '{{ Table.useActionLogsResource }}',
        collectionName: 'action_logs',
        rowKey: 'id',
        // dragSort: true,
        showIndex: true,
        defaultSort: ['-id'],
        defaultAppends: ['user', 'collection'],
        refreshRequestOnChange: true,
        pagination: {
          pageSize: 10,
        },
      },
      properties: {
        [uid()]: {
          type: 'void',
          'x-component': 'Table.ActionBar',
          properties: {
            [uid()]: {
              type: 'void',
              title: '筛选',
              'x-align': 'left',
              'x-component': 'Table.Filter',
              'x-component-props': {
                fieldNames: [],
              },
              properties: {
                column1: {
                  type: 'void',
                  title: '操作类型',
                  'x-component': 'Filter.Column',
                  'x-component-props': {
                    operations: [
                      {
                        label: '等于',
                        value: 'eq',
                        selected: true,
                        schema: { 'x-component': 'Select' },
                      },
                      {
                        label: '不等于',
                        value: 'ne',
                        schema: { 'x-component': 'Select' },
                      },
                      {
                        label: '包含',
                        value: 'in',
                        schema: {
                          'x-component': 'Select',
                          'x-component-props': { mode: 'tags' },
                        },
                      },
                      {
                        label: '不包含',
                        value: 'notIn',
                        schema: {
                          'x-component': 'Select',
                          'x-component-props': { mode: 'tags' },
                        },
                      },
                      { label: '非空', value: '$notNull', noValue: true },
                      { label: '为空', value: '$null', noValue: true },
                    ],
                  },
                  properties: {
                    type: {
                      type: 'string',
                      'x-component': 'Select',
                      enum: [
                        { label: '新增', value: 'create', color: 'green' },
                        { label: '更新', value: 'update', color: 'blue' },
                        { label: '删除', value: 'destroy', color: 'red' },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        column1: {
          type: 'void',
          title: '操作时间',
          'x-component': 'Table.Column',
          properties: {
            created_at: {
              type: 'string',
              'x-component': 'DatePicker',
              'x-read-pretty': true,
              'x-component-props': {
                format: 'YYYY-MM-DD HH:mm:ss',
              },
            },
          },
        },
        column2: {
          type: 'void',
          title: '操作用户',
          'x-component': 'Table.Column',
          properties: {
            'user.nickname': {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
        column3: {
          type: 'void',
          title: '数据表',
          'x-component': 'Table.Column',
          properties: {
            'collection.title': {
              type: 'string',
              'x-component': 'Input',
              'x-read-pretty': true,
            },
          },
        },
        column4: {
          type: 'void',
          title: '操作类型',
          'x-component': 'Table.Column',
          properties: {
            type: {
              type: 'string',
              'x-component': 'Select',
              'x-read-pretty': true,
              enum: [
                { label: '新增', value: 'create', color: 'green' },
                { label: '更新', value: 'update', color: 'blue' },
                { label: '删除', value: 'destroy', color: 'red' },
              ],
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: '操作',
          'x-component': 'Table.Column',
          'x-component-props': {
            width: 60,
            align: 'center',
          },
          properties: {
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: '查看',
              'x-component': 'Action',
              'x-component-props': {
                type: 'link',
                style: {
                  padding: '0',
                  height: 'auto',
                },
              },
              'x-action-type': 'view',
              properties: {
                [uid()]: {
                  type: 'void',
                  title: '查看数据',
                  'x-read-pretty': true,
                  'x-decorator': 'Form',
                  'x-decorator-props': {
                    useResource: '{{ Table.useActionLogDetailsResource }}',
                  },
                  'x-component': 'Action.Drawer',
                  'x-component-props': {
                    // bodyStyle: {
                    //   background: '#f0f2f5',
                    //   // paddingTop: 0,
                    // },
                  },
                  properties: {
                    created_at: {
                      type: 'string',
                      title: '操作时间',
                      'x-decorator': 'FormItem',
                      'x-component': 'DatePicker',
                      'x-read-pretty': true,
                      'x-component-props': {
                        format: 'YYYY-MM-DD HH:mm:ss',
                      },
                    },
                    'user.nickname': {
                      type: 'string',
                      title: '操作用户',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                    'collection.title': {
                      type: 'string',
                      title: '数据表',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                    type: {
                      type: 'string',
                      title: '操作类型',
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-read-pretty': true,
                      enum: [
                        {
                          label: '新增',
                          value: 'create',
                          color: 'green',
                        },
                        {
                          label: '更新',
                          value: 'update',
                          color: 'blue',
                        },
                        {
                          label: '删除',
                          value: 'destroy',
                          color: 'red',
                        },
                      ],
                    },
                    changes: {
                      type: 'array',
                      title: '数据变动',
                      'x-decorator': 'FormItem',
                      'x-component': 'ArrayTable',
                      'x-component-props': {
                        pagination: false,
                        // scroll: { x: '100%' },
                      },
                      // 'x-reactions': ['{{ filterActionLogs }}'],
                      items: {
                        type: 'object',
                        properties: {
                          column0: {
                            type: 'void',
                            'x-component': 'ArrayTable.Column',
                            'x-component-props': {
                              width: 80,
                              align: 'center',
                            },
                            properties: {
                              index: {
                                type: 'void',
                                'x-component': 'ArrayTable.Index',
                              },
                            },
                          },
                          column1: {
                            type: 'void',
                            'x-component': 'ArrayTable.Column',
                            'x-component-props': { title: '字段名称' },
                            properties: {
                              field: {
                                type: 'string',
                                'x-decorator': 'FormilyFormItem',
                                'x-component': 'ActionLogs.Field',
                              },
                            },
                          },
                          column3: {
                            type: 'void',
                            'x-component': 'ArrayTable.Column',
                            'x-component-props': { title: '操作前' },
                            properties: {
                              before: {
                                type: 'string',
                                'x-decorator': 'FormilyFormItem',
                                'x-component': 'ActionLogs.FieldValue',
                              },
                            },
                          },
                          column4: {
                            type: 'void',
                            'x-component': 'ArrayTable.Column',
                            'x-component-props': { title: '操作后' },
                            properties: {
                              after: {
                                type: 'string',
                                'x-decorator': 'FormilyFormItem',
                                'x-component': 'ActionLogs.FieldValue',
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
        },
      },
    },
  };
  return defaults[component];
}

function generateFormItemSchema(component) {
  const defaults = {
    Markdown: {
      type: 'string',
      title: uid(),
      'x-designable-bar': 'Markdown.DesignableBar',
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-component-props': {},
    },
  };
  return defaults[component];
}

const dbSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      title: '数据表名称',
      required: true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
    name: {
      type: 'string',
      title: '数据表标识',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-read-pretty': true,
    },
    generalFields: {
      type: 'array',
      title: '数据表字段',
      'x-decorator': 'FormItem',
      'x-component': 'DatabaseField',
      default: [],
    },
  },
};

export const AddNew = () => null;

AddNew.CardItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const { collections = [], loading, refresh } = useCollectionsContext();
  return (
    <Dropdown
      trigger={['hover']}
      overlayStyle={{
        minWidth: 200,
      }}
      onVisibleChange={(visible) => {
        console.log('onVisibleChange', visible);
      }}
      overlay={
        <Menu
          onClick={async (info) => {
            if (info.key.startsWith('Calendar.')) {
              return;
            }
            if (info.key.startsWith('Kanban.')) {
              return;
            }
            let data: ISchema;
            let collectionName = null;
            let isNew = false;
            if (['addNewTable', 'addNewForm'].includes(info.key)) {
              const values = await FormDialog(`创建数据表`, () => {
                return (
                  <FormLayout layout={'vertical'}>
                    <SchemaField schema={dbSchema} />
                  </FormLayout>
                );
              }).open({
                initialValues: {
                  name: `t_${uid()}`,
                  fields: [],
                },
              });
              await createOrUpdateCollection(values);
              isNew = true;
              data = generateCardItemSchema(
                info.key === 'addNewTable' ? 'Table' : 'Form',
              );
              collectionName = values.name;
            } else if (info.key.startsWith('collection.')) {
              const keys = info.key.split('.');
              const component = keys.pop();
              const tableName = keys.pop();
              collectionName = tableName;
              data = generateCardItemSchema(component);
              console.log('info.keyPath', component, tableName);
            } else {
              data = generateCardItemSchema(info.key);
              console.log('generateCardItemSchema', data, info.key);
            }
            if (schema['key']) {
              data['key'] = uid();
            }
            if (collectionName) {
              data['x-component-props'] = data['x-component-props'] || {};
              data['x-component-props']['resource'] = collectionName;
              data['x-component-props']['collectionName'] = collectionName;
            }
            if (isGridBlock(schema)) {
              path.pop();
              path.pop();
              data = generateGridBlock(data);
            } else if (isGrid(schema)) {
              data = generateGridBlock(data);
            }
            if (data) {
              let s;
              if (isGrid(schema)) {
                s = appendChild(data, [...path]);
              } else if (defaultAction === 'insertAfter') {
                s = insertAfter(data, [...path]);
              } else {
                s = insertBefore(data, [...path]);
              }
              await createSchema(s);
            }
            if (isNew) {
              await refresh();
            }
          }}
        >
          <Menu.ItemGroup title={'数据区块'}>
            {[
              { key: 'Table', title: '表格', icon: 'TableOutlined' },
              { key: 'Form', title: '表单', icon: 'FormOutlined' },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup
                  className={'display-fields'}
                  key={`${view.key}-select`}
                  title={'选择数据源'}
                >
                  {collections?.map((item) => (
                    <Menu.Item
                      style={{ minWidth: 150 }}
                      key={`collection.${item.name}.${view.key}`}
                    >
                      {item.title}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                <Menu.Divider></Menu.Divider>
                <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item>
              </Menu.SubMenu>
            ))}
            {[
              {
                key: 'Calendar',
                title: '日历',
                icon: 'CalendarOutlined',
                // disabled: true,
              },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup
                  className={'display-fields'}
                  key={`${view.key}-select`}
                  title={'选择数据源'}
                >
                  {collections?.map((item) => (
                    <Menu.Item
                      style={{ minWidth: 150 }}
                      key={`Calendar.collection.${item.name}.${view.key}`}
                      onClick={async () => {
                        const values = await FormDialog(`日历配置`, () => {
                          return (
                            <FormLayout layout={'vertical'}>
                              <SchemaField
                                schema={{
                                  type: 'object',
                                  properties: {
                                    title: {
                                      type: 'string',
                                      title: '标题字段',
                                      required: true,
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields?.map(
                                        (field) => {
                                          return {
                                            label: field?.uiSchema.title,
                                            value: field?.name,
                                          };
                                        },
                                      ),
                                    },
                                    start: {
                                      title: '开始日期字段',
                                      required: true,
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields
                                        ?.filter(
                                          (field) => field.dataType === 'date',
                                        )
                                        ?.map((field) => {
                                          return {
                                            label: field?.uiSchema.title,
                                            value: field?.name,
                                          };
                                        }),
                                    },
                                    end: {
                                      title: '结束日期字段',
                                      'x-decorator': 'FormItem',
                                      'x-component': 'Select',
                                      enum: item?.generalFields
                                        ?.filter(
                                          (field) => field.dataType === 'date',
                                        )
                                        ?.map((field) => {
                                          return {
                                            label: field?.uiSchema.title,
                                            value: field?.name,
                                          };
                                        }),
                                    },
                                  },
                                }}
                              />
                            </FormLayout>
                          );
                        }).open({});
                        let data = generateCardItemSchema('Calendar');
                        const collectionName = item.name;
                        if (schema['key']) {
                          data['key'] = uid();
                        }
                        console.log('fieldNames', values);
                        if (collectionName) {
                          data['x-component-props'] =
                            data['x-component-props'] || {};
                          data['x-component-props']['resource'] =
                            collectionName;
                          data['x-component-props']['collectionName'] =
                            collectionName;
                          data['x-component-props']['fieldNames'] = values;
                        }
                        if (isGridBlock(schema)) {
                          path.pop();
                          path.pop();
                          data = generateGridBlock(data);
                        } else if (isGrid(schema)) {
                          data = generateGridBlock(data);
                        }
                        if (data) {
                          let s;
                          if (isGrid(schema)) {
                            s = appendChild(data, [...path]);
                          } else if (defaultAction === 'insertAfter') {
                            s = insertAfter(data, [...path]);
                          } else {
                            s = insertBefore(data, [...path]);
                          }
                          await createSchema(s);
                        }
                      }}
                    >
                      {item.title}
                    </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                {/* <Menu.Divider></Menu.Divider> */}
                {/* <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item> */}
              </Menu.SubMenu>
            ))}
            {[
              {
                key: 'Kanban',
                title: '看板',
                icon: 'CreditCardOutlined',
                // disabled: true,
              },
            ].map((view) => (
              <Menu.SubMenu
                icon={<IconPicker type={view.icon} />}
                // disabled={view.disabled}
                key={view.key}
                title={view.title}
              >
                <Menu.ItemGroup
                  className={'display-fields'}
                  key={`${view.key}-select`}
                  title={'选择数据源'}
                >
                  {collections?.map((item) => (
                    <Menu.SubMenu
                      // style={{ minWidth: 150 }}
                      key={`collection.${item.name}.${view.key}`}
                      title={item.title}
                    >
                      <Menu.ItemGroup title={'选择分组字段'}>
                        {item?.generalFields
                          ?.filter((item) => {
                            return item?.uiSchema?.enum;
                          })
                          ?.map((field) => {
                            return (
                              <Menu.Item
                                style={{ minWidth: 150 }}
                                key={`Kanban.collection.${field.name}.${view.key}`}
                                onClick={async () => {
                                  let data = generateCardItemSchema('Kanban');
                                  const collectionName = item.name;
                                  if (schema['key']) {
                                    data['key'] = uid();
                                  }
                                  if (collectionName) {
                                    data['x-component-props'] =
                                      data['x-component-props'] || {};
                                    data['x-component-props']['resource'] =
                                      collectionName;
                                    data['x-component-props'][
                                      'collectionName'
                                    ] = collectionName;
                                    data['x-component-props']['groupField'] = {
                                      name: field.name,
                                    };
                                  }
                                  if (isGridBlock(schema)) {
                                    path.pop();
                                    path.pop();
                                    data = generateGridBlock(data);
                                  } else if (isGrid(schema)) {
                                    data = generateGridBlock(data);
                                  }
                                  if (data) {
                                    let s;
                                    if (isGrid(schema)) {
                                      s = appendChild(data, [...path]);
                                    } else if (
                                      defaultAction === 'insertAfter'
                                    ) {
                                      s = insertAfter(data, [...path]);
                                    } else {
                                      s = insertBefore(data, [...path]);
                                    }
                                    await createSchema(s);
                                  }
                                }}
                              >
                                {field?.uiSchema?.title}
                              </Menu.Item>
                            );
                          })}
                      </Menu.ItemGroup>
                    </Menu.SubMenu>
                    // <Menu.Item
                    //   style={{ minWidth: 150 }}
                    //   key={`collection.${item.name}.${view.key}`}
                    // >
                    //   {item.title}
                    // </Menu.Item>
                  ))}
                </Menu.ItemGroup>
                {/* <Menu.Divider></Menu.Divider>
                <Menu.Item icon={<PlusOutlined />} key={`addNew${view.key}`}>
                  创建数据表
                </Menu.Item> */}
              </Menu.SubMenu>
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={'多媒体区块'}>
            <Menu.Item
              key={'Markdown.Void'}
              icon={<IconPicker type={'FileMarkdownOutlined'} />}
            >
              Markdown
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Wysiwyg.Void'}
              icon={<IconPicker type={'FileTextOutlined'} />}
            >
              富文本
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.ItemGroup title={'图表区块'}>
            <Menu.Item
              key={'Chart.Column'}
              icon={<IconPicker type={'BarChartOutlined'} />}
            >
              柱状图
            </Menu.Item>
            <Menu.Item
              key={'Chart.Bar'}
              icon={<IconPicker type={'BarChartOutlined'} />}
            >
              条形图
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Chart.Line'}
              icon={<IconPicker type={'LineChartOutlined'} />}
            >
              折线图
            </Menu.Item>
            <Menu.Item
              disabled
              key={'Chart.Pie'}
              icon={<IconPicker type={'PieChartOutlined'} />}
            >
              饼图
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu key={'Ref'} icon={<LinkOutlined />} title={'引用模板'}>
            <Menu.ItemGroup key={'form-select'} title={'选择模板'}>
              <Menu.Item key={'Ref.ActionLogs'}>操作日志</Menu.Item>
            </Menu.ItemGroup>
            <Menu.Divider></Menu.Divider>
            <Menu.Item disabled key={'addNewRef'}>
              添加模板
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button
          type={'dashed'}
          className={'designable-btn designable-btn-dash'}
          icon={<PlusOutlined />}
        >
          创建区块
        </Button>
      )}
    </Dropdown>
  );
});

AddNew.FormItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild, deepRemove } =
    useDesignable();
  const path = useSchemaPath();
  const { collection, fields, refresh } = useCollectionContext();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      overlay={
        <Menu>
          <Menu.ItemGroup className={'display-fields'} title={`显示字段`}>
            {fields?.map((field) => (
              <SwitchMenuItem
                key={field.key}
                title={field?.uiSchema?.title}
                checked={displayed.has(field.name)}
                onChange={async (checked) => {
                  if (!checked) {
                    const s: any = displayed.get(field.name);
                    const p = getSchemaPath(s);
                    const removed = deepRemove(p);
                    if (!removed) {
                      console.log('getSchemaPath', p, removed);
                      return;
                    }
                    const last = removed.pop();
                    displayed.remove(field.name);
                    if (isGridRowOrCol(last)) {
                      await removeSchema(last);
                    }
                    return;
                  }
                  let data: ISchema = {
                    key: uid(),
                    type: 'void',
                    'x-decorator': 'Form.Field.Item',
                    'x-designable-bar': 'Form.Field.DesignableBar',
                    'x-component': 'Form.Field',
                    'x-component-props': {
                      fieldName: field.name,
                    },
                  };
                  if (isGridBlock(schema)) {
                    path.pop();
                    path.pop();
                    data = generateGridBlock(data);
                  } else if (isGrid(schema)) {
                    data = generateGridBlock(data);
                  }
                  if (data) {
                    let s;
                    if (isGrid(schema)) {
                      s = appendChild(data, [...path]);
                    } else if (defaultAction === 'insertAfter') {
                      s = insertAfter(data, [...path]);
                    } else {
                      s = insertBefore(data, [...path]);
                    }
                    await createSchema(s);
                  }
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu
            popupClassName={'add-new-fields-popup'}
            className={'sub-menu-add-new-fields'}
            title={'添加字段'}
          >
            {options.map(
              (option) =>
                option.children.length > 0 && (
                  <Menu.ItemGroup title={option.label}>
                    {option.children.map((item) => (
                      <Menu.Item
                        style={{ minWidth: 150 }}
                        key={item.name}
                        onClick={async () => {
                          setVisible(false);
                          const values = await FormDialog(`添加字段`, () => {
                            return (
                              <FormLayout layout={'vertical'}>
                                <SchemaField schema={item} />
                              </FormLayout>
                            );
                          }).open({
                            initialValues: {
                              interface: item.name,
                              ...item.default,
                              key: uid(),
                              name: `f_${uid()}`,
                            },
                          });
                          await createCollectionField(collection?.name, values);
                          let data: ISchema = cloneDeep(values.uiSchema);
                          data['name'] = values.name;
                          data['referenceKey'] = data['key'];
                          data['key'] = uid();
                          if (isGridBlock(schema)) {
                            path.pop();
                            path.pop();
                            data = generateGridBlock(data);
                          } else if (isGrid(schema)) {
                            data = generateGridBlock(data);
                          }
                          if (data) {
                            let s;
                            if (isGrid(schema)) {
                              s = appendChild(data, [...path]);
                            } else if (defaultAction === 'insertAfter') {
                              s = insertAfter(data, [...path]);
                            } else {
                              s = insertBefore(data, [...path]);
                            }
                            await createSchema(s);
                          }
                          await refresh();
                        }}
                      >
                        {item.title}
                      </Menu.Item>
                    ))}
                  </Menu.ItemGroup>
                ),
            )}
          </Menu.SubMenu>
          {/* <Menu.Divider /> */}
          <Menu.Item
            onClick={async () => {
              let data: ISchema = {
                type: 'void',
                default: '这是一段演示文字，**支持使用 Markdown 语法**',
                'x-designable-bar': 'Markdown.Void.DesignableBar',
                'x-decorator': 'FormItem',
                'x-read-pretty': true,
                'x-component': 'Markdown.Void',
              };
              if (schema['key']) {
                data['key'] = uid();
              }
              if (isGridBlock(schema)) {
                path.pop();
                path.pop();
                data = generateGridBlock(data);
              } else if (isGrid(schema)) {
                data = generateGridBlock(data);
              }
              if (data) {
                let s;
                if (isGrid(schema)) {
                  s = appendChild(data, [...path]);
                } else if (defaultAction === 'insertAfter') {
                  s = insertAfter(data, [...path]);
                } else {
                  s = insertBefore(data, [...path]);
                }
                console.log('ISchema', schema, data, path);
                await createSchema(s);
              }
              setVisible(false);
            }}
          >
            添加说明文字
          </Menu.Item>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button
          type={'dashed'}
          className={'designable-btn designable-btn-dash'}
          icon={<SettingOutlined />}
        >
          配置字段
        </Button>
      )}
    </Dropdown>
  );
});

AddNew.PaneItem = observer((props: any) => {
  const { ghost, defaultAction } = props;
  const { schema, insertBefore, insertAfter, appendChild } = useDesignable();
  const path = useSchemaPath();
  const [visible, setVisible] = useState(false);
  const blockSchema = useContext(BlockSchemaContext);
  const useResource = `{{ ${blockSchema['x-component']}.useResource }}`;
  console.log('AddNew.PaneItem.useResource', useResource);
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlayStyle={{
        minWidth: 200,
      }}
      // placement={'bottomCenter'}
      overlay={
        <Menu>
          <Menu.ItemGroup title={'数据区块'}>
            <Menu.Item
              icon={<IconPicker type={'FileOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-read-pretty': true,
                  'x-component-props': {
                    useResource,
                  },
                  'x-designable-bar': 'Form.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Action.Bar',
                      'x-designable-bar': 'Action.Bar.DesignableBar',
                      'x-component-props': {},
                    },
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                    },
                  },
                };
                if (isGridBlock(schema)) {
                  path.pop();
                  path.pop();
                  data = generateGridBlock(data);
                } else if (isGrid(schema)) {
                  data = generateGridBlock(data);
                }
                if (data) {
                  let s;
                  if (isGrid(schema)) {
                    s = appendChild(data, [...path]);
                  } else if (defaultAction === 'insertAfter') {
                    s = insertAfter(data, [...path]);
                  } else {
                    s = insertBefore(data, [...path]);
                  }
                  await createSchema(s);
                }
                setVisible(false);
              }}
              style={{ minWidth: 150 }}
            >
              详情
            </Menu.Item>
            <Menu.Item
              icon={<IconPicker type={'FormOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  type: 'void',
                  name: uid(),
                  'x-decorator': 'CardItem',
                  'x-component': 'Form',
                  'x-component-props': {
                    useResource,
                    showDefaultButtons: true,
                  },
                  'x-designable-bar': 'Form.DesignableBar',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      'x-component': 'Grid',
                      'x-component-props': {
                        addNewComponent: 'AddNew.FormItem',
                      },
                    },
                  },
                };
                if (isGridBlock(schema)) {
                  path.pop();
                  path.pop();
                  data = generateGridBlock(data);
                } else if (isGrid(schema)) {
                  data = generateGridBlock(data);
                }
                if (data) {
                  let s;
                  if (isGrid(schema)) {
                    s = appendChild(data, [...path]);
                  } else if (defaultAction === 'insertAfter') {
                    s = insertAfter(data, [...path]);
                  } else {
                    s = insertBefore(data, [...path]);
                  }
                  await createSchema(s);
                }
                setVisible(false);
              }}
            >
              表单
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup title={'相关数据区块'}>
            <Menu.Item
              style={{ minWidth: 150 }}
              icon={<IconPicker type={'HistoryOutlined'} />}
              onClick={async () => {
                let data: ISchema = generateCardItemSchema('Ref.ActionLogs');
                if (isGridBlock(schema)) {
                  path.pop();
                  path.pop();
                  data = generateGridBlock(data);
                } else if (isGrid(schema)) {
                  data = generateGridBlock(data);
                }
                if (data) {
                  let s;
                  if (isGrid(schema)) {
                    s = appendChild(data, [...path]);
                  } else if (defaultAction === 'insertAfter') {
                    s = insertAfter(data, [...path]);
                  } else {
                    s = insertBefore(data, [...path]);
                  }
                  await createSchema(s);
                }
                setVisible(false);
              }}
            >
              日志
            </Menu.Item>
            {/* <Menu.Item icon={<IconPicker type={'CommentOutlined'} />}>
              评论
            </Menu.Item> */}
          </Menu.ItemGroup>
          <Menu.ItemGroup title={'多媒体区块'}>
            <Menu.Item
              icon={<IconPicker type={'FileMarkdownOutlined'} />}
              onClick={async () => {
                let data: ISchema = {
                  key: uid(),
                  type: 'void',
                  default: '这是一段演示文字，**支持使用 Markdown 语法**',
                  'x-designable-bar': 'Markdown.Void.DesignableBar',
                  'x-decorator': 'CardItem',
                  'x-read-pretty': true,
                  'x-component': 'Markdown.Void',
                };
                if (isGridBlock(schema)) {
                  path.pop();
                  path.pop();
                  data = generateGridBlock(data);
                } else if (isGrid(schema)) {
                  data = generateGridBlock(data);
                }
                if (data) {
                  let s;
                  if (isGrid(schema)) {
                    s = appendChild(data, [...path]);
                  } else if (defaultAction === 'insertAfter') {
                    s = insertAfter(data, [...path]);
                  } else {
                    s = insertBefore(data, [...path]);
                  }
                  await createSchema(s);
                }
                setVisible(false);
              }}
            >
              Markdown
            </Menu.Item>
          </Menu.ItemGroup>
        </Menu>
      }
    >
      {ghost ? (
        <PlusOutlined />
      ) : (
        <Button
          className={'designable-btn designable-btn-dash'}
          type={'dashed'}
          icon={<PlusOutlined />}
        >
          创建区块
        </Button>
      )}
    </Dropdown>
  );
});

AddNew.Displayed = observer((props: any) => {
  const { displayName, children } = props;
  const displayed = useDisplayedMapContext();
  const { schema } = useDesignable();
  useEffect(() => {
    if (displayName) {
      displayed.set(displayName, schema);
    }
  }, [displayName, schema]);
  return children;
});

export default AddNew;
