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

# Table - 表格

```tsx
import React from 'react';
import { SchemaRenderer } from '../';
import { uid } from '@formily/shared';

const schema = {
  name: `t_${uid()}`,
  type: 'array',
  'x-component': 'Table',
  default: [{ field1: 'a1', field2: 'b1' }, { field1: 'a2', field2: 'b2' }],
  'x-component-props': {},
  properties: {
    [`a_${uid()}`]: {
      type: 'void',
      'x-component': 'Table.ActionBar',
      properties: {
        action1: {
          type: 'object',
          title: '按钮1',
          'x-component': 'Table.BulkAction.Popover',
          'x-component-props': {},
          properties: {},
        },
        action2: {
          type: 'void',
          title: '按钮2',
          'x-component': 'Table.BulkAction',
          'x-component-props': {},
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
        width: 100,
        // DesignableBar: 'Table.Column.DesignableBar',
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

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```