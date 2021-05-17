---
title: '@nocobase/client'
order: 6
---

# @nocobase/client <Badge>未实现</Badge>

## 介绍

提供适配 Ant Design 组件的 NocoBase 客户端。

<Alert title="注意">

@nocobase/client 可以用于任意 React 框架中，不过还存在许多难点和细节未解决。

</Alert>

## Loaders

### TemplateLoader <Badge>待完善</Badge>

- routes：路由表，大杂烩。类型包括：layout、page、redirect、url、menuGroup，**页面就是 type=page 的 route**
- templates：模板
- pathname：URL 路径

为了适应无代码需求，提供了一种 URL 和 Template 映射规则，如以下例子：

```ts
const routes = [
  {
    type: 'layout',
    name: 'auth', // 因为 /login、/register 没有统一的前缀，所以这里没有配置 path
    template: 'AuthLayout', // 用于处理 login、register 等页面的布局
    children: [
      {
        type: 'page',
        name: 'login',
        path: '/login',
        template: 'BlockLoader', // 用于解析 blocks 配置参数
        blocks: [],
      },
      {
        type: 'page',
        name: 'register',
        path: '/register',
        template: 'BlockLoader',
        blocks: [],
      }
    ]
  },
  {
    type: 'layout',
    name: 'admin',
    path: '/admin', // /admin 下的任意 uri 都转到这里
    template: 'AdminLoader',
    redirect: '/admin/welcome',
    // admin layout 提供了 top/left 布局的菜单，菜单由 children 组成
    // 通过解析 /admin/:name，找到对应子页面
    // 「菜单和页面配置」就是这部分的内容
    children: [
      {
        type: 'page',
        name: 'welcome',
        template: 'BlockLoader',
        title: '欢迎',
        blocks: [],
      },
      {
        type: 'url',
        url: 'https://www.nocobase.com/',
        title: 'xxx',
      },
      {
        type: 'menuGroup',
        title: 'xxx',
      },
    ],
  },
  {
    // 配置跳转
    type: 'redirect',
    path: '/',
    redirect: '/admin',
  },
];
```

<pre lang="tsx">
<TemplateLoader
  pathname={pathname}
  routes={routes}
  templates={{
    AuthLayout,
    BlockLoader,
    AdminLoader,
  }}
/>
</pre>

### BlockLoader <Badge type="error">未实现</Badge>

区块驱动器。

### AdminLoader <Badge>待完善</Badge>

一种 top/left 菜单结构的 Admin 布局。菜单由其对应的 children 组成，通过 `/admin/:name` 映射到对应子页面，「菜单和页面配置」就是这部分的内容。

### ShareLoader <Badge type="error">未实现</Badge>

分享模块，细节待补充

## Blocks

将页面内部的各个块元素进行提炼，抽象了 block（区块）的概念。

### Grid - 布局

```ts
{
  type: 'grid',
  span: 12,
  blocks: [
    {
      col: 1,
      order: 1,
    },
    {
      col: 2,
      order: 1,
    },
    {
      col: 1,
      order: 2,
    },
  ],
}
```

### Descriptions - 详情

```ts
{
  type: 'descriptions',
  fields: [],
  actions: [],
}
```

### Form - 表单

```ts
{
  type: 'form',
  fields: [],
  // 表单提交反馈信息，细节待定
  returnType,
  redirect,
  message,
}
```

### Table - 表单

```ts
{
  type: 'table',
  defaultPerPage: 20,
  draggable: false,
  filter: {},
  sort: [],
  detailsOpenMode: 'drawer',
  actions: [],
  fields: [],
  details: [],
  labelField,
}
```

### Calendar - 日历

```ts
{
  type: 'calendar',
  filter: {},
  detailsOpenMode: 'drawer',
  actions: [],
  details: [],
  labelField,
}
```

### Kanban - 看板

```ts
{
  type: 'kanban',
  groupField,
  labelField,
  fields,
  filter,
  actions,
  detailsOpenMode,
  details,
}
```

### Markdown

```ts
{
  type: 'markdown',
  content: '',
}
```

## Actions

操作按钮

### create - 新增

### update - 编辑

### destroy - 删除

### filter - 筛选

### print - 打印

### export - 导出

## Fields

字段控件

### boolean
### cascader
### checkbox
### checkboxes
### colorSelect
### date
### drawerSelect
### filter
### icon
### markdown
### number
### password
### percent
### radio
### remoteSelect
### string
### select
### subTable
### textarea
### time
### upload
