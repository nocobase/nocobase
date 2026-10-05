---
title: '路由'
description: '了解 NocoBase 3 服务端和客户端路由的声明方式、挂载路径以及访问控制。'
keywords: 'NocoBase,路由,服务端路由,客户端路由,defineRootRoutes,defineApiRoutes,defineAppRoutes,defineSettingsRoutes,defineDevRoutes'
---

# 路由

NocoBase 3 的路由分为服务端路由和客户端路由：

- 服务端路由处理 HTTP 请求，使用 Hono 编写。
- 客户端路由加载 React 页面，并决定页面是否出现在导航中。

路由声明只写应用内部路径。部署前缀由运行时统一处理，不要写进 `path`。

## 五种路由

| 用途                           | 声明函数                 | 声明位置           | 应用内部路径         |
| ------------------------------ | ------------------------ | ------------------ | -------------------- |
| 顶层 HTTP 入口、Webhook 和回调 | `defineRootRoutes()`     | `server/routes/`   | `/callbacks/payment` |
| 业务接口                       | `defineApiRoutes()`      | `server/routes/`   | `/orders`            |
| 普通业务页面                   | `defineAppRoutes()`      | `client/routes.ts` | `/orders`            |
| 设置和管理页面                 | `defineSettingsRoutes()` | `client/routes.ts` | `/orders`            |
| 开发工具页面                   | `defineDevRoutes()`      | `client/routes.ts` | `/orders`            |

服务端路由的路径由声明函数决定：`defineRootRoutes()` 保留你在 router 中写的路径，`defineApiRoutes()` 会自动在前面加上 `/api`。例如，`defineRootRoutes()` 中的 `/callbacks/payment` 最终是 `/callbacks/payment`，`defineApiRoutes()` 中的 `/orders` 最终是 `/api/orders`。客户端设置页和开发页分别自动加上 `/settings` 和 `/dev` 前缀，普通客户端页面不增加额外前缀。

例如，应用部署在 `/main` 下时：

| 声明方式                 | `path`               | 浏览器或 HTTP 地址        |
| ------------------------ | -------------------- | ------------------------- |
| `defineAppRoutes()`      | `/orders`            | `/main/orders`            |
| `defineSettingsRoutes()` | `/orders`            | `/main/settings/orders`   |
| `defineDevRoutes()`      | `/orders`            | `/main/dev/orders`        |
| `defineApiRoutes()`      | `/orders`            | `/main/api/orders`        |
| `defineRootRoutes()`     | `/callbacks/payment` | `/main/callbacks/payment` |

## 服务端路由

服务端路由文件放在 `server/routes/`，并从 `server/routes/index.ts` 导出。每个路由工厂都要创建并返回自己的 Hono router：

```ts
// server/routes/orders.ts
import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppApiRouteContribution,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';

import { OrderSchema } from './schemas.js';

export const ordersRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    const auth = app.container.resolve(authenticationToken);

    router.use('/orders', auth.required());
    router.get(
      '/orders',
      describeRoute({
        tags: ['Orders'],
        summary: 'List orders',
        operationId: 'listOrders',
        responses: {
          '200': listResponse(OrderSchema),
          '401': apiErrorResponse(401),
          '500': apiErrorResponse(500),
        },
      }),
      (context) =>
        context.json({
          data: [{ id: '1', reference: 'ORD-0001' }],
          meta: { page: 1, pageSize: 20, total: 1 },
        }),
    );

    return router;
  });
```

每个 `/api` 路由都用 `describeRoute()` 声明自己，进入应用的 OpenAPI 文档；有输入的路由用 `apiValidator()` 校验并声明输入。两者都从 `@nocobase/app-server/router` 导入。运行中的应用在 `<APP_BASE_PATH>/api/swagger/docs` 提供 Swagger UI，在 `<APP_BASE_PATH>/api/swagger` 提供 JSON，登录用户或带 API Key 的请求才能读取。

在 `server/routes/index.ts` 中导出路由贡献：

```ts
// server/routes/index.ts
import type { Application } from '@nocobase/app-server/application';
import type { AppRouteContribution } from '@nocobase/app-server/router';

import { ordersRoutes } from './orders.js';

const routes: readonly AppRouteContribution<Application>[] = [ordersRoutes];

export default routes;
```

`defineRootRoutes()` 的写法相同，只是路由会挂在应用根路径。例如，Webhook 可以声明为 `router.post('/callbacks/payment', ...)`。

需要登录的接口在自己的 Hono router 中使用 `auth.required()`；允许匿名访问但需要读取会话时使用 `auth.optional()`。详细用法见 [服务端路由](../server-routes)。

## 客户端路由

客户端路由文件是 `client/routes.ts`。普通页面使用 `defineAppRoutes()`：

```ts
// client/routes.ts
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    auth: 'required',
    navigation: { title: 'navigation.orders' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
]);

const routes: readonly AppClientRouteContribution[] = [appRoutes];

export default routes;
```

`componentLoader` 必须返回一个包含 default export 的页面模块：

```tsx
// client/pages/orders.tsx
import type { ReactElement } from 'react';

export default function OrdersPage(): ReactElement {
  return <section className='p-6'>订单</section>;
}
```

