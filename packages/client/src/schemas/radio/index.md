---
nav:
  path: /components
group:
  path: /components/schema-components
---

# Radio - 单选框

## Node Tree

<pre lang="tsx">
// 单选框
<Radio/>
// 单选框分组
<Radio.Group/>
</pre>

## Designable Bar

- Radio.DesignableBar

## Examples

### 单选框

```tsx
/**
 * title: 单选框
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
      'x-component': 'Radio.Group',
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
      'x-component': 'Radio.Group',
    },
  }
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```
