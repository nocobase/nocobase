# Router

NocoBase client provides a flexible router manager that supports extending pages and plugin settings pages through `router.add()` and `pluginSettingsRouter.add()`.

## Registered Default Page Routes

| Name           | Path              | Component           | Description |
| -------------- | ----------------- | ------------------- | ----------- |
| admin          | /admin/\*         | AdminLayout         | Admin pages |
| admin.page     | /admin/:name      | AdminDynamicPage    | Dynamically created pages |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Plugin settings pages |

## Regular Page Extension

Add regular page routes via `router.add()`. For page components, use `componentLoader` so the page module is loaded only when the route is actually visited.

Page modules must use `export default`:

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
      // Dynamic import: the page module loads only when this route is entered
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

Supports dynamic parameters

```tsx
this.router.add('root.user', {
  path: '/user/:id',
  element: ({ params }) => <div>User ID: {params.id}</div>
});
```

If a page is heavy or not needed on first paint, prefer `componentLoader`. `element` remains suitable for layout routes or very lightweight inline pages.

## Plugin Settings Page Extension

Add plugin settings pages via `pluginSettingsRouter.add()`. Like regular routes, settings pages should also use `componentLoader`.

```tsx
import { Plugin } from '@nocobase/client';

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Settings page title
      icon: 'ApiOutlined', // Settings page menu icon
      // Dynamic import: the page module loads only when this settings route is entered
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

Multi-level routing example

```tsx
import { Outlet } from 'react-router-dom';

const pluginName = 'hello';

class HelloPlugin extends Plugin {
  async load() {
    // Top-level route
    this.pluginSettingsRouter.add(pluginName, {
      title: 'HelloWorld',
      icon: '',
      element: <Outlet />,
    });

    // Child routes
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      // Dynamic import: the page module loads only when this settings route is entered
      componentLoader: () => import('./settings/Demo1Page'),
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      componentLoader: () => import('./settings/Demo2Page'),
    });
  }
}
```
