---
title: Filter - 筛选器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Filter - 筛选器

## 代码演示

### 筛选器 - 基本使用

```tsx
/**
 * title: 筛选器
 */
import React from 'react';
import { Field } from '@nocobase/client';

const fields = [
  {
    interface: 'input',
    type: 'string',
    title: `文本`,
    name: 'input',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-operations': [
      {
        label: '等于1',
        value: 'eq',
      },
      {
        label: '大于1',
        value: 'gt',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'number',
    type: 'string',
    title: `数字`,
    name: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-operations': [
      {
        label: '等于2',
        value: 'eq',
      },
      {
        label: '大于2',
        value: 'gt',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'number',
    type: 'string',
    title: `数字`,
    name: 'number2',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-operations': [
      {
        label: '等于3',
        value: 'eq',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'datetime',
    type: 'string',
    title: `日期`,
    name: 'datetime',
    'x-decorator': 'FormItem',
    'x-component': 'DatePicker',
    'x-operations': [
      {
        label: '等于4',
        value: 'eq',
      }
    ],
  },
];

const schema = [
  {
    interface: 'icon',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    'x-decorator': 'FormItem',
    'x-component': 'Filter',
    'x-source-fields': fields,
    'x-target-fields': [],
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
    'x-component': 'Filter',
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

### 筛选项 - 数字类型

```tsx
import React from 'react';
import FilterItem from './FilterItem';

const fields = [
  {
    interface: 'input',
    type: 'string',
    title: `文本`,
    name: 'input',
    'x-decorator': 'FormItem',
    'x-component': 'Input',
    'x-operations': [
      {
        label: '等于1',
        value: 'eq',
      },
      {
        label: '大于1',
        value: 'gt',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'number',
    type: 'string',
    title: `数字`,
    name: 'number',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-operations': [
      {
        label: '等于2',
        value: 'eq',
      },
      {
        label: '大于2',
        value: 'gt',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'number',
    type: 'string',
    title: `数字`,
    name: 'number2',
    'x-decorator': 'FormItem',
    'x-component': 'InputNumber',
    'x-operations': [
      {
        label: '等于3',
        value: 'eq',
      },
      {
        label: '为空',
        value: 'isNull',
        noValue: true,
      }
    ],
  },
  {
    interface: 'datetime',
    type: 'string',
    title: `日期`,
    name: 'datetime',
    'x-decorator': 'FormItem',
    'x-component': 'DatePicker',
    'x-operations': [
      {
        label: '等于4',
        value: 'eq',
      }
    ],
  },
];

const initialValues = {
  key: 'number',
}

export default () => {
  return (
    <FilterItem initialValues={initialValues} fields={fields}/>
  )
}

```
## API

### Filter

筛选器组件

### Filter.Item

筛选项组件

#### initialValues 
#### fields
#### onRemove