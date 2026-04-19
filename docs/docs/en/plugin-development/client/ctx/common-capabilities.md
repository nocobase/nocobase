---
title: "Common Capabilities"
description: "NocoBase client context common capabilities: ctx.api requests, ctx.t internationalization, ctx.logger logging, ctx.router routing, ctx.viewer view management, ctx.acl access control."
keywords: "ctx.api,ctx.t,ctx.i18n,ctx.logger,ctx.router,ctx.route,ctx.viewer,ctx.acl,NocoBase"
---

# Common Capabilities

The context object provides various built-in capabilities of NocoBase. However, some capabilities are only available in Plugins, some only in components, and some are available in both but with different syntax. Here is an overview:

| Capability    | Plugin (`this.xxx`)           | Component (`ctx.xxx`)        | Description                                  |
| ------------- | ----------------------------- | ---------------------------- | -------------------------------------------- |
| API Requests  | `this.context.api`            | `ctx.api`                    | Same usage                                   |
| i18n          | `this.t()` / `this.context.t` | `ctx.t`                      | `this.t()` auto-injects plugin namespace     |
| Logging       | `this.context.logger`         | `ctx.logger`                 | Same usage                                   |
| Route Registration | `this.router.add()`      | -                            | Plugin only                                  |
| Page Navigation    | -                        | `ctx.router.navigate()`      | Component only                               |
| Route Info    | `this.context.location`       | `ctx.route` / `ctx.location` | Recommended to use in components             |
| View Management | `this.context.viewer`       | `ctx.viewer`                 | Open dialogs / drawers, etc.                 |
| FlowEngine   | `this.flowEngine`             | -                            | Plugin only                                  |

The following sections describe each capability by namespace.

## API Requests (ctx.api)

Use `ctx.api.request()` to call backend APIs, with the same usage as [Axios](https://axios-http.com/).

### Usage in Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Send requests directly in load()
    const response = await this.context.api.request({
      url: 'app:getInfo',
      method: 'get',
    });
    console.log('App info', response.data);
  }
}
```

### Usage in Components

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    // GET request
    const response = await ctx.api.request({
      url: 'users:list',
      method: 'get',
    });
    console.log(response.data);

    // POST request
    await ctx.api.request({
      url: 'users:create',
      method: 'post',
      data: { name: 'Tao Tao' },
    });
  };

  return <button onClick={handleLoad}>Load Data</button>;
}
```

### With ahooks useRequest

In components, you can use [ahooks](https://ahooks.js.org/hooks/use-request/index)' `useRequest` to simplify request state management:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';

export default function PostList() {
  const ctx = useFlowContext();

  const { data, loading, error, refresh } = useRequest(() =>
    ctx.api.request({
      url: 'posts:list',
      method: 'get',
    }),
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Request error: {error.message}</div>;

  return (
    <div>
      <button onClick={refresh}>Refresh</button>
      <pre>{JSON.stringify(data?.data, null, 2)}</pre>
    </div>
  );
}
```

### Request Interceptors

You can add request/response interceptors via `ctx.api.axios`, typically set up in a Plugin's `load()`:

```ts
async load() {
  // Request interceptor: add custom headers
  this.context.api.axios.interceptors.request.use((config) => {
    config.headers['X-Custom-Header'] = 'my-value';
    return config;
  });

  // Response interceptor: unified error handling
  this.context.api.axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Request error', error);
      return Promise.reject(error);
    },
  );
}
```

### NocoBase Custom Request Headers

NocoBase Server supports the following custom request headers, which are usually auto-injected by interceptors and don't need to be set manually:

| Header            | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `X-App`           | Specifies the current app in multi-app scenarios     |
| `X-Locale`        | Current language (e.g., `zh-CN`, `en-US`)            |
| `X-Hostname`      | Client hostname                                      |
| `X-Timezone`      | Client timezone (e.g., `+08:00`)                     |
| `X-Role`          | Current role                                         |
| `X-Authenticator` | Current user authentication method                   |

## Internationalization (ctx.t / ctx.i18n)

NocoBase plugins manage multilingual files through the `src/locale/` directory and use `ctx.t()` for translations in code.

### Multilingual Files

Create JSON files by language under the plugin's `src/locale/`:

```bash
plugin-hello/
└── src/
    └── locale/
        ├── zh-CN.json
        └── en-US.json
