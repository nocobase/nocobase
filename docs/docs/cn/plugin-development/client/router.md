---
title: "Router 路由"
description: "NocoBase 客户端路由：this.router.add、this.pluginSettingsRouter.add、页面路由注册、插件设置页注册。"
keywords: "Router,路由,router.add,pluginSettingsRouter,componentLoader,页面注册,NocoBase"
---

# Router 路由

在 NocoBase 中，插件通过路由来注册页面。两种常用方式：

- `this.router.add()` — 注册普通页面路由
- `this.pluginSettingsRouter.add()` — 注册插件配置页

路由的注册通常在插件的 `load()` 方法中完成，详见 [Plugin 插件](./plugin)。

:::warning 注意

NocoBase v2 的插件，路由注册后会默认加上 `/v2` 前缀，访问时需要带上这个前缀。

:::

## 默认路由

NocoBase 已经注册了以下默认路由：

| 名称           | 路径                  | 组件                | 说明           |
| -------------- | --------------------- | ------------------- | -------------- |
| admin          | /v2/admin/\*          | AdminLayout         | 后台管理页面   |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | 动态创建的页面 |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | 插件配置页面   |

## 页面路由

通过 `this.router.add()` 注册页面路由。页面组件建议使用 `componentLoader` 按需加载，这样页面代码会在真正访问时才被加载。

:::warning 注意

页面文件必须使用 `export default` 导出组件。

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

在插件 `load()` 中注册：

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // 按需加载，访问 /v2/hello 时才加载该模块
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

`router.add()` 的第一个参数是路由名称，支持用点号 `.` 表示父子关系。比如 `root.home` 表示 `root` 的子路由。

在组件中，可以通过 `ctx.router.navigate('/hello')` 来导航到这个路由。

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { Button } from 'antd';

export default function SomeComponent() {
  const ctx = useFlowContext();
  return (
    <Button onClick={() => ctx.router.navigate('/hello')}>
      Go to Hello Page
    </Button>
  );
}
```

详情可以参考 [Component 组件开发](./component/index.md) 中的路由部分。

### 嵌套路由

通过点号命名实现嵌套，父级路由使用 `<Outlet />` 渲染子路由内容：

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // 父级路由，用 element 直接写布局
    this.router.add('root', {
      element: (
        <div>
          <nav>导航栏</nav>
          <Outlet />
        </div>
      ),
    });

    // 子路由，用 componentLoader 按需加载
    this.router.add('root.home', {
      path: '/', // -> /v2/
      componentLoader: () => import('./pages/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about', // -> /v2/about
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}
```

### 动态参数

路由路径支持动态参数：

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

在组件中，可以通过 `ctx.route.params` 获取动态参数：

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // 获取动态参数 id
  return <h1>User ID: {id}</h1>;
}
```

详情可以参考 [Component 组件开发](./component/index.md) 中的路由部分。

### componentLoader vs element

- **`componentLoader`**（推荐）：按需加载，适合页面组件，页面文件需要 `export default`
- **`element`**：直接传入 JSX，适合布局组件或非常轻量的内联页面

如果页面本身依赖较重，建议优先使用 `componentLoader`。

## 插件设置页

通过 `this.pluginSettingsRouter.add()` 注册插件设置页。设置页会出现在 NocoBase 的「插件配置」菜单中。

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello 设置',
      icon: 'ApiOutlined', // Ant Design 图标名称，可以参考 https://5x.ant.design/components/icon
      // 按需加载设置页
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

### 多级设置页

如果设置页需要多个子页面，可以用点号命名注册子路由：

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // 顶级路由，用 Outlet 渲染子页面
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: 'ApiOutlined',
      element: <Outlet />,
    });

    // 子路由
    this.pluginSettingsRouter.add(`${pluginName}.general`, {
      title: '基础设置',
      componentLoader: () => import('./settings/GeneralPage'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.advanced`, {
      title: '高级设置',
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```

## 相关链接

- [Plugin 插件](./plugin) — 路由在 `load()` 中注册
- [Component 组件开发](./component/index.md) — 路由挂载的页面组件怎么写
- [插件实战示例：做一个插件设置页](./examples/settings-page) — 完整的设置页示例
