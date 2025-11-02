# Plugin

In NocoBase, a **Client Plugin** is the primary way to extend and customize frontend functionality. By inheriting from the `Plugin` base class provided by `@nocobase/client`, developers can register logic, add page components, extend menus, or integrate third-party features at different lifecycle stages.

## Plugin Class Structure

A basic client plugin structure is as follows:

```ts
import { Plugin } from '@nocobase/client';

export class PluginHelloClient extends Plugin {
  async afterAdd() {
    // Executes after the plugin is added
    console.log('Plugin added');
  }

  async beforeLoad() {
    // Executes before the plugin loads
    console.log('Before plugin load');
  }

  async load() {
    // Executes when the plugin loads, registers routes, UI components, etc.
    console.log('Plugin loaded');
  }
}

export default PluginHelloClient;
```

## Lifecycle Description

Each plugin goes through the following lifecycle stages in order every time the browser is refreshed or the application is initialized:

| Lifecycle Method | Execution Time | Description |
|--------------|-----------|------|
| **afterAdd()** | Executes immediately after the plugin is added to the plugin manager | At this point, the plugin instance has been created, but not all plugins have completed initialization. It is suitable for lightweight initialization, such as reading configurations or binding basic events. |
| **beforeLoad()** | Executes before the `load()` method of all plugins | You can access all enabled plugin instances (`this.app.pm.get()`). It is suitable for executing preparatory logic that depends on other plugins. |
| **load()** | Executes when the plugin loads | This method is executed after the `beforeLoad()` of all plugins has completed. It is suitable for registering core logic such as frontend routes and UI components. |

## Execution Order

Each time the browser is refreshed, the execution order is `afterAdd()` → `beforeLoad()` → `load()`

## Plugin Context and FlowEngine

Starting from NocoBase 2.0, the client-side extension APIs are primarily centralized in the **FlowEngine**. In the plugin class, you can get the engine instance via `this.engine`.

```ts
// Access the engine context in the load() method
async load() {
  const { app, router, apiClient } = this.engine.context;
  console.log('Current app:', app);
}
```

For more details, see:
- [FlowEngine](./flow-engine.md)
- [Context](./context.md)