```

```json
// zh-CN.json
{
  "Hello": "你好",
  "Your name is {{name}}": "你的名字是 {{name}}"
}
```

```json
// en-US.json
{
  "Hello": "Hello",
  "Your name is {{name}}": "Your name is {{name}}"
}
```

:::warning Note

Adding language files for the first time requires restarting the application to take effect.

:::

### ctx.t()

Use `ctx.t()` to get translated text in components:

```tsx
const ctx = useFlowContext();

// Basic usage
ctx.t('Hello');

// With variables
ctx.t('Your name is {{name}}', { name: 'NocoBase' });

// Specify namespace (default namespace is the plugin's package name)
ctx.t('Hello', { ns: '@my-project/plugin-hello' });
```

### this.t()

Using `this.t()` in a Plugin is more convenient -- it **automatically injects the plugin's package name as the namespace**, so you don't need to pass `ns` manually:

```ts
class MyPlugin extends Plugin {
  async load() {
    // Automatically uses the current plugin's package name as ns
    console.log(this.t('Hello'));

    // Equivalent to
    console.log(this.context.t('Hello', { ns: '@my-project/plugin-hello' }));
  }
}
```

### ctx.i18n

`ctx.i18n` is the underlying [i18next](https://www.i18next.com/) instance. Generally, using `ctx.t()` directly is sufficient. However, if you need to dynamically switch languages, listen for language changes, etc., you can use `ctx.i18n`:

```ts
// Get the current language
const currentLang = ctx.i18n.language; // 'zh-CN'

// Listen for language changes
ctx.i18n.on('languageChanged', (lng) => {
  console.log('Language switched to', lng);
});
```

### tExpr()

`tExpr()` is used to generate deferred translation expression strings, typically used in `FlowModel.define()` -- because define is executed at module load time, when the i18n instance is not yet available:

```ts
import { tExpr } from '@nocobase/flow-engine';

HelloBlockModel.define({
  label: tExpr('Hello block'), // Generates '{{t("Hello block")}}', translated at runtime
});
```

For more complete internationalization usage (translation file conventions, useT hook, tExpr, etc.), see [i18n Internationalization](../component/i18n). For the complete list of language codes supported by NocoBase, see [Language List](../../languages).

## Logging (ctx.logger)

Output structured logs via `ctx.logger`, based on [pino](https://github.com/pinojs/pino).

### Usage in Plugin

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    this.context.logger.info('Plugin loaded', { plugin: 'my-plugin' });
    this.context.logger.error('Initialization failed', { error });
  }
}
```

### Usage in Components

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleLoad = async () => {
    ctx.logger.info('Page loaded', { page: 'UserList' });
    ctx.logger.debug('Current user state', { user });
  };

  // ...
}
```

Log levels from highest to lowest: `fatal` > `error` > `warn` > `info` > `debug` > `trace`. Only logs at or above the currently configured level will be output.

## Routing (ctx.router / ctx.route / ctx.location)

Routing capabilities are divided into three parts: registration (Plugin only), navigation, and information retrieval (component only).

### Route Registration (this.router / this.pluginSettingsManager)

Register page routes in a Plugin's `load()` via `this.router.add()`, and register plugin settings pages via `this.pluginSettingsManager`:

```ts
async load() {
  // Register a regular page route
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Register a plugin settings page (appears in the "Plugin Settings" menu)
  this.pluginSettingsManager.addMenuItem({
    key: 'my-settings',
    title: this.t('My Settings'),
    icon: 'SettingOutlined', // Ant Design icon, see https://5x.ant.design/components/icon
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'my-settings',
    key: 'index',
    title: this.t('My Settings'),
    componentLoader: () => import('./pages/MySettingsPage'),
  });
}
```

For detailed usage, see [Router](../router). For a complete settings page example, see [Building a Plugin Settings Page](../examples/settings-page).

:::warning Note

`this.router` is a RouterManager used for **registering routes**. `this.pluginSettingsManager` is a PluginSettingsManager used for **registering settings pages**. These are not the same as `ctx.router` (React Router, used for **page navigation**) in components.

:::

### Page Navigation (ctx.router)

Navigate between pages in components via `ctx.router.navigate()`:

```tsx
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

### Route Information (ctx.route)

Get current route information in components via `ctx.route`:

```tsx
const ctx = useFlowContext();

// Get dynamic parameters (e.g., route defined as /users/:id)
const { id } = ctx.route.params;

// Get route name
const { name } = ctx.route;
```

