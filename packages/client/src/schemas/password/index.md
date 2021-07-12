---
title: Password - 密码
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Password - 密码

## 节点树

<pre lang="tsx">
// 单选框
<Password/>
</pre>

## 代码演示

### 密码框

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      'x-reactions': {
        target: 'read',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read: {
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Password',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```