保持 `componentLoader` 惰性加载。路由元数据会同步注册，页面组件只在用户访问时加载。即使源文件是 `.tsx`，import 路径也要写 `.js`。

### 路径和子路由

页面的 `path` 必须填写，子路由的路径会拼接到父路由后面：

```ts
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'Orders' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders/index.js'),
    children: [
      {
        name: 'detail',
        path: ':orderId',
        authz: 'skip',
        componentLoader: () => import('./pages/orders/detail.js'),
      },
    ],
  },
]);
```

上例中的详情页路径是 `/orders/:orderId`。动态参数页不能配置 `navigation`，因为它没有一个固定的菜单链接。页面组件需要在希望显示子页面的位置显式渲染 `<Outlet />`。

路由分组没有 `componentLoader`，但必须有 `navigation` 和 `children`。分组可以设置 `path` 作为子页面的路径前缀；不设置时只负责组织菜单：

```ts
defineAppRoutes([
  {
    name: 'business',
    path: '/business',
    navigation: { title: 'Business' },
    children: [
      {
        name: 'orders',
        path: '/orders',
        navigation: { title: 'Orders' },
        authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
        componentLoader: () => import('./pages/orders.js'),
      },
    ],
  },
]);
```

上例中的页面路径是 `/business/orders`。分组本身不渲染页面组件。

### 面包屑声明

页面和分组都可以声明 `breadcrumb: { title: 'orders.title' }`。`title` 是非空字符串，在路由所属包的语言命名空间中解析。

`breadcrumb` 与 `navigation` 独立，不会互相回退。动态参数路径可以声明 `breadcrumb`，但不能声明需要固定链接的 `navigation`。省略 `breadcrumb` 的路由不会出现在面包屑中。

声明本身不渲染界面；页面需要放置 `<Breadcrumbs />`。显示条件、子页面展示和完整示例见[页面和菜单](../pages-and-routes)。

### 页面、菜单和访问控制

客户端页面的 `navigation`、`breadcrumb`、`auth`、`authz`、路由分组和子路由用法见 [页面和菜单](../pages-and-routes)。

### 设置页

设置页使用 `defineSettingsRoutes()`，声明的 `path` 不要重复写 `/settings`：

```ts
defineSettingsRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'navigation.orders' },
    authz: { resource: { type: 'settings', id: 'orders' }, action: 'read' },
    componentLoader: () => import('./pages/orders-settings.js'),
  },
]);
```

`authz` 的值是 `'skip'`、`'unrestricted'` 或一个 `{ resource: { type, id }, action }` 对象，用来指定要检查的资源和操作；系统不会根据路由名称推断。在每条路径的第一个页面上声明它：子页面省略时继承最近的上级页面的值（可以跨越分组和多个层级），子页面自己声明的值会覆盖继承值。第一个页面省略 `authz` 时仍会注册，并在开发环境输出一条警告，说明路由、路径和采用的默认值：需要登录的应用页面（`auth: 'required'`）和设置页默认为 `'unrestricted'`，只有 root 等拥有无限制权限的身份可以打开；`guest`、`optional` 应用页面和开发页默认为 `'skip'`。`'unrestricted'` 也可以显式声明，用于只允许 root 打开的页面，它不会出现在权限配置中。例如，`{ resource: { type: 'settings', id: 'orders' }, action: 'read' }` 表示检查当前用户是否有读取订单设置页的权限。客户端会在加载页面组件前执行这项检查；`authz: 'skip'` 仅跳过当前页面的权限检查，不跳过登录和父级检查。

检查被拒绝时，页面不会出现在设置导航中，直接访问它的 URL 也不会加载页面组件。请为设置页声明它所属的设置项，或者对所有登录用户都可打开的页面显式声明 `'skip'`；省略时设置页只有 root 可以打开。`authz` 只控制客户端页面，页面调用的服务端接口仍需自行完成认证和权限校验。

### 开发页

开发页使用 `defineDevRoutes()`，声明的 `path` 不要重复写 `/dev`：

```ts
defineDevRoutes([
  {
    name: 'inspect',
    path: '/inspect',
    navigation: { title: 'navigation.inspect' },
    authz: 'skip',
    componentLoader: () => import('./pages/inspect.js'),
  },
]);
```

开发页在生产环境中会被移除，也不会被包含进构建产物。

开发页同样应当声明 `authz`，可以是 `'skip'` 或 `{ resource: { type, id }, action }`；省略时默认为 `'skip'`。声明权限请求时，客户端会在开发环境中加载页面前检查这项权限；没有权限时，页面不会出现在开发导航中，直接访问 URL 也不会加载组件。

## 路由之间不会自动配对

客户端和服务端路由不会因为名称或路径相似而自动配对：

- 客户端页面调用 `/api/orders` 时，需要服务端通过 `defineApiRoutes()` 提供对应接口
- 客户端的 `auth` 不会自动为服务端接口添加认证
- 服务端接口必须在自己的 Hono router 中声明 authentication 和 authorization

## 相关链接

- [页面和菜单](../pages-and-routes) — 声明客户端页面、菜单和访问控制
- [服务端路由](../server-routes) — 编写服务端接口和安全校验
- [界面和样式](../components-and-styling) — 使用组件、主题变量和状态反馈
