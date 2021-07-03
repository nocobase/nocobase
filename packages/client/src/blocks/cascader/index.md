---
title: Cascader - 级联选择
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Components - 组件
  path: /client/components
---

# Cascader - 级联选择

## 省市区级联

```tsx
/**
 * title: 省市区级联
 */
import React from 'react';
import { SchemaRenderer } from '../';

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

const schema = {
  type: 'object',
  properties: {
    input: {
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
      name: 'name2',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Cascader',
      'x-component-props': {
        changeOnSelect: true,
      },
    },
  },
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
