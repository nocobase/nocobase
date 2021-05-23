---
title: ColorSelect - 颜色选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# ColorSelect - 颜色选择器

```tsx
/**
 * title: 颜色选择器
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
    'x-component': 'ColorSelect',
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
    'x-component': 'ColorSelect',
  },
];

const data = {
  name1: 'red',
  name2: 'red',
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```