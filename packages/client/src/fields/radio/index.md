---
title: Radio - 单选框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Radio - 单选框

## 代码演示

### 单选框

```tsx
/**
 * title: 单选框
 */
import React from 'react';
import { Field } from '@nocobase/client';

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

const schema = [
  {
    interface: 'string',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    dataSource: options,
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
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
    dataSource: options,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Radio.Group',
  },
];

const data = {
  name1: 1,
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```
