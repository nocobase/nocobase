---
title: DatePicker - 日期选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# DatePicker - 日期选择器

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
    'x-component': 'DatePicker',
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
    'x-component': 'DatePicker',
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

### 日期时间选择

```tsx
/**
 * title: 日期时间选择
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
    'x-component': 'DatePicker',
    'x-component-props': {
      showTime: true,
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
    interface: 'icon',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'DatePicker',
    'x-component-props': {
      showTime: true,
    },
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

## 参数说明

### dateFormat

日期格式

### showTime

是否显示时间

### timeFormat

时间格式
