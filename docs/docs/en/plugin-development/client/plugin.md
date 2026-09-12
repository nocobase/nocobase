---
title: "Plugin - Client Plugin"
description: "NocoBase client plugin entry: inherit from the Plugin base class, afterAdd/beforeLoad/load lifecycle, register routes and FlowModels."
keywords: "Plugin,client plugin,lifecycle,afterAdd,beforeLoad,load,NocoBase"
---

# Plugin

In NocoBase, **Client Plugin** is the main way to extend and customize frontend functionality. You can inherit from the `Plugin` base class provided by `@nocobase/client-v2` in your plugin's `src/client-v2/plugin.tsx` file, then register routes, models, and other resources in lifecycle methods like `load()`.

Most of the time, you only need to focus on `load()` -- typically, core logic is registered during the `load()` phase.

:::tip Prerequisites

Before developing a client plugin, make sure you have read the [Writing Your First Plugin](../write-your-first-plugin.md) section and generated the basic plugin directory structure and files.

:::

## Basic Structure

```ts
// src/client-v2/plugin.tsx
import { Plugin } from '@nocobase/client-v2';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Executed after plugin is added
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Executed before all plugins' load()
    console.log('Before load');
  }

  async load() {
    // Executed when plugin loads, register routes, models, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Lifecycle

Each time the browser refreshes or the application initializes, plugins execute `afterAdd()` -> `beforeLoad()` -> `load()` in sequence:

| Method         | Execution Timing                    | Description                                                                               |
| -------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `afterAdd()`   | After plugin instance is created    | Not all plugins have finished initializing at this point. Suitable for lightweight initialization, such as reading configuration. |
| `beforeLoad()` | Before all plugins' `load()`        | Can access other enabled plugin instances via `this.app.pm.get()`. Suitable for handling inter-plugin dependencies. |
| `load()`       | After all `beforeLoad()` completes  | **The most commonly used lifecycle.** Register routes, FlowModels, and other core resources here. |

Typically, developing a client plugin only requires writing `load()`.

## What to Do in load()

`load()` is the core entry point for registering plugin functionality. Common operations:

**Register page routes:**

```ts
async load() {
  // Register a standalone page
  this.router.add('hello', {
    path: '/hello',
    componentLoader: () => import('./pages/HelloPage'),
  });

  // Register a plugin settings page (menu + page)
  this.pluginSettingsManager.addMenuItem({
    key: 'hello-settings',
    title: this.t('Hello Settings'),
    icon: 'SettingOutlined',
  });
  this.pluginSettingsManager.addPageTabItem({
    menuKey: 'hello-settings',
    key: 'index',
    title: this.t('Hello Settings'),
    componentLoader: () => import('./pages/HelloSettingPage'),
  });
}
```

For detailed usage, see [Router](./router).

**Register FlowModels:**

```ts
async load() {
  this.flowEngine.registerModelLoaders({
    HelloModel: {
      // Dynamic import: the module is loaded only when the model is first used
      loader: () => import('./HelloModel'),
    },
  });
}
```

`registerModelLoaders` uses lazy loading (dynamic imports), loading the corresponding module only when the model is first used. This is the recommended registration method. For detailed usage, see [FlowEngine](./flow-engine/index.md).

## Common Plugin Properties

Within the plugin class, the following properties can be accessed directly via `this`:

| Property                     | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `this.router`                | Route manager for registering page routes                        |
| `this.pluginSettingsManager` | Plugin settings page manager (`addMenuItem` + `addPageTabItem`)  |
| `this.flowEngine`            | FlowEngine instance for registering FlowModels                   |
| `this.engine`                | Alias for `this.flowEngine`                                      |
| `this.context`               | Context object, same object returned by `useFlowContext()` in components |
| `this.app`                   | Application instance                                             |
| `this.app.eventBus`          | Application-level event bus (`EventTarget`) for listening to lifecycle events |

If you need to access more NocoBase capabilities (such as `api`, `t` (i18n), `logger`), you can get them through `this.context`:

```ts
async load() {
  const { api, t, logger } = this.context;
}
```

For more context capabilities, see [Context](./ctx/index.md).

## Related Links

- [Router](./router) -- Register page routes and plugin settings pages
- [Component](./component/index.md) -- How to write React components mounted by routes
- [Context](./ctx/index.md) -- Use NocoBase built-in capabilities through context
- [FlowEngine](./flow-engine/index.md) -- Register blocks, fields, actions, and other visually configurable components
- [Writing Your First Plugin](../write-your-first-plugin.md) -- Create a plugin from scratch
