---
title: AddNew - 新增区块
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# AddNew - 新增区块

## 新增普通区块

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'addnew',
  'x-component': 'AddNew',
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```

## 新增表单区块

```tsx
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'void',
  name: 'addnew',
  'x-component': 'AddNew.FormItem',
};

export default () => {
  return <SchemaBlock schema={schema} />
}
```
