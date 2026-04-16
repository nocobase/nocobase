# Router

NocoBase client provides a flexible router manager that supports extending pages and plugin settings pages through `router.add()` and `pluginSettingsManager`.

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

Register plugin settings pages via `this.pluginSettingsManager`. Registration has two steps — first use `addMenuItem()` to register the menu entry, then use `addPageTabItem()` to register the actual page. Settings pages appear in the NocoBase "Plugin Settings" menu.

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Register menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Ant Design icon name
    });

    // Register page (key 'index' maps to the menu root path)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('Hello Settings'),
      componentLoader: () => import('./settings/HelloSettingPage'),
    });
  }
}
```

### Multi-Tab Settings Page

To add multiple sub-pages under a single menu entry, register multiple `addPageTabItem` calls with the same `menuKey` — tabs will appear automatically:

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Register menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('HelloWorld'),
      icon: 'ApiOutlined',
    });

    // Tab 1: General settings (key 'index' maps to /admin/settings/hello)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'index',
      title: this.t('General'),
      componentLoader: () => import('./settings/GeneralPage'),
    });

    // Tab 2: Advanced settings (maps to /admin/settings/hello/advanced)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'hello',
      key: 'advanced',
      title: this.t('Advanced'),
      componentLoader: () => import('./settings/AdvancedPage'),
    });
  }
}
```
