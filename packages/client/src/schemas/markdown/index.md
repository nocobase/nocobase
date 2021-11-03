---
nav:
  path: /components
group:
  path: /components/schema-components
---

# Markdown 编辑器

## Node Tree

<pre lang="tsx">
<Markdown/>
</pre>

## Designable Bar

- Markdown.DesignableBar

## Examples

### Markdown 编辑器

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  type: 'object',
  properties: {
    input: {
      type: 'string',
      title: `编辑模式`,
      name: 'name1',
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
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
      'x-component': 'Markdown',
    },
    read2: {
      interface: 'string',
      type: 'string',
      title: `阅读模式（超出隐藏）`,
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-component-props': {
        ellipsis: true,
      },
    },
  },
};

export default () => {
  return (
    <SchemaRenderer schema={schema} />
  );
};
```

### Markdown.DesignableBar


```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema1 = {
  type: 'object',
  properties: {
    markdown1: {
      type: 'string',
      title: `简易Markdown`,
      default: '这是一段示例文案',
      'x-read-pretty': true,
      'x-decorator': 'CardItem',
      'x-component': 'Markdown',
      'x-designable-bar': 'Markdown.DesignableBar',
      'x-component-props': {
        savedInSchema: true,
        // ellipsis: true,
      },
    },
  },
};

const schema2 = {
  type: 'object',
  properties: {
    markdown1: {
      type: 'string',
      title: `简易Markdown`,
      default: '这是一段示例文案',
      'x-read-pretty': true,
      'x-decorator': 'FormItem',
      'x-component': 'Markdown',
      'x-designable-bar': 'Markdown.DesignableBar',
      'x-component-props': {
      },
    },
  },
};

export default () => {
  return (
    <div>
      <h3>区块项</h3>
      <SchemaRenderer schema={schema1} />
      <h3>表单项</h3>
      <SchemaRenderer schema={schema2} />
    </div>
  );
};
```