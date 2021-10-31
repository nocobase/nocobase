---
nav:
  path: /components
group:
  path: /components/schema-components
---


# Checkbox - 多选框

## Node Tree

<pre lang="tsx">
// 勾选
<Checkbox/>
// 多选框
<Checkbox.Group/>
</pre>

## Designable Bar

- Checkbox.DesignableBar

## Examples

### 勾选

```tsx
/**
 * title: 勾选
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
      'x-component': 'Checkbox',
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
      'x-component': 'Checkbox',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### 组

```tsx
/**
 * title: 组
 */
import React from 'react';
import { SchemaRenderer } from '../';

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
      type: 'string',
      title: `编辑模式`,
      enum: options,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
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
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox.Group',
    }
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
