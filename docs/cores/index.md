---
title: 介绍
order: 1
toc: menu
nav:
  title: 核心
  order: 2
---

# 介绍

NocoBase 核心主要围绕三点：

- 数据的结构
- 数据的行为
- 数据的形态

由此抽象了三类配置协议

- Collection：用于描述数据的结构和关系
- Resourcer：用于描述数据资源和操作方法
- UI Schema：用于描述用户界面（组件树结构）

## Collection

基于 Sequelize ModelOptions

```ts
{
  name: 'posts',
  fields: [
    {type: 'string', name: 'title'},
    {type: 'text', name: 'content'},
  ],
}
```

## Resourcer

基于资源（resource）和操作方法（action）设计，将 REST 和 RPC 思想融合起来

```ts
{
  name: 'posts',
  actions: {
    list: {
      filter: {}, // 过滤
      fields: [], // 输出哪些字段
      sort: '-created_at', // 排序
      page: 1,
      perPage: 20,
      // ...
    },
    get: {
      filter: {},
      fields: [],
      // ...
    },
    create: {
      fields: [],
      values: {},
      // ...
    },
    update: {
      fields: [],
      values: {},
      // ...
    },
    destroy: {
      filter: {},
      // ...
    },
  },
}
```

## UI Schema

基于 Formily Schema 2.0

```ts
{
  type: 'object',
  // 'x-component': 'Form',
  properties: {
    title: {
      type: 'string',
      title: '标题',
      'x-component': 'Input',
    },
    content: {
      type: 'string',
      title: '标题',
      'x-component': 'Input.TextArea',
    },
  },
}
```

更进一步，构建了整个 NocoBase 架构：

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/60ffd9aff98871c643569219c2873749.png" style="max-width: 800px;width:100%"/>