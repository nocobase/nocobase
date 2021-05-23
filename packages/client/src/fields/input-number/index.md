---
title: InputNumber - 数字框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# InputNumber - 数字框

### 数字框

```tsx
/**
 * title: 数字框
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'string',
    type: 'number',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
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
    interface: 'number',
    type: 'number',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
  },
];

const data = {
  name1: 1234,
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

### 百分比

```tsx
/**
 * title: 百分比
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'string',
    type: 'number',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-component-props': {
      placeholder: 'please enter',
      formatter: value => `${value}%`,
      parser: value => value.replace('%', ''),
    },
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
    interface: 'number',
    type: 'number',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-component-props': {
      placeholder: 'please enter',
      formatter: value => `${value}%`,
      parser: value => value.replace('%', ''),
    },
  },
];

const data = {
  name1: 1234,
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

## 参数说明

以下只列特殊参数，其他通用参数参考 [Field 章节](fields)。

### precision <Badge>M</Badge>

精确度
