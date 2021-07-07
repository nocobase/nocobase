import React from 'react';
import { SchemaRenderer } from '../../';
import { uid } from '@formily/shared';
import Editor from '@monaco-editor/react';
import { createForm } from '@formily/core';
import { observer } from '@formily/react';

const schema = {
  name: `t_${uid()}`,
  type: 'array',
  'x-component': 'Table',
  // default: [
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  //   { key: uid(), field1: uid(), field2: uid() },
  // ],
  'x-component-props': {
    rowKey: 'key',
    // isRemoteDataSource: true,
  },
  properties: {
    [`a_${uid()}`]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      properties: {
        action1: {
          type: 'void',
          name: 'action1',
          title: '筛选',
          'x-component': 'Action',
          properties: {
            popover1: {
              type: 'void',
              title: '弹窗标题',
              'x-component': 'Action.Popover',
              'x-component-props': {},
              properties: {
                [uid()]: {
                  name: 'form',
                  type: 'object',
                  'x-component': 'Form',
                  properties: {
                    filter: {
                      type: 'string',
                      title: '字段1',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    action: {
                      type: 'void',
                      title: '提交',
                      'x-component': 'Action',
                      'x-component-props': {
                        'useAction': '{{ useTableFilterAction }}'
                      },
                    }
                  }
                },
              },
            },
          },
        },
        action2: {
          type: 'void',
          name: 'action1',
          title: '新增',
          'x-component': 'Action',
          'x-designable-bar': 'Action.DesignableBar',
          properties: {
            drawer1: {
              type: 'void',
              title: '抽屉标题',
              'x-component': 'Action.Drawer',
              'x-component-props': {},
              properties: {
                [uid()]: {
                  name: 'form',
                  type: 'object',
                  'x-component': 'Form',
                  properties: {
                    field1: {
                      type: 'string',
                      title: '字段1',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    field2: {
                      type: 'string',
                      title: '字段2',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    action: {
                      type: 'void',
                      title: '提交',
                      'x-component': 'Action',
                      'x-component-props': {
                        'useAction': '{{ useTableCreateAction }}'
                      },
                    }
                  }
                },
              },
            },
          },
        },
        action3: {
          type: 'void',
          name: 'action1',
          title: '删除',
          'x-component': 'Action',
          'x-component-props': {
            'useAction': '{{ useTableDestroyAction }}'
          },
        },
      },
    },
    [`a_${uid()}`]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      'x-component-props': {
        align: 'bottom',
      },
      properties: {
        pagination: {
          type: 'void',
          'x-component': 'Table.Pagination',
          'x-component-props': {
            defaultPageSize: 5,
          },
        },
      },
    },
    [`c_${uid()}`]: {
      type: 'void',
      title: '排序',
      'x-component': 'Table.Column',
      properties: {
        sort: {
          type: 'void',
          'x-component': 'Table.SortHandle',
        },
      },
    },
    [`c_${uid()}`]: {
      type: 'void',
      title: '序号',
      'x-component': 'Table.Column',
      properties: {
        index: {
          type: 'void',
          'x-component': 'Table.Index',
        },
      },
    },
    [`c_${uid()}`]: {
      type: 'void',
      title: '字段1',
      'x-component': 'Table.Column',
      'x-component-props': {
        title: 'z1',
      },
      'x-designable-bar': 'Table.Column.DesignableBar',
      properties: {
        field1: {
          type: 'string',
          required: true,
          'x-read-pretty': true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    [`c_${uid()}`]: {
      type: 'void',
      title: '字段2',
      'x-component': 'Table.Column',
      properties: {
        field2: {
          type: 'string',
          // title: '字段2',
          required: true,
          'x-read-pretty': true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
    },
    [`col_${uid()}`]: {
      type: 'void',
      title: '操作',
      'x-component': 'Table.Column',
      properties: {
        action3: {
          type: 'void',
          title: '删除',
          'x-component': 'Action',
          'x-component-props': {
            'useAction': '{{ useTableDestroyAction }}'
          },
        },
        action2: {
          type: 'void',
          name: 'action1',
          title: '修改',
          'x-component': 'Action',
          'x-default-action': true,
          'x-designable-bar': 'Action.DesignableBar',
          properties: {
            drawer1: {
              type: 'void',
              title: '编辑表单',
              'x-component': 'Action.Drawer',
              'x-component-props': {},
              properties: {
                [uid()]: {
                  name: 'form',
                  type: 'void',
                  'x-component': 'Form',
                  'x-component-props': {
                    'useValues': '{{ useTableRow }}',
                  },
                  properties: {
                    field1: {
                      type: 'string',
                      title: '字段1',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    field2: {
                      type: 'string',
                      title: '字段2',
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                    },
                    action: {
                      type: 'void',
                      title: '提交',
                      'x-component': 'Action',
                      'x-component-props': {
                        'useAction': '{{ useTableUpdateAction }}'
                      },
                    }
                  }
                },
              },
            },
          },
        },
      },
    },
  },
};

const form = createForm();

export default observer(() => {
  return (
    <div>
      <SchemaRenderer form={form} schema={schema} />
      <Editor
        height="200px"
        defaultLanguage="json"
        value={JSON.stringify(form.values, null, 2)}
      />
    </div>
  )
});
