# Plugin

In NocoBase, **Client Plugin** is the main way to extend and customize frontend functionality. By extending the `Plugin` base class provided by `@nocobase/client`, developers can register logic, add page components, extend menus, or integrate third-party functionality at different lifecycle stages.

## Plugin Class Structure

A basic client-side plugin structure is as follows:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Executed after plugin is added
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Executed before plugin loads
    console.log('Before plugin load');
  }

  async load() {
    // Executed when plugin loads, register routes, UI components, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Lifecycle Description

Each plugin goes through the following lifecycle in sequence when the browser refreshes or the application initializes:

| Lifecycle Method | Execution Timing | Description |
| ---------------- | ---------------- | ----------- |
| **afterAdd()**   | Executed immediately after the plugin is added to the plugin manager | The plugin instance has been created at this point, but not all plugins have finished initializing. Suitable for lightweight initialization, such as reading configuration or binding basic events. |
| **beforeLoad()** | Executed before all plugins' `load()` | Can access all enabled plugin instances (`this.app.pm.get()`). Suitable for preparation logic that depends on other plugins. |
| **load()**       | Executed when the plugin loads | This method is executed after all plugins' `beforeLoad()` completes. Suitable for registering frontend routes, UI components, and other core logic. |

## Execution Order

Every time the browser refreshes, `afterAdd()` → `beforeLoad()` → `load()` will be executed

## Plugin Context and FlowEngine

Starting from NocoBase 2.0, client-side extension APIs are mainly concentrated in **FlowEngine**. In the plugin class, you can get the engine instance through `this.engine`.

```ts
// Access engine context in load() method
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

For more content, see:  
- [FlowEngine](/flow-engine)  
- [Context](./context.md)

