---
title: TimePicker - 时间选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# TimePicker - 时间选择器

## 代码演示

### 日期选择器

```tsx
/**
 * title: 日期选择器
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'icon',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'TimePicker',
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
    interface: 'icon',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'TimePicker',
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
