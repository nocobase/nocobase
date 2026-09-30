---
title: '页面和菜单'
description: '在 client/routes.ts 里加一条路由作为菜单入口，接上页面组件，再编写页面内容。'
keywords: 'NocoBase,页面,路由,菜单,导航,访问控制'
---

# 页面和菜单

下面讲解一下，如何添加一个页面。

## 添加一个菜单

首先，需要在 `client/routes.ts` 里加一条路由，通过 `navigation` 配置菜单的名称和图标：

```ts
// client/routes.ts
import { Package } from 'lucide-react';
import {
  defineAppRoutes,
  type AppClientRouteContribution,
} from '@nocobase/app-client/plugins';

const appRoutes: AppClientRouteContribution = defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'Orders', icon: Package },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
]);

const routes: readonly AppClientRouteContribution[] = [appRoutes];

export default routes;
```

`title` 是菜单的名称，`icon` 是菜单图标，值是一个 React 组件。图标可以用 [lucide-react](https://lucide.dev/) 提供的组件，也可以自己写一个 React 组件。

### 菜单分组

菜单分组必须同时声明 `navigation` 和 `children`，且不声明 `componentLoader`。只有 `children` 而没有 `navigation`，不构成菜单分组。普通页面通过 `componentLoader` 加载组件，也可以声明 `children` 来组织子页面。下面是菜单分组的示例：

```ts
// client/routes.ts（节选）
defineAppRoutes([
  {
    name: 'business',
    navigation: { title: 'Business' },
    children: [
      {
        name: 'orders',
        path: '/orders',
        navigation: { title: 'Orders', icon: Package },
        authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
        componentLoader: () => import('./pages/orders.js'),
      },
    ],
  },
]);
```

分组可以带 `path`，作为子页面的路径前缀。比如下面的分组配置了 `path: '/business'`，子页面最终可以通过 `/business/orders` 访问：

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

## 添加页面并编写组件

页面组件就是普通的 React 组件，文件放在 `client/pages/` 下，并使用 default export。界面可以组合 shadcn/ui 组件，样式使用主题变量，以适配浅色和深色主题。组件和样式的具体用法见[界面和样式](./components-and-styling)。

```tsx
// client/pages/orders.tsx
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

export default function OrdersPage(): ReactElement {
  const { t } = useTranslation();

  return (
    <section className='space-y-4 p-6'>
      <h1 className='font-heading text-xl'>{t('orders.title')}</h1>
      <p className='text-sm text-muted-foreground'>{t('orders.description')}</p>
    </section>
  );
}
```

页面中的文字使用翻译 key，需要将对应的翻译添加到 `client/locales/`，见[多语言](./i18n)。如果页面需要请求数据，还要分别处理加载中、无数据和请求失败的状态。

编写路由和页面时，注意以下几点：

- 使用 `componentLoader` 实现惰性加载，只有访问页面时才会加载对应代码。
- import 路径使用 `.js`，即使页面文件的实际扩展名是 `.tsx`。
- `path` 只填写应用内部路径，不要加入部署前缀。比如应用部署在 `/main` 下，路由写 `/orders`，浏览器访问地址就是 `/main/orders`。
- 路由不配置 `navigation` 时，页面仍然可以通过 URL 访问，但不会出现在菜单中，详情页通常采用这种方式。
- 在每条路径的第一个页面上声明 `authz`：`{ resource: { type: 'page', id }, action: 'access' }` 让页面出现在权限配置中并按权限显示，`'skip'` 表示不检查（访客页面常用），`'unrestricted'` 表示只有 root 等拥有无限制权限的身份可以打开。子页面省略 `authz` 时继承最近的上级页面的值，子页面自己声明的值会覆盖继承值。系统不会根据路由名称推断。第一个页面省略 `authz` 不会导致应用无法启动：需要登录的页面默认为 `'unrestricted'`，除 root 外对所有人隐藏；访客页面和可选登录页面默认为 `'skip'`，开发环境会输出警告。建议始终显式声明，详见[路由参考](./reference/routes)。

## 页面目录和子页面

只有自身内容的页面可以使用单个文件。有子页面或专用组件、数据时，改用目录，以 `index.tsx` 作为页面入口。子页面按路由路径组织，专用组件和数据也放在所属页面目录；跨页面共享的组件才放进 `client/components/`。

例如，订单列表和详情页可以组织为：

```text
client/pages/orders/
├── index.tsx       # /orders
├── detail.tsx      # /orders/:orderId
└── shared.tsx      # 订单页面之间共享的组件
```

在路由中声明父子关系：

```ts
// client/routes.ts（节选）
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    navigation: { title: 'orders.title' },
    breadcrumb: { title: 'orders.title' },
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders/index.js'),
    children: [
      {
        name: 'order-detail',
        path: ':orderId',
        breadcrumb: { title: 'orders.detailTitle' },
        authz: 'skip',
        componentLoader: () => import('./pages/orders/detail.js'),
      },
    ],
  },
]);
```

父页面必须手动放置 `<Outlet />`，子页面才会渲染。把它放在 `PageContainer` 的最后：

```tsx
// client/pages/orders/index.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { Link, Outlet } from 'react-router';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';

export default function OrdersPage() {
  const { t } = useTranslation();
  return (
    <PageContainer>
      <PageHeader title={t('orders.title')} />
      {/* 实际列表中的链接使用对应订单 ID。 */}
      <Link to='42'>{t('orders.viewDetail')}</Link>
      <Outlet />
    </PageContainer>
  );
}
```

只有 Tab 这类内容直接返回内容，在 `Outlet` 位置内嵌显示：每个 Tab 声明为子路由，用链接切换，以 URL 决定当前选中项。自带 `PageContainer` 的子页面（详情页、放不进对话框的长表单）要放在 `RouteChildPage` 里；直接返回 `PageContainer` 的话，它会显示在父页面内容的下方，而不是覆盖父页面。

需要覆盖父页面时，由子页面选择展示组件：

| 组件             | 展示方式             | 是否模态 |
| ---------------- | -------------------- | -------- |
| `RouteDialog`    | 居中对话框           | 是       |
| `RouteDrawer`    | 侧边抽屉             | 是       |
| `RouteChildPage` | 覆盖应用内容区的页面 | 否       |

下面的详情页使用 `RouteChildPage`，打开时保留列表页的 DOM 和状态：

```tsx
// client/pages/orders/detail.tsx
import { useTranslation } from '@nocobase/i18n/client';
import { useParams } from 'react-router';
import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
        <PageHeader title={t('orders.detailTitle')} />
        <p>{t('orders.orderNumber', { id: orderId })}</p>
      </PageContainer>
    </RouteChildPage>
  );
}
```

如果详情页还有更深的子路由，把它的 `<Outlet />` 放在 `RouteChildPage` 旁边：更深一层的子页面会像这一层一样覆盖整个内容区。只能渲染在层内的子页面（比如某个 Tab 通过自己的 `Outlet` 打开的子页面）会覆盖整个当前层，不会随这一层的内容滚走。

`RouteChildPage` 不限制焦点在层内，侧栏和页头仍可操作。它没有关闭按钮，也不响应 Escape：用标题上方的 `BackButton` 返回下面的页面，或者使用浏览器的后退。需要显示层级路径时才改用面包屑。被覆盖的前置兄弟元素会临时设为 `inert`，避免操作隐藏内容。顶层页面不需要使用它。

## 面包屑

`navigation` 决定菜单入口，`breadcrumb` 独立决定面包屑标题。上面的列表和详情路由都声明了 `breadcrumb`。需要显示层级路径时，在详情页标题上方用 `<Breadcrumbs />` 代替 `BackButton`，访问 `/orders/42` 时它会显示“订单列表 > 订单详情”。添加示例中的翻译 key 到 `client/locales/`，让标题使用当前语言。

- 匹配到的路由中，只有声明 `breadcrumb` 的条目进入面包屑；至少有两项才显示。
- 前面的页面条目链接到对应路径；没有页面组件的分组显示纯文本，最后一项也不生成链接。
- 动态参数路径可以声明 `breadcrumb`。标题描述页面类型，如“订单详情”；具体订单编号放在页面内容或标题中。
- Tab、对话框和抽屉路由不声明 `breadcrumb`，面包屑停留在它们所属的页面。

面包屑由页面自行放置，通常位于 `PageHeader` 上方，容器和间距也由页面控制。普通业务布局及设置、开发布局提供所需的路由树；当前独立的 guest、optional 页面没有这项上下文，`Breadcrumbs` 不会显示。

### 控制页面的登录要求

在路由上设置 `auth`，可以控制用户需要以哪种登录状态访问页面：

| 值         | 行为                                               |
| ---------- | -------------------------------------------------- |
| `required` | 只有已登录用户可以访问；不设置时默认使用此值。     |
| `guest`    | 仅供未登录用户访问；已登录用户会被跳转离开。       |
| `optional` | 登录前后都可以访问；页面根据登录状态决定显示内容。 |

比如，下面三条路由分别只允许已登录用户、未登录用户和所有用户访问：

```ts
defineAppRoutes([
  {
    name: 'orders',
    path: '/orders',
    auth: 'required',
    authz: { resource: { type: 'page', id: 'orders' }, action: 'access' },
    componentLoader: () => import('./pages/orders.js'),
  },
  {
    name: 'login-help',
    path: '/login-help',
    auth: 'guest',
    authz: 'skip',
    componentLoader: () => import('./pages/login-help.js'),
  },
  {
    name: 'about',
    path: '/about',
    auth: 'optional',
    authz: 'skip',
    componentLoader: () => import('./pages/about.js'),
  },
]);
```

子路由会继承父路由的 `auth`，不能单独设置其他值。`auth` 只在前端生效，用于控制页面导航。

## 相关链接

- [界面和样式](./components-and-styling) — 使用 shadcn/ui 组件和主题变量编写页面
- [多语言](./i18n) — 为页面文案添加翻译
- [服务端路由](./server-routes) — 为页面调用的接口声明服务端路由
- [路由参考](./reference/routes) — 查看客户端和服务端路由的类型与路径规则
- [主题变量](./reference/theme-tokens) — 查看颜色、字体、间距、圆角和阴影等主题变量
