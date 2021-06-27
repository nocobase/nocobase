---
title: DatePicker - 日期选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# DatePicker - 日期选择器

## 代码演示

### 日期选择器

```tsx
/**
 * title: 日期选择器
 */
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'icon',
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
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
      interface: 'icon',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
    },
  },
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```

### 日期时间选择

```tsx
/**
 * title: 日期时间选择
 */
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'icon',
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true,
      },
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
      interface: 'icon',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'DatePicker',
      'x-component-props': {
        showTime: true,
      },
    },
  },
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```
