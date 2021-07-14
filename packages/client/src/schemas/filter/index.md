---
title: Filter - 筛选器
nav:
  title: 组件
  path: /client
group:
  order: 1
  title: Schemas
  path: /client/schemas
---

# Filter - 筛选器

## Node Tree

<pre lang="tsx">
<Filter>
  <Filter.Column title={'字段1'} operations={[]}>
    <Input/>
  </Filter.Column>
  <Filter.Column title={'字段2'}>
    <Input/>
  </Filter.Column>
</Filter>
</pre>

## Designable Bar

- Filter.DesignableBar

## Examples

```tsx
import React from 'react';
import { SchemaRenderer } from '../';

const schema = {
  name: 'filter',
  type: 'object',
  'x-component': 'Filter',
  properties: {
    column1: {
      type: 'void',
      title: '字段1',
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: [
          { label: '等于', value: 'eq' },
          { label: '不等于', value: 'ne' },
        ],
      },
      properties: {
        field1: {
          type: 'string',
          'x-component': 'Input',
        },
      },
    },
    column2: {
      type: 'void',
      title: '字段2',
      'x-component': 'Filter.Column',
      'x-component-props': {
        operations: [
          { label: '大于', value: 'gt' },
          { label: '小于', value: 'lt' },
          { label: '非空', value: 'notNull', noValue: true },
        ],
      },
      properties: {
        field1: {
          type: 'number',
          'x-component': 'InputNumber',
        },
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
