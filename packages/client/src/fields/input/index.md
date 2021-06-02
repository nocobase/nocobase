---
title: Input - 输入框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 字段 - Fields
  path: /client/fields
---

# Input - 输入框

输入框是非常常用的控件，参数可以组合成许多字段，如单行文本、多行文本、手机号、邮箱、网址等。

## 代码演示

### 单行文本

```tsx
/**
 * title: 单行文本
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
    'x-component': 'Input',
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
    'x-component': 'Input',
  },
];

const data = {
  name1: '这是一段文字',
  name2: '这是一段文字',
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

### 多行文本

```tsx
/**
 * title: 多行文本
 * desc: 用于多行输入，使用 `Input.TextArea` 组件，`ellipsis=true` 时超出隐藏
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
    'x-component': 'Input.TextArea',
    'x-reactions': {
      target: '*(name2,name3)',
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
    'x-component': 'Input.TextArea',
  },
  {
    interface: 'string',
    type: 'string',
    title: `阅读模式（超出隐藏）`,
    name: 'name3',
    'x-read-pretty': true,
    'x-decorator': 'FormItem',
    'x-component': 'Input.TextArea',
    'x-component-props': {
      ellipsis: true,
    },
  },
];

const data = {
  name1: `第一行文字\n第二行文字`,
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

### 电子邮箱

```tsx
/**
 * title: 电子邮箱
 * desc: 加上邮箱验证 `x-validator=email`
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
    'x-component': 'Input',
    'x-validator': 'email',
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
    'x-component': 'Input',
    'x-validator': 'email',
  },
];

const data = {
  name1: 'test@example.com'
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

### 手机号

```tsx
/**
 * title: 手机号
 * desc: 加上手机号验证 `x-validator=phone`
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
    'x-component': 'Input',
    'x-validator': 'phone',
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
    'x-component': 'Input',
    'x-validator': 'phone',
  },
];

const data = {
  name1: '13012341234'
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

### 网址

```tsx
/**
 * title: 网址
 * desc: 加上 URL 验证 `x-validator=url`
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
    'x-component': 'Input.URL',
    'x-validator': 'url',
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
    'x-component': 'Input.URL',
    'x-validator': 'url',
  },
];

const data = {
  name1: 'https://www.example.com'
};

export default () => {
  return (
    <Field schema={schema} data={data} />
  );
};
```

## 参数说明

输入框组件暂时还没有特殊的参数，其他通用参数参考 [Field 章节](fields)。

常用配置参数：

- type
- title
- name
- required
- default
- x-component-props.placeholder
- x-decorator-props.description
- x-validator
