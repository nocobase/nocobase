---
title: Grid - 栅格
nav:
  title: 组件
  path: /client
group:
  order: 2
  title: Blocks
  path: /client/blocks
---

# Grid - 栅格

## 示例

```tsx
import React from 'react';
import { BlockContext, GridBlock } from '@nocobase/client';
import './demo.less';

function Hello({ name }) {
  return <div>Hello {name}</div>;
}

const blocks = [
  {
    name: 'gb1', 
    'x-component': 'Hello', 
    'x-row': 0,
    'x-column': 0,
    'x-sort': 1,
  },
  {
    name: 'gb2', 
    'x-component': 'Hello', 
    'x-row': 0,
    'x-column': 0,
    'x-sort': 2,
  },
  {
    name: 'gb3', 
    'x-component': 'Hello', 
    'x-row': 0,
    'x-column': 1,
    'x-sort': 0,
  },
  {
    name: 'gb4', 
    'x-component': 'Hello', 
    'x-row': 1,
    'x-column': 0,
    'x-sort': 0,
  },
  {
    name: 'gb5', 
    'x-component': 'Hello', 
    'x-row': 2,
    'x-column': 0,
    'x-sort': 0,
  },
];

export default () => {
  return (
    <BlockContext.Provider value={{
      Hello,
    }}>
      <div id={'components-grid-demo'}>
        <GridBlock
          blocks={blocks}
        />
      </div>
    </BlockContext.Provider >
  )
}
```
