---
title: DatabaseField - 数据表字段
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

# DatabaseField - 数据表字段

```tsx
import React from 'react';
import { createForm } from '@formily/core';
import { SchemaRenderer } from '../';
import { observer, connect, useField } from '@formily/react';

const schema = {
  type: 'object',
  properties: {
    array: {
      type: 'array',
      'x-component': 'DatabaseField',
      default: [
        {
          id: 1,
          interface: 'string',
          type: 'string',
          name: 'title',
        },
        {
          id: 2,
          type: 'text',
          interface: 'textarea',
          name: 'content',
        },
      ],
    },
    // input: {
    //   type: 'string',
    //   'x-component': 'Input',
    // },
  },
};

const form = createForm();

export default observer(() => {
  return (
    <div>
      {JSON.stringify(form.values, null, 2)}
      <SchemaRenderer form={form} schema={schema} />
    </div>
  )
})
```

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    array: {
      type: 'array',
      // title: '数据表字段',
      'x-component': 'ArrayCollapse',
      'x-component-props': {
        accordion: true,
      },
      // maxItems: 3,
      'x-decorator': 'FormItem',
      items: {
        type: 'object',
        'x-component': 'ArrayCollapse.CollapsePanel',
        'x-component-props': {
          header: '字段',
        },
        properties: {
          index: {
            type: 'void',
            'x-component': 'ArrayCollapse.Index',
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
            'x-component': 'ArrayCollapse.Remove',
          },
          moveUp: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveUp',
          },
          moveDown: {
            type: 'void',
            'x-component': 'ArrayCollapse.MoveDown',
          },
        },
      },
      properties: {
        addition: {
          type: 'void',
          title: '添加字段',
          'x-component': 'ArrayCollapse.Addition',
        },
      },
    },
  }
};

export default () => {
  return <SchemaRenderer schema={schema} />
}
```
