---
title: Cascader - 级联选择
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Cascader - 级联选择

## 代码演示

### 省市区级联

```tsx
/**
 * title: 省市区级联
 */
import React from 'react';
import { Field } from '@nocobase/client';

const options = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
          },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
          },
        ],
      },
    ],
  },
];

const schema = [
  {
    interface: 'string',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    enum: options,
    'x-decorator': 'FormItem',
    'x-component': 'Cascader',
    'x-component-props': {
      changeOnSelect: true,
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
    interface: 'string',
    type: 'string',
    title: `阅读模式`,
    enum: options,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Cascader',
    'x-component-props': {
      changeOnSelect: true,
    },
  },
];

const data = {
  // name1: ["jiangsu", "nanjing", "zhonghuamen"],
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```