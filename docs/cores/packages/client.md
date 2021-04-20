---
title: '@nocobase/client'
order: 6
---

# @nocobase/client <Badge>未实现</Badge>

## 介绍

### 路由

和众多框架类似，NocoBase 也提供了路由，可以根据 URL 找到对应的页面。为了适应无代码需求，NocoBase 提供了一套由服务端配置的 routes 表，routes 是一个大杂烩，如以下例子：

```ts
[
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
]
```

route 类型包括：layout、page、redirect、url、menuGroup，页面就是 type=page 的 route

NocoBase 会内置几种常用的 template 用于处理特定页面渲染，如果有特殊需求还可以自行扩展。

### 页面和区块

我们又进一步提炼了页面内部的各个块元素，抽象出 block（区块）的概念，就可以类似以下例子来配置页面和区块了。

```ts
{
  type: 'page',
  blocks: [
    {
      type: 'table',
    }
  ],
}
```

