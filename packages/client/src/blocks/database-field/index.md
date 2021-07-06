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
import Editor from '@monaco-editor/react';

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
      <SchemaRenderer form={form} schema={schema} />
      <Editor
        height="200px"
        defaultLanguage="json"
        value={JSON.stringify(form.values, null, 2)}
      />
    </div>
  )
})
```
