---
title: Markdown 编辑器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Markdown 编辑器

## 节点树

<pre lang="tsx">
<Markdown/>
</pre>

## 代码演示

### Markdown 编辑器

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-reactions': {
        target: '*(read1,read2)',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read1: {
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
    },
    read2: {
      interface: 'string',
      type: 'string',
      title: `阅读模式（超出隐藏）`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-component-props': {
        ellipsis: true,
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
