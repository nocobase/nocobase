---
title: Checkbox - 多选框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Checkbox - 多选框

## 代码演示

### 勾选

```tsx
/**
 * title: 勾选
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'string',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'Checkbox',
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
    'x-component': 'Checkbox',
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

### 组

```tsx
/**
 * title: 组
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
    'x-component': 'Checkbox.Group',
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
    'x-component': 'Checkbox.Group',
  },
];

const data = {
  name1: [1, 2],
  name2: [1, 2],
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```
