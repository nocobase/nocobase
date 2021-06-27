---
title: Select - 选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# Select - 选择器

## 基本用法

```tsx
import React from 'react';
import { SchemaBlock } from '../';

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

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
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
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      enum: options,
      name: 'name2',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
    },
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema}/>
  );
};
```

## 多选

```tsx
import React from 'react';
import { SchemaBlock } from '../';

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

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'tags',
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
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      enum: options,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        mode: 'tags',
      },
    },
  }
}

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```

## 分组

```tsx
import React from 'react';
import { SchemaBlock } from '../';

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

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'select',
      type: 'number',
      title: `编辑模式`,
      enum: dataSource,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: 'please enter',
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
      interface: 'select',
      type: 'number',
      title: `阅读模式`,
      required: true,
      enum: dataSource,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      'x-component-props': {
        placeholder: 'please enter',
      },
    }
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema}/>
  );
};
```

## 值为对象

```tsx
import React from 'react';
import { SchemaBlock } from '../';

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

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'select',
      type: 'string',
      title: `编辑模式`,
      enum: dataSource,
      'x-decorator': 'FormItem',
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
    read: {
      interface: 'select',
      type: 'string',
      title: `阅读模式`,
      required: true,
      enum: dataSource,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Select.Object',
      'x-component-props': {
        placeholder: 'please enter',
        labelField: 'title',
        valueField: 'id',
        labelInValue: true,
      },
    }
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```