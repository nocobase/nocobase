# Router

NocoBase client provides a flexible router manager that supports extending pages and plugin settings pages through `router.add()` and `pluginSettingsRouter.add()`.

## Registered Default Page Routes

| Name           | Path              | Component           | Description |
| -------------- | ----------------- | ------------------- | ----------- |
| admin          | /admin/\*         | AdminLayout         | Admin pages |
| admin.page     | /admin/:name      | AdminDynamicPage    | Dynamically created pages |
| admin.settings | /admin/settings/\* | AdminSettingsLayout | Plugin settings pages |

## Regular Page Extension

Add regular page routes via router.add().

```tsx
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Application, Plugin } from '@nocobase/client';

const Home = () => <h1>Home</h1>;
const About = () => <h1>About</h1>;

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

    this.router.add('root.home', { path: '/', element: <Home /> });
    this.router.add('root.about', { path: '/about', element: <About /> });
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

## Plugin Settings Page Extension

Add plugin settings pages via pluginSettingsRouter.add().

```tsx
import { Plugin } from '@nocobase/client';
import React from 'react';

const HelloSettingPage = () => <div>Hello Setting page</div>;

export class HelloPlugin extends Plugin {
  async load() {
    this.pluginSettingsRouter.add('hello', {
      title: 'Hello', // Settings page title
      icon: 'ApiOutlined', // Settings page menu icon
      Component: HelloSettingPage,
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
      Component: Outlet,
    });

    // Child routes
    this.pluginSettingsRouter.add(`${pluginName}.demo1`, {
      title: 'Demo1 Page',
      Component: () => <div>Demo1 Page Content</div>,
    });

    this.pluginSettingsRouter.add(`${pluginName}.demo2`, {
      title: 'Demo2 Page',
      Component: () => <div>Demo2 Page Content</div>,
    });
  }
}
```

