---
title: Radio - 单选框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# Radio - 单选框

## 代码演示

### 单选框

```tsx
/**
 * title: 单选框
 */
import React from 'react';
import { SchemaBlock } from '../';

const options = [
  {
    label: '选项1',
    value: 1,
    color: 'red',
  },
  {
    label: '选项2',
    value: 2,
    color: 'blue',
  },
];

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
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
      enum: options,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
    },
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```
