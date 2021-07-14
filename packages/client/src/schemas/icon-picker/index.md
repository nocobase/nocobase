---
title: IconPicker - 图标选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# IconPicker - 图标选择器

## Node Tree

<pre lang="tsx">
<IconPicker/>
</pre>

## Designable Bar

- IconPicker.DesignableBar

## Examples

```tsx
/**
 * title: 图标
 */
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'icon',
      type: 'string',
      title: `编辑模式`,
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
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
      interface: 'icon',
      type: 'string',
      title: `阅读模式`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'IconPicker',
    },
  }
};

export default () => {
  return (
    <div>
      <SchemaRenderer schema={schema} />
    </div>
  );
};
```
