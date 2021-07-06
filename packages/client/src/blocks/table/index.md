---
title: Table - 表格
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

### Table.View

只做数据展示，不能用作表单字段

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { uid } from '@formily/shared';
import Editor from '@monaco-editor/react';
import { createForm } from '@formily/core';
import { observer } from '@formily/react';

const schema = {
  name: `t_${uid()}`,
  type: 'void',
  'x-component': 'Table.View',
  // default: [
  //   { key: uid(), field1: 'a1', field2: 'b1' },
  //   { key: uid(), field1: 'a2', field2: 'b2' },
  // ],
  'x-component-props': {},
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
                input: {
                  type: 'string',
                  'x-component': 'Input',
                }
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
                input: {
                  type: 'string',
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
                action2: {
                  type: 'void',
                  name: 'action1',
                  title: '提交',
                  'x-component': 'Action',
                  'x-component-props': {
                    'useAction': '{{ useTableCreateAction }}'
                  },
                }
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
            defaultCurrent: 1,
            total: 50,
          },
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
          title: '字段2',
          required: true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
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
```

### Table.Field

可用作表单字段

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { uid } from '@formily/shared';
import Editor from '@monaco-editor/react';
import { createForm } from '@formily/core';
import { observer } from '@formily/react';

const schema = {
  name: `t_${uid()}`,
  type: 'array',
  'x-component': 'Table.Field',
  // default: [
  //   { key: uid(), field1: 'a1', field2: 'b1' },
  //   { key: uid(), field1: 'a2', field2: 'b2' },
  // ],
  'x-component-props': {},
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
                input: {
                  type: 'string',
                  'x-component': 'Input',
                }
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
                action2: {
                  type: 'void',
                  name: 'action1',
                  title: '提交',
                  'x-component': 'Action',
                  'x-component-props': {
                  },
                }
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
            defaultCurrent: 1,
            total: 50,
          },
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
          title: '字段2',
          required: true,
          'x-decorator-props': {
            feedbackLayout: 'popover',
          },
          'x-decorator': 'FormItem',
          'x-component': 'Input',
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
```