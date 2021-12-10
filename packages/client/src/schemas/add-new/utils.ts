import React from 'react';
import { Schema } from '@formily/react';
import { ISchema } from '../';
import { uid } from '@formily/shared';
import { cloneDeep } from 'lodash';

import { barChartConfig, columnChartConfig } from './chart';
import { i18n } from '../../i18n';

export const generateGridBlock = (schema: ISchema) => {
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

export const isGrid = (schema: Schema) => {
  return schema['x-component'] === 'Grid';
};

export const isGridBlock = (schema: Schema) => {
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

export const generateCardItemSchema = (component) => {
  const defaults: { [key: string]: ISchema } = {
    'Markdown.Void': {
      type: 'void',
      default: i18n.t('This is a demo text, **supports Markdown syntax**.'),
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
      default: [],
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
              title: "{{t('Filter')}}",
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
              title: "{{t('Delete')}}",
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
                  title: "{{t('Delete record')}}",
                  content: "{{t('Are you sure you want to delete it?')}}",
                },
                useAction: '{{ Table.useTableDestroyAction }}',
              },
            },
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: "{{t('Add new')}}",
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
                  title: "{{t('Add record')}}",
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
          title: '{{t("Actions")}}',
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
                  title: "{{t('View')}}",
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'link',
                  },
                  'x-designable-bar': 'Table.Action.DesignableBar',
                  'x-action-type': 'view',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: "{{t('View record')}}",
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
                              title: "{{t('Details')}}",
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
                  title: "{{t('Edit')}}",
                  'x-component': 'Action',
                  'x-component-props': {
                    type: 'link',
                  },
                  'x-designable-bar': 'Table.Action.DesignableBar',
                  'x-action-type': 'update',
                  properties: {
                    [uid()]: {
                      type: 'void',
                      title: "{{t('Edit record')}}",
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
    Descriptions: {
      type: 'void',
      name: uid(),
      'x-decorator': 'CardItem',
      'x-component': 'Form',
      'x-read-pretty': true,
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
          title: "{{t('Add card')}}",
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
              title: "{{t('Add record')}}",
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
          title: "{{t('Edit record')}}",
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
              title: "{{t('Today')}}",
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
              title: "{{t('Navigate')}}",
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
              title: "{{t('Title')}}",
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
              title: "{{t('Select view')}}",
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
              title: "{{t('Filter')}}",
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
              title: "{{t('Add new')}}",
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
                  title: "{{t('Add record')}}",
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
                  title: "{{t('Details')}}",
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
        config: cloneDeep(columnChartConfig[i18n.language] || columnChartConfig['en-US']),
      },
    },
    'Chart.Bar': {
      type: 'void',
      'x-decorator': 'CardItem',
      'x-component': 'Chart.Bar',
      'x-designable-bar': 'Chart.DesignableBar',
      'x-component-props': {
        config: cloneDeep(barChartConfig[i18n.language] || barChartConfig['en-US']),
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
              title: "{{t('Filter')}}",
              'x-align': 'left',
              'x-component': 'Table.Filter',
              'x-component-props': {
                fieldNames: [],
              },
              properties: {
                column1: {
                  type: 'void',
                  title: "{{t('Action type')}}",
                  'x-component': 'Filter.Column',
                  'x-component-props': {
                    operations: [
                      {
                        label: "{{ t('is') }}",
                        value: 'eq',
                        selected: true,
                        schema: { 'x-component': 'Select' },
                      },
                      {
                        label: "{{ t('is not') }}",
                        value: 'ne',
                        schema: { 'x-component': 'Select' },
                      },
                      {
                        label: "{{ t('contains') }}",
                        value: 'in',
                        schema: {
                          'x-component': 'Select',
                          'x-component-props': { mode: 'tags' },
                        },
                      },
                      {
                        label: "{{ t('does not contain') }}",
                        value: 'notIn',
                        schema: {
                          'x-component': 'Select',
                          'x-component-props': { mode: 'tags' },
                        },
                      },
                      {
                        label: "{{ t('is empty') }}",
                        value: '$null',
                        noValue: true,
                      },
                      {
                        label: "{{ t('is not empty') }}",
                        value: '$notNull',
                        noValue: true,
                      },
                    ],
                  },
                  properties: {
                    type: {
                      type: 'string',
                      'x-component': 'Select',
                      enum: [
                        {
                          label: "{{ t('Insert') }}",
                          value: 'create',
                          color: 'green',
                        },
                        {
                          label: "{{ t('Update') }}",
                          value: 'update',
                          color: 'blue',
                        },
                        {
                          label: "{{ t('Delete') }}",
                          value: 'destroy',
                          color: 'red',
                        },
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
          title: "{{t('Created at')}}",
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
          title: "{{t('Created by')}}",
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
          title: "{{t('Collection display name')}}",
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
          title: "{{t('Action type')}}",
          'x-component': 'Table.Column',
          properties: {
            type: {
              type: 'string',
              'x-component': 'Select',
              'x-read-pretty': true,
              enum: [
                { label: "{{ t('Insert') }}", value: 'create', color: 'green' },
                { label: "{{ t('Update') }}", value: 'update', color: 'blue' },
                { label: "{{ t('Delete') }}", value: 'destroy', color: 'red' },
              ],
            },
          },
        },
        [uid()]: {
          type: 'void',
          title: "{{t('Actions')}}",
          'x-component': 'Table.Column',
          'x-component-props': {
            width: 60,
            align: 'center',
          },
          properties: {
            [uid()]: {
              type: 'void',
              name: 'action1',
              title: "{{t('View')}}",
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
                  title: "{{t('View record')}}",
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
                      title: "{{t('Created at')}}",
                      'x-decorator': 'FormItem',
                      'x-component': 'DatePicker',
                      'x-read-pretty': true,
                      'x-component-props': {
                        format: 'YYYY-MM-DD HH:mm:ss',
                      },
                    },
                    'user.nickname': {
                      type: 'string',
                      title: "{{t('Created by')}}",
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                    'collection.title': {
                      type: 'string',
                      title: "{{t('Collection display name')}}",
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-read-pretty': true,
                    },
                    type: {
                      type: 'string',
                      title: "{{t('Action type')}}",
                      'x-decorator': 'FormItem',
                      'x-component': 'Select',
                      'x-read-pretty': true,
                      enum: [
                        {
                          label: "{{t('Insert')}}",
                          value: 'create',
                          color: 'green',
                        },
                        {
                          label: "{{t('Update')}}",
                          value: 'update',
                          color: 'blue',
                        },
                        {
                          label: "{{t('Delete')}}",
                          value: 'destroy',
                          color: 'red',
                        },
                      ],
                    },
                    changes: {
                      type: 'array',
                      title: "{{t('Data changes')}}",
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
                            'x-component-props': { title: "{{t('Field display name')}}" },
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
                            'x-component-props': { title: "{{ t('Before change') }}" },
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
                            'x-component-props': { title: "{{ t('After change') }}" },
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
};

export const generateFormItemSchema = (component) => {
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
};
