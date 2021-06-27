---
title: ColorSelect - 颜色选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: 区块 - Blocks
  path: /client/blocks
---

# ColorSelect - 颜色选择器

```tsx
/**
 * title: 颜色选择器
 */
import React from 'react';
import { SchemaBlock } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      interface: 'icon',
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'ColorSelect',
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
      name: 'name2',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'ColorSelect',
    }
  }
};

export default () => {
  return (
    <SchemaBlock schema={schema} />
  );
};
```
