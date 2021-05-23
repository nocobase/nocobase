---
title: Markdown 编辑器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Markdown 编辑器

## 代码演示

### 多行文本

```tsx
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'string',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'Markdown',
    'x-reactions': {
      target: '*(name2,name3)',
      fulfill: {
        state: {
          value: '{{$self.value}}',
        },
      },
    },
  },
  {
    interface: 'string',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Markdown',
  },
  {
    interface: 'string',
    type: 'string',
    title: `阅读模式（超出隐藏）`,
    name: 'name3',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Markdown',
    'x-component-props': {
      ellipsis: true,
    },
  },
];

const data = {
  name1: `# 标题\n第一行文字  \n第二行文字`,
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```



