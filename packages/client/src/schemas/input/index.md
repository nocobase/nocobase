---
title: Input - 输入框
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Input - 输入框

输入框是非常常用的控件，参数可以组合成许多字段，如单行文本、多行文本、手机号、邮箱、网址等。

## 节点树

<pre lang="tsx">
<Input/>
<Input.TextArea/>
</pre>

## 代码演示

### 单行文本

```tsx
/**
 * title: 单行文本
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
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
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
    },
  },
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
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
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-reactions': {
        target: '*(read1,read2)',
        fulfill: {
          state: {
            value: '{{$self.value}}',
          },
        },
      },
    },
    read1: {
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
    },
    read2: {
      interface: 'string',
      type: 'string',
      title: `阅读模式（超出隐藏）`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        ellipsis: true,
      },
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
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
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'email',
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
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'email',
    },
  },
}

export default () => {
  return (
    <SchemaRenderer schema={schema} />
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
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'string',
      type: 'string',
      title: `编辑模式`,
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
    read: {
      interface: 'string',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-validator': 'phone',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
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
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'Input.URL',
      'x-validator': 'url',
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
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Input.URL',
      'x-validator': 'url',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
