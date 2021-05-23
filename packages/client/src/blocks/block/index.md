---
title: Block - 区块
nav:
  title: 组件
  path: /client
group:
  order: 2
  title: Blocks 
  path: /client/blocks
---

# Block - 区块

```tsx
import React from 'react';
import BlockEditor from './';

const items = [
  {
    type: 'page',
    name: 'block1',
  },
  {
    type: 'page',
    name: 'block2',
  }
]

export default () => {
  return (
    <BlockEditor items={items} />
  )
}
```
