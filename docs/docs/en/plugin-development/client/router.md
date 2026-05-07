---
title: "Router"
description: "NocoBase client routing: this.router.add page route registration, pluginSettingsManager plugin settings page registration (addMenuItem + addPageTabItem)."
keywords: "Router,routing,router.add,pluginSettingsManager,addMenuItem,addPageTabItem,componentLoader,page registration,NocoBase"
---

# Router

In NocoBase, plugins register pages through routes. Two common approaches:

- `this.router.add()` -- Register regular page routes
- `this.pluginSettingsManager.addMenuItem()` + `addPageTabItem()` -- Register plugin settings pages

Route registration is typically done in the plugin's `load()` method. See [Plugin](./plugin) for details.

:::warning Note

For NocoBase v2 plugins, registered routes automatically get a `/v2` prefix. You need to include this prefix when accessing the routes.

:::

## Default Routes

NocoBase has the following default routes registered:

| Name           | Path                  | Component           | Description               |
| -------------- | --------------------- | ------------------- | ------------------------- |
| admin          | /v2/admin/\*          | AdminLayout         | Admin pages               |
| admin.page     | /v2/admin/:name       | AdminDynamicPage    | Dynamically created pages |
| admin.settings | /v2/admin/settings/\* | AdminSettingsLayout | Plugin settings pages     |

## Page Routes

Register page routes via `this.router.add()`. Page components should use `componentLoader` for lazy loading, so page code is only loaded when actually visited.

:::warning Note

Page files must use `export default` to export the component.

:::

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Register in the plugin's `load()`:

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.router.add('hello', {
      path: '/hello',
      // Lazy loading: the module is loaded only when /v2/hello is visited
      componentLoader: () => import('./pages/HelloPage'),
    });
  }
}
```

The first argument of `router.add()` is the route name, which supports dot notation `.` to express parent-child relationships. For example, `root.home` represents a child route of `root`.

In components, you can navigate to a route via `ctx.router.navigate('/hello')`.

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

For more details, see the routing section in [Component](./component/index.md).

### Nested Routes

Implement nesting through dot notation. Parent routes use `<Outlet />` to render child route content:

```tsx
import { Outlet } from 'react-router-dom';

class MyPlugin extends Plugin {
  async load() {
    // Parent route, using element for inline layout
    this.router.add('root', {
      element: (
        <div>
          <nav>Navigation Bar</nav>
          <Outlet />
        </div>
      ),
    });

    // Child route, using componentLoader for lazy loading
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

### Dynamic Parameters

Route paths support dynamic parameters:

```tsx
this.router.add('root.user', {
  path: '/user/:id', // -> /v2/user/:id
  componentLoader: () => import('./pages/UserPage'),
});
```

In components, you can get dynamic parameters via `ctx.route.params`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function UserPage() {
  const ctx = useFlowContext();
  const { id } = ctx.route.params; // Get dynamic parameter id
  return <h1>User ID: {id}</h1>;
}
```

For more details, see the routing section in [Component](./component/index.md).

### componentLoader vs element

- **`componentLoader`** (recommended): Lazy loading, suitable for page components. Page files need `export default`.
- **`element`**: Pass JSX directly, suitable for layout components or very lightweight inline pages.

If the page itself has heavy dependencies, prefer `componentLoader`.

## Plugin Settings Pages

Register plugin settings pages via `this.pluginSettingsManager`. Registration has two steps -- first use `addMenuItem()` to register the menu entry, then use `addPageTabItem()` to register the actual page. Settings pages appear in the NocoBase "Plugin Settings" menu.

![20260403155201](https://static-docs.nocobase.com/20260403155201.png)

```tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class HelloPlugin extends Plugin<any, Application> {
  async load() {
    // Register menu entry
    this.pluginSettingsManager.addMenuItem({
      key: 'hello',
      title: this.t('Hello Settings'),
      icon: 'ApiOutlined', // Ant Design icon name, see https://5x.ant.design/components/icon
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

After registration, the access path is `/admin/settings/hello`. When there is only one page under the menu, the top tab bar is automatically hidden.

### Multi-Tab Settings Page

If the settings page needs multiple sub-pages, register multiple `addPageTabItem` calls with the same `menuKey` -- tabs will appear automatically at the top:

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

### addMenuItem Parameters

| Field      | Type                  | Required | Description                                                  |
| ---------- | --------------------- | -------- | ------------------------------------------------------------ |
| `key`      | `string`              | Yes      | Unique menu identifier, must not contain `.`                 |
| `title`    | `ReactNode`           | No       | Menu title                                                   |
| `icon`     | `string \| ReactNode` | No       | Menu icon, rendered as built-in `Icon` when string           |
| `sort`     | `number`              | No       | Sort value, smaller values appear first, default `0`         |
| `showTabs` | `boolean`             | No       | Whether to show top tab bar, auto-determined by page count by default |
| `hidden`   | `boolean`             | No       | Whether to hide the navigation entry                         |

### addPageTabItem Parameters

| Field             | Type        | Required | Description                                                         |
| ----------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `menuKey`         | `string`    | Yes      | The `key` of the parent menu, corresponding to `addMenuItem`'s `key` |
| `key`             | `string`    | Yes      | Unique page identifier. `'index'` means the default page, mapped to the menu root path |
| `title`           | `ReactNode` | No       | Page title (displayed on the tab)                                   |
| `componentLoader` | `Function`  | No       | Lazy-load page component (recommended)                              |
| `Component`       | `Component` | No       | Pass component directly (choose one of `componentLoader` or this)   |
| `sort`            | `number`    | No       | Sort value, smaller values appear first                             |
| `hidden`          | `boolean`   | No       | Whether to hide in the tab bar                                      |
| `link`            | `string`    | No       | External link; when set, clicking the tab navigates to the external URL |

## Related Links

- [Plugin](./plugin) -- Routes are registered in `load()`
- [Component](./component/index.md) -- How to write page components mounted by routes
- [Plugin Example: Building a Settings Page](./examples/settings-page) -- Complete settings page example
