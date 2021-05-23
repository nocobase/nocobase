---
title: Select - 选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Select - 选择器

## 基本用法

```tsx
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
    'x-component': 'Select',
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
    'x-component': 'Select',
  },
];

const data = {
  name1: 2,
};

export default () => {
  return (
    <Field data={data} schema={schema}/>
  );
};
```

## 多选

```tsx
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
    'x-component': 'Select',
    'x-component-props': {
      mode: 'tags',
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
    dataSource: options,
    name: 'name2',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      mode: 'tags',
    },
  },
];

const data = {
  name1: 2,
};

export default () => {
  return (
    <Field data={data} schema={schema}/>
  );
};
```

## 分组

```tsx
import React from 'react';
import { Field } from '@nocobase/client';

const dataSource = [
  {
    label: 'Manager',
    children: [
      {value: 'jack', label: 'Jack'},
    ],
  },
  {
    label: 'Engineer',
    children: [
      {value: 'lucy', label: 'Lucy'},
    ],
  },
];

const schema = [
  {
    interface: 'select',
    type: 'number',
    title: `编辑模式`,
    name: 'name1',
    dataSource,
    'x-component': 'Select',
    'x-component-props': {
      placeholder: 'please enter',
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
    interface: 'select',
    type: 'number',
    title: `阅读模式`,
    name: 'name2',
    required: true,
    dataSource,
    'x-read-pretty': true,
    'x-component': 'Select',
    'x-component-props': {
      placeholder: 'please enter',
    },
  }
];

const data = {
  name1: 'lucy',
  name2: 'lucy',
};

export default () => {
  return (
    <Field data={data} schema={schema}/>
  );
};
```

## 值为对象

```tsx
import React from 'react';
import { Field } from '@nocobase/client';

const dataSource = [
  {
    id: 1,
    title: '标题1',
  },
  {
    id: 2,
    title: '标题2',
  },
  {
    id: 3,
    title: '标题3',
  },
];

const schema = [
  {
    interface: 'select',
    type: 'string',
    title: `编辑模式`,
    name: 'name1',
    dataSource,
    'x-component': 'Select.Object',
    'x-component-props': {
      placeholder: 'please enter',
      labelField: 'title',
      valueField: 'id',
      labelInValue: true,
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
    interface: 'select',
    type: 'string',
    title: `阅读模式`,
    name: 'name2',
    required: true,
    dataSource,
    'x-read-pretty': true,
    'x-component': 'Select.Object',
    'x-component-props': {
      placeholder: 'please enter',
      labelField: 'title',
      valueField: 'id',
      labelInValue: true,
    },
  }
];

const data = {
  name1: {
    id: 2,
    title: '标题2',
  },
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

## 异步选项

```tsx
import React from 'react';
import { Field, registerFieldScope } from '@nocobase/client';
import { action } from '@formily/reactive'

const schema = [
  {
    type: 'string',
    name: 'name1',
    title: '编辑模式',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      style: {
        width: 120,
      },
    },
    'x-reactions': [
      '{{useAsyncDataSource(loadData)}}',
      {
        target: 'name2',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    ],
  },
  {
    type: 'string',
    name: 'name2',
    title: '阅读模式',
    'x-decorator': 'FormItem',
    'x-component': 'Select',
    'x-component-props': {
      style: {
        width: 120,
      },
    },
    'x-read-pretty': true,
    'x-reactions': ['{{useAsyncDataSource(loadData)}}'],
  }
];

const loadData = async (field) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          label: 'CCC',
          value: 'ccc',
        },
        {
          label: 'DDD',
          value: 'ddd',
        },
      ])
    }, 1500)
  })
}

const useAsyncDataSource = (service) => (field) => {
  field.loading = true
  service(field).then(
    action((data) => {
      field.dataSource = data
      field.loading = false
    })
  )
}

registerFieldScope({
  loadData,
  useAsyncDataSource
});

const data = {
  name1: 'ccc',
};

export default () => {
  return (
    <Field data={data} schema={schema}/>
  );
};
```

## 参数说明

以下只列特殊参数，其他通用参数参考 [Field 章节](fields)。

### labelField <Badge>C</Badge>

选项的 Label

### valueField <Badge>C</Badge>

选项的 Value

### dataSource <Badge>M</Badge>

Formily 使用 enum 来放选项的值，但是 enum 这个词比较特殊，所以改用 dataSource，支持 optgroup 的情况。

### dataRequest <Badge>M</Badge>

用法一

```ts
{
  dataRequest: 'users',
}
```

用法二

```ts
{
  dataRequest: {
    associatedKey,
    associatedName,
    resourceName,
    filter,
    fields,
  },
}
```

用法三

```ts
{
  dataRequest: (field) => 'users',
}
```

用法四

```ts
{
  dataRequest: (field) => ({
    associatedKey,
    associatedName,
    resourceName,
    filter,
    fields,
  }),
}
```

用法五

```ts
{
  dataRequest: (field) => {
    return Promise.resovle({
      data,
    });
  },
}
```
