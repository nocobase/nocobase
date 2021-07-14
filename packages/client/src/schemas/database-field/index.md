---
title: DatabaseField - 数据表字段
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# DatabaseField - 数据表字段

## Node Tree

<pre lang="tsx">
<DatabaseField/>
</pre>

## Designable Bar

暂无

## Examples

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
          dataType: 'string',
          name: 'title',
          ui: {
            title: '标题',
          },
        },
        {
          id: 2,
          dataType: 'text',
          interface: 'textarea',
          name: 'content',
          ui: {
            title: '内容',
          },
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
      <SchemaRenderer form={form} schema={schema} />
    </div>
  )
})
```
