# Router 路由

NocoBase 客户端提供了灵活的路由管理器，支持通过 `router.add()` 和 `pluginSettingsRouter.add()` 扩展页面和插件设置页。

## 已注册的默认页面路由

| 名称           | 路径               | 组件                | 说明 |
| -------------- | ------------------ | ------------------- |---------|
| admin          | /admin/\*          | AdminLayout         | 后台管理页面  |
| admin.page     | /admin/:name       | AdminDynamicPage    | 动态创建的页面 |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | 插件配置页面  |

## 常规页面扩展

通过 `router.add()` 添加普通页面路由。对于页面型组件，应使用 `componentLoader` 按需注册，这样页面代码会在真正进入对应路由时才被加载。

其中页面文件必须使用 `export default`：

```tsx
// routes/HomePage.tsx
export default function HomePage() {
  return <h1>Home</h1>;
}
```

```tsx
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Layout = () => (
  <div>
    <div>
      <Link to="/">Home</Link> | <Link to="/about">About</Link>
    </div>
    <Outlet />
  </div>
);

class MyPlugin extends Plugin {
  async load() {
    this.router.add('root', { element: <Layout /> });

    this.router.add('root.home', {
      path: '/',
      // 动态导入，真正进入该路由时才会加载页面模块
      componentLoader: () => import('./routes/HomePage'),
    });

    this.router.add('root.about', {
      path: '/about',
      componentLoader: () => import('./routes/AboutPage'),
    });
  }
}

const app = new Application({
  router: { type: 'memory', initialEntries: ['/'] },
  plugins: [MyPlugin]
});

export default app.getRootComponent();
```

支持动态参数

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

如果页面本身依赖较重、不是首屏必需，建议优先使用 `componentLoader`；`element` 仍适合用于布局组件或非常轻量的内联页面。

## 插件设置页扩展

通过 `pluginSettingsRouter.add()` 添加插件设置页。与普通页面路由类似，设置页也应使用 `componentLoader` 按需注册。

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // 设置页面标题
      icon: 'ApiOutlined', // 设置页面菜单图标
      // 动态导入，真正进入该设置页时才会加载页面模块
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

多级路由示例

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // 顶级路由
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // 子路由
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // 动态导入，真正进入该设置页时才会加载页面模块
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```
