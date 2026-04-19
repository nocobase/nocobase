---
title: "Context"
description: "NocoBase client context mechanism: this.context in Plugins and useFlowContext() in components refer to the same object, but with different access entry points."
keywords: "Context,useFlowContext,this.context,FlowEngineContext,NocoBase"
---

# Context

In NocoBase, **Context** is the bridge connecting plugin code to NocoBase capabilities. Through the context, you can make requests, handle internationalization, write logs, navigate pages, and more.

There are two access entry points for the context:

- **In Plugins**: `this.context`
- **In React components**: `useFlowContext()` (imported from `@nocobase/flow-engine`)

Both return the **same object** (a `FlowEngineContext` instance), just used in different scenarios.

## Usage in Plugins

In a plugin's lifecycle methods such as `load()`, access the context via `this.context`:

```ts
import { Plugin } from '@nocobase/client-v2';

class MyPlugin extends Plugin {
  async load() {
    // Access context capabilities via this.context
    const { api, logger } = this.context;

    const response = await api.request({ url: 'app:getInfo' });
    logger.info('App info', response.data);

    // Internationalization: this.t() auto-injects the plugin package name as namespace
    console.log(this.t('Hello'));
  }
}
```

## Usage in Components

In React components, get the same context object via `useFlowContext()`:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();

  const handleClick = async () => {
    const response = await ctx.api.request({ url: 'users:list', method: 'get' });
    console.log(response.data);
  };

  return <button onClick={handleClick}>{ctx.t('Load data')}</button>;
}
```

## Plugin Shorthand Properties vs ctx Properties

The Plugin class provides some shorthand properties for convenient use in `load()`. However, note that **some Plugin class shorthand properties and ctx properties with the same name point to different things**:

| Plugin Shorthand Property   | Points To              | Purpose                                           |
| --------------------------- | ---------------------- | ------------------------------------------------- |
| `this.router`               | RouterManager          | Register routes, using `.add()`                   |
| `this.pluginSettingsManager` | PluginSettingsManager | Register plugin settings pages (`addMenuItem` + `addPageTabItem`) |
| `this.flowEngine`           | FlowEngine instance    | Register FlowModels                               |
| `this.t()`                  | i18n.t() + auto ns     | Internationalization, auto-injects plugin package name |
| `this.context`              | FlowEngineContext      | Context object, same as useFlowContext()           |

The most commonly confused pair is `this.router` and `ctx.router`:

- **`this.router`** (Plugin shorthand property) -> RouterManager, used to **register routes** (`.add()`)
- **`ctx.router`** (context property) -> React Router instance, used for **page navigation** (`.navigate()`)

```ts
// In Plugin: register routes
async load() {
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });
}
```

```tsx
// In component: page navigation
const ctx = useFlowContext();
ctx.router.navigate('/hello'); // -> /v2/hello
```

## Common Capabilities Provided by Context

Here is a list of common context capabilities. Note that some are only available in Plugins, some only in components, and some in both but with different syntax.

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

For detailed usage and code examples of each capability, see [Common Capabilities](./common-capabilities).

## Related Links

- [Common Capabilities](./common-capabilities) -- Detailed usage of ctx.api, ctx.t, ctx.logger, etc.
- [Plugin](../plugin) -- Plugin entry point and shorthand properties
- [Component Development](../component/index.md) -- Basic usage of useFlowContext in components
