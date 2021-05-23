---
title: IconPicker - 图标选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# IconPicker - 图标选择器

```tsx
/**
 * title: 图标
 */
import React from 'react';
import { Field } from '@nocobase/client';

const schema = [
  {
    interface: 'icon',
    type: 'string',
    title: `编辑模式`,
    name: 'icon1',
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
    'x-reactions': {
      target: 'icon2',
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
    name: 'icon2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'IconPicker',
  },
];

const data = {
  icon1: 'TableOutlined',
  icon2: 'TableOutlined',
};

export default () => {
  return (
    <div>
      <Field schema={schema} data={data} />
    </div>
  );
};
```
