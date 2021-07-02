---
title: DatabaseField - 数据表字段
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# DatabaseField - 数据表字段

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    array: {
      type: 'array',
      // title: '数据表字段',
      'x-component': 'DatabaseField.ArrayCollapse',
      'x-component-props': {
        accordion: true,
      },
      // maxItems: 3,
      'x-decorator': 'FormItem',
      items: {
        type: 'object',
        'x-component': 'DatabaseField.ArrayCollapse.CollapsePanel',
        'x-component-props': {
          header: '字段',
        },
        properties: {
          index: {
            type: 'void',
            'x-component': 'DatabaseField.ArrayCollapse.Index',
          },
          input: {
            type: 'string',
            'x-decorator': 'FormItem',
            title: 'Input',
            required: true,
            'x-component': 'Input',
          },
          remove: {
            type: 'void',
            'x-component': 'DatabaseField.ArrayCollapse.Remove',
          },
          moveUp: {
            type: 'void',
            'x-component': 'DatabaseField.ArrayCollapse.MoveUp',
          },
          moveDown: {
            type: 'void',
            'x-component': 'DatabaseField.ArrayCollapse.MoveDown',
          },
        },
      },
      properties: {
        addition: {
          type: 'void',
          title: '添加字段',
          'x-component': 'DatabaseField.ArrayCollapse.Addition',
        },
      },
    },
  }
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```
