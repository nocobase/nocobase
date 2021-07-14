---
title: ColorSelect - 颜色选择器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# ColorSelect - 颜色选择器

## Node Tree

<pre lang="tsx">
<ColorSelect/>
</pre>

## Designable Bar

- ColorSelect.DesignableBar

## Examples

### 颜色选择器

```tsx
/**
 * title: 颜色选择器
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
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'ColorSelect',
    },
    designable: {
      interface: 'icon',
      type: 'string',
      title: `配置模式`,
      // 'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-designable-bar': 'FormItem.DesignableBar',
      'x-component': 'ColorSelect',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
