---
title: Password - 密码
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Password - 密码

## 代码演示

### 密码框

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
    'x-component': 'Password',
    'x-reactions': {
      target: 'name2',
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
    'x-component': 'Password',
  },
];

const data = {
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```
