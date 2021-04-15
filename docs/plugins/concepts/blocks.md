---
title: Blocks - 区块
---

# Blocks - 区块

## 字段区块

```ts
export default {
  name: 'examples',
  fields: [
    {
      name: 'content',
      interface: 'string',
      type: 'string',
      block: {
        type: 'textarea',
      },
    }
  ],
};
```

## 数据表区块

```ts
export default {
  name: 'examples',
  blocks: [
    {
      type: 'form',
      name: 'form',
      title: '表单',
      fields: ['col1', 'col2'],
    },
  ],
};
```

## 后台可配置

```ts
export const form = {
  title: '表单',
  options: {
    // form blocks 配置项默认值
  },
  properties: {
    // 需要开放配置的字段
  },
  linkages: {
    // 字段联动
  },
};
```