Full type of `ctx.route`:

```ts
interface RouteOptions {
  name?: string;         // Route unique identifier
  path?: string;         // Route template
  pathname?: string;     // Full path of the route
  params?: Record<string, any>; // Route parameters
}
```

### Current URL (ctx.location)

`ctx.location` provides detailed information about the current URL, similar to the browser's `window.location`:

```tsx
const ctx = useFlowContext();

console.log(ctx.location.pathname); // '/v2/hello'
console.log(ctx.location.search);   // '?page=1'
console.log(ctx.location.hash);     // '#section'
```

Although `ctx.route` and `ctx.location` can also be accessed through `this.context` in a Plugin, the URL during plugin loading is indeterminate, so the retrieved values are meaningless. It's recommended to use them in components.

## View Management (ctx.viewer / ctx.view)

`ctx.viewer` provides imperative capabilities to open dialogs, drawers, and other views. It can be used in both Plugins and components.

### Usage in Plugin

```tsx
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // For example, open a dialog during some initialization logic
    this.context.viewer.dialog({
      title: 'Welcome',
      content: () => <div>Plugin initialization complete</div>,
    });
  }
}
```

### Usage in Components

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const openDetail = () => {
    // Open a dialog
    ctx.viewer.dialog({
      title: 'Edit User',
      content: () => <UserEditForm />,
    });
  };

  const openDrawer = () => {
    // Open a drawer
    ctx.viewer.drawer({
      title: 'Details',
      content: () => <UserDetail />,
    });
  };

  return (
    <div>
      <Button onClick={openDetail}>Edit</Button>
      <Button onClick={openDrawer}>View Details</Button>
    </div>
  );
}
```

### Common Methods

```tsx
// Specify view type via type
ctx.viewer.open({
  type: 'dialog',  // 'dialog' | 'drawer' | 'popover' | 'embed'
  title: 'Title',
  content: () => <SomeComponent />,
});
```

### Operating Within Views (ctx.view)

Inside dialog/drawer components, you can use `ctx.view` to operate on the current view (e.g., close it):

```tsx
import { Button } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';

function DialogContent() {
  const ctx = useFlowContext();
  return (
    <div>
      <p>Dialog content</p>
      <Button onClick={() => ctx.view.close()}>Close</Button>
    </div>
  );
}
```

## FlowEngine (this.flowEngine)

`this.flowEngine` is the FlowEngine instance, only available in Plugins. It's typically used to register FlowModels:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Register FlowModel (recommended lazy-loading pattern)
    this.flowEngine.registerModelLoaders({
      HelloBlockModel: {
        loader: () => import('./models/HelloBlockModel'),
      },
    });
  }
}
```

FlowModel is the core of NocoBase's visual configuration system -- if your component needs to appear in the "Add Block / Field / Action" menus, you need to wrap it with a FlowModel. For detailed usage, see [FlowEngine](../flow-engine/index.md).

## More Capabilities

The following capabilities may be useful in more advanced scenarios. Here is a brief list:

| Property                | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `ctx.model`             | Current FlowModel instance (available in Flow execution context) |
| `ctx.ref`               | Component reference, used with `ctx.onRefReady`                  |
| `ctx.exit()`            | Exit the current Flow execution                                  |
| `ctx.defineProperty()`  | Dynamically add custom properties to the context                 |
| `ctx.defineMethod()`    | Dynamically add custom methods to the context                    |
| `ctx.useResource()`     | Get data resource operation interface                            |
| `ctx.dataSourceManager` | Data source management                                          |

For detailed usage of these capabilities, refer to the [FlowEngine Complete Documentation](../../../flow-engine/index.md).

## Related Links

- [Context Overview](../ctx/index.md) -- Differences between the two context entry points
- [Plugin](../plugin) -- Plugin shorthand properties
- [Component Development](../component/index.md) -- useFlowContext usage in components
- [Router](../router) -- Route registration and navigation
- [FlowEngine Complete Documentation](../../../flow-engine/index.md) -- Complete FlowEngine reference
- [i18n Internationalization](../component/i18n) -- Translation file conventions, tExpr, useT
- [Language List](../../languages) -- Language codes supported by NocoBase
- [Building a Plugin Settings Page](../examples/settings-page) -- Complete usage example of ctx.api
- [FlowEngine Overview](../flow-engine/index.md) -- FlowModel basic usage
